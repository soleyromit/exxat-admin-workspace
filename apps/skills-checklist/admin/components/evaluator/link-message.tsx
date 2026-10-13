"use client"

import * as React from "react"
import { linkMessage } from "@/lib/copy"

export type LinkProblem = "invalid" | "superseded" | "submitted"

/**
 * One neutral standalone page for a link that cannot be used (OD-18 is OPEN). No student data, no hint of the reason,
 * no expiry rule. An already-submitted link says so and shows nothing editable (RV-03, RV-05).
 * The heading takes focus on mount so a screen reader lands on the message (cross-cutting §9).
 */
export function LinkMessage({ problem }: { problem: LinkProblem }) {
  const h1 = React.useRef<HTMLHeadingElement>(null)
  React.useEffect(() => {
    h1.current?.focus()
  }, [])
  const text = problem === "submitted" ? linkMessage.alreadySubmitted : problem === "superseded" ? linkMessage.superseded : linkMessage.invalid
  return (
    <div className="flex flex-col gap-2 py-6" data-testid="link-message">
      <h1 ref={h1} tabIndex={-1} className="text-xl font-semibold text-foreground">
        {text}
      </h1>
    </div>
  )
}
