import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { createSeed } from "@/lib/v2/seed"
import { labState } from "@/lib/lab/reviewer"
import { EMPTY_MAPPING_OVERLAY, filterOfferings, filterSkillOfferings, levelOf, levelRank, offeringById, offeringRows, offeringsForSkill, setLevelAcross, skillReach } from "@/lib/lab/mapping"

const s = labState(createSeed())
const skill = skillReach(s, EMPTY_MAPPING_OVERLAY, "").find((r) => r.configured)!
const rows = offeringsForSkill(s, EMPTY_MAPPING_OVERLAY, skill.id, "")

describe("course mapping per offering, no term columns (stakeholder review 2026-11-04, D-L61)", () => {
  it("each clinical offering is one row, with its own resolved level (CM-03, CM-06)", () => {
    const clinical = offeringRows(s).filter((r) => r.kind === "clinical")
    expect(rows.length).toBe(clinical.length)
    expect(new Set(rows.map((r) => r.id)).size).toBe(clinical.length)
    for (const r of rows) expect(r.level).toBe(levelOf(s, EMPTY_MAPPING_OVERLAY, offeringById(s, r.id)!, skill.id))
  })
  it("the skill list counts every term's offerings", () => {
    const reach = skillReach(s, EMPTY_MAPPING_OVERLAY, "").find((r) => r.id === skill.id)!
    expect(reach.carriers).toBe(rows.filter((r) => r.level !== "none").length)
    expect(reach.mandatoryCarriers).toBe(rows.filter((r) => r.level === "mandatory").length)
  })
  it("cohort, term, professional year and search narrow the rows (CM-02)", () => {
    const y = String(rows[0]!.professionalYear)
    const base = { q: "", cohort: "", year: "", term: "" }
    expect(filterSkillOfferings(rows, { ...base, year: y }).every((r) => String(r.professionalYear) === y)).toBe(true)
    const t = rows[0]!.termId
    expect(filterSkillOfferings(rows, { ...base, term: t }).every((r) => r.termId === t)).toBe(true)
    expect(filterSkillOfferings(rows, { ...base, cohort: rows[0]!.cohortId }).every((r) => r.cohortId === rows[0]!.cohortId)).toBe(true)
    expect(filterSkillOfferings(rows, { ...base, q: "zzz-none" })).toEqual([])
  })
  it("says nothing about carry-forward: OD-01 is open and no clone event exists", () => {
    expect(offeringRows(s).every((r) => !("copiedFrom" in r))).toBe(true)
  })
  it("opens on current and upcoming offerings; a term or an academic year reaches past ones, a search does not [REQ CM-02, D-L75, map D8]", () => {
    const off = offeringRows(s)
    const base = { q: "", term: "", cohort: "", year: "", upcoming: true }
    const open = filterOfferings(off, base)
    expect(open.length).toBeGreaterThan(0)
    expect(open.every((r) => !r.past)).toBe(true)
    const ay = filterOfferings(off, { ...base, academicYear: "2025-26" })
    expect(ay.length).toBeGreaterThan(0)
    expect(ay.every((r) => r.academicYear === "2025-26" && r.past)).toBe(true)
    expect(filterOfferings(off, { ...base, q: "Fall 2025" })).toEqual([])
    expect(filterOfferings(off, { ...base, upcoming: false, q: "Fall 2025" }).length).toBeGreaterThan(0)
  })
  it("the page has no term columns on the mapping tables and both views behind one toggle (the Coverage grid returned, one term at a time: D-L121)", () => {
    const views = readFileSync(join(__dirname, "../../components/lab/admin-a/mapping-views.tsx"), "utf8")
    expect(views).toMatch(/By \$\{skillNoun\(\)\}/)
    expect(views).toMatch(/"By course"/)
    expect(views).not.toMatch(/SkillAcross/)
  })
})

describe("bulk mapping one skill to several offerings", () => {
  const first = rows[0]!.termId
  const picked = rows.filter((r) => r.termId === first).map((r) => r.id)
  const res = setLevelAcross(s, EMPTY_MAPPING_OVERLAY, picked, skill.id, "mandatory")
  it("sets the level in each picked offering and nowhere else (CM-06, CM-08)", () => {
    expect(res.changed).toBe(picked.length)
    expect(res.skipped).toBe(0)
    for (const r of offeringsForSkill(s, res.overlay, skill.id, "")) {
      if (r.termId === first) expect(r.level).toBe("mandatory")
      else expect(r.level).toBe(rows.find((x) => x.id === r.id)!.level)
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

describe("level order", () => {
  it("mapped levels sort first", () => {
    const order = (["none", "recommended", "mandatory"] as const).slice().sort((a, b) => levelRank(a) - levelRank(b))
    expect(order).toEqual(["mandatory", "recommended", "none"])
  })
})
