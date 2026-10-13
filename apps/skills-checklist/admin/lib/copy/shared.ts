// Shared copy keyed to docs/ux/09 (§1 voice, §2 glossary, §3 patterns, §4 status, §6 held vs counts now).
// Surface workers IMPORT these strings and never retype them. Rules: professional tone, sentence case, no em-dashes,
// no exclamation marks, no internal notes or requirement ids, no accuracy claims about import (IM-13).
import type { SkillState } from "@/lib/engine"
import type { SkillStatusDisplay } from "@/lib/domain/types"

/** §3.1 buttons (text only, verb plus object, one filled primary per surface). */
export const buttons = {
  createSkill: "Create skill",
  createSkills: (n: number) => `Create ${n} ${n === 1 ? "skill" : "skills"}`,
  saveSkill: "Save skill",
  sendForReview: "Send for review",
  sendRequest: "Send request",
  resend: "Resend",
  submitEvaluation: "Submit evaluation",
  approve: "Approve",
  addToRoster: "Add to roster",
  cancel: "Cancel",
  back: "Back",
  continue: "Continue",
  dismiss: "Dismiss",
  clear: "Clear",
  clearFilters: "Clear filters",
  showTheseOnly: "Show these only",
  /** OD-16 is OPEN: the recipient is not stated. Do NOT use the prototype's "Return to preceptor". */
  returnForCorrection: "Return for correction",
  reviseAndResend: "Revise and resend",
  furtherAttempt: "Make a further attempt",
  deactivateSkill: "Deactivate skill",
  deactivateSetting: "Deactivate setting",
  import: "Import",
  addSkill: "Add skill",
  readTheList: "Read the list",
  export: "Export",
  showMore: (n: number) => `Show ${n} more`,
  viewHistory: (n: number) => `View history (${n})`,
  viewEvaluation: "View evaluation",
  configure: "Configure",
  edit: "Edit",
  close: "Close",
  retry: "Try again",
} as const

/** §3.2 banner patterns. */
export const banner = {
  success: (object: string, pastVerb: string) => `${object} ${pastVerb}.`,
  error: (what: string, whatToDo: string) => `${what}. ${whatToDo}.`,
  info: (fact: string, consequence: string) => `${fact}. ${consequence}.`,
} as const

/** §3.3 validation: `{Field} {problem}. {How to fix}.` */
export const validation = {
  required: (label: string) => `${label} is required.`,
  email: "Enter a valid email address.",
  emailSend: "Enter a valid email address. The request is sent here.",
  name: "Enter a name.",
} as const

/** §2 glossary: the words the product uses for the same thing everywhere. */
export const term = {
  skill: "skill",
  library: "skills library",
  mandatory: "Mandatory",
  nonMandatory: "Non-mandatory",
  mandatoryForCourse: "Mandatory for this course",
  nonMandatoryForCourse: "Non-mandatory for this course",
  counted: "Counted",
  didNotMeetCriteria: "Did not meet criteria", // a SUBMISSION outcome only, never a skill status
  returned: "Returned",
  needsConfiguration: "Needs configuration",
  notConfigured: "Not configured",
  lab: "Lab or simulation",
  clinical: "Clinical",
} as const

/** §4 skill-record status. The four AE-04 states; OD-03 is OPEN so a merged label exists behind the ONE flag. */
const STATUS: Record<SkillState, { four: string; merged: string }> = {
  noEvidence: { four: "No evidence yet", merged: "Not met" },
  evidenceDoesNotQualify: { four: "Evidence does not qualify", merged: "Not met" },
  partial: { four: "In progress", merged: "In progress" },
  achieved: { four: "Achieved", merged: "Achieved" },
}

export const statusLabel = (state: SkillState, display: SkillStatusDisplay): string => STATUS[state][display]

/**
 * The per-skill STATUS PILL in the prototype's own words when the display flag is "merged" (docs/build/prototype-parity.md, student
 * cards and drill-down): Not Started / In Progress / Achieved. The prototype's "Not met" is a COUNT column header for the same
 * group (statusLabel); the pill says "Not Started" because that is what it shows beside a 0-of-n progress line. With the flag on
 * "four" the pill uses the four AE-04 labels. [PROTO] [INFER for the evidence-does-not-qualify mapping; OD-03 stays OPEN]
 */
const PILL_MERGED: Record<SkillState, string> = {
  noEvidence: "Not Started",
  evidenceDoesNotQualify: "Not Started",
  partial: "In Progress",
  achieved: "Achieved",
}
export const statusPillLabel = (state: SkillState, display: SkillStatusDisplay): string => (display === "merged" ? PILL_MERGED[state] : STATUS[state].four)

export const statusHelper = (state: SkillState, ctx: { have?: number; need?: number | null } = {}): string => {
  switch (state) {
    case "noEvidence":
      return "You have no completed evaluations for this skill."
    case "evidenceDoesNotQualify":
      return "You have completed evaluations, but none qualify under this skill's current rule."
    case "partial":
      return ctx.need ? `${ctx.have ?? 0} of ${ctx.need} qualifying evaluations so far.` : "Some qualifying evaluations so far."
    case "achieved":
      return "All criteria for this skill are met."
  }
}

/** Column headers for the by-student table (S-01), both renderings of the OD-03 flag. */
export const studentColumns = (display: SkillStatusDisplay): string[] =>
  display === "four"
    ? ["Student", "Cohort and group", "Achieved", "In progress", "Evidence does not qualify", "No evidence yet", "Attainment"]
    : ["Student", "Cohort and group", "Achieved", "In progress", "Not met", "Attainment"]

/** §6 held for approval versus counts now (EV-07). */
export const heldOrCounts = {
  beforeSubmit: { countsNow: "This skill counts as soon as you submit.", held: "This skill is held for administrator approval after you submit." },
  afterSubmit: {
    countsNow: (skill: string) => `${skill}: recorded. It counts toward the student's record now.`,
    held: (skill: string) => `${skill}: recorded. It is held for administrator approval and does not count until approved.`,
  },
  student: { countsNow: "Counted", held: "Waiting for approval" },
  studentHelper: {
    countsNow: (skill: string) => `Your evaluator submitted this. It counts toward ${skill}.`,
    held: "Your evaluator submitted this. A reviewer must approve it before it counts.",
  },
} as const

/** SH-02 outcome labels for a submission (docs/ux/09 S-14). */
export const submissionOutcome = {
  counted: "Counted",
  didNotMeet: "Did not meet criteria",
  returned: "Returned",
  awaitingApproval: "Waiting for approval",
  awaitingEvaluator: (name: string, role: string) => `Waiting with ${name} (${role})`,
  revised: (name: string, role: string) => `Waiting with ${name} (${role})`,
  draft: "Draft",
  completed: "Completed",
  selfEvalPending: "Waiting for your self-evaluation", // only under OD-14
} as const

export const locked = {
  counted: "This submission counted and can no longer be changed.",
  awaitingApproval: "This submission is waiting for approval and cannot be changed.",
} as const

/** Link outcomes for S-16 (OD-18 is OPEN: neutral, no expiry rule stated). */
export const linkMessage = {
  invalid: "This link cannot be used. Contact the student or program that sent it.",
  superseded: "This link cannot be used. Contact the student or program that sent it.",
  alreadySubmitted: "An evaluation has already been submitted for this request.",
} as const
