"use client"

import * as React from "react"
import { RadioGroup, RadioGroupItem } from "@exxatdesignux/ui/components/ui/radio-group"
import { r2c } from "@/lib/copy/r2-configure"
import type { ModelKind } from "@/lib/engine"

const KINDS: ModelKind[] = ["binary", "question", "scored", "demonstration"]

/**
 * C-2: the model picker, hand-rolled as the prototype draws it (P-08): a 2 x 2 grid of wide tiles, each with a visible
 * radio dot, the model name and its one-line description. The DS SelectionTileGrid renders square tiles with the label only,
 * so it cannot show the descriptions (and its radio is detached from the tile, docs/ux/10). A DS RadioGroup gives the arrow-key
 * behaviour. NOTHING is selected until the admin chooses: `value` is the empty string, which matches no tile (SC-02).
 * The selected tile also has a ring, so selection never relies on colour alone (WCAG 1.4.1).
 */
export function ModelPicker({ value, onPick }: { value: ModelKind | null; onPick: (kind: ModelKind, moveFocus?: boolean) => void }) {
  // Tracks how the last choice was made: keyboard choices keep focus on the radio group so arrow keys keep working.
  const viaKeyboard = React.useRef(false)
  return (
    <RadioGroup
      aria-label={r2c.step2.model}
      value={value ?? ""}
      onValueChange={(v) => v && onPick(v as ModelKind, !viaKeyboard.current)}
      onKeyDownCapture={(e) => {
        viaKeyboard.current = true
        // Arrow keys select the tile they land on, every time (WAI-ARIA radio group). Radix moves focus on the first press without
        // selecting when nothing is selected yet, so the move is done here, deterministically, and Radix's own handling is skipped.
        const fwd = e.key === "ArrowRight" || e.key === "ArrowDown"
        const back = e.key === "ArrowLeft" || e.key === "ArrowUp"
        if (!fwd && !back) return
        const here = KINDS.findIndex((k) => (e.target as HTMLElement).id === `cfg-model-${k}`)
        if (here < 0) return
        e.preventDefault()
        e.stopPropagation()
        const next = KINDS[(here + (fwd ? 1 : KINDS.length - 1)) % KINDS.length]
        onPick(next, false)
        requestAnimationFrame(() => document.getElementById(`cfg-model-${next}`)?.focus())
      }}
      onPointerDownCapture={() => (viaKeyboard.current = false)}
      className="grid gap-3 sm:grid-cols-2"
    >
      {KINDS.map((k) => {
        const id = `cfg-model-${k}`
        const text = r2c.step2.models[k]
        const checked = value === k
        return (
          <label
            key={k}
            htmlFor={id}
            data-state={checked ? "checked" : "unchecked"}
            className="relative flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50 data-[state=checked]:border-ring data-[state=checked]:bg-muted/40 data-[state=checked]:ring-2 data-[state=checked]:ring-ring"
          >
            <RadioGroupItem id={id} value={k} aria-labelledby={`${id}-title`} aria-describedby={`${id}-body`} className="mt-0.5" />
            <span className="flex min-w-0 flex-col gap-1">
              <span id={`${id}-title`} className="text-sm font-medium text-foreground">
                {text.title}
              </span>
              <span id={`${id}-body`} className="text-xs text-muted-foreground">
                {text.body}
              </span>
            </span>
          </label>
        )
      })}
    </RadioGroup>
  )
}
