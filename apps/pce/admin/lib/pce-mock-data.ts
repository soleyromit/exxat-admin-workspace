export type SurveyStatus = 'draft' | 'active' | 'collecting' | 'pending_review' | 'released' | 'closed'
export type TemplateSection = 'course_content' | 'faculty_performance' | 'course_director'
export type UserRole = 'admin' | 'faculty'

export interface PceTemplate {
  id: string
  name: string
  sections: TemplateSection[]
  status: 'active' | 'draft'
  questionCount: number
  usedBySurveyCount: number
  lastModified: string
  createdBy: string
}

export interface PceInstructor {
  id: string
  name: string
  initials: string
  role: 'primary' | 'guest'
}

export interface PceSurvey {
  id: string
  courseCode: string
  courseName: string
  term: string
  templateId: string
  status: SurveyStatus
  instructors: PceInstructor[]
  responseRate: number
  responseCount: number
  enrollmentCount: number
  deadline: string
  createdAt: string
  releasedAt?: string
  closedAt?: string
}

export interface SectionScore {
  section: TemplateSection
  avg: number
  count: number
}

export interface ResponseComment {
  section: TemplateSection
  text: string
  sentiment: 'positive' | 'neutral' | 'concern'
}

export interface PceResponse {
  surveyId: string
  sectionScores: SectionScore[]
  comments: ResponseComment[]
}

export interface PceUser {
  id: string
  name: string
  email: string
  initials: string
  role: UserRole
}

export const MOCK_CURRENT_USER: PceUser = {
  id: 'u1',
  name: 'Dr. Sarah Thompson',
  email: 'thompson@university.edu',
  initials: 'ST',
  role: 'admin',
}

export const MOCK_TEMPLATES: PceTemplate[] = [
  {
    id: 't1',
    name: 'Standard PCE',
    sections: ['course_content', 'faculty_performance', 'course_director'],
    status: 'active',
    questionCount: 24,
    usedBySurveyCount: 12,
    lastModified: 'Apr 18, 2026',
    createdBy: 'Dr. Thompson',
  },
  {
    id: 't2',
    name: 'Short Form PCE',
    sections: ['course_content', 'faculty_performance'],
    status: 'active',
    questionCount: 16,
    usedBySurveyCount: 4,
    lastModified: 'Mar 02, 2026',
    createdBy: 'Dr. Thompson',
  },
  {
    id: 't3',
    name: 'Faculty-Focused Evaluation',
    sections: ['course_content', 'faculty_performance'],
    status: 'draft',
    questionCount: 8,
    usedBySurveyCount: 0,
    lastModified: 'Apr 22, 2026',
    createdBy: 'Dr. Thompson',
  },
]

const INSTRUCTORS: Record<string, PceInstructor> = {
  patel:    { id: 'f1', name: 'Dr. Anita Patel',    initials: 'AP', role: 'primary' },
  chen:     { id: 'f2', name: 'Dr. Kevin Chen',     initials: 'KC', role: 'guest'   },
  williams: { id: 'f3', name: 'Dr. Maria Williams', initials: 'MW', role: 'primary' },
  kim:      { id: 'f4', name: 'Dr. James Kim',      initials: 'JK', role: 'primary' },
}

export const MOCK_SURVEYS: PceSurvey[] = [
  {
    id: 's1',
    courseCode: 'BIO 201',
    courseName: 'Cellular Biology',
    term: 'Spring 2026',
    templateId: 't1',
    status: 'pending_review',
    instructors: [INSTRUCTORS.patel, { ...INSTRUCTORS.chen, role: 'guest' }],
    responseRate: 68,
    responseCount: 34,
    enrollmentCount: 50,
    deadline: 'Apr 30, 2026',
    createdAt: 'Jan 15, 2026',
  },
  {
    id: 's2',
    courseCode: 'NURS 310',
    courseName: 'Advanced Patient Care',
    term: 'Spring 2026',
    templateId: 't1',
    status: 'collecting',
    instructors: [INSTRUCTORS.williams, { ...INSTRUCTORS.chen, role: 'guest' }],
    responseRate: 42,
    responseCount: 21,
    enrollmentCount: 50,
    deadline: 'May 05, 2026',
    createdAt: 'Jan 15, 2026',
  },
  {
    id: 's3',
    courseCode: 'MED 410',
    courseName: 'Clinical Pharmacology',
    term: 'Spring 2026',
    templateId: 't2',
    status: 'released',
    instructors: [INSTRUCTORS.williams],
    responseRate: 91,
    responseCount: 46,
    enrollmentCount: 50,
    deadline: 'Apr 15, 2026',
    createdAt: 'Jan 15, 2026',
    releasedAt: 'Apr 17, 2026',
  },
  {
    id: 's4',
    courseCode: 'PHYS 101',
    courseName: 'Medical Physics',
    term: 'Fall 2025',
    templateId: 't2',
    status: 'closed',
    instructors: [INSTRUCTORS.kim],
    responseRate: 88,
    responseCount: 44,
    enrollmentCount: 50,
    deadline: 'Dec 10, 2025',
    createdAt: 'Aug 20, 2025',
    releasedAt: 'Dec 14, 2025',
    closedAt: 'Jan 10, 2026',
  },
  {
    id: 's5',
    courseCode: 'NURS 210',
    courseName: 'Fundamentals of Nursing',
    term: 'Spring 2026',
    templateId: 't1',
    status: 'pending_review',
    instructors: [INSTRUCTORS.kim],
    responseRate: 73,
    responseCount: 22,
    enrollmentCount: 30,
    deadline: 'Apr 22, 2026',
    createdAt: 'Jan 15, 2026',
  },
  {
    id: 's6',
    courseCode: 'MED 101',
    courseName: 'Introduction to Medicine',
    term: 'Spring 2026',
    templateId: 't1',
    status: 'pending_review',
    instructors: [INSTRUCTORS.kim],
    responseRate: 80,
    responseCount: 8,
    enrollmentCount: 10,
    deadline: 'Apr 22, 2026',
    createdAt: 'Jan 15, 2026',
  },
  {
    id: 's7',
    courseCode: 'BIO 301',
    courseName: 'Molecular Genetics',
    term: 'Spring 2026',
    templateId: 't2',
    status: 'draft',
    instructors: [INSTRUCTORS.patel],
    responseRate: 0,
    responseCount: 0,
    enrollmentCount: 35,
    deadline: 'May 30, 2026',
    createdAt: 'Apr 20, 2026',
  },
]

export const MOCK_RESPONSES: PceResponse[] = [
  {
    surveyId: 's1',
    sectionScores: [
      { section: 'course_content', avg: 4.1, count: 34 },
      { section: 'faculty_performance', avg: 4.3, count: 34 },
    ],
    comments: [
      { section: 'faculty_performance', text: 'Very organized and responsive to questions.', sentiment: 'positive' },
      { section: 'faculty_performance', text: 'Could improve pacing in later sessions.', sentiment: 'concern' },
      { section: 'course_content', text: 'Course materials were well-structured and easy to follow.', sentiment: 'positive' },
      { section: 'course_content', text: 'Some lab sessions felt rushed.', sentiment: 'concern' },
    ],
  },
  {
    surveyId: 's3',
    sectionScores: [
      { section: 'course_content', avg: 3.8, count: 46 },
      { section: 'faculty_performance', avg: 4.6, count: 46 },
    ],
    comments: [
      { section: 'faculty_performance', text: 'Dr. Williams is an excellent communicator.', sentiment: 'positive' },
      { section: 'faculty_performance', text: 'Office hours were very helpful.', sentiment: 'positive' },
      { section: 'faculty_performance', text: 'Pace of lectures was sometimes too fast to follow.', sentiment: 'neutral' },
      { section: 'course_content', text: 'Some topics could be covered in more depth.', sentiment: 'neutral' },
      { section: 'course_content', text: 'More worked examples in assessments would help.', sentiment: 'concern' },
    ],
  },
  {
    surveyId: 's4',
    sectionScores: [
      { section: 'course_content', avg: 4.5, count: 44 },
      { section: 'faculty_performance', avg: 4.2, count: 44 },
    ],
    comments: [
      { section: 'course_content', text: 'Great course structure overall.', sentiment: 'positive' },
      { section: 'faculty_performance', text: 'Lectures were engaging and informative.', sentiment: 'positive' },
    ],
  },
]

export const MOCK_TERMS = ['Spring 2026', 'Fall 2025', 'Spring 2025']

export const SECTION_LABELS: Record<TemplateSection, string> = {
  course_content: 'Course Content',
  faculty_performance: 'Faculty Performance',
  course_director: 'Course Director',
}

export const FACULTY_SECTION_LABELS: Record<TemplateSection, string> = {
  course_content: 'About the Course',
  faculty_performance: 'About Your Teaching',
  course_director: 'About the Course Director',
}

export const SECTION_ABBREV: Record<TemplateSection, string> = {
  course_content: 'CC',
  faculty_performance: 'FP',
  course_director: 'CD',
}

export const MOCK_COURSES = [
  { code: 'BIO 201', name: 'Cellular Biology' },
  { code: 'NURS 310', name: 'Advanced Patient Care' },
  { code: 'MED 410', name: 'Clinical Pharmacology' },
  { code: 'PHYS 101', name: 'Medical Physics' },
  { code: 'NURS 210', name: 'Fundamentals of Nursing' },
  { code: 'MED 101', name: 'Introduction to Medicine' },
  { code: 'BIO 301', name: 'Molecular Genetics' },
  { code: 'CHEM 201', name: 'Biochemistry' },
]

export const MOCK_FACULTY: PceInstructor[] = [
  { id: 'f1', name: 'Dr. Anita Patel',    initials: 'AP', role: 'primary' },
  { id: 'f2', name: 'Dr. Kevin Chen',     initials: 'KC', role: 'primary' },
  { id: 'f3', name: 'Dr. Maria Williams', initials: 'MW', role: 'primary' },
  { id: 'f4', name: 'Dr. James Kim',      initials: 'JK', role: 'primary' },
  { id: 'f5', name: 'Dr. Rachel Gomez',   initials: 'RG', role: 'primary' },
  { id: 'f6', name: 'Dr. Omar Hassan',    initials: 'OH', role: 'primary' },
]
