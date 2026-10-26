"use client"

/**
 * Submitted C, thanks and what the student sees. The receipt is told from the next role's side: each skill with the word the
 * student will read on their progress (Counted, Awaiting approval). Question: does showing the student's view connect the
 * handoff (ledger D-C) and make "waits" feel finished for the evaluator? One link per request, so no next-request button.
 */
import * as React from "react"
import { useEvaluator } from "@/components/lab/evaluator/use-evaluator"
import { OutcomeShell, StudentSees } from "@/components/lab/evaluator/outcome-variants"

const STATES = [
  { id: "submitted", label: "Submitted" },
  { id: "offline", label: "Saved offline, queued" },
  { id: "unverified", label: "Name not yet on record" },
]

export function EvaluatorSubmittedC() {
  const m = useEvaluator("submitted", ["submitted", "offline", "unverified"])
  return <OutcomeShell m={m} states={STATES} defaultState="submitted">{(req) => <StudentSees req={req} lines={m.receiptLines} offline={m.offline} />}</OutcomeShell>
}
