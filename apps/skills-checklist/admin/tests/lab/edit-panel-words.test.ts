import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { evalsOfStudentSkill } from "@/lib/v2/evidence-index"
import { evaluateRule, fromV2, ruleSentence, studentsOf, validateRule, withModel, emptyRule, type LabRule } from "@/lib/lab/configure"
import { panelIssues, panelRuleOf, programSettingsOf, rebuildForModel, saveSkillSettings, settingsImpact } from "@/lib/lab/program-settings"
import { progressChanges } from "@/components/lab/library/times-needed"
import { sectionOfIssue, sectionSummary, packageReadOut } from "@/components/lab/configure/skill-sections"
import { CONFIGURATION_META, CONFIGURATION_ORDER } from "@/lib/lab/library"
import { draftConfiguration } from "@/lib/lab/program-settings"

/** Rework of the edit panel, 2026-11-05: what the panel says, and what it says about students. */
const seed = createSeed()
const program = programSettingsOf(seed)!.rule
const opts = { at: "2026-11-05T09:00:00Z", byId: "u" }

describe("the rule sentence with questions (map E21, rework items 4, 5)", () => {
  const q = (questions: string[], questionRule: LabRule["questionRule"]): LabRule => ({ ...withModel(emptyRule(), "question"), questions, questionRule, need: 2, distinctEvaluators: 2 })
  it("states the question count", () => {
    expect(ruleSentence(q(["a", "b", "c"], { kind: "all" }))).toBe("Get 2 evaluations with all 3 questions answered Yes, from 2 different evaluators.")
    expect(ruleSentence(q(["a"], { kind: "all" }))).toBe("Get 2 evaluations with 1 question answered Yes, from 2 different evaluators.")
    expect(ruleSentence(q(["a", "b", "c"], { kind: "atLeast", n: 2 }))).toBe("Get 2 evaluations with at least 2 of 3 questions answered Yes, from 2 different evaluators.")
  })
  it("with none, says so and never counts against 0", () => {
    const rules: Array<LabRule["questionRule"]> = [{ kind: "all" }, { kind: "atLeast", n: 2 }, { kind: "subset", indices: [] }]
    for (const r of rules) {
      const s = ruleSentence(q([], r))
      expect(s).toBe("Get 2 evaluations, no questions yet, from 2 different evaluators.")
      expect(s).not.toMatch(/of 0/)
    }
    expect(sectionSummary("counts", q([], { kind: "all" }))).toBe("All Yes, 2 times, no minimums")
  })
})

describe("problems in the panel's words (rework item 8)", () => {
  it("say First label and Which one qualifies, and never outcome", () => {
    const binary: LabRule = { ...withModel(emptyRule(), "binary"), outcomeLabels: ["", ""], qualifyingLabel: null, need: 1, evaluatorRoles: ["preceptor"] }
    const words = panelIssues(binary).map((i) => i.message).join(" ")
    expect(words).toContain("first label")
    expect(words).toContain("second label")
    expect(words).toContain("which one qualifies")
    expect(words).not.toMatch(/outcome/i)
  })
  it("leave the pages' own words alone", () => {
    const binary: LabRule = { ...withModel(emptyRule(), "binary"), outcomeLabels: ["", ""], qualifyingLabel: null, need: 1, evaluatorRoles: ["preceptor"] }
    expect(validateRule(binary).map((i) => i.message).join(" ")).toContain("first outcome")
  })
})

describe("No student's progress changes (rework item 11) [REQ AE-02]", () => {
  /** A real change: Independence level to Approved or not approved, on skills with evidence. */
  const skills = seed.skills.filter((k) => k.active !== false && k.model === "demonstration" && seed.evaluations.some((e) => e.skillId === k.id && e.status === "counted"))
  const toBinary = (now: LabRule): LabRule => ({ ...rebuildForModel(now, "binary", program, now), outcomeLabels: ["Approved", "Not approved"], qualifyingLabel: 0 })

  /** The saved skill read by the engine, per student: what the student screens read. */
  const read = (state: typeof seed, id: string) => {
    const r = fromV2(state.skills.find((x) => x.id === id)!)
    return new Map(studentsOf(state).map((p) => {
      const run = evaluateRule(r, evalsOfStudentSkill(state, p.id, id))
      return [p.id, "have" in run ? `${run.state}:${run.have}` : "invalid"]
    }))
  }

  it("names every student whose count or state moves after the save, and only them", () => {
    let movedSomewhere = 0
    for (const skill of skills) {
      const next = toBinary(panelRuleOf(skill))
      const said = settingsImpact(seed, skill, next)
      const saved = saveSkillSettings(seed, skill.id, next, { ...opts, edited: true })
      if (!saved.ok) throw new Error(saved.error)
      const before = read(seed, skill.id)
      const after = read(saved.state, skill.id)
      const moved = [...before.keys()].filter((id) => before.get(id) !== after.get(id))
      movedSomewhere += moved.length
      expect(said.map((s) => s.id).sort(), skill.name).toEqual([...moved].sort())
      if (moved.length) expect(progressChanges(said)).not.toBe("No student's progress changes.")
    }
    expect(movedSomewhere).toBeGreaterThan(0)
  })

  it("stays empty when nothing about the evidence reads differently", () => {
    const now = panelRuleOf(skills[0]!)
    expect(settingsImpact(seed, skills[0]!, { ...now, feedbackRequired: !now.feedbackRequired, selfEvaluation: !now.selfEvaluation })).toEqual([])
  })
})

describe("the panel's words and groups after the designer's review (D-L97)", () => {
  it("Configuration reads Default, Custom, Not configured", () => {
    expect(CONFIGURATION_ORDER.map((c) => CONFIGURATION_META[c].label)).toEqual(["Default", "Custom", "Not configured"])
  })
  it("the read-out under Default names the program's package, only what applies, with student fields and group check-off", () => {
    expect(packageReadOut(program).map((r) => r.label)).toEqual(["Judged by", "Levels", "Counts", "Student fills in", "Student rates first", "Who signs off", "Feedback", "Group check-off", "Approval"])
    for (const r of packageReadOut(program)) expect(r.value.trim()).not.toBe("")
    expect(packageReadOut({ ...withModel(emptyRule(), "binary"), outcomeLabels: ["Met", "Not met"], qualifyingLabel: 0 }).map((r) => r.label).slice(0, 3)).toEqual(["Judged by", "Labels", "Which one qualifies"])
    expect(packageReadOut({ ...withModel(emptyRule(), "question") }).map((r) => r.label).slice(0, 2)).toEqual(["Judged by", "Counts"])
    expect(packageReadOut({ ...withModel(emptyRule(), "scored"), scaleMax: 5 }).map((r) => r.label).slice(0, 3)).toEqual(["Judged by", "Scale", "Counts"])
  })
  it("each closed section names its own values", () => {
    expect(sectionSummary("student", { ...program, studentFields: [], selfEvaluation: false })).toBe("No fields, does not rate first")
    expect(sectionSummary("who", { ...program, evaluatorRoles: [], feedbackRequired: true, approvalRequired: true })).toBe("Nobody chosen, feedback required, approval required")
  })
  it("a problem goes to the section that holds its field", () => {
    const issue = (field: string, section: string) => ({ id: field, field, section, message: "x" }) as never
    expect(sectionOfIssue(issue("cfg-model", "model"))).toBe("judged")
    expect(sectionOfIssue(issue("cfg-field-0", "signoff"))).toBe("student")
    expect(sectionOfIssue(issue("cfg-roles", "signoff"))).toBe("who")
    expect(sectionOfIssue(issue("cfg-min", "rule"))).toBe("counts")
    expect(sectionOfIssue(issue("cfg-need", "rule"))).toBe("counts")
  })
  it("choosing Custom reads Custom with the program's own values, and without a model it stays Not configured", () => {
    expect(draftConfiguration({ rule: program, baseEdited: false, baseRule: program, program, reset: false, custom: true })).toBe("edited")
    expect(draftConfiguration({ rule: program, baseEdited: false, baseRule: program, program, reset: false })).toBe("default")
    expect(draftConfiguration({ rule: emptyRule(), baseEdited: false, baseRule: emptyRule(), program: null, reset: false, custom: true })).toBe("not-configured")
  })
})
