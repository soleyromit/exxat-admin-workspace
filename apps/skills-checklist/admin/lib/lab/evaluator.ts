/**
 * Design lab: evaluator (preceptor) and lab instructor screens. Pure view models built read-only from V2State and the v2
 * selectors; nothing here writes to the store, so every lab state is repeatable.
 *
 * Sources: [REQ EV-01..EV-07, SC-03, SC-12, SC-14, SC-15, RV-01..RV-06]; ledger D-L2 (one link per request, an email lists
 * each request with its own link, a link exposes only its own request); strategy/02 section 8 (email, receipt copy).
 * Open and NOT decided here: OD-08 (does a correction keep earlier answers: prefill is a lab option, off), OD-18 (link
 * lifetime: the expiry date is a lab sample), the "Feedback only" third answer (Q-C3, lab option, off), the one-line rule
 * hint (strategy/05 bias concern, lab option, off), what an unverified evaluator name does to counting (ledger Q9).
 */
import { needsLevels, needsQuestions } from "@/lib/v2/config"
import { DEMO_TODAY, IDS } from "@/lib/v2/seed"
import { SCORE_MAX, studentContext, waitingFor } from "@/lib/v2/preceptor"
import { labSkills, labStudents } from "@/lib/v2/lab"
import { binaryLabels, outcomeWord } from "@/lib/v2/labels"
import type { EvalModel, Outcome, Person, Skill, Submission, V2State } from "@/lib/v2/types"
import { LABEL_PRESETS, type LabelPresetId } from "./configure"
import { aNoun, capitalize, skillNoun, skillNounPlural } from "./terms"

// ---------------------------------------------------------------------------------------------------------------------
// Lab controls

export type EvState =
  | "default"
  | "corrected"
  | "further-attempt"
  | "forwarded"
  | "expired"
  | "not-for-you"
  | "completed"
  | "submitted"
  | "offline"
  | "errors"
  | "unverified"

export const EV_STATES: Array<{ id: EvState; label: string }> = [
  { id: "default", label: "Default" },
  { id: "corrected", label: "Corrected request" },
  { id: "further-attempt", label: "Further attempt" },
  { id: "forwarded", label: "Forwarded: is this for you?" },
  { id: "expired", label: "Expired link" },
  { id: "not-for-you", label: "Not for you" },
  { id: "completed", label: "Already completed" },
  { id: "submitted", label: "Submitted" },
  { id: "offline", label: "Offline, queued" },
  { id: "errors", label: "Validation errors" },
  { id: "unverified", label: "Name not yet on record" },
]

export const isEvState = (x: string | null | undefined): x is EvState => !!x && EV_STATES.some((s) => s.id === x)

/** "request": the real seeded request (Maya Ferreira, 2 skills). "long": a lab sample of every published NURS 350 skill. */
export type EvSample = "request" | "long"

export interface EvOptions {
  /** One-line achievement hint per skill. PENDING-ROMIT (strategy/05 bias concern). Off by default. */
  ruleHint: boolean
  /** Third answer "Feedback only". PENDING-ROMIT (strategy/02 Q-C3). Off by default. */
  feedbackOnly: boolean
  /** Corrected request: prefill the earlier answers. OD-08 open. Off by default. */
  prefill: boolean
  /** Preview of SC-14: the program makes feedback mandatory on every skill in the request. Default: the seed config. */
  requireFeedback: boolean
  /** Preview of SC-15: the program holds evidence for approval. Default: the seed config. */
  holdForApproval: boolean
  /**
   * Preview the program's labels as if it had started from a Configure preset (?labels=approval|independence) [CALL 10-26 B.3].
   * The lab configure screen never writes the shared store, so this is how the form shows those labels. Null: the seed labels.
   */
  labels?: LabelPresetId | null
}

export const DEFAULT_OPTIONS: EvOptions = { ruleHint: false, feedbackOnly: false, prefill: false, requireFeedback: false, holdForApproval: false, labels: null }

/** The program's binary labels and level names for a skill, through an optional preset. Labels only; the recorded outcome never changes. */
export function programLabels(skill: Skill, preset: LabelPresetId | null | undefined): { outcomes: [string, string]; levels: string[] } {
  const outcomes = binaryLabels(skill.config?.outcomeLabels)
  const levels = skill.config && needsLevels(skill.model as EvalModel, skill.config) ? [...skill.config.levels] : []
  const p = preset ? LABEL_PRESETS[preset] : null
  return {
    outcomes: p?.outcomes ? [...p.outcomes] : outcomes,
    // Same number of levels only, so a recorded level index keeps pointing at the same rung.
    levels: p?.levels && levels.length === p.levels.length ? [...p.levels] : levels,
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// The request the link opens

export const EVALUATOR_ID = IDS.delgado
export const LAB_INSTRUCTOR_ID = IDS.whitmore
/** The seeded request waiting for J. Delgado with two skills. */
export const SEED_REQUEST_ID = "sub-maya-1"
/** Every published NURS 350 skill, one of each evaluation model. Used only by the "long" sample. */
const LONG_SAMPLE = ["sk-urinary-cath", "sk-med-admin", "sk-sterile-dressing", "sk-vitals", "sk-ng-tube", "sk-blood-glucose", "sk-handoff"]

export type AnswerKind = "yes-no" | "score" | null

export interface EvChoice {
  value: Outcome
  label: string
}

export interface EvSelf {
  /** The student's self-rating in the skill's own words, or null. */
  rating: string | null
  /** Question model: the student's own Yes or No per question. */
  answers: Array<"yes" | "no"> | null
  note: string
}

export interface EvSkill {
  id: string
  name: string
  model: EvalModel
  choices: EvChoice[]
  /** Program level names when the model records a level; empty otherwise. */
  levels: string[]
  levelsLabel: string
  questions: string[]
  answerKind: AnswerKind
  feedbackRequired: boolean
  holds: boolean
  self: EvSelf | null
  /** Shown only when the rule hint option is on. */
  ruleHint: string
  /** Further attempt: the attempt number, and the program's limit when it set one. */
  attempt: { n: number; limit: number | null } | null
  /** Corrected request: what this evaluator answered on the earlier revision. */
  prior: EvResponse | null
}

export interface EvRequest {
  id: string
  evaluator: { name: string; first: string }
  student: { name: string; first: string }
  course: { code: string; name: string }
  where: { location: string; setting: string } | null
  programName: string
  skills: EvSkill[]
  /** 1 for a first request; 2 or more after the student corrected and sent it again (RV-02). */
  revision: number
  returnReason: string | null
  /** Display date the link stops working. OD-18 open: a lab sample. */
  expiresOn: string
  sentOn: string
  /** False when the student named this evaluator and the program has not added them yet. */
  onRecord: boolean
  /** Lab sample only (not a real request). */
  sample: boolean
}

export interface EvResponse {
  outcome: Outcome | null
  level: number | null
  answers: Array<"yes" | "no" | number | null>
  feedback: string
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
export function shortDate(iso: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T09:00:00Z` : iso)
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`
}
const addDays = (iso: string, n: number) => new Date(new Date(iso.length === 10 ? `${iso}T09:00:00Z` : iso).getTime() + n * 86400000).toISOString()

export const firstName = (name: string): string => name.split(/[\s,]+/).filter((w) => w && !/^[A-Z]\.$/.test(w))[0] ?? name

export function choicesFor(skill: Skill, feedbackOnly: boolean, preset: LabelPresetId | null = null): EvChoice[] {
  // The program's own labels; a stored legacy "Not met" shows as the default "Unmet" (lib/v2/labels.ts binaryLabels).
  const [a, b] = programLabels(skill, preset).outcomes
  const out: EvChoice[] = [
    { value: "met", label: a },
    { value: "not-met", label: b },
  ]
  if (feedbackOnly) out.push({ value: "not-yet", label: "Feedback only" })
  return out
}

function ruleHintFor(skill: Skill, preset: LabelPresetId | null = null): string {
  const a = skill.config?.achievement
  if (!a || !skill.config) return ""
  const named = programLabels(skill, preset)
  const min = a.minLevelIndex
  if (min !== null && needsLevels(skill.model, skill.config)) return `Counts at ${named.levels[min] ?? skill.config.levels[min]} or above.`
  return `${named.outcomes[0]} counts toward the program's rule.`
}

export const blankResponse = (k: Pick<EvSkill, "questions">): EvResponse => ({ outcome: null, level: null, answers: k.questions.map(() => null), feedback: "" })

function realReturnReason(s: V2State): string {
  const all = s.submissions.flatMap((x) => x.returns ?? []).map((r) => r.reason)
  return all.find((r) => !/form|photo|paper/i.test(r)) ?? all[0] ?? "The date of the shift was wrong. Corrected and sent again."
}

function toEvSkill(s: V2State, skill: Skill, x: Submission | null, studentId: string, state: EvState, o: EvOptions): EvSkill {
  const c = skill.config!
  const model = skill.model as EvalModel
  const entry = x ? studentContext(s, x, skill.id) : null
  const named = programLabels(skill, o.labels)
  const levels = named.levels
  const questions = needsQuestions(model) ? c.questions : []
  // The student's self-rating reads in the same labels as the evaluator's choices, so the two sit side by side.
  const selfWord = (rating: string) => {
    const w = outcomeWord(rating)
    const [seedMet, seedNot] = binaryLabels(c.outcomeLabels)
    if (w === seedMet) return named.outcomes[0]
    if (w === seedNot) return named.outcomes[1]
    const li = needsLevels(model, c) ? c.levels.indexOf(w) : -1
    return li >= 0 && named.levels[li] ? named.levels[li] : w
  }
  const earlier = s.evaluations.filter((e) => e.studentId === studentId && e.skillId === skill.id && e.outcome === "not-met").length
  const prior: EvResponse | null =
    state === "corrected"
      ? { outcome: "met", level: levels.length ? Math.min(1, levels.length - 1) : null, answers: questions.map(() => (model === "scored" ? 4 : "yes")), feedback: "Clear steps and good patient explanation." }
      : null
  return {
    id: skill.id,
    name: skill.name,
    model,
    choices: choicesFor(skill, o.feedbackOnly, o.labels ?? null),
    levels,
    levelsLabel: model === "demonstration" ? "Level observed" : "Overall rating",
    questions,
    answerKind: model === "question" ? "yes-no" : model === "scored" ? "score" : null,
    feedbackRequired: o.requireFeedback || !!c.feedbackRequired,
    holds: o.holdForApproval || !!c.approvalRequired,
    self: entry && (entry.rating || entry.answers || entry.note) ? { rating: entry.rating ? selfWord(entry.rating) : entry.rating, answers: entry.answers, note: entry.note } : null,
    ruleHint: ruleHintFor(skill, o.labels ?? null),
    attempt: state === "further-attempt" ? { n: Math.max(2, earlier + 1), limit: c.failure.attemptLimit } : null,
    prior,
  }
}

/** The request the evaluator link opens, for one lab state. Null only when the seed lacks the request. */
export function buildRequest(s: V2State, sample: EvSample, state: EvState, o: EvOptions = DEFAULT_OPTIONS): EvRequest | null {
  const x = s.submissions.find((r) => r.id === SEED_REQUEST_ID) ?? waitingFor(s, EVALUATOR_ID)[0] ?? null
  if (!x) return null
  const evaluator = s.people.find((p) => p.id === EVALUATOR_ID)
  const student = s.people.find((p) => p.id === x.studentId)
  if (!evaluator || !student) return null
  const ids = sample === "long" ? LONG_SAMPLE : x.skillIds
  const skills = ids
    .map((id) => s.skills.find((k) => k.id === id))
    .filter((k): k is Skill => !!k && !!k.config && !!k.model && k.configured)
    .map((k) => toEvSkill(s, k, x, student.id, state, o))
  const entry = s.logEntries.find((e) => (x.entryIds ?? []).includes(e.id))
  const placement = s.placements.find((p) => p.studentId === student.id && p.courseId === s.course.id)
  const where = entry?.location ? { location: entry.location, setting: entry.clinicalSetting ?? placement?.setting ?? "" } : placement ? { location: placement.location, setting: placement.setting } : null
  // An expired link was sent more than the 14-day lifetime ago, so its "Expired" date is before the demo day (not after it).
  const sentOn = state === "expired" ? addDays(DEMO_TODAY, -15) : x.createdAt
  return {
    id: x.id,
    evaluator: { name: evaluator.name, first: firstName(evaluator.name) },
    student: { name: student.name, first: firstName(student.name) },
    course: { code: s.course.code, name: s.course.name },
    where,
    programName: `${s.program.school} ${s.program.name}`,
    skills,
    revision: state === "corrected" ? (x.revisions ?? 0) + 2 : 1,
    returnReason: state === "corrected" ? realReturnReason(s) : null,
    expiresOn: shortDate(addDays(sentOn, 14)),
    sentOn: shortDate(sentOn),
    onRecord: state !== "unverified" && evaluator.verified !== false,
    sample: sample === "long",
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// Answers, validation and the receipt

export const evFieldId = {
  outcome: (skillId: string) => `ev-out-${skillId}`,
  level: (skillId: string) => `ev-lvl-${skillId}`,
  question: (skillId: string, i: number) => `ev-q-${skillId}-${i}`,
  feedback: (skillId: string) => `ev-fb-${skillId}`,
}

export interface EvIssue {
  skillId: string
  skillName: string
  field: string
  /** Short, for the field. */
  message: string
}

const graded = (r: EvResponse) => r.outcome === "met" || r.outcome === "not-met"

/** What still blocks submit, in form order. Each message says what to do. */
export function validate(req: EvRequest, responses: Record<string, EvResponse>): EvIssue[] {
  const out: EvIssue[] = []
  for (const k of req.skills) {
    const r = responses[k.id] ?? blankResponse(k)
    const base = { skillId: k.id, skillName: k.name }
    if (!r.outcome) out.push({ ...base, field: evFieldId.outcome(k.id), message: "Choose an outcome." })
    if (graded(r) && k.levels.length && r.level === null) out.push({ ...base, field: evFieldId.level(k.id), message: `Choose the ${k.levelsLabel.toLowerCase()}.` })
    if (graded(r) && k.answerKind) {
      const missing = k.questions.findIndex((_, i) => (r.answers[i] ?? null) === null)
      if (missing >= 0) out.push({ ...base, field: evFieldId.question(k.id, missing), message: k.answerKind === "score" ? `Score every question from 1 to ${SCORE_MAX}.` : "Answer every question." })
    }
    if ((k.feedbackRequired || r.outcome === "not-yet") && !r.feedback.trim()) out.push({ ...base, field: evFieldId.feedback(k.id), message: "Write feedback. The program requires it." })
  }
  return out
}

/** A skill is done when it has no issue left. */
export function doneCount(req: EvRequest, responses: Record<string, EvResponse>): number {
  const open = new Set(validate(req, responses).map((i) => i.skillId))
  return req.skills.filter((k) => !open.has(k.id)).length
}

export type ReceiptStatus = "counts" | "waits" | "queued" | "feedback"

export interface ReceiptLine {
  skillId: string
  name: string
  answer: string
  status: ReceiptStatus
  /** Glyph + word, never colour alone. */
  word: string
  icon: string
}

/** Per skill: does it count now or wait (EV-07). Offline answers are queued on the device first. */
export function receipt(req: EvRequest, responses: Record<string, EvResponse>, opts: { offline?: boolean } = {}): ReceiptLine[] {
  return req.skills.map((k) => {
    const r = responses[k.id] ?? blankResponse(k)
    const choice = k.choices.find((c) => c.value === r.outcome)
    const answer = [choice?.label ?? "No answer", r.level !== null && k.levels[r.level] ? k.levels[r.level] : null].filter(Boolean).join(", ")
    if (opts.offline) return { skillId: k.id, name: k.name, answer, status: "queued", word: "Queued on this device", icon: "fa-cloud-arrow-up" }
    if (r.outcome === "not-yet") return { skillId: k.id, name: k.name, answer, status: "feedback", word: "Feedback recorded", icon: "fa-comment" }
    if (k.holds) return { skillId: k.id, name: k.name, answer, status: "waits", word: "Waits for program approval", icon: "fa-clock" }
    return { skillId: k.id, name: k.name, answer, status: "counts", word: "Counts now", icon: "fa-circle-check" }
  })
}

/** A filled response for every skill: the lab "submitted" state and the receipt preview. */
export function sampleResponses(req: EvRequest): Record<string, EvResponse> {
  return Object.fromEntries(
    req.skills.map((k) => [k.id, { outcome: "met", level: k.levels.length ? Math.min(1, k.levels.length - 1) : null, answers: k.questions.map(() => (k.answerKind === "score" ? 4 : "yes")), feedback: k.feedbackRequired ? "Safe technique, explained each step." : "" } as EvResponse]),
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// The invitation email (rendered content only; nothing is sent)

export interface InviteRow {
  requestId: string
  student: string
  course: string
  skills: string[]
  where: string
  /** Each request has its own link (D-L2). */
  link: string
}

export interface Invitation {
  to: string
  from: string
  subject: string
  greeting: string
  rows: InviteRow[]
  skillCount: number
  expiresOn: string
  plainText: string
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** One email to one evaluator listing every open request, each with its own link. Subject names the student and count. */
export function buildInvitation(s: V2State, evaluatorId: string = EVALUATOR_ID, onlyRequestId?: string): Invitation | null {
  const evaluator = s.people.find((p) => p.id === evaluatorId)
  if (!evaluator) return null
  const open = waitingFor(s, evaluatorId)
    .filter((x) => !onlyRequestId || x.id === onlyRequestId)
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
  const rows: InviteRow[] = open.map((x) => {
    const st = s.people.find((p) => p.id === x.studentId) as Person | undefined
    const entry = s.logEntries.find((e) => (x.entryIds ?? []).includes(e.id))
    const placement = s.placements.find((p) => p.studentId === x.studentId && p.courseId === s.course.id)
    const where = entry?.location ? `${entry.location}${entry.clinicalSetting ? `, ${entry.clinicalSetting}` : ""}` : placement ? `${placement.location}, ${placement.setting}` : "Clinical placement"
    return {
      requestId: x.id,
      student: st?.name ?? "A student",
      course: s.course.code,
      skills: x.skillIds.map((id) => s.skills.find((k) => k.id === id)?.name ?? capitalize(aNoun())),
      where,
      link: `https://evaluate.example.edu/r/${x.id}`,
    }
  })
  const skillCount = rows.reduce((n, r) => n + r.skills.length, 0)
  const students = new Set(rows.map((r) => r.student))
  const names = [...students]
  const subject =
    names.length <= 1
      ? `${names[0] ?? "A student"} asks you to sign off ${plural(skillCount, skillNoun(), skillNounPlural())}`
      : names.length === 2
        ? `${names[0]} and ${names[1]}: ${plural(skillCount, skillNoun(), skillNounPlural())} to sign off`
        : `${names[0]} and ${plural(names.length - 1, "other", "others")}: ${plural(skillCount, skillNoun(), skillNounPlural())} to sign off`
  const oldest = open[0]?.createdAt ?? `${DEMO_TODAY}T09:00:00Z`
  const expiresOn = shortDate(addDays(open[open.length - 1]?.createdAt ?? oldest, 14))
  const from = `${s.program.school} ${s.program.name}`
  const greeting = `Hello ${evaluator.name},`
  const lines = [
    greeting,
    "",
    `${plural(rows.length, "request is", "requests are")} waiting for your sign-off. Each link opens one request. No account is needed.`,
    "",
    ...rows.flatMap((r) => [`${r.student}, ${r.course}, ${r.where}`, ...r.skills.map((k) => `  - ${k}`), `  Open: ${r.link}`, ""]),
    `Links work until ${expiresOn}.`,
    "Not the right person? Reply to tell the student so they can send it to someone else.",
    "",
    from,
  ]
  return { to: evaluator.email, from, subject, greeting, rows, skillCount, expiresOn, plainText: lines.join("\n") }
}

// ---------------------------------------------------------------------------------------------------------------------
// Lab batch grid (lab instructor)

export interface RosterFilter {
  query: string
  /** "cohort|group", or "" for every group. */
  group: string
}

export interface RosterRow {
  id: string
  name: string
  cohort: string
  group: string
}

export function rosterGroups(s: V2State): Array<{ value: string; label: string; count: number }> {
  const students = labStudents(s)
  const groups = new Map<string, number>()
  for (const p of students) {
    const key = `${p.cohort ?? "No cohort"}|${p.group ?? "No group"}`
    groups.set(key, (groups.get(key) ?? 0) + 1)
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([value, count]) => ({ value, label: value.replace("|", ", "), count }))
}

export function roster(s: V2State, f: RosterFilter): RosterRow[] {
  const q = f.query.trim().toLowerCase()
  return labStudents(s)
    .filter((p) => !f.group || `${p.cohort ?? "No cohort"}|${p.group ?? "No group"}` === f.group)
    .filter((p) => !q || p.name.toLowerCase().includes(q))
    .map((p) => ({ id: p.id, name: p.name, cohort: p.cohort ?? "", group: p.group ?? "" }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export interface LabSkillRow {
  id: string
  name: string
  blocked: string | null
}

export function labSessionSkills(s: V2State): LabSkillRow[] {
  const inst = s.people.find((p) => p.id === LAB_INSTRUCTOR_ID)
  return labSkills(s, "lab", inst).map((x) => ({ id: x.skill.id, name: x.skill.name, blocked: x.blocked }))
}

export type LabMark = Outcome | "absent" | null

/** One count, said once: results recorded, students done, students left. */
export function labTally(rows: RosterRow[], skillIds: string[], cells: Record<string, LabMark>): { results: number; done: number; left: number; absent: number } {
  let results = 0
  let done = 0
  let absent = 0
  for (const r of rows) {
    if (cells[`${r.id}|*`] === "absent") {
      absent++
      continue
    }
    const marks = skillIds.map((k) => cells[`${r.id}|${k}`] ?? null)
    results += marks.filter(Boolean).length
    if (skillIds.length && marks.every(Boolean)) done++
  }
  return { results, done, left: rows.length - done - absent, absent }
}

// ---------------------------------------------------------------------------------------------------------------------
// Second and third variants (appended 2026-10-26): receipt summary, inbox preview, SMS-length text. Content only; nothing is sent
// (REQ section 14 puts delivery and notifications out of scope). Every figure is derived from the request or the invitation above.

export interface ReceiptSummary {
  counts: number
  waits: number
  queued: number
  feedback: number
}

export function receiptSummary(lines: ReceiptLine[]): ReceiptSummary {
  const n = (s: ReceiptStatus) => lines.filter((l) => l.status === s).length
  return { counts: n("counts"), waits: n("waits"), queued: n("queued"), feedback: n("feedback") }
}

/** What the student sees on their progress for each skill after this submit, in the student's words (glossary). */
export const STUDENT_SEES: Record<ReceiptStatus, { word: string; icon: string }> = {
  counts: { word: "Counted", icon: "fa-circle-check" },
  waits: { word: "Awaiting approval", icon: "fa-hourglass-half" },
  queued: { word: "Waiting for evaluator", icon: "fa-clock" },
  feedback: { word: "Feedback received", icon: "fa-comment" },
}

/** How an inbox list shows the email before it is opened: sender, subject, and the first 40 characters of the body. */
export interface InboxPreview {
  sender: string
  subject: string
  preheader: string
  /** Characters of the subject that most phone inboxes show before truncating. */
  subjectVisible: string
}

export const PREVIEW_CHARS = 40

export function inboxPreview(mail: Invitation): InboxPreview {
  const first = mail.rows.length === 1 ? `${mail.rows[0].student} needs your sign-off. No account needed.` : `${mail.rows.length} requests, one link each. No account needed.`
  return { sender: mail.from, subject: mail.subject, preheader: first.slice(0, PREVIEW_CHARS), subjectVisible: mail.subject.slice(0, PREVIEW_CHARS) }
}

/** One text message per request (one link per request, ledger D-L2). Kept to one SMS segment (160 characters) when possible. */
export interface SmsDraft {
  requestId: string
  student: string
  text: string
  length: number
  segments: number
}

export const SMS_SEGMENT = 160

export function smsDrafts(mail: Invitation, programShort: string): SmsDraft[] {
  return mail.rows.map((r) => {
    const n = r.skills.length
    const text = `${programShort}: ${r.student} asks you to sign off ${n} ${n === 1 ? skillNoun() : skillNounPlural()}. No account needed. ${r.link}`
    return { requestId: r.requestId, student: r.student, text, length: text.length, segments: Math.ceil(text.length / SMS_SEGMENT) }
  })
}
