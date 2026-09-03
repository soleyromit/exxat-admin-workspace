// ============================================================================
// Term evaluation metrics — the SINGLE source of truth for per-term derivations
// shared by the Course-Evaluation Dashboard (term cards + action counts) and the
// Term workspace page (KPIs, action widgets, viz). Extracted from dashboard-home
// so both surfaces compute identical numbers (no drift between the card breakdown
// and the page it links to).
//
// No red per aarti_no_red: callers tint with teal (good) / amber (risk).
// ============================================================================

import {
  MOCK_PROGRAM_TERMS,
  MOCK_MASTER_COURSES,
  type PceSurvey,
  type ProgramTerm,
} from '@/lib/pce-mock-data'
import { activeTerms, activeOfferings } from '@/lib/pce-demo-accounts'
import { AT_RISK_THRESHOLD } from '@/lib/pce-at-risk'
import { prismCoursesHref } from '@/lib/pce-course-readiness'
import type { StatusBadgeTone } from '@exxatdesignux/ui'

export const RESPONSE_TARGET = 70

/** Parse a date string as a LOCAL date. Two formats share this codebase:
 * term dates are 'YYYY-MM-DD' (ProgramTerm.startDate/endDate), where plain
 * `new Date(str)` reads UTC midnight and renders a day early in timezones
 * behind UTC — that ISO form gets the manual y/m/d construction below.
 * Survey deadlines (PceSurvey.deadline) are human-readable ('Jul 14, 2026'),
 * which `new Date()` already parses as local midnight — those pass through
 * unchanged. Every date-math helper below goes through this so term windows,
 * survey countdowns, and displayed dates never disagree by a day. */
export const parseDate = (d: string): Date => {
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(d)
  if (!iso) return new Date(d)
  const [, y, m, day] = iso
  return new Date(Number(y), Number(m) - 1, Number(day))
}

/* Completion % (higher is better): teal ≥70, brand ≥60, AA-safe amber below. */
export const completionColor = (pct: number) =>
  pct >= 70 ? 'var(--chart-2)' : pct >= 60 ? 'var(--brand-color)' : 'var(--chip-4)'

/** Term id for a survey's `term` (name string) — for deep links into the workspace. */
export function termIdByName(name: string): string | null {
  return activeTerms().find((t) => t.name === name)?.id ?? null
}

/** Course codes of a term's offerings that have no non-draft evaluation yet. */
export function uncoveredCodes(termId: string, termSurveys: PceSurvey[]): string[] {
  const surveyedCodes = new Set(
    termSurveys.filter((s) => s.status !== 'draft').map((s) => s.courseCode),
  )
  return activeOfferings().filter((o) => o.termId === termId)
    .map((o) => MOCK_MASTER_COURSES.find((c) => c.id === o.masterCourseId)?.code)
    .filter((code): code is string => !!code && !surveyedCodes.has(code))
}

/* ── lifecycle predicates (one vocabulary, shared with surveys-table) ──────── */
export const LIVE = (s: PceSurvey) => s.status === 'active' || s.status === 'collecting'
export const IN_REVIEW = (s: PceSurvey) => s.status === 'pending_review' || s.status === 'closed'
export const FINISHED = (s: PceSurvey) => IN_REVIEW(s) || s.status === 'released'

/** Aug 4 transcript scenario #6 — a Draft/re-editable Scheduled survey is
 *  still mid-setup; must route back into the push wizard to resume, never
 *  to a results page for a survey that hasn't collected anything. A
 *  Scheduled survey specifically needs `wizardDraft` to count (most finish
 *  the wizard in one pass and have nothing to resume — status alone can't
 *  tell those apart), but a Draft-status survey is ALWAYS editable — that's
 *  what "draft" means — whether or not it happens to carry a saved
 *  in-progress snapshot.
 *
 *  2026-08-13 — was defined only inside term-evaluations-board.tsx, and
 *  checked `wizardDraft` alone even for Draft rows. `wizardDraft` is a
 *  runtime-only field (set by a real "Save as Draft" action; grep confirms
 *  no seed record in pce-mock-data.ts ever sets it) — so every pre-seeded
 *  Draft row, on both the board and the table, was silently unresumable:
 *  its card/row routed to an empty /results page instead of back into the
 *  wizard. Caught live testing the table's new Edit button against DPT-511
 *  (survey `s7`, status 'draft', no wizardDraft, no offeringId — the data
 *  gap this narrower check was masking). Promoted here so both views share
 *  one (now-correct) definition instead of drifting. */
export function isResumable(s: PceSurvey): boolean {
  return s.status === 'draft' || !!s.wizardDraft
}

/** Same resume URL shape push/page.tsx's Phase 3 hydration effect expects —
 *  it rehydrates the saved templateAssignments/unitSelections/autoUpdateOn
 *  from wizardDraft once this offering is selected, so nothing further is
 *  needed to make "resume" actually resume. */
export function resumeHref(s: PceSurvey, termId: string): string {
  return `/surveys/push?term=${termId}&offerings=${s.offeringId}`
}

/* ── date helpers ─────────────────────────────────────────────────────────── */
export function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null
  const t = parseDate(dateStr).getTime()
  return Number.isFinite(t) ? Math.ceil((t - Date.now()) / 86_400_000) : null
}

/** Whole days from `fromIso` to `toIso` (positive = `toIso` is later). */
export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((parseDate(toIso).getTime() - parseDate(fromIso).getTime()) / 86_400_000)
}

/** Evaluation window closes a week after the term ends. */
export function daysUntilClose(term: ProgramTerm): number | null {
  const close = parseDate(term.endDate)
  close.setDate(close.getDate() + 7)
  const diff = Math.ceil((close.getTime() - Date.now()) / 86_400_000)
  return diff > 0 ? diff : null
}

export function evalWindow(term: ProgramTerm): { open: string; close: string } {
  if (!term.startDate || !term.endDate) return { open: '—', close: '—' }
  const closeDate = parseDate(term.endDate)
  closeDate.setDate(closeDate.getDate() + 7)
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return { open: fmt(parseDate(term.startDate)), close: fmt(closeDate) }
}

/** Enrollment-weighted response rate across a set of evaluations. */
export function weightedRate(surveys: PceSurvey[]): number | null {
  const enrolled = surveys.reduce((s, x) => s + x.enrollmentCount, 0)
  if (enrolled === 0) return null
  return Math.round(
    surveys.reduce((s, x) => s + x.responseRate * x.enrollmentCount, 0) / enrolled,
  )
}

/** Course coverage for a term: how many offerings have ANY evaluation, draft
 *  included. Was non-draft-only, which disagreed with the term workspace's
 *  "No survey configured" tab and term-evaluations-board.tsx's identically-
 *  named column — both of those intentionally count a draft as already
 *  represented (it shows in Scheduled) and reserve "not configured" for
 *  offerings with zero survey rows. Reconciled 2026-08-17 so this KPI's "N
 *  not set up yet" always matches the tab's own count — a live discrepancy
 *  (KPI said 2, tab said 1 for the same term) is exactly the board/grid
 *  vocabulary-mismatch class of bug the workspace flags on sight. */
export function coverageFor(
  termId: string,
  termSurveys: PceSurvey[],
): { surveyed: number; total: number } | null {
  const offerings = activeOfferings().filter((o) => o.termId === termId)
  if (offerings.length === 0) return null
  const surveyedCodes = new Set(termSurveys.map((s) => s.courseCode))
  const surveyed = offerings.filter((o) => {
    const code = MOCK_MASTER_COURSES.find((c) => c.id === o.masterCourseId)?.code
    return code ? surveyedCodes.has(code) : false
  }).length
  return { surveyed, total: offerings.length }
}

/* ── term ordering / current cycle ────────────────────────────────────────── */
/* Default-account ordering — kept as a stable const for term lookups on
 * secondary surfaces (command menu, breadcrumbs, remind). The dashboard sorts
 * its own account-scoped `programTerms` from context. */
export const termsOrdered: ProgramTerm[] = [...MOCK_PROGRAM_TERMS].sort(
  (a, b) => a.startDate.localeCompare(b.startDate),
)

/* ── term window classification (Aug 19 2026 dashboard feedback) ─────────────
 * Replaces the old single-current-id model, which sourced from the static
 * `activeTerms()` demo snapshot instead of live term state — a term added
 * via "Set up term" was invisible to it and could never become Current no
 * matter its dates. `classifyTermWindow` takes the caller's own live term
 * list instead, and returns every window a term can land in (more than one
 * term can now be Current/Last/Upcoming at once). */
export type TermWindowPosition = 'current' | 'last' | 'past' | 'upcoming' | 'future'

/** Current: today is on/before end date + this many days (T ≤ E + 14). */
export const CURRENT_TERM_GRACE_DAYS = 14
/** Last: today is within this many days after the term ended (14 < T−E ≤ 30);
 *  beyond it the term is Past. */
export const LAST_TERM_CEILING_DAYS = 30
/** Upcoming: term starts within this many days from now, inclusive
 *  (0 < S−T ≤ 30); beyond it the term is Future. */
export const UPCOMING_WINDOW_DAYS = 30

/** Matches the PRD's 5-state term definition verbatim (T = today, S = start,
 *  E = end — "UI feedback on Dashboard.docx", Term Definition):
 *    Current  — S ≤ T ≤ E + 14
 *    Last     — 14 < (T − E) ≤ 30
 *    Past     — (T − E) > 30
 *    Upcoming — 0 < (S − T) ≤ 30
 *    Future   — (S − T) > 30
 *  Each pair uses an inclusive-then-exclusive cutoff so every value of T
 *  lands in exactly one bucket. Two bugs this replaces (Romit, 2026-08-25:
 *  "ensure that all scenarios are covered properly per demo account"): (1)
 *  "Last" had no ceiling at all — a term that ended 200 days ago still
 *  classified as `'last'` forever, with no distinct Past state, so it could
 *  wrongly compete to be shown as the featured Last-term card whenever no
 *  genuinely-recent Last term existed. (2) Upcoming used `<` instead of `≤`
 *  against the 30-day window, so a term starting in exactly 30 days
 *  misclassified as Future a day early.
 *  A term with no dates yet is always Upcoming — there's nothing to window
 *  against, and it still needs a home (the "add dates" card). */
export function classifyTermWindow(
  term: ProgramTerm,
  todayIso: string = new Date().toISOString().slice(0, 10),
): TermWindowPosition {
  if (!term.startDate || !term.endDate) return 'upcoming'
  const startMinusToday = daysBetween(todayIso, term.startDate)
  if (startMinusToday > 0) return startMinusToday <= UPCOMING_WINDOW_DAYS ? 'upcoming' : 'future'
  const todayMinusEnd = daysBetween(term.endDate, todayIso)
  if (todayMinusEnd <= CURRENT_TERM_GRACE_DAYS) return 'current'
  return todayMinusEnd <= LAST_TERM_CEILING_DAYS ? 'last' : 'past'
}

/** Registrar rule on top of the plain per-term grace window (Romit,
 *  2026-08-24: "fall and spring cannot be current at the same time... think
 *  yourself as a university who is administrating and running"). A real
 *  academic calendar is sequential, not parallel — `classifyTermWindow`'s
 *  14-day grace period exists so the just-finished term doesn't go cold the
 *  instant it ends, but that grace is only meaningful in the GAP between two
 *  terms. The moment a newer term actually starts, the older one is over,
 *  full stop — it doesn't get to keep "Current" just because it's still
 *  inside its own trailing window. Multiple simultaneous "Current" terms
 *  stays possible for genuinely independent programs with unrelated
 *  calendars; this only demotes terms that lose to a term which has ALREADY
 *  started, i.e. the same sequential timeline. */
export function resolveTermPositions(
  terms: ProgramTerm[],
  todayIso: string = new Date().toISOString().slice(0, 10),
): Map<string, TermWindowPosition> {
  const positions = new Map<string, TermWindowPosition>()
  for (const term of terms) positions.set(term.id, classifyTermWindow(term, todayIso))

  const currentCandidates = terms.filter((t) => positions.get(t.id) === 'current')
  if (currentCandidates.length > 1) {
    const inSession = currentCandidates.filter(
      (t) => t.startDate <= todayIso && t.endDate >= todayIso,
    )
    const pool = inSession.length > 0 ? inSession : currentCandidates
    const winner = [...pool].sort((a, b) => b.startDate.localeCompare(a.startDate))[0]
    for (const t of currentCandidates) {
      if (t.id !== winner.id) positions.set(t.id, 'last')
    }
  }
  return positions
}

/* ── term stage model (shares the survey vocabulary) ──────────────────────── */
export type TermStage = 'upcoming' | 'live' | 'review' | 'complete'

export const STAGE_BADGE: Record<TermStage, { label: string; tone: StatusBadgeTone }> = {
  upcoming: { label: 'Upcoming',  tone: 'info' },
  live:     { label: 'Live',      tone: 'success' },
  review:   { label: 'In review', tone: 'warning' },
  complete: { label: 'Complete',  tone: 'neutral' },
}

export interface TermSnapshot {
  term: ProgramTerm
  stage: TermStage
  rate: number | null
  total: number
  live: number
  atRisk: number
  closingThisWeek: number
  pending: number
  released: number
  daysLeft: number | null
  coverage: { surveyed: number; total: number } | null
  /** Aug 4 transcript scenario #6 — offerings with a saved-but-unfinished
   *  wizard run (Save as Draft, or a Scheduled survey re-opened for editing).
   *  `coverageFor` deliberately excludes these from `surveyed` (a draft isn't
   *  "done"), so without this the dashboard card can't tell "never touched"
   *  apart from "started, not finished" — the exact gap the term-card resume
   *  entry point needs to close. */
  draftCount: number
  /** Raw headcounts behind `rate`, summed across the same `rated` (live or
   *  finished) surveys `weightedRate` uses — so a "X of Y responded" caption
   *  built from these always reconciles with the `rate` percentage shown
   *  beside it. Real per-survey counts (`PceSurvey.responseCount`/
   *  `enrollmentCount`), never derived from the rounded `rate` itself. */
  responseCount: number
  enrollmentCount: number
}

/** Full derived snapshot for one term from the live evaluation set. */
export function snapshot(term: ProgramTerm, ce: PceSurvey[]): TermSnapshot {
  const list = ce.filter((s) => s.term === term.name)
  const today = new Date().toISOString().slice(0, 10)
  const live = list.filter(LIVE)
  const pending = list.filter(IN_REVIEW).length
  const released = list.filter((s) => s.status === 'released').length
  const closingThisWeek = live.filter((s) => {
    const d = s.deadline ? daysUntil(s.deadline) : null
    return d != null && d >= 0 && d <= 7
  }).length
  const stage: TermStage =
    term.startDate > today ? 'upcoming'
    : live.length > 0 ? 'live'
    : pending > 0 ? 'review'
    : 'complete'
  /* Response rate only means something for surveys that have actually
   * opened — draft and scheduled rows carry a 0% placeholder rate because
   * nothing has been collected yet, not because response was genuinely
   * poor. Blending them into the term-level average silently understated
   * it (caught live: a term with Live 47% + Closed 80% headlined at 63%,
   * which only reconciles once you know draft/scheduled zeros were mixed
   * in — the reader has no way to see that from the card alone). */
  const rated = list.filter((s) => LIVE(s) || FINISHED(s))
  return {
    term,
    stage,
    rate: weightedRate(rated),
    total: list.length,
    live: live.length,
    atRisk: live.filter((s) => s.responseRate < AT_RISK_THRESHOLD).length,
    closingThisWeek,
    pending,
    released,
    daysLeft: stage === 'live' ? daysUntilClose(term) : null,
    coverage: coverageFor(term.id, list),
    draftCount: list.filter((s) => s.status === 'draft').length,
    responseCount: rated.reduce((sum, s) => sum + s.responseCount, 0),
    enrollmentCount: rated.reduce((sum, s) => sum + s.enrollmentCount, 0),
  }
}

/* ── Breakdown Mode (Aug 19 2026 dashboard feedback, Cases 4–9) ────────────────
 * Per-course-status view for a term card once at least one evaluation exists
 * — replaces the plain avg-response-rate block from `snapshot()` above with
 * five buckets: not-yet-configured, Draft, Scheduled, Live, Closed (closed
 * folds in pending_review/closed/released — Case 9 "published" is explicitly
 * "the same as case 8", so Closed carries every post-live state alike). */
export interface CourseBreakdown {
  /** Offerings with no survey row at all — not a PceSurvey bucket, so no
   *  survey object exists to read a code off of. `notConfiguredCodes` below
   *  is the course-code list for the same set; kept as a count too since
   *  most callers only need the number. */
  notConfiguredCount: number
  /** Course codes behind `notConfiguredCount` — added for row-level
   *  identifiability (Romit: "2 courses need setup, which courses?").
   *  `offeringCodes \ byCourse.keys()`, same diff `notConfiguredCount`
   *  already computed the size of. */
  notConfiguredCodes: string[]
  draft: PceSurvey[]
  scheduled: PceSurvey[]
  live: PceSurvey[]
  closed: PceSurvey[]
  totalCourses: number
}

/** null when the term has no course offerings yet (Case 2) — callers should
 *  already be past that state before reaching for a breakdown.
 *
 *  Two corrections over a naive `list.filter(status)` per bucket, both
 *  caught live against the real mock data (Spring 2026 / Fall 2025), where
 *  they produced "3 of 1 course closed (300%)" and a coverage bar reading
 *  100% while the same card still offered to set up a course already
 *  represented by another survey row:
 *
 *  1. Scoped to this term's actual offerings, the same course-code set
 *     `coverageFor` already builds. Some seed `PceSurvey` rows carry a
 *     `term` name with no matching offering for that term id at all — a
 *     pre-existing mock-data gap (see [[project_pce_term_card_st01_gap_audit]]),
 *     not a real state a course can be in. Counting them inflated every
 *     bucket total past the term's real course count.
 *  2. Bucketed by COURSE, not by survey row — a course can carry more than
 *     one `PceSurvey` (course + instructor evaluations split via
 *     `evalScope`), and counting raw rows let one course land in two
 *     buckets at once. Each course counts once, in the least-finished
 *     bucket it still has a survey in — that's the one still needing
 *     action; a course with one closed and one still-live survey isn't
 *     done yet. */
export function breakdownFor(term: ProgramTerm, ce: PceSurvey[]): CourseBreakdown | null {
  const list = ce.filter((s) => s.term === term.name)
  const coverage = coverageFor(term.id, list)
  if (!coverage) return null

  /* `coverageFor`'s "total" counts offering ROWS, which can outnumber
   * distinct courses (two sections of the same course — e.g. a lecture and
   * a practice offering sharing one masterCourseId both existing for a
   * term — collapse to one entry here). Bucketing is per-course, so the
   * denominator has to be too, or the buckets can never sum to it. */
  const offeringCodes = new Set(
    activeOfferings()
      .filter((o) => o.termId === term.id)
      .map((o) => MOCK_MASTER_COURSES.find((c) => c.id === o.masterCourseId)?.code)
      .filter((code): code is string => !!code),
  )

  const byCourse = new Map<string, PceSurvey[]>()
  for (const s of list) {
    if (!offeringCodes.has(s.courseCode)) continue
    const arr = byCourse.get(s.courseCode)
    if (arr) arr.push(s)
    else byCourse.set(s.courseCode, [s])
  }

  const draft: PceSurvey[] = []
  const scheduled: PceSurvey[] = []
  const live: PceSurvey[] = []
  const closed: PceSurvey[] = []
  for (const surveys of byCourse.values()) {
    const rep =
      surveys.find((s) => s.status === 'draft') ??
      surveys.find((s) => s.status === 'scheduled') ??
      surveys.find(LIVE) ??
      surveys[0]
    if (rep.status === 'draft') draft.push(rep)
    else if (rep.status === 'scheduled') scheduled.push(rep)
    else if (LIVE(rep)) live.push(rep)
    else closed.push(rep)
  }

  const notConfiguredCodes = [...offeringCodes].filter((code) => !byCourse.has(code)).sort()

  return {
    notConfiguredCount: notConfiguredCodes.length,
    notConfiguredCodes,
    draft, scheduled, live, closed,
    totalCourses: offeringCodes.size,
  }
}

/** True once every course has at least a Scheduled evaluation — the point
 *  Case 6 converts the coverage metric into a single "complete" visual
 *  instead of a percentage. */
export function isFullyCovered(b: CourseBreakdown): boolean {
  return b.notConfiguredCount === 0 && b.draft.length === 0
}

/** (Scheduled + Live) ÷ total, as a whole-number percent — the coverage
 *  metric Case 4 asks for. */
/** (Scheduled + Live + Closed) ÷ total — Vishal, transcript 7a175890: "the
 *  coverage metric would be the math would be scheduled plus live plus
 *  closed[, published]. Over total." Closed courses were evaluated too, just
 *  already finished — dropping them from the numerator (the first version
 *  of this function did) undercounts coverage for any term with closed
 *  courses, which is exactly the case that made "1 needs setup, 1 in draft"
 *  read as if it should leave far more than 43% covered out of 7 courses. */
export function coveragePercent(b: CourseBreakdown): number {
  if (b.totalCourses === 0) return 0
  return Math.round(((b.scheduled.length + b.live.length + b.closed.length) / b.totalCourses) * 100)
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

/** Nearest (soonest) `daysUntil` value across a bucket, plus whether every
 *  survey in it shares that same date — the two facts every Scheduled/Live
 *  message below is built from ("scheduled in 7 days" vs "next one going out
 *  in 7 days" when the dates differ). */
function nearestDay(surveys: PceSurvey[], dateOf: (s: PceSurvey) => string | undefined) {
  const days = surveys
    .map((s) => dateOf(s))
    .filter((d): d is string => !!d)
    .map((d) => daysUntil(d))
    .filter((d): d is number => d != null)
  if (days.length === 0) return null
  const nearest = Math.min(...days)
  const allSame = days.every((d) => d === days[0])
  return { nearest: Math.max(0, nearest), allSame }
}

/** Row title + meta come as a pair now (Romit, sixth pass: the old
 *  one-sentence messages below — "Evaluations for 2 courses are scheduled,
 *  next one going out in 107 days" — read as too big/complicated as a row
 *  title, and pushed the trailing action onto its own line). Lead is the
 *  short scannable fact ("2 courses scheduled"); detail is the timing,
 *  demoted to the row's muted subtitle so the title stays short regardless
 *  of how far out the date is. */
export function scheduledLead(scheduled: PceSurvey[]): string | null {
  if (scheduled.length === 0) return null
  return `${plural(scheduled.length, 'course')} scheduled`
}

export function scheduledDetail(scheduled: PceSurvey[]): string | null {
  const day = nearestDay(scheduled, (s) => s.openDate)
  if (!day) return null
  if (day.nearest === 0) return day.allSame ? 'All open today.' : 'Next opens today.'
  const days = plural(day.nearest, 'day')
  return day.allSame ? `Opens in ${days}.` : `Next opens in ${days}.`
}

/** Same fact as `scheduledDetail`, without the trailing period — for the
 *  row-level countdown chip (tenth pass: Romit — "can we use some different
 *  ds component" for the date fact, rather than burying it in a sentence).
 *  `scheduledDetail` stays as the sr-only full-sentence fallback so the row
 *  reads as a complete sentence to a screen reader even though sighted
 *  users see it as a standalone chip. */
export function scheduledCountdown(scheduled: PceSurvey[]): string | null {
  const detail = scheduledDetail(scheduled)
  return detail ? detail.replace(/\.$/, '') : null
}

/** Lead for Live, closing rather than opening. */
export function liveLead(live: PceSurvey[]): string | null {
  if (live.length === 0) return null
  return `${plural(live.length, 'course')} live`
}

function liveClosingClause(live: PceSurvey[]): string | null {
  const day = nearestDay(live, (s) => s.deadline)
  if (!day) return null
  if (day.nearest === 0) return day.allSame ? 'All close today' : 'Next closes today'
  const days = plural(day.nearest, 'day')
  return day.allSame ? `Closes in ${days}` : `Next closes in ${days}`
}

/** Countdown-chip version of the closing clause (tenth pass, same reasoning
 *  as `scheduledCountdown` above) — no period, meant to stand alone next to
 *  the row's course chips rather than open a sentence. */
export function liveCountdown(live: PceSurvey[]): string | null {
  return liveClosingClause(live)
}

/** Which live courses are behind `AT_RISK_THRESHOLD`, and each one's rate —
 *  feeds the row's course chips (tenth pass: "which courses hasn't
 *  started?" — chips name them; at-risk ones carry their rate inline so the
 *  urgent row shows both WHICH course and HOW far behind at a glance). */
export function liveAtRiskCodes(live: PceSurvey[]): Set<string> {
  return new Set(live.filter((s) => s.responseRate < AT_RISK_THRESHOLD).map((s) => s.courseCode))
}

export function courseRates(surveys: PceSurvey[]): Record<string, number> {
  return Object.fromEntries(surveys.map((s) => [s.courseCode, s.responseRate]))
}

/** One-line consequence for the Live row when it qualifies as urgent (has
 *  at-risk courses) — shorter than the old combined `liveNarrative` since
 *  the chips now carry the "which courses" and "how far behind" facts; this
 *  just states why it's worth acting on. Only rendered on the urgent
 *  variant — calm Live rows show chips + countdown with no narrative line
 *  at all (tenth pass: give visual weight to what's actually urgent, not
 *  every row equally). */
export function liveUrgentConsequence(live: PceSurvey[]): string | null {
  const atRisk = live.filter((s) => s.responseRate < AT_RISK_THRESHOLD)
  if (atRisk.length === 0) return null
  return `${atRisk.length} of ${live.length} are behind target. Worth a reminder before it closes.`
}

/** Full-sentence narrative for the Live row's subtitle (eighth pass —
 *  Romit: "doesn't give context with any storytelling"). The prior version
 *  concatenated three disconnected facts with middle-dots — closing timing,
 *  raw average, at-risk count — leaving the reader to work out how they
 *  relate. This connects them into one story: when courses are behind, the
 *  response average becomes evidence FOR that claim ("2 of 3 courses are
 *  behind on responses (47% average)") rather than a fourth, unrelated
 *  number; when nothing's at risk, it just reports the average. Ties
 *  directly to the row's "Remind" action — the sentence explains why
 *  reminding matters, not just that a button exists. */
export function liveNarrative(live: PceSurvey[]): string | null {
  const closing = liveClosingClause(live)
  if (!closing) return null
  const rate = weightedRate(live)
  if (rate == null) return `${closing}.`
  const atRisk = live.filter((s) => s.responseRate < AT_RISK_THRESHOLD)
  if (atRisk.length > 0) {
    return `${closing}. ${atRisk.length} of ${live.length} courses are behind on responses (${rate}% average).`
  }
  return `${closing}. Responses are averaging ${rate}%.`
}

/** Full-sentence narrative for the Closed row's subtitle — replaces a
 *  redundant "29% closed" (the title "2 of 7 closed" already states that
 *  ratio) with the actual outcome: how collection landed once it ended.
 *  When `totalCourses` is passed and every course in it has closed, the
 *  sentence pivots from a status report to an invitation — there's nothing
 *  left to chase, so the reader's real next step is reading the results,
 *  not parsing another "N of N" ratio. */
export function closedNarrative(closed: PceSurvey[], totalCourses?: number): string | null {
  if (closed.length === 0) return null
  const rate = weightedRate(closed)
  const fullyClosed = totalCourses != null && closed.length === totalCourses
  if (fullyClosed) {
    return rate != null
      ? `Every course finished collecting, averaging ${rate}% response — the results below are ready to review.`
      : 'Every course finished collecting — the results below are ready to review.'
  }
  return rate != null
    ? `Finished collecting so far, averaging ${rate}% response.`
    : 'Finished collecting so far.'
}

/** "3 courses need setup" lead — same split as Scheduled/Live above,
 *  replacing the single run-on sentence ("5 courses need to be evaluated
 *  and 3 are in draft"). */
export function coverageLead(notConfiguredCount: number, draftCount: number): string | null {
  const total = notConfiguredCount + draftCount
  if (total === 0) return null
  return `${plural(total, 'course')} need${total === 1 ? 's' : ''} setup`
}

/** Detail as one sentence rather than a middle-dotted fragment pair
 *  (eighth pass — Romit: rows read as "numbers, metrics" with no
 *  storytelling). "1 course hasn't started and 1 is in draft" reads as a
 *  connected fact; "1 not started · 1 in draft" reads as two unrelated
 *  stats that happen to share a row. */
export function coverageDetail(notConfiguredCount: number, draftCount: number): string | null {
  const notStarted = notConfiguredCount > 0
    ? `${plural(notConfiguredCount, 'course')} ${notConfiguredCount === 1 ? "hasn't" : "haven't"} started`
    : null
  const draft = draftCount > 0
    ? `${plural(draftCount, 'course')} ${draftCount === 1 ? 'is' : 'are'} in draft`
    : null
  if (notStarted && draft) return `${notStarted} and ${draft}.`
  if (notStarted) return `${notStarted}.`
  if (draft) return `${draft}.`
  return null
}

/** Course codes behind the "need setup" row — not-configured + draft
 *  combined, matching `coverageLead`'s own grouping (tenth pass:
 *  identifiability — "2 courses need setup, which courses?"). */
export function coverageCodes(notConfiguredCodes: string[], draft: PceSurvey[]): string[] {
  return [...notConfiguredCodes, ...draft.map((s) => s.courseCode)].sort()
}

/** One-line consequence for the Setup row when it qualifies as urgent (term
 *  starts imminently and coverage is still low) — the compound condition
 *  Romit confirmed in the row-redesign plan, using the exact same reserved
 *  warning wash as the Live-urgent case rather than a new visual language. */
export function coverageUrgentConsequence(startsInDays: number, coveragePct: number): string {
  return `Term starts in ${plural(startsInDays, 'day')}. Only ${coveragePct}% covered so far.`
}

/** The dashboard footer's "8 live · 2 in review · 13 total" chip, expanded to
 *  every present bucket — Case 4: "ignore states with zero count."
 *
 *  Not-configured + draft collapse into one "N need setup" figure, matching
 *  the Setup row's own grouping (`coverageLead`) rather than splitting them
 *  back into two counts (UX audit, ninth pass: the row said "2 courses need
 *  setup" while this footer said "1 not set up · 1 draft" for the exact same
 *  two courses — same buckets, two different content models on one card). */
export function breakdownSummary(b: CourseBreakdown): string {
  const parts: string[] = []
  const needSetup = b.notConfiguredCount + b.draft.length
  if (needSetup > 0) parts.push(`${needSetup} need${needSetup === 1 ? 's' : ''} setup`)
  if (b.scheduled.length > 0) parts.push(`${b.scheduled.length} scheduled`)
  if (b.live.length > 0) parts.push(`${b.live.length} live`)
  if (b.closed.length > 0) parts.push(`${b.closed.length} closed`)
  parts.push(`${b.totalCourses} total`)
  return parts.join(' · ')
}

/** ≥1 survey for this term has actually finished (pending_review | closed |
 *  released) — the precondition for any score-derived figure. Nothing has
 *  closed yet → there is nothing to score, regardless of how far along
 *  setup otherwise is (a term can be 100% scheduled and still have zero
 *  finished surveys). */
export function termHasFinishedSurveys(term: ProgramTerm, ce: PceSurvey[]): boolean {
  return ce.some((s) => s.term === term.name && FINISHED(s))
}

/* ── the one "what should this admin do next" answer, shared by the Getting
 * Started strip, the Live-term card's primary action, and (implicitly) every
 * other affordance on the dashboard — a single ordered model instead of each
 * surface guessing independently (Romit, 2026-09-02: "Getting started card
 * isn't connected with any actions, nor is it showing... any action that the
 * user needs to do"). Every destination below is a route a term-card row
 * already navigates to — this never invents a new one, it just decides WHICH
 * existing one is the one that matters right now. ────────────────────────── */

export type TermSetupStage =
  | 'no-term' | 'no-courses' | 'no-template' | 'not-configured'
  | 'drafts' | 'live-at-risk' | 'live-healthy' | 'scheduled'
  | 'awaiting-review' | 'released'

export interface TermNextAction {
  stage: TermSetupStage
  /** Identical wording to the term-card row that owns this action — the
   *  Getting Started strip and the card must never disagree on the verb. */
  label: string
  href?: string
  external?: boolean
  /** True next-action navigation, e.g. opening the term-creation sheet — the
   *  one stage (`no-term`) with no href at all. */
  onClick?: () => void
  /** One sentence, state-specific — why THIS is the next thing, not a
   *  generic description repeated for every account. */
  why: string
}

/** Tiers, first match wins. Urgency (A) outranks sequence (B/C/D) because a
 *  live collection window is time-boxed and unrecoverable once it closes,
 *  while setup work (connecting courses, writing a survey) can happen any
 *  time before the window opens — reminding a lagging live course matters
 *  more right now than finishing an unrelated draft. */
export function nextTermAction(
  snap: TermSnapshot | null,
  b: CourseBreakdown | null,
  opts: { hasTemplates: boolean; onAdd?: () => void },
): TermNextAction {
  if (!snap) {
    return {
      stage: 'no-term',
      label: 'Set up term',
      onClick: opts.onAdd,
      why: 'No term is set up yet — evaluations need term dates before anything else can happen.',
    }
  }
  const { term } = snap

  // A · urgent — a live course is already below the response target.
  if (b && b.live.length > 0 && (liveAtRiskCodes(b.live).size > 0 || (snap.rate != null && snap.rate < RESPONSE_TARGET))) {
    return {
      stage: 'live-at-risk',
      label: 'Remind',
      href: `/surveys/remind?from=term:${term.id}`,
      why: `${b.live.length} live evaluation${b.live.length === 1 ? ' is' : 's are'} running behind the ${RESPONSE_TARGET}% target — a reminder now still has time to help.`,
    }
  }

  // B · blocked — nothing can proceed until this exists.
  if (!b) {
    return {
      stage: 'no-courses',
      label: 'Add courses',
      href: prismCoursesHref(),
      external: true,
      why: `${term.name} has no course offerings connected yet, so there's nothing to evaluate.`,
    }
  }
  if (!opts.hasTemplates) {
    return {
      stage: 'no-template',
      label: 'Create template',
      href: '/templates/new',
      why: 'No survey template exists yet, so nothing can go out to courses.',
    }
  }

  // C · sequence — courses exist, work through them in order.
  if (b.notConfiguredCount > 0) {
    return {
      stage: 'not-configured',
      label: 'Schedule',
      href: `/surveys/push?term=${term.id}`,
      why: `${b.notConfiguredCount} course${b.notConfiguredCount === 1 ? '' : 's'} still have no evaluation scheduled.`,
    }
  }
  if (b.draft.length > 0) {
    return {
      stage: 'drafts',
      label: 'Finish',
      href: `/surveys/push?term=${term.id}`,
      why: `${b.draft.length} draft${b.draft.length === 1 ? '' : 's'} started but never sent — finish setting ${b.draft.length === 1 ? 'it' : 'them'} up.`,
    }
  }

  // D · steady state — everything scheduled or further along.
  if (b.live.length > 0) {
    return {
      stage: 'live-healthy',
      label: 'Monitor',
      href: `/course-evaluation/term/${term.id}?tab=active`,
      why: `${b.live.length} evaluation${b.live.length === 1 ? ' is' : 's are'} collecting on target — keep an eye on response rate.`,
    }
  }
  if (b.scheduled.length > 0) {
    return {
      stage: 'scheduled',
      label: 'Update',
      href: `/course-evaluation/term/${term.id}?tab=active`,
      why: `${b.scheduled.length} evaluation${b.scheduled.length === 1 ? ' is' : 's are'} scheduled and waiting on its open date.`,
    }
  }
  if (snap.pending > 0) {
    return {
      stage: 'awaiting-review',
      label: 'Review',
      href: `/course-evaluation/term/${term.id}?tab=finished`,
      why: `${snap.pending} evaluation${snap.pending === 1 ? ' is' : 's are'} closed and waiting on review.`,
    }
  }
  return {
    stage: 'released',
    label: 'View analytics',
    href: `/analytics?tab=term&term=${encodeURIComponent(term.name)}`,
    why: `${term.name} is fully published — see how it performed.`,
  }
}
