'use client'

// COMPARE VARIANT C — "Two-phase: confirm, then resolve" (throwaway; delete
// once a direction is picked, same lifecycle as /compare/push-survey-design).
//
// The bet: stop making one row layout carry every possible complexity. Split
// the step into two phases that never overlap:
//
//   Phase 1 — CONFIRM SCOPE. A genuinely simple table: checkbox · course ·
//   type · template name (plain text) · "Action needed". Courses that just
//   work stay here forever; flagged courses get a "Resolve" link and nothing
//   else. Analogy: Deel's "Assign workers" checkbox table.
//
//   Phase 2 — RESOLVE. Clicking Resolve (or any course name) opens a focused
//   FloatingSheetPanel for that ONE course: template reassignment (type-
//   filtered, "Default" badge), the evaluatee chips with per-unit checkboxes,
//   faculty-gap actions, the four-column role-overlap conflict table, and a
//   real survey preview. Close it and you are back in the simple table.
//
// ST-02 completeness pass (2026-08-03): this file now carries the FULL ST-02
// behavior set, not just the layout bet —
//   · PER-COURSE Continue gate: any included course with no template, an
//     unpublished/archived template, a role-overlap conflict, every unit
//     deselected, or a wholly-unstaffed faculty-only template blocks Continue
//     individually. Faculty gaps alone never block.
//   · Template auto-assign per the settled decision #2 (surveys/push/page.tsx
//     pickTemplateForType): exactly one published match for the course's type
//     auto-assigns; 2+ prefer isDefaultForType, else first match; 0 matches
//     leaves the course unassigned with the exact "No templates for this
//     course type" copy. A template with courseType 'any' (or none) matches
//     every course — the fixtures ship only 'any'-scoped CE templates, so a
//     strict-type read would leave every course unassigned on load.
//   · An ASSIGNED template that is since unpublished/archived resolves to
//     "no template assigned" and blocks — never a silent swap to another
//     template. Defaults are materialized into explicit assignments at seed/
//     reset/re-include time so this holds for auto-assigned courses too.
//   · Template change wipes that course's entire unit-selection slice;
//     exclusion wipes assignment + units, and re-including re-seeds from
//     TYPE DEFAULTS (never restored prior state — same "no restored prior
//     state" rule the production wizard settled for re-selection).
//   · Auto Update flag (defaults OFF) + manual Refresh as the ONLY Prism
//     re-sync trigger, reconciled through reconcileUnitsOnRefresh. Demo-only
//     PRISM mutations live in a clearly-bordered "Demo controls" panel and
//     take effect only after Refresh.
//   · Save as draft → sessionStorage (assignments, unit selections, Auto
//     Update flag, exclusions, per-course templateCriteria snapshots,
//     timestamp); resume prompt with Resume / Start fresh; drift detection on
//     resume (template edited since save → info banner; template archived
//     since save → unassigned + block).
//   · Preview gates strictly on an assigned template ("Assign a template to
//     preview" tooltip when disabled) and opens the real SurveyPreviewDialog
//     with a NEUTRAL title — ST-02 forbids showing the survey/template name
//     in the preview, so the dialog receives a renamed copy of the template.
//
// Runs the REAL pt5 machinery — MOCK_COURSE_OFFERINGS → default template →
// expandInstances/roleOverlapConflicts — plus ONE synthesized in-memory Live
// survey on co13 (DPT-510) so a genuine ST-02 hard block is visible without
// touching shared fixture data.

import { useEffect, useMemo, useState } from 'react'
import {
  Button, Checkbox, Badge, Tip, LocalBanner, ToggleSwitch,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
  FloatingSheetPanel, FloatingSheetPanelBody, FloatingSheetPanelContent,
  FloatingSheetPanelFooter, FloatingSheetPanelHeader,
} from '@exxatdesignux/ui'
import { PersonAvatar } from '@/components/pce/person-avatar'
import { StoryStatusBadgeOS } from '@/components/pce/pce-badges'
import { usePce } from '@/components/pce/pce-state'
import { CreateBlankTemplate } from '@/components/pce/create-blank-template'
import { TemplateEditor } from '@/components/pce/template-editor'
import { SurveyPreviewDialog } from '@/components/pce/distribute-wizard/survey-preview-dialog'
import { AddInPrismButton, TypePill } from '@/components/pce/courses-evaluatees/scope-controls'
import {
  MOCK_COURSE_OFFERINGS, MOCK_PROGRAM_TERMS, COURSE_TYPE_FULL_LABEL, deliveryModeOf,
  type CourseOffering, type PceSurvey, type PceTemplate,
} from '@/lib/pce-mock-data'
import {
  courseLabelOf, templateCriteria, CRITERION_TOGGLE_LABEL, type Criterion,
} from '@/lib/pce-course-readiness'
import {
  expandInstances, roleOverlapConflicts, storyStatusOf, templateStoryStatusOf,
  reconcileUnitsOnRefresh,
  type SurveyInstance, type UnitSelectionMap,
} from '@/lib/pce-push-validation'

// ── Constants ────────────────────────────────────────────────────────────────

/** Chips show at most this many units before the "+N more" expander (ST-02). */
const CHIP_CAP = 3
/** sessionStorage key for the Save-as-draft payload (compare-route scoped). */
const DRAFT_KEY = 'pce-compare-step2-variant-c-draft'
/** The one course the demo panel's PRISM simulations mutate (no faculty at
 *  all in the fixture — both roles start as gaps, so every simulation is
 *  visible). */
const DEMO_OFFERING_ID = 'co16'

// ── Small shared helpers (same vocabulary as the sibling compare routes) ─────

function splitLabel(o: CourseOffering): { code: string; name: string } {
  const label = courseLabelOf(o)
  if (!label.includes(' – ')) return { code: label, name: '' }
  const [code, ...rest] = label.split(' – ')
  return { code, name: rest.join(' – ') }
}

/** YYYY-MM-DD → "Dec 4" without the UTC-midnight day shift of new Date(iso). */
function fmtYmd(iso?: string): string | null {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const instanceLabel = (i: SurveyInstance) =>
  i.scope === 'course' ? 'Course material' : (i.personName ?? 'No one assigned')

function EvaluateeDisc({ item, size = 5 }: { item: SurveyInstance; size?: 4 | 5 }) {
  if (item.scope === 'course' || !item.personName) {
    return (
      <span className={`size-${size} rounded-full flex items-center justify-center shrink-0 border border-border bg-background`}>
        <i className={`fa-light fa-book-open ${size === 5 ? 'text-[9px]' : 'text-[8px]'} text-muted-foreground`} aria-hidden="true" />
      </span>
    )
  }
  return <PersonAvatar name={item.personName} className={`size-${size}`} />
}

/** One selectable evaluatee unit as a checkbox chip (ST-02 UI notes; same
 *  capped-chip model as the production step). */
function UnitChip({ item, code, checked, onToggle }: {
  item: SurveyInstance
  code: string
  checked: boolean
  onToggle: () => void
}) {
  const cbId = `vc-unit-${item.key.replace(/[^a-zA-Z0-9_-]/g, '-')}`
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
      <Checkbox id={cbId} size="sm" checked={checked} onCheckedChange={onToggle} aria-label={ariaLabel} />
      <label htmlFor={cbId} className="inline-flex items-center gap-1.5 min-w-0 text-xs cursor-pointer">
        <EvaluateeDisc item={item} size={4} />
        <span className="truncate">{name}</span>
        {item.roleLabel && item.personName && (
          <span className="text-muted-foreground whitespace-nowrap">· {item.roleLabel}</span>
        )}
      </label>
    </span>
  )
}

/** A course's unit chips, capped at CHIP_CAP with "+N more"/"Show less". */
function UnitChipsRow({ items, code, isSelected, expanded, onToggleExpanded, onToggleUnit }: {
  items: SurveyInstance[]
  code: string
  isSelected: (key: string) => boolean
  expanded: boolean
  onToggleExpanded: () => void
  onToggleUnit: (key: string) => void
}) {
  const visible = expanded ? items : items.slice(0, CHIP_CAP)
  const hidden = items.length - CHIP_CAP
  return (
    <span className="flex items-center gap-1.5 flex-wrap min-w-0">
      {visible.map(i => (
        <UnitChip key={i.key} item={i} code={code} checked={isSelected(i.key)} onToggle={() => onToggleUnit(i.key)} />
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

// ── Template resolution (ST-02) ──────────────────────────────────────────────

/** A template with courseType 'any' (or unset) targets every course type, so
 *  it counts as a type match for both the picker list and auto-assignment.
 *  The CE fixtures ship only 'any'-scoped templates; a strict-equality read
 *  would leave every course permanently unassigned. */
function matchesType(t: PceTemplate, o: CourseOffering): boolean {
  return !t.courseType || t.courseType === 'any' || t.courseType === o.courseType
}

/** ST-02 auto-assign + settled tie-break (surveys/push/page.tsx decision #2):
 *  0 matches → none (the row shows "No templates for this course type");
 *  1 match → auto-assign it; 2+ → the one flagged isDefaultForType, else the
 *  first match ("first found applies only when none is flagged"). */
function pickDefaultTemplate(o: CourseOffering, published: PceTemplate[]): PceTemplate | null {
  const matches = published.filter(t => matchesType(t, o))
  if (matches.length === 0) return null
  if (matches.length === 1) return matches[0]
  return matches.find(t => t.isDefaultForType) ?? matches[0]
}

type UnassignedReason = 'unassigned' | 'no-type-match' | 'unpublished'

interface TemplateResolution {
  template: PceTemplate | null
  /** Meaningful only when template is null. */
  reason: UnassignedReason
  /** Name of the previously-assigned template that is no longer published. */
  staleName?: string
}

type BlockReason = 'no-template' | 'overlap' | 'none-selected' | 'unstaffed' | 'no-applicable-roles'

const BLOCK_LABEL: Record<BlockReason, string> = {
  'no-template': 'No template assigned',
  'overlap': 'Blocked by an existing survey',
  'none-selected': 'No evaluatees selected',
  'unstaffed': 'No faculty staffed for this template',
  'no-applicable-roles': 'Template covers no roles for this course type',
}

interface Row {
  offering: CourseOffering
  code: string
  name: string
  resolution: TemplateResolution
  template: PceTemplate | null
  instances: SurveyInstance[]
  fresh: SurveyInstance[]
  gaps: SurveyInstance[]
  dups: SurveyInstance[]
  conflictCount: number
}

/** ST-02 per-course hard blocks. Faculty gaps alone never appear here. */
function blockReasonsOf(row: Row, isSelected: (key: string) => boolean): BlockReason[] {
  const out: BlockReason[] = []
  if (!row.template) {
    out.push('no-template')
    return out
  }
  if (row.conflictCount > 0) out.push('overlap')
  if (row.instances.length === 0) {
    // The assigned template's criteria are all inapplicable to this course
    // type — the course would contribute nothing. Judgment call: an included
    // course that silently creates zero evaluations should not pass the gate.
    out.push('no-applicable-roles')
  } else if (row.instances.every(i => i.status === 'gap')) {
    // Faculty-only template with zero people staffed in ANY of its roles —
    // distinct from a partial gap (which never blocks).
    out.push('unstaffed')
  } else if (row.fresh.length > 0 && row.fresh.every(i => !isSelected(i.key))) {
    // Every selectable unit deselected: the course is effectively deselected.
    // It contributes nothing to the push and blocks Continue until the admin
    // makes the intent explicit (re-select a unit or exclude the course).
    out.push('none-selected')
  }
  return out
}

// ── Save-as-draft payload (ST-02 Phase 3, sessionStorage) ────────────────────

interface DraftSnapshot {
  templateId: string
  templateName: string
  courseCode: string
  /** templateCriteria() at save time — drift detection input on resume. */
  criteria: Criterion[]
}

interface DraftPayload {
  savedAt: string
  assignments: Record<string, string>
  unitSelections: UnitSelectionMap
  autoUpdateOn: boolean
  excluded: string[]
  snapshots: Record<string, DraftSnapshot>
}

function readDraft(): DraftPayload | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    return raw ? (JSON.parse(raw) as DraftPayload) : null
  } catch {
    return null
  }
}

function fmtSavedAt(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

/** One resume-time finding about a course's saved template. */
interface DriftNotice {
  kind: 'updated' | 'unpublished'
  courseCode: string
  templateName: string
  addedRoleLabels: string[]
  removedRoleLabels: string[]
}

// ── Demo-only PRISM simulation (one course, applied on Refresh only) ─────────

interface PrismSim {
  instructorAssigned: boolean
  coInstructorAdded: boolean
}

const SIM_OFF: PrismSim = { instructorAssigned: false, coInstructorAdded: false }

function applySim(o: CourseOffering, sim: PrismSim): CourseOffering {
  if (o.id !== DEMO_OFFERING_ID) return o
  return {
    ...o,
    collaboratorIds: sim.instructorAssigned ? ['f2'] : [],
    coInstructorIds: sim.coInstructorAdded ? ['f5'] : undefined,
  }
}

/** Drop every unit-selection entry belonging to the given offerings (keys are
 *  `offeringId|…`). Template change, exclusion, and reset all route here so
 *  no prior selection ever carries forward. */
function withoutOfferings(map: UnitSelectionMap, offeringIds: ReadonlySet<string>): UnitSelectionMap {
  const next: UnitSelectionMap = {}
  for (const [k, v] of Object.entries(map)) {
    if (!offeringIds.has(k.slice(0, k.indexOf('|')))) next[k] = v
  }
  return next
}

export default function VariantCTwoPhase() {
  const { templates, surveys } = usePce()

  // Demo-only template overlays (drift simulations) — applied over the shared
  // store so nothing outside this compare route ever sees them.
  const [templateOverrides, setTemplateOverrides] = useState<Record<string, Partial<PceTemplate>>>({})
  const effTemplates = useMemo(
    () => templates.map(t => (templateOverrides[t.id] ? { ...t, ...templateOverrides[t.id] } : t)),
    [templates, templateOverrides],
  )

  const publishedTemplates = useMemo(
    () =>
      effTemplates.filter(t =>
        t.status === 'active' && !t.archived && (!t.surveyType || t.surveyType === 'course_evaluation'),
      ),
    [effTemplates],
  )

  const term = MOCK_PROGRAM_TERMS.find(t => t.id === 'pt5')!
  const courses = useMemo(
    () =>
      MOCK_COURSE_OFFERINGS
        .filter(o => o.termId === term.id && o.status !== 'archived')
        .sort((a, b) => courseLabelOf(a).localeCompare(courseLabelOf(b), undefined, { numeric: true })),
    [term.id],
  )

  // Demo hard block (LOCAL, never written to shared fixtures): one synthetic
  // Live instructor survey on co13/DPT-510. Its real pf0-pf2 fixtures are
  // Scheduled, which ST-02 exempts; Live is what makes the role overlap block.
  const surveysPlus = useMemo<PceSurvey[]>(() => {
    const demoLive: PceSurvey = {
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
      responseRate: 32,
      responseCount: 14,
      enrollmentCount: 44,
      deadline: 'Dec 18, 2026',
      createdAt: 'Jul 15, 2026',
      createdBy: 'Dr. Anita Patel',
      surveyType: 'course_evaluation',
      openDate: '2026-12-04',
      academicYear: '2026–2027',
      programId: 'prog1',
    }
    return [...surveys, demoLive]
  }, [surveys])

  // ── Core state ─────────────────────────────────────────────────────────────
  // Assignments are MATERIALIZED: every course gets an explicit entry at seed/
  // reset/re-include time (its type default, or nothing when no type match).
  // This is what makes the unpublished-template check honest for auto-assigned
  // courses too — an archived template can never silently fall back to a
  // different default.
  const seedAssignments = (published: PceTemplate[]): Record<string, string> => {
    const out: Record<string, string> = {}
    for (const o of courses) {
      const def = pickDefaultTemplate(o, published)
      if (def) out[o.id] = def.id
    }
    return out
  }
  const [assignments, setAssignments] = useState<Record<string, string>>(() => seedAssignments(publishedTemplates))
  const [unitSelections, setUnitSelections] = useState<UnitSelectionMap>({})
  const [excluded, setExcluded] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [dismissedGaps, setDismissedGaps] = useState<Set<string>>(new Set())
  const [openId, setOpenId] = useState<string | null>(null)
  const [autoUpdateOn, setAutoUpdateOn] = useState(false)

  // Sub-view: in-step template creation (same chooser-less create + builder as
  // the production step's subView pattern).
  const [subView, setSubView] = useState<'assign' | 'create' | { buildId: string }>('assign')
  const [notice, setNotice] = useState<{ kind: 'published' | 'draft'; name: string } | null>(null)
  const [resetOpen, setResetOpen] = useState(false)

  // Draft state (sessionStorage-backed).
  const [savedDraft, setSavedDraft] = useState<DraftPayload | null>(null)
  const [resumePrompt, setResumePrompt] = useState<DraftPayload | null>(null)
  const [driftNotices, setDriftNotices] = useState<DriftNotice[]>([])

  // Demo PRISM sim: pendingSim is what the demo buttons mutate ("what Prism
  // now says"); syncedSim is what the plan currently reflects. ONLY Refresh
  // moves pending → synced (ST-02: Refresh is the only re-sync trigger).
  const [pendingSim, setPendingSim] = useState<PrismSim>(SIM_OFF)
  const [syncedSim, setSyncedSim] = useState<PrismSim>(SIM_OFF)

  useEffect(() => {
    const d = readDraft()
    if (d) {
      setSavedDraft(d)
      setResumePrompt(d)
    }
  }, [])

  // ── Template resolution + row model ────────────────────────────────────────
  const resolveTemplateFor = (o: CourseOffering): TemplateResolution => {
    const raw = assignments[o.id]
    if (raw) {
      const t = effTemplates.find(x => x.id === raw)
      if (t && templateStoryStatusOf(t) === 'published') return { template: t, reason: 'unassigned' }
      // Assigned template since unpublished/archived/deleted → treated as "no
      // template assigned" and blocked. NEVER swapped to a different template.
      return { template: null, reason: 'unpublished', staleName: t?.name }
    }
    const hasTypeMatch = publishedTemplates.some(t => matchesType(t, o))
    return { template: null, reason: hasTypeMatch ? 'unassigned' : 'no-type-match' }
  }

  const rows: Row[] = useMemo(
    () =>
      courses.map(o0 => {
        const o = applySim(o0, syncedSim)
        const resolution = resolveTemplateFor(o)
        const template = resolution.template
        const instances = template ? expandInstances(o, template, surveysPlus, effTemplates) : []
        const conflicts = template ? roleOverlapConflicts(o, template, surveysPlus, effTemplates) : []
        const { code, name } = splitLabel(o)
        return {
          offering: o,
          code,
          name,
          resolution,
          template,
          instances,
          fresh: instances.filter(i => i.status === 'new'),
          gaps: instances.filter(i => i.status === 'gap'),
          dups: instances.filter(i => i.status === 'duplicate'),
          conflictCount: conflicts.length,
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [courses, syncedSim, assignments, publishedTemplates, effTemplates, surveysPlus],
  )

  // First-sight unit seeding — 'new' units arrive selected (ALL faculty
  // selected by default), gaps and duplicates deselected. An existing key is
  // never overwritten; only template change, exclusion, or Refresh may change
  // an existing entry.
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

  const isSelectedUnit = (key: string) => unitSelections[key] === 'selected'

  // ── Derived (gate + lead) ──────────────────────────────────────────────────
  const includedRows = rows.filter(r => !excluded.has(r.offering.id))
  const excludedRows = rows.filter(r => excluded.has(r.offering.id))
  const blocksById = useMemo(() => {
    const m = new Map<string, BlockReason[]>()
    for (const r of includedRows) m.set(r.offering.id, blockReasonsOf(r, isSelectedUnit))
    return m
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, excluded, unitSelections])
  const blockedRows = includedRows.filter(r => (blocksById.get(r.offering.id) ?? []).length > 0)
  const gapOnlyRows = includedRows.filter(r =>
    (blocksById.get(r.offering.id) ?? []).length === 0 && r.gaps.length > 0 && !dismissedGaps.has(r.offering.id),
  )
  const readyRows = includedRows.filter(r => !blockedRows.includes(r) && !gapOnlyRows.includes(r))
  const toCreate = includedRows.flatMap(r => r.fresh).filter(i => isSelectedUnit(i.key)).length
  // ST-02 per-course gate: Continue is disabled while ANY included course
  // carries a block, or the push would create nothing.
  const continueDisabled = blockedRows.length > 0 || toCreate === 0

  // ── Handlers ───────────────────────────────────────────────────────────────

  const onTemplateChange = (offeringId: string, templateId: string) => {
    setAssignments(prev => ({ ...prev, [offeringId]: templateId }))
    // ST-02: changing a course's template clears its ENTIRE unit-selection
    // slice — no prior selection carries forward, even for shared roles. The
    // seeding effect re-populates the new template's units with first-sight
    // defaults on the next recompute.
    setUnitSelections(prev => withoutOfferings(prev, new Set([offeringId])))
  }

  const excludeCourses = (ids: string[]) => {
    setExcluded(prev => new Set([...prev, ...ids]))
    // Wipe the excluded courses' state so a later re-include starts fresh.
    setAssignments(prev => {
      const next = { ...prev }
      for (const id of ids) delete next[id]
      return next
    })
    setUnitSelections(prev => withoutOfferings(prev, new Set(ids)))
  }

  const includeCourse = (id: string) => {
    setExcluded(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    // Re-inclusion starts from the TYPE DEFAULT (or unassigned when there is
    // none) — never from restored prior template/unit state. Units re-seed
    // with first-sight defaults via the seeding effect.
    const o = courses.find(c => c.id === id)
    const def = o ? pickDefaultTemplate(o, publishedTemplates) : null
    setAssignments(prev => {
      const next = { ...prev }
      if (def) next[id] = def.id
      else delete next[id]
      return next
    })
  }

  const flipSelected = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const handleResetDefaults = () => {
    const nextAssignments: Record<string, string> = {}
    const changed = new Set<string>()
    for (const o of courses) {
      if (excluded.has(o.id)) continue
      const def = pickDefaultTemplate(o, publishedTemplates)
      if (def) nextAssignments[o.id] = def.id
      if ((assignments[o.id] ?? '') !== (def?.id ?? '')) changed.add(o.id)
    }
    setAssignments(nextAssignments)
    if (changed.size > 0) setUnitSelections(prev => withoutOfferings(prev, changed))
    setResetOpen(false)
  }
  const resetChangedCount = courses.filter(o => {
    if (excluded.has(o.id)) return false
    const def = pickDefaultTemplate(o, publishedTemplates)
    return (assignments[o.id] ?? '') !== (def?.id ?? '')
  }).length

  const handleRefresh = () => {
    // ST-02 manual refresh — the ONLY Prism re-sync trigger. Re-derive the
    // unit list from what Prism now says (pendingSim), then reconcile: new
    // units arrive per the Auto Update flag, removed units drop out, every
    // state the admin already set is left untouched.
    const fresh: SurveyInstance[] = []
    for (const o0 of courses) {
      if (excluded.has(o0.id)) continue
      const o = applySim(o0, pendingSim)
      const t = resolveTemplateFor(o).template
      if (t) fresh.push(...expandInstances(o, t, surveysPlus, effTemplates))
    }
    setUnitSelections(prev => reconcileUnitsOnRefresh(prev, fresh, autoUpdateOn))
    setSyncedSim(pendingSim)
  }

  const handleSaveDraft = () => {
    const snapshots: Record<string, DraftSnapshot> = {}
    for (const r of rows) {
      if (excluded.has(r.offering.id) || !r.template) continue
      snapshots[r.offering.id] = {
        templateId: r.template.id,
        templateName: r.template.name,
        courseCode: r.code,
        criteria: templateCriteria(r.template),
      }
    }
    const payload: DraftPayload = {
      savedAt: new Date().toISOString(),
      assignments,
      unitSelections,
      autoUpdateOn,
      excluded: [...excluded],
      snapshots,
    }
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(payload))
    } catch {
      // Storage unavailable — the button still reflects the in-memory save.
    }
    setSavedDraft(payload)
    setResumePrompt(null)
  }

  const handleResume = (d: DraftPayload) => {
    const nextAssignments = { ...d.assignments }
    const notices: DriftNotice[] = []
    for (const [oid, snap] of Object.entries(d.snapshots)) {
      const t = effTemplates.find(x => x.id === snap.templateId)
      if (!t || templateStoryStatusOf(t) !== 'published') {
        // Template since archived/unpublished/deleted → the course resumes as
        // "no template assigned" and blocks until a published one is chosen.
        delete nextAssignments[oid]
        notices.push({
          kind: 'unpublished',
          courseCode: snap.courseCode,
          templateName: snap.templateName,
          addedRoleLabels: [],
          removedRoleLabels: [],
        })
        continue
      }
      const current = templateCriteria(t)
      const snapSet = new Set(snap.criteria)
      const curSet = new Set(current)
      const added = current.filter(c => !snapSet.has(c))
      const removed = snap.criteria.filter(c => !curSet.has(c))
      if (added.length > 0 || removed.length > 0) {
        notices.push({
          kind: 'updated',
          courseCode: snap.courseCode,
          templateName: t.name,
          addedRoleLabels: added.map(c => CRITERION_TOGGLE_LABEL[c]),
          removedRoleLabels: removed.map(c => CRITERION_TOGGLE_LABEL[c]),
        })
      }
    }
    setAssignments(nextAssignments)
    setUnitSelections(d.unitSelections)
    setAutoUpdateOn(d.autoUpdateOn)
    setExcluded(new Set(d.excluded))
    setDriftNotices(notices)
    setResumePrompt(null)
  }

  const handleStartFresh = () => {
    try {
      sessionStorage.removeItem(DRAFT_KEY)
    } catch {
      // Ignore storage failures — the prompt is dismissed either way.
    }
    setSavedDraft(null)
    setResumePrompt(null)
  }

  /** Demo only — resets the live step state and re-reads the saved draft, so
   *  the resume prompt (and any drift since the save) can be exercised
   *  without leaving the page. */
  const handleSimulateReload = () => {
    setAssignments(seedAssignments(publishedTemplates))
    setUnitSelections({})
    setExcluded(new Set())
    setSelected(new Set())
    setDismissedGaps(new Set())
    setAutoUpdateOn(false)
    setDriftNotices([])
    setOpenId(null)
    setSyncedSim(pendingSim)
    const d = readDraft()
    setSavedDraft(d)
    setResumePrompt(d)
  }

  /** Demo only — the saved draft's first snapshotted template gains a
   *  Teaching Assistant section, so resume raises the drift banner. */
  const draftTargetSnapshot = savedDraft ? Object.values(savedDraft.snapshots)[0] ?? null : null
  const handleSimTemplateGainedRole = () => {
    if (!draftTargetSnapshot) return
    const t = effTemplates.find(x => x.id === draftTargetSnapshot.templateId)
    if (!t) return
    const dyn = t.templateSections ?? []
    setTemplateOverrides(prev => ({
      ...prev,
      [t.id]: {
        ...prev[t.id],
        templateSections: [
          ...dyn.filter(s => s.id !== `${t.id}-sim-ta`),
          {
            id: `${t.id}-sim-ta`,
            subjectKey: 'teaching_assistant',
            title: 'Teaching Assistant',
            order: dyn.length,
            questions: [
              { id: `${t.id}-sim-q`, text: 'The teaching assistant supported student learning effectively.', answerType: 'likert', order: 0 },
            ],
          },
        ],
      },
    }))
  }
  /** Demo only — the saved draft's first snapshotted template is archived, so
   *  resume treats its courses as "no template assigned" and blocks. */
  const handleSimTemplateArchived = () => {
    if (!draftTargetSnapshot) return
    setTemplateOverrides(prev => ({
      ...prev,
      [draftTargetSnapshot.templateId]: { ...prev[draftTargetSnapshot.templateId], archived: true },
    }))
  }
  const handleSimReset = () => {
    setTemplateOverrides({})
    setPendingSim(SIM_OFF)
    setSyncedSim(SIM_OFF)
  }

  const detail = rows.find(r => r.offering.id === openId) ?? null
  const demoCourse = rows.find(r => r.offering.id === DEMO_OFFERING_ID)
  const prismPendingChanges =
    pendingSim.instructorAssigned !== syncedSim.instructorAssigned ||
    pendingSim.coInstructorAdded !== syncedSim.coInstructorAdded

  // ── Create sub-view: same chooser + builder as Settings > Templates ────────
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
                const t = effTemplates.find(x => x.id === subView.buildId)
                if (t && t.status !== 'active') setNotice({ kind: 'draft', name: t.name || 'Untitled template' })
              }
              setSubView('assign')
            }}
          >
            <i className="fa-light fa-arrow-left text-xs" aria-hidden="true" />
            Back to course list
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
    <div className="flex flex-col gap-4 min-h-full">
      {notice && (
        <LocalBanner
          variant={notice.kind === 'published' ? 'success' : 'info'}
          dismissible
          onDismiss={() => setNotice(null)}
        >
          {notice.kind === 'published'
            ? <>&ldquo;{notice.name}&rdquo; is published. Assign it from any course&rsquo;s resolve panel.</>
            : <>&ldquo;{notice.name}&rdquo; is saved as a draft. Publish it from Settings &rsaquo; Templates to make it assignable.</>}
        </LocalBanner>
      )}

      {/* Draft resume prompt — offered whenever a saved draft exists on load. */}
      {resumePrompt && (
        <LocalBanner variant="info">
          <span className="flex items-center gap-3 flex-wrap">
            <span>Draft saved at {fmtSavedAt(resumePrompt.savedAt)}.</span>
            <Button variant="outline" size="xs" onClick={() => handleResume(resumePrompt)}>
              Resume
            </Button>
            <Button variant="ghost" size="xs" onClick={handleStartFresh}>
              Start fresh
            </Button>
          </span>
        </LocalBanner>
      )}

      {/* Resume-time template drift findings. */}
      {driftNotices.length > 0 && (
        <LocalBanner variant="info" dismissible onDismiss={() => setDriftNotices([])}>
          <span className="flex flex-col gap-1">
            {driftNotices.map(n => (
              <span key={`${n.courseCode}-${n.kind}-${n.templateName}`}>
                {n.kind === 'updated' ? (
                  <>
                    &ldquo;{n.templateName}&rdquo; changed since this draft was saved.
                    {n.addedRoleLabels.length > 0 && <> It now also covers {n.addedRoleLabels.join(', ')}.</>}
                    {n.removedRoleLabels.length > 0 && <> It no longer covers {n.removedRoleLabels.join(', ')}.</>}
                    {' '}Faculty coverage below reflects the current template.
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

      {/* Phase 1 lead — orientation + step-level actions. */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex flex-col gap-1 min-w-0">
          <p className="text-sm tabular-nums">
            <span className="font-semibold">{rows.length} courses</span> selected for {term.name} {term.academicYear}
            <span style={{ color: 'var(--chip-2)' }}> · {readyRows.length} ready</span>
            {gapOnlyRows.length > 0 && <span style={{ color: 'var(--chip-4)' }}> · {gapOnlyRows.length} with faculty gaps</span>}
            {blockedRows.length > 0 && <span style={{ color: 'var(--chip-destructive)' }}> · {blockedRows.length} blocked</span>}
            {excludedRows.length > 0 && <span className="text-muted-foreground"> · {excludedRows.length} excluded</span>}
          </p>
          <p className="text-xs text-muted-foreground">Open any course to change its template or review details.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {savedDraft && !resumePrompt && (
            <span className="text-xs tabular-nums text-muted-foreground">Draft saved at {fmtSavedAt(savedDraft.savedAt)}</span>
          )}
          <Button variant="outline" size="sm" onClick={handleSaveDraft}>
            Save as draft
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setResetOpen(true)}
          >
            Reset to defaults
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setNotice(null); setSubView('create') }}>
            Create new template
          </Button>
        </div>
      </div>

      {/* ST-02 Auto Update — ONE flag for the whole step; Refresh is the only
          Prism re-sync trigger and lives beside it (the faculty-gap rows below
          are what it re-checks). */}
      <div className="flex items-center justify-between gap-4 flex-wrap rounded-lg border border-border px-3 py-2.5">
        <label htmlFor="vc-auto-update" className="flex items-center gap-2.5 cursor-pointer">
          <ToggleSwitch
            id="vc-auto-update"
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

      {/* Phase 1 — the simple table. Five columns, no chips, no dropdowns. */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div
          className="grid items-center gap-3 ps-3 pe-3 py-2 bg-muted/50 border-b border-border text-xs font-medium text-muted-foreground"
          style={{ gridTemplateColumns: '24px minmax(0,1fr) 110px 200px 230px' }}
        >
          <span className="flex items-center">
            <Checkbox
              checked={selected.size === 0 ? false : selected.size === rows.length ? true : 'indeterminate'}
              onCheckedChange={v => setSelected(v ? new Set(rows.map(r => r.offering.id)) : new Set())}
              aria-label="Select all courses"
            />
          </span>
          <span>Course</span>
          <span>Type</span>
          <span>Template</span>
          <span>Action needed</span>
        </div>

        {rows.map(row => {
          const o = row.offering
          const mode = deliveryModeOf(o)
          const isExcluded = excluded.has(o.id)
          const blocks = isExcluded ? [] : (blocksById.get(o.id) ?? [])
          const isBlocked = blocks.length > 0
          const hasGapOnly = !isExcluded && !isBlocked && row.gaps.length > 0 && !dismissedGaps.has(o.id)
          // Gap rows: amber left strip + tint. Hard-block rows: a visually
          // DISTINCT destructive strip + tint so they never read as ordinary
          // gaps. Both tint tokens are app-level, theme-aware.
          const rowTreatment = isBlocked
            ? { boxShadow: 'inset 3px 0 0 var(--chip-destructive)', background: 'var(--pce-impact-bg)' }
            : hasGapOnly
              ? { boxShadow: 'inset 3px 0 0 var(--chip-4)', background: 'var(--group-band-attention-bg)' }
              : undefined
          return (
            <div
              key={o.id}
              className={`grid items-center gap-3 ps-3 pe-3 border-b border-border last:border-b-0 ${isExcluded ? 'opacity-55' : ''}`}
              style={{ gridTemplateColumns: '24px minmax(0,1fr) 110px 200px 230px', minHeight: 46, ...rowTreatment }}
            >
              <span className="flex items-center">
                <Checkbox
                  checked={selected.has(o.id)}
                  onCheckedChange={() => flipSelected(o.id)}
                  aria-label={`Select ${row.code}`}
                />
              </span>

              {/* Course — the whole cell opens the focused view. */}
              <Button
                variant="ghost"
                size="sm"
                className="justify-start gap-2 px-1.5 h-8 font-normal min-w-0"
                onClick={() => setOpenId(o.id)}
              >
                <span className="font-mono text-xs tabular-nums text-muted-foreground shrink-0">{row.code}</span>
                {row.name && <span className="truncate text-sm">{row.name}</span>}
              </Button>

              <span><TypePill deliveryMode={mode} label={COURSE_TYPE_FULL_LABEL[mode]} /></span>

              <span className="text-sm truncate">
                {row.template ? (
                  <span className="text-muted-foreground" title={row.template.name}>{row.template.name}</span>
                ) : isExcluded ? (
                  <span className="text-muted-foreground">&ndash;</span>
                ) : row.resolution.reason === 'no-type-match' ? (
                  <span className="text-muted-foreground">No templates for this course type</span>
                ) : (
                  <span style={{ color: 'var(--chip-destructive)' }}>No template assigned</span>
                )}
              </span>

              {/* "Action needed" — consolidates gap + conflict; no faculty
                  names ever render in this column. */}
              <span className="flex items-center gap-2 min-w-0">
                {isExcluded ? (
                  <>
                    <span className="text-sm text-muted-foreground">Excluded</span>
                    <Button variant="link" size="sm" className="px-0 h-auto" onClick={() => includeCourse(o.id)}>
                      Include
                    </Button>
                  </>
                ) : isBlocked ? (
                  <>
                    <i className="fa-solid fa-lock text-[10px] shrink-0" style={{ color: 'var(--chip-destructive)' }} aria-hidden="true" />
                    <span className="text-sm truncate" style={{ color: 'var(--chip-destructive)' }}>
                      {BLOCK_LABEL[blocks[0]]}
                    </span>
                    <Button variant="link" size="sm" className="px-0 h-auto shrink-0" onClick={() => setOpenId(o.id)}>
                      Resolve
                    </Button>
                  </>
                ) : hasGapOnly ? (
                  <>
                    <i className="fa-solid fa-user-slash text-[10px] shrink-0" style={{ color: 'var(--chip-4)' }} aria-hidden="true" />
                    <span className="text-sm whitespace-nowrap" style={{ color: 'var(--chip-4)' }}>
                      {row.gaps.length} role{row.gaps.length !== 1 ? 's' : ''} unassigned
                    </span>
                    <Button variant="link" size="sm" className="px-0 h-auto" onClick={() => setOpenId(o.id)}>
                      Resolve
                    </Button>
                  </>
                ) : (
                  <>
                    <span aria-hidden="true" className="size-1.5 rounded-full shrink-0" style={{ background: 'var(--chip-2)' }} />
                    <span className="text-sm">Ready</span>
                  </>
                )}
              </span>
            </div>
          )
        })}
      </div>

      {/* Toggl-style floating bulk bar — appears only when rows are checked. */}
      {selected.size > 0 && (
        <div
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 rounded-lg border border-border bg-background shadow-lg ps-4 pe-2 py-2"
          role="toolbar"
          aria-label="Bulk actions"
        >
          <span className="text-sm font-medium tabular-nums whitespace-nowrap">{selected.size} selected</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              excludeCourses([...selected])
              setSelected(new Set())
            }}
          >
            Exclude from push
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        </div>
      )}

      {/* Demo controls — scaffolding only, visually separated from product UI. */}
      <div className="rounded-lg border border-dashed px-3 py-3 flex flex-col gap-3" style={{ borderColor: 'var(--border-control-35)', background: 'var(--muted)' }}>
        <p className="text-xs font-medium text-muted-foreground">Simulate PRISM changes (demo only)</p>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="xs"
            disabled={pendingSim.instructorAssigned}
            onClick={() => setPendingSim(prev => ({ ...prev, instructorAssigned: true }))}
          >
            Assign an instructor to {demoCourse?.code ?? DEMO_OFFERING_ID}
          </Button>
          <Button
            variant="outline"
            size="xs"
            disabled={!pendingSim.instructorAssigned || pendingSim.coInstructorAdded}
            onClick={() => setPendingSim(prev => ({ ...prev, coInstructorAdded: true }))}
          >
            Add a co-instructor to {demoCourse?.code ?? DEMO_OFFERING_ID}
          </Button>
          <Button
            variant="outline"
            size="xs"
            disabled={!pendingSim.instructorAssigned && !pendingSim.coInstructorAdded}
            onClick={() => setPendingSim(SIM_OFF)}
          >
            Remove all instructors from {demoCourse?.code ?? DEMO_OFFERING_ID}
          </Button>
          {prismPendingChanges && (
            <span className="text-xs" style={{ color: 'var(--chip-4)' }}>
              Prism data changed. Click Refresh above to pull it in.
            </span>
          )}
        </div>
        <p className="text-xs font-medium text-muted-foreground pt-1 border-t border-border">Simulate template changes since the draft was saved (demo only)</p>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="xs" disabled={!draftTargetSnapshot} onClick={handleSimTemplateGainedRole}>
            Template gained a new role since the draft was saved
          </Button>
          <Button variant="outline" size="xs" disabled={!draftTargetSnapshot} onClick={handleSimTemplateArchived}>
            Template archived since the draft was saved
          </Button>
          <Button variant="outline" size="xs" disabled={!savedDraft} onClick={handleSimulateReload}>
            Reload the step (shows the resume prompt)
          </Button>
          <Button variant="ghost" size="xs" onClick={handleSimReset}>
            Reset simulations
          </Button>
          {!savedDraft && (
            <span className="text-xs text-muted-foreground">Save a draft first to enable the template simulations.</span>
          )}
        </div>
      </div>

      {/* Step footer — ST-02 per-course gate: ANY included course with a block
          disables Continue until it is resolved or excluded. */}
      <div className="sticky bottom-0 mt-auto bg-background border-t border-border py-4 flex items-center justify-between gap-4">
        <span className="text-xs tabular-nums text-muted-foreground">
          {toCreate} evaluation{toCreate !== 1 ? 's' : ''} across {includedRows.length} course{includedRows.length !== 1 ? 's' : ''}
          {blockedRows.length > 0 && (
            <>
              {' · '}
              <span className="font-medium" style={{ color: 'var(--chip-destructive)' }}>
                {blockedRows.length} course{blockedRows.length !== 1 ? 's' : ''} must be resolved or excluded first
              </span>
            </>
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

      {/* Reset to defaults — irreversible, so it itemizes what will change. */}
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

      {/* Phase 2 — the focused resolve sheet for ONE course. */}
      <ResolveSheet
        row={detail}
        blocks={detail ? (excluded.has(detail.offering.id) ? [] : blocksById.get(detail.offering.id) ?? []) : []}
        isExcluded={detail ? excluded.has(detail.offering.id) : false}
        publishedTemplates={publishedTemplates}
        defaultTemplateId={detail ? pickDefaultTemplate(detail.offering, publishedTemplates)?.id : undefined}
        onTemplateChange={onTemplateChange}
        isSelectedUnit={isSelectedUnit}
        onFlipUnit={key =>
          setUnitSelections(prev => ({ ...prev, [key]: prev[key] === 'selected' ? 'deselected' : 'selected' }))
        }
        onDismissGaps={id => {
          setDismissedGaps(prev => new Set(prev).add(id))
          setOpenId(null)
        }}
        onExclude={id => {
          excludeCourses([id])
          setOpenId(null)
        }}
        onInclude={includeCourse}
        onClose={() => setOpenId(null)}
      />
    </div>
  )
}

// ── Phase 2 sheet ────────────────────────────────────────────────────────────

function ResolveSheet({
  row, blocks, isExcluded, publishedTemplates, defaultTemplateId,
  onTemplateChange, isSelectedUnit, onFlipUnit,
  onDismissGaps, onExclude, onInclude, onClose,
}: {
  row: Row | null
  blocks: BlockReason[]
  isExcluded: boolean
  publishedTemplates: PceTemplate[]
  defaultTemplateId?: string
  onTemplateChange: (offeringId: string, templateId: string) => void
  isSelectedUnit: (key: string) => boolean
  onFlipUnit: (key: string) => void
  onDismissGaps: (offeringId: string) => void
  onExclude: (offeringId: string) => void
  onInclude: (offeringId: string) => void
  onClose: () => void
}) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [chipsExpanded, setChipsExpanded] = useState(false)

  if (!row) return null
  const o = row.offering
  const mode = deliveryModeOf(o)
  const isBlocked = blocks.length > 0

  // ST-02: the picker's option list is filtered to the course's own type
  // ('any'-scoped templates apply to every type).
  const typeMatches = publishedTemplates.filter(t => matchesType(t, o))
  const conflictedCriteria = new Set(row.dups.map(i => i.criterion))

  const previewButton = (
    <Button
      variant="outline"
      size="sm"
      disabled={!row.template}
      onClick={() => row.template && setPreviewOpen(true)}
    >
      Preview survey
      <span className="sr-only">{row.template ? ` for ${row.code}` : '. Assign a template to preview.'}</span>
    </Button>
  )

  return (
    <>
    <FloatingSheetPanel open onOpenChange={open => { if (!open) onClose() }}>
      <FloatingSheetPanelContent contentSlot="push-resolve-sheet">
        <FloatingSheetPanelHeader
          title={courseLabelOf(o)}
          subtitle={`${COURSE_TYPE_FULL_LABEL[mode]} · ${o.cohort} · ${o.enrolledCount} students`}
          onClose={onClose}
        />

        <FloatingSheetPanelBody className="gap-5 px-4 pb-4">
          {/* Template — the one decision that changes everything below. */}
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-muted-foreground">Template</p>
            <Select
              value={row.template?.id ?? ''}
              onValueChange={v => onTemplateChange(o.id, v)}
            >
              <SelectTrigger aria-label={`Template for ${row.code}`} className="w-full">
                <SelectValue placeholder="Assign a template" />
              </SelectTrigger>
              <SelectContent>
                {/* ST-02: zero published templates for this course's TYPE — exact copy. */}
                {typeMatches.length === 0 && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    No templates for this course type
                  </div>
                )}
                {typeMatches.map(t => (
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
            {row.resolution.reason === 'unpublished' ? (
              <p className="text-xs" style={{ color: 'var(--chip-destructive)' }}>
                {row.resolution.staleName
                  ? <>&ldquo;{row.resolution.staleName}&rdquo; is no longer published. Assign a published template to continue.</>
                  : <>The previously assigned template is no longer published. Assign a published template to continue.</>}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Changing the template clears this course&rsquo;s evaluatee selections and re-checks coverage below.
              </p>
            )}
          </div>

          {/* Hard block — the role-overlap conflict table (four columns). */}
          {row.conflictCount > 0 && row.template && (
            <div className="rounded-lg overflow-hidden" style={{ background: 'var(--pce-impact-bg)', border: '1px solid var(--pce-impact-border)' }}>
              <div className="flex items-start gap-2.5 px-3 pt-3 pb-2">
                <i className="fa-solid fa-lock text-xs mt-0.5 shrink-0" style={{ color: 'var(--chip-destructive)' }} aria-hidden="true" />
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-medium">This course cannot be pushed yet</p>
                  <p className="text-xs text-muted-foreground">
                    Roles marked No are already covered by an existing survey for this course and term, and cannot be
                    evaluated again in this push. Choose a template that does not cover them, cancel the existing survey,
                    or exclude this course.
                  </p>
                </div>
              </div>
              <div className="mx-3 mb-3 rounded-md border border-border bg-background overflow-x-auto">
                {/* Raw <table> is banned and DataTable is oversized for 2-4
                    rows in a disclosure — ARIA table roles on the CSS grid
                    expose the header-cell relationships instead (WCAG 1.3.1). */}
                <div
                  role="table"
                  aria-label={`Role coverage for ${row.code}`}
                  className="grid items-center gap-x-4 gap-y-0 text-xs min-w-[520px]"
                  style={{ gridTemplateColumns: 'minmax(64px, auto) minmax(110px, auto) minmax(0, 1fr) minmax(170px, auto)' }}
                >
                  <div role="row" className="contents">
                    <span role="columnheader" className="font-medium text-muted-foreground px-3 py-1.5 border-b border-border">Evaluate?</span>
                    <span role="columnheader" className="font-medium text-muted-foreground py-1.5 border-b border-border">Role</span>
                    <span role="columnheader" className="font-medium text-muted-foreground py-1.5 border-b border-border">Assigned person(s)</span>
                    <span role="columnheader" className="font-medium text-muted-foreground pe-3 py-1.5 border-b border-border">Covered by</span>
                  </div>
                  {(() => {
                    // One row per criterion of the CURRENT template's coverage.
                    const byCriterion = new Map<string, { roleLabel: string; persons: string[]; existing: PceSurvey | null }>()
                    for (const i of row.instances) {
                      const at = byCriterion.get(i.criterion) ?? {
                        roleLabel: i.roleLabel || 'Course material',
                        persons: [],
                        existing: null,
                      }
                      if (i.personName) at.persons.push(i.personName)
                      if (i.status === 'duplicate' && i.existing) at.existing = i.existing
                      byCriterion.set(i.criterion, at)
                    }
                    return [...byCriterion.entries()].map(([criterion, r]) => {
                      const opens = fmtYmd(r.existing?.openDate)
                      const blockedRole = conflictedCriteria.has(criterion as Criterion)
                      return (
                        <div key={criterion} role="row" className="contents">
                          <span role="cell" className="px-3 py-2">
                            {blockedRole ? (
                              <span
                                className="inline-flex items-center rounded-full px-2 py-0.5 font-medium"
                                style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
                              >
                                No
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center rounded-full px-2 py-0.5 font-medium"
                                style={{ background: 'var(--icon-disc-chart-2-bg)', color: 'var(--chip-2)' }}
                              >
                                Yes
                              </span>
                            )}
                          </span>
                          <span role="cell" className="py-2">{r.roleLabel}</span>
                          <span role="cell" className="py-2 truncate">
                            {criterion === 'students' ? '–' : r.persons.length > 0 ? r.persons.join(', ') : 'No one assigned'}
                          </span>
                          <span role="cell" className="pe-3 py-2 flex items-center gap-1.5 min-w-0">
                            {r.existing ? (
                              <>
                                <StoryStatusBadgeOS status={storyStatusOf(r.existing)} />
                                {opens && (
                                  <span className="text-muted-foreground tabular-nums whitespace-nowrap">Opened {opens}</span>
                                )}
                              </>
                            ) : (
                              <span className="text-muted-foreground">None</span>
                            )}
                          </span>
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Wholly-unstaffed faculty-only template — a hard block distinct
              from a partial gap. */}
          {blocks.includes('unstaffed') && (
            <div className="rounded-lg px-3 py-2.5 flex items-start gap-2.5" style={{ background: 'var(--pce-impact-bg)', border: '1px solid var(--pce-impact-border)' }}>
              <i className="fa-solid fa-lock text-xs mt-0.5 shrink-0" style={{ color: 'var(--chip-destructive)' }} aria-hidden="true" />
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium">No one to evaluate</p>
                <p className="text-xs text-muted-foreground">
                  This template evaluates faculty roles only, and no one is staffed in any of them. Add faculty in
                  Prism and refresh, choose a different template, or exclude this course from the push.
                </p>
              </div>
            </div>
          )}

          {/* Template covers no roles applicable to this course type. */}
          {blocks.includes('no-applicable-roles') && (
            <div className="rounded-lg px-3 py-2.5 flex items-start gap-2.5" style={{ background: 'var(--pce-impact-bg)', border: '1px solid var(--pce-impact-border)' }}>
              <i className="fa-solid fa-lock text-xs mt-0.5 shrink-0" style={{ color: 'var(--chip-destructive)' }} aria-hidden="true" />
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium">Template covers no roles for this course type</p>
                <p className="text-xs text-muted-foreground">
                  This course would create no evaluations. Choose a different template or exclude it from the push.
                </p>
              </div>
            </div>
          )}

          {/* Every unit deselected — the course is effectively deselected and
              blocks Continue until the intent is explicit. */}
          {blocks.includes('none-selected') && (
            <div className="rounded-lg px-3 py-2.5 flex items-start gap-2.5" style={{ background: 'var(--pce-impact-bg)', border: '1px solid var(--pce-impact-border)' }}>
              <i className="fa-solid fa-lock text-xs mt-0.5 shrink-0" style={{ color: 'var(--chip-destructive)' }} aria-hidden="true" />
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium">No evaluatees selected</p>
                <p className="text-xs text-muted-foreground">
                  Every evaluatee is deselected, so this course would create no evaluations. Select at least one below,
                  or exclude the course from the push.
                </p>
              </div>
            </div>
          )}

          {/* Faculty gaps — informational, never blocking. */}
          {row.template && row.gaps.length > 0 && !blocks.includes('unstaffed') && (
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground">
                  {row.gaps.length} role{row.gaps.length !== 1 ? 's' : ''} with no one assigned
                </p>
                {!isBlocked && (
                  <Button variant="ghost" size="xs" onClick={() => onDismissGaps(o.id)}>
                    Dismiss this notice
                  </Button>
                )}
              </div>
              {row.gaps.map(item => (
                <div
                  key={item.key}
                  className="rounded-lg flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2"
                  style={{ background: 'var(--group-band-attention-bg)' }}
                >
                  <i className="fa-solid fa-user-slash text-xs shrink-0" style={{ color: 'var(--chip-4)' }} aria-hidden="true" />
                  <div className="flex flex-col gap-0 min-w-0">
                    <span className="text-sm font-medium">No {item.roleLabel} assigned</span>
                    <span className="text-xs text-muted-foreground">Informational only. This does not block the push.</span>
                  </div>
                  <span className="ms-auto shrink-0">
                    {item.prismHref && <AddInPrismButton href={item.prismHref} label="Add faculty" roles={[item.roleLabel]} />}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Evaluatee breakdown — per-unit checkbox chips, capped at 3. */}
          {(row.fresh.length > 0 || row.dups.length > 0) && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-muted-foreground">What this push creates</p>
              {row.fresh.length > 0 && (
                <UnitChipsRow
                  items={row.fresh}
                  code={row.code}
                  isSelected={isSelectedUnit}
                  expanded={chipsExpanded}
                  onToggleExpanded={() => setChipsExpanded(v => !v)}
                  onToggleUnit={onFlipUnit}
                />
              )}
              {row.dups.length > 0 && (
                <div className="rounded-lg border border-border overflow-hidden">
                  {row.dups.map(item => (
                    <div key={item.key} className="flex items-center gap-2.5 ps-3 pe-3 border-b border-border last:border-b-0 opacity-70" style={{ minHeight: 42 }}>
                      <EvaluateeDisc item={item} />
                      <span className="text-sm truncate">
                        {instanceLabel(item)}
                        {item.scope !== 'course' && item.roleLabel && (
                          <span className="text-xs text-muted-foreground"> · {item.roleLabel}</span>
                        )}
                      </span>
                      <span className="ms-auto flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">Already covered</span>
                        {item.existing && <StoryStatusBadgeOS status={storyStatusOf(item.existing)} />}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Preview — the real student-facing preview dialog; gated strictly
              on an assigned template. */}
          <div>
            {row.template ? (
              previewButton
            ) : (
              <Tip label="Assign a template to preview" side="right">
                {/* Disabled buttons swallow pointer/focus events — the
                    focusable wrapper carries the tooltip AND a visible focus
                    ring (WCAG 2.4.7). */}
                <span
                  className="inline-flex rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                  tabIndex={0}
                >
                  {previewButton}
                </span>
              </Tip>
            )}
          </div>
        </FloatingSheetPanelBody>

        <FloatingSheetPanelFooter className="flex items-center gap-2">
          {isExcluded ? (
            <Button variant="outline" size="sm" onClick={() => onInclude(o.id)}>
              Include in push
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => onExclude(o.id)}>
              Exclude from push
            </Button>
          )}
          <Button variant="default" size="sm" className="ms-auto" onClick={onClose}>
            Done
          </Button>
        </FloatingSheetPanelFooter>
      </FloatingSheetPanelContent>
    </FloatingSheetPanel>

    {/* ST-02 forbids showing the survey/template title in the preview: the
        dialog receives a renamed copy, so the rendered sections and questions
        are real but the heading stays neutral. */}
    {row.template && (
      <SurveyPreviewDialog
        template={{ ...row.template, name: 'Survey preview' }}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    )}
    </>
  )
}
