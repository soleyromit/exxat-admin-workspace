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
import { mockCourseOfferings, mockAssessments } from './qb-mock-data'

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
  courseId: string
  courseCode: string
  courseName: string
  term: string
  status: 'completed' | 'in-progress' | 'upcoming'
  grade?: string       // letter grade if completed
  assessmentCount: number
  completedAssessments: number
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

// ── Extended student data ─────────────────────────────────────────────────────
//
// Build extended records from the existing facultyStudents data so IDs align.

export const allStudents: ExtendedStudent[] = facultyStudents.map((s, i) => {
  const seed = (i + 1) * 13
  const gpa = parseFloat((2.3 + ((seed * 17) % 19) / 10).toFixed(2))
  const programIdx = i % PROGRAMS.length
  const advisorIdx = i % ADVISORS.length

  const courseEnrollments: CourseEnrollment[] = s.enrolledCourseIds.map(cid => {
    const offering = mockCourseOfferings.find(o => o.courseId === cid)
    return {
      courseId: cid,
      courseCode: cid.replace('course-', '').toUpperCase(),
      courseName: offering ? `${offering.courseId.replace('course-', '').toUpperCase()} — ${offering.semester}` : cid,
      term: offering?.semester ?? 'Spring 2026',
      status: i % 3 === 0 ? 'completed' : 'in-progress',
      grade: i % 3 === 0 ? ['A', 'A-', 'B+', 'B'][i % 4] : undefined,
      assessmentCount: 3 + (seed % 4),
      completedAssessments: i % 3 === 0 ? 3 + (seed % 4) : 1 + (seed % 3),
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
  courseCount: s.enrolledCourseIds.length,
  academicStanding: s.academicStanding,
  annotations: s.annotations,
  status: s.status,
  prismLinked: s.prismLinked,
}))
