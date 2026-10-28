"use client"

/**
 * Shared pieces for the admin mapping, lists and evaluator screens: URL params, the one-row 32px toolbar (search, selects, a site
 * picker), the mapping level glyph and select, the amber note (the one saturated colour on these pages), and the demo states
 * (?state=loading | empty | error) that every variant renders the same way.
 */
import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { FilterBar } from "@exxatdesignux/ui/components/ui/filter-bar"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@exxatdesignux/ui/components/ui/input-group"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@exxatdesignux/ui/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@exxatdesignux/ui/components/ui/command"
import { Tip } from "@exxatdesignux/ui/components/ui/tip"
import { DiamondGlyph } from "@/components/lab/viz"
import { LEVELS, LEVEL_LABEL, type MapLevel } from "@/lib/lab/mapping"

// One link treatment and one number format for every lab screen (consistency audit items 7 and 9). These panes put names in
// tables and lists, so LINK here is the in-table link (underline on hover); counts that open records use NUM_LINK.
export { LINK_IN_TABLE as LINK, NUM_LINK } from "@/components/lab/link-styles"
export { fmt, plural } from "@/lib/v2/format"
import { fmt } from "@/lib/v2/format"

// ---------------------------------------------------------------------------------------------------------------------
// URL params

/** Reads and writes the URL search params (filters, demo state). Not a data fetch: the lab state is synchronous. */
export function useUrlParams() {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname() ?? ""
  const get = React.useCallback((k: string) => params?.get(k) ?? "", [params])
  const set = React.useCallback(
    (p: Record<string, string | null | undefined>) => {
      const q = new URLSearchParams(params?.toString() ?? "")
      for (const [k, v] of Object.entries(p)) {
        if (v) q.set(k, v)
        else q.delete(k)
      }
      const s = q.toString()
      router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false })
    },
    [params, pathname, router],
  )
  return { get, set }
}

export type DemoState = "loading" | "empty" | "error" | null
export function demoOf(v: string): DemoState {
  return v === "loading" || v === "empty" || v === "error" ? v : null
}

// ---------------------------------------------------------------------------------------------------------------------
// Toolbar: the DS FilterBar holds the conditions (search and selects) in one row; `end` sits on the right (a view switch or
// a result summary). Replaces the hand-rolled role=toolbar row (consistency audit item 5).

export function Toolbar({ label, children, end }: { label: string; children: React.ReactNode; end?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2" data-region="toolbar">
      <FilterBar aria-label={label} className="flex-initial gap-2">
        {children}
      </FilterBar>
      {end ? <div className="ms-auto flex items-center gap-2">{end}</div> : null}
    </div>
  )
}

export function SearchField({ value, onChange, label, placeholder, className = "w-64" }: { value: string; onChange: (v: string) => void; label: string; placeholder: string; className?: string }) {
  const [local, setLocal] = React.useState(value)
  React.useEffect(() => setLocal(value), [value])
  React.useEffect(() => {
    if (local === value) return
    const t = window.setTimeout(() => onChange(local), 150)
    return () => window.clearTimeout(t)
  }, [local, value, onChange])
  return (
    <InputGroup className={className}>
      <InputGroupAddon>
        <i className="fa-light fa-magnifying-glass" aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupInput type="search" aria-label={label} placeholder={placeholder} value={local} onChange={(e) => setLocal(e.target.value)} />
    </InputGroup>
  )
}

export interface Opt {
  value: string
  label: string
  group?: string
}

const ALL = "__all"

/** A select whose empty value reads "All ..."; options with `group` render under group labels (terms by academic year). */
export function FilterSelect({ value, onChange, label, allLabel, options, className = "w-40", id }: { value: string; onChange: (v: string) => void; label: string; allLabel?: string; options: Opt[]; className?: string; id?: string }) {
  const groups = [...new Set(options.map((o) => o.group ?? ""))]
  return (
    <Select value={value || ALL} onValueChange={(v) => onChange(v === ALL ? "" : v)}>
      <SelectTrigger id={id} className={className} aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {allLabel ? <SelectItem value={ALL}>{allLabel}</SelectItem> : null}
        {groups.map((g) =>
          g ? (
            <SelectGroup key={g}>
              <SelectLabel>{g}</SelectLabel>
              {options.filter((o) => o.group === g).map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectGroup>
          ) : (
            options.filter((o) => !o.group).map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)
          ),
        )}
      </SelectContent>
    </Select>
  )
}

/** Type-to-search picker for long option lists (the DS has no Combobox: Popover plus Command). */
export function SearchPicker({ value, onChange, label, allLabel, options, className = "w-56" }: { value: string; onChange: (v: string) => void; label: string; allLabel: string; options: Opt[]; className?: string }) {
  const [open, setOpen] = React.useState(false)
  const current = options.find((o) => o.value === value)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" className={`${className} justify-between text-sm font-normal`} aria-label={`${label}: ${current?.label ?? allLabel}`}>
          <span className="truncate">{current?.label ?? allLabel}</span>
          <i className="fa-light fa-chevron-down text-muted-foreground" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0">
        <Command>
          <CommandInput placeholder={`Search ${label.toLowerCase()}`} />
          <CommandList>
            <CommandEmpty>{`No ${label.toLowerCase()} matches.`}</CommandEmpty>
            <CommandGroup>
              <CommandItem value={`__ ${allLabel}`} onSelect={() => { onChange(""); setOpen(false) }}>{allLabel}</CommandItem>
              {options.map((o) => (
                <CommandItem key={o.value} value={`${o.label} ${o.value}`} onSelect={() => { onChange(o.value); setOpen(false) }}>
                  <span className="truncate">{o.label}</span>
                  {o.value === value ? <i className="fa-light fa-check ms-auto" aria-hidden="true" /> : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Mapping level: glyph + word (never colour alone)

export function LevelGlyph({ level, size = 10 }: { level: MapLevel; size?: number }) {
  if (level === "none") return <span aria-hidden="true" className="inline-block h-px w-2.5 bg-[var(--border-control-3)]" />
  // Mandatory: filled square. Recommended: outline with a centre dot. Optional: dashed outline. Shape, not colour, carries the level.
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" aria-hidden="true" className="shrink-0">
      <rect x="0.75" y="0.75" width="8.5" height="8.5" rx="1.5" fill={level === "mandatory" ? "var(--foreground)" : "none"} stroke="var(--foreground)" strokeWidth="1.5" strokeDasharray={level === "optional" ? "2 1.5" : undefined} />
      {level === "recommended" ? <rect x="3.5" y="3.5" width="3" height="3" rx="0.5" fill="var(--foreground)" /> : null}
    </svg>
  )
}

export function LevelSelect({ value, onChange, label, size = "sm" }: { value: MapLevel; onChange: (v: MapLevel) => void; label: string; size?: "sm" | "default" }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as MapLevel)}>
      <SelectTrigger size={size} className="w-44" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LEVELS.map((l) => (
          <SelectItem key={l} value={l}>
            <span className="flex items-center gap-2">
              <LevelGlyph level={l} />
              {LEVEL_LABEL[l]}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** One line that separates the program list's "Required to graduate" from the per-course levels (glossary, D-X12). */
export const LEVELS_VS_GRADUATE = "Required to graduate comes from the program list. Mandatory, recommended and optional are set per course."

/**
 * The level key. With `counts` (one offering, Romit 2026-10-28 "too many text"): one row of glyph + count + word for the three
 * levels, replacing the separate count line; "Not mapped" and "levels apply to this course only" move into the ⓘ.
 */
export function LevelLegend({ counts }: { counts?: { mapped: number; mandatory: number; recommended: number; optional: number } } = {}) {
  const tip = counts ? `${LEVELS_VS_GRADUATE} Levels set here apply to this course only. ${LEVEL_LABEL.none}: not expected in this course.` : LEVELS_VS_GRADUATE
  return (
    <span
      className={counts ? "flex flex-wrap items-center gap-4 text-sm" : "flex items-center gap-4 text-xs text-muted-foreground"}
      data-level-legend
      data-level-totals={counts ? "" : undefined}
      role={counts ? "group" : undefined}
      aria-label={counts ? `${counts.mapped} mapped: ${counts.mandatory} mandatory, ${counts.recommended} recommended, ${counts.optional} optional` : undefined}
    >
      <span className="flex flex-wrap items-center gap-4" aria-hidden={counts ? undefined : true}>
        {(counts ? (["mandatory", "recommended", "optional"] as const) : LEVELS).map((l) => (
          <span key={l} className="flex items-center gap-1.5">
            <LevelGlyph level={l} />
            {counts ? <span className="font-semibold tabular-nums text-foreground">{fmt(counts[l as keyof typeof counts])}</span> : null}
            <span className={counts ? "text-muted-foreground" : undefined}>{LEVEL_LABEL[l]}</span>
          </span>
        ))}
      </span>
      <Tip label={tip}>
        <span tabIndex={0} className="inline-flex size-5 items-center justify-center rounded-sm text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" data-levels-tip>
          <i className="fa-light fa-circle-info" aria-hidden="true" />
          <span className="sr-only">{tip}</span>
        </span>
      </Tip>
    </span>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Amber note: the one saturated colour on these pages, for a shortfall the admin can act on

export function AmberNote({ children, action, region = "note" }: { children: React.ReactNode; action?: React.ReactNode; region?: string }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-foreground" data-region={region || undefined}>
      <span className="inline-flex items-center" style={{ color: "var(--lab-viz-behind)" }}>
        <DiamondGlyph />
      </span>
      <span>{children}</span>
      {action}
    </p>
  )
}

export function AmberMark({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <DiamondGlyph />
      <span>{label}</span>
    </span>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Demo states

export function LoadingState({ label, rows = 10 }: { label: string; rows?: number }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className="flex flex-col gap-3" data-loading>
      <span className="sr-only">{label}</span>
      <div className="flex gap-2">
        <Skeleton aria-hidden="true" className="h-8 w-64" />
        <Skeleton aria-hidden="true" className="h-8 w-40" />
        <Skeleton aria-hidden="true" className="h-8 w-40" />
      </div>
      {Array.from({ length: rows }, (_, i) => <Skeleton key={i} aria-hidden="true" className="h-10 w-full" />)}
    </div>
  )
}

export function ErrorState({ what, onRetry }: { what: string; onRetry: () => void }) {
  return (
    <LocalBanner variant="error" title={`${what} did not load`} retry={{ label: "Try again", onClick: onRetry }}>
      Nothing was changed. Check your connection and try again.
    </LocalBanner>
  )
}

/** A polite live region for "what just changed" after an edit, said once. */
export function LiveNote({ text }: { text: string }) {
  return (
    <p role="status" aria-live="polite" className="sr-only">
      {text}
    </p>
  )
}

/** Panel heading used inside the right-hand pane (h2 under the page h1). */
export function PaneHeading({ title, meta, end }: { title: React.ReactNode; meta?: React.ReactNode; end?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {meta ? <p className="text-sm text-muted-foreground">{meta}</p> : null}
      </div>
      {end ? <div className="flex items-center gap-2">{end}</div> : null}
    </div>
  )
}
