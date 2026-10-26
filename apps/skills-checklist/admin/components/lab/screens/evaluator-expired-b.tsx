"use client"

/**
 * Expired B, ask the student to resend. For a lapsed link that reached its addressee, show which request it was (student, course,
 * how many skills, sent) so the evaluator can act without guessing, and one way out: email the student. Not for you and the
 * forwarded check still show nothing of the request (per-request privacy, D-L2). Link lifetime is OD-18 (open); dates are samples.
 */
import * as React from "react"
import { useEvaluator } from "@/components/lab/evaluator/use-evaluator"
import { OutcomeShell, ResendPreview, SharedTerminal } from "@/components/lab/evaluator/outcome-variants"

const STATES = [
  { id: "expired", label: "Expired link" },
  { id: "forwarded", label: "Forwarded: is this for you?" },
  { id: "not-for-you", label: "Not for you" },
  { id: "completed", label: "Already completed" },
]

export function EvaluatorExpiredB() {
  const m = useEvaluator("expired")
  return (
    <OutcomeShell m={m} states={STATES} defaultState="expired">
      {(req) => (
        <SharedTerminal m={m} req={req}>
          <ResendPreview req={req} />
        </SharedTerminal>
      )}
    </OutcomeShell>
  )
}
