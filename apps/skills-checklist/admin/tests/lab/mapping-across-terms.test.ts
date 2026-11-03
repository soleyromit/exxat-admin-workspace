import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { labState } from "@/lib/lab/reviewer"
import { EMPTY_MAPPING_OVERLAY, levelOf, offeringById, offeringRows, setLevelAcross, skillAcrossTerms, skillReach } from "@/lib/lab/mapping"

const s = labState(createSeed())
const skill = skillReach(s, EMPTY_MAPPING_OVERLAY, "").find((r) => r.configured)!

describe("course mapping B: one skill across every term (CALL 11-02)", () => {
  const m = skillAcrossTerms(s, EMPTY_MAPPING_OVERLAY, skill.id)
  it("shows every term as a column in date order, and every clinical offering once", () => {
    const terms = [...(s.terms ?? [])].sort((a, b) => a.start.localeCompare(b.start)).map((t) => t.id)
    expect(m.terms.map((t) => t.id)).toEqual(terms)
    const clinical = offeringRows(s).filter((r) => r.kind === "clinical")
    expect(m.offerings).toBe(clinical.length)
    const cellIds = m.rows.flatMap((r) => Object.values(r.cells).map((c) => c.id))
    expect(new Set(cellIds).size).toBe(clinical.length)
  })
  it("each cell is its own offering in its term, with the level resolved for that offering (CM-03, CM-06)", () => {
    for (const r of m.rows)
      for (const [termId, c] of Object.entries(r.cells)) {
        const off = offeringById(s, c.id)!
        expect(off.termId).toBe(termId)
        expect(off.courseId).toBe(r.id)
        expect(c.level).toBe(levelOf(s, EMPTY_MAPPING_OVERLAY, off, skill.id))
      }
  })
  it("the skill list counts every term's offerings when no term is given", () => {
    const reach = skillReach(s, EMPTY_MAPPING_OVERLAY, "").find((r) => r.id === skill.id)!
    expect(reach.carriers).toBe(m.carriers)
    expect(reach.mandatoryCarriers).toBe(m.mandatory)
  })
  it("filters narrow offerings, not terms of other courses (CM-02)", () => {
    const y = String(m.rows[0].cells[m.terms[0].id].professionalYear)
    const f = skillAcrossTerms(s, EMPTY_MAPPING_OVERLAY, skill.id, false, undefined, { q: "", cohort: "", year: y })
    expect(f.rows.flatMap((r) => Object.values(r.cells)).every((c) => String(c.professionalYear) === y)).toBe(true)
    expect(skillAcrossTerms(s, EMPTY_MAPPING_OVERLAY, skill.id, false, undefined, { q: "zzz-none", cohort: "", year: "" }).rows).toEqual([])
  })
})

describe("bulk mapping one skill to several offerings", () => {
  const m = skillAcrossTerms(s, EMPTY_MAPPING_OVERLAY, skill.id)
  const first = m.terms[0].id
  const picked = m.rows.map((r) => r.cells[first]?.id).filter((x): x is string => !!x)
  const res = setLevelAcross(s, EMPTY_MAPPING_OVERLAY, picked, skill.id, "mandatory")
  it("sets the level in each picked offering and nowhere else (no carry forward, OD-01, CM-08)", () => {
    expect(res.changed).toBe(picked.length)
    expect(res.skipped).toBe(0)
    const after = skillAcrossTerms(s, res.overlay, skill.id)
    for (const r of after.rows)
      for (const [termId, c] of Object.entries(r.cells)) {
        const before = m.rows.find((x) => x.id === r.id)!.cells[termId]
        if (termId === first) expect(c.level).toBe("mandatory")
        else expect(c.level).toBe(before.level)
      }
  })
  it("refuses an unconfigured skill and says why (IM-09)", () => {
    const raw = s.skills.find((k) => k.active !== false && !skillReach(s, EMPTY_MAPPING_OVERLAY, "").find((r) => r.id === k.id)?.configured)
    if (!raw) return
    const r = setLevelAcross(s, EMPTY_MAPPING_OVERLAY, picked, raw.id, "mandatory")
    expect(r.changed).toBe(0)
    expect(r.skipped).toBe(picked.length)
    expect(r.reason).toMatch(/Configure/)
  })
})
