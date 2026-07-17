export type SurveyStatus = 'draft' | 'active' | 'collecting' | 'scheduled' | 'pending_review' | 'released' | 'closed'
export type TemplateSection = 'course_content' | 'faculty_performance' | 'course_director'
export type UserRole = 'admin' | 'faculty'
export type SubjectKey = 'course_content' | 'faculty' | 'course_instructor' | 'course_coordinator' | 'teaching_assistant' | 'lab_instructor' | 'course_director' | 'preceptor' | 'clinical_supervisor'
export type SurveyType = 'course_evaluation' | 'programmatic'

// ── Evaluation types ──────────────────────────────────────────────────────────
// A single course offering is evaluated along MORE THAN ONE type at setup, and
// each type runs on its own clock — so one offering can show three different
// statuses at once (Romit, 2026-07-17). Order = the canonical setup order.
export type EvaluationType = 'course_material' | 'faculty_roles' | 'general'
export const EVALUATION_TYPE_ORDER: EvaluationType[] = ['course_material', 'faculty_roles', 'general']
export const EVALUATION_TYPE_LABEL: Record<EvaluationType, string> = {
  course_material: 'Course Material',
  faculty_roles:   'Faculty and other roles',
  general:         'General',
}
export const EVALUATION_TYPE_ICON: Record<EvaluationType, string> = {
  course_material: 'fa-book-open',
  faculty_roles:   'fa-chalkboard-user',
  general:         'fa-clipboard-list',
}
/** One evaluation type's own lifecycle + response tracking within an offering. */
export interface EvaluationInstance {
  type: EvaluationType
  status: SurveyStatus
  responseRate: number
  responseCount: number
  enrollmentCount: number
  deadline: string
}

// Classroom based (didactic) · Practice based (clinical) · Lab based (seminar).
export type CourseTypeFilter = 'didactic' | 'clinical' | 'seminar' | 'any'

export interface PceSubject {
  key: SubjectKey
  label: string
  description: string
  isGeneral: boolean  // true = always available (e.g. Course Content), false = Prism role-based
  prismCount?: number // how many courses in the mock data have this role assigned
  perLabel?: string   // "course" | "faculty member" | "preceptor" etc.
}

/** A Faculty role set — roles declared OUTSIDE the section (Jul 1 PCE constraint).
 *  Owns the Faculty sections whose `roleSetId` equals this set's id. */
export interface PceTemplateRoleSet {
  id: string
  roles: string[]
}

export interface PceTemplateSection {
  id: string
  subjectKey: string
  title: string  // admin-customizable display name
  description?: string
  /** Faculty aspect only — the role set this section belongs to. Roles are declared
   *  on the set (PceTemplateRoleSet), NEVER on the section. A section references its
   *  set by id; it does not carry roles itself. */
  roleSetId?: string
  questions: TemplateQuestion[]
  order: number
}

export interface PceProgram {
  id: string
  name: string
  code: string
}

export interface PceOpenTextResponse {
  id: string
  surveyId: string
  questionText: string
  text: string
  sectionSubject: SubjectKey
  flagged?: boolean
  /** AI pre-tag. 'concern' renders as "Constructive" (amber — no red in rating UI). */
  sentiment?: 'positive' | 'neutral' | 'concern'
}

export interface PceTemplate {
  id: string
  name: string
  description?: string
  sections: TemplateSection[]
  status: 'active' | 'draft'
  questionCount: number
  usedBySurveyCount: number
  lastModified: string
  createdBy: string
  /** Actual question content per section. Source of truth — questionCount is derived from this. */
  questions: Record<TemplateSection, TemplateQuestion[]>
  /** Likert pointer (3 | 4 | 5 | 7 | 10). Defaults to 5 until T30 settings page. */
  likertPointer: 3 | 4 | 5 | 7 | 10
  courseType?: CourseTypeFilter
  /** CE templates — CB/PB/LB match target picked in Template settings (Monil
   *  2026-07-10: Course type is back; Survey type/Access are programmatic-only).
   *  Legacy `courseType` mirrors it so push-wizard auto-assign keeps matching. */
  deliveryMode?: DeliveryMode
  /** CE templates — preferred default when auto-assigning within its course type. */
  isDefaultForType?: boolean
  /** Survey type — the purpose this template serves. Shown in the template settings step. */
  surveyPurpose?: 'student_pulse' | 'faculty_self_eval' | 'alumni' | 'preceptor_eval'
  /** Visibility — 'program' = any admin/coordinator in the program can find & use it;
   *  'private' = only the creator. Defaults to 'program' when unset. */
  access?: 'program' | 'private'
  /** Owning program — drives the Program filter on the templates hub (matches live). */
  programId?: string
  /** 'course_evaluation' | 'programmatic'. Added in Phase 1 expansion. */
  surveyType?: SurveyType
  /** Dynamic subject-based sections (additive — parallel to legacy questions/sections). */
  templateSections?: PceTemplateSection[]
  /** Faculty aspect role sets. Each set declares one OR multiple roles (outside the
   *  section) and owns the Faculty sections whose roleSetId matches. One role → role-
   *  specific questions; multiple roles → shared questions. Add more sets for more cases. */
  facultyRoleSets?: PceTemplateRoleSet[]
  /** Optional form-level instruction shown to respondents before the first question. */
  formInstructionTitle?: string
  formInstructionDescription?: string
}

/** Min response rate (%) required before results release — mirrors the
 *  "Minimum response rate to release" control in Evaluation settings.
 *  Source of truth for the "Below threshold" KPI on the Evaluations hub. */
export const EVAL_RELEASE_THRESHOLD_PCT = 60

/** Faculty roles eligible to be evaluated in a course evaluation. */
export const EVAL_FACULTY_ROLES = [
  { id: 'course-coordinator', label: 'Course Coordinator' },
  { id: 'instructor',         label: 'Instructor' },
  { id: 'teaching-assistant', label: 'Teaching Assistant' },
  { id: 'lab-assistant',      label: 'Lab Assistant' },
  { id: 'guest-lecturer',     label: 'Guest Lecturer' },
] as const

/** Default selected faculty roles (all active teaching roles, TAs excluded by default). */
export const EVAL_DEFAULT_FACULTY_ROLE_IDS: string[] = ['course-coordinator', 'instructor']

/** Benchmark targets used in analytics — source of truth for threshold lines on charts. */
export const EVAL_BENCHMARKS = {
  targetResponseRate: 70, // % — courses below this are flagged
  targetCourseScore:  4.0, // out of 5
  targetFacultyScore: 4.0, // out of 5
} as const

/** Default Likert scale configuration — single source read by template editor + analytics. */
export const EVAL_DEFAULT_SCALE = {
  preset: 'agreement' as const,
  points: 5,
  labels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
}

// ── Evaluation Dates — anchor-date model (mirrors live /settings → Evaluation Dates) ──
export type DateAnchor = 'course_end' | 'term_end'
export const DATE_ANCHOR_LABELS: Record<DateAnchor, string> = {
  course_end: 'Course End Date',
  term_end:   'Term End Date',
}
/** Window + release rules: a signed day-offset from a chosen anchor. */
export const EVAL_DATE_RULES = {
  windowAnchor:  'course_end' as DateAnchor,
  opensOffset:   -7, // negative = before anchor
  closesOffset:  7,  // positive = after anchor
  releaseAnchor: 'course_end' as DateAnchor,
  releaseOffset: 14,
}

// ── Communication — email templates (mirrors live Email Templates manager) ──
export type EvalEmailType = 'invitation' | 'reminder'
export type EvalEmailStatus = 'action_required' | 'ready'
export interface EvalEmailTemplate {
  id: string
  name: string
  type: EvalEmailType
  status: EvalEmailStatus
  subject: string
  body: string
}
export const EVAL_EMAIL_TEMPLATES: EvalEmailTemplate[] = [
  {
    id: 'tpl-invite-formal', name: 'Formal Invite', type: 'invitation', status: 'ready',
    subject: 'Your course evaluation for {{course_name}} is now open',
    body: 'Hi {{student_first_name}},\n\nYour course evaluation for {{course_name}} ({{term_name}}) is now open and your response is required. Your answers are anonymous.\n\nComplete it by {{close_date}}: {{survey_link}}\n\n{{program_name}} Team',
  },
  {
    id: 'tpl-invite-friendly', name: 'Friendly Nudge', type: 'invitation', status: 'ready',
    subject: 'We’d love your feedback on {{course_name}}',
    body: 'Hi {{student_first_name}},\n\nGot 5 minutes? Your anonymous feedback on {{course_name}} helps us make the program better.\n\n{{survey_link}}\n\nThank you!\n{{program_name}} Team',
  },
  {
    id: 'tpl-reminder-formal', name: 'Formal Reminder', type: 'reminder', status: 'ready',
    subject: 'Reminder: {{course_name}} evaluation closes {{close_date}}',
    body: 'Hi {{student_first_name}},\n\nYour evaluation for {{course_name}} closes in {{days_until_close}} day{{s}} ({{close_date}}). It takes about 5 minutes and is anonymous.\n\n{{survey_link}}\n\n{{program_name}} Team',
  },
]

// ── Communication — reminder cadence engine (mirrors live Reminder Cadence) ──
export type ReminderFrequency = 'daily' | 'every_3_days' | 'every_7_days' | 'custom'
export type ReminderAnchor = 'survey_close' | 'term_end' | 'course_end'
export const REMINDER_FREQUENCY_LABELS: Record<ReminderFrequency, string> = {
  daily: 'Daily', every_3_days: 'Every 3 days', every_7_days: 'Every 7 days', custom: 'Custom',
}
export const REMINDER_ANCHOR_LABELS: Record<ReminderAnchor, string> = {
  survey_close: 'Survey Close Date', term_end: 'Term End Date', course_end: 'Course End Date',
}
export const EVAL_REMINDER_CADENCE = {
  frequency:       'every_3_days' as ReminderFrequency,
  anchor:          'survey_close' as ReminderAnchor,
  startDaysBefore: 14,
}

export interface TemplateQuestion {
  id: string
  text: string
  answerType: 'likert' | 'free_text' | 'single_choice' | 'multiple_choice' | 'title' | 'number' | 'select_dropdown' | 'date_picker'
  choices?: string[]
  /** 0-based position within its section */
  order: number
}

// ── Template builder — "import document" mock library ─────────────────────────
// Selecting a document inserts these sections + questions into the active
// builder tab (keyed by subjectKey). Real parsing is out of scope; this stands
// in for extracted content the admin can then edit.
export interface TemplateImportDoc {
  id: string
  name: string
  sections: { title: string; questions: { text: string; answerType: TemplateQuestion['answerType']; choices?: string[] }[] }[]
}
export const TEMPLATE_IMPORT_LIBRARY: Record<string, TemplateImportDoc[]> = {
  course_content: [
    {
      id: 'imp-course-standard', name: 'Course Evaluation — Standard.docx',
      sections: [
        { title: 'Course Content & Organization', questions: [
          { text: 'The course objectives were clearly stated.', answerType: 'likert' },
          { text: 'The course content was well organized.', answerType: 'likert' },
          { text: 'The pace of the course was appropriate.', answerType: 'likert' },
          { text: 'Assignments and activities contributed to my learning.', answerType: 'likert' },
        ]},
        { title: 'Learning Materials', questions: [
          { text: 'The textbook and readings were useful.', answerType: 'likert' },
          { text: 'Online resources supported my learning.', answerType: 'likert' },
          { text: 'What materials would you add or remove?', answerType: 'free_text' },
        ]},
      ],
    },
    {
      id: 'imp-course-clinical', name: 'Clinical Course Eval.docx',
      sections: [
        { title: 'Clinical Preparation', questions: [
          { text: 'The course prepared me for clinical practice.', answerType: 'likert' },
          { text: 'Skills labs reinforced key competencies.', answerType: 'likert' },
        ]},
        { title: 'Overall', questions: [
          { text: 'What was the most valuable part of this course?', answerType: 'free_text' },
        ]},
      ],
    },
  ],
  faculty: [
    {
      id: 'imp-faculty-standard', name: 'Instructor Evaluation.docx',
      sections: [
        { title: 'Teaching Effectiveness', questions: [
          { text: 'The instructor explained concepts clearly.', answerType: 'likert' },
          { text: 'The instructor was well prepared for class.', answerType: 'likert' },
          { text: 'The instructor stimulated my interest in the subject.', answerType: 'likert' },
        ]},
        { title: 'Communication & Support', questions: [
          { text: 'The instructor was available for help outside class.', answerType: 'likert' },
          { text: 'The instructor provided useful feedback on my work.', answerType: 'likert' },
          { text: 'Additional comments about the instructor:', answerType: 'free_text' },
        ]},
      ],
    },
  ],
  general: [
    {
      id: 'imp-general-program', name: 'Program Feedback.docx',
      sections: [
        { title: 'Program Resources', questions: [
          { text: 'Facilities and equipment met my needs.', answerType: 'likert' },
          { text: 'Academic advising was helpful.', answerType: 'likert' },
          { text: 'Library and study resources were adequate.', answerType: 'likert' },
        ]},
        { title: 'Overall Experience', questions: [
          { text: 'Overall, I am satisfied with the program.', answerType: 'likert' },
          { text: 'What one change would most improve the program?', answerType: 'free_text' },
        ]},
      ],
    },
  ],
}

export interface PceInstructor {
  id: string
  name: string
  initials: string
  role: 'primary' | 'guest'
  department?: string
  /** Directory/profile fields (optional — survey.instructors carry only id/name/role). */
  // CAPTE clinical-education faculty classes: Core Faculty (program's primary
  // appointed faculty) · Associated Faculty (teach but not core) · Adjunct.
  facultyType?: 'core' | 'associated' | 'adjunct'
  rank?: string        // e.g. 'Professor', 'Associate Professor', 'Lecturer'
  position?: string    // e.g. 'Department Chair', 'Program Director'
  email?: string
  phone?: string
  employmentStatus?: 'active' | 'inactive'
}

export interface PceSurvey {
  id: string
  courseCode: string
  courseName: string
  term: string
  /** Cohort = graduating class (e.g., "Class of 2027"). Per Aarti 2026-05-08 16:09 D3, the atomic unit for evaluation is course × term × cohort × faculty. */
  cohort?: string
  /** Per UC-14 + workspace ADR-002: Classroom (didactic) | Practice (clinical) | Lab (seminar). Used for the course-type split filter on Cohort view (C5). */
  courseType?: 'didactic' | 'clinical' | 'seminar'
  /** Prior offerings of the SAME course in earlier terms — drives the trend sparkline (C7). Oldest first; current is excluded (it's the survey itself). */
  priorOfferings?: PriorOffering[]
  templateId: string
  status: SurveyStatus
  /** Per-evaluation-type breakdown (Course Material / Faculty and other roles /
   *  General) — each carries its own status + response tracking. When absent,
   *  `evaluationsFor()` derives them. The offering-level `status`/`responseCount`
   *  above stay as the roll-up so KPIs, board and results are unaffected. */
  evaluations?: EvaluationInstance[]
  instructors: PceInstructor[]
  responseRate: number
  responseCount: number
  enrollmentCount: number
  deadline: string
  createdAt: string
  releasedAt?: string
  closedAt?: string
  /** 'course_evaluation' | 'programmatic'. */
  surveyType?: SurveyType
  /** YYYY-MM-DD — date the survey opens for student responses. */
  openDate?: string
  /** Academic year string, e.g. '2025–2026'. */
  academicYear?: string
  /** FK → PceProgram */
  programId?: string
  /** YYYY-MM-DD — last manual (out-of-schedule) reminder sent for THIS survey.
   *  Guard rail: the send-reminder confirm quotes it to prevent double-nudging. */
  lastReminderSentAt?: string
  /** YYYY-MM-DD — next cadence reminder scheduled from Settings (anchored to close date). */
  nextScheduledReminderAt?: string
  /** Admin who set up / pushed this survey — drives the "Created by" column + filter. */
  createdBy?: string
  /** Close date before the most recent extension. Set once, on the first "Edit end date". */
  originalDeadline?: string
  /** ST-14 gating: results stay "Review Pending" until grades are submitted.
   *  Omitted = true for surveys that reached review (see lib/pce-results.ts). */
  gradesSubmitted?: boolean
  /** ST-14 gating: below this response count the result is suppressed ("Draft").
   *  Omitted = MINIMUM_THRESHOLD (lib/pce-results.ts). */
  minimumThreshold?: number
}

export interface PriorOffering {
  term: string
  cohort?: string
  /** Course content avg, 1–5 scale. */
  courseAvg: number
  /** Faculty performance avg, 1–5 scale. */
  facultyAvg: number
  /** Action items logged for that term — ST-15 score-card tooltip, by priority. */
  actionItems?: { text: string; priority: 'high' | 'medium' | 'low' }[]
  /** Theme labels (lib/pce-themes.ts vocabulary) logged as concerns that term —
   *  drives the ST-15 Closed Loop Timeline (resolved / improved / persistent). */
  concerns?: string[]
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
  /** Links the user to their faculty record (MOCK_FACULTY) for the faculty-role view. */
  facultyId?: string
  /** ST-14: Program Directors see results scoped to their program; unset = "All Programs". */
  program?: string
}

// Dr. Anita Patel is both Department Chair (admin) and faculty (f1) — a real
// dual role. Unifying the identity means the faculty view (dashboard + forms)
// is scoped to a populated faculty record instead of a mismatched/hardcoded id.
export const MOCK_CURRENT_USER: PceUser = {
  id: 'u1',
  name: 'Dr. Anita Patel',
  email: 'anita.patel@university.edu',
  initials: 'AP',
  role: 'admin',
  facultyId: 'f1',
  program: 'Doctor of Physical Therapy',
}

export const MOCK_SUBJECTS: PceSubject[] = [
  {
    key: 'course_content',
    label: 'Course',
    description: 'Evaluates the course itself — structure, materials, objectives, workload.',
    isGeneral: true,
    perLabel: 'course',
  },
  {
    key: 'course_instructor',
    label: 'Course Instructor',
    description: 'Evaluates faculty who teach portions of the course.',
    isGeneral: false,
    prismCount: 3,
    perLabel: 'faculty member',
  },
  {
    key: 'course_coordinator',
    label: 'Course Coordinator',
    description: 'Evaluates the faculty member responsible for managing the course.',
    isGeneral: false,
    prismCount: 1,
    perLabel: 'faculty member',
  },
  {
    key: 'teaching_assistant',
    label: 'Teaching Assistant',
    description: 'Evaluates TAs who support instruction.',
    isGeneral: false,
    prismCount: 0,
    perLabel: 'teaching assistant',
  },
  {
    key: 'lab_instructor',
    label: 'Lab Instructor',
    description: 'Evaluates faculty running lab sessions.',
    isGeneral: false,
    prismCount: 1,
    perLabel: 'lab instructor',
  },
  {
    key: 'course_director',
    label: 'Course Director',
    description: 'Evaluates the director overseeing the course curriculum.',
    isGeneral: false,
    prismCount: 1,
    perLabel: 'course director',
  },
  {
    key: 'preceptor',
    label: 'Preceptor',
    description: 'Evaluates clinical preceptors who supervise students during rotations.',
    isGeneral: false,
    prismCount: 0,
    perLabel: 'preceptor',
  },
  {
    key: 'clinical_supervisor',
    label: 'Clinical Supervisor',
    description: 'Evaluates clinical supervisors at the placement site.',
    isGeneral: false,
    prismCount: 0,
    perLabel: 'clinical supervisor',
  },
]

export const MOCK_PROGRAMS: PceProgram[] = [
  { id: 'prog1', name: 'Doctor of Physical Therapy', code: 'DPT' },
  { id: 'prog2', name: 'Master of Science in Nursing', code: 'MSN' },
  { id: 'prog3', name: 'Doctor of Pharmacy', code: 'PharmD' },
  { id: 'prog4', name: 'Physician Assistant Studies', code: 'PA' },
]

export const MOCK_OPEN_TEXT_RESPONSES: PceOpenTextResponse[] = [
  {
    id: 'otr1',
    surveyId: 's1',
    questionText: 'What would you change about this course?',
    text: 'The pacing in the second half of the semester felt rushed. More time on lab applications would help.',
    sectionSubject: 'course_content',
    flagged: false,
    sentiment: 'concern',
  },
  {
    id: 'otr2',
    surveyId: 's1',
    questionText: 'What would you change about this course?',
    text: 'More worked examples in the assessments. The gap between lecture content and exam difficulty was significant.',
    sectionSubject: 'course_content',
    flagged: false,
    sentiment: 'concern',
  },
  {
    id: 'otr3',
    surveyId: 's1',
    questionText: 'What feedback do you have for the instructor?',
    text: 'Very approachable during office hours. Could improve clarity on assignment expectations.',
    sectionSubject: 'course_instructor',
    flagged: false,
    sentiment: 'positive',
  },
  {
    id: 'otr4',
    surveyId: 's1',
    questionText: 'What feedback do you have for the instructor?',
    text: 'This professor is terrible and should not be teaching.',
    sectionSubject: 'course_instructor',
    flagged: true,
    sentiment: 'concern',
  },
  {
    id: 'otr5',
    surveyId: 's1',
    questionText: 'What feedback do you have for the instructor?',
    text: 'Lectures were well-structured and the supplementary readings added real depth.',
    sectionSubject: 'course_instructor',
    flagged: false,
    sentiment: 'positive',
  },
  {
    id: 'otr-s1-6',
    surveyId: 's1',
    questionText: 'What feedback do you have for the instructor?',
    text: "Dr. Patel's written feedback on assignments was detailed and returned quickly.",
    sectionSubject: 'course_instructor',
    flagged: false,
    sentiment: 'positive',
  },
  {
    id: 'otr-s1-7',
    surveyId: 's1',
    questionText: 'What would you change about this course?',
    text: 'Spread the heavier topics more evenly across the semester instead of back-loading them.',
    sectionSubject: 'course_content',
    flagged: false,
    sentiment: 'concern',
  },
  {
    id: 'otr-s1-8',
    surveyId: 's1',
    questionText: 'What would you change about this course?',
    text: 'Add more clinical case examples tied to each module.',
    sectionSubject: 'course_content',
    flagged: false,
    sentiment: 'concern',
  },
  {
    id: 'otr-s1-9',
    surveyId: 's1',
    questionText: 'What would improve the lab experience?',
    text: 'More open lab hours before practical exams would help a lot.',
    sectionSubject: 'lab_instructor',
    flagged: false,
    sentiment: 'concern',
  },
  {
    id: 'otr-s1-10',
    surveyId: 's1',
    questionText: 'What would improve the lab experience?',
    text: 'The goniometry equipment was outdated and there were not enough stations.',
    sectionSubject: 'lab_instructor',
    flagged: false,
    sentiment: 'concern',
  },
  {
    id: 'otr-s1-11',
    surveyId: 's1',
    questionText: 'What would improve the lab experience?',
    text: 'TAs were great but spread thin during peak times — more coverage would help.',
    sectionSubject: 'lab_instructor',
    flagged: false,
    sentiment: 'concern',
  },
  {
    id: 'otr6',
    surveyId: 's5',
    questionText: 'What would you change about this course?',
    text: 'Guest lecturers were excellent but the transition between topics could be smoother.',
    sectionSubject: 'course_content',
    flagged: false,
    sentiment: 'concern',
  },
  {
    id: 'otr7',
    surveyId: 's6',
    questionText: 'What would you change about this course?',
    text: 'More clinical examples early on would have helped connect theory to practice.',
    sectionSubject: 'course_content',
    flagged: false,
    sentiment: 'concern',
  },
  // s3 (DPT-602, released) — feeds the post-release Qualitative Feedback view.
  {
    id: 'otr-s3-1',
    surveyId: 's3',
    questionText: 'What feedback do you have for the instructor?',
    text: 'Dr. Williams is an excellent communicator — expectations were always clear.',
    sectionSubject: 'course_instructor',
    flagged: false,
    sentiment: 'positive',
  },
  {
    id: 'otr-s3-2',
    surveyId: 's3',
    questionText: 'What feedback do you have for the instructor?',
    text: 'Office hours were genuinely helpful, especially before the practicum checkpoints.',
    sectionSubject: 'course_instructor',
    flagged: false,
    sentiment: 'positive',
  },
  {
    id: 'otr-s3-3',
    surveyId: 's3',
    questionText: 'What feedback do you have for the instructor?',
    text: 'The pace of the debrief sessions was sometimes too fast to take notes.',
    sectionSubject: 'course_instructor',
    flagged: false,
    sentiment: 'neutral',
  },
  {
    id: 'otr-s3-4',
    surveyId: 's3',
    questionText: 'What would you change about this course?',
    text: 'More worked examples in the assessments would help bridge clinic and coursework.',
    sectionSubject: 'course_content',
    flagged: false,
    sentiment: 'concern',
  },
  {
    id: 'otr-s3-5',
    surveyId: 's3',
    questionText: 'What would you change about this course?',
    text: 'Placement site coordination was smooth this year — a big improvement over what classmates described.',
    sectionSubject: 'course_content',
    flagged: false,
    sentiment: 'positive',
  },
  {
    id: 'otr-s3-6',
    surveyId: 's3',
    questionText: 'What would you change about this course?',
    text: 'Some topics could be covered in more depth before we reach the clinical rotation.',
    sectionSubject: 'course_content',
    flagged: false,
    sentiment: 'concern',
  },
  // s4 (DPT-504, closed) — smaller set, includes one moderated-out response.
  {
    id: 'otr-s4-1',
    surveyId: 's4',
    questionText: 'What would you change about this course?',
    text: 'Great course structure overall — the module order made the material build naturally.',
    sectionSubject: 'course_content',
    flagged: false,
    sentiment: 'positive',
  },
  {
    id: 'otr-s4-2',
    surveyId: 's4',
    questionText: 'What feedback do you have for the instructor?',
    text: 'Lectures were engaging and informative; the case walk-throughs were the highlight.',
    sectionSubject: 'course_instructor',
    flagged: false,
    sentiment: 'positive',
  },
  {
    id: 'otr-s4-3',
    surveyId: 's4',
    questionText: 'What feedback do you have for the instructor?',
    text: 'This instructor should not be allowed anywhere near a classroom.',
    sectionSubject: 'course_instructor',
    flagged: true,
    sentiment: 'concern',
  },
]

export const MOCK_TEMPLATES: PceTemplate[] = [
  {
    id: 'tmpl1',
    programId: 'prog1',
    name: 'End-of-Term Evaluation',
    sections: ['course_content', 'faculty_performance'],
    status: 'active',
    questionCount: 8,
    usedBySurveyCount: 3,
    lastModified: 'Apr 10, 2026',
    createdBy: 'Dr. Thompson',
    likertPointer: 5,
    courseType: 'any',
    surveyType: 'course_evaluation',
    questions: {
      course_content: [
        { id: 'q1', text: 'The course objectives were clearly stated.', answerType: 'likert', order: 0 },
        { id: 'q2', text: 'Course materials supported my learning.', answerType: 'likert', order: 1 },
        { id: 'q3', text: 'The workload was appropriate for the credit hours.', answerType: 'likert', order: 2 },
        { id: 'q4', text: 'Assessments were aligned with learning objectives.', answerType: 'likert', order: 3 },
        { id: 'q5', text: 'What would you change about this course?', answerType: 'free_text', order: 4 },
      ],
      faculty_performance: [
        { id: 'q6', text: 'The instructor was well-prepared for each class.', answerType: 'likert', order: 0 },
        { id: 'q7', text: 'The instructor communicated expectations clearly.', answerType: 'likert', order: 1 },
        { id: 'q8', text: 'What feedback do you have for the instructor?', answerType: 'free_text', order: 2 },
      ],
      course_director: [],
    },
    templateSections: [
      {
        id: 'ts1-1',
        subjectKey: 'course_content',
        title: 'Course Content',
        order: 0,
        questions: [
          { id: 'q1', text: 'The course objectives were clearly stated.', answerType: 'likert', order: 0 },
          { id: 'q2', text: 'Course materials supported my learning.', answerType: 'likert', order: 1 },
          { id: 'q3', text: 'The workload was appropriate for the credit hours.', answerType: 'likert', order: 2 },
          { id: 'q4', text: 'Assessments were aligned with learning objectives.', answerType: 'likert', order: 3 },
          { id: 'q5', text: 'What would you change about this course?', answerType: 'free_text', order: 4 },
        ],
      },
      {
        id: 'ts1-2',
        subjectKey: 'faculty',
        title: 'Faculty Performance',
        order: 1,
        roleSetId: 'rs1-a',
        questions: [
          { id: 'q6', text: 'The instructor was well-prepared for each class.', answerType: 'likert', order: 0 },
          { id: 'q7', text: 'The instructor communicated expectations clearly.', answerType: 'likert', order: 1 },
          { id: 'q8', text: 'What feedback do you have for the instructor?', answerType: 'free_text', order: 2 },
        ],
      },
    ],
    facultyRoleSets: [
      { id: 'rs1-a', roles: ['instructor'] },
    ],
  },
  {
    id: 'tmpl2',
    programId: 'prog1',
    name: 'Faculty Midterm Check-In',
    sections: ['faculty_performance'],
    status: 'active',
    questionCount: 3,
    usedBySurveyCount: 1,
    lastModified: 'Mar 22, 2026',
    createdBy: 'Dr. Thompson',
    likertPointer: 5,
    courseType: 'any',
    surveyType: 'course_evaluation',
    questions: {
      course_content: [],
      faculty_performance: [
        { id: 'q9',  text: 'The instructor encourages student participation.', answerType: 'likert', order: 0 },
        { id: 'q10', text: 'The instructor is available during office hours.', answerType: 'likert', order: 1 },
        { id: 'q11', text: 'Any concerns to share at the midpoint?', answerType: 'free_text', order: 2 },
      ],
      course_director: [],
    },
    templateSections: [
      {
        id: 'ts2-1',
        subjectKey: 'faculty',
        title: 'Faculty Performance',
        order: 0,
        roleSetId: 'rs2-a',
        questions: [
          { id: 'q9',  text: 'The instructor encourages student participation.', answerType: 'likert', order: 0 },
          { id: 'q10', text: 'The instructor is available during office hours.', answerType: 'likert', order: 1 },
          { id: 'q11', text: 'Any concerns to share at the midpoint?', answerType: 'free_text', order: 2 },
        ],
      },
    ],
    facultyRoleSets: [
      { id: 'rs2-a', roles: ['lab-assistant', 'course-coordinator'] },
    ],
  },
  {
    id: 'tmpl3',
    programId: 'prog2',
    name: 'Exit Survey',
    sections: ['course_content', 'faculty_performance', 'course_director'],
    status: 'draft',
    questionCount: 0,
    usedBySurveyCount: 0,
    lastModified: 'Apr 28, 2026',
    createdBy: 'Dr. Thompson',
    likertPointer: 5,
    courseType: 'any',
    surveyType: 'course_evaluation',
    questions: {
      course_content: [],
      faculty_performance: [],
      course_director: [],
    },
    templateSections: [],
  },
  {
    id: 'tmpl-gen1',
    name: 'Alumni Outcomes Survey',
    sections: ['course_content'] as TemplateSection[],
    status: 'active' as const,
    questionCount: 6,
    usedBySurveyCount: 1,
    lastModified: 'May 10, 2026',
    createdBy: 'Dr. Thompson',
    likertPointer: 5 as const,
    surveyType: 'programmatic' as SurveyType,
    questions: {
      course_content: [
        { id: 'gq1', text: 'How well did the program prepare you for your career?', answerType: 'likert' as const, order: 0 },
        { id: 'gq2', text: 'How satisfied are you with the quality of instruction?', answerType: 'likert' as const, order: 1 },
        { id: 'gq3', text: 'How likely are you to recommend this program?', answerType: 'likert' as const, order: 2 },
        { id: 'gq4', text: 'What aspects of the program were most valuable?', answerType: 'free_text' as const, order: 3 },
        { id: 'gq5', text: 'What would you improve about the program?', answerType: 'free_text' as const, order: 4 },
        { id: 'gq6', text: 'Any additional comments?', answerType: 'free_text' as const, order: 5 },
      ],
      faculty_performance: [],
      course_director: [],
    },
  },
  {
    id: 'tmpl-gen2',
    name: 'Preceptor Satisfaction Survey',
    sections: ['course_content'] as TemplateSection[],
    status: 'draft' as const,
    questionCount: 4,
    usedBySurveyCount: 0,
    lastModified: 'May 18, 2026',
    createdBy: 'Dr. Thompson',
    likertPointer: 5 as const,
    surveyType: 'programmatic' as SurveyType,
    questions: {
      course_content: [
        { id: 'gq7', text: 'The students arrived well-prepared for clinical rotations.', answerType: 'likert' as const, order: 0 },
        { id: 'gq8', text: 'Communication with the program office was effective.', answerType: 'likert' as const, order: 1 },
        { id: 'gq9', text: 'I would accept students from this program again.', answerType: 'likert' as const, order: 2 },
        { id: 'gq10', text: 'Please share any additional feedback.', answerType: 'free_text' as const, order: 3 },
      ],
      faculty_performance: [],
      course_director: [],
    },
  },
  {
    id: 'tmplrich',
    name: 'Comprehensive Course Evaluation',
    sections: ['course_content', 'faculty_performance', 'course_director'],
    status: 'active',
    questionCount: 20,
    usedBySurveyCount: 1,
    lastModified: 'Apr 12, 2026',
    createdBy: 'Dr. Thompson',
    likertPointer: 5,
    courseType: 'any',
    surveyType: 'course_evaluation',
    questions: {
      course_content: [
        { id: 'c1', text: 'The course objectives were clearly stated.', answerType: 'likert', order: 0 },
        { id: 'c2', text: 'Course materials supported my learning.', answerType: 'likert', order: 1 },
        { id: 'c3', text: 'The workload was appropriate for the credit hours.', answerType: 'likert', order: 2 },
        { id: 'c4', text: 'Assessments were aligned with learning objectives.', answerType: 'likert', order: 3 },
        { id: 'c5', text: 'The course was well-organized and easy to follow.', answerType: 'likert', order: 4 },
        { id: 'c6', text: 'The pace of the course was appropriate.', answerType: 'likert', order: 5 },
        { id: 'c7', text: 'What would you change about this course?', answerType: 'free_text', order: 6 },
      ],
      faculty_performance: [
        { id: 'i1', text: 'The instructor was well-prepared for each class.', answerType: 'likert', order: 0 },
        { id: 'i2', text: 'The instructor communicated expectations clearly.', answerType: 'likert', order: 1 },
        { id: 'i3', text: 'The instructor was responsive to questions.', answerType: 'likert', order: 2 },
        { id: 'i4', text: 'The instructor provided helpful, timely feedback.', answerType: 'likert', order: 3 },
        { id: 'i5', text: 'The instructor treated students with respect.', answerType: 'likert', order: 4 },
        { id: 'i6', text: 'What feedback do you have for the instructor?', answerType: 'free_text', order: 5 },
      ],
      course_director: [
        { id: 'o1', text: 'Overall, this was a valuable course.', answerType: 'likert', order: 0 },
        { id: 'o2', text: 'I would recommend this course to other students.', answerType: 'likert', order: 1 },
      ],
    },
    templateSections: [
      {
        id: 'tsr-1', subjectKey: 'course_content', title: 'Course Content', order: 0,
        questions: [
          { id: 'c1', text: 'The course objectives were clearly stated.', answerType: 'likert', order: 0 },
          { id: 'c2', text: 'Course materials supported my learning.', answerType: 'likert', order: 1 },
          { id: 'c3', text: 'The workload was appropriate for the credit hours.', answerType: 'likert', order: 2 },
          { id: 'c4', text: 'Assessments were aligned with learning objectives.', answerType: 'likert', order: 3 },
          { id: 'c5', text: 'The course was well-organized and easy to follow.', answerType: 'likert', order: 4 },
          { id: 'c6', text: 'The pace of the course was appropriate.', answerType: 'likert', order: 5 },
          { id: 'c7', text: 'What would you change about this course?', answerType: 'free_text', order: 6 },
        ],
      },
      {
        id: 'tsr-2', subjectKey: 'course_instructor', title: 'Course Instructor', order: 1,
        questions: [
          { id: 'i1', text: 'The instructor was well-prepared for each class.', answerType: 'likert', order: 0 },
          { id: 'i2', text: 'The instructor communicated expectations clearly.', answerType: 'likert', order: 1 },
          { id: 'i3', text: 'The instructor was responsive to questions.', answerType: 'likert', order: 2 },
          { id: 'i4', text: 'The instructor provided helpful, timely feedback.', answerType: 'likert', order: 3 },
          { id: 'i5', text: 'The instructor treated students with respect.', answerType: 'likert', order: 4 },
          { id: 'i6', text: 'What feedback do you have for the instructor?', answerType: 'free_text', order: 5 },
        ],
      },
      {
        id: 'tsr-3', subjectKey: 'lab_instructor', title: 'Labs & Materials', order: 2,
        questions: [
          { id: 'l1', text: 'Lab sessions reinforced the lecture content.', answerType: 'likert', order: 0 },
          { id: 'l2', text: 'Lab equipment and facilities were adequate.', answerType: 'likert', order: 1 },
          { id: 'l3', text: 'Lab instructions were clear and easy to follow.', answerType: 'likert', order: 2 },
          { id: 'l4', text: 'Teaching assistants were helpful during labs.', answerType: 'likert', order: 3 },
          { id: 'l5', text: 'What would improve the lab experience?', answerType: 'free_text', order: 4 },
        ],
      },
      {
        id: 'tsr-4', subjectKey: 'course_director', title: 'Overall Experience', order: 3,
        questions: [
          { id: 'o1', text: 'Overall, this was a valuable course.', answerType: 'likert', order: 0 },
          { id: 'o2', text: 'I would recommend this course to other students.', answerType: 'likert', order: 1 },
        ],
      },
    ],
  },
]

const INSTRUCTORS: Record<string, PceInstructor> = {
  patel:    { id: 'f1', name: 'Dr. Anita Patel',    initials: 'AP', role: 'primary' },
  chen:     { id: 'f2', name: 'Dr. Kevin Chen',     initials: 'KC', role: 'guest'   },
  williams: { id: 'f3', name: 'Dr. Maria Williams', initials: 'MW', role: 'primary' },
  kim:      { id: 'f4', name: 'Dr. James Kim',      initials: 'JK', role: 'primary' },
  gomez:    { id: 'f5', name: 'Dr. Rachel Gomez',   initials: 'RG', role: 'primary' },
  hassan:   { id: 'f6', name: 'Dr. Omar Hassan',    initials: 'OH', role: 'primary' },
}

export const MOCK_SURVEYS: PceSurvey[] = [
  {
    id: 's1',
    courseCode: 'DPT-501',
    courseName: 'Human Anatomy & Kinesiology',
    term: 'Spring 2026',
    cohort: 'Class of 2027',
    courseType: 'didactic',
    priorOfferings: [
      { term: 'Spring 2024', courseAvg: 4.0, facultyAvg: 4.2 },
      {
        term: 'Spring 2025',
        courseAvg: 4.1,
        facultyAvg: 4.2,
        actionItems: [
          { text: 'Spread the cadaver-lab units across two weeks', priority: 'high' },
          { text: 'Refresh the kinesiology reading packet links', priority: 'medium' },
          { text: 'Add a second weekly office-hour slot', priority: 'low' },
        ],
        concerns: ['Pacing', 'Course materials', 'Office hours'],
      },
    ],
    templateId: 'tmplrich',
    status: 'pending_review',
    instructors: [INSTRUCTORS.patel, { ...INSTRUCTORS.chen, role: 'guest' }],
    responseRate: 68,
    responseCount: 34,
    enrollmentCount: 50,
    deadline: 'Apr 30, 2026',
    createdAt: 'Jan 15, 2026',
    createdBy: 'Dr. Anita Patel',
    surveyType: 'course_evaluation',
    openDate: '2026-01-16',
    academicYear: '2025–2026',
    programId: 'prog1',
  },
  {
    id: 's2',
    courseCode: 'DPT-601',
    courseName: 'Clinical Practicum I',
    term: 'Spring 2026',
    cohort: 'Class of 2026',
    courseType: 'clinical',
    priorOfferings: [
      { term: 'Spring 2024', courseAvg: 3.6, facultyAvg: 3.8 },
      { term: 'Spring 2025', courseAvg: 3.9, facultyAvg: 4.0 },
    ],
    templateId: 'tmpl1',
    status: 'collecting',
    instructors: [INSTRUCTORS.williams, { ...INSTRUCTORS.chen, role: 'guest' }],
    responseRate: 42,
    responseCount: 21,
    enrollmentCount: 50,
    deadline: 'Jul 11, 2026',
    createdAt: 'Jan 15, 2026',
    createdBy: 'Dr. Sam Whitfield',
    lastReminderSentAt: '2026-07-04',
    nextScheduledReminderAt: '2026-07-10',
    surveyType: 'course_evaluation',
    openDate: '2026-06-15',
    academicYear: '2025–2026',
    programId: 'prog2',
  },
  {
    id: 's3',
    courseCode: 'DPT-602',
    courseName: 'Clinical Practicum II',
    term: 'Spring 2026',
    cohort: 'Class of 2026',
    courseType: 'clinical',
    priorOfferings: [
      { term: 'Spring 2023', courseAvg: 3.9, facultyAvg: 4.0 },
      { term: 'Spring 2024', courseAvg: 4.1, facultyAvg: 4.4 },
      { term: 'Spring 2025', courseAvg: 4.0, facultyAvg: 4.5 },
    ],
    templateId: 'tmpl1',
    status: 'released',
    instructors: [INSTRUCTORS.williams],
    responseRate: 91,
    responseCount: 46,
    enrollmentCount: 50,
    deadline: 'Apr 15, 2026',
    createdAt: 'Jan 15, 2026',
    createdBy: 'Dr. Anita Patel',
    releasedAt: 'Apr 17, 2026',
    surveyType: 'course_evaluation',
    openDate: '2026-01-16',
    academicYear: '2025–2026',
    programId: 'prog3',
  },
  {
    id: 's4',
    courseCode: 'DPT-504',
    courseName: 'Neuroanatomy',
    term: 'Fall 2025',
    cohort: 'Class of 2028',
    courseType: 'didactic',
    priorOfferings: [
      { term: 'Fall 2022', courseAvg: 4.4, facultyAvg: 4.5 },
      { term: 'Fall 2023', courseAvg: 4.2, facultyAvg: 4.3 },
      { term: 'Fall 2024', courseAvg: 4.0, facultyAvg: 4.0 },
    ],
    templateId: 'tmpl1',
    status: 'closed',
    // Gate demo (ST-15): grades not yet submitted → result stays "Review Pending".
    gradesSubmitted: false,
    instructors: [INSTRUCTORS.kim],
    responseRate: 88,
    responseCount: 44,
    enrollmentCount: 50,
    deadline: 'Dec 10, 2025',
    createdAt: 'Aug 20, 2025',
    createdBy: 'Dr. Anita Patel',
    releasedAt: 'Dec 14, 2025',
    closedAt: 'Jan 10, 2026',
    surveyType: 'course_evaluation',
    openDate: '2025-08-21',
    academicYear: '2025–2026',
    programId: 'prog1',
  },
  {
    id: 's5',
    courseCode: 'DPT-502',
    courseName: 'Physiology & Pathophysiology',
    term: 'Spring 2026',
    cohort: 'Class of 2028',
    courseType: 'didactic',
    priorOfferings: [
      { term: 'Spring 2024', courseAvg: 4.0, facultyAvg: 4.1 },
      { term: 'Spring 2025', courseAvg: 4.0, facultyAvg: 4.0 },
    ],
    templateId: 'tmpl1',
    status: 'active',
    instructors: [INSTRUCTORS.kim],
    responseRate: 73,
    responseCount: 22,
    enrollmentCount: 30,
    deadline: 'Jul 15, 2026',
    createdAt: 'Jan 15, 2026',
    createdBy: 'Dr. Sam Whitfield',
    lastReminderSentAt: '2026-07-06',
    nextScheduledReminderAt: '2026-07-11',
    surveyType: 'course_evaluation',
    openDate: '2026-06-15',
    academicYear: '2025–2026',
    programId: 'prog2',
  },
  {
    id: 's6',
    courseCode: 'DPT-520',
    courseName: 'Neurological Physical Therapy',
    term: 'Summer 2026',
    cohort: 'Class of 2027',
    courseType: 'didactic',
    templateId: 'tmpl1',
    status: 'scheduled',
    instructors: [INSTRUCTORS.patel],
    responseRate: 0,
    responseCount: 0,
    enrollmentCount: 28,
    deadline: 'Jul 18, 2026',
    createdAt: 'May 26, 2026',
    createdBy: 'Dr. Anita Patel',
    surveyType: 'course_evaluation',
    openDate: '2026-06-30',
    academicYear: '2025–2026',
    programId: 'prog1',
  },
  {
    id: 's7',
    courseCode: 'DPT-511',
    courseName: 'Musculoskeletal Physical Therapy II',
    term: 'Spring 2026',
    cohort: 'Class of 2027',
    courseType: 'didactic',
    templateId: 'tmpl1',
    status: 'draft',
    instructors: [INSTRUCTORS.patel],
    responseRate: 0,
    responseCount: 0,
    enrollmentCount: 35,
    deadline: 'May 30, 2026',
    createdAt: 'Apr 20, 2026',
    createdBy: 'Dr. Anita Patel',
    surveyType: 'course_evaluation',
    openDate: '2026-04-21',
    academicYear: '2025–2026',
    programId: 'prog1',
  },
  {
    id: 'gen-s1',
    courseCode: 'Alumni Outcomes Survey — Class of 2025',
    courseName: '',
    term: 'Spring 2026',
    templateId: 'tmpl-gen1',
    status: 'collecting' as SurveyStatus,
    instructors: [],
    responseRate: 42,
    responseCount: 63,
    enrollmentCount: 150,
    deadline: 'Jul 14, 2026',
    createdAt: 'May 1, 2026',
    createdBy: 'Dr. Anita Patel',
    lastReminderSentAt: '2026-06-30',
    surveyType: 'programmatic' as SurveyType,
    openDate: '2026-05-01',
    academicYear: '2025–2026',
  },
  {
    id: 'gen-s2',
    courseCode: 'Preceptor Satisfaction Survey — Spring 2026',
    courseName: '',
    term: 'Spring 2026',
    templateId: 'tmpl-gen1',
    status: 'draft' as SurveyStatus,
    instructors: [],
    responseRate: 0,
    responseCount: 0,
    enrollmentCount: 45,
    deadline: 'Jul 15, 2026',
    createdAt: 'May 12, 2026',
    createdBy: 'Dr. Sam Whitfield',
    surveyType: 'programmatic' as SurveyType,
    openDate: '2026-06-01',
    academicYear: '2025–2026',
  },
  {
    id: 'gen-s3',
    courseCode: 'Program Exit Survey — Spring 2026',
    courseName: '',
    term: 'Spring 2026',
    templateId: 'tmpl-gen1',
    status: 'scheduled' as SurveyStatus,
    instructors: [],
    responseRate: 0,
    responseCount: 0,
    enrollmentCount: 80,
    deadline: 'May 30, 2026',
    createdAt: 'May 8, 2026',
    createdBy: 'Dr. Anita Patel',
    surveyType: 'programmatic' as SurveyType,
    openDate: '2026-05-27',
    academicYear: '2025–2026',
  },

  // ── Monitoring-dashboard fixtures — fuller Spring 2026 cycle + history so the
  //    Overview distribution + trend read as real data (not 5 sparse points). ──
  { id: 'mon1',  courseCode: 'DPT-510', courseName: 'Musculoskeletal Physical Therapy I', term: 'Spring 2026', cohort: 'Class of 2027', courseType: 'didactic', templateId: 'tmpl1', status: 'collecting', instructors: [INSTRUCTORS.kim],      responseRate: 38, responseCount: 23, enrollmentCount: 60, deadline: 'Jul 14, 2026', createdAt: 'Jan 15, 2026', createdBy: 'Dr. Anita Patel', lastReminderSentAt: '2026-07-02', nextScheduledReminderAt: '2026-07-09', surveyType: 'course_evaluation', openDate: '2026-06-16', academicYear: '2025–2026', programId: 'prog1' },
  { id: 'mon2',  courseCode: 'DPT-611', courseName: 'Pediatric Physical Therapy',          term: 'Spring 2026', cohort: 'Class of 2026', courseType: 'clinical', templateId: 'tmpl2', status: 'collecting', instructors: [INSTRUCTORS.gomez],    responseRate: 10, responseCount: 4, enrollmentCount: 40, deadline: 'Jul 12, 2026', createdAt: 'Jan 15, 2026', createdBy: 'Dr. Anita Patel', surveyType: 'course_evaluation', openDate: '2026-06-16', academicYear: '2025–2026', programId: 'prog1' },
  { id: 'mon3',  courseCode: 'DPT-540', courseName: 'Differential Diagnosis',              term: 'Spring 2026', cohort: 'Class of 2027', courseType: 'didactic', templateId: 'tmpl1', status: 'collecting', instructors: [INSTRUCTORS.williams], responseRate: 91, responseCount: 50, enrollmentCount: 55, deadline: 'Jul 22, 2026', createdAt: 'Jan 15, 2026', createdBy: 'Dr. Anita Patel', surveyType: 'course_evaluation', openDate: '2026-06-16', academicYear: '2025–2026', programId: 'prog1' },
  { id: 'mon4',  courseCode: 'DPT-505', courseName: 'Neuroanatomy',                        term: 'Spring 2026', cohort: 'Class of 2027', courseType: 'didactic', templateId: 'tmpl1', status: 'closed',     instructors: [INSTRUCTORS.patel],    responseRate: 84, responseCount: 59, enrollmentCount: 70, deadline: 'May 30, 2026', createdAt: 'Jan 15, 2026', createdBy: 'Dr. Anita Patel', surveyType: 'course_evaluation', openDate: '2026-04-20', academicYear: '2025–2026', programId: 'prog1' },
  { id: 'mon5',  courseCode: 'DPT-504', courseName: 'Exercise Physiology',                 term: 'Spring 2026', cohort: 'Class of 2027', courseType: 'didactic', templateId: 'tmpl1', status: 'released',   instructors: [INSTRUCTORS.chen],     responseRate: 88, responseCount: 57, enrollmentCount: 65, deadline: 'May 15, 2026', createdAt: 'Jan 15, 2026', createdBy: 'Dr. Anita Patel', surveyType: 'course_evaluation', openDate: '2026-04-10', academicYear: '2025–2026', programId: 'prog1' },
  { id: 'mon6',  courseCode: 'DPT-530', courseName: 'Therapeutic Exercise',                term: 'Spring 2026', cohort: 'Class of 2026', courseType: 'clinical', templateId: 'tmpl2', status: 'collecting', instructors: [INSTRUCTORS.hassan],   responseRate: 73, responseCount: 37, enrollmentCount: 50, deadline: 'Jul 16, 2026', createdAt: 'Jan 15, 2026', createdBy: 'Dr. Anita Patel', surveyType: 'course_evaluation', openDate: '2026-06-16', academicYear: '2025–2026', programId: 'prog1' },
  { id: 'mon7',  courseCode: 'DPT-620', courseName: 'Geriatric Physical Therapy',          term: 'Spring 2026', cohort: 'Class of 2026', courseType: 'clinical', templateId: 'tmpl2', status: 'active',     instructors: [INSTRUCTORS.kim],      responseRate: 62, responseCount: 24, enrollmentCount: 38, deadline: 'Jul 18, 2026', createdAt: 'Jan 15, 2026', createdBy: 'Dr. Anita Patel', surveyType: 'course_evaluation', openDate: '2026-06-17', academicYear: '2025–2026', programId: 'prog1' },
  { id: 'mon8',  courseCode: 'DPT-515', courseName: 'Pharmacology for Physical Therapists', term: 'Spring 2026', cohort: 'Class of 2027', courseType: 'didactic', templateId: 'tmpl1', status: 'collecting', instructors: [INSTRUCTORS.williams], responseRate: 58, responseCount: 28, enrollmentCount: 48, deadline: 'Jul 13, 2026', createdAt: 'Jan 15, 2026', createdBy: 'Dr. Anita Patel', surveyType: 'course_evaluation', openDate: '2026-06-16', academicYear: '2025–2026', programId: 'prog1' },

  // history (for the response-rate trend)
  { id: 'mon9',  courseCode: 'DPT-501', courseName: 'Human Anatomy & Kinesiology',         term: 'Fall 2025',   courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.patel],    responseRate: 71, responseCount: 37, enrollmentCount: 52, deadline: 'Dec 15, 2025', createdAt: 'Aug 15, 2025', surveyType: 'course_evaluation', academicYear: '2025–2026', programId: 'prog1' },
  { id: 'mon10', courseCode: 'DPT-540', courseName: 'Differential Diagnosis',              term: 'Fall 2025',   courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.williams], responseRate: 80, responseCount: 40, enrollmentCount: 50, deadline: 'Dec 15, 2025', createdAt: 'Aug 15, 2025', surveyType: 'course_evaluation', academicYear: '2025–2026', programId: 'prog1' },
  { id: 'mon11', courseCode: 'DPT-501', courseName: 'Human Anatomy & Kinesiology',         term: 'Spring 2025', courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.patel],    responseRate: 75, responseCount: 38, enrollmentCount: 50, deadline: 'Apr 30, 2025', createdAt: 'Jan 15, 2025', surveyType: 'course_evaluation', academicYear: '2024–2025', programId: 'prog1' },
  { id: 'mon12', courseCode: 'DPT-505', courseName: 'Neuroanatomy',                        term: 'Spring 2025', courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.patel],    responseRate: 82, responseCount: 49, enrollmentCount: 60, deadline: 'Apr 30, 2025', createdAt: 'Jan 15, 2025', surveyType: 'course_evaluation', academicYear: '2024–2025', programId: 'prog1' },
  // minimumThreshold above responseCount = gate demo (ST-15): suppressed "Draft" result.
  { id: 'mon13', courseCode: 'DPT-510', courseName: 'Musculoskeletal Physical Therapy I',  term: 'Fall 2024',   courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.kim],      responseRate: 68, responseCount: 37, enrollmentCount: 55, minimumThreshold: 40, deadline: 'Dec 15, 2024', createdAt: 'Aug 15, 2024', surveyType: 'course_evaluation', academicYear: '2024–2025', programId: 'prog1' },
  { id: 'mon14', courseCode: 'DPT-540', courseName: 'Differential Diagnosis',              term: 'Fall 2024',   courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.williams], responseRate: 78, responseCount: 37, enrollmentCount: 48, deadline: 'Dec 15, 2024', createdAt: 'Aug 15, 2024', surveyType: 'course_evaluation', academicYear: '2024–2025', programId: 'prog1' },

  // Programmatic (institutional) surveys with real response data — feed the
  // Programmatic dashboard's rate chart + survey list (mirror the General Surveys set).
  { id: 'pg1', courseCode: 'End-of-Program Satisfaction — Class of 2026', courseName: '', term: 'Spring 2026', templateId: 'tmpl-gen1', status: 'released',   instructors: [], responseRate: 85, responseCount: 142, enrollmentCount: 168, deadline: 'May 15, 2026', createdAt: 'Feb 1, 2026', surveyType: 'programmatic', openDate: '2026-04-01', academicYear: '2025–2026' },
  { id: 'pg2', courseCode: 'Clinical Site Feedback — DPT Year 3',         courseName: '', term: 'Spring 2026', templateId: 'tmpl-gen1', status: 'collecting', instructors: [], responseRate: 88, responseCount: 84,  enrollmentCount: 96,  deadline: 'Jul 13, 2026', createdAt: 'Feb 1, 2026', surveyType: 'programmatic', openDate: '2026-05-01', academicYear: '2025–2026' },
  { id: 'pg3', courseCode: 'Faculty Self-Assessment — All Faculty',       courseName: '', term: 'Spring 2026', templateId: 'tmpl-gen1', status: 'collecting', instructors: [], responseRate: 69, responseCount: 22,  enrollmentCount: 32,  deadline: 'Jul 16, 2026', createdAt: 'Feb 1, 2026', surveyType: 'programmatic', openDate: '2026-05-01', academicYear: '2025–2026' },
  { id: 'pg4', courseCode: 'Curriculum Effectiveness — All Students',      courseName: '', term: 'Spring 2026', templateId: 'tmpl-gen1', status: 'collecting', instructors: [], responseRate: 70, responseCount: 218, enrollmentCount: 312, deadline: 'Jul 20, 2026', createdAt: 'Feb 1, 2026', surveyType: 'programmatic', openDate: '2026-05-01', academicYear: '2025–2026' },
]

export const MOCK_RESPONSES: PceResponse[] = [
  // ── Live surveys — partial data so "View results" shows the real layout ──
  {
    surveyId: 'mon1',
    sectionScores: [
      { section: 'course_content', avg: 3.9, count: 23 },
      { section: 'faculty_performance', avg: 4.1, count: 23 },
    ],
    comments: [
      { section: 'course_content', text: 'The msk labs build on each other really well so far.', sentiment: 'positive' },
      { section: 'course_content', text: 'Reading load feels heavy for the middle weeks.', sentiment: 'concern' },
      { section: 'faculty_performance', text: 'Dr. Kim explains palpation techniques clearly.', sentiment: 'positive' },
    ],
  },
  {
    surveyId: 'mon2',
    sectionScores: [
      { section: 'faculty_performance', avg: 3.8, count: 4 },
    ],
    comments: [
      { section: 'faculty_performance', text: 'Great case discussions in the peds unit.', sentiment: 'positive' },
      { section: 'faculty_performance', text: 'Office hours times are hard to make.', sentiment: 'concern' },
    ],
  },
  {
    surveyId: 's1',
    sectionScores: [
      { section: 'course_content', avg: 4.1, count: 34 },
      { section: 'faculty_performance', avg: 4.3, count: 34 },
    ],
    comments: [
      { section: 'faculty_performance', text: 'Very organized and responsive to questions.', sentiment: 'positive' },
      { section: 'faculty_performance', text: 'Could improve pacing in later sessions.', sentiment: 'concern' },
      { section: 'faculty_performance', text: 'Very approachable during office hours and always available.', sentiment: 'positive' },
      { section: 'course_content', text: 'Course materials were well-structured and easy to follow.', sentiment: 'positive' },
      { section: 'course_content', text: 'Some lab sessions felt rushed.', sentiment: 'concern' },
      { section: 'course_content', text: 'The gap between lecture content and exam difficulty was significant.', sentiment: 'concern' },
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
  {
    surveyId: 's5',
    sectionScores: [
      { section: 'course_content', avg: 3.9, count: 22 },
      { section: 'faculty_performance', avg: 4.1, count: 22 },
    ],
    comments: [
      { section: 'faculty_performance', text: 'Clear expectations set from day one.', sentiment: 'positive' },
      { section: 'course_content', text: 'Clinical simulations could be more realistic.', sentiment: 'concern' },
      { section: 'course_content', text: 'Well-organized course overall.', sentiment: 'positive' },
    ],
  },
  {
    surveyId: 's6',
    sectionScores: [
      { section: 'course_content', avg: 4.2, count: 8 },
      { section: 'faculty_performance', avg: 4.4, count: 8 },
    ],
    comments: [
      { section: 'course_content', text: 'The intro to medicine course exceeded expectations.', sentiment: 'positive' },
      { section: 'faculty_performance', text: 'Great communicator and approachable outside class.', sentiment: 'positive' },
    ],
  },
  // Score records for released historical offerings — a "Results Available"
  // row must never show an em-dash score (results-list credibility).
  {
    surveyId: 'mon5',
    sectionScores: [
      { section: 'course_content', avg: 4.3, count: 57 },
      { section: 'faculty_performance', avg: 4.5, count: 57 },
    ],
    comments: [],
  },
  {
    surveyId: 'mon9',
    sectionScores: [
      { section: 'course_content', avg: 4.0, count: 37 },
      { section: 'faculty_performance', avg: 4.2, count: 37 },
    ],
    comments: [],
  },
  {
    surveyId: 'mon10',
    sectionScores: [
      { section: 'course_content', avg: 4.4, count: 40 },
      { section: 'faculty_performance', avg: 4.6, count: 40 },
    ],
    comments: [],
  },
  {
    surveyId: 'mon11',
    sectionScores: [
      { section: 'course_content', avg: 3.9, count: 38 },
      { section: 'faculty_performance', avg: 4.1, count: 38 },
    ],
    comments: [],
  },
  {
    surveyId: 'mon12',
    sectionScores: [
      { section: 'course_content', avg: 4.1, count: 49 },
      { section: 'faculty_performance', avg: 4.3, count: 49 },
    ],
    comments: [],
  },
]

export const MOCK_TERMS = ['Spring 2026', 'Fall 2025', 'Spring 2025']

/** Cohorts (graduating class) — per Aarti 2026-05-08 16:09 D3. */
export const MOCK_COHORTS = ['Class of 2026', 'Class of 2027', 'Class of 2028']

// ============================================================================
// Program-level master entities (workspace ADR-001)
// ============================================================================
// Per Aarti 2026-05-08: 11 master entities live ONCE at program level. UC-19
// admin-master-list-screens currently ships 2 of 11 — master courses + terms.

export interface MasterCourse {
  id: string
  code: string
  name: string
  department: string
  status: 'active' | 'inactive'
  type: 'didactic' | 'clinical' | 'seminar'
  /** Last edited; YYYY-MM-DD */
  lastEdited: string
  /** Editor display name */
  editedBy: string
}

/** Season half of a term. Kept SEPARATE from academicYear — the push scope rail
 *  selects Term (season) and Academic Year independently (they are never merged). */
export type TermSeason = 'Spring' | 'Summer' | 'Fall'

export interface ProgramTerm {
  id: string
  name: string
  /** Season — the "Term" selector value; independent of academicYear. */
  season: TermSeason
  academicYear: string
  /** YYYY-MM-DD */
  startDate: string
  endDate: string
  status: 'active' | 'archived'
  /** Controls whether this term appears in the Activation wizard and product dropdowns */
  enabledForEval: boolean
  /** YYYY-MM-DD — date the last ad-hoc reminder email was sent for this term's at-risk courses.
   *  Shown on the Dashboard term card so admins can gauge whether sending another is premature. */
  lastReminderSentAt?: string
}

export const MOCK_MASTER_COURSES: MasterCourse[] = [
  // Year 1 — Foundations (Didactic)
  { id: 'mc1',  code: 'DPT-501', name: 'Human Anatomy & Kinesiology',         department: 'Core Sciences',      type: 'didactic',  status: 'active',   lastEdited: '2026-04-12', editedBy: 'Dr. Chen'     },
  { id: 'mc2',  code: 'DPT-502', name: 'Physiology & Pathophysiology',         department: 'Core Sciences',      type: 'didactic',  status: 'active',   lastEdited: '2026-03-22', editedBy: 'Dr. Williams' },
  { id: 'mc3',  code: 'DPT-503', name: 'Biomechanics',                         department: 'Core Sciences',      type: 'didactic',  status: 'active',   lastEdited: '2026-02-08', editedBy: 'Dr. Kim'      },
  { id: 'mc4',  code: 'DPT-504', name: 'Neuroanatomy',                         department: 'Core Sciences',      type: 'didactic',  status: 'active',   lastEdited: '2025-11-30', editedBy: 'Dr. Kim'      },
  { id: 'mc5',  code: 'DPT-505', name: 'Pharmacology for Physical Therapists', department: 'Clinical Sciences',  type: 'didactic',  status: 'active',   lastEdited: '2026-01-15', editedBy: 'Dr. Gomez'    },
  // Year 2 — Clinical Sciences (Didactic)
  { id: 'mc6',  code: 'DPT-510', name: 'Musculoskeletal Physical Therapy I',   department: 'Physical Therapy',   type: 'didactic',  status: 'active',   lastEdited: '2026-01-20', editedBy: 'Dr. Patel'    },
  { id: 'mc7',  code: 'DPT-511', name: 'Musculoskeletal Physical Therapy II',  department: 'Physical Therapy',   type: 'didactic',  status: 'active',   lastEdited: '2026-04-20', editedBy: 'Dr. Patel'    },
  { id: 'mc8',  code: 'DPT-520', name: 'Neurological Physical Therapy',        department: 'Physical Therapy',   type: 'didactic',  status: 'active',   lastEdited: '2026-03-05', editedBy: 'Dr. Williams' },
  { id: 'mc9',  code: 'DPT-530', name: 'Cardiopulmonary Physical Therapy',     department: 'Physical Therapy',   type: 'didactic',  status: 'active',   lastEdited: '2026-02-18', editedBy: 'Dr. Kim'      },
  { id: 'mc10', code: 'DPT-540', name: 'Differential Diagnosis',               department: 'Clinical Sciences',  type: 'didactic',  status: 'active',   lastEdited: '2026-01-10', editedBy: 'Dr. Hassan'   },
  { id: 'mc11', code: 'DPT-550', name: 'Evidence-Based Practice & Research',   department: 'Research',           type: 'seminar',   status: 'active',   lastEdited: '2026-03-28', editedBy: 'Dr. Williams' },
  // Specialty Electives (Didactic)
  { id: 'mc12', code: 'DPT-611', name: 'Pediatric Physical Therapy',           department: 'Physical Therapy',   type: 'didactic',  status: 'active',   lastEdited: '2026-01-08', editedBy: 'Dr. Gomez'    },
  { id: 'mc13', code: 'DPT-612', name: 'Geriatric Physical Therapy',           department: 'Physical Therapy',   type: 'didactic',  status: 'active',   lastEdited: '2026-02-14', editedBy: 'Dr. Hassan'   },
  // Clinical Education (Clinical)
  { id: 'mc14', code: 'DPT-601', name: 'Clinical Practicum I',                 department: 'Clinical Education', type: 'clinical',  status: 'active',   lastEdited: '2026-04-01', editedBy: 'Dr. Patel'    },
  { id: 'mc15', code: 'DPT-602', name: 'Clinical Practicum II',                department: 'Clinical Education', type: 'clinical',  status: 'active',   lastEdited: '2026-04-01', editedBy: 'Dr. Hassan'   },
  { id: 'mc16', code: 'DPT-603', name: 'Clinical Practicum III (Full-Time)',   department: 'Clinical Education', type: 'clinical',  status: 'active',   lastEdited: '2025-12-10', editedBy: 'Dr. Patel'    },
]

export const MOCK_PROGRAM_TERMS: ProgramTerm[] = [
  // endDate Jul 15 keeps the evaluation window (endDate + 7d) ahead of "today"
  // so the collecting-term demo is date-coherent with its live survey deadlines.
  { id: 'pt1', name: 'Spring 2026', season: 'Spring', academicYear: '2025–2026', startDate: '2026-01-12', endDate: '2026-07-15', status: 'active',   enabledForEval: true,  lastReminderSentAt: '2026-06-24' },
  { id: 'pt2', name: 'Fall 2025',   season: 'Fall',   academicYear: '2025–2026', startDate: '2025-08-25', endDate: '2025-12-12', status: 'archived', enabledForEval: false },
  { id: 'pt3', name: 'Spring 2025', season: 'Spring', academicYear: '2024–2025', startDate: '2025-01-13', endDate: '2025-05-09', status: 'archived', enabledForEval: false },
  { id: 'pt4', name: 'Fall 2024',   season: 'Fall',   academicYear: '2024–2025', startDate: '2024-08-26', endDate: '2024-12-13', status: 'archived', enabledForEval: false },
  { id: 'pt5', name: 'Fall 2026',   season: 'Fall',   academicYear: '2026–2027', startDate: '2026-08-24', endDate: '2026-12-11', status: 'active',   enabledForEval: true  },
]

/** LMS-on/off school config. Per workspace ADR-002, default is LMS-on; in this prototype we mock the off state so manual CRUD demos work. Toggle in future via Settings. */
export const MOCK_LMS_ENABLED = false

// ============================================================================
// Course Offerings — the atomic 4-tuple unit (Aarti 2026-05-08 16:09 D3)
// ============================================================================

// CB / LB / PB — delivery mode for the push-flow readiness step (§audit spec).
// VOCABULARY BRIDGE (do not confuse three overlapping type systems):
//   • DeliveryMode (this)          : 'classroom' | 'lab' | 'practice'   ← the CB/LB/PB the audit uses
//   • CourseOffering.courseType    : 'didactic' | 'clinical'            ← LEGACY template-matching join key
//   • MasterCourse.type / CourseTypeFilter : ...'seminar'...            ← LEGACY, courses/templates surfaces
// deliveryModeOf() maps the legacy pair (didactic→classroom, clinical→practice); 'lab' has NO legacy
// equivalent, so LB offerings must set deliveryMode explicitly. Unifying these is out of scope here.
export type DeliveryMode = 'classroom' | 'lab' | 'practice'

/** Short badge codes for the audit Type column. */
export const COURSE_TYPE_LABEL: Record<DeliveryMode, string> = {
  classroom: 'CB',
  lab: 'LB',
  practice: 'PB',
}

/** Full names (tooltips / a11y). */
export const COURSE_TYPE_FULL_LABEL: Record<DeliveryMode, string> = {
  classroom: 'Classroom based',
  lab: 'Lab based',
  practice: 'Practice based',
}

export interface CourseOffering {
  id: string
  /** FK → MasterCourse */
  masterCourseId: string
  /** FK → ProgramTerm */
  termId: string
  /** Graduating class */
  cohort: string
  /** Primary faculty (Course Coordinator / PB Clinical Coordinator). FK → INSTRUCTORS */
  primaryFacultyId: string
  /** Additional collaborators / instructors (per Aarti D7). FK → INSTRUCTORS */
  collaboratorIds: string[]
  /** Roster size */
  enrolledCount: number
  status: 'planned' | 'active' | 'completed' | 'archived'
  /** Legacy template-matching join key (didactic↔CB, clinical↔PB). Do not remove — templates match on this. */
  courseType?: 'didactic' | 'clinical'
  /** CB/LB/PB. Optional — falls back from courseType via deliveryModeOf(). */
  deliveryMode?: DeliveryMode
  /** LB only — lab teaching assistants. FK → INSTRUCTORS */
  labTaIds?: string[]
  /** PB only — placement / clinical faculty. FK → INSTRUCTORS */
  placementFacultyIds?: string[]
}

/** Resolve an offering's CB/LB/PB: explicit deliveryMode wins, else legacy courseType maps (clinical→PB, else CB). */
export function deliveryModeOf(o: Pick<CourseOffering, 'deliveryMode' | 'courseType'>): DeliveryMode {
  if (o.deliveryMode) return o.deliveryMode
  return o.courseType === 'clinical' ? 'practice' : 'classroom'
}

// Permissions (entity #6) — role × scope grants
//
// Per Aarti 2026-05-08 16:09 D6 + D7:
//   - 3 view tiers: admin / faculty / student (workspace ADR-004)
//   - 2 faculty sub-roles at course level: Course Coordinator (full CRUD on
//     assigned offerings) + Instructor (limited capabilities, exact set TBD
//     per Vishaka R7)
//   - Collaborator pattern: faculty can be granted read-only or co-edit
//     access on specific course offerings
//
// Phase 1 ships: role assignments + per-faculty collaborator grants.
// Granular per-resource permission editing is a Phase 2 follow-up.
export type RoleKey = 'admin' | 'course-coordinator' | 'instructor' | 'collaborator-readonly' | 'collaborator-edit'

export interface RoleAssignment {
  id: string
  facultyId: string  // FK
  role: RoleKey
  /** Scope: 'global' (all offerings) or specific course offering ID. */
  scope: 'global' | string
  grantedAt: string
  grantedBy: string
}

export const ROLE_LABELS: Record<RoleKey, string> = {
  'admin':                 'Admin',
  'course-coordinator':    'Course Coordinator',
  'instructor':            'Instructor',
  'collaborator-readonly': 'Collaborator (read-only)',
  'collaborator-edit':     'Collaborator (co-edit)',
}

export const ROLE_DESCRIPTIONS: Record<RoleKey, string> = {
  'admin':                 'Full access to all program-level entities + cross-product modules.',
  'course-coordinator':    'Whole-and-soul navigator of an assigned offering — full CRUD on Questions, Assessments, Students, Accommodations [read-only inherited].',
  'instructor':            'Limited access on assigned offerings (exact capabilities TBD with Vishaka — see R7).',
  'collaborator-readonly': 'View-only access on a specific offering or assessment, granted by Course Coordinator with admin permission.',
  'collaborator-edit':     'Co-edit access on a specific offering or assessment, granted by Course Coordinator with admin permission.',
}

export const MOCK_ROLE_ASSIGNMENTS: RoleAssignment[] = [
  // Admin (rare — usually 1-2 per program)
  { id: 'ra1',  facultyId: 'f1', role: 'admin',                 scope: 'global', grantedAt: '2024-08-01', grantedBy: 'System' },
  // Course Coordinators per active offerings
  { id: 'ra2',  facultyId: 'f2', role: 'course-coordinator',    scope: 'co1',    grantedAt: '2025-08-25', grantedBy: 'Dr. Patel (Admin)' },
  { id: 'ra3',  facultyId: 'f3', role: 'course-coordinator',    scope: 'co2',    grantedAt: '2025-08-25', grantedBy: 'Dr. Patel (Admin)' },
  { id: 'ra4',  facultyId: 'f3', role: 'course-coordinator',    scope: 'co3',    grantedAt: '2025-08-25', grantedBy: 'Dr. Patel (Admin)' },
  { id: 'ra5',  facultyId: 'f4', role: 'course-coordinator',    scope: 'co5',    grantedAt: '2025-08-25', grantedBy: 'Dr. Patel (Admin)' },
  { id: 'ra6',  facultyId: 'f4', role: 'course-coordinator',    scope: 'co6',    grantedAt: '2025-08-25', grantedBy: 'Dr. Patel (Admin)' },
  { id: 'ra7',  facultyId: 'f2', role: 'course-coordinator',    scope: 'co7',    grantedAt: '2025-08-25', grantedBy: 'Dr. Patel (Admin)' },
  // Instructors (limited)
  { id: 'ra8',  facultyId: 'f5', role: 'instructor',            scope: 'co1',    grantedAt: '2025-08-25', grantedBy: 'Dr. Chen (CC)' },
  // Collaborators
  { id: 'ra9',  facultyId: 'f1', role: 'collaborator-edit',     scope: 'co1',    grantedAt: '2026-01-15', grantedBy: 'Dr. Chen (CC)' },
  { id: 'ra10', facultyId: 'f1', role: 'collaborator-readonly', scope: 'co2',    grantedAt: '2026-01-15', grantedBy: 'Dr. Williams (CC)' },
]

// Accommodations (entity #10) — workspace ADR-006 shared module
//
// Three tiers per ADR-006:
//   1. Master catalog (program admin-defined; this list)
//   2. Per-student assignments (admin only, with documentation)
//   3. Course-level read-only inherited view (faculty — NOT managed here)
//
// Cross-product: Exam Mgmt + PCE + future products consume the SAME catalog.
// Faculty never CRUD — admin determines per ADR-006.
export interface MasterAccommodation {
  id: string
  /** Short code shown on roster badges (e.g., '+10', 'RDR'). */
  code: string
  /** Full name. */
  name: string
  description: string
  /** Common categories for grouping. */
  category: 'time' | 'environment' | 'assistive-tech' | 'format' | 'breaks' | 'other'
  /** Standard (built-in) vs school-defined custom. */
  isCustom: boolean
  status: 'active' | 'archived'
}

export const MOCK_ACCOMMODATIONS: MasterAccommodation[] = [
  { id: 'ac1', code: '+10', name: '+10% time',                  description: 'Extended testing time, 10% additional',          category: 'time',          isCustom: false, status: 'active' },
  { id: 'ac2', code: '+25', name: '+25% time',                  description: 'Extended testing time, 25% additional',          category: 'time',          isCustom: false, status: 'active' },
  { id: 'ac3', code: '+50', name: '+50% time',                  description: 'Extended testing time, 50% additional',          category: 'time',          isCustom: false, status: 'active' },
  { id: 'ac4', code: '+2x', name: 'Double time',                description: 'Extended testing time, 100% additional',         category: 'time',          isCustom: false, status: 'active' },
  { id: 'ac5', code: 'RDR', name: 'Reader',                      description: 'Test administered by a reader',                  category: 'assistive-tech', isCustom: false, status: 'active' },
  { id: 'ac6', code: 'SCB', name: 'Scribe',                      description: 'Student dictates answers; scribe records',       category: 'assistive-tech', isCustom: false, status: 'active' },
  { id: 'ac7', code: 'SEP', name: 'Separate room',               description: 'Quiet, distraction-free testing environment',    category: 'environment',   isCustom: false, status: 'active' },
  { id: 'ac8', code: 'BRK', name: 'Frequent breaks',             description: 'Stop-the-clock breaks at student discretion',    category: 'breaks',        isCustom: false, status: 'active' },
  { id: 'ac9', code: 'LRG', name: 'Large print',                 description: 'Test materials in larger font size',             category: 'format',        isCustom: false, status: 'active' },
  { id: 'ac10', code: 'BRL', name: 'Braille',                     description: 'Test materials in Braille',                      category: 'format',        isCustom: false, status: 'active' },
  { id: 'ac11', code: 'ASL', name: 'ASL interpreter',             description: 'American Sign Language interpreter present',     category: 'assistive-tech', isCustom: false, status: 'active' },
  { id: 'ac12', code: 'CST', name: 'Custom — service animal',    description: 'Service animal accommodation per school policy', category: 'other',         isCustom: true,  status: 'active' },
]

// Students (entity #4) — typically LMS-synced; large roster
export interface Student {
  id: string
  /** Institution-issued student ID (e.g., '01234567'). */
  studentId: string
  firstName: string
  lastName: string
  email: string
  cohort: string
  enrollmentStatus: 'enrolled' | 'graduated' | 'withdrawn' | 'on-leave'
  /** ISO date when first enrolled. */
  enrolledAt: string
  /** Workspace ADR-006 — accommodations are admin-applied; this is a derived flag for roster display. */
  hasAccommodations?: boolean
}

export const MOCK_STUDENTS: Student[] = [
  { id: 'st1',  studentId: '01234567', firstName: 'Alice',    lastName: 'Chen',     email: 'alice.chen@school.edu',   cohort: 'Class of 2026', enrollmentStatus: 'enrolled',  enrolledAt: '2023-08-25', hasAccommodations: true },
  { id: 'st2',  studentId: '01234568', firstName: 'Bob',      lastName: 'Patel',    email: 'bob.patel@school.edu',    cohort: 'Class of 2026', enrollmentStatus: 'enrolled',  enrolledAt: '2023-08-25' },
  { id: 'st3',  studentId: '01234569', firstName: 'Carlos',   lastName: 'Diaz',     email: 'carlos.diaz@school.edu',  cohort: 'Class of 2026', enrollmentStatus: 'enrolled',  enrolledAt: '2023-08-25', hasAccommodations: true },
  { id: 'st4',  studentId: '01234570', firstName: 'Dana',     lastName: 'Kim',      email: 'dana.kim@school.edu',     cohort: 'Class of 2026', enrollmentStatus: 'enrolled',  enrolledAt: '2023-08-25' },
  { id: 'st5',  studentId: '01234571', firstName: 'Eli',      lastName: 'Rodriguez', email: 'eli.rodriguez@school.edu', cohort: 'Class of 2026', enrollmentStatus: 'on-leave', enrolledAt: '2023-08-25' },
  { id: 'st6',  studentId: '01234572', firstName: 'Faye',     lastName: 'Williams', email: 'faye.williams@school.edu', cohort: 'Class of 2027', enrollmentStatus: 'enrolled',  enrolledAt: '2024-08-26' },
  { id: 'st7',  studentId: '01234573', firstName: 'Gabe',     lastName: 'Nguyen',   email: 'gabe.nguyen@school.edu',  cohort: 'Class of 2027', enrollmentStatus: 'enrolled',  enrolledAt: '2024-08-26', hasAccommodations: true },
  { id: 'st8',  studentId: '01234574', firstName: 'Hana',     lastName: 'Sato',     email: 'hana.sato@school.edu',    cohort: 'Class of 2027', enrollmentStatus: 'enrolled',  enrolledAt: '2024-08-26' },
  { id: 'st9',  studentId: '01234575', firstName: 'Idris',    lastName: 'Khan',     email: 'idris.khan@school.edu',   cohort: 'Class of 2027', enrollmentStatus: 'enrolled',  enrolledAt: '2024-08-26' },
  { id: 'st10', studentId: '01234576', firstName: 'Julia',    lastName: 'Morales',  email: 'julia.morales@school.edu', cohort: 'Class of 2027', enrollmentStatus: 'withdrawn', enrolledAt: '2024-08-26' },
  { id: 'st11', studentId: '01234577', firstName: 'Kenji',    lastName: 'Lee',      email: 'kenji.lee@school.edu',    cohort: 'Class of 2028', enrollmentStatus: 'enrolled',  enrolledAt: '2025-08-25' },
  { id: 'st12', studentId: '01234578', firstName: 'Lila',     lastName: 'Park',     email: 'lila.park@school.edu',    cohort: 'Class of 2028', enrollmentStatus: 'enrolled',  enrolledAt: '2025-08-25', hasAccommodations: true },
  { id: 'st13', studentId: '01234579', firstName: 'Mateo',    lastName: 'Garcia',   email: 'mateo.garcia@school.edu', cohort: 'Class of 2028', enrollmentStatus: 'enrolled',  enrolledAt: '2025-08-25' },
  { id: 'st14', studentId: '01234580', firstName: 'Nadia',    lastName: 'Brown',    email: 'nadia.brown@school.edu',  cohort: 'Class of 2028', enrollmentStatus: 'enrolled',  enrolledAt: '2025-08-25' },
  { id: 'st15', studentId: '01234581', firstName: 'Oliver',   lastName: 'Tran',     email: 'oliver.tran@school.edu',  cohort: 'Class of 2028', enrollmentStatus: 'enrolled',  enrolledAt: '2025-08-25' },
  { id: 'st16', studentId: '01234500', firstName: 'Priya',    lastName: 'Sharma',   email: 'priya.sharma@alumni.school.edu', cohort: 'Class of 2025', enrollmentStatus: 'graduated', enrolledAt: '2022-08-26' },
  { id: 'st17', studentId: '01234501', firstName: 'Quinn',    lastName: 'Olsen',    email: 'quinn.olsen@alumni.school.edu',  cohort: 'Class of 2025', enrollmentStatus: 'graduated', enrolledAt: '2022-08-26' },
]

// Assessment types (entity #11) — small fixed-ish set
export interface AssessmentType {
  id: string
  name: string
  description: string
  /** Phase this type ships in. */
  phase: 1 | 2 | 3
  status: 'active' | 'deferred'
}

export const MOCK_ASSESSMENT_TYPES: AssessmentType[] = [
  { id: 'at1', name: 'Pop quiz',          description: '15-minute, can be turned on/off; in-class delivery',                     phase: 1, status: 'active' },
  { id: 'at2', name: 'Timed exam',        description: 'Standard timed assessment with download capability',                     phase: 1, status: 'active' },
  { id: 'at3', name: 'Take-home',         description: 'Multi-day window; honor-code based',                                      phase: 1, status: 'active' },
  { id: 'at4', name: 'Open-book',         description: 'Reference materials permitted during the assessment',                      phase: 1, status: 'active' },
  { id: 'at5', name: 'Standard proctored', description: 'Faculty-supervised in-person; no lockdown browser',                       phase: 1, status: 'active' },
  { id: 'at6', name: 'Lockdown proctored', description: 'Lockdown browser blocks copy/screenshot/tab-switch (vendor TBD Q4 2026)', phase: 2, status: 'deferred' },
  { id: 'at7', name: 'Remote-monitored',   description: 'Camera + screen capture; vendor-monitored proctoring',                    phase: 3, status: 'deferred' },
]

// Content areas (entity #7), Competencies (#8), Standards (#9) — taxonomy entities
// Same shape per Aarti 2026-05-07 (`fb9e76c2`): Gmail-style nested labels.
export interface TaxonomyEntry {
  id: string
  name: string
  description: string
  parentId?: string
  status: 'active' | 'archived'
}
export type ContentArea = TaxonomyEntry
export type Competency = TaxonomyEntry & {
  /** Optional accreditation source (e.g., 'NCLEX', 'CAPTE 2C'). */
  source?: string
}
export type Standard = TaxonomyEntry & {
  /** Required source — standards always come from an accreditor. */
  source: string
  /** Standard code from the source body (e.g., 'CAPTE 2C-1', 'NCLEX-CN3.1'). */
  code: string
}

export const MOCK_CONTENT_AREAS: ContentArea[] = [
  { id: 'ca1', name: 'Patient Care',           description: 'Direct clinical care delivery',                            status: 'active' },
  { id: 'ca2', name: 'Pharmacology',           description: 'Drug mechanisms, indications, contraindications',          status: 'active' },
  { id: 'ca3', name: 'Anatomy & Physiology',   description: 'Body systems and function',                                 status: 'active' },
  { id: 'ca4', name: 'Communication',          description: 'Patient interaction, charting, interprofessional comms',   status: 'active' },
  { id: 'ca5', name: 'Professionalism',        description: 'Ethics, regulatory compliance, patient advocacy',          status: 'active' },
  { id: 'ca6', name: 'Research Methods',       description: 'Evidence-based practice, statistics',                      status: 'active' },
  { id: 'ca7', name: 'Cellular Biology',       description: 'Subset of Anatomy & Physiology',                           parentId: 'ca3', status: 'active' },
  { id: 'ca8', name: 'Cardiovascular',         description: 'Heart, vasculature, related pathology',                     parentId: 'ca3', status: 'active' },
]

export const MOCK_COMPETENCIES: Competency[] = [
  { id: 'cm1', name: 'Patient-Centered Care',  description: 'Provide care that is respectful of and responsive to individual patient preferences', source: 'IOM',           status: 'active' },
  { id: 'cm2', name: 'Teamwork & Collaboration', description: 'Function effectively within nursing and inter-professional teams',                  source: 'IOM',           status: 'active' },
  { id: 'cm3', name: 'Evidence-Based Practice', description: 'Integrate best research with clinical expertise',                                       source: 'IOM',           status: 'active' },
  { id: 'cm4', name: 'Quality Improvement',     description: 'Use data to monitor outcomes and improve care quality',                                source: 'IOM',           status: 'active' },
  { id: 'cm5', name: 'Safety',                  description: 'Minimize risk of harm to patients and providers',                                       source: 'IOM',           status: 'active' },
  { id: 'cm6', name: 'Informatics',             description: 'Use information and technology to communicate, manage, and support decision-making',  source: 'IOM',           status: 'active' },
  { id: 'cm7', name: 'Pharmacological Therapy', description: 'Apply principles of pharmacology to medication management',                            source: 'NLN',           status: 'active' },
  { id: 'cm8', name: 'Patient Education',       description: 'Provide individualized education to promote health',                                    source: 'NLN', parentId: 'cm1', status: 'active' },
]

export const MOCK_STANDARDS: Standard[] = [
  { id: 'st1', name: 'Patient Care',                    code: 'CAPTE 2C-1',  source: 'CAPTE',  description: 'Provide patient-centered care to people with movement system conditions', status: 'active' },
  { id: 'st2', name: 'Communication',                   code: 'CAPTE 2C-2',  source: 'CAPTE',  description: 'Communicate effectively with patients, caregivers, peers',                  status: 'active' },
  { id: 'st3', name: 'Professional Behaviors',          code: 'CAPTE 2C-3',  source: 'CAPTE',  description: 'Demonstrate professional behaviors and ethical conduct',                    status: 'active' },
  { id: 'st4', name: 'Practice Management',             code: 'CAPTE 2C-5',  source: 'CAPTE',  description: 'Manage workload, time, and clinical resources effectively',                 status: 'active' },
  { id: 'st5', name: 'Health & Wellness',               code: 'NCLEX-HW1',   source: 'NCLEX',  description: 'Promote health and prevent illness',                                        status: 'active' },
  { id: 'st6', name: 'Pharmacological Therapies',       code: 'NCLEX-PT3',   source: 'NCLEX',  description: 'Administer medications safely and monitor outcomes',                        status: 'active' },
  { id: 'st7', name: 'Reduction of Risk Potential',     code: 'NCLEX-RR1',   source: 'NCLEX',  description: 'Reduce likelihood of complications during procedures',                      status: 'active' },
  { id: 'st8', name: 'Pharmacotherapy',                 code: 'ARC-PA-B2.05', source: 'ARC-PA', description: 'Apply pharmacotherapeutic principles in clinical decision-making',          status: 'active' },
]

export const MOCK_COURSE_OFFERINGS: CourseOffering[] = [
  // ── Spring 2026 (pt1) ─────────────────────────────────────────────────────
  { id: 'co1',  masterCourseId: 'mc1',  termId: 'pt1', cohort: 'Class of 2027', primaryFacultyId: 'f2', collaboratorIds: ['f1'], enrolledCount: 50, status: 'active',    courseType: 'didactic' },
  { id: 'co2',  masterCourseId: 'mc14', termId: 'pt1', cohort: 'Class of 2026', primaryFacultyId: 'f1', collaboratorIds: ['f6'], enrolledCount: 48, status: 'active',    courseType: 'clinical' },
  { id: 'co3',  masterCourseId: 'mc15', termId: 'pt1', cohort: 'Class of 2026', primaryFacultyId: 'f3', collaboratorIds: [],     enrolledCount: 46, status: 'completed', courseType: 'clinical' },
  { id: 'co4',  masterCourseId: 'mc4',  termId: 'pt2', cohort: 'Class of 2027', primaryFacultyId: 'f4', collaboratorIds: [],     enrolledCount: 52, status: 'archived',  courseType: 'didactic' },
  { id: 'co5',  masterCourseId: 'mc2',  termId: 'pt1', cohort: 'Class of 2028', primaryFacultyId: 'f3', collaboratorIds: [],     enrolledCount: 44, status: 'active',    courseType: 'didactic' },
  { id: 'co6',  masterCourseId: 'mc6',  termId: 'pt1', cohort: 'Class of 2027', primaryFacultyId: 'f1', collaboratorIds: ['f2'], enrolledCount: 50, status: 'active',    courseType: 'didactic' },
  { id: 'co7',  masterCourseId: 'mc7',  termId: 'pt1', cohort: 'Class of 2027', primaryFacultyId: 'f2', collaboratorIds: [],     enrolledCount: 50, status: 'active',    courseType: 'didactic' },
  { id: 'co8',  masterCourseId: 'mc8',  termId: 'pt1', cohort: 'Class of 2026', primaryFacultyId: 'f3', collaboratorIds: [],     enrolledCount: 48, status: 'active',    courseType: 'didactic' },

  // ── Fall 2026 (pt5) — full term ──────────────────────────────────────────
  // Year 1 — Foundations
  { id: 'co9',  masterCourseId: 'mc1',  termId: 'pt5', cohort: 'Year 1 – Section A', primaryFacultyId: 'f2', collaboratorIds: ['f1'], enrolledCount: 48, status: 'active',    courseType: 'didactic' },
  { id: 'co10', masterCourseId: 'mc2',  termId: 'pt5', cohort: 'Year 1 – Section B', primaryFacultyId: 'f3', collaboratorIds: [],     enrolledCount: 48, status: 'active',    courseType: 'didactic' },
  { id: 'co11', masterCourseId: 'mc3',  termId: 'pt5', cohort: 'Year 1 – Section C', primaryFacultyId: 'f4', collaboratorIds: ['f4'],     enrolledCount: 46, status: 'active',    courseType: 'didactic' },
  { id: 'co12', masterCourseId: 'mc5',  termId: 'pt5', cohort: 'Year 1 – Section D', primaryFacultyId: 'f5', collaboratorIds: [],     enrolledCount: 48, status: 'active',    courseType: 'didactic' },
  // Year 2 — Clinical Sciences
  { id: 'co13', masterCourseId: 'mc6',  termId: 'pt5', cohort: 'Year 2 – Section A', primaryFacultyId: 'f1', collaboratorIds: ['f2'], enrolledCount: 44, status: 'active',    courseType: 'didactic' },
  { id: 'co14', masterCourseId: 'mc8',  termId: 'pt5', cohort: 'Year 2 – Section B', primaryFacultyId: 'f3', collaboratorIds: [],     enrolledCount: 44, status: 'active',    courseType: 'didactic' },
  { id: 'co15', masterCourseId: 'mc9',  termId: 'pt5', cohort: 'Year 2 – Section C', primaryFacultyId: 'f4', collaboratorIds: ['f4'],     enrolledCount: 42, status: 'active',    courseType: 'didactic' },
  { id: 'co16', masterCourseId: 'mc12', termId: 'pt5', cohort: 'Year 2 – Section D', primaryFacultyId: '',   collaboratorIds: [],     enrolledCount: 40, status: 'active',    courseType: 'didactic' },
  // Year 3 — Clinical Practicums
  { id: 'co17', masterCourseId: 'mc14', termId: 'pt5', cohort: 'Year 3 – Section A', primaryFacultyId: 'f1', collaboratorIds: ['f6'], enrolledCount: 14, status: 'active',    courseType: 'clinical' },
  { id: 'co18', masterCourseId: 'mc15', termId: 'pt5', cohort: 'Year 3 – Section B', primaryFacultyId: 'f6', collaboratorIds: [],     enrolledCount: 16, status: 'active',    courseType: 'clinical' },
  { id: 'co19', masterCourseId: 'mc11', termId: 'pt5', cohort: 'Year 3 – Section C', primaryFacultyId: 'f3', collaboratorIds: ['f4'],     enrolledCount: 44, status: 'active',    courseType: 'didactic' },

  // ── Lab-based (LB) + Practice-based (PB) — audit readiness fixtures (deliveryMode + one gap each) ──
  { id: 'co20', masterCourseId: 'mc7',  termId: 'pt5', cohort: 'Year 2 – Section E', primaryFacultyId: 'f3', collaboratorIds: ['f2'], labTaIds: ['f5'], enrolledCount: 0,  status: 'active', courseType: 'didactic', deliveryMode: 'lab' },              // gap: 0 students
  { id: 'co21', masterCourseId: 'mc4',  termId: 'pt5', cohort: 'Year 1 – Section E', primaryFacultyId: 'f4', collaboratorIds: ['f2','f5'],     labTaIds: [],     enrolledCount: 30, status: 'active', courseType: 'didactic', deliveryMode: 'lab' },              // gap: no lab instructor/TA
  { id: 'co22', masterCourseId: 'mc16', termId: 'pt5', cohort: 'Year 3 – Section D', primaryFacultyId: '',   collaboratorIds: ['f6'], placementFacultyIds: ['f6'], enrolledCount: 12, status: 'active', courseType: 'clinical', deliveryMode: 'practice' }, // gap: no clinical coordinator
  { id: 'co23', masterCourseId: 'mc14', termId: 'pt1', cohort: 'Class of 2026', primaryFacultyId: 'f1', collaboratorIds: [],     placementFacultyIds: [],     enrolledCount: 18, status: 'active', courseType: 'clinical', deliveryMode: 'practice' }, // gap: no placement faculty
]

// Maps CourseOffering ID → enrolled Student IDs visible in this demo.
// The real system enrolledCount may be higher — shown as "X of N enrolled in demo".
export const MOCK_COURSE_ENROLLMENTS: Record<string, string[]> = {
  // Spring 2026 (pt1)
  co1: ['st6', 'st7', 'st8', 'st9'],                  // DPT-501, Class of 2027
  co2: ['st1', 'st2', 'st3', 'st4'],                  // DPT-601, Class of 2026
  co3: ['st1', 'st2', 'st3', 'st4'],                  // DPT-602, Class of 2026
  co5: ['st11', 'st12', 'st13', 'st14', 'st15'],      // DPT-502, Class of 2028
  co6: ['st6', 'st7', 'st8', 'st9'],                  // DPT-510, Class of 2027
  co7: ['st6', 'st7', 'st8', 'st9'],                  // DPT-511, Class of 2027
  co8: ['st1', 'st2', 'st3', 'st4'],                  // DPT-520, Class of 2026
  // Fall 2026 (pt5) — Year 1 (new cohort)
  co9:  ['st18', 'st19', 'st20', 'st21', 'st22'],     // DPT-501
  co10: ['st18', 'st19', 'st20', 'st21', 'st22'],     // DPT-502
  co11: ['st18', 'st19', 'st20', 'st21'],              // DPT-503
  co12: ['st18', 'st19', 'st20', 'st21', 'st22'],     // DPT-505
  co21: ['st19', 'st20', 'st21', 'st22', 'st23'],     // DPT-530 (lab)
  // Fall 2026 (pt5) — Year 2, Class of 2028
  co13: ['st11', 'st12', 'st13', 'st14', 'st15'],     // DPT-510
  co14: ['st11', 'st12', 'st13', 'st14'],             // DPT-520
  co15: ['st11', 'st12', 'st13'],                     // DPT-530
  co16: ['st11', 'st12', 'st13', 'st14'],             // DPT-611 (unassigned faculty demo)
  // Fall 2026 (pt5) — Year 3, Class of 2027
  co17: ['st6', 'st7', 'st8'],                        // DPT-601
  co18: ['st6', 'st7', 'st8', 'st9'],                 // DPT-602
  co19: ['st6', 'st7', 'st8', 'st9'],                 // DPT-550
}

export interface Personnel {
  id: string
  name: string
  email: string
  role: string
  department: string
  status: 'Active' | 'Inactive'
}

export const MOCK_PERSONNEL: Personnel[] = [
  { id: 'p1',  name: 'Sandra Torres',    email: 'storres@school.edu',     role: 'Program Coordinator',          department: 'Physical Therapy',   status: 'Active'   },
  { id: 'p2',  name: 'James Whitfield',  email: 'jwhitfield@school.edu',  role: 'Clinical Education Director',  department: 'Clinical Affairs',   status: 'Active'   },
  { id: 'p3',  name: 'Mei-Lin Cheng',    email: 'mcheng@school.edu',      role: 'Administrative Coordinator',   department: 'Student Services',   status: 'Active'   },
  { id: 'p4',  name: 'Derek Okafor',     email: 'dokafor@school.edu',     role: 'Accreditation Specialist',     department: 'Academic Affairs',   status: 'Active'   },
  { id: 'p5',  name: 'Priya Nair',       email: 'pnair@school.edu',       role: 'Curriculum Coordinator',       department: 'Academic Affairs',   status: 'Active'   },
  { id: 'p6',  name: 'Tom Harrington',   email: 'tharrington@school.edu', role: 'IT Support Specialist',        department: 'Technology',         status: 'Active'   },
  { id: 'p7',  name: 'Aisha Mukherjee',  email: 'amukherjee@school.edu',  role: 'Student Affairs Coordinator',  department: 'Student Services',   status: 'Active'   },
  { id: 'p8',  name: 'Carlos Reyes',     email: 'creyes@school.edu',      role: 'Research Coordinator',         department: 'Research',           status: 'Inactive' },
  { id: 'p9',  name: 'Laura Kwan',       email: 'lkwan@school.edu',       role: 'Program Coordinator',          department: 'Physical Therapy',   status: 'Active'   },
  { id: 'p10', name: 'Nathan Brooks',    email: 'nbrooks@school.edu',     role: 'Financial Aid Advisor',        department: 'Student Services',   status: 'Active'   },
]

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

// ── Per-question scoring — Evaluation Card (Sections tab) ────────────────────

export interface QuestionScore {
  questionId: string
  avg: number
  count: number
  /** Response counts for ratings 1–5; index 0 = rating 1. */
  distribution: [number, number, number, number, number]
}

export interface InstructorQuestionBlock {
  instructorId: string
  scores: QuestionScore[]
}

export interface SurveyQuestionData {
  surveyId: string
  /** Likert question scores keyed by subjectKey (non-faculty sections). */
  sectionScores: Record<string, QuestionScore[]>
  /** Faculty section (course_instructor) — one block per instructor. */
  instructorBlocks?: InstructorQuestionBlock[]
  /** Open-text response counts keyed by questionId. */
  freeTextCounts: Record<string, number>
}

export const MOCK_SURVEY_QUESTION_DATA: SurveyQuestionData[] = [
  // mon1 — DPT-510 live · tmpl1 · Dr. Kim (f4) · 23 partial responses
  {
    surveyId: 'mon1',
    sectionScores: {
      course_content: [
        { questionId: 'q1', avg: 4.0, count: 23, distribution: [0, 1, 5, 10, 7] },
        { questionId: 'q2', avg: 3.8, count: 23, distribution: [1, 2, 6, 9, 5] },
        { questionId: 'q3', avg: 3.7, count: 23, distribution: [1, 3, 6, 9, 4] },
        { questionId: 'q4', avg: 4.1, count: 23, distribution: [0, 1, 4, 10, 8] },
      ],
    },
    instructorBlocks: [
      {
        instructorId: 'f4',
        scores: [
          { questionId: 'q6', avg: 4.2, count: 23, distribution: [0, 1, 3, 9, 10] },
          { questionId: 'q7', avg: 4.0, count: 23, distribution: [0, 2, 4, 9, 8] },
        ],
      },
    ],
    freeTextCounts: { q5: 8, q8: 5 },
  },
  // mon2 — DPT-611 live · tmpl2 · Dr. Gomez (f5) · 4 sparse responses
  {
    surveyId: 'mon2',
    sectionScores: {},
    instructorBlocks: [
      {
        instructorId: 'f5',
        scores: [
          { questionId: 'q9',  avg: 4.0, count: 4, distribution: [0, 0, 1, 2, 1] },
          { questionId: 'q10', avg: 3.5, count: 4, distribution: [0, 1, 1, 1, 1] },
        ],
      },
    ],
    freeTextCounts: { q11: 2 },
  },
  {
    surveyId: 's1',
    sectionScores: {
      course_content: [
        { questionId: 'c1', avg: 4.3, count: 34, distribution: [0, 1, 3, 12, 18] },
        { questionId: 'c2', avg: 4.1, count: 34, distribution: [0, 2, 4, 15, 13] },
        { questionId: 'c3', avg: 3.6, count: 34, distribution: [1, 4, 8, 14,  7] },
        { questionId: 'c4', avg: 3.9, count: 34, distribution: [0, 3, 7, 15,  9] },
        { questionId: 'c5', avg: 4.2, count: 34, distribution: [0, 2, 3, 13, 16] },
        { questionId: 'c6', avg: 3.5, count: 34, distribution: [2, 4, 9, 13,  6] },
      ],
      lab_instructor: [
        { questionId: 'l1', avg: 4.0, count: 34, distribution: [0, 2, 6, 14, 12] },
        { questionId: 'l2', avg: 3.4, count: 34, distribution: [2, 5, 9, 13,  5] },
        { questionId: 'l3', avg: 3.8, count: 34, distribution: [1, 3, 7, 15,  8] },
        { questionId: 'l4', avg: 4.4, count: 34, distribution: [0, 1, 2, 12, 19] },
      ],
      course_director: [
        { questionId: 'o1', avg: 4.2, count: 34, distribution: [0, 2, 4, 13, 15] },
        { questionId: 'o2', avg: 4.0, count: 34, distribution: [0, 3, 5, 14, 12] },
      ],
    },
    instructorBlocks: [
      {
        instructorId: 'f1',
        scores: [
          { questionId: 'i1', avg: 4.5, count: 34, distribution: [0, 1, 2, 10, 21] },
          { questionId: 'i2', avg: 4.2, count: 34, distribution: [0, 2, 4, 13, 15] },
          { questionId: 'i3', avg: 4.3, count: 34, distribution: [0, 1, 4, 12, 17] },
          { questionId: 'i4', avg: 4.0, count: 34, distribution: [0, 3, 5, 14, 12] },
          { questionId: 'i5', avg: 4.6, count: 34, distribution: [0, 0, 2, 10, 22] },
        ],
      },
      {
        instructorId: 'f2',
        scores: [
          { questionId: 'i1', avg: 4.1, count: 34, distribution: [0, 2, 5, 14, 13] },
          { questionId: 'i2', avg: 3.7, count: 34, distribution: [1, 3, 8, 14,  8] },
          { questionId: 'i3', avg: 3.9, count: 34, distribution: [0, 3, 7, 14, 10] },
          { questionId: 'i4', avg: 3.5, count: 34, distribution: [2, 4, 9, 12,  7] },
          { questionId: 'i5', avg: 4.2, count: 34, distribution: [0, 1, 5, 14, 14] },
        ],
      },
    ],
    freeTextCounts: { c7: 12, i6: 9, l5: 6 },
  },
  // s2 — DPT-601 Clinical Practicum I · Dr. Williams (f3) primary + Dr. Chen (f2) guest · 21 responses
  {
    surveyId: 's2',
    sectionScores: {
      course_content: [
        { questionId: 'q1', avg: 4.1, count: 21, distribution: [ 0,  1,  3, 10,  7] },
        { questionId: 'q2', avg: 4.0, count: 21, distribution: [ 0,  1,  4, 11,  5] },
        { questionId: 'q3', avg: 3.9, count: 21, distribution: [ 0,  2,  5,  9,  5] },
        { questionId: 'q4', avg: 4.2, count: 21, distribution: [ 0,  0,  3, 10,  8] },
      ],
    },
    instructorBlocks: [
      {
        instructorId: 'f3',
        scores: [
          { questionId: 'q6', avg: 4.6, count: 21, distribution: [ 0,  0,  1,  8, 12] },
          { questionId: 'q7', avg: 4.4, count: 21, distribution: [ 0,  0,  2,  8, 11] },
        ],
      },
      {
        instructorId: 'f2',
        scores: [
          { questionId: 'q6', avg: 4.0, count: 21, distribution: [ 0,  1,  4,  9,  7] },
          { questionId: 'q7', avg: 3.8, count: 21, distribution: [ 0,  2,  5,  9,  5] },
        ],
      },
    ],
    freeTextCounts: { q5: 9, q8: 5 },
  },
  // s3 — DPT-602 Clinical Practicum II · Dr. Maria Williams (f3) · 46 responses
  {
    surveyId: 's3',
    sectionScores: {
      course_content: [
        { questionId: 'q1', avg: 3.8, count: 46, distribution: [ 1,  4,  9, 20, 12] },
        { questionId: 'q2', avg: 3.7, count: 46, distribution: [ 1,  5, 11, 20,  9] },
        { questionId: 'q3', avg: 3.8, count: 46, distribution: [ 1,  3, 10, 21, 11] },
        { questionId: 'q4', avg: 3.9, count: 46, distribution: [ 0,  4,  9, 20, 13] },
      ],
    },
    instructorBlocks: [
      {
        instructorId: 'f3',
        scores: [
          { questionId: 'q6', avg: 4.6, count: 46, distribution: [ 0,  1,  3, 12, 30] },
          { questionId: 'q7', avg: 4.5, count: 46, distribution: [ 0,  1,  4, 16, 25] },
        ],
      },
    ],
    freeTextCounts: { q5: 18, q8: 11 },
  },
  // s4 — DPT-504 Neuroanatomy · Dr. James Kim (f4) · 44 responses
  {
    surveyId: 's4',
    sectionScores: {
      course_content: [
        { questionId: 'q1', avg: 4.5, count: 44, distribution: [ 0,  1,  3, 17, 23] },
        { questionId: 'q2', avg: 4.6, count: 44, distribution: [ 0,  0,  4, 14, 26] },
        { questionId: 'q3', avg: 4.4, count: 44, distribution: [ 0,  1,  5, 19, 19] },
        { questionId: 'q4', avg: 4.5, count: 44, distribution: [ 0,  1,  4, 17, 22] },
      ],
    },
    instructorBlocks: [
      {
        instructorId: 'f4',
        scores: [
          { questionId: 'q6', avg: 4.7, count: 44, distribution: [ 0,  0,  2, 10, 32] },
          { questionId: 'q7', avg: 4.5, count: 44, distribution: [ 0,  1,  3, 16, 24] },
        ],
      },
    ],
    freeTextCounts: { q5: 9, q8: 6 },
  },
  // s5 — DPT-502 Physiology & Pathophysiology · Dr. James Kim (f4) · 22 responses
  {
    surveyId: 's5',
    sectionScores: {
      course_content: [
        { questionId: 'q1', avg: 3.9, count: 22, distribution: [ 0,  2,  4, 10,  6] },
        { questionId: 'q2', avg: 3.8, count: 22, distribution: [ 0,  2,  5, 10,  5] },
        { questionId: 'q3', avg: 4.0, count: 22, distribution: [ 0,  1,  4, 11,  6] },
        { questionId: 'q4', avg: 3.9, count: 22, distribution: [ 0,  2,  4, 10,  6] },
      ],
    },
    instructorBlocks: [
      {
        instructorId: 'f4',
        scores: [
          { questionId: 'q6', avg: 4.2, count: 22, distribution: [ 0,  1,  3,  9,  9] },
          { questionId: 'q7', avg: 4.0, count: 22, distribution: [ 0,  1,  4, 10,  7] },
        ],
      },
    ],
    freeTextCounts: { q5: 7, q8: 4 },
  },
]

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
  { id: 'f1', name: 'Dr. Anita Patel',    initials: 'AP', role: 'primary', department: 'Physical Therapy',        facultyType: 'core',       rank: 'Professor',           position: 'Department Chair',     email: 'anita.patel@university.edu',    phone: '+1 (555) 101-1001', employmentStatus: 'active'   },
  { id: 'f2', name: 'Dr. Kevin Chen',     initials: 'KC', role: 'primary', department: 'Rehabilitation Sciences', facultyType: 'core',       rank: 'Associate Professor', position: 'Course Director',      email: 'kevin.chen@university.edu',     phone: '+1 (555) 101-1002', employmentStatus: 'active'   },
  { id: 'f3', name: 'Dr. Maria Williams', initials: 'MW', role: 'primary', department: 'Physical Therapy',        facultyType: 'core',       rank: 'Professor',           position: 'Program Director',     email: 'maria.williams@university.edu', phone: '+1 (555) 101-1003', employmentStatus: 'active'   },
  { id: 'f4', name: 'Dr. James Kim',      initials: 'JK', role: 'primary', department: 'Clinical Education',      facultyType: 'core',       rank: 'Assistant Professor', position: 'Clinical Coordinator', email: 'james.kim@university.edu',      phone: '+1 (555) 101-1004', employmentStatus: 'active'   },
  { id: 'f5', name: 'Dr. Rachel Gomez',   initials: 'RG', role: 'primary', department: 'Physical Therapy',        facultyType: 'core',       rank: 'Associate Professor', position: 'Core Faculty',         email: 'rachel.gomez@university.edu',   phone: '+1 (555) 101-1005', employmentStatus: 'active'   },
  { id: 'f6', name: 'Dr. Omar Hassan',    initials: 'OH', role: 'primary', department: 'Clinical Education',      facultyType: 'associated', rank: 'Lecturer',            position: 'Lab Instructor',       email: 'omar.hassan@university.edu',    phone: '+1 (555) 101-1006', employmentStatus: 'inactive' },
]

export interface FacultyOfferingRecord {
  facultyId: string
  surveyId?: string
  courseCode: string
  courseName: string
  term: string
  role: 'primary' | 'guest'
  enrolled: number
  responseRate: number
  avgRating: number
}

export const MOCK_FACULTY_OFFERINGS: FacultyOfferingRecord[] = [
  // Dr. Anita Patel (f1) — Physical Sciences, strong & consistent
  { facultyId: 'f1', surveyId: 's1', courseCode: 'DPT-501', courseName: 'Human Anatomy & Kinesiology', term: 'Spring 2026', role: 'primary', enrolled: 50, responseRate: 68, avgRating: 4.4 },
  { facultyId: 'f1',                 courseCode: 'DPT-501', courseName: 'Human Anatomy & Kinesiology', term: 'Spring 2025', role: 'primary', enrolled: 48, responseRate: 72, avgRating: 4.3 },
  { facultyId: 'f1',                 courseCode: 'DPT-501', courseName: 'Human Anatomy & Kinesiology', term: 'Spring 2024', role: 'primary', enrolled: 46, responseRate: 75, avgRating: 4.2 },
  { facultyId: 'f1', surveyId: 's6', courseCode: 'DPT-505', courseName: 'Biomechanics I',              term: 'Spring 2026', role: 'primary', enrolled: 50, responseRate: 58, avgRating: 4.1 },
  { facultyId: 'f1',                 courseCode: 'DPT-505', courseName: 'Biomechanics I',              term: 'Fall 2025',   role: 'primary', enrolled: 50, responseRate: 65, avgRating: 4.0 },
  // Dr. Kevin Chen (f2) — Basic Science, regular guest lecturer
  { facultyId: 'f2', surveyId: 's1', courseCode: 'DPT-501', courseName: 'Human Anatomy & Kinesiology', term: 'Spring 2026', role: 'guest',   enrolled: 50, responseRate: 68, avgRating: 4.2 },
  { facultyId: 'f2', surveyId: 's2', courseCode: 'DPT-601', courseName: 'Clinical Practicum I',        term: 'Spring 2026', role: 'guest',   enrolled: 38, responseRate: 42, avgRating: 3.9 },
  { facultyId: 'f2',                 courseCode: 'DPT-501', courseName: 'Human Anatomy & Kinesiology', term: 'Spring 2025', role: 'guest',   enrolled: 48, responseRate: 71, avgRating: 4.0 },
  // Dr. Maria Williams (f3) — Clinical Education, highest ratings
  { facultyId: 'f3', surveyId: 's2', courseCode: 'DPT-601', courseName: 'Clinical Practicum I',        term: 'Spring 2026', role: 'primary', enrolled: 38, responseRate: 42, avgRating: 4.5 },
  { facultyId: 'f3', surveyId: 's3', courseCode: 'DPT-602', courseName: 'Clinical Practicum II',       term: 'Spring 2026', role: 'primary', enrolled: 32, responseRate: 55, avgRating: 4.3 },
  { facultyId: 'f3',                 courseCode: 'DPT-601', courseName: 'Clinical Practicum I',        term: 'Spring 2025', role: 'primary', enrolled: 36, responseRate: 48, avgRating: 4.4 },
  { facultyId: 'f3',                 courseCode: 'DPT-601', courseName: 'Clinical Practicum I',        term: 'Spring 2024', role: 'primary', enrolled: 34, responseRate: 52, avgRating: 4.1 },
  // Dr. James Kim (f4) — Neurological PT, one at-risk offering
  { facultyId: 'f4', surveyId: 's4', courseCode: 'DPT-710', courseName: 'Neurological Rehab',         term: 'Fall 2025',   role: 'primary', enrolled: 42, responseRate: 78, avgRating: 4.6 },
  { facultyId: 'f4', surveyId: 's5', courseCode: 'DPT-711', courseName: 'Pediatric Rehab',            term: 'Fall 2025',   role: 'primary', enrolled: 42, responseRate: 71, avgRating: 4.2 },
  { facultyId: 'f4',                 courseCode: 'DPT-710', courseName: 'Neurological Rehab',         term: 'Fall 2024',   role: 'primary', enrolled: 40, responseRate: 82, avgRating: 4.5 },
  { facultyId: 'f4',                 courseCode: 'DPT-502', courseName: 'Exercise Physiology',        term: 'Spring 2025', role: 'primary', enrolled: 48, responseRate: 60, avgRating: 3.5 },
  // Dr. Rachel Gomez (f5) — Biomechanics, trending up from at-risk
  { facultyId: 'f5', surveyId: 's6', courseCode: 'DPT-505', courseName: 'Biomechanics I',             term: 'Spring 2026', role: 'primary', enrolled: 50, responseRate: 58, avgRating: 3.8 },
  { facultyId: 'f5',                 courseCode: 'DPT-506', courseName: 'Biomechanics II',            term: 'Spring 2025', role: 'primary', enrolled: 48, responseRate: 62, avgRating: 3.6 },
  { facultyId: 'f5',                 courseCode: 'DPT-506', courseName: 'Biomechanics II',            term: 'Spring 2024', role: 'primary', enrolled: 46, responseRate: 55, avgRating: 3.4 },
  // Dr. Omar Hassan (f6) — Evidence-Based Practice, newer faculty
  { facultyId: 'f6',                 courseCode: 'DPT-801', courseName: 'Evidence-Based Practice',   term: 'Fall 2025',   role: 'primary', enrolled: 45, responseRate: 74, avgRating: 4.3 },
  { facultyId: 'f6',                 courseCode: 'DPT-801', courseName: 'Evidence-Based Practice',   term: 'Spring 2026', role: 'primary', enrolled: 50, responseRate: 68, avgRating: 4.4 },
]

/** Question-level scores for programmatic surveys (gen-s1 = collecting). */
export const MOCK_PROG_QUESTION_SCORES: Record<string, { questionId: string; text: string; avg: number; count: number; distribution: [number, number, number, number, number] }[]> = {
  'gen-s1': [
    { questionId: 'gq1', text: 'How well did the program prepare you for your career?',     avg: 4.1, count: 63, distribution: [ 2,  4, 10, 29, 18] },
    { questionId: 'gq2', text: 'How satisfied are you with the quality of instruction?',    avg: 3.8, count: 63, distribution: [ 3,  7, 14, 26, 13] },
    { questionId: 'gq3', text: 'How likely are you to recommend this program?',             avg: 4.3, count: 63, distribution: [ 1,  3,  7, 24, 28] },
  ],
}

// ── Generated question-level data + comments for EVERY evaluation ─────────────
// Hand-authored entries cover the deep-dive demos (s1/s3/s4). Every OTHER
// course evaluation WITH RESPONSES — live ones included (partial, mid-window
// data) — gets deterministic (hash-seeded, SSR-stable) question scores,
// section scores, student comments, AND open-text quotes per free-text
// question, so no evaluation ever renders an empty shell. Programmatic
// surveys get question scores below. Draft/scheduled stay empty — honest.
// Runs BEFORE the benchmark derivations below so program avgs include it.
{
  const FINISHED_GEN: SurveyStatus[] = ['pending_review', 'closed', 'released', 'active', 'collecting']
  const djb2 = (str: string) => {
    let h = 5381
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0
    return h
  }
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
  const distFor = (avg: number, count: number): [number, number, number, number, number] => {
    const w = [1, 2, 3, 4, 5].map(v => Math.max(0.02, 1 - Math.abs(v - avg) * 0.42))
    const t = w.reduce((a, b) => a + b, 0)
    const raw = w.map(x => (x / t) * count)
    const fl = raw.map(Math.floor)
    let rem = count - fl.reduce((a, b) => a + b, 0)
    raw
      .map((v, i) => ({ i, f: v - Math.floor(v) }))
      .sort((a, b) => b.f - a.f)
      .forEach(({ i }) => { if (rem > 0) { fl[i] += 1; rem -= 1 } })
    return fl as [number, number, number, number, number]
  }
  const COMMENT_POOL: ResponseComment[] = [
    { section: 'course_content',      text: 'The pacing felt rushed in the final weeks — hard to absorb the last two units.', sentiment: 'concern'  },
    { section: 'course_content',      text: 'Course materials and readings were well organized and easy to follow.',          sentiment: 'positive' },
    { section: 'course_content',      text: 'More worked examples before each assessment would help.',                        sentiment: 'concern'  },
    { section: 'course_content',      text: 'Lab resources were solid; the structure of each module made sense.',             sentiment: 'positive' },
    { section: 'faculty_performance', text: 'Very engaging lectures and responsive to questions.',                            sentiment: 'positive' },
    { section: 'faculty_performance', text: 'Office hours were hard to get into during exam weeks.',                          sentiment: 'concern'  },
    { section: 'faculty_performance', text: 'Approachable and organized — feedback on assignments was quick.',                sentiment: 'positive' },
    { section: 'faculty_performance', text: 'Clear communicator; would appreciate more clinical examples.',                   sentiment: 'neutral'  },
  ]
  const OT_POOL: { text: string; sentiment: 'positive' | 'neutral' | 'concern' }[] = [
    { text: 'Slow down the pacing before exams — the last unit felt rushed.',            sentiment: 'concern'  },
    { text: 'More worked examples in lab would make the material stick.',                sentiment: 'concern'  },
    { text: 'Keep the case-based sessions — easily the most useful part.',               sentiment: 'positive' },
    { text: 'The readings were well chosen and matched the lectures.',                   sentiment: 'positive' },
    { text: 'Consider recording sessions so we can review before assessments.',          sentiment: 'neutral'  },
    { text: 'Office hours earlier in the week would help before quizzes.',               sentiment: 'concern'  },
  ]
  for (const s of MOCK_SURVEYS) {
    if (s.surveyType === 'programmatic') continue
    if (!FINISHED_GEN.includes(s.status)) continue
    if (s.responseCount <= 0) continue
    const tpl = MOCK_TEMPLATES.find(t => t.id === s.templateId)
    const sections = tpl?.templateSections ?? []
    const seed = djb2(s.id)
    if (sections.length > 0 && !MOCK_SURVEY_QUESTION_DATA.some(d => d.surveyId === s.id)) {
      const base = 3.5 + (seed % 10) / 10 // 3.5..4.4
      const mkScores = (qs: TemplateQuestion[], bias: number): QuestionScore[] =>
        qs
          .filter(q => q.answerType === 'likert')
          .map(q => {
            const avg = clamp(
              Math.round((base + bias + ((djb2(s.id + q.id) % 9) - 4) / 10) * 10) / 10,
              2.8,
              4.9,
            )
            return { questionId: q.id, avg, count: s.responseCount, distribution: distFor(avg, s.responseCount) }
          })
      const sectionScores: Record<string, QuestionScore[]> = {}
      const freeTextCounts: Record<string, number> = {}
      for (const sec of sections) {
        if (!sec.roleSetId) sectionScores[sec.subjectKey] = mkScores(sec.questions, 0)
        // Open-text quotes per free-text question — the per-question "View
        // responses" sheet must be able to back every count it shows.
        for (const q of sec.questions) {
          if (q.answerType !== 'free_text') continue
          const n = Math.min(2 + (djb2(s.id + q.id) % 3), s.responseCount)
          for (let i = 0; i < n; i++) {
            const pick = OT_POOL[(djb2(s.id + q.id) + i * 5) % OT_POOL.length]
            MOCK_OPEN_TEXT_RESPONSES.push({
              id: `gen-ot-${s.id}-${q.id}-${i}`,
              surveyId: s.id,
              questionText: q.text,
              text: pick.text,
              sectionSubject: sec.subjectKey as SubjectKey,
              sentiment: pick.sentiment,
            })
          }
          freeTextCounts[q.id] = n
        }
      }
      const roleSections = sections.filter(sec => !!sec.roleSetId)
      MOCK_SURVEY_QUESTION_DATA.push({
        surveyId: s.id,
        sectionScores,
        instructorBlocks: s.instructors.map(i => ({
          instructorId: i.id,
          scores: roleSections.flatMap(sec => mkScores(sec.questions, 0.15)),
        })),
        freeTextCounts,
      })
    }
    const pickComments = (n: number) =>
      Array.from({ length: n }, (_, i) => COMMENT_POOL[(seed + i * 3) % COMMENT_POOL.length])
    const existing = MOCK_RESPONSES.find(r => r.surveyId === s.id)
    const qd = MOCK_SURVEY_QUESTION_DATA.find(d => d.surveyId === s.id)
    const avgOf = (xs?: QuestionScore[]) =>
      xs && xs.length > 0 ? Math.round((xs.reduce((a, q) => a + q.avg, 0) / xs.length) * 10) / 10 : 4.0
    if (!existing) {
      MOCK_RESPONSES.push({
        surveyId: s.id,
        sectionScores: [
          { section: 'course_content',      avg: avgOf(qd?.sectionScores['course_content']), count: s.responseCount },
          { section: 'faculty_performance', avg: avgOf(qd?.instructorBlocks?.[0]?.scores),    count: s.responseCount },
        ],
        comments: pickComments(3 + (seed % 3)),
      })
    } else if (existing.comments.length === 0) {
      existing.comments = pickComments(3 + (seed % 3))
    }
  }

  // Programmatic surveys with responses — question scores for the Programmatic
  // dashboard + detail (gen-s1 stays hand-authored; draft/scheduled stay empty).
  const PROG_QUESTIONS = [
    'How well did the program prepare you for your career?',
    'How satisfied are you with the quality of instruction?',
    'How likely are you to recommend this program?',
    'How effective were program resources and support services?',
  ]
  for (const s of MOCK_SURVEYS) {
    if (s.surveyType !== 'programmatic') continue
    if (s.responseCount <= 0) continue
    if (MOCK_PROG_QUESTION_SCORES[s.id]) continue
    const seed = djb2(s.id)
    MOCK_PROG_QUESTION_SCORES[s.id] = PROG_QUESTIONS.map((text, i) => {
      const avg = clamp(Math.round((3.6 + ((seed + i * 7) % 10) / 10) * 10) / 10, 3.2, 4.8)
      return {
        questionId: `gq-${s.id}-${i + 1}`,
        text,
        avg,
        count: s.responseCount,
        distribution: distFor(avg, s.responseCount),
      }
    })
  }
}

// ── Question benchmark derivations (median · program avg) ─────────────────────
// Both are DERIVED from the distributions above — never seeded — so they can't
// drift from the underlying response data.

/** The rating (1–5) at a given 1-based position in a distribution's cumulative order. */
function ratingAtPosition(distribution: readonly number[], position: number): number {
  let cumulative = 0
  for (let i = 0; i < distribution.length; i++) {
    cumulative += distribution[i]
    if (position <= cumulative) return i + 1
  }
  return distribution.length
}

/** Median rating derived from a 1–5 response distribution. Returns x.0 or x.5; 0 when empty. */
export function medianFromDistribution(distribution: [number, number, number, number, number]): number {
  const total = distribution.reduce((a, b) => a + b, 0)
  if (total === 0) return 0
  if (total % 2 === 1) return ratingAtPosition(distribution, (total + 1) / 2)
  return (ratingAtPosition(distribution, total / 2) + ratingAtPosition(distribution, total / 2 + 1)) / 2
}

/** Program-wide average for a question — response-weighted across every survey that asked it.
 *  Returns null when no survey has scored the question. */
export function programAvgForQuestion(questionId: string): number | null {
  let weightedSum = 0
  let responseTotal = 0
  for (const data of MOCK_SURVEY_QUESTION_DATA) {
    const scores = [
      ...Object.values(data.sectionScores).flat(),
      ...(data.instructorBlocks ?? []).flatMap(b => b.scores),
    ]
    for (const s of scores) {
      if (s.questionId === questionId) {
        weightedSum += s.avg * s.count
        responseTotal += s.count
      }
    }
  }
  return responseTotal > 0 ? Math.round((weightedSum / responseTotal) * 10) / 10 : null
}
