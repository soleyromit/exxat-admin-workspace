import { describe, expect, it } from "vitest"
import { validateConfig } from "@/lib/engine"
import type { Criteria, SkillConfig } from "@/lib/engine"
import { ROLE_MAP, binary, configured, demoModel, levels, questionModel, scoredModel, skill } from "./fixtures"

const ctx = { roleEvidenceMap: ROLE_MAP }
const crit = (over: Partial<Criteria> = {}): Criteria => ({ requiredCount: 3, levelMinimums: {}, settingMinimums: {}, ...over })
const codes = (s: SkillConfig, c = ctx) => validateConfig(s, c).issues.filter((i) => i.severity === "error").map((i) => i.code)

describe("ENG-8 validators reject unsatisfiable or incomplete configurations (SC-03, SC-05, SC-06, SC-18)", () => {
  it("SC-02 a skill with no model is not valid (no default model)", () => {
    expect(codes(skill(null))).toContain("noModel")
  })

  it("valid baselines save", () => {
    expect(validateConfig(configured(binary(), { criteria: crit() }), ctx).valid).toBe(true)
    expect(validateConfig(configured(questionModel(3, { kind: "atLeast", n: 2 }), { criteria: crit() }), ctx).valid).toBe(true)
    expect(validateConfig(configured(scoredModel(2, { kind: "average", min: 3 }), { criteria: crit() }), ctx).valid).toBe(true)
    expect(
      validateConfig(configured(demoModel(), { criteria: crit({ requiredCount: 5, levelMinimums: { obs: 1, assist: 1, ind: 3 } }) }), ctx).valid,
    ).toBe(true)
  })

  describe("SC-03 binary labels", () => {
    it.each([
      ["equal labels", { a: "Met", b: "Met" }, "binaryLabelsEqual"],
      ["equal after trim and case", { a: "Pass", b: " pass " }, "binaryLabelsEqual"],
      ["empty label", { a: "", b: "Unmet" }, "binaryLabelEmpty"],
    ])("%s", (_n, labels, code) => {
      const m = binary()
      if (m.kind !== "binary") throw new Error("fixture")
      m.labels.a.label = labels.a
      m.labels.b.label = labels.b
      expect(codes(configured(m, { criteria: crit() }))).toContain(code)
    })
    it("the qualifying label must be chosen explicitly", () => {
      const m = binary()
      if (m.kind !== "binary") throw new Error("fixture")
      m.qualifyingLabelId = null
      expect(codes(configured(m, { criteria: crit() }))).toContain("binaryQualifyingMissing")
    })
  })

  describe("SC-04..06 questions", () => {
    it("0 questions is rejected", () => {
      expect(codes(configured(questionModel(0, { kind: "all" }), { criteria: crit() }))).toContain("questionsEmpty")
    })
    it("unlabelled question is rejected", () => {
      const m = questionModel(2, { kind: "all" })
      if (m.kind !== "question") throw new Error("fixture")
      m.questions[1].text = "  "
      expect(codes(configured(m, { criteria: crit() }))).toContain("questionTextEmpty")
    })
    it("duplicate question text is rejected (case-insensitive)", () => {
      const m = questionModel(2, { kind: "all" })
      if (m.kind !== "question") throw new Error("fixture")
      m.questions[0].text = "Washes hands"
      m.questions[1].text = "washes HANDS"
      expect(codes(configured(m, { criteria: crit() }))).toContain("questionTextDuplicate")
    })
    it.each([
      ["N = 0", 0],
      ["N > M", 4],
      ["N not an integer", 1.5],
    ])("at-least rule %s is rejected", (_n, n) => {
      expect(codes(configured(questionModel(3, { kind: "atLeast", n }), { criteria: crit() }))).toContain("atLeastInvalid")
    })
    it("empty named subset is rejected; subset naming an unknown question is rejected", () => {
      expect(codes(configured(questionModel(3, { kind: "subset", questionIds: [] }), { criteria: crit() }))).toContain("subsetEmpty")
      expect(codes(configured(questionModel(3, { kind: "subset", questionIds: ["q9"] }), { criteria: crit() }))).toContain("subsetUnknownQuestion")
    })
    it("a large question set (200) with a subset of 120 validates", () => {
      const ids = Array.from({ length: 120 }, (_, i) => `q${i + 1}`)
      expect(validateConfig(configured(questionModel(200, { kind: "subset", questionIds: ids }), { criteria: crit() }), ctx).valid).toBe(true)
    })
  })

  describe("SC-07 scored scale and rule", () => {
    it.each([
      ["scale min >= max", { min: 5, max: 5, step: 1 }],
      ["scale step 0", { min: 1, max: 5, step: 0 }],
      ["scale not finite", { min: 1, max: Number.POSITIVE_INFINITY, step: 1 }],
    ])("%s", (_n, scale) => {
      expect(codes(configured(scoredModel(2, { kind: "average", min: 3 }, scale), { criteria: crit() }))).toContain("scaleInvalid")
    })
    it("a rule threshold outside the scale is rejected", () => {
      expect(codes(configured(scoredModel(2, { kind: "average", min: 9 }), { criteria: crit() }))).toContain("scoredThresholdOutOfScale")
      expect(codes(configured(scoredModel(2, { kind: "total", min: 11 }), { criteria: crit() }))).toContain("scoredThresholdOutOfScale")
      expect(validateConfig(configured(scoredModel(2, { kind: "total", min: 10 }), { criteria: crit() }), ctx).valid).toBe(true)
    })
  })

  describe("SC-08 levels", () => {
    it("0 levels, unlabelled and duplicate levels are rejected", () => {
      expect(codes(configured({ kind: "demonstration", levels: [] }, { criteria: crit() }))).toContain("levelsEmpty")
      const dup = { kind: "demonstration" as const, levels: [levels[0], { id: "x", label: "observed" }] }
      expect(codes(configured(dup, { criteria: crit() }))).toContain("levelLabelDuplicate")
      const blank = { kind: "demonstration" as const, levels: [{ id: "x", label: "" }, levels[1]] }
      expect(codes(configured(blank, { criteria: crit() }))).toContain("levelLabelEmpty")
    })
    it("more than three levels is allowed (no fixed three-point scale)", () => {
      const five = { kind: "demonstration" as const, levels: [1, 2, 3, 4, 5].map((n) => ({ id: `l${n}`, label: `Level ${n}` })) }
      expect(validateConfig(configured(five, { criteria: crit() }), ctx).valid).toBe(true)
    })
  })

  describe("SC-10, SC-18 minimums versus totals", () => {
    it("required count must be a positive integer", () => {
      expect(codes(configured(binary(), { criteria: crit({ requiredCount: 0 }) }))).toContain("requiredCountInvalid")
      expect(codes(configured(binary(), { criteria: crit({ requiredCount: null }) }))).toContain("requiredCountInvalid")
    })
    it("T9: level minimums summing above the total are blocked; at the total they save", () => {
      const over = configured(demoModel(), { criteria: crit({ requiredCount: 5, levelMinimums: { obs: 2, assist: 2, ind: 2 } }) })
      expect(codes(over)).toContain("levelMinimumsExceedTotal")
      const ok = configured(demoModel(), { criteria: crit({ requiredCount: 5, levelMinimums: { obs: 1, assist: 1, ind: 3 } }) })
      expect(codes(ok)).not.toContain("levelMinimumsExceedTotal")
    })
    it("level minimums on a non-demonstration model, and for unknown levels, are rejected", () => {
      expect(codes(configured(binary(), { criteria: crit({ levelMinimums: { obs: 1 } }) }))).toContain("levelMinimumsOnNonDemonstration")
      expect(codes(configured(demoModel(), { criteria: crit({ levelMinimums: { ghost: 1 } }) }))).toContain("levelMinimumUnknownLevel")
    })
    it("a setting minimum above the total is rejected (SC-11)", () => {
      expect(codes(configured(binary(), { criteria: crit({ requiredCount: 2, settingMinimums: { inpatient: 3 } }) }))).toContain(
        "settingMinimumExceedsTotal",
      )
    })
    it("setting minimums must be positive integers", () => {
      expect(codes(configured(binary(), { criteria: crit({ settingMinimums: { inpatient: 0 } }) }))).toContain("settingMinimumInvalid")
    })
    it("setting minimums summing above the total is a WARNING, not a blocker [INFER: still satisfiable by collecting more evidence]", () => {
      const s = configured(binary(), { criteria: crit({ requiredCount: 3, settingMinimums: { inpatient: 2, emergency: 2 } }) })
      const r = validateConfig(s, ctx)
      expect(r.valid).toBe(true)
      expect(r.issues.some((i) => i.code === "settingMinimumsSumExceedTotal" && i.severity === "warning")).toBe(true)
    })
  })

  it("SC-16 a skill must keep at least one allowed evaluator role", () => {
    expect(codes(configured(binary(), { criteria: crit(), allowedRoles: [] }))).toContain("noAllowedRoles")
  })
})

describe("ENG-11 / BL-1 clinical-setting minimum needs an allowed role valid for clinical evidence (SC-11, SC-12, SC-16, SC-18)", () => {
  const withEmergency = crit({ requiredCount: 2, settingMinimums: { emergency: 1 } })

  it("T25: lab-instructor-only roles with a clinical minimum is blocked and names the roles that can sign off clinical evidence", () => {
    const s = configured(binary(), { criteria: withEmergency, allowedRoles: ["labInstructor"] })
    const r = validateConfig(s, ctx)
    expect(r.valid).toBe(false)
    const issue = r.issues.find((i) => i.code === "clinicalMinimumNoClinicalRole")
    expect(issue).toBeDefined()
    expect(issue?.clinicalRoles?.sort()).toEqual(["faculty", "preceptor"])
  })

  it("T26: adding Preceptor lets it save", () => {
    const s = configured(binary(), { criteria: withEmergency, allowedRoles: ["labInstructor", "preceptor"] })
    expect(validateConfig(s, ctx).valid).toBe(true)
  })

  it("lab-only roles are fine when there is no clinical-setting minimum", () => {
    expect(validateConfig(configured(binary(), { criteria: crit(), allowedRoles: ["labInstructor"] }), ctx).valid).toBe(true)
  })

  it("OD-25 stays DATA: a different map changes the verdict, the engine hardcodes no role", () => {
    const s = configured(binary(), { criteria: withEmergency, allowedRoles: ["labInstructor"] })
    const custom = { roleEvidenceMap: { ...ROLE_MAP, labInstructor: { clinical: true, lab: true } } }
    expect(validateConfig(s, custom).valid).toBe(true)
    const none = { roleEvidenceMap: {} }
    expect(codes(configured(binary(), { criteria: withEmergency, allowedRoles: ["preceptor"] }), none)).toContain("clinicalMinimumNoClinicalRole")
  })

  it("an allowed role missing from the map counts as not valid for clinical evidence", () => {
    const s = configured(binary(), { criteria: withEmergency, allowedRoles: ["mystery"] })
    expect(codes(s)).toContain("clinicalMinimumNoClinicalRole")
  })
})
