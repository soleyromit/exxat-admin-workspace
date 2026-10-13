// Submission lifecycle helpers (docs/ux/05 SM-02). REQ RV-01..RV-05, AE-01, AE-02, AR-05, AR-06.
import { qualifies } from "./explain"
import type { ConfiguredSkill, Evidence } from "./types"

export type SubmissionState =
  | "draft"
  | "selfEvalPending"
  | "awaitingEvaluator"
  | "completed"
  | "awaitingApproval"
  | "counted"
  | "didNotMeet"
  | "returned"
  | "revised"

/** OD-14 is OPEN. Without partial save, selfEvalPending is unreachable (self-evaluation is completed pre-send). */
export interface SubmissionOptions {
  partialSave?: boolean
}

export function isStateAvailable(state: SubmissionState, opts: SubmissionOptions = {}): boolean {
  return state === "selfEvalPending" ? opts.partialSave === true : true
}

/** RV-05: counted or awaiting approval cannot be edited or resent. */
export function isLocked(state: SubmissionState): boolean {
  return state === "awaitingApproval" || state === "counted"
}

/** Correction by the student: before assessment, returned, revised, or composing (RV-01). */
export function canEdit(state: SubmissionState, opts: SubmissionOptions = {}): boolean {
  switch (state) {
    case "draft":
    case "awaitingEvaluator":
    case "returned":
    case "revised":
      return true
    case "selfEvalPending":
      return opts.partialSave === true
    default:
      return false // completed, didNotMeet (RV-03), awaitingApproval, counted (RV-05)
  }
}

// `opts` is accepted for symmetry with canEdit; selfEvalPending is resumed via canEdit, never resent.
export function canResend(state: SubmissionState, _opts: SubmissionOptions = {}): boolean {
  return state === "awaitingEvaluator" || state === "returned" || state === "revised"
}

/** RV-03: only a completed evaluation that did not meet the criteria allows a further attempt. */
export function canStartFurtherAttempt(state: SubmissionState): boolean {
  return state === "didNotMeet"
}

/** RV-04: either path may go to a different evaluator. */
export function canChangeEvaluator(state: SubmissionState, opts: SubmissionOptions = {}): boolean {
  return canResend(state) || canStartFurtherAttempt(state) || (state === "selfEvalPending" && opts.partialSave === true)
}

/**
 * Counted vs did-not-meet is DERIVED from the current rule, never stored (AE-02).
 * [INFER] Under a skill that currently requires approval, evidence recorded as 'notRequired' waits for approval.
 */
export function submissionOutcome(e: Evidence, skill: ConfiguredSkill): SubmissionState {
  if (!e.complete) return "awaitingEvaluator"
  if (skill.requiresApproval) {
    if (e.approval === "returned") return "returned"
    if (e.approval !== "approved") return "awaitingApproval"
  }
  return qualifies(e.responses, skill.model) ? "counted" : "didNotMeet"
}
