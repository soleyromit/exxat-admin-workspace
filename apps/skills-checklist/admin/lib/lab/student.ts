import { DEMO_TODAY } from "@/lib/v2/seed-core"
import { heldState } from "@/lib/v2/approvals"
import { shortDate as formatShortDate } from "@/lib/v2/format"
import { OUTCOME_LABEL, SENT_FOR_NEW_EVALUATION_WORD, STUDENT_NOT_COUNTED, sentForNewEvaluationLabel } from "@/lib/v2/labels"
import { PLACEMENT_ENDING_DAYS, daysLeftIn, placementStatus, placementsOf, type PlacementStatus } from "@/lib/v2/placements"
import { SMALL_NUMBERS } from "@/lib/v2/reports"
import { evalsOfStudent, evalsOfStudentSkill, personById, skillById, submissionsOfStudent } from "@/lib/v2/evidence-index"
import { ruleSentence, sentElsewhereTo, sentForNewEvaluationTo, skillProgress, type SkillProgress } from "@/lib/v2/student"
import type { Evaluation, Outcome, Person, Skill, Submission, V2State } from "@/lib/v2/types"
import { populationRows, resolveTerm, type StudentRow, type TermInfo } from "./dashboard"
import { EMPTY_SCOPE } from "./scope"
import { countSkills, skillNoun, skillNounPlural } from "./terms"

/**
 * Student lab model (My progress, Skill detail, My requests, Fix a submission). A pure function of the v2 state, read only.
 *
 * Consistency invariant [BUILD-PROMPT 8.9]: the required set, achieved count and pace come from the same `populationRows` the staff
 * dashboard uses (cohort offerings in the current term, mandatory, configured, published), so a student sees the counts staff see.
 * Pending never counts: progress reads `skillProgress`, which uses counted evaluations only [REQ AE-01].
 *
 * Skill record states follow REQ AE-04 with Romit's label for the third (ledger D-L1): No evidence yet, Evidence does not qualify,
 * In progress (n of m), Achieved. Waiting and returned are overlays, never states.
 *
 * Placements carry real start and end dates (lib/v2/placements.ts). N-03 fires when a current placement ends within
 * PLACEMENT_ENDING_DAYS of today and has likely skills not started; likely skills derive from the placement's own course.
 */

export const DEFAULT_STUDENT = "stu-maya"
export const STUDENT_BASE = "/lab/student"
/** N-04: a request waiting this many days or more is surfaced [BUILD-PROMPT 10]. */
export const WAIT_DAYS = 3
/** N-03: days before the placement ends when likely skills not started are surfaced [INFER, BUILD-PROMPT 10 names no number]. */
export const PLACEMENT_SOON = PLACEMENT_ENDING_DAYS
export { PLACEMENT_ENDING_DAYS }
/** Next actions shown before "All n" (strategy/07: 5 per group). */
export const NEXT_LIMIT = 5

const DAY = 86_400_000
const fmt = (n: number) => n.toLocaleString("en-US")
const plural = (n: number, one: string, many: string) => `${fmt(n)} ${n === 1 ? one : many}`
const daysBetween = (from: string, to: string) => Math.max(0, Math.round((Date.parse(`${to.slice(0, 10)}T00:00:00Z`) - Date.parse(`${from.slice(0, 10)}T00:00:00Z`)) / DAY))
/** One date format for every screen (lib/v2/format.ts): "Oct 26", with the year when it is not the demo year. */
export const shortDate = (iso: string): string => formatShortDate(iso)
export const ageLabel = (days: number) => (days === 0 ? "today" : days === 1 ? "1 day" : `${fmt(days)} days`)

// ---------------------------------------------------------------------------------------------------------------------
// Links (one helper, never hand-built hrefs in screens)

export type StudentScreen = "home" | "skill-detail" | "my-requests" | "fix-returned" | "request-signoff" | "offline-sync" | "record"

export function studentHref(screen: StudentScreen, params: Record<string, string | undefined> = {}, studentId: string = DEFAULT_STUDENT): string {
  const q = new URLSearchParams()
  if (studentId !== DEFAULT_STUDENT) q.set("student", studentId)
  for (const [k, v] of Object.entries(params)) if (v) q.set(k, v)
  const s = q.toString()
  return `${STUDENT_BASE}/${screen}${s ? `?${s}` : ""}`
}

// ---------------------------------------------------------------------------------------------------------------------
// Words

export type SkillState = "none" | "dnq" | "progress" | "achieved"
export const OUTCOME_WORD: Record<Outcome, string> = OUTCOME_LABEL

export function stateLabel(state: SkillState, counted: number, need: number): string {
  if (state === "achieved") return "Achieved"
  if (state === "progress") return `In progress (${fmt(counted)} of ${fmt(need)})`
  if (state === "dnq") return STUDENT_NOT_COUNTED
  return "No evidence yet"
}

// ---------------------------------------------------------------------------------------------------------------------
// Skill records

export interface Part {
  label: string
  have: number
  need: number
  met: boolean
}

export interface WaitInfo {
  submissionId: string | null
  evaluatorId: string
  evaluatorName: string
  days: number
  /** with the evaluator, or completed and held for approval [REQ SC-15]. */
  kind: "evaluator" | "approval" | "device"
}

export interface ReturnInfo {
  submissionId: string
  byName: string
  reason: string
  at: string
  revision: number
}

/** Why the latest attempt did not count, as the failed rule in numbers plus the next step [REQ SH-03]. */
export interface FailInfo {
  evaluationId: string
  date: string
  evaluatorName: string
  answer: string
  rule: string
  next: string
}

export interface SkillRecord {
  id: string
  name: string
  section: string
  /** Mandatory this term, recommended (likely here), optional (submittable, never required), or evidence only (not mapped). */
  level: "mandatory" | "recommended" | "optional" | "evidence"
  required: boolean
  state: SkillState
  label: string
  counted: number
  need: number
  parts: Part[]
  rule: string
  waiting: WaitInfo | null
  returned: ReturnInfo | null
  failed: FailInfo | null
  likely: boolean
  progress: SkillProgress
}

function stateOf(p: SkillProgress, evals: readonly Evaluation[]): SkillState {
  if (p.achieved) return "achieved"
  if (p.counted > 0) return "progress"
  return evals.some((e) => e.status === "counted") ? "dnq" : "none"
}

/** Rule parts as fractions: evaluations, different evaluators (only when the rule asks for more than one), each named setting. */
export function partsOf(p: SkillProgress): Part[] {
  const out: Part[] = [{ label: "Evaluations", have: Math.min(p.counted, p.need), need: p.need, met: p.counted >= p.need }]
  if (p.distinct.need > 1) out.push({ label: "Different evaluators", have: Math.min(p.distinct.have, p.distinct.need), need: p.distinct.need, met: p.distinct.have >= p.distinct.need })
  for (const x of p.settings) out.push({ label: x.setting, have: Math.min(x.have, x.min), need: x.min, met: x.have >= x.min })
  return out
}

/** The shortest unmet part as one sentence, for example "Needs 3 Met evaluations; you have 0." */
export function shortfallSentence(p: SkillProgress): string {
  const parts = partsOf(p).filter((x) => !x.met)
  if (parts.length === 0) return "Every part of the rule is met."
  return parts
    .map((x) => (x.label === "Evaluations" ? `Needs ${plural(x.need, "Met evaluation", "Met evaluations")}; you have ${fmt(x.have)}` : x.label === "Different evaluators" ? `Needs ${fmt(x.need)} different evaluators; you have ${fmt(x.have)}` : `Needs ${fmt(x.need)} in ${x.label}; you have ${fmt(x.have)}`))
    .join(". ")
    .concat(".")
}

const OPEN: Submission["status"][] = ["on-device", "with-evaluator", "awaiting-review", "stalled"]

function nameOf(s: V2State, id: string): string {
  return personById(s, id)?.name ?? "an evaluator"
}

function waitingFor(s: V2State, studentId: string, skillId: string, evals: readonly Evaluation[], today: string): WaitInfo | null {
  const sub = submissionsOfStudent(s, studentId).find((x) => OPEN.includes(x.status) && x.skillIds.includes(skillId))
  if (sub) {
    return {
      submissionId: sub.id,
      evaluatorId: sub.assignedToId,
      evaluatorName: nameOf(s, sub.assignedToId),
      days: Math.max(sub.daysWaiting, daysBetween(sub.createdAt, today)),
      kind: sub.status === "on-device" ? "device" : sub.status === "awaiting-review" ? "approval" : "evaluator",
    }
  }
  const held = evals.find((e) => e.status === "awaiting-approval")
  if (held) return { submissionId: held.submissionId ?? null, evaluatorId: held.evaluatorId, evaluatorName: nameOf(s, held.evaluatorId), days: daysBetween(held.date, today), kind: "approval" }
  return null
}

function returnedFor(s: V2State, studentId: string, skillId: string): ReturnInfo | null {
  const sub = submissionsOfStudent(s, studentId).find((x) => x.status === "returned" && x.skillIds.includes(skillId))
  if (!sub) return null
  const r = sub.returns?.[sub.returns.length - 1]
  return { submissionId: sub.id, byName: nameOf(s, r?.byId ?? sub.assignedToId), reason: r?.reason ?? "Returned for correction.", at: r?.at ?? sub.createdAt, revision: sub.revisions ?? r?.revision ?? 0 }
}

function failedFor(s: V2State, skill: Skill, p: SkillProgress, evals: readonly Evaluation[]): FailInfo | null {
  if (p.achieved) return null
  const latest = [...evals].filter((e) => e.status === "counted").sort((a, b) => (a.date < b.date ? 1 : -1))[0]
  if (!latest) return null
  const leftOut = p.leftOut[latest.id]
  if (latest.outcome === "met" && !leftOut) return null
  const answer = OUTCOME_WORD[latest.outcome]
  const why = leftOut ? leftOut.replace(/\.$/, "") : `The evaluator answered ${answer}`
  return {
    evaluationId: latest.id,
    date: latest.date,
    evaluatorName: nameOf(s, latest.evaluatorId),
    answer,
    rule: `${why}. ${shortfallSentence(p)}`,
    next: `Make a further attempt and send it for evaluation. The earlier attempt stays as it is.`,
  }
}

export function skillRecord(input: V2State, studentId: string, skillId: string, level: SkillRecord["level"], likely: boolean, today: string = DEMO_TODAY): SkillRecord | null {
  const s = heldState(input)
  const skill = skillById(s, skillId)
  const p = skill ? skillProgress(s, studentId, skillId) : null
  if (!skill || !p) return null
  const evals = evalsOfStudentSkill(s, studentId, skillId)
  const state = stateOf(p, evals)
  return {
    id: skill.id,
    name: skill.name,
    section: skill.category,
    level,
    required: level === "mandatory",
    state,
    label: stateLabel(state, p.counted, p.need),
    counted: p.counted,
    need: p.need,
    parts: partsOf(p),
    rule: ruleSentence(skill),
    waiting: p.achieved ? null : waitingFor(s, studentId, skillId, evals, today),
    returned: returnedFor(s, studentId, skillId),
    failed: failedFor(s, skill, p, evals),
    likely,
    progress: p,
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// Placement and courses

export interface PlacementInfo {
  id: string
  location: string
  setting: string
  courseId: string
  courseCode: string
  /** The rotation's own dates (ISO). */
  starts: string
  ends: string
  status: PlacementStatus
  /** Days to the last day of the rotation (0 on the last day). */
  daysLeft: number
  /** Skills mapped to the placement's course, not achieved, that this setting can satisfy. */
  likelyIds: string[]
  notStartedIds: string[]
  soon: boolean
}

export interface CourseExpectation {
  id: string
  code: string
  name: string
  mandatory: number
  mandatoryAchieved: number
  optional: number
  optionalAchieved: number
  /** Evaluations the term clock expects by now on this course's mandatory skills, and those counted. */
  expected: number
  collected: number
  needed: number
  behind: boolean
}

const courseList = (s: V2State) => s.courses ?? [s.course, ...(s.otherCourses ?? [])]

// ---------------------------------------------------------------------------------------------------------------------
// Next actions (N-05 returned, did not count, N-01 one away, N-03 placement ending, N-04 waiting 3+ days)

export type NextKind = "returned" | "dnq" | "one-away" | "placement" | "waiting" | "conflict"

export interface NextAction {
  id: string
  kind: NextKind
  skillId: string | null
  title: string
  detail: string
  /** Returned only: who returned it (the detail is "{who}: {reason}"); a phone shows the reason alone. */
  who?: string
  /** Did not count only: the failed answer and date ("Unmet, Oct 23. "), the start of the detail; a phone shows the rule alone. */
  lead?: string
  href: string
  action: string
  amber: boolean
}

// ---------------------------------------------------------------------------------------------------------------------
// Requests (grouped by evaluator: waiting, returned, done)

export type RequestStatus = "waiting" | "returned" | "done"

export interface RequestRow {
  id: string
  status: RequestStatus
  skillIds: string[]
  skillNames: string[]
  /** "Waiting 4 days", "Returned Oct 20", "Met, Oct 14". */
  statusLabel: string
  days: number
  date: string
  /** Per-request link state [LEDGER D-L2: one link per request]. */
  link: string
  href: string
  action: string
  revision: number
  reason: string | null
  overdue: boolean
}

export interface EvaluatorGroup {
  id: string
  name: string
  role: string
  verified: boolean
  waiting: RequestRow[]
  returned: RequestRow[]
  done: RequestRow[]
  oldest: number
}

const linkState = (x: Submission): string => {
  if (x.status === "on-device") return "Not sent yet, kept on this device"
  if (x.method === "photo") return "Paper form, no link"
  if (x.method === "handover") return "Signed on your device, no link"
  if (x.status === "with-evaluator" || x.status === "stalled") return `Link open since ${shortDate(x.createdAt)}`
  return "Link closed"
}

export function requestGroups(state: V2State, studentId: string, today: string = DEMO_TODAY): EvaluatorGroup[] {
  const s = heldState(state)
  const groups = new Map<string, EvaluatorGroup>()
  const group = (id: string): EvaluatorGroup => {
    let g = groups.get(id)
    if (!g) {
      const p = personById(s, id)
      g = { id, name: p?.name ?? "An evaluator", role: p?.title ?? "Evaluator", verified: p?.verified !== false, waiting: [], returned: [], done: [], oldest: 0 }
      groups.set(id, g)
    }
    return g
  }
  const names = (ids: string[]) => ids.map((id) => skillById(s, id)?.name ?? `A removed ${skillNoun()}`)
  for (const x of submissionsOfStudent(s, studentId)) {
    if (x.status === "done") continue
    const g = group(x.assignedToId)
    const days = Math.max(x.daysWaiting, daysBetween(x.createdAt, today))
    if (x.status === "returned") {
      const r = x.returns?.[x.returns.length - 1]
      g.returned.push({ id: x.id, status: "returned", skillIds: x.skillIds, skillNames: names(x.skillIds), statusLabel: `Returned ${shortDate(r?.at ?? x.createdAt)}`, days: daysBetween(r?.at ?? x.createdAt, today), date: r?.at ?? x.createdAt, link: "", href: studentHref("fix-returned", { submission: x.id }, studentId), action: "Fix and send", revision: x.revisions ?? 0, reason: r?.reason ?? null, overdue: false })
    } else {
      const held = x.status === "awaiting-review"
      // A reviewer's "Assign to someone else": the same words as the held attempt on Skill detail and Record (lib/v2/labels.ts).
      const sentTo = sentForNewEvaluationTo(s, x)
      g.waiting.push({ id: x.id, status: "waiting", skillIds: x.skillIds, skillNames: names(x.skillIds), statusLabel: held ? `Awaiting approval, ${ageLabel(days)}` : x.status === "on-device" ? "Not sent yet" : sentTo ? sentForNewEvaluationLabel(sentTo.name) : `Waiting ${ageLabel(days)}`, days, date: x.createdAt, link: linkState(x), href: studentHref("skill-detail", { skill: x.skillIds[0] }, studentId), action: "View", revision: x.revisions ?? 0, reason: null, overdue: !held && days >= WAIT_DAYS })
    }
  }
  for (const e of evalsOfStudent(s, studentId)) {
    const g = group(e.evaluatorId)
    if (e.status === "awaiting-approval") {
      if (e.submissionId && submissionsOfStudent(s, studentId).some((x) => x.id === e.submissionId && OPEN.includes(x.status))) continue
      const days = daysBetween(e.date, today)
      g.waiting.push({ id: e.id, status: "waiting", skillIds: [e.skillId], skillNames: names([e.skillId]), statusLabel: `Awaiting approval, ${ageLabel(days)}`, days, date: e.date, link: "Link closed, evaluation complete", href: studentHref("skill-detail", { skill: e.skillId }, studentId), action: "View", revision: 0, reason: null, overdue: false })
    } else if (e.status === "counted") {
      g.done.push({ id: e.id, status: "done", skillIds: [e.skillId], skillNames: names([e.skillId]), statusLabel: `${OUTCOME_WORD[e.outcome]}, ${shortDate(e.date)}`, days: daysBetween(e.date, today), date: e.date, link: "Link closed", href: studentHref("skill-detail", { skill: e.skillId }, studentId), action: "View", revision: 0, reason: null, overdue: false })
    }
  }
  const byDate = (a: RequestRow, b: RequestRow) => (a.date < b.date ? 1 : -1)
  const out = [...groups.values()]
  for (const g of out) {
    g.waiting.sort((a, b) => b.days - a.days)
    g.returned.sort(byDate)
    g.done.sort(byDate)
    g.oldest = Math.max(0, ...g.waiting.map((r) => r.days))
  }
  // Open work first (returned, then oldest waiting), then the rest by most recent done.
  const lastDone = (g: EvaluatorGroup) => g.done[0]?.date ?? ""
  return out.sort((a, b) => b.returned.length - a.returned.length || Number(b.waiting.length > 0) - Number(a.waiting.length > 0) || b.oldest - a.oldest || lastDone(b).localeCompare(lastDone(a)))
}

// ---------------------------------------------------------------------------------------------------------------------
// The whole model

export interface SyncSummary {
  queued: number
  synced: number
  conflict: number
  failed: number
}

export interface PacePoint {
  date: string
  label: string
  counted: number
  expected: number
}

export interface SectionShare {
  section: string
  mine: number
  median: number
}

export interface StudentModel {
  student: Person
  cohort: string
  term: TermInfo
  row: StudentRow | null
  required: SkillRecord[]
  /** Every skill on the student's list: required, optional on a current course, or with evidence. */
  all: SkillRecord[]
  counts: { required: number; achieved: number; waiting: number; returned: number; doesNotQualify: number; oneAway: number }
  next: NextAction[]
  placements: PlacementInfo[]
  courses: CourseExpectation[]
  pace: PacePoint[]
  sections: SectionShare[]
  cohortSize: number
  /** Peer comparison hidden below SMALL_NUMBERS [brief section 8]. */
  radarSuppressed: boolean
  sync: SyncSummary
  /** Pace verdict in one line: "On pace for week 9 of 16" or "3 evaluations behind the term clock". */
  verdict: string
  behind: boolean
}

function paceSeries(s: V2State, studentId: string, requiredIds: string[], term: TermInfo, today: string): PacePoint[] {
  const start = Date.parse(`${term.start}T00:00:00Z`)
  const end = Date.parse(`${term.end}T00:00:00Z`)
  const now = Date.parse(`${today}T00:00:00Z`)
  const mine = evalsOfStudent(s, studentId)
  const needed = requiredIds.reduce((n, id) => n + (skillProgress(s, studentId, id)?.need ?? 0), 0)
  const out: PacePoint[] = []
  for (let t = start; t <= end + DAY; t += 7 * DAY) {
    const at = Math.min(t, end)
    const date = new Date(at).toISOString().slice(0, 10)
    const share = (at - start) / Math.max(1, end - start)
    let counted = -1
    if (at <= now) {
      const sub = { ...s, evaluations: mine.filter((e) => e.date.slice(0, 10) <= date) }
      counted = requiredIds.reduce((n, id) => {
        const p = skillProgress(sub, studentId, id)
        return n + Math.min(p?.counted ?? 0, p?.need ?? 0)
      }, 0)
    }
    out.push({ date, label: shortDate(date), counted, expected: Math.floor(needed * share) })
    if (at === end) break
  }
  return out
}

export function buildStudent(state: V2State, studentId: string = DEFAULT_STUDENT, today: string = DEMO_TODAY): StudentModel | null {
  const s = heldState(state)
  const student = personById(s, studentId)
  if (!student || student.kind !== "student") return null
  const term = resolveTerm(s, EMPTY_SCOPE, today)
  const cohortName = student.cohort ?? ""
  const pop = populationRows(s, { ...EMPTY_SCOPE, cohort: cohortName }, today)
  const row = pop.rows.find((r) => r.id === studentId) ?? null

  // Courses of the student's cohort in the current term.
  const offered = new Set((s.offerings ?? []).filter((o) => o.termId === term.id && o.cohortId === student.cohortId).map((o) => o.courseId))
  const levelOf = new Map<string, "mandatory" | "recommended" | "optional">()
  const coursesOf = new Map<string, string[]>()
  // "Likely here" reads mandatory and recommended mappings only (CALL 10-26); optional stays submittable but is never suggested.
  const likelyCoursesOf = new Map<string, string[]>()
  const rank = { mandatory: 0, recommended: 1, optional: 2 } as const
  for (const m of s.mappings) {
    if (!offered.has(m.courseId) || m.level === "not-expected") continue
    const k = skillById(s, m.skillId)
    if (!k?.configured || !k.published) continue
    const prev = levelOf.get(m.skillId)
    if (!prev || rank[m.level] < rank[prev]) levelOf.set(m.skillId, m.level)
    coursesOf.set(m.skillId, [...(coursesOf.get(m.skillId) ?? []), m.courseId])
    if (m.level !== "optional") likelyCoursesOf.set(m.skillId, [...(likelyCoursesOf.get(m.skillId) ?? []), m.courseId])
  }
  const requiredIds = new Set(row?.requiredIds ?? [])

  // Current and upcoming rotations this term; a finished rotation no longer makes a skill "likely here".
  const placementsRaw = placementsOf(s, studentId, term.id).filter((p) => offered.has(p.courseId) && placementStatus(p, today) !== "finished")
  const likely = new Set<string>()
  const placements: PlacementInfo[] = []
  for (const p of placementsRaw) {
    const ids = [...likelyCoursesOf.entries()].filter(([, cs]) => cs.includes(p.courseId)).map(([id]) => id)
    const fit = ids.filter((id) => {
      const mins = skillById(s, id)?.config?.achievement.settingMinimums ?? []
      return mins.length === 0 || mins.some((x) => x.setting === p.setting)
    })
    const notAchieved = fit.filter((id) => !skillProgress(s, studentId, id)?.achieved)
    for (const id of notAchieved) likely.add(id)
    const notStarted = notAchieved.filter((id) => evalsOfStudentSkill(s, studentId, id).length === 0)
    const status = placementStatus(p, today)
    const daysLeft = daysLeftIn(p, today)
    const course = courseList(s).find((c) => c.id === p.courseId)
    placements.push({ id: p.id, location: p.location, setting: p.setting, courseId: p.courseId, courseCode: course?.code ?? "", starts: p.startDate, ends: p.endDate, status, daysLeft, likelyIds: notAchieved, notStartedIds: notStarted, soon: status === "current" && daysLeft <= PLACEMENT_ENDING_DAYS && notStarted.length > 0 })
  }

  const ids = new Set<string>([...levelOf.keys(), ...requiredIds, ...evalsOfStudent(s, studentId).map((e) => e.skillId)])
  const all: SkillRecord[] = []
  for (const id of ids) {
    const level: SkillRecord["level"] = requiredIds.has(id) ? "mandatory" : levelOf.get(id) === "recommended" ? "recommended" : levelOf.has(id) ? "optional" : "evidence"
    const r = skillRecord(s, studentId, id, level, likely.has(id), today)
    if (r) all.push(r)
  }
  all.sort((a, b) => a.section.localeCompare(b.section) || a.name.localeCompare(b.name))
  const required = all.filter((r) => r.required).sort((a, b) => order(a) - order(b) || a.name.localeCompare(b.name))

  // Figures (SH-04): submissions waiting and returned; required skills achieved.
  const subs = submissionsOfStudent(s, studentId)
  const heldOutside = evalsOfStudent(s, studentId).filter((e) => e.status === "awaiting-approval" && !(e.submissionId && subs.some((x) => x.id === e.submissionId && OPEN.includes(x.status)))).length
  const waiting = subs.filter((x) => OPEN.includes(x.status)).length + heldOutside
  const returned = subs.filter((x) => x.status === "returned").length

  // Sections for the radar: share of required evaluations counted, mine vs the cohort median.
  const sections: SectionShare[] = []
  for (const [section, t] of Object.entries(row?.bySection ?? {})) {
    const peers = pop.rows.map((r) => r.bySection[section]).filter(Boolean).map((x) => (x.needed ? Math.round((x.collected / x.needed) * 100) : 0)).sort((a, b) => a - b)
    const med = peers.length ? (peers.length % 2 ? peers[(peers.length - 1) / 2] : Math.round((peers[peers.length / 2 - 1] + peers[peers.length / 2]) / 2)) : 0
    sections.push({ section, mine: t.needed ? Math.round((t.collected / t.needed) * 100) : 0, median: med })
  }
  sections.sort((a, b) => a.section.localeCompare(b.section))

  const courses: CourseExpectation[] = []
  for (const cid of offered) {
    const c = courseList(s).find((x) => x.id === cid)
    if (!c) continue
    const rows = s.mappings.filter((m) => m.courseId === cid && m.level !== "not-expected" && coursesOf.has(m.skillId))
    if (rows.length === 0) continue
    const mand = [...new Set(rows.filter((m) => m.level === "mandatory").map((m) => m.skillId))]
    // Non-mandatory on this course (recommended or optional): the "optional" figure keeps its meaning, never required.
    const opt = [...new Set(rows.filter((m) => m.level !== "mandatory").map((m) => m.skillId))].filter((id) => !mand.includes(id))
    const rec = (id: string) => all.find((r) => r.id === id)
    const needed = mand.reduce((n, id) => n + (rec(id)?.need ?? 0), 0)
    const collected = mand.reduce((n, id) => n + Math.min(rec(id)?.counted ?? 0, rec(id)?.need ?? 0), 0)
    const expected = Math.floor(needed * term.share)
    courses.push({ id: cid, code: c.code, name: c.name, mandatory: mand.length, mandatoryAchieved: mand.filter((id) => rec(id)?.state === "achieved").length, optional: opt.length, optionalAchieved: opt.filter((id) => rec(id)?.state === "achieved").length, expected, collected, needed, behind: expected - collected > 1 })
  }
  courses.sort((a, b) => b.mandatory - a.mandatory || a.code.localeCompare(b.code))

  const syncItems = s.syncQueue.filter((i) => i.studentId === studentId)
  const sync: SyncSummary = { queued: syncItems.filter((i) => i.state === "queued").length, synced: syncItems.filter((i) => i.state === "synced").length, conflict: syncItems.filter((i) => i.state === "conflict").length, failed: syncItems.filter((i) => i.state === "failed").length }

  const behind = (row?.behindBy ?? 0) > 0
  const verdict = !row ? "" : behind ? `${plural(row.behindBy, "evaluation", "evaluations")} behind the term clock` : `On pace for week ${term.week} of ${term.weeks}`

  const model: StudentModel = {
    student,
    cohort: cohortName,
    term,
    row,
    required,
    all,
    counts: {
      required: required.length,
      achieved: required.filter((r) => r.state === "achieved").length,
      waiting,
      returned,
      doesNotQualify: required.filter((r) => r.state === "dnq").length,
      oneAway: required.filter((r) => r.state !== "achieved" && r.need - r.counted === 1).length,
    },
    next: [],
    placements,
    courses,
    pace: row ? paceSeries(s, studentId, row.requiredIds, term, today) : [],
    sections,
    cohortSize: pop.rows.length,
    radarSuppressed: pop.rows.length < SMALL_NUMBERS,
    sync,
    verdict,
    behind,
  }
  model.next = nextActions(s, model, studentId)
  return model
}

const order = (r: SkillRecord) => (r.returned ? 0 : r.state === "dnq" ? 1 : r.state === "progress" ? 2 : r.state === "none" ? 3 : 4)

function nextActions(s: V2State, m: StudentModel, studentId: string): NextAction[] {
  const out: NextAction[] = []
  const subs = submissionsOfStudent(s, studentId)
  for (const x of subs.filter((y) => y.status === "returned")) {
    const r = x.returns?.[x.returns.length - 1]
    const names = x.skillIds.map((id) => skillById(s, id)?.name ?? skillNoun())
    out.push({ id: `ret-${x.id}`, kind: "returned", skillId: x.skillIds[0] ?? null, title: names.length > 1 ? `${names[0]} and ${plural(names.length - 1, "other", "others")} returned` : `${names[0]} returned`, who: nameOf(s, r?.byId ?? x.assignedToId), detail: `${nameOf(s, r?.byId ?? x.assignedToId)}: ${r?.reason ?? "returned for correction"}`, href: studentHref("fix-returned", { submission: x.id }, studentId), action: "Fix and send", amber: true })
  }
  for (const r of m.all.filter((y) => y.state === "dnq" && !y.waiting && !y.returned && (y.required || y.likely))) {
    out.push({ id: `dnq-${r.id}`, kind: "dnq", skillId: r.id, title: `${r.name} did not count`, lead: r.failed ? `${r.failed.answer}, ${shortDate(r.failed.date)}. ` : undefined, detail: r.failed ? `${r.failed.answer}, ${shortDate(r.failed.date)}. ${shortfallSentence(r.progress)}` : shortfallSentence(r.progress), href: studentHref("fix-returned", { skill: r.id }, studentId), action: "Make a further attempt", amber: true })
  }
  if (m.sync.conflict > 0) out.push({ id: "conflict", kind: "conflict", skillId: null, title: `${plural(m.sync.conflict, "entry has", "entries have")} two versions`, detail: "Pick one to send it.", href: studentHref("offline-sync", {}, studentId), action: "Choose", amber: true })
  for (const r of m.required.filter((y) => y.state === "progress" && y.need - y.counted === 1)) {
    out.push({ id: `one-${r.id}`, kind: "one-away", skillId: r.id, title: `${r.name} is one away`, detail: r.waiting ? `${fmt(r.counted)} of ${fmt(r.need)}. Waiting ${ageLabel(r.waiting.days)} with ${r.waiting.evaluatorName}.` : `${fmt(r.counted)} of ${fmt(r.need)}. One more Met evaluation achieves it.`, href: r.waiting ? studentHref("my-requests", {}, studentId) : studentHref("request-signoff", { skill: r.id }, studentId), action: r.waiting ? "View request" : "Send for evaluation", amber: false })
  }
  for (const p of m.placements.filter((x) => x.soon)) {
    out.push({ id: `pl-${p.id}`, kind: "placement", skillId: p.notStartedIds[0] ?? null, title: `${p.location} ends in ${ageLabel(p.daysLeft)}`, detail: `${countSkills(p.notStartedIds.length)} likely here ${p.notStartedIds.length === 1 ? "is" : "are"} not started.`, href: studentHref("request-signoff", { skill: p.notStartedIds[0] }, studentId), action: "Send for evaluation", amber: false })
  }
  const late = requestGroups(s, studentId).flatMap((g) => g.waiting.filter((w) => w.overdue).map((w) => ({ g, w })))
  for (const { g, w } of late) out.push({ id: `wait-${w.id}`, kind: "waiting", skillId: w.skillIds[0] ?? null, title: `Waiting ${ageLabel(w.days)} with ${g.name}`, detail: `${w.skillNames.join(", ")}. Remind them, or send to someone else.`, href: studentHref("my-requests", {}, studentId), action: "View request", amber: false })
  return out
}

/** Demo state "all done": every required skill achieved, nothing waiting or returned. Labelled as a demo in the UI. */
export function withAllDone(m: StudentModel): StudentModel {
  const done = (r: SkillRecord): SkillRecord => ({ ...r, state: "achieved", label: "Achieved", counted: r.need, waiting: null, returned: null, failed: null, parts: r.parts.map((p) => ({ ...p, have: p.need, met: true })) })
  const required = m.required.map(done)
  return { ...m, required, all: m.all.map((r) => (r.required ? done(r) : r)), counts: { ...m.counts, achieved: required.length, waiting: 0, returned: 0, doesNotQualify: 0, oneAway: 0 }, next: [], verdict: `Every required ${skillNoun()} achieved`, behind: false }
}

// ---------------------------------------------------------------------------------------------------------------------
// Skill detail: attempts

export type AttemptKind = "counted" | "not-counted" | "waiting" | "returned" | "sent"

export interface AttemptRow {
  key: string
  n: number
  date: string
  kind: AttemptKind
  answer: string
  evaluatorName: string
  setting: string
  /** Why it counted or did not, in numbers where it did not [REQ SH-03]. */
  why: string
  revision: number
  /** The status in words when it names a person: "Sent to Dana Ruiz for a new evaluation" (kind "sent"). */
  status?: string
}

/** Short status word per attempt kind ("sent": held evidence a reviewer assigned to another evaluator; not a return). */
export const ATTEMPT_WORD: Record<AttemptKind, string> = { counted: "Counted", "not-counted": "Did not count", waiting: "Waiting", returned: "Returned", sent: SENT_FOR_NEW_EVALUATION_WORD }

const settingText = (e: Evaluation) => (e.setting === "clinical" ? `Clinical, ${e.clinicalSetting ?? "setting not recorded"}` : e.setting === "lab" ? "Lab" : "Simulation")

export function attempts(state: V2State, studentId: string, skillId: string, today: string = DEMO_TODAY): AttemptRow[] {
  const s = heldState(state)
  const p = skillProgress(s, studentId, skillId)
  if (!p) return []
  const used = new Set(p.used)
  const out: AttemptRow[] = []
  const evals = [...evalsOfStudentSkill(s, studentId, skillId)].sort((a, b) => (a.date < b.date ? -1 : 1))
  for (const e of evals) {
    const base = { key: e.id, n: out.length + 1, date: e.date, answer: OUTCOME_WORD[e.outcome], evaluatorName: nameOf(s, e.evaluatorId), setting: settingText(e), revision: 0 }
    const sentTo = sentElsewhereTo(s, e)
    if (e.status === "awaiting-approval") out.push({ ...base, kind: "waiting", why: `Completed and awaiting approval for ${ageLabel(daysBetween(e.date, today))}. It counts once approved.` })
    else if (sentTo) out.push({ ...base, kind: "sent", status: sentForNewEvaluationLabel(sentTo.name), why: `It counts after ${sentTo.name} answers Met.` })
    else if (e.status === "returned" || e.status === "reopened") out.push({ ...base, kind: "returned", why: e.review?.note ? `Returned: ${e.review.note}` : "Returned for correction. It does not count until corrected." })
    else if (used.has(e.id)) out.push({ ...base, kind: "counted", why: e.setting === "clinical" && e.clinicalSetting && p.settings.some((x) => x.setting === e.clinicalSetting) ? `Counts toward the rule and toward ${e.clinicalSetting}.` : "Counts toward the rule." })
    else out.push({ ...base, kind: "not-counted", why: p.leftOut[e.id] ?? "" })
  }  for (const x of submissionsOfStudent(s, studentId).filter((y) => y.skillIds.includes(skillId) && (OPEN.includes(y.status) || y.status === "returned"))) {
    const days = Math.max(x.daysWaiting, daysBetween(x.createdAt, today))
    const r = x.returns?.[x.returns.length - 1]
    out.push({ key: x.id, n: out.length + 1, date: x.createdAt, kind: x.status === "returned" ? "returned" : "waiting", answer: x.status === "returned" ? "Returned" : "Not answered yet", evaluatorName: nameOf(s, x.assignedToId), setting: "Clinical", why: x.status === "returned" ? `Returned: ${r?.reason ?? "correction needed"}` : `Sent ${shortDate(x.createdAt)}, waiting ${ageLabel(days)}. It counts after the evaluator answers Met.`, revision: x.revisions ?? 0 })
  }
  return out
}

/**
 * How attempts are counted, in one plain line next to the progress [CALL 10-26 B.4]: "5 attempts, 3 count". Only completed
 * evaluations are attempts; waiting and returned ones are not yet. Empty when there is no completed attempt.
 */
export function attemptCountLine(rows: readonly Pick<AttemptRow, "kind">[]): string {
  const total = rows.filter((r) => r.kind === "counted" || r.kind === "not-counted").length
  if (total === 0) return ""
  const count = rows.filter((r) => r.kind === "counted").length
  return `${total} ${total === 1 ? "attempt" : "attempts"}, ${count} ${count === 1 ? "counts" : "count"}`
}

// ---------------------------------------------------------------------------------------------------------------------
// Fix a returned or did-not-qualify submission

export type FixCase = "correction" | "attempt"

export interface FixModel {
  case: FixCase
  skillIds: string[]
  skillNames: string[]
  /** The evaluator the original went to; a correction defaults to them [REQ RV-02], either path may change [REQ RV-04]. */
  evaluatorId: string
  evaluatorName: string
  /** Return reason (correction) or the failed rule in numbers (attempt). */
  reason: string
  reasonBy: string
  reasonAt: string
  /** What to change, as short checklist lines. */
  changes: string[]
  /** Revision count after sending (correction) or attempt number (attempt). */
  nextNumber: number
  submissionId: string | null
  /** Evaluators this student has worked with, for "send to someone else". */
  others: Array<{ id: string; name: string; role: string }>
  setting: string
  studentNote: string
}

export function fixModel(state: V2State, studentId: string, opts: { submissionId?: string | null; skillId?: string | null }, today: string = DEMO_TODAY): FixModel | null {
  const s = heldState(state)
  const subs = submissionsOfStudent(s, studentId)
  const worked = [...new Set(evalsOfStudent(s, studentId).map((e) => e.evaluatorId))]
    .map((id) => personById(s, id))
    .filter((p): p is Person => !!p && p.kind !== "lab-instructor")
    .map((p) => ({ id: p.id, name: p.name, role: p.title }))
    .sort((a, b) => a.name.localeCompare(b.name))
  const sub = opts.submissionId ? subs.find((x) => x.id === opts.submissionId) : !opts.skillId ? subs.find((x) => x.status === "returned") : undefined
  // A request a reviewer sent to someone else for a new evaluation is not the student's to fix: nothing to fix here.
  if (sub && sentForNewEvaluationTo(s, sub)) return null
  if (sub && sub.status === "returned") {
    const r = sub.returns?.[sub.returns.length - 1]
    return {
      case: "correction",
      skillIds: sub.skillIds,
      skillNames: sub.skillIds.map((id) => skillById(s, id)?.name ?? skillNoun()),
      evaluatorId: sub.assignedToId,
      evaluatorName: nameOf(s, sub.assignedToId),
      reason: r?.reason ?? "Returned for correction.",
      reasonBy: nameOf(s, r?.byId ?? sub.assignedToId),
      reasonAt: r?.at ?? sub.createdAt,
      changes: changesFor(r?.reason ?? ""),
      nextNumber: (sub.revisions ?? 0) + 1,
      submissionId: sub.id,
      others: worked.filter((w) => w.id !== sub.assignedToId),
      setting: "Clinical",
      studentNote: sub.studentNote ?? "",
    }
  }
  // Did not qualify: the named skill, else the first required skill whose evidence does not qualify.
  const m = buildStudent(s, studentId, today)
  const rec = opts.skillId ? m?.all.find((r) => r.id === opts.skillId) : m?.all.find((r) => r.state === "dnq" && r.required) ?? m?.all.find((r) => r.state === "dnq")
  if (!rec) return null
  const evals = evalsOfStudentSkill(s, studentId, rec.id)
  const last = [...evals].sort((a, b) => (a.date < b.date ? 1 : -1))[0]
  return {
    case: "attempt",
    skillIds: [rec.id],
    skillNames: [rec.name],
    evaluatorId: last?.evaluatorId ?? worked[0]?.id ?? "",
    evaluatorName: last ? nameOf(s, last.evaluatorId) : worked[0]?.name ?? "an evaluator",
    reason: rec.failed?.rule ?? shortfallSentence(rec.progress),
    reasonBy: rec.failed?.evaluatorName ?? "",
    reasonAt: rec.failed?.date ?? last?.date ?? today,
    changes: [`Read the feedback from ${rec.failed?.evaluatorName ?? "your evaluator"}`, "Perform the skill again in a clinical setting", rec.progress.distinct.need > 1 ? `Ask a different evaluator if you need ${fmt(rec.progress.distinct.need)} different evaluators` : "Send it to the evaluator who watched you"],
    nextNumber: evals.length + 1,
    submissionId: null,
    others: worked,
    setting: "Clinical",
    studentNote: "",
  }
}

function changesFor(reason: string): string[] {
  const r = reason.toLowerCase()
  const out: string[] = []
  if (/date|when/.test(r)) out.push("Correct the date")
  if (/setting|unit|location|site/.test(r)) out.push("Correct the setting or location")
  if (/evaluator|preceptor|signed|signature/.test(r)) out.push("Check who signed it")
  if (/note|detail|describe|missing/.test(r)) out.push("Add the missing detail to your note")
  if (out.length === 0) out.push("Change what the reason names", "Add a note that says what you changed")
  return out
}

/** A student with a returned submission, for the "returned" example when the hero student has none. */
export function studentWithReturned(s: V2State): string | null {
  return s.submissions.find((x) => x.status === "returned")?.studentId ?? null
}

export const pluralSkills = (n: number) => (n === 1 ? skillNoun() : skillNounPlural())
