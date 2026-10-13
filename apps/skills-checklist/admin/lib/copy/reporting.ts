// S-01 to S-03 and S-17 copy (overview, drill-down, evidence, export). Never "failed", never red.
// Copy added during the build (2026-10-08). Source of truth for these strings is docs/ux/09 "Strings added during build" (every string is an [INFER] proposal
// until the copy owner adopts it). Professional tone, sentence case, no em-dashes, no exclamation marks.
import { buttons, statusLabel, term } from "./shared"

import type { SkillState } from "@/lib/engine"
import type { SkillStatusDisplay } from "@/lib/domain/types"

export const reportFilterLabels = {
  cohortId: "Cohort",
  groupId: "Group",
  offeringId: "Clinical course",
  categoryId: "Category",
  tagId: "Tag",
  locationId: "Location",
  settingId: "Setting",
} as const

export const reportingCopy = {
  addFilter: "Add filter",
  appliedFilters: "Applied filters",
  selectCohortFirst: "Select a cohort first",
  /** RP-08 scope sentence. */
  countingOnly: (where: string) => `Counting evidence recorded in ${where} only`,
  courseScoped: "Figures are scoped to the selected clinical course. Evidence from any course still counts toward each skill.",
  showAllEvidence: "Show all evidence",
  unconfigured: (n: number) => `${n} ${n === 1 ? "skill needs" : "skills need"} configuration`,
  unconfiguredLink: "Open the skills library",
  mandatory: term.mandatory,
  nonMandatory: term.nonMandatory,
  loading: "Updating results",
  skillsInScope: (n: number) => `${n} ${n === 1 ? "skill" : "skills"} in scope`,
  showing: (shown: number, total: number) => `Showing ${shown} of ${total} students`,
  attainment: (a: number, n: number, pct: number) => `${a} of ${n} (${pct}%)`,
  /** Empty-value marker in a cell. A hyphen, because the voice rules ban em-dashes in copy. */
  dash: "-",
  noEvidenceForCombination: "No evidence recorded for this combination yet.",
  tableCaption: { student: "Attainment by student", skill: "Attainment by skill", tag: "Attainment by tag" },
  columns: {
    skill: "Skill",
    category: "Category",
    model: "Evaluation model",
    requirement: "For this course",
    studentsInView: "Students in view",
    achieved: statusLabel("achieved", "four"),
    inProgress: statusLabel("partial", "four"),
    notQualify: statusLabel("evidenceDoesNotQualify", "four"),
    noEvidence: statusLabel("noEvidence", "four"),
    notMet: statusLabel("noEvidence", "merged"),
    percent: "Percent achieved",
    courses: "Courses",
    tag: "Tag",
    skills: "Skills",
    categoriesSpanned: "Categories spanned",
    allAchieved: "Students achieving all",
  },
  models: { binary: "Overall binary outcome", question: "Question-level qualitative", scored: "Scored", demonstration: "Demonstration-level outcome" } as const,
  kpiHelp: { studentsInView: "Match the filters above", average: "Per student, in scope", allSkills: (pct: number) => `${pct}% of students in view`, attention: "Below 50% achieved in view" },
  rail: {
    label: "Student record",
    counters: "Skill status counts",
    onlyShowing: (label: string) => `Showing only: ${label}`,
    stillNeeded: "Still needed:",
    waiting: (n: number) => `${n} waiting, not counted yet`,
    labNotCounted: (n: number) => `${n} lab or simulation ${n === 1 ? "record is" : "records are"} not counted toward a clinical setting`,
    levelHeading: "Per-level progress",
    settingHeading: "Progress by clinical setting",
    prev: "Previous student",
    next: "Next student",
    breadcrumb: "Record level",
    students: "Students",
    errorStudent: "This student's record could not be loaded. Try again.",
    noAccess: "You do not have access to this record.",
    skillRow: (skill: string, status: string, have: number, needed: number | null) => `${skill}, ${status}${needed !== null ? `, ${have} of ${needed}` : ""}`,
  },
  evidence: {
    empty: "No evidence has been recorded for this skill yet.",
    filteredEmpty: "No evidence matches the location or setting filter.",
    countsFiltered: "Counts reflect the location or setting filter applied on the overview.",
    countedHeader: (n: number, total: number) => `${n} counted of ${total} ${total === 1 ? "record" : "records"}`,
    viewAria: (date: string, who: string) => `View evaluation, ${date}, ${who}`,
    levelRemoved: "level removed",
    labSetting: term.lab,
    reasonTitle: "Why this evaluation did not count",
  },
  detail: {
    studentSupplied: "Supplied by the student",
    responses: (role: string) => `${role} responses`,
    comment: "Comment",
    selfEval: "Self-evaluation",
    reviewNote: "Review note",
    note: "Student note",
    score: (n: number) => `Score ${n}`,
    average: (n: number) => `Average score ${Number.isInteger(n) ? n : n.toFixed(1)}`,
    total: (n: number) => `Total score ${n}`,
    yesOf: (y: number, t: number) => `${y} of ${t} questions answered Yes`,
    returned: "Returned for correction",
    waitingApproval: "Waiting for approval. This evaluation is listed but does not count yet.",
    noQuestions: "No questions were recorded.",
  },
  exp: {
    sheetTitle: (kind: string) => `Export ${kind}`,
    scope: "Scope",
    rows: (n: number) => `${n} ${n === 1 ? "row" : "rows"} will be exported`,
    includes: "What is included",
    includesAggregate: "One row per student, skill or tag for the current tab, with state counts and attainment.",
    includesEvidence: "One row per evaluation: setting, location, role, recorded answers, comment, student-supplied details, self-evaluation and review note.",
    notIncluded: "Evaluator names and email addresses are not included.",
    format: "Format",
    cancel: buttons.cancel,
    download: (n: number) => `Download CSV, ${n} ${n === 1 ? "row" : "rows"}`,
    filtersEchoed: (lines: string) => `Filters recorded in the file: ${lines}`,
    disabledReason: "Export is unavailable until the results have loaded and match at least one row.",
    kindNames: { student: "attainment by student", skill: "attainment by skill", tag: "attainment by tag", evidence: "evidence detail" },
    fileName: (kind: string) => `skills-${kind}.csv`,
  },
} as const

/** Label for one state counter in S-02. Honors the OD-03 flag (merged counts states 1 and 2 together). */
export function counterGroups(display: SkillStatusDisplay): Array<{ key: string; label: string; states: SkillState[] }> {
  return display === "four"
    ? [
        { key: "achieved", label: statusLabel("achieved", "four"), states: ["achieved"] },
        { key: "partial", label: statusLabel("partial", "four"), states: ["partial"] },
        { key: "evidenceDoesNotQualify", label: statusLabel("evidenceDoesNotQualify", "four"), states: ["evidenceDoesNotQualify"] },
        { key: "noEvidence", label: statusLabel("noEvidence", "four"), states: ["noEvidence"] },
      ]
    : [
        { key: "achieved", label: statusLabel("achieved", "four"), states: ["achieved"] },
        { key: "partial", label: statusLabel("partial", "four"), states: ["partial"] },
        { key: "notMet", label: statusLabel("noEvidence", "merged"), states: ["evidenceDoesNotQualify", "noEvidence"] },
      ]
}
