/**
 * Strings for the Student View and Preceptor Evaluation pages, quoted from Sankalp's prototype
 * (docs/build/prototype-parity.md cards P-11 and P-12, docs/source/parity/120-157 outlines). Rule from Romit
 * (2026-10-08): the prototype governs copy structure, so wording here is the prototype's.
 * Every string is tagged [PROTO]; wording that is ours is tagged [INFER].
 *
 * Not exported from lib/copy/index.ts on purpose: the voice test scans the shared modules, and the prototype uses
 * an em dash in offering labels ("NURS 350 — Clinical Practicum") and in two sentences. Those are the prototype's
 * exact text, kept here only [PROTO].
 */

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** [PROTO] "NURS 350 — Clinical Practicum" */
export const offeringTitle = (code: string, name: string) => `${code} — ${name}`

export const r5 = {
  page: {
    title: "Student View",
    subtitle: "What a student sees in their own login: pick skills, submit, track history",
  },
  viewing: {
    student: "Viewing as student",
    course: "Clinical course",
    cohort: (cohort: string, group: string) => [cohort, group].filter(Boolean).join(" · "),
    placed: (names: string[]) => `Placed at ${names.join(", ")}`,
    noPlacement: "No placement recorded", // [INFER] prototype has none
  },
  awaiting: {
    title: "Awaiting preceptor evaluation",
    count: (n: number) => `${plural(n, "request", "requests")} sent`,
    chip: (skill: string, name: string, role: string) => `${skill} · ${name} (${role})`,
  },
  onlySent: "Show only skills I have sent for review",
  sentOf: (sent: number, total: number, unmapped: number) => `${sent} of ${total} skills sent, ${unmapped} not mapped to this course`,
  mapped: {
    title: "Mapped to this course",
    body: (label: string) => `${label}. Mandatory skills are required for this course; non-mandatory ones are available but not required.`,
  },
  pill: {
    mandatory: "Mandatory for this course",
    nonMandatory: "Non-mandatory for this course",
    unmapped: "Not mapped to this course",
    openCount: (n: number) => `${n} in progress`,
  },
  achievedNote: "Already achieved — you can still request another evaluation if your program wants more evidence.",
  viewHistory: (n: number) => `View history (${n})`,
  other: {
    title: "Other skills",
    sent: (n: number) => `${n} sent`,
    body: "Not mapped to this course. Evidence still counts toward your skill record.",
  },
  bar: {
    selected: (n: number) => `${plural(n, "skill", "skills")} selected`,
    clear: "Clear",
    send: "Send for review",
  },
  send: {
    title: "Send for review",
    subtitle: (n: number, course: string) => `${plural(n, "skill", "skills")} · ${course}`,
    where: "Where did you perform this?",
    clinical: "Clinical",
    lab: "Lab / Simulation",
    whereHelper: "Programs can require a minimum amount of clinical evidence.",
    setting: "Which clinical setting?",
    settingHelper: (n: number) => `From your ${plural(n, "placement", "placements")} for this course. You may move between settings during a placement — record where this one happened.`,
    sendTo: "Send for review to",
    roleHelper: (mode: "clinical" | "lab") => (mode === "clinical" ? "Roles that sign off clinical evidence." : "Roles that sign off lab / simulation evidence."),
    labInstructor: "Lab instructor",
    notListed: "Someone not listed…",
    labHelper: "Lab instructors are not held as Prism users. This module keeps a light roster — a name and an email, which is all a delegator link needs. No account is created and they never sign in.",
    linkGoesTo: (email: string) => `Link goes to ${email}.`,
    skillsInRequest: "Skills in this request",
    detailsTitle: "Details for this submission",
    incomplete: "Incomplete",
    complete: "Complete",
    cancel: "Cancel",
    sendRequest: "Send request",
  },
  history: {
    title: (criteria: string) => `Your submission history · ${criteria}`,
    counted: "Counted so far",
    inProgress: "In progress",
    inProgressHelper: "Sent but not finished",
    returned: "Returned",
    returnedHelper: "Sent back by a reviewer",
    returnedOutcome: "Returned by the reviewer", // [PROTO] outcome pill on a returned attempt
    note: "Evidence counts toward this skill wherever it was gathered, so submissions from other courses are included.",
    allCourses: (n: number) => `All courses (${n})`,
    courseOnly: (code: string, n: number) => `${code} only (${n})`,
    attempt: (n: number) => `Attempt ${n}`,
    notRecorded: (name: string, role: string) => `Not recorded yet — with ${name} (${role})`,
    recorded: (outcome: string, name: string, role: string) => `${outcome} — ${name} (${role})`,
    rated: (outcome: string) => `You rated yourself: ${outcome}`,
    feedback: (who: string) => `${who} feedback:`,
    reviewerNote: "Reviewer note:",
    revised: (n: number) => `Revised and resent ${plural(n, "time", "times")}.`,
    viewForm: "View form",
    reviseResend: "Revise and resend",
    close: "Close",
  },
  sent: {
    // ST-13 [REQ]: names skills, evaluator, role, setting and location. Wording is [INFER]; structure follows the prototype banner.
    banner: (skills: string[], name: string, role: string, where: string) => `Sent ${skills.join(" and ")} to ${name} (${role}) for evaluation. ${where}`,
  },
} as const

export const preceptor = {
  title: "Preceptor Evaluation",
  subtitle: "The form an evaluator opens from their emailed link — preceptors do not sign in to Prism",
  sent: {
    title: "Evaluations sent",
    body: "Preceptors receive a delegator link by email. Faculty and lab instructors can open the same form in Prism. Open one to see what the evaluator sees.",
    row: (offering: string, requested: string, name: string, role: string) => `${offering} · Requested ${requested} · ${name} (${role})`,
    open: "Open link",
    empty: "No evaluations are waiting", // [INFER]
    emptyBody: "Evaluations a student sends for review appear here.", // [INFER]
  },
  form: {
    back: "Back to sent links",
    heading: "Evaluate student skills",
    sub: (student: string, offering: string, name: string, role: string) => `${student} · ${offering} · evaluated by ${name} (${role})`,
    achievement: (model: string, criteria: string) => `${model} · Achievement: ${criteria}`,
    goesToReview: "Goes to review",
    notAnswered: "Not answered",
  },
  result: {
    heading: (n: number, student: string) => `Evaluation submitted. ${plural(n, "skill", "skills")} recorded for ${student}`,
    cols: { skill: "Skill", recorded: "Recorded", qualifies: "Qualifies?", progress: "Progress", status: "Status" },
    qualifies: "Qualifies",
    doesNot: "Does not qualify",
    held: "Held for review",
    awaiting: "Awaiting review",
    dismiss: "Dismiss",
  },
} as const

/** [PROTO] model badge text */
export const modelNames = {
  binary: "Overall Binary Outcome",
  question: "Question-Level Qualitative",
  scored: "Scored / Likert",
  demonstration: "Demonstration-Level Outcome",
} as const
