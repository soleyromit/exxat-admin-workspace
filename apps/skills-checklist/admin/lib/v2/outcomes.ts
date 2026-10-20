import type { Result } from "./admin-actions"
import { appendAudit } from "./store"
import type { Evaluation, EvaluationDetail, EvaluationVersion, Outcome, Person, Remediation, RoleId, Skill, V2State } from "./types"

/**
 * Stage 3: what an outcome does next. Remediation plans, reopening a completed evaluation with a new version, and who may see a
 * confidential concern. Pure; every function returns a new state and never mutates its input. A past version is never changed.
 */

export const OUTCOME_WORD: Record<Outcome, string> = { met: "Met", "not-met": "Did not meet the criteria", "not-yet": "Not yet, feedback only" }

/** Roles that may read a confidential concern. A student and a preceptor never can. */
const CONCERN_ROLES: RoleId[] = ["admin", "reviewer", "director"]

export const isStaff = (p: Person | undefined): p is Person => !!p && (p.kind === "admin" || p.kind === "reviewer" || p.kind === "director")

export function nextIdFor(prefix: string, ids: string[]): string {
  const max = ids.reduce((m, id) => (id.startsWith(`${prefix}-`) && /^\d+$/.test(id.slice(prefix.length + 1)) ? Math.max(m, Number(id.slice(prefix.length + 1))) : m), 0)
  return `${prefix}-${max + 1}`
}

const nameOf = (s: V2State, id: string) => s.people.find((p) => p.id === id)?.name ?? "Unknown person"
const skillOf = (s: V2State, id: string) => s.skills.find((k) => k.id === id)

// ---------------------------------------------------------------------------------------------------------------------
// Confidential concerns (faculty only, never the student)

/** Concerns the role may read. The student and the preceptor get none. */
export function concernsFor(s: V2State, role: RoleId) {
  return CONCERN_ROLES.includes(role) ? s.concerns : []
}

// ---------------------------------------------------------------------------------------------------------------------
// Remediation plans

export const DEFAULT_PLAN_STEPS = [
  "Review the criteria and the evaluator's feedback with your clinical coordinator",
  "Practice the skill in the skills lab",
  "Make a supervised attempt with a qualified evaluator",
]

const isOpenPlan = (r: Remediation) => r.status !== "closed"

export function planStatus(steps: Remediation["steps"]): "open" | "in-progress" {
  return steps.some((x) => x.done) ? "in-progress" : "open"
}

export const PLAN_STATUS_LABEL: Record<Remediation["status"], string> = { open: "Open, not started", "in-progress": "In progress", closed: "Closed" }

export function planFor(s: V2State, id: string): Remediation | undefined {
  return s.remediations.find((r) => r.id === id)
}

/** The plans a student can read: their own only. */
export function plansOf(s: V2State, studentId: string): Remediation[] {
  return s.remediations.filter((r) => r.studentId === studentId).slice().sort((a, b) => Number(isOpenPlan(b)) - Number(isOpenPlan(a)))
}

/** The skill's failure path says a fail opens a plan without anyone asking (SC-17 family). */
export const opensPlanAutomatically = (skill: Skill | undefined) => !!skill?.config?.failure.autoRemediation

/**
 * Opens a plan for a failed skill, or adds a note to the plan that is already open for the same student and skill. Callers decide
 * whether a plan is wanted; this only builds it. Returns whether a new plan was created.
 */
export function openPlan(s: V2State, input: { studentId: string; skillId: string; evaluationId: string; actorId: string }, at: string): { state: V2State; plan: Remediation; created: boolean } {
  const existing = s.remediations.find((r) => r.studentId === input.studentId && r.skillId === input.skillId && isOpenPlan(r))
  const skillName = skillOf(s, input.skillId)?.name ?? "A skill"
  if (existing) {
    const plan: Remediation = { ...existing, notes: [...(existing.notes ?? []), { at, text: `Another attempt did not meet the criteria (${input.evaluationId}).` }] }
    const state = appendAudit({ ...s, remediations: s.remediations.map((r) => (r.id === existing.id ? plan : r)) }, input.actorId, "Added a note to the open remediation plan", `${skillName} for ${nameOf(s, input.studentId)}`, at)
    return { state, plan, created: false }
  }
  const plan: Remediation = {
    id: nextIdFor("rem", s.remediations.map((r) => r.id)),
    studentId: input.studentId,
    skillId: input.skillId,
    status: "open",
    steps: DEFAULT_PLAN_STEPS.map((label) => ({ label, done: false })),
    evaluationId: input.evaluationId,
    openedAt: at,
    openedById: input.actorId,
  }
  const state = appendAudit({ ...s, remediations: [...s.remediations, plan] }, input.actorId, "Opened a remediation plan", `${skillName} for ${nameOf(s, input.studentId)}`, at)
  return { state, plan, created: true }
}

/** Staff open a plan by hand from a failed evaluation, for a skill whose failure path does not open one on its own. */
export function openPlanByHand(s: V2State, evaluationId: string, actorId: string, at: string): Result<{ remediationId: string; created: boolean }> {
  if (!isStaff(s.people.find((p) => p.id === actorId))) return { ok: false, error: "Only program staff can open a remediation plan." }
  const e = s.evaluations.find((x) => x.id === evaluationId)
  if (!e) return { ok: false, error: "That evaluation does not exist." }
  if (e.outcome !== "not-met") return { ok: false, error: "A plan opens from an evaluation that did not meet the criteria. This one does not." }
  const r = openPlan(s, { studentId: e.studentId, skillId: e.skillId, evaluationId: e.id, actorId }, at)
  return { ok: true, state: r.state, remediationId: r.plan.id, created: r.created }
}

export function setStepDone(s: V2State, planId: string, index: number, done: boolean, actorId: string, at: string): Result<object> {
  if (!isStaff(s.people.find((p) => p.id === actorId))) return { ok: false, error: "Only program staff can update a remediation plan." }
  const plan = planFor(s, planId)
  if (!plan) return { ok: false, error: "That remediation plan does not exist." }
  if (plan.status === "closed") return { ok: false, error: "This plan is closed, so its steps can no longer change. Open a new plan if the student needs one." }
  const step = plan.steps[index]
  if (!step) return { ok: false, error: "That step does not exist in this plan." }
  const steps = plan.steps.map((x, i) => (i === index ? (done ? { ...x, done: true, doneAt: at, doneById: actorId } : { label: x.label, done: false }) : x))
  const next: Remediation = { ...plan, steps, status: planStatus(steps) }
  const state = appendAudit({ ...s, remediations: s.remediations.map((r) => (r.id === planId ? next : r)) }, actorId, done ? "Marked a remediation step done" : "Marked a remediation step not done", `${step.label}, ${skillOf(s, plan.skillId)?.name ?? "skill"} for ${nameOf(s, plan.studentId)}`, at)
  return { ok: true, state }
}

export function closePlan(s: V2State, planId: string, input: { note: string }, actorId: string, at: string): Result<{ completed: boolean }> {
  if (!isStaff(s.people.find((p) => p.id === actorId))) return { ok: false, error: "Only program staff can close a remediation plan." }
  const plan = planFor(s, planId)
  if (!plan) return { ok: false, error: "That remediation plan does not exist." }
  if (plan.status === "closed") return { ok: false, error: "This plan is already closed." }
  const completed = plan.steps.every((x) => x.done)
  const note = input.note.trim()
  if (!completed && !note) return { ok: false, error: "Say why you are closing this plan before every step is done. The reason stays on the plan." }
  const next: Remediation = { ...plan, status: "closed", closed: { at, byId: actorId, completed, note } }
  const state = appendAudit({ ...s, remediations: s.remediations.map((r) => (r.id === planId ? next : r)) }, actorId, completed ? "Closed a remediation plan, all steps done" : "Closed a remediation plan early", `${skillOf(s, plan.skillId)?.name ?? "skill"} for ${nameOf(s, plan.studentId)}`, at)
  return { ok: true, state, completed }
}

export interface AttemptInfo {
  /** Evaluations that recorded Met or Did not meet. Not yet is feedback only and is not an attempt. */
  used: number
  limit: number | null
  failed: number
  minDays: number
  /** ISO day of the last fail, or null. */
  lastFailAt: string | null
  /** Earliest day the next attempt may start, or null when nothing holds the student back. */
  nextFrom: string | null
  atLimit: boolean
}

export function attemptInfo(s: V2State, studentId: string, skillId: string): AttemptInfo {
  const skill = skillOf(s, skillId)
  const f = skill?.config?.failure ?? { attemptLimit: null, minDaysBetween: 0 }
  const mine = s.evaluations.filter((e) => e.studentId === studentId && e.skillId === skillId && e.status !== "returned" && e.outcome !== "not-yet" && e.setting === "clinical")
  const fails = mine.filter((e) => e.outcome === "not-met").sort((a, b) => (a.date < b.date ? 1 : -1))
  const lastFailAt = fails[0]?.date ?? null
  let nextFrom: string | null = null
  if (lastFailAt && f.minDaysBetween > 0) {
    const d = new Date(lastFailAt)
    d.setUTCDate(d.getUTCDate() + f.minDaysBetween)
    nextFrom = d.toISOString()
  }
  return { used: mine.length, limit: f.attemptLimit, failed: fails.length, minDays: f.minDaysBetween, lastFailAt, nextFrom, atLimit: f.attemptLimit !== null && mine.length >= f.attemptLimit }
}

// ---------------------------------------------------------------------------------------------------------------------
// Reopen a completed evaluation: add a version, keep every earlier one

export const REOPENABLE: Array<Evaluation["status"]> = ["counted", "awaiting-approval", "reopened"]

export interface ReopenInput {
  evaluationId: string
  outcome: Outcome
  /** A corrected feedback text, or null to leave the feedback as it was. */
  feedback: string | null
  reason: string
}

export function canReopen(e: Evaluation): boolean {
  return REOPENABLE.includes(e.status)
}

/**
 * Reopens a completed evaluation. It adds version n + 1 (who, when, why) and sets the status to reopened, so the evaluation stops
 * counting until staff confirm the new version. Version 1 and every earlier version stay exactly as they were (RV-03 kept).
 */
export function reopenEvaluation(s: V2State, input: ReopenInput, actorId: string, at: string): Result<{ version: number }> {
  if (!isStaff(s.people.find((p) => p.id === actorId))) return { ok: false, error: "Only program staff can reopen an evaluation." }
  const e = s.evaluations.find((x) => x.id === input.evaluationId)
  if (!e) return { ok: false, error: "That evaluation does not exist." }
  if (!canReopen(e)) return { ok: false, error: "This evaluation was returned to the student, so it has not been completed. It is corrected there, not reopened." }
  const reason = input.reason.trim()
  if (!reason) return { ok: false, error: "Say why you are reopening this evaluation. The reason stays on the record." }
  const prev = e.versions[e.versions.length - 1]
  const feedback = input.feedback === null ? null : input.feedback.trim()
  const oldFeedback = prev?.detail?.feedback ?? ""
  const feedbackChanged = feedback !== null && feedback !== oldFeedback
  if (input.outcome === e.outcome && !feedbackChanged) return { ok: false, error: "Change the outcome or the feedback, or cancel. Nothing has changed yet." }
  if (feedback !== null && feedback.length > 2000) return { ok: false, error: `Shorten the feedback to 2000 characters or fewer (now ${feedback.length}).` }
  const version = e.currentVersion + 1
  const detail: EvaluationDetail | undefined = prev?.detail || feedbackChanged ? { ...(prev?.detail ?? { feedback: "" }), feedback: feedbackChanged ? (feedback as string) : oldFeedback } : undefined
  const nextVersion: EvaluationVersion = { version, outcome: input.outcome, at, by: actorId, reason, ...(detail ? { detail } : {}) }
  const next: Evaluation = { ...e, status: "reopened", outcome: input.outcome, currentVersion: version, versions: [...e.versions, nextVersion] }
  const label = `${skillOf(s, e.skillId)?.name ?? "A skill"} for ${nameOf(s, e.studentId)}, version ${version}`
  const state = appendAudit({ ...s, evaluations: s.evaluations.map((x) => (x.id === e.id ? next : x)) }, actorId, "Reopened evaluation", label, at)
  return { ok: true, state, version }
}

/** Staff confirm the newest version of a reopened evaluation. It counts again (or waits for approval); a fail may open a plan. */
export function confirmVersion(s: V2State, evaluationId: string, actorId: string, at: string): Result<{ planOpened: boolean }> {
  if (!isStaff(s.people.find((p) => p.id === actorId))) return { ok: false, error: "Only program staff can confirm a version." }
  const e = s.evaluations.find((x) => x.id === evaluationId)
  if (!e) return { ok: false, error: "That evaluation does not exist." }
  if (e.status !== "reopened") return { ok: false, error: "This evaluation is not reopened, so there is no new version to confirm." }
  const skill = skillOf(s, e.skillId)
  const status: Evaluation["status"] = skill?.config?.approvalRequired ? "awaiting-approval" : "counted"
  let state: V2State = { ...s, evaluations: s.evaluations.map((x) => (x.id === e.id ? { ...e, status } : x)) }
  state = appendAudit(state, actorId, `Confirmed version ${e.currentVersion} as final`, `${skill?.name ?? "A skill"} for ${nameOf(s, e.studentId)}`, at)
  let planOpened = false
  if (e.outcome === "not-met" && opensPlanAutomatically(skill)) {
    const r = openPlan(state, { studentId: e.studentId, skillId: e.skillId, evaluationId: e.id, actorId }, at)
    state = r.state
    planOpened = r.created
  }
  return { ok: true, state, planOpened }
}

// ---------------------------------------------------------------------------------------------------------------------
// Staff outcomes list

export type OutcomeFilter = "latest" | "did-not-meet" | "not-yet" | "reopened"

export function outcomeRows(s: V2State, filter: OutcomeFilter, limit = 12): Evaluation[] {
  const latestAt = (e: Evaluation) => e.versions[e.versions.length - 1]?.at ?? e.date
  const rows = s.evaluations.filter((e) => (filter === "latest" ? true : filter === "did-not-meet" ? e.outcome === "not-met" : filter === "not-yet" ? e.outcome === "not-yet" : e.status === "reopened"))
  return rows.slice().sort((a, b) => (latestAt(a) < latestAt(b) ? 1 : latestAt(a) > latestAt(b) ? -1 : 0)).slice(0, limit)
}

export function evaluationById(s: V2State, id: string): Evaluation | undefined {
  return s.evaluations.find((e) => e.id === id)
}

/** The plan an evaluation opened, if any. */
export function planOfEvaluation(s: V2State, evaluationId: string): Remediation | undefined {
  return s.remediations.find((r) => r.evaluationId === evaluationId)
}
