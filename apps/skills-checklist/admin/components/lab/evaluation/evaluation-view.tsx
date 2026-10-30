"use client"

/**
 * The one read-only renderer for a recorded evaluation [REQ SH-07, RP-07, AR-03], used by every surface that shows one: the student
 * (Skill detail and Record, through components/lab/student/evaluation-sheet.tsx), the reviewer (Student record A and B, the three
 * Review item variants), the director (Verification detail Evidence) and, through the student record link, the attainment peek.
 *
 * It shows the facts (date, evaluator and role, setting, location, course, source), every response row (each question Yes or No,
 * the score on each question, the level and the evaluator's outcome, with the student's self-rating beside it where one exists),
 * the evaluator's feedback word for word, what the student supplied (program fields, the note, the self-evaluation note) and the
 * review note. Nothing here writes: completed evaluations are immutable [REQ RV-03, RV-05]. Model: lib/lab/evaluation-view.ts.
 *
 * A group check-off has no student submission, so it shows the check-off note and never an empty "supplied" or self section.
 * The only difference between audiences is the possessive: the student reads "What you sent", staff read "Supplied by the student".
 */
import { TYPE } from "@/components/lab/type-scale"
import * as React from "react"
import { FloatingSheetPanel, FloatingSheetPanelBody, FloatingSheetPanelContent, FloatingSheetPanelHeader, FloatingSheetPanelToolbar } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import type { EvaluationView } from "@/lib/lab/evaluation-view"
import { CompareTable, Feedback } from "@/components/lab/reviewer/review-parts"
import { FactList } from "@/components/lab/reviewer/parts"

export type EvaluationAudience = "student" | "staff"

const WORDS: Record<EvaluationAudience, { supplied: string; note: string }> = {
  student: { supplied: "What you sent", note: "Your note: " },
  staff: { supplied: "Supplied by the student", note: "Student note: " },
}

export const NO_FEEDBACK = "No feedback was written."
export const OUTCOME_ONLY = "Only the outcome was recorded for this evaluation."

const QUOTE = "whitespace-pre-line border-s-2 border-border ps-3 text-sm text-foreground"

/**
 * Responses, feedback and what the student supplied: the part of an evaluation the Review item shows beside its own facts and
 * decision. `withSkill` puts the skill name and the overall agreement above the table (a submission with several skills).
 */
export function EvaluationResponses({ v, audience = "staff", withSkill = false }: { v: EvaluationView; audience?: EvaluationAudience; withSkill?: boolean }) {
  const w = WORDS[audience]
  const checkoff = !!v.checkoffNote
  return (
    <div className="flex flex-col gap-3" data-evaluation-responses={v.id}>
      <section className="flex flex-col gap-1.5" aria-label={withSkill ? `Responses, ${v.skill}` : "Responses"}>
        {withSkill ? null : <h3 className={TYPE.group}>Responses</h3>}
        {v.recorded ? <CompareTable c={v.comparison} compact={!withSkill} showNote={false} checkoff={checkoff} /> : (
          <>
            {withSkill ? <h3 className={TYPE.group}>{v.skill}</h3> : null}
            <p className="text-sm text-muted-foreground">{OUTCOME_ONLY}</p>
          </>
        )}
      </section>
      <section className="flex flex-col gap-1.5" aria-label="Feedback" data-evaluation-feedback>
        <h3 className={TYPE.group}>Feedback</h3>
        {v.feedback ? <Feedback text={v.feedback} /> : <p className="text-sm text-muted-foreground">{NO_FEEDBACK}</p>}
      </section>
      {v.supplied.length || v.studentNote || v.selfNote ? (
        <section className="flex flex-col gap-1.5" aria-label={w.supplied} data-evaluation-supplied>
          <h3 className={TYPE.group}>{w.supplied}</h3>
          {v.supplied.length ? <FactList facts={v.supplied.map((f) => [f.label, f.value] as [string, React.ReactNode])} /> : null}
          {v.studentNote ? (
            <blockquote className={QUOTE} data-user-content data-student-note>
              <span className="sr-only">{w.note}</span>
              {v.studentNote}
            </blockquote>
          ) : null}
          {v.selfNote ? (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Self-evaluation note</span>
              <blockquote className={QUOTE} data-user-content data-self-note>{v.selfNote}</blockquote>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}

/**
 * The outcome, with where the record sits only while it is not final (awaiting approval, returned). "Counted" is left out: an
 * evaluation can be recorded and still not count toward the skill (an Unmet, or a rule it does not meet), and the page behind
 * already says whether it counts, so "Unmet, counted" would contradict it.
 */
export const outcomeLine = (v: Pick<EvaluationView, "outcome" | "status">): string => (v.status === "Counted" ? v.outcome : `${v.outcome}, ${v.status.toLowerCase()}`)

/** One evaluation in full: facts, the check-off note when it applies, responses, feedback, what the student supplied, review note. */
export function EvaluationBody({ v, audience = "staff" }: { v: EvaluationView; audience?: EvaluationAudience }) {
  return (
    <article className="flex flex-col gap-4" data-evaluation-view={v.id} aria-label={`${v.skill}, ${v.facts[0]?.value ?? ""}`}>
      <FactList facts={[["Outcome", outcomeLine(v)], ...v.facts.map((f) => [f.label, f.value] as [string, React.ReactNode])]} />
      {v.checkoffNote ? <p className="text-sm text-muted-foreground" data-checkoff-note>{v.checkoffNote}</p> : null}
      <EvaluationResponses v={v} audience={audience} />
      {v.reviewNote ? <FactList facts={[["Review note", <span key="n" data-user-content>{v.reviewNote}</span>]]} /> : null}
    </article>
  )
}

export const READ_ONLY = "read only"

/**
 * The inspector beside the page that opened it (non-modal DS FloatingSheetPanel, so the list behind stays usable): one evaluation,
 * or every evaluation of one skill newest first (the director's Evidence count; the list is as long as the figure).
 */
export function EvaluationSheet({ views, title, subtitle, audience = "staff", contentSlot = "lab-evaluation-view", onClose }: { views: EvaluationView[] | null; title?: string; subtitle?: string; audience?: EvaluationAudience; contentSlot?: string; onClose: () => void }) {
  const open = !!views && views.length > 0
  const first = views?.[0]
  const heading = title ?? first?.skill ?? "Evaluation"
  const sub = subtitle ?? (open ? (views!.length === 1 ? `${first!.student} · ${READ_ONLY}` : `${first!.student} · ${views!.length} evaluations, newest first · ${READ_ONLY}`) : undefined)
  return (
    <FloatingSheetPanel open={open} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <FloatingSheetPanelContent contentSlot={contentSlot} size="md">
        <FloatingSheetPanelToolbar />
        <FloatingSheetPanelHeader title={heading} subtitle={sub} />
        <FloatingSheetPanelBody className="flex flex-col gap-6 px-4 pb-4" data-evaluation-sheet>
          {open
            ? views!.map((v, i) => (
                <React.Fragment key={v.id}>
                  {i > 0 ? <hr className="border-border" /> : null}
                  <EvaluationBody v={v} audience={audience} />
                </React.Fragment>
              ))
            : null}
        </FloatingSheetPanelBody>
      </FloatingSheetPanelContent>
    </FloatingSheetPanel>
  )
}
