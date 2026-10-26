import { describe, expect, it } from "vitest"
import { queueItems } from "@/lib/v2/queue"
import { ageBucket, ageDays, agreementCounts, itemAgreement, oldestFirst, oldestItem, recordGroupOf, recordGroups, sentAgo, skillOutcomeRows } from "@/lib/v2/queue-viz"
import { createSeed, DEMO_TODAY } from "@/lib/v2/seed"
import { verificationRows } from "@/lib/v2/verification"

describe("queue age", () => {
  it("counts whole days to the demo day and never goes negative", () => {
    expect(ageDays("2026-10-09T09:00:00Z", "2026-10-19")).toBe(10)
    expect(ageDays("2026-10-19T09:00:00Z", "2026-10-19")).toBe(0)
    expect(ageDays("2026-11-01T09:00:00Z", "2026-10-19")).toBe(0)
    expect(ageDays("not a date")).toBe(0)
  })
  it("buckets 0-2, 3-6 and 7+ days", () => {
    expect([0, 2, 3, 6, 7, 12].map(ageBucket)).toEqual(["recent", "recent", "waiting", "waiting", "overdue", "overdue"])
  })
  it("finds the oldest seeded item (the hand-written 12 days, or an older generated one)", () => {
    const s = createSeed()
    const items = queueItems(s)
    const days = items.map((i) => ageDays(i.since, DEMO_TODAY))
    expect(Math.max(...days)).toBeGreaterThanOrEqual(12)
    expect(Math.max(...days)).toBeLessThanOrEqual(14)
    expect(Math.min(...days)).toBeGreaterThanOrEqual(1)
    expect(oldestItem(items)?.days).toBe(Math.max(...days))
    expect(oldestItem([])).toBeNull()
  })
})

describe("agreement across the queue", () => {
  it("covers every item and finds at least one of each in the seed", () => {
    const s = createSeed()
    const items = queueItems(s)
    const c = agreementCounts(s, items)
    expect(c.agreed + c.differed + c["not-comparable"]).toBe(items.length)
    expect(c.differed).toBeGreaterThanOrEqual(1)
    expect(c["not-comparable"]).toBeGreaterThanOrEqual(1)
    expect(itemAgreement(s, items.find((i) => i.state === "needs-outcome")!)).toBe("not-comparable")
  })
})

describe("outcomes by skill", () => {
  it("has one row per skill, dots add up, and none is returned", () => {
    const s = createSeed()
    const rows = skillOutcomeRows(s)
    const shown = s.evaluations.filter((e) => e.status !== "returned").length
    expect(rows.reduce((n, r) => n + r.dots.length, 0)).toBe(shown)
    for (const r of rows) expect(r.met + r.notMet + r.notYet + r.pending).toBe(r.dots.length)
    expect(new Set(rows.map((r) => r.skillId)).size).toBe(rows.length)
    expect(rows[0].notMet).toBeGreaterThanOrEqual(rows[rows.length - 1].notMet)
  })
})

describe("records readiness", () => {
  it("puts every student in exactly one group", () => {
    const s = createSeed()
    const rows = verificationRows(s)
    const groups = recordGroups(rows)
    expect(groups.reduce((n, g) => n + g.rows.length, 0)).toBe(rows.length)
    for (const g of groups) for (const r of g.rows) expect(recordGroupOf(r)).toBe(g.id)
    expect(groups.length).toBeGreaterThanOrEqual(1)
  })
  it("returns no groups, so no empty headers, when there are no rows", () => {
    expect(recordGroups([])).toEqual([])
  })
  it("a record with every mandatory skill and nothing pending is ready", () => {
    const base = { studentId: "x", name: "X", status: "not-verified" as const, version: null, verifiedAt: null, verifiedBy: null, counted: 3 }
    expect(recordGroupOf({ ...base, mandatoryAchieved: 5, mandatoryTotal: 5, pending: 0 })).toBe("ready")
    expect(recordGroupOf({ ...base, mandatoryAchieved: 5, mandatoryTotal: 5, pending: 1 })).toBe("unmet")
    expect(recordGroupOf({ ...base, mandatoryAchieved: 2, mandatoryTotal: 5, pending: 0 })).toBe("unmet")
    expect(recordGroupOf({ ...base, status: "changed", mandatoryAchieved: 5, mandatoryTotal: 5, pending: 0 })).toBe("changed")
  })
})

describe("preceptor request age", () => {
  it("words the age and sorts oldest first", () => {
    const ago = (n: number) => new Date(Date.parse(`${DEMO_TODAY}T09:00:00Z`) - n * 86_400_000).toISOString()
    expect(sentAgo(ago(0))).toBe("Sent today")
    expect(sentAgo(ago(1))).toBe("Sent 1 day ago")
    expect(sentAgo(ago(3))).toBe("Sent 3 days ago")
    expect(oldestFirst([{ createdAt: "2026-10-18" }, { createdAt: "2026-10-10" }, { createdAt: "2026-10-18" }]).map((x) => x.createdAt)).toEqual(["2026-10-10", "2026-10-18", "2026-10-18"])
  })
})
