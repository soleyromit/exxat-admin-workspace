'use client'

// COMPARE VARIANT E — "Real DataTable" (throwaway; delete once a direction is
// picked, same lifecycle as /compare/push-survey-design).
//
// Thesis: every prior Step 2 attempt (A, B, C, and the shipped step) hand-rolled
// div-based rows. This variant leans fully into the governed DataTable
// (components/data-table) instead: its select column + floating bulk bar carry
// course exclusion, its native sorting/filtering come free (sort by Coverage
// surfaces blocked courses first; a Coverage select-filter isolates them), and
// per-course detail rides an expand toggle that injects indented detail rows
// into the same table. DataTable has NO built-in row-expansion mechanism —
// the injected-rows approach is the documented fallback: detail rows share
// every sortable/filterable scalar with their parent course, so the hook's
// stable sort and filters always keep them glued directly beneath it.
//
// ST-02 completeness pass (2026-08-03 audit follow-up) — this variant now runs
// the FULL step contract, not just the layout thesis:
//   · Per-COURSE Continue gate (no template / role-overlap conflict / faculty-
//     only template with zero staffed / every unit deselected) — no global-sum
//     masking; each state is its own sortable/filterable Coverage value.
//   · Type-scoped template defaults + type-FILTERED picker with a "Default"
//     badge and the exact "No templates for this course type" copy. Tie-break
//     for 2+ type matches follows implementation-plan decision #2 (production
//     parity): isDefaultForType wins, else first type match.
//   · Template change / course exclusion wipe that course's unit selections
//     and assignment override — re-including never restores prior state.
//   · Auto Update flag (one ToggleSwitch, toolbar) + manual Refresh, applied
//     through reconcileUnitsOnRefresh over a SYNCED Prism snapshot: demo
//     mutations pend until Refresh, so Refresh is the only re-sync trigger.
//   · Preview Survey per row via SurveyPreviewDialog (disabled + "Assign a
//     template to preview" until a template is assigned).
//   · In-step "New template" sub-view reusing CreateBlankTemplate +
//     TemplateEditor (embedded), mirroring step-survey-instances.tsx; the
//     table's assignment state persists across the swap.
//   · Reset to defaults with an itemized AlertDialog confirmation.
//   · Save as draft / resume via sessionStorage, with templateCriteria()
//     snapshots at save time; resume raises drift (info) and archived
//     (warning + row unassigned + block) notices.
//   · A clearly-separated "Simulate PRISM changes (demo only)" panel drives
//     the Refresh and draft-drift paths against real state mutations.
//
// Settled severity vocabulary (same as siblings): amber (--chip-4) strictly =
// missing data (soft, never blocks); destructive (--chip-destructive) +
// fa-lock = hard block. The two must never look identical.

import { useEffect, useMemo, useState } from 'react'
import {
  Button, Checkbox, CheckboxLabel, Badge, Tip, LocalBanner, ToggleSwitch,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@exxatdesignux/ui'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import { useTableState } from '@/components/data-table/use-table-state'
import { StoryStatusBadgeOS } from '@/components/pce/pce-badges'
import { usePce } from '@/components/pce/pce-state'
import { TypePill, AddInPrismButton } from '@/components/pce/courses-evaluatees/scope-controls'
import { CreateBlankTemplate } from '@/components/pce/create-blank-template'
import { TemplateEditor } from '@/components/pce/template-editor'
import { SurveyPreviewDialog } from '@/components/pce/distribute-wizard/survey-preview-dialog'
import {
  MOCK_COURSE_OFFERINGS, MOCK_PROGRAM_TERMS, COURSE_TYPE_FULL_LABEL, deliveryModeOf,
  type CourseOffering, type PceSurvey, type PceTemplate,
} from '@/lib/pce-mock-data'
import { courseLabelOf, templateCriteria, CRITERION_TOGGLE_LABEL } from '@/lib/pce-course-readiness'
import {
  expandInstances, storyStatusOf, templateStoryStatusOf, reconcileUnitsOnRefresh,
  type SurveyInstance, type UnitSelectionMap,
} from '@/lib/pce-push-validation'

// ── Demo-only conflict seed ──────────────────────────────────────────────────
// DPT-510 (co13) only carries Scheduled fixtures, which ST-02 exempts. This
// LOCAL Live instructor-scope survey makes its Instructor coverage a hard
// block without touching pce-mock-data.ts.
const CONFLICT_DEMO_SURVEY: PceSurvey = {
  id: 'demo-live-co13-instructor-e',
  offeringId: 'co13',
  evalScope: 'instructor',
  evalRole: 'instructor',
  courseCode: 'DPT-510',
  courseName: 'Musculoskeletal Physical Therapy I',
  term: 'Fall 2026',
  cohort: 'Year 2 – Section A',
  courseType: 'didactic',
  templateId: 'tmpl2',
  status: 'active',
  instructors: [],
  responseRate: 32,
  responseCount: 14,
  enrollmentCount: 44,
  deadline: 'Dec 18, 2026',
  createdAt: 'Jul 15, 2026',
  createdBy: 'Dr. Anita Patel',
  surveyType: 'course_evaluation',
  openDate: '2026-11-20',
  academicYear: '2026–2027',
  programId: 'prog1',
}

// ── Draft persistence (ST-02 Save as draft / resume) ─────────────────────────
// sessionStorage-backed for this self-contained compare page — the production
// step persists through pce-state's saveDraft instead. Shape mirrors what the
// production wizard snapshots per offering (SaveWizardDraftInput), plus the
// demo-only archived-template list the simulate buttons write.
interface VariantEDraft {
  savedAt: string
  /** EFFECTIVE template per offering at save time ('' = none assigned). */
  assignments: Record<string, string>
  unitSelections: UnitSelectionMap
  autoUpdateOn: boolean
  excluded: string[]
  /** templateCriteria() snapshot per offering with an assigned template. */
  snapshots: Record<string, { templateId: string; criteria: string[] }>
  /** Demo-only: template ids the simulate button marks as archived-since-save. */
  demoArchivedTemplateIds: string[]
}

const DRAFT_KEY = 'pce-compare-variant-e-step2-draft'

function readDraft(): VariantEDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    return raw ? (JSON.parse(raw) as VariantEDraft) : null
  } catch {
    return null
  }
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

/** One Draft-resume finding about a course's saved template. */
interface DraftNotice {
  offeringId: string
  code: string
  templateName: string
  kind: 'updated' | 'unpublished'
  addedRoleLabels: string[]
  removedRoleLabels: string[]
}

const criterionLabel = (c: string): string =>
  c === 'students' ? 'Course material' : ((CRITERION_TOGGLE_LABEL as Record<string, string>)[c] ?? c)

/** Drop every unit-selection entry belonging to the given offerings. Keys are
 *  `offeringId|…` (SurveyInstance.key), so the prefix up to the first pipe IS
 *  the offering id. Used by the template-change reset, course exclusion, and
 *  the archived-template resume path — "no prior selection carries forward". */
function withoutOfferings(map: UnitSelectionMap, offeringIds: ReadonlySet<string>): UnitSelectionMap {
  const next: UnitSelectionMap = {}
  for (const [k, v] of Object.entries(map)) {
    if (!offeringIds.has(k.slice(0, k.indexOf('|')))) next[k] = v
  }
  return next
}

/** code + name split; catalog-less fixture ids fall back to the raw id as the code. */
function splitLabel(o: CourseOffering): { code: string; name: string } {
  const label = courseLabelOf(o)
  if (!label.includes(' – ')) return { code: label, name: '' }
  const [code, ...rest] = label.split(' – ')
  return { code, name: rest.join(' – ') }
}

const unitTitle = (i: SurveyInstance) => (i.scope === 'course' ? 'Course material' : i.roleLabel)

// The course the Prism simulate buttons mutate (Year 1 – Section A, didactic:
// has both an instructor and a coordinator at baseline, no baseline conflict).
const DEMO_OFFERING_ID = 'co9'
// Existing fixture faculty id not staffed on co9 — the "late-added
// co-instructor" the add simulation appends (UC2).
const DEMO_CO_INSTRUCTOR_ID = 'f6'

// ── Coverage vocabulary — every ST-02 course state, sortable + filterable ────
type Coverage = 'blocked' | 'unstaffed' | 'deselected' | 'unassigned' | 'gap' | 'ready' | 'excluded'

const COVERAGE_RANK: Record<Coverage, number> = {
  blocked: 0, unstaffed: 1, deselected: 2, unassigned: 3, gap: 4, ready: 5, excluded: 6,
}

/** Per-course hard-block reason (null = does not block Continue). */
type CourseBlock = 'no-template' | 'conflict' | 'unstaffed' | 'all-deselected' | null

// ── Row model ────────────────────────────────────────────────────────────────
// One flat row type for both grains. The scalar fields the table sorts,
// searches, and filters on (course / type / people / template / coverage) are
// IDENTICAL on a detail row and its parent course row, and detail rows sit
// directly after their parent in the source array — the hook's
// Array.prototype.sort is stable, so equal keys preserve insertion order and
// detail rows never detach from their course under any sort direction or
// filter.
interface Step2Row extends Record<string, unknown> {
  id: string
  kind: 'course' | 'detail'
  /** "DPT-510 Musculoskeletal Physical Therapy I" — sort, search, text filter. */
  course: string
  type: string
  /** Staffed person names joined — the Assigned column's sort/search scalar. */
  people: string
  template: string
  coverage: Coverage
  coverageRank: number
  // Course-row payload (null/empty on detail rows)
  offering: CourseOffering | null
  code: string
  name: string
  assigned: PceTemplate | null
  gapCount: number
  gapHref: string | null
  gapRoles: string[]
  peopleNames: string[]
  hasRoleUnits: boolean
  hasUnits: boolean
  // Detail-row payload (null on course rows)
  instance: SurveyInstance | null
}

interface CourseModel {
  offering: CourseOffering
  code: string
  name: string
  template: PceTemplate | null
  instances: SurveyInstance[]
  gaps: SurveyInstance[]
  selectable: SurveyInstance[]
  conflicted: boolean
}

// ═════════════════════════════════════════════════════════════════════════════

export default function VariantERealDataTable() {
  const { templates, surveys } = usePce()

  const publishedTemplates = useMemo(
    () => templates.filter(t =>
      t.status === 'active' && !t.archived && (!t.surveyType || t.surveyType === 'course_evaluation')),
    [templates],
  )
  const byTemplateId = useMemo(() => new Map(publishedTemplates.map(t => [t.id, t])), [publishedTemplates])

  // ── Prism snapshot model — demo mutations pend until Refresh ───────────────
  // `prismLive` is what Prism "currently holds" (the demo buttons write here);
  // `prismSynced` is the snapshot this screen renders from. Refresh — the ONLY
  // re-sync trigger (ST-02) — copies live onto synced and reconciles the unit
  // map, so mid-session Prism changes never leak into the table on their own.
  const [prismLive, setPrismLive] = useState<Record<string, Partial<CourseOffering>>>({})
  const [prismSynced, setPrismSynced] = useState<Record<string, Partial<CourseOffering>>>({})

  const term = MOCK_PROGRAM_TERMS.find(t => t.id === 'pt5')!
  const baseCourses = useMemo(
    () =>
      MOCK_COURSE_OFFERINGS
        .filter(o => o.termId === term.id && o.status !== 'archived')
        .sort((a, b) => courseLabelOf(a).localeCompare(courseLabelOf(b), undefined, { numeric: true })),
    [term.id],
  )
  const courses = useMemo(
    () => baseCourses.map(o => (prismSynced[o.id] ? { ...o, ...prismSynced[o.id] } : o)),
    [baseCourses, prismSynced],
  )

  const surveysWithDemo = useMemo(() => [...surveys, CONFLICT_DEMO_SURVEY], [surveys])

  // ── Type defaults (ST-02 auto-assign — strictly per course TYPE) ───────────
  // 0 published templates for the course's type → NO assignment (the row shows
  // "No templates for this course type"); 1 → auto-assign it; 2+ → the one
  // flagged isDefaultForType, else the first type match (implementation-plan
  // decision #2, production parity — documented choice). There is NO
  // wrong-type fallback: a course never auto-receives a template built for a
  // different course type. A template with no courseType (or 'any') is
  // generic and fits every offering type — this fixture set's CE templates
  // are all 'any', so without this wildcard every course would show "No
  // templates for this course type" (regression fixed 2026-08-03, matches
  // variant F's templateFitsType()).
  const templateFitsType = (t: PceTemplate, o: CourseOffering) =>
    !t.courseType || t.courseType === 'any' || t.courseType === o.courseType
  const defaults = useMemo(() => {
    const result: Record<string, string> = {}
    for (const o of baseCourses) {
      const matches = publishedTemplates.filter(t => templateFitsType(t, o))
      if (matches.length === 0) continue
      const pick = matches.length === 1 ? matches[0] : (matches.find(t => t.isDefaultForType) ?? matches[0])
      result[o.id] = pick.id
    }
    return result
  }, [baseCourses, publishedTemplates])

  // Explicit picks override the type default; '' explicitly set = unassigned
  // (used by the archived-template resume path to suppress the default).
  const [assignments, setAssignments] = useState<Record<string, string>>({})
  const effectiveTid = (offeringId: string) => assignments[offeringId] ?? defaults[offeringId] ?? ''

  const [excluded, setExcluded] = useState<Set<string>>(new Set())
  // ST-02 sticky per-unit selection map (selected/deselected; absence =
  // untouched). First-sight seeds below; only the template-change reset,
  // course exclusion, or Refresh (reconcileUnitsOnRefresh) may change an
  // existing key.
  const [unitSelections, setUnitSelections] = useState<UnitSelectionMap>({})
  // ST-02 Auto Update — one flag for the whole step, defaults OFF. It decides
  // only how units first seen on a Refresh arrive; it never changes a state
  // the admin already set.
  const [autoUpdateOn, setAutoUpdateOn] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // In-step template creation (same chooser + builder as Settings > Templates;
  // this component never unmounts across the swap, so assignments persist).
  const [subView, setSubView] = useState<'table' | 'create' | { buildId: string }>('table')
  const [notice, setNotice] = useState<{ kind: 'published' | 'draft'; name: string } | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<PceTemplate | null>(null)
  const [resetOpen, setResetOpen] = useState(false)

  // Draft persistence state
  const [storedDraftSavedAt, setStoredDraftSavedAt] = useState<string | null>(null)
  const [resumeOffered, setResumeOffered] = useState(false)
  const [draftSavedAtLabel, setDraftSavedAtLabel] = useState<string | null>(null)
  const [driftNotices, setDriftNotices] = useState<DraftNotice[]>([])
  const [demoMsg, setDemoMsg] = useState<string | null>(null)

  useEffect(() => {
    const draft = readDraft()
    if (draft) {
      setStoredDraftSavedAt(draft.savedAt)
      setResumeOffered(true)
    }
  }, [])

  const flipExpanded = (key: string) =>
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  const flipUnit = (key: string) =>
    setUnitSelections(prev => ({ ...prev, [key]: prev[key] === 'selected' ? 'deselected' : 'selected' }))

  /** Include/exclude courses. Excluding wipes that course's template override
   *  AND unit selections (ST-02: re-including must NOT restore prior state —
   *  the seeding effect re-populates first-sight defaults instead). */
  const setCourses = (ids: string[], include: boolean) => {
    setExcluded(prev => {
      const next = new Set(prev)
      ids.forEach(id => (include ? next.delete(id) : next.add(id)))
      return next
    })
    if (!include) {
      const idSet = new Set(ids)
      setAssignments(prev => {
        let changed = false
        const next = { ...prev }
        for (const id of ids) if (id in next) { delete next[id]; changed = true }
        return changed ? next : prev
      })
      setUnitSelections(prev => withoutOfferings(prev, idSet))
    }
  }

  /** ST-02: changing a course's template resets its evaluatee selection
   *  entirely — no prior selection carries forward, even for roles/people the
   *  old and new template share. */
  const handleTemplateChange = (offeringId: string, templateId: string) => {
    setAssignments(prev => ({ ...prev, [offeringId]: templateId }))
    setUnitSelections(prev => withoutOfferings(prev, new Set([offeringId])))
  }

  const models = useMemo<CourseModel[]>(
    () =>
      courses.map(o => {
        const template = byTemplateId.get(assignments[o.id] ?? defaults[o.id] ?? '') ?? null
        const instances = expandInstances(o, template, surveysWithDemo, templates)
        const { code, name } = splitLabel(o)
        return {
          offering: o,
          code,
          name,
          template,
          instances,
          gaps: instances.filter(i => i.status === 'gap'),
          selectable: instances.filter(i => i.status === 'new'),
          conflicted: instances.some(i => i.status === 'duplicate'),
        }
      }),
    [courses, assignments, defaults, byTemplateId, surveysWithDemo, templates],
  )

  // First-sight seeding: a unit the map has never seen arrives 'selected'
  // when creatable, 'deselected' when it is a gap or duplicate. Existing keys
  // are never overwritten here.
  useEffect(() => {
    setUnitSelections(prev => {
      let changed = false
      const next = { ...prev }
      for (const m of models) {
        for (const i of m.instances) {
          if (next[i.key] !== undefined) continue
          next[i.key] = i.status === 'new' ? 'selected' : 'deselected'
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [models])

  // ── Per-COURSE block verdicts (the Continue gate reads these, never a
  //    global sum — a zero-contribution course can no longer hide behind
  //    other courses' counts) ────────────────────────────────────────────────
  const blockByCourse = useMemo(() => {
    const map = new Map<string, CourseBlock>()
    for (const m of models) {
      let block: CourseBlock = null
      if (!m.template) block = 'no-template'
      else if (m.conflicted) block = 'conflict'
      // Faculty-only template with zero people staffed anywhere (every
      // expanded instance is a gap, or the template covers no role applicable
      // to this course type) — distinct from a partial gap, which never blocks.
      else if (m.instances.every(i => i.status === 'gap')) block = 'unstaffed'
      // Every selectable unit deselected — the course is fully deselected and
      // contributes nothing; it individually blocks Continue.
      else if (m.selectable.length > 0 && m.selectable.every(i => unitSelections[i.key] !== 'selected')) {
        block = 'all-deselected'
      }
      map.set(m.offering.id, block)
    }
    return map
  }, [models, unitSelections])

  // ── Flat table data: course rows + injected detail rows when expanded ──────
  const data = useMemo<Step2Row[]>(() => {
    const out: Step2Row[] = []
    for (const m of models) {
      const o = m.offering
      const block = blockByCourse.get(o.id) ?? null
      const coverage: Coverage = excluded.has(o.id)
        ? 'excluded'
        : block === 'conflict'
          ? 'blocked'
          : block === 'no-template'
            ? 'unassigned'
            : block === 'unstaffed'
              ? 'unstaffed'
              : block === 'all-deselected'
                ? 'deselected'
                : m.gaps.length > 0
                  ? 'gap'
                  : 'ready'
      const peopleNames = [...new Set(m.instances.map(i => i.personName).filter((n): n is string => !!n))]
      const shared = {
        course: `${m.code}${m.name ? ` ${m.name}` : ''}`,
        type: COURSE_TYPE_FULL_LABEL[deliveryModeOf(o)],
        people: peopleNames.join(', '),
        template: m.template?.name ?? '',
        coverage,
        coverageRank: COVERAGE_RANK[coverage],
      }
      const gapWithHref = m.gaps.find(i => i.prismHref)
      out.push({
        id: o.id,
        kind: 'course',
        ...shared,
        offering: o,
        code: m.code,
        name: m.name,
        assigned: m.template,
        gapCount: m.gaps.length,
        gapHref: gapWithHref?.prismHref ?? null,
        gapRoles: [...new Set(m.gaps.map(i => i.roleLabel).filter(Boolean))].sort(),
        peopleNames,
        hasRoleUnits: m.instances.some(i => i.scope === 'instructor'),
        hasUnits: m.instances.length > 0,
        instance: null,
      })
      if (expanded.has(o.id)) {
        for (const inst of m.instances) {
          out.push({
            id: `d|${inst.key}`,
            kind: 'detail',
            ...shared,
            offering: null,
            code: m.code,
            name: m.name,
            assigned: null,
            gapCount: 0,
            gapHref: null,
            gapRoles: [],
            peopleNames: [],
            hasRoleUnits: false,
            hasUnits: false,
            instance: inst,
          })
        }
      }
    }
    return out
  }, [models, blockByCourse, excluded, expanded])

  // ── Footer gate — every count derives from PER-COURSE verdicts ─────────────
  const inPush = models.filter(m => !excluded.has(m.offering.id))
  const blockCounts = { conflict: 0, unstaffed: 0, deselected: 0, noTemplate: 0 }
  for (const m of inPush) {
    const b = blockByCourse.get(m.offering.id)
    if (b === 'conflict') blockCounts.conflict++
    else if (b === 'unstaffed') blockCounts.unstaffed++
    else if (b === 'all-deselected') blockCounts.deselected++
    else if (b === 'no-template') blockCounts.noTemplate++
  }
  const blockedCourseCount =
    blockCounts.conflict + blockCounts.unstaffed + blockCounts.deselected + blockCounts.noTemplate
  const toCreate = inPush.reduce(
    (n, m) => n + m.selectable.filter(i => unitSelections[i.key] === 'selected').length,
    0,
  )
  const gapTotal = inPush.reduce((n, m) => n + m.gaps.length, 0)
  const continueDisabled = inPush.length === 0 || blockedCourseCount > 0

  // Reset-to-defaults impact — courses whose EFFECTIVE template differs from
  // their type default (courses with no type default and no pick are not
  // "changed").
  const resetChangedCount = models.filter(
    m => effectiveTid(m.offering.id) !== (defaults[m.offering.id] ?? ''),
  ).length

  // ── ST-02 manual refresh — the ONLY re-sync trigger ────────────────────────
  function handleRefresh() {
    const freshCourses = baseCourses.map(o => (prismLive[o.id] ? { ...o, ...prismLive[o.id] } : o))
    const freshInstances = freshCourses
      .filter(o => !excluded.has(o.id))
      .flatMap(o => expandInstances(o, byTemplateId.get(effectiveTid(o.id)) ?? null, surveysWithDemo, templates))
    setUnitSelections(prev => reconcileUnitsOnRefresh(prev, freshInstances, autoUpdateOn))
    setPrismSynced(prismLive)
    setDemoMsg(null)
  }

  function handleResetDefaults() {
    const changed = new Set(
      models
        .filter(m => effectiveTid(m.offering.id) !== (defaults[m.offering.id] ?? ''))
        .map(m => m.offering.id),
    )
    setAssignments({})
    if (changed.size > 0) setUnitSelections(prev => withoutOfferings(prev, changed))
  }

  // ── Save as draft / resume (sessionStorage) ────────────────────────────────
  function handleSaveDraft() {
    const draft: VariantEDraft = {
      savedAt: new Date().toISOString(),
      assignments: Object.fromEntries(courses.map(o => [o.id, effectiveTid(o.id)])),
      unitSelections,
      autoUpdateOn,
      excluded: [...excluded],
      snapshots: {},
      demoArchivedTemplateIds: [],
    }
    for (const o of courses) {
      const t = byTemplateId.get(effectiveTid(o.id))
      if (t) draft.snapshots[o.id] = { templateId: t.id, criteria: templateCriteria(t) as string[] }
    }
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    } catch {
      return
    }
    setStoredDraftSavedAt(draft.savedAt)
    setDraftSavedAtLabel(timeLabel(draft.savedAt))
    setDemoMsg(null)
  }

  function handleResume() {
    const draft = readDraft()
    if (!draft) return
    const notices: DraftNotice[] = []
    const nextAssignments: Record<string, string> = {}
    const wiped = new Set<string>()
    for (const o of baseCourses) {
      const tid = draft.assignments[o.id]
      if (tid === undefined) continue
      if (tid === '') { nextAssignments[o.id] = ''; continue }
      const t = templates.find(x => x.id === tid) ?? null
      const archivedByDemo = draft.demoArchivedTemplateIds.includes(tid)
      if (!t || archivedByDemo || templateStoryStatusOf(t) !== 'published') {
        // Template since unpublished/archived/deleted → the row is treated as
        // "no template assigned": '' suppresses the type default, the Coverage
        // column shows the unassigned state, and Continue stays blocked until
        // a published template is chosen.
        nextAssignments[o.id] = ''
        wiped.add(o.id)
        notices.push({
          offeringId: o.id,
          code: splitLabel(o).code,
          templateName: t?.name ?? '',
          kind: 'unpublished',
          addedRoleLabels: [],
          removedRoleLabels: [],
        })
      } else {
        nextAssignments[o.id] = tid
        const snap = draft.snapshots[o.id]
        if (snap && snap.templateId === tid) {
          const current = templateCriteria(t) as string[]
          const snapSet = new Set(snap.criteria)
          const curSet = new Set(current)
          const added = current.filter(c => !snapSet.has(c))
          const removed = snap.criteria.filter(c => !curSet.has(c))
          if (added.length > 0 || removed.length > 0) {
            notices.push({
              offeringId: o.id,
              code: splitLabel(o).code,
              templateName: t.name,
              kind: 'updated',
              addedRoleLabels: added.map(criterionLabel),
              removedRoleLabels: removed.map(criterionLabel),
            })
          }
        }
      }
    }
    setAssignments(nextAssignments)
    setExcluded(new Set(draft.excluded))
    setAutoUpdateOn(draft.autoUpdateOn)
    setUnitSelections(withoutOfferings(draft.unitSelections, wiped))
    setDriftNotices(notices)
    setResumeOffered(false)
    setDemoMsg(null)
  }

  function handleStartFresh() {
    try { sessionStorage.removeItem(DRAFT_KEY) } catch { /* storage unavailable */ }
    setStoredDraftSavedAt(null)
    setResumeOffered(false)
    setDriftNotices([])
  }

  // ── Demo-only simulations ──────────────────────────────────────────────────
  const demoOffering = courses.find(o => o.id === DEMO_OFFERING_ID) ?? null
  const demoCode = demoOffering ? splitLabel(demoOffering).code : DEMO_OFFERING_ID
  const prismPending = JSON.stringify(prismLive) !== JSON.stringify(prismSynced)

  function simulateAddCoInstructor() {
    const base = MOCK_COURSE_OFFERINGS.find(o => o.id === DEMO_OFFERING_ID)
    if (!base) return
    setPrismLive(prev => {
      const current = prev[DEMO_OFFERING_ID]?.coInstructorIds ?? base.coInstructorIds ?? []
      if (current.includes(DEMO_CO_INSTRUCTOR_ID)) return prev
      return {
        ...prev,
        [DEMO_OFFERING_ID]: { ...prev[DEMO_OFFERING_ID], coInstructorIds: [...current, DEMO_CO_INSTRUCTOR_ID] },
      }
    })
    setDemoMsg(`A co-instructor was added to ${demoCode} in Prism. Click Refresh to sync; with Auto update on the new unit arrives selected, off it arrives deselected.`)
  }

  function simulateRemoveCoordinator() {
    setPrismLive(prev => ({
      ...prev,
      [DEMO_OFFERING_ID]: { ...prev[DEMO_OFFERING_ID], primaryFacultyId: '' },
    }))
    setDemoMsg(`The coordinator was removed from ${demoCode} in Prism. Click Refresh to sync; the unit drops out and the role shows as a gap.`)
  }

  // These two edit the SAVED DRAFT rather than the live template record —
  // editing the real template through pce-state would leak the demo into every
  // other surface sharing that store. Trimming the saved criteria snapshot is
  // logically identical to the template gaining a role after the save, and the
  // archived list is logically identical to archiving it: the resume diff only
  // ever compares the snapshot against the current template.
  function simulateTemplateGainedRole() {
    const draft = readDraft()
    if (!draft) return
    const entry = Object.entries(draft.snapshots).find(([, s]) => s.criteria.length > 1)
    if (!entry) {
      setDemoMsg('No saved course carries a template with more than one covered role, so there is nothing to trim.')
      return
    }
    const [offeringId, snap] = entry
    const trimmed = snap.criteria[snap.criteria.length - 1]
    snap.criteria = snap.criteria.slice(0, -1)
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft)) } catch { return }
    const o = baseCourses.find(x => x.id === offeringId)
    setResumeOffered(true)
    setDemoMsg(`The saved snapshot for ${o ? splitLabel(o).code : offeringId} no longer lists ${criterionLabel(trimmed)}, so the template now reads as changed since the save. Resume the draft to see the notice.`)
  }

  function simulateTemplateArchived() {
    const draft = readDraft()
    if (!draft) return
    const entry = Object.entries(draft.snapshots)[0]
    if (!entry) {
      setDemoMsg('Save a draft with at least one assigned template first.')
      return
    }
    const tid = entry[1].templateId
    if (!draft.demoArchivedTemplateIds.includes(tid)) draft.demoArchivedTemplateIds.push(tid)
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft)) } catch { return }
    const name = templates.find(t => t.id === tid)?.name ?? tid
    setResumeOffered(true)
    setDemoMsg(`"${name}" is treated as archived since the draft was saved. Resume the draft to see the block and the unassigned rows.`)
  }

  // ── Columns — everything the real DataTable natively offers, switched on ──
  const typeOptions = [...new Set(models.map(m => COURSE_TYPE_FULL_LABEL[deliveryModeOf(m.offering)]))]
    .sort()
    .map(v => ({ value: v, label: v }))

  const columns: ColumnDef<Step2Row>[] = [
    { key: 'select', label: '', width: 40, defaultPin: 'left', lockPin: true },
    {
      key: 'course',
      label: 'Course',
      sortable: true,
      width: 270,
      filter: { type: 'text', icon: 'fa-book-open' },
      cell: row =>
        row.kind === 'course' ? (
          <div className="flex items-center gap-1.5 min-w-0">
            {row.hasUnits ? (
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-6 shrink-0 -ms-1"
                aria-expanded={expanded.has(row.id)}
                aria-label={`${expanded.has(row.id) ? 'Hide' : 'Show'} evaluations for ${row.code}`}
                onClick={() => flipExpanded(row.id)}
              >
                <i
                  className={`fa-light fa-chevron-right text-xs transition-transform ${expanded.has(row.id) ? 'rotate-90' : ''}`}
                  aria-hidden="true"
                />
              </Button>
            ) : (
              <span className="size-6 shrink-0 -ms-1" aria-hidden="true" />
            )}
            <span className="font-mono text-xs tabular-nums text-muted-foreground shrink-0">{row.code}</span>
            {row.name && <span className="truncate text-sm">{row.name}</span>}
          </div>
        ) : (
          <DetailUnitCell
            instance={row.instance!}
            code={row.code}
            included={unitSelections[row.instance!.key] === 'selected'}
            onToggle={() => flipUnit(row.instance!.key)}
          />
        ),
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      width: 120,
      filter: { type: 'select', icon: 'fa-shapes', options: typeOptions },
      cell: row =>
        row.kind === 'course' ? (
          <TypePill deliveryMode={deliveryModeOf(row.offering!)} label={row.type} />
        ) : null,
    },
    {
      // ST-02 UI note — "Assigned person(s)" broken out of the Course label
      // into its own column: course rows summarize the staffed people, detail
      // rows carry the specific unit's person.
      key: 'people',
      label: 'Assigned',
      sortable: true,
      width: 190,
      cell: row =>
        row.kind === 'course' ? (
          <CoursePeopleCell row={row} />
        ) : (
          <DetailPersonCell instance={row.instance!} />
        ),
    },
    {
      key: 'template',
      label: 'Template',
      sortable: true,
      width: 230,
      cell: row => {
        if (row.kind === 'detail') return null
        const o = row.offering!
        // ST-02: the picker lists ONLY templates published for this course's
        // own type — never a wrong-type fallback. 'any'/unset = generic,
        // fits every type (see templateFitsType above).
        const typeMatches = publishedTemplates.filter(t => templateFitsType(t, o))
        if (typeMatches.length === 0) {
          return <span className="text-xs text-muted-foreground">No templates for this course type</span>
        }
        return (
          <Select value={row.assigned?.id ?? ''} onValueChange={tid => handleTemplateChange(row.id, tid)}>
            <SelectTrigger
              size="sm"
              aria-label={`Template for ${row.code}${!row.assigned ? ' · required' : ''}`}
              className="w-full [&>span]:truncate"
            >
              <SelectValue placeholder="Assign a template" />
            </SelectTrigger>
            <SelectContent>
              {typeMatches.map(t => (
                <SelectItem key={t.id} value={t.id}>
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span className="truncate">{t.name}</span>
                    {t.id === defaults[row.id] && (
                      // 12px floor (WCAG 1.4.4 / DS type scale) — never below text-xs.
                      <Badge variant="secondary" className="shrink-0" style={{ fontSize: 12, paddingInline: 6, paddingBlock: 1 }}>
                        Default
                      </Badge>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      },
    },
    {
      key: 'coverage',
      label: 'Coverage',
      sortable: true,
      sortKey: 'coverageRank',
      width: 210,
      filter: {
        type: 'select',
        icon: 'fa-shield-check',
        options: [
          { value: 'ready', label: 'Ready' },
          { value: 'gap', label: 'Has gaps' },
          { value: 'blocked', label: 'Blocked' },
          { value: 'unstaffed', label: 'No faculty staffed' },
          { value: 'deselected', label: 'Nothing selected' },
          { value: 'unassigned', label: 'No template' },
          { value: 'excluded', label: 'Excluded' },
        ],
      },
      cell: row =>
        row.kind === 'course' ? (
          <CourseCoverageCell
            row={row}
            onExclude={() => setCourses([row.id], false)}
            onInclude={() => setCourses([row.id], true)}
          />
        ) : (
          <DetailCoverageCell
            instance={row.instance!}
            included={unitSelections[row.instance!.key] === 'selected'}
          />
        ),
    },
    {
      key: 'actions',
      label: '',
      width: 96,
      cell: row => {
        if (row.kind !== 'course') return null
        const button = (
          <Button
            variant="outline"
            size="xs"
            disabled={!row.assigned}
            onClick={() => row.assigned && setPreviewTemplate(row.assigned)}
          >
            Preview
            <span className="sr-only">
              {row.assigned ? ` the survey for ${row.code}` : '. Assign a template to preview.'}
            </span>
          </Button>
        )
        if (row.assigned) return button
        return (
          <Tip label="Assign a template to preview" side="left">
            {/* Disabled buttons swallow pointer/focus events — the focusable
                wrapper carries the tooltip AND a visible focus ring (WCAG 2.4.7). */}
            <span
              tabIndex={0}
              className="inline-flex rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            >
              {button}
            </span>
          </Tip>
        )
      },
    },
  ]

  // Controlled table state — the component's own hook, held here so the bulk
  // actions can clear the selection after acting on it.
  const tableState = useTableState(data, columns, { key: 'course', dir: 'asc' })

  const selectedCourseIds = (selected: Set<string | number>) =>
    [...selected].map(String).filter(id => !id.startsWith('d|'))

  // ── Create sub-view: same chooser + builder as Settings > Templates ────────
  if (subView !== 'table') {
    return (
      <div className="flex flex-col gap-3">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => {
              if (typeof subView === 'object') {
                const t = templates.find(x => x.id === subView.buildId)
                if (t && t.status !== 'active') setNotice({ kind: 'draft', name: t.name || 'Untitled template' })
              }
              setSubView('table')
            }}
          >
            <i className="fa-light fa-arrow-left text-xs" aria-hidden="true" />
            Back to Survey design
          </Button>
        </div>
        {subView === 'create' ? (
          <CreateBlankTemplate onCreated={id => setSubView({ buildId: id })} />
        ) : (
          <TemplateEditor
            templateId={subView.buildId}
            embedded
            onPublished={id => {
              const t = templates.find(x => x.id === id)
              setNotice({ kind: 'published', name: t?.name || 'Template' })
              setSubView('table')
            }}
          />
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <h2 className="text-lg font-semibold font-heading">Survey design</h2>
          <p className="text-sm text-muted-foreground">
            Confirm each course&apos;s template. Expand a course to review the evaluations this push creates. Sort or filter the Coverage column to isolate blocked courses.
          </p>
          {/* ST-02 Auto Update explanatory copy — visible, top of screen; the
              toggle itself lives in the table toolbar. */}
          <p className="text-xs text-muted-foreground">
            Auto update decides how faculty found on the next refresh arrive: on, they start selected; off, they start deselected. Selections you have already made never change.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {draftSavedAtLabel && (
            <span className="text-xs text-muted-foreground tabular-nums">Draft saved at {draftSavedAtLabel}</span>
          )}
          <Button variant="outline" size="sm" disabled={inPush.length === 0} onClick={handleSaveDraft}>
            Save as draft
          </Button>
        </div>
      </header>

      {notice && (
        <LocalBanner
          variant={notice.kind === 'published' ? 'success' : 'info'}
          dismissible
          onDismiss={() => setNotice(null)}
        >
          {notice.kind === 'published'
            ? <>&ldquo;{notice.name}&rdquo; is published. Assign it in the course list below.</>
            : <>&ldquo;{notice.name}&rdquo; is saved as a draft. Publish it from Settings &rsaquo; Templates to make it assignable.</>}
        </LocalBanner>
      )}

      {/* Draft resume offer — shown when a saved draft exists on load, or after
          a demo simulation touches the stored draft. */}
      {resumeOffered && storedDraftSavedAt && (
        <LocalBanner variant="info">
          <span className="flex items-center gap-3 flex-wrap">
            <span className="tabular-nums">Draft saved at {timeLabel(storedDraftSavedAt)}.</span>
            <Button variant="default" size="xs" onClick={handleResume}>Resume</Button>
            <Button variant="ghost" size="xs" onClick={handleStartFresh}>Start fresh</Button>
          </span>
        </LocalBanner>
      )}

      {/* Draft-resume findings: template drift = info; template archived =
          warning, and the affected rows resume with NO template assigned (the
          Coverage column and footer gate carry the block). */}
      {driftNotices.some(n => n.kind === 'updated') && (
        <LocalBanner variant="info" dismissible onDismiss={() => setDriftNotices(prev => prev.filter(n => n.kind !== 'updated'))}>
          <span className="flex flex-col gap-1">
            {driftNotices.filter(n => n.kind === 'updated').map(n => (
              <span key={`${n.offeringId}-updated`}>
                &ldquo;{n.templateName}&rdquo; changed since this draft was saved.
                {n.addedRoleLabels.length > 0 && <> For {n.code} it now also covers {n.addedRoleLabels.join(', ')}.</>}
                {n.removedRoleLabels.length > 0 && <> It no longer covers {n.removedRoleLabels.join(', ')}.</>}
                {' '}Coverage below reflects the current template.
              </span>
            ))}
          </span>
        </LocalBanner>
      )}
      {driftNotices.some(n => n.kind === 'unpublished') && (
        <LocalBanner variant="warning" dismissible onDismiss={() => setDriftNotices(prev => prev.filter(n => n.kind !== 'unpublished'))}>
          <span className="flex flex-col gap-1">
            {driftNotices.filter(n => n.kind === 'unpublished').map(n => (
              <span key={`${n.offeringId}-unpublished`}>
                {n.templateName ? <>&ldquo;{n.templateName}&rdquo;</> : <>The template saved with this draft</>}
                {' '}is no longer published. {n.code} has no template assigned; assign a published template to continue.
              </span>
            ))}
          </span>
        </LocalBanner>
      )}

      <DataTable<Step2Row>
        data={data}
        columns={columns}
        state={tableState}
        getRowId={row => row.id}
        getRowSelectionLabel={row =>
          row.kind === 'course'
            ? row.course
            : `${unitTitle(row.instance!)}${row.instance!.personName ? `, ${row.instance!.personName}` : ''}, ${row.course}`
        }
        selectable
        searchable
        edgeInset={false}
        stickyHeader={false}
        emptyState="No courses match your search or filters. Clear them to see every course in this push."
        getRowClassName={row =>
          row.kind === 'detail'
            ? 'bg-muted/30'
            : row.coverage === 'excluded'
              ? 'opacity-55'
              : undefined
        }
        toolbarSlot={() => (
          <div className="flex items-center gap-3 whitespace-nowrap">
            <span className="text-xs text-muted-foreground tabular-nums">
              {courses.length} course{courses.length !== 1 ? 's' : ''}
            </span>
            <span className="h-4 w-px bg-border/70" aria-hidden="true" />
            {/* ST-02 Auto Update — ONE flag for the whole step, in the table
                toolbar (never per-row); defaults OFF. Refresh beside it is the
                only re-sync trigger for faculty coverage. */}
            <Tip
              label="Faculty found on the next refresh start selected when this is on, deselected when off. Selections you have already made never change."
              side="bottom"
            >
              <label htmlFor="variant-e-auto-update" className="flex items-center gap-2 cursor-pointer">
                <ToggleSwitch id="variant-e-auto-update" checked={autoUpdateOn} onChange={setAutoUpdateOn} />
                <span className="text-xs font-medium">Auto update</span>
              </label>
            </Tip>
            <Tip label="Recheck faculty assignments in Prism" side="bottom">
              <Button variant="outline" size="xs" onClick={handleRefresh}>
                Refresh
              </Button>
            </Tip>
            <span className="h-4 w-px bg-border/70" aria-hidden="true" />
            <Button variant="ghost" size="xs" className="text-muted-foreground hover:text-foreground" onClick={() => setResetOpen(true)}>
              Reset to defaults
            </Button>
            <Button variant="outline" size="xs" onClick={() => { setNotice(null); setSubView('create') }}>
              New template
            </Button>
          </div>
        )}
        bulkActionsSlot={selected => {
          const ids = selectedCourseIds(selected)
          return (
            <>
              <Button
                size="sm"
                variant="outline"
                disabled={ids.length === 0}
                onClick={() => {
                  setCourses(ids, false)
                  tableState.setSelected(new Set())
                }}
              >
                Exclude from push
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={ids.length === 0}
                onClick={() => {
                  setCourses(ids, true)
                  tableState.setSelected(new Set())
                }}
              >
                Include in push
              </Button>
            </>
          )
        }}
      />

      {/* ── Demo scaffolding — deliberately NOT product UI: dashed border,
             muted wash, explicit label. Everything here mutates the demo's
             in-memory Prism copy or the saved draft so Refresh and Resume have
             real changes to react to. ── */}
      <section
        aria-label="Simulate PRISM changes (demo only)"
        className="rounded-lg border border-dashed p-4 flex flex-col gap-3"
        style={{ borderColor: 'var(--border)', background: 'var(--muted)' }}
      >
        <span className="text-xs font-semibold">Simulate PRISM changes (demo only)</span>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Prism data ({demoCode}):</span>
          <Button variant="outline" size="xs" onClick={simulateAddCoInstructor}>
            Add a co-instructor
          </Button>
          <Button variant="outline" size="xs" onClick={simulateRemoveCoordinator}>
            Remove the coordinator
          </Button>
          <span className="h-4 w-px bg-border/70" aria-hidden="true" />
          <span className="text-xs text-muted-foreground">Saved draft:</span>
          <Button variant="outline" size="xs" disabled={!storedDraftSavedAt} onClick={simulateTemplateGainedRole}>
            Template gained a new role since the draft was saved
          </Button>
          <Button variant="outline" size="xs" disabled={!storedDraftSavedAt} onClick={simulateTemplateArchived}>
            Template archived since the draft was saved
          </Button>
        </div>
        {prismPending && (
          <span className="text-xs" style={{ color: 'var(--chip-4)' }}>
            Pending Prism changes. They apply on the next Refresh, per the manual re-sync rule.
          </span>
        )}
        {demoMsg && <span className="text-xs text-muted-foreground">{demoMsg}</span>}
      </section>

      {/* ── Footer — the hard-block gate lives on Continue, computed PER
             COURSE (a zero-contribution course blocks individually and can
             never be masked by other courses' counts). ── */}
      <div className="sticky bottom-0 mt-auto bg-background border-t border-border py-4 flex items-center justify-between gap-4">
        <span className="text-xs tabular-nums text-muted-foreground">
          {toCreate} evaluation{toCreate !== 1 ? 's' : ''} across {inPush.length} course{inPush.length !== 1 ? 's' : ''}
          {gapTotal > 0 && (
            <> · <span style={{ color: 'var(--chip-4)' }}>{gapTotal} role{gapTotal !== 1 ? 's' : ''} unassigned</span></>
          )}
          {blockCounts.conflict > 0 && (
            <>
              {' · '}
              <span className="font-medium" style={{ color: 'var(--chip-destructive)' }}>
                {blockCounts.conflict} course{blockCounts.conflict !== 1 ? 's' : ''} blocked by an existing survey
              </span>
            </>
          )}
          {blockCounts.unstaffed > 0 && (
            <>
              {' · '}
              <span className="font-medium" style={{ color: 'var(--chip-destructive)' }}>
                {blockCounts.unstaffed} course{blockCounts.unstaffed !== 1 ? 's' : ''} with no faculty staffed
              </span>
            </>
          )}
          {blockCounts.deselected > 0 && (
            <>
              {' · '}
              <span className="font-medium" style={{ color: 'var(--chip-destructive)' }}>
                {blockCounts.deselected} course{blockCounts.deselected !== 1 ? 's' : ''} with nothing selected
              </span>
            </>
          )}
          {blockCounts.noTemplate > 0 && (
            <> · {blockCounts.noTemplate} course{blockCounts.noTemplate !== 1 ? 's' : ''} without a template</>
          )}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            <i className="fa-light fa-arrow-left text-xs" aria-hidden="true" />
            Back
          </Button>
          <Button variant="default" size="sm" disabled={continueDisabled}>
            Continue
            <i className="fa-light fa-arrow-right text-xs" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Per-row Preview Survey target — the lightweight template-backed
          dialog, not /surveys/[id]/preview (that page requires a persisted
          survey id and this step previews unsaved assignments). Shows the
          template's content only; no survey title exists yet. */}
      <SurveyPreviewDialog
        template={previewTemplate}
        open={previewTemplate !== null}
        onOpenChange={open => { if (!open) setPreviewTemplate(null) }}
      />

      {/* Reset to defaults — irreversible per ST-02, so it itemizes WHAT will
          change instead of a generic are-you-sure. */}
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset all templates to defaults?</AlertDialogTitle>
            <AlertDialogDescription>
              {resetChangedCount > 0 ? (
                <>
                  {resetChangedCount} course{resetChangedCount !== 1 ? 's' : ''} will return to the default template
                  for its course type, and the evaluatee selections on {resetChangedCount !== 1 ? 'those courses' : 'that course'} will
                  reset to the new template&rsquo;s coverage. This cannot be undone.
                </>
              ) : (
                <>Every course already uses its default template. Nothing will change.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant={resetChangedCount > 0 ? 'destructive' : 'default'}
              onClick={handleResetDefaults}
            >
              Reset templates
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Cell renderers
// ═════════════════════════════════════════════════════════════════════════════

/** Course-row Coverage cell — the consolidated "Action needed" equivalent.
 *  Consolidated states only, never faculty names (those live in the Assigned
 *  column and the detail rows). Severity vocabulary: fa-lock +
 *  --chip-destructive strictly = hard block; --chip-4 (amber) strictly =
 *  missing data, which never blocks. */
function CourseCoverageCell({
  row, onExclude, onInclude,
}: {
  row: Step2Row
  onExclude: () => void
  onInclude: () => void
}) {
  if (row.coverage === 'excluded') {
    return (
      <span className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Excluded</span>
        <Button variant="link" size="sm" className="px-0 h-auto" onClick={onInclude}>
          Include
        </Button>
      </span>
    )
  }
  if (row.coverage === 'blocked') {
    return (
      <span className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap" style={{ color: 'var(--chip-destructive)' }}>
          <i className="fa-solid fa-lock text-[10px]" aria-hidden="true" />
          Blocked
        </span>
        <Button variant="link" size="sm" className="px-0 h-auto" onClick={onExclude}>
          Remove
        </Button>
      </span>
    )
  }
  if (row.coverage === 'unstaffed') {
    return (
      <span className="flex items-center gap-2 min-w-0">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap" style={{ color: 'var(--chip-destructive)' }}>
          <i className="fa-solid fa-lock text-[10px]" aria-hidden="true" />
          No faculty staffed
        </span>
        {row.gapHref && (
          <AddInPrismButton href={row.gapHref} label="Add faculty" roles={row.gapRoles} ghost />
        )}
      </span>
    )
  }
  if (row.coverage === 'deselected') {
    return (
      <span className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap" style={{ color: 'var(--chip-destructive)' }}>
          <i className="fa-solid fa-lock text-[10px]" aria-hidden="true" />
          Nothing selected
        </span>
        <Button variant="link" size="sm" className="px-0 h-auto" onClick={onExclude}>
          Remove
        </Button>
      </span>
    )
  }
  if (row.coverage === 'unassigned') {
    return (
      <span className="text-xs font-medium" style={{ color: 'var(--insight-severity-info-fg)' }}>
        No template assigned
      </span>
    )
  }
  if (row.coverage === 'gap') {
    return (
      <span className="flex items-center gap-2 min-w-0">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap" style={{ color: 'var(--chip-4)' }}>
          <span aria-hidden="true" className="size-1.5 rounded-full" style={{ background: 'var(--chip-4)' }} />
          {row.gapCount} gap{row.gapCount !== 1 ? 's' : ''}
        </span>
        {row.gapHref && (
          <AddInPrismButton href={row.gapHref} label="Add faculty" roles={row.gapRoles} ghost />
        )}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span aria-hidden="true" className="size-1.5 rounded-full" style={{ background: 'var(--chip-2)' }} />
      Ready
    </span>
  )
}

/** Course-row Assigned cell — staffed people summarized (capped at 2 + "+N"). */
function CoursePeopleCell({ row }: { row: Step2Row }) {
  if (!row.assigned) return null
  if (row.peopleNames.length > 0) {
    const shown = row.peopleNames.slice(0, 2).join(', ')
    const extra = row.peopleNames.length - 2
    return (
      <span className="text-xs text-muted-foreground truncate">
        {shown}
        {extra > 0 && <span className="tabular-nums"> +{extra}</span>}
      </span>
    )
  }
  if (row.hasRoleUnits) {
    return (
      <span className="text-xs" style={{ color: 'var(--chip-4)' }}>
        No one assigned
      </span>
    )
  }
  return <span className="text-xs text-muted-foreground">Course material only</span>
}

/** Detail-row Assigned cell — the specific unit's person. */
function DetailPersonCell({ instance }: { instance: SurveyInstance }) {
  if (instance.scope === 'course') return null
  if (!instance.personName) {
    return (
      <span className="text-xs" style={{ color: 'var(--chip-4)' }}>
        No one assigned
      </span>
    )
  }
  return <span className="text-sm truncate">{instance.personName}</span>
}

/** Detail-row Course cell — the per-unit Evaluate? affordance, labeled by the
 *  unit's ROLE (the person lives in the Assigned column). */
function DetailUnitCell({
  instance, code, included, onToggle,
}: {
  instance: SurveyInstance
  code: string
  included: boolean
  onToggle: () => void
}) {
  const title = unitTitle(instance)
  if (instance.status === 'duplicate') {
    return (
      <span className="flex items-center gap-2.5 ps-7 min-w-0 pointer-events-none" aria-disabled="true">
        <i className="fa-solid fa-lock text-[10px] shrink-0" style={{ color: 'var(--chip-destructive)' }} aria-hidden="true" />
        <span className="text-sm truncate">{title}</span>
      </span>
    )
  }
  if (instance.status === 'gap') {
    return (
      <span className="flex items-center gap-2.5 ps-7 min-w-0">
        <i className="fa-solid fa-user-slash text-[10px] shrink-0" style={{ color: 'var(--chip-4)' }} aria-hidden="true" />
        <span className="text-sm text-muted-foreground truncate">{title}</span>
      </span>
    )
  }
  const ariaLabel = instance.scope === 'course'
    ? `Evaluate course material in ${code}`
    : `Evaluate ${instance.personName}, ${instance.roleLabel}, in ${code}`
  return (
    <span className="flex items-center gap-2.5 ps-7 min-w-0">
      <Checkbox
        id={`var-e-unit-${instance.key.replace(/[^a-zA-Z0-9_-]/g, '-')}`}
        checked={included}
        onCheckedChange={onToggle}
        aria-label={ariaLabel}
      />
      <CheckboxLabel
        htmlFor={`var-e-unit-${instance.key.replace(/[^a-zA-Z0-9_-]/g, '-')}`}
        className="font-normal text-sm truncate"
      >
        {title}
      </CheckboxLabel>
    </span>
  )
}

/** Detail-row Coverage cell — what this specific unit's push outcome is. */
function DetailCoverageCell({ instance, included }: { instance: SurveyInstance; included: boolean }) {
  if (instance.status === 'duplicate' && instance.existing) {
    return (
      <span className="flex items-center gap-1.5 min-w-0">
        <span className="text-xs text-muted-foreground shrink-0">Covered by</span>
        <StoryStatusBadgeOS status={storyStatusOf(instance.existing)} />
      </span>
    )
  }
  if (instance.status === 'gap') {
    return (
      <span className="text-xs" style={{ color: 'var(--chip-4)' }}>
        Skipped
      </span>
    )
  }
  return (
    <span className="text-xs text-muted-foreground">{included ? 'In push' : 'Excluded'}</span>
  )
}
