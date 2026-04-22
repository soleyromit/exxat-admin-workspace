"use client"

// ─────────────────────────────────────────────────────────────────────────────
// Generic DataTable — shared types
// ─────────────────────────────────────────────────────────────────────────────

import type * as React from "react"
import type { FilterOperator, ConditionalRule } from "@/components/table-properties/types"
export type { ConditionalRule }

export type SortDir = "asc" | "desc"

export interface ColumnDef<TData> {
  /** Unique key — must match a key of TData or be synthetic (e.g. "select", "actions") */
  key: string
  /** Header label */
  label: string
  /** Default width in px */
  width?: number
  minWidth?: number
  /** Whether this column can be sorted */
  sortable?: boolean
  /**
   * Key of TData used for sorting comparisons.
   * If omitted but sortable=true, falls back to `key`.
   */
  sortKey?: keyof TData & string
  /** Pin to left or right by default */
  defaultPin?: "left" | "right"
  /** If true, user cannot unpin this column */
  lockPin?: boolean
  /** Render the cell content. If omitted, renders String(row[key]). */
  cell?: (row: TData, ctx: CellContext<TData>) => React.ReactNode
  /** Custom header renderer — overrides the default label text */
  header?: () => React.ReactNode
  /** Filter config — drives per-column "Filter by this column" option */
  filter?: {
    type: "select" | "text" | "date"
    /** icon class for filter pills, e.g. "fa-circle-dot" */
    icon?: string
    options?: { value: string; label: string }[]
    operators?: FilterOperator[]
  }
}

export interface CellContext<TData> {
  rowIndex: number
  selected: boolean
  onSelect: (selected: boolean) => void
}

export interface DataTableProps<TData extends Record<string, unknown>> {
  /** Row data */
  data: TData[]
  /** Column definitions */
  columns: ColumnDef<TData>[]
  /** Returns a stable unique ID for each row (used for selection keys) */
  getRowId?: (row: TData, index: number) => string | number
  /**
   * Accessible name for each row’s selection checkbox (e.g. primary column value).
   * If omitted, a generic label is used.
   */
  getRowSelectionLabel?: (row: TData, rowIndex: number) => string
  /** Enable row selection checkboxes */
  selectable?: boolean
  /** Enable global search */
  searchable?: boolean
  /** Enable "Group by" feature */
  groupable?: boolean
  /** Custom empty state */
  emptyState?: React.ReactNode
  /** Called when a row is clicked */
  onRowClick?: (row: TData) => void
  /** Default sort */
  defaultSort?: { key: string; dir: SortDir }
  /** Conditional formatting rules — apply bg color to cells based on value */
  conditionalRules?: ConditionalRule[]
}

export interface PaginationConfig {
  /** Rows per page. Default 10. */
  pageSize?: number
  /** Options shown in the page-size selector. Default [10, 25, 50, 100]. */
  pageSizeOptions?: number[]
}
