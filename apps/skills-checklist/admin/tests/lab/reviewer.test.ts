import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { queueItems } from "@/lib/v2/queue"
import { EMPTY_SCOPE } from "@/lib/lab/scope"
import {
  AGING_DAYS,
  applyDecisions,
  boardColumns,
  bulkCheck,
  itemDetail,
  labState,
  queueOrder,
  recordHref,
  reviewRows,
  ruleCheck,
  scopeRows,
  story,
  studentRecord,
  summarize,
} from "@/lib/lab/reviewer"

const seed = createSeed()
const state = labState(seed)
const rows = reviewRows(state)
const current = scopeRows(state, rows, EMPTY_SCOPE)

describe("reviewer queue at scale", () => {
  it("reads unadopted evaluator names as held, without touching the store", () => {
    const unverified = new Set(seed.people.filter((p) => p.verified === false).map((p) => p.id))
    expect(unverified.size).toBe(14)
    expect(seed.evaluations.some((e) => unverified.has(e.evaluatorId) && e.status === "counted")).toBe(true)
    expect(state.evaluations.some((e) => unverified.has(e.evaluatorId) && e.status === "counted")).toBe(false)
    expect(queueItems(state).length).toBeGreaterThan(queueItems(seed).length)
  })

  it("holds 16+ submissions in the current term, oldest first, every row with a cause", () => {
    expect(current.rows.length).toBeGreaterThanOrEqual(16)
    for (let i = 1; i < current.rows.length; i++) expect(current.rows[i - 1].since <= current.rows[i].since).toBe(true)
    for (const r of current.rows) {
      expect(r.why.length).toBeGreaterThan(5)
      expect(r.why).not.toMatch(/\bitems\b/)
    }
    const reasons = new Set(current.rows.map((r) => r.reason))
    for (const k of ["new-evaluator", "rule", "disagree", "paper"]) expect(reasons.has(k as never), k).toBe(true)
  })

  it("names earlier-term work instead of hiding it silently", () => {
    expect(current.earlier).toBeGreaterThan(0)
    expect(current.earlierTerm).toBe("Summer 2026")
  })

  it("narrows by cohort, group and course (strategy/06 S8)", () => {
    const c = scopeRows(state, rows, { ...EMPTY_SCOPE, cohort: "BSN 2028" })
    expect(c.rows.length).toBeGreaterThan(0)
    expect(c.rows.every((r) => r.cohort === "BSN 2028")).toBe(true)
    const none = scopeRows(state, rows, { ...EMPTY_SCOPE, course: "crs-nur130" })
    expect(none.rows).toHaveLength(0)
  })

  it("summarises without repeating: count, oldest, median wait", () => {
    const s = summarize(current.rows)
    expect(s.submissions).toBe(current.rows.length)
    expect(s.oldestDays).toBeGreaterThanOrEqual(s.medianDays)
    expect(s.aging).toBe(current.rows.filter((r) => r.days >= AGING_DAYS).length)
  })

  it("puts every row in exactly one board column", () => {
    const b = boardColumns(current.rows)
    expect(Object.values(b).reduce((n, l) => n + l.length, 0)).toBe(current.rows.length)
    expect(b.aging.every((r) => r.days >= AGING_DAYS)).toBe(true)
  })
})

describe("decisions", () => {
  it("bulk approves like rows only and names the blockers", () => {
    const like = current.rows.filter((r) => r.likeKey === "rule-met").slice(0, 2)
    const paper = current.rows.find((r) => r.reason === "paper")!
    const ok = bulkCheck(current.rows, new Set(like.map((r) => r.key)))
    expect(ok.alike).toBe(true)
    expect(ok.approvable).toHaveLength(2)
    const mixed = bulkCheck(current.rows, new Set([like[0].key, paper.key]))
    expect(mixed.alike).toBe(false)
    expect(mixed.blocked.map((b) => b.row.key)).toEqual([paper.key])
    const partial = bulkCheck(current.rows, new Set(like.map((r) => r.key)), new Set([like[0].key]))
    expect(partial.approvable).toHaveLength(1)
    expect(partial.blocked[0].reason).toMatch(/approved it/)
  })

  it("approve removes the row and counts the evidence; return sends it back", () => {
    const r = current.rows.find((x) => x.likeKey === "rule-met")!
    const after = applyDecisions(seed, [{ kind: "approve", key: r.key }])
    expect(reviewRows(after).some((x) => x.key === r.key)).toBe(false)
    expect(after.evaluations.filter((e) => r.evaluationIds.includes(e.id)).every((e) => e.status === "counted")).toBe(true)
    const back = applyDecisions(seed, [{ kind: "return", key: r.key, note: "Add the date.", path: "correct-same" }])
    expect(back.evaluations.filter((e) => r.evaluationIds.includes(e.id)).every((e) => e.status === "returned")).toBe(true)
  })

  it("adopting a name releases every held evaluation from that evaluator", () => {
    const r = current.rows.find((x) => x.kind === "unverified")!
    const after = applyDecisions(seed, [{ kind: "adopt", evaluatorId: r.evaluatorId!, mode: "adopt" }])
    expect(reviewRows(after).some((x) => x.evaluatorId === r.evaluatorId)).toBe(false)
  })

  it("states what approval does to the rule in numbers", () => {
    const r = current.rows.find((x) => x.kind === "submission" && !x.block)!
    const checks = ruleCheck(state, r)
    expect(checks.length).toBe(r.skillIds.length)
    for (const c of checks) expect(c.numbers).toMatch(/^\d+ of \d+$|No rule/)
  })
})

describe("review item and student record", () => {
  it("tells the submission story oldest first and ends waiting for the reviewer", () => {
    const r = current.rows.find((x) => x.kind === "submission" && !x.block)!
    const d = itemDetail(state, rows, r.key)!
    expect(d.comparisons.length).toBe(r.evaluationIds.length)
    const steps = story(state, d)
    expect(steps.some((s) => s.id === "held")).toBe(true)
  })

  it("offers other qualified evaluators for a correction (RV-04) and merge targets for a new name", () => {
    const d = itemDetail(state, rows, "sub-02")!
    expect(d.otherEvaluators.length).toBeGreaterThan(0)
    expect(d.otherEvaluators.every((o) => o.id !== d.row.evaluatorId)).toBe(true)
    const u = current.rows.find((x) => x.kind === "unverified")!
    expect(itemDetail(state, rows, u.key)!.mergeCandidates.length).toBeGreaterThan(0)
  })

  it("paper forms say nothing about the rule until the outcome is entered", () => {
    const p = current.rows.find((x) => x.reason === "paper")!
    expect(ruleCheck(state, p)).toEqual([])
  })

  it("shows the same held evaluations on the record as in the queue", () => {
    const r = current.rows.find((x) => x.kind === "submission")!
    const rec = studentRecord(state, rows, r.studentId)!
    const queued = rec.evaluations.filter((e) => e.queueKey === r.key)
    expect(queued.map((e) => e.id).sort()).toEqual([...r.evaluationIds].sort())
    expect(queued.every((e) => e.status === "Awaiting approval")).toBe(true)
    expect(recordHref({ ...EMPTY_SCOPE, cohort: "BSN 2027" }, r.studentId)).toContain("cohort=BSN+2027")
  })
})

describe("Approvals default order (UX critique 2026-10-26)", () => {
  it("keeps the same rows and count, leads with the oldest, and mixes every cause into the first screen", () => {
    const ordered = queueOrder(current.rows)
    expect(ordered).toHaveLength(current.rows.length)
    expect(new Set(ordered.map((r) => r.key))).toEqual(new Set(current.rows.map((r) => r.key)))
    const oldest = [...current.rows].sort((a, b) => (a.since < b.since ? -1 : a.since > b.since ? 1 : 0))[0]!
    expect(ordered[0]!.since).toBe(oldest.since)
    const causes = new Set(current.rows.map((r) => r.reason))
    // Every cause present in scope shows within the first (number of causes) rows: the first viewport is not one cause.
    expect(new Set(ordered.slice(0, causes.size).map((r) => r.reason))).toEqual(causes)
    expect(causes.size).toBeGreaterThan(2)
    for (const c of causes) {
      const lane = ordered.filter((r) => r.reason === c).map((r) => r.since)
      expect(lane).toEqual([...lane].sort())
    }
  })
})
