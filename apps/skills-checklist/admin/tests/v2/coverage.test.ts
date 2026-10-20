import { describe, expect, it } from "vitest"
import { coverageWarnings, mappingSummary, mapBlockReason } from "@/lib/v2/coverage"
import { createSeed, IDS } from "@/lib/v2/seed"
import type { V2State } from "@/lib/v2/types"

const kinds = (s: V2State) => coverageWarnings(s).map((w) => w.kind)

describe("coverageWarnings", () => {
  it("on the seed the only gap is the mandatory skill that is not in use yet", () => {
    const w = coverageWarnings(createSeed())
    expect(w.map((x) => x.kind)).toEqual(["not-in-use"])
    expect(w[0].skillId).toBe(IDS.ivCath)
  })

  it("warns when the course has no mandatory skills", () => {
    const s = createSeed()
    s.mappings = s.mappings.map((m) => ({ ...m, level: "optional" as const }))
    expect(kinds(s)).toEqual(["no-mandatory"])
  })

  it("warns when a mandatory skill needs a setting the course does not place students in", () => {
    const s = createSeed()
    s.skills.find((k) => k.id === IDS.ivCath)!.config!.achievement.settingMinimums = [{ setting: "Emergency", min: 1 }]
    const w = coverageWarnings(s).find((x) => x.kind === "setting-missing")
    expect(w?.message).toMatch(/Emergency placements/)
    expect(w?.message).toMatch(/No setting in this course can satisfy it/)
  })

  it("does not warn about a setting for an optional skill", () => {
    const s = createSeed()
    s.skills.find((k) => k.id === IDS.ivCath)!.config!.achievement.settingMinimums = [{ setting: "Emergency", min: 1 }]
    s.mappings.find((m) => m.skillId === IDS.ivCath)!.level = "optional"
    expect(kinds(s)).not.toContain("setting-missing")
  })

  it("warns when nobody on record is qualified to sign off a mandatory skill", () => {
    const s = createSeed()
    s.skills.find((k) => k.id === IDS.ivCath)!.config!.qualification.minYears = 40
    expect(kinds(s)).toContain("no-evaluator")
  })

  it("clears the not-in-use warning once the skill is published", () => {
    const s = createSeed()
    s.skills.find((k) => k.id === IDS.ivCath)!.published = true
    expect(kinds(s)).toEqual([])
  })

  it("reports a mapped skill that is unconfigured", () => {
    const s = createSeed()
    s.mappings.push({ courseId: s.course.id, skillId: "sk-pressure-injury", level: "optional" })
    expect(kinds(s)).toContain("unconfigured-mapped")
  })
})

describe("mapBlockReason and summary", () => {
  it("blocks unconfigured skills with a reason and allows configured ones (IM-09)", () => {
    const s = createSeed()
    expect(mapBlockReason(s.skills.find((k) => k.id === "sk-pressure-injury")!)).toMatch(/Configure this skill first/)
    expect(mapBlockReason(s.skills.find((k) => k.id === IDS.ivCath)!)).toBeNull()
  })

  it("counts mapped and mandatory skills for the course (CM-04)", () => {
    expect(mappingSummary(createSeed())).toEqual({ mapped: 9, mandatory: 5 })
  })
})
