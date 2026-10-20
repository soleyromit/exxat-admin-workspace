import { describe, expect, it } from "vitest"
import { cohortReportContent, studentReportContent } from "@/lib/v2/report-docs"
import {
  ALL,
  appliedFilters,
  behindPace,
  explainFilters,
  heatCell,
  heatmap,
  NO_FILTERS,
  observations,
  paceRows,
  raterRows,
  removeFilter,
  reportSkills,
  reportSummary,
  SCALE,
  skillStats,
  studentSkillRows,
  termShare,
  type ReportFilters,
} from "@/lib/v2/reports"
import { createSeed, IDS } from "@/lib/v2/seed"
import type { Evaluation, V2State } from "@/lib/v2/types"

const AT = "2026-10-20T10:00:00.000Z"
const F = (patch: Partial<ReportFilters>): ReportFilters => ({ ...NO_FILTERS, ...patch })

function withEval(s: V2State, e: Partial<Evaluation> & { id: string; studentId: string; skillId: string }): V2State {
  const full: Evaluation = {
    evaluatorId: IDS.delgado,
    setting: "clinical",
    clinicalSetting: "Inpatient",
    date: "2026-10-10T09:00:00Z",
    status: "counted",
    outcome: "met",
    currentVersion: 1,
    versions: [{ version: 1, outcome: e.outcome ?? "met", at: "2026-10-10T09:00:00Z", by: IDS.delgado, reason: null }],
    ...e,
  }
  return { ...s, evaluations: [...s.evaluations, full] }
}

describe("which skills and students are in view", () => {
  it("shows the published skills the course maps, mandatory first, never the unpublished or not-expected ones", () => {
    const s = createSeed()
    const r = reportSkills(s, NO_FILTERS)
    expect(r.map((x) => x.skill.id)).not.toContain(IDS.ivCath)
    expect(r.map((x) => x.skill.id)).not.toContain("sk-central-line")
    const levels = r.map((x) => x.level)
    expect(levels.indexOf("optional")).toBeGreaterThan(levels.lastIndexOf("mandatory"))
    expect(r).toHaveLength(7)
  })

  it("narrows by category and by mandatory only", () => {
    const s = createSeed()
    expect(reportSkills(s, F({ category: "Wound care" })).map((x) => x.skill.id)).toEqual(["sk-sterile-dressing"])
    expect(reportSkills(s, F({ mandatoryOnly: true })).every((x) => x.level === "mandatory")).toBe(true)
    expect(reportSkills(s, F({ mandatoryOnly: true }))).toHaveLength(4)
  })
})

describe("heatmap cells", () => {
  it("states each cell in words and never relies on shade alone", () => {
    const s = createSeed()
    const hm = heatmap(s, NO_FILTERS)
    const maya = hm.rows.find((r) => r.student.id === IDS.maya)!
    const texts = new Map(hm.skills.map((r, i) => [r.skill.id, maya.cells[i]]))
    expect(texts.get("sk-vitals")).toMatchObject({ state: "achieved", text: "Achieved" })
    expect(texts.get(IDS.urinaryCath)).toMatchObject({ state: "half", text: "2 of 3" })
    expect(texts.get("sk-med-admin")).toMatchObject({ state: "some", text: "1 of 3" })
    expect(texts.get("sk-sterile-dressing")).toMatchObject({ state: "attempted", text: "Not met yet" })
    expect(texts.get("sk-handoff")).toMatchObject({ state: "none", text: "Not started" })
    for (const row of hm.rows) for (const c of row.cells) expect(c.text.length).toBeGreaterThan(0)
  })

  it("uses a sequential scale from 0 to 3 and no cell state maps outside it", () => {
    expect(Object.values(SCALE).sort()).toEqual([0, 0, 1, 2, 3])
  })

  it("does not count evidence awaiting approval (AR-06)", () => {
    const s = createSeed()
    const glucose = s.skills.find((k) => k.id === "sk-blood-glucose")!
    // Maya's only blood glucose evaluation is waiting for approval.
    expect(heatCell(s, IDS.maya, glucose)).toMatchObject({ state: "none", counted: 0 })
  })

  it("totals per student add up to the skills in view", () => {
    const hm = heatmap(createSeed(), NO_FILTERS)
    for (const r of hm.rows) expect(r.achieved + r.inProgress + r.attempted + r.notStarted).toBe(hm.skills.length)
  })
})

describe("filters", () => {
  it("lists what is applied, one entry each, and removes one at a time (RP-01)", () => {
    const f = F({ category: "Assessment", setting: "lab", mandatoryOnly: true })
    expect(appliedFilters(f).map((x) => x.label)).toEqual(["Category: Assessment", "Setting: Lab", "Mandatory skills only"])
    const less = removeFilter(f, "setting")
    expect(appliedFilters(less).map((x) => x.key)).toEqual(["category", "mandatoryOnly"])
    expect(appliedFilters(NO_FILTERS)).toEqual([])
  })

  it("recalculates progress from the evidence the setting filter leaves (RP-08)", () => {
    const s = createSeed()
    const lab = heatmap(s, F({ setting: "lab" }))
    const maya = lab.rows.find((r) => r.student.id === IDS.maya)!
    const i = lab.skills.findIndex((r) => r.skill.id === "sk-vitals")
    // Maya's one lab vital signs evaluation is all that is left.
    expect(maya.cells[i]).toMatchObject({ counted: 1, state: "some" })
    expect(observations(s, F({ setting: "lab" })).every((e) => e.setting === "lab")).toBe(true)
  })

  it("explains a combination that cannot produce evidence (RP-09)", () => {
    expect(explainFilters(F({ setting: "lab", clinicalSetting: "Inpatient" }))).toMatch(/never carries a named clinical setting/)
    expect(explainFilters(F({ setting: "simulation", clinicalSetting: "Outpatient" }))).toMatch(/simulation evidence/)
    expect(explainFilters(F({ setting: "clinical", clinicalSetting: "Inpatient" }))).toBeNull()
    expect(explainFilters(NO_FILTERS)).toBeNull()
    const s = createSeed()
    expect(observations(s, F({ setting: "lab", clinicalSetting: "Inpatient" }))).toEqual([])
  })

  it("a named clinical setting keeps only clinical evidence from that setting", () => {
    const s = createSeed()
    const obs = observations(s, F({ clinicalSetting: "Inpatient" }))
    expect(obs.length).toBeGreaterThan(0)
    expect(obs.every((e) => e.setting === "clinical" && e.clinicalSetting === "Inpatient")).toBe(true)
  })

  it("keeps every filter value out of the way when it is All", () => {
    expect(NO_FILTERS).toEqual({ category: ALL, setting: ALL, clinicalSetting: ALL, mandatoryOnly: false })
  })
})

describe("behind pace", () => {
  it("reads a term clock: 56 of 109 days have passed on the demo day", () => {
    expect(termShare("2026-10-19")).toBeCloseTo(56 / 109, 5)
    expect(termShare("2026-01-01")).toBe(0)
    expect(termShare("2027-01-01")).toBe(1)
  })

  it("flags a student more than one evaluation short of the pace, worst first, and not one on pace", () => {
    const s = createSeed()
    const rows = paceRows(s)
    const maya = rows.find((r) => r.studentId === IDS.maya)!
    expect(maya).toMatchObject({ collected: 6, needed: 12, expected: 6, behindBy: 0 })
    const behind = behindPace(s)
    expect(behind.map((r) => r.studentId)).not.toContain(IDS.maya)
    expect(behind.length).toBe(10)
    for (let i = 1; i < behind.length; i++) expect(behind[i - 1].behindBy).toBeGreaterThanOrEqual(behind[i].behindBy)
  })

  it("does not count a skill above what its rule needs", () => {
    let s = createSeed()
    s = { ...s, evaluations: s.evaluations.filter((e) => e.studentId !== "stu-02") }
    for (let i = 0; i < 5; i++) s = withEval(s, { id: `x-${i}`, studentId: "stu-02", skillId: "sk-vitals" })
    expect(paceRows(s).find((x) => x.studentId === "stu-02")).toMatchObject({ collected: 3, needed: 12 })
  })

  it("a student on a clean sweep is never behind", () => {
    let s = createSeed()
    for (const skill of ["sk-vitals", "sk-med-admin", "sk-sterile-dressing", IDS.urinaryCath]) for (let i = 0; i < 3; i++) s = withEval(s, { id: `y-${skill}-${i}`, studentId: "stu-02", skillId: skill })
    expect(paceRows(s).find((x) => x.studentId === "stu-02")).toMatchObject({ achieved: 4, behindBy: 0 })
  })
})

describe("observations, raters and simulation", () => {
  it("counts observations and distinct evaluators per skill and flags one evaluator behind two or more", () => {
    const s = createSeed()
    const stats = skillStats(s, NO_FILTERS)
    const med = stats.find((k) => k.skill.id === "sk-med-admin")!
    expect(med.singleRater).toBe(true)
    expect(med.raters).toHaveLength(1)
    expect(med.observations).toBeGreaterThanOrEqual(2)
    const vitals = stats.find((k) => k.skill.id === "sk-vitals")!
    expect(vitals.raters.length).toBeGreaterThanOrEqual(2)
    expect(vitals.singleRater).toBe(false)
  })

  it("one observation is not flagged: a single rater needs two or more observations", () => {
    let s = createSeed()
    s = { ...s, evaluations: s.evaluations.filter((e) => e.skillId !== "sk-handoff") }
    s = withEval(s, { id: "solo", studentId: "stu-02", skillId: "sk-handoff" })
    const k = skillStats(s, NO_FILTERS).find((x) => x.skill.id === "sk-handoff")!
    expect(k).toMatchObject({ observations: 1, singleRater: false })
  })

  it("reports the simulation share of counted observations", () => {
    let s = createSeed()
    s = { ...s, evaluations: s.evaluations.filter((e) => e.skillId !== "sk-handoff") }
    for (let i = 0; i < 3; i++) s = withEval(s, { id: `c-${i}`, studentId: "stu-02", skillId: "sk-handoff", setting: i === 0 ? "simulation" : "clinical", clinicalSetting: i === 0 ? undefined : "Inpatient" })
    const k = skillStats(s, NO_FILTERS).find((x) => x.skill.id === "sk-handoff")!
    expect(k).toMatchObject({ observations: 3, simulation: 1, simulationShare: 33 })
  })

  it("leaves out evidence awaiting approval, reopened and returned from every figure", () => {
    const s = createSeed()
    const all = s.evaluations.filter((e) => ["awaiting-approval", "reopened", "returned"].includes(e.status))
    expect(all.length).toBeGreaterThan(0)
    const obs = observations(s, NO_FILTERS)
    for (const e of all) expect(obs.map((x) => x.id)).not.toContain(e.id)
  })

  it("compares raters with a gap to all raters and marks small numbers", () => {
    const s = createSeed()
    const rows = raterRows(s, NO_FILTERS)
    const d = rows.find((r) => r.id === IDS.delgado)!
    const w = rows.find((r) => r.id === IDS.whitmore)!
    expect(d.evaluations).toBeGreaterThan(w.evaluations)
    expect(d.small).toBe(false)
    expect(w.small).toBe(w.evaluations < 5)
    expect(d.met + d.notMet + d.notYet).toBe(d.evaluations)
    const all = observations(s, NO_FILTERS)
    const overall = Math.round((all.filter((e) => e.outcome === "met").length / all.length) * 100)
    expect(d.vsAll).toBe(d.metRate - overall)
  })
})

describe("the words-only table and the summary", () => {
  it("has one row per student and skill in view, each in words", () => {
    const s = createSeed()
    const rows = studentSkillRows(s, NO_FILTERS)
    expect(rows).toHaveLength(12 * 7)
    expect(rows.every((r) => r.status.length > 0)).toBe(true)
    expect(rows.find((r) => r.studentId === IDS.maya && r.skillId === IDS.urinaryCath)!.status).toBe("In progress, 2 of 3")
  })

  it("summarises from the same selectors the screen uses", () => {
    const s = createSeed()
    const sum = reportSummary(s, NO_FILTERS)
    expect(sum).toMatchObject({ students: 12, behind: 10, singleRaterSkills: 2 })
    expect(sum.observations).toBe(observations(s, NO_FILTERS).length)
    expect(reportSummary(s, F({ setting: "lab", clinicalSetting: "Inpatient" })).observations).toBe(0)
  })
})

describe("report documents (RP-10)", () => {
  it("record the filters that produced them and never carry a concern, a self-rating or feedback text", () => {
    const s = createSeed()
    const c = cohortReportContent(s, F({ category: "Assessment", mandatoryOnly: true }), AT)
    expect(c.filters).toEqual(["Category: Assessment", "Mandatory skills only"])
    const all = JSON.stringify(c)
    expect(all).not.toContain("Sample concern for the faculty-only flow")
    expect(all).not.toContain("Asked the preceptor to check my sterile technique")
    expect(all).not.toContain("Wait for the full reading")
    expect(c.blocks.some((b) => /never part of a report/.test(b.s ?? ""))).toBe(true)
  })

  it("a student report states the verification status and lists each counted evaluation", () => {
    const s = createSeed()
    const c = studentReportContent(s, IDS.maya, NO_FILTERS, AT)!
    const text = c.blocks.map((b) => b.s ?? "").join("\n")
    expect(text).toContain("Program verification: Not verified")
    expect(text).toContain("Vital signs and early warning score")
    expect(c.subject).toContain("Maya Ferreira")
    expect(studentReportContent(s, IDS.delgado, NO_FILTERS, AT)).toBeNull()
  })

  it("a cohort report lists every student and the single-rater skills", () => {
    const c = cohortReportContent(createSeed(), NO_FILTERS, AT)
    const text = c.blocks.map((b) => b.s ?? "").join("\n")
    for (const n of ["Maya Ferreira", "Ethan Cole", "Oral medication administration"]) expect(text).toContain(n)
    expect(text).toContain("One evaluator")
    expect(c.filters).toEqual([])
  })
})
