import { daysFrom, findTerm } from "./filters"
import { compareEvaluation, queueItems, type Agreement, type QueueItem } from "./queue"
import { DEMO_TODAY } from "./seed-core"
import { EVALUATOR_NOT_ASSIGNED_LABEL } from "./labels"
import type { Evaluation, Term, V2State } from "./types"

/**
 * The one definition of "awaiting approval" (data layer, no screen copy beyond cause labels).
 *
 * What is held, and why [REQ SC-15, AR-01; LEDGER: unverified evaluator = awaiting approval decision]:
 * - status rows: evaluations stored with status "awaiting-approval" (the SC-15 rule hold) and submissions stored as
 *   "awaiting-review" with no outcome yet (a paper form to enter);
 * - unverified evaluator: an evaluation signed by an evaluator name the program has not adopted (Person.verified === false) is
 *   held for the reviewer's decision even though the record stores it as counted. `heldState` reads it as awaiting approval,
 *   so it never counts toward achievement anywhere (pending never counts, REQ AE-01).
 *
 * Each queue entry carries its causes: paper form to enter, new evaluator name, self and evaluator disagree, and rule needs
 * approval, which applies only when a held evaluation sits on a skill whose configuration asks for approval
 * (`config.approvalRequired`, SC-15). The generator puts every stored hold on such a skill (dataset spec section 12.7). Aging
 * (waiting AGING_DAYS or more) is an overlay on any cause, not a cause.
 *
 * Every screen that shows a waiting-for-approval figure (nav badge, dashboard figure and exception tab, approvals queue,
 * student record, director, facts registry) reads `approvalsInScope` or `approvalEntries`, so the totals agree by construction.
 */

/** Waiting this many days or more is aging (N-11). */
export const AGING_DAYS = 8
/** Approvals older than this nudge the reviewer (N-09). */
export const NUDGE_DAYS = 3
/** The dashboard's "awaiting approval for more than N days" line. */
export const APPROVAL_OLD_DAYS = 10

export type HeldCause = "paper" | "new-evaluator" | "disagree" | "rule"
export const CAUSE_ORDER: HeldCause[] = ["new-evaluator", "rule", "disagree", "paper"]
export const CAUSE_LABEL: Record<HeldCause, string> = {
  "new-evaluator": EVALUATOR_NOT_ASSIGNED_LABEL,
  // Plain words for why a submission is here (Romit 2026-10-27: "what rule requires approval? I can't interpret it").
  rule: "Approval required",
  disagree: "Student and evaluator disagree",
  paper: "Paper form to enter",
}

// ---------------------------------------------------------------------------------------------------------------------
// The effective state

const heldCache = new WeakMap<V2State, V2State>()

/**
 * The store as every figure reads it: evidence from an evaluator name not adopted yet is awaiting approval. Idempotent (an
 * evaluation a reviewer already approved is left counted), so it is safe to apply to a state that already went through it.
 */
export function heldState(s: V2State): V2State {
  const hit = heldCache.get(s)
  if (hit) return hit
  const unverified = new Set(s.people.filter((p) => p.verified === false).map((p) => p.id))
  let changed = false
  const evaluations = unverified.size === 0 ? s.evaluations : s.evaluations.map((e) => {
    if (e.status !== "counted" || !unverified.has(e.evaluatorId) || e.review?.decision === "approved") return e
    changed = true
    return { ...e, status: "awaiting-approval" as const }
  })
  const out = changed ? { ...s, evaluations } : s
  heldCache.set(s, out)
  if (out !== s) heldCache.set(out, out)
  return out
}

/** True when this evaluation is held only because its evaluator name is not adopted yet. */
export const heldByUnverified = (s: V2State, e: Evaluation): boolean => e.status === "counted" && e.review?.decision !== "approved" && s.people.some((p) => p.id === e.evaluatorId && p.verified === false)

// ---------------------------------------------------------------------------------------------------------------------
// Queue entries

export interface ApprovalEntry {
  /** A queue key, or `unv:{evaluatorId}:{studentId}` for evidence from one unadopted evaluator for one student. */
  key: string
  kind: "submission" | "unverified"
  studentId: string
  evaluatorId: string | null
  skillIds: string[]
  evaluations: Evaluation[]
  /** The underlying queue item (the oldest one for a grouped entry). */
  item: QueueItem
  since: string
  days: number
  aging: boolean
  courseId: string
  needsOutcome: boolean
  agreement: Agreement | "none"
  causes: HeldCause[]
  /** The first cause, in the order above. */
  cause: HeldCause
}

function agreementOf(s: V2State, evals: Evaluation[]): Agreement | "none" {
  const cmp = evals.map((e) => compareEvaluation(s, e))
  if (cmp.some((c) => c.overall === "differed")) return "differed"
  if (cmp.some((c) => c.overall === "agreed")) return "agreed"
  return "none"
}

/**
 * The causes of one entry, in a fixed order. "rule" is listed whenever a held evaluation sits on a skill that asks for approval
 * (`ruleApplies`), after any other cause, so the first cause is unchanged. An entry always has a cause: when nothing applies (data
 * that breaks the invariant) "rule" is returned, and tests/v2/approvals-rule.test.ts fails on such data.
 */
export function heldReason(x: { needsOutcome: boolean; evaluatorUnverified: boolean; agreement: Agreement | "none"; ruleApplies?: boolean }): HeldCause[] {
  const out: HeldCause[] = []
  if (x.needsOutcome) out.push("paper")
  if (x.evaluatorUnverified) out.push("new-evaluator")
  if (x.agreement === "differed") out.push("disagree")
  if (x.ruleApplies === true || (out.length === 0 && x.ruleApplies === undefined)) out.push("rule")
  if (out.length === 0) out.push("rule")
  return out
}

/** True when an evaluation is held by the skill's approval rule (SC-15): stored hold, adopted evaluator, skill asks for approval. */
export function heldByRule(s: V2State, e: Evaluation): boolean {
  if (e.review?.decision === "approved") return false
  if (s.people.some((p) => p.id === e.evaluatorId && p.verified === false)) return false
  return e.status === "awaiting-approval" && !!s.skills.find((k) => k.id === e.skillId)?.config?.approvalRequired
}

const entryCache = new WeakMap<V2State, ApprovalEntry[]>()

/** Every entry waiting for a reviewer, oldest first, read from `heldState`. */
export function approvalEntries(state: V2State, today: string = DEMO_TODAY): ApprovalEntry[] {
  const s = heldState(state)
  if (today === DEMO_TODAY) {
    const hit = entryCache.get(s)
    if (hit) return hit
  }
  const unverified = (id: string | null) => !!id && s.people.some((p) => p.id === id && p.verified === false)
  const make = (key: string, kind: ApprovalEntry["kind"], item: QueueItem, skillIds: string[], evaluations: Evaluation[]): ApprovalEntry => {
    const days = Math.max(0, daysFrom(item.since, today))
    const needsOutcome = item.state === "needs-outcome"
    const agreement = agreementOf(s, evaluations)
    const causes = heldReason({ needsOutcome, evaluatorUnverified: unverified(item.evaluatorId), agreement, ruleApplies: evaluations.some((e) => heldByRule(s, e)) })
    return { key, kind, studentId: item.studentId, evaluatorId: item.evaluatorId, skillIds, evaluations, item, since: item.since, days, aging: days >= AGING_DAYS, courseId: evaluations[0]?.courseId ?? s.course.id, needsOutcome, agreement, causes, cause: causes[0] }
  }
  const out: ApprovalEntry[] = []
  const groups = new Map<string, QueueItem[]>()
  for (const item of queueItems(s)) {
    if (!item.submission && unverified(item.evaluatorId)) {
      const k = `unv:${item.evaluatorId}:${item.studentId}`
      groups.set(k, [...(groups.get(k) ?? []), item])
      continue
    }
    out.push(make(item.key, "submission", item, item.skillIds, item.evaluations))
  }
  for (const [key, list] of groups) {
    const oldest = list.slice().sort((a, b) => (a.since < b.since ? -1 : 1))[0]
    out.push(make(key, "unverified", oldest, [...new Set(list.flatMap((i) => i.skillIds))], list.flatMap((i) => i.evaluations)))
  }
  const sorted = out.sort((a, b) => (a.since < b.since ? -1 : a.since > b.since ? 1 : a.key.localeCompare(b.key)))
  if (today === DEMO_TODAY) entryCache.set(s, sorted)
  return sorted
}

// ---------------------------------------------------------------------------------------------------------------------
// Scope

/** The scope fields the queue honours. Structurally compatible with the lab scope. */
export interface ApprovalScope {
  cohort?: string
  group?: string
  course?: string
  /** Term id, name or slug; empty means the current term. */
  term?: string
}

export interface ScopedApprovals {
  entries: ApprovalEntry[]
  /** Entries for students in scope that reached the queue before the term started (still waiting). */
  earlier: number
  earlierTerm: string | null
  /** Every entry, before any scope. */
  total: number
  term: Term | null
}

/**
 * Entries in a scope: the student's cohort and group, the evidence's course, and the day it reached the queue inside the term.
 * The badge, the queue, the dashboard figure and its drill list all call this with the same scope.
 */
export function approvalsInScope(state: V2State, scope: ApprovalScope = {}, today: string = DEMO_TODAY): ScopedApprovals {
  const s = heldState(state)
  const all = approvalEntries(s, today)
  const term = findTerm(s, scope.term)
  const people = new Map(s.people.map((p) => [p.id, p]))
  const who = all.filter((e) => {
    const p = people.get(e.studentId)
    return (!scope.cohort || p?.cohort === scope.cohort) && (!scope.group || p?.group === scope.group) && (!scope.course || e.courseId === scope.course)
  })
  const day = (e: ApprovalEntry) => e.since.slice(0, 10)
  const entries = term ? who.filter((e) => day(e) >= term.start && day(e) <= term.end) : who
  const earlier = term ? who.filter((e) => day(e) < term.start).length : 0
  const prev = term ? (s.terms ?? []).filter((x) => x.end < term.start).sort((a, b) => (a.start < b.start ? 1 : -1))[0] : undefined
  return { entries, earlier, earlierTerm: prev?.name ?? null, total: all.length, term }
}

export interface ApprovalTotals {
  /** Queue entries (one per submission, or per unadopted evaluator and student). The nav badge. */
  entries: number
  /** Evaluations inside those entries; an entry with no outcome yet counts as one. */
  evaluations: number
  aging: number
  old: number
  overNudge: number
  byCause: Record<HeldCause, number>
  /** Of the evaluations: how many carry the stored "awaiting-approval" status, and how many are held only for an unadopted name. */
  statusRows: number
  unverifiedRows: number
  /** Entries with no outcome yet (paper forms). */
  paper: number
}

export function approvalTotals(state: V2State, entries: ApprovalEntry[]): ApprovalTotals {
  const byCause = { "new-evaluator": 0, rule: 0, disagree: 0, paper: 0 } as Record<HeldCause, number>
  for (const e of entries) byCause[e.cause]++
  // The raw store says which evaluations carry the stored status; anything else in the queue is held for an unadopted name.
  const stored = new Map(state.evaluations.map((e) => [e.id, e.status]))
  const evs = entries.flatMap((e) => e.evaluations)
  return {
    entries: entries.length,
    evaluations: entries.reduce((n, e) => n + Math.max(1, e.evaluations.length), 0),
    aging: entries.filter((e) => e.aging).length,
    old: entries.filter((e) => e.days > APPROVAL_OLD_DAYS).length,
    overNudge: entries.filter((e) => e.days > NUDGE_DAYS).length,
    byCause,
    statusRows: evs.filter((e) => stored.get(e.id) !== "counted").length,
    unverifiedRows: evs.filter((e) => stored.get(e.id) === "counted").length,
    paper: entries.filter((e) => e.needsOutcome).length,
  }
}

/** The Approvals nav badge for a scope (the default scope is the current term, every cohort). */
export const approvalsBadgeCount = (s: V2State, scope: ApprovalScope = {}, today: string = DEMO_TODAY): number => approvalsInScope(s, scope, today).entries.length
