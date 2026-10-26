"use client"

/** Lab-only controls for the evaluator screens (excluded from density counts by data-lab-chrome). Not part of the product. */
import { skillNoun, skillNounPlural } from "@/lib/lab/terms"
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@exxatdesignux/ui/components/ui/dropdown-menu"
import { useLabParams } from "@/components/lab/evaluator/use-evaluator"

export interface LabOption {
  key: string
  label: string
}

export const FORM_OPTIONS: LabOption[] = [
  { key: "hint", get label() { return `Rule hint per ${skillNoun()} (pending)` } },
  { key: "fo", label: "Third answer: Feedback only (pending)" },
  { key: "prefill", label: "Corrected: prefill earlier answers (open)" },
  { key: "fb", label: "Program requires feedback" },
  { key: "hold", label: "Program holds for approval" },
]

/**
 * Retired from the page (2026-10-26, lab architecture 03 section 5.3): the demo states, the 7-skill sample and the program
 * settings now live in the lab bar's Scenario menu (lib/lab/screens.json `scenarios`), so the evaluator page shows only
 * the product. Kept as a component for the screens that still render it; it renders nothing unless `inline` is set.
 */
export function EvLabControls({ states, defaultState, showSample = true, options = FORM_OPTIONS, inline = false }: { states: Array<{ id: string; label: string }>; defaultState: string; showSample?: boolean; options?: LabOption[]; inline?: boolean }) {
  if (!inline) return null
  return <InlineControls states={states} defaultState={defaultState} showSample={showSample} options={options} />
}

function InlineControls({ states, defaultState, showSample, options }: { states: Array<{ id: string; label: string }>; defaultState: string; showSample: boolean; options: LabOption[] }) {
  const { get, set } = useLabParams()
  const state = states.some((s) => s.id === get("state")) ? (get("state") as string) : defaultState
  const on = options.filter((o) => get(o.key) === "1").length
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-1.5 md:px-6" data-lab-chrome>
      <span className="text-xs text-muted-foreground">Lab state</span>
      <Select value={state} onValueChange={(v) => set({ state: v === defaultState ? null : v })}>
        <SelectTrigger size="sm" className="w-48" aria-label="Lab state">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {states.map((s) => (
            <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {showSample ? (
        <Select value={get("sample") === "long" ? "long" : "request"} onValueChange={(v) => set({ sample: v === "long" ? "long" : null })}>
          <SelectTrigger size="sm" className="w-48" aria-label="Request sample">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="request">{`Seeded request, 2 ${skillNounPlural()}`}</SelectItem>
            <SelectItem value="long">{`Lab sample, 7 ${skillNounPlural()}`}</SelectItem>
          </SelectContent>
        </Select>
      ) : null}
      {options.length ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="sm">{on ? `Options (${on})` : "Options"}</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72">
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Program settings and pending decisions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {options.map((o) => (
              <DropdownMenuCheckboxItem key={o.key} checked={get(o.key) === "1"} onCheckedChange={(c) => set({ [o.key]: c ? "1" : null })} onSelect={(e) => e.preventDefault()}>
                {o.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  )
}
