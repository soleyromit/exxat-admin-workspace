import { evalsOfStudentSkill, skillById } from "@/lib/v2/evidence-index"
import { NEED_UNSET_MESSAGE, qualifiesOn as engineQualifiesOn, runRule, type EngineRule, type RuleInvalidReason } from "@/lib/v2/rules"
import { appendAudit } from "@/lib/v2/store"
import { heldState } from "@/lib/v2/approvals"
import { defaultConfig } from "@/lib/v2/config"
import { isConfigured } from "@/lib/v2/population"
import { ratingKind, ratingOptions } from "@/lib/v2/student"
import type { EvalModel, Evaluation, EvaluatorRole, LevelMinimum, Person, PublishedRuleSnapshot, QuestionRule, RuleChangeRecord, ScoredRule, Skill, SkillConfig, V2State } from "@/lib/v2/types"
import { inSentence, skillNoun } from "./terms"
import { checkOffAllowedFor, checkOffLevelIndex, checkOffOffReason, checkOffScore, tickRecordsLine } from "./checkoff-rules"

/** The Configure setting's name, under Evaluator in "Who does what", in Check and save, and in "What you changed". */
export const CHECKOFF_LABEL = "Group check-off"

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
  /** The options of a choice list, two or more [REQ SC-13]. Absent for other types. */
  choices?: string[]
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
  /**
   * Group check-off (PROTO 2026-10-28): `enabled` null means the model's default (Met or Unmet and levels on, questions and scores
   * off). `levelIndex` and `score` are what one tick records for levels and scores; null means the default (highest level, the
   * rule's own threshold). Optional so drafts saved before it existed still load.
   */
  checkOff?: { enabled: boolean | null; levelIndex: number | null; score: number | null }
  /**
   * Carried from the published v2 rule. Not in REQ. Removing them is an edit like any other. Exception: for the levels model,
   * `minLevelIndex` is the admin's own choice on the Levels step, "which levels count toward achievement" (Romit 2026-11-02): the
   * lowest level that counts, every level above it counting too. It is the engine's `minLevelIndex`, so this one field is the single
   * source for the step, the rule sentence, the summaries and the student screens. Read it through `countsFromIndex`.
   */
  carried:{ window: number | null; minLevelIndex: number | null; simulationCapPercent: number | null; simulationExcluded: boolean }
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
 * Model names in the client's own words [CALL 10-26 A.2]: approved or not approved, questions, independence
 * level. Scored stays fourth; REQ 4.1 and SC-07 require it, so it carries no Proposed marker. The engine ids are unchanged.
 * The v2 labels (lib/v2/config.ts) are not edited here; the library column still reads them.
 */
export const LAB_MODEL_LABEL: Record<EvalModel, string> = {
  binary: "Approved or not approved",
  question: "Questions",
  demonstration: "Independence level",
  scored: "Score on a scale",
}
export { LAB_MODEL_LABEL as MODEL_LABEL }

/** The order the Model step offers them. Nothing is preselected [REQ SC-02]. */
export const LAB_MODELS: EvalModel[] = ["binary", "question", "demonstration", "scored"]
/** Models shown with a Proposed marker in the lab (none today). */
// Empty: REQ 4.1 and SC-07 require the scored model, so it is not a proposal (comprehension audit 2026-10-27).
export const PROPOSED_MODELS: ReadonlySet<EvalModel> = new Set<EvalModel>()

/** One line per model with an example in the client's words. */
export const MODEL_HELP: Record<EvalModel, string> = {
  binary: "The evaluator gives one result per evaluation.",
  question: "The evaluator answers each question. The result comes from the answers.",
  demonstration: "The evaluator picks the level the student worked at.",
  scored: "The evaluator scores each question on a scale.",
}

/**
 * Two preset label sets the program can start from and then edit [CALL 10-26 B.3]. Levels are stored lowest first, the order the
 * Levels editor uses. A preset only fills labels; it never chooses which outcome qualifies or how many are needed.
 */
export type LabelPresetId = "metnotmet" | "approval" | "independence" | "performance" | "aacn"
/** Named starting sets (audit fix 2026-11-02): labels only; never which level counts or how many [REQ SC-02]. Lowest first. */
export const LABEL_PRESETS: Record<LabelPresetId, { label: string; outcomes?: [string, string]; levels?: string[] }> = {
  metnotmet: { label: "Met / Unmet", outcomes: ["Met", "Unmet"] },
  approval: { label: "Approved / Not approved", outcomes: ["Approved", "Not approved"] },
  independence: { label: "Independence", levels: ["Observed", "With assistance", "Independent"] },
  performance: { label: "Performance", levels: ["Observed", "Assisted", "Performed"] },
  aacn: { label: "AACN developmental", levels: ["Underdeveloped", "Developing", "Developed"] },
}
export const isLabelPreset = (v: string | null | undefined): v is LabelPresetId => !!v && v in LABEL_PRESETS

/** Fill the labels from a preset. Binary keeps its qualifying choice; renamed levels keep their minimums only while they exist. */
export function applyPreset(rule: LabRule, id: LabelPresetId): LabRule {
  const p = LABEL_PRESETS[id]
  if (p.outcomes && rule.model === "binary") return { ...rule, outcomeLabels: [...p.outcomes] as [string, string] }
  if (p.levels && rule.model === "demonstration") {
    const levels = [...p.levels]
    const co = rule.checkOff
    const checkOff = co && co.levelIndex !== null && co.levelIndex >= levels.length ? { ...co, levelIndex: null } : co
    // The level that counts follows its name into the preset; if the preset has no level of that name, the choice is cleared and
    // asked again (a preset never picks it).
    const from = rule.carried.minLevelIndex
    const name = from === null ? "" : norm(rule.levels[from] ?? "")
    const moved = name ? levels.findIndex((l) => norm(l) === name) : -1
    const carried = { ...rule.carried, minLevelIndex: moved >= 0 ? moved : null }
    return { ...rule, levels, levelMinimums: rule.levelMinimums.filter((m) => m.levelIndex < levels.length), checkOff, carried }
  }
  return rule
}

/**
 * What a starting set would overwrite, so the page can ask first; null when nothing the admin chose would be lost. Levels: any named level that differs. Labels: only labels the admin
 * changed, since the default pair and the starting sets are not theirs. Prism's own Met and Unmet stay prefilled [REQ 4.1].
 */
export function presetReplaces(rule: LabRule, id: LabelPresetId): { noun: "level" | "label"; was: string[]; next: string[]; clearsCounts: boolean } | null {
  const p = LABEL_PRESETS[id]
  const key = (xs: readonly string[]) => xs.map(norm).join("|")
  if (rule.model === "demonstration" && p.levels) {
    const was = rule.levels.map((l) => l.trim()).filter(Boolean)
    if (!was.length || key(was) === key(p.levels)) return null
    return { noun: "level", was, next: [...p.levels], clearsCounts: rule.carried.minLevelIndex !== null && applyPreset(rule, id).carried.minLevelIndex === null }
  }
  if (rule.model === "binary" && p.outcomes) {
    const was = rule.outcomeLabels.map((l) => l.trim()).filter(Boolean)
    const known = [["Met", "Unmet"], ...Object.values(LABEL_PRESETS).flatMap((x) => (x.outcomes ? [x.outcomes] : []))]
    if (!was.length || known.some((k) => key(k) === key(was))) return null
    return { noun: "label", was, next: [...p.outcomes], clearsCounts: false }
  }
  return null
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
    checkOff: { enabled: null, levelIndex: null, score: null },
    carried: { window: null, minLevelIndex: null, simulationCapPercent: null, simulationExcluded: false },
  }
}

/** The published v2 configuration as a lab rule, so the "before" state is exactly what students see today. */
export function fromV2(skill: Pick<Skill, "model" | "config">): LabRule {
  const c: SkillConfig | null = skill.config
  if (!c || !skill.model) return emptyRule()
  const a = c.achievement
  const labels: [string, string] = [c.outcomeLabels[0], !c.ownLabels && c.outcomeLabels[1] === "Not met" ? "Unmet" : c.outcomeLabels[1]]
  return {
    model: skill.model,
    outcomeLabels: labels,
    qualifyingLabel: c.qualifyingLabel === undefined ? 0 : c.qualifyingLabel,
    questions: [...c.questions],
    // A rule published from the lab is read back from the shared store; the seed has none (outcome decides, as before).
    questionRule: c.questionRule ? (JSON.parse(JSON.stringify(c.questionRule)) as QuestionRule) : null,
    // Saved settings are read back as saved [REQ SC-07, SC-13, SC-15]; the seed has none, so it reads as before.
    scaleMax: typeof c.scaleMax === "number" ? c.scaleMax : 5,
    scoredRule: c.scoredRule ? { ...c.scoredRule } : null,
    levels: skill.model === "demonstration" ? [...c.levels] : [],
    need: a.need,
    levelMinimums: (c.levelMinimums ?? []).map((m) => ({ ...m })),
    distinctEvaluators: a.distinctEvaluators,
    settingMinimums: a.settingMinimums.map((m) => ({ ...m })),
    studentFields: c.studentFields ? c.studentFields.map((f) => ({ ...f, ...(f.choices ? { choices: [...f.choices] } : {}) })) : [{ label: "Date performed", type: "date", mandatory: true }],
    feedbackRequired: !!c.feedbackRequired,
    // The seed has no flag: read it the way the student screens do (lib/lab/student2.ts selfEvalEnabled), so saving an unchanged
    // rule changes nothing for students.
    selfEvaluation: typeof c.selfEvaluation === "boolean" ? c.selfEvaluation : ratingKind(skill as Skill) === "levels" && ratingOptions(skill as Skill).length > 0,
    approvalRequired: !!c.approvalRequired,
    evaluatorRoles: [...c.evaluatorRoles],
    checkOff: { enabled: typeof c.checkOff?.enabled === "boolean" ? c.checkOff.enabled : null, levelIndex: c.checkOff?.levelIndex ?? null, score: c.checkOff?.score ?? null },
    carried: {
      window: a.kind === "last-n" && a.window ? a.window : null,
      // A published levels rule with no minimum let every level count; read that back as the explicit choice it already was
      // (the lowest level), so the Levels step shows it rather than asking again. Same engine result.
      minLevelIndex: a.minLevelIndex === null && skill.model === "demonstration" && c.levels.length > 0 ? 0 : a.minLevelIndex,
      simulationCapPercent: c.simulation.allowed && c.simulation.mode === "cap" ? c.simulation.maxSharePercent : null,
      simulationExcluded: !c.simulation.allowed,
    },
  }
}

/**
 * Removing a question takes it out of every rule that named it and moves later references down one, so a "must be Yes" pick
 * never slides onto a different question [REQ AE-07]. An "at least N" rule is capped at the new count.
 */
export function removeQuestion(rule: LabRule, index: number): LabRule {
  const questions = rule.questions.filter((_, i) => i !== index)
  let questionRule = rule.questionRule
  if (questionRule?.kind === "subset") questionRule = { kind: "subset", indices: questionRule.indices.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i)) }
  else if (questionRule?.kind === "atLeast" && questionRule.n > questions.length) questionRule = { kind: "atLeast", n: Math.max(1, questions.length) }
  return { ...rule, questions, questionRule }
}

/**
 * Named question numbers for a sentence, with runs of three or more as a range, so a 60 question subset reads
 * "1 to 60" rather than sixty numbers [REQ SC-06]: [0,1,2,4,6,7,8] gives ["1 to 3", "5", "7 to 9"].
 */
export function questionNumbers(indices: readonly number[]): string[] {
  const sorted = [...new Set(indices)].sort((a, b) => a - b)
  const out: string[] = []
  for (let i = 0; i < sorted.length; ) {
    let j = i
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++
    if (j - i >= 2) out.push(`${sorted[i] + 1} to ${sorted[j] + 1}`)
    else for (let k = i; k <= j; k++) out.push(String(sorted[k] + 1))
    i = j + 1
  }
  return out
}

/**
 * A pasted list of questions, one per line, for a large question set [REQ SC-04, SC-06]. Leading numbering and bullets
 * ("1.", "2)", "-", "•", "a.") are dropped, blank lines are skipped, and surrounding spaces are trimmed.
 */
export function parseQuestionLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(?:[-*•●]|\(?\d{1,3}[.)]|\(?[a-zA-Z][.)])\s+/, "").trim())
    .filter(Boolean)
}

/** Pasted lines that are new: a repeat, of another pasted line or of a question already written, is left out, ignoring case. */
export function newQuestionLines(lines: readonly string[], existing: readonly string[]): string[] {
  const seen = new Set(existing.map((q) => q.trim().toLowerCase()))
  return lines.filter((l) => {
    const k = l.trim().toLowerCase()
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

/**
 * Pasted questions go after the ones already written; empty rows are filled first. Existing questions keep their positions, so
 * nothing in a rule that names them moves [REQ AE-07].
 */
export function appendQuestions(rule: LabRule, lines: readonly string[]): LabRule {
  const kept = [...rule.questions]
  // Trailing empty rows are replaced by pasted lines; an empty row in the middle keeps its place.
  while (kept.length && !kept[kept.length - 1].trim()) kept.pop()
  return { ...rule, questions: [...kept, ...lines] }
}

/**
 * Ticks (or clears) questions from..to (1-based, inclusive) in a "named questions" rule, for a 50 to 100 question set
 * [REQ SC-05, SC-06]. Out-of-range ends are clamped; an empty or reversed range changes nothing.
 */
export function setSubsetRange(rule: LabRule, from: number, to: number, on: boolean): LabRule {
  const r = rule.questionRule
  if (r?.kind !== "subset") return rule
  const m = rule.questions.length
  const a = Math.max(1, Math.floor(from))
  const b = Math.min(m, Math.floor(to))
  if (!Number.isFinite(a) || !Number.isFinite(b) || a > b) return rule
  const set = new Set(r.indices)
  for (let i = a - 1; i <= b - 1; i++) (on ? set.add(i) : set.delete(i))
  return { ...rule, questionRule: { kind: "subset", indices: [...set].sort((x, y) => x - y) } }
}

/**
 * Removing a level drops the minimums that pointed at it and moves later ones down one, so "at least 2 at Independent" never
 * becomes "at least 2 at" whatever level slid into its place [REQ AE-07].
 */
export function removeLevel(rule: LabRule, index: number): LabRule {
  const levels = rule.levels.filter((_, i) => i !== index)
  const levelMinimums = rule.levelMinimums.filter((m) => m.levelIndex !== index).map((m) => (m.levelIndex > index ? { ...m, levelIndex: m.levelIndex - 1 } : m))
  const shift = (x: number | null | undefined): number | null => (x === null || x === undefined || x === index ? null : x > index ? x - 1 : x)
  // The levels above the one removed still count, so the next one up takes its place. Only removing the last level that counted leaves nothing chosen.
  const from = rule.carried.minLevelIndex
  const minLevelIndex = from === index ? (index < levels.length ? index : null) : shift(from)
  // What one tick records names a level too: it follows its level, or falls back to the default (highest) when that level goes.
  const checkOff = rule.checkOff ? { ...rule.checkOff, levelIndex: shift(rule.checkOff.levelIndex) } : rule.checkOff
  return { ...rule, levels, levelMinimums, carried: { ...rule.carried, minLevelIndex }, checkOff }
}

/**
 * Where "counts from" sits after a move (D-L74, D-L95). Each level keeps its Counts box. The boxes are one line across the list, so that holds unless the move crosses the line:
 * then the level the admin moved keeps its box and the level it passed takes the change, unless that would clear every box (never, D-L95), when the moved level counts too [INFER].
 */
function countsFromAfterMove(from: number | null, moved: number, to: number, count: number): number | null {
  if (from === null) return null
  const low = Math.min(moved, to)
  const high = Math.max(moved, to)
  if (low >= from || high < from) return from
  if (moved === high) return low
  return high + 1 < count ? high + 1 : low
}

/** The one level whose Counts box a move changed, for the row to say so. Null when every level kept its box. */
export function levelMoveChange(before: Pick<LabRule, "model" | "carried">, after: Pick<LabRule, "model" | "carried">, moved: number, to: number): { index: number; counts: boolean } | null {
  if (levelTicked(before, moved) !== levelTicked(after, to)) return { index: to, counts: levelTicked(after, to) }
  if (levelTicked(before, to) !== levelTicked(after, moved)) return { index: moved, counts: levelTicked(after, moved) }
  return null
}

/** Swapping two levels or two questions carries every rule reference with the item it names [REQ AE-07]. `i` is the one the admin moved. */
export function swapItems(rule: LabRule, kind: "levels" | "questions", i: number, j: number): LabRule {
  const list = [...rule[kind]]
  if (i < 0 || j < 0 || i >= list.length || j >= list.length) return rule
  ;[list[i], list[j]] = [list[j]!, list[i]!]
  const map = (x: number) => (x === i ? j : x === j ? i : x)
  if (kind === "questions") {
    const qr = rule.questionRule
    return { ...rule, questions: list, questionRule: qr?.kind === "subset" ? { kind: "subset", indices: qr.indices.map(map) } : qr }
  }
  const co = rule.checkOff
  const checkOff = co ? { ...co, levelIndex: co.levelIndex === null || co.levelIndex === undefined ? null : map(co.levelIndex) } : co
  return { ...rule, levels: list, levelMinimums: rule.levelMinimums.map((m) => ({ ...m, levelIndex: map(m.levelIndex) })), carried: { ...rule.carried, minLevelIndex: countsFromAfterMove(rule.carried.minLevelIndex, i, j, list.length) }, checkOff }
}

/** Choosing or changing the model rebuilds what depends on it and keeps the rest [REQ SC-09, AE-07]. */
export function withModel(rule: LabRule, model: EvalModel): LabRule {
  if (rule.model === model) return rule
  // Nothing the new model asks arrives chosen [REQ SC-02, SC-03, SC-07]: which label qualifies and the scale top start empty.
  const next: LabRule = { ...rule, model, levelMinimums: [], questionRule: null, scoredRule: null, qualifyingLabel: null, scaleMax: model === "scored" ? Number.NaN : rule.scaleMax }
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

/** The questions written so far: a blank row is not a question yet. */
const questionCount = (rule: Pick<LabRule, "questions">): number => rule.questions.filter((q) => q.trim()).length

function qualifierOf(rule: LabRule): string {
  switch (rule.model) {
    case "binary": {
      const l = rule.qualifyingLabel === null ? "" : rule.outcomeLabels[rule.qualifyingLabel]?.trim()
      return l ? `rated ${inSentence(l)}` : ""
    }
    case "question": {
      const r = rule.questionRule
      const m = questionCount(rule)
      // No questions yet: nothing to count against. ruleSentence says so.
      if (!r || m === 0) return ""
      if (r.kind === "all") return m === 1 ? "with 1 question answered Yes" : `with all ${m} questions answered Yes`
      // A number that cannot be met says nothing rather than read as a rule; the row says what is wrong.
      if (r.kind === "atLeast") return isInt(r.n) && r.n >= 1 && r.n <= m ? `with at least ${r.n} of ${m} ${plural(m, "question", "questions")} answered Yes` : ""
      const picked = questionNumbers(r.indices)
      return picked.length ? `with ${plural(r.indices.length, "question", "questions")} ${joinAnd(picked)} answered Yes` : ""
    }
    case "scored": {
      const r = rule.scoredRule
      if (!r || questionCount(rule) === 0) return ""
      // Never "9 or more out of 5": a value off the scale says nothing rather than read as a rule; the row says what is wrong.
      const top = r.kind === "total" ? rule.scaleMax * Math.max(1, rule.questions.length) : rule.scaleMax
      if (!(typeof r.value === "number" && r.value >= 1 && r.value <= top)) return ""
      if (r.kind === "average") return `averaging ${r.value} or more out of ${rule.scaleMax}`
      if (r.kind === "minEach") return `scoring at least ${r.value} on every question`
      return `totalling ${r.value} or more`
    }
    case "demonstration":
      return countingLevelsPhrase(rule)
    default:
      return ""
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// Which levels count (levels model; Romit 2026-11-02, "ask the user to define which value counts towards achievement here
// itself"). One choice: the lowest level that counts, every level above it counting too (the engine's minLevelIndex, at or above).

/** The index of the lowest level that counts, or null until the admin chooses (never preset, never defaulted). */
const ORDINAL = ["", "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth"]
/**
 * A level named by where it sits, never by a number the list does not show (the Levels list has no numbers, 2026-11-11): "The top level",
 * "The lowest level", "The second level from the top". `i` counts from the lowest, as the rule stores levels.
 */
export function levelPlace(i: number, n: number): string {
  if (n <= 1 || i === n - 1) return "The top level"
  if (i === 0) return "The lowest level"
  const k = n - i
  return `The ${ORDINAL[k] ?? `${k}th`} level from the top`
}

export const countsFromIndex = (rule: Pick<LabRule, "model" | "carried">): number | null => (rule.model === "demonstration" ? rule.carried.minLevelIndex : null)

/** Set the lowest level that counts. */
export const withCountsFrom = (rule: LabRule, index: number | null): LabRule => ({ ...rule, carried: { ...rule.carried, minLevelIndex: index } })

/** Whether the checkbox for level i is ticked: that level is at or above the threshold. */
export function levelTicked(rule: Pick<LabRule, "model" | "carried">, i: number): boolean {
  const from = countsFromIndex(rule)
  return from !== null && i >= from
}

/** Tick a level (it and every level above count; the lowest level ticked means any level) or untick it (it and every level below stop; none left is null, not chosen). */
export const withLevelTicked = (rule: LabRule, i: number, ticked: boolean): LabRule =>
  withCountsFrom(rule, ticked ? i : i + 1 < rule.levels.length ? i + 1 : null)

/** The named levels that count, lowest first. Empty until chosen. */
export function countingLevels(rule: LabRule): string[] {
  const i = countsFromIndex(rule)
  if (i === null || i < 0 || i >= rule.levels.length) return []
  return rule.levels.slice(i).map((l) => l.trim()).filter(Boolean)
}

/**
 * The counting levels as a clause for the rule sentence: "at any level", "rated independent", "rated with assistance or independent",
 * "rated with assistance or above" (three or more). Labels are lowercase mid-sentence (inSentence). Empty until chosen.
 */
export function countingLevelsPhrase(rule: LabRule): string {
  const i = countsFromIndex(rule)
  const named = countingLevels(rule)
  if (i === null || named.length === 0) return ""
  if (i === 0) return "at any level"
  if (named.length === 1) return `rated ${inSentence(named[0]!)}`
  if (named.length === 2) return `rated ${inSentence(named[0]!)} or ${inSentence(named[1]!)}`
  return `rated ${inSentence(named[0]!)} or above`
}

/**
 * "Count from level i" as a label standing alone, so the level keeps its case. The same reading as the rule sentence (countingLevelsPhrase):
 * every level is "Any level" (reverses D-L51's "{Lowest} or above", see the ledger's D-L95), the top two name both.
 */
export function countsFromOption(levels: readonly string[], i: number): string {
  if (i === 0 && levels.length > 1) return "Any level"
  const name = levels[i]?.trim() || `Level ${i + 1}`
  if (i === levels.length - 1) return `${name} only`
  const top = levels[i + 1]?.trim() || `Level ${i + 2}`
  if (i === levels.length - 2) return `${name} or ${top}`
  return `${name} or above`
}

/** One summary line for Check and the setup summary: "Counts: With assistance or above", or that it is not chosen. */
export function countsLine(rule: LabRule): string {
  const i = countsFromIndex(rule)
  return i !== null && countingLevels(rule).length ? `Counts: ${countsFromOption(rule.levels, i)}` : "Which levels count is not chosen"
}

/** True once the program has said how many times. Until then the rule has no count, by design (no platform default). */
export const hasNeed = (rule: Pick<LabRule, "need">): boolean => isInt(rule.need) && rule.need > 0

export function ruleClauses(rule: LabRule): RuleClauses {
  const need = hasNeed(rule) ? rule.need : 1
  return {
    total: `${need} ${plural(need, "evaluation", "evaluations")}`,
    qualifier: qualifierOf(rule),
    levels: rule.levelMinimums.filter((m) => rule.levels[m.levelIndex]?.trim()).map((m) => `at least ${m.min} at ${inSentence(rule.levels[m.levelIndex].trim())} or above`),
    distinct: rule.distinctEvaluators >= 2 ? `from ${rule.distinctEvaluators} different evaluators` : "",
    settings: rule.settingMinimums.filter((m) => m.setting.trim() && isInt(m.min) && m.min > 0).map((m) => `${m.min} in ${inSentence(m.setting)}`),
  }
}

export type Audience = "admin" | "student"

/**
 * The rule in plain language, generated from the current rule at read time [REQ AE-02; strategy 02 section 7.4].
 * "Get 3 evaluations rated Met, at least 2 at Works alone or above, from 2 different evaluators, with 1 in Inpatient."
 */
/** The rule says what makes an evaluation count. Until it does, a count alone would read like a finished rule, so no sentence shows; the row says what is missing. */
export const ruleSaysWhatCounts = (rule: LabRule): boolean => qualifierOf(rule) !== ""

/** The rule as the panel and Evaluation settings word it: "Student needs 3 evaluations rated developed." [REQ SC-17, AE-03]. */
export const studentNeedsSentence = (rule: LabRule): string => ruleSentence(rule).replace(/^Get /, "Student needs ")

export function ruleSentence(rule: LabRule, audience: Audience = "admin"): string {
  if (!rule.model) return `No rule yet. Choose how this ${skillNoun()} is evaluated.`
  if (!hasNeed(rule)) return audience === "student" ? "The program has not set how many times yet." : "Not set yet."
  const c = ruleClauses(rule)
  const parts = [c.qualifier ? `${c.total} ${c.qualifier}` : c.total, ...c.levels]
  if ((rule.model === "question" || rule.model === "scored") && questionCount(rule) === 0) parts.push("no questions yet")
  if (c.distinct) parts.push(c.distinct)
  if (c.settings.length) parts.push(`with ${joinAnd(c.settings)}`)
  const body = parts.join(", ")
  return audience === "student" ? `You need ${body}.` : `Get ${body}.`
}

/** The one fact students must not have to guess [REQ SC-12]. Empty when no setting minimum exists. */
export function settingNote(rule: LabRule): string {
  const names = rule.settingMinimums.map((m) => m.setting).filter((s) => s.trim()).map(inSentence)
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
    out.push(max === 0 ? "Simulation evidence does not count here." : `Up to ${max} of ${need} may come from simulation.`)
  }
  // For the levels model the minimum level is the admin's own "which levels count" choice and is in the rule sentence already.
  if (rule.carried.minLevelIndex !== null && rule.model !== "demonstration") out.push("A minimum level from the earlier rule applies.")
  return out
}

/** What the evaluator is told after submitting [REQ EV-07]. */
export const afterSubmitLine = (rule: LabRule): string => (rule.approvalRequired ? "Your evaluation goes to the program for approval before it counts." : "Your evaluation counts as soon as you submit.")

// ---------------------------------------------------------------------------------------------------------------------
// "What this means" (Romit 2026-10-27, Configure whitespace): the current choices in one or two plain sentences, plus one tiny
// worked example. The example's verdict comes from the engine (qualifiesOn) run on a made-up evaluation, so the words can never
// disagree with the rule. Pure, so tests can check every model.

export interface Meaning {
  lines: string[]
  /** "Example: ..." sentence, or undefined when the choices so far give nothing to show. */
  example?: string
  /** The engine's verdict on the example evaluation (undefined when the example is not about counting). */
  counts?: boolean
}

const fmtNum = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1))

/** One evaluation in the shape the engine reads (outcome, latest version's answers or scores). */
function fakeEvaluation(x: { outcome?: "met" | "unmet"; answers?: Array<"yes" | "no">; scores?: number[] }): Evaluation {
  return { outcome: x.outcome ?? "unmet", versions: [{ detail: { answers: x.answers, scores: x.scores } }] } as unknown as Evaluation
}

/** Whether one completed evaluation at level `levelIndex` is used by the rule: the engine's own run, not a copy of its test. */
function levelCounts(rule: LabRule, levelIndex: number): boolean {
  const e = { ...fakeEvaluation({ outcome: "met" }), id: "example", status: "counted", date: "2026-01-01", levelIndex, evaluatorId: "example", setting: "clinical" } as unknown as Evaluation
  const run = runRule({ ...engineRuleOfLab(rule), need: 1, window: null, simulationExcluded: false, simulationCapPercent: null, distinctEvaluators: 1, settingMinimums: [], levelMinimums: [] }, [e])
  return run.valid ? run.used.length === 1 : false
}

/** What the evaluator records, said plainly, with a sample of it. */
export function criteriaMeaning(rule: LabRule): Meaning {
  const m = rule.model
  if (!m) return { lines: [`Choose how this ${skillNoun()} is judged first.`] }
  if (m === "binary") {
    const [a, b] = rule.outcomeLabels.map((l) => l.trim())
    const q = rule.qualifyingLabel === null ? "" : rule.outcomeLabels[rule.qualifyingLabel].trim()
    return { lines: [`The evaluator picks one outcome: ${a ? inSentence(a) : "first"} or ${b ? inSentence(b) : "second"}.`, ...(q ? [`Only ${inSentence(q)} can count.`] : [])] }
  }
  if (m === "demonstration") {
    const named = rule.levels.map((l) => l.trim()).filter(Boolean)
    if (named.length === 0) return { lines: ["The evaluator picks one level per evaluation."] }
    const lines = [`The evaluator picks one of ${named.length} ${plural(named.length, "level", "levels")}, ${inSentence(named[0]!)} lowest.`]
    const from = countsFromIndex(rule)
    const counting = countingLevels(rule)
    if (from === null || counting.length === 0) return { lines: [...lines, "Choose at least one level."] }
    lines.push(
      from === 0
        ? "An evaluation at any level counts toward achievement."
        : counting.length === 1
          ? `Only an evaluation at ${inSentence(counting[0]!)} counts toward achievement.`
          : `An evaluation at ${inSentence(counting[0]!)} or above counts toward achievement.`,
    )
    // The worked example takes the level just below the line (or the lowest when every level counts); the engine gives the verdict.
    const exIndex = from === 0 ? 0 : from - 1
    const exName = rule.levels[exIndex]?.trim()
    if (!exName) return { lines }
    const counts = levelCounts(rule, exIndex)
    return { lines, example: `Example: the evaluator records ${inSentence(exName)}: ${counts ? "counts" : "does not count"}.`, counts }
  }
  const n = rule.questions.length
  if (m === "question") {
    const answers = Array.from({ length: Math.min(n, 3) }, (_, i) => (i === 2 ? "No" : "Yes"))
    return { lines: [`The evaluator answers Yes or No to each of ${n} ${plural(n, "question", "questions")}.`], example: n ? `Example: ${joinAnd(answers)}.` : undefined }
  }
  const S = isInt(rule.scaleMax) && rule.scaleMax >= 2 ? rule.scaleMax : null
  if (!S) return { lines: [`The evaluator scores each of ${n} ${plural(n, "question", "questions")}.`] }
  const sample = [Math.max(1, S - 1), S, Math.max(1, S - 2)].slice(0, Math.max(1, Math.min(n, 3)))
  return { lines: [`The evaluator scores each of ${n} ${plural(n, "question", "questions")} from 1 to ${S}.`], example: n ? `Example: ${joinAnd(sample.map(String))}.` : undefined }
}

/** The rule in plain words plus one worked example whose verdict the engine computes. */
export function ruleMeaning(rule: LabRule): Meaning {
  const m = rule.model
  if (!m) return { lines: [`Choose how this ${skillNoun()} is judged first.`] }
  const lines: string[] = []
  // Levels: the count names the levels chosen on the Levels step ("3 evaluations rated independent"), from the same field.
  const levelsPhrase = m === "demonstration" ? countingLevelsPhrase(rule) : ""
  if (!hasNeed(rule)) lines.push("Nothing counts until you set how many evaluations are needed.")
  else if (levelsPhrase) lines.push(`The student needs ${rule.need} ${plural(rule.need, "evaluation", "evaluations")} ${levelsPhrase}.`)
  else lines.push(`The student needs ${rule.need} ${plural(rule.need, "evaluation", "evaluations")} that count.`)
  const c = ruleClauses(rule)
  const extra = [...c.levels, c.distinct ? c.distinct.replace(/^from /, "") : "", ...c.settings].filter(Boolean)

  let when = ""
  let example: string | undefined
  let counts: boolean | undefined
  const verdict = (e: Evaluation) => engineQualifiesOn({ model: m, questionRule: rule.questionRule, scoredRule: rule.scoredRule }, e)
  const word = (ok: boolean) => (ok ? "counts" : "does not count")

  if (m === "binary") {
    const q = rule.qualifyingLabel === null ? "" : rule.outcomeLabels[rule.qualifyingLabel].trim()
    const other = rule.qualifyingLabel === null ? "" : rule.outcomeLabels[rule.qualifyingLabel === 0 ? 1 : 0].trim()
    if (q) {
      when = `One counts when it is rated ${inSentence(q)}.`
      if (other) {
        counts = verdict(fakeEvaluation({ outcome: "unmet" }))
        example = `Example: rated ${inSentence(other)}: ${word(counts)}.`
      }
    }
  } else if (m === "question") {
    const r = rule.questionRule
    const n = rule.questions.length
    if (r && n > 0) {
      if (r.kind === "all") {
        when = "One counts when every question is answered Yes."
        const answers = Array.from({ length: n }, (_, i): "yes" | "no" => (n > 1 && i === n - 1 ? "no" : "yes"))
        counts = verdict(fakeEvaluation({ answers }))
        const yes = answers.filter((a) => a === "yes").length
        example = n > 1 ? `Example: ${yes} of ${n} answered Yes: ${word(counts)}, question ${n} is No.` : `Example: answered Yes: ${word(counts)}.`
      } else if (r.kind === "atLeast" && isInt(r.n) && r.n >= 1) {
        when = `One counts when at least ${r.n} of ${n} questions are answered Yes.`
        const yes = Math.max(0, Math.min(n, r.n - 1))
        const answers = Array.from({ length: n }, (_, i): "yes" | "no" => (i < yes ? "yes" : "no"))
        counts = verdict(fakeEvaluation({ answers }))
        example = `Example: ${yes} of ${n} answered Yes: ${word(counts)}, ${r.n} needed.`
      } else if (r.kind === "subset" && r.indices.length > 0) {
        const named = [...r.indices].filter((i) => i < n).sort((a, b) => a - b)
        when = `One counts when ${plural(named.length, "question", "questions")} ${joinAnd(questionNumbers(named))} ${named.length === 1 ? "is" : "are"} answered Yes.`
        const answers = Array.from({ length: n }, (_, i): "yes" | "no" => (named.includes(i) ? "yes" : "no"))
        counts = verdict(fakeEvaluation({ answers }))
        example = named.length < n ? `Example: only the named ${plural(named.length, "question", "questions")} answered Yes: ${word(counts)}.` : `Example: every question answered Yes: ${word(counts)}.`
      }
    }
  } else if (m === "scored") {
    const r = rule.scoredRule
    const S = isInt(rule.scaleMax) && rule.scaleMax >= 2 ? rule.scaleMax : null
    const n = Math.max(1, rule.questions.length)
    if (r && S && isInt(r.value) && r.value >= 1) {
      const v = r.value
      const k = Math.min(n, 3)
      const clamp = (x: number) => Math.max(1, Math.min(S, x))
      let scores: number[]
      if (r.kind === "minEach") {
        when = `One counts when every question scores at least ${v} out of ${S}.`
        scores = k >= 3 ? [clamp(v + 1), S, clamp(v - 1)] : k === 2 ? [S, clamp(v - 1)] : [clamp(v - 1)]
      } else if (r.kind === "average") {
        when = `One counts when the average score is at least ${v} out of ${S}.`
        scores = k >= 3 ? [clamp(v), clamp(v), clamp(v - 1)] : k === 2 ? [clamp(v), clamp(v - 1)] : [clamp(v - 1)]
      } else {
        when = `One counts when the scores add up to at least ${v}.`
        // Spread v - 1 across k questions (each at most S): a near miss.
        const target = Math.max(k, v - 1)
        scores = Array.from({ length: k }, (_, i) => Math.floor(target / k) + (i < target % k ? 1 : 0)).map(clamp)
      }
      counts = verdict(fakeEvaluation({ scores }))
      const sum = scores.reduce((a, b) => a + b, 0)
      const why =
        r.kind === "minEach"
          ? counts ? `every question is ${v} or above` : `${scores.filter((x) => x < v).length === 1 ? "one question is" : `${scores.filter((x) => x < v).length} questions are`} below ${v}`
          : r.kind === "average"
            ? `the average is ${fmtNum(sum / scores.length)}`
            : `the total is ${sum}`
      example = `Example: scores ${joinAnd(scores.map(String))} on ${scores.length} ${plural(scores.length, "question", "questions")}: ${word(counts)}, ${why}.`
    }
  } else if (m === "demonstration") {
    // The level is recorded with each evaluation; a level minimum (a condition) says how many must be at a level or above.
    const lm = rule.levelMinimums.find((x) => rule.levels[x.levelIndex]?.trim() && isInt(x.min) && x.min >= 1)
    if (lm && hasNeed(rule)) {
      const level = rule.levels[lm.levelIndex].trim()
      example = `Example: ${rule.need} ${plural(rule.need, "evaluation counts", "evaluations count")} but ${lm.min === 1 ? "none is" : `only ${lm.min - 1} ${lm.min - 1 === 1 ? "is" : "are"}`} at ${inSentence(level)} or above: not achieved yet.`
    }
  }
  if (when) lines.push(when)
  if (extra.length) lines.push(`It also needs ${joinAnd(extra)}.`)
  return { lines, example, counts }
}

// ---------------------------------------------------------------------------------------------------------------------
// Validation [REQ SC-02, SC-03, SC-06, SC-18]

/**
 * Four editing sections, then Check (docs/knowledge/design/skill-setup-journey/02 section 4, J4). Setting minimums live in the
 * rule (they are achievement criteria [REQ SC-11, AE-03]); signer roles, student fields, feedback, self-evaluation and approval
 * share "Who does what" (what an evaluation must carry [REQ SC-13..16]).
 */
export type SectionId = "model" | "outcomes" | "rule" | "signoff"

/** The two configuration dimensions, named the way the client says them [CALL 10-26 A.2, B.1]. */
/** The model step, in the client's words: "Model" is an internal word (UX critique 2026-10-26). The question stays "How is this skill evaluated?". */
/** One vocabulary on the program page and the per-skill page (Romit 2026-11-02, audit fix): four sections, same names, same order. */
export const MODEL_STEP_LABEL = "How skills are judged"
/** On Configure the skill (variant B): one skill, not the program's setting, so the two walkthrough stops do not read as the same page (D-L65). */
export const MODEL_STEP_LABEL_ONE = "How this skill is judged"
export const CRITERIA_LABEL = "What counts as achieved"
export const HOW_MANY_LABEL = "How many evaluations"
export const WHO_DOES_WHAT_LABEL = "Who does what"
export type ConfigureStepId = SectionId | "check"

export const SECTIONS: Array<{ id: SectionId; label: string }> = [
  { id: "model", label: MODEL_STEP_LABEL },
  { id: "outcomes", label: CRITERIA_LABEL },
  { id: "rule", label: HOW_MANY_LABEL },
  { id: "signoff", label: WHO_DOES_WHAT_LABEL },
]

/** The five wizard steps, three words at most. Section ids stay the engine's; only labels follow the client. */
export const CONFIGURE_STEPS: Array<{ id: ConfigureStepId; label: string }> = [...SECTIONS, { id: "check", label: "Check and save" }]

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

/**
 * The visible heading of each step: the question the admin answers there, with at most one short line under it (Romit
 * 2026-10-27, "work on the content hierarchy so the steps are cleaner"). The step label stays short in the stepper; the heading
 * never repeats it. On Check the fix list says what is left, so the lead shows only when nothing is.
 */
export function configureStepHead(id: ConfigureStepId, model: EvalModel | null, ready = true): { title: string; lead?: string } {
  // One vocabulary (2026-11-02): the step heading is the section's name, on every page; no lead lines (D-L34, D-L36).
  void model
  switch (id) {
    case "model":
      return { title: MODEL_STEP_LABEL }
    case "outcomes":
      return { title: CRITERIA_LABEL }
    case "rule":
      return { title: HOW_MANY_LABEL }
    case "signoff":
      return { title: WHO_DOES_WHAT_LABEL }
    case "check":
      return ready ? { title: "Ready to save?" } : { title: "What is left before saving?" }
  }
}

/** The value chosen so far, shown under the step's label in the rail (3 words or so). Undefined while nothing is chosen. */
export function configureStepValue(id: SectionId, rule: LabRule): string | undefined {
  const m = rule.model
  if (id === "model") return m ? LAB_MODEL_LABEL[m] : undefined
  if (!m) return undefined
  if (id === "outcomes") {
    if (m === "binary") return rule.qualifyingLabel === null ? undefined : `${rule.outcomeLabels[rule.qualifyingLabel].trim() || "Outcome"} counts`
    if (m === "demonstration") {
      const from = countsFromIndex(rule)
      if (from !== null && from < rule.levels.length && rule.levels[from]?.trim()) return countsFromOption(rule.levels, from)
      return rule.levels.length ? `${rule.levels.length} ${rule.levels.length === 1 ? "level" : "levels"}` : undefined
    }
    const n = rule.questions.filter((q) => q.trim()).length
    return n ? `${n} ${n === 1 ? "question" : "questions"}` : undefined
  }
  if (id === "rule") return Number.isFinite(rule.need) && rule.need >= 1 ? `${rule.need} needed` : undefined
  const r = rule.evaluatorRoles
  return r.length === 0 ? undefined : r.length === 1 ? ROLE_LABEL[r[0]] : `${r.length} roles`
}

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

/** Score on a scale with no scale chosen. */
export const SCALE_MISSING_MESSAGE = "Choose a scale first."

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
    if (!r) add("outcomes", "cfg-qrule", "missing", "Choose what makes an evaluation qualify.")
    else if (r.kind === "atLeast" && (!isInt(r.n) || r.n < 1 || r.n > rule.questions.length)) add("outcomes", "cfg-qrule-n", "range", rule.questions.length === 1 ? "Enter 1. There is 1 question." : `Enter a number from 1 to ${rule.questions.length}.`)
    else if (r.kind === "subset" && r.indices.filter((i) => i < rule.questions.length).length === 0) add("outcomes", "cfg-qrule-subset", "empty", "Select at least one question that must be Yes.")
  }

  if (m === "scored") {
    // No scale yet: the one problem is the scale, focused on its select; a value is never checked against a missing top ("1 to NaN", 2026-11-11).
    const noScale = !isInt(rule.scaleMax)
    if (noScale) add("outcomes", "cfg-scale", "missing", SCALE_MISSING_MESSAGE)
    else if (rule.scaleMax < 2 || rule.scaleMax > 10) add("outcomes", "cfg-scale", "range", "Enter a scale top from 2 to 10.")
    const r = rule.scoredRule
    if (!r) add("outcomes", "cfg-srule", "missing", "Choose how a score qualifies.")
    else if (!noScale) {
      const max = r.kind === "total" ? rule.scaleMax * Math.max(1, rule.questions.length) : rule.scaleMax
      if (!(typeof r.value === "number" && r.value >= 1 && r.value <= max)) add("outcomes", "cfg-srule-value", "range", `Enter a value from 1 to ${max}.`)
    }
  }

  if (m === "demonstration") {
    if (rule.levels.length < 2) add("outcomes", "cfg-add-level", "few", "Add at least two levels.")
    const dup = dupIndexes(rule.levels)
    rule.levels.forEach((l, i) => {
      if (!l.trim()) add("outcomes", `cfg-level-${i}`, "blank", `${levelPlace(i, rule.levels.length)} has no name.`)
      else if (dup.has(i)) add("outcomes", `cfg-level-${i}`, "dup", `${levelPlace(i, rule.levels.length)} repeats another level.`)
    })
    // Which levels count is the program's choice, never defaulted [REQ SC-02 spirit; Romit 2026-11-02].
    const from = rule.carried.minLevelIndex
    if (rule.levels.length >= 2) {
      if (from === null) add("outcomes", "cfg-counts-from", "missing", "Choose at least one level.")
      else if (from < 0 || from >= rule.levels.length) add("outcomes", "cfg-counts-from", "range", "That level was removed. Choose at least one level.")
    }
  }

  if (!isInt(rule.need) || rule.need < 1) add("rule", "cfg-need", "need", NEED_UNSET_MESSAGE)
  rule.levelMinimums.forEach((lm, i) => {
    if (lm.levelIndex < 0 || lm.levelIndex >= rule.levels.length || !rule.levels[lm.levelIndex]?.trim()) add("rule", `cfg-lmin-level-${i}`, "level", "Choose a level for this minimum.")
    if (!isInt(lm.min) || lm.min < 1) add("rule", `cfg-lmin-${i}`, "min", "Enter a level minimum of 1 or more.")
    else if (hasNeed(rule) && lm.min > rule.need) add("rule", `cfg-lmin-${i}`, "gt", `${lm.min} at a level is more than the ${rule.need} needed in total.`)
  })
  if (!isInt(rule.distinctEvaluators) || rule.distinctEvaluators < 1) add("rule", "cfg-distinct", "min", "Enter 1 or more evaluators.")
  else if (hasNeed(rule) && rule.distinctEvaluators > rule.need) add("rule", "cfg-distinct", "gt", `${rule.distinctEvaluators} different evaluators cannot sign ${rule.need} ${plural(rule.need, "evaluation", "evaluations")}.`)

  const dupSet = dupIndexes(rule.settingMinimums.map((x) => x.setting))
  rule.settingMinimums.forEach((s, i) => {
    if (!s.setting.trim()) add("rule", `cfg-setting-${i}`, "blank", `Choose a clinical setting for row ${i + 1}.`)
    else if (dupSet.has(i)) add("rule", `cfg-setting-${i}`, "dup", `${s.setting} is listed twice.`)
    if (!isInt(s.min) || s.min < 1) add("rule", `cfg-setting-min-${i}`, "min", `Enter a minimum of 1 or more for ${s.setting ? inSentence(s.setting) : `row ${i + 1}`}.`)
  })
  const settingsTotal = rule.settingMinimums.reduce((n, s) => n + (isInt(s.min) ? s.min : 0), 0)
  if (hasNeed(rule) && settingsTotal > rule.need) add("rule", "cfg-setting-min-0", "sum", `Setting minimums add up to ${settingsTotal}, more than the ${rule.need} needed.`)

  const fdup = dupIndexes(rule.studentFields.map((f) => f.label))
  rule.studentFields.forEach((f, i) => {
    if (!f.label.trim()) add("signoff", `cfg-field-${i}`, "blank", `Student field ${i + 1} has no label.`)
    else if (fdup.has(i)) add("signoff", `cfg-field-${i}`, "dup", `Student field ${i + 1} repeats another label.`)
    else if (f.type === "choice" && (f.choices ?? []).filter((x) => x.trim()).length < 2) add("signoff", `cfg-field-${i}`, "choices", `Give ${f.label.trim()} at least two choices.`)
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
    qualifyingLabel: rule.model === "binary" ? rule.qualifyingLabel : null,
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
  for (const s of r.settings) if (s.have < s.min) out.push(`${s.min - s.have} more in ${inSentence(s.setting)} (you have ${s.have} of ${s.min})`)
  for (const l of r.levels) if (l.have < l.min) out.push(`${l.min - l.have} more at ${inSentence(l.level)} or above`)
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
  for (const s of r.settings) if (s.have < s.min) out.push({ key: `setting:${s.setting}:${s.min - s.have}`, label: `${s.min - s.have} more in ${inSentence(s.setting)}` })
  for (const l of r.levels) if (l.have < l.min) out.push({ key: `level:${l.level}:${l.min - l.have}`, label: `${l.min - l.have} more at ${inSentence(l.level)} or above` })
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
/** One way only: a rule change re-applies to evidence held [REQ AE-02]. "Apply to new evidence only" is not offered (D-L78). */
export type PublishMode = "reapply"

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
  return JSON.stringify({ model, q: model === "binary" ? qualifyingLabel : null, questionRule, scoredRule, scaleMax: model === "scored" ? scaleMax : null, need, levelMinimums, distinctEvaluators, settingMinimums, carried })
}

/**
 * Re-run `after` over every evaluation already held for `skillId` and diff against `before`, per student. Pure; reads only
 * the evidence index. With mode "new-only" no current state changes (the new rule waits for new evidence).
 */
export function computeImpact(input: V2State, skillId: string, before: LabRule, after: LabRule, _mode: PublishMode | null = "reapply"): Impact {
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
  const live = true
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

/**
 * The students whose progress reads differently under `after` (D0 rule 9) [REQ AE-02]: the state word, or how many of their evaluations count. A model change can
 * turn "1 of 1" into "2 of 1" and leave the word Achieved alone, so `computeImpact(...).changed`, which compares words, is too narrow for "No student's progress
 * changes". A new Times needed alone moves neither unless it moves the word.
 */
export function progressMoves(input: V2State, skillId: string, before: LabRule, after: LabRule): Array<{ studentId: string; name: string }> {
  return progressChanges(input, skillId, before, after).map(({ studentId, name }) => ({ studentId, name }))
}

/** One student's move on one skill: the state word before and after, so a dialog can say which way progress goes (D-L146). */
export interface ProgressChange {
  studentId: string
  name: string
  from: RecordState
  to: RecordState
}

/** The same students as `progressMoves`, each with the state before and after. */
export function progressChanges(input: V2State, skillId: string, before: LabRule, after: LabRule): ProgressChange[] {
  const s = heldState(input)
  const read = (r: LabRule, evals: readonly Evaluation[]) => {
    const run = r.model ? evaluateRule(r, evals) : null
    return run && !isInvalidResult(run) ? { state: run.state as RecordState, have: run.have } : { state: "no-evidence" as RecordState, have: 0 }
  }
  const out: ProgressChange[] = []
  for (const p of studentsOf(s)) {
    const evals = evalsOfStudentSkill(s, p.id, skillId)
    if (!evals.length) continue
    const b = read(before, evals)
    const a = read(after, evals)
    if (b.state !== a.state || b.have !== a.have) out.push({ studentId: p.id, name: p.name, from: b.state, to: a.state })
  }
  return out
}

/**
 * The students a skill stops counting for when it goes Not configured [REQ AE-02, IM-09]: with no rule that can be applied, no held evidence qualifies, so whoever had qualifying
 * evidence falls to none. A student whose evidence already counted for nothing reads the same before and after, so is not named. `skillProgress` is the same fact on the student's page.
 */
export function progressLost(input: V2State, skillId: string, before: LabRule): Array<{ studentId: string; name: string; from: RecordState }> {
  const s = heldState(input)
  const out: Array<{ studentId: string; name: string; from: RecordState }> = []
  for (const p of studentsOf(s)) {
    const evals = evalsOfStudentSkill(s, p.id, skillId)
    if (!evals.length || !before.model) continue
    const run = evaluateRule(before, evals)
    if (!isInvalidResult(run) && run.have > 0) out.push({ studentId: p.id, name: p.name, from: run.state as RecordState })
  }
  return out
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
    r.model === "binary" ? r.outcomeLabels.join(" or ") : r.model === "demonstration" ? `${r.levels.filter((l) => l.trim()).join(", ")}. ${countsLine(r)}` : `${r.questions.length} ${plural(r.questions.length, "question", "questions")}`
  const push = (label: string, b: string, a: string) => {
    if (b !== a) out.push({ label, before: b, after: a })
  }
  const none = "Not set"
  push(MODEL_STEP_LABEL, before?.model ? LAB_MODEL_LABEL[before.model] : none, after.model ? LAB_MODEL_LABEL[after.model] : none)
  push(outcomesLabel(after.model), before?.model ? labels(before) : none, after.model ? labels(after) : none)
  if (engineKey(before ?? emptyRule()) !== engineKey(after)) push(HOW_MANY_LABEL,before?.model ? ruleSentence(before) : none, (before?.model && ruleDeltaLine(before, after)) || ruleSentence(after))
  push("Student adds", before ? fields(before) : none, fields(after))
  push("Self-evaluation first", onOff(!!before?.selfEvaluation), onOff(after.selfEvaluation))
  push("Who can sign off", before ? roles(before) : none, roles(after))
  push("Feedback required", onOff(!!before?.feedbackRequired), onOff(after.feedbackRequired))
  push("Approval before it counts", onOff(!!before?.approvalRequired), onOff(after.approvalRequired))
  // Compared on the choice (allowed, nominated level or score), so renaming an outcome label is not reported twice.
  const coKey = (r: LabRule) => `${ruleAllowsCheckOff(r)}|${r.model === "demonstration" ? r.checkOff?.levelIndex ?? "" : ""}|${r.model === "scored" ? ruleCheckOffScore(r) : ""}`
  if (!before?.model || !after.model || coKey(before) !== coKey(after)) push(CHECKOFF_LABEL, before?.model ? checkOffLine(before) : none, after.model ? checkOffLine(after) : none)
  return out
}

/** Bulk apply [REQ IM-14]: impact of copying one rule onto each selected skill, one row per skill. */
export function bulkImpact(s: V2State, skillIds: string[], rule: LabRule): Array<{ skillId: string; name: string; configured: boolean; changed: number; lostAchieved: number }> {
  return skillIds.map((id) => {
    const k = skillById(s, id)
    if (!k) return { skillId: id, name: id, configured: false, changed: 0, lostAchieved: 0 }
    const configured = isConfigured(k)
    // A skill that is not configured has nobody's status to change: nobody can be asked against it yet [REQ IM-09].
    const im = configured ? computeImpact(s, id, fromV2(k), rule) : null
    return { skillId: id, name: k.name, configured, changed: im?.changed.length ?? 0, lostAchieved: im?.lostAchieved ?? 0 }
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
  return s.skills.filter((k) => k.id !== skillId && isConfigured(k) && k.config && k.model).sort((a, b) => a.name.localeCompare(b.name))
}

// ---------------------------------------------------------------------------------------------------------------------
// Save configuration: write the rule to the shared store, where the v2 engine reads it [REQ SC-01, AE-02, SC-19; decisions D-X27, D-X31]

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
    ...(m === "binary" ? { ownLabels: true } : {}),
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
    scaleMax: m === "scored" ? rule.scaleMax : base.scaleMax,
    selfEvaluation: rule.selfEvaluation,
    checkOff: checkOffConfig(rule),
    studentFields: rule.studentFields.map((f) => ({ label: f.label.trim(), type: f.type, mandatory: f.mandatory, ...(f.type === "choice" ? { choices: (f.choices ?? []).map((x) => x.trim()).filter(Boolean) } : {}) })),
  }
}

/** The rule version snapshot kept on the store's rule history (V2State.ruleChanges). */
export function ruleSnapshot(rule: LabRule): PublishedRuleSnapshot {
  if (!rule.model) throw new Error("A rule with no model cannot be saved as a configuration.")
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

/**
 * The package, in the order the settings page shows them (D0 rule 4): changing any one on a skill makes it Edited. Not here, because they are
 * always per skill and never change the word (D0 rule 5, map D1a rows 2, 6, 10, 13, 14): times needed, level and setting minimums, questions,
 * the named subset of a question rule, different evaluators.
 */
export const PROGRAM_KEYS = [
  "model",
  "outcomeLabels",
  "qualifyingLabel",
  "levels",
  "scaleMax",
  "scoredRule",
  "questionRule",
  "studentFields",
  "selfEvaluation",
  "feedbackRequired",
  "approvalRequired",
  "evaluatorRoles",
  "checkOff",
] as const satisfies ReadonlyArray<keyof LabRule>

const sameJson = (a: unknown, b: unknown): boolean => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)

/** A question rule as far as the package goes: which questions are named is the skill's own [REQ SC-05, SC-06]. */
const packageValue = (rule: LabRule, key: (typeof PROGRAM_KEYS)[number]): unknown => (key === "questionRule" && rule.questionRule?.kind === "subset" ? { kind: "subset" } : rule[key])

/** Which parts of a skill's rule differ from the program settings (empty when it follows them). */
export function differsFromProgram(skill: LabRule | null, program: LabRule | null): string[] {
  if (!skill || !program) return []
  if (skill.model !== program.model) return ["model"]
  // Only what this model uses: a saved rule reads back without the rest (a level skill has no labels that count, say).
  const unused: Partial<Record<NonNullable<LabRule["model"]>, ReadonlyArray<keyof LabRule>>> = {
    binary: ["levels", "scaleMax", "scoredRule", "questionRule"],
    question: ["outcomeLabels", "qualifyingLabel", "levels", "scaleMax", "scoredRule"],
    scored: ["outcomeLabels", "qualifyingLabel", "levels", "questionRule"],
    demonstration: ["outcomeLabels", "qualifyingLabel", "scaleMax", "scoredRule", "questionRule"],
  }
  const skip = new Set<keyof LabRule>(skill.model ? unused[skill.model] ?? [] : [])
  const out: string[] = PROGRAM_KEYS.filter((k) => !skip.has(k) && !sameJson(packageValue(skill, k), packageValue(program, k)))
  if (skill.model === "demonstration" && skill.carried.minLevelIndex !== program.carried.minLevelIndex) out.push("minLevelIndex")
  return out
}

/** The program's saved rule in a state, or null before its first save. */
export function programRuleIn(s: V2State): LabRule | null {
  const p = s.programSettings
  if (!p || !p.rule || typeof p.rule !== "object") return null
  return { ...emptyRule(), ...(p.rule as LabRule) }
}

export type PublishWrite =
  | { ok: true; state: V2State; written: true; version: number }
  | { ok: true; state: V2State; written: false; reason: string }
  | { ok: false; error: string; issues: RuleIssue[] }

/**
 * "Save configuration": writes the lab rule to the shared v2 store as the skill's configuration plus a rule version
 * (V2State.ruleChanges), so skillProgress (and every figure built on it: student progress, dashboard, director, lists) reads it at
 * once and after reload. The skill becomes Configured (lib/v2/population.ts isConfigured) and can be mapped; any saved draft is
 * cleared. Refuses an invalid rule (validateRule; an unset frequency is one of the issues, never defaulted) [REQ SC-18]. Pure.
 * The v2 flags `configured` and `published` are both set because the engine still reads the pair; the UI never says "published".
 */
export function saveLabRule(s: V2State, skillId: string, rule: LabRule, opts: { at: string; byId: string; mode: PublishMode | null; /** Say what Configuration reads after this save: false for a save of Evaluation settings or Use default configuration, true when the edit panel has already decided. Left out, it is worked out from the package. */ edited?: boolean }): PublishWrite {
  const issues = validateRule(rule)
  if (issues.length) return { ok: false, error: issues[0]!.message, issues }
  const skill = skillById(s, skillId)
  if (!skill) return { ok: false, error: `This ${skillNoun()} is no longer in the library.`, issues: [] }
  const config = toSkillConfig(skill.config, rule)
  const previous = (s.ruleChanges ?? []).filter((r) => r.skillId === skillId)
  // The seed's first published rule is version 1; a skill with a rule and no history is on version 1.
  const current = previous.length ? Math.max(...previous.map((r) => r.version)) : skill.config ? 1 : 0
  const version = current + 1
  const record: RuleChangeRecord = { skillId, at: opts.at, byId: opts.byId, version, published: ruleSnapshot(rule) }
  // Edited (D0 rules 4, 7): a package that differs from the program's detaches the skill; it stays detached until Use default configuration.
  // Times needed, minimums and questions are the skill's own part and never change the word (D0 rule 5).
  const program = programRuleIn(s)
  const edited = opts.edited ?? (!!skill.edited || !program || differsFromProgram(rule, program).length > 0)
  const skills = s.skills.map((k): Skill => {
    if (k.id !== skillId) return k
    const { edited: _dropped, ...rest } = k
    return { ...rest, model: rule.model, configured: true, published: true, config, ...(edited ? { edited: true } : {}) }
  })
  const configDrafts = { ...(s.configDrafts ?? {}) }
  delete configDrafts[skillId]
  const next = appendAudit({ ...s, skills, configDrafts, ruleChanges: [...(s.ruleChanges ?? []), record] }, opts.byId, `Saved configuration, rule version ${version}`, skill.name, opts.at)
  return { ok: true, state: next, written: true, version }
}

/**
 * One configuration saved to several skills [REQ IM-14]: "Apply to other skills" and "Configure together". The rule is validated
 * once (an invalid rule writes nothing anywhere), then each target goes through saveLabRule, the same path as saving one skill, so
 * each gets its own rule version and audit line. `written` lists the skills that were saved; `skipped` names any that were not and why.
 */
export function saveLabRuleToMany(s: V2State, skillIds: string[], rule: LabRule, opts: { at: string; byId: string; mode: PublishMode | null }): { state: V2State; written: string[]; skipped: Array<{ skillId: string; reason: string }>; issues: RuleIssue[] } {
  const issues = validateRule(rule)
  if (issues.length) return { state: s, written: [], skipped: skillIds.map((skillId) => ({ skillId, reason: issues[0]!.message })), issues }
  const written: string[] = []
  const skipped: Array<{ skillId: string; reason: string }> = []
  let state = s
  for (const id of Array.from(new Set(skillIds))) {
    const r = saveLabRule(state, id, rule, opts)
    if (!r.ok) skipped.push({ skillId: id, reason: r.error })
    else if (!r.written) skipped.push({ skillId: id, reason: r.reason })
    else {
      state = r.state
      written.push(id)
    }
  }
  return { state, written, skipped, issues: [] }
}

/** Active skills that are still Not configured: the same count as the library's Not configured tab [REQ IM-10]. */
export const leftToConfigure = (s: V2State): number => s.skills.filter((k) => k.active !== false && !isConfigured(k)).length

/** Old name, kept for callers and tests written before decision D-X31. */
export const publishLabRule = saveLabRule

// ---------------------------------------------------------------------------------------------------------------------
// Save draft: a configuration saved part way [REQ SC-01 "configuration may be completed later", IM-10; decision D-X31]

/**
 * Keeps the rule and the step in the shared store (persisted with the rest of the state), without validating and without changing
 * the skill: it stays Not configured, or keeps the configuration it already has, until "Save configuration". A draft is not a
 * decision, so it is not audited (same as the v2 wizard's drafts).
 */
export function saveConfigDraft(s: V2State, skillId: string, rule: LabRule, step: string | null, at: string): V2State {
  return { ...s, configDrafts: { ...(s.configDrafts ?? {}), [skillId]: { rule: copyRule(rule), step, at } } }
}

export function configDraftOf(s: V2State, skillId: string): { rule: LabRule; step: string | null; at: string } | null {
  const d = s.configDrafts?.[skillId]
  if (!d || !d.rule || typeof d.rule !== "object") return null
  return { rule: { ...emptyRule(), ...(d.rule as LabRule) }, step: d.step, at: d.at }
}

export function discardConfigDraft(s: V2State, skillId: string): V2State {
  if (!s.configDrafts?.[skillId]) return s
  const configDrafts = { ...s.configDrafts }
  delete configDrafts[skillId]
  return { ...s, configDrafts }
}

// ---------------------------------------------------------------------------------------------------------------------
// Check: what you set up, grouped by step, each fact once [REQ SC-17, SC-19]

export interface SetupGroup {
  id: "model" | "criteria" | "rule" | "signers" | "student" | "before" | "checkoff"
  /** The step its Edit link opens. */
  step: SectionId
  label: string
  lines: string[]
}

/** The configuration as six short groups for the Check step and the receipt. Empty values say "Not set" or "None". */
export function setupSummary(rule: LabRule): SetupGroup[] {
  const m = rule.model
  const none = "Not set"
  const criteria = !m
    ? [none]
    : m === "binary"
      ? [
          `${rule.outcomeLabels[0] || "First outcome"} or ${rule.outcomeLabels[1] || "second outcome"}`,
          rule.qualifyingLabel === null ? "Qualifying outcome not chosen" : `${rule.outcomeLabels[rule.qualifyingLabel] || "Chosen outcome"} qualifies`,
        ]
      : m === "demonstration"
        ? [rule.levels.filter((l) => l.trim()).join(", ") || "No levels yet", countsLine(rule)]
        : [`${rule.questions.length} ${plural(rule.questions.length, "question", "questions")}${m === "scored" ? (isInt(rule.scaleMax) ? `, scored 1 to ${rule.scaleMax}` : ", scale not chosen") : ""}`]
  const fields = rule.studentFields.filter((f) => f.label.trim())
  const roles = rule.evaluatorRoles.map((r) => ROLE_LABEL[r])
  const onOff = (b: boolean) => (b ? "Yes" : "No")
  return [
    { id: "model", step: "model", label: MODEL_STEP_LABEL, lines: [m ? LAB_MODEL_LABEL[m] : none] },
    { id: "criteria", step: "outcomes", label: CRITERIA_LABEL, lines: criteria },
    { id: "rule", step: "rule", label: HOW_MANY_LABEL, lines: m ? [ruleSentence(rule), settingNote(rule), ...carriedNotes(rule)].filter(Boolean) : [none] },
    // Same order as the step's groups (2026-10-28): Student, Evaluator, Approval.
    { id: "student", step: "signoff", label: "What the student adds", lines: [fields.length ? fields.map((f) => `${f.label.trim()}${f.mandatory ? " (required)" : ""}`).join(", ") : "Nothing beyond the evidence"] },
    { id: "signers", step: "signoff", label: "Who signs", lines: [roles.length ? roles.join(", ") : "No role chosen"] },
    // Group check-off is the evaluator's: under Evaluator on the page, so here too (2026-11-04, D-L52).
    { id: "checkoff", step: "signoff", label: CHECKOFF_LABEL, lines: [m ? checkOffLine(rule) : none] },
    {
      id: "before",
      step: "signoff",
      label: "Before it counts",
      lines: [`Self-evaluation first: ${onOff(rule.selfEvaluation)}. Feedback required: ${onOff(rule.feedbackRequired)}. Approval: ${onOff(rule.approvalRequired)}.`],
    },
  ]
}

/** Decisions still open on Check: every rule problem. */
export function openDecisions(issues: RuleIssue[]): number {
  return issues.length
}

/** The Save button's disabled reason on Check (10 words or fewer), or undefined when it can save. */
export function saveBlockedReason(issues: RuleIssue[]): string | undefined {
  if (issues.length > 0) return `Fix ${issues.length} ${plural(issues.length, "thing", "things")} first.`
  return undefined
}

/** One label and value on Check; `missing` marks a value still to choose, so the row reads as a gap, not as an answer. */
export interface CheckRow {
  label: string
  value: string
  missing?: boolean
  /** What the value was under the saved rule, when this edit changes it. */
  was?: string
}

/** The configuration as one group per wizard step, each a short list of label and value pairs (Check and the receipt). */
export interface CheckGroup {
  step: SectionId
  label: string
  rows: CheckRow[]
}

const DIFF_ROW: Record<string, string> = {
  [MODEL_STEP_LABEL]: "Judged as",
  [HOW_MANY_LABEL]: "Rule",
  "Who can sign off": "Who signs",
  "Student adds": "Student adds",
  "Feedback required": "Feedback required",
  "Self-evaluation first": "Self-evaluation first",
  "Approval before it counts": "Approval before it counts",
  [CHECKOFF_LABEL]: CHECKOFF_LABEL,
}

/**
 * Check's summary (decision D-X32, redesign 2026-10-27), grouped by the step that sets it, as label and value pairs rather than
 * sentences glued together. A value still to choose says "Not chosen" and carries `missing`; with `current`, each changed row
 * carries what it was.
 */
export function checkGroups(rule: LabRule, current: LabRule | null = null): CheckGroup[] {
  const m = rule.model
  const yesNo = (b: boolean) => (b ? "Yes" : "No")
  const realQuestions = rule.questions.filter((q) => q.trim()).length
  const realLevels = rule.levels.filter((l) => l.trim())
  const criteriaRows: CheckRow[] = !m
    ? [{ label: "Outcomes", value: "Not chosen", missing: true }]
    : m === "binary"
      ? [
          { label: "Outcomes", value: `${rule.outcomeLabels[0] || "First outcome"} or ${rule.outcomeLabels[1] || "second outcome"}` },
          rule.qualifyingLabel === null
            ? { label: "Counts when", value: "Not chosen", missing: true }
            : { label: "Counts when", value: rule.outcomeLabels[rule.qualifyingLabel] || "Chosen outcome" },
        ]
      : m === "demonstration"
        ? [
            { label: "Levels", value: realLevels.join(", ") || "None yet", missing: realLevels.length < 2 },
            countingLevels(rule).length
              ? { label: "Counts", value: countsFromOption(rule.levels, countsFromIndex(rule)!) }
              : { label: "Counts", value: "Not chosen", missing: true },
          ]
        : [
            { label: "Questions", value: realQuestions ? `${rule.questions.length} ${plural(rule.questions.length, "question", "questions")}` : "None yet", missing: realQuestions === 0 },
            ...(m === "scored" ? [isInt(rule.scaleMax) ? { label: "Scale", value: `1 to ${rule.scaleMax}` } : { label: "Scale", value: "Not chosen", missing: true }] : []),
          ]
  const ruleRows: CheckRow[] = !m
    ? [{ label: "Rule", value: "Not set", missing: true }]
    : [
        hasNeed(rule) ? { label: "Rule", value: ruleSentence(rule) } : { label: "Rule", value: "Not set", missing: true },
        ...(settingNote(rule) ? [{ label: "Setting", value: settingNote(rule) }] : []),
        ...carriedNotes(rule).map((n) => ({ label: "Kept", value: n })),
      ]
  const fields = rule.studentFields.filter((f) => f.label.trim())
  const roles = rule.evaluatorRoles.map((r) => ROLE_LABEL[r])
  const groups: CheckGroup[] = [
    { step: "model", label: MODEL_STEP_LABEL, rows: [m ? { label: "Judged as", value: LAB_MODEL_LABEL[m] } : { label: "Judged as", value: "Not chosen", missing: true }] },
    { step: "outcomes", label: CRITERIA_LABEL, rows: criteriaRows },
    { step: "rule", label: HOW_MANY_LABEL, rows: ruleRows },
    {
      step: "signoff",
      label: WHO_DOES_WHAT_LABEL,
      rows: [
        // Student, Evaluator, Approval: the order of the step's groups (2026-10-28).
        { label: "Student adds", value: fields.length ? fields.map((f) => `${f.label.trim()}${f.mandatory ? " (required)" : ""}`).join(", ") : "Nothing beyond the evidence" },
        { label: "Self-evaluation first", value: yesNo(rule.selfEvaluation) },
        roles.length ? { label: "Who signs", value: roles.join(", ") } : { label: "Who signs", value: "Not chosen", missing: true },
        { label: "Feedback required", value: yesNo(rule.feedbackRequired) },
        { label: CHECKOFF_LABEL, value: m ? checkOffLine(rule) : "Not set" },
        { label: "Approval before it counts", value: yesNo(rule.approvalRequired) },
      ],
    },
  ]
  if (current) {
    for (const d of configDiff(current, rule)) {
      const rowLabel = DIFF_ROW[d.label] ?? (d.label === outcomesLabel(rule.model) ? criteriaRows[0]?.label : undefined)
      if (!rowLabel) continue
      for (const g of groups) {
        const row = g.rows.find((r) => r.label === rowLabel)
        if (row) row.was = d.before === "On" ? "Yes" : d.before === "Off" ? "No" : d.before
      }
    }
  }
  return groups
}

// ---------------------------------------------------------------------------------------------------------------------
// Group check-off (PROTO 2026-10-28 "Group check-off"; lib/lab/course-checkoff.ts reads the saved value). CHECKOFF_LABEL is
// declared at the top of the file.

/** True when the rule allows a group check-off (its own choice, else the model's default). */
export const ruleAllowsCheckOff = (rule: LabRule): boolean => checkOffAllowedFor(rule.model, rule.checkOff?.enabled)

/** The score one tick records under this rule. */
export const ruleCheckOffScore = (rule: LabRule): number => checkOffScore(rule.scaleMax, rule.scoredRule, rule.checkOff?.score, rule.questions.length)

/** "Checking it off marks the student as met", "... as independent", "... at the level: works alone": what one tick writes. */
export function ruleTickRecords(rule: LabRule): string {
  return tickRecordsLine(rule.model, { outcomeLabels: rule.outcomeLabels, qualifyingLabel: rule.qualifyingLabel, levels: rule.levels, levelIndex: rule.checkOff?.levelIndex, questions: rule.questions, score: ruleCheckOffScore(rule) })
}

/** "Allowed, records Independent" or "Not allowed": the value for Check and save and "What you changed" (data, no sentence). */
export function checkOffLine(rule: LabRule): string {
  if (!ruleAllowsCheckOff(rule)) return "Not allowed"
  if (rule.model === "demonstration") {
    const level = rule.levels[checkOffLevelIndex(rule.levels, rule.checkOff?.levelIndex)]?.trim()
    return level ? `Allowed, marks ${inSentence(level)}` : "Allowed"
  }
  if (rule.model === "binary") return `Allowed, marks ${inSentence(rule.outcomeLabels[rule.qualifyingLabel ?? 0]?.trim() || "Met")}`
  if (rule.model === "scored") return `Allowed, scores ${ruleCheckOffScore(rule)}`
  if (rule.model === "question") return "Allowed, every question Yes"
  return "Allowed"
}

/**
 * A rule with no saved choice starts with group check-off off (no defaults, REQ SC-02), written into the draft so the switch, the
 * save and every later reading agree. The engine's model default (CHECKOFF_DEFAULT) stays for seeded skills. Needs a model.
 */
export function withCheckOffDecided(rule: LabRule): LabRule {
  if (!rule.model || rule.checkOff?.enabled != null) return rule
  return { ...rule, checkOff: { ...(rule.checkOff ?? { enabled: null, levelIndex: null, score: null }), enabled: false } }
}

/** Why the rule does not allow a check-off, in the same words the course offering page uses. */
export const ruleCheckOffOff = (rule: LabRule): string | null => checkOffOffReason(rule.model, ruleAllowsCheckOff(rule), !!rule.model, rule.questions.length)

/** The saved value: the explicit choice only when the admin made one, and the nominated level or score for that model. */
function checkOffConfig(rule: LabRule): SkillConfig["checkOff"] {
  const c = rule.checkOff
  if (!c) return undefined
  const out: NonNullable<SkillConfig["checkOff"]> = {}
  if (typeof c.enabled === "boolean") out.enabled = c.enabled
  if (rule.model === "demonstration" && typeof c.levelIndex === "number") out.levelIndex = c.levelIndex
  if (rule.model === "scored" && typeof c.score === "number") out.score = c.score
  return Object.keys(out).length ? out : undefined
}
