import { inSentence } from "@/lib/lab/terms"
import { needsLevels, needsQuestions } from "./config"
import type { EvalModel, Evaluation, EvaluatorRole, LevelMinimum, Person, QuestionRule, ScoredRule, Skill, SkillConfig, V2State } from "./types"

/** Wizard steps, in order. Step 7 is the review and publish step. */
export const WIZARD_STEPS = [
  { n: 1, id: "model", label: "Evaluation model" },
  { n: 2, id: "achievement", label: "Achievement rules" },
  { n: 3, id: "simulation", label: "Simulation" },
  { n: 4, id: "prerequisites", label: "Prerequisites" },
  { n: 5, id: "evaluators", label: "Qualified evaluators" },
  { n: 6, id: "failure", label: "If a student does not pass" },
  { n: 7, id: "review", label: "Review and publish" },
] as const

export interface RuleIssue {
  /** Stable id: the field id plus a short code. */
  id: string
  /** Wizard step that owns the field (1 to 6). */
  step: number
  /** DOM id of the control to focus. */
  field: string
  message: string
}

const norm = (t: string) => t.trim().toLowerCase().replace(/\s+/g, " ")

function duplicates(items: string[]): Set<number> {
  const seen = new Map<string, number>()
  const dup = new Set<number>()
  items.forEach((t, i) => {
    const k = norm(t)
    if (!k) return
    if (seen.has(k)) {
      dup.add(i)
      dup.add(seen.get(k)!)
    } else seen.set(k, i)
  })
  return dup
}

const isInt = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n)

const ROLE_KINDS: Record<EvaluatorRole, Person["kind"][]> = {
  preceptor: ["preceptor"],
  "lab-instructor": ["lab-instructor"],
  faculty: ["reviewer", "director"],
}

/** People on record who could evaluate under a configuration's roles and qualification (SC-16 and the qualification rule). */
export function qualifiedEvaluators(state: V2State, c: SkillConfig): Person[] {
  const kinds = new Set(c.evaluatorRoles.flatMap((r) => ROLE_KINDS[r]))
  return state.people.filter((p) => {
    if (!kinds.has(p.kind)) return false
    const q = c.qualification
    if (q.credentials.length && !q.credentials.some((x) => (p.credentials ?? []).includes(x))) return false
    if ((p.yearsPractice ?? 0) < q.minYears) return false
    if (q.training.length && !q.training.every((x) => (p.training ?? []).includes(x))) return false
    return true
  })
}

/** Every person who could ever be an evaluator, whatever the rule. Used to offer the credential and training choices. */
export function evaluatorPool(state: V2State): Person[] {
  return state.people.filter((p) => p.kind === "preceptor" || p.kind === "lab-instructor" || p.kind === "reviewer" || p.kind === "director")
}

export function credentialOptions(state: V2State): string[] {
  return [...new Set(evaluatorPool(state).flatMap((p) => p.credentials ?? []))].sort()
}

export function trainingOptions(state: V2State): string[] {
  return [...new Set(evaluatorPool(state).flatMap((p) => p.training ?? []))].sort()
}

/**
 * Everything that would stop a skill from being put into use (SC-18, SC-19). A configuration that cannot be satisfied is not
 * publishable. Each issue names the step and the field so the review step can link straight to it.
 */
export function validateDraft(draft: { model: EvalModel | null; config: SkillConfig }, state: V2State, skillId: string): RuleIssue[] {
  const { model, config: c } = draft
  const out: RuleIssue[] = []
  const add = (step: number, field: string, code: string, message: string) => out.push({ id: `${field}:${code}`, step, field, message })

  if (!model) add(1, "wiz-model", "missing", "Choose an evaluation model. A skill cannot be put into use without one.")

  if (model === "binary") {
    const [a, b] = c.outcomeLabels
    if (!a.trim()) add(1, "wiz-label-a", "blank", "Name the outcome that qualifies, for example Met.")
    if (!b.trim()) add(1, "wiz-label-b", "blank", "Name the other outcome, for example Not met.")
    if (a.trim() && b.trim() && norm(a) === norm(b)) add(1, "wiz-label-b", "same", "The two outcomes need different names. Rename one of them.")
  }

  if (needsQuestions(model)) {
    if (c.questions.length === 0) add(1, "wiz-add-question", "none", "Add at least one question. The evaluator answers each one.")
    const dup = duplicates(c.questions)
    c.questions.forEach((q, i) => {
      if (!q.trim()) add(1, `wiz-question-${i}`, "blank", `Question ${i + 1} has no text. Write it, or remove the question.`)
      else if (dup.has(i)) add(1, `wiz-question-${i}`, "dup", `Question ${i + 1} repeats another question. Reword it or remove it.`)
    })
  }

  const levels = needsLevels(model, c)
  if (levels) {
    if (c.levels.length < 2) add(1, "wiz-add-level", "few", "Add at least two levels so a student can move from one to the next.")
    const dup = duplicates(c.levels)
    c.levels.forEach((l, i) => {
      if (!l.trim()) add(1, `wiz-level-${i}`, "blank", `Level ${i + 1} has no name. Name it, or remove the level.`)
      else if (dup.has(i)) add(1, `wiz-level-${i}`, "dup", `Level ${i + 1} repeats another level name. Rename one of them.`)
    })
  }

  const a = c.achievement
  if (!isInt(a.need) || a.need < 1) add(2, "wiz-need", "need", "Enter how many successful evaluations are needed, as a whole number of 1 or more.")
  if (a.kind === "last-n") {
    if (!isInt(a.window) || a.window < 1) add(2, "wiz-window", "window", "Enter how many recent evaluations to look at, as a whole number of 1 or more.")
    else if (isInt(a.need) && a.window < a.need) add(2, "wiz-window", "small", `The window is ${a.window} but ${a.need} successful evaluations are needed. Make the window at least ${a.need}.`)
  }
  if (!isInt(a.distinctEvaluators) || a.distinctEvaluators < 1) add(2, "wiz-distinct", "min", "Enter at least 1 evaluator.")
  else if (isInt(a.need) && a.distinctEvaluators > a.need) add(2, "wiz-distinct", "gt", `${a.distinctEvaluators} different evaluators cannot sign off only ${a.need} evaluations. Lower the evaluators or raise the evaluations.`)
  if (a.minLevelIndex !== null) {
    if (!levels) add(2, "wiz-minlevel", "nolevels", "A minimum level needs a level scale. Choose the demonstration model or turn on the overall supervision rating, or clear the minimum.")
    else if (a.minLevelIndex < 0 || a.minLevelIndex >= c.levels.length) add(2, "wiz-minlevel", "range", "The minimum level no longer exists. Choose one from the list.")
  }
  const names = a.settingMinimums.map((m) => m.setting)
  const dupSet = duplicates(names)
  a.settingMinimums.forEach((m, i) => {
    if (!m.setting.trim()) add(2, `wiz-setting-name-${i}`, "blank", `Choose a clinical setting for row ${i + 1}, or remove the row.`)
    else if (dupSet.has(i)) add(2, `wiz-setting-name-${i}`, "dup", `${m.setting} is listed twice. Combine the rows.`)
    if (!isInt(m.min) || m.min < 1) add(2, `wiz-setting-min-${i}`, "min", `Enter a minimum of 1 or more for ${m.setting ? inSentence(m.setting) : `row ${i + 1}`}.`)
  })
  const settingsTotal = a.settingMinimums.reduce((n, m) => n + (isInt(m.min) ? m.min : 0), 0)
  if (isInt(a.need) && settingsTotal > a.need) add(2, "wiz-settings", "sum", `Setting minimums add up to ${settingsTotal} but only ${a.need} evaluations are needed. Lower a setting minimum or raise the evaluations.`)
  if (a.settingMinimums.length && !c.evaluatorRoles.some((r) => r === "preceptor" || r === "faculty")) {
    add(5, "wiz-roles", "labonly", "Clinical settings need evidence from clinical practice, and a lab instructor alone cannot supply it. Allow preceptors or faculty, or remove the setting minimums.")
  }

  const sim = c.simulation
  if (sim.allowed) {
    if (sim.mode === "cap" && (!isInt(sim.maxSharePercent) || sim.maxSharePercent < 0 || sim.maxSharePercent > 100)) add(3, "wiz-sim-cap", "range", "Enter a share between 0 and 100 percent.")
    if (sim.mode === "allow-list" && sim.allowList.length === 0) add(3, "wiz-sim-list", "none", "Tick at least one simulation setting, or choose a share cap instead.")
  }

  const p = c.prerequisites
  if (!isInt(p.practiceTrials) || p.practiceTrials < 0 || p.practiceTrials > 20) add(4, "wiz-trials", "range", "Enter practice trials as a whole number from 0 to 20.")
  for (const id of p.skillIds) {
    const k = state.skills.find((x) => x.id === id)
    if (id === skillId) add(4, "wiz-prereq-skills", `self-${id}`, "A skill cannot be its own prerequisite. Untick it.")
    else if (!k) add(4, "wiz-prereq-skills", `missing-${id}`, "A prerequisite skill is no longer in the library. Untick it.")
    else if (!k.published) add(4, "wiz-prereq-skills", `unpub-${id}`, `${k.name} is not in use yet, so no student can meet it. Publish it first, or untick it.`)
  }

  if (c.evaluatorRoles.length === 0) add(5, "wiz-roles", "none", "Choose at least one role that may sign off this skill.")
  const q = c.qualification
  if (!isInt(q.minYears) || q.minYears < 0 || q.minYears > 50) add(5, "wiz-minyears", "range", "Enter years of practice as a whole number from 0 to 50.")
  else if (c.evaluatorRoles.length > 0 && qualifiedEvaluators(state, c).length === 0) {
    add(5, "wiz-qualified", "none", "No evaluator on record meets these requirements, so nobody could sign this skill off. Lower a requirement, or add the evaluator's details to the program.")
  }

  const f = c.failure
  if (f.attemptLimit !== null && (!isInt(f.attemptLimit) || f.attemptLimit < 1 || f.attemptLimit > 20)) add(6, "wiz-attempts", "range", "Enter an attempt limit from 1 to 20, or leave it empty for no limit.")
  if (!isInt(f.minDaysBetween) || f.minDaysBetween < 0 || f.minDaysBetween > 365) add(6, "wiz-days", "range", "Enter days between attempts from 0 to 365.")
  if (model === "scored" && f.retakeScoreCap !== null && (!isInt(f.retakeScoreCap) || f.retakeScoreCap < 1 || f.retakeScoreCap > 100)) add(6, "wiz-cap", "range", "Enter a retake score cap from 1 to 100 percent, or leave it empty.")

  return out
}

export type Strength = "light" | "moderate" | "strong"

export interface StrengthHint {
  strength: Strength
  points: number
  sentence: string
  note: string
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)

/**
 * Plain-language description of an achievement rule and how much it proves. The points are a rough heuristic for the
 * prototype, not a requirement: more evaluations, more different evaluators, a higher minimum level, a recent window and
 * named clinical settings each make the rule stronger.
 */
export function strengthHint(model: EvalModel | null, c: SkillConfig): StrengthHint {
  const a = c.achievement
  const need = isInt(a.need) && a.need > 0 ? a.need : 1
  const distinct = isInt(a.distinctEvaluators) && a.distinctEvaluators > 0 ? a.distinctEvaluators : 1
  const lvl = needsLevels(model, c) && a.minLevelIndex !== null ? c.levels[a.minLevelIndex]?.trim() : ""

  let points = 0
  if (need >= 3) points++
  if (need >= 5) points++
  if (distinct >= 2) points++
  if (distinct >= 3) points++
  if (lvl && a.minLevelIndex !== null && a.minLevelIndex >= c.levels.length - 1 && c.levels.length >= 2) points++
  if (a.kind === "last-n") points++
  if (a.settingMinimums.length > 0) points++
  const strength: Strength = points <= 1 ? "light" : points <= 3 ? "moderate" : "strong"

  const parts: string[] = []
  const evals = a.kind === "last-n" && isInt(a.window) && a.window >= need ? `${need} successful ${plural(need, "evaluation", "evaluations")} out of their last ${a.window}` : `${need} successful ${plural(need, "evaluation", "evaluations")}`
  parts.push(evals)
  // Published lab rules only (absent on the seed, so the seeded sentences are unchanged).
  const qr = model === "question" ? c.questionRule : null
  if (qr) {
    const m = c.questions.length
    parts.push(qr.kind === "all" ? "each with every question answered Yes" : qr.kind === "atLeast" ? `each with at least ${qr.n} of ${m} questions answered Yes` : `each with ${plural(qr.indices.length, "question", "questions")} ${[...qr.indices].sort((x, y) => x - y).map((i) => i + 1).join(", ")} answered Yes`)
  }
  for (const lm of c.levelMinimums ?? []) if (c.levels[lm.levelIndex]?.trim()) parts.push(`at least ${lm.min} at ${inSentence(c.levels[lm.levelIndex]!.trim())} or above`)
  parts.push(distinct >= 2 ? `from at least ${distinct} different evaluators` : "from any single evaluator")
  if (lvl) parts.push(`at ${inSentence(lvl)} or above`)
  const named = a.settingMinimums.filter((m) => m.setting.trim() && isInt(m.min) && m.min > 0)
  if (named.length) parts.push(`including ${named.map((m) => `${m.min} in ${inSentence(m.setting)}`).join(" and ")}`)
  const sentence = `A student needs ${parts.join(", ")}.`

  const note =
    strength === "light"
      ? "This is a light rule. One evaluator on a good day could be enough to pass."
      : strength === "moderate"
        ? "This is a moderate rule. It asks for repeat evidence but a small group could still sign it all."
        : "This is a strong rule. It asks for repeat evidence from several people."
  return { strength, points, sentence, note }
}

export interface SimulationShare {
  /** Largest number of required evaluations simulation may supply, or null when no cap applies. */
  maxCount: number | null
  /** Smallest number that must come from clinical practice or the lab, or null when no cap applies. */
  minReal: number | null
  text: string
}

/** What share of the required evaluations simulation can supply. Lab and simulation never count toward a clinical setting minimum (SC-12). */
export function simulationShare(c: SkillConfig): SimulationShare {
  const need = isInt(c.achievement.need) && c.achievement.need > 0 ? c.achievement.need : 1
  const s = c.simulation
  if (!s.allowed) return { maxCount: 0, minReal: need, text: `Simulation does not count for this skill. All ${need} must come from clinical practice or the lab.` }
  if (s.mode === "allow-list") {
    const names = s.allowList.length ? s.allowList.join(", ") : "none chosen yet"
    return { maxCount: null, minReal: null, text: `Only these simulation settings count: ${names}. No share cap applies.` }
  }
  const pct = isInt(s.maxSharePercent) ? Math.min(100, Math.max(0, s.maxSharePercent)) : 0
  const maxCount = Math.floor((need * pct) / 100)
  const minReal = need - maxCount
  return {
    maxCount,
    minReal,
    text: `Simulation can supply up to ${maxCount} of the ${need} required ${plural(need, "evaluation", "evaluations")} (${pct} percent). At least ${minReal} must come from clinical practice or the lab.`,
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// The one engine: what counts as a valid attempt, and when a record is achieved [REQ AE-01..AE-04, SC-05, SC-10, SC-11, SC-12]
//
// Both the v2 student progress (lib/v2/student.ts skillProgress, and through it every figure in facts.ts, the dashboard, the
// director and the lists) and the lab configure engine (lib/lab/configure.ts evaluateRule, and through it computeImpact) call
// runRule. There is no second implementation: a rule-impact "after" count and the student screens after publish are the same
// function over the same evaluations.

export type { LevelMinimum, QuestionRule, ScoredRule } from "./types"

/** Everything that decides who qualifies. Labels, fields, feedback and approval never do [REQ AE-06]. */
export interface EngineRule {
  model: EvalModel | null
  questionRule: QuestionRule | null
  scoredRule: ScoredRule | null
  /** How many valid attempts are needed (the frequency). Must be a whole number of 1 or more: no fallback. */
  need: number
  /** Last-N currency (v2, carried): only the latest `window` completed evaluations are read. */
  window: number | null
  /** v2 minimum level, carried: an evaluation with a recorded level below it does not qualify. */
  minLevelIndex: number | null
  simulationExcluded: boolean
  simulationCapPercent: number | null
  distinctEvaluators: number
  settingMinimums: ReadonlyArray<{ setting: string; min: number }>
  levelMinimums: readonly LevelMinimum[]
  levels: readonly string[]
}

export type RuleInvalidReason = "need-unset"

/** A rule the engine refuses to run. Never replaced by a default: the caller surfaces it. */
export interface InvalidRun {
  valid: false
  reason: RuleInvalidReason
  message: string
}

export interface RuleRun {
  valid: true
  /** Completed (counted-status) evaluations, newest first. Waiting and held evidence is never an attempt [REQ AE-01]. */
  counted: Evaluation[]
  /** The ones the window reads. */
  windowed: Evaluation[]
  /** Valid attempts the rule uses, after the window, the minimum level and the simulation share. */
  used: Evaluation[]
  have: number
  need: number
  distinctHave: number
  distinctNeed: number
  settings: Array<{ setting: string; min: number; have: number }>
  levels: Array<{ level: string; min: number; have: number }>
  achieved: boolean
  /** Windowed attempts that did not qualify on their own answers, score, outcome or level. */
  notQualifying: number
  /** Completed attempts that qualified on their own but were left out (outside the window, simulation share). */
  notUsed: number
  /** Completed attempts that did not qualify on their own answers (whole history, not only the window). */
  notMet: number
  /** Qualifying simulation attempts left out by the share cap or because simulation does not count. */
  simLeftOut: number
  /** Largest number of simulation attempts the cap lets count, or null when no cap applies. */
  maxSim: number | null
  /** Why a qualifying attempt was left out, by evaluation id. */
  leftOut: Record<string, string>
}

export const NEED_UNSET_MESSAGE = "Enter how many evaluations that count are needed, 1 or more."

/**
 * One evaluation is a valid attempt on its own answers [REQ SC-05, SC-07]: the published question rule over the recorded Yes and No
 * answers (all, at least N of M, or named questions), the published score rule over the recorded scores, else the recorded
 * outcome. An evaluation recorded before a question or score rule existed (no answers or scores) falls back to its outcome.
 * Renaming labels never changes this [REQ AE-06].
 */
export function qualifiesOn(rule: Pick<EngineRule, "model" | "questionRule" | "scoredRule">, e: Evaluation): boolean {
  const detail = e.versions[e.versions.length - 1]?.detail
  if (rule.model === "question" && rule.questionRule && detail?.answers?.length) {
    const yes = detail.answers.map((a) => a === "yes")
    const r = rule.questionRule
    if (r.kind === "all") return yes.length > 0 && yes.every(Boolean)
    if (r.kind === "atLeast") return yes.filter(Boolean).length >= r.n
    return r.indices.length > 0 && r.indices.every((i) => yes[i])
  }
  if (rule.model === "scored" && rule.scoredRule && detail?.scores?.length) {
    const s = detail.scores.filter((x): x is number => typeof x === "number")
    if (s.length === 0) return false
    const r = rule.scoredRule
    if (r.kind === "average") return s.reduce((a, b) => a + b, 0) / s.length >= r.value
    if (r.kind === "minEach") return s.every((x) => x >= r.value)
    return s.reduce((a, b) => a + b, 0) >= r.value
  }
  return e.outcome === "met"
}

/** True when the rule reads per-question answers (a published question rule), so the student line can say "2 of 3 questions". */
export const readsAnswers = (rule: Pick<EngineRule, "model" | "questionRule">): boolean => rule.model === "question" && !!rule.questionRule

/** The engine rule of a skill's published configuration, or null when the skill has no rule. */
export function engineRuleOf(skill: Pick<Skill, "model" | "config">): EngineRule | null {
  const c = skill.config
  if (!c) return null
  const a = c.achievement
  return {
    model: skill.model,
    questionRule: c.questionRule ?? null,
    scoredRule: c.scoredRule ?? null,
    need: a.need,
    window: a.kind === "last-n" && a.window ? a.window : null,
    minLevelIndex: a.minLevelIndex,
    simulationExcluded: !c.simulation.allowed,
    simulationCapPercent: c.simulation.allowed && c.simulation.mode === "cap" ? c.simulation.maxSharePercent : null,
    distinctEvaluators: a.distinctEvaluators,
    settingMinimums: a.settingMinimums,
    levelMinimums: c.levelMinimums ?? [],
    levels: c.levels,
  }
}

/** Runs a rule over one student's evaluations on one skill. Pure. An unset need is invalid, never defaulted. */
export function runRule(rule: EngineRule, evals: readonly Evaluation[]): RuleRun | InvalidRun {
  if (!isInt(rule.need) || rule.need < 1) return { valid: false, reason: "need-unset", message: NEED_UNSET_MESSAGE }
  const need = rule.need
  const counted = evals.filter((e) => e.status === "counted").sort((x, y) => (x.date < y.date ? 1 : x.date > y.date ? -1 : 0))
  const windowed = rule.window ? counted.slice(0, rule.window) : counted
  const minL = rule.minLevelIndex
  const levelOk = (e: Evaluation) => minL === null || e.levelIndex === undefined || e.levelIndex >= minL
  const own = (e: Evaluation) => qualifiesOn(rule, e)
  const qualifyingOwn = windowed.filter((e) => own(e) && levelOk(e))
  let used = qualifyingOwn
  let simLeftOut = 0
  let maxSim: number | null = null
  if (rule.simulationExcluded) {
    used = qualifyingOwn.filter((e) => e.setting !== "simulation")
    simLeftOut = qualifyingOwn.length - used.length
  } else if (rule.simulationCapPercent !== null) {
    const cap = Math.floor((need * rule.simulationCapPercent) / 100)
    maxSim = cap
    let n = 0
    used = qualifyingOwn.filter((e) => {
      if (e.setting !== "simulation") return true
      if (n < cap) {
        n++
        return true
      }
      simLeftOut++
      return false
    })
  }
  const have = used.length
  const usedIds = new Set(used.map((e) => e.id))
  const leftOut: Record<string, string> = {}
  for (const e of counted) {
    if (usedIds.has(e.id) || !own(e)) continue
    if (!windowed.includes(e)) leftOut[e.id] = `Met, but older than your last ${rule.window}, so the rule does not use it.`
    else if (!levelOk(e)) leftOut[e.id] = "Met, but below the minimum level the rule asks for."
    else if (e.setting === "simulation") leftOut[e.id] = rule.simulationExcluded ? "Met, but simulation does not count for this skill." : "Met, but simulation can only supply part of the evaluations, and that part is used up."
  }
  const distinctHave = new Set(used.map((e) => e.evaluatorId)).size
  const distinctNeed = Math.max(1, rule.distinctEvaluators)
  // Only clinical evidence carrying that setting counts toward it; lab and simulation never do [REQ SC-11, SC-12].
  const settings = rule.settingMinimums.map((m) => ({ setting: m.setting, min: m.min, have: used.filter((e) => e.setting === "clinical" && e.clinicalSetting === m.setting).length }))
  // An evaluation with no recorded level cannot count toward a level minimum.
  const levels = rule.levelMinimums.map((m) => ({ level: rule.levels[m.levelIndex] ?? "", min: m.min, have: used.filter((e) => e.levelIndex !== undefined && e.levelIndex >= m.levelIndex).length }))
  const achieved = have >= need && distinctHave >= distinctNeed && settings.every((x) => x.have >= x.min) && levels.every((l) => l.have >= l.min)
  const notQualifying = windowed.length - qualifyingOwn.length
  return {
    valid: true,
    counted,
    windowed,
    used,
    have,
    need,
    distinctHave,
    distinctNeed,
    settings,
    levels,
    achieved,
    notQualifying,
    notUsed: counted.length - notQualifying - have,
    notMet: counted.filter((e) => !own(e)).length,
    simLeftOut,
    maxSim,
    leftOut,
  }
}
