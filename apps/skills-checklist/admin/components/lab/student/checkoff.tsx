"use client"
/**
 * Group check-off cues on the student side [PROTO prism-skills-prototype_10282026.html; CALL 2026-10-28, Sankalp].
 * - CheckoffTag: the small "Check-off" tag beside the evaluator on an evaluation that came from a group check-off.
 * - CheckoffDone: where a student picks a skill to log or send, says it is already checked off. Not a blocker: mapping is an
 *   expectation and the student may still send it [REQ CM-05, ST-02].
 */
import * as React from "react"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { CHECKOFF_TAG, checkoffDoneLine, latestCheckoff } from "@/lib/lab/course-checkoff"
import { shortDate } from "@/lib/lab/student"
import type { V2State } from "@/lib/v2/types"

export function isCheckoff(s: V2State, evaluationId: string | null | undefined): boolean {
  return !!evaluationId && s.evaluations.some((e) => e.id === evaluationId && e.source === "checkoff")
}

/** Evaluator name, plus the "Check-off" tag when the evaluation came from a group check-off. */
export function EvaluatorWithTag({ s, evaluationId, name }: { s: V2State; evaluationId: string | null | undefined; name: string }) {
  if (!isCheckoff(s, evaluationId)) return <>{name}</>
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {name}
      <Badge variant="outline" data-checkoff-tag>{CHECKOFF_TAG}</Badge>
    </span>
  )
}

/** The "already done" line for a skill with a check-off, or null. */
export function checkoffLineFor(s: V2State, studentId: string, skillId: string): string | null {
  const e = latestCheckoff(s, studentId, skillId)
  return e ? checkoffDoneLine(s, e, shortDate(e.date)) : null
}

/** One muted line per picked skill that faculty already checked off. Renders nothing when none. */
export function CheckoffDone({ s, studentId, ids, names }: { s: V2State; studentId: string; ids: readonly string[]; names?: boolean }) {
  const lines = ids.map((id) => ({ id, line: checkoffLineFor(s, studentId, id), name: s.skills.find((k) => k.id === id)?.name ?? "" })).filter((x) => x.line)
  if (lines.length === 0) return null
  return (
    <ul className="flex flex-col gap-1" data-checkoff-done>
      {lines.map((x) => (
        <li key={x.id} className="flex items-start gap-2 text-sm text-muted-foreground">
          <i className="fa-light fa-badge-check mt-0.5 w-4 text-center" aria-hidden="true" />
          <span>{names !== false && ids.length > 1 ? `${x.name}: ${x.line}` : x.line}</span>
        </li>
      ))}
    </ul>
  )
}
