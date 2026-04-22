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
 *   Size:       text-xs (11px via --text-xs)  with  aria-hidden="true"
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
  XAxis, YAxis, ZAxis,
} from "recharts"
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
import { AskLeoShortcutKbds, useAskLeo } from "@/components/ask-leo-sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { isEditableTarget } from "@/lib/editable-target"
import { chartLineStrokeDash } from "@/lib/chart-line-dash"

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

/** ChartCard tabs no longer force `text-xs` — use default `text-sm` scale and ≥24px hit area. */
const chartCardTabTriggerClass = "min-h-9 px-3 py-2 text-sm gap-2"

function AskLeoButton({ iconOnly = false }: { iconOnly?: boolean }) {
  const { toggle } = useAskLeo()
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="h-7 shrink-0 text-xs gap-1.5 px-2"
          aria-label="Ask Leo about this chart"
          onClick={toggle}
        >
          <i className="fa-duotone fa-solid fa-star-christmas text-xs text-brand" aria-hidden="true" />
          {!iconOnly && <span>Ask Leo</span>}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="flex flex-wrap items-center gap-1.5">
        <span>Ask Leo</span>
        <AskLeoShortcutKbds />
      </TooltipContent>
    </Tooltip>
  )
}

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
  children,
}: {
  label: string
  summary: string
  dataLength: number
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
      {children(activeIndex)}
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
          <CardDescription className="text-xs mt-0.5">{description}</CardDescription>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <AskLeoButton iconOnly={isSelector} />
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

type MiniMetric = { label: string; value: string; trend?: "up" | "down" | "neutral" }

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
}) {
  const [filter, setFilter] = React.useState(
    () => defaultFilter || filterOptions?.[0]?.value || miniMetrics?.[0]?.label || tabOptions?.[0]?.value || ""
  )

  // Sync when defaultFilter or first miniMetric changes (React may reuse across ternary branches)
  React.useEffect(() => {
    const next = defaultFilter || filterOptions?.[0]?.value || miniMetrics?.[0]?.label
    if (next) setFilter(next)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultFilter, miniMetrics?.[0]?.label])

  const handleFilter = (v: string) => { setFilter(v); onFilterChange?.(v) }

  const resolvedChildren =
    typeof children === "function" ? children(filter) : children

  /* ── Default Chart / Trend tabs (no custom tabOptions) ───────────────────── */
  const defaultTabsBlock = (
    <Tabs defaultValue="trend" className="flex flex-col flex-1 min-h-0">
      <div className="px-6 pb-1">
        <TabsList variant="line">
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
      <TabsContent value="chart" className="flex-1 flex flex-col min-h-0 m-0">
        <CardContent className="flex-1 flex flex-col min-h-0 pb-4">
          {resolvedChildren}
        </CardContent>
      </TabsContent>
      <TabsContent value="trend" className="flex-1 flex flex-col min-h-0 m-0">
        <CardContent className="flex-1 flex flex-col min-h-0 pb-4">
          {trendContent ?? resolvedChildren}
        </CardContent>
      </TabsContent>
    </Tabs>
  )

  if (variant === "tabs") {
    /* Custom tab labels (e.g. period picker for key metrics) */
    if (tabOptions && tabOptions.length > 0) {
      const selectedTab = filter || tabOptions[0].value
      return (
        <Card className={`flex flex-col h-full ${className}`} role="figure" aria-label={title}>
          <ChartCardHeader title={title} description={description} variant="normal" />
          <Tabs defaultValue={tabOptions[0].value} value={selectedTab} onValueChange={handleFilter} className="flex flex-col flex-1 min-h-0">
            <div className="px-6 pb-1">
              <TabsList variant="line">
                {tabOptions.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} className={chartCardTabTriggerClass}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            {tabOptions.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="flex-1 flex flex-col min-h-0 m-0">
                <CardContent className="flex-1 flex flex-col min-h-[200px] pb-4">
                  {typeof children === "function" ? children(tab.value) : children}
                </CardContent>
              </TabsContent>
            ))}
          </Tabs>
        </Card>
      )
    }

    return (
      <Card className={`flex flex-col h-full ${className}`} role="figure" aria-label={title}>
        <ChartCardHeader title={title} description={description} variant="normal" />
        {defaultTabsBlock}
      </Card>
    )
  }

  if (variant === "metrics-tabs") {
    const metrics = miniMetrics && miniMetrics.length > 0 ? miniMetrics : null
    const selectedMetric = filter || metrics?.[0]?.label || ""

    return (
      <Card className={`flex flex-col h-full ${className}`} role="figure" aria-label={title}>
        <ChartCardHeader title={title} description={description} variant="normal" />

        {metrics ? (
          /* Metrics ARE the tabs — each metric cell is a clickable TabsTrigger */
          <Tabs value={selectedMetric} onValueChange={handleFilter} className="flex flex-col flex-1 min-h-0">
            <div className="shrink-0 px-2">
              <TabsList
                variant="line"
                className="h-auto w-full gap-0 rounded-none p-0 justify-start !items-end border-b border-border"
              >
                {metrics.map((m) => {
                  const isUp   = m.trend === "up"
                  const isDown = m.trend === "down"
                  return (
                    <TabsTrigger
                      key={m.label}
                      value={m.label}
                      className="h-auto flex-col items-start gap-1 px-3 pt-2 pb-3 rounded-none min-w-0 flex-none -mb-px border-b-2 border-transparent data-active:border-b-foreground after:![opacity:0] opacity-60 data-active:opacity-100"
                    >
                      <span className="text-sm font-normal text-muted-foreground leading-none">{m.label}</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-bold tabular-nums leading-none text-foreground">{m.value}</span>
                        {isUp   && <i className="fa-light fa-arrow-trend-up text-xs text-emerald-600"   aria-hidden="true" />}
                        {isDown && <i className="fa-light fa-arrow-trend-down text-xs text-destructive" aria-hidden="true" />}
                      </div>
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </div>
            {/* All metric tabs show the same chart — tab selection is a context indicator */}
            {metrics.map((m) => (
              <TabsContent key={m.label} value={m.label} className="flex-1 flex flex-col min-h-0 m-0">
                <CardContent className="flex-1 flex flex-col min-h-0 pb-4">
                  {resolvedChildren}
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

    return (
      <Card className={`flex flex-col h-full ${className}`} role="figure" aria-label={title}>
        <ChartCardHeader title={title} description={description} variant="normal" />

        {kpi && (
          <div className="px-6 pb-2 shrink-0">
            <div className="flex items-baseline gap-2.5">
              <span className="text-4xl font-bold tabular-nums tracking-tight text-foreground">
                {kpi.value}
              </span>
              {isUp && (
                <span className="flex items-center gap-1 text-sm font-medium text-emerald-600">
                  <i className="fa-light fa-arrow-trend-up" aria-hidden="true" />
                  <span className="sr-only">trending up</span>
                </span>
              )}
              {isDown && (
                <span className="flex items-center gap-1 text-sm font-medium text-destructive">
                  <i className="fa-light fa-arrow-trend-down" aria-hidden="true" />
                  <span className="sr-only">trending down</span>
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
          </div>
        )}

        <CardContent className="flex-1 flex flex-col min-h-0 pb-4 pt-0">
          {resolvedChildren}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`flex flex-col h-full ${className}`} role="figure" aria-label={title}>
      <ChartCardHeader
        title={title}
        description={description}
        variant={variant}
        filterOptions={filterOptions}
        filter={filter}
        onFilter={handleFilter}
      />
      <CardContent className="flex-1 flex flex-col min-h-0 pb-4">
        {resolvedChildren}
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

function AreaChartContent() {
  return (
    <ChartFigure label="Placement Trends" summary="Multi-line area chart showing placements, applications and reviews from Aug to Mar" dataLength={areaData.length}>
      {(activeIndex) => (
        <>
          <ChartContainer config={areaCfg} className="flex-1 min-h-[180px] w-full">
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
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={36} />
              <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Area key="placements" type="monotone" dataKey="placements"   stroke={BRAND}   fill="url(#gPlace)" strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: "var(--ring)", strokeWidth: 2 }} />
              <Area key="applications" type="monotone" dataKey="applications" stroke={CHART_2} fill="url(#gApps)"  strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: "var(--ring)", strokeWidth: 2 }} />
              <Area key="reviews" type="monotone" dataKey="reviews"      stroke={CHART_4} fill="url(#gRev)"   strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: "var(--ring)", strokeWidth: 2 }} />
            </AreaChart>
          </ChartContainer>
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
          <ChartContainer config={areaCfg} className="flex-1 min-h-[180px] w-full">
            <LineChart data={areaData} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={36} />
              <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line type="monotone" dataKey="placements"   stroke={BRAND}   strokeWidth={2} strokeDasharray={chartLineStrokeDash(0)} dot={(props: any) => props.index === activeIndex ? <circle key={props.key} cx={props.cx} cy={props.cy} r={5} fill={props.stroke} stroke="var(--ring)" strokeWidth={2} /> : <circle key={props.key} cx={props.cx} cy={props.cy} r={2} fill={props.stroke} />} />
              <Line type="monotone" dataKey="applications" stroke={CHART_2} strokeWidth={2} strokeDasharray={chartLineStrokeDash(1)} dot={(props: any) => props.index === activeIndex ? <circle key={props.key} cx={props.cx} cy={props.cy} r={5} fill={props.stroke} stroke="var(--ring)" strokeWidth={2} /> : <circle key={props.key} cx={props.cx} cy={props.cy} r={2} fill={props.stroke} />} />
              <Line type="monotone" dataKey="reviews"      stroke={CHART_4} strokeWidth={2} strokeDasharray={chartLineStrokeDash(2)} dot={(props: any) => props.index === activeIndex ? <circle key={props.key} cx={props.cx} cy={props.cy} r={5} fill={props.stroke} stroke="var(--ring)" strokeWidth={2} /> : <circle key={props.key} cx={props.cx} cy={props.cy} r={2} fill={props.stroke} />} />
            </LineChart>
          </ChartContainer>
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
          <ChartContainer config={areaCfg} className="flex-1 min-h-[180px] w-full">
            <AreaChart data={data} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="gPlace2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={BRAND}   stopOpacity={0.35} />
                  <stop offset="95%" stopColor={BRAND}   stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={36} />
              <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Area key="placements" type="monotone" dataKey="placements"   stroke={BRAND}   fill="url(#gPlace2)" strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: "var(--ring)", strokeWidth: 2 }} />
              <Area key="applications" type="monotone" dataKey="applications" stroke={CHART_2} fill="none"           strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: "var(--ring)", strokeWidth: 2 }} />
              <Area key="reviews" type="monotone" dataKey="reviews"      stroke={CHART_4} fill="none"           strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: "var(--ring)", strokeWidth: 2 }} />
            </AreaChart>
          </ChartContainer>
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

function DonutChartContent({ data = donutDataAll }: { data?: typeof donutDataAll }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <ChartFigure label="Placement Status" summary="Donut chart showing confirmed, pending, rejected and in-review placement distribution" dataLength={data.length}>
      {(activeIndex) => (
        <>
          <ChartContainer config={donutCfg} className="flex-1 min-h-[140px] w-full">
            <PieChart>
              <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent hideLabel />} />
              <Pie data={data} dataKey="value" nameKey="name"
                innerRadius="50%" outerRadius="78%" strokeWidth={2} stroke="var(--card)"
                activeIndex={activeIndex ?? undefined} activeShape={{ strokeWidth: 3, stroke: "var(--ring)" }}>
                {data.map((d) => <Cell key={d.name} fill={d.fill} />)}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-2 shrink-0">
            {data.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: d.fill }} />
                <span className="text-muted-foreground">{donutCfg[d.name]?.label}</span>
                <span className="ml-auto font-medium tabular-nums">
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

/* Donut trend — bar chart version */
function DonutBarTrendContent() {
  const cfg: ChartConfig = {
    confirmed: { label: "Confirmed", color: SUCCESS     },
    pending:   { label: "Pending",   color: WARNING     },
    rejected:  { label: "Rejected",  color: DESTRUCTIVE },
  }
  const data = [
    { month: "Jan", confirmed: 52, pending: 20, rejected: 7 },
    { month: "Feb", confirmed: 60, pending: 18, rejected: 6 },
    { month: "Mar", confirmed: 68, pending: 24, rejected: 9 },
  ]
  return (
    <ChartContainer config={cfg} className="flex-1 min-h-[180px] w-full">
      <BarChart data={data} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={28} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
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

function GroupedBarContent() {
  return (
    <ChartFigure label="Applications by Program" summary="Grouped bar chart showing new and returned applications across 6 programs" dataLength={barData.length}>
      {(activeIndex) => (
        <>
          <ChartContainer config={barCfg} className="flex-1 min-h-[180px] w-full">
            <BarChart data={barData} barGap={4} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="program" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={28} />
              <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="new"      fill={BRAND}   radius={[4, 4, 0, 0]} activeBar={{ stroke: "var(--ring)", strokeWidth: 2, fillOpacity: 1 }} activeIndex={activeIndex ?? undefined} />
              <Bar dataKey="returned" fill={CHART_2} radius={[4, 4, 0, 0]} activeBar={{ stroke: "var(--ring)", strokeWidth: 2, fillOpacity: 1 }} activeIndex={activeIndex ?? undefined} />
            </BarChart>
          </ChartContainer>
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
        <XAxis dataKey="program" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={28} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
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

function StackedBarContent() {
  return (
    <ChartFigure label="Monthly Reviews" summary="Stacked bar chart showing approved, pending and rejected reviews Oct to Mar" dataLength={stackData.length}>
      {(activeIndex) => (
        <>
          <ChartContainer config={stackCfg} className="flex-1 min-h-[180px] w-full">
            <BarChart data={stackData} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={28} />
              <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="approved" fill={SUCCESS}     stackId="a" activeBar={{ stroke: "var(--ring)", strokeWidth: 2, fillOpacity: 1 }} activeIndex={activeIndex ?? undefined} />
              <Bar dataKey="pending"  fill={WARNING}     stackId="a" activeBar={{ stroke: "var(--ring)", strokeWidth: 2, fillOpacity: 1 }} activeIndex={activeIndex ?? undefined} />
              <Bar dataKey="rejected" fill={DESTRUCTIVE} stackId="a" radius={[4, 4, 0, 0]} activeBar={{ stroke: "var(--ring)", strokeWidth: 2, fillOpacity: 1 }} activeIndex={activeIndex ?? undefined} />
            </BarChart>
          </ChartContainer>
          <ChartDataTable caption="Monthly Reviews" headers={["Month", "Approved", "Pending", "Rejected"]} rows={stackData.map(d => [d.month, d.approved, d.pending, d.rejected])} />
        </>
      )}
    </ChartFigure>
  )
}

function StackedBarLineTrend() {
  return (
    <ChartContainer config={stackCfg} className="flex-1 min-h-[180px] w-full">
      <LineChart data={stackData} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={28} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line type="monotone" dataKey="approved" stroke={SUCCESS}     strokeWidth={2} strokeDasharray={chartLineStrokeDash(0)} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="pending"  stroke={WARNING}     strokeWidth={2} strokeDasharray={chartLineStrokeDash(1)} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="rejected" stroke={DESTRUCTIVE} strokeWidth={2} strokeDasharray={chartLineStrokeDash(2)} dot={{ r: 3 }} />
      </LineChart>
    </ChartContainer>
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

function LineChartContent({ data = lineData }: { data?: typeof lineData }) {
  return (
    <ChartFigure label="Portal Activity" summary="Line chart showing logins, submissions and evaluations by week" dataLength={data.length}>
      {(activeIndex) => (
        <>
          <ChartContainer config={lineCfg} className="flex-1 min-h-[180px] w-full">
            <LineChart data={data} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="week"  tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={36} />
              <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line type="monotone" dataKey="logins"      stroke={BRAND}   strokeWidth={2} strokeDasharray={chartLineStrokeDash(0)} dot={(props: any) => props.index === activeIndex ? <circle key={props.key} cx={props.cx} cy={props.cy} r={5} fill={props.stroke} stroke="var(--ring)" strokeWidth={2} /> : <circle key={props.key} cx={props.cx} cy={props.cy} r={2} fill={props.stroke} />} />
              <Line type="monotone" dataKey="submissions" stroke={CHART_2} strokeWidth={2} strokeDasharray={chartLineStrokeDash(1)} dot={(props: any) => props.index === activeIndex ? <circle key={props.key} cx={props.cx} cy={props.cy} r={5} fill={props.stroke} stroke="var(--ring)" strokeWidth={2} /> : <circle key={props.key} cx={props.cx} cy={props.cy} r={2} fill={props.stroke} />} />
              <Line type="monotone" dataKey="evaluations" stroke={CHART_4} strokeWidth={2} strokeDasharray={chartLineStrokeDash(2)} dot={(props: any) => props.index === activeIndex ? <circle key={props.key} cx={props.cx} cy={props.cy} r={5} fill={props.stroke} stroke="var(--ring)" strokeWidth={2} /> : <circle key={props.key} cx={props.cx} cy={props.cy} r={2} fill={props.stroke} />} />
            </LineChart>
          </ChartContainer>
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
        <XAxis dataKey="week"  tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={36} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
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

function RadialBarContent({ data = radialData }: { data?: typeof radialData }) {
  return (
    <ChartFigure label="Compliance Score" summary="Radial bar chart showing compliance scores by program" dataLength={data.length}>
      {(activeIndex) => (
        <>
          <ChartContainer config={radialCfg} className="flex-1 min-h-[140px] w-full">
            <RadialBarChart data={data} innerRadius="20%" outerRadius="85%"
              startAngle={90} endAngle={-270} barSize={10}>
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent nameKey="name" hideLabel />} />
              <RadialBar dataKey="score" cornerRadius={5} background={{ fill: "var(--muted)" }} activeIndex={activeIndex ?? undefined}>
                {data.map((d) => <Cell key={d.name} fill={d.fill} />)}
              </RadialBar>
            </RadialBarChart>
          </ChartContainer>
          <div className="grid grid-cols-1 gap-1 text-xs mt-2 shrink-0">
            {data.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: d.fill }} />
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

function RadialLineTrend() {
  const data = radialData.map((d, i) => ({
    name: d.name,
    score: d.score,
    prev: d.score - [4, 7, 2, 9, 5][i],
  }))
  const cfg: ChartConfig = {
    score: { label: "Current", color: BRAND   },
    prev:  { label: "Previous", color: CHART_2 },
  }
  return (
    <ChartContainer config={cfg} className="flex-1 min-h-[180px] w-full">
      <BarChart data={data} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
        <YAxis domain={[70, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={32} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
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
    <ChartFigure label={radial.title} summary={summary} dataLength={1}>
      {(activeIndex) => (
        <>
          <div className="flex flex-col items-center gap-2">
            <QuotaRadialChartInner radial={radial} activeIndex={activeIndex} />
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

function HorizontalBarContent({ data = hBarData }: { data?: typeof hBarData }) {
  return (
    <ChartFigure label="Placements by Site" summary="Horizontal bar chart showing placement count by clinical site" dataLength={data.length}>
      {(activeIndex) => (
        <>
          <ChartContainer config={hBarCfg} className="flex-1 min-h-[200px] w-full">
            <BarChart data={data} layout="vertical" margin={{ left: 4, right: 16, top: 4, bottom: 0 }}>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="site" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={82} />
              <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
              <Bar dataKey="placements" fill={BRAND} radius={[0, 4, 4, 0]} activeBar={{ stroke: "var(--ring)", strokeWidth: 2, fillOpacity: 1 }} activeIndex={activeIndex ?? undefined} />
            </BarChart>
          </ChartContainer>
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
        <XAxis dataKey="site" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={32} />
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

function ComposedChartContent() {
  return (
    <ChartFigure label="Site Capacity vs Fill Rate" summary="Composed chart showing placement volume against site capacity and fill rate percentage" dataLength={composedData.length}>
      {(activeIndex) => (
        <>
          <ChartContainer config={composedCfg} className="flex-1 min-h-[180px] w-full">
            <ComposedChart data={composedData} margin={{ left: -8, right: 28, top: 4, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left"  tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={36} />
              <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false}
                tick={{ fontSize: 12 }} width={32} unit="%" domain={[0, 100]} />
              <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar  yAxisId="left"  dataKey="capacity"   fill={CHART_3} radius={[4,4,0,0]} opacity={0.45} activeBar={{ stroke: "var(--ring)", strokeWidth: 2, fillOpacity: 1 }} activeIndex={activeIndex ?? undefined} />
              <Bar  yAxisId="left"  dataKey="placements" fill={BRAND}   radius={[4,4,0,0]} activeBar={{ stroke: "var(--ring)", strokeWidth: 2, fillOpacity: 1 }} activeIndex={activeIndex ?? undefined} />
              <Line yAxisId="right" dataKey="rate"       stroke={CHART_4} strokeWidth={2}
                dot={(props: any) => props.index === activeIndex ? <circle key={props.key} cx={props.cx} cy={props.cy} r={5} fill={props.stroke} stroke="var(--ring)" strokeWidth={2} /> : <circle key={props.key} cx={props.cx} cy={props.cy} r={3} fill={CHART_4} />} type="monotone" />
            </ComposedChart>
          </ChartContainer>
          <ChartDataTable caption="Site Capacity vs Fill Rate" headers={["Month", "Placements", "Capacity", "Fill Rate %"]} rows={composedData.map(d => [d.month, d.placements, d.capacity, `${d.rate}%`])} />
        </>
      )}
    </ChartFigure>
  )
}

function ComposedLineTrend() {
  const cfg: ChartConfig = {
    placements: { label: "Placements",  color: BRAND   },
    capacity:   { label: "Capacity",    color: CHART_3 },
    rate:       { label: "Fill Rate %", color: CHART_4 },
  }
  return (
    <ChartContainer config={cfg} className="flex-1 min-h-[180px] w-full">
      <LineChart data={composedData} margin={{ left: -8, right: 28, top: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={36} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
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

function RadarChartContent() {
  return (
    <ChartFigure label="Competency Radar" summary="Radar chart comparing nursing vs PT/OT competency scores across 6 skill dimensions" dataLength={radarData.length}>
      {(activeIndex) => (
        <>
          <ChartContainer config={radarCfg} className="flex-1 min-h-[200px] w-full">
            <RadarChart data={radarData} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[60, 100]} tick={{ fontSize: 10 }} tickCount={3} stroke="var(--border)" />
              <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Radar name="nursing"  dataKey="nursing"  stroke={BRAND}   fill={BRAND}   fillOpacity={0.25} strokeWidth={2} activeDot={{ r: 6, stroke: "var(--ring)", strokeWidth: 2 }} />
              <Radar name="physical" dataKey="physical" stroke={CHART_2} fill={CHART_2} fillOpacity={0.2}  strokeWidth={2} activeDot={{ r: 6, stroke: "var(--ring)", strokeWidth: 2 }} />
            </RadarChart>
          </ChartContainer>
          <ChartDataTable caption="Competency Scores" headers={["Skill", "Nursing", "PT/OT"]} rows={radarData.map(d => [d.skill, d.nursing, d.physical])} />
        </>
      )}
    </ChartFigure>
  )
}

function RadarBarTrend() {
  const cfg: ChartConfig = {
    nursing:  { label: "Nursing", color: BRAND   },
    physical: { label: "PT/OT",   color: CHART_2 },
  }
  return (
    <ChartContainer config={cfg} className="flex-1 min-h-[200px] w-full">
      <BarChart data={radarData} barGap={4} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="skill" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
        <YAxis domain={[60, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={28} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
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

function ScatterChartContent() {
  return (
    <ChartContainer config={scatterCfg} className="flex-1 min-h-[200px] w-full">
      <ScatterChart margin={{ left: -8, right: 16, top: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis type="number" dataKey="x" name="Capacity" tickLine={false} axisLine={false} tick={{ fontSize: 12 }}
          label={{ value: "Capacity", position: "insideBottom", offset: -2, fontSize: 11 }} />
        <YAxis type="number" dataKey="y" name="Fill Rate" tickLine={false} axisLine={false}
          tick={{ fontSize: 12 }} unit="%" domain={[60, 100]} width={38} />
        <ZAxis type="number" dataKey="z" range={[40, 280]} name="Students" />
        <ChartTooltip cursor={{ strokeDasharray: "3 3" }} content={<ChartTooltipContent hideLabel />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Scatter name="nursing"  data={scatterNursing}  fill={BRAND}   fillOpacity={0.75} />
        <Scatter name="pt"       data={scatterPT}       fill={CHART_2} fillOpacity={0.75} />
        <Scatter name="ot"       data={scatterOT}       fill={SUCCESS} fillOpacity={0.75} />
        <Scatter name="pharmacy" data={scatterPharmacy} fill={WARNING} fillOpacity={0.75} />
      </ScatterChart>
    </ChartContainer>
  )
}

function ScatterLineTrend() {
  const cfg: ChartConfig = {
    nursing:  { label: "Nursing",  color: BRAND   },
    pt:       { label: "PT",       color: CHART_2 },
  }
  const data = [
    { month: "Oct", nursing: 88, pt: 80 },
    { month: "Nov", nursing: 91, pt: 82 },
    { month: "Dec", nursing: 89, pt: 79 },
    { month: "Jan", nursing: 93, pt: 84 },
    { month: "Feb", nursing: 95, pt: 87 },
    { month: "Mar", nursing: 94, pt: 85 },
  ]
  return (
    <ChartContainer config={cfg} className="flex-1 min-h-[200px] w-full">
      <LineChart data={data} margin={{ left: -8, right: 16, top: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
        <YAxis domain={[70, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={32} unit="%" />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
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

function FunnelChartContent({ data = funnelData }: { data?: typeof funnelData }) {
  const summary = `Funnel with ${data.length} stages from ${data[0]?.name ?? ""} to ${data[data.length - 1]?.name ?? ""}.`
  return (
    <ChartFigure label="Application Pipeline" summary={summary} dataLength={data.length}>
      {(activeIndex) => (
        <>
          <ChartContainer config={funnelCfg} className="flex-1 min-h-[220px] w-full">
            <FunnelChart margin={{ top: 8, right: 32, bottom: 8, left: 32 }}>
              <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent hideLabel />} />
              <Funnel dataKey="value" data={data} isAnimationActive>
                {data.map((d, i) => (
                  <Cell
                    key={d.name}
                    fill={d.fill}
                    stroke={activeIndex === i ? "var(--ring)" : undefined}
                    strokeWidth={activeIndex === i ? 2 : 0}
                  />
                ))}
                <LabelList dataKey="name"  position="right"  style={{ fontSize: 12, fill: "var(--foreground)" }} />
                <LabelList dataKey="value" position="center" style={{ fontSize: 12, fontWeight: 600, fill: "var(--foreground)" }} />
              </Funnel>
            </FunnelChart>
          </ChartContainer>
          <ChartDataTable caption="Application Pipeline data" headers={["Stage", "Count"]} rows={data.map(d => [d.name, d.value])} />
        </>
      )}
    </ChartFigure>
  )
}

function FunnelLineTrend() {
  const cfg: ChartConfig = {
    applied:   { label: "Applied",   color: BRAND   },
    placed:    { label: "Placed",    color: CHART_4 },
    completed: { label: "Completed", color: CHART_5 },
  }
  const data = [
    { month: "Oct", applied: 210, placed: 95,  completed: 68  },
    { month: "Nov", applied: 245, placed: 108, completed: 82  },
    { month: "Dec", applied: 180, placed: 88,  completed: 64  },
    { month: "Jan", applied: 280, placed: 120, completed: 91  },
    { month: "Feb", applied: 300, placed: 124, completed: 95  },
    { month: "Mar", applied: 320, placed: 128, completed: 98  },
  ]
  return (
    <ChartContainer config={cfg} className="flex-1 min-h-[220px] w-full">
      <LineChart data={data} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={36} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line type="monotone" dataKey="applied"   stroke={BRAND}   strokeWidth={2} strokeDasharray={chartLineStrokeDash(0)} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="placed"    stroke={CHART_4} strokeWidth={2} strokeDasharray={chartLineStrokeDash(1)} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="completed" stroke={CHART_5} strokeWidth={2} strokeDasharray={chartLineStrokeDash(2)} dot={{ r: 3 }} />
      </LineChart>
    </ChartContainer>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   Chart rows — shared across variants
   ════════════════════════════════════════════════════════════════════════════ */

function ChartRows({ v }: { v: ChartCardVariant }) {
  const isTabs = v === "tabs"
  const isSel  = v === "selector"
  const isMT   = v === "metrics-tabs"
  const isKpi  = v === "kpi-chart"

  return (
    <>
      {/* Row 1 · Area (2/3) + Donut (1/3) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 items-stretch">
        <div className="lg:col-span-2 flex flex-col">
          {isSel ? (
            <ChartCard key="area-sel" variant="selector" title="Placement Trends" description="Filter by time period"
              filterOptions={PERIOD_OPTIONS} defaultFilter="90d">
              {(f) => <AreaSelectorContent filter={f} />}
            </ChartCard>
          ) : (
            <ChartCard key="area" variant={v} title="Placement Trends" description="Aug 2025 — Mar 2026"
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
        <div className="flex flex-col">
          {isSel ? (
            <ChartCard key="donut-sel" variant="selector" title="Placement Status" description="Filter by program"
              filterOptions={PROGRAM_OPTIONS} defaultFilter="all">
              {(f) => <DonutChartContent data={donutByProgram[f] ?? donutDataAll} />}
            </ChartCard>
          ) : (
            <ChartCard key="donut" variant={v} title="Placement Status" description="Current cycle distribution"
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

      {/* Row 1b · Quota suite — one ChartCard per metric + radial (ChartFigure on radial only) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 items-stretch">
        {DASHBOARD_STUDENT_SCORES.metrics.map((m) => (
          <ChartCard
            key={`quota-${m.id}`}
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
        ))}
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

      {/* Row 2 · Grouped Bar + Stacked Bar */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 items-stretch">
        {isSel ? (
          <ChartCard key="gbar-sel" variant="selector" title="Applications by Program" description="Filter by time period"
            filterOptions={PERIOD_OPTIONS} defaultFilter="30d">
            {() => <GroupedBarContent />}
          </ChartCard>
        ) : (
          <ChartCard key="gbar" variant={v} title="Applications by Program" description="New vs. returning students"
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
          <ChartCard key="sbar-sel" variant="selector" title="Monthly Reviews" description="Filter by time period"
            filterOptions={PERIOD_OPTIONS} defaultFilter="30d">
            {() => <StackedBarContent />}
          </ChartCard>
        ) : (
          <ChartCard key="sbar" variant={v} title="Monthly Reviews" description="Review outcomes by status"
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
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 items-stretch">
        <div className="lg:col-span-2 flex flex-col">
          {isSel ? (
            <ChartCard key="line-sel" variant="selector" title="Weekly Activity" description="Filter by time period"
              filterOptions={PERIOD_OPTIONS} defaultFilter="90d">
              {(f) => <LineChartContent data={lineDataByPeriod[f] ?? lineData} />}
            </ChartCard>
          ) : (
            <ChartCard key="line" variant={v} title="Weekly Activity" description="Logins, submissions & evaluations"
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
        <div className="flex flex-col">
          {isSel ? (
            <ChartCard key="radial-sel" variant="selector" title="Compliance Scores" description="Filter by program"
              filterOptions={PROGRAM_OPTIONS} defaultFilter="all">
              {() => <RadialBarContent />}
            </ChartCard>
          ) : (
            <ChartCard key="radial" variant={v} title="Compliance Scores" description="By program — current cycle"
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
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 items-stretch">
        <div className="flex flex-col">
          {isSel ? (
            <ChartCard key="hbar-sel" variant="selector" title="Top Placement Sites" description="Filter by time period"
              filterOptions={PERIOD_OPTIONS} defaultFilter="90d">
              {(f) => <HorizontalBarContent data={hBarByPeriod[f] ?? hBarData} />}
            </ChartCard>
          ) : (
            <ChartCard key="hbar" variant={v} title="Top Placement Sites" description="Active placements by facility"
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
        <div className="lg:col-span-2 flex flex-col">
          {isSel ? (
            <ChartCard key="composed-sel" variant="selector" title="Placements vs Capacity" description="Filter by time period"
              filterOptions={PERIOD_OPTIONS} defaultFilter="1y">
              {() => <ComposedChartContent />}
            </ChartCard>
          ) : (
            <ChartCard key="composed" variant={v} title="Placements vs Capacity" description="Monthly fill rate overlay"
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
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 items-stretch">
        <div className="flex flex-col">
          {isSel ? (
            <ChartCard key="radar-sel" variant="selector" title="Competency Radar" description="Filter by program"
              filterOptions={PROGRAM_OPTIONS} defaultFilter="all">
              {() => <RadarChartContent />}
            </ChartCard>
          ) : (
            <ChartCard key="radar" variant={v} title="Competency Radar" description="Avg. scores by skill domain"
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
        <div className="lg:col-span-2 flex flex-col">
          {isSel ? (
            <ChartCard key="scatter-sel" variant="selector" title="Site Performance" description="Filter by program"
              filterOptions={PROGRAM_OPTIONS} defaultFilter="all">
              {() => <ScatterChartContent />}
            </ChartCard>
          ) : (
            <ChartCard key="scatter" variant={v} title="Site Performance" description="Capacity vs. fill rate · bubble = student count"
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

      {/* Row 6 · Funnel full width */}
      {isSel ? (
        <ChartCard key="funnel-sel" variant="selector" title="Application Pipeline" description="Filter by time period"
          filterOptions={PERIOD_OPTIONS} defaultFilter="90d">
          {(f) => <FunnelChartContent data={funnelDataByPeriod[f] ?? funnelData} />}
        </ChartCard>
      ) : (
        <ChartCard key="funnel" variant={v} title="Application Pipeline" description="Funnel from application to completed placement"
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
   Main export
   ════════════════════════════════════════════════════════════════════════════ */

export function ChartsOverview({ variant = "normal" }: { variant?: ChartCardVariant }) {
  return (
    <div className="flex flex-col gap-4 px-4 pb-2 lg:px-6">
      <ChartRows v={variant} />
    </div>
  )
}
