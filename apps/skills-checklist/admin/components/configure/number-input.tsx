"use client"

import * as React from "react"
import { Input } from "@exxatdesignux/ui/components/ui/input"

/**
 * A whole-number or decimal input that reports `null` when empty. The draft keeps numbers, never strings, so the engine
 * validators see exactly what would be saved (a blank is not 0).
 */
export function NumberInput({
  value,
  onChange,
  ...rest
}: Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> & { value: number | null | undefined; onChange: (next: number | null) => void }) {
  const shown = value === null || value === undefined || Number.isNaN(value) ? "" : String(value)
  return (
    <Input
      {...rest}
      type="number"
      inputMode="decimal"
      value={shown}
      onChange={(e) => {
        const raw = e.target.value
        onChange(raw === "" ? null : Number(raw))
      }}
    />
  )
}
