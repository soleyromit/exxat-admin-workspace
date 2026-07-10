// ============================================================================
// Term readiness audit — Setup Term capability (spec ①)
// Source: Granola "Course Eval sync up" Jun 25 2026 → docs/specs/2026-06-28-course-eval-design-updates-spec.md §2①
//
// When an admin configures a term, the system discovers that term's course
// offerings and audits each for the faculty roles the program evaluates.
// Missing data (no coordinator / no instructor / no students) blocks a clean
// push — but the admin can override with a soft warning. Framed as "Add data"
// (positive), never "Fix" (per product, Jun 25).
//
// V0: roles-to-evaluate are hardcoded here. They move to Settings (spec ④);
// when ④ ships, EVAL_ROLES becomes a settings read. The audit only flags roles
// the program actually evaluates — e.g. if a school does not evaluate
// instructors, a missing instructor is NOT a gap.
// ============================================================================

import {
  MOCK_COURSE_OFFERINGS,
  MOCK_MASTER_COURSES,
  type CourseOffering,
} from '@/lib/pce-mock-data'

/** A faculty role the program chooses to evaluate (drives which gaps count). */
export type EvalRole = 'course_coordinator' | 'instructor'

/** Default roles to evaluate — hardcoded until Settings (spec ④) owns this. */
export const DEFAULT_EVAL_ROLES: EvalRole[] = ['course_coordinator', 'instructor']

export type GapType = 'coordinator' | 'instructor' | 'students'

export interface ReadinessGap {
  type: GapType
  /** Human label used in the "needs data" chip + Add-data target. */
  label: string
}

export interface OfferingReadiness {
  offeringId: string
  courseCode: string
  courseName: string
  cohort: string
  enrolledCount: number
  /** Empty = ready. One entry per missing, evaluated role. */
  gaps: ReadinessGap[]
}

export interface TermReadiness {
  total: number
  ready: number
  needsData: number
  /** All offerings, ready first removed by the UI as needed. */
  offerings: OfferingReadiness[]
}

const COURSE_BY_ID = new Map(MOCK_MASTER_COURSES.map((c) => [c.id, c]))

/**
 * Audit one offering against the evaluated roles.
 * - coordinator gap  → no primary faculty assigned (primaryFacultyId empty)
 * - instructor gap   → no collaborating instructors assigned
 * - students gap     → roster empty (cannot distribute)
 * Student presence is always required (no one to survey otherwise); faculty-role
 * gaps only count when that role is in `roles`.
 */
export function auditOffering(
  offering: CourseOffering,
  roles: EvalRole[] = DEFAULT_EVAL_ROLES,
): OfferingReadiness {
  const course = COURSE_BY_ID.get(offering.masterCourseId)
  const gaps: ReadinessGap[] = []

  if (roles.includes('course_coordinator') && !offering.primaryFacultyId) {
    gaps.push({ type: 'coordinator', label: 'Course Coordinator' })
  }
  if (roles.includes('instructor') && offering.collaboratorIds.length === 0) {
    gaps.push({ type: 'instructor', label: 'Instructor' })
  }
  if (offering.enrolledCount === 0) {
    gaps.push({ type: 'students', label: 'Students' })
  }

  return {
    offeringId: offering.id,
    courseCode: course?.code ?? offering.masterCourseId,
    courseName: course?.name ?? 'Unknown course',
    cohort: offering.cohort,
    enrolledCount: offering.enrolledCount,
    gaps,
  }
}

/** Audit every offering in a term; returns coverage counts + per-offering gaps. */
export function auditTerm(
  termId: string,
  roles: EvalRole[] = DEFAULT_EVAL_ROLES,
): TermReadiness {
  const offerings = MOCK_COURSE_OFFERINGS.filter((o) => o.termId === termId).map(
    (o) => auditOffering(o, roles),
  )
  const needsData = offerings.filter((o) => o.gaps.length > 0).length
  return {
    total: offerings.length,
    ready: offerings.length - needsData,
    needsData,
    offerings,
  }
}
