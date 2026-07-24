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
  CRITERION_BY_TYPE,
  courseLabelOf,
  prismAddHref,
  templateCriteria,
} from './pce-course-readiness'

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

// ── Survey instances (the Survey design step's row grain) ────────────────────
// A push doesn't create "a survey per course" — it creates one survey INSTANCE
// per (course offering × evaluatee), where the evaluatees are what the assigned
// template demands: one course-material instance, plus one per faculty role the
// template evaluates × the person staffed in that role. Duplicates are defined
// at THIS grain (engineering feedback, Jul 2026): the composite key is
// offering + role + person — a second Instructor survey for the same person is
// a duplicate; the same person under a different role is not; a new person
// under an already-surveyed role is not.

export type InstanceStatus = 'new' | 'duplicate' | 'gap'

export interface SurveyInstance {
  /** `offeringId|criterion|person` — the composite identity duplicates key on.
   *  Person rides the NAME: the mock readiness resolvers return names, not ids
   *  (see CRITERION_BY_TYPE); swap to personId when real association data lands. */
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
  /** The open flow this instance would duplicate (status 'duplicate' only). */
  existing: PceSurvey | null
  /** New-tab Prism deep-link to staff the missing role (status 'gap' only). */
  prismHref: string | null
}

/** Does an existing flow cover this prospective instance's composite key? */
function coversInstance(
  s: PceSurvey,
  offeringId: string,
  scope: 'course' | 'instructor',
  criterion: Criterion,
  personName: string | null,
): boolean {
  if (s.offeringId !== offeringId || !OPEN_FLOW_STATUSES.has(s.status)) return false
  if (scope === 'course') {
    // Course material is covered by a course-scope flow or a combined flow
    // (evalScope undefined = the pre-split shape that evaluated everything).
    return s.evalScope !== 'instructor'
  }
  if (s.evalScope === 'course') return false
  if (s.evalRole) {
    // Role-stamped flows (created after the split) match the full key.
    return s.evalRole === criterion && s.instructors.some(p => p.name === personName)
  }
  // Legacy flows carry no role. A person-only match can only vouch for the
  // 'instructor' criterion (the role those flows were pushed for) — the same
  // person under a DIFFERENT role is a genuinely new combination, not a dup.
  return criterion === 'instructor' && s.instructors.some(p => p.name === personName)
}

/**
 * Expand one course offering × its assigned template into the survey instances
 * a push would create, each checked against the existing flows. Pure; recompute
 * on any assignment/selection/data change. No template → no instances (the
 * step gates on assignment before this matters).
 */
export function expandInstances(
  offering: CourseOffering,
  template: PceTemplate | null | undefined,
  surveys: PceSurvey[],
): SurveyInstance[] {
  if (!template) return []
  const mode = deliveryModeOf(offering)
  const out: SurveyInstance[] = []
  for (const criterion of templateCriteria(template)) {
    const spec = CRITERION_BY_TYPE[mode][criterion]
    // Role not applicable to this course type (≠ a gap) — no instance.
    if (!spec) continue
    if (criterion === 'students') {
      const existing = surveys.find(s =>
        coversInstance(s, offering.id, 'course', criterion, null)) ?? null
      out.push({
        key: `${offering.id}|course`,
        offeringId: offering.id,
        scope: 'course',
        criterion,
        roleLabel: '',
        personName: null,
        status: existing ? 'duplicate' : 'new',
        existing,
        prismHref: null,
      })
      continue
    }
    const personName = spec.resolve(offering)
    if (!personName) {
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
    const existing = surveys.find(s =>
      coversInstance(s, offering.id, 'instructor', criterion, personName)) ?? null
    out.push({
      key: `${offering.id}|${criterion}|${personName}`,
      offeringId: offering.id,
      scope: 'instructor',
      criterion,
      roleLabel: spec.label,
      personName,
      status: existing ? 'duplicate' : 'new',
      existing,
      prismHref: null,
    })
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
 * B. Survey-window misalignment — the survey opens after a course has already
 * ended (students would be asked to evaluate a course that's over).
 */
export function windowIssues(
  offerings: CourseOffering[],
  openDate: Date | undefined,
): CourseIssue[] {
  if (!openDate) return []
  const out: CourseIssue[] = []
  for (const o of offerings) {
    const end = courseEndDate(o)
    if (!end) continue
    if (openDate.getTime() > end.getTime()) {
      out.push({
        id: o.id,
        courseLabel: courseLabelOf(o),
        reasons: ['survey opens after the course has already ended'],
        prismHref: prismAddHref(o, 'students'),
      })
    }
  }
  return out
}
