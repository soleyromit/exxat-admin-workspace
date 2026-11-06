"use client"

/**
 * Shared pieces for the admin mapping, lists and evaluator screens: URL params, the one-row 32px toolbar (search, selects, a site
 * picker), the mapping level glyph and select, the amber note (the one saturated colour on these pages), and the demo states
 * (?state=loading | empty | error) that every variant renders the same way.
 */
import { TYPE } from "@/components/lab/type-scale"
import { BulkCount } from "@/components/lab/shared/bulk-count"
import * as React from "react"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { FilterBar, FilterBarClearButton } from "@exxatdesignux/ui/components/ui/filter-bar"
import { Label } from "@exxatdesignux/ui/components/ui/label"
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

/**
 * The last write the location has not caught up with yet. The router commits later, so `location.search` is stale for a second write in the same tick:
 * Clear all writes once per chip, and each write would put back the params the one before it removed.
 */
let unsettledWrite: { at: string; search: string } | null = null

/** Reads and writes the URL search params (filters, demo state). Not a data fetch: the lab state is synchronous. */
export function useUrlParams() {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname() ?? ""
  const get = React.useCallback((k: string) => params?.get(k) ?? "", [params])
  const write = React.useCallback(
    (p: Record<string, string | null | undefined>, how: "replace" | "push") => {
      // Merge into the URL as it is now, not as it was at render: a write that lands after another one (a wizard step change, a
      // second filter) must not put back the params that one replaced (Set up skills step 5, D-L44).
      const live = typeof window !== "undefined" ? window.location : null
      const at = live ? `${live.pathname}${live.search}` : ""
      const q = new URLSearchParams(unsettledWrite?.at === at ? unsettledWrite.search : live ? live.search : params?.toString() ?? "")
      for (const [k, v] of Object.entries(p)) {
        if (v) q.set(k, v)
        else q.delete(k)
      }
      const s = q.toString()
      unsettledWrite = live ? { at, search: s } : null
      const path = live?.pathname ?? pathname
      router[how](s ? `${path}?${s}` : path, { scroll: false })
    },
    [params, pathname, router],
  )
  // New params mean the write landed, or Back moved past it: the location is the truth again.
  React.useEffect(() => { unsettledWrite = null }, [params])
  const set = React.useCallback((p: Record<string, string | null | undefined>) => write(p, "replace"), [write])
  /** The same, as a step browser Back returns through: moving to another view or record, not narrowing a filter. */
  const push = React.useCallback((p: Record<string, string | null | undefined>) => write(p, "push"), [write])
  return { get, set, push }
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
export function FilterSelect({ value, onChange, label, allLabel, options, className = "w-40", id, resting, layer }: { value: string; onChange: (v: string) => void; label: string; allLabel?: string; options: Opt[]; className?: string; id?: string; /** Shown muted while nothing is chosen, so a chosen filter stands out on a row of them. */ resting?: string; /** Stacking, for a select opened over a dialog that sits above a panel. */ layer?: string }) {
  const groups = [...new Set(options.map((o) => o.group ?? ""))]
  return (
    <Select value={value || (resting ? "" : ALL)} onValueChange={(v) => onChange(v === ALL ? "" : v)}>
      <SelectTrigger id={id} className={className} aria-label={label}>
        <SelectValue placeholder={resting} />
      </SelectTrigger>
      <SelectContent className={layer}>
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
export function SearchPicker({ value, onChange, label, allLabel, options, className = "w-56", id, layer }: { value: string; onChange: (v: string) => void; label: string; allLabel: string; options: Opt[]; className?: string; id?: string; layer?: string }) {
  const [open, setOpen] = React.useState(false)
  const current = options.find((o) => o.value === value)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button id={id} type="button" variant="outline" size="sm" className={`${className} justify-between text-sm font-normal`} aria-label={`${label}: ${current?.label ?? allLabel}`} data-search-picker={label}>
          <span className="truncate">{current?.label ?? allLabel}</span>
          <i className="fa-light fa-chevron-down text-muted-foreground" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className={cn("w-[min(20rem,calc(100vw-2rem))] p-0", layer)}>
        <Command>
          <CommandInput placeholder={`Search ${label.toLowerCase()}`} aria-label={`Search ${label.toLowerCase()}`} />
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
  // Mandatory: filled square. Recommended: outline with a centre dot. Shape, not colour, carries the level.
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" aria-hidden="true" className="shrink-0">
      <rect x="0.75" y="0.75" width="8.5" height="8.5" rx="1.5" fill={level === "mandatory" ? "var(--foreground)" : "none"} stroke="var(--foreground)" strokeWidth="1.5" />
      {level === "recommended" ? <rect x="3.5" y="3.5" width="3" height="3" rx="0.5" fill="var(--foreground)" /> : null}
    </svg>
  )
}

/**
 * A level on one row. DS Select, because three choices repeat over many rows. "Not mapped" is quiet (muted, no border until hover or focus), and
 * Mandatory and Recommended keep the trigger's normal chrome, so the eye finds what the program decided.
 */
export function LevelSelect({ value, onChange, label, size = "sm", className = "w-44", placeholder = "Set level" }: { value: MapLevel | null; onChange: (v: MapLevel) => void; label: string; placeholder?: string; size?: "sm" | "default"; className?: string }) {
  const quiet = value === "none"
  return (
    <Select value={value ?? ""} onValueChange={(v) => onChange(v as MapLevel)}>
      <SelectTrigger size={size} className={cn(className, quiet && "border-transparent text-muted-foreground hover:border-input")} aria-label={label} data-level={value ?? undefined}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {LEVELS.map((l) => (
          <SelectItem key={l} value={l}>
            <span className="flex items-center gap-1.5">
              <LevelGlyph level={l} />
              {LEVEL_LABEL[l]}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** A row's unsaved level: a small dot, with the same words for a screen reader. The line beside Save says what it adds up to. */
export function ChangedDot() {
  return (
    <span className="inline-flex size-4 shrink-0 items-center justify-center" data-level-changed>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-[var(--brand-color)]" />
      <span className="sr-only">Changed, not saved</span>
    </span>
  )
}

/** One bulk control in both views: choosing a level sets it on the selected rows, in the draft. There is no second button. */
export function BulkLevelBar({ n, label, onApply }: { n: number; label: string; onApply: (level: MapLevel) => void }) {
  // Esc or Clear removes the bar, and focus inside it would fall to the body: it goes to the row it was about, else the first row, else the pane's heading.
  const bar = React.useRef<HTMLSpanElement>(null)
  const row = React.useRef<HTMLElement | null>(null)
  const pane = React.useRef<HTMLElement | null>(null)
  React.useLayoutEffect(() => {
    pane.current = bar.current?.closest<HTMLElement>("[data-region]") ?? null
    row.current = pane.current?.querySelector<HTMLElement>('tbody [role="checkbox"][data-state="checked"]') ?? null
  }, [n])
  React.useLayoutEffect(() => () => {
    const el = bar.current
    requestAnimationFrame(() => {
      if (el?.isConnected || (document.activeElement && document.activeElement !== document.body)) return
      const heading = pane.current?.querySelector<HTMLElement>("h2") ?? null
      if (heading) heading.setAttribute("tabindex", "-1")
      const to = [row.current, pane.current?.querySelector<HTMLElement>('tbody [role="checkbox"]') ?? null, heading].find((c) => c?.isConnected)
      to?.focus()
    })
  }, [])
  return (
    <span ref={bar} className="flex flex-nowrap items-center gap-2" data-bulk-bar>
      <BulkCount n={n} />
      <LevelSelect value={null} onChange={onApply} label={label} className="w-44 data-placeholder:text-current [&_i]:text-current" />
    </span>
  )
}

/** Mapped, Mandatory and Recommended for one offering [REQ CM-04]. Not mapped and its meaning sit in the tip [REQ CM-05]. */
export function LevelLegend({ counts }: { counts: { mapped: number; mandatory: number; recommended: number } }) {
  const tip = `Set per offering. ${LEVEL_LABEL.none}: not expected in this offering, and it can still be submitted and counts.`
  return (
    <span className="flex flex-wrap items-center gap-4 text-sm" data-level-legend data-level-totals="" role="group" aria-label={`${counts.mapped} mapped: ${counts.mandatory} mandatory, ${counts.recommended} recommended`}>
      <span className="flex flex-wrap items-center gap-4">
        <span className="flex items-center gap-1.5"><span className="font-semibold tabular-nums text-foreground">{fmt(counts.mapped)}</span><span className="text-muted-foreground">Mapped</span></span>
        {(["mandatory", "recommended"] as const).map((l) => (
          <span key={l} className="flex items-center gap-1.5">
            <LevelGlyph level={l} />
            <span className="font-semibold tabular-nums text-foreground">{fmt(counts[l])}</span>
            <span className="text-muted-foreground">{LEVEL_LABEL[l]}</span>
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

/** Whether a truncated element is really cut off, so its Tip and its Tab stop exist only then (as `RowName` on Categories and tags). */
export function useTextCut<T extends HTMLElement>(text: string) {
  const ref = React.useRef<T>(null)
  const [cut, setCut] = React.useState(false)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setCut(el.scrollWidth > el.clientWidth + 1)
    measure()
    const sized = new ResizeObserver(measure)
    sized.observe(el)
    return () => sized.disconnect()
  }, [text])
  return { ref, cut }
}

export function ErrorState({ what, onRetry }: { what: string; onRetry: () => void }) {
  return (
    <LocalBanner variant="error" title={`${what} did not load`} action={{ label: "Try again", onClick: onRetry }}>
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
        <h2 className={TYPE.section}>{title}</h2>
        {meta ? <p className="text-sm text-muted-foreground">{meta}</p> : null}
      </div>
      {end ? <div className="flex items-center gap-2">{end}</div> : null}
    </div>
  )
}


// ---------------------------------------------------------------------------------------------------------------------
// Filters (one idiom, 2026-10-30 review P2): the reporting pages' Filters button and chips, for lists whose filters are not the
// dashboard scope (course mapping). Each field is a labelled select in the popover; a field away from its default is one
// removable chip; Clear all returns every field to its default.

export interface FilterField {
  id: string
  label: string
  /** Current value ("" is the default unless `defaultValue` says otherwise). */
  value: string
  defaultValue?: string
  /** The option shown for "" (for example "All cohorts"). */
  allLabel?: string
  options: Opt[]
  onChange: (v: string) => void
}

/** `Select` for one of up to seven, `Popover` plus `Command` above seven (map section E rule 16). */
const SELECT_MAX = 7
const isApplied = (f: FilterField) => f.value !== (f.defaultValue ?? "")
const valueLabel = (f: FilterField) => f.options.find((o) => o.value === f.value)?.label ?? (f.value || f.allLabel || "")

export function FiltersControl({ fields, align = "start", courseKind, compact = false, layer }: { fields: FilterField[]; align?: "start" | "end"; /** Stacking, for a Filters button in a dialog that sits above a panel. */ layer?: string; /** Course kind in force ("clinical" by default), stated on the button as on the reporting Filters. */ courseKind?: "clinical" | "all"; /** A funnel beside a search in a narrow pane, not a word. */ compact?: boolean }) {
  const count = fields.filter(isApplied).length
  return (
    <Popover>
      <PopoverTrigger asChild>
        {compact ? (
          <Button type="button" variant="outline" size="icon" aria-haspopup="dialog" aria-label={count ? `Filters, ${count} applied` : "Filters"} data-filters-button data-course-kind={courseKind}>
            <i className={cn(count ? "fa-solid" : "fa-light", "fa-filter")} aria-hidden="true" />
          </Button>
        ) : (
          <Button type="button" variant="outline" size="sm" aria-haspopup="dialog" data-filters-button data-course-kind={courseKind}>
            Filters
            {count ? (
              <>
                <span className="tabular-nums">{count}</span>
                <span className="sr-only"> applied</span>
              </>
            ) : null}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent align={align} className={cn("w-[min(30rem,calc(100vw-2rem))] p-4", layer)} aria-label="Filters" data-filters-panel>
        <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.id} className="flex flex-col gap-1.5">
              <Label htmlFor={`flt-${f.id}`}>{f.label}</Label>
              {f.options.length > SELECT_MAX ? (
                <SearchPicker id={`flt-${f.id}`} value={f.value} onChange={f.onChange} label={f.label} allLabel={f.allLabel ?? ""} options={f.options} className="w-full" layer={layer ? "z-[94]" : undefined} />
              ) : (
                <FilterSelect id={`flt-${f.id}`} value={f.value} onChange={f.onChange} label={f.label} allLabel={f.allLabel} options={f.options} className="w-full" layer={layer ? "z-[94]" : undefined} />
              )}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

/** The applied filters, each removable on its own, plus Clear all (REQ RP-01 idiom). Null when nothing is applied. */
export function AppliedFilterChips({ fields }: { fields: FilterField[] }) {
  const applied = fields.filter(isApplied)
  if (!applied.length) return null
  return (
    <FilterBar aria-label="Applied filters" className="max-w-full flex-none" data-applied-filters>
      {applied.map((f) => (
        <Button key={f.id} type="button" variant="secondary" size="sm" className="h-auto min-h-8 max-w-full whitespace-normal py-1 text-start" data-filter-chip={f.id} aria-label={`Remove ${f.label} ${valueLabel(f)}`} onClick={() => f.onChange(f.defaultValue ?? "")}>
          <span className="shrink-0 text-muted-foreground">{f.label}:</span> <span className="min-w-0">{valueLabel(f)}</span>
          <i className="fa-light fa-xmark" aria-hidden="true" />
        </Button>
      ))}
      <FilterBarClearButton onClick={() => applied.forEach((f) => f.onChange(f.defaultValue ?? ""))}>Clear all</FilterBarClearButton>
    </FilterBar>
  )
}
