// ============================================================================
// Demo accounts — one program-account per dashboard term-card SCENARIO.
//
// The PCE prototype has a single implicit user. To exercise every term-card
// edge state WITHOUT cramming contradictory data into one account, each
// scenario is its own selectable demo account — pick one, see exactly ONE
// case, nothing else competing for attention on the dashboard. The sidebar
// user menu switches between them; the choice persists to localStorage.
//
// A module-level "active account" register feeds the term helpers
// (pce-term-metrics / pce-term-readiness) so the derived current/last/upcoming
// classification follows the switched account. The DEFAULT account reuses the
// full mock verbatim, so the default experience is byte-for-byte unchanged.
//
// Mapped 1:1 to the Aug 19 2026 dashboard feedback's numbered cases (Romit) —
// each account's blurb cites its case number. Four scenario accounts that
// used to exist here (Harbor DPT / Metro DPT / Valley PT / Delta OT) tested
// "is there a Last/Current/Upcoming term at all" under the OLD single-
// current-term model, where that was a real branch in the selection logic.
// Under the current `classifyTermWindow()` date-math model (see
// pce-term-metrics.ts) that's no longer a distinct code path — any term's
// column placement is just its dates relative to today — so those four were
// retired rather than kept as dead weight in the switcher.
// ============================================================================

import {
  MOCK_PROGRAM_TERMS,
  MOCK_COURSE_OFFERINGS,
  MOCK_SURVEYS,
  type ProgramTerm,
  type CourseOffering,
  type PceSurvey,
  type PceTemplate,
  type SurveyStatus,
} from '@/lib/pce-mock-data'

export interface DemoAccount {
  id: string
  /** Program-flavoured label shown in the switcher. */
  name: string
  /** One-line scenario description — cites the feedback doc's Case N where one applies. */
  blurb: string
  terms: ProgramTerm[]
  offerings: CourseOffering[]
  surveys: PceSurvey[]
  /** Survey templates — omit for the full mock catalog; [] = none created yet
   *  (drives the dashboard's "Create template" CTA). */
  templates?: PceTemplate[]
}

/* ── reusable terms pulled from the full mock ─────────────────────────────── */
const SPRING26 = MOCK_PROGRAM_TERMS.find((t) => t.id === 'pt1')! // current, window open
const FALL26 = MOCK_PROGRAM_TERMS.find((t) => t.id === 'pt5')! // upcoming (dated)

/* Case 2 (Lakeside OT) — "term set up, dates entered, zero courses." Was a
 * DATELESS term (the old, since-repurposed Case 2 shape) until the Aug 19
 * feedback explicitly renamed this scenario: dates are mandatory at setup
 * now, so the demo has to actually carry them. */
const CASE2_TERM: ProgramTerm = {
  id: 'case2-term',
  name: 'Fall 2026',
  season: 'Fall',
  academicYear: '2026–2027',
  startDate: '2026-08-10',
  endDate: '2026-11-20',
  status: 'active',
  enabledForEval: true,
}

/* Case 3 (Summit PA) — dated, HAS course offerings, zero evaluations. Was
 * zero-offerings (the old Case 3 shape, now what Case 2 means) — offerings
 * are added below via CASE3_COURSES; this term carries no surveys. */
const CASE3_TERM: ProgramTerm = {
  id: 'case3-term',
  name: 'Summer 2026',
  season: 'Summer',
  academicYear: '2025–2026',
  startDate: '2026-06-01',
  endDate: '2026-08-15',
  status: 'active',
  enabledForEval: true,
}

/* ── Breakdown Mode (Cases 4-9) — one isolated term per case ──────────────────
 * Each case is its own account with exactly one term, so switching accounts
 * shows exactly the one bucket mix the case describes — never several cases'
 * worth of terms competing on the same dashboard. */
function caseTerm(id: string, name: string, academicYear: string, startDate: string, endDate: string): ProgramTerm {
  return { id, name, season: name.split(' ')[0] as ProgramTerm['season'], academicYear, startDate, endDate, status: 'active', enabledForEval: true }
}

interface CaseCourseSpec {
  masterCourseId: string
  code: string
  name: string
  courseType: 'didactic' | 'clinical'
  /** 'none' = no survey row at all — the not-configured bucket. */
  status: 'none' | SurveyStatus
  responseRate?: number
  enrollmentCount?: number
  responseCount?: number
  /** Scheduled only — ISO date it opens. */
  openDate?: string
  /** Live/closed/released — human-readable close date, matches PceSurvey.deadline's format. */
  deadline?: string
}

/** Builds a term's offerings + surveys from a flat course-status list — the
 *  shared factory behind every Case 4-9 account below, so each one is a
 *  five-line table of "what bucket is this course in" instead of hand-typed
 *  offering/survey objects six times over. */
function buildCaseTermData(term: ProgramTerm, courses: CaseCourseSpec[]): { offerings: CourseOffering[]; surveys: PceSurvey[] } {
  const offerings: CourseOffering[] = []
  const surveys: PceSurvey[] = []
  courses.forEach((c, i) => {
    offerings.push({
      id: `${term.id}-off${i}`,
      masterCourseId: c.masterCourseId,
      termId: term.id,
      cohort: 'Class of 2027',
      primaryFacultyId: 'f1',
      collaboratorIds: [],
      enrolledCount: c.enrollmentCount ?? 40,
      status: 'active',
      courseType: c.courseType,
    })
    if (c.status === 'none') return
    surveys.push({
      id: `${term.id}-s${i}`,
      courseCode: c.code,
      courseName: c.name,
      term: term.name,
      courseType: c.courseType,
      templateId: 'tmpl1',
      status: c.status,
      instructors: [{ id: 'f1', name: 'Dr. Anita Patel', initials: 'AP', role: 'primary' }],
      responseRate: c.responseRate ?? 0,
      responseCount: c.responseCount ?? 0,
      enrollmentCount: c.enrollmentCount ?? 40,
      deadline: c.deadline ?? '',
      createdAt: 'Aug 1, 2026',
      surveyType: 'course_evaluation',
      openDate: c.openDate,
      academicYear: term.academicYear,
      programId: 'prog1',
    })
  })
  return { offerings, surveys }
}

const CASE3 = buildCaseTermData(CASE3_TERM, [
  { masterCourseId: 'mc1', code: 'DPT-501', name: 'Human Anatomy & Kinesiology', courseType: 'didactic', status: 'none' },
  { masterCourseId: 'mc2', code: 'DPT-502', name: 'Physiology & Pathophysiology', courseType: 'didactic', status: 'none' },
  { masterCourseId: 'mc5', code: 'DPT-505', name: 'Biomechanics I', courseType: 'didactic', status: 'none' },
  { masterCourseId: 'mc9', code: 'DPT-530', name: 'Therapeutic Exercise', courseType: 'didactic', status: 'none' },
])

const CASE4_TERM = caseTerm('case4-term', 'Fall 2026', '2026–2027', '2026-08-01', '2026-11-15')
const CASE4 = buildCaseTermData(CASE4_TERM, [
  { masterCourseId: 'mc1', code: 'DPT-501', name: 'Human Anatomy & Kinesiology', courseType: 'didactic', status: 'none' },
  { masterCourseId: 'mc2', code: 'DPT-502', name: 'Physiology & Pathophysiology', courseType: 'didactic', status: 'draft' },
  { masterCourseId: 'mc4', code: 'DPT-504', name: 'Neuroanatomy', courseType: 'didactic', status: 'scheduled', openDate: '2026-08-26' },
  { masterCourseId: 'mc5', code: 'DPT-505', name: 'Biomechanics I', courseType: 'didactic', status: 'active', responseRate: 48, enrollmentCount: 40, responseCount: 19, deadline: 'Aug 30, 2026' },
  { masterCourseId: 'mc6', code: 'DPT-510', name: 'Musculoskeletal Physical Therapy I', courseType: 'didactic', status: 'collecting', responseRate: 60, enrollmentCount: 45, responseCount: 27, deadline: 'Sep 2, 2026' },
  { masterCourseId: 'mc7', code: 'DPT-511', name: 'Musculoskeletal Physical Therapy II', courseType: 'didactic', status: 'closed', responseRate: 70, enrollmentCount: 42, responseCount: 29, deadline: 'Aug 5, 2026' },
])

const CASE5_TERM = caseTerm('case5-term', 'Fall 2026', '2026–2027', '2026-08-01', '2026-11-15')
const CASE5 = buildCaseTermData(CASE5_TERM, [
  { masterCourseId: 'mc8', code: 'DPT-520', name: 'Neurological Physical Therapy', courseType: 'didactic', status: 'draft' },
  { masterCourseId: 'mc9', code: 'DPT-530', name: 'Therapeutic Exercise', courseType: 'didactic', status: 'scheduled', openDate: '2026-08-22' },
  { masterCourseId: 'mc10', code: 'DPT-540', name: 'Differential Diagnosis', courseType: 'didactic', status: 'active', responseRate: 55, enrollmentCount: 38, responseCount: 21, deadline: 'Aug 28, 2026' },
  { masterCourseId: 'mc11', code: 'DPT-610', name: 'Geriatric Physical Therapy', courseType: 'didactic', status: 'collecting', responseRate: 62, enrollmentCount: 40, responseCount: 25, deadline: 'Aug 28, 2026' },
  { masterCourseId: 'mc12', code: 'DPT-611', name: 'Pediatric Physical Therapy', courseType: 'didactic', status: 'closed', responseRate: 75, enrollmentCount: 36, responseCount: 27, deadline: 'Aug 1, 2026' },
])

const CASE6_TERM = caseTerm('case6-term', 'Fall 2026', '2026–2027', '2026-08-01', '2026-11-15')
const CASE6 = buildCaseTermData(CASE6_TERM, [
  { masterCourseId: 'mc14', code: 'DPT-601', name: 'Clinical Practicum I', courseType: 'clinical', status: 'scheduled', openDate: '2026-08-24' },
  { masterCourseId: 'mc15', code: 'DPT-602', name: 'Clinical Practicum II', courseType: 'clinical', status: 'active', responseRate: 58, enrollmentCount: 20, responseCount: 12, deadline: 'Aug 27, 2026' },
  { masterCourseId: 'mc16', code: 'DPT-603', name: 'Clinical Practicum III (Full-Time)', courseType: 'clinical', status: 'collecting', responseRate: 66, enrollmentCount: 18, responseCount: 12, deadline: 'Aug 27, 2026' },
  { masterCourseId: 'mc17', code: 'DPT-506', name: 'Biomechanics II', courseType: 'didactic', status: 'closed', responseRate: 80, enrollmentCount: 44, responseCount: 35, deadline: 'Aug 3, 2026' },
])

const CASE7_TERM = caseTerm('case7-term', 'Fall 2026', '2026–2027', '2026-08-01', '2026-11-15')
const CASE7 = buildCaseTermData(CASE7_TERM, [
  { masterCourseId: 'mc18', code: 'DPT-515', name: 'Pharmacology for Physical Therapists', courseType: 'didactic', status: 'active', responseRate: 50, enrollmentCount: 50, responseCount: 25, deadline: 'Aug 25, 2026' },
  { masterCourseId: 'mc19', code: 'DPT-620', name: 'Geriatric Physical Therapy', courseType: 'didactic', status: 'collecting', responseRate: 64, enrollmentCount: 30, responseCount: 19, deadline: 'Sep 1, 2026' },
  { masterCourseId: 'mc20', code: 'DPT-710', name: 'Neurological Rehab', courseType: 'didactic', status: 'closed', responseRate: 78, enrollmentCount: 25, responseCount: 20, deadline: 'Aug 2, 2026' },
])

const CASE8_TERM = caseTerm('case8-term', 'Fall 2026', '2026–2027', '2026-08-01', '2026-11-15')
const CASE8 = buildCaseTermData(CASE8_TERM, [
  { masterCourseId: 'mc1', code: 'DPT-501', name: 'Human Anatomy & Kinesiology', courseType: 'didactic', status: 'closed', responseRate: 72, enrollmentCount: 40, responseCount: 29, deadline: 'Jul 28, 2026' },
  { masterCourseId: 'mc2', code: 'DPT-502', name: 'Physiology & Pathophysiology', courseType: 'didactic', status: 'pending_review', responseRate: 68, enrollmentCount: 35, responseCount: 24, deadline: 'Jul 30, 2026' },
  { masterCourseId: 'mc4', code: 'DPT-504', name: 'Neuroanatomy', courseType: 'didactic', status: 'closed', responseRate: 80, enrollmentCount: 30, responseCount: 24, deadline: 'Aug 1, 2026' },
])

/* Case 9 — "all courses in published." Feedback: "Solution would be the same
 * as case 8" — same Closed-bucket rendering, but built from `released`
 * (not `closed`/`pending_review`) so it's a genuinely different underlying
 * state, not a copy-paste of Case 8's data. */
const CASE9_TERM = caseTerm('case9-term', 'Fall 2026', '2026–2027', '2026-08-01', '2026-11-15')
const CASE9 = buildCaseTermData(CASE9_TERM, [
  { masterCourseId: 'mc5', code: 'DPT-505', name: 'Biomechanics I', courseType: 'didactic', status: 'released', responseRate: 74, enrollmentCount: 42, responseCount: 31, deadline: 'Jul 20, 2026' },
  { masterCourseId: 'mc6', code: 'DPT-510', name: 'Musculoskeletal Physical Therapy I', courseType: 'didactic', status: 'released', responseRate: 82, enrollmentCount: 45, responseCount: 37, deadline: 'Jul 22, 2026' },
  { masterCourseId: 'mc7', code: 'DPT-511', name: 'Musculoskeletal Physical Therapy II', courseType: 'didactic', status: 'released', responseRate: 69, enrollmentCount: 40, responseCount: 28, deadline: 'Jul 25, 2026' },
])

/* ── the scenario accounts ────────────────────────────────────────────────── */
export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: 'acc-healthy',
    name: 'Johns Hopkins DPT',
    blurb: 'Steady-state default — realistic mixed history, not tied to one case',
    terms: MOCK_PROGRAM_TERMS,
    offerings: MOCK_COURSE_OFFERINGS,
    surveys: MOCK_SURVEYS,
  },
  {
    id: 'acc-fresh',
    name: 'Riverside DPT',
    blurb: 'Case 1 — brand-new program, no terms set up yet',
    terms: [],
    offerings: [],
    surveys: [],
  },
  {
    id: 'acc-nodates',
    name: 'Lakeside OT',
    blurb: 'Case 2 — term set up, dated, zero courses',
    terms: [CASE2_TERM],
    offerings: [],
    surveys: [],
  },
  {
    id: 'acc-noroster',
    name: 'Summit PA',
    blurb: 'Case 3 — courses exist, zero evaluations scheduled',
    terms: [CASE3_TERM],
    offerings: CASE3.offerings,
    surveys: [],
  },
  {
    id: 'acc-case4',
    name: 'Brightwater OT',
    blurb: 'Case 4 — mixed buckets: not-configured, draft, scheduled, live, closed all present',
    terms: [CASE4_TERM],
    offerings: CASE4.offerings,
    surveys: CASE4.surveys,
  },
  {
    id: 'acc-case5',
    name: 'Fairview PT',
    blurb: 'Case 5 — every course has at least a draft (nothing unconfigured)',
    terms: [CASE5_TERM],
    offerings: CASE5.offerings,
    surveys: CASE5.surveys,
  },
  {
    id: 'acc-case6',
    name: 'Ridgeline DPT',
    blurb: 'Case 6 — every course scheduled or further (coverage shows as complete)',
    terms: [CASE6_TERM],
    offerings: CASE6.offerings,
    surveys: CASE6.surveys,
  },
  {
    id: 'acc-case7',
    name: 'Northgate OT',
    blurb: 'Case 7 — every course live or closed (nothing left to schedule)',
    terms: [CASE7_TERM],
    offerings: CASE7.offerings,
    surveys: CASE7.surveys,
  },
  {
    id: 'acc-case8',
    name: 'Westbrook PA',
    blurb: 'Case 8 — every course closed, awaiting review',
    terms: [CASE8_TERM],
    offerings: CASE8.offerings,
    surveys: CASE8.surveys,
  },
  {
    id: 'acc-case9',
    name: 'Eastport DPT',
    blurb: 'Case 9 — every course published to faculty (same rendering as Case 8)',
    terms: [CASE9_TERM],
    offerings: CASE9.offerings,
    surveys: CASE9.surveys,
  },
  {
    id: 'acc-upcoming-only',
    name: 'Cascade Nursing',
    blurb: 'Case 3 shape on the Upcoming column — pre-launch, courses ready, none scheduled',
    terms: [FALL26],
    offerings: MOCK_COURSE_OFFERINGS,
    surveys: [],
  },
  {
    id: 'acc-notemplates',
    name: 'Prairie DPT',
    blurb: 'Courses ready, but no survey templates created yet',
    terms: [SPRING26, FALL26],
    offerings: MOCK_COURSE_OFFERINGS,
    // No surveys: without a template there is nothing to push.
    surveys: [],
    templates: [],
  },
]

export const DEFAULT_ACCOUNT_ID = 'acc-healthy'

/* ── module-level active-account register (read by the term helpers) ──────── */
let _activeId = DEFAULT_ACCOUNT_ID

export function setActiveAccountId(id: string): void {
  _activeId = DEMO_ACCOUNTS.some((a) => a.id === id) ? id : DEFAULT_ACCOUNT_ID
}

export function activeAccountId(): string {
  return _activeId
}

export function accountById(id: string): DemoAccount {
  return DEMO_ACCOUNTS.find((a) => a.id === id) ?? DEMO_ACCOUNTS[0]
}

export function activeAccount(): DemoAccount {
  return accountById(_activeId)
}

export function activeTerms(): ProgramTerm[] {
  return activeAccount().terms
}

export function activeOfferings(): CourseOffering[] {
  return activeAccount().offerings
}

export function activeSurveys(): PceSurvey[] {
  return activeAccount().surveys
}
