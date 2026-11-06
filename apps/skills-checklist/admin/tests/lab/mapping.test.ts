import { describe, expect, it } from "vitest"
import { createGeneratedSeed as createSeed } from "@/lib/v2/seed"
import { isConfigured } from "@/lib/v2/population"
import { labState } from "@/lib/lab/reviewer"
import {
  academicYear,
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
  levelOf,
  levelSourceOf,
  resolvedLevels,
  EMPTY_MAPPING_OVERLAY,
} from "@/lib/lab/mapping"
import { assign, cohortGroupId, seedLists, type SkillList } from "@/lib/lab/lists"
import { facts } from "@/lib/v2/facts"

const s = labState(createSeed())
const term = currentTermId(s)
/** The seeded lists with no cohort assigned: only the explicit layer (the course mapping rows) applies. */
const unassigned: SkillList[] = seedLists(s).map((l) => ({ ...l, groupIds: [] }))

describe("course offerings at scale", () => {
  const rows = offeringRows(s, EMPTY_MAPPING_OVERLAY)
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
  it("mapped is mandatory plus recommended; a stored Optional reads as Not mapped (D-L76)", () => {
    for (const r of rows) expect(r.mandatory + r.recommended).toBe(r.mapped)
    expect(rows.reduce((n, r) => n + r.recommended, 0)).toBeGreaterThan(0)
    const nur101 = s.mappings.find((m) => m.courseId === "crs-nur101" && m.level === "optional")
    if (nur101) {
      const off = (s.offerings ?? []).find((o) => o.courseId === "crs-nur101")!
      expect(levelOf(s, EMPTY_MAPPING_OVERLAY, off, nur101.skillId)).toBe("none")
    }
  })
})

describe("mapping one offering", () => {
  const off = (s.offerings ?? []).find((o) => o.termId === term)!
  it("lists every skill in a stable order, unconfigured ones last and marked", () => {
    const r = skillRowsFor(s, EMPTY_MAPPING_OVERLAY, off)
    expect(r.length).toBe(176) // 178 in the library less the 2 deactivated (REQ SL-11)
    // The generated data, before the sample program's save: no model yet, or not put into use.
    const unconfigured = r.filter((x) => !x.configured).length
    expect(unconfigured).toBeGreaterThan(0)
    expect(r.slice(-unconfigured).every((x) => !x.configured)).toBe(true)
  })
  it("refuses to map an unconfigured skill and allows unmapping it", () => {
    const unconf = s.skills.find((k) => !isConfigured(k))!
    const r = setLevel(s, EMPTY_MAPPING_OVERLAY, off.id, unconf.id, "mandatory")
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/Configure/)
    expect(setLevel(s, EMPTY_MAPPING_OVERLAY, off.id, unconf.id, "none").ok).toBe(true)
  })
  it("lets the same skill differ between offerings and changes only the edited offering", () => {
    const k = s.skills.find((x) => isConfigured(x))!
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

describe("in no course (N-13)", () => {
  const reach = skillReach(s, EMPTY_MAPPING_OVERLAY, term, unassigned)
  it("the skill view reads every active skill, and each skill's offerings", () => {
    expect(reach.length).toBe(176) // deactivated skills are withdrawn (REQ SL-11)
    const k = reach.find((r) => r.carriers > 0)!
    const offs = offeringsForSkill(s, EMPTY_MAPPING_OVERLAY, k.id, term, false)
    expect(offs.length).toBe(9)
    expect(offs.filter((o) => o.level !== "none").length).toBe(k.carriers)
    expect(offeringsForSkill(s, EMPTY_MAPPING_OVERLAY, k.id, term, true).length).toBe(22)
  })
  it("mapping a required skill in no course closes the gap", () => {
    // "Required" means on a list assigned to a cohort with an offering this term: a group with no list reads as unassigned (D-L103).
    const assigned = assign(unassigned, "list-competencies", cohortGroupId("BSN 2027"))
    const gap = skillReach(s, EMPTY_MAPPING_OVERLAY, term, assigned).find((r) => r.required && r.configured && r.carriers === 0)!
    const off = (s.offerings ?? []).find((o) => o.termId === term && (s.courses ?? []).find((c) => c.id === o.courseId)?.kind !== "didactic")!
    const r = setLevel(s, EMPTY_MAPPING_OVERLAY, off.id, gap.id, "recommended")
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(skillReach(s, r.overlay, term, assigned).find((x) => x.id === gap.id)!.carriers).toBe(1)
  })
})

describe("a list gives no level: its skill is Not mapped until someone sets it (D-L76, replacing D-X27)", () => {
  const BSN27 = (s.cohorts ?? []).find((c) => c.name === "BSN 2027")!
  const clinical = (s.offerings ?? []).filter((o) => o.cohortId === BSN27.id && (s.courses ?? []).find((c) => c.id === o.courseId)?.kind !== "didactic")
  const assigned = assign(unassigned, "list-competencies", cohortGroupId("BSN 2027"))
  const list = assigned.find((l) => l.id === "list-competencies")!
  const explicitIn = (courseId: string) => new Set(s.mappings.filter((m) => m.courseId === courseId && (m.level === "mandatory" || m.level === "recommended")).map((m) => m.skillId))

  it("assigning a list changes no level on any offering", () => {
    expect(offeringRows(s, EMPTY_MAPPING_OVERLAY).map((r) => r.mapped)).toEqual(offeringRows({ ...s, listEdits: { created: [], edits: { "list-competencies": { groupIds: list.groupIds } } } }, EMPTY_MAPPING_OVERLAY).map((r) => r.mapped))
    const off = clinical[0]!
    const free = list.skillIds.find((id) => !explicitIn(off.courseId).has(id))!
    expect(levelOf(s, EMPTY_MAPPING_OVERLAY, off, free)).toBe("none")
    expect(skillRowsFor(s, EMPTY_MAPPING_OVERLAY, off, assigned).find((r) => r.id === free)).toMatchObject({ level: "none", required: true })
  })

  it("an offering edit sets it, and setting it back is no edit", () => {
    const off = clinical[0]!
    const free = list.skillIds.find((id) => !explicitIn(off.courseId).has(id))!
    const r = setLevel(s, EMPTY_MAPPING_OVERLAY, off.id, free, "recommended")
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(levelOf(s, r.overlay, off, free)).toBe("recommended")
    expect(levelSourceOf(s, r.overlay, off, free)).toBe("overlay")
    const none = setLevel(s, EMPTY_MAPPING_OVERLAY, off.id, free, "none")
    if (none.ok) expect(resolvedLevels(s, none.overlay, off).has(free) ? resolvedLevels(s, none.overlay, off).get(free)!.source : null).not.toBe("overlay")
  })

  it("leaves every v2 fact unchanged: facts never read lists", () => {
    const f = facts(s)
    offeringRows(s, EMPTY_MAPPING_OVERLAY)
    expect(facts(s)).toBe(f)
  })
})
