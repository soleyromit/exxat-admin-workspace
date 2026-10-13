// Derivations shared by actions and selectors. Skill status and submission outcomes are NEVER stored:
// they are recomputed from retained evidence and the skill's CURRENT configuration (AE-02).
import type { Db, Evaluation, Review, Skill, Submission } from "@/lib/domain/types"
import {
  isConfigured,
  submissionOutcome,
  type ApprovalStatus,
  type ConfiguredSkill,
  type Evidence,
  type SubmissionState,
} from "@/lib/engine"

export const skillOf = (db: Db, id: string): Skill | undefined => db.skills.find((s) => s.id === id)

interface Index {
  /** `${submissionId}:${revision}` -> the latest evaluation for that revision. */
  evalByRev: Map<string, Evaluation>
  reviewByEval: Map<string, Review>
  evidence: Evidence[]
  evidenceByStudentSkill: Map<string, Evidence[]>
  subsByStudentSkill: Map<string, Submission[]>
}

const cache = new WeakMap<Db, Index>()

/** One pass over the db, cached by object identity. A new Db (any action) rebuilds it. */
export function indexOf(db: Db): Index {
  const hit = cache.get(db)
  if (hit) return hit
  const evalByRev = new Map<string, Evaluation>()
  for (const e of db.evaluations) evalByRev.set(`${e.submissionId}:${e.revision}`, e)
  const reviewByEval = new Map<string, Review>()
  for (const r of db.reviews) reviewByEval.set(r.evaluationId, r)
  const idx: Index = { evalByRev, reviewByEval, evidence: [], evidenceByStudentSkill: new Map(), subsByStudentSkill: new Map() }
  cache.set(db, idx)
  for (const sub of db.submissions) {
    const key = `${sub.studentId}:${sub.skillId}`
    const list = idx.subsByStudentSkill.get(key) ?? []
    list.push(sub)
    idx.subsByStudentSkill.set(key, list)
    const e = toEvidence(db, sub)
    if (e) {
      idx.evidence.push(e)
      const l = idx.evidenceByStudentSkill.get(key) ?? []
      l.push(e)
      idx.evidenceByStudentSkill.set(key, l)
    }
  }
  return idx
}

/** The evaluation that answers the submission's CURRENT revision, if the evaluator has completed it. */
export function currentEvaluation(db: Db, sub: Submission): Evaluation | undefined {
  return indexOf(db).evalByRev.get(`${sub.id}:${sub.revision}`)
}

export function reviewOf(db: Db, evaluationId: string): Review | undefined {
  return indexOf(db).reviewByEval.get(evaluationId)
}

export function approvalOf(db: Db, ev: Evaluation): ApprovalStatus {
  const r = reviewOf(db, ev.id)
  if (r) return r.decision
  return ev.approvalRequiredAtSubmit ? "pending" : "notRequired"
}

/** Evidence derived from a submission. Returned evaluations are `complete: false` (AR-05: they do not count). */
export function toEvidence(db: Db, sub: Submission): Evidence | undefined {
  const ev = db.evaluations.length && cache.get(db) ? cache.get(db)!.evalByRev.get(`${sub.id}:${sub.revision}`) : db.evaluations.find((x) => x.submissionId === sub.id && x.revision === sub.revision)
  if (!ev) return undefined
  const rv = cache.get(db)?.reviewByEval.get(ev.id) ?? db.reviews.find((r) => r.evaluationId === ev.id)
  const approval: ApprovalStatus = rv ? rv.decision : ev.approvalRequiredAtSubmit ? "pending" : "notRequired"
  return {
    id: ev.id,
    skillId: sub.skillId,
    studentId: sub.studentId,
    courseId: sub.offeringId,
    complete: approval !== "returned",
    approval,
    performedIn: sub.performedIn,
    clinicalSettingId: sub.clinicalSettingId ?? undefined,
    locationId: sub.locationId ?? undefined,
    evaluatorRole: ev.evaluator.roleId,
    responses: ev.responses,
  }
}

export function evidenceOf(db: Db): Evidence[] {
  return indexOf(db).evidence
}

/** SM-02 display state (docs/ux/05), derived. `draft` and `selfEvalPending` only exist under OD-14 and are never produced. */
export function submissionState(db: Db, sub: Submission): SubmissionState {
  if (sub.lifecycle === "draft") return "draft"
  if (sub.lifecycle === "returned") return "returned"
  if (sub.lifecycle === "awaitingEvaluator") return sub.revision > 0 ? "revised" : "awaitingEvaluator"
  const skill = skillOf(db, sub.skillId)
  const e = toEvidence(db, sub)
  if (!skill || !e || !isConfigured(skill)) return "completed"
  return submissionOutcome(e, skill as ConfiguredSkill)
}

export const norm = (s: string): string =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()

/** True when the skill already holds any evaluation (IM-06 Replace guard, SL-11 retention). */
export function skillHasEvidence(db: Db, skillId: string): boolean {
  return db.submissions.some((s) => s.skillId === skillId && db.evaluations.some((e) => e.submissionId === s.id))
}
