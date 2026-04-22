/**
 * Central exports for list-page data surfaces and shared view chrome.
 *
 * **Pattern:** `ListPageTemplate` + `DataListTable` — one `useTableState`, one toolbar,
 * table | list | board | dashboard from the same component (`AGENTS.md` §4, `docs/data-views-pattern.md`).
 *
 * **View UI:** `ViewSegmentedControl` matches the template’s views toolbar (`bg-muted/60` pills).
 */

export { DataListTable } from "@/components/data-list-table"
export type { DataListTableProps, DataListTableHandle } from "@/components/data-list-table"
export type { PlacementLifecycleTabId } from "@/lib/placement-lifecycle"
export type { DataListViewType } from "@/lib/data-list-view"
export { DATA_LIST_VIEW_TILES, dataListViewIcon, dataListViewLabel } from "@/lib/data-list-view"

export {
  ListPageTemplate,
  type ViewTab,
  type ViewType,
} from "@/components/templates/list-page"

export {
  ViewSegmentedControl,
  viewSegmentedToolbarClass,
  viewSegmentedButtonClass,
  type ViewSegmentOption,
} from "@/components/ui/view-segmented-control"
