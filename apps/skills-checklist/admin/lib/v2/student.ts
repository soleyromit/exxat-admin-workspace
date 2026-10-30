import { inSentence } from "@/lib/lab/terms"
import type { Result } from "./admin-actions"
import { needsLevels } from "./config"
import { engineRuleOf, runRule, strengthHint } from "./rules"
import { evalsOfStudentSkill, skillById } from "./evidence-index"
import { IDS } from "./seed"
import { sentForNewEvaluationLabel } from "./labels"
import { appendAudit } from "./store"
import { flushQueue, queueChange, syncBlock } from "./sync"
import type { Evaluation, EvaluatorRole, LogDraft, MappingRow, Person, Setting, SignoffMethod, Skill, Submission, V2State } from "./types"

/** Stage 2 student logic: remaining work, prerequisites, who may sign off, logging and requests. Pure; every function returns a new state. */

export const STUDENT_ID = IDS.maya

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)
const clean = (t: string) => t.trim()

// ---------------------------------------------------------------------------------------------------------------------
// Progress against the published achievement rule

export interface SettingProgress {
  setting: string
  have: number
  min: number
}

export interface SkillProgress {
  skillId: string
  achieved: boolean
  /** Successful evaluations that count toward the rule, after the window, the simulation cap and the minimum level. */
  counted: number
  need: number
  window: number | null
  distinct: { have: number; need: number }
  settings: SettingProgress[]
  /** Evaluations awaiting approval: excluded until approved (AR-06). */
  awaiting: number
  /** Counted evaluations that did not meet the criteria. */
  notMet: number
  /** Simulation evaluations left out because of the cap or because simulation does not count for the skill. */
  simulationLeftOut: number
  summary: string
  /** What is still needed, in plain words. Empty when achieved. */
  left: string[]
  /** Facts that explain a number, for example that lab evidence does not count toward a setting. */
  notes: string[]
  /** The rule in the student's own words. */
  rule: string
  /** Evaluation ids the rule actually used, after the window, the simulation cap and the minimum level. */
  used: string[]
  /** Evaluation ids that were met but left out of the rule, with why. */
  leftOut: Record<string, string>
}

/** The achievement rule as a sentence addressed to the student. */
export function ruleSentence(skill: Skill): string {
  if (!skill.config) return "This skill has no rule yet."
  const s = strengthHint(skill.model, skill.config).sentence
  return s.startsWith("A student needs ") ? `You need ${s.slice("A student needs ".length)}` : s
}

/**
 * Progress for one student and skill against the skill's published rule (ST-01, SH-05). Only counted evaluations count; evidence
 * awaiting approval is excluded (AR-06). Lab and simulation evidence never satisfies a named clinical setting (SC-12): a setting
 * minimum is only met by clinical evaluations carrying that clinical setting.
 */
export function skillProgress(s: V2State, studentId: string, skillId: string): SkillProgress | null {
  const skill = skillById(s, skillId)
  const rule = skill ? engineRuleOf(skill) : null
  if (!skill?.config || !rule) return null
  const a = skill.config.achievement
  const mine = evalsOfStudentSkill(s, studentId, skillId)
  // The one engine (lib/v2/rules.ts): the same call the lab configure impact makes, so published rules read the same everywhere.
  const run = runRule(rule, mine)
  // A rule with no valid frequency has no progress to report (it cannot be published that way; never defaulted to 1).
  if (!run.valid) return null
  const awaiting = mine.filter((e) => e.status === "awaiting-approval").length
  const { have, achieved, distinctHave, settings, simLeftOut } = run

  const left: string[] = []
  const notes: string[] = []
  if (!achieved) {
    if (have < a.need) left.push(`${a.need - have} more successful ${plural(a.need - have, "evaluation", "evaluations")}`)
    if (have > 0 && distinctHave < a.distinctEvaluators) left.push(`Evaluations from ${a.distinctEvaluators - distinctHave} more different ${plural(a.distinctEvaluators - distinctHave, "evaluator", "evaluators")} (you have ${distinctHave})`)
    for (const x of settings) if (x.have < x.min) left.push(`${x.min - x.have} more in ${inSentence(x.setting)} (you have ${x.have} of ${x.min})`)
    for (const l of run.levels) if (l.have < l.min) left.push(`${l.min - l.have} more at ${inSentence(l.level)} or above (you have ${l.have} of ${l.min})`)
  }
  if (settings.length > 0) notes.push("Lab and simulation do not count toward a clinical setting.")
  if (simLeftOut > 0) {
    notes.push(
      !rule.simulationExcluded
        ? `${simLeftOut} simulation ${plural(simLeftOut, "evaluation is", "evaluations are")} not counted because simulation can supply at most ${run.maxSim ?? 0} of ${a.need}.`
        : `${simLeftOut} simulation ${plural(simLeftOut, "evaluation is", "evaluations are")} not counted because simulation does not count for this skill.`,
    )
  }
  if (awaiting > 0) notes.push(`${awaiting} ${plural(awaiting, "evaluation is", "evaluations are")} waiting for approval and not counted yet.`)

  return {
    skillId,
    achieved,
    counted: have,
    need: a.need,
    window: rule.window,
    distinct: { have: distinctHave, need: a.distinctEvaluators },
    settings: settings.map((x): SettingProgress => ({ setting: x.setting, min: x.min, have: x.have })),
    awaiting,
    notMet: run.notMet,
    simulationLeftOut: simLeftOut,
    summary: `${have} of ${a.need} successful ${plural(a.need, "evaluation", "evaluations")}`,
    left,
    notes,
    rule: ruleSentence(skill),
    used: run.used.map((e) => e.id),
    leftOut: run.leftOut,
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// Prerequisites

export interface PrereqItem {
  id: string
  label: string
  met: boolean
  detail: string
  /** What to do when not met, or null. */
  todo: string | null
}

export interface PrereqStatus {
  required: boolean
  met: boolean
  items: PrereqItem[]
}

/** Practice trials logged in the lab or simulation for a skill. They are saved on the phone first, so they count at once. */
export function practiceTrials(s: V2State, studentId: string, skillId: string): number {
  return s.logEntries.filter((e) => e.studentId === studentId && e.skillId === skillId && e.setting !== "clinical").length
}

/**
 * What must hold before a clinical attempt opens. Every item the skill's rule lists is required together, as the Stage 1 review
 * step words it: lab check-off, the practice trials, and each prerequisite skill met. Lab and simulation logging is never locked.
 */
export function prerequisiteStatus(s: V2State, studentId: string, skill: Skill): PrereqStatus {
  const p = skill.config?.prerequisites
  if (!p) return { required: false, met: true, items: [] }
  const items: PrereqItem[] = []
  if (p.labCheckoff) {
    const c = s.labCheckoffs.find((x) => x.studentId === studentId && x.skillId === skill.id)
    items.push({
      id: "lab-checkoff",
      label: "Lab check-off",
      met: !!c,
      detail: c ? `Passed with ${s.people.find((x) => x.id === c.byId)?.name ?? "a lab instructor"}` : "Not passed yet",
      todo: c ? null : "Pass the lab check-off. Your lab instructor records it after a lab session.",
    })
  }
  if (p.practiceTrials > 0) {
    const n = practiceTrials(s, studentId, skill.id)
    const left = p.practiceTrials - n
    items.push({
      id: "practice",
      label: "Practice trials",
      met: n >= p.practiceTrials,
      detail: `${Math.min(n, p.practiceTrials)} of ${p.practiceTrials} logged`,
      todo: left > 0 ? `Log ${left} more practice ${plural(left, "trial", "trials")} in the lab or simulation.` : null,
    })
  }
  for (const id of p.skillIds) {
    const k = s.skills.find((x) => x.id === id)
    const pr = k ? skillProgress(s, studentId, id) : null
    const met = !!pr?.achieved
    items.push({
      id: `skill:${id}`,
      label: k ? `${k.name} met` : "A skill that was removed",
      met,
      detail: met ? "Met" : pr ? `Not met yet: ${pr.summary}` : "Not available",
      todo: met ? null : k ? `Get ${k.name} signed off first.` : null,
    })
  }
  return { required: items.length > 0, met: items.every((i) => i.met), items }
}

// ---------------------------------------------------------------------------------------------------------------------
// What is left on the course

export type SkillStatus = "achieved" | "in-progress" | "not-started"
export const STATUS_LABEL: Record<SkillStatus, string> = { achieved: "Achieved", "in-progress": "In progress", "not-started": "Not started" }

export interface CourseItem {
  skill: Skill
  level: MappingRow["level"] | "unmapped"
  progress: SkillProgress
  prereq: PrereqStatus
  status: SkillStatus
  /** The open request that includes this skill, if any. */
  request: Submission | null
  /** Logged clinical entries for this skill that have no request yet. */
  unsent: number
}

export interface NotOpen {
  skill: Skill
  level: MappingRow["level"]
  reason: string
}

export type NextKind = "returned" | "resolve" | "request" | "log" | "practice" | "wait" | "optional" | "clear"

export interface NextAction {
  kind: NextKind
  title: string
  reason: string
  href: string
  /** The button label: it names exactly what it does. */
  label: string
  skillId: string | null
}

export interface CourseWork {
  mandatory: CourseItem[]
  /** Recommended on the course (feeds "Likely here" and the placement-ending nudge). Never required. */
  recommended: CourseItem[]
  /** Optional on the course: submittable, counts on the record, never required or suggested. */
  optionalOnly: CourseItem[]
  /**
   * Every non-mandatory skill (recommended, then optional), the block the v2 screens list under one heading. Kept as the union so
   * existing screens read the same rows; the two levels stay separate in `recommended` and `optionalOnly` (B.9).
   */
  optional: CourseItem[]
  notExpected: CourseItem[]
  notOpen: NotOpen[]
  summary: { mandatory: number; achieved: number; waiting: number; optional: number; optionalAchieved: number; recommended: number; recommendedAchieved: number }
  next: NextAction
}

const OPEN_STATUSES: Submission["status"][] = ["on-device", "with-evaluator", "awaiting-review", "stalled", "returned"]

export function openRequestFor(s: V2State, studentId: string, skillId: string): Submission | null {
  return s.submissions.find((x) => x.studentId === studentId && x.skillIds.includes(skillId) && OPEN_STATUSES.includes(x.status)) ?? null
}

/**
 * The evaluator a held evaluation was sent to by "Assign to someone else" (lib/lab/reviewer.ts assignEntry), or null when the
 * evaluation was really returned. Recognised by the reassignment on its linked request that carries the evaluation's own review
 * note and time, so a real return (no reassignment) is never mistaken for one.
 */
export function sentElsewhereTo(s: V2State, e: Evaluation): Person | null {
  // "reassigned" since 2026-10-30 (D-X25); "returned" is the older stored shape, still read.
  if ((e.status !== "reassigned" && e.status !== "returned") || !e.submissionId || !e.review) return null
  const review = e.review
  const sub = s.submissions.find((x) => x.id === e.submissionId)
  const hop = sub?.reassignments?.find((h) => h.reason === review.note && h.at === review.at)
  return hop ? s.people.find((p) => p.id === hop.toId) ?? null : null
}

/**
 * The evaluator an open request was sent to by a reviewer's "Assign to someone else", or null for a request the student sent.
 * Its last reassignment names the current assignee and carries the assignment note.
 */
export function sentForNewEvaluationTo(s: V2State, x: Submission): Person | null {
  if (x.status !== "with-evaluator" && x.status !== "stalled") return null
  const hop = x.reassignments?.[x.reassignments.length - 1]
  if (!hop || hop.toId !== x.assignedToId) return null
  const p = s.people.find((q) => q.id === hop.toId)
  return p && hop.reason === sentForNewEvaluationLabel(p.name) ? p : null
}

/** Text for who a request is with. Names the person (SH-02). */
export function requestWaitText(s: V2State, x: Submission): string {
  const name = (id: string) => s.people.find((p) => p.id === id)?.name ?? "an evaluator"
  switch (x.status) {
    case "on-device":
      return "Saved on this phone, not sent yet"
    case "with-evaluator":
      if (sentForNewEvaluationTo(s, x)) return sentForNewEvaluationLabel(name(x.assignedToId))
      return x.candidateIds && x.candidateIds.length > 1 ? `Waiting for the first of ${x.candidateIds.map(name).join(", ")}` : `Waiting for ${name(x.assignedToId)}`
    case "awaiting-review":
      return x.method === "photo" ? `Photo of the paper form is with the reviewer, ${name(x.assignedToId)}` : `Waiting for the reviewer, ${name(x.assignedToId)}, to approve it`
    case "stalled":
      return `Waiting for ${name(x.assignedToId)} for ${x.daysWaiting} days`
    case "returned": {
      const r = x.returns?.[x.returns.length - 1]
      return r ? `Returned for correction: ${r.reason}` : "Returned for correction"
    }
    default:
      return "Done"
  }
}

const byName = (a: CourseItem, b: CourseItem) => a.skill.name.localeCompare(b.skill.name)

function statusOf(p: SkillProgress): SkillStatus {
  return p.achieved ? "achieved" : p.counted > 0 || p.notMet > 0 || p.awaiting > 0 ? "in-progress" : "not-started"
}

/** Clinical log entries with no request yet and no sync conflict: what the student can send for sign-off. */
export function unsentEntries(s: V2State, studentId: string = STUDENT_ID) {
  return s.logEntries.filter((e) => e.studentId === studentId && e.setting === "clinical" && e.requestId === null)
}

/**
 * Everything the student still has to do on the course: mapped skills grouped by requirement level with progress against each
 * skill's own rule, skills the program has not opened (never silently hidden), and the best next action (ST-01, IM-09).
 */
export function courseWork(s: V2State, studentId: string = STUDENT_ID): CourseWork {
  const items: CourseItem[] = []
  const notOpen: NotOpen[] = []
  for (const m of s.mappings.filter((x) => x.courseId === s.course.id)) {
    const skill = s.skills.find((k) => k.id === m.skillId)
    if (!skill) continue
    const progress = skillProgress(s, studentId, skill.id)
    if (!skill.configured || !skill.published || !progress) {
      if (m.level !== "not-expected") {
        notOpen.push({ skill, level: m.level, reason: skill.configured ? "Your program has not opened this skill yet." : "Your program has not set this skill up yet." })
      }
      continue
    }
    items.push({
      skill,
      level: m.level,
      progress,
      prereq: prerequisiteStatus(s, studentId, skill),
      status: statusOf(progress),
      request: openRequestFor(s, studentId, skill.id),
      unsent: unsentEntries(s, studentId).filter((e) => e.skillId === skill.id).length,
    })
  }
  const group = (level: MappingRow["level"]) => items.filter((i) => i.level === level).sort(byName)
  const mandatory = group("mandatory")
  // Three levels kept apart (B.9, CALL 10-26). `optional` stays the non-mandatory union the v2 screens list under one heading.
  const recommended = group("recommended")
  const optionalOnly = group("optional")
  const optional = [...recommended, ...optionalOnly].sort(byName)
  const notExpected = group("not-expected")
  notOpen.sort((a, b) => a.skill.name.localeCompare(b.skill.name))

  return {
    mandatory,
    recommended,
    optionalOnly,
    optional,
    notExpected,
    notOpen,
    summary: {
      mandatory: mandatory.length,
      achieved: mandatory.filter((i) => i.status === "achieved").length,
      waiting: mandatory.filter((i) => i.request && i.status !== "achieved").length,
      optional: optional.length,
      optionalAchieved: optional.filter((i) => i.status === "achieved").length,
      recommended: recommended.length,
      recommendedAchieved: recommended.filter((i) => i.status === "achieved").length,
    },
    // Recommended first, then optional: the next suggestion after mandatory follows the level, not the alphabet.
    next: nextAction(s, studentId, mandatory, [...recommended, ...optionalOnly]),
  }
}

function nextAction(s: V2State, studentId: string, mandatory: CourseItem[], optional: CourseItem[]): NextAction {
  const back = s.submissions.filter((x) => x.studentId === studentId && x.status === "returned")
  if (back.length > 0) {
    const x = back[back.length - 1]
    const names = x.skillIds.map((id) => s.skills.find((k) => k.id === id)?.name ?? "A skill")
    const r = x.returns?.[x.returns.length - 1]
    return { kind: "returned", title: `Fix and send again: ${names.length > 1 ? `${names[0]} and ${names.length - 1} more` : names[0]}`, reason: r ? `Your reviewer returned it: ${r.reason}` : "Your reviewer returned it for correction.", href: "/v2/student/request-signoff", label: "See what to fix", skillId: null }
  }
  const conflicts = s.syncQueue.filter((i) => i.studentId === studentId && i.state === "conflict").length
  if (conflicts > 0) {
    return { kind: "resolve", title: `Fix ${conflicts} sync ${plural(conflicts, "conflict", "conflicts")}`, reason: "Two versions of the same entry disagree. Nothing is lost until you choose.", href: "/v2/student/offline-sync", label: "Open sync and fix conflicts", skillId: null }
  }
  const unsent = unsentEntries(s, studentId)
  if (unsent.length > 0) {
    return { kind: "request", title: `Ask for sign-off on ${unsent.length} logged ${plural(unsent.length, "entry", "entries")}`, reason: "Logged skills only count once an evaluator signs them off.", href: "/v2/student/request-signoff", label: "Ask for sign-off", skillId: null }
  }
  const todo = mandatory.filter((i) => i.status !== "achieved")
  const ready = todo.filter((i) => !i.request && i.prereq.met).sort((a, b) => (a.status === b.status ? a.progress.need - a.progress.counted - (b.progress.need - b.progress.counted) : a.status === "in-progress" ? -1 : 1) || a.skill.name.localeCompare(b.skill.name))
  if (ready[0]) {
    const i = ready[0]
    return { kind: "log", title: `Log ${i.skill.name}`, reason: i.progress.left[0] ? `Left: ${i.progress.left.join(", ")}.` : i.progress.rule, href: `/v2/student/pick-and-rate?skill=${i.skill.id}`, label: `Log ${i.skill.name}`, skillId: i.skill.id }
  }
  const locked = todo.filter((i) => !i.request && !i.prereq.met).sort(byName)
  if (locked[0]) {
    const i = locked[0]
    const first = i.prereq.items.find((x) => !x.met)
    return { kind: "practice", title: `Get ready for ${i.skill.name}`, reason: first?.todo ?? "A prerequisite is missing.", href: `/v2/student/pick-and-rate?skill=${i.skill.id}`, label: `Log a practice trial of ${i.skill.name}`, skillId: i.skill.id }
  }
  const waiting = todo.filter((i) => i.request).sort(byName)
  if (waiting[0]) {
    const i = waiting[0]
    return { kind: "wait", title: `Waiting on sign-off for ${i.skill.name}`, reason: requestWaitText(s, i.request as Submission), href: "/v2/student/request-signoff", label: "See your requests", skillId: i.skill.id }
  }
  // `optional` arrives recommended first, then optional, each by name; keep that order.
  const opt = optional.filter((i) => i.status !== "achieved" && !i.request)[0]
  if (opt) return { kind: "optional", title: `Mandatory skills are done. Log ${opt.skill.name}`, reason: opt.level === "recommended" ? "It is recommended for this course. More evidence still counts toward your record." : "It is optional for this course. More evidence still counts toward your record.", href: `/v2/student/pick-and-rate?skill=${opt.skill.id}`, label: `Log ${opt.skill.name}`, skillId: opt.skill.id }
  return { kind: "clear", title: "You are up to date", reason: "Every mandatory skill is achieved or waiting for a sign-off.", href: "/v2/student/history", label: "See your record", skillId: null }
}

// ---------------------------------------------------------------------------------------------------------------------
// Who can sign off (ST-08, ST-09, SC-16)

export interface EvaluatorChoice {
  person: Person
  eligible: boolean
  /** Why not, in plain words. Empty when eligible. */
  reasons: string[]
}

// Program faculty (kind "faculty") sign off as faculty, like the reviewer and director who also teach.
const ROLE_OF_KIND: Partial<Record<Person["kind"], EvaluatorRole>> = { preceptor: "preceptor", faculty: "faculty", reviewer: "faculty", director: "faculty", "lab-instructor": "lab-instructor" }

const ROLE_NAME: Record<EvaluatorRole, string> = { preceptor: "a preceptor", faculty: "faculty", "lab-instructor": "a lab instructor" }

/**
 * Why a person cannot sign off a skill performed in this setting, or null when they can (ST-08, EV-02: the valid roles depend on
 * where the skill was performed AND on the roles the skill permits).
 * - Clinical: a preceptor or faculty the skill permits; never a lab instructor.
 * - Lab or simulation: a lab instructor, or faculty the skill permits; never a preceptor, who signs off at the placement.
 *   [INFER] The skill's role list names the clinical roles (no published skill lists "lab instructor"), so the setting, not the
 *   list, admits the lab instructor. The qualification checks below still apply to everyone. Lab and simulation evidence never
 *   satisfies a clinical-setting minimum whoever signs it (SC-12, lib/v2/rules.ts).
 */
export function ineligibleReason(skill: Skill, person: Person, setting: Setting = "clinical"): string | null {
  const c = skill.config
  if (!c) return "This skill is not set up yet."
  const role = ROLE_OF_KIND[person.kind]
  if (!role) return "This person is not an evaluator."
  if (setting === "clinical") {
    if (role === "lab-instructor") return "Lab instructors sign off in the lab, not in clinical practice."
    if (!c.evaluatorRoles.includes(role)) return `This skill cannot be signed off by ${ROLE_NAME[role]}.`
  } else {
    if (role === "preceptor") return "Preceptors sign off at the placement, not in the lab or simulation."
    if (role === "faculty" && !c.evaluatorRoles.includes(role)) return `This skill cannot be signed off by ${ROLE_NAME[role]}.`
  }
  const q = c.qualification
  const have = person.credentials ?? []
  if (q.credentials.length && !q.credentials.some((x) => have.includes(x))) return `Needs ${q.credentials.join(" or ")} credential (has ${have.length ? have.join(", ") : "none on record"})`
  if ((person.yearsPractice ?? 0) < q.minYears) return `Needs ${q.minYears} or more years of practice (has ${person.yearsPractice ?? 0})`
  const missing = q.training.filter((x) => !(person.training ?? []).includes(x))
  if (missing.length) return `Needs training in ${missing.join(", ")}`
  return null
}

/**
 * Evaluators the student can pick for a request carrying these skills. A person is eligible only if qualified for EVERY skill.
 * Preceptors and lab instructors are always listed (an unqualified one is shown disabled with the reason); faculty are listed
 * only when qualified. A student can only pick qualified evaluators.
 */
export function evaluatorChoices(s: V2State, skillIds: string[], setting: Setting = "clinical"): EvaluatorChoice[] {
  const skills = skillIds.map((id) => s.skills.find((k) => k.id === id)).filter((k): k is Skill => !!k)
  const pool = s.people.filter((p) => p.kind === "preceptor" || p.kind === "lab-instructor" || p.kind === "reviewer" || p.kind === "director")
  const out: EvaluatorChoice[] = []
  for (const person of pool) {
    const failed = skills.map((k) => ({ k, r: ineligibleReason(k, person, setting) })).filter((x): x is { k: Skill; r: string } => !!x.r)
    // The same reason for every skill (a lab instructor, say) is said once, not once per skill.
    const same = failed.length === skills.length && new Set(failed.map((x) => x.r)).size === 1
    const reasons = same ? [failed[0].r] : failed.map((x) => (skills.length > 1 ? `${x.k.name}: ${x.r}` : x.r))
    const eligible = reasons.length === 0
    if ((person.kind === "reviewer" || person.kind === "director") && !eligible) continue
    out.push({ person, eligible, reasons })
  }
  return out
}

// ---------------------------------------------------------------------------------------------------------------------
// Logging (ST-04 to ST-13)

export type RatingKind = "levels" | "outcome" | "questions" | "none"

/** The kind of self-rating a skill offers, taken from its own configuration. Never a hard-coded scale (SC-08). */
export function ratingKind(skill: Skill): RatingKind {
  const c = skill.config
  if (!c || !skill.model) return "none"
  if (needsLevels(skill.model, c)) return "levels"
  if (skill.model === "binary") return "outcome"
  if (skill.model === "question") return "questions"
  return "none"
}

/** The values a student may pick for a rating, in the program's own words and order. */
export function ratingOptions(skill: Skill): string[] {
  const c = skill.config
  if (!c) return []
  const kind = ratingKind(skill)
  if (kind === "levels") return c.levels.filter((l) => l.trim())
  if (kind === "outcome") return c.outcomeLabels.filter((l) => l.trim())
  return []
}

export interface LogInput {
  skillIds: string[]
  setting: Setting
  clinicalSetting: string | null
  location: string | null
  ratings: Record<string, string>
  answers: Record<string, Array<"yes" | "no" | null>>
  notes: Record<string, string>
}

const NOTE_MAX = 500

const nextId = (prefix: string, ids: string[]): string => {
  const max = ids.reduce((m, id) => (id.startsWith(`${prefix}-`) && /^\d+$/.test(id.slice(prefix.length + 1)) ? Math.max(m, Number(id.slice(prefix.length + 1))) : m), 0)
  return `${prefix}-${max + 1}`
}

/**
 * True when a skill can be logged or sent at all: configured, in use (IM-09) and not deactivated (SL-11: deactivating withdraws a
 * skill from student selection; evidence already recorded against it stays on the record and is never hidden).
 */
export function openToLog(skill: Skill): boolean {
  return skill.configured && skill.published && skill.active !== false && !!skill.config
}

export const SETTING_WORD: Record<Setting, string> = { clinical: "clinical", lab: "lab", simulation: "simulation" }

/**
 * Saves one entry per skill on the device first. Entries are queued and sent straight away when the phone can sync. Refuses a
 * skill that is not in use, a clinical entry with a locked prerequisite, a missing or unknown rating, and a missing setting.
 */
export function logSkills(s: V2State, input: LogInput, at: string, studentId: string = STUDENT_ID): Result<{ entryIds: string[]; batchId: string }> {
  if (input.skillIds.length === 0) return { ok: false, error: "Pick at least one skill to log." }
  if (input.setting === "clinical") {
    if (!input.clinicalSetting || !clean(input.clinicalSetting)) return { ok: false, error: "Choose where you did it. Pick a placement, or choose lab or simulation." }
    if (!input.location || !clean(input.location)) return { ok: false, error: "Enter the location, for example the unit or clinic name." }
  }
  const skills: Skill[] = []
  for (const id of input.skillIds) {
    const k = s.skills.find((x) => x.id === id)
    if (!k) return { ok: false, error: "A skill you picked is no longer in the library. Go back and pick again." }
    if (k.active === false) return { ok: false, error: `${k.name} is no longer in use, so it cannot be logged. Its evidence stays on your record.` }
    if (!openToLog(k)) return { ok: false, error: `${k.name} is not open yet, so it cannot be logged. Your program has to put it in use first.` }
    if (input.setting === "clinical") {
      const pre = prerequisiteStatus(s, studentId, k)
      if (!pre.met) return { ok: false, error: `${k.name} cannot be logged in a clinical setting yet. ${pre.items.find((i) => !i.met)?.todo ?? "A prerequisite is missing."}` }
    }
    skills.push(k)
  }
  for (const k of skills) {
    const kind = ratingKind(k)
    const note = input.notes[k.id] ?? ""
    if (note.length > NOTE_MAX) return { ok: false, error: `Keep the note on ${k.name} under ${NOTE_MAX} characters.` }
    if (kind === "levels" || kind === "outcome") {
      const r = input.ratings[k.id]
      if (!r) return { ok: false, error: `Rate yourself on ${k.name}, or remove it from this log.` }
      if (!ratingOptions(k).includes(r)) return { ok: false, error: `${r} is not one of the choices for ${k.name}. Choose one from the list.` }
    }
    if (kind === "questions") {
      const a = input.answers[k.id]
      const n = k.config?.questions.length ?? 0
      if (!a || a.length !== n || a.some((x) => x === null)) return { ok: false, error: `Answer every question for ${k.name}, or remove it from this log.` }
    }
  }

  const batchId = nextId("lb", s.logEntries.map((e) => e.batchId))
  let state = s
  const entryIds: string[] = []
  for (const k of skills) {
    const kind = ratingKind(k)
    const id = nextId("log", state.logEntries.map((e) => e.id))
    const a = input.answers[k.id]
    const entry = {
      id,
      studentId,
      skillId: k.id,
      batchId,
      setting: input.setting,
      clinicalSetting: input.setting === "clinical" ? input.clinicalSetting : null,
      location: input.location && clean(input.location) ? clean(input.location) : null,
      rating: kind === "levels" || kind === "outcome" ? (input.ratings[k.id] ?? null) : null,
      answers: kind === "questions" && a ? (a as Array<"yes" | "no">) : null,
      note: clean(input.notes[k.id] ?? ""),
      at,
      requestId: null,
    }
    state = { ...state, logEntries: [...state.logEntries, entry] }
    state = queueChange(state, { studentId, label: `Log entry: ${k.name}, ${SETTING_WORD[input.setting]}`, entryId: id }, at).state
    state = appendAudit(state, studentId, `Logged a skill, saved on this phone (${SETTING_WORD[input.setting]})`, k.name, at)
    entryIds.push(id)
  }
  state = { ...state, logDraft: null }
  state = flushQueue(state, at, undefined, studentId).state
  return { ok: true, state, entryIds, batchId }
}

/** Saves the log flow in progress. Not audited: a draft is not a decision. */
export function saveLogDraft(s: V2State, draft: LogDraft | null): V2State {
  return { ...s, logDraft: draft }
}

// ---------------------------------------------------------------------------------------------------------------------
// Requests for sign-off (ST-08, ST-09, EV-01, EV-05)

export const METHOD_WORD: Record<SignoffMethod, string> = { qr: "QR code", handover: "handing over the phone", link: "a link", photo: "a photo of the paper form" }

export const PHOTO_MAX_KB = 10 * 1024

export interface RequestInput {
  entryIds: string[]
  method: SignoffMethod
  evaluatorIds: string[]
  photo?: { name: string; sizeKb: number; type: string }
}

/** Path the QR, the link and the handover open. The Stage 3 preceptor route. No account is created (EV-01). */
export const requestPath = (id: string) => `/v2/preceptor/preceptor-evaluation?request=${encodeURIComponent(id)}`

export function reviewerId(s: V2State): string {
  return s.people.find((p) => p.kind === "reviewer")?.id ?? IDS.reviewer
}

/**
 * Creates one real request tied to every skill it carries (EV-05). QR and handover take one evaluator, a link takes one or more
 * qualified evaluators (the first to finish completes it), a photo takes the person who signed the paper form and goes to the review
 * queue as a paper submission. Saved on the device first: it reaches the evaluator or the queue when it syncs.
 */
export function createRequest(s: V2State, input: RequestInput, at: string, studentId: string = STUDENT_ID): Result<{ submissionId: string }> {
  if (input.entryIds.length === 0) return { ok: false, error: "Choose at least one logged skill to send." }
  const entries = []
  for (const id of input.entryIds) {
    const e = s.logEntries.find((x) => x.id === id && x.studentId === studentId)
    if (!e) return { ok: false, error: "A logged skill is no longer on this phone. Go back and choose again." }
    const name = s.skills.find((k) => k.id === e.skillId)?.name ?? "A skill"
    if (e.setting !== "clinical") return { ok: false, error: `${name} was logged as a ${SETTING_WORD[e.setting]} practice trial. Practice trials are not sent for sign-off.` }
    if (e.requestId) return { ok: false, error: `${name} is already in a request. A request that is waiting cannot be sent again.` }
    if (s.syncQueue.some((i) => i.entryId === e.id && i.state === "conflict")) return { ok: false, error: `${name} has a sync conflict. Fix the conflict first, then send it.` }
    entries.push(e)
  }
  const skillIds = [...new Set(entries.map((e) => e.skillId))]
  const names = skillIds.map((id) => s.skills.find((k) => k.id === id)?.name ?? "A skill")
  const nameList = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0]

  const ids = [...new Set(input.evaluatorIds)]
  if (input.method === "link") {
    if (ids.length === 0) return { ok: false, error: "Choose at least one evaluator for the link." }
  } else if (ids.length !== 1) {
    return { ok: false, error: input.method === "photo" ? "Choose who signed the paper form." : "Choose one evaluator." }
  }
  const choices = evaluatorChoices(s, skillIds)
  for (const id of ids) {
    const c = choices.find((x) => x.person.id === id)
    if (!c) return { ok: false, error: "That person is not an evaluator on record. Choose someone from the list." }
    if (!c.eligible) return { ok: false, error: `${c.person.name} cannot sign this off. ${c.reasons[0]}` }
  }
  if (input.method === "photo") {
    if (!input.photo) return { ok: false, error: "Add a photo of the signed paper form." }
    if (!input.photo.type.startsWith("image/")) return { ok: false, error: `That file is not a photo. Choose a photo (JPG, PNG, HEIC or WebP) under ${PHOTO_MAX_KB / 1024} MB.` }
    if (input.photo.sizeKb > PHOTO_MAX_KB) return { ok: false, error: `That photo is ${Math.round(input.photo.sizeKb / 1024)} MB. Choose one under ${PHOTO_MAX_KB / 1024} MB.` }
  }

  const id = nextId("sub-maya", s.submissions.map((x) => x.id))
  const photo = input.method === "photo" && input.photo ? { name: input.photo.name, sizeKb: Math.max(1, Math.round(input.photo.sizeKb)) } : undefined
  const sub: Submission = {
    id,
    studentId,
    skillIds,
    method: input.method,
    status: "on-device",
    assignedToId: input.method === "photo" ? reviewerId(s) : ids[0],
    createdAt: at,
    daysWaiting: 0,
    entryIds: entries.map((e) => e.id),
    candidateIds: ids,
    ...(photo ? { photo } : {}),
  }
  const who = ids.map((x) => s.people.find((p) => p.id === x)?.name ?? "an evaluator")
  let state: V2State = {
    ...s,
    submissions: [...s.submissions, sub],
    logEntries: s.logEntries.map((e) => (input.entryIds.includes(e.id) ? { ...e, requestId: id } : e)),
  }
  state = queueChange(state, { studentId, label: `Request for sign-off: ${nameList}`, requestId: id }, at).state
  state = appendAudit(state, studentId, `Requested sign-off by ${METHOD_WORD[input.method]}, saved on this phone`, `${nameList} to ${who.join(", ")}`, at)
  state = flushQueue(state, at, undefined, studentId).state
  return { ok: true, state, submissionId: id }
}

/** Requests of the student, newest first. */
export function requestsOf(s: V2State, studentId: string = STUDENT_ID): Submission[] {
  return s.submissions.filter((x) => x.studentId === studentId).slice().reverse()
}

export { syncBlock }

// ---------------------------------------------------------------------------------------------------------------------
// Where it happened (ST-05, ST-06, ST-07)

export interface WhereOption {
  value: string
  label: string
  description: string
  setting: Setting
  clinicalSetting: string | null
  location: string | null
  /** True when the student has to type the location (no placement to take it from). */
  askLocation: boolean
}

/**
 * The places a student can say a skill was performed. Clinical options come from the student's placements for the course (a single
 * one is simply preselected, ST-06); with no placement on record the program's full list is offered (ST-07). Lab and simulation are
 * always offered and are practice trials.
 */
export function whereOptions(s: V2State, studentId: string = STUDENT_ID): WhereOption[] {
  const placements = s.placements.filter((p) => p.studentId === studentId && p.courseId === s.course.id)
  const clinical: WhereOption[] = placements.length
    ? placements.map((p) => ({ value: `placement:${p.id}`, label: p.location, description: `${p.setting} placement for ${s.course.code}`, setting: "clinical" as const, clinicalSetting: p.setting, location: p.location, askLocation: false }))
    : s.program.clinicalSettings.map((name) => ({ value: `program:${name}`, label: name, description: "From the program's list of settings. No placement is on record for this course.", setting: "clinical" as const, clinicalSetting: name, location: null, askLocation: true }))
  return [
    ...clinical,
    { value: "lab", label: "Lab", description: "A practice trial. It counts toward prerequisites and is not sent for sign-off.", setting: "lab", clinicalSetting: null, location: null, askLocation: false },
    { value: "simulation", label: "Simulation", description: "A practice trial. It counts toward prerequisites and is not sent for sign-off.", setting: "simulation", clinicalSetting: null, location: null, askLocation: false },
  ]
}

// ---------------------------------------------------------------------------------------------------------------------
// History: the student's record so far (SH-01 to SH-05)

export type AttemptKind = "counted" | "did-not-meet" | "not-yet" | "waiting" | "returned" | "reopened"

export interface Attempt {
  key: string
  /** 1 for the first attempt at this skill, in date order (SH-01). */
  attempt: number
  date: string
  kind: AttemptKind
  /** The explicit outcome in words (SH-02). */
  outcome: string
  /** Who it is with, when waiting (SH-02). */
  who: string
  setting: string
  evaluation: Evaluation | null
  /** What counted: a sentence about the rule and this attempt. */
  counted: string
  /** The rule that was not met, in plain words (SH-03). */
  failedRule: string | null
  /** Why a reviewer returned it, when it was returned (RV-02). */
  returnReason: string | null
}

export interface SkillHistory {
  skill: Skill
  attempts: Attempt[]
  progress: SkillProgress
}

export interface HistorySummary {
  counted: number
  waiting: number
  didNotMeet: number
  /** Not yet, feedback only: no pass or fail is recorded. */
  notYet: number
  returned: number
}

const settingText = (e: Evaluation) => (e.setting === "clinical" ? `Clinical, ${e.clinicalSetting ?? "setting not recorded"}` : e.setting === "lab" ? "Lab" : "Simulation")

/** Every attempt the student made per skill, in order, with an explicit outcome, who it is with, and what counted. */
export function studentHistory(s: V2State, studentId: string = STUDENT_ID): { skills: SkillHistory[]; summary: HistorySummary } {
  const name = (id: string) => s.people.find((p) => p.id === id)?.name ?? "an evaluator"
  const out: SkillHistory[] = []
  const summary: HistorySummary = { counted: 0, waiting: 0, didNotMeet: 0, notYet: 0, returned: 0 }
  for (const skill of s.skills) {
    const evals = s.evaluations.filter((e) => e.studentId === studentId && e.skillId === skill.id).sort((a, b) => (a.date < b.date ? -1 : 1))
    const open = s.submissions.filter((x) => x.studentId === studentId && x.skillIds.includes(skill.id) && OPEN_STATUSES.includes(x.status) && x.status !== "returned")
    const returnedSubs = s.submissions.filter((y) => y.studentId === studentId && y.skillIds.includes(skill.id) && y.status === "returned" && !evals.some((e) => e.submissionId === y.id && e.status === "returned"))
    const progress = skillProgress(s, studentId, skill.id)
    if (!progress || (evals.length === 0 && open.length === 0 && returnedSubs.length === 0)) continue
    const attempts: Attempt[] = []
    for (const e of evals) {
      const base = { key: e.id, attempt: attempts.length + 1, date: e.date, setting: settingText(e), evaluation: e, who: name(e.evaluatorId), failedRule: null as string | null, returnReason: null as string | null }
      if (e.status === "awaiting-approval") {
        attempts.push({ ...base, kind: "waiting", outcome: "Waiting for approval", who: `the reviewer, ${name(reviewerId(s))}`, counted: "Not counted yet. Evidence waiting for approval is left out of the rule until it is approved.", })
        summary.waiting++
      } else if (sentElsewhereTo(s, e)) {
        // A handoff, not a return: shown as waiting with the new evaluator. The open request it is linked to already counts once
        // in "waiting", so this attempt adds to neither waiting nor returned.
        const to = sentElsewhereTo(s, e)!
        attempts.push({ ...base, kind: "waiting", outcome: sentForNewEvaluationLabel(to.name), who: to.name, counted: `Not counted yet. It counts after ${to.name} completes the new evaluation.` })
      } else if (e.status === "returned") {
        attempts.push({ ...base, kind: "returned", outcome: "Returned for correction", counted: "Does not count. Your reviewer returned it, so it is kept in your record and a new attempt is needed.", returnReason: e.review?.note ?? null })
        summary.returned++
      } else if (e.status === "reopened") {
        attempts.push({ ...base, kind: "reopened", outcome: `Reopened. Version ${e.currentVersion} says ${e.outcome === "met" ? "Met" : e.outcome === "not-yet" ? "Not yet" : "Did not meet the criteria"}`, counted: "Does not count while the reviewer has it open. Every earlier version is kept.", })
        summary.returned++
      } else if (e.outcome === "met") {
        const why = progress.leftOut[e.id]
        attempts.push({ ...base, kind: "counted", outcome: "Counted", counted: why ?? (e.setting === "clinical" ? "Counts toward the rule" + (e.clinicalSetting ? ` and toward ${inSentence(e.clinicalSetting)}.` : ".") : `Counts toward the rule. ${e.setting === "lab" ? "Lab" : "Simulation"} evidence never counts toward a clinical setting.`) })
        summary.counted++
      } else if (e.outcome === "not-yet") {
        attempts.push({ ...base, kind: "not-yet", outcome: "Not yet, feedback only", counted: "Feedback only. No pass or fail is recorded and it does not count toward the rule.", failedRule: `${ruleSentence(skill)} Read the feedback, then make a further attempt. The earlier one stays as it is.` })
        summary.notYet++
      } else {
        attempts.push({ ...base, kind: "did-not-meet", outcome: "Did not meet the criteria", counted: "This attempt is kept in your record and does not count toward the rule.", failedRule: `${ruleSentence(skill)} You can make a further attempt. The earlier one stays as it is.` })
        summary.didNotMeet++
      }
    }
    for (const x of open) {
      attempts.push({ key: x.id, attempt: attempts.length + 1, date: x.createdAt, kind: "waiting", outcome: "Waiting", who: x.status === "on-device" ? "this phone (not sent yet)" : x.status === "awaiting-review" ? `the reviewer, ${name(x.assignedToId)}` : name(x.assignedToId), setting: "Clinical", evaluation: null, counted: "Not counted yet. It counts after the evaluator completes it" + (x.status === "awaiting-review" ? " and the reviewer approves it." : "."), failedRule: null, returnReason: null })
      summary.waiting++
    }
    for (const x of returnedSubs) {
      const r = x.returns?.[x.returns.length - 1]
      attempts.push({ key: x.id, attempt: attempts.length + 1, date: r?.at ?? x.createdAt, kind: "returned", outcome: "Returned for correction", who: name(r?.byId ?? x.assignedToId), setting: "Clinical", evaluation: null, counted: "Does not count. Your reviewer returned it. Correct it and send it again.", failedRule: null, returnReason: r?.reason ?? null })
      summary.returned++
    }
    out.push({ skill, attempts, progress })
  }
  out.sort((a, b) => a.skill.name.localeCompare(b.skill.name))
  return { skills: out, summary }
}
