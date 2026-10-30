import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { behindSeries, buildDashboard, buildDrill, buildExceptions, countedPerWeek, lanes, populationRows, resolveTerm, sectionGaps, sectionMatrix, withClearState } from "@/lib/lab/dashboard"
import { PACE_MARGIN } from "@/lib/v2/reports"
import { heldState } from "@/lib/v2/approvals"
import { EMPTY_SCOPE, clearFilters, parseScope, removeScope, scopeQuery, setScope, withBasis, type LabScope } from "@/lib/lab/scope"

const seed = createSeed()
const q = (href: string) => new URLSearchParams(href.split("?")[1] ?? "")

describe("dashboard scope (strategy/06 S1 to S5, B1)", () => {
  it("round trips every field including More filters and basis", () => {
    const scope: LabScope = { cohort: "BSN 2028", group: "Group A", term: "Fall 2026", course: "crs-nur101", cat: "Mobility", tag: "Patient safety", loc: "Skills lab 2", setting: "lab", basis: "median" }
    expect(parseScope(new URLSearchParams(scopeQuery(scope)))).toEqual(scope)
  })

  it("omits the default basis and resets filters to the default scope, keeping the basis", () => {
    expect(scopeQuery(withBasis(EMPTY_SCOPE, "expected"))).toBe("")
    const s = setScope(setScope(withBasis(EMPTY_SCOPE, "all"), "cohort", "BSN 2028"), "cat", "Mobility")
    expect(clearFilters(s)).toEqual({ ...EMPTY_SCOPE, basis: "all" })
    expect(removeScope(s, "cat")).toEqual({ ...EMPTY_SCOPE, cohort: "BSN 2028", basis: "all" })
  })
})

describe("dashboard model at scale", () => {
  const m = buildDashboard(seed, EMPTY_SCOPE)

  it("measures one population of 123 students in the current term with at most 4 KPIs", () => {
    expect(m.total).toBe(123)
    expect(m.inScope).toBe(123)
    expect(m.term.name).toBe("Fall 2026")
    expect(m.kpis).toHaveLength(4)
    expect(m.heroSentence).toMatch(/^\d+ of 123 students (is|are) behind the term clock$/)
  })

  it("names the basis in the hero and changes figures when the basis changes", () => {
    const med = buildDashboard(seed, withBasis(EMPTY_SCOPE, "median"))
    const all = buildDashboard(seed, withBasis(EMPTY_SCOPE, "all"))
    expect(med.heroSentence).toMatch(/below the scope median/)
    expect(all.heroSentence).toMatch(/short of all required skills/)
    expect(new Set([m.heroValue, med.heroValue, all.heroValue]).size).toBeGreaterThan(1)
    expect(q(med.heroHref).get("basis")).toBe("median")
  })

  it("every figure opens a list of equal length with the same scope (06 R1, I-3)", () => {
    for (const scope of [EMPTY_SCOPE, { ...EMPTY_SCOPE, cohort: "BSN 2028" }, withBasis({ ...EMPTY_SCOPE, cohort: "BSN 2027" }, "all")]) {
      const d = buildDashboard(seed, scope)
      const hero = buildDrill(seed, parseScope(q(d.heroHref)), { list: "students", cond: "behind" })
      expect(hero.count).toBe(d.heroValue)
      expect(parseScope(q(d.heroHref))).toEqual(scope)
      const waiting = buildDrill(seed, scope, { list: "requests", cond: "waiting" })
      expect(waiting.count).toBe(d.kpis.find((k) => k.id === "waiting")!.value)
      const approval = buildDrill(seed, scope, { list: "requests", cond: "approval" })
      expect(approval.count).toBe(d.approvals.submissions)
      const skills = buildDrill(seed, scope, { list: "skills" })
      const achieved = skills.skills!.reduce((t, x) => t + x.achieved, 0)
      const records = skills.skills!.reduce((t, x) => t + x.students, 0)
      expect(d.kpis[0].description).toBe(`${achieved.toLocaleString("en-US")} of ${records.toLocaleString("en-US")}`)
      for (const b of d.blockers.slice(0, 8)) expect(buildDrill(seed, scope, { list: "students", cond: "behind", skill: b.skillId }).count).toBe(b.students)
      for (const site of d.sites.top) expect(buildDrill(seed, scope, { list: "requests", cond: "waiting", siteId: site.siteId }).count).toBe(site.total)
      expect(buildDrill(seed, scope, { list: "sites" }).count).toBe(d.sites.sites)
      const stalled = d.needsYou.find((r) => r.key === "stalled")
      if (stalled) expect(stalled.text.startsWith(`${buildDrill(seed, scope, { list: "requests", cond: "stalled" }).count} `)).toBe(true)
    }
  })

  it("narrows to a cohort and keeps it on every scoped link", () => {
    const scope = { ...EMPTY_SCOPE, cohort: "BSN 2028" }
    const d = buildDashboard(seed, scope)
    expect(d.inScope).toBe(42)
    for (const k of d.kpis.filter((x) => x.id !== "setup")) expect(parseScope(q(k.href)).cohort).toBe("BSN 2028")
  })

  it("explains an impossible combination with one remove action per offending chip (06 S7)", () => {
    const d = buildDashboard(seed, { ...EMPTY_SCOPE, loc: "Simulation lab", setting: "clinical" })
    expect(d.kind).toBe("impossible")
    expect(d.explained!.remove.map((r) => r.key).sort()).toEqual(["loc", "setting"])
    // The banner explains; "Counting evidence from ..." beside it would contradict it (wave 2, RP-09).
    expect(d.recount).toBeNull()
  })

  it("calls an empty scope empty, never zeros", () => {
    const d = buildDashboard(seed, { ...EMPTY_SCOPE, cohort: "BSN 2026", course: "crs-nur101" })
    expect(d.kind).toBe("empty")
    expect(d.impossible).toMatch(/No students match/)
  })

  it("suppresses subgroups under 5 in Split by and in the matrix", () => {
    const tiny = buildDashboard(seed, { ...EMPTY_SCOPE, cohort: "ABSN 2027" })
    const split = lanes(tiny.pop.rows, "group")
    for (const l of split.lanes) expect(l.rows.length).toBeGreaterThanOrEqual(5)
    const mx = sectionMatrix(m.pop, "cohort")
    expect(mx.columns.map((c) => c.n).reduce((a, b) => a + b, 0) + mx.hidden.reduce((a, h) => a + h.n, 0)).toBe(123)
  })

  it("forces a calm all-clear for review without losing the population", () => {
    const c = withClearState(m)
    expect(c.kind).toBe("clear")
    expect(c.pop.rows).toHaveLength(123)
    expect(c.heroSentence).toMatch(/^Nobody is behind the term clock/)
  })

  it("never uses banned words in generated copy", () => {
    const copy = [m.heroSentence, m.heroDetail, m.basisCaption, ...m.kpis.flatMap((k) => [k.label, k.description]), ...m.needsYou.map((r) => r.text)].join(" ")
    expect(copy).not.toMatch(/\bitems?\b|\bpending\b|—/i)
  })
})

describe("hero count against an independent raw count (not circular)", () => {
  it("equals a raw filter of populationRows rows, and a recount from evaluations under the term clock", () => {
    for (const scope of [EMPTY_SCOPE, { ...EMPTY_SCOPE, cohort: "BSN 2028" }, { ...EMPTY_SCOPE, cohort: "BSN 2027" }]) {
      const d = buildDashboard(seed, scope)
      const raw = populationRows(seed, scope).rows.filter((r) => r.behind)
      expect(d.heroValue).toBe(raw.length)
      // Recount "behind" from each row's own counted and needed evaluations with the term share, without the behind flag.
      const share = resolveTerm(seed, scope).share
      const recount = populationRows(seed, scope).rows.filter((r) => Math.floor(r.needed * share) - r.collected > PACE_MARGIN).length
      expect(d.heroValue).toBe(recount)
      expect(d.heroValue).toBeGreaterThan(0)
    }
  })
})

describe("status board (variant A) figures", () => {
  const m = buildDashboard(seed, EMPTY_SCOPE)

  it("behind history has 8 weekly points and ends on the hero figure", () => {
    const s = behindSeries(seed, EMPTY_SCOPE)
    expect(s).toHaveLength(8)
    expect(s.at(-1)!.value).toBe(m.heroValue)
  })

  it("evaluations counted per week come from evaluation dates for students in scope", () => {
    const weeks = countedPerWeek(m.pop)
    expect(weeks).toHaveLength(12)
    const first = new Date(Date.parse(`${weeks[0].end}T00:00:00Z`) - 7 * 86_400_000).toISOString().slice(0, 10)
    // Evidence held for approval (incl. an unadopted evaluator name) never counts: read the effective state.
    const raw = heldState(seed).evaluations.filter((e) => e.status === "counted" && m.pop.ids.has(e.studentId) && e.date.slice(0, 10) > first && e.date.slice(0, 10) <= weeks.at(-1)!.end).length
    expect(weeks.reduce((t, w) => t + w.value, 0)).toBe(raw)
  })

  it("section gaps are ordered worst first and use the basis", () => {
    const g = sectionGaps(m.pop)
    expect(g.length).toBeGreaterThan(3)
    for (let i = 1; i < g.length; i++) expect(g[i - 1].gap).toBeGreaterThanOrEqual(g[i].gap)
    for (const x of g) expect(x.gap).toBe(x.expected - x.pct)
  })
})

describe("exceptions (variant B): each tab count equals the list and the drill behind it", () => {
  it("matches the dashboard figures and drills in several scopes", () => {
    for (const scope of [EMPTY_SCOPE, { ...EMPTY_SCOPE, cohort: "BSN 2028" }, withBasis(EMPTY_SCOPE, "all")]) {
      const d = buildDashboard(seed, scope)
      const x = buildExceptions(seed, d)
      expect(x.behind.length).toBe(d.heroValue)
      expect(x.behind.length).toBe(buildDrill(seed, scope, { list: "students", cond: "behind" }).count)
      expect(x.old.length).toBe(d.sites.old)
      expect(x.old.length).toBe(buildDrill(seed, scope, { list: "requests", cond: "old" }).count)
      expect(x.approval.length).toBe(d.approvals.submissions)
      expect(x.approval.length).toBe(buildDrill(seed, scope, { list: "requests", cond: "approval" }).count)
      const ids = populationRows(seed, scope).ids
      expect(x.returned.length).toBe(seed.submissions.filter((s) => s.status === "returned" && ids.has(s.studentId)).length)
      for (const e of x.unverified) expect(seed.people.find((p) => p.id === e.id)?.verified).toBe(false)
      // Ranked: furthest behind first, oldest first.
      for (let i = 1; i < x.behind.length; i++) expect(x.behind[i - 1].row.gap).toBeLessThanOrEqual(x.behind[i].row.gap)
      for (let i = 1; i < x.old.length; i++) expect(x.old[i - 1].days).toBeGreaterThanOrEqual(x.old[i].days)
    }
  })

  it("never uses banned words in the why lines", () => {
    const x = buildExceptions(seed, buildDashboard(seed, EMPTY_SCOPE))
    const copy = [...x.old, ...x.approval, ...x.returned].map((r) => r.why).join(" ")
    expect(copy).not.toMatch(/\bitems?\b|—/i)
  })
})

describe("KPI history (visual-language: sparklines read from dated records only)", () => {
  const m = buildDashboard(seed, EMPTY_SCOPE)

  it("gives achieved 8 weekly points that end on the figure they sit beside, and never fall", () => {
    const achieved = m.kpis.find((k) => k.id === "achieved")!
    expect(achieved.chart?.kind).toBe("sparkline")
    const a = achieved.chart!.series.map((p) => p.value)
    expect(a).toHaveLength(8)
    expect(`${a.at(-1)}%`).toBe(achieved.value)
    expect(a.every((v, i) => i === 0 || v >= a[i - 1])).toBe(true)
  })

  it("splits waiting and approval by age, and the bars add up to the figure", () => {
    const waiting = m.kpis.find((k) => k.id === "waiting")!
    const approval = m.kpis.find((k) => k.id === "approval")!
    expect(waiting.chart?.kind).toBe("bars")
    expect(waiting.chart!.series.reduce((t, p) => t + p.value, 0)).toBe(waiting.value)
    expect(waiting.chart!.series.map((p) => p.label)).toEqual(["0 to 3 days", "4 to 7 days", "8 to 14 days", "15 days or more"])
    expect(approval.chart?.kind).toBe("bars")
    expect(approval.chart!.series.reduce((t, p) => t + p.value, 0)).toBe(approval.value)
  })

  it("does not invent history where no dated record exists", () => {
    expect(m.kpis.find((k) => k.id === "setup")!.chart).toBeUndefined()
  })
})
