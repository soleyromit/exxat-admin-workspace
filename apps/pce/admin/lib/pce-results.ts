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

/** DS StatusBadge mapping — unified vocabulary (2026-07-08): the spec's
 *  "Review Pending"/"Results Available" strings collapse into the same set the
 *  hub and dashboard use, so one state never wears three names. */
export const RESULT_STATUS_BADGE: Record<
  ResultDisplayStatus,
  { label: string; tone: 'success' | 'warning' | 'neutral'; icon: string }
> = {
  available:  { label: 'Available', tone: 'success', icon: 'fa-circle-check' },
  locked:     { label: 'In review', tone: 'warning', icon: 'fa-hourglass-half' },
  suppressed: { label: 'Draft',     tone: 'neutral', icon: 'fa-pen-ruler' },
}

/** One result row per instructor of ONE survey — no status filter. Powers the
 *  in-collection full detail (live evals render real partial data, not gates). */
export function deriveResultsForSurvey(s: PceSurvey): EvalResult[] {
  const gates = resultGates(s)
  const avgScore = avgScoreFor(s.id)
  const coTaught = s.instructors.length > 1
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
    }
  })
}

/** One result per (finished survey × instructor). */
export function deriveResults(surveys: PceSurvey[] = MOCK_SURVEYS): EvalResult[] {
  const rows = surveys
    .filter((s) => RESULT_SURVEY_STATUSES.has(s.status))
    .filter((s) => !s.surveyType || s.surveyType === 'course_evaluation')
    .flatMap(deriveResultsForSurvey)

  // Co-taught: 2+ results share courseCode + term (spec ST-14).
  const byOffering = new Map<string, number>()
  for (const r of rows) {
    const k = `${r.courseCode}|${r.term}`
    byOffering.set(k, (byOffering.get(k) ?? 0) + 1)
  }
  return rows.map((r) => ({ ...r, coTaught: (byOffering.get(`${r.courseCode}|${r.term}`) ?? 0) > 1 }))
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

/** Mean of the scored results, or null when nothing has a score yet. */
function meanScore(results: EvalResult[]): number | null {
  const scored = results.filter((r): r is EvalResult & { avgScore: number } => r.avgScore !== null)
  if (scored.length === 0) return null
  return scored.reduce((sum, r) => sum + r.avgScore, 0) / scored.length
}

export interface FacultyBenchmarks {
  /** The faculty member's own mean score across their results. */
  score: number | null
  /**
   * Mean across every faculty in `program` ("department average").
   * Null when the comparison would be degenerate — see `facultyBenchmarks`.
   */
  deptAvg: number | null
  /** Mean across every faculty in every program ("university average"). */
  universityAvg: number | null
  /**
   * Program the department average is scoped to — the faculty's PRIMARY program
   * (where they have the most scored results), not an arbitrary first hit.
   * Null when the faculty has no results.
   */
  program: string | null
  /** Distinct faculty with scored results in `program`, including this one. */
  deptFacultyCount: number
  /** Results that fed `score`. Callers use this for the n-of-total disclosure. */
  sampleSize: number
}

/**
 * Score + the two nested benchmarks behind `ScoreBullet` (VIZ-PATTERN-003).
 *
 * This is the percentile substitute. `course-evaluation.md` §7.3 bans
 * peer-comparison metrics faculty-side ("'you're at the 60th percentile' …
 * reverse-encodes peer rank"), while §7.3 explicitly ALLOWS "department average,
 * university average, threshold" — and Aarti validated exactly this framing (A5).
 * So these two averages are safe in both the admin lens and the faculty
 * self-view; a percentile would not be.
 *
 * Suppressed results are intentionally INCLUDED: N=5 suppression governs whether
 * an individual result is shown, not whether it feeds an aggregate — the PD
 * aggregate view sees data the faculty self-view suppresses.
 *
 * NOTE: unweighted mean. The enrollment-weighted vs simple-mean question is open
 * with Aarti (`2026-06-22-evaluations-dashboard-consolidation.md` §4) and blocks
 * any RANKING. It does not block this: a bullet states one score against two
 * averages, it does not order people. If the weighting decision lands, change it
 * here and both the bullet and its callers follow.
 */
export function facultyBenchmarks(
  results: EvalResult[],
  facultyId: string,
): FacultyBenchmarks {
  const own = results.filter((r) => r.facultyId === facultyId)

  // Faculty can teach across programs — MOCK_FACULTY has one in both DPT and
  // PharmD — so `own[0].program` would make the department average depend on
  // array order. Scope to the PRIMARY program: most scored results, with an
  // alphabetical tie-break so the result is deterministic.
  const scoredOwn = own.filter((r) => r.avgScore !== null)
  const perProgram = new Map<string, number>()
  for (const r of scoredOwn) perProgram.set(r.program, (perProgram.get(r.program) ?? 0) + 1)
  const program =
    [...perProgram.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ??
    own[0]?.program ??
    null

  const deptResults = program === null ? [] : results.filter((r) => r.program === program)
  const deptFacultyCount = new Set(
    deptResults.filter((r) => r.avgScore !== null).map((r) => r.facultyId),
  ).size

  // A "department average" drawn from this person alone is not a comparison —
  // it is their own score wearing a benchmark's clothes, and on a surface
  // governed by §7.3 that is actively misleading. Withhold it; the caller hides
  // the marker and falls back to the university average.
  const deptAvg = deptFacultyCount >= 2 ? meanScore(deptResults) : null

  return {
    score: meanScore(own),
    deptAvg,
    universityAvg: meanScore(results),
    program,
    deptFacultyCount,
    sampleSize: scoredOwn.length,
  }
}
