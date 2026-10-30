"use client"

/**
 * The one toolbar of a dashboard drill list (D-L8b, Romit 2026-10-30; anatomy A4, A9): the scope Filters group (with its
 * removable chips and Clear all, REQ RP-01), the drill's own condition chips, then the list search at the end of the same row.
 * The table's own query controls stay off, so the list has one filter entry and one search, not two filter systems.
 */
import * as React from "react"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Label } from "@exxatdesignux/ui/components/ui/label"

export function DrillToolbar({ id, filters, query, onQuery, children }: { id: string; filters?: React.ReactNode; query?: string; onQuery?: (q: string) => void; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2" data-region="toolbar" data-drill-toolbar>
      {filters}
      {children}
      {onQuery ? (
        // Below md the search takes its own full-width line (2026-10-30); from md it ends the toolbar row at 14rem.
        <span className="flex w-full items-center gap-2 md:ms-auto md:w-auto">
          <Label htmlFor={id} className="sr-only">Search the list</Label>
          <Input id={id} type="search" value={query ?? ""} onChange={(e) => onQuery(e.target.value)} placeholder="Search" className="h-8 w-full md:w-56" />
        </span>
      ) : null}
    </div>
  )
}
