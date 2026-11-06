import { describe, expect, it } from "vitest"
import { configDraftOf, emptyRule, fromV2, validateRule, type LabRule } from "@/lib/lab/configure"
import { applyEdits, blankRule, configurableIds, configurableSkills, issueField, mergeRules, needsImpactStep, ownRule, parseSkillIds, planMany, saveMany, touchedFields } from "@/lib/lab/configure-many"
import { configureManyLabel } from "@/components/lab/library/configure-many"
import { isConfigured } from "@/lib/v2/population"
import { evalsOfSkill } from "@/lib/v2/evidence-index"
import { createGeneratedSeed as createSeed } from "@/lib/v2/seed"
import type { Skill, V2State } from "@/lib/v2/types"

/** The rule read back after a save; a non-binary rule's qualifying label has no meaning and is stored as null. */
const noLabel = (r: LabRule) => ({ ...r, qualifyingLabel: r.model === "binary" ? r.qualifyingLabel : null })
const OPTS = { at: "2026-11-04T10:00:00Z", byId: "admin", mode: null }
const STATE: V2State = createSeed()
const configured = STATE.skills.filter((k) => k.active !== false && isConfigured(k))
const withEvidence = configured.filter((k) => evalsOfSkill(STATE, k.id).length > 0)
const noEvidence = configured.filter((k) => evalsOfSkill(STATE, k.id).length === 0)
const fresh = STATE.skills.filter((k) => k.active !== false && !isConfigured(k))

/** Three configured skills whose "need" differs, in a state of their own. */
function threeDiffering(): { state: V2State; skills: Skill[] } {
  const ids = configured.slice(0, 3).map((k) => k.id)
  const skills = STATE.skills.map((k) => {
    const i = ids.indexOf(k.id)
    if (i < 0 || !k.config) return k
    return { ...k, config: { ...k.config, feedbackRequired: i === 0, achievement: { ...k.config.achievement, need: i + 2 } } }
  })
  const state = { ...STATE, skills }
  return { state, skills: configurableSkills(state, ids) }
}

describe("the selection bar", () => {
  it("counts selected skills that are not inactive, configured or not", () => {
    const n = configurableIds([{ id: "a", status: "configured" }, { id: "b", status: "not-configured" }, { id: "c", status: "inactive" }])
    expect(n).toEqual(["a", "b"])
    expect(configureManyLabel(n.length)).toBe("Configure 2 skills")
    expect(configureManyLabel(1)).toBe("Configure 1 skill")
    expect(configureManyLabel(0)).toBe("Configure 0 skills")
  })

  it("reads the URL: no repeats, no inactive or unknown skill", () => {
    expect(parseSkillIds(" a,b,,a ")).toEqual(["a", "b"])
    const inactive = { ...STATE, skills: STATE.skills.map((k, i) => (i === 0 ? { ...k, active: false } : k)) }
    expect(configurableSkills(inactive, [inactive.skills[0]!.id, inactive.skills[1]!.id, "nope"]).map((k) => k.id)).toEqual([inactive.skills[1]!.id])
  })
})

describe("Mixed fields", () => {
  const rule = (over: Partial<LabRule>): LabRule => ({ ...fromV2(configured[0]!), ...over })

  it("shows identical values as they are and blanks what differs, carrying nothing from one skill", () => {
    const { base, mixed } = mergeRules([rule({ need: 2, feedbackRequired: true }), rule({ need: 3, feedbackRequired: false })])
    expect([...mixed].sort()).toEqual(["feedbackRequired", "need"])
    expect(base.need).toBeNaN()
    expect(base.feedbackRequired).toBe(false)
    expect(base.model).toBe(configured[0]!.model)
  })

  it("does not call a value Mixed that the rule's model does not use", () => {
    const { mixed } = mergeRules([rule({ model: "demonstration", levels: ["A", "B"], outcomeLabels: ["Met", "Unmet"], qualifyingLabel: 0 }), rule({ model: "demonstration", levels: ["A", "B"], outcomeLabels: ["Pass", "Fail"], qualifyingLabel: null })])
    expect(mixed.has("criteria")).toBe(false)
  })

  it("preselects no model when the skills differ or none has one [SC-02]", () => {
    expect(mergeRules([rule({ model: "binary" }), rule({ model: "scored" })]).base.model).toBeNull()
    expect(mergeRules([rule({}), emptyRule()]).base.model).toBeNull()
    expect(mergeRules([emptyRule(), emptyRule()]).base.model).toBeNull()
  })

  it("stays unchanged unless touched", () => {
    const merged = mergeRules([rule({ need: 2, feedbackRequired: true }), rule({ need: 3, feedbackRequired: false })])
    expect(touchedFields(merged.base, merged, new Set()).size).toBe(0)
    const edited = { ...merged.base, need: 5 }
    const touched = touchedFields(edited, merged, new Set())
    expect([...touched]).toEqual(["need"])
    const own = rule({ need: 3, feedbackRequired: true, approvalRequired: true })
    expect(applyEdits(own, edited, touched)).toEqual({ ...own, need: 5 })
  })

  it("treats a cleared Mixed number as untouched, and a Yes or No answer as touched only once given", () => {
    const merged = mergeRules([rule({ need: 2, feedbackRequired: true }), rule({ need: 3, feedbackRequired: false })])
    expect(touchedFields({ ...merged.base, need: Number.NaN }, merged, new Set()).has("need")).toBe(false)
    expect(touchedFields(merged.base, merged, new Set(["feedbackRequired"])).has("feedbackRequired")).toBe(true)
  })

  it("choosing a model writes its criteria and keeps each skill's setting minimums", () => {
    const merged = mergeRules([rule({ model: "binary" }), rule({ model: "scored" })])
    const edited = { ...merged.base, model: "binary" as const, qualifyingLabel: 0 as const }
    const touched = touchedFields(edited, merged, new Set())
    expect(touched.has("criteria")).toBe(true)
    const own = rule({ model: "scored", settingMinimums: [{ setting: "Inpatient", min: 1 }], levelMinimums: [{ levelIndex: 0, min: 1 }] })
    const next = applyEdits(own, edited, touched)
    expect(next.settingMinimums).toEqual(own.settingMinimums)
    expect(next.levelMinimums).toEqual([])
  })

  it("names only the field an issue belongs to", () => {
    expect(issueField({ field: "cfg-need" })).toBe("need")
    expect(issueField({ field: "cfg-setting-min-0" })).toBe("conditions")
    expect(issueField({ field: "cfg-role-preceptor" })).toBe("evaluatorRoles")
    expect(issueField({ field: "cfg-label-0" })).toBe("criteria")
    expect(validateRule(blankRule())[0]!.field).toBe("cfg-model")
  })
})

describe("saving several", () => {
  it("writes only the touched field, on only the selected skills, and keeps everything else", () => {
    const { state, skills } = threeDiffering()
    const merged = mergeRules(skills.map((k) => ownRule(state, k)))
    expect(merged.mixed.has("need")).toBe(true)
    const edited = { ...merged.base, need: 7 }
    const rows = planMany(state, skills, edited, touchedFields(edited, merged, new Set()))
    const saved = saveMany(state, rows, OPTS)
    expect(saved.configured).toEqual(skills.map((k) => k.id))
    for (const k of skills) {
      const after = fromV2(saved.state.skills.find((x) => x.id === k.id)!)
      expect(noLabel(after)).toEqual(noLabel({ ...fromV2(k), need: 7 }))
    }
    const selected = new Set(skills.map((k) => k.id))
    for (const k of state.skills) if (!selected.has(k.id)) expect(saved.state.skills.find((x) => x.id === k.id)).toEqual(k)
  })

  it("never changes a completed evaluation", () => {
    const { state, skills } = threeDiffering()
    const merged = mergeRules(skills.map((k) => ownRule(state, k)))
    const edited = { ...merged.base, need: 9 }
    const saved = saveMany(state, planMany(state, skills, edited, touchedFields(edited, merged, new Set())), OPTS)
    expect(saved.state.evaluations).toBe(state.evaluations)
  })

  it("leaves a not configured skill not configured until it is complete, with the edit kept as a draft", () => {
    const skills = [configured[0]!, fresh[0]!]
    const merged = mergeRules(skills.map((k) => ownRule(STATE, k)))
    const edited = { ...merged.base, need: 8 }
    const rows = planMany(STATE, skills, edited, touchedFields(edited, merged, new Set()))
    expect(rows.map((r) => r.outcome)).toEqual(["save", "draft"])
    const saved = saveMany(STATE, rows, OPTS)
    expect(saved.configured).toEqual([configured[0]!.id])
    expect(saved.kept).toEqual([fresh[0]!.id])
    expect(isConfigured(saved.state.skills.find((k) => k.id === fresh[0]!.id)!)).toBe(false)
    expect(configDraftOf(saved.state, fresh[0]!.id)?.rule.need).toBe(8)
  })

  it("blocks a change that would make a live rule impossible, and writes nothing for it", () => {
    const k = configured[0]!
    const withMin = { ...STATE, skills: STATE.skills.map((x) => (x.id === k.id && x.config ? { ...x, config: { ...x.config, achievement: { ...x.config.achievement, need: 3, settingMinimums: [{ setting: "Inpatient", min: 3 }] } } } : x)) }
    const skills = configurableSkills(withMin, [k.id, configured[1]!.id])
    const edited = { ...mergeRules(skills.map((s) => ownRule(withMin, s))).base, need: 1 }
    const rows = planMany(withMin, skills, edited, new Set(["need"]))
    expect(rows[0]!.outcome).toBe("blocked")
    expect(saveMany(withMin, rows, OPTS).state.skills.find((x) => x.id === k.id)).toEqual(withMin.skills.find((x) => x.id === k.id))
  })

  it("shows the impact first only when a rule being written has evaluations", () => {
    const pick = (ks: Skill[]) => {
      const merged = mergeRules(ks.map((k) => ownRule(STATE, k)))
      const edited = { ...merged.base, need: 11 }
      return planMany(STATE, ks, edited, new Set(["need"]))
    }
    expect(withEvidence.length).toBeGreaterThan(0)
    expect(needsImpactStep(pick([withEvidence[0]!]))).toBe(true)
    if (noEvidence.length) expect(needsImpactStep(pick([noEvidence[0]!]))).toBe(false)
    expect(needsImpactStep(pick([fresh[0]!]))).toBe(false)
  })

})
