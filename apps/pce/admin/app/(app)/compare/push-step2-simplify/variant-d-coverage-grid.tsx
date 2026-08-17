'use client'

// COMPARE VARIANT D — "Coverage grid" (throwaway; delete once a direction is
// picked, same lifecycle as the A/B/C siblings in this route).
//
// Thesis: A, B, and C all read row-by-row — none of them can answer "which
// ROLE is the systemic problem" without scanning every row. This variant is a
// permissions-matrix read (Mobbin: StackAI roles table, Workable role
// permissions grid, Vanta compliance permissions): rows = courses, columns =
// the evaluatee criteria the assigned templates actually cover, cell = one
// compact glyph per course x criterion. Column headers carry aggregate counts
// ("3 unstaffed") so a role that is unstaffed across five courses is visible
// in one glance at one column, not five rows. All cell detail defers to a
// small Popover on the cell itself.
//
// ST-02 COMPLETENESS PASS (2026-08-03, audit follow-up) — this variant now
// carries the FULL Step 2 contract so it can be used end-to-end, not just
// looked at:
//   · Template assignment: strict ST-02 auto-assign (exactly one published
//     type match -> assign; 2+ -> only an isDefaultForType flag wins, else
//     UNASSIGNED — documented decision below; 0 -> "No templates for this
//     course type"), type-filtered selector options, "Default" badge,
//     screen-level "+ New template" (same embedded CreateBlankTemplate ->
//     TemplateEditor flow as the production step), "Reset to defaults" with
//     itemized AlertDialog confirmation.
//   · TEMPLATE-CHANGE RESET (bug fix): changing a course's template now
//     clears EVERY unit-selection entry for that course — full new-template
//     coverage, no carryover, even for a shared role or person. The previous
//     build deliberately kept exclusions across template changes ("stale keys
//     are harmless"); that contradicted ST-02 and is gone.
//   · Course re-selection: excluding a course purges its template assignment
//     and unit selections; re-including re-applies the CURRENT auto-assign
//     default (never the prior state) — fresh reassignment per ST-02.
//   · Auto Update flag + manual Refresh: one ToggleSwitch (defaults OFF),
//     Refresh is the only re-sync trigger, reconciliation via
//     reconcileUnitsOnRefresh. A separate demo-controls panel mutates the
//     in-memory Prism data so Refresh has something real to react to.
//   · Preview: per-row Preview action gated on an assigned template
//     (disabled + "Assign a template to preview" tooltip otherwise), opening
//     the shared SurveyPreviewDialog.
//   · Save as draft / resume: sessionStorage draft (assignments, unit
//     selections, Auto Update flag, excluded courses, a templateCriteria()
//     snapshot per assigned template, timestamp); resume offers Resume /
//     Start fresh and reports template drift (info banner) or an archived
//     template (course reverts to no template assigned, which blocks).
//   · Blocks (per included course): no template · template unpublished or
//     archived since assignment · role overlap with an existing Live/Closed/
//     Results Available/Archived survey · every unit deselected (= fully
//     deselected, course leaves the push) · faculty-only template with zero
//     people staffed anywhere (distinct hard block). Partial faculty gaps
//     never block.
//
// Glyph vocabulary (legend rendered above the grid):
//   check (chip-2)        staffed, will be created by this push
//   circle-minus (muted)  staffed but excluded from this push
//   dot (chip-4)          gap: the template evaluates this role, nobody staffed
//   lock (chip-destructive) hard block: overlaps an existing Live/Closed/
//                         Results Available/Archived survey (Continue disabled)
//   en dash               not applicable: this course's template does not
//                         evaluate this criterion
//
// Severity treatment (kept deliberately): destructive red for hard blocks,
// amber (chip-4) for soft faculty gaps — never one shared color for both.
//
// Runs the real pt5 machinery (published templates -> strict type default ->
// expandInstances -> roleOverlapConflicts -> reconcileUnitsOnRefresh). One
// synthetic in-memory Live survey on DPT-510 (co13) forces a hard-block cell;
// one synthetic isDefaultForType flag on tmpl1 gives the strict auto-assign
// rule a winner (every fixture template is courseType 'any' with no default
// flag, which would otherwise leave every course unassigned). Shared fixtures
// untouched.

import { useEffect, useMemo, useState } from 'react'
import {
  Button, Checkbox, CheckboxLabel, Badge, Tip, LocalBanner, ToggleSwitch,
  Popover, PopoverContent, PopoverTrigger,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@exxatdesignux/ui'
import { StoryStatusBadgeOS } from '@/components/pce/pce-badges'
import { usePce } from '@/components/pce/pce-state'
import { CreateBlankTemplate } from '@/components/pce/create-blank-template'
import { TemplateEditor } from '@/components/pce/template-editor'
import { SurveyPreviewDialog } from '@/components/pce/distribute-wizard/survey-preview-dialog'
import { AddInPrismButton } from '@/components/pce/courses-evaluatees/scope-controls'
import {
  MOCK_COURSE_OFFERINGS, MOCK_PROGRAM_TERMS,
  type CourseOffering, type PceSurvey, type PceTemplate,
} from '@/lib/pce-mock-data'
import {
  ALL_CRITERIA, CRITERION_TOGGLE_LABEL, courseLabelOf, templateCriteria,
  type Criterion,
} from '@/lib/pce-course-readiness'
import {
  expandInstances, reconcileUnitsOnRefresh, storyStatusOf, templateStoryStatusOf,
  type SurveyInstance, type UnitSelectionMap,
} from '@/lib/pce-push-validation'

// ── Demo-only conflict seed ──────────────────────────────────────────────────
// DPT-510 (co13) only carries Scheduled fixtures, which do NOT block. This
// LOCAL Live instructor-scope survey makes its Instructor cell a hard block
// without touching pce-mock-data.ts.
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

// ── Demo-only PRISM mutation targets ─────────────────────────────────────────
// The Refresh contract needs live data that can change UNDER the snapshot the
// grid renders from. These two single-cell mutations (one gained instructor,
// one lost instructor) are applied to an in-memory override layer by the demo
// panel; the grid only sees them after Refresh.
const DEMO_GAIN_COURSE_ID = 'co10' // instructor gap in fixtures -> gains Dr. Omar Hassan
const DEMO_GAIN_FACULTY_ID = 'f6'
const DEMO_LOSE_COURSE_ID = 'co9' // instructor staffed in fixtures -> loses them

// ── Save-as-draft persistence (sessionStorage) ───────────────────────────────
const DRAFT_KEY = 'pce-compare-variant-d-step2-draft'

interface VariantDDraft {
  savedAt: number
  /** Course id -> template id, materialized at save time. */
  assignments: Record<string, string>
  /** Materialized effective unit selections (absence never means "default"). */
  unitSelections: UnitSelectionMap
  autoUpdateOn: boolean
  excludedCourseIds: string[]
  /** templateCriteria() per assigned template at save time — the drift baseline. */
  templateCriteriaSnapshot: Record<string, Criterion[]>
  /** Demo-only: template ids the demo panel "archived" after the save. */
  demoArchivedTemplateIds: string[]
}

function readDraft(): VariantDDraft | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY)
    return raw ? (JSON.parse(raw) as VariantDDraft) : null
  } catch {
    return null
  }
}

function writeDraft(d: VariantDDraft) {
  try {
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d))
  } catch {
    // sessionStorage unavailable — draft persistence silently off in that case.
  }
}

function fmtSavedAt(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

/** "YYYY-MM-DD" -> "Nov 20" without the UTC-midnight day shift. */
function fmtYmd(iso?: string): string | null {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** code + name split; catalog-less fixture ids fall back to the raw id as the code. */
function splitLabel(o: CourseOffering): { code: string; name: string } {
  const label = courseLabelOf(o)
  if (!label.includes(' – ')) return { code: label, name: '' }
  const [code, ...rest] = label.split(' – ')
  return { code, name: rest.join(' – ') }
}

/** Drop every unit-selection entry belonging to the given offerings — the
 *  ST-02 template-change reset ("no prior selection carries forward") and the
 *  course-deselection purge share this. Keys are `offeringId|…`. */
function withoutOfferings(map: UnitSelectionMap, offeringIds: ReadonlySet<string>): UnitSelectionMap {
  const next: UnitSelectionMap = {}
  for (const [k, v] of Object.entries(map)) {
    if (!offeringIds.has(k.slice(0, k.indexOf('|')))) next[k] = v
  }
  return next
}

// ── Template assignment (ST-02) ──────────────────────────────────────────────
// A template with courseType 'any' (or none) applies to every course type —
// it belongs in every course's type-filtered option list, after the exact
// matches.
function typeOptionsFor(o: CourseOffering, published: PceTemplate[]): PceTemplate[] {
  if (!o.courseType) return published
  const exact = published.filter(t => t.courseType === o.courseType)
  const any = published.filter(t => t.courseType === 'any' || !t.courseType)
  return [...exact, ...any.filter(t => !exact.includes(t))]
}

/** Strict ST-02 auto-assign: exactly one published type match -> assign it;
 *  2+ matches -> ONLY an isDefaultForType flag wins (documented decision:
 *  with no flag the course stays UNASSIGNED — never a silent "first found");
 *  0 matches -> unassigned, selector shows "No templates for this course
 *  type". Also drives the "Default" badge and Reset to defaults. */
function defaultTemplateFor(o: CourseOffering, published: PceTemplate[]): PceTemplate | undefined {
  // Exact-type templates outrank generic ('any' / untyped) ones: the 1 / 2+
  // rule runs inside the strongest non-empty tier.
  const exact = o.courseType ? published.filter(t => t.courseType === o.courseType) : []
  const tier = exact.length > 0
    ? exact
    : o.courseType
      ? published.filter(t => t.courseType === 'any' || !t.courseType)
      : published
  if (tier.length === 0) return undefined
  if (tier.length === 1) return tier[0]
  const flagged = tier.filter(t => t.isDefaultForType)
  return flagged.length > 0 ? flagged[0] : undefined
}

type CellState = 'staffed' | 'excluded' | 'gap' | 'blocked' | 'na'

const CELL_WORD: Record<Exclude<CellState, 'na'>, string> = {
  staffed: 'staffed, in this push',
  excluded: 'staffed, excluded from this push',
  gap: 'no one assigned',
  blocked: 'blocked by an existing survey',
}

function CellGlyph({ state }: { state: Exclude<CellState, 'na'> }) {
  if (state === 'blocked') {
    return <i className="fa-solid fa-lock text-xs" style={{ color: 'var(--chip-destructive)' }} aria-hidden="true" />
  }
  if (state === 'gap') {
    return <span aria-hidden="true" className="size-2 rounded-full" style={{ background: 'var(--chip-4)' }} />
  }
  if (state === 'excluded') {
    return <i className="fa-light fa-circle-minus text-xs text-muted-foreground" aria-hidden="true" />
  }
  return <i className="fa-solid fa-check text-xs" style={{ color: 'var(--chip-2)' }} aria-hidden="true" />
}

type ResumeNotice = { kind: 'updated' | 'unpublished'; text: string }

// ═════════════════════════════════════════════════════════════════════════════

export default function VariantDCoverageGrid() {
  const { templates, surveys } = usePce()

  const publishedTemplatesRaw = useMemo(
    () =>
      templates.filter(t =>
        t.status === 'active' && !t.archived && (!t.surveyType || t.surveyType === 'course_evaluation'),
      ),
    [templates],
  )

  // DEMO-ONLY augmentation: every fixture template is courseType 'any' with no
  // isDefaultForType flag, so the strict ST-02 rule would leave every course
  // unassigned and the grid would render zero columns. Flag tmpl1 as the type
  // default IN MEMORY (only when no real flag exists) so the rule has a
  // winner. Same lifecycle as CONFLICT_DEMO_SURVEY — shared fixtures untouched.
  const publishedTemplates = useMemo(() => {
    if (publishedTemplatesRaw.some(t => t.isDefaultForType)) return publishedTemplatesRaw
    return publishedTemplatesRaw.map(t => (t.id === 'tmpl1' ? { ...t, isDefaultForType: true } : t))
  }, [publishedTemplatesRaw])
  const byTemplateId = useMemo(() => new Map(publishedTemplates.map(t => [t.id, t])), [publishedTemplates])

  const term = MOCK_PROGRAM_TERMS.find(t => t.id === 'pt5')!
  const courses = useMemo(
    () =>
      MOCK_COURSE_OFFERINGS
        .filter(o => o.termId === term.id && o.status !== 'archived')
        .sort((a, b) => courseLabelOf(a).localeCompare(courseLabelOf(b), undefined, { numeric: true })),
    [term.id],
  )

  // Real fixture surveys + the local conflict seed (never mutates shared data).
  const surveysWithDemo = useMemo(() => [...surveys, CONFLICT_DEMO_SURVEY], [surveys])

  // ── PRISM live vs snapshot (ST-02 Auto Update / Refresh contract) ──────────
  // The demo panel mutates prismLive; the grid renders from prismSnapshot.
  // The manual Refresh button is the ONLY point where live becomes snapshot.
  const [prismLive, setPrismLive] = useState<Record<string, Partial<CourseOffering>>>({})
  const [prismSnapshot, setPrismSnapshot] = useState<Record<string, Partial<CourseOffering>>>({})
  const snapCourses = useMemo(
    () => courses.map(o => (prismSnapshot[o.id] ? { ...o, ...prismSnapshot[o.id] } : o)),
    [courses, prismSnapshot],
  )
  const snapById = useMemo(() => new Map(snapCourses.map(o => [o.id, o])), [snapCourses])

  // ── Template assignments — MATERIALIZED state, seeded once from the strict
  // auto-assign rule. Materializing (instead of deriving from defaults on
  // every render) guarantees ST-02's "after creating a template, every
  // previously-assigned template is still there": publishing a new template
  // can change what the DEFAULT would be, but never an existing assignment. ──
  const [assignments, setAssignments] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const o of courses) {
      const d = defaultTemplateFor(o, publishedTemplates)
      if (d) initial[o.id] = d.id
    }
    return initial
  })
  const templateFor = (o: CourseOffering): PceTemplate | null => {
    const t = byTemplateId.get(assignments[o.id] ?? '')
    // A template unpublished or archived since assignment reads as unassigned
    // (ST-02: blocks progress exactly like "no template assigned").
    return t && templateStoryStatusOf(t) === 'published' ? t : null
  }

  // ── Course inclusion (ST-02) — excluding purges template + units; re-
  // including re-applies the CURRENT default, never the prior state. ─────────
  const [excludedCourseIds, setExcludedCourseIds] = useState<Set<string>>(new Set())
  const isCourseIncluded = (id: string) => !excludedCourseIds.has(id)

  // ── Unit selection (ST-02 sticky map) — absence = first sight: 'new'
  // instances default to selected (first faculty appearance = all selected),
  // gaps and duplicates to deselected. Only user toggles, the template-change
  // reset, course exclusion, and Refresh reconciliation write entries. ───────
  const [unitSelections, setUnitSelections] = useState<UnitSelectionMap>({})
  const effectiveSelected = (i: SurveyInstance): boolean =>
    (unitSelections[i.key] ?? (i.status === 'new' ? 'selected' : 'deselected')) === 'selected'
  const setUnits = (keys: string[], selected: boolean) =>
    setUnitSelections(prev => {
      const next = { ...prev }
      for (const k of keys) next[k] = selected ? 'selected' : 'deselected'
      return next
    })

  // ── Auto Update flag (defaults OFF) ────────────────────────────────────────
  const [autoUpdateOn, setAutoUpdateOn] = useState(false)

  // ── Embedded template creation (same subView pattern as the production
  // step — the component never unmounts, so all assignments persist). ────────
  const [subView, setSubView] = useState<'assign' | 'create' | { buildId: string }>('assign')
  const [notice, setNotice] = useState<{ kind: 'published' | 'draft'; name: string } | null>(null)

  // ── Preview / reset-confirm / draft state ──────────────────────────────────
  const [previewTemplate, setPreviewTemplate] = useState<PceTemplate | null>(null)
  const [resetOpen, setResetOpen] = useState(false)
  const [draftInfo, setDraftInfo] = useState<{ savedAt: number } | null>(null)
  const [resumeNotices, setResumeNotices] = useState<ResumeNotice[]>([])
  const [demoDraftFlags, setDemoDraftFlags] = useState<{ gainedRole: boolean; archived: boolean }>({
    gainedRole: false, archived: false,
  })

  useEffect(() => {
    const d = readDraft()
    if (d) {
      setDraftInfo({ savedAt: d.savedAt })
      setDemoDraftFlags({
        gainedRole: false,
        archived: (d.demoArchivedTemplateIds?.length ?? 0) > 0,
      })
    }
  }, [])

  // ── Instance plan — derived from the SNAPSHOT courses (never live). ────────
  const byOffering = useMemo(() => {
    const m = new Map<string, SurveyInstance[]>()
    for (const o of snapCourses) {
      const t = byTemplateId.get(assignments[o.id] ?? '')
      const published = t && templateStoryStatusOf(t) === 'published' ? t : null
      m.set(o.id, expandInstances(o, published, surveysWithDemo, templates))
    }
    return m
  }, [snapCourses, assignments, byTemplateId, surveysWithDemo, templates])

  // The column set is DERIVED: the union of what the assigned templates
  // actually cover, in stable ALL_CRITERIA order. Reassigning a template can
  // add or drop a column — that is the point (the grid mirrors the plan).
  const columns = useMemo<Criterion[]>(() => {
    const covered = new Set<Criterion>()
    for (const o of courses) {
      const t = byTemplateId.get(assignments[o.id] ?? '')
      if (!t || templateStoryStatusOf(t) !== 'published') continue
      for (const c of templateCriteria(t)) covered.add(c)
    }
    return ALL_CRITERIA.filter(c => covered.has(c))
  }, [courses, assignments, byTemplateId])

  const cellInstances = (o: CourseOffering, c: Criterion): SurveyInstance[] =>
    (byOffering.get(o.id) ?? []).filter(i => i.criterion === c)

  const cellStateOf = (o: CourseOffering, c: Criterion): CellState => {
    const items = cellInstances(o, c)
    if (items.length === 0) return 'na'
    if (items.some(i => i.status === 'duplicate')) return 'blocked'
    if (items.some(i => i.status === 'gap')) return 'gap'
    return items.some(i => i.status === 'new' && effectiveSelected(i)) ? 'staffed' : 'excluded'
  }

  // Column aggregates — the reason this is a grid: "Coordinator: 3 unstaffed"
  // is one glance at one header, not a scan of every row.
  const columnStats = useMemo(() => {
    const stats = new Map<Criterion, { gaps: number; blocked: number }>()
    for (const c of columns) {
      let gaps = 0
      let blocked = 0
      for (const o of courses) {
        const items = (byOffering.get(o.id) ?? []).filter(i => i.criterion === c)
        if (items.some(i => i.status === 'duplicate')) blocked++
        else if (items.some(i => i.status === 'gap')) gaps++
      }
      stats.set(c, { gaps, blocked })
    }
    return stats
    // Selection is intentionally not a dependency: exclusion does not change
    // gap/block facts, only the staffed/excluded glyph.
  }, [columns, courses, byOffering])

  // ── Blocks (ST-02 — per INCLUDED course; excluded courses never block) ─────
  const includedCourses = courses.filter(o => isCourseIncluded(o.id))
  const missingTemplateCourses = includedCourses.filter(o => !templateFor(o))
  // ST-02 hard block: any role overlap with an existing Live/Closed/Results
  // Available/Archived survey. Resolved only by removing the course from the
  // push (exclusion) or retiring the existing survey.
  const overlapBlockedCourses = includedCourses.filter(o =>
    (byOffering.get(o.id) ?? []).some(i => i.status === 'duplicate'),
  )
  // ST-02 distinct hard block: a faculty-only template with zero people
  // staffed anywhere — every instance is a gap, so the push would create
  // nothing for a course the admin explicitly included. Different from a
  // PARTIAL gap, which never blocks.
  const zeroStaffedCourses = includedCourses.filter(o => {
    const items = byOffering.get(o.id) ?? []
    return !!templateFor(o) && items.length > 0 && items.every(i => i.status === 'gap')
  })
  const courseHardBlocked = (o: CourseOffering) =>
    overlapBlockedCourses.includes(o) || zeroStaffedCourses.includes(o)

  const toCreate = includedCourses.reduce(
    (n, o) => n + (byOffering.get(o.id) ?? []).filter(i => i.status === 'new' && effectiveSelected(i)).length,
    0,
  )
  const gapTotal = includedCourses.reduce(
    (n, o) => n + (byOffering.get(o.id) ?? []).filter(i => i.status === 'gap').length,
    0,
  )
  const continueBlocked =
    toCreate === 0 ||
    missingTemplateCourses.length > 0 ||
    overlapBlockedCourses.length > 0 ||
    zeroStaffedCourses.length > 0

  // ── Handlers ───────────────────────────────────────────────────────────────

  // ST-02 (bug fix): a template change resets the course's evaluatee
  // selection to full new-template coverage — every unit-selection entry for
  // the course is cleared, so nothing carries over (absence = first sight =
  // 'new' units selected), even for a role or person both templates share.
  const handleTemplateChange = (o: CourseOffering, templateId: string) => {
    setAssignments(prev => ({ ...prev, [o.id]: templateId }))
    setUnitSelections(prev => withoutOfferings(prev, new Set([o.id])))
  }

  // Uncheck = the course leaves this push entirely; its template assignment
  // and unit selections are purged NOW so a later re-selection starts fresh.
  // Re-check = re-include with the CURRENT auto-assign default (never the
  // prior state — ST-02 forces fresh reassignment).
  const handleCourseToggle = (o: CourseOffering, on: boolean) => {
    if (!on) {
      setExcludedCourseIds(prev => new Set(prev).add(o.id))
      setAssignments(prev => {
        const next = { ...prev }
        delete next[o.id]
        return next
      })
      setUnitSelections(prev => withoutOfferings(prev, new Set([o.id])))
      return
    }
    if (excludedCourseIds.has(o.id)) {
      setExcludedCourseIds(prev => {
        const next = new Set(prev)
        next.delete(o.id)
        return next
      })
      const d = defaultTemplateFor(o, publishedTemplates)
      if (d) setAssignments(prev => ({ ...prev, [o.id]: d.id }))
      return
    }
    // Included but partially or fully unit-deselected: checking selects the
    // course's remaining pushable units (production step behavior).
    const pushable = (byOffering.get(o.id) ?? []).filter(i => i.status === 'new')
    if (pushable.length > 0) setUnits(pushable.map(i => i.key), true)
  }

  // Materialize the effective state of every entry the CURRENT plan renders —
  // reconcileUnitsOnRefresh treats absent keys as brand-new, so first-sight
  // defaults must be written down before reconciling against fresh data.
  const materializeSelections = (): UnitSelectionMap => {
    const out: UnitSelectionMap = { ...unitSelections }
    for (const o of courses) {
      for (const i of byOffering.get(o.id) ?? []) {
        if (out[i.key] === undefined) out[i.key] = i.status === 'new' ? 'selected' : 'deselected'
      }
    }
    return out
  }

  // ST-02 manual Refresh — the ONLY re-sync trigger: re-derive the plan from
  // the LIVE Prism data, reconcile the selection map under the Auto Update
  // flag, then promote live to snapshot so the grid shows the new reality.
  const handleRefresh = () => {
    const liveCourses = courses.map(o => (prismLive[o.id] ? { ...o, ...prismLive[o.id] } : o))
    const fresh: SurveyInstance[] = []
    for (const o of liveCourses) {
      const t = byTemplateId.get(assignments[o.id] ?? '')
      const published = t && templateStoryStatusOf(t) === 'published' ? t : null
      fresh.push(...expandInstances(o, published, surveysWithDemo, templates))
    }
    setUnitSelections(reconcileUnitsOnRefresh(materializeSelections(), fresh, autoUpdateOn))
    setPrismSnapshot({ ...prismLive })
  }

  // Reset to defaults — every course returns to its CURRENT type default (or
  // unassigned when the strict rule has no winner); the template change also
  // resets those courses' unit selections. Irreversible once confirmed.
  const resetImpactCourses = courses.filter(o => {
    const d = defaultTemplateFor(o, publishedTemplates)
    return (assignments[o.id] ?? '') !== (d?.id ?? '')
  })
  const handleResetDefaults = () => {
    const next: Record<string, string> = {}
    const changed = new Set<string>()
    for (const o of courses) {
      const d = defaultTemplateFor(o, publishedTemplates)
      if (d) next[o.id] = d.id
      if ((assignments[o.id] ?? '') !== (d?.id ?? '')) changed.add(o.id)
    }
    setAssignments(next)
    setUnitSelections(prev => withoutOfferings(prev, changed))
    setResetOpen(false)
  }

  // ── Save as draft / resume ─────────────────────────────────────────────────
  const handleSaveDraft = () => {
    const snapshot: Record<string, Criterion[]> = {}
    for (const tid of new Set(Object.values(assignments))) {
      const t = byTemplateId.get(tid)
      if (t) snapshot[tid] = templateCriteria(t)
    }
    const draft: VariantDDraft = {
      savedAt: Date.now(),
      assignments: { ...assignments },
      unitSelections: materializeSelections(),
      autoUpdateOn,
      excludedCourseIds: [...excludedCourseIds],
      templateCriteriaSnapshot: snapshot,
      demoArchivedTemplateIds: [],
    }
    writeDraft(draft)
    setDraftInfo({ savedAt: draft.savedAt })
    setDemoDraftFlags({ gainedRole: false, archived: false })
  }

  const handleResume = () => {
    const d = readDraft()
    if (!d) return
    const notices: ResumeNotice[] = []
    const nextAssignments: Record<string, string> = {}
    const unassignedCourseIds = new Set<string>()
    const courseCodesFor = (tid: string) =>
      courses
        .filter(o => d.assignments[o.id] === tid)
        .map(o => splitLabel(o).code)
    for (const [courseId, tid] of Object.entries(d.assignments)) {
      const t = templates.find(x => x.id === tid)
      const demoArchived = d.demoArchivedTemplateIds?.includes(tid)
      if (!t || templateStoryStatusOf(t) !== 'published' || demoArchived) {
        unassignedCourseIds.add(courseId)
        continue
      }
      nextAssignments[courseId] = tid
    }
    // One notice per drifted template, not per course.
    const seen = new Set<string>()
    for (const tid of Object.values(d.assignments)) {
      if (seen.has(tid)) continue
      seen.add(tid)
      const t = templates.find(x => x.id === tid)
      const name = t?.name ?? 'A template saved with this draft'
      const demoArchived = d.demoArchivedTemplateIds?.includes(tid)
      if (!t || templateStoryStatusOf(t) !== 'published' || demoArchived) {
        const codes = courseCodesFor(tid)
        notices.push({
          kind: 'unpublished',
          text: `"${name}" is no longer published. ${codes.join(', ')} now ${codes.length === 1 ? 'has' : 'have'} no template assigned. Assign a published template to continue.`,
        })
        continue
      }
      const saved = d.templateCriteriaSnapshot[tid] ?? []
      const now = templateCriteria(t)
      const added = now.filter(c => !saved.includes(c)).map(c => CRITERION_TOGGLE_LABEL[c])
      const removed = saved.filter(c => !now.includes(c)).map(c => CRITERION_TOGGLE_LABEL[c])
      if (added.length > 0 || removed.length > 0) {
        const parts = [`"${name}" changed since this draft was saved.`]
        if (added.length > 0) parts.push(`It now also covers ${added.join(', ')}.`)
        if (removed.length > 0) parts.push(`It no longer covers ${removed.join(', ')}.`)
        parts.push('Coverage below reflects the current template.')
        notices.push({ kind: 'updated', text: parts.join(' ') })
      }
    }
    setAssignments(nextAssignments)
    setUnitSelections(withoutOfferings(d.unitSelections, unassignedCourseIds))
    setAutoUpdateOn(d.autoUpdateOn)
    setExcludedCourseIds(new Set(d.excludedCourseIds))
    setResumeNotices(notices)
  }

  const handleStartFresh = () => {
    try {
      window.sessionStorage.removeItem(DRAFT_KEY)
    } catch { /* storage unavailable */ }
    setDraftInfo(null)
    setResumeNotices([])
    setDemoDraftFlags({ gainedRole: false, archived: false })
  }

  // ── Demo controls — mutate the draft in storage / the live Prism layer ─────
  const demoGainApplied = !!prismLive[DEMO_GAIN_COURSE_ID]
  const demoLoseApplied = !!prismLive[DEMO_LOSE_COURSE_ID]
  const demoAddInstructor = () => {
    const base = courses.find(o => o.id === DEMO_GAIN_COURSE_ID)
    if (!base) return
    setPrismLive(prev => ({
      ...prev,
      [DEMO_GAIN_COURSE_ID]: { collaboratorIds: [...base.collaboratorIds, DEMO_GAIN_FACULTY_ID] },
    }))
  }
  const demoRemoveInstructor = () => {
    setPrismLive(prev => ({ ...prev, [DEMO_LOSE_COURSE_ID]: { collaboratorIds: [] } }))
  }
  const demoResetPrism = () => setPrismLive({})

  const demoTemplateGainedRole = () => {
    const d = readDraft()
    if (!d) return
    // Shrink the SAVED snapshot of the first assigned template that has more
    // than one criterion — on resume the current template then reads as
    // having gained that role since the draft was saved.
    for (const tid of new Set(Object.values(d.assignments))) {
      const snap = d.templateCriteriaSnapshot[tid]
      if (snap && snap.length > 1) {
        const dropIdx = snap.map((c, i) => ({ c, i })).filter(x => x.c !== 'students').at(-1)?.i ?? snap.length - 1
        d.templateCriteriaSnapshot[tid] = snap.filter((_, i) => i !== dropIdx)
        writeDraft(d)
        setDemoDraftFlags(prev => ({ ...prev, gainedRole: true }))
        return
      }
    }
  }
  const demoTemplateArchived = () => {
    const d = readDraft()
    if (!d) return
    const tid = Object.values(d.assignments)[0]
    if (!tid) return
    d.demoArchivedTemplateIds = [...new Set([...(d.demoArchivedTemplateIds ?? []), tid])]
    writeDraft(d)
    setDemoDraftFlags(prev => ({ ...prev, archived: true }))
  }

  const gridTemplate = `minmax(220px, 1.2fr) repeat(${columns.length}, minmax(76px, auto)) minmax(260px, auto)`

  // ── Create sub-view — after every hook, same early-return shape as the
  // production step (the component stays mounted, so state persists). ────────
  if (subView !== 'assign') {
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
              setSubView('assign')
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
              setSubView('assign')
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
            Each column is a role the assigned templates evaluate. Read down a column to spot a systemic staffing problem; select any cell for detail and actions.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => setResetOpen(true)}>
            <i className="fa-light fa-arrow-rotate-left text-xs" aria-hidden="true" />
            Reset to defaults
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setNotice(null); setSubView('create') }}>
            <i className="fa-light fa-plus" aria-hidden="true" />
            New template
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
            ? <>&ldquo;{notice.name}&rdquo; is published. Assign it in the grid below.</>
            : <>&ldquo;{notice.name}&rdquo; is saved as a draft. Publish it from Settings &rsaquo; Templates to make it assignable.</>}
        </LocalBanner>
      )}

      {/* Draft offer — persistent while a draft exists, so the resume path can
          be exercised after the demo panel mutates the stored draft. */}
      {draftInfo && (
        <LocalBanner variant="info">
          <span className="flex items-center gap-3 flex-wrap">
            <span>Draft saved at {fmtSavedAt(draftInfo.savedAt)}.</span>
            <span className="flex items-center gap-2">
              <Button variant="outline" size="xs" onClick={handleResume}>Resume</Button>
              <Button variant="ghost" size="xs" onClick={handleStartFresh}>Start fresh</Button>
            </span>
          </span>
        </LocalBanner>
      )}

      {/* Resume findings — template drift is an info notice; an archived
          template already cleared its courses to "no template assigned",
          which blocks Continue below. */}
      {resumeNotices.length > 0 && (
        <LocalBanner variant="info" dismissible onDismiss={() => setResumeNotices([])}>
          <span className="flex flex-col gap-1">
            {resumeNotices.map((n, idx) => (
              <span key={idx}>{n.text}</span>
            ))}
          </span>
        </LocalBanner>
      )}

      {/* ST-02 Auto Update — ONE flag for the whole screen (defaults OFF). It
          changes nothing by itself: it only decides how units the grid has
          never seen arrive on the next manual Refresh, which is the only
          re-sync trigger and sits beside the faculty-gap summary. */}
      <div className="flex items-center justify-between gap-4">
        <label htmlFor="var-d-auto-update" className="flex items-center gap-2.5 cursor-pointer">
          <ToggleSwitch
            id="var-d-auto-update"
            checked={autoUpdateOn}
            onChange={setAutoUpdateOn}
          />
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">Auto Update</span>
            <span className="text-xs text-muted-foreground">
              Faculty found on the next refresh start selected. Selections you have already made never change.
            </span>
          </span>
        </label>
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-xs text-muted-foreground tabular-nums">
            {gapTotal > 0
              ? <span style={{ color: 'var(--chip-4)' }}>{gapTotal} role{gapTotal !== 1 ? 's' : ''} unassigned</span>
              : 'No faculty gaps'}
            {' · '}Recheck faculty assignments in Prism.
          </span>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Legend — the glyphs must not require guessing ── */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground" aria-label="Cell legend">
        <span className="inline-flex items-center gap-1.5">
          <i className="fa-solid fa-check text-xs" style={{ color: 'var(--chip-2)' }} aria-hidden="true" />
          In this push
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="fa-light fa-circle-minus text-xs" aria-hidden="true" />
          Excluded
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2 rounded-full" style={{ background: 'var(--chip-4)' }} />
          No one assigned
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="fa-solid fa-lock text-xs" style={{ color: 'var(--chip-destructive)' }} aria-hidden="true" />
          Blocked by an existing survey
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true">–</span>
          Not in template
        </span>
      </div>

      {/* ── The grid ── */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <div
            role="table"
            aria-label="Role coverage by course"
            className="grid text-sm"
            style={{ gridTemplateColumns: gridTemplate, minWidth: 720 }}
          >
            {/* Header row */}
            <div role="row" className="contents">
              <span role="columnheader" className="flex items-end px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border bg-muted/40">
                Course
              </span>
              {columns.map(c => {
                const stats = columnStats.get(c) ?? { gaps: 0, blocked: 0 }
                return (
                  <span key={c} role="columnheader" className="flex flex-col items-center justify-end gap-0.5 px-2 py-2 text-center border-b border-border bg-muted/40">
                    <span className="text-xs font-medium text-muted-foreground leading-tight">{CRITERION_TOGGLE_LABEL[c]}</span>
                    {stats.blocked > 0 ? (
                      <span className="text-[11px] font-medium tabular-nums" style={{ color: 'var(--chip-destructive)' }}>
                        {stats.blocked} blocked
                      </span>
                    ) : stats.gaps > 0 ? (
                      <span className="text-[11px] font-medium tabular-nums" style={{ color: 'var(--chip-4)' }}>
                        {stats.gaps} unstaffed
                      </span>
                    ) : (
                      <span className="text-[11px] text-transparent select-none" aria-hidden="true">·</span>
                    )}
                  </span>
                )
              })}
              <span role="columnheader" className="flex items-end px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border bg-muted/40 border-s">
                Template
              </span>
            </div>

            {/* Course rows */}
            {courses.map((o, rowIdx) => {
              const snap = snapById.get(o.id) ?? o
              const { code, name } = splitLabel(snap)
              const all = byOffering.get(o.id) ?? []
              const pushable = all.filter(i => i.status === 'new')
              const inCount = pushable.filter(i => effectiveSelected(i)).length
              const excluded = !isCourseIncluded(o.id)
              const tmpl = templateFor(o)
              const typeDefault = defaultTemplateFor(o, publishedTemplates)
              const options = typeOptionsFor(o, publishedTemplates)
              const isLast = rowIdx === courses.length - 1
              const cellBorder = isLast ? '' : 'border-b border-border'
              const checkboxState = excluded
                ? false
                : pushable.length === 0
                  ? true
                  : inCount === pushable.length
                    ? true
                    : inCount > 0
                      ? ('indeterminate' as const)
                      : false
              const previewBtn = (
                <Button
                  variant="ghost"
                  size="xs"
                  className="text-muted-foreground hover:text-foreground"
                  disabled={!tmpl}
                  onClick={() => tmpl && setPreviewTemplate(tmpl)}
                >
                  Preview
                  <span className="sr-only">
                    {tmpl ? ` the survey for ${code}` : '. Assign a template to preview.'}
                  </span>
                </Button>
              )
              return (
                <div key={o.id} role="row" className="contents">
                  <span
                    role="cell"
                    className={`flex items-center gap-2.5 px-3 py-1.5 min-w-0 ${cellBorder} ${excluded ? 'opacity-50' : ''}`}
                    style={{
                      minHeight: 44,
                      ...(courseHardBlocked(o)
                        ? { boxShadow: 'inset 3px 0 0 var(--chip-destructive)' }
                        : {}),
                    }}
                  >
                    <Checkbox
                      checked={checkboxState}
                      onCheckedChange={v => handleCourseToggle(o, !!v)}
                      aria-label={`Include ${code} in this push`}
                    />
                    <span className="font-mono text-xs tabular-nums shrink-0 text-muted-foreground">{code}</span>
                    {name && <span className="truncate text-sm">{name}</span>}
                  </span>

                  {columns.map(c => {
                    const state = cellStateOf(o, c)
                    if (state === 'na') {
                      return (
                        <span key={c} role="cell" className={`flex items-center justify-center px-2 py-1.5 text-muted-foreground/50 ${cellBorder} ${excluded ? 'opacity-50' : ''}`} style={{ minHeight: 44 }}>
                          <span aria-hidden="true">–</span>
                          <span className="sr-only">{`${CRITERION_TOGGLE_LABEL[c]} is not in the template for ${code}`}</span>
                        </span>
                      )
                    }
                    const items = cellInstances(o, c)
                    return (
                      <span key={c} role="cell" className={`flex items-center justify-center px-2 py-1.5 ${cellBorder} ${excluded ? 'opacity-50' : ''}`} style={{ minHeight: 44 }}>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="xs"
                              className="size-7 p-0"
                              aria-label={`${code}, ${CRITERION_TOGGLE_LABEL[c]}: ${CELL_WORD[state]}. Open details`}
                            >
                              <CellGlyph state={state} />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent align="center" className="w-80 p-0">
                            <CellDetail
                              code={code}
                              criterionLabel={CRITERION_TOGGLE_LABEL[c]}
                              state={state}
                              items={items}
                              isSelected={effectiveSelected}
                              onUnits={setUnits}
                              excluded={excluded}
                              onRemoveCourse={() => handleCourseToggle(o, false)}
                            />
                          </PopoverContent>
                        </Popover>
                      </span>
                    )
                  })}

                  <span role="cell" className={`flex items-center gap-1.5 px-3 py-1.5 border-s ${cellBorder} ${excluded ? 'opacity-50' : ''}`} style={{ minHeight: 44 }}>
                    <Select
                      value={tmpl?.id ?? ''}
                      onValueChange={tid => handleTemplateChange(o, tid)}
                    >
                      <SelectTrigger
                        size="sm"
                        disabled={excluded}
                        aria-label={`Template for ${code}${!tmpl ? ' · required' : ''}`}
                        className="min-w-0 flex-1 [&>span]:truncate"
                      >
                        <SelectValue placeholder="Assign a template" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* ST-02: zero published templates for this course's TYPE — exact copy. */}
                        {options.length === 0 && (
                          <div className="px-2 py-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                            No templates for this course type
                          </div>
                        )}
                        {options.map(t => (
                          <SelectItem key={t.id} value={t.id}>
                            <span className="flex items-center gap-1.5 min-w-0">
                              <span className="truncate">{t.name}</span>
                              {t.id === typeDefault?.id && (
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
                    {/* ST-02 Preview Survey — gated strictly on an assigned
                        template; the disabled state carries the exact copy in
                        a Tip on a focusable wrapper (disabled buttons swallow
                        pointer and focus events). */}
                    {tmpl ? (
                      previewBtn
                    ) : (
                      <Tip label="Assign a template to preview" side="left">
                        <span
                          className="inline-flex rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                          tabIndex={0}
                        >
                          {previewBtn}
                        </span>
                      </Tip>
                    )}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Demo controls — scaffolding, visually fenced off from product UI ── */}
      <section
        aria-label="Demo controls"
        className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 flex flex-col gap-3"
      >
        <span className="text-xs font-medium text-muted-foreground">Demo controls</span>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">Simulate PRISM changes (demo only). The grid reacts on Refresh, never immediately.</span>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="xs" disabled={demoGainApplied} onClick={demoAddInstructor}>
              {demoGainApplied
                ? `Instructor added in Prism (${splitLabel(snapById.get(DEMO_GAIN_COURSE_ID) ?? courses[0]).code})`
                : `Simulate: instructor assigned in Prism (${splitLabel(snapById.get(DEMO_GAIN_COURSE_ID) ?? courses[0]).code})`}
            </Button>
            <Button variant="outline" size="xs" disabled={demoLoseApplied} onClick={demoRemoveInstructor}>
              {demoLoseApplied
                ? `Instructor removed in Prism (${splitLabel(snapById.get(DEMO_LOSE_COURSE_ID) ?? courses[0]).code})`
                : `Simulate: instructor removed in Prism (${splitLabel(snapById.get(DEMO_LOSE_COURSE_ID) ?? courses[0]).code})`}
            </Button>
            <Button variant="ghost" size="xs" disabled={!demoGainApplied && !demoLoseApplied} onClick={demoResetPrism}>
              Reset demo Prism data
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">Simulate draft drift (demo only). Save a draft first, apply one, then select Resume above.</span>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="xs" disabled={!draftInfo || demoDraftFlags.gainedRole} onClick={demoTemplateGainedRole}>
              Simulate: template gained a new role since draft was saved
            </Button>
            <Button variant="outline" size="xs" disabled={!draftInfo || demoDraftFlags.archived} onClick={demoTemplateArchived}>
              Simulate: template archived since draft was saved
            </Button>
          </div>
        </div>
      </section>

      {/* Per-row Preview target — the lightweight template-backed dialog; it
          previews the CURRENT (possibly unsaved) assignment and never shows a
          survey title. */}
      <SurveyPreviewDialog
        template={previewTemplate}
        open={previewTemplate !== null}
        onOpenChange={open => { if (!open) setPreviewTemplate(null) }}
      />

      {/* Reset to defaults — irreversible per ST-02, so the confirmation
          itemizes what will change instead of a generic are-you-sure. */}
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset all templates to defaults?</AlertDialogTitle>
            <AlertDialogDescription>
              {resetImpactCourses.length > 0 ? (
                <>
                  {resetImpactCourses.length} course{resetImpactCourses.length !== 1 ? 's' : ''} will return to the default template
                  for {resetImpactCourses.length !== 1 ? 'their course types' : 'its course type'} (courses with no type default become unassigned),
                  and the evaluatee selections on {resetImpactCourses.length !== 1 ? 'those courses' : 'that course'} will
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
              variant={resetImpactCourses.length > 0 ? 'destructive' : 'default'}
              onClick={handleResetDefaults}
            >
              Reset templates
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Footer — every hard-block gate lives on Continue ── */}
      <div className="sticky bottom-0 mt-auto bg-background border-t border-border py-4 flex items-center justify-between gap-4">
        <span className="text-xs tabular-nums text-muted-foreground">
          {toCreate} evaluation{toCreate !== 1 ? 's' : ''} across {includedCourses.length} course{includedCourses.length !== 1 ? 's' : ''}
          {gapTotal > 0 && (
            <> · <span style={{ color: 'var(--chip-4)' }}>{gapTotal} role{gapTotal !== 1 ? 's' : ''} unassigned</span></>
          )}
          {overlapBlockedCourses.length > 0 && (
            <>
              {' · '}
              <span className="font-medium" style={{ color: 'var(--chip-destructive)' }}>
                {overlapBlockedCourses.length} course{overlapBlockedCourses.length !== 1 ? 's' : ''} blocked by an existing survey
              </span>
            </>
          )}
          {zeroStaffedCourses.length > 0 && (
            <>
              {' · '}
              <span className="font-medium" style={{ color: 'var(--chip-destructive)' }}>
                {zeroStaffedCourses.length} course{zeroStaffedCourses.length !== 1 ? 's' : ''} with no one to evaluate
              </span>
            </>
          )}
          {missingTemplateCourses.length > 0 && (
            <> · {missingTemplateCourses.length} course{missingTemplateCourses.length !== 1 ? 's' : ''} without a template</>
          )}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            <i className="fa-light fa-arrow-left text-xs" aria-hidden="true" />
            Back
          </Button>
          <Button variant="outline" size="sm" onClick={handleSaveDraft}>
            Save as draft
          </Button>
          <Button variant="default" size="sm" disabled={continueBlocked}>
            Continue
            <i className="fa-light fa-arrow-right text-xs" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Cell popover — the detail for ONE course x criterion. The blocked state is
// this variant's stand-in for ST-02's per-conflict accordion panel and carries
// all four fields: Evaluate? / Role / Assigned / Covered by. A staffed cell's
// Evaluate? field IS the per-unit checkbox.
// ═════════════════════════════════════════════════════════════════════════════

function CellDetail({
  code, criterionLabel, state, items, isSelected, onUnits, excluded, onRemoveCourse,
}: {
  code: string
  criterionLabel: string
  state: Exclude<CellState, 'na'>
  items: SurveyInstance[]
  isSelected: (i: SurveyInstance) => boolean
  onUnits: (keys: string[], selected: boolean) => void
  excluded: boolean
  onRemoveCourse: () => void
}) {
  if (state === 'blocked') {
    const rep = items.find(i => i.status === 'duplicate')!
    const people = items.filter(i => i.personName).map(i => i.personName!)
    const existing = rep.existing!
    return (
      <div className="flex flex-col gap-2.5 p-3">
        <p className="text-sm font-medium inline-flex items-center gap-1.5" style={{ color: 'var(--chip-destructive)' }}>
          <i className="fa-solid fa-lock text-xs" aria-hidden="true" />
          Blocked by an existing survey
        </p>
        <dl className="rounded-lg border border-border px-3 py-2.5 flex flex-col gap-1.5 text-sm">
          <div className="flex items-center gap-3">
            <dt className="text-xs text-muted-foreground shrink-0" style={{ width: 76 }}>Evaluate?</dt>
            <dd>
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
              >
                No
              </span>
            </dd>
          </div>
          <div className="flex items-baseline gap-3">
            <dt className="text-xs text-muted-foreground shrink-0" style={{ width: 76 }}>Role</dt>
            <dd className="font-medium">{rep.scope === 'course' ? 'Course material' : rep.roleLabel}</dd>
          </div>
          <div className="flex items-baseline gap-3">
            <dt className="text-xs text-muted-foreground shrink-0" style={{ width: 76 }}>Assigned</dt>
            <dd className="min-w-0 truncate">{people.length > 0 ? people.join(', ') : 'No one assigned'}</dd>
          </div>
          <div className="flex items-center gap-3">
            <dt className="text-xs text-muted-foreground shrink-0" style={{ width: 76 }}>Covered by</dt>
            <dd className="flex items-center gap-2 min-w-0">
              <StoryStatusBadgeOS status={storyStatusOf(existing)} />
              {fmtYmd(existing.openDate) && (
                <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                  Opened {fmtYmd(existing.openDate)}
                </span>
              )}
            </dd>
          </div>
        </dl>
        <p className="text-xs text-muted-foreground">
          {code} cannot be pushed while the existing survey covers this role. Remove it from this push, or retire the existing survey first.
        </p>
        <span>
          <Button
            variant="outline"
            size="sm"
            onClick={onRemoveCourse}
            disabled={excluded}
          >
            {excluded ? 'Removed from push' : 'Remove course from push'}
          </Button>
        </span>
      </div>
    )
  }

  if (state === 'gap') {
    const gap = items.find(i => i.status === 'gap')!
    return (
      <div className="flex flex-col gap-2 p-3">
        <p className="text-sm font-medium inline-flex items-center gap-1.5" style={{ color: 'var(--chip-4)' }}>
          <span aria-hidden="true" className="size-2 rounded-full" style={{ background: 'var(--chip-4)' }} />
          No {gap.roleLabel.toLowerCase()} assigned
        </p>
        <p className="text-xs text-muted-foreground">
          The push proceeds without this evaluation for {code}.
        </p>
        {gap.prismHref && (
          <span>
            <AddInPrismButton href={gap.prismHref} label="Add faculty" roles={[gap.roleLabel]} />
          </span>
        )}
      </div>
    )
  }

  // staffed / excluded — who is assigned; each unit's Evaluate? checkbox.
  const fresh = items.filter(i => i.status === 'new')
  return (
    <div className="flex flex-col gap-1 p-3">
      <p className="text-sm font-medium pb-1">{criterionLabel} for {code}</p>
      {fresh.map(item => (
        <div key={item.key} className="flex items-center gap-2.5" style={{ minHeight: 32 }}>
          <Checkbox
            id={`var-d-unit-${item.key.replace(/[^a-zA-Z0-9_-]/g, '-')}`}
            checked={isSelected(item)}
            disabled={excluded}
            onCheckedChange={v => onUnits([item.key], !!v)}
          />
          <CheckboxLabel htmlFor={`var-d-unit-${item.key.replace(/[^a-zA-Z0-9_-]/g, '-')}`} className="flex items-baseline gap-1.5 font-normal min-w-0">
            <span className="text-sm truncate">
              {item.scope === 'course' ? 'Course material' : (item.personName ?? 'No one assigned')}
            </span>
            {item.scope !== 'course' && item.roleLabel && (
              <span className="text-xs text-muted-foreground shrink-0">· {item.roleLabel}</span>
            )}
          </CheckboxLabel>
        </div>
      ))}
      <p className="text-xs text-muted-foreground pt-1">
        Unchecked evaluations are left out of this push.
      </p>
    </div>
  )
}
