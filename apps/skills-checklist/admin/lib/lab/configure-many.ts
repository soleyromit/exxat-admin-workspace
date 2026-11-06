/**
 * Configure several skills on one page (Library selection bar, Configure variant B, D-L48) [REQ IM-14]. Each skill keeps its own
 * rule: the page edits one set of fields, and only the fields the admin touched are written to each skill. Where the selected
 * skills differ, the field is Mixed and stays as each skill has it unless the admin sets it. Nothing is preselected [REQ SC-02].
 * Every write goes through saveLabRule or saveConfigDraft, the same paths as one skill. Evaluations are never written. Pure.
 */
import { evalsOfSkill, skillById } from "@/lib/v2/evidence-index"
import { isConfigured } from "@/lib/v2/population"
import type { Skill, V2State } from "@/lib/v2/types"
import { configDraftOf, emptyRule, fromV2, saveConfigDraft, saveLabRule, validateRule, type LabRule, type PublishMode, type RuleIssue } from "./configure"

export type BulkField = "model" | "criteria" | "need" | "conditions" | "studentFields" | "selfEvaluation" | "evaluatorRoles" | "feedbackRequired" | "approvalRequired" | "checkOff"

const FIELDS: Record<BulkField, { read: (r: LabRule) => unknown; write: (to: LabRule, from: LabRule) => LabRule }> = {
  model: { read: (r) => r.model, write: (to, from) => ({ ...to, model: from.model }) },
  // Everything that depends on the model: it is one question for the admin ("What counts as achieved").
  criteria: {
    // Only what the rule's own model uses: a stray value on another model never reads as a difference.
    read: (r) => {
      const m = r.model
      return [m === "binary" ? [r.outcomeLabels, r.qualifyingLabel] : null, m === "question" || m === "scored" ? r.questions : null, m === "question" ? r.questionRule : null, m === "scored" ? [r.scaleMax, r.scoredRule] : null, m === "demonstration" ? [r.levels, r.carried.minLevelIndex] : null]
    },
    write: (to, from) => ({ ...to, outcomeLabels: from.outcomeLabels, qualifyingLabel: from.qualifyingLabel, questions: from.questions, questionRule: from.questionRule, scaleMax: from.scaleMax, scoredRule: from.scoredRule, levels: from.levels, carried: { ...to.carried, minLevelIndex: from.carried.minLevelIndex } }),
  },
  need: { read: (r) => r.need, write: (to, from) => ({ ...to, need: from.need }) },
  conditions: {
    read: (r) => [r.levelMinimums, r.settingMinimums, r.distinctEvaluators],
    write: (to, from) => ({ ...to, levelMinimums: from.levelMinimums, settingMinimums: from.settingMinimums, distinctEvaluators: from.distinctEvaluators }),
  },
  studentFields: { read: (r) => r.studentFields, write: (to, from) => ({ ...to, studentFields: from.studentFields }) },
  selfEvaluation: { read: (r) => r.selfEvaluation, write: (to, from) => ({ ...to, selfEvaluation: from.selfEvaluation }) },
  evaluatorRoles: { read: (r) => [...r.evaluatorRoles].sort(), write: (to, from) => ({ ...to, evaluatorRoles: from.evaluatorRoles }) },
  feedbackRequired: { read: (r) => r.feedbackRequired, write: (to, from) => ({ ...to, feedbackRequired: from.feedbackRequired }) },
  approvalRequired: { read: (r) => r.approvalRequired, write: (to, from) => ({ ...to, approvalRequired: from.approvalRequired }) },
  checkOff: { read: (r) => r.checkOff ?? null, write: (to, from) => ({ ...to, checkOff: from.checkOff }) },
}
const FIELD_KEYS = Object.keys(FIELDS) as BulkField[]
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/** A blank rule for a Mixed field: no value is carried from one skill to the others. */
export function blankRule(): LabRule {
  return { ...emptyRule(), studentFields: [] }
}

/** One field set back to its blank, for "Keep as is" on a Mixed field. */
export const blankField = (rule: LabRule, field: BulkField): LabRule => FIELDS[field].write(rule, blankRule())
/** One field copied from another rule. */
export const copyField = (rule: LabRule, field: BulkField, from: LabRule): LabRule => FIELDS[field].write(rule, from)

export const parseSkillIds = (raw: string | null | undefined): string[] => Array.from(new Set((raw ?? "").split(",").map((x) => x.trim()).filter(Boolean)))

/** The skills a URL may configure: those that exist and are not inactive. */
export const configurableSkills = (s: V2State, ids: readonly string[]): Skill[] => ids.map((id) => skillById(s, id)).filter((k): k is Skill => !!k && k.active !== false)

/** What the selection bar counts: selected rows that are not inactive. */
export const configurableIds = (rows: ReadonlyArray<{ id: string; status: string }>): string[] => rows.filter((r) => r.status !== "inactive").map((r) => r.id)

/** A skill's rule as this page starts from it (as one skill would open, except a configured skill's draft stays a draft). */
export function ownRule(s: V2State, k: Skill): LabRule {
  if (isConfigured(k)) return fromV2(k)
  return configDraftOf(s, k.id)?.rule ?? { ...fromV2(k), carried: emptyRule().carried }
}

export interface MergedRules {
  /** Identical values as they are; a Mixed field blank. */
  base: LabRule
  mixed: ReadonlySet<BulkField>
}

export function mergeRules(rules: readonly LabRule[]): MergedRules {
  const first = rules[0] ?? blankRule()
  const blank = blankRule()
  const mixed = new Set<BulkField>()
  let base = first
  for (const f of FIELD_KEYS) {
    const value = FIELDS[f].read(first)
    if (rules.every((r) => same(FIELDS[f].read(r), value))) continue
    mixed.add(f)
    base = FIELDS[f].write(base, blank)
  }
  return { base, mixed }
}

/**
 * The fields to write. A Mixed field is touched once the admin sets it (a number or model entered, or `opened`); any other once it
 * differs from the shared value. Choosing a model also writes what depends on it, since a model's criteria belong to that model.
 */
export function touchedFields(edited: LabRule, { base, mixed }: MergedRules, opened: ReadonlySet<BulkField>): Set<BulkField> {
  const out = new Set<BulkField>()
  for (const f of FIELD_KEYS) {
    if (!mixed.has(f)) {
      if (!same(FIELDS[f].read(edited), FIELDS[f].read(base))) out.add(f)
    } else if (f === "model" ? edited.model !== null : f === "need" ? Number.isFinite(edited.need) : opened.has(f)) out.add(f)
  }
  if (out.has("model")) out.add("criteria")
  return out
}

/**
 * Minimums added across skills that differ on them (Mixed): each skill keeps its own, a new one is added, and one for a level or setting it already has takes the new number. A level is matched by name, since the skills' levels can sit in another order.
 */
function addConditions(own: LabRule, edited: LabRule): LabRule {
  const settings = own.settingMinimums.map((m) => ({ ...m }))
  for (const m of edited.settingMinimums) {
    const at = settings.findIndex((x) => x.setting === m.setting)
    if (at >= 0) settings[at] = { ...m }
    else settings.push({ ...m })
  }
  const levels = own.levelMinimums.map((m) => ({ ...m }))
  for (const m of edited.levelMinimums) {
    const name = edited.levels[m.levelIndex]?.trim()
    const index = own.levels.findIndex((l) => l.trim() === name)
    if (index < 0) continue
    const at = levels.findIndex((x) => x.levelIndex === index)
    if (at >= 0) levels[at] = { levelIndex: index, min: m.min }
    else levels.push({ levelIndex: index, min: m.min })
  }
  const distinctOn = edited.distinctEvaluators >= 2 || !Number.isFinite(edited.distinctEvaluators)
  return { ...own, settingMinimums: settings, levelMinimums: levels, distinctEvaluators: distinctOn ? edited.distinctEvaluators : own.distinctEvaluators }
}

/** One skill's rule with only the touched fields replaced. `addMinimums`: the skills differ on their minimums, so an edit adds to each rather than replacing (map D4). */
export function applyEdits(own: LabRule, edited: LabRule, touched: ReadonlySet<BulkField>, addMinimums = false): LabRule {
  let next = own
  for (const f of touched) next = f === "conditions" && addMinimums ? addConditions(next, edited) : FIELDS[f].write(next, edited)
  // Level minimums point at the levels of the old model; a setting minimum is unaffected (as withModel).
  if (touched.has("model") && !touched.has("conditions") && next.model !== own.model) next = { ...next, levelMinimums: [] }
  return next
}

export type ManyOutcome = "save" | "draft" | "none" | "blocked"

export interface ManyRow {
  id: string
  name: string
  configured: boolean
  own: LabRule
  next: LabRule
  /** save: the rule is written. draft: a not configured skill keeps the edits, still incomplete. none: nothing to write. blocked: a live rule would become invalid. */
  outcome: ManyOutcome
  /** What stops this rule being saved. */
  issues: RuleIssue[]
  evaluations: number
}

export function planMany(s: V2State, skills: readonly Skill[], edited: LabRule, touched: ReadonlySet<BulkField>, addMinimums = false): ManyRow[] {
  return skills.map((k) => {
    const own = ownRule(s, k)
    const next = applyEdits(own, edited, touched, addMinimums)
    const configured = isConfigured(k)
    const issues = validateRule(next)
    const changed = !same(own, next)
    const outcome: ManyOutcome = configured ? (!changed ? "none" : issues.length ? "blocked" : "save") : issues.length === 0 ? (changed ? "save" : "none") : changed ? "draft" : "none"
    return { id: k.id, name: k.name, configured, own, next, outcome, issues, evaluations: evalsOfSkill(s, k.id).length }
  })
}

/** Save first shows the rule change impact when a rule being written already has evaluations behind it [REQ AE-02]. */
export const needsImpactStep = (rows: readonly ManyRow[]): boolean => rows.some((r) => r.outcome === "save" && r.evaluations > 0)

export interface ManySaved {
  state: V2State
  /** Configured once saved: written now, or already configured with nothing to change. */
  configured: string[]
  /** Not configured skills that are still incomplete. */
  kept: string[]
  /** Skills left on their current rule because the admin chose new evidence only (nothing is written, as for one skill). */
  held: string[]
}

/** Writes only `rows`: the selected skills. `heldBack` is the skills whose students would change, when new evidence only was chosen. */
export function saveMany(s: V2State, rows: readonly ManyRow[], opts: { at: string; byId: string; mode: PublishMode | null; heldBack?: ReadonlySet<string> }): ManySaved {
  let state = s
  const out: Omit<ManySaved, "state"> = { configured: [], kept: [], held: [] }
  for (const r of rows) {
    if (r.outcome === "blocked") continue
    if (r.outcome === "draft") {
      state = saveConfigDraft(state, r.id, r.next, null, opts.at)
      out.kept.push(r.id)
    } else if (r.outcome === "none") {
      ;(r.configured ? out.configured : out.kept).push(r.id)
    } else if (opts.heldBack?.has(r.id)) {
      out.held.push(r.id)
    } else {
      const w = saveLabRule(state, r.id, r.next, { at: opts.at, byId: opts.byId, mode: opts.mode })
      if (w.ok && w.written) {
        state = w.state
        out.configured.push(r.id)
      } else (r.configured ? out.held : out.kept).push(r.id)
    }
  }
  return { state, ...out }
}

/** Which Mixed-aware field a validation issue belongs to, so an untouched blank never shows an error. */
export function issueField(i: Pick<RuleIssue, "field">): BulkField {
  const f = i.field
  if (f === "cfg-model") return "model"
  if (f === "cfg-need") return "need"
  if (/^cfg-(lmin|setting|distinct)/.test(f)) return "conditions"
  if (f.startsWith("cfg-field")) return "studentFields"
  if (f.startsWith("cfg-role")) return "evaluatorRoles"
  return "criteria"
}
