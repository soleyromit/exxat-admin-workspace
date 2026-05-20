/**
 * FACULTY MOCK DATA — for course-detail surfaces
 *
 * Built to satisfy Aarti's email demands across:
 *   - Students (per-course roster + performance)
 *   - Accommodations (per-course, owned by Student Services)
 *   - Course Objectives + the curricular assessment loop
 *   - Assessment approval workflow states
 *   - Embedded psychometric intelligence (point-biserial, distractors, distribution)
 *   - Live monitoring snapshots
 *
 * All mocked client-side. Course IDs align with lib/qb-mock-data.ts so faculty
 * session filters work end-to-end.
 *
 * ── Faculty base entity (added 2026-05-17) ───────────────────────────────────
 * FacultyListRow and ExtendedFaculty added for the Faculty list/detail pages.
 * facultyAccommodations already existed — preserved unchanged.
 */

// ─── Faculty base entity types ────────────────────────────────────────────────

export type FacultyAdminPosition = 'Program Director' | 'Course Coordinator' | 'Instructor' | 'Adjunct'
export type FacultyRank = 'Professor' | 'Associate Professor' | 'Assistant Professor' | 'Lecturer'

export interface FacultyListRow {
  id: string
  fullName: string
  facultyId: string         // SIS person_sourcedid (Canvas lis.person_sourcedid)
  email: string
  adminPosition: FacultyAdminPosition
  rank: FacultyRank
  status: 'active' | 'inactive'
  coursesAssigned: number
  lastUpdated: string
  /** LTI sub claim / Canvas user_id — auto-populated via LTI launch or Canvas SIS import */
  canvasUserId?: string
  /** Canvas login_id (username) — auto-populated when Canvas active */
  loginId?: string
}

export interface FacultyCourse {
  id: string
  code: string
  name: string
  term: string
  students: number
  status: 'active' | 'completed' | 'upcoming'
}

export interface FacultyAssessment {
  id: string
  title: string
  course: string
  status: string
  date: string
}

export interface ExtendedFaculty extends FacultyListRow {
  phone?: string
  department: string
  joinDate: string
  bio?: string
  courses: FacultyCourse[]
  assessmentsManaged: FacultyAssessment[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysAgoFacultyIso(d: number): string {
  const dt = new Date('2026-05-17')
  dt.setDate(dt.getDate() - d)
  return dt.toISOString().split('T')[0]
}

// ─── Faculty list rows (12 records) ──────────────────────────────────────────

export const facultyListRows: FacultyListRow[] = [
  {
    id: 'fac-001',
    fullName: 'Dr. Anita Rao',
    facultyId: 'FAC-2019-0042',
    email: 'anita.rao@university.edu',
    adminPosition: 'Program Director',
    rank: 'Professor',
    status: 'active',
    coursesAssigned: 3,
    lastUpdated: daysAgoFacultyIso(2),
  },
  {
    id: 'fac-002',
    fullName: 'Dr. Marcus Webb',
    facultyId: 'FAC-2021-0118',
    email: 'marcus.webb@university.edu',
    adminPosition: 'Course Coordinator',
    rank: 'Associate Professor',
    status: 'active',
    coursesAssigned: 2,
    lastUpdated: daysAgoFacultyIso(5),
  },
  {
    id: 'fac-003',
    fullName: 'Prof. Sandra Chen',
    facultyId: 'FAC-2018-0031',
    email: 'sandra.chen@university.edu',
    adminPosition: 'Instructor',
    rank: 'Assistant Professor',
    status: 'active',
    coursesAssigned: 4,
    lastUpdated: daysAgoFacultyIso(1),
  },
  {
    id: 'fac-004',
    fullName: 'Dr. James Okafor',
    facultyId: 'FAC-2022-0207',
    email: 'james.okafor@university.edu',
    adminPosition: 'Instructor',
    rank: 'Associate Professor',
    status: 'active',
    coursesAssigned: 2,
    lastUpdated: daysAgoFacultyIso(8),
  },
  {
    id: 'fac-005',
    fullName: 'Prof. Meena Patel',
    facultyId: 'FAC-2020-0088',
    email: 'meena.patel@university.edu',
    adminPosition: 'Course Coordinator',
    rank: 'Professor',
    status: 'active',
    coursesAssigned: 3,
    lastUpdated: daysAgoFacultyIso(3),
  },
  {
    id: 'fac-006',
    fullName: 'Dr. Carlos Rivera',
    facultyId: 'FAC-2023-0315',
    email: 'carlos.rivera@university.edu',
    adminPosition: 'Adjunct',
    rank: 'Lecturer',
    status: 'active',
    coursesAssigned: 1,
    lastUpdated: daysAgoFacultyIso(14),
  },
  {
    id: 'fac-007',
    fullName: 'Dr. Sarah Mitchell',
    facultyId: 'FAC-2017-0019',
    email: 'sarah.mitchell@university.edu',
    adminPosition: 'Program Director',
    rank: 'Professor',
    status: 'active',
    coursesAssigned: 2,
    lastUpdated: daysAgoFacultyIso(6),
  },
  {
    id: 'fac-008',
    fullName: 'Prof. David Kim',
    facultyId: 'FAC-2021-0142',
    email: 'david.kim@university.edu',
    adminPosition: 'Instructor',
    rank: 'Assistant Professor',
    status: 'active',
    coursesAssigned: 3,
    lastUpdated: daysAgoFacultyIso(9),
  },
  {
    id: 'fac-009',
    fullName: 'Dr. Fatima Al-Hassan',
    facultyId: 'FAC-2022-0198',
    email: 'fatima.alhassan@university.edu',
    adminPosition: 'Course Coordinator',
    rank: 'Associate Professor',
    status: 'active',
    coursesAssigned: 2,
    lastUpdated: daysAgoFacultyIso(11),
  },
  {
    id: 'fac-010',
    fullName: 'Prof. Robert Nguyen',
    facultyId: 'FAC-2016-0008',
    email: 'robert.nguyen@university.edu',
    adminPosition: 'Adjunct',
    rank: 'Lecturer',
    status: 'inactive',
    coursesAssigned: 0,
    lastUpdated: daysAgoFacultyIso(45),
  },
  {
    id: 'fac-011',
    fullName: 'Dr. Priya Sharma',
    facultyId: 'FAC-2024-0401',
    email: 'priya.sharma@university.edu',
    adminPosition: 'Instructor',
    rank: 'Assistant Professor',
    status: 'active',
    coursesAssigned: 1,
    lastUpdated: daysAgoFacultyIso(4),
  },
  {
    id: 'fac-012',
    fullName: 'Dr. Thomas Eriksson',
    facultyId: 'FAC-2019-0057',
    email: 'thomas.eriksson@university.edu',
    adminPosition: 'Course Coordinator',
    rank: 'Associate Professor',
    status: 'inactive',
    coursesAssigned: 0,
    lastUpdated: daysAgoFacultyIso(62),
  },
]

// ─── Extended faculty data (12 detailed records) ──────────────────────────────

export const allFaculty: ExtendedFaculty[] = [
  {
    ...facultyListRows[0],
    phone: '+1 (617) 555-0142',
    department: 'Doctor of Physical Therapy',
    joinDate: '2019-08-15',
    bio: 'Dr. Rao specializes in pharmacological education and has led curriculum development across three health sciences programs. She serves as the accreditation liaison for CAPTE.',
    courses: [
      { id: 'course-phar101', code: 'PHAR 101', name: 'Pharmacology I', term: 'Spring 2026', students: 32, status: 'active' },
      { id: 'course-phar201', code: 'PHAR 201', name: 'Pharmacology II', term: 'Spring 2026', students: 28, status: 'active' },
      { id: 'course-phar101-f25', code: 'PHAR 101', name: 'Pharmacology I', term: 'Fall 2025', students: 30, status: 'completed' },
    ],
    assessmentsManaged: [
      { id: 'asmt-001', title: 'Midterm Exam', course: 'PHAR 101', status: 'Approved', date: daysAgoFacultyIso(5) },
      { id: 'asmt-002', title: 'Final Exam', course: 'PHAR 101', status: 'Pending Review', date: daysAgoFacultyIso(2) },
      { id: 'asmt-phar101-003', title: 'Quiz 3: Drug Interactions', course: 'PHAR 101', status: 'Changes Requested', date: daysAgoFacultyIso(3) },
      { id: 'asmt-phar101-004', title: 'Practical Skills Check', course: 'PHAR 101', status: 'In Progress', date: daysAgoFacultyIso(1) },
    ],
  },
  {
    ...facultyListRows[1],
    phone: '+1 (617) 555-0287',
    department: 'Doctor of Physical Therapy',
    joinDate: '2021-01-10',
    bio: 'Dr. Webb focuses on adaptive testing and accommodation administration. He chairs the ADA coordination committee for the health sciences division.',
    courses: [
      { id: 'course-biol201', code: 'BIOL 201', name: 'Cell Biology', term: 'Spring 2026', students: 28, status: 'active' },
      { id: 'course-biol201-f25', code: 'BIOL 201', name: 'Cell Biology', term: 'Fall 2025', students: 25, status: 'completed' },
    ],
    assessmentsManaged: [
      { id: 'asmt-003', title: 'Unit 1 Quiz', course: 'BIOL 201', status: 'Results Published', date: daysAgoFacultyIso(35) },
      { id: 'asmt-biol201-002', title: 'Cell Signaling Unit Test', course: 'BIOL 201', status: 'Pending Review', date: daysAgoFacultyIso(1) },
    ],
  },
  {
    ...facultyListRows[2],
    phone: '+1 (617) 555-0193',
    department: 'Master of Occupational Therapy',
    joinDate: '2018-09-01',
    bio: 'Prof. Chen coordinates student services outreach and manages accommodation workflows across all health sciences courses. Published researcher in inclusive assessment design.',
    courses: [
      { id: 'course-skel101', code: 'SKEL 101', name: 'Skeletal Anatomy', term: 'Spring 2026', students: 24, status: 'active' },
      { id: 'course-anat301', code: 'ANAT 301', name: 'Clinical Anatomy', term: 'Spring 2026', students: 22, status: 'active' },
      { id: 'course-skel101-f25', code: 'SKEL 101', name: 'Skeletal Anatomy', term: 'Fall 2025', students: 26, status: 'completed' },
      { id: 'course-anat301-f25', code: 'ANAT 301', name: 'Clinical Anatomy', term: 'Fall 2025', students: 20, status: 'completed' },
    ],
    assessmentsManaged: [
      { id: 'asmt-skel101-001', title: 'Anatomy Lab Practical', course: 'SKEL 101', status: 'Approved', date: daysAgoFacultyIso(7) },
      { id: 'asmt-anat301-001', title: 'Midterm — Clinical Anatomy', course: 'ANAT 301', status: 'Draft', date: daysAgoFacultyIso(12) },
    ],
  },
  {
    ...facultyListRows[3],
    phone: '+1 (617) 555-0344',
    department: 'Doctor of Physical Therapy',
    joinDate: '2022-07-18',
    bio: 'Dr. Okafor specializes in evidence-based clinical reasoning pedagogy. He integrates case-based learning with formative assessment design.',
    courses: [
      { id: 'course-clin201', code: 'CLIN 201', name: 'Clinical Reasoning I', term: 'Spring 2026', students: 30, status: 'active' },
      { id: 'course-clin201-f25', code: 'CLIN 201', name: 'Clinical Reasoning I', term: 'Fall 2025', students: 29, status: 'completed' },
    ],
    assessmentsManaged: [
      { id: 'asmt-clin201-001', title: 'Case Study Midterm', course: 'CLIN 201', status: 'In Progress', date: daysAgoFacultyIso(1) },
      { id: 'asmt-clin201-002', title: 'Reasoning Skills Quiz', course: 'CLIN 201', status: 'Results Published', date: daysAgoFacultyIso(20) },
    ],
  },
  {
    ...facultyListRows[4],
    phone: '+1 (617) 555-0471',
    department: 'Doctor of Pharmacy',
    joinDate: '2020-03-01',
    bio: 'Prof. Patel is an expert in pharmaceutical sciences education and OSCE design. She leads the interprofessional education initiative across the pharmacy and nursing programs.',
    courses: [
      { id: 'course-phsc301', code: 'PHSC 301', name: 'Pharmaceutical Sciences', term: 'Spring 2026', students: 35, status: 'active' },
      { id: 'course-phsc401', code: 'PHSC 401', name: 'Advanced Pharmaceutics', term: 'Spring 2026', students: 18, status: 'upcoming' },
      { id: 'course-phsc301-f25', code: 'PHSC 301', name: 'Pharmaceutical Sciences', term: 'Fall 2025', students: 33, status: 'completed' },
    ],
    assessmentsManaged: [
      { id: 'asmt-phsc301-001', title: 'Formulation Midterm', course: 'PHSC 301', status: 'Approved', date: daysAgoFacultyIso(4) },
      { id: 'asmt-phsc301-002', title: 'Drug Delivery Systems Quiz', course: 'PHSC 301', status: 'Draft', date: daysAgoFacultyIso(10) },
      { id: 'asmt-phsc401-001', title: 'Advanced Pharmaceutics Intro', course: 'PHSC 401', status: 'Draft', date: daysAgoFacultyIso(15) },
    ],
  },
  {
    ...facultyListRows[5],
    phone: undefined,
    department: 'Master of Occupational Therapy',
    joinDate: '2023-09-05',
    bio: undefined,
    courses: [
      { id: 'course-ot101', code: 'OT 101', name: 'Occupational Therapy Foundations', term: 'Spring 2026', students: 20, status: 'active' },
    ],
    assessmentsManaged: [
      { id: 'asmt-ot101-001', title: 'OT Foundations Quiz 1', course: 'OT 101', status: 'Results Published', date: daysAgoFacultyIso(14) },
    ],
  },
  {
    ...facultyListRows[6],
    phone: '+1 (617) 555-0619',
    department: 'Doctor of Physical Therapy',
    joinDate: '2017-08-20',
    bio: 'Dr. Mitchell directs the DPT program and has over 15 years of experience in musculoskeletal assessment and clinical education. She chairs the curriculum committee.',
    courses: [
      { id: 'course-pt301', code: 'PT 301', name: 'Musculoskeletal Assessment', term: 'Spring 2026', students: 27, status: 'active' },
      { id: 'course-pt401', code: 'PT 401', name: 'Advanced Clinical Practice', term: 'Spring 2026', students: 22, status: 'upcoming' },
    ],
    assessmentsManaged: [
      { id: 'asmt-pt301-001', title: 'Musculoskeletal Midterm', course: 'PT 301', status: 'In Progress', date: daysAgoFacultyIso(1) },
      { id: 'asmt-pt301-002', title: 'Range of Motion Practical', course: 'PT 301', status: 'Approved', date: daysAgoFacultyIso(8) },
    ],
  },
  {
    ...facultyListRows[7],
    phone: '+1 (617) 555-0752',
    department: 'Doctor of Pharmacy',
    joinDate: '2021-06-14',
    bio: 'Prof. Kim applies active learning strategies to pharmacotherapy instruction. His research focuses on spaced retrieval practice in health professions education.',
    courses: [
      { id: 'course-phar301', code: 'PHAR 301', name: 'Pharmacotherapy I', term: 'Spring 2026', students: 31, status: 'active' },
      { id: 'course-phar302', code: 'PHAR 302', name: 'Pharmacotherapy II', term: 'Spring 2026', students: 29, status: 'active' },
      { id: 'course-phar301-f25', code: 'PHAR 301', name: 'Pharmacotherapy I', term: 'Fall 2025', students: 28, status: 'completed' },
    ],
    assessmentsManaged: [
      { id: 'asmt-phar301-001', title: 'Pharmacotherapy Case Exam', course: 'PHAR 301', status: 'Results Published', date: daysAgoFacultyIso(22) },
      { id: 'asmt-phar302-001', title: 'Drug Therapy Midterm', course: 'PHAR 302', status: 'Pending Review', date: daysAgoFacultyIso(3) },
      { id: 'asmt-phar302-002', title: 'Pharmacotherapy Quiz 2', course: 'PHAR 302', status: 'Draft', date: daysAgoFacultyIso(7) },
    ],
  },
  {
    ...facultyListRows[8],
    phone: '+1 (617) 555-0883',
    department: 'Master of Occupational Therapy',
    joinDate: '2022-01-03',
    bio: 'Dr. Al-Hassan coordinates the OT curriculum and specializes in mental health occupational therapy. She oversees assessment design for Level II fieldwork competencies.',
    courses: [
      { id: 'course-ot201', code: 'OT 201', name: 'Mental Health OT', term: 'Spring 2026', students: 18, status: 'active' },
      { id: 'course-ot301', code: 'OT 301', name: 'Fieldwork Seminar', term: 'Spring 2026', students: 22, status: 'active' },
    ],
    assessmentsManaged: [
      { id: 'asmt-ot201-001', title: 'Mental Health Case Study', course: 'OT 201', status: 'Approved', date: daysAgoFacultyIso(5) },
      { id: 'asmt-ot301-001', title: 'Fieldwork Competency Check', course: 'OT 301', status: 'Draft', date: daysAgoFacultyIso(9) },
    ],
  },
  {
    ...facultyListRows[9],
    phone: undefined,
    department: 'Doctor of Physical Therapy',
    joinDate: '2016-09-01',
    bio: 'Prof. Nguyen retired from full-time teaching in 2025 after 9 years in the program. No active course assignments.',
    courses: [],
    assessmentsManaged: [],
  },
  {
    ...facultyListRows[10],
    phone: '+1 (617) 555-1001',
    department: 'Doctor of Pharmacy',
    joinDate: '2024-01-15',
    bio: 'Dr. Sharma joined the pharmacy faculty in 2024, bringing expertise in clinical toxicology and bioavailability research.',
    courses: [
      { id: 'course-tox101', code: 'TOX 101', name: 'Clinical Toxicology', term: 'Spring 2026', students: 16, status: 'active' },
    ],
    assessmentsManaged: [
      { id: 'asmt-tox101-001', title: 'Toxicology Unit Quiz', course: 'TOX 101', status: 'Results Published', date: daysAgoFacultyIso(17) },
    ],
  },
  {
    ...facultyListRows[11],
    phone: undefined,
    department: 'Master of Occupational Therapy',
    joinDate: '2019-03-12',
    bio: undefined,
    courses: [],
    assessmentsManaged: [],
  },
]

// ─── Students ────────────────────────────────────────────────────────────────

export type StudentStatus = 'active' | 'at-risk' | 'top-performer' | 'inactive'

export interface Student {
  id: string
  studentId: string         // institutional ID / SIS user_id (Canvas lis.person_sourcedid)
  firstName: string
  lastName: string
  email: string
  initials: string
  cohort: string            // e.g. "PT Class of 2027"
  enrolledCourseIds: string[]
  /** Average score across this student's assessments in the course (0-100). */
  avgScore: Record<string, number> // courseId → avg
  /** Last activity date (ISO). */
  lastActivity: string
  status: StudentStatus
  /** LTI sub claim / Canvas user_id — auto-populated via LTI launch or Canvas SIS import */
  canvasUserId?: string
  /** Canvas login_id (username) — auto-populated when Canvas active */
  loginId?: string
}

export const facultyStudents: Student[] = [
  // PHAR101 cohort (32 students)
  ...generateCohort('phar101', 32, 'PT Class of 2027', ['course-phar101']),
  // BIOL201 cohort (28 students)
  ...generateCohort('biol201', 28, 'PT Class of 2027', ['course-biol201']),
  // SKEL101 cohort (24 students, viewer access)
  ...generateCohort('skel101', 24, 'PT Class of 2028', ['course-skel101']),
]

function generateCohort(
  courseSlug: string,
  count: number,
  cohort: string,
  courseIds: string[]
): Student[] {
  const firstNames = [
    'Maya', 'Liam', 'Aanya', 'Noah', 'Priya', 'Ethan', 'Sara', 'Owen', 'Nia',
    'Caleb', 'Yuki', 'Diego', 'Anika', 'Theo', 'Ramona', 'Marcus', 'Elena',
    'Kai', 'Zoe', 'Jamal', 'Ines', 'Asha', 'Ravi', 'Mei', 'Sofia', 'Omar',
    'Lila', 'Arjun', 'Tess', 'Felix', 'Iris', 'Kenji'
  ]
  const lastNames = [
    'Acharya', 'Bennet', 'Cho', 'Dasari', 'Espinoza', 'Fernandes', 'Gupta',
    'Hammond', 'Ibarra', 'Joseph', 'Kapoor', 'Lima', 'Mendez', 'Nair', 'Okafor',
    'Patel', 'Quinn', 'Reyes', 'Sato', 'Thakur', 'Upadhyay', 'Vega', 'Williams',
    'Xu', 'Yamamoto', 'Zia', 'Albright', 'Brennan', 'Chowdhury', 'Diaz',
    'Eklund', 'Foster'
  ]
  const out: Student[] = []
  for (let i = 0; i < count; i++) {
    const fn = firstNames[i % firstNames.length]
    const ln = lastNames[(i * 7) % lastNames.length]
    const seed = (i + 1) * 13
    const score = 55 + ((seed * 17) % 45)
    const status: StudentStatus =
      score >= 88 ? 'top-performer' : score < 65 ? 'at-risk' : 'active'
    out.push({
      id: `stu-${courseSlug}-${String(i + 1).padStart(3, '0')}`,
      studentId: `STU-2024-${String(1000 + seed).padStart(4, '0')}`,
      firstName: fn,
      lastName: ln,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@university.edu`,
      initials: `${fn[0]}${ln[0]}`,
      cohort,
      enrolledCourseIds: courseIds,
      avgScore: Object.fromEntries(courseIds.map(id => [id, score])),
      lastActivity: daysAgoIso(seed % 14),
      status,
    })
  }
  return out
}

function daysAgoIso(d: number): string {
  const dt = new Date()
  dt.setDate(dt.getDate() - d)
  return dt.toISOString()
}

// ─── Accommodations ──────────────────────────────────────────────────────────

export type AccommodationType = 'extended-time' | 'separate-room' | 'extended-breaks' | 'screen-reader' | 'quiet-room'

export interface Accommodation {
  id: string
  studentId: string
  courseId: string
  type: AccommodationType
  detail: string                  // e.g., "1.5× time multiplier"
  approvedBy: string              // Student Services coordinator
  approvedDate: string            // ISO
  expiryDate?: string             // ISO; null = full term
  notes?: string
}

export const facultyAccommodations: Accommodation[] = [
  // PHAR101 — 6 accommodations across the cohort
  acc('phar101-001', 'stu-phar101-003', 'course-phar101', 'extended-time', '1.5× time multiplier', 'Sandra Chen, M.Ed.', daysAgoIso(120)),
  acc('phar101-002', 'stu-phar101-003', 'course-phar101', 'separate-room', 'Private testing room', 'Sandra Chen, M.Ed.', daysAgoIso(120)),
  acc('phar101-003', 'stu-phar101-007', 'course-phar101', 'extended-time', '2× time multiplier (testing accommodation)', 'Sandra Chen, M.Ed.', daysAgoIso(95), undefined, 'Documented learning disability — extended time approved by ADA Office.'),
  acc('phar101-004', 'stu-phar101-014', 'course-phar101', 'extended-breaks', '15-min break every 60 min', 'Marcus Webb, ADA Coord.', daysAgoIso(58)),
  acc('phar101-005', 'stu-phar101-019', 'course-phar101', 'screen-reader', 'JAWS screen-reader compatibility required', 'Sandra Chen, M.Ed.', daysAgoIso(204)),
  acc('phar101-006', 'stu-phar101-025', 'course-phar101', 'quiet-room', 'Quiet testing environment, low-stim', 'Marcus Webb, ADA Coord.', daysAgoIso(73)),
  // BIOL201 — 4
  acc('biol201-001', 'stu-biol201-002', 'course-biol201', 'extended-time', '1.5× time multiplier', 'Sandra Chen, M.Ed.', daysAgoIso(140)),
  acc('biol201-002', 'stu-biol201-009', 'course-biol201', 'extended-breaks', '10-min break every 45 min', 'Marcus Webb, ADA Coord.', daysAgoIso(88)),
  acc('biol201-003', 'stu-biol201-016', 'course-biol201', 'separate-room', 'Private testing room', 'Sandra Chen, M.Ed.', daysAgoIso(45)),
  acc('biol201-004', 'stu-biol201-021', 'course-biol201', 'extended-time', '1.5× time multiplier', 'Sandra Chen, M.Ed.', daysAgoIso(160)),
  // SKEL101 — 2 (viewer-mode, faculty can see but not edit anyway)
  acc('skel101-001', 'stu-skel101-005', 'course-skel101', 'extended-time', '1.5× time multiplier', 'Sandra Chen, M.Ed.', daysAgoIso(110)),
  acc('skel101-002', 'stu-skel101-012', 'course-skel101', 'screen-reader', 'NVDA screen-reader required', 'Marcus Webb, ADA Coord.', daysAgoIso(30)),
]

function acc(
  id: string,
  studentId: string,
  courseId: string,
  type: AccommodationType,
  detail: string,
  approvedBy: string,
  approvedDate: string,
  expiryDate?: string,
  notes?: string
): Accommodation {
  return { id: `acc-${id}`, studentId, courseId, type, detail, approvedBy, approvedDate, expiryDate, notes }
}

// ─── Course Objectives (curricular loop) ─────────────────────────────────────

export interface CourseObjective {
  id: string
  courseId: string
  code: string                  // e.g. "PHAR101-OBJ-1"
  title: string                 // e.g. "Describe pharmacokinetic principles"
  bloomsLevel: 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create'
  /** Number of questions tagged to this objective in QB. */
  questionCount: number
  /** Times this objective has been assessed across all assessments in the course. */
  assessmentsCovered: number
  /** Mean student performance on questions tagged to this objective (0-100). */
  avgPerformance: number
  /** ISO timestamp of last assessment that included this objective. */
  lastAssessed: string | null
}

export const courseObjectives: CourseObjective[] = [
  // PHAR101 — Pharmacology I
  obj('phar101', 1, 'course-phar101', 'Describe pharmacokinetic principles (ADME)', 'Understand', 14, 4, 78, 6),
  obj('phar101', 2, 'course-phar101', 'Apply dose-calculation methods to clinical scenarios', 'Apply', 22, 5, 71, 3),
  obj('phar101', 3, 'course-phar101', 'Analyze drug-drug interaction mechanisms', 'Analyze', 18, 3, 64, 12),
  obj('phar101', 4, 'course-phar101', 'Evaluate adverse-event risk profiles', 'Evaluate', 9, 2, 69, 21),
  obj('phar101', 5, 'course-phar101', 'Distinguish receptor agonist vs antagonist effects', 'Understand', 11, 4, 82, 6),
  obj('phar101', 6, 'course-phar101', 'Recognize black-box warning indications', 'Remember', 7, 1, null as unknown as number, null), // untested gap
  // BIOL201 — Cell Biology
  obj('biol201', 1, 'course-biol201', 'Identify organelle structure-function relationships', 'Understand', 16, 3, 81, 5),
  obj('biol201', 2, 'course-biol201', 'Apply cell-signaling cascade logic', 'Apply', 12, 2, 73, 18),
  obj('biol201', 3, 'course-biol201', 'Analyze membrane transport mechanisms', 'Analyze', 14, 2, 68, 18),
  obj('biol201', 4, 'course-biol201', 'Evaluate cell-cycle checkpoint failures', 'Evaluate', 8, 1, 74, 32),
  obj('biol201', 5, 'course-biol201', 'Compare apoptosis vs necrosis pathways', 'Understand', 6, 0, null as unknown as number, null), // untested
  // SKEL101 — Skeletal Anatomy (viewer access)
  obj('skel101', 1, 'course-skel101', 'Identify axial vs appendicular skeleton bones', 'Remember', 24, 5, 86, 9),
  obj('skel101', 2, 'course-skel101', 'Describe joint classification by structure', 'Understand', 18, 3, 79, 14),
  obj('skel101', 3, 'course-skel101', 'Analyze biomechanics of common fracture patterns', 'Analyze', 11, 2, 67, 21),
]

function obj(
  prefix: string,
  n: number,
  courseId: string,
  title: string,
  bloomsLevel: CourseObjective['bloomsLevel'],
  questionCount: number,
  assessmentsCovered: number,
  avgPerformance: number | null,
  lastAssessedDaysAgo: number | null
): CourseObjective {
  return {
    id: `${prefix}-obj-${n}`,
    courseId,
    code: `${prefix.toUpperCase()}-OBJ-${n}`,
    title,
    bloomsLevel,
    questionCount,
    assessmentsCovered,
    avgPerformance: avgPerformance ?? 0,
    lastAssessed: lastAssessedDaysAgo == null ? null : daysAgoIso(lastAssessedDaysAgo),
  }
}

// ─── Assessment approval workflow ───────────────────────────────────────────

export type AssessmentReviewState =
  | 'draft'             // faculty editing
  | 'pending-chair'     // submitted, awaiting chair approval
  | 'changes-requested' // chair sent back with notes
  | 'approved'          // chair approved, ready to publish
  | 'published'         // students can take it
  | 'in-progress'       // active exam window
  | 'submitted'         // all students submitted, results pending
  | 'results-published' // results visible to students

export interface AssessmentReview {
  assessmentId: string
  state: AssessmentReviewState
  reviewerId: string | null      // chair faculty id
  reviewerName: string | null
  submittedAt: string | null     // ISO when faculty sent for review
  reviewedAt: string | null      // ISO when chair acted
  reviewNotes: string | null
  publishedAt: string | null
  /** When in-progress: total students enrolled & started counts. */
  enrolledCount?: number
  inProgressCount?: number
  submittedCount?: number
}

export const assessmentReviews: AssessmentReview[] = [
  // PHAR101 — 4 assessments across states
  {
    assessmentId: 'asmt-001', // Midterm Exam
    state: 'approved',
    reviewerId: 'fac-anita-rao',
    reviewerName: 'Dr. Anita Rao',
    submittedAt: daysAgoIso(8),
    reviewedAt: daysAgoIso(5),
    reviewNotes: 'Approved with no changes. Strong distribution across Bloom levels.',
    publishedAt: null,
  },
  {
    assessmentId: 'asmt-002', // Final Exam — pending chair
    state: 'pending-chair',
    reviewerId: 'fac-anita-rao',
    reviewerName: 'Dr. Anita Rao',
    submittedAt: daysAgoIso(2),
    reviewedAt: null,
    reviewNotes: null,
    publishedAt: null,
  },
  // Synthetic — additional PHAR101 assessments to round out states
  {
    assessmentId: 'asmt-phar101-003',
    state: 'changes-requested',
    reviewerId: 'fac-anita-rao',
    reviewerName: 'Dr. Anita Rao',
    submittedAt: daysAgoIso(6),
    reviewedAt: daysAgoIso(3),
    reviewNotes: 'Difficulty mix is bottom-heavy (60% Easy). Please add 4 Hard questions on drug-interaction analysis before re-submission.',
    publishedAt: null,
  },
  {
    assessmentId: 'asmt-phar101-004',
    state: 'in-progress',
    reviewerId: 'fac-anita-rao',
    reviewerName: 'Dr. Anita Rao',
    submittedAt: daysAgoIso(14),
    reviewedAt: daysAgoIso(11),
    reviewNotes: 'Approved. Clear competency mapping.',
    publishedAt: daysAgoIso(1),
    enrolledCount: 32,
    inProgressCount: 18,
    submittedCount: 11,
  },
  {
    assessmentId: 'asmt-phar101-005',
    state: 'submitted',
    reviewerId: 'fac-anita-rao',
    reviewerName: 'Dr. Anita Rao',
    submittedAt: daysAgoIso(20),
    reviewedAt: daysAgoIso(17),
    reviewNotes: 'Approved.',
    publishedAt: daysAgoIso(7),
    enrolledCount: 32,
    inProgressCount: 0,
    submittedCount: 32,
  },
  {
    assessmentId: 'asmt-phar101-006',
    state: 'results-published',
    reviewerId: 'fac-anita-rao',
    reviewerName: 'Dr. Anita Rao',
    submittedAt: daysAgoIso(35),
    reviewedAt: daysAgoIso(32),
    reviewNotes: 'Approved.',
    publishedAt: daysAgoIso(28),
    enrolledCount: 32,
    inProgressCount: 0,
    submittedCount: 32,
  },
  {
    assessmentId: 'asmt-phar101-draft-1',
    state: 'draft',
    reviewerId: null,
    reviewerName: null,
    submittedAt: null,
    reviewedAt: null,
    reviewNotes: null,
    publishedAt: null,
  },
  // BIOL201 — 2 assessments
  {
    assessmentId: 'asmt-003', // Unit 1 Quiz
    state: 'results-published',
    reviewerId: 'fac-anita-rao',
    reviewerName: 'Dr. Anita Rao',
    submittedAt: daysAgoIso(40),
    reviewedAt: daysAgoIso(38),
    reviewNotes: 'Low-stakes quiz, immediate publication.',
    publishedAt: daysAgoIso(35),
    enrolledCount: 28,
    inProgressCount: 0,
    submittedCount: 28,
  },
  {
    assessmentId: 'asmt-biol201-002',
    state: 'pending-chair',
    reviewerId: 'fac-anita-rao',
    reviewerName: 'Dr. Anita Rao',
    submittedAt: daysAgoIso(1),
    reviewedAt: null,
    reviewNotes: null,
    publishedAt: null,
  },
]

/** Synthetic assessments for PHAR101/BIOL201 to cover all approval states.
 *  Real mock-list is in qb-mock-data.ts; this extends rather than replaces. */
export const facultyExtraAssessments = [
  { id: 'asmt-phar101-003', courseId: 'course-phar101', offeringId: 'offering-phar101-s26', title: 'Quiz 3: Drug Interactions', questionCount: 25, durationMinutes: 35 },
  { id: 'asmt-phar101-004', courseId: 'course-phar101', offeringId: 'offering-phar101-s26', title: 'Practical Skills Check', questionCount: 18, durationMinutes: 45 },
  { id: 'asmt-phar101-005', courseId: 'course-phar101', offeringId: 'offering-phar101-s26', title: 'Cumulative Mid-Term', questionCount: 50, durationMinutes: 90 },
  { id: 'asmt-phar101-006', courseId: 'course-phar101', offeringId: 'offering-phar101-f25', title: 'Pharmacokinetics Unit Quiz', questionCount: 22, durationMinutes: 30 },
  { id: 'asmt-phar101-draft-1', courseId: 'course-phar101', offeringId: 'offering-phar101-s26', title: 'Receptor Pharmacology Quiz (Draft)', questionCount: 15, durationMinutes: 25 },
  { id: 'asmt-biol201-002', courseId: 'course-biol201', offeringId: 'offering-biol201-s26', title: 'Cell Signaling Unit Test', questionCount: 30, durationMinutes: 50 },
]

// ─── Question psychometrics (embedded intelligence) ─────────────────────────

export interface QuestionPsychometrics {
  questionId: string
  /** Difficulty index — proportion of students answering correctly (0-1). */
  difficultyIndex: number
  /** Point-biserial correlation between this item and total score. */
  pointBiserial: number
  /** True if the item is a negative discriminator (poorly performing students
   *  did better than top performers — usually indicates a flawed item). */
  negativeDiscriminator: boolean
  /** Per-distractor pick rate, in option order. */
  distractorRates: number[]
  /** Number of times this question has been used across assessments. */
  timesUsed: number
}

/** Sparse — populates a few QB questions with rich psychometric history. */
export const questionPsychometrics: QuestionPsychometrics[] = [
  { questionId: 'q-1',  difficultyIndex: 0.78, pointBiserial: 0.34, negativeDiscriminator: false, distractorRates: [0.78, 0.12, 0.06, 0.04], timesUsed: 8 },
  { questionId: 'q-2',  difficultyIndex: 0.42, pointBiserial: -0.08, negativeDiscriminator: true, distractorRates: [0.42, 0.31, 0.15, 0.12], timesUsed: 5 },
  { questionId: 'q-3',  difficultyIndex: 0.91, pointBiserial: 0.18, negativeDiscriminator: false, distractorRates: [0.91, 0.04, 0.03, 0.02], timesUsed: 12 },
  { questionId: 'q-4',  difficultyIndex: 0.55, pointBiserial: 0.42, negativeDiscriminator: false, distractorRates: [0.55, 0.18, 0.16, 0.11], timesUsed: 6 },
  { questionId: 'q-5',  difficultyIndex: 0.28, pointBiserial: 0.51, negativeDiscriminator: false, distractorRates: [0.28, 0.31, 0.23, 0.18], timesUsed: 4 },
  { questionId: 'q-6',  difficultyIndex: 0.67, pointBiserial: 0.28, negativeDiscriminator: false, distractorRates: [0.67, 0.14, 0.10, 0.09], timesUsed: 7 },
  { questionId: 'q-7',  difficultyIndex: 0.39, pointBiserial: 0.04, negativeDiscriminator: true, distractorRates: [0.39, 0.28, 0.18, 0.15], timesUsed: 3 },
]

// ─── Live monitor snapshot (for /assessments/[id]/monitor) ──────────────────

export interface LiveMonitorStudent {
  studentId: string
  initials: string
  status: 'in-progress' | 'submitted' | 'not-started' | 'paused'
  questionsAnswered: number
  totalQuestions: number
  /** Time remaining in seconds (per-student, accommodation-adjusted). */
  timeRemainingSec: number
  /** Number of flagged-with-comment items. */
  flaggedCount: number
  /** Last activity (ISO). */
  lastActivity: string
}

/** Shape only — actual generation happens on the page using student roster. */
export type LiveMonitorSnapshot = {
  assessmentId: string
  startedAt: string
  totalQuestions: number
  durationMinutes: number
  students: LiveMonitorStudent[]
  /** Per-question response distribution as students answer. Index = question order. */
  responseDistribution: Array<{
    questionId: string
    answered: number
    correct: number
    chosenOption: number[]      // pick rate per option, 0-1
  }>
  /** Faculty-flagged comments from students. */
  flaggedComments: Array<{
    studentId: string
    questionOrder: number
    text: string
    submittedAt: string
  }>
}
