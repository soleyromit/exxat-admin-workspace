/**
 * Send several drafts at once (Romit 2026-10-27: "How can I send multiple logs for skill evaluation?"; LEDGER D-L18).
 *
 * The student ticks drafts in My requests, Drafts, and sends them together. The review groups them by who signs off and where:
 * each group is one request with one link [REQ ST-04 several skills in one submission; LEDGER D-L2 one link per request]. A draft
 * missing what the program requires (the date performed, an evaluator) is flagged and filled once in the review [REQ ST-10]; a lab
 * or simulation draft can only go to a lab instructor or faculty, never a preceptor [REQ ST-05, ST-08, ST-09; hard stop: lab never
 * meets a clinical minimum]. Pure functions: each returns new state and never mutates its input.
 */
import type { Submission, V2State } from "@/lib/v2/types"
import { personById } from "@/lib/v2/evidence-index"
import { loggedNotSent, labNow, type LoggedSitting } from "./logged"
import { evaluatorsFor, type EvaluatorOption } from "./student2"

/** What the student filled in the review, by draft id. */
export type DraftFixes = Record<string, { date?: string; who?: string }>

export interface DraftIssue {
  field: "date" | "who"
  message: string
}

export interface DraftReviewRow {
  draft: LoggedSitting
  date: string
  who: string | null
  /** Who may sign this draft: the place and the skills decide (a lab draft never lists a preceptor). */
  options: EvaluatorOption[]
  issues: DraftIssue[]
}

export interface DraftGroup {
  key: string
  who: string
  whoName: string
  role: string
  where: string
  location: string | null
  rows: DraftReviewRow[]
  skillIds: string[]
}

export interface DraftReview {
  rows: DraftReviewRow[]
  groups: DraftGroup[]
  /** Drafts that still need something before they can go. */
  blocked: DraftReviewRow[]
  ready: boolean
}

export function reviewDrafts(s: V2State, studentId: string, batchIds: string[], fixes: DraftFixes = {}): DraftReview {
  const all = loggedNotSent(s, studentId).filter((d) => batchIds.includes(d.batchId))
  const rows: DraftReviewRow[] = all.map((d) => {
    const fix = fixes[d.batchId] ?? {}
    const date = (fix.date ?? d.date ?? "").trim()
    const options = evaluatorsFor(s, d.skillIds, d.location, d.setting)
    const asked = fix.who ?? d.who ?? null
    const pick = asked ? options.find((o) => o.id === asked) : undefined
    const who = pick && pick.eligible ? pick.id : null
    const issues: DraftIssue[] = []
    if (!date) issues.push({ field: "date", message: "Enter the date performed." })
    if (!who) {
      issues.push({
        field: "who",
        message: asked && !pick && d.setting !== "clinical" ? "A lab instructor or faculty signs lab and simulation work. Choose one." : asked && pick && !pick.eligible ? (pick.reason ?? "This evaluator cannot sign these skills. Choose another.") : "Choose who signs off.",
      })
    }
    return { draft: d, date, who, options, issues }
  })
  const groups = new Map<string, DraftGroup>()
  for (const r of rows) {
    if (r.issues.length || !r.who) continue
    const key = `${r.who}|${r.draft.where}`
    const g = groups.get(key)
    if (g) {
      g.rows.push(r)
      for (const k of r.draft.skillIds) if (!g.skillIds.includes(k)) g.skillIds.push(k)
    } else {
      const o = r.options.find((x) => x.id === r.who)
      groups.set(key, { key, who: r.who, whoName: o?.name ?? personById(s, r.who)?.name ?? "Evaluator", role: o?.role ?? "", where: r.draft.where, location: r.draft.location, rows: [r], skillIds: [...r.draft.skillIds] })
    }
  }
  const blocked = rows.filter((r) => r.issues.length > 0)
  return { rows, groups: [...groups.values()], blocked, ready: rows.length > 0 && blocked.length === 0 }
}

export interface DraftSendResult {
  state: V2State
  requests: Array<{ id: string; who: string; whoName: string; skillIds: string[] }>
  evaluators: number
}

/**
 * Sends every group as one request: its drafts' entries carry the request id (they leave Drafts and wait in My requests), the date
 * filled in the review is written back to each draft, and the one note is the first note any of its drafts carries [REQ ST-12].
 * Nothing is sent while any selected draft is blocked.
 */
export function sendDraftGroups(s: V2State, studentId: string, review: DraftReview, at: string = labNow()): DraftSendResult {
  if (!review.ready) return { state: s, requests: [], evaluators: 0 }
  let state = s
  const requests: DraftSendResult["requests"] = []
  review.groups.forEach((g, i) => {
    const id = `req-lab-${Date.parse(at).toString(36)}-${i + 1}`
    const batchIds = g.rows.map((r) => r.draft.batchId)
    const dateOf = new Map(g.rows.map((r) => [r.draft.batchId, r.date]))
    const entryIds = state.logEntries.filter((e) => batchIds.includes(e.batchId) && e.studentId === studentId && e.requestId === null).map((e) => e.id)
    const note = g.rows.map((r) => r.draft.note.trim()).find(Boolean)
    const sub: Submission = { id, studentId, skillIds: g.skillIds, method: "link", status: "with-evaluator", assignedToId: g.who, createdAt: at, daysWaiting: 0, candidateIds: [g.who], entryIds, ...(note ? { studentNote: note } : {}) }
    state = {
      ...state,
      submissions: [...state.submissions, sub],
      logEntries: state.logEntries.map((e) => (entryIds.includes(e.id) ? { ...e, requestId: id, ...(e.sitting ? { sitting: { ...e.sitting, date: dateOf.get(e.batchId) ?? e.sitting.date } } : {}) } : e)),
    }
    requests.push({ id, who: g.who, whoName: g.whoName, skillIds: g.skillIds })
  })
  return { state, requests, evaluators: new Set(requests.map((r) => r.who)).size }
}

/** "Sent 2 requests to 2 evaluators." */
export function sentSentence(r: Pick<DraftSendResult, "requests" | "evaluators">): string {
  const n = r.requests.length
  const m = r.evaluators
  return `Sent ${n} ${n === 1 ? "request" : "requests"} to ${m} ${m === 1 ? "evaluator" : "evaluators"}.`
}
