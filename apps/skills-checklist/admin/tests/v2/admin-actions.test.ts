import { describe, expect, it } from "vitest"
import { chooseModel, copyConfigFrom, copyStarterSkills, createImportedSkills, draftFor, publishSkill, saveStep, setDraft, setMapping, updateSkillMeta } from "@/lib/v2/admin-actions"
import { COUNTER_BY_ID } from "@/lib/v2/selectors"
import { createSeed, IDS } from "@/lib/v2/seed"
import { STARTER_BY_SPECIALTY } from "@/lib/v2/starter-libraries"
import type { V2State } from "@/lib/v2/types"

const A = IDS.ross
const AT = "2026-10-19T10:00:00.000Z"
const must = <T extends { ok: boolean }>(r: T): Extract<T, { ok: true }> => {
  if (!r.ok) throw new Error(JSON.stringify(r))
  return r as Extract<T, { ok: true }>
}
const unconfigured = (s: V2State) => COUNTER_BY_ID.unconfigured.value(s)

describe("copying a starter library", () => {
  it("adds only the chosen skills, unconfigured, in one batch, with an audit entry (IM-09, IM-11)", () => {
    const s = createSeed()
    const before = s.skills.length
    const r = must(copyStarterSkills(s, "radiography", [0, 1, 3], A, AT))
    expect(r.created).toBe(3)
    expect(r.state.skills).toHaveLength(before + 3)
    const added = r.state.skills.slice(before)
    expect(added.map((k) => k.name)).toEqual(["Lower extremity positioning", "Abdomen radiograph positioning", "Radiation dose documentation"])
    expect(added.every((k) => k.model === null && !k.configured && !k.published && k.config === null && k.batchId === r.batchId && k.specialty === "radiography")).toBe(true)
    expect(r.state.batches).toHaveLength(1)
    expect(r.state.batches[0].skillIds).toEqual(added.map((k) => k.id))
    expect(unconfigured(r.state)).toBe(unconfigured(s) + 3)
    expect(r.state.audit).toHaveLength(s.audit.length + 1)
    expect(s.skills).toHaveLength(before)
  })

  it("is repeatable and keeps imports apart (IM-11)", () => {
    const one = must(copyStarterSkills(createSeed(), "paramedic", [0], A, AT))
    const two = must(copyStarterSkills(one.state, "paramedic", [1], A, AT))
    expect(two.state.batches.map((b) => b.id)).toEqual(["bt-1", "bt-2"])
    expect(new Set(two.state.skills.map((k) => k.id)).size).toBe(two.state.skills.length)
  })

  it("refuses an empty selection with a reason", () => {
    const r = copyStarterSkills(createSeed(), "paramedic", [], A, AT)
    expect(r.ok).toBe(false)
  })

  it("every starter library has skills and unique names", () => {
    for (const l of Object.values(STARTER_BY_SPECIALTY)) {
      expect(l.skills.length).toBeGreaterThan(4)
      expect(new Set(l.skills.map((k) => k.name)).size).toBe(l.skills.length)
    }
  })
})

describe("creating imported skills (IM-05, IM-13)", () => {
  it("creates nothing until called, then creates unconfigured skills with a batch", () => {
    const s = createSeed()
    const r = must(createImportedSkills(s, [{ name: " Fall risk bundle ", category: "Safety", description: "" }, { name: "Telemetry lead placement", category: "", description: "Place leads" }], "checklist.pdf", A, AT))
    expect(r.created).toBe(2)
    const [a, b] = r.state.skills.slice(-2)
    expect(a).toMatchObject({ name: "Fall risk bundle", category: "Safety", model: null, configured: false, published: false })
    expect(b.category).toBe("No category")
    expect(b.description).toBe("Place leads")
    expect(r.state.batches[0].label).toBe("Import from checklist.pdf")
    expect(s.skills).toHaveLength(31)
  })

  it("refuses an empty list and duplicate names inside the list", () => {
    expect(createImportedSkills(createSeed(), [], "x", A, AT).ok).toBe(false)
    const dup = createImportedSkills(createSeed(), [{ name: "A skill", category: "", description: "" }, { name: "a  skill", category: "", description: "" }], "x", A, AT)
    expect(dup.ok).toBe(false)
  })
})

describe("updateSkillMeta (editable after copy)", () => {
  it("renames, audits, and refuses a clash or a blank name", () => {
    const s = createSeed()
    const ok = must(updateSkillMeta(s, IDS.ivCath, { name: "IV catheter insertion, peripheral", category: "Vascular access", description: "Place a peripheral IV" }, A, AT))
    expect(ok.state.skills.find((k) => k.id === IDS.ivCath)?.name).toBe("IV catheter insertion, peripheral")
    expect(ok.state.audit[0].action).toBe("Edited skill")
    expect(updateSkillMeta(s, IDS.ivCath, { name: "sterile dressing change", category: "", description: "" }, A, AT).ok).toBe(false)
    expect(updateSkillMeta(s, IDS.ivCath, { name: "  ", category: "", description: "" }, A, AT).ok).toBe(false)
  })
})

describe("drafts", () => {
  it("pre-selects binary for a skill with no model and does not write on read", () => {
    const s = createSeed()
    const d = draftFor(s, "sk-pressure-injury")
    expect(d.model).toBe("binary")
    expect(s.drafts).toEqual({})
  })

  it("starts from the saved configuration and saves live edits without auditing", () => {
    const s = createSeed()
    const d = draftFor(s, IDS.ivCath)
    expect(d.model).toBe("demonstration")
    const next = setDraft(s, IDS.ivCath, { ...d, config: { ...d.config, levels: ["A", "B"] } })
    expect(next.drafts[IDS.ivCath].config.levels).toEqual(["A", "B"])
    expect(next.audit).toHaveLength(s.audit.length)
    expect(s.skills.find((k) => k.id === IDS.ivCath)?.config?.levels).toHaveLength(3)
  })

  it("saving a step audits it", () => {
    const s = saveStep(createSeed(), IDS.ivCath, 3, A, AT)
    expect(s.audit[0].action).toBe("Saved configuration draft, step 3")
    expect(s.drafts[IDS.ivCath].step).toBe(3)
  })

  it("copies another skill's configuration into the draft (IM-14) and drops a self prerequisite", () => {
    const s = createSeed()
    const r = must(copyConfigFrom(s, "sk-pressure-injury", IDS.ivCath, A, AT))
    expect(r.state.drafts["sk-pressure-injury"].model).toBe("demonstration")
    expect(r.state.drafts["sk-pressure-injury"].config.achievement.need).toBe(4)
    expect(copyConfigFrom(s, IDS.ivCath, "sk-pressure-injury", A, AT).ok).toBe(false)
  })

  it("changing the model rebuilds the criteria (SC-09)", () => {
    const d = chooseModel(draftFor(createSeed(), IDS.ivCath), "binary")
    expect(d.model).toBe("binary")
    expect(d.config.achievement.minLevelIndex).toBeNull()
  })
})

describe("publishSkill (SC-19)", () => {
  it("is blocked while the draft has issues, and changes nothing", () => {
    const s0 = createSeed()
    const d = draftFor(s0, IDS.ivCath)
    const bad = setDraft(s0, IDS.ivCath, { ...d, config: { ...d.config, levels: ["Needs coaching", "", "Works alone"] } })
    const r = publishSkill(bad, IDS.ivCath, A, AT)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.issues?.[0].field).toBe("wiz-level-1")
      expect(r.error).toBe("Fix 1 problem before publishing.")
    }
    expect(bad.skills.find((k) => k.id === IDS.ivCath)?.published).toBe(false)
  })

  it("publishes a clean draft: writes model and rules, marks it in use, clears the draft, audits", () => {
    const s0 = createSeed()
    const d = draftFor(s0, IDS.ivCath)
    const edited = setDraft(s0, IDS.ivCath, { ...d, config: { ...d.config, levels: ["Needs coaching", "Works with prompts", "Works alone", "Teaches others"] } })
    const r = must(publishSkill(edited, IDS.ivCath, A, AT))
    const k = r.state.skills.find((x) => x.id === IDS.ivCath)!
    expect(k.published && k.configured).toBe(true)
    expect(k.config?.levels).toHaveLength(4)
    expect(r.state.drafts[IDS.ivCath]).toBeUndefined()
    expect(r.state.audit[0].action).toBe("Published skill")
    expect(COUNTER_BY_ID.published.value(r.state)).toBe(COUNTER_BY_ID.published.value(s0) + 1)
  })

  it("a never-configured skill can be configured with the binary default and published", () => {
    const s0 = createSeed()
    const r = must(publishSkill(s0, "sk-pressure-injury", A, AT))
    const k = r.state.skills.find((x) => x.id === "sk-pressure-injury")!
    expect(k.model).toBe("binary")
    expect(k.configured && k.published).toBe(true)
  })
})

describe("setMapping (CM-03, CM-06, IM-09)", () => {
  it("adds, changes and removes a mapping, with an audit entry each time", () => {
    const s0 = createSeed()
    const added = must(setMapping(s0, "sk-rad-chest", "optional", A, AT))
    expect(added.state.mappings).toHaveLength(10)
    const changed = must(setMapping(added.state, "sk-rad-chest", "mandatory", A, AT))
    expect(changed.state.mappings.filter((m) => m.skillId === "sk-rad-chest")).toEqual([{ courseId: s0.course.id, skillId: "sk-rad-chest", level: "mandatory" }])
    expect(changed.state.audit[0].action).toBe("Mapped skill as mandatory")
    const removed = must(setMapping(changed.state, "sk-rad-chest", null, A, AT))
    expect(removed.state.mappings).toHaveLength(9)
    expect(removed.state.audit[0].action).toBe("Removed mapping")
  })

  it("refuses an unconfigured skill and says why", () => {
    const r = setMapping(createSeed(), "sk-pressure-injury", "mandatory", A, AT)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/Configure this skill first/)
  })

  it("a skill created by import cannot be mapped until it is published or at least configured", () => {
    const made = must(copyStarterSkills(createSeed(), "paramedic", [0], A, AT))
    const id = made.state.batches[0].skillIds[0]
    expect(setMapping(made.state, id, "mandatory", A, AT).ok).toBe(false)
    const pub = must(publishSkill(made.state, id, A, AT))
    expect(setMapping(pub.state, id, "mandatory", A, AT).ok).toBe(true)
  })
})
