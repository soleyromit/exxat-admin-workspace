"use client"

/**
 * Data view dashboard charts — contextual charts for the **Data** view tab (Placements hub).
 *
 * Tells a story about the placements data:
 *   1. Status pipeline  — where are placements in the workflow?
 *   2. Program mix      — which programs have the most activity?
 *   3. Compliance        — how ready are upcoming placements?
 *   4. Progress tracker  — how far along are ongoing placements?
 *   5. Site utilisation  — which sites are busiest?
 *   6. Readiness         — how prepared are students?
 *   7. Completion outcomes — pass rate + ratings for completed placements
 *   8. Timeline          — upcoming start dates over the next 8 weeks
 *
 * Each chart is a `DashboardCard` — users can show/hide, reorder, change
 * column span, and switch chart type from the canvas (edit layout mode).
 *
 * ── WCAG AA ────────────────────────────────────────────────────────────────
 *   Every chart is wrapped in `<ChartFigure>` (keyboard navigable, announced)
 *   and includes `<ChartDataTable>` (sr-only fallback table) — matching the
 *   accessibility pattern established in `charts-overview.tsx`.
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
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis,
  Area, AreaChart, RadialBar, RadialBarChart, Line, LineChart,
} from "recharts"
import { ChartCard, ChartFigure, ChartDataTable } from "@/components/charts-overview"
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
  KEY_METRICS_KPI_COUNT_DEFAULT,
  KEY_METRICS_KPI_COUNT_MAX,
  KEY_METRICS_KPI_COUNT_MIN,
  mergeDashboardLayoutGeneric,
} from "@/lib/dashboard-layout-merge"
import {
  loadDataViewLayout as loadStoredDataViewLayout,
  saveDataViewLayout as saveStoredDataViewLayout,
} from "@/lib/data-view-dashboard-storage"
import { cn } from "@/lib/utils"
import {
  ChartContainer,
  ChartTooltip,
  chartTooltipKeyboardSyncProps,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { Placement } from "@/lib/mock/placements"
import {
  CHART_KBD_ACTIVE_BAR,
  CHART_KBD_ACTIVE_PIE_SHAPE,
} from "@/lib/chart-keyboard-selection"

/* ── Chart colour tokens ───────────────────────────────────────────────── */

const STATUS_COLORS: Record<string, string> = {
  confirmed:    "var(--color-chart-2)",
  pending:      "var(--color-chart-4)",
  "under-review": "var(--color-chart-3)",
  rejected:     "var(--destructive)",
  completed:    "var(--primary)",
}

const COMPLIANCE_COLORS: Record<string, string> = {
  Complete:            "var(--color-chart-2)",
  "In progress":       "var(--color-chart-3)",
  "Pending documents": "var(--color-chart-4)",
  Review:              "var(--color-chart-1)",
  Incomplete:          "var(--destructive)",
}

const READINESS_COLORS: Record<string, string> = {
  Ready:       "var(--color-chart-2)",
  "In review": "var(--color-chart-3)",
  "At risk":   "var(--color-chart-4)",
  Blocked:     "var(--destructive)",
}

/* ── Chart configs ─────────────────────────────────────────────────────── */

const BAR_CFG: ChartConfig  = { value: { label: "Placements", color: "var(--primary)" } }
const AREA_CFG: ChartConfig = { count: { label: "Starting", color: "var(--color-chart-1)" } }

/* ── Chart types available per card ───────────────────────────────────── */

export type ChartType = "bar" | "horizontal-bar" | "pie" | "area" | "line" | "radial" | "stacked-bar"

export interface ChartTypeOption {
  type: ChartType
  label: string
  icon: string
}

/* ── Card definitions ──────────────────────────────────────────────────── */

export interface DashboardCardDef {
  id: string
  title: string
  description: string
  /** Default grid column span: 1 = half width, 2 = full width */
  defaultSpan: 1 | 2
  /** Default chart type (unused when chartTypes is empty) */
  defaultChartType: ChartType
  /** Available chart types; empty = KPI / non-chart block (no type switcher) */
  chartTypes: ChartTypeOption[]
}

/** Virtual “card” for the KPI strip — reorderable with charts in edit mode */
export const KEY_METRICS_CARD_ID = "key-metrics"

export const ALL_DASHBOARD_CARDS: DashboardCardDef[] = [
  {
    id: KEY_METRICS_CARD_ID,
    title: "Key metrics",
    description: "Summary KPIs for filtered placements",
    defaultSpan: 1,
    defaultChartType: "bar",
    chartTypes: [],
  },
  {
    id: "status-pipeline",
    title: "Status Pipeline",
    description: "Where placements are in the workflow",
    defaultSpan: 1,
    defaultChartType: "bar",
    chartTypes: [
      { type: "bar", label: "Bar", icon: "fa-light fa-chart-bar" },
      { type: "horizontal-bar", label: "Horizontal Bar", icon: "fa-light fa-chart-bar fa-rotate-90" },
      { type: "pie", label: "Donut", icon: "fa-light fa-chart-pie" },
    ],
  },
  {
    id: "program-mix",
    title: "Placements by Program",
    description: "Distribution across active programs",
    defaultSpan: 1,
    defaultChartType: "pie",
    chartTypes: [
      { type: "pie", label: "Donut", icon: "fa-light fa-chart-pie" },
      { type: "bar", label: "Bar", icon: "fa-light fa-chart-bar" },
      { type: "horizontal-bar", label: "Horizontal Bar", icon: "fa-light fa-chart-bar fa-rotate-90" },
    ],
  },
  {
    id: "compliance-status",
    title: "Compliance Status",
    description: "Document readiness for upcoming placements",
    defaultSpan: 1,
    defaultChartType: "horizontal-bar",
    chartTypes: [
      { type: "horizontal-bar", label: "Horizontal Bar", icon: "fa-light fa-chart-bar fa-rotate-90" },
      { type: "bar", label: "Bar", icon: "fa-light fa-chart-bar" },
      { type: "pie", label: "Donut", icon: "fa-light fa-chart-pie" },
    ],
  },
  {
    id: "readiness-overview",
    title: "Student Readiness",
    description: "How prepared students are for their placements",
    defaultSpan: 1,
    defaultChartType: "bar",
    chartTypes: [
      { type: "bar", label: "Bar", icon: "fa-light fa-chart-bar" },
      { type: "horizontal-bar", label: "Horizontal Bar", icon: "fa-light fa-chart-bar fa-rotate-90" },
      { type: "pie", label: "Donut", icon: "fa-light fa-chart-pie" },
    ],
  },
  {
    id: "progress-tracker",
    title: "Ongoing Progress",
    description: "How far along each ongoing placement is",
    defaultSpan: 2,
    defaultChartType: "stacked-bar",
    chartTypes: [
      { type: "stacked-bar", label: "Stacked Bar", icon: "fa-light fa-layer-group" },
      { type: "bar", label: "Bar", icon: "fa-light fa-chart-bar" },
    ],
  },
  {
    id: "site-utilisation",
    title: "Site Utilisation",
    description: "Which clinical sites have the most placements",
    defaultSpan: 1,
    defaultChartType: "horizontal-bar",
    chartTypes: [
      { type: "horizontal-bar", label: "Horizontal Bar", icon: "fa-light fa-chart-bar fa-rotate-90" },
      { type: "bar", label: "Bar", icon: "fa-light fa-chart-bar" },
      { type: "pie", label: "Donut", icon: "fa-light fa-chart-pie" },
    ],
  },
  {
    id: "completion-outcomes",
    title: "Completion Outcomes",
    description: "Pass rate and average ratings for completed placements",
    defaultSpan: 1,
    defaultChartType: "radial",
    chartTypes: [
      { type: "radial", label: "Radial", icon: "fa-light fa-circle-notch" },
      { type: "bar", label: "Bar", icon: "fa-light fa-chart-bar" },
    ],
  },
  {
    id: "upcoming-timeline",
    title: "Upcoming Start Dates",
    description: "New placements starting in the next 8 weeks",
    defaultSpan: 2,
    defaultChartType: "area",
    chartTypes: [
      { type: "area", label: "Area", icon: "fa-light fa-chart-area" },
      { type: "line", label: "Line", icon: "fa-light fa-chart-line" },
      { type: "bar", label: "Bar", icon: "fa-light fa-chart-bar" },
    ],
  },
]

export const DEFAULT_VISIBLE_CARDS = ALL_DASHBOARD_CARDS.map(c => c.id)
export const DEFAULT_SPANS: Record<string, 1 | 2> = Object.fromEntries(ALL_DASHBOARD_CARDS.map(c => [c.id, c.defaultSpan]))
export const DEFAULT_CHART_TYPES: Record<string, ChartType> = Object.fromEntries(ALL_DASHBOARD_CARDS.map(c => [c.id, c.defaultChartType]))

/* ── Persistence (centralized bundle — see `lib/data-view-dashboard-storage`) ─ */

export interface DashboardLayout {
  visible: string[]
  order: string[]
  spans?: Record<string, 1 | 2>
  chartTypes?: Record<string, ChartType>
  /** Key metrics card: show first N KPIs (1–4). */
  keyMetricsKpiCount?: number
}

export function loadDashboardLayout(): DashboardLayout | null {
  const v = loadStoredDataViewLayout("placements")
  if (!v) return null
  return {
    visible: v.visible,
    order: v.order,
    spans: v.spans,
    chartTypes: v.chartTypes as Record<string, ChartType> | undefined,
    keyMetricsKpiCount: v.keyMetricsKpiCount,
  }
}

/** Merge saved layout with defaults so every card id has span + chart type. */
export function mergeDashboardLayout(saved: DashboardLayout | null): DashboardLayout {
  const defaults = {
    visible: [...DEFAULT_VISIBLE_CARDS],
    order: ALL_DASHBOARD_CARDS.map(c => c.id),
    spans: { ...DEFAULT_SPANS },
    chartTypes: { ...DEFAULT_CHART_TYPES } as Record<string, string>,
    keyMetricsKpiCount: KEY_METRICS_KPI_COUNT_DEFAULT,
  }
  const ids = ALL_DASHBOARD_CARDS.map(c => c.id)
  const m = mergeDashboardLayoutGeneric(saved, defaults, ids)
  return {
    visible: m.visible,
    order: m.order,
    spans: m.spans as Record<string, 1 | 2>,
    chartTypes: m.chartTypes as Record<string, ChartType>,
    keyMetricsKpiCount: m.keyMetricsKpiCount,
  }
}

export function saveDashboardLayout(layout: DashboardLayout) {
  saveStoredDataViewLayout("placements", {
    visible: layout.visible,
    order: layout.order,
    spans: layout.spans,
    chartTypes: layout.chartTypes as Record<string, string> | undefined,
    keyMetricsKpiCount: layout.keyMetricsKpiCount,
  })
}

/** Rebuild full `cardOrder` after reordering only the visible subset (order of hidden ids is preserved). */
export function applyVisibleReorder(
  fullOrder: string[],
  visible: Set<string>,
  newVisibleOrder: string[],
): string[] {
  let vi = 0
  return fullOrder.map(id => {
    if (!visible.has(id)) return id
    return newVisibleOrder[vi++]!
  })
}

/* ── Individual chart renderers (ChartFigure + ChartDataTable from charts-overview) ─ */
/* Keyboard highlight: `CHART_KBD_*` — same ring-on-active pattern as `charts-overview`. */

function StatusPipelineChart({ rows, chartType }: { rows: Placement[]; chartType: ChartType }) {
  const data = React.useMemo(() => {
    const map = new Map<string, number>()
    for (const r of rows) map.set(r.status, (map.get(r.status) ?? 0) + 1)
    return ["confirmed", "pending", "under-review", "completed", "rejected"]
      .filter(s => map.has(s))
      .map(s => ({
        name: s === "under-review" ? "Under Review" : s.charAt(0).toUpperCase() + s.slice(1),
        value: map.get(s)!,
        fill: STATUS_COLORS[s] ?? "var(--primary)",
      }))
  }, [rows])

  if (data.length === 0) return <EmptyChart />

  const summary = `${data.length} status categories. Largest: ${data.reduce((a, b) => a.value > b.value ? a : b).name} with ${data.reduce((a, b) => a.value > b.value ? a : b).value} placements.`

  return (
    <ChartFigure label="Status Pipeline" summary={summary} dataLength={data.length}>
      {(activeIndex) => (
        <>
          {chartType === "pie" ? (
            <PieChartRenderer data={data} activeIndex={activeIndex} />
          ) : chartType === "horizontal-bar" ? (
            <HBarChartRenderer data={data} colored activeIndex={activeIndex} />
          ) : (
            <ChartContainer config={BAR_CFG} className="h-[220px] w-full">
              <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} width={32} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
                <Bar
                  dataKey="value"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                  activeBar={CHART_KBD_ACTIVE_BAR}
                  activeIndex={activeIndex ?? undefined}
                >
                  {data.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
          <ChartDataTable
            caption="Status Pipeline data"
            headers={["Status", "Placements"]}
            rows={data.map(d => [d.name, d.value])}
          />
        </>
      )}
    </ChartFigure>
  )
}

function ProgramMixChart({ rows, chartType }: { rows: Placement[]; chartType: ChartType }) {
  const data = React.useMemo(() => {
    const map = new Map<string, number>()
    for (const r of rows) map.set(r.program, (map.get(r.program) ?? 0) + 1)
    return [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [rows])

  const colors = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"]

  if (data.length === 0) return <EmptyChart />

  const summary = `${data.length} programs. Largest: ${data[0].name} with ${data[0].value} placements.`

  return (
    <ChartFigure label="Placements by Program" summary={summary} dataLength={data.length}>
      {(activeIndex) => (
        <>
          {chartType === "bar" ? (
            <ChartContainer config={BAR_CFG} className="h-[220px] w-full">
              <BarChart data={data.map((d, i) => ({ ...d, fill: colors[i % colors.length] }))} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} width={32} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
                <Bar
                  dataKey="value"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                  activeBar={CHART_KBD_ACTIVE_BAR}
                  activeIndex={activeIndex ?? undefined}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={colors[i % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : chartType === "horizontal-bar" ? (
            <ChartContainer config={BAR_CFG} className="h-[220px] w-full">
              <BarChart data={data.map((d, i) => ({ ...d, fill: colors[i % colors.length] }))} layout="vertical" margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
                <Bar
                  dataKey="value"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={22}
                  activeBar={CHART_KBD_ACTIVE_BAR}
                  activeIndex={activeIndex ?? undefined}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={colors[i % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : (
            <PieChartRenderer data={data.map((d, i) => ({ ...d, fill: colors[i % colors.length] }))} activeIndex={activeIndex} />
          )}
          <ChartDataTable
            caption="Placements by Program data"
            headers={["Program", "Placements"]}
            rows={data.map(d => [d.name, d.value])}
          />
        </>
      )}
    </ChartFigure>
  )
}

function ComplianceChart({ rows, chartType }: { rows: Placement[]; chartType: ChartType }) {
  const upcoming = rows.filter(r => r.placementPhase === "upcoming")
  const data = React.useMemo(() => {
    const map = new Map<string, number>()
    for (const r of upcoming) map.set(r.compliance, (map.get(r.compliance) ?? 0) + 1)
    return ["Complete", "In progress", "Pending documents", "Review", "Incomplete"]
      .filter(s => map.has(s))
      .map(s => ({
        name: s,
        value: map.get(s)!,
        fill: COMPLIANCE_COLORS[s] ?? "var(--primary)",
      }))
  }, [upcoming])

  if (data.length === 0) return <EmptyChart message="No upcoming placements to show compliance." />

  const summary = `${data.length} compliance states. ${data.map(d => `${d.name}: ${d.value}`).join(", ")}.`

  return (
    <ChartFigure label="Compliance Status" summary={summary} dataLength={data.length}>
      {(activeIndex) => (
        <>
          {chartType === "bar" ? (
            <ChartContainer config={BAR_CFG} className="h-[220px] w-full">
              <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} width={32} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
                <Bar
                  dataKey="value"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                  activeBar={CHART_KBD_ACTIVE_BAR}
                  activeIndex={activeIndex ?? undefined}
                >
                  {data.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : chartType === "pie" ? (
            <PieChartRenderer data={data} activeIndex={activeIndex} />
          ) : (
            <HBarChartRenderer data={data} colored activeIndex={activeIndex} />
          )}
          <ChartDataTable
            caption="Compliance Status data"
            headers={["Status", "Placements"]}
            rows={data.map(d => [d.name, d.value])}
          />
        </>
      )}
    </ChartFigure>
  )
}

function ReadinessChart({ rows, chartType }: { rows: Placement[]; chartType: ChartType }) {
  const upcoming = rows.filter(r => r.placementPhase === "upcoming")
  const data = React.useMemo(() => {
    const map = new Map<string, number>()
    for (const r of upcoming) map.set(r.readiness, (map.get(r.readiness) ?? 0) + 1)
    return ["Ready", "In review", "At risk", "Blocked"]
      .filter(s => map.has(s))
      .map(s => ({
        name: s,
        value: map.get(s)!,
        fill: READINESS_COLORS[s] ?? "var(--primary)",
      }))
  }, [upcoming])

  if (data.length === 0) return <EmptyChart message="No upcoming placements to show readiness." />

  const summary = `${data.length} readiness states. ${data.map(d => `${d.name}: ${d.value}`).join(", ")}.`

  return (
    <ChartFigure label="Student Readiness" summary={summary} dataLength={data.length}>
      {(activeIndex) => (
        <>
          {chartType === "pie" ? (
            <PieChartRenderer data={data} activeIndex={activeIndex} />
          ) : chartType === "horizontal-bar" ? (
            <HBarChartRenderer data={data} colored activeIndex={activeIndex} />
          ) : (
            <ChartContainer config={BAR_CFG} className="h-[220px] w-full">
              <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} width={32} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
                <Bar
                  dataKey="value"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                  activeBar={CHART_KBD_ACTIVE_BAR}
                  activeIndex={activeIndex ?? undefined}
                >
                  {data.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
          <ChartDataTable
            caption="Student Readiness data"
            headers={["State", "Placements"]}
            rows={data.map(d => [d.name, d.value])}
          />
        </>
      )}
    </ChartFigure>
  )
}

function ProgressTrackerChart({ rows, chartType }: { rows: Placement[]; chartType: ChartType }) {
  const ongoing = rows.filter(r => r.placementPhase === "ongoing")
  const data = React.useMemo(() => {
    return ongoing.map(r => ({
      name: r.student.split(" ")[0],
      done: r.progressWeeksDone,
      remaining: r.progressWeeksTotal - r.progressWeeksDone,
      pct: Math.round((r.progressWeeksDone / r.progressWeeksTotal) * 100),
    }))
  }, [ongoing])

  if (data.length === 0) return <EmptyChart message="No ongoing placements to track progress." />

  const avgPct = Math.round(data.reduce((s, d) => s + d.pct, 0) / data.length)
  const summary = `${data.length} ongoing placements. Average progress: ${avgPct}%.`

  const cfg: ChartConfig = {
    done: { label: "Completed", color: "var(--color-chart-2)" },
    remaining: { label: "Remaining", color: "var(--muted)" },
  }

  return (
    <ChartFigure label="Ongoing Progress" summary={summary} dataLength={data.length}>
      {(activeIndex) => (
        <>
          {chartType === "bar" ? (
            <ChartContainer config={cfg} className="h-[220px] w-full">
              <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} width={32} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
                <Bar
                  dataKey="done"
                  stackId="progress"
                  fill="var(--color-chart-2)"
                  radius={[0, 0, 0, 0]}
                  maxBarSize={32}
                  activeBar={CHART_KBD_ACTIVE_BAR}
                  activeIndex={activeIndex ?? undefined}
                />
                <Bar
                  dataKey="remaining"
                  stackId="progress"
                  fill="var(--muted)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                  activeBar={CHART_KBD_ACTIVE_BAR}
                  activeIndex={activeIndex ?? undefined}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <ChartContainer config={cfg} className="h-[220px] w-full">
              <BarChart data={data} layout="vertical" margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" width={72} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
                <Bar
                  dataKey="done"
                  stackId="progress"
                  fill="var(--color-chart-2)"
                  radius={[0, 0, 0, 0]}
                  maxBarSize={20}
                  activeBar={CHART_KBD_ACTIVE_BAR}
                  activeIndex={activeIndex ?? undefined}
                />
                <Bar
                  dataKey="remaining"
                  stackId="progress"
                  fill="var(--muted)"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={20}
                  activeBar={CHART_KBD_ACTIVE_BAR}
                  activeIndex={activeIndex ?? undefined}
                />
              </BarChart>
            </ChartContainer>
          )}
          <ChartDataTable
            caption="Ongoing Progress data"
            headers={["Student", "Weeks Done", "Weeks Remaining", "Progress %"]}
            rows={data.map(d => [d.name, d.done, d.remaining, `${d.pct}%`])}
          />
        </>
      )}
    </ChartFigure>
  )
}

function SiteUtilisationChart({ rows, chartType }: { rows: Placement[]; chartType: ChartType }) {
  const data = React.useMemo(() => {
    const map = new Map<string, number>()
    for (const r of rows) map.set(r.site, (map.get(r.site) ?? 0) + 1)
    return [...map.entries()]
      .map(([name, value]) => ({
        name: name.length > 24 ? `${name.slice(0, 22)}…` : name,
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [rows])

  if (data.length === 0) return <EmptyChart />

  const summary = `Top ${data.length} sites. Busiest: ${data[0].name} with ${data[0].value} placements.`
  const colors = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"]

  return (
    <ChartFigure label="Site Utilisation" summary={summary} dataLength={data.length}>
      {(activeIndex) => (
        <>
          {chartType === "bar" ? (
            <ChartContainer config={BAR_CFG} className="h-[220px] w-full">
              <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} width={32} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
                <Bar
                  dataKey="value"
                  fill="var(--color-chart-1)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                  activeBar={CHART_KBD_ACTIVE_BAR}
                  activeIndex={activeIndex ?? undefined}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill="var(--color-chart-1)" />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : chartType === "pie" ? (
            <PieChartRenderer data={data.map((d, i) => ({ ...d, fill: colors[i % colors.length] }))} activeIndex={activeIndex} />
          ) : (
            <ChartContainer config={BAR_CFG} className="h-[220px] w-full">
              <BarChart data={data} layout="vertical" margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
                <Bar
                  dataKey="value"
                  fill="var(--color-chart-1)"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={20}
                  activeBar={CHART_KBD_ACTIVE_BAR}
                  activeIndex={activeIndex ?? undefined}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill="var(--color-chart-1)" />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
          <ChartDataTable
            caption="Site Utilisation data"
            headers={["Site", "Placements"]}
            rows={data.map(d => [d.name, d.value])}
          />
        </>
      )}
    </ChartFigure>
  )
}

function CompletionOutcomesChart({ rows, chartType }: { rows: Placement[]; chartType: ChartType }) {
  const completed = rows.filter(r => r.placementPhase === "completed")
  const stats = React.useMemo(() => {
    if (completed.length === 0) return null
    const passed = completed.filter(r => r.finalStatus === "Passed").length
    const passRate = Math.round((passed / completed.length) * 100)
    const avgRating = completed.reduce((sum, r) => sum + r.rating, 0) / completed.length
    const hireYes = completed.filter(r => r.suggestedToHire === "Yes").length
    return { passRate, avgRating: avgRating.toFixed(1), hireRate: Math.round((hireYes / completed.length) * 100), total: completed.length }
  }, [completed])

  if (!stats) return <EmptyChart message="No completed placements yet." />

  const summary = `${stats.total} completed placements. Pass rate: ${stats.passRate}%, Average rating: ${stats.avgRating}/5.0, Suggested to hire: ${stats.hireRate}%.`

  if (chartType === "bar") {
    const barData = [
      { name: "Pass Rate", value: stats.passRate, fill: "var(--color-chart-2)" },
      { name: "Avg Rating", value: Math.round(parseFloat(stats.avgRating) * 20), fill: "var(--color-chart-1)" },
      { name: "Hire Rate", value: stats.hireRate, fill: "var(--color-chart-3)" },
    ]
    return (
      <ChartFigure label="Completion Outcomes" summary={summary} dataLength={3}>
        {(activeIndex) => (
          <>
            <ChartContainer config={BAR_CFG} className="h-[220px] w-full">
              <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} width={32} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} domain={[0, 100]} />
                <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
                <Bar
                  dataKey="value"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                  activeBar={CHART_KBD_ACTIVE_BAR}
                  activeIndex={activeIndex ?? undefined}
                >
                  {barData.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
            <ChartDataTable
              caption="Completion Outcomes data"
              headers={["Metric", "Value"]}
              rows={[["Pass Rate", `${stats.passRate}%`], ["Average Rating", `${stats.avgRating}/5.0`], ["Suggested to Hire", `${stats.hireRate}%`]]}
            />
          </>
        )}
      </ChartFigure>
    )
  }

  const radialData = [{ name: "Pass Rate", value: stats.passRate, fill: "var(--color-chart-2)" }]

  return (
    <ChartFigure label="Completion Outcomes" summary={summary} dataLength={3}>
      {(activeIndex) => (
        <>
          <div className="flex items-start gap-6">
            <div
              className={cn(
                "shrink-0 rounded-md",
                activeIndex === 0 && "ring-2 ring-ring ring-offset-2 ring-offset-background",
              )}
            >
              <ChartContainer config={BAR_CFG} className="h-[180px] w-[180px]">
                <RadialBarChart
                  cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                  data={radialData} startAngle={90} endAngle={-270}
                  barSize={14}
                >
                  <RadialBar
                    dataKey="value"
                    background
                    cornerRadius={10}
                    activeIndex={activeIndex === 0 ? 0 : undefined}
                  >
                    {radialData.map((d) => (
                      <Cell key={d.name} fill={d.fill} />
                    ))}
                  </RadialBar>
                </RadialBarChart>
              </ChartContainer>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div
                className={cn(
                  "rounded-md px-1 py-0.5",
                  activeIndex === 0 && "ring-2 ring-ring ring-offset-2 ring-offset-background",
                )}
              >
                <p className="text-2xl font-semibold text-foreground tabular-nums">{stats.passRate}%</p>
                <p className="text-xs text-muted-foreground">Pass rate ({stats.total} placements)</p>
              </div>
              <div
                className={cn(
                  "rounded-md px-1 py-0.5",
                  activeIndex === 1 && "ring-2 ring-ring ring-offset-2 ring-offset-background",
                )}
              >
                <p className="text-lg font-semibold text-foreground tabular-nums">{stats.avgRating} <span className="text-xs text-muted-foreground font-normal">/ 5.0</span></p>
                <p className="text-xs text-muted-foreground">Average rating</p>
              </div>
              <div
                className={cn(
                  "rounded-md px-1 py-0.5",
                  activeIndex === 2 && "ring-2 ring-ring ring-offset-2 ring-offset-background",
                )}
              >
                <p className="text-lg font-semibold text-foreground tabular-nums">{stats.hireRate}%</p>
                <p className="text-xs text-muted-foreground">Suggested to hire</p>
              </div>
            </div>
          </div>
          <ChartDataTable
            caption="Completion Outcomes data"
            headers={["Metric", "Value"]}
            rows={[["Pass Rate", `${stats.passRate}%`], ["Average Rating", `${stats.avgRating}/5.0`], ["Suggested to Hire", `${stats.hireRate}%`]]}
          />
        </>
      )}
    </ChartFigure>
  )
}

function UpcomingTimelineChart({ rows, chartType }: { rows: Placement[]; chartType: ChartType }) {
  const upcoming = rows.filter(r => r.placementPhase === "upcoming" && r.daysUntilStart > 0)
  const data = React.useMemo(() => {
    const buckets = [
      { name: "This week", min: 0, max: 7, count: 0 },
      { name: "Week 2", min: 8, max: 14, count: 0 },
      { name: "Week 3", min: 15, max: 21, count: 0 },
      { name: "Week 4", min: 22, max: 28, count: 0 },
      { name: "Week 5–6", min: 29, max: 42, count: 0 },
      { name: "Week 7–8", min: 43, max: 56, count: 0 },
    ]
    for (const r of upcoming) {
      const b = buckets.find(b => r.daysUntilStart >= b.min && r.daysUntilStart <= b.max)
      if (b) b.count++
    }
    return buckets
  }, [upcoming])

  if (upcoming.length === 0) return <EmptyChart message="No upcoming start dates in the next 8 weeks." />

  const summary = `${upcoming.length} upcoming placements across 8 weeks. Most starts: ${data.reduce((a, b) => a.count > b.count ? a : b).name}.`

  return (
    <ChartFigure label="Upcoming Start Dates" summary={summary} dataLength={data.length}>
      {(activeIndex) => (
        <>
          {chartType === "line" ? (
            <ChartContainer config={AREA_CFG} className="h-[200px] w-full">
              <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} width={32} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2}
                  dot={(props: { cx?: number; cy?: number; index?: number; stroke?: string; key?: string }) => {
                    const idx = props.index ?? 0
                    const isSel = activeIndex === idx
                    return (
                      <circle
                        key={props.key}
                        cx={props.cx}
                        cy={props.cy}
                        r={isSel ? 5 : 3}
                        fill={props.stroke ?? "var(--color-chart-1)"}
                        stroke="var(--ring)"
                        strokeWidth={isSel ? 2 : 0}
                      />
                    )
                  }}
                  activeDot={false}
                />
              </LineChart>
            </ChartContainer>
          ) : chartType === "bar" ? (
            <ChartContainer config={AREA_CFG} className="h-[200px] w-full">
              <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} width={32} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
                <Bar
                  dataKey="count"
                  fill="var(--color-chart-1)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                  activeBar={CHART_KBD_ACTIVE_BAR}
                  activeIndex={activeIndex ?? undefined}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill="var(--color-chart-1)" />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : (
            <ChartContainer config={AREA_CFG} className="h-[200px] w-full">
              <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} width={32} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
                <defs>
                  <linearGradient id="timeline-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  key="timeline-count"
                  type="monotone"
                  dataKey="count"
                  stroke="var(--color-chart-1)"
                  fill="url(#timeline-fill)"
                  strokeWidth={2}
                  dot={(props: { cx?: number; cy?: number; index?: number; key?: string }) => {
                    const idx = props.index ?? 0
                    const isSel = activeIndex === idx
                    return (
                      <circle
                        key={props.key}
                        cx={props.cx}
                        cy={props.cy}
                        r={isSel ? 5 : 3}
                        fill="var(--color-chart-1)"
                        stroke="var(--ring)"
                        strokeWidth={isSel ? 2 : 0}
                      />
                    )
                  }}
                />
              </AreaChart>
            </ChartContainer>
          )}
          <ChartDataTable
            caption="Upcoming Start Dates data"
            headers={["Period", "Starting"]}
            rows={data.map(d => [d.name, d.count])}
          />
        </>
      )}
    </ChartFigure>
  )
}

/* ── Shared chart renderers for type switching ────────────────────────── */

function PieChartRenderer({
  data,
  activeIndex = null,
}: {
  data: { name: string; value: number; fill?: string }[]
  activeIndex?: number | null
}) {
  const colors = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"]
  return (
    <ChartContainer config={BAR_CFG} className="h-[220px] w-full">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          strokeWidth={2}
          stroke="var(--card)"
          activeIndex={activeIndex ?? undefined}
          activeShape={CHART_KBD_ACTIVE_PIE_SHAPE}
          labelLine={false}
        >
          {data.map((d, i) => (
            <Cell key={i} fill={d.fill ?? colors[i % colors.length]} />
          ))}
        </Pie>
        <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
      </PieChart>
    </ChartContainer>
  )
}

function HBarChartRenderer({
  data,
  colored,
  activeIndex = null,
}: {
  data: { name: string; value: number; fill?: string }[]
  colored?: boolean
  activeIndex?: number | null
}) {
  return (
    <ChartContainer config={BAR_CFG} className="h-[220px] w-full">
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border" />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
        <Bar
          dataKey="value"
          radius={[0, 4, 4, 0]}
          maxBarSize={22}
          activeBar={CHART_KBD_ACTIVE_BAR}
          activeIndex={activeIndex ?? undefined}
        >
          {colored
            ? data.map((d, i) => (
                <Cell key={i} fill={d.fill ?? "var(--primary)"} />
              ))
            : data.map((_, i) => (
                <Cell key={i} fill="var(--primary)" />
              ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

function EmptyChart({ message = "No data matches the current filters." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground" role="status">
      {message}
    </div>
  )
}

/* ── Card renderer map ─────────────────────────────────────────────────── */

const CHART_RENDERERS: Record<string, React.FC<{ rows: Placement[]; chartType: ChartType }>> = {
  "status-pipeline":     StatusPipelineChart,
  "program-mix":         ProgramMixChart,
  "compliance-status":   ComplianceChart,
  "readiness-overview":  ReadinessChart,
  "progress-tracker":    ProgressTrackerChart,
  "site-utilisation":    SiteUtilisationChart,
  "completion-outcomes": CompletionOutcomesChart,
  "upcoming-timeline":   UpcomingTimelineChart,
}

/* ── Canvas layout (edit mode) ─────────────────────────────────────────── */

function SortableDashboardChartCard({
  card,
  placements,
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
  card: DashboardCardDef
  placements: Placement[]
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

  /* Only apply transform while dragging — idle `transform` breaks grid row sizing + stacking. */
  const style: React.CSSProperties = {
    ...(transform ? { transform: CSS.Transform.toString(transform) } : {}),
    transition,
  }

  const isKeyMetrics = card.id === KEY_METRICS_CARD_ID
  const Renderer = isKeyMetrics ? null : CHART_RENDERERS[card.id]
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
      <div
        className="mb-2 flex w-full min-w-0 flex-wrap items-center gap-2"
        role="toolbar"
        aria-label={`${card.title} layout controls`}
      >
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
        <ChartCard
          variant={chartVariant}
          title={card.title}
          description={card.description}
          className="!h-auto min-h-0 shrink-0"
        >
          {Renderer ? <Renderer rows={placements} chartType={chartType} /> : null}
        </ChartCard>
      )}
    </div>
  )
}

/* ── Main export ───────────────────────────────────────────────────────── */

export interface PlacementsDashboardChartsSectionProps {
  placements: Placement[]
  /** KPI strip rendered as the `key-metrics` dashboard card (same slot as customise canvas). */
  keyMetrics: { metrics: MetricItem[]; insight: MetricInsight }
  visibleCards: string[]
  cardOrder: string[]
  /** Column span per card (1 = half row on large screens, 2 = full width). Defaults merged from saved layout. */
  cardSpans?: Record<string, 1 | 2>
  /** Chart visualization per card. Defaults merged from saved layout. */
  cardChartTypes?: Record<string, ChartType>
  /** How many KPIs to show on the key-metrics card (1–4). */
  keyMetricsKpiCount?: number
  /** When true, show canvas controls: drag, remove, width, chart type (no side panel). */
  layoutEditMode?: boolean
  onVisibleChange?: (visible: string[]) => void
  onOrderChange?: (order: string[]) => void
  onSpanChange?: (id: string, span: 1 | 2) => void
  onChartTypeChange?: (id: string, chartType: ChartType) => void
  onKeyMetricsKpiCountChange?: (count: number) => void
  onResetLayout?: () => void
  /** Exit edit mode (layout already persisted). */
  onLayoutEditDone?: () => void
  /** Exit edit mode and restore layout from when edit started. */
  onLayoutEditCancel?: () => void
}

export function PlacementsDashboardChartsSection({
  placements,
  keyMetrics,
  visibleCards,
  cardOrder,
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
}: PlacementsDashboardChartsSectionProps) {
  const { chartVariant } = useChartVariant()
  const orderedCards = React.useMemo(() => {
    const defs = new Map(ALL_DASHBOARD_CARDS.map(c => [c.id, c]))
    return cardOrder
      .filter(id => visibleCards.includes(id) && defs.has(id))
      .map(id => defs.get(id)!)
  }, [visibleCards, cardOrder])

  const hiddenCardDefs = React.useMemo(
    () => ALL_DASHBOARD_CARDS.filter(c => !visibleCards.includes(c.id)),
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
      <div className="flex flex-col items-center justify-center gap-3 py-12 px-4 text-center">
        <i className="fa-light fa-chart-column text-2xl text-muted-foreground/40" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">
          No charts on the dashboard.
          {layoutEditMode && hiddenCardDefs.length > 0
            ? " Add a chart below."
            : " Turn on Edit layout and add charts back."}
        </p>
        {layoutEditMode && hiddenCardDefs.length > 0 && onVisibleChange ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="size-9 p-0" aria-label="Add chart">
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
        /* stretch + ChartCard h-full + sortable transform causes row overlap — pin to content height */
        layoutEditMode && "lg:items-start lg:content-start lg:auto-rows-min",
      )}
    >
      {orderedCards.map((card, cardIndex) => {
        const isKeyMetricsCard = card.id === KEY_METRICS_CARD_ID
        const Renderer = isKeyMetricsCard ? null : CHART_RENDERERS[card.id]
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
            <SortableDashboardChartCard
              key={card.id}
              card={card}
              placements={placements}
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
                {Renderer ? <Renderer rows={placements} chartType={chartType} /> : null}
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
        <p className="text-xs text-muted-foreground">
          Drag cards to reorder. Changes save automatically.
        </p>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button type="button" size="sm" variant="ghost" className="h-8 text-xs" onClick={() => onVisibleChange(ALL_DASHBOARD_CARDS.map(c => c.id))}>
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
                <Button type="button" variant="outline" size="sm" className="size-8 p-0" aria-label="Add chart">
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
