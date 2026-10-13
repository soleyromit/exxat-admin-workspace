import { describe, expect, it } from "vitest"
import * as S from "@/lib/store"
import { ctx, must, seed } from "./helpers"

const SAMPLE = [
  "Category D:",
  "Central line dressing change - Sterile technique on an established line",
  "Peripheral IV removal | Documentation of site condition",
  "SECTION 2: ADVANCED PROCEDURES",
  "Category E:",
  "Lead ECG acquisition: Lead placement and trace quality",
  "iv   INSERTION",
  "Urinary catheter removal",
  "",
  "Urinary catheter removal",
].join("\n")

const propose = (db = seed(), text = SAMPLE) => must(S.proposeImport(db, { text, sourceName: "Pasted list", sourceKind: "paste" }, ctx))

describe("proposal (IM-01..IM-08, IM-13)", () => {
  it("creates NOTHING until confirmed (IM-05, IM-13)", () => {
    const db = seed()
    const r = propose(db)
    expect(r.db.skills).toHaveLength(db.skills.length)
    expect(r.db.categories).toHaveLength(db.categories.length)
    expect(r.db.importBatches.find((b) => b.id === r.value.batchId)!.status).toBe("review")
  })

  it("reads names, descriptions and groupings with no template or column order (IM-03, IM-04, IM-07)", () => {
    const b = propose().db.importBatches.at(-1)!
    const rows = b.rows.map((r) => [r.name, r.description, r.categoryName])
    expect(rows).toContainEqual(["Central line dressing change", "Sterile technique on an established line", "Category D"])
    expect(rows).toContainEqual(["Peripheral IV removal", "Documentation of site condition", "Category D"])
    expect(rows).toContainEqual(["Lead ECG acquisition", "Lead placement and trace quality", "Category E"])
    expect(b.createCategories).toBe(true)
  })

  it("reports what it could not read with its ORIGINAL text, never silently dropped (IM-08)", () => {
    const b = propose().db.importBatches.at(-1)!
    expect(b.unread).toHaveLength(1)
    expect(b.unread[0]).toMatchObject({ text: "SECTION 2: ADVANCED PROCEDURES", reason: "heading", location: "Line 4" })
  })

  it("flags possible duplicates against the library by normalised name (IM-06)", () => {
    const b = propose().db.importBatches.at(-1)!
    const dup = b.rows.find((r) => r.name === "iv   INSERTION")!
    expect(dup.match).toEqual({ status: "duplicate", existingSkillId: "sk-iv" })
    expect(dup.duplicateChoice).toBe("skip") // default is the safe choice
  })

  it("a name repeated inside the same source starts excluded so it is not created twice by accident", () => {
    const rows = propose().db.importBatches.at(-1)!.rows.filter((r) => r.name === "Urinary catheter removal")
    expect(rows.map((r) => r.include)).toEqual([true, false])
  })

  it("reads CSV files without a template and treats the header row as unread", () => {
    const csv = "Skill,Description,Category\nNG tube insertion,Placement,Category F\nECG,Leads,"
    const r = must(S.proposeImport(seed(), { text: csv, sourceName: "list.csv", sourceKind: "file" }, ctx))
    const b = r.db.importBatches.at(-1)!
    expect(b.rows.map((x) => [x.name, x.categoryName])).toEqual([["NG tube insertion", "Category F"], ["ECG", null]])
    expect(b.unread[0].text).toBe("Skill,Description,Category")
  })

  it("an empty source is refused", () => {
    expect(S.proposeImport(seed(), { text: "  \n ", sourceName: "x", sourceKind: "paste" }, ctx)).toMatchObject({ ok: false, error: { code: "invalid" } })
  })
})

describe("review edits (IM-05): edit, rename, merge, split, discard, add", () => {
  it("edits and renames a row and re-checks duplicates", () => {
    const p = propose()
    const b = p.db.importBatches.at(-1)!
    const row = b.rows.find((r) => r.name === "Lead ECG acquisition")!
    let db = must(S.updateImportRow(p.db, b.id, row.id, { name: "Wound Care" })).db
    expect(db.importBatches.at(-1)!.rows.find((r) => r.id === row.id)!.match.status).toBe("duplicate")
    expect(S.updateImportRow(db, b.id, row.id, { name: " " })).toMatchObject({ ok: false })
    db = must(S.updateImportRow(db, b.id, row.id, { include: false })).db
    expect(db.importBatches.at(-1)!.rows.find((r) => r.id === row.id)!.include).toBe(false)
  })

  it("merges rows (first survives, descriptions joined) and splits one row into several", () => {
    const p = propose()
    const b = p.db.importBatches.at(-1)!
    const [a, c] = b.rows
    let db = must(S.mergeImportRows(p.db, b.id, [a.id, c.id], "Combined skill")).db
    let batch = db.importBatches.at(-1)!
    expect(batch.rows.find((r) => r.id === a.id)!.name).toBe("Combined skill")
    expect(batch.rows.some((r) => r.id === c.id)).toBe(false)
    db = must(S.splitImportRow(db, b.id, a.id, ["Part one", "Part two"])).db
    batch = db.importBatches.at(-1)!
    expect(batch.rows.filter((r) => ["Part one", "Part two"].includes(r.name))).toHaveLength(2)
    expect(S.mergeImportRows(db, b.id, [a.id], "x")).toMatchObject({ ok: false })
  })

  it("adds a missed row, and an unread line can become a skill row or be ignored", () => {
    const p = propose()
    const b = p.db.importBatches.at(-1)!
    let db = must(S.addImportRow(p.db, b.id, { name: "Added by hand" })).db
    expect(db.importBatches.at(-1)!.rows.at(-1)).toMatchObject({ name: "Added by hand", sourceRef: "Added by hand" })
    db = must(S.resolveUnreadLine(db, b.id, b.unread[0].id, "skill")).db
    expect(db.importBatches.at(-1)!.unread).toHaveLength(0)
    expect(db.importBatches.at(-1)!.rows.some((r) => r.name.startsWith("SECTION 2"))).toBe(true)
  })
})

describe("confirm (IM-09, IM-11, OD-13)", () => {
  it("creates skills UNCONFIGURED, tied to the batch, with categories only when opted in (IM-07)", () => {
    const p = propose()
    const id = p.value.batchId
    const r = must(S.confirmImport(p.db, id, ctx))
    expect(r.value).toMatchObject({ created: 4, skipped: 1, categoriesCreated: 2 })
    const created = r.db.skills.filter((s) => s.importBatchId === id)
    expect(created).toHaveLength(4)
    expect(created.every((s) => s.model === null)).toBe(true) // cannot be mapped or submitted against
    expect(S.mapSkill(r.db, { offeringId: "off-350-f26", skillId: created[0].id })).toMatchObject({ ok: false, error: { code: "skillNotUsable" } })
    expect(r.db.categories.map((c) => c.name)).toEqual(expect.arrayContaining(["Category D", "Category E"]))
    expect(r.db.importBatches.find((b) => b.id === id)!.status).toBe("confirmed")
  })

  it("does not create categories when the admin opts out (IM-07)", () => {
    const p = propose()
    const off = must(S.setImportCreateCategories(p.db, p.value.batchId, false)).db
    const r = must(S.confirmImport(off, p.value.batchId, ctx))
    expect(r.value.categoriesCreated).toBe(0)
    expect(r.db.skills.filter((s) => s.importBatchId === p.value.batchId).every((s) => s.categoryId === null)).toBe(true)
  })

  it("Replace is refused when the existing skill already holds evidence; Keep both creates a second skill (OD-13)", () => {
    const p = propose()
    const batch = p.db.importBatches.at(-1)!
    const dup = batch.rows.find((r) => r.name === "iv   INSERTION")!
    expect(S.updateImportRow(p.db, batch.id, dup.id, { duplicateChoice: "replace" })).toMatchObject({ ok: false, error: { code: "replaceHasEvidence" } })
    const both = must(S.updateImportRow(p.db, batch.id, dup.id, { duplicateChoice: "keepBoth" })).db
    const r = must(S.confirmImport(both, batch.id, ctx))
    expect(r.db.skills.filter((s) => s.name.toLowerCase().replace(/\s+/g, " ") === "iv insertion")).toHaveLength(2)
  })

  it("Replace works for a skill without evidence", () => {
    let db = seed()
    const sk = must(S.createSkill(db, { name: "No evidence yet skill" }, ctx))
    db = sk.db
    const p = must(S.proposeImport(db, { text: "No evidence yet skill - New description", sourceName: "x", sourceKind: "paste" }, ctx))
    const b = p.db.importBatches.at(-1)!
    const row = b.rows[0]
    const db2 = must(S.updateImportRow(p.db, b.id, row.id, { duplicateChoice: "replace" })).db
    const r = must(S.confirmImport(db2, b.id, ctx))
    expect(r.value.replaced).toBe(1)
    expect(r.db.skills.find((s) => s.id === sk.value.skillId)!.description).toBe("New description")
  })

  it("import is repeatable and adds to the library; each skill is traceable to its batch (IM-11)", () => {
    const first = propose()
    const a = must(S.confirmImport(first.db, first.value.batchId, ctx))
    const second = must(S.proposeImport(a.db, { text: "Brand new skill", sourceName: "second", sourceKind: "paste" }, ctx))
    const b = must(S.confirmImport(second.db, second.value.batchId, ctx))
    expect(b.db.skills.length).toBe(a.db.skills.length + 1)
    expect(S.listSkills(b.db, { batchId: second.value.batchId }).map((r) => r.skill.name)).toEqual(["Brand new skill"])
    expect(S.listSkills(b.db, { batchId: first.value.batchId })).toHaveLength(4)
  })

  it("a cancelled or confirmed batch is no longer open for edits", () => {
    const p = propose()
    const c = must(S.cancelImport(p.db, p.value.batchId)).db
    expect(S.confirmImport(c, p.value.batchId, ctx)).toMatchObject({ ok: false })
  })
})

describe("proposal: lines that are not skills (IM-07, IM-08; e2e B3, B4)", () => {
  it("IM-08: a line with no letters ('-----', '12345') is never proposed as a skill and is reported with its original text", () => {
    const b = propose(seed(), ["Wound irrigation", "-----", "12345", "***", "Foley removal"].join("\n")).db.importBatches.at(-1)!
    expect(b.rows.map((r) => r.name)).toEqual(["Wound irrigation", "Foley removal"])
    expect(b.unread.map((u) => [u.text, u.reason, u.location])).toEqual([
      ["-----", "unrecognised", "Line 2"],
      ["12345", "unrecognised", "Line 3"],
      ["***", "unrecognised", "Line 4"],
    ])
  })

  it("IM-07: a plain ALL-CAPS heading followed by item lines is proposed as the category for the skills beneath it", () => {
    const b = propose(seed(), ["RESPIRATORY SKILLS", "Suctioning", "Oxygen titration", "WOUND CARE", "Dressing change"].join("\n")).db.importBatches.at(-1)!
    expect(b.rows.map((r) => [r.name, r.categoryName])).toEqual([
      ["Suctioning", "RESPIRATORY SKILLS"],
      ["Oxygen titration", "RESPIRATORY SKILLS"],
      ["Dressing change", "WOUND CARE"],
    ])
    expect(b.unread).toHaveLength(0)
  })

  it("IM-08: an ALL-CAPS line with nothing beneath it, and a 'Section 2' heading, stay unread so nothing is dropped silently", () => {
    const b = propose(seed(), ["Suctioning", "SECTION 2 ADVANCED", "THE END"].join("\n")).db.importBatches.at(-1)!
    expect(b.rows.map((r) => r.name)).toEqual(["Suctioning"])
    expect(b.unread.map((u) => [u.text, u.reason])).toEqual([["SECTION 2 ADVANCED", "heading"], ["THE END", "heading"]])
  })

  it("IM-07: categories proposed from headings are created only when the admin opts in, and the choice is reversible", () => {
    const r = propose(seed(), ["RESPIRATORY SKILLS", "Suctioning"].join("\n"))
    const off = must(S.setImportCreateCategories(r.db, r.value.batchId, false))
    expect(off.db.categories).toHaveLength(r.db.categories.length)
    const confirmed = must(S.confirmImport(off.db, r.value.batchId, ctx))
    expect(confirmed.db.categories).toHaveLength(r.db.categories.length)
  })
})

describe("interpretation stops at name, description and grouping (IM-15, OD-12 stays open)", () => {
  it("IM-15: an imported row carries no evaluation model, no questions and no criteria; skills are created unconfigured", () => {
    const r = propose(seed(), ["RESPIRATORY SKILLS", "Suctioning: Clear the airway", "- Oxygen titration"].join("\n"))
    const batch = r.db.importBatches.find((b) => b.id === r.value.batchId)!
    for (const row of batch.rows) expect(Object.keys(row).sort()).toEqual(expect.not.arrayContaining(["model", "questions", "criteria", "levels"]))
    const confirmed = must(S.confirmImport(r.db, r.value.batchId, ctx))
    for (const id of confirmed.db.importBatches.find((b) => b.id === r.value.batchId)!.createdSkillIds) {
      const s = confirmed.db.skills.find((x) => x.id === id)!
      expect(s.model).toBeNull()
      expect(s.criteria.requiredCount).toBeNull()
    }
  })
})
