import { describe, expect, it } from "vitest"
import { seedLists } from "@/lib/lab/lists"
import { ALL_TERMS, filterOfferings, noCourseIds, offeringRows, paramsToReveal, skillReach } from "@/lib/lab/mapping"
import { createSeed } from "@/lib/v2/seed"

const seed = createSeed()
const lists = seedLists(seed)

describe("In no course means what the row says", () => {
  const reach = skillReach(seed, {}, "", lists).filter((r) => r.configured)
  const none = noCourseIds(seed, {}, lists)
  it("is exactly the skills whose row reads No courses, on a list or not", () => {
    expect([...none].sort()).toEqual(reach.filter((r) => r.courses === 0).map((r) => r.id).sort())
    expect(reach.some((r) => none.has(r.id) && !r.required)).toBe(true)
  })
  it("In a course and In no course split the list with nothing left over", () => {
    expect(reach.filter((r) => r.courses > 0).length + none.size).toBe(reach.length)
  })
})

describe("an explicit link to an offering is on the list beside it", () => {
  const rows = offeringRows(seed)
  const base = { q: "", term: "", cohort: "", year: "", academicYear: "", didactic: false, upcoming: true }
  const on = (id: string, f: typeof base) => {
    const r = rows.find((x) => x.id === id)!
    const fix = paramsToReveal(r, f)
    const after = {
      ...f,
      term: fix.term === null ? "" : f.term,
      cohort: fix.cohort === null ? "" : f.cohort,
      year: fix.year === null ? "" : f.year,
      academicYear: fix.ay === null ? "" : f.academicYear,
      didactic: f.didactic || fix.incl === "didactic",
      upcoming: fix.terms === ALL_TERMS ? false : f.upcoming,
    }
    return filterOfferings(rows, after).some((x) => x.id === id)
  }
  const current = rows.find((r) => r.kind === "clinical" && r.current)!
  const past = rows.find((r) => r.kind === "clinical" && r.past)!
  const other = rows.find((r) => r.termId !== current.termId && r.cohortId !== current.cohortId)!
  it("a filter that would hide it gives way", () => {
    expect(paramsToReveal(current, { ...base, term: other.termId })).toMatchObject({ term: null })
    expect(on(current.id, { ...base, term: other.termId, cohort: other.cohortId })).toBe(true)
  })
  it("a filter it already meets stays", () => {
    expect(paramsToReveal(current, { ...base, term: current.termId, cohort: current.cohortId })).toEqual({})
  })
  it("a past offering opens all terms, since nothing else would reach it", () => {
    expect(paramsToReveal(past, base)).toEqual({ terms: ALL_TERMS })
    expect(on(past.id, base)).toBe(true)
  })
  it("a past offering with its own term needs nothing", () => {
    expect(paramsToReveal(past, { ...base, term: past.termId })).toEqual({})
  })
})
