"use client"
// DS adoption: HAND-ROLL (composition). FilterPill is not exported by @exxatdesignux/ui; see docs/governance/ds-adoption.md "Documented hand-rolls".

import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { FilterBar, FilterBarAddButton, FilterBarClearButton } from "@exxatdesignux/ui/components/ui/filter-bar"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@exxatdesignux/ui/components/ui/popover"
import type { ActiveFilter, FilterFieldDef } from "@exxatdesignux/ui/lib/table-properties-types"

/** A select-type field with one value at a time, in the DS data model so it equals the table's. */
export type V2FilterField = FilterFieldDef & {
  type: "select"
  options: { value: string; label: string }[]
  /** The field cannot be chosen yet. `hint` says what to do first, in text beside the field. */
  disabled?: boolean
  hint?: string
}

/** Build a select field. Operators are always `is`; a field holds one value, and picking again replaces it. */
export const v2SelectField = (key: string, label: string, options: { value: string; label: string }[], icon = "fa-filter", extra: { disabled?: boolean; hint?: string } = {}): V2FilterField => ({ key, label, icon, type: "select", operators: ["is"], options, ...extra })

/** Set (or replace) the single value of a field. */
export function setFilter(filters: ActiveFilter[], fieldKey: string, value: string): ActiveFilter[] {
  const next: ActiveFilter = { id: `f-${fieldKey}`, fieldKey, operator: "is", values: [value] }
  return [...filters.filter((f) => f.fieldKey !== fieldKey), next]
}

/** A value list longer than this gets a search box, so a program with hundreds of sites stays usable. */
const SEARCH_FROM = 8

export const removeFilter = (filters: ActiveFilter[], fieldKey: string): ActiveFilter[] => filters.filter((f) => f.fieldKey !== fieldKey)

/** The value of a field, or null when it is not applied. */
export const filterValue = (filters: ActiveFilter[], fieldKey: string): string | null => filters.find((f) => f.fieldKey === fieldKey)?.values[0] ?? null

/**
 * One filter row for v2 pages whose body is not a DataTable toolbar (V2-CONSISTENCY section 4). Composed from the DS FilterBar
 * parts because the DS exports no standalone chip. Applied filters stay visible as chips, each removable on its own; "Clear all"
 * shows from 2 chips, and also when the filters match nothing, where it is the one clearing action next to the explanation.
 *
 * `resultCount` is announced politely; when it is 0 with filters applied, `emptyMessage` is shown (REQ RP-09).
 */
export function V2FilterBar({
  fields,
  filters,
  onChange,
  resultCount,
  resultNoun = "results",
  emptyMessage = "No results match these filters.",
  className,
}: {
  fields: V2FilterField[]
  filters: ActiveFilter[]
  onChange: (next: ActiveFilter[]) => void
  resultCount?: number
  resultNoun?: string
  emptyMessage?: string
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [fieldKey, setFieldKey] = React.useState<string | null>(null)
  const [query, setQuery] = React.useState("")
  const field = fields.find((f) => f.key === fieldKey) ?? null
  const empty = filters.length > 0 && resultCount === 0
  const showClear = filters.length >= 2 || empty

  const close = () => {
    setOpen(false)
    setFieldKey(null)
    setQuery("")
  }
  const labelOf = (f: ActiveFilter) => {
    const def = fields.find((d) => d.key === f.fieldKey)
    const v = f.values[0]
    return { field: def?.label ?? f.fieldKey, value: def?.options?.find((o) => o.value === v)?.label ?? v ?? "" }
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-1.5">
        <FilterBar aria-label="Filters">
          {filters.map((f) => {
            const l = labelOf(f)
            return (
              <Button key={f.id} type="button" variant="outline" size="sm" aria-label={`Remove filter ${l.field}: ${l.value}`} data-filter-chip={f.fieldKey} onClick={() => onChange(removeFilter(filters, f.fieldKey))}>
                <span className="text-muted-foreground">{l.field}:</span> {l.value}
                <i className="fa-light fa-xmark" aria-hidden="true" />
              </Button>
            )
          })}
          <Popover open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
            <PopoverTrigger asChild>
              <FilterBarAddButton aria-haspopup="dialog" />
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 p-1">
              {field ? (
                <div role="group" aria-label={field.label} className="flex flex-col">
                  <Button type="button" variant="ghost" size="sm" className="justify-start" onClick={() => { setFieldKey(null); setQuery("") }}>
                    <i className="fa-light fa-arrow-left" aria-hidden="true" />
                    {field.label}
                  </Button>
                  {field.options!.length > SEARCH_FROM ? <Input type="search" aria-label={`Search ${field.label.toLowerCase()}`} placeholder={`Search ${field.label.toLowerCase()}`} value={query} onChange={(e) => setQuery(e.target.value)} className="my-1" /> : null}
                  <div className="flex max-h-64 flex-col overflow-y-auto">
                  {field.options!.filter((o) => !query || o.label.toLowerCase().includes(query.toLowerCase())).map((o) => (
                    <Button
                      key={o.value}
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      aria-pressed={filterValue(filters, field.key) === o.value}
                      onClick={() => {
                        onChange(setFilter(filters, field.key, o.value))
                        close()
                      }}
                    >
                      {o.label}
                    </Button>
                  ))}
                  {query && !field.options!.some((o) => o.label.toLowerCase().includes(query.toLowerCase())) ? <p className="px-2.5 py-2 text-sm text-muted-foreground">{`No ${field.label.toLowerCase()} matches "${query}".`}</p> : null}
                  </div>
                </div>
              ) : (
                <div role="group" aria-label="Filter by" className="flex flex-col">
                  {fields.map((f) => (
                    <React.Fragment key={f.key}>
                      <Button type="button" variant="ghost" size="sm" className="justify-start" disabled={f.disabled} aria-describedby={f.hint ? `v2f-hint-${f.key}` : undefined} onClick={() => setFieldKey(f.key)}>
                        <i className={`fa-light ${f.icon}`} aria-hidden="true" />
                        {f.label}
                      </Button>
                      {f.hint ? <p id={`v2f-hint-${f.key}`} data-filter-hint={f.key} className="px-2.5 pb-1 text-xs text-muted-foreground">{f.hint}</p> : null}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </PopoverContent>
          </Popover>
          {showClear ? <FilterBarClearButton onClick={() => onChange([])} /> : null}
        </FilterBar>
      </div>
      {empty ? <p className="mt-2 text-sm text-muted-foreground" data-filter-empty>{emptyMessage}</p> : null}
      <p role="status" aria-live="polite" className="sr-only">
        {resultCount === undefined ? "" : `${resultCount} ${resultCount === 1 ? resultNoun.replace(/s$/, "") : resultNoun}`}
      </p>
    </div>
  )
}
