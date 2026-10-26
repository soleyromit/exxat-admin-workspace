import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { EMPTY_SETTINGS, categoryRows, clinicalSettingRows, instructorRows, settingId, tagRows, usesOf, validateEntry } from "@/lib/lab/settings"

const seed = createSeed()

describe("settings lists (SL-03 to SL-08)", () => {
  it("lists every category with its skill count, and blocks delete while used", () => {
    const rows = categoryRows(seed)
    expect(rows.reduce((t, r) => t + r.skills, 0)).toBe(seed.skills.length)
    for (const r of rows) {
      expect(r.blocked === null).toBe(r.uses === 0)
      expect(usesOf(seed, "categories", r.name)).toHaveLength(r.skills)
    }
  })

  it("counts tags across categories and opens lists of equal length", () => {
    const rows = tagRows(seed)
    expect(rows.length).toBeGreaterThan(0)
    for (const r of rows) expect(usesOf(seed, "tags", r.name)).toHaveLength(r.skills)
  })

  it("counts active sites, rules and courses per clinical setting with equal-length lists", () => {
    const rows = clinicalSettingRows(seed)
    expect(rows.map((r) => r.name)).toEqual(seed.program.clinicalSettings)
    expect(rows.reduce((t, r) => t + r.sites, 0)).toBeGreaterThan(50)
    for (const r of rows) {
      expect(usesOf(seed, "settings", r.name, r.id, "sites")).toHaveLength(r.sites)
      expect(usesOf(seed, "settings", r.name, r.id, "rules")).toHaveLength(r.rules)
      expect(usesOf(seed, "settings", r.name, r.id, "courses")).toHaveLength(r.courses)
    }
  })

  it("lists lab instructors with the evaluations they signed", () => {
    const rows = instructorRows(seed)
    expect(rows.length).toBe(seed.people.filter((p) => p.kind === "lab-instructor").length)
    for (const r of rows) expect(usesOf(seed, "instructors", r.name, r.id)).toHaveLength(r.evaluations)
  })

  it("applies the overlay: added entries are deletable, deactivated ones stay listed as inactive", () => {
    const used = categoryRows(seed)[0]
    const o = { ...EMPTY_SETTINGS, added: [{ tab: "categories" as const, name: "Pediatrics" }], inactive: [used.id] }
    const rows = categoryRows(seed, o)
    const added = rows.find((r) => r.name === "Pediatrics")!
    expect(added.isNew).toBe(true)
    expect(added.blocked).toBeNull()
    expect(rows.find((r) => r.id === used.id)!.active).toBe(false)
    expect(categoryRows(seed, { ...o, deleted: [settingId("categories", "Pediatrics")] }).some((r) => r.name === "Pediatrics")).toBe(false)
  })

  it("validates inline create", () => {
    const names = categoryRows(seed).map((r) => r.name)
    expect(validateEntry("categories", "  ", names)).toMatch(/Enter a name/)
    expect(validateEntry("categories", names[0].toUpperCase(), names)).toMatch(/already/)
    expect(validateEntry("categories", "Pediatrics", names)).toBeNull()
    expect(validateEntry("instructors", "A. Lee", [], "nope")).toMatch(/email like/)
    expect(validateEntry("instructors", "A. Lee", [], "a.lee@example.org")).toBeNull()
  })
})
