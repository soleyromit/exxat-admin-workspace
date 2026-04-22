"use client"

/**
 * Question bank — DataTable + TablePropertiesDrawer + list/board/dashboard (KPI + charts on dashboard).
 */

import * as React from "react"
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"
import { ChartCard, ChartDataTable, ChartFigure } from "@/components/charts-overview"
import { DataTable, DataTableToolbar } from "@/components/data-table"
import type { DataListViewType } from "@/lib/data-list-view"
import type { OpenTablePropertiesHandle } from "@/lib/list-page-table-properties"
import type { ColumnDef } from "@/components/data-table/types"
import { useTableState } from "@/components/data-table/use-table-state"
import { TablePropertiesDrawer } from "@/components/table-properties"
import type { ConditionalRule, FilterFieldDef, FilterOperator } from "@/components/table-properties/types"
import { ListHubStatusBadge } from "@/components/list-hub-status-badge"
import { Button } from "@/components/ui/button"
import {
  ChartContainer,
  ChartTooltip,
  chartTooltipKeyboardSyncProps,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
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
import { KeyMetrics } from "@/components/key-metrics"
import { QuestionBankBoardView } from "@/components/question-bank-board-view"
import { QuestionBankListView } from "@/components/question-bank-list-view"
import { CHART_KBD_ACTIVE_BAR } from "@/lib/chart-keyboard-selection"
import { cn } from "@/lib/utils"
import type { QuestionBankDifficulty, QuestionBankItem, QuestionBankType } from "@/lib/mock/question-bank"
import { questionBankKpiInsight, questionBankKpiMetrics } from "@/lib/mock/question-bank-kpi"
import {
  QUESTION_BANK_STATUS_BADGE_CLASS,
  QUESTION_BANK_STATUS_ICON,
  QUESTION_BANK_STATUS_LABEL,
} from "@/lib/list-status-badges"
import {
  DEFAULT_DATA_LIST_DISPLAY_OPTIONS,
  type DataListDisplayOptions,
} from "@/lib/data-list-display-options"

const TYPE_LABEL: Record<QuestionBankType, string> = {
  multiple_choice: "Multiple choice",
  true_false: "True / false",
  short_answer: "Short answer",
}

const DIFFICULTY_LABEL: Record<QuestionBankDifficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
}

const BAR_CFG: ChartConfig = {
  count: { label: "Questions", color: "var(--color-chart-2)" },
}

function uniqueTopics(items: QuestionBankItem[]) {
  return [...new Set(items.map(i => i.topic))].sort().map(t => ({ value: t, label: t }))
}

const STATUS_FILTER_OPTS = [
  { value: "published", label: QUESTION_BANK_STATUS_LABEL.published },
  { value: "draft", label: QUESTION_BANK_STATUS_LABEL.draft },
  { value: "in_review", label: QUESTION_BANK_STATUS_LABEL.in_review },
]

const TYPE_FILTER_OPTS = (Object.keys(TYPE_LABEL) as QuestionBankType[]).map(k => ({
  value: k,
  label: TYPE_LABEL[k],
}))

const DIFFICULTY_FILTER_OPTS = (Object.keys(DIFFICULTY_LABEL) as QuestionBankDifficulty[]).map(k => ({
  value: k,
  label: DIFFICULTY_LABEL[k],
}))

function columnToFilterFieldDef(c: ColumnDef<QuestionBankItem>): FilterFieldDef | null {
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

function columnsToFilterFields(cols: ColumnDef<QuestionBankItem>[]) {
  return cols.map(columnToFilterFieldDef).filter((x): x is FilterFieldDef => x !== null)
}

function buildQuestionBankColumns(items: QuestionBankItem[]): ColumnDef<QuestionBankItem>[] {
  const topicOpts = uniqueTopics(items)

  const COLUMN_SELECT: ColumnDef<QuestionBankItem> = {
    key: "select",
    label: "",
    width: 40,
    minWidth: 40,
    defaultPin: "left",
    lockPin: true,
  }

  const cols: ColumnDef<QuestionBankItem>[] = [
    COLUMN_SELECT,
    {
      key: "stem",
      label: "Question",
      width: 300,
      minWidth: 160,
      sortable: true,
      sortKey: "stem",
      defaultPin: "left",
      filter: {
        type: "text",
        icon: "fa-file-lines",
        operators: ["contains", "not_contains"],
      },
      cell: row => (
        <span className="line-clamp-2 text-sm font-medium text-foreground">{row.stem}</span>
      ),
    },
    {
      key: "topic",
      label: "Topic",
      width: 160,
      minWidth: 120,
      sortable: true,
      sortKey: "topic",
      filter: {
        type: "select",
        icon: "fa-layer-group",
        operators: ["is", "is_not"],
        options: topicOpts,
      },
      cell: row => <span className="text-sm text-foreground/90">{row.topic}</span>,
    },
    {
      key: "type",
      label: "Type",
      width: 140,
      minWidth: 120,
      sortable: true,
      sortKey: "type",
      filter: {
        type: "select",
        icon: "fa-list-check",
        operators: ["is", "is_not"],
        options: TYPE_FILTER_OPTS,
      },
      cell: row => <span className="text-sm text-foreground/90">{TYPE_LABEL[row.type]}</span>,
    },
    {
      key: "difficulty",
      label: "Difficulty",
      width: 110,
      minWidth: 96,
      sortable: true,
      sortKey: "difficulty",
      filter: {
        type: "select",
        icon: "fa-signal",
        operators: ["is", "is_not"],
        options: DIFFICULTY_FILTER_OPTS,
      },
      cell: row => (
        <span className="text-sm text-foreground/90">{DIFFICULTY_LABEL[row.difficulty]}</span>
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
          label={QUESTION_BANK_STATUS_LABEL[row.status]}
          tintClassName={QUESTION_BANK_STATUS_BADGE_CLASS[row.status]}
          icon={QUESTION_BANK_STATUS_ICON[row.status]}
        />
      ),
    },
    {
      key: "updatedAt",
      label: "Updated",
      width: 120,
      minWidth: 100,
      sortable: true,
      sortKey: "updatedAt",
      filter: { type: "date", icon: "fa-calendar", operators: ["is", "is_not"] },
      cell: row => (
        <span className="text-sm tabular-nums text-foreground/90 whitespace-nowrap">{row.updatedAt}</span>
      ),
    },
    {
      key: "author",
      label: "Author",
      width: 140,
      minWidth: 120,
      sortable: true,
      sortKey: "author",
      filter: {
        type: "text",
        icon: "fa-user",
        operators: ["contains", "not_contains"],
      },
      cell: row => <span className="text-sm text-foreground/90">{row.author}</span>,
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
              <Button size="icon-sm" variant="ghost" aria-label={`Actions for question ${row.id}`}>
                <i className="fa-light fa-ellipsis text-sm" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem disabled>
                <i className="fa-light fa-eye" aria-hidden="true" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <i className="fa-light fa-pen" aria-hidden="true" />
                Edit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]

  return cols
}

function QuestionBankDrawerToolbar({
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
  state: ReturnType<typeof useTableState<QuestionBankItem>>
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
        lifecycleTabLabel="Question bank"
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

function aggregateByStatus(rows: QuestionBankItem[]) {
  const c = { published: 0, draft: 0, in_review: 0 }
  for (const r of rows) c[r.status]++
  return [
    { name: QUESTION_BANK_STATUS_LABEL.published, value: c.published, key: "published" },
    { name: QUESTION_BANK_STATUS_LABEL.draft, value: c.draft, key: "draft" },
    { name: QUESTION_BANK_STATUS_LABEL.in_review, value: c.in_review, key: "in_review" },
  ]
}

function aggregateByTopic(rows: QuestionBankItem[]) {
  const map = new Map<string, number>()
  for (const r of rows) map.set(r.topic, (map.get(r.topic) ?? 0) + 1)
  return [...map.entries()]
    .map(([name, value]) => ({ name: name.length > 20 ? `${name.slice(0, 18)}…` : name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)
}

function QuestionsByStatusChart({ rows }: { rows: QuestionBankItem[] }) {
  const data = React.useMemo(() => aggregateByStatus(rows), [rows])
  if (rows.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground" role="status">
        No questions in this view.
      </div>
    )
  }
  const summary = `Status breakdown: ${data.map(d => `${d.name} ${d.value}`).join(", ")}. Total ${rows.length}.`
  return (
    <ChartFigure label="Questions by status" summary={summary} dataLength={data.length}>
      {(activeIndex) => (
        <>
          <ChartContainer config={BAR_CFG} className="h-[220px] w-full">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} width={32} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
              <Bar
                dataKey="value"
                fill="var(--color-chart-2)"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
                activeBar={CHART_KBD_ACTIVE_BAR}
                activeIndex={activeIndex ?? undefined}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill="var(--color-chart-2)" />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
          <ChartDataTable
            caption="Questions by status"
            headers={["Status", "Count"]}
            rows={data.map(d => [d.name, d.value])}
          />
        </>
      )}
    </ChartFigure>
  )
}

function QuestionsByTopicChart({ rows }: { rows: QuestionBankItem[] }) {
  const data = React.useMemo(() => aggregateByTopic(rows), [rows])
  if (rows.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground" role="status">
        No questions in this view.
      </div>
    )
  }
  const summary = `${data.length} topics shown. Total ${rows.length} questions.`
  return (
    <ChartFigure label="Questions by topic" summary={summary} dataLength={data.length}>
      {(activeIndex) => (
        <>
          <ChartContainer config={BAR_CFG} className="h-[220px] w-full">
            <BarChart data={data} layout="vertical" margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
              <Bar
                dataKey="value"
                fill="var(--color-chart-4)"
                radius={[0, 4, 4, 0]}
                maxBarSize={22}
                activeBar={CHART_KBD_ACTIVE_BAR}
                activeIndex={activeIndex ?? undefined}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill="var(--color-chart-4)" />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
          <ChartDataTable
            caption="Questions by topic"
            headers={["Topic", "Count"]}
            rows={data.map(d => [d.name, d.value])}
          />
        </>
      )}
    </ChartFigure>
  )
}

function QuestionBankDashboardSimple({ rows }: { rows: QuestionBankItem[] }) {
  const kpi = React.useMemo(
    () => ({
      metrics: questionBankKpiMetrics(rows),
      insight: questionBankKpiInsight(rows),
    }),
    [rows],
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 pb-6">
      <KeyMetrics
        variant="flat"
        metrics={kpi.metrics}
        insight={kpi.insight}
        showHeader={false}
        metricsSingleRow
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard variant="normal" title="By status" description="Filtered question set">
          <QuestionsByStatusChart rows={rows} />
        </ChartCard>
        <ChartCard variant="normal" title="By topic" description="Up to eight topics">
          <QuestionsByTopicChart rows={rows} />
        </ChartCard>
      </div>
    </div>
  )
}

export type QuestionBankTableHandle = OpenTablePropertiesHandle

export const QuestionBankTable = React.forwardRef<
  QuestionBankTableHandle,
  { items: QuestionBankItem[]; view?: DataListViewType; onViewChange?: (v: DataListViewType) => void }
>(function QuestionBankTable({ items, view = "table", onViewChange }, ref) {
  const columns = React.useMemo(() => buildQuestionBankColumns(items), [items])
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

  const tableState = useTableState(items, columns, { key: "updatedAt", dir: "desc" })

  React.useImperativeHandle(ref, () => ({
    openPropertiesDrawer: () => {
      tableState.setSheetOpen(true)
    },
  }), [tableState])

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
    getRowId: (row: QuestionBankItem) => row.id,
    getRowSelectionLabel: (row: QuestionBankItem) => row.stem,
    selectable: true,
    searchable: displayOptions.showToolbarSearch,
    showColumnHeaders: displayOptions.showColumnLabels,
    groupable: true,
    defaultSort: { key: "updatedAt", dir: "desc" as const },
    emptyState: <p className="text-sm text-muted-foreground">No questions in the bank.</p>,
    conditionalRules,
    state: tableState,
    toolbarSlot: (s: ReturnType<typeof useTableState<QuestionBankItem>>) => (
      <QuestionBankDrawerToolbar {...drawerToolbarProps} state={s} />
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
        <DataTable<QuestionBankItem> {...tableProps} />
      </div>
    )
  }

  const sharedToolbar = (
    <DataTableToolbar
      state={tableState}
      columns={columns}
      searchable={displayOptions.showToolbarSearch}
      searchAriaLabel="Search questions"
      toolbarSlot={s => <QuestionBankDrawerToolbar {...drawerToolbarProps} state={s} />}
    />
  )

  if (view === "list") {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        {sharedToolbar}
        <QuestionBankListView rows={tableState.rows as QuestionBankItem[]} />
      </div>
    )
  }

  if (view === "board") {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        {sharedToolbar}
        <QuestionBankBoardView rows={tableState.rows as QuestionBankItem[]} />
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DataTableToolbar
        state={tableState}
        columns={columns}
        searchable={displayOptions.showToolbarSearch}
        searchAriaLabel="Search questions"
        toolbarSlot={s => <QuestionBankDrawerToolbar {...drawerToolbarProps} state={s} />}
      />
      <QuestionBankDashboardSimple rows={tableState.rows as QuestionBankItem[]} />
    </div>
  )
})

QuestionBankTable.displayName = "QuestionBankTable"
