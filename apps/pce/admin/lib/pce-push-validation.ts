// ============================================================================
// Push pre-flight validation — two categories of "you can still push, but…"
// warnings, surfaced as an actionable list in Step 1 and as acknowledgement
// gates at Review (pattern: 7shifts pre-publish warnings + Dropbox per-risk
// acknowledgement checkboxes).
//
//   A. Missing subject data — a course with no students (no recipients) or no
//      faculty (no one to evaluate). Intrinsic to the course; knowable in Step 1.
//   B. Survey-window misalignment — the survey opens after a course has already
//      ended. Needs the schedule, so it's only computable at Review.
//   C. Duplicate flows — a selected course already has a scheduled/live
//      evaluation from an earlier push; pushing again sends students a second,
//      overlapping survey. The Step-1 Status column shows the coverage; this
//      gate makes creating the overlap a conscious choice.
// ============================================================================

import {
  type CourseOffering,
  type PceSurvey,
  type PceTemplate,
  type SurveyStatus,
  MOCK_PROGRAM_TERMS,
  deliveryModeOf,
} from './pce-mock-data'
import {
  type Criterion,
  ALL_CRITERIA,
  CRITERION_BY_TYPE,
  courseLabelOf,
  prismAddHref,
  templateCriteria,
} from './pce-course-readiness'

// ── Story status (ST-02 vocabulary) ──────────────────────────────────────────
// ST-02 (Step 2 — Survey Design & Faculty Coverage, 2026-08-03) assumes six
// flat survey states — Draft / Scheduled / Live / Closed / Results Available /
// Archived — that don't map 1:1 onto the raw SurveyStatus enum (draft|
// scheduled|active|collecting|pending_review|released|closed): there's no
// 'archived' value at all, and the existing badge vocabulary already
// conflates pending_review + closed into one "In review" state
// (pce-badges.tsx:58-59, the 2026-07-08 unification). Rather than expand the
// raw enum (breaking every existing SurveyStatus-typed call site + badge),
// this is a DERIVED mapper — ST-02 logic reads storyStatusOf()/
// templateStoryStatusOf(), never the raw `status` field directly. Everything
// outside the push wizard (surveys-table, dashboard, results pages) is
// UNCHANGED and out of scope for this pass; it keeps reading raw `status`.
export type StoryStatus = 'draft' | 'scheduled' | 'live' | 'closed' | 'results_available' | 'archived'

export function storyStatusOf(s: PceSurvey): StoryStatus {
  if (s.archivedAt) return 'archived'
  switch (s.status) {
    case 'draft': return 'draft'
    case 'scheduled': return 'scheduled'
    case 'active':
    case 'collecting': return 'live'
    // Raw 'closed' and 'pending_review' both precede release and are shown as
    // one "In review" badge today — ST-02's "Closed" (window shut, awaiting
    // review) is the natural read for both.
    case 'pending_review':
    case 'closed': return 'closed'
    case 'released': return 'results_available'
  }
}

// ⚠️ SPEC CONTRADICTION (flag for Product, not resolved here): ST-02 lists
// Archived as one of the FOUR statuses whose role coverage hard-blocks a new
// push, yet also says the Admin resolves the block by "cancel (ST-16) or
// ARCHIVE (ST-09) the existing survey" — i.e. archiving is offered as the
// escape hatch, but per the blocking-statuses list, an archived survey would
// still block. Implemented here per the LITERAL text (archived still
// blocks) — archiveSurvey()/cancelSurvey() (pce-state.tsx) are unblocking
// stubs only for the Draft/Scheduled + cancel path; archiving a Live/Closed/
// Results Available survey does NOT currently exempt it from
// roleOverlapConflicts() below. Confirm the intended resolution mechanic
// with Product before Phase 4 ships the block's UI copy/actions.
export const STORY_STATUS_BLOCKS_OVERLAP: ReadonlySet<StoryStatus> = new Set([
  'live', 'closed', 'results_available', 'archived',
])

export type TemplateStoryStatus = 'published' | 'unpublished' | 'archived'

export function templateStoryStatusOf(t: PceTemplate): TemplateStoryStatus {
  if (t.archived) return 'archived'
  return t.status === 'active' ? 'published' : 'unpublished'
}

export interface CourseIssue {
  id: string
  courseLabel: string
  /** Plain-language reasons, e.g. ["no faculty assigned", "no students enrolled"]. */
  reasons: string[]
  /** New-tab Prism deep-link to fix the course — absent when Prism isn't the
   *  fix (duplicate flows are resolved by editing the selection, not Prism). */
  prismHref?: string
}

function hasFaculty(o: CourseOffering): boolean {
  return (
    !!o.primaryFacultyId ||
    o.collaboratorIds.length > 0 ||
    (o.labTaIds?.length ?? 0) > 0 ||
    (o.placementFacultyIds?.length ?? 0) > 0
  )
}

/**
 * A. Missing subject data — intrinsic completeness, independent of what's being
 * evaluated: a course can't produce a meaningful evaluation with no students
 * (nobody receives it) or no faculty (nobody to evaluate).
 */
export function subjectDataIssues(offerings: CourseOffering[]): CourseIssue[] {
  const out: CourseIssue[] = []
  for (const o of offerings) {
    const reasons: string[] = []
    if (!hasFaculty(o)) reasons.push('no faculty assigned')
    if (o.enrolledCount === 0) reasons.push('no students enrolled')
    if (reasons.length === 0) continue
    out.push({
      id: o.id,
      courseLabel: courseLabelOf(o),
      reasons,
      prismHref: prismAddHref(o, !hasFaculty(o) ? 'instructor' : 'students'),
    })
  }
  return out
}

/**
 * MOCK: real offerings carry their own dates. We don't have per-course dates
 * in the mock, so spread each course's end deterministically around its term's
 * end (by id) — enough to make the window check surface a realistic subset.
 * Also used for DISPLAY in the Courses & Evaluatees list, so the dates the
 * admin sees are the same ones the window check validates against.
 * Replace with the offering's real dates in production.
 */
function courseEndDate(o: CourseOffering): Date | null {
  const term = MOCK_PROGRAM_TERMS.find(t => t.id === o.termId)
  if (!term) return null
  const end = new Date(term.endDate)
  const seed = [...o.id].reduce((s, c) => s + c.charCodeAt(0), 0)
  const offsetWeeks = (seed % 9) - 4 // −4…+4 weeks straddling term end → realistic mix
  end.setDate(end.getDate() - offsetWeeks * 7)
  return end
}

/** Course start/end for display — start is a standard ~14-week run before the end. */
export function courseDates(o: CourseOffering): { start: Date; end: Date } | null {
  const end = courseEndDate(o)
  if (!end) return null
  const start = new Date(end)
  start.setDate(start.getDate() - 98)
  return { start, end }
}

// A flow in any of these states still reaches (or will reach) students — a new
// push over it creates a real overlap. Released/closed runs are history, and
// per the lifecycle rule a push-born flow starts at 'scheduled', never 'draft'.
const OPEN_FLOW_STATUSES: ReadonlySet<SurveyStatus> = new Set([
  'scheduled', 'active', 'collecting', 'pending_review',
])

const OPEN_FLOW_WORD: Partial<Record<SurveyStatus, string>> = {
  scheduled: 'scheduled',
  active: 'live',
  collecting: 'live',
  pending_review: 'in review',
}

/** YYYY-MM-DD → "Dec 4" without the UTC-midnight day shift of new Date(iso). */
function fmtYmd(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function flowSummary(f: PceSurvey): string {
  const who = f.evalScope === 'instructor'
    ? (f.instructors[0]?.name ?? 'Instructor')
    : 'Course'
  const opens = f.status === 'scheduled' && f.openDate ? ` (opens ${fmtYmd(f.openDate)})` : ''
  return `${who} — ${OPEN_FLOW_WORD[f.status] ?? f.status}${opens}`
}

// ── Role-overlap conflict check (ST-02 "Duplicate check") ────────────────────
// A push doesn't create "a survey per course" — it creates one survey INSTANCE
// per (course offering × evaluatee), where the evaluatees are what the assigned
// template demands: one course-material instance, plus one per faculty role the
// template evaluates × the person staffed in that role.
//
// ST-02 re-architects what counts as a duplicate (superseding the Jul 24/27
// person-grain "offering + role + person" rule — see
// docs/specs/2026-08-03-step2-survey-design-faculty-coverage-gap-analysis.md
// §2 #1–#2): a course's newly-assigned template is a hard-blocked duplicate
// only if its ROLE COVERAGE overlaps an existing Live/Closed/Results
// Available/Archived survey's role coverage for the same offering — a second
// Instructor survey is now a conflict regardless of WHICH person holds the
// role. Draft/Scheduled surveys are excluded (pulled in for editing instead,
// see draftOrScheduledMatch — Phase 3, not yet built).

export type InstanceStatus = 'new' | 'duplicate' | 'gap'

export interface SurveyInstance {
  /** `offeringId|criterion|person` — unique per row; NOT the duplicate key
   *  anymore (that's role-grain now, see RoleOverlapConflict). Person rides
   *  the NAME: the mock readiness resolvers return names, not ids (see
   *  CRITERION_BY_TYPE); swap to personId when real association data lands. */
  key: string
  offeringId: string
  scope: 'course' | 'instructor'
  /** Readiness criterion this instance evaluates ('students' = course material). */
  criterion: Criterion
  /** Type-aware role label ("Clinical Coordinator"); '' for course material. */
  roleLabel: string
  /** Person evaluated — null for course material and for unstaffed roles. */
  personName: string | null
  status: InstanceStatus
  /** The blocking survey this instance's ROLE overlaps (status 'duplicate' only). */
  existing: PceSurvey | null
  /** New-tab Prism deep-link to staff the missing role (status 'gap' only). */
  prismHref: string | null
}

export interface RoleOverlapConflict {
  criterion: Criterion
  roleLabel: string
  /** The existing survey whose role coverage this criterion overlaps. */
  existing: PceSurvey
}

/** A survey's own role coverage — course-scope/instructor-scope split flows
 *  carry a single criterion directly; a combined (pre-split or never-split)
 *  flow's coverage is its ORIGINAL template's full templateCriteria(). */
function roleCoverageOfSurvey(s: PceSurvey, templatesById: Map<string, PceTemplate>): Set<Criterion> {
  if (s.evalScope === 'course') return new Set(['students'])
  if (s.evalScope === 'instructor' && s.evalRole) return new Set([s.evalRole as Criterion])
  // Combined/legacy flow — no scope split recorded. Fall back to the
  // template's own coverage; if that template can no longer be found (e.g.
  // deleted since), assume it covers EVERYTHING rather than nothing — the
  // safer failure mode for a hard block is a false conflict, not a missed one.
  const t = templatesById.get(s.templateId)
  return new Set(t ? templateCriteria(t) : ALL_CRITERIA)
}

/**
 * ST-02 role-overlap check: which of the NEW template's criteria overlap an
 * existing Live/Closed/Results Available/Archived survey's role coverage for
 * the same offering. Recomputes on Term/AY or course-selection change only —
 * unlike the faculty-gap check, template/unit-selection edits don't change
 * this (the check is about what's already ON RECORD, not what's proposed).
 */
export function roleOverlapConflicts(
  offering: CourseOffering,
  template: PceTemplate,
  existingSurveys: PceSurvey[],
  templates: PceTemplate[],
): RoleOverlapConflict[] {
  const templatesById = new Map(templates.map(t => [t.id, t]))
  const mode = deliveryModeOf(offering)
  const newCriteria = new Set(templateCriteria(template))
  const out: RoleOverlapConflict[] = []
  for (const s of existingSurveys) {
    if (s.offeringId !== offering.id || s.cancelledAt) continue
    if (!STORY_STATUS_BLOCKS_OVERLAP.has(storyStatusOf(s))) continue
    for (const criterion of roleCoverageOfSurvey(s, templatesById)) {
      if (!newCriteria.has(criterion)) continue
      const spec = CRITERION_BY_TYPE[mode][criterion]
      out.push({
        criterion,
        roleLabel: criterion === 'students' ? 'Course material' : (spec?.label ?? criterion),
        existing: s,
      })
    }
  }
  return out
}

/**
 * ST-02: a Draft or Scheduled survey for this offering is NOT a duplicate —
 * it's pulled into the wizard for editing instead of blocking or creating a
 * second survey. Only one should ever exist per offering (one-survey-per-
 * course-per-term invariant); if more than one turns up, that's a fixture bug.
 */
export function draftOrScheduledMatch(
  offering: CourseOffering,
  existingSurveys: PceSurvey[],
): PceSurvey | null {
  return existingSurveys.find(s =>
    s.offeringId === offering.id &&
    !s.cancelledAt &&
    (storyStatusOf(s) === 'draft' || storyStatusOf(s) === 'scheduled')
  ) ?? null
}

// ── Evaluatee-unit selection (ST-02, Phase 2) ────────────────────────────────
// Sticky per-unit (role + person) admin decision, keyed by SurveyInstance.key.
// Absence of a key = untouched (this unit has never been seen); the wizard
// seeds first-sight defaults eagerly, so a rendered unit always has an entry.
// A key already in the map is never silently overwritten by plan recomputes —
// only the template-change reset, course deselection, or a manual refresh
// (reconcileUnitsOnRefresh below) may change an existing key's state.
export type UnitSelectionState = 'selected' | 'deselected'
export type UnitSelectionMap = Record<string, UnitSelectionState>

/**
 * ST-02 manual-refresh reconciliation (pure). Applied when the admin clicks
 * Refresh, after re-deriving the unit list from Prism-backed data:
 *   (a) a fresh unit the map has never seen arrives 'selected' when Auto
 *       Update is on, 'deselected' when off — the flag decides ONLY the
 *       starting checkbox state; an auto-selected unit still passes the same
 *       role-overlap duplicate gate as any other (instance status stays
 *       derived from expandInstances/roleOverlapConflicts — nothing here
 *       special-cases it);
 *   (b) a unit no longer present in Prism is removed entirely, regardless of
 *       the flag;
 *   (c) a unit present in both keeps whatever state the admin (or a prior
 *       first-sight seed) set — refresh never overrides an existing decision.
 */
export function reconcileUnitsOnRefresh(
  current: UnitSelectionMap,
  freshInstances: SurveyInstance[],
  autoUpdateOn: boolean,
): UnitSelectionMap {
  const next: UnitSelectionMap = {}
  const freshKeys = new Set(freshInstances.map(i => i.key))
  // (b) + (c): keep only keys still present, with their existing state.
  for (const [k, v] of Object.entries(current)) if (freshKeys.has(k)) next[k] = v
  // (a): brand-new keys get the flag-driven starting state.
  for (const i of freshInstances) {
    if (next[i.key] === undefined) next[i.key] = autoUpdateOn ? 'selected' : 'deselected'
  }
  return next
}

/**
 * Expand one course offering × its assigned template into the survey instances
 * a push would create, each checked against roleOverlapConflicts (role-grain,
 * not person-grain — see file header). Pure; recompute on any assignment/
 * selection/data change. No template → no instances (the step gates on
 * assignment before this matters). `templates` is the FULL template list (not
 * just published) — needed to look up a combined existing survey's original
 * template even if it's since been unpublished/archived.
 */
export function expandInstances(
  offering: CourseOffering,
  template: PceTemplate | null | undefined,
  surveys: PceSurvey[],
  templates: PceTemplate[] = [],
): SurveyInstance[] {
  if (!template) return []
  const mode = deliveryModeOf(offering)
  const conflicts = roleOverlapConflicts(offering, template, surveys, templates)
  const conflictByCriterion = new Map(conflicts.map(c => [c.criterion, c.existing]))
  const out: SurveyInstance[] = []
  for (const criterion of templateCriteria(template)) {
    const spec = CRITERION_BY_TYPE[mode][criterion]
    // Role not applicable to this course type (≠ a gap) — no instance.
    if (!spec) continue
    const blockedBy = conflictByCriterion.get(criterion) ?? null
    if (criterion === 'students') {
      out.push({
        key: `${offering.id}|course`,
        offeringId: offering.id,
        scope: 'course',
        criterion,
        roleLabel: '',
        personName: null,
        status: blockedBy ? 'duplicate' : 'new',
        existing: blockedBy,
        prismHref: null,
      })
      continue
    }
    // EVERY person holding the role — a role can be held by several people at
    // once (late-added co-instructor, UC2), each their own row; the conflict
    // verdict is now shared across all of them (role-grain, not person-grain).
    const single = spec.resolve(offering)
    const persons = spec.resolveAll?.(offering) ?? (single ? [single] : [])
    if (persons.length === 0) {
      out.push({
        key: `${offering.id}|${criterion}|`,
        offeringId: offering.id,
        scope: 'instructor',
        criterion,
        roleLabel: spec.label,
        personName: null,
        status: 'gap',
        existing: null,
        prismHref: prismAddHref(offering, criterion),
      })
      continue
    }
    for (const personName of persons) {
      out.push({
        key: `${offering.id}|${criterion}|${personName}`,
        offeringId: offering.id,
        scope: 'instructor',
        criterion,
        roleLabel: spec.label,
        personName,
        status: blockedBy ? 'duplicate' : 'new',
        existing: blockedBy,
        prismHref: null,
      })
    }
  }
  return out
}

/** One-line description of the open flow an instance duplicates ("Live · opened Jul 2"). */
export function existingFlowSummary(f: PceSurvey): string {
  const word = OPEN_FLOW_WORD[f.status] ?? f.status
  const opened = f.openDate ? ` · opens ${fmtYmd(f.openDate)}` : ''
  const capitalized = word.charAt(0).toUpperCase() + word.slice(1)
  return f.status === 'scheduled' ? `${capitalized}${opened}` : capitalized
}

/**
 * C. Duplicate flows — selected courses that already carry a scheduled/live
 * evaluation flow from an earlier push (matched by the survey's offeringId FK).
 * Course-grained; kept for the term-setup wizard, which still runs the merged
 * step. The push wizard resolves duplicates per-INSTANCE in its Survey design
 * step (expandInstances above) and skips them at insert.
 */
export function duplicateFlowIssues(
  offerings: CourseOffering[],
  surveys: PceSurvey[],
): CourseIssue[] {
  const openByOffering = new Map<string, PceSurvey[]>()
  for (const s of surveys) {
    if (!s.offeringId || !OPEN_FLOW_STATUSES.has(s.status)) continue
    openByOffering.set(s.offeringId, [...(openByOffering.get(s.offeringId) ?? []), s])
  }
  const out: CourseIssue[] = []
  for (const o of offerings) {
    const open = openByOffering.get(o.id)
    if (!open || open.length === 0) continue
    out.push({
      id: o.id,
      courseLabel: courseLabelOf(o),
      reasons: open.map(flowSummary),
    })
  }
  return out
}

/**
 * B. Survey-window misalignment — the survey opens MORE THAN TWO WEEKS after a
 * course ended. Opening shortly after course end is business-normal for
 * end-of-term evaluations (the standard eval window runs ~2 weeks at course
 * end), so only long gaps — where recall fades and cohorts disperse — warrant
 * an acknowledgement.
 */
const WINDOW_GAP_DAYS = 14

export function windowIssues(
  offerings: CourseOffering[],
  openDate: Date | undefined,
): CourseIssue[] {
  if (!openDate) return []
  const DAY = 86_400_000
  const out: CourseIssue[] = []
  for (const o of offerings) {
    const end = courseEndDate(o)
    if (!end) continue
    const gapDays = Math.floor((openDate.getTime() - end.getTime()) / DAY)
    if (gapDays > WINDOW_GAP_DAYS) {
      const weeks = Math.round(gapDays / 7)
      out.push({
        id: o.id,
        courseLabel: courseLabelOf(o),
        // Per-course evidence for the review disclosure: when it ended and how
        // stale the responses would be.
        reasons: [`ended ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${weeks} week${weeks !== 1 ? 's' : ''} before open`],
      })
    }
  }
  return out
}
