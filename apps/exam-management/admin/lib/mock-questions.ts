export type QuestionType = 'mcq' | 'true-false' | 'short-answer' | 'essay'
export type QuestionScope = 'private' | 'shared' | 'course'

export interface Question {
  id: string
  title: string
  type: QuestionType
  course: string
  folder: string
  createdBy: string
  updatedAt: string
  scope: QuestionScope
  tags: string[]
}

export const MOCK_QUESTIONS: Question[] = [
  {
    id: '1',
    title: 'Which of the following is a primary symptom of Type 2 Diabetes?',
    type: 'mcq',
    course: 'Clinical Medicine I',
    folder: 'Endocrinology',
    createdBy: 'Dr. Sarah Chen',
    updatedAt: '2026-04-10',
    scope: 'shared',
    tags: ['diabetes', 'endocrinology', 'symptoms'],
  },
  {
    id: '2',
    title: 'Insulin resistance is the primary cause of Type 1 Diabetes.',
    type: 'true-false',
    course: 'Clinical Medicine I',
    folder: 'Endocrinology',
    createdBy: 'Dr. Sarah Chen',
    updatedAt: '2026-04-09',
    scope: 'shared',
    tags: ['diabetes', 'endocrinology'],
  },
  {
    id: '3',
    title: 'Describe the pathophysiology of heart failure and its compensatory mechanisms.',
    type: 'essay',
    course: 'Cardiology',
    folder: 'Heart Failure',
    createdBy: 'Dr. James Patel',
    updatedAt: '2026-04-08',
    scope: 'course',
    tags: ['cardiology', 'heart failure', 'pathophysiology'],
  },
  {
    id: '4',
    title: 'List three common signs of acute appendicitis.',
    type: 'short-answer',
    course: 'Surgery',
    folder: 'Acute Abdomen',
    createdBy: 'Dr. Maria Lopez',
    updatedAt: '2026-04-07',
    scope: 'private',
    tags: ['surgery', 'appendicitis', 'acute abdomen'],
  },
  {
    id: '5',
    title: 'Which antibiotic class is first-line for community-acquired pneumonia?',
    type: 'mcq',
    course: 'Infectious Disease',
    folder: 'Respiratory Infections',
    createdBy: 'Dr. Ahmed Hassan',
    updatedAt: '2026-04-06',
    scope: 'shared',
    tags: ['antibiotics', 'pneumonia', 'infectious disease'],
  },
  {
    id: '6',
    title: 'Explain the mechanism of action of beta-blockers.',
    type: 'short-answer',
    course: 'Pharmacology',
    folder: 'Cardiovascular Drugs',
    createdBy: 'Dr. James Patel',
    updatedAt: '2026-04-05',
    scope: 'course',
    tags: ['pharmacology', 'beta-blockers', 'cardiology'],
  },
  {
    id: '7',
    title: 'Rheumatoid arthritis primarily affects weight-bearing joints.',
    type: 'true-false',
    course: 'Rheumatology',
    folder: 'Inflammatory Arthritis',
    createdBy: 'Dr. Maria Lopez',
    updatedAt: '2026-04-04',
    scope: 'private',
    tags: ['rheumatology', 'arthritis'],
  },
  {
    id: '8',
    title: 'Discuss the ethical considerations in end-of-life care.',
    type: 'essay',
    course: 'Medical Ethics',
    folder: 'End-of-Life',
    createdBy: 'Dr. Sarah Chen',
    updatedAt: '2026-04-03',
    scope: 'shared',
    tags: ['ethics', 'palliative care', 'end-of-life'],
  },
]

export const QB_METRICS = [
  {
    id: 'total',
    label: 'Total Questions',
    value: MOCK_QUESTIONS.length,
  },
  {
    id: 'shared',
    label: 'Shared',
    value: MOCK_QUESTIONS.filter((q) => q.scope === 'shared').length,
  },
  {
    id: 'course-based',
    label: 'Course-Based',
    value: MOCK_QUESTIONS.filter((q) => q.scope === 'course').length,
  },
  {
    id: 'private',
    label: 'Private',
    value: MOCK_QUESTIONS.filter((q) => q.scope === 'private').length,
  },
]
