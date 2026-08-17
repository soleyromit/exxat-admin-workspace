/**
 * Mock records for the Admin console — the foundational objects every Exxat
 * product reads.
 *
 * Why these live in one file rather than one per hub: they are one system.
 * A course names the faculty member who owns it, a student sits in a program
 * that a course belongs to, and the Used across products panel on a record
 * detail has to answer questions that span all three. Splitting them into
 * three unrelated mock files would make those joins impossible to keep honest.
 *
 * Scope matters more here than anywhere else in the app. People and Courses
 * hang off school > program. Personnel hangs off brand > site > location and
 * belongs to the clinical partner, not the school, which is why it is a
 * separate list rather than a fourth person type.
 *
 * Names and programs are reused from `navigation.tsx` (Johns Hopkins, its
 * three programs) and `one-hubs.ts` (the four partner brands) so the products
 * read as one workspace rather than four unrelated demos.
 */

import type { MetricItem } from "@/components/key-metrics"

/* ── Shared vocabulary ────────────────────────────────────────────────────── */

/** What a record is doing in the workspace right now. */
export type AdminRecordStatus = "active" | "invited" | "inactive"

export const ADMIN_STATUS_LABEL: Record<AdminRecordStatus, string> = {
  active: "Active",
  invited: "Invited",
  inactive: "Inactive",
}

/**
 * Where the record came from. This is the whole reason Admin exists as a
 * console rather than a form: almost nothing here is typed by hand, so the
 * question a super admin actually asks is "which feed owns this field, and
 * when did it last land?"
 */
export type AdminSource = "sis" | "hr" | "import" | "manual"

export const ADMIN_SOURCE_LABEL: Record<AdminSource, string> = {
  sis: "SIS feed",
  hr: "HR feed",
  import: "File import",
  manual: "Added here",
}

export const ADMIN_SOURCE_ICON: Record<AdminSource, string> = {
  sis: "fa-database",
  hr: "fa-id-badge",
  import: "fa-file-arrow-up",
  manual: "fa-pen-line",
}

/** The three school-side programs this workspace runs. */
export const ADMIN_PROGRAMS = ["Medicine", "Nursing", "Public Health"] as const

/* ── People (school > program) ────────────────────────────────────────────── */

export type AdminPersonType = "student" | "faculty" | "staff"

export const ADMIN_PERSON_TYPE_LABEL: Record<AdminPersonType, string> = {
  student: "Student",
  faculty: "Faculty",
  staff: "Staff",
}

export interface AdminPerson extends Record<string, unknown> {
  id: string
  /** Stable workspace id. Products reference this, not the email. */
  personCode: string
  name: string
  email: string
  type: AdminPersonType
  program: string
  /** Students only. Faculty and staff carry a department instead. */
  cohort: string
  department: string
  status: AdminRecordStatus
  source: AdminSource
  /** ISO date the owning feed last wrote this record. */
  lastSyncedOn: string
}

export const ADMIN_PEOPLE: AdminPerson[] = [
  {
    id: "per-01",
    personCode: "PER-10428",
    name: "Amara Okafor",
    email: "aokafor@jhu.edu",
    type: "student",
    program: "Medicine",
    cohort: "Class of 2027",
    department: "",
    status: "active",
    source: "sis",
    lastSyncedOn: "2026-07-27",
  },
  {
    id: "per-02",
    personCode: "PER-10429",
    name: "Ben Castellanos",
    email: "bcastellanos@jhu.edu",
    type: "student",
    program: "Medicine",
    cohort: "Class of 2027",
    department: "",
    status: "active",
    source: "sis",
    lastSyncedOn: "2026-07-27",
  },
  {
    id: "per-03",
    personCode: "PER-10431",
    name: "Priya Raghunathan",
    email: "praghunathan@jhu.edu",
    type: "student",
    program: "Nursing",
    cohort: "Class of 2026",
    department: "",
    status: "active",
    source: "sis",
    lastSyncedOn: "2026-07-27",
  },
  {
    id: "per-04",
    personCode: "PER-10437",
    name: "Theo Lindqvist",
    email: "tlindqvist@jhu.edu",
    type: "student",
    program: "Nursing",
    cohort: "Class of 2026",
    department: "",
    status: "invited",
    source: "import",
    lastSyncedOn: "2026-07-21",
  },
  {
    id: "per-05",
    personCode: "PER-10442",
    name: "Rosalind Achebe",
    email: "rachebe@jhu.edu",
    type: "student",
    program: "Public Health",
    cohort: "Class of 2028",
    department: "",
    status: "active",
    source: "sis",
    lastSyncedOn: "2026-07-27",
  },
  {
    id: "per-06",
    personCode: "PER-10444",
    name: "Julian Sandoval",
    email: "jsandoval@jhu.edu",
    type: "student",
    program: "Public Health",
    cohort: "Class of 2028",
    department: "",
    status: "active",
    source: "sis",
    lastSyncedOn: "2026-07-27",
  },
  {
    id: "per-07",
    personCode: "PER-10451",
    name: "Nadia Fournier",
    email: "nfournier@jhu.edu",
    type: "student",
    program: "Medicine",
    cohort: "Class of 2026",
    department: "",
    status: "inactive",
    source: "sis",
    lastSyncedOn: "2026-06-30",
  },
  {
    id: "per-08",
    personCode: "PER-20114",
    name: "Dr. Marion Whitlock",
    email: "mwhitlock@jhu.edu",
    type: "faculty",
    program: "Medicine",
    cohort: "",
    department: "Internal Medicine",
    status: "active",
    source: "hr",
    lastSyncedOn: "2026-07-26",
  },
  {
    id: "per-09",
    personCode: "PER-20118",
    name: "Dr. Ines Vargas",
    email: "ivargas@jhu.edu",
    type: "faculty",
    program: "Medicine",
    cohort: "",
    department: "Pediatrics",
    status: "active",
    source: "hr",
    lastSyncedOn: "2026-07-26",
  },
  {
    id: "per-10",
    personCode: "PER-20125",
    name: "Dr. Samuel Boateng",
    email: "sboateng@jhu.edu",
    type: "faculty",
    program: "Nursing",
    cohort: "",
    department: "Acute Care",
    status: "active",
    source: "hr",
    lastSyncedOn: "2026-07-26",
  },
  {
    id: "per-11",
    personCode: "PER-20131",
    name: "Dr. Helena Brandt",
    email: "hbrandt@jhu.edu",
    type: "faculty",
    program: "Public Health",
    cohort: "",
    department: "Epidemiology",
    status: "active",
    source: "hr",
    lastSyncedOn: "2026-07-26",
  },
  {
    id: "per-12",
    personCode: "PER-20139",
    name: "Dr. Owen Mbeki",
    email: "ombeki@jhu.edu",
    type: "faculty",
    program: "Nursing",
    cohort: "",
    department: "Community Health",
    status: "invited",
    source: "manual",
    lastSyncedOn: "2026-07-24",
  },
  {
    id: "per-13",
    personCode: "PER-30206",
    name: "Grace Yamamoto",
    email: "gyamamoto@jhu.edu",
    type: "staff",
    program: "Medicine",
    cohort: "",
    department: "Clinical Education Office",
    status: "active",
    source: "hr",
    lastSyncedOn: "2026-07-26",
  },
  {
    id: "per-14",
    personCode: "PER-30211",
    name: "Declan Moore",
    email: "dmoore@jhu.edu",
    type: "staff",
    program: "Nursing",
    cohort: "",
    department: "Student Services",
    status: "active",
    source: "hr",
    lastSyncedOn: "2026-07-26",
  },
  {
    id: "per-15",
    personCode: "PER-30217",
    name: "Sofia Marchetti",
    email: "smarchetti@jhu.edu",
    type: "staff",
    program: "Public Health",
    cohort: "",
    department: "Registrar",
    status: "active",
    source: "hr",
    lastSyncedOn: "2026-07-26",
  },
  {
    id: "per-16",
    personCode: "PER-30224",
    name: "Elias Thornbury",
    email: "ethornbury@jhu.edu",
    type: "staff",
    program: "Medicine",
    cohort: "",
    department: "Compliance Office",
    status: "inactive",
    source: "hr",
    lastSyncedOn: "2026-05-18",
  },
]

/* ── Courses (school > program) ───────────────────────────────────────────── */

export type AdminCourseDelivery = "In person" | "Hybrid" | "Online"

export interface AdminCourse extends Record<string, unknown> {
  id: string
  courseCode: string
  title: string
  program: string
  credits: number
  delivery: AdminCourseDelivery
  /** Faculty member of record. Matches a row in {@link ADMIN_PEOPLE}. */
  owner: string
  ownerEmail: string
  /** Students currently enrolled, as reported by the SIS feed. */
  enrolled: number
  status: AdminRecordStatus
  source: AdminSource
  lastSyncedOn: string
}

export const ADMIN_COURSES: AdminCourse[] = [
  {
    id: "crs-01",
    courseCode: "MED 6120",
    title: "Clinical Skills and Reasoning",
    program: "Medicine",
    credits: 4,
    delivery: "In person",
    owner: "Dr. Marion Whitlock",
    ownerEmail: "mwhitlock@jhu.edu",
    enrolled: 96,
    status: "active",
    source: "sis",
    lastSyncedOn: "2026-07-27",
  },
  {
    id: "crs-02",
    courseCode: "MED 6210",
    title: "Pediatric Clerkship",
    program: "Medicine",
    credits: 6,
    delivery: "In person",
    owner: "Dr. Ines Vargas",
    ownerEmail: "ivargas@jhu.edu",
    enrolled: 48,
    status: "active",
    source: "sis",
    lastSyncedOn: "2026-07-27",
  },
  {
    id: "crs-03",
    courseCode: "MED 6305",
    title: "Evidence Based Practice",
    program: "Medicine",
    credits: 3,
    delivery: "Hybrid",
    owner: "Dr. Marion Whitlock",
    ownerEmail: "mwhitlock@jhu.edu",
    enrolled: 96,
    status: "active",
    source: "sis",
    lastSyncedOn: "2026-07-27",
  },
  {
    id: "crs-04",
    courseCode: "NUR 5110",
    title: "Acute Care Practicum",
    program: "Nursing",
    credits: 5,
    delivery: "In person",
    owner: "Dr. Samuel Boateng",
    ownerEmail: "sboateng@jhu.edu",
    enrolled: 64,
    status: "active",
    source: "sis",
    lastSyncedOn: "2026-07-27",
  },
  {
    id: "crs-05",
    courseCode: "NUR 5220",
    title: "Community Health Rotation",
    program: "Nursing",
    credits: 4,
    delivery: "In person",
    owner: "Dr. Owen Mbeki",
    ownerEmail: "ombeki@jhu.edu",
    enrolled: 58,
    status: "invited",
    source: "import",
    lastSyncedOn: "2026-07-21",
  },
  {
    id: "crs-06",
    courseCode: "NUR 5330",
    title: "Pharmacology for Practice",
    program: "Nursing",
    credits: 3,
    delivery: "Online",
    owner: "Dr. Samuel Boateng",
    ownerEmail: "sboateng@jhu.edu",
    enrolled: 71,
    status: "active",
    source: "sis",
    lastSyncedOn: "2026-07-27",
  },
  {
    id: "crs-07",
    courseCode: "PBH 7010",
    title: "Epidemiologic Methods",
    program: "Public Health",
    credits: 4,
    delivery: "Hybrid",
    owner: "Dr. Helena Brandt",
    ownerEmail: "hbrandt@jhu.edu",
    enrolled: 112,
    status: "active",
    source: "sis",
    lastSyncedOn: "2026-07-27",
  },
  {
    id: "crs-08",
    courseCode: "PBH 7140",
    title: "Field Placement Seminar",
    program: "Public Health",
    credits: 2,
    delivery: "Hybrid",
    owner: "Dr. Helena Brandt",
    ownerEmail: "hbrandt@jhu.edu",
    enrolled: 84,
    status: "active",
    source: "sis",
    lastSyncedOn: "2026-07-27",
  },
  {
    id: "crs-09",
    courseCode: "PBH 7250",
    title: "Global Health Systems",
    program: "Public Health",
    credits: 3,
    delivery: "Online",
    owner: "Dr. Helena Brandt",
    ownerEmail: "hbrandt@jhu.edu",
    enrolled: 46,
    status: "inactive",
    source: "sis",
    lastSyncedOn: "2026-06-02",
  },
  {
    id: "crs-10",
    courseCode: "MED 6410",
    title: "Interprofessional Practice",
    program: "Medicine",
    credits: 2,
    delivery: "Hybrid",
    owner: "Dr. Ines Vargas",
    ownerEmail: "ivargas@jhu.edu",
    enrolled: 96,
    status: "active",
    source: "manual",
    lastSyncedOn: "2026-07-25",
  },
]

/* ── Personnel (brand > site > location) ──────────────────────────────────── */

export interface AdminPersonnel extends Record<string, unknown> {
  id: string
  personCode: string
  name: string
  email: string
  brand: string
  site: string
  role: string
  /** Licence letters. Preceptor eligibility depends on these. */
  credential: string
  status: AdminRecordStatus
  source: AdminSource
  lastSyncedOn: string
}

export const ADMIN_PERSONNEL: AdminPersonnel[] = [
  {
    id: "pnl-01",
    personCode: "SPN-4021",
    name: "Dana Whitfield",
    email: "dana.whitfield@mercyhealth.org",
    brand: "Mercy Health",
    site: "Downtown Campus",
    role: "Site coordinator",
    credential: "RN, MSN",
    status: "active",
    source: "import",
    lastSyncedOn: "2026-07-20",
  },
  {
    id: "pnl-02",
    personCode: "SPN-4034",
    name: "Marcus Ellery",
    email: "m.ellery@northsideregional.org",
    brand: "Northside Regional",
    site: "Main Hospital",
    role: "Site coordinator",
    credential: "PT, DPT",
    status: "active",
    source: "import",
    lastSyncedOn: "2026-07-20",
  },
  {
    id: "pnl-03",
    personCode: "SPN-4048",
    name: "Iris Nakamura",
    email: "i.nakamura@northsideregional.org",
    brand: "Northside Regional",
    site: "Pediatrics",
    role: "Preceptor",
    credential: "MD",
    status: "active",
    source: "import",
    lastSyncedOn: "2026-07-20",
  },
  {
    id: "pnl-04",
    personCode: "SPN-4055",
    name: "Curtis Bellamy",
    email: "c.bellamy@lakeshorerehab.org",
    brand: "Lakeshore Rehabilitation",
    site: "North",
    role: "Preceptor",
    credential: "OTR/L",
    status: "active",
    source: "import",
    lastSyncedOn: "2026-07-20",
  },
  {
    id: "pnl-05",
    personCode: "SPN-4061",
    name: "Yolanda Pierce",
    email: "y.pierce@lakeshorerehab.org",
    brand: "Lakeshore Rehabilitation",
    site: "North",
    role: "Scheduler",
    credential: "",
    status: "invited",
    source: "manual",
    lastSyncedOn: "2026-07-23",
  },
  {
    id: "pnl-06",
    personCode: "SPN-4073",
    name: "Ravi Deshmukh",
    email: "r.deshmukh@stannes.org",
    brand: "St. Anne's",
    site: "Emergency Department",
    role: "Preceptor",
    credential: "MD",
    status: "active",
    source: "import",
    lastSyncedOn: "2026-07-20",
  },
  {
    id: "pnl-07",
    personCode: "SPN-4080",
    name: "Margot Ferreira",
    email: "m.ferreira@stannes.org",
    brand: "St. Anne's",
    site: "Emergency Department",
    role: "Site coordinator",
    credential: "RN",
    status: "active",
    source: "import",
    lastSyncedOn: "2026-07-20",
  },
  {
    id: "pnl-08",
    personCode: "SPN-4092",
    name: "Hugo Vance",
    email: "h.vance@mercyhealth.org",
    brand: "Mercy Health",
    site: "Westside Clinic",
    role: "Preceptor",
    credential: "PT",
    status: "inactive",
    source: "import",
    lastSyncedOn: "2026-04-14",
  },
]

/* ── Where each record is used ────────────────────────────────────────────── */

/**
 * One product's claim on a record.
 *
 * The console earns its place on this type. Before it existed, nothing in the
 * app could answer "if I deactivate this person, what breaks?" because each
 * product held its own copy of the roster and none of them knew about the
 * others.
 */
export interface AdminRecordUsage {
  /** Product label as it appears in the switcher. */
  productLabel: string
  /** The surface inside that product holding the reference. */
  surface: string
  /** What the reference is, in the product's own words. */
  detail: string
  /** Deep link into the owning product. Crossing here is a product switch. */
  href: string
  icon: string
}

/**
 * Usage is derived rather than hand-listed per record so the panel cannot drift
 * from the row it describes: change a person's program or status here and the
 * references follow. The rules encode which products genuinely read which
 * fields, which is the part a reviewer should check.
 */
export function adminPersonUsage(person: AdminPerson): AdminRecordUsage[] {
  if (person.status === "inactive") return []

  if (person.type === "student") {
    return [
      {
        productLabel: "Compliance",
        surface: "Clearance items",
        detail: `Tracked against the ${person.program} baseline`,
        href: "/compliance/dashboard",
        icon: "fa-shield-check",
      },
      {
        productLabel: "Clinical Education",
        surface: "Placements",
        detail: `${person.cohort} rotation lottery`,
        href: "/prism/placements",
        icon: "fa-user-plus",
      },
      {
        productLabel: "Student & Program Success",
        surface: "Competency tracking",
        detail: "Milestone progress and risk alerts",
        href: "/student-success/dashboard",
        icon: "fa-chart-line-up",
      },
    ]
  }

  if (person.type === "faculty") {
    const owned = ADMIN_COURSES.filter(course => course.ownerEmail === person.email)
    return [
      {
        productLabel: "Curriculum Mapping",
        surface: "Courses",
        detail:
          owned.length === 1
            ? `Faculty of record for ${owned[0].courseCode}`
            : `Faculty of record for ${owned.length} courses`,
        href: "/curriculum-mapping/dashboard",
        icon: "fa-sitemap",
      },
      {
        productLabel: "Clinical Education",
        surface: "Learning activities",
        detail: `${person.department} evaluations`,
        href: "/prism/learning-activities",
        icon: "fa-clipboard-list",
      },
      {
        productLabel: "Surveys & Course Evaluations",
        surface: "Evaluation recipients",
        detail: "End of term course evaluations",
        href: "/surveys/dashboard",
        icon: "fa-square-poll-vertical",
      },
    ]
  }

  return [
    {
      productLabel: "Clinical Education",
      surface: "Process my Requests",
      detail: `${person.department} request queue`,
      href: "/prism/process-my-requests",
      icon: "fa-file-magnifying-glass",
    },
    {
      productLabel: "Accreditation",
      surface: "Evidence contributors",
      detail: "Named on self study evidence",
      href: "/accreditation/dashboard",
      icon: "fa-award",
    },
  ]
}

export function adminCourseUsage(course: AdminCourse): AdminRecordUsage[] {
  if (course.status === "inactive") return []
  return [
    {
      productLabel: "Curriculum Mapping",
      surface: "Standard coverage",
      detail: `${course.credits} credits mapped to program competencies`,
      href: "/curriculum-mapping/dashboard",
      icon: "fa-sitemap",
    },
    {
      productLabel: "Clinical Education",
      surface: "Learning activities",
      detail: `${course.enrolled} students in the current offering`,
      href: "/prism/learning-activities",
      icon: "fa-clipboard-list",
    },
    {
      productLabel: "Surveys & Course Evaluations",
      surface: "Course evaluation",
      detail: "Scheduled for end of term",
      href: "/surveys/dashboard",
      icon: "fa-square-poll-vertical",
    },
  ]
}

export function adminPersonnelUsage(person: AdminPersonnel): AdminRecordUsage[] {
  if (person.status === "inactive") return []
  const usage: AdminRecordUsage[] = [
    {
      productLabel: "Exxat One",
      surface: "Locations",
      detail: `${person.brand}, ${person.site}`,
      href: "/one-sites/locations",
      icon: "fa-location-dot",
    },
  ]
  if (person.role === "Site coordinator") {
    usage.push({
      productLabel: "Exxat One",
      surface: "Slot requests",
      detail: "Receives and answers school requests",
      href: "/one-sites/slot-requests",
      icon: "fa-inbox",
    })
  }
  if (person.role === "Preceptor") {
    usage.push({
      productLabel: "Clinical Education",
      surface: "Placements",
      detail: "Supervises students on rotation",
      href: "/prism/placements",
      icon: "fa-user-plus",
    })
  }
  return usage
}

/* ── Setup health ─────────────────────────────────────────────────────────── */

/** One foundational object, as the Overview page reads it. */
export interface AdminObjectSummary {
  id: string
  label: string
  icon: string
  /** Scope hierarchy this object hangs off. */
  scope: string
  total: number
  active: number
  /** Records waiting on a person, which is the only actionable number here. */
  needsAttention: number
  needsAttentionLabel: string
  source: string
  lastUpdatedOn: string
  href: string
}

function countBy<T extends { status: AdminRecordStatus }>(
  rows: T[],
  status: AdminRecordStatus,
): number {
  return rows.filter(row => row.status === status).length
}

function mostRecent(dates: string[]): string {
  return dates.toSorted().at(-1) ?? ""
}

export function adminObjectSummaries(): AdminObjectSummary[] {
  return [
    {
      id: "people",
      label: "People",
      icon: "fa-users",
      scope: "School > Program",
      total: ADMIN_PEOPLE.length,
      active: countBy(ADMIN_PEOPLE, "active"),
      needsAttention: countBy(ADMIN_PEOPLE, "invited"),
      needsAttentionLabel: "invited, not yet signed in",
      source: "SIS and HR feeds",
      lastUpdatedOn: mostRecent(ADMIN_PEOPLE.map(p => p.lastSyncedOn)),
      href: "/people/students",
    },
    {
      id: "courses",
      label: "Courses",
      icon: "fa-books",
      scope: "School > Program",
      total: ADMIN_COURSES.length,
      active: countBy(ADMIN_COURSES, "active"),
      needsAttention: countBy(ADMIN_COURSES, "invited"),
      needsAttentionLabel: "imported, awaiting review",
      source: "SIS feed",
      lastUpdatedOn: mostRecent(ADMIN_COURSES.map(c => c.lastSyncedOn)),
      href: "/courses",
    },
    {
      id: "personnel",
      label: "Personnel",
      icon: "fa-user-nurse",
      scope: "Brand > Site > Location",
      total: ADMIN_PERSONNEL.length,
      active: countBy(ADMIN_PERSONNEL, "active"),
      needsAttention: countBy(ADMIN_PERSONNEL, "invited"),
      needsAttentionLabel: "invited, not yet signed in",
      source: "Partner file imports",
      lastUpdatedOn: mostRecent(ADMIN_PERSONNEL.map(p => p.lastSyncedOn)),
      href: "/personnel",
    },
  ]
}

/** A landing of records from one feed or file. */
export interface AdminImportEvent {
  id: string
  object: string
  source: string
  landedOn: string
  added: number
  updated: number
  /** Rows the feed could not place. These are what a super admin comes here for. */
  skipped: number
  actor: string
}

export const ADMIN_IMPORT_HISTORY: AdminImportEvent[] = [
  {
    id: "imp-01",
    object: "People",
    source: "SIS feed",
    landedOn: "2026-07-27",
    added: 0,
    updated: 214,
    skipped: 0,
    actor: "Nightly sync",
  },
  {
    id: "imp-02",
    object: "Courses",
    source: "SIS feed",
    landedOn: "2026-07-27",
    added: 0,
    updated: 38,
    skipped: 0,
    actor: "Nightly sync",
  },
  {
    id: "imp-03",
    object: "People",
    source: "HR feed",
    landedOn: "2026-07-26",
    added: 3,
    updated: 41,
    skipped: 2,
    actor: "Nightly sync",
  },
  {
    id: "imp-04",
    object: "Personnel",
    source: "Partner roster.csv",
    landedOn: "2026-07-20",
    added: 8,
    updated: 0,
    skipped: 1,
    actor: "Alex Morgan",
  },
]

/* ── KPI bands ────────────────────────────────────────────────────────────── */

export function adminPeopleKpi(rows: AdminPerson[]): MetricItem[] {
  const students = rows.filter(r => r.type === "student").length
  const faculty = rows.filter(r => r.type === "faculty").length
  const staff = rows.filter(r => r.type === "staff").length
  const invited = countBy(rows, "invited")

  return [
    {
      id: "people",
      label: "People",
      value: rows.length,
      delta: "",
      trend: "neutral",
      metricVariant: "hero",
      description: "Across every program",
    },
    {
      id: "students",
      label: "Students",
      value: students,
      delta: "",
      trend: "neutral",
    },
    {
      id: "faculty-staff",
      label: "Faculty and staff",
      value: faculty + staff,
      delta: "",
      trend: "neutral",
    },
    {
      id: "invited",
      label: "Invited",
      value: invited,
      delta: invited > 0 ? `+${invited}` : "",
      trend: invited > 0 ? "up" : "neutral",
      trendPolarity: "lower_is_better",
      description: "Not yet signed in",
    },
  ]
}

/** KPI band for a single People type hub (Students / Faculty / Staff). */
export function adminPeopleTypeKpi(
  rows: AdminPerson[],
  type: AdminPersonType,
): MetricItem[] {
  const label =
    type === "student" ? "Students" : type === "faculty" ? "Faculty" : "Staff"
  const invited = countBy(rows, "invited")
  const current = countBy(rows, "active")
  const inactive = countBy(rows, "inactive")

  if (type === "student") {
    return [
      {
        id: "students",
        label: "Students",
        value: rows.length,
        delta: "",
        trend: "neutral",
        metricVariant: "hero",
        description: "Across every program",
      },
      {
        id: "current",
        label: "Current",
        value: current,
        delta: "",
        trend: "neutral",
      },
      {
        id: "invited",
        label: "Invited",
        value: invited,
        delta: invited > 0 ? `+${invited}` : "",
        trend: invited > 0 ? "up" : "neutral",
        trendPolarity: "lower_is_better",
        description: "Not yet signed in",
      },
      {
        id: "alumni",
        label: "Alumni",
        value: inactive,
        delta: "",
        trend: "neutral",
      },
    ]
  }

  return [
    {
      id: type,
      label,
      value: rows.length,
      delta: "",
      trend: "neutral",
      metricVariant: "hero",
      description: "Across every program",
    },
    {
      id: "active",
      label: "Active",
      value: current,
      delta: "",
      trend: "neutral",
    },
    {
      id: "invited",
      label: "Invited",
      value: invited,
      delta: invited > 0 ? `+${invited}` : "",
      trend: invited > 0 ? "up" : "neutral",
      trendPolarity: "lower_is_better",
      description: "Not yet signed in",
    },
    {
      id: "inactive",
      label: "Inactive",
      value: inactive,
      delta: "",
      trend: "neutral",
      trendPolarity: "lower_is_better",
    },
  ]
}

export function adminCoursesKpi(rows: AdminCourse[]): MetricItem[] {
  const enrolled = rows.reduce((sum, r) => sum + r.enrolled, 0)
  const unowned = rows.filter(r => !r.owner).length

  return [
    {
      id: "courses",
      label: "Courses",
      value: rows.length,
      delta: "",
      trend: "neutral",
      metricVariant: "hero",
      description: "Across every program",
    },
    {
      id: "active",
      label: "Active",
      value: countBy(rows, "active"),
      delta: "",
      trend: "neutral",
    },
    {
      id: "enrolled",
      label: "Enrolments",
      value: enrolled,
      delta: "",
      trend: "neutral",
      description: "Current term",
    },
    {
      id: "unowned",
      label: "No faculty of record",
      value: unowned,
      delta: "",
      trend: "neutral",
      trendPolarity: "lower_is_better",
    },
  ]
}

export function adminPersonnelKpi(rows: AdminPersonnel[]): MetricItem[] {
  const brands = new Set(rows.map(r => r.brand)).size
  const preceptors = rows.filter(r => r.role === "Preceptor").length
  const invited = countBy(rows, "invited")

  return [
    {
      id: "personnel",
      label: "Personnel",
      value: rows.length,
      delta: "",
      trend: "neutral",
      metricVariant: "hero",
      description: "Across every partner brand",
    },
    {
      id: "brands",
      label: "Brands",
      value: brands,
      delta: "",
      trend: "neutral",
    },
    {
      id: "preceptors",
      label: "Preceptors",
      value: preceptors,
      delta: "",
      trend: "neutral",
    },
    {
      id: "invited",
      label: "Invited",
      value: invited,
      delta: invited > 0 ? `+${invited}` : "",
      trend: invited > 0 ? "up" : "neutral",
      trendPolarity: "lower_is_better",
      description: "Not yet signed in",
    },
  ]
}
