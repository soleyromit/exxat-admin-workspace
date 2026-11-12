/**
 * The words of the "Apply to n skills?" dialog on Evaluation settings (D-L146, concept A, Romit 2026-11-11). Pure, so the copy and the
 * arithmetic are unit tested: students first, with the direction their progress moves; then What changes, one line per part of the
 * settings; then What stays the same. Each skill sits in exactly one group: `change`, `blocked` (both under What changes) or one stays line.
 */
import { LAB_MODEL_LABEL, STATE_SPEC, type LabRule, type RecordState } from "./configure"
import { blockedGroups, CHANGE_KEYS, type BlockedWhy, type ChangeKey, type ProgramApplyPlan, type ProgramImpact } from "./program-settings"
import { passChip, signersPhrase } from "./rule-path"
import { countSkills, skillNoun, skillNounPlural } from "./terms"

export type SummarySeg = { text: string; tone?: "strong" | "old" }

/** A configuration word drawn as the Library's badge (lib/lab/library.ts CONFIGURATION_META), so the dialog and the table read alike. */
export type ConfigWord = "default" | "edited" | "not-configured"

/** One value in a before and after pair: plain words in a chip, or a configuration badge. */
export type ChangeValue = { text: string; config?: ConfigWord }

/**
 * V1 "change cards" (D-L147): the row a setting is drawn as. Structured, never parsed from the sentence: the setting's name, which skills
 * it reaches, and its value before and after. The sentence (`text`) stays for screen readers and the task scripts.
 */
export interface ChangeRow {
  name: string
  scope: string
  /** Absent when there is nothing to compare (a first save, a list that changed in another way). */
  before?: ChangeValue
  after: ChangeValue
  /** One quiet line under the setting's name: the own-number skills on Times needed, the reason a skill becomes not configured. */
  note?: string
}

export interface SummaryLine {
  key: string
  segs: SummarySeg[]
  /** The same line as plain text. */
  text: string
  /** Amber: something is lost or cleared. */
  attention: boolean
  /** Font Awesome light glyph, decorative. On a change row it is the setting's own icon, the same one the "Your rule" path uses. */
  icon: string
  /** The skills this line holds in the partition (stays lines and not configured lines); absent on per-setting lines, which overlap. */
  part?: number
  /** What changes lines only: the row's parts. */
  row?: ChangeRow
}

/** One way students move, drawn as words and record state badges: `{ state }` is a DS StatusBadge, `arrow` the "to" between two. */
export type HeroSeg = { text: string } | { state: RecordState } | { arrow: true }

export interface HeroPart {
  /** Students moving this way. */
  count: number
  segs: HeroSeg[]
  /** Leaving Achieved or losing progress: the hero is amber. Gains and other moves are neutral. */
  loss: boolean
  /** Unused since H1 (D-L149): the stay reads on one line. Kept optional so older callers compile. */
  note?: string
}

export type StudentsBlock =
  | { kind: "none" }
  | { kind: "zero"; text: string }
  | { kind: "moves"; heads: string[]; parts: HeroPart[]; loss: boolean; reason: string; total: number; show: string; back: string }

/** Nobody moves and one setting changes between two brief values: the dialog draws the change itself at hero size ("On -> Off"). */
export interface ChangeFigure {
  icon: string
  before: string
  after: string
  note?: string
}

export interface ApplySummary {
  /**
   * The dialog's name, visible in every state (H1, D-L149, replacing C2's hidden hero sentence): the action as a question (actionTitle, unit
   * tested per change type). The students' outcome is the description.
   */
  title: string
  /** The dialog's description: the hero sentences and "No evaluation is deleted." when students move, "No student's progress changes." when nobody does. */
  description: string
  figure?: ChangeFigure
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

function line(key: string, segs: SummarySeg[], opts: { attention?: boolean; icon?: string; part?: number; row?: ChangeRow } = {}): SummaryLine {
  return {
    key,
    segs,
    text: segs.map((s) => s.text).join(""),
    attention: !!opts.attention,
    icon: opts.icon ?? (opts.attention ? "fa-triangle-exclamation" : "fa-pen"),
    ...(opts.part !== undefined ? { part: opts.part } : {}),
    ...(opts.row ? { row: opts.row } : {}),
  }
}

/**
 * The icon of each setting: the "Your rule" path's own (lib/lab/rule-path.ts) where the path has the step, so the dialog and the panel match.
 * Group check-off is not on the path; it takes fa-check-double (several checked at once), never the students hero's fa-users (Romit, 2026-11-11).
 */
export const SETTING_ICON = {
  model: "fa-scale-balanced",
  levels: "fa-stairs",
  outcomes: "fa-circle-check",
  questions: "fa-list-check",
  score: "fa-hashtag",
  need: "fa-repeat",
  signers: "fa-signature",
  approval: "fa-stamp",
  self: "fa-star-half-stroke",
  feedback: "fa-comment",
  fields: "fa-user-pen",
  checkOff: "fa-check-double",
  setup: "fa-sliders",
  cleared: "fa-eraser",
  blocked: "fa-triangle-exclamation",
  students: "fa-users",
} as const

const onOff = (on: boolean): ChangeValue => ({ text: on ? "On" : "Off" })
const val = (text: string): ChangeValue => ({ text })

/** The row name for what moves a student forward, per model (never "counts", Romit 2026-11-11). */
function criteriaName(model: LabRule["model"]): string {
  if (model === "demonstration") return "Levels that move a student forward"
  if (model === "binary") return "Outcome that moves a student forward"
  return "What moves a student forward"
}

/** Name, icon and before and after for one part of the settings. `saved` null: the program's first save. */
function effectRow(key: ChangeKey, saved: LabRule | null, next: LabRule): Omit<ChangeRow, "scope"> & { icon: string } {
  if (key === "new") return { name: "Evaluation settings", icon: SETTING_ICON.setup, before: { text: "Not configured", config: "not-configured" }, after: { text: "Default", config: "default" } }
  if (!saved) return { name: "Evaluation settings", icon: SETTING_ICON.setup, after: { text: "Default", config: "default" } }
  switch (key) {
    case "model":
      return { name: `How ${skillNounPlural()} are judged`, icon: SETTING_ICON.model, ...(saved.model ? { before: val(LAB_MODEL_LABEL[saved.model]) } : {}), after: val(next.model ? LAB_MODEL_LABEL[next.model] : "Not set") }
    case "criteria": {
      const a = passChip(next)
      const b = passChip(saved)
      return { name: criteriaName(next.model), icon: a?.icon ?? b?.icon ?? SETTING_ICON.levels, ...(b ? { before: val(b.text) } : {}), after: val(a?.text ?? "Not set") }
    }
    case "levels": {
      const r = renames(saved.levels, next.levels)
      if (r && r.length === 1) return { name: "Level name", icon: SETTING_ICON.levels, before: val(r[0]![0]), after: val(r[0]![1]) }
      if (r && r.length > 1) return { name: "Level names", icon: SETTING_ICON.levels, before: val(list(r.map((x) => x[0]))), after: val(list(r.map((x) => x[1]))) }
      if (saved.levels.length !== next.levels.length) return { name: "Levels", icon: SETTING_ICON.levels, before: val(String(saved.levels.length)), after: val(String(next.levels.length)) }
      return { name: "Level order", icon: SETTING_ICON.levels, after: val("New order") }
    }
    case "outcomeLabels": {
      const r = renames(saved.outcomeLabels, next.outcomeLabels) ?? []
      return { name: r.length === 1 ? "Outcome name" : "Outcome names", icon: SETTING_ICON.outcomes, before: val(list(r.map((x) => x[0]))), after: val(list(r.map((x) => x[1]))) }
    }
    case "questions": {
      const a = next.questions.filter((q) => q.trim()).length
      const b = saved.questions.filter((q) => q.trim()).length
      return { name: "Questions", icon: SETTING_ICON.questions, ...(a !== b && b ? { before: val(String(b)) } : {}), after: val(a !== b && b ? String(a) : "This page's questions") }
    }
    case "need":
      return { name: "Times needed", icon: SETTING_ICON.need, before: val(String(saved.need)), after: val(String(next.need)) }
    case "evaluatorRoles":
      return { name: "Who signs off", icon: SETTING_ICON.signers, before: val(signersPhrase(saved.evaluatorRoles) || "Nobody"), after: val(signersPhrase(next.evaluatorRoles) || "Nobody") }
    case "approvalRequired":
      return { name: "Admin approval", icon: SETTING_ICON.approval, before: onOff(saved.approvalRequired), after: onOff(next.approvalRequired) }
    case "selfEvaluation":
      return { name: "Student rates themselves first", icon: SETTING_ICON.self, before: onOff(saved.selfEvaluation), after: onOff(next.selfEvaluation) }
    case "feedbackRequired":
      return { name: "Feedback required", icon: SETTING_ICON.feedback, before: onOff(saved.feedbackRequired), after: onOff(next.feedbackRequired) }
    case "studentFields": {
      const a = next.studentFields.length
      const b = saved.studentFields.length
      const fields = (n: number) => `${n} ${n === 1 ? "field" : "fields"}`
      return { name: "What the student fills in", icon: SETTING_ICON.fields, ...(a !== b ? { before: val(fields(b)) } : {}), after: val(a !== b ? fields(a) : "Different fields") }
    }
    case "checkOff": {
      const at = (r: LabRule) => (r.model === "scored" ? (r.checkOff?.score != null ? String(r.checkOff.score) : null) : r.checkOff?.levelIndex != null ? (r.levels[r.checkOff.levelIndex] ?? null) : null)
      const b = at(saved)
      const a = at(next)
      return { name: "Group check-off", icon: SETTING_ICON.checkOff, ...(b ? { before: val(b) } : {}), after: val(a ?? "New settings") }
    }
    default:
      return { name: "Other settings", icon: SETTING_ICON.setup, after: val("Updated") }
  }
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
  const { icon, ...parts } = effectRow(key, saved, next)
  const say = (...rest: SummarySeg[]) => line(key, [...lead, ...rest], { icon, row: { ...parts, scope: countSkills(count) } })
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
  // Skills that take other changes but keep their own number (or questions): said once, on the row of the setting they keep, and only when that setting
  // changed (D-L147 r1). A levels row never mentions the number. Each skill still sits in one group of the partition.
  const keeps = (key: ChangeKey, n2: number, what: string) => {
    const host = changes.find((l) => l.key === key)
    if (!host || !n2 || !host.row) return
    const one = n2 === 1
    host.segs.push(t(`; ${countSkills(n2)} ${one ? "keeps its" : "keep their"} own ${what}`))
    host.text = host.segs.map((sg) => sg.text).join("")
    host.row.scope += `, not the ${n2.toLocaleString("en-US")} with ${one ? "its" : "their"} own ${what}`
    host.row.note = `${countSkills(n2)} ${one ? "keeps its" : "keep their"} own ${what}`
  }
  keeps("need", plan.changeOwnNumber, "number")
  keeps("questions", plan.changeOwnQuestions, "questions")
  if (effects.checkOff) {
    const c = plan.changeKeys.checkOff ?? n
    const off = effects.checkOff === "off"
    // Neutral: turning check-off off takes no progress from any student (C2, D-L148; amber only when students lose something).
    changes.push(line("checkOff", [t("Group check-off turns "), strong(effects.checkOff), t(` ${off ? "on" : "for"} `), strong(countSkills(c))], {
      icon: SETTING_ICON.checkOff,
      row: { name: "Group check-off", scope: countSkills(c), before: onOff(off), after: onOff(!off) },
    }))
  }
  if (plan.minimumsCleared) {
    changes.push(line("minimums", [t("Level minimums are cleared on "), strong(countSkills(plan.minimumsCleared))], {
      icon: SETTING_ICON.cleared,
      row: { name: "Level minimums", scope: countSkills(plan.minimumsCleared), before: val("Set"), after: val("Cleared") },
    }))
  }
  const cleared = effects.cleared.flatMap((w) => (w === "Minimum at each level" || w === "Levels that count" || w === "Named questions" ? [] : w === "Checked-off students get" ? ["What a group check-off records"] : [w]))
  if (cleared.length && n) {
    changes.push(line("cleared", [t(`${cleared.length === 1 ? "This setting is" : "These settings are"} cleared: `), strong(cleared.join(", "))], {
      icon: SETTING_ICON.cleared,
      row: { name: cleared.join(", "), scope: countSkills(n), before: val("Set"), after: val("Cleared") },
    }))
  }
  for (const g of blockedGroups(plan)) {
    const why = g.count === 1 ? BECAUSE[g.why].replace(/^they have /, "it has ").replace(/^they need /, "it needs ").replace(/^their /, "its ") : BECAUSE[g.why]
    changes.push(line(`blocked-${g.why}`, [strong(countSkills(g.count)), t(` ${v(g.count, "becomes", "become")} not configured because ${why}`)], {
      attention: true,
      icon: SETTING_ICON.blocked,
      part: g.count,
      row: {
        name: `${countSkills(g.count)} ${v(g.count, "becomes", "become")} not configured`,
        scope: `${why.charAt(0).toUpperCase()}${why.slice(1)}.`,
        note: `${why.charAt(0).toUpperCase()}${why.slice(1)}`,
        before: { text: "Default", config: "default" },
        after: { text: "Not configured", config: "not-configured" },
      },
    }))
  }

  // Not changed: one quiet footnote of sentences, each skill in one line (C2, D-L148).
  const stays: SummaryLine[] = []
  if (stayParts.ownNumber) stays.push(line("ownNumber", [strong(countSkills(stayParts.ownNumber)), t(` ${v(stayParts.ownNumber, "keeps its", "keep their")} own number`)], { icon: "fa-hashtag", part: stayParts.ownNumber }))
  if (stayParts.ownQuestions) stays.push(line("ownQuestions", [strong(countSkills(stayParts.ownQuestions)), t(` ${v(stayParts.ownQuestions, "keeps its", "keep their")} own questions`)], { icon: "fa-list-check", part: stayParts.ownQuestions }))
  if (stayParts.already) stays.push(line("already", [strong(countSkills(stayParts.already)), t(` on Default ${v(stayParts.already, "is", "are")} already on these settings`)], { icon: "fa-check", part: stayParts.already }))
  if (stayParts.custom) stays.push(line("custom", [strong(countSkills(stayParts.custom)), t(` on Custom ${v(stayParts.custom, "keeps its", "keep their")} own settings`)], { icon: "fa-sliders", part: stayParts.custom }))
  if (stayParts.notConfigured) stays.push(line("notConfigured", [strong(countSkills(stayParts.notConfigured)), t(` ${v(stayParts.notConfigured, "stays", "stay")} not configured`)], { attention: true, part: stayParts.notConfigured }))

  const studentsOut: StudentsBlock = empty ? { kind: "none" } : studentsBlock(saved, rule, plan, impact)
  const moves = studentsOut.kind === "moves"
  // Nobody moves and one setting changes between two brief plain values: the change itself is the figure, and the table would say it twice.
  const only = changes.length === 1 ? changes[0]!.row : undefined
  const figure: ChangeFigure | undefined =
    !moves && saved && only?.before && !only.before.config && !only.after.config && only.before.text.length + only.after.text.length <= FIGURE_MAX
      ? { icon: changes[0]!.icon, before: only.before.text, after: only.after.text, ...(only.note ? { note: only.note } : {}) }
      : undefined
  return {
    // One title rule for every state (H1, D-L149): the action. The students' outcome is the description and the hero card.
    title: empty
      ? "Apply these settings?"
      : !n && gone
          ? `${countSkills(gone)} ${v(gone, "becomes", "become")} not configured. Apply?`
          : !saved
            ? `Apply to ${countSkills(n)}?`
            : actionTitle(changes, saved, rule, effects),
    description: empty ? `New ${skillNounPlural()} take these settings when they are added.` : moves ? `${studentsOut.heads.join(". ")}. ${studentsOut.reason}` : `${ZERO}.`,
    ...(figure ? { figure } : {}),
    button: n ? `Apply to ${countSkills(n)}` : "Apply settings",
    empty,
    students: studentsOut,
    changes,
    stays,
    partition: { change: n, blocked: gone, stays: staysTotal, total },
  }
}

const order = (k: ChangeKey) => CHANGE_KEYS.indexOf(k)

const ZERO = "No student's progress changes"
/** Two values short enough to draw at hero size on one line at 375 ("On -> Off", "1 -> 2", "Assisted -> Guided"). */
export const FIGURE_MAX = 16

/** A setting's name inside a sentence: first letter lowercased, acronyms kept ("Levels that move..." -> "levels that move..."). */
const mid = (name: string) => (/^[A-Z][a-z]/.test(name) ? name.charAt(0).toLowerCase() + name.slice(1) : name)

/** The switch words for on/off settings, as they read in "Turn on {words}?". */
const SWITCH_WORDS: Partial<Record<string, string>> = {
  approvalRequired: "admin approval",
  selfEvaluation: "student self rating",
  feedbackRequired: "required feedback",
}

/**
 * The title when no student's progress changes: the action as a question (Romit via coordinator, 2026-11-12, C2 change 2). One change: its
 * own verb; several: "Apply 3 changes?". Unit tested per change type (tests/lab/apply-summary.test.ts).
 */
export function actionTitle(changes: readonly SummaryLine[], saved: LabRule, rule: LabRule, effects: SummaryInput["effects"]): string {
  if (changes.length !== 1) return `Apply ${changes.length} changes?`
  const l = changes[0]!
  const name = l.row?.name ?? ""
  switch (l.key) {
    case "model":
      return `Change how ${skillNounPlural()} are judged?`
    case "criteria":
      return `Change the ${mid(name)}?`
    case "levels":
      return name === "Level name" ? "Rename a level?" : name === "Level names" ? "Rename the levels?" : name === "Level order" ? "Reorder the levels?" : "Change the levels?"
    case "outcomeLabels":
      return name === "Outcome name" ? "Rename an outcome?" : "Rename the outcomes?"
    case "questions":
      return "Change the questions?"
    case "need":
      return "Change times needed?"
    case "evaluatorRoles":
      return "Change who signs off?"
    case "approvalRequired":
    case "selfEvaluation":
    case "feedbackRequired":
      return `Turn ${rule[l.key] ? "on" : "off"} ${SWITCH_WORDS[l.key]}?`
    case "studentFields":
      return "Change what the student fills in?"
    case "checkOff":
      return effects.checkOff ? `Turn ${effects.checkOff} group check-off?` : "Change what a group check-off records?"
    case "minimums":
      return "Clear the level minimums?"
    case "cleared":
      return `Clear ${mid(name)}?`
    default:
      return "Apply these settings?"
  }
}

/** The callout: who moves and which way, the plain reason when there is one, and the link to their names. */
function studentsBlock(saved: LabRule | null, rule: LabRule, plan: ProgramApplyPlan, impact: ProgramImpact): StudentsBlock {
  const moved = impact.ruleChanged ? impact.students : []
  if (!moved.length) return { kind: "zero", text: ZERO }
  const on = (skills: number) => (skills === 1 ? `on 1 ${skillNoun()}` : `on some ${skillNounPlural()}`)
  const down = moved.filter((x) => x.down > 0).length
  const up = moved.filter((x) => x.up > 0).length
  const lost = moved.filter((x) => x.lost > 0).length
  const others = moved.filter((x) => x.other > 0 && !x.down && !x.up && !x.lost)
  // Moves that cross no state boundary still go one way: a looser level rule keeps Achieved but adds evaluations that move the student forward.
  const otherFwd = others.filter((x) => x.forward > 0 && !x.back).length
  const otherBack = others.filter((x) => x.back > 0 && !x.forward).length
  const otherMixed = others.length - otherFwd - otherBack
  const heads: string[] = []
  const parts: HeroPart[] = []
  if (down) {
    const to = impact.downTo.length === 1 ? impact.downTo[0]! : null
    heads.push(to ? `${students(down)} ${v(down, "goes", "go")} from Achieved to ${STATE_SPEC[to as RecordState].label} ${on(impact.skillsDown)}` : `${students(down)} ${v(down, "is", "are")} no longer Achieved ${on(impact.skillsDown)}`)
    parts.push({ count: down, loss: true, segs: to ? [{ state: "achieved" }, { arrow: true }, { state: to as RecordState }, { text: on(impact.skillsDown) }] : [{ text: v(down, "is no longer", "are no longer") }, { state: "achieved" }, { text: on(impact.skillsDown) }] })
  }
  if (up) {
    heads.push(`${students(up)} ${v(up, "reaches", "reach")} Achieved ${on(impact.skillsUp)}`)
    parts.push({ count: up, loss: false, segs: [{ text: v(up, "reaches", "reach") }, { state: "achieved" }, { text: on(impact.skillsUp) }] })
  }
  if (lost) {
    const tail = `progress on ${impact.skillsLost === 1 ? `the ${skillNoun()} that becomes` : `the ${skillNounPlural()} that become`} not configured`
    heads.push(`${students(lost)} ${v(lost, "loses", "lose")} ${tail}`)
    parts.push({ count: lost, loss: true, segs: [{ text: `${v(lost, "loses", "lose")} ${tail}` }] })
  }
  const stay = impact.otherStays
  const otherPart = (count: number, dir: "forward" | "back" | "mixed") => {
    const more = dir === "forward" ? "more" : "fewer"
    if (stay && dir !== "mixed") {
      const tail = `${on(impact.skillsOther)}, with ${more} evaluations moving them forward`
      heads.push(`${students(count)} ${v(count, "stays", "stay")} ${STATE_SPEC[stay].label} ${tail}`)
      // On screen one tight line, "stay [Achieved] on fewer evaluations" (H1, D-L149). Neutral either way: nobody leaves a state, so nothing is lost.
      parts.push({ count, loss: false, segs: [{ text: v(count, "stays", "stay") }, { state: stay }, { text: `on ${more} evaluations` }] })
      return
    }
    const words = dir === "forward" ? `${v(count, "moves", "move")} forward ${on(impact.skillsOther)}` : dir === "back" ? `${v(count, "moves", "move")} back ${on(impact.skillsOther)}` : `${v(count, "sees", "see")} their progress change ${on(impact.skillsOther)}`
    heads.push(`${students(count)} ${words}`)
    parts.push({ count, loss: dir === "back", segs: [{ text: words }] })
  }
  if (otherFwd) otherPart(otherFwd, "forward")
  if (otherBack) otherPart(otherBack, "back")
  if (otherMixed) otherPart(otherMixed, "mixed")
  // Said once, in the footnote, only when students move (H1, D-L149). The number itself is the Times needed row, so it is not repeated here.
  const reason = "No evaluation is deleted."
  const total = moved.length
  return { kind: "moves", heads, parts, loss: parts.some((x) => x.loss), reason, total, show: "See who", back: "Hide names" }
}
