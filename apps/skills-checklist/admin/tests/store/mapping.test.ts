import { describe, expect, it } from "vitest"
import * as S from "@/lib/store"
import { SCENARIO } from "@/lib/seed"
import { must, seed } from "./helpers"

describe("course mapping (CM-01..CM-08)", () => {
  it("locates offerings by search and by cohort, term, academic year and professional year (CM-02)", () => {
    const db = seed()
    expect(S.listOfferings(db)).toHaveLength(14)
    expect(S.listOfferings(db, { q: "practicum" }).every((r) => r.offering.name === "Clinical Practicum")).toBe(true)
    expect(S.listOfferings(db, { cohortId: "coh-bsn27" }).length).toBeGreaterThan(0)
    expect(S.listOfferings(db, { term: "Summer" }).every((r) => r.offering.term === "Summer")).toBe(true)
    expect(S.listOfferings(db, { academicYear: "2025-2026" })).toHaveLength(1)
    expect(S.listOfferings(db, { professionalYear: 1 }).every((r) => r.offering.professionalYear === 1)).toBe(true)
  })

  it("shows mapped and mandatory counts per offering (CM-04)", () => {
    const row = S.listOfferings(seed()).find((r) => r.offering.id === "off-350-f26")!
    expect(row).toMatchObject({ mapped: 5, mandatory: 4 })
  })

  it("only configured, active skills can be mapped (IM-09, SL-11)", () => {
    const db = seed()
    expect(S.mapSkill(db, { offeringId: "off-301-s27", skillId: "sk-ng" })).toMatchObject({ ok: false, error: { code: "skillNotUsable" } })
    const off = must(S.setSkillActive(db, "sk-recon", false)).db
    expect(S.mapSkill(off, { offeringId: "off-301-s27", skillId: "sk-recon" })).toMatchObject({ ok: false })
    const m = S.offeringMapping(db, "off-301-s27")
    expect(m.unconfiguredHidden).toBe(2)
    expect(m.rows.some((r) => r.skill.id === "sk-ng")).toBe(false)
  })

  it("marks a skill mandatory or non-mandatory per offering and the level may differ between offerings (CM-03, CM-06)", () => {
    let db = seed()
    db = must(S.mapSkill(db, { offeringId: "off-301-s27", skillId: "sk-iv" })).db
    expect(db.offeringSkillMaps.find((m) => m.offeringId === "off-301-s27" && m.skillId === "sk-iv")!.requirement).toBe("mandatory") // default
    db = must(S.setRequirement(db, { offeringId: "off-301-s27", skillId: "sk-iv", requirement: "nonMandatory" })).db
    const req = (o: string) => db.offeringSkillMaps.find((m) => m.offeringId === o && m.skillId === "sk-iv")!.requirement
    expect(req("off-301-s27")).toBe("nonMandatory")
    expect(req("off-350-f26")).toBe("mandatory")
  })

  it("lists the other offerings a skill is mapped in; one student record is shared across courses (CM-07)", () => {
    const row = S.offeringMapping(seed(), "off-350-f26").rows.find((r) => r.skill.id === "sk-iv")!
    expect(row.alsoMappedIn.map((x) => x.offeringId)).toEqual(expect.arrayContaining(["off-350-f25", "off-301-f26"]))
  })

  it("supports the entry mode from S-04: offerings where one skill is mapped", () => {
    const rows = S.listOfferings(seed(), { skillId: "sk-wound" })
    expect(rows.map((r) => r.offering.id).sort()).toEqual(["off-350-f25", "off-350-f26"])
  })

  it("unmapping never touches evidence (CM-05, CM-07)", () => {
    const db = seed()
    const before = S.evidenceLedger(db, SCENARIO.noah, "sk-iv").length
    const r = must(S.unmapSkill(db, { offeringId: "off-350-f26", skillId: "sk-iv" }))
    expect(S.evidenceLedger(r.db, SCENARIO.noah, "sk-iv")).toHaveLength(before)
    expect(S.unmapSkill(r.db, { offeringId: "off-350-f26", skillId: "sk-iv" })).toMatchObject({ ok: false })
  })

  it("copyMappings copies only usable skills and commits to no inheritance model (OD-01 seam)", () => {
    const db = seed()
    const r = must(S.copyMappings(db, { fromOfferingId: "off-350-f26", toOfferingId: "off-350-s27" }))
    expect(r.value.copied).toBe(5)
    expect(S.listOfferings(r.db).find((x) => x.offering.id === "off-350-s27")!.mapped).toBe(5)
  })
})
