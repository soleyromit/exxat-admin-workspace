import { describe, expect, it } from "vitest"
import { blockedGroups, configurationOf, planProgramApply, programImpact, programSaveEffects, programSettingsOf, ruleForNewSkill, resolveRule, saveProgramSettings, skillRuleOf } from "@/lib/lab/program-settings"
import { engineKey, emptyRule, ruleSentence, saveLabRule, studentNeedsSentence, withModel, type LabRule } from "@/lib/lab/configure"
import { answersDecide, buildRequest, outcomeFromAnswers, receipt, ratingLabel, validate, type EvResponse } from "@/lib/lab/evaluator"
import { outcomeFromScores, scoreMaxOf } from "@/lib/v2/preceptor"
import { outcomeQualifies, qualifiesOn, runRule, engineRuleOf } from "@/lib/v2/rules"
import { createSeed } from "@/lib/v2/seed"
import { ratingKind, ruleSentence as ruleSentenceOf } from "@/lib/v2/student"
import { saveLogged } from "@/lib/lab/logged"
import { selfShape } from "@/components/lab/student2/log-parts"
import type { Evaluation, V2State } from "@/lib/v2/types"

const seed = createSeed()
const program = programSettingsOf(seed)!.rule
const opts = { at: "2026-10-26T10:00:00Z", byId: "u" }
const fromLevels = { levels: [], levelMinimums: [], carried: { ...program.carried, minLevelIndex: null } }
const asQuestion = (questions: string[], questionRule: LabRule["questionRule"] = { kind: "all" }): LabRule => ({ ...program, ...fromLevels, model: "question", questions, questionRule })
const asScored = (questions: string[], scaleMax: number, scoredRule: LabRule["scoredRule"]): LabRule => ({ ...program, ...fromLevels, model: "scored", questions, scaleMax, scoredRule })
const asBinary = (qualifyingLabel: 0 | 1): LabRule => ({ ...program, ...fromLevels, model: "binary", outcomeLabels: ["Met", "Unmet"], qualifyingLabel })
const applied = (s: V2State, r: LabRule) => {
  const out = saveProgramSettings(s, r, opts)
  if (!out.ok) throw new Error(JSON.stringify(out.issues))
  return out.result
}
const firstDefault = (s: V2State) => s.skills.find((k) => !k.edited && k.active !== false)!

describe("the program's question set (D0 note 2026-11-05) [REQ SC-04]", () => {
  it("goes to every skill on the default configuration, none Not configured", () => {
    const q = asQuestion(["One", "Two"])
    const r = applied(seed, q)
    expect(r.plan.blocked).toEqual([])
    const defaults = r.state.skills.filter((k) => !k.edited)
    expect(defaults.every((k) => JSON.stringify(k.config?.questions) === JSON.stringify(["One", "Two"]))).toBe(true)
    expect(defaults.every((k) => configurationOf(r.state, k) === "default")).toBe(true)
    expect(r.plan.programQuestions).toBe(defaults.length)
  })
  it("a skill's own questions stay, stay Default, and later program changes pass them by", () => {
    const first = applied(seed, asQuestion(["One", "Two"])).state
    const k = firstDefault(first)
    const own = saveLabRule(first, k.id, { ...skillRuleOf(k)!, questions: ["Mine"] }, { ...opts, mode: null })
    if (!own.ok) throw new Error(own.error)
    expect(configurationOf(own.state, own.state.skills.find((x) => x.id === k.id)!)).toBe("default")
    const second = applied(own.state, asQuestion(["One", "Two", "Three"]))
    expect(second.plan.ownQuestions).toBe(1)
    expect(second.state.skills.find((x) => x.id === k.id)!.config!.questions).toEqual(["Mine"])
    // One that took the program's follows it, the way Times needed does (D0 rule 6).
    const other = second.state.skills.find((x) => !x.edited && x.id !== k.id)!
    expect(other.config!.questions).toEqual(["One", "Two", "Three"])
  })
  it("a named subset goes with the set; on a skill with its own questions it stays satisfiable", () => {
    const q = asQuestion(["One", "Two", "Three"], { kind: "subset", indices: [1] })
    expect(resolveRule(q, null).questionRule).toEqual({ kind: "subset", indices: [1] })
    expect(resolveRule(q, { ...emptyRule(), model: "question", questions: ["Mine", "Two"], questionRule: null }).questionRule).toEqual({ kind: "subset", indices: [1] })
    expect(resolveRule(q, { ...emptyRule(), model: "question", questions: ["Mine", "Other"], questionRule: null }).questionRule).toEqual({ kind: "subset", indices: [0, 1] })
    expect(resolveRule(q, { ...emptyRule(), model: "question", questions: ["Mine", "Other"], questionRule: { kind: "subset", indices: [1] } }).questionRule).toEqual({ kind: "subset", indices: [1] })
  })
  it("a new skill takes the set at once", () => {
    const r = applied(seed, asQuestion(["One"]))
    expect(ruleForNewSkill(r.state)?.questions).toEqual(["One"])
  })
  it("a total the skill's own set cannot reach is capped", () => {
    const s = asScored(["a", "b", "c"], 5, { kind: "total", value: 12 })
    expect(resolveRule(s, { ...emptyRule(), model: "scored", questions: ["Only"] }).scoredRule).toEqual({ kind: "total", value: 5 })
  })
})

describe("Score on a scale has no final result (Sankalp 11-04) [REQ SC-07]", () => {
  const withScored = applied(seed, asScored(["Technique", "Talk"], 7, { kind: "average", value: 5 })).state
  const skill = firstDefault(withScored)
  it("the skill reads the configured scale", () => {
    expect(scoreMaxOf(skill)).toBe(7)
  })
  it("the outcome comes from the scores, on both forms", () => {
    expect(outcomeFromScores(skill, [7, 3])).toBe("met")
    expect(outcomeFromScores(skill, [1, 1])).toBe("not-met")
    const k = { answerKind: "score" as const, questions: ["a", "b"], questionRule: null, scoredRule: { kind: "average" as const, value: 5 }, scaleMax: 7 }
    expect(answersDecide(k)).toBe(true)
    expect(outcomeFromAnswers(k, [1, 1])).toBe("not-met")
    expect(outcomeFromAnswers(k, [7, null])).toBeNull()
  })
  it("the real form asks no outcome; every question must be scored", () => {
    const req = buildRequest(withScored, "request", "default")!
    const scored = { ...req, skills: [{ ...req.skills[0]!, model: "scored" as const, answerKind: "score" as const, questions: ["a", "b"], levels: [], scaleMax: 7, scoredRule: { kind: "average" as const, value: 5 } }] }
    const blank: EvResponse = { outcome: null, level: null, answers: [null, null], feedback: "x" }
    expect(validate(scored, { [scored.skills[0]!.id]: blank }).map((i) => i.message)).toEqual(["Score every question from 1 to 7."])
    expect(ratingLabel(scored.skills[0]!, { ...blank, answers: [6, 7], outcome: "met" })).toBe("Scored 6, 7")
  })
})

describe("which label qualifies (end to end) [REQ SC-03, AE-02]", () => {
  const ev = (outcome: Evaluation["outcome"]): Evaluation => ({ id: "e", studentId: "s", skillId: "k", evaluatorId: "v", setting: "clinical", date: "2026-10-01", status: "counted", outcome, currentVersion: 1, versions: [{ version: 1, outcome, at: "2026-10-01", by: "v", reason: null }] })
  it("the engine counts the chosen label only", () => {
    expect(outcomeQualifies({ model: "binary", qualifyingLabel: 1 }, "not-met")).toBe(true)
    expect(outcomeQualifies({ model: "binary", qualifyingLabel: 1 }, "met")).toBe(false)
    expect(outcomeQualifies({ model: "binary", qualifyingLabel: 0 }, "met")).toBe(true)
    expect(outcomeQualifies({ model: "demonstration", qualifyingLabel: 1 }, "met")).toBe(true)
    expect(qualifiesOn({ model: "binary", questionRule: null, scoredRule: null, qualifyingLabel: 1 }, ev("not-met"))).toBe(true)
    expect(qualifiesOn({ model: "binary", questionRule: null, scoredRule: null, qualifyingLabel: 1 }, ev("not-yet"))).toBe(false)
  })
  it("the rule key sees the difference, so the dialog names who changes", () => {
    expect(engineKey(asBinary(0))).not.toBe(engineKey(asBinary(1)))
    const before = applied(seed, asBinary(0)).state
    const plan = planProgramApply(before, asBinary(1))
    const impact = programImpact(before, asBinary(1), plan)
    expect(impact.ruleChanged).toBe(true)
    expect(impact.students.length).toBeGreaterThan(0)
    const after = applied(before, asBinary(1)).state
    const k = firstDefault(after)
    expect(engineRuleOf(k)?.qualifyingLabel).toBe(1)
    expect((runRule(engineRuleOf(k)!, [ev("not-met")]) as { have: number }).have).toBe(1)
  })
  it("switching to the model has nothing preselected", () => {
    expect(withModel({ ...program, qualifyingLabel: 0 }, "binary").qualifyingLabel).toBeNull()
    expect(Number.isNaN(withModel(program, "scored").scaleMax)).toBe(true)
    expect(withModel(program, "scored").scoredRule).toBeNull()
  })
  it("the receipt says what happens under the chosen label", () => {
    const req = buildRequest(seed, "request", "default")!
    const k = { ...req.skills[0]!, model: "binary" as const, levels: [], questions: [], answerKind: null, qualifyingLabel: 1 as const, minLevelIndex: null, holds: false }
    const r = { ...req, skills: [k] }
    expect(receipt(r, { [k.id]: { outcome: "not-met", level: null, answers: [], feedback: "" } })[0]!.status).toBe("counts")
    expect(receipt(r, { [k.id]: { outcome: "met", level: null, answers: [], feedback: "" } })[0]!.status).toBe("not-counted")
  })
})

describe("the save dialog's words (map D3) [REQ SC-18, AE-06]", () => {
  it("names the real reason for each group", () => {
    const labOnly = { ...program, evaluatorRoles: ["lab-instructor"] as LabRule["evaluatorRoles"] }
    const plan = planProgramApply(seed, labOnly)
    const groups = blockedGroups(plan)
    expect(groups.map((g) => g.why)).toContain("lab-only")
    expect(groups.map((g) => g.words)).not.toContain("No questions yet")
    expect(groups.reduce((n, g) => n + g.count, 0)).toBe(plan.blocked.length)
  })
  it("a rename is said as a rename; a model change says what it clears and whether check-off changes", () => {
    const renamed = { ...program, levels: ["Observed only", ...program.levels.slice(1)] }
    expect(programSaveEffects(program, renamed)).toMatchObject({ namesOnly: true, checkOff: null, cleared: [] })
    const toQuestions = asQuestion(["One"])
    const e = programSaveEffects(program, toQuestions)
    expect(e.namesOnly).toBe(false)
    expect(e.checkOff).toBe("off")
    expect(e.cleared).toContain("Levels")
    expect(programSaveEffects({ ...program, need: 1 }, { ...program, need: 2 }).namesOnly).toBe(false)
  })
})

describe("the rule sentence on the page [REQ SC-17]", () => {
  it("reads like the panel's", () => {
    expect(studentNeedsSentence({ ...program, need: 3 })).toBe("Student needs 3 evaluations at any level.")
    expect(ruleSentence(asQuestion(["a", "b", "c"], { kind: "atLeast", n: 2 }))).toContain("at least 2 of 3 questions")
    expect(studentNeedsSentence(asScored(["a"], 7, { kind: "average", value: 5 }))).toContain("out of 7")
  })
})

describe("the student's self-rating follows the evaluator's form [REQ ST-11, SC-15]", () => {
  const scored = applied(seed, asScored(["Technique", "Talk"], 4, { kind: "minEach", value: 3 })).state
  const skill = firstDefault(scored)
  it("a scored skill asks a score per question on the program's scale, and no final result", () => {
    const sh = selfShape(skill)
    expect(ratingKind(skill)).toBe("scores")
    expect(sh.questions).toEqual(["Technique", "Talk"])
    expect(sh.scaleTop).toBe(4)
    expect(sh.overall).toEqual([])
  })
  it("a question skill asks each question, and no final result", () => {
    const q = firstDefault(applied(seed, asQuestion(["One", "Two"])).state)
    expect(selfShape(q).questions).toEqual(["One", "Two"])
    expect(selfShape(q).scaleTop).toBeNull()
    expect(selfShape(q).overall).toEqual([])
  })
  it("the student's scores are kept on the log entry for the evaluator and the reviewer", () => {
    const r = saveLogged(scored, { skillIds: [skill.id], where: "lab", setting: "lab", clinicalSetting: null, location: "Skills lab 2", date: "2026-10-20", unit: "", case: "", note: "", ratings: {}, answers: { [skill.id]: [3, 4] }, extra: {}, course: null, step: null, who: null, method: null, batchId: null }, "stu-maya")
    expect(r.state.logEntries.find((e) => e.batchId === r.batchId)!.answers).toEqual([3, 4])
  })
  it("the rule sentence names the score rule", () => {
    expect(ruleSentenceOf(skill)).toContain("each scoring at least 3 on every question")
  })
})
