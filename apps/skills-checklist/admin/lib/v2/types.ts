/**
 * Connected prototype v2: one typed mock store shared by every screen.
 * All of this is sample data for a clickable prototype. Nothing here is a requirement; anything that goes beyond
 * docs/source/requirements.extracted.txt is [PROPOSED] in docs/v2 (never in UI copy).
 */

export type RoleId = "admin" | "student" | "preceptor" | "reviewer" | "director"

export type Specialty = "bsn-med-surg" | "radiography" | "surgical-tech" | "paramedic"

/** The four evaluation models of the requirements (section 4.1). The program chooses; binary is the v2 demo default only. */
export type EvalModel = "binary" | "question" | "scored" | "demonstration"

export type Setting = "clinical" | "lab" | "simulation"

export interface Person {
  id: string
  name: string
  /** Display role label. */
  title: string
  kind: "admin" | "student" | "preceptor" | "lab-instructor" | "reviewer" | "director"
  email: string
  /** Evaluator attributes used by the "who counts as qualified" rule. Sample data. */
  credentials?: string[]
  yearsPractice?: number
  training?: string[]
}

export interface Program {
  id: string
  school: string
  name: string
  cohorts: string[]
  /** Program-defined clinical settings (SL-07). Evidence in a named setting is counted per setting (SC-11). */
  clinicalSettings: string[]
  /** Simulation settings the program can allow-list. */
  simulationSettings: string[]
}

export interface Course {
  id: string
  code: string
  name: string
  term: string
  cohort: string
  /** Clinical settings this offering actually places students in. */
  clinicalSettings: string[]
}

export interface AchievementRule {
  /** "count": N qualifying evaluations. "last-n": need X of the last N. */
  kind: "count" | "last-n"
  need: number
  window?: number
}

export type EvaluatorRole = "preceptor" | "faculty" | "lab-instructor"

export interface SkillConfig {
  /** Binary model: [qualifying label, other label] (SC-03). */
  outcomeLabels: [string, string]
  /** Question and scored models: the program-defined question set (SC-04). */
  questions: string[]
  /** Program-named levels, ordered lowest to highest. Never hard-coded Observed, Assisted, Independent (SC-08). */
  levels: string[]
  /** One overall supervision rating beside the checklist, using the same levels. [PROPOSED] */
  overallRating: boolean
  achievement: {
    /** "count": N qualifying evaluations. "last-n": need X of the last N. */
    kind: "count" | "last-n"
    need: number
    window?: number
    /** Index into levels of the lowest level that counts, or null when every level counts. */
    minLevelIndex: number | null
    distinctEvaluators: number
    /** Minimum evidence from named clinical settings, each counted per setting (SC-11). */
    settingMinimums: Array<{ setting: string; min: number }>
  }
  simulation: { allowed: boolean; mode: "cap" | "allow-list"; maxSharePercent: number; allowList: string[] }
  prerequisites: { skillIds: string[]; labCheckoff: boolean; practiceTrials: number }
  evaluatorRoles: EvaluatorRole[]
  qualification: { credentials: string[]; minYears: number; training: string[] }
  failure: { attemptLimit: number | null; minDaysBetween: number; retakeScoreCap: number | null; autoRemediation: boolean }
  revalidation: { onEvents: string[]; calendarExpiry: { enabled: boolean; months: number } }
}

/** A configuration being edited in the wizard. Saved in the store so it survives navigation and reload. */
export interface SkillDraft {
  model: EvalModel | null
  config: SkillConfig
  /** Wizard step, 1 to 8. */
  step: number
  copiedFromSkillId?: string
}

export interface ImportBatch {
  id: string
  at: string
  actorId: string
  kind: "starter-library" | "file-import"
  label: string
  skillIds: string[]
}

export interface Skill {
  id: string
  specialty: Specialty
  name: string
  category: string
  /** null until the program chooses a model (SC-02). */
  model: EvalModel | null
  configured: boolean
  published: boolean
  config: SkillConfig | null
  description?: string
  /** Which import or copy created the skill (IM-11). Absent for the original seed. */
  batchId?: string
}

export interface MappingRow {
  courseId: string
  skillId: string
  level: "mandatory" | "optional" | "not-expected"
}

export type Outcome = "met" | "not-met" | "not-yet"

export type EvaluationStatus = "counted" | "awaiting-approval" | "returned" | "reopened"

export interface EvaluationVersion {
  version: number
  outcome: Outcome
  at: string
  by: string
  reason: string | null
}

export interface Evaluation {
  id: string
  studentId: string
  skillId: string
  evaluatorId: string
  setting: Setting
  date: string
  status: EvaluationStatus
  /** Always the latest version's outcome. History lives in versions; earlier versions are never edited. */
  outcome: Outcome
  currentVersion: number
  versions: EvaluationVersion[]
}

export type SignoffMethod = "qr" | "handover" | "link" | "photo"

export type SubmissionStatus = "with-evaluator" | "awaiting-review" | "returned" | "stalled" | "done"

export interface Submission {
  id: string
  studentId: string
  skillIds: string[]
  method: SignoffMethod
  status: SubmissionStatus
  assignedToId: string
  createdAt: string
  daysWaiting: number
}

export type SyncState = "queued" | "synced" | "conflict"

export interface SyncItem {
  id: string
  studentId: string
  label: string
  state: SyncState
  at: string
}

export interface ConcernFlag {
  id: string
  evaluationId: string
  studentId: string
  raisedById: string
  /** Faculty only: never shown to the student or in student-facing exports. */
  visibleTo: "faculty-only"
  note: string
  at: string
}

export interface Remediation {
  id: string
  studentId: string
  skillId: string
  status: "open" | "in-progress" | "closed"
  steps: Array<{ label: string; done: boolean }>
}

export interface AuditEntry {
  id: string
  at: string
  actorId: string
  action: string
  target: string
}

export interface V2State {
  schema: 1
  program: Program
  course: Course
  people: Person[]
  skills: Skill[]
  mappings: MappingRow[]
  evaluations: Evaluation[]
  submissions: Submission[]
  syncQueue: SyncItem[]
  concerns: ConcernFlag[]
  remediations: Remediation[]
  audit: AuditEntry[]
  batches: ImportBatch[]
  /** Skill id -> wizard draft. */
  drafts: Record<string, SkillDraft>
  /** Scenario step id -> ISO time the presenter marked it reviewed. */
  stepsReviewed: Record<string, string>
}
