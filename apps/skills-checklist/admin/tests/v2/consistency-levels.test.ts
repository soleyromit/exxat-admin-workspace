import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { facts } from "@/lib/v2/facts"
import { populationRows, type PopulationScope } from "@/lib/v2/population"
import { customGroupValue, inGroup, students } from "@/lib/v2/filters"
import { offeringRows } from "@/lib/lab/mapping"
import { buildStudent } from "@/lib/lab/student"
import type { V2State } from "@/lib/v2/types"

/**
 * Oct 26 call updates (CALL 10-26): three per-course levels, Group as its own filter, clinical courses first. None of them may
 * move a "Required this term" figure (decision D-X12): mandatory rows are untouched and didactic courses carry no mandatory skill.
 */

const s = createSeed()
const termIds = (s.terms ?? []).map((t) => t.id)
const scopes: PopulationScope[] = []
for (const term of termIds)
  for (const cohort of ["", ...s.program.cohorts])
    for (const group of ["", "Group A", "Group B", "Group C"]) scopes.push({ cohort, group: cohort ? group : "", term, course: "" })
for (const c of s.courses ?? []) scopes.push({ cohort: "", group: "", term: "", course: c.id })

/** The data as it was before the split: every recommended row was non-mandatory ("optional"). */
const legacy: V2State = { ...s, mappings: s.mappings.map((m) => (m.level === "recommended" ? { ...m, level: "optional" as const } : m)) }

describe("three per-course levels leave every Required this term figure unchanged", () => {
  it("facts match the pre-split data for every term, cohort, group and course scope", () => {
    for (const sc of scopes) expect(facts(s, sc)).toEqual(facts(legacy, sc))
  })

  it("the split only relabels non-mandatory rows, about half each, and never touches mandatory", () => {
    const n = (st: V2State, l: string) => st.mappings.filter((m) => m.level === l).length
    expect(n(s, "mandatory")).toBe(n(legacy, "mandatory"))
    expect(n(s, "recommended") + n(s, "optional")).toBe(n(legacy, "optional"))
    expect(Math.abs(n(s, "recommended") - n(s, "optional"))).toBeLessThanOrEqual(s.courses!.length)
  })

  it("offering totals add up: mapped = mandatory + recommended + optional", () => {
    for (const r of offeringRows(s)) expect(r.mandatory + r.recommended + r.optional).toBe(r.mapped)
  })

  it("Likely here reads mandatory and recommended only; optional stays a record that can be submitted", () => {
    let recommended = 0
    for (const p of students(s).slice(0, 60)) {
      const m = buildStudent(s, p.id)!
      for (const pl of m.placements) {
        const on = (l: string) => new Set(s.mappings.filter((x) => x.courseId === pl.courseId && x.level === l).map((x) => x.skillId))
        const opt = on("optional")
        const strong = new Set([...on("mandatory"), ...on("recommended")])
        for (const id of pl.likelyIds) expect(strong.has(id) || !opt.has(id)).toBe(true)
        recommended += pl.likelyIds.filter((id) => on("recommended").has(id)).length
      }
    }
    expect(recommended).toBeGreaterThan(0)
  })
})

describe("clinical courses first", () => {
  it("keeps 22 courses and 110 offerings; didactic courses carry no mandatory skill", () => {
    expect(s.courses!.length).toBe(22)
    expect(s.offerings!.length).toBe(110)
    const didactic = new Set(s.courses!.filter((c) => c.kind === "didactic").map((c) => c.id))
    expect(didactic.size).toBe(13)
    expect(s.mappings.some((m) => didactic.has(m.courseId) && m.level === "mandatory")).toBe(false)
  })

  it("the Required this term population is identical with didactic courses included or not", () => {
    for (const sc of scopes) expect(facts(s, { ...sc, incl: "didactic" })).toEqual(facts(s, sc))
  })
})

describe("Group is its own filter", () => {
  it("every student carries the custom group fields, position-based", () => {
    for (const p of students(s)) {
      expect(typeof p.enrollmentYear).toBe("number")
      expect(["Day", "Hybrid"]).toContain(p.enrollmentCategory)
    }
    expect(createSeed().people.map((p) => [p.enrollmentYear, p.enrollmentCategory])).toEqual(s.people.map((p) => [p.enrollmentYear, p.enrollmentCategory]))
  })

  it("a custom group's figure counts exactly the students its rules pick, across cohorts", () => {
    const value = customGroupValue({ enrollmentYear: 2025 })
    const pop = populationRows(s, { cohort: "", group: value, term: "", course: "" })
    expect(facts(s, { cohort: "", group: value, term: "", course: "" }).studentsInScope).toBe(pop.rows.length)
    expect(pop.rows.length).toBe(students(s).filter((p) => inGroup(s, p, value) && pop.ids.has(p.id)).length)
    expect(new Set(pop.rows.map((r) => r.cohort)).size).toBeGreaterThan(1)
  })
})
