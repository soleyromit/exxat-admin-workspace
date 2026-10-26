"use client"

/**
 * Expired C, identify yourself for a fresh link. A seam for OD-18 (link lifetime and re-issue are open): the evaluator types the
 * address the request went to and gets the same neutral answer either way, so the page cannot be used to probe who was asked.
 * Labelled as an open decision in lab chrome. Other states as A.
 */
import * as React from "react"
import { useEvaluator } from "@/components/lab/evaluator/use-evaluator"
import { IdentifySeam, OutcomeShell, SharedTerminal } from "@/components/lab/evaluator/outcome-variants"

const STATES = [
  { id: "expired", label: "Expired link" },
  { id: "forwarded", label: "Forwarded: is this for you?" },
  { id: "not-for-you", label: "Not for you" },
  { id: "completed", label: "Already completed" },
]

export function EvaluatorExpiredC() {
  const m = useEvaluator("expired")
  return (
    <OutcomeShell m={m} states={STATES} defaultState="expired">
      {(req) => (
        <SharedTerminal m={m} req={req}>
          <IdentifySeam req={req} />
        </SharedTerminal>
      )}
    </OutcomeShell>
  )
}
