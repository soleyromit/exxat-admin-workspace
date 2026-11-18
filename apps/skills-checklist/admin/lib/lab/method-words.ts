/**
 * An evaluation method in words (Proposed, D-EM1116-g; contract ADMIN-D3 "round 6 variants").
 *
 *   - `methodSentences`: the method as plain sentences, one per decision, for a review step (Evaluation settings M).
 *   - `describeMethod` and `parseMethodWords`: the same method as short lines an admin can type, and the reader that turns such lines back
 *     into a rule (Evaluation settings N, a spike). The reader is local and deterministic: no network, no model. It fills only what the words
 *     state and returns what it filled and what it could not use, so the screen can show both. It never invents a level name, a question, which
 *     answer moves a student forward or who evaluates [REQ SC-02, SC-03, SC-04, SC-16]. What words cannot say stays as it was (question texts,
 *     the number of times, minimums, the details collected).
 */
import type { EvalModel, EvaluatorRole } from "@/lib/v2/types"
import { LAB_MODEL_LABEL, ROLES, ROLE_LABEL, countsFromIndex, ruleAllowsCheckOff, withModel, type LabRule } from "./configure"
import { checkOffLevelIndex } from "./checkoff-rules"
import { passChip } from "./rule-path"
import { inSentence } from "./terms"

const isInt = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n)
const norm = (t: string) => t.trim().toLowerCase().replace(/\s+/g, " ")
const cap = (t: string) => t.replace(/^./, (c) => c.toUpperCase())
const orList = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} or ${xs[xs.length - 1]}`)

// ---------------------------------------------------------------------------------------------------------------------
// Sentences (M)

export type SentenceStep = "type" | "picks" | "how"
export interface MethodSentence {
  id: string
  /** The step that changes it. */
  step: SentenceStep
  text: string
  /** Not decided yet: shown muted. */
  open?: boolean
}

/** The method read aloud, in the order one part depends on the next [REQ SC-17]. */
export function methodSentences(rule: LabRule): MethodSentence[] {
  const out: MethodSentence[] = []
  const m = rule.model
  if (!m) return [{ id: "type", step: "type", text: "No type chosen yet", open: true }]
  const named = (xs: string[]) => xs.map((x) => x.trim()).filter(Boolean)
  if (m === "demonstration") {
    const levels = named(rule.levels).reverse()
    out.push(levels.length ? { id: "picks", step: "picks", text: `The evaluator picks one of ${levels.length} levels: ${levels.map((l) => inSentence(l)).join(", ")}.` } : { id: "picks", step: "picks", text: "No levels named yet", open: true })
  } else if (m === "binary") {
    const [a, b] = rule.outcomeLabels.map((x) => x.trim())
    out.push(a && b ? { id: "picks", step: "picks", text: `The evaluator picks ${inSentence(a)} or ${inSentence(b)}.` } : { id: "picks", step: "picks", text: "The two outcomes are not named yet", open: true })
  } else {
    const n = named(rule.questions).length
    const scale = m === "scored" ? (isInt(rule.scaleMax) ? `, each scored 1 to ${rule.scaleMax}` : ", on a scale not chosen yet") : ", each Yes or No"
    out.push(n ? { id: "picks", step: "picks", text: `The evaluator answers ${n} ${n === 1 ? "question" : "questions"}${scale}.` } : { id: "picks", step: "picks", text: "No questions written yet", open: true })
  }
  const chip = passChip(rule)?.text
  out.push(chip ? { id: "forward", step: "picks", text: `A student moves forward on: ${inSentence(chip)}.` } : { id: "forward", step: "picks", text: "What moves a student forward is not chosen yet", open: true })
  const roles = ROLES.filter((r) => rule.evaluatorRoles.includes(r)).map((r) => ROLE_LABEL[r])
  out.push(roles.length ? { id: "who", step: "how", text: `${cap(orList(roles.map((r, i) => (i ? inSentence(r) : r))))} can evaluate.` } : { id: "who", step: "how", text: "Who can evaluate is not chosen yet", open: true })
  if (rule.selfEvaluation) out.push({ id: "self", step: "how", text: "The student rates themselves first." })
  if (rule.feedbackRequired) out.push({ id: "feedback", step: "how", text: "The evaluator must add feedback." })
  if (rule.approvalRequired) out.push({ id: "approval", step: "how", text: "An admin approves before it counts." })
  if (!rule.selfEvaluation && !rule.feedbackRequired && !rule.approvalRequired) out.push({ id: "needs", step: "how", text: "It counts as soon as the evaluator submits." })
  if (ruleAllowsCheckOff(rule)) out.push({ id: "checkoff", step: "how", text: "Faculty can check off a group at once." })
  return out
}

// ---------------------------------------------------------------------------------------------------------------------
// Lines an admin can type (N)

const ROLE_WORD: Record<EvaluatorRole, string> = { preceptor: "preceptor", faculty: "clinical faculty", "lab-instructor": "lab instructor" }

/** The method as short lines, in the reader's own vocabulary: `parseMethodWords(describeMethod(rule), rule)` gives the rule back. */
export function describeMethod(rule: LabRule): string {
  const m = rule.model
  if (!m) return ""
  const lines: string[] = []
  if (m === "demonstration") {
    const levels = rule.levels.map((l) => l.trim())
    if (levels.some(Boolean)) lines.push(`Levels: ${[...levels].reverse().join(", ")}`)
    else lines.push(`${levels.length} levels`)
    const from = countsFromIndex(rule)
    if (from !== null && levels[from]) lines.push(from === 0 && levels.length > 1 ? "Moves forward at any level" : `Moves forward from ${inSentence(levels[from]!)}`)
  } else if (m === "binary") {
    lines.push(`Outcomes: ${rule.outcomeLabels.map((l) => l.trim()).join(", ")}`)
    if (rule.qualifyingLabel !== null) lines.push(`Moves forward: ${rule.outcomeLabels[rule.qualifyingLabel].trim()}`)
  } else {
    const n = rule.questions.length
    lines.push(m === "scored" ? `${n} ${n === 1 ? "question" : "questions"}, scored${isInt(rule.scaleMax) ? ` 1 to ${rule.scaleMax}` : ""}` : `${n} ${n === 1 ? "question" : "questions"}, yes or no`)
    if (m === "question" && rule.questionRule) {
      const r = rule.questionRule
      lines.push(r.kind === "all" ? "Moves forward when all are Yes" : r.kind === "atLeast" ? `Moves forward when at least ${r.n} are Yes` : `Moves forward when questions ${r.indices.map((i) => i + 1).join(" and ")} are Yes`)
    }
    if (m === "scored" && rule.scoredRule) {
      const r = rule.scoredRule
      lines.push(r.kind === "average" ? `Moves forward at an average of ${r.value}` : r.kind === "minEach" ? `Moves forward at a minimum of ${r.value} on every question` : `Moves forward at a total of ${r.value}`)
    }
  }
  const roles = ROLES.filter((r) => rule.evaluatorRoles.includes(r)).map((r) => ROLE_WORD[r])
  if (roles.length) lines.push(`Evaluated by ${orList(roles)}`)
  if (rule.selfEvaluation) lines.push("Self-evaluation first")
  if (rule.feedbackRequired) lines.push("Feedback required")
  if (rule.approvalRequired) lines.push("Admin approval")
  if (ruleAllowsCheckOff(rule)) {
    const level = m === "demonstration" ? rule.levels[checkOffLevelIndex(rule.levels, rule.checkOff?.levelIndex)]?.trim() : ""
    const score = m === "scored" && isInt(rule.checkOff?.score) ? rule.checkOff!.score : null
    lines.push(`Group check-off${level ? ` as ${inSentence(level)}` : score !== null ? ` with a score of ${score}` : ""}`)
  }
  return lines.join("\n")
}

export interface ParsedWords {
  rule: LabRule
  /** The type the words name, or null when they name none. */
  type: EvalModel | null
  /** What was filled in, as short phrases in reading order. */
  filled: string[]
  /** Pieces of the description nothing could be made of, as typed. */
  unused: string[]
}

const LIST = /^(levels?|outcomes?)\s*[:\-]\s*(.+)$/i
const FORWARD = /\b(moves?\s+(a\s+student\s+)?forward|counts?|qualif(?:y|ies))\b/i

/** Split into clauses: lines and sentences first; a list ("Levels: a, b, c") stays whole, anything else also breaks at commas. */
function clausesOf(text: string): string[] {
  const out: string[] = []
  for (const seg of text.split(/[\n;]+|\.(?=\s|$)/)) {
    const s = seg.trim()
    if (!s) continue
    if (LIST.test(s)) out.push(s)
    else for (const c of s.split(",")) if (c.trim()) out.push(c.trim())
  }
  return out
}

const typeOf = (text: string): EvalModel | null => {
  const t = text.toLowerCase()
  const found: Array<[number, EvalModel]> = []
  const at = (re: RegExp, m: EvalModel) => { const i = t.search(re); if (i >= 0) found.push([i, m]) }
  at(/\b(scored?|scale|\d+\s+to\s+\d+|out of \d+)\b|(?<!self[- ])\b(rated|rating)\b/, "scored")
  at(/\b(questions?|checklist|yes or no)\b/, "question")
  at(/\blevels?\b|\bindependence\b|\bsupervis/, "demonstration")
  at(/\boutcomes?\b|\bmet or unmet\b|\bapproved or not\b|\bsign[- ]?off\b/, "binary")
  if (!found.length) return null
  // Questions with a scale are the scored type, wherever each is said.
  if (found.some(([, m]) => m === "scored")) return "scored"
  return found.sort((a, b) => a[0] - b[0])[0]![1]
}

/**
 * Read a description into a rule. `base` is what the form holds now: its type-specific texts stay (level names when only a count is given,
 * question texts); who can evaluate, what each evaluation needs, group check-off and what moves a student forward are set only from the words,
 * so a line removed from the description is a choice removed from the form.
 */
export function parseMethodWords(text: string, base: LabRule): ParsedWords {
  const clauses = clausesOf(text)
  const type = typeOf(text) ?? base.model
  const filled: string[] = []
  const unused: string[] = []
  if (!type) return { rule: base, type: null, filled, unused: clauses }
  let rule: LabRule = withModel(base, type)
  rule = { ...rule, evaluatorRoles: [], selfEvaluation: false, feedbackRequired: false, approvalRequired: false, checkOff: { enabled: false, levelIndex: null, score: null } }
  // What moves a student forward is the type's own choice: only that one is cleared, to be set from the words.
  if (type === "demonstration") rule = { ...rule, carried: { ...rule.carried, minLevelIndex: null } }
  else if (type === "binary") rule = { ...rule, qualifyingLabel: null }
  else if (type === "question") rule = { ...rule, questionRule: null }
  else rule = { ...rule, scoredRule: null }
  filled.push(LAB_MODEL_LABEL[type])
  const roles = new Set<EvaluatorRole>()
  let forwardName: string | null = null
  let forwardWord: "any" | "top" | null = null
  let checkOffAs: string | null = null
  const resize = <T,>(xs: T[], n: number, blank: T): T[] => (xs.length >= n ? xs.slice(0, n) : [...xs, ...Array.from({ length: n - xs.length }, () => blank)])

  for (const raw of clauses) {
    const c = norm(raw)
    let used = false
    const list = LIST.exec(raw)
    if (list) {
      const kind = list[1]!.toLowerCase().startsWith("level") ? "levels" : "outcomes"
      const names = list[2]!.split(/,|\bor\b/i).map((x) => x.trim()).filter(Boolean)
      if (kind === "levels" && type === "demonstration" && names.length) {
        // Typed highest first, stored lowest first.
        rule = { ...rule, levels: [...names].reverse(), levelMinimums: [] }
        filled.push(`${names.length} levels: ${names.join(", ")}`)
        used = true
      } else if (kind === "outcomes" && type === "binary" && names.length === 2) {
        rule = { ...rule, outcomeLabels: [names[0]!, names[1]!] }
        filled.push(`Outcomes: ${names.join(", ")}`)
        used = true
      }
      if (!used) unused.push(raw)
      continue
    }
    // How many, and on what scale
    const count = /(\d+)\s+(levels?|questions?)/.exec(c)
    if (count) {
      const n = Math.min(Number(count[1]), 40)
      if (count[2]!.startsWith("level") && type === "demonstration" && n >= 2) {
        if (rule.levels.length !== n) rule = { ...rule, levels: resize(rule.levels, n, ""), levelMinimums: [] }
        filled.push(`${n} levels`)
        used = true
      } else if (count[2]!.startsWith("question") && (type === "question" || type === "scored") && n >= 1) {
        if (rule.questions.length !== n) rule = { ...rule, questions: resize(rule.questions, n, "") }
        filled.push(`${n} ${n === 1 ? "question" : "questions"}`)
        used = true
      }
    }
    if (type === "scored") {
      const scale = /\b1\s+to\s+(\d+)\b/.exec(c) ?? /\bout of\s+(\d+)\b/.exec(c)
      if (scale && Number(scale[1]) >= 2 && Number(scale[1]) <= 10) { rule = { ...rule, scaleMax: Number(scale[1]) }; filled.push(`Scored 1 to ${scale[1]}`); used = true }
      const avg = /\baverage(?: of)?\s+(\d+(?:\.\d+)?)/.exec(c)
      const min = /\b(?:minimum(?: of)?|at least)\s+(\d+)\s+on every\b/.exec(c)
      const total = /\btotal(?: of)?\s+(\d+)/.exec(c)
      const scored = avg ? { kind: "average" as const, value: Number(avg[1]) } : min ? { kind: "minEach" as const, value: Number(min[1]) } : total ? { kind: "total" as const, value: Number(total[1]) } : null
      if (scored) { rule = { ...rule, scoredRule: scored }; filled.push(scored.kind === "average" ? `Average of ${scored.value}` : scored.kind === "minEach" ? `At least ${scored.value} on every question` : `Total of ${scored.value}`); used = true }
      if (/\b(scored?|scale)\b|(?<!self[- ])\b(rated|rating)\b/.test(c)) used = true
    }
    if (type === "question") {
      const least = /\bat least\s+(\d+)\b/.exec(c)
      const subset = /\bquestions?\s+((?:\d+(?:\s*(?:,|and)\s*)?)+)\s*(?:are|answered)?\s*yes\b/.exec(c)
      if (/\b(all|every)\b.*\byes\b|\bevery question\b/.test(c)) { rule = { ...rule, questionRule: { kind: "all" } }; filled.push("Every question Yes"); used = true }
      else if (least && /\byes\b/.test(c)) { rule = { ...rule, questionRule: { kind: "atLeast", n: Number(least[1]) } }; filled.push(`At least ${least[1]} Yes`); used = true }
      else if (subset) { const indices = [...subset[1]!.matchAll(/\d+/g)].map((x) => Number(x[0]) - 1).filter((i) => i >= 0); rule = { ...rule, questionRule: { kind: "subset", indices } }; filled.push(`Questions ${indices.map((i) => i + 1).join(", ")} Yes`); used = true }
      if (/\b(checklist|yes or no)\b/.test(c)) used = true
    }
    // Known outcome pairs, said without "Outcomes:"
    if (type === "binary") {
      if (/\bmet or unmet\b/.test(c)) { rule = { ...rule, outcomeLabels: ["Met", "Unmet"] }; filled.push("Outcomes: Met, Unmet"); used = true }
      else if (/\bapproved or not( approved)?\b/.test(c)) { rule = { ...rule, outcomeLabels: ["Approved", "Not approved"] }; filled.push("Outcomes: Approved, Not approved"); used = true }
      else if (/\b(outcomes?|sign[- ]?off)\b/.test(c) && !FORWARD.test(c)) used = true
    }
    // Group check-off (before roles: "faculty check off a group" names no evaluator)
    const group = /\bgroup\b.*\bcheck|\bcheck[- ]?off\b.*\bgroup\b|\bgroup check[- ]?off\b/.test(c)
    if (group) {
      const off = /\b(no|without)\b/.test(c)
      const as = /\bas\s+(.+)$/.exec(raw.trim())
      const score = /\bscore of\s+(\d+)/.exec(c)
      rule = { ...rule, checkOff: { enabled: !off, levelIndex: null, score: score ? Number(score[1]) : null } }
      if (!off && as) checkOffAs = as[1]!.trim()
      if (!off) filled.push("Group check-off")
      used = true
    } else {
      // Who can evaluate
      const before = roles.size
      if (/\bpreceptors?\b/.test(c)) roles.add("preceptor")
      if (/\bfaculty\b/.test(c)) roles.add("faculty")
      if (/\b(lab\s+)?instructors?\b/.test(c)) roles.add("lab-instructor")
      if (/\b(anyone|any role|all roles)\b/.test(c)) for (const r of ROLES) roles.add(r)
      if (roles.size > before) used = true
    }
    // What each evaluation needs
    if (/\bself[- ]?(evaluat|rat|assess)/.test(c)) { const on = !/\b(no|without)\b/.test(c); rule = { ...rule, selfEvaluation: on }; if (on) filled.push("Self-evaluation first"); used = true }
    if (/\b(feedback|comments?)\b/.test(c)) { const on = !/\b(no|without)\b/.test(c); rule = { ...rule, feedbackRequired: on }; if (on) filled.push("Evaluator feedback"); used = true }
    if (/\bapproval\b|\b(admin|administrator)\b.*\b(approv|review)|\bwith review\b/.test(c)) { const on = !/\b(no|without)\b/.test(c); rule = { ...rule, approvalRequired: on }; if (on) filled.push("Admin approval"); used = true }
    // What moves a student forward, by name (levels and outcomes): resolved once the names are known
    if (!used && (type === "demonstration" || type === "binary") && FORWARD.test(c)) {
      if (type === "demonstration" && /\bany level\b/.test(c)) { forwardWord = "any"; used = true }
      else if (type === "demonstration" && /\b(top|highest)\s+level\b/.test(c)) { forwardWord = "top"; used = true }
      else {
        const rest = raw.replace(FORWARD, " ").replace(/\b(from|at|on|when|only|and above|or above|up)\b/gi, " ").replace(/[:]/g, " ").trim()
        if (rest) { forwardName = rest; used = true }
      }
    } else if (!used && FORWARD.test(c) && /\b(yes|average|total|minimum)\b/.test(c)) used = true
    if (!used && typeOf(c) === type && !/\d/.test(c)) used = true
    if (!used) unused.push(raw)
  }

  if (roles.size) {
    rule = { ...rule, evaluatorRoles: ROLES.filter((r) => roles.has(r)) }
    filled.push(rule.evaluatorRoles.map((r, i) => (i ? inSentence(ROLE_LABEL[r]) : ROLE_LABEL[r])).join(", "))
  }
  const indexOfName = (xs: string[], name: string) => xs.findIndex((x) => x.trim() && norm(x) === norm(name))
  if (type === "demonstration") {
    const named = rule.levels.filter((l) => l.trim()).length
    const from = forwardWord === "any" ? 0 : forwardWord === "top" ? rule.levels.length - 1 : forwardName ? indexOfName(rule.levels, forwardName) : -1
    if (from >= 0 && (forwardName || named === rule.levels.length || forwardWord === "any")) {
      rule = { ...rule, carried: { ...rule.carried, minLevelIndex: from } }
      filled.push(forwardWord === "any" ? "Any level moves forward" : forwardWord === "top" ? "The top level moves forward" : `Moves forward from ${inSentence(rule.levels[from]!.trim())}`)
    } else if (forwardName) unused.push(forwardName)
    else if (forwardWord === "top") { rule = { ...rule, carried: { ...rule.carried, minLevelIndex: from } }; filled.push("The top level moves forward") }
    if (checkOffAs) {
      const i = indexOfName(rule.levels, checkOffAs)
      // The highest level is what a tick records unless another is named: left unset, as the form leaves it.
      if (i >= 0 && i !== checkOffLevelIndex(rule.levels, null)) rule = { ...rule, checkOff: { ...rule.checkOff!, levelIndex: i } }
    }
  }
  if (type === "binary" && forwardName) {
    const i = indexOfName(rule.outcomeLabels, forwardName)
    if (i === 0 || i === 1) { rule = { ...rule, qualifyingLabel: i }; filled.push(`Moves forward: ${rule.outcomeLabels[i].trim()}`) }
    else unused.push(forwardName)
  }
  return { rule, type, filled, unused }
}
