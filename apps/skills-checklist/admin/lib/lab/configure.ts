import { evalsOfStudentSkill, skillById } from "@/lib/v2/evidence-index"
import { NEED_UNSET_MESSAGE, qualifiesOn as engineQualifiesOn, runRule, type EngineRule, type RuleInvalidReason } from "@/lib/v2/rules"
import { appendAudit } from "@/lib/v2/store"
import { heldState } from "@/lib/v2/approvals"
import { defaultConfig } from "@/lib/v2/config"
import type { EvalModel, Evaluation, EvaluatorRole, LevelMinimum, Person, PublishedRuleSnapshot, QuestionRule, RuleChangeRecord, ScoredRule, Skill, SkillConfig, V2State } from "@/lib/v2/types"
import { skillNoun } from "./terms"

/**
 * Configure a skill, design lab (docs/knowledge/design/configure-skill.md). Pure functions only.
 *
 * `LabRule` holds only what the requirements ask for: model [REQ SC-02], outcome labels and which qualifies [SC-03], questions and
 * their qualification rule [SC-04, SC-05], scale and pass threshold [SC-07], ordered levels [SC-08], a total and per-level minimums
 * [SC-10], clinical setting minimums [SC-11] where lab and simulation never count [SC-12], student fields [SC-13], mandatory
 * feedback [SC-14], self-evaluation and approval [SC-15] and sign-off roles [SC-16]. Different evaluators is PROPOSED
 * [BUILD-PROMPT 5; COMP Elentra; LEDGER Q6]. The v2 simulation share, prerequisites, credential qualification, failure policy and
 * last-N currency are not editable here; the two that change today's counts (window, simulation share) are carried read-only so
 * "before" equals what students see now.
 *
 * The engine re-runs a rule over evaluations already held [REQ AE-02, AE-03] and returns one of the four states [REQ AE-04].
 * Labels are presentation only [REQ AE-06]: an evaluation qualifies on its recorded outcome (met), never on the label text.
 */

export type { LevelMinimum, QuestionRule, ScoredRule }
export type FieldType = "date" | "short" | "long" | "number" | "choice"

export interface StudentField {
  label: string
  type: FieldType
  mandatory: boolean
}

export interface SettingMinimum {
  setting: string
  min: number
}

export interface LabRule {
  model: EvalModel | null
  outcomeLabels: [string, string]
  /** Which outcome label qualifies, chosen explicitly [REQ SC-03]. */
  qualifyingLabel: 0 | 1 | null
  questions: string[]
  /** Null until the admin chooses [REQ SC-05]. Null on evidence recorded under v2, which had no such rule. */
  questionRule: QuestionRule | null
  scaleMax: number
  scoredRule: ScoredRule | null
  levels: string[]
  need: number
  /** "At least N at this level or above" [REQ SC-10; BUILD-PROMPT 5 level rule]. */
  levelMinimums: LevelMinimum[]
  /** PROPOSED, not in REQ SC. 1 means any evaluator. */
  distinctEvaluators: number
  settingMinimums: SettingMinimum[]
  studentFields: StudentField[]
  feedbackRequired: boolean
  selfEvaluation: boolean
  approvalRequired: boolean
  evaluatorRoles: EvaluatorRole[]
  /** Read-only, carried from the published v2 rule. Not in REQ. Removing them is an edit like any other. */
  carried: { window: number | null; minLevelIndex: number | null; simulationCapPercent: number | null; simulationExcluded: boolean }
}

export type RecordState = "achieved" | "in-progress" | "not-qualifying" | "no-evidence"
export const RECORD_STATES: RecordState[] = ["achieved", "in-progress", "not-qualifying", "no-evidence"]

/** Word, tone and icon per skill-record state [REQ AE-04; LEDGER D-L1 "In progress"]. Amber, never red. */
export const STATE_SPEC: Record<RecordState, { label: string; tone: "success" | "info" | "warning" | "neutral"; icon: string }> = {
  achieved: { label: "Achieved", tone: "success", icon: "fa-circle-check" },
  "in-progress": { label: "In progress", tone: "neutral", icon: "fa-circle-half-stroke" },
  "not-qualifying": { label: "Evidence does not qualify", tone: "warning", icon: "fa-triangle-exclamation" },
  "no-evidence": { label: "No evidence yet", tone: "neutral", icon: "fa-minus" },
}

export const ROLE_LABEL: Record<EvaluatorRole, string> = { preceptor: "Preceptor", faculty: "Clinical faculty", "lab-instructor": "Lab instructor" }
export const ROLES: EvaluatorRole[] = ["preceptor", "faculty", "lab-instructor"]
export const FIELD_TYPE_LABEL: Record<FieldType, string> = { date: "Date", short: "Short text", long: "Long text", number: "Number", choice: "Choice list" }
/**
 * Model names in the client's own words [CALL 10-26 A.2]: approved or not approved, questions with a final result, independence
 * level. Scored stays fourth and is marked Proposed (it is REQ SC-07 but was not part of the call). The engine ids are unchanged.
 * The v2 labels (lib/v2/config.ts) are not edited here; the library column still reads them.
 */
export const LAB_MODEL_LABEL: Record<EvalModel, string> = {
  binary: "Approved or not approved",
  question: "Questions, then a final result",
  demonstration: "Independence level",
  scored: "Scored",
}
export { LAB_MODEL_LABEL as MODEL_LABEL }

/** The order the Model step offers them. Nothing is preselected [REQ SC-02]. */
export const LAB_MODELS: EvalModel[] = ["binary", "question", "demonstration", "scored"]
/** Shown with a Proposed marker: not part of the Oct 26 call. */
export const PROPOSED_MODELS: ReadonlySet<EvalModel> = new Set<EvalModel>(["scored"])

/** One line per model with an example in the client's words. */
export const MODEL_HELP: Record<EvalModel, string> = {
  binary: "One overall result per evaluation, such as Approved or Not approved.",
  question: "Yes or No on each question, then one result, such as 2 of 3 answered Yes.",
  demonstration: "How the student performed, such as Independent, With assistance or Observed.",
  scored: "A score per question on a scale you set, such as 1 to 5.",
}

/**
 * Two preset label sets the program can start from and then edit [CALL 10-26 B.3]. Levels are stored lowest first, the order the
 * Levels editor uses. A preset only fills labels; it never chooses which outcome qualifies or how many are needed.
 */
export type LabelPresetId = "approval" | "independence"
export const LABEL_PRESETS: Record<LabelPresetId, { label: string; outcomes?: [string, string]; levels?: string[] }> = {
  approval: { label: "Approved / Not approved", outcomes: ["Approved", "Not approved"] },
  independence: { label: "Independent / With assistance / Observed", levels: ["Observed", "With assistance", "Independent"] },
}
export const isLabelPreset = (v: string | null | undefined): v is LabelPresetId => v === "approval" || v === "independence"

/** Fill the labels from a preset. Binary keeps its qualifying choice; renamed levels keep their minimums only while they exist. */
export function applyPreset(rule: LabRule, id: LabelPresetId): LabRule {
  const p = LABEL_PRESETS[id]
  if (p.outcomes && rule.model === "binary") return { ...rule, outcomeLabels: [...p.outcomes] as [string, string] }
  if (p.levels && rule.model === "demonstration") {
    const levels = [...p.levels]
    return { ...rule, levels, levelMinimums: rule.levelMinimums.filter((m) => m.levelIndex < levels.length) }
  }
  return rule
}

const isInt = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n)
const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)
const norm = (t: string) => t.trim().toLowerCase().replace(/\s+/g, " ")
const joinAnd = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`)

// ---------------------------------------------------------------------------------------------------------------------
// Building rules

/** A rule for a skill that has never been configured. No model is implied [REQ SC-02]. */
export function emptyRule(): LabRule {
  return {
    model: null,
    outcomeLabels: ["Met", "Unmet"],
    qualifyingLabel: null,
    questions: [],
    questionRule: null,
    scaleMax: 5,
    scoredRule: null,
    levels: [],
    /** Empty on purpose: how many times is school-defined, so there is no platform default [CALL 10-26 A.2]. */
    need: Number.NaN,
    levelMinimums: [],
    distinctEvaluators: 1,
    settingMinimums: [],
    studentFields: [{ label: "Date performed", type: "date", mandatory: true }],
    feedbackRequired: false,
    selfEvaluation: false,
    approvalRequired: false,
    evaluatorRoles: [],
    carried: { window: null, minLevelIndex: null, simulationCapPercent: null, simulationExcluded: false },
  }
}

/** The published v2 configuration as a lab rule, so the "before" state is exactly what students see today. */
export function fromV2(skill: Pick<Skill, "model" | "config">): LabRule {
  const c: SkillConfig | null = skill.config
  if (!c || !skill.model) return emptyRule()
  const a = c.achievement
  const labels: [string, string] = [c.outcomeLabels[0], c.outcomeLabels[1] === "Not met" ? "Unmet" : c.outcomeLabels[1]]
  return {
    model: skill.model,
    outcomeLabels: labels,
    qualifyingLabel: c.qualifyingLabel === undefined ? 0 : c.qualifyingLabel,
    questions: [...c.questions],
    // A rule published from the lab is read back from the shared store; the seed has none (outcome decides, as before).
    questionRule: c.questionRule ? (JSON.parse(JSON.stringify(c.questionRule)) as QuestionRule) : null,
    scaleMax: 5,
    scoredRule: c.scoredRule ? { ...c.scoredRule } : null,
    levels: skill.model === "demonstration" ? [...c.levels] : [],
    need: a.need,
    levelMinimums: (c.levelMinimums ?? []).map((m) => ({ ...m })),
    distinctEvaluators: a.distinctEvaluators,
    settingMinimums: a.settingMinimums.map((m) => ({ ...m })),
    studentFields: [{ label: "Date performed", type: "date", mandatory: true }],
    feedbackRequired: !!c.feedbackRequired,
    selfEvaluation: false,
    approvalRequired: !!c.approvalRequired,
    evaluatorRoles: [...c.evaluatorRoles],
    carried: {
      window: a.kind === "last-n" && a.window ? a.window : null,
      minLevelIndex: a.minLevelIndex,
      simulationCapPercent: c.simulation.allowed && c.simulation.mode === "cap" ? c.simulation.maxSharePercent : null,
      simulationExcluded: !c.simulation.allowed,
    },
  }
}

/** Choosing or changing the model rebuilds what depends on it and keeps the rest [REQ SC-09, AE-07]. */
export function withModel(rule: LabRule, model: EvalModel): LabRule {
  if (rule.model === model) return rule
  const next: LabRule = { ...rule, model, levelMinimums: [], questionRule: null, scoredRule: null }
  if (model === "question" || model === "scored") {
    if (next.questions.length === 0) next.questions = [""]
  } else next.questions = []
  if (model === "demonstration") {
    if (next.levels.length === 0) next.levels = ["", ""]
  } else next.levels = []
  next.carried = { ...next.carried, minLevelIndex: model === "demonstration" ? next.carried.minLevelIndex : null }
  return next
}

/** A sample rule change for design review (?change=sample): a second evaluator and one Inpatient evaluation. */
export function sampleChange(rule: LabRule, settings: string[]): LabRule {
  const setting = settings[0] ?? "Inpatient"
  return {
    ...rule,
    distinctEvaluators: Math.max(2, rule.distinctEvaluators),
    settingMinimums: rule.settingMinimums.some((m) => m.setting === setting) ? rule.settingMinimums : [...rule.settingMinimums, { setting, min: 1 }],
  }
}

/** Copy a rule onto another skill [REQ IM-14]. Labels, questions and levels come with it; nothing about the target's evidence does. */
export const copyRule = (from: LabRule): LabRule => JSON.parse(JSON.stringify(from)) as LabRule

// ---------------------------------------------------------------------------------------------------------------------
// The rule sentence [REQ SC-17; BUILD-PROMPT 5 ruleSentence]

export interface RuleClauses {
  total: string
  qualifier: string
  levels: string[]
  distinct: string
  settings: string[]
}

function qualifierOf(rule: LabRule): string {
  switch (rule.model) {
    case "binary": {
      const l = rule.qualifyingLabel === null ? "" : rule.outcomeLabels[rule.qualifyingLabel]?.trim()
      return l ? `rated ${l}` : ""
    }
    case "question": {
      const r = rule.questionRule
      const m = rule.questions.length
      if (!r) return ""
      if (r.kind === "all") return "with every question answered Yes"
      if (r.kind === "atLeast") return `with at least ${r.n} of ${m} questions answered Yes`
      const picked = [...r.indices].sort((a, b) => a - b).map((i) => `${i + 1}`)
      return picked.length ? `with ${plural(picked.length, "question", "questions")} ${joinAnd(picked)} answered Yes` : ""
    }
    case "scored": {
      const r = rule.scoredRule
      if (!r) return ""
      if (r.kind === "average") return `averaging ${r.value} or more out of ${rule.scaleMax}`
      if (r.kind === "minEach") return `scoring at least ${r.value} on every question`
      return `totalling ${r.value} or more`
    }
    default:
      return ""
  }
}

/** True once the program has said how many times. Until then the rule has no count, by design (no platform default). */
export const hasNeed = (rule: Pick<LabRule, "need">): boolean => isInt(rule.need) && rule.need > 0

export function ruleClauses(rule: LabRule): RuleClauses {
  const need = hasNeed(rule) ? rule.need : 1
  return {
    total: `${need} ${plural(need, "evaluation", "evaluations")}`,
    qualifier: qualifierOf(rule),
    levels: rule.levelMinimums.filter((m) => rule.levels[m.levelIndex]?.trim()).map((m) => `at least ${m.min} at ${rule.levels[m.levelIndex].trim()} or above`),
    distinct: rule.distinctEvaluators >= 2 ? `from ${rule.distinctEvaluators} different evaluators` : "",
    settings: rule.settingMinimums.filter((m) => m.setting.trim() && isInt(m.min) && m.min > 0).map((m) => `${m.min} in ${m.setting}`),
  }
}

export type Audience = "admin" | "student"

/**
 * The rule in plain language, generated from the current rule at read time [REQ AE-02; strategy 02 section 7.4].
 * "Get 3 evaluations rated Met, at least 2 at Works alone or above, from 2 different evaluators, with 1 in Inpatient."
 */
export function ruleSentence(rule: LabRule, audience: Audience = "admin"): string {
  if (!rule.model) return `No rule yet. Choose how this ${skillNoun()} is evaluated.`
  if (!hasNeed(rule)) return audience === "student" ? "The program has not set how many times yet." : "Not set yet. Your program decides."
  const c = ruleClauses(rule)
  const parts = [c.qualifier ? `${c.total} ${c.qualifier}` : c.total, ...c.levels]
  if (c.distinct) parts.push(c.distinct)
  if (c.settings.length) parts.push(`with ${joinAnd(c.settings)}`)
  const body = parts.join(", ")
  return audience === "student" ? `You need ${body}.` : `Get ${body}.`
}

/** The one fact students must not have to guess [REQ SC-12]. Empty when no setting minimum exists. */
export function settingNote(rule: LabRule): string {
  const names = rule.settingMinimums.map((m) => m.setting).filter((s) => s.trim())
  return names.length ? `Lab and simulation evidence does not count toward ${joinAnd(names)}.` : ""
}

/** Carried v2 parts, said in words so the sentence never hides a rule that still changes counts. */
export function carriedNotes(rule: LabRule): string[] {
  const out: string[] = []
  const need = rule.need > 0 ? rule.need : 1
  if (rule.carried.window) out.push(`Only the last ${rule.carried.window} evaluations are used.`)
  if (rule.carried.simulationExcluded) out.push("Simulation evaluations are not counted.")
  else if (rule.carried.simulationCapPercent !== null) {
    const max = Math.floor((need * rule.carried.simulationCapPercent) / 100)
    out.push(`Simulation can supply at most ${max} of ${need}.`)
  }
  if (rule.carried.minLevelIndex !== null) out.push("A minimum level from the earlier rule applies.")
  return out
}

/** What the evaluator is told after submitting [REQ EV-07]. */
export const afterSubmitLine = (rule: LabRule): string => (rule.approvalRequired ? "Your evaluation goes to the program for approval before it counts." : "Your evaluation counts as soon as you submit.")

// ---------------------------------------------------------------------------------------------------------------------
// Validation [REQ SC-02, SC-03, SC-06, SC-18]

/**
 * Four editing sections, then Check (docs/knowledge/design/skill-setup-journey/02 section 4, J4). Setting minimums live in the
 * rule (they are achievement criteria [REQ SC-11, AE-03]); signer roles, student fields, feedback, self-evaluation and approval
 * share "Who signs" (what an evaluation must carry [REQ SC-13..16]).
 */
export type SectionId = "model" | "outcomes" | "rule" | "signoff"

/** The two configuration dimensions, named the way the client says them [CALL 10-26 A.2, B.1]. */
/** The model step, in the client's words: "Model" is an internal word (UX critique 2026-10-26). The question stays "How is this skill evaluated?". */
export const MODEL_STEP_LABEL = "How it's judged"
export const CRITERIA_LABEL = "Evaluation criteria"
export const HOW_MANY_LABEL = "How many times"
export type ConfigureStepId = SectionId | "check"

export const SECTIONS: Array<{ id: SectionId; label: string }> = [
  { id: "model", label: MODEL_STEP_LABEL },
  { id: "outcomes", label: CRITERIA_LABEL },
  { id: "rule", label: HOW_MANY_LABEL },
  { id: "signoff", label: "Who signs" },
]

/** The five wizard steps, three words at most. Section ids stay the engine's; only labels follow the client. */
export const CONFIGURE_STEPS: Array<{ id: ConfigureStepId; label: string }> = [...SECTIONS, { id: "check", label: "Check" }]

/**
 * The outcomes step keeps the client's name for every model [CALL 10-26 B.1]; what it holds (outcomes, questions or levels) is
 * named inside the step by `criteriaKind`.
 */
export function outcomesLabel(_model: EvalModel | null): string {
  return CRITERIA_LABEL
}

/** What the evaluation criteria step asks for under the chosen model. */
export function criteriaKind(model: EvalModel | null): string {
  if (model === "question" || model === "scored") return "Questions"
  if (model === "demonstration") return "Levels"
  return "Outcomes"
}

export const isConfigureStep = (v: string | null | undefined): v is ConfigureStepId => CONFIGURE_STEPS.some((x) => x.id === v)

export interface RuleIssue {
  id: string
  section: SectionId
  /** DOM id of the control to focus. */
  field: string
  message: string
}

function dupIndexes(list: string[]): Set<number> {
  const seen = new Map<string, number>()
  const out = new Set<number>()
  list.forEach((t, i) => {
    const k = norm(t)
    if (!k) return
    if (seen.has(k)) {
      out.add(i)
      out.add(seen.get(k)!)
    } else seen.set(k, i)
  })
  return out
}

export function validateRule(rule: LabRule): RuleIssue[] {
  const out: RuleIssue[] = []
  const add = (section: SectionId, field: string, code: string, message: string) => out.push({ id: `${field}:${code}`, section, field, message })
  const m = rule.model
  if (!m) {
    add("model", "cfg-model", "missing", "Choose an evaluation model. Nothing is chosen for you.")
    return out
  }

  if (m === "binary") {
    const [a, b] = rule.outcomeLabels
    if (!a.trim()) add("outcomes", "cfg-label-0", "blank", "Name the first outcome.")
    if (!b.trim()) add("outcomes", "cfg-label-1", "blank", "Name the second outcome.")
    if (a.trim() && b.trim() && norm(a) === norm(b)) add("outcomes", "cfg-label-1", "same", "The two outcomes need different names.")
    if (rule.qualifyingLabel === null) add("outcomes", "cfg-qualifying", "missing", "Choose which outcome qualifies.")
  }

  if (m === "question" || m === "scored") {
    if (rule.questions.length === 0) add("outcomes", "cfg-add-question", "none", "Add at least one question.")
    const dup = dupIndexes(rule.questions)
    rule.questions.forEach((q, i) => {
      if (!q.trim()) add("outcomes", `cfg-question-${i}`, "blank", `Question ${i + 1} has no text.`)
      else if (dup.has(i)) add("outcomes", `cfg-question-${i}`, "dup", `Question ${i + 1} repeats another question.`)
    })
  }

  if (m === "question") {
    const r = rule.questionRule
    if (!r) add("rule", "cfg-qrule", "missing", "Choose what makes an evaluation qualify.")
    else if (r.kind === "atLeast" && (!isInt(r.n) || r.n < 1 || r.n > rule.questions.length)) add("rule", "cfg-qrule-n", "range", `Enter a number from 1 to ${rule.questions.length}.`)
    else if (r.kind === "subset" && r.indices.filter((i) => i < rule.questions.length).length === 0) add("rule", "cfg-qrule-subset", "empty", "Tick at least one question that must be Yes.")
  }

  if (m === "scored") {
    if (!isInt(rule.scaleMax) || rule.scaleMax < 2 || rule.scaleMax > 10) add("outcomes", "cfg-scale", "range", "Enter a scale top from 2 to 10.")
    const r = rule.scoredRule
    if (!r) add("rule", "cfg-srule", "missing", "Choose how a score qualifies.")
    else {
      const max = r.kind === "total" ? rule.scaleMax * Math.max(1, rule.questions.length) : rule.scaleMax
      if (!(typeof r.value === "number" && r.value >= 1 && r.value <= max)) add("rule", "cfg-srule-value", "range", `Enter a pass mark from 1 to ${max}.`)
    }
  }

  if (m === "demonstration") {
    if (rule.levels.length < 2) add("outcomes", "cfg-add-level", "few", "Add at least two levels.")
    const dup = dupIndexes(rule.levels)
    rule.levels.forEach((l, i) => {
      if (!l.trim()) add("outcomes", `cfg-level-${i}`, "blank", `Level ${i + 1} has no name.`)
      else if (dup.has(i)) add("outcomes", `cfg-level-${i}`, "dup", `Level ${i + 1} repeats another level.`)
    })
  }

  if (!isInt(rule.need) || rule.need < 1) add("rule", "cfg-need", "need", "Enter how many valid attempts are needed, 1 or more.")
  rule.levelMinimums.forEach((lm, i) => {
    if (lm.levelIndex < 0 || lm.levelIndex >= rule.levels.length || !rule.levels[lm.levelIndex]?.trim()) add("rule", `cfg-lmin-level-${i}`, "level", "Choose a level for this minimum.")
    if (!isInt(lm.min) || lm.min < 1) add("rule", `cfg-lmin-${i}`, "min", "Enter a level minimum of 1 or more.")
    else if (isInt(rule.need) && lm.min > rule.need) add("rule", `cfg-lmin-${i}`, "gt", `${lm.min} at a level is more than the ${rule.need} needed in total.`)
  })
  if (!isInt(rule.distinctEvaluators) || rule.distinctEvaluators < 1) add("rule", "cfg-distinct", "min", "Enter 1 or more evaluators.")
  else if (isInt(rule.need) && rule.distinctEvaluators > rule.need) add("rule", "cfg-distinct", "gt", `${rule.distinctEvaluators} different evaluators cannot sign ${rule.need} ${plural(rule.need, "evaluation", "evaluations")}.`)

  const dupSet = dupIndexes(rule.settingMinimums.map((x) => x.setting))
  rule.settingMinimums.forEach((s, i) => {
    if (!s.setting.trim()) add("rule", `cfg-setting-${i}`, "blank", `Choose a clinical setting for row ${i + 1}.`)
    else if (dupSet.has(i)) add("rule", `cfg-setting-${i}`, "dup", `${s.setting} is listed twice.`)
    if (!isInt(s.min) || s.min < 1) add("rule", `cfg-setting-min-${i}`, "min", `Enter a minimum of 1 or more for ${s.setting || `row ${i + 1}`}.`)
  })
  const settingsTotal = rule.settingMinimums.reduce((n, s) => n + (isInt(s.min) ? s.min : 0), 0)
  if (isInt(rule.need) && settingsTotal > rule.need) add("rule", "cfg-setting-min-0", "sum", `Setting minimums add up to ${settingsTotal}, more than the ${rule.need} needed.`)

  const fdup = dupIndexes(rule.studentFields.map((f) => f.label))
  rule.studentFields.forEach((f, i) => {
    if (!f.label.trim()) add("signoff", `cfg-field-${i}`, "blank", `Student field ${i + 1} has no label.`)
    else if (fdup.has(i)) add("signoff", `cfg-field-${i}`, "dup", `Student field ${i + 1} repeats another label.`)
  })

  if (rule.evaluatorRoles.length === 0) add("signoff", "cfg-role-preceptor", "none", "Choose at least one role that may sign off.")
  else if (rule.settingMinimums.length > 0 && !rule.evaluatorRoles.some((r) => r !== "lab-instructor")) {
    add("signoff", "cfg-role-preceptor", "labonly", "Setting minimums need clinical evidence, and a lab instructor alone cannot supply it.")
  }
  return out
}

// ---------------------------------------------------------------------------------------------------------------------
// The engine: re-run a rule over evaluations already held [REQ AE-01, AE-02, AE-03, AE-04]

export interface RuleResult {
  state: RecordState
  /** Counted evaluations that qualify and that the rule uses. */
  have: number
  need: number
  distinct: { have: number; need: number }
  settings: Array<{ setting: string; have: number; min: number }>
  levels: Array<{ level: string; have: number; min: number }>
  /** How attempts are counted [CALL 10-26 A.2]: every completed evaluation is an attempt; `have` of them count. */
  attempts: AttemptCount
}

/** "5 attempts, 2 not approved: 3 count". Waiting and held evaluations are not attempts yet [AE-01]. */
export interface AttemptCount {
  /** Completed (counted-status) evaluations. */
  total: number
  /** Did not qualify on their own answers (outcome, questions, score or level). */
  notQualifying: number
  /** Qualified but left out by a carried limit (window, simulation share). */
  notUsed: number
  /** Valid attempts the rule uses; equals RuleResult.have. */
  count: number
}

/** A rule the engine refuses to run (an unset frequency): typed, never defaulted to 1. validateRule names the field. */
export interface InvalidRuleResult {
  state: "invalid"
  reason: RuleInvalidReason
  message: string
}

export const isInvalidResult = (r: RuleResult | InvalidRuleResult): r is InvalidRuleResult => r.state === "invalid"

/** The lab rule as the one engine reads it (lib/v2/rules.ts). Carried v2 parts are passed through unchanged. */
export function engineRuleOfLab(rule: LabRule): EngineRule {
  return {
    model: rule.model,
    questionRule: rule.model === "question" ? rule.questionRule : null,
    scoredRule: rule.model === "scored" ? rule.scoredRule : null,
    need: rule.need,
    window: rule.carried.window,
    minLevelIndex: rule.carried.minLevelIndex,
    simulationExcluded: rule.carried.simulationExcluded,
    simulationCapPercent: rule.carried.simulationExcluded ? null : rule.carried.simulationCapPercent,
    distinctEvaluators: rule.distinctEvaluators,
    settingMinimums: rule.settingMinimums,
    levelMinimums: rule.levelMinimums,
    levels: rule.levels,
  }
}

/** One evaluation is a valid attempt on its own answers under `rule`. The engine's own function, not a copy. */
export const qualifiesOn = (rule: LabRule, e: Evaluation): boolean => engineQualifiesOn(engineRuleOfLab(rule), e)

/**
 * One student's record on one skill under `rule`, from that student's evaluations. Waiting and held evidence never counts [AE-01].
 * Runs the shared engine (lib/v2/rules.ts runRule), the same call v2 student progress makes. An unset need returns the typed
 * invalid result; there is no silent fallback to 1.
 */
export function evaluateRule(rule: LabRule, evals: readonly Evaluation[]): RuleResult | InvalidRuleResult {
  const run = runRule(engineRuleOfLab(rule), evals)
  if (!run.valid) return { state: "invalid", reason: run.reason, message: run.message }
  const { have, need, counted, achieved } = run
  const state: RecordState = achieved ? "achieved" : have > 0 ? "in-progress" : counted.length > 0 ? "not-qualifying" : "no-evidence"
  const attempts: AttemptCount = { total: counted.length, notQualifying: run.notQualifying, notUsed: run.notUsed, count: have }
  return {
    state,
    have,
    need,
    distinct: { have: run.distinctHave, need: run.distinctNeed },
    settings: run.settings.map((x) => ({ setting: x.setting, have: x.have, min: x.min })),
    levels: run.levels.map((x) => ({ level: x.level, have: x.have, min: x.min })),
    attempts,
  }
}

export { NEED_UNSET_MESSAGE }

/** The word for an attempt that did not qualify: the program's own second label for a binary rule, else plain words. */
function notQualifyingWord(rule: LabRule): string {
  if (rule.model === "binary" && rule.qualifyingLabel !== null) {
    const other = rule.outcomeLabels[rule.qualifyingLabel === 0 ? 1 : 0]?.trim()
    if (other) return other.toLowerCase()
  }
  return rule.model === "question" ? "not valid" : "did not qualify"
}

/**
 * One plain counting line [CALL 10-26 B.4]: "5 attempts, 2 not approved: 3 count". With nothing left out it is "3 attempts,
 * 3 count". Empty when there are no completed attempts.
 */
export function attemptLine(rule: LabRule, a: AttemptCount): string {
  if (a.total === 0) return ""
  const head = `${a.total} ${plural(a.total, "attempt", "attempts")}`
  const tail = `${a.count} ${a.count === 1 ? "counts" : "count"}`
  const out: string[] = []
  if (a.notQualifying > 0) out.push(`${a.notQualifying} ${notQualifyingWord(rule)}`)
  if (a.notUsed > 0) out.push(`${a.notUsed} not used`)
  return out.length ? `${head}, ${out.join(", ")}: ${tail}` : `${head}, ${tail}`
}

/** What is still needed, in the student's terms [REQ SH-03]. At most three, settings first. */
export function shortfall(r: RuleResult): string[] {
  if (r.state === "achieved") return []
  const out: string[] = []
  for (const s of r.settings) if (s.have < s.min) out.push(`${s.min - s.have} more in ${s.setting} (you have ${s.have} of ${s.min})`)
  for (const l of r.levels) if (l.have < l.min) out.push(`${l.min - l.have} more at ${l.level} or above`)
  if (r.distinct.have < r.distinct.need) out.push(`${r.distinct.need - r.distinct.have} more different ${plural(r.distinct.need - r.distinct.have, "evaluator", "evaluators")} (you have ${r.distinct.have})`)
  if (r.have < r.need) out.push(`${r.need - r.have} more qualifying ${plural(r.need - r.have, "evaluation", "evaluations")}`)
  return out.slice(0, 3)
}

/** One thing still needed, in the admin's terms, keyed so identical needs across students can be stated once (J7). */
export interface Gap {
  key: string
  /** "1 more in Inpatient", "1 more different evaluator". */
  label: string
}

/** What is still needed, worded for staff (no "you have"), settings first, then levels, evaluators and the total. */
export function gapsOf(r: RuleResult): Gap[] {
  if (r.state === "achieved") return []
  const out: Gap[] = []
  for (const s of r.settings) if (s.have < s.min) out.push({ key: `setting:${s.setting}:${s.min - s.have}`, label: `${s.min - s.have} more in ${s.setting}` })
  for (const l of r.levels) if (l.have < l.min) out.push({ key: `level:${l.level}:${l.min - l.have}`, label: `${l.min - l.have} more at ${l.level} or above` })
  if (r.distinct.have < r.distinct.need) {
    const n = r.distinct.need - r.distinct.have
    out.push({ key: `distinct:${n}`, label: `${n} more different ${plural(n, "evaluator", "evaluators")}` })
  }
  if (r.have < r.need) {
    const n = r.need - r.have
    out.push({ key: `count:${n}`, label: `${n} more qualifying ${plural(n, "evaluation", "evaluations")}` })
  }
  return out
}

// ---------------------------------------------------------------------------------------------------------------------
// Impact before publish [REQ AE-02; strategy 03 section 9; strategy 05 C17]

/** How existing evidence is treated on publish. PENDING-ROMIT (REQ AE-02 says re-apply; option B versions by cohort): not decided here. */
export type PublishMode = "reapply" | "new-only"

export interface ImpactRow {
  studentId: string
  name: string
  cohort: string
  before: RecordState
  after: RecordState
  /** Shortfall under the new rule, for the student message. */
  left: string[]
  /** The same shortfall in staff wording, keyed, so a tie can be said once. */
  gaps: Gap[]
  verified: boolean
}

export interface Impact {
  skillId: string
  students: number
  /** Students with any evaluation on this skill. */
  withEvidence: number
  evaluations: number
  before: Record<RecordState, number>
  after: Record<RecordState, number>
  /** Students whose state changes, worst first (lost achieved, then everything else), then by name. */
  changed: ImpactRow[]
  transitions: Array<{ from: RecordState; to: RecordState; count: number }>
  lostAchieved: number
  gainedAchieved: number
  /** Changed students who hold a director verification, which would read "Changed since verified" (v2 proposal). */
  changedVerified: number
  ruleChanged: boolean
  /**
   * A real example of how attempts are counted under the draft rule: the first student (dataset order) with at least one attempt
   * that did not qualify and two or more that count, else the first with any that did not qualify. Null when nobody has one.
   */
  example: AttemptCount | null
  /** The draft cannot be evaluated (no frequency set): nobody changes until it is fixed. Null when the draft runs. */
  invalid: InvalidRuleResult | null
}

const zero = (): Record<RecordState, number> => ({ achieved: 0, "in-progress": 0, "not-qualifying": 0, "no-evidence": 0 })
const RANK: Record<RecordState, number> = { achieved: 3, "in-progress": 2, "not-qualifying": 1, "no-evidence": 0 }

export function studentsOf(s: V2State): Person[] {
  return s.people.filter((p) => p.kind === "student")
}

/** Compare two rules on everything that changes who qualifies. Wording, labels, fields, feedback and approval never do [AE-06]. */
export function engineKey(rule: LabRule): string {
  const { model, qualifyingLabel, questionRule, scoredRule, scaleMax, need, levelMinimums, distinctEvaluators, settingMinimums, carried } = rule
  return JSON.stringify({ model, q: model === "binary" ? qualifyingLabel !== null : null, questionRule, scoredRule, scaleMax: model === "scored" ? scaleMax : null, need, levelMinimums, distinctEvaluators, settingMinimums, carried })
}

/**
 * Re-run `after` over every evaluation already held for `skillId` and diff against `before`, per student. Pure; reads only
 * the evidence index. With mode "new-only" no current state changes (the new rule waits for new evidence).
 */
export function computeImpact(input: V2State, skillId: string, before: LabRule, after: LabRule, mode: PublishMode | null = "reapply"): Impact {
  // Read the evidence the way every student screen and figure reads it (held evidence never counts), so the before and after
  // counts are the counts the student screens show.
  const s = heldState(input)
  const students = studentsOf(s)
  const verified = new Set((s.verifications ?? []).map((v) => v.studentId))
  const b = zero()
  const a = zero()
  const changed: ImpactRow[] = []
  const trans = new Map<string, number>()
  let withEvidence = 0
  let evaluations = 0
  let example: AttemptCount | null = null
  let exampleWeak = true
  let invalid: InvalidRuleResult | null = null
  const live = mode !== "new-only"
  const configured = !!before.model
  for (const p of students) {
    const evals = evalsOfStudentSkill(s, p.id, skillId)
    if (evals.length) withEvidence++
    evaluations += evals.length
    const rbRaw = configured ? evaluateRule(before, evals) : null
    const raRaw = after.model ? evaluateRule(after, evals) : null
    if (raRaw && isInvalidResult(raRaw)) invalid = raRaw
    const rb = rbRaw && !isInvalidResult(rbRaw) ? rbRaw : null
    // An invalid draft (no frequency yet) changes nobody: "after" stays "before" and `invalid` says why.
    const ra = raRaw && !isInvalidResult(raRaw) ? raRaw : null
    // Prefer a record that shows both sides (2 or more count, 1 or more did not); else the first with any that did not.
    if (ra && ra.attempts.notQualifying > 0 && ra.attempts.total >= 2) {
      if (!example || (exampleWeak && ra.attempts.count >= 2)) {
        exampleWeak = ra.attempts.count < 2
        example = ra.attempts
      }
    }
    const sb: RecordState = rb?.state ?? "no-evidence"
    const sa: RecordState = live && ra ? ra.state : sb
    b[sb]++
    a[sa]++
    if (sb !== sa) {
      changed.push({ studentId: p.id, name: p.name, cohort: p.cohort ?? "", before: sb, after: sa, left: ra ? shortfall(ra) : [], gaps: ra ? gapsOf(ra) : [], verified: verified.has(p.id) })
      const k = `${sb}>${sa}`
      trans.set(k, (trans.get(k) ?? 0) + 1)
    }
  }
  changed.sort((x, y) => RANK[y.before] - RANK[y.after] - (RANK[x.before] - RANK[x.after]) || x.name.localeCompare(y.name))
  const transitions = [...trans.entries()].map(([k, count]) => {
    const [from, to] = k.split(">") as [RecordState, RecordState]
    return { from, to, count }
  }).sort((x, y) => y.count - x.count)
  return {
    skillId,
    students: students.length,
    withEvidence,
    evaluations,
    before: b,
    after: a,
    changed,
    transitions,
    lostAchieved: changed.filter((r) => r.before === "achieved").length,
    gainedAchieved: changed.filter((r) => r.after === "achieved").length,
    changedVerified: changed.filter((r) => r.verified).length,
    ruleChanged: engineKey(before) !== engineKey(after),
    example,
    invalid,
  }
}

/** Students who make the same move (for example Achieved to In progress), with what they share said once (J7). */
export interface ImpactGroup {
  from: RecordState
  to: RecordState
  rows: ImpactRow[]
  /** Needs every student in the group has, worded once: "All 15 need 1 more in Inpatient." */
  shared: Gap[]
  /** Students split by identical needs, largest first, so each combination of needs is stated once. */
  parts: Array<{ gaps: Gap[]; rows: ImpactRow[] }>
}

const MAX_PARTS_IN_SENTENCE = 3

/** Group changed students by move, losses first, then larger groups. Pure. */
export function groupImpact(impact: Pick<Impact, "changed">): ImpactGroup[] {
  const by = new Map<string, ImpactRow[]>()
  for (const r of impact.changed) {
    const k = `${r.before}>${r.after}`
    by.set(k, [...(by.get(k) ?? []), r])
  }
  const loss = (from: RecordState, to: RecordState) => RANK[from] - RANK[to]
  return [...by.entries()]
    .map(([k, rows]) => {
      const [from, to] = k.split(">") as [RecordState, RecordState]
      const first = rows[0]?.gaps ?? []
      const shared = first.filter((g) => rows.every((r) => r.gaps.some((x) => x.key === g.key)))
      const byNeeds = new Map<string, { gaps: Gap[]; rows: ImpactRow[] }>()
      for (const r of rows) {
        const k = r.gaps.map((g) => g.key).join("|")
        const p = byNeeds.get(k) ?? { gaps: r.gaps, rows: [] }
        p.rows.push(r)
        byNeeds.set(k, p)
      }
      const parts = [...byNeeds.values()].sort((a, b) => b.rows.length - a.rows.length || a.gaps.length - b.gaps.length)
      return { from, to, rows, shared, parts }
    })
    .sort((a, b) => loss(b.from, b.to) - loss(a.from, a.to) || b.rows.length - a.rows.length)
}

/** "All 15 need 1 more in Inpatient." / "Needs 1 more in Inpatient." / "12 need ... 3 need ...". Said once per group. */
export function groupReason(g: ImpactGroup): string {
  const n = g.rows.length
  if (g.to === "achieved") return n === 1 ? "Meets the new rule." : `All ${n} meet the new rule.`
  if (g.shared.length && g.parts.length === 1) {
    const what = joinAnd(g.shared.map((x) => x.label))
    return n === 1 ? `Needs ${what}.` : `All ${n} need ${what}.`
  }
  const shown = g.parts.slice(0, MAX_PARTS_IN_SENTENCE).map(partSentence)
  const rest = g.parts.slice(MAX_PARTS_IN_SENTENCE).reduce((k, p) => k + p.rows.length, 0)
  if (rest) shown.push(`${rest} need other combinations.`)
  return shown.join(" ")
}

/** "13 need 1 more in Inpatient." for one part of a group. */
export function partSentence(p: { gaps: Gap[]; rows: ImpactRow[] }): string {
  const n = p.rows.length
  const what = p.gaps.length ? joinAnd(p.gaps.map((x) => x.label)) : "nothing more"
  return `${n} ${n === 1 ? "needs" : "need"} ${what}.`
}

/** What a student still needs beyond what their group shares, for the per-student table. */
export const extraGaps = (row: ImpactRow, g: ImpactGroup): Gap[] => row.gaps.filter((x) => !g.shared.some((s) => s.key === x.key))

/**
 * The clauses a rule change adds and removes, so Check can say what changed without repeating the whole sentence the footer
 * already shows: { added: ["from 2 different evaluators", "1 in Inpatient"], removed: [] }.
 */
export function ruleDelta(before: LabRule | null, after: LabRule): { added: string[]; removed: string[] } {
  const parts = (r: LabRule | null): string[] => {
    if (!r?.model) return []
    const c = ruleClauses(r)
    return [c.qualifier ? `${c.total} ${c.qualifier}` : c.total, ...c.levels, ...(c.distinct ? [c.distinct] : []), ...c.settings]
  }
  const b = parts(before)
  const a = parts(after)
  return { added: a.filter((x) => !b.includes(x)), removed: b.filter((x) => !a.includes(x)) }
}

/** "Adds from 2 different evaluators and 1 in Inpatient." / "Removes 1 in Outpatient." / both, said once. */
export function ruleDeltaLine(before: LabRule | null, after: LabRule): string {
  const d = ruleDelta(before, after)
  const out: string[] = []
  if (d.added.length) out.push(`Adds ${joinAnd(d.added)}.`)
  if (d.removed.length) out.push(`Removes ${joinAnd(d.removed)}.`)
  return out.join(" ")
}

/** One line per setting that differs between two rules, in plain words, for "What you changed" on Check [REQ SC-19]. */
export function configDiff(before: LabRule | null, after: LabRule): Array<{ label: string; before: string; after: string }> {
  const out: Array<{ label: string; before: string; after: string }> = []
  const onOff = (b: boolean) => (b ? "On" : "Off")
  const roles = (r: LabRule) => r.evaluatorRoles.map((x) => ROLE_LABEL[x]).join(", ") || "None"
  const fields = (r: LabRule) => r.studentFields.filter((f) => f.label.trim()).map((f) => f.label.trim()).join(", ") || "None"
  const labels = (r: LabRule) =>
    r.model === "binary" ? r.outcomeLabels.join(" or ") : r.model === "demonstration" ? r.levels.filter((l) => l.trim()).join(", ") : `${r.questions.length} ${plural(r.questions.length, "question", "questions")}`
  const push = (label: string, b: string, a: string) => {
    if (b !== a) out.push({ label, before: b, after: a })
  }
  const none = "Not set"
  push(MODEL_STEP_LABEL, before?.model ? LAB_MODEL_LABEL[before.model] : none, after.model ? LAB_MODEL_LABEL[after.model] : none)
  push(outcomesLabel(after.model), before?.model ? labels(before) : none, after.model ? labels(after) : none)
  if (engineKey(before ?? emptyRule()) !== engineKey(after)) push(HOW_MANY_LABEL,before?.model ? ruleSentence(before) : none, (before?.model && ruleDeltaLine(before, after)) || ruleSentence(after))
  push("Who can sign off", before ? roles(before) : none, roles(after))
  push("Student adds", before ? fields(before) : none, fields(after))
  push("Feedback required", onOff(!!before?.feedbackRequired), onOff(after.feedbackRequired))
  push("Self-evaluation first", onOff(!!before?.selfEvaluation), onOff(after.selfEvaluation))
  push("Approval before it counts", onOff(!!before?.approvalRequired), onOff(after.approvalRequired))
  return out
}

/** Bulk apply [REQ IM-14]: impact of copying one rule onto each selected skill, one row per skill. */
export function bulkImpact(s: V2State, skillIds: string[], rule: LabRule): Array<{ skillId: string; name: string; published: boolean; changed: number; lostAchieved: number }> {
  return skillIds.map((id) => {
    const k = skillById(s, id)
    if (!k) return { skillId: id, name: id, published: false, changed: 0, lostAchieved: 0 }
    const im = computeImpact(s, id, fromV2(k), rule)
    return { skillId: id, name: k.name, published: k.published, changed: im.changed.length, lostAchieved: im.lostAchieved }
  })
}

/** The line an affected student sees on the skill after publish (strategy 03 H11). In-product only; email is out of scope [REQ 14]. */
export function affectedStudentLine(skillName: string, rule: LabRule, row: Pick<ImpactRow, "left"> | null, dateLabel: string): string {
  const sentence = ruleSentence(rule, "student").replace(/^You need /, "")
  const lead = `Rule changed ${dateLabel}: ${skillName} now needs ${sentence}`
  return row && row.left.length ? `${lead} Still needed: ${row.left.join("; ")}.` : lead
}

/** Configured skills offered as a copy source [REQ IM-14], same program, excluding the skill itself. */
export function copySources(s: V2State, skillId: string): Skill[] {
  return s.skills.filter((k) => k.id !== skillId && k.config && k.model).sort((a, b) => a.name.localeCompare(b.name))
}

// ---------------------------------------------------------------------------------------------------------------------
// Publish: write the rule to the shared store, where the v2 engine reads it [REQ AE-02, SC-19; decision D-X27]

/**
 * The lab rule as the skill's v2 configuration. Keeps what the lab does not edit (prerequisites, qualification, failure policy,
 * the overall rating and its levels) from the previous configuration; the carried window, minimum level and simulation share are
 * written back as they stand in the rule, so publishing an unchanged rule changes no count.
 */
export function toSkillConfig(prev: SkillConfig | null, rule: LabRule): SkillConfig {
  const base: SkillConfig = prev ?? defaultConfig(rule.model)
  const m = rule.model
  const c = rule.carried
  const simulation: SkillConfig["simulation"] = c.simulationExcluded
    ? { ...base.simulation, allowed: false }
    : c.simulationCapPercent !== null
      ? { ...base.simulation, allowed: true, mode: "cap", maxSharePercent: c.simulationCapPercent }
      : { ...base.simulation, allowed: true, mode: "allow-list" }
  const achievement: SkillConfig["achievement"] = {
    kind: c.window ? "last-n" : "count",
    need: rule.need,
    ...(c.window ? { window: c.window } : {}),
    minLevelIndex: c.minLevelIndex,
    distinctEvaluators: rule.distinctEvaluators,
    settingMinimums: rule.settingMinimums.map((x) => ({ setting: x.setting, min: x.min })),
  }
  return {
    ...base,
    outcomeLabels: m === "binary" ? [rule.outcomeLabels[0], rule.outcomeLabels[1]] : base.outcomeLabels,
    questions: m === "question" || m === "scored" ? [...rule.questions] : [],
    levels: m === "demonstration" ? [...rule.levels] : base.levels,
    achievement,
    simulation,
    evaluatorRoles: [...rule.evaluatorRoles],
    feedbackRequired: rule.feedbackRequired,
    approvalRequired: rule.approvalRequired,
    questionRule: m === "question" && rule.questionRule ? (JSON.parse(JSON.stringify(rule.questionRule)) as QuestionRule) : null,
    scoredRule: m === "scored" && rule.scoredRule ? { ...rule.scoredRule } : null,
    levelMinimums: rule.levelMinimums.map((x) => ({ levelIndex: x.levelIndex, min: x.min })),
    qualifyingLabel: m === "binary" ? rule.qualifyingLabel : null,
  }
}

/** The rule version snapshot kept on the store's rule history (V2State.ruleChanges). */
export function ruleSnapshot(rule: LabRule): PublishedRuleSnapshot {
  if (!rule.model) throw new Error("A rule with no model cannot be published.")
  return {
    model: rule.model,
    criteriaKind: criteriaKind(rule.model),
    outcomeLabels: [rule.outcomeLabels[0], rule.outcomeLabels[1]],
    qualifyingLabel: rule.qualifyingLabel,
    questions: [...rule.questions],
    questionRule: rule.model === "question" ? rule.questionRule : null,
    scoredRule: rule.model === "scored" ? rule.scoredRule : null,
    levels: [...rule.levels],
    need: rule.need,
    levelMinimums: rule.levelMinimums.map((x) => ({ ...x })),
    distinctEvaluators: rule.distinctEvaluators,
    settingMinimums: rule.settingMinimums.map((x) => ({ ...x })),
    mode: "reapply",
  }
}

export type PublishWrite =
  | { ok: true; state: V2State; written: true; version: number }
  /** New evidence only (PENDING-ROMIT): the engine has no per-evaluation rule version yet, so nothing is written; see D-X27. */
  | { ok: true; state: V2State; written: false; reason: string }
  | { ok: false; error: string; issues: RuleIssue[] }

/**
 * Writes a published lab rule to the shared v2 store as the skill's live configuration plus a rule version (V2State.ruleChanges),
 * so skillProgress (and every figure built on it: student progress, dashboard, director, lists) reads it at once and after reload.
 * Refuses an invalid rule (validateRule; an unset frequency is one of the issues, never defaulted). Pure; returns a new state.
 */
export function publishLabRule(s: V2State, skillId: string, rule: LabRule, opts: { at: string; byId: string; mode: PublishMode | null }): PublishWrite {
  const issues = validateRule(rule)
  if (issues.length) return { ok: false, error: issues[0]!.message, issues }
  const skill = skillById(s, skillId)
  if (!skill) return { ok: false, error: `This ${skillNoun()} is no longer in the library.`, issues: [] }
  if (opts.mode === "new-only") return { ok: true, state: s, written: false, reason: "Applying a rule to new evidence only is not decided yet, so the shared rule is unchanged." }
  const config = toSkillConfig(skill.config, rule)
  const previous = (s.ruleChanges ?? []).filter((r) => r.skillId === skillId)
  // The seed's first published rule is version 1; a skill with a rule and no history is on version 1.
  const current = previous.length ? Math.max(...previous.map((r) => r.version)) : skill.config ? 1 : 0
  const version = current + 1
  const record: RuleChangeRecord = { skillId, at: opts.at, byId: opts.byId, version, published: ruleSnapshot(rule) }
  const skills = s.skills.map((k) => (k.id === skillId ? { ...k, model: rule.model, configured: true, published: true, config } : k))
  const next = appendAudit({ ...s, skills, ruleChanges: [...(s.ruleChanges ?? []), record] }, opts.byId, `Published rule version ${version}`, skill.name, opts.at)
  return { ok: true, state: next, written: true, version }
}
