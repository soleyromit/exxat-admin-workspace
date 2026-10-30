import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { buildDashboard, buildDrill, opsDrill, opsHref, opsModel, populationRows } from "@/lib/lab/dashboard"
import { EMPTY_SCOPE, setScope } from "@/lib/lab/scope"

const seed = createSeed()
const q = (href: string) => new URLSearchParams(href.split("?")[1] ?? "")

describe("concept E, sites and evaluators operations", () => {
  const m = opsModel(seed, EMPTY_SCOPE)

  it("reads the same open requests as the dashboard Waiting figure, at scale", () => {
    expect(m.students).toBe(123)
    expect(m.waiting).toBe(buildDashboard(seed, EMPTY_SCOPE).waitingCount)
    expect(m.waiting).toBeGreaterThan(100)
    console.log("E", JSON.stringify({ waiting: m.waiting, median: m.medianDays, old: m.old, oldSites: m.oldSites, sites: m.sites.length, holders: m.holders.length, unverified: m.unverified.length, unverifiedOld: m.unverifiedOld, noSite: m.noSite, top: m.top.map((s) => [s.name, s.open, s.oldest, s.signed.map((x) => x.value).join("/")]), other: m.other, firstHolders: m.holders.slice(0, 6).map((h) => [h.name, h.verified, h.oldest, h.open]) }))
  })

  it("ranks sites by the oldest open request and keeps every request (top + other + no site = waiting)", () => {
    for (let i = 1; i < m.sites.length; i++) expect(m.sites[i - 1].oldest).toBeGreaterThanOrEqual(m.sites[i].oldest)
    expect(m.top.length).toBeLessThanOrEqual(8)
    expect(m.top.reduce((t, s) => t + s.open, 0) + m.other.open + m.noSite).toBe(m.waiting)
    for (const s of m.sites) expect(s.buckets.reduce((a, b) => a + b, 0)).toBe(s.open)
  })

  it("drill equals count: each site's Open equals the existing drill list for that site, same scope", () => {
    for (const s of m.top) expect(buildDrill(seed, EMPTY_SCOPE, { list: "requests", cond: "waiting", siteId: s.siteId }).count).toBe(s.open)
    expect(buildDrill(seed, EMPTY_SCOPE, { list: "requests", cond: "old" }).count).toBe(m.old)
    expect(buildDrill(seed, EMPTY_SCOPE, { list: "sites" }).count).toBe(m.sites.length)
  })

  it("drill equals count for evaluators: holders, unverified holders and one holder's requests", () => {
    expect(opsDrill(seed, m, { list: "holders" }).count).toBe(m.holders.length)
    expect(opsDrill(seed, m, { list: "holders", cond: "unverified" }).count).toBe(m.unverified.length)
    for (const h of m.holders.slice(0, 6)) expect(opsDrill(seed, m, { list: "holder", evaluator: h.id }).count).toBe(h.open)
    expect(m.holders.reduce((t, h) => t + h.open, 0)).toBe(m.waiting)
    const href = q(opsHref(setScope(EMPTY_SCOPE, "cohort", "BSN 2027"), { list: "holder", evaluator: m.holders[0].id }))
    // The evaluator lists are shared by every dashboard variant (shared-drills.tsx), so the link names no variant.
    expect(href.has("variant")).toBe(false)
    expect(href.get("list")).toBe("holder")
    expect(href.get("q")).toBe(m.holders[0].id)
    expect(href.get("cohort")).toBe("BSN 2027")
  })

  it("flags unverified evaluators as a separate overlay, with holders ordered oldest first", () => {
    expect(m.unverified.every((h) => !h.verified)).toBe(true)
    for (let i = 1; i < m.holders.length; i++) expect(m.holders[i - 1].oldest).toBeGreaterThanOrEqual(m.holders[i].oldest)
  })

  it("builds the 8-week trend from dated evaluations at the site, for students in scope only", () => {
    const pop = populationRows(seed, EMPTY_SCOPE)
    for (const s of m.top) {
      expect(s.signed).toHaveLength(8)
      const total = seed.evaluations.filter((e) => e.siteId === s.siteId && pop.ids.has(e.studentId) && e.date.slice(0, 10) > "2026-08-31" && e.date.slice(0, 10) <= "2026-10-26").length
      expect(s.signed.reduce((t, x) => t + x.value, 0)).toBe(total)
    }
  })

  it("narrows with the scope", () => {
    const cohort = buildDashboard(seed, EMPTY_SCOPE).options.cohorts[0]
    const c = opsModel(seed, setScope(EMPTY_SCOPE, "cohort", cohort))
    expect(c.waiting).toBeLessThan(m.waiting)
    expect(c.waiting).toBe(buildDashboard(seed, setScope(EMPTY_SCOPE, "cohort", cohort)).waitingCount)
  })

  it("RP-08: a location filter recounts E to requests at sites there, and every dashboard figure agrees", () => {
    const loc = "Harbor General, 4 West"
    const scope = setScope(EMPTY_SCOPE, "loc", loc)
    const l = opsModel(seed, scope)
    expect(l.waiting).toBeLessThan(m.waiting)
    expect(l.sites.length).toBeLessThan(m.sites.length)
    for (const x of l.open) expect(seed.sites?.find((s) => s.id === x.siteId)?.location).toBe(loc)
    expect(l.noSite).toBe(0)
    const d = buildDashboard(seed, scope)
    expect(l.waiting).toBe(d.waitingCount)
    expect(d.recount).toBe(`Counting evidence from ${loc} only.`)
    expect(buildDrill(seed, scope, { list: "requests", cond: "waiting" }).count).toBe(l.waiting)
  })
})
