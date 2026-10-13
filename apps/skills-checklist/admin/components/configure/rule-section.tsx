"use client"

import * as React from "react"
import { Checkbox } from "@exxatdesignux/ui/components/ui/checkbox"
import { Field, FieldDescription, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@exxatdesignux/ui/components/ui/radio-group"
import { r2c } from "@/lib/copy/r2-configure"
import type { QuestionRule, ScoredRule } from "@/lib/engine"
import { useConfigure } from "./context"
import { NumberInput } from "./number-input"
import { describedBy, Errors } from "./section-card"

const q = r2c.step2.question
const sc = r2c.step2.scored

function RadioRow({ id, value, children }: { id: string; value: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <RadioGroupItem id={id} value={value} />
      <FieldLabel htmlFor={id} className="font-normal">
        {children}
      </FieldLabel>
    </div>
  )
}

/**
 * C-3: the qualification rule (SC-05, SC-07), shown inside the model card like the prototype. Three fixed shapes per
 * model, not a free logic builder. The plain-language restatement is the lineage panel's "An evaluation qualifies when" row.
 * Binary and demonstration have no choice to make here: the text says what applies.
 */
export function QualificationBlock() {
  const { cfg } = useConfigure()
  const m = cfg.model
  if (m?.kind === "question") return <QuestionRuleEditor />
  if (m?.kind === "scored") return <ScoredRuleEditor />
  if (m?.kind === "binary") {
    const label = m.qualifyingLabelId ? m.labels[m.qualifyingLabelId].label.trim() : ""
    return (
      <p className="text-sm text-muted-foreground" data-testid="rule-restatement">
        {r2c.step2.binary.qualifiesWhen(label)}
      </p>
    )
  }
  if (m?.kind === "demonstration") return <p className="text-sm text-muted-foreground">{r2c.step2.demonstration.qualifies}</p>
  return null
}

function QuestionRuleEditor() {
  const { cfg, setCfg, visible, touch } = useConfigure()
  const m = cfg.model
  if (m?.kind !== "question") return null
  const total = m.questions.length
  const rule = m.rule
  const errs = visible((p) => p === "model.rule")
  const setRule = (r: QuestionRule) => setCfg((c) => (c.model?.kind === "question" ? { ...c, model: { ...c.model, rule: r } } : c))
  const selected = rule.kind === "subset" ? rule.questionIds : []
  const toggle = (id: string, on: boolean) => setRule({ kind: "subset", questionIds: on ? [...selected, id] : selected.filter((x) => x !== id) })

  return (
    <Field className="border-t border-border pt-4">
      <FieldLabel id="cfg-qrule-label">{q.qualification}</FieldLabel>
      <RadioGroup
        aria-labelledby="cfg-qrule-label"
        value={rule.kind}
        onValueChange={(v) => setRule(v === "all" ? { kind: "all" } : v === "atLeast" ? { kind: "atLeast", n: rule.kind === "atLeast" ? rule.n : 1 } : { kind: "subset", questionIds: rule.kind === "subset" ? rule.questionIds : [] })}
        onBlur={() => touch("rule")}
        className="flex flex-col gap-3"
      >
        <RadioRow id="cfg-rule-all" value="all">
          {q.all}
        </RadioRow>
        <div className="flex flex-wrap items-center gap-2">
          <RadioGroupItem id="cfg-rule-atleast" value="atLeast" />
          <FieldLabel htmlFor="cfg-rule-atleast" className="font-normal">
            {q.atLeastPre}
          </FieldLabel>
          <NumberInput id="cfg-rule-n" aria-label="Number of questions that must be answered Yes" className="w-20" disabled={rule.kind !== "atLeast"} aria-invalid={rule.kind === "atLeast" && errs.length > 0} aria-describedby={describedBy(errs, "cfg-rule")} value={rule.kind === "atLeast" ? rule.n : null} onChange={(n) => setRule({ kind: "atLeast", n: n ?? NaN })} onBlur={() => touch("rule")} />
          <span className="text-sm">{q.atLeastPost(total)}</span>
        </div>
        <RadioRow id="cfg-rule-subset-radio" value="subset">
          {q.subset}
        </RadioRow>
      </RadioGroup>
      <FieldDescription>{q.subsetHelp}</FieldDescription>
      <ul aria-label="Questions that must be answered Yes" className="flex flex-col gap-1.5 pl-6">
        {m.questions.map((x, i) => (
          <li key={x.id} className="flex items-center gap-2">
            <Checkbox id={`cfg-rule-q-${x.id}`} disabled={rule.kind !== "subset"} checked={selected.includes(x.id)} onCheckedChange={(v) => toggle(x.id, v === true)} />
            <FieldLabel htmlFor={`cfg-rule-q-${x.id}`} className="font-normal">
              <span className="mr-2 text-xs font-medium text-muted-foreground">Q{i + 1}</span>
              {x.text.trim() || `Question ${i + 1}`}
            </FieldLabel>
          </li>
        ))}
      </ul>
      <Errors issues={errs} for="cfg-rule" />
    </Field>
  )
}

function ScoredRuleEditor() {
  const { cfg, setCfg, visible, touch } = useConfigure()
  const m = cfg.model
  if (m?.kind !== "scored") return null
  const rule = m.rule
  const errs = visible((p) => p === "model.rule")
  const setRule = (r: ScoredRule) => setCfg((c) => (c.model?.kind === "scored" ? { ...c, model: { ...c.model, rule: r } } : c))
  const kinds: { value: ScoredRule["kind"]; text: string }[] = [
    { value: "average", text: sc.average },
    { value: "minPerQuestion", text: sc.minPerQuestion },
    { value: "total", text: sc.total },
  ]
  return (
    <Field className="border-t border-border pt-4">
      <FieldLabel id="cfg-srule-title">{sc.qualification}</FieldLabel>
      <FieldLabel id="cfg-srule-label" className="text-xs font-medium text-muted-foreground">
        {sc.calculation}
      </FieldLabel>
      <RadioGroup aria-labelledby="cfg-srule-label" value={rule.kind} onValueChange={(v) => setRule({ kind: v as ScoredRule["kind"], min: rule.min })} onBlur={() => touch("rule")} className="flex flex-col gap-2">
        {kinds.map((k) => (
          <RadioRow key={k.value} id={`cfg-srule-${k.value}`} value={k.value}>
            {k.text}
          </RadioRow>
        ))}
      </RadioGroup>
      <div className="flex flex-col gap-1">
        <FieldLabel htmlFor="cfg-rule-min">{sc.threshold}</FieldLabel>
        <NumberInput id="cfg-rule-min" className="w-24" aria-invalid={errs.length > 0} aria-describedby={describedBy(errs, "cfg-srule")} value={rule.min} onChange={(n) => setRule({ ...rule, min: n ?? NaN })} onBlur={() => touch("rule")} />
      </div>
      <Errors issues={errs} for="cfg-srule" />
    </Field>
  )
}
