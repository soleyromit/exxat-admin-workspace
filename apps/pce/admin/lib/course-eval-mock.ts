/**
 * Mock data for the Course Evaluation surfaces.
 *
 * Spec: apps/pce/docs/specs/course-evaluation.md
 * Source: distilled Granola 2026-05-08 (apps/pce/docs/research/meetings/2026-05-08-course-evaluation.md)
 *
 * Data spine (immovable per Aarti D-1): course offering = (faculty × course × term × cohort).
 * Every aggregation rolls up from this atomic grain.
 */

export type TermId = '2024-fall' | '2025-spring' | '2025-fall' | '2026-spring'
export type Direction = 'up' | 'down' | 'flat'

export const TERMS: { id: TermId; label: string; year: number; quarter: 'spring' | 'fall' }[] = [
  { id: '2024-fall', label: 'Fall 2024', year: 2024, quarter: 'fall' },
  { id: '2025-spring', label: 'Spring 2025', year: 2025, quarter: 'spring' },
  { id: '2025-fall', label: 'Fall 2025', year: 2025, quarter: 'fall' },
  { id: '2026-spring', label: 'Spring 2026', year: 2026, quarter: 'spring' },
]

export const CURRENT_TERM: TermId = '2026-spring'

export interface Faculty {
  id: string
  name: string
  /** Per-term average rating, oldest → newest */
  trajectory: { term: TermId; rating: number }[]
  /** True if rating dropped ≥0.3 over last 2 terms (surfaces as outlier panel) */
  isOutlier: boolean
}

export const FACULTY: Faculty[] = [
  { id: 'f1',  name: 'Dr. Smith',   trajectory: [
    { term: '2024-fall', rating: 4.6 }, { term: '2025-spring', rating: 4.7 },
    { term: '2025-fall', rating: 4.7 }, { term: '2026-spring', rating: 4.8 },
  ], isOutlier: false },
  { id: 'f2',  name: 'Dr. Patel',   trajectory: [
    { term: '2024-fall', rating: 4.2 }, { term: '2025-spring', rating: 4.3 },
    { term: '2025-fall', rating: 4.3 }, { term: '2026-spring', rating: 4.4 },
  ], isOutlier: false },
  { id: 'f3',  name: 'Dr. Lee',     trajectory: [
    { term: '2024-fall', rating: 4.4 }, { term: '2025-spring', rating: 4.5 },
    { term: '2025-fall', rating: 4.5 }, { term: '2026-spring', rating: 4.6 },
  ], isOutlier: false },
  { id: 'f4',  name: 'Dr. Khan',    trajectory: [
    { term: '2024-fall', rating: 4.5 }, { term: '2025-spring', rating: 4.5 },
    { term: '2025-fall', rating: 4.0 }, { term: '2026-spring', rating: 3.9 },
  ], isOutlier: true },
  { id: 'f5',  name: 'Dr. Garcia',  trajectory: [
    { term: '2024-fall', rating: 4.0 }, { term: '2025-spring', rating: 4.2 },
    { term: '2025-fall', rating: 4.3 }, { term: '2026-spring', rating: 4.4 },
  ], isOutlier: false },
  { id: 'f6',  name: 'Dr. Wilson',  trajectory: [
    { term: '2024-fall', rating: 4.4 }, { term: '2025-spring', rating: 4.5 },
    { term: '2025-fall', rating: 4.5 }, { term: '2026-spring', rating: 4.6 },
  ], isOutlier: false },
  { id: 'f7',  name: 'Dr. Chen',    trajectory: [
    { term: '2024-fall', rating: 4.5 }, { term: '2025-spring', rating: 4.6 },
    { term: '2025-fall', rating: 4.6 }, { term: '2026-spring', rating: 4.6 },
  ], isOutlier: false },
  { id: 'f8',  name: 'Dr. Martinez',trajectory: [
    { term: '2024-fall', rating: 4.0 }, { term: '2025-spring', rating: 4.1 },
    { term: '2025-fall', rating: 4.0 }, { term: '2026-spring', rating: 4.0 },
  ], isOutlier: false },
  { id: 'f9',  name: 'Dr. Robinson',trajectory: [
    { term: '2024-fall', rating: 3.9 }, { term: '2025-spring', rating: 3.8 },
    { term: '2025-fall', rating: 4.0 }, { term: '2026-spring', rating: 4.1 },
  ], isOutlier: false },
  { id: 'f10', name: 'Dr. Davis',   trajectory: [
    { term: '2024-fall', rating: 4.3 }, { term: '2025-spring', rating: 4.3 },
    { term: '2025-fall', rating: 4.4 }, { term: '2026-spring', rating: 4.4 },
  ], isOutlier: false },
  { id: 'f11', name: 'Dr. Park',    trajectory: [
    { term: '2024-fall', rating: 4.2 }, { term: '2025-spring', rating: 4.4 },
    { term: '2025-fall', rating: 4.5 }, { term: '2026-spring', rating: 4.5 },
  ], isOutlier: false },
  { id: 'f12', name: 'Dr. Kumar',   trajectory: [
    { term: '2024-fall', rating: 4.0 }, { term: '2025-spring', rating: 4.1 },
    { term: '2025-fall', rating: 4.2 }, { term: '2026-spring', rating: 4.3 },
  ], isOutlier: false },
]

export interface Course {
  id: string
  name: string
  facultyId: string
  /** Department for filtering */
  department: 'pharmacy' | 'medicine' | 'rehab' | 'med-ethics'
  /** Current term's average rating */
  currentRating: number
  /** Number of survey responses received (current term) */
  responses: number
  /** Number of surveys sent (current term) */
  sent: number
  /** Survey template id — for variance detection */
  templateId: 'std-pt' | 'std-clin' | 'didactic-only' | 'short-form'
}

export const COURSES: Course[] = [
  { id: 'c1',  name: 'Path Phys I',          facultyId: 'f1',  department: 'medicine', currentRating: 4.7, responses: 51,  sent: 56,  templateId: 'std-pt' },
  { id: 'c2',  name: 'Pharm I',              facultyId: 'f2',  department: 'pharmacy', currentRating: 4.5, responses: 48,  sent: 56,  templateId: 'std-pt' },
  { id: 'c3',  name: 'Anatomy II',           facultyId: 'f3',  department: 'medicine', currentRating: 4.4, responses: 50,  sent: 56,  templateId: 'std-pt' },
  { id: 'c4',  name: 'Path II',              facultyId: 'f1',  department: 'medicine', currentRating: 4.3, responses: 49,  sent: 56,  templateId: 'std-pt' },
  { id: 'c5',  name: 'Pharm II',             facultyId: 'f4',  department: 'pharmacy', currentRating: 4.0, responses: 42,  sent: 51,  templateId: 'std-pt' },
  { id: 'c6',  name: 'Pharm II Lab',         facultyId: 'f4',  department: 'pharmacy', currentRating: 3.9, responses: 40,  sent: 51,  templateId: 'std-clin' },
  { id: 'c7',  name: 'Patient Comm',         facultyId: 'f5',  department: 'rehab',    currentRating: 3.7, responses: 45,  sent: 56,  templateId: 'std-pt' },
  { id: 'c8',  name: 'Med Ethics',           facultyId: 'f9',  department: 'med-ethics', currentRating: 3.4, responses: 38,  sent: 56,  templateId: 'didactic-only' },
  { id: 'c9',  name: 'Clinical Skills I',    facultyId: 'f3',  department: 'medicine', currentRating: 4.5, responses: 47,  sent: 56,  templateId: 'std-clin' },
  { id: 'c10', name: 'Cardiology Mod',       facultyId: 'f6',  department: 'medicine', currentRating: 4.6, responses: 50,  sent: 56,  templateId: 'std-pt' },
  { id: 'c11', name: 'Neurology Mod',        facultyId: 'f7',  department: 'medicine', currentRating: 4.6, responses: 49,  sent: 56,  templateId: 'std-pt' },
  { id: 'c12', name: 'Endocrinology',        facultyId: 'f8',  department: 'medicine', currentRating: 4.0, responses: 46,  sent: 56,  templateId: 'std-pt' },
  { id: 'c13', name: 'Pediatrics Intro',     facultyId: 'f10', department: 'medicine', currentRating: 4.4, responses: 48,  sent: 56,  templateId: 'std-pt' },
  { id: 'c14', name: 'OB/GYN Foundations',   facultyId: 'f11', department: 'medicine', currentRating: 4.5, responses: 47,  sent: 56,  templateId: 'std-pt' },
  { id: 'c15', name: 'Geriatrics',           facultyId: 'f12', department: 'medicine', currentRating: 4.3, responses: 49,  sent: 56,  templateId: 'std-pt' },
  { id: 'c16', name: 'Imaging Basics',       facultyId: 'f6',  department: 'medicine', currentRating: 4.5, responses: 47,  sent: 56,  templateId: 'std-pt' },
  { id: 'c17', name: 'Health Systems',       facultyId: 'f5',  department: 'rehab',    currentRating: 4.0, responses: 41,  sent: 51,  templateId: 'short-form' },
  { id: 'c18', name: 'Research Methods',     facultyId: 'f12', department: 'medicine', currentRating: 4.3, responses: 46,  sent: 51,  templateId: 'std-pt' },
]

export interface AITheme {
  id: string
  text: string
  mentionsCount: number
  totalCourses: number
  sentiment: 'positive' | 'concern' | 'neutral'
}

export const AI_THEMES: AITheme[] = [
  { id: 't1', text: 'Online resources lacking',           mentionsCount: 7,  totalCourses: 18, sentiment: 'concern'  },
  { id: 't2', text: 'Pacing concerns in 2nd half',         mentionsCount: 5,  totalCourses: 18, sentiment: 'concern'  },
  { id: 't3', text: 'Strong faculty engagement praised',   mentionsCount: 12, totalCourses: 18, sentiment: 'positive' },
]

export const AI_INSIGHT_META = {
  responsesAnalyzed: 829,
  confidence: 'high' as const,
  generatedAt: '2026-05-09T08:00:00Z',
}

/** Response funnel data — for progression-sankey */
export const RESPONSE_FUNNEL = {
  sent: 1240,
  opened: 1116,
  started: 918,
  completed: 829,
  largestLeak: { from: 'started', to: 'completed', count: 89, percent: 9.7 },
}

/** Daily response counts for calendar-heatmap. Generates 90 days from Feb 1 2026. */
export const RESPONSE_CADENCE: { date: string; count: number }[] = (() => {
  const out: { date: string; count: number }[] = []
  const start = new Date('2026-02-01')
  for (let i = 0; i < 90; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const dow = d.getDay()
    let count = 0
    // Weekend baseline near zero
    if (dow === 0 || dow === 6) {
      count = Math.random() < 0.3 ? Math.floor(Math.random() * 3) : 0
    } else {
      // Weekday baseline 5-15, with Friday spike (15-30)
      count = Math.floor(Math.random() * 10) + 5
      if (dow === 5) count += Math.floor(Math.random() * 12) + 5
    }
    // Mid-month spike (course mid-points)
    const dom = d.getDate()
    if (dom === 15 || dom === 16) count += 5
    out.push({ date: d.toISOString().slice(0, 10), count })
  }
  return out
})()

/** Department average for the current term — used as reference line on Cleveland dot */
export const DEPT_AVG = 4.3
export const THRESHOLD = 4.0

/** Template variance: how many distinct templates are in use this term */
export function templateVariance(courses: Course[]): { count: number; templates: string[] } {
  const set = new Set(courses.map(c => c.templateId))
  return { count: set.size, templates: Array.from(set) }
}

/** Cohort options (mock) */
export const COHORTS = ['Class of 2027', 'Class of 2028', 'Class of 2029'] as const

/** Department options for filtering */
export const DEPARTMENTS = [
  { id: 'all',         label: 'All departments' },
  { id: 'pharmacy',    label: 'Pharmacy' },
  { id: 'medicine',    label: 'Medicine' },
  { id: 'rehab',       label: 'Rehabilitation' },
  { id: 'med-ethics',  label: 'Med Ethics' },
] as const

// ─────────────────────────────────────────────────────────────────────────────
// Sprint 2 — Cohort overview data
// ─────────────────────────────────────────────────────────────────────────────

export type CohortId = 'class-2027' | 'class-2028' | 'class-2029'

export interface CohortMeta {
  id: CohortId
  label: string
  enteredTerm: TermId
  studentCount: number
  /** Position in program: term index of 8 (a 4-year program has 8 terms) */
  termIndex: number
  /** Total didactic courses completed by this cohort */
  didacticCompleted: number
  /** Per-course: rating in cohort's most-recent two terms (for slope graph) */
  paired: { courseId: string; courseName: string; pre: number; post: number; type: 'didactic' | 'clinical' }[]
}

export const COHORT_META: Record<CohortId, CohortMeta> = {
  'class-2027': {
    id: 'class-2027',
    label: 'Class of 2027',
    enteredTerm: '2024-fall',
    studentCount: 78,
    termIndex: 4,
    didacticCompleted: 12,
    paired: [
      { courseId: 'c1',  courseName: 'Path Phys I',     pre: 4.5, post: 4.7, type: 'didactic' },
      { courseId: 'c3',  courseName: 'Anatomy I',       pre: 4.3, post: 4.6, type: 'didactic' },
      { courseId: 'c2',  courseName: 'Pharm I',         pre: 4.5, post: 4.5, type: 'didactic' },
      { courseId: 'c5',  courseName: 'Pharm II',        pre: 4.3, post: 4.0, type: 'didactic' },
      { courseId: 'c4',  courseName: 'Path II',         pre: 4.4, post: 4.3, type: 'didactic' },
      { courseId: 'c8',  courseName: 'Med Ethics',      pre: 3.8, post: 3.4, type: 'didactic' },
      { courseId: 'c10', courseName: 'Cardiology Mod',  pre: 4.4, post: 4.6, type: 'didactic' },
      { courseId: 'c11', courseName: 'Neurology Mod',   pre: 4.5, post: 4.6, type: 'didactic' },
      { courseId: 'c9',  courseName: 'Clinical Skills I', pre: 4.3, post: 4.5, type: 'clinical' },
      { courseId: 'c6',  courseName: 'Pharm II Lab',    pre: 4.0, post: 3.9, type: 'clinical' },
      { courseId: 'c7',  courseName: 'Patient Comm',    pre: 3.8, post: 3.7, type: 'clinical' },
      { courseId: 'c17', courseName: 'Health Systems',  pre: 4.0, post: 4.0, type: 'clinical' },
    ],
  },
  'class-2028': {
    id: 'class-2028',
    label: 'Class of 2028',
    enteredTerm: '2025-fall',
    studentCount: 82,
    termIndex: 2,
    didacticCompleted: 6,
    paired: [
      { courseId: 'c1',  courseName: 'Path Phys I',     pre: 4.5, post: 4.7, type: 'didactic' },
      { courseId: 'c2',  courseName: 'Pharm I',         pre: 4.4, post: 4.5, type: 'didactic' },
      { courseId: 'c3',  courseName: 'Anatomy II',      pre: 4.4, post: 4.4, type: 'didactic' },
      { courseId: 'c10', courseName: 'Cardiology Mod',  pre: 4.5, post: 4.6, type: 'didactic' },
    ],
  },
  'class-2029': {
    id: 'class-2029',
    label: 'Class of 2029',
    enteredTerm: '2026-spring',
    studentCount: 85,
    termIndex: 1,
    didacticCompleted: 0,
    paired: [],
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Sprint 3 — Drill-down data (per faculty / course / offering)
// ─────────────────────────────────────────────────────────────────────────────

export interface PerCourseRating {
  courseId: string
  courseName: string
  /** Faculty's per-course rating this term */
  rating: number
  /** Department average for this course (for bullet-vs-target reference) */
  deptAvg: number
  responses: number
  sent: number
}

/** Faculty's per-course ratings — used in faculty drill-down */
export function getFacultyCourses(facultyId: string): PerCourseRating[] {
  return COURSES
    .filter(c => c.facultyId === facultyId)
    .map(c => ({
      courseId: c.id,
      courseName: c.name,
      rating: c.currentRating,
      deptAvg: DEPT_AVG,
      responses: c.responses,
      sent: c.sent,
    }))
}

/** Per-question scores for an offering — used in offering drill-down */
export interface QuestionRow {
  id: string
  text: string
  avg: number
  /** Counts at each level 1..5 for distribution sparkline */
  distribution: [number, number, number, number, number]
}

export const SAMPLE_QUESTIONS: QuestionRow[] = [
  { id: 'q1', text: 'Lecture clarity',                avg: 4.3, distribution: [0, 1, 4, 12, 25] },
  { id: 'q2', text: 'Lecture pacing',                  avg: 3.6, distribution: [2, 5, 12, 14, 9] },
  { id: 'q3', text: 'Course materials',                avg: 4.4, distribution: [0, 1, 3, 10, 28] },
  { id: 'q4', text: 'Exam structure',                  avg: 3.8, distribution: [1, 4, 10, 16, 11] },
  { id: 'q5', text: 'Office hours availability',       avg: 4.5, distribution: [0, 0, 3, 9, 30] },
  { id: 'q6', text: 'Overall course rating',           avg: 4.0, distribution: [0, 2, 8, 18, 14] },
]

/** AI themes per offering — used in offering drill-down */
export const SAMPLE_OFFERING_THEMES: AITheme[] = [
  { id: 'th1', text: 'Pacing in chapters 7–9',                mentionsCount: 18, totalCourses: 42, sentiment: 'concern' },
  { id: 'th2', text: 'Exam covered material not lectured',    mentionsCount: 14, totalCourses: 42, sentiment: 'concern' },
  { id: 'th3', text: 'Lab time too short',                     mentionsCount: 9,  totalCourses: 42, sentiment: 'concern' },
  { id: 'th4', text: 'Strong office hours',                    mentionsCount: 7,  totalCourses: 42, sentiment: 'positive' },
]

/** Sample anonymous responses — used in offering drill-down "All responses" */
export interface OfferingResponse {
  id: string
  rating: number
  submittedAt: string  // ISO
  comment: string
  themes: string[]
}

export const SAMPLE_RESPONSES: OfferingResponse[] = [
  { id: 'r1', rating: 4.0, submittedAt: '2026-05-07T14:30:00Z',
    comment: 'The professor knows the material well, but the pace in the second half made it hard to keep up. Lab sessions were rushed.',
    themes: ['pacing', 'lab time'] },
  { id: 'r2', rating: 3.0, submittedAt: '2026-05-05T09:15:00Z',
    comment: 'Exam questions covered topics not addressed in class lectures.',
    themes: ['exam structure'] },
  { id: 'r3', rating: 4.5, submittedAt: '2026-05-04T16:45:00Z',
    comment: 'Office hours were very helpful — Dr. Khan is available and thorough.',
    themes: ['office hours'] },
  { id: 'r4', rating: 3.5, submittedAt: '2026-05-03T11:00:00Z',
    comment: 'Pacing in chapters 7-9 was fast. Could use more time on enzymology.',
    themes: ['pacing'] },
  { id: 'r5', rating: 4.0, submittedAt: '2026-05-02T13:20:00Z',
    comment: 'Generally solid course. Lab time felt cramped — would suggest extending to 3 hours.',
    themes: ['lab time'] },
]

// ─────────────────────────────────────────────────────────────────────────────
// Sprint 4 — Faculty self-view data (the current logged-in faculty)
// ─────────────────────────────────────────────────────────────────────────────

/** Current "logged-in faculty" for /me routes — Dr. Khan as the demo persona,
 *  matches the spec's example walkthrough */
export const CURRENT_FACULTY_ID = 'f4'

export interface ActionPlanItem {
  id: string
  text: string
  source: 'ai-suggested' | 'faculty-authored'
  status: 'pending' | 'in-progress' | 'completed'
  createdAt: string
}

export const CURRENT_FACULTY_ACTION_PLAN: ActionPlanItem[] = [
  { id: 'ap1', text: 'Revise pacing chapters 7-9',                 source: 'ai-suggested',    status: 'pending',     createdAt: '2026-04-22' },
  { id: 'ap2', text: 'Move to weekly office hours instead of bi-weekly', source: 'faculty-authored', status: 'completed', createdAt: '2026-04-15' },
  { id: 'ap3', text: 'Add formative quiz at midpoint',             source: 'faculty-authored', status: 'in-progress', createdAt: '2026-03-30' },
]
