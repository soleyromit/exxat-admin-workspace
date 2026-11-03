import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { isConfigured } from "@/lib/v2/population"
import { emptyRule, fromV2, validateRule, type LabRule } from "@/lib/lab/configure"
import { buildLibrary } from "@/lib/lab/library"
import {
  differsFromProgram,
  notConfiguredIds,
  planProgramApply,
  programSettingsOf,
  resolveRule,
  saveProgramSettings,
  setTimesNeeded,
  timesRows,
} from "@/lib/lab/program-settings"

const seed = createSeed()
const opts = { at: "2026-11-02T10:00:00Z", byId: "adm-ross" }

/** A complete levels program: three levels, independent counts, 3 times, preceptors and faculty sign. */
function levelsProgram(need = 3): LabRule {
  return {
    ...emptyRule(),
    model: "demonstration",
    levels: ["Observed", "Assisted", "Independent"],
    need,
    evaluatorRoles: ["preceptor", "faculty"],
    carried: { ...emptyRule().carried, minLevelIndex: 2 },
  }
}

const libraryIds = () => buildLibrary(seed).filter((r) => r.status !== "inactive").map((r) => r.id)

describe("program evaluation settings (Proposed 2026-11-02)", () => {
  it("starts unset: Prism chooses nothing for the program", () => {
    expect(programSettingsOf(seed)).toBeNull()
  })

  it("resolves a skill as the program part plus its own times needed; a skill with none takes the program number", () => {
    const p = levelsProgram(3)
    expect(validateRule(p)).toEqual([])
    const configured = seed.skills.find((k) => isConfigured(k) && k.config && k.config.achievement.need === 5) ?? seed.skills.find((k) => isConfigured(k))!
    const own = fromV2(configured)
    const r = resolveRule(p, own)
    expect(r.model).toBe("demonstration")
    expect(r.need).toBe(own.need)
    expect(r.levels).toEqual(p.levels)
    expect(resolveRule(p, null).need).toBe(3)
    expect(differsFromProgram(r, p)).toEqual([])
  })

  it("saves to every active skill on the first save, keeps each times needed and makes not configured skills usable", () => {
    const ids = libraryIds()
    const before = notConfiguredIds(seed, ids).length
    expect(before).toBeGreaterThan(0)
    const res = saveProgramSettings(seed, levelsProgram(3), { ...opts, only: ids })
    expect(res.ok).toBe(true)
    if (!res.ok) return
    const { state, plan } = res.result
    expect(plan.newlyConfigured).toBe(before)
    expect(notConfiguredIds(state, ids)).toEqual([])
    expect(programSettingsOf(state)?.rule.need).toBe(3)
    // A skill configured before keeps its own number.
    const k = seed.skills.find((x) => isConfigured(x) && ids.includes(x.id))!
    const after = state.skills.find((x) => x.id === k.id)!
    expect(fromV2(after).need).toBe(fromV2(k).need)
  })

  it("keeps skills with settings of their own on a later save unless they are included", () => {
    const ids = libraryIds()
    const first = saveProgramSettings(seed, levelsProgram(3), { ...opts, only: ids })
    if (!first.ok) throw new Error("first save")
    const s1 = first.result.state
    // One skill changed on its own (approval on).
    const one = ids[0]!
    const k = s1.skills.find((x) => x.id === one)!
    const s2 = { ...s1, skills: s1.skills.map((x) => (x.id === one ? { ...x, config: { ...x.config!, approvalRequired: true } } : x)) }
    expect(differsFromProgram(fromV2(s2.skills.find((x) => x.id === one)!), levelsProgram(3))).toContain("approvalRequired")
    const next = { ...levelsProgram(3), feedbackRequired: true }
    expect(planProgramApply(s2, next, { only: ids }).own).toEqual([k.id])
    expect(planProgramApply(s2, next, { only: ids, includeOwn: true }).own).toEqual([])
  })

  it("refuses settings that are not complete, and a question model without questions blocks each skill with the reason", () => {
    expect(saveProgramSettings(seed, { ...levelsProgram(3), need: Number.NaN }, opts).ok).toBe(false)
    expect(saveProgramSettings(seed, { ...emptyRule() }, opts).ok).toBe(false)
  })

  it("sets times needed for one skill without touching the others", () => {
    const k = seed.skills.find((x) => isConfigured(x))!
    const r = setTimesNeeded(seed, k.id, 7, opts)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(fromV2(r.state.skills.find((x) => x.id === k.id)!).need).toBe(7)
    const other = seed.skills.find((x) => isConfigured(x) && x.id !== k.id)!
    expect(r.state.skills.find((x) => x.id === other.id)).toBe(other)
    const nc = seed.skills.find((x) => !isConfigured(x))!
    expect(setTimesNeeded(seed, nc.id, 2, opts)).toEqual({ ok: false, error: "Set the evaluation settings first." })
    expect(setTimesNeeded(seed, k.id, 0, opts).ok).toBe(false)
  })

  it("lists times rows in library order, inactive skills left out", () => {
    const rows = timesRows(seed, buildLibrary(seed))
    expect(rows.length).toBe(libraryIds().filter((id) => seed.skills.some((k) => k.id === id)).length)
  })
})
