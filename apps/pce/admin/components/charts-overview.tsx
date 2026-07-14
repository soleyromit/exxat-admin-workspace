"use client"

/**
 * ChartsOverview — Dashboard chart gallery
 *
 * ── ChartCard variants ───────────────────────────────────────────────────────
 *   normal       — plain card with Ask Leo
 *   tabs         — "Chart" | "Trend (Line)" tabs + Ask Leo
 *   selector     — quick-filter Select + Ask Leo
 *   metrics-tabs — metric cells ARE the tab triggers (label + value + trend)
 *
 * ── ASK LEO ICON GUIDELINE ───────────────────────────────────────────────────
 *   Always use: <i className="fa-duotone fa-solid fa-star-christmas" />
 *   Never use:  fa-wand-magic-sparkles  (retired, inconsistent)
 *   Size:       text-xs (12px via --text-xs)  with  aria-hidden="true"
 *   Label:      "Ask Leo"  (never truncate or omit the text label)
 *   Applies to: ALL Ask Leo buttons across the entire app —
 *               ChartCard headers, KeyMetrics card, GreetingWidget, NavUser, etc.
 *
 * ── WCAG AA STANDARDS FOR GRAPHS ─────────────────────────────────────────────
 *   1. Container landmark
 *      • Wrap each chart in a <figure> (or div with role="figure") +
 *        aria-label="<chart title>" + aria-describedby="<id of summary>"
 *      • Add a visually-hidden <figcaption id="<id>"> with a plain-text
 *        summary of the key trend (e.g. "Placements rose 12% in Q1 2026").
 *
 *   2. Keyboard navigation
 *      • The ChartContainer wrapper must have tabIndex={0} so it receives focus.
 *      • On focus, announce title + summary via aria-label / aria-describedby.
 *      • Arrow keys (←/→) cycle through data points; announce value via
 *        a live region (role="status" aria-live="polite").
 *      • Esc clears the selection and returns focus to the container.
 *
 *   3. Accessible data table (hidden fallback)
 *      • Immediately after the SVG/canvas, render a <table> wrapped in
 *        <span className="sr-only"> (visually hidden, in DOM).
 *      • Columns mirror the chart axes; each data point is a <td>.
 *      • Screen-reader users can navigate data with standard table shortcuts.
 *
 *   4. Colour & contrast
 *      • Chart series colours must achieve ≥ 3:1 contrast against the card bg.
 *      • Never use colour as the ONLY differentiator — pair with:
 *          - Dashed vs solid line strokes
 *          - Direct inline labels on lines/segments
 *          - Shape markers on data points (circle vs square vs triangle)
 *      • Text labels inside charts: ≥ 4.5:1 on their local background.
 *
 *   5. Focus ring on data points
 *      • Active/focused data point: 3px outline, ≥ 3:1 contrast, distinct
 *        from the hover state (use outline-offset to separate).
 *
 *   6. Tooltip accessibility
 *      • Tooltips must appear on keyboard focus, not only on mouse hover.
 *      • Tooltip content must be announced to the live region.
 *      • Tooltip must remain visible while it has focus (no auto-dismiss).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import * as React from "react"
import {
  Area,   AreaChart,
  Bar,    BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Funnel, FunnelChart, LabelList,
  Line,   LineChart,
  Pie,    PieChart,
  PolarAngleAxis, PolarGrid, PolarRadiusAxis,
  Radar,  RadarChart,
  RadialBar, RadialBarChart,
  Scatter,   ScatterChart,
  Sector,
  Trapezoid,
  XAxis, YAxis, ZAxis,
  type DotItemDotProps,
} from "recharts"
import type { PieSectorDataItem } from "recharts/types/polar/Pie"
import {
  QuotaLinearProgressCardBody,
  QuotaRadialChartInner,
} from "@/components/dashboard-quota-progress-card"
import {
  DASHBOARD_STUDENT_SCORES,
  formatBandScore,
  type StudentScoreRadial,
} from "@/lib/mock/dashboard"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  chartTooltipKeyboardSyncProps,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { AskLeoButton } from "@/components/ask-leo-button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { isEditableTarget } from "@/lib/editable-target"
import { chartLineStrokeDash } from "@/lib/chart-line-dash"
import {
  CHART_AXIS_TICK,
  CHART_TICK_FONT_SIZE,
} from "@/lib/chart-typography"
import {
  CHART_DASHBOARD_CELL_CLASS,
  CHART_DASHBOARD_PLOT_MIN_CLASS,
  CHART_DASHBOARD_ROW_GRID_CLASS,
  CHART_DASHBOARD_ROW_GRID_THIRDS_CLASS,
} from "@/lib/chart-dashboard-layout"
import { chartLeoPeakAnchor } from "@/lib/chart-leo-spotting"
import {
  CHART_KBD_ACTIVE_PIE_SHAPE,
} from "@/lib/chart-keyboard-selection"
import { cn } from "@/lib/utils"
import { metricTrendTone, type MetricTrendPolarity } from "@/components/key-metrics"

/** Recharts passes `index` into Line `dot` renderers; keep the callback typed against the v3 dot contract. */
type LineDotRenderProps = DotItemDotProps & { index?: number }

function donutLeoSector(props: PieSectorDataItem) {
  const isPeak = props.name === "confirmed"
  const isActive = (props as PieSectorDataItem & { isActive?: boolean }).isActive
  return (
    <Sector
      {...props}
      {...(isActive ? CHART_KBD_ACTIVE_PIE_SHAPE : {})}
      data-chart-leo-anchor={isPeak ? "peak" : undefined}
    />
  )
}

function radialLeoSector(
  props: React.ComponentProps<typeof Sector> & { payload?: { name?: string }; isActive?: boolean },
) {
  const isPeak = props.payload?.name === "nursing"
  return (
    <Sector
      {...props}
      {...(props.isActive ? CHART_KBD_ACTIVE_PIE_SHAPE : {})}
      data-chart-leo-anchor={isPeak ? "peak" : undefined}
    />
  )
}

function funnelLeoShape(
  props: React.ComponentProps<typeof Trapezoid> & { payload?: { name?: string } },
) {
  const isPeak = props.payload?.name === "Applied"
  return <Trapezoid {...props} data-chart-leo-anchor={isPeak ? "peak" : undefined} />
}

const SCATTER_LEO_PEAK = { x: 90, y: 97 } as const

const activeIndexProps = (activeIndex: number | null) =>
  activeIndex == null ? {} : ({ activeIndex } as Record<string, unknown>)

type MiniMetric = {
  label: string
  value: string
  trend?: "up" | "down" | "neutral"
  /** Same semantics as `MetricItem.trendPolarity` on `KeyMetrics`. */
  trendPolarity?: MetricTrendPolarity
}

/* ── Colour tokens ────────────────────────────────────────────────────────── */
const BRAND       = "var(--brand-color)"
const CHART_1     = "var(--color-chart-1)"
const CHART_2     = "var(--color-chart-2)"
const CHART_3     = "var(--color-chart-3)"
const CHART_4     = "var(--color-chart-4)"
const CHART_5     = "var(--color-chart-5)"
const SUCCESS     = "var(--chart-2)"
const WARNING     = "var(--chart-4)"
const DESTRUCTIVE = "var(--destructive)"

/* ── Period filter options (reused across selector cards) ─────────────────── */
const PERIOD_OPTIONS = [
  { value: "7d",  label: "Last 7 days"  },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last quarter" },
  { value: "1y",  label: "Last year"   },
]

const PROGRAM_OPTIONS = [
  { value: "all",      label: "All programs" },
  { value: "nursing",  label: "Nursing"      },
  { value: "pt",       label: "PT"           },
  { value: "ot",       label: "OT"           },
  { value: "pharmacy", label: "Pharmacy"     },
]

/* ════════════════════════════════════════════════════════════════════════════
   REUSABLE ChartCard — supports 3 variants
   ════════════════════════════════════════════════════════════════════════════ */

export type ChartCardVariant = "normal" | "tabs" | "selector" | "metrics-tabs" | "kpi-chart"

/** Shared line tab chrome — metrics-tabs is canonical; tabs variant uses the same shell. */
const chartCardLineTabsListClass =
  "h-auto w-full gap-0 rounded-none justify-start !items-end"

const chartCardLineTabTriggerBaseClass =
  "h-auto min-w-0 flex-none px-3 pt-2 pb-3 text-muted-foreground data-active:text-foreground"

const chartCardTabTriggerClass = cn(
  chartCardLineTabTriggerBaseClass,
  "flex-row items-center gap-2",
)

const chartCardMetricTabTriggerClass = cn(
  chartCardLineTabTriggerBaseClass,
  "flex-col items-start gap-1",
)

import {
  type ChartLeoInsight,
  type ChartLeoInsightAnchor,
  type ChartLeoInsightKind,
} from "@/components/leo-insight-indicator"
import {
  ChartLeoInsightOverlay,
  ChartLeoPlotInsightOverlay,
} from "@/components/chart-leo-spotting"
export type { ChartLeoInsight, ChartLeoInsightAnchor, ChartLeoInsightKind }
export { ChartLeoPlotInsightOverlay, ChartLeoInsightOverlay, ChartLeoPixelPlotInsightOverlay } from "@/components/chart-leo-spotting"

/** Screen-reader data fallback for charts — shared with list-page dashboards. */
export function ChartDataTable({
  caption,
  headers,
  rows,
}: {
  caption: string
  headers: string[]
  rows: (string | number)[][]
}) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>{headers.map((h) => <th key={h} scope="col">{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
        ))}
      </tbody>
    </table>
  )
}

/**
 * Keyboard-focusable chart region (arrow keys, Escape) + live announcement when a point is selected.
 * Shared by the `/dashboard` gallery and **Data** view dashboards (Placements / Team / Compliance): same
 * interaction model; visual differences come from `ChartCard` chrome and per-chart renderers (bar vs pie),
 * not from a separate chart implementation.
 */
export function ChartFigure({
  label,
  summary,
  dataLength,
  leoInsight,
  children,
}: {
  label: string
  summary: string
  dataLength: number
  /** Optional Ask-Leo insight context for chart bodies (same as `ChartCard`). */
  leoInsight?: ChartLeoInsight | null
  children: (activeIndex: number | null) => React.ReactNode
}) {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null)
  const ref = React.useRef<HTMLDivElement>(null)
  const prevActiveIndexRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    const prev = prevActiveIndexRef.current
    prevActiveIndexRef.current = activeIndex
    if (prev === null || activeIndex !== null) return
    const wrapper = ref.current?.querySelector<HTMLElement>(".recharts-wrapper")
    if (!wrapper) return
    wrapper.dispatchEvent(
      new MouseEvent("mouseleave", { bubbles: true, cancelable: true }),
    )
  }, [activeIndex])

  const navigateKeys = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (!dataLength) return
      if (isEditableTarget(e.target)) return
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault()
          e.stopPropagation()
          setActiveIndex((i) => (i === null ? 0 : Math.min(i + 1, dataLength - 1)))
          break
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault()
          e.stopPropagation()
          setActiveIndex((i) => (i === null ? dataLength - 1 : Math.max(i - 1, 0)))
          break
        case "Escape":
          e.preventDefault()
          e.stopPropagation()
          setActiveIndex(null)
          ref.current?.blur()
          break
        default:
          break
      }
    },
    [dataLength],
  )

  /** Clicks on Recharts SVG do not focus this node — focus so Arrow keys work without extra Tab stops. */
  function handlePointerDownCapture(e: React.PointerEvent<HTMLDivElement>) {
    if (!dataLength) return
    const root = ref.current
    if (!root?.contains(e.target as Node)) return
    const el = e.target as HTMLElement | null
    if (el?.closest?.("button, a, [role='tab'], [role='option'], input, select, textarea, [contenteditable='true']"))
      return
    queueMicrotask(() => root.focus())
  }

  return (
    <div
      ref={ref}
      tabIndex={0}
      role="application"
      aria-label={`${label}. ${summary}. Click the chart or press Tab to focus, then use arrow keys to explore data points. Press Escape to clear selection.`}
      onKeyDownCapture={(e) => {
        if (!ref.current?.contains(e.target as Node)) return
        if (isEditableTarget(e.target)) return
        if (
          e.key === "ArrowRight" ||
          e.key === "ArrowDown" ||
          e.key === "ArrowLeft" ||
          e.key === "ArrowUp" ||
          e.key === "Escape"
        ) {
          navigateKeys(e)
        }
      }}
      onPointerDownCapture={handlePointerDownCapture}
      className="flex min-h-0 flex-1 flex-col outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-sm"
    >
      <ChartLeoInsightOverlay leoInsight={leoInsight} chartTitle={label}>
        {children(activeIndex)}
      </ChartLeoInsightOverlay>
      {activeIndex !== null && (
        <div role="status" aria-live="polite" className="sr-only">
          Data point {activeIndex + 1} of {dataLength} selected
        </div>
      )}
    </div>
  )
}

function ChartCardHeader({
  title,
  description,
  variant,
  filterOptions,
  filter,
  onFilter,
}: {
  title: string
  description: string
  variant: ChartCardVariant
  filterOptions?: { value: string; label: string }[]
  filter?: string
  onFilter?: (v: string) => void
}) {
  const isSelector = variant === "selector" && Array.isArray(filterOptions) && filterOptions.length > 0
  return (
    <CardHeader className="shrink-0 pb-2">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <CardTitle className="text-sm font-semibold leading-tight">{title}</CardTitle>
          <CardDescription className="mt-0.5">{description}</CardDescription>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Reveal on card hover/focus — pointer-events guarded so the hidden button is not reachable */}
          <span className="pointer-events-none opacity-0 transition-opacity duration-150 group-hover/card:pointer-events-auto group-hover/card:opacity-100 group-focus-within/card:pointer-events-auto group-focus-within/card:opacity-100 inline-flex">
            <AskLeoButton
              iconOnly={isSelector}
              ariaLabel="Ask Leo about this chart"
            />
          </span>
          {isSelector && filterOptions && onFilter && (
            <Select value={filter || filterOptions[0]?.value} onValueChange={(v) => onFilter(v)}>
              <SelectTrigger
                className="h-8 w-auto min-w-[9rem] shrink-0 text-sm"
                aria-label="Filter chart data"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end" sideOffset={4}>
                {filterOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    </CardHeader>
  )
}

function resolveChartCardFilter(
  variant: ChartCardVariant,
  defaultFilter: string | undefined,
  filterOptions: { value: string; label: string }[] | undefined,
  miniMetrics: MiniMetric[] | undefined,
  tabOptions: { value: string; label: string }[] | undefined,
): string {
  if (variant === "metrics-tabs" && miniMetrics && miniMetrics.length > 0) {
    const labels = new Set(miniMetrics.map((m) => m.label))
    if (defaultFilter && labels.has(defaultFilter)) return defaultFilter
    return miniMetrics[0]!.label
  }
  if (variant === "kpi-chart" && miniMetrics && miniMetrics.length > 0) {
    return miniMetrics[0]!.label
  }
  if (variant === "tabs" && tabOptions && tabOptions.length > 0) {
    if (defaultFilter && tabOptions.some((t) => t.value === defaultFilter)) return defaultFilter
    return tabOptions[0]!.value
  }
  if (variant === "selector" && filterOptions && filterOptions.length > 0) {
    if (defaultFilter && filterOptions.some((o) => o.value === defaultFilter)) return defaultFilter
    return filterOptions[0]!.value
  }
  return defaultFilter ?? ""
}

export function ChartCard({
  title,
  description,
  children,
  className = "",
  variant = "normal",
  trendContent,
  filterOptions,
  defaultFilter,
  onFilterChange,
  miniMetrics,
  tabOptions,
  leoInsight,
}: {
  title: string
  description: string
  children: React.ReactNode | ((filter: string) => React.ReactNode)
  className?: string
  variant?: ChartCardVariant
  /** "tabs" / "metrics-tabs" variant: content shown in the "Trend" tab */
  trendContent?: React.ReactNode
  /** "selector" variant: options for the filter dropdown */
  filterOptions?: { value: string; label: string }[]
  defaultFilter?: string
  onFilterChange?: (value: string) => void
  /** "metrics-tabs" variant: compact KPI strip shown above the chart */
  miniMetrics?: MiniMetric[]
  /** "tabs" variant: override the default Chart/Trend tabs with custom options.
   *  The selected value is passed to the children function. */
  tabOptions?: { value: string; label: string }[]
  /**
   * Smart Leo summary: opens a popover + Ask Leo CTA.
   * With `anchor`, mount `ChartLeoPlotInsightOverlay` beside `ChartContainer` for on-plot guide + marker.
   */
  leoInsight?: ChartLeoInsight | null
}) {
  const [filter, setFilter] = React.useState(() =>
    resolveChartCardFilter(variant, defaultFilter, filterOptions, miniMetrics, tabOptions),
  )

  // Reconcile when variant or option sets change (catalog variant switcher, prop updates).
  React.useEffect(() => {
    setFilter(resolveChartCardFilter(variant, defaultFilter, filterOptions, miniMetrics, tabOptions))
  }, [variant, defaultFilter, filterOptions, miniMetrics, tabOptions])

  const handleFilter = (v: string) => { setFilter(v); onFilterChange?.(v) }

  const resolvedChildren =
    typeof children === "function" ? children(filter) : children

  const chartCardShellClass = cn("flex h-full min-h-0 flex-col", className)

  /* ── Default Chart / Trend tabs (no custom tabOptions) ───────────────────── */
  const defaultTabsBlock = (
    <Tabs defaultValue="chart" className="flex flex-col flex-1 min-h-0">
      <div className="shrink-0 px-2">
        <TabsList variant="line" className={chartCardLineTabsListClass}>
          <TabsTrigger value="chart" className={chartCardTabTriggerClass}>
            <i className="fa-light fa-chart-mixed text-sm" aria-hidden="true" />
            Chart
          </TabsTrigger>
          <TabsTrigger value="trend" className={chartCardTabTriggerClass}>
            <i className="fa-light fa-chart-line text-sm" aria-hidden="true" />
            Trend
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="chart" className="flex min-h-[200px] flex-1 flex-col m-0">
        <CardContent className="flex min-h-[200px] flex-1 flex-col pb-4">
          <ChartLeoInsightOverlay leoInsight={leoInsight} chartTitle={title}>
            {resolvedChildren}
          </ChartLeoInsightOverlay>
        </CardContent>
      </TabsContent>
      <TabsContent value="trend" className="flex min-h-[200px] flex-1 flex-col m-0">
        <CardContent className="flex min-h-[200px] flex-1 flex-col pb-4">
          <ChartLeoInsightOverlay leoInsight={leoInsight} chartTitle={title}>
            {trendContent ?? resolvedChildren}
          </ChartLeoInsightOverlay>
        </CardContent>
      </TabsContent>
    </Tabs>
  )

  if (variant === "tabs") {
    /* Custom tab labels (e.g. period picker for key metrics) */
    if (tabOptions && tabOptions.length > 0) {
      const selectedTab = filter || tabOptions[0].value
      return (
        <Card className={chartCardShellClass} role="figure" aria-label={title}>
          <ChartCardHeader title={title} description={description} variant="normal" />
          <Tabs defaultValue={tabOptions[0].value} value={selectedTab} onValueChange={handleFilter} className="flex flex-col flex-1 min-h-0">
            <div className="shrink-0 px-2">
              <TabsList variant="line" className={chartCardLineTabsListClass}>
                {tabOptions.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} className={chartCardTabTriggerClass}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            {tabOptions.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="flex min-h-[200px] flex-1 flex-col m-0">
                <CardContent className="flex min-h-[200px] flex-1 flex-col pb-4">
                  <ChartLeoInsightOverlay leoInsight={leoInsight} chartTitle={title}>
                    {typeof children === "function" ? children(tab.value) : children}
                  </ChartLeoInsightOverlay>
                </CardContent>
              </TabsContent>
            ))}
          </Tabs>
        </Card>
      )
    }

    return (
      <Card className={chartCardShellClass} role="figure" aria-label={title}>
        <ChartCardHeader title={title} description={description} variant="normal" />
        {defaultTabsBlock}
      </Card>
    )
  }

  if (variant === "metrics-tabs") {
    const metrics = miniMetrics && miniMetrics.length > 0 ? miniMetrics : null
    const selectedMetric = filter || metrics?.[0]?.label || ""

    return (
      <Card className={chartCardShellClass} role="figure" aria-label={title}>
        <ChartCardHeader title={title} description={description} variant="normal" />

        {metrics ? (
          /* Metrics ARE the tabs — each metric cell is a clickable TabsTrigger */
          <Tabs value={selectedMetric} onValueChange={handleFilter} className="flex flex-col flex-1 min-h-0">
            <div className="shrink-0 px-2">
              <TabsList
                variant="line"
                className={chartCardLineTabsListClass}
              >
                {metrics.map((m) => {
                  const isUp   = m.trend === "up"
                  const isDown = m.trend === "down"
                  const tone = metricTrendTone(m.trend ?? "neutral", m.trendPolarity)
                  const upClass =
                    tone === "positive"
                      ? "text-emerald-600"
                      : tone === "negative"
                        ? "text-destructive"
                        : "text-muted-foreground"
                  const downClass =
                    tone === "positive"
                      ? "text-emerald-600"
                      : tone === "negative"
                        ? "text-destructive"
                        : "text-muted-foreground"
                  return (
                    <TabsTrigger
                      key={m.label}
                      value={m.label}
                      className={chartCardMetricTabTriggerClass}
                    >
                      <span className="text-sm font-normal text-muted-foreground leading-none">{m.label}</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-bold tabular-nums leading-none text-foreground">{m.value}</span>
                        {isUp   && <i className={cn("fa-light fa-arrow-trend-up text-xs", upClass)}   aria-hidden="true" />}
                        {isDown && <i className={cn("fa-light fa-arrow-trend-down text-xs", downClass)} aria-hidden="true" />}
                      </div>
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </div>
            {/* All metric tabs show the same chart — tab selection is a context indicator */}
            {metrics.map((m) => (
              <TabsContent key={m.label} value={m.label} className="flex min-h-[200px] flex-1 flex-col m-0">
                <CardContent className="flex min-h-[200px] flex-1 flex-col pb-4">
                  <ChartLeoInsightOverlay leoInsight={leoInsight} chartTitle={title}>
                    {resolvedChildren}
                  </ChartLeoInsightOverlay>
                </CardContent>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          defaultTabsBlock
        )}
      </Card>
    )
  }

  /* ── kpi-chart: prominent metric on top, chart below ─────────────────────── */
  if (variant === "kpi-chart") {
    const kpi    = miniMetrics?.[0]
    const isUp   = kpi?.trend === "up"
    const isDown = kpi?.trend === "down"
    const tone = metricTrendTone(kpi?.trend ?? "neutral", kpi?.trendPolarity)
    const trendClass =
      tone === "positive"
        ? "text-emerald-600"
        : tone === "negative"
          ? "text-destructive"
          : "text-muted-foreground"

    return (
      <Card className={chartCardShellClass} role="figure" aria-label={title}>
        <ChartCardHeader title={title} description={description} variant="normal" />

        {kpi && (
          <div className="px-6 pb-2 shrink-0">
            <div className="flex items-baseline gap-2.5">
              <span className="text-4xl font-bold tabular-nums tracking-tight text-foreground">
                {kpi.value}
              </span>
              {isUp && (
                <span className={cn("flex items-center gap-1 text-sm font-medium", trendClass)}>
                  <i className="fa-light fa-arrow-trend-up" aria-hidden="true" />
                  <span className="sr-only">trending up</span>
                </span>
              )}
              {isDown && (
                <span className={cn("flex items-center gap-1 text-sm font-medium", trendClass)}>
                  <i className="fa-light fa-arrow-trend-down" aria-hidden="true" />
                  <span className="sr-only">trending down</span>
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
          </div>
        )}

        <CardContent className="flex-1 flex flex-col min-h-0 pb-4 pt-0">
          <ChartLeoInsightOverlay leoInsight={leoInsight} chartTitle={title}>
            {resolvedChildren}
          </ChartLeoInsightOverlay>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={chartCardShellClass} role="figure" aria-label={title}>
      <ChartCardHeader
        title={title}
        description={description}
        variant={variant}
        filterOptions={filterOptions}
        filter={filter}
        onFilter={handleFilter}
      />
      <CardContent className="flex-1 flex flex-col min-h-0 pb-4">
        <ChartLeoInsightOverlay leoInsight={leoInsight} chartTitle={title}>
          {resolvedChildren}
        </ChartLeoInsightOverlay>
      </CardContent>
    </Card>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   DATA & CHART COMPONENTS
   ════════════════════════════════════════════════════════════════════════════ */

/* ── Area ─────────────────────────────────────────────────────────────────── */
const areaCfg: ChartConfig = {
  placements:   { label: "Placements",   color: BRAND   },
  applications: { label: "Applications", color: CHART_2 },
  reviews:      { label: "Reviews",      color: CHART_4 },
}
const areaData = [
  { month: "Aug", placements: 42, applications: 78,  reviews: 31 },
  { month: "Sep", placements: 58, applications: 91,  reviews: 44 },
  { month: "Oct", placements: 53, applications: 85,  reviews: 39 },
  { month: "Nov", placements: 67, applications: 102, reviews: 52 },
  { month: "Dec", placements: 49, applications: 76,  reviews: 37 },
  { month: "Jan", placements: 74, applications: 118, reviews: 60 },
  { month: "Feb", placements: 81, applications: 124, reviews: 68 },
  { month: "Mar", placements: 89, applications: 137, reviews: 72 },
]

export function AreaChartContent() {
  return (
    <ChartFigure label="Placement Trends" summary="Multi-line area chart showing placements, applications and reviews from Aug to Mar" dataLength={areaData.length}>
      {(activeIndex) => (
        <>
          <div className="relative w-full min-h-[180px] flex-1">
            <ChartContainer config={areaCfg} className="h-full min-h-[180px] w-full flex-1">
              <AreaChart data={areaData} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="gPlace" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={BRAND}   stopOpacity={0.35} />
                    <stop offset="95%" stopColor={BRAND}   stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={CHART_2} stopOpacity={0.3}  />
                    <stop offset="95%" stopColor={CHART_2} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={CHART_4} stopOpacity={0.3}  />
                    <stop offset="95%" stopColor={CHART_4} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} />
                <YAxis tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} width={36} />
                <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
                <ChartLegend content={({ payload, verticalAlign }) => <ChartLegendContent payload={payload} verticalAlign={verticalAlign} />} />
                <Area key="placements" type="monotone" dataKey="placements"   stroke={BRAND}   fill="url(#gPlace)" strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: "var(--ring)", strokeWidth: 2 }} />
                <Area key="applications" type="monotone" dataKey="applications" stroke={CHART_2} fill="url(#gApps)"  strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: "var(--ring)", strokeWidth: 2 }} />
                <Area key="reviews" type="monotone" dataKey="reviews"      stroke={CHART_4} fill="url(#gRev)"   strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: "var(--ring)", strokeWidth: 2 }} />
              </AreaChart>
            </ChartContainer>
            <ChartLeoPlotInsightOverlay data={areaData} xDataKey="month" />
          </div>
          <ChartDataTable caption="Placement Trends" headers={["Month", "Placements", "Applications", "Reviews"]} rows={areaData.map(d => [d.month, d.placements, d.applications, d.reviews])} />
        </>
      )}
    </ChartFigure>
  )
}

function AreaLineTrendContent() {
  return (
    <ChartFigure label="Placement Trends" summary="Line chart showing placement trends Aug to Mar" dataLength={areaData.length}>
      {(activeIndex) => (
        <>
          <div className="relative w-full min-h-[180px] flex-1">
            <ChartContainer config={areaCfg} className="h-full min-h-[180px] w-full flex-1">
              <LineChart data={areaData} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} />
                <YAxis tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} width={36} />
                <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
                <ChartLegend content={({ payload, verticalAlign }) => <ChartLegendContent payload={payload} verticalAlign={verticalAlign} />} />
                <Line type="monotone" dataKey="placements"   stroke={BRAND}   strokeWidth={2} strokeDasharray={chartLineStrokeDash(0)} dot={(props: LineDotRenderProps) => props.index === activeIndex ? <circle key={props.key} cx={props.cx} cy={props.cy} r={5} fill={props.stroke} stroke="var(--ring)" strokeWidth={2} /> : <circle key={props.key} cx={props.cx} cy={props.cy} r={2} fill={props.stroke} />} />
                <Line type="monotone" dataKey="applications" stroke={CHART_2} strokeWidth={2} strokeDasharray={chartLineStrokeDash(1)} dot={(props: LineDotRenderProps) => props.index === activeIndex ? <circle key={props.key} cx={props.cx} cy={props.cy} r={5} fill={props.stroke} stroke="var(--ring)" strokeWidth={2} /> : <circle key={props.key} cx={props.cx} cy={props.cy} r={2} fill={props.stroke} />} />
                <Line type="monotone" dataKey="reviews"      stroke={CHART_4} strokeWidth={2} strokeDasharray={chartLineStrokeDash(2)} dot={(props: LineDotRenderProps) => props.index === activeIndex ? <circle key={props.key} cx={props.cx} cy={props.cy} r={5} fill={props.stroke} stroke="var(--ring)" strokeWidth={2} /> : <circle key={props.key} cx={props.cx} cy={props.cy} r={2} fill={props.stroke} />} />
              </LineChart>
            </ChartContainer>
            <ChartLeoPlotInsightOverlay data={areaData} xDataKey="month" />
          </div>
          <ChartDataTable caption="Placement Trends" headers={["Month", "Placements", "Applications", "Reviews"]} rows={areaData.map(d => [d.month, d.placements, d.applications, d.reviews])} />
        </>
      )}
    </ChartFigure>
  )
}

/* Selector variant — filter data by period */
const areaDataByPeriod: Record<string, typeof areaData> = {
  "7d":  areaData.slice(-2),
  "30d": areaData.slice(-4),
  "90d": areaData.slice(-6),
  "1y":  areaData,
}

function AreaSelectorContent({ filter }: { filter: string }) {
  const data = areaDataByPeriod[filter] ?? areaData
  return (
    <ChartFigure label="Placement Trends" summary={`Area chart for ${filter} period`} dataLength={data.length}>
      {(activeIndex) => (
        <>
          <div className="relative w-full min-h-[180px] flex-1">
            <ChartContainer config={areaCfg} className="h-full min-h-[180px] w-full flex-1">
              <AreaChart data={data} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="gPlace2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={BRAND}   stopOpacity={0.35} />
                    <stop offset="95%" stopColor={BRAND}   stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} />
                <YAxis tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} width={36} />
                <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
                <ChartLegend content={({ payload, verticalAlign }) => <ChartLegendContent payload={payload} verticalAlign={verticalAlign} />} />
                <Area key="placements" type="monotone" dataKey="placements"   stroke={BRAND}   fill="url(#gPlace2)" strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: "var(--ring)", strokeWidth: 2 }} />
                <Area key="applications" type="monotone" dataKey="applications" stroke={CHART_2} fill="none"           strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: "var(--ring)", strokeWidth: 2 }} />
                <Area key="reviews" type="monotone" dataKey="reviews"      stroke={CHART_4} fill="none"           strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: "var(--ring)", strokeWidth: 2 }} />
              </AreaChart>
            </ChartContainer>
            <ChartLeoPlotInsightOverlay data={data} xDataKey="month" />
          </div>
          <ChartDataTable caption="Placement Trends" headers={["Month", "Placements", "Applications", "Reviews"]} rows={data.map(d => [d.month, d.placements, d.applications, d.reviews])} />
        </>
      )}
    </ChartFigure>
  )
}

/* ── Donut ─────────────────────────────────────────────────────────────────── */
const donutCfg: ChartConfig = {
  confirmed: { label: "Confirmed", color: SUCCESS     },
  pending:   { label: "Pending",   color: WARNING     },
  rejected:  { label: "Rejected",  color: DESTRUCTIVE },
  review:    { label: "In Review", color: CHART_1     },
}
const donutDataAll = [
  { name: "confirmed", value: 58, fill: SUCCESS     },
  { name: "pending",   value: 24, fill: WARNING     },
  { name: "rejected",  value: 9,  fill: DESTRUCTIVE },
  { name: "review",    value: 9,  fill: CHART_1     },
]

export function DonutChartContent({ data = donutDataAll }: { data?: typeof donutDataAll }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <ChartFigure label="Placement Status" summary="Donut chart showing confirmed, pending, rejected and in-review placement distribution" dataLength={data.length} leoInsight={CHART_GALLERY_LEO_DONUT}>
      {(activeIndex) => (
        <>
          <div className={cn("relative w-full flex-1", CHART_DASHBOARD_PLOT_MIN_CLASS)}>
            <ChartContainer config={donutCfg} className={cn("h-full w-full", CHART_DASHBOARD_PLOT_MIN_CLASS)}>
              <PieChart>
                <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent hideLabel />} />
                <Pie data={data} dataKey="value" nameKey="name"
                  innerRadius="50%" outerRadius="78%" strokeWidth={2} stroke="var(--card)"
                  shape={donutLeoSector}
                  activeShape={donutLeoSector}
                  {...activeIndexProps(activeIndex)}>
                  {data.map((d, i) => (
                    <Cell
                      key={d.name}
                      fill={d.fill}
                      opacity={activeIndex !== null && activeIndex !== i ? 0.5 : 1}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <ChartLeoPlotInsightOverlay chartFamily="radial" />
          </div>
          <div className="mt-2 flex shrink-0 flex-col gap-1.5 text-xs">
            {data.map((d) => (
              <div key={d.name} className="flex min-w-0 items-center gap-2">
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: d.fill }} />
                <span className="min-w-0 truncate text-muted-foreground">{donutCfg[d.name]?.label}</span>
                <span className="ms-auto shrink-0 font-medium tabular-nums">
                  {Math.round(d.value / total * 100)}%
                </span>
              </div>
            ))}
          </div>
          <ChartDataTable
            caption="Placement Status"
            headers={["Status", "Count"]}
            rows={data.map(d => {
              const raw = donutCfg[d.name]?.label ?? d.name
              const label =
                typeof raw === "string" || typeof raw === "number" ? String(raw) : String(d.name)
              return [label, d.value] as [string, number]
            })}
          />
        </>
      )}
    </ChartFigure>
  )
}

const donutBarTrendData = [
  { month: "Jan", confirmed: 52, pending: 20, rejected: 7 },
  { month: "Feb", confirmed: 60, pending: 18, rejected: 6 },
  { month: "Mar", confirmed: 68, pending: 24, rejected: 9 },
]

/* Donut trend — bar chart version */
function DonutBarTrendContent() {
  return (
    <ChartContainer config={donutCfg} className="flex-1 min-h-[180px] w-full">
      <BarChart data={donutBarTrendData} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} />
        <YAxis tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} width={28} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={({ payload, verticalAlign }) => <ChartLegendContent payload={payload} verticalAlign={verticalAlign} />} />
        <Bar dataKey="confirmed" fill={SUCCESS}     stackId="a" />
        <Bar dataKey="pending"   fill={WARNING}     stackId="a" />
        <Bar dataKey="rejected"  fill={DESTRUCTIVE} stackId="a" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}

/* Donut — selector by program */
const donutByProgram: Record<string, typeof donutDataAll> = {
  all:      donutDataAll,
  nursing:  [{ name: "confirmed", value: 72, fill: SUCCESS }, { name: "pending", value: 18, fill: WARNING }, { name: "rejected", value: 5, fill: DESTRUCTIVE }, { name: "review", value: 5, fill: CHART_1 }],
  pt:       [{ name: "confirmed", value: 55, fill: SUCCESS }, { name: "pending", value: 28, fill: WARNING }, { name: "rejected", value: 10, fill: DESTRUCTIVE }, { name: "review", value: 7, fill: CHART_1 }],
  ot:       [{ name: "confirmed", value: 48, fill: SUCCESS }, { name: "pending", value: 30, fill: WARNING }, { name: "rejected", value: 14, fill: DESTRUCTIVE }, { name: "review", value: 8, fill: CHART_1 }],
  pharmacy: [{ name: "confirmed", value: 40, fill: SUCCESS }, { name: "pending", value: 35, fill: WARNING }, { name: "rejected", value: 15, fill: DESTRUCTIVE }, { name: "review", value: 10, fill: CHART_1 }],
}

/* ── Grouped Bar ─────────────────────────────────────────────────────────── */
const barCfg: ChartConfig = {
  new:      { label: "New",      color: BRAND   },
  returned: { label: "Returned", color: CHART_2 },
}
const barData = [
  { program: "Nursing", new: 34, returned: 22 },
  { program: "PT",      new: 28, returned: 18 },
  { program: "OT",      new: 21, returned: 14 },
  { program: "SW",      new: 19, returned: 11 },
  { program: "Pharm",   new: 15, returned: 9  },
  { program: "Rad",     new: 12, returned: 7  },
]

export function GroupedBarContent() {
  return (
    <ChartFigure label="Applications by Program" summary="Grouped bar chart showing new and returned applications across 6 programs" dataLength={barData.length} leoInsight={CHART_GALLERY_LEO_APPLICATIONS}>
      {(activeIndex) => (
        <>
          <div className="relative w-full min-h-[180px] flex-1">
            <ChartContainer config={barCfg} className="h-full min-h-[180px] w-full">
              <BarChart data={barData} barGap={4} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="program" tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} />
                <YAxis tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} width={28} />
                <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
                <ChartLegend content={({ payload, verticalAlign }) => <ChartLegendContent payload={payload} verticalAlign={verticalAlign} />} />
                <Bar dataKey="new"      fill={BRAND}   radius={[4, 4, 0, 0]} activeBar={{ stroke: "var(--ring)", strokeWidth: 2, fillOpacity: 1 }} {...activeIndexProps(activeIndex)} />
                <Bar dataKey="returned" fill={CHART_2} radius={[4, 4, 0, 0]} activeBar={{ stroke: "var(--ring)", strokeWidth: 2, fillOpacity: 1 }} {...activeIndexProps(activeIndex)} />
              </BarChart>
            </ChartContainer>
            <ChartLeoPlotInsightOverlay data={barData} xDataKey="program" chartFamily="bar" />
          </div>
          <ChartDataTable caption="Applications by Program" headers={["Program", "New", "Returned"]} rows={barData.map(d => [d.program, d.new, d.returned])} />
        </>
      )}
    </ChartFigure>
  )
}

function GroupedBarLineTrend() {
  return (
    <ChartContainer config={barCfg} className="flex-1 min-h-[180px] w-full">
      <LineChart data={barData} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="program" tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} />
        <YAxis tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} width={28} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={({ payload, verticalAlign }) => <ChartLegendContent payload={payload} verticalAlign={verticalAlign} />} />
        <Line type="monotone" dataKey="new"      stroke={BRAND}   strokeWidth={2} strokeDasharray={chartLineStrokeDash(0)} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="returned" stroke={CHART_2} strokeWidth={2} strokeDasharray={chartLineStrokeDash(1)} dot={{ r: 3 }} />
      </LineChart>
    </ChartContainer>
  )
}

/* ── Stacked Bar ─────────────────────────────────────────────────────────── */
const stackCfg: ChartConfig = {
  approved: { label: "Approved", color: SUCCESS     },
  pending:  { label: "Pending",  color: WARNING     },
  rejected: { label: "Rejected", color: DESTRUCTIVE },
}
const stackData = [
  { month: "Oct", approved: 38, pending: 12, rejected: 4 },
  { month: "Nov", approved: 44, pending: 15, rejected: 6 },
  { month: "Dec", approved: 31, pending: 8,  rejected: 3 },
  { month: "Jan", approved: 52, pending: 18, rejected: 7 },
  { month: "Feb", approved: 60, pending: 14, rejected: 5 },
  { month: "Mar", approved: 68, pending: 20, rejected: 8 },
]

export function StackedBarContent() {
  return (
    <ChartFigure label="Monthly Reviews" summary="Stacked bar chart showing approved, pending and rejected reviews Oct to Mar" dataLength={stackData.length} leoInsight={CHART_GALLERY_LEO_REVIEWS}>
      {(activeIndex) => (
        <>
          <div className="relative w-full min-h-[180px] flex-1">
            <ChartContainer config={stackCfg} className="h-full min-h-[180px] w-full flex-1">
              <BarChart data={stackData} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} />
                <YAxis tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} width={28} />
                <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
                <ChartLegend content={({ payload, verticalAlign }) => <ChartLegendContent payload={payload} verticalAlign={verticalAlign} />} />
                <Bar dataKey="approved" fill={SUCCESS}     stackId="a" activeBar={{ stroke: "var(--ring)", strokeWidth: 2, fillOpacity: 1 }} {...activeIndexProps(activeIndex)} />
                <Bar dataKey="pending"  fill={WARNING}     stackId="a" activeBar={{ stroke: "var(--ring)", strokeWidth: 2, fillOpacity: 1 }} {...activeIndexProps(activeIndex)} />
                <Bar dataKey="rejected" fill={DESTRUCTIVE} stackId="a" radius={[4, 4, 0, 0]} activeBar={{ stroke: "var(--ring)", strokeWidth: 2, fillOpacity: 1 }} {...activeIndexProps(activeIndex)} />
              </BarChart>
            </ChartContainer>
            <ChartLeoPlotInsightOverlay data={stackData} xDataKey="month" insetPct={{ left: 12, right: 4, top: 5, bottom: 18 }} />
          </div>
          <ChartDataTable caption="Monthly Reviews" headers={["Month", "Approved", "Pending", "Rejected"]} rows={stackData.map(d => [d.month, d.approved, d.pending, d.rejected])} />
        </>
      )}
    </ChartFigure>
  )
}

function StackedBarLineTrend() {
  return (
    <div className="relative w-full min-h-[180px] flex-1">
      <ChartContainer config={stackCfg} className="h-full min-h-[180px] w-full flex-1">
        <LineChart data={stackData} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} />
          <YAxis tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} width={28} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={({ payload, verticalAlign }) => <ChartLegendContent payload={payload} verticalAlign={verticalAlign} />} />
          <Line type="monotone" dataKey="approved" stroke={SUCCESS}     strokeWidth={2} strokeDasharray={chartLineStrokeDash(0)} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="pending"  stroke={WARNING}     strokeWidth={2} strokeDasharray={chartLineStrokeDash(1)} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="rejected" stroke={DESTRUCTIVE} strokeWidth={2} strokeDasharray={chartLineStrokeDash(2)} dot={{ r: 3 }} />
        </LineChart>
      </ChartContainer>
      <ChartLeoPlotInsightOverlay data={stackData} xDataKey="month" insetPct={{ left: 12, right: 4, top: 5, bottom: 18 }} />
    </div>
  )
}

/* ── Line ─────────────────────────────────────────────────────────────────── */
const lineCfg: ChartConfig = {
  logins:      { label: "Logins",      color: BRAND   },
  submissions: { label: "Submissions", color: CHART_2 },
  evaluations: { label: "Evaluations", color: CHART_4 },
}
const lineData = [
  { week: "W1", logins: 148, submissions: 42, evaluations: 29 },
  { week: "W2", logins: 162, submissions: 51, evaluations: 35 },
  { week: "W3", logins: 139, submissions: 38, evaluations: 27 },
  { week: "W4", logins: 175, submissions: 63, evaluations: 48 },
  { week: "W5", logins: 182, submissions: 69, evaluations: 52 },
  { week: "W6", logins: 196, submissions: 75, evaluations: 58 },
  { week: "W7", logins: 211, submissions: 82, evaluations: 63 },
  { week: "W8", logins: 204, submissions: 78, evaluations: 60 },
]

const lineDataByPeriod: Record<string, typeof lineData> = {
  "7d":  lineData.slice(-2),
  "30d": lineData.slice(-4),
  "90d": lineData.slice(-6),
  "1y":  lineData,
}

export function LineChartContent({ data = lineData }: { data?: typeof lineData }) {
  return (
    <ChartFigure label="Portal Activity" summary="Line chart showing logins, submissions and evaluations by week" dataLength={data.length} leoInsight={CHART_GALLERY_LEO_LINE}>
      {(activeIndex) => (
        <>
          <div className="relative w-full min-h-[180px] flex-1">
            <ChartContainer config={lineCfg} className="h-full min-h-[180px] w-full">
              <LineChart data={data} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="week"  tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} />
                <YAxis tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} width={36} />
                <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
                <ChartLegend content={({ payload, verticalAlign }) => <ChartLegendContent payload={payload} verticalAlign={verticalAlign} />} />
                <Line type="monotone" dataKey="logins"      stroke={BRAND}   strokeWidth={2} strokeDasharray={chartLineStrokeDash(0)} dot={(props: LineDotRenderProps) => props.index === activeIndex ? <circle key={props.key} cx={props.cx} cy={props.cy} r={5} fill={props.stroke} stroke="var(--ring)" strokeWidth={2} /> : <circle key={props.key} cx={props.cx} cy={props.cy} r={2} fill={props.stroke} />} />
                <Line type="monotone" dataKey="submissions" stroke={CHART_2} strokeWidth={2} strokeDasharray={chartLineStrokeDash(1)} dot={(props: LineDotRenderProps) => props.index === activeIndex ? <circle key={props.key} cx={props.cx} cy={props.cy} r={5} fill={props.stroke} stroke="var(--ring)" strokeWidth={2} /> : <circle key={props.key} cx={props.cx} cy={props.cy} r={2} fill={props.stroke} />} />
                <Line type="monotone" dataKey="evaluations" stroke={CHART_4} strokeWidth={2} strokeDasharray={chartLineStrokeDash(2)} dot={(props: LineDotRenderProps) => props.index === activeIndex ? <circle key={props.key} cx={props.cx} cy={props.cy} r={5} fill={props.stroke} stroke="var(--ring)" strokeWidth={2} /> : <circle key={props.key} cx={props.cx} cy={props.cy} r={2} fill={props.stroke} />} />
              </LineChart>
            </ChartContainer>
            <ChartLeoPlotInsightOverlay data={data} xDataKey="week" chartFamily="line" />
          </div>
          <ChartDataTable caption="Portal Activity" headers={["Week", "Logins", "Submissions", "Evaluations"]} rows={data.map(d => [d.week, d.logins, d.submissions, d.evaluations])} />
        </>
      )}
    </ChartFigure>
  )
}

function LineAreaTrend() {
  return (
    <ChartContainer config={lineCfg} className="flex-1 min-h-[180px] w-full">
      <AreaChart data={lineData} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="gLogin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={BRAND}   stopOpacity={0.3} />
            <stop offset="95%" stopColor={BRAND}   stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="week"  tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} />
        <YAxis tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} width={36} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={({ payload, verticalAlign }) => <ChartLegendContent payload={payload} verticalAlign={verticalAlign} />} />
        <Area key="logins" type="monotone" dataKey="logins"      stroke={BRAND}   fill="url(#gLogin)" strokeWidth={2} dot={false} />
        <Area key="submissions" type="monotone" dataKey="submissions" stroke={CHART_2} fill="none"          strokeWidth={2} dot={false} />
        <Area key="evaluations" type="monotone" dataKey="evaluations" stroke={CHART_4} fill="none"          strokeWidth={2} dot={false} />
      </AreaChart>
    </ChartContainer>
  )
}

/* ── Radial Bar ──────────────────────────────────────────────────────────── */
const radialCfg: ChartConfig = {
  nursing:  { label: "Nursing",     color: BRAND   },
  pt:       { label: "PT",          color: CHART_2 },
  ot:       { label: "OT",          color: SUCCESS },
  pharmacy: { label: "Pharmacy",    color: WARNING },
  social:   { label: "Social Work", color: CHART_4 },
}
const radialData = [
  { name: "nursing",  score: 98, fill: BRAND   },
  { name: "pt",       score: 94, fill: CHART_2 },
  { name: "ot",       score: 91, fill: SUCCESS },
  { name: "pharmacy", score: 87, fill: WARNING },
  { name: "social",   score: 82, fill: CHART_4 },
]

export function RadialBarContent({ data = radialData }: { data?: typeof radialData }) {
  return (
    <ChartFigure label="Compliance Score" summary="Radial bar chart showing compliance scores by program" dataLength={data.length} leoInsight={CHART_GALLERY_LEO_COMPLIANCE}>
      {(activeIndex) => (
        <>
          <div className={cn("relative w-full flex-1", CHART_DASHBOARD_PLOT_MIN_CLASS)}>
            <ChartContainer config={radialCfg} className={cn("h-full w-full", CHART_DASHBOARD_PLOT_MIN_CLASS)}>
              <RadialBarChart data={data} innerRadius="20%" outerRadius="85%"
                startAngle={90} endAngle={-270} barSize={10}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent nameKey="name" hideLabel />} />
                <RadialBar dataKey="score" cornerRadius={5} background={{ fill: "var(--muted)" }} shape={radialLeoSector} activeShape={radialLeoSector} {...activeIndexProps(activeIndex)}>
                  {data.map((d, i) => (
                    <Cell
                      key={d.name}
                      fill={d.fill}
                      opacity={activeIndex !== null && activeIndex !== i ? 0.5 : 1}
                    />
                  ))}
                </RadialBar>
              </RadialBarChart>
            </ChartContainer>
            <ChartLeoPlotInsightOverlay chartFamily="radial" />
          </div>
          <div className="grid grid-cols-1 gap-1 text-xs mt-2 shrink-0">
            {data.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="size-2 rounded-full shrink-0" style={{ background: d.fill }} />
                <span className="text-muted-foreground flex-1">{radialCfg[d.name]?.label}</span>
                <span className="font-semibold tabular-nums">{d.score}%</span>
              </div>
            ))}
          </div>
          <ChartDataTable
            caption="Compliance Score"
            headers={["Program", "Score"]}
            rows={data.map(d => {
              const raw = radialCfg[d.name]?.label ?? d.name
              const label =
                typeof raw === "string" || typeof raw === "number" ? String(raw) : String(d.name)
              return [label, `${d.score}%`] as [string, string]
            })}
          />
        </>
      )}
    </ChartFigure>
  )
}

const radialLineTrendCfg: ChartConfig = {
  score: { label: "Current", color: BRAND   },
  prev:  { label: "Previous", color: CHART_2 },
}

function RadialLineTrend() {
  const data = radialData.map((d, i) => ({
    name: d.name,
    score: d.score,
    prev: d.score - [4, 7, 2, 9, 5][i],
  }))
  return (
    <ChartContainer config={radialLineTrendCfg} className="flex-1 min-h-[180px] w-full">
      <BarChart data={data} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="name" tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} />
        <YAxis domain={[70, 100]} tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} width={32} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={({ payload, verticalAlign }) => <ChartLegendContent payload={payload} verticalAlign={verticalAlign} />} />
        <Bar dataKey="prev"  fill={CHART_2} radius={[4, 4, 0, 0]} opacity={0.5} />
        <Bar dataKey="score" fill={BRAND}   radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}

/** Quota radial — ChartFigure, keyboard tooltip sync, sr-only table (same pattern as RadialBarContent). */
function QuotaRadialGalleryContent({ radial }: { radial: StudentScoreRadial }) {
  const summary =
    `Radial gauge for ${radial.title}. Student score ${formatBandScore(radial.studentScore)}. Class average ${formatBandScore(radial.classAverage)}. Scale ${formatBandScore(radial.scaleMin)} to ${formatBandScore(radial.scaleMax)}. ${radial.caption}.`

  return (
    <ChartFigure label={radial.title} summary={summary} dataLength={1} leoInsight={CHART_GALLERY_LEO_QUOTA}>
      {(activeIndex) => (
        <>
          <div className="relative flex flex-col items-center gap-2">
            <QuotaRadialChartInner radial={radial} activeIndex={activeIndex} />
            <ChartLeoPlotInsightOverlay chartFamily="radial" />
            <p className="text-xs text-muted-foreground tabular-nums">
              Class avg{" "}
              <span className="font-medium text-foreground">{formatBandScore(radial.classAverage)}</span>
              <span className="text-muted-foreground">
                {" "}
                · scale {formatBandScore(radial.scaleMin)}–{formatBandScore(radial.scaleMax)}
              </span>
            </p>
          </div>
          <ChartDataTable
            caption={radial.title}
            headers={["Measure", "Value"]}
            rows={[
              ["Student score", formatBandScore(radial.studentScore)],
              ["Class average", formatBandScore(radial.classAverage)],
              ["Scale", `${formatBandScore(radial.scaleMin)}–${formatBandScore(radial.scaleMax)}`],
            ]}
          />
        </>
      )}
    </ChartFigure>
  )
}

/* ── Horizontal Bar ─────────────────────────────────────────────────────── */
const hBarCfg: ChartConfig = {
  placements: { label: "Placements", color: BRAND },
}
const hBarData = [
  { site: "City Med",      placements: 42 },
  { site: "Westside Hosp", placements: 37 },
  { site: "North Clinic",  placements: 31 },
  { site: "Bay Health",    placements: 28 },
  { site: "Eastview",      placements: 22 },
  { site: "Lakeshore",     placements: 18 },
  { site: "Pinehill",      placements: 14 },
]

const hBarByPeriod: Record<string, typeof hBarData> = {
  "7d":  hBarData.map((d) => ({ ...d, placements: Math.round(d.placements * 0.35) })),
  "30d": hBarData.map((d) => ({ ...d, placements: Math.round(d.placements * 0.6)  })),
  "90d": hBarData,
  "1y":  hBarData.map((d) => ({ ...d, placements: Math.round(d.placements * 4.2)  })),
}

export function HorizontalBarContent({ data = hBarData }: { data?: typeof hBarData }) {
  return (
    <ChartFigure label="Placements by Site" summary="Horizontal bar chart showing placement count by clinical site" dataLength={data.length} leoInsight={CHART_GALLERY_LEO_HORIZONTAL}>
      {(activeIndex) => (
        <>
          <div className="relative w-full min-h-[200px] flex-1">
            <ChartContainer config={hBarCfg} className="h-full min-h-[200px] w-full">
              <BarChart data={data} layout="vertical" margin={{ left: 4, right: 16, top: 4, bottom: 0 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} />
                <YAxis type="category" dataKey="site" tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} width={82} />
                <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
                <Bar dataKey="placements" fill={BRAND} radius={[0, 4, 4, 0]} activeBar={{ stroke: "var(--ring)", strokeWidth: 2, fillOpacity: 1 }} {...activeIndexProps(activeIndex)} />
              </BarChart>
            </ChartContainer>
            <ChartLeoPlotInsightOverlay data={data} xDataKey="site" chartFamily="bar" />
          </div>
          <ChartDataTable caption="Placements by Site" headers={["Site", "Placements"]} rows={data.map(d => [d.site, d.placements])} />
        </>
      )}
    </ChartFigure>
  )
}

function HBarLineTrend() {
  return (
    <ChartContainer config={hBarCfg} className="flex-1 min-h-[200px] w-full">
      <LineChart data={hBarData} margin={{ left: -8, right: 16, top: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="site" tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} />
        <YAxis tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} width={32} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line type="monotone" dataKey="placements" stroke={BRAND} strokeWidth={2} dot={{ r: 4, fill: BRAND }} />
      </LineChart>
    </ChartContainer>
  )
}

/* ── Composed ─────────────────────────────────────────────────────────────── */
const composedCfg: ChartConfig = {
  placements: { label: "Placements",  color: BRAND   },
  capacity:   { label: "Capacity",    color: CHART_3 },
  rate:       { label: "Fill Rate %", color: CHART_4 },
}
const composedData = [
  { month: "Sep", placements: 44, capacity: 60, rate: 73 },
  { month: "Oct", placements: 53, capacity: 65, rate: 82 },
  { month: "Nov", placements: 67, capacity: 80, rate: 84 },
  { month: "Dec", placements: 49, capacity: 70, rate: 70 },
  { month: "Jan", placements: 74, capacity: 85, rate: 87 },
  { month: "Feb", placements: 81, capacity: 90, rate: 90 },
  { month: "Mar", placements: 89, capacity: 95, rate: 94 },
]

export function ComposedChartContent() {
  return (
    <ChartFigure label="Site Capacity vs Fill Rate" summary="Composed chart showing placement volume against site capacity and fill rate percentage" dataLength={composedData.length} leoInsight={CHART_GALLERY_LEO_COMPOSED}>
      {(activeIndex) => (
        <>
          <div className="relative w-full min-h-[180px] flex-1">
            <ChartContainer config={composedCfg} className="h-full min-h-[180px] w-full">
              <ComposedChart data={composedData} margin={{ left: -8, right: 28, top: 4, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} />
                <YAxis yAxisId="left"  tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} width={36} />
                <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false}
                  tick={CHART_AXIS_TICK} width={32} unit="%" domain={[0, 100]} />
                <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
                <ChartLegend content={({ payload, verticalAlign }) => <ChartLegendContent payload={payload} verticalAlign={verticalAlign} />} />
                <Bar  yAxisId="left"  dataKey="capacity"   fill={CHART_3} radius={[4,4,0,0]} opacity={0.45} activeBar={{ stroke: "var(--ring)", strokeWidth: 2, fillOpacity: 1 }} {...activeIndexProps(activeIndex)} />
                <Bar  yAxisId="left"  dataKey="placements" fill={BRAND}   radius={[4,4,0,0]} activeBar={{ stroke: "var(--ring)", strokeWidth: 2, fillOpacity: 1 }} {...activeIndexProps(activeIndex)} />
                <Line yAxisId="right" dataKey="rate"       stroke={CHART_4} strokeWidth={2}
                  dot={(props: LineDotRenderProps) => props.index === activeIndex ? <circle key={props.key} cx={props.cx} cy={props.cy} r={5} fill={props.stroke} stroke="var(--ring)" strokeWidth={2} /> : <circle key={props.key} cx={props.cx} cy={props.cy} r={3} fill={CHART_4} />} type="monotone" />
              </ComposedChart>
            </ChartContainer>
            <ChartLeoPlotInsightOverlay data={composedData} xDataKey="month" chartFamily="bar" />
          </div>
          <ChartDataTable caption="Site Capacity vs Fill Rate" headers={["Month", "Placements", "Capacity", "Fill Rate %"]} rows={composedData.map(d => [d.month, d.placements, d.capacity, `${d.rate}%`])} />
        </>
      )}
    </ChartFigure>
  )
}

function ComposedLineTrend() {
  return (
    <ChartContainer config={composedCfg} className="flex-1 min-h-[180px] w-full">
      <LineChart data={composedData} margin={{ left: -8, right: 28, top: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} />
        <YAxis tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} width={36} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={({ payload, verticalAlign }) => <ChartLegendContent payload={payload} verticalAlign={verticalAlign} />} />
        <Line type="monotone" dataKey="placements" stroke={BRAND}   strokeWidth={2} strokeDasharray={chartLineStrokeDash(0)} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="capacity"   stroke={CHART_3} strokeWidth={2} strokeDasharray={chartLineStrokeDash(1)} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="rate"       stroke={CHART_4} strokeWidth={2} strokeDasharray={chartLineStrokeDash(2)} dot={{ r: 3 }} />
      </LineChart>
    </ChartContainer>
  )
}

/* ── Radar ───────────────────────────────────────────────────────────────── */
const radarCfg: ChartConfig = {
  nursing:  { label: "Nursing", color: BRAND   },
  physical: { label: "PT/OT",   color: CHART_2 },
}
const radarData = [
  { skill: "Clinical",  nursing: 92, physical: 88 },
  { skill: "Comm.",     nursing: 85, physical: 79 },
  { skill: "Critical",  nursing: 78, physical: 84 },
  { skill: "Teamwork",  nursing: 91, physical: 90 },
  { skill: "Ethics",    nursing: 96, physical: 93 },
  { skill: "Technical", nursing: 80, physical: 87 },
]

export function RadarChartContent() {
  return (
    <ChartFigure label="Competency Radar" summary="Radar chart comparing nursing vs PT/OT competency scores across 6 skill dimensions" dataLength={radarData.length} leoInsight={CHART_GALLERY_LEO_RADAR}>
      {(activeIndex) => (
        <>
          <div className="relative w-full min-h-[200px] flex-1">
            <ChartContainer config={radarCfg} className="h-full min-h-[200px] w-full">
              <RadarChart data={radarData} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="skill" tick={CHART_AXIS_TICK} />
                <PolarRadiusAxis angle={30} domain={[60, 100]} tick={CHART_AXIS_TICK} tickCount={3} stroke="var(--border)" />
                <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
                <ChartLegend content={({ payload, verticalAlign }) => <ChartLegendContent payload={payload} verticalAlign={verticalAlign} />} />
                <Radar
                  name="nursing"
                  dataKey="nursing"
                  stroke={BRAND}
                  fill={BRAND}
                  fillOpacity={0.25}
                  strokeWidth={2}
                  activeDot={{ r: 6, stroke: "var(--ring)", strokeWidth: 2 }}
                  dot={(props) => {
                    const payload = props.payload as { skill?: string }
                    const isPeak = payload?.skill === "Ethics"
                    if (!isPeak) {
                      return <circle cx={props.cx} cy={props.cy} r={0} fill="transparent" />
                    }
                    return (
                      <circle
                        cx={props.cx}
                        cy={props.cy}
                        r={4}
                        fill="transparent"
                        data-chart-leo-anchor="peak"
                      />
                    )
                  }}
                />
                <Radar name="physical" dataKey="physical" stroke={CHART_2} fill={CHART_2} fillOpacity={0.2}  strokeWidth={2} activeDot={{ r: 6, stroke: "var(--ring)", strokeWidth: 2 }} />
              </RadarChart>
            </ChartContainer>
            <ChartLeoPlotInsightOverlay chartFamily="default" />
          </div>
          <ChartDataTable caption="Competency Scores" headers={["Skill", "Nursing", "PT/OT"]} rows={radarData.map(d => [d.skill, d.nursing, d.physical])} />
        </>
      )}
    </ChartFigure>
  )
}

function RadarBarTrend() {
  return (
    <ChartContainer config={radarCfg} className="flex-1 min-h-[200px] w-full">
      <BarChart data={radarData} barGap={4} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="skill" tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} />
        <YAxis domain={[60, 100]} tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} width={28} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={({ payload, verticalAlign }) => <ChartLegendContent payload={payload} verticalAlign={verticalAlign} />} />
        <Bar dataKey="nursing"  fill={BRAND}   radius={[4, 4, 0, 0]} />
        <Bar dataKey="physical" fill={CHART_2} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}

/* ── Scatter ─────────────────────────────────────────────────────────────── */
const scatterCfg: ChartConfig = {
  nursing:  { label: "Nursing",  color: BRAND   },
  pt:       { label: "PT",       color: CHART_2 },
  ot:       { label: "OT",       color: SUCCESS },
  pharmacy: { label: "Pharmacy", color: WARNING },
}
const scatterNursing  = [{ x: 80, y: 94, z: 42 }, { x: 65, y: 88, z: 35 }, { x: 55, y: 78, z: 28 }, { x: 90, y: 97, z: 51 }, { x: 70, y: 91, z: 38 }]
const scatterPT       = [{ x: 40, y: 85, z: 22 }, { x: 50, y: 90, z: 27 }, { x: 35, y: 80, z: 18 }, { x: 60, y: 93, z: 31 }]
const scatterOT       = [{ x: 30, y: 88, z: 16 }, { x: 45, y: 92, z: 24 }, { x: 38, y: 84, z: 19 }]
const scatterPharmacy = [{ x: 25, y: 76, z: 12 }, { x: 35, y: 82, z: 17 }, { x: 20, y: 71, z: 9  }]

export function ScatterChartContent() {
  return (
    <div className="relative w-full min-h-[200px] flex-1">
      <ChartContainer config={scatterCfg} className="h-full min-h-[200px] w-full">
        <ScatterChart margin={{ left: -8, right: 16, top: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis type="number" dataKey="x" name="Capacity" tickLine={false} axisLine={false} tick={CHART_AXIS_TICK}
            label={{ value: "Capacity", position: "insideBottom", offset: -2, fontSize: CHART_TICK_FONT_SIZE }} />
          <YAxis type="number" dataKey="y" name="Fill Rate" tickLine={false} axisLine={false}
            tick={CHART_AXIS_TICK} unit="%" domain={[60, 100]} width={38} />
          <ZAxis type="number" dataKey="z" range={[40, 280]} name="Students" />
          <ChartTooltip cursor={{ strokeDasharray: "3 3" }} content={<ChartTooltipContent hideLabel />} />
          <ChartLegend content={({ payload, verticalAlign }) => <ChartLegendContent payload={payload} verticalAlign={verticalAlign} />} />
          <Scatter
            name="nursing"
            data={scatterNursing}
            fill={BRAND}
            fillOpacity={0.75}
            shape={(props) => {
              const payload = props.payload as { x?: number; y?: number }
              const isPeak =
                payload?.x === SCATTER_LEO_PEAK.x && payload?.y === SCATTER_LEO_PEAK.y
              return (
                <circle
                  cx={props.cx}
                  cy={props.cy}
                  r={6}
                  fill={BRAND}
                  fillOpacity={0.75}
                  data-chart-leo-anchor={isPeak ? "peak" : undefined}
                />
              )
            }}
          />
          <Scatter name="pt"       data={scatterPT}       fill={CHART_2} fillOpacity={0.75} />
          <Scatter name="ot"       data={scatterOT}       fill={SUCCESS} fillOpacity={0.75} />
          <Scatter name="pharmacy" data={scatterPharmacy} fill={WARNING} fillOpacity={0.75} />
        </ScatterChart>
      </ChartContainer>
      <ChartLeoPlotInsightOverlay chartFamily="scatter" />
    </div>
  )
}

const scatterLineTrendCfg: ChartConfig = {
  nursing:  { label: "Nursing",  color: BRAND   },
  pt:       { label: "PT",       color: CHART_2 },
}
const scatterLineTrendData = [
  { month: "Oct", nursing: 88, pt: 80 },
  { month: "Nov", nursing: 91, pt: 82 },
  { month: "Dec", nursing: 89, pt: 79 },
  { month: "Jan", nursing: 93, pt: 84 },
  { month: "Feb", nursing: 95, pt: 87 },
  { month: "Mar", nursing: 94, pt: 85 },
]

function ScatterLineTrend() {
  return (
    <ChartContainer config={scatterLineTrendCfg} className="flex-1 min-h-[200px] w-full">
      <LineChart data={scatterLineTrendData} margin={{ left: -8, right: 16, top: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} />
        <YAxis domain={[70, 100]} tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} width={32} unit="%" />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={({ payload, verticalAlign }) => <ChartLegendContent payload={payload} verticalAlign={verticalAlign} />} />
        <Line type="monotone" dataKey="nursing" stroke={BRAND}   strokeWidth={2} strokeDasharray={chartLineStrokeDash(0)} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="pt"      stroke={CHART_2} strokeWidth={2} strokeDasharray={chartLineStrokeDash(1)} dot={{ r: 3 }} />
      </LineChart>
    </ChartContainer>
  )
}

/* ── Funnel ──────────────────────────────────────────────────────────────── */
const funnelCfg: ChartConfig = {
  applied:   { label: "Applied",   color: BRAND   },
  screened:  { label: "Screened",  color: CHART_2 },
  matched:   { label: "Matched",   color: SUCCESS },
  placed:    { label: "Placed",    color: CHART_4 },
  completed: { label: "Completed", color: CHART_5 },
}
const funnelData = [
  { name: "Applied",   value: 320, fill: BRAND   },
  { name: "Screened",  value: 240, fill: CHART_2 },
  { name: "Matched",   value: 175, fill: SUCCESS },
  { name: "Placed",    value: 128, fill: CHART_4 },
  { name: "Completed", value: 98,  fill: CHART_5 },
]
const funnelDataByPeriod: Record<string, typeof funnelData> = {
  "7d":  funnelData.map((d) => ({ ...d, value: Math.round(d.value * 0.08) })),
  "30d": funnelData.map((d) => ({ ...d, value: Math.round(d.value * 0.3)  })),
  "90d": funnelData,
  "1y":  funnelData.map((d) => ({ ...d, value: d.value * 4               })),
}

export function FunnelChartContent({ data = funnelData }: { data?: typeof funnelData }) {
  const summary = `Funnel with ${data.length} stages from ${data[0]?.name ?? ""} to ${data[data.length - 1]?.name ?? ""}.`
  return (
    <ChartFigure label="Application Pipeline" summary={summary} dataLength={data.length} leoInsight={CHART_GALLERY_LEO_FUNNEL}>
      {(activeIndex) => (
        <>
          <div className="relative w-full min-h-[220px] flex-1">
            <ChartContainer config={funnelCfg} className="h-full min-h-[220px] w-full">
              <FunnelChart margin={{ top: 8, right: 32, bottom: 8, left: 32 }}>
                <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent hideLabel />} />
                <Funnel dataKey="value" data={data} isAnimationActive shape={funnelLeoShape}>
                  {data.map((d, i) => (
                    <Cell
                      key={d.name}
                      fill={d.fill}
                      stroke={activeIndex === i ? "var(--ring)" : undefined}
                      strokeWidth={activeIndex === i ? 2 : 0}
                    />
                  ))}
                  <LabelList dataKey="name"  position="right"  style={{ fontSize: CHART_TICK_FONT_SIZE, fill: "var(--foreground)" }} />
                  <LabelList dataKey="value" position="center" style={{ fontSize: CHART_TICK_FONT_SIZE, fontWeight: 600, fill: "var(--foreground)" }} />
                </Funnel>
              </FunnelChart>
            </ChartContainer>
            <ChartLeoPlotInsightOverlay chartFamily="funnel" />
          </div>
          <ChartDataTable caption="Application Pipeline data" headers={["Stage", "Count"]} rows={data.map(d => [d.name, d.value])} />
        </>
      )}
    </ChartFigure>
  )
}

const funnelLineTrendCfg: ChartConfig = {
  applied:   { label: "Applied",   color: BRAND   },
  placed:    { label: "Placed",    color: CHART_4 },
  completed: { label: "Completed", color: CHART_5 },
}
const funnelLineTrendData = [
  { month: "Oct", applied: 210, placed: 95,  completed: 68  },
  { month: "Nov", applied: 245, placed: 108, completed: 82  },
  { month: "Dec", applied: 180, placed: 88,  completed: 64  },
  { month: "Jan", applied: 280, placed: 120, completed: 91  },
  { month: "Feb", applied: 300, placed: 124, completed: 95  },
  { month: "Mar", applied: 320, placed: 128, completed: 98  },
]

function FunnelLineTrend() {
  return (
    <ChartContainer config={funnelLineTrendCfg} className="flex-1 min-h-[220px] w-full">
      <LineChart data={funnelLineTrendData} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} />
        <YAxis tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} width={36} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={({ payload, verticalAlign }) => <ChartLegendContent payload={payload} verticalAlign={verticalAlign} />} />
        <Line type="monotone" dataKey="applied"   stroke={BRAND}   strokeWidth={2} strokeDasharray={chartLineStrokeDash(0)} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="placed"    stroke={CHART_4} strokeWidth={2} strokeDasharray={chartLineStrokeDash(1)} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="completed" stroke={CHART_5} strokeWidth={2} strokeDasharray={chartLineStrokeDash(2)} dot={{ r: 3 }} />
      </LineChart>
    </ChartContainer>
  )
}

export const CHART_GALLERY_LEO_DONUT: ChartLeoInsight = {
  headline: "Confirmed placements dominate the current pipeline",
  explanation:
    "87% of placements are already confirmed, with only 9% pending and 4% in review. This is a healthy distribution suggesting strong conversion from applications to confirmed offers.",
  kind: "spike",
  delta: { value: "+12%", label: "vs. last month" },
  bullets: [
    "Confirmed count has grown steadily across nursing, PT, and OT programs.",
    "Rejection rate remains low at 1% — applications are well-qualified.",
  ],
  anchor: chartLeoPeakAnchor(),
}

export const CHART_GALLERY_LEO_APPLICATIONS: ChartLeoInsight = {
  headline: "Nursing program leads application volume",
  explanation:
    "Nursing consistently attracts the most new applicants, with 34 this period. PT and OT follow closely. Returned applications suggest strong re-engagement.",
  kind: "trend",
  delta: { value: "+8%", label: "new vs. prior period" },
  bullets: [
    "Nursing: 34 new, 22 returned — highest volume and strong re-engagement.",
    "PT and OT: steady demand — balanced load across clinical programs.",
  ],
  anchor: { xValue: "Nursing", yDataKeys: ["new", "returned"], yCombine: "sum" },
}

export const CHART_GALLERY_LEO_LINE: ChartLeoInsight = {
  headline: "Portal activity peaks mid-week",
  explanation:
    "Login, submission, and evaluation activity cluster around Tuesday–Thursday, with weekends showing predictable dips. This pattern is consistent and expected for an academic schedule.",
  kind: "trend",
  delta: { value: "—", label: "stable pattern" },
  bullets: [
    "Logins peak at ~450 on Wednesdays.",
    "Submissions highest Monday–Friday, near-zero on weekends.",
  ],
  anchor: { xValue: "W7", yDataKeys: ["logins"], yValue: 211 },
}

export const CHART_GALLERY_LEO_COMPLIANCE: ChartLeoInsight = {
  headline: "PT/OT programs lead compliance scoring",
  explanation:
    "PT and OT average 88–89% compliance, outpacing Nursing (82%) and Pharmacy (76%). Radiology lags at 71% — may need targeted support.",
  kind: "dip",
  delta: { value: "-8%", label: "Radiology vs. PT/OT" },
  bullets: [
    "PT/OT: consistent excellence across all 6 dimensions.",
    "Pharmacy: scoring gaps in documentation and timeliness.",
    "Radiology: needs support in scheduling and follow-up processes.",
  ],
  anchor: chartLeoPeakAnchor(),
}

export const CHART_GALLERY_LEO_HORIZONTAL: ChartLeoInsight = {
  headline: "Large clinical sites carry most placements",
  explanation:
    "The three largest sites (University Hospital, Metro Clinic, Regional Center) account for 58% of all placements. Mid-size sites are under-utilized.",
  kind: "anomaly",
  delta: { value: "+22%", label: "top 3 sites total" },
  bullets: [
    "University Hospital: 156 placements (28% of total).",
    "Capacity constraints may limit placement growth at smaller sites.",
  ],
  anchor: { xValue: "City Med", yDataKeys: ["placements"] },
}

export const CHART_GALLERY_LEO_COMPOSED: ChartLeoInsight = {
  headline: "Site capacity is healthy; fill rates peak Q2",
  explanation:
    "Most sites run 85–92% capacity utilization. Fill rate (placements / capacity) averages 78%, with spring months (Feb–Mar) consistently hitting 82%+.",
  kind: "spike",
  delta: { value: "+6%", label: "fill rate increase" },
  bullets: [
    "March shows the strongest fill rate at 84%.",
    "Only 2 sites are below 70% utilization — opportunity to rebalance.",
  ],
  anchor: { xValue: "Mar", yDataKeys: ["rate"], yValue: 94 },
}

export const CHART_GALLERY_LEO_RADAR: ChartLeoInsight = {
  headline: "Nursing and PT/OT competencies are well-balanced",
  explanation:
    "Both programs score 80+ on all six dimensions. Nursing edges slightly on patient care; PT/OT lead in mobility and assessment. Ready for expanded placements.",
  kind: "trend",
  delta: { value: "—", label: "strong across programs" },
  bullets: [
    "6-dimension average: Nursing 84%, PT/OT 86%.",
    "Lowest dimension: patient care (Nursing 79%) — room to develop.",
  ],
  anchor: chartLeoPeakAnchor(),
}

export const CHART_GALLERY_LEO_SCATTER: ChartLeoInsight = {
  headline: "Application-to-placement funnel is healthy",
  explanation:
    "Applications feed steadily into offers; offer-to-confirmation conversion hovers around 72%. A small number of dropouts from offer-to-start, typical for clinical placements.",
  kind: "trend",
  delta: { value: "+4%", label: "confirmation rate" },
  bullets: [
    "Applications → Offers: 63% convert (typical for competitive placements).",
    "Offers → Confirmed: 72% accept (strong acceptance rate).",
  ],
  anchor: chartLeoPeakAnchor(),
}

export const CHART_GALLERY_LEO_FUNNEL: ChartLeoInsight = {
  headline: "Funnel shape is expected; strong at top of pipe",
  explanation:
    "4,200 applications narrow to 842 offers (20% funnel rate) and 604 confirmed placements (72% offer acceptance). Losses are proportional—no anomalous drops.",
  kind: "trend",
  delta: { value: "+8%", label: "application volume" },
  bullets: [
    "Application → Offer: drop-off is typical for screening.",
    "Offer → Confirmed: acceptance rate of 72% is healthy.",
  ],
  anchor: chartLeoPeakAnchor(),
}

export const CHART_GALLERY_LEO_QUOTA: ChartLeoInsight = {
  headline: "Student performance tracking and cohort comparison",
  explanation:
    "Track individual student progress against class averages and scale benchmarks. Identify outliers above or below cohort norms.",
  kind: "anomaly",
  bullets: [
    "Performance visualized on a consistent scale across cohorts.",
    "Class average provides immediate context for comparison.",
  ],
  anchor: chartLeoPeakAnchor(),
}

export const CHART_GALLERY_LEO_TRENDS: ChartLeoInsight = {
  headline: "December dips across placements, applications, and reviews",
  explanation:
    "All three series pull back in December—often seasonal (holidays, academic breaks) or a real pipeline stall. Worth confirming whether approvals or site capacity paused.",
  kind: "dip",
  delta: { value: "-24%", label: "vs. November" },
  bullets: [
    "Placements are 18% below the 6-month trailing average.",
    "Reviews dropped sharply in the last 2 weeks of the month.",
    "Same pattern appeared in Dec '24 — seasonal signal is plausible.",
  ],
  anchor: {
    xValue: "Dec",
    yDataKeys: ["placements", "applications", "reviews"],
    yCombine: "max",
  },
}

export const CHART_GALLERY_LEO_REVIEWS: ChartLeoInsight = {
  headline: "December is the low point in review throughput",
  explanation:
    "Totals drop before recovering — worth confirming whether fewer submissions arrived or reviewers were out. Pending and rejected slices still matter once volume returns.",
  kind: "dip",
  delta: { value: "-31%", label: "vs. November total" },
  bullets: [
    "Approved reviews fell from 68 to 47 month-over-month.",
    "Pending queue grew by 9 items — backlog forming.",
    "Two reviewers were OOO for most of the last two weeks.",
  ],
  anchor: {
    xValue: "Dec",
    yDataKeys: ["approved", "pending", "rejected"],
    yCombine: "sum",
  },
}

export const CHART_GALLERY_LEO_WATERFALL: ChartLeoInsight = {
  headline: "New placements drove the largest positive step this cycle",
  explanation:
    "After opening at 120 placements, the New step adds 44 — the biggest single increase before renewals and closures adjust the total to 158.",
  kind: "spike",
  delta: { value: "+37%", label: "vs. opening total" },
  bullets: [
    "New (+44) is the largest upward move in the sequence.",
    "Expired (−22) and Closed (−15) are the main reductions after growth.",
  ],
  anchor: { xValue: "New", yDataKeys: ["total"] },
}

export const CHART_GALLERY_LEO_TREEMAP: ChartLeoInsight = {
  headline: "Nursing occupies the largest share of program volume",
  explanation:
    "The treemap shows Nursing at 34 — roughly one-third of the combined program share — with PT and OT as the next largest tiles.",
  kind: "trend",
  delta: { value: "34", label: "Nursing share" },
  bullets: [
    "Tile area tracks proportional share — Nursing leads by a wide margin.",
    "Smaller programs still appear as readable tiles with labels.",
  ],
  anchor: chartLeoPeakAnchor(),
}

export const CHART_GALLERY_LEO_HEATMAP: ChartLeoInsight = {
  headline: "Wednesday afternoon shows the busiest activity window",
  explanation:
    "Mid-week cells around 12p–2p run hotter than early-morning slots — useful when scheduling coordinator coverage.",
  kind: "spike",
  delta: { value: "53", label: "Wed 2p peak" },
  bullets: [
    "Peak intensity clusters on Wed between 12p and 2p.",
    "Monday mornings stay lighter — good for async review work.",
  ],
  anchor: chartLeoPeakAnchor(),
}

export const CHART_GALLERY_LEO_SANKEY: ChartLeoInsight = {
  headline: "Screening retains most of the application volume",
  explanation:
    "240 applications flow into screening; the widest link is Applied → Screened, with expected tapering through placement stages.",
  kind: "trend",
  delta: { value: "240", label: "Applied → Screened" },
  bullets: [
    "Applied → Screened is the highest-volume transition.",
    "Placed → Completed shows healthy completion conversion.",
  ],
  anchor: chartLeoPeakAnchor(),
}

export const CHART_GALLERY_LEO_TIMELINE: ChartLeoInsight = {
  headline: "Placement completes around day 56 on average",
  explanation:
    "Milestones cluster on a single lane with the longest gap between Placed and Complete — worth monitoring for cycle-time SLAs.",
  kind: "trend",
  delta: { value: "56d", label: "to complete" },
  bullets: [
    "Matched → Placed spans ~13 days in this sample.",
    "Complete lands near day 56 — use for cohort planning.",
  ],
  anchor: { xValue: "56", yDataKeys: ["lane"], yValue: 1 },
}

export const CHART_GALLERY_LEO_BUBBLE: ChartLeoInsight = {
  headline: "West region combines high fill rate with strong student volume",
  explanation:
    "The West bubble sits high on fill rate (82%) with 52 students — an efficient site cluster worth replicating.",
  kind: "spike",
  bullets: [
    "West: 82% fill rate at mid-range capacity.",
    "South shows low fill despite available capacity — investigate demand.",
  ],
  anchor: { xValue: "West", yDataKeys: ["fillRate"], yValue: 82 },
}

export const CHART_GALLERY_LEO_BOXPLOT: ChartLeoInsight = {
  headline: "Nursing scores show the tightest interquartile spread",
  explanation:
    "Nursing’s Q1–Q3 band is narrow relative to Pharm — consistent performance across the cohort.",
  kind: "trend",
  delta: { value: "Q1–Q3", label: "Nursing band" },
  bullets: [
    "Nursing median sits highest in the set.",
    "Pharm shows the widest whisker span — more variance to investigate.",
  ],
  anchor: { xValue: "Nursing", yDataKeys: ["median"] },
}

export const CHART_GALLERY_LEO_RANGE: ChartLeoInsight = {
  headline: "May shows the widest capacity band in the series",
  explanation:
    "The range between low and high capacity peaks in May — plan staffing for the upper band while monitoring June tightening.",
  kind: "trend",
  delta: { value: "91", label: "May high" },
  bullets: [
    "May high band reaches 91 on this scale.",
    "June compresses slightly — confirm whether demand eased.",
  ],
  anchor: { xValue: "May", yDataKeys: ["high"] },
}

export const CHART_GALLERY_LEO_BULLET: ChartLeoInsight = {
  headline: "Compliance is closest to its target of the three KPIs",
  explanation:
    "Compliance at 86% is 6 points under the 92% target — narrower gap than Placements or Reviews.",
  kind: "dip",
  delta: { value: "−6 pts", label: "vs. compliance target" },
  bullets: [
    "Compliance: 86 actual vs. 92 target.",
    "Reviews trail furthest — prioritize review throughput.",
  ],
  anchor: { xValue: "Compliance", yDataKeys: ["value"], yValue: 86 },
}

/** Design-system Chart / ChartCard previews — plot-anchored Leo on monthly bar data. */
export const CATALOG_PREVIEW_CHART_LEO: ChartLeoInsight = {
  headline: "March is the strongest placement month in this window",
  explanation:
    "Placements rose from 42 in January to 74 in March before easing in April. The spike suggests strong spring cohort activity worth sustaining.",
  kind: "spike",
  delta: { value: "+76%", label: "vs. January" },
  bullets: [
    "March leads the five-month series at 74 placements.",
    "April dips slightly; monitor whether offers converted on schedule.",
  ],
  anchor: { xValue: "Mar", yDataKeys: ["placements"] },
}

function ChartRows({ v }: { v: ChartCardVariant }) {
  const isTabs = v === "tabs"
  const isSel  = v === "selector"
  const isMT   = v === "metrics-tabs"
  const isKpi  = v === "kpi-chart"

  return (
    <>
      {/* Row 1 · Area (2/3) + Donut (1/3) */}
      <div className={CHART_DASHBOARD_ROW_GRID_THIRDS_CLASS}>
        <div className={cn(CHART_DASHBOARD_CELL_CLASS, "lg:col-span-2")}>
          {isSel ? (
            <ChartCard
              key="area-sel"
              variant="selector"
              title="Placement Trends"
              description="Filter by time period"
              filterOptions={PERIOD_OPTIONS}
              defaultFilter="90d"
              leoInsight={CHART_GALLERY_LEO_TRENDS}
            >
              {(f) => <AreaSelectorContent filter={f} />}
            </ChartCard>
          ) : (
            <ChartCard
              key="area"
              variant={v}
              title="Placement Trends"
              description="Aug 2025 — Mar 2026"
              leoInsight={CHART_GALLERY_LEO_TRENDS}
              trendContent={<AreaLineTrendContent />}
              tabOptions={isTabs ? [
                { value: "overview", label: "Overview" },
                { value: "by-program", label: "By Program" },
                { value: "trend", label: "Trend" },
              ] : undefined}
              miniMetrics={(isMT || isKpi) ? [
                { label: "Placements", value: "89",  trend: "up"   },
                { label: "Fill rate",  value: "94%", trend: "up"   },
                { label: "Avg. weeks", value: "6.2", trend: "neutral" },
              ] : undefined}>
              {isTabs
                ? (tab: string) => tab === "trend" ? <AreaLineTrendContent /> : <AreaChartContent />
                : <AreaChartContent />}
            </ChartCard>
          )}
        </div>
        <div className={CHART_DASHBOARD_CELL_CLASS}>
          {isSel ? (
            <ChartCard key="donut-sel" variant="selector" title="Placement Status" description="Filter by program"
              filterOptions={PROGRAM_OPTIONS} defaultFilter="all" leoInsight={CHART_GALLERY_LEO_DONUT}>
              {(f) => <DonutChartContent data={donutByProgram[f] ?? donutDataAll} />}
            </ChartCard>
          ) : (
            <ChartCard key="donut" variant={v} title="Placement Status" description="Current cycle distribution"
              leoInsight={CHART_GALLERY_LEO_DONUT}
              trendContent={<DonutBarTrendContent />}
              tabOptions={isTabs ? [
                { value: "current", label: "Current Cycle" },
                { value: "previous", label: "Previous Cycle" },
              ] : undefined}
              miniMetrics={(isMT || isKpi) ? [
                { label: "Placed",   value: "128", trend: "up"   },
                { label: "Pending",  value: "23",  trend: "down" },
              ] : undefined}>
              {isTabs
                ? (tab: string) => <DonutChartContent data={tab === "previous" ? donutByProgram["pt"] : undefined} />
                : <DonutChartContent />}
            </ChartCard>
          )}
        </div>
      </div>

      {/* Row 2 · Grouped Bar + Stacked Bar */}
      <div className={cn(CHART_DASHBOARD_ROW_GRID_CLASS, "md:grid-cols-2")}>
        {isSel ? (
          <ChartCard key="gbar-sel" variant="selector" title="Applications by Program" description="Filter by time period"
            filterOptions={PERIOD_OPTIONS} defaultFilter="30d" leoInsight={CHART_GALLERY_LEO_APPLICATIONS}>
            {() => <GroupedBarContent />}
          </ChartCard>
        ) : (
          <ChartCard key="gbar" variant={v} title="Applications by Program" description="New vs. returning students"
            leoInsight={CHART_GALLERY_LEO_APPLICATIONS}
            trendContent={<GroupedBarLineTrend />}
            tabOptions={isTabs ? [
              { value: "all", label: "All Students" },
              { value: "new", label: "New" },
              { value: "trend", label: "Trend" },
            ] : undefined}
            miniMetrics={(isMT || isKpi) ? [
              { label: "Total",     value: "320", trend: "up"   },
              { label: "New",       value: "78%", trend: "up"   },
              { label: "Returning", value: "22%", trend: "neutral" },
            ] : undefined}>
            {isTabs
              ? (tab: string) => tab === "trend" ? <GroupedBarLineTrend /> : <GroupedBarContent />
              : <GroupedBarContent />}
          </ChartCard>
        )}
        {isSel ? (
          <ChartCard
            key="sbar-sel"
            variant="selector"
            title="Monthly Reviews"
            description="Filter by time period"
            filterOptions={PERIOD_OPTIONS}
            defaultFilter="30d"
            leoInsight={CHART_GALLERY_LEO_REVIEWS}
          >
            {() => <StackedBarContent />}
          </ChartCard>
        ) : (
          <ChartCard
            key="sbar"
            variant={v}
            title="Monthly Reviews"
            description="Review outcomes by status"
            leoInsight={CHART_GALLERY_LEO_REVIEWS}
            trendContent={<StackedBarLineTrend />}
            tabOptions={isTabs ? [
              { value: "status", label: "By Status" },
              { value: "reviewer", label: "By Reviewer" },
              { value: "trend", label: "Trend" },
            ] : undefined}
            miniMetrics={(isMT || isKpi) ? [
              { label: "Approved", value: "68",  trend: "up"   },
              { label: "Pending",  value: "14",  trend: "down" },
              { label: "Rejected", value: "6",   trend: "neutral" },
            ] : undefined}>
            {isTabs
              ? (tab: string) => tab === "trend" ? <StackedBarLineTrend /> : <StackedBarContent />
              : <StackedBarContent />}
          </ChartCard>
        )}
      </div>

      {/* Row 3 · Line (2/3) + Radial (1/3) */}
      <div className={CHART_DASHBOARD_ROW_GRID_THIRDS_CLASS}>
        <div className={cn(CHART_DASHBOARD_CELL_CLASS, "lg:col-span-2")}>
          {isSel ? (
            <ChartCard key="line-sel" variant="selector" title="Weekly Activity" description="Filter by time period"
              filterOptions={PERIOD_OPTIONS} defaultFilter="90d" leoInsight={CHART_GALLERY_LEO_LINE}>
              {(f) => <LineChartContent data={lineDataByPeriod[f] ?? lineData} />}
            </ChartCard>
          ) : (
            <ChartCard key="line" variant={v} title="Weekly Activity" description="Logins, submissions & evaluations"
              leoInsight={CHART_GALLERY_LEO_LINE}
              trendContent={<LineAreaTrend />}
              tabOptions={isTabs ? [
                { value: "weekly", label: "Weekly" },
                { value: "monthly", label: "Monthly" },
                { value: "trend", label: "Trend" },
              ] : undefined}
              miniMetrics={(isMT || isKpi) ? [
                { label: "Logins",      value: "1.2k", trend: "up"   },
                { label: "Submissions", value: "340",  trend: "up"   },
                { label: "Evals",       value: "88",   trend: "neutral" },
              ] : undefined}>
              {isTabs
                ? (tab: string) => tab === "trend" ? <LineAreaTrend /> : <LineChartContent />
                : <LineChartContent />}
            </ChartCard>
          )}
        </div>
        <div className={CHART_DASHBOARD_CELL_CLASS}>
          {isSel ? (
            <ChartCard key="radial-sel" variant="selector" title="Compliance Scores" description="Filter by program"
              filterOptions={PROGRAM_OPTIONS} defaultFilter="all" leoInsight={CHART_GALLERY_LEO_COMPLIANCE}>
              {() => <RadialBarContent />}
            </ChartCard>
          ) : (
            <ChartCard key="radial" variant={v} title="Compliance Scores" description="By program — current cycle"
              leoInsight={CHART_GALLERY_LEO_COMPLIANCE}
              trendContent={<RadialLineTrend />}
              tabOptions={isTabs ? [
                { value: "current", label: "Current" },
                { value: "historical", label: "Historical" },
              ] : undefined}
              miniMetrics={(isMT || isKpi) ? [
                { label: "Avg. score", value: "91%", trend: "up"   },
                { label: "At risk",    value: "3",   trend: "down" },
              ] : undefined}>
              {isTabs
                ? (tab: string) => tab === "historical" ? <RadialLineTrend /> : <RadialBarContent />
                : <RadialBarContent />}
            </ChartCard>
          )}
        </div>
      </div>

      {/* Row 4 · H-Bar (1/3) + Composed (2/3) */}
      <div className={CHART_DASHBOARD_ROW_GRID_THIRDS_CLASS}>
        <div className={CHART_DASHBOARD_CELL_CLASS}>
          {isSel ? (
            <ChartCard key="hbar-sel" variant="selector" title="Top Placement Sites" description="Filter by time period"
              filterOptions={PERIOD_OPTIONS} defaultFilter="90d" leoInsight={CHART_GALLERY_LEO_HORIZONTAL}>
              {(f) => <HorizontalBarContent data={hBarByPeriod[f] ?? hBarData} />}
            </ChartCard>
          ) : (
            <ChartCard key="hbar" variant={v} title="Top Placement Sites" description="Active placements by facility"
              leoInsight={CHART_GALLERY_LEO_HORIZONTAL}
              trendContent={<HBarLineTrend />}
              tabOptions={isTabs ? [
                { value: "by-facility", label: "By Facility" },
                { value: "by-capacity", label: "By Capacity" },
              ] : undefined}
              miniMetrics={(isMT || isKpi) ? [
                { label: "Sites",     value: "7",   trend: "up"   },
                { label: "Capacity",  value: "94%", trend: "up"   },
              ] : undefined}>
              {isTabs
                ? () => <HorizontalBarContent />
                : <HorizontalBarContent />}
            </ChartCard>
          )}
        </div>
        <div className={cn(CHART_DASHBOARD_CELL_CLASS, "lg:col-span-2")}>
          {isSel ? (
            <ChartCard key="composed-sel" variant="selector" title="Placements vs Capacity" description="Filter by time period"
              filterOptions={PERIOD_OPTIONS} defaultFilter="1y" leoInsight={CHART_GALLERY_LEO_COMPOSED}>
              {() => <ComposedChartContent />}
            </ChartCard>
          ) : (
            <ChartCard key="composed" variant={v} title="Placements vs Capacity" description="Monthly fill rate overlay"
              leoInsight={CHART_GALLERY_LEO_COMPOSED}
              trendContent={<ComposedLineTrend />}
              tabOptions={isTabs ? [
                { value: "overlay", label: "Overlay" },
                { value: "comparison", label: "Side by Side" },
                { value: "trend", label: "Trend" },
              ] : undefined}
              miniMetrics={(isMT || isKpi) ? [
                { label: "Fill rate", value: "94%", trend: "up"   },
                { label: "Capacity",  value: "95",  trend: "up"   },
                { label: "Placed",    value: "89",  trend: "up"   },
              ] : undefined}>
              {isTabs
                ? (tab: string) => tab === "trend" ? <ComposedLineTrend /> : <ComposedChartContent />
                : <ComposedChartContent />}
            </ChartCard>
          )}
        </div>
      </div>

      {/* Row 5 · Radar (1/3) + Scatter (2/3) */}
      <div className={CHART_DASHBOARD_ROW_GRID_THIRDS_CLASS}>
        <div className={CHART_DASHBOARD_CELL_CLASS}>
          {isSel ? (
            <ChartCard key="radar-sel" variant="selector" title="Competency Radar" description="Filter by program"
              filterOptions={PROGRAM_OPTIONS} defaultFilter="all" leoInsight={CHART_GALLERY_LEO_RADAR}>
              {() => <RadarChartContent />}
            </ChartCard>
          ) : (
            <ChartCard key="radar" variant={v} title="Competency Radar" description="Avg. scores by skill domain"
              leoInsight={CHART_GALLERY_LEO_RADAR}
              trendContent={<RadarBarTrend />}
              tabOptions={isTabs ? [
                { value: "radar", label: "Radar" },
                { value: "breakdown", label: "Breakdown" },
              ] : undefined}
              miniMetrics={(isMT || isKpi) ? [
                { label: "Avg.",   value: "88%", trend: "up"      },
                { label: "Top",    value: "Clinical", trend: "neutral" },
              ] : undefined}>
              {isTabs
                ? (tab: string) => tab === "breakdown" ? <RadarBarTrend /> : <RadarChartContent />
                : <RadarChartContent />}
            </ChartCard>
          )}
        </div>
        <div className={cn(CHART_DASHBOARD_CELL_CLASS, "lg:col-span-2")}>
          {isSel ? (
            <ChartCard key="scatter-sel" variant="selector" title="Site Performance" description="Filter by program"
              filterOptions={PROGRAM_OPTIONS} defaultFilter="all" leoInsight={CHART_GALLERY_LEO_SCATTER}>
              {() => <ScatterChartContent />}
            </ChartCard>
          ) : (
            <ChartCard key="scatter" variant={v} title="Site Performance" description="Capacity vs. fill rate · bubble = student count"
              leoInsight={CHART_GALLERY_LEO_SCATTER}
              trendContent={<ScatterLineTrend />}
              tabOptions={isTabs ? [
                { value: "scatter", label: "Scatter" },
                { value: "ranking", label: "Ranking" },
                { value: "trend", label: "Trend" },
              ] : undefined}
              miniMetrics={(isMT || isKpi) ? [
                { label: "Sites",    value: "12",  trend: "up"   },
                { label: "Avg. rate", value: "87%", trend: "up"  },
                { label: "Students", value: "320", trend: "up"   },
              ] : undefined}>
              {isTabs
                ? (tab: string) => tab === "trend" ? <ScatterLineTrend /> : <ScatterChartContent />
                : <ScatterChartContent />}
            </ChartCard>
          )}
        </div>
      </div>

      {/* Row 6 · Quota reference charts (band + radial demos) */}
      <div className={CHART_DASHBOARD_ROW_GRID_THIRDS_CLASS}>
        {DASHBOARD_STUDENT_SCORES.metrics.map((m) => (
          <div key={`quota-${m.id}`} className={CHART_DASHBOARD_CELL_CLASS}>
            <ChartCard
              variant={v}
              title={m.label}
              description={m.description ?? DASHBOARD_STUDENT_SCORES.description ?? ""}
              className="overflow-visible"
            >
              <QuotaLinearProgressCardBody
                metric={m}
                suiteContext={DASHBOARD_STUDENT_SCORES.description ?? "Reference data."}
              />
            </ChartCard>
          </div>
        ))}
        <div className={CHART_DASHBOARD_CELL_CLASS}>
          <ChartCard
            key="quota-radial"
            variant={v}
            title={DASHBOARD_STUDENT_SCORES.radial.title}
            description={DASHBOARD_STUDENT_SCORES.description ?? ""}
            className="overflow-visible"
          >
            <QuotaRadialGalleryContent radial={DASHBOARD_STUDENT_SCORES.radial} />
          </ChartCard>
        </div>
      </div>

      {/* Row 7 · Funnel full width */}
      {isSel ? (
        <ChartCard key="funnel-sel" variant="selector" title="Application Pipeline" description="Filter by time period"
          filterOptions={PERIOD_OPTIONS} defaultFilter="90d" leoInsight={CHART_GALLERY_LEO_FUNNEL}>
          {(f) => <FunnelChartContent data={funnelDataByPeriod[f] ?? funnelData} />}
        </ChartCard>
      ) : (
        <ChartCard key="funnel" variant={v} title="Application Pipeline" description="Funnel from application to completed placement"
          leoInsight={CHART_GALLERY_LEO_FUNNEL}
          trendContent={<FunnelLineTrend />}
          miniMetrics={(isMT || isKpi) ? [
            { label: "Applied",   value: "320", trend: "up"   },
            { label: "Placed",    value: "128", trend: "up"   },
            { label: "Completed", value: "98",  trend: "up"   },
            { label: "Drop-off",  value: "69%", trend: "down" },
          ] : undefined}>
          <FunnelChartContent />
        </ChartCard>
      )}
    </>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   Design-system chart type previews (gallery bodies)
   ════════════════════════════════════════════════════════════════════════════ */

export function ChartQuotaRadialPreview() {
  return <QuotaRadialGalleryContent radial={DASHBOARD_STUDENT_SCORES.radial} />
}

/* ════════════════════════════════════════════════════════════════════════════
   Main export
   ════════════════════════════════════════════════════════════════════════════ */

export function ChartsOverview({ variant = "normal" }: { variant?: ChartCardVariant }) {
  return (
    <div className="flex flex-col gap-4 px-4 pb-2 lg:px-6">
      <ChartRows v={variant} />
    </div>
  )
}
