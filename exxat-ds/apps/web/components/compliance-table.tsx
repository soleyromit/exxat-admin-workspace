"use client"

/**
 * Compliance obligations — DataTable + TablePropertiesDrawer + list/board/dashboard.
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  COMPLIANCE_STATUS_BADGE_CLASS,
  COMPLIANCE_STATUS_ICON,
  COMPLIANCE_STATUS_LABEL,
} from "@/lib/list-status-badges"
import type { ComplianceItem } from "@/lib/mock/compliance"
import { DataTable, DataTableToolbar } from "@/components/data-table"
import {
  ComplianceDashboardChartsSection,
  ALL_COMPLIANCE_DASHBOARD_CARDS,
  DEFAULT_COMPLIANCE_CHART_TYPES,
  DEFAULT_COMPLIANCE_SPANS,
  loadComplianceDashboardLayout,
  mergeComplianceDashboardLayout,
  saveComplianceDashboardLayout,
} from "@/components/data-view-dashboard-charts-compliance"
import { KEY_METRICS_KPI_COUNT_DEFAULT } from "@/lib/dashboard-layout-merge"
import type { ChartType, DashboardLayout } from "@/components/data-view-dashboard-charts"
import { ComplianceListView } from "@/components/compliance-list-view"
import { ComplianceBoardView } from "@/components/compliance-board-view"
import { complianceKpiInsight, complianceKpiMetrics } from "@/lib/mock/compliance-kpi"
import type { DataListViewType } from "@/lib/data-list-view"
import type { OpenTablePropertiesHandle } from "@/lib/list-page-table-properties"
import type { ColumnDef } from "@/components/data-table/types"
import { useTableState } from "@/components/data-table/use-table-state"
import { TablePropertiesDrawer } from "@/components/table-properties"
import type { ConditionalRule, FilterFieldDef, FilterOperator } from "@/components/table-properties/types"
import { ListHubStatusBadge } from "@/components/list-hub-status-badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Tip } from "@/components/ui/tip"
import { CoachMark } from "@/components/ui/coach-mark"
import { useCoachMark } from "@/hooks/use-coach-mark"
import { DASHBOARD_CUSTOMIZE_COACH_STEPS } from "@/lib/dashboard-customize-coach-mark"
import {
  DEFAULT_DATA_LIST_DISPLAY_OPTIONS,
  type DataListDisplayOptions,
} from "@/lib/data-list-display-options"

function uniqueCategories(items: ComplianceItem[]) {
  return [...new Set(items.map(i => i.category))].sort().map(c => ({ value: c, label: c }))
}

const STATUS_FILTER_OPTS = [
  { value: "compliant", label: COMPLIANCE_STATUS_LABEL.compliant },
  { value: "due_soon", label: COMPLIANCE_STATUS_LABEL.due_soon },
  { value: "overdue", label: COMPLIANCE_STATUS_LABEL.overdue },
  { value: "pending", label: COMPLIANCE_STATUS_LABEL.pending },
]

function columnToFilterFieldDef(c: ColumnDef<ComplianceItem>): FilterFieldDef | null {
  if (!c.filter) return null
  const f = c.filter
  const defaultOps: FilterOperator[] =
    f.type === "select" || f.type === "date"
      ? ["is", "is_not"]
      : ["contains", "not_contains"]
  return {
    key: c.key,
    label: c.label,
    icon: f.icon ?? "fa-filter",
    type: f.type,
    operators: (f.operators ?? defaultOps) as FilterOperator[],
    options: f.options,
  }
}

function columnsToFilterFields(cols: ColumnDef<ComplianceItem>[]) {
  return cols.map(columnToFilterFieldDef).filter((x): x is FilterFieldDef => x !== null)
}

function buildComplianceColumns(items: ComplianceItem[]): ColumnDef<ComplianceItem>[] {
  const catOpts = uniqueCategories(items)

  const COLUMN_SELECT: ColumnDef<ComplianceItem> = {
    key: "select",
    label: "",
    width: 40,
    minWidth: 40,
    defaultPin: "left",
    lockPin: true,
  }

  const cols: ColumnDef<ComplianceItem>[] = [
    COLUMN_SELECT,
    {
      key: "title",
      label: "Obligation",
      width: 280,
      minWidth: 140,
      sortable: true,
      sortKey: "title",
      defaultPin: "left",
      filter: {
        type: "text",
        icon: "fa-file-lines",
        operators: ["contains", "not_contains"],
      },
      cell: row => (
        <span className="line-clamp-2 text-sm font-medium text-foreground">{row.title}</span>
      ),
    },
    {
      key: "category",
      label: "Category",
      width: 160,
      minWidth: 120,
      sortable: true,
      sortKey: "category",
      filter: {
        type: "select",
        icon: "fa-layer-group",
        operators: ["is", "is_not"],
        options: catOpts,
      },
      cell: row => <span className="text-sm text-foreground/90">{row.category}</span>,
    },
    {
      key: "status",
      label: "Status",
      width: 120,
      minWidth: 100,
      sortable: true,
      sortKey: "status",
      filter: {
        type: "select",
        icon: "fa-circle-dot",
        operators: ["is", "is_not"],
        options: STATUS_FILTER_OPTS,
      },
      cell: row => (
        <ListHubStatusBadge
          label={COMPLIANCE_STATUS_LABEL[row.status]}
          tintClassName={COMPLIANCE_STATUS_BADGE_CLASS[row.status]}
          icon={COMPLIANCE_STATUS_ICON[row.status]}
        />
      ),
    },
    {
      key: "dueDate",
      label: "Due",
      width: 120,
      minWidth: 100,
      sortable: true,
      sortKey: "dueDate",
      filter: { type: "date", icon: "fa-calendar", operators: ["is", "is_not"] },
      cell: row => (
        <span className="text-sm tabular-nums text-foreground/90 whitespace-nowrap">{row.dueDate}</span>
      ),
    },
    {
      key: "owner",
      label: "Owner",
      width: 160,
      minWidth: 120,
      sortable: true,
      sortKey: "owner",
      filter: {
        type: "text",
        icon: "fa-user",
        operators: ["contains", "not_contains"],
      },
      cell: row => <span className="text-sm text-foreground/90">{row.owner}</span>,
    },
    {
      key: "lastReviewed",
      label: "Last reviewed",
      width: 120,
      minWidth: 100,
      sortable: true,
      sortKey: "lastReviewed",
      filter: { type: "date", icon: "fa-calendar-check", operators: ["is", "is_not"] },
      cell: row => (
        <span className="text-sm tabular-nums text-muted-foreground whitespace-nowrap">{row.lastReviewed}</span>
      ),
    },
    {
      key: "actions",
      label: "",
      width: 48,
      minWidth: 48,
      defaultPin: "right",
      lockPin: true,
      cell: row => (
        <div className="flex items-center justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon-sm" variant="ghost" aria-label={`Actions for ${row.title}`}>
                <i className="fa-light fa-ellipsis text-sm" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem disabled>
                <i className="fa-light fa-eye" aria-hidden="true" />
                View details
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <i className="fa-light fa-user-check" aria-hidden="true" />
                Assign owner
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]

  return cols
}

function ComplianceDrawerToolbar({
  state,
  totalRows,
  filterFields,
  fieldDefinitionsForDrawer,
  resolveColumnLabel,
  displayOptions,
  onDisplayOptionsChange,
  conditionalRules,
  onAddConditionalRule,
  onRemoveConditionalRule,
  onUpdateConditionalRule,
  view,
  onViewChange,
  extraActions,
}: {
  state: ReturnType<typeof useTableState<ComplianceItem>>
  totalRows: number
  filterFields: FilterFieldDef[]
  fieldDefinitionsForDrawer: { key: string; label: string; sortable?: boolean }[]
  resolveColumnLabel: (key: string) => string
  displayOptions: DataListDisplayOptions
  onDisplayOptionsChange: (patch: Partial<DataListDisplayOptions>) => void
  conditionalRules: ConditionalRule[]
  onAddConditionalRule: (rule: Omit<ConditionalRule, "id">) => void
  onRemoveConditionalRule: (id: string) => void
  onUpdateConditionalRule: (id: string, patch: Partial<ConditionalRule>) => void
  view: DataListViewType
  onViewChange?: (v: DataListViewType) => void
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
        pagination={false}
        onPaginationChange={() => {}}
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
        lifecycleTabLabel="Compliance"
        fieldDefinitions={fieldDefinitionsForDrawer}
        resolveColumnLabel={resolveColumnLabel}
        displayOptions={displayOptions}
        onDisplayOptionsChange={onDisplayOptionsChange}
        currentView={view}
        onViewChange={onViewChange}
      />
    </>
  )
}

export type ComplianceTableHandle = OpenTablePropertiesHandle

export const ComplianceTable = React.forwardRef<
  ComplianceTableHandle,
  { items: ComplianceItem[]; view?: DataListViewType; onViewChange?: (v: DataListViewType) => void }
>(function ComplianceTable({ items, view = "table", onViewChange }, ref) {
  const columns = React.useMemo(() => buildComplianceColumns(items), [items])
  const filterFields = React.useMemo(() => columnsToFilterFields(columns), [columns])
  const fieldDefinitionsForDrawer = React.useMemo(
    () =>
      columns
        .filter(c => c.key !== "select" && c.key !== "actions")
        .map(c => ({ key: c.key, label: c.label, sortable: !!(c.sortable && (c.sortKey ?? c.key)) })),
    [columns],
  )

  const resolveColumnLabel = React.useCallback(
    (key: string) => columns.find(c => c.key === key)?.label ?? key,
    [columns],
  )

  const [displayOptions, setDisplayOptions] = React.useState<DataListDisplayOptions>(DEFAULT_DATA_LIST_DISPLAY_OPTIONS)
  const patchDisplay = React.useCallback((patch: Partial<DataListDisplayOptions>) => {
    setDisplayOptions(prev => ({ ...prev, ...patch }))
  }, [])

  const [conditionalRules, setConditionalRules] = React.useState<ConditionalRule[]>([])
  const addConditionalRule = React.useCallback((rule: Omit<ConditionalRule, "id">) => {
    setConditionalRules(prev => [...prev, { ...rule, id: `cr-${Date.now()}` }])
  }, [])
  const removeConditionalRule = React.useCallback((id: string) => {
    setConditionalRules(prev => prev.filter(r => r.id !== id))
  }, [])
  const updateConditionalRule = React.useCallback((id: string, patch: Partial<ConditionalRule>) => {
    setConditionalRules(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r))
  }, [])

  const tableState = useTableState(items, columns, { key: "dueDate", dir: "asc" })

  const dashboardKpi = React.useMemo(
    () => ({
      metrics: complianceKpiMetrics(tableState.rows as ComplianceItem[]),
      insight: complianceKpiInsight(tableState.rows as ComplianceItem[]),
    }),
    [tableState.rows],
  )

  const [visibleComplianceCards, setVisibleComplianceCards] = React.useState<string[]>(() =>
    ALL_COMPLIANCE_DASHBOARD_CARDS.map(c => c.id),
  )
  const [complianceCardOrder, setComplianceCardOrder] = React.useState<string[]>(() =>
    ALL_COMPLIANCE_DASHBOARD_CARDS.map(c => c.id),
  )
  const [complianceCardSpans, setComplianceCardSpans] = React.useState<Record<string, 1 | 2>>(() => ({
    ...DEFAULT_COMPLIANCE_SPANS,
  }))
  const [complianceCardChartTypes, setComplianceCardChartTypes] = React.useState<Record<string, ChartType>>(() => ({
    ...DEFAULT_COMPLIANCE_CHART_TYPES,
  }))
  const [complianceKeyMetricsKpiCount, setComplianceKeyMetricsKpiCount] = React.useState<number>(
    KEY_METRICS_KPI_COUNT_DEFAULT,
  )
  const [complianceDashboardLayoutEdit, setComplianceDashboardLayoutEdit] = React.useState(false)
  const complianceDashboardLayoutHydrated = React.useRef(false)
  const complianceDashboardLayoutEditBaselineRef = React.useRef<DashboardLayout | null>(null)

  React.useEffect(() => {
    const saved = loadComplianceDashboardLayout()
    const m = mergeComplianceDashboardLayout(saved)
    setVisibleComplianceCards(m.visible)
    setComplianceCardOrder(m.order)
    setComplianceCardSpans(m.spans ?? { ...DEFAULT_COMPLIANCE_SPANS })
    setComplianceCardChartTypes(m.chartTypes ?? { ...DEFAULT_COMPLIANCE_CHART_TYPES })
    setComplianceKeyMetricsKpiCount(m.keyMetricsKpiCount ?? KEY_METRICS_KPI_COUNT_DEFAULT)
    complianceDashboardLayoutHydrated.current = true
  }, [])

  React.useEffect(() => {
    if (!complianceDashboardLayoutHydrated.current) return
    saveComplianceDashboardLayout({
      visible: visibleComplianceCards,
      order: complianceCardOrder,
      spans: complianceCardSpans,
      chartTypes: complianceCardChartTypes,
      keyMetricsKpiCount: complianceKeyMetricsKpiCount,
    })
  }, [visibleComplianceCards, complianceCardOrder, complianceCardSpans, complianceCardChartTypes, complianceKeyMetricsKpiCount])

  const handleComplianceVisibleChange = React.useCallback((v: string[]) => {
    setVisibleComplianceCards(v)
  }, [])

  const handleComplianceOrderChange = React.useCallback((o: string[]) => {
    setComplianceCardOrder(o)
  }, [])

  const handleComplianceSpanChange = React.useCallback((id: string, span: 1 | 2) => {
    setComplianceCardSpans(prev => ({ ...prev, [id]: span }))
  }, [])

  const handleComplianceChartTypeChange = React.useCallback((id: string, t: ChartType) => {
    setComplianceCardChartTypes(prev => ({ ...prev, [id]: t }))
  }, [])

  const handleResetComplianceDashboardLayout = React.useCallback(() => {
    setVisibleComplianceCards(ALL_COMPLIANCE_DASHBOARD_CARDS.map(c => c.id))
    setComplianceCardOrder(ALL_COMPLIANCE_DASHBOARD_CARDS.map(c => c.id))
    setComplianceCardSpans({ ...DEFAULT_COMPLIANCE_SPANS })
    setComplianceCardChartTypes({ ...DEFAULT_COMPLIANCE_CHART_TYPES })
    setComplianceKeyMetricsKpiCount(KEY_METRICS_KPI_COUNT_DEFAULT)
  }, [])

  const handleComplianceDashboardLayoutEditStart = React.useCallback(() => {
    complianceDashboardLayoutEditBaselineRef.current = {
      visible: [...visibleComplianceCards],
      order: [...complianceCardOrder],
      spans: { ...complianceCardSpans },
      chartTypes: { ...complianceCardChartTypes },
      keyMetricsKpiCount: complianceKeyMetricsKpiCount,
    }
    setComplianceDashboardLayoutEdit(true)
  }, [visibleComplianceCards, complianceCardOrder, complianceCardSpans, complianceCardChartTypes, complianceKeyMetricsKpiCount])

  const handleComplianceDashboardLayoutEditDone = React.useCallback(() => {
    setComplianceDashboardLayoutEdit(false)
  }, [])

  const handleComplianceDashboardLayoutEditCancel = React.useCallback(() => {
    const b = complianceDashboardLayoutEditBaselineRef.current
    if (b) {
      setVisibleComplianceCards(b.visible)
      setComplianceCardOrder(b.order)
      setComplianceCardSpans(b.spans ?? { ...DEFAULT_COMPLIANCE_SPANS })
      setComplianceCardChartTypes(b.chartTypes ?? { ...DEFAULT_COMPLIANCE_CHART_TYPES })
      setComplianceKeyMetricsKpiCount(b.keyMetricsKpiCount ?? KEY_METRICS_KPI_COUNT_DEFAULT)
    }
    setComplianceDashboardLayoutEdit(false)
  }, [])

  const dashboardCustomizeCoach = useCoachMark({
    flowId: "compliance-dashboard-customize",
    steps: DASHBOARD_CUSTOMIZE_COACH_STEPS,
    delay: 700,
    enabled: view === "dashboard",
  })

  React.useImperativeHandle(ref, () => ({
    openPropertiesDrawer: () => {
      tableState.setSheetOpen(true)
    },
  }), [tableState.setSheetOpen])

  const drawerToolbarProps = {
    state: tableState,
    totalRows: items.length,
    filterFields,
    fieldDefinitionsForDrawer,
    resolveColumnLabel,
    displayOptions,
    onDisplayOptionsChange: patchDisplay,
    conditionalRules,
    onAddConditionalRule: addConditionalRule,
    onRemoveConditionalRule: removeConditionalRule,
    onUpdateConditionalRule: updateConditionalRule,
    view,
    onViewChange,
  }

  const tableProps = {
    data: items,
    columns,
    getRowId: (row: ComplianceItem) => row.id,
    getRowSelectionLabel: (row: ComplianceItem) => row.title,
    selectable: true,
    searchable: displayOptions.showToolbarSearch,
    showColumnHeaders: displayOptions.showColumnLabels,
    groupable: true,
    defaultSort: { key: "dueDate", dir: "asc" as const },
    emptyState: <p className="text-sm text-muted-foreground">No compliance items.</p>,
    conditionalRules,
    state: tableState,
    toolbarSlot: (s: ReturnType<typeof useTableState<ComplianceItem>>) => (
      <ComplianceDrawerToolbar {...drawerToolbarProps} state={s} />
    ),
    bulkActionsSlot: (selected: Set<string | number>) => {
      const n = selected.size
      if (n === 0) return null
      return (
        <>
          <span className="sr-only">{n} selected</span>
          <Tip label="Export selection (demo)">
            <Button size="sm" variant="outline" type="button">
              <i className="fa-light fa-arrow-down-to-line" aria-hidden="true" />
              Export
            </Button>
          </Tip>
        </>
      )
    },
  }

  if (view === "table") {
    return (
      <div className="pb-6">
        <DataTable<ComplianceItem> {...tableProps} />
      </div>
    )
  }

  const sharedToolbar = (
    <DataTableToolbar
      state={tableState}
      columns={columns}
      searchable={displayOptions.showToolbarSearch}
      searchAriaLabel="Search compliance obligations"
      toolbarSlot={s => <ComplianceDrawerToolbar {...drawerToolbarProps} state={s} />}
    />
  )

  if (view === "list") {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        {sharedToolbar}
        <ComplianceListView rows={tableState.rows as ComplianceItem[]} />
      </div>
    )
  }

  if (view === "board") {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        {sharedToolbar}
        <ComplianceBoardView rows={tableState.rows as ComplianceItem[]} />
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CoachMark state={dashboardCustomizeCoach} />
      {!complianceDashboardLayoutEdit ? (
        <DataTableToolbar
          state={tableState}
          columns={columns}
          searchable={displayOptions.showToolbarSearch}
          searchAriaLabel="Search compliance obligations"
          toolbarSlot={s => (
            <ComplianceDrawerToolbar
              {...drawerToolbarProps}
              state={s}
              extraActions={
                <Tip side="bottom" label="Edit dashboard layout on canvas">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Edit dashboard layout"
                    onClick={handleComplianceDashboardLayoutEditStart}
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
      <ComplianceDashboardChartsSection
        rows={tableState.rows as ComplianceItem[]}
        keyMetrics={dashboardKpi}
        visibleCards={visibleComplianceCards}
        cardOrder={complianceCardOrder}
        cardSpans={complianceCardSpans}
        cardChartTypes={complianceCardChartTypes}
        keyMetricsKpiCount={complianceKeyMetricsKpiCount}
        layoutEditMode={complianceDashboardLayoutEdit}
        onVisibleChange={handleComplianceVisibleChange}
        onOrderChange={handleComplianceOrderChange}
        onSpanChange={handleComplianceSpanChange}
        onChartTypeChange={handleComplianceChartTypeChange}
        onKeyMetricsKpiCountChange={setComplianceKeyMetricsKpiCount}
        onResetLayout={handleResetComplianceDashboardLayout}
        onLayoutEditDone={handleComplianceDashboardLayoutEditDone}
        onLayoutEditCancel={handleComplianceDashboardLayoutEditCancel}
      />
    </div>
  )
})

ComplianceTable.displayName = "ComplianceTable"
