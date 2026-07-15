"use client"

import * as React from "react"
import ReactEChartsCore from "echarts-for-react/lib/core"
import { HeatmapChart } from "echarts/charts"
import {
  GridComponent,
  TooltipComponent,
  VisualMapComponent,
  // ECharts is tree-shaken: an unregistered component makes its option a SILENT no-op. The
  // first pass shipped a `dataZoom` block with no DataZoom*Component registered — no error, no
  // warning, and all 15 rows rendered squeezed into the 8-row viewport as lozenges. Same
  // species as Plot's string-channel trap: the config was accepted and the render disagreed.
  DataZoomInsideComponent,
  DataZoomSliderComponent,
} from "echarts/components"
import * as echarts from "echarts/core"
import { CanvasRenderer } from "echarts/renderers"
import type { EChartsOption } from "echarts"
import type { ECharts } from "echarts/core"

import { ChartLeoPixelPlotInsightOverlay } from "@/components/chart-leo-spotting"
import {
  heatmapCellColor,
  heatmapCellUsesLightText,
  readChartToken,
} from "@/lib/chart-heatmap-scale"
import { cn } from "@/lib/utils"
import { CHART_TICK_FONT_SIZE } from "@/lib/chart-typography"
import type { ChartConfig } from "@/components/ui/chart"

/** ECharts takes numbers, not classes — so the 12px floor arrives as the shared constant. */
const HEATMAP_LABEL_WEIGHT = 600

/** The DS default — preserved exactly for callers that pass no height. */
const DEFAULT_HEATMAP_HEIGHT = 280

echarts.use([
  HeatmapChart,
  GridComponent,
  TooltipComponent,
  VisualMapComponent,
  DataZoomInsideComponent,
  DataZoomSliderComponent,
  CanvasRenderer,
])

export type ChartHeatmapPoint = {
  row: string
  col: string
  x: number
  y: number
  /**
   * `null` = NO DATA, which is a different fact from a low score and must not render as one.
   * The DS copy types this `number` and defaults a missing matrix entry to 0; for count data
   * ("activity") that is fine, but for a 1–5 score a blank term would draw a filled cell
   * labelled "0" — the worst possible score — for a course nobody evaluated. Null cells are
   * drawn as empty ground.
   */
  value: number | null
  cellIndex: number
}

export function buildChartHeatmapPoints(
  rows: readonly string[],
  cols: readonly string[],
  matrix: readonly (readonly (number | null)[])[],
): ChartHeatmapPoint[] {
  const points: ChartHeatmapPoint[] = []
  let cellIndex = 0
  rows.forEach((row, rowIndex) => {
    cols.forEach((col, colIndex) => {
      points.push({
        row,
        col,
        x: colIndex,
        y: rowIndex,
        // `?? null`, not `?? 0` — a hole in the matrix means "not evaluated", and 0 is a score.
        value: matrix[rowIndex]?.[colIndex] ?? null,
        cellIndex,
      })
      cellIndex += 1
    })
  })
  return points
}

function useHeatmapTheme() {
  const [theme, setTheme] = React.useState(() => ({
    brand: "#4f46e5",
    brandLight: "#eef2ff",
    border: "#e5e7eb",
    foreground: "#111827",
    primaryForeground: "#ffffff",
    mutedForeground: "#6b7280",
    card: "#ffffff",
  }))

  React.useEffect(() => {
    const sync = () => {
      const brand = readChartToken("--brand-color", "#4f46e5")
      setTheme({
        brand,
        brandLight: heatmapCellColor(0, 1, brand, readChartToken("--card", "#ffffff")),
        border: readChartToken("--border", "#e5e7eb"),
        foreground: readChartToken("--foreground", "#111827"),
        primaryForeground: readChartToken("--primary-foreground", "#ffffff"),
        mutedForeground: readChartToken("--muted-foreground", "#6b7280"),
        card: readChartToken("--card", "#ffffff"),
      })
    }
    sync()
    const mo = new MutationObserver(sync)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] })
    window.addEventListener("resize", sync)
    return () => {
      mo.disconnect()
      window.removeEventListener("resize", sync)
    }
  }, [])

  return theme
}

function buildHeatmapOption({
  rows,
  cols,
  points,
  maxValue,
  theme,
  activeIndex,
  peakCellIndex,
  valueLabel,
  domain,
  valueFormatter,
  maxVisibleRows,
}: {
  rows: readonly string[]
  cols: readonly string[]
  points: ChartHeatmapPoint[]
  maxValue: number
  theme: ReturnType<typeof useHeatmapTheme>
  activeIndex: number | null
  peakCellIndex: number
  valueLabel: string
  domain?: readonly [number, number]
  valueFormatter?: (v: number) => string
  maxVisibleRows?: number
}): EChartsOption {
  // Default reproduces the original 0→max ramp exactly, so existing callers are untouched.
  const lo = domain?.[0] ?? 0
  const hi = domain?.[1] ?? maxValue

  /**
   * A real scrollbar, inside the plot — not an overflow container around it.
   *
   * Romit: "can't these charts have a scroll bar or expand so I can explore this data more
   * clearly?" Right question, and wrapping the canvas in a scrolling div is the wrong answer:
   * the column headers are PAINTED INTO the canvas, so scrolling the container carries "Fa 24 /
   * Sp 25 / Fa 25" off the top and leaves a grid of numbers with nothing to read them against.
   *
   * ECharts `dataZoom` scrolls the y axis WITHIN the plot: rows move, the header stays. `inside`
   * gives wheel/drag, `slider` draws the visible scrollbar he asked for. `zoomLock` keeps it a
   * scrollbar rather than a zoom — the row height stays constant, so a cell is always a square
   * and the grid never silently rescales under the reader.
   */
  const scrolls = maxVisibleRows != null && rows.length > maxVisibleRows
  const zoom = scrolls
    ? [
        {
          type: "inside" as const,
          yAxisIndex: 0,
          startValue: 0,
          endValue: maxVisibleRows! - 1,
          zoomLock: true,
          // The page must keep scrolling normally; the grid only pans when dragged.
          moveOnMouseWheel: false,
          zoomOnMouseWheel: false,
          moveOnMouseMove: true,
        },
        {
          type: "slider" as const,
          yAxisIndex: 0,
          startValue: 0,
          endValue: maxVisibleRows! - 1,
          zoomLock: true,
          right: 44,
          width: 14,
          showDetail: false,
          brushSelect: false,
          borderColor: "transparent",
          fillerColor: theme.border,
          handleStyle: { color: theme.mutedForeground },
        },
      ]
    : []

  return {
    dataZoom: zoom,
    grid: {
      left: 52,
      // The slider needs its own lane when it exists; without it the bar lands on the cells.
      right: scrolls ? 96 : 72,
      top: 28,
      bottom: 16,
      containLabel: false,
    },
    xAxis: {
      type: "category",
      data: [...cols],
      position: "top",
      axisLine: { lineStyle: { color: theme.border, width: 1 } },
      axisTick: { show: false },
      axisLabel: { color: theme.mutedForeground, fontSize: 12 },
      splitArea: { show: false },
    },
    yAxis: {
      type: "category",
      data: [...rows],
      inverse: true,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: theme.mutedForeground, fontSize: 12 },
      splitArea: { show: false },
    },
    visualMap: {
      min: 0,
      max: maxValue,
      dimension: 2,
      calculable: false,
      orient: "vertical",
      right: 4,
      top: "middle",
      itemHeight: 140,
      itemWidth: 10,
      text: [valueLabel, ""],
      textStyle: { color: theme.mutedForeground, fontSize: 11 },
      inRange: {
        color: [
          heatmapCellColor(0, maxValue, theme.brand, theme.card),
          heatmapCellColor(maxValue, maxValue, theme.brand, theme.card),
        ],
      },
    },
    tooltip: {
      position: "top",
      borderColor: theme.border,
      backgroundColor: theme.card,
      textStyle: { color: theme.foreground, fontSize: 12 },
      formatter: (params: unknown) => {
        const p = params as {
          data?: [number, number, number] | { value?: [number, number, number] }
        }
        const raw = p.data
        const tuple = Array.isArray(raw) ? raw : raw?.value
        const x = tuple?.[0] ?? 0
        const y = tuple?.[1] ?? 0
        const value = tuple?.[2] ?? 0
        const row = rows[y] ?? ""
        const col = cols[x] ?? ""
        return `<span style="font-weight:600">${row} ${col}</span><br/>${valueLabel}: <strong>${value}</strong>`
      },
    },
    series: [
      {
        name: valueLabel,
        type: "heatmap",
        data: points.map((p) => {
          const isActive = activeIndex === p.cellIndex
          const isPeak = p.cellIndex === peakCellIndex

          // NO DATA — empty ground, no fill, no label. ECharts renders "-" as a hole. The
          // alternative (0) would say the course scored zero rather than that it was never
          // evaluated, and on this surface that difference is an accreditation fact.
          if (p.value === null) {
            return {
              value: [p.x, p.y, "-"],
              itemStyle: { color: "transparent", borderColor: theme.card, borderWidth: 4 },
              label: { show: false },
            }
          }

          // Normalised over `domain`, not 0→max. Scores occupy a narrow high band (3.3–4.8);
          // against a 0-based ramp every cell lands between t=0.64 and t=0.88 and the grid reads
          // as one flat shade — a heatmap that answers nothing. Shifting by `lo` spends the full
          // ramp on the range the data actually occupies. Count data passes no domain and keeps
          // the original 0→max behaviour byte for byte.
          const norm = p.value - lo
          const span = hi - lo
          const labelColor = heatmapCellUsesLightText(norm, span)
            ? theme.primaryForeground
            : theme.foreground
          return {
            value: [p.x, p.y, p.value],
            itemStyle: {
              color: heatmapCellColor(norm, span, theme.brand, theme.card),
              borderColor: isPeak
                ? theme.brand
                : isActive
                  ? readChartToken("--ring", theme.brand)
                  : theme.card,
              borderWidth: 4,
              borderRadius: 6,
            },
            label: {
              show: true,
              formatter: valueFormatter ? valueFormatter(p.value) : String(p.value),
              fontSize: CHART_TICK_FONT_SIZE,
              fontWeight: HEATMAP_LABEL_WEIGHT,
              color: labelColor,
            },
          }
        }),
        label: {
          show: true,
        },
        emphasis: {
          focus: "none",
          label: {
            show: true,
          },
          itemStyle: {
            borderColor: readChartToken("--ring", theme.brand),
            borderWidth: 3,
            shadowBlur: 0,
          },
        },
        blur: {
          label: {
            show: true,
          },
        },
      },
    ],
  }
}

export function ChartHeatmap({
  rows,
  cols,
  points,
  config: _config,
  activeIndex = null,
  peakCellIndex,
  valueLabel = "Activity",
  className,
  domain,
  valueFormatter,
  height,
  maxVisibleRows,
}: {
  rows: readonly string[]
  cols: readonly string[]
  points: ChartHeatmapPoint[]
  config: ChartConfig
  activeIndex?: number | null
  peakCellIndex: number
  valueLabel?: string
  className?: string
  /**
   * Colour-ramp range. Omit for count data (0→max, the original behaviour). Pass it when the
   * values sit in a narrow band away from zero — a 1–5 score against a 0-based ramp renders
   * every cell the same shade.
   */
  domain?: readonly [number, number]
  /** Cell label formatter — scores need 2dp; counts want the bare integer. */
  valueFormatter?: (v: number) => string
  /**
   * Plot height. The DS copy hardcodes 280px, which is right for its 5-row example and wrong
   * for anything taller: 15 rows in 280px gives each cell ~14px against a 76px column, so the
   * squares become lozenges and ECharts starts dropping row labels it cannot fit. A grid has to
   * be sized on BOTH axes or it stops being a grid. Omit to keep the 280px default.
   */
  height?: number
}) {
  const resolvedHeight = height ?? DEFAULT_HEATMAP_HEIGHT
  const theme = useHeatmapTheme()
  const chartRef = React.useRef<ReactEChartsCore>(null)
  const plotRef = React.useRef<HTMLDivElement>(null)
  const [leoPos, setLeoPos] = React.useState<{ x: number; y: number } | null>(null)
  // Null cells are excluded — a hole must not drag the ramp's top down, and `Math.max` over a
  // list containing null coerces it to 0 rather than skipping it.
  const maxValue = Math.max(...points.map((p) => p.value).filter((v): v is number => v !== null), 1)
  const peakPoint = points[peakCellIndex]

  const option = React.useMemo(
    () =>
      buildHeatmapOption({
        rows,
        cols,
        points,
        maxValue,
        theme,
        activeIndex,
        peakCellIndex,
        valueLabel,
        domain,
        valueFormatter,
        maxVisibleRows,
      }),
    [rows, cols, points, maxValue, theme, activeIndex, peakCellIndex, valueLabel, domain, valueFormatter, maxVisibleRows],
  )

  const updateLeoPosition = React.useCallback(() => {
    const chart = chartRef.current?.getEchartsInstance()
    const plot = plotRef.current
    if (!chart || !plot || !peakPoint) return
    if (typeof chart.isDisposed === "function" && chart.isDisposed()) return
    const width = chart.getWidth?.() ?? 0
    const height = chart.getHeight?.() ?? 0
    if (width <= 0 || height <= 0) return

    try {
      const pixel = chart.convertToPixel(
        { seriesIndex: 0, xAxisIndex: 0, yAxisIndex: 0 },
        [peakPoint.x, peakPoint.y, peakPoint.value],
      )
      if (!pixel || !Array.isArray(pixel) || pixel.length < 2) return

      const plotRect = plot.getBoundingClientRect()
      const chartDom = chart.getDom()
      const chartRect = chartDom.getBoundingClientRect()
      setLeoPos({
        x: chartRect.left - plotRect.left + pixel[0],
        y: chartRect.top - plotRect.top + pixel[1],
      })
    } catch {
      // ECharts model not ready — wait for `finished` event.
    }
  }, [peakPoint])

  const handleChartReady = React.useCallback(
    (chart: ECharts) => {
      const onFinished = () => updateLeoPosition()
      chart.on("finished", onFinished)
      onFinished()
    },
    [updateLeoPosition],
  )

  React.useEffect(() => {
    const chart = chartRef.current?.getEchartsInstance()
    if (!chart) return

    const onFinished = () => updateLeoPosition()
    chart.on("finished", onFinished)
    const ro = new ResizeObserver(() => updateLeoPosition())
    if (plotRef.current) ro.observe(plotRef.current)

    return () => {
      chart.off("finished", onFinished)
      ro.disconnect()
    }
  }, [updateLeoPosition, option])

  return (
    <div ref={plotRef} className={cn("relative w-full", className)} style={{ minHeight: resolvedHeight }}>
      <ReactEChartsCore
        ref={chartRef}
        echarts={echarts}
        option={option}
        notMerge
        lazyUpdate
        opts={{ renderer: "canvas" }}
        onChartReady={handleChartReady}
        style={{ width: "100%", height: resolvedHeight }}
        /**
         * `aria-hidden`, NOT `aria-label`. ReactEChartsCore renders a bare `<div>`, and a `<div>`
         * has no implicit role, so `aria-label` on it is prohibited — axe flags it serious
         * (`aria-prohibited-attr`), and a screen reader would announce a label attached to
         * nothing. The DS copy ships the aria-label version; this is the same defect PlotFigure
         * already documents for Plot's bare `<g>` elements.
         *
         * The canvas is decorative BY CONSTRUCTION here: `ChartFigure` owns role="application",
         * the accessible name and the arrow-key path, and every chart ships a `ChartDataTable`
         * text equivalent. Nothing is lost by hiding pixels that carry no accessible content.
         */
        aria-hidden="true"
      />
      <ChartLeoPixelPlotInsightOverlay position={leoPos} chartFamily="heatmap" />
    </div>
  )
}
