/**
 * COURSE OFFERING BASE ENTITY — mock data for the Course Offerings module.
 *
 * Follows the same pattern as student-mock-data.ts:
 *   CourseOfferingRow — flat summary for list view
 *   ExtendedCourseOffering — full record for detail view
 *
 * 14 records spanning ongoing / completed / upcoming statuses
 * across multiple programs, cohorts, and academic years.
 *
 * Tab variations for this product: see docs/BASE-ENTITIES.md
 * Tabs: Assessments (landing) | Course Details | Students | Faculty | Measures | Resources
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CourseOfferingRow {
  id: string
  courseId: string        // links to mockCourse.id for detail-page navigation
  courseNumber: string   // e.g. 'PHARM-501'
  courseName: string
  academicYear: string   // e.g. '2025-2026'
  term: string           // e.g. 'Fall 2025'
  cohort: string
  startDate: string      // ISO date
  endDate: string        // ISO date
  registeredStudents: number
  facultyAssigned: string  // primary faculty name
  status: 'ongoing' | 'completed' | 'upcoming'
  /** Canvas course_id / LTI context.id — needed for NRPS (roster) and AGS (gradebook) API calls */
  canvasCourseId?: string
  /** SIS Course ID ($Canvas.course.sisSourceId) — auto-populated when Canvas active */
  sisCourseId?: string
}

export interface ExtendedCourseOffering extends CourseOfferingRow {
  credits: number
  hoursPerWeek: number
  courseType: 'Core' | 'Elective'
  department: string
  description?: string
  objectives: string[]
  students: Array<{
    id: string
    name: string
    email: string
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
  }>
  resources: Array<{
    title: string
    type: 'PDF' | 'Link' | 'Video'
    url?: string
  }>
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isoDate(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

// ── List rows (14 records) ────────────────────────────────────────────────────

export const courseOfferingRows: CourseOfferingRow[] = [
  // ── Ongoing ──────────────────────────────────────────────────────────────────
  {
    id: 'co-001',
    courseId: 'course-phar101',
    courseNumber: 'PHARM-501',
    courseName: 'Advanced Pharmacology',
    academicYear: '2025-2026',
    term: 'Spring 2026',
    cohort: 'DPT Cohort 2024',
    startDate: isoDate(2026, 1, 12),
    endDate: isoDate(2026, 5, 8),
    registeredStudents: 32,
    facultyAssigned: 'Dr. Sarah Mitchell',
    status: 'ongoing',
  },
  {
    id: 'co-002',
    courseId: 'course-biol201',
    courseNumber: 'BIOL-302',
    courseName: 'Cellular & Molecular Biology',
    academicYear: '2025-2026',
    term: 'Spring 2026',
    cohort: 'DPT Cohort 2024',
    startDate: isoDate(2026, 1, 12),
    endDate: isoDate(2026, 5, 8),
    registeredStudents: 28,
    facultyAssigned: 'Dr. James Okafor',
    status: 'ongoing',
  },
  {
    id: 'co-003',
    courseId: 'course-skel101',
    courseNumber: 'ANAT-401',
    courseName: 'Clinical Anatomy',
    academicYear: '2025-2026',
    term: 'Spring 2026',
    cohort: 'PharmD Cohort 2023',
    startDate: isoDate(2026, 1, 19),
    endDate: isoDate(2026, 5, 15),
    registeredStudents: 24,
    facultyAssigned: 'Prof. Meena Patel',
    status: 'ongoing',
  },
  {
    id: 'co-004',
    courseId: 'course-phar101',
    courseNumber: 'PHYS-210',
    courseName: 'Human Physiology',
    academicYear: '2025-2026',
    term: 'Spring 2026',
    cohort: 'MOT Cohort 2024',
    startDate: isoDate(2026, 2, 2),
    endDate: isoDate(2026, 5, 29),
    registeredStudents: 19,
    facultyAssigned: 'Dr. Carlos Rivera',
    status: 'ongoing',
  },
  {
    id: 'co-005',
    courseId: 'course-biol201',
    courseNumber: 'NURS-310',
    courseName: 'Evidence-Based Practice I',
    academicYear: '2025-2026',
    term: 'Spring 2026',
    cohort: 'MSN Cohort 2024',
    startDate: isoDate(2026, 1, 26),
    endDate: isoDate(2026, 5, 22),
    registeredStudents: 35,
    facultyAssigned: 'Dr. Sarah Mitchell',
    status: 'ongoing',
  },

  // ── Completed ─────────────────────────────────────────────────────────────────
  {
    id: 'co-006',
    courseId: 'course-phar101',
    courseNumber: 'PHARM-401',
    courseName: 'Pharmacokinetics',
    academicYear: '2025-2026',
    term: 'Fall 2025',
    cohort: 'DPT Cohort 2024',
    startDate: isoDate(2025, 8, 25),
    endDate: isoDate(2025, 12, 12),
    registeredStudents: 32,
    facultyAssigned: 'Dr. Sarah Mitchell',
    status: 'completed',
  },
  {
    id: 'co-007',
    courseId: 'course-biol201',
    courseNumber: 'BIOL-201',
    courseName: 'Foundations of Biology',
    academicYear: '2025-2026',
    term: 'Fall 2025',
    cohort: 'PharmD Cohort 2023',
    startDate: isoDate(2025, 8, 25),
    endDate: isoDate(2025, 12, 12),
    registeredStudents: 44,
    facultyAssigned: 'Dr. James Okafor',
    status: 'completed',
  },
  {
    id: 'co-008',
    courseId: 'course-skel101',
    courseNumber: 'ANAT-301',
    courseName: 'Musculoskeletal Anatomy',
    academicYear: '2024-2025',
    term: 'Spring 2025',
    cohort: 'DPT Cohort 2023',
    startDate: isoDate(2025, 1, 13),
    endDate: isoDate(2025, 5, 9),
    registeredStudents: 27,
    facultyAssigned: 'Prof. Meena Patel',
    status: 'completed',
  },
  {
    id: 'co-009',
    courseId: 'course-phar101',
    courseNumber: 'PHYS-101',
    courseName: 'Introductory Physiology',
    academicYear: '2024-2025',
    term: 'Fall 2024',
    cohort: 'MOT Cohort 2023',
    startDate: isoDate(2024, 8, 26),
    endDate: isoDate(2024, 12, 13),
    registeredStudents: 18,
    facultyAssigned: 'Dr. Carlos Rivera',
    status: 'completed',
  },
  {
    id: 'co-010',
    courseId: 'course-biol201',
    courseNumber: 'NURS-210',
    courseName: 'Pathophysiology',
    academicYear: '2025-2026',
    term: 'Fall 2025',
    cohort: 'MSN Cohort 2024',
    startDate: isoDate(2025, 9, 1),
    endDate: isoDate(2025, 12, 19),
    registeredStudents: 38,
    facultyAssigned: 'Dr. James Okafor',
    status: 'completed',
  },

  // ── Upcoming ──────────────────────────────────────────────────────────────────
  {
    id: 'co-011',
    courseId: 'course-phar101',
    courseNumber: 'PHARM-601',
    courseName: 'Drug Therapy Management',
    academicYear: '2026-2027',
    term: 'Fall 2026',
    cohort: 'DPT Cohort 2025',
    startDate: isoDate(2026, 8, 24),
    endDate: isoDate(2026, 12, 11),
    registeredStudents: 30,
    facultyAssigned: 'Dr. Sarah Mitchell',
    status: 'upcoming',
  },
  {
    id: 'co-012',
    courseId: 'course-biol201',
    courseNumber: 'BIOL-401',
    courseName: 'Genetics & Genomics',
    academicYear: '2026-2027',
    term: 'Fall 2026',
    cohort: 'PharmD Cohort 2024',
    startDate: isoDate(2026, 9, 7),
    endDate: isoDate(2026, 12, 18),
    registeredStudents: 26,
    facultyAssigned: 'Dr. James Okafor',
    status: 'upcoming',
  },
  {
    id: 'co-013',
    courseId: 'course-skel101',
    courseNumber: 'ANAT-501',
    courseName: 'Advanced Neuroanatomy',
    academicYear: '2026-2027',
    term: 'Fall 2026',
    cohort: 'DPT Cohort 2025',
    startDate: isoDate(2026, 8, 31),
    endDate: isoDate(2026, 12, 4),
    registeredStudents: 22,
    facultyAssigned: 'Prof. Meena Patel',
    status: 'upcoming',
  },
  {
    id: 'co-014',
    courseId: 'course-biol201',
    courseNumber: 'NURS-420',
    courseName: 'Clinical Decision Making',
    academicYear: '2026-2027',
    term: 'Fall 2026',
    cohort: 'MSN Cohort 2025',
    startDate: isoDate(2026, 9, 14),
    endDate: isoDate(2026, 12, 11),
    registeredStudents: 41,
    facultyAssigned: 'Dr. Carlos Rivera',
    status: 'upcoming',
  },
]

// ── Extended records (14 detailed records) ────────────────────────────────────

export const allCourseOfferings: ExtendedCourseOffering[] = [
  {
    ...courseOfferingRows[0],
    credits: 4,
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
    students: [
      { id: 'stu-001', name: 'Aisha Patel',    email: 'aisha.patel@university.edu',    status: 'enrolled' },
      { id: 'stu-002', name: 'Marcus Chen',    email: 'marcus.chen@university.edu',    status: 'enrolled' },
      { id: 'stu-003', name: 'Sofia Rodriguez', email: 'sofia.r@university.edu',       status: 'enrolled' },
      { id: 'stu-004', name: 'Daniel Kim',     email: 'daniel.kim@university.edu',     status: 'enrolled' },
    ],
    faculty: [
      { id: 'fac-001', name: 'Dr. Sarah Mitchell', role: 'Course Coordinator' },
      { id: 'fac-002', name: 'Dr. Priya Nair',     role: 'Instructor' },
    ],
    assessments: [
      { id: 'asm-001', title: 'Midterm Exam — Drug Classes',     type: 'Exam',   status: 'Published', date: isoDate(2026, 3, 5),  students: 32 },
      { id: 'asm-002', title: 'Case Study: Polypharmacy',        type: 'Quiz',   status: 'Draft',     date: isoDate(2026, 4, 2),  students: 0  },
      { id: 'asm-003', title: 'Final Exam — Pharmacology Board', type: 'Exam',   status: 'Upcoming',  date: isoDate(2026, 5, 1),  students: 0  },
    ],
    resources: [
      { title: 'Katzung Basic & Clinical Pharmacology — 15th Ed', type: 'PDF',   url: '#' },
      { title: 'FDA Drug Safety Communications Portal',           type: 'Link',  url: '#' },
      { title: 'Drug Interaction Checker Tutorial',               type: 'Video', url: '#' },
    ],
  },

  {
    ...courseOfferingRows[1],
    credits: 3,
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
    students: [
      { id: 'stu-005', name: 'Leila Hassan',  email: 'leila.h@university.edu',  status: 'enrolled' },
      { id: 'stu-006', name: 'Ryan Okafor',   email: 'ryan.o@university.edu',   status: 'enrolled' },
      { id: 'stu-007', name: 'Emma Torres',   email: 'emma.t@university.edu',   status: 'enrolled' },
    ],
    faculty: [
      { id: 'fac-003', name: 'Dr. James Okafor', role: 'Course Coordinator' },
    ],
    assessments: [
      { id: 'asm-004', title: 'Lab Practical — Cell Imaging',     type: 'Practical', status: 'Published', date: isoDate(2026, 2, 20), students: 28 },
      { id: 'asm-005', title: 'Midterm Exam — Molecular Biology', type: 'Exam',      status: 'Published', date: isoDate(2026, 3, 12), students: 28 },
      { id: 'asm-006', title: 'Final Project — Gene Expression',  type: 'Project',   status: 'Upcoming',  date: isoDate(2026, 4, 28), students: 0  },
    ],
    resources: [
      { title: 'Molecular Biology of the Cell — Alberts', type: 'PDF',  url: '#' },
      { title: 'NCBI Gene Expression Omnibus',            type: 'Link', url: '#' },
    ],
  },

  {
    ...courseOfferingRows[2],
    credits: 4,
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
    students: [
      { id: 'stu-008', name: 'Noah Williams',  email: 'noah.w@university.edu',  status: 'enrolled' },
      { id: 'stu-009', name: 'Chloe Anderson', email: 'chloe.a@university.edu', status: 'enrolled' },
    ],
    faculty: [
      { id: 'fac-004', name: 'Prof. Meena Patel',  role: 'Course Coordinator' },
      { id: 'fac-005', name: 'Dr. Raj Krishnaswamy', role: 'Instructor' },
    ],
    assessments: [
      { id: 'asm-007', title: 'Lab Practical I — Upper Limb', type: 'Practical', status: 'Published', date: isoDate(2026, 2, 13), students: 24 },
      { id: 'asm-008', title: 'Midterm Exam',                 type: 'Exam',      status: 'Draft',     date: isoDate(2026, 3, 20), students: 0  },
    ],
    resources: [
      { title: 'Grant\'s Atlas of Anatomy — 14th Ed', type: 'PDF',   url: '#' },
      { title: 'Radiology Masterclass — CT Anatomy',  type: 'Video', url: '#' },
    ],
  },

  {
    ...courseOfferingRows[3],
    credits: 3,
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
    students: [
      { id: 'stu-010', name: 'Amara Diallo',   email: 'amara.d@university.edu',  status: 'enrolled' },
      { id: 'stu-011', name: 'Felix Nguyen',   email: 'felix.n@university.edu',  status: 'enrolled' },
    ],
    faculty: [
      { id: 'fac-006', name: 'Dr. Carlos Rivera', role: 'Course Coordinator' },
    ],
    assessments: [
      { id: 'asm-009', title: 'Quiz 1 — Cardiovascular', type: 'Quiz', status: 'Published', date: isoDate(2026, 2, 23), students: 19 },
      { id: 'asm-010', title: 'Midterm Exam',             type: 'Exam', status: 'Upcoming',  date: isoDate(2026, 3, 27), students: 0  },
    ],
    resources: [
      { title: 'Guyton & Hall Medical Physiology — 14th Ed', type: 'PDF',  url: '#' },
      { title: 'Physiology Virtual Lab Portal',              type: 'Link', url: '#' },
    ],
  },

  {
    ...courseOfferingRows[4],
    credits: 3,
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
    students: [
      { id: 'stu-012', name: 'Isabella Park',  email: 'isabella.p@university.edu', status: 'enrolled' },
      { id: 'stu-013', name: 'Luca Ferrara',   email: 'luca.f@university.edu',     status: 'enrolled' },
      { id: 'stu-014', name: 'Grace Mensah',   email: 'grace.m@university.edu',    status: 'enrolled' },
    ],
    faculty: [
      { id: 'fac-001', name: 'Dr. Sarah Mitchell', role: 'Course Coordinator' },
      { id: 'fac-007', name: 'Prof. Linda Chow',   role: 'Instructor' },
    ],
    assessments: [
      { id: 'asm-011', title: 'PICO Worksheet',          type: 'Assignment', status: 'Published', date: isoDate(2026, 2, 10), students: 35 },
      { id: 'asm-012', title: 'Journal Club Appraisal',  type: 'Seminar',    status: 'Draft',     date: isoDate(2026, 3, 17), students: 0  },
      { id: 'asm-013', title: 'Final Evidence Report',   type: 'Project',    status: 'Upcoming',  date: isoDate(2026, 5, 5),  students: 0  },
    ],
    resources: [
      { title: 'CONSORT Checklist — RCT Reporting',   type: 'PDF',  url: '#' },
      { title: 'Cochrane Library — Systematic Reviews', type: 'Link', url: '#' },
      { title: 'EBP Lecture Series — Module 1',        type: 'Video', url: '#' },
    ],
  },

  {
    ...courseOfferingRows[5],
    credits: 3,
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
    students: [
      { id: 'stu-001', name: 'Aisha Patel',    email: 'aisha.patel@university.edu', status: 'completed' },
      { id: 'stu-002', name: 'Marcus Chen',    email: 'marcus.chen@university.edu', status: 'completed' },
      { id: 'stu-015', name: 'Omar Hassan',    email: 'omar.h@university.edu',      status: 'withdrawn' },
    ],
    faculty: [
      { id: 'fac-001', name: 'Dr. Sarah Mitchell', role: 'Course Coordinator' },
    ],
    assessments: [
      { id: 'asm-014', title: 'Problem Set 1 — One-Compartment PK', type: 'Assignment', status: 'Published', date: isoDate(2025, 9, 26),  students: 32 },
      { id: 'asm-015', title: 'Midterm Exam',                        type: 'Exam',       status: 'Published', date: isoDate(2025, 10, 24), students: 31 },
      { id: 'asm-016', title: 'Final Exam — PK Case Studies',        type: 'Exam',       status: 'Published', date: isoDate(2025, 12, 5),  students: 31 },
    ],
    resources: [
      { title: 'Applied Biopharmaceutics & Pharmacokinetics — Shargel', type: 'PDF',  url: '#' },
      { title: 'PK-Sim Simulation Software',                             type: 'Link', url: '#' },
    ],
  },

  {
    ...courseOfferingRows[6],
    credits: 4,
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
    students: [
      { id: 'stu-005', name: 'Leila Hassan',  email: 'leila.h@university.edu', status: 'completed' },
      { id: 'stu-016', name: 'David Park',    email: 'david.p@university.edu', status: 'completed' },
    ],
    faculty: [
      { id: 'fac-003', name: 'Dr. James Okafor', role: 'Course Coordinator' },
      { id: 'fac-008', name: 'Dr. Ana Costa',    role: 'Instructor' },
    ],
    assessments: [
      { id: 'asm-017', title: 'Genetics Problem Set',   type: 'Assignment', status: 'Published', date: isoDate(2025, 10, 3),  students: 44 },
      { id: 'asm-018', title: 'Midterm I',               type: 'Exam',       status: 'Published', date: isoDate(2025, 10, 17), students: 44 },
      { id: 'asm-019', title: 'Midterm II',              type: 'Exam',       status: 'Published', date: isoDate(2025, 11, 14), students: 43 },
      { id: 'asm-020', title: 'Final Exam',              type: 'Exam',       status: 'Published', date: isoDate(2025, 12, 10), students: 43 },
    ],
    resources: [
      { title: 'Campbell Biology — 12th Ed', type: 'PDF',   url: '#' },
      { title: 'Khan Academy — Cell Biology', type: 'Video', url: '#' },
    ],
  },

  {
    ...courseOfferingRows[7],
    credits: 4,
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
    students: [
      { id: 'stu-008', name: 'Noah Williams',  email: 'noah.w@university.edu',  status: 'completed' },
      { id: 'stu-017', name: 'Nia Thompson',   email: 'nia.t@university.edu',   status: 'completed' },
    ],
    faculty: [
      { id: 'fac-004', name: 'Prof. Meena Patel', role: 'Course Coordinator' },
    ],
    assessments: [
      { id: 'asm-021', title: 'Lab Practical I — Upper Limb',   type: 'Practical', status: 'Published', date: isoDate(2025, 2, 21), students: 27 },
      { id: 'asm-022', title: 'Lab Practical II — Lower Limb',  type: 'Practical', status: 'Published', date: isoDate(2025, 4, 4),  students: 27 },
      { id: 'asm-023', title: 'Final Exam',                      type: 'Exam',      status: 'Published', date: isoDate(2025, 5, 2),  students: 26 },
    ],
    resources: [
      { title: 'Moore\'s Clinically Oriented Anatomy — 9th Ed', type: 'PDF',   url: '#' },
      { title: 'Anatomy.TV — 3D Dissection Guide',              type: 'Video', url: '#' },
    ],
  },

  {
    ...courseOfferingRows[8],
    credits: 3,
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
    students: [
      { id: 'stu-010', name: 'Amara Diallo', email: 'amara.d@university.edu', status: 'completed' },
    ],
    faculty: [
      { id: 'fac-006', name: 'Dr. Carlos Rivera', role: 'Course Coordinator' },
    ],
    assessments: [
      { id: 'asm-024', title: 'Quiz 1 — Neurophysiology', type: 'Quiz', status: 'Published', date: isoDate(2024, 9, 27),  students: 18 },
      { id: 'asm-025', title: 'Midterm Exam',              type: 'Exam', status: 'Published', date: isoDate(2024, 10, 25), students: 18 },
      { id: 'asm-026', title: 'Final Exam',                type: 'Exam', status: 'Published', date: isoDate(2024, 12, 6),  students: 17 },
    ],
    resources: [
      { title: 'Berne & Levy Physiology — 7th Ed', type: 'PDF',  url: '#' },
      { title: 'PhysioEx Lab Simulations',         type: 'Link', url: '#' },
    ],
  },

  {
    ...courseOfferingRows[9],
    credits: 3,
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
    students: [
      { id: 'stu-012', name: 'Isabella Park', email: 'isabella.p@university.edu', status: 'completed' },
      { id: 'stu-018', name: 'Ethan Brown',   email: 'ethan.b@university.edu',   status: 'completed' },
    ],
    faculty: [
      { id: 'fac-003', name: 'Dr. James Okafor', role: 'Course Coordinator' },
      { id: 'fac-009', name: 'Prof. Anne Walsh',  role: 'Instructor' },
    ],
    assessments: [
      { id: 'asm-027', title: 'Case Study — Heart Failure',  type: 'Assignment', status: 'Published', date: isoDate(2025, 10, 10), students: 38 },
      { id: 'asm-028', title: 'Midterm Exam',                 type: 'Exam',       status: 'Published', date: isoDate(2025, 11, 7),  students: 38 },
      { id: 'asm-029', title: 'Final Exam',                   type: 'Exam',       status: 'Published', date: isoDate(2025, 12, 12), students: 37 },
    ],
    resources: [
      { title: 'Pathophysiology — McCance & Huether', type: 'PDF',   url: '#' },
      { title: 'ATI Pathophysiology Modules',         type: 'Video', url: '#' },
    ],
  },

  {
    ...courseOfferingRows[10],
    credits: 4,
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
    students: [],
    faculty: [
      { id: 'fac-001', name: 'Dr. Sarah Mitchell', role: 'Course Coordinator' },
      { id: 'fac-002', name: 'Dr. Priya Nair',     role: 'Instructor' },
    ],
    assessments: [
      { id: 'asm-030', title: 'Therapy Management Simulation', type: 'Simulation', status: 'Upcoming', date: isoDate(2026, 10, 16), students: 0 },
      { id: 'asm-031', title: 'Midterm Exam',                  type: 'Exam',       status: 'Upcoming', date: isoDate(2026, 10, 23), students: 0 },
      { id: 'asm-032', title: 'Final OSCE',                    type: 'OSCE',       status: 'Upcoming', date: isoDate(2026, 12, 4),  students: 0 },
    ],
    resources: [
      { title: 'Dipiro Pharmacotherapy — 12th Ed', type: 'PDF',   url: '#' },
      { title: 'AGS Beers Criteria 2023',          type: 'Link',  url: '#' },
      { title: 'Polypharmacy Case Library',        type: 'Video', url: '#' },
    ],
  },

  {
    ...courseOfferingRows[11],
    credits: 3,
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
    students: [],
    faculty: [
      { id: 'fac-003', name: 'Dr. James Okafor', role: 'Course Coordinator' },
    ],
    assessments: [
      { id: 'asm-033', title: 'Pedigree Analysis Assignment', type: 'Assignment', status: 'Upcoming', date: isoDate(2026, 9, 25),  students: 0 },
      { id: 'asm-034', title: 'Midterm Exam',                 type: 'Exam',       status: 'Upcoming', date: isoDate(2026, 10, 30), students: 0 },
      { id: 'asm-035', title: 'Genomics Journal Club',        type: 'Seminar',    status: 'Upcoming', date: isoDate(2026, 11, 20), students: 0 },
    ],
    resources: [
      { title: 'Thompson & Thompson Genetics in Medicine', type: 'PDF',   url: '#' },
      { title: 'OMIM — Online Mendelian Inheritance in Man', type: 'Link', url: '#' },
    ],
  },

  {
    ...courseOfferingRows[12],
    credits: 4,
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
    students: [],
    faculty: [
      { id: 'fac-004', name: 'Prof. Meena Patel',     role: 'Course Coordinator' },
      { id: 'fac-005', name: 'Dr. Raj Krishnaswamy',  role: 'Instructor' },
    ],
    assessments: [
      { id: 'asm-036', title: 'Lesion Localisation Quiz', type: 'Quiz', status: 'Upcoming', date: isoDate(2026, 9, 18),  students: 0 },
      { id: 'asm-037', title: 'Midterm Exam',              type: 'Exam', status: 'Upcoming', date: isoDate(2026, 10, 9),  students: 0 },
      { id: 'asm-038', title: 'Neuroimaging Practical',    type: 'Practical', status: 'Upcoming', date: isoDate(2026, 11, 13), students: 0 },
      { id: 'asm-039', title: 'Final Exam',                type: 'Exam', status: 'Upcoming', date: isoDate(2026, 12, 4),  students: 0 },
    ],
    resources: [
      { title: 'Blumenfeld Neuroanatomy through Clinical Cases — 3rd Ed', type: 'PDF',   url: '#' },
      { title: 'Radiopaedia — Neuroradiology Atlas',                       type: 'Link',  url: '#' },
      { title: 'Neural Pathway Animations Library',                        type: 'Video', url: '#' },
    ],
  },

  {
    ...courseOfferingRows[13],
    credits: 3,
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
    students: [],
    faculty: [
      { id: 'fac-006', name: 'Dr. Carlos Rivera', role: 'Course Coordinator' },
      { id: 'fac-009', name: 'Prof. Anne Walsh',  role: 'Instructor' },
    ],
    assessments: [
      { id: 'asm-040', title: 'Clinical Reasoning OSCE',      type: 'OSCE',       status: 'Upcoming', date: isoDate(2026, 10, 2),  students: 0 },
      { id: 'asm-041', title: 'Case Presentation — Acute Care', type: 'Seminar',  status: 'Upcoming', date: isoDate(2026, 11, 6),  students: 0 },
      { id: 'asm-042', title: 'Final Simulation Exam',         type: 'Simulation', status: 'Upcoming', date: isoDate(2026, 12, 11), students: 0 },
    ],
    resources: [
      { title: 'Thinking in Systems — Meadows',               type: 'PDF',   url: '#' },
      { title: 'Clinical Reasoning Modules — Aquifer',        type: 'Link',  url: '#' },
      { title: 'SBAR Communication Framework Video Series',   type: 'Video', url: '#' },
    ],
  },
]
