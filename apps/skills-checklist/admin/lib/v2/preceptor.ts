import type { Result } from "./admin-actions"
import { needsLevels, needsQuestions } from "./config"
import { nextIdFor, openPlan, opensPlanAutomatically, OUTCOME_WORD } from "./outcomes"
import type { RuleIssue } from "./rules"
import { appendAudit } from "./store"
import { ineligibleReason, reviewerId } from "./student"
import type { ConcernFlag, Evaluation, EvaluationDetail, Outcome, Person, Skill, Submission, V2State } from "./types"

/**
 * Stage 3 preceptor logic: who may open a request, what the form asks, what is wrong with an answer, and what a submitted pass does.
 * No account is involved (EV-01): the link names a request, and the person opening it is identified by the link, or by the demo's
 * "open this link as" control. Pure; every function returns a new state and never mutates its input.
 */

export const FEEDBACK_MAX = 2000
/** The scored model has no scale in the configuration, so the form uses 1 to 5. [INFER] */
export const SCORE_MAX = 5

export const isEvaluatorKind = (p: Person) => p.kind === "preceptor" || p.kind === "lab-instructor" || p.kind === "reviewer" || p.kind === "director"

// ---------------------------------------------------------------------------------------------------------------------
// Access

export type AccessKind = "form" | "missing" | "not-sent" | "photo" | "returned" | "completed" | "not-on-request" | "unqualified"

export interface Access {
  kind: AccessKind
  submission: Submission | null
  /** The person identified by the link. */
  person: Person | null
  /** Why the form is not offered, in plain words. Empty for the form. */
  message: string
  /** What to do about it. */
  fix: string
  /** One line per skill the person is not qualified for (unqualified only). */
  reasons: Array<{ skillName: string; reason: string }>
}

const SIGNABLE: Array<Submission["status"]> = ["with-evaluator", "stalled"]

/** Candidates named on the request. A request made before candidates were stored names only the assigned person. */
export const candidatesOf = (x: Submission): string[] => (x.candidateIds && x.candidateIds.length ? x.candidateIds : [x.assignedToId])

const nameOf = (s: V2State, id: string) => s.people.find((p) => p.id === id)?.name ?? "an evaluator"
const studentNameOf = (s: V2State, id: string) => s.people.find((p) => p.id === id)?.name ?? "the student"
const first = (name: string) => name.split(/\s+/).filter((w) => !/^[A-Z]\.$/.test(w))[0] ?? name

/** Decides what the link opens: the form, or a plain explanation of why it does not. */
export function requestAccess(s: V2State, requestId: string | null, asId?: string | null): Access {
  const blank = { submission: null, person: null, reasons: [] as Access["reasons"] }
  const x = requestId ? s.submissions.find((r) => r.id === requestId) : undefined
  if (!x) return { ...blank, kind: "missing", message: "This link does not match a request.", fix: "Ask the student to send a new one." }
  const person = s.people.find((p) => p.id === (asId ?? x.assignedToId) && isEvaluatorKind(p)) ?? s.people.find((p) => p.id === x.assignedToId) ?? null
  const student = studentNameOf(s, x.studentId)
  const base = { submission: x, person, reasons: [] as Access["reasons"] }
  if (x.method === "photo") return { ...base, kind: "photo", message: `${student} sent a photo of a signed paper form. The reviewer checks it, so there is nothing for you to complete.`, fix: "You can close this page." }
  if (x.status === "done" || x.status === "awaiting-review") {
    const by = x.completedById ? nameOf(s, x.completedById) : "an evaluator"
    return { ...base, kind: "completed", message: `${by} already completed this request.`, fix: "A completed evaluation cannot be changed. You can close this page." }
  }
  if (x.status === "returned") return { ...base, kind: "returned", message: `This request was returned to ${student} for correction.`, fix: `It opens again when ${first(student)} sends it back.` }
  if (x.status === "on-device") return { ...base, kind: "not-sent", message: `${student}'s phone has not sent this request yet.`, fix: `It opens here once the phone is online and has sent it. Ask ${first(student)} to check the sync status.` }
  if (!person || !SIGNABLE.includes(x.status)) return { ...base, kind: "missing", message: "This link does not match a request.", fix: "Ask the student to send a new one." }

  const skills = x.skillIds.map((id) => s.skills.find((k) => k.id === id)).filter((k): k is Skill => !!k)
  const reasons = skills.map((k) => ({ skillName: k.name, reason: ineligibleReason(k, person) })).filter((r): r is { skillName: string; reason: string } => !!r.reason)
  if (reasons.length > 0) {
    return { ...base, person, reasons, kind: "unqualified", message: `${person.name} cannot sign off ${reasons.length === 1 ? reasons[0].skillName : "these skills"}.`, fix: `Ask ${first(student)} to send this request to a qualified evaluator.` }
  }
  if (!candidatesOf(x).includes(person.id)) {
    const to = candidatesOf(x).map((id) => nameOf(s, id)).join(" or ")
    return { ...base, kind: "not-on-request", message: `${student} sent this request to ${to}, not to ${person.name}.`, fix: `Ask ${first(student)} to send it to you.` }
  }
  return { ...base, kind: "form", message: "", fix: "" }
}

// ---------------------------------------------------------------------------------------------------------------------
// The form

export interface SkillResponse {
  skillId: string
  outcome: Outcome | null
  answers: Array<"yes" | "no" | null>
  scores: Array<number | null>
  levelIndex: number | null
  feedback: string
}

export interface PassInput {
  requestId: string
  evaluatorId: string
  responses: SkillResponse[]
  concern: { raised: boolean; note: string }
  attested: boolean
}

export function blankResponse(skill: Skill): SkillResponse {
  const n = skill.config?.questions.length ?? 0
  return { skillId: skill.id, outcome: null, answers: new Array<"yes" | "no" | null>(skill.model === "question" ? n : 0).fill(null), scores: new Array<number | null>(skill.model === "scored" ? n : 0).fill(null), levelIndex: null, feedback: "" }
}

export const blankPass = (s: V2State, requestId: string, evaluatorId: string): PassInput => {
  const x = s.submissions.find((r) => r.id === requestId)
  return { requestId, evaluatorId, responses: (x?.skillIds ?? []).map((id) => s.skills.find((k) => k.id === id)).filter((k): k is Skill => !!k).map(blankResponse), concern: { raised: false, note: "" }, attested: false }
}

export interface OutcomeChoice {
  value: Outcome
  label: string
}

/** The three answers an evaluator can give. A binary skill uses the program's own two labels for Met and Not met (SC-03). */
export function outcomeChoices(skill: Skill): OutcomeChoice[] {
  const [a, b] = skill.model === "binary" && skill.config ? skill.config.outcomeLabels : ["Met", "Not met"]
  return [
    { value: "met", label: a?.trim() || "Met" },
    { value: "not-met", label: b?.trim() || "Not met" },
    { value: "not-yet", label: "Not yet, feedback only" },
  ]
}

export const showsLevels = (skill: Skill) => !!skill.config && needsLevels(skill.model, skill.config)
export const levelsLabel = (skill: Skill) => (skill.model === "demonstration" ? "Level of supervision you observed" : "Overall supervision rating")

/** The credential sentence the evaluator attests to, built from the qualification rule of every skill in the request. */
export function attestationText(skills: Skill[]): string {
  const creds = new Set<string>()
  const training = new Set<string>()
  let years = 0
  for (const k of skills) {
    const q = k.config?.qualification
    if (!q) continue
    q.credentials.forEach((c) => creds.add(c))
    q.training.forEach((t) => training.add(t))
    years = Math.max(years, q.minYears)
  }
  const parts: string[] = []
  if (creds.size) parts.push([...creds].join(" or "))
  if (years > 0) parts.push(`${years} or more years of practice`)
  if (training.size) parts.push(`trained in ${[...training].join(", ")}`)
  return parts.length ? `I confirm I hold the credentials these skills require: ${parts.join(", ")}.` : "I confirm I am qualified to sign off these skills."
}

export interface FieldIssue {
  /** DOM id of the control to focus. */
  field: string
  message: string
}

export const fieldIds = {
  outcome: (skillId: string) => `out-${skillId}`,
  level: (skillId: string) => `lvl-${skillId}`,
  question: (skillId: string, i: number) => `q-${skillId}-${i}`,
  feedback: (skillId: string) => `fb-${skillId}`,
  concern: "concern-note",
  attest: "attest",
}

/** Everything wrong with a pass, in the order the form shows it. Each message says what happened and how to fix it. */
export function validatePass(s: V2State, input: PassInput): FieldIssue[] {
  const out: FieldIssue[] = []
  for (const r of input.responses) {
    const skill = s.skills.find((k) => k.id === r.skillId)
    if (!skill?.config) continue
    const c = skill.config
    const name = skill.name
    if (!r.outcome) out.push({ field: fieldIds.outcome(skill.id), message: `Choose an outcome for ${name}: ${outcomeChoices(skill)[0].label}, ${outcomeChoices(skill)[1].label} or Not yet.` })
    const graded = r.outcome === "met" || r.outcome === "not-met"
    if (graded && needsQuestions(skill.model)) {
      c.questions.forEach((q, i) => {
        if (skill.model === "question" && (r.answers[i] ?? null) === null) out.push({ field: fieldIds.question(skill.id, i), message: `Answer Yes or No to "${q}" for ${name}.` })
        if (skill.model === "scored" && (r.scores[i] ?? null) === null) out.push({ field: fieldIds.question(skill.id, i), message: `Give a score from 1 to ${SCORE_MAX} for "${q}" in ${name}.` })
      })
    }
    if (graded && needsLevels(skill.model, c) && r.levelIndex === null) out.push({ field: fieldIds.level(skill.id), message: `Choose the ${skill.model === "demonstration" ? "level of supervision you observed" : "overall supervision rating"} for ${name}.` })
    const fb = r.feedback.trim()
    if (!fb && (c.feedbackRequired || r.outcome === "not-yet")) {
      out.push({ field: fieldIds.feedback(skill.id), message: r.outcome === "not-yet" ? `Write feedback for ${name}. Not yet records feedback only, so the student needs your words.` : `Write feedback for ${name}. The program requires it on every evaluation.` })
    }
    if (fb.length > FEEDBACK_MAX) out.push({ field: fieldIds.feedback(skill.id), message: `Shorten the feedback for ${name} to ${FEEDBACK_MAX} characters or fewer (now ${fb.length}).` })
  }
  if (input.concern.raised && !input.concern.note.trim()) out.push({ field: fieldIds.concern, message: "Describe the concern, or turn the flag off." })
  if (input.concern.raised && input.concern.note.trim().length > FEEDBACK_MAX) out.push({ field: fieldIds.concern, message: `Shorten the concern to ${FEEDBACK_MAX} characters or fewer (now ${input.concern.note.trim().length}).` })
  if (!input.attested) out.push({ field: fieldIds.attest, message: "Confirm your credentials before you submit." })
  return out
}

/** A note beside an answer when it points away from the outcome chosen. Never blocks; Met is the evaluator's call. */
export function criteriaNote(skill: Skill, r: SkillResponse): string | null {
  const c = skill.config
  if (!c || r.outcome !== "met") return null
  const noes = r.answers.filter((a) => a === "no").length
  if (noes > 0) return `You answered No to ${noes} ${noes === 1 ? "question" : "questions"}. Met is still your call.`
  const min = c.achievement.minLevelIndex
  if (min !== null && r.levelIndex !== null && r.levelIndex < min && needsLevels(skill.model, c)) return `This level is below the minimum the program counts (${c.levels[min]}). The evaluation is recorded as Met and is left out of the achievement rule.`
  return null
}

// ---------------------------------------------------------------------------------------------------------------------
// Submitting

export interface PassResult {
  evaluationIds: string[]
  /** Per skill: what was recorded and whether it counts now or waits for approval (EV-07). */
  items: Array<{ skillId: string; evaluationId: string; outcome: Outcome; holds: boolean; planId: string | null }>
  planIds: string[]
  concernId: string | null
}

/**
 * Records one pass: one evaluation per skill in the request, each with version 1 and its detail, an optional confidential concern,
 * and a remediation plan for a fail whose skill opens one. First to finish completes the request (EV-05).
 */
export function submitEvaluation(s: V2State, input: PassInput, at: string): Result<PassResult> {
  const access = requestAccess(s, input.requestId, input.evaluatorId)
  if (access.kind !== "form" || !access.submission || !access.person || access.person.id !== input.evaluatorId) {
    return { ok: false, error: `${access.message || "This request cannot be completed by this person."} ${access.fix}`.trim() }
  }
  const x = access.submission
  const skills = x.skillIds.map((id) => s.skills.find((k) => k.id === id)).filter((k): k is Skill => !!k)
  const covered = new Set(input.responses.map((r) => r.skillId))
  const missing = skills.filter((k) => !covered.has(k.id))
  if (missing.length > 0) return { ok: false, error: `Record an outcome for ${missing.map((k) => k.name).join(" and ")} too. One pass covers every skill in the request.` }
  const issues = validatePass(s, input)
  if (issues.length > 0) {
    const ruleIssues: RuleIssue[] = issues.map((i, n) => ({ id: `pass-${n + 1}`, step: 0, field: i.field, message: i.message }))
    return { ok: false, error: `Fix ${issues.length} ${issues.length === 1 ? "problem" : "problems"} before you submit.`, issues: ruleIssues }
  }

  const attestation: EvaluationDetail["attested"] = { text: attestationText(skills), at }
  let state: V2State = s
  const items: PassResult["items"] = []
  const planIds: string[] = []
  const created: Evaluation[] = []
  const evIds = s.evaluations.map((e) => e.id)
  for (const skill of skills) {
    const r = input.responses.find((y) => y.skillId === skill.id) as SkillResponse
    const c = skill.config as NonNullable<Skill["config"]>
    const entry = s.logEntries.filter((e) => (x.entryIds ?? []).includes(e.id) && e.skillId === skill.id).sort((a, b) => (a.at < b.at ? 1 : -1))[0]
    const holds = !!c.approvalRequired
    const id = nextIdFor("ev-v2", [...evIds, ...created.map((e) => e.id)])
    const detail: EvaluationDetail = {
      feedback: r.feedback.trim(),
      ...(skill.model === "question" ? { answers: r.answers } : {}),
      ...(skill.model === "scored" ? { scores: r.scores } : {}),
      ...(needsLevels(skill.model, c) ? { levelIndex: r.levelIndex } : {}),
      attested: attestation,
    }
    const ev: Evaluation = {
      id,
      studentId: x.studentId,
      skillId: skill.id,
      evaluatorId: input.evaluatorId,
      setting: entry?.setting ?? "clinical",
      date: at,
      status: holds ? "awaiting-approval" : "counted",
      outcome: r.outcome as Outcome,
      currentVersion: 1,
      versions: [{ version: 1, outcome: r.outcome as Outcome, at, by: input.evaluatorId, reason: null, detail }],
      submissionId: x.id,
      ...((entry?.setting ?? "clinical") === "clinical" && entry?.clinicalSetting ? { clinicalSetting: entry.clinicalSetting } : {}),
      ...(needsLevels(skill.model, c) && r.levelIndex !== null ? { levelIndex: r.levelIndex } : {}),
    }
    created.push(ev)
    items.push({ skillId: skill.id, evaluationId: id, outcome: ev.outcome, holds, planId: null })
  }
  state = { ...state, evaluations: [...state.evaluations, ...created] }
  for (const ev of created) {
    const skill = skills.find((k) => k.id === ev.skillId) as Skill
    state = appendAudit(state, input.evaluatorId, holds(skill) ? "Submitted an evaluation, held for approval" : "Submitted an evaluation", `${skill.name} for ${studentNameOf(s, x.studentId)}: ${OUTCOME_WORD[ev.outcome]}`, at)
    if (ev.outcome === "not-met" && opensPlanAutomatically(skill)) {
      const r = openPlan(state, { studentId: ev.studentId, skillId: ev.skillId, evaluationId: ev.id, actorId: input.evaluatorId }, at)
      state = r.state
      if (r.created) planIds.push(r.plan.id)
      const item = items.find((i) => i.evaluationId === ev.id)
      if (item) item.planId = r.plan.id
    }
  }
  let concernId: string | null = null
  if (input.concern.raised) {
    concernId = nextIdFor("cn", state.concerns.map((c) => c.id))
    const flag: ConcernFlag = { id: concernId, evaluationId: created[0].id, studentId: x.studentId, raisedById: input.evaluatorId, visibleTo: "faculty-only", note: input.concern.note.trim(), at, submissionId: x.id }
    state = appendAudit({ ...state, concerns: [...state.concerns, flag] }, input.evaluatorId, "Raised a confidential concern", `For program staff, about ${studentNameOf(s, x.studentId)}`, at)
  }
  const held = items.some((i) => i.holds)
  state = {
    ...state,
    submissions: state.submissions.map((r) => (r.id === x.id ? { ...r, status: held ? "awaiting-review" : "done", completedById: input.evaluatorId, completedAt: at, daysWaiting: 0, ...(held ? { assignedToId: reviewerId(state) } : {}) } : r)),
  }
  return { ok: true, state, evaluationIds: created.map((e) => e.id), items, planIds, concernId }

  function holds(k: Skill) {
    return !!k.config?.approvalRequired
  }
}

/** Requests waiting for one evaluator, newest first. */
export function waitingFor(s: V2State, personId: string): Submission[] {
  return s.submissions.filter((x) => x.method !== "photo" && SIGNABLE.includes(x.status) && candidatesOf(x).includes(personId)).slice().reverse()
}

/** What the student supplied for one skill in a request: the context shown to the evaluator (EV-04). */
export function studentContext(s: V2State, x: Submission, skillId: string) {
  const e = s.logEntries.filter((l) => (x.entryIds ?? []).includes(l.id) && l.skillId === skillId).sort((a, b) => (a.at < b.at ? 1 : -1))[0]
  return e ?? null
}

export const evaluatorChoicesForDemo = (s: V2State): Person[] => s.people.filter(isEvaluatorKind)
