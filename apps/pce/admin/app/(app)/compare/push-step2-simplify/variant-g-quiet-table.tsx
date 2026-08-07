'use client'

// COMPARE VARIANT G — "Quiet table" (throwaway; delete once a direction is
// picked, same lifecycle as /compare/push-survey-design).
//
// Direction requested after a live walkthrough of A–F (2026-08-03, second
// round): none of the six read as genuinely simple, because every one of
// them renders full coverage detail on EVERY row, including the majority
// (Ready) that need zero interaction.
//
// Thesis: collapse by default (variant A's minimal row), stay flat and
// filterable (variant F's course-code order + segmented filter, never
// regroup), state severity as real DS status badges instead of hand-rolled
// dot+text, and answer "who is on this course" at a glance with an
// Evaluatees avatar column (DS AvatarGroup, capped at 3 + overflow — the
// same composition the DS docs preview uses) instead of hiding it behind a
// click.
//
// Revised a second time (2026-08-03, third round) after live feedback that
// the sub-table was still hard to read: dropped the "Evaluate?/Role/
// Assigned/Covered by" grid entirely (it read as its own mini spreadsheet)
// in favor of plain sentences grouped by the existing survey doing the
// blocking.
//
// Revised a third time (2026-08-03, fourth+ round): three straight attempts
// to put the include/exclude toggle directly ON the tiny avatar (a
// checkmark badge, an ×/+ badge, a DS Checkbox overlay) were each reported
// unreliable/unclear in live testing. Evaluatees is now READ-ONLY at rest —
// a plain avatar summary of who's currently included — and opens a
// Popover+Command picker (EvaluateesPickerCell) to actually change the
// selection, reverting to the summary on close. Same composition already
// proven for Cohort/What-to-evaluate in TokenSelect
// (courses-evaluatees/scope-controls.tsx), including its documented a11y
// fixes: a check glyph inside CommandItem (never a nested DS Checkbox —
// Checkbox is a <button>, which trips nested-interactive inside
// CommandItem's role="option"); state in the accessible name, never
// aria-selected (cmdk owns that for keyboard-highlight); PopoverContent
// gets an explicit aria-label (it's role="dialog"). The disclosure chevron
// still exists ONLY for role-overlap conflicts — gaps and inclusion are
// both handled by the picker now, so a Ready or gap-only row has nothing
// left to expand.
//
// Engine, state model, and ST-02 rule coverage are carried over from
// variant-f-flat-filtered.tsx (per-course Continue gate, type-filtered
// template auto-assign + isDefaultForType tie-break, Auto Update flag +
// manual Refresh via reconcileUnitsOnRefresh, Save as draft/resume with
// drift + archived-template notices, embedded Create-template round trip,
// Reset to defaults). Preview now opens the real SurveyPreviewDialog (ST-02:
// "opens ST-10's read-only student preview") — F's Preview button silently
// did nothing on a row with no disclosure, a bug this file does not repeat.

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AvatarGroup, AvatarGroupCount,
  Popover, PopoverTrigger, PopoverContent,
  Command, CommandList, CommandEmpty, CommandGroup, CommandItem,
  Badge, Button, Checkbox, LocalBanner,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Tip, ToggleGroup, ToggleGroupItem, ToggleSwitch,
} from '@exxatdesignux/ui'
import { cn } from '@/lib/utils'
import { PersonAvatar } from '@/components/pce/person-avatar'
import { StoryStatusBadgeOS } from '@/components/pce/pce-badges'
import { ListHubStatusBadge } from '@/components/list-hub-status-badge'
import {
  LIST_HUB_STATUS_TINT_SUCCESS, LIST_HUB_STATUS_TINT_WARNING, LIST_HUB_STATUS_TINT_NEUTRAL,
  LIST_HUB_STATUS_TINT_DANGER,
} from '@/lib/list-status-badges'
import { usePce } from '@/components/pce/pce-state'
import { CreateBlankTemplate } from '@/components/pce/create-blank-template'
import { TemplateEditor } from '@/components/pce/template-editor'
import { SurveyPreviewDialog } from '@/components/pce/distribute-wizard/survey-preview-dialog'
import { TypePill } from '@/components/pce/courses-evaluatees/scope-controls'
import {
  MOCK_COURSE_OFFERINGS, MOCK_PROGRAM_TERMS, COURSE_TYPE_FULL_LABEL, deliveryModeOf,
  type CourseOffering, type PceSurvey, type PceTemplate,
} from '@/lib/pce-mock-data'
import {
  courseLabelOf, templateCriteria, CRITERION_BY_TYPE, CRITERION_TOGGLE_LABEL,
} from '@/lib/pce-course-readiness'
import {
  expandInstances, reconcileUnitsOnRefresh, storyStatusOf,
  type StoryStatus, type SurveyInstance, type UnitSelectionMap,
} from '@/lib/pce-push-validation'

// ── Demo-only conflict seed ──────────────────────────────────────────────────
// DPT-510 (co13) only carries Scheduled fixtures (pf0/pf1/pf2), which do NOT
// block. This LOCAL Live instructor-scope survey makes its Instructor coverage
// a hard block without touching pce-mock-data.ts.
const CONFLICT_DEMO_SURVEY: PceSurvey = {
  id: 'demo-live-co13-quiet',
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

// ── Demo PRISM simulation target ─────────────────────────────────────────────
// One course (co14, no instructor staffed in the fixture) whose staffing the
// demo panel can mutate. Mutations land in a "PRISM" overlay that the table
// only sees after Refresh — so Auto Update's refresh-time behavior is real.
const DEMO_COURSE_ID = 'co14'
type StaffingOverlay = Partial<Pick<
  CourseOffering,
  'primaryFacultyId' | 'collaboratorIds' | 'coInstructorIds' | 'labTaIds' | 'placementFacultyIds'
>>

// ── Save-as-draft payload (sessionStorage; this compare page only) ───────────
const DRAFT_KEY = 'pce-compare-vg-step2-draft'

interface DraftTemplateSnapshot {
  templateId: string
  templateName: string
  /** templateCriteria() at save time — the drift-detection baseline. */
  criteria: string[]
}
interface DraftPayload {
  savedAt: string
  /** EFFECTIVE assignment per course at save time ('' = unassigned). */
  assignments: Record<string, string>
  unitSelections: UnitSelectionMap
  autoUpdateOn: boolean
  excluded: string[]
  templateSnapshots: Record<string, DraftTemplateSnapshot>
  /** Demo-only: templates "archived since the draft was saved". */
  archivedTemplateIds: string[]
}

function readDraft(): DraftPayload | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    return raw ? (JSON.parse(raw) as DraftPayload) : null
  } catch {
    return null
  }
}
function writeDraft(d: DraftPayload) {
  try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d)) } catch { /* demo only */ }
}

interface DriftNotice {
  kind: 'updated' | 'unpublished'
  courseCode: string
  templateName: string
  addedRoleLabels: string[]
  removedRoleLabels: string[]
}

// ── Small helpers (same vocabulary as the sibling compare variants) ──────────

function splitLabel(o: CourseOffering): { code: string; name: string } {
  const label = courseLabelOf(o)
  if (!label.includes(' – ')) return { code: label, name: '' }
  const [code, ...rest] = label.split(' – ')
  return { code, name: rest.join(' – ') }
}

const criterionLabel = (c: string) =>
  (CRITERION_TOGGLE_LABEL as Record<string, string>)[c] ?? c

/** "YYYY-MM-DD" → "Nov 20" without the UTC-midnight day shift of new Date(iso). */
function fmtYmd(iso?: string): string | null {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface DupGroup {
  key: string
  roleLabel: string
  names: string[]
  status: StoryStatus
  openedLabel: string | null
  existingId: string
}

/** Groups role-overlap conflict instances by the SAME existing survey + role,
 *  so two instructors blocked by one survey read as one sentence ("Dr. Chen
 *  and Dr. Gomez are already covered…") instead of two identical-looking
 *  rows that only differ by name. */
function buildDupGroups(dups: SurveyInstance[]): DupGroup[] {
  const map = new Map<string, DupGroup>()
  for (const i of dups) {
    if (!i.existing) continue
    const key = `${i.existing.id}|${i.roleLabel}`
    const existing = map.get(key)
    const name = i.personName ?? 'Course material'
    if (existing) {
      existing.names.push(name)
    } else {
      map.set(key, {
        key,
        roleLabel: i.roleLabel || 'Course material',
        names: [name],
        status: storyStatusOf(i.existing),
        openedLabel: fmtYmd(i.existing.openDate),
        existingId: i.existing.id,
      })
    }
  }
  return [...map.values()]
}

/** A template fits a course's type when it matches exactly or is generic. */
function templateFitsType(t: PceTemplate, o: CourseOffering): boolean {
  return !t.courseType || t.courseType === 'any' || t.courseType === o.courseType
}

/** Drop every unit-selection entry belonging to one offering (keys are
 *  `offeringId|…`). Used by the template-change reset and course exclusion. */
function withoutOfferings(map: UnitSelectionMap, offeringIds: ReadonlySet<string>): UnitSelectionMap {
  const next: UnitSelectionMap = {}
  for (const [k, v] of Object.entries(map)) {
    if (!offeringIds.has(k.slice(0, k.indexOf('|')))) next[k] = v
  }
  return next
}

function fmtSavedAt(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

// checkbox · chevron · course · type · template · faculty · status · preview
const TABLE_GRID = '24px 24px minmax(0,1fr) 90px 170px 140px 210px 76px'

type FilterKey = 'all' | 'attention' | 'blocked'

/** Per-course Continue-gate failure states (ST-02 Blocks). Faculty gaps alone
 *  never appear here — they never block. */
type BlockReason = 'no-template' | 'overlap' | 'no-units' | 'unstaffed' | 'none-selected'

interface Row {
  offering: CourseOffering
  code: string
  name: string
  template: PceTemplate | null
  instances: SurveyInstance[]
  /** Creatable units (status 'new') — the only toggleable ones. */
  fresh: SurveyInstance[]
  gaps: SurveyInstance[]
  dups: SurveyInstance[]
}

interface CourseGate {
  reasons: BlockReason[]
  selectedCount: number
}

// ═════════════════════════════════════════════════════════════════════════════

export default function VariantGQuietTable() {
  const { templates, surveys } = usePce()

  // Demo-only "archived since the draft was saved" templates — locally removed
  // from the published set so the archived-template resume path is real.
  const [demoArchivedIds, setDemoArchivedIds] = useState<ReadonlySet<string>>(new Set())

  const publishedTemplates = useMemo(
    () => templates.filter(t =>
      t.status === 'active' && !t.archived && !demoArchivedIds.has(t.id) &&
      (!t.surveyType || t.surveyType === 'course_evaluation')),
    [templates, demoArchivedIds],
  )

  const term = MOCK_PROGRAM_TERMS.find(t => t.id === 'pt5')!
  const baseCourses = useMemo(
    () =>
      MOCK_COURSE_OFFERINGS
        .filter(o => o.termId === term.id && o.status !== 'archived')
        .sort((a, b) => courseLabelOf(a).localeCompare(courseLabelOf(b), undefined, { numeric: true })),
    [term.id],
  )

  // ── Two-copy PRISM model (demo) ───────────────────────────────────────────
  const [prismStaffing, setPrismStaffing] = useState<StaffingOverlay | null>(null)
  const [fetchedStaffing, setFetchedStaffing] = useState<StaffingOverlay | null>(null)
  const applyStaffing = (list: CourseOffering[], overlay: StaffingOverlay | null) =>
    overlay ? list.map(o => (o.id === DEMO_COURSE_ID ? { ...o, ...overlay } : o)) : list
  const courses = useMemo(
    () => applyStaffing(baseCourses, fetchedStaffing),
    [baseCourses, fetchedStaffing],
  )
  const prismPending = JSON.stringify(prismStaffing) !== JSON.stringify(fetchedStaffing)
  const demoCourse = baseCourses.find(o => o.id === DEMO_COURSE_ID) ?? null
  const demoCourseCode = demoCourse ? splitLabel(demoCourse).code : DEMO_COURSE_ID

  // Real fixture surveys + the local conflict seed (never mutates shared data).
  const surveysPlus = useMemo(() => [...surveys, CONFLICT_DEMO_SURVEY], [surveys])

  // ── ST-02 auto-assign — type-filtered, never a blind first-published pick.
  const defaults = useMemo(() => {
    const out: Record<string, string> = {}
    for (const o of courses) {
      const matched = publishedTemplates.filter(t => templateFitsType(t, o))
      if (matched.length === 0) continue
      out[o.id] = (matched.length === 1
        ? matched[0]
        : matched.find(t => t.isDefaultForType) ?? matched[0]).id
    }
    return out
  }, [courses, publishedTemplates])

  const [assignments, setAssignments] = useState<Record<string, string>>({})
  const byTemplateId = useMemo(
    () => new Map<string, PceTemplate>(publishedTemplates.map(t => [t.id, t])),
    [publishedTemplates],
  )
  const effectiveTemplateId = (o: CourseOffering) => {
    const raw = assignments[o.id] ?? defaults[o.id] ?? ''
    return byTemplateId.has(raw) ? raw : ''
  }

  const rows = useMemo<Row[]>(
    () =>
      courses.map(o => {
        const raw = assignments[o.id] ?? defaults[o.id] ?? ''
        const template = byTemplateId.get(raw) ?? null
        const instances = expandInstances(o, template, surveysPlus, templates)
        const { code, name } = splitLabel(o)
        return {
          offering: o, code, name, template, instances,
          fresh: instances.filter(i => i.status === 'new'),
          gaps: instances.filter(i => i.status === 'gap'),
          dups: instances.filter(i => i.status === 'duplicate'),
        }
      }),
    [courses, assignments, defaults, byTemplateId, surveysPlus, templates],
  )

  // ── Inclusion + sticky per-unit selection (ST-02 Phase 2 model) ───────────
  const [excluded, setExcluded] = useState<Set<string>>(new Set())
  const [unitSelections, setUnitSelections] = useState<UnitSelectionMap>({})
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [autoUpdateOn, setAutoUpdateOn] = useState(false)

  useEffect(() => {
    setUnitSelections(prev => {
      let changed = false
      const next = { ...prev }
      for (const r of rows) {
        if (excluded.has(r.offering.id)) continue
        for (const i of r.instances) {
          if (next[i.key] !== undefined) continue
          next[i.key] = i.status === 'new' ? 'selected' : 'deselected'
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [rows, excluded])

  const unitSelected = (i: SurveyInstance) => unitSelections[i.key] === 'selected'
  const toggleUnit = (key: string) =>
    setUnitSelections(prev => ({ ...prev, [key]: prev[key] === 'selected' ? 'deselected' : 'selected' }))

  // ── Per-course gate (no global sum can mask a zero course) ────────────────
  const gates = useMemo(() => {
    const m = new Map<string, CourseGate>()
    for (const r of rows) {
      const selectedCount = r.fresh.filter(i => unitSelections[i.key] === 'selected').length
      const reasons: BlockReason[] = []
      if (!r.template) {
        reasons.push('no-template')
      } else {
        if (r.dups.length > 0) reasons.push('overlap')
        if (r.instances.length === 0) reasons.push('no-units')
        else if (r.fresh.length === 0 && r.gaps.length > 0 && r.dups.length === 0) reasons.push('unstaffed')
        else if (r.fresh.length > 0 && selectedCount === 0) reasons.push('none-selected')
      }
      m.set(r.offering.id, { reasons, selectedCount })
    }
    return m
  }, [rows, unitSelections])

  // ── Filter — a PREDICATE, never a regrouping. Rows only hide or show. ─────
  // Defaults to ALL, not "Needs attention" — a row you just fixed (e.g. by
  // assigning its template) would otherwise vanish out from under you.
  const [filter, setFilter] = useState<FilterKey>('all')
  const matches = (r: Row): boolean => {
    if (filter === 'all') return true
    if (excluded.has(r.offering.id)) return false
    const gate = gates.get(r.offering.id)!
    return filter === 'blocked'
      ? gate.reasons.length > 0
      : gate.reasons.length > 0 || r.gaps.length > 0
  }
  const attentionCount = rows.filter(r =>
    !excluded.has(r.offering.id) &&
    (gates.get(r.offering.id)!.reasons.length > 0 || r.gaps.length > 0)).length
  const blockedCount = rows.filter(r =>
    !excluded.has(r.offering.id) && gates.get(r.offering.id)!.reasons.length > 0).length
  const visibleCount = rows.filter(matches).length

  const includedRows = rows.filter(r => !excluded.has(r.offering.id))
  const toCreate = includedRows.reduce((n, r) => n + gates.get(r.offering.id)!.selectedCount, 0)
  const gapTotal = includedRows.reduce((n, r) => n + r.gaps.length, 0)
  const blockedInPush = includedRows.filter(r => gates.get(r.offering.id)!.reasons.length > 0)
  const canContinue = includedRows.length > 0 && blockedInPush.length === 0 && toCreate > 0
  const continueDisabledReason = includedRows.length === 0
    ? 'No courses are included in this push.'
    : blockedInPush.length > 0
      ? `${blockedInPush.length} course${blockedInPush.length !== 1 ? 's are' : ' is'} blocked. Resolve or exclude ${blockedInPush.length !== 1 ? 'them' : 'it'} before continuing.`
      : toCreate === 0
        ? 'Nothing is selected to evaluate yet.'
        : ''

  // ── Handlers ──────────────────────────────────────────────────────────────

  const toggleCourse = (id: string) => {
    if (excluded.has(id)) {
      setExcluded(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    } else {
      setExcluded(prev => new Set(prev).add(id))
      setAssignments(prev => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      setUnitSelections(prev => withoutOfferings(prev, new Set([id])))
    }
  }

  const toggleExpanded = (id: string) =>
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const changeTemplate = (offeringId: string, templateId: string) => {
    setAssignments(prev => ({ ...prev, [offeringId]: templateId }))
    setUnitSelections(prev => withoutOfferings(prev, new Set([offeringId])))
  }

  const [resetOpen, setResetOpen] = useState(false)
  const resetChangedCount = rows.filter(r =>
    effectiveTemplateId(r.offering) !== (defaults[r.offering.id] ?? '')).length
  const handleResetDefaults = () => {
    const changed = new Set(
      rows.filter(r => effectiveTemplateId(r.offering) !== (defaults[r.offering.id] ?? ''))
        .map(r => r.offering.id),
    )
    setAssignments({})
    if (changed.size > 0) setUnitSelections(prev => withoutOfferings(prev, changed))
    setResetOpen(false)
  }

  const handleRefresh = () => {
    const freshCourses = applyStaffing(baseCourses, prismStaffing)
    const fresh: SurveyInstance[] = []
    for (const o of freshCourses) {
      if (excluded.has(o.id)) continue
      const raw = assignments[o.id] ?? defaults[o.id] ?? ''
      fresh.push(...expandInstances(o, byTemplateId.get(raw) ?? null, surveysPlus, templates))
    }
    setUnitSelections(prev => reconcileUnitsOnRefresh(prev, fresh, autoUpdateOn))
    setFetchedStaffing(prismStaffing)
  }

  // ── Save as draft / resume (sessionStorage) ───────────────────────────────
  const [pendingDraft, setPendingDraft] = useState<DraftPayload | null>(null)
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null)
  const [driftNotices, setDriftNotices] = useState<DriftNotice[]>([])
  useEffect(() => { setPendingDraft(readDraft()) }, [])

  const handleSaveDraft = () => {
    const effective: Record<string, string> = {}
    const snapshots: Record<string, DraftTemplateSnapshot> = {}
    for (const r of rows) {
      effective[r.offering.id] = effectiveTemplateId(r.offering)
      if (!excluded.has(r.offering.id) && r.template) {
        snapshots[r.offering.id] = {
          templateId: r.template.id,
          templateName: r.template.name,
          criteria: templateCriteria(r.template),
        }
      }
    }
    const payload: DraftPayload = {
      savedAt: new Date().toISOString(),
      assignments: effective,
      unitSelections,
      autoUpdateOn,
      excluded: [...excluded],
      templateSnapshots: snapshots,
      archivedTemplateIds: [...demoArchivedIds],
    }
    writeDraft(payload)
    setDraftSavedAt(fmtSavedAt(payload.savedAt))
  }

  const handleResume = () => {
    const d = pendingDraft
    if (!d) return
    const archived = new Set(d.archivedTemplateIds)
    setDemoArchivedIds(archived)
    const nextAssignments = { ...d.assignments }
    const notices: DriftNotice[] = []
    const codeOf = (offeringId: string) => {
      const o = baseCourses.find(x => x.id === offeringId)
      return o ? splitLabel(o).code : offeringId
    }
    for (const [offeringId, snap] of Object.entries(d.templateSnapshots)) {
      const t = templates.find(x => x.id === snap.templateId)
      if (!t || t.status !== 'active' || t.archived || archived.has(t.id)) {
        nextAssignments[offeringId] = ''
        notices.push({
          kind: 'unpublished',
          courseCode: codeOf(offeringId),
          templateName: snap.templateName,
          addedRoleLabels: [],
          removedRoleLabels: [],
        })
      } else {
        const current: string[] = templateCriteria(t)
        const snapSet = new Set(snap.criteria)
        const curSet = new Set(current)
        const added = current.filter(c => !snapSet.has(c))
        const removed = snap.criteria.filter(c => !curSet.has(c))
        if (added.length > 0 || removed.length > 0) {
          notices.push({
            kind: 'updated',
            courseCode: codeOf(offeringId),
            templateName: snap.templateName,
            addedRoleLabels: added.map(criterionLabel),
            removedRoleLabels: removed.map(criterionLabel),
          })
        }
      }
    }
    setAssignments(nextAssignments)
    setUnitSelections(d.unitSelections)
    setAutoUpdateOn(d.autoUpdateOn)
    setExcluded(new Set(d.excluded))
    setDriftNotices(notices)
    setDraftSavedAt(fmtSavedAt(d.savedAt))
    setPendingDraft(null)
  }

  const handleStartFresh = () => {
    try { sessionStorage.removeItem(DRAFT_KEY) } catch { /* demo only */ }
    setPendingDraft(null)
  }

  const storedDraftExists = pendingDraft !== null || draftSavedAt !== null
  const simulateTemplateGainedRole = () => {
    const d = readDraft()
    if (!d) return
    for (const snap of Object.values(d.templateSnapshots)) {
      if (snap.criteria.length > 1) {
        snap.criteria = snap.criteria.slice(0, -1)
        break
      }
    }
    writeDraft(d)
    setPendingDraft(readDraft())
  }
  const simulateTemplateArchived = () => {
    const d = readDraft()
    if (!d) return
    const first = Object.values(d.templateSnapshots)[0]
    if (first && !d.archivedTemplateIds.includes(first.templateId)) {
      d.archivedTemplateIds.push(first.templateId)
    }
    writeDraft(d)
    setPendingDraft(readDraft())
  }

  // Preview Survey (ST-02: "opens ST-10's read-only student preview").
  const [previewTemplate, setPreviewTemplate] = useState<PceTemplate | null>(null)

  // ── In-step template creation (step-survey-instances subView pattern) ─────
  const [subView, setSubView] = useState<'assign' | 'create' | { buildId: string }>('assign')
  const [templateNotice, setTemplateNotice] = useState<{ kind: 'published' | 'draft'; name: string } | null>(null)
  const backToAssign = () => {
    if (typeof subView === 'object') {
      const t = templates.find(x => x.id === subView.buildId)
      if (t && t.status !== 'active') setTemplateNotice({ kind: 'draft', name: t.name || 'Untitled template' })
    }
    setSubView('assign')
  }

  if (subView !== 'assign') {
    return (
      <div className="flex flex-col gap-3">
        <div>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={backToAssign}>
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
              setTemplateNotice({ kind: 'published', name: t?.name || 'Template' })
              setSubView('assign')
            }}
          />
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 min-h-full">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <h2 className="text-lg font-semibold font-heading">Survey design</h2>
          <p className="text-sm text-muted-foreground">
            {term.name}. Confirm each course&apos;s template. Rows expand only when there&apos;s a conflict to resolve.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {draftSavedAt && (
            <span className="text-xs tabular-nums text-muted-foreground">Draft saved at {draftSavedAt}</span>
          )}
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => setResetOpen(true)}>
            Reset to defaults
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setTemplateNotice(null); setSubView('create') }}>
            New template
          </Button>
          <Button variant="outline" size="sm" onClick={handleSaveDraft}>
            Save as draft
          </Button>
        </div>
      </header>

      {templateNotice && (
        <LocalBanner
          variant={templateNotice.kind === 'published' ? 'success' : 'info'}
          dismissible
          onDismiss={() => setTemplateNotice(null)}
        >
          {templateNotice.kind === 'published'
            ? <>&ldquo;{templateNotice.name}&rdquo; is published. Assign it in the course list below.</>
            : <>&ldquo;{templateNotice.name}&rdquo; is saved as a draft. Publish it from Settings &rsaquo; Templates to make it assignable.</>}
        </LocalBanner>
      )}

      {pendingDraft && (
        <LocalBanner variant="info" dismissible onDismiss={() => setPendingDraft(null)}>
          <span className="flex items-center gap-3 flex-wrap">
            <span>Draft saved at {fmtSavedAt(pendingDraft.savedAt)}.</span>
            <Button variant="outline" size="xs" onClick={handleResume}>Resume</Button>
            <Button variant="ghost" size="xs" onClick={handleStartFresh}>Start fresh</Button>
          </span>
        </LocalBanner>
      )}

      {driftNotices.length > 0 && (
        <LocalBanner variant="info" dismissible onDismiss={() => setDriftNotices([])}>
          <span className="flex flex-col gap-1">
            {driftNotices.map(n => (
              <span key={`${n.courseCode}-${n.kind}-${n.templateName}`}>
                {n.kind === 'updated' ? (
                  <>
                    &ldquo;{n.templateName}&rdquo; changed since this draft was saved.
                    {n.addedRoleLabels.length > 0 && (
                      <> For {n.courseCode} it now also covers {n.addedRoleLabels.join(', ')}.</>
                    )}
                    {n.removedRoleLabels.length > 0 && (
                      <> It no longer covers {n.removedRoleLabels.join(', ')}.</>
                    )}
                    {' '}Coverage below reflects the current template.
                  </>
                ) : (
                  <>
                    &ldquo;{n.templateName}&rdquo; is no longer published. Assign a published template to {n.courseCode} to continue.
                  </>
                )}
              </span>
            ))}
          </span>
        </LocalBanner>
      )}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <ToggleGroup
            type="single"
            value={filter}
            onValueChange={v => v && setFilter(v as FilterKey)}
            variant="outline"
            size="sm"
            aria-label="Filter courses by status"
          >
            <ToggleGroupItem value="all" aria-label={`Show all ${rows.length} courses`}>
              All <span className="tabular-nums text-muted-foreground">({rows.length})</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="attention" aria-label={`Show ${attentionCount} courses needing attention`}>
              Needs attention <span className="tabular-nums text-muted-foreground">({attentionCount})</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="blocked" aria-label={`Show ${blockedCount} blocked courses`}>
              Blocked <span className="tabular-nums text-muted-foreground">({blockedCount})</span>
            </ToggleGroupItem>
          </ToggleGroup>
          {filter !== 'all' && (
            <p className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
              Showing {visibleCount} of {rows.length} courses
            </p>
          )}
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <label htmlFor="vg-auto-update" className="flex items-center gap-2.5 cursor-pointer">
            <ToggleSwitch
              id="vg-auto-update"
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
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Refresh
          </Button>
        </div>
      </div>

      {/* ── ONE flat table — course-code order, never reordered by status ── */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div
          className="grid items-center gap-3 ps-3 pe-3 py-2 bg-muted/50 border-b border-border text-xs font-medium text-muted-foreground"
          style={{ gridTemplateColumns: TABLE_GRID }}
        >
          <span />
          <span />
          <span>Course</span>
          <span>Type</span>
          <span>Template</span>
          <span className="inline-flex items-center gap-1.5">
            Evaluatees
            <Tip label="Click a person or course material to include or exclude them from this push. + adds, × removes." side="top">
              <i className="fa-light fa-circle-info" aria-hidden="true" style={{ fontSize: 11 }} />
            </Tip>
          </span>
          <span>Status</span>
          <span />
        </div>

        {visibleCount === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <i className="fa-light fa-circle-check text-muted-foreground" aria-hidden="true" style={{ fontSize: 28 }} />
            <p className="text-sm font-medium">No courses match this filter</p>
            <p className="text-xs text-muted-foreground">Switch to All to see every course in this push.</p>
          </div>
        ) : (
          rows.filter(matches).map(row => (
            <CourseRow
              key={row.offering.id}
              row={row}
              gate={gates.get(row.offering.id)!}
              excluded={excluded.has(row.offering.id)}
              onToggleCourse={() => toggleCourse(row.offering.id)}
              isExpanded={expanded.has(row.offering.id)}
              onToggleExpanded={() => toggleExpanded(row.offering.id)}
              publishedTemplates={publishedTemplates}
              defaultTemplateId={defaults[row.offering.id]}
              onTemplateChange={tid => changeTemplate(row.offering.id, tid)}
              unitSelected={unitSelected}
              onUnitToggle={toggleUnit}
              onPreview={setPreviewTemplate}
            />
          ))
        )}
      </div>

      <SurveyPreviewDialog
        template={previewTemplate}
        open={previewTemplate !== null}
        onOpenChange={open => { if (!open) setPreviewTemplate(null) }}
      />

      {/* ── Demo controls — scaffolding only, visually fenced off from the
             product UI (dashed border + explicit label). ── */}
      <section
        aria-label="Demo controls"
        className="rounded-lg border border-dashed border-border p-4 flex flex-col gap-4"
        style={{ background: 'var(--muted)' }}
      >
        <p className="text-xs font-semibold text-muted-foreground">
          Demo controls (scaffolding, not part of the product UI)
        </p>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium">Simulate PRISM changes (demo only)</p>
          <p className="text-xs text-muted-foreground">
            These edit {demoCourseCode}&apos;s staffing in a simulated PRISM. The table does not change until you click Refresh above.
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="xs" onClick={() => setPrismStaffing(s => ({ ...(s ?? {}), collaboratorIds: ['f2'] }))}>
              Assign an instructor
            </Button>
            <Button variant="outline" size="xs" onClick={() => setPrismStaffing(s => ({ ...(s ?? {}), collaboratorIds: ['f2'], coInstructorIds: ['f5'] }))}>
              Add a co-instructor
            </Button>
            <Button variant="outline" size="xs" onClick={() => setPrismStaffing({ primaryFacultyId: '', collaboratorIds: [], coInstructorIds: [], labTaIds: [], placementFacultyIds: [] })}>
              Remove all faculty
            </Button>
            <Button variant="ghost" size="xs" onClick={() => setPrismStaffing(null)}>
              Reset PRISM data
            </Button>
            {prismPending && (
              <span className="text-xs font-medium" style={{ color: 'var(--chip-4)' }}>
                PRISM now differs from the last fetch. Click Refresh to sync.
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium">Simulate template changes since the draft was saved (demo only)</p>
          <p className="text-xs text-muted-foreground">
            {storedDraftExists
              ? 'These edit the stored draft. Simulate a change, then resume the draft from the banner to see the notice.'
              : 'Save a draft first, then simulate a change and resume it.'}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="xs" disabled={!storedDraftExists} onClick={simulateTemplateGainedRole}>
              Template gained a new role since the draft was saved
            </Button>
            <Button variant="outline" size="xs" disabled={!storedDraftExists} onClick={simulateTemplateArchived}>
              Template archived since the draft was saved
            </Button>
          </div>
        </div>
      </section>

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

      {/* ── Footer — the PER-COURSE hard-block gate lives on Continue ── */}
      <div className="sticky bottom-0 mt-auto bg-background border-t border-border py-4 flex items-center justify-between gap-4">
        <span className="text-xs tabular-nums text-muted-foreground">
          {toCreate} evaluation{toCreate !== 1 ? 's' : ''} across {includedRows.length} course{includedRows.length !== 1 ? 's' : ''}
          {gapTotal > 0 && (
            <> · <span style={{ color: 'var(--chip-4)' }}>{gapTotal} role{gapTotal !== 1 ? 's' : ''} unassigned</span></>
          )}
          {blockedInPush.length > 0 && (
            <>
              {' · '}
              <span className="font-medium" style={{ color: 'var(--chip-destructive)' }}>
                {blockedInPush.length} course{blockedInPush.length !== 1 ? 's' : ''} blocked
              </span>
            </>
          )}
          {excluded.size > 0 && <> · {excluded.size} excluded</>}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            <i className="fa-light fa-arrow-left text-xs" aria-hidden="true" />
            Back
          </Button>
          {canContinue ? (
            <Button variant="default" size="sm">
              Continue
              <i className="fa-light fa-arrow-right text-xs" aria-hidden="true" />
            </Button>
          ) : (
            <Tip label={continueDisabledReason} side="top">
              <span className="inline-flex rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1" tabIndex={0}>
                <Button variant="default" size="sm" disabled>
                  Continue
                  <i className="fa-light fa-arrow-right text-xs" aria-hidden="true" />
                </Button>
              </span>
            </Tip>
          )}
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Status — the load-bearing element of this variant, ALWAYS a real DS
// ListHubStatusBadge, and ALWAYS the SAME component family across every
// severity tier — Ready, gap, and blocked differ only by tint, so a hard
// block is unmistakably the loudest, not a differently-shaped element.
//
// Blocked uses LIST_HUB_STATUS_TINT_DANGER (app/globals.css
// --qb-status-blocked-*), NOT a solid `--chip-destructive` fill with white
// text — that was tried and is a real theme bug, not just a style choice:
// --chip-destructive is an "ink" token that INTENTIONALLY flips lightness
// per theme so it stays readable as text against the page background (dark
// red in light theme, bright red in dark theme). Used as a solid badge fill
// instead, it renders deep maroon in light mode but washes out to a pale
// coral in dark mode — confirmed live by toggling `.dark` on <html>. The
// qb-status-* family avoids this entirely: a fixed light bg + dark
// saturated fg, the SAME two colors in every theme, reads correctly on both
// a light and a dark page via luminance contrast with the surface — no
// per-theme calibration needed, which is why Ready/gap already used it.
// No person names ever appear here — names live in the Evaluatees column.
// ═════════════════════════════════════════════════════════════════════════════

const BLOCK_BADGE_COPY: Record<BlockReason, { label: string; icon: string }> = {
  'overlap': { label: 'Blocked', icon: 'fa-lock' },
  'no-template': { label: 'No template', icon: 'fa-circle-xmark' },
  'unstaffed': { label: 'No one to evaluate', icon: 'fa-user-slash' },
  'none-selected': { label: 'Nothing selected', icon: 'fa-circle-xmark' },
  'no-units': { label: 'Nothing to evaluate', icon: 'fa-circle-xmark' },
}

/** Names the role for the common single-role case ("Instructor unassigned")
 *  — specific enough to act on without opening anything else. Falls back to
 *  a count for 2+ roles ("2 roles unassigned") so the badge never has to
 *  cram a long joined list into a fixed-width column and clip. */
function roleSummaryLabel(roles: string[], suffix: string): string {
  if (roles.length === 1) return `${roles[0]} ${suffix}`
  return `${roles.length} roles ${suffix}`
}

function RowStatus({ row, gate, excluded }: { row: Row; gate: CourseGate; excluded: boolean }) {
  if (excluded) {
    return <ListHubStatusBadge label="Not included" tint={LIST_HUB_STATUS_TINT_NEUTRAL} icon="fa-circle-minus" />
  }
  const blockBadges = gate.reasons.map(reason => {
    if (reason === 'overlap') {
      const roles = [...new Set(row.dups.map(i => i.roleLabel || 'Course material'))]
      return (
        <ListHubStatusBadge
          key={reason}
          label={roles.length > 0 ? roleSummaryLabel(roles, 'blocked') : 'Blocked'}
          tint={LIST_HUB_STATUS_TINT_DANGER}
          icon="fa-lock"
        />
      )
    }
    const copy = BLOCK_BADGE_COPY[reason]
    return <ListHubStatusBadge key={reason} label={copy.label} tint={LIST_HUB_STATUS_TINT_DANGER} icon={copy.icon} />
  })
  const showGapBadge = row.gaps.length > 0 && !gate.reasons.includes('unstaffed')
  if (blockBadges.length === 0 && !showGapBadge) {
    return <ListHubStatusBadge label="Ready" tint={LIST_HUB_STATUS_TINT_SUCCESS} icon="fa-circle-check" />
  }
  const gapRoles = [...new Set(row.gaps.map(i => i.roleLabel))]
  return (
    <span className="inline-flex items-center gap-1.5 min-w-0 flex-wrap">
      {blockBadges}
      {showGapBadge && (
        <ListHubStatusBadge
          label={roleSummaryLabel(gapRoles, 'unassigned')}
          tint={LIST_HUB_STATUS_TINT_WARNING}
          icon="fa-user-slash"
        />
      )}
    </span>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Evaluatees — resting state is a read-only DS AvatarGroup (who's currently
// included, at a glance, no click needed). Opening it swaps to a proper
// Popover + Command picker to actually change the selection, then swaps
// back to the avatar summary on close.
//
// Three prior attempts put the toggle directly ON the tiny avatar (a
// checkmark badge, then an ×/+ badge, then a DS Checkbox overlay) and each
// was reported unreliable/unclear in live testing — a 24px avatar is simply
// too small a target to carry both identity AND a selection control legibly.
// This composition instead follows the SAME proven Popover+Command pattern
// already used for Cohort/What-to-evaluate in TokenSelect
// (courses-evaluatees/scope-controls.tsx) — a full-size list with names,
// roles, and real click targets — and avoids that file's own documented
// traps: a check GLYPH inside CommandItem, never a nested DS Checkbox
// (Checkbox renders a <button>, which trips nested-interactive inside
// CommandItem's role="option"); state rides in the accessible name, never
// in aria-selected (cmdk owns that for its own keyboard-highlight); and
// PopoverContent gets an explicit aria-label (it's role="dialog").
// ═════════════════════════════════════════════════════════════════════════════

const FACULTY_AVATAR_CAP = 3

function evaluateeLabel(i: SurveyInstance): string {
  const name = i.scope === 'course' ? 'Course material' : (i.personName ?? '')
  return i.roleLabel && i.scope !== 'course' ? `${name} · ${i.roleLabel}` : name
}

function EvaluateeAvatar({ i, className }: { i: SurveyInstance; className?: string }) {
  return i.scope === 'course' ? (
    <span className={cn('rounded-full flex items-center justify-center border border-border bg-background shrink-0', className)}>
      <i className="fa-light fa-book-open text-[10px] text-muted-foreground" aria-hidden="true" />
    </span>
  ) : (
    <PersonAvatar name={i.personName!} className={className} decorative />
  )
}

function EvaluateesPickerCell({ row, excluded, unitSelected, onUnitToggle }: {
  row: Row
  excluded: boolean
  unitSelected: (i: SurveyInstance) => boolean
  onUnitToggle: (key: string) => void
}) {
  const [open, setOpen] = useState(false)
  const { fresh, gaps, dups } = row
  if (fresh.length === 0 && gaps.length === 0 && dups.length === 0) {
    return <span className="text-xs text-muted-foreground">&ndash;</span>
  }

  const includedFresh = fresh.filter(unitSelected)
  const visibleIncluded = includedFresh.slice(0, FACULTY_AVATAR_CAP)
  const overflowIncluded = includedFresh.length - visibleIncluded.length
  const gapRoles = [...new Set(gaps.map(i => i.roleLabel))]
  const dupRoles = [...new Set(dups.map(i => i.roleLabel || 'Course material'))]
  const noIndicator = visibleIncluded.length === 0 && gaps.length === 0 && dups.length === 0
  const summaryParts: string[] = []
  if (includedFresh.length > 0) summaryParts.push(includedFresh.map(evaluateeLabel).join(', '))
  if (gapRoles.length > 0) summaryParts.push(`${gapRoles.join(', ')} needs a person`)
  if (dupRoles.length > 0) summaryParts.push(`${dupRoles.join(', ')} already covered`)
  const summary = summaryParts.length > 0 ? summaryParts.join('. ') : 'Nothing selected'

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={excluded}
          className="group inline-flex items-center gap-1 rounded-md py-0.5 pe-1 -ms-1 ps-1 outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={`Evaluatees for ${row.code}: ${summary}. Click to change.`}
        >
          {noIndicator ? (
            <span className="size-6 rounded-full flex items-center justify-center border border-dashed border-border text-muted-foreground">
              <i className="fa-light fa-user-plus text-[10px]" aria-hidden="true" />
            </span>
          ) : (
            <AvatarGroup className="flex items-center" aria-hidden="true">
              {visibleIncluded.map(i => <EvaluateeAvatar key={i.key} i={i} className="size-6" />)}
              {overflowIncluded > 0 && <AvatarGroupCount>+{overflowIncluded}</AvatarGroupCount>}
              {/* Restores the "something's missing here" glance-signal the
                  old per-avatar dashed "+" gave — lost when Evaluatees
                  became a read-only summary. One glyph for ALL gap roles to
                  stay compact; exact roles are named in the Status badge and
                  inside the picker. */}
              {gaps.length > 0 && (
                <span
                  className="size-6 rounded-full flex items-center justify-center border border-dashed shrink-0"
                  style={{ borderColor: 'var(--chip-4)', color: 'var(--chip-4)' }}
                >
                  <i className="fa-light fa-user-plus text-[10px]" aria-hidden="true" />
                </span>
              )}
              {dups.length > 0 && (
                <span
                  className="size-6 rounded-full flex items-center justify-center border shrink-0"
                  style={{ borderColor: 'var(--qb-status-blocked-border)', color: 'var(--qb-status-blocked-fg)' }}
                >
                  <i className="fa-solid fa-lock text-[10px]" aria-hidden="true" />
                </span>
              )}
            </AvatarGroup>
          )}
          <i
            className="fa-light fa-chevron-down text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 group-data-[state=open]:opacity-100"
            aria-hidden="true"
          />
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="p-0 w-auto min-w-64 max-w-80" aria-label={`Evaluatees for ${row.code}`}>
        <Command>
          <CommandList>
            <CommandEmpty>No evaluatees for this course.</CommandEmpty>

            {fresh.length > 0 && (
              <CommandGroup heading="Include in this push">
                {fresh.map(i => {
                  const isIn = unitSelected(i)
                  return (
                    <CommandItem key={i.key} value={evaluateeLabel(i)} onSelect={() => onUnitToggle(i.key)}>
                      <i className={cn('fa-solid fa-check text-xs', !isIn && 'opacity-0')} aria-hidden="true" />
                      <EvaluateeAvatar i={i} className="size-5" />
                      <span className="truncate">{i.scope === 'course' ? 'Course material' : i.personName}</span>
                      {i.roleLabel && i.scope !== 'course' && (
                        <span className="text-muted-foreground text-xs shrink-0">· {i.roleLabel}</span>
                      )}
                      {isIn && <span className="sr-only">, included</span>}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}

            {gaps.length > 0 && (
              <CommandGroup heading="Needs a person">
                {gaps.map(i => (
                  <CommandItem
                    key={i.key}
                    value={`no ${i.roleLabel} assigned`}
                    onSelect={() => { if (i.prismHref) window.open(i.prismHref, '_blank', 'noopener,noreferrer') }}
                  >
                    <i className="fa-light fa-user-slash text-xs shrink-0" style={{ color: 'var(--chip-4)' }} aria-hidden="true" />
                    <span className="truncate">No {i.roleLabel} assigned</span>
                    <span className="ms-auto text-xs shrink-0" style={{ color: 'var(--insight-severity-info-fg)' }}>
                      Add in Prism
                      <span className="sr-only"> (opens in new tab)</span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {dups.length > 0 && (
              <CommandGroup heading="Already covered">
                {dups.map(i => (
                  <CommandItem key={i.key} value={evaluateeLabel(i)} disabled>
                    <i className="fa-solid fa-lock text-xs shrink-0" style={{ color: 'var(--qb-status-blocked-fg)' }} aria-hidden="true" />
                    <EvaluateeAvatar i={i} className="size-5" />
                    <span className="truncate">{i.scope === 'course' ? 'Course material' : i.personName}</span>
                    {i.roleLabel && i.scope !== 'course' && (
                      <span className="text-muted-foreground text-xs shrink-0">· {i.roleLabel}</span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// ── Row + optional inline disclosure ─────────────────────────────────────────
// The chevron — and everything it reveals — exists ONLY when there is a
// role-overlap conflict to review. A Ready or gap-only row has no chevron
// at all: the Faculty column above already answers "who, and what to do."

function CourseRow({
  row, gate, excluded, onToggleCourse, isExpanded, onToggleExpanded,
  publishedTemplates, defaultTemplateId,
  onTemplateChange, unitSelected, onUnitToggle, onPreview,
}: {
  row: Row
  gate: CourseGate
  excluded: boolean
  onToggleCourse: () => void
  isExpanded: boolean
  onToggleExpanded: () => void
  publishedTemplates: PceTemplate[]
  defaultTemplateId?: string
  onTemplateChange: (templateId: string) => void
  unitSelected: (i: SurveyInstance) => boolean
  onUnitToggle: (key: string) => void
  onPreview: (t: PceTemplate) => void
}) {
  const o = row.offering
  const mode = deliveryModeOf(o)
  const criteria = row.template ? templateCriteria(row.template) : []
  // ST-02: the picker lists ONLY templates that fit this course's type.
  const typeMatched = publishedTemplates.filter(t => templateFitsType(t, o))
  // Only a role-overlap conflict needs a disclosure now — a faculty gap is
  // fully handled inline by the Faculty column's own dashed add-avatar.
  const hasDisclosure = !excluded && row.dups.length > 0

  const previewButton = (
    <Button
      variant="ghost"
      size="sm"
      className="shrink-0"
      disabled={!row.template}
      onClick={() => { if (row.template) onPreview(row.template) }}
    >
      Preview
      <span className="sr-only">
        {row.template ? ` the survey for ${row.code}` : '. Assign a template to preview.'}
      </span>
    </Button>
  )

  return (
    // Exclusion is communicated by the unchecked checkbox + the "Not
    // included" status text (both already muted tokens) — never by
    // opacity-* on the row container, which would drop passing-contrast
    // text (e.g. the course name) below 4.5:1 (design-anti-patterns.md).
    <div className="border-b border-border last:border-b-0">
      <div
        className="grid items-center gap-3 ps-3 pe-3 py-2"
        style={{ gridTemplateColumns: TABLE_GRID, minHeight: 42 }}
      >
        <span className="flex items-center">
          <Checkbox
            checked={!excluded}
            onCheckedChange={onToggleCourse}
            aria-label={`Include ${row.code} in this push`}
          />
        </span>

        {/* Chevron only exists when there's something to disclose — a Ready
            row renders an empty cell, not a dead-end toggle. */}
        {hasDisclosure ? (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleExpanded}
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? 'Hide' : 'Show'} details for ${row.code}`}
          >
            <i
              className={cn('fa-light fa-chevron-down text-xs transition-transform', isExpanded && 'rotate-180')}
              aria-hidden="true"
            />
          </Button>
        ) : (
          <span aria-hidden="true" />
        )}

        <span className="flex items-baseline gap-2 min-w-0">
          <span className="font-mono text-xs tabular-nums text-muted-foreground shrink-0">{row.code}</span>
          {row.name && <span className="truncate text-sm">{row.name}</span>}
        </span>

        <span><TypePill deliveryMode={mode} label={COURSE_TYPE_FULL_LABEL[mode]} /></span>

        <Select value={row.template?.id ?? ''} onValueChange={onTemplateChange}>
          <SelectTrigger size="sm" className="w-full [&>span]:truncate" aria-label={`Template for ${row.code}`}>
            <SelectValue placeholder="Assign a template" />
          </SelectTrigger>
          <SelectContent>
            {/* ST-02: zero published templates for this course's type — exact copy. */}
            {typeMatched.length === 0 && (
              <div className="px-2 py-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                No templates for this course type
              </div>
            )}
            {typeMatched.map(t => (
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

        <span className="min-w-0">
          <EvaluateesPickerCell
            row={row}
            excluded={excluded}
            unitSelected={unitSelected}
            onUnitToggle={onUnitToggle}
          />
        </span>

        <span className="min-w-0"><RowStatus row={row} gate={gate} excluded={excluded} /></span>

        <span className="flex justify-end">
          {row.template ? (
            previewButton
          ) : (
            <Tip label="Assign a template to preview" side="left">
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

      {/* Disclosure — plain sentences, not a data grid, and only for a
          role-overlap conflict. A faculty gap is already visible and
          fixable from the Faculty column's dashed add-avatar, so it no
          longer needs a row of its own here. */}
      {hasDisclosure && isExpanded && (
        <div className="mx-4 mb-3 rounded-md border border-border bg-background flex flex-col divide-y divide-border">
          {/* Role-overlap conflicts — grouped by the existing survey that
              already covers them, so "Dr. Chen and Dr. Gomez" reads as one
              fact instead of two identical rows that only differ by name.
              Names + the exact survey status + open date answer "covered by
              what, exactly" in a sentence, replacing the bare status badge a
              "Covered by" column would otherwise show alone. */}
          {buildDupGroups(row.dups).map(g => (
            <div key={g.key} className="flex flex-col gap-1.5 px-3 py-2.5" style={{ background: 'var(--pce-impact-bg)' }}>
              <p className="text-sm font-medium inline-flex items-center gap-1.5" style={{ color: 'var(--chip-destructive)' }}>
                <i className="fa-solid fa-lock text-xs" aria-hidden="true" />
                {g.roleLabel} already covered
              </p>
              {/* Fact on its own line, "View survey" as a real button on its
                  own row — never inline with the sentence. Run together
                  ("...opened Jul 25. View survey Cancel or archive...") read
                  as one garbled phrase with no separation between the link
                  and the next sentence. */}
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground min-w-0">
                  {g.names.join(' and ')} {g.names.length > 1 ? 'are' : 'is'} already being evaluated by a{' '}
                  <StoryStatusBadgeOS status={g.status} size="sm" />
                  {' '}survey{g.openedLabel && <> opened {g.openedLabel}</>}.
                </p>
                <Button variant="outline" size="xs" asChild className="shrink-0">
                  <Link href={`/surveys/${g.existingId}`}>
                    View survey
                    <span className="sr-only"> covering the {g.roleLabel} role of {row.code}</span>
                  </Link>
                </Button>
              </div>
            </div>
          ))}
          {/* The ONE place this guidance appears — it was previously said
              twice (once per fact card above, once here), which read as
              padding, not clarity. */}
          <div className="flex items-center justify-between gap-3 px-3 py-2">
            <span className="text-xs text-muted-foreground">
              Cancel or archive the existing survey to push this course again, or remove it from this push.
            </span>
            <Button variant="outline" size="xs" className="shrink-0" onClick={onToggleCourse}>
              Remove course from push
            </Button>
          </div>

          {row.template && (
            <p className="px-3 py-2 text-xs text-muted-foreground tabular-nums">
              {row.template.name} · {row.template.questionCount} question{row.template.questionCount !== 1 ? 's' : ''} · evaluates{' '}
              {criteria
                .map(c => (c === 'students' ? 'Course material' : CRITERION_BY_TYPE[mode][c]?.label ?? c))
                .join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
