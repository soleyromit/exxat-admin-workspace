/**
 * STUDENT BASE ENTITY — extended mock data for the Students module
 *
 * The `Student` type in faculty-mock-data.ts was scoped to the course-detail
 * surface. This file extends it with the fields needed for the student list
 * and student detail pages as per Aarti + Vishaka (May 13–14 raw transcripts):
 *
 *   List: name, email, cohort, # courses, advisor, GPA, status, annotation tags
 *   Detail > Overview: academic standing, active interventions, documents, annotations
 *   Detail > Courses: registered courses with completion status
 *   Detail > Assessments: exam performance, competency strengths/weaknesses
 *   Detail > Accommodations: per-student, per-course (admin/coordinator only)
 *
 * These pages are EXAM MANAGEMENT scoped. GPA, full compliance, patient logs,
 * timesheets, preceptor profile → NOT shown here. See docs/BASE-ENTITIES.md.
 */

import { facultyStudents, facultyAccommodations, type Student } from './faculty-mock-data'
import { courseOfferingRows } from './course-mock-data'

// ── Extended student type ─────────────────────────────────────────────────────

export interface AcademicStanding {
  status: 'good-standing' | 'needs-attention' | 'at-risk'
  label: string
  detail?: string
  since: string // ISO date
}

export interface StudentIntervention {
  id: string
  type: 'advising' | 'early-alert' | 'academic-support' | 'tutoring' | 'referral'
  date: string          // ISO
  staffMember: string
  notes: string
  isActive: boolean
  followUpDate?: string // ISO; only if active
}

export interface StudentDocument {
  id: string
  name: string
  type: 'accommodation-letter' | 'advising-note' | 'exam-authorization' | 'other'
  uploadedDate: string  // ISO
  uploadedBy: string
}

export interface StudentAnnotation {
  id: string
  text: string
  addedBy: string
  addedDate: string // ISO
  type: 'tag' | 'note'
}

export interface CourseEnrollment {
  offeringId: string   // maps to courseOfferingRows[*].id for navigation
  courseId: string
  courseCode: string
  courseName: string
  term: string
  status: 'completed' | 'in-progress' | 'upcoming'
  grade?: string       // letter grade if completed
  assessmentCount: number
  completedAssessments: number
  avgExamScore?: number // 0-100, for the course list performance metric
}

export interface CompetencyPerformance {
  area: string
  avgScore: number     // 0–100
  trend: 'improving' | 'stable' | 'declining'
}

export interface ExtendedStudent extends Student {
  program: string
  advisor: string
  gpa: number          // 0.0–4.0
  prismLinked: boolean
  academicStanding: AcademicStanding
  annotations: StudentAnnotation[]
  interventions: StudentIntervention[]
  documents: StudentDocument[]
  courseEnrollments: CourseEnrollment[]
  competencyPerformance: CompetencyPerformance[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysAgoIso(d: number): string {
  const dt = new Date('2026-05-17')
  dt.setDate(dt.getDate() - d)
  return dt.toISOString().split('T')[0]
}

const ADVISORS = ['Dr. Sarah Mitchell', 'Dr. James Okafor', 'Prof. Meena Patel', 'Dr. Carlos Rivera']
const PROGRAMS = ['Doctor of Physical Therapy', 'Doctor of Pharmacy', 'Master of Occupational Therapy']

function standing(gpa: number): AcademicStanding {
  if (gpa >= 3.0) return { status: 'good-standing', label: 'Good Standing', since: daysAgoIso(180) }
  if (gpa >= 2.5) return {
    status: 'needs-attention', label: 'Needs Attention',
    detail: 'GPA below 3.0 — academic support recommended',
    since: daysAgoIso(45),
  }
  return {
    status: 'at-risk', label: 'Academic Probation',
    detail: 'GPA below 2.5 — intervention required',
    since: daysAgoIso(20),
  }
}

const COMPETENCY_AREAS = [
  'Pharmacology Fundamentals', 'Clinical Reasoning', 'Patient Communication',
  'Evidence-Based Practice', 'Drug Interactions', 'Dosage Calculations',
]

// ── Enrollment templates ──────────────────────────────────────────────────────
// Declared outside the map so it's not re-created on every iteration.

type EnrollmentTemplate = { offeringId: string; status: 'in-progress' | 'completed' | 'upcoming' }

// 2–3 year program: 3–4 courses per term, 2 terms shown (current + one prior).
// skel101 = final semester: 2 courses only.
const ENROLLMENT_TEMPLATES: Record<string, EnrollmentTemplate[]> = {
  phar101: [
    // Spring 2026 — 4 active courses
    { offeringId: 'co-001', status: 'in-progress' },  // Advanced Pharmacology
    { offeringId: 'co-002', status: 'in-progress' },  // Cellular & Molecular Biology
    { offeringId: 'co-003', status: 'in-progress' },  // Clinical Anatomy
    { offeringId: 'co-005', status: 'in-progress' },  // Evidence-Based Practice I
    // Fall 2025 — 3 completed courses
    { offeringId: 'co-006', status: 'completed' },    // Pharmacokinetics
    { offeringId: 'co-007', status: 'completed' },    // Foundations of Biology
    { offeringId: 'co-010', status: 'completed' },    // Pathophysiology
  ],
  biol201: [
    // Spring 2026 — 3 active courses
    { offeringId: 'co-001', status: 'in-progress' },
    { offeringId: 'co-002', status: 'in-progress' },
    { offeringId: 'co-005', status: 'in-progress' },
    // Fall 2025 — 3 completed courses
    { offeringId: 'co-007', status: 'completed' },
    { offeringId: 'co-006', status: 'completed' },
    { offeringId: 'co-010', status: 'completed' },
  ],
  skel101: [
    // Final semester — 2 courses only
    { offeringId: 'co-003', status: 'in-progress' },
    { offeringId: 'co-001', status: 'in-progress' },
  ],
}

const GRADE_OPTIONS = ['A', 'A-', 'B+', 'B', 'B-']

// ── Extended student data ─────────────────────────────────────────────────────
//
// Build extended records from the existing facultyStudents data so IDs align.

export const allStudents: ExtendedStudent[] = facultyStudents.map((s, i) => {
  const seed = (i + 1) * 13
  const gpa = parseFloat((2.3 + ((seed * 17) % 19) / 10).toFixed(2))
  const programIdx = i % PROGRAMS.length
  const advisorIdx = i % ADVISORS.length

  const prefix = s.id.includes('phar101') ? 'phar101' :
                 s.id.includes('biol201') ? 'biol201' : 'skel101'

  const templates = ENROLLMENT_TEMPLATES[prefix]

  const courseEnrollments: CourseEnrollment[] = templates.map((tmpl, ti) => {
    const offeringRow = courseOfferingRows.find(r => r.id === tmpl.offeringId)!
    const assessCount = 3 + ((seed + ti) % 4)
    const completedCount =
      tmpl.status === 'completed'    ? assessCount :
      tmpl.status === 'in-progress'  ? 1 + ((seed + ti) % Math.max(1, assessCount - 1)) : 0
    const avgExamScore =
      tmpl.status === 'completed'   ? Math.min(97, Math.max(58, 68 + ((seed * (ti + 1)) % 28))) :
      tmpl.status === 'in-progress' ? Math.min(96, Math.max(60, 70 + ((seed * (ti + 2)) % 25))) :
      undefined
    return {
      offeringId: tmpl.offeringId,
      courseId: offeringRow.courseId,
      courseCode: offeringRow.courseNumber,
      courseName: offeringRow.courseName,
      term: offeringRow.term,
      status: tmpl.status,
      grade: tmpl.status === 'completed' ? GRADE_OPTIONS[(seed + ti) % GRADE_OPTIONS.length] : undefined,
      assessmentCount: assessCount,
      completedAssessments: completedCount,
      avgExamScore,
    }
  })

  const hasIntervention = i % 5 === 2 || gpa < 2.7
  const interventions: StudentIntervention[] = hasIntervention ? [
    {
      id: `int-${s.id}`,
      type: gpa < 2.5 ? 'early-alert' : 'advising',
      date: daysAgoIso(14 + (seed % 20)),
      staffMember: ADVISORS[advisorIdx],
      notes: gpa < 2.5
        ? 'Student placed on academic probation. Mandatory weekly check-ins scheduled.'
        : 'Student flagged for mid-term performance dip. Advising session completed.',
      isActive: true,
      followUpDate: daysAgoIso(-7), // future
    },
  ] : []

  const annotations: StudentAnnotation[] = [
    // Low GPA intervention tag
    ...(gpa < 2.7 ? [{
      id: `ann-${s.id}-1`,
      text: 'Referred to Academic Support Services',
      addedBy: ADVISORS[advisorIdx],
      addedDate: daysAgoIso(30),
      type: 'tag' as const,
    }] : []),
    // Periodic advising note — every 3rd student
    ...((i % 3 === 0) ? [{
      id: `ann-${s.id}-2`,
      text: 'Student athlete — may need exam scheduling flexibility',
      addedBy: 'Student Affairs',
      addedDate: daysAgoIso(60),
      type: 'note' as const,
    }] : []),
    // High-achiever recognition tag — every 5th student with good GPA
    ...((i % 5 === 0 && gpa >= 2.7) ? [{
      id: `ann-${s.id}-3`,
      text: "Dean's list recognition — Spring 2026",
      addedBy: ADVISORS[advisorIdx],
      addedDate: daysAgoIso(15),
      type: 'tag' as const,
    }] : []),
  ]

  const documents: StudentDocument[] = [
    ...facultyAccommodations
      .filter(a => a.studentId === s.id)
      .map((a, di) => ({
        id: `doc-acc-${s.id}-${di}`,
        name: `Accommodation Letter — ${a.type.replace(/-/g, ' ')}`,
        type: 'accommodation-letter' as const,
        uploadedDate: a.approvedDate,
        uploadedBy: a.approvedBy,
      })),
    ...((i % 6 === 0) ? [{
      id: `doc-adv-${s.id}`,
      name: 'Advising Session Notes — Spring 2026',
      type: 'advising-note' as const,
      uploadedDate: daysAgoIso(21),
      uploadedBy: ADVISORS[advisorIdx],
    }] : []),
  ]

  const competencyPerformance: CompetencyPerformance[] = COMPETENCY_AREAS.slice(0, 4).map((area, ci) => {
    const base = s.avgScore[s.enrolledCourseIds[0]] ?? 75
    const score = Math.min(100, Math.max(40, base + ((ci * seed) % 20) - 10))
    return {
      area,
      avgScore: score,
      trend: score >= 80 ? 'improving' : score < 65 ? 'declining' : 'stable',
    }
  })

  return {
    ...s,
    program: PROGRAMS[programIdx],
    advisor: ADVISORS[advisorIdx],
    gpa,
    prismLinked: i % 3 !== 0,
    academicStanding: standing(gpa),
    annotations,
    interventions,
    documents,
    courseEnrollments,
    competencyPerformance,
  }
})

// ── Summary helper for list view ─────────────────────────────────────────────

export interface StudentListRow {
  id: string
  studentId: string
  fullName: string
  email: string
  cohort: string
  program: string
  advisor: string
  gpa: number
  courseCount: number
  academicStanding: AcademicStanding
  annotations: StudentAnnotation[]
  status: 'active' | 'at-risk' | 'top-performer' | 'inactive'
  prismLinked: boolean
}

export const studentListRows: StudentListRow[] = allStudents.map(s => ({
  id: s.id,
  studentId: s.studentId,
  fullName: `${s.firstName} ${s.lastName}`,
  email: s.email,
  cohort: s.cohort,
  program: s.program,
  advisor: s.advisor,
  gpa: s.gpa,
  courseCount: s.courseEnrollments.length,
  academicStanding: s.academicStanding,
  annotations: s.annotations,
  status: s.status,
  prismLinked: s.prismLinked,
}))
