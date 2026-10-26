/**
 * Connected prototype v2: one typed mock store shared by every screen.
 * All of this is sample data for a clickable prototype. Nothing here is a requirement; anything that goes beyond
 * docs/source/requirements.extracted.txt is [PROPOSED] in docs/v2 (never in UI copy).
 */

export type RoleId = "admin" | "student" | "preceptor" | "reviewer" | "director"

export type Specialty = "bsn-med-surg" | "adn-hgtc" | "radiography" | "surgical-tech" | "paramedic"

/** The four evaluation models of the requirements (section 4.1). The program chooses; binary is the v2 demo default only. */
export type EvalModel = "binary" | "question" | "scored" | "demonstration"

export type Setting = "clinical" | "lab" | "simulation"

export interface Person {
  id: string
  name: string
  /** Display role label. */
  title: string
  kind: "admin" | "student" | "preceptor" | "lab-instructor" | "faculty" | "reviewer" | "director"
  email: string
  /** Evaluator attributes used by the "who counts as qualified" rule. Sample data. */
  credentials?: string[]
  yearsPractice?: number
  training?: string[]
  /** Students: the cohort and the group inside it (RP-01). Sample data. Absent on state saved before the filters existed. */
  cohort?: string
  group?: string
  /** Students: the cohort record (Cohort.id) and the custom tracks the student is also in. Sample data. */
  cohortId?: string
  trackIds?: string[]
  /** Evaluators: false for a name a student gave that the program has not adopted yet (RP-01, J7). Absent means verified. */
  verified?: boolean
  /** Evaluators: the site where they supervise (Site.id). Student screens match evaluators to a placement through it. */
  homeSiteId?: string
  /** Students: the institution's student number, for example S2024-0412. Sample data. */
  studentNumber?: string
  /** Students: the calendar year the student enrolled (sample data, position-based; custom group rules filter on it). */
  enrollmentYear?: number
  /** Students: the program's enrollment category, for example Day or Hybrid (sample data; custom group rules filter on it). */
  enrollmentCategory?: string
}

export interface Cohort {
  id: string
  name: string
  graduates: string
  studentCount: number
  /** Professional year (1 to 4) in the current academic year (decision D-X19: a field in the data). */
  professionalYear?: number
}

/** A custom track inside a cohort, for example an accelerated path. */
export interface Track {
  id: string
  name: string
}

export interface Term {
  id: string
  name: string
  start: string
  end: string
  current?: boolean
}

/** A course in a term for one cohort. */
export interface CourseOffering {
  id: string
  courseId: string
  termId: string
  cohortId: string
  /** "2026-27" (REQ CM-01: an offering is a course in a term, academic year and professional year). */
  academicYear?: string
  professionalYear?: number
}

export interface Site {
  id: string
  facility: string
  unit: string
  /** One of six settings. */
  setting: string
  /** The program clinical setting it counts toward, or null for the lab. */
  clinicalSetting: string | null
  /** The location name evidence from this site carries (Program.locations). */
  location: string
  active: boolean
  hasPreceptors: boolean
  /** Town, state and kind of facility (sample data, fictional: lib/v2/pools.ts). */
  city?: string
  state?: string
  facilityType?: string
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
  /** Program-defined places where evidence is gathered, with what each offers (RP-01, RP-09). Sample data. */
  locations?: ProgramLocation[]
  /** Program-defined groups inside each cohort (RP-01). Sample data. */
  groups?: Record<string, string[]>
}

export interface ProgramLocation {
  name: string
  setting: Setting
  /** The named clinical setting a clinical location offers (SC-11). Absent for lab and simulation. */
  clinicalSetting?: string
}

export interface Course {
  id: string
  code: string
  name: string
  term: string
  cohort: string
  /** Clinical settings this offering actually places students in. */
  clinicalSettings: string[]
  /** Generated courses: clinical or lab bearing, or didactic only. */
  kind?: "clinical" | "didactic"
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
  failure: { attemptLimit: number | null; minDaysBetween: number; retakeScoreCap: number | null }
  /** SC-14: the evaluator cannot submit without narrative feedback. Absent means feedback is optional. */
  feedbackRequired?: boolean
  /** SC-15: evidence is held for administrator approval before it counts. Absent means it counts at once. */
  approvalRequired?: boolean
  /**
   * Published from the lab configure screens (lib/lab/configure.ts publishLabRule) and read by the one engine (lib/v2/rules.ts
   * runRule). Absent on the seed: an evaluation then qualifies on its recorded outcome, exactly as before.
   * Question model: what makes one evaluation a valid attempt [REQ SC-05] (all Yes, at least N of M Yes, or named questions Yes).
   */
  questionRule?: QuestionRule | null
  /** Scored model: how a score qualifies [REQ SC-07]. Absent means the recorded outcome decides. */
  scoredRule?: ScoredRule | null
  /** "At least N at this level or above" [REQ SC-10]. Absent means no level minimum. */
  levelMinimums?: LevelMinimum[]
  /** Which outcome label qualifies [REQ SC-03]; presentation only, the engine reads the recorded outcome [REQ AE-06]. */
  qualifyingLabel?: 0 | 1 | null
}

/** Question model qualification [REQ SC-05]: every question Yes, at least `n` Yes, or every named question (0-based) Yes. */
export type QuestionRule = { kind: "all" } | { kind: "atLeast"; n: number } | { kind: "subset"; indices: number[] }
/** Scored model qualification [REQ SC-07]. */
export type ScoredRule = { kind: "average" | "minEach" | "total"; value: number }
/** "At least `min` evaluations at levels[levelIndex] or above" [REQ SC-10]. */
export interface LevelMinimum {
  levelIndex: number
  min: number
}

/** A configuration being edited in the wizard. Saved in the store so it survives navigation and reload. */
export interface SkillDraft {
  model: EvalModel | null
  config: SkillConfig
  /** Wizard step, 1 to 7. */
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
  /** Program-defined tags (SL-07). A skill may carry several. Sample data: no tag ships with the product. */
  tags?: string[]
  /** Which import or copy created the skill (IM-11). Absent for the original seed. */
  batchId?: string
  /** Link to the published starter list this skill came from (the HGTC ADN checklist). */
  hgtc?: { id: string; required: boolean; group?: string; groupRule?: "any" }
  /**
   * false when the program deactivated the skill (SL-02, SL-11): evidence is kept, but it leaves mapping, student selection and
   * every report figure (decision D-X14). Absent means active.
   */
  active?: boolean
}

/**
 * Per-course level [REQ CM-03; CALL 10-26]: mandatory (the only level "Required this term" and pace read, decision D-X12),
 * recommended (feeds "Likely here" and the placement-ending nudge), optional (submittable, counts on the record, never required),
 * or not expected.
 */
export type MappingLevel = "mandatory" | "recommended" | "optional" | "not-expected"

export interface MappingRow {
  courseId: string
  skillId: string
  level: MappingLevel
}

export type Outcome = "met" | "not-met" | "not-yet"

export type EvaluationStatus = "counted" | "awaiting-approval" | "returned" | "reopened"

/** What the evaluator recorded in one version (Stage 3). Absent on the seeded history, which stores only the outcome. */
export interface EvaluationDetail {
  /** Question model: one answer per question, in the order the skill listed them. */
  answers?: Array<"yes" | "no" | null>
  /** Scored model: a score per question, 1 to SCORE_MAX. */
  scores?: Array<number | null>
  /** Index into the skill's levels: the demonstrated level, or the overall supervision rating. */
  levelIndex?: number | null
  /** Narrative feedback (SC-14). */
  feedback: string
  /** Credential attestation made at submit. */
  attested?: { text: string; at: string }
}

export interface EvaluationVersion {
  version: number
  outcome: Outcome
  at: string
  by: string
  reason: string | null
  detail?: EvaluationDetail
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
  /** Where the evidence was gathered (RP-08). Absent on evidence saved before locations existed. */
  location?: string
  /** The course the evidence was gathered in (RP-01). Absent means the report's own course. */
  courseId?: string
  /** Index into the skill's levels when the evaluation recorded a level. Absent means the level is not recorded. */
  levelIndex?: number
  /** Stage 3: the request this evaluation completed. */
  submissionId?: string
  /** Stage 4: "paper-form" when a reviewer entered it from a signed paper form. Absent means the evaluator entered it. */
  source?: "evaluator" | "paper-form"
  /** Stage 4: the reviewer who typed a paper-form evaluation on the evaluator's behalf. */
  enteredById?: string
  /** The site the evidence was gathered at. Absent on the hand-written history. */
  siteId?: string
  /** Stage 4: the reviewer's latest decision and note (AR-04, AR-05). Earlier returns stay on the request. */
  review?: { decision: "approved" | "returned"; byId: string; at: string; note: string }
  /** The student's self-evaluation sent with the request (RP-10: the row-per-evaluation export carries it). */
  self?: SelfEvaluation
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
  /** Stage 3: the evaluator who completed it and when. For a link sent to several people, the first to finish. */
  completedById?: string
  completedAt?: string
  /** Stage 4: how many times the student corrected and sent it again (RV-02). */
  revisions?: number
  /** Stage 4: every return, oldest first, with the reason the student read (RV-02). */
  returns?: Array<{ at: string; byId: string; reason: string; revision: number }>
  /** Stage 4: every time a stalled request was handed to someone else (RV-04). */
  reassignments?: Array<{ at: string; byId: string; fromId: string; toId: string; reason: string }>
  /** Stage 4: the student's words when sending a returned request again. */
  studentNote?: string
  /** The site of the evaluator the request is with. Absent on the hand-written history. */
  siteId?: string
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
/**
 * A clinical rotation: one student at one site for one course offering, inside one term. Rotations run 4 to 8 weeks
 * (dataset spec section 12). `startDate` and `endDate` are ISO dates (YYYY-MM-DD), both inside the term.
 */
export interface Placement {
  id: string
  studentId: string
  courseId: string
  location: string
  setting: string
  siteId?: string
  termId?: string
  /** The course offering (course x term x cohort) the rotation belongs to, when the state carries offerings. */
  offeringId?: string
  startDate: string
  endDate: string
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
  /** Program staff only: never shown to the student or the preceptor, or in student-facing exports. */
  visibleTo: "faculty-only"
  note: string
  at: string
  /** Stage 3: the request the concern was raised on. */
  submissionId?: string
}

export interface Remediation {
  id: string
  studentId: string
  skillId: string
  status: "open" | "in-progress" | "closed"
  steps: Array<{ label: string; done: boolean; doneAt?: string; doneById?: string }>
  /** Stage 3: the failed evaluation that opened the plan, who opened it and when. */
  evaluationId?: string
  openedAt?: string
  openedById?: string
  /** Stage 3: later fails on the same skill while the plan was open, kept as notes on the one plan. */
  notes?: Array<{ at: string; text: string }>
  closed?: { at: string; byId: string; completed: boolean; note: string }
}

export interface AuditEntry {
  id: string
  at: string
  actorId: string
  action: string
  target: string
}

/** Stage 4: a program director's verification of a student's record. Append-only: a verification is never edited. */
/** One change to a skill's achievement rule (rule version history). The rule as it now reads is the skill's current config. */
export interface RuleChangeRecord {
  skillId: string
  /** ISO date of the change. */
  at: string
  byId: string
  /** Rule version after the change (the first published rule is version 1). */
  version: number
  /**
   * The rule as published from the lab configure screens (absent on records the seed or the v2 wizard wrote). A snapshot, so the
   * history keeps what was in force even after a later publish; the live rule is always the skill's own config.
   */
  published?: PublishedRuleSnapshot
}

/** What a lab Publish wrote to the shared store, kept as a rule version (lib/lab/configure.ts publishLabRule). */
export interface PublishedRuleSnapshot {
  model: EvalModel
  /** What the evaluation criteria step held: "Outcomes", "Questions" or "Levels". */
  criteriaKind: string
  outcomeLabels: [string, string]
  qualifyingLabel: 0 | 1 | null
  questions: string[]
  questionRule: QuestionRule | null
  scoredRule: ScoredRule | null
  levels: string[]
  need: number
  levelMinimums: LevelMinimum[]
  distinctEvaluators: number
  settingMinimums: Array<{ setting: string; min: number }>
  /** "reapply": re-applied to evidence already held [REQ AE-02]. */
  mode: "reapply"
}

/** What the student said about their own performance when they sent it (RP-10 export column). */
export interface SelfEvaluation {
  /** One of the skill's outcome labels or level names, or null when the student gave no rating. */
  rating: string | null
  note: string
}

export interface Verification {
  id: string
  studentId: string
  /** 1 for the first verification of this student, then 2, 3 ... */
  version: number
  byId: string
  at: string
  note: string
  /** The counted evaluations the verification rests on, with the version of each at that moment. */
  evidence: Array<{ evaluationId: string; skillId: string; version: number }>
  /** Mandatory skills of the course at that moment and whether each was achieved. */
  skills: Array<{ skillId: string; achieved: boolean }>
}

/** Stage 5: one saved lab (or simulation) session recorded from the batch grid by a lab instructor. Read-only once saved. */
export interface LabBatch {
  id: string
  name: string
  /** Session day, YYYY-MM-DD. */
  date: string
  setting: "lab" | "simulation"
  instructorId: string
  skillIds: string[]
  /** Present students got a result per recorded cell. Absent students were not assessed and have no evaluation. */
  absentIds: string[]
  evaluationIds: string[]
  /** Cells left blank, which were not saved. */
  blank: number
  savedAt: string
}

export interface V2State {
  schema: 1
  program: Program
  course: Course
  people: Person[]
  skills: Skill[]
  mappings: MappingRow[]
  /** Other clinical courses the program runs, so the course filter has more than one value. Optional so older state loads. */
  otherCourses?: Course[]
  evaluations: Evaluation[]
  submissions: Submission[]
  syncQueue: SyncItem[]
  concerns: ConcernFlag[]
  remediations: Remediation[]
  audit: AuditEntry[]
  batches: ImportBatch[]
  /** Skill id -> wizard draft. */
  drafts: Record<string, SkillDraft>
  /** Walkthrough step id -> ISO time the presenter marked it reviewed. */
  stepsReviewed: Record<string, string>
  /** Stage 2: student placements, log entries, lab check-offs, the phone's state and the log flow draft. */
  placements: Placement[]
  logEntries: LogEntry[]
  labCheckoffs: LabCheckoff[]
  device: DeviceState
  logDraft: LogDraft | null
  /** Stage 4: director verifications, oldest first. Optional so state saved before Stage 4 still loads. */
  verifications?: Verification[]
  /**
   * Rule version history: each time a skill's achievement rule was changed after evidence existed (strategy/03 H11). A record
   * verified before a change to a rule it rests on reads "Changed since verified". Oldest first.
   */
  ruleChanges?: RuleChangeRecord[]
  /** Stage 5: saved lab sessions, oldest first. Optional so state saved before Stage 5 still loads. */
  labBatches?: LabBatch[]
  /**
   * Multi-course data. `course` stays the focus course (NURS 350) that every single-course screen reads. Optional so older state loads.
   * `courses` holds every course including the focus one; `offerings` is courses x terms.
   */
  cohorts?: Cohort[]
  tracks?: Track[]
  terms?: Term[]
  courses?: Course[]
  offerings?: CourseOffering[]
  sites?: Site[]
}
