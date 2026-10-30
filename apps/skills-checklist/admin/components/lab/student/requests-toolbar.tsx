"use client"

/**
 * My requests toolbar (Romit 2026-10-27: "I don't see search, filter in My requests"; LEDGER D-L20): one row at 1440 with a search
 * box (skill or evaluator name) and one Filters button with its count; the popover holds course, evaluator, setting and the date
 * range. Applied filters are removable chips with Clear all, the same pattern as the reporting scope bar (secondary Buttons in a DS
 * FilterBar; the DS has no standalone filter chip). At 375 the search is full width with Filters beside it. Values live in the URL.
 * [REQ ST-03: earlier submissions findable]
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Field, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { FilterBar, FilterBarClearButton } from "@exxatdesignux/ui/components/ui/filter-bar"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@exxatdesignux/ui/components/ui/input-group"
import { Popover, PopoverContent, PopoverTrigger } from "@exxatdesignux/ui/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { shortDate } from "@/lib/lab/student"
import { capitalize, skillNoun } from "@/lib/lab/terms"
import { FILTER_KEYS, filterCount, type RequestFilter } from "@/lib/lab/requests-filter"

const ANY = "__any"
const SETTINGS = [
  { value: "clinical", label: "Clinical" },
  { value: "lab", label: "Lab" },
  { value: "simulation", label: "Simulation" },
]

export interface ToolbarOptions {
  courses: Array<{ value: string; label: string }>
  evaluators: Array<{ value: string; label: string }>
}

function Pick({ id, label, value, options, onChange }: { id: string; label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (v: string) => void }) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select value={value || ANY} onValueChange={(v) => onChange(v === ANY ? "" : v)}>
        <SelectTrigger id={id} size="sm" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Any</SelectItem>
          {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </Field>
  )
}

export function RequestsToolbar({ filter, options, onChange }: { filter: RequestFilter; options: ToolbarOptions; onChange: (p: Record<string, string | null>) => void }) {
  const [q, setQ] = React.useState(filter.q)
  React.useEffect(() => setQ(filter.q), [filter.q])
  const n = filterCount(filter)
  const nPhone = n + (filter.q.trim() ? 1 : 0)
  const set = (k: keyof typeof FILTER_KEYS, v: string) => onChange({ [FILTER_KEYS[k]]: v || null })
  const label = (list: Array<{ value: string; label: string }>, v: string) => list.find((o) => o.value === v)?.label ?? v
  const chips = [
    ...(filter.course ? [{ key: "course" as const, name: "Course", value: label(options.courses, filter.course) }] : []),
    ...(filter.who ? [{ key: "who" as const, name: "Evaluator", value: label(options.evaluators, filter.who) }] : []),
    ...(filter.setting ? [{ key: "setting" as const, name: "Setting", value: label(SETTINGS, filter.setting) }] : []),
    ...(filter.from || filter.to ? [{ key: "dates" as const, name: "Dates", value: `${filter.from ? shortDate(filter.from) : "Any"} to ${filter.to ? shortDate(filter.to) : "any"}` }] : []),
  ]
  const clearAll = () => onChange(Object.fromEntries(Object.values(FILTER_KEYS).map((k) => [k, null])))
  return (
    <div className="flex flex-col gap-2" data-requests-toolbar>
      <div className="flex items-center gap-2">
        {/* On a phone the search moves inside Filters (one control above the list, density budget 2026-10-30); nothing is dropped. */}
        <InputGroup className="min-w-0 flex-1 max-sm:hidden sm:max-w-80">
          <InputGroupAddon align="inline-start">
            <i className="fa-light fa-magnifying-glass" aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              set("q", e.target.value)
            }}
            placeholder={`Search ${skillNoun()} or evaluator`}
            aria-label={`Search requests by ${skillNoun()} or evaluator`}
            data-requests-search
          />
        </InputGroup>
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="shrink-0" data-requests-filters>
              <span className="sm:hidden">{nPhone ? `Filters (${nPhone})` : "Filters"}</span>
              <span className="max-sm:hidden">{n ? `Filters (${n})` : "Filters"}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="flex w-[min(20rem,calc(100vw-2rem))] flex-col gap-3">
            <Field className="sm:hidden">
              <FieldLabel htmlFor="rf-q">Search</FieldLabel>
              <Input id="rf-q" type="search" value={q} onChange={(e) => { setQ(e.target.value); set("q", e.target.value) }} placeholder={`${capitalize(skillNoun())} or evaluator`} />
            </Field>
            <Pick id="rf-course" label="Course" value={filter.course} options={options.courses} onChange={(v) => set("course", v)} />
            <Pick id="rf-who" label="Evaluator" value={filter.who} options={options.evaluators} onChange={(v) => set("who", v)} />
            <Pick id="rf-setting" label="Setting" value={filter.setting} options={SETTINGS} onChange={(v) => set("setting", v)} />
            <div className="grid grid-cols-2 gap-2">
              <Field>
                <FieldLabel htmlFor="rf-from">From</FieldLabel>
                <Input id="rf-from" type="date" value={filter.from} onChange={(e) => set("from", e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="rf-to">To</FieldLabel>
                <Input id="rf-to" type="date" value={filter.to} onChange={(e) => set("to", e.target.value)} />
              </Field>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      {chips.length ? (
        <FilterBar aria-label="Applied filters" className="max-w-full flex-none" data-applied-filters>
          {chips.map((c) => (
            <Button
              key={c.key}
              type="button"
              variant="secondary"
              size="sm"
              className="max-w-[16rem]"
              aria-label={`Remove ${c.name} ${c.value}`}
              onClick={() => (c.key === "dates" ? onChange({ [FILTER_KEYS.from]: null, [FILTER_KEYS.to]: null }) : set(c.key, ""))}
            >
              <span className="text-muted-foreground">{c.name}:</span> <span className="truncate">{c.value}</span>
              <i className="fa-light fa-xmark" aria-hidden="true" />
            </Button>
          ))}
          <FilterBarClearButton onClick={clearAll}>Clear all</FilterBarClearButton>
        </FilterBar>
      ) : null}
    </div>
  )
}

/** The one empty line when search or filters leave a tab with nothing. */
export function NoMatch({ onClear }: { onClear: () => void }) {
  return (
    <p className="flex flex-wrap items-center gap-1 p-4 text-sm text-muted-foreground" data-requests-no-match>
      No requests match.
      <Button type="button" variant="link" size="sm" className="h-auto px-0" onClick={onClear}>Clear filters</Button>
    </p>
  )
}

/** Options for the Filters popover: the student's courses and every evaluator on a request or a draft. */
export function toolbarOptions(courses: Array<{ id: string; code: string }>, evaluators: Array<{ id: string; name: string }>): ToolbarOptions {
  const seen = new Map<string, string>()
  for (const e of evaluators) if (!seen.has(e.id)) seen.set(e.id, e.name)
  return {
    courses: courses.map((c) => ({ value: c.id, label: c.code })),
    evaluators: [...seen.entries()].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label)),
  }
}

export const clearFilterParams = (): Record<string, string | null> => Object.fromEntries(Object.values(FILTER_KEYS).map((k) => [k, null]))
