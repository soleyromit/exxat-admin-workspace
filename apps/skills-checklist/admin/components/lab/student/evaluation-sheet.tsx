"use client"

/**
 * The completed evaluation, in full and read only, for the student [REQ SH-07]: the evaluator's responses (every question, score and
 * level, beside the student's own self-rating where there was one) and the feedback word for word, with the facts (date, evaluator
 * and role, setting, location, course) and what the student sent with it (the one note, ST-12).
 *
 * A non-modal DS FloatingSheetPanel (an inspector beside Skill detail or Record, so the list stays usable), opened by `?evaluation=`
 * so Back closes it and the link can be shared. No edit control anywhere: a completed evaluation is immutable [REQ RV-03, RV-05];
 * when it did not count, the next step is a further attempt from the page behind. One model for every surface that opens an
 * evaluation (renderer components/lab/evaluation/evaluation-view.tsx, model lib/lab/evaluation-view.ts), so the student reads exactly
 * what staff read.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { railTriggerProps } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { heldState } from "@/lib/v2/approvals"
import type { V2State } from "@/lib/v2/types"
import { evaluationView } from "@/lib/lab/evaluation-view"
import { EvaluationSheet } from "@/components/lab/evaluation/evaluation-view"
import { LabLink } from "@/components/lab/lab-bar/lab-link"
import { LINK } from "@/components/lab/link-styles"

/** The URL key that opens the panel. */
export const EVALUATION_PARAM = "evaluation"

export const READ_ONLY_LINE = "Read only. A completed evaluation cannot be changed."

export function StudentEvaluationSheet({ state, studentId, evaluationId, onClose }: { state: V2State; studentId: string; evaluationId: string | null; onClose: () => void }) {
  const views = React.useMemo(() => {
    if (!evaluationId) return null
    const view = evaluationView(heldState(state), evaluationId)
    // FERPA: a student opens only their own evaluations; any other id shows nothing.
    const e = state.evaluations.find((x) => x.id === evaluationId)
    return view && e?.studentId === studentId ? [view] : null
  }, [state, studentId, evaluationId])
  return <EvaluationSheet views={views} subtitle={READ_ONLY_LINE} audience="student" contentSlot="lab-student-evaluation" onClose={onClose} />
}

/** The control on an attempt or a record row that opens it [REQ SH-07]. Ghost, so a list of rows never reads as a row of actions. */
export function ViewEvaluationButton({ onOpen, name, className }: { onOpen: () => void; name: string; className?: string }) {
  return (
    <Button type="button" variant="ghost" size="sm" className={className} onClick={onOpen} aria-label={`View evaluation, ${name}`} {...railTriggerProps()}>
      View evaluation
    </Button>
  )
}

/**
 * The phone form of the same control on a record row [REQ SH-07]: a text link to `?evaluation=` (one tap, Back closes the panel),
 * tall enough to tap (44 px). A link in the row, like the skill name above it, so a list of rows never reads as a column of buttons.
 */
export function ViewEvaluationLink({ href, name }: { href: string; name: string }) {
  return (
    <LabLink href={href} scroll={false} className={`${LINK} inline-flex min-h-11 items-center self-start text-sm`} aria-label={`View evaluation, ${name}`} data-view-evaluation>
      View evaluation
    </LabLink>
  )
}
