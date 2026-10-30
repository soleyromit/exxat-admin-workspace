import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { facts } from "@/lib/v2/facts"
import { CAUSE_LABEL } from "@/lib/v2/approvals"
import { APPROVE_HINT, REVIEW_DECISION_LABEL, SEND_BACK_LABEL } from "@/lib/v2/labels"
import { requestWaitText, skillProgress } from "@/lib/v2/student"
import { DEFAULT_SCOPE } from "@/lib/v2/population"
import { EMPTY_SCOPE } from "@/lib/lab/scope"
import { commitDecision, labState, reasonExplain, reasonText, reviewRows, scopeRows, type ReviewRow } from "@/lib/lab/reviewer"

/**
 * Romit 2026-10-27 on Approvals: "what rule requires approval? In the list, I can't interpret it, how do you expect a user to provide
 * approval? Also, what is Return?" The reason is said in plain words naming the skill or the person; Return is "Send back to
 * student" with a reason the student sees; Approve counts (REQ AR-05, AR-06).
 */

const seed = createSeed()
const state = labState(seed)
const rows = scopeRows(state, reviewRows(state), EMPTY_SCOPE).rows
const lab = (f: string) => readFileSync(join(__dirname, "../../components/lab", f), "utf8")
const byReason = (k: ReviewRow["reason"]) => rows.find((r) => r.reason === k)

describe("Why it is here, in plain words, for every reason kind", () => {
  it("Approval required names the skill (the skill's own setting, SC-15)", () => {
    const r = byReason("rule")!
    expect(r.why).toBe(`Approval required for ${r.skills.length > 1 ? `${r.skills[0]} and ${r.skills.length - 1} more` : r.skills[0]}`)
    const explain = r.because.find((b) => b.reason === "rule")!.text
    expect(explain).toContain(r.skills[0])
    expect(explain).toMatch(/set to need approval before evidence counts/)
  })

  it("Evaluator not on the list names the person", () => {
    const r = byReason("new-evaluator")!
    expect(r.why).toBe(`${r.evaluator} is not on your evaluator list`)
    expect(r.because[0].text).toContain(`named ${r.evaluator}`)
  })

  it("Disagreement and paper form say what differs or what is missing", () => {
    expect(reasonText("disagree", { evaluator: "A", skills: ["X"] })).toBe("Student and evaluator disagree")
    expect(reasonText("paper", { evaluator: "A", skills: ["X"] })).toBe("Paper form: outcome not entered yet")
    expect(reasonExplain("paper", { evaluator: "A", skills: ["X"] }, [])).toMatch(/Enter the outcome from the paper form before you approve/)
    const d = byReason("disagree")
    if (d) expect(d.because.find((b) => b.reason === "disagree")!.text).toMatch(/the student said .+, the evaluator said /)
  })

  it("no row and no cause label says 'Rule needs approval' or 'Self'", () => {
    expect(Object.values(CAUSE_LABEL)).not.toContain("Rule needs approval")
    for (const r of rows) {
      expect(r.why).not.toMatch(/Rule needs approval|^Self/)
      expect(r.because.length).toBe(r.reasons.length)
      for (const b of r.because) expect(b.text.length).toBeGreaterThan(10)
    }
  })
})

describe("Send back to student", () => {
  it("is the staff word everywhere on Approvals and the review; Return is gone", () => {
    expect(SEND_BACK_LABEL).toBe("Send back to student")
    expect(REVIEW_DECISION_LABEL.returned).toBe("Sent back to student")
    for (const f of ["screens/reviewer-approvals-a.tsx", "reviewer/review-parts.tsx", "reviewer/decisions.tsx"]) {
      expect(lab(f)).not.toMatch(/>Return<|>Return \{|"Return"/)
    }
    expect(lab("reviewer/decisions.tsx")).toMatch(/Reason the student sees/)
    expect(lab("reviewer/decisions.tsx")).toMatch(/Add a reason\. The student reads it\./)
  })

  it("needs a reason, and the student reads it", () => {
    const r = rows.find((x) => x.kind === "submission" && !x.block)!
    const empty = commitDecision(seed, { kind: "return", key: r.key, note: "  ", path: "correct-same" })
    expect(scopeRows(labState(empty), reviewRows(labState(empty)), EMPTY_SCOPE).rows.some((x) => x.key === r.key)).toBe(true)
    const reason = "The setting is wrong. Log it again as Outpatient."
    const next = commitDecision(seed, { kind: "return", key: r.key, note: reason, path: "correct-same" })
    const sub = next.submissions.find((x) => x.id === r.key)!
    expect(sub.returns?.at(-1)?.reason).toBe(reason)
    expect(requestWaitText(next, sub)).toContain(reason)
  })
})

describe("Approve counts (AR-05, AR-06), one definition everywhere", () => {
  it("says what it does, and moves the evidence into achievement with the note kept (AR-04)", () => {
    expect(APPROVE_HINT).toBe("Counts toward progress now")
    const r = rows.find((x) => x.likeKey === "rule-met")!
    const skill = r.skillIds[0]
    const before = skillProgress(state, r.studentId, skill)!
    const next = commitDecision(seed, { kind: "approve", key: r.key, note: "Checked against the log." })
    const after = skillProgress(labState(next), r.studentId, skill)!
    expect(after.counted).toBeGreaterThan(before.counted)
    expect(after.awaiting).toBeLessThan(before.awaiting)
    const e = next.evaluations.find((x) => x.id === r.evaluationIds[0])!
    expect(e.status).toBe("counted")
    expect(e.review?.note).toBe("Checked against the log.")
  })

  it("the approvals figure in the facts registry drops by exactly the approved row", () => {
    const r = rows.find((x) => x.likeKey === "rule-met")!
    const before = facts(seed, DEFAULT_SCOPE)
    const after = facts(commitDecision(seed, { kind: "approve", key: r.key }), DEFAULT_SCOPE)
    expect(after.awaitingApproval).toBe(before.awaitingApproval - 1)
  })
})

describe("The Approvals page says why it exists once", () => {
  // Anatomy A1 (2026-10-30): no lead line under the title. That held evidence counts only once approved (REQ AR-06) is said where
  // the decision is made: the Approve hint on every Approve.
  it("no lead line under the title; the Approve hint carries the fact", () => {
    expect(lab("reviewer/approvals-frame.tsx")).not.toMatch(/These evaluations count only after you approve them\./)
    expect(lab("screens/reviewer-approvals-a.tsx")).toMatch(/APPROVE_HINT/)
    expect(lab("reviewer/review-parts.tsx")).toMatch(/APPROVE_HINT/)
  })
})
