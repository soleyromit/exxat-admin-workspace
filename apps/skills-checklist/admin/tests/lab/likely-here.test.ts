import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { DEMO_TODAY } from "@/lib/v2/seed-core"
import { placementStatus, placementsOf } from "@/lib/v2/placements"
import { courseWork, skillProgress } from "@/lib/v2/student"
import type { MappingRow, V2State } from "@/lib/v2/types"
import { buildStudent, DEFAULT_STUDENT } from "@/lib/lab/student"
import { pickRows, pickerGroups } from "@/lib/lab/student2"
import { resolveTerm } from "@/lib/lab/dashboard"
import { EMPTY_SCOPE } from "@/lib/lab/scope"

/**
 * "Likely here" (soft mapping, CALL 10-26) reads Mandatory and Recommended mappings only. Optional stays submittable and counts on
 * the record, but is never suggested (B.9).
 */

const seed = createSeed()

function setup() {
  const term = resolveTerm(seed, EMPTY_SCOPE, DEMO_TODAY)
  const student = seed.people.find((p) => p.id === DEFAULT_STUDENT)!
  const place = placementsOf(seed, DEFAULT_STUDENT, term.id).find((p) => placementStatus(p, DEMO_TODAY) !== "finished")!
  const offered = new Set((seed.offerings ?? []).filter((o) => o.termId === term.id && o.cohortId === student.cohortId).map((o) => o.courseId))
  const mappedHere = new Set(seed.mappings.filter((m) => offered.has(m.courseId)).map((m) => m.skillId))
  // A skill in use with no setting minimum, not achieved, mapped on none of the student's courses this term.
  const skill = seed.skills.find((k) => k.configured && k.published && k.active !== false && k.config && k.config.achievement.settingMinimums.length === 0 && !mappedHere.has(k.id) && !skillProgress(seed, DEFAULT_STUDENT, k.id)?.achieved)!
  return { place, skill }
}

const withLevel = (s: V2State, courseId: string, skillId: string, level: MappingRow["level"]): V2State => ({ ...s, mappings: [...s.mappings, { courseId, skillId, level } as MappingRow] })

describe("Likely here is fed only by Mandatory and Recommended", () => {
  const { place, skill } = setup()

  it("an Optional skill on the placement's course is on the course but never likely here", () => {
    expect(place).toBeDefined()
    expect(skill).toBeDefined()
    const s = withLevel(seed, place.courseId, skill.id, "optional")
    const m = buildStudent(s)!
    const r = m.all.find((x) => x.id === skill.id)!
    expect(r.level).toBe("optional")
    expect(r.likely).toBe(false)
    const pick = pickRows(s, m).find((x) => x.id === skill.id)!
    expect(pick.likely).toBe(false)
    expect(pickerGroups(pickRows(s, m)).find((g) => g.key === "likely")?.rows.some((x) => x.id === skill.id) ?? false).toBe(false)
  })

  it("the same skill set to Recommended becomes likely here, in the student model and the picker", () => {
    const s = withLevel(seed, place.courseId, skill.id, "recommended")
    const m = buildStudent(s)!
    const r = m.all.find((x) => x.id === skill.id)!
    expect(r.level).toBe("recommended")
    expect(r.likely).toBe(true)
    expect(pickerGroups(pickRows(s, m)).find((g) => g.key === "likely")!.rows.some((x) => x.id === skill.id)).toBe(true)
  })

  it("every likely skill in the seed is Mandatory or Recommended on one of the student's current courses", () => {
    const m = buildStudent(seed)!
    const likely = m.all.filter((x) => x.likely)
    expect(likely.length).toBeGreaterThan(0)
    for (const r of likely) expect([r.id, r.level === "mandatory" || r.level === "recommended"]).toEqual([r.id, true])
  })
})

describe("v2 student keeps the three levels apart (B.9)", () => {
  it("recommended and optional are separate lists whose union is the non-mandatory block", () => {
    for (const p of seed.people.filter((x) => x.kind === "student").slice(0, 25)) {
      const w = courseWork(seed, p.id)
      expect(w.recommended.every((i) => i.level === "recommended")).toBe(true)
      expect(w.optionalOnly.every((i) => i.level === "optional")).toBe(true)
      expect(w.optional.map((i) => i.skill.id).sort()).toEqual([...w.recommended, ...w.optionalOnly].map((i) => i.skill.id).sort())
      expect(w.summary.recommended + w.optionalOnly.length).toBe(w.summary.optional)
    }
  })
})
