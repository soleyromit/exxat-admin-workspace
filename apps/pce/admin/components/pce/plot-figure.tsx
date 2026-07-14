'use client'

/**
 * Observable Plot ↔ Exxat DS bridge.
 *
 * Why Plot and not another recharts chart: the analytics vocabulary this product needs
 * (Cleveland dot with a median rule, dot-on-distribution, dumbbell, regression band,
 * faceted small multiples) are *channels* in a grammar of graphics and bespoke work in a
 * component charting library. VIZ-007 makes small multiples the mandated default; `fx`/`fy`
 * makes the mandated thing the cheap thing, with shared scales, instead of hand-instantiating
 * N chart instances (which the DS chart audit already flagged as an N-ResizeObserver problem).
 *
 * What does NOT change: the DS chart identity. Every Plot chart still renders inside
 * `ChartCard` → `ChartFigure` → (this) → `ChartDataTable`, with a Leo insight anchored to a
 * real data point. The shell is renderer-agnostic — `chart-heatmap.tsx` already proves a
 * non-recharts engine renders inside it.
 *
 * Tokens: Plot resolves color channels through d3-color, which cannot parse `var(--token)`
 * — it would silently treat the string as a *field name*. So tokens are resolved to concrete
 * colors via `readChartToken` (the same helper the DS ECharts heatmap uses) and re-resolved
 * on theme change through a MutationObserver on documentElement.
 */

import * as React from 'react'
import * as Plot from '@observablehq/plot'
import { ChartLeoPixelPlotInsightOverlay } from '@/components/chart-leo-spotting'
import type { ChartLeoSpottingFamily } from '@/lib/chart-leo-spotting'
import { readChartToken } from '@/lib/chart-heatmap-scale'
import { CHART_TICK_FONT_SIZE } from '@/lib/chart-typography'
import { cn } from '@/lib/utils'

/** DS tokens resolved to concrete colors — Plot cannot consume `var(--token)`. */
export interface PlotTheme {
  foreground: string
  mutedForeground: string
  border: string
  card: string
  brand: string
  /** --chart-1 … --chart-5, in order. Series color ramp (VIZ-003). */
  series: string[]
  /** Below-threshold. Amber, NEVER red (VIZ-004, Aarti). */
  warn: string
  /** Above-threshold / healthy. */
  good: string
  /** Non-text state indicators need 3:1 (A11Y-021) — --border alone is ~1.2:1 and fails. */
  rule: string
}

const FALLBACK: PlotTheme = {
  foreground: '#111827',
  mutedForeground: '#6b7280',
  border: '#e5e7eb',
  card: '#ffffff',
  brand: '#4f46e5',
  series: ['#4f46e5', '#0ea5e9', '#14b8a6', '#f59e0b', '#8b5cf6'],
  warn: '#f59e0b',
  good: '#14b8a6',
  rule: '#6b7280',
}

/** Resolve DS tokens → colors, re-resolving when the theme class flips. */
export function usePlotTheme(): PlotTheme {
  const [theme, setTheme] = React.useState<PlotTheme>(FALLBACK)

  React.useEffect(() => {
    const sync = () => {
      setTheme({
        foreground: readChartToken('--foreground', FALLBACK.foreground),
        mutedForeground: readChartToken('--muted-foreground', FALLBACK.mutedForeground),
        border: readChartToken('--border', FALLBACK.border),
        card: readChartToken('--card', FALLBACK.card),
        brand: readChartToken('--brand-color', FALLBACK.brand),
        series: [
          readChartToken('--chart-1', FALLBACK.series[0]!),
          readChartToken('--chart-2', FALLBACK.series[1]!),
          readChartToken('--chart-3', FALLBACK.series[2]!),
          readChartToken('--chart-4', FALLBACK.series[3]!),
          readChartToken('--chart-5', FALLBACK.series[4]!),
        ],
        // --chart-4 is the DS amber token and already ships as the below-threshold fill at
        // bullet-gauge.tsx. The anti-patterns doc bans *ad-hoc oklch* amber, not amber.
        warn: readChartToken('--chart-4', FALLBACK.warn),
        good: readChartToken('--chart-2', FALLBACK.good),
        // --muted-foreground, not --border: a reference line IS the state indicator, and
        // WCAG 1.4.11 needs 3:1 for non-text. A11Y-021.
        rule: readChartToken('--muted-foreground', FALLBACK.rule),
      })
    }
    sync()
    const mo = new MutationObserver(sync)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] })
    return () => mo.disconnect()
  }, [])

  return theme
}

/** Scale accessors Plot exposes on the rendered node — used to anchor Leo on a real point. */
export interface PlotScales {
  x?: (v: unknown) => number | undefined
  y?: (v: unknown) => number | undefined
}

export interface PlotFigureProps {
  /**
   * Build the Plot spec. Receives resolved tokens and the measured width so the chart is
   * responsive without a second ResizeObserver per series.
   */
  spec: (theme: PlotTheme, width: number) => Plot.PlotOptions
  height: number
  className?: string
  /**
   * Called after each render with the live scale functions, so the caller can convert a data
   * value to a pixel position for `ChartLeoPixelPlotInsightOverlay`.
   */
  onScales?: (scales: PlotScales, rect: { width: number; height: number }) => void
  /**
   * Data values to pin the Leo marker to. Plot exposes `plot.scale('x').apply(v)`, so the
   * marker lands on a REAL data point rather than a guessed pixel — which is the whole
   * contract of the Leo plot-spotting pattern.
   *
   * Requires an ancestor `ChartLeoInsightOverlay` (i.e. `ChartCard leoInsight={…}`) to supply
   * the insight; without one the marker renders nothing.
   */
  leoAnchor?: { x: unknown; y: unknown }
  /** Marker lift is tuned per chart family — a dot needs less clearance than a bar. */
  leoFamily?: ChartLeoSpottingFamily
}

/**
 * Renders an Observable Plot spec into the DOM and keeps it sized to its container.
 *
 * Plot is imperative — `Plot.plot()` returns a detached SVG node — so it is mounted through a
 * ref rather than composed as React children. The node is fully replaced on each render;
 * Plot has no diffing model and re-creating a small SVG is cheaper than reconciling one.
 */
export function PlotFigure({
  spec,
  height,
  className,
  onScales,
  leoAnchor,
  leoFamily = 'scatter',
}: PlotFigureProps) {
  const holder = React.useRef<HTMLDivElement>(null)
  const [width, setWidth] = React.useState(0)
  const [leoPos, setLeoPos] = React.useState<{ x: number; y: number } | null>(null)
  const theme = usePlotTheme()

  // Measure first — Plot needs an explicit width; it has no percentage layout.
  React.useEffect(() => {
    const el = holder.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0
      setWidth((prev) => (Math.abs(prev - w) < 1 ? prev : w))
    })
    ro.observe(el)
    setWidth(el.getBoundingClientRect().width)
    return () => ro.disconnect()
  }, [])

  React.useEffect(() => {
    const el = holder.current
    if (!el || width <= 0) return

    const chart = Plot.plot({
      width,
      height,
      style: {
        background: 'transparent',
        // The `style` block is plain CSS on the SVG element, so `var(--token)` resolves
        // natively here — unlike mark channels, which go through d3-color and must be
        // pre-resolved. Keeping the token means the base text colour also follows a theme
        // switch on its own, and no hex lands in an inline style (which the DS conformance
        // scan flags as `hardcoded-color`, correctly).
        color: 'var(--muted-foreground)',
        // 12px is the product floor — never smaller, in any chart, per the DS type rules.
        fontSize: `${CHART_TICK_FONT_SIZE}px`,
        fontFamily: 'inherit',
        overflow: 'visible',
      },
      ...spec(theme, width),
    })

    /**
     * Plot tags every mark group with `aria-label` on a bare `<g>`. A `<g>` has no implicit
     * role, so `aria-label` on it is prohibited (axe `aria-prohibited-attr`, serious — 32
     * nodes on this page alone). The chart is not the accessible artefact here: `ChartFigure`
     * owns `role="application"` + the label + arrow-key navigation, and every chart ships a
     * `ChartDataTable` sr-only equivalent. So the SVG is decorative by construction.
     */
    chart.setAttribute('aria-hidden', 'true')
    chart.removeAttribute('aria-label')

    el.replaceChildren(chart)

    const xScale = chart.scale?.('x')
    const yScale = chart.scale?.('y')

    if (onScales) {
      onScales(
        {
          x: xScale?.apply as ((v: unknown) => number | undefined) | undefined,
          y: yScale?.apply as ((v: unknown) => number | undefined) | undefined,
        },
        { width, height },
      )
    }

    // Resolve the Leo anchor through the live scales — a real data point, not a guess.
    if (leoAnchor && xScale?.apply && yScale?.apply) {
      const px = xScale.apply(leoAnchor.x as never) as number | undefined
      const py = yScale.apply(leoAnchor.y as never) as number | undefined
      setLeoPos(
        Number.isFinite(px) && Number.isFinite(py)
          ? { x: px as number, y: py as number }
          : null,
      )
    } else {
      setLeoPos(null)
    }

    return () => chart.remove()
  }, [spec, height, width, theme, onScales, leoAnchor])

  return (
    <div className={cn('relative w-full', className)}>
      <div ref={holder} className="w-full" style={{ minHeight: height }} />
      {leoPos && <ChartLeoPixelPlotInsightOverlay position={leoPos} chartFamily={leoFamily} />}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   Shared spec fragments — so every chart in the product reads as one system
   rather than five people's defaults.
   ──────────────────────────────────────────────────────────────────────────── */

/** Axis defaults: no chart junk, ticks in muted, no domain line. DS-009 strips decoration. */
export function axisDefaults(theme: PlotTheme) {
  return {
    stroke: theme.mutedForeground,
    strokeOpacity: 0,
    tickSize: 0,
    tickPadding: 8,
    fontSize: CHART_TICK_FONT_SIZE,
  } as const
}

/** Faint horizontal gridlines only. Vertical grids add noise on a categorical axis. */
export function gridMark(theme: PlotTheme) {
  return Plot.gridY({ stroke: theme.border, strokeOpacity: 1, strokeDasharray: '2,4' })
}

/**
 * A benchmark line plus its label, drawn ON the plot.
 * VIZ-002 and Aarti both: "averages drawn ON viz, not in prose."
 */
export function benchmarkRule(theme: PlotTheme, value: number, label: string, axis: 'x' | 'y' = 'y') {
  const rule = axis === 'y' ? Plot.ruleY([value], { stroke: theme.rule, strokeDasharray: '4,4' }) : Plot.ruleX([value], { stroke: theme.rule, strokeDasharray: '4,4' })
  const text =
    axis === 'y'
      ? Plot.text([label], {
          y: value,
          frameAnchor: 'right',
          dy: -8,
          dx: -2,
          fill: theme.mutedForeground,
          fontSize: CHART_TICK_FONT_SIZE,
          textAnchor: 'end',
        })
      : Plot.text([label], {
          x: value,
          frameAnchor: 'top',
          dy: -2,
          dx: 4,
          fill: theme.mutedForeground,
          fontSize: CHART_TICK_FONT_SIZE,
          textAnchor: 'start',
        })
  return [rule, text]
}

/** Score → color. Amber below threshold, never red (VIZ-004). */
export function scoreColor(theme: PlotTheme, value: number, threshold: number): string {
  return value < threshold ? theme.warn : theme.brand
}
