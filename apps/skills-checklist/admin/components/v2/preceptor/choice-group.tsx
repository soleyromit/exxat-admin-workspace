"use client"

import * as React from "react"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@exxatdesignux/ui/components/ui/radio-group"

export const TOUCH = "min-h-(--control-height-touch) h-auto whitespace-normal"

/** A radio group drawn as full-width tiles. The first item takes `firstId` so an error link can move focus to the group. */
export function ChoiceGroup({ name, idBase, firstId, options, value, onChange, invalid, describedBy, columns = 1 }: { name: string; idBase: string; firstId: string; options: Array<{ value: string; label: string }>; value: string; onChange: (v: string) => void; invalid?: boolean; describedBy?: string; columns?: 1 | 2 | 3 }) {
  return (
    <RadioGroup aria-label={name} aria-invalid={invalid ? true : undefined} aria-describedby={describedBy} value={value} onValueChange={onChange} className={columns === 1 ? "flex flex-col gap-2" : columns === 2 ? "grid grid-cols-2 gap-2" : "grid gap-2 sm:grid-cols-3"}>
      {options.map((o, i) => {
        const id = i === 0 ? firstId : `${idBase}-${o.value}`
        return (
          <Label key={o.value} htmlFor={id} className={`${TOUCH} flex items-center gap-3 rounded-lg border border-border bg-card px-3 font-normal`}>
            <RadioGroupItem id={id} value={o.value} />
            <span className="text-sm text-foreground">{o.label}</span>
          </Label>
        )
      })}
    </RadioGroup>
  )
}
