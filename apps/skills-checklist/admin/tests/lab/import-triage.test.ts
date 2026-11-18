import { describe, expect, it } from "vitest"
import { cleanName, headingName, isHeading, isNoise, readImportText } from "@/lib/lab/import-triage"
import { SAMPLE_TEXT } from "@/lib/lab/import-sample"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// The markdown handoff spec Romit uploaded as a skills file, verbatim (kept as .md so source audits do not read it as code).
const HANDOFF_TEXT = readFileSync(join(__dirname, "fixtures", "add-skills-handoff.md"), "utf8")

describe("H's plain upload reader (D-ADD1117-z)", () => {
  it("drops only formatting and counts it", () => {
    for (const t of ["", "---", "***", "===", "|---|---|", "```", "{", "123"]) expect(isNoise(t)).toBe(true)
    for (const t of ["Suctioning, oral", "To whomsoever it may concern", "I hold a master's"]) expect(isNoise(t)).toBe(false)
    const r = readImportText(["---", "", "```", "const x = 1", "```", "Suctioning, oral"].join("\n"))
    expect(r.noise).toBe(5)
    expect(r.lines.map((l) => l.text)).toEqual(["Suctioning, oral"])
  })
  it("keeps every other line as a row, as written: sentences and fragments too", () => {
    const r = readImportText(["Design systems", "I am writing to apply for the role.", "and skin check"].join("\n"))
    expect(r.lines.map((l) => l.text)).toEqual(["Design systems", "I am writing to apply for the role.", "and skin check"])
  })
  it("strips bullets, numbering and markdown marks from names", () => {
    expect(cleanName("- **Tracheostomy** care")).toBe("Tracheostomy care")
    expect(cleanName("3) `Bladder scan`")).toBe("Bladder scan")
  })
  it("puts rows under their heading, cleaned; a heading with no rows under it is dropped", () => {
    expect(isHeading("## 3.1 Airway:")).toBe(true)
    expect(isHeading("Consider the following highlights of my work:")).toBe(false)
    expect(headingName("## 3.1 Airway:")).toBe("Airway")
    expect(headingName("NEUROLOGICAL")).toBe("Neurological")
    const r = readImportText(["TITLE PAGE", "## 3.1 Airway:", "- Suctioning, oral", "NOTES:"].join("\n"))
    expect(r.lines).toEqual([{ line: 3, text: "Suctioning, oral", category: "Airway", categoryFrom: "heading" }])
    expect(r.categories).toEqual(["Airway"])
  })
  it("reads a table by its header: name, description and category columns", () => {
    const r = readImportText(["Skill\tDescription\tCategory", "Bladder scan\tFrom the file\tElimination", "Zebra import only skill\t"].join("\n"))
    expect(r.noise).toBe(0)
    expect(r.lines.map((l) => [l.text, l.description, l.category, l.categoryFrom])).toEqual([["Bladder scan", "From the file", "Elimination", "column"], ["Zebra import only skill", undefined, undefined, undefined]])
    expect(readImportText(["name,notes", '"Suctioning, oral",Use a Yankauer'].join("\n"), { columns: true }).lines[0]).toMatchObject({ text: "Suctioning, oral", description: "Use a Yankauer" })
  })
  it("reads the lab's sample as 24 rows in 4 categories", () => {
    const r = readImportText(SAMPLE_TEXT)
    expect(r.categories).toEqual(["Airway", "Cardiac", "Medication", "Neurological"])
    expect(r.lines).toHaveLength(24)
  })
  it("reads a markdown spec without losing a line that has words", () => {
    const r = readImportText(HANDOFF_TEXT)
    expect(r.noise).toBeGreaterThan(20)
    expect(r.lines.every((l) => l.text && !l.text.startsWith("#"))).toBe(true)
  })
})
