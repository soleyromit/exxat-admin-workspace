import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { isConfigured } from "@/lib/v2/population"
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
  levelOf,
  levelSourceOf,
  listBaseLevels,
  resolvedLevels,
  EMPTY_MAPPING_OVERLAY,
} from "@/lib/lab/mapping"
import { assign, cohortGroupId, seedLists, unassign, type SkillList } from "@/lib/lab/lists"
import { facts } from "@/lib/v2/facts"
import { mapBlockReason } from "@/lib/v2/coverage"

const s = labState(createSeed())
const term = currentTermId(s)
/** The seeded lists with no cohort assigned: only the explicit layer (the course mapping rows) applies. */
const unassigned: SkillList[] = seedLists(s).map((l) => ({ ...l, groupIds: [] }))

describe("course offerings at scale", () => {
  // The explicit layer (seeded course mapping rows); inheritance from lists is tested in its own block below.
  const rows = offeringRows(s, EMPTY_MAPPING_OVERLAY, unassigned)
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
    expect(r.length).toBe(176) // 178 in the library less the 2 deactivated (REQ SL-11)
    // 16 never configured plus 15 that hold a rule never saved for use (Not configured with Draft saved, decision D-X31).
    expect(r.slice(-31).every((x) => !x.configured)).toBe(true)
    expect(r.filter((x) => !x.configured).length).toBe(31)
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

describe("coverage of required skills (N-13), explicit layer only", () => {
  const c = coverage(s, EMPTY_MAPPING_OVERLAY, term, unassigned)
  it("checks the default list's required skills against the term's offerings", () => {
    expect(c.required).toBe(52)
    // Clinical courses only by default (CALL 10-26): 9 of the 22 courses are clinical; including didactic shows all 22.
    expect(c.columns.length).toBe(9)
    expect(coverage(s, EMPTY_MAPPING_OVERLAY, term, unassigned, undefined, true).columns.length).toBe(22)
    expect(c.rows.length).toBe(52)
  })
  it("names required skills in no course, and mapping one closes the gap", () => {
    expect(c.gaps.length).toBeGreaterThan(0)
    const gap = c.gaps.find((g) => g.configured)!
    const off = offeringById(s, c.columns[0]!.offeringId)!
    const r = setLevel(s, EMPTY_MAPPING_OVERLAY, off.id, gap.id, "optional")
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(coverage(s, r.overlay, term, unassigned).gaps.some((g) => g.id === gap.id)).toBe(false)
  })
  it("skill-centric view finds the same required skills in no course as coverage", () => {
    const reach = skillReach(s, EMPTY_MAPPING_OVERLAY, term, unassigned)
    expect(reach.length).toBe(176) // deactivated skills are withdrawn (REQ SL-11)
    const gaps = reach.filter((r) => r.required && r.carriers === 0).map((r) => r.id).sort()
    expect(gaps).toEqual(c.gaps.map((g) => g.id).sort())
    const k = reach.find((r) => r.carriers > 0)!
    const offs = offeringsForSkill(s, EMPTY_MAPPING_OVERLAY, k.id, term, false, unassigned)
    expect(offs.length).toBe(9)
    expect(offs.filter((o) => o.level !== "none").length).toBe(k.carriers)
    expect(offeringsForSkill(s, EMPTY_MAPPING_OVERLAY, k.id, term, true, unassigned).length).toBe(22)
  })
})

describe("cohort inheritance: lists give every clinical offering of the cohort a base level (decision D-X27)", () => {
  const BSN27 = (s.cohorts ?? []).find((c) => c.name === "BSN 2027")!
  const kindOf = (courseId: string) => (s.courses ?? []).find((c) => c.id === courseId)?.kind ?? "clinical"
  const bsnOffs = (s.offerings ?? []).filter((o) => o.cohortId === BSN27.id)
  const clinical = bsnOffs.filter((o) => kindOf(o.courseId) === "clinical")
  const didactic = bsnOffs.filter((o) => kindOf(o.courseId) === "didactic")
  const assigned = assign(unassigned, "list-competencies", cohortGroupId("BSN 2027"))
  const list = assigned.find((l) => l.id === "list-competencies")!
  const usable = list.skillIds.filter((id) => {
    const k = s.skills.find((x) => x.id === id)!
    return k.active !== false && isConfigured(k) && mapBlockReason(k) === null
  })
  const explicitIn = (courseId: string) => new Set(s.mappings.filter((m) => m.courseId === courseId).map((m) => m.skillId))

  it("assigning a list to BSN 2027 makes its skills available in every BSN 2027 clinical offering, marked from list", () => {
    expect(clinical.length).toBeGreaterThan(0)
    expect(usable.length).toBeGreaterThan(0)
    for (const off of clinical) {
      const explicit = explicitIn(off.courseId)
      const res = resolvedLevels(s, EMPTY_MAPPING_OVERLAY, off, assigned)
      for (const id of usable) {
        const r = res.get(id)!
        if (explicit.has(id)) expect(r.source).toBe("explicit")
        else expect([id, r.level, r.source, r.listId]).toEqual([id, "optional", "list", "list-competencies"])
      }
      const rows = skillRowsFor(s, EMPTY_MAPPING_OVERLAY, off, assigned)
      expect(rows.filter((r) => r.source === "list").length).toBe(usable.filter((id) => !explicit.has(id)).length)
    }
  })

  it("never inherits an unconfigured or deactivated skill (IM-09, D-X14)", () => {
    const off = clinical[0]!
    const base = listBaseLevels(s, off, assigned)
    for (const id of base.keys()) {
      const k = s.skills.find((x) => x.id === id)!
      expect(k.active !== false && mapBlockReason(k) === null).toBe(true)
    }
  })

  it("an explicit course level and an offering edit override the list", () => {
    const off = clinical[0]!
    const explicit = s.mappings.find((m) => m.courseId === off.courseId && list.skillIds.includes(m.skillId))
    if (explicit) expect(levelSourceOf(s, EMPTY_MAPPING_OVERLAY, off, explicit.skillId, assigned)).toBe("explicit")
    const inherited = usable.find((id) => !explicitIn(off.courseId).has(id))!
    const r = setLevel(s, EMPTY_MAPPING_OVERLAY, off.id, inherited, "recommended")
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(levelOf(s, r.overlay, off, inherited, assigned)).toBe("recommended")
    expect(levelSourceOf(s, r.overlay, off, inherited, assigned)).toBe("overlay")
    const none = setLevel(s, EMPTY_MAPPING_OVERLAY, off.id, inherited, "none")
    if (none.ok) expect(levelOf(s, none.overlay, off, inherited, assigned)).toBe("none")
  })

  it("a list's own level for a skill is the base level (mandatory only when the list says so)", () => {
    const off = clinical[0]!
    const id = usable.find((x) => !explicitIn(off.courseId).has(x))!
    const marked = assigned.map((l) => (l.id === "list-competencies" ? { ...l, levels: { [id]: "mandatory" as const } } : l))
    expect(resolvedLevels(s, EMPTY_MAPPING_OVERLAY, off, marked).get(id)).toEqual({ level: "mandatory", source: "list", listId: "list-competencies" })
    expect(levelOf(s, EMPTY_MAPPING_OVERLAY, off, id, assigned)).toBe("optional")
  })

  it("didactic offerings inherit nothing", () => {
    expect(didactic.length).toBeGreaterThan(0)
    for (const off of didactic) expect(listBaseLevels(s, off, assigned).size).toBe(0)
  })

  it("removing the assignment removes the base layer", () => {
    const removed = unassign(assigned, "list-competencies", cohortGroupId("BSN 2027"))
    for (const off of clinical) {
      expect(listBaseLevels(s, off, removed).size).toBe(0)
      expect([...resolvedLevels(s, EMPTY_MAPPING_OVERLAY, off, removed).values()].some((r) => r.source === "list")).toBe(false)
    }
  })

  it("other cohorts' offerings are untouched by a BSN 2027 assignment", () => {
    for (const off of (s.offerings ?? []).filter((o) => o.cohortId !== BSN27.id)) expect(listBaseLevels(s, off, assigned).size).toBe(0)
  })

  it("coverage and the skill view read the cohort's lists: inheritance carries required skills, and list-only ones are named", () => {
    const seeded = seedLists(s)
    const c = coverage(s, EMPTY_MAPPING_OVERLAY, term, seeded)
    // The default list is on every cohort, so every required skill on it is carried at least through the list.
    for (const r of c.rows) expect(r.carriers).toBeGreaterThanOrEqual(r.explicitCarriers)
    expect(c.listOnly.every((r) => r.explicitCarriers === 0 && r.carriers > 0)).toBe(true)
    // The skills that were in no course on the explicit layer are now carried through the list, and named as list only.
    const before = coverage(s, EMPTY_MAPPING_OVERLAY, term, unassigned).gaps.filter((g) => g.configured).map((g) => g.id)
    expect(before.length).toBeGreaterThan(0)
    for (const id of before) expect(c.listOnly.some((r) => r.id === id)).toBe(true)
    const reach = skillReach(s, EMPTY_MAPPING_OVERLAY, term, seeded)
    for (const r of c.rows) expect(reach.find((x) => x.id === r.id)!.carriers).toBe(r.carriers)
  })

  it("leaves every v2 fact unchanged: Required this term reads the explicit mandatory rows only", () => {
    // Inheritance is a lab model over V2State; facts() never reads lists, so assigning or removing one cannot move a figure.
    const f = facts(s)
    offeringRows(s, EMPTY_MAPPING_OVERLAY, assigned)
    expect(facts(s)).toBe(f)
    // And no list gives Mandatory by default, so the mandatory count of every offering is the explicit one.
    const a = offeringRows(s, EMPTY_MAPPING_OVERLAY, assigned)
    const b = offeringRows(s, EMPTY_MAPPING_OVERLAY, unassigned)
    expect(a.map((r) => r.mandatory)).toEqual(b.map((r) => r.mandatory))
  })
})
