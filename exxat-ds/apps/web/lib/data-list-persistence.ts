/**
 * Persist Data list page UI: per-page shell (tabs, display options) and per–lifecycle-tab table state.
 * Keys are versioned so future migrations can bump `v` or the key suffix.
 */

import type { Dispatch, SetStateAction } from "react"
import type { RowHeight } from "@/lib/row-height"
import type { DataListDisplayOptions } from "@/lib/data-list-display-options"
import type { ActiveFilter, ConditionalRule, SortRule } from "@/components/table-properties/types"
import type { ViewTab } from "@/components/templates/list-page"
import type { DataListViewType } from "@/lib/data-list-view"

export const DATA_LIST_PAGE_STORAGE_KEY = "exxat-ds:data-list:page:v1"

export function lifecycleStorageKey(lifecycleTabId: string): string {
  return `exxat-ds:data-list:lifecycle:v1:${lifecycleTabId}`
}

const LIFECYCLE_SAVE_DEBOUNCE_MS = 400
const PAGE_SAVE_DEBOUNCE_MS = 400

const lifecycleTimers = new Map<string, ReturnType<typeof setTimeout>>()
const pageTimer: { t?: ReturnType<typeof setTimeout> } = {}

export interface PersistedLifecycleV1 {
  v: 1
  sortRules: SortRule[]
  search: string
  activeFilters: ActiveFilter[]
  filterConnectors: Record<string, "and" | "or">
  groupBy: string | null
  colOrder: string[]
  hiddenCols: string[]
  colWidths: Record<string, number>
  colPins: Record<string, "left" | "right">
  colWrap: Record<string, boolean>
  colMenuSearch: Record<string, string>
  rowHeight: RowHeight
  showGridlines: boolean
  filterBarVisible: boolean
  searchOpen: boolean
  conditionalRules: ConditionalRule[]
  pagination: boolean
  paginationPage: number
  paginationPageSize: number
}

export interface PersistedPageV1 {
  v: 1
  displayOptions: DataListDisplayOptions
  showMetrics: boolean
  tabs: ViewTab[]
  activeTabId: string
}

/** Narrow surface used to hydrate / snapshot table state without importing the hook implementation. */
export interface TableStatePersistSlice {
  sortRules: SortRule[]
  search: string
  activeFilters: ActiveFilter[]
  filterConnectors: Record<string, "and" | "or">
  groupBy: string | null
  colOrder: string[]
  hiddenCols: Set<string>
  colWidths: Record<string, number>
  colPins: Record<string, "left" | "right">
  colWrap: Record<string, boolean>
  colMenuSearch: Record<string, string>
  rowHeight: RowHeight
  showGridlines: boolean
  filterBarVisible: boolean
  searchOpen: boolean
  setSortRules: Dispatch<SetStateAction<SortRule[]>>
  setSearch: Dispatch<SetStateAction<string>>
  setActiveFilters: Dispatch<SetStateAction<ActiveFilter[]>>
  setFilterConnectors: Dispatch<SetStateAction<Record<string, "and" | "or">>>
  setGroupBy: Dispatch<SetStateAction<string | null>>
  setColOrder: Dispatch<SetStateAction<string[]>>
  setHiddenCols: Dispatch<SetStateAction<Set<string>>>
  setColWidths: Dispatch<SetStateAction<Record<string, number>>>
  setColPins: Dispatch<SetStateAction<Record<string, "left" | "right">>>
  setColWrap: Dispatch<SetStateAction<Record<string, boolean>>>
  setColMenuSearch: Dispatch<SetStateAction<Record<string, string>>>
  setRowHeight: Dispatch<SetStateAction<RowHeight>>
  setShowGridlines: Dispatch<SetStateAction<boolean>>
  setFilterBarVisible: Dispatch<SetStateAction<boolean>>
  setSearchOpen: Dispatch<SetStateAction<boolean>>
}

const VIEW_TYPES: DataListViewType[] = ["table", "list", "board", "dashboard"]

function isViewType(v: unknown): v is DataListViewType {
  return typeof v === "string" && (VIEW_TYPES as string[]).includes(v)
}

function parseViewTab(raw: unknown): ViewTab | null {
  if (!raw || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  if (typeof o.id !== "string" || typeof o.label !== "string") return null
  if (!isViewType(o.viewType)) return null
  if (typeof o.icon !== "string" || typeof o.filterId !== "string") return null
  return {
    id: o.id,
    label: o.label,
    viewType: o.viewType,
    icon: o.icon,
    filterId: o.filterId,
  }
}

export function parsePersistedPage(raw: string | null): PersistedPageV1 | null {
  if (!raw) return null
  try {
    const j = JSON.parse(raw) as unknown
    if (!j || typeof j !== "object") return null
    const o = j as Record<string, unknown>
    if (o.v !== 1) return null
    if (!o.displayOptions || typeof o.displayOptions !== "object") return null
    if (typeof o.showMetrics !== "boolean") return null
    if (!Array.isArray(o.tabs) || typeof o.activeTabId !== "string") return null
    const tabs = o.tabs.map(parseViewTab).filter((t): t is ViewTab => t !== null)
    if (tabs.length === 0) return null
    return {
      v: 1,
      displayOptions: o.displayOptions as DataListDisplayOptions,
      showMetrics: o.showMetrics,
      tabs,
      activeTabId: o.activeTabId,
    }
  } catch {
    return null
  }
}

export function parsePersistedLifecycle(raw: string | null): PersistedLifecycleV1 | null {
  if (!raw) return null
  try {
    const j = JSON.parse(raw) as unknown
    if (!j || typeof j !== "object") return null
    const o = j as Record<string, unknown>
    if (o.v !== 1) return null
    if (!Array.isArray(o.sortRules)) return null
    if (typeof o.search !== "string") return null
    if (!Array.isArray(o.activeFilters)) return null
    if (!o.filterConnectors || typeof o.filterConnectors !== "object") return null
    if (o.groupBy !== null && typeof o.groupBy !== "string") return null
    if (!Array.isArray(o.colOrder)) return null
    if (!Array.isArray(o.hiddenCols)) return null
    if (!o.colWidths || typeof o.colWidths !== "object") return null
    if (!o.colPins || typeof o.colPins !== "object") return null
    if (!o.colWrap || typeof o.colWrap !== "object") return null
    if (!o.colMenuSearch || typeof o.colMenuSearch !== "object") return null
    if (typeof o.rowHeight !== "string") return null
    if (typeof o.showGridlines !== "boolean") return null
    if (typeof o.filterBarVisible !== "boolean") return null
    if (typeof o.searchOpen !== "boolean") return null
    if (!Array.isArray(o.conditionalRules)) return null
    if (typeof o.pagination !== "boolean") return null
    if (typeof o.paginationPage !== "number" || typeof o.paginationPageSize !== "number") return null
    return o as unknown as PersistedLifecycleV1
  } catch {
    return null
  }
}

function mergeColOrder(saved: string[], columnKeys: Set<string>): string[] {
  const ordered = saved.filter(k => columnKeys.has(k))
  for (const k of columnKeys) {
    if (!ordered.includes(k)) ordered.push(k)
  }
  return ordered
}

function filterRecordKeys<T extends Record<string, unknown>>(obj: T, keys: Set<string>): T {
  const out = { ...obj }
  for (const k of Object.keys(out)) {
    if (!keys.has(k)) delete out[k]
  }
  return out
}

export function applyLifecyclePersisted(
  ts: TableStatePersistSlice,
  p: PersistedLifecycleV1,
  columnKeys: Set<string>,
): void {
  const colOrder = mergeColOrder(p.colOrder, columnKeys)
  const hidden = new Set(p.hiddenCols.filter(k => columnKeys.has(k)))
  const colWidths = filterRecordKeys(p.colWidths, columnKeys) as Record<string, number>
  const colPins = filterRecordKeys(p.colPins, columnKeys) as Record<string, "left" | "right">
  const colWrap = filterRecordKeys(p.colWrap, columnKeys) as Record<string, boolean>
  const colMenuSearch = filterRecordKeys(p.colMenuSearch, columnKeys) as Record<string, string>

  ts.setSortRules(p.sortRules)
  ts.setSearch(p.search)
  ts.setActiveFilters(p.activeFilters)
  ts.setFilterConnectors(p.filterConnectors)
  ts.setGroupBy(p.groupBy)
  ts.setColOrder(colOrder)
  ts.setHiddenCols(hidden)
  ts.setColWidths(colWidths)
  ts.setColPins(colPins)
  ts.setColWrap(colWrap)
  ts.setColMenuSearch(colMenuSearch)
  ts.setRowHeight(p.rowHeight)
  ts.setShowGridlines(p.showGridlines)
  ts.setFilterBarVisible(p.filterBarVisible)
  ts.setSearchOpen(p.searchOpen)
}

export function serializeLifecycle(
  ts: TableStatePersistSlice,
  extras: {
    conditionalRules: ConditionalRule[]
    pagination: boolean
    paginationPage: number
    paginationPageSize: number
  },
): PersistedLifecycleV1 {
  return {
    v: 1,
    sortRules: ts.sortRules,
    search: ts.search,
    activeFilters: ts.activeFilters,
    filterConnectors: ts.filterConnectors,
    groupBy: ts.groupBy,
    colOrder: ts.colOrder,
    hiddenCols: [...ts.hiddenCols],
    colWidths: { ...ts.colWidths },
    colPins: { ...ts.colPins },
    colWrap: { ...ts.colWrap },
    colMenuSearch: { ...ts.colMenuSearch },
    rowHeight: ts.rowHeight,
    showGridlines: ts.showGridlines,
    filterBarVisible: ts.filterBarVisible,
    searchOpen: ts.searchOpen,
    conditionalRules: extras.conditionalRules,
    pagination: extras.pagination,
    paginationPage: extras.paginationPage,
    paginationPageSize: extras.paginationPageSize,
  }
}

export function loadLifecycleFromStorage(lifecycleTabId: string): PersistedLifecycleV1 | null {
  if (typeof window === "undefined") return null
  return parsePersistedLifecycle(localStorage.getItem(lifecycleStorageKey(lifecycleTabId)))
}

export function scheduleLifecycleSave(lifecycleTabId: string, payload: PersistedLifecycleV1): void {
  if (typeof window === "undefined") return
  const prev = lifecycleTimers.get(lifecycleTabId)
  if (prev) clearTimeout(prev)
  const t = setTimeout(() => {
    lifecycleTimers.delete(lifecycleTabId)
    try {
      localStorage.setItem(lifecycleStorageKey(lifecycleTabId), JSON.stringify(payload))
    } catch {
      /* quota / private mode */
    }
  }, LIFECYCLE_SAVE_DEBOUNCE_MS)
  lifecycleTimers.set(lifecycleTabId, t)
}

export function loadPageFromStorage(): PersistedPageV1 | null {
  if (typeof window === "undefined") return null
  return parsePersistedPage(localStorage.getItem(DATA_LIST_PAGE_STORAGE_KEY))
}

export function schedulePageSave(payload: PersistedPageV1): void {
  if (typeof window === "undefined") return
  if (pageTimer.t) clearTimeout(pageTimer.t)
  pageTimer.t = setTimeout(() => {
    pageTimer.t = undefined
    try {
      localStorage.setItem(DATA_LIST_PAGE_STORAGE_KEY, JSON.stringify(payload))
    } catch {
      /* quota */
    }
  }, PAGE_SAVE_DEBOUNCE_MS)
}
