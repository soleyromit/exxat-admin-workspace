import * as React from "react"
import type { ModelConfig, Responses } from "@/lib/engine"
import { evaluatorCopy as c } from "@/lib/copy"

/** The student's self-evaluation as read-only text (EV-04). Text with real labels, never disabled inputs. */
export function describeSelfEvaluation(model: ModelConfig, r: Responses): Array<{ label: string; value: string }> {
  if (model.kind !== r.kind) return []
  switch (model.kind) {
    case "binary": {
      const x = r as Extract<Responses, { kind: "binary" }>
      return [{ label: c.outcomeLegend, value: model.labels[x.labelId].label }]
    }
    case "demonstration": {
      const x = r as Extract<Responses, { kind: "demonstration" }>
      return [{ label: c.levelLegend, value: model.levels.find((l) => l.id === x.levelId)?.label ?? "" }]
    }
    case "question": {
      const x = r as Extract<Responses, { kind: "question" }>
      return model.questions.map((q) => ({ label: q.text, value: x.answers[q.id] === true ? c.yes : c.no }))
    }
    case "scored": {
      const x = r as Extract<Responses, { kind: "scored" }>
      return model.questions.map((q) => ({ label: q.text, value: String(x.scores[q.id] ?? "") }))
    }
  }
}

/**
 * What the student supplied, their single note (ST-12, kept apart from the evaluator's comment) and the self-evaluation
 * where the skill is configured for one (EV-04, SC-15). Read-only context shown before the answer controls.
 */
export function StudentContext({
  idPrefix,
  values,
  note,
  model,
  selfEvaluation,
}: {
  idPrefix: string
  values: Array<{ label: string; value: string | number }>
  note: string
  model: ModelConfig
  selfEvaluation: Responses | null
}) {
  const self = selfEvaluation ? describeSelfEvaluation(model, selfEvaluation) : []
  const hasAny = values.length > 0 || !!note.trim() || self.length > 0
  return (
    <div role="group" aria-labelledby={`${idPrefix}-ctx`} className="flex flex-col gap-3 rounded-md bg-muted/40 p-3">
      <h3 id={`${idPrefix}-ctx`} className="text-sm font-semibold text-foreground">
        {c.detailsHeading}
      </h3>
      {!hasAny ? <p className="text-sm text-muted-foreground">{c.noDetails}</p> : null}
      {values.length > 0 ? (
        <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-[max-content_1fr]">
          {values.map((v) => (
            <React.Fragment key={v.label}>
              <dt className="text-muted-foreground">{v.label}</dt>
              <dd className="text-foreground">{String(v.value)}</dd>
            </React.Fragment>
          ))}
        </dl>
      ) : null}
      {note.trim() ? (
        <div className="flex flex-col gap-0.5" data-testid="student-note">
          <p className="text-sm text-muted-foreground">{c.studentNote}</p>
          <p className="text-sm text-foreground">{note}</p>
        </div>
      ) : null}
      {self.length > 0 ? (
        <div className="flex flex-col gap-1" data-testid="self-evaluation">
          <p className="text-sm font-medium text-foreground">{c.selfEvalHeading}</p>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-[1fr_max-content]">
            {self.map((s) => (
              <React.Fragment key={s.label}>
                <dt className="text-muted-foreground">{s.label}</dt>
                <dd className="text-foreground">{s.value}</dd>
              </React.Fragment>
            ))}
          </dl>
        </div>
      ) : null}
    </div>
  )
}
