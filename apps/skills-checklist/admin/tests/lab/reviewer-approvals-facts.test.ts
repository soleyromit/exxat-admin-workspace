import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { REVIEW_DECISION_LABEL, SENT_FOR_NEW_EVALUATION_WORD } from "@/lib/v2/labels"
import { verificationStatus } from "@/lib/v2/verification"
import { EMPTY_SCOPE } from "@/lib/lab/scope"
import { buildAttainment, detailRows } from "@/lib/lab/attainment"
import { commitDecision, evaluatorLine, itemDetail, labState, oldestUnassigned, reviewRows, scopeRows, whereLine } from "@/lib/lab/reviewer"

const seed = createSeed()
const src = (f: string) => readFileSync(join(__dirname, "../../components/lab/screens", f), "utf8")

// REQ AR-01: "Administrators must be able to see every evaluation awaiting approval, with the student, skill, course, setting,
// location, evaluator and role."
describe("AR-01: every approvals row carries the seven facts", () => {
  const state = labState(seed)
  const rows = scopeRows(state, reviewRows(state), EMPTY_SCOPE).rows

  it("each row has student, skill, course, setting and location, and the where line names all three", () => {
    expect(rows.length).toBeGreaterThan(20)
    for (const r of rows) {
      expect(r.student).toBeTruthy()
      expect(r.skills.length).toBeGreaterThan(0)
      expect(r.course).toBeTruthy()
      expect(r.setting).toBeTruthy()
      expect(r.location).toBeTruthy()
      expect(whereLine(r)).toBe(`${r.course} · ${r.setting} · ${r.location}`)
    }
  })

  it("the evaluator line carries the role when one is recorded", () => {
    const withRole = rows.find((r) => r.evaluatorRole)!
    expect(evaluatorLine(withRole)).toBe(`${withRole.evaluator}, ${withRole.evaluatorRole}`)
    expect(evaluatorLine({ evaluator: "J. Delgado", evaluatorRole: "" })).toBe("J. Delgado")
  })

  it("Approvals A, B and C and Admin Approvals B render the where line and the evaluator with role on the row", () => {
    expect(src("reviewer-approvals-a.tsx")).toMatch(/whereLine\(r\)/)
    expect(src("reviewer-approvals-a.tsx")).toMatch(/<EvaluatorName name=\{r\.evaluator\} role=\{r\.evaluatorRole\}/)
    const b = src("reviewer-approvals-b.tsx")
    expect(b).toMatch(/whereLine\(r\)/)
    expect(b).toMatch(/evaluatorLine\(r\)/)
    const c = src("reviewer-approvals-c.tsx")
    expect(c).toMatch(/whereLine\(r\)/)
    expect(c).toMatch(/evaluatorLine\(r\)/)
    // C says the evaluator once per card, name and role on one line (evaluatorLine), in every column: no second name badge.
    expect(c.match(/data-row-evaluator/g)).toHaveLength(1)
    expect(c).not.toMatch(/<EvaluatorName/)
    // Admin A is the reviewer list itself; Admin B lists each submission with the same triage columns.
    expect(src("admin-approvals-a.tsx")).toMatch(/<ReviewerApprovalsA \/>/)
    expect(src("admin-approvals-b.tsx")).toMatch(/triageColumns\(scope, ui\)/)
  })
})

// Oct 26 call, item 13: "Evaluator not assigned" must offer Assign, not only a count.
describe("Call item 13: Admin Approvals B offers Assign for evaluator not assigned", () => {
  it("finds the oldest evaluator-not-assigned submission, and the page puts the Adopt, merge or assign menu on it", () => {
    const state = labState(seed)
    const rows = scopeRows(state, reviewRows(state), EMPTY_SCOPE).rows
    const oldest = oldestUnassigned(rows)!
    expect(oldest.reason).toBe("new-evaluator")
    for (const r of rows) if (r.reason === "new-evaluator") expect(r.days).toBeLessThanOrEqual(oldest.days)
    expect(oldestUnassigned(rows.filter((r) => r.reason !== "new-evaluator"))).toBeNull()
    const b = src("admin-approvals-b.tsx")
    expect(b).toMatch(/oldestUnassigned\(ctx\.rowsInScope\)/)
    expect(b).toMatch(/<EvaluatorMenu row=\{unassigned\}/)
  })
})

// Decision D-X25: "Assign to someone else" is a handoff, not a return; it is stored and exported as such.
describe("D-X25: assign to someone else is stored and exported as reassigned, not returned", () => {
  const state = labState(seed)
  const rows = reviewRows(state)
  // A held row on a required record in scope, so its evaluations appear in the export (one row per evaluation on such a record).
  const onRecord = new Set(buildAttainment(seed, EMPTY_SCOPE).records.map((r) => `${r.studentId}|${r.skillId}`))
  const row = scopeRows(state, rows, EMPTY_SCOPE).rows.find((r) => itemDetail(state, rows, r.key)?.assignTo.length && r.skillIds.some((k) => onRecord.has(`${r.studentId}|${k}`)))!
  const to = itemDetail(state, rows, row.key)!.assignTo[0]
  const next = commitDecision(seed, { kind: "assign", key: row.key, toId: to.id })

  it("stores the review decision as reassigned on every held evaluation (still held out of counting)", () => {
    for (const id of row.evaluationIds) {
      const e = next.evaluations.find((x) => x.id === id)!
      expect(e.review?.decision).toBe("reassigned")
      expect(e.status).not.toBe("counted")
    }
    expect(REVIEW_DECISION_LABEL.reassigned).toBe(SENT_FOR_NEW_EVALUATION_WORD)
  })

  it("the export reads the reassigned evaluations as 'Sent for a new evaluation' and never 'Returned'", () => {
    const ids = new Set(row.evaluationIds)
    const m = buildAttainment(next, EMPTY_SCOPE)
    const all = detailRows(m, next)
    // Match the export rows of the reassigned evaluations by their review note (one row per evaluation on a record in scope).
    const note = next.evaluations.find((e) => ids.has(e.id))!.review!.note
    const mine = all.filter((r) => r.reviewNote === note && r.student === row.student)
    expect(mine.length).toBeGreaterThan(0)
    for (const r of mine) {
      expect(r.status).toBe(SENT_FOR_NEW_EVALUATION_WORD)
      expect(r.review).toBe(SENT_FOR_NEW_EVALUATION_WORD)
    }
    // A real return still exports as Returned.
    const real = detailRows(buildAttainment(seed, EMPTY_SCOPE), seed).filter((r) => r.review === REVIEW_DECISION_LABEL.returned)
    for (const r of real) expect(r.status).not.toBe(SENT_FOR_NEW_EVALUATION_WORD)
  })

  it("the export maps every stored decision through the one label map (no fallback to Returned)", () => {
    const att = readFileSync(join(__dirname, "../../lib/lab/attainment.ts"), "utf8")
    expect(att).toMatch(/REVIEW_DECISION_LABEL\[e\.review\.decision\]/)
    expect(att).not.toMatch(/decision === "approved" \? "approved" : "returned"/)
  })

  it("director verification never words a reassignment as a return", () => {
    const student = row.studentId
    const v = verificationStatus(next, student)
    for (const c of v.changes) expect(c).not.toMatch(/\(returned\)/)
  })
})
