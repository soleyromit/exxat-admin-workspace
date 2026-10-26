import { describe, expect, it } from "vitest"
import { EMPTY_SCOPE, clearFilters, includesDidactic, parseScope, removeScope, scopeQuery, setScope, toReportFilters, withDidactic, withScope } from "@/lib/lab/scope"
import { buildDashboard } from "@/lib/lab/dashboard"
import { createSeed } from "@/lib/v2/seed"
import { facts } from "@/lib/v2/facts"
import { populationRows } from "@/lib/v2/population"
import { SAMPLE_CUSTOM_GROUPS, customGroupValue, groupOptions, inGroup, students } from "@/lib/v2/filters"

describe("lab scope url", () => {
  it("round trips", () => {
    const scope = { cohort: "Cohort 2027", group: "Group A", term: "Fall 2026", course: "c1" }
    const q = scopeQuery(scope, { filter: "behind" })
    expect(parseScope(new URLSearchParams(q))).toEqual(scope)
    expect(new URLSearchParams(q).get("filter")).toBe("behind")
  })

  // Changed on purpose 2026-10-26 (CALL 10-26, REQ line 303): Group is its own filter and no longer needs a cohort.
  it("omits empty values and keeps a group without a cohort", () => {
    expect(scopeQuery(EMPTY_SCOPE)).toBe("")
    expect(parseScope(new URLSearchParams("group=A"))).toEqual({ ...EMPTY_SCOPE, group: "A" })
    expect(withScope("/lab/admin/approvals", EMPTY_SCOPE)).toBe("/lab/admin/approvals")
  })

  it("cohort and group are independent: removing or changing the cohort keeps the group", () => {
    expect(removeScope({ ...EMPTY_SCOPE, cohort: "X", group: "Y" }, "cohort")).toEqual({ ...EMPTY_SCOPE, group: "Y" })
    expect(setScope({ ...EMPTY_SCOPE, cohort: "X", group: "Y" }, "cohort", "Z")).toEqual({ ...EMPTY_SCOPE, cohort: "Z", group: "Y" })
    expect(toReportFilters({ ...EMPTY_SCOPE, group: "Y" }).group).toBe("Y")
  })

  it("clinical courses only by default; including didactic round trips and Clear filters goes back to clinical only", () => {
    expect(includesDidactic(EMPTY_SCOPE)).toBe(false)
    const on = withDidactic(EMPTY_SCOPE, true)
    expect(scopeQuery(on)).toBe("incl=didactic")
    expect(parseScope(new URLSearchParams("incl=didactic"))).toEqual(on)
    expect(includesDidactic(clearFilters(on))).toBe(false)
  })

  it("maps to report filters", () => {
    const f = toReportFilters({ ...EMPTY_SCOPE, cohort: "X", group: "Y", course: "c" })
    expect([f.cohort, f.group, f.course]).toEqual(["X", "Y", "c"])
  })
})

describe("lab dashboard model", () => {
  const seed = createSeed()
  it("counts the whole program with no scope and links every KPI with the same scope", () => {
    const m = buildDashboard(seed, EMPTY_SCOPE)
    expect(m.inScope).toBe(m.total)
    expect(m.kpis.length).toBeLessThanOrEqual(4)
    expect(m.heroValue).toBe(m.behind.length)
  })

  it("narrows to a cohort and carries the scope into links", () => {
    const cohort = buildDashboard(seed, EMPTY_SCOPE).options.cohorts[0]
    const scope = { ...EMPTY_SCOPE, cohort }
    const m = buildDashboard(seed, scope)
    expect(m.inScope).toBeLessThanOrEqual(m.total)
    for (const k of m.kpis.filter((x) => x.id !== "setup")) expect(parseScope(new URLSearchParams(k.href.split("?")[1] ?? "")).cohort).toBe(cohort)
    expect(parseScope(new URLSearchParams(m.heroHref.split("?")[1])).cohort).toBe(cohort)
  })

  it("offers every group with no cohort: program groups, tracks and custom groups", () => {
    const opts = groupOptions(seed)
    expect(opts.map((o) => o.label)).toEqual(expect.arrayContaining(["Group A", "Group B", "Group C", "Accelerated track", SAMPLE_CUSTOM_GROUPS[0]!.name]))
    expect(buildDashboard(seed, EMPTY_SCOPE).options.groups.length).toBe(opts.length)
  })

  it("a group filter's count equals its drill list, with and without a cohort", () => {
    for (const group of ["Group A", "trk:trk-accelerated", SAMPLE_CUSTOM_GROUPS[0]!.id, customGroupValue({ category: "Hybrid" })]) {
      for (const cohort of ["", "BSN 2027"]) {
        const scope = { ...EMPTY_SCOPE, cohort, group }
        const pop = populationRows(seed, scope)
        expect(facts(seed, scope).studentsInScope).toBe(pop.rows.length)
        for (const r of pop.rows) expect(inGroup(seed, seed.people.find((p) => p.id === r.id)!, group)).toBe(true)
        if (cohort) for (const r of pop.rows) expect(r.cohort).toBe(cohort)
      }
    }
    // Group A spans cohorts now: more students than in any one cohort's Group A.
    const all = populationRows(seed, { ...EMPTY_SCOPE, group: "Group A" }).rows.length
    expect(all).toBeGreaterThan(populationRows(seed, { ...EMPTY_SCOPE, cohort: "BSN 2027", group: "Group A" }).rows.length)
    expect(all).toBe(students(seed).filter((p) => p.group === "Group A").length)
  })

  it("explains a scope that selects nobody", () => {
    const m = buildDashboard(seed, { ...EMPTY_SCOPE, cohort: "No such cohort" })
    expect(m.kind).toBe("empty")
    expect(m.impossible).toMatch(/No students match/)
  })
})
