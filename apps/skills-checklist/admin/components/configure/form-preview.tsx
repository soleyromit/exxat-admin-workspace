"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@exxatdesignux/ui/components/ui/radio-group"
import { Textarea } from "@exxatdesignux/ui/components/ui/textarea"
import { r2c } from "@/lib/copy/r2-configure"
import type { SubmissionField } from "@/lib/domain/types"
import type { ModelConfig } from "@/lib/engine"
import type { SkillConfigDraft } from "@/lib/store"

function sample(f: SubmissionField): string {
  switch (f.type) {
    case "date":
      return "2026-01-15"
    case "number":
      return "3"
    case "choice":
      return f.options?.find((o) => o.trim()) ?? ""
    case "longText":
      return "Sample text"
    default:
      return "Sample text"
  }
}

/** The evaluation form the program configured, read-only. One schema, two respondents (OD-09 is open). */
export function EvaluationFormPreview({ model, prefix }: { model: ModelConfig | null; prefix: string }) {
  if (!model) return <p className="text-sm text-muted-foreground">Choose how this skill is evaluated to preview the form.</p>
  const yesNo = (q: { id: string; text: string }, i: number) => (
    <fieldset key={q.id} className="flex flex-col gap-1 border-0 p-0" disabled>
      <legend className="text-sm font-medium">{q.text.trim() || `Question ${i + 1}`}</legend>
      <RadioGroup disabled className="flex gap-4" aria-label={q.text.trim() || `Question ${i + 1}`}>
        {["Yes", "No"].map((v) => (
          <div key={v} className="flex items-center gap-2">
            <RadioGroupItem id={`${prefix}-${q.id}-${v}`} value={v} disabled />
            <label htmlFor={`${prefix}-${q.id}-${v}`} className="text-sm">
              {v}
            </label>
          </div>
        ))}
      </RadioGroup>
    </fieldset>
  )
  if (model.kind === "binary") {
    const labels = [model.labels.a.label.trim() || "First outcome label", model.labels.b.label.trim() || "Second outcome label"]
    return (
      <fieldset className="flex flex-col gap-1 border-0 p-0" disabled>
        <legend className="text-sm font-medium">Overall outcome</legend>
        <RadioGroup disabled className="flex flex-col gap-1" aria-label="Overall outcome">
          {labels.map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <RadioGroupItem id={`${prefix}-bin-${i}`} value={String(i)} disabled />
              <label htmlFor={`${prefix}-bin-${i}`} className="text-sm">
                {l}
              </label>
            </div>
          ))}
        </RadioGroup>
      </fieldset>
    )
  }
  if (model.kind === "question") return <div className="flex flex-col gap-3">{model.questions.map(yesNo)}</div>
  if (model.kind === "scored") {
    const range = model.scale ? `${model.scale.min} to ${model.scale.max}` : "scale not set"
    return (
      <div className="flex flex-col gap-3">
        {model.questions.map((q, i) => (
          <div key={q.id} className="flex flex-col gap-1">
            <label htmlFor={`${prefix}-${q.id}`} className="text-sm font-medium">
              {q.text.trim() || `Question ${i + 1}`}
            </label>
            <Input id={`${prefix}-${q.id}`} disabled className="w-40" placeholder={`Score ${range}`} />
          </div>
        ))}
      </div>
    )
  }
  return (
    <fieldset className="flex flex-col gap-1 border-0 p-0" disabled>
      <legend className="text-sm font-medium">Demonstration outcome</legend>
      <RadioGroup disabled className="flex flex-col gap-1" aria-label="Demonstration outcome">
        {model.levels.map((l, i) => (
          <div key={l.id} className="flex items-center gap-2">
            <RadioGroupItem id={`${prefix}-lv-${l.id}`} value={l.id} disabled />
            <label htmlFor={`${prefix}-lv-${l.id}`} className="text-sm">
              {l.label.trim() || `Level ${i + 1}`}
            </label>
          </div>
        ))}
      </RadioGroup>
    </fieldset>
  )
}

function SuppliedFields({ fields }: { fields: SubmissionField[] }) {
  if (fields.length === 0) return <p className="text-sm text-muted-foreground">No fields beyond setting and location.</p>
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
      {fields.map((f, i) => (
        <React.Fragment key={f.id}>
          <dt className="text-muted-foreground">
            {f.label.trim() || `Field ${i + 1}`}
            {f.required ? " (required)" : " (optional)"}
          </dt>
          <dd>{sample(f)}</dd>
        </React.Fragment>
      ))}
    </dl>
  )
}

/**
 * C-8 / SC-19 (prototype card "Form preview"): the student side and the evaluator side of the form together, as two panels,
 * with sample values only. Rendered from the draft, so what the admin sees here is what S-13 and S-16 will show. When
 * self-evaluation is on, the student answers the same form first (OD-09 is open: one schema, two respondents).
 */
export function FormPreview({ cfg }: { cfg: SkillConfigDraft }) {
  const uid = React.useId().replace(/:/g, "")
  const p = r2c.step2.preview
  return (
    <Card size="sm" id="sec-preview" className="scroll-mt-4" aria-labelledby="sec-preview-heading">
      <CardHeader>
        <CardTitle asChild className="text-sm font-semibold">
          <h3 id="sec-preview-heading">{p.title}</h3>
        </CardTitle>
        <CardDescription>{p.body}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <section aria-labelledby={`${uid}-student`} className="flex flex-col gap-3 rounded-lg border border-border p-3">
          <h4 id={`${uid}-student`} className="text-xs font-medium text-muted-foreground">
            {p.studentSupplies}
          </h4>
          <SuppliedFields fields={cfg.submissionFields} />
          <div className="flex flex-col gap-1">
            <label htmlFor={`${uid}-note`} className="text-sm font-medium">
              Student notes
            </label>
            <Textarea id={`${uid}-note`} disabled rows={2} placeholder="One note per submission" />
          </div>
        </section>
        <section aria-labelledby={`${uid}-evaluator`} className="flex flex-col gap-3 rounded-lg border border-border p-3">
          <h4 id={`${uid}-evaluator`} className="text-xs font-medium text-muted-foreground">
            Evaluator form
          </h4>
          {cfg.selfEvaluation ? <p className="text-xs text-muted-foreground">{p.selfEvalLine}</p> : null}
          <EvaluationFormPreview model={cfg.model} prefix={`${uid}-e`} />
          <div className="flex flex-col gap-1">
            <label htmlFor={`${uid}-comment`} className="text-sm font-medium">
              {p.evaluatorComment}
              {cfg.evaluatorComment === "mandatory" ? " *" : ""}
            </label>
            <Textarea id={`${uid}-comment`} disabled rows={2} placeholder="Narrative feedback" />
            {cfg.evaluatorComment === "mandatory" ? <p className="text-xs text-muted-foreground">Cannot be submitted blank.</p> : null}
          </div>
        </section>
        <p className="text-xs text-muted-foreground md:col-span-2">{p.sample}</p>
      </CardContent>
    </Card>
  )
}
