import { describe, expect, it } from "vitest"
import { createSeed, IDS } from "@/lib/v2/seed"
import { approvalEntries, approvalTotals, approvalsInScope, CAUSE_ORDER, heldState } from "@/lib/v2/approvals"
import { approveItems, queueItems } from "@/lib/v2/queue"
import { applyDecisions, labState, reviewRows, scopeRows, studentRecord } from "@/lib/lab/reviewer"
import { TARGETS } from "@/lib/v2/generate"

/** One definition of "awaiting approval" (lib/v2/approvals.ts) and how the stored statuses reconcile with the queue. */

const s = createSeed()

describe("what is held, and why", () => {
  it("reconciles the 20 stored awaiting-approval rows with the evidence held for unadopted evaluator names", () => {
    const all = approvalEntries(s)
    const t = approvalTotals(s, all)
    expect(t.statusRows).toBe(TARGETS.awaiting)
    expect(t.unverifiedRows).toBe(s.evaluations.filter((e) => e.status === "counted" && s.people.some((p) => p.id === e.evaluatorId && p.verified === false)).length)
    // Every evaluation in the queue is either a stored status row or held for a name; an entry with no outcome counts as one.
    expect(t.evaluations).toBe(t.statusRows + t.unverifiedRows + t.paper)
    expect(Object.values(t.byCause).reduce((a, b) => a + b, 0)).toBe(t.entries)
    for (const e of all) expect(CAUSE_ORDER).toContain(e.cause)
  })

  it("the raw status queue is a subset of the entries (same keys)", () => {
    const keys = new Set(approvalEntries(s).map((e) => e.key))
    for (const i of queueItems(s)) expect(keys.has(i.key)).toBe(true)
  })

  it("heldState is idempotent and the lab state is the same function", () => {
    const h = heldState(s)
    expect(heldState(h)).toBe(h)
    expect(labState(s)).toBe(h)
    expect(approvalEntries(h)).toEqual(approvalEntries(s))
  })

  it("an approval stays approved (not re-held) even though the evaluator name is still unadopted", () => {
    const entry = approvalEntries(s).find((e) => e.kind === "unverified")!
    const r = approveItems(heldState(s), entry.item ? [entry.item.key] : [], IDS.reviewer, "2026-10-26T10:00:00Z")
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const before = approvalTotals(s, approvalEntries(s)).evaluations
    expect(approvalTotals(r.state, approvalEntries(r.state)).evaluations).toBe(before - entry.item.evaluations.length)
  })
})

describe("scope: the term window", () => {
  it("current term is the default; the rest are counted as earlier, never dropped silently", () => {
    const cur = approvalsInScope(s)
    expect(cur.entries.length + cur.earlier).toBe(cur.total)
    expect(approvalsInScope(s, { term: "fall-2026" }).entries).toEqual(cur.entries)
    expect(approvalsInScope(s, { term: "Fall 2026" }).entries).toEqual(cur.entries)
    expect(approvalsInScope(s, { term: "trm-fa26" }).entries).toEqual(cur.entries)
  })
})

describe("every consumer reads it", () => {
  it("reviewer queue rows are exactly the entries", () => {
    const st = applyDecisions(s, [])
    const rows = reviewRows(st)
    expect(rows.map((r) => r.key)).toEqual(approvalEntries(s).map((e) => e.key))
    expect(scopeRows(st, rows, { cohort: "", group: "", term: "", course: "" }).rows.map((r) => r.key)).toEqual(approvalsInScope(s).entries.map((e) => e.key))
  })

  it("the student record shows the same held evaluations as the queue", () => {
    const st = applyDecisions(s, [])
    const rows = reviewRows(st)
    const e = approvalEntries(s).find((x) => x.evaluations.length > 0)!
    const rec = studentRecord(st, rows, e.studentId)!
    const held = rec.evaluations.filter((x) => x.status === "Awaiting approval").map((x) => x.id).sort()
    const queued = approvalEntries(s).filter((x) => x.studentId === e.studentId).flatMap((x) => x.evaluations.map((y) => y.id)).sort()
    expect(held).toEqual(queued)
  })
})
