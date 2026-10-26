/**
 * COURSE OFFERING BASE ENTITY — mock data for the Course Offerings module.
 *
 * Follows the same pattern as student-mock-data.ts:
 *   CourseOfferingRow — flat summary for list view
 *   ExtendedCourseOffering — full record for detail view
 *
 * 14 records: 5 active / 5 past / 4 upcoming.
 * Status is computed from date ranges (not a manual flag).
 *
 * Tab order: Overview | Assessments | Students | Faculty | Question Bank | Resources
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FacultyChip {
  name: string
  initials: string
  chipToken: string  // one of var(--chip-1)…var(--chip-4)
}

export interface AssessmentBreakdown {
  draft: number
  review: number
  approved: number
  scheduled: number
  grading: number
  published: number
}

export interface QbAnalytics {
  total: number
  measurePct: number
  competencyPct: number
  untagged: number
  aiFlagged: number
  neverUsed: number
  bloomsDist: Record<string, number>
}

export interface CourseOfferingRow {
  id: string
  courseId: string        // links to mockCourse.id for detail-page navigation
  courseNumber: string   // e.g. 'PHARM-501'
  courseName: string
  academicYear: string   // e.g. '2025–2026'
  term: string           // e.g. 'Fall 2025'
  cohort: string
  startDate: string | null      // ISO date; null = TBD for upcoming offerings
  endDate: string | null        // ISO date; null = TBD for upcoming offerings
  credits: number
  registeredStudents: number
  facultyAssigned: string       // primary faculty name (search/display fallback)
  facultyList: FacultyChip[]    // avatar stack; max 3 shown + "+N"
  status: 'active' | 'past' | 'upcoming'
  attn: boolean                 // true when plan is empty or assessments stuck in draft
  qbHealth: number              // 0–100
  assessmentBreakdown: AssessmentBreakdown
  assessmentsDueSoon: number    // count of assessments due within 7 days
  activeWithNoAssessments: boolean  // active offering with zero scheduled/published assessments
  isPrism: boolean              // true when course has a Canvas/Prism sync
  /** Canvas course_id / LTI context.id — needed for NRPS (roster) and AGS (gradebook) API calls */
  canvasCourseId?: string
  /** SIS Course ID ($Canvas.course.sisSourceId) — auto-populated when Canvas active */
  sisCourseId?: string
}

export interface ExtendedCourseOffering extends CourseOfferingRow {
  hoursPerWeek: number
  courseType: 'Core' | 'Elective'
  department: string
  description?: string
  objectives: string[]
  qbAnalytics: QbAnalytics
  students: Array<{
    id: string
    name: string
    email: string
    studentId: string
    cohort: string
    status: 'enrolled' | 'completed' | 'withdrawn'
  }>
  faculty: Array<{
    id: string
    name: string
    role: 'Course Coordinator' | 'Instructor'
  }>
  assessments: Array<{
    id: string
    title: string
    type: string
    status: string
    date: string
    students: number
    durationMinutes?: number
    gradingScheme?: string
    weightage?: number
  }>
  resources: Array<{
    title: string
    type: 'PDF' | 'Link' | 'Video'
    url?: string
    syncedFromPrism?: boolean
    fileSize?: string
    updatedDate?: string
  }>
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isoDate(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

// ── List rows (14 records) ────────────────────────────────────────────────────

export const courseOfferingRows: CourseOfferingRow[] = [
  // ── Active ────────────────────────────────────────────────────────────────────
  {
    id: 'co-001',
    courseId: 'course-phar101',
    courseNumber: 'PHARM-501',
    courseName: 'Advanced Pharmacology',
    academicYear: '2025–2026',
    term: 'Spring 2026',
    cohort: 'DPT Cohort 2024',
    startDate: isoDate(2026, 1, 12),
    endDate: isoDate(2026, 5, 8),
    credits: 4,
    registeredStudents: 32,
    facultyAssigned: 'Dr. Sarah Mitchell',
    facultyList: [
      { name: 'Dr. Sarah Mitchell', initials: 'SM', chipToken: 'var(--chip-1)' },
      { name: 'Dr. Priya Nair',     initials: 'PN', chipToken: 'var(--chip-2)' },
    ],
    status: 'active',
    attn: false,
    qbHealth: 68,
    assessmentBreakdown: { draft: 1, review: 0, approved: 0, scheduled: 1, grading: 0, published: 1 },
    assessmentsDueSoon: 1,
    activeWithNoAssessments: false,
    isPrism: true,
  },
  {
    id: 'co-002',
    courseId: 'course-biol201',
    courseNumber: 'BIOL-302',
    courseName: 'Cellular & Molecular Biology',
    academicYear: '2025–2026',
    term: 'Spring 2026',
    cohort: 'DPT Cohort 2024',
    startDate: isoDate(2026, 1, 12),
    endDate: isoDate(2026, 5, 8),
    credits: 3,
    registeredStudents: 28,
    facultyAssigned: 'Dr. James Okafor',
    facultyList: [
      { name: 'Dr. James Okafor', initials: 'JO', chipToken: 'var(--chip-2)' },
    ],
    status: 'active',
    attn: false,
    qbHealth: 74,
    assessmentBreakdown: { draft: 0, review: 0, approved: 0, scheduled: 1, grading: 0, published: 2 },
    assessmentsDueSoon: 0,
    activeWithNoAssessments: false,
    isPrism: false,
  },
  {
    id: 'co-003',
    courseId: 'course-skel101',
    courseNumber: 'ANAT-401',
    courseName: 'Clinical Anatomy',
    academicYear: '2025–2026',
    term: 'Spring 2026',
    cohort: 'PharmD Cohort 2023',
    startDate: isoDate(2026, 1, 19),
    endDate: isoDate(2026, 5, 15),
    credits: 4,
    registeredStudents: 24,
    facultyAssigned: 'Prof. Meena Patel',
    facultyList: [
      { name: 'Prof. Meena Patel',      initials: 'MP', chipToken: 'var(--chip-3)' },
      { name: 'Dr. Raj Krishnaswamy',   initials: 'RK', chipToken: 'var(--chip-4)' },
    ],
    status: 'active',
    attn: true,
    qbHealth: 42,
    assessmentBreakdown: { draft: 1, review: 0, approved: 0, scheduled: 0, grading: 0, published: 1 },
    assessmentsDueSoon: 2,
    activeWithNoAssessments: false,
    isPrism: true,
  },
  {
    id: 'co-004',
    courseId: 'course-phar101',
    courseNumber: 'PHYS-210',
    courseName: 'Human Physiology',
    academicYear: '2025–2026',
    term: 'Spring 2026',
    cohort: 'MOT Cohort 2024',
    startDate: isoDate(2026, 2, 2),
    endDate: isoDate(2026, 5, 29),
    credits: 3,
    registeredStudents: 19,
    facultyAssigned: 'Dr. Carlos Rivera',
    facultyList: [
      { name: 'Dr. Carlos Rivera', initials: 'CR', chipToken: 'var(--chip-4)' },
    ],
    status: 'active',
    attn: false,
    qbHealth: 55,
    assessmentBreakdown: { draft: 0, review: 0, approved: 0, scheduled: 1, grading: 0, published: 1 },
    assessmentsDueSoon: 0,
    activeWithNoAssessments: true,
    isPrism: false,
  },
  {
    id: 'co-005',
    courseId: 'course-biol201',
    courseNumber: 'NURS-310',
    courseName: 'Evidence-Based Practice I',
    academicYear: '2025–2026',
    term: 'Spring 2026',
    cohort: 'MSN Cohort 2024',
    startDate: isoDate(2026, 1, 26),
    endDate: isoDate(2026, 5, 22),
    credits: 3,
    registeredStudents: 35,
    facultyAssigned: 'Dr. Sarah Mitchell',
    facultyList: [
      { name: 'Dr. Sarah Mitchell', initials: 'SM', chipToken: 'var(--chip-1)' },
      { name: 'Prof. Linda Chow',   initials: 'LC', chipToken: 'var(--chip-2)' },
    ],
    status: 'active',
    attn: true,
    qbHealth: 38,
    assessmentBreakdown: { draft: 1, review: 0, approved: 0, scheduled: 1, grading: 0, published: 1 },
    assessmentsDueSoon: 1,
    activeWithNoAssessments: false,
    isPrism: false,
  },

  // ── Past ──────────────────────────────────────────────────────────────────────
  {
    id: 'co-006',
    courseId: 'course-phar101',
    courseNumber: 'PHARM-401',
    courseName: 'Pharmacokinetics',
    academicYear: '2025–2026',
    term: 'Fall 2025',
    cohort: 'DPT Cohort 2024',
    startDate: isoDate(2025, 8, 25),
    endDate: isoDate(2025, 12, 12),
    credits: 3,
    registeredStudents: 32,
    facultyAssigned: 'Dr. Sarah Mitchell',
    facultyList: [
      { name: 'Dr. Sarah Mitchell', initials: 'SM', chipToken: 'var(--chip-1)' },
    ],
    status: 'past',
    attn: false,
    qbHealth: 88,
    assessmentBreakdown: { draft: 0, review: 0, approved: 0, scheduled: 0, grading: 0, published: 3 },
    assessmentsDueSoon: 0,
    activeWithNoAssessments: false,
    isPrism: false,
  },
  {
    id: 'co-007',
    courseId: 'course-biol201',
    courseNumber: 'BIOL-201',
    courseName: 'Foundations of Biology',
    academicYear: '2025–2026',
    term: 'Fall 2025',
    cohort: 'PharmD Cohort 2023',
    startDate: isoDate(2025, 8, 25),
    endDate: isoDate(2025, 12, 12),
    credits: 4,
    registeredStudents: 44,
    facultyAssigned: 'Dr. James Okafor',
    facultyList: [
      { name: 'Dr. James Okafor', initials: 'JO', chipToken: 'var(--chip-2)' },
      { name: 'Dr. Ana Costa',    initials: 'AC', chipToken: 'var(--chip-1)' },
    ],
    status: 'past',
    attn: false,
    qbHealth: 92,
    assessmentBreakdown: { draft: 0, review: 0, approved: 0, scheduled: 0, grading: 0, published: 4 },
    assessmentsDueSoon: 0,
    activeWithNoAssessments: false,
    isPrism: false,
  },
  {
    id: 'co-008',
    courseId: 'course-skel101',
    courseNumber: 'ANAT-301',
    courseName: 'Musculoskeletal Anatomy',
    academicYear: '2024–2025',
    term: 'Spring 2025',
    cohort: 'DPT Cohort 2023',
    startDate: isoDate(2025, 1, 13),
    endDate: isoDate(2025, 5, 9),
    credits: 4,
    registeredStudents: 27,
    facultyAssigned: 'Prof. Meena Patel',
    facultyList: [
      { name: 'Prof. Meena Patel', initials: 'MP', chipToken: 'var(--chip-3)' },
    ],
    status: 'past',
    attn: false,
    qbHealth: 95,
    assessmentBreakdown: { draft: 0, review: 0, approved: 0, scheduled: 0, grading: 0, published: 3 },
    assessmentsDueSoon: 0,
    activeWithNoAssessments: false,
    isPrism: false,
  },
  {
    id: 'co-009',
    courseId: 'course-phar101',
    courseNumber: 'PHYS-101',
    courseName: 'Introductory Physiology',
    academicYear: '2024–2025',
    term: 'Fall 2024',
    cohort: 'MOT Cohort 2023',
    startDate: isoDate(2024, 8, 26),
    endDate: isoDate(2024, 12, 13),
    credits: 3,
    registeredStudents: 18,
    facultyAssigned: 'Dr. Carlos Rivera',
    facultyList: [
      { name: 'Dr. Carlos Rivera', initials: 'CR', chipToken: 'var(--chip-4)' },
    ],
    status: 'past',
    attn: false,
    qbHealth: 78,
    assessmentBreakdown: { draft: 0, review: 0, approved: 0, scheduled: 0, grading: 0, published: 3 },
    assessmentsDueSoon: 0,
    activeWithNoAssessments: false,
    isPrism: false,
  },
  {
    id: 'co-010',
    courseId: 'course-biol201',
    courseNumber: 'NURS-210',
    courseName: 'Pathophysiology',
    academicYear: '2025–2026',
    term: 'Fall 2025',
    cohort: 'MSN Cohort 2024',
    startDate: isoDate(2025, 9, 1),
    endDate: isoDate(2025, 12, 19),
    credits: 3,
    registeredStudents: 38,
    facultyAssigned: 'Dr. James Okafor',
    facultyList: [
      { name: 'Dr. James Okafor', initials: 'JO', chipToken: 'var(--chip-2)' },
      { name: 'Prof. Anne Walsh',  initials: 'AW', chipToken: 'var(--chip-3)' },
    ],
    status: 'past',
    attn: false,
    qbHealth: 83,
    assessmentBreakdown: { draft: 0, review: 0, approved: 0, scheduled: 0, grading: 0, published: 3 },
    assessmentsDueSoon: 0,
    activeWithNoAssessments: false,
    isPrism: false,
  },

  // ── Upcoming ──────────────────────────────────────────────────────────────────
  {
    id: 'co-011',
    courseId: 'course-phar101',
    courseNumber: 'PHARM-601',
    courseName: 'Drug Therapy Management',
    academicYear: '2026–2027',
    term: 'Fall 2026',
    cohort: 'DPT Cohort 2025',
    startDate: isoDate(2026, 8, 24),
    endDate: isoDate(2026, 12, 11),
    credits: 4,
    registeredStudents: 30,
    facultyAssigned: 'Dr. Sarah Mitchell',
    facultyList: [
      { name: 'Dr. Sarah Mitchell', initials: 'SM', chipToken: 'var(--chip-1)' },
      { name: 'Dr. Priya Nair',     initials: 'PN', chipToken: 'var(--chip-2)' },
    ],
    status: 'upcoming',
    attn: true,
    qbHealth: 22,
    assessmentBreakdown: { draft: 1, review: 1, approved: 0, scheduled: 1, grading: 0, published: 0 },
    assessmentsDueSoon: 0,
    activeWithNoAssessments: false,
    isPrism: false,
  },
  {
    id: 'co-012',
    courseId: 'course-biol201',
    courseNumber: 'BIOL-401',
    courseName: 'Genetics & Genomics',
    academicYear: '2026–2027',
    term: 'Fall 2026',
    cohort: 'PharmD Cohort 2024',
    startDate: isoDate(2026, 9, 7),
    endDate: isoDate(2026, 12, 18),
    credits: 3,
    registeredStudents: 26,
    facultyAssigned: 'Dr. James Okafor',
    facultyList: [
      { name: 'Dr. James Okafor', initials: 'JO', chipToken: 'var(--chip-2)' },
    ],
    status: 'upcoming',
    attn: false,
    qbHealth: 18,
    assessmentBreakdown: { draft: 2, review: 0, approved: 0, scheduled: 1, grading: 0, published: 0 },
    assessmentsDueSoon: 0,
    activeWithNoAssessments: false,
    isPrism: false,
  },
  {
    id: 'co-013',
    courseId: 'course-skel101',
    courseNumber: 'ANAT-501',
    courseName: 'Advanced Neuroanatomy',
    academicYear: '2026–2027',
    term: 'Fall 2026',
    cohort: 'DPT Cohort 2025',
    startDate: isoDate(2026, 8, 31),
    endDate: isoDate(2026, 12, 4),
    credits: 4,
    registeredStudents: 22,
    facultyAssigned: 'Prof. Meena Patel',
    facultyList: [
      { name: 'Prof. Meena Patel',    initials: 'MP', chipToken: 'var(--chip-3)' },
      { name: 'Dr. Raj Krishnaswamy', initials: 'RK', chipToken: 'var(--chip-4)' },
    ],
    status: 'upcoming',
    attn: false,
    qbHealth: 31,
    assessmentBreakdown: { draft: 1, review: 1, approved: 0, scheduled: 2, grading: 0, published: 0 },
    assessmentsDueSoon: 0,
    activeWithNoAssessments: false,
    isPrism: false,
  },
  {
    id: 'co-014',
    courseId: 'course-biol201',
    courseNumber: 'NURS-420',
    courseName: 'Clinical Decision Making',
    academicYear: '2026–2027',
    term: 'Fall 2026',
    cohort: 'MSN Cohort 2025',
    startDate: null,   // TBD — demonstrates missing-dates attention flag
    endDate: null,
    credits: 3,
    registeredStudents: 41,
    facultyAssigned: 'Dr. Carlos Rivera',
    facultyList: [
      { name: 'Dr. Carlos Rivera', initials: 'CR', chipToken: 'var(--chip-4)' },
      { name: 'Prof. Anne Walsh',  initials: 'AW', chipToken: 'var(--chip-3)' },
    ],
    status: 'upcoming',
    attn: true,
    qbHealth: 8,
    assessmentBreakdown: { draft: 1, review: 0, approved: 0, scheduled: 2, grading: 0, published: 0 },
    assessmentsDueSoon: 0,
    activeWithNoAssessments: false,
    isPrism: false,
  },
]

// ── Extended records (14 detailed records) ────────────────────────────────────

export const allCourseOfferings: ExtendedCourseOffering[] = [
  {
    ...courseOfferingRows[0],
    hoursPerWeek: 6,
    courseType: 'Core',
    department: 'Pharmacy Sciences',
    description:
      'An advanced study of pharmacological agents across major drug classes, with emphasis on mechanism of action, pharmacokinetics, adverse effects, and clinical application in patient care.',
    objectives: [
      'Analyze mechanism of action for major drug classes',
      'Evaluate pharmacokinetic parameters and their clinical significance',
      'Apply drug-interaction principles in complex patient scenarios',
      'Integrate evidence-based guidelines into prescribing decisions',
    ],
    qbAnalytics: {
      total: 180,
      measurePct: 68,
      competencyPct: 45,
      untagged: 32,
      aiFlagged: 12,
      neverUsed: 28,
      bloomsDist: { remember: 22, understand: 30, apply: 25, analyze: 15, evaluate: 6, create: 2 },
    },
    students: [
      { id: 'stu-001', name: 'Aisha Patel',     email: 'aisha.patel@university.edu',   studentId: 'STU-2024-0081', cohort: 'DPT Cohort 2024', status: 'enrolled' },
      { id: 'stu-002', name: 'Marcus Chen',     email: 'marcus.chen@university.edu',   studentId: 'STU-2024-0094', cohort: 'DPT Cohort 2024', status: 'enrolled' },
      { id: 'stu-003', name: 'Sofia Rodriguez', email: 'sofia.r@university.edu',       studentId: 'STU-2024-0107', cohort: 'DPT Cohort 2024', status: 'enrolled' },
      { id: 'stu-004', name: 'Daniel Kim',      email: 'daniel.kim@university.edu',    studentId: 'STU-2024-0112', cohort: 'DPT Cohort 2024', status: 'enrolled' },
    ],
    faculty: [
      { id: 'fac-001', name: 'Dr. Sarah Mitchell', role: 'Course Coordinator' },
      { id: 'fac-002', name: 'Dr. Priya Nair',     role: 'Instructor' },
    ],
    assessments: [
      { id: 'asm-001', title: 'Midterm Exam — Drug Classes',     type: 'Exam', status: 'Published', date: isoDate(2026, 3, 5),  students: 32, durationMinutes: 90,  gradingScheme: 'Percentage', weightage: 30 },
      { id: 'asm-002', title: 'Case Study: Polypharmacy',        type: 'Quiz', status: 'Draft',     date: isoDate(2026, 4, 2),  students: 0,  durationMinutes: 45,  gradingScheme: 'Rubric',     weightage: 20 },
      { id: 'asm-003', title: 'Final Exam — Pharmacology Board', type: 'Exam', status: 'Scheduled', date: isoDate(2026, 5, 1),  students: 0,  durationMinutes: 120, gradingScheme: 'Percentage', weightage: 50 },
    ],
    resources: [
      { title: 'Katzung Basic & Clinical Pharmacology — 15th Ed', type: 'PDF',   url: '#', syncedFromPrism: true,  fileSize: '14.2 MB', updatedDate: isoDate(2026, 1, 5) },
      { title: 'FDA Drug Safety Communications Portal',           type: 'Link',  url: '#', syncedFromPrism: false },
      { title: 'Drug Interaction Checker Tutorial',               type: 'Video', url: '#', syncedFromPrism: false },
    ],
  },

  {
    ...courseOfferingRows[1],
    hoursPerWeek: 4,
    courseType: 'Core',
    department: 'Biological Sciences',
    description:
      'Examines the molecular mechanisms underlying cell structure, function, and regulation. Topics include gene expression, signal transduction, cell cycle, and apoptosis.',
    objectives: [
      'Describe cell membrane transport and receptor signaling',
      'Explain the regulation of the eukaryotic cell cycle',
      'Compare molecular mechanisms of apoptosis vs. necrosis',
      'Evaluate the role of epigenetics in gene expression',
    ],
    qbAnalytics: {
      total: 120,
      measurePct: 74,
      competencyPct: 58,
      untagged: 18,
      aiFlagged: 6,
      neverUsed: 22,
      bloomsDist: { remember: 18, understand: 28, apply: 27, analyze: 18, evaluate: 7, create: 2 },
    },
    students: [
      { id: 'stu-005', name: 'Leila Hassan', email: 'leila.h@university.edu', studentId: 'STU-2024-0063', cohort: 'DPT Cohort 2024', status: 'enrolled' },
      { id: 'stu-006', name: 'Ryan Okafor',  email: 'ryan.o@university.edu',  studentId: 'STU-2024-0077', cohort: 'DPT Cohort 2024', status: 'enrolled' },
      { id: 'stu-007', name: 'Emma Torres',  email: 'emma.t@university.edu',  studentId: 'STU-2024-0089', cohort: 'DPT Cohort 2024', status: 'enrolled' },
    ],
    faculty: [
      { id: 'fac-003', name: 'Dr. James Okafor', role: 'Course Coordinator' },
    ],
    assessments: [
      { id: 'asm-004', title: 'Lab Practical — Cell Imaging',     type: 'Practical', status: 'Published', date: isoDate(2026, 2, 20), students: 28, durationMinutes: 60,  gradingScheme: 'Pass/Fail',  weightage: 20 },
      { id: 'asm-005', title: 'Midterm Exam — Molecular Biology', type: 'Exam',      status: 'Published', date: isoDate(2026, 3, 12), students: 28, durationMinutes: 90,  gradingScheme: 'Percentage', weightage: 30 },
      { id: 'asm-006', title: 'Final Project — Gene Expression',  type: 'Project',   status: 'Scheduled', date: isoDate(2026, 4, 28), students: 0,  durationMinutes: undefined, gradingScheme: 'Rubric', weightage: 50 },
    ],
    resources: [
      { title: 'Molecular Biology of the Cell — Alberts', type: 'PDF',  url: '#', syncedFromPrism: true,  fileSize: '18.7 MB', updatedDate: isoDate(2026, 1, 8) },
      { title: 'NCBI Gene Expression Omnibus',            type: 'Link', url: '#', syncedFromPrism: false },
    ],
  },

  {
    ...courseOfferingRows[2],
    hoursPerWeek: 5,
    courseType: 'Core',
    department: 'Anatomy & Physiology',
    description:
      'Advanced cadaveric and prosection study of the human body integrated with clinical imaging and surface anatomy, emphasizing structures relevant to clinical examination.',
    objectives: [
      'Identify major anatomical structures using cadaveric specimens',
      'Correlate surface anatomy landmarks with internal structures',
      'Interpret radiographic images in clinical context',
      'Apply anatomical knowledge to clinical examination techniques',
    ],
    qbAnalytics: {
      total: 95,
      measurePct: 42,
      competencyPct: 30,
      untagged: 48,
      aiFlagged: 19,
      neverUsed: 41,
      bloomsDist: { remember: 35, understand: 28, apply: 18, analyze: 12, evaluate: 5, create: 2 },
    },
    students: [
      { id: 'stu-008', name: 'Noah Williams',  email: 'noah.w@university.edu',  studentId: 'STU-2023-0041', cohort: 'PharmD Cohort 2023', status: 'enrolled' },
      { id: 'stu-009', name: 'Chloe Anderson', email: 'chloe.a@university.edu', studentId: 'STU-2023-0058', cohort: 'PharmD Cohort 2023', status: 'enrolled' },
    ],
    faculty: [
      { id: 'fac-004', name: 'Prof. Meena Patel',     role: 'Course Coordinator' },
      { id: 'fac-005', name: 'Dr. Raj Krishnaswamy',  role: 'Instructor' },
    ],
    assessments: [
      { id: 'asm-007', title: 'Lab Practical I — Upper Limb', type: 'Practical', status: 'Published', date: isoDate(2026, 2, 13), students: 24, durationMinutes: 60, gradingScheme: 'Pass/Fail',  weightage: 30 },
      { id: 'asm-008', title: 'Midterm Exam',                 type: 'Exam',      status: 'Draft',     date: isoDate(2026, 3, 20), students: 0,  durationMinutes: 90, gradingScheme: 'Percentage', weightage: 70 },
    ],
    resources: [
      { title: "Grant's Atlas of Anatomy — 14th Ed", type: 'PDF',   url: '#', syncedFromPrism: true,  fileSize: '22.4 MB', updatedDate: isoDate(2026, 1, 15) },
      { title: 'Radiology Masterclass — CT Anatomy',  type: 'Video', url: '#', syncedFromPrism: false },
    ],
  },

  {
    ...courseOfferingRows[3],
    hoursPerWeek: 4,
    courseType: 'Core',
    department: 'Physiology',
    description:
      'Integrated systems physiology covering cardiovascular, respiratory, renal, endocrine, and neurophysiology with clinical correlations throughout.',
    objectives: [
      'Explain the Frank-Starling mechanism and cardiac output regulation',
      'Describe ventilation-perfusion relationships in pulmonary physiology',
      'Apply Henderson-Hasselbalch to acid-base disorders',
      'Integrate hormonal regulation of fluid balance',
    ],
    qbAnalytics: {
      total: 140,
      measurePct: 55,
      competencyPct: 41,
      untagged: 35,
      aiFlagged: 10,
      neverUsed: 33,
      bloomsDist: { remember: 26, understand: 30, apply: 22, analyze: 14, evaluate: 6, create: 2 },
    },
    students: [
      { id: 'stu-010', name: 'Amara Diallo', email: 'amara.d@university.edu', studentId: 'STU-2024-0031', cohort: 'MOT Cohort 2024', status: 'enrolled' },
      { id: 'stu-011', name: 'Felix Nguyen', email: 'felix.n@university.edu', studentId: 'STU-2024-0047', cohort: 'MOT Cohort 2024', status: 'enrolled' },
    ],
    faculty: [
      { id: 'fac-006', name: 'Dr. Carlos Rivera', role: 'Course Coordinator' },
    ],
    assessments: [
      { id: 'asm-009', title: 'Quiz 1 — Cardiovascular', type: 'Quiz', status: 'Published', date: isoDate(2026, 2, 23), students: 19, durationMinutes: 30, gradingScheme: 'Percentage', weightage: 20 },
      { id: 'asm-010', title: 'Midterm Exam',             type: 'Exam', status: 'Scheduled', date: isoDate(2026, 3, 27), students: 0,  durationMinutes: 90, gradingScheme: 'Percentage', weightage: 80 },
    ],
    resources: [
      { title: 'Guyton & Hall Medical Physiology — 14th Ed', type: 'PDF',  url: '#', syncedFromPrism: true,  fileSize: '19.1 MB', updatedDate: isoDate(2026, 1, 20) },
      { title: 'Physiology Virtual Lab Portal',              type: 'Link', url: '#', syncedFromPrism: false },
    ],
  },

  {
    ...courseOfferingRows[4],
    hoursPerWeek: 3,
    courseType: 'Core',
    department: 'Nursing Science',
    description:
      'Introduction to evidence-based practice in nursing: research design, critical appraisal, statistical literacy, and clinical application of research findings.',
    objectives: [
      'Formulate clinical questions using the PICO framework',
      'Critically appraise randomised controlled trials',
      'Apply levels of evidence to clinical practice decisions',
      'Communicate research findings to clinical teams',
    ],
    qbAnalytics: {
      total: 85,
      measurePct: 38,
      competencyPct: 22,
      untagged: 54,
      aiFlagged: 23,
      neverUsed: 47,
      bloomsDist: { remember: 38, understand: 27, apply: 18, analyze: 10, evaluate: 5, create: 2 },
    },
    students: [
      { id: 'stu-012', name: 'Isabella Park', email: 'isabella.p@university.edu', studentId: 'STU-2024-0022', cohort: 'MSN Cohort 2024', status: 'enrolled' },
      { id: 'stu-013', name: 'Luca Ferrara',  email: 'luca.f@university.edu',     studentId: 'STU-2024-0035', cohort: 'MSN Cohort 2024', status: 'enrolled' },
      { id: 'stu-014', name: 'Grace Mensah',  email: 'grace.m@university.edu',    studentId: 'STU-2024-0049', cohort: 'MSN Cohort 2024', status: 'enrolled' },
    ],
    faculty: [
      { id: 'fac-001', name: 'Dr. Sarah Mitchell', role: 'Course Coordinator' },
      { id: 'fac-007', name: 'Prof. Linda Chow',   role: 'Instructor' },
    ],
    assessments: [
      { id: 'asm-011', title: 'PICO Worksheet',         type: 'Assignment', status: 'Published', date: isoDate(2026, 2, 10), students: 35, durationMinutes: undefined, gradingScheme: 'Rubric',     weightage: 20 },
      { id: 'asm-012', title: 'Journal Club Appraisal', type: 'Seminar',    status: 'Draft',     date: isoDate(2026, 3, 17), students: 0,  durationMinutes: 60,        gradingScheme: 'Rubric',     weightage: 30 },
      { id: 'asm-013', title: 'Final Evidence Report',  type: 'Project',    status: 'Scheduled', date: isoDate(2026, 5, 5),  students: 0,  durationMinutes: undefined, gradingScheme: 'Rubric',     weightage: 50 },
    ],
    resources: [
      { title: 'CONSORT Checklist — RCT Reporting',    type: 'PDF',   url: '#', syncedFromPrism: true,  fileSize: '0.8 MB', updatedDate: isoDate(2026, 1, 12) },
      { title: 'Cochrane Library — Systematic Reviews', type: 'Link',  url: '#', syncedFromPrism: false },
      { title: 'EBP Lecture Series — Module 1',         type: 'Video', url: '#', syncedFromPrism: true,  updatedDate: isoDate(2026, 1, 18) },
    ],
  },

  {
    ...courseOfferingRows[5],
    hoursPerWeek: 4,
    courseType: 'Core',
    department: 'Pharmacy Sciences',
    description:
      'Study of absorption, distribution, metabolism, and excretion of drugs with application to dose design, population pharmacokinetics, and therapeutic drug monitoring.',
    objectives: [
      'Calculate pharmacokinetic parameters from plasma concentration data',
      'Design dosing regimens for patients with renal or hepatic impairment',
      'Interpret therapeutic drug monitoring results',
      'Apply population PK concepts to individualise therapy',
    ],
    qbAnalytics: {
      total: 210,
      measurePct: 88,
      competencyPct: 76,
      untagged: 9,
      aiFlagged: 2,
      neverUsed: 15,
      bloomsDist: { remember: 14, understand: 22, apply: 30, analyze: 22, evaluate: 9, create: 3 },
    },
    students: [
      { id: 'stu-001', name: 'Aisha Patel', email: 'aisha.patel@university.edu', studentId: 'STU-2024-0081', cohort: 'DPT Cohort 2024', status: 'completed' },
      { id: 'stu-002', name: 'Marcus Chen', email: 'marcus.chen@university.edu', studentId: 'STU-2024-0094', cohort: 'DPT Cohort 2024', status: 'completed' },
      { id: 'stu-015', name: 'Omar Hassan', email: 'omar.h@university.edu',      studentId: 'STU-2024-0102', cohort: 'DPT Cohort 2024', status: 'withdrawn'  },
    ],
    faculty: [
      { id: 'fac-001', name: 'Dr. Sarah Mitchell', role: 'Course Coordinator' },
    ],
    assessments: [
      { id: 'asm-014', title: 'Problem Set 1 — One-Compartment PK', type: 'Assignment', status: 'Published', date: isoDate(2025, 9, 26),  students: 32, durationMinutes: undefined, gradingScheme: 'Standard',   weightage: 10 },
      { id: 'asm-015', title: 'Midterm Exam',                        type: 'Exam',       status: 'Published', date: isoDate(2025, 10, 24), students: 31, durationMinutes: 90,        gradingScheme: 'Percentage', weightage: 40 },
      { id: 'asm-016', title: 'Final Exam — PK Case Studies',        type: 'Exam',       status: 'Published', date: isoDate(2025, 12, 5),  students: 31, durationMinutes: 120,       gradingScheme: 'Percentage', weightage: 50 },
    ],
    resources: [
      { title: 'Applied Biopharmaceutics & Pharmacokinetics — Shargel', type: 'PDF',  url: '#', syncedFromPrism: true,  fileSize: '11.3 MB', updatedDate: isoDate(2025, 8, 14) },
      { title: 'PK-Sim Simulation Software',                             type: 'Link', url: '#', syncedFromPrism: false },
    ],
  },

  {
    ...courseOfferingRows[6],
    hoursPerWeek: 5,
    courseType: 'Core',
    department: 'Biological Sciences',
    description:
      'Foundational principles of cell biology, biochemistry, genetics, and evolution, with particular emphasis on concepts that underpin professional health-science curricula.',
    objectives: [
      'Describe the central dogma of molecular biology',
      'Explain basic principles of Mendelian and non-Mendelian inheritance',
      'Analyze metabolic pathways relevant to drug action',
      'Relate cell biology concepts to disease mechanisms',
    ],
    qbAnalytics: {
      total: 250,
      measurePct: 92,
      competencyPct: 84,
      untagged: 6,
      aiFlagged: 1,
      neverUsed: 12,
      bloomsDist: { remember: 16, understand: 24, apply: 28, analyze: 20, evaluate: 9, create: 3 },
    },
    students: [
      { id: 'stu-005', name: 'Leila Hassan', email: 'leila.h@university.edu', studentId: 'STU-2023-0063', cohort: 'PharmD Cohort 2023', status: 'completed' },
      { id: 'stu-016', name: 'David Park',   email: 'david.p@university.edu', studentId: 'STU-2023-0079', cohort: 'PharmD Cohort 2023', status: 'completed' },
    ],
    faculty: [
      { id: 'fac-003', name: 'Dr. James Okafor', role: 'Course Coordinator' },
      { id: 'fac-008', name: 'Dr. Ana Costa',    role: 'Instructor' },
    ],
    assessments: [
      { id: 'asm-017', title: 'Genetics Problem Set', type: 'Assignment', status: 'Published', date: isoDate(2025, 10, 3),  students: 44, durationMinutes: undefined, gradingScheme: 'Standard',   weightage: 10 },
      { id: 'asm-018', title: 'Midterm I',            type: 'Exam',       status: 'Published', date: isoDate(2025, 10, 17), students: 44, durationMinutes: 90,        gradingScheme: 'Percentage', weightage: 30 },
      { id: 'asm-019', title: 'Midterm II',           type: 'Exam',       status: 'Published', date: isoDate(2025, 11, 14), students: 43, durationMinutes: 90,        gradingScheme: 'Percentage', weightage: 30 },
      { id: 'asm-020', title: 'Final Exam',           type: 'Exam',       status: 'Published', date: isoDate(2025, 12, 10), students: 43, durationMinutes: 120,       gradingScheme: 'Percentage', weightage: 30 },
    ],
    resources: [
      { title: 'Campbell Biology — 12th Ed', type: 'PDF',   url: '#', syncedFromPrism: true,  fileSize: '25.8 MB', updatedDate: isoDate(2025, 8, 18) },
      { title: 'Khan Academy — Cell Biology', type: 'Video', url: '#', syncedFromPrism: false },
    ],
  },

  {
    ...courseOfferingRows[7],
    hoursPerWeek: 6,
    courseType: 'Core',
    department: 'Anatomy & Physiology',
    description:
      'Regional anatomy of the upper and lower extremities with emphasis on orthopaedic and neurological clinical examination; integrated cadaveric lab.',
    objectives: [
      'Identify muscles, nerves, and vessels of the upper and lower extremity',
      'Describe innervation patterns and dermatomes',
      'Correlate anatomy with common musculoskeletal injury patterns',
      'Conduct surface anatomy-based clinical assessments',
    ],
    qbAnalytics: {
      total: 165,
      measurePct: 95,
      competencyPct: 88,
      untagged: 4,
      aiFlagged: 0,
      neverUsed: 9,
      bloomsDist: { remember: 12, understand: 20, apply: 32, analyze: 24, evaluate: 10, create: 2 },
    },
    students: [
      { id: 'stu-008', name: 'Noah Williams', email: 'noah.w@university.edu', studentId: 'STU-2023-0041', cohort: 'DPT Cohort 2023', status: 'completed' },
      { id: 'stu-017', name: 'Nia Thompson',  email: 'nia.t@university.edu',  studentId: 'STU-2023-0055', cohort: 'DPT Cohort 2023', status: 'completed' },
    ],
    faculty: [
      { id: 'fac-004', name: 'Prof. Meena Patel', role: 'Course Coordinator' },
    ],
    assessments: [
      { id: 'asm-021', title: 'Lab Practical I — Upper Limb',  type: 'Practical', status: 'Published', date: isoDate(2025, 2, 21), students: 27, durationMinutes: 60, gradingScheme: 'Pass/Fail',  weightage: 25 },
      { id: 'asm-022', title: 'Lab Practical II — Lower Limb', type: 'Practical', status: 'Published', date: isoDate(2025, 4, 4),  students: 27, durationMinutes: 60, gradingScheme: 'Pass/Fail',  weightage: 25 },
      { id: 'asm-023', title: 'Final Exam',                    type: 'Exam',      status: 'Published', date: isoDate(2025, 5, 2),  students: 26, durationMinutes: 90, gradingScheme: 'Percentage', weightage: 50 },
    ],
    resources: [
      { title: "Moore's Clinically Oriented Anatomy — 9th Ed", type: 'PDF',   url: '#', syncedFromPrism: true,  fileSize: '21.5 MB', updatedDate: isoDate(2025, 1, 6) },
      { title: 'Anatomy.TV — 3D Dissection Guide',             type: 'Video', url: '#', syncedFromPrism: false },
    ],
  },

  {
    ...courseOfferingRows[8],
    hoursPerWeek: 3,
    courseType: 'Core',
    department: 'Physiology',
    description:
      'Introduction to organ system physiology covering cardiovascular, pulmonary, renal, and nervous system function with clinical correlations.',
    objectives: [
      'Describe resting membrane potential and action potential generation',
      'Explain cardiac cycle events and heart sounds',
      'Differentiate obstructive from restrictive pulmonary patterns',
      'Relate renal clearance to GFR estimation',
    ],
    qbAnalytics: {
      total: 130,
      measurePct: 78,
      competencyPct: 62,
      untagged: 16,
      aiFlagged: 4,
      neverUsed: 24,
      bloomsDist: { remember: 20, understand: 26, apply: 28, analyze: 17, evaluate: 7, create: 2 },
    },
    students: [
      { id: 'stu-010', name: 'Amara Diallo', email: 'amara.d@university.edu', studentId: 'STU-2023-0031', cohort: 'MOT Cohort 2023', status: 'completed' },
    ],
    faculty: [
      { id: 'fac-006', name: 'Dr. Carlos Rivera', role: 'Course Coordinator' },
    ],
    assessments: [
      { id: 'asm-024', title: 'Quiz 1 — Neurophysiology', type: 'Quiz', status: 'Published', date: isoDate(2024, 9, 27),  students: 18, durationMinutes: 30,  gradingScheme: 'Percentage', weightage: 20 },
      { id: 'asm-025', title: 'Midterm Exam',              type: 'Exam', status: 'Published', date: isoDate(2024, 10, 25), students: 18, durationMinutes: 90,  gradingScheme: 'Percentage', weightage: 40 },
      { id: 'asm-026', title: 'Final Exam',                type: 'Exam', status: 'Published', date: isoDate(2024, 12, 6),  students: 17, durationMinutes: 120, gradingScheme: 'Percentage', weightage: 40 },
    ],
    resources: [
      { title: 'Berne & Levy Physiology — 7th Ed', type: 'PDF',  url: '#', syncedFromPrism: true,  fileSize: '16.9 MB', updatedDate: isoDate(2024, 8, 20) },
      { title: 'PhysioEx Lab Simulations',         type: 'Link', url: '#', syncedFromPrism: false },
    ],
  },

  {
    ...courseOfferingRows[9],
    hoursPerWeek: 4,
    courseType: 'Core',
    department: 'Nursing Science',
    description:
      'Systematic study of altered physiological function in major disease states, with application to pharmacological and non-pharmacological management.',
    objectives: [
      'Explain the pathophysiology of heart failure and its management',
      'Describe inflammatory mediators and their clinical consequences',
      'Correlate endocrine dysfunction with systemic manifestations',
      'Apply pathophysiological principles to nursing assessment',
    ],
    qbAnalytics: {
      total: 175,
      measurePct: 83,
      competencyPct: 70,
      untagged: 12,
      aiFlagged: 3,
      neverUsed: 19,
      bloomsDist: { remember: 16, understand: 24, apply: 30, analyze: 20, evaluate: 8, create: 2 },
    },
    students: [
      { id: 'stu-012', name: 'Isabella Park', email: 'isabella.p@university.edu', studentId: 'STU-2024-0022', cohort: 'MSN Cohort 2024', status: 'completed' },
      { id: 'stu-018', name: 'Ethan Brown',   email: 'ethan.b@university.edu',    studentId: 'STU-2024-0038', cohort: 'MSN Cohort 2024', status: 'completed' },
    ],
    faculty: [
      { id: 'fac-003', name: 'Dr. James Okafor', role: 'Course Coordinator' },
      { id: 'fac-009', name: 'Prof. Anne Walsh',  role: 'Instructor' },
    ],
    assessments: [
      { id: 'asm-027', title: 'Case Study — Heart Failure', type: 'Assignment', status: 'Published', date: isoDate(2025, 10, 10), students: 38, durationMinutes: undefined, gradingScheme: 'Rubric',     weightage: 20 },
      { id: 'asm-028', title: 'Midterm Exam',               type: 'Exam',       status: 'Published', date: isoDate(2025, 11, 7),  students: 38, durationMinutes: 90,        gradingScheme: 'Percentage', weightage: 40 },
      { id: 'asm-029', title: 'Final Exam',                 type: 'Exam',       status: 'Published', date: isoDate(2025, 12, 12), students: 37, durationMinutes: 120,       gradingScheme: 'Percentage', weightage: 40 },
    ],
    resources: [
      { title: 'Pathophysiology — McCance & Huether', type: 'PDF',   url: '#', syncedFromPrism: true,  fileSize: '20.1 MB', updatedDate: isoDate(2025, 8, 22) },
      { title: 'ATI Pathophysiology Modules',         type: 'Video', url: '#', syncedFromPrism: true,  updatedDate: isoDate(2025, 9, 1) },
    ],
  },

  {
    ...courseOfferingRows[10],
    hoursPerWeek: 5,
    courseType: 'Core',
    department: 'Pharmacy Sciences',
    description:
      'Advanced clinical pharmacology with emphasis on therapeutic decision-making across complex patient populations including polypharmacy, frailty, and multi-morbidity.',
    objectives: [
      'Develop individualised drug therapy plans for complex patients',
      'Apply deprescribing principles to polypharmacy management',
      'Evaluate pharmacogenomic data in therapeutic selection',
      'Coordinate interprofessional therapy management plans',
    ],
    qbAnalytics: {
      total: 60,
      measurePct: 22,
      competencyPct: 10,
      untagged: 68,
      aiFlagged: 31,
      neverUsed: 55,
      bloomsDist: { remember: 42, understand: 28, apply: 16, analyze: 8, evaluate: 4, create: 2 },
    },
    students: [],
    faculty: [
      { id: 'fac-001', name: 'Dr. Sarah Mitchell', role: 'Course Coordinator' },
      { id: 'fac-002', name: 'Dr. Priya Nair',     role: 'Instructor' },
    ],
    assessments: [
      { id: 'asm-030', title: 'Therapy Management Simulation', type: 'Simulation', status: 'Draft',     date: isoDate(2026, 10, 16), students: 0, durationMinutes: 120, gradingScheme: 'Rubric',     weightage: 30 },
      { id: 'asm-031', title: 'Midterm Exam',                  type: 'Exam',       status: 'Review',    date: isoDate(2026, 10, 23), students: 0, durationMinutes: 90,  gradingScheme: 'Percentage', weightage: 30 },
      { id: 'asm-032', title: 'Final OSCE',                    type: 'OSCE',       status: 'Scheduled', date: isoDate(2026, 12, 4),  students: 0, durationMinutes: 45,  gradingScheme: 'Pass/Fail',  weightage: 40 },
    ],
    resources: [
      { title: 'Dipiro Pharmacotherapy — 12th Ed', type: 'PDF',   url: '#', syncedFromPrism: false },
      { title: 'AGS Beers Criteria 2023',          type: 'Link',  url: '#', syncedFromPrism: false },
      { title: 'Polypharmacy Case Library',        type: 'Video', url: '#', syncedFromPrism: false },
    ],
  },

  {
    ...courseOfferingRows[11],
    hoursPerWeek: 4,
    courseType: 'Elective',
    department: 'Biological Sciences',
    description:
      'Principles of classical and molecular genetics through to modern genomics and precision medicine, with emphasis on hereditary disease and pharmacogenomics.',
    objectives: [
      'Analyse pedigrees for major patterns of Mendelian inheritance',
      'Interpret whole-exome sequencing reports in a clinical context',
      'Apply pharmacogenomic data to individualise drug prescribing',
      'Evaluate ethical implications of genetic testing',
    ],
    qbAnalytics: {
      total: 45,
      measurePct: 18,
      competencyPct: 8,
      untagged: 74,
      aiFlagged: 35,
      neverUsed: 62,
      bloomsDist: { remember: 46, understand: 26, apply: 14, analyze: 8, evaluate: 4, create: 2 },
    },
    students: [],
    faculty: [
      { id: 'fac-003', name: 'Dr. James Okafor', role: 'Course Coordinator' },
    ],
    assessments: [
      { id: 'asm-033', title: 'Pedigree Analysis Assignment', type: 'Assignment', status: 'Draft',     date: isoDate(2026, 9, 25),  students: 0, durationMinutes: undefined, gradingScheme: 'Rubric',     weightage: 20 },
      { id: 'asm-034', title: 'Midterm Exam',                 type: 'Exam',       status: 'Draft',     date: isoDate(2026, 10, 30), students: 0, durationMinutes: 90,        gradingScheme: 'Percentage', weightage: 40 },
      { id: 'asm-035', title: 'Genomics Journal Club',        type: 'Seminar',    status: 'Scheduled', date: isoDate(2026, 11, 20), students: 0, durationMinutes: 60,        gradingScheme: 'Rubric',     weightage: 40 },
    ],
    resources: [
      { title: 'Thompson & Thompson Genetics in Medicine', type: 'PDF',  url: '#', syncedFromPrism: false },
      { title: 'OMIM — Online Mendelian Inheritance in Man', type: 'Link', url: '#', syncedFromPrism: false },
    ],
  },

  {
    ...courseOfferingRows[12],
    hoursPerWeek: 6,
    courseType: 'Core',
    department: 'Anatomy & Physiology',
    description:
      'In-depth study of central and peripheral nervous system anatomy with emphasis on neural circuits relevant to motor control, sensory processing, and clinical neurology.',
    objectives: [
      'Trace ascending and descending neural pathways',
      'Localise neurological lesions based on clinical signs',
      'Interpret basic neuroimaging (MRI) in light of anatomy',
      'Apply knowledge of cranial nerve nuclei to cranial nerve examination',
    ],
    qbAnalytics: {
      total: 80,
      measurePct: 31,
      competencyPct: 18,
      untagged: 59,
      aiFlagged: 27,
      neverUsed: 48,
      bloomsDist: { remember: 40, understand: 26, apply: 18, analyze: 10, evaluate: 4, create: 2 },
    },
    students: [],
    faculty: [
      { id: 'fac-004', name: 'Prof. Meena Patel',    role: 'Course Coordinator' },
      { id: 'fac-005', name: 'Dr. Raj Krishnaswamy', role: 'Instructor' },
    ],
    assessments: [
      { id: 'asm-036', title: 'Lesion Localisation Quiz', type: 'Quiz',      status: 'Draft',     date: isoDate(2026, 9, 18),  students: 0, durationMinutes: 30, gradingScheme: 'Percentage', weightage: 10 },
      { id: 'asm-037', title: 'Midterm Exam',              type: 'Exam',      status: 'Review',    date: isoDate(2026, 10, 9),  students: 0, durationMinutes: 90, gradingScheme: 'Percentage', weightage: 30 },
      { id: 'asm-038', title: 'Neuroimaging Practical',   type: 'Practical',  status: 'Scheduled', date: isoDate(2026, 11, 13), students: 0, durationMinutes: 60, gradingScheme: 'Pass/Fail',  weightage: 20 },
      { id: 'asm-039', title: 'Final Exam',               type: 'Exam',       status: 'Scheduled', date: isoDate(2026, 12, 4),  students: 0, durationMinutes: 120,gradingScheme: 'Percentage', weightage: 40 },
    ],
    resources: [
      { title: 'Blumenfeld Neuroanatomy through Clinical Cases — 3rd Ed', type: 'PDF',   url: '#', syncedFromPrism: false },
      { title: 'Radiopaedia — Neuroradiology Atlas',                       type: 'Link',  url: '#', syncedFromPrism: false },
      { title: 'Neural Pathway Animations Library',                        type: 'Video', url: '#', syncedFromPrism: false },
    ],
  },

  {
    ...courseOfferingRows[13],
    hoursPerWeek: 3,
    courseType: 'Core',
    department: 'Nursing Science',
    description:
      'Develops advanced clinical reasoning skills for complex and ambiguous patient presentations using structured decision frameworks, simulation, and reflective practice.',
    objectives: [
      'Apply clinical decision frameworks to complex patient presentations',
      'Demonstrate diagnostic reasoning using pattern recognition and hypothesis testing',
      'Manage diagnostic uncertainty in high-acuity scenarios',
      'Lead interprofessional decision-making in simulation environments',
    ],
    qbAnalytics: {
      total: 20,
      measurePct: 8,
      competencyPct: 0,
      untagged: 90,
      aiFlagged: 48,
      neverUsed: 78,
      bloomsDist: { remember: 55, understand: 25, apply: 12, analyze: 5, evaluate: 2, create: 1 },
    },
    students: [],
    faculty: [
      { id: 'fac-006', name: 'Dr. Carlos Rivera', role: 'Course Coordinator' },
      { id: 'fac-009', name: 'Prof. Anne Walsh',  role: 'Instructor' },
    ],
    assessments: [
      { id: 'asm-040', title: 'Clinical Reasoning OSCE',       type: 'OSCE',       status: 'Draft',     date: isoDate(2026, 10, 2),  students: 0, durationMinutes: 45,  gradingScheme: 'Pass/Fail',  weightage: 30 },
      { id: 'asm-041', title: 'Case Presentation — Acute Care', type: 'Seminar',   status: 'Scheduled', date: isoDate(2026, 11, 6),  students: 0, durationMinutes: 60,  gradingScheme: 'Rubric',     weightage: 30 },
      { id: 'asm-042', title: 'Final Simulation Exam',          type: 'Simulation', status: 'Scheduled', date: isoDate(2026, 12, 11), students: 0, durationMinutes: 120, gradingScheme: 'Rubric',     weightage: 40 },
    ],
    resources: [
      { title: 'Thinking in Systems — Meadows',             type: 'PDF',   url: '#', syncedFromPrism: false },
      { title: 'Clinical Reasoning Modules — Aquifer',      type: 'Link',  url: '#', syncedFromPrism: false },
      { title: 'SBAR Communication Framework Video Series', type: 'Video', url: '#', syncedFromPrism: false },
    ],
  },
]
