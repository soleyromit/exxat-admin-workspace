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
import type { StatusBadgeTone } from '@exxatdesignux/ui'

export const RESPONSE_TARGET = 70

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
  const t = new Date(dateStr).getTime()
  return Number.isFinite(t) ? Math.ceil((t - Date.now()) / 86_400_000) : null
}

/** Evaluation window closes a week after the term ends. */
export function daysUntilClose(term: ProgramTerm): number | null {
  const close = new Date(term.endDate)
  close.setDate(close.getDate() + 7)
  const diff = Math.ceil((close.getTime() - Date.now()) / 86_400_000)
  return diff > 0 ? diff : null
}

export function evalWindow(term: ProgramTerm): { open: string; close: string } {
  if (!term.startDate || !term.endDate) return { open: '—', close: '—' }
  const closeDate = new Date(term.endDate)
  closeDate.setDate(closeDate.getDate() + 7)
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return { open: fmt(new Date(term.startDate)), close: fmt(closeDate) }
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

/**
 * The current cycle = the latest term whose evaluation window is OPEN today
 * (it has started, and today is on/before close = endDate + 7d). Returns null
 * when nothing is active: a brand-new program, a pre-launch upcoming term, or
 * the gap between a finished term and the next one. Undated terms are never
 * current (a term you haven't scheduled can't be the one collecting responses).
 */
export function currentTermId(): string | null {
  const today = new Date().toISOString().slice(0, 10)
  const open = activeTerms()
    .filter((t) => {
      if (!t.startDate || !t.endDate) return false
      const close = new Date(t.endDate)
      close.setDate(close.getDate() + 7)
      const closeIso = close.toISOString().slice(0, 10)
      return t.startDate <= today && today <= closeIso
    })
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
  return open.at(-1)?.id ?? null
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
  return {
    term,
    stage,
    rate: weightedRate(list),
    total: list.length,
    live: live.length,
    atRisk: live.filter((s) => s.responseRate < AT_RISK_THRESHOLD).length,
    closingThisWeek,
    pending,
    released,
    daysLeft: stage === 'live' ? daysUntilClose(term) : null,
    coverage: coverageFor(term.id, list),
    draftCount: list.filter((s) => s.status === 'draft').length,
  }
}
