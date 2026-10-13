// Student, evaluator and reviewer flows (ST-01..ST-14, EV-01..EV-08, AR-01..AR-06, RV-01..RV-05).
// Anything that affects achievement is non-optimistic by design (cross-cutting §6): the store returns the new
// state and the UI shows it after the action succeeds.
import type { Db, EvaluatorLink, EvaluatorRef, Evaluation, Id, Review, ReturnTarget, StudentValues, Submission } from "@/lib/domain/types"
import { deterministicToken, idsFrom } from "@/lib/domain/ids"
import { canEdit, canResend, canStartFurtherAttempt, isConfigured, isLocked, type Responses } from "@/lib/engine"
import { currentEvaluation, norm, skillOf, submissionState } from "../derive"
import { fail, ok, type ActionCtx, type Result } from "../result"
import { responseErrors } from "../responses"
import { computeSendOptions, personsForRole, validFor, type PerformedIn } from "../sendRules"
import { isEmail } from "./library"

// ------------------------------------------------------------------ student send (ST-04..ST-13)

export type EvaluatorChoice =
  | { roleId: string; personId: Id }
  /** ST-09: a lab instructor who is not on the roster; a name and an email so the request can reach them. */
  | { roleId: "lab_instructor"; named: { name: string; email: string } }

export interface SendSkillInput {
  skillId: Id
  values: StudentValues
  studentNote?: string
  /** Required before send for skills configured for it (DEC-001, ST-11). */
  selfEvaluation?: Responses | null
}

export interface SendInput {
  studentId: Id
  offeringId: Id
  performedIn: PerformedIn
  /** Clinical only. Must be one of the offered choices (ST-06) or any program setting when no placement exists (ST-07). */
  setting?: { settingId: Id; locationId: Id | null }
  evaluator: EvaluatorChoice
  skills: SendSkillInput[]
}

export interface SendValue {
  requestId: Id
  token: string
  submissionIds: Id[]
  /** ST-13: what the confirmation must name. */
  confirmation: { evaluator: EvaluatorRef; performedIn: PerformedIn; settingId: Id | null; locationId: Id | null; skillIds: Id[] }
}

const tokenFor = (ctx: ActionCtx, seed: number) => (ctx.token ? ctx.token(seed) : deterministicToken(seed))

function resolveEvaluator(db: Db, choice: EvaluatorChoice, ids: ReturnType<typeof idsFrom>): { ok: true; ref: EvaluatorRef; named?: Db["namedLabInstructors"][number] } | { ok: false; field: string } {
  if ("named" in choice) {
    if (!choice.named.name.trim()) return { ok: false, field: "evaluator.named.name" }
    if (!isEmail(choice.named.email)) return { ok: false, field: "evaluator.named.email" }
    const existing = db.namedLabInstructors.find((n) => norm(n.name) === norm(choice.named.name) && n.email.toLowerCase() === choice.named.email.trim().toLowerCase())
    const rosterMatch = db.labInstructors.find((l) => l.email.toLowerCase() === choice.named.email.trim().toLowerCase())
    if (rosterMatch) return { ok: true, ref: { personId: rosterMatch.id, source: "roster", name: rosterMatch.name, email: rosterMatch.email, roleId: "lab_instructor" } }
    const named = existing ?? { id: ids.next("named"), name: choice.named.name.trim(), email: choice.named.email.trim(), namedByStudentId: "", adoptedAs: null }
    return { ok: true, named: existing ? undefined : named, ref: { personId: named.id, source: "studentNamed", name: named.name, email: named.email, roleId: "lab_instructor" } }
  }
  const p = personsForRole(db, choice.roleId).find((x) => x.personId === choice.personId)
  if (!p) return { ok: false, field: "evaluator.personId" }
  return { ok: true, ref: { personId: p.personId, source: p.source, name: p.name, email: p.email, roleId: p.roleId } }
}

function checkSkillInputs(db: Db, items: SendSkillInput[]): Record<string, string> {
  const fields: Record<string, string> = {}
  for (const it of items) {
    const s = skillOf(db, it.skillId)
    if (!s) continue
    for (const f of s.submissionFields) {
      const v = it.values[f.id]
      const empty = v === undefined || v === null || (typeof v === "string" && !v.trim())
      if (f.required && empty) fields[`skills.${it.skillId}.values.${f.id}`] = "required"
      if (!empty && f.type === "number" && Number.isNaN(Number(v))) fields[`skills.${it.skillId}.values.${f.id}`] = "number"
      if (!empty && f.type === "choice" && f.options && !f.options.includes(String(v))) fields[`skills.${it.skillId}.values.${f.id}`] = "choice"
    }
    if (s.selfEvaluation && isConfigured(s)) {
      const errs = responseErrors(s.model, it.selfEvaluation ?? null)
      for (const k of Object.keys(errs)) fields[`skills.${it.skillId}.selfEvaluation.${k}`] = errs[k]
    }
  }
  return fields
}

/**
 * Create one Submission per skill, grouped in one request, with ONE link to the evaluator (EV-05).
 * Setting and location are captured once per request (OD-07 is OPEN: copied onto each submission so a per-skill
 * override stays possible later). A role/setting combination the OD-25 data rejects is refused with the reason (ST-08).
 */
export function sendForReview(db: Db, input: SendInput, ctx: ActionCtx): Result<SendValue> {
  const student = db.students.find((s) => s.id === input.studentId)
  const off = db.offerings.find((o) => o.id === input.offeringId)
  if (!student || !off) return fail("notFound", "Not found.")
  if (input.skills.length === 0) return fail("invalid", "Choose at least one skill.", { fields: { skills: "required" } })
  const skillIds = input.skills.map((s) => s.skillId)
  const opts = computeSendOptions(db, { studentId: input.studentId, offeringId: input.offeringId, skillIds, performedIn: input.performedIn })
  if (opts.unusable.length) return fail("skillNotUsable", "A skill is not available.", { data: { unusable: opts.unusable } })
  if (opts.blocked) return fail("noValidRole", "No evaluator role can sign off this request.", { data: { blocked: opts.blocked } })
  if (!opts.roles.includes(input.evaluator.roleId) || !validFor(db, input.evaluator.roleId, input.performedIn)) {
    return fail("roleNotAllowed", "This role cannot sign off this request.", { data: { allowedRoles: opts.roles } })
  }

  const fields: Record<string, string> = {}
  // ST-06 / ST-07: the setting must be one of the offered choices.
  let settingId: Id | null = null
  let locationId: Id | null = null
  if (input.performedIn === "clinical") {
    const chosen = input.setting ?? (opts.settingMode === "inferred" ? opts.settings[0] : undefined)
    if (!chosen) fields.setting = "required"
    else if (!opts.settings.some((s) => s.settingId === chosen.settingId && (opts.settingMode === "full" ? true : s.locationId === chosen.locationId))) fields.setting = "notOffered"
    else {
      settingId = chosen.settingId
      locationId = chosen.locationId
    }
  }
  const ids = idsFrom(db)
  const person = resolveEvaluator(db, input.evaluator, ids)
  if (!person.ok) fields[person.field] = "invalid"
  Object.assign(fields, checkSkillInputs(db, input.skills))
  if (Object.keys(fields).length || !person.ok) return fail("invalid", "Check the highlighted fields.", { fields })

  const requestId = ids.next("req")
  const subs: Submission[] = input.skills.map((it) => {
    const prior = db.submissions.filter((s) => s.studentId === input.studentId && s.skillId === it.skillId).length
    const skill = skillOf(db, it.skillId)!
    return {
      id: ids.next("sub"),
      requestId,
      studentId: input.studentId,
      skillId: it.skillId,
      offeringId: input.offeringId,
      attempt: prior + 1,
      revision: 0,
      performedIn: input.performedIn,
      clinicalSettingId: settingId,
      locationId,
      evaluator: person.ref,
      values: it.values,
      studentNote: (it.studentNote ?? "").trim(),
      selfEvaluation: skill.selfEvaluation ? (it.selfEvaluation ?? null) : null,
      lifecycle: "awaitingEvaluator" as const,
      sentAt: ctx.now,
    }
  })
  const token = tokenFor(ctx, ids.seq() + 7)
  const link: EvaluatorLink = { token, submissionIds: subs.map((s) => s.id), evaluator: person.ref, createdAt: ctx.now, supersededAt: null, submittedAt: null }
  const named = person.named ? [...db.namedLabInstructors, { ...person.named, namedByStudentId: input.studentId }] : db.namedLabInstructors
  return ok(
    { ...db, seq: ids.seq(), submissions: [...db.submissions, ...subs], links: [...db.links, link], namedLabInstructors: named },
    { requestId, token, submissionIds: subs.map((s) => s.id), confirmation: { evaluator: person.ref, performedIn: input.performedIn, settingId, locationId, skillIds } },
  )
}

// ------------------------------------------------------------------ revision and further attempt (RV-01..RV-05)

export interface ResendPatch {
  values?: StudentValues
  studentNote?: string
  selfEvaluation?: Responses | null
  /** RV-04: either path may go to a different evaluator. */
  evaluator?: EvaluatorChoice
  setting?: { settingId: Id; locationId: Id | null }
}

/**
 * RV-01, RV-02: correct and resend a submission that was returned or not yet assessed. It continues the SAME record
 * and increments an auditable revision count; earlier evaluations stay. RV-05: counted or awaiting approval is locked.
 * OD-16 and OD-08 are OPEN: this action commits only to the student-corrects branch the contract already shows.
 */
export function reviseAndResend(db: Db, submissionId: Id, patch: ResendPatch, ctx: ActionCtx): Result<{ token: string; revision: number }> {
  const sub = db.submissions.find((s) => s.id === submissionId)
  if (!sub) return fail("notFound", "Not found.")
  const state = submissionState(db, sub)
  if (isLocked(state)) return fail("locked", "This submission can no longer be edited or resent.")
  if (!canEdit(state) || !canResend(state)) return fail("notEditable", "This submission cannot be revised.")
  const skill = skillOf(db, sub.skillId)
  if (!skill || !skill.active || !isConfigured(skill)) return fail("skillNotUsable", "This skill is not available.")
  const ids = idsFrom(db)
  const evaluatorChoice: EvaluatorChoice = patch.evaluator ?? { roleId: sub.evaluator.roleId, personId: sub.evaluator.personId } as EvaluatorChoice
  const opts = computeSendOptions(db, { studentId: sub.studentId, offeringId: sub.offeringId, skillIds: [sub.skillId], performedIn: sub.performedIn })
  if (opts.blocked) return fail("noValidRole", "No evaluator role can sign off this request.", { data: { blocked: opts.blocked } })
  let person: ReturnType<typeof resolveEvaluator>
  if (patch.evaluator) {
    if (!opts.roles.includes(patch.evaluator.roleId)) return fail("roleNotAllowed", "This role cannot sign off this request.", { data: { allowedRoles: opts.roles } })
    person = resolveEvaluator(db, evaluatorChoice, ids)
  } else {
    person = { ok: true, ref: sub.evaluator }
  }
  const values = patch.values ?? sub.values
  const selfEvaluation = patch.selfEvaluation === undefined ? sub.selfEvaluation : patch.selfEvaluation
  const fields = checkSkillInputs(db, [{ skillId: sub.skillId, values, selfEvaluation }])
  if (!person.ok) fields[person.field] = "invalid"
  let settingId = sub.clinicalSettingId
  let locationId = sub.locationId
  if (patch.setting && sub.performedIn === "clinical") {
    const okChoice = opts.settings.some((s) => s.settingId === patch.setting!.settingId && (opts.settingMode === "full" ? true : s.locationId === patch.setting!.locationId))
    if (!okChoice) fields.setting = "notOffered"
    else {
      settingId = patch.setting.settingId
      locationId = patch.setting.locationId
    }
  }
  if (Object.keys(fields).length || !person.ok) return fail("invalid", "Check the highlighted fields.", { fields })

  const revision = sub.revision + 1
  const next: Submission = {
    ...sub,
    revision,
    values,
    studentNote: patch.studentNote === undefined ? sub.studentNote : patch.studentNote.trim(),
    selfEvaluation,
    clinicalSettingId: settingId,
    locationId,
    evaluator: person.ref,
    lifecycle: "awaitingEvaluator",
    sentAt: ctx.now,
  }
  const token = tokenFor(ctx, ids.seq() + 11)
  // L-3: the old link stops accepting submissions when the request is resent.
  const links = db.links.map((l) => (l.submissionIds.includes(sub.id) && !l.submittedAt && !l.supersededAt ? { ...l, supersededAt: ctx.now } : l))
  const link: EvaluatorLink = { token, submissionIds: [sub.id], evaluator: person.ref, createdAt: ctx.now, supersededAt: null, submittedAt: null }
  const named = person.ok && person.named ? [...db.namedLabInstructors, { ...person.named, namedByStudentId: sub.studentId }] : db.namedLabInstructors
  return ok(
    { ...db, seq: ids.seq(), submissions: db.submissions.map((s) => (s.id === sub.id ? next : s)), links: [...links, link], namedLabInstructors: named },
    { token, revision },
  )
}

/**
 * RV-03: after a COMPLETED evaluation did not meet the criteria, the student makes a further attempt: a NEW
 * submission, recorded separately. The original is left untouched.
 */
export function startFurtherAttempt(db: Db, fromSubmissionId: Id, input: Omit<SendInput, "skills"> & { skill: SendSkillInput }, ctx: ActionCtx): Result<SendValue> {
  const from = db.submissions.find((s) => s.id === fromSubmissionId)
  if (!from) return fail("notFound", "Not found.")
  if (!canStartFurtherAttempt(submissionState(db, from))) return fail("notFurtherAttempt", "A further attempt is only possible after an evaluation that did not meet the criteria.")
  if (input.skill.skillId !== from.skillId || input.studentId !== from.studentId) return fail("invalid", "A further attempt is for the same skill.")
  return sendForReview(db, { ...input, skills: [input.skill] }, ctx)
}

// ------------------------------------------------------------------ evaluator (EV-01..EV-07)

export interface EvaluatorAnswer {
  submissionId: Id
  responses: Responses
  comment?: string
}

export interface SubmitEvaluationValue {
  /** EV-07: the evaluator is told whether each skill counts now or is held. Never the student's progress or status (OD-17). */
  results: Array<{ submissionId: Id; skillId: Id; countsNow: boolean }>
}

/**
 * Complete a request from its link, without any account. One sitting for several skills, each with its own outcome
 * and comment (EV-05). Atomic: any invalid answer changes nothing. Creates immutable Evaluations (RV-03).
 */
export function submitEvaluation(db: Db, input: { token: string; answers: EvaluatorAnswer[] }, ctx: ActionCtx): Result<SubmitEvaluationValue> {
  const link = db.links.find((l) => l.token === input.token)
  if (!link) return fail("linkInvalid", "This link is not valid.")
  if (link.supersededAt) return fail("linkSuperseded", "This link is no longer active.")
  if (link.submittedAt) return fail("alreadySubmitted", "This evaluation was already submitted.")
  const subs = link.submissionIds.map((id) => db.submissions.find((s) => s.id === id)).filter((s): s is Submission => !!s)
  const fields: Record<string, string> = {}
  for (const sub of subs) {
    const skill = skillOf(db, sub.skillId)
    const a = input.answers.find((x) => x.submissionId === sub.id)
    if (!skill || !isConfigured(skill)) {
      fields[`answers.${sub.id}`] = "skillNotUsable"
      continue
    }
    if (!a) {
      fields[`answers.${sub.id}`] = "required"
      continue
    }
    for (const [k, v] of Object.entries(responseErrors(skill.model, a.responses))) fields[`answers.${sub.id}.${k}`] = v
    // EV-06: where the program made feedback mandatory the evaluation cannot be submitted without it.
    if (skill.evaluatorComment === "mandatory" && !(a.comment ?? "").trim()) fields[`answers.${sub.id}.comment`] = "required"
  }
  if (Object.keys(fields).length) return fail("invalid", "Check the highlighted answers.", { fields })

  const ids = idsFrom(db)
  const evals: Evaluation[] = []
  const results: SubmitEvaluationValue["results"] = []
  for (const sub of subs) {
    const skill = skillOf(db, sub.skillId)!
    const a = input.answers.find((x) => x.submissionId === sub.id)!
    evals.push({
      id: ids.next("evl"),
      submissionId: sub.id,
      revision: sub.revision,
      evaluator: link.evaluator,
      responses: a.responses,
      comment: (a.comment ?? "").trim(),
      completedAt: ctx.now,
      approvalRequiredAtSubmit: skill.requiresApproval,
    })
    results.push({ submissionId: sub.id, skillId: sub.skillId, countsNow: !skill.requiresApproval })
  }
  const done = new Set(subs.map((s) => s.id))
  return ok(
    {
      ...db,
      seq: ids.seq(),
      evaluations: [...db.evaluations, ...evals],
      submissions: db.submissions.map((s) => (done.has(s.id) ? { ...s, lifecycle: "completed" as const } : s)),
      links: db.links.map((l) => (l.token === link.token ? { ...l, submittedAt: ctx.now } : l)),
    },
    { results },
  )
}

// ------------------------------------------------------------------ administrator review (AR-01..AR-06)

/**
 * AR-05: approve (it counts) or return (it goes back for correction and does not count). AR-04: the note is optional
 * and retained. OD-16 is OPEN: the lifecycle becomes `returned`; WHO corrects is not encoded here (the student
 * "Revise and resend" action exists because RV-01 says so, and disappears if OD-16 resolves the other way).
 */
export function reviewEvaluation(db: Db, input: { evaluationId: Id; decision: "approved" | "returned"; note?: string; returnTarget?: ReturnTarget | null }, ctx: ActionCtx): Result<{ reviewId: Id }> {
  const ev = db.evaluations.find((e) => e.id === input.evaluationId)
  if (!ev) return fail("notFound", "Not found.")
  const sub = db.submissions.find((s) => s.id === ev.submissionId)
  if (!sub || currentEvaluation(db, sub)?.id !== ev.id || submissionState(db, sub) !== "awaitingApproval") {
    return fail("notAwaitingApproval", "This evaluation is not waiting for a decision.")
  }
  const ids = idsFrom(db)
  const review: Review = { id: ids.next("rev"), evaluationId: ev.id, decision: input.decision, note: (input.note ?? "").trim(), at: ctx.now, returnTarget: input.decision === "returned" ? (input.returnTarget ?? null) : null }
  return ok(
    {
      ...db,
      seq: ids.seq(),
      reviews: [...db.reviews, review],
      submissions: db.submissions.map((s) => (s.id === sub.id ? { ...s, lifecycle: input.decision === "returned" ? ("returned" as const) : s.lifecycle } : s)),
    },
    { reviewId: review.id },
  )
}
