/**
 * "Your rule" as a path (Evaluation settings B, concept A, Romit 2026-11-11, D-L145): one step per thing that happens on the way to a skill achieved, read
 * from the same rule the sentence reads (ruleClauses and the validation issues), so no model has copy of its own here. Pure, so each model is tested.
 *
 *   Student logs the skill  >  Rates themselves first (when on)  >  {Who} signs off [what moves a student on]  >  An admin approves it (when on)
 *   >  Needed {n} times  >  Skill achieved
 *
 * Before a model is chosen the path is the first-run outline: Student logs the skill, Choose how skills are judged (the way in), Who signs off,
 * Times needed, Skill achieved.
 */
import { ROLES, countingLevels, countsFromIndex, hasNeed, questionNumbers, type LabRule, type RuleIssue } from "@/lib/lab/configure"
import { TIMES_MAX } from "@/lib/lab/program-settings"
import { capitalize, inSentence, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import type { EvaluatorRole } from "@/lib/v2/types"

export type PathStepId = "log" | "self" | "judged" | "sign" | "approval" | "need" | "achieved"

/** set: decided. todo: still to decide (dashed). error: a failed Save left a problem on this step. */
export type PathStepState = "set" | "todo" | "error"

export interface RulePathStep {
  id: PathStepId
  /** Font Awesome name, without the style prefix. */
  icon: string
  /** The step in words, as the side panel shows it. */
  label: string
  /** One or two words under the icon in the phone-wide row. */
  short: string
  state: PathStepState
  /** What moves a student toward achieving the skill, from the model's own data (sign step only, once decided). */
  chip?: { text: string; icon: string }
  /** Times needed, for the tally marks (need step only, once decided). */
  times?: number
  /** Problems or gaps that sit on this step, each a link to its field. */
  issues: RuleIssue[]
  /** The first-run step that opens the page: its label is the link to the model choice, so the model problem is not listed under it again. */
  start?: boolean
}

const ROLE_NAME: Record<EvaluatorRole, string> = { preceptor: "preceptor", faculty: "clinical faculty", "lab-instructor": "lab instructor" }

/** "Preceptor or clinical faculty", from the roles that may sign off, in the page's order. Empty when none is chosen. */
export function signersPhrase(roles: readonly EvaluatorRole[]): string {
  const names = ROLES.filter((r) => roles.includes(r)).map((r) => ROLE_NAME[r])
  if (!names.length) return ""
  const joined = names.length === 1 ? names[0]! : `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}`
  return capitalize(joined)
}

/** Which step of the path a problem belongs to, by the field it names. */
export function issueStep(field: string): PathStepId {
  if (field === "cfg-model") return "judged"
  if (field.startsWith("cfg-field-")) return "log"
  if (field === "cfg-need" || field.startsWith("cfg-lmin") || field === "cfg-distinct" || field.startsWith("cfg-setting")) return "need"
  return "sign"
}

/**
 * What moves a student toward achieving the skill, as a label standing alone (it keeps its case at the start; a second label mid-phrase is lowercased).
 * Null until the model's own choice is made and valid.
 *   Levels:    "With assistance or works alone", "Works alone", "Any level", "Observed or above"
 *   Approved:  "Approved"
 *   Questions: "All 5 questions answered Yes", "At least 4 of 5 answered Yes", "Questions 1 and 3 answered Yes"
 *   Score:     "Average 4 or more out of 5", "At least 3 on every question", "Total 20 or more out of 25"
 */
export function passChip(rule: LabRule): { text: string; icon: string } | null {
  switch (rule.model) {
    case "demonstration": {
      const from = countsFromIndex(rule)
      const named = countingLevels(rule)
      if (from === null || !named.length) return null
      if (from === 0 && rule.levels.length > 1) return { text: "Any level", icon: "fa-stairs" }
      const text = named.length === 1 ? named[0]! : named.length === 2 ? `${named[0]} or ${inSentence(named[1]!)}` : `${named[0]} or above`
      return { text, icon: "fa-stairs" }
    }
    case "binary": {
      const q = rule.qualifyingLabel === null ? "" : rule.outcomeLabels[rule.qualifyingLabel]?.trim() ?? ""
      return q ? { text: q, icon: "fa-circle-check" } : null
    }
    case "question": {
      const r = rule.questionRule
      const m = rule.questions.length
      if (!r || m === 0) return null
      if (r.kind === "all") return { text: m === 1 ? "The question answered Yes" : `All ${m} questions answered Yes`, icon: "fa-list-check" }
      if (r.kind === "atLeast") return Number.isInteger(r.n) && r.n >= 1 && r.n <= m ? { text: `At least ${r.n} of ${m} answered Yes`, icon: "fa-list-check" } : null
      const picked = questionNumbers(r.indices.filter((i) => i < m))
      if (!picked.length) return null
      const list = picked.length === 1 ? picked[0]! : `${picked.slice(0, -1).join(", ")} and ${picked[picked.length - 1]}`
      const one = r.indices.length === 1
      return { text: `${one ? "Question" : "Questions"} ${list} answered Yes`, icon: "fa-list-check" }
    }
    case "scored": {
      const r = rule.scoredRule
      const m = rule.questions.length
      if (!r || m === 0 || !Number.isInteger(rule.scaleMax) || rule.scaleMax < 2) return null
      const top = r.kind === "total" ? rule.scaleMax * m : rule.scaleMax
      if (!(typeof r.value === "number" && r.value >= 1 && r.value <= top)) return null
      if (r.kind === "average") return { text: `Average ${r.value} or more out of ${rule.scaleMax}`, icon: "fa-hashtag" }
      if (r.kind === "minEach") return { text: `At least ${r.value} on every question`, icon: "fa-hashtag" }
      return { text: `Total ${r.value} or more out of ${top}`, icon: "fa-hashtag" }
    }
    default:
      return null
  }
}

/** "Needed 2 times" / "Needed 1 time" (Romit 2026-11-11, replacing the mockup's "2 evaluations like this"). */
export const neededTimes = (n: number): string => `Needed ${n} ${n === 1 ? "time" : "times"}`

/**
 * The path for the panel. `issues`: the live validation of the rule; `failing`: a Save was pressed with problems, so they read as errors. Steps with an
 * issue are "todo" while the admin is still filling in, "error" after a failed Save.
 */
export function rulePath(rule: LabRule, issues: readonly RuleIssue[], failing: boolean): RulePathStep[] {
  const on = (id: PathStepId) => issues.filter((i) => issueStep(i.field) === id)
  const state = (id: PathStepId, decided: boolean): PathStepState => (on(id).length ? (failing ? "error" : "todo") : decided ? "set" : "todo")
  const noun = skillNoun()
  const log: RulePathStep = { id: "log", icon: "fa-user-pen", label: `Student logs the ${noun}`, short: "Logs", state: state("log", true), issues: on("log") }
  const achieved = (decided: boolean): RulePathStep => ({ id: "achieved", icon: "fa-award", label: `${capitalize(noun)} achieved`, short: "Achieved", state: decided ? "set" : "todo", issues: [] })

  if (!rule.model) {
    return [
      log,
      { id: "judged", icon: "fa-scale-balanced", label: `Choose how ${skillNounPlural()} are judged`, short: "How judged", state: failing ? "error" : "todo", issues: [], start: true },
      { id: "sign", icon: "fa-signature", label: "Who signs off", short: "Signs off", state: "todo", issues: [] },
      { id: "need", icon: "fa-repeat", label: "Times needed", short: "Times", state: "todo", issues: [] },
      achieved(false),
    ]
  }

  const signIssues = on("sign")
  const who = signersPhrase(rule.evaluatorRoles)
  const chip = signIssues.length ? null : passChip(rule)
  const sign: RulePathStep = {
    id: "sign",
    icon: "fa-signature",
    label: who ? `${who} signs off` : "Who signs off",
    short: "Signs off",
    state: state("sign", !!who && !!chip),
    ...(chip ? { chip } : {}),
    issues: signIssues,
  }

  const needIssues = on("need")
  const needSet = hasNeed(rule) && rule.need <= TIMES_MAX
  const need: RulePathStep = {
    id: "need",
    icon: "fa-repeat",
    label: needSet && !needIssues.some((i) => i.field === "cfg-need") ? neededTimes(rule.need) : "Times needed",
    short: needSet ? `${rule.need} ${rule.need === 1 ? "time" : "times"}` : "Times",
    state: state("need", needSet),
    ...(needSet ? { times: rule.need } : {}),
    issues: needIssues,
  }

  const steps: RulePathStep[] = [log]
  if (rule.selfEvaluation) steps.push({ id: "self", icon: "fa-star-half-stroke", label: "Rates themselves first", short: "Rates self", state: "set", issues: [] })
  steps.push(sign)
  if (rule.approvalRequired) steps.push({ id: "approval", icon: "fa-stamp", label: "An admin approves it", short: "Approved", state: "set", issues: [] })
  steps.push(need, achieved(issues.length === 0))
  return steps
}

/** Tally marks for a small number, the number alone above this. */
export const TALLY_MAX = 5
/** How many tally marks the need step draws: 2 to 5 (Romit 2026-11-11: one mark read as a stray dash), none for 1 or above 5. */
export const tallyFor = (n: number | undefined): number => (n !== undefined && Number.isInteger(n) && n >= 2 && n <= TALLY_MAX ? n : 0)

// ---------------------------------------------------------------------------------------------------------------------
// The model tile's example line

/**
 * The levels model tile's example: "Needs coaching to works alone" from the lowest and the top level. A blank end is never skipped over silently
 * (it read "Needs coaching to with assistance" with the top level blank): with a blank lowest or top level the line counts the levels and says how
 * many still need a name. Null when no level has a name yet, so the tile keeps its generic example.
 */
export function levelRangeExample(levels: readonly string[]): string | null {
  const names = levels.map((l) => l.trim())
  const named = names.filter(Boolean)
  if (named.length === 0) return null
  const blank = names.length - named.length
  const low = names[0]!
  const top = names[names.length - 1]!
  if (names.length >= 2 && low && top) return `${low} to ${inSentence(top)}`
  if (!blank) return null
  return `${names.length} ${names.length === 1 ? "level" : "levels"}, ${blank} without a name`
}
