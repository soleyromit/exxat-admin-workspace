"use client"

/**
 * Library **Data** view — KPI strip + Recharts cards with layout customise canvas.
 */

import * as React from "react"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts"
import { ChartDataTable, ChartFigure } from "@/components/charts-overview"
import { DataViewDashboardCanvas } from "@/components/data-view-dashboard-canvas"
import {
  ChartContainer,
  ChartTooltip,
  chartTooltipKeyboardSyncProps,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  CHART_KBD_ACTIVE_BAR,
  CHART_KBD_ACTIVE_PIE_SHAPE,
} from "@/lib/chart-keyboard-selection"
import {
  CHART_AXIS_TICK,
} from "@/lib/chart-typography"
import type { ChartType } from "@/lib/data-view-dashboard-layout-types"
import {
  ALL_DASHBOARD_CARDS,
  DEFAULT_CHART_TYPES,
  DEFAULT_SPANS,
  DEFAULT_VISIBLE_CARDS,
  KEY_METRICS_CARD_ID,
} from "@/lib/data-view-dashboard-library-layout"
import type { LibraryItem, LibraryItemType } from "@/lib/mock/library"
import { libraryKpiInsight, libraryKpiMetrics } from "@/lib/mock/library-kpi"
import { KEY_METRICS_KPI_COUNT_DEFAULT } from "@/lib/dashboard-layout-merge"
import type { MetricInsight, MetricItem } from "@/components/key-metrics"

const activeIndexProps = (activeIndex: number | null) =>
  activeIndex == null ? {} : ({ activeIndex } as Record<string, unknown>)

const BAR_CFG: ChartConfig = {
  count: { label: "Questions", color: "var(--color-chart-2)" },
}

const TYPE_LABEL: Record<LibraryItemType, string> = {
  multiple_choice: "Multiple choice",
  true_false: "True / false",
  short_answer: "Short answer",
}

function aggregateByType(rows: LibraryItem[]) {
  const c: Record<LibraryItemType, number> = {
    multiple_choice: 0,
    true_false: 0,
    short_answer: 0,
  }
  for (const r of rows) c[r.type]++
  return (Object.keys(c) as LibraryItemType[]).map(key => ({
    name: TYPE_LABEL[key],
    value: c[key],
    key,
  }))
}

function aggregateByTopic(rows: LibraryItem[]) {
  const map = new Map<string, number>()
  for (const r of rows) map.set(r.topic, (map.get(r.topic) ?? 0) + 1)
  return [...map.entries()]
    .map(([name, value]) => ({ name: name.length > 20 ? `${name.slice(0, 18)}…` : name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)
}

function QuestionsByTypeChart({
  rows,
  chartType = "bar",
}: {
  rows: LibraryItem[]
  chartType?: ChartType
}) {
  const data = React.useMemo(() => aggregateByType(rows), [rows])
  if (rows.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground" role="status">
        No questions in this view.
      </div>
    )
  }
  const summary = `Item types: ${data.map(d => `${d.name} ${d.value}`).join(", ")}. Total ${rows.length}.`

  if (chartType === "pie") {
    return (
      <ChartFigure label="Questions by item type" summary={summary} dataLength={data.length}>
        {(activeIndex) => (
          <>
            <ChartContainer config={BAR_CFG} className="mx-auto h-[220px] w-full max-w-[280px]">
              <PieChart>
                <ChartTooltip
                  key={chartTooltipKeyboardSyncProps(activeIndex).key}
                  {...chartTooltipKeyboardSyncProps(activeIndex).props}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={2}
                  activeShape={CHART_KBD_ACTIVE_PIE_SHAPE}
                  {...activeIndexProps(activeIndex)}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={`var(--color-chart-${(i % 5) + 1})`} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <ChartDataTable
              caption="Questions by item type"
              headers={["Type", "Count"]}
              rows={data.map(d => [d.name, d.value])}
            />
          </>
        )}
      </ChartFigure>
    )
  }

  return (
    <ChartFigure label="Questions by item type" summary={summary} dataLength={data.length}>
      {(activeIndex) => (
        <>
          <ChartContainer config={BAR_CFG} className="h-[220px] w-full">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={CHART_AXIS_TICK} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} width={32} tick={CHART_AXIS_TICK} tickLine={false} axisLine={false} />
              <ChartTooltip
                key={chartTooltipKeyboardSyncProps(activeIndex).key}
                {...chartTooltipKeyboardSyncProps(activeIndex).props}
                content={<ChartTooltipContent />}
              />
              <Bar
                dataKey="value"
                fill="var(--color-chart-2)"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
                activeBar={CHART_KBD_ACTIVE_BAR}
                {...activeIndexProps(activeIndex)}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill="var(--color-chart-2)" />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
          <ChartDataTable
            caption="Questions by item type"
            headers={["Type", "Count"]}
            rows={data.map(d => [d.name, d.value])}
          />
        </>
      )}
    </ChartFigure>
  )
}

function QuestionsByTopicChart({
  rows,
  chartType = "horizontal-bar",
}: {
  rows: LibraryItem[]
  chartType?: ChartType
}) {
  const data = React.useMemo(() => aggregateByTopic(rows), [rows])
  if (rows.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground" role="status">
        No questions in this view.
      </div>
    )
  }
  const summary = `Topics: ${data.map(d => `${d.name} ${d.value}`).join(", ")}.`

  if (chartType === "bar") {
    return (
      <ChartFigure label="Questions by topic" summary={summary} dataLength={data.length}>
        {(activeIndex) => (
          <>
            <ChartContainer config={BAR_CFG} className="h-[220px] w-full">
              <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={CHART_AXIS_TICK} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} width={32} tick={CHART_AXIS_TICK} tickLine={false} axisLine={false} />
                <ChartTooltip
                  key={chartTooltipKeyboardSyncProps(activeIndex).key}
                  {...chartTooltipKeyboardSyncProps(activeIndex).props}
                  content={<ChartTooltipContent />}
                />
                <Bar
                  dataKey="value"
                  fill="var(--color-chart-4)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                  activeBar={CHART_KBD_ACTIVE_BAR}
                  {...activeIndexProps(activeIndex)}
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

  return (
    <ChartFigure label="Questions by topic" summary={summary} dataLength={data.length}>
      {(activeIndex) => (
        <>
          <ChartContainer config={BAR_CFG} className="h-[220px] w-full">
            <BarChart data={data} layout="vertical" margin={{ left: 4, right: 16, top: 4, bottom: 0 }}>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border" />
              <XAxis type="number" allowDecimals={false} tick={CHART_AXIS_TICK} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" width={100} tick={CHART_AXIS_TICK} tickLine={false} axisLine={false} />
              <ChartTooltip
                key={chartTooltipKeyboardSyncProps(activeIndex).key}
                {...chartTooltipKeyboardSyncProps(activeIndex).props}
                content={<ChartTooltipContent />}
              />
              <Bar
                dataKey="value"
                fill="var(--color-chart-4)"
                radius={[0, 4, 4, 0]}
                maxBarSize={22}
                activeBar={CHART_KBD_ACTIVE_BAR}
                {...activeIndexProps(activeIndex)}
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

export interface LibraryDashboardChartsSectionProps {
  rows: LibraryItem[]
  visibleCards?: string[]
  cardOrder?: string[]
  cardSpans?: Record<string, 1 | 2>
  cardChartTypes?: Record<string, ChartType>
  keyMetricsKpiCount?: number
  layoutEditMode?: boolean
  onVisibleChange?: (visible: string[]) => void
  onOrderChange?: (order: string[]) => void
  onSpanChange?: (id: string, span: 1 | 2) => void
  onChartTypeChange?: (id: string, chartType: ChartType) => void
  onKeyMetricsKpiCountChange?: (count: number) => void
  onResetLayout?: () => void
  onLayoutEditDone?: () => void
  onLayoutEditCancel?: () => void
}

export function LibraryDashboardChartsSection({
  rows,
  visibleCards = DEFAULT_VISIBLE_CARDS,
  cardOrder = ALL_DASHBOARD_CARDS.map(c => c.id),
  cardSpans = DEFAULT_SPANS,
  cardChartTypes = DEFAULT_CHART_TYPES,
  keyMetricsKpiCount = KEY_METRICS_KPI_COUNT_DEFAULT,
  layoutEditMode = false,
  onVisibleChange,
  onOrderChange,
  onSpanChange,
  onChartTypeChange,
  onKeyMetricsKpiCountChange,
  onResetLayout,
  onLayoutEditDone,
  onLayoutEditCancel,
}: LibraryDashboardChartsSectionProps) {
  const keyMetrics = React.useMemo(
    () => ({
      metrics: libraryKpiMetrics(rows) as MetricItem[],
      insight: libraryKpiInsight(rows) as MetricInsight,
    }),
    [rows],
  )

  const renderChartCard = React.useCallback(
    (cardId: string, chartType: ChartType) => {
      if (cardId === "by-item-type") return <QuestionsByTypeChart rows={rows} chartType={chartType} />
      if (cardId === "by-topic") return <QuestionsByTopicChart rows={rows} chartType={chartType} />
      return null
    },
    [rows],
  )

  return (
    <DataViewDashboardCanvas
      allCards={ALL_DASHBOARD_CARDS}
      keyMetricsCardId={KEY_METRICS_CARD_ID}
      keyMetrics={keyMetrics}
      visibleCards={visibleCards}
      cardOrder={cardOrder}
      cardSpans={cardSpans}
      cardChartTypes={cardChartTypes}
      keyMetricsKpiCount={keyMetricsKpiCount}
      layoutEditMode={layoutEditMode}
      onVisibleChange={onVisibleChange}
      onOrderChange={onOrderChange}
      onSpanChange={onSpanChange}
      onChartTypeChange={onChartTypeChange}
      onKeyMetricsKpiCountChange={onKeyMetricsKpiCountChange}
      onResetLayout={onResetLayout}
      onLayoutEditDone={onLayoutEditDone}
      onLayoutEditCancel={onLayoutEditCancel}
      renderChartCard={renderChartCard}
    />
  )
}
