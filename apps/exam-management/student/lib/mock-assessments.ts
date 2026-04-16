export type AssessmentStatus = 'not-started' | 'in-progress' | 'submitted' | 'graded'

export interface Assessment {
  id: string
  title: string
  course: string
  dueDate: string
  duration: number
  questionCount: number
  status: AssessmentStatus
  score?: number
}

export const MOCK_ASSESSMENTS: Assessment[] = [
  { id: 'a1', title: 'Cardiology Mid-Term', course: 'Anatomy 101', dueDate: '04/20/2026', duration: 60, questionCount: 30, status: 'not-started' },
  { id: 'a2', title: 'Pharmacology Quiz 3', course: 'Pharmacology', dueDate: '04/18/2026', duration: 30, questionCount: 15, status: 'in-progress' },
  { id: 'a3', title: 'Physiology Unit 2', course: 'Physiology', dueDate: '04/15/2026', duration: 45, questionCount: 20, status: 'submitted' },
  { id: 'a4', title: 'Anatomy Final Review', course: 'Anatomy 101', dueDate: '04/10/2026', duration: 90, questionCount: 50, status: 'graded', score: 87 },
  { id: 'a5', title: 'Drug Interactions Quiz', course: 'Pharmacology', dueDate: '04/08/2026', duration: 20, questionCount: 10, status: 'graded', score: 92 },
]

export const ASSESSMENT_METRICS = [
  { id: 'total', label: 'Assigned', value: MOCK_ASSESSMENTS.length },
  { id: 'pending', label: 'Pending', value: MOCK_ASSESSMENTS.filter(a => a.status === 'not-started' || a.status === 'in-progress').length },
  { id: 'graded', label: 'Graded', value: MOCK_ASSESSMENTS.filter(a => a.status === 'graded').length },
  { id: 'avg', label: 'Avg Score', value: '89%' },
]
