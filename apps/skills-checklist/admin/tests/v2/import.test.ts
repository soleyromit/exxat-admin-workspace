import { describe, expect, it } from "vitest"
import { NO_CATEGORY, proposeFromText } from "@/lib/v2/import"
import { createSeed } from "@/lib/v2/seed"

export const SAMPLE = [
  "Harbor General Hospital",
  "Nursing skills checklist 2026",
  "Page 1 of 1",
  "",
  "Respiratory care",
  "1. Tracheostomy suctioning - open and closed system",
  "2. Oxygen delivery device setup",
  "Medication safety",
  "- Oral medication administration",
  "• Insulin pen administration: includes two-nurse check",
  "",
  "Signature of unit educator: __________",
  "7) Fall risk bundle",
].join("\n")

describe("proposeFromText", () => {
  const p = proposeFromText(SAMPLE, createSeed())

  it("reads numbered and bulleted lines as skills with their source line (IM-04)", () => {
    expect(p.skills.map((k) => k.name)).toEqual(["Tracheostomy suctioning", "Oxygen delivery device setup", "Oral medication administration", "Insulin pen administration", "Fall risk bundle"])
    const trach = p.skills[0]
    expect(trach.description).toBe("open and closed system")
    expect(trach.line).toBe(6)
    expect(trach.sourceText).toBe("1. Tracheostomy suctioning - open and closed system")
    expect(p.skills[3].description).toBe("includes two-nurse check")
  })

  it("proposes headings as categories for the skills beneath them (IM-07)", () => {
    expect(p.categories).toEqual(["Respiratory care", "Medication safety"])
    expect(p.skills.map((k) => k.category)).toEqual(["Respiratory care", "Respiratory care", "Medication safety", "Medication safety", "Medication safety"])
  })

  it("returns what it could not read with the original text and line number (IM-08)", () => {
    expect(p.unread).toEqual([
      { line: 1, text: "Harbor General Hospital" },
      { line: 2, text: "Nursing skills checklist 2026" },
      { line: 3, text: "Page 1 of 1" },
      { line: 12, text: "Signature of unit educator: __________" },
    ])
  })

  it("flags skills that repeat an existing library skill (IM-06)", () => {
    expect(p.skills.find((k) => k.name === "Oral medication administration")?.duplicateOf).toBe("Oral medication administration")
    expect(p.skills[0].duplicateOf).toBeNull()
  })

  it("uses no category when there is no heading and flags repeats inside the list", () => {
    const q = proposeFromText("1. Hand hygiene audit\n2. Hand hygiene audit", createSeed())
    expect(q.skills.map((k) => k.category)).toEqual([NO_CATEGORY, NO_CATEGORY])
    expect(q.skills[1].duplicateOf).toBe("Hand hygiene audit")
  })

  it("never proposes a model or criteria (OD-12)", () => {
    expect(Object.keys(p.skills[0]).sort()).toEqual(["category", "description", "duplicateOf", "id", "line", "name", "sourceText"])
  })
})
