// @vitest-environment node
// IM-04 (names, descriptions and grouping), IM-07 (headings as categories), IM-08 (never drop silently), IM-13 (draft only).
// Answers below are SYNTHETIC: hand-authored probabilities that exercise OUR thresholds and assembly, not evidence about the model.
import { describe, expect, it } from "vitest"
import { classifyByRules } from "@/lib/import-ai/rules"
import { assembleInterpretation, kindVerdict } from "@/lib/import-ai/assemble"
import { IMPORT_THRESHOLDS as T } from "@/lib/import-ai/thresholds"
import type { CandidateAnswer } from "@/lib/import-ai/types"

const kind = (skill: number, head: number, other: number, confidence: number): CandidateAnswer["kind"] => ({ skill, section_heading: head, other, confidence })
const META = { mode: "ai" as const }
const asm = (text: string, answers: Array<[number, CandidateAnswer]>) => assembleInterpretation(classifyByRules({ text, sourceName: "pasted list" }), new Map(answers), META)

describe("IM-04 / IM-07 / IM-08: Stage 1 rules settle what they can before any model is asked", () => {
  it("IM-08, B3: a line with no letters is never a candidate; it is unread with its original text", () => {
    const items = classifyByRules({ text: "-----\n12345\nWound care", sourceName: "pasted list" })
    expect(items.map((i) => i.kind)).toEqual(["unread", "unread", "ambiguous"])
    expect(items[0]).toMatchObject({ kind: "unread", reason: "unrecognised", raw: "-----", location: "Line 1" })
  })

  it("IM-07, B4: an ALL-CAPS line with items beneath it is a category for them; with nothing beneath it stays unread", () => {
    const items = classifyByRules({ text: "RESPIRATORY SKILLS\nSuction\nOxygen therapy\n\nTRAILING HEADING", sourceName: "pasted list" })
    expect(items[0]).toMatchObject({ kind: "category", categoryName: "RESPIRATORY SKILLS", by: "allcaps" })
    expect(items[1]).toMatchObject({ kind: "ambiguous", name: "Suction", categoryName: "RESPIRATORY SKILLS" })
    expect(items[3]).toMatchObject({ kind: "unread", reason: "heading" })
  })

  it("IM-07: markdown and colon headings are categories; Section/Part lines are unread headings (IM-08)", () => {
    const items = classifyByRules({ text: "# Wound skills\nDress a wound\nMedication skills:\nGive an injection\nSection 2 - Advanced", sourceName: "pasted list" })
    expect(items.map((i) => i.kind)).toEqual(["category", "ambiguous", "category", "ambiguous", "unread"])
    expect(items[1]).toMatchObject({ categoryName: "Wound skills" })
    expect(items[3]).toMatchObject({ categoryName: "Medication skills" })
  })

  it("IM-04: a structured CSV row is settled by its columns (skill kind, never asked); plain list lines are ambiguous", () => {
    const csv = classifyByRules({ text: "Skill,Description,Category\nSuction,Clear the airway,Respiratory", sourceName: "x.csv", skipHeader: true })
    expect(csv).toHaveLength(1)
    expect(csv[0]).toMatchObject({ kind: "skill", name: "Suction", description: "Clear the airway", categoryName: "Respiratory" })
    const plain = classifyByRules({ text: "1) Foley catheter insertion\n2. Wound care - clean and dress", sourceName: "pasted list" })
    expect(plain.map((i) => i.kind)).toEqual(["ambiguous", "ambiguous"])
    expect(plain[1]).toMatchObject({ name: "Wound care", description: "clean and dress" })
  })
})

describe("IM-13: thresholds decide, the model never acts (kindVerdict table)", () => {
  const cases: Array<[string, CandidateAnswer["kind"], string]> = [
    ["skill at the accept boundary with enough confidence", kind(T.skillAccept, 0, 1 - T.skillAccept, T.confidence), "skill"],
    ["skill just below accept", kind(0.79, 0.01, 0.2, 0.9), "skill-cue"],
    ["skill accept but low confidence", kind(0.9, 0, 0.1, 0.59), "skill-cue"],
    ["skill at the review boundary", kind(0.5, 0, 0.5, 0.9), "skill-cue"],
    ["other wins, confident", kind(0.2, 0.1, 0.7, 0.9), "unread-unrecognised"],
    ["other wins, unsure", kind(0.2, 0.1, 0.7, 0.4), "unread-uncertain"],
    ["heading at accept with confidence", kind(0, 0.8, 0.2, 0.6), "heading"],
    ["heading below accept goes to Not read", kind(0, 0.79, 0.21, 0.9), "unread-heading"],
    ["heading at the review boundary goes to Not read", kind(0, 0.5, 0.5, 0.9), "unread-heading"],
    ["nothing reaches 0.5", kind(0.4, 0.3, 0.3, 0.9), "unread-unrecognised"],
  ]
  for (const [name, a, expected] of cases) it(name, () => expect(kindVerdict(a)).toBe(expected))
})

describe("IM-04, IM-05, IM-07, IM-08: assembly", () => {
  it("IM-08: a line the rules settled as unread stays unread whatever the answers claim", () => {
    const r = asm("-----\nSuction", [[1, { kind: kind(1, 0, 0, 1) }], [2, { kind: kind(1, 0, 0, 1) }]])
    expect(r.unread.map((u) => u.text)).toEqual(["-----"])
    expect(r.rows.map((x) => x.name)).toEqual(["Suction"])
  })

  it("IM-04: an accepted line becomes a row whose name and description are verbatim spans of the source line (select, do not generate)", () => {
    const r = asm("1) Wound care - clean and dress\n2. Suction", [[1, { kind: kind(0.95, 0, 0.05, 0.9) }], [2, { kind: kind(0.95, 0, 0.05, 0.9) }]])
    for (const row of r.rows) {
      expect(row.sourceRef).toContain(row.name)
      if (row.description) expect(row.sourceRef).toContain(row.description)
    }
    expect(r.rows[0]).toMatchObject({ name: "Wound care", description: "clean and dress", origin: "model" })
    expect(r.rows[0].cue).toBeUndefined()
  })

  it("IM-05: low confidence keeps the row WITH the cue (advice only); it is never dropped or excluded", () => {
    const r = asm("Suction", [[1, { kind: kind(0.7, 0, 0.3, 0.9) }]])
    expect(r.rows).toHaveLength(1)
    expect(r.rows[0].cue?.reasons).toEqual(["lowSkillConfidence"])
  })

  it("IM-08: a line the model says is not a skill goes to Not read with its original text and a reason", () => {
    const r = asm("Page 3 of 12\nStudents must", [[1, { kind: kind(0, 0, 1, 1) }], [2, { kind: kind(0.2, 0.1, 0.7, 0.3) }]])
    expect(r.rows).toHaveLength(0)
    expect(r.unread).toEqual([
      { text: "Page 3 of 12", reason: "unrecognised", location: "Line 1" },
      { text: "Students must", reason: "uncertain", location: "Line 2" },
    ])
  })

  it("IM-07: a model-accepted heading becomes the category for the rows after it and is not a skill", () => {
    const r = asm("Respiratory care\nSuction\nOxygen", [[1, { kind: kind(0.05, 0.93, 0.02, 0.9) }], [2, { kind: kind(0.95, 0, 0.05, 0.9) }], [3, { kind: kind(0.95, 0, 0.05, 0.9) }]])
    expect(r.rows.map((x) => [x.name, x.categoryName])).toEqual([["Suction", "Respiratory care"], ["Oxygen", "Respiratory care"]])
    expect(r.unread).toHaveLength(0)
  })

  it("detail: at the merge threshold the line joins the skill above as a verbatim span and makes no row", () => {
    const r = asm("Insert a peripheral IV catheter\nUse the smallest gauge", [[1, { kind: kind(0.95, 0, 0.05, 0.9) }], [2, { kind: kind(0.7, 0, 0.3, 0.7), detail: T.detailMerge }]])
    expect(r.rows).toHaveLength(1)
    expect(r.rows[0].description).toBe("Use the smallest gauge")
    expect(r.rows[0].sourceRef).toBe("Insert a peripheral IV catheter + Use the smallest gauge")
  })

  it("detail: between the cue and merge thresholds the row stays and carries maybeDetail; below it no cue", () => {
    const base = (d: number) => asm("Suction\nOxygen therapy", [[1, { kind: kind(0.95, 0, 0.05, 0.9) }], [2, { kind: kind(0.95, 0, 0.05, 0.9), detail: d }]])
    expect(base(0.55).rows[1].cue?.reasons).toEqual(["maybeDetail"])
    expect(base(0.3).rows[1].cue).toBeUndefined()
    expect(base(0.55).rows).toHaveLength(2)
  })

  it("detail: a first line has nothing above it to join", () => {
    const r = asm("Suction", [[1, { kind: kind(0.95, 0, 0.05, 0.9), detail: 0.95 }]])
    expect(r.rows).toHaveLength(1)
  })

  it("category: the model's pick wins only with enough confidence and differs from the position, with the categoryUncertain cue", () => {
    const text = "RESPIRATORY SKILLS\nSuction\nWOUND SKILLS\nDress a wound"
    const mk = (cat: CandidateAnswer["category"]) => asm(text, [[2, { kind: kind(0.95, 0, 0.05, 0.9), category: cat }], [4, { kind: kind(0.95, 0, 0.05, 0.9) }]])
    const picked = mk({ heading: "WOUND SKILLS", confidence: 0.9 })
    expect(picked.rows[0]).toMatchObject({ name: "Suction", categoryName: "WOUND SKILLS" })
    expect(picked.rows[0].cue?.reasons).toEqual(["categoryUncertain"])
    expect(mk({ heading: "WOUND SKILLS", confidence: 0.5 }).rows[0].categoryName).toBe("RESPIRATORY SKILLS")
    expect(mk({ heading: null, confidence: 0.9 }).rows[0].categoryName).toBe("RESPIRATORY SKILLS")
    expect(mk({ heading: "RESPIRATORY SKILLS", confidence: 0.9 }).rows[0].cue).toBeUndefined()
  })

  it("rules win: an ALL-CAPS heading the model reads as a skill keeps its category and flags the first row below it", () => {
    const text = "RESPIRATORY SKILLS\nSuction\nOxygen"
    const r = asm(text, [[1, { kind: kind(0.95, 0, 0.05, 0.9) }], [2, { kind: kind(0.95, 0, 0.05, 0.9) }], [3, { kind: kind(0.95, 0, 0.05, 0.9) }]])
    expect(r.rows.map((x) => x.categoryName)).toEqual(["RESPIRATORY SKILLS", "RESPIRATORY SKILLS"])
    expect(r.rows[0].cue?.reasons).toEqual(["rulesAndModelDisagree"])
    expect(r.rows[1].cue).toBeUndefined()
  })

  it("a line the model was asked about but did not answer is kept with the lowSkillConfidence cue (never silently dropped)", () => {
    const r = asm("Suction", [])
    expect(r.rows[0].cue?.reasons).toEqual(["lowSkillConfidence"])
  })

  it("the result is independent of the order the answers arrive in", () => {
    const text = "Suction\nOxygen\nWound care"
    const a = [1, 2, 3].map((n) => [n, { kind: kind(0.9, 0, 0.1, 0.9) }] as [number, CandidateAnswer])
    expect(asm(text, a)).toEqual(asm(text, [...a].reverse()))
  })

  it("IM-13: the proposal carries cue reasons only: no probabilities, confidences or percentages reach the browser", () => {
    const r = asm("Suction\nPage 3", [[1, { kind: kind(0.7, 0, 0.3, 0.9) }], [2, { kind: kind(0, 0, 1, 1) }]])
    expect(JSON.stringify(r)).not.toMatch(/probab|confidence|0\.\d|%/)
  })
})
