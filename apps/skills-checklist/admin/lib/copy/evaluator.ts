// S-16 and S-18 copy (evaluator form and request email). docs/ux/09 wins over 07 on wording. Shared held-or-counts and link
// messages live in ./shared.
// Copy added during the build (2026-10-08). Source of truth for these strings is docs/ux/09 "Strings added during build" (every string is an [INFER] proposal
// until the copy owner adopts it). Professional tone, sentence case, no em-dashes, no exclamation marks.
import { buttons, term } from "./shared"


export const evaluatorCopy = {
  header: (student: string) => `Evaluate ${student}`,
  subline: (course: string, requested: string, role: string) => `${course}. Requested ${requested}. You are completing this as ${role}.`,
  progress: (answered: number, total: number) => `${answered} of ${total} answered`,
  skipLink: "Skip to first unanswered",
  skillHeading: (n: number, skill: string) => `${n}. ${skill}`,
  settingClinical: (setting: string | null, location: string | null) =>
    `Clinical${setting ? ` (${setting})` : ""}${location ? ` at ${location}` : ""}`,
  settingLab: term.lab,
  detailsHeading: "Supplied by the student",
  studentNote: "Student note",
  noDetails: "The student did not supply any details for this skill.", // [INFER] not in 09
  selfEval: (answer: string) => `The student's self-evaluation: ${answer}`,
  selfEvalHeading: "The student's self-evaluation",
  yes: "Yes",
  no: "No",
  outcomeLegend: "Overall outcome",
  levelLegend: "Demonstration outcome",
  scoreHelper: (min: number, max: number) => `Score from ${min} to ${max}.`, // [INFER] not in 09
  commentRequired: "Your comment (required)",
  commentOptional: "Your comment (optional)",
  commentHelper: "What the student did well and what to work on next.",
  commentError: (skill: string) => `Add a comment for ${skill} before you submit. The program requires one.`,
  incompleteQuestions: (skill: string) => `Answer every question for ${skill} to submit.`,
  incompleteChoice: (skill: string) => `Choose an answer for ${skill} to submit.`, // [INFER] not in 09
  submit: buttons.submitEvaluation,
  submitting: "Submitting",
  footer: "Submitting records your answers. You will not be asked to sign in.",
  notSubmitted: (n: number) => `Not submitted. ${n} ${n === 1 ? "item needs" : "items need"} your attention.`, // [INFER] not in 09
  stillNeeded: (n: number, next: string) => `${n} ${n === 1 ? "item" : "items"} still to complete. Next: ${next}.`, // [INFER] not in 09; short so the sticky bar stays small on a phone
  needAnswers: (skill: string) => `answers for ${skill}`,
  needComment: (skill: string) => `a comment for ${skill}`,
  submitError: "Your evaluation was not submitted. Your answers are kept. Try again.",
  resultHeading: (student: string, n: number) => `Evaluation submitted for ${student}. ${n} ${n === 1 ? "skill" : "skills"} recorded.`,
  previousReturned: "A previous evaluation was returned.",
  savedOnDevice: "Answers saved on this device.", // [INFER] not in 09
  notSaved: "Not saved.", // contract §10: quiet inline "Not saved" with retry
  retry: buttons.retry,
  loading: "Loading the evaluation",
  wordmark: "Prism",
} as const

export const emailCopy = {
  subject: (student: string, n: number) => `${student} has asked you to evaluate ${n} ${n === 1 ? "skill" : "skills"}`,
  greeting: (name: string) => (name.trim() ? `Hello ${name.trim()},` : "Hello,"),
  intro: (student: string, context: string, n: number) =>
    `${student}${context ? ` (${context})` : ""} has asked you to evaluate ${n} ${n === 1 ? "skill" : "skills"} they performed:`,
  more: (k: number) => `and ${k} more`,
  where: "Where:",
  role: "You are asked to complete this as:",
  openLabel: "Open the evaluation:",
  button: "Open evaluation",
  expectHeading: "What to expect",
  expectLink: "The link opens the evaluation directly. You do not need to sign in and no account is created.",
  expectForm: (program: string) => `The form shows what ${program} has set up for each skill. You only record your assessment.`,
  afterHeading: "After you submit",
  afterRecorded: (student: string) => `Your answers are recorded for ${student}.`,
  afterReview: (program: string) => `${program} may review an evaluation before it counts.`,
  notRight: (student: string) => `If you are not the right person to evaluate ${student}, please let them know so they can send the request to someone else.`,
  thanks: "Thank you,",
  signature: (program: string) => `${program} via Prism`,
} as const
