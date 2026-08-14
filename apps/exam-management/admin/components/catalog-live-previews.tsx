"use client"

/**
 * Catalog detail-pane previews — compose real DS components (no bespoke stand-ins).
 */

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartCard,
  ChartLeoPlotInsightOverlay,
  CATALOG_PREVIEW_CHART_LEO,
  type ChartCardVariant,
} from "@/components/charts-overview"
import { KeyMetrics, type MetricItem } from "@/components/key-metrics"
import { LibraryBoardCard, LibraryBoardView, LibraryListRowCard } from "@/components/library-board-view"
import { buildLibraryHubColumnDefs } from "@/components/library-table"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ColumnTypesRuleDemoTable } from "@/components/column-types-rule-demo-client"
import { DataTable, DataTableToolbar } from "@/components/data-table"
import { useTableState } from "@/components/data-table/use-table-state"
import type { ColumnDef } from "@/components/data-table/types"
import { HubTable } from "@/components/data-views"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ViewSegmentedControl } from "@/components/ui/view-segmented-control"
import { CHART_AXIS_TICK } from "@/lib/chart-typography"
import { toggleLibraryItemFavorite } from "@/lib/library-nav"
import { LIBRARY_ITEMS, type LibraryItem } from "@/lib/mock/library"
import { cn } from "@/lib/utils"

const CATALOG_LIBRARY_ROWS: LibraryItem[] = LIBRARY_ITEMS.slice(0, 9)

const CATALOG_METRICS: MetricItem[] = [
  {
    id: "published",
    label: "Published",
    value: 128,
    delta: "+6",
    trend: "up",
    trendPolarity: "higher_is_better",
    progress: 82,
    description: "82% of Q2 publishing goal",
  },
  {
    id: "draft",
    label: "Draft",
    value: 14,
    delta: "−2",
    trend: "down",
    trendPolarity: "higher_is_better",
    progress: 28,
    progressTone: "info",
    description: "14 drafts awaiting faculty sign-off",
  },
  {
    id: "review",
    label: "In review",
    value: 9,
    delta: "",
    trend: "neutral",
    trendPolarity: "informational",
    progress: 45,
    description: "Median review time 3.2 days",
  },
]

const CATALOG_CHART_DATA = [
  { month: "Jan", placements: 42 },
  { month: "Feb", placements: 58 },
  { month: "Mar", placements: 74 },
  { month: "Apr", placements: 68 },
  { month: "May", placements: 81 },
]

const catalogChartConfig = {
  placements: { label: "Placements", color: "var(--brand-color)" },
} as const

const CATALOG_CHART_FILTER_OPTIONS = [
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last quarter" },
  { value: "1y", label: "Last year" },
]

const CATALOG_CHART_VARIANT_OPTIONS: {
  value: ChartCardVariant
  label: string
  icon: string
}[] = [
  { value: "normal", label: "Normal", icon: "fa-light fa-chart-column" },
  { value: "tabs", label: "Tabs", icon: "fa-light fa-table-columns" },
  { value: "selector", label: "Selector", icon: "fa-light fa-filter" },
  { value: "metrics-tabs", label: "Metrics", icon: "fa-light fa-gauge-high" },
  { value: "kpi-chart", label: "KPI", icon: "fa-light fa-hashtag" },
]

function CatalogMiniBarChart() {
  return (
    <div className="relative w-full min-h-[180px] flex-1">
      <ChartContainer config={catalogChartConfig} className="h-[180px] w-full">
        <BarChart data={CATALOG_CHART_DATA} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} />
          <YAxis tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} width={32} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="placements" fill="var(--brand-color)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
      <ChartLeoPlotInsightOverlay data={CATALOG_CHART_DATA} xDataKey="month" />
    </div>
  )
}

const CATALOG_CHART_MINI_METRICS = [
  { label: "Placements", value: "128", trend: "up" as const, trendPolarity: "higher_is_better" as const },
  { label: "Applications", value: "214", trend: "up" as const, trendPolarity: "informational" as const },
  { label: "Reviews", value: "42", trend: "neutral" as const, trendPolarity: "informational" as const },
]

export function CatalogChartCardVariantPreview({
  variant,
  className,
}: {
  variant: ChartCardVariant
  className?: string
}) {
  const needsMiniMetrics = variant === "metrics-tabs" || variant === "kpi-chart"
  const needsSelectorFilter = variant === "selector"

  return (
    <ChartCard
      variant={variant}
      title="Placements by month"
      description="Monthly placement activity"
      filterOptions={needsSelectorFilter ? CATALOG_CHART_FILTER_OPTIONS : undefined}
      defaultFilter={needsSelectorFilter ? "30d" : undefined}
      miniMetrics={needsMiniMetrics ? CATALOG_CHART_MINI_METRICS : undefined}
      leoInsight={CATALOG_PREVIEW_CHART_LEO}
      className={cn("min-h-[280px]", className)}
    >
      <CatalogMiniBarChart />
    </ChartCard>
  )
}

export function CatalogChartCardPreview({ className }: { className?: string }) {
  const [variant, setVariant] = React.useState<ChartCardVariant>("metrics-tabs")

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <ViewSegmentedControl
        value={variant}
        onValueChange={(v) => setVariant(v as ChartCardVariant)}
        aria-label="ChartCard variant"
        options={CATALOG_CHART_VARIANT_OPTIONS}
      />
      <CatalogChartCardVariantPreview variant={variant} />
    </div>
  )
}

export function CatalogKeyMetricsPreview({ className }: { className?: string }) {
  const [variant, setVariant] = React.useState<"flat" | "card" | "cards">("flat")

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <ViewSegmentedControl
        value={variant}
        onValueChange={setVariant}
        aria-label="KeyMetrics variant"
        options={[
          { value: "flat", label: "Flat band", icon: "fa-light fa-grip-lines" },
          { value: "card", label: "Card strip", icon: "fa-light fa-square" },
          { value: "cards", label: "Metric cards", icon: "fa-light fa-grid-2" },
        ]}
      />
      <KeyMetrics
        variant={variant}
        metrics={CATALOG_METRICS}
        insight={
          variant === "cards"
            ? {
                title: "Throughput note",
                description: "3 placements need coordinator review before Friday.",
                severity: "warning",
                actionLabel: "Ask Leo",
              }
            : undefined
        }
        title="Placement health"
        description="Spring 2026 cohort"
        showHeader={variant === "card" || variant === "cards"}
        metricsSingleRow={variant !== "cards"}
      />
    </div>
  )
}

export function CatalogPageHeaderPreview() {
  return (
    <PageHeader
      title="Question bank"
      subtitle="128 published · updated today"
      actions={
        <Button type="button" size="sm">
          New question
        </Button>
      }
    />
  )
}

export function CatalogBoardCardPreview() {
  return (
    <LibraryBoardCard
      row={CATALOG_LIBRARY_ROWS[0]!}
      onToggleFavorite={() => {}}
    />
  )
}

export function CatalogLibraryListRowPreview() {
  return (
    <LibraryListRowCard
      row={CATALOG_LIBRARY_ROWS[0]!}
      onToggleFavorite={() => {}}
    />
  )
}

function CatalogLibraryHubTablePreview({
  rows,
  onRowsChange,
}: {
  rows: LibraryItem[]
  onRowsChange: React.Dispatch<React.SetStateAction<LibraryItem[]>>
}) {
  const toggleFavorite = React.useCallback(
    (row: LibraryItem) => {
      onRowsChange((prev) =>
        prev.map((item) => (item.id === row.id ? toggleLibraryItemFavorite(item) : item)),
      )
    },
    [onRowsChange],
  )

  const columns = React.useMemo(
    () => buildLibraryHubColumnDefs(rows, toggleFavorite),
    [rows, toggleFavorite],
  )

  return (
    <div className="min-h-0 overflow-x-auto rounded-lg border border-border bg-muted/20">
      <HubTable<LibraryItem>
        rows={rows}
        columns={columns}
        view="table"
        hubLabel="Question bank"
        lifecycleTabLabel="All questions"
        searchAriaLabel="Search questions"
        getRowId={(row) => row.id}
        getRowSelectionLabel={(row) => row.stem}
        defaultSort={{ key: "stem", dir: "asc" }}
        emptyState="No questions."
        renderers={{}}
        supportedViewTypes={["table"]}
        persistKey="catalog-preview:library-hub-table"
        pagination={false}
      />
    </div>
  )
}

export function CatalogLibraryHubLivePreview({ className }: { className?: string }) {
  const [view, setView] = React.useState<"table" | "board">("board")
  const [rows, setRows] = React.useState(CATALOG_LIBRARY_ROWS)

  const toggleFavorite = React.useCallback((row: LibraryItem) => {
    setRows((prev) =>
      prev.map((item) => (item.id === row.id ? toggleLibraryItemFavorite(item) : item)),
    )
  }, [])

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <ViewSegmentedControl
        value={view}
        onValueChange={setView}
        aria-label="Library view"
        options={[
          { value: "table", label: "Table", icon: "fa-light fa-table" },
          { value: "board", label: "Board", icon: "fa-light fa-columns" },
        ]}
      />
      {view === "board" ? (
        <div className="overflow-x-auto rounded-lg border border-border bg-muted/20">
          <LibraryBoardView
            rows={rows}
            groupByColumnKey="topic"
            onToggleFavorite={toggleFavorite}
          />
        </div>
      ) : (
        <CatalogLibraryHubTablePreview rows={rows} onRowsChange={setRows} />
      )}
    </div>
  )
}

export function CatalogHubTablePreview({ className }: { className?: string }) {
  return (
    <ColumnTypesRuleDemoTable
      persistKey="catalog-preview:hub-table"
      className={cn("min-h-0", className)}
      embeddedPreview
    />
  )
}

type CatalogGridRow = {
  id: string
  name: string
  status: string
  updated: string
} & Record<string, unknown>

const CATALOG_GRID_ROWS: CatalogGridRow[] = [
  { id: "q_101", name: "Diaphragm innervation", status: "Published", updated: "2026-06-01" },
  { id: "q_102", name: "Brachial plexus roots", status: "Draft", updated: "2026-06-02" },
  { id: "q_103", name: "Cranial nerve functions", status: "In review", updated: "2026-06-03" },
  { id: "q_104", name: "Lower limb dermatomes", status: "Published", updated: "2026-06-04" },
  { id: "q_105", name: "Spinal cord tracts", status: "Draft", updated: "2026-06-05" },
]

const CATALOG_GRID_COLUMNS: ColumnDef<CatalogGridRow>[] = [
  {
    key: "name",
    label: "Question",
    width: 280,
    filter: { type: "text" },
  },
  {
    key: "status",
    label: "Status",
    width: 120,
    filter: {
      type: "select",
      options: [
        { value: "Published", label: "Published" },
        { value: "Draft", label: "Draft" },
        { value: "In review", label: "In review" },
      ],
    },
  },
  {
    key: "updated",
    label: "Updated",
    width: 120,
    filter: { type: "date" },
  },
]

/** Core grid only — sort, filters, resize. Hubs wrap this in HubTable (+ Properties, views). */
export function CatalogDataTablePreview({ className }: { className?: string }) {
  const columns = React.useMemo(() => CATALOG_GRID_COLUMNS, [])
  const state = useTableState(CATALOG_GRID_ROWS, columns, { key: "name", dir: "asc" })

  return (
    <div className={cn("flex min-h-0 flex-col gap-2", className)}>
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">DataTable</span> — the grid primitive. List hubs compose it
        via <span className="font-medium text-foreground">HubTable</span> (toolbar + Properties + board/list/dashboard).
      </p>
      <div className="overflow-hidden rounded-lg border border-border bg-background">
        <DataTableToolbar state={state} columns={columns} searchAriaLabel="Search questions" />
        <DataTable
          data={CATALOG_GRID_ROWS}
          columns={columns}
          getRowId={(row) => row.id}
          getRowSelectionLabel={(row) => row.name}
          state={state}
          defaultSort={{ key: "name", dir: "asc" }}
          emptyState="No questions match your filters."
        />
      </div>
    </div>
  )
}
