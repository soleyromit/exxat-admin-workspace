/**
 * Group check-off (PROTO prism-skills-prototype_10282026.html `GS`, `lt`, `md`, `dd`, `qS`; CALL 2026-10-28, Sankalp and Romit,
 * relaying Vishakha's use case). Contract: docs/build/contracts/V2-05d-course-checkoff.md.
 *
 * Faculty (or a lab instructor) signed in to Prism opens a course offering's Skills section and ticks skills off for the group
 * that is registered to it, in one sitting. A check-off is the evaluator recording their own observation, so there is no student
 * submission and no self-evaluation. It writes an ordinary evaluation (source "checkoff"), counted by the same achievement rules.
 *
 * - Whether a skill can be checked off is the skill's own setting, "Group check-off" in Configure (`SkillConfig.checkOff`).
 *   Default by model: Met or Unmet on, levels on, questions off, scores off. An unconfigured skill never can.
 * - What a tick records: the qualifying outcome; a nominated level (default the highest); every question Yes; a nominated score
 *   on every item.
 * - The skill's roles still apply [REQ SC-16, EV-02]; simulation must be allowed for a simulation session.
 * - A cell whose student already qualifies shows the status only, "Already qualifies", with no checkbox (Romit 2026-10-30,
 *   "switch", D-L8d; reverses the prototype's "still tickable"). A cell waiting on an evaluation already sent stays tickable.
 * - Skills that cannot be checked off in the chosen setting are not grid columns; the skills picker lists them with the reason.
 * - A skill that requires approval holds the check-off for administrator review [REQ SC-15, EV-07, AR-06].
 * - Lab and simulation evidence carries no clinical setting, so it never satisfies a setting minimum [REQ SC-12].
 */
import type { CourseOffering, EvalModel, Evaluation, EvaluationDetail, Person, Skill, V2State } from "@/lib/v2/types"
import { ineligibleReason, openRequestFor, skillProgress } from "@/lib/v2/student"
import { EMPTY_MAPPING_OVERLAY, LEVEL_LABEL, offeringLevels, type MapLevel } from "@/lib/lab/mapping"
import { COURSE_FACULTY } from "./terms"
import { CHECKOFF_DEFAULT, checkOffAllowedFor, checkOffLevelIndex, checkOffOffReason, checkOffScore, tickRecordsLine } from "./checkoff-rules"

export type CheckoffSetting = "lab" | "simulation"
export const CHECKOFF_SETTINGS: Array<{ value: CheckoffSetting; label: string }> = [
  { value: "lab", label: "Skills lab" },
  { value: "simulation", label: "Simulation" },
]
export type RecorderRole = "faculty" | "lab-instructor"
export const RECORDER_ROLES: Array<{ value: RecorderRole; label: string }> = [
  { value: "faculty", label: COURSE_FACULTY },
  { value: "lab-instructor", label: "Lab instructor" },
]

export { CHECKOFF_DEFAULT, checkOffAllowedFor, checkOffLevelIndex, checkOffOffReason, checkOffScore, tickRecordsLine }

const configured = (k: Pick<Skill, "config" | "model" | "configured">): boolean => !!k.config && !!k.model && k.configured !== false

/** The skill allows a group check-off: its own setting, else the model's default. Never for an unconfigured skill. */
export function checkOffAllowed(k: Pick<Skill, "config" | "model" | "configured">): boolean {
  if (!configured(k)) return false
  return k.config?.checkOff?.enabled ?? CHECKOFF_DEFAULT[k.model as EvalModel] ?? false
}

export function tickRecords(k: Skill): string {
  const c = k.config
  if (!c) return ""
  return tickRecordsLine(k.model, {
    outcomeLabels: c.outcomeLabels,
    qualifyingLabel: c.qualifyingLabel,
    levels: c.levels,
    levelIndex: c.checkOff?.levelIndex,
    questions: c.questions,
    score: checkOffScore(c.scaleMax ?? 5, c.scoredRule, c.checkOff?.score, c.questions.length),
  })
}

/** Why this recorder cannot check this skill off in this session, or null when they can. First sentence is the short reason. */
export function notAvailableReason(k: Skill, recorder: Person | undefined, setting: CheckoffSetting): string | null {
  const off = checkOffOffReason(k.model, checkOffAllowed(k), configured(k), k.config?.questions.length ?? 0)
  if (off) return off
  if (setting === "simulation" && k.config && !k.config.simulation.allowed) return "Simulation does not count for this skill."
  if (!recorder) return "No evaluator is named for this session."
  return ineligibleReason(k, recorder, setting)
}

/** The first sentence of a reason, for a column or a list line. */
export const shortReason = (r: string): string => r.split(/(?<=\.)\s/)[0]

// ---------------------------------------------------------------------------------------------------------------------
// Offerings, roster and mapped skills

export interface CheckoffOffering {
  id: string
  code: string
  name: string
  term: string
  label: string
}

/** Students registered to an offering: its cohort (the sample data has no separate enrolment list). */
export function offeringRoster(s: V2State, o: CourseOffering): Person[] {
  return s.people.filter((p) => p.kind === "student" && p.cohortId === o.cohortId).sort((a, b) => a.name.localeCompare(b.name))
}

export interface MappedSkill {
  skill: Skill
  level: Exclude<MapLevel, "none">
  levelLabel: string
}

const LEVEL_RANK: Record<Exclude<MapLevel, "none">, number> = { mandatory: 0, recommended: 1, optional: 2 }

/** Skills mapped to the offering at any level, active only; mandatory first, then by name. */
export function offeringSkills(s: V2State, o: CourseOffering): MappedSkill[] {
  const out: MappedSkill[] = []
  for (const [id, level] of offeringLevels(s, EMPTY_MAPPING_OVERLAY, o)) {
    if (level === "none") continue
    const skill = s.skills.find((k) => k.id === id)
    if (!skill || skill.active === false) continue
    out.push({ skill, level, levelLabel: LEVEL_LABEL[level] })
  }
  return out.sort((a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level] || a.skill.name.localeCompare(b.skill.name))
}

/** Offerings ready for a check-off in the current term: students registered and skills mapped [PROTO]. Focus course first. */
export function checkoffOfferings(s: V2State): CheckoffOffering[] {
  const term = (s.terms ?? []).find((t) => t.current)
  const out: CheckoffOffering[] = []
  for (const o of s.offerings ?? []) {
    if (term && o.termId !== term.id) continue
    if (!offeringRoster(s, o).length || !offeringSkills(s, o).length) continue
    const c = (s.courses ?? []).find((x) => x.id === o.courseId)
    if (!c) continue
    const t = (s.terms ?? []).find((x) => x.id === o.termId)?.name ?? ""
    out.push({ id: o.id, code: c.code, name: c.name, term: t, label: `${c.code} ${c.name}, ${t}` })
  }
  return out.sort((a, b) => (a.code === s.course.code ? -1 : b.code === s.course.code ? 1 : a.code.localeCompare(b.code)))
}

/** Who can record: faculty, or lab instructors, on record (sample data). */
export function recorders(s: V2State, role: RecorderRole): Person[] {
  return s.people.filter((p) => p.kind === role)
}

// ---------------------------------------------------------------------------------------------------------------------
// Cells

export interface CellFlags {
  /** The record is already achieved: the cell reads "Already qualifies" and cannot be ticked (D-L8d). */
  hasEvidence: boolean
  /** A request is already with an evaluator, or an evaluation is held [PROTO "Awaiting an evaluation already sent"]. */
  awaiting: boolean
}

const WAITING = new Set(["with-evaluator", "stalled", "awaiting-review"])

export function cellFlags(s: V2State, studentId: string, skillId: string): CellFlags {
  const hasEvidence = !!skillProgress(s, studentId, skillId)?.achieved
  const req = openRequestFor(s, studentId, skillId)
  const held = s.evaluations.some((e) => e.studentId === studentId && e.skillId === skillId && e.status === "awaiting-approval")
  return { hasEvidence, awaiting: !hasEvidence && ((!!req && WAITING.has(req.status)) || held) }
}

export const FLAG_WORD = { hasEvidence: "Already qualifies", awaiting: "Evaluation already sent" } as const
export const FLAG_ICON = { hasEvidence: "fa-solid fa-circle-check", awaiting: "fa-light fa-hourglass-half" } as const

/** A cell can be ticked unless its student already qualifies for the skill (D-L8d). Waiting cells stay tickable. */
export const isTickable = (f: CellFlags): boolean => !f.hasEvidence

/** The quiet record-bar line while nothing is ticked, so faculty know where saving happens (D-L8d). */
export const NOTHING_TICKED = "Tick students to record check-offs"

// ---------------------------------------------------------------------------------------------------------------------
// Record

/** The evaluation detail one tick writes [PROTO `qS`]. */
export function tickDetail(k: Skill): { detail: EvaluationDetail; levelIndex?: number } {
  const c = k.config
  if (!c) return { detail: { feedback: "" } }
  if (k.model === "demonstration") {
    const levelIndex = checkOffLevelIndex(c.levels, c.checkOff?.levelIndex)
    return { detail: { feedback: "", levelIndex }, levelIndex }
  }
  if (k.model === "question") return { detail: { feedback: "", answers: c.questions.map(() => "yes" as const) } }
  if (k.model === "scored") {
    const v = checkOffScore(c.scaleMax ?? 5, c.scoredRule, c.checkOff?.score, c.questions.length)
    return { detail: { feedback: "", scores: c.questions.map(() => v) } }
  }
  return { detail: { feedback: "" } }
}

export interface CheckoffSession {
  offeringId: string
  /** YYYY-MM-DD */
  date: string
  setting: CheckoffSetting
  recorderId: string
  sessionId: string
}

export interface RecordResult {
  state: V2State
  count: number
  review: number
  /** cell key -> "done" | "review" */
  cells: Record<string, "done" | "review">
}

export const cellKey = (studentId: string, skillId: string): string => `${studentId}|${skillId}`

/**
 * Writes one evaluation per ticked cell [PROTO `Ot`]: status counted, or awaiting approval when the skill requires it; the session's
 * setting and no clinical setting [REQ SC-12]; source "checkoff". Evaluations are never edited afterwards.
 */
export function recordCheckoffs(s: V2State, session: CheckoffSession, keys: readonly string[], at: string): RecordResult {
  const o = (s.offerings ?? []).find((x) => x.id === session.offeringId)
  const cells: Record<string, "done" | "review"> = {}
  const added: Evaluation[] = []
  // A student who already qualifies is never written again (D-L8d); the grid shows them no checkbox.
  const live = keys.filter((key) => {
    const [studentId, skillId] = key.split("|")
    return isTickable(cellFlags(s, studentId, skillId))
  })
  live.forEach((key, i) => {
    const [studentId, skillId] = key.split("|")
    const k = s.skills.find((x) => x.id === skillId)
    if (!k || !o) return
    const review = !!k.config?.approvalRequired
    const { detail, levelIndex } = tickDetail(k)
    const id = `ev-co-${session.sessionId}-${i}`
    added.push({
      id,
      studentId,
      skillId,
      evaluatorId: session.recorderId,
      setting: session.setting,
      date: session.date,
      status: review ? "awaiting-approval" : "counted",
      outcome: "met",
      currentVersion: 1,
      versions: [{ version: 1, outcome: "met", at, by: session.recorderId, reason: null, detail }],
      courseId: o.courseId,
      ...(typeof levelIndex === "number" ? { levelIndex } : {}),
      source: "checkoff",
      sessionId: session.sessionId,
    })
    cells[key] = review ? "review" : "done"
  })
  const review = Object.values(cells).filter((v) => v === "review").length
  return { state: added.length ? { ...s, evaluations: [...s.evaluations, ...added] } : s, count: added.length, review, cells }
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** "Recorded 6 check-offs for Esteban Villarreal on Oct 26. 1 went to administrator review; the rest count now." */
export function recordedSentence(count: number, review: number, who: string, date: string): string {
  const head = `Recorded ${plural(count, "check-off", "check-offs")} for ${who} on ${date}.`
  if (!review) return `${head} ${count === 1 ? "It counts" : "They count"} now.`
  if (review === count) return `${head} ${count === 1 ? "It went" : "All went"} to administrator review.`
  return `${head} ${review} went to administrator review; the rest count now.`
}

/** The student-facing and reviewer-facing note on a check-off evaluation [PROTO "Recorded by check-off"]. */
export const CHECKOFF_TAG = "Check-off"
export function checkoffNote(k: Skill | undefined): string {
  const what = k ? tickRecords(k) : ""
  return `Recorded in a group check-off on the course offering, not from a student submission. There are no student details and no self-evaluation, because the evaluator recorded what they observed.${what ? ` ${what}.` : ""}`
}

/** The most recent check-off for a student and skill, for "already done" cues on the student side. */
export function latestCheckoff(s: V2State, studentId: string, skillId: string): Evaluation | null {
  const xs = s.evaluations.filter((e) => e.studentId === studentId && e.skillId === skillId && e.source === "checkoff")
  return xs.length ? xs.reduce((a, b) => (a.date >= b.date ? a : b)) : null
}

/** "Checked off in the skills lab by Esteban Villarreal on Oct 26." with whether it counts yet. */
export function checkoffDoneLine(s: V2State, e: Evaluation, dateLabel: string): string {
  const who = s.people.find((p) => p.id === e.evaluatorId)?.name.split(",")[0] ?? "faculty"
  const where = e.setting === "simulation" ? "in simulation" : "in the skills lab"
  return e.status === "awaiting-approval" ? `Checked off ${where} by ${who} on ${dateLabel}, awaiting approval.` : `Checked off ${where} by ${who} on ${dateLabel}. No need to send it.`
}
