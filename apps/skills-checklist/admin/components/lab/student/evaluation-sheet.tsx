"use client"

/**
 * The completed evaluation, in full and read only, for the student [REQ SH-07]: the evaluator's responses (every question, score and
 * level, beside the student's own self-rating where there was one) and the feedback word for word, with the facts (date, evaluator
 * and role, setting, location, course) and what the student sent with it (the one note, ST-12).
 *
 * A non-modal DS FloatingSheetPanel (an inspector beside Skill detail or Record, so the list stays usable), opened by `?evaluation=`
 * so Back closes it and the link can be shared. No edit control anywhere: a completed evaluation is immutable [REQ RV-03, RV-05];
 * when it did not count, the next step is a further attempt from the page behind. One model for every surface that opens an
 * evaluation (lib/lab/evaluation-view.ts), so the student reads exactly what staff read.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { FloatingSheetPanel, FloatingSheetPanelBody, FloatingSheetPanelContent, FloatingSheetPanelHeader, FloatingSheetPanelToolbar, railTriggerProps } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { heldState } from "@/lib/v2/approvals"
import type { V2State } from "@/lib/v2/types"
import { evaluationView } from "@/lib/lab/evaluation-view"
import { CompareTable, Feedback } from "@/components/lab/reviewer/review-parts"
import { FactList } from "@/components/lab/reviewer/parts"

/** The URL key that opens the panel. */
export const EVALUATION_PARAM = "evaluation"

export const READ_ONLY_LINE = "Read only. A completed evaluation cannot be changed."

export function StudentEvaluationSheet({ state, studentId, evaluationId, onClose }: { state: V2State; studentId: string; evaluationId: string | null; onClose: () => void }) {
  const v = React.useMemo(() => {
    if (!evaluationId) return null
    const view = evaluationView(heldState(state), evaluationId)
    // FERPA: a student opens only their own evaluations; any other id shows nothing.
    const e = state.evaluations.find((x) => x.id === evaluationId)
    return view && e?.studentId === studentId ? view : null
  }, [state, studentId, evaluationId])
  return (
    <FloatingSheetPanel open={!!v} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <FloatingSheetPanelContent contentSlot="lab-student-evaluation" size="md">
        <FloatingSheetPanelToolbar />
        <FloatingSheetPanelHeader title={v?.skill ?? "Evaluation"} subtitle={READ_ONLY_LINE} />
        <FloatingSheetPanelBody className="flex flex-col gap-5 px-4 pb-4" data-student-evaluation={v?.id}>
          {v ? (
            <>
              <FactList facts={[["Outcome", `${v.outcome}, ${v.status.toLowerCase()}`], ...v.facts.map((f) => [f.label, f.value] as [string, React.ReactNode])]} />
              {v.checkoffNote ? <p className="text-sm text-muted-foreground" data-checkoff-note>{v.checkoffNote}</p> : null}
              <section className="flex flex-col gap-1.5" aria-label="Responses">
                <h3 className="text-sm font-semibold">Responses</h3>
                {v.recorded ? <CompareTable c={v.comparison} compact /> : <p className="text-sm text-muted-foreground">Only the outcome was recorded for this evaluation.</p>}
              </section>
              <section className="flex flex-col gap-1.5" aria-label="Feedback">
                <h3 className="text-sm font-semibold">Feedback</h3>
                {v.feedback ? <Feedback text={v.feedback} /> : <p className="text-sm text-muted-foreground">No feedback was written.</p>}
              </section>
              {v.supplied.length || v.studentNote ? (
                <section className="flex flex-col gap-1.5" aria-label="What you sent">
                  <h3 className="text-sm font-semibold">What you sent</h3>
                  {v.supplied.length ? <FactList facts={v.supplied.map((f) => [f.label, f.value] as [string, React.ReactNode])} /> : null}
                  {v.studentNote ? (
                    <blockquote className="whitespace-pre-line border-s-2 border-border ps-3 text-sm text-foreground" data-user-content data-student-note>
                      <span className="sr-only">Your note: </span>
                      {v.studentNote}
                    </blockquote>
                  ) : null}
                </section>
              ) : null}
              {v.reviewNote ? <FactList facts={[["Review note", <span key="n" data-user-content>{v.reviewNote}</span>]]} /> : null}
            </>
          ) : null}
        </FloatingSheetPanelBody>
      </FloatingSheetPanelContent>
    </FloatingSheetPanel>
  )
}

/** The control on an attempt or a record row that opens it [REQ SH-07]. Ghost, so a list of rows never reads as a row of actions. */
export function ViewEvaluationButton({ onOpen, name, className }: { onOpen: () => void; name: string; className?: string }) {
  return (
    <Button type="button" variant="ghost" size="sm" className={className} onClick={onOpen} aria-label={`View evaluation, ${name}`} {...railTriggerProps()}>
      View evaluation
    </Button>
  )
}
