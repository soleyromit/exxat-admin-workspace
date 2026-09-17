export type SurveyStatus = 'draft' | 'active' | 'collecting' | 'scheduled' | 'pending_review' | 'released' | 'closed' | 'archived'
export type TemplateSection = 'course_content' | 'faculty_performance' | 'course_director'
export type UserRole = 'admin' | 'faculty'
export type SubjectKey = 'course_content' | 'faculty' | 'course_instructor' | 'course_coordinator' | 'teaching_assistant' | 'lab_instructor' | 'course_director' | 'preceptor' | 'clinical_supervisor'
export type SurveyType = 'course_evaluation' | 'programmatic'

// ── Evaluation types ──────────────────────────────────────────────────────────
// A single course offering is evaluated along MORE THAN ONE type at setup, and
// each type runs on its own clock — so one offering can show three different
// statuses at once (Romit, 2026-07-17). Order = the canonical setup order.
export type EvaluationType = 'course_material' | 'faculty_roles'
export const EVALUATION_TYPE_ORDER: EvaluationType[] = ['course_material', 'faculty_roles']
export const EVALUATION_TYPE_LABEL: Record<EvaluationType, string> = {
  /* "Course Content", not "Course" (2026-09-17 review: "rename course to
   * course content... in the dummy data") — the evaluation type is the
   * course's content, and the plain word collided with the course entity. */
  course_material: 'Course Content',
  faculty_roles:   'Faculty',
}
export const EVALUATION_TYPE_ICON: Record<EvaluationType, string> = {
  course_material: 'fa-book-open',
  faculty_roles:   'fa-chalkboard-user',
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

// Didactic (didactic) · Experiential (clinical) · Lab (seminar).
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
  /** ST-02 — Admin archived this template; treated identically to "no template
   *  assigned" for any course still holding it (blocks progress). Read through
   *  templateStoryStatusOf() (lib/pce-push-validation.ts); the existing
   *  `status: 'active'|'draft'` ("Approved"/"Draft" in the templates hub) is
   *  untouched. */
  archived?: boolean
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

/** Faculty roles eligible to be evaluated in a course evaluation. Mirrors Prism's
 *  role directory (~40 roles) — the Faculty Roles to Evaluate control (Settings)
 *  must scale to this list, per Monil (Aug 27): flat list, searchable, checkbox rows. */
export const EVAL_FACULTY_ROLES = [
  { id: 'course-coordinator',        label: 'Course Coordinator' },
  { id: 'instructor',                label: 'Instructor' },
  { id: 'teaching-assistant',        label: 'Teaching Assistant' },
  { id: 'lab-assistant',             label: 'Lab Assistant' },
  { id: 'guest-lecturer',            label: 'Guest Lecturer' },
  { id: 'clinical-instructor',       label: 'Clinical Instructor' },
  { id: 'preceptor',                 label: 'Preceptor' },
  { id: 'adjunct-faculty',           label: 'Adjunct Faculty' },
  { id: 'program-director',          label: 'Program Director' },
  { id: 'department-chair',          label: 'Department Chair' },
  { id: 'associate-professor',       label: 'Associate Professor' },
  { id: 'assistant-professor',       label: 'Assistant Professor' },
  { id: 'professor',                 label: 'Professor' },
  { id: 'clinical-coordinator',      label: 'Clinical Coordinator' },
  { id: 'site-coordinator',          label: 'Site Coordinator' },
  { id: 'simulation-lab-coordinator', label: 'Simulation Lab Coordinator' },
  { id: 'skills-lab-instructor',     label: 'Skills Lab Instructor' },
  { id: 'practicum-supervisor',      label: 'Practicum Supervisor' },
  { id: 'field-instructor',          label: 'Field Instructor' },
  { id: 'internship-coordinator',    label: 'Internship Coordinator' },
  { id: 'research-mentor',           label: 'Research Mentor' },
  { id: 'thesis-advisor',            label: 'Thesis Advisor' },
  { id: 'academic-advisor',          label: 'Academic Advisor' },
  { id: 'curriculum-coordinator',    label: 'Curriculum Coordinator' },
  { id: 'assessment-coordinator',    label: 'Assessment Coordinator' },
  { id: 'accreditation-liaison',     label: 'Accreditation Liaison' },
  { id: 'ipe-coordinator',           label: 'Interprofessional Education Coordinator' },
  { id: 'service-learning-coordinator', label: 'Service Learning Coordinator' },
  { id: 'simulation-technician',     label: 'Simulation Technician' },
  { id: 'sp-coordinator',            label: 'Standardized Patient Coordinator' },
  { id: 'skills-assessor',           label: 'Skills Assessor' },
  { id: 'osce-examiner',             label: 'OSCE Examiner' },
  { id: 'grand-rounds-facilitator',  label: 'Grand Rounds Facilitator' },
  { id: 'case-conference-leader',    label: 'Case Conference Leader' },
  { id: 'journal-club-facilitator',  label: 'Journal Club Facilitator' },
  { id: 'community-health-liaison',  label: 'Community Health Liaison' },
  { id: 'telehealth-supervisor',     label: 'Telehealth Supervisor' },
  { id: 'quality-improvement-mentor', label: 'Quality Improvement Mentor' },
  { id: 'peer-mentor-coordinator',   label: 'Peer Mentor Coordinator' },
  { id: 'honors-advisor',            label: 'Honors Program Advisor' },
  { id: 'capstone-advisor',          label: 'Capstone Project Advisor' },
] as const

/** Default selected faculty roles (all active teaching roles, TAs excluded by default). */
export const EVAL_DEFAULT_FACULTY_ROLE_IDS: string[] = ['course-coordinator', 'instructor']

/** One of the course-association roles a faculty member can be evaluated under. */
export type FacultyEvalRoleId = (typeof EVAL_FACULTY_ROLES)[number]['id']

/**
 * Synthesize the course-association role for a fixture faculty↔course pairing — the ONE
 * derivation shared by analytics (offering grain) and results (survey-instructor grain),
 * so the same person can never carry two different roles depending on the surface.
 *
 * The real system reads this off the Prism course association; the fixtures predate that
 * field. Until they are reconciled: the per-pairing `role: 'guest'` is authoritative (it IS
 * association-level data), and primary pairings fall back to the directory position as a
 * stand-in. Replace the fallback, not the callers, when real association data lands.
 * Vocabulary per 2026-05-19 (Monil): roles derive from course associations, not faculty rank.
 */
export function facultyEvalRole(pairingRole: 'primary' | 'guest', position?: string): FacultyEvalRoleId {
  /* Demo data evaluates exactly TWO roles — Course Coordinator and
   * Instructor — and nothing else (2026-09-17 review, Monil: "I only evaluate
   * course instructor and course coordinator. No other faculty roles,
   * replace all the other faculty roles with either instructor or course
   * coordinator"). The 'guest' pairing, lab and TA positions all resolve to
   * Instructor rather than to their own role ids. `EVAL_FACULTY_ROLES` keeps
   * the full Prism directory for the Settings control; this derivation is
   * what the fixtures actually surface. */
  if (pairingRole === 'guest') return 'instructor'
  switch (position) {
    case 'Department Chair':
    case 'Program Director':
    case 'Course Director':
    case 'Clinical Coordinator': return 'course-coordinator'
    default:                     return 'instructor'
  }
}

/** Display label for a survey instructor's course-association role —
 *  explicit `evalRole` when the pairing carries one, else derived through
 *  `facultyEvalRole` from the pairing + directory position. ONE label
 *  vocabulary for every surface ("Course Coordinator" / "Instructor"), never
 *  the pairing's own 'primary' / 'guest' words (2026-09-17 review). */
export function instructorEvalRoleLabel(inst: Pick<PceInstructor, 'id' | 'role' | 'evalRole'>): string {
  const id = inst.evalRole ?? facultyEvalRole(inst.role, MOCK_FACULTY.find((f) => f.id === inst.id)?.position)
  return EVAL_FACULTY_ROLES.find((r) => r.id === id)?.label ?? 'Instructor'
}

/** Benchmark targets used in analytics — source of truth for threshold lines on charts. */
export const EVAL_BENCHMARKS = {
  targetResponseRate: 70, // % — courses below this are flagged
  targetCourseScore:  4.0, // out of 5
  targetFacultyScore: 4.0, // out of 5
} as const

/** Default Likert scale configuration — single source read by template editor + analytics.
 *  `scores` are the flat point values assigned to each option (per Monil, Aug 27 — independent
 *  of label text/preset; students never see them, only admins configuring the scale). */
export const EVAL_DEFAULT_SCALE = {
  preset: 'agreement' as const,
  points: 5,
  labels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
  scores: [1, 2, 3, 4, 5],
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
      id: 'imp-course-standard', name: 'Course Evaluation · Standard.docx',
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
  /** Stock portrait (vendored under /public/portraits) — identity marker on
   *  score plots and avatar surfaces; initials remain the fallback. */
  avatarUrl?: string
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
  /** Explicit course-association role for THIS pairing. When set it wins over
   *  `facultyEvalRole(role, position)` — for datasets whose brief fixes the
   *  evaluatee structure (University of Nursing, Monil 2026-09-16: "Course +
   *  Instructor only… no other faculty role to be present in the data"), so a
   *  Department Chair teaching BSN-101 is evaluated as its Instructor, not
   *  re-labelled Course Coordinator by their directory position. */
  evalRole?: FacultyEvalRoleId
}

export interface PceSurvey {
  id: string
  courseCode: string
  courseName: string
  term: string
  /** Cohort = graduating class (e.g., "Class of 2027"). Per Aarti 2026-05-08 16:09 D3, the atomic unit for evaluation is course × term × cohort × faculty. */
  cohort?: string
  /** Per UC-14 + workspace ADR-002: Didactic (didactic) | Experiential (clinical) | Lab (seminar). Used for the course-type split filter on Cohort view (C5). */
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
  /** FK → course offering; multiple surveys may share it (split evaluations,
   *  one survey per evaluation type). */
  offeringId?: string
  /** 'course' | 'instructor' when the offering splits its surveys —
   *  lib/pce-results.ts reads both onto the derived EvalResult. */
  evalScope?: 'course' | 'instructor'
  /** Readiness criterion id ('instructor' / 'coordinator' / …) for instructor-
   *  scope flows created after the instance split. Duplicate detection keys on
   *  offering + THIS + person: the same person under a different role is a new
   *  combination, so role-less name matching can't tell them apart. Kept as a
   *  string to avoid a type import cycle with pce-course-readiness. */
  evalRole?: string
  instructors: PceInstructor[]
  responseRate: number
  responseCount: number
  enrollmentCount: number
  deadline: string
  createdAt: string
  releasedAt?: string
  closedAt?: string
  /** ST-02/ST-09 — Admin retired this survey via Archive. Read through
   *  storyStatusOf() (lib/pce-push-validation.ts), never directly: the raw
   *  `status` above is untouched, so existing badges/filters elsewhere are
   *  unaffected by this pass. */
  archivedAt?: string
  /** ST-02/ST-16 — Admin cancelled this Draft/Scheduled survey before it went
   *  live. Cancelled surveys are excluded from the role-overlap and
   *  Draft/Scheduled-resume checks entirely (they're no longer "on record"). */
  cancelledAt?: string
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
  /** Per-survey reminder cadence. Absent = the survey runs the program
   *  default (EVAL_REMINDER_CADENCE). Communication rules are per-survey —
   *  two flows may legitimately differ (Decisions/pce/2026-07-27). */
  reminderCadence?: { frequency: ReminderFrequency; anchor: ReminderAnchor; startDaysBefore: number }
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
  /** ST-02 Phase 3 — the push wizard's saved working state for THIS offering.
   *  Present on `status: 'draft'` surveys created by Save as Draft, and on
   *  Scheduled surveys re-saved after being pulled in for editing. Cleared
   *  when the wizard's final submit converts the record into a real push.
   *  Read/written ONLY by saveDraft()/pushSurveyBatch() (pce-state.tsx) and
   *  the resume hydration in app/(app)/surveys/push/page.tsx. */
  wizardDraft?: PceSurveyWizardDraft
}

/** ST-02 Phase 3 — everything the push wizard needs to reconstruct Step 2 +
 *  Step 3 for one offering. A wizard run spanning N offerings persists as N
 *  draft PceSurvey rows, each carrying its own slice of this state; the
 *  step-wide pieces (autoUpdateOn, window dates) are duplicated onto every
 *  row in the batch and read back from the first match on resume. */
export interface PceSurveyWizardDraft {
  /** The offering's slice of the page-owned UnitSelectionMap (keys all start
   *  `${offeringId}|` — see SurveyInstance.key in lib/pce-push-validation.ts).
   *  Values: 'selected' | 'deselected'; absence = the unit was never seen. */
  unitSelections: Record<string, 'selected' | 'deselected'>
  /** Step-wide ST-02 Auto Update flag at save time. */
  autoUpdateOn: boolean
  /** templateCriteria() of the assigned template AT SAVE TIME — Criterion ids
   *  kept as strings (same convention as evalRole: importing Criterion here
   *  would cycle with pce-course-readiness). Resume diffs this against the
   *  template's CURRENT criteria to raise the "template updated since this
   *  draft was saved" notice (pre-Live only; content freezes at Live). */
  templateCriteriaSnapshot: string[]
  /** Step 3 window/result-release values at save time (YYYY-MM-DD). */
  openDate?: string
  closeDate?: string
  releaseDate?: string
  /** YYYY-MM-DD of the last Save as Draft. */
  savedAt: string
}

export interface PriorOffering {
  term: string
  cohort?: string
  /** Course content avg, 1–5 scale. */
  courseAvg: number
  /** Faculty performance avg, 1–5 scale. */
  facultyAvg: number
  /** Response rate for that prior instance, 0–100. Optional — absent on most
   *  fixture rows today; the KPI strip's "change from previous instance"
   *  delta simply omits itself (like every other missing-comparator case on
   *  this page) rather than fabricating a number when this is undefined. */
  responseRate?: number
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
  /** Faculty member the comment is ABOUT (the subject, never the author —
   *  responses stay anonymous). Only meaningful on faculty_performance
   *  comments of multi-instructor offerings; unset there = not attributable
   *  to one instructor. Single-instructor offerings derive it. */
  facultyId?: string
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
  program: 'Bachelor of Science in Nursing',
}

export const MOCK_SUBJECTS: PceSubject[] = [
  {
    key: 'course_content',
    label: 'Course Content',
    description: 'Evaluates the course itself: structure, materials, objectives, workload.',
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
  { id: 'prog1', name: 'Bachelor of Science in Nursing', code: 'BSN' },
  { id: 'prog2', name: 'Master of Science in Nursing', code: 'MSN' },
  { id: 'prog3', name: 'Doctor of Pharmacy', code: 'PharmD' },
  { id: 'prog4', name: 'Physician Assistant Studies', code: 'PA' },
]

export const MOCK_OPEN_TEXT_RESPONSES: PceOpenTextResponse[] = [
  // mon2 — NURS-611 midpoint check-in (backs freeTextCounts.q11 = 6; the
  // per-question sheet must be able to show every response it counts)
  {
    id: 'otr-mon2-1',
    surveyId: 'mon2',
    questionText: 'Any concerns to share at the midpoint?',
    text: 'The peds caseload discussions are great, but office hours conflict with our clinical block on Thursdays.',
    sectionSubject: 'faculty',
    flagged: false,
    sentiment: 'concern',
  },
  {
    id: 'otr-mon2-2',
    surveyId: 'mon2',
    questionText: 'Any concerns to share at the midpoint?',
    text: 'No major concerns so far. Would appreciate the case write-up rubric a week earlier.',
    sectionSubject: 'faculty',
    flagged: false,
    sentiment: 'neutral',
  },
  {
    id: 'otr-mon2-3',
    surveyId: 'mon2',
    questionText: 'Any concerns to share at the midpoint?',
    text: 'The case discussions are the highlight. Real charts make the material stick.',
    sectionSubject: 'faculty',
    flagged: false,
    sentiment: 'positive',
  },
  {
    id: 'otr-mon2-4',
    surveyId: 'mon2',
    questionText: 'Any concerns to share at the midpoint?',
    text: 'Could we get feedback on the first case write-up before the second one is due?',
    sectionSubject: 'faculty',
    flagged: false,
    sentiment: 'concern',
  },
  {
    id: 'otr-mon2-5',
    surveyId: 'mon2',
    questionText: 'Any concerns to share at the midpoint?',
    text: 'Nothing blocking. The pediatric assessment simulation lab was excellent.',
    sectionSubject: 'faculty',
    flagged: false,
    sentiment: 'positive',
  },
  {
    id: 'otr-mon2-6',
    surveyId: 'mon2',
    questionText: 'Any concerns to share at the midpoint?',
    text: 'Recordings of the seminar sessions would help on clinical-rotation weeks.',
    sectionSubject: 'faculty',
    flagged: false,
    sentiment: 'neutral',
  },
  // mon1 — NURS-510 live (backs freeTextCounts q5/q8)
  {
    id: 'otr-mon1-1',
    surveyId: 'mon1',
    questionText: 'What would you take away from your experience in this course?',
    text: 'Spread the heavy readings out. The middle weeks stack up against the MSK labs.',
    sectionSubject: 'course_content',
    flagged: false,
    sentiment: 'concern',
  },
  {
    id: 'otr-mon1-2',
    surveyId: 'mon1',
    questionText: 'What would you take away from your experience in this course?',
    text: 'Keep the lab progression as is. Each session builds on the last one really well.',
    sectionSubject: 'course_content',
    flagged: false,
    sentiment: 'positive',
  },
  {
    id: 'otr-mon1-3',
    surveyId: 'mon1',
    questionText: 'What would you like to tell future students about this instructor?',
    text: 'The instructor explains palpation techniques clearly and checks in with every table.',
    sectionSubject: 'course_instructor',
    flagged: false,
    sentiment: 'positive',
  },
  {
    id: 'otr-mon1-4',
    surveyId: 'mon1',
    questionText: 'What would you like to tell future students about this instructor?',
    text: 'More practice time before the graded skills check would take the pressure off.',
    sectionSubject: 'course_instructor',
    flagged: false,
    sentiment: 'concern',
  },
  /* Added 2026-09-17 (Romit: "pick some of the responses from this document
   * and update the free-text, summary, charts") — sourced from a real
   * Marquette University PHTH 7504 course-evaluation report Romit shared
   * (~/Downloads/Spring 2025 MOCES PHTH 7504 1 (2).pdf), a genuine survey
   * with 32 course comments + 35 instructor comments at n=53. Reworded to
   * fit NURS-510's own question wording and de-identified — the source
   * names a real instructor and institution, neither of which belongs in
   * this product's demo data (same convention as the mon28 fix: "the
   * instructor," never a real or invented full name tied to a real person).
   * These widen mon1's free-text pool from 2→5 responses per question (see
   * `freeTextCounts` below) and their sentiment mix feeds the per-question
   * sentiment donut in `WrittenResponsesRow` — no separate chart edit
   * needed, it derives straight from these tags. */
  {
    id: 'otr-mon1-5',
    surveyId: 'mon1',
    questionText: 'What would you take away from your experience in this course?',
    text: 'Grading felt inconsistent between different graders on the skills check — a shared rubric would help.',
    sectionSubject: 'course_content',
    flagged: false,
    sentiment: 'concern',
  },
  {
    id: 'otr-mon1-6',
    surveyId: 'mon1',
    questionText: 'What would you take away from your experience in this course?',
    text: 'I wish we spent a little more time in class on documentation and charting requirements.',
    sectionSubject: 'course_content',
    flagged: false,
    sentiment: 'concern',
  },
  {
    id: 'otr-mon1-7',
    surveyId: 'mon1',
    questionText: 'What would you take away from your experience in this course?',
    text: 'The case studies during lecture were my favorite part of the course — more of those would be great.',
    sectionSubject: 'course_content',
    flagged: false,
    sentiment: 'positive',
  },
  {
    id: 'otr-mon1-8',
    surveyId: 'mon1',
    questionText: 'What would you like to tell future students about this instructor?',
    text: 'The instructor keeps a dense subject engaging and clearly knows the material inside out.',
    sectionSubject: 'course_instructor',
    flagged: false,
    sentiment: 'positive',
  },
  {
    id: 'otr-mon1-9',
    surveyId: 'mon1',
    questionText: 'What would you like to tell future students about this instructor?',
    text: 'Offered a retake after I struggled on an assessment and helped me understand what went wrong — really appreciated that.',
    sectionSubject: 'course_instructor',
    flagged: false,
    sentiment: 'positive',
  },
  {
    id: 'otr-mon1-10',
    surveyId: 'mon1',
    questionText: 'What would you like to tell future students about this instructor?',
    text: 'Explanations can run a little long at times — being more concise would help keep pace.',
    sectionSubject: 'course_instructor',
    flagged: false,
    sentiment: 'concern',
  },
  // s2 — backs freeTextCounts q5/q8
  {
    id: 'otr-s2-1',
    surveyId: 's2',
    questionText: 'What would you change about this course?',
    text: 'The weekly quizzes helped me keep up: more of the case-based questions please.',
    sectionSubject: 'course_content',
    flagged: false,
    sentiment: 'positive',
  },
  {
    id: 'otr-s2-2',
    surveyId: 's2',
    questionText: 'What would you change about this course?',
    text: 'Post the slide decks before lecture so we can annotate during class.',
    sectionSubject: 'course_content',
    flagged: false,
    sentiment: 'concern',
  },
  {
    id: 'otr-s2-3',
    surveyId: 's2',
    questionText: 'What feedback do you have for the instructor?',
    text: 'Feedback on assignments was specific and came back quickly.',
    sectionSubject: 'course_instructor',
    flagged: false,
    sentiment: 'positive',
  },
  {
    id: 'otr-s2-4',
    surveyId: 's2',
    questionText: 'What feedback do you have for the instructor?',
    text: 'Sometimes questions in the big lecture hall went unanswered. A follow-up thread would help.',
    sectionSubject: 'course_instructor',
    flagged: false,
    sentiment: 'neutral',
  },
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
    text: 'TAs were great but spread thin during peak times. More coverage would help.',
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
  // s3 (NURS-602, released) — feeds the post-release Qualitative Feedback view.
  {
    id: 'otr-s3-1',
    surveyId: 's3',
    questionText: 'What feedback do you have for the instructor?',
    text: 'Dr. Williams is an excellent communicator. Expectations were always clear.',
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
    text: 'Placement site coordination was smooth this year, a big improvement over what classmates described.',
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
  // s4 (NURS-504, closed) — smaller set, includes one moderated-out response.
  {
    id: 'otr-s4-1',
    surveyId: 's4',
    questionText: 'What would you change about this course?',
    text: 'Great course structure overall. The module order made the material build naturally.',
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

  /* ── mon28 — NURS-515 Pharmacology for Nurses · Summer 2026 · LEAD DEMO ──
     Backs MOCK_SURVEY_QUESTION_DATA.mon28.freeTextCounts exactly: q5 = 7 rows,
     q8 = 8 rows. Both the per-question "View responses" sheet and the
     per-question AI summary match on `questionText`, so these strings must stay
     character-identical to tmpl1's q5 / q8 wording. ─────────────────────── */
  {
    id: 'otr-mon28-q5-1',
    surveyId: 'mon28',
    questionText: 'What would you take away from your experience in this course?',
    text: 'Spread the cardiac and anticoagulant units out. Those two weeks carry most of the workload.',
    sectionSubject: 'course_content',
    flagged: false,
    sentiment: 'concern',
  },
  {
    id: 'otr-mon28-q5-2',
    surveyId: 'mon28',
    questionText: 'What would you take away from your experience in this course?',
    text: 'Keep the drug-class case studies. They are the reason the mechanisms stuck.',
    sectionSubject: 'course_content',
    flagged: false,
    sentiment: 'positive',
  },
  {
    id: 'otr-mon28-q5-3',
    surveyId: 'mon28',
    questionText: 'What would you take away from your experience in this course?',
    text: 'Return the dosage calculation practice sets before the unit exam, not after it.',
    sectionSubject: 'course_content',
    flagged: false,
    sentiment: 'concern',
  },
  {
    id: 'otr-mon28-q5-4',
    surveyId: 'mon28',
    questionText: 'What would you take away from your experience in this course?',
    text: 'A one-page summary sheet per drug class would make revision for the final far easier.',
    sectionSubject: 'course_content',
    flagged: false,
    sentiment: 'neutral',
  },
  {
    id: 'otr-mon28-q5-5',
    surveyId: 'mon28',
    questionText: 'What would you take away from your experience in this course?',
    text: 'More medication safety scenarios drawn from real charts, fewer textbook examples.',
    sectionSubject: 'course_content',
    flagged: false,
    sentiment: 'neutral',
  },
  {
    id: 'otr-mon28-q5-6',
    surveyId: 'mon28',
    questionText: 'What would you take away from your experience in this course?',
    text: 'Pairing this with pathophysiology worked well. I would keep the two courses in the same term.',
    sectionSubject: 'course_content',
    flagged: false,
    sentiment: 'positive',
  },
  {
    id: 'otr-mon28-q5-7',
    surveyId: 'mon28',
    questionText: 'What would you take away from your experience in this course?',
    text: 'Post the lecture slides before class so we can annotate during the session.',
    sectionSubject: 'course_content',
    flagged: false,
    sentiment: 'concern',
  },
  {
    id: 'otr-mon28-q8-1',
    surveyId: 'mon28',
    questionText: 'What would you like to tell future students about this instructor?',
    text: 'The instructor is clearly an expert, but the calculation examples go by too fast to follow.',
    sectionSubject: 'faculty',
    flagged: false,
    sentiment: 'concern',
  },
  {
    id: 'otr-mon28-q8-2',
    surveyId: 'mon28',
    questionText: 'What would you like to tell future students about this instructor?',
    text: 'The instructor is well prepared every session and the structure of the lectures is easy to follow.',
    sectionSubject: 'faculty',
    flagged: false,
    sentiment: 'positive',
  },
  {
    id: 'otr-mon28-q8-3',
    surveyId: 'mon28',
    questionText: 'What would you like to tell future students about this instructor?',
    text: 'Clearer expectations for the case write-up would help. The rubric came out late.',
    sectionSubject: 'faculty',
    flagged: false,
    sentiment: 'concern',
  },
  {
    id: 'otr-mon28-q8-4',
    surveyId: 'mon28',
    questionText: 'What would you like to tell future students about this instructor?',
    text: 'The instructor checks that we understand the adverse-effect profiles before moving on. That helps a lot.',
    sectionSubject: 'faculty',
    flagged: false,
    sentiment: 'positive',
  },
  {
    id: 'otr-mon28-q8-5',
    surveyId: 'mon28',
    questionText: 'What would you like to tell future students about this instructor?',
    text: 'The instructor gives specific feedback on every medication administration write-up. The most useful part of the course.',
    sectionSubject: 'faculty',
    flagged: false,
    sentiment: 'positive',
  },
  {
    id: 'otr-mon28-q8-6',
    surveyId: 'mon28',
    questionText: 'What would you like to tell future students about this instructor?',
    text: 'A short recap at the start of each session would connect the drug classes week to week.',
    sectionSubject: 'faculty',
    flagged: false,
    sentiment: 'neutral',
  },
  {
    id: 'otr-mon28-q8-7',
    surveyId: 'mon28',
    questionText: 'What would you like to tell future students about this instructor?',
    text: 'Grading felt inconsistent between the two sections on the same assignment.',
    sectionSubject: 'faculty',
    flagged: false,
    sentiment: 'concern',
  },
  {
    id: 'otr-mon28-q8-8',
    surveyId: 'mon28',
    questionText: 'What would you like to tell future students about this instructor?',
    text: 'Both instructors are approachable in office hours. No question was ever treated as too basic.',
    sectionSubject: 'faculty',
    flagged: false,
    sentiment: 'positive',
  },

  // ── University of Nursing demo account (BSN/MSN dummy-data scenario) ────
  { id: 'otr-uon-f1-1', surveyId: 'uon-f1', questionText: 'What would you take away from your experience in this course?', text: 'Give us the care-plan rubric earlier in the week instead of two days before it is due.', sectionSubject: 'course_content', sentiment: 'concern' },
  { id: 'otr-uon-f1-2', surveyId: 'uon-f1', questionText: 'What would you like to tell future students about this instructor?', text: 'Dr. Patel checks in with every table during skills lab and remembers where each of us struggled last time.', sectionSubject: 'faculty', sentiment: 'positive' },

  { id: 'otr-uon-f2-1', surveyId: 'uon-f2', questionText: 'What would you take away from your experience in this course?', text: 'Spread the systems review across two labs instead of cramming it into one.', sectionSubject: 'course_content', sentiment: 'concern' },
  { id: 'otr-uon-f2-2', surveyId: 'uon-f2', questionText: 'What would you like to tell future students about this instructor?', text: 'Dr. Kim is knowledgeable but could slow down during the cardiac auscultation demo.', sectionSubject: 'faculty', sentiment: 'concern' },

  { id: 'otr-uon-f3-1', surveyId: 'uon-f3', questionText: 'What would you take away from your experience in this course?', text: 'Update the slides, some of the terminology is from an older edition of the textbook.', sectionSubject: 'course_content', sentiment: 'concern' },
  { id: 'otr-uon-f3-2', surveyId: 'uon-f3', questionText: 'What would you like to tell future students about this instructor?', text: 'Dr. Williams knows the material cold, but please slow down during the harder mechanisms.', sectionSubject: 'faculty', sentiment: 'concern' },

  { id: 'otr-uon-f4-1', surveyId: 'uon-f4', questionText: 'What would you take away from your experience in this course?', text: 'Warn us further ahead before changing the exam format and grading rubric.', sectionSubject: 'course_content', sentiment: 'concern' },
  { id: 'otr-uon-f4-2', surveyId: 'uon-f4', questionText: 'What would you take away from your experience in this course?', text: 'Keep the case-based drug-class grouping, it is a huge improvement over memorizing lists.', sectionSubject: 'course_content', sentiment: 'positive' },
  { id: 'otr-uon-f4-3', surveyId: 'uon-f4', questionText: 'What would you like to tell future students about this instructor?', text: 'Dr. Chen is one of the most engaging lecturers in the program, but the office-hours crunch after the format change was rough.', sectionSubject: 'faculty', sentiment: 'concern' },
  { id: 'otr-uon-f4-4', surveyId: 'uon-f4', questionText: 'What would you like to tell future students about this instructor?', text: "Would not have made it through pharmacology without the instructor's antibiotics sessions.", sectionSubject: 'faculty', sentiment: 'positive' },

  { id: 'otr-uon-f5-1', surveyId: 'uon-f5', questionText: 'What would you take away from your experience in this course?', text: 'Give the wound-care lab a full session instead of splitting it.', sectionSubject: 'course_content', sentiment: 'concern' },
  { id: 'otr-uon-f5-2', surveyId: 'uon-f5', questionText: 'What would you like to tell future students about this instructor?', text: "Dr. Patel's feedback on write-ups is detailed and comes back fast.", sectionSubject: 'faculty', sentiment: 'positive' },

  { id: 'otr-uon-f6-1', surveyId: 'uon-f6', questionText: 'What would you take away from your experience in this course?', text: 'Add a second office-hour slot that does not overlap with clinical.', sectionSubject: 'course_content', sentiment: 'concern' },
  { id: 'otr-uon-f6-2', surveyId: 'uon-f6', questionText: 'What would you like to tell future students about this instructor?', text: 'Dr. Gomez is engaging in lecture, the newborn assessment simulation was great.', sectionSubject: 'faculty', sentiment: 'positive' },

  { id: 'otr-uon-f7-1', surveyId: 'uon-f7', questionText: 'What would you take away from your experience in this course?', text: 'Slow down the growth-and-development unit until after our first peds clinical day.', sectionSubject: 'course_content', sentiment: 'concern' },
  { id: 'otr-uon-f7-2', surveyId: 'uon-f7', questionText: 'What would you like to tell future students about this instructor?', text: 'Dr. Williams is well organized, more worked dosage examples would help.', sectionSubject: 'faculty', sentiment: 'neutral' },

  { id: 'otr-uon-f8-1', surveyId: 'uon-f8', questionText: 'What would you take away from your experience in this course?', text: 'Genuinely cannot think of anything to change, maybe one more simulation day before the first shift.', sectionSubject: 'course_content', sentiment: 'neutral' },
  { id: 'otr-uon-f8-2', surveyId: 'uon-f8', questionText: 'What would you like to tell future students about this instructor?', text: 'Dr. Hassan and Dr. Kim make an incredible clinical team, approachable, available, and clearly invested in every student.', sectionSubject: 'faculty', sentiment: 'positive' },

  { id: 'otr-uon-f9-1', surveyId: 'uon-f9', questionText: 'What would you take away from your experience in this course?', text: 'Give personality disorders the same amount of time as mood disorders.', sectionSubject: 'course_content', sentiment: 'concern' },
  { id: 'otr-uon-f9-2', surveyId: 'uon-f9', questionText: 'What would you like to tell future students about this instructor?', text: 'Dr. Chen is engaging in discussion, feedback turnaround on process recordings could be faster.', sectionSubject: 'faculty', sentiment: 'concern' },

  { id: 'otr-uon-f10-1', surveyId: 'uon-f10', questionText: 'What would you take away from your experience in this course?', text: "Slow the pace down or split this into two courses, it's a lot for one term.", sectionSubject: 'course_content', sentiment: 'concern' },
  { id: 'otr-uon-f10-2', surveyId: 'uon-f10', questionText: 'What would you like to tell future students about this instructor?', text: "Dr. Williams's expertise is obvious, more worked examples before graded work would help.", sectionSubject: 'faculty', sentiment: 'neutral' },

  { id: 'otr-uon-s1-1', surveyId: 'uon-s1', questionText: 'What would you take away from your experience in this course?', text: 'Some of the assigned readings are outdated and reference equipment we do not use anymore.', sectionSubject: 'course_content', sentiment: 'concern' },
  { id: 'otr-uon-s1-2', surveyId: 'uon-s1', questionText: 'What would you like to tell future students about this instructor?', text: 'Very approachable, answers emails quickly.', sectionSubject: 'faculty', sentiment: 'positive' },

  { id: 'otr-uon-s2-1', surveyId: 'uon-s2', questionText: 'What would you take away from your experience in this course?', text: 'Give us a difficulty-matched practice exam, not just easy quizzes.', sectionSubject: 'course_content', sentiment: 'concern' },
  { id: 'otr-uon-s2-2', surveyId: 'uon-s2', questionText: 'What would you like to tell future students about this instructor?', text: 'More structure to the lecture sequence would help a lot.', sectionSubject: 'faculty', sentiment: 'concern' },

  { id: 'otr-uon-s3-1', surveyId: 'uon-s3', questionText: 'What would you take away from your experience in this course?', text: 'Add a practice exam at the new difficulty level before the real one.', sectionSubject: 'course_content', sentiment: 'concern' },
  { id: 'otr-uon-s3-2', surveyId: 'uon-s3', questionText: 'What would you like to tell future students about this instructor?', text: 'The structure by mechanism instead of by drug name made studying way more efficient.', sectionSubject: 'faculty', sentiment: 'positive' },

  { id: 'otr-uon-s4-1', surveyId: 'uon-s4', questionText: 'What would you take away from your experience in this course?', text: 'Compress the wound-care lab less, it was hard to keep up in eight weeks.', sectionSubject: 'course_content', sentiment: 'concern' },
  { id: 'otr-uon-s4-2', surveyId: 'uon-s4', questionText: 'What would you like to tell future students about this instructor?', text: 'Dr. Gomez replied to emails within a day even during the compressed schedule.', sectionSubject: 'faculty', sentiment: 'positive' },

  { id: 'otr-uon-s5-1', surveyId: 'uon-s5', questionText: 'What would you take away from your experience in this course?', text: 'Nothing major, maybe post office hours further in advance.', sectionSubject: 'course_content', sentiment: 'neutral' },
  { id: 'otr-uon-s5-2', surveyId: 'uon-s5', questionText: 'What would you like to tell future students about this instructor?', text: 'Dr. Hassan turns office hours into real case-consult sessions, extremely valuable for a small cohort.', sectionSubject: 'faculty', sentiment: 'positive' },
]

/* ── per-question AI summaries ────────────────────────────────────────────────
   Hand-authored stand-ins for the summariser the results page would call in
   production, keyed `${surveyId}:${questionId}`. Each string is a synthesis of
   the ACTUAL response strings above for that question — nothing is asserted
   here that the underlying responses don't say. Questions without an entry get
   a derived summary (counts + clustered themes + a representative quote) at
   render time, so the surface never shows an empty Summary block. */
/* 2026-09-17: reframed from "what would you change" phrasing to match the
 * new question wording (Vishal's Harvard-form prompts, swapped in on
 * `tmpl1`'s q5/q8 — "What would you take away from your experience..." /
 * "What would you like to tell future students..."). Same underlying signal
 * from the same response set, just narrated as a takeaway/heads-up rather
 * than a change-request — nothing asserted here that the responses (above,
 * in `MOCK_OPEN_TEXT_RESPONSES`) don't say. */
/** Hand-authored 2-sentence AI Insights per EVALUATEE (Monil's University of
 *  Nursing data brief, 2026-09-16: "Generate a 2-sentence AI Insights summary
 *  summarizing the feedback" for each evaluatee). Keyed `surveyId` for the
 *  course scope and `surveyId:facultyId` for one instructor's scope — the
 *  results page's Summary card reads this first and falls back to its
 *  derived, number-templated prose when a key is absent (every non-UoN
 *  record today). Keep each entry to two sentences and grounded in the
 *  record's own MOCK_RESPONSES / question data — no claims the numbers and
 *  comments do not back. */
export const MOCK_SCOPE_AI_SUMMARY: Record<string, string> = {
  // ── University of Nursing · Fall 2026 ─────────────────────────────────
  'uon-f1': 'Fundamentals of Nursing I is one of the strongest-rated courses this term (4.3 of 5) on an unusually high 91% response rate, with students crediting the skills-lab structure and the approachability of the teaching. The one recurring ask is trimming the reading load where it repeats what the lab already covers.',
  'uon-f1:f1': 'Students describe Dr. Patel as organized and approachable, checking in with every table during skills lab and remembering where each student struggled last time. No instructor-specific concerns surfaced; the pacing comments in this survey are about the course calendar, not her teaching.',
  'uon-f2': 'Health Assessment is underperforming at 3.2 of 5 with a 59% response rate, and the written feedback is mostly constructive: the pace of the head-to-toe sequence, thin lab resources and crowded office hours all come up. Exam feedback is split, with some students finding the practical check-offs fair and others finding them far harder than the practice sessions.',
  'uon-f2:f4': 'Dr. Kim is rated 3.6 of 5 here, with students praising his one-on-one help after class while asking for a slower pace through the assessment sequence. Crowded office hours before check-offs are the most repeated instructor-level request.',
  'uon-f3': 'Pathophysiology is the lowest-rated course this term at 2.8 of 5, continuing a four-term decline, on a 31% response rate that limits how much weight the written feedback can carry. Concerns concentrate on exam difficulty and outdated materials, with pacing feedback split between too fast and about right.',
  'uon-f3:f3': 'Dr. Williams is scored 3.1 of 5 on this section, with students describing her as responsive on email and invested in their passing even while the course itself frustrates them. Instructor-specific asks centre on slowing the pace through the cellular-injury and fluid-balance units.',
  'uon-f4': 'Pharmacology for Nurses is the most polarised course in the program this term: responses split almost evenly between Strongly Disagree and Strongly Agree with virtually nothing in between, averaging 3.2 of 5 on a 78% response rate. The new case-based, mechanism-first format is the dividing line, praised by half the cohort as the best pharmacology teaching they have had and blamed by the other half for a sudden jump in exam difficulty.',
  'uon-f4:f2': 'Dr. Chen\'s ratings mirror the course split, with students who thrived on the new format calling him engaging and his drug-classification framework clarifying, while others report the cardiac and renal units moved too fast and office hours were impossible to get into before the exam. The disagreement is about the format change, not his subject knowledge, which even critical comments acknowledge.',
  'uon-f4:f5': 'Dr. Gomez is rated highly across the cohort regardless of how students felt about the course format, with her antibiotic stewardship unit repeatedly named as the most organized and engaging part of the semester. Several students asked for more of the course to run the way her sessions did.',
  'uon-f5': 'Medical-Surgical Nursing I scores 4.2 of 5 on a 91% response rate, with realistic case studies and clinical preparation the clearest strengths. The main constructive thread is the wound-care skills lab feeling rushed, with students getting through only half the stations.',
  'uon-f5:f1': 'Dr. Patel is rated 4.4 of 5, with students describing her feedback on care plans as specific and her office hours as genuinely available. Instructor-level comments are consistently positive; the pacing concern in this survey is about lab time, not her sessions.',
  'uon-f6': 'Maternal-Newborn Nursing rates 3.8 of 5 but on only an 11-of-36 response rate (31%), so the picture is indicative rather than conclusive. Students praise the simulation-based assessments and the instructor\'s engagement while asking for more accessible office hours and more current reading material.',
  'uon-f6:f5': 'Dr. Gomez is rated 4.0 of 5 here, with students calling her labor-and-delivery simulations engaging and well run. The recurring ask is more office-hour availability during the clinical weeks when questions pile up.',
  'uon-f7': 'Pediatric Nursing rates 3.6 of 5 on the lowest response rate of the term (23%, 9 of 40), so these signals should be read cautiously. Students who did respond credit the weekly structure and the instructor\'s explanations while flagging exam difficulty and a second half that moved too fast.',
  'uon-f7:f3': 'Dr. Williams is rated 3.9 of 5 in this section, praised for making growth-and-development milestones memorable and for engaging delivery. The one instructor-level request is a steadier pace once the course moves into acute pediatric conditions.',
  'uon-f8': 'Clinical Practicum I is the standout course of the term at 4.8 of 5 with a 94% response rate, and the written feedback is almost uniformly positive about the shift debriefs, the prep packets and both instructors\' availability on the floor. The only constructive notes are a fast first two shifts for students new to med-surg and a reading list that could be trimmed.',
  'uon-f8:f4': 'Dr. Kim is rated 4.9 of 5, with students highlighting that he debriefs every shift and is available whenever a patient situation gets tense. No instructor-specific concerns were raised.',
  'uon-f8:f6': 'Dr. Hassan is rated 4.9 of 5, described as calm, organized and consistently helpful at the bedside. Students single out his skills-lab preparation as the reason the first shifts felt manageable.',
  'uon-f9': 'Psychiatric-Mental Health Nursing rates 3.4 of 5 on a 42% response rate, with students valuing the instructor\'s engagement and the case materials while finding the exams far more detailed than the scenarios practiced in class. Pacing feedback is mixed, with the therapeutic-communication weeks described as either well paced or too compressed.',
  'uon-f9:f2': 'Dr. Chen is rated 3.7 of 5 in this course, credited with engaging discussion of de-escalation and therapeutic communication. The instructor-level ask is closer alignment between what is practiced in class and what the exams test.',
  'uon-f10': 'Advanced Pathophysiology (MSN) rates 3.7 of 5 but only 8 of 30 students responded (27%), so treat the feedback as directional. Respondents value the case-conference worked examples and the instructor\'s thoroughness while flagging a heavy exam load and a fast pace through the evening blocks.',
  'uon-f10:f3': 'Dr. Williams is rated 4.1 of 5 by the MSN cohort, praised for staying engaging through three-hour evening sessions and answering questions thoroughly. The single constructive thread is the pace of the renal and endocrine units.',
  // ── University of Nursing · Summer 2026 (last closed term) ────────────
  'uon-s1': 'The Summer 2026 run of Fundamentals of Nursing I rated 4.3 of 5 on a 90% response rate, with the compressed pacing and the skills-lab structure both praised. The one recurring ask was broader office-hour coverage than the single Tuesday slot the summer schedule allowed.',
  'uon-s1:f1': 'Dr. Patel was rated 4.4 of 5, with students describing her as organized and clear about what each week expected. Instructor-level feedback was uniformly positive.',
  'uon-s2': 'The summer Pathophysiology section rated 3.3 of 5 on a 42% response rate, with exam difficulty and outdated readings the main concerns. Students split on the teaching itself, praising the instructor\'s help after sessions while finding the lectures dense.',
  'uon-s2:f3': 'Dr. Williams was rated 3.6 of 5, credited with staying after every session to walk through missed cases. The constructive thread is lecture density in a six-week format rather than her availability.',
  'uon-s3': 'The summer Pharmacology section rated 4.1 of 5 on an 88% response rate, well ahead of the polarised Fall run, with the antibiotic unit\'s pacing and the instructor\'s office hours both praised. Constructive notes point to outdated brand names in the drug-card packets and a fast cardiac unit.',
  'uon-s3:f2': 'Dr. Chen was rated 4.3 of 5 in the summer section, with students valuing his accessible office hours and clear mechanism-first framework. The one pacing concern was specific to the cardiac drug unit.',
  'uon-s4': 'The summer Medical-Surgical Nursing I section rated 3.9 of 5 but on a 29% response rate (10 of 35), so the signal is thin. Respondents praised the practice quizzes and the instructor\'s approachability while raising pace, materials and exam-weighting concerns typical of a compressed term.',
  'uon-s4:f5': 'Dr. Gomez was rated 4.1 of 5, described as approachable and responsive even on the compressed summer schedule. Instructor-level comments were positive; the course-level concerns are about the six-week format.',
  'uon-s5': 'The summer Advanced Pathophysiology (MSN) section rated 4.4 of 5 on a 93% response rate, with pacing, materials and the instructor\'s engagement all praised. The constructive notes are a 50% final-exam weighting that felt heavy for six weeks and some reading that overlapped with lecture.',
  'uon-s5:f6': 'Dr. Hassan was rated 4.5 of 5 by the MSN cohort, praised as organized, engaging and readily available. No instructor-specific concerns were raised.',
}

export const MOCK_QUESTION_AI_SUMMARY: Record<string, string> = {
  'mon28:q5':
    "What stands out from students' experience is mostly pacing and timing rather than content: the cardiac and anticoagulant units stack too close together, the dosage calculation practice sets land after the unit exam instead of before it, and slides sometimes post after class instead of ahead of it. What they'd tell a future student to expect and value is the drug-class case studies and running this course alongside pathophysiology in the same term.",
  'mon28:q8':
    "What students would tell future students about these instructors: both are well prepared and approachable, and checking understanding of adverse-effect profiles before moving on plus specific feedback on every medication administration write-up stood out as especially useful. The heads-up they'd give: calculation examples move fast, the case write-up rubric can arrive late, and grading has felt inconsistent between sections on the same assignment — so ask questions early and keep pace.",
  'mon1:q5':
    "What stands out from students' experience is mostly pacing and structure rather than content: the heavier reading weeks stack against the MSK labs, grading on the skills check felt inconsistent across graders, and a few wanted more class time on documentation and charting requirements. What they'd tell a future student to expect and value is the lab progression and the lecture case studies — several call those out as the strongest part of the course.",
  'mon1:q8':
    "What students would tell future students about this instructor: clear, engaging, and willing to go the extra mile — checking in with every table during labs and offering a retake after a rough assessment rather than letting a bad grade stand. The one heads-up they'd give: the pace picks up before graded skills checks, so ask for practice time early.",
}

export const MOCK_TEMPLATES: PceTemplate[] = [
  {
    id: 'tmpl1',
    programId: 'prog1',
    name: 'End-of-Term Evaluation',
    sections: ['course_content', 'faculty_performance'],
    status: 'active',
    questionCount: 14,
    usedBySurveyCount: 3,
    lastModified: 'Apr 10, 2026',
    createdBy: 'Dr. Thompson',
    likertPointer: 5,
    courseType: 'any',
    surveyType: 'course_evaluation',
    questions: {
      course_content: [
        { id: 'q1', text: 'Evaluate the course overall.', answerType: 'likert', order: 0 },
        { id: 'q2', text: 'Course materials (readings, audio-visual materials, textbooks, lab manuals, website, etc.)', answerType: 'likert', order: 1 },
        { id: 'q3', text: 'Assignments (exams, essays, problem sets, language homework, etc.)', answerType: 'likert', order: 2 },
        { id: 'q4', text: 'Feedback you received on work you produced in this course', answerType: 'likert', order: 3 },
        { id: 'q12', text: 'Section component of the course', answerType: 'likert', order: 4 },
        { id: 'q13', text: 'How difficult did you find this course?', answerType: 'likert', order: 5 },
        { id: 'q5', text: 'What would you take away from your experience in this course?', answerType: 'free_text', order: 6 },
      ],
      faculty_performance: [
        // 4 Likert per faculty section (Monil/Vishal transcript, 2026-09-16:
        // "4 questions per section") — q18–q23 added 2026-09-16 to bring
        // Teaching Effectiveness / Communication / Assessment Practices from
        // 2 to 4 each. Keep this flat list and `templateSections` below in sync.
        { id: 'q6', text: 'Evaluate your Instructor overall.', answerType: 'likert', order: 0 },
        { id: 'q15', text: 'Gives effective lectures or presentations, if applicable', answerType: 'likert', order: 1 },
        { id: 'q18', text: 'Explains difficult concepts clearly', answerType: 'likert', order: 2 },
        { id: 'q19', text: 'Uses class time effectively', answerType: 'likert', order: 3 },
        { id: 'q7', text: 'Is accessible outside of class (including after class, office hours, e-mail, etc.)', answerType: 'likert', order: 4 },
        { id: 'q16', text: 'Generates enthusiasm for the subject matter', answerType: 'likert', order: 5 },
        { id: 'q20', text: 'Communicates expectations and deadlines clearly', answerType: 'likert', order: 6 },
        { id: 'q21', text: 'Responds to questions respectfully and thoroughly', answerType: 'likert', order: 7 },
        { id: 'q14', text: 'Gives useful feedback on assignments', answerType: 'likert', order: 8 },
        { id: 'q17', text: 'Returns assignments in a timely fashion', answerType: 'likert', order: 9 },
        { id: 'q22', text: 'Assessments reflect what was actually taught', answerType: 'likert', order: 10 },
        { id: 'q23', text: 'Grading criteria are clear and applied consistently', answerType: 'likert', order: 11 },
        { id: 'q8', text: 'What would you like to tell future students about this instructor?', answerType: 'free_text', order: 12 },
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
          { id: 'q1', text: 'Evaluate the course overall.', answerType: 'likert', order: 0 },
          { id: 'q2', text: 'Course materials (readings, audio-visual materials, textbooks, lab manuals, website, etc.)', answerType: 'likert', order: 1 },
          { id: 'q3', text: 'Assignments (exams, essays, problem sets, language homework, etc.)', answerType: 'likert', order: 2 },
          { id: 'q4', text: 'Feedback you received on work you produced in this course', answerType: 'likert', order: 3 },
          { id: 'q12', text: 'Section component of the course', answerType: 'likert', order: 4 },
          { id: 'q13', text: 'How difficult did you find this course?', answerType: 'likert', order: 5 },
          { id: 'q5', text: 'What would you take away from your experience in this course?', answerType: 'free_text', order: 6 },
        ],
      },
      /* Faculty aspect split into three topical sections (stakeholder bar,
       * 2026-09-16: a lead demo evaluation shows 2–3 faculty sections, not one
       * undifferentiated "Faculty Performance" block). All three keep
       * subjectKey 'faculty' and roleSetId 'rs1-a' — the subject is still the
       * same person under the same role set; only the TOPIC differs. Keeping
       * the key means every subjectKey consumer (preview, evaluation card,
       * course readiness, report access) behaves exactly as before, and
       * per-instructor scores still resolve by questionId through
       * `instructorBlocks`, so surveys with hand-authored question data that
       * predate the split (mon1, s1, s3, s4, s5) are unaffected. */
      {
        id: 'ts1-2',
        subjectKey: 'faculty',
        title: 'Teaching Effectiveness',
        order: 1,
        roleSetId: 'rs1-a',
        questions: [
          { id: 'q6', text: 'Evaluate your Instructor overall.', answerType: 'likert', order: 0 },
          { id: 'q15', text: 'Gives effective lectures or presentations, if applicable', answerType: 'likert', order: 1 },
          { id: 'q18', text: 'Explains difficult concepts clearly', answerType: 'likert', order: 2 },
          { id: 'q19', text: 'Uses class time effectively', answerType: 'likert', order: 3 },
        ],
      },
      {
        id: 'ts1-3',
        subjectKey: 'faculty',
        title: 'Communication',
        order: 2,
        roleSetId: 'rs1-a',
        questions: [
          { id: 'q7', text: 'Is accessible outside of class (including after class, office hours, e-mail, etc.)', answerType: 'likert', order: 0 },
          { id: 'q16', text: 'Generates enthusiasm for the subject matter', answerType: 'likert', order: 1 },
          { id: 'q20', text: 'Communicates expectations and deadlines clearly', answerType: 'likert', order: 2 },
          { id: 'q21', text: 'Responds to questions respectfully and thoroughly', answerType: 'likert', order: 3 },
        ],
      },
      {
        id: 'ts1-4',
        subjectKey: 'faculty',
        title: 'Assessment Practices',
        order: 3,
        roleSetId: 'rs1-a',
        questions: [
          { id: 'q14', text: 'Gives useful feedback on assignments', answerType: 'likert', order: 0 },
          { id: 'q17', text: 'Returns assignments in a timely fashion', answerType: 'likert', order: 1 },
          { id: 'q22', text: 'Assessments reflect what was actually taught', answerType: 'likert', order: 2 },
          { id: 'q23', text: 'Grading criteria are clear and applied consistently', answerType: 'likert', order: 3 },
          { id: 'q8', text: 'What would you like to tell future students about this instructor?', answerType: 'free_text', order: 4 },
        ],
      },
    ],
    facultyRoleSets: [
      // Instructor + coordinator: end-of-term evals cover both in practice,
      // and this makes the DEFAULT wizard state exercise the multi-role
      // Evaluates count and the multi-person Faculty cell.
      { id: 'rs1-a', roles: ['instructor', 'course-coordinator'] },
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
  /* Portraits vendored to /public/portraits (UX-audit I1: external hosts
     flake mid-demo; the fallback initials appearing in a review capture was
     exactly that failure). */
  patel:    { id: 'f1', name: 'Dr. Anita Patel',    initials: 'AP', role: 'primary', avatarUrl: '/portraits/anita-patel.jpg' },
  chen:     { id: 'f2', name: 'Dr. Kevin Chen',     initials: 'KC', role: 'guest',   avatarUrl: '/portraits/kevin-chen.jpg' },
  williams: { id: 'f3', name: 'Dr. Maria Williams', initials: 'MW', role: 'primary', avatarUrl: '/portraits/maria-williams.jpg' },
  kim:      { id: 'f4', name: 'Dr. James Kim',      initials: 'JK', role: 'primary', avatarUrl: '/portraits/james-kim.jpg' },
  gomez:    { id: 'f5', name: 'Dr. Rachel Gomez',   initials: 'RG', role: 'primary', avatarUrl: '/portraits/rachel-gomez.jpg' },
  hassan:   { id: 'f6', name: 'Dr. Omar Hassan',    initials: 'OH', role: 'primary', avatarUrl: '/portraits/omar-hassan.jpg' },
}

/** Legacy composite-key lookup (`courseCode-term` → ONE survey). Split flows
 *  (several surveys sharing an offering) collide on that key, and plain Map
 *  construction silently keeps whichever seed comes LAST. The representative
 *  is the flow that OPENS first — the one a student meets first — so pick by
 *  openDate instead of array order. */
export function representativeSurveyByKey(surveys: PceSurvey[]): Map<string, PceSurvey> {
  const m = new Map<string, PceSurvey>()
  for (const s of surveys) {
    const k = `${s.courseCode}-${s.term}`
    const prev = m.get(k)
    if (!prev || (s.openDate ?? '9999') < (prev.openDate ?? '9999')) m.set(k, s)
  }
  return m
}

export const MOCK_SURVEYS: PceSurvey[] = [
  {
    id: 's1',
    courseCode: 'NURS-501',
    courseName: 'Human Anatomy & Physiology',
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
          { text: 'Refresh the physiology reading packet links', priority: 'medium' },
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
    courseCode: 'NURS-601',
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
    courseCode: 'NURS-602',
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
    courseCode: 'NURS-504',
    courseName: 'Health Assessment',
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
    courseCode: 'NURS-502',
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
    courseCode: 'NURS-520',
    courseName: 'Neurological Nursing',
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
    // 2026-08-13 — offeringId added: this record had none, so the push
    // wizard's resume link (`/surveys/push?...&offerings=${offeringId}`)
    // had nothing to point at. co7 is NURS-511 in Spring 2026 (pt1) — see
    // MOCK_COURSE_OFFERINGS.
    id: 's7',
    courseCode: 'NURS-511',
    courseName: 'Medical-Surgical Nursing II',
    term: 'Spring 2026',
    cohort: 'Class of 2027',
    courseType: 'didactic',
    templateId: 'tmpl1',
    status: 'draft',
    offeringId: 'co7',
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
    courseCode: 'Alumni Outcomes Survey · Class of 2025',
    courseName: '',
    term: 'Spring 2026',
    templateId: 'tmpl-gen1',
    status: 'collecting' as SurveyStatus,
    instructors: [],
    responseRate: 90,
    responseCount: 135,
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
    courseCode: 'Preceptor Satisfaction Survey · Spring 2026',
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
    courseCode: 'Program Exit Survey · Spring 2026',
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
  //
  //    MOCK_CURRENT_USER (Dr. Patel, f1) is deliberately seeded onto Spring 2026
  //    courses in BOTH course roles, so the faculty view demonstrates the RBAC
  //    split rather than asserting it: coordinator ('primary') on mon1 → may
  //    extend the close date; instructor ('guest') on mon6 → may not. Without
  //    this she taught no LIVE course and the faculty home had no live group at
  //    all. Co-taught offerings are the norm, and guest instructors were an
  //    explicit design topic (Apr 21), so this is realistic, not a fixture hack.
  /* Second instructor is Gomez (f5, position 'Core Faculty' → "Instructor"),
   * NOT Kim — Kim's own directory `position` ('Clinical Coordinator')
   * resolves through facultyEvalRole() to "Course Coordinator" the same as
   * Patel, so pairing him here read as TWO course coordinators once his
   * `role: 'guest'` override (which rendered "Guest Lecturer") was found to
   * violate 2026-09-16's explicit "no guest lecturer, so instructor and
   * coordinator or 2 instructors." Gomez as a plain 'primary' pairing gives
   * the exact "coordinator + instructor" shape asked for, without touching
   * Kim's shared directory `position` (used by every other survey he's on)
   * to force a different label. Swapped 2026-09-17 during a full
   * requirements re-check against the raw meeting transcript. */
  { id: 'mon1',  courseCode: 'NURS-510', courseName: 'Medical-Surgical Nursing I', term: 'Spring 2026', cohort: 'Class of 2027', courseType: 'didactic', templateId: 'tmpl1', status: 'collecting', instructors: [INSTRUCTORS.patel, INSTRUCTORS.gomez], responseRate: 38, responseCount: 23, enrollmentCount: 60, deadline: 'Aug 21, 2026', createdAt: 'Jan 15, 2026', createdBy: 'Dr. Anita Patel', lastReminderSentAt: '2026-08-15', nextScheduledReminderAt: '2026-08-20', surveyType: 'course_evaluation', openDate: '2026-06-16', academicYear: '2025–2026', programId: 'prog1' },
  { id: 'mon2',  courseCode: 'NURS-611', courseName: 'Pediatric Nursing',          term: 'Spring 2026', cohort: 'Class of 2026', courseType: 'clinical', templateId: 'tmpl2', status: 'collecting', instructors: [INSTRUCTORS.gomez],    responseRate: 90, responseCount: 36, enrollmentCount: 40, deadline: 'Aug 20, 2026', createdAt: 'Jan 15, 2026', lastReminderSentAt: '2026-07-23', createdBy: 'Dr. Anita Patel', surveyType: 'course_evaluation', openDate: '2026-06-16', academicYear: '2025–2026', programId: 'prog1' },
  { id: 'mon3',  courseCode: 'NURS-540', courseName: 'Clinical Reasoning & Diagnostics',              term: 'Spring 2026', cohort: 'Class of 2027', courseType: 'didactic', templateId: 'tmpl1', status: 'collecting', instructors: [INSTRUCTORS.williams], responseRate: 91, responseCount: 50, enrollmentCount: 55, deadline: 'Aug 23, 2026', createdAt: 'Jan 15, 2026', lastReminderSentAt: '2026-07-25', createdBy: 'Dr. Anita Patel', surveyType: 'course_evaluation', openDate: '2026-06-16', academicYear: '2025–2026', programId: 'prog1' },
  { id: 'mon4',  courseCode: 'NURS-505', courseName: 'Fundamentals of Nursing I',                        term: 'Spring 2026', cohort: 'Class of 2027', courseType: 'didactic', templateId: 'tmpl1', status: 'closed',     instructors: [INSTRUCTORS.patel],    responseRate: 84, responseCount: 59, enrollmentCount: 70, deadline: 'May 30, 2026', createdAt: 'Jan 15, 2026', lastReminderSentAt: '2026-05-13', createdBy: 'Dr. Anita Patel', surveyType: 'course_evaluation', openDate: '2026-04-20', academicYear: '2025–2026', programId: 'prog1' },
  { id: 'mon5',  courseCode: 'NURS-504', courseName: 'Health Assessment',                 term: 'Spring 2026', cohort: 'Class of 2027', courseType: 'didactic', templateId: 'tmpl1', status: 'released',   instructors: [INSTRUCTORS.chen, { ...INSTRUCTORS.patel, role: 'guest' }], responseRate: 88, responseCount: 57, enrollmentCount: 65, deadline: 'May 15, 2026', createdAt: 'Jan 15, 2026', lastReminderSentAt: '2026-04-30', createdBy: 'Dr. Anita Patel', surveyType: 'course_evaluation', openDate: '2026-04-10', academicYear: '2025–2026', programId: 'prog1' },
  { id: 'mon6',  courseCode: 'NURS-530', courseName: 'Maternal-Newborn Nursing',                term: 'Spring 2026', cohort: 'Class of 2026', courseType: 'clinical', templateId: 'tmpl2', status: 'collecting', instructors: [INSTRUCTORS.hassan, { ...INSTRUCTORS.patel, role: 'guest' }], responseRate: 73, responseCount: 37, enrollmentCount: 50, deadline: 'Aug 22, 2026', createdAt: 'Jan 15, 2026', lastReminderSentAt: '2026-07-24', createdBy: 'Dr. Anita Patel', surveyType: 'course_evaluation', openDate: '2026-06-16', academicYear: '2025–2026', programId: 'prog1' },
  { id: 'mon7',  courseCode: 'NURS-620', courseName: 'Geriatric Nursing',          term: 'Spring 2026', cohort: 'Class of 2026', courseType: 'clinical', templateId: 'tmpl2', status: 'active',     instructors: [INSTRUCTORS.kim],      responseRate: 62, responseCount: 24, enrollmentCount: 38, deadline: 'Aug 23, 2026', createdAt: 'Jan 15, 2026', lastReminderSentAt: '2026-07-25', createdBy: 'Dr. Anita Patel', surveyType: 'course_evaluation', openDate: '2026-06-17', academicYear: '2025–2026', programId: 'prog1' },
  { id: 'mon8',  courseCode: 'NURS-515', courseName: 'Pharmacology for Nurses', term: 'Spring 2026', cohort: 'Class of 2027', courseType: 'didactic', templateId: 'tmpl1', status: 'collecting', instructors: [INSTRUCTORS.williams], responseRate: 58, responseCount: 28, enrollmentCount: 48, deadline: 'Aug 20, 2026', createdAt: 'Jan 15, 2026', lastReminderSentAt: '2026-07-23', createdBy: 'Dr. Anita Patel', surveyType: 'course_evaluation', openDate: '2026-06-16', academicYear: '2025–2026', programId: 'prog1' },

  // Summer 2026 (pt9) — fully closed and reviewed, real scores in MOCK_FACULTY_OFFERINGS.
  // Response rates + ratings intentionally mixed (see that array's own comment) so the
  // "Last closed term" card's below-threshold banner has real courses/faculty to count.
  { id: 'mon26', courseCode: 'NURS-501', courseName: 'Human Anatomy & Physiology',   term: 'Summer 2026', cohort: 'Class of 2028', courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.patel],    responseRate: 82, responseCount: 41, enrollmentCount: 50, deadline: 'Aug 12, 2026', createdAt: 'May 20, 2026', lastReminderSentAt: '2026-08-02', createdBy: 'Dr. Anita Patel', surveyType: 'course_evaluation', openDate: '2026-07-20', academicYear: '2025–2026', programId: 'prog1' },
  { id: 'mon27', courseCode: 'NURS-510', courseName: 'Medical-Surgical Nursing I',   term: 'Summer 2026', cohort: 'Class of 2028', courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.patel],    responseRate: 80, responseCount: 34, enrollmentCount: 42, deadline: 'Aug 12, 2026', createdAt: 'May 20, 2026', lastReminderSentAt: '2026-08-02', createdBy: 'Dr. Anita Patel', surveyType: 'course_evaluation', openDate: '2026-07-20', academicYear: '2025–2026', programId: 'prog1' },
  /* LEAD DEMO RECORD (stakeholder bar, 2026-09-16) — the one fully hand-wired
   * single-survey result: two instructors whose roles resolve to Course
   * Coordinator (Chen, position 'Course Director') and Instructor (Gomez,
   * position 'Core Faculty') via facultyEvalRole(), real per-question scores
   * in MOCK_SURVEY_QUESTION_DATA, real comments in MOCK_RESPONSES, and real
   * per-question open text in MOCK_OPEN_TEXT_RESPONSES. Chen's shared
   * INSTRUCTORS entry carries role 'guest' (which resolves to Guest Lecturer);
   * overridden to 'primary' HERE only, so no other survey moves. */
  { id: 'mon28', courseCode: 'NURS-515', courseName: 'Pharmacology for Nurses',      term: 'Summer 2026', cohort: 'Class of 2028', courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [{ ...INSTRUCTORS.chen, role: 'primary' }, INSTRUCTORS.gomez], responseRate: 70, responseCount: 32, enrollmentCount: 46, deadline: 'Aug 14, 2026', createdAt: 'May 20, 2026', lastReminderSentAt: '2026-08-03', createdBy: 'Dr. Anita Patel', surveyType: 'course_evaluation', openDate: '2026-07-20', academicYear: '2025–2026', programId: 'prog1' },
  { id: 'mon29', courseCode: 'NURS-540', courseName: 'Clinical Reasoning & Diagnostics', term: 'Summer 2026', cohort: 'Class of 2028', courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.chen],     responseRate: 68, responseCount: 26, enrollmentCount: 38, deadline: 'Aug 14, 2026', createdAt: 'May 20, 2026', lastReminderSentAt: '2026-08-03', createdBy: 'Dr. Anita Patel', surveyType: 'course_evaluation', openDate: '2026-07-20', academicYear: '2025–2026', programId: 'prog1' },
  { id: 'mon30', courseCode: 'NURS-502', courseName: 'Physiology & Pathophysiology', term: 'Summer 2026', cohort: 'Class of 2028', courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.williams], responseRate: 88, responseCount: 48, enrollmentCount: 54, deadline: 'Aug 16, 2026', createdAt: 'May 20, 2026', lastReminderSentAt: '2026-08-04', createdBy: 'Dr. Anita Patel', surveyType: 'course_evaluation', openDate: '2026-07-20', academicYear: '2025–2026', programId: 'prog1' },
  { id: 'mon31', courseCode: 'NURS-611', courseName: 'Pediatric Nursing',            term: 'Summer 2026', cohort: 'Class of 2027', courseType: 'clinical', templateId: 'tmpl2', status: 'released', instructors: [INSTRUCTORS.williams], responseRate: 85, responseCount: 26, enrollmentCount: 30, deadline: 'Aug 16, 2026', createdAt: 'May 20, 2026', lastReminderSentAt: '2026-08-04', createdBy: 'Dr. Anita Patel', surveyType: 'course_evaluation', openDate: '2026-07-20', academicYear: '2025–2026', programId: 'prog1' },
  { id: 'mon32', courseCode: 'NURS-530', courseName: 'Maternal-Newborn Nursing',     term: 'Summer 2026', cohort: 'Class of 2027', courseType: 'clinical', templateId: 'tmpl2', status: 'released', instructors: [INSTRUCTORS.kim],      responseRate: 60, responseCount: 26, enrollmentCount: 44, deadline: 'Aug 18, 2026', createdAt: 'May 20, 2026', lastReminderSentAt: '2026-08-05', createdBy: 'Dr. Anita Patel', surveyType: 'course_evaluation', openDate: '2026-07-20', academicYear: '2025–2026', programId: 'prog1' },
  { id: 'mon33', courseCode: 'NURS-620', courseName: 'Geriatric Nursing',            term: 'Summer 2026', cohort: 'Class of 2027', courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.gomez],    responseRate: 65, responseCount: 22, enrollmentCount: 34, deadline: 'Aug 18, 2026', createdAt: 'May 20, 2026', createdBy: 'Dr. Anita Patel', lastReminderSentAt: '2026-08-05', surveyType: 'course_evaluation', openDate: '2026-07-20', academicYear: '2025–2026', programId: 'prog1' },
  { id: 'mon34', courseCode: 'NURS-801', courseName: 'Evidence-Based Practice',      term: 'Summer 2026', cohort: 'Class of 2026', courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.hassan],   responseRate: 78, responseCount: 25, enrollmentCount: 32, deadline: 'Aug 20, 2026', createdAt: 'May 20, 2026', lastReminderSentAt: '2026-08-07', createdBy: 'Dr. Anita Patel', surveyType: 'course_evaluation', openDate: '2026-07-20', academicYear: '2025–2026', programId: 'prog1' },

  // history (for the response-rate trend)
  { id: 'mon9',  courseCode: 'NURS-501', courseName: 'Human Anatomy & Physiology',         term: 'Fall 2025',   courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.patel],    responseRate: 71, responseCount: 37, enrollmentCount: 52, deadline: 'Dec 15, 2025', createdAt: 'Aug 15, 2025', surveyType: 'course_evaluation', academicYear: '2025–2026', programId: 'prog1' },
  { id: 'mon10', courseCode: 'NURS-540', courseName: 'Clinical Reasoning & Diagnostics',              term: 'Fall 2025',   courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.williams], responseRate: 80, responseCount: 40, enrollmentCount: 50, deadline: 'Dec 15, 2025', createdAt: 'Aug 15, 2025', surveyType: 'course_evaluation', academicYear: '2025–2026', programId: 'prog1' },
  { id: 'mon11', courseCode: 'NURS-501', courseName: 'Human Anatomy & Physiology',         term: 'Spring 2025', courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.patel],    responseRate: 75, responseCount: 38, enrollmentCount: 50, deadline: 'Apr 30, 2025', createdAt: 'Jan 15, 2025', surveyType: 'course_evaluation', academicYear: '2024–2025', programId: 'prog1' },
  { id: 'mon12', courseCode: 'NURS-505', courseName: 'Fundamentals of Nursing I',                        term: 'Spring 2025', courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.patel],    responseRate: 82, responseCount: 49, enrollmentCount: 60, deadline: 'Apr 30, 2025', createdAt: 'Jan 15, 2025', surveyType: 'course_evaluation', academicYear: '2024–2025', programId: 'prog1' },
  // minimumThreshold above responseCount = gate demo (ST-15): suppressed "Draft" result.
  { id: 'mon13', courseCode: 'NURS-510', courseName: 'Medical-Surgical Nursing I',  term: 'Fall 2024',   courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.kim],      responseRate: 68, responseCount: 37, enrollmentCount: 55, minimumThreshold: 40, deadline: 'Dec 15, 2024', createdAt: 'Aug 15, 2024', surveyType: 'course_evaluation', academicYear: '2024–2025', programId: 'prog1' },
  { id: 'mon14', courseCode: 'NURS-540', courseName: 'Clinical Reasoning & Diagnostics',              term: 'Fall 2024',   courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.williams], responseRate: 78, responseCount: 37, enrollmentCount: 48, deadline: 'Dec 15, 2024', createdAt: 'Aug 15, 2024', surveyType: 'course_evaluation', academicYear: '2024–2025', programId: 'prog1' },

  // Programmatic (institutional) surveys with real response data — feed the
  // Programmatic dashboard's rate chart + survey list (mirror the General Surveys set).
  { id: 'pg1', courseCode: 'End-of-Program Satisfaction · Class of 2026', courseName: '', term: 'Spring 2026', templateId: 'tmpl-gen1', status: 'released',   instructors: [], responseRate: 85, responseCount: 142, enrollmentCount: 168, deadline: 'May 15, 2026', createdAt: 'Feb 1, 2026', lastReminderSentAt: '2026-04-26', surveyType: 'programmatic', openDate: '2026-04-01', academicYear: '2025–2026' },
  { id: 'pg2', courseCode: 'Clinical Site Feedback · DPT Year 3',         courseName: '', term: 'Spring 2026', templateId: 'tmpl-gen1', status: 'collecting', instructors: [], responseRate: 88, responseCount: 84,  enrollmentCount: 96,  deadline: 'Jul 13, 2026', createdAt: 'Feb 1, 2026', lastReminderSentAt: '2026-06-12', surveyType: 'programmatic', openDate: '2026-05-01', academicYear: '2025–2026' },
  { id: 'pg3', courseCode: 'Faculty Self-Assessment · All Faculty',       courseName: '', term: 'Spring 2026', templateId: 'tmpl-gen1', status: 'collecting', instructors: [], responseRate: 69, responseCount: 22,  enrollmentCount: 32,  deadline: 'Jul 16, 2026', createdAt: 'Feb 1, 2026', lastReminderSentAt: '2026-06-14', surveyType: 'programmatic', openDate: '2026-05-01', academicYear: '2025–2026' },
  { id: 'pg4', courseCode: 'Curriculum Effectiveness · All Students',      courseName: '', term: 'Spring 2026', templateId: 'tmpl-gen1', status: 'collecting', instructors: [], responseRate: 90, responseCount: 281, enrollmentCount: 312, deadline: 'Jul 20, 2026', createdAt: 'Feb 1, 2026', lastReminderSentAt: '2026-06-16', surveyType: 'programmatic', openDate: '2026-05-01', academicYear: '2025–2026' },

  // ── Fall 2026 (pt5) — flows already pushed for the upcoming term ──────────
  // The SAME offering can be covered by SEPARATE push flows, each evaluating a
  // different evaluatee: `offeringId` ties the flows to the course, `evalScope`
  // + `instructors` say WHO each one evaluates. The push wizard's Status column
  // reads these, so setting up a second flow shows what's already out.
  //   co13 (NURS-510) — separate flows per evaluatee (course + Patel + Chen);
  //     ONE survey window for all: the template setup assigns a single
  //     start/end to Course/Faculty/General together (Romit, Jul 22), so
  //     every flow born from a push shares its batch window.
  //   co17 (NURS-601) — the course-material flow is out; faculty flow is not.
  // pf0–pf3 are all 'scheduled': a flow born from THIS batch push STARTS at
  // scheduled — drafting happens at the template / wizard-composition level
  // for all evaluatees at once, never per-faculty (Romit, Jul 22) — and the
  // term starts Aug 24 so nothing born from a Fall 2026 batch push can be
  // live yet.
  // Third co13 flow (course-material, early term) — makes NURS-510 the >2-flows
  // row, exercising the Status cell's "+N more" overflow popover.
  //
  // pf4 is the ONE exception, and deliberately outside that batch-push
  // pattern: an admin pushed ONE early survey for co19 (NURS-610) outside the
  // wizard (e.g. a pilot), so it's already Live. Added 2026-08-03 because
  // ST-02's role-overlap hard block had NO real, verifiable example anywhere
  // in the fixture set — roleOverlapConflicts() requires offeringId, which
  // none of the pre-ST-02 mon*/pg* surveys below carry (they predate the
  // offeringId model), and every offeringId-bearing Fall 2026 survey above
  // was 'scheduled' (ST-02-exempt). Push NURS-610 again in the wizard to see
  // a genuine Blocked row, not a demo-only one.
  { id: 'pf0', offeringId: 'co13', evalScope: 'course', courseCode: 'NURS-510', courseName: 'Medical-Surgical Nursing I', term: 'Fall 2026', cohort: 'Year 2 – Section A', courseType: 'didactic', templateId: 'tmpl1', status: 'scheduled', instructors: [], responseRate: 0, responseCount: 0, enrollmentCount: 44, deadline: 'Dec 18, 2026', createdAt: 'Jul 15, 2026', createdBy: 'Dr. Anita Patel', surveyType: 'course_evaluation', openDate: '2026-12-04', academicYear: '2026–2027', programId: 'prog1' },
  { id: 'pf1', offeringId: 'co13', evalScope: 'instructor', courseCode: 'NURS-510', courseName: 'Medical-Surgical Nursing I', term: 'Fall 2026', cohort: 'Year 2 – Section A', courseType: 'didactic', templateId: 'tmpl2', status: 'scheduled', instructors: [INSTRUCTORS.patel], responseRate: 0, responseCount: 0, enrollmentCount: 44, deadline: 'Dec 18, 2026', createdAt: 'Jul 15, 2026', createdBy: 'Dr. Anita Patel', surveyType: 'course_evaluation', openDate: '2026-12-04', academicYear: '2026–2027', programId: 'prog1' },
  // Kevin's flow runs its OWN window + cadence — the wizard surfaces must show
  // per-survey rules diverging, not one uniform Dec 4 story. Live + evalRole
  // 'instructor' (2026-08-05): the demo fixture for the person-grain
  // exception — co13 also carries coInstructorIds: ['f5'] (Dr. Rachel Gomez,
  // UC2 late-added co-instructor). With this survey Live and named to Chen
  // only, Gomez resolves 'new' with lateAddedRelativeTo set, surfacing the
  // "different template" affordance — without this, that whole feature has
  // no reachable trigger anywhere in the mock dataset.
  { id: 'pf2', offeringId: 'co13', evalScope: 'instructor', evalRole: 'instructor', courseCode: 'NURS-510', courseName: 'Medical-Surgical Nursing I', term: 'Fall 2026', cohort: 'Year 2 – Section A', courseType: 'didactic', templateId: 'tmpl2', status: 'active', instructors: [{ ...INSTRUCTORS.chen, role: 'guest' }], responseRate: 0, responseCount: 0, enrollmentCount: 44, deadline: 'Dec 16, 2026', createdAt: 'Jul 15, 2026', lastReminderSentAt: '2026-12-06', createdBy: 'Dr. Anita Patel', surveyType: 'course_evaluation', openDate: '2026-12-06', academicYear: '2026–2027', programId: 'prog1', reminderCadence: { frequency: 'daily', anchor: 'survey_close', startDaysBefore: 5 } },
  // instructors: [] — a course-scope flow evaluates no PERSON; listing one
  // would seed a ghost row in that instructor's faculty analytics
  // (lib/pce-analytics.ts facultySurveys keys off instructors[0]).
  // The practicum closes later and nudges weekly — a second distinct rule set.
  { id: 'pf3', offeringId: 'co17', evalScope: 'course', courseCode: 'NURS-601', courseName: 'Clinical Practicum I', term: 'Fall 2026', cohort: 'Year 3 – Section A', courseType: 'clinical', templateId: 'tmpl1', status: 'scheduled', instructors: [], responseRate: 0, responseCount: 0, enrollmentCount: 14, deadline: 'Dec 22, 2026', createdAt: 'Jul 15, 2026', createdBy: 'Dr. Anita Patel', surveyType: 'course_evaluation', openDate: '2026-12-08', academicYear: '2026–2027', programId: 'prog1', reminderCadence: { frequency: 'every_7_days', anchor: 'survey_close', startDaysBefore: 14 } },
  { id: 'pf4', offeringId: 'co19', evalScope: 'instructor', courseCode: 'NURS-610', courseName: 'Geriatric Nursing', term: 'Fall 2026', cohort: 'Year 3 – Section C', courseType: 'didactic', templateId: 'tmpl2', status: 'active', instructors: [INSTRUCTORS.williams], responseRate: 12, responseCount: 5, enrollmentCount: 44, deadline: 'Sep 15, 2026', createdAt: 'Jul 20, 2026', lastReminderSentAt: '2026-08-24', createdBy: 'Dr. Anita Patel', surveyType: 'course_evaluation', openDate: '2026-07-25', academicYear: '2026–2027', programId: 'prog1' },
  /* pf5/pf6 — Fall 2026's "Draft" and "Closed" bucket rows had zero courses
     in them, so the Live-term card's row list only ever showed 3 of its 5
     possible states (Not set up/Scheduled/Live, never Draft/Closed) — not a
     rendering bug, `LiveTermCard`'s `OperationsRow`s for all 5 buckets
     already existed (Romit, 2026-09-11, against the reference's 5-row Live
     term card). co9/co10 were otherwise "Not set up"; giving them real
     draft/released surveys demonstrates every state instead. */
  { id: 'pf5', offeringId: 'co9',  evalScope: 'course', courseCode: 'NURS-501', courseName: 'Human Anatomy & Physiology', term: 'Fall 2026', cohort: 'Year 1 – Section A', courseType: 'didactic', templateId: 'tmpl1', status: 'draft', instructors: [], responseRate: 0, responseCount: 0, enrollmentCount: 48, deadline: 'Dec 10, 2026', createdAt: 'Oct 20, 2026', createdBy: 'Dr. Anita Patel', surveyType: 'course_evaluation', openDate: '2026-11-15', academicYear: '2026–2027', programId: 'prog1' },
  { id: 'pf6', offeringId: 'co10', evalScope: 'course', courseCode: 'NURS-502', courseName: 'Physiology & Pathophysiology', term: 'Fall 2026', cohort: 'Year 1 – Section B', courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.williams], responseRate: 68, responseCount: 33, enrollmentCount: 48, deadline: 'Oct 15, 2026', createdAt: 'Aug 20, 2026', lastReminderSentAt: '2026-10-02', createdBy: 'Dr. Anita Patel', releasedAt: 'Oct 20, 2026', surveyType: 'course_evaluation', openDate: '2026-09-15', academicYear: '2026–2027', programId: 'prog1' },
  /* pf7–pf9 — the Live bucket had exactly one course (NURS-610); after
     pushing surveys in the wizard and landing on "View dashboard", the Live
     term card read as nearly empty rather than showing real collection
     activity (Romit, 2026-09-11). Same three previously-"Not set up"
     offerings pattern as pf5/pf6, now `collecting`/`active` — a mix of
     healthy, on-target, and a second at-risk course alongside NURS-610's
     existing one, not all identical. */
  { id: 'pf7', offeringId: 'co11', evalScope: 'course', courseCode: 'NURS-503', courseName: 'Pharmacology for Nurses', term: 'Fall 2026', cohort: 'Year 1 – Section C', courseType: 'didactic', templateId: 'tmpl1', status: 'collecting', instructors: [INSTRUCTORS.williams], responseRate: 72, responseCount: 33, enrollmentCount: 46, deadline: 'Dec 5, 2026', createdAt: 'Sep 10, 2026', lastReminderSentAt: '2026-11-03', createdBy: 'Dr. Anita Patel', surveyType: 'course_evaluation', openDate: '2026-11-01', academicYear: '2026–2027', programId: 'prog1' },
  { id: 'pf8', offeringId: 'co14', evalScope: 'course', courseCode: 'NURS-520', courseName: 'Neurological Nursing', term: 'Fall 2026', cohort: 'Year 2 – Section B', courseType: 'didactic', templateId: 'tmpl1', status: 'active', instructors: [INSTRUCTORS.kim], responseRate: 65, responseCount: 29, enrollmentCount: 44, deadline: 'Dec 8, 2026', createdAt: 'Sep 10, 2026', lastReminderSentAt: '2026-11-03', createdBy: 'Dr. Anita Patel', surveyType: 'course_evaluation', openDate: '2026-11-01', academicYear: '2026–2027', programId: 'prog1' },
  { id: 'pf9', offeringId: 'co15', evalScope: 'course', courseCode: 'NURS-530', courseName: 'Maternal-Newborn Nursing', term: 'Fall 2026', cohort: 'Year 2 – Section C', courseType: 'didactic', templateId: 'tmpl1', status: 'collecting', instructors: [INSTRUCTORS.hassan], responseRate: 25, responseCount: 11, enrollmentCount: 42, deadline: 'Dec 3, 2026', createdAt: 'Sep 10, 2026', lastReminderSentAt: '2026-10-17', createdBy: 'Dr. Anita Patel', surveyType: 'course_evaluation', openDate: '2026-10-15', academicYear: '2026–2027', programId: 'prog1' },

  // ── Spring 2026 (pt1) — one new Setup-bucket Draft survey (co41) ──────────
  { id: 'mon23', offeringId: 'co41', courseCode: 'NURS-801', courseName: 'Evidence-Based Practice', term: 'Spring 2026', cohort: 'Class of 2027', courseType: 'didactic', templateId: 'tmpl1', status: 'draft', instructors: [INSTRUCTORS.williams], responseRate: 0, responseCount: 0, enrollmentCount: 32, deadline: 'Aug 28, 2026', createdAt: 'Jun 10, 2026', createdBy: 'Dr. Anita Patel', surveyType: 'course_evaluation', openDate: '2026-06-20', academicYear: '2025–2026', programId: 'prog1' },

  // ── Fall 2025 (pt2) — closed-term evaluation history (co26–co33) ──────────
  // co24/co25 are already covered by mon9/mon10 above; co34/co35 stay
  // deliberately unmatched (never evaluated — the Last-term needsAttention story).
  { id: 'mon15', courseCode: 'NURS-502', courseName: 'Physiology & Pathophysiology',        term: 'Fall 2025', cohort: 'Class of 2028', courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.williams], responseRate: 78, responseCount: 35, enrollmentCount: 45, deadline: 'Dec 12, 2025', createdAt: 'Aug 18, 2025', lastReminderSentAt: '2025-10-27', createdBy: 'Dr. Anita Patel', releasedAt: 'Dec 20, 2025', surveyType: 'course_evaluation', openDate: '2025-08-26', academicYear: '2025–2026', programId: 'prog1' },
  { id: 'mon16', courseCode: 'NURS-503', courseName: 'Pharmacology for Nurses', term: 'Fall 2025', cohort: 'Class of 2028', courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.williams], responseRate: 65, responseCount: 27, enrollmentCount: 42, deadline: 'Dec 12, 2025', createdAt: 'Aug 18, 2025', lastReminderSentAt: '2025-10-27', createdBy: 'Dr. Anita Patel', releasedAt: 'Dec 22, 2025', surveyType: 'course_evaluation', openDate: '2025-08-26', academicYear: '2025–2026', programId: 'prog1' },
  { id: 'mon17', courseCode: 'NURS-505', courseName: 'Fundamentals of Nursing I',                       term: 'Fall 2025', cohort: 'Class of 2028', courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.gomez],    responseRate: 90, responseCount: 43, enrollmentCount: 48, deadline: 'Dec 15, 2025', createdAt: 'Aug 20, 2025', lastReminderSentAt: '2025-10-27', createdBy: 'Dr. Anita Patel', releasedAt: 'Dec 19, 2025', surveyType: 'course_evaluation', openDate: '2025-08-21', academicYear: '2025–2026', programId: 'prog1' },
  { id: 'mon18', courseCode: 'NURS-510', courseName: 'Medical-Surgical Nursing I',   term: 'Fall 2025', cohort: 'Class of 2027', courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.patel, { ...INSTRUCTORS.chen, role: 'guest' }], responseRate: 84, responseCount: 39, enrollmentCount: 46, deadline: 'Dec 14, 2025', createdAt: 'Aug 18, 2025', lastReminderSentAt: '2025-10-28', createdBy: 'Dr. Anita Patel', releasedAt: 'Dec 21, 2025', surveyType: 'course_evaluation', openDate: '2025-08-25', academicYear: '2025–2026', programId: 'prog1' },
  { id: 'mon19', courseCode: 'NURS-511', courseName: 'Medical-Surgical Nursing II',  term: 'Fall 2025', cohort: 'Class of 2027', courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.patel],    responseRate: 72, responseCount: 32, enrollmentCount: 44, deadline: 'Dec 14, 2025', createdAt: 'Aug 18, 2025', lastReminderSentAt: '2025-10-28', createdBy: 'Dr. Anita Patel', releasedAt: 'Dec 23, 2025', surveyType: 'course_evaluation', openDate: '2025-08-25', academicYear: '2025–2026', programId: 'prog1' },
  { id: 'mon20', courseCode: 'NURS-520', courseName: 'Neurological Nursing',        term: 'Fall 2025', cohort: 'Class of 2027', courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.williams], responseRate: 95, responseCount: 38, enrollmentCount: 40, deadline: 'Dec 13, 2025', createdAt: 'Aug 19, 2025', lastReminderSentAt: '2025-10-27', createdBy: 'Dr. Anita Patel', releasedAt: 'Dec 18, 2025', surveyType: 'course_evaluation', openDate: '2025-08-25', academicYear: '2025–2026', programId: 'prog1' },
  { id: 'mon21', courseCode: 'NURS-530', courseName: 'Maternal-Newborn Nursing',                 term: 'Fall 2025', cohort: 'Class of 2027', courseType: 'didactic', templateId: 'tmpl1', status: 'closed',   gradesSubmitted: false, instructors: [INSTRUCTORS.kim], responseRate: 58, responseCount: 29, enrollmentCount: 50, deadline: 'Dec 16, 2025', createdAt: 'Aug 20, 2025', lastReminderSentAt: '2025-10-30', createdBy: 'Dr. Anita Patel', closedAt: 'Dec 20, 2025', surveyType: 'course_evaluation', openDate: '2025-08-26', academicYear: '2025–2026', programId: 'prog1' },
  { id: 'mon22', courseCode: 'NURS-601', courseName: 'Clinical Practicum I',                 term: 'Fall 2025', cohort: 'Class of 2026', courseType: 'clinical', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.patel, { ...INSTRUCTORS.hassan, role: 'guest' }], responseRate: 68, responseCount: 11, enrollmentCount: 16, deadline: 'Dec 18, 2025', createdAt: 'Aug 22, 2025', lastReminderSentAt: '2025-11-01', createdBy: 'Dr. Anita Patel', releasedAt: 'Dec 24, 2025', surveyType: 'course_evaluation', openDate: '2025-08-28', academicYear: '2025–2026', programId: 'prog1' },
  // mon24/mon25 (2026-08-19/20) — Romit's catch: "since the term is done why
  // would there be a warning and again need a setup?" NURS-506 (co34) and
  // NURS-620 (co35) were the term's only two offerings with no survey at all,
  // which is what triggered LastTermCard's "2 courses never collected"
  // callout. A closed, archived term realistically has ALL its courses
  // evaluated — these complete the set to 13 of 13 released.
  { id: 'mon24', courseCode: 'NURS-506', courseName: 'Fundamentals of Nursing II',             term: 'Fall 2025', cohort: 'Class of 2028', courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.kim],    responseRate: 74, responseCount: 28, enrollmentCount: 38, deadline: 'Dec 12, 2025', createdAt: 'Aug 18, 2025', lastReminderSentAt: '2025-10-27', createdBy: 'Dr. Anita Patel', releasedAt: 'Dec 21, 2025', surveyType: 'course_evaluation', openDate: '2025-08-26', academicYear: '2025–2026', programId: 'prog1' },
  { id: 'mon25', courseCode: 'NURS-620', courseName: 'Geriatric Nursing', term: 'Fall 2025', cohort: 'Class of 2027', courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.hassan], responseRate: 81, responseCount: 34, enrollmentCount: 42, deadline: 'Dec 15, 2025', createdAt: 'Aug 20, 2025', lastReminderSentAt: '2025-10-29', createdBy: 'Dr. Anita Patel', releasedAt: 'Dec 23, 2025', surveyType: 'course_evaluation', openDate: '2025-08-26', academicYear: '2025–2026', programId: 'prog1' },

  // ── Spring 2025 (pt3) — further-past term, fully closed history ───────────
  // sp25-1..sp25-10 (co42/co43 above are already covered by mon11/mon12).
  { id: 'sp25-1',  courseCode: 'NURS-502', courseName: 'Physiology & Pathophysiology',        term: 'Spring 2025', cohort: 'Class of 2028', courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.williams], responseRate: 40, responseCount: 18, enrollmentCount: 46, deadline: 'Apr 28, 2025', createdAt: 'Jan 16, 2025', lastReminderSentAt: '2025-03-17', releasedAt: 'May 12, 2025', surveyType: 'course_evaluation', openDate: '2025-01-20', academicYear: '2024–2025', programId: 'prog1' },
  { id: 'sp25-2',  courseCode: 'NURS-503', courseName: 'Pharmacology for Nurses', term: 'Spring 2025', cohort: 'Class of 2028', courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.williams], responseRate: 55, responseCount: 24, enrollmentCount: 44, deadline: 'Apr 28, 2025', createdAt: 'Jan 16, 2025', lastReminderSentAt: '2025-03-17', releasedAt: 'May 14, 2025', surveyType: 'course_evaluation', openDate: '2025-01-20', academicYear: '2024–2025', programId: 'prog1' },
  { id: 'sp25-3',  courseCode: 'NURS-504', courseName: 'Health Assessment',                        term: 'Spring 2025', cohort: 'Class of 2028', courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.kim],      responseRate: 79, responseCount: 40, enrollmentCount: 50, deadline: 'Apr 30, 2025', createdAt: 'Jan 15, 2025', lastReminderSentAt: '2025-03-17', releasedAt: 'May 10, 2025', surveyType: 'course_evaluation', openDate: '2025-01-16', academicYear: '2024–2025', programId: 'prog1' },
  { id: 'sp25-4',  courseCode: 'NURS-510', courseName: 'Medical-Surgical Nursing I',  term: 'Spring 2025', cohort: 'Class of 2027', courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.patel],    responseRate: 40, responseCount: 19, enrollmentCount: 48, deadline: 'May 2, 2025',  createdAt: 'Jan 18, 2025', lastReminderSentAt: '2025-03-21', releasedAt: 'May 16, 2025', surveyType: 'course_evaluation', openDate: '2025-01-22', academicYear: '2024–2025', programId: 'prog1' },
  { id: 'sp25-5',  courseCode: 'NURS-511', courseName: 'Medical-Surgical Nursing II', term: 'Spring 2025', cohort: 'Class of 2027', courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.patel],    responseRate: 63, responseCount: 29, enrollmentCount: 46, deadline: 'May 2, 2025',  createdAt: 'Jan 18, 2025', lastReminderSentAt: '2025-03-21', releasedAt: 'May 18, 2025', surveyType: 'course_evaluation', openDate: '2025-01-22', academicYear: '2024–2025', programId: 'prog1' },
  { id: 'sp25-6',  courseCode: 'NURS-520', courseName: 'Neurological Nursing',       term: 'Spring 2025', cohort: 'Class of 2027', courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.williams], responseRate: 72, responseCount: 30, enrollmentCount: 42, deadline: 'May 3, 2025',  createdAt: 'Jan 19, 2025', lastReminderSentAt: '2025-03-22', releasedAt: 'May 15, 2025', surveyType: 'course_evaluation', openDate: '2025-01-23', academicYear: '2024–2025', programId: 'prog1' },
  { id: 'sp25-7',  courseCode: 'NURS-530', courseName: 'Maternal-Newborn Nursing',                term: 'Spring 2025', cohort: 'Class of 2027', courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.kim],      responseRate: 48, responseCount: 24, enrollmentCount: 50, deadline: 'May 3, 2025',  createdAt: 'Jan 19, 2025', lastReminderSentAt: '2025-03-22', releasedAt: 'May 19, 2025', surveyType: 'course_evaluation', openDate: '2025-01-23', academicYear: '2024–2025', programId: 'prog1' },
  { id: 'sp25-8',  courseCode: 'NURS-540', courseName: 'Clinical Reasoning & Diagnostics',              term: 'Spring 2025', cohort: 'Class of 2027', courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.hassan],   responseRate: 40, responseCount: 21, enrollmentCount: 52, deadline: 'May 1, 2025',  createdAt: 'Jan 17, 2025', lastReminderSentAt: '2025-03-20', releasedAt: 'May 13, 2025', surveyType: 'course_evaluation', openDate: '2025-01-21', academicYear: '2024–2025', programId: 'prog1' },
  { id: 'sp25-9',  courseCode: 'NURS-601', courseName: 'Clinical Practicum I',                term: 'Spring 2025', cohort: 'Class of 2026', courseType: 'clinical', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.patel],    responseRate: 95, responseCount: 17, enrollmentCount: 18, deadline: 'May 5, 2025',  createdAt: 'Jan 20, 2025', lastReminderSentAt: '2025-03-23', releasedAt: 'May 20, 2025', surveyType: 'course_evaluation', openDate: '2025-01-24', academicYear: '2024–2025', programId: 'prog1' },
  { id: 'sp25-10', courseCode: 'NURS-602', courseName: 'Clinical Practicum II',               term: 'Spring 2025', cohort: 'Class of 2026', courseType: 'clinical', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.hassan],   responseRate: 60, responseCount: 10, enrollmentCount: 16, deadline: 'May 5, 2025',  createdAt: 'Jan 20, 2025', lastReminderSentAt: '2025-03-23', releasedAt: 'May 21, 2025', surveyType: 'course_evaluation', openDate: '2025-01-24', academicYear: '2024–2025', programId: 'prog1' },

  // ── Fall 2024 (pt4) — furthest-past term, fully closed history ────────────
  // fa24-1..fa24-10 (co54/co55 above are already covered by mon13/mon14).
  { id: 'fa24-1',  courseCode: 'NURS-501', courseName: 'Human Anatomy & Physiology',         term: 'Fall 2024', cohort: 'Class of 2028', courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.patel],    responseRate: 70, responseCount: 34, enrollmentCount: 48, deadline: 'Dec 12, 2024', createdAt: 'Aug 16, 2024', lastReminderSentAt: '2024-10-26', releasedAt: 'Dec 30, 2024', surveyType: 'course_evaluation', openDate: '2024-08-22', academicYear: '2024–2025', programId: 'prog1' },
  { id: 'fa24-2',  courseCode: 'NURS-502', courseName: 'Physiology & Pathophysiology',        term: 'Fall 2024', cohort: 'Class of 2028', courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.williams], responseRate: 82, responseCount: 36, enrollmentCount: 44, deadline: 'Dec 12, 2024', createdAt: 'Aug 16, 2024', lastReminderSentAt: '2024-10-26', releasedAt: 'Jan 2, 2025',  surveyType: 'course_evaluation', openDate: '2024-08-22', academicYear: '2024–2025', programId: 'prog1' },
  { id: 'fa24-3',  courseCode: 'NURS-503', courseName: 'Pharmacology for Nurses', term: 'Fall 2024', cohort: 'Class of 2028', courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.williams], responseRate: 59, responseCount: 25, enrollmentCount: 42, deadline: 'Dec 12, 2024', createdAt: 'Aug 16, 2024', lastReminderSentAt: '2024-10-26', releasedAt: 'Jan 4, 2025',  surveyType: 'course_evaluation', openDate: '2024-08-22', academicYear: '2024–2025', programId: 'prog1' },
  { id: 'fa24-4',  courseCode: 'NURS-504', courseName: 'Health Assessment',                        term: 'Fall 2024', cohort: 'Class of 2028', courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.kim],      responseRate: 90, responseCount: 45, enrollmentCount: 50, deadline: 'Dec 10, 2024', createdAt: 'Aug 15, 2024', lastReminderSentAt: '2024-10-24', releasedAt: 'Dec 28, 2024', surveyType: 'course_evaluation', openDate: '2024-08-20', academicYear: '2024–2025', programId: 'prog1' },
  { id: 'fa24-5',  courseCode: 'NURS-505', courseName: 'Fundamentals of Nursing I',                      term: 'Fall 2024', cohort: 'Class of 2028', courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.gomez],    responseRate: 66, responseCount: 30, enrollmentCount: 46, deadline: 'Dec 13, 2024', createdAt: 'Aug 17, 2024', lastReminderSentAt: '2024-10-27', releasedAt: 'Jan 3, 2025',  surveyType: 'course_evaluation', openDate: '2024-08-23', academicYear: '2024–2025', programId: 'prog1' },
  { id: 'fa24-6',  courseCode: 'NURS-511', courseName: 'Medical-Surgical Nursing II', term: 'Fall 2024', cohort: 'Class of 2027', courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.patel],    responseRate: 45, responseCount: 20, enrollmentCount: 44, deadline: 'Dec 14, 2024', createdAt: 'Aug 18, 2024', lastReminderSentAt: '2024-10-28', releasedAt: 'Jan 6, 2025',  surveyType: 'course_evaluation', openDate: '2024-08-24', academicYear: '2024–2025', programId: 'prog1' },
  { id: 'fa24-7',  courseCode: 'NURS-520', courseName: 'Neurological Nursing',       term: 'Fall 2024', cohort: 'Class of 2027', courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.williams], responseRate: 77, responseCount: 31, enrollmentCount: 40, deadline: 'Dec 14, 2024', createdAt: 'Aug 18, 2024', lastReminderSentAt: '2024-10-28', releasedAt: 'Jan 5, 2025',  surveyType: 'course_evaluation', openDate: '2024-08-24', academicYear: '2024–2025', programId: 'prog1' },
  { id: 'fa24-8',  courseCode: 'NURS-530', courseName: 'Maternal-Newborn Nursing',                term: 'Fall 2024', cohort: 'Class of 2027', courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.kim],      responseRate: 88, responseCount: 42, enrollmentCount: 48, deadline: 'Dec 15, 2024', createdAt: 'Aug 19, 2024', lastReminderSentAt: '2024-10-29', releasedAt: 'Dec 29, 2024', surveyType: 'course_evaluation', openDate: '2024-08-25', academicYear: '2024–2025', programId: 'prog1' },
  { id: 'fa24-9',  courseCode: 'NURS-601', courseName: 'Clinical Practicum I',                term: 'Fall 2024', cohort: 'Class of 2026', courseType: 'clinical', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.patel],    responseRate: 52, responseCount: 8,  enrollmentCount: 16, deadline: 'Dec 18, 2024', createdAt: 'Aug 22, 2024', lastReminderSentAt: '2024-11-01', releasedAt: 'Jan 8, 2025',  surveyType: 'course_evaluation', openDate: '2024-08-28', academicYear: '2024–2025', programId: 'prog1' },
  { id: 'fa24-10', courseCode: 'NURS-602', courseName: 'Clinical Practicum II',               term: 'Fall 2024', cohort: 'Class of 2026', courseType: 'clinical', templateId: 'tmpl1', status: 'released', instructors: [INSTRUCTORS.hassan],   responseRate: 74, responseCount: 10, enrollmentCount: 14, deadline: 'Dec 18, 2024', createdAt: 'Aug 22, 2024', lastReminderSentAt: '2024-11-01', releasedAt: 'Jan 7, 2025',  surveyType: 'course_evaluation', openDate: '2024-08-28', academicYear: '2024–2025', programId: 'prog1' },
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
      /* Added 2026-09-17 — once the Course Content tab stopped borrowing
       * faculty comments (each tab now shows only its own evaluation type),
       * mon1's two course comments both landed on 'Course materials' with a
       * concern in the mix, so Highlights rendered empty on the lead demo
       * record. These hit 'Assessment quality' (worked/exam) and 'Pacing'
       * (pace) with no concern comment on either theme. */
      { section: 'course_content', text: 'Worked examples in class made the first exam feel fair.', sentiment: 'positive' },
      { section: 'course_content', text: 'The pace of the opening unit was right for building confidence.', sentiment: 'positive' },
      { section: 'faculty_performance', text: 'The instructor explains palpation techniques clearly.', sentiment: 'positive', facultyId: 'f5' },
      /* Same round, Faculty side: each instructor had only positive comments,
       * so Scope for improvement was the empty state on both Faculty scopes.
       * One concern per instructor — 'Office hours' (available) for f1,
       * 'Assessment quality' (quiz) for f5. */
      { section: 'faculty_performance', text: 'Office hours rarely fall at times that fit the clinical schedule.', sentiment: 'concern', facultyId: 'f1' },
      { section: 'faculty_performance', text: 'Grading turnaround on the weekly quiz could be quicker.', sentiment: 'concern', facultyId: 'f5' },
      /* Added 2026-09-17 (Romit: "can't show empty placeholders for score or
       * highlights") — the ORIGINAL single comment above and any Patel
       * comment matched none of THEME_PATTERNS' keywords (lib/pce-themes.ts),
       * so deriveThemes() produced zero positive themes for EITHER
       * instructor's Faculty-tab scope, even though both now have real
       * scored questions. These two hit the 'Faculty engagement' keyword set
       * cleanly (approachable/organized, communicates) with no concurrent
       * concern comment on that theme, so each instructor's scope gets one
       * real Highlight instead of the empty state. */
      { section: 'faculty_performance', text: 'The instructor is approachable and keeps every session well organized.', sentiment: 'positive', facultyId: 'f1' },
      { section: 'faculty_performance', text: 'The instructor communicates expectations clearly before each skills check.', sentiment: 'positive', facultyId: 'f5' },
    ],
  },
  {
    surveyId: 'mon2',
    sectionScores: [
      { section: 'faculty_performance', avg: 3.8, count: 18 },
    ],
    comments: [
      { section: 'faculty_performance', text: 'Great case discussions in the peds unit, the NICU scenarios especially.', sentiment: 'positive' },
      { section: 'faculty_performance', text: 'Office hours times are hard to make around our Thursday clinical block.', sentiment: 'concern' },
      { section: 'faculty_performance', text: 'Dr. Gomez gives specific, usable feedback after every case presentation.', sentiment: 'positive' },
      { section: 'faculty_performance', text: 'Would help to get the case write-up rubric earlier in the week.', sentiment: 'concern' },
      { section: 'faculty_performance', text: 'Pace of the seminar feels about right so far.', sentiment: 'neutral' },
      { section: 'faculty_performance', text: 'The developmental milestones review session was the best class this term.', sentiment: 'positive' },
    ],
  },
  {
    surveyId: 's1',
    sectionScores: [
      { section: 'course_content', avg: 4.1, count: 34 },
      { section: 'faculty_performance', avg: 4.3, count: 34 },
    ],
    comments: [
      { section: 'faculty_performance', text: 'Very organized and responsive to questions.', sentiment: 'positive', facultyId: 'f1' },
      { section: 'faculty_performance', text: 'Could improve pacing in later sessions.', sentiment: 'concern', facultyId: 'f2' },
      { section: 'faculty_performance', text: 'Very approachable during office hours and always available.', sentiment: 'positive', facultyId: 'f1' },
      { section: 'course_content', text: 'Course materials were well-structured and easy to follow.', sentiment: 'positive' },
      { section: 'course_content', text: 'Some lab sessions felt rushed.', sentiment: 'concern' },
      { section: 'course_content', text: 'The gap between lecture content and exam difficulty was significant.', sentiment: 'concern' },
      { section: 'course_director', text: 'Overall this was one of the stronger courses this term.', sentiment: 'positive' },
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
  /* mon28 — NURS-515 Pharmacology for Nurses · Summer 2026. THE LEAD DEMO
   * RECORD (2026-09-16). Section averages are the means of the per-question
   * scores in MOCK_SURVEY_QUESTION_DATA (course 3.67 → 3.7; faculty is the
   * blend of Chen 3.75 and Gomez 4.15 → 4.0), so the KPI strip, the section
   * cards and the question breakdown all agree. Sentiment is a deliberate
   * positive/constructive mix on BOTH sections so the sentiment split reads as
   * real data rather than a one-sided fixture; 'concern' renders as
   * "Constructive", never red. Faculty comments carry facultyId because this
   * offering has two instructors — an unattributed one stays unattributed. */
  {
    surveyId: 'mon28',
    sectionScores: [
      { section: 'course_content', avg: 3.7, count: 32 },
      { section: 'faculty_performance', avg: 4.0, count: 32 },
    ],
    comments: [
      { section: 'course_content', text: 'The drug-class case studies made the mechanisms much easier to remember.', sentiment: 'positive' },
      { section: 'course_content', text: 'Linking pharmacokinetics to the clinical scenarios was the strongest part of the course.', sentiment: 'positive' },
      { section: 'course_content', text: 'The workload in the cardiac and anticoagulant weeks is heavier than the credit hours suggest.', sentiment: 'concern' },
      { section: 'course_content', text: 'Dosage calculation practice sets came back too late to help before the unit exam.', sentiment: 'concern' },
      { section: 'course_content', text: 'The medication safety module was practical and I used it directly in clinical.', sentiment: 'positive' },
      { section: 'course_content', text: 'The reading list was useful, though some chapters overlapped with pathophysiology.', sentiment: 'neutral' },
      { section: 'faculty_performance', text: 'Dr. Chen is well prepared for every session and the structure of the lectures is easy to follow.', sentiment: 'positive', facultyId: 'f2' },
      { section: 'faculty_performance', text: 'Dr. Chen knows the material well, but the lectures move quickly through the calculation examples.', sentiment: 'concern', facultyId: 'f2' },
      { section: 'faculty_performance', text: 'Grading on the case write-ups felt inconsistent between the two sections.', sentiment: 'concern', facultyId: 'f2' },
      { section: 'faculty_performance', text: 'Dr. Gomez explains adverse-effect profiles clearly and checks that we follow before moving on.', sentiment: 'positive', facultyId: 'f5' },
      { section: 'faculty_performance', text: 'Dr. Gomez gave specific, usable feedback on every medication administration write-up.', sentiment: 'positive', facultyId: 'f5' },
      { section: 'faculty_performance', text: 'Dr. Gomez covers a lot of ground each session; a short recap at the start would help.', sentiment: 'neutral', facultyId: 'f5' },
      { section: 'faculty_performance', text: 'More worked examples during class would help before we attempt the practice sets.', sentiment: 'concern' },
    ],
  },

  // ── University of Nursing demo account (BSN/MSN dummy-data scenario) ────
  { surveyId: 'uon-f1', sectionScores: [{ section: 'course_content', avg: 4.3, count: 59 }, { section: 'faculty_performance', avg: 4.4, count: 59 }],
    comments: [
      { section: 'course_content', text: 'The skills lab progression builds really well, vitals, then hygiene care, then medication administration basics, each week stacking on the last.', sentiment: 'positive' },
      { section: 'course_content', text: 'The care-plan writing assignment felt rushed right before the midterm.', sentiment: 'concern' },
      { section: 'faculty_performance', text: 'Dr. Patel is incredibly organized and responsive to messages, usually within a day.', sentiment: 'positive', facultyId: 'f1' },
      { section: 'faculty_performance', text: 'She holds office hours every week and actually walks you through the dosage math instead of just giving the answer.', sentiment: 'positive', facultyId: 'f1' },
      { section: 'course_content', text: 'Some of the assigned readings repeat what the skills lab already covers, so the reading load felt heavier than it needed to be.', sentiment: 'concern' },
    ] },
  { surveyId: 'uon-f2', sectionScores: [{ section: 'course_content', avg: 3.2, count: 34 }, { section: 'faculty_performance', avg: 3.6, count: 34 }],
    comments: [
      { section: 'course_content', text: 'The head-to-toe assessment checklist is long, and getting through all the systems in one lab session felt rushed.', sentiment: 'concern' },
      { section: 'course_content', text: 'Some of the practice videos are low resolution and hard to follow for auscultation technique.', sentiment: 'concern' },
      { section: 'faculty_performance', text: 'Dr. Kim gives clear, worked examples when demonstrating percussion technique.', sentiment: 'positive', facultyId: 'f4' },
      { section: 'faculty_performance', text: 'Office hours conflict with our clinical rotation block on Wednesdays, so it is hard to get one-on-one time.', sentiment: 'concern', facultyId: 'f4' },
      { section: 'faculty_performance', text: 'Dr. Kim is approachable one-on-one and genuinely helpful when you catch him after class.', sentiment: 'positive', facultyId: 'f4' },
    ] },
  { surveyId: 'uon-f3', sectionScores: [{ section: 'course_content', avg: 2.8, count: 22 }, { section: 'faculty_performance', avg: 3.1, count: 22 }],
    comments: [
      { section: 'course_content', text: 'The lecture slides have not been updated and still reference the old disease-classification system.', sentiment: 'concern' },
      { section: 'course_content', text: 'The exams are much harder than the practice quizzes, there is a real gap in difficulty.', sentiment: 'concern' },
      { section: 'course_content', text: 'Would help to have more structure, right now it feels like a wall of content with no roadmap.', sentiment: 'concern' },
      { section: 'faculty_performance', text: 'Dr. Williams is knowledgeable but lectures move very fast through the compensatory-mechanisms sections.', sentiment: 'concern', facultyId: 'f3' },
      { section: 'faculty_performance', text: 'When she does slow down for questions, the explanations are excellent.', sentiment: 'positive', facultyId: 'f3' },
      { section: 'faculty_performance', text: 'Dr. Williams is responsive on email and clearly wants us to pass, even when the content is brutal.', sentiment: 'positive', facultyId: 'f3' },
    ] },
  // Edge case: controversial — comments split cleanly on the SAME aspects
  // (dosage exams, pacing, office hours) after the mid-term format change.
  { surveyId: 'uon-f4', sectionScores: [{ section: 'course_content', avg: 3.2, count: 62 }, { section: 'faculty_performance', avg: 3.9, count: 62 }],
    comments: [
      { section: 'course_content', text: 'The worked examples in the new case-based drug-class studies made dosage calculation finally click for me.', sentiment: 'positive' },
      { section: 'course_content', text: 'The switch to the new case-based dosage format happened without enough warm-up, the exam jumped in difficulty overnight and a lot of the class failed the first attempt.', sentiment: 'concern' },
      { section: 'course_content', text: 'Loved the structure this term, grouping drugs by mechanism instead of memorizing a list one by one.', sentiment: 'positive' },
      { section: 'course_content', text: 'A new grading rubric was added two weeks before the midterm without much notice.', sentiment: 'concern' },
      { section: 'faculty_performance', text: 'Dr. Chen is incredibly engaging and clearly loves pharmacology, his drug-classification framework made the mechanisms click.', sentiment: 'positive', facultyId: 'f2' },
      { section: 'faculty_performance', text: 'The pace through the cardiac and renal drug units was too fast for how dense the dosage math is.', sentiment: 'concern', facultyId: 'f2' },
      { section: 'faculty_performance', text: 'Office hours were packed after the format change, it was hard to get help before the exam.', sentiment: 'concern', facultyId: 'f2' },
      { section: 'faculty_performance', text: "The instructor's antibiotic stewardship unit was one of the most engaging and well-organized parts of the semester.", sentiment: 'positive', facultyId: 'f5' },
      { section: 'faculty_performance', text: 'Dr. Gomez\'s stewardship cases were organized and easy to follow; more of the course should run that way.', sentiment: 'positive', facultyId: 'f5' },
      { section: 'course_content', text: 'Either you loved the case-based format or it wrecked your grade. There was no middle ground in our cohort.', sentiment: 'concern' },
      { section: 'course_content', text: 'Best pharmacology course I have taken. The mechanism-first approach is how every drug class should be taught.', sentiment: 'positive' },
    ] },
  { surveyId: 'uon-f5', sectionScores: [{ section: 'course_content', avg: 4.2, count: 40 }, { section: 'faculty_performance', avg: 4.4, count: 40 }],
    comments: [
      { section: 'course_content', text: 'The case-study material is realistic and genuinely prepared me for what I saw on the floor during clinical.', sentiment: 'positive' },
      { section: 'course_content', text: 'The wound-care skills lab felt rushed, we only got through half the stations.', sentiment: 'concern' },
      { section: 'course_content', text: 'Assignments were challenging but fair, and matched the exam difficulty well.', sentiment: 'positive' },
      { section: 'faculty_performance', text: 'Dr. Patel is approachable and gives detailed feedback on our SBAR write-ups.', sentiment: 'positive', facultyId: 'f1' },
      { section: 'faculty_performance', text: "Office hours are available and she'll walk through a whole case with you if you're stuck.", sentiment: 'positive', facultyId: 'f1' },
    ] },
  { surveyId: 'uon-f6', sectionScores: [{ section: 'course_content', avg: 3.8, count: 11 }, { section: 'faculty_performance', avg: 4.0, count: 11 }],
    comments: [
      { section: 'course_content', text: 'The newborn assessment simulation lab was one of the best hands-on sessions so far.', sentiment: 'positive' },
      { section: 'course_content', text: 'Only a few weeks in, but the reading load already feels heavy relative to other courses this term.', sentiment: 'concern' },
      { section: 'faculty_performance', text: 'Dr. Gomez is approachable and clearly passionate about maternal health.', sentiment: 'positive', facultyId: 'f5' },
      { section: 'faculty_performance', text: 'Her posted office hours overlap with our clinical rotation, more availability outside that block would help.', sentiment: 'concern', facultyId: 'f5' },
    ] },
  { surveyId: 'uon-f7', sectionScores: [{ section: 'course_content', avg: 3.6, count: 9 }, { section: 'faculty_performance', avg: 3.9, count: 9 }],
    comments: [
      { section: 'course_content', text: 'Hard to say much yet, but the growth-and-development unit moved fast before we had even seen a pediatric patient in clinical.', sentiment: 'concern' },
      { section: 'course_content', text: 'Would help to have more worked examples for the pediatric weight-based dosage calculations.', sentiment: 'concern' },
      { section: 'faculty_performance', text: 'Dr. Williams is organized and posts materials well ahead of each session.', sentiment: 'positive', facultyId: 'f3' },
      { section: 'course_content', text: 'The pace in the first half was manageable and the weekly structure helped me keep up.', sentiment: 'positive' },
      { section: 'faculty_performance', text: 'Dr. Williams explains growth-and-development milestones in a way that is engaging and easy to remember.', sentiment: 'positive', facultyId: 'f3' },
    ] },
  // Edge case: stellar/perfect — no real complaints, one mild suggestion.
  { surveyId: 'uon-f8', sectionScores: [{ section: 'course_content', avg: 4.8, count: 30 }, { section: 'faculty_performance', avg: 4.9, count: 30 }],
    comments: [
      { section: 'course_content', text: 'Best clinical placement experience in the program so far, the preceptor match and unit orientation were excellent.', sentiment: 'positive' },
      { section: 'course_content', text: 'Pairing simulation lab practice before the first hospital shift made me feel prepared instead of thrown in.', sentiment: 'positive' },
      { section: 'course_content', text: 'One more simulation day before the first shift would help students who have not done IV starts yet.', sentiment: 'neutral' },
      { section: 'faculty_performance', text: 'Dr. Hassan is incredibly responsive, he answers a clinical question within the hour even outside office hours.', sentiment: 'positive', facultyId: 'f6' },
      { section: 'faculty_performance', text: 'Dr. Hassan gave the most useful, specific feedback on my clinical documentation of any instructor I have had.', sentiment: 'positive', facultyId: 'f6' },
      { section: 'faculty_performance', text: "Dr. Kim's post-clinical debrief sessions are the most helpful part of my week, he is engaging and makes you comfortable admitting what you did not know.", sentiment: 'positive', facultyId: 'f4' },
      { section: 'course_content', text: 'The pace of the first two shifts was fast for those of us who had never been on a med-surg floor.', sentiment: 'concern' },
      { section: 'course_content', text: 'The skills lab prep packets were helpful, though the reading list could be trimmed.', sentiment: 'concern' },
      { section: 'faculty_performance', text: 'Dr. Kim debriefs every shift with us and is always available when a patient situation gets tense.', sentiment: 'positive', facultyId: 'f4' },
    ] },
  { surveyId: 'uon-f9', sectionScores: [{ section: 'course_content', avg: 3.4, count: 21 }, { section: 'faculty_performance', avg: 3.7, count: 21 }],
    comments: [
      { section: 'course_content', text: 'The therapeutic-communication role-plays were uncomfortable at first but genuinely useful practice.', sentiment: 'positive' },
      { section: 'course_content', text: 'The unit on personality disorders felt rushed compared to how much time we spent on mood disorders.', sentiment: 'concern' },
      { section: 'faculty_performance', text: 'Dr. Chen is engaging and creates a safe space to discuss difficult case material.', sentiment: 'positive', facultyId: 'f2' },
      { section: 'faculty_performance', text: 'Feedback on our process recordings takes a while to come back, usually over two weeks.', sentiment: 'concern', facultyId: 'f2' },
      { section: 'course_content', text: 'The exam questions went far deeper than the de-escalation scenarios we practiced in class.', sentiment: 'concern' },
    ] },
  { surveyId: 'uon-f10', sectionScores: [{ section: 'course_content', avg: 3.7, count: 8 }, { section: 'faculty_performance', avg: 4.1, count: 8 }],
    comments: [
      { section: 'course_content', text: "The graduate-level pace is intense, we're covering two undergrad units' worth of content per week.", sentiment: 'concern' },
      { section: 'course_content', text: 'Would help to have example problems worked through in class before the graded case analyses.', sentiment: 'concern' },
      { section: 'faculty_performance', text: 'Dr. Williams brings in relevant recent research and is clearly an expert.', sentiment: 'positive', facultyId: 'f3' },
      { section: 'faculty_performance', text: 'Dr. Williams is engaging even in a three-hour evening block and answers questions thoroughly.', sentiment: 'positive', facultyId: 'f3' },
      { section: 'course_content', text: 'The worked examples in the case conferences were the most useful part of the term.', sentiment: 'positive' },
    ] },
  { surveyId: 'uon-s1', sectionScores: [{ section: 'course_content', avg: 4.3, count: 36 }, { section: 'faculty_performance', avg: 4.4, count: 36 }],
    comments: [
      { section: 'course_content', text: 'Same well-paced structure as always, the lab sequence makes fundamentals finally click.', sentiment: 'positive' },
      { section: 'course_content', text: 'Some of the assigned readings are outdated and reference equipment we do not use anymore.', sentiment: 'concern' },
      { section: 'faculty_performance', text: "Dr. Patel's feedback on our care plans came back fast and was genuinely useful.", sentiment: 'positive', facultyId: 'f1' },
      { section: 'course_content', text: 'Summer office hours were only on Tuesdays, which was hard to reach once the term compressed everything.', sentiment: 'concern' },
      { section: 'faculty_performance', text: 'Dr. Patel is organized and clearly communicates what each week expects of us.', sentiment: 'positive', facultyId: 'f1' },
    ] },
  { surveyId: 'uon-s2', sectionScores: [{ section: 'course_content', avg: 3.3, count: 19 }, { section: 'faculty_performance', avg: 3.6, count: 19 }],
    comments: [
      { section: 'course_content', text: 'The exams still test different material than what is emphasized in lecture.', sentiment: 'concern' },
      { section: 'course_content', text: 'Readings are dense and not well organized by system.', sentiment: 'concern' },
      { section: 'faculty_performance', text: "Office hours were actually really helpful once I started going, she'll work through a whole case with you.", sentiment: 'positive', facultyId: 'f3' },
      { section: 'faculty_performance', text: 'Dr. Williams stayed after every session to walk through the cases we missed, genuinely helpful.', sentiment: 'positive', facultyId: 'f3' },
    ] },
  { surveyId: 'uon-s3', sectionScores: [{ section: 'course_content', avg: 4.1, count: 44 }, { section: 'faculty_performance', avg: 4.3, count: 44 }],
    comments: [
      { section: 'course_content', text: 'The case-based dosage modules are much smoother now that there is a practice set before each graded case.', sentiment: 'positive' },
      { section: 'course_content', text: 'Still a heavy workload for a summer term, the pace felt fast for eight weeks.', sentiment: 'concern' },
      { section: 'faculty_performance', text: "Dr. Chen's drug-classification approach makes so much more sense than straight memorization.", sentiment: 'positive', facultyId: 'f2' },
      { section: 'faculty_performance', text: 'Office hours were easy to get into this term, no more crowding.', sentiment: 'positive', facultyId: 'f2' },
      { section: 'course_content', text: 'The pacing through the antibiotic unit was just right.', sentiment: 'positive' },
      { section: 'course_content', text: 'The drug-card reading packets had several outdated brand names.', sentiment: 'concern' },
    ] },
  { surveyId: 'uon-s4', sectionScores: [{ section: 'course_content', avg: 3.9, count: 10 }, { section: 'faculty_performance', avg: 4.1, count: 10 }],
    comments: [
      { section: 'course_content', text: 'Compressed into an eight-week summer format, the pacing was tough to keep up with.', sentiment: 'concern' },
      { section: 'course_content', text: 'Wish there were more structured practice quizzes before the unit exams.', sentiment: 'concern' },
      { section: 'faculty_performance', text: 'Dr. Gomez is responsive over email even during the condensed summer schedule.', sentiment: 'positive', facultyId: 'f5' },
      { section: 'course_content', text: 'The practice quizzes before each exam were the best prep we had all term.', sentiment: 'positive' },
      { section: 'faculty_performance', text: 'Dr. Gomez is approachable and responsive, even during the compressed summer schedule.', sentiment: 'positive', facultyId: 'f5' },
    ] },
  { surveyId: 'uon-s5', sectionScores: [{ section: 'course_content', avg: 4.4, count: 28 }, { section: 'faculty_performance', avg: 4.5, count: 28 }],
    comments: [
      { section: 'course_content', text: 'The case-analysis structure this term was much better paced than what I had heard from the Fall cohort.', sentiment: 'positive' },
      { section: 'course_content', text: 'The recommended readings were exactly the right depth for graduate work.', sentiment: 'positive' },
      { section: 'faculty_performance', text: 'Dr. Hassan is extremely responsive and available even though this is a small cohort.', sentiment: 'positive', facultyId: 'f6' },
      { section: 'faculty_performance', text: 'Office hours turned into informal case-consult sessions, genuinely valuable.', sentiment: 'positive', facultyId: 'f6' },
      { section: 'course_content', text: 'The final exam weighting at 50% felt heavy for a six-week term.', sentiment: 'concern' },
      { section: 'course_content', text: 'Some reading assignments overlapped with what the lecture already covered.', sentiment: 'concern' },
    ] },
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
  { id: 'mc1',  code: 'NURS-501', name: 'Human Anatomy & Physiology',         department: 'Core Sciences',      type: 'didactic',  status: 'active',   lastEdited: '2026-04-12', editedBy: 'Dr. Chen'     },
  { id: 'mc2',  code: 'NURS-502', name: 'Physiology & Pathophysiology',         department: 'Core Sciences',      type: 'didactic',  status: 'active',   lastEdited: '2026-03-22', editedBy: 'Dr. Williams' },
  { id: 'mc3',  code: 'NURS-503', name: 'Pharmacology for Nurses', department: 'Core Sciences',      type: 'didactic',  status: 'active',   lastEdited: '2026-02-14', editedBy: 'Dr. Williams' },
  { id: 'mc4',  code: 'NURS-504', name: 'Health Assessment',                         department: 'Core Sciences',      type: 'didactic',  status: 'active',   lastEdited: '2025-11-30', editedBy: 'Dr. Kim'      },
  { id: 'mc5',  code: 'NURS-505', name: 'Fundamentals of Nursing I', department: 'Clinical Sciences',  type: 'didactic',  status: 'active',   lastEdited: '2026-01-15', editedBy: 'Dr. Gomez'    },
  // Year 2 — Clinical Sciences (Didactic)
  { id: 'mc6',  code: 'NURS-510', name: 'Medical-Surgical Nursing I',   department: 'Nursing',   type: 'didactic',  status: 'active',   lastEdited: '2026-01-20', editedBy: 'Dr. Patel'    },
  { id: 'mc7',  code: 'NURS-511', name: 'Medical-Surgical Nursing II',  department: 'Nursing',   type: 'didactic',  status: 'active',   lastEdited: '2026-04-20', editedBy: 'Dr. Patel'    },
  { id: 'mc8',  code: 'NURS-520', name: 'Neurological Nursing',        department: 'Nursing',   type: 'didactic',  status: 'active',   lastEdited: '2026-03-05', editedBy: 'Dr. Williams' },
  { id: 'mc9',  code: 'NURS-530', name: 'Maternal-Newborn Nursing',     department: 'Nursing',   type: 'didactic',  status: 'active',   lastEdited: '2026-02-18', editedBy: 'Dr. Kim'      },
  { id: 'mc10', code: 'NURS-540', name: 'Clinical Reasoning & Diagnostics',               department: 'Clinical Sciences',  type: 'didactic',  status: 'active',   lastEdited: '2026-01-10', editedBy: 'Dr. Hassan'   },
  { id: 'mc11', code: 'NURS-610', name: 'Geriatric Nursing',           department: 'Nursing',   type: 'didactic',  status: 'active',   lastEdited: '2026-01-12', editedBy: 'Dr. Gomez'    },
  // Specialty Electives (Didactic)
  { id: 'mc12', code: 'NURS-611', name: 'Pediatric Nursing',           department: 'Nursing',   type: 'didactic',  status: 'active',   lastEdited: '2026-01-08', editedBy: 'Dr. Gomez'    },
  // Clinical Education (Clinical)
  { id: 'mc14', code: 'NURS-601', name: 'Clinical Practicum I',                 department: 'Clinical Education', type: 'clinical',  status: 'active',   lastEdited: '2026-04-01', editedBy: 'Dr. Patel'    },
  { id: 'mc15', code: 'NURS-602', name: 'Clinical Practicum II',                department: 'Clinical Education', type: 'clinical',  status: 'active',   lastEdited: '2026-04-01', editedBy: 'Dr. Hassan'   },
  { id: 'mc16', code: 'NURS-603', name: 'Clinical Practicum III (Full-Time)',   department: 'Clinical Education', type: 'clinical',  status: 'active',   lastEdited: '2025-12-10', editedBy: 'Dr. Patel'    },
  // ── Offered but previously uncatalogued ──────────────────────────────────────
  // These six had offerings and surveys but no master entry, so the catalogue and the data
  // disagreed about what the program even teaches. Added here rather than deleted from the
  // offerings: they carry real evaluation history, which makes them real courses.
  { id: 'mc17', code: 'NURS-506', name: 'Fundamentals of Nursing II',                     department: 'Core Sciences',      type: 'didactic',  status: 'active',   lastEdited: '2026-02-08', editedBy: 'Dr. Kim'      },
  { id: 'mc18', code: 'NURS-515', name: 'Pharmacology for Nurses', department: 'Clinical Sciences', type: 'didactic',  status: 'active',   lastEdited: '2026-01-15', editedBy: 'Dr. Gomez'    },
  { id: 'mc19', code: 'NURS-620', name: 'Geriatric Nursing',          department: 'Nursing',   type: 'didactic',  status: 'active',   lastEdited: '2026-02-14', editedBy: 'Dr. Hassan'   },
  { id: 'mc20', code: 'NURS-710', name: 'Advanced Neurological Nursing',                  department: 'Nursing',   type: 'didactic',  status: 'active',   lastEdited: '2026-03-02', editedBy: 'Dr. Kim'      },
  { id: 'mc21', code: 'NURS-711', name: 'Advanced Pediatric Nursing',                     department: 'Nursing',   type: 'didactic',  status: 'active',   lastEdited: '2026-03-02', editedBy: 'Dr. Williams' },
  { id: 'mc22', code: 'NURS-801', name: 'Evidence-Based Practice',             department: 'Research',           type: 'seminar',   status: 'active',   lastEdited: '2026-03-28', editedBy: 'Dr. Williams' },
  // ── University of Nursing demo account (BSN/MSN dummy-data scenario) ────
  { id: 'mc23', code: 'BSN-101', name: 'Fundamentals of Nursing I',            department: 'Nursing', type: 'didactic', status: 'active', lastEdited: '2026-07-01', editedBy: 'Dr. Patel' },
  { id: 'mc24', code: 'BSN-115', name: 'Health Assessment',                   department: 'Nursing', type: 'didactic', status: 'active', lastEdited: '2026-07-01', editedBy: 'Dr. Kim' },
  { id: 'mc25', code: 'BSN-201', name: 'Pathophysiology',                     department: 'Core Sciences', type: 'didactic', status: 'active', lastEdited: '2026-07-01', editedBy: 'Dr. Williams' },
  { id: 'mc26', code: 'BSN-210', name: 'Pharmacology for Nurses',             department: 'Core Sciences', type: 'didactic', status: 'active', lastEdited: '2026-07-01', editedBy: 'Dr. Chen' },
  { id: 'mc27', code: 'BSN-305', name: 'Medical-Surgical Nursing I',          department: 'Nursing', type: 'didactic', status: 'active', lastEdited: '2026-07-01', editedBy: 'Dr. Patel' },
  { id: 'mc28', code: 'BSN-315', name: 'Maternal-Newborn Nursing',            department: 'Nursing', type: 'clinical', status: 'active', lastEdited: '2026-07-01', editedBy: 'Dr. Gomez' },
  { id: 'mc29', code: 'BSN-325', name: 'Pediatric Nursing',                   department: 'Nursing', type: 'clinical', status: 'active', lastEdited: '2026-07-01', editedBy: 'Dr. Williams' },
  { id: 'mc30', code: 'BSN-401', name: 'Clinical Practicum I',                department: 'Clinical Education', type: 'clinical', status: 'active', lastEdited: '2026-07-01', editedBy: 'Dr. Hassan' },
  { id: 'mc31', code: 'BSN-415', name: 'Psychiatric-Mental Health Nursing',   department: 'Nursing', type: 'didactic', status: 'active', lastEdited: '2026-07-01', editedBy: 'Dr. Chen' },
  { id: 'mc32', code: 'MSN-601', name: 'Advanced Pathophysiology',            department: 'Graduate Nursing', type: 'didactic', status: 'active', lastEdited: '2026-07-01', editedBy: 'Dr. Williams' },
]

export const MOCK_PROGRAM_TERMS: ProgramTerm[] = [
  // endDate + 7d grace runs right up to pt5's Aug 24 start, so "current" hands
  // off from Spring to Fall with no gap regardless of what day this is viewed
  // (was Jul 15 — drifted stale once "today" passed Jul 22, breaking every
  // demo scenario and the real default dashboard's Current-term card).
  { id: 'pt1', name: 'Spring 2026', season: 'Spring', academicYear: '2025–2026', startDate: '2026-01-12', endDate: '2026-08-16', status: 'active',   enabledForEval: true,  lastReminderSentAt: '2026-06-24' },
  // A real, independently-scored term — added for the Sep 14 2026 dashboard/analytics
  // feedback ("Last closed term should be Summer 2026, dates between May and August").
  // endDate (Aug 20) lands one bit later than pt1's own Aug 16 so it — not pt1 — wins
  // the "most recent Last term" slot in `resolveTermPositions`; pt1 still surfaces in
  // the Past-terms history table and stays independently selectable everywhere else
  // (Analytics' term filter keeps Spring 2026 as its own option, per the same feedback:
  // "option to also select Spring 2026 and Fall 2026" — this is an ADDED term, not a
  // rename of pt1, so nothing that already reads 'Spring 2026' breaks).
  { id: 'pt9', name: 'Summer 2026', season: 'Summer', academicYear: '2025–2026', startDate: '2026-05-18', endDate: '2026-08-20', status: 'active',   enabledForEval: true  },
  { id: 'pt2', name: 'Fall 2025',   season: 'Fall',   academicYear: '2025–2026', startDate: '2025-08-25', endDate: '2025-12-12', status: 'archived', enabledForEval: false },
  { id: 'pt3', name: 'Spring 2025', season: 'Spring', academicYear: '2024–2025', startDate: '2025-01-13', endDate: '2025-05-09', status: 'archived', enabledForEval: false },
  { id: 'pt4', name: 'Fall 2024',   season: 'Fall',   academicYear: '2024–2025', startDate: '2024-08-26', endDate: '2024-12-13', status: 'archived', enabledForEval: false },
  { id: 'pt5', name: 'Fall 2026',   season: 'Fall',   academicYear: '2026–2027', startDate: '2026-08-24', endDate: '2026-12-11', status: 'active',   enabledForEval: true  },
  // New future term — genuinely nothing scheduled yet (no PceSurvey rows below).
  { id: 'pt6', name: 'Spring 2027', season: 'Spring', academicYear: '2026–2027', startDate: '2027-01-11', endDate: '2027-05-08', status: 'active',   enabledForEval: true  },
  { id: 'pt7', name: 'Fall 2027',   season: 'Fall',   academicYear: '2027–2028', startDate: '2027-08-23', endDate: '2027-12-10', status: 'active',   enabledForEval: true  },
  { id: 'pt8', name: 'Spring 2028', season: 'Spring', academicYear: '2027–2028', startDate: '2028-01-10', endDate: '2028-05-06', status: 'active',   enabledForEval: true  },
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
  classroom: 'Didactic',
  lab: 'Lab',
  practice: 'Experiential',
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
  /** Co-instructors holding the SAME Instructor association as collaboratorIds[0]
   *  — added later in Prism (UC2: late-added co-instructor after a survey is
   *  live). Each expands to its own survey instance in the push wizard. */
  coInstructorIds?: string[]
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
// Per Aarti 2026-05-08 16:09 D6 + D7 the product originally shipped a
// broader PCE-program role model (admin / course-coordinator / instructor /
// collaborator read-only / co-edit) covering Questions, Assessments,
// Students, Accommodations. The Course Survey module now has its own
// confirmed RBAC spec (see SurveyRbacRoleKey below, sourced from the Course
// Survey RBAC spreadsheet + Granola transcripts) — as of 2026-09-01 this
// grant system runs on THAT vocabulary so the Assignments roster and the
// Permissions matrix reference the same 5 roles instead of two disjoint
// role sets. The old collaborator concept has no equivalent in the
// confirmed spec and was dropped from this surface; revisit if a future
// requirement reintroduces ad-hoc sharing outside the 5 official roles.
export interface RoleAssignment {
  id: string
  facultyId: string  // FK
  /** 'none' = added without an administrative role (Sep 1 sync: admin needs a way to
   *  add a user before any course association resolves them to Course Manager/Instructor). */
  role: SurveyRbacRoleKey | 'none'
  /** Scope: 'global' (institution/program-wide) or 'none' (no administrative grant). */
  scope: 'global' | 'none' | string
  grantedAt: string
  grantedBy: string
}

// Course Manager / Instructor are NEVER manual grants (Sep 1 sync, Vishal, verbatim:
// "you cannot select course manager [when adding a user]... these are decided based
// on the associations") — resolved live from MOCK_COURSE_OFFERINGS faculty
// associations via facultyEvalRole() + the tenant's RBAC↔faculty-role mapping (see
// DEFAULT_RBAC_FACULTY_ROLE_MAP below). Only administrative roles are stored grants.
export const MOCK_ROLE_ASSIGNMENTS: RoleAssignment[] = [
  { id: 'ra1', facultyId: 'f1', role: 'super-admin',           scope: 'global', grantedAt: '2024-08-01', grantedBy: 'System' },
  { id: 'ra2', facultyId: 'f3', role: 'program-admin',         scope: 'global', grantedAt: '2025-08-20', grantedBy: 'System' },
  { id: 'ra3', facultyId: 'f4', role: 'program-admin-limited', scope: 'global', grantedAt: '2025-08-20', grantedBy: 'Dr. Patel (Super Admin)' },
]

// Course Survey RBAC — the confirmed 5-role model, shared by the Assignments
// grant roster (above) and the Permissions matrix reference (below).
//
// Source: Course Survey RBAC spreadsheet (Romit, 2026-09-01) + Granola "Course
// evaluation survey — roles, status tracking, and response rate thresholds"
// (Vishal + Monil, 2026-08-12) confirming the 5-role model: "five kind of main
// roles that we aligned on — super user... admin side is divided into two parts,
// the setup part... and administrator or program director, more of the content...
// and then course and course affiliation."
//
// The itemized `includes` lists on SURVEY_RBAC_MATRIX below are read from the
// spreadsheet's grouped legend (User / Survey / Setup / Feedback sections) and
// assigned to the function group they most plausibly belong to — the source
// screenshot did not give a verified per-item × per-role breakdown, only the 4
// top-level group columns. Confirm item-to-group placement with Vishal/Monil
// before treating as final.
export type SurveyRbacRoleKey = 'super-admin' | 'program-admin' | 'program-admin-limited' | 'course-manager' | 'instructor'

export interface SurveyRbacRole {
  key: SurveyRbacRoleKey
  label: string
  facultyRoles: string
  scope: string
  /** One-sentence capability summary — used in the Grant role dialog + role-badge tooltips. */
  description: string
}

export const SURVEY_RBAC_ROLES: SurveyRbacRole[] = [
  {
    key: 'super-admin', label: 'Super Admin', facultyRoles: '—', scope: 'Institution',
    description: 'Full access to every function across the institution, including program setup, course survey admin, and all feedback.',
  },
  {
    key: 'program-admin', label: 'Program Admin', facultyRoles: '—', scope: 'Program',
    description: 'Full access to program setup, course survey admin, and all feedback within their program.',
  },
  {
    key: 'program-admin-limited', label: 'Program Admin Limited', facultyRoles: '—', scope: 'Program',
    description: 'Program setup and course survey admin within their program. Cannot view course or instructor feedback.',
  },
  {
    key: 'course-manager', label: 'Course Manager', facultyRoles: 'Course Coordinator, Course Director', scope: 'Course',
    description: 'Views course feedback and their own feedback as an instructor. No survey setup or push/reminder access.',
  },
  {
    key: 'instructor', label: 'Instructor', facultyRoles: 'Instructor, Co-instructor', scope: 'Associated feedback',
    description: 'Views only their own instructor feedback. No course feedback or survey admin access.',
  },
]

export type SurveyRbacAccess = 'full' | 'self' | 'none'

export interface SurveyRbacFunctionGroup {
  key: string
  label: string
  includes: string[]
  access: Record<SurveyRbacRoleKey, SurveyRbacAccess>
}

export const SURVEY_RBAC_MATRIX: SurveyRbacFunctionGroup[] = [
  {
    key: 'program-setup',
    label: 'Program setup & access controls',
    includes: ['User Management', 'Access controls', 'Survey Templates', 'Email Templates', 'Terms Setup', 'Benchmarks'],
    access: { 'super-admin': 'full', 'program-admin': 'full', 'program-admin-limited': 'full', 'course-manager': 'none', 'instructor': 'none' },
  },
  {
    key: 'course-survey-admin',
    label: 'Course survey admin (push, reminders)',
    includes: ['Push survey', 'Send reminders', 'Survey list', 'Response Rate', 'Flag/hide feedback', 'Release feedback', 'Export Feedback'],
    access: { 'super-admin': 'full', 'program-admin': 'full', 'program-admin-limited': 'full', 'course-manager': 'none', 'instructor': 'none' },
  },
  {
    key: 'view-course-feedback',
    label: 'View course feedback',
    includes: ['Quantitative feedback', 'Qualitative feedback', 'AI Insights'],
    access: { 'super-admin': 'full', 'program-admin': 'full', 'program-admin-limited': 'none', 'course-manager': 'full', 'instructor': 'none' },
  },
  {
    key: 'view-instructor-feedback',
    label: 'View instructor feedback',
    includes: ['Quantitative feedback', 'Qualitative feedback', 'AI Insights'],
    access: { 'super-admin': 'full', 'program-admin': 'full', 'program-admin-limited': 'none', 'course-manager': 'self', 'instructor': 'self' },
  },
]

/** Which of a tenant's Prism course-association roles (EVAL_FACULTY_ROLES) resolve to
 *  Course Manager vs Instructor — the "merge as a column into this grid" mapping from
 *  the Sep 1 sync (Vishal, verbatim: "you're adding a new column here which says
 *  faculty roles... in a way you are merging these into this"). Admin-editable on the
 *  Permissions matrix tab; drives the derived (non-grantable) Course Manager/Instructor
 *  rows on the Assignments tab via facultyEvalRole(). */
export type RbacFacultyRoleMap = Record<'course-manager' | 'instructor', FacultyEvalRoleId[]>

export const DEFAULT_RBAC_FACULTY_ROLE_MAP: RbacFacultyRoleMap = {
  'course-manager': ['course-coordinator'],
  'instructor': ['instructor'],
}

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
  { id: 'ac12', code: 'CST', name: 'Custom · service animal',    description: 'Service animal accommodation per school policy', category: 'other',         isCustom: true,  status: 'active' },
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

  // ── Summer 2026 (pt9) — closed term, real scored data (see MOCK_FACULTY_OFFERINGS) ──
  { id: 'co78', masterCourseId: 'mc1',  termId: 'pt9', cohort: 'Class of 2028', primaryFacultyId: 'f1', collaboratorIds: [], enrolledCount: 50, status: 'completed', courseType: 'didactic' },
  { id: 'co79', masterCourseId: 'mc6',  termId: 'pt9', cohort: 'Class of 2028', primaryFacultyId: 'f1', collaboratorIds: [], enrolledCount: 42, status: 'completed', courseType: 'didactic' },
  { id: 'co80', masterCourseId: 'mc18', termId: 'pt9', cohort: 'Class of 2028', primaryFacultyId: 'f2', collaboratorIds: [], enrolledCount: 46, status: 'completed', courseType: 'didactic' },
  { id: 'co81', masterCourseId: 'mc10', termId: 'pt9', cohort: 'Class of 2028', primaryFacultyId: 'f2', collaboratorIds: [], enrolledCount: 38, status: 'completed', courseType: 'didactic' },
  { id: 'co82', masterCourseId: 'mc2',  termId: 'pt9', cohort: 'Class of 2028', primaryFacultyId: 'f3', collaboratorIds: [], enrolledCount: 54, status: 'completed', courseType: 'didactic' },
  { id: 'co83', masterCourseId: 'mc12', termId: 'pt9', cohort: 'Class of 2027', primaryFacultyId: 'f3', collaboratorIds: [], enrolledCount: 30, status: 'completed', courseType: 'clinical' },
  { id: 'co84', masterCourseId: 'mc9',  termId: 'pt9', cohort: 'Class of 2027', primaryFacultyId: 'f4', collaboratorIds: [], enrolledCount: 44, status: 'completed', courseType: 'clinical' },
  { id: 'co85', masterCourseId: 'mc19', termId: 'pt9', cohort: 'Class of 2027', primaryFacultyId: 'f5', collaboratorIds: [], enrolledCount: 34, status: 'completed', courseType: 'didactic' },
  { id: 'co86', masterCourseId: 'mc22', termId: 'pt9', cohort: 'Class of 2026', primaryFacultyId: 'f6', collaboratorIds: [], enrolledCount: 32, status: 'completed', courseType: 'didactic' },

  // ── Fall 2026 (pt5) — full term ──────────────────────────────────────────
  // Year 1 — Foundations
  { id: 'co9',  masterCourseId: 'mc1',  termId: 'pt5', cohort: 'Year 1 – Section A', primaryFacultyId: 'f2', collaboratorIds: ['f1'], enrolledCount: 48, status: 'active',    courseType: 'didactic' },
  { id: 'co10', masterCourseId: 'mc2',  termId: 'pt5', cohort: 'Year 1 – Section B', primaryFacultyId: 'f3', collaboratorIds: [],     enrolledCount: 48, status: 'active',    courseType: 'didactic' },
  { id: 'co11', masterCourseId: 'mc3',  termId: 'pt5', cohort: 'Year 1 – Section C', primaryFacultyId: 'f4', collaboratorIds: ['f4'],     enrolledCount: 46, status: 'active',    courseType: 'didactic' },
  { id: 'co12', masterCourseId: 'mc5',  termId: 'pt5', cohort: 'Year 1 – Section D', primaryFacultyId: 'f5', collaboratorIds: [],     enrolledCount: 48, status: 'active',    courseType: 'didactic' },
  // Year 2 — Clinical Sciences
  // UC2 demo (late-added co-instructor): pf1/pf2 already cover course13's
  // Instructor surveys for Chen; Gomez was added in Prism AFTER those went out,
  // so a re-run shows Chen = duplicate (soft warning) and Gomez = new.
  { id: 'co13', masterCourseId: 'mc6',  termId: 'pt5', cohort: 'Year 2 – Section A', primaryFacultyId: 'f1', collaboratorIds: ['f2'], coInstructorIds: ['f5'], enrolledCount: 44, status: 'active',    courseType: 'didactic' },
  // 2026-08-13 — clean multi-instructor demo (Romit, Course Eval Step 2
  // add/remove roster): co13 above is the only OTHER multi-instructor
  // offering, but Chen there is locked (already covered by a Live survey),
  // so there was no example of 2+ people who are BOTH freely toggleable.
  // Was a Gap (collaboratorIds: []) — Patel + Kim added as instructor/
  // co-instructor; Williams (primaryFacultyId, unchanged) stays Coordinator
  // so no one double-books across roles. No survey exists for co14 in this
  // term, so both resolve 'new', not 'duplicate'.
  { id: 'co14', masterCourseId: 'mc8',  termId: 'pt5', cohort: 'Year 2 – Section B', primaryFacultyId: 'f3', collaboratorIds: ['f1'], coInstructorIds: ['f4'], enrolledCount: 44, status: 'active',    courseType: 'didactic' },
  { id: 'co15', masterCourseId: 'mc9',  termId: 'pt5', cohort: 'Year 2 – Section C', primaryFacultyId: 'f4', collaboratorIds: ['f4'],     enrolledCount: 42, status: 'active',    courseType: 'didactic' },
  { id: 'co16', masterCourseId: 'mc12', termId: 'pt5', cohort: 'Year 2 – Section D', primaryFacultyId: '',   collaboratorIds: [],     enrolledCount: 40, status: 'active',    courseType: 'didactic' },
  // Year 3 — Clinical Practicums
  { id: 'co17', masterCourseId: 'mc14', termId: 'pt5', cohort: 'Year 3 – Section A', primaryFacultyId: 'f1', collaboratorIds: ['f6'], enrolledCount: 14, status: 'active',    courseType: 'clinical' },
  { id: 'co18', masterCourseId: 'mc15', termId: 'pt5', cohort: 'Year 3 – Section B', primaryFacultyId: 'f6', collaboratorIds: [],     enrolledCount: 16, status: 'active',    courseType: 'clinical' },
  { id: 'co19', masterCourseId: 'mc11', termId: 'pt5', cohort: 'Year 3 – Section C', primaryFacultyId: 'f3', collaboratorIds: ['f4'],     enrolledCount: 44, status: 'active',    courseType: 'didactic' },

  // ── Lab-based (LB) + Practice-based (PB) — audit readiness fixtures (deliveryMode + one gap each) ──
  // labTaIds[1] = the Lab Assistant slot (pce-course-readiness) — filled here so
  // ONE demo row exercises the multi-person Faculty cell when a multi-role
  // template (Faculty Midterm Check-In) is assigned.
  { id: 'co20', masterCourseId: 'mc7',  termId: 'pt5', cohort: 'Year 2 – Section E', primaryFacultyId: 'f3', collaboratorIds: ['f2'], labTaIds: ['f5', 'f4'], enrolledCount: 0,  status: 'active', courseType: 'didactic', deliveryMode: 'lab' },              // gap: 0 students
  { id: 'co21', masterCourseId: 'mc4',  termId: 'pt5', cohort: 'Year 1 – Section E', primaryFacultyId: 'f4', collaboratorIds: ['f2','f5'],     labTaIds: [],     enrolledCount: 30, status: 'active', courseType: 'didactic', deliveryMode: 'lab' },              // gap: no lab instructor/TA
  { id: 'co22', masterCourseId: 'mc16', termId: 'pt5', cohort: 'Year 3 – Section D', primaryFacultyId: '',   collaboratorIds: ['f6'], placementFacultyIds: ['f6'], enrolledCount: 12, status: 'active', courseType: 'clinical', deliveryMode: 'practice' }, // gap: no clinical coordinator
  { id: 'co23', masterCourseId: 'mc14', termId: 'pt1', cohort: 'Class of 2026', primaryFacultyId: 'f1', collaboratorIds: [],     placementFacultyIds: [],     enrolledCount: 18, status: 'active', courseType: 'clinical', deliveryMode: 'practice' }, // gap: no placement faculty

  // ── Spring 2026 (pt1) — additional courses, current in-progress term ──────
  // co36/co37/co38 activate existing mon2/mon4/mon5 surveys (no matching
  // offering existed for those course codes before); co39/co40 are genuinely
  // unconfigured (Setup bucket); co41 carries a new Draft survey (mon23).
  { id: 'co36', masterCourseId: 'mc12', termId: 'pt1', cohort: 'Class of 2026', primaryFacultyId: 'f5', collaboratorIds: [],     enrolledCount: 40, status: 'active', courseType: 'clinical' }, // NURS-611 — mon2
  { id: 'co37', masterCourseId: 'mc5',  termId: 'pt1', cohort: 'Class of 2028', primaryFacultyId: 'f1', collaboratorIds: [],     enrolledCount: 70, status: 'active', courseType: 'didactic' }, // NURS-505 — mon4
  { id: 'co38', masterCourseId: 'mc4',  termId: 'pt1', cohort: 'Class of 2027', primaryFacultyId: 'f2', collaboratorIds: ['f1'], enrolledCount: 65, status: 'active', courseType: 'didactic' }, // NURS-504 — mon5
  { id: 'co39', masterCourseId: 'mc17', termId: 'pt1', cohort: 'Class of 2028', primaryFacultyId: 'f4', collaboratorIds: [],     enrolledCount: 44, status: 'active', courseType: 'didactic' }, // NURS-506 — not configured
  { id: 'co40', masterCourseId: 'mc16', termId: 'pt1', cohort: 'Class of 2026', primaryFacultyId: 'f1', collaboratorIds: [],     enrolledCount: 15, status: 'active', courseType: 'clinical' }, // NURS-603 — not configured
  { id: 'co41', masterCourseId: 'mc22', termId: 'pt1', cohort: 'Class of 2027', primaryFacultyId: 'f3', collaboratorIds: [],     enrolledCount: 32, status: 'active', courseType: 'didactic' }, // NURS-801 — mon23 (draft)

  // ── Fall 2025 (pt2) — closed term, full evaluation history ────────────────
  // co34/co35 deliberately carry NO matching survey — the "never evaluated"
  // story the Last-term card's needsAttention flag surfaces.
  { id: 'co24', masterCourseId: 'mc1',  termId: 'pt2', cohort: 'Class of 2028', primaryFacultyId: 'f1', collaboratorIds: [],     enrolledCount: 52, status: 'archived', courseType: 'didactic' }, // NURS-501 — mon9
  { id: 'co25', masterCourseId: 'mc10', termId: 'pt2', cohort: 'Class of 2027', primaryFacultyId: 'f3', collaboratorIds: [],     enrolledCount: 50, status: 'archived', courseType: 'didactic' }, // NURS-540 — mon10
  { id: 'co26', masterCourseId: 'mc2',  termId: 'pt2', cohort: 'Class of 2028', primaryFacultyId: 'f3', collaboratorIds: [],     enrolledCount: 45, status: 'archived', courseType: 'didactic' }, // NURS-502 — mon15
  { id: 'co27', masterCourseId: 'mc3',  termId: 'pt2', cohort: 'Class of 2028', primaryFacultyId: 'f3', collaboratorIds: [],     enrolledCount: 42, status: 'archived', courseType: 'didactic' }, // NURS-503 — mon16
  { id: 'co28', masterCourseId: 'mc5',  termId: 'pt2', cohort: 'Class of 2028', primaryFacultyId: 'f5', collaboratorIds: [],     enrolledCount: 48, status: 'archived', courseType: 'didactic' }, // NURS-505 — mon17
  { id: 'co29', masterCourseId: 'mc6',  termId: 'pt2', cohort: 'Class of 2027', primaryFacultyId: 'f1', collaboratorIds: ['f2'], enrolledCount: 46, status: 'archived', courseType: 'didactic' }, // NURS-510 — mon18
  { id: 'co30', masterCourseId: 'mc7',  termId: 'pt2', cohort: 'Class of 2027', primaryFacultyId: 'f1', collaboratorIds: [],     enrolledCount: 44, status: 'archived', courseType: 'didactic' }, // NURS-511 — mon19
  { id: 'co31', masterCourseId: 'mc8',  termId: 'pt2', cohort: 'Class of 2027', primaryFacultyId: 'f3', collaboratorIds: [],     enrolledCount: 40, status: 'archived', courseType: 'didactic' }, // NURS-520 — mon20
  { id: 'co32', masterCourseId: 'mc9',  termId: 'pt2', cohort: 'Class of 2027', primaryFacultyId: 'f4', collaboratorIds: [],     enrolledCount: 50, status: 'archived', courseType: 'didactic' }, // NURS-530 — mon21
  { id: 'co33', masterCourseId: 'mc14', termId: 'pt2', cohort: 'Class of 2026', primaryFacultyId: 'f1', collaboratorIds: ['f6'], enrolledCount: 16, status: 'archived', courseType: 'clinical' }, // NURS-601 — mon22
  { id: 'co34', masterCourseId: 'mc17', termId: 'pt2', cohort: 'Class of 2028', primaryFacultyId: 'f4', collaboratorIds: [],     enrolledCount: 38, status: 'archived', courseType: 'didactic' }, // NURS-506 — never evaluated
  { id: 'co35', masterCourseId: 'mc19', termId: 'pt2', cohort: 'Class of 2027', primaryFacultyId: 'f6', collaboratorIds: [],     enrolledCount: 42, status: 'archived', courseType: 'didactic' }, // NURS-620 — never evaluated

  // ── Spring 2025 (pt3) — past term, fully closed history ────────────────────
  // co42/co43 activate existing mon11/mon12; the rest carry new sp25-* surveys.
  { id: 'co42', masterCourseId: 'mc1',  termId: 'pt3', cohort: 'Class of 2028', primaryFacultyId: 'f1', collaboratorIds: [],     enrolledCount: 50, status: 'archived', courseType: 'didactic' }, // NURS-501 — mon11
  { id: 'co43', masterCourseId: 'mc5',  termId: 'pt3', cohort: 'Class of 2028', primaryFacultyId: 'f1', collaboratorIds: [],     enrolledCount: 60, status: 'archived', courseType: 'didactic' }, // NURS-505 — mon12
  { id: 'co44', masterCourseId: 'mc2',  termId: 'pt3', cohort: 'Class of 2028', primaryFacultyId: 'f3', collaboratorIds: [],     enrolledCount: 46, status: 'archived', courseType: 'didactic' }, // NURS-502 — sp25-1
  { id: 'co45', masterCourseId: 'mc3',  termId: 'pt3', cohort: 'Class of 2028', primaryFacultyId: 'f3', collaboratorIds: [],     enrolledCount: 44, status: 'archived', courseType: 'didactic' }, // NURS-503 — sp25-2
  { id: 'co46', masterCourseId: 'mc4',  termId: 'pt3', cohort: 'Class of 2028', primaryFacultyId: 'f4', collaboratorIds: [],     enrolledCount: 50, status: 'archived', courseType: 'didactic' }, // NURS-504 — sp25-3
  { id: 'co47', masterCourseId: 'mc6',  termId: 'pt3', cohort: 'Class of 2027', primaryFacultyId: 'f1', collaboratorIds: [],     enrolledCount: 48, status: 'archived', courseType: 'didactic' }, // NURS-510 — sp25-4
  { id: 'co48', masterCourseId: 'mc7',  termId: 'pt3', cohort: 'Class of 2027', primaryFacultyId: 'f1', collaboratorIds: [],     enrolledCount: 46, status: 'archived', courseType: 'didactic' }, // NURS-511 — sp25-5
  { id: 'co49', masterCourseId: 'mc8',  termId: 'pt3', cohort: 'Class of 2027', primaryFacultyId: 'f3', collaboratorIds: [],     enrolledCount: 42, status: 'archived', courseType: 'didactic' }, // NURS-520 — sp25-6
  { id: 'co50', masterCourseId: 'mc9',  termId: 'pt3', cohort: 'Class of 2027', primaryFacultyId: 'f4', collaboratorIds: [],     enrolledCount: 50, status: 'archived', courseType: 'didactic' }, // NURS-530 — sp25-7
  { id: 'co51', masterCourseId: 'mc10', termId: 'pt3', cohort: 'Class of 2027', primaryFacultyId: 'f6', collaboratorIds: [],     enrolledCount: 52, status: 'archived', courseType: 'didactic' }, // NURS-540 — sp25-8
  { id: 'co52', masterCourseId: 'mc14', termId: 'pt3', cohort: 'Class of 2026', primaryFacultyId: 'f1', collaboratorIds: [],     enrolledCount: 18, status: 'archived', courseType: 'clinical' }, // NURS-601 — sp25-9
  { id: 'co53', masterCourseId: 'mc15', termId: 'pt3', cohort: 'Class of 2026', primaryFacultyId: 'f6', collaboratorIds: [],     enrolledCount: 16, status: 'archived', courseType: 'clinical' }, // NURS-602 — sp25-10

  // ── Fall 2024 (pt4) — furthest-past term, fully closed history ────────────
  // co54/co55 activate existing mon13/mon14; the rest carry new fa24-* surveys.
  { id: 'co54', masterCourseId: 'mc6',  termId: 'pt4', cohort: 'Class of 2027', primaryFacultyId: 'f4', collaboratorIds: [],     enrolledCount: 55, status: 'archived', courseType: 'didactic' }, // NURS-510 — mon13
  { id: 'co55', masterCourseId: 'mc10', termId: 'pt4', cohort: 'Class of 2027', primaryFacultyId: 'f3', collaboratorIds: [],     enrolledCount: 48, status: 'archived', courseType: 'didactic' }, // NURS-540 — mon14
  { id: 'co56', masterCourseId: 'mc1',  termId: 'pt4', cohort: 'Class of 2028', primaryFacultyId: 'f1', collaboratorIds: [],     enrolledCount: 48, status: 'archived', courseType: 'didactic' }, // NURS-501 — fa24-1
  { id: 'co57', masterCourseId: 'mc2',  termId: 'pt4', cohort: 'Class of 2028', primaryFacultyId: 'f3', collaboratorIds: [],     enrolledCount: 44, status: 'archived', courseType: 'didactic' }, // NURS-502 — fa24-2
  { id: 'co58', masterCourseId: 'mc3',  termId: 'pt4', cohort: 'Class of 2028', primaryFacultyId: 'f3', collaboratorIds: [],     enrolledCount: 42, status: 'archived', courseType: 'didactic' }, // NURS-503 — fa24-3
  { id: 'co59', masterCourseId: 'mc4',  termId: 'pt4', cohort: 'Class of 2028', primaryFacultyId: 'f4', collaboratorIds: [],     enrolledCount: 50, status: 'archived', courseType: 'didactic' }, // NURS-504 — fa24-4
  { id: 'co60', masterCourseId: 'mc5',  termId: 'pt4', cohort: 'Class of 2028', primaryFacultyId: 'f5', collaboratorIds: [],     enrolledCount: 46, status: 'archived', courseType: 'didactic' }, // NURS-505 — fa24-5
  { id: 'co61', masterCourseId: 'mc7',  termId: 'pt4', cohort: 'Class of 2027', primaryFacultyId: 'f1', collaboratorIds: [],     enrolledCount: 44, status: 'archived', courseType: 'didactic' }, // NURS-511 — fa24-6
  { id: 'co62', masterCourseId: 'mc8',  termId: 'pt4', cohort: 'Class of 2027', primaryFacultyId: 'f3', collaboratorIds: [],     enrolledCount: 40, status: 'archived', courseType: 'didactic' }, // NURS-520 — fa24-7
  { id: 'co63', masterCourseId: 'mc9',  termId: 'pt4', cohort: 'Class of 2027', primaryFacultyId: 'f4', collaboratorIds: [],     enrolledCount: 48, status: 'archived', courseType: 'didactic' }, // NURS-530 — fa24-8
  { id: 'co64', masterCourseId: 'mc14', termId: 'pt4', cohort: 'Class of 2026', primaryFacultyId: 'f1', collaboratorIds: [],     enrolledCount: 16, status: 'archived', courseType: 'clinical' }, // NURS-601 — fa24-9
  { id: 'co65', masterCourseId: 'mc15', termId: 'pt4', cohort: 'Class of 2026', primaryFacultyId: 'f6', collaboratorIds: [],     enrolledCount: 14, status: 'archived', courseType: 'clinical' }, // NURS-602 — fa24-10

  // ── Spring 2027 (pt6) — new future term, nothing scheduled yet ─────────────
  { id: 'co66', masterCourseId: 'mc1',  termId: 'pt6', cohort: 'Year 1 – Section A', primaryFacultyId: 'f2', collaboratorIds: [],     enrolledCount: 46, status: 'planned', courseType: 'didactic' },
  { id: 'co67', masterCourseId: 'mc2',  termId: 'pt6', cohort: 'Year 1 – Section B', primaryFacultyId: 'f3', collaboratorIds: [],     enrolledCount: 46, status: 'planned', courseType: 'didactic' },
  { id: 'co68', masterCourseId: 'mc3',  termId: 'pt6', cohort: 'Year 1 – Section C', primaryFacultyId: 'f3', collaboratorIds: [],     enrolledCount: 44, status: 'planned', courseType: 'didactic' },
  { id: 'co69', masterCourseId: 'mc5',  termId: 'pt6', cohort: 'Year 1 – Section D', primaryFacultyId: 'f5', collaboratorIds: [],     enrolledCount: 48, status: 'planned', courseType: 'didactic' },
  { id: 'co70', masterCourseId: 'mc6',  termId: 'pt6', cohort: 'Year 2 – Section A', primaryFacultyId: 'f1', collaboratorIds: ['f2'], enrolledCount: 46, status: 'planned', courseType: 'didactic' },
  { id: 'co71', masterCourseId: 'mc7',  termId: 'pt6', cohort: 'Year 2 – Section B', primaryFacultyId: 'f1', collaboratorIds: [],     enrolledCount: 44, status: 'planned', courseType: 'didactic' },
  { id: 'co72', masterCourseId: 'mc8',  termId: 'pt6', cohort: 'Year 2 – Section C', primaryFacultyId: 'f3', collaboratorIds: [],     enrolledCount: 42, status: 'planned', courseType: 'didactic' },
  { id: 'co73', masterCourseId: 'mc9',  termId: 'pt6', cohort: 'Year 2 – Section D', primaryFacultyId: 'f4', collaboratorIds: [],     enrolledCount: 44, status: 'planned', courseType: 'didactic' },
  { id: 'co74', masterCourseId: 'mc10', termId: 'pt6', cohort: 'Year 2 – Section E', primaryFacultyId: 'f6', collaboratorIds: [],     enrolledCount: 48, status: 'planned', courseType: 'didactic' },
  { id: 'co75', masterCourseId: 'mc12', termId: 'pt6', cohort: 'Year 2 – Section F', primaryFacultyId: 'f5', collaboratorIds: [],     enrolledCount: 40, status: 'planned', courseType: 'clinical' },
  { id: 'co76', masterCourseId: 'mc14', termId: 'pt6', cohort: 'Year 3 – Section A', primaryFacultyId: 'f1', collaboratorIds: ['f6'], enrolledCount: 16, status: 'planned', courseType: 'clinical' },
  { id: 'co77', masterCourseId: 'mc15', termId: 'pt6', cohort: 'Year 3 – Section B', primaryFacultyId: 'f6', collaboratorIds: [],     enrolledCount: 14, status: 'planned', courseType: 'clinical' },
]

// Maps CourseOffering ID → enrolled Student IDs visible in this demo.
// The real system enrolledCount may be higher — shown as "X of N enrolled in demo".
export const MOCK_COURSE_ENROLLMENTS: Record<string, string[]> = {
  // Spring 2026 (pt1)
  co1: ['st6', 'st7', 'st8', 'st9'],                  // NURS-501, Class of 2027
  co2: ['st1', 'st2', 'st3', 'st4'],                  // NURS-601, Class of 2026
  co3: ['st1', 'st2', 'st3', 'st4'],                  // NURS-602, Class of 2026
  co5: ['st11', 'st12', 'st13', 'st14', 'st15'],      // NURS-502, Class of 2028
  co6: ['st6', 'st7', 'st8', 'st9'],                  // NURS-510, Class of 2027
  co7: ['st6', 'st7', 'st8', 'st9'],                  // NURS-511, Class of 2027
  co8: ['st1', 'st2', 'st3', 'st4'],                  // NURS-520, Class of 2026
  // Fall 2026 (pt5) — Year 1 (new cohort)
  co9:  ['st18', 'st19', 'st20', 'st21', 'st22'],     // NURS-501
  co10: ['st18', 'st19', 'st20', 'st21', 'st22'],     // NURS-502
  co11: ['st18', 'st19', 'st20', 'st21'],              // NURS-503
  co12: ['st18', 'st19', 'st20', 'st21', 'st22'],     // NURS-505
  co21: ['st19', 'st20', 'st21', 'st22', 'st23'],     // NURS-530 (lab)
  // Fall 2026 (pt5) — Year 2, Class of 2028
  co13: ['st11', 'st12', 'st13', 'st14', 'st15'],     // NURS-510
  co14: ['st11', 'st12', 'st13', 'st14'],             // NURS-520
  co15: ['st11', 'st12', 'st13'],                     // NURS-530
  co16: ['st11', 'st12', 'st13', 'st14'],             // NURS-611 (unassigned faculty demo)
  // Fall 2026 (pt5) — Year 3, Class of 2027
  co17: ['st6', 'st7', 'st8'],                        // NURS-601
  co18: ['st6', 'st7', 'st8', 'st9'],                 // NURS-602
  co19: ['st6', 'st7', 'st8', 'st9'],                 // NURS-550
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
  { id: 'p1',  name: 'Sandra Torres',    email: 'storres@school.edu',     role: 'Program Coordinator',          department: 'Nursing',   status: 'Active'   },
  { id: 'p2',  name: 'James Whitfield',  email: 'jwhitfield@school.edu',  role: 'Clinical Education Director',  department: 'Clinical Affairs',   status: 'Active'   },
  { id: 'p3',  name: 'Mei-Lin Cheng',    email: 'mcheng@school.edu',      role: 'Administrative Coordinator',   department: 'Student Services',   status: 'Active'   },
  { id: 'p4',  name: 'Derek Okafor',     email: 'dokafor@school.edu',     role: 'Accreditation Specialist',     department: 'Academic Affairs',   status: 'Active'   },
  { id: 'p5',  name: 'Priya Nair',       email: 'pnair@school.edu',       role: 'Curriculum Coordinator',       department: 'Academic Affairs',   status: 'Active'   },
  { id: 'p6',  name: 'Tom Harrington',   email: 'tharrington@school.edu', role: 'IT Support Specialist',        department: 'Technology',         status: 'Active'   },
  { id: 'p7',  name: 'Aisha Mukherjee',  email: 'amukherjee@school.edu',  role: 'Student Affairs Coordinator',  department: 'Student Services',   status: 'Active'   },
  { id: 'p8',  name: 'Carlos Reyes',     email: 'creyes@school.edu',      role: 'Research Coordinator',         department: 'Research',           status: 'Inactive' },
  { id: 'p9',  name: 'Laura Kwan',       email: 'lkwan@school.edu',       role: 'Program Coordinator',          department: 'Nursing',   status: 'Active'   },
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
  // mon1 — NURS-510 live · tmpl1 · Dr. Patel (f1) + Dr. Gomez (f5) · 23 partial responses
  {
    surveyId: 'mon1',
    sectionScores: {
      course_content: [
        { questionId: 'q1', avg: 4.0, count: 23, distribution: [0, 1, 5, 10, 7] },
        { questionId: 'q2', avg: 3.8, count: 23, distribution: [1, 2, 6, 9, 5] },
        { questionId: 'q3', avg: 3.7, count: 23, distribution: [1, 3, 6, 9, 4] },
        { questionId: 'q4', avg: 4.1, count: 23, distribution: [0, 1, 4, 10, 8] },
        { questionId: 'q12', avg: 3.8, count: 23, distribution: [0, 1, 5, 15, 2] },
        { questionId: 'q13', avg: 4.0, count: 23, distribution: [0, 2, 3, 12, 6] },
      ],
    },
    instructorBlocks: [
      /* Both instructors on this offering scored — Patel (course coordinator)
       * was missing entirely until 2026-09-17 (Romit, screenshot: "ensure
       * that the data is filled, can't show empty placeholders for score or
       * highlights"), which left her Faculty-tab Score card in its
       * zero-scores empty state even though the survey has real responses.
       * Widened 2026-09-17 (full requirements re-check vs the raw transcript)
       * from 2 scored questions (q6/q7) to all 6 faculty Likert questions —
       * `tmpl1`'s faculty side is split into 3 topical `templateSections`
       * (Teaching Effectiveness: q6/q15, Communication: q7/q16, Assessment
       * Practices: q14/q17), and only scoring q6/q7 left Assessment
       * Practices with ZERO scored questions on this survey, one topical
       * section entirely empty on the lead demo record. */
      {
        instructorId: 'f1',
        scores: [
          { questionId: 'q6',  avg: 4.4, count: 23, distribution: [0, 0, 2, 7, 14] },
          { questionId: 'q15', avg: 4.3, count: 23, distribution: [0, 1, 2, 9, 11] },
          { questionId: 'q7',  avg: 4.3, count: 23, distribution: [0, 1, 2, 8, 12] },
          { questionId: 'q16', avg: 4.2, count: 23, distribution: [0, 1, 3, 9, 10] },
          { questionId: 'q14', avg: 4.1, count: 23, distribution: [0, 1, 4, 9, 9] },
          { questionId: 'q17', avg: 3.9, count: 23, distribution: [0, 2, 5, 9, 7] },
          { questionId: 'q18', avg: 4.0, count: 23, distribution: [0, 0, 5, 12, 6] },
          { questionId: 'q19', avg: 4.3, count: 23, distribution: [0, 0, 1, 15, 7] },
          { questionId: 'q20', avg: 4.0, count: 23, distribution: [0, 0, 5, 12, 6] },
          { questionId: 'q21', avg: 3.9, count: 23, distribution: [2, 1, 1, 12, 7] },
          { questionId: 'q22', avg: 4.0, count: 23, distribution: [0, 3, 1, 12, 7] },
          { questionId: 'q23', avg: 4.1, count: 23, distribution: [0, 0, 5, 11, 7] },
        ],
      },
      {
        instructorId: 'f5',
        scores: [
          { questionId: 'q6',  avg: 4.2, count: 23, distribution: [0, 1, 3, 9, 10] },
          { questionId: 'q15', avg: 4.1, count: 23, distribution: [0, 1, 4, 10, 8] },
          { questionId: 'q7',  avg: 4.0, count: 23, distribution: [0, 2, 4, 9, 8] },
          { questionId: 'q16', avg: 4.0, count: 23, distribution: [0, 2, 4, 9, 8] },
          { questionId: 'q14', avg: 3.9, count: 23, distribution: [0, 2, 5, 9, 7] },
          { questionId: 'q17', avg: 3.8, count: 23, distribution: [1, 1, 6, 9, 6] },
          { questionId: 'q18', avg: 4.0, count: 23, distribution: [2, 0, 2, 12, 7] },
          { questionId: 'q19', avg: 4.0, count: 23, distribution: [0, 3, 1, 12, 7] },
          { questionId: 'q20', avg: 4.2, count: 23, distribution: [0, 0, 2, 15, 6] },
          { questionId: 'q21', avg: 4.0, count: 23, distribution: [0, 1, 4, 12, 6] },
          { questionId: 'q22', avg: 3.7, count: 23, distribution: [0, 0, 8, 14, 1] },
          { questionId: 'q23', avg: 4.0, count: 23, distribution: [2, 0, 2, 12, 7] },
        ],
      },
    ],
    freeTextCounts: { q5: 5, q8: 5 },
  },
  // mon2 — NURS-611 live · tmpl2 · Dr. Gomez (f5) · mid-collection, 18 of 40
  {
    surveyId: 'mon2',
    sectionScores: {},
    instructorBlocks: [
      {
        instructorId: 'f5',
        scores: [
          { questionId: 'q9',  avg: 4.1, count: 18, distribution: [0, 1, 3, 7, 7] },
          { questionId: 'q10', avg: 3.5, count: 18, distribution: [0, 3, 6, 6, 3] },
        ],
      },
    ],
    freeTextCounts: { q11: 6 },
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
    freeTextCounts: { c7: 4, i6: 4, l5: 3 },
  },
  // s2 — NURS-601 Clinical Practicum I · Dr. Williams (f3) primary + Dr. Chen (f2) guest · 21 responses
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
    freeTextCounts: { q5: 2, q8: 2 },
  },
  // s3 — NURS-602 Clinical Practicum II · Dr. Maria Williams (f3) · 46 responses
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
    freeTextCounts: { q5: 3, q8: 3 },
  },
  // s4 — NURS-504 Health Assessment · Dr. James Kim (f4) · 44 responses
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
    freeTextCounts: { q5: 1, q8: 2 },
  },
  // s5 — NURS-502 Physiology & Pathophysiology · Dr. James Kim (f4) · 22 responses
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
    freeTextCounts: { q5: 1, q8: 0 },
  },
  /* mon28 — NURS-515 Pharmacology for Nurses · Summer 2026 · tmpl1 · released ·
   * 32 of 46 responses (70%). THE LEAD DEMO RECORD (2026-09-16): every Likert
   * question in all four tmpl1 sections is scored, both instructors carry a
   * full block, and both free-text questions have counts backed 1:1 by
   * MOCK_OPEN_TEXT_RESPONSES rows so the per-question response sheet and the
   * AI-summary lane never fall to an empty state.
   *   Course content mean 3.67 → matches the NURS-515 / Summer 2026 offering's
   *   courseAvg 3.70. Chen's block mean is exactly 3.75 → the same offering's
   *   avgRating. Gomez reads higher (4.15) so the two-instructor comparison
   *   has a real gap to show. Every distribution sums to 32 and reproduces its
   *   own stated avg to one decimal. */
  {
    surveyId: 'mon28',
    sectionScores: {
      course_content: [
        { questionId: 'q1',  avg: 4.0, count: 32, distribution: [0, 1,  6, 17,  8] },
        { questionId: 'q2',  avg: 3.6, count: 32, distribution: [1, 2, 10, 14,  5] },
        { questionId: 'q3',  avg: 3.3, count: 32, distribution: [2, 5, 10, 11,  4] },
        { questionId: 'q4',  avg: 3.8, count: 32, distribution: [1, 1,  8, 15,  7] },
        { questionId: 'q12', avg: 3.6, count: 32, distribution: [1, 3,  9, 14,  5] },
        { questionId: 'q13', avg: 3.7, count: 32, distribution: [1, 2,  8, 16,  5] },
      ],
    },
    instructorBlocks: [
      {
        // f2 Dr. Kevin Chen — Course Coordinator. Solid but uneven: strong
        // preparation, weaker on pace and grading consistency.
        instructorId: 'f2',
        scores: [
          { questionId: 'q6',  avg: 4.1, count: 32, distribution: [0, 1,  5, 16, 10] },
          { questionId: 'q15', avg: 3.6, count: 32, distribution: [1, 2, 11, 13,  5] },
          { questionId: 'q7',  avg: 3.7, count: 32, distribution: [0, 3,  9, 15,  5] },
          { questionId: 'q16', avg: 3.8, count: 32, distribution: [0, 2,  8, 15,  7] },
          { questionId: 'q14', avg: 3.5, count: 32, distribution: [1, 2, 12, 13,  4] },
          { questionId: 'q17', avg: 3.8, count: 32, distribution: [1, 1,  8, 15,  7] },
          { questionId: 'q18', avg: 3.9, count: 32, distribution: [2, 3, 1, 17, 9] },
          { questionId: 'q19', avg: 3.8, count: 32, distribution: [3, 2, 2, 17, 8] },
          { questionId: 'q20', avg: 3.8, count: 32, distribution: [2, 2, 4, 17, 7] },
          { questionId: 'q21', avg: 3.9, count: 32, distribution: [0, 4, 3, 17, 8] },
          { questionId: 'q22', avg: 3.6, count: 32, distribution: [0, 2, 12, 16, 2] },
          { questionId: 'q23', avg: 3.7, count: 32, distribution: [0, 2, 8, 21, 1] },
        ],
      },
      {
        // f5 Dr. Rachel Gomez — Instructor. Consistently higher, with
        // assessment practices as her own softest question.
        instructorId: 'f5',
        scores: [
          { questionId: 'q6',  avg: 4.4, count: 32, distribution: [0, 0,  3, 13, 16] },
          { questionId: 'q15', avg: 4.2, count: 32, distribution: [0, 1,  4, 15, 12] },
          { questionId: 'q7',  avg: 4.1, count: 32, distribution: [0, 1,  5, 16, 10] },
          { questionId: 'q16', avg: 4.3, count: 32, distribution: [0, 1,  3, 14, 14] },
          { questionId: 'q14', avg: 3.9, count: 32, distribution: [0, 2,  7, 15,  8] },
          { questionId: 'q17', avg: 4.0, count: 32, distribution: [0, 1,  6, 17,  8] },
          { questionId: 'q18', avg: 4.3, count: 32, distribution: [0, 0, 3, 16, 13] },
          { questionId: 'q19', avg: 3.9, count: 32, distribution: [2, 1, 4, 16, 9] },
          { questionId: 'q20', avg: 4.1, count: 32, distribution: [0, 0, 7, 16, 9] },
          { questionId: 'q21', avg: 4.1, count: 32, distribution: [0, 0, 6, 17, 9] },
          { questionId: 'q22', avg: 4.2, count: 32, distribution: [0, 0, 1, 23, 8] },
          { questionId: 'q23', avg: 4.3, count: 32, distribution: [0, 0, 0, 23, 9] },
        ],
      },
    ],
    freeTextCounts: { q5: 7, q8: 8 },
  },

  // ── University of Nursing demo account (BSN/MSN dummy-data scenario) ────
  {
    surveyId: 'uon-f1',
    sectionScores: { course_content: [
      { questionId: 'q1', avg: 4.29, count: 59, distribution: [0, 2, 6, 24, 27] },
      { questionId: 'q2', avg: 4.36, count: 59, distribution: [0, 1, 5, 25, 28] },
      { questionId: 'q3', avg: 4.29, count: 59, distribution: [0, 0, 0, 42, 17] },
      { questionId: 'q4', avg: 4.34, count: 59, distribution: [0, 0, 0, 39, 20] },
      { questionId: 'q12', avg: 4.25, count: 59, distribution: [0, 0, 2, 40, 17] },
      { questionId: 'q13', avg: 4.08, count: 59, distribution: [2, 0, 7, 32, 18] },
    ] },
    instructorBlocks: [{ instructorId: 'f1', scores: [
      { questionId: 'q6', avg: 4.47, count: 59, distribution: [0, 1, 4, 20, 34] },
      { questionId: 'q7', avg: 4.36, count: 59, distribution: [0, 2, 5, 22, 30] },
      { questionId: 'q15', avg: 4.53, count: 59, distribution: [0, 0, 0, 28, 31] },
      { questionId: 'q18', avg: 4.25, count: 59, distribution: [0, 0, 1, 42, 16] },
      { questionId: 'q19', avg: 4.49, count: 59, distribution: [0, 1, 1, 25, 32] },
      { questionId: 'q16', avg: 4.47, count: 59, distribution: [0, 0, 0, 31, 28] },
      { questionId: 'q20', avg: 4.51, count: 59, distribution: [0, 0, 3, 23, 33] },
      { questionId: 'q21', avg: 4.51, count: 59, distribution: [0, 0, 1, 27, 31] },
      { questionId: 'q14', avg: 4.24, count: 59, distribution: [0, 0, 7, 31, 21] },
      { questionId: 'q17', avg: 4.12, count: 59, distribution: [1, 4, 2, 32, 20] },
      { questionId: 'q22', avg: 4.42, count: 59, distribution: [0, 0, 3, 28, 28] },
      { questionId: 'q23', avg: 4.53, count: 59, distribution: [0, 0, 2, 24, 33] },
    ] }],
    freeTextCounts: { q5: 2, q8: 2 },
  },
  {
    surveyId: 'uon-f2',
    sectionScores: { course_content: [
      { questionId: 'q1', avg: 3.24, count: 34, distribution: [2, 6, 12, 10, 4] },
      { questionId: 'q2', avg: 3.12, count: 34, distribution: [3, 7, 11, 9, 4] },
      { questionId: 'q3', avg: 3.00, count: 34, distribution: [4, 4, 18, 4, 4] },
      { questionId: 'q4', avg: 3.32, count: 34, distribution: [0, 1, 23, 8, 2] },
      { questionId: 'q12', avg: 2.94, count: 34, distribution: [2, 7, 18, 5, 2] },
      { questionId: 'q13', avg: 2.91, count: 34, distribution: [2, 8, 17, 5, 2] },
    ] },
    instructorBlocks: [{ instructorId: 'f4', scores: [
      { questionId: 'q6', avg: 3.62, count: 34, distribution: [1, 3, 10, 14, 6] },
      { questionId: 'q7', avg: 3.62, count: 34, distribution: [1, 4, 9, 13, 7] },
      { questionId: 'q15', avg: 3.44, count: 34, distribution: [1, 1, 15, 16, 1] },
      { questionId: 'q18', avg: 3.71, count: 34, distribution: [2, 2, 6, 18, 6] },
      { questionId: 'q19', avg: 3.59, count: 34, distribution: [0, 2, 11, 20, 1] },
      { questionId: 'q16', avg: 3.79, count: 34, distribution: [0, 1, 7, 24, 2] },
      { questionId: 'q20', avg: 3.35, count: 34, distribution: [1, 1, 17, 15, 0] },
      { questionId: 'q21', avg: 3.38, count: 34, distribution: [0, 0, 22, 11, 1] },
      { questionId: 'q14', avg: 3.44, count: 34, distribution: [0, 1, 19, 12, 2] },
      { questionId: 'q17', avg: 3.44, count: 34, distribution: [0, 0, 22, 9, 3] },
      { questionId: 'q22', avg: 3.79, count: 34, distribution: [0, 0, 11, 19, 4] },
      { questionId: 'q23', avg: 3.79, count: 34, distribution: [0, 1, 7, 24, 2] },
    ] }],
    freeTextCounts: { q5: 2, q8: 2 },
  },
  {
    surveyId: 'uon-f3',
    sectionScores: { course_content: [
      { questionId: 'q1', avg: 2.86, count: 22, distribution: [3, 5, 8, 4, 2] },
      { questionId: 'q2', avg: 2.64, count: 22, distribution: [4, 6, 7, 4, 1] },
      { questionId: 'q3', avg: 2.55, count: 22, distribution: [1, 8, 13, 0, 0] },
      { questionId: 'q4', avg: 2.86, count: 22, distribution: [2, 4, 12, 3, 1] },
      { questionId: 'q12', avg: 2.55, count: 22, distribution: [1, 10, 10, 0, 1] },
      { questionId: 'q13', avg: 2.64, count: 22, distribution: [1, 8, 12, 0, 1] },
    ] },
    instructorBlocks: [{ instructorId: 'f3', scores: [
      { questionId: 'q6', avg: 3.09, count: 22, distribution: [2, 4, 8, 6, 2] },
      { questionId: 'q7', avg: 3.05, count: 22, distribution: [2, 5, 7, 6, 2] },
      { questionId: 'q15', avg: 3.27, count: 22, distribution: [0, 1, 15, 5, 1] },
      { questionId: 'q18', avg: 3.05, count: 22, distribution: [2, 2, 12, 5, 1] },
      { questionId: 'q19', avg: 3.14, count: 22, distribution: [1, 3, 12, 4, 2] },
      { questionId: 'q16', avg: 2.91, count: 22, distribution: [2, 3, 12, 5, 0] },
      { questionId: 'q20', avg: 3.00, count: 22, distribution: [1, 4, 12, 4, 1] },
      { questionId: 'q21', avg: 3.09, count: 22, distribution: [1, 4, 12, 2, 3] },
      { questionId: 'q14', avg: 3.14, count: 22, distribution: [1, 3, 12, 4, 2] },
      { questionId: 'q17', avg: 3.05, count: 22, distribution: [0, 6, 11, 3, 2] },
      { questionId: 'q22', avg: 2.86, count: 22, distribution: [1, 6, 11, 3, 1] },
      { questionId: 'q23', avg: 2.82, count: 22, distribution: [0, 8, 11, 2, 1] },
    ] }],
    freeTextCounts: { q5: 2, q8: 2 },
  },
  {
    // Edge case: controversial — bimodal, heavy at both ends. Mid-term switch
    // to a new case-based dosage-calculation format split the class.
    surveyId: 'uon-f4',
    sectionScores: { course_content: [
      { questionId: 'q1', avg: 3.13, count: 62, distribution: [29, 0, 0, 0, 33] },
      { questionId: 'q2', avg: 3.10, count: 62, distribution: [28, 2, 0, 0, 32] },
      { questionId: 'q3', avg: 3.18, count: 62, distribution: [27, 1, 0, 2, 32] },
      { questionId: 'q4', avg: 3.34, count: 62, distribution: [25, 1, 0, 0, 36] },
      { questionId: 'q12', avg: 3.23, count: 62, distribution: [27, 0, 0, 2, 33] },
      { questionId: 'q13', avg: 3.16, count: 62, distribution: [27, 2, 0, 0, 33] },
    ] },
    instructorBlocks: [
      { instructorId: 'f2', scores: [
        { questionId: 'q6', avg: 3.13, count: 62, distribution: [28, 1, 0, 1, 32] },
        { questionId: 'q7', avg: 3.21, count: 62, distribution: [27, 1, 0, 0, 34] },
        { questionId: 'q15', avg: 3.27, count: 62, distribution: [25, 2, 0, 1, 34] },
        { questionId: 'q18', avg: 3.23, count: 62, distribution: [26, 2, 0, 0, 34] },
        { questionId: 'q19', avg: 3.16, count: 62, distribution: [28, 0, 0, 2, 32] },
        { questionId: 'q16', avg: 3.16, count: 62, distribution: [27, 2, 0, 0, 33] },
        { questionId: 'q20', avg: 3.13, count: 62, distribution: [29, 0, 0, 0, 33] },
        { questionId: 'q21', avg: 3.55, count: 62, distribution: [22, 0, 0, 2, 38] },
        { questionId: 'q14', avg: 3.19, count: 62, distribution: [26, 2, 0, 2, 32] },
        { questionId: 'q17', avg: 3.53, count: 62, distribution: [22, 1, 0, 0, 39] },
        { questionId: 'q22', avg: 3.39, count: 62, distribution: [24, 1, 0, 1, 36] },
        { questionId: 'q23', avg: 3.37, count: 62, distribution: [24, 1, 0, 2, 35] },
      ] },
      // f5 Dr. Rachel Gomez — co-instructor (antibiotic stewardship unit), scored
      // independently of the split main-instructor sentiment.
      { instructorId: 'f5', scores: [
        { questionId: 'q6', avg: 4.52, count: 62, distribution: [1, 2, 4, 12, 43] },
        { questionId: 'q15', avg: 4.48, count: 62, distribution: [0, 0, 2, 28, 32] },
        { questionId: 'q18', avg: 4.32, count: 62, distribution: [0, 1, 1, 37, 23] },
        { questionId: 'q19', avg: 4.65, count: 62, distribution: [0, 0, 0, 22, 40] },
        { questionId: 'q7', avg: 4.56, count: 62, distribution: [0, 0, 2, 23, 37] },
        { questionId: 'q16', avg: 4.24, count: 62, distribution: [0, 0, 2, 43, 17] },
        { questionId: 'q20', avg: 4.52, count: 62, distribution: [0, 1, 0, 27, 34] },
        { questionId: 'q21', avg: 4.50, count: 62, distribution: [0, 0, 2, 27, 33] },
        { questionId: 'q14', avg: 4.37, count: 62, distribution: [0, 0, 1, 37, 24] },
        { questionId: 'q17', avg: 4.48, count: 62, distribution: [0, 0, 2, 28, 32] },
        { questionId: 'q22', avg: 4.55, count: 62, distribution: [0, 0, 1, 26, 35] },
        { questionId: 'q23', avg: 4.55, count: 62, distribution: [0, 0, 0, 28, 34] },
      ] },
    ],
    freeTextCounts: { q5: 3, q8: 2 },
  },
  {
    surveyId: 'uon-f5',
    sectionScores: { course_content: [
      { questionId: 'q1', avg: 4.22, count: 40, distribution: [0, 1, 5, 18, 16] },
      { questionId: 'q2', avg: 4.20, count: 40, distribution: [0, 1, 6, 17, 16] },
      { questionId: 'q3', avg: 4.22, count: 40, distribution: [0, 0, 3, 25, 12] },
      { questionId: 'q4', avg: 4.10, count: 40, distribution: [0, 0, 8, 20, 12] },
      { questionId: 'q12', avg: 4.03, count: 40, distribution: [0, 0, 9, 21, 10] },
      { questionId: 'q13', avg: 4.12, count: 40, distribution: [0, 0, 7, 21, 12] },
    ] },
    instructorBlocks: [{ instructorId: 'f1', scores: [
      { questionId: 'q6', avg: 4.47, count: 40, distribution: [0, 0, 3, 15, 22] },
      { questionId: 'q7', avg: 4.33, count: 40, distribution: [0, 1, 4, 16, 19] },
      { questionId: 'q15', avg: 4.53, count: 40, distribution: [0, 1, 1, 14, 24] },
      { questionId: 'q18', avg: 4.38, count: 40, distribution: [0, 1, 1, 20, 18] },
      { questionId: 'q19', avg: 4.40, count: 40, distribution: [0, 0, 1, 22, 17] },
      { questionId: 'q16', avg: 4.20, count: 40, distribution: [0, 0, 6, 20, 14] },
      { questionId: 'q20', avg: 4.25, count: 40, distribution: [0, 1, 1, 25, 13] },
      { questionId: 'q21', avg: 4.22, count: 40, distribution: [0, 0, 2, 27, 11] },
      { questionId: 'q14', avg: 4.12, count: 40, distribution: [0, 0, 7, 21, 12] },
      { questionId: 'q17', avg: 4.10, count: 40, distribution: [0, 0, 8, 20, 12] },
      { questionId: 'q22', avg: 4.38, count: 40, distribution: [0, 0, 1, 23, 16] },
      { questionId: 'q23', avg: 4.42, count: 40, distribution: [0, 0, 1, 21, 18] },
    ] }],
    freeTextCounts: { q5: 2, q8: 1 },
  },
  {
    surveyId: 'uon-f6',
    sectionScores: { course_content: [
      { questionId: 'q1', avg: 3.82, count: 11, distribution: [0, 1, 3, 4, 3] },
      { questionId: 'q2', avg: 3.82, count: 11, distribution: [0, 1, 3, 4, 3] },
      { questionId: 'q3', avg: 3.64, count: 11, distribution: [0, 1, 3, 6, 1] },
      { questionId: 'q4', avg: 3.82, count: 11, distribution: [0, 1, 2, 6, 2] },
      { questionId: 'q12', avg: 3.82, count: 11, distribution: [0, 0, 3, 7, 1] },
      { questionId: 'q13', avg: 3.64, count: 11, distribution: [0, 0, 4, 7, 0] },
    ] },
    instructorBlocks: [{ instructorId: 'f5', scores: [
      { questionId: 'q6', avg: 4.00, count: 11, distribution: [0, 1, 2, 4, 4] },
      { questionId: 'q7', avg: 3.91, count: 11, distribution: [0, 1, 3, 3, 4] },
      { questionId: 'q15', avg: 3.64, count: 11, distribution: [0, 1, 3, 6, 1] },
      { questionId: 'q18', avg: 3.91, count: 11, distribution: [1, 0, 1, 6, 3] },
      { questionId: 'q19', avg: 3.64, count: 11, distribution: [0, 1, 3, 6, 1] },
      { questionId: 'q16', avg: 4.00, count: 11, distribution: [0, 1, 1, 6, 3] },
      { questionId: 'q20', avg: 3.91, count: 11, distribution: [0, 0, 3, 6, 2] },
      { questionId: 'q21', avg: 3.82, count: 11, distribution: [0, 0, 3, 7, 1] },
      { questionId: 'q14', avg: 4.00, count: 11, distribution: [0, 0, 3, 5, 3] },
      { questionId: 'q17', avg: 4.09, count: 11, distribution: [0, 0, 2, 6, 3] },
      { questionId: 'q22', avg: 3.73, count: 11, distribution: [0, 1, 2, 7, 1] },
      { questionId: 'q23', avg: 3.73, count: 11, distribution: [0, 1, 2, 7, 1] },
    ] }],
    freeTextCounts: { q5: 1, q8: 1 },
  },
  {
    surveyId: 'uon-f7',
    sectionScores: { course_content: [
      { questionId: 'q1', avg: 3.78, count: 9, distribution: [0, 1, 2, 4, 2] },
      { questionId: 'q2', avg: 3.33, count: 9, distribution: [0, 2, 3, 3, 1] },
      { questionId: 'q3', avg: 3.56, count: 9, distribution: [0, 0, 5, 3, 1] },
      { questionId: 'q4', avg: 3.78, count: 9, distribution: [0, 1, 1, 6, 1] },
      { questionId: 'q12', avg: 3.67, count: 9, distribution: [0, 0, 3, 6, 0] },
      { questionId: 'q13', avg: 3.44, count: 9, distribution: [0, 0, 5, 4, 0] },
    ] },
    instructorBlocks: [{ instructorId: 'f3', scores: [
      { questionId: 'q6', avg: 4.00, count: 9, distribution: [0, 0, 3, 3, 3] },
      { questionId: 'q7', avg: 3.78, count: 9, distribution: [0, 1, 2, 4, 2] },
      { questionId: 'q15', avg: 4.00, count: 9, distribution: [0, 0, 3, 3, 3] },
      { questionId: 'q18', avg: 4.00, count: 9, distribution: [0, 0, 3, 3, 3] },
      { questionId: 'q19', avg: 3.67, count: 9, distribution: [1, 1, 1, 3, 3] },
      { questionId: 'q16', avg: 3.89, count: 9, distribution: [0, 1, 2, 3, 3] },
      { questionId: 'q20', avg: 4.11, count: 9, distribution: [0, 0, 1, 6, 2] },
      { questionId: 'q21', avg: 3.67, count: 9, distribution: [0, 1, 2, 5, 1] },
      { questionId: 'q14', avg: 3.67, count: 9, distribution: [0, 1, 3, 3, 2] },
      { questionId: 'q17', avg: 3.67, count: 9, distribution: [1, 1, 1, 3, 3] },
      { questionId: 'q22', avg: 3.78, count: 9, distribution: [0, 0, 3, 5, 1] },
      { questionId: 'q23', avg: 3.78, count: 9, distribution: [0, 0, 3, 5, 1] },
    ] }],
    freeTextCounts: { q5: 1, q8: 1 },
  },
  {
    // Edge case: stellar/perfect — near-unanimous "Strongly Agree".
    surveyId: 'uon-f8',
    sectionScores: { course_content: [
      { questionId: 'q1', avg: 4.90, count: 30, distribution: [0, 0, 0, 3, 27] },
      { questionId: 'q2', avg: 4.70, count: 30, distribution: [0, 0, 2, 5, 23] },
      { questionId: 'q3', avg: 4.50, count: 30, distribution: [0, 0, 5, 5, 20] },
      { questionId: 'q4', avg: 4.77, count: 30, distribution: [0, 0, 2, 3, 25] },
      { questionId: 'q12', avg: 4.53, count: 30, distribution: [0, 0, 3, 8, 19] },
      { questionId: 'q13', avg: 4.67, count: 30, distribution: [0, 0, 2, 6, 22] },
    ] },
    instructorBlocks: [
      { instructorId: 'f6', scores: [
        { questionId: 'q6', avg: 4.93, count: 30, distribution: [0, 0, 0, 2, 28] },
        { questionId: 'q7', avg: 4.90, count: 30, distribution: [0, 0, 0, 3, 27] },
        { questionId: 'q15', avg: 4.90, count: 30, distribution: [0, 0, 0, 3, 27] },
        { questionId: 'q18', avg: 4.83, count: 30, distribution: [0, 0, 0, 5, 25] },
        { questionId: 'q19', avg: 4.93, count: 30, distribution: [0, 0, 0, 2, 28] },
        { questionId: 'q16', avg: 4.77, count: 30, distribution: [0, 0, 2, 3, 25] },
        { questionId: 'q20', avg: 4.67, count: 30, distribution: [0, 0, 2, 6, 22] },
        { questionId: 'q21', avg: 4.90, count: 30, distribution: [0, 0, 0, 3, 27] },
        { questionId: 'q14', avg: 4.93, count: 30, distribution: [0, 0, 0, 2, 28] },
        { questionId: 'q17', avg: 4.80, count: 30, distribution: [0, 0, 0, 6, 24] },
        { questionId: 'q22', avg: 4.90, count: 30, distribution: [0, 0, 0, 3, 27] },
        { questionId: 'q23', avg: 4.80, count: 30, distribution: [0, 0, 0, 6, 24] },
      ] },
      { instructorId: 'f4', scores: [
        { questionId: 'q6', avg: 4.83, count: 30, distribution: [0, 0, 0, 5, 25] },
        { questionId: 'q15', avg: 4.60, count: 30, distribution: [0, 0, 2, 8, 20] },
        { questionId: 'q18', avg: 4.60, count: 30, distribution: [0, 0, 3, 6, 21] },
        { questionId: 'q19', avg: 4.60, count: 30, distribution: [0, 0, 2, 8, 20] },
        { questionId: 'q7', avg: 4.57, count: 30, distribution: [0, 0, 0, 13, 17] },
        { questionId: 'q16', avg: 4.73, count: 30, distribution: [0, 0, 0, 8, 22] },
        { questionId: 'q20', avg: 4.60, count: 30, distribution: [0, 2, 0, 6, 22] },
        { questionId: 'q21', avg: 4.83, count: 30, distribution: [0, 0, 0, 5, 25] },
        { questionId: 'q14', avg: 4.93, count: 30, distribution: [0, 0, 0, 2, 28] },
        { questionId: 'q17', avg: 4.73, count: 30, distribution: [0, 0, 0, 8, 22] },
        { questionId: 'q22', avg: 4.77, count: 30, distribution: [0, 0, 2, 3, 25] },
        { questionId: 'q23', avg: 4.90, count: 30, distribution: [0, 0, 0, 3, 27] },
      ] },
    ],
    freeTextCounts: { q5: 1, q8: 1 },
  },
  {
    surveyId: 'uon-f9',
    sectionScores: { course_content: [
      { questionId: 'q1', avg: 3.48, count: 21, distribution: [1, 3, 6, 7, 4] },
      { questionId: 'q2', avg: 3.38, count: 21, distribution: [1, 4, 6, 6, 4] },
      { questionId: 'q3', avg: 3.43, count: 21, distribution: [0, 0, 13, 7, 1] },
      { questionId: 'q4', avg: 3.38, count: 21, distribution: [0, 2, 11, 6, 2] },
      { questionId: 'q12', avg: 3.38, count: 21, distribution: [0, 1, 12, 7, 1] },
      { questionId: 'q13', avg: 3.57, count: 21, distribution: [0, 1, 9, 9, 2] },
    ] },
    instructorBlocks: [{ instructorId: 'f2', scores: [
      { questionId: 'q6', avg: 3.81, count: 21, distribution: [0, 2, 5, 9, 5] },
      { questionId: 'q7', avg: 3.57, count: 21, distribution: [1, 2, 6, 8, 4] },
      { questionId: 'q15', avg: 3.67, count: 21, distribution: [0, 3, 3, 13, 2] },
      { questionId: 'q18', avg: 3.86, count: 21, distribution: [0, 3, 2, 11, 5] },
      { questionId: 'q19', avg: 3.43, count: 21, distribution: [0, 1, 11, 8, 1] },
      { questionId: 'q16', avg: 3.43, count: 21, distribution: [0, 1, 11, 8, 1] },
      { questionId: 'q20', avg: 3.38, count: 21, distribution: [0, 3, 8, 9, 1] },
      { questionId: 'q21', avg: 3.86, count: 21, distribution: [0, 2, 2, 14, 3] },
      { questionId: 'q14', avg: 3.62, count: 21, distribution: [0, 1, 8, 10, 2] },
      { questionId: 'q17', avg: 3.67, count: 21, distribution: [0, 1, 7, 11, 2] },
      { questionId: 'q22', avg: 3.52, count: 21, distribution: [0, 3, 7, 8, 3] },
      { questionId: 'q23', avg: 3.67, count: 21, distribution: [0, 1, 5, 15, 0] },
    ] }],
    freeTextCounts: { q5: 1, q8: 1 },
  },
  {
    surveyId: 'uon-f10',
    sectionScores: { course_content: [
      { questionId: 'q1', avg: 3.75, count: 8, distribution: [0, 1, 2, 3, 2] },
      { questionId: 'q2', avg: 3.63, count: 8, distribution: [0, 1, 3, 2, 2] },
      { questionId: 'q3', avg: 3.75, count: 8, distribution: [0, 1, 2, 3, 2] },
      { questionId: 'q4', avg: 3.75, count: 8, distribution: [0, 0, 3, 4, 1] },
      { questionId: 'q12', avg: 3.38, count: 8, distribution: [0, 1, 4, 2, 1] },
      { questionId: 'q13', avg: 3.75, count: 8, distribution: [0, 0, 3, 4, 1] },
    ] },
    instructorBlocks: [{ instructorId: 'f3', scores: [
      { questionId: 'q6', avg: 4.13, count: 8, distribution: [0, 0, 2, 3, 3] },
      { questionId: 'q7', avg: 4.00, count: 8, distribution: [0, 1, 1, 3, 3] },
      { questionId: 'q15', avg: 4.12, count: 8, distribution: [0, 0, 1, 5, 2] },
      { questionId: 'q18', avg: 4.00, count: 8, distribution: [0, 0, 2, 4, 2] },
      { questionId: 'q19', avg: 4.00, count: 8, distribution: [0, 0, 2, 4, 2] },
      { questionId: 'q16', avg: 3.88, count: 8, distribution: [0, 1, 1, 4, 2] },
      { questionId: 'q20', avg: 4.25, count: 8, distribution: [0, 0, 1, 4, 3] },
      { questionId: 'q21', avg: 4.12, count: 8, distribution: [0, 0, 1, 5, 2] },
      { questionId: 'q14', avg: 3.88, count: 8, distribution: [0, 1, 1, 4, 2] },
      { questionId: 'q17', avg: 3.75, count: 8, distribution: [1, 0, 1, 4, 2] },
      { questionId: 'q22', avg: 4.00, count: 8, distribution: [0, 0, 2, 4, 2] },
      { questionId: 'q23', avg: 4.00, count: 8, distribution: [0, 0, 2, 4, 2] },
    ] }],
    freeTextCounts: { q5: 1, q8: 1 },
  },
  {
    surveyId: 'uon-s1',
    sectionScores: { course_content: [
      { questionId: 'q1', avg: 4.28, count: 36, distribution: [0, 1, 4, 15, 16] },
      { questionId: 'q2', avg: 4.31, count: 36, distribution: [0, 1, 4, 14, 17] },
      { questionId: 'q3', avg: 4.22, count: 36, distribution: [0, 0, 5, 18, 13] },
      { questionId: 'q4', avg: 4.03, count: 36, distribution: [0, 0, 8, 19, 9] },
      { questionId: 'q12', avg: 4.42, count: 36, distribution: [0, 0, 0, 21, 15] },
      { questionId: 'q13', avg: 4.11, count: 36, distribution: [0, 0, 7, 18, 11] },
    ] },
    instructorBlocks: [{ instructorId: 'f1', scores: [
      { questionId: 'q6', avg: 4.44, count: 36, distribution: [0, 0, 3, 14, 19] },
      { questionId: 'q7', avg: 4.39, count: 36, distribution: [0, 1, 3, 13, 19] },
      { questionId: 'q15', avg: 4.61, count: 36, distribution: [0, 0, 0, 14, 22] },
      { questionId: 'q18', avg: 4.47, count: 36, distribution: [0, 0, 2, 15, 19] },
      { questionId: 'q19', avg: 4.61, count: 36, distribution: [0, 0, 1, 12, 23] },
      { questionId: 'q16', avg: 4.22, count: 36, distribution: [0, 0, 5, 18, 13] },
      { questionId: 'q20', avg: 4.11, count: 36, distribution: [0, 0, 7, 18, 11] },
      { questionId: 'q21', avg: 4.56, count: 36, distribution: [0, 0, 2, 12, 22] },
      { questionId: 'q14', avg: 4.61, count: 36, distribution: [0, 0, 1, 12, 23] },
      { questionId: 'q17', avg: 4.19, count: 36, distribution: [0, 1, 4, 18, 13] },
      { questionId: 'q22', avg: 4.28, count: 36, distribution: [0, 0, 1, 24, 11] },
      { questionId: 'q23', avg: 4.22, count: 36, distribution: [0, 0, 2, 24, 10] },
    ] }],
    freeTextCounts: { q5: 1, q8: 1 },
  },
  {
    surveyId: 'uon-s2',
    sectionScores: { course_content: [
      { questionId: 'q1', avg: 3.37, count: 19, distribution: [1, 3, 6, 6, 3] },
      { questionId: 'q2', avg: 3.26, count: 19, distribution: [1, 4, 6, 5, 3] },
      { questionId: 'q3', avg: 3.05, count: 19, distribution: [0, 5, 10, 2, 2] },
      { questionId: 'q4', avg: 3.37, count: 19, distribution: [0, 2, 10, 5, 2] },
      { questionId: 'q12', avg: 3.21, count: 19, distribution: [1, 3, 10, 1, 4] },
      { questionId: 'q13', avg: 3.26, count: 19, distribution: [0, 4, 9, 3, 3] },
    ] },
    instructorBlocks: [{ instructorId: 'f3', scores: [
      { questionId: 'q6', avg: 3.74, count: 19, distribution: [0, 2, 5, 8, 4] },
      { questionId: 'q7', avg: 3.42, count: 19, distribution: [1, 3, 5, 7, 3] },
      { questionId: 'q15', avg: 3.32, count: 19, distribution: [0, 1, 13, 3, 2] },
      { questionId: 'q18', avg: 3.74, count: 19, distribution: [0, 1, 4, 13, 1] },
      { questionId: 'q19', avg: 3.53, count: 19, distribution: [0, 2, 7, 8, 2] },
      { questionId: 'q16', avg: 3.37, count: 19, distribution: [0, 2, 10, 5, 2] },
      { questionId: 'q20', avg: 3.37, count: 19, distribution: [0, 1, 11, 6, 1] },
      { questionId: 'q21', avg: 3.74, count: 19, distribution: [0, 0, 6, 12, 1] },
      { questionId: 'q14', avg: 3.37, count: 19, distribution: [0, 2, 9, 7, 1] },
      { questionId: 'q17', avg: 3.68, count: 19, distribution: [0, 1, 5, 12, 1] },
      { questionId: 'q22', avg: 3.47, count: 19, distribution: [0, 1, 9, 8, 1] },
      { questionId: 'q23', avg: 3.42, count: 19, distribution: [0, 2, 10, 4, 3] },
    ] }],
    freeTextCounts: { q5: 1, q8: 1 },
  },
  {
    surveyId: 'uon-s3',
    sectionScores: { course_content: [
      { questionId: 'q1', avg: 4.09, count: 44, distribution: [0, 2, 8, 18, 16] },
      { questionId: 'q2', avg: 4.16, count: 44, distribution: [0, 2, 7, 17, 18] },
      { questionId: 'q3', avg: 4.14, count: 44, distribution: [0, 0, 7, 24, 13] },
      { questionId: 'q4', avg: 4.20, count: 44, distribution: [0, 1, 1, 30, 12] },
      { questionId: 'q12', avg: 4.32, count: 44, distribution: [0, 0, 1, 28, 15] },
      { questionId: 'q13', avg: 4.25, count: 44, distribution: [0, 0, 2, 29, 13] },
    ] },
    instructorBlocks: [{ instructorId: 'f2', scores: [
      { questionId: 'q6', avg: 4.27, count: 44, distribution: [0, 1, 6, 17, 20] },
      { questionId: 'q7', avg: 4.30, count: 44, distribution: [0, 1, 5, 18, 20] },
      { questionId: 'q15', avg: 4.34, count: 44, distribution: [0, 1, 2, 22, 19] },
      { questionId: 'q18', avg: 4.43, count: 44, distribution: [0, 0, 1, 23, 20] },
      { questionId: 'q19', avg: 4.09, count: 44, distribution: [0, 0, 8, 24, 12] },
      { questionId: 'q16', avg: 4.02, count: 44, distribution: [0, 0, 10, 23, 11] },
      { questionId: 'q20', avg: 4.00, count: 44, distribution: [2, 2, 3, 24, 13] },
      { questionId: 'q21', avg: 4.18, count: 44, distribution: [0, 1, 2, 29, 12] },
      { questionId: 'q14', avg: 4.39, count: 44, distribution: [0, 0, 0, 27, 17] },
      { questionId: 'q17', avg: 4.23, count: 44, distribution: [0, 0, 5, 24, 15] },
      { questionId: 'q22', avg: 4.11, count: 44, distribution: [0, 0, 8, 23, 13] },
      { questionId: 'q23', avg: 4.41, count: 44, distribution: [0, 0, 2, 22, 20] },
    ] }],
    freeTextCounts: { q5: 1, q8: 1 },
  },
  {
    surveyId: 'uon-s4',
    sectionScores: { course_content: [
      { questionId: 'q1', avg: 3.90, count: 10, distribution: [0, 1, 2, 4, 3] },
      { questionId: 'q2', avg: 3.80, count: 10, distribution: [0, 1, 3, 3, 3] },
      { questionId: 'q3', avg: 3.70, count: 10, distribution: [0, 0, 3, 7, 0] },
      { questionId: 'q4', avg: 3.60, count: 10, distribution: [0, 1, 2, 7, 0] },
      { questionId: 'q12', avg: 3.70, count: 10, distribution: [0, 0, 3, 7, 0] },
      { questionId: 'q13', avg: 3.90, count: 10, distribution: [0, 0, 3, 5, 2] },
    ] },
    instructorBlocks: [{ instructorId: 'f5', scores: [
      { questionId: 'q6', avg: 4.20, count: 10, distribution: [0, 0, 2, 4, 4] },
      { questionId: 'q7', avg: 4.00, count: 10, distribution: [0, 0, 3, 4, 3] },
      { questionId: 'q15', avg: 4.20, count: 10, distribution: [0, 0, 1, 6, 3] },
      { questionId: 'q18', avg: 4.20, count: 10, distribution: [0, 0, 2, 4, 4] },
      { questionId: 'q19', avg: 4.00, count: 10, distribution: [0, 1, 1, 5, 3] },
      { questionId: 'q16', avg: 4.20, count: 10, distribution: [0, 0, 2, 4, 4] },
      { questionId: 'q20', avg: 3.90, count: 10, distribution: [0, 0, 2, 7, 1] },
      { questionId: 'q21', avg: 4.00, count: 10, distribution: [0, 0, 3, 4, 3] },
      { questionId: 'q14', avg: 4.10, count: 10, distribution: [0, 0, 1, 7, 2] },
      { questionId: 'q17', avg: 3.80, count: 10, distribution: [0, 1, 2, 5, 2] },
      { questionId: 'q22', avg: 3.90, count: 10, distribution: [0, 0, 2, 7, 1] },
      { questionId: 'q23', avg: 4.10, count: 10, distribution: [0, 0, 1, 7, 2] },
    ] }],
    freeTextCounts: { q5: 1, q8: 1 },
  },
  {
    surveyId: 'uon-s5',
    sectionScores: { course_content: [
      { questionId: 'q1', avg: 4.46, count: 28, distribution: [0, 0, 2, 11, 15] },
      { questionId: 'q2', avg: 4.36, count: 28, distribution: [0, 0, 4, 10, 14] },
      { questionId: 'q3', avg: 4.46, count: 28, distribution: [0, 0, 0, 15, 13] },
      { questionId: 'q4', avg: 4.32, count: 28, distribution: [0, 0, 1, 17, 10] },
      { questionId: 'q12', avg: 4.18, count: 28, distribution: [0, 0, 5, 13, 10] },
      { questionId: 'q13', avg: 4.14, count: 28, distribution: [0, 0, 5, 14, 9] },
    ] },
    instructorBlocks: [{ instructorId: 'f6', scores: [
      { questionId: 'q6', avg: 4.57, count: 28, distribution: [0, 0, 1, 10, 17] },
      { questionId: 'q7', avg: 4.46, count: 28, distribution: [0, 0, 2, 11, 15] },
      { questionId: 'q15', avg: 4.71, count: 28, distribution: [0, 1, 0, 5, 22] },
      { questionId: 'q18', avg: 4.21, count: 28, distribution: [0, 0, 4, 14, 10] },
      { questionId: 'q19', avg: 4.32, count: 28, distribution: [0, 0, 2, 15, 11] },
      { questionId: 'q16', avg: 4.25, count: 28, distribution: [0, 0, 4, 13, 11] },
      { questionId: 'q20', avg: 4.36, count: 28, distribution: [0, 0, 1, 16, 11] },
      { questionId: 'q21', avg: 4.36, count: 28, distribution: [0, 0, 1, 16, 11] },
      { questionId: 'q14', avg: 4.36, count: 28, distribution: [0, 0, 2, 14, 12] },
      { questionId: 'q17', avg: 4.21, count: 28, distribution: [0, 0, 1, 20, 7] },
      { questionId: 'q22', avg: 4.32, count: 28, distribution: [0, 0, 0, 19, 9] },
      { questionId: 'q23', avg: 4.21, count: 28, distribution: [0, 0, 1, 20, 7] },
    ] }],
    freeTextCounts: { q5: 1, q8: 1 },
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
  { id: 'f1', name: 'Dr. Anita Patel',    initials: 'AP', avatarUrl: '/portraits/anita-patel.jpg',    role: 'primary', department: 'Nursing',        facultyType: 'core',       rank: 'Professor',           position: 'Department Chair',     email: 'anita.patel@university.edu',    phone: '+1 (555) 101-1001', employmentStatus: 'active'   },
  { id: 'f2', name: 'Dr. Kevin Chen',     initials: 'KC', avatarUrl: '/portraits/kevin-chen.jpg',     role: 'primary', department: 'Community & Public Health Nursing', facultyType: 'core',       rank: 'Associate Professor', position: 'Course Director',      email: 'kevin.chen@university.edu',     phone: '+1 (555) 101-1002', employmentStatus: 'active'   },
  { id: 'f3', name: 'Dr. Maria Williams', initials: 'MW', avatarUrl: '/portraits/maria-williams.jpg', role: 'primary', department: 'Nursing',        facultyType: 'core',       rank: 'Professor',           position: 'Program Director',     email: 'maria.williams@university.edu', phone: '+1 (555) 101-1003', employmentStatus: 'active'   },
  { id: 'f4', name: 'Dr. James Kim',      initials: 'JK', avatarUrl: '/portraits/james-kim.jpg',      role: 'primary', department: 'Clinical Education',      facultyType: 'core',       rank: 'Assistant Professor', position: 'Clinical Coordinator', email: 'james.kim@university.edu',      phone: '+1 (555) 101-1004', employmentStatus: 'active'   },
  { id: 'f5', name: 'Dr. Rachel Gomez',   initials: 'RG', avatarUrl: '/portraits/rachel-gomez.jpg',   role: 'primary', department: 'Nursing',        facultyType: 'core',       rank: 'Associate Professor', position: 'Core Faculty',         email: 'rachel.gomez@university.edu',   phone: '+1 (555) 101-1005', employmentStatus: 'active'   },
  { id: 'f6', name: 'Dr. Omar Hassan',    initials: 'OH', avatarUrl: '/portraits/omar-hassan.jpg',    role: 'primary', department: 'Clinical Education',      facultyType: 'associated', rank: 'Lecturer',            position: 'Lab Instructor',       email: 'omar.hassan@university.edu',    phone: '+1 (555) 101-1006', employmentStatus: 'inactive' },
  /* ── Scale cohort ─────────────────────────────────────────────────────────────
     Romit, design review 2026-07-15 (Granola 1e018244): a real university or cohort
     carries faculty "in the 30s", not six. Six was the number every chart on this
     surface was tuned against, so the leaderboard fit its card by accident of fixture
     size and would have shipped that way. These 28 exist so the scale is REAL in dev:
     N=34 is what the expand pattern and the N>30 mark switch are exercised against.
     f1–f6 keep their exact numbers so no existing demo scenario moves. ─────────── */
  { id: 'f7', name: 'Dr. Priya Raman',       initials: 'PR', role: 'primary', department: 'Nursing', facultyType: 'core', rank: 'Associate Professor', position: 'Core Faculty', email: 'priya.raman@university.edu', phone: '+1 (555) 101-1007', employmentStatus: 'active' },
  { id: 'f8', name: 'Dr. Daniel Okafor',     initials: 'DO', role: 'primary', department: 'Community & Public Health Nursing', facultyType: 'core', rank: 'Assistant Professor', position: 'Core Faculty', email: 'daniel.okafor@university.edu', phone: '+1 (555) 101-1008', employmentStatus: 'active' },
  { id: 'f9', name: 'Dr. Elena Petrova',     initials: 'EP', role: 'primary', department: 'Nursing', facultyType: 'core', rank: 'Professor', position: 'Core Faculty', email: 'elena.petrova@university.edu', phone: '+1 (555) 101-1009', employmentStatus: 'active' },
  { id: 'f10', name: 'Dr. Marcus Bell',       initials: 'MB', role: 'primary', department: 'Clinical Education', facultyType: 'associated', rank: 'Lecturer', position: 'Lab Instructor', email: 'marcus.bell@university.edu', phone: '+1 (555) 101-1010', employmentStatus: 'active' },
  { id: 'f11', name: 'Dr. Sofia Marino',      initials: 'SM', role: 'primary', department: 'Psychiatric-Mental Health Nursing', facultyType: 'core', rank: 'Associate Professor', position: 'Course Director', email: 'sofia.marino@university.edu', phone: '+1 (555) 101-1011', employmentStatus: 'active' },
  { id: 'f12', name: 'Dr. Henry Adjei',       initials: 'HA', role: 'primary', department: 'Nursing', facultyType: 'associated', rank: 'Lecturer', position: 'Lab Instructor', email: 'henry.adjei@university.edu', phone: '+1 (555) 101-1012', employmentStatus: 'active' },
  { id: 'f13', name: 'Dr. Naomi Feldman',     initials: 'NF', role: 'primary', department: 'Community & Public Health Nursing', facultyType: 'core', rank: 'Assistant Professor', position: 'Core Faculty', email: 'naomi.feldman@university.edu', phone: '+1 (555) 101-1013', employmentStatus: 'active' },
  { id: 'f14', name: 'Dr. Victor Ruiz',       initials: 'VR', role: 'primary', department: 'Clinical Education', facultyType: 'core', rank: 'Associate Professor', position: 'Clinical Coordinator', email: 'victor.ruiz@university.edu', phone: '+1 (555) 101-1014', employmentStatus: 'active' },
  { id: 'f15', name: 'Dr. Grace Lin',         initials: 'GL', role: 'primary', department: 'Nursing', facultyType: 'core', rank: 'Professor', position: 'Core Faculty', email: 'grace.lin@university.edu', phone: '+1 (555) 101-1015', employmentStatus: 'active' },
  { id: 'f16', name: 'Dr. Samuel Osei',       initials: 'SO', role: 'primary', department: 'Community & Public Health Nursing', facultyType: 'associated', rank: 'Lecturer', position: 'Teaching Assistant', email: 'samuel.osei@university.edu', phone: '+1 (555) 101-1016', employmentStatus: 'active' },
  { id: 'f17', name: 'Dr. Hana Suzuki',       initials: 'HS', role: 'primary', department: 'Psychiatric-Mental Health Nursing', facultyType: 'core', rank: 'Assistant Professor', position: 'Core Faculty', email: 'hana.suzuki@university.edu', phone: '+1 (555) 101-1017', employmentStatus: 'active' },
  { id: 'f18', name: 'Dr. Liam Doherty',      initials: 'LD', role: 'primary', department: 'Nursing', facultyType: 'core', rank: 'Associate Professor', position: 'Core Faculty', email: 'liam.doherty@university.edu', phone: '+1 (555) 101-1018', employmentStatus: 'active' },
  { id: 'f19', name: 'Dr. Amara Nwosu',       initials: 'AN', role: 'primary', department: 'Clinical Education', facultyType: 'core', rank: 'Assistant Professor', position: 'Core Faculty', email: 'amara.nwosu@university.edu', phone: '+1 (555) 101-1019', employmentStatus: 'active' },
  { id: 'f20', name: 'Dr. Tomas Novak',       initials: 'TN', role: 'primary', department: 'Community & Public Health Nursing', facultyType: 'core', rank: 'Professor', position: 'Course Director', email: 'tomas.novak@university.edu', phone: '+1 (555) 101-1020', employmentStatus: 'active' },
  { id: 'f21', name: 'Dr. Yuki Tanaka',       initials: 'YT', role: 'primary', department: 'Nursing', facultyType: 'associated', rank: 'Lecturer', position: 'Lab Instructor', email: 'yuki.tanaka@university.edu', phone: '+1 (555) 101-1021', employmentStatus: 'active' },
  { id: 'f22', name: 'Dr. Rosa Delgado',      initials: 'RD', role: 'primary', department: 'Psychiatric-Mental Health Nursing', facultyType: 'core', rank: 'Associate Professor', position: 'Core Faculty', email: 'rosa.delgado@university.edu', phone: '+1 (555) 101-1022', employmentStatus: 'active' },
  { id: 'f23', name: 'Dr. Ethan Brooks',      initials: 'EB', role: 'primary', department: 'Nursing', facultyType: 'core', rank: 'Assistant Professor', position: 'Core Faculty', email: 'ethan.brooks@university.edu', phone: '+1 (555) 101-1023', employmentStatus: 'active' },
  { id: 'f24', name: 'Dr. Ingrid Larsen',     initials: 'IL', role: 'primary', department: 'Community & Public Health Nursing', facultyType: 'core', rank: 'Associate Professor', position: 'Core Faculty', email: 'ingrid.larsen@university.edu', phone: '+1 (555) 101-1024', employmentStatus: 'active' },
  { id: 'f25', name: 'Dr. Paulo Ferreira',    initials: 'PF', role: 'primary', department: 'Clinical Education', facultyType: 'associated', rank: 'Lecturer', position: 'Teaching Assistant', email: 'paulo.ferreira@university.edu', phone: '+1 (555) 101-1025', employmentStatus: 'active' },
  { id: 'f26', name: 'Dr. Mei Zhang',         initials: 'MZ', role: 'primary', department: 'Nursing', facultyType: 'core', rank: 'Professor', position: 'Core Faculty', email: 'mei.zhang@university.edu', phone: '+1 (555) 101-1026', employmentStatus: 'active' },
  { id: 'f27', name: 'Dr. Andre Dubois',      initials: 'AD', role: 'primary', department: 'Community & Public Health Nursing', facultyType: 'core', rank: 'Assistant Professor', position: 'Core Faculty', email: 'andre.dubois@university.edu', phone: '+1 (555) 101-1027', employmentStatus: 'active' },
  { id: 'f28', name: 'Dr. Fatima Rahimi',     initials: 'FR', role: 'primary', department: 'Psychiatric-Mental Health Nursing', facultyType: 'core', rank: 'Associate Professor', position: 'Core Faculty', email: 'fatima.rahimi@university.edu', phone: '+1 (555) 101-1028', employmentStatus: 'active' },
  { id: 'f29', name: 'Dr. Caleb Morrison',    initials: 'CM', role: 'primary', department: 'Nursing', facultyType: 'associated', rank: 'Lecturer', position: 'Lab Instructor', email: 'caleb.morrison@university.edu', phone: '+1 (555) 101-1029', employmentStatus: 'active' },
  { id: 'f30', name: 'Dr. Nadia Haddad',      initials: 'NH', role: 'primary', department: 'Clinical Education', facultyType: 'core', rank: 'Assistant Professor', position: 'Core Faculty', email: 'nadia.haddad@university.edu', phone: '+1 (555) 101-1030', employmentStatus: 'active' },
  { id: 'f31', name: 'Dr. Oscar Lindqvist',   initials: 'OL', role: 'primary', department: 'Community & Public Health Nursing', facultyType: 'core', rank: 'Associate Professor', position: 'Core Faculty', email: 'oscar.lindqvist@university.edu', phone: '+1 (555) 101-1031', employmentStatus: 'active' },
  { id: 'f32', name: 'Dr. Talia Bergman',     initials: 'TB', role: 'primary', department: 'Nursing', facultyType: 'core', rank: 'Assistant Professor', position: 'Core Faculty', email: 'talia.bergman@university.edu', phone: '+1 (555) 101-1032', employmentStatus: 'active' },
  { id: 'f33', name: 'Dr. Rohan Mehta',       initials: 'RM', role: 'primary', department: 'Psychiatric-Mental Health Nursing', facultyType: 'core', rank: 'Associate Professor', position: 'Course Director', email: 'rohan.mehta@university.edu', phone: '+1 (555) 101-1033', employmentStatus: 'active' },
  { id: 'f34', name: 'Dr. Claire Beaumont',   initials: 'CB', role: 'primary', department: 'Nursing', facultyType: 'core', rank: 'Professor', position: 'Core Faculty', email: 'claire.beaumont@university.edu', phone: '+1 (555) 101-1034', employmentStatus: 'active' },
]

export interface FacultyOfferingRecord {
  facultyId: string
  surveyId?: string
  courseCode: string
  courseName: string
  term: string
  /** Graduating class taking this offering. The collection grain is course × term × cohort ×
   *  faculty (Aarti D-1/D3: "it is always on a course offering, which is for a particular
   *  cohort in a particular term"). */
  cohort?: string
  role: 'primary' | 'guest'
  /** Explicit evaluatee role — see `PceInstructor.evalRole`. Wins over the
   *  position-derived `facultyEvalRole()` in `offeringPoints()` when set. */
  evalRole?: FacultyEvalRoleId
  enrolled: number
  responseRate: number
  /** Faculty-performance score, 1–5 — how the INSTRUCTOR was rated. */
  avgRating: number
  /** Course-content score, 1–5 — how the COURSE was rated.
   *  Students rate two distinct entities and they are never combined into one number
   *  (D27 / D7, Aarti and Monil independently). Carrying both on the offering is also what
   *  lets every course appear in the course-quality heatmap: this used to live only in
   *  `PceSurvey.priorOfferings`, which covered 5 of 15 courses, so Overview showed 5 courses
   *  in the heatmap and 9 in the ranked list. */
  courseAvg?: number
}

export const MOCK_FACULTY_OFFERINGS: FacultyOfferingRecord[] = [
  // Diversified scenarios (2026-07-14). Every faculty owns MULTIPLE courses, each taught to a
  // cohort across terms — the charts cannot tell a story on a one-course portfolio.
  // Each row carries BOTH rated entities: avgRating = the instructor, courseAvg = the content.
  //
  // The six are deliberately distinguishable, because each exists to prove a different chart:
  //   f1 Patel   — steady & high (mean 4.43, spread 0.25) ...... the control
  //   f2 Chen    — declining (3-year mean well above 1-year) ... the drift arrow
  //   f3 Williams— improving (mirror of Chen) ................. arrows must oppose
  //   f4 Kim     — VOLATILE (mean 4.15, spread 1.40) .......... the distribution behind the dot
  //   f5 Gomez   — below median; course strong / faculty gap ... gap quadrant SE
  //   f6 Hassan  — faculty strong / course gap ................ gap quadrant NW
  { facultyId: 'f1', courseCode: 'NURS-501', courseName: 'Human Anatomy & Physiology', term: 'Spring 2024', cohort: 'Class of 2027', role: 'primary', enrolled: 50, responseRate: 72, avgRating: 4.40, courseAvg: 4.20 },
  { facultyId: 'f1', courseCode: 'NURS-530', courseName: 'Maternal-Newborn Nursing', term: 'Spring 2024', cohort: 'Class of 2027', role: 'primary', enrolled: 42, responseRate: 68, avgRating: 4.30, courseAvg: 4.10 },
  { facultyId: 'f2', courseCode: 'NURS-515', courseName: 'Pharmacology for Nurses', term: 'Spring 2024', cohort: 'Class of 2027', role: 'primary', enrolled: 55, responseRate: 66, avgRating: 4.30, courseAvg: 4.15 },
  { facultyId: 'f2', courseCode: 'NURS-601', courseName: 'Clinical Practicum I', term: 'Spring 2024', cohort: 'Class of 2026', role: 'primary', enrolled: 36, responseRate: 78, avgRating: 4.45, courseAvg: 4.30 },
  { facultyId: 'f3', courseCode: 'NURS-502', courseName: 'Physiology & Pathophysiology', term: 'Spring 2024', cohort: 'Class of 2027', role: 'primary', enrolled: 58, responseRate: 60, avgRating: 3.80, courseAvg: 3.75 },
  { facultyId: 'f4', courseCode: 'NURS-710', courseName: 'Advanced Neurological Nursing', term: 'Spring 2024', cohort: 'Class of 2026', role: 'primary', enrolled: 20, responseRate: 90, avgRating: 4.80, courseAvg: 4.50 },
  { facultyId: 'f5', courseCode: 'NURS-620', courseName: 'Geriatric Nursing', term: 'Spring 2024', cohort: 'Class of 2026', role: 'primary', enrolled: 30, responseRate: 60, avgRating: 3.70, courseAvg: 4.35 },
  { facultyId: 'f5', courseCode: 'NURS-801', courseName: 'Evidence-Based Practice', term: 'Spring 2024', cohort: 'Class of 2026', role: 'primary', enrolled: 34, responseRate: 56, avgRating: 3.60, courseAvg: 4.50 },
  { facultyId: 'f6', courseCode: 'NURS-611', courseName: 'Pediatric Nursing', term: 'Spring 2024', cohort: 'Class of 2026', role: 'primary', enrolled: 22, responseRate: 84, avgRating: 4.55, courseAvg: 3.70 },
  { facultyId: 'f1', courseCode: 'NURS-505', courseName: 'Fundamentals of Nursing I', term: 'Fall 2024', cohort: 'Class of 2027', role: 'primary', enrolled: 44, responseRate: 70, avgRating: 4.35, courseAvg: 4.15 },
  // 4th instructor (Spring 2024) — the faculty heatmap needs ≥4 distinct instructors per
  // course, incl. a clear top scorer (Ruiz, 4.55, above f1's 4.40 max) and bottom (f26, 3.63).
  { facultyId: 'f14', courseCode: 'NURS-505', courseName: 'Fundamentals of Nursing I', term: 'Spring 2024', cohort: 'Class of 2026', role: 'primary', enrolled: 40, responseRate: 71, avgRating: 4.55, courseAvg: 4.05 },
  { facultyId: 'f2', courseCode: 'NURS-602', courseName: 'Clinical Practicum II', term: 'Fall 2024', cohort: 'Class of 2026', role: 'primary', enrolled: 30, responseRate: 74, avgRating: 4.35, courseAvg: 4.20 },
  { facultyId: 'f3', courseCode: 'NURS-506', courseName: 'Fundamentals of Nursing II', term: 'Fall 2024', cohort: 'Class of 2027', role: 'primary', enrolled: 46, responseRate: 64, avgRating: 3.90, courseAvg: 3.85 },
  { facultyId: 'f3', courseCode: 'NURS-620', courseName: 'Geriatric Nursing', term: 'Fall 2024', cohort: 'Class of 2026', role: 'primary', enrolled: 28, responseRate: 68, avgRating: 3.85, courseAvg: 3.80 },
  { facultyId: 'f4', courseCode: 'NURS-501', courseName: 'Human Anatomy & Physiology', term: 'Fall 2024', cohort: 'Class of 2027', role: 'primary', enrolled: 50, responseRate: 76, avgRating: 4.60, courseAvg: 4.30 },
  { facultyId: 'f4', courseCode: 'NURS-711', courseName: 'Advanced Pediatric Nursing', term: 'Fall 2024', cohort: 'Class of 2026', role: 'primary', enrolled: 16, responseRate: 50, avgRating: 3.40, courseAvg: 3.60 },
  { facultyId: 'f5', courseCode: 'NURS-540', courseName: 'Clinical Reasoning & Diagnostics', term: 'Fall 2024', cohort: 'Class of 2027', role: 'primary', enrolled: 26, responseRate: 58, avgRating: 3.50, courseAvg: 4.40 },
  { facultyId: 'f6', courseCode: 'NURS-515', courseName: 'Pharmacology for Nurses', term: 'Fall 2024', cohort: 'Class of 2027', role: 'primary', enrolled: 55, responseRate: 80, avgRating: 4.60, courseAvg: 3.60 },
  { facultyId: 'f6', courseCode: 'NURS-801', courseName: 'Evidence-Based Practice', term: 'Fall 2024', cohort: 'Class of 2026', role: 'primary', enrolled: 34, responseRate: 78, avgRating: 4.70, courseAvg: 3.65 },
  { facultyId: 'f1', courseCode: 'NURS-501', courseName: 'Human Anatomy & Physiology', term: 'Spring 2025', cohort: 'Class of 2028', role: 'primary', enrolled: 48, responseRate: 74, avgRating: 4.45, courseAvg: 4.25 },
  { facultyId: 'f1', courseCode: 'NURS-510', courseName: 'Medical-Surgical Nursing I', term: 'Spring 2025', cohort: 'Class of 2028', role: 'primary', enrolled: 38, responseRate: 82, avgRating: 4.50, courseAvg: 4.35 },
  { facultyId: 'f2', courseCode: 'NURS-515', courseName: 'Pharmacology for Nurses', term: 'Spring 2025', cohort: 'Class of 2028', role: 'primary', enrolled: 52, responseRate: 58, avgRating: 4.00, courseAvg: 3.95 },
  { facultyId: 'f2', courseCode: 'NURS-601', courseName: 'Clinical Practicum I', term: 'Spring 2025', cohort: 'Class of 2027', role: 'primary', enrolled: 34, responseRate: 70, avgRating: 4.10, courseAvg: 4.05 },
  { facultyId: 'f3', courseCode: 'NURS-502', courseName: 'Physiology & Pathophysiology', term: 'Spring 2025', cohort: 'Class of 2028', role: 'primary', enrolled: 60, responseRate: 70, avgRating: 4.15, courseAvg: 4.05 },
  { facultyId: 'f3', courseCode: 'NURS-611', courseName: 'Pediatric Nursing', term: 'Spring 2025', cohort: 'Class of 2027', role: 'primary', enrolled: 22, responseRate: 86, avgRating: 4.20, courseAvg: 4.10 },
  { facultyId: 'f4', courseCode: 'NURS-530', courseName: 'Maternal-Newborn Nursing', term: 'Spring 2025', cohort: 'Class of 2028', role: 'primary', enrolled: 40, responseRate: 54, avgRating: 3.50, courseAvg: 3.70 },
  { facultyId: 'f4', courseCode: 'NURS-710', courseName: 'Advanced Neurological Nursing', term: 'Spring 2025', cohort: 'Class of 2026', role: 'primary', enrolled: 18, responseRate: 55, avgRating: 3.50, courseAvg: 3.70 },
  { facultyId: 'f5', courseCode: 'NURS-540', courseName: 'Clinical Reasoning & Diagnostics', term: 'Spring 2025', cohort: 'Class of 2028', role: 'primary', enrolled: 28, responseRate: 62, avgRating: 3.65, courseAvg: 4.35 },
  { facultyId: 'f5', courseCode: 'NURS-801', courseName: 'Evidence-Based Practice', term: 'Spring 2025', cohort: 'Class of 2026', role: 'primary', enrolled: 32, responseRate: 52, avgRating: 3.55, courseAvg: 4.45 },
  { facultyId: 'f6', courseCode: 'NURS-506', courseName: 'Fundamentals of Nursing II', term: 'Spring 2025', cohort: 'Class of 2028', role: 'primary', enrolled: 46, responseRate: 76, avgRating: 4.50, courseAvg: 3.75 },
  { facultyId: 'f1', courseCode: 'NURS-505', courseName: 'Fundamentals of Nursing I', term: 'Fall 2025', cohort: 'Class of 2028', role: 'primary', enrolled: 46, responseRate: 73, avgRating: 4.40, courseAvg: 4.20 },
  { facultyId: 'f1', courseCode: 'NURS-530', courseName: 'Maternal-Newborn Nursing', term: 'Fall 2025', cohort: 'Class of 2028', role: 'primary', enrolled: 44, responseRate: 76, avgRating: 4.40, courseAvg: 4.25 },
  { facultyId: 'f2', courseCode: 'NURS-540', courseName: 'Clinical Reasoning & Diagnostics', term: 'Fall 2025', cohort: 'Class of 2028', role: 'primary', enrolled: 26, responseRate: 64, avgRating: 3.95, courseAvg: 3.85 },
  { facultyId: 'f2', courseCode: 'NURS-602', courseName: 'Clinical Practicum II', term: 'Fall 2025', cohort: 'Class of 2027', role: 'primary', enrolled: 28, responseRate: 60, avgRating: 3.85, courseAvg: 3.90 },
  { facultyId: 'f3', courseCode: 'NURS-506', courseName: 'Fundamentals of Nursing II', term: 'Fall 2025', cohort: 'Class of 2028', role: 'primary', enrolled: 48, responseRate: 76, avgRating: 4.35, courseAvg: 4.20 },
  { facultyId: 'f3', courseCode: 'NURS-620', courseName: 'Geriatric Nursing', term: 'Fall 2025', cohort: 'Class of 2027', role: 'primary', enrolled: 30, responseRate: 78, avgRating: 4.20, courseAvg: 4.15 },
  { facultyId: 'f4', courseCode: 'NURS-501', courseName: 'Human Anatomy & Physiology', term: 'Fall 2025', cohort: 'Class of 2028', role: 'primary', enrolled: 48, responseRate: 58, avgRating: 3.60, courseAvg: 3.80 },
  { facultyId: 'f4', courseCode: 'NURS-711', courseName: 'Advanced Pediatric Nursing', term: 'Fall 2025', cohort: 'Class of 2027', role: 'primary', enrolled: 18, responseRate: 86, avgRating: 4.70, courseAvg: 4.45 },
  { facultyId: 'f6', courseCode: 'NURS-515', courseName: 'Pharmacology for Nurses', term: 'Fall 2025', cohort: 'Class of 2028', role: 'primary', enrolled: 54, responseRate: 82, avgRating: 4.65, courseAvg: 3.55 },
  { facultyId: 'f6', courseCode: 'NURS-611', courseName: 'Pediatric Nursing', term: 'Fall 2025', cohort: 'Class of 2027', role: 'primary', enrolled: 24, responseRate: 86, avgRating: 4.60, courseAvg: 3.65 },
  { facultyId: 'f6', courseCode: 'NURS-801', courseName: 'Evidence-Based Practice', term: 'Fall 2025', cohort: 'Class of 2026', role: 'primary', enrolled: 35, responseRate: 84, avgRating: 4.75, courseAvg: 3.70 },
  { facultyId: 'f1', courseCode: 'NURS-501', courseName: 'Human Anatomy & Physiology', term: 'Spring 2026', cohort: 'Class of 2028', role: 'primary', enrolled: 52, responseRate: 78, avgRating: 4.50, courseAvg: 4.30 },
  { facultyId: 'f1', courseCode: 'NURS-510', courseName: 'Medical-Surgical Nursing I', term: 'Spring 2026', cohort: 'Class of 2028', role: 'primary', enrolled: 40, responseRate: 84, avgRating: 4.55, courseAvg: 4.40 },
  { facultyId: 'f2', courseCode: 'NURS-515', courseName: 'Pharmacology for Nurses', term: 'Spring 2026', cohort: 'Class of 2028', role: 'primary', enrolled: 50, responseRate: 54, avgRating: 3.70, courseAvg: 3.75 },
  { facultyId: 'f2', courseCode: 'NURS-540', courseName: 'Clinical Reasoning & Diagnostics', term: 'Spring 2026', cohort: 'Class of 2028', role: 'primary', enrolled: 24, responseRate: 58, avgRating: 3.80, courseAvg: 3.70 },
  { facultyId: 'f2', courseCode: 'NURS-601', courseName: 'Clinical Practicum I', term: 'Spring 2026', cohort: 'Class of 2027', role: 'primary', enrolled: 32, responseRate: 62, avgRating: 3.75, courseAvg: 3.80 },
  { facultyId: 'f3', courseCode: 'NURS-502', courseName: 'Physiology & Pathophysiology', term: 'Spring 2026', cohort: 'Class of 2028', role: 'primary', enrolled: 62, responseRate: 80, avgRating: 4.50, courseAvg: 4.35 },
  { facultyId: 'f3', courseCode: 'NURS-611', courseName: 'Pediatric Nursing', term: 'Spring 2026', cohort: 'Class of 2027', role: 'primary', enrolled: 24, responseRate: 92, avgRating: 4.55, courseAvg: 4.40 },
  { facultyId: 'f3', courseCode: 'NURS-620', courseName: 'Geriatric Nursing', term: 'Spring 2026', cohort: 'Class of 2027', role: 'primary', enrolled: 30, responseRate: 84, avgRating: 4.45, courseAvg: 4.30 },
  { facultyId: 'f4', courseCode: 'NURS-530', courseName: 'Maternal-Newborn Nursing', term: 'Spring 2026', cohort: 'Class of 2028', role: 'primary', enrolled: 42, responseRate: 82, avgRating: 4.65, courseAvg: 4.35 },
  { facultyId: 'f4', courseCode: 'NURS-710', courseName: 'Advanced Neurological Nursing', term: 'Spring 2026', cohort: 'Class of 2027', role: 'primary', enrolled: 22, responseRate: 88, avgRating: 4.60, courseAvg: 4.40 },
  { facultyId: 'f5', courseCode: 'NURS-620', courseName: 'Geriatric Nursing', term: 'Spring 2026', cohort: 'Class of 2027', role: 'primary', enrolled: 32, responseRate: 64, avgRating: 3.80, courseAvg: 4.40 },
  { facultyId: 'f5', courseCode: 'NURS-801', courseName: 'Evidence-Based Practice', term: 'Spring 2026', cohort: 'Class of 2026', role: 'primary', enrolled: 36, responseRate: 60, avgRating: 3.70, courseAvg: 4.55 },
  { facultyId: 'f6', courseCode: 'NURS-506', courseName: 'Fundamentals of Nursing II', term: 'Spring 2026', cohort: 'Class of 2028', role: 'primary', enrolled: 47, responseRate: 80, avgRating: 4.60, courseAvg: 3.80 },
  /* ── Summer 2026 (pt9) — the Dashboard's "Last closed term" card. Mixed on purpose:
     f1 Patel and f3 Williams (the file's own high/steady faculty above) stay above
     4.0 on both axes; f2 Chen, f4 Kim land below on both; f5 Gomez (already "below
     median" per this file's header) is below on faculty only, f6 Hassan below on
     course only — 4 of 9 courses and 3 of 6 faculty read below the 4.0
     RATING_THRESHOLD (pce-analytics.ts), close to but not a scripted match of
     Vishal's illustrative "4 courses and 5 faculty" (per house style: PRD numbers
     are illustrative, not verbatim — feedback_professional_microcopy_standard). */
  { facultyId: 'f1', courseCode: 'NURS-501', courseName: 'Human Anatomy & Physiology', term: 'Summer 2026', cohort: 'Class of 2028', role: 'primary', enrolled: 50, responseRate: 82, avgRating: 4.50, courseAvg: 4.30 },
  { facultyId: 'f1', courseCode: 'NURS-510', courseName: 'Medical-Surgical Nursing I', term: 'Summer 2026', cohort: 'Class of 2028', role: 'primary', enrolled: 42, responseRate: 80, avgRating: 4.45, courseAvg: 4.25 },
  { facultyId: 'f2', courseCode: 'NURS-515', courseName: 'Pharmacology for Nurses', term: 'Summer 2026', cohort: 'Class of 2028', role: 'primary', enrolled: 46, responseRate: 70, avgRating: 3.75, courseAvg: 3.70 },
  { facultyId: 'f2', courseCode: 'NURS-540', courseName: 'Clinical Reasoning & Diagnostics', term: 'Summer 2026', cohort: 'Class of 2028', role: 'primary', enrolled: 38, responseRate: 68, avgRating: 3.85, courseAvg: 3.90 },
  { facultyId: 'f3', courseCode: 'NURS-502', courseName: 'Physiology & Pathophysiology', term: 'Summer 2026', cohort: 'Class of 2028', role: 'primary', enrolled: 54, responseRate: 88, avgRating: 4.40, courseAvg: 4.20 },
  { facultyId: 'f3', courseCode: 'NURS-611', courseName: 'Pediatric Nursing', term: 'Summer 2026', cohort: 'Class of 2027', role: 'primary', enrolled: 30, responseRate: 85, avgRating: 4.35, courseAvg: 4.15 },
  { facultyId: 'f4', courseCode: 'NURS-530', courseName: 'Maternal-Newborn Nursing', term: 'Summer 2026', cohort: 'Class of 2027', role: 'primary', enrolled: 44, responseRate: 60, avgRating: 3.60, courseAvg: 3.80 },
  { facultyId: 'f5', courseCode: 'NURS-620', courseName: 'Geriatric Nursing', term: 'Summer 2026', cohort: 'Class of 2027', role: 'primary', enrolled: 34, responseRate: 65, avgRating: 3.70, courseAvg: 4.35 },
  { facultyId: 'f6', courseCode: 'NURS-801', courseName: 'Evidence-Based Practice', term: 'Summer 2026', cohort: 'Class of 2026', role: 'primary', enrolled: 32, responseRate: 78, avgRating: 4.55, courseAvg: 3.75 },
  /* ── Scale cohort offerings (f7–f34) ─────────────────────────────────────────
     Without these the 28 new faculty exist in the directory but never reach
     offeringPoints(), so the leaderboard would still draw six and the scale fix
     would look done while proving nothing. Deterministic LCG, never Math.random —
     a fixture that shifts per run makes every visual diff noise. ──────────────── */
  { facultyId: 'f7', courseCode: 'NURS-501', courseName: 'Human Anatomy & Physiology', term: 'Spring 2025', cohort: 'Class of 2027', role: 'primary', enrolled: 20, responseRate: 73, avgRating: 3.42, courseAvg: 4.21 },
  { facultyId: 'f7', courseCode: 'NURS-620', courseName: 'Geriatric Nursing', term: 'Fall 2024', cohort: 'Class of 2027', role: 'primary', enrolled: 53, responseRate: 59, avgRating: 4.53, courseAvg: 3.85 },
  { facultyId: 'f8', courseCode: 'NURS-801', courseName: 'Evidence-Based Practice', term: 'Spring 2025', cohort: 'Class of 2027', role: 'primary', enrolled: 62, responseRate: 69, avgRating: 3.32, courseAvg: 4.11 },
  { facultyId: 'f9', courseCode: 'NURS-711', courseName: 'Advanced Pediatric Nursing', term: 'Spring 2025', cohort: 'Class of 2027', role: 'primary', enrolled: 59, responseRate: 66, avgRating: 4.71, courseAvg: 4.02 },
  { facultyId: 'f9', courseCode: 'NURS-602', courseName: 'Clinical Practicum II', term: 'Spring 2024', cohort: 'Class of 2026', role: 'primary', enrolled: 47, responseRate: 52, avgRating: 4.32, courseAvg: 3.66 },
  { facultyId: 'f9', courseCode: 'NURS-515', courseName: 'Pharmacology for Nurses', term: 'Spring 2026', cohort: 'Class of 2028', role: 'primary', enrolled: 35, responseRate: 90, avgRating: 3.92, courseAvg: 4.65 },
  { facultyId: 'f10', courseCode: 'NURS-710', courseName: 'Advanced Neurological Nursing', term: 'Fall 2024', cohort: 'Class of 2027', role: 'primary', enrolled: 56, responseRate: 62, avgRating: 4.61, courseAvg: 3.92 },
  { facultyId: 'f11', courseCode: 'NURS-620', courseName: 'Geriatric Nursing', term: 'Fall 2024', cohort: 'Class of 2027', role: 'primary', enrolled: 52, responseRate: 59, avgRating: 4.50, courseAvg: 3.83 },
  { facultyId: 'f11', courseCode: 'NURS-540', courseName: 'Clinical Reasoning & Diagnostics', term: 'Spring 2026', cohort: 'Class of 2028', role: 'primary', enrolled: 40, responseRate: 45, avgRating: 4.11, courseAvg: 3.47 },
  { facultyId: 'f11', courseCode: 'NURS-506', courseName: 'Fundamentals of Nursing II', term: 'Fall 2025', cohort: 'Class of 2028', role: 'primary', enrolled: 29, responseRate: 83, avgRating: 3.71, courseAvg: 4.46 },
  { facultyId: 'f12', courseCode: 'NURS-611', courseName: 'Pediatric Nursing', term: 'Spring 2024', cohort: 'Class of 2026', role: 'primary', enrolled: 49, responseRate: 55, avgRating: 4.40, courseAvg: 3.73 },
  { facultyId: 'f12', courseCode: 'NURS-530', courseName: 'Maternal-Newborn Nursing', term: 'Spring 2026', cohort: 'Class of 2028', role: 'primary', enrolled: 37, responseRate: 93, avgRating: 4.00, courseAvg: 4.73 },
  { facultyId: 'f13', courseCode: 'NURS-602', courseName: 'Clinical Practicum II', term: 'Spring 2024', cohort: 'Class of 2026', role: 'primary', enrolled: 46, responseRate: 51, avgRating: 4.29, courseAvg: 3.64 },
  { facultyId: 'f14', courseCode: 'NURS-601', courseName: 'Clinical Practicum I', term: 'Spring 2024', cohort: 'Class of 2026', role: 'primary', enrolled: 43, responseRate: 48, avgRating: 4.19, courseAvg: 3.54 },
  { facultyId: 'f14', courseCode: 'NURS-510', courseName: 'Medical-Surgical Nursing I', term: 'Fall 2025', cohort: 'Class of 2028', role: 'primary', enrolled: 31, responseRate: 86, avgRating: 3.79, courseAvg: 4.54 },
  { facultyId: 'f14', courseCode: 'NURS-501', courseName: 'Human Anatomy & Physiology', term: 'Spring 2025', cohort: 'Class of 2027', role: 'primary', enrolled: 19, responseRate: 72, avgRating: 3.39, courseAvg: 4.18 },
  { facultyId: 'f15', courseCode: 'NURS-530', courseName: 'Maternal-Newborn Nursing', term: 'Spring 2026', cohort: 'Class of 2028', role: 'primary', enrolled: 40, responseRate: 44, avgRating: 4.08, courseAvg: 3.45 },
  { facultyId: 'f16', courseCode: 'NURS-515', courseName: 'Pharmacology for Nurses', term: 'Spring 2026', cohort: 'Class of 2028', role: 'primary', enrolled: 37, responseRate: 92, avgRating: 3.98, courseAvg: 4.70 },
  { facultyId: 'f16', courseCode: 'NURS-502', courseName: 'Physiology & Pathophysiology', term: 'Fall 2025', cohort: 'Class of 2028', role: 'primary', enrolled: 25, responseRate: 79, avgRating: 3.58, courseAvg: 4.35 },
  { facultyId: 'f16', courseCode: 'NURS-711', courseName: 'Advanced Pediatric Nursing', term: 'Fall 2024', cohort: 'Class of 2027', role: 'primary', enrolled: 58, responseRate: 65, avgRating: 4.68, courseAvg: 3.99 },
  { facultyId: 'f17', courseCode: 'NURS-510', courseName: 'Medical-Surgical Nursing I', term: 'Spring 2026', cohort: 'Class of 2028', role: 'primary', enrolled: 33, responseRate: 89, avgRating: 3.87, courseAvg: 4.61 },
  { facultyId: 'f17', courseCode: 'NURS-501', courseName: 'Human Anatomy & Physiology', term: 'Spring 2025', cohort: 'Class of 2027', role: 'primary', enrolled: 22, responseRate: 75, avgRating: 3.48, courseAvg: 4.25 },
  { facultyId: 'f18', courseCode: 'NURS-506', courseName: 'Fundamentals of Nursing II', term: 'Fall 2025', cohort: 'Class of 2028', role: 'primary', enrolled: 30, responseRate: 85, avgRating: 3.77, courseAvg: 4.51 },
  { facultyId: 'f19', courseCode: 'NURS-505', courseName: 'Fundamentals of Nursing I', term: 'Fall 2025', cohort: 'Class of 2028', role: 'primary', enrolled: 27, responseRate: 81, avgRating: 3.66, courseAvg: 4.42 },
  { facultyId: 'f19', courseCode: 'NURS-711', courseName: 'Advanced Pediatric Nursing', term: 'Spring 2025', cohort: 'Class of 2027', role: 'primary', enrolled: 60, responseRate: 68, avgRating: 4.76, courseAvg: 4.06 },
  { facultyId: 'f19', courseCode: 'NURS-602', courseName: 'Clinical Practicum II', term: 'Spring 2024', cohort: 'Class of 2026', role: 'primary', enrolled: 48, responseRate: 54, avgRating: 4.37, courseAvg: 3.71 },
  { facultyId: 'f20', courseCode: 'NURS-502', courseName: 'Physiology & Pathophysiology', term: 'Fall 2025', cohort: 'Class of 2028', role: 'primary', enrolled: 24, responseRate: 78, avgRating: 3.56, courseAvg: 4.32 },
  { facultyId: 'f21', courseCode: 'NURS-501', courseName: 'Human Anatomy & Physiology', term: 'Spring 2025', cohort: 'Class of 2027', role: 'primary', enrolled: 21, responseRate: 74, avgRating: 3.45, courseAvg: 4.23 },
  { facultyId: 'f21', courseCode: 'NURS-620', courseName: 'Geriatric Nursing', term: 'Fall 2024', cohort: 'Class of 2027', role: 'primary', enrolled: 54, responseRate: 60, avgRating: 4.55, courseAvg: 3.87 },
  { facultyId: 'f21', courseCode: 'NURS-540', courseName: 'Clinical Reasoning & Diagnostics', term: 'Spring 2024', cohort: 'Class of 2026', role: 'primary', enrolled: 42, responseRate: 47, avgRating: 4.16, courseAvg: 3.52 },
  { facultyId: 'f22', courseCode: 'NURS-801', courseName: 'Evidence-Based Practice', term: 'Spring 2025', cohort: 'Class of 2027', role: 'primary', enrolled: 18, responseRate: 70, avgRating: 3.35, courseAvg: 4.13 },
  { facultyId: 'f22', courseCode: 'NURS-611', courseName: 'Pediatric Nursing', term: 'Fall 2024', cohort: 'Class of 2027', role: 'primary', enrolled: 51, responseRate: 57, avgRating: 4.45, courseAvg: 3.78 },
  { facultyId: 'f23', courseCode: 'NURS-711', courseName: 'Advanced Pediatric Nursing', term: 'Spring 2025', cohort: 'Class of 2027', role: 'primary', enrolled: 59, responseRate: 67, avgRating: 4.74, courseAvg: 4.04 },
  { facultyId: 'f24', courseCode: 'NURS-710', courseName: 'Advanced Neurological Nursing', term: 'Fall 2024', cohort: 'Class of 2027', role: 'primary', enrolled: 56, responseRate: 63, avgRating: 4.63, courseAvg: 3.94 },
  { facultyId: 'f24', courseCode: 'NURS-601', courseName: 'Clinical Practicum I', term: 'Spring 2024', cohort: 'Class of 2026', role: 'primary', enrolled: 44, responseRate: 49, avgRating: 4.24, courseAvg: 3.59 },
  { facultyId: 'f25', courseCode: 'NURS-620', courseName: 'Geriatric Nursing', term: 'Fall 2024', cohort: 'Class of 2027', role: 'primary', enrolled: 53, responseRate: 59, avgRating: 4.53, courseAvg: 3.85 },
  { facultyId: 'f26', courseCode: 'NURS-611', courseName: 'Pediatric Nursing', term: 'Fall 2024', cohort: 'Class of 2027', role: 'primary', enrolled: 50, responseRate: 56, avgRating: 4.42, courseAvg: 3.76 },
  { facultyId: 'f26', courseCode: 'NURS-530', courseName: 'Maternal-Newborn Nursing', term: 'Spring 2026', cohort: 'Class of 2028', role: 'primary', enrolled: 38, responseRate: 94, avgRating: 4.03, courseAvg: 4.75 },
  { facultyId: 'f26', courseCode: 'NURS-505', courseName: 'Fundamentals of Nursing I', term: 'Fall 2025', cohort: 'Class of 2028', role: 'primary', enrolled: 26, responseRate: 80, avgRating: 3.63, courseAvg: 4.39 },
  { facultyId: 'f27', courseCode: 'NURS-602', courseName: 'Clinical Practicum II', term: 'Spring 2024', cohort: 'Class of 2026', role: 'primary', enrolled: 47, responseRate: 52, avgRating: 4.32, courseAvg: 3.66 },
  { facultyId: 'f27', courseCode: 'NURS-515', courseName: 'Pharmacology for Nurses', term: 'Spring 2026', cohort: 'Class of 2028', role: 'primary', enrolled: 35, responseRate: 90, avgRating: 3.92, courseAvg: 4.65 },
  { facultyId: 'f28', courseCode: 'NURS-601', courseName: 'Clinical Practicum I', term: 'Spring 2024', cohort: 'Class of 2026', role: 'primary', enrolled: 44, responseRate: 48, avgRating: 4.21, courseAvg: 3.57 },
  { facultyId: 'f29', courseCode: 'NURS-540', courseName: 'Clinical Reasoning & Diagnostics', term: 'Spring 2026', cohort: 'Class of 2028', role: 'primary', enrolled: 40, responseRate: 45, avgRating: 4.11, courseAvg: 3.47 },
  { facultyId: 'f29', courseCode: 'NURS-506', courseName: 'Fundamentals of Nursing II', term: 'Fall 2025', cohort: 'Class of 2028', role: 'primary', enrolled: 29, responseRate: 83, avgRating: 3.71, courseAvg: 4.46 },
  { facultyId: 'f30', courseCode: 'NURS-530', courseName: 'Maternal-Newborn Nursing', term: 'Spring 2026', cohort: 'Class of 2028', role: 'primary', enrolled: 37, responseRate: 93, avgRating: 4.00, courseAvg: 4.73 },
  { facultyId: 'f31', courseCode: 'NURS-515', courseName: 'Pharmacology for Nurses', term: 'Spring 2026', cohort: 'Class of 2028', role: 'primary', enrolled: 34, responseRate: 89, avgRating: 3.90, courseAvg: 4.63 },
  { facultyId: 'f31', courseCode: 'NURS-502', courseName: 'Physiology & Pathophysiology', term: 'Spring 2025', cohort: 'Class of 2027', role: 'primary', enrolled: 22, responseRate: 76, avgRating: 3.50, courseAvg: 4.27 },
  { facultyId: 'f31', courseCode: 'NURS-710', courseName: 'Advanced Neurological Nursing', term: 'Fall 2024', cohort: 'Class of 2027', role: 'primary', enrolled: 55, responseRate: 62, avgRating: 4.60, courseAvg: 3.92 },
  { facultyId: 'f32', courseCode: 'NURS-510', courseName: 'Medical-Surgical Nursing I', term: 'Fall 2025', cohort: 'Class of 2028', role: 'primary', enrolled: 31, responseRate: 86, avgRating: 3.79, courseAvg: 4.54 },
  { facultyId: 'f32', courseCode: 'NURS-501', courseName: 'Human Anatomy & Physiology', term: 'Spring 2025', cohort: 'Class of 2027', role: 'primary', enrolled: 19, responseRate: 72, avgRating: 3.40, courseAvg: 4.18 },
  { facultyId: 'f33', courseCode: 'NURS-506', courseName: 'Fundamentals of Nursing II', term: 'Fall 2025', cohort: 'Class of 2028', role: 'primary', enrolled: 28, responseRate: 82, avgRating: 3.69, courseAvg: 4.44 },
  { facultyId: 'f34', courseCode: 'NURS-502', courseName: 'Physiology & Pathophysiology', term: 'Fall 2025', cohort: 'Class of 2028', role: 'primary', enrolled: 25, responseRate: 79, avgRating: 3.58, courseAvg: 4.35 },
  { facultyId: 'f34', courseCode: 'NURS-711', courseName: 'Advanced Pediatric Nursing', term: 'Fall 2024', cohort: 'Class of 2027', role: 'primary', enrolled: 58, responseRate: 65, avgRating: 4.68, courseAvg: 3.99 },

  /* ── Fall 2026 (the live/current term) — EARLY-STAGE read, not a closed term (Romit,
     2026-09-15: "By default, select Summer 2026. With an option to also select Spring 2026
     and Fall 2026" on the Analytics Terms picker). This term had ZERO rows here before —
     `allTerms()`/`termSeries()` derive their term list from this table (via
     `offeringPoints()`/`courseTermPoints()`), so a still-collecting term needs SOME rows to be
     selectable in Analytics at all, the same way the Dashboard's `MOCK_SURVEYS` "Live term"
     card already carries Fall 2026 rows in various in-flight states.
     Deliberately LOW `responseRate` (12–25%, vs Summer 2026's 60–88%) — this is a partial,
     in-flight snapshot a few weeks into the term, not a settled average; `avgRating`/
     `courseAvg` are still real numbers (the type has no "not enough data yet" state — see the
     field's own doc comment), so they read as an early, lower-confidence trend point rather
     than a blank one. Same six-faculty/course pairing as Summer 2026 immediately above, for a
     continuous story across the two most recent terms rather than an unrelated one-off. */
  { facultyId: 'f1', courseCode: 'NURS-501', courseName: 'Human Anatomy & Physiology', term: 'Fall 2026', cohort: 'Class of 2028', role: 'primary', enrolled: 50, responseRate: 22, avgRating: 4.45, courseAvg: 4.25 },
  { facultyId: 'f1', courseCode: 'NURS-510', courseName: 'Medical-Surgical Nursing I', term: 'Fall 2026', cohort: 'Class of 2028', role: 'primary', enrolled: 42, responseRate: 19, avgRating: 4.40, courseAvg: 4.20 },
  { facultyId: 'f2', courseCode: 'NURS-515', courseName: 'Pharmacology for Nurses', term: 'Fall 2026', cohort: 'Class of 2028', role: 'primary', enrolled: 46, responseRate: 15, avgRating: 3.70, courseAvg: 3.65 },
  { facultyId: 'f2', courseCode: 'NURS-540', courseName: 'Clinical Reasoning & Diagnostics', term: 'Fall 2026', cohort: 'Class of 2028', role: 'primary', enrolled: 38, responseRate: 13, avgRating: 3.80, courseAvg: 3.85 },
  { facultyId: 'f3', courseCode: 'NURS-502', courseName: 'Physiology & Pathophysiology', term: 'Fall 2026', cohort: 'Class of 2028', role: 'primary', enrolled: 54, responseRate: 25, avgRating: 4.35, courseAvg: 4.15 },
  { facultyId: 'f3', courseCode: 'NURS-611', courseName: 'Pediatric Nursing', term: 'Fall 2026', cohort: 'Class of 2027', role: 'primary', enrolled: 30, responseRate: 20, avgRating: 4.30, courseAvg: 4.10 },
  { facultyId: 'f4', courseCode: 'NURS-530', courseName: 'Maternal-Newborn Nursing', term: 'Fall 2026', cohort: 'Class of 2027', role: 'primary', enrolled: 44, responseRate: 16, avgRating: 3.55, courseAvg: 3.75 },
  { facultyId: 'f5', courseCode: 'NURS-620', courseName: 'Geriatric Nursing', term: 'Fall 2026', cohort: 'Class of 2027', role: 'primary', enrolled: 34, responseRate: 18, avgRating: 3.65, courseAvg: 4.30 },
  { facultyId: 'f6', courseCode: 'NURS-801', courseName: 'Evidence-Based Practice', term: 'Fall 2026', cohort: 'Class of 2026', role: 'primary', enrolled: 32, responseRate: 12, avgRating: 4.50, courseAvg: 3.70 },
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
    { section: 'course_content',      text: 'The pacing felt rushed in the final weeks, hard to absorb the last two units.', sentiment: 'concern'  },
    { section: 'course_content',      text: 'Course materials and readings were well organized and easy to follow.',          sentiment: 'positive' },
    { section: 'course_content',      text: 'More worked examples before each assessment would help.',                        sentiment: 'concern'  },
    { section: 'course_content',      text: 'Lab resources were solid; the structure of each module made sense.',             sentiment: 'positive' },
    { section: 'faculty_performance', text: 'Very engaging lectures and responsive to questions.',                            sentiment: 'positive' },
    { section: 'faculty_performance', text: 'Office hours were hard to get into during exam weeks.',                          sentiment: 'concern'  },
    { section: 'faculty_performance', text: 'Approachable and organized. Feedback on assignments was quick.',                sentiment: 'positive' },
    { section: 'faculty_performance', text: 'Clear communicator; would appreciate more clinical examples.',                   sentiment: 'neutral'  },
  ]
  const OT_POOL: { text: string; sentiment: 'positive' | 'neutral' | 'concern' }[] = [
    { text: 'Keep the case-based sessions, easily the most useful part.',               sentiment: 'positive' },
    { text: 'The readings were well chosen and matched the lectures.',                   sentiment: 'positive' },
    { text: 'Consider recording sessions so we can review before assessments.',          sentiment: 'neutral'  },
    { text: 'Office hours earlier in the week would help before quizzes.',               sentiment: 'concern'  },
    { text: 'Group discussions helped connect the material to real cases.',              sentiment: 'positive' },
    { text: 'A short recap at the start of each session would help continuity.',         sentiment: 'neutral'  },
    { text: 'More time for questions at the end of lecture would help.',                 sentiment: 'concern'  },
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
      // Texts already used by ANOTHER free-text question on THIS survey — a
      // hash-based pick alone can collide across different questions (same
      // quote appearing under two different prompts, Romit live review).
      // Walk forward from the hashed index until an unused pool entry is
      // found; only reuse once every pool entry is already spoken for.
      const usedTextsThisSurvey = new Set<string>()
      for (const sec of sections) {
        if (!sec.roleSetId) sectionScores[sec.subjectKey] = mkScores(sec.questions, 0)
        // Open-text quotes per free-text question — the per-question "View
        // responses" sheet must be able to back every count it shows.
        for (const q of sec.questions) {
          if (q.answerType !== 'free_text') continue
          const n = Math.min(2 + (djb2(s.id + q.id) % 3), s.responseCount)
          for (let i = 0; i < n; i++) {
            const startIdx = (djb2(s.id + q.id) + i * 5) % OT_POOL.length
            let pick = OT_POOL[startIdx]
            for (let k = 1; k <= OT_POOL.length && usedTextsThisSurvey.has(pick.text); k++) {
              pick = OT_POOL[(startIdx + k) % OT_POOL.length]
            }
            usedTextsThisSurvey.add(pick.text)
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

/* djb2 — stable tiny hash for the single-survey benchmark offset. */
function benchmarkHash(str: string): number {
  let h = 5381
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0
  return h
}

/** Program-wide average for a question — response-weighted across every survey that asked it.
 *  Returns null when no survey has scored the question.
 *
 *  Mock-only benchmark synthesis: when exactly ONE survey carries the question
 *  (template-unique ids like tmplrich's c/i/l/o), the pooled "program" average
 *  would collapse to that survey's own value — a benchmark that always equals
 *  you is no benchmark (Romit 2026-07-18 critique: "why are these numbers
 *  same?"). We apply a deterministic per-question offset so the demo reads
 *  like real cross-offering data. When real program data exists, only this
 *  function changes (same convention as pce-collection.ts). */
export function programAvgForQuestion(questionId: string): number | null {
  let weightedSum = 0
  let responseTotal = 0
  const contributors = new Set<string>()
  for (const data of MOCK_SURVEY_QUESTION_DATA) {
    const scores = [
      ...Object.values(data.sectionScores).flat(),
      ...(data.instructorBlocks ?? []).flatMap(b => b.scores),
    ]
    for (const s of scores) {
      if (s.questionId === questionId) {
        weightedSum += s.avg * s.count
        responseTotal += s.count
        contributors.add(data.surveyId)
      }
    }
  }
  if (responseTotal === 0) return null
  let avg = weightedSum / responseTotal
  if (contributors.size === 1) {
    /* Offset in {−0.4 … +0.3} \ {0}, step 0.1, stable per question id. */
    const step = (benchmarkHash(questionId) % 7) - 4 // −4 … +2
    avg += (step >= 0 ? step + 1 : step) / 10 // skip 0 → −0.4…−0.1 or +0.1…+0.3
    avg = Math.min(5, Math.max(1, avg))
  }
  return Math.round(avg * 10) / 10
}

/** Term-scoped average for a question (2026-09-15 Question Breakdown
 *  requirement: "term average" alongside avg/range/median, distinct from
 *  `programAvgForQuestion`'s all-time pool) — same response-weighted math,
 *  filtered to surveys sharing the given term via `MOCK_SURVEYS`. No
 *  single-contributor synthetic offset here (unlike `programAvgForQuestion`)
 *  — a term-scoped stat legitimately can equal the sole contributor's own
 *  value; faking variance would misrepresent it as cross-offering. Returns
 *  null when no survey in that term asked the question. */
export function termAvgForQuestion(questionId: string, term: string): number | null {
  const surveyIdsInTerm = new Set(MOCK_SURVEYS.filter((s) => s.term === term).map((s) => s.id))
  let weightedSum = 0
  let responseTotal = 0
  for (const data of MOCK_SURVEY_QUESTION_DATA) {
    if (!surveyIdsInTerm.has(data.surveyId)) continue
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
  if (responseTotal === 0) return null
  return Math.round((weightedSum / responseTotal) * 10) / 10
}

/** Question text keyed by id, scanned once from every template's own bank.
 *  Question ids (q1, c1, l1, …) are stable across templates — the same id
 *  always carries the same wording (verified: `q1` is "The course objectives
 *  were clearly stated." everywhere it appears) — so first-occurrence wins. */
let questionTextCache: Map<string, string> | null = null

export function questionTextFor(questionId: string): string | undefined {
  if (!questionTextCache) {
    questionTextCache = new Map()
    for (const tmpl of MOCK_TEMPLATES) {
      for (const list of Object.values(tmpl.questions)) {
        for (const q of list) {
          if (!questionTextCache.has(q.id)) questionTextCache.set(q.id, q.text)
        }
      }
    }
  }
  return questionTextCache.get(questionId)
}
