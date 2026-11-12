/**
 * The words of the "Apply to n skills?" dialog on Evaluation settings (D-L146, concept A, Romit 2026-11-11). Pure, so the copy and the
 * arithmetic are unit tested: students first, with the direction their progress moves; then What changes, one line per part of the
 * settings; then What stays the same. Each skill sits in exactly one group: `change`, `blocked` (both under What changes) or one stays line.
 */
import { LAB_MODEL_LABEL, STATE_SPEC, engineKey, type LabRule, type RecordState } from "./configure"
import { blockedGroups, CHANGE_KEYS, type BlockedWhy, type ChangeKey, type ProgramApplyPlan, type ProgramImpact } from "./program-settings"
import { passChip, signersPhrase } from "./rule-path"
import { countSkills, skillNoun, skillNounPlural } from "./terms"

export type SummarySeg = { text: string; tone?: "strong" | "old" }

export interface SummaryLine {
  key: string
  segs: SummarySeg[]
  /** The same line as plain text. */
  text: string
  /** Amber: something is lost or cleared. */
  attention: boolean
  /** Font Awesome light glyph, decorative. */
  icon: string
  /** The skills this line holds in the partition (stays lines and not configured lines); absent on per-setting lines, which overlap. */
  part?: number
}

export type StudentsBlock =
  | { kind: "none" }
  | { kind: "zero"; text: string }
  | { kind: "moves"; heads: string[]; reason: string; total: number; show: string; hide: string }

export interface ApplySummary {
  title: string
  button: string
  /** No skills to count: the dialog says only that new skills take these settings. */
  empty: boolean
  students: StudentsBlock
  changes: SummaryLine[]
  stays: SummaryLine[]
  /** change + blocked + stays = total, every time (unit tested). */
  partition: { change: number; blocked: number; stays: number; total: number }
}

const n1 = (n: number) => n === 1
/** Verb agreement for "{n} skills ...": `v(n, "needs", "need")`. */
const v = (n: number, one: string, many: string) => (n1(n) ? one : many)
const plural = (n: number, one: string, many: string) => `${n.toLocaleString("en-US")} ${n1(n) ? one : many}`
const students = (n: number) => plural(n, "student", "students")

function line(key: string, segs: SummarySeg[], opts: { attention?: boolean; icon?: string; part?: number } = {}): SummaryLine {
  return { key, segs, text: segs.map((s) => s.text).join(""), attention: !!opts.attention, icon: opts.icon ?? (opts.attention ? "fa-triangle-exclamation" : "fa-pen"), ...(opts.part !== undefined ? { part: opts.part } : {}) }
}

const strong = (text: string): SummarySeg => ({ text, tone: "strong" })
const old = (text: string): SummarySeg => ({ text, tone: "old" })
const t = (text: string): SummarySeg => ({ text })

/** "a, b and c". */
const list = (xs: readonly string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`)

/** Why skills become not configured, as the end of a sentence. Each names the real cause (S17). */
const BECAUSE: Record<BlockedWhy, string> = {
  questions: "they have no questions yet",
  "lab-only": "they have a setting minimum and only a lab instructor can sign off",
  minimums: "their minimums are above the times needed",
  evaluators: "they need more different evaluators than times needed",
  other: "their settings cannot be met",
}

/** Renamed names at the same positions; null when the list changed in another way. */
function renames(before: readonly string[], after: readonly string[]): Array<[string, string]> | null {
  if (before.length !== after.length) return null
  const out: Array<[string, string]> = []
  before.forEach((b, i) => { if (b.trim() !== (after[i] ?? "").trim()) out.push([b.trim(), (after[i] ?? "").trim()]) })
  return out
}

/** One What changes line per part of the settings, for `count` skills on Default. `saved` null: the program's first save. */
function effectLine(key: ChangeKey, count: number, saved: LabRule | null, next: LabRule): SummaryLine {
  const lead = [strong(countSkills(count)), t(key === "new" ? " that were not configured " : " on Default ")]
  const say = (...rest: SummarySeg[]) => line(key, [...lead, ...rest])
  if (key === "new") return say(t(`${v(count, "is", "are")} set up with these settings`))
  if (!saved) return say(t(`${v(count, "takes", "take")} these settings`))
  switch (key) {
    case "model":
      return say(t(`${v(count, "is", "are")} judged by `), strong(next.model ? LAB_MODEL_LABEL[next.model] : ""), t(" instead of "), old(saved.model ? LAB_MODEL_LABEL[saved.model] : ""))
    case "criteria": {
      const a = passChip(next)?.text
      const b = passChip(saved)?.text
      return a && b && next.model === saved.model
        ? say(t(`${v(count, "needs", "need")} `), strong(a), t(" instead of "), old(b))
        : say(t(`${v(count, "has", "have")} a new rule for what moves a student toward achieving the ${skillNoun()}`))
    }
    case "levels": {
      const r = renames(saved.levels, next.levels)
      if (r && r.length === 1) return say(t(`${v(count, "shows", "show")} the level name `), strong(r[0]![1]), t(" instead of "), old(r[0]![0]))
      if (r && r.length > 1) return say(t(`${v(count, "shows", "show")} the level names `), strong(list(r.map((x) => x[1]))), t(" instead of "), old(list(r.map((x) => x[0]))))
      if (saved.levels.length !== next.levels.length) return say(t(`${v(count, "has", "have")} `), strong(String(next.levels.length)), t(" levels instead of "), old(String(saved.levels.length)))
      return say(t(`${v(count, "has", "have")} the levels in a new order`))
    }
    case "outcomeLabels": {
      const r = renames(saved.outcomeLabels, next.outcomeLabels) ?? []
      if (r.length === 1) return say(t(`${v(count, "shows", "show")} the outcome name `), strong(r[0]![1]), t(" instead of "), old(r[0]![0]))
      return say(t(`${v(count, "shows", "show")} the outcome names `), strong(list(r.map((x) => x[1]))), t(" instead of "), old(list(r.map((x) => x[0]))))
    }
    case "questions":
      return say(t(`${v(count, "uses", "use")} the questions on this page`))
    case "need":
      return say(t(`${v(count, "needs", "need")} `), strong(String(next.need)), t(` ${next.need === 1 ? "evaluation" : "evaluations"} instead of `), old(String(saved.need)))
    case "evaluatorRoles":
      return say(t("can be signed off by "), strong(signersPhrase(next.evaluatorRoles) || "nobody"), t(" instead of "), old(signersPhrase(saved.evaluatorRoles) || "nobody"))
    case "approvalRequired":
      return say(t(next.approvalRequired ? `${v(count, "needs", "need")} approval after sign-off` : `no longer ${v(count, "needs", "need")} approval after sign-off`))
    case "selfEvaluation":
      return say(t(next.selfEvaluation ? `${v(count, "asks", "ask")} the student to rate themselves first` : `no longer ${v(count, "asks", "ask")} the student to rate themselves first`))
    case "feedbackRequired":
      return say(t(next.feedbackRequired ? `${v(count, "requires", "require")} feedback from the evaluator` : `no longer ${v(count, "requires", "require")} feedback from the evaluator`))
    case "studentFields":
      return saved.studentFields.length !== next.studentFields.length
        ? say(t(`${v(count, "asks", "ask")} the student for `), strong(String(next.studentFields.length)), t(` ${next.studentFields.length === 1 ? "field" : "fields"} instead of `), old(String(saved.studentFields.length)))
        : say(t(`${v(count, "asks", "ask")} the student for different fields`))
    case "checkOff":
      return say(t(`${v(count, "has", "have")} new group check-off settings`))
    default:
      return say(t(`${v(count, "takes", "take")} the other changes on this page`))
  }
}

export interface SummaryInput {
  saved: LabRule | null
  rule: LabRule
  plan: ProgramApplyPlan
  impact: ProgramImpact
  effects: { namesOnly: boolean; checkOff: "on" | "off" | null; cleared: string[] }
}

export function applySummary({ saved, rule, plan, impact, effects }: SummaryInput): ApplySummary {
  const n = plan.change.length
  const gone = plan.blocked.length
  const stayParts = {
    ownNumber: plan.ownNumberUnchanged,
    ownQuestions: plan.ownQuestionsUnchanged,
    already: plan.alreadyOnSettings,
    custom: plan.edited.length,
    notConfigured: plan.staysNotConfigured.length,
  }
  const staysTotal = Object.values(stayParts).reduce((a, b) => a + b, 0)
  const total = n + gone + staysTotal
  const empty = total === 0

  // What changes: one line per part of the settings, then what is lost.
  const keys = (Object.keys(plan.changeKeys) as ChangeKey[]).filter((k) => (plan.changeKeys[k] ?? 0) > 0)
  // The check-off switch has its own line below. Before the program's first save there is nothing to compare: the skills take the settings.
  const fresh = plan.changeKeys.new ?? 0
  const ordered: ChangeKey[] = saved
    ? keys.filter((k) => !(k === "checkOff" && effects.checkOff)).sort((a, b) => order(a) - order(b))
    : [...(fresh ? (["new"] as ChangeKey[]) : []), ...(n - fresh > 0 ? (["other"] as ChangeKey[]) : [])]
  const changes: SummaryLine[] = ordered.map((k) => effectLine(k, saved ? plan.changeKeys[k]! : k === "new" ? fresh : n - fresh, saved, rule))
  // Skills that take the change but keep their own number (or questions) are said inside a change line, never as staying (D-L146).
  const including: string[] = []
  if (plan.changeOwnNumber) including.push(`${plan.changeOwnNumber.toLocaleString("en-US")} that ${v(plan.changeOwnNumber, "keeps its", "keep their")} own number`)
  if (plan.changeOwnQuestions) including.push(`${plan.changeOwnQuestions.toLocaleString("en-US")} that ${v(plan.changeOwnQuestions, "keeps its", "keep their")} own questions`)
  if (including.length) {
    const host = changes.find((l) => l.key !== "need" && l.key !== "questions" && l.key !== "new") ?? changes.find((l) => l.key !== "new") ?? changes[0]
    if (host) {
      host.segs.push(t(`, including ${list(including)}`))
      host.text = host.segs.map((s) => s.text).join("")
    }
  }
  if (effects.checkOff) {
    const c = plan.changeKeys.checkOff ?? n
    changes.push(line("checkOff", [t("Group check-off turns "), strong(effects.checkOff), t(` ${effects.checkOff === "off" ? "on" : "for"} `), strong(countSkills(c))], { attention: effects.checkOff === "off", icon: effects.checkOff === "off" ? undefined : "fa-pen" }))
  }
  if (plan.minimumsCleared) changes.push(line("minimums", [t("Level minimums are cleared on "), strong(countSkills(plan.minimumsCleared))], { attention: true }))
  const cleared = effects.cleared.flatMap((w) => (w === "Minimum at each level" || w === "Levels that count" || w === "Named questions" ? [] : w === "Checked-off students get" ? ["What a group check-off records"] : [w]))
  if (cleared.length && n) changes.push(line("cleared", [t(`${cleared.length === 1 ? "This setting is" : "These settings are"} cleared: `), strong(cleared.join(", "))], { attention: true }))
  for (const g of blockedGroups(plan)) {
    changes.push(line(`blocked-${g.why}`, [strong(countSkills(g.count)), t(` ${v(g.count, "becomes", "become")} not configured because ${g.count === 1 ? BECAUSE[g.why].replace(/^they have /, "it has ").replace(/^they need /, "it needs ").replace(/^their /, "its ") : BECAUSE[g.why]}`)], { attention: true, part: g.count }))
  }

  // What stays the same.
  const stays: SummaryLine[] = []
  if (stayParts.ownNumber) stays.push(line("ownNumber", [strong(countSkills(stayParts.ownNumber)), t(` ${v(stayParts.ownNumber, "keeps its", "keep their")} own number`)], { icon: "fa-hashtag", part: stayParts.ownNumber }))
  if (stayParts.ownQuestions) stays.push(line("ownQuestions", [strong(countSkills(stayParts.ownQuestions)), t(` ${v(stayParts.ownQuestions, "keeps its", "keep their")} own questions`)], { icon: "fa-list-check", part: stayParts.ownQuestions }))
  if (stayParts.already) stays.push(line("already", [strong(countSkills(stayParts.already)), t(` on Default ${v(stayParts.already, "is", "are")} already on these settings`)], { icon: "fa-check", part: stayParts.already }))
  if (stayParts.custom) stays.push(line("custom", [strong(countSkills(stayParts.custom)), t(` on Custom ${v(stayParts.custom, "keeps its", "keep their")} own settings`)], { icon: "fa-sliders", part: stayParts.custom }))
  if (stayParts.notConfigured) stays.push(line("notConfigured", [strong(countSkills(stayParts.notConfigured)), t(` ${v(stayParts.notConfigured, "stays", "stay")} not configured`)], { attention: true, part: stayParts.notConfigured }))

  return {
    title: !n && gone ? `${countSkills(gone)} ${v(gone, "becomes", "become")} not configured. Apply?` : n ? `Apply to ${countSkills(n)}?` : "Apply these settings?",
    button: n ? `Apply to ${countSkills(n)}` : "Apply settings",
    empty,
    students: empty ? { kind: "none" } : studentsBlock(saved, rule, plan, impact),
    changes,
    stays,
    partition: { change: n, blocked: gone, stays: staysTotal, total },
  }
}

const order = (k: ChangeKey) => CHANGE_KEYS.indexOf(k)

/** The callout: who moves and which way, the plain reason when there is one, and the link to their names. */
function studentsBlock(saved: LabRule | null, rule: LabRule, plan: ProgramApplyPlan, impact: ProgramImpact): StudentsBlock {
  const moved = impact.ruleChanged ? impact.students : []
  if (!moved.length) return { kind: "zero", text: "No student's progress changes" }
  const on = (skills: number) => (skills === 1 ? `on 1 ${skillNoun()}` : `on some ${skillNounPlural()}`)
  const down = moved.filter((x) => x.down > 0).length
  const up = moved.filter((x) => x.up > 0).length
  const lost = moved.filter((x) => x.lost > 0).length
  const other = moved.filter((x) => x.other > 0 && !x.down && !x.up && !x.lost).length
  const heads: string[] = []
  if (down) {
    const to = impact.downTo.length === 1 ? impact.downTo[0]! : null
    heads.push(to ? `${students(down)} ${v(down, "goes", "go")} from Achieved to ${STATE_SPEC[to as RecordState].label} ${on(impact.skillsDown)}` : `${students(down)} ${v(down, "is", "are")} no longer Achieved ${on(impact.skillsDown)}`)
  }
  if (up) heads.push(`${students(up)} ${v(up, "reaches", "reach")} Achieved ${on(impact.skillsUp)}`)
  if (lost) heads.push(`${students(lost)} ${v(lost, "loses", "lose")} progress on ${impact.skillsLost === 1 ? `the ${skillNoun()} that becomes` : `the ${skillNounPlural()} that become`} not configured`)
  if (other) heads.push(`${students(other)} ${v(other, "sees", "see")} their progress change ${on(impact.skillsOther)}`)
  // The reason, only when the number alone changed and everyone moves the same way.
  let reason = "Their evaluations are kept."
  if (saved && !plan.blocked.length && !plan.minimumsCleared && engineKey({ ...saved, need: rule.need }) === engineKey(rule) && saved.need !== rule.need && heads.length === 1 && !other) {
    const d = rule.need - saved.need
    reason += ` Each of these ${skillNounPlural()} needs ${Math.abs(d)} ${d > 0 ? "more" : "fewer"}.`
  }
  const total = moved.length
  return { kind: "moves", heads, reason, total, show: total === 1 ? "Show the student" : `Show the ${total.toLocaleString("en-US")} students`, hide: total === 1 ? "Hide the student" : "Hide students" }
}
