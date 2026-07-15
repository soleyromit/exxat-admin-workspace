"use client"

/**
 * Centralized Leo plot spotting — pill + dashed connector + dot on chart data.
 *
 * Use with `ChartLeoInsightOverlay` (context) + `ChartLeoPlotInsightOverlay` (plot).
 * Anchor strategies live in `@/lib/chart-leo-spotting`.
 */

import * as React from "react"

import {
  LeoInsightIndicator,
  LEO_TOKENS,
  type ChartLeoInsight,
  type ChartLeoInsightAnchor,
} from "@/components/leo-insight-indicator"
import {
  chartLeoMarkerLiftPx,
  type ChartLeoSpottingFamily,
} from "@/lib/chart-leo-spotting"
import { rafThrottle } from "@/lib/raf-throttle"
import { cn } from "@/lib/utils"

type ChartLeoInsightBundle = { insight: ChartLeoInsight; chartTitle: string }

const ChartLeoInsightContext = React.createContext<ChartLeoInsightBundle | null>(null)

function resolveChartLeoAnchorY(
  row: Record<string, unknown>,
  xDataKey: string,
  anchor: ChartLeoInsightAnchor,
): number | null {
  if (typeof anchor.yValue === "number" && !Number.isNaN(anchor.yValue)) {
    return anchor.yValue
  }
  const keys =
    anchor.yDataKeys?.filter((k) => k !== xDataKey) ??
    Object.keys(row).filter((k) => k !== xDataKey)
  const nums = keys
    .map((k) => row[k])
    .filter((v): v is number => typeof v === "number" && !Number.isNaN(v))
  if (nums.length === 0) return null
  const combine = anchor.yCombine ?? "max"
  return combine === "sum" ? nums.reduce((a, b) => a + b, 0) : Math.max(...nums)
}

function chartLeoNumericDomainMax(
  data: ReadonlyArray<Record<string, string | number | null | undefined>>,
  xDataKey: string,
): number {
  let m = 0
  for (const row of data) {
    for (const [k, v] of Object.entries(row)) {
      if (k === xDataKey) continue
      if (typeof v === "number" && !Number.isNaN(v) && v > m) m = v
    }
  }
  return m > 0 ? m : 1
}

function LeoPlotPointDot() {
  return (
    <span
      aria-hidden
      className={cn("block size-2.5 rounded-full", LEO_TOKENS.dotClass)}
      style={{
        boxShadow: `0 0 0 3px oklch(from var(--card) l c h / 0.95)`,
      }}
    />
  )
}

function useChartAnchorPixelPosition({
  xValue,
  xDataKey,
  yNum,
  data,
}: {
  xValue: string
  xDataKey: string
  yNum: number
  data: ReadonlyArray<Record<string, string | number | null | undefined>>
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [pos, setPos] = React.useState<{ x: number; y: number; plotTop: number } | null>(null)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const parent = el.parentElement
    if (!parent) return

    const compute = () => {
      const svg = parent.querySelector("svg") as SVGSVGElement | null
      if (!svg) return
      const parentRect = parent.getBoundingClientRect()

      const toLocal = (node: Element) => {
        const r = (node as SVGGraphicsElement).getBoundingClientRect()
        return {
          left: r.left - parentRect.left,
          right: r.right - parentRect.left,
          top: r.top - parentRect.top,
          bottom: r.bottom - parentRect.top,
          width: r.width,
          height: r.height,
          cx: r.left + r.width / 2 - parentRect.left,
          cy: r.top + r.height / 2 - parentRect.top,
        }
      }

      const grid = svg.querySelector(".recharts-cartesian-grid")
      const xAxis = svg.querySelector(".recharts-xAxis")
      const yAxis = svg.querySelector(".recharts-yAxis")
      if (!xAxis || !yAxis) return

      const plot = grid
        ? toLocal(grid)
        : (() => {
            const y = toLocal(yAxis)
            const x = toLocal(xAxis)
            return {
              left: y.right,
              right: x.right,
              top: y.top,
              bottom: x.top,
              width: x.right - y.right,
              height: x.top - y.top,
              cx: 0,
              cy: 0,
            }
          })()

      const xTicks = Array.from(
        xAxis.querySelectorAll(".recharts-cartesian-axis-tick"),
      ) as SVGGElement[]
      const xTickPairs: Array<{ v: number; x: number }> = []
      for (const t of xTicks) {
        const raw = (t.textContent ?? "").trim()
        if (!raw) continue
        const v = parseFloat(raw.replace(/[^0-9.\-]/g, ""))
        if (!Number.isNaN(v)) xTickPairs.push({ v, x: toLocal(t).cx })
      }

      const anchorRow =
        data.find((d) => String(d[xDataKey]) === xValue) ??
        data.find((d) => Object.entries(d).some(([k, v]) => k !== xDataKey && String(v) === xValue))

      let xPx: number | null = null
      for (const t of xTicks) {
        if ((t.textContent ?? "").trim() === xValue) {
          xPx = toLocal(t).cx
          break
        }
      }
      if (xPx === null && anchorRow) {
        const xNum = anchorRow[xDataKey]
        if (typeof xNum === "number" && xTickPairs.length >= 2) {
          const sorted = [...xTickPairs].toSorted((a, b) => a.v - b.v)
          const lo = sorted[0]!
          const hi = sorted[sorted.length - 1]!
          if (hi.v !== lo.v) {
            xPx = lo.x + ((xNum - lo.v) / (hi.v - lo.v)) * (hi.x - lo.x)
          }
        }
        if (xPx === null) {
          const idx = data.indexOf(anchorRow)
          if (idx < 0) return
          xPx = plot.left + ((idx + 0.5) / Math.max(data.length, 1)) * plot.width
        }
      }
      if (xPx === null) return

      const yTickEls = Array.from(
        yAxis.querySelectorAll(".recharts-cartesian-axis-tick"),
      ) as SVGGElement[]
      const yTickPairs: Array<{ v: number; y: number }> = []
      for (const t of yTickEls) {
        const raw = (t.textContent ?? "").trim()
        if (!raw) continue
        const v = parseFloat(raw.replace(/[^0-9.\-]/g, ""))
        if (Number.isNaN(v)) continue
        yTickPairs.push({ v, y: toLocal(t).cy })
      }
      let yPx: number | null = null
      if (yTickPairs.length >= 2) {
        const sorted = [...yTickPairs].toSorted((a, b) => a.v - b.v)
        const lo = sorted[0]
        const hi = sorted[sorted.length - 1]
        if (lo && hi && hi.v !== lo.v) {
          yPx = lo.y + ((yNum - lo.v) / (hi.v - lo.v)) * (hi.y - lo.y)
        }
      }
      if (yPx === null) {
        const yMax = chartLeoNumericDomainMax(data, xDataKey)
        yPx = plot.top + (1 - yNum / yMax) * plot.height
      }

      setPos((prev) => {
        if (
          prev !== null &&
          Math.abs(prev.x - xPx) < 0.5 &&
          Math.abs(prev.y - (yPx as number)) < 0.5 &&
          Math.abs(prev.plotTop - plot.top) < 0.5
        ) {
          return prev
        }
        return { x: xPx, y: yPx as number, plotTop: plot.top }
      })
    }

    compute()
    let raf1 = requestAnimationFrame(() => {
      compute()
      raf1 = requestAnimationFrame(compute)
    })
    const scheduled = rafThrottle(compute)
    const ro = new ResizeObserver(scheduled)
    ro.observe(parent)
    const mo = new MutationObserver(scheduled)
    mo.observe(parent, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["width", "height", "transform", "d", "x", "y"],
    })

    return () => {
      cancelAnimationFrame(raf1)
      scheduled.cancel()
      ro.disconnect()
      mo.disconnect()
    }
  }, [xValue, xDataKey, yNum, data])

  return { ref, pos }
}

function useChartLeoSelectorPosition(plotSelector: string | undefined) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [pos, setPos] = React.useState<{ x: number; y: number; plotTop: number } | null>(null)

  React.useEffect(() => {
    if (!plotSelector) return
    const el = ref.current
    if (!el) return
    const parent = el.parentElement
    if (!parent) return

    const compute = () => {
      const target = parent.querySelector(plotSelector)
      if (!target) return
      const parentRect = parent.getBoundingClientRect()
      const r = target.getBoundingClientRect()
      const x = r.left + r.width / 2 - parentRect.left
      const y = r.top + r.height / 2 - parentRect.top
      setPos((prev) => {
        if (
          prev !== null &&
          Math.abs(prev.x - x) < 0.5 &&
          Math.abs(prev.y - y) < 0.5 &&
          Math.abs(prev.plotTop) < 0.5
        ) {
          return prev
        }
        return { x, y, plotTop: 0 }
      })
    }

    compute()
    let raf1 = requestAnimationFrame(() => {
      compute()
      raf1 = requestAnimationFrame(compute)
    })
    const scheduled = rafThrottle(compute)
    const ro = new ResizeObserver(scheduled)
    ro.observe(parent)
    const mo = new MutationObserver(scheduled)
    mo.observe(parent, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["width", "height", "transform", "d", "x", "y", "data-chart-leo-anchor"],
    })

    return () => {
      cancelAnimationFrame(raf1)
      scheduled.cancel()
      ro.disconnect()
      mo.disconnect()
    }
  }, [plotSelector])

  return { ref, pos }
}

/** Gap between the dot and the connector, so the line never touches the dot's edge. */
const CONNECTOR_GAP_PX = 7
/** The pill's own height. It is drawn away from its anchor edge, so placement must reserve it. */
const PILL_HEIGHT_PX = 32

function ChartLeoPlotMarkerLayer({
  pos,
  insight,
  chartTitle,
  markerLiftPx,
  avoidTopPx,
}: {
  pos: { x: number; y: number; plotTop: number }
  insight: ChartLeoInsight
  chartTitle: string
  markerLiftPx: number
  /**
   * A band at the top of the plot that the pill must not be drawn into — for a chart whose x
   * axis is `position: "top"`, that band holds the column headers. Omit (the default) and
   * placement is unchanged: the pill always sits above the dot, clamped to the plot top. Pass it
   * and the pill flips BELOW the dot when the space above the dot is not the pill's to use.
   */
  avoidTopPx?: number
}) {
  const desiredChipBottomY = pos.y - markerLiftPx
  // The pill grows upward from its bottom edge, so it collides when its TOP would enter the band.
  const flipBelow = avoidTopPx != null && desiredChipBottomY - PILL_HEIGHT_PX < avoidTopPx

  // The edge the pill is anchored to: its bottom when above the dot, its top when flipped below.
  const chipEdgeY = flipBelow
    ? pos.y + markerLiftPx
    : Math.max((pos.plotTop ?? 0) + 28, desiredChipBottomY)

  const connectorTopY = flipBelow ? pos.y + CONNECTOR_GAP_PX : chipEdgeY
  const connectorHeight = flipBelow
    ? Math.max(0, chipEdgeY - pos.y - CONNECTOR_GAP_PX)
    : Math.max(0, pos.y - chipEdgeY - CONNECTOR_GAP_PX)

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: pos.x,
          top: connectorTopY,
          height: connectorHeight,
          transform: "translateX(-50%)",
          borderLeft: `2px dashed oklch(from ${LEO_TOKENS.cssVar} l c h / 0.7)`,
        }}
      />
      <div
        className="pointer-events-none absolute"
        style={{
          left: pos.x,
          top: pos.y,
          transform: "translate(-50%, -50%)",
        }}
      >
        <LeoPlotPointDot />
      </div>
      <div
        className="pointer-events-auto absolute"
        style={{
          left: pos.x,
          top: chipEdgeY,
          transform: flipBelow ? "translate(-50%, 0)" : "translate(-50%, -100%)",
        }}
      >
        <LeoInsightIndicator
          insight={insight}
          chartTitle={chartTitle}
          triggerLayout="plot-marker"
        />
      </div>
    </>
  )
}

export function ChartLeoPlotInsightOverlay({
  data,
  xDataKey,
  chartFamily = "default",
  markerLiftPx,
}: {
  data?: ReadonlyArray<Record<string, string | number | null | undefined>>
  xDataKey?: string
  chartFamily?: ChartLeoSpottingFamily
  insetPct?: { left: number; right: number; top: number; bottom: number }
  xAxisLabelReservePct?: number
  markerLiftPct?: number
  markerLiftExtraPx?: number
  markerLiftPx?: number
}) {
  const effectiveLift = markerLiftPx ?? chartLeoMarkerLiftPx(chartFamily)
  const bundle = React.useContext(ChartLeoInsightContext)
  const anchor = bundle?.insight.anchor
  const plotSelector = anchor?.plotSelector
  const cartesianRows = data ?? []
  const cartesianXKey = xDataKey ?? "x"

  const idx =
    anchor?.xValue && data && xDataKey
      ? data.findIndex((d) => String(d[xDataKey]) === anchor.xValue)
      : -1
  const row = idx >= 0 ? (data![idx] as Record<string, unknown>) : null
  const yNum = row && anchor ? resolveChartLeoAnchorY(row, cartesianXKey, anchor) : null

  const selectorPos = useChartLeoSelectorPosition(plotSelector)
  const cartesianPos = useChartAnchorPixelPosition({
    xValue: anchor?.xValue ?? "",
    xDataKey: cartesianXKey,
    yNum: yNum ?? 0,
    data: cartesianRows,
  })

  if (!bundle || !anchor) return null

  if (plotSelector) {
    const { ref, pos } = selectorPos
    if (!pos) {
      return (
        <div
          ref={ref}
          className="pointer-events-none absolute inset-0 z-20"
          data-chart-leo-anchor=""
        />
      )
    }
    return (
      <div
        ref={ref}
        className="pointer-events-none absolute inset-0 z-20"
        data-chart-leo-anchor=""
      >
        <ChartLeoPlotMarkerLayer
          pos={pos}
          insight={bundle.insight}
          chartTitle={bundle.chartTitle}
          markerLiftPx={effectiveLift}
        />
      </div>
    )
  }

  if (!data || !xDataKey || idx < 0 || yNum === null || Number.isNaN(yNum)) return null

  const { ref, pos } = cartesianPos
  if (!pos) {
    return (
      <div
        ref={ref}
        className="pointer-events-none absolute inset-0 z-20"
        data-chart-leo-anchor=""
      />
    )
  }

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute inset-0 z-20"
      data-chart-leo-anchor=""
    >
      <ChartLeoPlotMarkerLayer
        pos={pos}
        insight={bundle.insight}
        chartTitle={bundle.chartTitle}
        markerLiftPx={effectiveLift}
      />
    </div>
  )
}

export function ChartLeoInsightOverlay({
  leoInsight,
  chartTitle,
  children,
}: {
  leoInsight?: ChartLeoInsight | null
  chartTitle: string
  children: React.ReactNode
}) {
  const contextValue = React.useMemo(
    () => (leoInsight ? { insight: leoInsight, chartTitle } : null),
    [leoInsight, chartTitle],
  )
  if (!leoInsight || !contextValue) return <>{children}</>
  return (
    <ChartLeoInsightContext.Provider value={contextValue}>
      {children}
    </ChartLeoInsightContext.Provider>
  )
}

/** Plot Leo on canvas charts (ECharts heatmap) using pixel coordinates from the chart API. */
export function ChartLeoPixelPlotInsightOverlay({
  position,
  chartFamily = "heatmap",
  avoidTopPx,
}: {
  position: { x: number; y: number } | null
  chartFamily?: ChartLeoSpottingFamily
  /** Top band the pill must not enter — e.g. the header lane of a `position: "top"` x axis. */
  avoidTopPx?: number
}) {
  const bundle = React.useContext(ChartLeoInsightContext)
  if (!bundle?.insight.anchor || !position) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-20" data-chart-leo-anchor="">
      <ChartLeoPlotMarkerLayer
        pos={{ ...position, plotTop: 0 }}
        insight={bundle.insight}
        chartTitle={bundle.chartTitle}
        markerLiftPx={chartLeoMarkerLiftPx(chartFamily)}
        avoidTopPx={avoidTopPx}
      />
    </div>
  )
}
