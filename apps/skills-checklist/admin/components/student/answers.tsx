"use client"

import * as React from "react"
import type { ModelConfig, Responses } from "@/lib/engine"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@exxatdesignux/ui/components/ui/radio-group"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { FieldError } from "@exxatdesignux/ui/components/ui/field"
import type { RecordedDetail } from "@/lib/store"

/**
 * The student's self-evaluation form (ST-11, EV-04). One form schema for both respondents (OD-09 seam): the same
 * questions, labels, levels and scale the evaluator will see. Single-choice controls are RadioGroup (DEC-007).
 * Targets are at least 44px on student surfaces.
 */
export function SelfEvaluationForm({ idPrefix, model, value, onChange, errors }: { idPrefix: string; model: ModelConfig; value: Responses | null; onChange: (r: Responses | null) => void; errors?: boolean }) {
  switch (model.kind) {
    case "binary": {
      const v = value && value.kind === "binary" ? value.labelId : ""
      return (
        <Choice
          legend="Outcome"
          name={`${idPrefix}-binary`}
          value={v}
          onChange={(x) => onChange({ kind: "binary", labelId: x as "a" | "b" })}
          options={[
            { value: "a", label: model.labels.a.label },
            { value: "b", label: model.labels.b.label },
          ]}
          error={errors && !v}
        />
      )
    }
    case "demonstration": {
      const v = value && value.kind === "demonstration" ? value.levelId : ""
      return <Choice legend="Demonstration outcome" name={`${idPrefix}-level`} value={v} onChange={(x) => onChange({ kind: "demonstration", levelId: x })} options={model.levels.map((l) => ({ value: l.id, label: l.label }))} error={errors && !v} />
    }
    case "question": {
      const answers = value && value.kind === "question" ? value.answers : {}
      return (
        <div className="flex flex-col gap-3">
          {model.questions.map((q) => (
            <Choice
              key={q.id}
              legend={q.text}
              name={`${idPrefix}-${q.id}`}
              value={answers[q.id] === undefined ? "" : answers[q.id] ? "yes" : "no"}
              onChange={(x) => onChange({ kind: "question", answers: { ...answers, [q.id]: x === "yes" } })}
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ]}
              error={errors && answers[q.id] === undefined}
            />
          ))}
        </div>
      )
    }
    case "scored": {
      const scores = value && value.kind === "scored" ? value.scores : {}
      const scale = model.scale
      const points = scale && scale.step > 0 ? Array.from({ length: Math.floor((scale.max - scale.min) / scale.step) + 1 }, (_, i) => scale.min + i * scale.step) : []
      return (
        <div className="flex flex-col gap-3">
          {model.questions.map((q) =>
            points.length > 0 && points.length <= 10 ? (
              <Choice
                key={q.id}
                legend={q.text}
                name={`${idPrefix}-${q.id}`}
                value={scores[q.id] === undefined ? "" : String(scores[q.id])}
                onChange={(x) => onChange({ kind: "scored", scores: { ...scores, [q.id]: Number(x) } })}
                options={points.map((p) => ({ value: String(p), label: String(p) }))}
                error={errors && scores[q.id] === undefined}
                inline
              />
            ) : (
              <div key={q.id} className="flex flex-col gap-1.5">
                <Label htmlFor={`${idPrefix}-${q.id}`}>{q.text}</Label>
                <Input
                  id={`${idPrefix}-${q.id}`}
                  type="number"
                  inputMode="decimal"
                  min={scale?.min}
                  max={scale?.max}
                  step={scale?.step}
                  className="min-h-11"
                  value={scores[q.id] ?? ""}
                  onChange={(e) => {
                    const next = { ...scores }
                    if (e.target.value === "") delete next[q.id]
                    else next[q.id] = Number(e.target.value)
                    onChange({ kind: "scored", scores: next })
                  }}
                />
              </div>
            ),
          )}
        </div>
      )
    }
  }
}

function Choice({ legend, name, value, onChange, options, error, inline }: { legend: string; name: string; value: string; onChange: (v: string) => void; options: Array<{ value: string; label: string }>; error?: boolean; inline?: boolean }) {
  const errId = `${name}-err`
  return (
    <fieldset className="flex flex-col gap-1.5" aria-describedby={error ? errId : undefined}>
      <legend className="text-sm font-medium text-foreground">{legend}</legend>
      <RadioGroup value={value} onValueChange={onChange} name={name} aria-invalid={error || undefined} className={inline ? "flex flex-row flex-wrap gap-2" : "flex flex-col gap-1"}>
        {options.map((o) => {
          const id = `${name}-${o.value}`
          return (
            <div key={o.value} className="flex min-h-11 items-center gap-2">
              <RadioGroupItem id={id} value={o.value} />
              <Label htmlFor={id} className="min-h-11 flex-1 cursor-pointer content-center text-sm font-normal">
                {o.label}
              </Label>
            </div>
          )
        })}
      </RadioGroup>
      {error ? <FieldError id={errId}>Choose an answer.</FieldError> : null}
    </fieldset>
  )
}

/** Read-only recorded answers (SH-07, P-11): values as text with programmatic labels, never disabled inputs. */
export function RecordedAnswers({ detail }: { detail: RecordedDetail }) {
  switch (detail.kind) {
    case "binary":
      return <dl><Row k="Outcome" v={detail.label} /></dl>
    case "demonstration":
      return <dl><Row k="Demonstration outcome" v={detail.level} /></dl>
    case "question":
      return (
        <dl className="flex flex-col gap-1">
          {detail.items.map((i) => (
            <Row key={i.id} k={i.text} v={i.yes ? "Yes" : "No"} />
          ))}
        </dl>
      )
    case "scored":
      return (
        <dl className="flex flex-col gap-1">
          {detail.items.map((i) => (
            <Row key={i.id} k={i.text} v={String(i.score ?? "Not scored")} />
          ))}
          <Row k="Average score" v={detail.average.toFixed(1)} />
        </dl>
      )
  }
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 text-sm">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-medium text-foreground">{v}</dd>
    </div>
  )
}
