/**
 * Connects ListPageTemplate “View → Edit” to a surface that hosts TablePropertiesDrawer
 * (DataListTable, TeamTable, ComplianceTable, …). Import from `@/components/table-properties`
 * or use here — see `createListPageEditViewHandler`.
 *
 * View **labels** for tabs and Properties are centralized in `@/lib/data-list-view`
 * (`DATA_LIST_VIEW_TILES`, `dataListViewLabel`, `dataListViewIcon`).
 */

import * as React from "react"

import { dataListViewIcon, type DataListViewType } from "@/lib/data-list-view"

/** Minimal ref API any list/table surface exposes for the shared Properties drawer. */
export interface OpenTablePropertiesHandle {
  openPropertiesDrawer: () => void
}

const SURFACE_VIEW_TYPES = new Set<DataListViewType>(["table", "list", "board", "dashboard"])

/** True when `viewType` is one of the data-list surfaces that support TablePropertiesDrawer. */
export function isDataListSurfaceViewType(viewType: string): viewType is DataListViewType {
  return SURFACE_VIEW_TYPES.has(viewType as DataListViewType)
}

export interface CreateListPageEditViewHandlerOptions {
  /** Delay before opening Properties after switching to table (ms). Default 160. */
  switchDelayMs?: number
}

/**
 * Returns `ListPageTemplate`’s `onEditView` handler: optionally coerces the tab to `table`
 * when the view type is unknown, then calls `ref.current.openPropertiesDrawer()`.
 */
export function createListPageEditViewHandler(
  tableRef: React.RefObject<OpenTablePropertiesHandle | null>,
  options?: CreateListPageEditViewHandlerOptions
) {
  const delay = options?.switchDelayMs ?? 160
  return (
    tab: { viewType: string },
    { updateTab }: { updateTab: (patch: { viewType?: DataListViewType; icon?: string }) => void }
  ) => {
    const mustSwitchToTableSurface = !isDataListSurfaceViewType(tab.viewType)
    if (mustSwitchToTableSurface) {
      updateTab({ viewType: "table", icon: dataListViewIcon("table") })
    }
    window.setTimeout(() => {
      tableRef.current?.openPropertiesDrawer()
    }, mustSwitchToTableSurface ? delay : 0)
  }
}
