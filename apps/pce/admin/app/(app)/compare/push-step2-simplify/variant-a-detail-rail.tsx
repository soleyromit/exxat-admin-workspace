'use client'

// COMPARE VARIANT A — "Minimal list + detail rail" (throwaway; delete once a
// direction is picked, same lifecycle as /compare/push-survey-design).
//
// Thesis: the list stays trivially simple — one compact row per course with a
// single status word — and ALL complexity (units, gaps, conflicts, preview)
// defers to a fixed master-detail rail on the right. Analogy: Mixpanel event
// list + slide-over detail, Asana list + task panel.
//
// Aug 3 completion pass — brought to FULL ST-02 functional parity so the
// variant can be USED end to end, not just looked at. Everything below is the
// real behavior (same engine as production: expandInstances /
// roleOverlapConflicts / reconcileUnitsOnRefresh); only the "Demo controls"
// panel is simulation scaffolding, and it is visibly boxed and labeled.
//
// Documented decisions (each mirrors the production step or the
// implementation-plan record where one exists):
//  · Type default (ST-02 auto-assign): exact courseType matches win; a
//    template with courseType 'any' (or none) is a candidate for every course
//    type — without this, the all-'any' fixture set would leave every row
//    unassigned. Among 2+ candidates, isDefaultForType wins, else the FIRST
//    match (implementation-plan decision #2, same as production
//    pickTemplateForType). Zero candidates leaves the course unassigned with
//    the exact "No templates for this course type" copy. No global
//    first-published fallback (deliberate ST-02 deviation from production).
//  · The picker lists only the course's own type candidates (exact + 'any').
//    A mismatched-type template is never selectable.
//  · All units deselected auto-deselects the course: it leaves toCreate, the
//    block checks, and the push. It does not also block Continue — an
//    excluded course cannot block. Re-CHECKING from that derived state just
//    re-selects the units (production semantics); only an explicit uncheck
//    is a course removal with reset-on-return.
//  · Re-including an explicitly removed course clears template + units and
//    forces a fresh manual template pick (ST-02 "no restored prior state").
//    Reset to defaults is the one explicit global action that overrides this.
//  · Draft persistence is sessionStorage under a variant-scoped key: this
//    compare page has no wizard shell or sibling steps to navigate to, so
//    the storage round-trip IS the navigation-persistence simulation.
//  · Template drift notices are computed on Resume (production model); the
//    live plan always reflects the current template definitions immediately.
//
// Settled vocabulary: amber (--chip-4) strictly = missing data (soft, does not
// block); destructive (--chip-destructive) + fa-lock = hard block (Continue
// disabled until resolved). The two must never look identical (Romit-approved
// severity split; deliberate deviation from the PRD's amber-for-both note).

import { useEffect, useMemo, useState } from 'react'
import {
  Button, Checkbox, CheckboxLabel, Badge, Tip, ToggleSwitch, LocalBanner,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@exxatdesignux/ui'
import { StoryStatusBadgeOS } from '@/components/pce/pce-badges'
import { usePce } from '@/components/pce/pce-state'
import { AddInPrismButton, EmptyHint } from '@/components/pce/courses-evaluatees/scope-controls'
import { CreateBlankTemplate } from '@/components/pce/create-blank-template'
import { TemplateEditor } from '@/components/pce/template-editor'
import { SurveyPreviewDialog } from '@/components/pce/distribute-wizard/survey-preview-dialog'
import {
  MOCK_COURSE_OFFERINGS, MOCK_PROGRAM_TERMS,
  type CourseOffering, type PceSurvey, type PceTemplate, type PceTemplateSection,
} from '@/lib/pce-mock-data'
import { courseLabelOf, templateCriteria, CRITERION_TOGGLE_LABEL } from '@/lib/pce-course-readiness'
import {
  expandInstances, reconcileUnitsOnRefresh, storyStatusOf, templateStoryStatusOf,
  type SurveyInstance, type UnitSelectionMap,
} from '@/lib/pce-push-validation'

// ── Demo-only conflict seed ──────────────────────────────────────────────────
// DPT-510 (co13) only carries Scheduled fixtures (pf0/pf1/pf2), which do NOT
// block. This LOCAL Live instructor-scope survey makes its Instructor coverage
// a hard block without touching pce-mock-data.ts.
const CONFLICT_DEMO_SURVEY: PceSurvey = {
  id: 'demo-live-co13-instructor',
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

/** Variant-scoped draft key — a Save as draft here never collides with the
 *  production wizard or the sibling compare variants. */
const DRAFT_STORAGE_KEY = 'pce-compare-step2-variant-a-draft'

interface DraftPayload {
  savedAt: string
  /** Effective template per course at save time ('' = deliberately unassigned). */
  assignments: Record<string, string>
  excluded: string[]
  unitSelections: UnitSelectionMap
  autoUpdateOn: boolean
  /** templateCriteria() of each assigned template AT SAVE TIME — the drift
   *  baseline the Resume comparison runs against. */
  templateSnapshots: Record<string, string[]>
}

/** One Resume finding about a saved template, aggregated per template. */
interface DriftNotice {
  templateName: string
  kind: 'updated' | 'unpublished'
  addedRoleLabels: string[]
  removedRoleLabels: string[]
  courseCodes: string[]
}

type Blocker = 'no-template' | 'template-unpublished' | 'conflict' | 'empty'

/** "YYYY-MM-DD" → "Nov 20" without the UTC-midnight day shift. */
function fmtYmd(iso?: string): string | null {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

/** code + name split; catalog-less fixture ids (mc3/mc11) fall back to the raw id as the code. */
function splitLabel(o: CourseOffering): { code: string; name: string } {
  const label = courseLabelOf(o)
  if (!label.includes(' – ')) return { code: label, name: '' }
  const [code, ...rest] = label.split(' – ')
  return { code, name: rest.join(' – ') }
}

const unitLabel = (i: SurveyInstance) =>
  i.scope === 'course' ? 'Course material' : (i.personName ?? 'No one assigned')

const roleLabelOf = (c: string): string =>
  (CRITERION_TOGGLE_LABEL as Record<string, string>)[c] ?? c

/** Drop every unit-selection entry belonging to the given offerings (keys are
 *  `offeringId|…`). ST-02 template-change reset + course removal. */
function withoutOfferings(map: UnitSelectionMap, offeringIds: ReadonlySet<string>): UnitSelectionMap {
  const next: UnitSelectionMap = {}
  for (const [k, v] of Object.entries(map)) {
    if (!offeringIds.has(k.slice(0, k.indexOf('|')))) next[k] = v
  }
  return next
}

/** Type candidates: exact courseType matches win; 'any'/untyped templates are
 *  the fallback pool (see file-header decision). */
function typeCandidates(courseType: string | undefined, published: PceTemplate[]): PceTemplate[] {
  const exact = courseType ? published.filter(t => t.courseType === courseType) : []
  if (exact.length > 0) return exact
  return published.filter(t => !t.courseType || t.courseType === 'any')
}

/** ST-02 auto-assign: 1 candidate = it; 2+ = isDefaultForType, else first
 *  (implementation-plan decision #2); 0 = unassigned. */
function defaultTemplateFor(courseType: string | undefined, published: PceTemplate[]): PceTemplate | null {
  const c = typeCandidates(courseType, published)
  if (c.length === 0) return null
  if (c.length === 1) return c[0]
  return c.find(t => t.isDefaultForType) ?? c[0]
}

/** Demo-only local template mutations, applied over the shared store. */
interface TemplateOverride {
  archived?: boolean
  extraSections?: PceTemplateSection[]
}

// ═════════════════════════════════════════════════════════════════════════════

export default function VariantADetailRail() {
  const { templates, surveys } = usePce()

  // ── Demo template overrides (drift / archive simulations) ──────────────────
  const [templateOverrides, setTemplateOverrides] = useState<Record<string, TemplateOverride>>({})
  const effectiveTemplates = useMemo(
    () => templates.map(t => {
      const ov = templateOverrides[t.id]
      if (!ov) return t
      return {
        ...t,
        ...(ov.archived ? { archived: true } : {}),
        ...(ov.extraSections
          ? { templateSections: [...(t.templateSections ?? []), ...ov.extraSections] }
          : {}),
      }
    }),
    [templates, templateOverrides],
  )
  const publishedTemplates = useMemo(
    () => effectiveTemplates.filter(t =>
      templateStoryStatusOf(t) === 'published' &&
      (!t.surveyType || t.surveyType === 'course_evaluation')),
    [effectiveTemplates],
  )

  // ── PRISM simulation: demo mutations land in prismCourses; the rendered plan
  //    reads the SYNCED snapshot, so Refresh is genuinely the only re-sync. ───
  const term = MOCK_PROGRAM_TERMS.find(t => t.id === 'pt5')!
  const initialCourses = useMemo(
    () =>
      MOCK_COURSE_OFFERINGS
        .filter(o => o.termId === term.id && o.status !== 'archived')
        .map(o => ({ ...o }))
        .sort((a, b) => courseLabelOf(a).localeCompare(courseLabelOf(b), undefined, { numeric: true })),
    [term.id],
  )
  const [prismCourses, setPrismCourses] = useState<CourseOffering[]>(initialCourses)
  const [courses, setCourses] = useState<CourseOffering[]>(initialCourses)
  const [pendingPrismChanges, setPendingPrismChanges] = useState<string[]>([])
  const [demoApplied, setDemoApplied] = useState<Set<string>>(new Set())

  // Real fixture surveys + the local conflict seed (never mutates shared data).
  const surveysWithDemo = useMemo(() => [...surveys, CONFLICT_DEMO_SURVEY], [surveys])

  // ── Template assignment ────────────────────────────────────────────────────
  const defaults = useMemo(() => {
    const result: Record<string, string> = {}
    for (const o of courses) result[o.id] = defaultTemplateFor(o.courseType, publishedTemplates)?.id ?? ''
    return result
  }, [courses, publishedTemplates])

  // Explicit assignment wins; '' is a sentinel meaning "deliberately
  // unassigned" (suppresses the type default — used by course removal, draft
  // resume of an unpublished template, and the fresh-pick rule).
  const [assignments, setAssignments] = useState<Record<string, string>>({})
  const rawAssignmentOf = (o: CourseOffering): string =>
    assignments[o.id] !== undefined ? assignments[o.id] : (defaults[o.id] ?? '')
  /** Resolved template for a course. `stale` = assigned id exists but is no
   *  longer published (unpublished/archived/deleted) — ST-02 treats it as
   *  "no template assigned" and blocks. */
  const templateInfoOf = (o: CourseOffering): { template: PceTemplate | null; stale: boolean; staleName: string } => {
    const raw = rawAssignmentOf(o)
    if (!raw) return { template: null, stale: false, staleName: '' }
    const t = effectiveTemplates.find(x => x.id === raw) ?? null
    if (t && templateStoryStatusOf(t) === 'published') return { template: t, stale: false, staleName: '' }
    return { template: null, stale: true, staleName: t?.name ?? '' }
  }
  const pickerTemplatesFor = (o: CourseOffering): PceTemplate[] =>
    publishedTemplates.filter(t => !t.courseType || t.courseType === 'any' || t.courseType === o.courseType)

  // ── Instance plan (synced snapshot × effective templates) ──────────────────
  const byOffering = useMemo(() => {
    const m = new Map<string, SurveyInstance[]>()
    for (const o of courses) {
      m.set(o.id, expandInstances(o, templateInfoOf(o).template, surveysWithDemo, effectiveTemplates))
    }
    return m
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courses, assignments, defaults, effectiveTemplates, surveysWithDemo])
  const allInstances = useMemo(() => [...byOffering.values()].flat(), [byOffering])

  // ── Sticky per-unit selection (ST-02 Phase 2 semantics) ────────────────────
  // First sight of a unit seeds 'selected' for pushable units (ALL selected by
  // default), 'deselected' for gaps and role-overlap duplicates. An existing
  // key is never overwritten here — only the template-change reset, course
  // removal, or reconcileUnitsOnRefresh may change it.
  const [unitSelections, setUnitSelections] = useState<UnitSelectionMap>({})
  useEffect(() => {
    setUnitSelections(prev => {
      let changed = false
      const next = { ...prev }
      for (const i of allInstances) {
        if (next[i.key] !== undefined) continue
        next[i.key] = i.status === 'new' ? 'selected' : 'deselected'
        changed = true
      }
      return changed ? next : prev
    })
  }, [allInstances])
  const isSelected = (key: string) => unitSelections[key] === 'selected'
  const setUnits = (keys: string[], on: boolean) =>
    setUnitSelections(prev => {
      const next = { ...prev }
      for (const k of keys) next[k] = on ? 'selected' : 'deselected'
      return next
    })

  // ── Course inclusion (direct per-row toggle, ST-02 reset-on-return) ────────
  const [excluded, setExcluded] = useState<Set<string>>(new Set())
  function removeCourse(id: string) {
    setExcluded(prev => new Set(prev).add(id))
    // Clear template + units NOW: re-selecting later must not restore prior
    // state — it starts from a fresh manual template pick.
    setAssignments(prev => ({ ...prev, [id]: '' }))
    setUnitSelections(prev => withoutOfferings(prev, new Set([id])))
  }
  function restoreCourse(id: string) {
    setExcluded(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    // Assignment stays '' — fresh manual pick; units re-seed all-selected
    // (first-sight rule) once a template is chosen.
  }

  // ── Auto Update + Refresh (the ONLY re-sync) ───────────────────────────────
  const [autoUpdateOn, setAutoUpdateOn] = useState(false)
  function handleRefresh() {
    const freshPlan = prismCourses.flatMap(o =>
      expandInstances(o, templateInfoOf(o).template, surveysWithDemo, effectiveTemplates))
    setUnitSelections(prev => reconcileUnitsOnRefresh(prev, freshPlan, autoUpdateOn))
    setCourses(prismCourses)
    setPendingPrismChanges([])
  }

  // ── Row derivation + individual block gate ─────────────────────────────────
  const rows = useMemo(() => courses.map(o => {
    const items = byOffering.get(o.id) ?? []
    const { template, stale, staleName } = templateInfoOf(o)
    const fresh = items.filter(i => i.status === 'new')
    const gaps = items.filter(i => i.status === 'gap')
    const dups = items.filter(i => i.status === 'duplicate')
    const selectedCount = fresh.filter(i => isSelected(i.key)).length
    const removed = excluded.has(o.id)
    // ST-02: every unit deselected = the course is automatically deselected —
    // it leaves toCreate, the block checks, and the push.
    const autoDeselected = !removed && fresh.length > 0 && selectedCount === 0
    const inPush = !removed && !autoDeselected
    const blockers: Blocker[] = []
    if (inPush) {
      if (!template) blockers.push(stale ? 'template-unpublished' : 'no-template')
      else if (dups.length > 0) blockers.push('conflict')
      else if (fresh.length === 0) blockers.push('empty')
    }
    return { offering: o, items, template, stale, staleName, fresh, gaps, dups, selectedCount, removed, autoDeselected, inPush, blockers }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [courses, byOffering, unitSelections, excluded, assignments, defaults, effectiveTemplates])

  const toCreate = rows.reduce((n, r) => n + (r.inPush ? r.selectedCount : 0), 0)
  const conflictCount = rows.filter(r => r.blockers.includes('conflict')).length
  const noTemplateCount = rows.filter(r => r.blockers.includes('no-template') || r.blockers.includes('template-unpublished')).length
  const emptyCount = rows.filter(r => r.blockers.includes('empty')).length
  const gapCourseCount = rows.filter(r => r.inPush && r.gaps.length > 0).length
  const gapTotal = rows.reduce((n, r) => n + (r.inPush ? r.gaps.length : 0), 0)
  // Continue gate — each blocked course disables it INDIVIDUALLY, never via a
  // summed score; faculty gaps never appear here.
  const anyBlocked = rows.some(r => r.blockers.length > 0)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedRow = rows.find(r => r.offering.id === selectedId) ?? null

  // ── Template picker / reset / create flow ──────────────────────────────────
  function handleTemplateChange(offeringId: string, templateId: string) {
    setAssignments(prev => ({ ...prev, [offeringId]: templateId }))
    // ST-02: changing a course's template clears its unit selections entirely.
    // The seeding effect re-populates the new template's coverage with
    // first-sight defaults (everything selected) — nothing carries forward,
    // even for a role or person the two templates share.
    setUnitSelections(prev => withoutOfferings(prev, new Set([offeringId])))
  }

  const [resetOpen, setResetOpen] = useState(false)
  const resetChangedCount = courses.filter(o => rawAssignmentOf(o) !== (defaults[o.id] ?? '')).length
  function handleResetDefaults() {
    // ST-02: EVERY course (selected, removed, or flagged) returns to its type
    // default in one shot. Irreversible once confirmed (no undo). Courses
    // whose effective template changes also lose their unit selections.
    const changed = new Set<string>()
    const next: Record<string, string> = {}
    for (const o of courses) {
      const def = defaults[o.id] ?? ''
      next[o.id] = def
      if (rawAssignmentOf(o) !== def) changed.add(o.id)
    }
    setAssignments(next)
    if (changed.size > 0) setUnitSelections(prev => withoutOfferings(prev, changed))
    setResetOpen(false)
  }

  // Screen-level create flow — the SAME embedded chooser + builder the
  // production step uses (subView swap; this component never unmounts, so
  // every assignment and selection survives the round trip).
  const [subView, setSubView] = useState<'main' | 'create' | { buildId: string }>('main')
  const [publishNotice, setPublishNotice] = useState<{ kind: 'published' | 'draft'; name: string } | null>(null)
  function backToMain() {
    if (typeof subView === 'object') {
      const t = templates.find(x => x.id === subView.buildId)
      if (t && t.status !== 'active') setPublishNotice({ kind: 'draft', name: t.name || 'Untitled template' })
    }
    setSubView('main')
  }

  // ── Preview ────────────────────────────────────────────────────────────────
  const [previewTemplate, setPreviewTemplate] = useState<PceTemplate | null>(null)

  // ── Save as draft / Resume (sessionStorage simulation of ST-02 Phase 3) ────
  const [draftMeta, setDraftMeta] = useState<{ savedAt: string } | null>(null)
  const [driftNotices, setDriftNotices] = useState<DriftNotice[]>([])
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY)
      if (raw) setDraftMeta({ savedAt: (JSON.parse(raw) as DraftPayload).savedAt })
    } catch { /* unreadable draft: treat as none */ }
  }, [])

  function handleSaveDraft() {
    const assignMap: Record<string, string> = {}
    const snapshots: Record<string, string[]> = {}
    for (const o of courses) {
      const raw = rawAssignmentOf(o)
      assignMap[o.id] = raw
      if (raw && snapshots[raw] === undefined) {
        const t = effectiveTemplates.find(x => x.id === raw)
        if (t) snapshots[raw] = templateCriteria(t)
      }
    }
    const payload: DraftPayload = {
      savedAt: new Date().toISOString(),
      assignments: assignMap,
      excluded: [...excluded],
      unitSelections,
      autoUpdateOn,
      templateSnapshots: snapshots,
    }
    try {
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload))
      setDraftMeta({ savedAt: payload.savedAt })
    } catch { /* storage unavailable: the button did nothing visible; acceptable in a demo */ }
  }

  function handleResumeDraft() {
    let draft: DraftPayload
    try {
      const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY)
      if (!raw) return
      draft = JSON.parse(raw) as DraftPayload
    } catch { return }
    const noticeMap = new Map<string, DriftNotice>()
    const nextAssignments: Record<string, string> = {}
    for (const o of courses) {
      const { code } = splitLabel(o)
      const tid = draft.assignments[o.id] ?? ''
      if (!tid) { nextAssignments[o.id] = ''; continue }
      const t = effectiveTemplates.find(x => x.id === tid) ?? null
      if (!t || templateStoryStatusOf(t) !== 'published') {
        // Template since unpublished/archived/deleted: the row reverts to "no
        // template assigned" and blocks until a published one is chosen.
        nextAssignments[o.id] = ''
        const key = `unpublished-${tid}`
        const n = noticeMap.get(key) ?? { templateName: t?.name ?? '', kind: 'unpublished' as const, addedRoleLabels: [], removedRoleLabels: [], courseCodes: [] }
        n.courseCodes.push(code)
        noticeMap.set(key, n)
        continue
      }
      nextAssignments[o.id] = tid
      const snap = draft.templateSnapshots[tid]
      if (snap) {
        const current: string[] = templateCriteria(t)
        const snapSet = new Set(snap)
        const curSet = new Set(current)
        const added = current.filter(c => !snapSet.has(c))
        const removedRoles = snap.filter(c => !curSet.has(c))
        if (added.length > 0 || removedRoles.length > 0) {
          const key = `updated-${tid}`
          const n = noticeMap.get(key) ?? {
            templateName: t.name,
            kind: 'updated' as const,
            addedRoleLabels: added.map(roleLabelOf),
            removedRoleLabels: removedRoles.map(roleLabelOf),
            courseCodes: [],
          }
          n.courseCodes.push(code)
          noticeMap.set(key, n)
        }
      }
    }
    setAssignments(nextAssignments)
    setExcluded(new Set(draft.excluded))
    // Restore the saved selections wholesale; units the templates gained since
    // the save are absent from the slice and get first-sight seeds from the
    // seeding effect (all selected).
    setUnitSelections(draft.unitSelections)
    setAutoUpdateOn(draft.autoUpdateOn)
    setDriftNotices([...noticeMap.values()])
  }

  function handleDiscardDraft() {
    try { sessionStorage.removeItem(DRAFT_STORAGE_KEY) } catch { /* ignore */ }
    setDraftMeta(null)
    setDriftNotices([])
  }

  // ── Demo controls (simulation scaffolding only) ────────────────────────────
  function demoAddCoInstructor() {
    // UC2: a co-instructor added later in Prism. Lands in prismCourses only —
    // the plan does not change until Refresh; the Auto Update flag decides
    // whether the new unit arrives selected.
    setPrismCourses(prev => prev.map(o =>
      o.id === 'co9' ? { ...o, coInstructorIds: [...(o.coInstructorIds ?? []), 'f6'] } : o))
    setPendingPrismChanges(prev => [...prev, 'Dr. Omar Hassan added as a co-instructor on DPT-501'])
    setDemoApplied(prev => new Set(prev).add('add'))
  }
  function demoRemoveInstructor() {
    // A person removed in Prism: their unit disappears on Refresh regardless
    // of the flag, and the role becomes a gap.
    setPrismCourses(prev => prev.map(o =>
      o.id === 'co11' ? { ...o, collaboratorIds: o.collaboratorIds.filter(id => id !== 'f4') } : o))
    setPendingPrismChanges(prev => [...prev, 'Dr. James Kim removed from DPT-503'])
    setDemoApplied(prev => new Set(prev).add('remove'))
  }
  const demoTemplateTarget = useMemo(() => {
    for (const r of rows) if (r.template) return r.template
    return null
  }, [rows])
  function demoTemplateGainedRole() {
    if (!demoTemplateTarget) return
    const tid = demoTemplateTarget.id
    setTemplateOverrides(prev => ({
      ...prev,
      [tid]: {
        ...prev[tid],
        extraSections: [
          ...(prev[tid]?.extraSections ?? []),
          { id: `demo-gained-${tid}`, subjectKey: 'course_director', title: 'Course Director', order: 999, questions: [] },
        ],
      },
    }))
    setDemoApplied(prev => new Set(prev).add('gained'))
  }
  function demoTemplateArchived() {
    if (!demoTemplateTarget) return
    setTemplateOverrides(prev => ({
      ...prev,
      [demoTemplateTarget.id]: { ...prev[demoTemplateTarget.id], archived: true },
    }))
    setDemoApplied(prev => new Set(prev).add('archived'))
  }
  function demoResetChanges() {
    setTemplateOverrides({})
    setPrismCourses(initialCourses)
    setCourses(initialCourses)
    setPendingPrismChanges([])
    setDemoApplied(new Set())
  }

  // ── Create sub-view (same chooser + builder as Settings > Templates) ───────
  if (subView !== 'main') {
    return (
      <div className="flex flex-col gap-3">
        <div>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={backToMain}>
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
              setPublishNotice({ kind: 'published', name: t?.name || 'Template' })
              setSubView('main')
            }}
          />
        )}
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <h2 className="text-lg font-semibold font-heading">Survey design</h2>
          <p className="text-sm text-muted-foreground">
            Confirm each course&apos;s template. Select a course to review its evaluations, faculty gaps, and anything blocking the push.
          </p>
          {/* "Action needed" consolidation — counts only, never faculty names. */}
          {(conflictCount + noTemplateCount + emptyCount + gapCourseCount) > 0 && (
            <p className="text-xs tabular-nums text-muted-foreground">
              Action needed:{' '}
              {[
                conflictCount + emptyCount > 0 ? `${conflictCount + emptyCount} course${conflictCount + emptyCount !== 1 ? 's' : ''} blocked` : null,
                noTemplateCount > 0 ? `${noTemplateCount} without a template` : null,
                gapCourseCount > 0 ? `${gapCourseCount} with faculty gaps` : null,
              ].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => setResetOpen(true)}>
            <i className="fa-light fa-arrow-rotate-left text-xs" aria-hidden="true" />
            Reset to defaults
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setPublishNotice(null); setSubView('create') }}>
            <i className="fa-light fa-plus" aria-hidden="true" />
            New template
          </Button>
          <Button variant="outline" size="sm" onClick={handleSaveDraft}>
            Save as draft
          </Button>
        </div>
      </header>

      {publishNotice && (
        <LocalBanner
          variant={publishNotice.kind === 'published' ? 'success' : 'info'}
          dismissible
          onDismiss={() => setPublishNotice(null)}
        >
          {publishNotice.kind === 'published'
            ? <>&ldquo;{publishNotice.name}&rdquo; is published. Assign it from any course&apos;s template picker.</>
            : <>&ldquo;{publishNotice.name}&rdquo; is saved as a draft. Publish it from Settings &rsaquo; Templates to make it assignable.</>}
        </LocalBanner>
      )}

      {/* Draft banner — offered whenever a saved draft exists. */}
      {draftMeta && (
        <div className="flex items-center gap-3 rounded-lg border border-border px-4 py-2.5" style={{ background: 'var(--insight-severity-info-bg)' }}>
          <i className="fa-light fa-floppy-disk text-sm shrink-0" style={{ color: 'var(--insight-severity-info-fg)' }} aria-hidden="true" />
          <span className="text-sm min-w-0" style={{ color: 'var(--insight-severity-info-fg)' }}>
            Draft saved at {fmtTime(draftMeta.savedAt)}.
          </span>
          <span className="ms-auto shrink-0 flex items-center gap-2">
            <Button variant="outline" size="xs" onClick={handleResumeDraft}>Resume</Button>
            <Button variant="ghost" size="xs" className="text-muted-foreground hover:text-foreground" onClick={handleDiscardDraft}>
              Start fresh
            </Button>
          </span>
        </div>
      )}

      {/* Template drift findings from the last Resume (pre-Live only: this
          demo has no Live state, so the notice always applies). */}
      {driftNotices.length > 0 && (
        <LocalBanner variant="info" dismissible onDismiss={() => setDriftNotices([])}>
          <span className="flex flex-col gap-1">
            {driftNotices.map(n => (
              <span key={`${n.kind}-${n.templateName}`}>
                {n.kind === 'updated' ? (
                  <>
                    &ldquo;{n.templateName}&rdquo; changed since this draft was saved.
                    {n.addedRoleLabels.length > 0 && <> It now also covers {n.addedRoleLabels.join(', ')}.</>}
                    {n.removedRoleLabels.length > 0 && <> It no longer covers {n.removedRoleLabels.join(', ')}.</>}
                    {' '}Faculty coverage below reflects the current template.
                  </>
                ) : (
                  <>
                    {n.templateName ? <>&ldquo;{n.templateName}&rdquo;</> : <>The template saved with this draft</>}
                    {' '}is no longer published. Assign a published template to {n.courseCodes.join(', ')} to continue.
                  </>
                )}
              </span>
            ))}
          </span>
        </LocalBanner>
      )}

      {/* Auto Update — ONE flag for the whole screen (never per-row). Flipping
          it does nothing by itself; it only decides how units the plan has
          never seen arrive on the next manual Refresh. Refresh is the ONLY
          re-sync and sits beside the flag, above the list where the gap
          indicators render. */}
      <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
        <label htmlFor="var-a-auto-update" className="flex items-center gap-2.5 cursor-pointer">
          <ToggleSwitch
            id="var-a-auto-update"
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
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-xs text-muted-foreground">Recheck faculty assignments in Prism.</span>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex gap-4 items-start">
        {/* ── Minimal list — one compact row per course, nothing else inline ── */}
        <div className="flex-1 min-w-0 rounded-lg border border-border overflow-hidden" role="list" aria-label="Courses in this push">
          {rows.map(r => {
            const o = r.offering
            const { code, name } = splitLabel(o)
            const isActive = selectedRow?.offering.id === o.id
            const hardBlocked = r.blockers.includes('conflict') || r.blockers.includes('empty') || r.blockers.includes('template-unpublished')
            return (
              <div
                key={o.id}
                role="listitem"
                className={`flex items-center gap-2.5 ps-3 pe-2 border-b border-border last:border-b-0 ${isActive ? 'bg-secondary' : ''}`}
                style={{
                  minHeight: 44,
                  ...(hardBlocked ? { boxShadow: 'inset 3px 0 0 var(--chip-destructive)' } : {}),
                }}
              >
                <Checkbox
                  checked={
                    r.removed ? false
                      : r.fresh.length === 0 ? true
                        : r.selectedCount === r.fresh.length ? true
                          : r.selectedCount > 0 ? 'indeterminate' : false
                  }
                  onCheckedChange={v => {
                    if (r.removed) {
                      // Re-inclusion: fresh manual template pick, fresh
                      // default selections — nothing restored.
                      restoreCourse(o.id)
                    } else if (v && r.fresh.length > 0) {
                      // From partial/none: select the remaining units.
                      setUnits(r.fresh.map(i => i.key), true)
                    } else if (!v) {
                      // Explicit uncheck removes the COURSE from the push.
                      removeCourse(o.id)
                    }
                  }}
                  aria-label={`Include ${code} in this push`}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex-1 h-9 min-w-0 justify-start gap-2.5 px-1.5 font-normal ${r.removed || r.autoDeselected ? 'opacity-50' : ''}`}
                  aria-current={isActive ? 'true' : undefined}
                  onClick={() => setSelectedId(o.id)}
                >
                  <span className={`font-mono text-xs tabular-nums shrink-0 ${isActive ? '' : 'text-muted-foreground'}`}>{code}</span>
                  {name && <span className={`truncate text-sm ${isActive ? 'font-medium' : ''}`}>{name}</span>}
                  <span className="ms-auto shrink-0 flex items-center gap-3">
                    <span className="text-xs text-muted-foreground truncate hidden xl:inline" style={{ maxWidth: 140 }}>
                      {r.template?.name ?? 'No template'}
                    </span>
                    {r.removed ? (
                      <span className="text-xs text-muted-foreground">Removed from push</span>
                    ) : r.autoDeselected ? (
                      <span className="text-xs text-muted-foreground">All evaluations deselected</span>
                    ) : r.blockers.includes('conflict') ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--chip-destructive)' }}>
                        <i className="fa-solid fa-lock text-[10px]" aria-hidden="true" />
                        Blocked
                      </span>
                    ) : r.blockers.includes('template-unpublished') ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--chip-destructive)' }}>
                        <i className="fa-solid fa-lock text-[10px]" aria-hidden="true" />
                        Template unpublished
                      </span>
                    ) : r.blockers.includes('empty') ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--chip-destructive)' }}>
                        <i className="fa-solid fa-lock text-[10px]" aria-hidden="true" />
                        Nothing to evaluate
                      </span>
                    ) : r.blockers.includes('no-template') ? (
                      <span className="text-xs font-medium" style={{ color: 'var(--insight-severity-info-fg)' }}>
                        Assign template
                      </span>
                    ) : r.gaps.length > 0 ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--chip-4)' }}>
                        <span aria-hidden="true" className="size-1.5 rounded-full" style={{ background: 'var(--chip-4)' }} />
                        {r.gaps.length} gap{r.gaps.length !== 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span aria-hidden="true" className="size-1.5 rounded-full" style={{ background: 'var(--chip-2)' }} />
                        Ready
                      </span>
                    )}
                  </span>
                </Button>
              </div>
            )
          })}
        </div>

        {/* ── Detail rail — fixed-width master-detail panel, never an overlay ── */}
        <aside className="shrink-0 sticky flex flex-col" style={{ width: 400, top: 16 }} aria-label="Course details">
          {selectedRow ? (
            <DetailRail
              row={selectedRow}
              pickerTemplates={pickerTemplatesFor(selectedRow.offering)}
              defaultTemplateId={defaults[selectedRow.offering.id] ?? ''}
              onTemplateChange={handleTemplateChange}
              isSelected={isSelected}
              setUnits={setUnits}
              onRemoveCourse={() => removeCourse(selectedRow.offering.id)}
              onRestoreCourse={() => restoreCourse(selectedRow.offering.id)}
              onPreview={t => setPreviewTemplate(t)}
            />
          ) : (
            <EmptyHint
              heading="Select a course to see its details"
              sub="Evaluations, faculty gaps, and anything blocking the push appear here."
            />
          )}
        </aside>
      </div>

      {/* ── Demo controls — simulation scaffolding, NOT part of the design ── */}
      <section
        aria-label="Demo controls"
        className="rounded-lg border border-dashed border-border px-4 py-3 flex flex-col gap-2.5"
        style={{ background: 'var(--muted)' }}
      >
        <p className="text-xs font-medium text-muted-foreground">
          Simulate PRISM and template changes (demo only). This panel stands in for the real PRISM backend and templates hub; it is not part of the design.
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="xs" disabled={demoApplied.has('add')} onClick={demoAddCoInstructor}>
            Add Dr. Omar Hassan as a co-instructor on DPT-501
          </Button>
          <Button variant="outline" size="xs" disabled={demoApplied.has('remove')} onClick={demoRemoveInstructor}>
            Remove Dr. James Kim from DPT-503
          </Button>
          <Button
            variant="outline"
            size="xs"
            disabled={!draftMeta || !demoTemplateTarget || demoApplied.has('gained')}
            onClick={demoTemplateGainedRole}
          >
            Simulate: template gained a new role since this draft was saved
          </Button>
          <Button
            variant="outline"
            size="xs"
            disabled={!draftMeta || !demoTemplateTarget || demoApplied.has('archived')}
            onClick={demoTemplateArchived}
          >
            Simulate: template archived since this draft was saved
          </Button>
          <Button variant="ghost" size="xs" className="text-muted-foreground hover:text-foreground" onClick={demoResetChanges}>
            Reset demo changes
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          PRISM changes take effect only after Refresh; the Auto Update flag decides whether a new person arrives selected.
          The template simulations target {demoTemplateTarget ? <>&ldquo;{demoTemplateTarget.name}&rdquo;</> : 'the first assigned template'} and need a saved draft first.
          Coverage updates immediately; resume the draft to see the drift notice.
        </p>
        {pendingPrismChanges.length > 0 && (
          <p className="text-xs tabular-nums" style={{ color: 'var(--insight-severity-info-fg)' }}>
            {pendingPrismChanges.length} simulated PRISM change{pendingPrismChanges.length !== 1 ? 's' : ''} waiting for Refresh: {pendingPrismChanges.join('; ')}.
          </p>
        )}
      </section>

      {/* ── Footer — every hard block disables Continue individually ── */}
      <div className="sticky bottom-0 mt-auto bg-background border-t border-border py-4 flex items-center justify-between gap-4">
        <span className="text-xs tabular-nums text-muted-foreground">
          {toCreate} evaluation{toCreate !== 1 ? 's' : ''} across {rows.filter(r => r.inPush).length} course{rows.filter(r => r.inPush).length !== 1 ? 's' : ''}
          {gapTotal > 0 && (
            <> · <span style={{ color: 'var(--chip-4)' }}>{gapTotal} role{gapTotal !== 1 ? 's' : ''} unassigned</span></>
          )}
          {conflictCount > 0 && (
            <> · <span className="font-medium" style={{ color: 'var(--chip-destructive)' }}>{conflictCount} course{conflictCount !== 1 ? 's' : ''} blocked by an existing survey</span></>
          )}
          {emptyCount > 0 && (
            <> · <span className="font-medium" style={{ color: 'var(--chip-destructive)' }}>{emptyCount} course{emptyCount !== 1 ? 's' : ''} with nothing to evaluate</span></>
          )}
          {noTemplateCount > 0 && <> · {noTemplateCount} course{noTemplateCount !== 1 ? 's' : ''} without a template</>}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            <i className="fa-light fa-arrow-left text-xs" aria-hidden="true" />
            Back
          </Button>
          <Button variant="default" size="sm" disabled={toCreate === 0 || anyBlocked}>
            Continue
            <i className="fa-light fa-arrow-right text-xs" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Preview Survey — template-backed dialog, works against an unsaved
          assignment; never renders a survey title (there is none yet). */}
      <SurveyPreviewDialog
        template={previewTemplate}
        open={previewTemplate !== null}
        onOpenChange={open => { if (!open) setPreviewTemplate(null) }}
      />

      {/* Reset to defaults — irreversible per ST-02, so it itemizes what will
          change instead of a generic confirmation. */}
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
// Detail rail — all the deferred complexity for ONE course.
// ═════════════════════════════════════════════════════════════════════════════

interface RailRow {
  offering: CourseOffering
  items: SurveyInstance[]
  template: PceTemplate | null
  stale: boolean
  staleName: string
  fresh: SurveyInstance[]
  gaps: SurveyInstance[]
  dups: SurveyInstance[]
  selectedCount: number
  removed: boolean
  autoDeselected: boolean
  inPush: boolean
  blockers: Blocker[]
}

/** Units shown before the "+N more" expander (ST-02 UI note: cap at 3). */
const UNIT_CAP = 3

function DetailRail({
  row, pickerTemplates, defaultTemplateId, onTemplateChange, isSelected, setUnits,
  onRemoveCourse, onRestoreCourse, onPreview,
}: {
  row: RailRow
  pickerTemplates: PceTemplate[]
  defaultTemplateId: string
  onTemplateChange: (offeringId: string, templateId: string) => void
  isSelected: (key: string) => boolean
  setUnits: (keys: string[], on: boolean) => void
  onRemoveCourse: () => void
  onRestoreCourse: () => void
  onPreview: (t: PceTemplate) => void
}) {
  const { offering, items, template, stale, staleName, fresh, gaps, dups, removed, blockers } = row
  const { code, name } = splitLabel(offering)
  const [unitsExpanded, setUnitsExpanded] = useState(false)
  const visibleFresh = unitsExpanded ? fresh : fresh.slice(0, UNIT_CAP)
  const hiddenFresh = fresh.length - UNIT_CAP

  // Coverage rows for the hard-block panel — EVERY criterion of the current
  // template's applicable coverage, so clear roles answer "Yes" beside the
  // blocked "No" rows (ST-02: Evaluate? / Role / Assigned / Covered by).
  const coverageRows: { criterion: string; roleLabel: string; persons: string[]; existing: PceSurvey | null }[] = []
  if (dups.length > 0) {
    const idx = new Map<string, number>()
    for (const i of items) {
      let at = idx.get(i.criterion)
      if (at === undefined) {
        at = coverageRows.length
        idx.set(i.criterion, at)
        coverageRows.push({ criterion: i.criterion, roleLabel: i.roleLabel || 'Course material', persons: [], existing: null })
      }
      if (i.personName) coverageRows[at].persons.push(i.personName)
      if (i.status === 'duplicate' && i.existing) coverageRows[at].existing = i.existing
    }
  }

  const previewButton = (
    <Button
      variant="outline"
      size="xs"
      disabled={!template}
      onClick={() => template && onPreview(template)}
    >
      Preview
      <span className="sr-only">
        {template ? ` the survey for ${code}` : '. Assign a template to preview.'}
      </span>
    </Button>
  )

  return (
    <div className="rounded-lg border border-border overflow-hidden flex flex-col bg-card">
      <div className="flex items-start gap-2.5 px-4 pt-3.5 pb-3 border-b border-border">
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="text-sm font-semibold flex items-baseline gap-2 min-w-0">
            <span className="font-mono text-xs tabular-nums text-muted-foreground shrink-0">{code}</span>
            {name && <span className="truncate">{name}</span>}
          </p>
          <p className="text-xs text-muted-foreground tabular-nums">{offering.cohort} · {offering.enrolledCount} students</p>
        </div>
        <span className="ms-auto shrink-0">
          {template ? (
            previewButton
          ) : (
            <Tip label="Assign a template to preview" side="left">
              {/* Disabled buttons swallow pointer/focus events — the focusable
                  wrapper carries the tooltip AND a visible focus ring. */}
              <span
                className="inline-flex rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                tabIndex={0}
              >
                {previewButton}
              </span>
            </Tip>
          )}
        </span>
      </div>

      {/* Removed course — the rail says so and offers the (reset) way back. */}
      {removed && (
        <div className="flex flex-col gap-2 px-4 py-3 border-b border-border">
          <p className="text-sm font-medium">Removed from this push.</p>
          <p className="text-xs text-muted-foreground">
            Adding it back starts fresh: pick a template again, and every evaluatee starts selected.
          </p>
          <span>
            <Button variant="outline" size="sm" onClick={onRestoreCourse}>
              Add back to push
            </Button>
          </span>
        </div>
      )}

      {/* Template — picker filtered to this course's own type, type default
          badged, exact ST-02 empty copy when the type has no templates. */}
      <div className="flex flex-col gap-1.5 px-4 py-3 border-b border-border">
        <label htmlFor={`var-a-tmpl-${offering.id}`} className="text-xs font-medium text-muted-foreground">
          Template
        </label>
        {stale && (
          <p className="text-xs font-medium" style={{ color: 'var(--chip-destructive)' }}>
            {staleName ? <>&ldquo;{staleName}&rdquo;</> : <>The assigned template</>} is no longer published. Assign a published template to continue.
          </p>
        )}
        {pickerTemplates.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No templates for this course type. Create one with New template above.
          </p>
        ) : (
          <Select value={template?.id ?? ''} onValueChange={v => onTemplateChange(offering.id, v)}>
            <SelectTrigger id={`var-a-tmpl-${offering.id}`} aria-label={`Template for ${code}`} className="w-full [&>span]:truncate">
              <SelectValue placeholder="Assign a template" />
            </SelectTrigger>
            <SelectContent>
              {pickerTemplates.map(t => (
                <SelectItem key={t.id} value={t.id}>
                  <span className="flex items-center gap-1.5 min-w-0">
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
        )}
      </div>

      {/* Hard block: role overlap — destructive, resolvable only by removing
          the course or retiring the existing survey. Never the gap look.
          Coverage table: Evaluate? / Role / Assigned / Covered by, with clear
          roles answering "Yes" in the teal Confirmed treatment. */}
      {!removed && dups.length > 0 && (
        <div className="flex flex-col gap-2.5 px-4 py-3 border-b border-border">
          <p className="text-sm font-medium inline-flex items-center gap-1.5" style={{ color: 'var(--chip-destructive)' }}>
            <i className="fa-solid fa-lock text-xs" aria-hidden="true" />
            Blocked by an existing survey
          </p>
          {coverageRows.map(r => (
            <dl key={r.criterion} className="rounded-lg border border-border px-3 py-2.5 flex flex-col gap-1.5 text-sm">
              <div className="flex items-center gap-3">
                <dt className="text-xs text-muted-foreground shrink-0" style={{ width: 76 }}>Evaluate?</dt>
                <dd>
                  {r.existing ? (
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
                </dd>
              </div>
              <div className="flex items-baseline gap-3">
                <dt className="text-xs text-muted-foreground shrink-0" style={{ width: 76 }}>Role</dt>
                <dd className="font-medium">{r.roleLabel}</dd>
              </div>
              <div className="flex items-baseline gap-3">
                <dt className="text-xs text-muted-foreground shrink-0" style={{ width: 76 }}>Assigned</dt>
                <dd className="min-w-0 truncate">
                  {r.persons.length > 0 ? r.persons.join(', ') : 'No one assigned'}
                </dd>
              </div>
              <div className="flex items-center gap-3">
                <dt className="text-xs text-muted-foreground shrink-0" style={{ width: 76 }}>Covered by</dt>
                <dd className="flex items-center gap-2 min-w-0">
                  {r.existing ? (
                    <>
                      <StoryStatusBadgeOS status={storyStatusOf(r.existing)} size="sm" />
                      {fmtYmd(r.existing.openDate) && (
                        <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                          Opened {fmtYmd(r.existing.openDate)}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">None</span>
                  )}
                </dd>
              </div>
            </dl>
          ))}
          <p className="text-xs text-muted-foreground">
            Roles marked No are covered by an existing survey for this term. Remove the course from this push, or cancel the existing survey first.
          </p>
          <span>
            <Button variant="outline" size="sm" onClick={onRemoveCourse}>
              Remove course from push
            </Button>
          </span>
        </div>
      )}

      {/* Hard block: empty evaluation — faculty-only template with zero people
          staffed anywhere. Distinct from a partial gap; same severity family
          as the overlap block. */}
      {!removed && blockers.includes('empty') && (
        <div className="flex flex-col gap-2 px-4 py-3 border-b border-border">
          <p className="text-sm font-medium inline-flex items-center gap-1.5" style={{ color: 'var(--chip-destructive)' }}>
            <i className="fa-solid fa-lock text-xs" aria-hidden="true" />
            Nothing to evaluate
          </p>
          <p className="text-xs text-muted-foreground">
            {items.length === 0
              ? 'This template covers no roles that apply to this course type, so the push would create an empty evaluation. Assign a different template.'
              : 'This template evaluates only faculty roles, and no one is staffed in any of them for this course. The push would create an empty evaluation. Assign a different template, or add faculty in Prism.'}
          </p>
        </div>
      )}

      {/* Faculty gaps — amber, informational, never blocks. The Refresh
          control above the list re-checks these against Prism. */}
      {!removed && gaps.length > 0 && !blockers.includes('empty') && (
        <div className="flex flex-col gap-2 px-4 py-3 border-b border-border">
          <p className="text-sm font-medium inline-flex items-center gap-1.5" style={{ color: 'var(--chip-4)' }}>
            <i className="fa-solid fa-user-slash text-xs" aria-hidden="true" />
            {gaps.length} role{gaps.length !== 1 ? 's have' : ' has'} no one assigned
          </p>
          {gaps.map(item => (
            <div key={item.key} className="flex items-center gap-3 rounded-lg px-3 py-2" style={{ background: 'var(--group-band-attention-bg)' }}>
              <div className="flex flex-col gap-0 min-w-0">
                <span className="text-sm font-medium">No {item.roleLabel} assigned</span>
                <span className="text-xs text-muted-foreground">The push proceeds without this evaluation.</span>
              </div>
              <span className="ms-auto shrink-0">
                {item.prismHref && <AddInPrismButton href={item.prismHref} label="Add faculty" roles={[item.roleLabel]} />}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Units — every evaluatee this push would create, each deselectable,
          capped at UNIT_CAP with an expander. Deselecting all of them
          auto-deselects the course. */}
      <div className={`flex flex-col px-4 py-3 ${removed ? 'opacity-50' : ''}`}>
        <p className="text-sm font-medium pb-1">
          {fresh.length > 0
            ? `${fresh.filter(i => isSelected(i.key)).length} of ${fresh.length} evaluation${fresh.length !== 1 ? 's' : ''} in this push`
            : template
              ? 'No evaluations to create'
              : 'Assign a template to plan this course'}
        </p>
        {row.autoDeselected && (
          <p className="text-xs text-muted-foreground pb-1">
            Every evaluatee is deselected, so this course is out of the push.
          </p>
        )}
        {visibleFresh.map(item => (
          <div key={item.key} className="flex items-center gap-2.5" style={{ minHeight: 36 }}>
            <Checkbox
              id={`var-a-unit-${item.key.replace(/[^a-zA-Z0-9_-]/g, '-')}`}
              checked={isSelected(item.key)}
              onCheckedChange={v => setUnits([item.key], !!v)}
              disabled={removed}
            />
            <CheckboxLabel htmlFor={`var-a-unit-${item.key.replace(/[^a-zA-Z0-9_-]/g, '-')}`} className="flex items-baseline gap-1.5 font-normal min-w-0">
              <span className="text-sm truncate">{unitLabel(item)}</span>
              {item.scope !== 'course' && item.roleLabel && (
                <span className="text-xs text-muted-foreground shrink-0">· {item.roleLabel}</span>
              )}
            </CheckboxLabel>
          </div>
        ))}
        {hiddenFresh > 0 && (
          <span>
            <Button
              variant="ghost"
              size="xs"
              className="text-muted-foreground hover:text-foreground"
              aria-expanded={unitsExpanded}
              onClick={() => setUnitsExpanded(!unitsExpanded)}
            >
              {unitsExpanded ? 'Show less' : `+${hiddenFresh} more`}
            </Button>
          </span>
        )}
        {dups.map(item => (
          <div key={item.key} className="flex items-center gap-2.5 pointer-events-none" style={{ minHeight: 36 }} aria-disabled="true">
            <i className="fa-solid fa-lock text-[10px] shrink-0" style={{ color: 'var(--chip-destructive)' }} aria-hidden="true" />
            <span className="flex items-baseline gap-1.5 min-w-0">
              <span className="text-sm truncate">{unitLabel(item)}</span>
              {item.scope !== 'course' && item.roleLabel && (
                <span className="text-xs text-muted-foreground shrink-0">· {item.roleLabel}</span>
              )}
              <span className="text-xs shrink-0" style={{ color: 'var(--chip-destructive)' }}>Blocked</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
