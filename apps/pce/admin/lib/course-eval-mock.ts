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
