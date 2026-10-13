// Student selectors (S-12, S-14, S-15). A student sees ONLY their own record (cross-cutting §7): every selector takes
// the student id and never returns another student's data. Mapping is expectation, not eligibility (CM-05): the
// "other skills" list is every usable skill that is not mapped, and evidence from any course counts (CM-07).
import type { CourseOffering, Db, Id, Requirement, Skill } from "@/lib/domain/types"
import { canEdit, canResend, canStartFurtherAttempt, isConfigured, isLocked, type SubmissionState } from "@/lib/engine"
import { currentEvaluation, indexOf, reviewOf, skillOf, submissionState } from "../derive"
import { evidenceLedger, failedRule, skillProgress, type FailedRule, type LedgerRow, type SkillProgress } from "./reporting"
import { locationName, offeringLabel } from "./shared"

export function studentCourses(db: Db, studentId: Id): Array<{ offering: CourseOffering; label: string; placements: Array<{ id: Id; locationId: Id; locationName: string }> }> {
  const stu = db.students.find((s) => s.id === studentId)
  if (!stu) return []
  const own = new Set(db.submissions.filter((s) => s.studentId === studentId).map((s) => s.offeringId))
  return db.offerings
    .filter((o) => o.cohortIds.includes(stu.cohortId) || own.has(o.id) || db.placements.some((p) => p.studentId === studentId && p.offeringId === o.id))
    .map((offering) => ({
      offering,
      label: offeringLabel(offering),
      placements: db.placements.filter((p) => p.studentId === studentId && p.offeringId === offering.id).map((p) => ({ id: p.id, locationId: p.locationId, locationName: locationName(db, p.locationId) ?? p.locationId })),
    }))
}

const OUTSTANDING: SubmissionState[] = ["awaitingEvaluator", "revised", "awaitingApproval"]

export interface CourseSkillRow {
  skill: Skill
  requirement: Requirement | null
  progress: SkillProgress
  /** Submissions the student has made for this skill (any course). */
  sentCount: number
  /** SH-02: waiting submissions. */
  waitingCount: number
  /** An achieved skill can still be requested again if the program wants more evidence (EC-25). */
  achievedCanRequestAgain: boolean
}

export interface WaitingItem {
  submissionId: Id
  requestId: Id
  skillName: string
  evaluatorName: string
  roleId: string
  state: SubmissionState
}

export interface CourseSkills {
  offering: CourseOffering
  /** ST-01: mandatory first. */
  mapped: CourseSkillRow[]
  /** ST-02: skills not mapped to this course can still be submitted. */
  other: CourseSkillRow[]
  /** ST-03: counts for the "show only skills I have sent" filter. */
  sentCount: number
  totalUsable: number
  waiting: WaitingItem[]
}

function rowFor(db: Db, studentId: Id, skill: Skill, requirement: Requirement | null): CourseSkillRow | null {
  const progress = skillProgress(db, studentId, skill.id)
  if (!progress) return null
  const subs = indexOf(db).subsByStudentSkill.get(`${studentId}:${skill.id}`) ?? []
  return {
    skill,
    requirement,
    progress,
    sentCount: subs.length,
    waitingCount: subs.filter((s) => OUTSTANDING.includes(submissionState(db, s))).length,
    achievedCanRequestAgain: progress.evaluation.state === "achieved",
  }
}

export function courseSkills(db: Db, studentId: Id, offeringId: Id, opts: { onlySent?: boolean } = {}): CourseSkills | null {
  const offering = db.offerings.find((o) => o.id === offeringId)
  if (!offering) return null
  const maps = new Map(db.offeringSkillMaps.filter((m) => m.offeringId === offeringId).map((m) => [m.skillId, m.requirement] as const))
  const usable = db.skills.filter((s) => s.active && isConfigured(s)) // IM-09, SL-11: never offered otherwise
  let mapped: CourseSkillRow[] = []
  let other: CourseSkillRow[] = []
  for (const s of usable) {
    const r = rowFor(db, studentId, s, maps.get(s.id) ?? null)
    if (!r) continue
    if (maps.has(s.id)) mapped.push(r)
    else other.push(r)
  }
  const rank = (r: CourseSkillRow) => (r.requirement === "mandatory" ? 0 : 1)
  mapped = mapped.sort((a, b) => rank(a) - rank(b) || a.skill.name.localeCompare(b.skill.name))
  other = other.sort((a, b) => a.skill.name.localeCompare(b.skill.name))
  const sentCount = [...mapped, ...other].filter((r) => r.sentCount > 0).length
  if (opts.onlySent) {
    mapped = mapped.filter((r) => r.sentCount > 0)
    other = other.filter((r) => r.sentCount > 0)
  }
  const waiting: WaitingItem[] = db.submissions
    .filter((s) => s.studentId === studentId && s.offeringId === offeringId && OUTSTANDING.includes(submissionState(db, s)))
    .map((s) => ({ submissionId: s.id, requestId: s.requestId, skillName: skillOf(db, s.skillId)?.name ?? s.skillId, evaluatorName: s.evaluator.name, roleId: s.evaluator.roleId, state: submissionState(db, s) }))
  return { offering, mapped, other, sentCount, totalUsable: usable.length, waiting }
}

// ------------------------------------------------------------------ history (S-14)

export interface AttemptRow {
  ledger: LedgerRow
  state: SubmissionState
  /** What the student can do next (SH-02): rules from the engine, so a locked item never offers an edit (RV-05). */
  actions: { revise: boolean; furtherAttempt: boolean; locked: boolean }
  /** SH-03: only for completed evaluations that did not meet the criteria. */
  failedRule: FailedRule | null
  offeringLabel: string
}

export interface SkillHistory {
  skill: Skill
  progress: SkillProgress
  attempts: AttemptRow[]
  /** SH-04. */
  counters: { counted: number; outstanding: number; returned: number; didNotMeet: number }
  /** SH-06: every course by default, narrowable to one. */
  scope: { all: number; thisCourse: number }
}

export function skillHistory(db: Db, studentId: Id, skillId: Id, opts: { offeringId?: Id } = {}): SkillHistory | null {
  const skill = skillOf(db, skillId)
  const progress = skillProgress(db, studentId, skillId)
  if (!skill || !progress) return null
  const all = evidenceLedger(db, studentId, skillId)
  const rows = opts.offeringId ? all.filter((r) => r.offeringId === opts.offeringId) : all
  const attempts = rows.map((ledger): AttemptRow => {
    const sub = db.submissions.find((s) => s.id === ledger.submissionId)!
    const state = submissionState(db, sub)
    return {
      ledger,
      state,
      actions: { revise: canEdit(state) && canResend(state), furtherAttempt: canStartFurtherAttempt(state), locked: isLocked(state) },
      failedRule: state === "didNotMeet" ? failedRule(db, studentId, skillId, sub.id) : null,
      offeringLabel: offeringLabel(db.offerings.find((o) => o.id === sub.offeringId)!),
    }
  })
  const count = (...s: SubmissionState[]) => attempts.filter((a) => s.includes(a.state)).length
  return {
    skill,
    progress,
    attempts,
    counters: { counted: count("counted"), outstanding: count(...OUTSTANDING), returned: count("returned"), didNotMeet: count("didNotMeet") },
    scope: { all: all.length, thisCourse: opts.offeringId ? all.filter((r) => r.offeringId === opts.offeringId).length : all.length },
  }
}

// ------------------------------------------------------------------ my skills (S-15, derived from SH-06 / CM-07 [INFER])

export interface MySkillRow {
  skill: Skill
  progress: SkillProgress | null
  attempts: number
  waiting: number
  /** [INFER] a skill deactivated after the student gathered evidence stays visible, flagged, with its evidence retained (SL-11). */
  inactiveWithEvidence: boolean
}

export function mySkills(db: Db, studentId: Id): MySkillRow[] {
  const out: MySkillRow[] = []
  for (const skill of db.skills) {
    const subs = indexOf(db).subsByStudentSkill.get(`${studentId}:${skill.id}`) ?? []
    const usable = skill.active && isConfigured(skill)
    if (!usable && subs.length === 0) continue
    out.push({
      skill,
      progress: skillProgress(db, studentId, skill.id),
      attempts: subs.length,
      waiting: subs.filter((s) => OUTSTANDING.includes(submissionState(db, s))).length,
      inactiveWithEvidence: !usable && subs.length > 0,
    })
  }
  return out.sort((a, b) => a.skill.name.localeCompare(b.skill.name))
}

/** The reviewer's note, shown to the student because RV-02 requires the reason a submission was returned to be retained. */
export function returnReason(db: Db, submissionId: Id): string | null {
  const sub = db.submissions.find((s) => s.id === submissionId)
  const ev = sub ? currentEvaluation(db, sub) : undefined
  const rv = ev ? reviewOf(db, ev.id) : undefined
  return rv && rv.decision === "returned" && rv.note ? rv.note : null
}
