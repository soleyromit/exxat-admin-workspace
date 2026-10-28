"use client"

/**
 * Read-only evaluation sheet [REQ RP-07, AR-03]: one or more recorded evaluations in full, beside the page that opened them
 * (non-modal DS FloatingSheetPanel, an inspector, so the record behind stays usable). Each evaluation shows its facts (date,
 * evaluator and role, setting, location), every response row (questions Yes or No, the score on each question, the level, the
 * outcome) with the student's self-rating beside it where one exists, the evaluator's feedback, what the student supplied and the
 * student's note. No edit control: completed evaluations are immutable [REQ RV-03, RV-05]; a change is "Request a correction" on
 * the record row. Model: lib/lab/evaluation-view.ts.
 */
import * as React from "react"
import { FloatingSheetPanel, FloatingSheetPanelBody, FloatingSheetPanelContent, FloatingSheetPanelHeader, FloatingSheetPanelToolbar } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import type { EvaluationView } from "@/lib/lab/evaluation-view"
import { CompareTable, Feedback } from "@/components/lab/reviewer/review-parts"
import { FactList } from "@/components/lab/reviewer/parts"

export function EvaluationBody({ v }: { v: EvaluationView }) {
  return (
    <article className="flex flex-col gap-3" data-evaluation-view={v.id} aria-label={`${v.skill}, ${v.facts[0]?.value ?? ""}`}>
      <FactList facts={[["Outcome", `${v.outcome}, ${v.status.toLowerCase()}`], ...v.facts.map((f) => [f.label, f.value] as [string, React.ReactNode])]} />
      {v.checkoffNote ? <p className="text-sm text-muted-foreground" data-checkoff-note>{v.checkoffNote}</p> : null}
      <section className="flex flex-col gap-1.5" aria-label="Responses">
        <h3 className="text-sm font-semibold">Responses</h3>
        {v.recorded ? <CompareTable c={v.comparison} compact showNote={false} /> : <p className="text-sm text-muted-foreground">Only the outcome was recorded for this evaluation.</p>}
      </section>
      {v.feedback ? (
        <section className="flex flex-col gap-1.5" aria-label="Feedback">
          <h3 className="text-sm font-semibold">Feedback</h3>
          <Feedback text={v.feedback} />
        </section>
      ) : null}
      {v.supplied.length || v.studentNote ? (
        <section className="flex flex-col gap-1.5" aria-label="Supplied by the student">
          <h3 className="text-sm font-semibold">Supplied by the student</h3>
          {v.supplied.length ? <FactList facts={v.supplied.map((f) => [f.label, f.value] as [string, React.ReactNode])} /> : null}
          {v.studentNote ? (
            <blockquote className="whitespace-pre-line border-s-2 border-border ps-3 text-sm text-foreground" data-user-content data-student-note>
              <span className="sr-only">Student note: </span>
              {v.studentNote}
            </blockquote>
          ) : null}
        </section>
      ) : null}
      {v.reviewNote ? <FactList facts={[["Review note", <span key="n" data-user-content>{v.reviewNote}</span>]]} /> : null}
    </article>
  )
}

export function EvaluationSheet({ views, title, onClose }: { views: EvaluationView[] | null; title?: string; onClose: () => void }) {
  const open = !!views && views.length > 0
  const first = views?.[0]
  const heading = title ?? first?.skill ?? "Evaluation"
  const subtitle = open ? (views!.length === 1 ? `${first!.student} · read only` : `${first!.student} · ${views!.length} evaluations, newest first · read only`) : undefined
  return (
    <FloatingSheetPanel open={open} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <FloatingSheetPanelContent contentSlot="lab-evaluation-view" size="md">
        <FloatingSheetPanelToolbar />
        <FloatingSheetPanelHeader title={heading} subtitle={subtitle} />
        <FloatingSheetPanelBody className="flex flex-col gap-6 px-4 pb-4" data-evaluation-sheet>
          {open
            ? views!.map((v, i) => (
                <React.Fragment key={v.id}>
                  {i > 0 ? <hr className="border-border" /> : null}
                  <EvaluationBody v={v} />
                </React.Fragment>
              ))
            : null}
        </FloatingSheetPanelBody>
      </FloatingSheetPanelContent>
    </FloatingSheetPanel>
  )
}
