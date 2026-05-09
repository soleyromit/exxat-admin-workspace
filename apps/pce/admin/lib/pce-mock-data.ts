export type SurveyStatus = 'draft' | 'active' | 'collecting' | 'pending_review' | 'released' | 'closed'
export type TemplateSection = 'course_content' | 'faculty_performance' | 'course_director'
export type UserRole = 'admin' | 'faculty'

export interface PceTemplate {
  id: string
  name: string
  sections: TemplateSection[]
  status: 'active' | 'draft'
  questionCount: number
  usedBySurveyCount: number
  lastModified: string
  createdBy: string
}

export interface PceInstructor {
  id: string
  name: string
  initials: string
  role: 'primary' | 'guest'
}

export interface PceSurvey {
  id: string
  courseCode: string
  courseName: string
  term: string
  /** Cohort = graduating class (e.g., "Class of 2027"). Per Aarti 2026-05-08 16:09 D3, the atomic unit for evaluation is course × term × cohort × faculty. */
  cohort?: string
  /** Per UC-14 + workspace ADR-002: didactic | clinical (optional, extensible). Used for clinical/didactic split filter on Cohort view (C5). */
  courseType?: 'didactic' | 'clinical'
  /** Prior offerings of the SAME course in earlier terms — drives the trend sparkline (C7). Oldest first; current is excluded (it's the survey itself). */
  priorOfferings?: PriorOffering[]
  templateId: string
  status: SurveyStatus
  instructors: PceInstructor[]
  responseRate: number
  responseCount: number
  enrollmentCount: number
  deadline: string
  createdAt: string
  releasedAt?: string
  closedAt?: string
}

export interface PriorOffering {
  term: string
  cohort?: string
  /** Course content avg, 1–5 scale. */
  courseAvg: number
  /** Faculty performance avg, 1–5 scale. */
  facultyAvg: number
}

export interface SectionScore {
  section: TemplateSection
  avg: number
  count: number
}

export interface ResponseComment {
  section: TemplateSection
  text: string
  sentiment: 'positive' | 'neutral' | 'concern'
}

export interface PceResponse {
  surveyId: string
  sectionScores: SectionScore[]
  comments: ResponseComment[]
}

export interface PceUser {
  id: string
  name: string
  email: string
  initials: string
  role: UserRole
}

export const MOCK_CURRENT_USER: PceUser = {
  id: 'u1',
  name: 'Dr. Sarah Thompson',
  email: 'thompson@university.edu',
  initials: 'ST',
  role: 'admin',
}

export const MOCK_TEMPLATES: PceTemplate[] = [
  {
    id: 't1',
    name: 'Standard PCE',
    sections: ['course_content', 'faculty_performance', 'course_director'],
    status: 'active',
    questionCount: 24,
    usedBySurveyCount: 12,
    lastModified: 'Apr 18, 2026',
    createdBy: 'Dr. Thompson',
  },
  {
    id: 't2',
    name: 'Short Form PCE',
    sections: ['course_content', 'faculty_performance'],
    status: 'active',
    questionCount: 16,
    usedBySurveyCount: 4,
    lastModified: 'Mar 02, 2026',
    createdBy: 'Dr. Thompson',
  },
  {
    id: 't3',
    name: 'Faculty-Focused Evaluation',
    sections: ['course_content', 'faculty_performance'],
    status: 'draft',
    questionCount: 8,
    usedBySurveyCount: 0,
    lastModified: 'Apr 22, 2026',
    createdBy: 'Dr. Thompson',
  },
]

const INSTRUCTORS: Record<string, PceInstructor> = {
  patel:    { id: 'f1', name: 'Dr. Anita Patel',    initials: 'AP', role: 'primary' },
  chen:     { id: 'f2', name: 'Dr. Kevin Chen',     initials: 'KC', role: 'guest'   },
  williams: { id: 'f3', name: 'Dr. Maria Williams', initials: 'MW', role: 'primary' },
  kim:      { id: 'f4', name: 'Dr. James Kim',      initials: 'JK', role: 'primary' },
}

export const MOCK_SURVEYS: PceSurvey[] = [
  {
    id: 's1',
    courseCode: 'BIO 201',
    courseName: 'Cellular Biology',
    term: 'Spring 2026',
    cohort: 'Class of 2027',
    courseType: 'didactic',
    priorOfferings: [
      { term: 'Spring 2024', courseAvg: 4.0, facultyAvg: 4.2 },
      { term: 'Spring 2025', courseAvg: 4.1, facultyAvg: 4.2 },
    ],
    templateId: 't1',
    status: 'pending_review',
    instructors: [INSTRUCTORS.patel, { ...INSTRUCTORS.chen, role: 'guest' }],
    responseRate: 68,
    responseCount: 34,
    enrollmentCount: 50,
    deadline: 'Apr 30, 2026',
    createdAt: 'Jan 15, 2026',
  },
  {
    id: 's2',
    courseCode: 'NURS 310',
    courseName: 'Advanced Patient Care',
    term: 'Spring 2026',
    cohort: 'Class of 2026',
    courseType: 'clinical',
    priorOfferings: [
      { term: 'Spring 2024', courseAvg: 3.6, facultyAvg: 3.8 },
      { term: 'Spring 2025', courseAvg: 3.9, facultyAvg: 4.0 },
    ],
    templateId: 't1',
    status: 'collecting',
    instructors: [INSTRUCTORS.williams, { ...INSTRUCTORS.chen, role: 'guest' }],
    responseRate: 42,
    responseCount: 21,
    enrollmentCount: 50,
    deadline: 'May 05, 2026',
    createdAt: 'Jan 15, 2026',
  },
  {
    id: 's3',
    courseCode: 'MED 410',
    courseName: 'Clinical Pharmacology',
    term: 'Spring 2026',
    cohort: 'Class of 2026',
    courseType: 'clinical',
    priorOfferings: [
      { term: 'Spring 2023', courseAvg: 3.9, facultyAvg: 4.0 },
      { term: 'Spring 2024', courseAvg: 4.1, facultyAvg: 4.4 },
      { term: 'Spring 2025', courseAvg: 4.0, facultyAvg: 4.5 },
    ],
    templateId: 't2',
    status: 'released',
    instructors: [INSTRUCTORS.williams],
    responseRate: 91,
    responseCount: 46,
    enrollmentCount: 50,
    deadline: 'Apr 15, 2026',
    createdAt: 'Jan 15, 2026',
    releasedAt: 'Apr 17, 2026',
  },
  {
    id: 's4',
    courseCode: 'PHYS 101',
    courseName: 'Medical Physics',
    term: 'Fall 2025',
    cohort: 'Class of 2028',
    courseType: 'didactic',
    priorOfferings: [
      { term: 'Fall 2022', courseAvg: 4.4, facultyAvg: 4.5 },
      { term: 'Fall 2023', courseAvg: 4.2, facultyAvg: 4.3 },
      { term: 'Fall 2024', courseAvg: 4.0, facultyAvg: 4.0 },
    ],
    templateId: 't2',
    status: 'closed',
    instructors: [INSTRUCTORS.kim],
    responseRate: 88,
    responseCount: 44,
    enrollmentCount: 50,
    deadline: 'Dec 10, 2025',
    createdAt: 'Aug 20, 2025',
    releasedAt: 'Dec 14, 2025',
    closedAt: 'Jan 10, 2026',
  },
  {
    id: 's5',
    courseCode: 'NURS 210',
    courseName: 'Fundamentals of Nursing',
    term: 'Spring 2026',
    cohort: 'Class of 2028',
    courseType: 'didactic',
    priorOfferings: [
      { term: 'Spring 2024', courseAvg: 4.0, facultyAvg: 4.1 },
      { term: 'Spring 2025', courseAvg: 4.0, facultyAvg: 4.0 },
    ],
    templateId: 't1',
    status: 'pending_review',
    instructors: [INSTRUCTORS.kim],
    responseRate: 73,
    responseCount: 22,
    enrollmentCount: 30,
    deadline: 'Apr 22, 2026',
    createdAt: 'Jan 15, 2026',
  },
  {
    id: 's6',
    courseCode: 'MED 101',
    courseName: 'Introduction to Medicine',
    term: 'Spring 2026',
    cohort: 'Class of 2028',
    courseType: 'didactic',
    priorOfferings: [
      { term: 'Spring 2025', courseAvg: 3.8, facultyAvg: 4.0 },
    ],
    templateId: 't1',
    status: 'pending_review',
    instructors: [INSTRUCTORS.kim],
    responseRate: 80,
    responseCount: 8,
    enrollmentCount: 10,
    deadline: 'Apr 22, 2026',
    createdAt: 'Jan 15, 2026',
  },
  {
    id: 's7',
    courseCode: 'BIO 301',
    courseName: 'Molecular Genetics',
    term: 'Spring 2026',
    cohort: 'Class of 2027',
    courseType: 'didactic',
    /* No prior offerings — first time this course is offered. */
    templateId: 't2',
    status: 'draft',
    instructors: [INSTRUCTORS.patel],
    responseRate: 0,
    responseCount: 0,
    enrollmentCount: 35,
    deadline: 'May 30, 2026',
    createdAt: 'Apr 20, 2026',
  },
]

export const MOCK_RESPONSES: PceResponse[] = [
  {
    surveyId: 's1',
    sectionScores: [
      { section: 'course_content', avg: 4.1, count: 34 },
      { section: 'faculty_performance', avg: 4.3, count: 34 },
    ],
    comments: [
      { section: 'faculty_performance', text: 'Very organized and responsive to questions.', sentiment: 'positive' },
      { section: 'faculty_performance', text: 'Could improve pacing in later sessions.', sentiment: 'concern' },
      { section: 'course_content', text: 'Course materials were well-structured and easy to follow.', sentiment: 'positive' },
      { section: 'course_content', text: 'Some lab sessions felt rushed.', sentiment: 'concern' },
    ],
  },
  {
    surveyId: 's3',
    sectionScores: [
      { section: 'course_content', avg: 3.8, count: 46 },
      { section: 'faculty_performance', avg: 4.6, count: 46 },
    ],
    comments: [
      { section: 'faculty_performance', text: 'Dr. Williams is an excellent communicator.', sentiment: 'positive' },
      { section: 'faculty_performance', text: 'Office hours were very helpful.', sentiment: 'positive' },
      { section: 'faculty_performance', text: 'Pace of lectures was sometimes too fast to follow.', sentiment: 'neutral' },
      { section: 'course_content', text: 'Some topics could be covered in more depth.', sentiment: 'neutral' },
      { section: 'course_content', text: 'More worked examples in assessments would help.', sentiment: 'concern' },
    ],
  },
  {
    surveyId: 's4',
    sectionScores: [
      { section: 'course_content', avg: 4.5, count: 44 },
      { section: 'faculty_performance', avg: 4.2, count: 44 },
    ],
    comments: [
      { section: 'course_content', text: 'Great course structure overall.', sentiment: 'positive' },
      { section: 'faculty_performance', text: 'Lectures were engaging and informative.', sentiment: 'positive' },
    ],
  },
]

export const MOCK_TERMS = ['Spring 2026', 'Fall 2025', 'Spring 2025']

/** Cohorts (graduating class) — per Aarti 2026-05-08 16:09 D3. */
export const MOCK_COHORTS = ['Class of 2026', 'Class of 2027', 'Class of 2028']

// ============================================================================
// Program-level master entities (workspace ADR-001)
// ============================================================================
// Per Aarti 2026-05-08: 11 master entities live ONCE at program level. UC-19
// admin-master-list-screens currently ships 2 of 11 — master courses + terms.

export interface MasterCourse {
  id: string
  code: string
  name: string
  department: string
  status: 'active' | 'inactive'
  /** Last edited; YYYY-MM-DD */
  lastEdited: string
  /** Editor display name */
  editedBy: string
}

export interface ProgramTerm {
  id: string
  name: string
  academicYear: string
  /** YYYY-MM-DD */
  startDate: string
  endDate: string
  status: 'active' | 'archived'
}

export const MOCK_MASTER_COURSES: MasterCourse[] = [
  { id: 'mc1', code: 'BIO 201',   name: 'Cellular Biology',         department: 'Biological Sciences', status: 'active',   lastEdited: '2026-04-12', editedBy: 'Dr. Thompson' },
  { id: 'mc2', code: 'NURS 310',  name: 'Advanced Patient Care',    department: 'Nursing',             status: 'active',   lastEdited: '2026-03-22', editedBy: 'Dr. Thompson' },
  { id: 'mc3', code: 'MED 410',   name: 'Clinical Pharmacology',    department: 'Medicine',            status: 'active',   lastEdited: '2026-02-08', editedBy: 'Dr. Thompson' },
  { id: 'mc4', code: 'PHYS 101',  name: 'Medical Physics',          department: 'Foundations',         status: 'active',   lastEdited: '2025-11-30', editedBy: 'Dr. Thompson' },
  { id: 'mc5', code: 'NURS 210',  name: 'Fundamentals of Nursing',  department: 'Nursing',             status: 'active',   lastEdited: '2026-01-15', editedBy: 'Dr. Thompson' },
  { id: 'mc6', code: 'MED 101',   name: 'Introduction to Medicine', department: 'Medicine',            status: 'active',   lastEdited: '2026-01-15', editedBy: 'Dr. Thompson' },
  { id: 'mc7', code: 'BIO 301',   name: 'Molecular Genetics',       department: 'Biological Sciences', status: 'active',   lastEdited: '2026-04-20', editedBy: 'Dr. Thompson' },
  { id: 'mc8', code: 'PHARM 210', name: 'Pharmacotherapy I',        department: 'Pharmacy',            status: 'inactive', lastEdited: '2024-08-01', editedBy: 'Dr. Thompson' },
]

export const MOCK_PROGRAM_TERMS: ProgramTerm[] = [
  { id: 'pt1', name: 'Spring 2026', academicYear: '2025–2026', startDate: '2026-01-12', endDate: '2026-05-08', status: 'active'   },
  { id: 'pt2', name: 'Fall 2025',   academicYear: '2025–2026', startDate: '2025-08-25', endDate: '2025-12-12', status: 'archived' },
  { id: 'pt3', name: 'Spring 2025', academicYear: '2024–2025', startDate: '2025-01-13', endDate: '2025-05-09', status: 'archived' },
  { id: 'pt4', name: 'Fall 2024',   academicYear: '2024–2025', startDate: '2024-08-26', endDate: '2024-12-13', status: 'archived' },
  { id: 'pt5', name: 'Fall 2026',   academicYear: '2026–2027', startDate: '2026-08-24', endDate: '2026-12-11', status: 'active'   },
]

/** LMS-on/off school config. Per workspace ADR-002, default is LMS-on; in this prototype we mock the off state so manual CRUD demos work. Toggle in future via Settings. */
export const MOCK_LMS_ENABLED = false

// ============================================================================
// Course Offerings — the atomic 4-tuple unit (Aarti 2026-05-08 16:09 D3)
// ============================================================================

export interface CourseOffering {
  id: string
  /** FK → MasterCourse */
  masterCourseId: string
  /** FK → ProgramTerm */
  termId: string
  /** Graduating class */
  cohort: string
  /** Primary faculty (Course Coordinator). FK → INSTRUCTORS */
  primaryFacultyId: string
  /** Additional collaborators (per Aarti D7). FK → INSTRUCTORS */
  collaboratorIds: string[]
  /** Roster size */
  enrolledCount: number
  status: 'planned' | 'active' | 'completed' | 'archived'
}

// Permissions (entity #6) — role × scope grants
//
// Per Aarti 2026-05-08 16:09 D6 + D7:
//   - 3 view tiers: admin / faculty / student (workspace ADR-004)
//   - 2 faculty sub-roles at course level: Course Coordinator (full CRUD on
//     assigned offerings) + Instructor (limited capabilities, exact set TBD
//     per Vishaka R7)
//   - Collaborator pattern: faculty can be granted read-only or co-edit
//     access on specific course offerings
//
// Phase 1 ships: role assignments + per-faculty collaborator grants.
// Granular per-resource permission editing is a Phase 2 follow-up.
export type RoleKey = 'admin' | 'course-coordinator' | 'instructor' | 'collaborator-readonly' | 'collaborator-edit'

export interface RoleAssignment {
  id: string
  facultyId: string  // FK
  role: RoleKey
  /** Scope: 'global' (all offerings) or specific course offering ID. */
  scope: 'global' | string
  grantedAt: string
  grantedBy: string
}

export const ROLE_LABELS: Record<RoleKey, string> = {
  'admin':                 'Admin',
  'course-coordinator':    'Course Coordinator',
  'instructor':            'Instructor',
  'collaborator-readonly': 'Collaborator (read-only)',
  'collaborator-edit':     'Collaborator (co-edit)',
}

export const ROLE_DESCRIPTIONS: Record<RoleKey, string> = {
  'admin':                 'Full access to all program-level entities + cross-product modules.',
  'course-coordinator':    'Whole-and-soul navigator of an assigned offering — full CRUD on Questions, Assessments, Students, Accommodations [read-only inherited].',
  'instructor':            'Limited access on assigned offerings (exact capabilities TBD with Vishaka — see R7).',
  'collaborator-readonly': 'View-only access on a specific offering or assessment, granted by Course Coordinator with admin permission.',
  'collaborator-edit':     'Co-edit access on a specific offering or assessment, granted by Course Coordinator with admin permission.',
}

export const MOCK_ROLE_ASSIGNMENTS: RoleAssignment[] = [
  // Admin (rare — usually 1-2 per program)
  { id: 'ra1',  facultyId: 'f1', role: 'admin',                 scope: 'global', grantedAt: '2024-08-01', grantedBy: 'System' },
  // Course Coordinators per active offerings
  { id: 'ra2',  facultyId: 'f2', role: 'course-coordinator',    scope: 'co1',    grantedAt: '2025-08-25', grantedBy: 'Dr. Patel (Admin)' },
  { id: 'ra3',  facultyId: 'f3', role: 'course-coordinator',    scope: 'co2',    grantedAt: '2025-08-25', grantedBy: 'Dr. Patel (Admin)' },
  { id: 'ra4',  facultyId: 'f3', role: 'course-coordinator',    scope: 'co3',    grantedAt: '2025-08-25', grantedBy: 'Dr. Patel (Admin)' },
  { id: 'ra5',  facultyId: 'f4', role: 'course-coordinator',    scope: 'co5',    grantedAt: '2025-08-25', grantedBy: 'Dr. Patel (Admin)' },
  { id: 'ra6',  facultyId: 'f4', role: 'course-coordinator',    scope: 'co6',    grantedAt: '2025-08-25', grantedBy: 'Dr. Patel (Admin)' },
  { id: 'ra7',  facultyId: 'f2', role: 'course-coordinator',    scope: 'co7',    grantedAt: '2025-08-25', grantedBy: 'Dr. Patel (Admin)' },
  // Instructors (limited)
  { id: 'ra8',  facultyId: 'f5', role: 'instructor',            scope: 'co1',    grantedAt: '2025-08-25', grantedBy: 'Dr. Chen (CC)' },
  // Collaborators
  { id: 'ra9',  facultyId: 'f1', role: 'collaborator-edit',     scope: 'co1',    grantedAt: '2026-01-15', grantedBy: 'Dr. Chen (CC)' },
  { id: 'ra10', facultyId: 'f1', role: 'collaborator-readonly', scope: 'co2',    grantedAt: '2026-01-15', grantedBy: 'Dr. Williams (CC)' },
]

// Accommodations (entity #10) — workspace ADR-006 shared module
//
// Three tiers per ADR-006:
//   1. Master catalog (program admin-defined; this list)
//   2. Per-student assignments (admin only, with documentation)
//   3. Course-level read-only inherited view (faculty — NOT managed here)
//
// Cross-product: Exam Mgmt + PCE + future products consume the SAME catalog.
// Faculty never CRUD — admin determines per ADR-006.
export interface MasterAccommodation {
  id: string
  /** Short code shown on roster badges (e.g., '+10', 'RDR'). */
  code: string
  /** Full name. */
  name: string
  description: string
  /** Common categories for grouping. */
  category: 'time' | 'environment' | 'assistive-tech' | 'format' | 'breaks' | 'other'
  /** Standard (built-in) vs school-defined custom. */
  isCustom: boolean
  status: 'active' | 'archived'
}

export const MOCK_ACCOMMODATIONS: MasterAccommodation[] = [
  { id: 'ac1', code: '+10', name: '+10% time',                  description: 'Extended testing time, 10% additional',          category: 'time',          isCustom: false, status: 'active' },
  { id: 'ac2', code: '+25', name: '+25% time',                  description: 'Extended testing time, 25% additional',          category: 'time',          isCustom: false, status: 'active' },
  { id: 'ac3', code: '+50', name: '+50% time',                  description: 'Extended testing time, 50% additional',          category: 'time',          isCustom: false, status: 'active' },
  { id: 'ac4', code: '+2x', name: 'Double time',                description: 'Extended testing time, 100% additional',         category: 'time',          isCustom: false, status: 'active' },
  { id: 'ac5', code: 'RDR', name: 'Reader',                      description: 'Test administered by a reader',                  category: 'assistive-tech', isCustom: false, status: 'active' },
  { id: 'ac6', code: 'SCB', name: 'Scribe',                      description: 'Student dictates answers; scribe records',       category: 'assistive-tech', isCustom: false, status: 'active' },
  { id: 'ac7', code: 'SEP', name: 'Separate room',               description: 'Quiet, distraction-free testing environment',    category: 'environment',   isCustom: false, status: 'active' },
  { id: 'ac8', code: 'BRK', name: 'Frequent breaks',             description: 'Stop-the-clock breaks at student discretion',    category: 'breaks',        isCustom: false, status: 'active' },
  { id: 'ac9', code: 'LRG', name: 'Large print',                 description: 'Test materials in larger font size',             category: 'format',        isCustom: false, status: 'active' },
  { id: 'ac10', code: 'BRL', name: 'Braille',                     description: 'Test materials in Braille',                      category: 'format',        isCustom: false, status: 'active' },
  { id: 'ac11', code: 'ASL', name: 'ASL interpreter',             description: 'American Sign Language interpreter present',     category: 'assistive-tech', isCustom: false, status: 'active' },
  { id: 'ac12', code: 'CST', name: 'Custom — service animal',    description: 'Service animal accommodation per school policy', category: 'other',         isCustom: true,  status: 'active' },
]

// Students (entity #4) — typically LMS-synced; large roster
export interface Student {
  id: string
  /** Institution-issued student ID (e.g., '01234567'). */
  studentId: string
  firstName: string
  lastName: string
  email: string
  cohort: string
  enrollmentStatus: 'enrolled' | 'graduated' | 'withdrawn' | 'on-leave'
  /** ISO date when first enrolled. */
  enrolledAt: string
  /** Workspace ADR-006 — accommodations are admin-applied; this is a derived flag for roster display. */
  hasAccommodations?: boolean
}

export const MOCK_STUDENTS: Student[] = [
  { id: 'st1',  studentId: '01234567', firstName: 'Alice',    lastName: 'Chen',     email: 'alice.chen@school.edu',   cohort: 'Class of 2026', enrollmentStatus: 'enrolled',  enrolledAt: '2023-08-25', hasAccommodations: true },
  { id: 'st2',  studentId: '01234568', firstName: 'Bob',      lastName: 'Patel',    email: 'bob.patel@school.edu',    cohort: 'Class of 2026', enrollmentStatus: 'enrolled',  enrolledAt: '2023-08-25' },
  { id: 'st3',  studentId: '01234569', firstName: 'Carlos',   lastName: 'Diaz',     email: 'carlos.diaz@school.edu',  cohort: 'Class of 2026', enrollmentStatus: 'enrolled',  enrolledAt: '2023-08-25', hasAccommodations: true },
  { id: 'st4',  studentId: '01234570', firstName: 'Dana',     lastName: 'Kim',      email: 'dana.kim@school.edu',     cohort: 'Class of 2026', enrollmentStatus: 'enrolled',  enrolledAt: '2023-08-25' },
  { id: 'st5',  studentId: '01234571', firstName: 'Eli',      lastName: 'Rodriguez', email: 'eli.rodriguez@school.edu', cohort: 'Class of 2026', enrollmentStatus: 'on-leave', enrolledAt: '2023-08-25' },
  { id: 'st6',  studentId: '01234572', firstName: 'Faye',     lastName: 'Williams', email: 'faye.williams@school.edu', cohort: 'Class of 2027', enrollmentStatus: 'enrolled',  enrolledAt: '2024-08-26' },
  { id: 'st7',  studentId: '01234573', firstName: 'Gabe',     lastName: 'Nguyen',   email: 'gabe.nguyen@school.edu',  cohort: 'Class of 2027', enrollmentStatus: 'enrolled',  enrolledAt: '2024-08-26', hasAccommodations: true },
  { id: 'st8',  studentId: '01234574', firstName: 'Hana',     lastName: 'Sato',     email: 'hana.sato@school.edu',    cohort: 'Class of 2027', enrollmentStatus: 'enrolled',  enrolledAt: '2024-08-26' },
  { id: 'st9',  studentId: '01234575', firstName: 'Idris',    lastName: 'Khan',     email: 'idris.khan@school.edu',   cohort: 'Class of 2027', enrollmentStatus: 'enrolled',  enrolledAt: '2024-08-26' },
  { id: 'st10', studentId: '01234576', firstName: 'Julia',    lastName: 'Morales',  email: 'julia.morales@school.edu', cohort: 'Class of 2027', enrollmentStatus: 'withdrawn', enrolledAt: '2024-08-26' },
  { id: 'st11', studentId: '01234577', firstName: 'Kenji',    lastName: 'Lee',      email: 'kenji.lee@school.edu',    cohort: 'Class of 2028', enrollmentStatus: 'enrolled',  enrolledAt: '2025-08-25' },
  { id: 'st12', studentId: '01234578', firstName: 'Lila',     lastName: 'Park',     email: 'lila.park@school.edu',    cohort: 'Class of 2028', enrollmentStatus: 'enrolled',  enrolledAt: '2025-08-25', hasAccommodations: true },
  { id: 'st13', studentId: '01234579', firstName: 'Mateo',    lastName: 'Garcia',   email: 'mateo.garcia@school.edu', cohort: 'Class of 2028', enrollmentStatus: 'enrolled',  enrolledAt: '2025-08-25' },
  { id: 'st14', studentId: '01234580', firstName: 'Nadia',    lastName: 'Brown',    email: 'nadia.brown@school.edu',  cohort: 'Class of 2028', enrollmentStatus: 'enrolled',  enrolledAt: '2025-08-25' },
  { id: 'st15', studentId: '01234581', firstName: 'Oliver',   lastName: 'Tran',     email: 'oliver.tran@school.edu',  cohort: 'Class of 2028', enrollmentStatus: 'enrolled',  enrolledAt: '2025-08-25' },
  { id: 'st16', studentId: '01234500', firstName: 'Priya',    lastName: 'Sharma',   email: 'priya.sharma@alumni.school.edu', cohort: 'Class of 2025', enrollmentStatus: 'graduated', enrolledAt: '2022-08-26' },
  { id: 'st17', studentId: '01234501', firstName: 'Quinn',    lastName: 'Olsen',    email: 'quinn.olsen@alumni.school.edu',  cohort: 'Class of 2025', enrollmentStatus: 'graduated', enrolledAt: '2022-08-26' },
]

// Assessment types (entity #11) — small fixed-ish set
export interface AssessmentType {
  id: string
  name: string
  description: string
  /** Phase this type ships in. */
  phase: 1 | 2 | 3
  status: 'active' | 'deferred'
}

export const MOCK_ASSESSMENT_TYPES: AssessmentType[] = [
  { id: 'at1', name: 'Pop quiz',          description: '15-minute, can be turned on/off; in-class delivery',                     phase: 1, status: 'active' },
  { id: 'at2', name: 'Timed exam',        description: 'Standard timed assessment with download capability',                     phase: 1, status: 'active' },
  { id: 'at3', name: 'Take-home',         description: 'Multi-day window; honor-code based',                                      phase: 1, status: 'active' },
  { id: 'at4', name: 'Open-book',         description: 'Reference materials permitted during the assessment',                      phase: 1, status: 'active' },
  { id: 'at5', name: 'Standard proctored', description: 'Faculty-supervised in-person; no lockdown browser',                       phase: 1, status: 'active' },
  { id: 'at6', name: 'Lockdown proctored', description: 'Lockdown browser blocks copy/screenshot/tab-switch (vendor TBD Q4 2026)', phase: 2, status: 'deferred' },
  { id: 'at7', name: 'Remote-monitored',   description: 'Camera + screen capture; vendor-monitored proctoring',                    phase: 3, status: 'deferred' },
]

// Content areas (entity #7), Competencies (#8), Standards (#9) — taxonomy entities
// Same shape per Aarti 2026-05-07 (`fb9e76c2`): Gmail-style nested labels.
export interface TaxonomyEntry {
  id: string
  name: string
  description: string
  parentId?: string
  status: 'active' | 'archived'
}
export type ContentArea = TaxonomyEntry
export type Competency = TaxonomyEntry & {
  /** Optional accreditation source (e.g., 'NCLEX', 'CAPTE 2C'). */
  source?: string
}
export type Standard = TaxonomyEntry & {
  /** Required source — standards always come from an accreditor. */
  source: string
  /** Standard code from the source body (e.g., 'CAPTE 2C-1', 'NCLEX-CN3.1'). */
  code: string
}

export const MOCK_CONTENT_AREAS: ContentArea[] = [
  { id: 'ca1', name: 'Patient Care',           description: 'Direct clinical care delivery',                            status: 'active' },
  { id: 'ca2', name: 'Pharmacology',           description: 'Drug mechanisms, indications, contraindications',          status: 'active' },
  { id: 'ca3', name: 'Anatomy & Physiology',   description: 'Body systems and function',                                 status: 'active' },
  { id: 'ca4', name: 'Communication',          description: 'Patient interaction, charting, interprofessional comms',   status: 'active' },
  { id: 'ca5', name: 'Professionalism',        description: 'Ethics, regulatory compliance, patient advocacy',          status: 'active' },
  { id: 'ca6', name: 'Research Methods',       description: 'Evidence-based practice, statistics',                      status: 'active' },
  { id: 'ca7', name: 'Cellular Biology',       description: 'Subset of Anatomy & Physiology',                           parentId: 'ca3', status: 'active' },
  { id: 'ca8', name: 'Cardiovascular',         description: 'Heart, vasculature, related pathology',                     parentId: 'ca3', status: 'active' },
]

export const MOCK_COMPETENCIES: Competency[] = [
  { id: 'cm1', name: 'Patient-Centered Care',  description: 'Provide care that is respectful of and responsive to individual patient preferences', source: 'IOM',           status: 'active' },
  { id: 'cm2', name: 'Teamwork & Collaboration', description: 'Function effectively within nursing and inter-professional teams',                  source: 'IOM',           status: 'active' },
  { id: 'cm3', name: 'Evidence-Based Practice', description: 'Integrate best research with clinical expertise',                                       source: 'IOM',           status: 'active' },
  { id: 'cm4', name: 'Quality Improvement',     description: 'Use data to monitor outcomes and improve care quality',                                source: 'IOM',           status: 'active' },
  { id: 'cm5', name: 'Safety',                  description: 'Minimize risk of harm to patients and providers',                                       source: 'IOM',           status: 'active' },
  { id: 'cm6', name: 'Informatics',             description: 'Use information and technology to communicate, manage, and support decision-making',  source: 'IOM',           status: 'active' },
  { id: 'cm7', name: 'Pharmacological Therapy', description: 'Apply principles of pharmacology to medication management',                            source: 'NLN',           status: 'active' },
  { id: 'cm8', name: 'Patient Education',       description: 'Provide individualized education to promote health',                                    source: 'NLN', parentId: 'cm1', status: 'active' },
]

export const MOCK_STANDARDS: Standard[] = [
  { id: 'st1', name: 'Patient Care',                    code: 'CAPTE 2C-1',  source: 'CAPTE',  description: 'Provide patient-centered care to people with movement system conditions', status: 'active' },
  { id: 'st2', name: 'Communication',                   code: 'CAPTE 2C-2',  source: 'CAPTE',  description: 'Communicate effectively with patients, caregivers, peers',                  status: 'active' },
  { id: 'st3', name: 'Professional Behaviors',          code: 'CAPTE 2C-3',  source: 'CAPTE',  description: 'Demonstrate professional behaviors and ethical conduct',                    status: 'active' },
  { id: 'st4', name: 'Practice Management',             code: 'CAPTE 2C-5',  source: 'CAPTE',  description: 'Manage workload, time, and clinical resources effectively',                 status: 'active' },
  { id: 'st5', name: 'Health & Wellness',               code: 'NCLEX-HW1',   source: 'NCLEX',  description: 'Promote health and prevent illness',                                        status: 'active' },
  { id: 'st6', name: 'Pharmacological Therapies',       code: 'NCLEX-PT3',   source: 'NCLEX',  description: 'Administer medications safely and monitor outcomes',                        status: 'active' },
  { id: 'st7', name: 'Reduction of Risk Potential',     code: 'NCLEX-RR1',   source: 'NCLEX',  description: 'Reduce likelihood of complications during procedures',                      status: 'active' },
  { id: 'st8', name: 'Pharmacotherapy',                 code: 'ARC-PA-B2.05', source: 'ARC-PA', description: 'Apply pharmacotherapeutic principles in clinical decision-making',          status: 'active' },
]

export const MOCK_COURSE_OFFERINGS: CourseOffering[] = [
  { id: 'co1', masterCourseId: 'mc1', termId: 'pt1', cohort: 'Class of 2027', primaryFacultyId: 'f2', collaboratorIds: ['f1'], enrolledCount: 50, status: 'active' },
  { id: 'co2', masterCourseId: 'mc2', termId: 'pt1', cohort: 'Class of 2026', primaryFacultyId: 'f3', collaboratorIds: ['f1'], enrolledCount: 50, status: 'active' },
  { id: 'co3', masterCourseId: 'mc3', termId: 'pt1', cohort: 'Class of 2026', primaryFacultyId: 'f3', collaboratorIds: [],     enrolledCount: 50, status: 'completed' },
  { id: 'co4', masterCourseId: 'mc4', termId: 'pt2', cohort: 'Class of 2028', primaryFacultyId: 'f4', collaboratorIds: [],     enrolledCount: 50, status: 'archived' },
  { id: 'co5', masterCourseId: 'mc5', termId: 'pt1', cohort: 'Class of 2028', primaryFacultyId: 'f4', collaboratorIds: [],     enrolledCount: 30, status: 'active' },
  { id: 'co6', masterCourseId: 'mc6', termId: 'pt1', cohort: 'Class of 2028', primaryFacultyId: 'f4', collaboratorIds: [],     enrolledCount: 10, status: 'active' },
  { id: 'co7', masterCourseId: 'mc7', termId: 'pt1', cohort: 'Class of 2027', primaryFacultyId: 'f2', collaboratorIds: [],     enrolledCount: 35, status: 'planned' },
  { id: 'co8', masterCourseId: 'mc1', termId: 'pt5', cohort: 'Class of 2028', primaryFacultyId: 'f2', collaboratorIds: ['f1'], enrolledCount: 50, status: 'planned' },
]

export const SECTION_LABELS: Record<TemplateSection, string> = {
  course_content: 'Course Content',
  faculty_performance: 'Faculty Performance',
  course_director: 'Course Director',
}

export const FACULTY_SECTION_LABELS: Record<TemplateSection, string> = {
  course_content: 'About the Course',
  faculty_performance: 'About Your Teaching',
  course_director: 'About the Course Director',
}

export const SECTION_ABBREV: Record<TemplateSection, string> = {
  course_content: 'CC',
  faculty_performance: 'FP',
  course_director: 'CD',
}

export const MOCK_COURSES = [
  { code: 'BIO 201', name: 'Cellular Biology' },
  { code: 'NURS 310', name: 'Advanced Patient Care' },
  { code: 'MED 410', name: 'Clinical Pharmacology' },
  { code: 'PHYS 101', name: 'Medical Physics' },
  { code: 'NURS 210', name: 'Fundamentals of Nursing' },
  { code: 'MED 101', name: 'Introduction to Medicine' },
  { code: 'BIO 301', name: 'Molecular Genetics' },
  { code: 'CHEM 201', name: 'Biochemistry' },
]

export const MOCK_FACULTY: PceInstructor[] = [
  { id: 'f1', name: 'Dr. Anita Patel',    initials: 'AP', role: 'primary' },
  { id: 'f2', name: 'Dr. Kevin Chen',     initials: 'KC', role: 'primary' },
  { id: 'f3', name: 'Dr. Maria Williams', initials: 'MW', role: 'primary' },
  { id: 'f4', name: 'Dr. James Kim',      initials: 'JK', role: 'primary' },
  { id: 'f5', name: 'Dr. Rachel Gomez',   initials: 'RG', role: 'primary' },
  { id: 'f6', name: 'Dr. Omar Hassan',    initials: 'OH', role: 'primary' },
]
