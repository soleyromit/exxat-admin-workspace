/**
 * pce-faculty — scoping + policy for the faculty view (V2 tier, personas.md).
 *
 * This is the ONLY place that answers "what may this faculty member see/do?".
 * Everything here encodes a sourced decision; do not relax without one.
 *
 * Sourced constraints:
 * - Faculty see ONLY their own assigned courses (pce-ui-patterns.md §9). In the
 *   real product this is a SERVER-side filter — the client filter below is a
 *   prototype stand-in, never the enforcement point.
 * - Faculty NEVER see results until an admin releases them (Apr 21 transcript:
 *   "faculty access only after admin approval"). Closed ≠ visible.
 * - Faculty DO see the live response rate while a survey is open (Apr 21, David:
 *   "only 30 of your students have responded and this closes in two days …
 *   remind your students") — that is the whole point of the live group.
 * - Drafts are admin-only: a draft has not been pushed, so it does not exist to
 *   a faculty member.
 * - Extension is COORDINATOR-tier, not every instructor (approved copy:
 *   "Coordinator can extend the survey window if appropriate"), bounded by the
 *   result-release date so results can never release before collection ends.
 */

import {
  EVAL_DATE_RULES,
  MOCK_PROGRAM_TERMS,
  type PceSurvey,
} from './pce-mock-data'
import { LIVE, IN_REVIEW } from './pce-term-metrics'

/* ── Policy ────────────────────────────────────────────────────────────────
 * Shaped like the admin Settings → Schedule & release section that owns it.
 * Aarti's governing rule (2026-05-05): "the moment we build these hard rules
 * ourselves, we are putting ourselves in a tight spot" — so this is a
 * tenant-configurable value, not a constant baked into the component tree.
 *
 * `enabled` would ship DEFAULT OFF (restrictive default). It is seeded true
 * here so the surface is demonstrable in the prototype — the toggle itself is
 * the deliverable for Settings, not this file.
 */
export const FACULTY_EXTENSION_POLICY = {
  enabled: true,
  /** Only the course coordinator (instructor role 'primary') may extend. */
  coordinatorOnly: true,
  /** Max days a faculty member may push the close date past its current value. */
  maxDays: 7,
}

/** A faculty member's role on ONE offering — from course associations, not rank
 *  (2026-05-19: "roles pulled from existing course associations, not faculty ranks"). */
export type FacultyCourseRole = 'coordinator' | 'instructor' | null

export function myRoleOn(survey: PceSurvey, facultyId: string): FacultyCourseRole {
  const me = survey.instructors.find((i) => i.id === facultyId)
  if (!me) return null
  return me.role === 'primary' ? 'coordinator' : 'instructor'
}

/* ── Scoping ──────────────────────────────────────────────────────────────── */

/** Surveys this faculty member teaches. Drafts excluded — not yet pushed. */
export function mySurveys(surveys: PceSurvey[], facultyId: string): PceSurvey[] {
  return surveys.filter(
    (s) => s.status !== 'draft' && s.instructors.some((i) => i.id === facultyId),
  )
}

/* ── Lifecycle grouping ───────────────────────────────────────────────────
 * The faculty home's four buckets, straight from the Apr 21 prototype walk-through
 * ("Active surveys, inactive surveys, closed surveys") plus the release gate.
 * Labels are the settled faculty-side wording — NOT the admin wording:
 *   admin says "Released to faculty" · faculty says "Results available"
 *   (May 28: "Results available makes sense for a faculty view").
 * "Pending admin release" replaces the rejected grade language (Apr 21, Vishaka:
 * "just something like pending admin release covers most of the use cases").
 */
export type FacultyGroup = 'live' | 'scheduled' | 'pending_release' | 'results'

export const FACULTY_GROUP_ORDER: FacultyGroup[] = [
  'live',
  'pending_release',
  'results',
  'scheduled',
]

export const FACULTY_GROUP_LABEL: Record<FacultyGroup, string> = {
  live: 'Collecting',
  pending_release: 'Pending admin release',
  results: 'Results available',
  scheduled: 'Scheduled',
}

export function groupOf(s: PceSurvey): FacultyGroup {
  if (LIVE(s)) return 'live'
  if (s.status === 'released') return 'results'
  if (IN_REVIEW(s)) return 'pending_release'
  return 'scheduled'
}

/* ── Dates ────────────────────────────────────────────────────────────────── */

function isoToDate(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Parse the display deadline ("Apr 29, 2026"). Returns null when unparseable —
 *  callers must treat null as "no ceiling known" and refuse the action. */
export function parseDeadline(deadline: string | undefined): Date | null {
  if (!deadline) return null
  const t = Date.parse(deadline)
  if (Number.isNaN(t)) return null
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Hard ceiling for any extension of this survey = the term's result-release
 * date (term end + EVAL_DATE_RULES.releaseOffset). Past that, results would
 * release while collection is still open.
 */
export function extensionCeiling(survey: PceSurvey): Date | null {
  const term = MOCK_PROGRAM_TERMS.find((t) => t.name === survey.term)
  if (!term?.endDate) return null
  const ceiling = isoToDate(term.endDate)
  ceiling.setDate(ceiling.getDate() + EVAL_DATE_RULES.releaseOffset)
  return ceiling
}

/**
 * The furthest a faculty member may push this close date: whichever of the
 * policy window and the release-date ceiling comes FIRST — and WHICH one it was.
 *
 * The `reason` matters: the two bounds have different explanations, and a
 * hardcoded "results are released on this date" is simply false whenever the
 * policy window is the binding constraint. Copy has to follow the actual bound.
 */
export type ExtensionBound = { date: Date; reason: 'policy' | 'release' }

export function facultyExtensionBound(survey: PceSurvey): ExtensionBound | null {
  const ceiling = extensionCeiling(survey)
  const current = parseDeadline(survey.deadline)
  if (!current) return ceiling ? { date: ceiling, reason: 'release' } : null
  const policyMax = new Date(current)
  policyMax.setDate(policyMax.getDate() + FACULTY_EXTENSION_POLICY.maxDays)
  if (!ceiling) return { date: policyMax, reason: 'policy' }
  return policyMax < ceiling
    ? { date: policyMax, reason: 'policy' }
    : { date: ceiling, reason: 'release' }
}

export const EXTENSION_BOUND_COPY: Record<ExtensionBound['reason'], string> = {
  policy: `the most your program lets you add (${FACULTY_EXTENSION_POLICY.maxDays} days)`,
  release: 'results are released to you on this date',
}

/** Convenience for callers that only need the date. */
export function facultyExtensionMax(survey: PceSurvey): Date | null {
  return facultyExtensionBound(survey)?.date ?? null
}

/** Why an extension is unavailable — drives the disabled-reason copy. */
export type ExtendDenial =
  | 'not-live'
  | 'not-coordinator'
  | 'disabled-by-program'
  | 'no-runway'

export function extendDenial(
  survey: PceSurvey,
  facultyId: string,
): ExtendDenial | null {
  if (!FACULTY_EXTENSION_POLICY.enabled) return 'disabled-by-program'
  if (!LIVE(survey)) return 'not-live'
  if (
    FACULTY_EXTENSION_POLICY.coordinatorOnly &&
    myRoleOn(survey, facultyId) !== 'coordinator'
  ) {
    return 'not-coordinator'
  }
  const max = facultyExtensionMax(survey)
  const current = parseDeadline(survey.deadline)
  if (!max || !current || max <= current) return 'no-runway'
  return null
}

export function canExtend(survey: PceSurvey, facultyId: string): boolean {
  return extendDenial(survey, facultyId) === null
}

export const EXTEND_DENIAL_COPY: Record<ExtendDenial, string> = {
  'not-live': 'This survey is no longer collecting responses.',
  'not-coordinator':
    'Only the course coordinator can change this course’s close date.',
  'disabled-by-program':
    'Your program does not allow faculty to change evaluation dates.',
  'no-runway':
    'This survey already closes on the last date results can still be released.',
}

/* ── Distribution ─────────────────────────────────────────────────────────
 * Aarti locked post-course evaluation to ONE channel (Jun 9): "post course
 * evaluation will only have one channel, which is via exact Prism", because
 * "we don't want the same student taking the same survey for the same course
 * twice". A QR code is therefore only legitimate if it encodes the SAME
 * Prism-authenticated deep link — it is a rendering of that one channel, not a
 * second one. It must NEVER be an unauthenticated/public form URL, which is
 * exactly the "anonymous link" that decision removed.
 *
 * (Vocabulary trap: "anonymous link" there means UNAUTHENTICATED. Responses are
 * always anonymous regardless — see the anonymity contract in pce-results.)
 */
export const PRISM_EVAL_BASE = 'https://prism.exxat.com/e'

export function surveyPrismUrl(survey: PceSurvey): string {
  return `${PRISM_EVAL_BASE}/${survey.id}`
}

/* ── Faculty-side result status ───────────────────────────────────────────
 * `resultGates()` (lib/pce-results) derives status from grade + suppression and
 * COMPUTES `releasedToFaculty` but never applies it to `status`. That is fine
 * for the admin table — an admin legitimately sees results before release (the
 * PD aggregate view is explicitly allowed to). It is wrong for FACULTY, who by
 * the release gate cannot see anything until an admin releases: a closed-but-
 * unreleased survey rendered as "Available" in the faculty list, while the
 * detail page it links to correctly says "Review Pending", and My Surveys says
 * "Pending admin release". One state, three names.
 *
 * This corrects the label on the FACULTY side only. It deliberately does not
 * touch resultGates, because changing shared ST-14 gating would silently
 * re-label the admin table too — a decision that isn't mine to make here.
 */
export function facultyResultStatus<
  T extends { status: string; releasedToFaculty: boolean },
>(r: T): 'available' | 'locked' | 'suppressed' {
  if (r.status === 'suppressed') return 'suppressed'
  if (!r.releasedToFaculty) return 'locked'
  return r.status === 'available' ? 'available' : 'locked'
}

/* ── Route scope ──────────────────────────────────────────────────────────
 * The routes a faculty member may be ON. Persisting the role made this matter:
 * before, the role only changed via a click that also redirected, so an
 * admin-route + faculty-role state was unreachable. With the role restored from
 * storage on mount, a refresh on any admin URL would render the faculty nav over
 * admin content — faculty nav, admin data. This list is what the guard allows.
 *
 * This is prototype navigation hygiene, NOT authorisation. Real scoping is a
 * server-side filter (pce-ui-patterns §9: "UI hide/show is NOT sufficient").
 */
export const FACULTY_ROUTE_PREFIXES = [
  '/my-surveys',
  '/my-dashboard',
  '/my-analytics',
  '/results',
  '/settings',
  '/help',
]

export const FACULTY_HOME = '/my-surveys'

export function isFacultyRoute(pathname: string): boolean {
  return FACULTY_ROUTE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )
}
