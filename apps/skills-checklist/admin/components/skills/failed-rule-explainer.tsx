import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import type { Reason, UnmetCriterion } from "@/lib/engine"
import { didNotMeetSentence, evaluationReasonText, nextStep, returnedText, skillReasonText, waitingText, type RuleContext } from "@/lib/copy"

/**
 * SH-03: states the RULE that was not met in terms the student can act on, then a next step. Text is generated at read
 * time from structured reasons (AE-02, AE-06). Never "failed", never red: LocalBanner variant warning (amber).
 */
export interface FailedRuleExplainerProps {
  ctx: RuleContext
  /** Why one completed evaluation did not qualify (empty for demonstration skills). */
  evaluationReasons?: Reason[]
  /** Why the skill is not yet achieved even though evidence counts. */
  skillReasons?: UnmetCriterion[]
  noun?: "demonstrations" | "qualifyingEvaluations"
  recordedLabelId?: "a" | "b"
  next?: keyof typeof nextStep
  waiting?: Array<{ with: string }>
  returnedCount?: number
  title?: string
}

export function FailedRuleExplainer({ ctx, evaluationReasons = [], skillReasons = [], noun, recordedLabelId, next = "furtherAttempt", waiting = [], returnedCount = 0, title }: FailedRuleExplainerProps) {
  const lines: string[] = []
  for (const r of evaluationReasons) lines.push(didNotMeetSentence(evaluationReasonText(r, ctx, recordedLabelId), nextStep[next]))
  const skillLines = skillReasons.map((u) => skillReasonText(u, ctx, noun))
  if (waiting.length) lines.push(waitingText(waiting.length, waiting.map((w) => w.with)))
  if (returnedCount) lines.push(returnedText(returnedCount))
  if (lines.length === 0 && skillLines.length === 0) return null
  return (
    <LocalBanner variant="warning" title={title}>
      {lines.map((l) => (
        <p key={l}>{l}</p>
      ))}
      {skillLines.length ? (
        <ul className="list-disc pl-5">
          {skillLines.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      ) : null}
    </LocalBanner>
  )
}
