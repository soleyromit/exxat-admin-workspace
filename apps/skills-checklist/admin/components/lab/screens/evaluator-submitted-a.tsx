"use client"

/**
 * Submitted (receipt). Per skill: the answer and whether it counts now or waits for program approval (EV-07), glyph + word,
 * amber only for "waits". No "next request" button: a per-request link exposes only its own request (D-L2), so the evaluator
 * is pointed back to the email. Lab controls: submitted, offline queued; Options: "Program holds for approval" shows waits.
 */
import * as React from "react"
import { EvaluatorGate } from "@/components/lab/evaluator/gate"
import { useEvaluator } from "@/components/lab/evaluator/use-evaluator"

const STATES = [
  { id: "submitted", label: "Submitted" },
  { id: "offline", label: "Saved offline, queued" },
  { id: "unverified", label: "Name not yet on record" },
]

export function EvaluatorSubmittedA() {
  const m = useEvaluator("submitted", ["submitted", "offline", "unverified"])
  return <EvaluatorGate m={m} states={STATES} defaultState="submitted" />
}
