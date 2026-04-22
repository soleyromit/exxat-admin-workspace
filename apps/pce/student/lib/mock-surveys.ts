export type SurveyStatus = 'open' | 'submitted' | 'closed'

export interface Instructor {
  id: string
  name: string
  initials: string
}

export interface Question {
  id: string
  text: string
  type: 'rating' | 'text'
}

export interface SurveySection {
  id: string
  title: string
  description: string
  questions: Question[]
}

export interface StudentSurvey {
  id: string
  courseCode: string
  courseName: string
  term: string
  status: SurveyStatus
  deadline: string
  instructors: Instructor[]
  sections: SurveySection[]
  submittedAt?: string
}

const COURSE_CONTENT_QUESTIONS: Question[] = [
  { id: 'cc1', text: 'The course objectives were clearly stated.', type: 'rating' },
  { id: 'cc2', text: 'Course materials supported my learning effectively.', type: 'rating' },
  { id: 'cc3', text: 'The workload was appropriate for the credit hours.', type: 'rating' },
  { id: 'cc4', text: 'The course was well-organized and structured.', type: 'rating' },
  { id: 'cc5', text: 'Assessments were aligned with the learning objectives.', type: 'rating' },
  { id: 'cc6', text: 'What aspects of the course content were most valuable?', type: 'text' },
  { id: 'cc7', text: 'What would you suggest to improve the course content?', type: 'text' },
]

const FACULTY_PERFORMANCE_QUESTIONS: Question[] = [
  { id: 'fp1', text: 'The instructor was well-prepared for each class session.', type: 'rating' },
  { id: 'fp2', text: 'The instructor communicated expectations clearly.', type: 'rating' },
  { id: 'fp3', text: 'The instructor encouraged student participation and questions.', type: 'rating' },
  { id: 'fp4', text: 'The instructor provided helpful and timely feedback.', type: 'rating' },
  { id: 'fp5', text: 'The instructor was accessible during office hours.', type: 'rating' },
  { id: 'fp6', text: 'What did this instructor do particularly well?', type: 'text' },
]

export const MOCK_STUDENT_SURVEYS: StudentSurvey[] = [
  {
    id: 'ps1',
    courseCode: 'BIO 201',
    courseName: 'Cellular Biology',
    term: 'Spring 2026',
    status: 'open',
    deadline: 'May 5, 2026',
    instructors: [
      { id: 'f1', name: 'Dr. Anita Patel', initials: 'AP' },
      { id: 'f2', name: 'Dr. Kevin Chen', initials: 'KC' },
    ],
    sections: [
      {
        id: 'cc',
        title: 'Course Content',
        description: 'Help us understand how well the course content supported your learning.',
        questions: COURSE_CONTENT_QUESTIONS,
      },
      {
        id: 'fp-patel',
        title: 'Faculty Performance — Dr. Anita Patel',
        description: 'Share your experience with Dr. Patel as an instructor.',
        questions: FACULTY_PERFORMANCE_QUESTIONS,
      },
      {
        id: 'fp-chen',
        title: 'Faculty Performance — Dr. Kevin Chen',
        description: 'Share your experience with Dr. Chen as a guest lecturer.',
        questions: FACULTY_PERFORMANCE_QUESTIONS,
      },
    ],
  },
  {
    id: 'ps2',
    courseCode: 'NURS 310',
    courseName: 'Advanced Patient Care',
    term: 'Spring 2026',
    status: 'open',
    deadline: 'May 10, 2026',
    instructors: [{ id: 'f3', name: 'Dr. Maria Williams', initials: 'MW' }],
    sections: [
      {
        id: 'cc',
        title: 'Course Content',
        description: 'Help us understand how well the course content supported your learning.',
        questions: COURSE_CONTENT_QUESTIONS,
      },
      {
        id: 'fp-williams',
        title: 'Faculty Performance — Dr. Maria Williams',
        description: 'Share your experience with Dr. Williams as an instructor.',
        questions: FACULTY_PERFORMANCE_QUESTIONS,
      },
    ],
  },
  {
    id: 'ps3',
    courseCode: 'MED 410',
    courseName: 'Clinical Pharmacology',
    term: 'Spring 2026',
    status: 'submitted',
    deadline: 'Apr 20, 2026',
    submittedAt: 'Apr 18, 2026',
    instructors: [{ id: 'f3', name: 'Dr. Maria Williams', initials: 'MW' }],
    sections: [
      {
        id: 'cc',
        title: 'Course Content',
        description: 'Help us understand how well the course content supported your learning.',
        questions: COURSE_CONTENT_QUESTIONS,
      },
      {
        id: 'fp-williams',
        title: 'Faculty Performance — Dr. Maria Williams',
        description: 'Share your experience with Dr. Williams as an instructor.',
        questions: FACULTY_PERFORMANCE_QUESTIONS,
      },
    ],
  },
  {
    id: 'ps4',
    courseCode: 'PHYS 101',
    courseName: 'Medical Physics',
    term: 'Fall 2025',
    status: 'closed',
    deadline: 'Dec 10, 2025',
    submittedAt: 'Dec 8, 2025',
    instructors: [{ id: 'f4', name: 'Dr. James Kim', initials: 'JK' }],
    sections: [
      {
        id: 'cc',
        title: 'Course Content',
        description: 'Help us understand how well the course content supported your learning.',
        questions: COURSE_CONTENT_QUESTIONS,
      },
      {
        id: 'fp-kim',
        title: 'Faculty Performance — Dr. James Kim',
        description: 'Share your experience with Dr. Kim as an instructor.',
        questions: FACULTY_PERFORMANCE_QUESTIONS,
      },
    ],
  },
]

export const STUDENT_METRICS = [
  { id: 'open',      label: 'Open',      value: '2' },
  { id: 'submitted', label: 'Submitted', value: '1' },
  { id: 'total',     label: 'Total',     value: '4' },
]
