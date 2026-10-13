"use client"

import * as React from "react"
import { RadioGroup, RadioGroupItem } from "@exxatdesignux/ui/components/ui/radio-group"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import type { ModelConfig } from "@/lib/engine"
import { evaluatorCopy as c } from "@/lib/copy"
import type { AnswerDraft } from "./form-state"

/**
 * EvaluatorAnswerGroup: the answer controls for one skill, rendered from the program's model (EV-03: answers only,
 * no control changes labels, questions, scale, levels or rules). Single choice is a RadioGroup (DEC-007), with rows of at
 * least 44px. The label that qualifies is never shown (SC-03): both labels look identical.
 */
export function EvaluatorAnswerGroup({
  idPrefix,
  model,
  draft,
  onChange,
  invalidKeys,
}: {
  idPrefix: string
  model: ModelConfig
  draft: AnswerDraft
  onChange: (next: AnswerDraft) => void
  /** Keys of unanswered controls to mark invalid (only passed after a submit attempt). */
  invalidKeys: string[]
}) {
  const invalid = new Set(invalidKeys)
  switch (model.kind) {
    case "binary":
      return (
        <Choice
          id={`${idPrefix}-binary`}
          legend={c.outcomeLegend}
          value={draft.labelId ?? ""}
          invalid={invalid.has("labelId") || invalid.has("responses")}
          onChange={(v) => onChange({ ...draft, labelId: v as "a" | "b" })}
          options={[
            { value: "a", label: model.labels.a.label },
            { value: "b", label: model.labels.b.label },
          ]}
        />
      )
    case "demonstration":
      return (
        <Choice
          id={`${idPrefix}-level`}
          legend={c.levelLegend}
          value={draft.levelId ?? ""}
          invalid={invalid.has("levelId") || invalid.has("responses")}
          onChange={(v) => onChange({ ...draft, levelId: v })}
          options={model.levels.map((l) => ({ value: l.id, label: l.label }))}
        />
      )
    case "question":
      return (
        <div className="flex flex-col gap-4">
          {model.questions.map((q) => {
            const v = draft.answers[q.id]
            return (
              <Choice
                key={q.id}
                id={`${idPrefix}-${q.id}`}
                legend={q.text}
                inline
                value={v === true ? "yes" : v === false ? "no" : ""}
                invalid={invalid.has(`answers.${q.id}`)}
                onChange={(x) => onChange({ ...draft, answers: { ...draft.answers, [q.id]: x === "yes" } })}
                options={[
                  { value: "yes", label: c.yes },
                  { value: "no", label: c.no },
                ]}
              />
            )
          })}
        </div>
      )
    case "scored": {
      const scale = model.scale
      const values: number[] = []
      if (scale) for (let s = scale.min; s <= scale.max + 1e-9; s += scale.step || 1) values.push(Math.round(s * 1000) / 1000)
      return (
        <div className="flex flex-col gap-4">
          {scale ? <p className="text-sm text-muted-foreground">{c.scoreHelper(scale.min, scale.max)}</p> : null}
          {model.questions.map((q) => {
            const v = draft.scores[q.id]
            return (
              <Choice
                key={q.id}
                id={`${idPrefix}-${q.id}`}
                legend={q.text}
                inline
                value={typeof v === "number" ? String(v) : ""}
                invalid={invalid.has(`scores.${q.id}`)}
                onChange={(x) => onChange({ ...draft, scores: { ...draft.scores, [q.id]: Number(x) } })}
                options={values.map((n) => ({ value: String(n), label: String(n) }))}
              />
            )
          })}
        </div>
      )
    }
  }
}

function Choice({
  id,
  legend,
  value,
  onChange,
  options,
  invalid,
  inline,
}: {
  id: string
  legend: string
  value: string
  onChange: (v: string) => void
  options: Array<{ value: string; label: string }>
  invalid: boolean
  inline?: boolean
}) {
  return (
    <fieldset id={id} className="flex min-w-0 flex-col gap-2" data-invalid={invalid || undefined}>
      <legend className="text-sm font-medium text-foreground">{legend}</legend>
      <RadioGroup
        value={value}
        onValueChange={onChange}
        name={id}
        aria-invalid={invalid || undefined}
        itemSize="lg"
        className={inline ? "flex flex-row flex-wrap gap-2" : "flex flex-col gap-2"}
      >
        {options.map((o) => {
          const rid = `${id}-${o.value}`
          return (
            <div key={o.value} className={`flex min-h-11 items-center gap-3 rounded-md border border-border px-3 ${inline ? "min-w-20" : "w-full"}`}>
              <RadioGroupItem id={rid} value={o.value} />
              <Label htmlFor={rid} className="min-h-11 flex-1 cursor-pointer content-center text-sm font-normal">
                {o.label}
              </Label>
            </div>
          )
        })}
      </RadioGroup>
    </fieldset>
  )
}
