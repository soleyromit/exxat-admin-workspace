import { describe, expect, it } from "vitest"
import { cohortReportContent, studentReportContent } from "@/lib/v2/report-docs"
import {
  ALL,
  appliedFilters,
  behindPace,
  explainFilters,
  cohortsOf,
  groupsOf,
  withCohort,
  normalizeFilters,
  conflictFix,
  tagsOf,
  tagAttainment,
  gridState,
  paceDots,
  paceMarker,
  skillAttainment,
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

const studentCount = (s: { people: Array<{ kind: string }> }) => s.people.filter((p) => p.kind === "student").length

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
    expect(NO_FILTERS).toEqual({ cohort: ALL, group: ALL, course: ALL, category: ALL, tag: ALL, location: ALL, setting: ALL, clinicalSetting: ALL, mandatoryOnly: false })
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
    // Population method (own cohort offerings this term, 2026-10-26): 5 mandatory skills, 13 evaluations asked for.
    expect(maya).toMatchObject({ collected: 7, needed: 13, expected: 7, behindBy: 0 })
    const behind = behindPace(s)
    expect(behind.map((r) => r.studentId)).not.toContain(IDS.maya)
    // 15 to 30 percent of the cohort is behind the term clock (28 of 123; it read 12 on the focus course alone).
    expect(behind.length / rows.length).toBeGreaterThanOrEqual(0.15)
    expect(behind.length / rows.length).toBeLessThanOrEqual(0.3)
    for (let i = 1; i < behind.length; i++) expect(behind[i - 1].behindBy).toBeGreaterThanOrEqual(behind[i].behindBy)
  })

  it("does not count a skill above what its rule needs", () => {
    let s = createSeed()
    s = { ...s, evaluations: s.evaluations.filter((e) => e.studentId !== "stu-02") }
    for (let i = 0; i < 5; i++) s = withEval(s, { id: `x-${i}`, studentId: "stu-02", skillId: "sk-vitals" })
    expect(paceRows(s).find((x) => x.studentId === "stu-02")).toMatchObject({ collected: 3, needed: 13 })
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
    expect(med.singleRater).toBe(false)
    expect(med.raters.length).toBeGreaterThanOrEqual(3)
    expect(med.observations).toBeGreaterThanOrEqual(2)
    const ng = stats.find((k) => k.skill.id === "sk-ng-tube")!
    expect(ng.singleRater).toBe(true)
    expect(ng.raters).toHaveLength(1)
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
    expect(rows).toHaveLength(studentCount(s) * 7)
    expect(rows.every((r) => r.status.length > 0)).toBe(true)
    expect(rows.find((r) => r.studentId === IDS.maya && r.skillId === IDS.urinaryCath)!.status).toBe("In progress, 2 of 3")
  })

  it("summarises from the same selectors the screen uses", () => {
    const s = createSeed()
    const sum = reportSummary(s, NO_FILTERS)
    expect(sum).toMatchObject({ students: studentCount(s), behind: behindPace(s).length, singleRaterSkills: 1 })
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

describe("reports page view models", () => {
  it("maps every cell state to a viz state, with amber (notMet) for evaluations that did not meet and never a red", () => {
    expect(gridState("achieved")).toBe("met")
    expect(gridState("half")).toBe("notYet")
    expect(gridState("some")).toBe("notYet")
    expect(gridState("attempted")).toBe("notMet")
    expect(gridState("none")).toBe("none")
  })

  it("orders skills mandatory first, then weakest first within each level (fewest students achieved)", () => {
    const s = createSeed()
    const att = skillAttainment(s, NO_FILTERS)
    expect(att).toHaveLength(7)
    // Two blocks: mandatory, then non-mandatory (recommended and optional together since the 2026-10-26 three-level split).
    const block = (l: string) => (l === "mandatory" ? "mandatory" : "other")
    for (let i = 1; i < att.length; i++) {
      if (block(att[i].level) === block(att[i - 1].level)) expect(att[i].achieved).toBeGreaterThanOrEqual(att[i - 1].achieved)
      else expect(att[i - 1].level).toBe("mandatory")
    }
    for (const a of att) expect(a.achieved + a.inProgress + a.attempted + a.notStarted).toBe(a.students)
    expect(att[0].students).toBe(studentCount(s))
    // Narrowing by filter narrows the list the same way.
    expect(skillAttainment(s, F({ mandatoryOnly: true }))).toHaveLength(4)
  })

  it("flags the single-rater skill through the attainment row", () => {
    const att = skillAttainment(createSeed(), NO_FILTERS)
    expect(att.filter((a) => a.stat.singleRater)).toHaveLength(1)
  })

  it("makes one pace dot per student, flagging only those behind with how many they are short", () => {
    const s = createSeed()
    const dots = paceDots(paceRows(s))
    expect(dots).toHaveLength(studentCount(s))
    expect(dots.filter((d) => d.flagged)).toHaveLength(behindPace(s).length)
    expect(dots.filter((d) => d.flagged).every((d) => /^short by \d+$/.test(d.note ?? ""))).toBe(true)
    expect(dots.filter((d) => !d.flagged).every((d) => d.note === undefined)).toBe(true)
    expect(dots.every((d) => d.value >= 0 && d.value <= 100)).toBe(true)
    expect(paceMarker(0.5)).toBe(50)
  })
})


describe("RP-01 and RP-08: cohort, group, course, tag and location filters", () => {
  const s = createSeed()
  const base = reportSummary(s, NO_FILTERS)

  it("lists seven dimensions as applied, each removable alone", () => {
    const f = F({ cohort: "BSN 2027", group: "Group A", course: "crs-nurs352", category: "Assessment", tag: "Patient safety", location: "Skills lab 2", setting: "lab" })
    expect(appliedFilters(f).map((a) => a.key)).toEqual(["cohort", "group", "course", "category", "tag", "location", "setting"])
    expect(removeFilter(f, "tag").tag).toBe(ALL)
    expect(removeFilter(f, "tag").cohort).toBe("BSN 2027")
  })

  it("offers groups only for the chosen cohort and drops a group of another cohort", () => {
    expect(groupsOf(s, ALL)).toEqual([])
    expect(groupsOf(s, "BSN 2027")).toEqual(["Group A", "Group B", "Group C"])
    expect(groupsOf(s, "ABSN 2027")).toEqual(["Group A", "Group B"])
    expect(cohortsOf(s)).toEqual(["BSN 2026", "BSN 2027", "ABSN 2027", "BSN 2028"])
    expect(withCohort(s, F({ cohort: "BSN 2027", group: "Group C" }), "ABSN 2027").group).toBe(ALL)
    expect(withCohort(s, F({ cohort: "BSN 2027", group: "Group A" }), "ABSN 2027").group).toBe("Group A")
    expect(removeFilter(F({ cohort: "BSN 2027", group: "Group A" }), "cohort").group).toBe(ALL)
    expect(normalizeFilters(s, F({ group: "Group A" })).group).toBe(ALL)
  })

  it("cohort and group re-scope who is counted", () => {
    const c = reportSummary(s, F({ cohort: "ABSN 2027" }))
    expect(base.students).toBe(studentCount(s))
    expect(c.students).toBe(s.people.filter((p) => p.kind === "student" && p.cohort === "ABSN 2027").length)
    const g = reportSummary(s, F({ cohort: "ABSN 2027", group: "Group B" }))
    expect(g.students).toBe(s.people.filter((p) => p.kind === "student" && p.cohort === "ABSN 2027" && p.group === "Group B").length)
    expect(g.observations).toBeLessThan(c.observations)
  })

  it("course, location and setting re-scope the evidence and recalculate progress", () => {
    const lab = reportSummary(s, F({ course: "crs-nurs352" }))
    expect(lab.observations).toBeGreaterThan(0)
    expect(lab.observations).toBeLessThan(base.observations)
    expect(lab.mandatoryAchievedPct).toBeLessThan(base.mandatoryAchievedPct)
    const loc = reportSummary(s, F({ location: "Harbor Outpatient Clinic" }))
    expect(loc.observations).toBeGreaterThan(0)
    expect(loc.observations).toBeLessThan(base.observations)
    expect(observations(s, F({ location: "Harbor Outpatient Clinic" })).every((e) => e.location === "Harbor Outpatient Clinic")).toBe(true)
    const sim = reportSummary(s, F({ setting: "simulation" }))
    expect(sim.simulationShare).toBe(100)
  })

  it("tag keeps the skills carrying it and overlapping tags share a skill", () => {
    expect(tagsOf(s)).toEqual(["Infection prevention", "Invasive procedures", "Patient safety"])
    const names = (tag: string) => reportSkills(s, F({ tag })).map((r) => r.skill.id)
    expect(names("Patient safety")).toContain("sk-vitals")
    expect(names("Patient safety")).not.toContain("sk-sterile-dressing")
    const shared = names("Infection prevention").filter((id) => names("Invasive procedures").includes(id))
    expect(shared.length).toBeGreaterThan(0)
    expect(reportSummary(s, F({ tag: "Patient safety" })).observations).toBeLessThan(base.observations)
  })

  it("RP-09: a location that does not offer the chosen setting is explained, with the one filter to clear", () => {
    const f = F({ location: "Harbor Outpatient Clinic", clinicalSetting: "Inpatient" })
    expect(explainFilters(f, s)).toMatch(/does not offer the Inpatient clinical setting/)
    expect(conflictFix(f, s)?.keys).toEqual(["location"])
    expect(explainFilters(F({ location: "Skills lab 2", setting: "clinical" }), s)).toMatch(/does not offer clinical evidence/)
    expect(explainFilters(F({ location: "Skills lab 2", setting: "lab" }), s)).toBeNull()
  })

  it("Clear all returns the original figures", () => {
    const f = F({ cohort: "BSN 2027", group: "Group A", location: "Skills lab 2", tag: "Patient safety" })
    expect(reportSummary(s, f)).not.toEqual(base)
    expect(reportSummary(s, NO_FILTERS)).toEqual(base)
    expect(appliedFilters(NO_FILTERS)).toEqual([])
  })
})

describe("RP-04: attainment by tag", () => {
  const s = createSeed()
  const sumOf = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

  it("lists one row per tag on the skills in view, each tag's skills in the Skills tab order", () => {
    const r = tagAttainment(s, NO_FILTERS)
    expect(r.rows.map((x) => x.tag)).toEqual(tagsOf(s))
    const att = skillAttainment(s, NO_FILTERS)
    for (const row of r.rows) {
      expect(row.skills.map((a) => a.skill.id)).toEqual(att.filter((a) => (a.skill.tags ?? []).includes(row.tag)).map((a) => a.skill.id))
      expect(row.achieved + row.inProgress + row.attempted + row.notStarted).toBe(row.records)
    }
  })

  it("consistency: for the same filters the distinct-skill achieved total matches the Skills tab, and overlap makes the row sum larger", () => {
    for (const f of [NO_FILTERS, F({ cohort: "BSN 2027", group: "Group A" }), F({ setting: "simulation" }), F({ location: "Harbor Outpatient Clinic" })]) {
      const r = tagAttainment(s, f)
      const att = skillAttainment(s, f)
      const distinct = new Map<string, number>()
      for (const row of r.rows) for (const a of row.skills) distinct.set(a.skill.id, a.achieved)
      const tagged = att.filter((a) => (a.skill.tags ?? []).length > 0)
      expect(distinct.size).toBe(tagged.length)
      expect(sumOf([...distinct.values()])).toBe(sumOf(tagged.map((a) => a.achieved)))
      // the same skill carries the same figure under every tag
      for (const row of r.rows) for (const a of row.skills) expect(a.achieved).toBe(distinct.get(a.skill.id))
      // overlap: summing the rows counts a two-tag skill twice
      const rowSum = sumOf(r.rows.map((x) => x.achieved))
      const twoTags = tagged.filter((a) => (a.skill.tags ?? []).length > 1)
      expect(rowSum).toBe(sumOf(tagged.map((a) => a.achieved * (a.skill.tags ?? []).length)))
      if (twoTags.some((a) => a.achieved > 0)) expect(rowSum).toBeGreaterThan(sumOf(tagged.map((a) => a.achieved)))
    }
  })

  it("discloses the overlap: shared skills per tag, the other tags, and pairs against distinct skills", () => {
    const r = tagAttainment(s, NO_FILTERS)
    const inf = r.rows.find((x) => x.tag === "Infection prevention")!
    expect(inf.shared).toBeGreaterThan(0)
    expect(inf.alsoTags).toContain("Invasive procedures")
    const safety = r.rows.find((x) => x.tag === "Patient safety")!
    expect(safety.shared).toBe(0)
    expect(safety.alsoTags).toEqual([])
    expect(r.pairs).toBe(sumOf(r.rows.map((x) => x.skills.length)))
    expect(r.pairs).toBeGreaterThan(r.distinctSkills - r.untagged)
    expect(r.distinctSkills).toBe(skillAttainment(s, NO_FILTERS).length)
  })

  it("respects every filter: a tag filter lists that tag only, population and evidence filters recalculate", () => {
    const one = tagAttainment(s, F({ tag: "Infection prevention" }))
    expect(one.rows.map((x) => x.tag)).toEqual(["Infection prevention"])
    expect(one.rows[0].shared).toBeGreaterThan(0)
    const all = tagAttainment(s, NO_FILTERS).rows.find((x) => x.tag === "Patient safety")!
    expect(tagAttainment(s, F({ cohort: "ABSN 2027" })).rows.find((x) => x.tag === "Patient safety")!.records).toBeLessThan(all.records)
    expect(tagAttainment(s, F({ setting: "simulation" })).rows.find((x) => x.tag === "Patient safety")!.achieved).toBeLessThanOrEqual(all.achieved)
    expect(tagAttainment(s, F({ mandatoryOnly: true })).distinctSkills).toBeLessThanOrEqual(tagAttainment(s, NO_FILTERS).distinctSkills)
    expect(tagAttainment(s, F({ category: "Assessment" })).rows.every((x) => x.skills.every((a) => a.skill.category === "Assessment"))).toBe(true)
  })

  it("explains a tag with no skills in scope instead of returning an empty row, and a view with no students has no share", () => {
    const none = tagAttainment(s, F({ tag: "Patient safety", category: "Assessment" }))
    if (none.rows.length === 0) expect(none.missingTag).toBe("Patient safety")
    const ghost = tagAttainment(s, F({ tag: "Not a tag" }))
    expect(ghost.rows).toEqual([])
    expect(ghost.missingTag).toBe("Not a tag")
    const empty = { ...s, people: s.people.filter((p) => p.kind !== "student") }
    for (const row of tagAttainment(empty, NO_FILTERS).rows) {
      expect(row.records).toBe(0)
      expect(row.pct).toBeNull()
    }
  })
})
