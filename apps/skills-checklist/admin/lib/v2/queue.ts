import type { Result } from "./admin-actions"
import { needsLevels } from "./config"
import { submissionById } from "./evidence-index"
import { nextIdFor, OUTCOME_WORD } from "./outcomes"
import { blankResponse, studentContext, validatePass, type SkillResponse } from "./preceptor"
import type { RuleIssue } from "./rules"
import { appendAudit } from "./store"
import { flushQueue, queueChange } from "./sync"
import { evaluatorChoices, ineligibleReason, PHOTO_MAX_KB, ratingKind, reviewerId, studentHistory, type Attempt, type EvaluatorChoice } from "./student"
import type { Evaluation, Outcome, Person, Skill, Submission, V2State } from "./types"

/**
 * Stage 4: the review queue. Items awaiting approval (AR-01), side-by-side comparison (AR-02, AR-03), approve (AR-05, AR-06), return with
 * a reason the student can act on (AR-05, RV-01, RV-02), paper-form outcome entry, and reassigning a stalled request (RV-04).
 * Pure; every function returns a new state and never mutates its input.
 */

export const REASON_MAX = 1000
export const NOTE_MAX = 1000

/** Reviewers are administrators and clinical coordinators. The director verifies records; evaluators have no account. */
export const canReview = (p: Person | undefined): p is Person => !!p && (p.kind === "admin" || p.kind === "reviewer")

const nameOf = (s: V2State, id: string | null | undefined) => (id ? (s.people.find((p) => p.id === id)?.name ?? "an evaluator") : "an evaluator")
const skillOf = (s: V2State, id: string) => s.skills.find((k) => k.id === id)
const skillNames = (s: V2State, ids: string[]) => ids.map((id) => skillOf(s, id)?.name ?? "A skill")
export const joinNames = (names: string[]) => (names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : (names[0] ?? ""))
const clip = (t: string, n = 140) => (t.length > n ? `${t.slice(0, n - 1)}…` : t)

export const ROLE_LABEL: Record<Person["kind"], string> = { admin: "Administrator", student: "Student", preceptor: "Preceptor", "lab-instructor": "Lab instructor", faculty: "Faculty", reviewer: "Faculty", director: "Faculty" }

// ---------------------------------------------------------------------------------------------------------------------
// The queue (AR-01)

export type QueueState = "ready" | "needs-outcome"

export interface QueueItem {
  /** The request id, or the evaluation id when the evaluation has no request. */
  key: string
  source: "evaluator" | "paper-form"
  state: QueueState
  submission: Submission | null
  /** Evaluations waiting for approval in this item. Empty for a photo whose outcome is not entered yet. */
  evaluations: Evaluation[]
  studentId: string
  skillIds: string[]
  /** The evaluator, or the person who signed the paper form. Null when a photo names nobody yet. */
  evaluatorId: string | null
  /** ISO time the item reached the queue. */
  since: string
  revision: number
}

/** Where the skill was performed: the entry the student logged, else her placement for the named setting. */
export function locationOf(s: V2State, studentId: string, skillId: string, submission: Submission | null, clinicalSetting: string | undefined): string | null {
  const entry = submission ? studentContext(s, submission, skillId) : null
  if (entry?.location) return entry.location
  if (clinicalSetting) {
    const p = s.placements.find((x) => x.studentId === studentId && x.courseId === s.course.id && x.setting === clinicalSetting)
    if (p) return p.location
  }
  return null
}

/** Everything awaiting review, oldest first: evaluations waiting for approval, and photos of paper forms. */
export function queueItems(s: V2State): QueueItem[] {
  const out: QueueItem[] = []
  const grouped = new Map<string, Evaluation[]>()
  for (const e of s.evaluations.filter((x) => x.status === "awaiting-approval")) {
    const key = e.submissionId && submissionById(s, e.submissionId) ? e.submissionId : e.id
    grouped.set(key, [...(grouped.get(key) ?? []), e])
  }
  for (const [key, evaluations] of grouped) {
    const submission = submissionById(s, key) ?? null
    const first = evaluations[0]
    out.push({
      key,
      source: first.source === "paper-form" ? "paper-form" : "evaluator",
      state: "ready",
      submission,
      evaluations,
      studentId: first.studentId,
      skillIds: submission ? [...new Set([...submission.skillIds, ...evaluations.map((e) => e.skillId)])].filter((id) => evaluations.some((e) => e.skillId === id)) : evaluations.map((e) => e.skillId),
      evaluatorId: submission?.completedById ?? first.evaluatorId,
      since: submission?.completedAt ?? first.versions[0]?.at ?? first.date,
      revision: submission?.revisions ?? 0,
    })
  }
  for (const x of s.submissions.filter((y) => y.status === "awaiting-review" && !grouped.has(y.id))) {
    out.push({ key: x.id, source: x.method === "photo" ? "paper-form" : "evaluator", state: "needs-outcome", submission: x, evaluations: [], studentId: x.studentId, skillIds: x.skillIds, evaluatorId: x.candidateIds?.[0] ?? null, since: x.createdAt, revision: x.revisions ?? 0 })
  }
  return out.sort((a, b) => (a.since < b.since ? -1 : a.since > b.since ? 1 : a.key.localeCompare(b.key)))
}

export const stalledRequests = (s: V2State): Submission[] => s.submissions.filter((x) => x.status === "stalled").slice().sort((a, b) => b.daysWaiting - a.daysWaiting)

export function lastReturn(x: Submission | null | undefined) {
  return x?.returns && x.returns.length ? x.returns[x.returns.length - 1] : null
}

export interface ReturnedItem {
  key: string
  studentId: string
  skillIds: string[]
  submission: Submission | null
  evaluations: Evaluation[]
  reason: string
  at: string
  byId: string
}

/** Items that went back to the student and have not come back: returned requests, and returned evaluations that have no request. */
export function returnedItems(s: V2State): ReturnedItem[] {
  const out: ReturnedItem[] = []
  for (const x of s.submissions.filter((y) => y.status === "returned")) {
    const r = lastReturn(x)
    out.push({ key: x.id, studentId: x.studentId, skillIds: x.skillIds, submission: x, evaluations: s.evaluations.filter((e) => e.submissionId === x.id && e.status === "returned"), reason: r?.reason ?? "No reason was recorded.", at: r?.at ?? x.createdAt, byId: r?.byId ?? reviewerId(s) })
  }
  for (const e of s.evaluations.filter((y) => y.status === "returned" && !y.submissionId)) {
    out.push({ key: e.id, studentId: e.studentId, skillIds: [e.skillId], submission: null, evaluations: [e], reason: e.review?.note ?? "No reason was recorded.", at: e.review?.at ?? e.date, byId: e.review?.byId ?? reviewerId(s) })
  }
  return out.sort((a, b) => (a.at < b.at ? 1 : -1))
}

export function findQueueItem(s: V2State, key: string): QueueItem | undefined {
  return queueItems(s).find((i) => i.key === key)
}

/** The evaluator on a request: the person it was sent to, or who completed it. Not the reviewer who is holding it. */
export const evaluatorOf = (x: Submission): string => x.candidateIds?.[0] ?? x.completedById ?? x.assignedToId

/** The next step in words the student can act on, from how the request was sent. */
export function returnNextStep(s: V2State, x: Submission | null, evaluatorId: string | null): string {
  if (!x) return `Ask ${nameOf(s, evaluatorId)} to correct it and submit it again.`
  if (x.method === "photo") return "Take a new photo of the signed form and send it again."
  return `Send it again. ${nameOf(s, evaluatorId ?? evaluatorOf(x))} gets the request back and completes it again.`
}

export const hasMultipleSkills = (i: { skillIds: string[] }) => i.skillIds.length > 1

// ---------------------------------------------------------------------------------------------------------------------
// Blocked items

/** Why an item cannot be approved right now, in plain words, or null (D: the other items still go through). */
export function approveBlock(s: V2State, item: QueueItem): string | null {
  if (item.state === "needs-outcome") {
    return item.source === "paper-form" ? "Enter the outcome from the paper form first. Open the item to do it." : "No evaluation is recorded for this request yet."
  }
  if (item.source === "paper-form") {
    const signer = s.people.find((p) => p.id === item.evaluations[0]?.evaluatorId)
    for (const e of item.evaluations) {
      const skill = skillOf(s, e.skillId)
      const why = skill && signer ? ineligibleReason(skill, signer) : null
      if (why) return `${signer?.name ?? "The signer"} cannot sign off ${skill?.name ?? "this skill"}. ${why}. Return it, or reassign the signer.`
    }
  }
  return null
}

export function itemLabel(s: V2State, item: { studentId: string; skillIds: string[] }): string {
  return `${nameOf(s, item.studentId)}, ${joinNames(skillNames(s, item.skillIds))}`
}

// ---------------------------------------------------------------------------------------------------------------------
// Approve (AR-05, AR-06)

export interface BlockedItem {
  key: string
  label: string
  reason: string
}

export interface ApproveResult {
  approvedKeys: string[]
  /** Evaluations that count now. */
  evaluations: number
  blocked: BlockedItem[]
  plansOpened: number
}

function approveOne(s: V2State, item: QueueItem, actorId: string, at: string, note: string): { state: V2State; plans: number } {
  let state = s
  const plans = 0
  const ids = new Set(item.evaluations.map((e) => e.id))
  state = {
    ...state,
    evaluations: state.evaluations.map((e) => (ids.has(e.id) ? { ...e, status: "counted" as const, review: { decision: "approved" as const, byId: actorId, at, note } } : e)),
  }
  for (const e of item.evaluations) {
    const skill = skillOf(state, e.skillId)
    state = appendAudit(state, actorId, "Approved an evaluation, it now counts", `${skill?.name ?? "A skill"} for ${nameOf(state, e.studentId)}: ${OUTCOME_WORD[e.outcome]}${note ? `. Note: ${clip(note, 80)}` : ""}`, at)
  }
  if (item.submission) {
    state = { ...state, submissions: state.submissions.map((x) => (x.id === item.submission?.id ? { ...x, status: "done" as const, completedAt: x.completedAt ?? at, completedById: x.completedById ?? item.evaluatorId ?? actorId, daysWaiting: 0 } : x)) }
  }
  return { state, plans }
}

/**
 * Approves the chosen items. An item that is blocked stays in the queue and is named with its reason; the others go through. Nothing
 * is approved only when every chosen item is blocked, and then the error names them.
 */
export function approveItems(s: V2State, keys: string[], actorId: string, at: string, note = ""): Result<ApproveResult> {
  if (!canReview(s.people.find((p) => p.id === actorId))) return { ok: false, error: "Only an administrator or a clinical coordinator can approve evidence." }
  const unique = [...new Set(keys)]
  if (unique.length === 0) return { ok: false, error: "Choose at least one submission to approve." }
  const cleanNote = note.trim()
  if (cleanNote.length > NOTE_MAX) return { ok: false, error: `Shorten the note to ${NOTE_MAX} characters or fewer (now ${cleanNote.length}).` }
  const queue = queueItems(s)
  let state = s
  const approvedKeys: string[] = []
  const blocked: BlockedItem[] = []
  let evaluations = 0
  let plansOpened = 0
  for (const key of unique) {
    const item = queue.find((i) => i.key === key)
    if (!item) {
      blocked.push({ key, label: "An item", reason: "It is no longer in the queue. Someone may have approved or returned it already." })
      continue
    }
    const why = approveBlock(state, item)
    if (why) {
      blocked.push({ key, label: itemLabel(state, item), reason: why })
      continue
    }
    const r = approveOne(state, item, actorId, at, cleanNote)
    state = r.state
    plansOpened += r.plans
    evaluations += item.evaluations.length
    approvedKeys.push(key)
  }
  if (approvedKeys.length === 0) {
    return { ok: false, error: `Nothing was approved. ${blocked.map((b) => `${b.label}: ${b.reason}`).join(" ")}` }
  }
  return { ok: true, state, approvedKeys, evaluations, blocked, plansOpened }
}

// ---------------------------------------------------------------------------------------------------------------------
// Return (AR-05, RV-01, RV-02)

export function returnReasonIssue(reason: string): string | null {
  const r = reason.trim()
  if (!r) return "Say what is wrong and what to change. The student reads this."
  if (r.length > REASON_MAX) return `Shorten the reason to ${REASON_MAX} characters or fewer (now ${r.length}).`
  return null
}

/** Sends an item back to the student with a reason. Every evaluation in it stops waiting and does not count. */
export function returnItem(s: V2State, key: string, input: { reason: string }, actorId: string, at: string): Result<{ revision: number }> {
  if (!canReview(s.people.find((p) => p.id === actorId))) return { ok: false, error: "Only an administrator or a clinical coordinator can return evidence." }
  const item = findQueueItem(s, key)
  if (!item) return { ok: false, error: "This item is not in the queue any more. It may already be approved or returned." }
  const issue = returnReasonIssue(input.reason)
  if (issue) return { ok: false, error: issue }
  const reason = input.reason.trim()
  const ids = new Set(item.evaluations.map((e) => e.id))
  let state: V2State = {
    ...s,
    evaluations: s.evaluations.map((e) => (ids.has(e.id) ? { ...e, status: "returned" as const, review: { decision: "returned" as const, byId: actorId, at, note: reason } } : e)),
  }
  let revision = item.revision
  if (item.submission) {
    const x = item.submission
    revision = (x.returns?.length ?? 0) + 1
    state = { ...state, submissions: state.submissions.map((y) => (y.id === x.id ? { ...y, status: "returned" as const, returns: [...(y.returns ?? []), { at, byId: actorId, reason, revision }] } : y)) }
  }
  state = appendAudit(state, actorId, "Returned to the student", `${itemLabel(s, item)}. Reason: ${clip(reason)}`, at)
  return { ok: true, state, revision }
}

export interface ResendInput {
  photo?: { name: string; sizeKb: number; type: string }
  note?: string
}

/**
 * The student corrects and sends a returned request again. It is the same record (RV-02): the revision count rises, the return reason
 * stays, and the evaluation that was returned stays as history. A photo needs a new photo; any other method goes back to its evaluator.
 */
export function resendSubmission(s: V2State, id: string, input: ResendInput, at: string, studentId: string): Result<{ revision: number }> {
  const x = s.submissions.find((y) => y.id === id && y.studentId === studentId)
  if (!x) return { ok: false, error: "That request is not yours." }
  if (x.status !== "returned") return { ok: false, error: "This request is not returned, so there is nothing to send again. A request that is waiting or counted cannot be sent again." }
  const note = (input.note ?? "").trim()
  if (note.length > NOTE_MAX) return { ok: false, error: `Shorten the note to ${NOTE_MAX} characters or fewer (now ${note.length}).` }
  let photo = x.photo
  if (x.method === "photo") {
    if (!input.photo) return { ok: false, error: "Add a new photo of the signed form before you send it again." }
    if (!input.photo.type.startsWith("image/")) return { ok: false, error: `That file is not a photo. Choose a photo (JPG, PNG, HEIC or WebP) under ${PHOTO_MAX_KB / 1024} MB.` }
    if (input.photo.sizeKb > PHOTO_MAX_KB) return { ok: false, error: `That photo is ${Math.round(input.photo.sizeKb / 1024)} MB. Choose one under ${PHOTO_MAX_KB / 1024} MB.` }
    photo = { name: input.photo.name, sizeKb: Math.max(1, Math.round(input.photo.sizeKb)) }
  }
  const revision = (x.revisions ?? 0) + 1
  const names = joinNames(skillNames(s, x.skillIds))
  let state: V2State = {
    ...s,
    submissions: s.submissions.map((y) => {
      if (y.id !== x.id) return y
      // The earlier completion belongs to the returned pass; the request is open again with its evaluator, or with the reviewer for a photo.
      const { completedById: _by, completedAt: _at, ...rest } = y
      return { ...rest, status: "on-device" as const, assignedToId: x.method === "photo" ? reviewerId(s) : evaluatorOf(x), revisions: revision, daysWaiting: 0, ...(photo ? { photo } : {}), ...(note ? { studentNote: note } : {}) }
    }),
  }
  state = queueChange(state, { studentId, label: `Request sent again (revision ${revision}): ${names}`, requestId: x.id }, at).state
  state = appendAudit(state, studentId, `Sent a returned request again, revision ${revision}`, names, at)
  state = flushQueue(state, at, undefined, studentId).state
  return { ok: true, state, revision }
}

// ---------------------------------------------------------------------------------------------------------------------
// Paper form: the reviewer enters the outcome on the evaluator's behalf

export interface PaperInput {
  signerId: string
  clinicalSetting: string
  responses: SkillResponse[]
}

export function blankPaper(s: V2State, item: QueueItem): PaperInput {
  const entry = item.submission ? item.skillIds.map((id) => studentContext(s, item.submission as Submission, id)).find((e) => e?.clinicalSetting) : null
  return {
    signerId: item.submission?.candidateIds?.[0] ?? "",
    clinicalSetting: entry?.clinicalSetting ?? "",
    responses: item.skillIds.map((id) => skillOf(s, id)).filter((k): k is Skill => !!k).map(blankResponse),
  }
}

/** Qualified signers for the skills on this item. Someone who is not qualified for every skill is listed with the reason. */
export const signerChoices = (s: V2State, item: QueueItem, actorId?: string): EvaluatorChoice[] => evaluatorChoices(s, item.skillIds).filter((c) => (c.person.kind === "preceptor" || c.eligible) && c.person.id !== actorId)

export const PAPER_FIELDS = { signer: "paper-signer", setting: "paper-setting" }

/**
 * Records what the signed paper form says. The evaluations are marked as a paper form, name the person who signed it and the reviewer
 * who typed it, and then wait for approval like any other (AR-05). Nothing is invented: every outcome is chosen by the reviewer.
 */
export function recordPaperOutcome(s: V2State, key: string, input: PaperInput, actorId: string, at: string): Result<{ evaluationIds: string[] }> {
  if (!canReview(s.people.find((p) => p.id === actorId))) return { ok: false, error: "Only an administrator or a clinical coordinator can enter an outcome from a paper form." }
  const x = s.submissions.find((y) => y.id === key)
  if (!x || x.method !== "photo" || x.status !== "awaiting-review") return { ok: false, error: "This is not a photo of a paper form waiting for review." }
  if (s.evaluations.some((e) => e.submissionId === x.id && e.status === "awaiting-approval")) return { ok: false, error: "An outcome is already entered for this form. Approve it, or return the request." }
  const skills = x.skillIds.map((id) => skillOf(s, id)).filter((k): k is Skill => !!k)
  const issues: RuleIssue[] = []
  const add = (field: string, message: string) => issues.push({ id: `paper-${issues.length + 1}`, step: 0, field, message })
  const signer = s.people.find((p) => p.id === input.signerId)
  if (!signer) add(PAPER_FIELDS.signer, "Choose who signed the paper form.")
  else if (signer.id === actorId) add(PAPER_FIELDS.signer, "You cannot enter a form you signed yourself. Another reviewer enters it, or choose the person who did sign it.")
  else {
    const bad = skills.map((k) => ({ k, why: ineligibleReason(k, signer) })).filter((r): r is { k: Skill; why: string } => !!r.why)
    if (bad.length) add(PAPER_FIELDS.signer, `${signer.name} cannot sign off ${bad.map((b) => b.k.name).join(" and ")}. ${bad[0].why}. Choose someone qualified.`)
  }
  if (!s.course.clinicalSettings.includes(input.clinicalSetting)) add(PAPER_FIELDS.setting, `Choose the clinical setting on the form: ${s.course.clinicalSettings.join(" or ")}.`)
  const missing = skills.filter((k) => !input.responses.some((r) => r.skillId === k.id))
  if (missing.length) return { ok: false, error: `Record an outcome for ${joinNames(missing.map((k) => k.name))} too. The form covers every skill in the request.` }
  const pass = validatePass(s, { requestId: x.id, evaluatorId: input.signerId, responses: input.responses, concern: { raised: false, note: "" }, attested: true })
  for (const p of pass) add(p.field, p.message)
  if (issues.length) return { ok: false, error: `Fix ${issues.length} ${issues.length === 1 ? "problem" : "problems"} before you record the outcome.`, issues }

  const created: Evaluation[] = []
  const evIds = s.evaluations.map((e) => e.id)
  for (const skill of skills) {
    const r = input.responses.find((y) => y.skillId === skill.id) as SkillResponse
    const c = skill.config as NonNullable<Skill["config"]>
    const entry = studentContext(s, x, skill.id)
    created.push({
      id: nextIdFor("ev-v2", [...evIds, ...created.map((e) => e.id)]),
      studentId: x.studentId,
      skillId: skill.id,
      evaluatorId: input.signerId,
      setting: "clinical",
      clinicalSetting: input.clinicalSetting,
      date: entry?.at ?? x.createdAt,
      status: "awaiting-approval",
      outcome: r.outcome as Outcome,
      currentVersion: 1,
      versions: [
        {
          version: 1,
          outcome: r.outcome as Outcome,
          at,
          by: actorId,
          reason: null,
          detail: { feedback: r.feedback.trim(), ...(skill.model === "question" ? { answers: r.answers } : {}), ...(skill.model === "scored" ? { scores: r.scores } : {}), ...(needsLevels(skill.model, c) ? { levelIndex: r.levelIndex } : {}) },
        },
      ],
      submissionId: x.id,
      source: "paper-form",
      enteredById: actorId,
      ...(needsLevels(skill.model, c) && r.levelIndex !== null ? { levelIndex: r.levelIndex } : {}),
    })
  }
  let state: V2State = {
    ...s,
    evaluations: [...s.evaluations, ...created],
    submissions: s.submissions.map((y) => (y.id === x.id ? { ...y, completedById: input.signerId, completedAt: at } : y)),
  }
  for (const e of created) {
    state = appendAudit(state, actorId, "Entered an evaluation from a signed paper form", `${skillOf(s, e.skillId)?.name ?? "A skill"} for ${nameOf(s, e.studentId)}, signed by ${nameOf(s, e.evaluatorId)}: ${OUTCOME_WORD[e.outcome]}`, at)
  }
  return { ok: true, state, evaluationIds: created.map((e) => e.id) }
}

// ---------------------------------------------------------------------------------------------------------------------
// Reassign a stalled request (RV-04)

/** People the request can go to: qualified for every skill in it, and not the one who has it now. Others are listed with the reason. */
export function reassignOptions(s: V2State, x: Submission): EvaluatorChoice[] {
  return evaluatorChoices(s, x.skillIds).filter((c) => c.person.id !== x.assignedToId)
}

export function reassignRequest(s: V2State, id: string, input: { toId: string; reason: string }, actorId: string, at: string): Result<{ toName: string }> {
  if (!canReview(s.people.find((p) => p.id === actorId))) return { ok: false, error: "Only an administrator or a clinical coordinator can reassign a request." }
  const x = s.submissions.find((y) => y.id === id)
  if (!x) return { ok: false, error: "That request does not exist." }
  if (x.status !== "stalled") return { ok: false, error: "Only a stalled request can be reassigned. This one is not stalled, so its evaluator still has it." }
  if (!input.toId) return { ok: false, error: "Choose who the request goes to." }
  if (input.toId === x.assignedToId) return { ok: false, error: `${nameOf(s, x.assignedToId)} already has this request. Choose someone else.` }
  const choice = evaluatorChoices(s, x.skillIds).find((c) => c.person.id === input.toId)
  if (!choice) return { ok: false, error: "That person is not an evaluator on record. Choose someone from the list." }
  if (!choice.eligible) return { ok: false, error: `${choice.person.name} cannot sign this off. ${choice.reasons[0]}` }
  const reason = input.reason.trim()
  if (reason.length > NOTE_MAX) return { ok: false, error: `Shorten the reason to ${NOTE_MAX} characters or fewer (now ${reason.length}).` }
  const next: Submission = {
    ...x,
    assignedToId: input.toId,
    candidateIds: [input.toId],
    status: "with-evaluator",
    daysWaiting: 0,
    reassignments: [...(x.reassignments ?? []), { at, byId: actorId, fromId: x.assignedToId, toId: input.toId, reason }],
  }
  const state = appendAudit({ ...s, submissions: s.submissions.map((y) => (y.id === x.id ? next : y)) }, actorId, "Reassigned a stalled request", `${itemLabel(s, x)}: from ${nameOf(s, x.assignedToId)} to ${choice.person.name}${reason ? `. Reason: ${clip(reason, 100)}` : ""}`, at)
  return { ok: true, state, toName: choice.person.name }
}

// ---------------------------------------------------------------------------------------------------------------------
// Compare (AR-02, AR-03)

export type Agreement = "agreed" | "differed" | "not-comparable"

export interface CompareRow {
  label: string
  student: string
  evaluator: string
  agreement: Agreement
}

export interface Comparison {
  evaluationId: string
  skillName: string
  selfRated: boolean
  selfAt: string | null
  selfNote: string
  rows: CompareRow[]
  overall: Agreement
  outcomeWord: string
  /** The evaluator's full set of responses (AR-03). Empty when only the outcome was stored. */
  responses: Array<{ label: string; value: string }>
  recorded: boolean
  feedback: string
}

const yn = (a: "yes" | "no" | null | undefined) => (a === "yes" ? "Yes" : a === "no" ? "No" : "Not answered")

export function compareEvaluation(s: V2State, e: Evaluation): Comparison {
  const skill = skillOf(s, e.skillId)
  const c = skill?.config ?? null
  const submission = e.submissionId ? (s.submissions.find((x) => x.id === e.submissionId) ?? null) : null
  const entry = submission ? studentContext(s, submission, e.skillId) : null
  const v = e.versions[e.versions.length - 1]
  const d = v?.detail
  const kind = skill ? ratingKind(skill) : "none"
  const rows: CompareRow[] = []
  const eq = (a: string | null | undefined, b: string | null | undefined): Agreement => (!a || !b ? "not-comparable" : a === b ? "agreed" : "differed")
  const none = "No self-rating"

  if (skill && c && kind === "outcome") {
    const evaluatorLabel = e.outcome === "met" ? c.outcomeLabels[0] : e.outcome === "not-met" ? c.outcomeLabels[1] : "Not yet, feedback only"
    rows.push({ label: "Overall", student: entry?.rating ?? none, evaluator: evaluatorLabel, agreement: e.outcome === "not-yet" ? "not-comparable" : eq(entry?.rating, evaluatorLabel) })
  } else if (skill && c && kind === "levels") {
    const idx = d?.levelIndex ?? e.levelIndex ?? null
    const evaluatorLevel = idx !== null && idx !== undefined ? (c.levels[idx] ?? "Level removed from the skill") : "Level not recorded"
    rows.push({ label: skill.model === "demonstration" ? "Level of supervision" : "Overall supervision rating", student: entry?.rating ?? none, evaluator: evaluatorLevel, agreement: idx === null || idx === undefined ? "not-comparable" : eq(entry?.rating, evaluatorLevel) })
  }
  if (skill && c && skill.model === "question") {
    c.questions.forEach((q, i) => {
      const mine = entry?.answers?.[i] ?? null
      const theirs = d?.answers?.[i] ?? null
      rows.push({ label: q, student: mine ? yn(mine) : none, evaluator: d?.answers ? yn(theirs) : "Not recorded", agreement: mine && theirs ? (mine === theirs ? "agreed" : "differed") : "not-comparable" })
    })
  }
  if (rows.length === 0) rows.push({ label: "Overall", student: entry ? "No self-rating for this skill" : none, evaluator: OUTCOME_WORD[e.outcome], agreement: "not-comparable" })

  const comparable = rows.filter((r) => r.agreement !== "not-comparable")
  const overall: Agreement = comparable.length === 0 ? "not-comparable" : comparable.every((r) => r.agreement === "agreed") ? "agreed" : "differed"

  const responses: Comparison["responses"] = []
  if (d && c) {
    if (d.answers) c.questions.forEach((q, i) => responses.push({ label: q, value: yn(d.answers?.[i]) }))
    if (d.scores) c.questions.forEach((q, i) => responses.push({ label: q, value: d.scores?.[i] !== null && d.scores?.[i] !== undefined ? `${d.scores[i]}` : "Not scored" }))
    if (d.levelIndex !== undefined && d.levelIndex !== null) responses.push({ label: skill?.model === "demonstration" ? "Level of supervision" : "Overall supervision rating", value: c.levels[d.levelIndex] ?? "Level removed from the skill" })
  }
  return {
    evaluationId: e.id,
    skillName: skill?.name ?? "A skill",
    selfRated: !!entry,
    selfAt: entry?.at ?? null,
    selfNote: entry?.note ?? "",
    rows,
    overall,
    outcomeWord: OUTCOME_WORD[e.outcome],
    responses,
    recorded: !!d,
    feedback: d?.feedback ?? "",
  }
}

/** The student's earlier attempts at the same skill, oldest first, leaving out the one under review. */
export function priorAttempts(s: V2State, e: Evaluation): Attempt[] {
  const h = studentHistory(s, e.studentId).skills.find((x) => x.skill.id === e.skillId)
  return (h?.attempts ?? []).filter((a) => a.key !== e.id)
}

