import { skillNoun } from "@/lib/lab/terms"
/**
 * One wording, one icon and one tone per state (glossary.md; docs/knowledge/design/consistency-audit.md). Screens read these
 * maps; a wrapper badge may change the size, never the word, icon or tone. Amber ("warning") marks shortfall, never red.
 */

export type RecordStateKey = "achieved" | "progress" | "unqualified" | "none"

/** The four engine states (REQ AE-04; LEDGER D-L1 "In progress"). */
export const RECORD_STATE_META: Record<RecordStateKey, { label: string; icon: string; tone: "neutral" | "warning" }> = {
  achieved: { label: "Achieved", icon: "fa-circle-check", tone: "neutral" },
  progress: { label: "In progress", icon: "fa-circle-half-stroke", tone: "neutral" },
  unqualified: { label: "Evidence does not qualify", icon: "fa-triangle-exclamation", tone: "warning" },
  none: { label: "No evidence yet", icon: "fa-circle-dashed", tone: "neutral" },
}

/**
 * The student's one phrase for evidence that did not count (UX critique 2026-10-26): every student screen says "Did not count",
 * for a skill record in the "unqualified" state and for one attempt. "Evidence does not qualify" stays the staff and engine
 * state word (RECORD_STATE_META) in staff lists, attainment and exports. Same state, two audiences, one word each.
 */
export const STUDENT_NOT_COUNTED = "Did not count"
export const STUDENT_STATE_LABEL: Record<RecordStateKey, string> = {
  achieved: RECORD_STATE_META.achieved.label,
  progress: RECORD_STATE_META.progress.label,
  unqualified: STUDENT_NOT_COUNTED,
  none: RECORD_STATE_META.none.label,
}

/** Evaluator answers on one evaluation: the program's binary labels default to Met / Unmet (REQ section 4.1). */
export const OUTCOME_LABEL = { met: "Met", "not-met": "Unmet", "not-yet": "Not yet" } as const

/** Overlays on a record (never states). */
export const OVERLAY_LABEL = {
  awaitingApproval: "Awaiting approval",
  waiting: "Waiting",
  returned: "Returned",
} as const

/** One evaluation's status in a record, a list or an export: counted, or the overlay that keeps it out. */
export const EVALUATION_STATUS_LABEL = {
  counted: "Counted",
  "awaiting-approval": OVERLAY_LABEL.awaitingApproval,
  returned: OVERLAY_LABEL.returned,
  reopened: "Reopened",
} as const
export const evaluationStatusLabel = (status: string): string =>
  status === "counted" ? EVALUATION_STATUS_LABEL.counted : status === "awaiting-approval" ? EVALUATION_STATUS_LABEL["awaiting-approval"] : status === "returned" ? EVALUATION_STATUS_LABEL.returned : EVALUATION_STATUS_LABEL.reopened

/** The reviewer's two decisions (REQ AR-05), plus the handoff "Assign to someone else" (decision D-X25: never read as a return). */
export const REVIEW_DECISION_LABEL = { approved: "Approved", returned: "Sent back to student", reassigned: "Sent for a new evaluation" } as const

/**
 * The reviewer's second decision, as staff read it (Romit 2026-10-27: "what is Return?"). REQ AR-05 "return": it goes back to the
 * student for correction and does not count. The student side keeps its own words ("Returned to you", lib/lab/student2.ts).
 */
export const SEND_BACK_LABEL = "Send back to student"
export const SENT_BACK_LABEL = "Sent back to student"
/** What Approve does, said once beside the button (REQ AR-05, AR-06). */
export const APPROVE_HINT = "Counts toward progress now"

/** Evaluator name lifecycle (REQ SL-09, ST-09): "Unverified" until a reviewer adopts or merges it. */
export const EVALUATOR_NAME_LABEL = { verified: "Adopted", unverified: "Unverified" } as const

/**
 * Why held, for evidence signed under an evaluator name the program has not adopted yet: the reviewer reads it as "Evaluator not
 * assigned" (Oct 26 call, item 13). The internal cause id stays "new-evaluator" (lib/v2/approvals.ts).
 */
export const EVALUATOR_NOT_ASSIGNED_LABEL = "Evaluator not assigned"

/**
 * Held evidence a reviewer sent to another evaluator ("Assign to someone else", lib/lab/reviewer.ts assignEntry). It is a handoff,
 * not a return: the student reads "Sent to {name} for a new evaluation" next to the new waiting request, never "Returned".
 * The same sentence is the audit note on the held evaluation. SENT_FOR_NEW_EVALUATION_WORD is the short status (filters, marks).
 */
export const sentForNewEvaluationLabel = (name: string): string => `Sent to ${name} for a new evaluation`
export const SENT_FOR_NEW_EVALUATION_WORD = "Sent for a new evaluation"

/**
 * Graduation readiness bands against "Required to graduate" (decision D-X11; `population.graduationStageOf`): exactly 1 missing is
 * one short, 2 to 3 is short, FAR_BEHIND_MISSING (4) or more is far behind.
 */
/** "One skill short" follows the program's noun (Settings > Naming): a getter, so it reads the noun when shown. */
export const GRADUATION_STAGE_LABEL: { readonly complete: string; readonly "one-short": string; readonly short: string; readonly far: string } = {
  complete: "Complete",
  get "one-short"() {
    return `One ${skillNoun()} short`
  },
  short: "Short",
  far: "Far behind",
}

/** Readiness record states as a list label: an evaluation answered Unmet (never "Not met"). */
export const UNMET_LABEL = OUTCOME_LABEL["not-met"]

/**
 * A program's binary outcome label as shown on screen. The program's own words show as configured (Pass / Fail, Competent /
 * Not yet competent); the stored legacy default "Not met" is read as the default "Unmet" (REQ section 4.1), as configure.ts
 * already does. Display only: stored answers and agreement checks keep their values.
 */
export const LEGACY_NOT_MET = "Not met"
export const outcomeWord = (label: string | null | undefined): string => {
  const t = (label ?? "").trim()
  return t.toLowerCase() === LEGACY_NOT_MET.toLowerCase() ? UNMET_LABEL : t
}
/** The two binary labels to show, defaulting to Met / Unmet. */
export const binaryLabels = (labels: readonly [string, string] | null | undefined): [string, string] => [outcomeWord(labels?.[0]) || OUTCOME_LABEL.met, outcomeWord(labels?.[1]) || UNMET_LABEL]

/**
 * Per-course level of a skill in an offering [REQ CM-03; CALL 10-26]. Only Mandatory feeds "Required this term" (D-X12);
 * Recommended marks "Likely here"; Optional can still be submitted and counts on the record.
 */
export const MAPPING_LEVEL_LABEL = { mandatory: "Mandatory", recommended: "Recommended", optional: "Optional", "not-expected": "Not mapped" } as const

/** Course type [CALL 10-26: clinical courses first, a default pending the client]. */
export const COURSE_KIND_LABEL = { clinical: "Clinical", didactic: "Didactic" } as const
export const CLINICAL_ONLY_LABEL = "Clinical only"
export const INCLUDE_DIDACTIC_LABEL = "Include didactic"

/** Placement on every screen: the DS outline Badge in the page header actions slot. */
export const SAMPLE_DATA_LABEL = "Sample data"
