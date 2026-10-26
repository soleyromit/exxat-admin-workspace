import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { labState } from "@/lib/lab/reviewer"
import {
  academicYear,
  coverage,
  currentTermId,
  filterOfferings,
  offeringById,
  offeringRows,
  offeringsForSkill,
  professionalYear,
  setLevel,
  setLevels,
  skillReach,
  skillRowsFor,
  EMPTY_MAPPING_OVERLAY,
} from "@/lib/lab/mapping"

const s = labState(createSeed())
const term = currentTermId(s)

describe("course offerings at scale", () => {
  const rows = offeringRows(s)
  it("lists 110 offerings, each with course, term, academic year, professional year and cohort", () => {
    expect(rows.length).toBe(110)
    for (const r of rows) {
      expect(r.code).toMatch(/\w/)
      expect(r.academicYear).toMatch(/^\d{4}-\d{2}$/)
      expect(r.professionalYear).toBeGreaterThanOrEqual(1)
      expect(r.professionalYear).toBeLessThanOrEqual(4)
      expect(r.cohort).toMatch(/BSN/)
    }
  })
  it("derives academic and professional years", () => {
    expect(academicYear("2026-08-24")).toBe("2026-27")
    expect(academicYear("2027-01-11")).toBe("2026-27")
    expect(professionalYear("2028", "2026-27")).toBe(2)
    expect(professionalYear("2026", "2026-27")).toBe(4)
  })
  it("finds offerings by search, term, cohort and year on the whole set", () => {
    // Clinical only by default (CALL 10-26): 9 clinical of 22 courses per term; the 110 offerings themselves are unchanged.
    expect(rows.length).toBe(110)
    const inTerm = filterOfferings(rows, { q: "", term, cohort: "", year: "" })
    expect(inTerm.length).toBe(9)
    expect(inTerm.every((r) => r.kind === "clinical")).toBe(true)
    expect(filterOfferings(rows, { q: "", term, cohort: "", year: "", didactic: true }).length).toBe(22)
    expect(filterOfferings(rows, { q: "nur 101", term: "", cohort: "", year: "" }).length).toBe(5)
    expect(filterOfferings(rows, { q: "2026-27", term: "", cohort: "", year: "", didactic: true }).length).toBe(44)
    const y = String(inTerm[0]!.professionalYear)
    expect(filterOfferings(rows, { q: "", term, cohort: "", year: y }).every((r) => String(r.professionalYear) === y)).toBe(true)
  })
  it("shows mapped and mandatory counts per offering", () => {
    const nurs350 = rows.find((r) => r.code === "NURS 350" && r.termId === term)!
    expect(nurs350.mapped).toBeGreaterThan(0)
    expect(nurs350.mandatory).toBeLessThanOrEqual(nurs350.mapped)
  })
  it("splits mapped into three levels that add up, and mandatory never changed (CALL 10-26)", () => {
    for (const r of rows) expect(r.mandatory + r.recommended + r.optional).toBe(r.mapped)
    const sum = (k: "mandatory" | "recommended" | "optional") => rows.reduce((t, r) => t + r[k], 0)
    expect(sum("recommended")).toBeGreaterThan(0)
    expect(sum("optional")).toBeGreaterThan(0)
    // About half of the old non-mandatory rows became recommended, by position (1st, 3rd, 5th... per course).
    const ratio = sum("recommended") / (sum("recommended") + sum("optional"))
    expect(ratio).toBeGreaterThan(0.45)
    expect(ratio).toBeLessThan(0.56)
    // Didactic courses carry no mandatory skill, so "Clinical only" leaves every "Required this term" figure as it was.
    expect(rows.filter((r) => r.kind === "didactic").every((r) => r.mandatory === 0)).toBe(true)
  })
})

describe("mapping one offering", () => {
  const off = (s.offerings ?? []).find((o) => o.termId === term)!
  it("lists every skill in a stable order, unconfigured ones last and marked", () => {
    const r = skillRowsFor(s, EMPTY_MAPPING_OVERLAY, off)
    expect(r.length).toBe(178)
    expect(r.slice(-16).every((x) => !x.configured)).toBe(true)
    expect(r.filter((x) => !x.configured).length).toBe(16)
  })
  it("refuses to map an unconfigured skill and allows unmapping it", () => {
    const unconf = s.skills.find((k) => !k.configured)!
    const r = setLevel(s, EMPTY_MAPPING_OVERLAY, off.id, unconf.id, "mandatory")
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/Configure/)
    expect(setLevel(s, EMPTY_MAPPING_OVERLAY, off.id, unconf.id, "none").ok).toBe(true)
  })
  it("lets the same skill differ between offerings and changes only the edited offering", () => {
    const k = s.skills.find((x) => x.configured)!
    const other = (s.offerings ?? []).find((o) => o.courseId === off.courseId && o.id !== off.id)!
    const r = setLevel(s, EMPTY_MAPPING_OVERLAY, off.id, k.id, "mandatory")
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const a = skillRowsFor(s, r.overlay, off).find((x) => x.id === k.id)!
    const b = skillRowsFor(s, r.overlay, other).find((x) => x.id === k.id)!
    expect(a.level).toBe("mandatory")
    expect(b.level).not.toBe("mandatory")
    const counts = offeringRows(s, r.overlay).find((x) => x.id === off.id)!
    expect(counts.mandatory).toBeGreaterThanOrEqual(1)
  })
  it("bulk sets levels and skips unconfigured skills", () => {
    const ids = s.skills.slice(0, 40).map((k) => k.id)
    const r = setLevels(s, EMPTY_MAPPING_OVERLAY, off.id, ids, "recommended")
    expect(r.changed + r.skipped).toBe(40)
  })
})

describe("coverage of required skills (N-13)", () => {
  const c = coverage(s, EMPTY_MAPPING_OVERLAY, term)
  it("checks the default list's required skills against the term's offerings", () => {
    expect(c.required).toBe(52)
    // Clinical courses only by default (CALL 10-26): 9 of the 22 courses are clinical; including didactic shows all 22.
    expect(c.columns.length).toBe(9)
    expect(coverage(s, EMPTY_MAPPING_OVERLAY, term, undefined, undefined, true).columns.length).toBe(22)
    expect(c.rows.length).toBe(52)
  })
  it("names required skills in no course, and mapping one closes the gap", () => {
    expect(c.gaps.length).toBeGreaterThan(0)
    const gap = c.gaps.find((g) => g.configured)!
    const off = offeringById(s, c.columns[0]!.offeringId)!
    const r = setLevel(s, EMPTY_MAPPING_OVERLAY, off.id, gap.id, "optional")
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(coverage(s, r.overlay, term).gaps.some((g) => g.id === gap.id)).toBe(false)
  })
  it("skill-centric view finds the same required skills in no course as coverage", () => {
    const reach = skillReach(s, EMPTY_MAPPING_OVERLAY, term)
    expect(reach.length).toBe(178)
    const gaps = reach.filter((r) => r.required && r.carriers === 0).map((r) => r.id).sort()
    expect(gaps).toEqual(c.gaps.map((g) => g.id).sort())
    const k = reach.find((r) => r.carriers > 0)!
    const offs = offeringsForSkill(s, EMPTY_MAPPING_OVERLAY, k.id, term)
    expect(offs.length).toBe(9)
    expect(offs.filter((o) => o.level !== "none").length).toBe(k.carriers)
    expect(offeringsForSkill(s, EMPTY_MAPPING_OVERLAY, k.id, term, true).length).toBe(22)
  })
})
