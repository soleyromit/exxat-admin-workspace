import type { ChartLeoInsight, ChartLeoInsightAnchor } from "@/components/leo-insight-indicator"

/** How Leo plot spotting resolves for a chart family. */
export type ChartLeoSpottingMode = "cartesian" | "plot-selector" | "none"

/** Chart families with tuned overlay lift distances (px). */
export type ChartLeoSpottingFamily =
  | "area"
  | "bar"
  | "line"
  | "scatter"
  | "heatmap"
  | "treemap"
  | "sankey"
  | "waterfall"
  | "funnel"
  | "radial"
  | "timeline"
  | "default"

/** Shared selector for the insight peak cell / link / tile inside a Recharts plot. */
export const CHART_LEO_PEAK_SELECTOR = '[data-chart-leo-anchor="peak"]' as const

export function chartLeoSpottingMode(anchor?: ChartLeoInsightAnchor): ChartLeoSpottingMode {
  if (!anchor) return "none"
  if (anchor.plotSelector) return "plot-selector"
  if (anchor.xValue) return "cartesian"
  return "none"
}

export function chartLeoPeakAnchor(): ChartLeoInsightAnchor {
  return { plotSelector: CHART_LEO_PEAK_SELECTOR }
}

const MARKER_LIFT_PX: Record<ChartLeoSpottingFamily, number> = {
  area: 56,
  bar: 56,
  line: 56,
  scatter: 52,
  heatmap: 48,
  treemap: 44,
  sankey: 52,
  waterfall: 56,
  funnel: 48,
  radial: 48,
  timeline: 52,
  default: 56,
}

export function chartLeoMarkerLiftPx(family: ChartLeoSpottingFamily = "default") {
  return MARKER_LIFT_PX[family]
}

/** Build props for `ChartLeoPlotInsightOverlay` from chart family + optional cartesian data. */
export function chartLeoPlotOverlayProps({
  family = "default",
  data,
  xDataKey,
}: {
  family?: ChartLeoSpottingFamily
  data?: ReadonlyArray<Record<string, string | number | null | undefined>>
  xDataKey?: string
} = {}) {
  return {
    markerLiftPx: chartLeoMarkerLiftPx(family),
    ...(data && xDataKey ? { data, xDataKey } : {}),
  }
}

export function chartLeoSpottingSummary(insight: ChartLeoInsight) {
  const mode = chartLeoSpottingMode(insight.anchor)
  if (mode === "none") return "header-only — no plot anchor"
  if (mode === "plot-selector") return `plot-selector → ${insight.anchor?.plotSelector ?? CHART_LEO_PEAK_SELECTOR}`
  return `cartesian → x=${insight.anchor?.xValue}`
}
