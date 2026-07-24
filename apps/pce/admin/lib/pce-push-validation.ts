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
  type SurveyStatus,
  MOCK_PROGRAM_TERMS,
} from './pce-mock-data'
import { courseLabelOf, prismAddHref } from './pce-course-readiness'

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

/**
 * C. Duplicate flows — selected courses that already carry a scheduled/live
 * evaluation flow from an earlier push (matched by the survey's offeringId FK).
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
