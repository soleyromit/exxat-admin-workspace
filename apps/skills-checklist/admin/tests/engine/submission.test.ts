import { describe, expect, it } from "vitest"
import {
  canChangeEvaluator,
  canEdit,
  canResend,
  canStartFurtherAttempt,
  isLocked,
  isStateAvailable,
  submissionOutcome,
} from "@/lib/engine"
import type { SubmissionState } from "@/lib/engine"
import { bin, binary, configured, ev, questionModel, yesNo } from "./fixtures"

// docs/ux/05 SM-02. REQ RV-01..RV-05, AE-01, AE-02, AR-05, AR-06.
describe("RV-05 locked states cannot be edited or resent", () => {
  it.each(["awaitingApproval", "counted"] as SubmissionState[])("%s is locked, not editable, not resendable", (s) => {
    expect(isLocked(s)).toBe(true)
    expect(canEdit(s)).toBe(false)
    expect(canResend(s)).toBe(false)
    expect(canChangeEvaluator(s)).toBe(false)
  })
})

describe("RV-03 a completed evaluation is a record: no edit, a further attempt instead", () => {
  it.each(["completed", "didNotMeet"] as SubmissionState[])("%s cannot be edited or resent", (s) => {
    expect(canEdit(s)).toBe(false)
    expect(canResend(s)).toBe(false)
  })
  it("only 'did not meet criteria' offers a further attempt", () => {
    const all: SubmissionState[] = ["draft", "selfEvalPending", "awaitingEvaluator", "completed", "awaitingApproval", "counted", "didNotMeet", "returned", "revised"]
    expect(all.filter((s) => canStartFurtherAttempt(s))).toEqual(["didNotMeet"])
  })
  it("a further attempt may go to a different evaluator (RV-04)", () => {
    expect(canChangeEvaluator("didNotMeet")).toBe(true)
  })
})

describe("RV-01, RV-02, RV-04 not yet assessed or returned can be corrected and resent, possibly to another evaluator", () => {
  it.each(["awaitingEvaluator", "returned", "revised"] as SubmissionState[])("%s", (s) => {
    expect(canEdit(s)).toBe(true)
    expect(canResend(s)).toBe(true)
    expect(canChangeEvaluator(s)).toBe(true)
  })
})

describe("OD-14 draft / self-evaluation-pending exist only when partial save is accepted", () => {
  it("by default selfEvalPending is unavailable and not editable", () => {
    expect(isStateAvailable("selfEvalPending")).toBe(false)
    expect(canEdit("selfEvalPending")).toBe(false)
  })
  it("with partialSave it is available and editable (resume), but not a resend", () => {
    expect(isStateAvailable("selfEvalPending", { partialSave: true })).toBe(true)
    expect(canEdit("selfEvalPending", { partialSave: true })).toBe(true)
    expect(canResend("selfEvalPending", { partialSave: true })).toBe(false)
  })
  it("the composing draft is always editable and never 'resent'", () => {
    expect(canEdit("draft")).toBe(true)
    expect(canResend("draft")).toBe(false)
  })
})

describe("submissionOutcome: counted vs did-not-meet is derived, never stored (AE-02, AE-01, AR-05, AR-06)", () => {
  const plain = configured(questionModel(2, { kind: "all" }))
  const approving = configured(questionModel(2, { kind: "all" }), { requiresApproval: true })

  it("incomplete evidence is still with the evaluator", () => {
    expect(submissionOutcome(ev(yesNo(true, true), { complete: false }), plain)).toBe("awaitingEvaluator")
  })
  it("complete and qualifying, no approval needed: counted", () => {
    expect(submissionOutcome(ev(yesNo(true, true)), plain)).toBe("counted")
  })
  it("complete and not qualifying: did not meet criteria", () => {
    expect(submissionOutcome(ev(yesNo(true, false)), plain)).toBe("didNotMeet")
  })
  it("approval required: pending waits, returned is returned, approved is then derived from the rule", () => {
    expect(submissionOutcome(ev(yesNo(true, true), { approval: "pending" }), approving)).toBe("awaitingApproval")
    expect(submissionOutcome(ev(yesNo(true, true), { approval: "returned" }), approving)).toBe("returned")
    expect(submissionOutcome(ev(yesNo(true, true), { approval: "approved" }), approving)).toBe("counted")
    expect(submissionOutcome(ev(yesNo(true, false), { approval: "approved" }), approving)).toBe("didNotMeet")
  })
  it("[INFER] approval switched on after the evaluation was recorded: 'notRequired' evidence waits for approval under the current setting", () => {
    expect(submissionOutcome(ev(yesNo(true, true), { approval: "notRequired" }), approving)).toBe("awaitingApproval")
  })
  it("AE-02 the same stored responses flip from counted to did-not-meet when the rule tightens", () => {
    const e = ev(bin("b"))
    expect(submissionOutcome(e, configured(binary("b")))).toBe("counted")
    expect(submissionOutcome(e, configured(binary("a")))).toBe("didNotMeet")
  })
})
