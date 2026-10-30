import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { applyDecisions, itemDetail, labState, reviewRows, scopeRows } from "@/lib/lab/reviewer"
import { EMPTY_SCOPE } from "@/lib/lab/scope"
import { directory, filterDirectory, mergeCandidates, siteRows, statusFromParam, EMPTY_DIRECTORY_FILTER, MIN_EVALUATIONS, MIN_EVENTS } from "@/lib/lab/evaluators"

const seed = createSeed()
const s = labState(seed)
const { rows, summary } = directory(s)

describe("evaluator directory at scale", () => {
  it("lists 174 evaluators across three roles with 14 names awaiting a decision first", () => {
    expect(rows.length).toBe(174)
    expect(new Set(rows.map((r) => r.role))).toEqual(new Set(["preceptor", "faculty", "lab-instructor"]))
    expect(summary.awaiting).toBe(14)
    expect(rows.slice(0, 14).every((r) => !r.verified)).toBe(true)
    expect(rows.filter((r) => !r.verified).every((r) => r.held === r.evaluations)).toBe(true)
  })
  it("states the verified share of evidence below 100 while names wait", () => {
    expect(summary.verifiedShare).toBeLessThan(100)
    expect(summary.verifiedShare).toBeGreaterThan(80)
  })
  it("filters on the whole set by search, role, site and status, and reads the dashboard link", () => {
    expect(filterDirectory(rows, { ...EMPTY_DIRECTORY_FILTER, status: statusFromParam("unverified") }).length).toBe(14)
    expect(filterDirectory(rows, { ...EMPTY_DIRECTORY_FILTER, role: "faculty" }).length).toBe(18)
    expect(filterDirectory(rows, { ...EMPTY_DIRECTORY_FILTER, q: "delgado" }).some((r) => r.id === "pre-delgado")).toBe(true)
    const site = rows.find((r) => r.siteId)!.siteId
    expect(filterDirectory(rows, { ...EMPTY_DIRECTORY_FILTER, site }).every((r) => r.siteId === site)).toBe(true)
  })
  it("compares a rate only with enough evidence", () => {
    for (const r of rows) {
      if (r.evaluations < MIN_EVALUATIONS || r.events < MIN_EVENTS) expect(r.consistency).toBe("too-few")
      if (r.consistency === "above") expect(r.rate).toBeGreaterThanOrEqual(summary.programRate * 2)
    }
  })
})

describe("adopt or merge", () => {
  const pending = rows.find((r) => !r.verified)!
  it("suggests adopted evaluators with a reason", () => {
    const c = mergeCandidates(s, pending.id)
    for (const m of c) {
      expect(m.id).not.toBe(pending.id)
      expect(m.why.length).toBeGreaterThan(3)
    }
  })
  it("adopting releases the held evaluations and the directory agrees", () => {
    const next = applyDecisions(seed, [{ kind: "adopt", evaluatorId: pending.id, mode: "adopt" }])
    const d = directory(next)
    const row = d.rows.find((r) => r.id === pending.id)!
    expect(row.verified).toBe(true)
    expect(row.held).toBe(0)
    expect(d.summary.awaiting).toBe(13)
  })
  it("merging moves the evidence to the existing evaluator", () => {
    const into = rows.find((r) => r.verified && r.role === "preceptor")!
    const next = applyDecisions(seed, [{ kind: "adopt", evaluatorId: pending.id, mode: "merge", intoId: into.id }])
    const d = directory(next)
    expect(d.rows.find((r) => r.id === into.id)!.evaluations).toBe(into.evaluations + pending.evaluations)
  })
})

describe("by site", () => {
  it("groups evaluators by site with open requests and names awaiting", () => {
    const sites = siteRows(s)
    expect(sites.length).toBeGreaterThanOrEqual(30)
    expect(sites.reduce((n, x) => n + x.awaiting, 0)).toBe(rows.filter((r) => !r.verified && r.siteId).length)
    expect(sites[0]!.awaiting).toBeGreaterThan(0)
  })
})

describe("assign to someone else does not feed the outlier rate", () => {
  // A reassignment is not a return by the evaluator whose name was unadopted (decided 2026-10-26, lib/lab/evaluators.ts).
  it("leaves the unadopted evaluator's events and return rate, and the program rate, unchanged", () => {
    const row = scopeRows(s, reviewRows(s), EMPTY_SCOPE).rows.find((r) => r.kind === "unverified")!
    const to = itemDetail(s, reviewRows(s), row.key)!.assignTo[0]
    const next = applyDecisions(seed, [{ kind: "assign", key: row.key, toId: to.id }])
    // The held evidence is now marked reassigned (D-X25: a handoff, never "returned"), linked to the new request...
    for (const id of row.evaluationIds) expect(next.evaluations.find((e) => e.id === id)!.status).toBe("reassigned")
    const before = rows.find((r) => r.id === row.evaluatorId)!
    const d = directory(next)
    const after = d.rows.find((r) => r.id === row.evaluatorId)!
    // ...but it is not a return by that evaluator.
    expect(after.events).toBe(before.events)
    expect(after.rate).toBe(before.rate)
    expect(after.evaluations).toBe(before.evaluations)
    expect(d.summary.programRate).toBe(summary.programRate)
    expect(d.summary.flagged).toBe(summary.flagged)
  })
  it("still counts a real return by a reviewer as an event", () => {
    const row = scopeRows(s, reviewRows(s), EMPTY_SCOPE).rows.find((r) => r.kind !== "unverified" && !!r.evaluatorId && r.evaluationIds.length > 0)!
    const before = rows.find((r) => r.id === row.evaluatorId)!
    const next = applyDecisions(seed, [{ kind: "return", key: row.key, note: "Correct the date", path: "new-attempt" }])
    const after = directory(next).rows.find((r) => r.id === row.evaluatorId)!
    const metReturned = row.evaluationIds.filter((id) => seed.evaluations.find((e) => e.id === id)?.outcome === "met").length
    expect(after.events).toBe(before.events + metReturned)
  })
})
