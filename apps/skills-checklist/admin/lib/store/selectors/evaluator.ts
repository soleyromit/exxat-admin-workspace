// S-16 data contract (EV-01..EV-07). The evaluator reaches the request by an opaque token with NO account.
// Isolation: this returns exactly the data behind the link and nothing else: no other students, no history, no
// aggregates, and NO achievement status or progress (OD-17 safe default, cross-cutting §10 L-5, L-6).
import type { Db, Id } from "@/lib/domain/types"
import type { CommentRule } from "@/lib/domain/types"
import type { ModelConfig, Responses } from "@/lib/engine"
import { isConfigured } from "@/lib/engine"
import { skillOf } from "../derive"
import { locationName, offeringLabel, roleLabel, settingName } from "./shared"

export type EvaluatorRequestStatus = "ok" | "invalid" | "superseded" | "submitted"

export interface EvaluatorRequestItem {
  submissionId: Id
  skillId: Id
  skillName: string
  /** The form schema the program configured. The evaluator cannot change it (EV-03). */
  model: ModelConfig
  commentRule: CommentRule
  /** EV-07: told BEFORE submit whether this skill counts at once or is held for administrator approval. */
  heldForApproval: boolean
  /** EV-04: what the student supplied, and the self-evaluation when configured. */
  studentValues: Array<{ label: string; value: string | number }>
  studentNote: string
  selfEvaluation: Responses | null
  /** S-16 / RV-02: an earlier evaluation of this submission was returned, so this is a corrected resend. */
  returnedEarlier: boolean
}

export interface EvaluatorRequest {
  status: EvaluatorRequestStatus
  /** Present only when status is "ok". */
  request?: {
    studentName: string
    /** ISO time the request was created (shown as "Requested {date}"). */
    requestedAt: string
    offeringLabel: string
    performedIn: "clinical" | "lab"
    settingName: string | null
    locationName: string | null
    evaluatorName: string
    roleLabel: string
    items: EvaluatorRequestItem[]
  }
}

export function evaluatorRequest(db: Db, token: string): EvaluatorRequest {
  const link = db.links.find((l) => l.token === token)
  if (!link) return { status: "invalid" }
  if (link.supersededAt) return { status: "superseded" }
  if (link.submittedAt) return { status: "submitted" }
  const subs = link.submissionIds.map((id) => db.submissions.find((s) => s.id === id)).filter((s): s is NonNullable<typeof s> => !!s)
  if (subs.length === 0) return { status: "invalid" }
  const first = subs[0]
  const student = db.students.find((s) => s.id === first.studentId)
  const off = db.offerings.find((o) => o.id === first.offeringId)
  const items: EvaluatorRequestItem[] = []
  for (const sub of subs) {
    const skill = skillOf(db, sub.skillId)
    if (!skill || !isConfigured(skill)) continue
    items.push({
      submissionId: sub.id,
      skillId: skill.id,
      skillName: skill.name,
      model: skill.model,
      commentRule: skill.evaluatorComment,
      heldForApproval: skill.requiresApproval,
      studentValues: skill.submissionFields.filter((f) => sub.values[f.id] !== undefined).map((f) => ({ label: f.label, value: sub.values[f.id] })),
      studentNote: sub.studentNote,
      selfEvaluation: sub.selfEvaluation,
      returnedEarlier: sub.revision > 0 && db.evaluations.some((e) => e.submissionId === sub.id && e.revision < sub.revision),
    })
  }
  return {
    status: "ok",
    request: {
      studentName: student?.name ?? "",
      requestedAt: link.createdAt,
      offeringLabel: off ? offeringLabel(off) : "",
      performedIn: first.performedIn,
      settingName: settingName(db, first.clinicalSettingId),
      locationName: locationName(db, first.locationId),
      evaluatorName: link.evaluator.name,
      roleLabel: roleLabel(db, link.evaluator.roleId),
      items,
    },
  }
}
