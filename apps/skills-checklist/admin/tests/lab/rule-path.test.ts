import { describe, expect, it } from "vitest"
import { applyPreset, emptyRule, validateRule, withCountsFrom, withModel, type LabRule } from "@/lib/lab/configure"
import { issueStep, levelRangeExample, neededTimes, passChip, rulePath, signersPhrase, tallyFor } from "@/lib/lab/rule-path"
import { SCALE_MISSING_MESSAGE } from "@/lib/lab/configure"
import { movesHead, movesWhen } from "@/lib/lab/terms"
import { tileExamples } from "@/components/lab/configure/settings-rows"

// "Your rule" as a path (concept A, Romit 2026-11-11, D-L145): read from the rule, one node per step, every model.
const base = (r: LabRule): LabRule => ({ ...r, need: 2, evaluatorRoles: ["preceptor", "faculty"], selfEvaluation: true, approvalRequired: false })
const levels = () => withCountsFrom(base(applyPreset(withModel(emptyRule(), "demonstration"), "independence")), 1)
const path = (r: LabRule, failing = false) => rulePath(r, validateRule(r), failing)
const ids = (r: LabRule) => path(r).map((s) => s.id)
const step = (r: LabRule, id: string, failing = false) => path(r, failing).find((s) => s.id === id)!

describe("The path, for the levels model", () => {
  it("logs, rates self, signs off with the levels that move a student on, needed n times, achieved", () => {
    const r = levels()
    expect(ids(r)).toEqual(["log", "self", "sign", "need", "achieved"])
    expect(path(r).map((s) => s.label)).toEqual(["Student logs the skill", "Rates themselves first", "Preceptor or clinical faculty signs off", "Needed 2 times", "Skill achieved"])
    expect(step(r, "sign").chip).toEqual({ text: "With assistance or independent", icon: "fa-stairs" })
    expect(step(r, "need").times).toBe(2)
    expect(path(r).every((s) => s.state === "set")).toBe(true)
  })
  it("every level ticked reads Any level; the top one only names it; three or more read or above", () => {
    expect(passChip(withCountsFrom(levels(), 0))?.text).toBe("Any level")
    expect(passChip(withCountsFrom(levels(), 2))?.text).toBe("Independent")
    const four = withCountsFrom({ ...levels(), levels: ["Observed", "Assisted", "Supervised", "Independent"] }, 1)
    expect(passChip(four)?.text).toBe("Assisted or above")
  })
  it("Needed 1 time, singular; never \"evaluations like this\"", () => {
    expect(neededTimes(1)).toBe("Needed 1 time")
    expect(neededTimes(2)).toBe("Needed 2 times")
    expect(step({ ...levels(), need: 1 }, "need").label).toBe("Needed 1 time")
    expect(JSON.stringify(path(levels()))).not.toMatch(/like this|\bcounts?\b|Accepted|items/)
  })
  it("self rating off leaves its step out; approval on adds one", () => {
    expect(ids({ ...levels(), selfEvaluation: false })).toEqual(["log", "sign", "need", "achieved"])
    expect(ids({ ...levels(), approvalRequired: true })).toEqual(["log", "self", "sign", "approval", "need", "achieved"])
  })
})

describe("The sign step's chip comes from each model's own data", () => {
  it("approved or not approved: the outcome chosen", () => {
    const r = base({ ...withModel(emptyRule(), "binary"), outcomeLabels: ["Approved", "Not approved"], qualifyingLabel: 0 })
    expect(step(r, "sign").chip).toEqual({ text: "Approved", icon: "fa-circle-check" })
    expect(step(r, "sign").label).toBe("Preceptor or clinical faculty signs off")
  })
  it("questions: every one, at least n of m, or the ones chosen", () => {
    const q = base({ ...withModel(emptyRule(), "question"), questions: ["A", "B", "C", "D", "E"] })
    expect(passChip({ ...q, questionRule: { kind: "all" } })?.text).toBe("All 5 questions answered Yes")
    expect(passChip({ ...q, questionRule: { kind: "atLeast", n: 4 } })?.text).toBe("At least 4 of 5 answered Yes")
    expect(passChip({ ...q, questionRule: { kind: "subset", indices: [0, 2] } })?.text).toBe("Questions 1 and 3 answered Yes")
    expect(passChip({ ...q, questionRule: { kind: "subset", indices: [1] } })?.text).toBe("Question 2 answered Yes")
    expect(passChip({ ...q, questionRule: { kind: "atLeast", n: 9 } })).toBeNull()
  })
  it("score on a scale: average, every question, total", () => {
    const s = base({ ...withModel(emptyRule(), "scored"), questions: ["A", "B", "C"], scaleMax: 5 })
    expect(passChip({ ...s, scoredRule: { kind: "average", value: 4 } })).toEqual({ text: "Average 4 or more out of 5", icon: "fa-hashtag" })
    expect(passChip({ ...s, scoredRule: { kind: "minEach", value: 3 } })?.text).toBe("At least 3 on every question")
    expect(passChip({ ...s, scoredRule: { kind: "total", value: 12 } })?.text).toBe("Total 12 or more out of 15")
    expect(passChip({ ...s, scoredRule: { kind: "average", value: 9 } })).toBeNull()
  })
  it("signers: one, two, three, none", () => {
    expect(signersPhrase(["faculty"])).toBe("Clinical faculty")
    expect(signersPhrase(["preceptor", "faculty", "lab-instructor"])).toBe("Preceptor, clinical faculty or lab instructor")
    expect(signersPhrase([])).toBe("")
    expect(step({ ...levels(), evaluatorRoles: [] }, "sign").label).toBe("Who signs off")
  })
})

describe("First run, gaps and errors", () => {
  it("no model: the first-run outline, the second step is the way in", () => {
    const r = emptyRule()
    const p = path(r)
    expect(p.map((s) => s.label)).toEqual(["Student logs the skill", "Choose how skills are judged", "Who signs off", "Times needed", "Skill achieved"])
    expect(p.map((s) => s.state)).toEqual(["set", "todo", "todo", "todo", "todo"])
    expect(p[1]!.start).toBe(true)
    expect(p[1]!.issues).toEqual([])
  })
  it("problems sit on the step they block: todo while filling in, error after a failed Save", () => {
    const r = { ...levels(), levels: ["Needs coaching", "With assistance", ""], need: Number.NaN }
    const filling = path(r)
    expect(filling.find((s) => s.id === "sign")!.state).toBe("todo")
    expect(filling.find((s) => s.id === "sign")!.chip).toBeUndefined()
    const failed = path(r, true)
    const sign = failed.find((s) => s.id === "sign")!
    const need = failed.find((s) => s.id === "need")!
    expect(sign.state).toBe("error")
    expect(sign.issues.map((i) => i.message)).toEqual(["The top level has no name."])
    expect(need.state).toBe("error")
    expect(need.label).toBe("Times needed")
    expect(failed.find((s) => s.id === "achieved")!.state).toBe("todo")
  })
  it("fields map to steps", () => {
    expect(issueStep("cfg-model")).toBe("judged")
    expect(issueStep("cfg-field-2")).toBe("log")
    expect(issueStep("cfg-need")).toBe("need")
    expect(issueStep("cfg-setting-min-0")).toBe("need")
    expect(issueStep("cfg-level-1")).toBe("sign")
    expect(issueStep("cfg-role-preceptor")).toBe("sign")
    expect(issueStep("cfg-qrule-n")).toBe("sign")
  })
})

describe("The levels tile's example skips blank names sensibly (live bug: \"Needs coaching to with assistance\")", () => {
  it("both ends named: lowest to top, the top lowercased mid-sentence", () => {
    expect(levelRangeExample(["Needs coaching", "With assistance", "Works alone"])).toBe("Needs coaching to works alone")
    expect(levelRangeExample(["Needs coaching", "", "Works alone"])).toBe("Needs coaching to works alone")
  })
  it("a blank top or lowest level is counted, never skipped into a dangling range", () => {
    expect(levelRangeExample(["Needs coaching", "With assistance", ""])).toBe("3 levels, 1 without a name")
    expect(levelRangeExample(["", "With assistance", ""])).toBe("3 levels, 2 without a name")
    expect(levelRangeExample(["Observed", ""])).toBe("2 levels, 1 without a name")
  })
  it("no names yet: the tile keeps its generic example", () => {
    expect(levelRangeExample([])).toBeNull()
    expect(levelRangeExample(["", ""])).toBeNull()
    const r = { ...withModel(emptyRule(), "demonstration"), levels: ["Needs coaching", "With assistance", ""] }
    expect(tileExamples(r).demonstration).toBe("3 levels, 1 without a name")
    expect(tileExamples(r).demonstration).not.toMatch(/ to with /)
    expect(tileExamples(emptyRule()).demonstration).toBe("Levels you name, such as Observed to Independent")
  })
})

describe("Follow-ups approved 2026-11-11", () => {
  it("tally marks only for 2 to 5; 1 and 6 or more are words only", () => {
    expect(tallyFor(1)).toBe(0)
    expect(tallyFor(2)).toBe(2)
    expect(tallyFor(3)).toBe(3)
    expect(tallyFor(5)).toBe(5)
    expect(tallyFor(6)).toBe(0)
    expect(tallyFor(undefined)).toBe(0)
  })
  it("the answer rule's label reuses the Levels head, with no \"counts\"", () => {
    expect(movesHead()).toBe("Moves student toward achieving the skill")
    expect(movesWhen()).toBe("Moves student toward achieving the skill when")
  })
  it("Score on a scale with no scale: \"Choose a scale first.\" on the Scale select, never NaN", () => {
    const s = base({ ...withModel(emptyRule(), "scored"), questions: ["A", "B"], scoredRule: { kind: "average", value: 4 } })
    expect(Number.isNaN(s.scaleMax)).toBe(true)
    const issues = validateRule(s)
    expect(SCALE_MISSING_MESSAGE).toBe("Choose a scale first.")
    expect(issues.find((i) => i.field === "cfg-scale")?.message).toBe("Choose a scale first.")
    expect(issues.find((i) => i.field === "cfg-srule-value")).toBeUndefined()
    expect(JSON.stringify(issues)).not.toMatch(/NaN/)
    for (const kind of ["minEach", "total"] as const) expect(JSON.stringify(validateRule({ ...s, scoredRule: { kind, value: Number.NaN } }))).not.toMatch(/NaN/)
    // With a scale, a value off it still says the range.
    expect(validateRule({ ...s, scaleMax: 5, scoredRule: { kind: "average", value: 9 } }).find((i) => i.field === "cfg-srule-value")?.message).toBe("Enter a value from 1 to 5.")
  })
})
