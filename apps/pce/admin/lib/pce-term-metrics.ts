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

/** Course coverage for a term: how many offerings have a non-draft evaluation. */
export function coverageFor(
  termId: string,
  termSurveys: PceSurvey[],
): { surveyed: number; total: number } | null {
  const offerings = activeOfferings().filter((o) => o.termId === termId)
  if (offerings.length === 0) return null
  const surveyedCodes = new Set(
    termSurveys.filter((s) => s.status !== 'draft').map((s) => s.courseCode),
  )
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
  }
}
