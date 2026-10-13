import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import type { SubmissionState } from "@/lib/engine"
import { submissionOutcome } from "@/lib/copy"
import { r5 } from "@/lib/copy/r5-student-preceptor"

/**
 * SH-02: the four student-facing outcomes of ONE submission (counted, did not meet criteria, returned, waiting with whom).
 * This is the per-submission outcome. The skill-record status is a different thing and is rendered by SkillStatusBadge,
 * so "Did not meet criteria" is never used for a skill (DEC-003). Always text; amber for attention, never red.
 */
type Tone = "success" | "warning" | "info" | "neutral"

export function outcomeText(state: SubmissionState, who: { name: string; role: string }): string {
  switch (state) {
    case "counted":
      return submissionOutcome.counted
    case "didNotMeet":
      return submissionOutcome.didNotMeet
    case "returned":
      return r5.history.returnedOutcome
    case "awaitingApproval":
      return submissionOutcome.awaitingApproval
    case "awaitingEvaluator":
      return submissionOutcome.awaitingEvaluator(who.name, who.role)
    case "revised":
      return submissionOutcome.revised(who.name, who.role)
    case "draft":
      return submissionOutcome.draft
    case "selfEvalPending":
      return submissionOutcome.selfEvalPending
    case "completed":
      return submissionOutcome.completed
  }
}

const TONE: Record<SubmissionState, Tone> = {
  counted: "success",
  didNotMeet: "warning",
  returned: "warning",
  awaitingApproval: "info",
  awaitingEvaluator: "info",
  revised: "info",
  draft: "neutral",
  selfEvalPending: "neutral",
  completed: "neutral",
}

const ICON: Record<SubmissionState, string> = {
  counted: "fa-circle-check",
  didNotMeet: "fa-circle-exclamation",
  returned: "fa-rotate-left",
  awaitingApproval: "fa-hourglass-half",
  awaitingEvaluator: "fa-clock",
  revised: "fa-clock",
  draft: "fa-pen",
  selfEvalPending: "fa-pen",
  completed: "fa-circle",
}

export function OutcomeBadge({ state, who }: { state: SubmissionState; who: { name: string; role: string } }) {
  return <StatusBadge label={outcomeText(state, who)} tone={TONE[state]} icon={ICON[state]} size="md" />
}
