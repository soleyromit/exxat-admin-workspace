import { describe, expect, it } from "vitest"
import {
  AMBIGUOUS_MARK_IDS,
  DEFAULT_LIST,
  EXCEPTION_LABEL,
  FIX_ORDER,
  HGTC_ROWS,
  IMPORT_GROUPING,
  TARGET_LABEL,
  applySuggestions,
  categoriesOf,
  confirmSentence,
  fixGroups,
  linesLeft,
  notCreated,
  parsePastePayload,
  pasteToText,
  readableText,
  buildReview,
  buildSampleText,
  clearDecisions,
  confidenceOf,
  copyPlan,
  decisionKey,
  findDuplicates,
  importTargets,
  leaveOut,
  normName,
  planImport,
  planSentence,
  readChecklist,
  resolve,
  similarity,
  startingPoints,
  summarize,
  toFix,
  type LibrarySkill,
} from "@/lib/lab/import"
import { buildHero } from "@/lib/v2/seed"

const LIB: LibrarySkill[] = buildHero()
  .skills.filter((k) => k.specialty === "bsn-med-surg")
  .map((k) => ({ id: k.id, name: k.name, configured: k.configured }))

describe("readChecklist", () => {
  it("reads plain lines with no number or dash as skills", () => {
    const r = readChecklist("Basic Skills\n  Hand washing\n  Bed making\n")
    expect(r.rows.map((x) => x.name)).toEqual(["Hand washing", "Bed making"])
    expect(r.rows.every((x) => x.section === "Basic Skills")).toBe(true)
  })

  it("strips numbers and bullets, reads * and [R] as the file's mark, and groups under a heading", () => {
    const r = readChecklist("Safety\n  1. *Hand washing\n  • Restraints [R]\n  Baths:\n    Sitz Bath\n  Sterile gloving\n")
    expect(r.rows.map((x) => [x.name, x.mark, x.group])).toEqual([
      ["Hand washing", "mandatory", null],
      ["Restraints", "mandatory", null],
      ["Sitz Bath", "none", "Baths"],
      ["Sterile gloving", "none", null],
    ])
    expect(r.groups).toEqual(["Baths"])
  })

  it("composes a name from a sub-heading and flags a lone mark as unclear", () => {
    const r = readChecklist("Safety\n  Specimen collection:\n    Urine:\n      24-hour urine\n    Stool\n  *\n  Standing\n")
    expect(r.rows.map((x) => [x.name, x.composed, x.mark])).toEqual([
      ["Urine: 24-hour urine", true, "none"],
      ["Stool", false, "none"],
      ["Standing", false, "unclear"],
    ])
  })

  it("keeps unreadable lines with their original text and a best reading", () => {
    const r = readChecklist("Elimination\n  Bladder Scanner\n  pt teaching re: cath care (handwr\n")
    const bad = r.rows.find((x) => x.unreadable)!
    expect(bad.sourceText).toBe("pt teaching re: cath care (handwr")
    expect(bad.unreadable!.reading).toBe("pt teaching re: cath care")
  })

  it("loses the section at a repeated page header and remembers the one before", () => {
    const r = readChecklist("Nutrition\n  Calorie count\n\nPage 4\nClinical Skills Validation Checklist (continued)\n  TPN/PPN\n")
    expect(r.rows[1].section).toBeNull()
    expect(r.rows[1].sectionCarried).toBe("Nutrition")
    expect(r.furniture.map((f) => f.kind)).toEqual(["page", "header"])
  })
})

describe("the HGTC sample", () => {
  const text = buildSampleText("standard")
  const review = buildReview(text, LIB)

  it("is deterministic", () => {
    expect(buildSampleText("standard")).toBe(text)
  })

  it("reads 154 skills plus 2 wrapped lines and 2 unreadable lines, and lists the furniture", () => {
    expect(review.rows.length).toBe(158)
    expect(review.rows.filter((r) => r.continuation).length).toBe(2)
    expect(review.rows.filter((r) => r.unreadable).length).toBe(2)
    expect(review.legend).toBe("must be validated before graduation")
    expect(review.sections.length).toBe(10)
    expect(review.furniture.length).toBeGreaterThanOrEqual(6)
  })

  it("finds the six composed names, the five unclear marks and the 15 rows that lost their section", () => {
    expect(review.rows.filter((r) => r.composed).map((r) => r.name)).toEqual(HGTC_ROWS.filter((r) => /: /.test(r.name)).map((r) => r.name))
    expect(review.rows.filter((r) => r.mark === "unclear").length).toBe(AMBIGUOUS_MARK_IDS.size)
    expect(review.rows.filter((r) => r.sectionCarried).length).toBe(4)
  })

  it("finds repeats in the library and in the file", () => {
    const lib = Object.values(review.library)
    expect(lib.find((m) => m.skillName === "Central line dressing change")?.match).toBe("same")
    expect(lib.find((m) => m.skillName === "Sterile dressing change")?.match).toBe("similar")
    const fileNames = Object.keys(review.file).map((id) => review.rows.find((r) => r.id === id)!.name)
    expect(fileNames.sort()).toEqual(["Irrigation", "ORAL"])
  })

  it("blocks confirm until every exception has a decision", () => {
    const resolved = resolve(review, {})
    const plan = planImport(resolved)
    expect(plan.blocked).toBeGreaterThan(0)
    expect(planSentence(plan, "Medical-surgical nursing")).toMatch(/need a decision before anything is created/)
  })

  it("recovers the source names and marks once the suggestions are applied", () => {
    const decisions = applySuggestions(review, {}, LIB)
    const resolved = resolve(review, decisions)
    const ready = resolved.filter((r) => r.status === "ready")
    expect(resolved.filter((r) => r.status === "look")).toEqual([])
    // Every source skill is either created or knowingly skipped as a library repeat.
    const created = new Set(ready.map((r) => normName(r.row.name === r.name ? r.name : r.row.continuation ? r.name : r.row.name)))
    const skipped = resolved.filter((r) => r.outcome.startsWith("Skipped")).map((r) => normName(r.row.name))
    for (const src of HGTC_ROWS) {
      const k = normName(src.name)
      const hit = created.has(k) || skipped.includes(k) || ready.some((r) => normName(r.name).endsWith(k))
      expect(hit, src.name).toBe(true)
    }
    expect(ready.find((r) => r.name.startsWith("Thrombo"))?.name).toBe("Thrombo Embolic Device/Sequential Compression Device")
    expect(ready.find((r) => r.name.startsWith("Hangs Large"))?.name).toBe("Hangs Large Vol. (1000mL)")
    const marked = ready.filter((r) => r.mandatoryMark).length
    const sourceMarked = HGTC_ROWS.filter((r) => r.required && r.name !== "Central Line Dressing Change").length
    expect(marked).toBe(sourceMarked)
    const plan = planImport(resolved)
    expect(plan.create).toBe(ready.length)
    expect(planSentence(plan, "Medical-surgical nursing")).toMatch(/^\d+ skills will be created in Medical-surgical nursing, each not configured; 2 wrapped lines are joined to the line above; 3 lines are left out\. Nothing else in your library changes\.$/)
  })

  it("summarises read, ready, needs a look and duplicates", () => {
    const s = summarize(review, resolve(review, {}))
    expect(s.read).toBe(156)
    expect(s.duplicates).toBe(4)
    expect(s.look).toBeGreaterThanOrEqual(15)
    expect(s.ready + s.look + s.leftOut).toBe(158)
  })

  it("gives each row a confidence with a reason", () => {
    const oral = review.rows.find((r) => r.name === "Oral")!
    expect(confidenceOf(review, oral)).toEqual({ level: "check", reasons: ["Short name, read under its group"] })
    const bad = review.rows.find((r) => r.unreadable)!
    expect(confidenceOf(review, bad).level).toBe("look")
    const hand = review.rows.find((r) => r.name === "Hand washing")!
    expect(confidenceOf(review, hand).level).toBe("clear")
  })

  it("keeps both with a distinct name, and re-opens a rename that clashes", () => {
    const orally = review.rows.find((r) => r.name === "ORAL")!
    const d = { [decisionKey(orally.id, "duplicate-file")]: toFix(review, orally, "keep-both") }
    const after = resolve(review, d).find((r) => r.row.id === orally.id)!
    expect(after.name).toBe("Medications: ORAL")
    const clash = resolve(review, d, { [orally.id]: "Oral" }).find((r) => r.row.id === orally.id)!
    expect(clash.status).toBe("look")
  })

  it("leaves rows out in bulk and puts one back", () => {
    const ids = review.rows.slice(0, 3).map((r) => r.id)
    const d = leaveOut(review, {}, ids)
    expect(resolve(review, d).slice(0, 3).every((r) => r.status === "left-out")).toBe(true)
    const back = clearDecisions(d, ids[0])
    expect(resolve(review, back)[0].status).not.toBe("left-out")
  })

  it("re-importing into a library that already holds the list marks the repeats", () => {
    const already: LibrarySkill[] = HGTC_ROWS.map((r) => ({ id: r.id, name: r.name, configured: true }))
    const again = buildReview(text, already)
    expect(Object.values(again.library).filter((m) => m.match === "same").length).toBeGreaterThanOrEqual(150)
  })
})

describe("the large sample", () => {
  it("holds about 600 skill rows and resolves after bulk suggestions", () => {
    const review = buildReview(buildSampleText("large"), LIB)
    const readable = review.rows.filter((r) => !r.unreadable).length
    expect(readable).toBeGreaterThanOrEqual(600)
    const resolved = resolve(review, applySuggestions(review, {}, LIB))
    expect(resolved.filter((r) => r.status === "look")).toEqual([])
  })
})

describe("screen helpers (skill-setup-journey 02 section 3)", () => {
  const review = buildReview(buildSampleText("standard"), LIB)

  it("renders the engine figures the screens quote: 156 read, 16 need a decision, 4 repeats, 2 unreadable", () => {
    const resolved = resolve(review, {})
    const s = summarize(review, resolved)
    expect([s.read, linesLeft(resolved), s.duplicates, s.unreadable]).toEqual([156, 16, 4, 2])
  })

  it("lists each line that needs a decision once, in fix order, and counts lines not decisions", () => {
    const groups = fixGroups(review, {})
    expect(groups.map((g) => g.kind)).toEqual(FIX_ORDER.filter((k) => groups.some((g) => g.kind === k)))
    expect(groups[0].kind).toBe("unread")
    const lines = groups.flatMap((g) => g.rows.map((r) => r.id))
    expect(new Set(lines).size).toBe(lines.length)
    expect(lines.length).toBe(16)
    expect(groups.reduce((t, g) => t + g.open, 0)).toBe(16)
    const after = fixGroups(review, applySuggestions(review, {}, LIB))
    expect(after.every((g) => g.open === 0)).toBe(true)
  })

  it("never shows replacement glyphs: an unreadable line with no letters reads as null", () => {
    const bad = review.rows.filter((r) => r.unreadable)
    expect(bad.map((r) => readableText(r))).toEqual([null, "pt teaching re: cath care (handwr"])
  })

  it("groups what was read by the file's categories with the lines to decide first", () => {
    const cats = categoriesOf(resolve(review, {}))
    expect(cats.length).toBe(10)
    const nutrition = cats.find((c) => c.name === "Nutrition")!
    expect(nutrition.toDecide).toBeGreaterThan(0)
    expect(nutrition.rows.slice(0, nutrition.toDecide).every((r) => r.status === "look")).toBe(true)
  })

  it("words the confirm sentence with categories and no model", () => {
    const plan = planImport(resolve(review, applySuggestions(review, {}, LIB)))
    expect(confirmSentence(plan, "Medical-surgical nursing")).toBe(`${plan.create} skills will be added to Medical-surgical nursing, in 10 categories.`)
    expect(EXCEPTION_LABEL.section).toBe(`${IMPORT_GROUPING.category} unclear`)
  })

  it("names what is not created by reason", () => {
    const nc = notCreated(resolve(review, applySuggestions(review, {}, LIB)))
    expect(nc.joined.length).toBe(2)
    expect(nc.leftOut.length + nc.merged.length).toBe(3)
  })

  it("reads a pasted flat list as one skill per line, a colon line as a category, and keeps a checklist layout as is", () => {
    const flat = readChecklist(pasteToText("Hand washing\nBed making\nSafety:\nRestraints\n"))
    expect(flat.rows.map((r) => [r.name, r.section])).toEqual([["Hand washing", null], ["Bed making", null], ["Restraints", "Safety"]])
    const withCat = readChecklist(pasteToText("Gastric lavage\nNG tube", "Nutrition"))
    expect(withCat.rows.every((r) => r.section === "Nutrition")).toBe(true)
    const sample = buildSampleText("standard")
    expect(pasteToText(sample)).toBe(sample)
  })

  it("reads the paste hand-off payload defensively", () => {
    expect(parsePastePayload(JSON.stringify({ text: "A\nB", category: "Safety" }))).toEqual({ text: "A\nB", category: "Safety" })
    expect(parsePastePayload("not json")).toBeNull()
    expect(parsePastePayload(JSON.stringify({ text: "  " }))).toBeNull()
    expect(parsePastePayload(null)).toBeNull()
  })

  it("defaults the destination to the program's default list", () => {
    expect(TARGET_LABEL[DEFAULT_LIST]).toBe("Medical-surgical nursing")
  })
})

describe("helpers", () => {
  it("scores similarity on words", () => {
    expect(similarity("Sterile dressing", "Sterile dressing change")).toBeCloseTo(2 / 3)
    expect(similarity("Oral", "Rectal")).toBe(0)
  })

  it("ignores wrapped and unreadable lines when looking for repeats", () => {
    const r = readChecklist("Safety\n  Hand washing\n  Hand washing\n").rows
    expect(Object.keys(findDuplicates(r, []).file).length).toBe(1)
  })

  it("lists every target with its count and never preselects one", () => {
    const t = importTargets(buildHero().skills)
    expect(t.map((x) => x.id)).toContain("adn-hgtc")
    expect(t.find((x) => x.id === "bsn-med-surg")!.count).toBe(LIB.length)
  })

  it("plans a starting-point copy and names the repeats", () => {
    const sp = startingPoints()
    expect(sp[0].skills.length).toBe(154)
    const bsn = sp.find((p) => p.id === "bsn-med-surg")!
    const plan = copyPlan(bsn, LIB, false)
    expect(plan.repeats).toEqual(["Oral medication administration", "Vital signs and early warning score"])
    expect(plan.copy).toBe(bsn.skills.length - 2)
    expect(copyPlan(bsn, LIB, true).copy).toBe(bsn.skills.length)
  })
})
