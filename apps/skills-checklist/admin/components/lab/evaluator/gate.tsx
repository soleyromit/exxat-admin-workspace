"use client"

import * as React from "react"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { EV_STATES } from "@/lib/lab/evaluator"
import { EvaluatorFrame } from "@/components/lab/evaluator/frame"
import { EvLabControls } from "@/components/lab/evaluator/lab-controls"
import { Completed, Expired, Forwarded, NotForYou, Receipt } from "@/components/lab/evaluator/status"
import type { EvaluatorModel } from "@/components/lab/evaluator/use-evaluator"

/**
 * Shared shell for the three form variants: lab controls, the no-chrome frame, and every non-form state. The variant only
 * draws the form itself, its request summary (`summary`, shown inside the light header) and its own sticky bar (`footer`).
 */
export function EvaluatorGate({ m, children, footer, summary, states = EV_STATES, defaultState = "default", showSample = true }: { m: EvaluatorModel; children?: React.ReactNode; footer?: React.ReactNode; summary?: React.ReactNode; states?: Array<{ id: string; label: string }>; defaultState?: string; showSample?: boolean }) {
  const program = m.req?.programName ?? "Your program"
  const body = (() => {
    if (!m.hydrated || !m.req) return { node: <div className="flex flex-col gap-3" aria-busy="true"><Skeleton className="h-8 w-48" /><Skeleton className="h-40 w-full" /></div>, form: false }
    const req = m.req
    if (m.state === "expired") return { node: <Expired req={req} />, form: false }
    if (m.state === "not-for-you" || (m.state === "forwarded" && m.identity === "other")) return { node: <NotForYou req={req} />, form: false }
    if (m.state === "forwarded" && m.identity === "ask") return { node: <Forwarded req={req} onAnswer={(me) => m.setIdentity(me ? "me" : "other")} />, form: false }
    if (m.state === "completed") return { node: <Completed req={req} />, form: false }
    if (m.phase === "submitted") return { node: <Receipt req={req} lines={m.receiptLines} offline={m.offline} />, form: false }
    return { node: children, form: true }
  })()
  return (
    <>
      <EvLabControls states={states} defaultState={defaultState} showSample={showSample} {...(showSample ? {} : { options: [] })} />
      <EvaluatorFrame program={program} footer={body.form ? footer : undefined} summary={body.form ? summary : undefined}>
        {body.node}
      </EvaluatorFrame>
    </>
  )
}
