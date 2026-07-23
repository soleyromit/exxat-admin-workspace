// Evaluation results model (Flow 4 — ST-14/ST-15).
//
// A "result" is the outcome record for one course offering × one faculty
// member (Aarti 2026-06-10: the Evaluation Card key is courseOffering ×
// faculty × cohort). Results are DERIVED from surveys — display status is
// never stored (spec ST-14 "Status logic"):
//   locked ("Review Pending")      when !gradesSubmitted
//   suppressed ("Draft")           when responses < minimumThreshold
//   available ("Results Available") otherwise
// Faculty visibility additionally gates on releasedToFaculty (ST-15 gate 3) —
// that check is a separate, role-scoped gate, not part of the display status.
//
// Role mapping (spec → this app's mock): ProgramDirector (isPDOrAbove) ≙
// user.role === 'admin' · CoreFaculty ≙ user.role === 'faculty'.

import {
  MOCK_SURVEYS,
  MOCK_RESPONSES,
  MOCK_FACULTY,
  MOCK_PROGRAMS,
  type PceSurvey,
  type PceUser,
} from './pce-mock-data'

export const MINIMUM_THRESHOLD = 5

export type ResultDisplayStatus = 'locked' | 'suppressed' | 'available'

export interface EvalResult {
  /** Unique key: `${surveyId}:${facultyId}` (courseOffering × faculty). */
  id: string
  surveyId: string
  courseCode: string
  courseName: string
  term: string
  academicYear?: string
  program: string
  facultyId: string
  facultyName: string
  facultyInitials: string
  facultyEmail?: string
  enrolled: number
  responses: number
  responseRate: number
  /** Mean of section averages, null when no response record exists. */
  avgScore: number | null
  gradesSubmitted: boolean
  isSuppressed: boolean
  releasedToFaculty: boolean
  status: ResultDisplayStatus
  /** True when 2+ results share courseCode + term (multi-faculty offering). */
  coTaught: boolean
  /** Prior offerings plus this one as a single overall series (mean of course
   *  and faculty averages per term) — powers the list-card sparkline. */
  trend: { term: string; value: number }[]
  /** FK → course offering; multiple surveys may share it (split evaluations). */
  offeringId?: string
  /** 'course' | 'instructor' when the offering splits its surveys. */
  evalScope?: 'course' | 'instructor'
}

/** Display label per split-survey scope. */
export const EVAL_SCOPE_LABEL: Record<'course' | 'instructor', string> = {
  course: 'Course evaluation',
  instructor: 'Instructor evaluation',
}

/** Grouping key: real offering FK when present, else offering identity. */
export function offeringKeyOf(r: EvalResult): string {
  return r.offeringId ?? `${r.courseCode}|${r.term}|${r.facultyId}`
}

/** What THIS viewer-facing row shows a faculty member: score visible, or a
 *  gate. Mirrors the detail-page gate order (locked → suppressed → release). */
export type FacultyFacingState = 'score' | 'review-pending' | 'draft'
export function facultyFacingState(r: EvalResult): FacultyFacingState {
  if (r.status === 'locked') return 'review-pending'
  if (r.status === 'suppressed') return 'draft'
  if (!r.releasedToFaculty) return 'review-pending'
  return 'score'
}

export interface OfferingGroup {
  key: string
  courseCode: string
  courseName: string
  term: string
  academicYear?: string
  program: string
  rows: EvalResult[]
  /** 'available' | 'partial' | 'review-pending' | 'draft' for the whole offering. */
  offeringState: 'available' | 'partial' | 'review-pending' | 'draft'
}

/** Group one faculty member's results into course offerings. Single-survey
 *  offerings stay single-row groups; split offerings derive a combined state —
 *  mixed visibility → 'partial' ("Partially available"). */
export function groupByOffering(rows: EvalResult[]): OfferingGroup[] {
  const map = new Map<string, EvalResult[]>()
  for (const r of rows) {
    const k = offeringKeyOf(r)
    map.set(k, [...(map.get(k) ?? []), r])
  }
  return [...map.entries()].map(([key, group]) => {
    const states = new Set(group.map(facultyFacingState))
    const offeringState: OfferingGroup['offeringState'] =
      states.size > 1
        ? 'partial'
        : states.has('score')
          ? 'available'
          : states.has('review-pending')
            ? 'review-pending'
            : 'draft'
    // Course survey first, then instructor, then combined rows.
    const rank = { course: 0, instructor: 1 } as Record<string, number>
    const sorted = [...group].sort(
      (a, b) => (rank[a.evalScope ?? ''] ?? 2) - (rank[b.evalScope ?? ''] ?? 2),
    )
    const first = sorted[0]
    return {
      key,
      courseCode: first.courseCode,
      courseName: first.courseName,
      term: first.term,
      academicYear: first.academicYear,
      program: first.program,
      rows: sorted,
      offeringState,
    }
  })
}

/** Surveys that have finished collecting — the only ones that produce results. */
const RESULT_SURVEY_STATUSES = new Set(['pending_review', 'closed', 'released'])

function programNameFor(survey: PceSurvey): string {
  return MOCK_PROGRAMS.find((p) => p.id === survey.programId)?.name ?? MOCK_PROGRAMS[0].name
}

function avgScoreFor(surveyId: string): number | null {
  const resp = MOCK_RESPONSES.find((r) => r.surveyId === surveyId)
  if (!resp || resp.sectionScores.length === 0) return null
  return resp.sectionScores.reduce((sum, s) => sum + s.avg, 0) / resp.sectionScores.length
}

/**
 * Spec ST-14 status derivation. `gradesSubmitted` defaults to true for any
 * survey that reached review (the admin workflow submits grades before review
 * opens); an explicit `gradesSubmitted: false` on the survey models the
 * locked window between close and grade submission.
 */
export function resultGates(survey: PceSurvey): {
  gradesSubmitted: boolean
  isSuppressed: boolean
  releasedToFaculty: boolean
  status: ResultDisplayStatus
} {
  const gradesSubmitted = survey.gradesSubmitted ?? true
  const minimum = survey.minimumThreshold ?? MINIMUM_THRESHOLD
  const isSuppressed = survey.responseCount < minimum
  const releasedToFaculty = survey.status === 'released'
  const status: ResultDisplayStatus = !gradesSubmitted
    ? 'locked'
    : isSuppressed
      ? 'suppressed'
      : 'available'
  return { gradesSubmitted, isSuppressed, releasedToFaculty, status }
}

/** DS StatusBadge mapping — ST-14 spec vocabulary (Romit, 2026-07-16): list
 *  badges carry the spec's exact strings so they agree with the detail-page
 *  gate titles ("Review Pending") — one state never wears two names. */
export const RESULT_STATUS_BADGE: Record<
  ResultDisplayStatus,
  { label: string; tone: 'success' | 'warning' | 'neutral'; icon: string }
> = {
  available:  { label: 'Results Available', tone: 'success', icon: 'fa-circle-check' },
  locked:     { label: 'Review Pending',    tone: 'warning', icon: 'fa-hourglass-half' },
  suppressed: { label: 'Draft',             tone: 'neutral', icon: 'fa-pen-ruler' },
}

/** One result row per instructor of ONE survey — no status filter. Powers the
 *  in-collection full detail (live evals render real partial data, not gates). */
export function deriveResultsForSurvey(s: PceSurvey): EvalResult[] {
  const gates = resultGates(s)
  const avgScore = avgScoreFor(s.id)
  const coTaught = s.instructors.length > 1
  const priorPoints = (s.priorOfferings ?? []).map((p) => ({
    term: p.term,
    value: p.facultyAvg != null ? (p.courseAvg + p.facultyAvg) / 2 : p.courseAvg,
  }))
  const trend = avgScore != null ? [...priorPoints, { term: s.term, value: avgScore }] : priorPoints
  return s.instructors.map((i) => {
    const directory = MOCK_FACULTY.find((f) => f.id === i.id)
    return {
      id: `${s.id}:${i.id}`,
      surveyId: s.id,
      courseCode: s.courseCode,
      courseName: s.courseName,
      term: s.term,
      academicYear: s.academicYear,
      program: programNameFor(s),
      facultyId: i.id,
      facultyName: i.name,
      facultyInitials: i.initials,
      facultyEmail: directory?.email,
      enrolled: s.enrollmentCount,
      responses: s.responseCount,
      responseRate: s.responseRate,
      avgScore,
      ...gates,
      coTaught,
      trend,
      offeringId: s.offeringId,
      evalScope: s.evalScope,
    }
  })
}

/** Mean available score per program — the list-card benchmark tick. */
export function programScoreBenchmarks(results: EvalResult[]): Map<string, number> {
  const acc = new Map<string, { sum: number; n: number }>()
  for (const r of results) {
    if (r.status !== 'available' || r.avgScore == null) continue
    const cur = acc.get(r.program) ?? { sum: 0, n: 0 }
    acc.set(r.program, { sum: cur.sum + r.avgScore, n: cur.n + 1 })
  }
  return new Map([...acc].map(([program, v]) => [program, v.sum / v.n]))
}

/** One result per (finished survey × instructor). */
export function deriveResults(surveys: PceSurvey[] = MOCK_SURVEYS): EvalResult[] {
  const rows = surveys
    .filter((s) => RESULT_SURVEY_STATUSES.has(s.status))
    .filter((s) => !s.surveyType || s.surveyType === 'course_evaluation')
    .flatMap(deriveResultsForSurvey)

  // Co-taught: 2+ DISTINCT faculty share courseCode + term (spec ST-14).
  // Counting rows would false-positive on split-survey offerings, where one
  // instructor produces multiple rows for the same course + term.
  const byOffering = new Map<string, Set<string>>()
  for (const r of rows) {
    const k = `${r.courseCode}|${r.term}`
    const set = byOffering.get(k) ?? new Set<string>()
    set.add(r.facultyId)
    byOffering.set(k, set)
  }
  return rows.map((r) => ({ ...r, coTaught: (byOffering.get(`${r.courseCode}|${r.term}`)?.size ?? 0) > 1 }))
}

/** ST-14 scoping: PD sees the program table; faculty see only their own rows. */
export function resultsForUser(user: PceUser, results: EvalResult[]): EvalResult[] {
  if (user.role === 'admin') return results
  if (user.role === 'faculty') {
    return results.filter((r) => (user.facultyId ? r.facultyId === user.facultyId : false))
  }
  return []
}

/** Response-rate text color — two tiers, no red (aarti_no_red): the spec's
 *  amber/red split below 70% collapses into a single amber tier. */
export function rateColor(pct: number): string {
  return pct >= 70 ? 'var(--chart-2)' : 'var(--chip-4)'
}

/** Score text color (spec thresholds 4.2 / 3.7; amber replaces the spec's red).
 *  Mid tier is neutral --foreground: brand pink fails AA on --muted (4.46:1),
 *  and brand is reserved for CTAs, not data (feedback_neutral_colors_active_states). */
export function scoreColor(avg: number): string {
  return avg >= 4.2 ? 'var(--chart-2)' : avg >= 3.7 ? 'var(--foreground)' : 'var(--chip-4)'
}
