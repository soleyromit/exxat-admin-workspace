/**
 * Maps `DataListViewType` to the UI surface pattern for list pages.
 *
 * **Data:** One `useTableState(fullRows, columns, …)` per tab; **filtered/sorted rows**
 * (`tableState.rows`) are the single source of truth for List, Board, and Dashboard.
 * Table view renders the same state via `DataTable`.
 *
 * | View        | Surface |
 * |------------|---------|
 * | `table`    | `DataTable` |
 * | `list`     | `DataTableToolbar` + list layout |
 * | `board`    | `DataTableToolbar` + board / kanban |
 * | `dashboard`| `DataTableToolbar` + KPI (`KeyMetrics`) + optional charts (`ChartCard`, Recharts, etc.) |
 */

import type { DataListViewType } from "@/lib/data-list-view"

/** What to render for the active view tab (routing / branching). */
export type DataListViewRenderKind =
  | "data-table"
  | "list-with-toolbar"
  | "board-with-toolbar"
  | "dashboard-with-toolbar"

/**
 * Stable classification for switch/if chains. **Every** `DataListViewType` maps to exactly one kind.
 * Use this so `dashboard` is never mistaken for `board` (a common bug when only `list` is special-cased).
 */
export function getDataListViewRenderKind(view: DataListViewType): DataListViewRenderKind {
  switch (view) {
    case "table":
      return "data-table"
    case "list":
      return "list-with-toolbar"
    case "board":
      return "board-with-toolbar"
    case "dashboard":
      return "dashboard-with-toolbar"
    default: {
      const _x: never = view
      return _x
    }
  }
}

export function usesDataTableComponent(view: DataListViewType): boolean {
  return view === "table"
}

/** KPI band + optional charts — not the kanban board. */
export function usesDashboardSurface(view: DataListViewType): boolean {
  return view === "dashboard"
}

/** Shared toolbar (search, filters, properties); body differs by view. */
export function usesToolbarWithFilteredRows(view: DataListViewType): boolean {
  return view === "list" || view === "board" || view === "dashboard"
}
