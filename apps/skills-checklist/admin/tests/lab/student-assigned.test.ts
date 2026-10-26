import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { facts } from "@/lib/v2/facts"
import { DEFAULT_SCOPE } from "@/lib/v2/population"
import { SENT_FOR_NEW_EVALUATION_WORD, sentForNewEvaluationLabel } from "@/lib/v2/labels"
import { requestWaitText, sentElsewhereTo, sentForNewEvaluationTo, studentHistory } from "@/lib/v2/student"
import { EMPTY_SCOPE } from "@/lib/lab/scope"
import { assignNote, commitDecision, itemDetail, labState, reviewRows, scopeRows } from "@/lib/lab/reviewer"
import { attempts, buildStudent, fixModel, requestGroups } from "@/lib/lab/student"
import { RESULT_WORD, recordCounts, recordRows } from "@/lib/lab/student2"

/**
 * Student wording for held evidence a reviewer assigned to someone else (Oct 26 call, item 13). The held attempt is a handoff,
 * not a return: My requests, Fix returned, Skill detail and Record all say "Sent to {name} for a new evaluation", never
 * "Returned", and the facts registry counts do not change beyond the one row that moves from approval to waiting.
 */

const seed = createSeed()

function assigned() {
  const state = labState(seed)
  const row = scopeRows(state, reviewRows(state), EMPTY_SCOPE).rows.find((r) => r.kind === "unverified")!
  const to = itemDetail(state, reviewRows(state), row.key)!.assignTo[0]
  const next = commitDecision(seed, { kind: "assign", key: row.key, toId: to.id })
  const req = next.submissions.find((x) => x.studentId === row.studentId && x.reassignments?.some((h) => h.toId === to.id))!
  return { row, to, next, req, label: sentForNewEvaluationLabel(to.name) }
}

describe("Sent for a new evaluation: one label", () => {
  it("is the assign note, so the audit and the student read the same sentence", () => {
    expect(assignNote("Dana Ruiz")).toBe("Sent to Dana Ruiz for a new evaluation")
    expect(sentForNewEvaluationLabel("Dana Ruiz")).toBe(assignNote("Dana Ruiz"))
    expect(SENT_FOR_NEW_EVALUATION_WORD).not.toMatch(/return/i)
  })

  it("recognises the held evaluations and the request; a real return is never mistaken for one", () => {
    const { row, next, req, to } = assigned()
    for (const id of row.evaluationIds) expect(sentElsewhereTo(next, next.evaluations.find((e) => e.id === id)!)?.id).toBe(to.id)
    expect(sentForNewEvaluationTo(next, req)?.id).toBe(to.id)
    for (const e of seed.evaluations.filter((x) => x.status === "returned")) expect(sentElsewhereTo(seed, e)).toBeNull()
    for (const x of seed.submissions) expect(sentForNewEvaluationTo(seed, x)).toBeNull()
  })
})

describe("Sent for a new evaluation: what the student sees", () => {
  it("My requests: the new request reads the label and waits; nothing is listed as returned", () => {
    const { row, next, req, label } = assigned()
    const before = requestGroups(seed, row.studentId).flatMap((g) => g.returned).length
    const groups = requestGroups(next, row.studentId)
    const line = groups.flatMap((g) => g.waiting).find((r) => r.id === req.id)!
    expect(line.statusLabel).toBe(label)
    expect(groups.flatMap((g) => g.returned).length).toBe(before)
    expect(groups.flatMap((g) => g.returned).some((r) => r.id === req.id)).toBe(false)
    expect(requestWaitText(next, req)).toBe(label)
  })

  it("Fix returned: the request is not the student's to fix", () => {
    const { row, next, req } = assigned()
    expect(fixModel(next, row.studentId, { submissionId: req.id })).toBeNull()
  })

  it("Skill detail: the held attempt says 'Sent to {name} for a new evaluation', next to the new waiting request", () => {
    const { row, next, req, label } = assigned()
    const rows = attempts(next, row.studentId, row.skillIds[0])
    const held = rows.filter((a) => row.evaluationIds.includes(a.key))
    expect(held.length).toBeGreaterThan(0)
    for (const a of held) {
      expect(a.kind).toBe("sent")
      expect(a.status).toBe(label)
      expect(`${a.status} ${a.why}`).not.toMatch(/Returned/)
    }
    expect(rows.find((a) => a.key === req.id)?.kind).toBe("waiting")
  })

  it("Record: the held attempt has its own result, not Returned; the returned count is unchanged", () => {
    const { row, next, label } = assigned()
    const held0 = labState(seed)
    const mBefore = buildStudent(held0, row.studentId)!
    const mAfter = buildStudent(labState(next), row.studentId)!
    const before = recordCounts(recordRows(held0, mBefore))
    const rows = recordRows(labState(next), mAfter)
    const after = recordCounts(rows)
    const held = rows.filter((r) => row.evaluationIds.includes(r.id))
    expect(held.length).toBe(row.evaluationIds.length)
    for (const r of held) {
      expect(r.result).toBe("sent")
      expect(RESULT_WORD[r.result]).toBe(SENT_FOR_NEW_EVALUATION_WORD)
      expect(r.why.startsWith(label)).toBe(true)
    }
    expect(after.returned).toBe(before.returned)
    expect(after.sent).toBe(row.evaluationIds.length)
    expect(after.counted).toBe(before.counted)
  })

  it("v2 history: the held attempt reads the label and adds to neither returned nor waiting", () => {
    const { row, next, label } = assigned()
    const before = studentHistory(labState(seed), row.studentId).summary
    const h = studentHistory(next, row.studentId)
    const held = h.skills.flatMap((k) => k.attempts).filter((a) => row.evaluationIds.includes(a.key))
    for (const a of held) expect(a.outcome).toBe(label)
    expect(h.summary.returned).toBe(before.returned)
    expect(h.summary.counted).toBe(before.counted)
  })

  it("leaves the facts registry as the assign test fixes it (no count changes beyond the one moved row)", () => {
    const { next } = assigned()
    const b = facts(seed, DEFAULT_SCOPE)
    const a = facts(next, DEFAULT_SCOPE)
    expect(a.mandatoryAchieved).toBe(b.mandatoryAchieved)
    expect(a.behind).toBe(b.behind)
    expect(a.awaitingApproval).toBe(b.awaitingApproval - 1)
    expect(a.waitingRequests).toBe(b.waitingRequests + 1)
  })
})
