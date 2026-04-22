"use client"
import * as React from "react"
import { cn } from "../../lib/utils"

interface ToggleSwitchProps {
  checked: boolean
  onChange: (value: boolean) => void
  id?: string
}

export function ToggleSwitch({ checked, onChange, id }: ToggleSwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-input transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        checked ? "bg-primary" : "bg-input"
      )}
    >
      <span className={cn(
        "pointer-events-none inline-block size-4 rounded-full bg-primary-foreground shadow-sm transition-transform",
        checked ? "translate-x-4" : "translate-x-0"
      )} />
    </button>
  )
}
