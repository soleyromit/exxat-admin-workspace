import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { labState } from "@/lib/lab/reviewer"
import { coverage, currentTermId, filterSkillOfferings, offeringRows, offeringsForSkill, resolvedLevels, setLevel, skillReach, skillRowsFor, EMPTY_MAPPING_OVERLAY } from "@/lib/lab/mapping"
import { facts } from "@/lib/v2/facts"

const s = labState(createSeed())
const term = currentTermId(s)

describe("SL-11: deactivated skills are withdrawn from course mapping, evidence kept", () => {
  // REQ SL-11: "Deactivating a skill withdraws it from course mapping, from student selection and from reporting scope, while
  // retaining evidence already recorded against it."
  const inactive = s.skills.filter((k) => k.active === false)
  const offs = (s.offerings ?? []).filter((o) => o.termId === term)
  it("the seed carries deactivated skills that still have stored mapping rows (the case under test)", () => {
    expect(inactive.map((k) => k.name).sort()).toEqual(["Stool", "Urine: Sterile Urine"])
    expect(s.mappings.some((m) => inactive.some((k) => k.id === m.skillId))).toBe(true)
  })
  it("no offering resolves a level for a deactivated skill, in any layer", () => {
    for (const off of offs) for (const k of inactive) expect(resolvedLevels(s, EMPTY_MAPPING_OVERLAY, off).has(k.id)).toBe(false)
  })
  it("an offering's skill list does not offer them (variant A)", () => {
    for (const off of offs) {
      const ids = new Set(skillRowsFor(s, EMPTY_MAPPING_OVERLAY, off).map((r) => r.id))
      for (const k of inactive) expect(ids.has(k.id)).toBe(false)
    }
  })
  it("the skill-first list (variant B) and the coverage matrix leave them out", () => {
    const reach = new Set(skillReach(s, EMPTY_MAPPING_OVERLAY, term).map((r) => r.id))
    const cov = new Set(coverage(s, EMPTY_MAPPING_OVERLAY, term).rows.map((r) => r.id))
    for (const k of inactive) {
      expect(reach.has(k.id)).toBe(false)
      expect(cov.has(k.id)).toBe(false)
    }
  })
  it("setting a level on one is refused with the reason, and a stale overlay edit is ignored", () => {
    const k = inactive[0]
    const r = setLevel(s, EMPTY_MAPPING_OVERLAY, offs[0].id, k.id, "optional")
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/inactive/i)
    expect(resolvedLevels(s, { [offs[0].id]: { [k.id]: "mandatory" } }, offs[0]).has(k.id)).toBe(false)
  })
  it("the skills and their stored mapping rows are kept (nothing is deleted)", () => {
    for (const k of inactive) expect(s.skills.some((x) => x.id === k.id)).toBe(true)
    expect(s.mappings.filter((m) => inactive.some((k) => k.id === m.skillId)).length).toBeGreaterThan(0)
  })
  it("offering counts drop by exactly the deactivated skills they carried (NUR 101: 138 mapped, 25 mandatory)", () => {
    const nur101 = offeringRows(s).find((r) => r.termId === term && r.code === "NUR 101")!
    expect(nur101.mapped).toBe(138)
    expect(nur101.mandatory).toBe(25)
  })
  it("shared facts are unchanged by the mapping filter", () => {
    expect(facts(s).skillsInactive).toBe(inactive.length)
  })
})

describe("CM-02 / CM-04 in the skill-first view (variant B)", () => {
  const skill = skillReach(s, EMPTY_MAPPING_OVERLAY, term).find((r) => r.configured && r.carriers > 1)!
  const rows = offeringsForSkill(s, EMPTY_MAPPING_OVERLAY, skill.id, term)
  it("each offering row carries the offering's own mapped and mandatory counts, equal to the offerings list (CM-04)", () => {
    const byId = new Map(offeringRows(s).map((r) => [r.id, r]))
    expect(rows.length).toBeGreaterThan(0)
    for (const r of rows) {
      expect(r.mapped).toBe(byId.get(r.id)!.mapped)
      expect(r.mandatory).toBe(byId.get(r.id)!.mandatory)
    }
  })
  it("offerings are found by search (incl. academic year), cohort and professional year (CM-02)", () => {
    const r0 = rows[0]
    const byCohort = filterSkillOfferings(rows, { q: "", cohort: r0.cohortId, year: "" })
    expect(byCohort.length).toBeGreaterThan(0)
    expect(byCohort.every((r) => r.cohortId === r0.cohortId)).toBe(true)
    expect(filterSkillOfferings(rows, { q: "", cohort: "", year: String(r0.professionalYear) }).every((r) => r.professionalYear === r0.professionalYear)).toBe(true)
    expect(filterSkillOfferings(rows, { q: r0.academicYear, cohort: "", year: "" }).length).toBeGreaterThan(0)
    expect(filterSkillOfferings(rows, { q: r0.code.toLowerCase(), cohort: "", year: "" }).some((r) => r.id === r0.id)).toBe(true)
    expect(filterSkillOfferings(rows, { q: "zzz-no-such", cohort: "", year: "" })).toEqual([])
  })
})
