"use client"

/**
 * charts-core — ChartCard, ChartFigure, ChartDataTable shells + their minimal deps.
 *
 * This module deliberately carries ZERO gallery/demo code so that hub dashboards
 * (library, data-view, placements, etc.) that only need the chart frame can import
 * from here without pulling in the full gallery bundle.
 *
 * The gallery wiring lives in `charts-overview.tsx` which re-exports everything
 * from this module for back-compat.
 */

import * as React from "react"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsTriggerIcon,
  TabsTriggerLabel,
  TabsContent,
} from "@/components/ui/tabs"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { AskLeoButton } from "@/components/ask-leo-button"
import { isEditableTarget } from "@/lib/editable-target"
import { cn } from "@/lib/utils"
import { metricTrendTone, type MetricTrendPolarity } from "@/components/key-metrics"
import {
  type ChartLeoInsight,
  type ChartLeoInsightAnchor,
  type ChartLeoInsightKind,
} from "@/components/leo-insight-indicator"
import {
  ChartLeoInsightOverlay,
  ChartLeoPlotInsightOverlay,
  ChartLeoPixelPlotInsightOverlay,
} from "@/components/chart-leo-spotting"

/* ── Re-export Leo types + components so callers can import from one place ── */
export type { ChartLeoInsight, ChartLeoInsightAnchor, ChartLeoInsightKind }
export { ChartLeoPlotInsightOverlay, ChartLeoInsightOverlay, ChartLeoPixelPlotInsightOverlay }

/* ════════════════════════════════════════════════════════════════════════════
   Types
   ════════════════════════════════════════════════════════════════════════════ */

export type ChartCardVariant = "normal" | "tabs" | "selector" | "metrics-tabs" | "kpi-chart"

export type MiniMetric = {
  label: string
  value: string
  trend?: "up" | "down" | "neutral"
  /** Same semantics as `MetricItem.trendPolarity` on `KeyMetrics`. */
  trendPolarity?: MetricTrendPolarity
}

/* ════════════════════════════════════════════════════════════════════════════
   ChartDataTable — Screen-reader data fallback for charts
   ════════════════════════════════════════════════════════════════════════════ */

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

/* ════════════════════════════════════════════════════════════════════════════
   ChartFigure — Keyboard-focusable chart region
   ════════════════════════════════════════════════════════════════════════════ */

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

/* ════════════════════════════════════════════════════════════════════════════
   ChartCard — reusable chart frame (normal | tabs | selector | metrics-tabs | kpi-chart)
   ════════════════════════════════════════════════════════════════════════════ */

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
  tabOptions: { value: string; label: string; icon?: string }[] | undefined,
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
  /**
   * "tabs" variant: override the default Chart/Trend tabs with custom options.
   * The selected value is passed to the children function.
   *
   * Pass a Font Awesome name (`fa-chart-line`) in `icon` wherever the option has
   * one, and the row can drop inactive labels before it starts moving whole
   * options into the overflow menu. Optional because these tabs are often a
   * data slice rather than a destination, and no glyph tells "By status" apart
   * from "By facility" — such a row is better shedding whole tabs to the menu,
   * which is what it does when the icon is absent.
   */
  tabOptions?: { value: string; label: string; icon?: string }[]
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
        {/* A chart card is often the narrowest thing on a dashboard, so the row
            starts shedding inactive labels to the overflow menu very early.
            Using TabsTriggerIcon + TabsTriggerLabel instead of plain text gives
            the row the glyph it needs to represent a tab without a visible label. */}
        <TabsList
          ariaLabel={`${title} view`}
          variant="line"
          className={chartCardLineTabsListClass}
        >
          <TabsTrigger value="chart" className={chartCardTabTriggerClass}>
            <TabsTriggerIcon>
              <i className="fa-light fa-chart-bar text-sm" aria-hidden="true" />
            </TabsTriggerIcon>
            <TabsTriggerLabel>Chart</TabsTriggerLabel>
          </TabsTrigger>
          <TabsTrigger value="trend" className={chartCardTabTriggerClass}>
            <TabsTriggerIcon>
              <i className="fa-light fa-chart-line text-sm" aria-hidden="true" />
            </TabsTriggerIcon>
            <TabsTriggerLabel>Trend</TabsTriggerLabel>
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
              {/* Caller-supplied labels of unknown length in a card that is
                  often the narrowest thing on a dashboard. */}
              <TabsList
                ariaLabel={`${title} view`}
                variant="line"
                className={chartCardLineTabsListClass}
              >
                {tabOptions.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} className={chartCardTabTriggerClass}>
                    {tab.icon ? (
                      <TabsTriggerIcon>
                        <i className={cn("fa-light", tab.icon, "text-sm")} aria-hidden="true" />
                      </TabsTriggerIcon>
                    ) : null}
                    <TabsTriggerLabel>{tab.label}</TabsTriggerLabel>
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
              {/* A metric cell is far wider than a label, so three of them clip
                  a card long before a normal tab row would. */}
              <TabsList
                ariaLabel={`${title} metric`}
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
                        ? "text-destructive-ink"
                        : "text-muted-foreground"
                  const downClass =
                    tone === "positive"
                      ? "text-emerald-600"
                      : tone === "negative"
                        ? "text-destructive-ink"
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
          ? "text-destructive-ink"
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
