import { describe, expect, it } from "vitest"
import { blankPass, candidatesOf, criteriaNote, fieldIds, outcomeChoices, requestAccess, submitEvaluation, validatePass, waitingFor, type PassInput } from "@/lib/v2/preceptor"
import { createSeed, IDS } from "@/lib/v2/seed"
import { skillProgress, createRequest, logSkills } from "@/lib/v2/student"
import { concernsFor } from "@/lib/v2/outcomes"
import type { V2State } from "@/lib/v2/types"

const AT = "2026-10-19T10:00:00Z"
const IV = IDS.ivCath
const SD = "sk-sterile-dressing"

/** Maya asks J. Delgado to sign off IV catheter insertion and Sterile dressing change in one request. */
function requested(method: "qr" | "link" = "qr", evaluatorIds: string[] = [IDS.delgado]): { s: V2State; id: string } {
  const base = { ...createSeed(), syncQueue: createSeed().syncQueue.filter((i) => i.state !== "conflict") }
  base.skills = base.skills.map((k) => (k.id === IV ? { ...k, published: true } : k))
  const l = logSkills(base, { skillIds: [IV, SD], setting: "clinical", clinicalSetting: "Inpatient", location: "Harbor General, 4 West", ratings: { [IV]: "Works with prompts" }, answers: { [SD]: ["yes", "yes", "yes"] }, notes: { [IV]: "Second IV this week." } }, AT)
  if (!l.ok) throw new Error(l.error)
  const r = createRequest(l.state, { entryIds: l.entryIds, method, evaluatorIds }, AT)
  if (!r.ok) throw new Error(r.error)
  return { s: r.state, id: r.submissionId }
}

function goodPass(s: V2State, id: string, over: Partial<PassInput> = {}): PassInput {
  const p = blankPass(s, id, IDS.delgado)
  p.responses = p.responses.map((r) =>
    r.skillId === IV ? { ...r, outcome: "met" as const, levelIndex: 2, feedback: "Steady hands and clear explanation." } : { ...r, outcome: "met" as const, answers: ["yes", "yes", "yes"] as Array<"yes"> },
  )
  return { ...p, attested: true, ...over }
}

describe("requestAccess", () => {
  it("opens the form for the named, qualified evaluator", () => {
    const { s, id } = requested()
    const a = requestAccess(s, id, null)
    expect(a.kind).toBe("form")
    expect(a.person?.id).toBe(IDS.delgado)
  })

  it("explains an unknown link, a request still on the phone, and a photo request", () => {
    const { s, id } = requested()
    expect(requestAccess(s, "sub-nope").kind).toBe("missing")
    expect(requestAccess(s, null).message).toMatch(/does not match a request/)
    const offline = { ...s, submissions: s.submissions.map((x) => (x.id === id ? { ...x, status: "on-device" as const } : x)) }
    expect(requestAccess(offline, id)).toMatchObject({ kind: "not-sent" })
    expect(requestAccess(offline, id).fix).toMatch(/sync status/)
    expect(requestAccess(s, "sub-04").kind).toBe("photo")
  })

  it("blocks an unqualified evaluator with the reason per skill and what to do", () => {
    const { s, id } = requested()
    const raised = { ...s, skills: s.skills.map((k) => (k.id === IV && k.config ? { ...k, config: { ...k.config, qualification: { ...k.config.qualification, minYears: 12 } } } : k)) }
    const a = requestAccess(raised, id)
    expect(a.kind).toBe("unqualified")
    expect(a.reasons).toEqual([{ skillName: "IV catheter insertion", reason: "Needs 12 or more years of practice (has 9)" }])
    expect(a.fix).toMatch(/send this request to a qualified evaluator/)
    // The lab instructor can never sign a clinical request.
    const lab = requestAccess(s, id, IDS.whitmore)
    expect(lab.kind).toBe("unqualified")
    expect(lab.reasons.map((r) => r.reason)[0]).toMatch(/Lab instructors sign off in the lab/)
  })

  it("blocks a qualified person the request was not sent to", () => {
    const { s, id } = requested()
    const a = requestAccess(s, id, "pre-castillo")
    expect(a.kind).toBe("not-on-request")
    expect(a.message).toMatch(/sent this request to J\. Delgado, RN, not to M\. Castillo, RN/)
  })

  it("lists requests per evaluator", () => {
    const { s, id } = requested()
    expect(waitingFor(s, IDS.delgado).map((x) => x.id)).toContain(id)
    expect(waitingFor(s, "pre-castillo")).toEqual([])
    expect(candidatesOf(s.submissions.find((x) => x.id === "sub-maya-1")!)).toEqual([IDS.delgado])
  })
})

describe("validatePass", () => {
  it("passes a clean pass", () => {
    const { s, id } = requested()
    expect(validatePass(s, goodPass(s, id))).toEqual([])
  })

  it("says what is wrong and how to fix it, for an empty pass", () => {
    const { s, id } = requested()
    const m = validatePass(s, blankPass(s, id, IDS.delgado)).map((i) => i.message)
    expect(m).toContain("Choose an outcome for IV catheter insertion: Met, Not met or Not yet.")
    expect(m).toContain("Write feedback for IV catheter insertion. The program requires it on every evaluation.")
    expect(m).toContain("Confirm your credentials before you submit.")
  })

  it("asks for the level, the questions and the feedback only where they apply", () => {
    const { s, id } = requested()
    const p = goodPass(s, id)
    p.responses = p.responses.map((r) => (r.skillId === IV ? { ...r, levelIndex: null, feedback: "" } : { ...r, answers: ["yes", null, "yes"] }))
    const issues = validatePass(s, p)
    expect(issues.map((i) => i.message)).toEqual([
      "Choose the level of supervision you observed for IV catheter insertion.",
      "Write feedback for IV catheter insertion. The program requires it on every evaluation.",
      'Answer Yes or No to "Kept the field clean throughout" for Sterile dressing change.',
    ])
    expect(issues[2].field).toBe(fieldIds.question(SD, 1))
  })

  it("Not yet needs only feedback, never questions or a level", () => {
    const { s, id } = requested()
    const p = goodPass(s, id)
    p.responses = p.responses.map((r) => ({ ...r, outcome: "not-yet" as const, levelIndex: null, answers: r.answers.map(() => null), feedback: r.skillId === IV ? "Practise the flush step." : "" }))
    expect(validatePass(s, p).map((i) => i.message)).toEqual(["Write feedback for Sterile dressing change. Not yet records feedback only, so the student needs your words."])
  })

  it("checks length, the concern and the attestation", () => {
    const { s, id } = requested()
    const p = goodPass(s, id, { attested: false, concern: { raised: true, note: " " } })
    p.responses[0] = { ...p.responses[0], feedback: "x".repeat(2001) }
    const m = validatePass(s, p).map((i) => i.message)
    expect(m).toContain("Shorten the feedback for IV catheter insertion to 2000 characters or fewer (now 2001).")
    expect(m).toContain("Describe the concern, or turn the flag off.")
    expect(m).toContain("Confirm your credentials before you submit.")
  })

  it("scored skills ask for a score and the overall rating is required when the program enables it", () => {
    const { s, id } = requested()
    const sk = s.skills.map((k) => (k.id === SD && k.config ? { ...k, config: { ...k.config, overallRating: true } } : k))
    const t = { ...s, skills: sk }
    const p = goodPass(t, id)
    const m = validatePass(t, p).map((i) => i.message)
    expect(m).toEqual(["Choose the overall supervision rating for Sterile dressing change."])
  })

  it("uses the program's own labels for a binary skill", () => {
    const k = createSeed().skills.find((x) => x.id === "sk-med-admin")!
    expect(outcomeChoices(k).map((o) => o.label)).toEqual(["Met", "Not met", "Not yet, feedback only"])
    const renamed = { ...k, config: { ...k.config!, outcomeLabels: ["Safe", "Unsafe"] as [string, string] } }
    expect(outcomeChoices(renamed).map((o) => o.label)).toEqual(["Safe", "Unsafe", "Not yet, feedback only"])
  })

  it("notes, without blocking, a Met that the answers do not support", () => {
    const { s, id } = requested()
    const sd = s.skills.find((k) => k.id === SD)!
    const r = { ...blankPass(s, id, IDS.delgado).responses[1], outcome: "met" as const, answers: ["yes", "no", "no"] as Array<"yes" | "no"> }
    expect(criteriaNote(sd, r)).toBe("You answered No to 2 questions. Met is still your call.")
  })
})

describe("submitEvaluation", () => {
  it("records one evaluation per skill with version 1 detail, completes the request, and moves progress", () => {
    const { s, id } = requested()
    const before = skillProgress(s, IDS.maya, SD)!.counted
    const r = submitEvaluation(s, goodPass(s, id), AT)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.evaluationIds).toHaveLength(2)
    const evs = r.state.evaluations.filter((e) => r.evaluationIds.includes(e.id))
    expect(evs.map((e) => [e.skillId, e.outcome, e.status])).toEqual([[IV, "met", "counted"], [SD, "met", "counted"]])
    expect(evs[0]).toMatchObject({ submissionId: id, clinicalSetting: "Inpatient", levelIndex: 2, currentVersion: 1 })
    expect(evs[0].versions[0].detail).toMatchObject({ feedback: "Steady hands and clear explanation.", levelIndex: 2 })
    expect(evs[0].versions[0].detail?.attested?.text).toMatch(/RN, 2 or more years of practice, trained in IV therapy/)
    expect(evs[1].versions[0].detail?.answers).toEqual(["yes", "yes", "yes"])
    expect(r.state.submissions.find((x) => x.id === id)).toMatchObject({ status: "done", completedById: IDS.delgado })
    expect(skillProgress(r.state, IDS.maya, SD)!.counted).toBe(before + 1)
    expect(skillProgress(r.state, IDS.maya, IV)!.counted).toBe(1)
    expect(r.state.audit.filter((a) => a.action === "Submitted an evaluation")).toHaveLength(2)
  })

  it("refuses an invalid pass with every issue, and changes nothing", () => {
    const { s, id } = requested()
    const r = submitEvaluation(s, blankPass(s, id, IDS.delgado), AT)
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.error).toBe("Fix 4 problems before you submit.")
    expect(r.issues?.map((i) => i.field)).toEqual([fieldIds.outcome(IV), fieldIds.feedback(IV), fieldIds.outcome(SD), fieldIds.attest])
  })

  it("is completed once: a second submit, and a different evaluator on the same link, are refused", () => {
    const { s, id } = requested("link", [IDS.delgado, "pre-castillo"])
    const r = submitEvaluation(s, goodPass(s, id), AT)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const again = submitEvaluation(r.state, goodPass(r.state, id), AT)
    expect(again.ok).toBe(false)
    if (!again.ok) expect(again.error).toMatch(/already completed this request/)
    expect(requestAccess(r.state, id, "pre-castillo").kind).toBe("completed")
    expect(r.state.evaluations.filter((e) => e.submissionId === id)).toHaveLength(2)
  })

  it("refuses an unqualified or unnamed evaluator", () => {
    const { s, id } = requested()
    const r = submitEvaluation(s, { ...goodPass(s, id), evaluatorId: IDS.whitmore }, AT)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/cannot sign off/)
  })

  it("holds evidence for approval when the skill says so, and it does not count yet", () => {
    const { s, id } = requested()
    const t = { ...s, skills: s.skills.map((k) => (k.id === SD && k.config ? { ...k, config: { ...k.config, approvalRequired: true } } : k)) }
    const r = submitEvaluation(t, goodPass(t, id), AT)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.items.map((i) => i.holds)).toEqual([false, true])
    expect(r.state.evaluations.find((e) => e.id === r.items[1].evaluationId)?.status).toBe("awaiting-approval")
    expect(r.state.submissions.find((x) => x.id === id)).toMatchObject({ status: "awaiting-review" })
    expect(skillProgress(r.state, IDS.maya, SD)!.awaiting).toBe(1)
  })

  it("Not yet records feedback only: no pass or fail, no plan", () => {
    const { s, id } = requested()
    const p = goodPass(s, id)
    p.responses = p.responses.map((r) => (r.skillId === IV ? { ...r, outcome: "not-yet" as const, feedback: "Practise the flush step." } : r))
    const r = submitEvaluation(s, p, AT)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const e = r.state.evaluations.find((x) => x.id === r.items[0].evaluationId)!
    expect(e.outcome).toBe("not-yet")
    expect(skillProgress(r.state, IDS.maya, IV)!.counted).toBe(0)
    expect(r.planIds).toEqual([])
    expect(r.state.remediations).toHaveLength(createSeed().remediations.length)
  })

  it("a fail opens a plan only when the skill's failure path says so", () => {
    const { s, id } = requested()
    const p = goodPass(s, id)
    p.responses = p.responses.map((r) => ({ ...r, outcome: "not-met" as const }))
    const r = submitEvaluation(s, p, AT)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    // IV catheter insertion has auto-remediation; Sterile dressing change does not.
    expect(r.items.map((i) => !!i.planId)).toEqual([true, false])
    const plan = r.state.remediations.find((x) => x.id === r.planIds[0])!
    expect(plan).toMatchObject({ studentId: IDS.maya, skillId: IV, status: "open", evaluationId: r.items[0].evaluationId })
    expect(plan.steps).toHaveLength(3)
  })

  it("stores a concern for staff only", () => {
    const { s, id } = requested()
    const r = submitEvaluation(s, goodPass(s, id, { concern: { raised: true, note: "Arrived late twice this week." } }), AT)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.state.concerns.at(-1)).toMatchObject({ note: "Arrived late twice this week.", visibleTo: "faculty-only", raisedById: IDS.delgado, studentId: IDS.maya, submissionId: id })
    expect(concernsFor(r.state, "student")).toEqual([])
    expect(concernsFor(r.state, "preceptor")).toEqual([])
    expect(concernsFor(r.state, "admin").at(-1)?.note).toBe("Arrived late twice this week.")
    // The audit log names no note text.
    expect(JSON.stringify(r.state.audit)).not.toContain("Arrived late")
  })
})
