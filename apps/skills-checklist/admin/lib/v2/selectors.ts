import type { V2State } from "./types"
import { waitingFor } from "./preceptor"
import { approvalsBadgeCount } from "./approvals"
import { isConfigured, populationRows, populationTotals } from "./population"
import { unsentEntries } from "./student"
import { verificationRows } from "./verification"

export interface CounterDef {
  id: string
  label: string
  value: (s: V2State) => number
}

const students = (s: V2State) => s.people.filter((p) => p.kind === "student")

export const COUNTERS: CounterDef[] = [
  { id: "skills", label: "Skills in the library", value: (s) => s.skills.length },
  { id: "libraries", label: "Specialty libraries", value: (s) => new Set(s.skills.map((k) => k.specialty)).size },
  { id: "unconfigured", label: "Skills still to configure", value: (s) => s.skills.filter((k) => !isConfigured(k)).length },
  { id: "published", label: "Skills in use", value: (s) => s.skills.filter((k) => k.published).length },
  { id: "mapped", label: "Skills mapped to the focus course", value: (s) => s.mappings.filter((m) => m.courseId === s.course.id).length },
  // One definition with the dashboard: each student's mandatory skills from their own cohort's offerings this term.
  { id: "mandatory", label: "Mandatory skill records this term", value: (s) => populationTotals(populationRows(s)).records },
  { id: "behind", label: "Students behind the term clock", value: (s) => populationTotals(populationRows(s)).behind },
  { id: "students", label: "Students in the cohort", value: (s) => students(s).length },
  { id: "evalsCounted", label: "Evaluations that count", value: (s) => s.evaluations.filter((e) => e.status === "counted").length },
  { id: "evalsWaiting", label: "Evaluations awaiting approval", value: (s) => s.evaluations.filter((e) => e.status === "awaiting-approval").length },
  { id: "evalsReopened", label: "Reopened evaluations", value: (s) => s.evaluations.filter((e) => e.status === "reopened").length },
  { id: "versions", label: "Evaluation versions on record", value: (s) => s.evaluations.reduce((n, e) => n + e.versions.length, 0) },
  { id: "queueWaiting", label: "Requests in the review queue", value: (s) => s.submissions.filter((x) => x.status === "awaiting-review").length },
  { id: "stalled", label: "Stalled requests", value: (s) => s.submissions.filter((x) => x.status === "stalled").length },
  { id: "returned", label: "Requests returned to students", value: (s) => s.submissions.filter((x) => x.status === "returned").length },
  { id: "withEvaluator", label: "Requests with an evaluator", value: (s) => s.submissions.filter((x) => x.status === "with-evaluator").length },
  { id: "syncQueued", label: "Changes queued offline", value: (s) => s.syncQueue.filter((x) => x.state === "queued").length },
  { id: "syncSynced", label: "Changes synced", value: (s) => s.syncQueue.filter((x) => x.state === "synced").length },
  { id: "syncFailed", label: "Changes that failed to sync", value: (s) => s.syncQueue.filter((x) => x.state === "failed").length },
  { id: "syncConflict", label: "Sync conflicts", value: (s) => s.syncQueue.filter((x) => x.state === "conflict").length },
  { id: "concerns", label: "Confidential concerns (faculty only)", value: (s) => s.concerns.length },
  { id: "remediations", label: "Open remediation plans", value: (s) => s.remediations.filter((r) => r.status !== "closed").length },
  { id: "verified", label: "Student records verified", value: (s) => verificationRows(s).filter((r) => r.status === "verified").length },
  { id: "audit", label: "Audit log entries", value: (s) => s.audit.length },
]

export const COUNTER_BY_ID: Record<string, CounterDef> = Object.fromEntries(COUNTERS.map((c) => [c.id, c]))

export function personName(s: V2State, id: string): string {
  return s.people.find((p) => p.id === id)?.name ?? "Unknown person"
}

export function skillName(s: V2State, id: string): string {
  return s.skills.find((k) => k.id === id)?.name ?? "Unknown skill"
}

/** Nav badge: approval queue entries in the default scope (current term), the one definition in lib/v2/approvals.ts. */
export function approvalsBadge(s: V2State): number {
  return approvalsBadgeCount(s)
}

/** Nav badge: requests waiting for this evaluator (preceptor Requests). */
export function evaluatorRequestsBadge(s: V2State, actorId: string): number {
  return waitingFor(s, actorId).length
}

/** Nav badge: the student's entries that are ready to send (student Requests). */
export function unsentRequestsBadge(s: V2State): number {
  return unsentEntries(s).length
}
