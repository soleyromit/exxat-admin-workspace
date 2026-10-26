import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { buildDashboard, pipelineDrill, pipelineHref, pipelineModel, populationRows, RECORD_STATES } from "@/lib/lab/dashboard"
import { EMPTY_SCOPE, setScope, withBasis } from "@/lib/lab/scope"

const seed = createSeed()
const q = (href: string) => new URLSearchParams(href.split("?")[1] ?? "")

describe("concept C, journey pipeline (four engine states over required skill records)", () => {
  const m = pipelineModel(seed, EMPTY_SCOPE)

  it("covers the whole population of 123 students at scale, one record per student and required skill", () => {
    const pop = populationRows(seed, EMPTY_SCOPE)
    expect(m.students).toBe(123)
    expect(m.total).toBe(pop.rows.reduce((t, r) => t + r.required, 0))
    expect(m.total).toBeGreaterThan(1000)
    console.log("C", JSON.stringify({ total: m.total, waiting: m.waiting, tick: m.tick, since: m.since, sections: m.sections.length, stages: m.stages.map((s) => [s.label, s.count, s.pct, s.waiting, s.delta]) }))
  })

  it("has exactly the four engine states, and they partition the records", () => {
    expect(RECORD_STATES).toEqual(["achieved", "progress", "unqualified", "none"])
    expect(m.stages.map((s) => s.label)).toEqual(["Achieved", "In progress", "Evidence does not qualify", "No evidence yet"])
    expect(m.stages.reduce((t, s) => t + s.count, 0)).toBe(m.total)
    for (const sec of m.sections) expect(RECORD_STATES.reduce((t, st) => t + sec.counts[st], 0)).toBe(sec.total)
    expect(m.sections.reduce((t, s) => t + s.total, 0)).toBe(m.total)
  })

  it("agrees with the shared behind calculation: achieved records equal the population's achieved count", () => {
    const pop = populationRows(seed, EMPTY_SCOPE)
    expect(m.all.counts.achieved).toBe(pop.rows.reduce((t, r) => t + r.achieved, 0))
    // In progress means some qualifying evidence: every in-progress record has at least one counted evaluation.
    expect(m.records.filter((x) => x.state === "progress").every((x) => x.counted > 0)).toBe(true)
    expect(m.records.filter((x) => x.state === "none" || x.state === "unqualified").every((x) => x.counted === 0)).toBe(true)
  })

  it("treats waiting as an overlay, never a state: waiting records keep their state and equal the open-request records", () => {
    expect(m.waiting).toBeGreaterThan(0)
    expect(RECORD_STATES.reduce((t, st) => t + m.all.waiting[st], 0)).toBe(m.waiting)
    for (const st of RECORD_STATES) expect(m.all.waiting[st]).toBeLessThanOrEqual(m.all.counts[st])
  })

  it("drill equals count for every stage and every section segment, with the same scope in the link", () => {
    for (const s of m.stages) expect(pipelineDrill(m, { state: s.state }).rows.length).toBe(s.count)
    for (const sec of m.sections) {
      expect(pipelineDrill(m, { section: sec.section }).rows.length).toBe(sec.total)
      for (const st of RECORD_STATES) expect(pipelineDrill(m, { state: st, section: sec.section }).rows.length).toBe(sec.counts[st])
    }
    const scope = setScope(withBasis(EMPTY_SCOPE, "median"), "cohort", m.records[0].cohort)
    const href = q(pipelineHref(scope, { state: "progress", section: "Safety" }))
    // The records list is shared by every dashboard variant (components/lab/screens/shared-drills.tsx), so the link names no variant.
    expect(href.has("variant")).toBe(false)
    expect(href.get("list")).toBe("records")
    expect(href.get("cond")).toBe("progress")
    expect(href.get("q")).toBe("Safety")
    expect(href.get("cohort")).toBe(m.records[0].cohort)
    expect(href.get("basis")).toBe("median")
  })

  it("draws movement from dated evaluations only: 8 weekly points ending on the figure", () => {
    for (const s of m.stages) {
      expect(s.series).toHaveLength(8)
      expect(s.series[7].value).toBe(s.count)
      expect(s.delta).toBe(s.series[7].value - s.series[6].value)
    }
    // Over the weeks the total stays the same (requirements do not change with dates), so the four lines partition it.
    for (let i = 0; i < 8; i++) expect(m.stages.reduce((t, s) => t + s.series[i].value, 0)).toBe(m.total)
  })

  it("puts the expected-now tick on the basis and flags sections 8 or more points under it", () => {
    expect(m.tick?.label).toBe("Expected now")
    expect(m.tick?.pct).toBe(buildDashboard(seed, EMPTY_SCOPE).term.share * 100 > 0 ? Math.round(buildDashboard(seed, EMPTY_SCOPE).term.share * 100) : 0)
    for (const sec of m.sections) expect(sec.short > 0).toBe(m.tick!.pct - sec.achievedPct >= 8)
    expect(pipelineModel(seed, withBasis(EMPTY_SCOPE, "all")).tick).toBeNull()
    expect(pipelineModel(seed, withBasis(EMPTY_SCOPE, "median")).tick?.label).toBe("Section median")
  })

  it("narrows with the scope: a cohort holds fewer records and still partitions", () => {
    const cohort = m.records[0].cohort
    const c = pipelineModel(seed, setScope(EMPTY_SCOPE, "cohort", cohort))
    expect(c.students).toBeLessThan(123)
    expect(c.total).toBeLessThan(m.total)
    expect(c.stages.reduce((t, s) => t + s.count, 0)).toBe(c.total)
  })
})
