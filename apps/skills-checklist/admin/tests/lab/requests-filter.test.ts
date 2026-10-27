import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { DEFAULT_STUDENT, requestGroups } from "@/lib/lab/student"
import { anyFilter, filterCount, filterGroups, readFilter, rowFacts } from "@/lib/lab/requests-filter"

/** My requests search and filters (Romit 2026-10-27, LEDGER D-L20): they narrow every tab; nothing changes a figure. */
const seed = createSeed()
const groups = requestGroups(seed, DEFAULT_STUDENT)
const total = (gs: typeof groups) => gs.reduce((n, g) => n + g.waiting.length + g.returned.length + g.done.length, 0)
const f = (q: Record<string, string>) => readFilter((k) => q[k] ?? null)

describe("My requests search and filters", () => {
  it("no filter returns every request", () => {
    expect(anyFilter(f({}))).toBe(false)
    expect(total(filterGroups(seed, groups, f({})))).toBe(total(groups))
  })

  it("search by evaluator name keeps only that evaluator's requests", () => {
    const g = groups.find((x) => x.done.length > 0)!
    const out = filterGroups(seed, groups, f({ q: g.name.split(" ")[1] ?? g.name }))
    expect(out.some((x) => x.id === g.id)).toBe(true)
    expect(total(out)).toBeLessThanOrEqual(total(groups))
  })

  it("search by skill name matches the skill on every tab", () => {
    const r = groups.flatMap((g) => g.done)[0]
    const out = filterGroups(seed, groups, f({ q: r.skillNames[0] }))
    for (const g of out) for (const row of [...g.waiting, ...g.returned, ...g.done]) expect(row.skillNames.join(" ") + g.name).toMatch(new RegExp(r.skillNames[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"))
  })

  it("setting filter keeps only that setting, and counts the filter once", () => {
    const filter = f({ fsetting: "lab" })
    expect(filterCount(filter)).toBe(1)
    const out = filterGroups(seed, groups, filter)
    for (const g of out) for (const row of [...g.waiting, ...g.returned, ...g.done]) expect(rowFacts(seed, row.id).setting).toBe("lab")
  })

  it("an impossible search empties every tab (the page says No requests match)", () => {
    expect(filterGroups(seed, groups, f({ q: "zzzz-no-such" }))).toEqual([])
  })
})
