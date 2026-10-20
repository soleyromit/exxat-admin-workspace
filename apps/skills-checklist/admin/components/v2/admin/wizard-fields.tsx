"use client"

import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Checkbox } from "@exxatdesignux/ui/components/ui/checkbox"
import { Field, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet } from "@exxatdesignux/ui/components/ui/field"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Label } from "@exxatdesignux/ui/components/ui/label"

export const errId = (id: string) => `${id}-error`
const describedBy = (id: string, errors: string[], hint?: string) => [errors.length ? errId(id) : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined

export function FieldErrors({ id, errors }: { id: string; errors: string[] }) {
  return errors.length ? <FieldError id={errId(id)} errors={errors.map((message) => ({ message }))} /> : null
}

export function TextField({ id, label, hint, value, onChange, errors = [], className }: { id: string; label: string; hint?: string; value: string; onChange: (v: string) => void; errors?: string[]; className?: string }) {
  return (
    <Field className={className}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input id={id} value={value} aria-invalid={errors.length ? true : undefined} aria-describedby={describedBy(id, errors, hint)} onChange={(e) => onChange(e.target.value)} />
      {hint ? <FieldDescription id={`${id}-hint`}>{hint}</FieldDescription> : null}
      <FieldErrors id={id} errors={errors} />
    </Field>
  )
}

/** A whole-number field. An empty box is `null`, never 0, so validation sees exactly what would be saved. */
export function NumberField({ id, label, hint, value, onChange, errors = [], min, max, className }: { id: string; label: string; hint?: string; value: number | null | undefined; onChange: (v: number | null) => void; errors?: string[]; min?: number; max?: number; className?: string }) {
  return (
    <Field className={className ?? "w-48"}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value === null || value === undefined || Number.isNaN(value) ? "" : String(value)}
        aria-invalid={errors.length ? true : undefined}
        aria-describedby={describedBy(id, errors, hint)}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
      />
      {hint ? <FieldDescription id={`${id}-hint`}>{hint}</FieldDescription> : null}
      <FieldErrors id={id} errors={errors} />
    </Field>
  )
}

export interface CheckOption {
  value: string
  label: string
  hint?: string
}

/** A group of checkboxes inside a fieldset. The fieldset is the focus target for an issue link, so it takes tabIndex -1. */
export function CheckGroup({ id, legend, hint, options, value, onChange, errors = [] }: { id: string; legend: string; hint?: string; options: CheckOption[]; value: string[]; onChange: (v: string[]) => void; errors?: string[] }) {
  return (
    <FieldSet id={id} tabIndex={-1} aria-describedby={describedBy(id, errors, hint)} className="rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
      <FieldLegend variant="label">{legend}</FieldLegend>
      {hint ? <FieldDescription id={`${id}-hint`}>{hint}</FieldDescription> : null}
      <div className="flex flex-col gap-2">
        {options.length === 0 ? <p className="text-sm text-muted-foreground">Nothing to choose from yet.</p> : null}
        {options.map((o, i) => {
          const cid = `${id}-opt-${i}`
          const on = value.includes(o.value)
          return (
            <div key={o.value} className="flex items-start gap-2">
              <Checkbox id={cid} checked={on} onCheckedChange={(v) => onChange(v === true ? [...value, o.value] : value.filter((x) => x !== o.value))} className="mt-0.5" />
              <Label htmlFor={cid} className="flex flex-col items-start gap-0.5 text-start font-normal">
                <span>{o.label}</span>
                {o.hint ? <span className="text-xs text-muted-foreground">{o.hint}</span> : null}
              </Label>
            </div>
          )
        })}
      </div>
      <FieldErrors id={id} errors={errors} />
    </FieldSet>
  )
}

/**
 * An ordered list of text rows with add, remove and (optionally) reorder. Composed from DS Input and Button because the DS has no
 * list editor. Row i has id `${idPrefix}-${i}` and the add button has id `${addId}`, so issue links can focus them.
 */
export function ListEditor({
  idPrefix,
  addId,
  legend,
  noun,
  items,
  onChange,
  errorsFor,
  reorder = false,
  addLabel,
  hint,
}: {
  idPrefix: string
  addId: string
  legend: string
  noun: string
  items: string[]
  onChange: (items: string[]) => void
  errorsFor: (field: string) => string[]
  reorder?: boolean
  addLabel: string
  hint?: string
}) {
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return
    const next = [...items]
    const [x] = next.splice(from, 1)
    next.splice(to, 0, x)
    onChange(next)
  }
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium text-foreground">{legend}</legend>
      {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
      <ol className="flex flex-col gap-2" aria-label={legend}>
        {items.map((text, i) => {
          const id = `${idPrefix}-${i}`
          const errors = errorsFor(id)
          return (
            <li key={i} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="w-6 shrink-0 text-sm tabular-nums text-muted-foreground" aria-hidden="true">
                  {i + 1}
                </span>
                <Input id={id} aria-label={`${noun} ${i + 1}`} value={text} aria-invalid={errors.length ? true : undefined} aria-describedby={errors.length ? errId(id) : undefined} onChange={(e) => onChange(items.map((t, j) => (j === i ? e.target.value : t)))} />
                {reorder ? (
                  <>
                    <Button type="button" variant="ghost" size="icon-sm" disabled={i === 0} aria-label={`Move ${noun.toLowerCase()} ${i + 1} up`} onClick={() => move(i, i - 1)}>
                      <i className="fa-light fa-chevron-up" aria-hidden="true" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-sm" disabled={i === items.length - 1} aria-label={`Move ${noun.toLowerCase()} ${i + 1} down`} onClick={() => move(i, i + 1)}>
                      <i className="fa-light fa-chevron-down" aria-hidden="true" />
                    </Button>
                  </>
                ) : null}
                <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove ${noun.toLowerCase()} ${i + 1}`} onClick={() => onChange(items.filter((_, j) => j !== i))}>
                  <i className="fa-light fa-trash-can" aria-hidden="true" />
                </Button>
              </div>
              <FieldErrors id={id} errors={errors} />
            </li>
          )
        })}
      </ol>
      <div className="flex flex-col gap-1">
        <div>
          <Button id={addId} type="button" variant="outline" size="sm" onClick={() => onChange([...items, ""])}>
            {addLabel}
          </Button>
        </div>
        <FieldErrors id={addId} errors={errorsFor(addId)} />
      </div>
    </fieldset>
  )
}
