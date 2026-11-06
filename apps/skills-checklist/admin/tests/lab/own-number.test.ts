import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { fromV2, newQuestionLines, ruleSaysWhatCounts, validateRule, type LabRule } from "@/lib/lab/configure"
import { buildLibrary } from "@/lib/lab/library"
import { planProgramApply, programSettingsOf, saveProgramSettings, setTimesNeeded, timesCellOf, timesRows, saveSkillSettings, panelRuleOf } from "@/lib/lab/program-settings"
import type { V2State } from "@/lib/v2/types"

const opts = { at: "2026-11-05T10:00:00Z", byId: "adm-ross" }
const seed = createSeed()
const program = (s: V2State): LabRule => programSettingsOf(s)!.rule
const skillNamed = (s: V2State, name: string) => s.skills.find((k) => k.name === name)!
const saveNeed = (s: V2State, need: number): V2State => {
  const r = saveProgramSettings(s, { ...program(s), need }, opts)
  if (!r.ok) throw new Error("program save")
  return r.result.state
}
const needOf = (s: V2State, name: string) => skillNamed(s, name).config!.achievement.need
const BP = "Blood Pressure"

describe("D0 rule 6: a skill keeps a number someone changed, even after it has come to match the program's", () => {
  it("Blood Pressure stays on its own number through a match and past it", () => {
    const own = needOf(seed, BP)
    expect(own).not.toBe(program(seed).need)
    const matched = saveNeed(seed, own)
    expect(needOf(matched, BP)).toBe(own)
    expect(timesCellOf(matched, skillNamed(matched, BP).id)).toMatchObject({ value: own, programNeed: own, differs: true })
    const past = saveNeed(matched, own + 2)
    expect(needOf(past, BP)).toBe(own)
    expect(timesCellOf(past, skillNamed(past, BP).id).differs).toBe(true)
  })

  it("a skill that follows keeps following", () => {
    const follower = seed.skills.find((k) => !k.edited && k.config?.achievement.need === program(seed).need)!
    const next = saveNeed(saveNeed(seed, 2), 4)
    expect(needOf(next, follower.name)).toBe(4)
    expect(timesCellOf(next, follower.id).differs).toBe(false)
  })

  it("the dialog's count, the link and the Library filter stay the same set after a match", () => {
    const own = needOf(seed, BP)
    const before = planProgramApply(seed, { ...program(seed), need: own }).ownNumber
    const matched = saveNeed(seed, own)
    const after = planProgramApply(matched, { ...program(matched), need: own + 2 })
    expect(after.ownNumber).toBe(before)
    const lib = buildLibrary(matched)
    const flagged = lib.filter((r) => r.timesDiffer).map((r) => r.id).sort()
    const cells = lib.filter((r) => timesCellOf(matched, r.id).differs).map((r) => r.id).sort()
    expect(flagged).toEqual(cells)
    const defaults = new Set(matched.skills.filter((k) => !k.edited).map((k) => k.id))
    expect(flagged.filter((id) => defaults.has(id)).length).toBe(after.ownNumber)
  })

  it("a marked skill's other saves leave the mark; typing the program's number is the way back", () => {
    const own = needOf(seed, BP)
    const matched = saveNeed(seed, own)
    const id = skillNamed(matched, BP).id
    const saved = saveSkillSettings(matched, id, { ...panelRuleOf(skillNamed(matched, BP)), feedbackRequired: true }, { ...opts, edited: true })
    if (!saved.ok) throw new Error(saved.error)
    expect(skillNamed(saved.state, BP).ownNeed).toBe(true)

    const past = saveNeed(matched, own + 2)
    const back = setTimesNeeded(past, id, own + 2, opts)
    if (!back.ok) throw new Error(back.error)
    expect(skillNamed(back.state, BP).ownNeed).toBeUndefined()
    expect(timesCellOf(back.state, id).differs).toBe(false)
    expect(needOf(saveNeed(back.state, own + 3), BP)).toBe(own + 3)
  })

  it("the settings table's rows carry the mark", () => {
    const matched = saveNeed(seed, needOf(seed, BP))
    const row = timesRows(matched, buildLibrary(matched)).find((r) => r.name === BP)!
    expect(row.own).toBe(true)
  })

  it("Custom skills keep their number and are not written", () => {
    const custom = seed.skills.find((k) => k.edited && k.config)!
    const need = fromV2(custom).need
    const next = saveNeed(saveNeed(seed, need + 1), need + 2)
    expect(needOf(next, custom.name)).toBe(need)
    expect(timesCellOf(next, custom.id).differs).toBe(true)
  })
})

describe("D-L96 with the mark: a skill keeps its own questions even after they come to match the program's [REQ SC-04]", () => {
  const q: LabRule = { ...program(seed), model: "question", questions: ["A", "B"], questionRule: { kind: "all" }, levels: [], carried: { ...program(seed).carried, minLevelIndex: null } }
  const saved = (s: V2State, rule: LabRule) => {
    const r = saveProgramSettings(s, rule, opts)
    if (!r.ok) throw new Error("program save")
    return r.result.state
  }
  const first = saved(seed, q)
  const k = first.skills.find((x) => !x.edited)!
  const own = saveSkillSettings(first, k.id, { ...panelRuleOf(k), questions: ["Mine"] }, { ...opts, edited: false })
  if (!own.ok) throw new Error(own.error)
  const qOf = (s: V2State, id = k.id) => s.skills.find((x) => x.id === id)!.config!.questions
  const matched = saved(own.state, { ...q, questions: ["Mine"] })

  it("the match is marked and the next program set leaves it alone", () => {
    expect(matched.skills.find((x) => x.id === k.id)!.ownQuestions).toBe(true)
    expect(qOf(saved(matched, { ...q, questions: ["Other"] }))).toEqual(["Mine"])
  })

  it("a follower takes each new set and is never marked", () => {
    const follower = matched.skills.find((x) => !x.edited && x.id !== k.id && !x.ownQuestions)!
    const next = saved(matched, { ...q, questions: ["Other"] })
    expect(qOf(next, follower.id)).toEqual(["Other"])
    expect(next.skills.find((x) => x.id === follower.id)!.ownQuestions).toBeUndefined()
  })

  it("the dialog's counts agree: same own count before and after the match, and they add up", () => {
    const before = planProgramApply(own.state, { ...q, questions: ["Mine"] })
    const atMatch = planProgramApply(matched, { ...q, questions: ["Mine"] })
    const past = planProgramApply(matched, { ...q, questions: ["Other"] })
    expect(before.ownQuestions).toBe(atMatch.ownQuestions)
    expect(atMatch.ownQuestions).toBe(past.ownQuestions)
    expect(past.programQuestions + past.ownQuestions).toBe(past.change.length + past.unchanged.length)
  })

  it("giving the skill the program's set is the way back", () => {
    const moved = saved(matched, { ...q, questions: ["Other"] })
    const back = saveSkillSettings(moved, k.id, { ...panelRuleOf(moved.skills.find((x) => x.id === k.id)!), questions: ["Other"] }, { ...opts, edited: false })
    if (!back.ok) throw new Error(back.error)
    expect(back.state.skills.find((x) => x.id === k.id)!.ownQuestions).toBeUndefined()
    expect(qOf(saved(back.state, { ...q, questions: ["Third"] }))).toEqual(["Third"])
  })

  it("a model without questions clears the set and the mark, and the skill then takes the program's", () => {
    const binary = saved(matched, program(seed))
    expect(binary.skills.find((x) => x.id === k.id)!.ownQuestions).toBeUndefined()
    expect(qOf(saved(binary, { ...q, questions: ["Again"] }))).toEqual(["Again"])
  })
})

describe("Small rules", () => {
  it("paste leaves out repeats, ignoring case", () => {
    expect(newQuestionLines(["Washes hands", "washes hands ", "Checks ID", "Old"], ["old"])).toEqual(["Washes hands", "Checks ID"])
  })
  it("one question says so, not 'from 1 to 1'", () => {
    const r: LabRule = { ...program(seed), model: "question", questions: ["Only"], questionRule: { kind: "atLeast", n: 9 } }
    expect(validateRule(r).find((i) => i.field === "cfg-qrule-n")?.message).toBe("Enter 1. There is 1 question.")
  })
  it("no sentence until the rule says what counts", () => {
    const base = program(seed)
    expect(ruleSaysWhatCounts(base)).toBe(true)
    expect(ruleSaysWhatCounts({ ...base, carried: { ...base.carried, minLevelIndex: null } })).toBe(false)
    expect(ruleSaysWhatCounts({ ...base, model: "binary", qualifyingLabel: null, outcomeLabels: ["Pass", "Fail"] })).toBe(false)
  })
})
