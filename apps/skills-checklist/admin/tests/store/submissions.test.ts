import { describe, expect, it } from "vitest"
import * as S from "@/lib/store"
import { SCENARIO } from "@/lib/seed"
import { ctx, must, seed } from "./helpers"

const PRIYA = SCENARIO.priya // one placement (Harbor Family Practice, outpatient only) for NURS 350 Fall 2026
const OFF = "off-350-f26"
const foley = (over: Partial<S.SendSkillInput> = {}): S.SendSkillInput => ({ skillId: "sk-foley", values: { "sk-foley-f-date": "2026-09-01" }, ...over })
const send = (db: ReturnType<typeof seed>, over: Partial<S.SendInput> = {}) =>
  S.sendForReview(db, { studentId: PRIYA, offeringId: OFF, performedIn: "clinical", evaluator: { roleId: "preceptor", personId: "ev-delgado" }, skills: [foley()], ...over }, ctx)

describe("send options: the S-13 decision table (ST-05..ST-09, OD-25 as data)", () => {
  it("one placement with one setting is INFERRED (ST-06)", () => {
    const o = S.computeSendOptions(seed(), { studentId: PRIYA, offeringId: OFF, skillIds: ["sk-foley"], performedIn: "clinical" })
    expect(o.settingMode).toBe("inferred")
    expect(o.settings).toEqual([{ settingId: "set-outpatient", locationId: "loc-harbor" }])
    expect(o.roles).toEqual(["preceptor", "clinical_faculty"])
    expect(Object.keys(o.evaluatorsByRole)).toEqual(["preceptor", "clinical_faculty"])
  })

  it("several placements or settings: choose among them, with the location recorded alongside (ST-06)", () => {
    const o = S.computeSendOptions(seed(), { studentId: SCENARIO.olivia, offeringId: OFF, skillIds: ["sk-foley"], performedIn: "clinical" })
    expect(o.settingMode).toBe("choose")
    expect(o.settings.map((s) => `${s.settingId}@${s.locationId}`)).toEqual(["set-outpatient@loc-harbor", "set-periop@loc-northgate", "set-outpatient@loc-northgate"])
  })

  it("no placement recorded: the program's full list, location optional (ST-07)", () => {
    const o = S.computeSendOptions(seed(), { studentId: SCENARIO.elena, offeringId: OFF, skillIds: ["sk-foley"], performedIn: "clinical" })
    expect(o.settingMode).toBe("full")
    expect(o.settings).toHaveLength(5)
    expect(o.settings.every((s) => s.locationId === null)).toBe(true)
  })

  it("lab has no setting and offers faculty and lab instructors, with the 'name someone' path (ST-05, ST-09)", () => {
    const o = S.computeSendOptions(seed(), { studentId: PRIYA, offeringId: OFF, skillIds: ["sk-foley"], performedIn: "lab" })
    expect(o.settingMode).toBe("none")
    expect(o.roles).toEqual(["clinical_faculty", "lab_instructor"])
    expect(o.canNameLabInstructor).toBe(true)
  })

  it("an empty role set is BLOCKED WITH A REASON, never a dead end (ST-08)", () => {
    const o = S.computeSendOptions(seed(), { studentId: PRIYA, offeringId: OFF, skillIds: ["sk-o2"], performedIn: "clinical" })
    expect(o.roles).toEqual([])
    expect(o.blocked).toMatchObject({ code: "noValidRole", switchTo: "lab", separately: false })
    expect(o.blocked!.perSkill[0]).toMatchObject({ skillId: "sk-o2", allowedRoles: ["lab_instructor"], validRoles: [] })
  })

  it("a batch uses the INTERSECTION of allowed roles and offers 'send separately' when each skill works alone", () => {
    const db = seed()
    // make the two skills' allowed roles disjoint for clinical evidence
    const tweak = { ...db, skills: db.skills.map((s) => (s.id === "sk-dressing" ? { ...s, allowedRoles: ["clinical_faculty"] } : s.id === "sk-foley" ? { ...s, allowedRoles: ["preceptor"] } : s)) }
    const o = S.computeSendOptions(tweak, { studentId: PRIYA, offeringId: OFF, skillIds: ["sk-dressing", "sk-foley"], performedIn: "clinical" })
    expect(o.roles).toEqual([])
    expect(o.blocked).toMatchObject({ separately: true })
  })

  it("which roles are valid for clinical or lab evidence is DATA (OD-25): changing the map changes the options", () => {
    const db = seed()
    const flipped = { ...db, roleEvidenceMap: { ...db.roleEvidenceMap, preceptor: { clinical: false, lab: true } } }
    const o = S.computeSendOptions(flipped, { studentId: PRIYA, offeringId: OFF, skillIds: ["sk-foley"], performedIn: "clinical" })
    expect(o.roles).toEqual(["clinical_faculty"])
  })

  it("unconfigured and inactive skills are not sendable (IM-09, SL-11)", () => {
    const db = must(S.setSkillActive(seed(), "sk-foley", false)).db
    const o = S.computeSendOptions(db, { studentId: PRIYA, offeringId: OFF, skillIds: ["sk-foley", "sk-ng"], performedIn: "clinical" })
    expect(o.unusable).toEqual([{ skillId: "sk-foley", reason: "inactive" }, { skillId: "sk-ng", reason: "unconfigured" }])
  })
})

describe("sendForReview (ST-04, ST-10, ST-11, ST-13)", () => {
  it("creates a submission per skill with the next attempt number, one request and ONE link; setting is inferred and recorded (ST-06, ST-13)", () => {
    const db = seed()
    const r = must(send(db))
    const sub = r.db.submissions.find((s) => s.id === r.value.submissionIds[0])!
    expect(sub).toMatchObject({ attempt: 4, revision: 0, lifecycle: "awaitingEvaluator", clinicalSettingId: "set-outpatient", locationId: "loc-harbor" })
    expect(S.submissionState(r.db, sub)).toBe("awaitingEvaluator")
    expect(r.value.confirmation).toMatchObject({ settingId: "set-outpatient", locationId: "loc-harbor", performedIn: "clinical" })
    expect(r.value.confirmation.evaluator).toMatchObject({ name: "J. Delgado, RN", roleId: "preceptor" })
    expect(r.value.token).toMatch(/^[a-z0-9]{20,}$/)
  })

  it("several skills together share a request and one evaluator link (ST-04, EV-05)", () => {
    const r = must(send(seed(), { skills: [foley(), { skillId: "sk-dressing", values: { "sk-dressing-f-date": "2026-09-01" } }] }))
    expect(r.value.submissionIds).toHaveLength(2)
    expect(new Set(r.db.submissions.filter((s) => r.value.submissionIds.includes(s.id)).map((s) => s.requestId)).size).toBe(1)
    expect(r.db.links.find((l) => l.token === r.value.token)!.submissionIds).toHaveLength(2)
  })

  it("a student may submit a skill that is not mapped to the course, and it counts (ST-02, CM-05)", () => {
    const mapped = seed().offeringSkillMaps.some((m) => m.offeringId === OFF && m.skillId === "sk-trach")
    expect(mapped).toBe(false)
    const r = must(send(seed(), { skills: [{ skillId: "sk-trach", values: { "sk-trach-f-date": "2026-09-01" } }] }))
    expect(r.db.submissions.at(-1)!.skillId).toBe("sk-trach")
  })

  it("enforces mandatory student details before sending (ST-10)", () => {
    const r = send(seed(), { skills: [foley({ values: {} })] })
    expect(r).toMatchObject({ ok: false, error: { code: "invalid", fields: { "skills.sk-foley.values.sk-foley-f-date": "required" } } })
  })

  it("requires the self-evaluation BEFORE send for a skill configured for it, with the same schema as the evaluator (ST-11, DEC-001)", () => {
    const iv: S.SendSkillInput = { skillId: "sk-iv", values: { "sk-iv-f-date": "2026-09-01", "sk-iv-f-unit": "3 West" } }
    const missing = send(seed(), { skills: [iv] })
    expect(missing).toMatchObject({ ok: false, error: { fields: { "skills.sk-iv.selfEvaluation.responses": "required" } } })
    const wrongKind = send(seed(), { skills: [{ ...iv, selfEvaluation: { kind: "binary", labelId: "a" } }] })
    expect(wrongKind).toMatchObject({ ok: false, error: { fields: { "skills.sk-iv.selfEvaluation.responses": "kindMismatch" } } })
    const okSend = must(send(seed(), { skills: [{ ...iv, selfEvaluation: { kind: "demonstration", levelId: "iv-l3" }, studentNote: "Felt prepared." }] }))
    expect(okSend.db.submissions.at(-1)).toMatchObject({ selfEvaluation: { levelId: "iv-l3" }, studentNote: "Felt prepared." })
  })

  it("refuses a role the skill or the OD-25 data does not allow, and says which roles would work (ST-08)", () => {
    const r = send(seed(), { evaluator: { roleId: "lab_instructor", personId: "lab-ferreira" } })
    expect(r).toMatchObject({ ok: false, error: { code: "roleNotAllowed", data: { allowedRoles: ["preceptor", "clinical_faculty"] } } })
  })

  it("refuses a setting the student's placement does not offer (ST-06)", () => {
    const r = send(seed(), { setting: { settingId: "set-emergency", locationId: "loc-harbor" } })
    expect(r).toMatchObject({ ok: false, error: { fields: { setting: "notOffered" } } })
  })

  it("a clinical request needs a setting when there is more than one choice (ST-06)", () => {
    const r = send(seed(), { studentId: SCENARIO.olivia })
    expect(r).toMatchObject({ ok: false, error: { fields: { setting: "required" } } })
    const okR = must(send(seed(), { studentId: SCENARIO.olivia, setting: { settingId: "set-periop", locationId: "loc-northgate" } }))
    expect(okR.value.confirmation).toMatchObject({ settingId: "set-periop", locationId: "loc-northgate" })
  })

  it("lab evidence records no setting or location (ST-05)", () => {
    const o2: S.SendSkillInput = { skillId: "sk-o2", values: { "sk-o2-f-date": "2026-09-01" } }
    const r = must(send(seed(), { performedIn: "lab", evaluator: { roleId: "lab_instructor", personId: "lab-larsen" }, skills: [o2] }))
    expect(r.db.submissions.at(-1)).toMatchObject({ performedIn: "lab", clinicalSettingId: null, locationId: null })
  })

  it("a lab instructor who is not on the roster can be NAMED with an email, and is queued for the admin to adopt (ST-09, SL-09)", () => {
    const o2: S.SendSkillInput = { skillId: "sk-o2", values: { "sk-o2-f-date": "2026-09-01" } }
    const bad = send(seed(), { performedIn: "lab", evaluator: { roleId: "lab_instructor", named: { name: "New Person", email: "nope" } }, skills: [o2] })
    expect(bad).toMatchObject({ ok: false, error: { fields: { "evaluator.named.email": "invalid" } } })
    const r = must(send(seed(), { performedIn: "lab", evaluator: { roleId: "lab_instructor", named: { name: "New Person", email: "new.person@example.edu" } }, skills: [o2] }))
    expect(S.labInstructorRows(r.db).named.map((n) => n.item.name)).toContain("New Person")
    expect(r.db.submissions.at(-1)!.evaluator).toMatchObject({ source: "studentNamed", roleId: "lab_instructor" })
    // naming the same person again reuses the record: no duplicate spelling
    const again = must(S.sendForReview(r.db, { studentId: PRIYA, offeringId: OFF, performedIn: "lab", evaluator: { roleId: "lab_instructor", named: { name: "new  person", email: "NEW.person@example.edu" } }, skills: [o2] }, ctx))
    expect(again.db.namedLabInstructors.filter((n) => n.email.toLowerCase() === "new.person@example.edu")).toHaveLength(1)
  })

  it("refuses unusable skills and an empty request", () => {
    expect(send(seed(), { skills: [{ skillId: "sk-ng", values: {} }] })).toMatchObject({ ok: false, error: { code: "skillNotUsable" } })
    expect(send(seed(), { skills: [] })).toMatchObject({ ok: false, error: { code: "invalid" } })
  })

  it("an achieved skill can be requested again (EC-25)", () => {
    const r = must(S.sendForReview(seed(), { studentId: SCENARIO.noah, offeringId: OFF, performedIn: "clinical", setting: { settingId: "set-inpatient", locationId: "loc-staubin" }, evaluator: { roleId: "preceptor", personId: "ev-delgado" }, skills: [{ skillId: "sk-recon", values: { "sk-recon-f-date": "2026-09-01" } }] }, ctx))
    expect(r.db.submissions.at(-1)!.attempt).toBe(4)
  })
})

const answerFor = (db: ReturnType<typeof seed>, token: string, pass = true) => {
  const req = S.evaluatorRequest(db, token).request!
  return req.items.map((it) => ({
    submissionId: it.submissionId,
    responses:
      it.model.kind === "demonstration"
        ? ({ kind: "demonstration", levelId: it.model.levels[0].id } as const)
        : it.model.kind === "question"
          ? ({ kind: "question", answers: Object.fromEntries(it.model.questions.map((q) => [q.id, pass])) } as const)
          : it.model.kind === "binary"
            ? ({ kind: "binary", labelId: pass ? it.model.qualifyingLabelId! : it.model.qualifyingLabelId === "a" ? "b" : "a" } as const)
            : ({ kind: "scored", scores: Object.fromEntries(it.model.questions.map((q) => [q.id, pass ? 4 : 1])) } as const),
    comment: "Good.",
  }))
}

describe("evaluator link and submission (EV-01..EV-07)", () => {
  it("opens the request from the token with NO account and shows only what is behind the link (EV-01, EV-03, EV-04)", () => {
    const r = must(send(seed(), { skills: [foley({ studentNote: "My note" })] }))
    const view = S.evaluatorRequest(r.db, r.value.token)
    expect(view.status).toBe("ok")
    expect(view.request).toMatchObject({ studentName: "Priya Tran", performedIn: "clinical", settingName: "Outpatient clinic", locationName: "Harbor Family Practice", evaluatorName: "J. Delgado, RN", roleLabel: "Preceptor" })
    expect(view.request!.items[0]).toMatchObject({ skillName: "Foley Catheter Insertion", studentNote: "My note", heldForApproval: false })
    expect(view.request!.items[0].studentValues).toEqual([{ label: "Completion date", value: "2026-09-01" }])
  })

  it("ISOLATION: the evaluator view carries no achievement status, progress, history or other students (OD-17, L-5, L-6)", () => {
    const db = seed()
    const r = must(send(db))
    const json = JSON.stringify(S.evaluatorRequest(r.db, r.value.token))
    for (const forbidden of ["achieved", "partial", "noEvidence", "evidenceDoesNotQualify", "qualifyingCount", "attainment", "progress", "stu-", "Olivia", "Noah"]) {
      expect(json, forbidden).not.toContain(forbidden)
    }
    // the token is the only way in; a guessed or malformed token reveals nothing
    expect(S.evaluatorRequest(r.db, "nope")).toEqual({ status: "invalid" })
    expect(S.evaluatorRequest(r.db, r.value.token.slice(0, -1))).toEqual({ status: "invalid" })
  })

  it("tokens are opaque: different requests get different tokens, and ids never appear in them", () => {
    const a = must(send(seed()))
    const b = must(send(a.db))
    expect(a.value.token).not.toBe(b.value.token)
    expect(a.value.token).not.toContain("sub-")
  })

  it("opening the link does not consume it (L-10): only a submit does", () => {
    const r = must(send(seed()))
    S.evaluatorRequest(r.db, r.value.token)
    expect(S.evaluatorRequest(r.db, r.value.token).status).toBe("ok")
  })

  it("submits an evaluation: skills that do not need approval count NOW; approval skills are HELD (EV-07)", () => {
    const db = seed()
    const iv: S.SendSkillInput = { skillId: "sk-iv", values: { "sk-iv-f-date": "2026-09-01", "sk-iv-f-unit": "3 West" }, selfEvaluation: { kind: "demonstration", levelId: "iv-l2" } }
    const sent = must(send(db, { skills: [foley(), iv] }))
    const answers = answerFor(sent.db, sent.value.token)
    const r = must(S.submitEvaluation(sent.db, { token: sent.value.token, answers }, ctx))
    expect(r.value.results.map((x) => [x.skillId, x.countsNow])).toEqual([["sk-foley", true], ["sk-iv", false]])
    const [fSub, iSub] = sent.value.submissionIds
    expect(S.submissionState(r.db, r.db.submissions.find((s) => s.id === fSub)!)).toBe("counted")
    expect(S.submissionState(r.db, r.db.submissions.find((s) => s.id === iSub)!)).toBe("awaitingApproval")
    // the evaluator is NOT told the student's status
    expect(JSON.stringify(r.value)).not.toMatch(/achieved|partial|progress/)
  })

  it("derives 'did not meet criteria' from the CURRENT rule (AE-02)", () => {
    const sent = must(send(seed()))
    const r = must(S.submitEvaluation(sent.db, { token: sent.value.token, answers: answerFor(sent.db, sent.value.token, false) }, ctx))
    expect(S.submissionState(r.db, r.db.submissions.find((s) => s.id === sent.value.submissionIds[0])!)).toBe("didNotMeet")
  })

  it("requires every answer and a comment where the program made it mandatory (EV-05, EV-06), atomically", () => {
    const iv: S.SendSkillInput = { skillId: "sk-iv", values: { "sk-iv-f-date": "2026-09-01", "sk-iv-f-unit": "3 West" }, selfEvaluation: { kind: "demonstration", levelId: "iv-l2" } }
    const sent = must(send(seed(), { skills: [foley(), iv] }))
    const good = answerFor(sent.db, sent.value.token)
    const noComment = good.map((a) => (a.submissionId === sent.value.submissionIds[1] ? { ...a, comment: " " } : a))
    const r = S.submitEvaluation(sent.db, { token: sent.value.token, answers: noComment }, ctx)
    expect(r).toMatchObject({ ok: false, error: { code: "invalid", fields: { [`answers.${sent.value.submissionIds[1]}.comment`]: "required" } } })
    // nothing was saved, not even the valid Foley answer
    expect(sent.db.evaluations.length).toBe(seed().evaluations.length)
    const missingQ = good.map((a) => (a.responses.kind === "question" ? { ...a, responses: { kind: "question" as const, answers: {} } } : a))
    expect(S.submitEvaluation(sent.db, { token: sent.value.token, answers: missingQ }, ctx)).toMatchObject({ ok: false })
    expect(S.submitEvaluation(sent.db, { token: sent.value.token, answers: good.slice(0, 1) }, ctx)).toMatchObject({ ok: false })
  })

  it("a link cannot be submitted twice, and a bad token is neutral (L-2, OD-18 open)", () => {
    const sent = must(send(seed()))
    const done = must(S.submitEvaluation(sent.db, { token: sent.value.token, answers: answerFor(sent.db, sent.value.token) }, ctx))
    expect(S.submitEvaluation(done.db, { token: sent.value.token, answers: [] }, ctx)).toMatchObject({ ok: false, error: { code: "alreadySubmitted" } })
    expect(S.evaluatorRequest(done.db, sent.value.token).status).toBe("submitted")
    expect(S.submitEvaluation(done.db, { token: "bad", answers: [] }, ctx)).toMatchObject({ ok: false, error: { code: "linkInvalid" } })
  })

  it("a completed Evaluation is IMMUTABLE: no later action rewrites it (RV-03)", () => {
    const iv: S.SendSkillInput = { skillId: "sk-iv", values: { "sk-iv-f-date": "2026-09-01", "sk-iv-f-unit": "3 West" }, selfEvaluation: { kind: "demonstration", levelId: "iv-l2" } }
    const sent = must(send(seed(), { skills: [iv] }))
    const done = must(S.submitEvaluation(sent.db, { token: sent.value.token, answers: answerFor(sent.db, sent.value.token) }, ctx))
    const ev = done.db.evaluations.at(-1)!
    const snapshot = JSON.stringify(ev)
    const reviewed = must(S.reviewEvaluation(done.db, { evaluationId: ev.id, decision: "returned", note: "Fix the unit." }, ctx))
    const resent = must(S.reviseAndResend(reviewed.db, sent.value.submissionIds[0], { values: { "sk-iv-f-date": "2026-09-01", "sk-iv-f-unit": "4 East" } }, ctx))
    expect(JSON.stringify(resent.db.evaluations.find((e) => e.id === ev.id))).toBe(snapshot)
    expect(resent.db.evaluations.length).toBe(done.db.evaluations.length) // revising never edits or deletes it
  })
})

describe("administrator review (AR-01..AR-06)", () => {
  const jonahItem = (db: ReturnType<typeof seed>) => S.reviewQueue(db).find((i) => i.studentId === SCENARIO.jonah)!

  it("lists what is waiting with student, skill, course, setting, location, evaluator and role, and a comparison (AR-01, AR-02)", () => {
    const i = jonahItem(seed())
    expect(i).toMatchObject({ studentName: "Jonah Nakamura", skillName: "IV Insertion", agree: false, selfEvaluation: { kind: "demonstration", level: "With assistance" }, evaluator: { kind: "demonstration", level: "Independent" } })
    expect(i.settingName).toBeTruthy()
    expect(i.locationName).toBeTruthy()
  })

  it("pending evidence is excluded from achievement until approved; approving makes it count (AE-01, AR-05, AR-06)", () => {
    const db = seed()
    const before = S.skillProgress(db, SCENARIO.jonah, "sk-iv")!.evaluation.qualifyingCount
    const approved = must(S.reviewEvaluation(db, { evaluationId: jonahItem(db).evaluationId, decision: "approved" }, ctx))
    expect(S.skillProgress(approved.db, SCENARIO.jonah, "sk-iv")!.evaluation.qualifyingCount).toBe(before + 1)
    expect(S.reviewQueue(approved.db).some((i) => i.studentId === SCENARIO.jonah)).toBe(false)
  })

  it("returning keeps it out of the record, retains the reviewer's note and sets the submission to returned (AR-04, AR-05, RV-02)", () => {
    const db = seed()
    const item = jonahItem(db)
    const r = must(S.reviewEvaluation(db, { evaluationId: item.evaluationId, decision: "returned", note: "  Please check the date.  " }, ctx))
    const sub = r.db.submissions.find((s) => s.id === item.submissionId)!
    expect(S.submissionState(r.db, sub)).toBe("returned")
    expect(S.returnReason(r.db, sub.id)).toBe("Please check the date.")
    expect(S.skillProgress(r.db, SCENARIO.jonah, "sk-iv")!.evaluation.qualifyingCount).toBe(S.skillProgress(db, SCENARIO.jonah, "sk-iv")!.evaluation.qualifyingCount)
  })

  it("the note is optional, and only an item waiting for a decision can be reviewed (AR-04)", () => {
    const db = seed()
    const item = jonahItem(db)
    const a = must(S.reviewEvaluation(db, { evaluationId: item.evaluationId, decision: "approved" }, ctx))
    expect(S.reviewEvaluation(a.db, { evaluationId: item.evaluationId, decision: "returned" }, ctx)).toMatchObject({ ok: false, error: { code: "notAwaitingApproval" } })
  })
})

describe("a returned evaluation never counts, even if approval is later turned off (AR-05, AE-02)", () => {
  it("excludes the returned evidence under the CURRENT rule", () => {
    const db = seed()
    const withApproval = S.skillProgress(db, SCENARIO.olivia, "sk-iv")!.evaluation.qualifyingCount
    const off = { ...db, skills: db.skills.map((s) => (s.id === "sk-iv" ? { ...s, requiresApproval: false } : s)) }
    // turning approval off makes the approved ones count as before, and the RETURNED one still stays out
    expect(S.skillProgress(off, SCENARIO.olivia, "sk-iv")!.evaluation.qualifyingCount).toBe(withApproval)
  })
})

describe("revision and further attempt (RV-01..RV-05)", () => {
  const olivia = SCENARIO.olivia
  const idOf = (db: ReturnType<typeof seed>, skill: string, state: S.SubmissionState) => db.submissions.find((s) => s.studentId === olivia && s.skillId === skill && S.submissionState(db, s) === state)!

  it("revise and resend continues the SAME record: revision +1, history kept, reviewer note retained (RV-01, RV-02)", () => {
    const db = seed()
    const sub = idOf(db, "sk-iv", "returned")
    const r = must(S.reviseAndResend(db, sub.id, { values: { "sk-iv-f-date": "2026-08-11", "sk-iv-f-unit": "3 West" } }, ctx))
    const next = r.db.submissions.find((s) => s.id === sub.id)!
    expect(next).toMatchObject({ attempt: 5, revision: 2, lifecycle: "awaitingEvaluator" })
    expect(S.submissionState(r.db, next)).toBe("revised")
    expect(r.db.submissions).toHaveLength(db.submissions.length) // no new record
    expect(r.db.evaluations).toHaveLength(db.evaluations.length) // old evaluations kept
    expect(S.evidenceLedger(r.db, olivia, "sk-iv").find((l) => l.submissionId === sub.id)!.reviewerNote).toBeNull() // current revision not yet reviewed
  })

  it("the resent request goes to the same or a DIFFERENT evaluator, and the old link stops working (RV-04, L-3)", () => {
    const db = seed()
    const sub = idOf(db, "sk-recon", "awaitingEvaluator")
    const oldToken = db.links.find((l) => l.submissionIds.includes(sub.id))!.token
    const r = must(S.reviseAndResend(db, sub.id, { evaluator: { roleId: "preceptor", personId: "ev-okonkwo" } }, ctx))
    expect(r.db.submissions.find((s) => s.id === sub.id)!.evaluator.name).toBe("M. Okonkwo, RN")
    expect(S.evaluatorRequest(r.db, oldToken).status).toBe("superseded")
    expect(S.evaluatorRequest(r.db, r.value.token).status).toBe("ok")
    expect(S.submitEvaluation(r.db, { token: oldToken, answers: [] }, ctx)).toMatchObject({ ok: false, error: { code: "linkSuperseded" } })
  })

  it("a counted or awaiting-approval submission is LOCKED: it cannot be edited or resent (RV-05)", () => {
    const db = seed()
    const counted = db.submissions.find((s) => S.submissionState(db, s) === "counted")!
    expect(S.reviseAndResend(db, counted.id, {}, ctx)).toMatchObject({ ok: false, error: { code: "locked" } })
    const waiting = db.submissions.find((s) => S.submissionState(db, s) === "awaitingApproval")!
    expect(S.reviseAndResend(db, waiting.id, {}, ctx)).toMatchObject({ ok: false, error: { code: "locked" } })
    // and a completed evaluation that did not meet the criteria is not edited either: it takes a further attempt (RV-03)
    const failed = db.submissions.find((s) => S.submissionState(db, s) === "didNotMeet")!
    expect(S.reviseAndResend(db, failed.id, {}, ctx)).toMatchObject({ ok: false, error: { code: "notEditable" } })
  })

  it("a further attempt is a NEW record after a did-not-meet evaluation, and the original is left intact (RV-03)", () => {
    const db = seed()
    const failed = db.submissions.find((s) => s.studentId === PRIYA && s.skillId === "sk-foley")!
    expect(S.submissionState(db, failed)).toBe("didNotMeet")
    const r = must(S.startFurtherAttempt(db, failed.id, { studentId: PRIYA, offeringId: OFF, performedIn: "clinical", evaluator: { roleId: "preceptor", personId: "ev-delgado" }, skill: foley() }, ctx))
    expect(r.db.submissions).toHaveLength(db.submissions.length + 1)
    expect(JSON.stringify(r.db.submissions.find((s) => s.id === failed.id))).toBe(JSON.stringify(failed))
    expect(r.db.submissions.at(-1)!.attempt).toBe(4)
    // not available from a counted submission
    const counted = db.submissions.find((s) => S.submissionState(db, s) === "counted")!
    expect(S.startFurtherAttempt(db, counted.id, { studentId: counted.studentId, offeringId: counted.offeringId, performedIn: "clinical", evaluator: { roleId: "preceptor", personId: "ev-delgado" }, skill: foley({ skillId: counted.skillId }) }, ctx)).toMatchObject({ ok: false, error: { code: "notFurtherAttempt" } })
  })

  it("history offers the right next action per state and never an edit on a locked item (SH-02)", () => {
    const db = seed()
    const h = S.skillHistory(db, SCENARIO.olivia, "sk-iv")!
    const returned = h.attempts.find((a) => a.state === "returned")!
    expect(returned.actions).toEqual({ revise: true, furtherAttempt: false, locked: false })
    expect(h.attempts.filter((a) => a.state === "counted").every((a) => a.actions.locked)).toBe(true)
    expect(h.counters).toMatchObject({ counted: 4, returned: 1 })
    const p = S.skillHistory(db, PRIYA, "sk-foley")!
    expect(p.attempts.every((a) => a.state === "didNotMeet" && a.actions.furtherAttempt)).toBe(true)
  })
})

describe("OD-16 seam: returnTarget exists but nothing commits to it", () => {
  it("a return stores returnTarget as null by default and the lifecycle is the same either way", () => {
    const db = seed()
    const item = S.reviewQueue(db)[0]
    const plain = must(S.reviewEvaluation(db, { evaluationId: item.evaluationId, decision: "returned", note: "x" }, ctx))
    const rv = plain.db.reviews.find((r) => r.id === plain.value.reviewId)!
    expect(rv.returnTarget ?? null).toBeNull()
    const sub = (d: typeof db) => d.submissions.find((s) => s.id === item.submissionId)!
    expect(S.submissionState(plain.db, sub(plain.db))).toBe("returned")
    // the seam can record either answer later without changing behaviour today
    for (const t of ["student", "evaluator"] as const) {
      const r = must(S.reviewEvaluation(db, { evaluationId: item.evaluationId, decision: "returned", returnTarget: t }, ctx))
      expect(r.db.reviews.find((x) => x.id === r.value.reviewId)!.returnTarget).toBe(t)
      expect(S.submissionState(r.db, sub(r.db))).toBe("returned")
    }
  })

  it("an approval never carries a return target", () => {
    const db = seed()
    const item = S.reviewQueue(db)[0]
    const r = must(S.reviewEvaluation(db, { evaluationId: item.evaluationId, decision: "approved", returnTarget: "student" }, ctx))
    expect(r.db.reviews.find((x) => x.id === r.value.reviewId)!.returnTarget ?? null).toBeNull()
  })
})

describe("evaluatorRequest carries requestedAt and returnedEarlier (S-16)", () => {
  it("requestedAt is the link's creation time; a fresh request is not a corrected resend", () => {
    const r = must(send(seed()))
    const req = S.evaluatorRequest(r.db, r.value.token).request!
    expect(req.requestedAt).toBe(ctx.now)
    expect(req.items.every((i) => i.returnedEarlier === false)).toBe(true)
  })

  it("after a return and a revise-and-resend the item is flagged returnedEarlier", () => {
    const db = seed()
    const item = S.reviewQueue(db)[0]
    const returned = must(S.reviewEvaluation(db, { evaluationId: item.evaluationId, decision: "returned", note: "Fix." }, ctx))
    const resent = must(S.reviseAndResend(returned.db, item.submissionId, {}, ctx))
    const req = S.evaluatorRequest(resent.db, resent.value.token).request!
    expect(req.items.find((i) => i.submissionId === item.submissionId)!.returnedEarlier).toBe(true)
  })
})
