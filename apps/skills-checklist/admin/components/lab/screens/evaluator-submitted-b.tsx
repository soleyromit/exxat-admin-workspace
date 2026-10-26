"use client"

/**
 * Submitted B, what happens next. The same receipt lines as A (EV-07: counts now or waits for approval) laid out as a short
 * ordered checklist: done steps filled, the approval step open, the student's view last. Question: does a sequence explain
 * "waits for approval" better than a per-skill badge? Lab states as A.
 */
import * as React from "react"
import { useEvaluator } from "@/components/lab/evaluator/use-evaluator"
import { NextSteps, OutcomeShell } from "@/components/lab/evaluator/outcome-variants"

const STATES = [
  { id: "submitted", label: "Submitted" },
  { id: "offline", label: "Saved offline, queued" },
  { id: "unverified", label: "Name not yet on record" },
]

export function EvaluatorSubmittedB() {
  const m = useEvaluator("submitted", ["submitted", "offline", "unverified"])
  return <OutcomeShell m={m} states={STATES} defaultState="submitted">{(req) => <NextSteps req={req} lines={m.receiptLines} offline={m.offline} />}</OutcomeShell>
}
