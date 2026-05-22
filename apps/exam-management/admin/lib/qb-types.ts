export type ColumnId =
  | 'select' | 'title' | 'status' | 'type' | 'difficulty'
  | 'blooms' | 'location' | 'creator' | 'lastEditedBy'
  | 'usage' | 'pbis' | 'version' | 'favorited' | 'actions'

export type QStatus = 'Saved' | 'Draft' | 'Archived'
export type QType   = 'MCQ' | 'Fill blank' | 'Hotspot' | 'Ordering' | 'Matching'
export type QDiff   = 'Easy' | 'Medium' | 'Hard'
export type QBlooms = 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create'
export type TrustLevel = 'junior' | 'mid' | 'senior'

export interface Question {
  id: string
  code: string
  version: number
  age: string
  title: string
  type: QType
  status: QStatus
  difficulty: QDiff
  blooms: QBlooms
  folder: string
  folderPath: string        // e.g. "PHAR101 QB / Antibiotics & Antimicrobials"
  extraFolders?: { folder: string; folderPath: string }[]  // additional locations
  tags: string[]
  usage: number
  pbis: number | null
  pbisDir: 'up' | 'down' | 'flat' | null
  creator?: string
  collaborator?: string
  lastEditedBy?: string
  usedInSections?: string[]
  pinned?: boolean
  favorited?: boolean
}

export type AccessRole = 'edit' | 'view'

export interface FolderNode {
  id: string
  name: string
  parentId: string | null
  count: number
  locked?: boolean
  isCourse?: boolean
  isPrivateSpace?: boolean
  ownerPersonaId?: string
  collaborators?: string[]
  collaboratorRoles?: Record<string, AccessRole>  // personaId → role
  icon?: string                                    // FA icon name e.g. 'fa-folder'
}

export interface Persona {
  id: string
  name: string
  initials: string
  role: 'exam_admin' | 'course_director' | 'instructor'
  color: string
  trustLevel?: TrustLevel
  assignedFolders?: string[]
}

export interface Course {
  id: string
  code: string          // e.g. "PHAR101"
  name: string          // e.g. "Pharmacology I"
  questionBankFolderId: string
}

export interface CourseOffering {
  id: string
  courseId: string
  semester: string      // e.g. "Fall 2025"
  studentCount: number
}

export interface Assessment {
  id: string
  courseId: string
  offeringId: string
  title: string
  questionCount: number
  diffDistribution: Record<QDiff, number>
  durationMinutes: number
}

export interface AssessmentQuestion {
  questionId: string
  order: number
}

export type AssessmentType = 'Exam' | 'Quiz' | 'Pop Quiz' | 'Assignment'

export type AssessmentStatus =
  | 'draft'
  | 'pending-review'
  | 'changes-requested'
  | 'approved'
  | 'scheduled'
  | 'live'
  | 'completed'

export interface AssessmentReviewRequest {
  reviewerIds: string[]    // FacultyListRow IDs — multiple reviewers allowed
  message: string
  dueDate: string | null  // ISO date string
  sentAt: string          // ISO timestamp
}

export interface AssessmentSettings {
  type: AssessmentType
  passwordRequired: boolean
  password: string
  randomize: boolean
  randomizeOptions: boolean      // NEW: randomize option order within each question
  showRationaleAfter: boolean
  // Scheduling
  openDate: string | null        // ISO datetime
  closeDate: string | null       // ISO datetime
  downloadWindowHours: number    // hours before openDate students can pre-download
  timezone: string               // e.g. "America/New_York"
  // Pre-exam
  instructionsText: string
  requireAcknowledgment: boolean
  // Workflow
  status: AssessmentStatus
  reviewRequest: AssessmentReviewRequest | null
}

export interface AssessmentSection {
  id: string
  title: string
  facultyId?: string
  collaboratorId?: string         // second instructor who can view/edit this section
  prereadText?: string            // NEW: case-study preread block
  questionIds: string[]
  contentAreaIds?: string[]       // content areas this section targets (folder IDs)
  randomize?: boolean             // shuffle questions within this section independently
  status?: 'drafting' | 'ready'  // instructor signals section is ready for coordinator review
}

export type QuestionHealthFlag =
  | { type: 'missing-rationale'; questionId: string }
  | { type: 'poor-pbis'; questionId: string; pbis: number }

export interface AssessmentDraft {
  id: string
  title: string
  courseId: string
  offeringId: string
  questions: AssessmentQuestion[]
  durationMinutes: number
  sections: AssessmentSection[]
  settings: AssessmentSettings
  healthFlags: QuestionHealthFlag[]   // NEW: computed flags surfaced in Step 2 + Step 3
}

/** Convenience factory for default settings */
export function defaultAssessmentSettings(type: AssessmentType = 'Exam'): AssessmentSettings {
  return {
    type,
    passwordRequired: false,
    password: '',
    randomize: false,
    randomizeOptions: false,
    showRationaleAfter: true,
    openDate: null,
    closeDate: null,
    downloadWindowHours: 24,
    timezone: 'America/New_York',
    instructionsText: '',
    requireAcknowledgment: false,
    status: 'draft',
    reviewRequest: null,
  }
}

export interface SmartView {
  id: string
  label: string
  isSystem: boolean
  filters: {
    difficulty?: QDiff[]
    type?: QType[]
    blooms?: QBlooms[]
    unusedOnly?: boolean
  }
}

export const SYSTEM_SMART_VIEWS: SmartView[] = [
  { id: 'all',     label: 'All questions',  isSystem: true, filters: {} },
  { id: 'hard',    label: 'Hard only',      isSystem: true, filters: { difficulty: ['Hard'] } },
  { id: 'mcq-med', label: 'MCQ · Medium',   isSystem: true, filters: { type: ['MCQ'], difficulty: ['Medium'] } },
  { id: 'apply',   label: 'Apply + Analyze', isSystem: true, filters: { blooms: ['Apply', 'Analyze'] } },
  { id: 'unused',  label: 'Not yet used',   isSystem: true, filters: { unusedOnly: true } },
]
