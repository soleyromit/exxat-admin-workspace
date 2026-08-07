'use client'

// ============================================================================
// Variant B — "Grouped by status" exploration for push-wizard Step 2.
// Comparison surface only; NOT wired into the production wizard.
//
// Premise (Linear / Asana grouped lists): sort courses into sections by what
// they need, so the section header carries the situation and each row can stay
// minimal. Three sections:
//   1. Blocked — Continue is disabled while any of these stay included:
//      role coverage overlaps a Live/Closed/Results Available/Archived survey,
//      no template assigned, the assigned template was unpublished/archived,
//      or the template evaluates only faculty roles and no one is staffed.
//   2. Needs faculty — a role the template evaluates is unstaffed
//      (informational; never blocks).
//   3. Ready — nothing to review; collapsed by default.
//
// ST-02 completeness pass (2026-08-03): this file now carries the FULL Step 2
// behavior set, self-contained — type-filtered template pickers with a
// "Default" badge, per-course template-change selection reset, embedded
// template creation (same CreateBlankTemplate/TemplateEditor flow as the
// production step), Reset to defaults behind an AlertDialog, checkbox-chip
// evaluatee units (capped at 3), the Auto Update flag + manual Refresh riding
// reconcileUnitsOnRefresh, a sessionStorage Save-as-draft/Resume simulation
// with template-drift notices, and a per-course Continue gate. Demo-only
// scaffolding (PRISM mutation + draft-drift simulators) lives in a visually
// separated "Simulate PRISM changes (demo only)" panel at the bottom.
//
// Documented interpretation calls:
//   · Template type matching treats courseType 'any' (or absent) as matching
//     every course type; only an explicit didactic/clinical mismatch is
//     filtered out of the picker.
//   · 2+ published matches for a type: auto-assign ONLY the isDefaultForType
//     one; if none is flagged, the course starts unassigned (conscious pick).
//     The fixtures ship no flag, so a demo overlay below marks tmpl1 as the
//     type default (same synthetic-fixture precedent as DEMO_LIVE_SURVEY).
//   · Every selectable evaluatee unit deselected = the course is treated as
//     automatically deselected: excluded from the push, the footer counts, and
//     the block checks, exactly like an unchecked course. An included course
//     therefore can never sit at zero units, which is how the "all units
//     deselected blocks like no-template" rule is enforced without a dead end.
//
// Data is the real pt5 (Fall 2026) fixture set. One in-memory Live survey is
// synthesized for co13 (DPT-510) so the hard-block path is demonstrable without
// touching shared fixtures — the real pf0/pf1/pf2 surveys on co13 are Scheduled
// and therefore do not block.
// ============================================================================

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Checkbox,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  LocalBanner,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tip,
  ToggleSwitch,
} from '@exxatdesignux/ui'
import { cn } from '@/lib/utils'
import { usePce } from '@/components/pce/pce-state'
import { PersonAvatar } from '@/components/pce/person-avatar'
import { StoryStatusBadgeOS } from '@/components/pce/pce-badges'
import { CreateBlankTemplate } from '@/components/pce/create-blank-template'
import { TemplateEditor } from '@/components/pce/template-editor'
import { SurveyPreviewDialog } from '@/components/pce/distribute-wizard/survey-preview-dialog'
import {
  MOCK_COURSE_OFFERINGS,
  MOCK_PROGRAM_TERMS,
  type CourseOffering,
  type PceSurvey,
  type PceTemplate,
} from '@/lib/pce-mock-data'
import {
  courseLabelOf,
  templateCriteria,
  CRITERION_TOGGLE_LABEL,
  type Criterion,
} from '@/lib/pce-course-readiness'
import {
  expandInstances,
  reconcileUnitsOnRefresh,
  storyStatusOf,
  type SurveyInstance,
  type UnitSelectionMap,
} from '@/lib/pce-push-validation'

// ── Demo scope ───────────────────────────────────────────────────────────────

const DEMO_TERM_ID = 'pt5' // Fall 2026, 2026–2027 (verified in MOCK_PROGRAM_TERMS)

const TERM_OFFERINGS: CourseOffering[] = MOCK_COURSE_OFFERINGS.filter(
  o => o.termId === DEMO_TERM_ID && o.status !== 'archived',
)

/** sessionStorage key for this variant's Save-as-draft simulation. */
const DRAFT_KEY = 'pce-compare-step2-variant-b-draft'

/** Demo PRISM mutation target: DPT-501 (co9) gains/loses a co-instructor. */
const DEMO_PRISM_COURSE_ID = 'co9'
const DEMO_PRISM_FACULTY_ID = 'f6' // Dr. Omar Hassan — not staffed on co9 in fixtures

/** Chips show at most this many units before the "+N more" expander. */
const CHIP_CAP = 3

/** Local, in-memory Live survey on co13 (DPT-510) so one course exercises the
 *  hard-block section. Never written to shared fixture data. */
const DEMO_LIVE_SURVEY: PceSurvey = {
  id: 'demo-live-co13',
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
  responseRate: 12,
  responseCount: 5,
  enrollmentCount: 44,
  deadline: 'Dec 18, 2026',
  createdAt: 'Jul 15, 2026',
  createdBy: 'Dr. Anita Patel',
  surveyType: 'course_evaluation',
  openDate: '2026-11-20',
  academicYear: '2026–2027',
  programId: 'prog1',
}

// ── Draft persistence shape (sessionStorage) ─────────────────────────────────

interface SavedDraft {
  savedAt: string // ISO
  assignments: Record<string, string>
  unitSelections: UnitSelectionMap
  autoUpdateOn: boolean
  excludedCourseIds: string[]
  /** Per-offering snapshot of the assigned template's coverage AT SAVE TIME —
   *  the drift check compares this against the template's current criteria. */
  snapshots: Record<string, { templateId: string; templateName: string; criteria: string[] }>
}

interface DriftNotice {
  courseCodes: string[]
  templateName: string
  kind: 'updated' | 'unpublished'
  addedRoleLabels: string[]
}

// ── Small helpers ────────────────────────────────────────────────────────────

function splitLabel(o: CourseOffering): { code: string; name: string } {
  const label = courseLabelOf(o)
  if (!label.includes(' – ')) return { code: label, name: '' }
  const [code, ...rest] = label.split(' – ')
  return { code, name: rest.join(' – ') }
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

const roleName = (i: SurveyInstance) => (i.scope === 'course' ? 'Course material' : i.roleLabel)

const STORY_WORD: Record<string, string> = {
  live: 'a live survey',
  closed: 'a closed survey',
  results_available: 'a survey with results available',
  archived: 'an archived survey',
}

/** Type match: an explicit didactic/clinical template must equal the course's
 *  type; 'any' (or absent) matches every course. Mismatched-type templates are
 *  never selectable (ST-02). */
function templateMatchesType(t: PceTemplate, o: CourseOffering): boolean {
  return !t.courseType || t.courseType === 'any' || t.courseType === o.courseType
}

type SectionId = 'blocked' | 'needsFaculty' | 'ready'
type BlockKind = 'overlap' | 'noTemplate' | 'templateUnpublished' | 'noEvaluatees' | null

interface CourseRow {
  offering: CourseOffering
  code: string
  name: string
  /** Effective template id ('' = none). */
  templateId: string
  template: PceTemplate | null
  /** Options the picker may offer this row (published, type-matching). */
  typeMatches: PceTemplate[]
  instances: SurveyInstance[]
  fresh: SurveyInstance[]
  gaps: SurveyInstance[]
  duplicates: SurveyInstance[]
  section: SectionId
  blockKind: BlockKind
  /** One-line reason shown inside the Blocked / Needs faculty sections.
   *  Role labels only — never faculty names (ST-02 Action-needed rule). */
  reason: string | null
  /** Every selectable unit deselected = the course is treated as deselected. */
  autoSkipped: boolean
}

// ── Component ────────────────────────────────────────────────────────────────

export default function VariantBGroupedStatus() {
  const { templates: rawTemplates, surveys } = usePce()

  const term = MOCK_PROGRAM_TERMS.find(t => t.id === DEMO_TERM_ID)

  // DEMO OVERLAY (this compare surface only): the shared fixtures ship no
  // isDefaultForType flag, and this variant's documented tie-break leaves a
  // 2+-match course unassigned unless one template is flagged. Marking tmpl1
  // as the type default here keeps the screen usable end-to-end while staying
  // out of shared fixture data — same precedent as DEMO_LIVE_SURVEY above.
  const templates = useMemo(
    () => rawTemplates.map(t => (t.id === 'tmpl1' ? { ...t, isDefaultForType: true } : t)),
    [rawTemplates],
  )

  // Demo-only archive overlay — "Simulate: template archived since this draft
  // was saved" adds ids here; the template then reads as unpublished for every
  // row and for the resume validity check, without touching shared state.
  const [demoArchivedIds, setDemoArchivedIds] = useState<Set<string>>(new Set())

  const publishedTemplates = useMemo(
    () =>
      templates.filter(
        t =>
          t.status === 'active' &&
          !t.archived &&
          !demoArchivedIds.has(t.id) &&
          (!t.surveyType || t.surveyType === 'course_evaluation'),
      ),
    [templates, demoArchivedIds],
  )
  const publishedById = useMemo(
    () => new Map<string, PceTemplate>(publishedTemplates.map(t => [t.id, t])),
    [publishedTemplates],
  )

  // ── Simulated PRISM (demo) ─────────────────────────────────────────────────
  // prismOfferings = the "live PRISM truth" the demo buttons mutate.
  // syncedOfferings = the snapshot this step renders and expands from — it only
  // moves when the admin clicks Refresh, so the Auto Update toggle alone never
  // changes anything on screen (ST-02: Refresh is the only re-sync trigger).
  const [prismOfferings, setPrismOfferings] = useState<CourseOffering[]>(TERM_OFFERINGS)
  const [syncedOfferings, setSyncedOfferings] = useState<CourseOffering[]>(TERM_OFFERINGS)

  const courses = useMemo(
    () =>
      [...syncedOfferings].sort((a, b) =>
        courseLabelOf(a).localeCompare(courseLabelOf(b), undefined, { numeric: true }),
      ),
    [syncedOfferings],
  )

  // The demo conflict rides a LOCAL surveys array — shared fixtures untouched.
  const demoSurveys = useMemo(() => [...surveys, DEMO_LIVE_SURVEY], [surveys])

  // ── Auto-assignment (ST-02) ────────────────────────────────────────────────
  // Per course TYPE, over published templates only: 0 matches = unassigned
  // ("No templates for this course type"); exactly 1 = auto-assign it; 2+ =
  // auto-assign the isDefaultForType one, else unassigned (documented call —
  // no first-published or cross-type fallback, ever).
  const defaults = useMemo(() => {
    const out: Record<string, string> = {}
    for (const o of TERM_OFFERINGS) {
      const matches = publishedTemplates.filter(t => templateMatchesType(t, o))
      if (matches.length === 1) out[o.id] = matches[0].id
      else if (matches.length > 1) out[o.id] = matches.find(t => t.isDefaultForType)?.id ?? ''
      else out[o.id] = ''
    }
    return out
  }, [publishedTemplates])

  // Explicit per-course assignment; '' explicitly overrides the type default
  // (used to force a fresh manual pick after re-including an excluded course,
  // and by the resume path when the saved template is no longer published).
  const [assignments, setAssignments] = useState<Record<string, string>>({})

  const effectiveTemplateIdOf = (o: CourseOffering) => assignments[o.id] ?? defaults[o.id] ?? ''

  // ── Selection state ────────────────────────────────────────────────────────
  const [excludedCourses, setExcludedCourses] = useState<Set<string>>(new Set())
  // Sticky per-unit map (ST-02): absence = untouched; the seeding effect below
  // gives every rendered unit an entry so Refresh never mistakes an existing
  // untouched unit for a brand-new one.
  const [unitSelections, setUnitSelections] = useState<UnitSelectionMap>({})
  const [autoUpdateOn, setAutoUpdateOn] = useState(false)

  const unitSelected = (i: SurveyInstance) =>
    (unitSelections[i.key] ?? (i.status === 'new' ? 'selected' : 'deselected')) === 'selected'

  /** Drop every unit entry belonging to one offering (template change, course
   *  re-inclusion). Keys are `offeringId|…`. */
  const wipeUnits = (offeringIds: ReadonlySet<string>) =>
    setUnitSelections(prev => {
      const next: UnitSelectionMap = {}
      for (const [k, v] of Object.entries(prev)) {
        if (!offeringIds.has(k.slice(0, k.indexOf('|')))) next[k] = v
      }
      return next
    })

  // ── Expand + classify ──────────────────────────────────────────────────────
  const rows = useMemo<CourseRow[]>(() => {
    return courses.map(o => {
      const typeMatches = publishedTemplates.filter(t => templateMatchesType(t, o))
      const templateId = effectiveTemplateIdOf(o)
      // A stale assignment to a now-unpublished/archived template must NEVER
      // silently read as ready (the old Continue-gate bypass): resolve strictly
      // against the published map and block when the id no longer resolves.
      const template = templateId ? (publishedById.get(templateId) ?? null) : null
      const instances = template ? expandInstances(o, template, demoSurveys, templates) : []
      const duplicates = instances.filter(i => i.status === 'duplicate')
      const gaps = instances.filter(i => i.status === 'gap')
      const fresh = instances.filter(i => i.status === 'new')
      const { code, name } = splitLabel(o)

      let blockKind: BlockKind = null
      let reason: string | null = null
      if (!template) {
        const staleName = templateId ? templates.find(t => t.id === templateId)?.name : undefined
        if (templateId && staleName) {
          blockKind = 'templateUnpublished'
          reason = `"${staleName}" is no longer published. Assign a published template.`
        } else {
          blockKind = 'noTemplate'
          reason = typeMatches.length === 0 ? 'No templates for this course type' : 'No template assigned'
        }
      } else if (duplicates.length > 0) {
        blockKind = 'overlap'
        const labels = [...new Set(duplicates.map(roleName))]
        const status = duplicates[0].existing ? storyStatusOf(duplicates[0].existing) : 'live'
        reason = `${joinList(labels)} already covered by ${STORY_WORD[status] ?? 'an existing survey'}`
      } else if (instances.length > 0 && fresh.length === 0 && instances.every(i => i.status === 'gap')) {
        // Faculty-only template with zero people staffed anywhere — a hard
        // block, distinct from a partial gap (which stays informational).
        blockKind = 'noEvaluatees'
        reason = 'No one is staffed for the roles this template evaluates'
      }

      let section: SectionId = 'ready'
      if (blockKind) section = 'blocked'
      else if (gaps.length > 0) {
        section = 'needsFaculty'
        reason = `${joinList([...new Set(gaps.map(roleName))])} unassigned`
      }

      // ST-02: every selectable unit deselected = the course is automatically
      // deselected — out of the push, the counts, and the block checks.
      const autoSkipped = fresh.length > 0 && fresh.every(i => !unitSelected(i))

      return {
        offering: o, code, name, templateId, template, typeMatches,
        instances, fresh, gaps, duplicates, section, blockKind, reason, autoSkipped,
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courses, assignments, defaults, publishedTemplates, publishedById, demoSurveys, templates, unitSelections])

  // Eager first-sight seeding: 'new' units arrive selected, gaps and
  // duplicates deselected. An existing entry is never overwritten here.
  useEffect(() => {
    setUnitSelections(prev => {
      let changed = false
      const next = { ...prev }
      for (const r of rows) {
        for (const i of r.instances) {
          if (next[i.key] !== undefined) continue
          next[i.key] = i.status === 'new' ? 'selected' : 'deselected'
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [rows])

  const bySection = useMemo(() => {
    const m: Record<SectionId, CourseRow[]> = { blocked: [], needsFaculty: [], ready: [] }
    for (const r of rows) m[r.section].push(r)
    return m
  }, [rows])

  // Sections 1 + 2 open by default (they need review); Ready starts collapsed.
  const [open, setOpen] = useState<Record<SectionId, boolean>>({
    blocked: true,
    needsFaculty: true,
    ready: false,
  })
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [expandedChips, setExpandedChips] = useState<Set<string>>(new Set())

  const toggleIn = (setter: Dispatch<SetStateAction<Set<string>>>) => (id: string) =>
    setter(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const toggleExpandedRow = toggleIn(setExpandedRows)
  const toggleExpandedChips = toggleIn(setExpandedChips)

  const isExcluded = (r: CourseRow) => excludedCourses.has(r.offering.id) || r.autoSkipped

  // ── Continue gate (per course, ST-02) ──────────────────────────────────────
  // Disabled while ANY included course is blocked (missing/unpublished
  // template, role overlap, or zero staffed evaluatees), or nothing at all
  // would be created. Faculty gaps alone never block.
  const includedRows = rows.filter(r => !isExcluded(r))
  const unresolvedBlocked = includedRows.filter(r => r.blockKind !== null)
  const unitsToCreate = includedRows.reduce(
    (n, r) => n + r.fresh.filter(i => unitSelected(i)).length,
    0,
  )
  const excludedCount = rows.length - includedRows.length
  const continueDisabled = unresolvedBlocked.length > 0 || unitsToCreate === 0

  // ── Handlers: course + unit + template selection ───────────────────────────

  function handleCourseCheckedChange(row: CourseRow, on: boolean) {
    const id = row.offering.id
    if (on) {
      if (excludedCourses.has(id)) {
        // Re-selecting a previously excluded course restores NOTHING (ST-02):
        // template assignment and unit selections are both cleared, forcing a
        // fresh manual template pick and fresh default unit selection.
        setExcludedCourses(prev => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
        setAssignments(prev => ({ ...prev, [id]: '' }))
        wipeUnits(new Set([id]))
      } else if (row.autoSkipped) {
        // Re-checking an auto-skipped course reselects all its units.
        setUnitSelections(prev => {
          const next = { ...prev }
          for (const i of row.fresh) next[i.key] = 'selected'
          return next
        })
      }
    } else {
      setExcludedCourses(prev => new Set(prev).add(id))
    }
  }

  function handleTemplateChange(offeringId: string, templateId: string) {
    setAssignments(prev => ({ ...prev, [offeringId]: templateId }))
    // ST-02: changing a course's template clears its unit selections entirely.
    // The new template's coverage starts from the everything-selected default;
    // nothing carries forward, even for a shared role or person.
    wipeUnits(new Set([offeringId]))
  }

  // ── Reset to defaults (AlertDialog, irreversible) ──────────────────────────
  const [resetOpen, setResetOpen] = useState(false)
  const resetChanges = rows.filter(r => r.templateId !== (defaults[r.offering.id] ?? ''))
  function handleResetDefaults() {
    // EVERY course returns to its type default in one shot; a course whose
    // effective template changes also loses its unit selections.
    const changed = new Set(resetChanges.map(r => r.offering.id))
    setAssignments({})
    if (changed.size > 0) wipeUnits(changed)
    setResetOpen(false)
  }

  // ── Auto Update + Refresh (ST-02) ──────────────────────────────────────────
  function handleRefresh() {
    // The ONLY re-sync trigger. Re-derive the unit list from the simulated
    // PRISM truth, reconcile the sticky map (new unit: selected when the flag
    // is on, deselected when off; removed unit: dropped regardless; touched
    // unit: never changed), then adopt the fresh data as the rendered snapshot.
    const freshInstances = prismOfferings.flatMap(o => {
      const tid = effectiveTemplateIdOf(o)
      const t = tid ? (publishedById.get(tid) ?? null) : null
      return t ? expandInstances(o, t, demoSurveys, templates) : []
    })
    setUnitSelections(prev => reconcileUnitsOnRefresh(prev, freshInstances, autoUpdateOn))
    setSyncedOfferings(prismOfferings)
  }

  // ── Save as draft / resume (sessionStorage simulation) ─────────────────────
  const [savedDraft, setSavedDraft] = useState<SavedDraft | null>(null)
  const [draftBannerVisible, setDraftBannerVisible] = useState(false)
  const [driftNotices, setDriftNotices] = useState<DriftNotice[]>([])
  const [draftSavedAtDisplay, setDraftSavedAtDisplay] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY)
      if (raw) {
        setSavedDraft(JSON.parse(raw) as SavedDraft)
        setDraftBannerVisible(true)
      }
    } catch {
      // Ignore malformed storage — the demo starts fresh.
    }
  }, [])

  function handleSaveDraft() {
    const snapshots: SavedDraft['snapshots'] = {}
    for (const r of rows) {
      if (!r.template) continue
      snapshots[r.offering.id] = {
        templateId: r.template.id,
        templateName: r.template.name,
        criteria: templateCriteria(r.template),
      }
    }
    const draft: SavedDraft = {
      savedAt: new Date().toISOString(),
      assignments: Object.fromEntries(rows.map(r => [r.offering.id, r.templateId])),
      unitSelections,
      autoUpdateOn,
      excludedCourseIds: [...excludedCourses],
      snapshots,
    }
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    } catch {
      // Storage unavailable — the in-memory copy still drives the demo.
    }
    setSavedDraft(draft)
    setDraftBannerVisible(false)
    setDraftSavedAtDisplay(
      new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    )
  }

  function handleResumeDraft() {
    if (!savedDraft) return
    const restoredAssignments = { ...savedDraft.assignments }
    // Aggregate notices by template + kind + roles so one archived or edited
    // template raises ONE banner line naming its courses, not a line per row.
    const noticeMap = new Map<string, DriftNotice>()
    const addNotice = (n: Omit<DriftNotice, 'courseCodes'>, code: string) => {
      const key = `${n.kind}|${n.templateName}|${n.addedRoleLabels.join(',')}`
      const existing = noticeMap.get(key)
      if (existing) existing.courseCodes.push(code)
      else noticeMap.set(key, { ...n, courseCodes: [code] })
    }
    for (const [offeringId, snap] of Object.entries(savedDraft.snapshots)) {
      const offering = TERM_OFFERINGS.find(o => o.id === offeringId)
      const code = offering ? splitLabel(offering).code : offeringId
      const current = publishedById.get(snap.templateId) ?? null
      if (!current) {
        // Template unpublished/archived/deleted since the draft was saved —
        // the row reverts to "no template assigned" and blocks.
        restoredAssignments[offeringId] = ''
        addNotice({ templateName: snap.templateName, kind: 'unpublished', addedRoleLabels: [] }, code)
      } else {
        const snapSet = new Set(snap.criteria)
        const added = templateCriteria(current).filter(c => !snapSet.has(c))
        if (added.length > 0) {
          addNotice(
            {
              templateName: current.name,
              kind: 'updated',
              addedRoleLabels: added.map(c => CRITERION_TOGGLE_LABEL[c as Criterion] ?? c),
            },
            code,
          )
        }
      }
    }
    const notices = [...noticeMap.values()]
    setAssignments(restoredAssignments)
    setUnitSelections(savedDraft.unitSelections)
    setAutoUpdateOn(savedDraft.autoUpdateOn)
    setExcludedCourses(new Set(savedDraft.excludedCourseIds))
    setDriftNotices(notices)
    setDraftBannerVisible(false)
    setDraftSavedAtDisplay(
      new Date(savedDraft.savedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    )
  }

  function handleStartFresh() {
    try {
      sessionStorage.removeItem(DRAFT_KEY)
    } catch {
      // Ignore.
    }
    setSavedDraft(null)
    setDraftBannerVisible(false)
  }

  // ── Demo controls (clearly demo-only) ──────────────────────────────────────
  const demoCourse = TERM_OFFERINGS.find(o => o.id === DEMO_PRISM_COURSE_ID)
  const demoCourseCode = demoCourse ? splitLabel(demoCourse).code : DEMO_PRISM_COURSE_ID
  const demoCoInstructorAdded = prismOfferings.some(
    o => o.id === DEMO_PRISM_COURSE_ID && (o.coInstructorIds ?? []).includes(DEMO_PRISM_FACULTY_ID),
  )

  function demoAddCoInstructor() {
    setPrismOfferings(prev =>
      prev.map(o =>
        o.id === DEMO_PRISM_COURSE_ID
          ? { ...o, coInstructorIds: [...(o.coInstructorIds ?? []), DEMO_PRISM_FACULTY_ID] }
          : o,
      ),
    )
  }

  function demoRemoveCoInstructor() {
    setPrismOfferings(prev =>
      prev.map(o =>
        o.id === DEMO_PRISM_COURSE_ID
          ? { ...o, coInstructorIds: (o.coInstructorIds ?? []).filter(id => id !== DEMO_PRISM_FACULTY_ID) }
          : o,
      ),
    )
  }

  function demoSimulateTemplateGainedRole() {
    // Make the stored draft read as OLDER than the template: remove one
    // criterion from a saved snapshot, so the current template appears to have
    // gained that role since the save. Resume then raises the drift notice.
    if (!savedDraft) return
    const next: SavedDraft = { ...savedDraft, snapshots: { ...savedDraft.snapshots } }
    const entry = Object.entries(next.snapshots).find(([, s]) => s.criteria.length > 1)
      ?? Object.entries(next.snapshots)[0]
    if (!entry) return
    const [offeringId, snap] = entry
    // Prefer dropping a faculty criterion so the notice names a role.
    const dropped = [...snap.criteria].reverse().find(c => c !== 'students') ?? snap.criteria[0]
    next.snapshots[offeringId] = { ...snap, criteria: snap.criteria.filter(c => c !== dropped) }
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(next))
    } catch {
      // Ignore.
    }
    setSavedDraft(next)
    setDraftBannerVisible(true)
  }

  function demoSimulateTemplateArchived() {
    // Archive (locally, demo overlay only) the template the saved draft leans
    // on. Any row EXPLICITLY holding it reverts to "no template assigned" and
    // blocks immediately; resuming the draft raises the notice. Gated on a
    // saved draft: without one, never-touched rows would just re-default to
    // the surviving template and the block would never be visible.
    const target = savedDraft && Object.values(savedDraft.snapshots)[0]?.templateId
    if (!target) return
    setDemoArchivedIds(prev => new Set(prev).add(target))
    setDraftBannerVisible(true)
  }

  function demoReset() {
    setPrismOfferings(TERM_OFFERINGS)
    setSyncedOfferings(TERM_OFFERINGS)
    setDemoArchivedIds(new Set())
  }

  // ── Embedded template creation (same flow as the production step) ──────────
  const [subView, setSubView] = useState<'main' | 'create' | { buildId: string }>('main')
  const [publishNotice, setPublishNotice] = useState<string | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<PceTemplate | null>(null)

  if (subView !== 'main') {
    return (
      <div className="flex flex-col gap-3">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setSubView('main')}
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
              setPublishNotice(t?.name || 'Template')
              setSubView('main')
            }}
          />
        )}
      </div>
    )
  }

  const sections: {
    id: SectionId
    title: string
    icon: string
    discBg: string
    discFg: string
  }[] = [
    {
      id: 'blocked',
      title: 'Blocked',
      icon: 'fa-ban',
      discBg: 'var(--icon-disc-danger-bg)',
      discFg: 'var(--icon-disc-danger-fg)',
    },
    {
      id: 'needsFaculty',
      title: 'Needs faculty',
      icon: 'fa-user-slash',
      discBg: 'var(--icon-disc-chart-4-bg)',
      discFg: 'var(--icon-disc-chart-4-fg)',
    },
    {
      id: 'ready',
      title: 'Ready',
      icon: 'fa-circle-check',
      discBg: 'var(--muted)',
      discFg: 'var(--muted-foreground)',
    },
  ]

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 p-6">
      {/* Step header + screen-level actions */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <p className="text-xs text-muted-foreground">Step 2 of 3 · Survey design</p>
          <h1 className="text-lg font-semibold text-foreground">Confirm what each course will evaluate</h1>
          <p className="text-sm text-muted-foreground">
            {term?.name ?? 'Fall 2026'} · {rows.length} courses selected in step 1. Courses are grouped by
            what they need before the push.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {draftSavedAtDisplay && (
            <span className="text-xs tabular-nums text-muted-foreground">
              Draft saved at {draftSavedAtDisplay}
            </span>
          )}
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => setResetOpen(true)}>
            <i className="fa-light fa-arrow-rotate-left text-xs" aria-hidden="true" />
            Reset to defaults
          </Button>
          <Button variant="outline" size="sm" onClick={handleSaveDraft}>
            Save as draft
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setPublishNotice(null); setSubView('create') }}>
            <i className="fa-light fa-plus" aria-hidden="true" />
            New template
          </Button>
        </div>
      </div>

      {/* Resume banner — offered on load (and after a demo drift/archive
          simulation) whenever a saved draft exists. */}
      {draftBannerVisible && savedDraft && (
        <LocalBanner variant="info">
          <span className="flex flex-wrap items-center gap-2">
            <span>
              Draft saved at{' '}
              {new Date(savedDraft.savedAt).toLocaleString('en-US', {
                month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
              })}
              .
            </span>
            <Button variant="outline" size="xs" onClick={handleResumeDraft}>
              Resume draft
            </Button>
            <Button variant="ghost" size="xs" onClick={handleStartFresh}>
              Start fresh
            </Button>
          </span>
        </LocalBanner>
      )}

      {/* Template drift notices (resume path) — dismissible, informational. */}
      {driftNotices.length > 0 && (
        <LocalBanner variant="info" dismissible onDismiss={() => setDriftNotices([])}>
          <span className="flex flex-col gap-1">
            {driftNotices.map(n => (
              <span key={`${n.kind}-${n.templateName}-${n.addedRoleLabels.join(',')}`}>
                {n.kind === 'updated' ? (
                  <>
                    &ldquo;{n.templateName}&rdquo; changed since this draft was saved. It now also
                    covers {joinList(n.addedRoleLabels)}. Faculty coverage below reflects the
                    current template.
                  </>
                ) : (
                  <>
                    &ldquo;{n.templateName}&rdquo; is no longer published. Assign a published
                    template to{' '}
                    {n.courseCodes.length > 3
                      ? `${n.courseCodes.length} courses`
                      : joinList(n.courseCodes)}{' '}
                    to continue.
                  </>
                )}
              </span>
            ))}
          </span>
        </LocalBanner>
      )}

      {publishNotice && (
        <LocalBanner variant="success" dismissible onDismiss={() => setPublishNotice(null)}>
          &ldquo;{publishNotice}&rdquo; is published. Assign it in the course list below.
        </LocalBanner>
      )}

      {/* Auto Update — ONE flag for the whole screen. Flipping it does nothing
          by itself; it only decides how units the rows have not seen before
          arrive on the next manual Refresh (the Refresh control sits under the
          Needs faculty section, beside the gap rows it re-checks). */}
      <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3">
        <label htmlFor="vb-auto-update" className="flex cursor-pointer items-center gap-2.5">
          <ToggleSwitch
            id="vb-auto-update"
            checked={autoUpdateOn}
            onChange={() => setAutoUpdateOn(!autoUpdateOn)}
          />
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">Auto Update</span>
            <span className="text-xs text-muted-foreground">
              Faculty found on the next refresh start selected. Selections you have already made never change.
            </span>
          </span>
        </label>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-3">
        {sections.map(s => {
          const sectionRows = bySection[s.id]
          return (
            <div key={s.id} className="flex flex-col gap-2">
              <Collapsible
                open={open[s.id]}
                onOpenChange={v => setOpen(prev => ({ ...prev, [s.id]: v }))}
                className="rounded-lg border border-border bg-card"
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="default"
                    className="h-auto w-full justify-start gap-3 rounded-lg px-4 py-3"
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                      style={{ background: s.discBg, color: s.discFg }}
                    >
                      <i className={`fa-light ${s.icon} text-[13px]`} aria-hidden="true" />
                    </span>
                    <span className="text-sm font-medium text-foreground">{s.title}</span>
                    <span className="text-sm text-muted-foreground">
                      {sectionRows.length} {sectionRows.length === 1 ? 'course' : 'courses'}
                    </span>
                    {s.id === 'blocked' && sectionRows.some(r => !isExcluded(r)) && (
                      <span className="text-xs" style={{ color: 'var(--chip-destructive)' }}>
                        Continue is disabled while these stay included
                      </span>
                    )}
                    <i
                      className={cn(
                        'fa-light fa-chevron-down ml-auto text-xs text-muted-foreground transition-transform',
                        open[s.id] && 'rotate-180',
                      )}
                      aria-hidden="true"
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  {sectionRows.length === 0 ? (
                    <p className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
                      No courses in this group.
                    </p>
                  ) : (
                    <ul className="border-t border-border">
                      {sectionRows.map(row => (
                        <CourseRowItem
                          key={row.offering.id}
                          row={row}
                          sectionId={s.id}
                          excluded={isExcluded(row)}
                          manuallyExcluded={excludedCourses.has(row.offering.id)}
                          onCourseCheckedChange={on => handleCourseCheckedChange(row, on)}
                          isExpanded={expandedRows.has(row.offering.id)}
                          onToggleExpanded={() => toggleExpandedRow(row.offering.id)}
                          chipsExpanded={expandedChips.has(row.offering.id)}
                          onToggleChips={() => toggleExpandedChips(row.offering.id)}
                          defaultTemplateId={defaults[row.offering.id] ?? ''}
                          onTemplateChange={tid => handleTemplateChange(row.offering.id, tid)}
                          unitSelected={unitSelected}
                          onUnitToggle={(key, on) =>
                            setUnitSelections(prev => ({ ...prev, [key]: on ? 'selected' : 'deselected' }))
                          }
                          onPreview={() => row.template && setPreviewTemplate(row.template)}
                        />
                      ))}
                    </ul>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* Refresh — under the faculty-gap section, the only re-sync. */}
              {s.id === 'needsFaculty' && (
                <div className="flex items-center justify-end gap-2.5 px-1">
                  <span className="text-xs text-muted-foreground">Recheck faculty assignments in Prism.</span>
                  <Button variant="outline" size="sm" onClick={handleRefresh}>
                    Refresh
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
        <p className="text-sm text-muted-foreground tabular-nums">
          {unitsToCreate} {unitsToCreate === 1 ? 'evaluation' : 'evaluations'} will be created across{' '}
          {includedRows.length} {includedRows.length === 1 ? 'course' : 'courses'}
          {excludedCount > 0 && ` · ${excludedCount} skipped`}
        </p>
        <div className="ml-auto flex items-center gap-2">
          {unresolvedBlocked.length > 0 ? (
            <p className="text-xs" style={{ color: 'var(--chip-destructive)' }}>
              Resolve or exclude {unresolvedBlocked.length === 1 ? 'the blocked course' : `the ${unresolvedBlocked.length} blocked courses`} to continue
            </p>
          ) : unitsToCreate === 0 ? (
            <p className="text-xs text-muted-foreground">Select at least one evaluation to continue</p>
          ) : null}
          <Button variant="outline" size="sm">
            Back
          </Button>
          <Button variant="default" size="sm" disabled={continueDisabled}>
            Continue
          </Button>
        </div>
      </div>

      {/* Demo controls — scaffolding for this static-fixture compare page,
          deliberately styled apart from the product UI above. */}
      <div className="rounded-lg border border-dashed border-border px-4 py-3">
        <p className="text-xs font-medium text-muted-foreground">Simulate PRISM changes (demo only)</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button variant="outline" size="xs" disabled={demoCoInstructorAdded} onClick={demoAddCoInstructor}>
            Add a co-instructor to {demoCourseCode} in Prism
          </Button>
          <Button variant="outline" size="xs" disabled={!demoCoInstructorAdded} onClick={demoRemoveCoInstructor}>
            Remove that co-instructor from Prism
          </Button>
          <Button variant="outline" size="xs" disabled={!savedDraft} onClick={demoSimulateTemplateGainedRole}>
            Simulate: template gained a new role since this draft was saved
          </Button>
          <Button
            variant="outline"
            size="xs"
            disabled={!savedDraft || demoArchivedIds.size > 0}
            onClick={demoSimulateTemplateArchived}
          >
            Simulate: template archived since this draft was saved
          </Button>
          <Button variant="ghost" size="xs" onClick={demoReset}>
            Reset demo data
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Prism changes reach the list only after Refresh. The Auto Update flag decides whether a
          newly found faculty member arrives selected or deselected.
        </p>
      </div>

      {/* Preview Survey — template-backed dialog; no survey title exists yet. */}
      <SurveyPreviewDialog
        template={previewTemplate}
        open={previewTemplate !== null}
        onOpenChange={o => { if (!o) setPreviewTemplate(null) }}
      />

      {/* Reset to defaults — irreversible once confirmed, so it itemizes what
          will change instead of a generic confirmation. */}
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset all templates to defaults?</AlertDialogTitle>
            <AlertDialogDescription>
              {resetChanges.length > 0 ? (
                <>
                  {resetChanges.length} {resetChanges.length === 1 ? 'course' : 'courses'} (
                  {joinList(resetChanges.slice(0, 4).map(r => r.code))}
                  {resetChanges.length > 4 ? ` and ${resetChanges.length - 4} more` : ''}) will return
                  to the default template for {resetChanges.length === 1 ? 'its' : 'their'} course
                  type, and the evaluatee selections on {resetChanges.length === 1 ? 'that course' : 'those courses'} will
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
              variant={resetChanges.length > 0 ? 'destructive' : 'default'}
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

// ── Row ──────────────────────────────────────────────────────────────────────

function CourseRowItem({
  row,
  sectionId,
  excluded,
  manuallyExcluded,
  onCourseCheckedChange,
  isExpanded,
  onToggleExpanded,
  chipsExpanded,
  onToggleChips,
  defaultTemplateId,
  onTemplateChange,
  unitSelected,
  onUnitToggle,
  onPreview,
}: {
  row: CourseRow
  sectionId: SectionId
  excluded: boolean
  manuallyExcluded: boolean
  onCourseCheckedChange: (on: boolean) => void
  isExpanded: boolean
  onToggleExpanded: () => void
  chipsExpanded: boolean
  onToggleChips: () => void
  defaultTemplateId: string
  onTemplateChange: (templateId: string) => void
  unitSelected: (i: SurveyInstance) => boolean
  onUnitToggle: (key: string, on: boolean) => void
  onPreview: () => void
}) {
  const selectedCount = row.fresh.filter(i => unitSelected(i)).length
  const checkboxState: boolean | 'indeterminate' = manuallyExcluded
    ? false
    : row.fresh.length > 0
      ? selectedCount === row.fresh.length
        ? true
        : selectedCount > 0
          ? 'indeterminate'
          : false
      : true
  // Severity-distinct row treatment: red left strip for hard blocks, amber for
  // faculty gaps. Left strip only, never a background wash (settled contrast rule).
  const strip =
    row.blockKind !== null
      ? { boxShadow: 'inset 3px 0 0 var(--chip-destructive)' }
      : sectionId === 'needsFaculty'
        ? { boxShadow: 'inset 3px 0 0 var(--chip-4)' }
        : undefined
  const reasonColor = row.blockKind !== null ? 'var(--chip-destructive)' : 'var(--chip-4)'

  const previewButton = (
    <Button
      variant="ghost"
      size="sm"
      className="shrink-0"
      disabled={!row.template}
      onClick={onPreview}
    >
      Preview
      <span className="sr-only">
        {row.template ? ` the survey for ${row.code}` : '. Assign a template to preview.'}
      </span>
    </Button>
  )

  return (
    <li
      className={cn('border-b border-border last:border-b-0', excluded && 'opacity-50')}
      style={strip}
    >
      <div className="flex items-start gap-3 px-4 py-2.5">
        <Checkbox
          size="sm"
          className="mt-0.5"
          checked={checkboxState}
          onCheckedChange={v => onCourseCheckedChange(v !== false)}
          aria-label={`Include ${row.code} in this push`}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className="truncate text-sm text-foreground">
            <span className="font-mono text-[13px]">{row.code}</span>
            {row.name && <span className="text-muted-foreground"> · {row.name}</span>}
          </p>
          {sectionId !== 'ready' && row.reason && (
            <p className="truncate text-xs" style={{ color: reasonColor }}>
              {row.reason}
            </p>
          )}
          {/* Evaluatee units as checkbox chips, capped at CHIP_CAP. */}
          {row.fresh.length > 0 ? (
            <UnitChipsRow
              items={row.fresh}
              code={row.code}
              disabled={manuallyExcluded}
              expanded={chipsExpanded}
              onToggleExpanded={onToggleChips}
              unitSelected={unitSelected}
              onUnitToggle={onUnitToggle}
            />
          ) : row.templateId && row.blockKind === null ? (
            <span className="text-xs text-muted-foreground">No one to evaluate yet</span>
          ) : null}
          {row.autoSkipped && !manuallyExcluded && (
            <span className="text-xs text-muted-foreground">
              Skipped. Every evaluatee is deselected, so this course will not be pushed.
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Select
            value={row.typeMatches.some(t => t.id === row.templateId) ? row.templateId : undefined}
            onValueChange={onTemplateChange}
          >
            <SelectTrigger size="sm" className="w-44 shrink-0" aria-label={`Template for ${row.code}`}>
              <SelectValue placeholder="Choose template" />
            </SelectTrigger>
            <SelectContent>
              {/* Options are FILTERED to this course's own type — a
                  mismatched-type template is never selectable (ST-02). */}
              {row.typeMatches.length === 0 && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  No templates for this course type
                </div>
              )}
              {row.typeMatches.map(t => (
                <SelectItem key={t.id} value={t.id}>
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate">{t.name}</span>
                    {t.id === defaultTemplateId && (
                      <Badge variant="secondary" className="shrink-0" style={{ fontSize: 12, paddingInline: 6, paddingBlock: 1 }}>
                        Default
                      </Badge>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {row.template ? (
            previewButton
          ) : (
            <Tip label="Assign a template to preview" side="left">
              {/* Disabled buttons swallow pointer/focus events — the focusable
                  wrapper carries the tooltip and a visible focus ring. */}
              <span
                className="inline-flex rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                tabIndex={0}
              >
                {previewButton}
              </span>
            </Tip>
          )}

          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0"
            onClick={onToggleExpanded}
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? 'Hide' : 'Show'} role breakdown for ${row.code}`}
          >
            <i
              className={cn(
                'fa-light fa-chevron-down text-xs transition-transform',
                isExpanded && 'rotate-180',
              )}
              aria-hidden="true"
            />
          </Button>
        </div>
      </div>

      {/* Per-role breakdown — read-only (selection lives in the chips above).
          Evaluate? answers Yes in the teal confirmed treatment for clear roles
          and a muted No for blocked ones. */}
      {isExpanded && (
        <div className="mx-4 mb-3 rounded-md border border-border bg-background">
          {row.instances.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              Assign a template to plan this course&rsquo;s evaluations.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-[64px_1fr_1fr_1fr] gap-2 border-b border-border px-3 py-1.5 text-xs text-muted-foreground">
                <span>Evaluate?</span>
                <span>Role</span>
                <span>Assigned</span>
                <span>Covered by</span>
              </div>
              {row.instances.map(i => (
                <div
                  key={i.key}
                  className="grid grid-cols-[64px_1fr_1fr_1fr] items-center gap-2 border-b border-border px-3 py-1.5 text-sm last:border-b-0"
                >
                  <span>
                    {i.status === 'duplicate' ? (
                      <span
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
                      >
                        No
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{ background: 'var(--icon-disc-chart-2-bg)', color: 'var(--chip-2)' }}
                      >
                        Yes
                      </span>
                    )}
                  </span>
                  <span className="text-foreground">{roleName(i)}</span>
                  <span className="flex min-w-0 items-center gap-1.5">
                    {i.scope === 'course' ? (
                      <span className="text-muted-foreground">
                        {row.offering.enrolledCount} students
                      </span>
                    ) : i.personName ? (
                      <>
                        <PersonAvatar name={i.personName} />
                        <span className="truncate text-foreground">{i.personName}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">No one assigned</span>
                    )}
                  </span>
                  <span>
                    {i.existing ? (
                      <StoryStatusBadgeOS status={storyStatusOf(i.existing)} size="sm" />
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </li>
  )
}

// ── Unit chips (checkbox chip per evaluatee unit, capped) ────────────────────

function UnitChipsRow({ items, code, disabled, expanded, onToggleExpanded, unitSelected, onUnitToggle }: {
  items: SurveyInstance[]
  code: string
  disabled: boolean
  expanded: boolean
  onToggleExpanded: () => void
  unitSelected: (i: SurveyInstance) => boolean
  onUnitToggle: (key: string, on: boolean) => void
}) {
  const visible = expanded ? items : items.slice(0, CHIP_CAP)
  const hidden = items.length - CHIP_CAP
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-1.5">
      {visible.map(i => (
        <UnitChip
          key={i.key}
          item={i}
          code={code}
          disabled={disabled}
          checked={unitSelected(i)}
          onToggle={() => onUnitToggle(i.key, !unitSelected(i))}
        />
      ))}
      {hidden > 0 && (
        <Button
          variant="ghost"
          size="xs"
          className="text-muted-foreground hover:text-foreground"
          aria-expanded={expanded}
          onClick={onToggleExpanded}
        >
          {expanded ? 'Show less' : `+${hidden} more`}
        </Button>
      )}
    </span>
  )
}

function UnitChip({ item, code, disabled, checked, onToggle }: {
  item: SurveyInstance
  code: string
  disabled: boolean
  checked: boolean
  onToggle: () => void
}) {
  const cbId = `vb-unit-${item.key.replace(/[^a-zA-Z0-9_-]/g, '-')}`
  const name = item.scope === 'course' ? 'Course material' : (item.personName ?? '')
  const ariaLabel = item.scope === 'course'
    ? `Evaluate course material in ${code}`
    : `Evaluate ${name}, ${item.roleLabel}, in ${code}`
  return (
    <span
      className="inline-flex min-w-0 items-center gap-1.5 rounded-full border py-0.5 ps-1.5 pe-2.5"
      style={{
        borderColor: 'var(--border)',
        background: checked ? 'var(--brand-tint)' : 'var(--background)',
      }}
    >
      <Checkbox
        id={cbId}
        size="sm"
        checked={checked}
        disabled={disabled}
        onCheckedChange={onToggle}
        aria-label={ariaLabel}
      />
      <label htmlFor={cbId} className="inline-flex min-w-0 cursor-pointer items-center gap-1.5 text-xs">
        {item.scope === 'course' ? (
          <span className="flex size-4 shrink-0 items-center justify-center rounded-full border border-border bg-background">
            <i className="fa-light fa-book-open text-[8px] text-muted-foreground" aria-hidden="true" />
          </span>
        ) : (
          <PersonAvatar name={item.personName!} className="size-4" />
        )}
        <span className="truncate">{name}</span>
        {item.roleLabel && item.personName && (
          <span className="whitespace-nowrap text-muted-foreground">· {item.roleLabel}</span>
        )}
      </label>
    </span>
  )
}
