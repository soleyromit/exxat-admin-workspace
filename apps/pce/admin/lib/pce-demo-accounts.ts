// ============================================================================
// Demo accounts — one program-account per dashboard term-card SCENARIO.
//
// The PCE prototype has a single implicit user. To exercise every term-card
// edge state (no current term, undated term, no roster, no history, no next
// term, …) WITHOUT cramming contradictory data into one account, each scenario
// is its own selectable demo account. The sidebar user menu switches between
// them; the choice persists to localStorage.
//
// A module-level "active account" register feeds the term helpers
// (pce-term-metrics / pce-term-readiness) so the derived current/last/upcoming
// classification follows the switched account. The DEFAULT account reuses the
// full mock verbatim, so the default experience is byte-for-byte unchanged.
// ============================================================================

import {
  MOCK_PROGRAM_TERMS,
  MOCK_COURSE_OFFERINGS,
  MOCK_SURVEYS,
  type ProgramTerm,
  type CourseOffering,
  type PceSurvey,
} from '@/lib/pce-mock-data'

export interface DemoAccount {
  id: string
  /** Program-flavoured label shown in the switcher. */
  name: string
  /** One-line scenario description. */
  blurb: string
  terms: ProgramTerm[]
  offerings: CourseOffering[]
  surveys: PceSurvey[]
}

/* ── reusable terms pulled from the full mock ─────────────────────────────── */
const SPRING26 = MOCK_PROGRAM_TERMS.find((t) => t.id === 'pt1')! // current, window open
const FALL25 = MOCK_PROGRAM_TERMS.find((t) => t.id === 'pt2')! // past (window closed)
const FALL26 = MOCK_PROGRAM_TERMS.find((t) => t.id === 'pt5')! // upcoming (dated)

/* A current-dated term with NO course offerings — "term set up, roster empty". */
const CURRENT_NO_ROSTER: ProgramTerm = {
  id: 'acc-term-noroster',
  name: 'Summer 2026',
  season: 'Summer',
  academicYear: '2025–2026',
  startDate: '2026-06-01',
  endDate: '2026-08-15',
  status: 'active',
  enabledForEval: true,
}

/* A term created before its dates are entered — startDate/endDate blank. */
const DATELESS_TERM: ProgramTerm = {
  id: 'acc-term-nodates',
  name: 'Fall 2026',
  season: 'Fall',
  academicYear: '2026–2027',
  startDate: '',
  endDate: '',
  status: 'active',
  enabledForEval: true,
}

/* A dateless term used as the "next term" alongside a live current term. */
const DATELESS_UPCOMING: ProgramTerm = {
  id: 'acc-term-nextnodates',
  name: 'Spring 2027',
  season: 'Spring',
  academicYear: '2026–2027',
  startDate: '',
  endDate: '',
  status: 'active',
  enabledForEval: true,
}

/* ── the scenario accounts ────────────────────────────────────────────────── */
export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: 'acc-healthy',
    name: 'Johns Hopkins DPT',
    blurb: 'Steady state — current, last & upcoming all present (default)',
    terms: MOCK_PROGRAM_TERMS,
    offerings: MOCK_COURSE_OFFERINGS,
    surveys: MOCK_SURVEYS,
  },
  {
    id: 'acc-fresh',
    name: 'Riverside DPT',
    blurb: 'Brand-new program — no terms set up yet',
    terms: [],
    offerings: [],
    surveys: [],
  },
  {
    id: 'acc-nodates',
    name: 'Lakeside OT',
    blurb: 'First term created, dates not entered yet',
    terms: [DATELESS_TERM],
    offerings: [],
    surveys: [],
  },
  {
    id: 'acc-noroster',
    name: 'Summit PA',
    blurb: 'Current term dated, but no courses/roster added',
    terms: [CURRENT_NO_ROSTER],
    offerings: [],
    surveys: [],
  },
  {
    id: 'acc-upcoming-only',
    name: 'Cascade Nursing',
    blurb: 'Pre-launch — an upcoming term only, no current or history',
    terms: [FALL26],
    offerings: MOCK_COURSE_OFFERINGS,
    surveys: [],
  },
  {
    id: 'acc-between',
    name: 'Harbor DPT',
    blurb: 'Between terms — last term done, next scheduled, none active',
    terms: [FALL25, FALL26],
    offerings: MOCK_COURSE_OFFERINGS,
    surveys: MOCK_SURVEYS,
  },
  {
    id: 'acc-nolast',
    name: 'Metro DPT',
    blurb: 'First term running — live now, no prior term',
    terms: [SPRING26, FALL26],
    offerings: MOCK_COURSE_OFFERINGS,
    surveys: MOCK_SURVEYS,
  },
  {
    id: 'acc-noupcoming',
    name: 'Valley PT',
    blurb: 'Term running, nothing scheduled next',
    terms: [SPRING26, FALL25],
    offerings: MOCK_COURSE_OFFERINGS,
    surveys: MOCK_SURVEYS,
  },
  {
    id: 'acc-next-nodates',
    name: 'Delta OT',
    blurb: 'Next term created but still undated',
    terms: [SPRING26, FALL25, DATELESS_UPCOMING],
    offerings: MOCK_COURSE_OFFERINGS,
    surveys: MOCK_SURVEYS,
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
