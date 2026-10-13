// Per-surface copy, quoted from docs/ux/09 §5. Where the source marks copy ⚑ OD-n the string here is NEUTRAL.
// Never retype these in a surface; import them. Items that need runtime values are functions.
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

export const s01 = {
  title: "Attainment",
  subtitle: "Skills attainment by student, by skill and by tag",
  filtersNone: "Showing all students and skills in scope",
  tabs: { student: "By student", skill: "By skill", tag: "By tag" },
  kpis: ["Students in view", "Average skills achieved", "Students achieving all skills in scope", "Skills needing attention"],
  searchPlaceholder: "Search students",
  sort: { highest: "Highest attainment", lowest: "Lowest attainment", name: "Name (A to Z)" },
  tagNote: "Counts are student-skill records. A skill with several tags is counted under each tag, so these rows overlap.",
  skillNote: "The percentage counts every student in view. Filter by clinical course to limit it to students whose course expects the skill.",
  emptyStudents: "No students match these filters. Clear filters to see everyone in scope.",
  emptySkills: "No configured skills yet. Configure skills in the library to see attainment here.",
  error: "Attainment could not be loaded. Try again.",
  summary: (n: number, cohort: string, group: string, course: string) => `Showing ${plural(n, "student", "students")} in ${[cohort, group, course].filter(Boolean).join(", ")}`,
  removeFilter: (label: string, value: string) => `Remove filter ${label} ${value}`,
} as const

export const s02 = {
  subline: (cohort: string, group: string, n: number, total: number) => `${cohort}, ${group}. ${n} of ${total} skills achieved`,
  empty: "No skills are in scope for this student with the current filters.",
} as const

export const s03 = {
  ledgerHeading: (skill: string) => `Evidence for ${skill}`,
  columns: ["Date", "Setting", "Location", "Evaluator", "Recorded", "Result"],
  sections: ["Supplied by the student", "Responses", "Comment", "Self-evaluation", "Review note"],
  noComment: "No comment was recorded.",
  levelBreakdown: (level: string, have: number, min: number) => `${level}: ${have} of ${min}`,
} as const

export const s04 = {
  title: "Skills library",
  subtitle: "The program's skills, plus the categories, tags and settings that organise them",
  tabs: { skills: "Skills", categories: "Categories", tags: "Tags", settings: "Clinical settings", labInstructors: "Lab instructors" },
  searchPlaceholder: "Search skills",
  filters: { categories: "All categories", noCategory: "No category", tags: "All tags", statuses: "All statuses", active: "Active", needsConfiguration: "Needs configuration", inactive: "Inactive", allImports: "All imports" },
  columns: ["Skill", "Category", "Evaluation model", "Achievement criteria", "Courses", "Status"],
  fromImport: (n: number) => `From import ${n}`,
  unconfiguredRow: "Not configured. This skill cannot be mapped to a course or submitted until it is configured.",
  unconfiguredBanner: (n: number) => `${plural(n, "skill needs", "skills need")} configuration, so ${n === 1 ? "it is" : "they are"} not available for mapping or submission.`,
  showThem: "Show them",
  emptyLibrary: "Your library is empty. Skills are defined by your program. Import a list you already have, or add a skill.",
  emptyFiltered: "No skills match these filters.",
  deactivate: { title: (skill: string) => `Deactivate ${skill}?`, body: "It will no longer be available for course mapping, student selection or reporting scope. Evidence already recorded is kept." },
} as const

export const s05 = {
  categoriesIntro: "Categories are defined by your program. A skill belongs to at most one category.",
  tagsIntro: "Tags are optional and cut across categories. A skill can have any number of tags.",
  addCategory: "Add category",
  addTag: "Add tag",
  columns: ["Name", "Description", "Skills", "Status"],
  inactiveOnSkill: (name: string) => `${name} (inactive). It stays on this skill until you remove it.`,
  removeFromSkill: "Remove from skill",
  tagReach: (skills: number, categories: number) => `${plural(skills, "skill", "skills")} across ${plural(categories, "category", "categories")}`,
  createInline: (kind: "category" | "tag", text: string) => `Create "${text}" as a new ${kind}`,
  duplicate: (kind: "category" | "tag", name: string) => `A ${kind} named "${name}" already exists. Use a different name.`,
  emptyCategories: "No categories yet. Add one, or leave skills without a category.",
  emptyTags: "No tags yet. Add one if you want to report across categories.",
} as const

export const s06 = {
  intro: "Students choose from these when they record clinical evidence. Lab and simulation evidence is recorded as lab and never satisfies a clinical setting minimum.",
  add: "Add setting",
  columns: ["Setting", "Evidence recorded", "Status"],
  empty: "No clinical settings yet. Add the settings your program tracks, for example inpatient or outpatient.",
  blocked: (setting: string, skills: string[]) => ({ title: `${setting} cannot be deactivated yet.`, body: `These skills require evidence from it: ${skills.join(", ")}. Remove the setting minimum from those skills first.` }),
  confirm: (setting: string) => ({ title: `Deactivate ${setting}?`, body: "Students will no longer be offered it. Evidence already recorded is kept." }),
} as const

export const s07 = {
  intro: "Lab instructors are not Prism users. Only a name and email are stored, and no account is created. The email is where evaluation requests are sent.",
  add: "Add instructor",
  columns: ["Name", "Email", "Evaluations", "Status"],
  namedSection: "Named by students and not on the roster. Add them to keep one spelling in your records.",
  adoptSuccess: (name: string) => `${name} was added to your lab instructors. Evaluations that named them now use this entry.`,
  empty: "No lab instructors yet. Students can also name an instructor when they send a skill for review.",
} as const

export const s08 = {
  title: "Import skills",
  intro: "Bring in a list you already hold instead of entering skills one at a time.",
  ruleNote: "Skills are created as needing configuration. A list says what skills are called, not how each is evaluated or what achievement requires.",
  upload: { title: "Upload a file", body: "Spreadsheet, document or PDF. No particular template or column order is needed." },
  paste: { title: "Or paste the list", body: "One skill per line. A description and a grouping are used if present." },
  /** IM-13: never claim accuracy. The only framing is that this is a draft. */
  draftFraming: "Nothing is added until you confirm. The list below is a draft and may be incomplete.",
  reviewTitle: (n: number, source: string) => `Review ${plural(n, "skill", "skills")} found in ${source}`,
  reviewSubline: "Edit, exclude or rename anything first.", // the draft framing line (draftFraming) already says nothing is added until you confirm (S-08 contract)
  counters: { found: "Found", willBeCreated: "Will be created", excluded: "Excluded", duplicates: "Possible duplicates", notRead: "Not read" },
  categoryCheckbox: (n: number, names: string[]) => `Create ${plural(n, "new category", "new categories")} from the groupings in this list: ${names.join(", ")}`,
  duplicateRow: (name: string) => `"${name}" is already in your library.`,
  duplicateChoices: { skip: "Skip", replace: "Replace", keepBoth: "Keep both" },
  replaceDisabled: "Replace is not available because this skill already has evidence.",
  unreadTitle: (n: number) => `${plural(n, "line was", "lines were")} not read as skills`,
  unreadBody: "These are shown so nothing is lost. Add any of them by hand if they should have been included.",
  unreadNone: "Everything was read.",
  unreadRow: (location: string, text: string, reason: string) => `${location}: ${text}. ${reason}`,
  unreadReason: { heading: "Looks like a section heading", empty: "Empty", unrecognised: "Could not be read as a skill", uncertain: "Not clearly a skill" },
  discard: { title: "Discard this import?", body: "Nothing has been added to your library yet.", confirm: "Discard import", keep: "Keep editing" },
  success: (n: number) => `Added ${plural(n, "skill", "skills")} to the library. ${n === 1 ? "It cannot" : "They cannot"} be used until ${n === 1 ? "it is" : "each one is"} configured.`,
  errorUnreadable: "This file could not be read. Try another file, paste the list, or add skills one at a time.",
  errorNothing: "No skills were found in this source. Check the file, or paste the list.",
} as const

export const s09 = {
  title: (skill: string | null) => (skill ? `Configure ${skill}` : "Add skill"),
  subtitle: "You define how this skill is evaluated and what achievement requires.",
  sections: ["Skill", "How it is evaluated", "When one evaluation counts", "Achievement criteria", "Student details", "Evaluator", "Workflow", "Preview"],
  categoryHelp: "One per skill. Optional. Only active categories are listed.",
  tagsHelp: "Any number per skill. Only active tags are listed. Tags cut across categories and support cross-cutting reports.",
  statusHelp: "Active skills can be mapped to course offerings and requested by students.",
  modelHeading: "Evaluation model. Choose one. Nothing is selected by default.",
  models: {
    binary: { title: "Overall binary outcome", body: "The evaluator records one overall outcome using two labels you define." },
    question: { title: "Question-level qualitative", body: "The evaluator answers Yes or No to each question you define." },
    scored: { title: "Scored / Likert", body: "The evaluator scores each question on a scale you define." },
    demonstration: { title: "Demonstration-level outcome", body: "The evaluator records the level of supervision for each demonstration." },
  },
  binaryLabels: { qualifying: "Qualifying outcome label", other: "Other outcome label", helper: "The two labels must be different." },
  rule: {
    questionHeading: "An evaluation qualifies when:",
    all: "All questions are answered Yes",
    atLeast: "At least {n} of {m} questions are answered Yes",
    subset: "These questions are answered Yes:",
    average: "The average score is at least {n}",
    minPerQuestion: "Every question scores at least {n}",
    total: "The total score is at least {n}",
  },
  demonstrationNote: "Every completed demonstration is evidence. The mix of levels is set in the achievement criteria.",
  levelsHeading: "Levels of supervision, ordered from most to least supervised.",
  criteria: {
    requiredCount: "Number of qualifying evaluations required",
    totalDemonstrations: "Total demonstrations required",
    perLevel: "Minimum at each level",
    perSetting: "Minimum by clinical setting",
    helper: "Optional. Counted per setting. Lab or simulation evidence never counts toward a clinical setting.",
  },
  lineage: { heading: ["Model", "Evidence per evaluation", "An evaluation qualifies when", "Achievement criteria", "Skill status"], helper: "Each step is determined by the one above it." },
  modelChange: { title: "Change the evaluation model?", body: "The questions, levels and achievement criteria for the current model will be rebuilt. Evidence already recorded is kept.", confirm: "Change model" },
  studentFields: { heading: "What the student supplies", helper: "Setting and location come from the student's placement and are not entered here.", types: { date: "Date", shortText: "Short text", longText: "Long text", number: "Number", choice: "Choice list" }, add: "Add field" },
  comment: { label: "Evaluator comment", optional: "Optional", required: "Required", requiredHelper: "The evaluator cannot submit without a comment." },
  workflow: {
    selfEval: { label: "Student self-evaluates first", helper: "The student completes the same form before the evaluator sees it." },
    approval: { label: "Administrator reviews before evidence counts", helper: "Evidence counts only after a reviewer approves it." },
  },
  roles: { heading: "Who can evaluate this skill", helper: "Students can only send this skill to a role selected here." },
  preview: { heading: "Form preview", helper: "What the student and the evaluator will each see." },
  impact: (evals: number, students: number) => `Changing this rule updates how ${plural(evals, "existing evaluation is", "existing evaluations are")} counted. ${plural(students, "student", "students")} may change status. Review before saving.`,
  buttons: { save: "Save skill", copyFrom: "Copy configuration from another skill", applyToSelected: "Apply to selected skills" },
  success: (skill: string) => `${skill} saved and ready to be mapped.`,
  saveBlocked: (n: number) => `This configuration cannot be saved. Fix ${plural(n, "issue", "issues")} below.`,
  validation: {
    questionEmpty: (n: number) => `Question ${n} needs text.`,
    questionDuplicate: (n: number, m: number) => `Question ${n} has the same text as question ${m}. Each question must be different.`,
    levelEmpty: (n: number) => `Level ${n} needs a label.`,
    levelDuplicate: (label: string) => `Two levels are called "${label}". Each level must have a different label.`,
    binaryEqual: "The two outcome labels must be different.",
    subsetEmpty: "Select at least one question for this rule.",
    atLeastTooHigh: (n: number, m: number) => `"At least ${n}" cannot be more than the ${m} questions you have.`,
    levelMinimumsTooHigh: (x: number, y: number) => `The minimums at each level add up to ${x}, which is more than the ${y} demonstrations required. Lower a minimum or raise the total.`,
    settingMinimumTooHigh: (x: number, y: number) => `The minimums by setting add up to ${x}, which is more than the ${y} evaluations required.`,
    noModel: "Choose an evaluation model to continue.",
    noRole: "Select at least one role that can evaluate this skill.",
    clinicalMinimumNoRole: (roles: string[]) => `This skill requires clinical evidence, but none of its allowed evaluator roles can sign off clinical evidence. Allow at least one of: ${roles.join(", ")}, or remove the clinical setting minimums.`,
  },
} as const

export const s10 = {
  title: "Course mapping",
  subtitle: "Set which skills are mandatory for each clinical course offering",
  ruleNote: "Mapping sets what a course expects. It does not restrict where a skill can be evaluated. Students can still request evaluations for skills outside the mapping, and evidence counts toward one skill record shared across courses.",
  offeringsHeader: (n: number, total: number) => `Clinical course offerings. ${n} of ${total} match. Count shows mandatory out of total.`,
  filters: ["Cohort", "Academic year", "Term", "Professional year", "Search by course code or name", "Clear"],
  panelTitle: (code: string) => `Skills mapped to ${code}`,
  panelSubline: (name: string, term: string, year: string, profYear: number, m: number, n: number) => `${name}, ${term} ${year}, Year ${profYear}. ${m} mandatory, ${n} non-mandatory`,
  alsoMapped: (list: string) => `Also mapped in ${list}. One student skill record is shared across courses.`,
  emptyNoSkills: "No configured skills are available to map. Configure skills in the library first.",
  emptyNoCohort: "No cohort is enrolled in this offering yet. You can still map skills.",
  /** OD-01 is OPEN: no copy about carrying mappings between terms. */
} as const

export const s11 = {
  title: "Review and approve",
  subtitle: "Approve submitted evaluations for skills that require it",
  intro: "Evaluations appear here only for skills where the program turned on administrator review. All others count as soon as the evaluator submits.",
  columns: ["Student", "Skill", "Course", "Setting and location", "Evaluator (role)", "Agreement", "Review"],
  agree: "The student and the evaluator recorded the same outcome.",
  disagree: "The student and the evaluator recorded different outcomes. Review the responses before deciding.",
  expand: "See the full responses",
  noteLabel: "Review note (optional)",
  noteHelper: "Kept with the evaluation.",
  /** OD-16 is OPEN: neutral about who corrects. */
  returnPrompt: "Why is this being returned? Your note is kept with the evaluation.",
  approved: (skill: string, student: string) => `${skill} for ${student} approved. It now counts toward their record.`,
  /** AE-01 effect: shown after an approval so the reviewer sees the record change. Admin voice, counts only. */
  approvedEffect: (have: number, needed: number | null, noun: "demonstrations" | "qualifyingEvaluations") =>
    needed === null
      ? `Their record now has ${have} ${noun === "demonstrations" ? (have === 1 ? "demonstration" : "demonstrations") : have === 1 ? "qualifying evaluation" : "qualifying evaluations"}.`
      : `Their record now has ${have} of ${needed} ${noun === "demonstrations" ? "demonstrations" : "qualifying evaluations"}.`,
  returned: (skill: string, student: string) => `${skill} for ${student} returned for correction. It does not count until the correction is complete.`,
  empty: "Nothing is waiting for approval.",
  error: "The review queue could not be loaded. Try again.",
} as const

export const s12 = {
  heading: (code: string) => `Skills for ${code}`,
  intro: "Mandatory skills are required for this course. Non-mandatory skills are available but not required.",
  progress: { demonstrations: (x: number, y: number) => `${x} of ${y} demonstrations`, evaluations: (x: number, y: number) => `${x} of ${y} qualifying evaluations` },
  settingProgress: (setting: string, x: number, y: number) => `${setting}: ${x} of ${y}`,
  achievedNote: "Achieved. You can still request another evaluation if your program wants more evidence.",
  onlySent: "Show only skills I have sent for review",
  selectionBar: (n: number) => `${plural(n, "skill", "skills")} selected`,
  awaiting: (n: number) => `Waiting for evaluation. ${plural(n, "request", "requests")} sent.`,
  other: { title: "Other skills", body: "Not mapped to this course. Evidence still counts toward your skill record." },
  empty: "No skills are mapped to this course yet. You can still send other skills for review.",
  error: "Your skills could not be loaded. Try again.",
} as const

export const s14 = {
  title: (skill: string) => `Your submission history for ${skill}`,
  counters: { counted: "Counted so far", inProgress: "In progress", returned: "Returned", inProgressHelper: "Sent but not finished", returnedHelper: "Sent back by a reviewer" },
  scope: (all: number, course: string, thisCourse: number) => ({ all: `All courses (${all})`, one: `${course} only (${thisCourse})` }),
  note: "Evidence counts toward this skill wherever it was gathered, so submissions from other courses are included.",
  attempt: (n: number, date: string, where: string, course: string) => `Attempt ${n}. ${date}. ${where}. ${course}`,
  revised: (n: number) => `Revised and resent ${n} ${n === 1 ? "time" : "times"}.`,
  reviewerNote: (text: string) => `Reviewer note: ${text}`,
  empty: "You have not sent this skill for review yet.",
} as const

export const s15 = {
  title: "My skills",
  subtitle: "Your record for every skill, across all your courses",
  allCourses: "All courses",
  empty: "You have no skills to show yet. Skills appear here once your program maps them to your courses, or you send one for review.",
  inactiveGroup: "Inactive skills",
} as const

export const s16 = {
  header: (student: string) => `Evaluate ${student}`,
  subline: (course: string, requested: string, role: string) => `${course}. Requested ${requested}. You are completing this as ${role}.`,
  studentDetails: "Supplied by the student",
  selfEvaluation: (answer: string) => `The student's self-evaluation: ${answer}`,
  yes: "Yes",
  no: "No",
  comment: { required: "Your comment (required)", optional: "Your comment (optional)", helper: "What the student did well and what to work on next." },
  commentError: (skill: string) => `Add a comment for ${skill} before you submit. The program requires one.`,
  incomplete: (skill: string) => `Answer every question for ${skill} to submit.`,
  submit: "Submit evaluation",
  footer: "Submitting records your answers. You will not be asked to sign in.",
  resultBanner: (student: string, n: number) => `Evaluation submitted for ${student}. ${plural(n, "skill", "skills")} recorded.`,
  error: "Your evaluation was not submitted. Your answers are kept. Try again.",
} as const

export const s17 = {
  button: "Export",
  menu: { aggregate: "Attainment summary", aggregateHelp: "The table as currently filtered", evidence: "Evidence detail", evidenceHelp: "One row per evaluation, with comments, setting, location and review notes" },
  helper: "The filters you have applied are recorded in the file. Exports cover everything that matches, not only the rows shown.",
  /** OD-10 is OPEN: do not claim an Excel workbook. */
  formatLabel: "Export as CSV (opens in Excel)",
  progress: "Preparing your export",
  success: "Your export is ready.",
  error: "The export could not be created. Try again.",
  empty: "There is nothing to export for these filters.",
} as const

export const s18 = {
  subject: (student: string, n: number) => `${student} has asked you to evaluate ${plural(n, "skill", "skills")}`,
  openLabel: "Open evaluation",
} as const
