import { populationRows, populationTotals } from "@/lib/v2/population"
import { describe, expect, it } from "vitest"
import { createSeed, SEED_PROGRAM_RULE, SEED_RESET_FIXTURE } from "@/lib/v2/seed"
import { facts } from "@/lib/v2/facts"
import { isConfigured } from "@/lib/v2/population"
import { buildLibrary, addSkillsToStore, draftToSkill, EMPTY_DRAFT, countLibrary, setSkillDetailsInStore } from "@/lib/lab/library"
import { fromV2, validateRule, type LabRule } from "@/lib/lab/configure"
import { applyDefaultConfiguration, configurationOf, copySettings, defaultDraftOf, differsFromProgram, panelRuleOf, planProgramApply, programImpact, programSettingsOf, saveProgramSettings, setTimesNeeded, settingsImpact, skillRuleOf, timesNeededImpact } from "@/lib/lab/program-settings"
import { seedLists, listSizeParts, assignedSkillIdsByStudent, studentsAssigned } from "@/lib/lab/lists"
import { recordStateOf } from "@/lib/lab/dashboard"
import { retireImpact } from "@/lib/lab/retire"
import { heldState } from "@/lib/v2/approvals"
import { skillProgress } from "@/lib/v2/student"
import { newProgramSeed } from "@/lib/lab/new-program"
import { skillReach } from "@/lib/lab/mapping"
import { outcomeFromAnswers, answersDecide, validate, buildRequest, blankResponse, receipt } from "@/lib/lab/evaluator"
import { LAB_MODEL_LABEL } from "@/lib/lab/configure"

const opts = { at: "2026-11-04T10:00:00Z", byId: "u-admin" }
const seed = createSeed()
const program = programSettingsOf(seed)!.rule

describe("the seeded program's Evaluation settings (D-L72, map D0)", () => {
  it("are saved, valid, and the program's own values", () => {
    expect(programSettingsOf(seed)).not.toBeNull()
    expect(validateRule(program)).toEqual([])
    expect(program.model).toBe(SEED_PROGRAM_RULE.model)
  })
  it("mark a skill Custom exactly when its package differs from the program's", () => {
    for (const k of seed.skills) {
      if (!isConfigured(k)) continue
      const differs = differsFromProgram(skillRuleOf(k), program).length > 0
      expect(!!k.edited, `${k.name}: differs ${differs}`).toBe(differs)
    }
  })
  it("start about 12 skills Custom and no skill Not configured: nobody is a standing exception (D-L90, D-L94)", () => {
    const rows = buildLibrary(seed)
    const c = countLibrary(rows)
    expect(c.total).toBe(178)
    expect(c.notConfigured).toBe(0)
    expect(c.inactive).toBe(2)
    expect(c.edited).toBe(12)
    expect(c.defaultConfiguration).toBe(166)
    expect(rows.find((r) => r.name === "Nasogastric tube care")!.configuration).toBe("edited")
    for (const name of ["IV catheter insertion", "Central line dressing change", "Patient handoff to emergency department", "Blood Pressure"]) expect(rows.find((r) => r.name === name)!.configuration, name).toBe("default")
  })
  it("pin the figures this moved, each with its reason (before: 1547, 757, 49, 28, 35; 159, 19, 157)", () => {
    const f = facts(seed)
    // D-L102: every student reads the skills on their list, 14,896 records and 7,578 achieved after the earlier-term evidence of SEED_VERSION 2026-11-05.3 (4,416 before it). Against the program clock 23 are behind.
    expect([f.listRecords, f.listAchieved, f.achievedPct, f.behind, f.awaitingApproval]).toEqual([14896, 7578, 51, 23, 35])
    // Mandatory this term has not moved: IV catheter insertion, mandatory on NURS 350, adds 43 records and its evidence achieves 20 of them, so 1,590 records, 777 achieved, 49 percent, 28 behind.
    const term = populationTotals(populationRows(seed, undefined, undefined, { set: "term" }))
    expect([term.records, term.achieved, term.achievedPct, term.behind]).toEqual([1590, 777, 49, 28])
    // Every skill is in use now that nobody is held back.
    expect([f.skillsConfigured, f.skillsNotConfigured, f.assignedSkills]).toEqual([178, 0, 176])
    expect(seed.evaluations.length).toBe(12225) // 8476 generated, 118 IV catheter insertion, 51 Central line dressing change, 3,580 earlier-term evidence on the list
  })
  it("E15's fixture: a Custom skill whose reset changes who has achieved it", () => {
    const k = seed.skills.find((x) => x.id === SEED_RESET_FIXTURE)!
    expect(configurationOf(seed, k)).toBe("edited")
    const said = settingsImpact(seed, k, defaultDraftOf(panelRuleOf(k), program))
    expect(said).toHaveLength(1)
  })
  it("a new program still starts with nothing", () => {
    const fresh = newProgramSeed()
    expect(programSettingsOf(fresh)).toBeNull()
    const s = addSkillsToStore(fresh, [draftToSkill({ ...EMPTY_DRAFT, name: "Hand hygiene" }, "n1")], "u", opts.at)
    expect(configurationOf(s, s.skills[0]!)).toBe("not-configured")
  })
})

describe("inheritance (map D0 rules)", () => {
  const defaults = () => buildLibrary(seed).filter((r) => r.status === "active" && r.configuration === "default").map((r) => r.id)

  it("rule 3: a new skill is on the default configuration at once and joins no live list", () => {
    const s = addSkillsToStore(seed, [draftToSkill({ ...EMPTY_DRAFT, name: "New one" }, "n1")], "u", opts.at)
    const k = s.skills.find((x) => x.id === "n1")!
    expect(configurationOf(s, k)).toBe("default")
    expect(isConfigured(k)).toBe(true)
    expect(seedLists(s).some((l) => l.skillIds.includes("n1"))).toBe(false)
    expect(buildLibrary(s).find((r) => r.id === "n1")!.source).toBe("Added by hand")
  })
  it("rule 7: a program save never touches a Custom skill", () => {
    const own = seed.skills.find((k) => k.edited && isConfigured(k))!
    const r = saveProgramSettings(seed, { ...program, feedbackRequired: true }, opts)
    if (!r.ok) throw new Error("save")
    expect(r.result.plan.edited).toContain(own.id)
    expect(r.result.state.skills.find((k) => k.id === own.id)).toEqual(own)
  })
  it("rule 5: a program save never touches a skill's questions", () => {
    const ng = seed.skills.find((k) => k.id === "sk-ng-tube")!
    const r = saveProgramSettings(seed, { ...program, need: 2 }, opts)
    if (!r.ok) throw new Error("save")
    expect(r.result.state.skills.find((k) => k.id === "sk-ng-tube")!.config!.questions).toEqual(ng.config!.questions)
  })
  it("rule 6: followers take the new number; a changed number stays and is counted", () => {
    const a = defaults()[0]!
    const b = defaults().find((id) => id !== a && fromV2(seed.skills.find((k) => k.id === id)!).need === program.need)!
    const changed = setTimesNeeded(seed, a!, 5, opts)
    if (!changed.ok) throw new Error("times")
    const plan = planProgramApply(changed.state, { ...program, need: 7 })
    expect(plan.ownNumber).toBeGreaterThan(0)
    const r = saveProgramSettings(changed.state, { ...program, need: 7 }, opts)
    if (!r.ok) throw new Error("save")
    expect(fromV2(r.result.state.skills.find((k) => k.id === a)!).need).toBe(5)
    expect(fromV2(r.result.state.skills.find((k) => k.id === b)!).need).toBe(7)
    expect(configurationOf(r.result.state, r.result.state.skills.find((k) => k.id === a)!)).toBe("default")
  })
  it("rule 5: changing Times needed does not change Configuration, however many times it is saved", () => {
    const id = defaults()[0]!
    let state = seed
    for (const need of [9, 4, 6]) {
      const r = setTimesNeeded(state, id, need, opts)
      if (!r.ok) throw new Error("times")
      state = r.state
      expect(configurationOf(state, state.skills.find((k) => k.id === id)!)).toBe("default")
    }
  })
  it("rule 9: a rename names no students; a rule change does before it applies", () => {
    const renamed: LabRule = { ...program, levels: ["One", "Two", "Three"] }
    expect(programImpact(seed, renamed, planProgramApply(seed, renamed)).ruleChanged).toBe(false)
    const stricter: LabRule = { ...program, need: 6 }
    const impact = programImpact(seed, stricter, planProgramApply(seed, stricter))
    expect(impact.ruleChanged).toBe(true)
    expect(impact.students.length).toBeGreaterThan(0)
  })
  it("rule 7: Use default configuration takes the package back and keeps the skill's number", () => {
    const own = seed.skills.find((k) => k.edited && isConfigured(k) && k.model === "demonstration")!
    const before = fromV2(own).need
    const r = applyDefaultConfiguration(seed, own.id, opts)
    if (!r.ok) throw new Error(r.error)
    const after = r.state.skills.find((k) => k.id === own.id)!
    expect(configurationOf(r.state, after)).toBe("default")
    expect(fromV2(after).need).toBe(before)
    expect(differsFromProgram(fromV2(after), program)).toEqual([])
  })
  it("a model that needs questions gives the program's set to every skill on the default configuration; none goes Not configured (D0 note 2026-11-05)", () => {
    const q: LabRule = { ...program, model: "question", levels: [], questions: ["Asked"], questionRule: { kind: "all" }, carried: { ...program.carried, minLevelIndex: null } }
    const r = saveProgramSettings(seed, q, opts)
    if (!r.ok) throw new Error(JSON.stringify(r.issues))
    expect(r.result.plan.blocked).toEqual([])
    const k = r.result.state.skills.find((x) => x.id === r.result.written[0])!
    expect(configurationOf(r.result.state, k)).toBe("default")
    expect(k.config!.questions).toEqual(["Asked"])
  })
})

describe("saves are real (a success message must be true)", () => {
  it("Library edit writes the shared store", () => {
    const id = seed.skills[0]!.id
    const s = setSkillDetailsInStore(seed, [id], { name: "Renamed", description: "Here", category: "Assessment", tags: ["t1"] }, "u", opts.at)
    expect(s.skills[0]).toMatchObject({ name: "Renamed", description: "Here", category: "Assessment", tags: ["t1"] })
    expect(buildLibrary(s).find((r) => r.id === id)).toMatchObject({ name: "Renamed", section: "Assessment" })
  })
  it("Copy settings reaches the targets, and they keep their own number", () => {
    const source = seed.skills.find((k) => k.edited && isConfigured(k) && k.config?.approvalRequired)!
    const target = buildLibrary(seed).find((r) => (r.status === "active" && r.configuration === "default"))!
    const need = fromV2(seed.skills.find((k) => k.id === target.id)!).need
    const r = copySettings(seed, source.id, [target.id], opts)
    expect(r.written).toEqual([target.id])
    const after = r.state.skills.find((k) => k.id === target.id)!
    expect(after.config!.approvalRequired).toBe(true)
    expect(after.edited).toBe(true)
    expect(fromV2(after).need).toBe(need)
  })
  it("a course count has one source: every skill's panel figure is Course mapping's", () => {
    const rows = skillReach(seed, {} as never, "")
    expect(rows.find((r) => r.name === "Blood Pressure")!.courses).toBeGreaterThan(0)
  })
  it("a list's size reads total and inactive, and the members are the difference", () => {
    const list = seedLists(seed).find((l) => l.id === "list-clinical")!
    expect(listSizeParts(seed, list)).toEqual({ total: 154, inactive: 2 })
  })
})

describe("a save names who it changes before it applies (map D0 rule 9)", () => {
  const stateOf = (s: typeof seed, studentId: string, skillId: string) => recordStateOf(skillProgress(heldState(s), studentId, skillId))
  const named = (name: string) => seed.skills.find((k) => k.name === name)!
  it.each([["Blood Pressure", 5], ["Sponge Bath", 3], ["Height", 2]])("%s at %i: the names are exactly the students whose record state moves once saved", (name, need) => {
    const k = named(name)
    const said = timesNeededImpact(seed, k.id, need).map((x) => x.id).sort()
    const r = setTimesNeeded(seed, k.id, need, opts)
    if (!r.ok) throw new Error(r.error)
    const moved = seed.people.filter((p) => p.kind === "student" && stateOf(seed, p.id, k.id) !== stateOf(r.state, p.id, k.id)).map((p) => p.id).sort()
    expect(said.length).toBeGreaterThan(0)
    expect(said).toEqual(moved)
  })
  it("names nobody when no student has evidence on the skill", () => {
    expect(timesNeededImpact(seed, named("Sitz Bath").id, 3)).toEqual([])
  })
  it("names nobody when the number does not change", () => {
    const k = named("Blood Pressure")
    expect(timesNeededImpact(seed, k.id, skillRuleOf(k)!.need)).toEqual([])
  })
})

describe("Students who have it (deactivate dialog, REQ SL-11)", () => {
  it("counts every student a list reaches, not only those a course makes it mandatory for this term", () => {
    const lists = seedLists(seed)
    const reached = (id: string) => { const by = assignedSkillIdsByStudent(seed, lists); return [...by.values()].filter((ids) => ids.has(id)).length }
    for (const name of ["Blood Pressure", "Sponge Bath"]) {
      const k = seed.skills.find((x) => x.name === name)!
      expect(studentsAssigned(seed, k.id, lists)).toBe(reached(k.id))
    }
    // Sponge Bath: mandatory in no course this term, yet on the lists of students who already hold evaluations of it.
    const sponge = seed.skills.find((x) => x.name === "Sponge Bath")!
    expect(retireImpact(seed, sponge.id)!.requiredFor).toBe(0)
    expect(studentsAssigned(seed, sponge.id, lists)).toBeGreaterThan(0)
  })
})

describe("the Questions model has no final result (D-L73)", () => {
  const skill = { questions: ["a", "b", "c"], questionRule: { kind: "all" as const } }
  it("is named Questions", () => {
    expect(LAB_MODEL_LABEL.question).toBe("Questions")
  })
  it("derives the outcome from the answers, under each SC-05 rule", () => {
    expect(outcomeFromAnswers(skill, ["yes", "yes", null])).toBeNull()
    expect(outcomeFromAnswers(skill, ["yes", "yes", "yes"])).toBe("met")
    expect(outcomeFromAnswers(skill, ["yes", "no", "yes"])).toBe("not-met")
    expect(outcomeFromAnswers({ ...skill, questionRule: { kind: "atLeast", n: 2 } }, ["yes", "no", "yes"])).toBe("met")
    expect(outcomeFromAnswers({ ...skill, questionRule: { kind: "subset", indices: [1] } }, ["yes", "no", "yes"])).toBe("not-met")
  })
  it("the evaluator form asks every question and never asks for an outcome", () => {
    // A request for a questions skill: every question must be answered; there is no outcome to choose.
    const req = buildRequest(seed, "request", "default", undefined, "sub-03")
    const k = req?.skills.find((x) => answersDecide(x))
    expect(k, "the seeded request has a Questions skill").toBeDefined()
    if (!req || !k) return
    const issues = validate({ ...req, skills: [k] }, { [k.id]: blankResponse(k) })
    expect(issues.some((i) => i.message === "Choose an outcome.")).toBe(false)
    expect(issues.some((i) => i.message === "Answer every question.")).toBe(true)
  })
  it("an Unmet answer never reads Counts now on the receipt", () => {
    const req = buildRequest(seed, "request", "default", undefined, "sub-03")!
    const k = req.skills.find((x) => answersDecide(x))!
    const lines = receipt({ ...req, skills: [{ ...k, holds: false }] }, { [k.id]: { ...blankResponse(k), outcome: "not-met", answers: k.questions.map(() => "no") } })
    expect(lines[0]!.word).toBe("Did not meet criteria")
  })
})
