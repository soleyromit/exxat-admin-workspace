/**
 * Program evaluation settings (Proposed working default, 2026-11-02; docs/build/2026-11-02-admin-flow-gap-and-placement.md and
 * contract V2-06). Sankalp [CALL 11-02]: how skills are evaluated is set once for the program; only how many times stays per skill.
 *
 * REQ still sets configuration per skill (section 3, SC-01, SC-14 to SC-16), so the program settings are what every skill
 * inherits, and a skill can still be changed on its own (the configure screens). The engine is untouched: a skill's rule is the
 * program part plus the skill's own part (`resolveRule`), saved through the same `saveLabRule` path, so every figure reads it as
 * before.
 *
 * - Package (D0 rule 4): how it's judged, outcome labels and which counts, levels and which count (D-L27), scale and scored rule, question
 *   rule, what the student adds, self-evaluation, feedback, approval, who signs, check-off.
 * - Skill part (D0 rule 5, map D1a): times needed (`need`), level minimums, setting minimums, different evaluators, and its own questions
 *   under a question or scored model. The program defines and maintains the question set [REQ SC-04]: every skill on the default configuration
 *   takes it unless it has its own (map D0 note 2026-11-05), the way Times needed follows the program until someone changes it.
 *
 * Nothing is defaulted by Prism [REQ SC-02]: the program chooses the model and types the times needed. Its first save is the human
 * confirmation for every skill [REQ IM-13]; after it, a new skill is on the default configuration at once (D-L72, D-L89, map D0).
 */
import { isConfigured } from "@/lib/v2/population"
import type { Skill, V2State } from "@/lib/v2/types"
import { appendAudit } from "@/lib/v2/store"
import { computeImpact, copyRule, differsFromProgram, emptyRule, engineKey, fromV2, progressChanges, progressLost, progressMoves, programRuleIn, ruleAllowsCheckOff, saveLabRule, STATE_RANK, toSkillConfig, validateRule, type LabRule, type RecordState, type RuleIssue } from "./configure"
import { movesWhen } from "./terms"

export { differsFromProgram, PROGRAM_KEYS } from "./configure"

const hasNeed = (r: Pick<LabRule, "need">): boolean => Number.isInteger(r.need) && r.need >= 1
const same = (a: unknown, b: unknown): boolean => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
const usesQuestions = (r: Pick<LabRule, "model">): boolean => r.model === "question" || r.model === "scored"

/** The program's saved settings, or null before the program saves them. */
export function programSettingsOf(s: V2State): { rule: LabRule; at: string } | null {
  const rule = programRuleIn(s)
  return rule ? { rule, at: s.programSettings!.at } : null
}

// ---------------------------------------------------------------------------------------------------------------------
// Two separate fields (map D0, D-L88, D-L89). The one place each is worked out.

/** Status: in use or withdrawn, and nothing else [REQ SL-02, SL-11]. */
export type SkillStatus = "active" | "inactive"
/** Configuration: where the skill's evaluation settings come from [REQ IM-09, SC-01]. */
export type Configuration = "default" | "edited" | "not-configured"

const hasQuestions = (k: Pick<Skill, "config">): boolean => !!k.config?.questions.some((q) => q.trim())
const modelNeedsQuestions = (k: Pick<Skill, "model">): boolean => k.model === "question" || k.model === "scored"

/** D0: the model needs questions and this skill has none. */
export const needsQuestions = (k: Pick<Skill, "model" | "config">): boolean => modelNeedsQuestions(k) && !hasQuestions(k)
/** The same test on a rule still in a form. */
export const ruleNeedsQuestions = (r: Pick<LabRule, "model" | "questions">): boolean => usesQuestions(r) && !r.questions.some((q) => q.trim())

export const statusOf = (k: Pick<Skill, "active">): SkillStatus => (k.active === false ? "inactive" : "active")

/** D0 and D-L90: Not configured wins the word; it holds only before the program's first save, or when the model needs questions it lacks. */
export function configurationOf(s: V2State, k: Skill): Configuration {
  if (needsQuestions(k) || !isConfigured(k)) return "not-configured"
  if (k.edited) return "edited"
  return programRuleIn(s) ? "default" : "not-configured"
}

/** Mapped and submitted against only when Active and not Not configured [REQ IM-09, SL-11]. */
export const isUsable = (s: V2State, k: Skill): boolean => statusOf(k) === "active" && configurationOf(s, k) !== "not-configured"

/** Which case of Not configured (D-L90), so its one action can say what to do. */
export function notConfiguredReason(_s: V2State, k: Skill): "no-settings" | "questions" {
  return needsQuestions(k) ? "questions" : "no-settings"
}

/** What a not configured skill already holds: its number, and under a chosen model the rest of that rule. Never a Prism value [REQ SC-02]. */
function heldPartOf(k: Skill): LabRule {
  if (k.model && k.config) return fromV2(k)
  const need = k.config?.achievement.need
  return { ...emptyRule(), ...(Number.isInteger(need) && need! >= 1 ? { need: need! } : {}) }
}

/** A new skill under the program's settings, or null when the program has none yet or the skill would need questions first. */
export function ruleForNewSkill(s: V2State): LabRule | null {
  const program = programRuleIn(s)
  if (!program) return null
  const r = resolveRule(program, null)
  return validateRule(r).length ? null : r
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
 * The package with the skill's own part (D0 rules 4, 5, 6). Times needed follows the program until someone changes it: a number equal to the
 * previous program number follows, unless the skill is marked as keeping its own (`ownNumber`, Skill.ownNeed); any other number is the skill's own. Questions work the same way [REQ SC-04]: a skill with none, or with the
 * previous program set, takes the program's, unless the skill is marked as keeping its own (`ownSet`, Skill.ownQuestions); a skill with its own keeps them; a model that does not use questions clears them. Level minimums
 * stay only when the skill's levels are the program's levels [REQ SC-09]. A named rule names the program's questions on a skill that takes them;
 * on a skill with its own it keeps that skill's choice, else the program's questions it also has, else all of its own, so it can always be
 * satisfied [REQ SC-05, SC-06] [INFER]. "At least N" and a total are capped to what the skill's own set can reach.
 */
/** A skill's questions follow the program while it has none, or still has the set the program last saved and carries no mark (D0 note 2026-11-05). */
function takesProgramQuestions(ownQuestions: readonly string[], previous: LabRule | null, ownSet = false): boolean {
  if (!ownQuestions.length) return true
  if (ownSet) return false
  return !!previous && same(ownQuestions, previous.questions.filter((q) => q.trim()))
}

function namedOnOwnSet(own: LabRule, ownQuestions: readonly string[], program: LabRule, programQuestions: readonly string[]): number[] {
  const kept = own.questionRule?.kind === "subset" ? own.questionRule.indices.filter((i) => i < ownQuestions.length) : []
  if (kept.length) return [...kept]
  const key = (t: string) => t.trim().toLowerCase()
  const asked = new Set((program.questionRule?.kind === "subset" ? program.questionRule.indices : []).map((i) => key(programQuestions[i] ?? "")))
  const matching = ownQuestions.flatMap((q, i) => (asked.has(key(q)) ? [i] : []))
  return matching.length ? matching : ownQuestions.map((_, i) => i)
}

export function resolveRule(program: LabRule, skill: LabRule | null, previous: LabRule | null = null, ownNumber = false, ownSet = false): LabRule {
  const own = skill ?? emptyRule()
  const sameModel = own.model === program.model
  const sameLevels = sameModel && same(own.levels, program.levels)
  const r = copyRule(program)
  const follows = !hasNeed(own) || (!ownNumber && !!previous && hasNeed(previous) && own.need === previous.need)
  r.need = follows ? program.need : own.need
  r.levelMinimums = sameLevels ? own.levelMinimums.map((m) => ({ ...m })) : []
  r.settingMinimums = own.settingMinimums.map((m) => ({ ...m }))
  r.distinctEvaluators = skill ? own.distinctEvaluators : program.distinctEvaluators
  const ownQuestions = own.questions.filter((q) => q.trim())
  const programQuestions = program.questions.filter((q) => q.trim())
  const takesProgram = takesProgramQuestions(ownQuestions, previous, ownSet)
  r.questions = usesQuestions(program) ? (takesProgram ? programQuestions : ownQuestions) : []
  const pq = program.questionRule
  if (pq?.kind === "subset" && !takesProgram) r.questionRule = { kind: "subset", indices: namedOnOwnSet(own, ownQuestions, program, programQuestions) }
  else if (pq?.kind === "atLeast" && r.questions.length) r.questionRule = { kind: "atLeast", n: Math.min(pq.n, r.questions.length) }
  const ps = program.scoredRule
  if (ps?.kind === "total" && r.questions.length) r.scoredRule = { kind: "total", value: Math.min(ps.value, program.scaleMax * r.questions.length) }
  r.carried = { ...own.carried, minLevelIndex: program.carried.minLevelIndex }
  return r
}

/** Why a skill cannot take the settings, in the words the save dialog groups by. Each names the real cause, never one for another. */
export type BlockedWhy = "questions" | "lab-only" | "minimums" | "evaluators" | "other"

export const BLOCKED_WORDS: Record<BlockedWhy, string> = {
  questions: "No questions yet",
  "lab-only": "Setting minimum, and only a lab instructor can sign",
  minimums: "Minimums above the times needed",
  evaluators: "More different evaluators than times needed",
  other: "Settings that cannot be met",
}

function whyBlocked(i: RuleIssue): BlockedWhy {
  if (/^cfg-(add-question|question-|qrule|srule)/.test(i.field)) return "questions"
  if (i.id.endsWith(":labonly")) return "lab-only"
  if (i.field === "cfg-distinct") return "evaluators"
  if (/^cfg-(lmin|setting-min)/.test(i.field)) return "minimums"
  return "other"
}

export interface ProgramApplyPlan {
  /** Skills on the default configuration the save writes (their rule changes). */
  change: string[]
  /** Skills on the default configuration already on these settings. */
  unchanged: string[]
  /** Edited skills, the same set as the Library's Configuration filter: a program save never touches them (D0 rule 7). */
  edited: string[]
  /** Edited skills still without their questions: the save leaves them Not configured. */
  staysNotConfigured: string[]
  /** Skills that cannot take the settings: the rule could not be satisfied on them [REQ SC-18]. They read Not configured after the save. `why` is the group the dialog names. */
  blocked: Array<{ skillId: string; reason: string; why: BlockedWhy }>
  /** Skills on the default configuration that keep questions of their own (D0 note 2026-11-05). */
  ownQuestions: number
  /** Skills on the default configuration that take the program's questions. */
  programQuestions: number
  /** Not configured skills among `change`: they become usable. */
  newlyConfigured: number
  /** Skills on the default configuration whose own different number is kept (D0 rule 6). */
  ownNumber: number
  /** Of `unchanged`, those only because they keep their own number: already said by `ownNumber`. */
  ownNumberUnchanged: number
  /** Of `unchanged`, those no other row names: not there because of their own number or their own questions. Each skill sits on one row, so the dialog's counts add up (map D3). */
  alreadyOnSettings: number
  /** Skills whose level minimums are cleared, because their levels change [REQ SC-09]. */
  minimumsCleared: number
  /** Of `change`, those that keep their own number: they take the other changes, so the dialog says them inside the change line, never as staying (D-L146). */
  changeOwnNumber: number
  /** Of `change`, those that keep their own questions (and not their own number, which is said first). */
  changeOwnQuestions: number
  /** Of `unchanged`, those only because they keep their own questions: the rest of `unchanged` is `ownNumberUnchanged` plus `alreadyOnSettings`. */
  ownQuestionsUnchanged: number
  /** For each part of the settings, how many of `change` it changes: one dialog line per part (D-L146). */
  changeKeys: Partial<Record<ChangeKey, number>>
}

/** The parts of a skill's rule the Apply dialog names one line each, in the order it lists them. "new": the skill had no rule; "other": nothing named here. */
export const CHANGE_KEYS = ["new", "model", "criteria", "levels", "outcomeLabels", "questions", "need", "evaluatorRoles", "approvalRequired", "selfEvaluation", "feedbackRequired", "studentFields", "checkOff", "other"] as const
export type ChangeKey = (typeof CHANGE_KEYS)[number]

const checkOffKey = (r: LabRule) => JSON.stringify({ on: r.model ? ruleAllowsCheckOff(r) : false, level: r.checkOff?.levelIndex ?? null, score: r.checkOff?.score ?? null })

/** Which named parts differ between a skill's rule now and after the save. A model change is said as the model alone: the new model's own fields are new, not edits. */
export function changedKeys(now: LabRule | null, next: LabRule): ChangeKey[] {
  if (!now || !now.model) return ["new"]
  const out: ChangeKey[] = []
  const diff = (a: unknown, b: unknown) => JSON.stringify(a ?? null) !== JSON.stringify(b ?? null)
  if (now.model !== next.model) out.push("model")
  else {
    const m = next.model
    const criteria =
      m === "binary" ? diff(now.qualifyingLabel, next.qualifyingLabel)
      : m === "question" ? diff(now.questionRule, next.questionRule)
      : m === "scored" ? diff(now.scaleMax, next.scaleMax) || diff(now.scoredRule, next.scoredRule)
      : diff(now.carried.minLevelIndex, next.carried.minLevelIndex)
    if (criteria) out.push("criteria")
    if (m === "demonstration" && diff(now.levels, next.levels)) out.push("levels")
    if (m === "binary" && diff(now.outcomeLabels, next.outcomeLabels)) out.push("outcomeLabels")
  }
  if (usesQuestions(next) && diff(questionsOf(now), questionsOf(next))) out.push("questions")
  if (now.need !== next.need) out.push("need")
  if (diff([...now.evaluatorRoles].sort(), [...next.evaluatorRoles].sort())) out.push("evaluatorRoles")
  if (now.approvalRequired !== next.approvalRequired) out.push("approvalRequired")
  if (now.selfEvaluation !== next.selfEvaluation) out.push("selfEvaluation")
  if (now.feedbackRequired !== next.feedbackRequired) out.push("feedbackRequired")
  if (diff(now.studentFields, next.studentFields)) out.push("studentFields")
  if (now.model === next.model && checkOffKey(now) !== checkOffKey(next)) out.push("checkOff")
  if (!out.length) out.push("other")
  return out
}

const activeSkills = (s: V2State): Skill[] => s.skills.filter((k) => k.active !== false)

/** Going into a program save, this skill's number is its own (D0 rule 6): marked already, or not the number the program had. Compared to the settings being saved only on the first save, when there is no earlier number. */
function holdsOwnNumber(k: Skill, previous: LabRule | null, program: LabRule): boolean {
  const held = panelRuleOf(k)
  if (!hasNeed(held)) return false
  if (k.ownNeed) return true
  return previous && hasNeed(previous) ? held.need !== previous.need : held.need !== program.need
}

const questionsOf = (r: Pick<LabRule, "questions">): string[] => r.questions.filter((q) => q.trim())

/** Going into a program save, this skill's questions are its own (D0 rule 6, note 2026-11-05): marked already, or not the set the program had. Compared to the set being saved only on the first save, when there is no earlier set. A skill with none has none to keep. */
function holdsOwnQuestions(k: Skill, previous: LabRule | null, program: LabRule): boolean {
  const held = questionsOf(panelRuleOf(k))
  if (!held.length || !usesQuestions(program)) return false
  if (k.ownQuestions) return true
  return !same(held, questionsOf(previous ?? program))
}

/**
 * What saving `program` would do (D0 rules 2 to 8). An Edited skill is never written. The rest take the package, keep their own number and their
 * own questions; a model that needs questions leaves a skill without any Not configured. Inactive skills count like any other (map D3) [INFER].
 */
export function planProgramApply(s: V2State, program: LabRule, opts: { only?: readonly string[] } = {}): ProgramApplyPlan {
  const previous = programRuleIn(s)
  const plan: ProgramApplyPlan = { change: [], unchanged: [], edited: [], staysNotConfigured: [], blocked: [], ownQuestions: 0, programQuestions: 0, newlyConfigured: 0, ownNumber: 0, ownNumberUnchanged: 0, alreadyOnSettings: 0, minimumsCleared: 0, changeOwnNumber: 0, changeOwnQuestions: 0, ownQuestionsUnchanged: 0, changeKeys: {} }
  const only = opts.only ? new Set(opts.only) : null
  for (const k of s.skills) {
    if (only && !only.has(k.id)) continue
    if (k.edited) {
      ;(configurationOf(s, k) === "edited" ? plan.edited : plan.staysNotConfigured).push(k.id)
      continue
    }
    const now = skillRuleOf(k)
    const next = resolveRule(program, now ?? heldPartOf(k), previous, !!k.ownNeed, !!k.ownQuestions)
    const issues: RuleIssue[] = validateRule(next)
    if (issues.length) {
      plan.blocked.push({ skillId: k.id, reason: issues[0]!.message, why: whyBlocked(issues[0]!) })
      continue
    }
    let keepsOwnQuestions = false
    if (usesQuestions(program)) {
      if (!holdsOwnQuestions(k, previous, program)) plan.programQuestions += 1
      else {
        plan.ownQuestions += 1
        keepsOwnQuestions = true
      }
    }
    const keepsOwnNumber = !!now && !!previous && hasNeed(previous) && next.need === now.need && holdsOwnNumber(k, previous, program)
    if (keepsOwnNumber) plan.ownNumber += 1
    if (now && now.levelMinimums.length > 0 && next.levelMinimums.length === 0) plan.minimumsCleared += 1
    if (now && same(next, now)) {
      plan.unchanged.push(k.id)
      if (keepsOwnNumber) plan.ownNumberUnchanged += 1
      else if (keepsOwnQuestions) plan.ownQuestionsUnchanged += 1
      if (!keepsOwnNumber && !keepsOwnQuestions) plan.alreadyOnSettings += 1
    } else {
      plan.change.push(k.id)
      if (!now) plan.newlyConfigured += 1
      if (keepsOwnNumber) plan.changeOwnNumber += 1
      else if (keepsOwnQuestions) plan.changeOwnQuestions += 1
      for (const key of changedKeys(now, next)) plan.changeKeys[key] = (plan.changeKeys[key] ?? 0) + 1
    }
  }
  return plan
}

/** Blocked skills by cause, largest first, for the save dialog [REQ SC-18]. */
export function blockedGroups(plan: Pick<ProgramApplyPlan, "blocked">): Array<{ why: BlockedWhy; words: string; count: number }> {
  const by = new Map<BlockedWhy, number>()
  for (const b of plan.blocked) by.set(b.why, (by.get(b.why) ?? 0) + 1)
  return [...by.entries()].map(([why, count]) => ({ why, words: BLOCKED_WORDS[why], count })).sort((a, b) => b.count - a.count)
}

/**
 * What a save changes for the dialog's words [REQ AE-06; map D3]. Only names: a rename of a label or level is said as a rename, not as skills changing. Check-off: whether it turns on
 * or off for the skills that take the settings, so a model change that turns it off is never silent. Cleared: what leaving the model removes [REQ SC-09].
 */
export function programSaveEffects(saved: LabRule | null, next: LabRule): { namesOnly: boolean; checkOff: "on" | "off" | null; cleared: string[] } {
  if (!saved) return { namesOnly: false, checkOff: null, cleared: [] }
  const package_ = differsFromProgram(next, saved)
  const namesOnly = package_.length > 0 && package_.every((k) => k === "outcomeLabels" || k === "levels") && engineKey(saved) === engineKey(next)
  const was = saved.model ? ruleAllowsCheckOff(saved) : false
  const now = next.model ? ruleAllowsCheckOff(next) : false
  return { namesOnly, checkOff: was === now ? null : now ? "on" : "off", cleared: modelChangeClears(saved.model, next.model) }
}

/** Who a save reaches, before it applies [REQ AE-02]: the students whose progress changes. A rename changes nobody's [REQ AE-06]. */
/** One student the save moves, with how many skills and which way (D-L146): `down` leaves Achieved, `up` reaches it, `other` moves without crossing it, `lost` goes Not configured. */
export interface StudentImpact {
  id: string
  name: string
  /** Skills whose progress changes for this student: the figure beside the name. */
  skills: number
  down: number
  up: number
  other: number
  lost: number
  /** Of `other`: moves that go forward (a higher state, or the same state with more evaluations that move the student forward) and moves that go back. */
  forward: number
  back: number
}

export interface ProgramImpact {
  /** The save changes what achievement requires, so the students line belongs in the dialog. */
  ruleChanged: boolean
  /** A to Z, never ranked. */
  students: StudentImpact[]
  /** The states students leaving Achieved land on, so the headline can name one ("In progress") or say it plainly when they differ. */
  downTo: RecordState[]
  /** How many skills each direction touches, for "on 1 skill" against "on some skills". */
  skillsDown: number
  skillsUp: number
  skillsOther: number
  skillsLost: number
  /** When every `other` move keeps its state word and they share one, that state ("15 students stay Achieved"); else null. */
  otherStays: RecordState | null
}

export function programImpact(s: V2State, program: LabRule, plan: ProgramApplyPlan): ProgramImpact {
  const previous = programRuleIn(s)
  const by = new Map<string, StudentImpact>()
  const downTo = new Set<RecordState>()
  const skillsBy = { down: new Set<string>(), up: new Set<string>(), other: new Set<string>(), lost: new Set<string>() }
  const otherStates = new Set<string>()
  const add = (studentId: string, name: string, way: "down" | "up" | "other" | "lost", skillId: string, dir: 1 | -1 | 0 = 0) => {
    const e = by.get(studentId) ?? { id: studentId, name, skills: 0, down: 0, up: 0, other: 0, lost: 0, forward: 0, back: 0 }
    e.skills += 1
    e[way] += 1
    if (way === "other" && dir > 0) e.forward += 1
    if (way === "other" && dir < 0) e.back += 1
    by.set(studentId, e)
    skillsBy[way].add(skillId)
  }
  let ruleChanged = plan.blocked.length > 0
  for (const id of plan.change) {
    const k = s.skills.find((x) => x.id === id)
    const now = k ? skillRuleOf(k) : null
    if (!now) continue
    const after = resolveRule(program, now, previous, !!k?.ownNeed, !!k?.ownQuestions)
    const impact = computeImpact(s, id, now, after, "reapply")
    if (impact.ruleChanged) ruleChanged = true
    // An Inactive skill is outside reporting scope, so its saves name nobody; its Reactivate names them (D0 rule 9).
    if (k?.active === false) continue
    for (const c of progressChanges(s, id, now, after)) {
      const way = c.from === "achieved" && c.to !== "achieved" ? "down" : c.from !== "achieved" && c.to === "achieved" ? "up" : "other"
      if (way === "down") downTo.add(c.to)
      // Which way an `other` move goes: by state, else by the evaluations that move the student forward (a looser level rule keeps Achieved but adds to them).
      const dir = Math.sign(STATE_RANK[c.to] - STATE_RANK[c.from] || c.haveTo - c.haveFrom) as 1 | -1 | 0
      if (way === "other") otherStates.add(c.from === c.to ? c.from : "*")
      add(c.studentId, c.name, way, id, dir)
    }
  }
  // A skill that goes Not configured stops counting for every student it counted for (`progressLost`).
  for (const b of plan.blocked) {
    const k = s.skills.find((x) => x.id === b.skillId)
    const now = k ? skillRuleOf(k) : null
    if (k && now && k.active !== false) for (const c of progressLost(s, b.skillId, now)) add(c.studentId, c.name, "lost", b.skillId)
  }
  return {
    ruleChanged,
    students: [...by.values()].sort((a, b) => a.name.localeCompare(b.name)),
    downTo: [...downTo],
    skillsDown: skillsBy.down.size,
    skillsUp: skillsBy.up.size,
    skillsOther: skillsBy.other.size,
    skillsLost: skillsBy.lost.size,
    otherStays: otherStates.size === 1 && !otherStates.has("*") ? ([...otherStates][0] as RecordState) : null,
  }
}

export interface ProgramApplyResult {
  state: V2State
  written: string[]
  plan: ProgramApplyPlan
}

/**
 * Save the program settings and write them to the planned skills, each through saveLabRule (its own rule version and audit line). A skill
 * that needs questions first keeps its record and takes the model, so it reads Not configured until it has them (D0). Refuses settings
 * that are not valid on their own [REQ SC-18].
 */
export function saveProgramSettings(s: V2State, program: LabRule, opts: { at: string; byId: string; only?: readonly string[] }): { ok: true; result: ProgramApplyResult } | { ok: false; issues: RuleIssue[] } {
  const issues = validateRule(program)
  if (issues.length) return { ok: false, issues }
  const plan = planProgramApply(s, program, opts)
  const previous = programRuleIn(s)
  const only = opts.only ? new Set(opts.only) : null
  // Remembered now: this save can make a skill's number equal the program's, and the next save must not read that as following (D0 rule 6).
  // A Custom skill is not written at all (D0 rule 7).
  const scoped = s.skills.filter((k) => !k.edited && (!only || only.has(k.id)))
  const keepers = new Set(scoped.filter((k) => holdsOwnNumber(k, previous, program)).map((k) => k.id))
  // The same for questions. A mark goes when the skill has no set left to keep, or the model no longer uses questions: what it takes next is the program's.
  const setKeepers = new Set(scoped.filter((k) => holdsOwnQuestions(k, previous, program)).map((k) => k.id))
  const setDrops = new Set(scoped.filter((k) => k.ownQuestions && !setKeepers.has(k.id)).map((k) => k.id))
  let state: V2State = { ...s, programSettings: { rule: copyRule(program), at: opts.at } }
  const written: string[] = []
  for (const id of plan.change) {
    const k = state.skills.find((x) => x.id === id)
    if (!k) continue
    const r = saveLabRule(state, id, resolveRule(program, skillRuleOf(k) ?? heldPartOf(k), previous, !!k.ownNeed, !!k.ownQuestions), { at: opts.at, byId: opts.byId, mode: null, edited: false })
    if (r.ok && r.written) {
      state = r.state
      written.push(id)
    }
  }
  const blocked = new Set(plan.blocked.map((b) => b.skillId))
  if (blocked.size) {
    state = {
      ...state,
      skills: state.skills.map((k): Skill => (blocked.has(k.id) ? { ...k, model: program.model, configured: false, published: false, config: toSkillConfig(k.config, resolveRule(program, skillRuleOf(k) ?? heldPartOf(k), previous, !!k.ownNeed, !!k.ownQuestions)) } : k)),
    }
  }
  if (keepers.size) state = { ...state, skills: state.skills.map((k): Skill => (keepers.has(k.id) && !k.ownNeed ? { ...k, ownNeed: true } : k)) }
  if (setKeepers.size || setDrops.size) {
    state = {
      ...state,
      skills: state.skills.map((k): Skill => {
        if (setKeepers.has(k.id) && !k.ownQuestions) return { ...k, ownQuestions: true }
        if (!setDrops.has(k.id)) return k
        const { ownQuestions: _dropped, ...rest } = k
        return rest
      }),
    }
  }
  return { ok: true, result: { state, written, plan } }
}

// ---------------------------------------------------------------------------------------------------------------------
// The edit panel (map D1a, D-L91): one draft of the whole rule, one Save changes.

/** The rule a skill's panel opens on. A skill with no model yet opens with nothing selected [REQ SC-02]. */
export const panelRuleOf = (k: Skill): LabRule => heldPartOf(k)

/**
 * What blocks Save changes [REQ SC-18]. A form with no model, or a model still without its questions, may be saved: SC-18's blocks apply to what
 * exists, not to the absence of questions, and such a skill stays Not configured (map D1a States) [INFER]. What makes an evaluation count waits
 * for the questions it talks about.
 */
export function panelIssues(rule: LabRule): RuleIssue[] {
  return rawPanelIssues(rule).map((i) => ({ ...i, message: PANEL_WORDS[i.id] ?? i.message }))
}

/** Set on a skill, not on this page (map D3 "Not on the page"), so a program save never reports them. */
const PER_SKILL_FIELD = /^cfg-(lmin|distinct|setting)/

/**
 * What blocks Save on Evaluation settings [REQ SC-18], in the words its rows use. The number has one message on every surface, whatever is wrong with it, and is
 * refused above the limit as the panel and the table refuse it.
 */
export function programIssues(rule: LabRule): RuleIssue[] {
  const needMessage = `Enter 1 to ${TIMES_MAX}.`
  const issues = validateRule(rule)
    .filter((i) => !PER_SKILL_FIELD.test(i.field) && i.id !== "cfg-role-preceptor:labonly")
    .map((i) => ({ ...i, message: i.field === "cfg-need" ? needMessage : PANEL_WORDS[i.id] ?? i.message }))
  return rule.model && Number.isInteger(rule.need) && rule.need > TIMES_MAX ? [...issues, { id: "cfg-need:max", section: "rule" as const, field: "cfg-need", message: needMessage }] : issues
}

/** The same words for one problem, for a page that validates with `validateRule` (the bulk page). */
export const inPanelWords = (i: RuleIssue): RuleIssue => ({ ...i, message: PANEL_WORDS[i.id] ?? i.message })

/** Problems in the panel's own words (map D1a): "Labels", "Which one qualifies", "Counts when", "Value". The pages keep theirs. */
const PANEL_WORDS: Record<string, string> = {
  "cfg-label-0:blank": "Enter the first label.",
  "cfg-label-1:blank": "Enter the second label.",
  "cfg-label-1:same": "The two labels need different words.",
  "cfg-qualifying:missing": "Choose which one qualifies.",
  "cfg-counts-from:missing": "Choose at least one level.",
  "cfg-qrule:missing": "Choose when it counts.",
  "cfg-srule:missing": "Choose when it counts.",
}

function rawPanelIssues(rule: LabRule): RuleIssue[] {
  const range = (): RuleIssue[] => (Number.isInteger(rule.need) && rule.need > TIMES_MAX ? [{ id: "cfg-need:max", section: "rule", field: "cfg-need", message: `Enter 1 to ${TIMES_MAX}.` }] : [])
  // No model yet: only a number that was typed and is not a number of times can be wrong.
  if (!rule.model) return !Number.isNaN(rule.need) && !hasNeed(rule) ? [{ id: "cfg-need:need", section: "rule", field: "cfg-need", message: `Enter 1 to ${TIMES_MAX}.` }] : range()
  const waiting = ruleNeedsQuestions(rule)
  const issues = validateRule(rule).filter((i) => !(waiting && /^cfg-(add-question|question|qrule|srule)/.test(i.field)))
  return [...issues, ...range()]
}

export interface DraftWord {
  /** The form's rule. */
  rule: LabRule
  /** What Configuration read when the form opened. */
  baseEdited: boolean
  baseRule: LabRule
  program: LabRule | null
  /** Default was chosen in this form on a skill that was Custom. */
  reset: boolean
  /** Custom is chosen in the form's Evaluation settings control: one click, whatever the values (D-L97). */
  custom?: boolean
}

/** Whether the form's package is this skill's own (D0 rules 4, 5, 7): at once, whatever is saved. Hand-set to match still counts. */
export function draftEdited({ rule, baseEdited, baseRule, program, reset, custom }: DraftWord): boolean {
  if (!rule.model) return false
  if (!program || custom) return true
  if (reset) return differsFromProgram(rule, program).length > 0
  return baseEdited || differsFromProgram(rule, baseRule).length > 0
}

/** Configuration as the form reads at this moment. Not configured wins the word (D0). */
export function draftConfiguration(w: DraftWord): Configuration {
  if (!w.rule.model || ruleNeedsQuestions(w.rule)) return "not-configured"
  return draftEdited(w) ? "edited" : "default"
}

// Read at call time, so the rule's label follows the program's noun ("Moves student toward achieving the skill when", 2026-11-11).
const MODEL_CLEARS = (): Record<NonNullable<LabRule["model"]>, string[]> => ({
  demonstration: ["Levels", "Levels that count", "Minimum at each level", "Checked-off students get"],
  binary: ["Labels", "Which one qualifies"],
  question: [movesWhen(), "Named questions"],
  scored: ["Scale", movesWhen(), "Checked-off students get"],
})

/** What leaving a model clears, in the admin's words [REQ SC-09; map D1a]. */
export function modelChangeClears(from: LabRule["model"], to: LabRule["model"]): string[] {
  if (!from || !to || from === to) return []
  const usesBoth = usesQuestions({ model: from }) && usesQuestions({ model: to })
  return [...MODEL_CLEARS()[from], ...(usesQuestions({ model: from }) && !usesBoth ? ["Questions"] : [])]
}

/**
 * Choosing another model in the form (map D1a, "What a model change clears") [REQ SC-09]: dependents rebuild, the rest stays. The new model's rows
 * fill from what this skill last saved under that model, else from Evaluation settings when the program uses it, else empty with nothing
 * preselected [REQ SC-02] [INFER]. Questions stay between Questions and Score on a scale [REQ SC-04].
 */
export function rebuildForModel(rule: LabRule, model: NonNullable<LabRule["model"]>, program: LabRule | null, saved: LabRule | null): LabRule {
  if (rule.model === model) return rule
  const keepQuestions = usesQuestions(rule) && usesQuestions({ model })
  const own = saved?.model === model ? saved : null
  const src = own ?? (program?.model === model ? program : null)
  const co = rule.checkOff ?? { enabled: null, levelIndex: null, score: null }
  // Group check-off stays as it reads now (map D1a, the Who does what group is kept). A seeded skill holds no choice and reads its model's default, which differs by model.
  const enabled = co.enabled ?? (rule.model ? ruleAllowsCheckOff(rule) : null)
  return {
    ...rule,
    model,
    outcomeLabels: src ? [...src.outcomeLabels] as [string, string] : ["", ""],
    qualifyingLabel: src ? src.qualifyingLabel : null,
    levels: src ? [...src.levels] : model === "demonstration" ? ["", ""] : [],
    levelMinimums: own ? own.levelMinimums.map((m) => ({ ...m })) : [],
    scaleMax: src ? src.scaleMax : Number.NaN,
    scoredRule: src?.scoredRule ? { ...src.scoredRule } : null,
    questionRule: src?.questionRule ? (JSON.parse(JSON.stringify(src.questionRule)) as LabRule["questionRule"]) : null,
    // A skill with no questions of its own takes the program's when it uses this model (D0 note 2026-11-05).
    questions: keepQuestions && rule.questions.some((q) => q.trim()) ? rule.questions : own ? [...own.questions] : program?.model === model ? [...program.questions] : keepQuestions ? rule.questions : [],
    checkOff: { enabled, levelIndex: src?.checkOff?.levelIndex ?? null, score: src?.checkOff?.score ?? null },
    carried: { ...rule.carried, minLevelIndex: src ? src.carried.minLevelIndex : null },
  }
}

/** Back to Default, in the form (D-L91, D-L97): the package from the program; the skill's own part stays unless a model change clears it (D0 rule 8). */
export function defaultDraftOf(rule: LabRule, program: LabRule): LabRule {
  return resolveRule(program, hasNeed(rule) ? rule : { ...rule, need: Number.NaN })
}

/**
 * The students whose progress changes if this rule is saved (D0 rule 9) [REQ AE-02], before it applies. Nobody for an Inactive skill, outside
 * reporting scope. A skill that goes Not configured stops counting for every student it counted for (`progressLost`), and those are the students whose page changes; one that
 * becomes usable gains whatever its evidence earns.
 */
export function settingsImpact(s: V2State, k: Skill, next: LabRule): Array<{ id: string; name: string }> {
  if (k.active === false) return []
  const now = skillRuleOf(k)
  const usableNext = !!next.model && !ruleNeedsQuestions(next)
  if (now && !usableNext) return progressLost(s, k.id, now).map((c) => ({ id: c.studentId, name: c.name })).sort((a, b) => a.name.localeCompare(b.name))
  if (!usableNext) return []
  return progressMoves(s, k.id, now ?? { ...next, model: null }, next).map((c) => ({ id: c.studentId, name: c.name })).sort((a, b) => a.name.localeCompare(b.name))
}

/** Reactivate names who changes when the skill was edited while Inactive (map D1a, D0 rule 9) [INFER]; nobody otherwise. */
export function reactivateImpact(s: V2State, k: Skill): Array<{ id: string; name: string }> {
  const base = k.inactiveBaseline as LabRule | undefined
  if (!base) return []
  const now = skillRuleOf(k)
  if (!now) return progressLost(s, k.id, { ...emptyRule(), ...base }).map((c) => ({ id: c.studentId, name: c.name })).sort((a, b) => a.name.localeCompare(b.name))
  return progressMoves(s, k.id, { ...emptyRule(), ...base }, now).map((c) => ({ id: c.studentId, name: c.name })).sort((a, b) => a.name.localeCompare(b.name))
}

/** The rule a skill had before its first save while Inactive, kept for its Reactivate. */
const keepInactiveBaseline = (k: Skill): Partial<Skill> => (k.active === false && k.inactiveBaseline === undefined && skillRuleOf(k) ? { inactiveBaseline: copyRule(skillRuleOf(k)!) } : {})

export type SettingsResult = { ok: true; state: V2State } | { ok: false; error: string }

/**
 * Save changes from the panel: the one writer of a skill's settings. A complete rule goes through saveLabRule (its own rule version and audit
 * line). A rule with no model, or a model without its questions, is held on the skill, which stays Not configured and out of mapping and
 * submission [REQ IM-09, D-L90]. Completed evaluations are never written [REQ RV-05].
 */
export function saveSkillSettings(s: V2State, skillId: string, rule: LabRule, opts: { at: string; byId: string; edited: boolean }): SettingsResult {
  const issues = panelIssues(rule)
  if (issues.length) return { ok: false, error: issues[0]!.message }
  const k = s.skills.find((x) => x.id === skillId)
  if (!k) return { ok: false, error: "This skill is no longer in the library." }
  const keep = keepInactiveBaseline(k)
  // Someone typing the program's own number is the way back to following it (D0 rule 6). A save that leaves the number alone changes nothing here.
  const programNeed = programRuleIn(s)?.need
  const backToProgram = !!k.ownNeed && hasNeed(rule) && rule.need === programNeed && rule.need !== panelRuleOf(k).need
  // The same for questions: giving the skill the program's set is the way back. A save that leaves its questions alone changes nothing here.
  const programSet = programRuleIn(s)
  const backToProgramSet = !!k.ownQuestions && !!programSet && same(questionsOf(rule), questionsOf(programSet)) && !same(questionsOf(rule), questionsOf(panelRuleOf(k)))
  const mark = (state: V2State) => {
    if (!Object.keys(keep).length && !backToProgram && !backToProgramSet) return state
    return {
      ...state,
      skills: state.skills.map((x) => {
        if (x.id !== skillId) return x
        const { ownNeed: _own, ownQuestions: _ownSet, ...others } = x
        return { ...others, ...(!backToProgram && x.ownNeed ? { ownNeed: x.ownNeed } : {}), ...(!backToProgramSet && x.ownQuestions ? { ownQuestions: x.ownQuestions } : {}), ...keep }
      }),
    }
  }
  if (rule.model && !ruleNeedsQuestions(rule)) {
    const r = saveLabRule(s, skillId, rule, { at: opts.at, byId: opts.byId, mode: null, edited: opts.edited })
    return r.ok ? { ok: true, state: mark(r.state) } : { ok: false, error: r.error }
  }
  const { edited: _dropped, ...rest } = k
  const config = rule.model || hasNeed(rule) ? toSkillConfig(k.config, { ...rule, questions: rule.questions.filter((q) => q.trim()) }) : k.config
  const held: Skill = { ...rest, model: rule.model, configured: false, published: false, config, ...(opts.edited ? { edited: true } : {}) }
  return { ok: true, state: mark(appendAudit({ ...s, skills: s.skills.map((x) => (x.id === skillId ? held : x)) }, opts.byId, "Saved settings, not configured yet", k.name, opts.at)) }
}

/** Use default configuration, in one step (bulk and tests; the panel goes through its form). Refused when the program has saved nothing. */
export function applyDefaultConfiguration(s: V2State, skillId: string, opts: { at: string; byId: string }): SettingsResult {
  const program = programRuleIn(s)
  const k = s.skills.find((x) => x.id === skillId)
  if (!program || !k) return { ok: false, error: "There are no evaluation settings to go back to." }
  return saveSkillSettings(s, skillId, defaultDraftOf(panelRuleOf(k), program), { ...opts, edited: false })
}

/**
 * Copy settings [REQ IM-14]: each target takes the source's package and keeps its own number, minimums and questions. A target that would
 * need questions it does not have is left as it is and named.
 */
export function copySettings(s: V2State, sourceId: string, targetIds: readonly string[], opts: { at: string; byId: string }): { state: V2State; written: string[]; skipped: Array<{ id: string; reason: string }> } {
  const source = s.skills.find((k) => k.id === sourceId)
  const rule = source ? skillRuleOf(source) : null
  const out = { state: s, written: [] as string[], skipped: [] as Array<{ id: string; reason: string }> }
  if (!rule) return { ...out, skipped: targetIds.map((id) => ({ id, reason: "The chosen skill has no settings to copy." })) }
  for (const id of targetIds) {
    if (id === sourceId) continue
    const k = out.state.skills.find((x) => x.id === id)
    if (!k) continue
    const r = saveLabRule(out.state, id, resolveRule(rule, skillRuleOf(k)), { at: opts.at, byId: opts.byId, mode: null })
    if (r.ok && r.written) {
      out.state = r.state
      out.written.push(id)
    } else out.skipped.push({ id, reason: r.ok ? r.reason : r.error })
  }
  return out
}

/** Active skills not configured [REQ IM-10]. */
export function notConfiguredIds(s: V2State, only?: readonly string[]): string[] {
  const keep = only ? new Set(only) : null
  return activeSkills(s).filter((k) => configurationOf(s, k) === "not-configured" && (!keep || keep.has(k.id))).map((k) => k.id)
}

export type TimesNeededResult = SettingsResult

/**
 * Times needed for one skill, on any skill, Active or Inactive, configured or not (D-L92, D-L93). It never changes Configuration (D0 rule 5).
 */
export function setTimesNeeded(s: V2State, skillId: string, need: number, opts: { at: string; byId: string }): TimesNeededResult {
  if (!Number.isInteger(need) || need < 1 || need > TIMES_MAX) return { ok: false, error: `Enter a whole number from 1 to ${TIMES_MAX}.` }
  const k = s.skills.find((x) => x.id === skillId)
  if (!k) return { ok: false, error: "This skill is no longer in the library." }
  return saveSkillSettings(s, skillId, { ...panelRuleOf(k), need }, { ...opts, edited: !!k.edited })
}

/**
 * The students whose progress changes if this skill's Times needed becomes `need` (D0 rule 9) [REQ AE-02]: the rule engine run over the evidence
 * held, before and after. Empty when nobody's does, on a skill not configured (it holds no progress), or on an Inactive skill (outside reporting
 * scope; its Reactivate names them).
 */
export function timesNeededImpact(s: V2State, skillId: string, need: number): Array<{ id: string; name: string }> {
  const k = s.skills.find((x) => x.id === skillId)
  const now = k ? skillRuleOf(k) : null
  if (!k || !now || k.active === false || configurationOf(s, k) === "not-configured") return []
  return computeImpact(s, skillId, now, { ...copyRule(now), need }, "reapply").changed.map((c) => ({ id: c.studentId, name: c.name }))
}

/** Highest times needed a cell accepts (a typo guard, not a rule). */
export const TIMES_MAX = 50

export interface TimesCell {
  /** What the skill needs: its own number, else the program's number, else null ("Not set"). */
  value: number | null
  /** The program's number, or null before the program saves its settings (never a Prism default) [REQ SC-02]. */
  programNeed: number | null
  /** The skill keeps its own number (only when both exist): one that differs from the program's, or one someone changed that has come to match it (D0 rule 6). */
  differs: boolean
}

/** The times needed cell for one skill, from the same sources as the Evaluation settings list (`timesRows`), so the Library column and its Different number filter always agree. */
export function timesCellOf(s: V2State, skillId: string): TimesCell {
  const programRule = programSettingsOf(s)?.rule ?? null
  const programNeed = programRule && hasNeed(programRule) ? programRule.need : null
  const k = s.skills.find((x) => x.id === skillId)
  const held = k ? panelRuleOf(k) : null
  const value = held && hasNeed(held) ? held.need : programNeed
  return { value, programNeed, differs: value !== null && programNeed !== null && (value !== programNeed || !!k?.ownNeed) }
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
    if (timesCellOf(state, id).value === need) {
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
  /** Configuration reads Custom. */
  edited: boolean
  /** Keeps its own number even when it matches the program's (Skill.ownNeed). */
  own: boolean
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
    out.push({ id: k.id, name: row.name, category: row.section, need, value: need ?? programNeed, configured: !!now, edited: configurationOf(s, k) === "edited", own: !!k.ownNeed })
  }
  return out
}
