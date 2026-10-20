import { describe, expect, it } from "vitest"
import { attemptInfo, canReopen, closePlan, concernsFor, confirmVersion, openPlan, openPlanByHand, outcomeRows, plansOf, reopenEvaluation, setStepDone } from "@/lib/v2/outcomes"
import { createSeed, IDS } from "@/lib/v2/seed"
import { skillProgress, studentHistory } from "@/lib/v2/student"
import type { Evaluation, V2State } from "@/lib/v2/types"

const AT = "2026-10-20T10:00:00Z"
const ROSS = IDS.ross
const SD = "sk-sterile-dressing"

/** A counted Met evaluation for Maya with a full version-1 detail. */
function withDetailed(): { s: V2State; e: Evaluation } {
  const s = createSeed()
  const e: Evaluation = {
    id: "ev-t-1", studentId: IDS.maya, skillId: SD, evaluatorId: IDS.delgado, setting: "clinical", clinicalSetting: "Inpatient", date: "2026-10-18T09:00:00Z", status: "counted", outcome: "met", currentVersion: 1,
    versions: [{ version: 1, outcome: "met", at: "2026-10-18T09:00:00Z", by: IDS.delgado, reason: null, detail: { feedback: "Good field control.", answers: ["yes", "yes", "yes"], attested: { text: "I confirm.", at: "2026-10-18T09:00:00Z" } } }],
  }
  return { s: { ...s, evaluations: [...s.evaluations, e] }, e }
}

describe("reopenEvaluation", () => {
  it("adds version 2 with who, when and why, and leaves version 1 exactly as it was", () => {
    const { s, e } = withDetailed()
    const v1 = structuredClone(e.versions[0])
    const r = reopenEvaluation(s, { evaluationId: e.id, outcome: "not-yet", feedback: null, reason: "Documentation review found a missed step." }, ROSS, AT)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const n = r.state.evaluations.find((x) => x.id === e.id)!
    expect(r.version).toBe(2)
    expect(n).toMatchObject({ status: "reopened", outcome: "not-yet", currentVersion: 2 })
    expect(n.versions).toHaveLength(2)
    expect(n.versions[0]).toEqual(v1)
    expect(n.versions[1]).toMatchObject({ version: 2, outcome: "not-yet", at: AT, by: ROSS, reason: "Documentation review found a missed step." })
    expect(n.versions[1].detail?.answers).toEqual(["yes", "yes", "yes"])
    // The input state is untouched.
    expect(s.evaluations.find((x) => x.id === e.id)!.versions).toHaveLength(1)
    expect(r.state.audit[0]).toMatchObject({ action: "Reopened evaluation", actorId: ROSS, at: AT })
  })

  it("keeps v1 intact through several reopens", () => {
    const { s, e } = withDetailed()
    const v1 = structuredClone(e.versions[0])
    const a = reopenEvaluation(s, { evaluationId: e.id, outcome: "not-met", feedback: null, reason: "First correction." }, ROSS, AT)
    if (!a.ok) throw new Error(a.error)
    const b = reopenEvaluation(a.state, { evaluationId: e.id, outcome: "met", feedback: "Corrected: the field was kept sterile.", reason: "Second correction after review." }, IDS.reviewer, "2026-10-21T10:00:00Z")
    expect(b.ok).toBe(true)
    if (!b.ok) return
    const n = b.state.evaluations.find((x) => x.id === e.id)!
    expect(n.versions.map((v) => v.version)).toEqual([1, 2, 3])
    expect(n.versions[0]).toEqual(v1)
    expect(n.versions[2].detail?.feedback).toBe("Corrected: the field was kept sterile.")
    expect(n.versions[1].detail?.feedback).toBe("Good field control.")
  })

  it("requires staff, a reason, and a real change", () => {
    const { s, e } = withDetailed()
    const err = (input: Parameters<typeof reopenEvaluation>[1], who: string = ROSS) => {
      const r = reopenEvaluation(s, input, who, AT)
      return r.ok ? "ok" : r.error
    }
    expect(err({ evaluationId: e.id, outcome: "not-yet", feedback: null, reason: "  " })).toBe("Say why you are reopening this evaluation. The reason stays on the record.")
    expect(err({ evaluationId: e.id, outcome: "met", feedback: "Good field control.", reason: "Because." })).toMatch(/Change the outcome or the feedback/)
    expect(err({ evaluationId: e.id, outcome: "not-yet", feedback: null, reason: "x" }, IDS.maya)).toBe("Only program staff can reopen an evaluation.")
    expect(err({ evaluationId: e.id, outcome: "not-yet", feedback: null, reason: "x" }, IDS.delgado)).toBe("Only program staff can reopen an evaluation.")
    expect(err({ evaluationId: "nope", outcome: "met", feedback: null, reason: "x" })).toBe("That evaluation does not exist.")
    expect(err({ evaluationId: e.id, outcome: "met", feedback: "y".repeat(2001), reason: "x" })).toMatch(/Shorten the feedback/)
  })

  it("refuses an evaluation that was returned", () => {
    const { s, e } = withDetailed()
    const t = { ...s, evaluations: s.evaluations.map((x) => (x.id === e.id ? { ...x, status: "returned" as const } : x)) }
    expect(canReopen(t.evaluations.find((x) => x.id === e.id)!)).toBe(false)
    const r = reopenEvaluation(t, { evaluationId: e.id, outcome: "not-met", feedback: null, reason: "x" }, ROSS, AT)
    expect(r.ok).toBe(false)
  })

  it("a reopened evaluation stops counting until the version is confirmed", () => {
    const { s, e } = withDetailed()
    const before = skillProgress(s, IDS.maya, SD)!.counted
    const r = reopenEvaluation(s, { evaluationId: e.id, outcome: "not-yet", feedback: null, reason: "Correction." }, ROSS, AT)
    if (!r.ok) throw new Error(r.error)
    expect(skillProgress(r.state, IDS.maya, SD)!.counted).toBe(before - 1)
    const c = confirmVersion(r.state, e.id, ROSS, AT)
    expect(c.ok).toBe(true)
    if (!c.ok) return
    expect(c.state.evaluations.find((x) => x.id === e.id)!.status).toBe("counted")
    // The confirmed version is a Not yet, so it still does not qualify, and the history says so.
    expect(skillProgress(c.state, IDS.maya, SD)!.counted).toBe(before - 1)
    expect(c.state.evaluations.find((x) => x.id === e.id)!.versions).toHaveLength(2)
  })

  it("confirming a fail opens a plan only for a skill whose failure path does", () => {
    const s0 = createSeed()
    const iv: Evaluation = { id: "ev-t-iv", studentId: IDS.maya, skillId: IDS.ivCath, evaluatorId: IDS.delgado, setting: "clinical", date: "2026-10-18T09:00:00Z", status: "counted", outcome: "met", currentVersion: 1, versions: [{ version: 1, outcome: "met", at: "2026-10-18T09:00:00Z", by: IDS.delgado, reason: null }] }
    const s = { ...s0, evaluations: [...s0.evaluations, iv] }
    const r = reopenEvaluation(s, { evaluationId: iv.id, outcome: "not-met", feedback: null, reason: "Correction." }, ROSS, AT)
    if (!r.ok) throw new Error(r.error)
    expect(r.state.remediations).toHaveLength(s.remediations.length)
    const c = confirmVersion(r.state, iv.id, ROSS, AT)
    expect(c.ok).toBe(true)
    if (!c.ok) return
    expect(c.planOpened).toBe(true)
    expect(c.state.remediations.at(-1)).toMatchObject({ studentId: IDS.maya, skillId: IDS.ivCath, evaluationId: iv.id })
  })

  it("refuses to confirm what is not reopened", () => {
    const { s, e } = withDetailed()
    const c = confirmVersion(s, e.id, ROSS, AT)
    expect(c.ok).toBe(false)
  })

  it("the seeded reopened evaluation keeps both versions", () => {
    const s = createSeed()
    const e = s.evaluations.find((x) => x.status === "reopened")!
    expect(e.versions.map((v) => v.version)).toEqual([1, 2])
    expect(outcomeRows(s, "reopened")).toHaveLength(1)
  })
})

describe("remediation plans", () => {
  const failed = (): { s: V2State; e: Evaluation } => {
    const { s, e } = withDetailed()
    const f: Evaluation = { ...e, id: "ev-t-fail", outcome: "not-met", versions: [{ ...e.versions[0], outcome: "not-met" }] }
    return { s: { ...s, evaluations: [...s.evaluations, f] }, e: f }
  }

  it("opens by hand from a failed evaluation, with three steps, and not twice", () => {
    const { s, e } = failed()
    const r = openPlanByHand(s, e.id, ROSS, AT)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const plan = r.state.remediations.find((x) => x.id === r.remediationId)!
    expect(plan).toMatchObject({ status: "open", studentId: IDS.maya, skillId: SD, evaluationId: e.id, openedById: ROSS })
    expect(plan.steps.map((x) => x.done)).toEqual([false, false, false])
    const again = openPlanByHand(r.state, e.id, ROSS, AT)
    expect(again.ok && again.created).toBe(false)
    expect(again.ok && again.state.remediations.length).toBe(r.state.remediations.length)
    expect(again.ok && again.state.remediations.find((x) => x.id === r.remediationId)?.notes).toHaveLength(1)
  })

  it("refuses a pass, a student and an unknown evaluation", () => {
    const { s, e } = withDetailed()
    expect(openPlanByHand(s, e.id, ROSS, AT)).toMatchObject({ ok: false, error: expect.stringMatching(/did not meet/) })
    expect(openPlanByHand(s, e.id, IDS.maya, AT)).toMatchObject({ ok: false, error: "Only program staff can open a remediation plan." })
    expect(openPlanByHand(s, "nope", ROSS, AT)).toMatchObject({ ok: false })
  })

  it("steps change the status; a closed plan is read-only", () => {
    const s = createSeed()
    const plan = s.remediations[0]
    expect(plan.status).toBe("in-progress")
    const a = setStepDone(s, plan.id, 2, true, ROSS, AT)
    expect(a.ok).toBe(true)
    if (!a.ok) return
    const p = a.state.remediations[0]
    expect(p.steps[2]).toMatchObject({ done: true, doneAt: AT, doneById: ROSS })
    const undone = setStepDone(createSeed(), plan.id, 0, false, ROSS, AT)
    expect(undone.ok && undone.state.remediations[0].steps[0]).toEqual({ label: plan.steps[0].label, done: false })
    const fresh = openPlan(createSeed(), { studentId: IDS.maya, skillId: SD, evaluationId: "e", actorId: ROSS }, AT)
    const none = setStepDone(fresh.state, fresh.plan.id, 0, true, ROSS, AT)
    expect(none.ok && none.state.remediations.find((x) => x.id === fresh.plan.id)?.status).toBe("in-progress")
    const closed = closePlan(a.state, plan.id, { note: "" }, ROSS, AT)
    expect(closed.ok).toBe(true)
    if (!closed.ok) return
    expect(closed.completed).toBe(true)
    const after = setStepDone(closed.state, plan.id, 0, false, ROSS, AT)
    expect(after).toMatchObject({ ok: false, error: expect.stringMatching(/plan is closed/) })
  })

  it("closing early needs a reason, and staff only", () => {
    const s = createSeed()
    const id = s.remediations[0].id
    expect(closePlan(s, id, { note: " " }, ROSS, AT)).toMatchObject({ ok: false, error: expect.stringMatching(/Say why you are closing this plan before every step is done/) })
    expect(closePlan(s, id, { note: "x" }, IDS.maya, AT)).toMatchObject({ ok: false, error: "Only program staff can close a remediation plan." })
    const ok = closePlan(s, id, { note: "Student left the program." }, ROSS, AT)
    expect(ok.ok && ok.completed).toBe(false)
    if (ok.ok) expect(ok.state.remediations[0].closed).toMatchObject({ completed: false, note: "Student left the program.", byId: ROSS })
    if (ok.ok) expect(closePlan(ok.state, id, { note: "again" }, ROSS, AT)).toMatchObject({ ok: false, error: "This plan is already closed." })
  })

  it("a student only reads her own plans", () => {
    const s = createSeed()
    expect(plansOf(s, IDS.maya)).toEqual([])
    expect(plansOf(s, "stu-04")).toHaveLength(1)
  })

  it("attempt facts: used, limit, earliest next attempt, Not yet is not an attempt", () => {
    const { s } = withDetailed()
    const ivFail: Evaluation = { id: "ev-t-ivf", studentId: IDS.maya, skillId: IDS.ivCath, evaluatorId: IDS.delgado, setting: "clinical", date: "2026-10-10T09:00:00Z", status: "counted", outcome: "not-met", currentVersion: 1, versions: [] }
    const ivYet: Evaluation = { ...ivFail, id: "ev-t-ivy", outcome: "not-yet", date: "2026-10-12T09:00:00Z" }
    const t = { ...s, evaluations: [...s.evaluations, ivFail, ivYet] }
    const a = attemptInfo(t, IDS.maya, IDS.ivCath)
    expect(a).toMatchObject({ used: 1, limit: 3, failed: 1, minDays: 7, atLimit: false })
    expect(a.nextFrom?.slice(0, 10)).toBe("2026-10-17")
  })
})

describe("student-facing views never leak staff-only data", () => {
  it("concerns are invisible to the student and the preceptor roles", () => {
    const s = createSeed()
    expect(s.concerns.length).toBeGreaterThan(0)
    expect(concernsFor(s, "student")).toEqual([])
    expect(concernsFor(s, "preceptor")).toEqual([])
    for (const role of ["admin", "reviewer", "director"] as const) expect(concernsFor(s, role)).toHaveLength(s.concerns.length)
  })

  it("the student's history does not contain a concern about her", () => {
    const s = createSeed()
    const t = { ...s, concerns: [...s.concerns, { id: "cn-x", evaluationId: "ev-maya-1", studentId: IDS.maya, raisedById: IDS.delgado, visibleTo: "faculty-only" as const, note: "SECRET-CONCERN-TEXT", at: AT }] }
    expect(JSON.stringify(studentHistory(t))).not.toContain("SECRET-CONCERN-TEXT")
  })

  it("the history separates Not yet from Did not meet", () => {
    const h = studentHistory(createSeed())
    expect(h.summary.notYet).toBeGreaterThan(0)
    const kinds = h.skills.flatMap((k) => k.attempts.map((a) => a.kind))
    expect(kinds).toContain("not-yet")
  })
})
