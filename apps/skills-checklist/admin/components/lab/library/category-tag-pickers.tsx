"use client"

/**
 * Category and Tags pickers for every Add a skill path (sheet A, inline row B, add several C) and the edit sheet.
 * REQ SL-03 (one optional category), SL-04 (any number of tags, crossing categories), SL-05 (created at the point of need,
 * no separate setup), decision D-X28. Spec: skill-setup-journey/02 section 6 (Popover + Command, last item Create "{typed}").
 * - The vocabulary is the program's own and shared with Settings (useVocabOptions over lib/v2/vocabulary.ts); nothing ships
 *   (SL-01). Only active entries are offered; a value already on the skill that has since been deactivated stays, marked
 *   "Inactive", so it can be removed deliberately (SL-06).
 * - DS has no Combobox or tag input: Category is DS Popover + Command; Tags is DS InputGroup + InputGroupInput + Badge +
 *   Button, with the suggestions in a DS Popover (registry entry in docs/governance/ds-adoption.md).
 * - Category is a single-choice select (value plus chevron): "None" clears it.
 * - Tags is a tag input, not a dropdown: chips with their own remove button inside one text box, suggestions while typing
 *   (Romit 2026-10-27). The library filter keeps its own list, since it filters rather than assigns.
 * - Popovers sit above the modal add sheet (z-80), like the sheet's own Select did.
 */
import * as React from "react"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@exxatdesignux/ui/components/ui/command"
import { InputGroup, InputGroupInput } from "@exxatdesignux/ui/components/ui/input-group"
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@exxatdesignux/ui/components/ui/popover"
import { mergeTags, normName, vocabPickerOptions } from "@/lib/lab/library"
import { useV2State } from "@/lib/v2/react"

/** The shared categories and tags (Settings writes them), for the pickers. */
export function useVocabOptions() {
  const state = useV2State()
  return React.useMemo(() => vocabPickerOptions(state), [state])
}

/**
 * "Inactive" beside a category or tag that was deactivated after it was assigned (SL-06): glyph plus word, never colour alone.
 * Shared by the pickers, the library rows, the skill panel and the import review.
 */
export function InactiveMark() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground" data-vocab-inactive>
      <i className="fa-light fa-circle-minus" aria-hidden="true" />
      Inactive
    </span>
  )
}

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
  /** Deactivated names: never offered, marked "Inactive" when already the value. */
  inactive?: readonly string[]
  onChange: (v: string) => void
  size?: "sm" | "default"
  className?: string
}

export function CategoryPicker({ id, labelId, value, options, inactive = [], onChange, size = "default", className }: CategoryPickerProps) {
  const valueInactive = !!value && inactive.some((x) => normName(x) === normName(value))
  const [open, setOpen] = React.useState(false)
  const [q, setQ] = React.useState("")
  const typed = clean(q)
  const all = value && !options.some((o) => normName(o) === normName(value)) ? [value, ...options] : [...options]
  const known = [...all, ...inactive].some((o) => normName(o) === normName(typed))
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
          <span id={`${id}-value`} className={`flex min-w-0 items-center gap-2 ${value ? "" : "text-muted-foreground"}`}>
            <span className="truncate">{value || "None"}</span>
            {valueInactive ? <InactiveMark /> : null}
          </span>
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
            {typed && !known ? null : <CommandEmpty>{typed ? "No category matches." : "No categories yet. Type one to create it."}</CommandEmpty>}
            {value || all.length ? (
              <CommandGroup>
                {value ? <CommandItem value="__none" keywords={["none"]} onSelect={() => pick("")}><CheckMark on={false} />None</CommandItem> : null}
                {all.map((o) => (
                  <CommandItem key={o} value={o} onSelect={() => pick(o)}>
                    <CheckMark on={o === value} />
                    <span className="truncate">{o}</span>
                    {o === value && valueInactive ? <InactiveMark /> : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
            {typed && !known ? (
              <>
                <CommandSeparator alwaysRender />
                {/* forceMount on the group too: cmdk hides a group whose items it filtered, which hid Create "{typed}". */}
                <CommandGroup forceMount>
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
  /** Id of the visible "Tags" label: names the text box (combobox) and the chip group. */
  labelId: string
  value: readonly string[]
  options: readonly string[]
  /** Deactivated tags: never suggested, marked "Inactive" on a chip the skill already carries. */
  inactive?: readonly string[]
  onChange: (tags: string[]) => void
  size?: "sm" | "default"
  describedBy?: string
}

const MAX_SUGGESTIONS = 8

/**
 * Tag input (decision D-X28, Romit 2026-10-27: "a combination of auto fill dropdown with chip and cross button ... in a text
 * box"). One DS InputGroup that holds the chosen tags as Badges, each with its own remove button, and a text box after the
 * last chip. Typing shows suggestions under the box (the program's tags that match, then Create "{typed}" last). Enter or
 * comma commits the highlighted suggestion or the typed text; Backspace in an empty box removes the last chip; Escape closes
 * the suggestions. No chevron and no dropdown trigger: Category is the select, Tags is the text box.
 * ARIA: the text box is a combobox (aria-expanded, aria-controls, aria-activedescendant) over a listbox of options.
 */
export function TagsPicker({ id, labelId, value, options, inactive = [], onChange, size = "default", describedBy }: TagsPickerProps) {
  const isInactive = (t: string) => inactive.some((x) => normName(x) === normName(t))
  const [text, setText] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const [active, setActive] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listId = `${id}-suggestions`
  const typed = clean(text)
  const has = (t: string) => value.some((x) => normName(x) === normName(t))
  const matches = mergeTags([], options)
    .filter((o) => !has(o) && (!typed || normName(o).includes(normName(typed))))
    .slice(0, MAX_SUGGESTIONS)
  // An inactive tag is neither suggested nor re-created under the same name (SL-06).
  const exact = typed && (options.some((o) => normName(o) === normName(typed)) || has(typed) || isInactive(typed))
  // Typing a deactivated tag's name says so, instead of offering it or creating it again (SL-06).
  const typedInactive = !!typed && isInactive(typed) && !has(typed)
  const rows: Array<{ kind: "tag" | "create" | "inactive"; label: string }> = [
    ...matches.map((m) => ({ kind: "tag" as const, label: m })),
    ...(typed && !exact ? [{ kind: "create" as const, label: typed }] : []),
    ...(typedInactive ? [{ kind: "inactive" as const, label: typed }] : []),
  ]
  const shown = open && rows.length > 0
  const at = Math.min(active, Math.max(rows.length - 1, 0))

  const commit = (t: string) => {
    const tag = clean(t)
    if (tag && isInactive(tag) && !has(tag)) return
    if (tag && !has(tag)) onChange(mergeTags(value, [tag]))
    setText("")
    setActive(0)
    inputRef.current?.focus()
  }
  const remove = (t: string) => {
    onChange(value.filter((x) => x !== t))
    inputRef.current?.focus()
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      if (!open) { setOpen(true); setActive(0); return }
      setActive((i) => (rows.length ? (i + 1) % rows.length : 0))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((i) => (rows.length ? (i - 1 + rows.length) % rows.length : 0))
    } else if (e.key === "Enter" || e.key === ",") {
      const row = shown ? rows[at] : undefined
      if (row || typed) {
        e.preventDefault()
        commit(row ? row.label : typed)
      } else if (e.key === ",") e.preventDefault()
    } else if (e.key === "Backspace" && text === "" && value.length) {
      e.preventDefault()
      onChange(value.slice(0, -1))
    } else if (e.key === "Escape" && shown) {
      // Close the suggestions only; a second Escape reaches the sheet or row that holds the field.
      e.preventDefault()
      e.stopPropagation()
      setOpen(false)
    }
  }

  return (
    <Popover open={shown} onOpenChange={(o) => { if (!o) setOpen(false) }}>
      <PopoverAnchor asChild>
        <InputGroup
          className={`h-auto flex-wrap gap-1.5 px-1.5 py-1 ${size === "sm" ? "min-h-8" : "min-h-10"}`}
          aria-labelledby={labelId}
          onMouseDown={(e) => { if (e.target === e.currentTarget) { e.preventDefault(); inputRef.current?.focus() } }}
          data-tags-picker
        >
          {value.length ? (
            <ul className="contents" aria-label="Chosen tags">
              {value.map((t) => (
                <li key={t}>
                  <Badge variant="secondary" className="gap-1 pe-0.5">
                    {t}
                    {isInactive(t) ? <InactiveMark /> : null}
                    <Button type="button" variant="ghost" size="icon-xs" aria-label={`Remove tag ${t}`} onClick={() => remove(t)}>
                      <i className="fa-light fa-xmark" aria-hidden="true" />
                    </Button>
                  </Badge>
                </li>
              ))}
            </ul>
          ) : null}
          <InputGroupInput
            ref={inputRef}
            id={id}
            role="combobox"
            aria-labelledby={labelId}
            aria-describedby={describedBy}
            aria-autocomplete="list"
            aria-expanded={shown}
            aria-controls={listId}
            aria-activedescendant={shown ? `${listId}-${at}` : undefined}
            autoComplete="off"
            value={text}
            placeholder={value.length ? "" : "Type a tag"}
            onChange={(e) => {
              const v = e.target.value
              // A pasted "a, b, c" becomes three chips; a trailing comma commits what is before it.
              if (v.includes(",")) {
                const parts = v.split(",")
                const last = parts.pop() ?? ""
                const add = parts.map(clean).filter((x) => !!x && !isInactive(x))
                if (add.length) onChange(mergeTags(value, add))
                setText(last)
              } else setText(v)
              setOpen(true)
              setActive(0)
            }}
            onKeyDown={onKeyDown}
            onBlur={() => setOpen(false)}
            className={`h-7 min-w-[8rem] flex-1 px-1 ${size === "sm" ? "text-sm" : ""}`}
          />
        </InputGroup>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        sideOffset={4}
        className="z-[90] w-[var(--radix-popover-trigger-width)] min-w-56 p-1"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <ul id={listId} role="listbox" aria-label="Tag suggestions" className="flex max-h-64 flex-col overflow-y-auto">
          {rows.map((r, i) => (
            <li
              key={`${r.kind}-${r.label}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === at}
              aria-disabled={r.kind === "inactive" || undefined}
              data-create-tag={r.kind === "create" || undefined}
              className={`flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm text-foreground ${i === at ? "bg-accent text-accent-foreground" : ""}`}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => commit(r.label)}
            >
              {r.kind === "inactive" ? (
                <span className="flex min-w-0 items-center gap-2 text-muted-foreground"><span className="truncate">{r.label}</span><InactiveMark /></span>
              ) : (
                <span className="truncate">{r.kind === "create" ? `Create "${r.label}"` : r.label}</span>
              )}
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}

/** A skill's tags as chips, each deactivated one marked "Inactive" (SL-06). Read-only: the library table and the skill panel. */
export function TagBadges({ tags, inactive = [] }: { tags: readonly string[]; inactive?: readonly string[] }) {
  const off = new Set(inactive.map(normName))
  return (
    <span className="flex flex-wrap gap-1">
      {tags.map((t) => (
        <Badge key={t} variant="secondary" className="gap-1.5">
          {t}
          {off.has(normName(t)) ? <InactiveMark /> : null}
        </Badge>
      ))}
    </span>
  )
}

/** The tags line under a skill name ("tag glyph, a, b"), with a deactivated tag followed by "(inactive)" in words (SL-06). */
export function tagLineText(tags: readonly string[], inactive: readonly string[] = []): string {
  const off = new Set(inactive.map(normName))
  return tags.map((t) => (off.has(normName(t)) ? `${t} (inactive)` : t)).join(", ")
}

/** A category name, followed by "Inactive" when it was deactivated after it was assigned (SL-06). */
export function CategoryName({ name, inactive }: { name: string; inactive: boolean }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <span className="truncate">{name}</span>
      {inactive ? <InactiveMark /> : null}
    </span>
  )
}
