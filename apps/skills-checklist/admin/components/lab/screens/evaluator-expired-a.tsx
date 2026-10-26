"use client"

/**
 * Expired or not for you. The link opens no form content for someone who may not be the evaluator: expired (OD-18 lifetime
 * open, date is a lab sample), forwarded ("Is this for you?" then the form or "not for you"), not for you, already completed.
 * One message and one way out each. A forwarded person cannot sign as someone else (forward or adopt stays OD-18).
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { EvaluatorGate } from "@/components/lab/evaluator/gate"
import { useEvaluator } from "@/components/lab/evaluator/use-evaluator"

const STATES = [
  { id: "expired", label: "Expired link" },
  { id: "forwarded", label: "Forwarded: is this for you?" },
  { id: "not-for-you", label: "Not for you" },
  { id: "completed", label: "Already completed" },
]

export function EvaluatorExpiredA() {
  const m = useEvaluator("expired")
  return (
    <EvaluatorGate m={m} states={STATES} defaultState="expired" showSample={false}>
      <div className="flex flex-col items-start gap-3 pt-2" data-lab-chrome>
        <p className="text-sm text-muted-foreground">Confirmed. In the product the form opens here.</p>
        <Button asChild variant="outline" size="sm"><Link href="/lab/evaluator/evaluation-form">Open the evaluation form</Link></Button>
      </div>
    </EvaluatorGate>
  )
}
