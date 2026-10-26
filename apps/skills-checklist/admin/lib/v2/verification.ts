import type { Result } from "./admin-actions"
import { evalsOfStudent, evalsOfStudentSkill, evaluationById, mappingsOfCourse, skillById, submissionsOfStudent } from "./evidence-index"
import { nextIdFor } from "./outcomes"
import { appendAudit } from "./store"
import { heldState } from "./approvals"
import { mandatoryProgressFor } from "./population"
import { skillProgress } from "./student"
import type { Evaluation, Person, Skill, Submission, V2State, Verification } from "./types"

/**
 * Stage 4: a program director verifies a student's record. A verification is a numbered, append-only version: it lists the counted
 * evaluations (and the version of each) it rests on, and it is never edited. Reopening a verified evaluation (the Stage 3 flow) does
 * not touch it; the record reads "Changed since verified" until the director verifies again, which adds the next version.
 */

export const NOTE_MAX = 1000

export const isDirector = (p: Person | undefined): p is Person => !!p && p.kind === "director"

export const verificationsOf = (s: V2State): Verification[] => s.verifications ?? []

const nameOf = (s: V2State, id: string) => s.people.find((p) => p.id === id)?.name ?? "Unknown person"
const skillOf = (s: V2State, id: string): Skill | undefined => skillById(s, id)
const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)

const OPEN_REQUEST: Array<Submission["status"]> = ["on-device", "with-evaluator", "awaiting-review", "stalled", "returned"]

export function latestVerification(s: V2State, studentId: string): Verification | null {
  const mine = verificationsOf(s).filter((v) => v.studentId === studentId)
  return mine.length ? mine[mine.length - 1] : null
}

export interface MandatorySkill {
  skill: Skill
  achieved: boolean
  counted: number
  need: number
  /** The student's counted evaluations for this skill, newest first. */
  evaluations: Evaluation[]
}

/**
 * The student's mandatory skills with progress against each rule (AE-03): the mandatory, configured, published skills of their
 * own cohort's course offerings in the current term, read from the single population module (lib/v2/population.ts), on the
 * effective state (evidence held for approval does not count). Equals the dashboard's required set for that student.
 */
export function mandatoryProgress(s: V2State, studentId: string): MandatorySkill[] {
  return mandatoryProgressFor(s, studentId)
}

/** Focus-course view only (one course's mandatory skills), for a screen that explicitly shows a single course; label it so. */
export function mandatoryProgressForCourse(s: V2State, studentId: string, courseId: string = s.course.id): MandatorySkill[] {
  const out: MandatorySkill[] = []
  for (const m of mappingsOfCourse(s, courseId)) {
    if (m.level !== "mandatory") continue
    const skill = skillOf(s, m.skillId)
    if (!skill || !skill.configured || !skill.published) continue
    const p = skillProgress(s, studentId, skill.id)
    if (!p) continue
    const evaluations = evalsOfStudentSkill(s, studentId, skill.id).filter((e) => e.status === "counted").sort((a, b) => (a.date < b.date ? 1 : -1))
    out.push({ skill, achieved: p.achieved, counted: p.counted, need: p.need, evaluations })
  }
  return out.sort((a, b) => a.skill.name.localeCompare(b.skill.name))
}

export const countedEvaluations = (s: V2State, studentId: string): Evaluation[] => evalsOfStudent(s, studentId).filter((e) => e.status === "counted")

/** What stops a verification now, in plain words. Empty means the record can be verified. */
export function pendingReasons(state: V2State, studentId: string): string[] {
  // Read on the effective state, so evidence held for an unadopted evaluator name blocks like any evaluation awaiting approval.
  const s = heldState(state)
  const out: string[] = []
  const mine = evalsOfStudent(s, studentId)
  const waiting = mine.filter((e) => e.status === "awaiting-approval").length
  if (waiting) out.push(`${waiting} ${plural(waiting, "evaluation is", "evaluations are")} waiting for approval in the review queue.`)
  const reopened = mine.filter((e) => e.status === "reopened").length
  if (reopened) out.push(`${reopened} ${plural(reopened, "evaluation is", "evaluations are")} reopened. Confirm the newest ${plural(reopened, "version", "versions")} first.`)
  const open = submissionsOfStudent(s, studentId).filter((x) => OPEN_REQUEST.includes(x.status))
  if (open.length) out.push(`${open.length} sign-off ${plural(open.length, "request is", "requests are")} still open, so the record may change.`)
  const orphanReturned = mine.filter((e) => e.status === "returned" && !e.submissionId).length
  if (orphanReturned) out.push(`${orphanReturned} ${plural(orphanReturned, "evaluation was", "evaluations were")} returned for correction and not yet fixed.`)
  return out
}

export type VerifyStatus = "not-verified" | "verified" | "changed"

export const STATUS_LABEL: Record<VerifyStatus, string> = { "not-verified": "Not verified", verified: "Verified", changed: "Changed since verified" }

export interface VerificationStatus {
  status: VerifyStatus
  latest: Verification | null
  /** What changed in the evidence the latest verification rests on. */
  changes: string[]
  /** Counted evaluations that are not part of the latest verification. */
  newer: number
}

export function verificationStatus(s: V2State, studentId: string): VerificationStatus {
  const latest = latestVerification(s, studentId)
  if (!latest) return { status: "not-verified", latest: null, changes: [], newer: 0 }
  const changes: string[] = []
  for (const ev of latest.evidence) {
    const now = evaluationById(s, ev.evaluationId)
    const skill = skillOf(s, ev.skillId)?.name ?? "A skill"
    if (!now) changes.push(`${skill}: an evaluation was removed.`)
    else if (now.currentVersion !== ev.version) changes.push(`${skill}: version ${now.currentVersion} was added to an evaluation verified at version ${ev.version}.${now.status === "counted" ? "" : now.status === "reopened" ? " It is reopened and does not count until it is confirmed." : " It does not count."}`)
    else if (now.status !== "counted") changes.push(`${skill}: an evaluation no longer counts (${now.status === "reopened" ? "reopened" : now.status === "returned" ? "returned" : "waiting for approval"}).`)
  }
  const known = new Set(latest.evidence.map((e) => e.evaluationId))
  const newer = countedEvaluations(s, studentId).filter((e) => !known.has(e.id)).length
  return { status: changes.length ? "changed" : "verified", latest, changes, newer }
}

/** Why this record cannot be verified now, or an empty list. */
export function verifyBlockers(s: V2State, studentId: string): string[] {
  const out = pendingReasons(s, studentId)
  if (countedEvaluations(s, studentId).length === 0) out.push("No evaluation counts yet, so there is nothing to verify.")
  const st = verificationStatus(s, studentId)
  if (out.length === 0 && st.status === "verified" && st.newer === 0) out.push(`Already verified as version ${st.latest?.version}. Nothing has changed since, so there is nothing new to verify.`)
  return out
}

/** Mandatory skills not yet achieved: stated in the confirmation, not a block. */
export const gaps = (s: V2State, studentId: string): MandatorySkill[] => mandatoryProgress(s, studentId).filter((m) => !m.achieved)

export interface VerifyInput {
  note: string
  /** The director confirms having reviewed the evidence and the gaps listed. */
  confirmed: boolean
}

export function verifyRecord(s: V2State, studentId: string, input: VerifyInput, actorId: string, at: string): Result<{ verification: Verification }> {
  if (!isDirector(s.people.find((p) => p.id === actorId))) return { ok: false, error: "Only the program director can verify a record." }
  const student = s.people.find((p) => p.id === studentId && p.kind === "student")
  if (!student) return { ok: false, error: "That student is not in this course." }
  const blockers = verifyBlockers(s, studentId)
  if (blockers.length) return { ok: false, error: `This record cannot be verified yet. ${blockers.join(" ")}` }
  if (!input.confirmed) return { ok: false, error: "Confirm that you reviewed the evidence and the gaps listed before you verify." }
  const note = input.note.trim()
  if (note.length > NOTE_MAX) return { ok: false, error: `Shorten the note to ${NOTE_MAX} characters or fewer (now ${note.length}).` }
  const version = (latestVerification(s, studentId)?.version ?? 0) + 1
  const verification: Verification = {
    id: nextIdFor("vf", verificationsOf(s).map((v) => v.id)),
    studentId,
    version,
    byId: actorId,
    at,
    note,
    evidence: countedEvaluations(s, studentId).map((e) => ({ evaluationId: e.id, skillId: e.skillId, version: e.currentVersion })),
    skills: mandatoryProgress(s, studentId).map((m) => ({ skillId: m.skill.id, achieved: m.achieved })),
  }
  const state = appendAudit({ ...s, verifications: [...verificationsOf(s), verification] }, actorId, `Verified a student's record, version ${version}`, `${student.name}: ${verification.evidence.length} ${plural(verification.evidence.length, "evaluation", "evaluations")}, ${verification.skills.filter((k) => k.achieved).length} of ${verification.skills.length} mandatory skills achieved`, at)
  return { ok: true, state, verification }
}

/** The verification, if any, whose evidence includes this evaluation at its current version. Used to warn before a reopen. */
export function verifiedAt(s: V2State, e: Evaluation): Verification | null {
  const all = verificationsOf(s).filter((v) => v.studentId === e.studentId && v.evidence.some((x) => x.evaluationId === e.id))
  return all.length ? all[all.length - 1] : null
}

export interface VerificationRow {
  studentId: string
  name: string
  status: VerifyStatus
  version: number | null
  verifiedAt: string | null
  verifiedBy: string | null
  mandatoryAchieved: number
  mandatoryTotal: number
  counted: number
  pending: number
}

/** One row per student: the report data (Stage 5 reads this) and the director's list. */
export function verificationRows(s: V2State): VerificationRow[] {
  return s.people
    .filter((p) => p.kind === "student")
    .map((p) => {
      const st = verificationStatus(s, p.id)
      const mp = mandatoryProgress(s, p.id)
      return {
        studentId: p.id,
        name: p.name,
        status: st.status,
        version: st.latest?.version ?? null,
        verifiedAt: st.latest?.at ?? null,
        verifiedBy: st.latest ? nameOf(s, st.latest.byId) : null,
        mandatoryAchieved: mp.filter((m) => m.achieved).length,
        mandatoryTotal: mp.length,
        counted: countedEvaluations(s, p.id).length,
        pending: pendingReasons(s, p.id).length,
      }
    })
}
