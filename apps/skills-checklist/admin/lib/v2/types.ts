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
  /** Named clinical setting (SC-11) for clinical evaluations. Lab and simulation never carry one, so they can never satisfy it. */
  clinicalSetting?: string
  /** Index into the skill's levels when the evaluation recorded a level. Absent means the level is not recorded. */
  levelIndex?: number
}

export type SignoffMethod = "qr" | "handover" | "link" | "photo"

/** "on-device": saved on the student's phone and not yet sent (Stage 2). It moves to with-evaluator or awaiting-review when it syncs. */
export type SubmissionStatus = "on-device" | "with-evaluator" | "awaiting-review" | "returned" | "stalled" | "done"

export interface Submission {
  id: string
  studentId: string
  skillIds: string[]
  method: SignoffMethod
  status: SubmissionStatus
  assignedToId: string
  createdAt: string
  daysWaiting: number
  /** Stage 2: the log entries this request carries. Absent on seed requests made before the log existed. */
  entryIds?: string[]
  /** Stage 2: every evaluator who may open a link request. assignedToId is the first. The first to finish completes it. [PROPOSED] */
  candidateIds?: string[]
  /** Stage 2: a photo of a signed paper form. Only the file facts are stored, never the image. */
  photo?: { name: string; sizeKb: number }
}

export type SyncState = "queued" | "synced" | "conflict" | "failed"

/** One value that two versions disagree about. A note keeps one narrative (ST-12); a rating keeps one level. */
export interface SyncConflict {
  field: "note" | "rating"
  mine: string
  theirs: string
  theirsAt: string
  theirsBy: string
}

export interface SyncItem {
  id: string
  studentId: string
  label: string
  state: SyncState
  at: string
  /** Stage 2: what the change belongs to. */
  entryId?: string
  requestId?: string
  /** Why the last attempt failed, in plain words. */
  error?: string
  attempts?: number
  /** A newer change that exists on the server. It becomes a conflict the next time this item syncs. */
  serverEdit?: { field: SyncConflict["field"]; value: string; at: string; by: string }
  conflict?: SyncConflict
}

/** A placement for the course: where the student works and in which named clinical setting (ST-06). */
export interface Placement {
  id: string
  studentId: string
  courseId: string
  location: string
  setting: string
}

/**
 * One skill logged by a student (ST-04, ST-05). Clinical entries can be sent for sign-off. A lab or simulation entry is a
 * practice trial: it counts toward prerequisites and is never sent for sign-off. [PROPOSED]
 */
export interface LogEntry {
  id: string
  studentId: string
  skillId: string
  /** Entries saved together share a batch (ST-04). */
  batchId: string
  setting: Setting
  /** Named clinical setting for clinical entries, else null. */
  clinicalSetting: string | null
  location: string | null
  /** Self-rating: one of the skill's own level names or outcome labels, else null. */
  rating: string | null
  /** Question model self-rating: one answer per question. */
  answers: Array<"yes" | "no"> | null
  /** At most one narrative note per entry (ST-12). */
  note: string
  at: string
  requestId: string | null
}

/** A lab check-off recorded by a lab instructor (a prerequisite, SC-15 family). */
export interface LabCheckoff {
  id: string
  studentId: string
  skillId: string
  byId: string
  at: string
}

/** Demo toggles for the student phone. They are labelled as demo controls in the UI. */
export interface DeviceState {
  offline: boolean
  signedOut: boolean
  updatePending: boolean
  /** The next sync attempt fails once, then this clears. */
  failNextSync: boolean
}

/** The log flow in progress, saved on every edit so a reload or a lost signal never loses it. Not audited. */
export interface LogDraft {
  step: 1 | 2 | 3 | 4
  skillIds: string[]
  /** "placement:<id>", "lab", "simulation", or "program:<name>" when no placement exists. */
  where: string
  location: string
  ratings: Record<string, string>
  answers: Record<string, Array<"yes" | "no" | null>>
  notes: Record<string, string>
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
  /** Stage 2: student placements, log entries, lab check-offs, the phone's state and the log flow draft. */
  placements: Placement[]
  logEntries: LogEntry[]
  labCheckoffs: LabCheckoff[]
  device: DeviceState
  logDraft: LogDraft | null
}
