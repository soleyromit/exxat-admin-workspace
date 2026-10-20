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
}

export interface Program {
  id: string
  school: string
  name: string
  cohorts: string[]
}

export interface Course {
  id: string
  code: string
  name: string
  term: string
  cohort: string
}

export interface AchievementRule {
  /** "count": N qualifying evaluations. "last-n": need X of the last N. */
  kind: "count" | "last-n"
  need: number
  window?: number
}

export interface SkillConfig {
  /** Program-named levels, ordered lowest to highest. Never hard-coded Observed, Assisted, Independent. */
  levels: string[]
  achievement: AchievementRule
  simulation: { allowed: boolean; maxSharePercent: number }
  prerequisiteSkillIds: string[]
  evaluatorRoles: Array<"preceptor" | "faculty" | "lab-instructor">
  failurePath: "further-attempt" | "remediation-plan"
  revalidation: { onEvents: string[] }
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
  /** Scenario step id -> ISO time the presenter marked it reviewed. */
  stepsReviewed: Record<string, string>
}
