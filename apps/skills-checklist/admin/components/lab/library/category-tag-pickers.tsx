"use client"

/**
 * Category and Tags pickers for every Add a skill path (sheet A, inline row B, add several C) and the edit sheet.
 * REQ SL-03 (one optional category), SL-04 (any number of tags, crossing categories), SL-05 (created at the point of need,
 * no separate setup), decision D-X28. Spec: skill-setup-journey/02 section 6 (Popover + Command, last item Create "{typed}").
 * - The vocabulary is the program's own: options come from its live library (pickerOptions); nothing ships (SL-01).
 * - DS has no Combobox, so each is composed from DS Popover + Command.
 * - Category is single: "None" clears it. Tags are multi: the popover stays open, each choice toggles, chosen tags show as
 *   removable Badges beside the trigger.
 * - Popovers sit above the modal add sheet (z-80), like the sheet's own Select did.
 */
import * as React from "react"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@exxatdesignux/ui/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@exxatdesignux/ui/components/ui/popover"
import { mergeTags, normName } from "@/lib/lab/library"

const clean = (s: string) => s.trim().replace(/\s+/g, " ")

function CheckMark({ on }: { on: boolean }) {
  return <i className={`fa-light fa-check w-4 text-xs ${on ? "" : "invisible"}`} aria-hidden="true" />
}

export interface CategoryPickerProps {
  id: string
  /** Id of the visible label, so the trigger reads "Category, Nutrition". */
  labelId: string
  value: string
  options: readonly string[]
  onChange: (v: string) => void
  size?: "sm" | "default"
  className?: string
}

export function CategoryPicker({ id, labelId, value, options, onChange, size = "default", className }: CategoryPickerProps) {
  const [open, setOpen] = React.useState(false)
  const [q, setQ] = React.useState("")
  const typed = clean(q)
  const all = value && !options.some((o) => normName(o) === normName(value)) ? [value, ...options] : [...options]
  const known = all.some((o) => normName(o) === normName(typed))
  const pick = (v: string) => { onChange(v); setOpen(false); setQ("") }
  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQ("") }}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          size={size}
          aria-labelledby={`${labelId} ${id}-value`}
          className={`justify-between gap-2 font-normal ${className ?? ""}`}
          data-category-picker
        >
          <span id={`${id}-value`} className={`truncate ${value ? "" : "text-muted-foreground"}`}>{value || "None"}</span>
          <i className="fa-light fa-chevron-down text-xs text-muted-foreground" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="z-[90] w-72 p-0">
        <Command>
          <CommandInput
            value={q}
            onValueChange={setQ}
            placeholder="Find or create a category"
            aria-label="Find or create a category"
          />
          <CommandList className="max-h-64">
            <CommandEmpty>{typed ? "No category matches." : "No categories yet. Type one to create it."}</CommandEmpty>
            {value || all.length ? (
              <CommandGroup>
                {value ? <CommandItem value="__none" keywords={["none"]} onSelect={() => pick("")}><CheckMark on={false} />None</CommandItem> : null}
                {all.map((o) => (
                  <CommandItem key={o} value={o} onSelect={() => pick(o)}>
                    <CheckMark on={o === value} />
                    <span className="truncate">{o}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
            {typed && !known ? (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem forceMount value={`__create ${typed}`} onSelect={() => pick(typed)} data-create-category>
                    {`Create "${typed}"`}
                  </CommandItem>
                </CommandGroup>
              </>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export interface TagsPickerProps {
  id: string
  labelId: string
  value: readonly string[]
  options: readonly string[]
  onChange: (tags: string[]) => void
  size?: "sm" | "default"
  describedBy?: string
}

export function TagsPicker({ id, labelId, value, options, onChange, size = "default", describedBy }: TagsPickerProps) {
  const [open, setOpen] = React.useState(false)
  const [q, setQ] = React.useState("")
  const typed = clean(q)
  const has = (t: string) => value.some((x) => normName(x) === normName(t))
  const all = mergeTags(options, value)
  const known = all.some((o) => normName(o) === normName(typed))
  const toggle = (t: string) => onChange(has(t) ? value.filter((x) => normName(x) !== normName(t)) : mergeTags(value, [t]))
  const label = value.length === 0 ? "Add tags" : value.length === 1 ? "1 tag" : `${value.length} tags`
  return (
    <div className="flex flex-wrap items-center gap-1.5" data-tags-picker>
      <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQ("") }}>
        <PopoverTrigger asChild>
          <Button id={id} type="button" variant="outline" size={size} aria-labelledby={`${labelId} ${id}-value`} aria-describedby={describedBy} className="gap-2 font-normal">
            <span id={`${id}-value`} className={value.length ? "" : "text-muted-foreground"}>{label}</span>
            <i className="fa-light fa-chevron-down text-xs text-muted-foreground" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="z-[90] w-72 p-0">
          <Command>
            <CommandInput
              value={q}
              onValueChange={setQ}
              placeholder="Find or create a tag"
              aria-label="Find or create a tag"
            />
            <CommandList className="max-h-64" aria-multiselectable="true">
              <CommandEmpty>{typed ? "No tag matches." : "No tags yet. Type one to create it."}</CommandEmpty>
              {all.length ? (
                <CommandGroup>
                  {all.map((o) => (
                    <CommandItem key={o} value={o} onSelect={() => toggle(o)} aria-selected={has(o)} data-checked={has(o) || undefined}>
                      <CheckMark on={has(o)} />
                      <span className="truncate">{o}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null}
              {typed && !known ? (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem forceMount value={`__create ${typed}`} onSelect={() => { toggle(typed); setQ("") }} data-create-tag>
                      {`Create "${typed}"`}
                    </CommandItem>
                  </CommandGroup>
                </>
              ) : null}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value.length ? (
        <ul className="contents" aria-label="Chosen tags">
          {value.map((t) => (
            <li key={t}>
              <Badge variant="secondary" className="gap-1 pe-0.5">
                {t}
                <Button type="button" variant="ghost" size="icon-xs" aria-label={`Remove tag ${t}`} onClick={() => onChange(value.filter((x) => x !== t))}>
                  <i className="fa-light fa-xmark" aria-hidden="true" />
                </Button>
              </Badge>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
