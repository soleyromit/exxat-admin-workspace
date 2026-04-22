"use client"

/**
 * Team roster — DataTable + TablePropertiesDrawer + list/board/dashboard (shared `tableState.rows`).
 * Dashboard view uses `TeamDashboardChartsSection` (customise on canvas) + lib/mock/team-kpi.
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  TEAM_MEMBER_STATUS_BADGE_CLASS,
  TEAM_MEMBER_STATUS_ICON,
  TEAM_MEMBER_STATUS_LABEL,
} from "@/lib/list-status-badges"
import type { TeamMember } from "@/lib/mock/team"
import { DataTable, DataTableToolbar } from "@/components/data-table"
import {
  TeamDashboardChartsSection,
  DEFAULT_TEAM_CHART_TYPES,
  DEFAULT_TEAM_SPANS,
  ALL_TEAM_DASHBOARD_CARDS,
  loadTeamDashboardLayout,
  mergeTeamDashboardLayout,
  saveTeamDashboardLayout,
} from "@/components/data-view-dashboard-charts-team"
import { KEY_METRICS_KPI_COUNT_DEFAULT } from "@/lib/dashboard-layout-merge"
import type { ChartType, DashboardLayout } from "@/components/data-view-dashboard-charts"
import { TeamListView } from "@/components/team-list-view"
import { TeamBoardView } from "@/components/team-board-view"
import { teamKpiInsight, teamKpiMetrics } from "@/lib/mock/team-kpi"
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

function uniqueRoles(members: TeamMember[]) {
  return [...new Set(members.map(m => m.role))].sort().map(r => ({ value: r, label: r }))
}

const STATUS_FILTER_OPTS = [
  { value: "active", label: TEAM_MEMBER_STATUS_LABEL.active },
  { value: "away", label: TEAM_MEMBER_STATUS_LABEL.away },
  { value: "invited", label: TEAM_MEMBER_STATUS_LABEL.invited },
]

function columnToFilterFieldDef(c: ColumnDef<TeamMember>): FilterFieldDef | null {
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

function columnsToFilterFields(cols: ColumnDef<TeamMember>[]) {
  return cols.map(columnToFilterFieldDef).filter((x): x is FilterFieldDef => x !== null)
}

function buildTeamColumns(members: TeamMember[]): ColumnDef<TeamMember>[] {
  const roleOpts = uniqueRoles(members)

  const COLUMN_SELECT: ColumnDef<TeamMember> = {
    key: "select",
    label: "",
    width: 40,
    minWidth: 40,
    defaultPin: "left",
    lockPin: true,
  }

  const cols: ColumnDef<TeamMember>[] = [
    COLUMN_SELECT,
    {
      key: "name",
      label: "Name",
      width: 240,
      minWidth: 160,
      sortable: true,
      sortKey: "name",
      defaultPin: "left",
      filter: {
        type: "text",
        icon: "fa-user",
        operators: ["contains", "not_contains"],
      },
      cell: row => (
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
            style={{ background: "var(--avatar-initials-bg)", color: "var(--avatar-initials-fg)" }}
            aria-hidden
          >
            {row.initials}
          </span>
          <span className="truncate text-sm font-medium text-foreground">{row.name}</span>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      width: 200,
      minWidth: 140,
      sortable: true,
      sortKey: "role",
      filter: {
        type: "select",
        icon: "fa-briefcase",
        operators: ["is", "is_not"],
        options: roleOpts,
      },
      cell: row => <span className="text-sm text-foreground/90">{row.role}</span>,
    },
    {
      key: "email",
      label: "Email",
      width: 260,
      minWidth: 180,
      sortable: true,
      sortKey: "email",
      filter: {
        type: "text",
        icon: "fa-envelope",
        operators: ["contains", "not_contains"],
      },
      cell: row => (
        <a href={`mailto:${row.email}`} className="text-sm text-primary hover:underline truncate block">
          {row.email}
        </a>
      ),
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
          label={TEAM_MEMBER_STATUS_LABEL[row.status]}
          tintClassName={TEAM_MEMBER_STATUS_BADGE_CLASS[row.status]}
          icon={TEAM_MEMBER_STATUS_ICON[row.status]}
        />
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
              <Button size="icon-sm" variant="ghost" aria-label={`Actions for ${row.name}`}>
                <i className="fa-light fa-ellipsis text-sm" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => window.open(`mailto:${row.email}`)}>
                <i className="fa-light fa-envelope" aria-hidden="true" />
                Email
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <i className="fa-light fa-user-gear" aria-hidden="true" />
                Manage access
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]

  return cols
}

function TeamDrawerToolbar({
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
  state: ReturnType<typeof useTableState<TeamMember>>
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
        lifecycleTabLabel="Team"
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

export type TeamTableHandle = OpenTablePropertiesHandle

export const TeamTable = React.forwardRef<
  TeamTableHandle,
  { members: TeamMember[]; view?: DataListViewType; onViewChange?: (v: DataListViewType) => void }
>(function TeamTable({ members, view = "table", onViewChange }, ref) {
  const columns = React.useMemo(() => buildTeamColumns(members), [members])
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

  const tableState = useTableState(members, columns, { key: "name", dir: "asc" })

  const dashboardKpi = React.useMemo(
    () => ({
      metrics: teamKpiMetrics(tableState.rows),
      insight: teamKpiInsight(tableState.rows),
    }),
    [tableState.rows],
  )

  const [visibleTeamCards, setVisibleTeamCards] = React.useState<string[]>(() => ALL_TEAM_DASHBOARD_CARDS.map(c => c.id))
  const [teamCardOrder, setTeamCardOrder] = React.useState<string[]>(() => ALL_TEAM_DASHBOARD_CARDS.map(c => c.id))
  const [teamCardSpans, setTeamCardSpans] = React.useState<Record<string, 1 | 2>>(() => ({ ...DEFAULT_TEAM_SPANS }))
  const [teamCardChartTypes, setTeamCardChartTypes] = React.useState<Record<string, ChartType>>(() => ({ ...DEFAULT_TEAM_CHART_TYPES }))
  const [teamKeyMetricsKpiCount, setTeamKeyMetricsKpiCount] = React.useState<number>(KEY_METRICS_KPI_COUNT_DEFAULT)
  const [teamDashboardLayoutEdit, setTeamDashboardLayoutEdit] = React.useState(false)
  const teamDashboardLayoutHydrated = React.useRef(false)
  const teamDashboardLayoutEditBaselineRef = React.useRef<DashboardLayout | null>(null)

  React.useEffect(() => {
    const saved = loadTeamDashboardLayout()
    const m = mergeTeamDashboardLayout(saved)
    setVisibleTeamCards(m.visible)
    setTeamCardOrder(m.order)
    setTeamCardSpans(m.spans ?? { ...DEFAULT_TEAM_SPANS })
    setTeamCardChartTypes(m.chartTypes ?? { ...DEFAULT_TEAM_CHART_TYPES })
    setTeamKeyMetricsKpiCount(m.keyMetricsKpiCount ?? KEY_METRICS_KPI_COUNT_DEFAULT)
    teamDashboardLayoutHydrated.current = true
  }, [])

  React.useEffect(() => {
    if (!teamDashboardLayoutHydrated.current) return
    saveTeamDashboardLayout({
      visible: visibleTeamCards,
      order: teamCardOrder,
      spans: teamCardSpans,
      chartTypes: teamCardChartTypes,
      keyMetricsKpiCount: teamKeyMetricsKpiCount,
    })
  }, [visibleTeamCards, teamCardOrder, teamCardSpans, teamCardChartTypes, teamKeyMetricsKpiCount])

  const handleTeamVisibleChange = React.useCallback((v: string[]) => {
    setVisibleTeamCards(v)
  }, [])

  const handleTeamOrderChange = React.useCallback((o: string[]) => {
    setTeamCardOrder(o)
  }, [])

  const handleTeamSpanChange = React.useCallback((id: string, span: 1 | 2) => {
    setTeamCardSpans(prev => ({ ...prev, [id]: span }))
  }, [])

  const handleTeamChartTypeChange = React.useCallback((id: string, t: ChartType) => {
    setTeamCardChartTypes(prev => ({ ...prev, [id]: t }))
  }, [])

  const handleResetTeamDashboardLayout = React.useCallback(() => {
    setVisibleTeamCards(ALL_TEAM_DASHBOARD_CARDS.map(c => c.id))
    setTeamCardOrder(ALL_TEAM_DASHBOARD_CARDS.map(c => c.id))
    setTeamCardSpans({ ...DEFAULT_TEAM_SPANS })
    setTeamCardChartTypes({ ...DEFAULT_TEAM_CHART_TYPES })
    setTeamKeyMetricsKpiCount(KEY_METRICS_KPI_COUNT_DEFAULT)
  }, [])

  const handleTeamDashboardLayoutEditStart = React.useCallback(() => {
    teamDashboardLayoutEditBaselineRef.current = {
      visible: [...visibleTeamCards],
      order: [...teamCardOrder],
      spans: { ...teamCardSpans },
      chartTypes: { ...teamCardChartTypes },
      keyMetricsKpiCount: teamKeyMetricsKpiCount,
    }
    setTeamDashboardLayoutEdit(true)
  }, [visibleTeamCards, teamCardOrder, teamCardSpans, teamCardChartTypes, teamKeyMetricsKpiCount])

  const handleTeamDashboardLayoutEditDone = React.useCallback(() => {
    setTeamDashboardLayoutEdit(false)
  }, [])

  const handleTeamDashboardLayoutEditCancel = React.useCallback(() => {
    const b = teamDashboardLayoutEditBaselineRef.current
    if (b) {
      setVisibleTeamCards(b.visible)
      setTeamCardOrder(b.order)
      setTeamCardSpans(b.spans ?? { ...DEFAULT_TEAM_SPANS })
      setTeamCardChartTypes(b.chartTypes ?? { ...DEFAULT_TEAM_CHART_TYPES })
      setTeamKeyMetricsKpiCount(b.keyMetricsKpiCount ?? KEY_METRICS_KPI_COUNT_DEFAULT)
    }
    setTeamDashboardLayoutEdit(false)
  }, [])

  const dashboardCustomizeCoach = useCoachMark({
    flowId: "team-dashboard-customize",
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
    totalRows: members.length,
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
    data: members,
    columns,
    getRowId: (row: TeamMember) => row.id,
    getRowSelectionLabel: (row: TeamMember) => row.name,
    selectable: true,
    searchable: displayOptions.showToolbarSearch,
    showColumnHeaders: displayOptions.showColumnLabels,
    groupable: true,
    defaultSort: { key: "name", dir: "asc" as const },
    emptyState: <p className="text-sm text-muted-foreground">No team members.</p>,
    conditionalRules,
    state: tableState,
    toolbarSlot: (s: ReturnType<typeof useTableState<TeamMember>>) => (
      <TeamDrawerToolbar {...drawerToolbarProps} state={s} />
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
        <DataTable<TeamMember> {...tableProps} />
      </div>
    )
  }

  const sharedToolbar = (
    <DataTableToolbar
      state={tableState}
      columns={columns}
      searchable={displayOptions.showToolbarSearch}
      searchAriaLabel="Search team members"
      toolbarSlot={s => <TeamDrawerToolbar {...drawerToolbarProps} state={s} />}
    />
  )

  if (view === "list") {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        {sharedToolbar}
        <TeamListView members={tableState.rows} />
      </div>
    )
  }

  if (view === "board") {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        {sharedToolbar}
        <TeamBoardView members={tableState.rows} />
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CoachMark state={dashboardCustomizeCoach} />
      {!teamDashboardLayoutEdit ? (
        <DataTableToolbar
          state={tableState}
          columns={columns}
          searchable={displayOptions.showToolbarSearch}
          searchAriaLabel="Search team members"
          toolbarSlot={s => (
            <TeamDrawerToolbar
              {...drawerToolbarProps}
              state={s}
              extraActions={
                <Tip side="bottom" label="Edit dashboard layout on canvas">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Edit dashboard layout"
                    onClick={handleTeamDashboardLayoutEditStart}
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
      <TeamDashboardChartsSection
        members={tableState.rows as TeamMember[]}
        keyMetrics={dashboardKpi}
        visibleCards={visibleTeamCards}
        cardOrder={teamCardOrder}
        cardSpans={teamCardSpans}
        cardChartTypes={teamCardChartTypes}
        keyMetricsKpiCount={teamKeyMetricsKpiCount}
        layoutEditMode={teamDashboardLayoutEdit}
        onVisibleChange={handleTeamVisibleChange}
        onOrderChange={handleTeamOrderChange}
        onSpanChange={handleTeamSpanChange}
        onChartTypeChange={handleTeamChartTypeChange}
        onKeyMetricsKpiCountChange={setTeamKeyMetricsKpiCount}
        onResetLayout={handleResetTeamDashboardLayout}
        onLayoutEditDone={handleTeamDashboardLayoutEditDone}
        onLayoutEditCancel={handleTeamDashboardLayoutEditCancel}
      />
    </div>
  )
})

TeamTable.displayName = "TeamTable"
