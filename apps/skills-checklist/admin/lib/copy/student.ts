// S-12 to S-15 copy (student surfaces).
// Copy added during the build (2026-10-08). Source of truth for these strings is docs/ux/09 "Strings added during build" (every string is an [INFER] proposal
// until the copy owner adopts it). Professional tone, sentence case, no em-dashes, no exclamation marks.
import { buttons } from "./shared"
import { common } from "./common"


export const studentLocal = {
  noMatch: "No skills match.",
  stillNeeded: "Still needed",
  labNotCounted: (n: number) => `Lab or simulation: ${n} recorded, not counted toward clinical settings.`,
  settingMet: "met",
  waitingHeading: "Waiting for an evaluator",
  expectedHeading: "Expected on this course",
  loading: "Loading your skills",
  notFoundCourse: "This course could not be found.",
  searchOther: "Search other skills",
  details: { incomplete: "Incomplete", complete: "Complete" },
  switchTo: { clinical: "Switch to Clinical", lab: "Switch to Lab or simulation" },
  sendSeparately: "Send these separately",
  sendSeparatelyNote: "Only the first skill is in this request. Send the others in a separate request.",
  discard: { title: "Discard this request?", body: "Your answers have not been sent.", keep: "Keep editing", confirm: "Discard" },
  reviseNote: "Your earlier answers are kept. Change what needs correcting, then resend.",
  furtherNote: "Your previous attempt is kept and still shown in your history.",
  reviewerNoteHeading: "Reviewer note",
  disabledReason: {
    blocked: "Send request is unavailable because no evaluator role can sign off this request.",
    fields: (n: number) => `Complete the ${n} required ${n === 1 ? "field" : "fields"} to send this request.`,
    setting: "Choose where this was performed to send this request.",
    person: "Choose who should evaluate this to send this request.",
    selfEval: "Complete your self-evaluation to send this request.",
  },
  evaluatorNotListed: "Evaluator not listed",
  lab: { name: common.name, email: common.email },
  oldestFirst: "Show oldest first",
  newestFirst: "Show newest first",
  furtherBlocked: "Finish your open submission first.",
  furtherPrompt: "You can make a further attempt.",
  evaluatorChanged: "Evaluator changed",
  noComment: "No comment recorded.",
  youRated: "You rated yourself",
  evaluatorAnswer: "Evaluator answer",
  feedback: "Evaluator feedback",
  yourNote: "Your note",
  sentWith: "What you sent",
  coursesWithEvidence: "Courses with evidence",
  mandatoryIn: (n: number, total: number) => `Mandatory in ${n} of your ${total} ${total === 1 ? "course" : "courses"}`,
  noMatchFilters: "No skills match these filters.",
  noMappings: "Your program has not mapped skills to your courses yet.",
  sendThisSkill: buttons.sendForReview,
  inactiveNote: "Inactive skills are not counted in the totals above. Your evidence is kept.",
  summaryA: (achieved: number, total: number, inProgress: number, doesNotQualify: number, noEvidence: number) =>
    `Achieved ${achieved} of ${total}. In progress ${inProgress}. Evidence does not qualify ${doesNotQualify}. No evidence yet ${noEvidence}.`,
  summaryB: (achieved: number, total: number, inProgress: number, notMet: number) => `Achieved ${achieved} of ${total}. In progress ${inProgress}. Not met ${notMet}.`,
  demoStudent: "Demo student",
  demoNote: "Demo only. A real student signs in and sees only their own record.",
  courseListIntro: "Choose a course to see the skills it expects.",
  backToCourse: "Back to course skills",
  backToMySkills: "Back to my skills",
} as const

