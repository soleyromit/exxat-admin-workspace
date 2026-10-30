/**
 * Admin Approvals, "New evaluators" tab (Romit 2026-10-27, "sure"): the evaluator names students typed through "Someone not listed"
 * that the program has not confirmed yet. One row per name, read from the evaluator directory (lib/lab/evaluators.ts `directory`,
 * never recounted here) with who added the name, for which request, and how many sign-offs wait on it.
 *
 * The count is the facts registry's `unverifiedEvaluators` (people of an evaluator kind with verified === false), the same number
 * as the dashboard tile "Evaluators not yet verified": `directory().summary.awaiting` uses the same predicate, and
 * tests/lab/new-evaluators.test.ts pins the three equal.
 *
 * Where evaluator records live is OD-05 and stays undecided: this only says where the admin acts on a typed name. Confirm and merge
 * are the existing reviewer decisions (`adopt` in lib/lab/reviewer.ts), so the queue, the dashboard and the directory move together.
 */
import type { Submission, V2State } from "@/lib/v2/types"
import { personById, skillById } from "@/lib/v2/evidence-index"
import { directory, type EvaluatorRow } from "./evaluators"
import { appendAudit } from "@/lib/v2/store"

export interface NewEvaluatorRow extends Record<string, unknown> {
  id: string
  name: string
  email: string
  site: string
  roleLabel: string
  /** The student who first named this evaluator. */
  addedById: string | null
  addedBy: string
  /** The skills of that student's first request or evaluation with this name ("Sputum and 2 more"). */
  request: string
  /** Signed evaluations held until the name is confirmed or merged. */
  waiting: number
  /** Requests still open with this name (not signed yet). */
  openRequests: number
  haystack: string
}

const short = (names: string[]) => (names.length > 1 ? `${names[0]} and ${names.length - 1} more` : (names[0] ?? ""))

export function newEvaluatorRows(s: V2State): NewEvaluatorRow[] {
  const rows = directory(s).rows.filter((r: EvaluatorRow) => !r.verified)
  return rows
    .map((r) => {
      const evals = s.evaluations.filter((e) => e.evaluatorId === r.id).sort((a, b) => (a.date < b.date ? -1 : 1))
      const subs = s.submissions.filter((x) => x.assignedToId === r.id || (x.candidateIds ?? []).includes(r.id)).sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
      const firstEval = evals[0]
      const firstSub = subs[0]
      const studentId = (firstSub && (!firstEval || firstSub.createdAt <= firstEval.date) ? firstSub.studentId : firstEval?.studentId) ?? null
      const skillIds = firstSub && studentId === firstSub.studentId ? firstSub.skillIds : evals.filter((e) => e.studentId === studentId).map((e) => e.skillId)
      const names = [...new Set(skillIds)].map((id) => skillById(s, id)?.name ?? "").filter(Boolean)
      return {
        id: r.id,
        name: r.name,
        email: r.email,
        site: r.site,
        roleLabel: r.roleLabel,
        addedById: studentId,
        addedBy: studentId ? (personById(s, studentId)?.name ?? "A student") : "A student",
        request: short(names),
        waiting: r.held,
        openRequests: r.openRequests,
        haystack: `${r.name} ${r.email} ${r.site}`.toLowerCase(),
      }
    })
    .sort((a, b) => b.waiting - a.waiting || a.name.localeCompare(b.name))
}

/** Adopted evaluators a name can be merged into: every one, suggested matches first (the directory's `mergeCandidates` order). */
export function mergeTargets(s: V2State, suggestedIds: readonly string[]): Array<{ id: string; name: string; email: string; site: string; suggested: boolean }> {
  const all = directory(s).rows.filter((r) => r.verified)
  const rank = (id: string) => {
    const i = suggestedIds.indexOf(id)
    return i < 0 ? Infinity : i
  }
  return all
    .map((r) => ({ id: r.id, name: r.name, email: r.email, site: r.site, suggested: suggestedIds.includes(r.id) }))
    .sort((a, b) => rank(a.id) - rank(b.id) || a.name.localeCompare(b.name))
}

// ---------------------------------------------------------------------------------------------------------------------
// A name typed on Send reaches the directory [REQ SL-09, ST-09]

export interface NamedEvaluatorInput {
  studentId: string
  name: string
  email: string
  /** Lab or simulation names a lab instructor; clinical names a preceptor (REQ ST-08). */
  kind: "preceptor" | "lab-instructor"
  skillIds: string[]
  siteId?: string
}

const normEmail = (e: string) => e.trim().toLowerCase()

/**
 * Records the evaluator a student named through "Someone not listed" and the link request to them, in the shared store, so the
 * name appears at once in Settings, Evaluators and Approvals, New evaluators as "Not verified" for the program to adopt or merge
 * [REQ SL-09]. One person per email: a second request to the same email reuses the existing record (verified or not), so the
 * same person does not pile up under several spellings; a near spelling with a new email is left for "Adopt or merge".
 * Pure; the Send screen calls it inside store.update.
 */
export function recordNamedEvaluator(s: V2State, input: NamedEvaluatorInput, at: string): { state: V2State; personId: string; requestId: string; reused: boolean } {
  const name = input.name.trim().replace(/\s+/g, " ")
  const email = input.email.trim()
  const existing = s.people.find((p) => !!p.email && normEmail(p.email) === normEmail(email) && (p.kind === "preceptor" || p.kind === "lab-instructor" || p.kind === "faculty"))
  let people = s.people
  let personId: string
  if (existing) personId = existing.id
  else {
    const taken = new Set(s.people.map((p) => p.id))
    let k = s.people.length + 1
    while (taken.has(`p-named-${k}`)) k++
    personId = `p-named-${k}`
    people = [...s.people, { id: personId, name, title: input.kind === "lab-instructor" ? "Lab instructor" : "Preceptor", kind: input.kind, email, verified: false, ...(input.siteId ? { homeSiteId: input.siteId } : {}) }]
  }
  const takenSubs = new Set(s.submissions.map((x) => x.id))
  let n = s.submissions.length + 1
  while (takenSubs.has(`sub-named-${n}`)) n++
  const requestId = `sub-named-${n}`
  const request: Submission = {
    id: requestId,
    studentId: input.studentId,
    skillIds: [...input.skillIds],
    method: "link",
    status: "with-evaluator",
    assignedToId: personId,
    candidateIds: [personId],
    createdAt: at,
    daysWaiting: 0,
    ...(input.siteId ? { siteId: input.siteId } : {}),
  }
  const state = appendAudit({ ...s, people, submissions: [...s.submissions, request] }, input.studentId, "Named an evaluator", `${existing?.name ?? name} (${email})`, at)
  return { state, personId, requestId, reused: !!existing }
}
