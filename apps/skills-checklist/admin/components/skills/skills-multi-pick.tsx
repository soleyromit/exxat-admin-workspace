"use client"

import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Checkbox } from "@exxatdesignux/ui/components/ui/checkbox"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@exxatdesignux/ui/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@exxatdesignux/ui/components/ui/popover"

/**
 * Multi-select built from Popover + Command + Checkbox. The DS has no MultiSelect or Combobox (the sanctioned gap,
 * docs/ux/10). Used for tags (S-09, SL-04), the named question subset (SC-05) and settings (SC-11).
 * Inactive options are not assignable, but one already selected stays visible, flagged inactive (SL-06).
 */
export interface MultiPickOption {
  value: string
  label: string
  /** SL-06: an inactive option cannot be newly selected. */
  inactive?: boolean
  note?: string
}

export interface SkillsMultiPickProps {
  options: MultiPickOption[]
  value: string[]
  onChange: (next: string[]) => void
  /** Accessible name of the control (also the trigger text when nothing is selected). */
  label: string
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  id?: string
  /** Called with a typed query that matches nothing: the inline "Create ..." affordance (SL-05). */
  onCreate?: (query: string) => void
  createLabel?: (query: string) => string
}

export function SkillsMultiPick({ options, value, onChange, label, placeholder, searchPlaceholder = "Search", emptyText = "No matches.", disabled, id, onCreate, createLabel }: SkillsMultiPickProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const selected = new Set(value)
  const toggle = (v: string) => {
    const next = new Set(selected)
    if (next.has(v)) next.delete(v)
    else next.add(v)
    onChange(options.map((o) => o.value).filter((x) => next.has(x)).concat(value.filter((x) => !options.some((o) => o.value === x) && next.has(x))))
  }
  const summary = value.length === 0 ? (placeholder ?? label) : options.filter((o) => selected.has(o.value)).map((o) => o.label).join(", ")
  const typed = query.trim()
  const canCreate = !!onCreate && typed.length > 0 && !options.some((o) => o.label.toLowerCase() === typed.toLowerCase())

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button id={id} type="button" variant="outline" size="default" disabled={disabled} aria-haspopup="listbox" aria-expanded={open} aria-label={value.length ? `${summary}. ${label}, ${value.length} selected` : placeholder ? `${placeholder}. ${label}` : label} className="w-full justify-between text-left font-normal">
          <span className="truncate">{summary}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) min-w-64 p-0">
        <Command>
          <CommandInput value={query} onValueChange={setQuery} placeholder={searchPlaceholder} aria-label={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((o) => {
                const checked = selected.has(o.value)
                const blocked = !!o.inactive && !checked
                return (
                  <CommandItem key={o.value} value={o.label} disabled={blocked} onSelect={() => !blocked && toggle(o.value)} className="gap-2">
                    <Checkbox checked={checked} tabIndex={-1} aria-hidden="true" className="pointer-events-none" />
                    <span className="flex-1">
                      {o.label}
                      {o.inactive ? " (inactive)" : ""}
                      {o.note ? <span className="ml-1 text-muted-foreground">{o.note}</span> : null}
                    </span>
                    {checked ? <span className="sr-only">selected</span> : null}
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {canCreate ? (
              <CommandGroup>
                <CommandItem
                  value={`create-${typed}`}
                  onSelect={() => {
                    onCreate?.(typed)
                    setQuery("")
                  }}
                >
                  {createLabel ? createLabel(typed) : `Create "${typed}"`}
                </CommandItem>
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
