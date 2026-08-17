'use client'

// COMPARE VARIANT F — "Flat table + segmented filter" (throwaway; delete once
// a direction is picked, same lifecycle as /compare/push-survey-design).
//
// Thesis (Luma guest list "All / Going (3) / Invited (1)", Linear issue tabs,
// Substack's "All / Listen / Paid" filter row): never reorder, never regroup.
// ONE flat table in course-code order, always. A segmented filter above it —
// All (n) / Needs attention (n) / Blocked (n) — only hides or shows rows, so
// switching filters feels like a toggle, not a navigation. The Status column
// carries an always-visible, severity-distinct badge per state; it is the
// single source of severity truth (no competing row-border treatment).
//
// ST-02 completeness pass (Aug 3 audit follow-up) — this variant now runs the
// FULL ST-02 rule set so it can be used end to end, not just looked at:
//   · Per-course Continue gate (no global toCreate sum): each included course
//     must have a published template, no role-overlap block, and at least one
//     selected creatable unit. Distinct badge per failure state.
//   · Type-filtered template picker + exactly-one-match auto-assign. Tie-break
//     for 2+ type matches: the isDefaultForType flag wins, else the FIRST
//     published type match (production pickTemplateForType parity,
//     implementation-plan decision #2 — documented choice, since the fixture
//     set carries no isDefaultForType flags and leaving every course
//     unassigned would make the page unusable for an end-to-end walk).
//     A template matches a course's type when its courseType equals the
//     course's, or is 'any'/unset (generic templates fit every type).
//   · Template change and course re-inclusion both start from FRESH state —
//     no prior assignment or unit selection is restored.
//   · Auto Update flag + manual Refresh (reconcileUnitsOnRefresh) with a
//     two-copy PRISM model: demo mutations land in a "PRISM" overlay that the
//     table does NOT see until Refresh, so the flag's effect is observable.
//   · Save as draft / resume via sessionStorage, with templateCriteria()
//     snapshots and drift/archived notices on resume.
//   · Embedded "+ Create new template" flow (CreateBlankTemplate +
//     TemplateEditor, the step-survey-instances subView pattern) and
//     "Reset to defaults" with an itemized AlertDialog confirmation.
//
// Runs the REAL pt5 machinery — MOCK_COURSE_OFFERINGS → default template →
// expandInstances/roleOverlapConflicts — plus ONE synthesized in-memory Live
// survey on co13 (DPT-510) so a genuine ST-02 hard block is visible without
// touching shared fixture data.

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  Badge, Button, Checkbox, LocalBanner,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Tip, ToggleGroup, ToggleGroupItem, ToggleSwitch,
} from '@exxatdesignux/ui'
import { cn } from '@/lib/utils'
import { PersonAvatar } from '@/components/pce/person-avatar'
import { StoryStatusBadgeOS } from '@/components/pce/pce-badges'
import { usePce } from '@/components/pce/pce-state'
import { CreateBlankTemplate } from '@/components/pce/create-blank-template'
import { TemplateEditor } from '@/components/pce/template-editor'
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
  type SurveyInstance, type UnitSelectionMap,
} from '@/lib/pce-push-validation'

// ── Demo-only conflict seed ──────────────────────────────────────────────────
// DPT-510 (co13) only carries Scheduled fixtures (pf0/pf1/pf2), which do NOT
// block. This LOCAL Live instructor-scope survey makes its Instructor coverage
// a hard block without touching pce-mock-data.ts.
const CONFLICT_DEMO_SURVEY: PceSurvey = {
  id: 'demo-live-co13-flat',
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
const DRAFT_KEY = 'pce-compare-vf-step2-draft'

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

const roleName = (i: SurveyInstance) => (i.scope === 'course' ? 'Course material' : i.roleLabel)

const criterionLabel = (c: string) =>
  (CRITERION_TOGGLE_LABEL as Record<string, string>)[c] ?? c

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

const TABLE_GRID = '24px 28px minmax(0,1fr) 100px 190px 180px 76px'
/** Chips show at most this many units before the "+N more" expander. */
const CHIP_CAP = 3

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

export default function VariantFFlatFiltered() {
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
  // prismStaffing = what is "in PRISM" right now (demo buttons write here);
  // fetchedStaffing = what the wizard last fetched (the table reads this).
  // Refresh copies prism → fetched and reconciles the selection map, so the
  // Auto Update flag has an observable effect instead of a reactive shortcut.
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
  // 0 type matches → unassigned ("No templates for this course type");
  // 1 → auto-assign; 2+ → isDefaultForType wins, else first type match
  // (documented tie-break, see file header).
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

  // '' = explicitly unassigned (suppresses the type-default fallback — the
  // archived-template resume path relies on this); absence = use the default.
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
  const [expandedChips, setExpandedChips] = useState<Set<string>>(new Set())
  const [autoUpdateOn, setAutoUpdateOn] = useState(false)

  // First-sight seeding: a brand-new unit on an INCLUDED course arrives
  // 'selected' when creatable, 'deselected' for gaps and duplicates. An
  // existing key is never overwritten — only the template-change reset,
  // course exclusion, or Refresh (reconcileUnitsOnRefresh) may change it.
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

  // ── Per-course gate (bug #1 fix — no global sum can mask a zero course) ───
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

  // ── Filter — a PREDICATE, never a regrouping. Rows only hide or show; the
  // table structure and course-code order never change. Excluded courses only
  // match "All" — a course out of the push needs no attention.
  const [filter, setFilter] = useState<FilterKey>('attention')
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

  // ── Handlers ──────────────────────────────────────────────────────────────

  // Bug #2 fix: excluding a course WIPES its assignment and unit selections,
  // so re-including starts from the type default and first-sight seeds — no
  // restored prior state (ST-02).
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
  const toggleChipExpand = (id: string) =>
    setExpandedChips(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  // ST-02: changing a course's template clears every unit-selection override
  // for that course entirely — the seeding effect re-populates the new
  // template's units with first-sight defaults.
  const changeTemplate = (offeringId: string, templateId: string) => {
    setAssignments(prev => ({ ...prev, [offeringId]: templateId }))
    setUnitSelections(prev => withoutOfferings(prev, new Set([offeringId])))
  }

  // Reset to defaults — every course back to its type default in one shot;
  // irreversible once confirmed (AlertDialog below itemizes the impact).
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

  // ST-02 manual refresh — the ONLY re-sync trigger. Re-derives the unit list
  // from current PRISM data (the demo overlay), reconciles the sticky map
  // under the Auto Update flag, then adopts the fresh data into the table.
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
        // Archived/unpublished since the draft was saved → the course resumes
        // with NO template assigned and blocks until one is chosen.
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

  // Demo: mutate the STORED draft so resuming it exercises the drift paths.
  const storedDraftExists = pendingDraft !== null || draftSavedAt !== null
  const simulateTemplateGainedRole = () => {
    const d = readDraft()
    if (!d) return
    for (const snap of Object.values(d.templateSnapshots)) {
      if (snap.criteria.length > 1) {
        // Removing a criterion from the SNAPSHOT makes the live template look
        // like it gained that role since the save.
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

  // ── In-step template creation (step-survey-instances subView pattern) ─────
  // The component stays mounted, so every assignment survives the round trip.
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
            {term.name} {term.academicYear} · confirm each course&apos;s template. The table always stays in course-code order; the filter only hides rows.
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

      {/* Draft resume offer — shown while a stored draft exists and has not
          been resumed or discarded this session. */}
      {pendingDraft && (
        <LocalBanner variant="info">
          <span className="flex items-center gap-3 flex-wrap">
            <span>Draft saved at {fmtSavedAt(pendingDraft.savedAt)}.</span>
            <Button variant="outline" size="xs" onClick={handleResume}>Resume</Button>
            <Button variant="ghost" size="xs" onClick={handleStartFresh}>Start fresh</Button>
          </span>
        </LocalBanner>
      )}

      {/* Resume findings: template drift (info) and archived templates (the
          affected rows also block via "No template" until reassigned). */}
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

      {/* ── Header controls: segmented filter + the ST-02 Auto Update flag and
             its manual Refresh, one coherent row (Luma/Linear + Render "Auto
             Sync" models). ── */}
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
          <label htmlFor="vf-auto-update" className="flex items-center gap-2.5 cursor-pointer">
            <ToggleSwitch
              id="vf-auto-update"
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
          <span>Course and evaluatees</span>
          <span>Type</span>
          <span>Template</span>
          <span>Status</span>
          <span />
        </div>

        {visibleCount === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground text-center">
            No courses match this filter.
          </p>
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
              chipsExpanded={expandedChips.has(row.offering.id)}
              onToggleChips={() => toggleChipExpand(row.offering.id)}
              publishedTemplates={publishedTemplates}
              defaultTemplateId={defaults[row.offering.id]}
              onTemplateChange={tid => changeTemplate(row.offering.id, tid)}
              unitSelected={unitSelected}
              onUnitToggle={toggleUnit}
            />
          ))
        )}
      </div>

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

      {/* Reset to defaults — irreversible once confirmed, so the dialog
          itemizes what will change (Resend delete-team model). */}
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
          <Button variant="default" size="sm" disabled={!canContinue}>
            Continue
            <i className="fa-light fa-arrow-right text-xs" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Status badge — the load-bearing element of this variant. ALWAYS rendered,
// ALWAYS severity-distinct, and a row with two problems shows both. Severity
// contract (relabeled for the per-course gate states):
//   destructive ink = this row BLOCKS Continue while included
//     lock + "Blocked"            → role coverage overlaps an existing survey
//     dot  + "No template"        → nothing assigned (or unpublished/archived)
//     user-slash + "No one to evaluate" → faculty-only template, zero staffed
//     dot  + "Nothing selected"   → every creatable unit deselected
//     dot  + "Nothing to evaluate"→ template covers no roles for this type
//   --chip-4 (amber) = attention, never blocks
//     dot  + "n unassigned"       → partial faculty gap
//   muted = fine
//     dot  + "Ready" · "Not included" (excluded rows)
// No person names ever appear here (the "Action needed, no names" rule).
// ═════════════════════════════════════════════════════════════════════════════

function StatusChip({ tone, icon, children }: {
  tone: 'destructive' | 'amber'
  icon?: 'lock' | 'user-slash'
  children: ReactNode
}) {
  const color = tone === 'destructive' ? 'var(--chip-destructive)' : 'var(--chip-4)'
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap" style={{ color }}>
      {icon ? (
        <i className={`fa-solid fa-${icon} text-[10px] shrink-0`} aria-hidden="true" />
      ) : (
        <span aria-hidden="true" className="size-1.5 rounded-full shrink-0" style={{ background: color }} />
      )}
      {children}
    </span>
  )
}

function RowStatus({ row, gate, excluded }: { row: Row; gate: CourseGate; excluded: boolean }) {
  if (excluded) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
        <span aria-hidden="true" className="size-1.5 rounded-full shrink-0" style={{ background: 'var(--border)' }} />
        Not included
      </span>
    )
  }
  const chips: ReactNode[] = []
  for (const reason of gate.reasons) {
    if (reason === 'overlap') chips.push(<StatusChip key="overlap" tone="destructive" icon="lock">Blocked</StatusChip>)
    if (reason === 'no-template') chips.push(<StatusChip key="no-template" tone="destructive">No template</StatusChip>)
    if (reason === 'unstaffed') chips.push(<StatusChip key="unstaffed" tone="destructive" icon="user-slash">No one to evaluate</StatusChip>)
    if (reason === 'none-selected') chips.push(<StatusChip key="none-selected" tone="destructive">Nothing selected</StatusChip>)
    if (reason === 'no-units') chips.push(<StatusChip key="no-units" tone="destructive">Nothing to evaluate</StatusChip>)
  }
  // Partial gaps never block; suppressed when the whole course is unstaffed
  // (the block chip already says it).
  if (row.gaps.length > 0 && !gate.reasons.includes('unstaffed')) {
    chips.push(
      <StatusChip key="gaps" tone="amber">{row.gaps.length} unassigned</StatusChip>,
    )
  }
  if (chips.length === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
        <span aria-hidden="true" className="size-1.5 rounded-full shrink-0" style={{ background: 'var(--chip-2)' }} />
        Ready
      </span>
    )
  }
  return <span className="inline-flex items-center gap-2.5 min-w-0 flex-wrap">{chips}</span>
}

// ── Evaluatee-unit checkbox chips (ST-02 UI notes; capped at CHIP_CAP with
//    "+N more"/"Show less"). Creatable units only — gap and conflict detail
//    stays in the disclosure, keeping the collapsed row calm. ─────────────────

function EvaluateeDisc({ item }: { item: SurveyInstance }) {
  return item.scope === 'course' ? (
    <span className="size-4 rounded-full flex items-center justify-center shrink-0 border border-border bg-background">
      <i className="fa-light fa-book-open text-[8px] text-muted-foreground" aria-hidden="true" />
    </span>
  ) : (
    <PersonAvatar name={item.personName!} className="size-4" />
  )
}

function UnitChip({ item, code, checked, disabled, onToggle }: {
  item: SurveyInstance
  code: string
  checked: boolean
  disabled: boolean
  onToggle: () => void
}) {
  const cbId = `vf-unit-${item.key.replace(/[^a-zA-Z0-9_-]/g, '-')}`
  const name = item.scope === 'course' ? 'Course material' : (item.personName ?? '')
  const ariaLabel = item.scope === 'course'
    ? `Evaluate course material in ${code}`
    : `Evaluate ${name}, ${item.roleLabel}, in ${code}`
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border py-0.5 ps-1.5 pe-2.5 min-w-0"
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
      <label htmlFor={cbId} className="inline-flex items-center gap-1.5 min-w-0 text-xs cursor-pointer">
        <EvaluateeDisc item={item} />
        <span className="truncate">{name}</span>
        {item.roleLabel && item.personName && (
          <span className="text-muted-foreground whitespace-nowrap">· {item.roleLabel}</span>
        )}
      </label>
    </span>
  )
}

// ── Row + optional inline disclosure ─────────────────────────────────────────

function CourseRow({
  row, gate, excluded, onToggleCourse, isExpanded, onToggleExpanded,
  chipsExpanded, onToggleChips, publishedTemplates, defaultTemplateId,
  onTemplateChange, unitSelected, onUnitToggle,
}: {
  row: Row
  gate: CourseGate
  excluded: boolean
  onToggleCourse: () => void
  isExpanded: boolean
  onToggleExpanded: () => void
  chipsExpanded: boolean
  onToggleChips: () => void
  publishedTemplates: PceTemplate[]
  defaultTemplateId?: string
  onTemplateChange: (templateId: string) => void
  unitSelected: (i: SurveyInstance) => boolean
  onUnitToggle: (key: string) => void
}) {
  const o = row.offering
  const mode = deliveryModeOf(o)
  const criteria = row.template ? templateCriteria(row.template) : []
  // ST-02: the picker lists ONLY templates that fit this course's type.
  const typeMatched = publishedTemplates.filter(t => templateFitsType(t, o))
  const chipUnits = chipsExpanded ? row.fresh : row.fresh.slice(0, CHIP_CAP)
  const hiddenChipCount = row.fresh.length - CHIP_CAP

  const previewButton = (
    <Button
      variant="ghost"
      size="sm"
      className="shrink-0"
      disabled={!row.template}
      onClick={() => { if (row.template && !isExpanded) onToggleExpanded() }}
    >
      Preview
      <span className="sr-only">
        {row.template ? ` the survey for ${row.code}` : '. Assign a template to preview.'}
      </span>
    </Button>
  )

  return (
    <div className={cn('border-b border-border last:border-b-0', excluded && 'opacity-50')}>
      <div
        className="grid items-center gap-3 ps-3 pe-3 py-2"
        style={{ gridTemplateColumns: TABLE_GRID, minHeight: 46 }}
      >
        <span className="flex items-center">
          <Checkbox
            checked={!excluded}
            onCheckedChange={onToggleCourse}
            aria-label={`Include ${row.code} in this push`}
          />
        </span>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleExpanded}
          aria-expanded={isExpanded}
          aria-label={`${isExpanded ? 'Hide' : 'Show'} role breakdown for ${row.code}`}
        >
          <i
            className={cn('fa-light fa-chevron-down text-xs transition-transform', isExpanded && 'rotate-180')}
            aria-hidden="true"
          />
        </Button>

        <span className="flex flex-col gap-1.5 min-w-0">
          <span className="flex items-baseline gap-2 min-w-0">
            <span className="font-mono text-xs tabular-nums text-muted-foreground shrink-0">{row.code}</span>
            {row.name && <span className="truncate text-sm">{row.name}</span>}
          </span>
          {/* Compact unit-chip summary on the collapsed row (ST-02 UI notes) —
              a second line in the same cell, so the flat structure and fixed
              order are untouched. */}
          {!excluded && row.template && row.fresh.length > 0 && (
            <span className="flex items-center gap-1.5 flex-wrap min-w-0">
              {chipUnits.map(i => (
                <UnitChip
                  key={i.key}
                  item={i}
                  code={row.code}
                  checked={unitSelected(i)}
                  disabled={excluded}
                  onToggle={() => onUnitToggle(i.key)}
                />
              ))}
              {hiddenChipCount > 0 && (
                <Button
                  variant="ghost"
                  size="xs"
                  className="text-muted-foreground hover:text-foreground"
                  aria-expanded={chipsExpanded}
                  onClick={onToggleChips}
                >
                  {chipsExpanded ? 'Show less' : `+${hiddenChipCount} more`}
                </Button>
              )}
            </span>
          )}
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

        <span className="min-w-0"><RowStatus row={row} gate={gate} excluded={excluded} /></span>

        <span className="flex justify-end">
          {/* ST-02 Preview gate — strictly on an assigned template. The preview
              itself stays the live disclosure panel (no separate title). */}
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
        </span>
      </div>

      {/* Optional disclosure — the row already says WHAT is wrong; this is the
          full per-role detail (same Evaluate?/Role/Assigned/Covered-by shape as
          the sibling variants) plus a template summary. */}
      {isExpanded && (
        <div className="mx-4 mb-3 rounded-md border border-border bg-background">
          <div className="grid grid-cols-[64px_1fr_1fr_1fr] gap-2 border-b border-border px-3 py-1.5 text-xs text-muted-foreground">
            <span>Evaluate?</span>
            <span>Role</span>
            <span>Assigned</span>
            <span>Covered by</span>
          </div>
          {row.instances.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              {row.template
                ? 'This template covers no roles for this course type.'
                : 'Assign a template to plan this course.'}
            </p>
          )}
          {row.instances.map(i => (
            <div
              key={i.key}
              className="grid grid-cols-[64px_1fr_1fr_1fr] items-center gap-2 border-b border-border px-3 py-1.5 text-sm"
            >
              <span>
                <Checkbox
                  size="sm"
                  checked={unitSelected(i)}
                  disabled={i.status !== 'new' || excluded}
                  onCheckedChange={() => onUnitToggle(i.key)}
                  aria-label={`Evaluate ${roleName(i)} for ${row.code}`}
                />
              </span>
              <span className="text-foreground">{roleName(i)}</span>
              <span className="flex min-w-0 items-center gap-1.5">
                {i.scope === 'course' ? (
                  <span className="text-muted-foreground">{o.enrolledCount} students</span>
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
