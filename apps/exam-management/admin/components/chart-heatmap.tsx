"use client"

import * as React from "react"
import ReactEChartsCore from "echarts-for-react/lib/core"
import { HeatmapChart } from "echarts/charts"
import {
  GridComponent,
  TooltipComponent,
  VisualMapComponent,
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
import type { ChartConfig } from "@/components/ui/chart"

echarts.use([HeatmapChart, GridComponent, TooltipComponent, VisualMapComponent, CanvasRenderer])

export type ChartHeatmapPoint = {
  row: string
  col: string
  x: number
  y: number
  value: number
  cellIndex: number
}

export function buildChartHeatmapPoints(
  rows: readonly string[],
  cols: readonly string[],
  matrix: readonly (readonly number[])[],
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
        value: matrix[rowIndex]?.[colIndex] ?? 0,
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
}: {
  rows: readonly string[]
  cols: readonly string[]
  points: ChartHeatmapPoint[]
  maxValue: number
  theme: ReturnType<typeof useHeatmapTheme>
  activeIndex: number | null
  peakCellIndex: number
  valueLabel: string
}): EChartsOption {
  return {
    grid: {
      left: 52,
      right: 72,
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
          const labelColor = heatmapCellUsesLightText(p.value, maxValue)
            ? theme.primaryForeground
            : theme.foreground
          return {
            value: [p.x, p.y, p.value],
            itemStyle: {
              color: heatmapCellColor(p.value, maxValue, theme.brand, theme.card),
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
              formatter: String(p.value),
              fontSize: 12,
              fontWeight: 600,
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
}: {
  rows: readonly string[]
  cols: readonly string[]
  points: ChartHeatmapPoint[]
  config: ChartConfig
  activeIndex?: number | null
  peakCellIndex: number
  valueLabel?: string
  className?: string
}) {
  const theme = useHeatmapTheme()
  const chartRef = React.useRef<ReactEChartsCore>(null)
  const plotRef = React.useRef<HTMLDivElement>(null)
  const [leoPos, setLeoPos] = React.useState<{ x: number; y: number } | null>(null)
  const maxValue = Math.max(...points.map((p) => p.value), 1)
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
      }),
    [rows, cols, points, maxValue, theme, activeIndex, peakCellIndex, valueLabel],
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
    <div ref={plotRef} className={cn("relative min-h-[260px] w-full", className)}>
      <ReactEChartsCore
        ref={chartRef}
        echarts={echarts}
        option={option}
        notMerge
        lazyUpdate
        opts={{ renderer: "canvas" }}
        onChartReady={handleChartReady}
        style={{ width: "100%", height: 280 }}
        aria-label={`${valueLabel} heatmap by ${rows.join(", ")} and ${cols.join(", ")}`}
      />
      <ChartLeoPixelPlotInsightOverlay position={leoPos} chartFamily="heatmap" />
    </div>
  )
}
