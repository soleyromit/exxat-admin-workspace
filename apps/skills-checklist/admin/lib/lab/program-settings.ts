/**
 * Program evaluation settings (Proposed working default, 2026-11-02; docs/build/2026-11-02-admin-flow-gap-and-placement.md and
 * contract V2-06). Sankalp [CALL 11-02]: how skills are evaluated is set once for the program; only how many times stays per skill.
 *
 * REQ still sets configuration per skill (section 3, SC-01, SC-14 to SC-16), so the program settings are what every skill
 * inherits, and a skill can still be changed on its own (the configure screens). The engine is untouched: a skill's rule is the
 * program part plus the skill's own part (`resolveRule`), saved through the same `saveLabRule` path, so every figure reads it as
 * before.
 *
 * - Program part: how it's judged, outcome labels and which counts, levels and which count (D-L27), scale and scored rule,
 *   question rule, distinct evaluators, what the student adds, self-evaluation, feedback, approval, who signs, check-off.
 * - Skill part: times needed (`need`), level minimums, setting minimums, and its own questions under a question or scored model
 *   (REQ SC-04: a question set belongs to the skill; the program's questions are only the starting set).
 *
 * Nothing is defaulted by Prism [REQ SC-02]: the program chooses the model and types the times needed. Settings reach a skill
 * only through an explicit Save or "Apply to new skills" [REQ IM-13].
 */
import { isConfigured } from "@/lib/v2/population"
import type { Skill, V2State } from "@/lib/v2/types"
import { copyRule, emptyRule, fromV2, saveLabRule, validateRule, type LabRule, type RuleIssue } from "./configure"

/** The program part of a rule, in the order the settings page shows them. */
export const PROGRAM_KEYS = [
  "model",
  "outcomeLabels",
  "qualifyingLabel",
  "levels",
  "scaleMax",
  "scoredRule",
  "questionRule",
  "distinctEvaluators",
  "studentFields",
  "selfEvaluation",
  "feedbackRequired",
  "approvalRequired",
  "evaluatorRoles",
  "checkOff",
] as const satisfies ReadonlyArray<keyof LabRule>

const hasNeed = (r: Pick<LabRule, "need">): boolean => Number.isInteger(r.need) && r.need >= 1
const same = (a: unknown, b: unknown): boolean => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
const usesQuestions = (r: Pick<LabRule, "model">): boolean => r.model === "question" || r.model === "scored"

/** The program's saved settings, or null before the program saves them. */
export function programSettingsOf(s: V2State): { rule: LabRule; at: string } | null {
  const p = s.programSettings
  if (!p || !p.rule || typeof p.rule !== "object") return null
  return { rule: { ...emptyRule(), ...(p.rule as LabRule) }, at: p.at }
}

/** The rule the settings page starts from: the saved settings, else nothing chosen (no model, no number). */
export function programStartRule(s: V2State): LabRule {
  return programSettingsOf(s)?.rule ?? { ...emptyRule() }
}

/** A skill's rule as it is saved today, or null when the skill is not configured. */
export function skillRuleOf(skill: Skill): LabRule | null {
  return isConfigured(skill) && skill.config && skill.model ? fromV2(skill) : null
}

/**
 * The program part with the skill's own part. A skill without a times needed number takes the program's. Level minimums stay only
 * when the skill's levels are the program's levels; questions stay only when the skill already used the same model.
 */
export function resolveRule(program: LabRule, skill: LabRule | null): LabRule {
  const own = skill ?? emptyRule()
  const sameModel = own.model === program.model
  const sameLevels = sameModel && same(own.levels, program.levels)
  const r = copyRule(program)
  r.need = hasNeed(own) ? own.need : program.need
  r.levelMinimums = sameLevels ? own.levelMinimums.map((m) => ({ ...m })) : []
  r.settingMinimums = own.settingMinimums.map((m) => ({ ...m }))
  if (usesQuestions(program) && sameModel && own.questions.length > 0) {
    r.questions = [...own.questions]
    r.questionRule = own.questionRule ? JSON.parse(JSON.stringify(own.questionRule)) : program.questionRule
  } else if (!usesQuestions(program)) {
    r.questions = []
  }
  r.carried = { ...own.carried, minLevelIndex: program.carried.minLevelIndex }
  return r
}

/** Which parts of a skill's rule differ from the program settings (empty when it follows them). */
export function differsFromProgram(skill: LabRule | null, program: LabRule | null): string[] {
  if (!skill || !program) return []
  const out: string[] = PROGRAM_KEYS.filter((k) => !same(skill[k], program[k]))
  if (skill.model === "demonstration" && skill.carried.minLevelIndex !== program.carried.minLevelIndex) out.push("minLevelIndex")
  return out
}

export interface ProgramApplyPlan {
  /** Active skills the save writes (their rule changes). */
  change: string[]
  /** Active skills already on these settings. */
  unchanged: string[]
  /** Skills with settings of their own (they differed from the previous program settings); kept unless the admin includes them. */
  own: string[]
  /** Skills the settings cannot apply to yet, with the reason (a question model with no questions of its own, say). */
  blocked: Array<{ skillId: string; reason: string }>
  /** Not configured skills among `change`: they become usable. */
  newlyConfigured: number
}

const activeSkills = (s: V2State): Skill[] => s.skills.filter((k) => k.active !== false)

/**
 * What saving `program` would do. On the first save every active skill takes the settings. Afterwards a skill whose rule differed
 * from the previous program settings has settings of its own and is kept unless `includeOwn`.
 */
export function planProgramApply(s: V2State, program: LabRule, opts: { includeOwn?: boolean; only?: readonly string[] } = {}): ProgramApplyPlan {
  const previous = programSettingsOf(s)?.rule ?? null
  const plan: ProgramApplyPlan = { change: [], unchanged: [], own: [], blocked: [], newlyConfigured: 0 }
  const only = opts.only ? new Set(opts.only) : null
  for (const k of activeSkills(s)) {
    if (only && !only.has(k.id)) continue
    const now = skillRuleOf(k)
    if (now && previous && differsFromProgram(now, previous).length > 0 && !opts.includeOwn) {
      plan.own.push(k.id)
      continue
    }
    const next = resolveRule(program, now)
    const issues: RuleIssue[] = validateRule(next)
    if (issues.length) {
      plan.blocked.push({ skillId: k.id, reason: issues[0]!.message })
      continue
    }
    if (now && same(next, now)) plan.unchanged.push(k.id)
    else {
      plan.change.push(k.id)
      if (!now) plan.newlyConfigured += 1
    }
  }
  return plan
}

export interface ProgramApplyResult {
  state: V2State
  written: string[]
  plan: ProgramApplyPlan
}

/**
 * Save the program settings and write them to the planned skills, each through saveLabRule (its own rule version and audit line).
 * Refuses settings that are not valid on their own [REQ SC-18].
 */
export function saveProgramSettings(s: V2State, program: LabRule, opts: { at: string; byId: string; includeOwn?: boolean; only?: readonly string[] }): { ok: true; result: ProgramApplyResult } | { ok: false; issues: RuleIssue[] } {
  const issues = validateRule(program)
  if (issues.length) return { ok: false, issues }
  const plan = planProgramApply(s, program, opts)
  let state: V2State = s
  const written: string[] = []
  for (const id of plan.change) {
    const k = state.skills.find((x) => x.id === id)
    if (!k) continue
    const r = saveLabRule(state, id, resolveRule(program, skillRuleOf(k)), { at: opts.at, byId: opts.byId, mode: null })
    if (r.ok && r.written) {
      state = r.state
      written.push(id)
    }
  }
  state = { ...state, programSettings: { rule: copyRule(program), at: opts.at } }
  return { ok: true, result: { state, written, plan } }
}

/** Active skills not configured yet: the ones "Apply to new skills" reaches once program settings exist [REQ IM-10, IM-13]. */
export function notConfiguredIds(s: V2State, only?: readonly string[]): string[] {
  const keep = only ? new Set(only) : null
  return activeSkills(s).filter((k) => !isConfigured(k) && (!keep || keep.has(k.id))).map((k) => k.id)
}

export type TimesNeededResult = { ok: true; state: V2State } | { ok: false; error: string }

/**
 * Times needed for one skill: a configured skill keeps its rule with the new number; a skill not configured yet takes the program
 * settings with this number (so it becomes usable); with no program settings it cannot be set here.
 */
export function setTimesNeeded(s: V2State, skillId: string, need: number, opts: { at: string; byId: string }): TimesNeededResult {
  if (!Number.isInteger(need) || need < 1 || need > TIMES_MAX) return { ok: false, error: `Enter a whole number from 1 to ${TIMES_MAX}.` }
  const k = s.skills.find((x) => x.id === skillId)
  if (!k) return { ok: false, error: "This skill is no longer in the library." }
  const now = skillRuleOf(k)
  const program = programSettingsOf(s)?.rule ?? null
  let next: LabRule
  if (now) next = { ...copyRule(now), need }
  else if (program) next = { ...resolveRule(program, null), need }
  else return { ok: false, error: "Set the evaluation settings first." }
  const r = saveLabRule(s, skillId, next, { at: opts.at, byId: opts.byId, mode: null })
  if (!r.ok) return { ok: false, error: r.error }
  return { ok: true, state: r.state }
}

/** Highest times needed a cell accepts (a typo guard, not a rule). */
export const TIMES_MAX = 50

export interface TimesCell {
  /** What the skill needs: its own number, else the program's number for a skill that would take it, else null ("Not set"). */
  value: number | null
  /** The program's number, or null before the program saves its settings (never a Prism default) [REQ SC-02]. */
  programNeed: number | null
  /** The skill's number differs from the program's number (only when both exist). */
  differs: boolean
  /** A number can be set here: the skill is configured, or the program settings apply to it as they stand. */
  editable: boolean
  /** Why not, when not editable. */
  reason: string | null
}

/**
 * The times needed cell for one skill, from the same sources as the Evaluation settings list (`timesRows`), so the library column
 * and "Skills with a different number" always agree. A skill whose model needs its own questions and has none keeps showing the
 * program's number but cannot be set here (it is set where its questions are).
 */
export function timesCellOf(s: V2State, skillId: string): TimesCell {
  const programRule = programSettingsOf(s)?.rule ?? null
  const programNeed = programRule && hasNeed(programRule) ? programRule.need : null
  const k = s.skills.find((x) => x.id === skillId)
  const now = k ? skillRuleOf(k) : null
  if (now) {
    const value = hasNeed(now) ? now.need : programNeed
    return { value, programNeed, differs: value !== null && programNeed !== null && value !== programNeed, editable: true, reason: null }
  }
  if (!programRule) return { value: null, programNeed: null, differs: false, editable: false, reason: "Set the evaluation settings first." }
  const issues = validateRule(resolveRule(programRule, null))
  return { value: programNeed, programNeed, differs: false, editable: issues.length === 0, reason: issues[0]?.message ?? null }
}

/** Every skill's cell at once (one read of the program settings per skill; fine at 178 rows). */
export function timesCells(s: V2State, ids: readonly string[]): Map<string, TimesCell> {
  return new Map(ids.map((id) => [id, timesCellOf(s, id)]))
}

export type TimesManyResult = { state: V2State; written: string[]; unchanged: string[]; failed: Array<{ id: string; error: string }> }

/**
 * Times needed for several skills (the library's bulk "Set times needed", and one row as a list of one). A skill already on that
 * number is left alone; setting a skill back to the program's number clears its difference (it then follows the program).
 */
export function setTimesNeededMany(s: V2State, ids: readonly string[], need: number, opts: { at: string; byId: string }): TimesManyResult {
  let state = s
  const out: TimesManyResult = { state, written: [], unchanged: [], failed: [] }
  if (!Number.isInteger(need) || need < 1 || need > TIMES_MAX) {
    out.failed = ids.map((id) => ({ id, error: `Enter a whole number from 1 to ${TIMES_MAX}.` }))
    return out
  }
  for (const id of ids) {
    const cell = timesCellOf(state, id)
    if (!cell.editable) {
      out.failed.push({ id, error: cell.reason ?? "This number cannot be set here." })
      continue
    }
    const k = state.skills.find((x) => x.id === id)
    const own = k ? skillRuleOf(k) : null
    // Not configured and the number is the program's: nothing to write (it already takes the program's number).
    if ((own && hasNeed(own) && own.need === need) || (!own && need === cell.programNeed)) {
      out.unchanged.push(id)
      continue
    }
    const r = setTimesNeeded(state, id, need, opts)
    if (r.ok) {
      state = r.state
      out.written.push(id)
    } else out.failed.push({ id, error: r.error })
  }
  out.state = state
  return out
}

export interface TimesRow extends Record<string, unknown> {
  id: string
  name: string
  category: string
  /** The skill's own number, or null when it has none yet. */
  need: number | null
  /** What the skill needs today: its own number, else the program's (the library's Times needed column; `timesCellOf`). */
  value: number | null
  configured: boolean
  /** The rule differs from the program settings in how it is evaluated (a per-skill change). */
  ownSettings: boolean
}

/**
 * One row per library row that is active and in the shared store, in the library's own order and category (`section`), so the
 * counts match the library tabs.
 */
export function timesRows(s: V2State, library: ReadonlyArray<{ id: string; name: string; section: string; status: string }>): TimesRow[] {
  const program = programSettingsOf(s)?.rule ?? null
  const byId = new Map(s.skills.map((k) => [k.id, k]))
  const out: TimesRow[] = []
  for (const row of library) {
    if (row.status === "inactive") continue
    const k = byId.get(row.id)
    if (!k) continue
    const now = skillRuleOf(k)
    const programNeed = program && hasNeed(program) ? program.need : null
    const need = now && hasNeed(now) ? now.need : null
    out.push({ id: k.id, name: row.name, category: row.section, need, value: need ?? programNeed, configured: !!now, ownSettings: differsFromProgram(now, program).length > 0 })
  }
  return out
}
