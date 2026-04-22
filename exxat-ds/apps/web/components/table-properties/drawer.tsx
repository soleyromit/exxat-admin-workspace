"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import type { DataListViewType } from "@/lib/data-list-view"
import { DATA_LIST_VIEW_TILES, dataListViewLabel } from "@/lib/data-list-view"
import type { RowHeight } from "@/lib/row-height"
import { ROW_HEIGHT_TILES } from "@/lib/row-height"
import { SelectionTileGrid } from "@/components/ui/selection-tile-grid"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { DataListDisplayOptions } from "@/lib/data-list-display-options"
import { Tip } from "@/components/ui/tip"
import { ToggleSwitch } from "@/components/ui/toggle-switch"
import { Button } from "@/components/ui/button"
import { DrawerFilterCard } from "./filter-card"
import { DrawerSortCard } from "./sort-card"
import { ColumnRow } from "./column-row"
import { useDraggableList } from "./draggable-list"
import {
  type ActiveFilter,
  type SortRule,
  type ConditionalRule,
  type FilterFieldDef,
  COLUMNS,
  FILTER_FIELDS,
  RULE_COLORS,
} from "./types"

export interface TablePropertiesDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  // Display
  showGridlines: boolean
  onShowGridlinesChange: (v: boolean) => void
  rowHeight: RowHeight
  onRowHeightChange: (v: RowHeight) => void
  pagination: boolean
  onPaginationChange: (v: boolean) => void
  // Filters
  activeFilters: ActiveFilter[]
  onAddFilter: (fieldKey: string) => void
  onUpdateFilter: (id: string, patch: Partial<ActiveFilter>) => void
  onRemoveFilter: (id: string) => void
  /** How the filter after `leftFilterId` combines with the one above (default "and"). */
  getFilterConnector: (leftFilterId: string) => "and" | "or"
  onToggleFilterConnector: (leftFilterId: string) => void
  filterBarVisible: boolean
  onFilterBarVisibleChange: (v: boolean) => void
  drawerExpandedFilters: Set<string>
  onDrawerExpandedFiltersChange: React.Dispatch<React.SetStateAction<Set<string>>>
  totalRows: number
  filteredRows: number
  // Sort
  sortRules: SortRule[]
  onSortRulesChange: (rules: SortRule[]) => void
  onAddSortRule: (fieldKey: string) => void
  onRemoveSortRule: (id: string) => void
  onToggleSortDir: (id: string) => void
  // Columns
  colOrder: string[]
  onColOrderChange: (order: string[]) => void
  hiddenCols: Set<string>
  onToggleColVisibility: (key: string) => void
  onMoveCol: (key: string, dir: "up" | "down") => void
  // Group
  groupBy: string | null
  onGroupByChange: (key: string | null) => void
  // Sort key for display in main panel
  primarySortKey?: string
  // Conditional formatting
  conditionalRules: ConditionalRule[]
  onAddConditionalRule: (rule: Omit<ConditionalRule, "id">) => void
  onRemoveConditionalRule: (id: string) => void
  onUpdateConditionalRule: (id: string, patch: Partial<ConditionalRule>) => void
  /** Filter field defs for drawer + conditional rules — defaults to FILTER_FIELDS; pass column-derived defs to match the table */
  filterFields?: FilterFieldDef[]
  // View type
  currentView?: DataListViewType
  onViewChange?: (view: DataListViewType) => void
  /** Lifecycle context (e.g. tab filter) — shown in the drawer header */
  lifecycleTabLabel?: string
  /**
   * Column labels for the active table definition (placements use dynamic columns per tab).
   * When set, overrides static `COLUMNS` from types for Columns / Sort / Group labels.
   */
  fieldDefinitions?: { key: string; label: string; sortable?: boolean }[]
  resolveColumnLabel?: (key: string) => string
  /** Shared display options (table + board); persisted at page level. */
  displayOptions: DataListDisplayOptions
  onDisplayOptionsChange: (patch: Partial<DataListDisplayOptions>) => void
}

type SheetPanel = "main" | "table-display" | "filter" | "sort" | "group" | "columns" | "conditional-rules"

export function TablePropertiesDrawer({
  open,
  onOpenChange,
  showGridlines,
  onShowGridlinesChange,
  rowHeight,
  onRowHeightChange,
  pagination,
  onPaginationChange,
  activeFilters,
  onAddFilter,
  onUpdateFilter,
  onRemoveFilter,
  getFilterConnector,
  onToggleFilterConnector,
  filterBarVisible,
  onFilterBarVisibleChange,
  drawerExpandedFilters,
  onDrawerExpandedFiltersChange,
  totalRows,
  filteredRows,
  sortRules,
  onSortRulesChange,
  onAddSortRule,
  onRemoveSortRule,
  onToggleSortDir,
  colOrder,
  onColOrderChange,
  hiddenCols,
  onToggleColVisibility,
  onMoveCol,
  groupBy,
  onGroupByChange,
  primarySortKey,
  conditionalRules,
  onAddConditionalRule,
  onRemoveConditionalRule,
  onUpdateConditionalRule,
  filterFields = FILTER_FIELDS,
  currentView,
  onViewChange,
  lifecycleTabLabel,
  fieldDefinitions,
  resolveColumnLabel: resolveColumnLabelProp,
  displayOptions,
  onDisplayOptionsChange,
}: TablePropertiesDrawerProps) {
  const [sheetPanel, setSheetPanel] = React.useState<SheetPanel>("main")

  // Reset to main panel when drawer is closed
  React.useEffect(() => {
    if (!open) setSheetPanel("main")
  }, [open])

  const resolveColumnLabel = React.useCallback(
    (key: string) =>
      resolveColumnLabelProp?.(key)
      ?? COLUMNS.find(c => c.key === key)?.label
      ?? key,
    [resolveColumnLabelProp],
  )

  const sortFieldList = React.useMemo(() => {
    if (fieldDefinitions?.length) {
      return fieldDefinitions.filter(f => f.sortable !== false && f.key !== "select" && f.key !== "actions")
    }
    return COLUMNS.filter(c => c.sortable && c.sortKey).map(c => ({ key: c.key, label: c.label, sortable: true }))
  }, [fieldDefinitions])

  const groupFieldList = React.useMemo(() => {
    if (fieldDefinitions?.length) {
      return fieldDefinitions.filter(f => f.key !== "select" && f.key !== "actions")
    }
    return COLUMNS.filter(c => c.key !== "select" && c.key !== "actions")
  }, [fieldDefinitions])

  const viewSurface = currentView ?? "table"
  const isBoardView = viewSurface === "board"
  const viewDisplayLabel = dataListViewLabel(viewSurface)
  const viewDisplayDesc = (() => {
    if (viewSurface === "board") {
      return [
        `${displayOptions.boardLineCount}-line`,
        displayOptions.showColumnLabels ? "Column labels" : "No labels",
      ].join(" · ")
    }
    if (viewSurface === "list") {
      return [
        displayOptions.showColumnLabels ? "Column labels" : "No labels",
        displayOptions.showToolbarSearch ? "Toolbar search" : "No search",
      ].join(" · ")
    }
    if (viewSurface === "dashboard") {
      return "Charts · KPI metrics"
    }
    return [showGridlines ? "Gridlines" : null, pagination ? "Paginated" : null].filter(Boolean).join(" · ") || "Default"
  })()
  const viewDisplayIcon =
    DATA_LIST_VIEW_TILES.find(t => t.value === viewSurface)?.icon ?? "fa-table"

  // ── Sort drag-and-drop ────────────────────────────────────────────────────
  const sortDrag = useDraggableList(sortRules, r => r.id, onSortRulesChange)

  // ── Columns drag-and-drop ─────────────────────────────────────────────────
  const orderable = colOrder.filter(k => k !== "select" && k !== "actions")
  const colDrag = useDraggableList(
    orderable,
    k => k,
    newOrder => onColOrderChange(["select", ...newOrder, "actions"]),
  )

  // Current primary sort label for display in main panel
  const primarySortLabel = primarySortKey
    ? resolveColumnLabel(primarySortKey)
    : sortRules[0]?.fieldKey
      ? resolveColumnLabel(sortRules[0].fieldKey)
      : "—"

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        showOverlay={false}
        className="w-80 sm:max-w-80 p-0 gap-0 flex flex-col border border-border shadow-xl rounded-xl overflow-hidden"
        style={{ top: "0.5rem", bottom: "0.5rem", right: "0.5rem", height: "calc(100vh - 1rem)" }}
      >

        {sheetPanel === "main" ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-4 pt-5 pb-3">
              <div className="min-w-0">
                <SheetTitle className="text-base font-semibold leading-tight">Properties</SheetTitle>
                {lifecycleTabLabel ? (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate" title={lifecycleTabLabel}>
                    {lifecycleTabLabel}
                  </p>
                ) : null}
              </div>
              <Tip label="Close" side="bottom">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Close"
                  onClick={() => onOpenChange(false)}
                >
                  <i className="fa-light fa-xmark text-[13px]" aria-hidden="true" />
                </Button>
              </Tip>
            </div>

            {/* View type switcher — card tiles like export file format */}
            {onViewChange && currentView && (
              <div className="px-4 pb-3">
                <SelectionTileGrid<DataListViewType>
                  sectionLabel="View type"
                  options={DATA_LIST_VIEW_TILES}
                  columns={4}
                  value={currentView}
                  onValueChange={onViewChange}
                  interaction="button"
                  idPrefix="props-view"
                />
              </div>
            )}

            {/* Option list — inset rows + rounded hover (not edge-to-edge) */}
            <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
              {([
                {
                  id: "table-display" as SheetPanel,
                  icon: viewDisplayIcon,
                  label: viewDisplayLabel,
                  desc: viewDisplayDesc,
                },
                {
                  id: "filter" as SheetPanel,
                  icon: "fa-filter",
                  label: "Filter",
                  desc: activeFilters.length === 0
                    ? `Showing all ${filteredRows} rows.`
                    : `${activeFilters.length} filter${activeFilters.length !== 1 ? "s" : ""} active · ${filteredRows} rows.`,
                },
                {
                  id: "sort" as SheetPanel,
                  icon: "fa-arrow-up-arrow-down",
                  label: "Sort",
                  desc: `Sorted by ${primarySortLabel}.`,
                },
                {
                  id: "group" as SheetPanel,
                  icon: "fa-layer-group",
                  label: "Group",
                  desc: groupBy
                    ? `Grouped by ${resolveColumnLabel(groupBy)}.`
                    : "No grouping.",
                },
                {
                  id: "columns" as SheetPanel,
                  icon: "fa-table-columns",
                  label: "Columns",
                  desc: hiddenCols.size === 0
                    ? "All columns visible."
                    : `${hiddenCols.size} column${hiddenCols.size !== 1 ? "s" : ""} hidden.`,
                },
                {
                  id: "conditional-rules" as SheetPanel,
                  icon: "fa-palette",
                  label: "Conditional rules",
                  desc: conditionalRules.length === 0
                    ? "No rules applied."
                    : `${conditionalRules.length} rule${conditionalRules.length !== 1 ? "s" : ""} active.`,
                },
              ] as { id: SheetPanel; icon: string; label: string; desc: string }[]).map(item => (
                <Button
                  key={item.id}
                  type="button"
                  variant="ghost"
                  onClick={() => setSheetPanel(item.id)}
                  className={cn(
                    "w-full h-auto justify-start gap-3 px-3 py-3 rounded-2xl font-normal border border-transparent",
                    "hover:bg-muted/60 hover:text-foreground",
                    "focus-visible:bg-muted/60 focus-visible:text-foreground",
                  )}
                >
                  <span className="inline-flex items-center justify-center size-9 rounded-lg bg-secondary border border-border shrink-0">
                    <i className={`fa-light ${item.icon} text-[15px] text-secondary-foreground`} aria-hidden="true" />
                  </span>
                  <span className="flex-1 min-w-0 text-left">
                    <span className="block text-sm font-medium text-foreground">{item.label}</span>
                    <span className="block text-xs text-muted-foreground mt-0.5">{item.desc}</span>
                  </span>
                  <i className="fa-light fa-chevron-right text-xs text-muted-foreground shrink-0" aria-hidden="true" />
                </Button>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Sub-panel header — back + title stack as one cluster; close aligns to row center */}
            <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Tip label="Back to Properties" side="bottom">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0"
                    aria-label="Back to Properties"
                    onClick={() => setSheetPanel("main")}
                  >
                    <i className="fa-light fa-chevron-left text-[13px]" aria-hidden="true" />
                  </Button>
                </Tip>
                <div className="min-w-0">
                  <SheetTitle className="text-base font-semibold text-foreground leading-tight flex items-center gap-1.5">
                    {{
                      "table-display":     viewDisplayLabel,
                      filter:              "Filter",
                      sort:                "Sort",
                      group:               "Group",
                      columns:             "Columns",
                      "conditional-rules": "Conditional rules",
                      main:                "",
                    }[sheetPanel]}
                    {sheetPanel === "filter" && (
                      <i className="fa-light fa-circle-question text-xs text-muted-foreground" aria-hidden="true" />
                    )}
                  </SheetTitle>
                  {sheetPanel === "filter" && (
                    <p
                      className="text-xs text-muted-foreground mt-0.5"
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      {activeFilters.length === 0
                        ? `Showing all ${filteredRows} rows`
                        : `${filteredRows} of ${totalRows} rows match · ${activeFilters.length} filter${activeFilters.length !== 1 ? "s" : ""} active`}
                    </p>
                  )}
                </div>
              </div>
              <Tip label="Close" side="bottom">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0"
                  aria-label="Close panel"
                  onClick={() => onOpenChange(false)}
                >
                  <i className="fa-light fa-xmark text-[13px]" aria-hidden="true" />
                </Button>
              </Tip>
            </div>

            <div className="flex-1 overflow-y-auto">

              {/* ── Table / Board display ── */}
              {sheetPanel === "table-display" && (
                <div className="p-4 space-y-5">
                  {isBoardView ? (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {dataListViewLabel("board")} groups rows into columns. Sort, filter, and column settings apply to the same dataset as other views (e.g. Table view).
                    </p>
                  ) : null}

                  {viewSurface === "table" ? (
                    <>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Appearance</p>
                        <div className="space-y-1">
                          {([
                            { id: "gridlines",   icon: "fa-border-all",      label: "Gridlines",  checked: showGridlines, onChange: onShowGridlinesChange },
                            { id: "pagination",  icon: "fa-table-list",      label: "Pagination", checked: pagination,    onChange: onPaginationChange    },
                          ] as { id: string; icon: string; label: string; checked: boolean; onChange: (v: boolean) => void }[]).map(row => (
                            <div key={row.id} className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-2.5 text-sm">
                                <i className={`fa-light ${row.icon} text-muted-foreground w-4 text-center`} aria-hidden="true" />
                                <label htmlFor={`toggle-${row.id}`} className="cursor-pointer select-none">{row.label}</label>
                              </div>
                              <ToggleSwitch id={`toggle-${row.id}`} checked={row.checked} onChange={row.onChange} />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-border pt-4">
                        <SelectionTileGrid<RowHeight>
                          sectionLabel="Row height"
                          options={ROW_HEIGHT_TILES}
                          columns={3}
                          value={rowHeight}
                          onValueChange={onRowHeightChange}
                          interaction="button"
                          idPrefix="row-height"
                        />
                      </div>
                    </>
                  ) : null}

                  <div
                    className={cn(
                      "space-y-3",
                      (viewSurface === "board" || viewSurface === "table") && "border-t border-border pt-4",
                    )}
                  >
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Display options</p>
                    <div className="space-y-1">
                      {isBoardView && (
                        <div className="flex items-center justify-between gap-2 py-2">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className="inline-flex items-center justify-center size-9 rounded-lg bg-secondary border border-border shrink-0">
                              <i className="fa-light fa-file-lines text-[15px] text-secondary-foreground" aria-hidden="true" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground leading-tight">Line count</p>
                            </div>
                          </div>
                          <Select
                            value={String(displayOptions.boardLineCount)}
                            onValueChange={v =>
                              onDisplayOptionsChange({ boardLineCount: Number(v) as 1 | 2 | 3 })}
                          >
                            <SelectTrigger size="sm" className="w-[6.5rem] shrink-0" id="board-line-count" aria-label="Line count">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent align="end">
                              <SelectItem value="1">1 line</SelectItem>
                              <SelectItem value="2">2 lines</SelectItem>
                              <SelectItem value="3">3 lines</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {viewSurface === "table" && (
                        <div className="flex items-center justify-between gap-2 py-2">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className="inline-flex items-center justify-center size-9 rounded-lg bg-secondary border border-border shrink-0">
                              <i className="fa-light fa-font text-[15px] text-secondary-foreground" aria-hidden="true" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground leading-tight">Table title</p>
                              <p className="text-xs text-muted-foreground mt-0.5">Show the page heading and subtitle.</p>
                            </div>
                          </div>
                          <ToggleSwitch
                            id="toggle-view-title"
                            checked={displayOptions.showViewTitle}
                            onChange={v => onDisplayOptionsChange({ showViewTitle: v })}
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2 py-2">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className="inline-flex items-center justify-center size-9 rounded-lg bg-secondary border border-border shrink-0">
                            <i className="fa-light fa-table-columns text-[15px] text-secondary-foreground" aria-hidden="true" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground leading-tight">Column labels</p>
                            {viewSurface === "table" ? (
                              <p className="text-xs text-muted-foreground mt-0.5">Column headers in the table.</p>
                            ) : viewSurface === "list" ? (
                              <p className="text-xs text-muted-foreground mt-0.5">Column headers in the list.</p>
                            ) : null}
                          </div>
                        </div>
                        <ToggleSwitch
                          id="toggle-column-labels"
                          checked={displayOptions.showColumnLabels}
                          onChange={v => onDisplayOptionsChange({ showColumnLabels: v })}
                        />
                      </div>

                      {isBoardView && (
                        <>
                          <div className="flex items-center justify-between gap-2 py-2">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <span className="inline-flex items-center justify-center size-9 rounded-lg bg-secondary border border-border shrink-0">
                                <i className="fa-light fa-hashtag text-[15px] text-secondary-foreground" aria-hidden="true" />
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground leading-tight">Column counts</p>
                              </div>
                            </div>
                            <ToggleSwitch
                              id="toggle-board-counts"
                              checked={displayOptions.showBoardColumnCounts}
                              onChange={v => onDisplayOptionsChange({ showBoardColumnCounts: v })}
                            />
                          </div>

                          <div className="flex items-center justify-between gap-2 py-2">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <span className="inline-flex items-center justify-center size-9 rounded-lg bg-secondary border border-border shrink-0">
                                <i className="fa-light fa-square-plus text-[15px] text-secondary-foreground" aria-hidden="true" />
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground leading-tight">Above new card button</p>
                              </div>
                            </div>
                            <ToggleSwitch
                              id="toggle-new-card-above"
                              checked={displayOptions.boardNewCardAbove}
                              onChange={v => onDisplayOptionsChange({ boardNewCardAbove: v })}
                            />
                          </div>
                        </>
                      )}

                      {(viewSurface === "table" || viewSurface === "list") && (
                        <div className="flex items-center justify-between gap-2 py-2">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className="inline-flex items-center justify-center size-9 rounded-lg bg-secondary border border-border shrink-0">
                              <i className="fa-light fa-magnifying-glass text-[15px] text-secondary-foreground" aria-hidden="true" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground leading-tight">Search</p>
                              <p className="text-xs text-muted-foreground mt-0.5">Toolbar search for this view.</p>
                            </div>
                          </div>
                          <ToggleSwitch
                            id="toggle-toolbar-search"
                            checked={displayOptions.showToolbarSearch}
                            onChange={v => onDisplayOptionsChange({ showToolbarSearch: v })}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Filter ── */}
              {sheetPanel === "filter" && (
                <div className="px-4 py-4 space-y-2">
                  {activeFilters.length === 0 ? (
                    <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center size-7 rounded-lg bg-background border border-border shrink-0">
                          <i className="fa-light fa-filter text-muted-foreground text-xs" aria-hidden="true" />
                        </span>
                        <p className="text-sm font-medium text-foreground">No filters yet</p>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Use filters to show only the rows you need. With multiple filters, use <span className="font-medium text-foreground/80">and</span> or <span className="font-medium text-foreground/80">or</span> between them to control how they combine.
                      </p>
                      <div className="space-y-1.5">
                        {[
                          { icon: "fa-circle-1", text: "Click \"Add filter\" below" },
                          { icon: "fa-circle-2", text: "Choose a field to filter by" },
                          { icon: "fa-circle-3", text: "Pick a condition and value" },
                        ].map(step => (
                          <div key={step.icon} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <i className={`fa-light ${step.icon} text-muted-foreground text-xs shrink-0`} aria-hidden="true" />
                            {step.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      {activeFilters.map((f, idx) => {
                        const fieldDef = filterFields.find(fd => fd.key === f.fieldKey)
                        if (!fieldDef) return null
                        const leftId = idx > 0 ? activeFilters[idx - 1]!.id : null
                        const connector = leftId ? getFilterConnector(leftId) : "and"
                        return (
                          <React.Fragment key={f.id}>
                            {idx > 0 && leftId && (
                              <div className="flex items-center gap-2 py-1">
                                <div className="flex-1 h-px bg-border" aria-hidden="true" />
                                <Tip label="Click to switch: AND — every filter must match; OR — any matching filter is enough." side="top">
                                  <button
                                    type="button"
                                    onClick={() => onToggleFilterConnector(leftId)}
                                    className={cn(
                                      "shrink-0 rounded-md border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide transition-colors",
                                      "border-border bg-muted/40 text-muted-foreground hover:bg-interactive-hover hover:text-interactive-hover-foreground",
                                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                    )}
                                    aria-label={
                                      connector === "and"
                                        ? "Filters are combined with AND. Click to use OR instead."
                                        : "Filters are combined with OR. Click to use AND instead."
                                    }
                                  >
                                    {connector}
                                  </button>
                                </Tip>
                                <div className="flex-1 h-px bg-border" aria-hidden="true" />
                              </div>
                            )}
                            <DrawerFilterCard
                              filter={f}
                              fieldDef={fieldDef}
                              expanded={drawerExpandedFilters.has(f.id)}
                              onToggleExpand={() => onDrawerExpandedFiltersChange(prev => {
                                const next = new Set(prev)
                                next.has(f.id) ? next.delete(f.id) : next.add(f.id)
                                return next
                              })}
                              onUpdate={onUpdateFilter}
                              onRemove={id => {
                                onRemoveFilter(id)
                                onDrawerExpandedFiltersChange(prev => { const next = new Set(prev); next.delete(id); return next })
                              }}
                            />
                          </React.Fragment>
                        )
                      })}
                    </>
                  )}

                  {/* Add filter + Remove all */}
                  <div className="flex items-center gap-2 pt-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1 gap-1.5 h-8 border-dashed text-muted-foreground"
                        >
                          <i className="fa-light fa-plus text-xs" aria-hidden="true" />
                          Add filter
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48">
                        <DropdownMenuLabel className="text-xs">Filter by field</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {filterFields.map(f => (
                          <DropdownMenuItem key={f.key} onClick={() => onAddFilter(f.key)}>
                            <i className={`fa-light ${f.icon}`} aria-hidden="true" />
                            {f.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {activeFilters.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => { activeFilters.forEach(f => onRemoveFilter(f.id)); onDrawerExpandedFiltersChange(new Set()) }}
                      >
                        Remove all
                      </Button>
                    )}
                  </div>

                  {/* Enable filter bar toggle */}
                  <div className="flex items-start justify-between gap-3 pt-3 mt-1 border-t border-border">
                    <div>
                      <label htmlFor="toggle-filter-bar" className="text-sm font-medium text-foreground cursor-pointer">Enable filter bar</label>
                      <p className="text-xs text-muted-foreground mt-0.5">Show filters above the table.</p>
                    </div>
                    <ToggleSwitch id="toggle-filter-bar" checked={filterBarVisible} onChange={onFilterBarVisibleChange} />
                  </div>
                </div>
              )}

              {/* ── Sort ── */}
              {sheetPanel === "sort" && (
                <div className="px-4 py-4 space-y-2">
                  {sortRules.length === 0 ? (
                    /* Empty state */
                    <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center space-y-2">
                      <div className="inline-flex items-center justify-center size-9 rounded-lg bg-muted mb-1">
                        <i className="fa-light fa-arrow-up-arrow-down text-muted-foreground text-[16px]" aria-hidden="true" />
                      </div>
                      <p className="text-sm font-medium text-foreground">No sorts applied</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Add a sort rule to order rows by any field. Multiple rules are applied in priority order.
                      </p>
                      <div className="space-y-1.5 text-left pt-1">
                        {[
                          { icon: "fa-circle-1", text: "Click \"Add sort\" below" },
                          { icon: "fa-circle-2", text: "Choose a field to sort by" },
                          { icon: "fa-circle-3", text: "Toggle ascending or descending" },
                        ].map(step => (
                          <div key={step.icon} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <i className={`fa-light ${step.icon} text-muted-foreground text-xs shrink-0`} aria-hidden="true" />
                            {step.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    sortRules.map((rule, idx) => {
                      const dragProps = sortDrag.getItemProps(rule.id)
                      return (
                        <React.Fragment key={rule.id}>
                          {idx > 0 && (
                            <div className="flex items-center gap-2 py-0.5">
                              <div className="flex-1 h-px bg-border" />
                              <span className="text-xs font-medium text-muted-foreground px-1">then by</span>
                              <div className="flex-1 h-px bg-border" />
                            </div>
                          )}
                          <div
                            {...dragProps}
                            className={cn(
                              "transition-all",
                              dragProps["data-dragging"] && "opacity-40",
                              dragProps["data-over"] && "ring-2 ring-ring bg-accent/30 rounded-lg",
                            )}
                          >
                            <DrawerSortCard
                              rule={rule}
                              fieldLabel={resolveColumnLabel(rule.fieldKey)}
                              isPrimary={idx === 0}
                              onRemove={() => onRemoveSortRule(rule.id)}
                              onToggleDir={() => onToggleSortDir(rule.id)}
                            />
                          </div>
                        </React.Fragment>
                      )
                    })
                  )}

                  {/* Add sort + Remove all */}
                  <div className="flex items-center gap-2 pt-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1 gap-1.5 h-8 border-dashed text-muted-foreground"
                        >
                          <i className="fa-light fa-plus text-xs" aria-hidden="true" />
                          Add sort
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48">
                        <DropdownMenuLabel className="text-xs">Sort by field</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {sortFieldList.filter(f => !sortRules.some(r => r.fieldKey === f.key)).map(col => (
                          <DropdownMenuItem key={col.key} onClick={() => onAddSortRule(col.key)}>
                            <i className="fa-light fa-arrow-up-arrow-down text-xs" aria-hidden="true" />
                            {col.label}
                          </DropdownMenuItem>
                        ))}
                        {sortFieldList.filter(f => !sortRules.some(r => r.fieldKey === f.key)).length === 0 && (
                          <p className="px-2 py-1.5 text-xs text-muted-foreground">All fields added</p>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {sortRules.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => onSortRulesChange([])}
                      >
                        Remove all
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* ── Group ── */}
              {sheetPanel === "group" && (
                <div className="p-4 space-y-2">
                  <p className="text-xs text-muted-foreground mb-3">
                    {groupBy ? `Grouped by ${resolveColumnLabel(groupBy)}.` : "No grouping applied."}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onGroupByChange(null)}
                    className={cn("w-full justify-start gap-2 px-3 py-2 h-auto text-sm font-normal",
                      !groupBy ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground",
                    )}
                  >
                    <i className="fa-light fa-ban text-xs" aria-hidden="true" />
                    None
                  </Button>
                  {groupFieldList.map(col => (
                    <Button
                      key={col.key}
                      type="button"
                      variant="ghost"
                      onClick={() => onGroupByChange(groupBy === col.key ? null : col.key)}
                      className={cn("w-full justify-start gap-2 px-3 py-2 h-auto text-sm font-normal",
                        groupBy === col.key ? "bg-accent text-accent-foreground font-medium" : "",
                      )}
                    >
                      <i className="fa-light fa-layer-group text-xs text-muted-foreground" aria-hidden="true" />
                      {col.label}
                      {groupBy === col.key && <i className="fa-solid fa-check text-accent-foreground text-xs ml-auto" aria-hidden="true" />}
                    </Button>
                  ))}
                </div>
              )}

              {/* ── Columns ── */}
              {sheetPanel === "columns" && (
                <div className="px-4 py-4">
                  {isBoardView ? (
                    <p className="text-xs text-muted-foreground mb-3">
                      Column visibility and order apply when you use Table view. They are saved with this tab.
                    </p>
                  ) : null}
                  <p className="text-xs text-muted-foreground mb-3">
                    {hiddenCols.size === 0
                      ? "All columns visible. Drag to reorder."
                      : `${hiddenCols.size} column${hiddenCols.size !== 1 ? "s" : ""} hidden. Drag handle to reorder.`}
                  </p>
                  <div className="space-y-0.5" role="list" aria-label="Column order and visibility">
                    {orderable.map((key, idx, arr) => {
                      const dragProps = colDrag.getItemProps(key)
                      return (
                        <ColumnRow
                          key={key}
                          label={resolveColumnLabel(key)}
                          isFirst={idx === 0}
                          isLast={idx === arr.length - 1}
                          visible={!hiddenCols.has(key)}
                          onToggleVisible={() => onToggleColVisibility(key)}
                          onMoveUp={() => onMoveCol(key, "up")}
                          onMoveDown={() => onMoveCol(key, "down")}
                          draggable={dragProps.draggable}
                          onDragStart={dragProps.onDragStart}
                          onDragOver={dragProps.onDragOver}
                          onDrop={dragProps.onDrop}
                          onDragEnd={dragProps.onDragEnd}
                          isDragging={dragProps["data-dragging"]}
                          isOver={dragProps["data-over"]}
                        />
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ── Conditional rules ── */}
              {sheetPanel === "conditional-rules" && (
                <ConditionalRulesPanel
                  filterFields={filterFields}
                  rules={conditionalRules}
                  onAdd={onAddConditionalRule}
                  onRemove={onRemoveConditionalRule}
                  onUpdate={onUpdateConditionalRule}
                />
              )}

            </div>
          </>
        )}

      </SheetContent>
    </Sheet>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ConditionalRulesPanel — same DrawerFilterCard as filters (incl. operator cycle);
// highlight color lives inside the card. Adding a rule expands only that card (like
// add filter from drawer). No And/Or connectors.
// ─────────────────────────────────────────────────────────────────────────────

function ConditionalRulesPanel({
  filterFields,
  rules,
  onAdd,
  onRemove,
  onUpdate,
}: {
  filterFields: FilterFieldDef[]
  rules: ConditionalRule[]
  onAdd: (rule: Omit<ConditionalRule, "id">) => void
  onRemove: (id: string) => void
  onUpdate: (id: string, patch: Partial<ConditionalRule>) => void
}) {
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(() => new Set())

  const prevLenRef = React.useRef(rules.length)
  React.useEffect(() => {
    if (rules.length > prevLenRef.current && rules.length > 0) {
      const last = rules[rules.length - 1]
      setExpandedIds(new Set([last.id]))
    }
    prevLenRef.current = rules.length
  }, [rules])

  function toggleExpanded(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="px-4 py-4 space-y-2">
      {rules.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center space-y-2">
          <div className="inline-flex items-center justify-center size-9 rounded-lg bg-muted mb-1">
            <i className="fa-light fa-palette text-muted-foreground text-[16px]" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-foreground">No rules yet</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Highlight cells with a background color based on their value.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map(rule => {
            const fd = filterFields.find(f => f.key === rule.fieldKey)
            if (!fd) return null
            return (
              <DrawerFilterCard
                key={rule.id}
                variant="conditional"
                filter={rule}
                fieldDef={fd}
                expanded={expandedIds.has(rule.id)}
                onToggleExpand={() => toggleExpanded(rule.id)}
                onUpdate={onUpdate}
                onRemove={id => {
                  onRemove(id)
                  setExpandedIds(prev => {
                    const next = new Set(prev)
                    next.delete(id)
                    return next
                  })
                }}
              />
            )
          })}
        </div>
      )}

      <div className="flex items-center gap-2 pt-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="flex-1 gap-1.5 h-8 border-dashed text-muted-foreground"
            >
              <i className="fa-light fa-plus text-xs" aria-hidden="true" />
              Add rule
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel className="text-xs">Rule for column</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {filterFields.map(f => (
              <DropdownMenuItem
                key={f.key}
                onClick={() => onAdd({
                  fieldKey: f.key,
                  operator: f.operators[0],
                  values: [],
                  bgColor: RULE_COLORS[0].bg,
                })}
              >
                <i className={`fa-light ${f.icon}`} aria-hidden="true" />
                {f.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {rules.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => {
              rules.forEach(r => onRemove(r.id))
              setExpandedIds(new Set())
            }}
          >
            Remove all
          </Button>
        )}
      </div>
    </div>
  )
}
