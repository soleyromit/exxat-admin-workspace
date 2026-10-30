import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { facts } from "@/lib/v2/facts"
import { CAUSE_LABEL, approvalsBadgeCount } from "@/lib/v2/approvals"
import { EVALUATOR_NOT_ASSIGNED_LABEL } from "@/lib/v2/labels"
import { returnedItems } from "@/lib/v2/queue"
import { DEFAULT_SCOPE } from "@/lib/v2/population"
import { EMPTY_SCOPE } from "@/lib/lab/scope"
import { BOARD_COLUMNS, REASON_META, assignEntry, assignNote, commitDecision, itemDetail, labState, reviewRows, scopeRows } from "@/lib/lab/reviewer"

/**
 * "Evaluator not assigned" and "Assign to someone else" (Oct 26 call, item 13). Assigning moves one Approvals row out of "awaiting
 * approval" into "waiting with evaluators": the facts registry (badge, dashboard figures) moves by exactly one each way, the held
 * evidence stays on the record without counting, and the student sees one open request, not an extra return.
 */

const seed = createSeed()

function firstUnverifiedRow(raw: typeof seed) {
  const state = labState(raw)
  const rows = scopeRows(state, reviewRows(state), EMPTY_SCOPE).rows
  const row = rows.find((r) => r.kind === "unverified")!
  const to = itemDetail(state, reviewRows(state), row.key)!.assignTo[0]
  return { state, rows, row, to }
}

describe("Evaluator not assigned: the cause label", () => {
  it("reads 'Evaluator not assigned' everywhere the cause shows; the internal id stays", () => {
    expect(CAUSE_LABEL["new-evaluator"]).toBe(EVALUATOR_NOT_ASSIGNED_LABEL)
    expect(EVALUATOR_NOT_ASSIGNED_LABEL).toBe("Evaluator not assigned")
    expect(REASON_META["new-evaluator"].label).toBe("Evaluator not assigned")
    expect(BOARD_COLUMNS.find((c) => c.id === "new-evaluator")?.label).toBe("Evaluator not assigned")
  })
})

describe("Assign to someone else", () => {
  it("has a row from an unadopted name in the current term and a qualified evaluator to send it to", () => {
    const { row, to } = firstUnverifiedRow(seed)
    expect(row.evaluatorUnverified).toBe(true)
    expect(to).toBeTruthy()
  })

  it("moves exactly one row from awaiting approval to waiting with evaluators (facts registry)", () => {
    const { row, to } = firstUnverifiedRow(seed)
    const before = facts(seed, DEFAULT_SCOPE)
    const badgeBefore = approvalsBadgeCount(seed)
    const next = commitDecision(seed, { kind: "assign", key: row.key, toId: to.id })
    const after = facts(next, DEFAULT_SCOPE)
    expect(after.awaitingApproval).toBe(before.awaitingApproval - 1)
    expect(approvalsBadgeCount(next)).toBe(badgeBefore - 1)
    expect(after.waitingRequests).toBe(before.waitingRequests + 1)
    // Nothing else moves: achievement, behind and students are unchanged (held evidence never counted, and still does not).
    expect(after.mandatoryAchieved).toBe(before.mandatoryAchieved)
    expect(after.behind).toBe(before.behind)
    expect(after.studentsInScope).toBe(before.studentsInScope)
    // The same holds for a cohort scope that contains the student.
    const cohort = seed.people.find((p) => p.id === row.studentId)!.cohort!
    const scope = { ...DEFAULT_SCOPE, cohort }
    expect(facts(next, scope).awaitingApproval).toBe(facts(seed, scope).awaitingApproval - 1)
    expect(facts(next, scope).waitingRequests).toBe(facts(seed, scope).waitingRequests + 1)
  })

  it("sends a new link request to the chosen evaluator; the held evidence stays, linked, without a separate return", () => {
    const { row, to } = firstUnverifiedRow(seed)
    const next = commitDecision(seed, { kind: "assign", key: row.key, toId: to.id })
    const req = next.submissions.find((x) => x.reassignments?.some((r) => r.toId === to.id) && x.studentId === row.studentId)!
    expect(req).toBeTruthy()
    expect(req.status).toBe("with-evaluator")
    expect(req.method).toBe("link")
    expect(req.assignedToId).toBe(to.id)
    expect(new Set(req.skillIds)).toEqual(new Set(row.skillIds))
    for (const id of row.evaluationIds) {
      const e = next.evaluations.find((x) => x.id === id)!
      expect(e.status).toBe("reassigned")
      expect(e.submissionId).toBe(req.id)
      expect(e.review?.note).toBe(assignNote(to.name))
      expect(e.versions).toEqual(seed.evaluations.find((x) => x.id === id)!.versions)
    }
    expect(returnedItems(next).length).toBe(returnedItems(seed).length)
    expect(reviewRows(labState(next)).some((r) => r.key === row.key)).toBe(false)
    expect(next.audit.length).toBe(seed.audit.length + 1)
  })

  it("an existing request goes back out to the new evaluator (same request, reassignment recorded)", () => {
    const state = labState(seed)
    const rows = reviewRows(state)
    const row = rows.find((r) => r.kind === "submission" && r.evaluatorId)!
    const to = itemDetail(state, rows, row.key)!.assignTo[0]
    const next = assignEntry(state, row.key, to.id)
    const req = next.submissions.find((x) => x.id === row.key)!
    expect(req.status).toBe("with-evaluator")
    expect(req.assignedToId).toBe(to.id)
    expect(req.completedById).toBeUndefined()
    expect(req.reassignments?.at(-1)?.toId).toBe(to.id)
    expect(next.submissions.length).toBe(state.submissions.length)
  })

  it("does nothing for a gone row, a student, an unadopted name or the current evaluator", () => {
    const { state, row } = firstUnverifiedRow(seed)
    const student = state.people.find((p) => p.kind === "student")!
    const unadopted = state.people.find((p) => p.verified === false)!
    const reviewer = state.people.find((p) => p.kind === "reviewer")!
    expect(assignEntry(state, row.key, reviewer.id)).toBe(state)
    // The picker offers only adopted preceptors, lab instructors and clinical faculty, never the current evaluator.
    const offered = itemDetail(state, reviewRows(state), row.key)!.assignTo.map((o) => state.people.find((p) => p.id === o.id)!)
    expect(offered.length).toBeGreaterThan(0)
    for (const p of offered) {
      expect(["preceptor", "lab-instructor", "faculty"]).toContain(p.kind)
      expect(p.verified).not.toBe(false)
      expect(p.id).not.toBe(row.evaluatorId)
    }
    expect(assignEntry(state, "no-such-row", student.id)).toBe(state)
    expect(assignEntry(state, row.key, student.id)).toBe(state)
    expect(assignEntry(state, row.key, unadopted.id)).toBe(state)
    expect(assignEntry(state, row.key, row.evaluatorId!)).toBe(state)
  })
})
