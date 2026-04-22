"use client"

/**
 * Compliance **Data** view dashboard — filtered compliance rows with the same canvas as Placements/Team.
 */

import * as React from "react"
import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts"
import { ChartCard, ChartDataTable, ChartFigure } from "@/components/charts-overview"
import { useChartVariant } from "@/contexts/chart-variant-context"
import { KeyMetrics, type MetricInsight, type MetricItem } from "@/components/key-metrics"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ViewSegmentedControl } from "@/components/ui/view-segmented-control"
import { Tip } from "@/components/ui/tip"
import { DragHandleGripIcon } from "@/components/ui/drag-handle-grip"
import {
  ChartContainer,
  ChartTooltip,
  chartTooltipKeyboardSyncProps,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  KEY_METRICS_KPI_COUNT_DEFAULT,
  KEY_METRICS_KPI_COUNT_MAX,
  KEY_METRICS_KPI_COUNT_MIN,
  mergeDashboardLayoutGeneric,
} from "@/lib/dashboard-layout-merge"
import { cn } from "@/lib/utils"
import type { ComplianceItem } from "@/lib/mock/compliance"
import {
  KEY_METRICS_CARD_ID,
  applyVisibleReorder,
  type ChartType,
  type DashboardLayout,
} from "@/components/data-view-dashboard-charts"
import {
  CHART_KBD_ACTIVE_BAR,
  CHART_KBD_ACTIVE_PIE_SHAPE,
} from "@/lib/chart-keyboard-selection"
import {
  loadDataViewLayout,
  saveDataViewLayout,
} from "@/lib/data-view-dashboard-storage"

const STATUS_CFG: ChartConfig = {
  value: { label: "Items", color: "var(--primary)" },
}

const CAT_CFG: ChartConfig = {
  value: { label: "Items", color: "var(--primary)" },
}

interface ComplianceDashboardCardDef {
  id: string
  title: string
  description: string
  defaultSpan: 1 | 2
  defaultChartType: ChartType
  chartTypes: { type: ChartType; label: string; icon: string }[]
}

export const ALL_COMPLIANCE_DASHBOARD_CARDS: ComplianceDashboardCardDef[] = [
  {
    id: KEY_METRICS_CARD_ID,
    title: "Key metrics",
    description: "Summary KPIs for filtered obligations",
    defaultSpan: 2,
    defaultChartType: "bar",
    chartTypes: [],
  },
  {
    id: "compliance-by-status",
    title: "Items by status",
    description: "Filtered compliance obligations",
    defaultSpan: 1,
    defaultChartType: "bar",
    chartTypes: [
      { type: "bar", label: "Bar", icon: "fa-light fa-chart-bar" },
      { type: "horizontal-bar", label: "Horizontal Bar", icon: "fa-light fa-chart-bar fa-rotate-90" },
      { type: "pie", label: "Donut", icon: "fa-light fa-chart-pie" },
    ],
  },
  {
    id: "compliance-by-category",
    title: "Items by category",
    description: "Top categories in this view",
    defaultSpan: 1,
    defaultChartType: "horizontal-bar",
    chartTypes: [
      { type: "horizontal-bar", label: "Horizontal Bar", icon: "fa-light fa-chart-bar fa-rotate-90" },
      { type: "bar", label: "Bar", icon: "fa-light fa-chart-bar" },
      { type: "pie", label: "Donut", icon: "fa-light fa-chart-pie" },
    ],
  },
]

export const DEFAULT_COMPLIANCE_VISIBLE_CARDS = ALL_COMPLIANCE_DASHBOARD_CARDS.map(c => c.id)
export const DEFAULT_COMPLIANCE_SPANS: Record<string, 1 | 2> = Object.fromEntries(
  ALL_COMPLIANCE_DASHBOARD_CARDS.map(c => [c.id, c.defaultSpan]),
)
export const DEFAULT_COMPLIANCE_CHART_TYPES: Record<string, ChartType> = Object.fromEntries(
  ALL_COMPLIANCE_DASHBOARD_CARDS.map(c => [c.id, c.defaultChartType]),
)

export function loadComplianceDashboardLayout(): DashboardLayout | null {
  const v = loadDataViewLayout("compliance")
  if (!v) return null
  return {
    visible: v.visible,
    order: v.order,
    spans: v.spans,
    chartTypes: v.chartTypes as Record<string, ChartType> | undefined,
    keyMetricsKpiCount: v.keyMetricsKpiCount,
  }
}

export function mergeComplianceDashboardLayout(saved: DashboardLayout | null): DashboardLayout {
  const defaults = {
    visible: [...DEFAULT_COMPLIANCE_VISIBLE_CARDS],
    order: ALL_COMPLIANCE_DASHBOARD_CARDS.map(c => c.id),
    spans: { ...DEFAULT_COMPLIANCE_SPANS },
    chartTypes: { ...DEFAULT_COMPLIANCE_CHART_TYPES } as Record<string, string>,
    keyMetricsKpiCount: KEY_METRICS_KPI_COUNT_DEFAULT,
  }
  const ids = ALL_COMPLIANCE_DASHBOARD_CARDS.map(c => c.id)
  const m = mergeDashboardLayoutGeneric(saved, defaults, ids)
  return {
    visible: m.visible,
    order: m.order,
    spans: m.spans as Record<string, 1 | 2>,
    chartTypes: m.chartTypes as Record<string, ChartType>,
    keyMetricsKpiCount: m.keyMetricsKpiCount,
  }
}

export function saveComplianceDashboardLayout(layout: DashboardLayout) {
  saveDataViewLayout("compliance", {
    visible: layout.visible,
    order: layout.order,
    spans: layout.spans,
    chartTypes: layout.chartTypes as Record<string, string> | undefined,
    keyMetricsKpiCount: layout.keyMetricsKpiCount,
  })
}

function EmptyChart({ message = "No items in this view." }: { message?: string }) {
  return (
    <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground" role="status">
      {message}
    </div>
  )
}

const PIE_FILLS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
]

function ComplianceByStatusChart({ rows, chartType }: { rows: ComplianceItem[]; chartType: ChartType }) {
  const byStatus = React.useMemo(() => {
    const c = { compliant: 0, due_soon: 0, overdue: 0, pending: 0 }
    for (const r of rows) c[r.status]++
    return [
      { name: "Compliant", value: c.compliant },
      { name: "Due soon", value: c.due_soon },
      { name: "Overdue", value: c.overdue },
      { name: "Pending", value: c.pending },
    ]
  }, [rows])

  if (rows.length === 0) return <EmptyChart />

  const statusSummary = `Compliance status: ${byStatus.map(d => `${d.name} ${d.value}`).join(", ")}. Total ${rows.length} items.`

  if (chartType === "pie") {
    return (
      <ChartFigure label="Items by status" summary={statusSummary} dataLength={byStatus.length}>
        {(activeIndex) => (
          <>
            <ChartContainer config={STATUS_CFG} className="mx-auto aspect-square max-h-[220px] w-full">
              <PieChart>
                <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
                <Pie
                  data={byStatus}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={80}
                  strokeWidth={2}
                  stroke="var(--card)"
                  activeIndex={activeIndex ?? undefined}
                  activeShape={CHART_KBD_ACTIVE_PIE_SHAPE}
                >
                  {byStatus.map((_, i) => (
                    <Cell key={i} fill={PIE_FILLS[i % PIE_FILLS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <ChartDataTable
              caption="Items by status"
              headers={["Status", "Count"]}
              rows={byStatus.map(d => [d.name, d.value])}
            />
          </>
        )}
      </ChartFigure>
    )
  }

  if (chartType === "horizontal-bar") {
    return (
      <ChartFigure label="Items by status" summary={statusSummary} dataLength={byStatus.length}>
        {(activeIndex) => (
          <>
            <ChartContainer config={STATUS_CFG} className="h-[220px] w-full">
              <BarChart data={byStatus} layout="vertical" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" width={88} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
                <Bar
                  dataKey="value"
                  fill="var(--color-chart-2)"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={22}
                  activeBar={CHART_KBD_ACTIVE_BAR}
                  activeIndex={activeIndex ?? undefined}
                >
                  {byStatus.map((_, i) => (
                    <Cell key={i} fill="var(--color-chart-2)" />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
            <ChartDataTable
              caption="Items by status"
              headers={["Status", "Count"]}
              rows={byStatus.map(d => [d.name, d.value])}
            />
          </>
        )}
      </ChartFigure>
    )
  }

  return (
    <ChartFigure label="Items by status" summary={statusSummary} dataLength={byStatus.length}>
      {(activeIndex) => (
        <>
          <ChartContainer config={STATUS_CFG} className="h-[220px] w-full">
            <BarChart data={byStatus} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
                {byStatus.map((_, i) => (
                  <Cell key={i} fill="var(--color-chart-2)" />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
          <ChartDataTable
            caption="Items by status"
            headers={["Status", "Count"]}
            rows={byStatus.map(d => [d.name, d.value])}
          />
        </>
      )}
    </ChartFigure>
  )
}

function ComplianceByCategoryChart({ rows, chartType }: { rows: ComplianceItem[]; chartType: ChartType }) {
  const byCategory = React.useMemo(() => {
    const map = new Map<string, number>()
    for (const r of rows) map.set(r.category, (map.get(r.category) ?? 0) + 1)
    return [...map.entries()]
      .map(([name, value]) => ({ name: name.length > 24 ? `${name.slice(0, 22)}…` : name, value }))
      .sort((a, b) => b.value - a.value)
  }, [rows])

  if (rows.length === 0) return <EmptyChart />

  const categorySummary = `${byCategory.length} categories. Total ${rows.length} items.`

  if (chartType === "pie") {
    return (
      <ChartFigure label="Items by category" summary={categorySummary} dataLength={byCategory.length}>
        {(activeIndex) => (
          <>
            <ChartContainer config={CAT_CFG} className="mx-auto aspect-square max-h-[220px] w-full">
              <PieChart>
                <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
                <Pie
                  data={byCategory}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={80}
                  strokeWidth={2}
                  stroke="var(--card)"
                  activeIndex={activeIndex ?? undefined}
                  activeShape={CHART_KBD_ACTIVE_PIE_SHAPE}
                >
                  {byCategory.map((_, i) => (
                    <Cell key={i} fill={PIE_FILLS[i % PIE_FILLS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <ChartDataTable
              caption="Items by category"
              headers={["Category", "Count"]}
              rows={byCategory.map(d => [d.name, d.value])}
            />
          </>
        )}
      </ChartFigure>
    )
  }

  if (chartType === "bar") {
    return (
      <ChartFigure label="Items by category" summary={categorySummary} dataLength={byCategory.length}>
        {(activeIndex) => (
          <>
            <ChartContainer config={CAT_CFG} className="h-[220px] w-full">
              <BarChart data={byCategory} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} width={32} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
                <Bar
                  dataKey="value"
                  fill="var(--color-chart-4)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                  activeBar={CHART_KBD_ACTIVE_BAR}
                  activeIndex={activeIndex ?? undefined}
                >
                  {byCategory.map((_, i) => (
                    <Cell key={i} fill="var(--color-chart-4)" />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
            <ChartDataTable
              caption="Items by category"
              headers={["Category", "Count"]}
              rows={byCategory.map(d => [d.name, d.value])}
            />
          </>
        )}
      </ChartFigure>
    )
  }

  return (
    <ChartFigure label="Items by category" summary={categorySummary} dataLength={byCategory.length}>
      {(activeIndex) => (
        <>
          <ChartContainer config={CAT_CFG} className="h-[220px] w-full">
            <BarChart data={byCategory} layout="vertical" margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
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
                {byCategory.map((_, i) => (
                  <Cell key={i} fill="var(--color-chart-4)" />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
          <ChartDataTable
            caption="Items by category"
            headers={["Category", "Count"]}
            rows={byCategory.map(d => [d.name, d.value])}
          />
        </>
      )}
    </ChartFigure>
  )
}

const COMPLIANCE_CHART_RENDERERS: Record<string, React.FC<{ rows: ComplianceItem[]; chartType: ChartType }>> = {
  "compliance-by-status": ComplianceByStatusChart,
  "compliance-by-category": ComplianceByCategoryChart,
}

function SortableComplianceDashboardCard({
  card,
  rows,
  span,
  chartType,
  cardIndex,
  totalCards,
  onSpanChange,
  onChartTypeChange,
  onRemove,
  onMoveStep,
  keyMetrics,
  keyMetricsKpiCount,
  onKeyMetricsKpiCountChange,
}: {
  card: ComplianceDashboardCardDef
  rows: ComplianceItem[]
  span: 1 | 2
  chartType: ChartType
  cardIndex: number
  totalCards: number
  onSpanChange: (id: string, span: 1 | 2) => void
  onChartTypeChange: (id: string, t: ChartType) => void
  onRemove: (id: string) => void
  onMoveStep: (direction: -1 | 1) => void
  keyMetrics?: { metrics: MetricItem[]; insight: MetricInsight } | null
  keyMetricsKpiCount: number
  onKeyMetricsKpiCountChange?: (n: number) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })
  const { chartVariant } = useChartVariant()

  const style: React.CSSProperties = {
    ...(transform ? { transform: CSS.Transform.toString(transform) } : {}),
    transition,
  }

  const isKeyMetrics = card.id === KEY_METRICS_CARD_ID
  const Renderer = isKeyMetrics ? null : COMPLIANCE_CHART_RENDERERS[card.id]
  if (!isKeyMetrics && !Renderer) return null
  if (isKeyMetrics && !keyMetrics) return null

  const canMoveEarlier = cardIndex > 0
  const canMoveLater = cardIndex < totalCards - 1

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex min-h-0 w-full min-w-0 flex-col self-start rounded-xl border-2 border-dashed border-border bg-transparent p-2",
        span === 2 ? "lg:col-span-2" : undefined,
        isDragging && "z-20 opacity-95 ring-2 ring-ring",
      )}
    >
      <div className="mb-2 flex w-full min-w-0 flex-wrap items-center gap-2" role="toolbar" aria-label={`${card.title} layout controls`}>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <Tip label="Drag to reorder" side="top">
            <button
              type="button"
              ref={setActivatorNodeRef}
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-interactive-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Drag to reorder ${card.title}`}
              {...attributes}
              {...listeners}
            >
              <DragHandleGripIcon className="text-[15px]" />
            </button>
          </Tip>
          {card.chartTypes.length > 0 ? (
            <ViewSegmentedControl
              aria-label={`Chart type for ${card.title}`}
              iconOnly
              value={chartType}
              onValueChange={v => onChartTypeChange(card.id, v as ChartType)}
              options={card.chartTypes.map(opt => ({
                value: opt.type,
                label: opt.label,
                icon: opt.icon,
              }))}
            />
          ) : null}
          {isKeyMetrics && onKeyMetricsKpiCountChange ? (
            <ViewSegmentedControl
              aria-label="Number of KPIs to show"
              iconOnly={false}
              value={String(keyMetricsKpiCount)}
              onValueChange={v => onKeyMetricsKpiCountChange(Number(v))}
              options={Array.from(
                { length: KEY_METRICS_KPI_COUNT_MAX - KEY_METRICS_KPI_COUNT_MIN + 1 },
                (_, i) => {
                  const n = KEY_METRICS_KPI_COUNT_MIN + i
                  return { value: String(n), label: String(n) }
                },
              )}
            />
          ) : null}
          <ViewSegmentedControl
            aria-label={`Width for ${card.title}`}
            iconOnly
            value={String(span) as "1" | "2"}
            onValueChange={v => onSpanChange(card.id, Number(v) as 1 | 2)}
            options={[
              { value: "1", label: "Half width", icon: "fa-light fa-table-columns" },
              { value: "2", label: "Full width (all columns)", icon: "fa-light fa-maximize" },
            ]}
          />
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <div
            className="pointer-events-none flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
            role="group"
            aria-label={`Reorder ${card.title}`}
          >
            <div className="flex items-center gap-0.5 lg:hidden">
              <Tip label="Move up" side="top">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-7 shrink-0"
                  disabled={!canMoveEarlier}
                  aria-label={`Move ${card.title} up`}
                  onClick={() => onMoveStep(-1)}
                >
                  <i className="fa-light fa-chevron-up text-xs" aria-hidden="true" />
                </Button>
              </Tip>
              <Tip label="Move down" side="top">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-7 shrink-0"
                  disabled={!canMoveLater}
                  aria-label={`Move ${card.title} down`}
                  onClick={() => onMoveStep(1)}
                >
                  <i className="fa-light fa-chevron-down text-xs" aria-hidden="true" />
                </Button>
              </Tip>
            </div>
            <div className="hidden items-center gap-0.5 lg:flex">
              <Tip label="Move left" side="top">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-7 shrink-0"
                  disabled={!canMoveEarlier}
                  aria-label={`Move ${card.title} left`}
                  onClick={() => onMoveStep(-1)}
                >
                  <i className="fa-light fa-chevron-left text-xs" aria-hidden="true" />
                </Button>
              </Tip>
              <Tip label="Move right" side="top">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-7 shrink-0"
                  disabled={!canMoveLater}
                  aria-label={`Move ${card.title} right`}
                  onClick={() => onMoveStep(1)}
                >
                  <i className="fa-light fa-chevron-right text-xs" aria-hidden="true" />
                </Button>
              </Tip>
            </div>
          </div>
          <Tip label={`Remove ${card.title}`} side="top">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
              aria-label={`Remove ${card.title} from dashboard`}
              onClick={() => onRemove(card.id)}
            >
              <i className="fa-light fa-trash text-[13px]" aria-hidden="true" />
            </Button>
          </Tip>
        </div>
      </div>
      {isKeyMetrics && keyMetrics ? (
        <KeyMetrics
          variant="card"
          title={card.title}
          description={card.description}
          metrics={keyMetrics.metrics.slice(0, keyMetricsKpiCount)}
          insight={keyMetrics.insight}
          metricsSingleRow
          metricsHalfWidthLayout={span === 1}
          className="w-full min-w-0"
        />
      ) : (
        <ChartCard variant={chartVariant} title={card.title} description={card.description} className="!h-auto min-h-0 shrink-0">
          {Renderer ? <Renderer rows={rows} chartType={chartType} /> : null}
        </ChartCard>
      )}
    </div>
  )
}

export interface ComplianceDashboardChartsSectionProps {
  rows: ComplianceItem[]
  keyMetrics: { metrics: MetricItem[]; insight: MetricInsight }
  visibleCards: string[]
  cardOrder: string[]
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

export function ComplianceDashboardChartsSection({
  rows,
  keyMetrics,
  visibleCards,
  cardOrder,
  cardSpans = DEFAULT_COMPLIANCE_SPANS,
  cardChartTypes = DEFAULT_COMPLIANCE_CHART_TYPES,
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
}: ComplianceDashboardChartsSectionProps) {
  const { chartVariant } = useChartVariant()
  const defs = React.useMemo(() => new Map(ALL_COMPLIANCE_DASHBOARD_CARDS.map(c => [c.id, c])), [])

  const orderedCards = React.useMemo(() => {
    return cardOrder
      .filter(id => visibleCards.includes(id) && defs.has(id))
      .map(id => defs.get(id)!)
  }, [visibleCards, cardOrder, defs])

  const hiddenCardDefs = React.useMemo(
    () => ALL_COMPLIANCE_DASHBOARD_CARDS.filter(c => !visibleCards.includes(c.id)),
    [visibleCards],
  )

  const sortableIds = React.useMemo(() => orderedCards.map(c => c.id), [orderedCards])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      if (!onOrderChange) return
      const { active, over } = event
      if (!over || active.id === over.id) return
      const oldIndex = sortableIds.indexOf(String(active.id))
      const newIndex = sortableIds.indexOf(String(over.id))
      if (oldIndex < 0 || newIndex < 0) return
      const nextVisibleOrder = arrayMove(sortableIds, oldIndex, newIndex)
      const visibleSet = new Set(visibleCards)
      onOrderChange(applyVisibleReorder(cardOrder, visibleSet, nextVisibleOrder))
    },
    [cardOrder, onOrderChange, sortableIds, visibleCards],
  )

  const moveStep = React.useCallback(
    (id: string, direction: -1 | 1) => {
      if (!onOrderChange) return
      const idx = sortableIds.indexOf(id)
      if (idx < 0) return
      const newIdx = idx + direction
      if (newIdx < 0 || newIdx >= sortableIds.length) return
      const nextVisibleOrder = arrayMove(sortableIds, idx, newIdx)
      const visibleSet = new Set(visibleCards)
      onOrderChange(applyVisibleReorder(cardOrder, visibleSet, nextVisibleOrder))
    },
    [cardOrder, onOrderChange, sortableIds, visibleCards],
  )

  const addCard = React.useCallback(
    (id: string) => {
      if (!onVisibleChange) return
      if (visibleCards.includes(id)) return
      onVisibleChange([...visibleCards, id])
    },
    [onVisibleChange, visibleCards],
  )

  const removeCard = React.useCallback(
    (id: string) => {
      if (!onVisibleChange) return
      onVisibleChange(visibleCards.filter(v => v !== id))
    },
    [onVisibleChange, visibleCards],
  )

  if (orderedCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center lg:px-6">
        <i className="fa-light fa-chart-column text-2xl text-muted-foreground/40" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">
          No widgets on the dashboard.
          {layoutEditMode && hiddenCardDefs.length > 0 ? " Add a widget below." : " Turn on Edit layout and add widgets back."}
        </p>
        {layoutEditMode && hiddenCardDefs.length > 0 && onVisibleChange ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="size-9 p-0" aria-label="Add widget">
                <i className="fa-light fa-plus text-sm" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              {hiddenCardDefs.map(c => (
                <DropdownMenuItem key={c.id} onSelect={() => addCard(c.id)}>
                  {c.title}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    )
  }

  const grid = (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 lg:grid-cols-2",
        layoutEditMode && "lg:items-start lg:content-start lg:auto-rows-min",
      )}
    >
      {orderedCards.map((card, cardIndex) => {
        const isKeyMetricsCard = card.id === KEY_METRICS_CARD_ID
        const Renderer = isKeyMetricsCard ? null : COMPLIANCE_CHART_RENDERERS[card.id]
        if (!isKeyMetricsCard && !Renderer) return null
        const span = cardSpans[card.id] ?? card.defaultSpan
        const requestedType = cardChartTypes[card.id] ?? card.defaultChartType
        const allowedTypes = card.chartTypes.map(o => o.type)
        const chartType =
          allowedTypes.length === 0
            ? card.defaultChartType
            : allowedTypes.includes(requestedType)
              ? requestedType
              : card.defaultChartType

        if (
          layoutEditMode &&
          onOrderChange &&
          onSpanChange &&
          onChartTypeChange &&
          onVisibleChange
        ) {
          return (
            <SortableComplianceDashboardCard
              key={card.id}
              card={card}
              rows={rows}
              span={span}
              chartType={chartType}
              cardIndex={cardIndex}
              totalCards={orderedCards.length}
              onSpanChange={onSpanChange}
              onChartTypeChange={onChartTypeChange}
              onRemove={removeCard}
              onMoveStep={dir => moveStep(card.id, dir)}
              keyMetrics={isKeyMetricsCard ? keyMetrics : null}
              keyMetricsKpiCount={keyMetricsKpiCount}
              onKeyMetricsKpiCountChange={
                isKeyMetricsCard ? onKeyMetricsKpiCountChange : undefined
              }
            />
          )
        }

        return (
          <div
            key={card.id}
            className={cn(span === 2 ? "lg:col-span-2" : undefined)}
          >
            {isKeyMetricsCard ? (
              <KeyMetrics
                variant="card"
                title={card.title}
                description={card.description}
                metrics={keyMetrics.metrics.slice(0, keyMetricsKpiCount)}
                insight={keyMetrics.insight}
                metricsSingleRow
                metricsHalfWidthLayout={span === 1}
                className="w-full min-w-0"
              />
            ) : (
              <ChartCard variant={chartVariant} title={card.title} description={card.description}>
                {Renderer ? <Renderer rows={rows} chartType={chartType} /> : null}
              </ChartCard>
            )}
          </div>
        )
      })}
    </div>
  )

  const editToolbar =
    layoutEditMode && onVisibleChange && onResetLayout ? (
      <div
        className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-transparent px-3 py-2"
        role="region"
        aria-label="Dashboard layout options"
      >
        <p className="text-xs text-muted-foreground">Drag cards to reorder. Changes save automatically.</p>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 text-xs"
            onClick={() => onVisibleChange(ALL_COMPLIANCE_DASHBOARD_CARDS.map(c => c.id))}
          >
            Show all
          </Button>
          <Button type="button" size="sm" variant="ghost" className="h-8 text-xs" onClick={() => onVisibleChange([])}>
            Hide all
          </Button>
          <Tip side="bottom" label="Reset visibility, order, widths, and chart types">
            <Button type="button" size="sm" variant="ghost" className="h-8 px-2 text-xs" onClick={onResetLayout}>
              <i className="fa-light fa-rotate-left mr-1 text-xs" aria-hidden="true" />
              Reset
            </Button>
          </Tip>
          {hiddenCardDefs.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="size-8 p-0" aria-label="Add widget">
                  <i className="fa-light fa-plus text-[13px]" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {hiddenCardDefs.map(c => (
                  <DropdownMenuItem key={c.id} onSelect={() => addCard(c.id)}>
                    {c.title}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          {onLayoutEditCancel ? (
            <Button type="button" size="sm" variant="outline" className="h-8 text-xs" onClick={onLayoutEditCancel}>
              Cancel
            </Button>
          ) : null}
          {onLayoutEditDone ? (
            <Button type="button" size="sm" className="h-8 text-xs" onClick={onLayoutEditDone}>
              Done
            </Button>
          ) : null}
        </div>
      </div>
    ) : null

  const gridBody =
    layoutEditMode && onOrderChange ? (
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
          {grid}
        </SortableContext>
      </DndContext>
    ) : (
      grid
    )

  return (
    <div
      className={cn(
        "flex flex-col gap-4 px-4 pb-2 lg:px-6",
        layoutEditMode && "rounded-xl border border-dashed border-border/80 bg-transparent py-3",
      )}
    >
      {editToolbar}
      {gridBody}
    </div>
  )
}
