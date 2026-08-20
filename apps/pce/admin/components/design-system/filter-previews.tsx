"use client"

import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  FilterBar,
  FilterBarAddButton,
  FilterBarClearButton,
} from "@/components/ui/filter-bar"
import { FilterButton } from "@/components/ui/filter-button"
import { cn } from "@/lib/utils"

function MockFilterPill({
  label,
  value,
  active = true,
}: {
  label: string
  value: string
  active?: boolean
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded border text-xs",
        active ? "border-brand/45 bg-brand/10" : "border-input bg-background",
      )}
    >
      <span className="inline-flex h-6 items-center gap-1 rounded-s ps-2 pe-1.5">
        <i className="fa-light fa-filter text-xs text-brand" aria-hidden="true" />
        <span>{label}</span>
        {active ? <span className="font-medium">{value}</span> : null}
      </span>
      <span className="inline-flex h-6 w-5 items-center justify-center text-muted-foreground">
        <i className="fa-light fa-xmark text-xs" aria-hidden="true" />
      </span>
    </div>
  )
}

export function FilterButtonPreview() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <FilterButton aria-label="Add filter" />
      <FilterButton activeCount={1} aria-label="Filters (1 active)" />
      <FilterButton activeCount={3} highlighted={false} aria-label="Filters (3 active), bar hidden" />
    </div>
  )
}

export function FilterButtonCountOverlayPreview() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground">Hub filter trigger</p>
        <FilterButton activeCount={1} />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground">Notification trigger (same overlay pattern)</p>
        <span className="relative inline-flex size-8 items-center justify-center">
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Notifications, 3 unread">
            <i className="fa-light fa-bell" aria-hidden="true" />
          </Button>
          <Badge variant="count" className="pointer-events-none absolute -end-1.5 -top-1.5 z-10 h-4 min-w-4 justify-center rounded-full border-transparent px-1 py-0">
            3
          </Badge>
        </span>
      </div>
    </div>
  )
}

export function FilterBarPreview() {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-3 rounded-lg border border-border bg-background p-3">
      <FilterBar>
        <MockFilterPill label="Status" value="Active" />
        <MockFilterPill label="Program" value="PT 2026" />
        <FilterBarAddButton type="button" />
        <FilterBarClearButton type="button" />
      </FilterBar>
      <div className="flex items-center justify-end gap-1.5 border-t border-border pt-2">
        <div className="h-4 w-px bg-border/70" aria-hidden="true" />
        <FilterButton activeCount={2} />
      </div>
    </div>
  )
}
