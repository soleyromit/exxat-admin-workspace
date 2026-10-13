// Achievement engine types. Pure data, no React, no I/O.
// Spec: docs/strategy/02-domain-model-and-achievement-engine.md, docs/build/contracts/S-09-skill-configure.md §15b.
// Entity shapes are proposals [INFER]; requirement IDs are cited where a rule comes from REQ.

export type ModelKind = "binary" | "question" | "scored" | "demonstration"

export interface Question {
  id: string
  /** Presentation only (AE-06). Renaming never changes an outcome. */
  text: string
}
export interface Level {
  id: string
  /** Presentation only (AE-06). Order in the array is the order of supervision (SC-08). */
  label: string
}
export interface BinaryLabel {
  id: "a" | "b"
  label: string
}

/** SC-05: all Yes, at least N of M, or a named subset. */
export type QuestionRule =
  | { kind: "all" }
  | { kind: "atLeast"; n: number }
  | { kind: "subset"; questionIds: string[] }

/** SC-07: average, minimum on every question, or total. */
export type ScoredRule =
  | { kind: "average"; min: number }
  | { kind: "minPerQuestion"; min: number }
  | { kind: "total"; min: number }

export interface Scale {
  min: number
  max: number
  step: number
}

export type ModelConfig =
  | { kind: "binary"; labels: { a: BinaryLabel; b: BinaryLabel }; qualifyingLabelId: "a" | "b" | null }
  | { kind: "question"; questions: Question[]; rule: QuestionRule }
  | { kind: "scored"; questions: Question[]; scale: Scale | null; rule: ScoredRule }
  | { kind: "demonstration"; levels: Level[] }

/**
 * Achievement criteria (SC-10, SC-11). `requiredCount` is "N qualifying evaluations" for the
 * non-demonstration models and "total demonstrations" for the demonstration model.
 */
export interface Criteria {
  requiredCount: number | null
  /** Demonstration model only. Keyed by level id. */
  levelMinimums: Record<string, number>
  /** Per named clinical setting, counted per setting (SC-11). Keyed by setting id. */
  settingMinimums: Record<string, number>
}

export interface SkillConfig {
  id: string
  active: boolean
  /** null = created but not configured (SC-01, IM-09). No default model (SC-02). */
  model: ModelConfig | null
  criteria: Criteria
  /** SC-15: administrator approval before evidence counts. */
  requiresApproval: boolean
  /** SC-16: roles allowed to sign off this skill. */
  allowedRoles: string[]
}
export type ConfiguredSkill = SkillConfig & { model: ModelConfig }

export type Responses =
  | { kind: "binary"; labelId: "a" | "b" }
  | { kind: "question"; answers: Record<string, boolean> }
  | { kind: "scored"; scores: Record<string, number> }
  | { kind: "demonstration"; levelId: string }

export type ApprovalStatus = "notRequired" | "pending" | "approved" | "returned"

export interface Evidence {
  id: string
  skillId: string
  studentId: string
  courseId?: string
  /** Completed by the evaluator (AE-01). */
  complete: boolean
  approval: ApprovalStatus
  performedIn: "clinical" | "lab"
  clinicalSettingId?: string
  locationId?: string
  evaluatorRole: string
  responses: Responses
}

export interface EvidenceFilter {
  courseId?: string
  locationId?: string
  clinicalSettingId?: string
  performedIn?: "clinical" | "lab"
}

/** AE-04. The display flag skillStatusDisplay (OD-03) is NOT an engine concern. */
export type SkillState = "noEvidence" | "evidenceDoesNotQualify" | "partial" | "achieved"

export type UnmetCriterion =
  | { rule: "requiredCount"; needed: number; have: number }
  | { rule: "levelMinimum"; levelId: string; needed: number; have: number }
  | { rule: "settingMinimum"; settingId: string; needed: number; have: number; labEvidence: number }

export interface SkillEvaluation {
  state: SkillState
  /** Evidence that is complete, approved when required, and qualifies under the CURRENT rule. */
  qualifyingCount: number
  /** Evidence that is complete and approved when required (before the qualification check). */
  eligibleCount: number
  perLevel: Record<string, number>
  perSetting: Record<string, number>
  unmet: UnmetCriterion[]
}

export interface StudentSkillRecord {
  studentId: string
  skillId: string
  evaluation: SkillEvaluation
}

/** OD-25 is OPEN: which roles may sign off clinical vs lab evidence is DATA, never hardcoded. */
export type RoleEvidenceMap = Record<string, { clinical: boolean; lab: boolean }>

export type StateCounts = Record<SkillState, number>
