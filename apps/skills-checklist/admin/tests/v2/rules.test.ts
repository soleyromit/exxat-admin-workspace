import { describe, expect, it } from "vitest"
import { defaultConfig, rebuildForModel } from "@/lib/v2/config"
import { createSeed, IDS } from "@/lib/v2/seed"
import { qualifiedEvaluators, simulationShare, strengthHint, validateDraft, WIZARD_STEPS } from "@/lib/v2/rules"
import type { SkillConfig, V2State } from "@/lib/v2/types"

const seed = (): V2State => createSeed()
const iv = (s: V2State) => s.skills.find((k) => k.id === IDS.ivCath)!
const draftOf = (s: V2State) => ({ model: iv(s).model, config: structuredClone(iv(s).config!) as SkillConfig })
const codes = (d: ReturnType<typeof draftOf>, s: V2State) => validateDraft(d, s, IDS.ivCath).map((i) => i.id)

describe("validateDraft (SC-18)", () => {
  it("accepts the seeded IV catheter configuration", () => {
    const s = seed()
    expect(validateDraft(draftOf(s), s, IDS.ivCath)).toEqual([])
  })

  it("requires a model (SC-02)", () => {
    const s = seed()
    const d = { ...draftOf(s), model: null }
    expect(codes(d, s)).toContain("wiz-model:missing")
  })

  it("rejects blank and duplicate levels and links the issue to the level field", () => {
    const s = seed()
    const d = draftOf(s)
    d.config.levels = ["Needs coaching", "", "needs coaching"]
    const issues = validateDraft(d, s, IDS.ivCath)
    expect(issues.find((i) => i.field === "wiz-level-1")?.message).toMatch(/no name/)
    expect(issues.find((i) => i.field === "wiz-level-2")?.message).toMatch(/repeats/)
    expect(issues.every((i) => i.step >= 1 && i.step <= 6)).toBe(true)
  })

  it("needs two levels, and a minimum level that still exists", () => {
    const s = seed()
    const d = draftOf(s)
    d.config.levels = ["Only"]
    expect(codes(d, s)).toEqual(expect.arrayContaining(["wiz-add-level:few", "wiz-minlevel:range"]))
  })

  it("binary labels must both exist and differ (SC-03)", () => {
    const s = seed()
    const d = { model: "binary" as const, config: defaultConfig("binary") }
    expect(validateDraft(d, s, "x")).toEqual([])
    d.config.outcomeLabels = ["Met", " met "]
    expect(codes(d, s)).toContain("wiz-label-b:same")
    d.config.outcomeLabels = ["", "Not met"]
    expect(codes(d, s)).toContain("wiz-label-a:blank")
  })

  it("question model needs at least one distinct, non-blank question (SC-04, SC-18)", () => {
    const s = seed()
    const d = { model: "question" as const, config: defaultConfig("question") }
    expect(codes(d, s)).toContain("wiz-add-question:none")
    d.config.questions = ["Washed hands", "washed hands", ""]
    const c = codes(d, s)
    expect(c).toEqual(expect.arrayContaining(["wiz-question-0:dup", "wiz-question-1:dup", "wiz-question-2:blank"]))
  })

  it("last-N window cannot be smaller than the evaluations needed", () => {
    const s = seed()
    const d = draftOf(s)
    d.config.achievement.window = 3
    expect(codes(d, s)).toContain("wiz-window:small")
  })

  it("distinct evaluators cannot exceed the evaluations needed", () => {
    const s = seed()
    const d = draftOf(s)
    d.config.achievement.distinctEvaluators = 6
    expect(codes(d, s)).toContain("wiz-distinct:gt")
  })

  it("setting minimums cannot add up to more than the total needed (SC-18, SC-11)", () => {
    const s = seed()
    const d = draftOf(s)
    d.config.achievement.settingMinimums = [
      { setting: "Inpatient", min: 3 },
      { setting: "Outpatient", min: 2 },
    ]
    expect(codes(d, s)).toContain("wiz-settings:sum")
  })

  it("a lab-instructor-only skill cannot also require clinical settings (SC-12)", () => {
    const s = seed()
    const d = draftOf(s)
    d.config.evaluatorRoles = ["lab-instructor"]
    expect(codes(d, s)).toContain("wiz-roles:labonly")
  })

  it("an allow list needs at least one entry, and a cap must be 0 to 100", () => {
    const s = seed()
    const d = draftOf(s)
    d.config.simulation = { allowed: true, mode: "allow-list", maxSharePercent: 25, allowList: [] }
    expect(codes(d, s)).toContain("wiz-sim-list:none")
    d.config.simulation = { allowed: true, mode: "cap", maxSharePercent: 140, allowList: [] }
    expect(codes(d, s)).toContain("wiz-sim-cap:range")
    d.config.simulation = { allowed: false, mode: "cap", maxSharePercent: 140, allowList: [] }
    expect(codes(d, s)).not.toContain("wiz-sim-cap:range")
  })

  it("a prerequisite skill that is not in use can never be met", () => {
    const s = seed()
    const d = draftOf(s)
    d.config.prerequisites.skillIds = ["sk-central-line"]
    expect(validateDraft(d, s, IDS.ivCath)[0].message).toMatch(/not in use yet/)
  })

  it("flags a qualification nobody on record meets", () => {
    const s = seed()
    const d = draftOf(s)
    d.config.qualification = { credentials: ["RN"], minYears: 30, training: [] }
    expect(codes(d, s)).toContain("wiz-qualified:none")
  })

  it("has no calendar expiry, re-validation or auto-remediation settings (REQ section 14)", () => {
    const c = defaultConfig() as unknown as Record<string, unknown>
    expect(c).not.toHaveProperty("revalidation")
    expect(c.failure).not.toHaveProperty("autoRemediation")
    expect(WIZARD_STEPS.map((x) => x.id)).toEqual(["model", "achievement", "simulation", "prerequisites", "evaluators", "failure", "review"])
  })

  it("retake score cap only applies to the scored model", () => {
    const s = seed()
    const d = { model: "scored" as const, config: defaultConfig("scored") }
    d.config.questions = ["One"]
    d.config.failure.retakeScoreCap = 150
    expect(codes(d, s)).toContain("wiz-cap:range")
    const r = rebuildForModel(d.config, "binary")
    expect(r.failure.retakeScoreCap).toBeNull()
  })
})

describe("rebuildForModel (SC-09)", () => {
  it("drops model-specific settings the new model cannot produce", () => {
    const c = defaultConfig("question")
    c.questions = ["A"]
    c.achievement.minLevelIndex = 1
    const r = rebuildForModel(c, "binary")
    expect(r.questions).toEqual([])
    expect(r.achievement.minLevelIndex).toBeNull()
    expect(rebuildForModel(c, "demonstration").achievement.minLevelIndex).toBe(1)
  })
})

describe("strengthHint", () => {
  it("describes 4 of the last 5 in plain words and rates it", () => {
    const s = seed()
    const h = strengthHint("demonstration", iv(s).config!)
    expect(h.sentence).toBe("A student needs 4 successful evaluations out of their last 5, from at least 2 different evaluators, at works alone or above, including 2 in inpatient.")
    expect(h.strength).toBe("strong")
  })

  it("updates as the rule changes", () => {
    const c: SkillConfig = defaultConfig("binary")
    c.achievement = { kind: "count", need: 1, minLevelIndex: null, distinctEvaluators: 1, settingMinimums: [] }
    const light = strengthHint("binary", c)
    expect(light.strength).toBe("light")
    expect(light.sentence).toBe("A student needs 1 successful evaluation, from any single evaluator.")
    c.achievement.need = 3
    c.achievement.distinctEvaluators = 2
    expect(strengthHint("binary", c).strength).toBe("moderate")
  })

  it("ignores a level minimum when the model has no levels", () => {
    const c = defaultConfig("binary")
    c.achievement.minLevelIndex = 2
    expect(strengthHint("binary", c).sentence).not.toMatch(/Works alone/)
  })
})

describe("simulationShare", () => {
  it("shows the count a cap allows and what must be real practice", () => {
    const c = defaultConfig("binary")
    c.achievement.need = 4
    c.simulation = { allowed: true, mode: "cap", maxSharePercent: 25, allowList: [] }
    const r = simulationShare(c)
    expect(r.maxCount).toBe(1)
    expect(r.minReal).toBe(3)
    expect(r.text).toMatch(/up to 1 of the 4 required evaluations \(25 percent\)/)
  })

  it("handles no simulation and an allow list", () => {
    const c = defaultConfig("binary")
    c.simulation = { allowed: false, mode: "cap", maxSharePercent: 25, allowList: [] }
    expect(simulationShare(c).maxCount).toBe(0)
    c.simulation = { allowed: true, mode: "allow-list", maxSharePercent: 25, allowList: ["Simulation lab"] }
    expect(simulationShare(c).text).toMatch(/Simulation lab/)
  })
})

describe("qualifiedEvaluators", () => {
  it("filters by role, credential, years and training", () => {
    const s = seed()
    const c = iv(s).config!
    const names = qualifiedEvaluators(s, c).map((p) => p.name)
    expect(names).toEqual(expect.arrayContaining(["J. Delgado, RN", "M. Castillo, RN"]))
    expect(names).not.toContain("S. Okonkwo, RN")
    expect(names).not.toContain("T. Aldridge, LPN")
    expect(names).not.toContain("R. Whitmore")
  })
})
