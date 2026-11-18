import { describe, expect, it } from "vitest"
import { closeMatch, namesExisting, readImport, searchSkills, skippedReason } from "@/lib/lab/skill-search"
import { applyDraft, draftListChange, newIntakeName, type DraftEntry } from "@/lib/lab/list-draft"
import { createSeed } from "@/lib/v2/seed"
import { labState } from "@/lib/lab/reviewer"

/** Add skills H (D-ADD1117, decision 4): substring search plus a "Close matches" group; the importer of spec 3.8. */
describe("search: exact substring first, then close matches", () => {
  const rows = [{ name: "Wound irrigation" }, { name: "Sterile dressing change" }, { name: "Wound vac change" }, { name: "Vital signs" }]
  it("a substring is exact, case insensitive", () => {
    expect(searchSkills(rows, "WOUND").exact.map((r) => r.name)).toEqual(["Wound irrigation", "Wound vac change"])
  })
  it("'wound vac' finds Wound vac change exactly and Wound irrigation as a close match, never both ways", () => {
    const r = searchSkills(rows, "wound vac")
    expect(r.exact.map((x) => x.name)).toEqual(["Wound vac change"])
    expect(r.close.map((x) => x.name)).toEqual(["Wound irrigation"])
  })
  it("a one-letter slip is a close match on words of four letters or more", () => {
    expect(closeMatch("Sterile dressing change", "dresing")).toBe(true)
    expect(closeMatch("Vital signs", "vxt")).toBe(false)
  })
  it("an empty query lists everything as exact", () => {
    expect(searchSkills(rows, " ").exact).toHaveLength(4)
  })
  it("a name that differs only by case or spaces is an existing skill (no Create)", () => {
    expect(namesExisting("  vital   SIGNS ", rows.map((r) => r.name))).toBe(true)
    expect(namesExisting("Vital signs check", rows.map((r) => r.name))).toBe(false)
  })
})

describe("import reader: no template, headings skipped and proposed as categories [REQ IM-03, IM-07, IM-08]", () => {
  it("reads one name per line, strips bullets and numbering, and skips a heading line with its text", () => {
    const r = readImport("Airway:\n- Suctioning\n2. Oxygen therapy\nSECTION 2, ADVANCED PROCEDURES\n• Chest tube care\nab\n---")
    expect(r.lines.map((l) => [l.name, l.category ?? null])).toEqual([["Suctioning", "Airway"], ["Oxygen therapy", "Airway"], ["Chest tube care", "Advanced procedures"]])
    expect(r.skipped.map((s) => [s.line, s.reason])).toEqual([[1, "heading"], [4, "heading"], [6, "short"], [7, "no-name"]])
    expect(skippedReason(r.skipped[1]!)).toBe("looks like a heading")
    expect(r.read).toBe(7)
  })
  it("detects a header row and tab or comma columns", () => {
    const tab = readImport("Skill\tDescription\tCategory\nSuctioning\tClear the airway\tAirway\nFoley care\t\tElimination")
    expect(tab.header).toBe(true)
    expect(tab.lines.map((l) => [l.name, l.description ?? null, l.category ?? null, l.categoryFrom ?? null])).toEqual([["Suctioning", "Clear the airway", "Airway", "column"], ["Foley care", null, "Elimination", "column"]])
    const csv = readImport('name,group\n"Wound care, sterile",Skin\nVitals,Assessment', { columns: true })
    expect(csv.lines.map((l) => [l.name, l.category])).toEqual([["Wound care, sterile", "Skin"], ["Vitals", "Assessment"]])
  })
  it("a document title set apart by a blank line is skipped, not read as a skill", () => {
    const r = readImport("Clinical skills to add\n\nPAIN MANAGEMENT\n1. Pain scale assessment\n2. PCA pump setup")
    expect(r.lines.map((l) => [l.name, l.category])).toEqual([["Pain scale assessment", "Pain management"], ["PCA pump setup", "Pain management"]])
    expect(r.skipped.map((x) => [x.line, x.reason])).toEqual([[1, "heading"], [3, "heading"]])
    // A PDF's text has no blank line: a first line straight above a heading is the title too.
    expect(readImport("Clinical skills to add\nPAIN MANAGEMENT\n1. Pain scale assessment").lines.map((l) => l.name)).toEqual(["Pain scale assessment"])
    // A list whose second line is not blank keeps its first line.
    expect(readImport("Suctioning\nVitals\nFoley care").lines).toHaveLength(3)
  })
  it("a plain line with a comma stays one name when most lines have none", () => {
    expect(readImport("Wound care, sterile\nVitals\nFoley care").lines.map((l) => l.name)).toEqual(["Wound care, sterile", "Vitals", "Foley care"])
  })
})

describe("the list draft: nothing reaches the store before Save (decision 1)", () => {
  const s = labState(createSeed())
  it("applyDraft creates the new skill only in the state it returns, with its category", () => {
    const e: DraftEntry = { id: "lab-skill-h-test-1", isNew: true, name: "Wound vac change", category: "Wound care", methodId: null, times: null, required: true }
    const next = applyDraft(s, [e], { actorId: "u", at: "2026-11-17T09:00:00Z" })
    expect(s.skills.some((k) => k.id === e.id)).toBe(false)
    expect(next.skills.find((k) => k.id === e.id)?.category).toBe("Wound care")
  })
  it("a library skill renamed or moved in Review is written to the skill on Save (D-ADD1117-r)", () => {
    const k = s.skills.find((x) => x.active !== false)!
    const e: DraftEntry = { id: k.id, isNew: false, name: `${k.name} (renamed)`, category: "Renamed category", methodId: null, times: null, required: true }
    const next = applyDraft(s, [e], { actorId: "u", at: "2026-11-17T09:00:00Z" })
    expect(next.skills.find((x) => x.id === k.id)).toMatchObject({ name: `${k.name} (renamed)`, category: "Renamed category" })
    expect(s.skills.find((x) => x.id === k.id)?.name).toBe(k.name)
  })
  it("draftListChange adds once and keeps Required per list", () => {
    const out = draftListChange({ skillIds: ["a", "b"], requiredIds: ["a"] }, [
      { id: "b", isNew: false, name: "B", category: "", methodId: null, times: 2, required: true },
      { id: "c", isNew: false, name: "C", category: "", methodId: null, times: 2, required: false },
      { id: "a", isNew: false, name: "A", category: "", methodId: null, times: 2, required: false },
    ])
    expect(out).toEqual({ skillIds: ["a", "b", "c"], requiredIds: ["b"] })
  })
  it("A new list is prefilled '{name}, new intake'", () => {
    expect(newIntakeName("Clinical skills checklist")).toBe("Clinical skills checklist, new intake")
  })
})
