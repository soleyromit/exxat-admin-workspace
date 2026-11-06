import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { buildRequest, DEFAULT_OPTIONS, buildInvitation } from "@/lib/lab/evaluator"
import { sendNew } from "@/lib/lab/logged"
import { ensureRequest, openRequestFor, requestLinkQuery } from "@/lib/lab/story-request"
import { seedLists } from "@/lib/lab/lists"
import { buildStudent, skillRecord } from "@/lib/lab/student"
import { selfEvalEnabled, whereChoices } from "@/lib/lab/student2"
import { skillById } from "@/lib/v2/evidence-index"
import { submitEvaluation } from "@/lib/v2/preceptor"
import type { V2State } from "@/lib/v2/types"

/**
 * The student and evaluator path (D-L67): one student, Maya Ferreira (BSN 2027, Clinical skills checklist, the lab's default student), one skill, Nasogastric tube care
 * (3 evaluations), on NURS 350. What the walkthrough shows is what the store and the engine do.
 */
const MAYA = "stu-maya"
const NG = "sk-ng-tube"
const NURS350 = "crs-nurs350"
const TO = "pre-castillo"

const send = (s: V2State, id: string) => ensureRequest(s, id, { student: MAYA, skills: [NG], to: TO, course: NURS350 })
const sign = (s: V2State, id: string, outcome: "met" | "not-met" = "met") => {
  const yes = outcome === "met" ? "yes" : "no"
  const r = submitEvaluation(s, { requestId: id, evaluatorId: TO, responses: [{ skillId: NG, outcome, answers: [yes, yes, yes], scores: [null, null, null], levelIndex: null, feedback: "" }], concern: { raised: false, note: "" }, attested: true }, "2026-10-26T10:00:00.000Z")
  if (!r.ok) throw new Error(r.error)
  return r.state
}

describe("the sample story is true of the data", () => {
  const s = createSeed()
  it("Maya is a BSN 2027 student on the default list, and her skill is open, mapped to NURS 350 and asks for a self-evaluation", () => {
    expect(s.people.find((p) => p.id === MAYA)?.cohort).toBe("BSN 2027")
    const list = seedLists(s).find((l) => l.name === "Clinical skills checklist")!
    expect(list.groupIds).toContain("coh:BSN 2027")
    expect(list.skillIds).toContain(NG)
    expect(selfEvalEnabled(skillById(s, NG))).toBe(true)
    const m = buildStudent(s, MAYA)!
    expect(m.courses.find((c) => c.id === NURS350)?.skills.find((x) => x.id === NG)?.level).toBe("recommended")
    const r = skillRecord(s, MAYA, NG, "recommended", false)!
    expect([r.state, r.counted, r.need, r.waiting]).toEqual(["none", 0, 3, null])
  })

  it("Send on NURS 350 offers her own placements for that course, not the program's list [REQ ST-06]", () => {
    expect(whereChoices(s, MAYA, NURS350).filter((w) => w.setting === "clinical").map((w) => w.label)).toContain("Harbor Outpatient Clinic")
    expect(whereChoices(s, MAYA, NURS350).filter((w) => w.setting === "clinical").every((w) => w.askLocation === false)).toBe(true)
  })
})

describe("the evaluator's link opens that student's request and the submission counts", () => {
  it("opens the request as sent, on its course, with no other student's data", () => {
    const s = send(createSeed(), "req-a")
    const req = buildRequest(s, "request", "default", DEFAULT_OPTIONS, "req-a")!
    expect([req.student.name, req.course.code, req.skills.map((k) => k.id), req.evaluator.name]).toEqual(["Maya Ferreira", "NURS 350", [NG], "M. Castillo, RN"])
    const mail = buildInvitation(s, TO, "req-a")!
    expect(mail.rows.map((r) => [r.requestId, r.student, r.course])).toEqual([["req-a", "Maya Ferreira", "NURS 350"]])
  })

  it("Met counts: 0 of 3, then 1 of 3, the request closes, and a second request reaches 2 of 3", () => {
    let s = send(createSeed(), "req-a")
    expect(skillRecord(s, MAYA, NG, "recommended", false)!.waiting).toBeTruthy()
    s = sign(s, "req-a")
    let r = skillRecord(s, MAYA, NG, "recommended", false)!
    expect([r.counted, r.state, r.waiting]).toEqual([1, "progress", null])
    expect(s.submissions.find((x) => x.id === "req-a")?.status).toBe("done")
    // Where it happened and on which course stay on the evaluation [REQ SH-06, RP-08].
    const ev = s.evaluations.find((e) => e.submissionId === "req-a")!
    expect([ev.courseId, ev.location, ev.setting]).toEqual([NURS350, "Harbor Outpatient Clinic", "clinical"])
    s = sign(send(s, "req-b"), "req-b")
    r = skillRecord(s, MAYA, NG, "recommended", false)!
    expect([r.counted, r.need, r.state]).toEqual([2, 3, "progress"])
    s = sign(send(s, "req-c"), "req-c")
    r = skillRecord(s, MAYA, NG, "recommended", false)!
    expect([r.counted, r.state]).toEqual([3, "achieved"])
  })

  it("Unmet does not count, and a completed evaluation cannot be submitted again [REQ RV-03]", () => {
    const s = sign(send(createSeed(), "req-a"), "req-a", "not-met")
    expect(skillRecord(s, MAYA, NG, "recommended", false)!.counted).toBe(0)
    const again = submitEvaluation(s, { requestId: "req-a", evaluatorId: TO, responses: [{ skillId: NG, outcome: "met", answers: ["yes", "yes", "yes"], scores: [null, null, null], levelIndex: null, feedback: "" }], concern: { raised: false, note: "" }, attested: true }, "2026-10-26T11:00:00.000Z")
    expect(again.ok).toBe(false)
  })
})

describe("a stop or a scanned code that names the request but has not seen it", () => {
  it("rebuilds it once, from the link alone, and finds it again", () => {
    const seed = createSeed()
    expect(openRequestFor(seed, MAYA, [NG])).toBeNull()
    const s = send(seed, "req-a")
    expect(openRequestFor(s, MAYA, [NG])?.id).toBe("req-a")
    expect(send(s, "req-a")).toBe(s)
    expect(requestLinkQuery("req-a", { student: MAYA, skills: [NG], to: TO, course: NURS350 })).toBe(`request=req-a&student=${MAYA}&skills=${NG}&to=${TO}&course=${NURS350}`)
  })

  it("a request sent the ordinary way is the same shape", () => {
    const s = sendNew(createSeed(), { skillIds: [NG], where: "lab", setting: "lab", clinicalSetting: null, location: null, date: "2026-10-26", unit: "", case: "", note: "", ratings: {}, answers: {} }, MAYA, { id: "req-x", studentId: MAYA, skillIds: [NG], method: "qr", status: "with-evaluator", assignedToId: TO, createdAt: "", daysWaiting: 0, candidateIds: [TO] })
    expect(openRequestFor(s, MAYA, [NG])?.method).toBe("qr")
  })
})
