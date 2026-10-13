import { describe, expect, it } from "vitest"
import {
  emptyModel,
  evaluateSkill,
  previewImpact,
  rebuildForModel,
  removeLevel,
  removeQuestion,
  renameBinaryLabel,
  renameLevel,
  renameQuestion,
  validateConfig,
} from "@/lib/engine"
import type { ConfiguredSkill, Evidence } from "@/lib/engine"
import { ROLE_MAP, bin, binary, configured, ev, ivEvidence, ivSkill, questionModel, yesNo } from "./fixtures"

function deepFreeze<T>(o: T): T {
  if (o && typeof o === "object" && !Object.isFrozen(o)) {
    Object.freeze(o)
    Object.values(o as Record<string, unknown>).forEach(deepFreeze)
  }
  return o
}

describe("ENG-3 editing a rule re-applies to held evidence and never rewrites responses (AE-02, AE-06)", () => {
  const held = (): Evidence[] => [ev(yesNo(true, true, false)), ev(yesNo(true, false, false)), ev(yesNo(true, true, true))]
  const crit = { requiredCount: 2, levelMinimums: {}, settingMinimums: {} }

  it("loosening the rule from all-Yes to at-least-2 changes which held evidence qualifies", () => {
    const e = deepFreeze(held())
    const strict = configured(questionModel(3, { kind: "all" }), { criteria: crit })
    const loose = configured(questionModel(3, { kind: "atLeast", n: 2 }), { criteria: crit })
    expect(evaluateSkill(strict, e).qualifyingCount).toBe(1)
    expect(evaluateSkill(loose, e).qualifyingCount).toBe(2)
    expect(evaluateSkill(strict, e).state).toBe("partial")
    expect(evaluateSkill(loose, e).state).toBe("achieved")
  })

  it("evaluation never mutates the stored evidence (frozen input does not throw, output equal)", () => {
    const e = held()
    const snapshot = JSON.parse(JSON.stringify(e))
    evaluateSkill(configured(questionModel(3, { kind: "all" }), { criteria: crit }), deepFreeze(e))
    expect(e).toEqual(snapshot)
  })

  it("AE-06 renaming a question, a level and a binary label changes no outcome", () => {
    const q = configured(questionModel(3, { kind: "subset", questionIds: ["q1", "q3"] }), { criteria: crit })
    const qRenamed = renameQuestion(renameQuestion(q, "q1", "Washes hands"), "q3", "Uses sterile field")
    const e = held()
    expect(evaluateSkill(qRenamed, e)).toEqual(evaluateSkill(q, e))

    const iv = ivSkill()
    const ivRenamed = renameLevel(iv, "assist", "Needed prompting")
    expect(evaluateSkill(ivRenamed, ivEvidence())).toEqual(evaluateSkill(iv, ivEvidence()))

    const b = configured(binary("a"), { criteria: crit })
    const bRenamed = renameBinaryLabel(b, "a", "Satisfactory")
    const be = [ev(bin("a")), ev(bin("b"))]
    expect(evaluateSkill(bRenamed, be)).toEqual(evaluateSkill(b, be))
  })

  it("renames only change presentation text", () => {
    const q = configured(questionModel(2, { kind: "all" }))
    const out = renameQuestion(q, "q2", "New text")
    expect(out.model.kind === "question" && out.model.questions[1]).toEqual({ id: "q2", text: "New text" })
    expect(out.model.kind === "question" && out.model.questions[0].text).toBe("Question 1")
  })
})

describe("ENG-4 removal cascades into rules, evidence retained (AE-07)", () => {
  it("removing a question referenced by a named subset removes it from the rule", () => {
    const s = configured(questionModel(3, { kind: "subset", questionIds: ["q1", "q2"] }))
    const { skill: out, removedFromRules } = removeQuestion(s, "q2")
    expect(removedFromRules).toBe(1)
    expect(out.model.kind === "question" && out.model.questions.map((q) => q.id)).toEqual(["q1", "q3"])
    expect(out.model.kind === "question" && out.model.rule).toEqual({ kind: "subset", questionIds: ["q1"] })
  })

  it("removing the last question of a subset leaves an empty subset, which the validator then blocks (SC-06)", () => {
    const s = configured(questionModel(2, { kind: "subset", questionIds: ["q1"] }), {
      criteria: { requiredCount: 1, levelMinimums: {}, settingMinimums: {} },
    })
    const { skill: out } = removeQuestion(s, "q1")
    const res = validateConfig(out, { roleEvidenceMap: ROLE_MAP })
    expect(res.issues.some((i) => i.code === "subsetEmpty")).toBe(true)
  })

  it("removing an unreferenced question reports 0 rules", () => {
    const s = configured(questionModel(3, { kind: "all" }))
    expect(removeQuestion(s, "q3").removedFromRules).toBe(0)
  })

  it("removing a level removes its minimum, reports 1 rule, and no rule points at the missing level", () => {
    const { skill: out, removedFromRules } = removeLevel(ivSkill(), "assist")
    expect(removedFromRules).toBe(1)
    expect(out.criteria.levelMinimums).toEqual({ obs: 1, ind: 3 })
    expect(out.model.kind === "demonstration" && out.model.levels.map((l) => l.id)).toEqual(["obs", "ind"])
  })

  it("evidence is retained and re-evaluated: tagged demonstrations stay counted toward the total only (docs/strategy/02 §6.4)", () => {
    const e = ivEvidence()
    const before = evaluateSkill(ivSkill(), e)
    const { skill: out } = removeLevel(ivSkill(), "assist")
    const after = evaluateSkill(out, e)
    expect(e).toHaveLength(7)
    expect(before.qualifyingCount).toBe(7)
    expect(after.qualifyingCount).toBe(7)
    expect(after.perLevel).toEqual({ obs: 2, ind: 4 })
  })

  it("the input skill is not mutated by a removal", () => {
    const s = deepFreeze(configured(questionModel(3, { kind: "subset", questionIds: ["q1", "q2"] })))
    expect(() => removeQuestion(s, "q1")).not.toThrow()
  })
})

describe("ENG-9 changing the model rebuilds criteria and leaves no contradictory settings (SC-09)", () => {
  it("demonstration -> binary drops levels, level minimums and the required count; reports what was dropped", () => {
    const { skill: out, dropped } = rebuildForModel(ivSkill(), "binary")
    expect(out.model).toEqual(emptyModel("binary"))
    expect(out.criteria).toEqual({ requiredCount: null, levelMinimums: {}, settingMinimums: {} })
    expect(dropped.map((d) => d.field).sort()).toEqual(["levelMinimums", "levels", "requiredCount"].sort())
  })

  it("setting minimums are dropped by default (ENG-9: empty state) and preserved on request (seam: docs 08 vs 09)", () => {
    const withSettings = configured(binary(), {
      criteria: { requiredCount: 2, levelMinimums: {}, settingMinimums: { inpatient: 1 } },
    })
    const dflt = rebuildForModel(withSettings, "question")
    expect(dflt.skill.criteria.settingMinimums).toEqual({})
    expect(dflt.dropped.some((d) => d.field === "settingMinimums")).toBe(true)

    const kept = rebuildForModel(withSettings, "question", { preserve: { requiredCount: true, settingMinimums: true } })
    expect(kept.skill.criteria).toEqual({ requiredCount: 2, levelMinimums: {}, settingMinimums: { inpatient: 1 } })
    expect(kept.dropped.some((d) => d.field === "settingMinimums")).toBe(false)
  })

  it("level minimums are never preserved into a non-demonstration model even when asked to preserve", () => {
    const { skill: out } = rebuildForModel(ivSkill(), "scored", { preserve: { requiredCount: true, settingMinimums: true } })
    expect(out.criteria.levelMinimums).toEqual({})
  })

  it("choosing the same model is a no-op with an empty report", () => {
    const s = ivSkill()
    const { skill: out, dropped } = rebuildForModel(s, "demonstration")
    expect(out).toEqual(s)
    expect(dropped).toEqual([])
  })

  it("the rebuilt skill is invalid until the program fills it in (nothing is defaulted)", () => {
    const { skill: out } = rebuildForModel(ivSkill(), "question")
    const res = validateConfig(out, { roleEvidenceMap: ROLE_MAP })
    expect(res.valid).toBe(false)
  })

  it("held evidence is untouched by a model change; evidence of the old kind simply does not qualify (seam: what happens to it is OPEN)", () => {
    const e = ivEvidence()
    const { skill: out } = rebuildForModel(ivSkill(), "binary")
    expect(e).toHaveLength(7)
    // empty binary has no qualifying label, nothing qualifies
    expect(evaluateSkill(out as ConfiguredSkill, e).qualifyingCount).toBe(0)
  })
})

describe("ENG-10 previewImpact is read-only and counts students per state (proposal [INFER], AE-02)", () => {
  const crit = { requiredCount: 1, levelMinimums: {}, settingMinimums: {} }
  const current = configured(questionModel(2, { kind: "atLeast", n: 1 }), { criteria: crit })
  const draft = configured(questionModel(2, { kind: "all" }), { criteria: crit })
  const evidence = [
    ev(yesNo(true, true), { studentId: "a" }), // achieved under both
    ev(yesNo(true, false), { studentId: "b" }), // achieved before, evidenceDoesNotQualify after
    ev(yesNo(false, false), { studentId: "c" }), // does not qualify under both
  ]

  it("returns before/after counts and how many records change state", () => {
    const p = previewImpact(current, draft, evidence)
    expect(p.before).toEqual({ noEvidence: 0, evidenceDoesNotQualify: 1, partial: 0, achieved: 2 })
    expect(p.after).toEqual({ noEvidence: 0, evidenceDoesNotQualify: 2, partial: 0, achieved: 1 })
    expect(p.changed).toBe(1)
  })

  it("is read-only: frozen inputs, same inputs give the same output", () => {
    const frozen = deepFreeze([...evidence])
    const a = previewImpact(deepFreeze(current), deepFreeze(draft), frozen)
    const b = previewImpact(current, draft, frozen)
    expect(a).toEqual(b)
  })

  it("students listed in studentIds with no evidence count as 'no evidence yet'", () => {
    const p = previewImpact(current, draft, evidence, { studentIds: ["a", "b", "c", "z"] })
    expect(p.before.noEvidence).toBe(1)
    expect(p.after.noEvidence).toBe(1)
  })
})
