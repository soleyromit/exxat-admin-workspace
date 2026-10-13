// Domain entities for every confirmed contract (S-01..S-18). Entity shapes are proposals [INFER]:
// REQ gives capability, not a schema (docs/ux/03 §1). Engine types are reused, never duplicated.
// Everything is plain JSON (ISO date strings, string ids) so the store can persist it.
import type { Criteria, ModelConfig, Responses, RoleEvidenceMap, SkillConfig } from "@/lib/engine"

export type Id = string
/** ISO 8601 string. Dates are strings so state serialises; nothing here calls the clock. */
export type Iso = string

// ---------------------------------------------------------------- library (SL, SC)

export type FieldType = "date" | "shortText" | "longText" | "number" | "choice"

/** SC-13: what the student supplies when sending. Independent of the model and of the evaluator's answers. */
export interface SubmissionField {
  id: Id
  label: string
  type: FieldType
  required: boolean
  /** Choice list only. */
  options?: string[]
}

export type CommentRule = "optional" | "mandatory"

/**
 * A skill = the engine's SkillConfig (model, criteria, approval, allowed roles, active) plus product fields.
 * `model === null` means created but not configured (SC-01, IM-09).
 */
export interface Skill extends SkillConfig {
  name: string
  description: string
  /** SL-03: at most one, optional. */
  categoryId: Id | null
  /** SL-04: any number. */
  tagIds: Id[]
  /** SC-13 (OD-04 open: per skill today; a program-level default set is a later layer, same shape). */
  submissionFields: SubmissionField[]
  /** SC-14. */
  evaluatorComment: CommentRule
  /** SC-15: student self-evaluates before the evaluator sees it. */
  selfEvaluation: boolean
  /** IM-11: which import brought this skill, if any. */
  importBatchId: Id | null
  createdAt: Iso
}

/** A product Skill that has a model (configured). The engine's ConfiguredSkill is the narrower config-only shape. */
export type ConfiguredProductSkill = Skill & { model: ModelConfig }

export interface Category {
  id: Id
  name: string
  description: string
  /** SL-06: inactive ones stay on skills that already have them, flagged inactive. */
  active: boolean
}
export type Tag = Category

export interface ClinicalSetting {
  id: Id
  name: string
  active: boolean
}

/** SL-08: name + email only. Not a Prism user. */
export interface LabInstructor {
  id: Id
  name: string
  email: string
  active: boolean
}

/** SL-09: a lab instructor a student typed in who is not on the roster. Admin can adopt it. */
export interface NamedLabInstructor {
  id: Id
  name: string
  email: string
  namedByStudentId: Id
  /** Set when an admin adopts the name; the roster entry it became. */
  adoptedAs: Id | null
}

/** OD-06 open: roles are data (three seeded rows), not an enum. */
export interface Role {
  id: string
  label: string
}

/** A recorded preceptor or clinical faculty member (name + email are what a request is sent to). */
export interface Evaluator {
  id: Id
  name: string
  email: string
  roleId: string
  active: boolean
}

// ---------------------------------------------------------------- people, courses

export interface Cohort {
  id: Id
  name: string
}
export interface Group {
  id: Id
  cohortId: Id
  name: string
}
export interface Student {
  id: Id
  name: string
  email: string
  cohortId: Id
  groupId: Id
}

/** A site. `settingIds` = clinical settings this location offers (RP-09 impossible-combination check). */
export interface Location {
  id: Id
  name: string
  settingIds: Id[]
}

/** ST-06: the student's placement for a course (one or several locations). */
export interface Placement {
  id: Id
  studentId: Id
  offeringId: Id
  locationId: Id
}

export type Term = "Fall" | "Spring" | "Summer"

/** CM-01. */
export interface CourseOffering {
  id: Id
  code: string
  name: string
  term: Term
  academicYear: string
  professionalYear: 1 | 2 | 3
  cohortIds: Id[]
}

export type Requirement = "mandatory" | "nonMandatory"

/** CM-03, CM-06: requirement level is per offering. Mapping is expectation, never eligibility (CM-05). */
export interface OfferingSkillMap {
  offeringId: Id
  skillId: Id
  requirement: Requirement
}

// ---------------------------------------------------------------- submissions

/** Snapshot of who was asked. Names are snapshots so later edits or adoption never rewrite history. */
export interface EvaluatorRef {
  /** Evaluator id, lab instructor id, or named-lab-instructor id. */
  personId: Id
  source: "recorded" | "roster" | "studentNamed"
  name: string
  email: string
  roleId: string
}

/** Values keyed by SubmissionField id. */
export type StudentValues = Record<Id, string | number>

/**
 * SM-02 stored lifecycle. The DISPLAY state (counted, did not meet, awaiting approval, ...) is derived
 * from this plus the current rule, never stored (AE-02): see selectors.submissionState.
 *  - draft: only when OD-14 (partial save) is accepted; never produced today.
 *  - awaitingEvaluator: sent, no completed evaluation for the current revision.
 *  - completed: the evaluator submitted (an Evaluation exists for the current revision).
 *  - returned: an administrator returned it for correction (a Review exists on the latest Evaluation).
 */
export type SubmissionLifecycle = "draft" | "awaitingEvaluator" | "completed" | "returned"

/** One skill sent for review = one attempt on one student skill record (SH-01). */
export interface Submission {
  id: Id
  /** Groups skills sent together (ST-04). */
  requestId: Id
  studentId: Id
  skillId: Id
  offeringId: Id
  /** SH-01: attempt number per student per skill, in order. */
  attempt: number
  /** RV-02: auditable count of revisions of THIS attempt. */
  revision: number
  performedIn: "clinical" | "lab"
  clinicalSettingId: Id | null
  locationId: Id | null
  evaluator: EvaluatorRef
  /** ST-10. */
  values: StudentValues
  /** ST-12: at most one note, distinct from the evaluator's comment. */
  studentNote: string
  /** ST-11: completed BEFORE send (DEC-001), same form schema as the evaluator's. */
  selfEvaluation: Responses | null
  lifecycle: SubmissionLifecycle
  sentAt: Iso
}

/**
 * RV-03: immutable once created. Nothing in the store updates an Evaluation. A revision after a return
 * appends a NEW Evaluation; the old one stays (RV-02 audit).
 */
export interface Evaluation {
  readonly id: Id
  readonly submissionId: Id
  /** Which revision of the submission this evaluation answers. */
  readonly revision: number
  readonly evaluator: EvaluatorRef
  readonly responses: Responses
  readonly comment: string
  readonly completedAt: Iso
  /** EV-07: what the evaluator was told. A fact about the moment of submission. */
  readonly approvalRequiredAtSubmit: boolean
}

/** AR-04, AR-05, RV-02. Separate from the Evaluation so the Evaluation stays immutable. */
export interface Review {
  id: Id
  evaluationId: Id
  decision: "approved" | "returned"
  note: string
  at: Iso
  /**
   * OD-16 seam (OPEN): who corrects a returned evaluation. Unset by default and never set by the UI, so no surface
   * commits to a branch. The submission lifecycle becomes `returned` either way; only this field would record the answer.
   */
  returnTarget?: ReturnTarget | null
}

/** OD-16 (OPEN): "student" = the student corrects and resends (RV-01), "evaluator" = the evaluator redoes it. */
export type ReturnTarget = "student" | "evaluator"

/** Opaque link behind S-16 (EV-01). Never log or export `token` (cross-cutting §11). */
export interface EvaluatorLink {
  token: string
  /** One link covers the submissions sent together to this evaluator (EV-05). */
  submissionIds: Id[]
  evaluator: EvaluatorRef
  createdAt: Iso
  /** L-3: resend creates a new link and the old one stops accepting submissions. */
  supersededAt: Iso | null
  /** L-2: reusable until submitted, then read-only. */
  submittedAt: Iso | null
}

// ---------------------------------------------------------------- import (IM)

export interface ImportRow {
  id: Id
  include: boolean
  name: string
  description: string
  /** Proposed category name from a heading in the source (IM-07); null = none. */
  categoryName: string | null
  /** Original line, row or page text (IM-08 traceability). */
  sourceRef: string
  match: { status: "new" } | { status: "duplicate"; existingSkillId: Id }
  /** IM-06, only meaningful when match is duplicate. */
  duplicateChoice: "skip" | "replace" | "keepBoth"
  /** AI assist: why the admin should look at this row first. Advice only: a cue never changes include or a counter. No probabilities here. */
  cue?: ImportRowCue
  /** Where the row came from. Absent means the standard reader. */
  origin?: "rules" | "model"
}

/** Why a row carries the "Check this row" cue. Probabilities stay on the server (IM-13: nothing that reads as an accuracy figure). */
export type ImportCueReason = "lowSkillConfidence" | "maybeDetail" | "categoryUncertain" | "rulesAndModelDisagree"
export interface ImportRowCue {
  reasons: ImportCueReason[]
}

/** How a batch was read. `ai-fallback`: the AI reading was asked for and was not available, so the standard reader ran. */
export interface ImportInterpretationMeta {
  mode: "rules" | "ai" | "ai-fallback"
  model?: string
  candidatesAsked?: number
  requests?: number
  inputTokens?: number
  fallbackReason?: "unavailable" | "timeout" | "rate_limited" | "error"
}

/** IM-08: anything not interpreted, with its original text. Never dropped silently. */
export interface UnreadLine {
  id: Id
  text: string
  reason: "heading" | "empty" | "unrecognised" | "uncertain"
  /** Where it was found (line number or row). */
  location: string
}

export interface ImportBatch {
  id: Id
  sourceKind: "paste" | "file"
  sourceName: string
  createdAt: Iso
  status: "review" | "confirmed" | "cancelled"
  /** IM-07: group-derived categories the admin opted to create. */
  createCategories: boolean
  rows: ImportRow[]
  unread: UnreadLine[]
  /** AI assist metadata (absent = standard reader). */
  interpretation?: ImportInterpretationMeta
  /** Set on confirm (IM-11). */
  createdSkillIds: Id[]
  createdCategoryIds: Id[]
}

// ---------------------------------------------------------------- the whole program

/** The whole in-memory database. Plain JSON. `seq` makes id generation deterministic and pure. */
export interface Db {
  version: number
  seq: number
  skills: Skill[]
  categories: Category[]
  tags: Tag[]
  clinicalSettings: ClinicalSetting[]
  labInstructors: LabInstructor[]
  namedLabInstructors: NamedLabInstructor[]
  roles: Role[]
  /** OD-25 is OPEN: data, never hardcoded. Also read by S-09's BL-1 check. */
  roleEvidenceMap: RoleEvidenceMap
  evaluators: Evaluator[]
  cohorts: Cohort[]
  groups: Group[]
  students: Student[]
  locations: Location[]
  placements: Placement[]
  offerings: CourseOffering[]
  offeringSkillMaps: OfferingSkillMap[]
  submissions: Submission[]
  evaluations: Evaluation[]
  reviews: Review[]
  links: EvaluatorLink[]
  importBatches: ImportBatch[]
}

export type SkillStatusDisplay = "four" | "merged"

/** Per-browser preferences (not program data). */
export interface Prefs {
  /** OD-03 is OPEN: one flag, read by SkillStatusBadge and every status table. */
  skillStatusDisplay: SkillStatusDisplay
  /** Which student the student shell acts as (dev/demo; real auth is out of scope). */
  currentStudentId: Id | null
  /**
   * OD-17 is OPEN (what an evaluator may see). C-6 [PROTO]: the in-shell Preceptor Evaluation demo page shows the
   * criteria line and the post-submit Progress/Status table like the prototype (default ON). The real shell-free
   * /e/[token] link never reads this flag: it stays OFF until OD-17 is decided.
   */
  evaluatorSeesProgress: boolean
}

export type { Criteria, ModelConfig, Responses, RoleEvidenceMap }
