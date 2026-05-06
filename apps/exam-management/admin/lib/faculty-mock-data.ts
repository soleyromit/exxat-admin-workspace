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
 */

// ─── Students ────────────────────────────────────────────────────────────────

export type StudentStatus = 'active' | 'at-risk' | 'top-performer' | 'inactive'

export interface Student {
  id: string
  studentId: string         // institutional ID, e.g. "STU-2024-1023"
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
  obj('phar101', 6, 'course-phar101', 'Recognize black-box warning indications', 'Remember', 7, 1, null as any, null), // untested gap
  // BIOL201 — Cell Biology
  obj('biol201', 1, 'course-biol201', 'Identify organelle structure-function relationships', 'Understand', 16, 3, 81, 5),
  obj('biol201', 2, 'course-biol201', 'Apply cell-signaling cascade logic', 'Apply', 12, 2, 73, 18),
  obj('biol201', 3, 'course-biol201', 'Analyze membrane transport mechanisms', 'Analyze', 14, 2, 68, 18),
  obj('biol201', 4, 'course-biol201', 'Evaluate cell-cycle checkpoint failures', 'Evaluate', 8, 1, 74, 32),
  obj('biol201', 5, 'course-biol201', 'Compare apoptosis vs necrosis pathways', 'Understand', 6, 0, null as any, null), // untested
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
