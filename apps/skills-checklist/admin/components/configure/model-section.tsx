"use client"

import * as React from "react"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { r2c } from "@/lib/copy/r2-configure"
import type { ModelKind } from "@/lib/engine"
import { setBinaryLabel, setQualifyingLabel } from "./draft"
import { useConfigure } from "./context"
import { AddLevelButton, LevelRows } from "./level-editor"
import { ModelPicker } from "./model-picker"
import { NumberInput } from "./number-input"
import { AddQuestionButton, QuestionRows } from "./question-editor"
import { QualificationBlock } from "./rule-section"
import { describedBy, Errors, Panel } from "./section-card"

const t = r2c.step2

/**
 * Step 2, top: the model tiles, the single-outcome note and the card that defines what the chosen model records
 * (SC-02..SC-04, SC-07, SC-08), including its qualification rule. Changing the model is handled by the editor (confirm and
 * rebuild report); this section only reports the pick.
 */
export function ModelSection({ onPickModel }: { onPickModel: (kind: ModelKind, moveFocus?: boolean) => void }) {
  const { cfg, visible } = useConfigure()
  const m = cfg.model
  const modelErrors = visible((p) => p === "model")
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p id="cfg-model-heading" className="text-sm font-medium text-foreground">
          {t.model}
        </p>
        <ModelPicker value={m?.kind ?? null} onPick={onPickModel} />
        <Errors issues={modelErrors} for="cfg-model" />
      </div>
      {m?.kind === "binary" || m?.kind === "demonstration" ? <LocalBanner variant="warning">{t.singleOutcomeNote}</LocalBanner> : null}
      {m?.kind === "binary" ? <BinaryPanel /> : null}
      {m?.kind === "question" ? <QuestionPanel /> : null}
      {m?.kind === "scored" ? <ScoredPanel /> : null}
      {m?.kind === "demonstration" ? <DemonstrationPanel /> : null}
    </div>
  )
}

function QuestionPanel() {
  const { cfg } = useConfigure()
  const n = cfg.model?.kind === "question" ? cfg.model.questions.length : 0
  return (
    <Panel id="sec-model" title={t.question.title(n)} description={t.question.body} action={<AddQuestionButton label={t.question.add} />}>
      <QuestionRows />
      <QualificationBlock />
    </Panel>
  )
}

function ScoredPanel() {
  const { cfg, setCfg, visible, touch } = useConfigure()
  const m = cfg.model
  if (m?.kind !== "scored") return null
  const scaleErrs = visible((p) => p === "model.scale")
  const points = m.scale && m.scale.step ? Math.floor((m.scale.max - m.scale.min) / m.scale.step) + 1 : null
  return (
    <Panel id="sec-model" title={t.scored.title(m.questions.length)} description={t.scored.body} action={<AddQuestionButton label={t.scored.add} />}>
      <QuestionRows />
      <Field className="border-t border-border pt-4">
        <FieldLabel id="cfg-scale-label">{t.scored.scale}</FieldLabel>
        <div role="group" aria-labelledby="cfg-scale-label" className="flex flex-wrap items-end gap-3">
          {(["min", "max", "step"] as const).map((k) => (
            <div key={k} className="flex flex-col gap-1">
              <FieldLabel htmlFor={`cfg-scale-${k}`}>{k === "min" ? "Lowest score" : k === "max" ? "Highest score" : "Step"}</FieldLabel>
              <NumberInput
                id={`cfg-scale-${k}`}
                className="w-28"
                aria-invalid={k === "min" && scaleErrs.length > 0}
                aria-describedby={k === "min" ? describedBy(scaleErrs, "cfg-scale") : undefined}
                value={m.scale ? m.scale[k] : null}
                onChange={(n) => setCfg((c) => (c.model?.kind === "scored" ? { ...c, model: { ...c.model, scale: { min: c.model.scale?.min ?? NaN, max: c.model.scale?.max ?? NaN, step: c.model.scale?.step ?? 1, [k]: n ?? NaN } } } : c))}
                onBlur={() => touch("model")}
              />
            </div>
          ))}
        </div>
        <Errors issues={scaleErrs} for="cfg-scale" />
        <FieldDescription>
          {points !== null && Number.isFinite(points) && points > 0 ? `${t.scored.scaleValue(points)}. ` : ""}
          {t.scored.scaleHelp}
        </FieldDescription>
      </Field>
      <QualificationBlock />
    </Panel>
  )
}

function DemonstrationPanel() {
  const { cfg } = useConfigure()
  const n = cfg.model?.kind === "demonstration" ? cfg.model.levels.length : 0
  return (
    <Panel id="sec-model" title={t.demonstration.title(n)} description={t.demonstration.body} action={<AddLevelButton />}>
      <LevelRows />
      <QualificationBlock />
    </Panel>
  )
}

/**
 * Binary: the first input is always the QUALIFYING outcome and the second the NON-QUALIFYING one (prototype P-08). The model
 * stores two labels and which one qualifies; the first input edits the qualifying label, so choosing a pair of labels is the
 * only decision (SC-03: both required and different).
 */
function BinaryPanel() {
  const { cfg, setCfg, visible, touch } = useConfigure()
  const m = cfg.model
  // The first field is by definition the qualifying one: record that once, so the engine always has an explicit choice (SC-03).
  React.useEffect(() => {
    if (m?.kind === "binary" && !m.qualifyingLabelId) setCfg((c) => setQualifyingLabel(c, "a"))
  }, [m, setCfg])
  if (m?.kind !== "binary") return null
  const qual: "a" | "b" = m.qualifyingLabelId ?? "a"
  const other: "a" | "b" = qual === "a" ? "b" : "a"
  const b = t.binary
  const bothErrs = visible((p) => p === "model.labels" || p === "model.labels.a" || p === "model.labels.b")
  const pair = (first: string, second: string) => setCfg((c) => setBinaryLabel(setBinaryLabel(c, qual, first), other, second))
  return (
    <Panel id="sec-model" title={b.title} description={b.body}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="cfg-label-a">{b.qualifying} *</FieldLabel>
          <Input id="cfg-label-a" value={m.labels[qual].label} placeholder={b.qualifyingPlaceholder} aria-required="true" aria-invalid={bothErrs.length > 0} aria-describedby={describedBy(bothErrs, "cfg-label-a")} onChange={(e) => setCfg((c) => setBinaryLabel(c, qual, e.target.value))} onBlur={() => touch("model")} />
          <FieldDescription>{b.qualifyingHelp}</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="cfg-label-b">{b.nonQualifying} *</FieldLabel>
          <Input id="cfg-label-b" value={m.labels[other].label} placeholder={b.nonQualifyingPlaceholder} aria-required="true" aria-invalid={bothErrs.length > 0} aria-describedby={describedBy(bothErrs, "cfg-label-a")} onChange={(e) => setCfg((c) => setBinaryLabel(c, other, e.target.value))} onBlur={() => touch("model")} />
          <FieldDescription>{b.nonQualifyingHelp}</FieldDescription>
        </Field>
      </div>
      <Errors issues={bothErrs} for="cfg-label-a" />
      {/* onMouseDown keeps focus in the label field: blurring it shows the required error, which moves these chips before the click lands (found in the real browser). */}
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={b.alternatives}>
        <span className="text-xs text-muted-foreground">{b.alternatives}</span>
        {b.alternativePairs.map(([x, y]) => (
          <Button key={x} type="button" variant="outline" size="sm" onMouseDown={(e) => e.preventDefault()} onClick={() => pair(x, y)}>
            {x} / {y}
          </Button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{b.renameNote}</p>
      <QualificationBlock />
    </Panel>
  )
}
