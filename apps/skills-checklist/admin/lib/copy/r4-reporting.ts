// R4 re-skin copy (Overview, drill-down dialogs, export popover). Strings follow the Sankalp prototype exactly
// (docs/build/prototype-parity.md cards P-01..P-03). One deliberate difference: the workspace voice rule bans em-dashes, so
// the prototype's em-dashes are kept verbatim ("By student — this table", "IV Insertion — Noah Zeller", the tag note): Romit asked for the
// exact mockup, so this file is excluded from the voice test on purpose (see tests/copy/copy.test.ts).
import type { SkillStatusDisplay } from "@/lib/domain/types"
import type { ExportKind } from "@/lib/store"

export const r4 = {
  filters: {
    button: "Filters",
    showingEverything: "Showing everything",
    clearAll: "Clear all",
    panelLabel: "Filter options",
    fields: { cohort: "Cohort", group: "Group", course: "Clinical course", category: "Category", tag: "Tag", location: "Location", setting: "Setting" },
    all: { cohort: "All Cohorts", group: "All Groups", course: "All Clinical Courses", category: "All Categories", tag: "All Tags", location: "All Locations", setting: "All Settings" },
    hints: { group: "Select a cohort first", tag: "Cuts across categories", setting: "Filters the evidence" },
    lab: "Lab / Simulation",
    countAria: (n: number) => `${n} ${n === 1 ? "filter" : "filters"} applied`,
  },
  context: {
    allCohorts: "All cohorts",
    allGroups: "All groups",
    allCourses: "All clinical courses",
    students: (n: number) => `Showing data for ${n} ${n === 1 ? "student" : "students"}`,
    skillsInScope: (n: number) => `${n} ${n === 1 ? "skill" : "skills"} in scope`,
  },
  kpis: ["Students in view", "Avg. skills achieved", "Students achieving all skills in scope", "Skills needing attention"] as const,
  kpiHelp: { students: "Matches the filters above", average: "Per student, in scope", all: (pct: number) => `${pct}% of students in view`, attention: "Below 50% achievement in view" },
  tabs: { student: "By student", skill: "By skill", tag: "By tag" },
  sort: { highest: "Highest attainment", lowest: "Lowest attainment", name: "Name (A–Z)" },
  search: "Search students",
  sortLabel: "Sort students",
  headers: {
    student: (display: SkillStatusDisplay): string[] =>
      display === "four"
        ? ["Student", "Cohort · group", "Achieved", "In progress", "Evidence does not qualify", "No evidence yet", "Attainment"]
        : ["Student", "Cohort · group", "Achieved", "In progress", "Not met", "Attainment"],
    skill: (display: SkillStatusDisplay): string[] =>
      display === "four"
        ? ["Skill", "Category", "Evaluation model", "Students in view", "Achieved", "In progress", "Evidence does not qualify", "No evidence yet", "% achieved", "Courses"]
        : ["Skill", "Category", "Evaluation model", "Students in view", "Achieved", "In progress", "Not met", "% achieved", "Courses"],
    skillRequirement: "For this course",
    tag: (display: SkillStatusDisplay): string[] =>
      display === "four"
        ? ["Tag", "Skills", "Categories spanned", "Achieved", "In progress", "Evidence does not qualify", "No evidence yet", "% achieved", "Students achieving all"]
        : ["Tag", "Skills", "Categories spanned", "Achieved", "In progress", "Not met", "% achieved", "Students achieving all"],
  },
  footer: {
    students: (shown: number, total: number, display: SkillStatusDisplay) =>
      `Showing ${shown} of ${total} students${display === "merged" ? " · Not met includes skills with no qualifying evidence yet" : ""}`,
  },
  skillNote: "% achieved counts every student in view, including students whose clinical courses do not recommend the skill. Filter by clinical course to narrow the population to students expected to complete it.",
  tagNote: "Achieved, in progress and not met count student-to-skill records, not students. A skill carrying two tags is counted under both, so these rows overlap — that is what makes the view cross-cutting rather than a partition.",
  impossible: {
    title: "No evidence matches these filters",
    clear: "Clear location and setting",
    /** Prototype 16 wording for the location that does not offer the chosen setting. */
    locationSetting: (location: string, setting: string) => `${location} does not offer ${setting}, so no evidence could have been gathered there in that setting.`,
  },
  skillDialog: {
    summary: (achieved: number, total: number, pct: number) => `${achieved} of ${total} students in view have achieved this skill (${pct}%)`,
    how: "How this skill is achieved",
    tabs: (display: SkillStatusDisplay, a: number, p: number, n: number) => [`Achieved (${a})`, `In progress (${p})`, `${display === "merged" ? "Not met" : "No evidence"} (${n})`],
    headers: ["Student", "Group", "Progress", "Evidence", "Status"],
    levelsLine: (labels: string[]) => labels.join(" / "),
  },
  tagDialog: {
    summary: (skills: number, pct: number) => `${skills} ${skills === 1 ? "skill" : "skills"} · ${pct}% of student-to-skill records achieved`,
    description: "Program-defined tag",
    kpis: ["Achieved", "In progress", "Students achieving every skill in this tag"] as const,
    headers: ["Skill", "Category", "Evaluation model", "% achieved"],
  },
  studentDialog: {
    subline: (cohort: string, group: string, n: number, total: number) => `${cohort} · ${group} · ${n} of ${total} skills achieved`,
    counters: { achieved: "Achieved", inProgress: "In progress", notMet: "Not met", noEvidence: "No evidence yet", doesNotQualify: "Evidence does not qualify" },
    showThese: "Show these only",
    showAll: "Show all skills",
    needs: (model: string, criteria: string) => `${model} · needs ${criteria}`,
    progress: (have: number, needed: number | null, noun: string) => (needed === null ? `${have} ${noun}` : `${have} / ${needed} ${noun}`),
    levelsLabel: "Demonstration levels:",
    ledgerHeaders: ["Date", "Setting", "Evaluator", "Recorded", "Result"],
    counts: "Counts as evidence",
    viewForm: "View form",
    /** Accessible name starts with the visible text (label in name). */
    viewFormAria: (date: string, who: string) => `View form, ${date}, ${who}`,
    commentLine: (role: string, text: string) => `${role} comment: ${text}`,
    labSetting: "Lab / Simulation",
    clinical: "Clinical",
    skillsList: "Skills in scope",
    expand: (skill: string) => `Show evidence for ${skill}`,
    collapse: (skill: string) => `Hide evidence for ${skill}`,
  },
  evaluation: {
    title: (skill: string, student: string) => `${skill} — ${student}`,
    completed: "Completed",
    supplied: "Supplied by the student",
    responses: (role: string) => `${role} responses`,
    comment: "Comment",
    none: "None recorded.",
    close: "Close",
  },
  exportMenu: {
    heading: "Export (CSV, opens in Excel)",
    aggregate: { student: "By student — this table", skill: "By skill — this table", tag: "By tag — this table" } as Record<ExportKind, string>,
    aggregateHelp: "Exactly what is on screen, filters applied",
    evidence: "Evidence detail",
    evidenceHelp: "One row per evaluation, with comments and setting",
    footnote: "The current filters are written into the file header.",
    closeAria: "Close export menu",
    unavailable: "There is nothing to export for these filters.",
    started: (file: string, rows: number) => `Export started: ${file}, ${rows} ${rows === 1 ? "row" : "rows"}.`,
    filtersRecorded: (lines: string) => `Filters recorded in the file: ${lines}`,
    error: "The export could not be created. Try again.",
    fileName: (kind: string) => `skills-${kind}.csv`,
  },
} as const
