"use client"

/**
 * DataListTable — Placements hub shell on top of the generic DataTable.
 *
 * Lifecycle tabs swap columns and filtered rows; column definitions and lifecycle copy
 * are passed in from the page (`DataListClient` + `placements-table-columns.tsx`).
 */

import * as React from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tip } from "@/components/ui/tip"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import { KEY_METRICS_KPI_COUNT_DEFAULT } from "@/lib/dashboard-layout-merge"
import {
  ALL_DASHBOARD_CARDS,
  DEFAULT_VISIBLE_CARDS,
  DEFAULT_SPANS,
  DEFAULT_CHART_TYPES,
  loadDashboardLayout,
  mergeDashboardLayout,
  saveDashboardLayout,
  type ChartType,
  type DashboardLayout,
} from "@/components/data-view-dashboard-charts"
import { CoachMark } from "@/components/ui/coach-mark"
import { useCoachMark } from "@/hooks/use-coach-mark"
import { DASHBOARD_CUSTOMIZE_COACH_STEPS } from "@/lib/dashboard-customize-coach-mark"
import { PlacementsBoardView, type PlacementsBoardColumnMenu } from "@/components/placements-board-view"
import { PlacementsListView } from "@/components/placements-list-view"
import { TablePropertiesDrawer } from "@/components/table-properties"
import type { FilterFieldDef } from "@/components/table-properties/types"
import type { DataListViewType } from "@/lib/data-list-view"
import {
  DEFAULT_DATA_LIST_DISPLAY_OPTIONS,
  type DataListDisplayOptions,
} from "@/lib/data-list-display-options"
import {
  applyLifecyclePersisted,
  loadLifecycleFromStorage,
  scheduleLifecycleSave,
  serializeLifecycle,
  type TableStatePersistSlice,
} from "@/lib/data-list-persistence"
import type { OpenTablePropertiesHandle } from "@/lib/list-page-table-properties"
import { StatusBadge } from "@/components/data-list-table-cells"
import { columnsToFilterFields } from "@/components/placements-table-columns"
import { DataTable, DataTableToolbar } from "@/components/data-table"
import { CountSyncer, PaginationBar } from "@/components/data-table/pagination"
import type { DataTableExtendedProps } from "@/components/data-table"
import type { ColumnDef, ConditionalRule } from "@/components/data-table/types"
import { useTableState } from "@/components/data-table/use-table-state"
import { placementsForPhase, type Placement, type Status } from "@/lib/mock/placements"
import type { PlacementLifecycleTabId } from "@/lib/placement-lifecycle"
import { placementKpiInsightFromRows, placementKpiMetricsFromRows } from "@/lib/mock/placements-kpi"

const PlacementsDashboardChartsSection = dynamic(
  () =>
    import("@/components/data-view-dashboard-charts").then(mod => ({
      default: mod.PlacementsDashboardChartsSection,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="mx-4 mb-8 mt-2 flex flex-col gap-3 border border-border rounded-xl p-6 lg:mx-6">
        <Skeleton className="h-7 w-48 max-w-full" />
        <Skeleton className="min-h-[200px] w-full rounded-lg" />
        <Skeleton className="min-h-[200px] w-full rounded-lg" />
      </div>
    ),
  },
)

function DataListBoardShell({
  state,
  openDrawerRef,
  tableData,
  columns,
  lifecycleTabId,
  view,
  onViewChange,
  pagination,
  onPaginationChange,
  conditionalRules,
  onAddConditionalRule,
  onRemoveConditionalRule,
  onUpdateConditionalRule,
  filterFields,
  lifecycleDrawerLabel,
  fieldDefinitionsForDrawer,
  resolveColumnLabel,
  renderFilterOptionValue,
  displayOptions,
  onDisplayOptionsChange,
}: {
  state: ReturnType<typeof useTableState<Placement>>
  openDrawerRef: React.MutableRefObject<() => void>
  tableData: Placement[]
  columns: ColumnDef<Placement>[]
  lifecycleTabId: PlacementLifecycleTabId
  view: DataListViewType
  onViewChange?: (view: DataListViewType) => void
  pagination: boolean
  onPaginationChange: (v: boolean) => void
  conditionalRules: ConditionalRule[]
  onAddConditionalRule: (rule: Omit<ConditionalRule, "id">) => void
  onRemoveConditionalRule: (id: string) => void
  onUpdateConditionalRule: (id: string, patch: Partial<ConditionalRule>) => void
  filterFields: FilterFieldDef[]
  lifecycleDrawerLabel: string
  fieldDefinitionsForDrawer: { key: string; label: string; sortable?: boolean }[]
  resolveColumnLabel: (key: string) => string
  renderFilterOptionValue: (fieldKey: string, value: string) => React.ReactNode
  displayOptions: DataListDisplayOptions
  onDisplayOptionsChange: (patch: Partial<DataListDisplayOptions>) => void
}) {
  React.useEffect(() => {
    openDrawerRef.current = () => state.setSheetOpen(true)
  }, [state.setSheetOpen])

  const boardColumnMenu: PlacementsBoardColumnMenu = React.useMemo(
    () => ({
      filterableColumns: columns.filter(c => c.filter).map(c => ({ key: c.key, label: c.label })),
      sortableColumns: columns.filter(c => c.sortable && c.sortKey).map(c => ({ key: c.key, label: c.label })),
      groupableColumns: columns.filter(c => c.key !== "select" && c.key !== "actions").map(c => ({ key: c.key, label: c.label })),
      groupBy: state.groupBy,
      onAddFilter: state.addFilter,
      onSortByField: (fieldKey, direction) => {
        state.setSortRules(prev => {
          const filtered = prev.filter(r => r.fieldKey !== fieldKey)
          return [{ id: `sort-${Date.now()}`, fieldKey, direction }, ...filtered]
        })
      },
      onToggleGroupBy: (fieldKey: string) => {
        state.setGroupBy(prev => (prev === fieldKey ? null : fieldKey))
      },
      onOpenProperties: () => state.setSheetOpen(true),
    }),
    [columns, state.addFilter, state.groupBy, state.setGroupBy, state.setSheetOpen, state.setSortRules],
  )

  return (
    <>
      <DataTableToolbar
        state={state}
        columns={columns}
        searchable
        renderFilterOptionValue={renderFilterOptionValue}
        searchAriaLabel="Search placements"
        toolbarSlot={(s) => (
          <DrawerToolbar
            state={s}
            totalRows={tableData.length}
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            conditionalRules={conditionalRules}
            onAddConditionalRule={onAddConditionalRule}
            onRemoveConditionalRule={onRemoveConditionalRule}
            onUpdateConditionalRule={onUpdateConditionalRule}
            filterFields={filterFields}
            currentView={view}
            onViewChange={onViewChange}
            lifecycleDrawerLabel={lifecycleDrawerLabel}
            fieldDefinitionsForDrawer={fieldDefinitionsForDrawer}
            resolveColumnLabel={resolveColumnLabel}
            displayOptions={displayOptions}
            onDisplayOptionsChange={onDisplayOptionsChange}
          />
        )}
      />
      <PlacementsBoardView
        placements={state.rows as Placement[]}
        lifecycleTabId={lifecycleTabId}
        boardColumnMenu={boardColumnMenu}
        boardDisplay={{
          lineCount: displayOptions.boardLineCount,
          showColumnLabels: displayOptions.showColumnLabels,
          showColumnCounts: displayOptions.showBoardColumnCounts,
          newCardAbove: displayOptions.boardNewCardAbove,
        }}
        hiddenColKeys={state.hiddenCols}
        conditionalRules={conditionalRules}
        boardColumns={state.displayCols.filter(c => c.key !== "select" && c.key !== "actions")}
      />
    </>
  )
}

/** List / row view: shared table state + toolbar + full-width rows */
function DataListListShell({
  state,
  openDrawerRef,
  tableData,
  columns,
  lifecycleTabId,
  view,
  onViewChange,
  pagination,
  onPaginationChange,
  conditionalRules,
  onAddConditionalRule,
  onRemoveConditionalRule,
  onUpdateConditionalRule,
  filterFields,
  lifecycleDrawerLabel,
  fieldDefinitionsForDrawer,
  resolveColumnLabel,
  renderFilterOptionValue,
  displayOptions,
  onDisplayOptionsChange,
  listRows,
  emptyTableCopy,
}: {
  state: ReturnType<typeof useTableState<Placement>>
  openDrawerRef: React.MutableRefObject<() => void>
  tableData: Placement[]
  columns: ColumnDef<Placement>[]
  lifecycleTabId: PlacementLifecycleTabId
  view: DataListViewType
  onViewChange?: (view: DataListViewType) => void
  pagination: boolean
  onPaginationChange: (v: boolean) => void
  conditionalRules: ConditionalRule[]
  onAddConditionalRule: (rule: Omit<ConditionalRule, "id">) => void
  onRemoveConditionalRule: (id: string) => void
  onUpdateConditionalRule: (id: string, patch: Partial<ConditionalRule>) => void
  filterFields: FilterFieldDef[]
  lifecycleDrawerLabel: string
  fieldDefinitionsForDrawer: { key: string; label: string; sortable?: boolean }[]
  resolveColumnLabel: (key: string) => string
  renderFilterOptionValue: (fieldKey: string, value: string) => React.ReactNode
  displayOptions: DataListDisplayOptions
  onDisplayOptionsChange: (patch: Partial<DataListDisplayOptions>) => void
  listRows: Placement[]
  emptyTableCopy: string
}) {
  React.useEffect(() => {
    openDrawerRef.current = () => state.setSheetOpen(true)
  }, [state.setSheetOpen])

  return (
    <>
      <DataTableToolbar
        state={state}
        columns={columns}
        searchable
        renderFilterOptionValue={renderFilterOptionValue}
        searchAriaLabel="Search placements"
        toolbarSlot={s => (
          <DrawerToolbar
            state={s}
            totalRows={tableData.length}
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            conditionalRules={conditionalRules}
            onAddConditionalRule={onAddConditionalRule}
            onRemoveConditionalRule={onRemoveConditionalRule}
            onUpdateConditionalRule={onUpdateConditionalRule}
            filterFields={filterFields}
            currentView={view}
            onViewChange={onViewChange}
            lifecycleDrawerLabel={lifecycleDrawerLabel}
            fieldDefinitionsForDrawer={fieldDefinitionsForDrawer}
            resolveColumnLabel={resolveColumnLabel}
            displayOptions={displayOptions}
            onDisplayOptionsChange={onDisplayOptionsChange}
          />
        )}
      />
      <PlacementsListView
        rows={listRows}
        lifecycleTabId={lifecycleTabId}
        hiddenColKeys={state.hiddenCols}
        boardColumns={state.displayCols.filter(c => c.key !== "select" && c.key !== "actions")}
        conditionalRules={conditionalRules}
        emptyCopy={emptyTableCopy}
      />
    </>
  )
}

/** Dashboard view tab: same toolbar + properties as list/board; KPIs from filtered rows. */
function DataListDashboardShell({
  state,
  openDrawerRef,
  tableData,
  columns,
  view,
  onViewChange,
  pagination,
  onPaginationChange,
  conditionalRules,
  onAddConditionalRule,
  onRemoveConditionalRule,
  onUpdateConditionalRule,
  filterFields,
  lifecycleDrawerLabel,
  fieldDefinitionsForDrawer,
  resolveColumnLabel,
  renderFilterOptionValue,
  displayOptions,
  onDisplayOptionsChange,
}: {
  state: ReturnType<typeof useTableState<Placement>>
  openDrawerRef: React.MutableRefObject<() => void>
  tableData: Placement[]
  columns: ColumnDef<Placement>[]
  view: DataListViewType
  onViewChange?: (view: DataListViewType) => void
  pagination: boolean
  onPaginationChange: (v: boolean) => void
  conditionalRules: ConditionalRule[]
  onAddConditionalRule: (rule: Omit<ConditionalRule, "id">) => void
  onRemoveConditionalRule: (id: string) => void
  onUpdateConditionalRule: (id: string, patch: Partial<ConditionalRule>) => void
  filterFields: FilterFieldDef[]
  lifecycleDrawerLabel: string
  fieldDefinitionsForDrawer: { key: string; label: string; sortable?: boolean }[]
  resolveColumnLabel: (key: string) => string
  renderFilterOptionValue: (fieldKey: string, value: string) => React.ReactNode
  displayOptions: DataListDisplayOptions
  onDisplayOptionsChange: (patch: Partial<DataListDisplayOptions>) => void
}) {
  React.useEffect(() => {
    openDrawerRef.current = () => state.setSheetOpen(true)
  }, [state.setSheetOpen])

  const dashboardKpi = React.useMemo(
    () => ({
      metrics: placementKpiMetricsFromRows(state.rows as Placement[]),
      insight: placementKpiInsightFromRows(state.rows as Placement[]),
    }),
    [state.rows],
  )

  /* Dashboard card layout — persisted to localStorage */
  const [visibleCards, setVisibleCards] = React.useState<string[]>(DEFAULT_VISIBLE_CARDS)
  const [cardOrder, setCardOrder] = React.useState<string[]>(ALL_DASHBOARD_CARDS.map(c => c.id))
  const [cardSpans, setCardSpans] = React.useState<Record<string, 1 | 2>>(() => ({ ...DEFAULT_SPANS }))
  const [cardChartTypes, setCardChartTypes] = React.useState<Record<string, ChartType>>(() => ({ ...DEFAULT_CHART_TYPES }))
  const [keyMetricsKpiCount, setKeyMetricsKpiCount] = React.useState<number>(KEY_METRICS_KPI_COUNT_DEFAULT)
  const [dashboardLayoutEdit, setDashboardLayoutEdit] = React.useState(false)
  const dashboardLayoutHydrated = React.useRef(false)
  const dashboardLayoutEditBaselineRef = React.useRef<DashboardLayout | null>(null)

  React.useEffect(() => {
    const saved = loadDashboardLayout()
    const m = mergeDashboardLayout(saved)
    setVisibleCards(m.visible)
    setCardOrder(m.order)
    setCardSpans(m.spans ?? { ...DEFAULT_SPANS })
    setCardChartTypes(m.chartTypes ?? { ...DEFAULT_CHART_TYPES })
    setKeyMetricsKpiCount(m.keyMetricsKpiCount ?? KEY_METRICS_KPI_COUNT_DEFAULT)
    dashboardLayoutHydrated.current = true
  }, [])

  React.useEffect(() => {
    if (!dashboardLayoutHydrated.current) return
    saveDashboardLayout({
      visible: visibleCards,
      order: cardOrder,
      spans: cardSpans,
      chartTypes: cardChartTypes,
      keyMetricsKpiCount,
    })
  }, [visibleCards, cardOrder, cardSpans, cardChartTypes, keyMetricsKpiCount])

  const handleVisibleChange = React.useCallback((v: string[]) => {
    setVisibleCards(v)
  }, [])

  const handleOrderChange = React.useCallback((o: string[]) => {
    setCardOrder(o)
  }, [])

  const handleSpanChange = React.useCallback((id: string, span: 1 | 2) => {
    setCardSpans(prev => ({ ...prev, [id]: span }))
  }, [])

  const handleChartTypeChange = React.useCallback((id: string, t: ChartType) => {
    setCardChartTypes(prev => ({ ...prev, [id]: t }))
  }, [])

  const handleResetDashboardLayout = React.useCallback(() => {
    setVisibleCards(ALL_DASHBOARD_CARDS.map(c => c.id))
    setCardOrder(ALL_DASHBOARD_CARDS.map(c => c.id))
    setCardSpans({ ...DEFAULT_SPANS })
    setCardChartTypes({ ...DEFAULT_CHART_TYPES })
    setKeyMetricsKpiCount(KEY_METRICS_KPI_COUNT_DEFAULT)
  }, [])

  const handleDashboardLayoutEditStart = React.useCallback(() => {
    dashboardLayoutEditBaselineRef.current = {
      visible: [...visibleCards],
      order: [...cardOrder],
      spans: { ...cardSpans },
      chartTypes: { ...cardChartTypes },
      keyMetricsKpiCount,
    }
    setDashboardLayoutEdit(true)
  }, [visibleCards, cardOrder, cardSpans, cardChartTypes, keyMetricsKpiCount])

  const handleDashboardLayoutEditDone = React.useCallback(() => {
    setDashboardLayoutEdit(false)
  }, [])

  const handleDashboardLayoutEditCancel = React.useCallback(() => {
    const b = dashboardLayoutEditBaselineRef.current
    if (b) {
      setVisibleCards(b.visible)
      setCardOrder(b.order)
      setCardSpans(b.spans ?? { ...DEFAULT_SPANS })
      setCardChartTypes(b.chartTypes ?? { ...DEFAULT_CHART_TYPES })
      setKeyMetricsKpiCount(b.keyMetricsKpiCount ?? KEY_METRICS_KPI_COUNT_DEFAULT)
    }
    setDashboardLayoutEdit(false)
  }, [])

  const dashboardCustomizeCoach = useCoachMark({
    flowId: "placements-dashboard-customize",
    steps: DASHBOARD_CUSTOMIZE_COACH_STEPS,
    delay: 700,
    dependsOnDismissedFlowId: "placements-views-tour",
  })

  return (
    <>
      <CoachMark state={dashboardCustomizeCoach} />
      {!dashboardLayoutEdit ? (
        <DataTableToolbar
          state={state}
          columns={columns}
          searchable={displayOptions.showToolbarSearch}
          renderFilterOptionValue={renderFilterOptionValue}
          searchAriaLabel="Search placements"
          toolbarSlot={s => (
            <DrawerToolbar
              state={s}
              totalRows={tableData.length}
              pagination={pagination}
              onPaginationChange={onPaginationChange}
              conditionalRules={conditionalRules}
              onAddConditionalRule={onAddConditionalRule}
              onRemoveConditionalRule={onRemoveConditionalRule}
              onUpdateConditionalRule={onUpdateConditionalRule}
              filterFields={filterFields}
              currentView={view}
              onViewChange={onViewChange}
              lifecycleDrawerLabel={lifecycleDrawerLabel}
              fieldDefinitionsForDrawer={fieldDefinitionsForDrawer}
              resolveColumnLabel={resolveColumnLabel}
              displayOptions={displayOptions}
              onDisplayOptionsChange={onDisplayOptionsChange}
              extraActions={
                <Tip side="bottom" label="Edit dashboard layout on canvas">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Edit dashboard layout"
                    onClick={handleDashboardLayoutEditStart}
                    className="text-muted-foreground hover:text-interactive-hover-foreground hover:bg-interactive-hover"
                  >
                    <i className="fa-light fa-pen-ruler text-[13px]" aria-hidden="true" />
                  </Button>
                </Tip>
              }
            />
          )}
        />
      ) : null}

      {/* Contextual placement charts + KPI card (customise on canvas) */}
      <PlacementsDashboardChartsSection
        placements={state.rows as Placement[]}
        keyMetrics={dashboardKpi}
        visibleCards={visibleCards}
        cardOrder={cardOrder}
        cardSpans={cardSpans}
        cardChartTypes={cardChartTypes}
        keyMetricsKpiCount={keyMetricsKpiCount}
        layoutEditMode={dashboardLayoutEdit}
        onVisibleChange={handleVisibleChange}
        onOrderChange={handleOrderChange}
        onSpanChange={handleSpanChange}
        onChartTypeChange={handleChartTypeChange}
        onKeyMetricsKpiCountChange={setKeyMetricsKpiCount}
        onResetLayout={handleResetDashboardLayout}
        onLayoutEditDone={handleDashboardLayoutEditDone}
        onLayoutEditCancel={handleDashboardLayoutEditCancel}
      />
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface DataListTableProps {
  view?: DataListViewType
  onViewChange?: (view: DataListViewType) => void
  /** Drives column set + row filter (ids: all | upcoming | ongoing | completed) */
  lifecycleTabId?: PlacementLifecycleTabId
  /** Shared display options (persist at page level — all view types). */
  displayOptions?: DataListDisplayOptions
  onDisplayOptionsChange?: (patch: Partial<DataListDisplayOptions>) => void
  /** Lifecycle column set from the placements page (e.g. `getPlacementColumnsForLifecycle`). */
  getColumnsForLifecycle: (tab: PlacementLifecycleTabId) => ColumnDef<Placement>[]
  /** Empty-state copy for the active lifecycle tab — from the page. */
  emptyTableCopy: string
  /** Table Properties drawer lifecycle label — from the page. */
  lifecycleDrawerLabel: string
}

/** Imperative handle — open Table Properties (table view only). */
export type DataListTableHandle = OpenTablePropertiesHandle

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export const DataListTable = React.forwardRef<DataListTableHandle, DataListTableProps>(function DataListTable({
  view = "table",
  onViewChange,
  lifecycleTabId = "all",
  displayOptions: displayOptionsProp,
  onDisplayOptionsChange,
  getColumnsForLifecycle,
  emptyTableCopy,
  lifecycleDrawerLabel,
}, ref) {
  const displayOptions = React.useMemo(
    () => ({ ...DEFAULT_DATA_LIST_DISPLAY_OPTIONS, ...displayOptionsProp }),
    [displayOptionsProp],
  )

  const patchDisplayOptions = React.useCallback(
    (patch: Partial<DataListDisplayOptions>) => {
      onDisplayOptionsChange?.(patch)
    },
    [onDisplayOptionsChange],
  )
  const openDrawerRef = React.useRef<() => void>(() => {})

  React.useImperativeHandle(ref, () => ({
    openPropertiesDrawer: () => {
      openDrawerRef.current()
    },
  }), [])

  const router = useRouter()
  const [pagination, setPagination] = React.useState(false)

  const columns = React.useMemo(
    () => getColumnsForLifecycle(lifecycleTabId),
    [getColumnsForLifecycle, lifecycleTabId],
  )

  const tableData = React.useMemo(
    () => placementsForPhase(lifecycleTabId),
    [lifecycleTabId],
  )

  const filterFields = React.useMemo(() => columnsToFilterFields(columns), [columns])

  const fieldDefinitionsForDrawer = React.useMemo(
    () => columns
      .filter(c => c.key !== "select" && c.key !== "actions")
      .map(c => ({
        key: c.key,
        label: c.label,
        sortable: !!(c.sortable && c.sortKey),
      })),
    [columns],
  )

  const resolveColumnLabel = React.useCallback(
    (key: string) => columns.find(c => c.key === key)?.label ?? key,
    [columns],
  )

  const [conditionalRules, setConditionalRules] = React.useState<ConditionalRule[]>([])

  function addConditionalRule(rule: Omit<ConditionalRule, "id">) {
    setConditionalRules(prev => [...prev, { ...rule, id: `cr-${Date.now()}` }])
  }
  function removeConditionalRule(id: string) {
    setConditionalRules(prev => prev.filter(r => r.id !== id))
  }
  function updateConditionalRule(id: string, patch: Partial<ConditionalRule>) {
    setConditionalRules(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r))
  }

  const renderFilterOptionValue = React.useCallback(
    (fieldKey: string, value: string): React.ReactNode => {
      if (fieldKey === "status") return <StatusBadge status={value as Status} />
      const col = columns.find(c => c.key === fieldKey)
      const opt = col?.filter?.options?.find(o => o.value === value)
      return <span className="text-foreground">{opt?.label ?? value}</span>
    },
    [columns],
  )

  const [paginationPage, setPaginationPage] = React.useState(1)
  const [paginationPageSize, setPaginationPageSize] = React.useState(10)
  const [filteredCount, setFilteredCount] = React.useState(tableData.length)

  React.useEffect(() => {
    setFilteredCount(tableData.length)
  }, [tableData])

  const totalPages = Math.max(1, Math.ceil(filteredCount / Math.max(1, paginationPageSize)))
  const safePage = Math.min(paginationPage, totalPages)
  const paginationOverride =
    pagination && view !== "board" && view !== "dashboard"
      ? { page: safePage, pageSize: paginationPageSize }
      : undefined

  const tableState = useTableState(tableData, columns, { key: "student", dir: "asc" }, paginationOverride)

  const columnKeys = React.useMemo(() => new Set(columns.map(c => c.key)), [columns])

  React.useLayoutEffect(() => {
    const raw = loadLifecycleFromStorage(lifecycleTabId)
    if (!raw) return
    applyLifecyclePersisted(tableState as unknown as TableStatePersistSlice, raw, columnKeys)
    setConditionalRules(raw.conditionalRules)
    setPagination(raw.pagination)
    setPaginationPage(raw.paginationPage)
    setPaginationPageSize(raw.paginationPageSize)
  }, [lifecycleTabId, columnKeys])

  React.useEffect(() => {
    openDrawerRef.current = () => tableState.setSheetOpen(true)
  }, [tableState.setSheetOpen])

  React.useEffect(() => {
    const payload = serializeLifecycle(tableState as unknown as TableStatePersistSlice, {
      conditionalRules,
      pagination,
      paginationPage: safePage,
      paginationPageSize,
    })
    scheduleLifecycleSave(lifecycleTabId, payload)
  }, [
    lifecycleTabId,
    tableState.sortRules,
    tableState.search,
    tableState.activeFilters,
    tableState.filterConnectors,
    tableState.groupBy,
    tableState.colOrder,
    tableState.hiddenCols,
    tableState.colWidths,
    tableState.colPins,
    tableState.colWrap,
    tableState.colMenuSearch,
    tableState.rowHeight,
    tableState.showGridlines,
    tableState.filterBarVisible,
    tableState.searchOpen,
    conditionalRules,
    pagination,
    safePage,
    paginationPageSize,
  ])

  function buildToolbarSlot(
    s: ReturnType<typeof useTableState<Placement>>,
  ): React.ReactNode {
    return (
      <DrawerToolbar
        state={s}
        totalRows={tableData.length}
        pagination={pagination}
        onPaginationChange={setPagination}
        conditionalRules={conditionalRules}
        onAddConditionalRule={addConditionalRule}
        onRemoveConditionalRule={removeConditionalRule}
        onUpdateConditionalRule={updateConditionalRule}
        filterFields={filterFields}
        currentView={view}
        onViewChange={onViewChange}
        lifecycleDrawerLabel={lifecycleDrawerLabel}
        fieldDefinitionsForDrawer={fieldDefinitionsForDrawer}
        resolveColumnLabel={resolveColumnLabel}
        displayOptions={displayOptions}
        onDisplayOptionsChange={patchDisplayOptions}
      />
    )
  }

  function bulkActionsSlot(selected: Set<string | number>, _rows: Placement[]): React.ReactNode {
    const count = selected.size
    const contextId = "bulk-selection-context"
    return (
      <>
        <span id={contextId} className="sr-only">
          {count} {count === 1 ? "row" : "rows"} selected
        </span>
        <Button size="sm" variant="default" aria-describedby={contextId}>
          <i className="fa-light fa-circle-check" aria-hidden="true" /> Confirm
        </Button>
        <Button size="sm" variant="outline" aria-describedby={contextId}>
          <i className="fa-light fa-arrow-down-to-line" aria-hidden="true" /> Export
        </Button>
        <Button size="sm" variant="destructive" aria-describedby={contextId}>
          <i className="fa-light fa-trash" aria-hidden="true" /> Delete
        </Button>
      </>
    )
  }

  const tableProps: DataTableExtendedProps<Placement> = {
    data: tableData,
    columns,
    getRowId: (row: Placement) => row.id,
    getRowSelectionLabel: (row: Placement) => row.student,
    selectable: true,
    searchable: displayOptions.showToolbarSearch,
    showColumnHeaders: displayOptions.showColumnLabels,
    defaultSort: { key: "student" as const, dir: "asc" as const },
    emptyState: emptyTableCopy,
    toolbarSlot: buildToolbarSlot,
    bulkActionsSlot,
    renderFilterOptionValue,
    conditionalRules,
    onRowClick: (row: Placement) => router.push(`/data-list/${row.id}`),
    state: tableState,
  }

  if (view === "board") {
    return (
      <DataListBoardShell
        state={tableState}
        openDrawerRef={openDrawerRef}
        tableData={tableData}
        columns={columns}
        lifecycleTabId={lifecycleTabId}
        view={view}
        onViewChange={onViewChange}
        pagination={pagination}
        onPaginationChange={setPagination}
        conditionalRules={conditionalRules}
        onAddConditionalRule={addConditionalRule}
        onRemoveConditionalRule={removeConditionalRule}
        onUpdateConditionalRule={updateConditionalRule}
        filterFields={filterFields}
        lifecycleDrawerLabel={lifecycleDrawerLabel}
        fieldDefinitionsForDrawer={fieldDefinitionsForDrawer}
        resolveColumnLabel={resolveColumnLabel}
        renderFilterOptionValue={renderFilterOptionValue}
        displayOptions={displayOptions}
        onDisplayOptionsChange={patchDisplayOptions}
      />
    )
  }

  if (view === "dashboard") {
    return (
      <DataListDashboardShell
        state={tableState}
        openDrawerRef={openDrawerRef}
        tableData={tableData}
        columns={columns}
        view={view}
        onViewChange={onViewChange}
        pagination={pagination}
        onPaginationChange={setPagination}
        conditionalRules={conditionalRules}
        onAddConditionalRule={addConditionalRule}
        onRemoveConditionalRule={removeConditionalRule}
        onUpdateConditionalRule={updateConditionalRule}
        filterFields={filterFields}
        lifecycleDrawerLabel={lifecycleDrawerLabel}
        fieldDefinitionsForDrawer={fieldDefinitionsForDrawer}
        resolveColumnLabel={resolveColumnLabel}
        renderFilterOptionValue={renderFilterOptionValue}
        displayOptions={displayOptions}
        onDisplayOptionsChange={patchDisplayOptions}
      />
    )
  }

  if (view === "list") {
    return (
      <React.Fragment key={lifecycleTabId}>
        {pagination ? (
          <CountSyncer
            count={tableState.rows.length}
            onSync={setFilteredCount}
            onReset={() => setPaginationPage(1)}
          />
        ) : null}
        <DataListListShell
          state={tableState}
          openDrawerRef={openDrawerRef}
          tableData={tableData}
          columns={columns}
          lifecycleTabId={lifecycleTabId}
          view={view}
          onViewChange={onViewChange}
          pagination={pagination}
          onPaginationChange={setPagination}
          conditionalRules={conditionalRules}
          onAddConditionalRule={addConditionalRule}
          onRemoveConditionalRule={removeConditionalRule}
          onUpdateConditionalRule={updateConditionalRule}
          filterFields={filterFields}
          lifecycleDrawerLabel={lifecycleDrawerLabel}
          fieldDefinitionsForDrawer={fieldDefinitionsForDrawer}
          resolveColumnLabel={resolveColumnLabel}
          renderFilterOptionValue={renderFilterOptionValue}
          displayOptions={displayOptions}
          onDisplayOptionsChange={patchDisplayOptions}
          listRows={pagination ? tableState.pagedRows : tableState.rows}
          emptyTableCopy={emptyTableCopy}
        />
        {pagination ? (
          <div className="mx-4 lg:mx-6 border-x border-b border-border rounded-b-lg overflow-hidden">
            <PaginationBar
              page={safePage}
              pageSize={paginationPageSize}
              total={filteredCount}
              pageSizeOptions={[10, 25, 50, 100]}
              onPageChange={setPaginationPage}
              onPageSizeChange={n => {
                setPaginationPageSize(n)
                setPaginationPage(1)
              }}
            />
          </div>
        ) : null}
      </React.Fragment>
    )
  }

  if (pagination) {
    return (
      <React.Fragment key={lifecycleTabId}>
        <CountSyncer
          count={tableState.rows.length}
          onSync={setFilteredCount}
          onReset={() => setPaginationPage(1)}
        />
        <DataTable<Placement> {...tableProps} hasFooter />
        <div className="mx-4 lg:mx-6 border-x border-b border-border rounded-b-lg overflow-hidden">
          <PaginationBar
            page={safePage}
            pageSize={paginationPageSize}
            total={filteredCount}
            pageSizeOptions={[10, 25, 50, 100]}
            onPageChange={setPaginationPage}
            onPageSizeChange={n => {
              setPaginationPageSize(n)
              setPaginationPage(1)
            }}
          />
        </div>
      </React.Fragment>
    )
  }

  return <DataTable<Placement> key={lifecycleTabId} {...tableProps} />
})

DataListTable.displayName = "DataListTable"

// ─────────────────────────────────────────────────────────────────────────────
// DrawerToolbar
// ─────────────────────────────────────────────────────────────────────────────

function DrawerToolbar({
  state,
  totalRows,
  pagination,
  onPaginationChange,
  conditionalRules,
  onAddConditionalRule,
  onRemoveConditionalRule,
  onUpdateConditionalRule,
  filterFields,
  currentView,
  onViewChange,
  lifecycleDrawerLabel,
  fieldDefinitionsForDrawer,
  resolveColumnLabel,
  displayOptions,
  onDisplayOptionsChange,
  extraActions,
}: {
  state: ReturnType<typeof useTableState<Placement>>
  totalRows: number
  pagination: boolean
  onPaginationChange: (v: boolean) => void
  conditionalRules: ConditionalRule[]
  onAddConditionalRule: (rule: Omit<ConditionalRule, "id">) => void
  onRemoveConditionalRule: (id: string) => void
  onUpdateConditionalRule: (id: string, patch: Partial<ConditionalRule>) => void
  filterFields: FilterFieldDef[]
  currentView?: DataListViewType
  onViewChange?: (view: DataListViewType) => void
  lifecycleDrawerLabel: string
  fieldDefinitionsForDrawer: { key: string; label: string; sortable?: boolean }[]
  resolveColumnLabel: (key: string) => string
  displayOptions: DataListDisplayOptions
  onDisplayOptionsChange: (patch: Partial<DataListDisplayOptions>) => void
  /** Extra toolbar actions rendered before the Properties button */
  extraActions?: React.ReactNode
}) {
  const {
    sheetOpen, setSheetOpen,
    showGridlines, setShowGridlines,
    rowHeight, setRowHeight,
    activeFilters, addFilter, updateFilter, removeFilter,
    getConnector, toggleConnector,
    filterBarVisible, setFilterBarVisible,
    drawerExpandedFilters, setDrawerExpandedFilters,
    rows,
    sortRules, setSortRules, addSortRule, removeSortRule, toggleSortDir,
    colOrder, setColOrder,
    hiddenCols, toggleColVisibility,
    moveCol,
    groupBy, setGroupBy,
    sortKey,
  } = state

  return (
    <>
      {extraActions}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Properties"
              onClick={() => setSheetOpen(true)}
              className={cn(
                sheetOpen
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-interactive-hover-foreground hover:bg-interactive-hover",
              )}
            >
              <i className="fa-light fa-sliders text-[13px]" aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Properties</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TablePropertiesDrawer
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        showGridlines={showGridlines}
        onShowGridlinesChange={setShowGridlines}
        rowHeight={rowHeight}
        onRowHeightChange={setRowHeight}
        pagination={pagination}
        onPaginationChange={onPaginationChange}
        activeFilters={activeFilters}
        onAddFilter={fieldKey => addFilter(fieldKey, true)}
        onUpdateFilter={updateFilter}
        onRemoveFilter={removeFilter}
        getFilterConnector={getConnector}
        onToggleFilterConnector={toggleConnector}
        filterBarVisible={filterBarVisible}
        onFilterBarVisibleChange={setFilterBarVisible}
        drawerExpandedFilters={drawerExpandedFilters}
        onDrawerExpandedFiltersChange={setDrawerExpandedFilters}
        totalRows={totalRows}
        filteredRows={rows.length}
        sortRules={sortRules}
        onSortRulesChange={setSortRules}
        onAddSortRule={addSortRule}
        onRemoveSortRule={removeSortRule}
        onToggleSortDir={toggleSortDir}
        colOrder={colOrder}
        onColOrderChange={setColOrder}
        hiddenCols={hiddenCols}
        onToggleColVisibility={toggleColVisibility}
        onMoveCol={moveCol}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        primarySortKey={sortKey}
        conditionalRules={conditionalRules}
        onAddConditionalRule={onAddConditionalRule}
        onRemoveConditionalRule={onRemoveConditionalRule}
        onUpdateConditionalRule={onUpdateConditionalRule}
        filterFields={filterFields}
        currentView={currentView}
        onViewChange={onViewChange}
        lifecycleTabLabel={lifecycleDrawerLabel}
        fieldDefinitions={fieldDefinitionsForDrawer}
        resolveColumnLabel={resolveColumnLabel}
        displayOptions={displayOptions}
        onDisplayOptionsChange={onDisplayOptionsChange}
      />
    </>
  )
}

export type { DataListViewType } from "@/lib/data-list-view"
export { DATA_LIST_VIEW_TILES } from "@/lib/data-list-view"
export type { DataListDisplayOptions } from "@/lib/data-list-display-options"
