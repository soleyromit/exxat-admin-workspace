/** Linked activity types shown in the Learning Activities column. */
export type LearningActivityType =
  | "forms-evaluations"
  | "patient-log"
  | "timesheet"
  | "time-off"

export interface CourseActivityAction {
  type: LearningActivityType
  enabled: boolean
  /** Shown on hover/focus when `enabled` is false. */
  disabledReason?: string
}

export interface CourseOffering extends Record<string, unknown> {
  id: string
  folderId: string
  courseNumber: string
  courseName: string
  /** Per-type link actions — enabled and disabled rows can mix in one cell. */
  activityActions: CourseActivityAction[]
  /** Denormalized types for filters/search (`activityActions[].type`). */
  activityTypes: LearningActivityType[]
  academicYear: string
  term: string
  cohort: string
  professionalYear: string
}

const ACTIVITY_LABELS: Record<LearningActivityType, string> = {
  "forms-evaluations": "Forms/Evaluations",
  "patient-log": "Patient Log",
  timesheet: "Timesheet",
  "time-off": "Time Off",
}

export function learningActivityTypeLabel(type: LearningActivityType): string {
  return ACTIVITY_LABELS[type]
}

export function offeringActivityTypes(offering: CourseOffering): LearningActivityType[] {
  return offering.activityTypes
}

export function getCourseOfferingById(id: string): CourseOffering | undefined {
  return LEARNING_ACTIVITY_OFFERINGS.find(offering => offering.id === id)
}

export function offeringDisplayTitle(offering: CourseOffering): string {
  return `${offering.courseNumber} — ${offering.courseName}`
}

function makeActivityActions(
  entries: Array<[LearningActivityType, boolean, string?]>,
): CourseActivityAction[] {
  return entries.map(([type, enabled, disabledReason]) => ({
    type,
    enabled,
    ...(disabledReason ? { disabledReason } : {}),
  }))
}

type CourseOfferingSeed = Pick<
  CourseOffering,
  | "id"
  | "folderId"
  | "courseNumber"
  | "courseName"
  | "academicYear"
  | "term"
  | "cohort"
  | "professionalYear"
>

function offering(
  base: CourseOfferingSeed,
  entries: Array<[LearningActivityType, boolean, string?]>,
): CourseOffering {
  const actions = makeActivityActions(entries)
  return {
    ...base,
    activityActions: actions,
    activityTypes: actions.map(action => action.type),
  }
}

/**
 * Centralized vocabulary — every offering below composes from these instead
 * of inlining ad hoc term/cohort strings, so the dataset reads as one
 * consistent DPT (Doctor of Physical Therapy) program rather than scattered
 * per-row placeholders.
 */
const TERM = {
  fall: "Fall",
  spring: "Spring",
  summer: "Summer",
  january: "January",
} as const

const COHORT = {
  class2025: "Class of 2025",
  cohortA: "Cohort A",
  class2023: "Class of 2023",
  class2027: "Class of 2027",
  summer2023: "Summer 2023 Cohort",
  class2026Eval: "Class of 2026 — Evaluations",
} as const

export const LEARNING_ACTIVITY_OFFERINGS: CourseOffering[] = [
  offering(
    {
      id: "co-1",
      folderId: "lag-eval-cohort",
      courseNumber: "PT500",
      courseName: "Clinical Practicum I",
      academicYear: "2025 - 2026",
      term: TERM.fall,
      cohort: COHORT.class2026Eval,
      professionalYear: "Year 2",
    },
    [
      ["forms-evaluations", true],
      ["patient-log", true],
      ["timesheet", true],
      ["time-off", true],
    ],
  ),
  offering(
    {
      id: "co-2",
      folderId: "lag-class-2025",
      courseNumber: "PT501",
      courseName: "Foundational Sciences",
      academicYear: "2024 - 2025",
      term: TERM.january,
      cohort: COHORT.class2025,
      professionalYear: "Year 1",
    },
    [
      ["forms-evaluations", true],
      ["patient-log", true],
      ["timesheet", true],
      ["time-off", true],
    ],
  ),
  offering(
    {
      id: "co-3",
      folderId: "lag-cohort-1",
      courseNumber: "PT502",
      courseName: "Clinical Integration I",
      academicYear: "2024 - 2025",
      term: TERM.summer,
      cohort: COHORT.cohortA,
      professionalYear: "Year 2",
    },
    [
      ["forms-evaluations", false, "Complete course setup before opening evaluations"],
      ["timesheet", true],
    ],
  ),
  offering(
    {
      id: "co-4",
      folderId: "lag-dpt-2023",
      courseNumber: "PT503",
      courseName: "Musculoskeletal Assessment",
      academicYear: "2023 - 2024",
      term: TERM.spring,
      cohort: COHORT.class2023,
      professionalYear: "Year 1",
    },
    [
      ["patient-log", true],
      ["time-off", false, "Time off requests are closed for this cohort"],
    ],
  ),
  offering(
    {
      id: "co-5",
      folderId: "lag-0104",
      courseNumber: "PT504",
      courseName: "Neurologic Rehabilitation",
      academicYear: "2023 - 2024",
      term: TERM.fall,
      cohort: COHORT.class2027,
      professionalYear: "Year 3",
    },
    [["forms-evaluations", true]],
  ),
  offering(
    {
      id: "co-6",
      folderId: "lag-july-2023",
      courseNumber: "PT505",
      courseName: "Cardiopulmonary PT",
      academicYear: "2022 - 2023",
      term: TERM.summer,
      cohort: COHORT.summer2023,
      professionalYear: "Year 2",
    },
    [
      ["forms-evaluations", true],
      ["patient-log", true],
      ["timesheet", false, "Timesheet is not linked to this offering"],
    ],
  ),
  offering(
    {
      id: "co-7",
      folderId: "lag-eval-cohort",
      courseNumber: "PT506",
      courseName: "Professional Issues",
      academicYear: "2024 - 2025",
      term: TERM.january,
      cohort: COHORT.class2026Eval,
      professionalYear: "Year 1",
    },
    [
      ["timesheet", true],
      ["time-off", true],
    ],
  ),
  offering(
    {
      id: "co-8",
      folderId: "lag-class-2025",
      courseNumber: "PT507",
      courseName: "Research Methods",
      academicYear: "2024 - 2025",
      term: TERM.fall,
      cohort: COHORT.class2025,
      professionalYear: "Year 2",
    },
    [
      ["forms-evaluations", true],
      ["patient-log", true],
      ["timesheet", true],
      ["time-off", false, "Requires coordinator approval"],
    ],
  ),
  offering(
    {
      id: "co-9",
      folderId: "lag-cohort-1",
      courseNumber: "PT508",
      courseName: "Acute Care Practice",
      academicYear: "2023 - 2024",
      term: TERM.summer,
      cohort: COHORT.cohortA,
      professionalYear: "Year 3",
    },
    [["patient-log", false, "No clinical placement linked"]],
  ),
  offering(
    {
      id: "co-10",
      folderId: "lag-dpt-2023",
      courseNumber: "PT509",
      courseName: "Pediatric PT",
      academicYear: "2022 - 2023",
      term: TERM.fall,
      cohort: COHORT.class2023,
      professionalYear: "Year 2",
    },
    [
      ["forms-evaluations", true],
      ["time-off", false, "Time off is unavailable for this course"],
    ],
  ),
  offering(
    {
      id: "co-11",
      folderId: "lag-0104",
      courseNumber: "PT510",
      courseName: "Geriatric PT",
      academicYear: "2024 - 2025",
      term: TERM.january,
      cohort: COHORT.class2027,
      professionalYear: "Year 1",
    },
    [
      ["forms-evaluations", false, "Evaluations are archived for this term"],
      ["patient-log", true],
    ],
  ),
  offering(
    {
      id: "co-12",
      folderId: "lag-july-2023",
      courseNumber: "PT511",
      courseName: "Capstone Seminar",
      academicYear: "2023 - 2024",
      term: TERM.spring,
      cohort: COHORT.summer2023,
      professionalYear: "Year 3",
    },
    [["timesheet", true]],
  ),
]
