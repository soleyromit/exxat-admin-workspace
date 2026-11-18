/**
 * Evaluation methods (Proposed, D-EM1116; idea from Sankalp's prototype of 2026-11-16, F6): the program's ways of judging a skill, each named
 * and reusable. Pure functions over V2State, so the page, the tests and any later list page read one source.
 *
 * Minimum data change: one lab overlay, `V2State.methodEdits`, holding method names, the rules of methods other than the program's, and which
 * skills use them. The engine is unchanged:
 *   - The program's method IS the program's saved rule (`programSettings`): every skill on Default and every new skill uses it. Its save is the
 *     existing Evaluation settings save (first save, Apply dialog). Before the program saves anything, there is no method [REQ SC-02].
 *   - Every other method is written to its skills as their own (Custom) settings through `saveSkillSettings`; each skill keeps its own Times
 *     needed, minimums and distinct-evaluator count.
 *   - With no overlay yet, methods are read from the store: the program rule, plus one method per distinct Custom rule. The first write
 *     stores what was read, so ids and names stay put.
 *
 * Not decided here: which method new skills use when it is not the program's (open for Romit), and where a skill changes its method (the
 * prototype puts it on the list page).
 */
import type { Skill, V2State } from "@/lib/v2/types"
import { copyRule, countingLevels, emptyRule, fromV2, LAB_MODEL_LABEL, programRuleIn, type LabRule } from "./configure"
import { passChip } from "./rule-path"
import { configurationOf, panelRuleOf, programIssues, saveSkillSettings, settingsImpact, skillRuleOf } from "./program-settings"

export const PROGRAM_METHOD_ID = "m-program"

export interface StoredMethod {
  id: string
  name: string
  /** Optional one line, shown under the name on the list (round 3, prototype 30). */
  description?: string
  rule: LabRule
  skillIds: string[]
}

export interface MethodsOverlay {
  /** The program method's name; also marks a program method created before its first save. */
  programName?: string
  programDescription?: string
  methods: StoredMethod[]
}

export interface EvaluationMethod {
  id: string
  name: string
  description?: string
  /** The method's rule; the program's saved rule for the program method, an empty rule before its first save. */
  rule: LabRule
  /** The program's method: Default skills and new skills use it. */
  program: boolean
  /** False only for a program method not saved yet. */
  saved: boolean
  /** Skills that use it (Default skills for the program's). */
  skillIds: string[]
}

const NAME_MAX = 60

/** The part of a rule that belongs to the method, not to one skill: no number, minimums or distinct evaluators. */
export function methodKey(rule: LabRule): string {
  return JSON.stringify({ ...rule, need: 0, levelMinimums: [], settingMinimums: [], distinctEvaluators: 1, carried: { minLevelIndex: rule.carried?.minLevelIndex ?? null } })
}

/**
 * A starting name from the type, for methods read from the seed: short and honest (D-EM1116-b, Romit 2026-11-16 "Supervised levels",
 * "Approved, with review"). The program's levels method reads "Supervised levels"; with qualifiers the type word is shortened ("Levels").
 */
export function baseName(rule: LabRule | null, short = false): string {
  if (!rule?.model) return "Evaluation method"
  if (rule.model === "demonstration") return short ? "Levels" : "Supervised levels"
  if (rule.model === "binary") return short ? "Approved" : "Approved or not"
  if (rule.model === "scored") return short ? "Scored" : LAB_MODEL_LABEL.scored
  return LAB_MODEL_LABEL[rule.model]
}

export function overlayOf(s: V2State): MethodsOverlay | null {
  const o = s.methodEdits as MethodsOverlay | undefined
  if (!o || typeof o !== "object" || !Array.isArray(o.methods)) return null
  return { programName: typeof o.programName === "string" ? o.programName : undefined, programDescription: typeof o.programDescription === "string" ? o.programDescription : undefined, methods: o.methods.map((m) => ({ ...m, rule: { ...emptyRule(), ...m.rule } })) }
}

const unique = (name: string, taken: Set<string>): string => {
  let n = name
  for (let i = 2; taken.has(n.toLowerCase()); i++) n = `${name} ${i}`
  taken.add(n.toLowerCase())
  return n
}

/**
 * A readable name for a method read from the seed: the type, then what sets it apart (approval, self rating), then what moves a student forward
 * when that is still not enough. A number is the last resort.
 */
function derivedName(rule: LabRule, taken: ReadonlySet<string>): string {
  const quals = [rule.selfEvaluation ? "self-rated" : "", rule.approvalRequired ? "with review" : ""].filter(Boolean)
  const first = quals.length ? `${baseName(rule, true)}, ${quals.join(", ")}` : baseName(rule)
  if (!taken.has(first.toLowerCase())) return first
  // Two methods read alike: the stricter one names where it starts ("from with assistance"), not a number.
  const named = rule.model === "demonstration" ? countingLevels(rule) : []
  const from = named.length ? named[named.length - 1]! : passChip(rule)?.text
  return from ? `${first}, from ${from.charAt(0).toLowerCase()}${from.slice(1)}` : first
}

/** Custom skills grouped by the method part of their rule; ids from the first skill, so they are the same on every read. */
function derivedGroups(s: V2State, skip: ReadonlySet<string>, taken: Set<string>): StoredMethod[] {
  const groups = new Map<string, { rule: LabRule; ids: string[] }>()
  for (const k of s.skills) {
    if (!k.edited || skip.has(k.id)) continue
    const rule = skillRuleOf(k)
    if (!rule) continue
    const key = methodKey(rule)
    const g = groups.get(key)
    if (g) g.ids.push(k.id)
    else groups.set(key, { rule, ids: [k.id] })
  }
  return [...groups.values()].map((g) => {
    const name = unique(derivedName(g.rule, taken), taken)
    return { id: `m-own-${g.ids[0]}`, name, rule: copyRule(g.rule), skillIds: g.ids }
  })
}

/** Default skills: what the program method reaches. */
function programSkillIds(s: V2State): string[] {
  return s.skills.filter((k) => configurationOf(s, k) === "default").map((k) => k.id)
}

/** Every method, the program's first. A new program has none [REQ SC-02]. */
export function methodsOf(s: V2State): EvaluationMethod[] {
  const o = overlayOf(s)
  const program = programRuleIn(s)
  const out: EvaluationMethod[] = []
  const taken = new Set<string>()
  if (program || o?.programName !== undefined) {
    const name = o?.programName ?? baseName(program)
    taken.add(name.toLowerCase())
    out.push({ id: PROGRAM_METHOD_ID, name, ...(o?.programDescription ? { description: o.programDescription } : {}), rule: program ?? emptyRule(), program: true, saved: !!program, skillIds: program ? programSkillIds(s) : [] })
  }
  const live = new Set(s.skills.map((k) => k.id))
  const stored = o?.methods ?? []
  for (const m of stored) taken.add(m.name.toLowerCase())
  const claimed = new Set(stored.flatMap((m) => m.skillIds))
  for (const m of stored) out.push({ id: m.id, name: m.name, ...(m.description ? { description: m.description } : {}), rule: m.rule, program: false, saved: true, skillIds: m.skillIds.filter((id) => live.has(id) && s.skills.find((k) => k.id === id)?.edited) })
  // Custom skills no stored method names yet (given their own settings elsewhere since): read as methods of their own.
  for (const m of derivedGroups(s, claimed, taken)) out.push({ ...m, program: false, saved: true })
  return out
}

export const methodById = (s: V2State, id: string | null | undefined): EvaluationMethod | null => (id ? methodsOf(s).find((m) => m.id === id) ?? null : null)

/** What is stored after a write: every method as read now, so a derived one keeps its id and name. */
function materialize(s: V2State): MethodsOverlay {
  const all = methodsOf(s)
  const program = all.find((m) => m.program)
  return { ...(program ? { programName: program.name, ...(program.description ? { programDescription: program.description } : {}) } : {}), methods: all.filter((m) => !m.program).map((m) => ({ id: m.id, name: m.name, ...(m.description ? { description: m.description } : {}), rule: copyRule(m.rule), skillIds: [...m.skillIds] })) }
}

/** Program-wide details (D-EM1116-c, lib/lab/details.ts) share the overlay: every method write keeps them. */
const withOverlay = (s: V2State, o: MethodsOverlay): V2State => {
  const details = (s.methodEdits as { details?: unknown } | undefined)?.details
  return { ...s, methodEdits: details === undefined ? o : { ...o, details } }
}

/** Name rules: required, at most 60 characters, not the name of another method (case ignored). */
export function nameIssue(s: V2State, name: string, exceptId?: string): string | null {
  const t = name.trim()
  if (!t) return "Give the method a name."
  if (t.length > NAME_MAX) return `Use ${NAME_MAX} characters or fewer.`
  if (methodsOf(s).some((m) => m.id !== exceptId && m.name.trim().toLowerCase() === t.toLowerCase())) return `A method called "${t}" already exists.`
  return null
}

let seq = 0
const newId = (): string => `m-${Date.now().toString(36)}-${(seq++).toString(36)}`

/**
 * A new method with nothing chosen [REQ SC-02]. In a program with no method yet it is the program's method: its first save is the program's
 * first save, which configures the skills after the Apply dialog.
 */
export function createMethod(s: V2State, name: string, id: string = newId()): { ok: true; state: V2State; id: string } | { ok: false; error: string } {
  const issue = nameIssue(s, name)
  if (issue) return { ok: false, error: issue }
  const o = materialize(s)
  if (!methodsOf(s).some((m) => m.program)) return { ok: true, state: withOverlay(s, { ...o, programName: name.trim() }), id: PROGRAM_METHOD_ID }
  return { ok: true, state: withOverlay(s, { ...o, methods: [...o.methods, { id, name: name.trim(), rule: emptyRule(), skillIds: [] }] }), id }
}

/** Name and description together, from the method page's own fields (round 3). An empty description clears it. */
export function updateMethodMeta(s: V2State, id: string, meta: { name: string; description: string }): { ok: true; state: V2State } | { ok: false; error: string } {
  const r = renameMethod(s, id, meta.name)
  if (!r.ok) return r
  const o = overlayOf(r.state) ?? { methods: [] }
  const d = meta.description.trim() || undefined
  if (id === PROGRAM_METHOD_ID) return { ok: true, state: withOverlay(r.state, { ...o, programDescription: d }) }
  return { ok: true, state: withOverlay(r.state, { ...o, methods: o.methods.map((m) => (m.id === id ? { ...m, description: d } : m)) }) }
}

export function renameMethod(s: V2State, id: string, name: string): { ok: true; state: V2State } | { ok: false; error: string } {
  const issue = nameIssue(s, name, id)
  if (issue) return { ok: false, error: issue }
  const o = materialize(s)
  if (id === PROGRAM_METHOD_ID) return { ok: true, state: withOverlay(s, { ...o, programName: name.trim() }) }
  if (!o.methods.some((m) => m.id === id)) return { ok: false, error: "This method is no longer here." }
  return { ok: true, state: withOverlay(s, { ...o, methods: o.methods.map((m) => (m.id === id ? { ...m, name: name.trim() } : m)) }) }
}

/** "{name} (copy)", then "(copy 2)": the same rule, no skills. */
export function duplicateMethod(s: V2State, id: string, newMethodId: string = newId()): { ok: true; state: V2State; id: string } | { ok: false; error: string } {
  const source = methodById(s, id)
  if (!source) return { ok: false, error: "This method is no longer here." }
  const names = new Set(methodsOf(s).map((m) => m.name.toLowerCase()))
  let name = `${source.name} (copy)`
  for (let i = 2; names.has(name.toLowerCase()); i++) name = `${source.name} (copy ${i})`
  const o = materialize(s)
  return { ok: true, state: withOverlay(s, { ...o, methods: [...o.methods, { id: newMethodId, name, rule: copyRule(source.rule), skillIds: [] }] }), id: newMethodId }
}

/** Why a method cannot be deleted, or null. The program's saved method reaches every Default and new skill; one in use has skills to move first. */
export function deleteBlocked(m: EvaluationMethod): string | null {
  if (m.program && m.saved) return "New skills use this method"
  if (m.skillIds.length) return `Used by ${m.skillIds.length} ${m.skillIds.length === 1 ? "skill" : "skills"}`
  return null
}

export function deleteMethod(s: V2State, id: string): { ok: true; state: V2State } | { ok: false; error: string } {
  const m = methodById(s, id)
  if (!m) return { ok: false, error: "This method is no longer here." }
  const blocked = deleteBlocked(m)
  if (blocked) return { ok: false, error: `${blocked}.` }
  const o = materialize(s)
  if (m.program) {
    const { programName: _gone, programDescription: _d, ...rest } = o
    return { ok: true, state: withOverlay(s, rest) }
  }
  return { ok: true, state: withOverlay(s, { ...o, methods: o.methods.filter((x) => x.id !== id) }) }
}

/** A skill's rule under a method: the method's part, the skill's own number, minimums and distinct evaluators. */
export function skillRuleUnder(method: LabRule, k: Skill): LabRule {
  const own = skillRuleOf(k) ?? panelRuleOf(k)
  const sameLevels = JSON.stringify(own.levels) === JSON.stringify(method.levels)
  return {
    ...copyRule(method),
    need: Number.isInteger(own.need) && own.need >= 1 ? own.need : method.need,
    settingMinimums: own.settingMinimums,
    distinctEvaluators: own.distinctEvaluators,
    levelMinimums: sameLevels ? own.levelMinimums : [],
  }
}

/** Students whose progress changes if a method other than the program's is saved with this rule [REQ AE-02]. */
export function methodImpact(s: V2State, id: string, rule: LabRule): Array<{ id: string; name: string }> {
  const m = methodById(s, id)
  if (!m || m.program) return []
  const seen = new Map<string, string>()
  for (const sid of m.skillIds) {
    const k = s.skills.find((x) => x.id === sid)
    if (!k) continue
    for (const p of settingsImpact(s, k, skillRuleUnder(rule, k))) seen.set(p.id, p.name)
  }
  return [...seen].map(([pid, name]) => ({ id: pid, name })).sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Save a method other than the program's: the rule is stored and written to each of its skills as their own settings, each keeping its own
 * number. Refuses a rule that cannot be satisfied [REQ SC-18]. Completed evaluations are never written; whether they count follows the rule [REQ AE-02].
 */
export function saveMethod(s: V2State, id: string, rule: LabRule, opts: { at: string; byId: string }): { ok: true; state: V2State; written: number; failed: string[] } | { ok: false; error: string } {
  if (id === PROGRAM_METHOD_ID) return { ok: false, error: "The program's method is saved through Evaluation methods." }
  const issues = programIssues(rule)
  if (issues.length) return { ok: false, error: issues[0]!.message }
  const m = methodById(s, id)
  if (!m) return { ok: false, error: "This method is no longer here." }
  const o = materialize(s)
  let state = withOverlay(s, { ...o, methods: o.methods.map((x) => (x.id === id ? { ...x, rule: copyRule(rule) } : x)) })
  let written = 0
  const failed: string[] = []
  for (const sid of m.skillIds) {
    const k = state.skills.find((x) => x.id === sid)
    if (!k) continue
    const r = saveSkillSettings(state, sid, skillRuleUnder(rule, k), { ...opts, edited: true })
    if (r.ok) {
      state = r.state
      written++
    } else failed.push(k.name)
  }
  return { ok: true, state, written, failed }
}

/** The rule of a seeded Custom skill as a method rule, for tests. */
export const methodRuleOfSkill = (k: Skill): LabRule | null => (k.model && k.config ? fromV2(k) : null)

// =====================================================================================================================
// Appended 2026-11-16 by the Skill lists worker (D-LS1116-b, Proposed). A skill picks its method on a list's page (prototype 11-16:
// "Method, all lists"): the method is the skill's, the same on every list. Existing code above is unchanged; this block only reads it.
// =====================================================================================================================
// Hoisted like any import; kept in this block so the code above stays as it was.
import { applyDefaultConfiguration } from "./program-settings"

/** Methods a skill can be given: saved, with a way of judging chosen [REQ SC-02]. The program's first. */
export function choosableMethods(s: V2State): EvaluationMethod[] {
  return methodsOf(s).filter((m) => m.saved && !!m.rule.model)
}

/** The method a skill uses now, or null (Not configured: nothing is assumed, REQ SC-01, SC-02). */
export function methodOfSkill(s: V2State, skillId: string): EvaluationMethod | null {
  return methodsOf(s).find((m) => m.skillIds.includes(skillId)) ?? null
}

/** The rule the skill would have under that method, keeping its own number, minimums and distinct evaluators. Null when the method cannot be given. */
export function skillRuleForMethod(s: V2State, skillId: string, methodId: string): LabRule | null {
  const k = s.skills.find((x) => x.id === skillId)
  const m = methodById(s, methodId)
  if (!k || !m || !m.saved || !m.rule.model) return null
  return skillRuleUnder(m.rule, k)
}

/** Students whose progress changes if the skill moves to this method [REQ AE-02]. Empty when nothing moves or the method is already its own. */
export function skillMethodImpact(s: V2State, skillId: string, methodId: string): Array<{ id: string; name: string }> {
  const k = s.skills.find((x) => x.id === skillId)
  const rule = skillRuleForMethod(s, skillId, methodId)
  if (!k || !rule || methodOfSkill(s, skillId)?.id === methodId) return []
  return settingsImpact(s, k, rule)
}

/**
 * Give a skill a method. The program's method: the skill follows the program's saved rule again (Default). Another method: the skill takes
 * that method's rule as its own settings and joins its skills. Completed evaluations are never written; whether they count follows the rule [REQ AE-02].
 */
export function setSkillMethod(s: V2State, skillId: string, methodId: string, opts: { at: string; byId: string }): { ok: true; state: V2State } | { ok: false; error: string } {
  const m = methodById(s, methodId)
  const k = s.skills.find((x) => x.id === skillId)
  if (!k) return { ok: false, error: "This skill is no longer in the library." }
  if (!m || !m.saved || !m.rule.model) return { ok: false, error: "This method is not set up yet." }
  if (methodOfSkill(s, skillId)?.id === methodId) return { ok: true, state: s }
  // Read every method as it is now, then move the skill: out of whichever stored method held it, into the chosen one.
  const o = materialize(s)
  const moved: MethodsOverlay = { ...o, methods: o.methods.map((x) => ({ ...x, skillIds: x.id === methodId ? [...x.skillIds.filter((id) => id !== skillId), skillId] : x.skillIds.filter((id) => id !== skillId) })) }
  const state = withOverlay(s, moved)
  if (m.program) return applyDefaultConfiguration(state, skillId, opts)
  return saveSkillSettings(state, skillId, skillRuleUnder(m.rule, k), { ...opts, edited: true })
}
