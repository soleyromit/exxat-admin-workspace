"use client"

import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Field, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { Textarea } from "@exxatdesignux/ui/components/ui/textarea"
import * as C from "@/lib/copy"
import { r2c } from "@/lib/copy/r2-configure"
import type { FieldType, SubmissionField } from "@/lib/domain/types"
import { nextId } from "./draft"
import { useConfigure } from "./context"
import { describedBy, Errors, Panel } from "./section-card"

const s = C.surface.s09
const t = r2c.step2.student
const TYPES: FieldType[] = ["date", "shortText", "longText", "number", "choice"]

/**
 * C-7 / SC-13: what the student supplies when sending (prototype card "Student submission details (n)"): numbered rows with
 * a label, a type and Required / Optional. Independent of the model and of the evaluator's answers. Setting and location come
 * from the placement and are not entered here (ST-06). OD-04 is OPEN: the fields belong to this skill today; the copy never
 * says they apply to every skill.
 */
export function StudentSection() {
  const { cfg, setCfg, visible, touch } = useConfigure()
  const fields = cfg.submissionFields
  const update = (i: number, patch: Partial<SubmissionField>) => setCfg((c) => ({ ...c, submissionFields: c.submissionFields.map((f, n) => (n === i ? { ...f, ...patch } : f)) }))
  return (
    <Panel
      id="sec-student"
      title={t.title(fields.length)}
      description={t.body}
      action={
        <Button
          id="cfg-add-field"
          onMouseDown={(e) => e.preventDefault()}
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setCfg((c) => ({ ...c, submissionFields: [...c.submissionFields, { id: nextId("fld", c.submissionFields.map((x) => x.id)), label: "", type: "shortText", required: false }] }))}
        >
          <i className="fa-light fa-plus" aria-hidden="true" />
          {t.add}
        </Button>
      }
    >
      <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">{t.note}</p>
      <ul className="flex flex-col gap-3" aria-label="Fields the student supplies">
        {fields.map((f, i) => {
          const labelErr = visible((p) => p === `submissionFields.${i}.label`)
          const optErr = visible((p) => p === `submissionFields.${i}.options`)
          return (
            <li key={f.id} className="flex flex-col gap-2">
              <div className="flex flex-wrap items-end gap-3">
                <span className="pb-2 text-xs text-muted-foreground" aria-hidden="true">
                  {i + 1}
                </span>
                <div className="flex min-w-48 flex-1 flex-col gap-1">
                  <FieldLabel htmlFor={`cfg-field-${i}-label`}>{t.label}</FieldLabel>
                  <Input id={`cfg-field-${i}-label`} value={f.label} aria-invalid={labelErr.length > 0} aria-describedby={describedBy(labelErr, `cfg-field-${i}-label`)} onChange={(e) => update(i, { label: e.target.value })} onBlur={() => touch("student")} />
                </div>
                <div className="flex flex-col gap-1">
                  <FieldLabel htmlFor={`cfg-field-${i}-type`}>{t.type}</FieldLabel>
                  <Select value={f.type} onValueChange={(v) => update(i, { type: v as FieldType, options: v === "choice" ? f.options ?? [] : undefined })}>
                    <SelectTrigger id={`cfg-field-${i}-type`} className="w-40" aria-label="Field type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPES.map((x) => (
                        <SelectItem key={x} value={x}>
                          {s.studentFields.types[x]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button id={`cfg-field-${i}-required`} type="button" variant="outline" size="sm" aria-pressed={f.required} onClick={() => update(i, { required: !f.required })}>
                  {f.required ? t.required : t.optional}
                </Button>
                <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove field ${i + 1}`} onClick={() => setCfg((c) => ({ ...c, submissionFields: c.submissionFields.filter((_, n) => n !== i) }))}>
                  <i className="fa-light fa-trash-can" aria-hidden="true" />
                </Button>
              </div>
              <Errors issues={labelErr} for={`cfg-field-${i}-label`} />
              {f.type === "choice" ? (
                <Field>
                  <FieldLabel htmlFor={`cfg-field-${i}-options`}>Options, one per line</FieldLabel>
                  <Textarea id={`cfg-field-${i}-options`} rows={3} aria-invalid={optErr.length > 0} aria-describedby={describedBy(optErr, `cfg-field-${i}-options`)} value={(f.options ?? []).join("\n")} onChange={(e) => update(i, { options: e.target.value.split("\n") })} onBlur={() => touch("student")} />
                  <Errors issues={optErr} for={`cfg-field-${i}-options`} />
                </Field>
              ) : null}
            </li>
          )
        })}
      </ul>
      {fields.length === 0 ? <p className="text-sm text-muted-foreground">{t.none}</p> : null}
    </Panel>
  )
}
