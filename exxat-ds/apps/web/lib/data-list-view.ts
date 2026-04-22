/**
 * Data list “view type” — shared by Properties drawer, ListPageTemplate tabs, and client state.
 *
 * **Single source of truth** for view labels/icons: use `DATA_LIST_VIEW_TILES` and
 * `dataListViewLabel` / `dataListViewIcon` on every page so Table / List / Board / Dashboard
 * stay consistent and stay wired to the same `useTableState` dataset (see `docs/data-views-pattern.md`).
 */
export type DataListViewType = "table" | "list" | "board" | "dashboard"

export const DATA_LIST_VIEW_TILES: readonly {
  value: DataListViewType
  label: string
  icon: string
}[] = [
  { value: "table",     icon: "fa-table",         label: "Table view" },
  { value: "list",      icon: "fa-list",         label: "List view" },
  { value: "board",     icon: "fa-table-columns", label: "Board view" },
  { value: "dashboard", icon: "fa-chart-mixed",  label: "Dashboard view" },
]

/** User-facing name for tabs, Properties summary rows, and tooltips (not entity-specific). */
export function dataListViewLabel(view: DataListViewType): string {
  return DATA_LIST_VIEW_TILES.find(t => t.value === view)?.label ?? view
}

/** Font Awesome icon class (no prefix) for tab / toolbar state when view changes. */
export function dataListViewIcon(view: DataListViewType): string {
  return DATA_LIST_VIEW_TILES.find(t => t.value === view)?.icon ?? "fa-table"
}
