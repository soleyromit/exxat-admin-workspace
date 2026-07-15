/**
 * Mock bodies for course offering detail modules (forms, logs, timesheets, …).
 */

export type FormInitiator = "Student" | "Delegate" | "Admin"

/**
 * One row per form — catalog info (name, initiator, basis) merged with
 * distribution/submission stats when the form has been sent out. A form
 * with no `distributedTotal` simply hasn't been distributed yet.
 */
export type CourseFormRow = {
  id: string
  offeringId: string
  name: string
  initiator: FormInitiator
  practicumBased: boolean
  isFavorite?: boolean
  isNew?: boolean
  rotationName?: string
  rotationDates?: string
  placementCount?: number
  distributedCount?: number
  distributedTotal?: number
  lastDistributedOn?: string
  submittedCount?: number
  submittedTotal?: number
} & Record<string, unknown>

export type CourseFormReviewRow = {
  id: string
  offeringId: string
  studentName: string
  studentId: string
  electiveTag?: string
  rotationName: string
  rotationDates: string
  placementFaculty: string
  isNew?: boolean
  /** Which form basis this placement's review rows belong to — filtered by the module-level basis control. */
  practicumBased: boolean
  formStatuses: {
    "Level I Fieldwork"?: "not-started" | "in-progress" | "submitted"
    Competency?: "not-started" | "in-progress" | "submitted"
    "Preceptor Endorsement"?: "not-started" | "in-progress" | "submitted"
  }
} & Record<string, unknown>

export type CoursePracticumRow = {
  id: string
  offeringId: string
  studentName: string
  studentId: string
  siteLocation: string
  electiveTag?: string
  rotationName: string
  rotationDates: string
  placementFaculty?: string
  isNew?: boolean
  logCounts?: { draft: number; pending: number; rejected: number; approved: number }
  lastEncounter?: string
  lastUpdate?: string
  timesheetHours?: { draft: string; submitted: string; pending: string; rejected: string; approved: string }
  timesheetLastUpdate?: string
} & Record<string, unknown>

export type CourseGradebookRow = {
  id: string
  offeringId: string
  studentName: string
  finalWeightedScore?: string
  patientLogCalScore?: string
  patientLogWtScore?: string
  isNew?: boolean
} & Record<string, unknown>

export type CourseReportRow = {
  id: string
  offeringId: string
  category: string
  name: string
  description: string
  isFavorite?: boolean
  isNew?: boolean
} & Record<string, unknown>

const FORM_ROWS: CourseFormRow[] = [
  {
    id: "f-1",
    offeringId: "co-1",
    name: "Level I Fieldwork Student Evaluation of Fieldwork Experience",
    initiator: "Student",
    practicumBased: true,
    isFavorite: true,
  },
  {
    id: "f-2",
    offeringId: "co-1",
    name: "1st Trimester OB Competency",
    initiator: "Delegate",
    practicumBased: true,
    isNew: true,
  },
  {
    id: "f-3",
    offeringId: "co-1",
    name: "Preceptor Endorsement Form",
    initiator: "Admin",
    practicumBased: true,
    rotationName: "Acute Care Rotation",
    rotationDates: "03/01/2024 – 08/31/2024",
    placementCount: 1,
    distributedCount: 1,
    distributedTotal: 1,
    lastDistributedOn: "04/01/2026",
    submittedCount: 0,
    submittedTotal: 7,
  },
  {
    id: "f-4",
    offeringId: "co-1",
    name: "Midterm Clinical Performance",
    initiator: "Student",
    practicumBased: false,
    rotationName: "Didactic Coursework",
    rotationDates: "09/01/2024 – 12/13/2024",
    placementCount: 1,
    distributedCount: 1,
    distributedTotal: 1,
    lastDistributedOn: "10/05/2024",
    submittedCount: 1,
    submittedTotal: 1,
  },
  {
    id: "f-5",
    offeringId: "co-2",
    name: "Foundational Sciences Midterm Evaluation",
    initiator: "Student",
    practicumBased: false,
    isFavorite: true,
    distributedCount: 14,
    distributedTotal: 16,
    lastDistributedOn: "03/01/2026",
    submittedCount: 12,
    submittedTotal: 16,
  },
  {
    id: "f-6",
    offeringId: "co-2",
    name: "Lab Competency Checklist",
    initiator: "Delegate",
    practicumBased: false,
    isNew: true,
  },
  {
    id: "f-7",
    offeringId: "co-2",
    name: "Clinical Readiness Self-Assessment",
    initiator: "Student",
    practicumBased: true,
    distributedCount: 8,
    distributedTotal: 16,
    submittedCount: 6,
    submittedTotal: 8,
  },
]

const FORM_REVIEW_ROWS: CourseFormReviewRow[] = [
  {
    id: "fr-1",
    offeringId: "co-1",
    studentName: "Ramirez, Sofia",
    studentId: "PM00679936",
    electiveTag: "(elective) IP Mixed",
    rotationName: "Acute Care Rotation",
    rotationDates: "3/1/2024 – 8/31/2024",
    placementFaculty: "Dr. Rivera",
    practicumBased: true,
    formStatuses: {
      "Level I Fieldwork": "not-started",
      Competency: "not-started",
      "Preceptor Endorsement": "in-progress",
    },
  },
  {
    id: "fr-2",
    offeringId: "co-1",
    studentName: "Okafor, Ben",
    studentId: "PM00679941",
    rotationName: "Didactic Coursework",
    rotationDates: "9/1/2024 – 12/13/2024",
    placementFaculty: "Dr. Chen",
    practicumBased: false,
    isNew: true,
    formStatuses: {
      "Level I Fieldwork": "submitted",
      Competency: "in-progress",
    },
  },
  {
    id: "fr-3",
    offeringId: "co-2",
    studentName: "Chen, Lily",
    studentId: "PM00682011",
    rotationName: "Foundational Lab",
    rotationDates: "1/8/2025 – 4/25/2025",
    placementFaculty: "Dr. Patel",
    practicumBased: false,
    isNew: true,
    formStatuses: {
      "Level I Fieldwork": "in-progress",
      Competency: "not-started",
    },
  },
  {
    id: "fr-4",
    offeringId: "co-2",
    studentName: "Martinez, Jordan",
    studentId: "PM00682019",
    rotationName: "Foundational Lab",
    rotationDates: "1/8/2025 – 4/25/2025",
    placementFaculty: "Dr. Patel",
    practicumBased: false,
    formStatuses: {
      "Level I Fieldwork": "submitted",
      Competency: "submitted",
    },
  },
]

const PRACTICUM_ROWS: CoursePracticumRow[] = [
  {
    id: "p-1",
    offeringId: "co-1",
    studentName: "Dodke, Pooja",
    studentId: "PM00679936",
    siteLocation: "Riverside Medical Center — Outpatient",
    electiveTag: "(elective) IP Mixed",
    rotationName: "Acute Care Rotation",
    rotationDates: "1/1/2025 – 6/11/2025",
    placementFaculty: "Dr. Chen",
    logCounts: { draft: 0, pending: 0, rejected: 0, approved: 0 },
    lastEncounter: undefined,
    lastUpdate: undefined,
    timesheetHours: {
      draft: "01:05",
      submitted: "01:05",
      pending: "00:00",
      rejected: "00:00",
      approved: "00:00",
    },
    timesheetLastUpdate: "02/20/2025",
  },
  {
    id: "p-2",
    offeringId: "co-2",
    studentName: "Nguyen, Alex",
    studentId: "PM00681204",
    siteLocation: "Metro Rehab Center",
    rotationName: "Acute Care I",
    rotationDates: "2/3/2025 – 5/30/2025",
    isNew: true,
    logCounts: { draft: 2, pending: 1, rejected: 0, approved: 4 },
    lastEncounter: "03/12/2025",
    lastUpdate: "03/14/2025",
    timesheetHours: {
      draft: "00:00",
      submitted: "12:30",
      pending: "02:15",
      rejected: "00:00",
      approved: "40:00",
    },
    timesheetLastUpdate: "03/14/2025",
  },
  {
    id: "p-3",
    offeringId: "co-2",
    studentName: "Chen, Lily",
    studentId: "PM00682011",
    siteLocation: "University Health Clinic",
    rotationName: "Foundational Lab",
    rotationDates: "1/8/2025 – 4/25/2025",
    placementFaculty: "Dr. Patel",
    logCounts: { draft: 1, pending: 2, rejected: 0, approved: 18 },
    lastEncounter: "03/18/2025",
    lastUpdate: "03/19/2025",
    timesheetHours: {
      draft: "02:00",
      submitted: "08:30",
      pending: "04:15",
      rejected: "00:00",
      approved: "52:00",
    },
    timesheetLastUpdate: "03/19/2025",
  },
  {
    id: "p-4",
    offeringId: "co-2",
    studentName: "Martinez, Jordan",
    studentId: "PM00682019",
    siteLocation: "Community Wellness Center",
    rotationName: "Foundational Lab",
    rotationDates: "1/8/2025 – 4/25/2025",
    placementFaculty: "Dr. Patel",
    logCounts: { draft: 0, pending: 1, rejected: 0, approved: 22 },
    lastEncounter: "03/17/2025",
    lastUpdate: "03/18/2025",
    timesheetHours: {
      draft: "00:00",
      submitted: "06:00",
      pending: "01:30",
      rejected: "00:00",
      approved: "44:00",
    },
    timesheetLastUpdate: "03/18/2025",
  },
  {
    id: "p-5",
    offeringId: "co-2",
    studentName: "Williams, Sam",
    studentId: "PM00682027",
    siteLocation: "Metro Rehab Center — Pediatrics",
    rotationName: "Skills Lab II",
    rotationDates: "2/10/2025 – 5/20/2025",
    placementFaculty: "Dr. Nguyen",
    logCounts: { draft: 3, pending: 0, rejected: 1, approved: 11 },
    lastEncounter: "03/15/2025",
    lastUpdate: "03/16/2025",
    timesheetHours: {
      draft: "01:30",
      submitted: "10:00",
      pending: "00:00",
      rejected: "02:00",
      approved: "38:30",
    },
    timesheetLastUpdate: "03/16/2025",
  },
]

const PRACTICUM_ROW_TARGET = 100

const PRACTICUM_LAST_NAMES = [
  "Nguyen",
  "Chen",
  "Martinez",
  "Williams",
  "Patel",
  "Kim",
  "Okafor",
  "Ramirez",
  "Dodke",
  "Foster",
  "Garcia",
  "Hughes",
  "Ibrahim",
  "Johansson",
  "Khan",
]

const PRACTICUM_FIRST_NAMES = [
  "Alex",
  "Lily",
  "Jordan",
  "Sam",
  "Priya",
  "Min",
  "Ben",
  "Sofia",
  "Pooja",
  "Avery",
  "Blake",
  "Casey",
  "Drew",
  "Ellis",
  "Finley",
]

const PRACTICUM_SITES = [
  "Metro Rehab Center",
  "University Health Clinic",
  "Community Wellness Center",
  "Riverside Medical Center — Outpatient",
  "Metro Rehab Center — Pediatrics",
  "St. Mary's Hospital",
  "Valley Physical Therapy",
]

const PRACTICUM_ROTATIONS = [
  "Foundational Lab",
  "Acute Care I",
  "Skills Lab II",
  "Acute Care Rotation",
  "Outpatient Ortho",
]

function padClock(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
}

function buildPracticumRow(offeringId: string, index: number): CoursePracticumRow {
  const approved = (index % 9) + 2
  const pending = index % 6 === 0 ? 2 : index % 4 === 0 ? 1 : 0
  const draft = index % 8 === 0 ? 1 : 0
  const rejected = index % 11 === 0 ? 1 : 0
  const approvedHours = 20 + (index % 40)
  const pendingMins = (index % 4) * 15

  return {
    id: `p-gen-${offeringId}-${index}`,
    offeringId,
    studentName: `${PRACTICUM_LAST_NAMES[index % PRACTICUM_LAST_NAMES.length]}, ${PRACTICUM_FIRST_NAMES[(index * 2) % PRACTICUM_FIRST_NAMES.length]}`,
    studentId: `PM${String(6_800_000 + index).padStart(8, "0")}`,
    siteLocation: PRACTICUM_SITES[index % PRACTICUM_SITES.length],
    rotationName: PRACTICUM_ROTATIONS[index % PRACTICUM_ROTATIONS.length],
    rotationDates: "1/8/2025 – 4/25/2025",
    placementFaculty: index % 2 === 0 ? "Dr. Patel" : "Dr. Nguyen",
    isNew: index < 3,
    logCounts: { draft, pending, rejected, approved },
    lastEncounter: `03/${String((index % 28) + 1).padStart(2, "0")}/2025`,
    lastUpdate: `03/${String((index % 28) + 2).padStart(2, "0")}/2025`,
    timesheetHours: {
      draft: padClock(index % 3, (index * 5) % 60),
      submitted: padClock(4 + (index % 6), (index * 7) % 60),
      pending: padClock(0, pendingMins),
      rejected: padClock(0, rejected * 30),
      approved: padClock(approvedHours, (index * 11) % 60),
    },
    timesheetLastUpdate: `03/${String((index % 28) + 1).padStart(2, "0")}/2025`,
  }
}

function practicumRowsForOffering(offeringId: string): CoursePracticumRow[] {
  const seeded = PRACTICUM_ROWS.filter(row => row.offeringId === offeringId)
  if (seeded.length >= PRACTICUM_ROW_TARGET) return seeded
  const generated = Array.from({ length: PRACTICUM_ROW_TARGET - seeded.length }, (_, offset) =>
    buildPracticumRow(offeringId, seeded.length + offset),
  )
  return [...seeded, ...generated]
}

const GRADEBOOK_ROWS: CourseGradebookRow[] = [
  {
    id: "g-1",
    offeringId: "co-1",
    studentName: "Dodke, Pooja",
    finalWeightedScore: undefined,
    patientLogCalScore: "-/100",
    patientLogWtScore: undefined,
  },
  {
    id: "g-2",
    offeringId: "co-2",
    studentName: "Nguyen, Alex",
    finalWeightedScore: undefined,
    patientLogCalScore: "78/100",
    patientLogWtScore: "15.6/20",
  },
  {
    id: "g-3",
    offeringId: "co-2",
    studentName: "Chen, Lily",
    finalWeightedScore: undefined,
    patientLogCalScore: "82/100",
    patientLogWtScore: "16.4/20",
    isNew: true,
  },
  {
    id: "g-4",
    offeringId: "co-2",
    studentName: "Martinez, Jordan",
    finalWeightedScore: undefined,
    patientLogCalScore: "91/100",
    patientLogWtScore: "18.2/20",
  },
  {
    id: "g-5",
    offeringId: "co-2",
    studentName: "Williams, Sam",
    finalWeightedScore: undefined,
    patientLogCalScore: "74/100",
    patientLogWtScore: "14.8/20",
  },
]

const REPORT_ROWS: CourseReportRow[] = [
  {
    id: "r-1",
    offeringId: "co-1",
    category: "Forms/Evaluations",
    name: "Form completion summary",
    description: "Completion rates by form, rotation, and student for this offering.",
    isFavorite: true,
  },
  {
    id: "r-2",
    offeringId: "co-1",
    category: "Patient Log",
    name: "Encounter volume by site",
    description: "Aggregated encounter counts grouped by clinical site and status.",
    isNew: true,
  },
  {
    id: "r-3",
    offeringId: "co-1",
    category: "Timesheet",
    name: "Hours by approval status",
    description: "Submitted, pending, and approved clinical hours for the term.",
  },
  {
    id: "r-4",
    offeringId: "co-2",
    category: "Forms/Evaluations",
    name: "Midterm completion by cohort",
    description: "Submission and review status for foundational sciences evaluations.",
    isFavorite: true,
  },
  {
    id: "r-5",
    offeringId: "co-2",
    category: "Patient Log",
    name: "Encounter volume by site",
    description: "Aggregated encounter counts grouped by clinical site and status.",
    isNew: true,
  },
  {
    id: "r-6",
    offeringId: "co-2",
    category: "Gradebook",
    name: "Weighted score preview",
    description: "Draft weighted scores before final grade upload.",
  },
]

function filterByOffering<T extends { offeringId: string }>(rows: T[], offeringId: string): T[] {
  const exact = rows.filter(row => row.offeringId === offeringId)
  if (exact.length > 0) return exact
  return rows.filter(row => row.offeringId === "co-1").map(row => ({ ...row, offeringId }))
}

export function courseFormRows(offeringId: string): CourseFormRow[] {
  return filterByOffering(FORM_ROWS, offeringId)
}

export function courseFormReviewRows(offeringId: string): CourseFormReviewRow[] {
  return filterByOffering(FORM_REVIEW_ROWS, offeringId)
}

export function coursePracticumRows(offeringId: string): CoursePracticumRow[] {
  const exact = practicumRowsForOffering(offeringId)
  if (exact.length > 0) return exact
  return practicumRowsForOffering("co-1").map(row => ({ ...row, offeringId }))
}

export function courseGradebookRows(offeringId: string): CourseGradebookRow[] {
  return filterByOffering(GRADEBOOK_ROWS, offeringId)
}

export function courseReportRows(offeringId: string): CourseReportRow[] {
  return filterByOffering(REPORT_ROWS, offeringId)
}
