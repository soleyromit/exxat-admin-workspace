"use client"

import * as React from "react"
import { DataTable } from "@exxatdesignux/ui/components/data-table"

type D<T> = { id: string; row: T }
export type V2Col<T> = { key: string; label: string; width: number; cell: (d: D<T>) => React.ReactNode }

/** One column definition: the DS DataTable hands the cell its data item, which here is `{ id, row }`. */
export const v2col = <T,>(key: string, label: string, width: number, render: (r: T) => React.ReactNode): V2Col<T> => ({ key, label, width, cell: (d) => render(d.row) })

/** Read-only DS DataTable (no query controls, no row click) used by the v2 pages. Same pattern as components/reporting/report-tables.tsx. */
export function V2Grid<T>({ caption, rows, id, columns }: { caption: string; rows: T[]; id: (r: T) => string; columns: V2Col<T>[] }) {
  const data = rows.map((row) => ({ id: id(row), row }))
  return (
    <div role="region" aria-label={caption}>
      <DataTable<D<T>> data={data as never} columns={columns as never} getRowId={(r) => String(r.id)} showQueryControls={false} searchable={false} edgeInset={false} emptyState={<p className="p-4 text-sm text-muted-foreground">Nothing to show.</p>} />
    </div>
  )
}
