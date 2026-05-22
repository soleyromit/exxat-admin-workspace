/**
 * ASSESSMENT-TAKER DATA MODEL
 *
 * Reflects Aarti + Vishaka's architecture from Granola sessions:
 *   - Active assessments always front and center
 *   - Two result publication modes: immediate vs faculty-reviewed
 *   - Accommodations owned by student services, applied at assessment level
 *   - Three result tiers: assessment → course → program (program deferred 2027)
 *   - Section-based timing architecture (UI deferred 2027, but data model supports it)
 *   - Scheduled review sessions in lockdown post-publication
 */

export type AssessmentStatus =
  | 'active'            // Can start now; clock has not started
  | 'in_progress'       // Student has begun; timer running
  | 'upcoming'          // Scheduled but not yet open
  | 'submitted'         // Submitted; awaiting faculty review
  | 'results_pending'   // Results withheld — faculty review period
  | 'results_published' // Results available to student
  | 'review_available'  // Scheduled review session window is open
  | 'review_complete';  // Review session closed

export type AssessmentType = 'quiz' | 'midterm' | 'final' | 'practical' | 'review';

export interface Accommodation {
  timeMultiplier: number;        // 1.0 = standard, 1.5 = time-and-a-half
  separateRoom: boolean;
  extendedBreaks: boolean;       // Scheduled breaks during exam
  additionalNotes?: string;
  approvedBy: string;            // Student services coordinator name
}

export interface ContentArea {
  id: string;
  name: string;
  questionCount: number;
  weight: number;               // percentage of total score, 0-100
  score?: number;               // student's score in this area, 0-100
  bloomsLevel?: string;         // e.g. "Application", "Analysis"
}

export interface ExamSection {
  id: string;
  title: string;
  questionCount: number;
  timeLimitMinutes: number;
  contentAreas: string[];       // ContentArea IDs
}

export interface Assessment {
  id: string;
  title: string;
  type: AssessmentType;
  courseCode: string;
  courseName: string;
  facultyName: string;
  status: AssessmentStatus;
  isHighStakes: boolean;        // true = faculty review before results; false = immediate

  // Scheduling
  windowStart: Date;
  windowEnd: Date;
  durationMinutes: number;      // Base duration (before accommodation multiplier)
  startedAt?: Date;             // When student actually began

  // Content
  questionCount: number;
  contentAreas: ContentArea[];
  sections?: ExamSection[];     // Section-based (architecture deferred to 2027)
  instructions: string;
  allowComments: boolean;       // Per-question comment/flag box for error reporting
  referenceMaterials?: string[];

  // Accommodations (from student services, not faculty)
  accommodation?: Accommodation;

  // Auto-advance (Aarti May 14): for quizzes, automatically move to next question after selection.
  // Default: false. Configurable per assessment. Faculty must understand the student experience
  // before enabling — Aarti: "by mistake if they do it it will be a big problem for students."
  autoAdvance?: boolean;

  // Results
  score?: number;               // 0-100, only when results_published
  percentile?: number;
  passingScore: number;
  resultPublishedAt?: Date;
  resultsHoldUntil?: Date;      // Estimated release date when results are pending faculty review

  // Grouping
  term?: string;             // e.g. "Spring 2026" — used to group results by term

  // Review session
  reviewSessionStart?: Date;
  reviewSessionEnd?: Date;
  reviewShowsCorrectAnswers: boolean;
  reviewShowsRationale: boolean;
}

// ─── Mock data — reflects Aarti's described use cases ───────────────────────

const NOW = new Date();
const inDays = (n: number) => new Date(NOW.getTime() + n * 86_400_000);
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

// ─── Mock snapshot: one active exam, two upcoming, two past results ──────────

export const MOCK_ASSESSMENTS: Assessment[] = [
  // ── Active exam — open now, student can start immediately ─────────────────
  {
    id: 'exam-active-001',
    title: 'Anatomy & Physiology — Midterm Exam',
    type: 'midterm',
    courseCode: 'ANAT 401',
    courseName: 'Anatomy & Physiology II',
    facultyName: 'Dr. Carla Medina',
    status: 'active',
    isHighStakes: true,
    windowStart: NOW,
    windowEnd: new Date(NOW.getTime() + 3 * 60 * 60_000), // 3-hour window
    durationMinutes: 110,
    questionCount: 75,
    passingScore: 75,
    instructions: 'Covers Chapters 12–18. Closed book. No reference materials. A proctor password will be provided at exam time.',
    allowComments: true,
    contentAreas: [
      { id: 'ca-a01', name: 'Nervous System', questionCount: 25, weight: 33 },
      { id: 'ca-a02', name: 'Musculoskeletal', questionCount: 22, weight: 29 },
      { id: 'ca-a03', name: 'Cardiovascular', questionCount: 18, weight: 24 },
      { id: 'ca-a04', name: 'Endocrine', questionCount: 10, weight: 14 },
    ],
    reviewShowsCorrectAnswers: false,
    reviewShowsRationale: false,
  },

  // ── Upcoming #1 — proctored + accommodation, 2 days out ───────────────
  {
    id: 'exam-006',
    title: 'Pharmacology — Midterm Examination',
    type: 'midterm',
    courseCode: 'PHARM 502',
    courseName: 'Clinical Pharmacology',
    facultyName: 'Prof. Anand Kumar',
    status: 'upcoming',
    isHighStakes: true,
    windowStart: inDays(2),
    windowEnd: new Date(inDays(2).getTime() + 120 * 60_000),
    durationMinutes: 90,
    questionCount: 60,
    passingScore: 75,
    instructions:
      'This exam covers Modules 1–3: drug classifications, mechanisms of action, pharmacokinetics, and adverse effects. No external materials permitted. Password required at exam start.',
    allowComments: false,
    accommodation: {
      timeMultiplier: 1.5,
      separateRoom: false,
      extendedBreaks: false,
      approvedBy: 'Jennifer Walsh, Student Services',
    },
    contentAreas: [
      { id: 'ca-060', name: 'Drug Classifications', questionCount: 18, weight: 30 },
      { id: 'ca-061', name: 'Mechanisms of Action', questionCount: 22, weight: 37 },
      { id: 'ca-062', name: 'Pharmacokinetics', questionCount: 12, weight: 20 },
      { id: 'ca-063', name: 'Adverse Effects', questionCount: 8, weight: 13 },
    ],
    reviewShowsCorrectAnswers: true,
    reviewShowsRationale: true,
  },

  // ── Upcoming #2 — self-paced, 1 day out ──────────────────────────────────
  {
    id: 'exam-007',
    title: 'Pathophysiology — Unit 4 Quiz',
    type: 'quiz',
    courseCode: 'PATH 501',
    courseName: 'Pathophysiology I',
    facultyName: 'Dr. Sunita Raghavan',
    status: 'upcoming',
    isHighStakes: false,
    windowStart: inDays(1),
    windowEnd: new Date(inDays(1).getTime() + 45 * 60_000),
    durationMinutes: 30,
    questionCount: 20,
    passingScore: 70,
    instructions: 'Short quiz on Neoplasia and Hemodynamic Disorders. Results available immediately.',
    allowComments: false,
    contentAreas: [
      { id: 'ca-070', name: 'Neoplasia', questionCount: 10, weight: 50 },
      { id: 'ca-071', name: 'Hemodynamic Disorders', questionCount: 10, weight: 50 },
    ],
    reviewShowsCorrectAnswers: true,
    reviewShowsRationale: false,
  },

  // ── Upcoming — download window not yet open, 5 days away ─────────────────
  {
    id: 'exam-002',
    title: 'Pharmacology — Module 3 Quiz',
    type: 'quiz',
    courseCode: 'PHARM 502',
    courseName: 'Clinical Pharmacology',
    facultyName: 'Prof. Anand Kumar',
    status: 'upcoming',
    isHighStakes: false,
    autoAdvance: true,
    windowStart: inDays(5),
    windowEnd: new Date(inDays(5).getTime() + 60 * 60_000),
    durationMinutes: 45,
    questionCount: 30,
    passingScore: 70,
    instructions:
      'Quiz covering drug classifications, mechanisms of action, and adverse effects from Module 3. No reference materials permitted. Results will be available immediately after submission.',
    allowComments: false,
    contentAreas: [
      { id: 'ca-010', name: 'Drug Classifications', questionCount: 10, weight: 33 },
      { id: 'ca-011', name: 'Mechanism of Action', questionCount: 12, weight: 40 },
      { id: 'ca-012', name: 'Adverse Effects & Interactions', questionCount: 8, weight: 27 },
    ],
    reviewShowsCorrectAnswers: true,
    reviewShowsRationale: false,
  },

  // ── Past result — score published ─────────────────────────────────────────
  {
    id: 'exam-004',
    title: 'Microbiology — Unit 2 Assessment',
    type: 'midterm',
    courseCode: 'MICRO 401',
    courseName: 'Medical Microbiology',
    facultyName: 'Dr. Priya Nair',
    status: 'results_published',
    isHighStakes: false,
    windowStart: daysAgo(12),
    windowEnd: new Date(daysAgo(12).getTime() + 90 * 60_000),
    durationMinutes: 90,
    questionCount: 50,
    passingScore: 70,
    score: 84,
    percentile: 72,
    startedAt: daysAgo(12),
    term: 'Spring 2026',
    resultPublishedAt: daysAgo(10),
    instructions: '',
    allowComments: true,
    contentAreas: [
      { id: 'ca-030', name: 'Bacterial Pathogenesis', questionCount: 15, weight: 30, score: 87 },
      { id: 'ca-031', name: 'Viral Infections', questionCount: 18, weight: 36, score: 83 },
      { id: 'ca-032', name: 'Fungal & Parasitic Disease', questionCount: 10, weight: 20, score: 90 },
      { id: 'ca-033', name: 'Antimicrobial Therapy', questionCount: 7, weight: 14, score: 71 },
    ],
    reviewShowsCorrectAnswers: true,
    reviewShowsRationale: true,
  },

  // ── Past result — submitted, awaiting results ─────────────────────────────
  {
    id: 'exam-005',
    title: 'Physical Assessment Skills — Practical Exam',
    type: 'practical',
    courseCode: 'CLIN 301',
    courseName: 'Clinical Skills I',
    facultyName: 'Prof. Marcus Lee',
    status: 'submitted',
    isHighStakes: true,
    windowStart: daysAgo(4),
    windowEnd: new Date(daysAgo(4).getTime() + 90 * 60_000),
    durationMinutes: 75,
    questionCount: 40,
    passingScore: 80,
    term: 'Spring 2026',
    startedAt: daysAgo(4),
    instructions: '',
    allowComments: false,
    contentAreas: [
      { id: 'ca-040', name: 'Cardiovascular Assessment', questionCount: 12, weight: 30 },
      { id: 'ca-041', name: 'Respiratory Assessment', questionCount: 10, weight: 25 },
      { id: 'ca-042', name: 'Neurological Assessment', questionCount: 10, weight: 25 },
      { id: 'ca-043', name: 'Documentation & SBAR', questionCount: 8, weight: 20 },
    ],
    reviewShowsCorrectAnswers: true,
    reviewShowsRationale: true,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getEffectiveDuration(assessment: Assessment): number {
  const multiplier = assessment.accommodation?.timeMultiplier ?? 1.0;
  return Math.round(assessment.durationMinutes * multiplier);
}

export function getTimeRemaining(assessment: Assessment): number {
  if (!assessment.startedAt) return getEffectiveDuration(assessment) * 60;
  const elapsed = (NOW.getTime() - assessment.startedAt.getTime()) / 1000;
  return Math.max(0, getEffectiveDuration(assessment) * 60 - elapsed);
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function formatCountdown(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function getStatusLabel(status: AssessmentStatus): string {
  const map: Record<AssessmentStatus, string> = {
    active: 'Ready to Start',
    in_progress: 'In Progress',
    upcoming: 'Upcoming',
    submitted: 'Submitted',
    results_pending: 'Results Pending Review',
    results_published: 'Results Available',
    review_available: 'Review Session Open',
    review_complete: 'Review Complete',
  };
  return map[status];
}

export function getStatusColor(status: AssessmentStatus): string {
  const map: Record<AssessmentStatus, string> = {
    active: 'var(--brand-color)',
    in_progress: 'var(--brand-color)',
    upcoming: 'var(--muted-foreground)',
    submitted: '#D97706',
    results_pending: '#D97706',
    results_published: '#15803D',
    review_available: '#2563EB',
    review_complete: 'var(--muted-foreground)',
  };
  return map[status];
}

// ─── System notification audit log ───────────────────────────────────────────
// Per Aarti + Vishaka (May 14): all platform emails to students must be logged
// so faculty can verify delivery ("you got it at 9AM on Monday morning").

export type SystemNotificationKind =
  | 'results_published'   // Results now visible
  | 'review_open'         // Review session is open

export interface SystemNotification {
  id: string
  kind: SystemNotificationKind
  assessmentTitle: string
  courseCode: string
  courseName: string
  sentAt: Date
  channel: 'email'
}

export const MOCK_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'n1',
    kind: 'results_published',
    assessmentTitle: 'Pharmacology I — Midterm',
    courseCode: 'PHARM 101',
    courseName: 'Pharmacology I',
    sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    channel: 'email',
  },
  {
    id: 'n4',
    kind: 'results_published',
    assessmentTitle: 'Pharmacology I — Quiz 2',
    courseCode: 'PHARM 101',
    courseName: 'Pharmacology I',
    sentAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    channel: 'email',
  },
]

// ─── Course-level competency aggregation ─────────────────────────────────────

export interface CourseCompetency {
  courseCode: string;
  courseName: string;
  assessmentsCompleted: number;
  assessmentsTotal: number;
  averageScore: number;
  contentAreas: { name: string; score: number }[];
}

export const MOCK_COURSE_COMPETENCIES: CourseCompetency[] = [
  {
    courseCode: 'MICRO 401',
    courseName: 'Medical Microbiology',
    assessmentsCompleted: 3,
    assessmentsTotal: 4,
    averageScore: 84,
    contentAreas: [
      { name: 'Bacterial Pathogenesis', score: 87 },
      { name: 'Viral Infections', score: 83 },
      { name: 'Fungal & Parasitic Disease', score: 90 },
      { name: 'Antimicrobial Therapy', score: 71 },
    ],
  },
  {
    courseCode: 'PATH 501',
    courseName: 'Pathophysiology I',
    assessmentsCompleted: 1,
    assessmentsTotal: 3,
    averageScore: 0,   // results pending
    contentAreas: [],
  },
  {
    courseCode: 'ANAT 601',
    courseName: 'Advanced Clinical Anatomy',
    assessmentsCompleted: 0,
    assessmentsTotal: 2,
    averageScore: 0,
    contentAreas: [],
  },
];
