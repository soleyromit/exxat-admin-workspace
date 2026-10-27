import { describe, expect, it } from "vitest"
import { requestAccess, blankResponse } from "@/lib/v2/preceptor"
import {
  approveBlock, approveItems, blankPaper, canReview, compareEvaluation, findQueueItem, priorAttempts, queueItems, reassignOptions, reassignRequest, recordPaperOutcome, resendSubmission, returnedItems, returnItem, returnNextStep, signerChoices, stalledRequests,
} from "@/lib/v2/queue"
import { COUNTER_BY_ID } from "@/lib/v2/selectors"
import { createSeed, IDS } from "@/lib/v2/seed"
import { requestWaitText, skillProgress, studentHistory } from "@/lib/v2/student"
import type { Evaluation, V2State } from "@/lib/v2/types"

const AT = "2026-10-20T10:00:00Z"
const ROSS = IDS.ross
const HADDAD = IDS.reviewer
const BG = "sk-blood-glucose"

function must<T extends { ok: boolean }>(r: T): Extract<T, { ok: true }> {
  if (!r.ok) throw new Error(`expected ok, got ${JSON.stringify(r)}`)
  return r as Extract<T, { ok: true }>
}

describe("the queue (AR-01)", () => {
  it("lists evaluations awaiting approval and photos of paper forms, not stalled or finished requests", () => {
    const s = createSeed()
    const items = queueItems(s)
    const keys = items.map((i) => i.key)
    expect(keys).toContain("ev-maya-7")
    expect(keys).toContain("sub-02")
    expect(keys).toContain("sub-04")
    expect(keys).not.toContain("sub-03")
    expect(keys).not.toContain("sub-06")
    expect(keys).not.toContain("sub-maya-1")
    // The nine hand-written items, plus the generated cohort's.
    expect(items.filter((i) => !i.key.startsWith("sub-g-"))).toHaveLength(9)
    expect(items.length).toBeGreaterThan(9)
    expect(items.map((i) => i.key)).not.toEqual(expect.arrayContaining(stalledRequests(s).map((x) => x.id)))
  })

  it("separates a photo that still needs its outcome from an evaluation that is ready", () => {
    const s = createSeed()
    const photo = findQueueItem(s, "sub-04")!
    expect(photo).toMatchObject({ source: "paper-form", state: "needs-outcome", evaluations: [] })
    const link = findQueueItem(s, "sub-02")!
    expect(link).toMatchObject({ source: "evaluator", state: "ready" })
    expect(link.evaluations.map((e) => e.id)).toEqual(["ev-rq-1"])
    expect(link.evaluatorId).toBe(IDS.delgado)
  })

  it("holds the stalled request apart, with the person it is stuck with", () => {
    const s = createSeed()
    const st = stalledRequests(s)
    const hero = st.filter((x) => !x.id.startsWith("sub-g-"))
    expect(hero.map((x) => x.id)).toEqual(["sub-03"])
    expect(hero[0].assignedToId).toBe(IDS.delgado)
  })

  it("only an administrator or a clinical coordinator can act", () => {
    const s = createSeed()
    for (const id of [IDS.maya, IDS.delgado, IDS.director, IDS.whitmore]) {
      expect(canReview(s.people.find((p) => p.id === id))).toBe(false)
      expect(approveItems(s, ["ev-maya-7"], id, AT).ok).toBe(false)
      expect(returnItem(s, "ev-maya-7", { reason: "x" }, id, AT).ok).toBe(false)
    }
    expect(canReview(s.people.find((p) => p.id === ROSS))).toBe(true)
    expect(canReview(s.people.find((p) => p.id === HADDAD))).toBe(true)
  })
})

describe("approve (AR-05, AR-06)", () => {
  it("counts the evaluation, moves the student's progress, audits it and leaves the queue", () => {
    const s = createSeed()
    const before = skillProgress(s, IDS.maya, BG)!
    expect(before.counted).toBe(0)
    expect(before.awaiting).toBe(1)
    const waitingBefore = COUNTER_BY_ID.evalsWaiting.value(s)
    const r = must(approveItems(s, ["ev-maya-7"], ROSS, AT, "Checked against the form."))
    const e = r.state.evaluations.find((x) => x.id === "ev-maya-7")!
    expect(e.status).toBe("counted")
    expect(e.review).toEqual({ decision: "approved", byId: ROSS, at: AT, note: "Checked against the form." })
    const after = skillProgress(r.state, IDS.maya, BG)!
    expect(after.counted).toBe(1)
    expect(after.awaiting).toBe(0)
    expect(findQueueItem(r.state, "ev-maya-7")).toBeUndefined()
    expect(COUNTER_BY_ID.evalsWaiting.value(r.state)).toBe(waitingBefore - 1)
    expect(COUNTER_BY_ID.evalsCounted.value(r.state)).toBe(COUNTER_BY_ID.evalsCounted.value(s) + 1)
    expect(r.state.audit[0]).toMatchObject({ actorId: ROSS, action: "Approved an evaluation, it now counts", at: AT })
    expect(r.state.audit[0].target).toContain("Point-of-care blood glucose for Maya Ferreira")
    // The input state was not changed.
    expect(s.evaluations.find((x) => x.id === "ev-maya-7")!.status).toBe("awaiting-approval")
  })

  it("closes the request when its evaluation is approved", () => {
    const s = createSeed()
    const r = must(approveItems(s, ["sub-02"], HADDAD, AT))
    expect(r.state.submissions.find((x) => x.id === "sub-02")!.status).toBe("done")
    expect(r.state.evaluations.find((x) => x.id === "ev-rq-1")!.status).toBe("counted")
    expect(COUNTER_BY_ID.queueWaiting.value(r.state)).toBe(COUNTER_BY_ID.queueWaiting.value(s) - 1)
  })

  it("an approved not-met never opens a plan on its own (remediation is out of scope, REQ section 14)", () => {
    const s = createSeed()
    const e: Evaluation = { ...s.evaluations.find((x) => x.id === "ev-maya-7")!, id: "ev-t-nm", skillId: "sk-sterile-dressing", outcome: "not-met", versions: [{ version: 1, outcome: "not-met", at: AT, by: IDS.delgado, reason: null }] }
    const withIt: V2State = { ...s, evaluations: [...s.evaluations, e] }
    const r = must(approveItems(withIt, ["ev-t-nm"], ROSS, AT))
    expect(r.plansOpened).toBe(0)
    expect(r.state.remediations).toHaveLength(s.remediations.length)
  })

  it("bulk approve: the blocked item stays and is named with its reason, the others go through (partial failure)", () => {
    const s = createSeed()
    const r = must(approveItems(s, ["ev-maya-7", "sub-02", "sub-04"], ROSS, AT))
    expect(r.approvedKeys).toEqual(["ev-maya-7", "sub-02"])
    expect(r.evaluations).toBe(2)
    expect(r.blocked).toHaveLength(1)
    expect(r.blocked[0].key).toBe("sub-04")
    expect(r.blocked[0].label).toBe("Tomas Alvarez, Vital signs and early warning score and Point-of-care blood glucose")
    expect(r.blocked[0].reason).toMatch(/Enter the outcome from the paper form first/)
    expect(r.state.submissions.find((x) => x.id === "sub-04")!.status).toBe("awaiting-review")
    expect(findQueueItem(r.state, "sub-04")).toBeDefined()
    expect(findQueueItem(r.state, "sub-02")).toBeUndefined()
    // Each approved evaluation has its own audit entry; the blocked one has none.
    expect(r.state.audit.filter((a) => a.action.startsWith("Approved")).length).toBe(2)
  })

  it("refuses with the reasons when every chosen item is blocked, and changes nothing", () => {
    const s = createSeed()
    const r = approveItems(s, ["sub-04"], ROSS, AT)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/^Nothing was approved\. .*paper form first/)
  })

  it("names an item that left the queue, and an empty selection", () => {
    const s = createSeed()
    const r = must(approveItems(s, ["ev-maya-7", "ev-nope"], ROSS, AT))
    expect(r.blocked).toEqual([{ key: "ev-nope", label: "An item", reason: expect.stringMatching(/no longer in the queue/) }])
    expect(approveItems(s, [], ROSS, AT)).toMatchObject({ ok: false, error: "Choose at least one submission to approve." })
    const twice = must(approveItems(s, ["ev-maya-7", "ev-maya-7"], ROSS, AT))
    expect(twice.approvedKeys).toEqual(["ev-maya-7"])
  })

  it("blocks a paper-form item whose signer is not qualified, and says who and why", () => {
    const s = createSeed()
    const entered = must(recordPaperOutcome(s, "sub-04", paperAnswers(s), HADDAD, AT))
    expect(approveBlock(entered.state, findQueueItem(entered.state, "sub-04")!)).toBeNull()
    // The program later requires a credential the signer does not hold.
    const strict = structuredClone(entered.state)
    strict.skills.find((k) => k.id === BG)!.config!.qualification.credentials = ["NP"]
    const why = approveBlock(strict, findQueueItem(strict, "sub-04")!)
    expect(why).toMatch(/J\. Delgado, RN cannot sign off Point-of-care blood glucose\. Needs NP credential/)
    const bulk = approveItems(strict, ["sub-04", "ev-maya-7"], ROSS, AT)
    const ok = must(bulk)
    expect(ok.approvedKeys).toEqual(["ev-maya-7"])
    expect(ok.blocked[0].key).toBe("sub-04")
  })
})

describe("return (AR-05, RV-01, RV-02)", () => {
  it("needs a reason the student can act on", () => {
    const s = createSeed()
    expect(returnItem(s, "sub-02", { reason: "   " }, ROSS, AT)).toMatchObject({ ok: false, error: "Say what is wrong and what to change. The student reads this." })
    const long = returnItem(s, "sub-02", { reason: "x".repeat(1001) }, ROSS, AT)
    expect(long.ok).toBe(false)
    expect(returnItem(s, "nope", { reason: "x" }, ROSS, AT).ok).toBe(false)
  })

  it("marks the request and its evaluations returned: they do not count, the student reads the reason", () => {
    const s = createSeed()
    const r = must(returnItem(s, "sub-02", { reason: "The setting is wrong. Log it again as Outpatient." }, HADDAD, AT))
    const x = r.state.submissions.find((y) => y.id === "sub-02")!
    expect(x.status).toBe("returned")
    expect(x.returns).toEqual([{ at: AT, byId: HADDAD, reason: "The setting is wrong. Log it again as Outpatient.", revision: 1 }])
    const e = r.state.evaluations.find((y) => y.id === "ev-rq-1")!
    expect(e.status).toBe("returned")
    expect(e.review).toMatchObject({ decision: "returned", note: "The setting is wrong. Log it again as Outpatient." })
    expect(skillProgress(r.state, "stu-02", "sk-med-admin")!.awaiting).toBe(0)
    expect(findQueueItem(r.state, "sub-02")).toBeUndefined()
    expect(returnedItems(r.state).map((i) => i.key)).toContain("sub-02")
    expect(requestWaitText(r.state, x)).toBe("Returned for correction: The setting is wrong. Log it again as Outpatient.")
    const att = studentHistory(r.state, "stu-02").skills.find((k) => k.skill.id === "sk-med-admin")!.attempts.find((a) => a.key === "ev-rq-1")!
    expect(att).toMatchObject({ kind: "returned", returnReason: "The setting is wrong. Log it again as Outpatient." })
    expect(r.state.audit[0]).toMatchObject({ action: "Returned to the student", actorId: HADDAD })
    expect(COUNTER_BY_ID.returned.value(r.state)).toBe(COUNTER_BY_ID.returned.value(s) + 1)
  })

  it("an evaluation with no request goes back on its own, and the student is told who to ask", () => {
    const s = createSeed()
    const r = must(returnItem(s, "ev-maya-7", { reason: "The evaluator date is missing." }, ROSS, AT))
    expect(r.state.evaluations.find((e) => e.id === "ev-maya-7")!.status).toBe("returned")
    const row = returnedItems(r.state).find((i) => i.key === "ev-maya-7")!
    expect(row).toMatchObject({ reason: "The evaluator date is missing.", submission: null })
    expect(returnNextStep(r.state, null, IDS.delgado)).toBe("Ask J. Delgado, RN to correct it and submit it again.")
    const att = studentHistory(r.state, IDS.maya).skills.find((k) => k.skill.id === BG)!.attempts[0]
    expect(att.kind).toBe("returned")
    expect(att.returnReason).toBe("The evaluator date is missing.")
  })

  it("a photo returned before any outcome was entered shows in the student's record and next action", () => {
    const s = createSeed()
    const r = must(returnItem(s, "sub-04", { reason: "The signature is cut off. Take the photo again with the whole page." }, ROSS, AT))
    const att = studentHistory(r.state, "stu-04").skills.find((k) => k.skill.id === "sk-vitals")!.attempts.at(-1)!
    expect(att).toMatchObject({ kind: "returned", returnReason: "The signature is cut off. Take the photo again with the whole page." })
    expect(returnNextStep(r.state, r.state.submissions.find((x) => x.id === "sub-04")!, IDS.delgado)).toBe("Take a new photo of the signed form and send it again.")
  })

  it("sending it again continues the same record: revision count, reason kept, back with the evaluator", () => {
    const s = createSeed()
    const ret = must(returnItem(s, "sub-02", { reason: "Wrong setting." }, HADDAD, AT))
    const r = must(resendSubmission(ret.state, "sub-02", { note: "Fixed the setting." }, "2026-10-21T08:00:00Z", "stu-02"))
    expect(r.revision).toBe(1)
    const x = r.state.submissions.find((y) => y.id === "sub-02")!
    expect(x).toMatchObject({ status: "with-evaluator", revisions: 1, studentNote: "Fixed the setting.", daysWaiting: 0 })
    expect(x.returns).toHaveLength(1)
    // The returned evaluation stays as history and does not count.
    expect(r.state.evaluations.find((e) => e.id === "ev-rq-1")!.status).toBe("returned")
    expect(requestAccess(r.state, "sub-02").kind).toBe("form")
  })

  it("a photo needs a new photo, and only an image under the size limit", () => {
    const s = createSeed()
    const ret = must(returnItem(s, "sub-04", { reason: "Unreadable." }, ROSS, AT)).state
    expect(resendSubmission(ret, "sub-04", {}, AT, "stu-04")).toMatchObject({ ok: false, error: "Add a new photo of the signed form before you send it again." })
    expect(resendSubmission(ret, "sub-04", { photo: { name: "a.pdf", sizeKb: 10, type: "application/pdf" } }, AT, "stu-04").ok).toBe(false)
    expect(resendSubmission(ret, "sub-04", { photo: { name: "a.jpg", sizeKb: 11 * 1024, type: "image/jpeg" } }, AT, "stu-04").ok).toBe(false)
    const ok = must(resendSubmission(ret, "sub-04", { photo: { name: "retake.jpg", sizeKb: 640, type: "image/jpeg" } }, AT, "stu-04"))
    const x = ok.state.submissions.find((y) => y.id === "sub-04")!
    expect(x).toMatchObject({ status: "awaiting-review", revisions: 1, photo: { name: "retake.jpg", sizeKb: 640 } })
    const item = findQueueItem(ok.state, "sub-04")!
    expect(item).toMatchObject({ state: "needs-outcome", revision: 1 })
  })

  it("refuses to send again what is not returned, or what is not yours (RV-05)", () => {
    const s = createSeed()
    expect(resendSubmission(s, "sub-02", {}, AT, "stu-02")).toMatchObject({ ok: false })
    const ret = must(returnItem(s, "sub-02", { reason: "No." }, ROSS, AT)).state
    expect(resendSubmission(ret, "sub-02", {}, AT, IDS.maya)).toMatchObject({ ok: false, error: "That request is not yours." })
    expect(resendSubmission(ret, "sub-02", { note: "x".repeat(1001) }, AT, "stu-02").ok).toBe(false)
  })
})

function paperAnswers(s: V2State, outcome: "met" | "not-met" | "not-yet" = "met") {
  const item = findQueueItem(s, "sub-04")!
  const base = blankPaper(s, item)
  return { ...base, signerId: IDS.delgado, clinicalSetting: "Inpatient", responses: base.responses.map((r) => ({ ...r, outcome, feedback: outcome === "not-yet" ? "Repeat under supervision." : "" })) }
}

describe("photo of a paper form: the reviewer enters the outcome", () => {
  it("starts blank for every skill and names nobody until a signer is chosen", () => {
    const s = createSeed()
    const p = blankPaper(s, findQueueItem(s, "sub-04")!)
    expect(p.signerId).toBe("")
    expect(p.responses.map((r) => r.skillId)).toEqual(["sk-vitals", BG])
    expect(p.responses.every((r) => r.outcome === null)).toBe(true)
  })

  it("lists every problem at once with the field to fix", () => {
    const s = createSeed()
    const r = recordPaperOutcome(s, "sub-04", blankPaper(s, findQueueItem(s, "sub-04")!), ROSS, AT)
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.issues?.map((i) => i.field)).toEqual(expect.arrayContaining(["paper-signer", "paper-setting", "out-sk-vitals", `out-${BG}`]))
    expect(r.error).toMatch(/^Fix \d+ problems? before you record the outcome\.$/)
  })

  it("refuses a signer who is not qualified, and a lab instructor for a clinical form", () => {
    const s = createSeed()
    const r = recordPaperOutcome(s, "sub-04", { ...paperAnswers(s), signerId: IDS.whitmore }, ROSS, AT)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.issues?.find((i) => i.field === "paper-signer")?.message).toMatch(/R\. Whitmore cannot sign off .*Lab instructors sign off in the lab/)
  })

  it("the reviewer cannot sign off a form they enter themselves, and is not offered as a signer", () => {
    const s = createSeed()
    const item = findQueueItem(s, "sub-04")!
    expect(signerChoices(s, item).some((c) => c.person.id === HADDAD)).toBe(true)
    expect(signerChoices(s, item, HADDAD).some((c) => c.person.id === HADDAD)).toBe(false)
    const r = recordPaperOutcome(s, "sub-04", { ...paperAnswers(s), signerId: HADDAD }, HADDAD, AT)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.issues?.find((i) => i.field === "paper-signer")?.message).toMatch(/cannot enter a form you signed yourself/)
  })

  it("records evaluations marked as a paper form, typed by the reviewer for the signer, waiting for approval", () => {
    const s = createSeed()
    const r = must(recordPaperOutcome(s, "sub-04", paperAnswers(s), HADDAD, AT))
    expect(r.evaluationIds).toHaveLength(2)
    const evs = r.state.evaluations.filter((e) => r.evaluationIds.includes(e.id))
    for (const e of evs) {
      expect(e).toMatchObject({ source: "paper-form", enteredById: HADDAD, evaluatorId: IDS.delgado, status: "awaiting-approval", submissionId: "sub-04", setting: "clinical", clinicalSetting: "Inpatient", studentId: "stu-04" })
      expect(e.versions).toHaveLength(1)
      expect(e.versions[0].by).toBe(HADDAD)
    }
    expect(r.state.audit[0].action).toBe("Entered an evaluation from a signed paper form")
    const item = findQueueItem(r.state, "sub-04")!
    expect(item).toMatchObject({ state: "ready", source: "paper-form", evaluatorId: IDS.delgado })
    expect(approveBlock(r.state, item)).toBeNull()
    // Nothing counts until it is approved (AR-06).
    expect(skillProgress(r.state, "stu-04", BG)!.counted).toBe(0)
    const approved = must(approveItems(r.state, ["sub-04"], HADDAD, AT))
    expect(approved.evaluations).toBe(2)
    expect(approved.state.submissions.find((x) => x.id === "sub-04")!.status).toBe("done")
    expect(skillProgress(approved.state, "stu-04", BG)!.counted).toBeGreaterThanOrEqual(1)
  })

  it("will not take a second outcome, and only for a photo that is waiting", () => {
    const s = createSeed()
    const once = must(recordPaperOutcome(s, "sub-04", paperAnswers(s), ROSS, AT))
    expect(recordPaperOutcome(once.state, "sub-04", paperAnswers(once.state), ROSS, AT)).toMatchObject({ ok: false, error: "An outcome is already entered for this form. Approve it, or return the request." })
    expect(recordPaperOutcome(s, "sub-02", paperAnswers(s), ROSS, AT)).toMatchObject({ ok: false, error: "This is not a photo of a paper form waiting for review." })
  })

  it("Not yet needs feedback, like any evaluation", () => {
    const s = createSeed()
    const p = paperAnswers(s, "not-yet")
    p.responses[0].feedback = ""
    const r = recordPaperOutcome(s, "sub-04", p, ROSS, AT)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.issues?.some((i) => /Not yet records feedback only/.test(i.message))).toBe(true)
    expect(blankResponse(s.skills.find((k) => k.id === BG)!).outcome).toBeNull()
  })
})

describe("reassign a stalled request (RV-04)", () => {
  it("hands it to a qualified person, resets the wait, and audits who, from whom, to whom and why", () => {
    const s = createSeed()
    const opts = reassignOptions(s, s.submissions.find((x) => x.id === "sub-03")!)
    expect(opts.every((o) => o.person.id !== IDS.delgado)).toBe(true)
    expect(opts.find((o) => o.person.id === "pre-castillo")?.eligible).toBe(true)
    const r = must(reassignRequest(s, "sub-03", { toId: "pre-castillo", reason: "On leave until next week." }, ROSS, AT))
    expect(r.toName).toBe("M. Castillo, RN")
    const x = r.state.submissions.find((y) => y.id === "sub-03")!
    expect(x).toMatchObject({ status: "with-evaluator", assignedToId: "pre-castillo", candidateIds: ["pre-castillo"], daysWaiting: 0 })
    expect(x.reassignments).toEqual([{ at: AT, byId: ROSS, fromId: IDS.delgado, toId: "pre-castillo", reason: "On leave until next week." }])
    expect(r.state.audit[0]).toMatchObject({ actorId: ROSS, action: "Reassigned a stalled request" })
    expect(r.state.audit[0].target).toContain("from J. Delgado, RN to M. Castillo, RN")
    expect(r.state.audit[0].target).toContain("On leave until next week.")
    expect(stalledRequests(r.state)).toHaveLength(stalledRequests(s).length - 1)
    expect(stalledRequests(r.state).map((y) => y.id)).not.toContain("sub-03")
    expect(COUNTER_BY_ID.stalled.value(r.state)).toBe(COUNTER_BY_ID.stalled.value(s) - 1)
    expect(COUNTER_BY_ID.withEvaluator.value(r.state)).toBe(COUNTER_BY_ID.withEvaluator.value(s) + 1)
    // The old link stops working for the first person; the new person gets the form.
    expect(requestAccess(r.state, "sub-03", IDS.delgado).kind).toBe("not-on-request")
    expect(requestAccess(r.state, "sub-03", "pre-castillo").kind).toBe("form")
  })

  it("refuses a request that is not stalled, the same person, someone unqualified, and a non-reviewer", () => {
    const s = createSeed()
    expect(reassignRequest(s, "sub-maya-1", { toId: "pre-castillo", reason: "" }, ROSS, AT)).toMatchObject({ ok: false })
    expect(reassignRequest(s, "sub-03", { toId: IDS.delgado, reason: "" }, ROSS, AT)).toMatchObject({ ok: false, error: "J. Delgado, RN already has this request. Choose someone else." })
    const lab = reassignRequest(s, "sub-03", { toId: IDS.whitmore, reason: "" }, ROSS, AT)
    expect(lab.ok).toBe(false)
    if (!lab.ok) expect(lab.error).toMatch(/Lab instructors sign off in the lab/)
    expect(reassignRequest(s, "sub-03", { toId: "", reason: "" }, ROSS, AT)).toMatchObject({ ok: false, error: "Choose who the request goes to." })
    expect(reassignRequest(s, "sub-03", { toId: "pre-castillo", reason: "" }, IDS.maya, AT).ok).toBe(false)
    expect(reassignRequest(s, "sub-03", { toId: "pre-nobody", reason: "" }, ROSS, AT).ok).toBe(false)
  })
})

describe("compare (AR-02, AR-03)", () => {
  it("shows a self-rating that differs from the evaluator's", () => {
    const s = createSeed()
    const c = compareEvaluation(s, s.evaluations.find((e) => e.id === "ev-rq-1")!)
    expect(c.selfRated).toBe(true)
    expect(c.rows).toEqual([{ label: "Overall", student: "Not met", evaluator: "Met", agreement: "differed" }])
    expect(c.overall).toBe("differed")
    expect(c.selfNote).toBe("I was nervous and checked the order twice.")
    expect(c.recorded).toBe(true)
    expect(c.feedback).toMatch(/five rights/)
  })

  it("says not comparable when the student did not self-rate, and when only the outcome was stored", () => {
    const s = createSeed()
    const c = compareEvaluation(s, s.evaluations.find((e) => e.id === "ev-maya-7")!)
    expect(c).toMatchObject({ selfRated: false, overall: "not-comparable" })
    expect(c.rows[0]).toMatchObject({ student: "No self-rating", evaluator: "Met" })
    const old = compareEvaluation(s, s.evaluations.find((e) => e.id === "ev-maya-1")!)
    expect(old.recorded).toBe(false)
    expect(old.responses).toEqual([])
  })

  it("compares a level the student chose with the level the evaluator chose, by the program's own names", () => {
    const s = createSeed()
    const base = s.evaluations.find((e) => e.id === "ev-maya-1")!
    const mk = (levelIndex: number): Evaluation => ({ ...base, id: "ev-t-l", skillId: IDS.urinaryCath, submissionId: "sub-maya-1", levelIndex, versions: [{ version: 1, outcome: "met", at: AT, by: IDS.delgado, reason: null, detail: { feedback: "ok", levelIndex } }] })
    expect(compareEvaluation(s, mk(1)).rows[0]).toMatchObject({ label: "Level of supervision", student: "With assistance", evaluator: "With assistance", agreement: "agreed" })
    expect(compareEvaluation(s, mk(2)).rows[0]).toMatchObject({ evaluator: "Works alone", agreement: "differed" })
    expect(compareEvaluation(s, mk(2)).responses).toEqual([{ label: "Level of supervision", value: "Works alone" }])
  })

  it("compares question by question", () => {
    const s = createSeed()
    s.submissions.find((x) => x.id === "sub-maya-1")!.entryIds!.push("log-t-q")
    s.logEntries.push({ id: "log-t-q", studentId: IDS.maya, skillId: "sk-sterile-dressing", batchId: "b", setting: "clinical", clinicalSetting: "Inpatient", location: "Harbor General, 4 West", rating: null, answers: ["yes", "yes", "no"], note: "", at: AT, requestId: "sub-maya-1" })
    const base = s.evaluations.find((e) => e.id === "ev-maya-1")!
    const e: Evaluation = { ...base, id: "ev-t-q", skillId: "sk-sterile-dressing", submissionId: "sub-maya-1", versions: [{ version: 1, outcome: "met", at: AT, by: IDS.delgado, reason: null, detail: { feedback: "", answers: ["yes", "no", "no"] } }] }
    const c = compareEvaluation(s, e)
    expect(c.rows.map((r) => r.agreement)).toEqual(["agreed", "differed", "agreed", "not-comparable"])
    // AR-03: the evaluator's outcome follows the answers, never compared with a self-rating.
    expect(c.rows[3]).toMatchObject({ label: "Outcome", student: "Not asked", evaluator: "Met" })
    expect(c.overall).toBe("differed")
    expect(c.rows[1]).toMatchObject({ student: "Yes", evaluator: "No" })
  })

  it("lists the earlier attempts at the same skill, not the one under review", () => {
    const s = createSeed()
    const e = s.evaluations.find((x) => x.id === "ev-maya-7")!
    const prior = priorAttempts(s, e)
    expect(prior.every((a) => a.key !== "ev-maya-7")).toBe(true)
    const s2 = { ...s, evaluations: [...s.evaluations, { ...e, id: "ev-t-prior", status: "counted" as const, date: "2026-09-01T09:00:00Z" }] }
    expect(priorAttempts(s2, e).map((a) => a.key)).toContain("ev-t-prior")
  })
})
