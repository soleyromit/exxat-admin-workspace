import { describe, expect, it } from "vitest"
import { CELL_ORDER, cellKey, labBatchesOf, labBlockReason, labCounts, labSkills, labStudents, nextCell, saveLabBatch, type LabInput } from "@/lib/v2/lab"
import { heatCell, heatmap, NO_FILTERS, observations } from "@/lib/v2/reports"
import { createSeed, IDS } from "@/lib/v2/seed"
import { skillProgress } from "@/lib/v2/student"
import type { Outcome, V2State } from "@/lib/v2/types"

const AT = "2026-10-20T10:00:00.000Z"
const VITALS = "sk-vitals"
const DRESS = "sk-sterile-dressing"

function must<T extends { ok: boolean }>(r: T): Extract<T, { ok: true }> {
  if (!r.ok) throw new Error(`expected ok, got ${JSON.stringify(r)}`)
  return r as Extract<T, { ok: true }>
}

function input(s: V2State, patch: Partial<LabInput> = {}, cells: Record<string, Outcome | null> = {}): LabInput {
  return { name: "Skills lab, group A", date: "2026-10-19", setting: "lab", skillIds: [VITALS, DRESS], absentIds: [], cells, ...patch }
}

const allMet = (s: V2State, skills = [VITALS, DRESS]) => Object.fromEntries(labStudents(s).flatMap((p) => skills.map((k) => [cellKey(p.id, k), "met" as Outcome])))

describe("the cell cycle", () => {
  it("goes Met, Not met, Not yet, Not recorded, and round again", () => {
    expect(CELL_ORDER).toEqual(["met", "not-met", "not-yet", null])
    expect(nextCell(null)).toBe("met")
    expect(nextCell("met")).toBe("not-met")
    expect(nextCell("not-met")).toBe("not-yet")
    expect(nextCell("not-yet")).toBeNull()
  })
})

describe("who can record a session", () => {
  it("only a lab instructor; a preceptor is told why", () => {
    const s = createSeed()
    expect(labBlockReason(s.people.find((p) => p.id === IDS.whitmore))).toBeNull()
    expect(labBlockReason(s.people.find((p) => p.id === IDS.delgado))).toMatch(/recorded by a lab instructor\. J\. Delgado, RN is a preceptor/)
    const r = saveLabBatch(s, input(s, {}, allMet(s)), IDS.delgado, AT)
    expect(r.ok).toBe(false)
    expect(s.evaluations).toEqual(createSeed().evaluations)
  })

  it("offers the published, mapped skills and blocks one that simulation does not allow in a simulation session", () => {
    let s = createSeed()
    const names = labSkills(s, "lab", s.people.find((p) => p.id === IDS.whitmore)).map((x) => x.skill.id)
    expect(names).toContain(VITALS)
    expect(names).not.toContain(IDS.ivCath)
    expect(names).not.toContain("sk-central-line")
    s = { ...s, skills: s.skills.map((k) => (k.id === DRESS ? { ...k, config: { ...k.config!, simulation: { ...k.config!.simulation, allowed: false } } } : k)) }
    const sim = labSkills(s, "simulation", s.people.find((p) => p.id === IDS.whitmore))
    expect(sim.find((x) => x.skill.id === DRESS)!.blocked).toBe("Simulation does not count for this skill.")
    expect(saveLabBatch(s, input(s, { setting: "simulation", skillIds: [DRESS] }, allMet(s, [DRESS])), IDS.whitmore, AT)).toMatchObject({ ok: false })
  })
})

describe("saving a batch", () => {
  it("records one lab evaluation per recorded cell, by the lab instructor, on the session day", () => {
    const s = createSeed()
    const people = labStudents(s)
    const cells: Record<string, Outcome | null> = { [cellKey(people[0].id, VITALS)]: "met", [cellKey(people[0].id, DRESS)]: "not-met", [cellKey(people[1].id, VITALS)]: "not-yet" }
    const r = must(saveLabBatch(s, input(s, {}, cells), IDS.whitmore, AT))
    expect(r.counts).toMatchObject({ results: 3, studentsWithResults: 2, absent: 0 })
    expect(r.counts.blank).toBe(people.length * 2 - 3)
    const added = r.state.evaluations.filter((e) => r.batch.evaluationIds.includes(e.id))
    expect(added).toHaveLength(3)
    for (const e of added) {
      expect(e).toMatchObject({ evaluatorId: IDS.whitmore, setting: "lab", status: "counted", currentVersion: 1 })
      expect(e.date).toBe("2026-10-19T09:00:00.000Z")
      expect(e.versions).toHaveLength(1)
    }
    expect(added.find((e) => e.studentId === people[0].id && e.skillId === DRESS)!.outcome).toBe("not-met")
    expect(r.state.audit[0]).toMatchObject({ actorId: IDS.whitmore, action: "Saved a lab session" })
    expect(labBatchesOf(r.state)).toHaveLength(1)
  })

  it("never edits an earlier evaluation or the input state", () => {
    const s = createSeed()
    const before = JSON.stringify(s)
    const r = must(saveLabBatch(s, input(s, {}, allMet(s)), IDS.whitmore, AT))
    expect(JSON.stringify(s)).toBe(before)
    for (const e of s.evaluations) expect(r.state.evaluations.find((x) => x.id === e.id)).toEqual(e)
  })

  it("gives an absent student no evaluation and lists them on the batch", () => {
    const s = createSeed()
    const people = labStudents(s)
    const absent = people[3].id
    const r = must(saveLabBatch(s, input(s, { absentIds: [absent] }, allMet(s)), IDS.whitmore, AT))
    expect(r.counts.absent).toBe(1)
    expect(r.counts.results).toBe((people.length - 1) * 2)
    expect(r.state.evaluations.filter((e) => e.studentId === absent && r.batch.evaluationIds.includes(e.id))).toEqual([])
    expect(r.batch.absentIds).toEqual([absent])
    expect(r.state.audit[0].target).toContain("1 absent")
  })

  it("leaves blank cells unsaved and counts them", () => {
    const s = createSeed()
    const k = cellKey(IDS.maya, VITALS)
    const r = must(saveLabBatch(s, input(s, {}, { [k]: "met" }), IDS.whitmore, AT))
    expect(r.counts).toMatchObject({ results: 1, blank: labStudents(s).length * 2 - 1 })
    expect(r.batch.blank).toBe(r.counts.blank)
  })

  it("refuses a save with nothing recorded, with the fix in the message", () => {
    const s = createSeed()
    const r = saveLabBatch(s, input(s), IDS.whitmore, AT)
    expect(r).toMatchObject({ ok: false })
    if (!r.ok) expect(r.error).toMatch(/Record at least one result/)
    expect(labCounts(s, input(s)).results).toBe(0)
  })

  it("validates the name, the date and the skills", () => {
    const s = createSeed()
    const cells = allMet(s)
    expect(saveLabBatch(s, input(s, { name: "  " }, cells), IDS.whitmore, AT)).toMatchObject({ ok: false, error: expect.stringMatching(/Name the session/) })
    expect(saveLabBatch(s, input(s, { name: "x".repeat(81) }, cells), IDS.whitmore, AT)).toMatchObject({ ok: false, error: expect.stringMatching(/80 characters/) })
    expect(saveLabBatch(s, input(s, { date: "" }, cells), IDS.whitmore, AT)).toMatchObject({ ok: false, error: expect.stringMatching(/date of the session/) })
    expect(saveLabBatch(s, input(s, { skillIds: [] }, cells), IDS.whitmore, AT)).toMatchObject({ ok: false, error: expect.stringMatching(/at least one skill/) })
    expect(saveLabBatch(s, input(s, { skillIds: [IDS.ivCath] }, cells), IDS.whitmore, AT)).toMatchObject({ ok: false, error: expect.stringMatching(/not open for this course/) })
  })

  it("saves a session once: the same name, date and setting is refused, another date is fine", () => {
    const s = createSeed()
    const first = must(saveLabBatch(s, input(s, {}, allMet(s)), IDS.whitmore, AT))
    expect(saveLabBatch(first.state, input(s, {}, allMet(s)), IDS.whitmore, AT)).toMatchObject({ ok: false, error: expect.stringMatching(/already saved/) })
    const second = must(saveLabBatch(first.state, input(s, { date: "2026-10-26" }, allMet(s)), IDS.whitmore, AT))
    expect(labBatchesOf(second.state).map((b) => b.id)).toEqual(["lab-1", "lab-2"])
  })
})

describe("what lab evidence does and does not do", () => {
  it("moves progress and the report, as evidence", () => {
    const s = createSeed()
    const dress = s.skills.find((k) => k.id === DRESS)!
    const before = heatCell(s, IDS.maya, dress)
    const r = must(saveLabBatch(s, input(s, { skillIds: [DRESS] }, { [cellKey(IDS.maya, DRESS)]: "met" }), IDS.whitmore, AT))
    expect(skillProgress(r.state, IDS.maya, DRESS)!.counted).toBe(1)
    expect(heatCell(r.state, IDS.maya, dress).state).not.toBe(before.state)
    expect(observations(r.state, { ...NO_FILTERS, setting: "lab" }, DRESS).some((e) => r.batch.evaluationIds.includes(e.id))).toBe(true)
    expect(heatmap(r.state, NO_FILTERS).rows.length).toBe(s.people.filter((p) => p.kind === "student").length)
  })

  it("never satisfies a named clinical-setting minimum, however many lab Mets are saved", () => {
    let s = createSeed()
    s = {
      ...s,
      skills: s.skills.map((k) => (k.id === VITALS ? { ...k, config: { ...k.config!, achievement: { ...k.config!.achievement, need: 3, settingMinimums: [{ setting: "Inpatient", min: 1 }] } } } : k)),
      evaluations: s.evaluations.filter((e) => !(e.studentId === IDS.maya && e.skillId === VITALS)),
    }
    let state = s
    for (const d of ["2026-10-05", "2026-10-12", "2026-10-19"]) state = must(saveLabBatch(state, input(state, { name: `Lab ${d}`, date: d, skillIds: [VITALS] }, { [cellKey(IDS.maya, VITALS)]: "met" }), IDS.whitmore, AT)).state
    const p = skillProgress(state, IDS.maya, VITALS)!
    expect(p.counted).toBe(3)
    expect(p.settings).toEqual([{ setting: "Inpatient", have: 0, min: 1 }])
    expect(p.achieved).toBe(false)
    expect(state.evaluations.filter((e) => e.setting === "lab").every((e) => e.clinicalSetting === undefined)).toBe(true)
  })

  it("a simulation session is stored as simulation, with no clinical setting, and the share cap still applies", () => {
    let s = createSeed()
    s = { ...s, evaluations: s.evaluations.filter((e) => !(e.studentId === IDS.maya && e.skillId === VITALS)) }
    let state = s
    for (const d of ["2026-10-05", "2026-10-12", "2026-10-19"]) state = must(saveLabBatch(state, input(state, { name: `Sim ${d}`, date: d, setting: "simulation", skillIds: [VITALS] }, { [cellKey(IDS.maya, VITALS)]: "met" }), IDS.whitmore, AT)).state
    const sims = state.evaluations.filter((e) => e.setting === "simulation" && e.studentId === IDS.maya)
    expect(sims).toHaveLength(3)
    expect(sims.every((e) => e.clinicalSetting === undefined)).toBe(true)
    const p = skillProgress(state, IDS.maya, VITALS)!
    // The default cap is 33 percent of 3 needed, which is 0 evaluations (floor), so simulation alone cannot count.
    expect(p.counted + p.simulationLeftOut).toBe(3)
    expect(p.counted).toBeLessThan(3)
    expect(p.achieved).toBe(false)
  })

  it("holds results for approval when the skill asks for it, and they do not count until approved (AR-06)", () => {
    let s = createSeed()
    s = { ...s, skills: s.skills.map((k) => (k.id === DRESS ? { ...k, config: { ...k.config!, approvalRequired: true } } : k)), evaluations: s.evaluations.filter((e) => !(e.studentId === IDS.maya && e.skillId === DRESS)) }
    const r = must(saveLabBatch(s, input(s, { skillIds: [DRESS] }, { [cellKey(IDS.maya, DRESS)]: "met" }), IDS.whitmore, AT))
    const e = r.state.evaluations.find((x) => r.batch.evaluationIds.includes(x.id))!
    expect(e.status).toBe("awaiting-approval")
    expect(skillProgress(r.state, IDS.maya, DRESS)!.counted).toBe(0)
    expect(r.state.audit[0].target).toContain("held for approval")
  })

  it("a Met in the lab adds a lab check-off once for a skill that asks for one, and never twice", () => {
    let s = createSeed()
    s = { ...s, skills: s.skills.map((k) => (k.id === VITALS ? { ...k, config: { ...k.config!, prerequisites: { ...k.config!.prerequisites, labCheckoff: true } } } : k)) }
    const first = must(saveLabBatch(s, input(s, { skillIds: [VITALS] }, { [cellKey("stu-02", VITALS)]: "met", [cellKey("stu-03", VITALS)]: "not-met" }), IDS.whitmore, AT))
    expect(first.state.labCheckoffs.filter((c) => c.skillId === VITALS).map((c) => c.studentId)).toEqual(["stu-02"])
    const second = must(saveLabBatch(first.state, input(s, { name: "Repeat", skillIds: [VITALS] }, { [cellKey("stu-02", VITALS)]: "met" }), IDS.whitmore, AT))
    expect(second.state.labCheckoffs.filter((c) => c.skillId === VITALS && c.studentId === "stu-02")).toHaveLength(1)
  })
})
