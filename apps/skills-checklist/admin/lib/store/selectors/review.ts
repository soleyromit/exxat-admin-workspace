// S-11 review queue (AR-01..AR-06): evaluations waiting for an administrator decision. Evidence in this queue is
// excluded from achievement until approved (AR-06). Student and evaluator assessments are comparable (AR-02).
import type { Db, Id } from "@/lib/domain/types"
import { isConfigured, qualifies } from "@/lib/engine"
import { currentEvaluation, skillOf, submissionState } from "../derive"
import { locationName, offeringLabel, recordedDetail, roleLabel, settingName, type RecordedDetail } from "./shared"

export interface ReviewItem {
  evaluationId: Id
  submissionId: Id
  studentId: Id
  studentName: string
  cohortName: string
  skillId: Id
  skillName: string
  offeringLabel: string
  performedIn: "clinical" | "lab"
  settingName: string | null
  locationName: string | null
  evaluatorName: string
  evaluatorRole: string
  completedAt: string
  /** AR-01 "Qualifies" badge: derived from the skill's CURRENT rule. */
  qualifies: boolean
  evaluator: RecordedDetail | null
  /** AR-02. */
  selfEvaluation: RecordedDetail | null
  /** null when no self-evaluation exists. */
  agree: boolean | null
  comment: string
  studentNote: string
  values: Array<{ label: string; value: string | number }>
  revision: number
}

const sameAnswers = (a: RecordedDetail | null, b: RecordedDetail | null): boolean => !!a && !!b && JSON.stringify(a) === JSON.stringify(b)

export function reviewQueue(db: Db): ReviewItem[] {
  const out: ReviewItem[] = []
  for (const sub of db.submissions) {
    if (submissionState(db, sub) !== "awaitingApproval") continue
    const skill = skillOf(db, sub.skillId)
    const ev = currentEvaluation(db, sub)
    if (!skill || !ev || !isConfigured(skill)) continue
    const student = db.students.find((s) => s.id === sub.studentId)
    const evaluator = recordedDetail(skill, ev.responses)
    const self = sub.selfEvaluation ? recordedDetail(skill, sub.selfEvaluation) : null
    out.push({
      evaluationId: ev.id,
      submissionId: sub.id,
      studentId: sub.studentId,
      studentName: student?.name ?? "",
      cohortName: db.cohorts.find((c) => c.id === student?.cohortId)?.name ?? "",
      skillId: skill.id,
      skillName: skill.name,
      offeringLabel: offeringLabel(db.offerings.find((o) => o.id === sub.offeringId)!),
      performedIn: sub.performedIn,
      settingName: settingName(db, sub.clinicalSettingId),
      locationName: locationName(db, sub.locationId),
      evaluatorName: sub.evaluator.name,
      evaluatorRole: roleLabel(db, sub.evaluator.roleId),
      completedAt: ev.completedAt,
      qualifies: qualifies(ev.responses, skill.model),
      evaluator,
      selfEvaluation: self,
      agree: self ? sameAnswers(self, evaluator) : null,
      comment: ev.comment,
      studentNote: sub.studentNote,
      values: skill.submissionFields.filter((f) => sub.values[f.id] !== undefined).map((f) => ({ label: f.label, value: sub.values[f.id] })),
      revision: sub.revision,
    })
  }
  return out.sort((a, b) => a.completedAt.localeCompare(b.completedAt))
}
