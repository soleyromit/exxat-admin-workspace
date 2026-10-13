"use client"

import * as React from "react"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import type { Db } from "@/lib/domain/types"
import { r4, surface } from "@/lib/copy"
import { offeringLabel, type ReportFilters } from "@/lib/store"
import { FILTER_ORDER, type FilterKey } from "./report-params"

export interface FilterOption {
  value: string
  label: string
}

/** Options for one dimension. Group depends on the cohort (S-01 V state). */
export function filterOptions(db: Db, key: FilterKey, filters: ReportFilters): FilterOption[] {
  switch (key) {
    case "cohortId":
      return db.cohorts.map((c) => ({ value: c.id, label: c.name }))
    case "groupId":
      return db.groups.filter((g) => g.cohortId === filters.cohortId).map((g) => ({ value: g.id, label: g.name }))
    case "offeringId":
      return db.offerings.map((o) => ({ value: o.id, label: offeringLabel(o) }))
    case "categoryId":
      return db.categories.filter((c) => c.active).map((c) => ({ value: c.id, label: c.name }))
    case "tagId":
      return db.tags.filter((t) => t.active).map((t) => ({ value: t.id, label: t.name }))
    case "locationId":
      return db.locations.map((l) => ({ value: l.id, label: l.name }))
    case "settingId":
      return [{ value: "lab", label: r4.filters.lab }, ...db.clinicalSettings.map((s) => ({ value: s.id, label: s.name }))]
  }
}

export function filterValueLabel(db: Db, key: FilterKey, filters: ReportFilters): string {
  const v = filters[key]
  if (!v) return ""
  // The group is read against ALL groups so a group outside the chosen cohort (RP-09) still shows a name.
  if (key === "groupId") return db.groups.find((g) => g.id === v)?.name ?? v
  return filterOptions(db, key, filters).find((o) => o.value === v)?.label ?? v
}

const ALL = "__all__"

const LABEL: Record<FilterKey, string> = {
  cohortId: r4.filters.fields.cohort,
  groupId: r4.filters.fields.group,
  offeringId: r4.filters.fields.course,
  categoryId: r4.filters.fields.category,
  tagId: r4.filters.fields.tag,
  locationId: r4.filters.fields.location,
  settingId: r4.filters.fields.setting,
}
const ALL_LABEL: Record<FilterKey, string> = {
  cohortId: r4.filters.all.cohort,
  groupId: r4.filters.all.group,
  offeringId: r4.filters.all.course,
  categoryId: r4.filters.all.category,
  tagId: r4.filters.all.tag,
  locationId: r4.filters.all.location,
  settingId: r4.filters.all.setting,
}
const HINT: Partial<Record<FilterKey, string>> = { groupId: r4.filters.hints.group, tagId: r4.filters.hints.tag, settingId: r4.filters.hints.setting }

export interface ReportFiltersProps {
  db: Db
  filters: ReportFilters
  onChange: (key: FilterKey, value: string | undefined) => void
  onClear: () => void
}

/**
 * P-01 filter bar (prototype): ONE bordered card. A `Filters` button (with the applied count and a chevron) and the grey text
 * "Showing everything" (or one removable chip per applied filter and "Clear all" on the right). The button opens an inline panel
 * of seven labelled selects. RP-01: each chip removes only its own filter (accessible name "Remove filter {label} {value}"),
 * and removing the cohort removes its group because the group select is disabled without a cohort.
 */
export function ReportFilters({ db, filters, onChange, onClear }: ReportFiltersProps) {
  const [open, setOpen] = React.useState(false)
  const panelId = React.useId()
  const groupRef = React.useRef<HTMLDivElement>(null)
  const pendingFocus = React.useRef<number | null>(null)
  const applied = FILTER_ORDER.filter((k) => filters[k])

  React.useEffect(() => {
    if (pendingFocus.current === null) return
    const buttons = Array.from(groupRef.current?.querySelectorAll<HTMLButtonElement>("[data-chip-remove]") ?? [])
    const target = buttons[Math.min(pendingFocus.current, buttons.length - 1)] ?? groupRef.current?.querySelector<HTMLButtonElement>("[data-filters-toggle]")
    pendingFocus.current = null
    target?.focus()
  }, [filters])

  const remove = (key: FilterKey, index: number) => {
    pendingFocus.current = index
    onChange(key, undefined)
  }

  return (
    <Card className="gap-0 py-0" data-testid="filters-card">
      <CardContent className="p-0">
      <div ref={groupRef} role="group" aria-label="Filter bar" className="flex min-h-12 flex-wrap items-center gap-2 px-3 py-2">
        <Button type="button" variant="outline" size="sm" data-filters-toggle="" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((o) => !o)}>
          <i className="fa-light fa-filter" aria-hidden="true" />
          {r4.filters.button}
          {applied.length > 0 ? (
            <Badge variant="default" aria-label={r4.filters.countAria(applied.length)}>
              {applied.length}
            </Badge>
          ) : null}
          <i className={`fa-light ${open ? "fa-chevron-up" : "fa-chevron-down"}`} aria-hidden="true" />
        </Button>
        {applied.length === 0 ? (
          <p className="text-xs text-muted-foreground">{r4.filters.showingEverything}</p>
        ) : (
          <>
            <ul className="flex flex-wrap items-center gap-2" aria-label="Applied filters">
              {applied.map((key, i) => {
                const value = filterValueLabel(db, key, filters)
                return (
                  <li key={key}>
                    <Badge variant="outline" className="gap-1 pe-1">
                      <span>{value}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        data-chip-remove=""
                        aria-label={surface.s01.removeFilter(LABEL[key], value)}
                        onClick={() => remove(key, i)}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace" || e.key === "Delete") {
                            e.preventDefault()
                            remove(key, i)
                          }
                        }}
                      >
                        <i className="fa-light fa-xmark" aria-hidden="true" />
                      </Button>
                    </Badge>
                  </li>
                )
              })}
            </ul>
            <Button type="button" variant="link" size="sm" className="ms-auto" onClick={onClear}>
              {r4.filters.clearAll}
            </Button>
          </>
        )}
      </div>
      {open ? (
        <div id={panelId} role="region" aria-label={r4.filters.panelLabel} className="grid grid-cols-1 gap-x-4 gap-y-3 border-t border-border px-3 py-3 sm:grid-cols-2 lg:grid-cols-4">
          {FILTER_ORDER.map((key) => {
            const options = filterOptions(db, key, filters)
            const disabled = key === "groupId" && !filters.cohortId
            const id = `${panelId}-${key}`
            const hint = HINT[key]
            return (
              <div key={key} className="flex flex-col gap-1">
                <Label htmlFor={id}>{LABEL[key]}</Label>
                <Select value={filters[key] ?? ALL} disabled={disabled} onValueChange={(v) => onChange(key, v === ALL ? undefined : v)}>
                  <SelectTrigger id={id} size="sm" className="w-full" aria-describedby={hint ? `${id}-hint` : undefined}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>{ALL_LABEL[key]}</SelectItem>
                    {options.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {hint && (key !== "groupId" || disabled) ? (
                  <p id={`${id}-hint`} className="text-xs text-muted-foreground">
                    {hint}
                  </p>
                ) : null}
              </div>
            )
          })}
        </div>
      ) : null}
      </CardContent>
    </Card>
  )
}
