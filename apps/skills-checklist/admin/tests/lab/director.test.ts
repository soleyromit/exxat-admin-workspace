import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { populationRows } from "@/lib/lab/dashboard"
import { EMPTY_SCOPE } from "@/lib/lab/scope"
import {
  ANY_COHORT,
  STAGES,
  STATUSES,
  bulkAlike,
  buildReadiness,
  detailModel,
  directorFixture,
  directorQuery,
  filterRows,
  graduatingCohort,
  listHref,
  parseDirectorScope,
  reportModel,
  withClear,
  type ListKey,
} from "@/lib/lab/director"

const seed = createSeed()
const q = (href: string) => new URLSearchParams(href.split("?")[1] ?? "")
const cohort = graduatingCohort(seed)!
const scope = { ...EMPTY_SCOPE, cohort, term: "Fall 2026" }
const m = buildReadiness(seed, scope)

describe("director readiness (one calculation for every director screen)", () => {
  it("defaults the scope to the graduating cohort, and cohort stays a removable filter", () => {
    expect(cohort).toBe("BSN 2026")
    expect(parseDirectorScope(new URLSearchParams(""), seed).cohort).toBe(cohort)
    expect(parseDirectorScope(new URLSearchParams(`cohort=${ANY_COHORT}`), seed).cohort).toBe("")
    expect(new URLSearchParams(directorQuery({ ...scope, cohort: "" })).get("cohort")).toBe(ANY_COHORT)
    expect(parseDirectorScope(new URLSearchParams(directorQuery(scope)), seed)).toEqual(scope)
  })

  it("uses the shared population: the same students populationRows returns", () => {
    const pop = populationRows(directorFixture(seed).state, scope)
    expect(m.rows.map((r) => r.id).sort()).toEqual(pop.rows.map((r) => r.id).sort())
    expect(m.rows.length).toBe(38)
  })

  it("reproduces the graduating story from data: 31 complete, 4 one short on one skill, 3 far behind", () => {
    console.log("director", JSON.stringify({ stage: m.stage, open: m.stageOpen, status: m.status, ready: m.readyToVerify, required: m.required.length, blockers: m.blockers.map((b) => [b.skills.length, b.students.length, b.waiting, b.onlyGap, b.skills[0].name]) }))
    expect(m.stage).toEqual({ complete: 31, short: 4, far: 3 })
    expect(STAGES.reduce((t, s) => t + m.stage[s], 0)).toBe(m.rows.length)
    const shortGaps = new Set(m.rows.filter((r) => r.stage === "short").map((r) => r.gaps[0].name))
    expect([...shortGaps]).toEqual(["Hangs PB Med"])
    expect(m.rows.filter((r) => r.stage === "far").every((r) => r.gaps.length >= 4)).toBe(true)
    // Dataset story 2: 3 of the 4 one short have a waiting request for it.
    expect(m.stageOpen.short).toBe(3)
    expect(m.required.length).toBeGreaterThan(40)
  })

  it("partitions every record into one status, and ready to verify is ready plus changed", () => {
    expect(STATUSES.reduce((t, s) => t + m.status[s], 0)).toBe(m.rows.length)
    expect(m.status.changed).toBe(2)
    expect(m.readyToVerify).toBe(m.status.ready + m.status.changed)
    // Gaps never block; evidence in flux does.
    expect(m.rows.filter((r) => r.status === "blocked").every((r) => r.flux.length > 0)).toBe(true)
    expect(m.rows.some((r) => r.status === "ready" && r.gaps.length > 0)).toBe(true)
  })

  it("makes every figure's list the same length as the figure (same scope in the URL)", () => {
    const figures: Array<[ListKey, number]> = [["complete", m.stage.complete], ["short", m.stage.short], ["far", m.stage.far], ["ready", m.readyToVerify], ["gaps", m.stage.short + m.stage.far]]
    for (const [list, n] of figures) {
      expect(filterRows(m.rows, { list }).length, list).toBe(n)
      const href = q(listHref(scope, { list }))
      expect(href.get("cohort")).toBe(cohort)
      expect(href.get("term")).toBe("Fall 2026")
      expect(href.get("list")).toBe(list)
    }
    for (const b of m.blockers) {
      const ids = b.skills.map((k) => k.id).join(",")
      expect(filterRows(m.rows, { skill: ids }).length).toBe(b.students.length)
      expect(filterRows(m.rows, { list: "waiting", skill: ids }).length).toBe(b.waiting)
      expect(filterRows(m.rows, { list: "only", skill: ids }).length).toBe(b.onlyGap)
    }
    const rep = reportModel(m)
    for (const k of rep.skills) {
      expect(filterRows(m.rows, { list: "has", skill: k.id }).length, k.name).toBe(k.achieved)
      expect(filterRows(m.rows, { list: "progress", skill: k.id }).length, k.name).toBe(k.progress)
      expect(filterRows(m.rows, { list: "notmet", skill: k.id }).length, k.name).toBe(k.notMet)
    }
    for (const s of STATUSES) expect(filterRows(m.rows, { status: s }).length).toBe(m.status[s])
  })

  it("states ties as one blocker group instead of ranking equal values", () => {
    const top = m.blockers[0]
    expect(top.skills.map((k) => k.name)).toEqual(["Hangs PB Med"])
    expect(top.students.length).toBe(7)
    expect(m.blockers.some((b) => b.skills.length > 1)).toBe(true)
  })

  it("offers bulk open only for like rows", () => {
    const ready = m.rows.filter((r) => r.status === "ready" && r.gaps.length === 0).slice(0, 3)
    expect(bulkAlike(ready).alike).toBe(true)
    const mixed = [...ready.slice(0, 1), m.rows.find((r) => r.status === "blocked")!]
    expect(bulkAlike(mixed).alike).toBe(false)
  })

  it("builds a detail that states its own gaps, and defaults to a record with a gap that can be verified", () => {
    const d = detailModel(seed, m, null)!
    expect(d.row.gaps.length).toBeGreaterThan(0)
    expect(d.row.status).not.toBe("blocked")
    expect(d.statement).toContain(`${d.row.achieved} of ${d.row.required}`)
    expect(d.statement).toContain(d.row.gaps[0].name)
    expect(d.lines.length).toBe(m.required.length)
    const changed = m.rows.find((r) => r.status === "changed")!
    expect(changed.changes[0]).toMatch(/^Rule changed/)
  })

  it("reports by student, skill and section agree with each other and the CSV is evaluation level", () => {
    const r = reportModel(m)
    expect(r.students.length).toBe(m.rows.length)
    expect(r.skills.length).toBe(m.required.length)
    const achievedByStudent = r.students.reduce((t, x) => t + x.achieved, 0)
    expect(r.skills.reduce((t, x) => t + x.achieved, 0)).toBe(achievedByStudent)
    expect(r.sections.reduce((t, x) => t + x.achieved, 0)).toBe(achievedByStudent)
    expect(r.csvRows).toBeGreaterThan(m.rows.length)
    expect(r.csvSample.length).toBe(3)
  })

  it("has a calm all-clear state", () => {
    const c = withClear(m)
    expect(c.stage.complete).toBe(c.rows.length)
    expect(c.status.blocked).toBe(0)
  })
})
