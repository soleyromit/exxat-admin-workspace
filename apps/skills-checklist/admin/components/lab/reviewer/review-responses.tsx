"use client"

/**
 * The response section of a Review item [REQ AR-02, AR-03]: every evaluation in the submission through the one read-only renderer
 * (components/lab/evaluation/evaluation-view.tsx), so the reviewer examines exactly what the student, the record and the director
 * read: each question, score, level and the evaluator's outcome beside the student's self-rating, each evaluation's own feedback
 * (not the first one found), and what the student supplied, including the self-evaluation note. The page's own facts and decision
 * stay where they are; this is the part that was a summary before.
 */
import * as React from "react"
import type { V2State } from "@/lib/v2/types"
import type { ItemDetail } from "@/lib/lab/reviewer"
import { evaluationView, type EvaluationView } from "@/lib/lab/evaluation-view"
import { EvaluationResponses } from "@/components/lab/evaluation/evaluation-view"

export const PAPER_NOT_ENTERED = "The outcome is on the photo of the paper form and has not been entered."

export function ReviewResponses({ state, d }: { state: V2State | null; d: ItemDetail }) {
  const views = React.useMemo<EvaluationView[]>(
    () => (state ? d.evaluations.map((e) => evaluationView(state, e.id)).filter((v): v is EvaluationView => !!v) : []),
    [state, d.evaluations],
  )
  if (views.length === 0) return <p className="text-sm text-muted-foreground">{PAPER_NOT_ENTERED}</p>
  return (
    <div className="flex flex-col gap-6" data-review-responses>
      {views.map((v, i) => (
        <React.Fragment key={v.id}>
          {i > 0 ? <hr className="border-border" /> : null}
          <EvaluationResponses v={v} withSkill />
        </React.Fragment>
      ))}
    </div>
  )
}
