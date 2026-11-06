import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { isConfigured } from "@/lib/v2/population"
import { evalsOfSkill } from "@/lib/v2/evidence-index"
import { buildLibrary, filterLibrary } from "@/lib/lab/library"
import { differsFromProgram, emptyRule, fromV2, type LabRule } from "@/lib/lab/configure"
import {
  configurationOf,
  defaultDraftOf,
  draftConfiguration,
  isUsable,
  modelChangeClears,
  panelIssues,
  panelRuleOf,
  planProgramApply,
  programSettingsOf,
  reactivateImpact,
  rebuildForModel,
  resolveRule,
  saveSkillSettings,
  setTimesNeeded,
  settingsImpact,
  statusOf,
  timesNeededImpact,
} from "@/lib/lab/program-settings"
import { setSkillsActive } from "@/lib/v2/admin-actions"
import { skillReach } from "@/lib/lab/mapping"

/** Map D0, D1a (D-L88 to D-L94). The UI tasks are in scripts/lab-task-tests.mjs group E. */
const seed = createSeed()
const program = programSettingsOf(seed)!.rule
const opts = { at: "2026-11-05T10:00:00Z", byId: "u-admin" }
const bp = seed.skills.find((k) => k.name === "Blood Pressure")!
const start = panelRuleOf(bp)
const word = (rule: LabRule, reset = false, baseEdited = false) => draftConfiguration({ rule, baseEdited, baseRule: start, program, reset })
const save = (rule: LabRule, edited: boolean, s = seed) => {
  const r = saveSkillSettings(s, bp.id, rule, { ...opts, edited })
  if (!r.ok) throw new Error(r.error)
  return r.state
}
const after = (s: typeof seed) => s.skills.find((k) => k.id === bp.id)!

describe("the word in the form (D0 rules 4, 5, 7)", () => {
  it("every package field reads Custom at once", () => {
    for (const change of [{ feedbackRequired: true }, { approvalRequired: true }, { selfEvaluation: false }, { evaluatorRoles: ["preceptor"] }, { studentFields: [] }, { checkOff: { enabled: false, levelIndex: null, score: null } }, { levels: ["A", "B"] }, { carried: { ...start.carried, minLevelIndex: 1 } }] as Array<Partial<LabRule>>) {
      expect(word({ ...start, ...change }), JSON.stringify(change)).toBe("edited")
    }
  })
  it("rule 5 values never do: Times needed, level and setting minimums, different evaluators", () => {
    for (const change of [{ need: 9 }, { levelMinimums: [{ levelIndex: 2, min: 1 }] }, { settingMinimums: [{ setting: "Inpatient", min: 1 }] }, { distinctEvaluators: 1 }] as Array<Partial<LabRule>>) {
      expect(word({ ...start, ...change }), JSON.stringify(change)).toBe("default")
    }
  })
  it("setting a value by hand to match the program still reads Custom; only choosing Default goes back", () => {
    expect(word({ ...start }, false, true)).toBe("edited")
    const edited = { ...start, feedbackRequired: true }
    const reset = defaultDraftOf(edited, program)
    expect(word(reset, true, true)).toBe("default")
    expect(reset.need).toBe(start.need)
    expect(reset.distinctEvaluators).toBe(start.distinctEvaluators)
    expect(differsFromProgram(reset, program)).toEqual([])
  })
  it("Not configured wins: a model that needs questions and has none", () => {
    expect(word(rebuildForModel(start, "question", program, start))).toBe("not-configured")
    expect(word({ ...emptyRule() })).toBe("not-configured")
  })
})

describe("a model change rebuilds what depends on it [REQ SC-09]", () => {
  it("leaving Independence level clears its rows and nothing else", () => {
    const withMin = { ...start, levelMinimums: [{ levelIndex: 1, min: 1 }], settingMinimums: [{ setting: "Inpatient", min: 1 }] }
    const r = rebuildForModel(withMin, "binary", program, start)
    expect(r).toMatchObject({ model: "binary", levels: [], levelMinimums: [], outcomeLabels: ["", ""], qualifyingLabel: null, need: start.need, distinctEvaluators: start.distinctEvaluators, settingMinimums: withMin.settingMinimums, evaluatorRoles: start.evaluatorRoles, feedbackRequired: start.feedbackRequired })
    expect(r.carried.minLevelIndex).toBeNull()
  })
  it("the new model starts empty, nothing preselected, unless the program uses it [REQ SC-02]", () => {
    const q = rebuildForModel(start, "question", program, start)
    expect([q.questions, q.questionRule]).toEqual([[], null])
    const s = rebuildForModel(start, "scored", program, start)
    expect([s.scoredRule, Number.isNaN(s.scaleMax)]).toEqual([null, true])
    expect(rebuildForModel(start, "demonstration", program, start)).toBe(start)
    const back = rebuildForModel(rebuildForModel(start, "binary", program, start), "demonstration", program, start)
    expect(back.levels).toEqual(start.levels)
    expect(back.carried.minLevelIndex).toBe(start.carried.minLevelIndex)
  })
  it("questions stay between Questions and Score on a scale, and go otherwise", () => {
    const q = { ...rebuildForModel(start, "question", program, null), questions: ["One", "Two"] }
    expect(rebuildForModel(q, "scored", program, null).questions).toEqual(["One", "Two"])
    expect(rebuildForModel(q, "binary", program, null).questions).toEqual([])
  })
  it("names what is cleared in the admin's words", () => {
    expect(modelChangeClears("demonstration", "binary")).toEqual(["Levels", "Levels that count", "Minimum at each level", "Checked-off students get"])
    expect(modelChangeClears("question", "scored")).toEqual(["Counts when", "Named questions"])
    expect(modelChangeClears("question", "binary")).toContain("Questions")
    expect(modelChangeClears("binary", "binary")).toEqual([])
  })
})

describe("what can be saved (map D1a States) [REQ SC-18]", () => {
  it("a form with no questions yet saves, and what makes one count waits for them", () => {
    expect(panelIssues(rebuildForModel(start, "question", program, null))).toEqual([])
    expect(panelIssues(rebuildForModel(start, "scored", program, null)).map((i) => i.field)).toEqual(["cfg-scale"])
  })
  it("what exists is still blocked", () => {
    expect(panelIssues(rebuildForModel(start, "binary", program, null)).map((i) => i.field)).toContain("cfg-label-0")
    const sub = { ...rebuildForModel(start, "question", program, null), questions: ["One"], questionRule: { kind: "subset" as const, indices: [] } }
    expect(panelIssues(sub).map((i) => i.field)).toContain("cfg-qrule-subset")
    expect(panelIssues({ ...start, settingMinimums: [{ setting: "Inpatient", min: 99 }] }).map((i) => i.field)).toContain("cfg-setting-min-0")
    expect(panelIssues({ ...start, need: 51 }).map((i) => i.field)).toContain("cfg-need")
  })
  it("a form with no model and no number has nothing to fix", () => {
    expect(panelIssues(emptyRule())).toEqual([])
  })
})

describe("saving from the panel", () => {
  it("Questions with none: Not configured, unusable, students who held it named, and back with questions", () => {
    const rule = rebuildForModel(start, "question", program, start)
    expect(settingsImpact(seed, bp, rule).length).toBeGreaterThan(0)
    const s = save(rule, true)
    const k = after(s)
    expect(configurationOf(s, k)).toBe("not-configured")
    expect(isConfigured(k)).toBe(false)
    expect(isUsable(s, k)).toBe(false)
    expect(skillReach(s, {} as never, "").find((r) => r.id === bp.id)?.configured).toBe(false)
    const withQ: LabRule = { ...panelRuleOf(k), questions: ["A", "B", "C"], questionRule: { kind: "all" } }
    const s2 = save(withQ, true, s)
    expect(configurationOf(s2, after(s2))).toBe("edited")
    expect(isUsable(s2, after(s2))).toBe(true)
  })
  it("Times needed saves on Not configured, without changing the word; a program save keeps the number", () => {
    const s = save(rebuildForModel(start, "question", program, start), true)
    const r = setTimesNeeded(s, bp.id, 7, opts)
    if (!r.ok) throw new Error(r.error)
    expect(panelRuleOf(after(r.state)).need).toBe(7)
    expect(configurationOf(r.state, after(r.state))).toBe("not-configured")
    expect(timesNeededImpact(r.state, bp.id, 9)).toEqual([])
  })
  it("Choosing Default from Not configured reads Default again", () => {
    const s = save(rebuildForModel(start, "question", program, start), true)
    const s2 = save(defaultDraftOf(panelRuleOf(after(s)), program), false, s)
    expect(configurationOf(s2, after(s2))).toBe("default")
    expect(isUsable(s2, after(s2))).toBe(true)
  })
  it("a program whose model needs questions: Use default reads Not configured, and it holds nobody up", () => {
    const q: LabRule = { ...program, model: "question", levels: [], questionRule: { kind: "all" }, carried: { ...program.carried, minLevelIndex: null } }
    const r = resolveRule(q, start)
    expect(r.questions).toEqual([])
    expect(draftConfiguration({ rule: r, baseEdited: true, baseRule: start, program: q, reset: true })).toBe("not-configured")
  })
  it("never writes evaluations [REQ RV-05]", () => {
    const s = save({ ...start, feedbackRequired: true, need: 9 }, true)
    expect(s.evaluations).toBe(seed.evaluations)
    expect(evalsOfSkill(s, bp.id).length).toBe(evalsOfSkill(seed, bp.id).length)
  })
})

describe("Inactive (D-L93, D0 rule 9)", () => {
  const off = () => {
    const r = setSkillsActive(seed, [bp.id], false, opts.byId, opts.at)
    if (!r.ok) throw new Error("deactivate")
    return r.state
  }
  it("Status and Configuration move apart; saves name nobody; Reactivate names them", () => {
    const s0 = off()
    expect(statusOf(after(s0))).toBe("inactive")
    expect(configurationOf(s0, after(s0))).toBe("default")
    const rule = { ...start, need: 9, feedbackRequired: true }
    expect(settingsImpact(s0, after(s0), rule)).toEqual([])
    expect(timesNeededImpact(s0, bp.id, 9)).toEqual([])
    const s = save(rule, true, s0)
    expect(statusOf(after(s))).toBe("inactive")
    expect(configurationOf(s, after(s))).toBe("edited")
    expect(reactivateImpact(s, after(s)).length).toBeGreaterThan(0)
  })
  it("Reactivate names nobody when nothing was edited while Inactive", () => {
    const s0 = off()
    expect(reactivateImpact(s0, after(s0))).toEqual([])
  })
  it("a program save counts Inactive skills like any other (map D3)", () => {
    const s0 = off()
    const plan = planProgramApply(s0, { ...program, feedbackRequired: true })
    expect(plan.change).toContain(bp.id)
  })
})

describe("filters (map D1)", () => {
  const rows = buildLibrary(seed)
  it("Configuration is one choice, Different number another", () => {
    const edited = filterLibrary(rows, { cat: null, tag: null, config: "edited" })
    expect(edited).toHaveLength(12)
    expect(planProgramApply(seed, { ...program, feedbackRequired: true }).edited.sort()).toEqual(edited.map((r) => r.id).sort())
    const different = filterLibrary(rows, { cat: null, tag: null, different: true })
    expect(different.some((r) => r.id === bp.id)).toBe(true)
    expect(different.every((r) => fromV2(seed.skills.find((k) => k.id === r.id)!).need !== program.need)).toBe(true)
  })
})
