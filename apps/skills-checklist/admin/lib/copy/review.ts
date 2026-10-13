// S-11 copy (review and approve). OD-16 is OPEN: nothing here names who corrects a returned evaluation.
// Copy added during the build (2026-10-08). Source of truth for these strings is docs/ux/09 "Strings added during build" (every string is an [INFER] proposal
// until the copy owner adopts it). Professional tone, sentence case, no em-dashes, no exclamation marks.
import { buttons, term } from "./shared"


export const reviewCopy = {
  /** P state: queue header. */
  waiting: (n: number) => `${n} ${n === 1 ? "evaluation is" : "evaluations are"} waiting. Waiting evaluations do not count yet.`,
  region: "Evaluations waiting for approval",
  reviewButton: "Review",
  /** The suffix keeps names unique when one student has two evaluations of the same skill waiting. */
  reviewLabel: (skill: string, student: string, detail: string) => `Review ${skill} for ${student}, ${detail}`,
  readOnlyDescription: "Read only. No decision is available for this evaluation.",
  loading: "Loading the review queue",
  noSelfEvaluation: "No self-evaluation",
  same: "Same",
  differs: "Differs",
  qualifies: "Qualifies",
  doesNotQualify: "Does not qualify",
  sheetSubline: (offering: string, where: string, evaluator: string, role: string, date: string) => `${offering}. ${where}. Evaluated by ${evaluator} (${role}) on ${date}.`,
  lab: term.lab,
  sections: { agreement: "Agreement", supplied: "Supplied by the student", studentNote: "Student note", comment: "Evaluator comment", note: "Review note" },
  studentColumn: "Student self-evaluation",
  evaluatorColumn: (role: string) => `Evaluator (${role})`,
  evaluatorOnly: (role: string) => `Evaluator (${role}). The student did not add a self-evaluation for this skill.`,
  outcome: "Outcome",
  recordedLevel: "Demonstration outcome",
  score: (n: number) => `Score ${n}`,
  yes: "Yes",
  no: "No",
  notAnswered: "Not answered",
  yesOf: (yes: number, total: number) => `${yes} of ${total} answered Yes`,
  average: (n: number) => `Average score ${n.toFixed(1)}`,
  none: "None recorded.",
  approving: "Approving",
  returning: "Returning",
  notSaved: "Your decision was not saved. Try again.",
  alreadyDecided: (decision: "approved" | "returned") => `This evaluation was already ${decision}. No further decision is needed.`,
  notWaiting: "This evaluation is not waiting for approval.",
  reviewNoteRead: "Review note",
  keyHint: "Press J or K to move to the next or previous evaluation.",
  returnTitle: buttons.returnForCorrection,
  returnConfirm: buttons.returnForCorrection,
  doesNotCountYet: "This evaluation does not count toward the student's record until it is approved.",
  close: buttons.close,
} as const
