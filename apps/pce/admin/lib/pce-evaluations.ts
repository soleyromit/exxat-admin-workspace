// ============================================================================
// Per-evaluation-type resolution (Romit, 2026-07-17).
//
// A course offering is set up with several EVALUATION TYPES — Course Material,
// Faculty and other roles, General — and each runs on its OWN clock, so one
// offering can carry three different statuses at once. `evaluationsFor()` is
// the single source of truth for that breakdown:
//   1. an offering's explicit `survey.evaluations` (real setup data), else
//   2. a demo OVERRIDE that shows divergent statuses on the seeded term, else
//   3. a derived 3-type split from the offering-level roll-up (so EVERY offering
//      shows the structure, uniform until real per-type data exists).
//
// The offering-level `status`/`responseCount` on PceSurvey stay untouched as the
// roll-up — KPIs, the board, and /results read those and are unaffected.
// ============================================================================

import {
  EVALUATION_TYPE_ORDER,
  type EvaluationInstance,
  type EvaluationType,
  type PceSurvey,
  type SurveyStatus,
} from '@/lib/pce-mock-data'

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)))
}

function inst(
  type: EvaluationType,
  status: SurveyStatus,
  enrollmentCount: number,
  responseRate: number,
  deadline: string,
): EvaluationInstance {
  const rate = status === 'scheduled' || status === 'draft' ? 0 : clamp(responseRate)
  return {
    type,
    status,
    responseRate: rate,
    responseCount: Math.round((enrollmentCount * rate) / 100),
    enrollmentCount,
    deadline,
  }
}

/* Seeded divergence for the Spring 2026 term so the per-type UI has something to
 * show. Each offering demonstrates a distinct combination of the cases:
 *   s1 — one closed/in-review · one live behind target · one not yet open
 *   s2 — one released · one in review · one live
 *   s3 — two live at different rates · one still in draft (not pushed)         */
const OVERRIDES: Record<string, EvaluationInstance[]> = {
  s1: [
    inst('course_material', 'pending_review', 50, 92, 'Apr 30, 2026'),
    inst('faculty_roles',   'active',         50, 61, 'May 7, 2026'),
  ],
  s2: [
    inst('course_material', 'released',       48, 88, 'Apr 18, 2026'),
    inst('faculty_roles',   'pending_review', 48, 79, 'Apr 25, 2026'),
  ],
  s3: [
    inst('course_material', 'active',         46, 57, 'May 5, 2026'),
    inst('faculty_roles',   'collecting',     46, 39, 'May 5, 2026'),
  ],
  // Fall 2026 split flows (pce-mock-data pf1–pf3): each flow IS a single
  // evaluation type — instructor-only or course-only — so deriving both types
  // from the roll-up would resurrect the half the flow deliberately excludes.
  pf1: [inst('faculty_roles',   'scheduled', 44, 0, 'Oct 23, 2026')],
  pf2: [inst('faculty_roles',   'scheduled', 44, 0, 'Dec 4, 2026')],
  pf3: [inst('course_material', 'scheduled', 14, 0, 'Dec 18, 2026')],
}

const ORDER_INDEX: Record<EvaluationType, number> = Object.fromEntries(
  EVALUATION_TYPE_ORDER.map((t, i) => [t, i]),
) as Record<EvaluationType, number>

function ordered(list: EvaluationInstance[]): EvaluationInstance[] {
  return [...list].sort((a, b) => ORDER_INDEX[a.type] - ORDER_INDEX[b.type])
}

/* When there's no explicit or seeded breakdown, split the offering-level roll-up
 * into the three types. Same lifecycle, mild deterministic response variation so
 * the rows read as real (Faculty tends to lag Course Material). */
function derive(s: PceSurvey): EvaluationInstance[] {
  const deadline = s.deadline
  const enroll = s.enrollmentCount
  return [
    inst('course_material', s.status, enroll, s.responseRate,     deadline),
    inst('faculty_roles',   s.status, enroll, s.responseRate - 7, deadline),
  ]
}

/** The 3 evaluation-type instances for an offering, always in canonical order. */
export function evaluationsFor(s: PceSurvey): EvaluationInstance[] {
  if (s.evaluations?.length) return ordered(s.evaluations)
  if (OVERRIDES[s.id]) return ordered(OVERRIDES[s.id])
  return derive(s)
}
