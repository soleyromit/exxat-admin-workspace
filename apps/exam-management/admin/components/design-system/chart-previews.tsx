"use client"

/**
 * Chart primitive previews — re-export canonical gallery bodies from charts-overview
 * so the design-system Chart page stays in sync with the dashboard gallery.
 */

import * as React from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Customized,
  ErrorBar,
  ReferenceLine,
  Sankey,
  Scatter,
  ScatterChart,
  Text,
  Treemap,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  AreaChartContent as ChartAreaPreview,
  ChartCard,
  ChartDataTable,
  ChartFigure,
  CHART_GALLERY_LEO_APPLICATIONS,
  CHART_GALLERY_LEO_BOXPLOT,
  CHART_GALLERY_LEO_BUBBLE,
  CHART_GALLERY_LEO_COMPLIANCE,
  CHART_GALLERY_LEO_COMPOSED,
  CHART_GALLERY_LEO_BULLET,
  CHART_GALLERY_LEO_DONUT,
  CHART_GALLERY_LEO_FUNNEL,
  CHART_GALLERY_LEO_HEATMAP,
  CHART_GALLERY_LEO_HORIZONTAL,
  CHART_GALLERY_LEO_LINE,
  CHART_GALLERY_LEO_QUOTA,
  CHART_GALLERY_LEO_RADAR,
  CHART_GALLERY_LEO_RANGE,
  CHART_GALLERY_LEO_REVIEWS,
  CHART_GALLERY_LEO_SANKEY,
  CHART_GALLERY_LEO_SCATTER,
  CHART_GALLERY_LEO_TIMELINE,
  CHART_GALLERY_LEO_TREEMAP,
  CHART_GALLERY_LEO_TRENDS,
  CHART_GALLERY_LEO_WATERFALL,
  ComposedChartContent as ChartComposedPreview,
  DonutChartContent as ChartDonutPreview,
  FunnelChartContent as ChartFunnelPreview,
  GroupedBarContent as ChartGroupedBarPreview,
  HorizontalBarContent as ChartHorizontalBarPreview,
  LineChartContent as ChartLinePreview,
  RadarChartContent as ChartRadarPreview,
  RadialBarContent as ChartRadialBarPreview,
  ScatterChartContent as ChartScatterPreview,
  StackedBarContent as ChartStackedBarPreview,
  ChartQuotaRadialPreview,
  type ChartLeoInsight,
} from "@/components/charts-overview"
import {
  buildChartHeatmapPoints,
  ChartHeatmap,
} from "@/components/chart-heatmap"
import { ChartLeoPlotInsightOverlay } from "@/components/chart-leo-spotting"
import {
  ChartContainer,
  chartTooltipKeyboardSyncProps,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { FilterChipGroup } from "@/components/ui/filter-chip-group"
import { cn } from "@/lib/utils"
import { CHART_AXIS_TICK, CHART_TICK_FONT_SIZE } from "@/lib/chart-typography"

export {
  ChartAreaPreview,
  ChartComposedPreview,
  ChartDonutPreview,
  ChartFunnelPreview,
  ChartGroupedBarPreview,
  ChartHorizontalBarPreview,
  ChartLinePreview,
  ChartRadarPreview,
  ChartRadialBarPreview,
  ChartScatterPreview,
  ChartStackedBarPreview,
  ChartQuotaRadialPreview,
}

const BRAND = "var(--brand-color)"
const CHART_1 = "var(--color-chart-1)"
const CHART_2 = "var(--color-chart-2)"
const CHART_3 = "var(--color-chart-3)"
const CHART_4 = "var(--color-chart-4)"
const CHART_5 = "var(--color-chart-5)"
const SUCCESS = "var(--success)"
const WARNING = "var(--warning)"
const DESTRUCTIVE = "var(--destructive)"

const activeIndexProps = (activeIndex: number | null) =>
  activeIndex == null ? {} : ({ activeIndex } as Record<string, unknown>)

function GalleryChartCardShell({
  title,
  description,
  leoInsight,
  children,
}: {
  title: string
  description: string
  leoInsight: ChartLeoInsight
  children: React.ReactNode
}) {
  return (
    <ChartCard variant="normal" title={title} description={description} leoInsight={leoInsight} className="min-h-[320px]">
      {children}
    </ChartCard>
  )
}

function ChartCardPreviewFrame({
  title,
  description,
  summary,
  dataLength,
  leoInsight,
  leoPlot,
  children,
  table,
}: {
  title: string
  description: string
  summary: string
  dataLength: number
  leoInsight: ChartLeoInsight
  leoPlot?: React.ReactNode
  children: (activeIndex: number | null) => React.ReactNode
  table: React.ReactNode
}) {
  return (
    <ChartCard variant="normal" title={title} description={description} leoInsight={leoInsight} className="min-h-[320px]">
      <ChartFigure label={title} summary={summary} dataLength={dataLength} leoInsight={leoInsight}>
        {(activeIndex) => (
          <>
            <div className="relative w-full min-h-[260px]">
              {children(activeIndex)}
              {leoPlot}
            </div>
            {table}
          </>
        )}
      </ChartFigure>
    </ChartCard>
  )
}

const heatmapRows = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const
const heatmapCols = ["8a", "10a", "12p", "2p", "4p", "6p"] as const
const heatmapMatrix = [
  [12, 18, 32, 28, 20, 14],
  [16, 24, 36, 42, 33, 18],
  [22, 31, 48, 53, 41, 25],
  [18, 29, 44, 50, 39, 21],
  [10, 16, 25, 30, 24, 12],
] as const

const heatmapPeak = { day: "Wed", time: "2p", activity: 53 } as const

const heatmapConfig: ChartConfig = {
  activity: { label: "Activity", color: BRAND },
}

const heatmapPoints = buildChartHeatmapPoints(heatmapRows, heatmapCols, heatmapMatrix)

function heatmapCellIndex(day: string, time: string) {
  const row = heatmapRows.indexOf(day as (typeof heatmapRows)[number])
  const col = heatmapCols.indexOf(time as (typeof heatmapCols)[number])
  return row >= 0 && col >= 0 ? row * heatmapCols.length + col : -1
}

function HeatmapPreview() {
  const leoPeakIndex = heatmapCellIndex(heatmapPeak.day, heatmapPeak.time)

  return (
    <ChartCardPreviewFrame
      title="Activity heatmap"
      description="Intensity matrix for weekday and time-window activity."
      summary="ECharts heatmap (canvas) showing activity volume by weekday and time window. Darker cells are busier; values are listed in each cell."
      dataLength={heatmapPoints.length}
      leoInsight={CHART_GALLERY_LEO_HEATMAP}
      table={
        <ChartDataTable
          caption="Activity heatmap"
          headers={["Day", "Time", "Activity"]}
          rows={heatmapPoints.map((d) => [d.row, d.col, d.value])}
        />
      }
    >
      {(activeIndex) => (
        <ChartHeatmap
          rows={heatmapRows}
          cols={heatmapCols}
          points={heatmapPoints}
          config={heatmapConfig}
          activeIndex={activeIndex}
          peakCellIndex={leoPeakIndex}
        />
      )}
    </ChartCardPreviewFrame>
  )
}

const treemapConfig: ChartConfig = {
  nursing: { label: "Nursing", color: CHART_1 },
  pt: { label: "PT", color: CHART_2 },
  ot: { label: "OT", color: CHART_3 },
  pharm: { label: "Pharm", color: CHART_4 },
  social: { label: "Social", color: CHART_5 },
  radiology: { label: "Radiology", color: BRAND },
}

const treemapLeaves = [
  { name: "Nursing", size: 34, fill: CHART_1 },
  { name: "PT", size: 22, fill: CHART_2 },
  { name: "OT", size: 18, fill: CHART_3 },
  { name: "Pharm", size: 14, fill: CHART_4 },
  { name: "Social", size: 8, fill: CHART_5 },
  { name: "Radiology", size: 4, fill: BRAND },
] as const

const treemapTotal = treemapLeaves.reduce((sum, leaf) => sum + leaf.size, 0)

type TreemapCellProps = {
  x?: number
  y?: number
  width?: number
  height?: number
  name?: string
  depth?: number
  index?: number
  fill?: string
  size?: number
  tooltipIndex?: string | null
}

/** Treemap nodes use string paths (`children[0]`) — map ChartFigure numeric index for keyboard tooltip sync. */
function treemapTooltipKeyboardSyncProps(keyboardActiveIndex: number | null) {
  const hasKbd =
    typeof keyboardActiveIndex === "number" &&
    keyboardActiveIndex >= 0 &&
    keyboardActiveIndex < treemapLeaves.length
  return {
    key: hasKbd ? `kbd-${keyboardActiveIndex}` : "kbd-off",
    props: hasKbd
      ? ({ defaultIndex: `children[${keyboardActiveIndex}]` } as unknown as { defaultIndex?: number })
      : {},
  }
}

function TreemapTileCell({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  name,
  depth,
  index,
  fill,
  size,
  tooltipIndex,
  activeIndex,
}: TreemapCellProps & { activeIndex: number | null }) {
  if (depth === 0 || width < 2 || height < 2) return null

  const leafIndex = depth === 1 ? index : undefined
  const isActive = leafIndex != null && activeIndex === leafIndex
  const isLeoPeak = leafIndex === 0
  const showLabels = width >= 44 && height >= 36
  const showValue = width >= 36 && height >= 28

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={4}
        ry={4}
        fill={fill ?? CHART_1}
        stroke={isActive ? "var(--ring)" : isLeoPeak ? "var(--brand-color)" : "var(--background)"}
        strokeWidth={isActive || isLeoPeak ? 3 : 2}
        data-recharts-item-index={tooltipIndex ?? undefined}
        data-chart-leo-anchor={isLeoPeak ? "peak" : undefined}
      />
      {showLabels && name ? (
        <>
          <Text
            x={x + width / 2}
            y={y + height / 2 - (showValue && size != null ? 7 : 0)}
            textAnchor="middle"
            verticalAnchor="middle"
            fontSize={CHART_TICK_FONT_SIZE}
            fill="var(--foreground)"
          >
            {name}
          </Text>
          {showValue && size != null ? (
            <Text
              x={x + width / 2}
              y={y + height / 2 + 9}
              textAnchor="middle"
              verticalAnchor="middle"
              fontSize={CHART_TICK_FONT_SIZE}
              fill="var(--muted-foreground)"
              className="tabular-nums"
            >
              {size}
            </Text>
          ) : null}
        </>
      ) : null}
    </g>
  )
}

function TreemapShareLegend({
  activeIndex,
}: {
  activeIndex: number | null
}) {
  return (
    <div className="mt-2 grid shrink-0 grid-cols-2 gap-x-4 gap-y-1 text-xs" aria-hidden="true">
      {treemapLeaves.map((leaf, leafIndex) => (
        <div
          key={leaf.name}
          className={cn(
            "flex items-center gap-1.5 rounded-sm px-1 py-0.5",
            activeIndex === leafIndex && "ring-2 ring-ring ring-offset-1",
          )}
        >
          <span className="size-2.5 shrink-0 rounded-full" style={{ background: leaf.fill }} />
          <span className="text-muted-foreground">{leaf.name}</span>
          <span className="ms-auto font-medium tabular-nums text-foreground">{leaf.size}</span>
          <span className="tabular-nums text-muted-foreground">
            {Math.round((leaf.size / treemapTotal) * 100)}%
          </span>
        </div>
      ))}
    </div>
  )
}

function TreemapPreview() {
  return (
    <ChartCardPreviewFrame
      title="Program treemap"
      description="Proportional share by program in a space-filling layout."
      summary="Treemap showing proportional program share. Use the legend and data table for exact values; arrow keys highlight each program."
      dataLength={treemapLeaves.length}
      leoInsight={CHART_GALLERY_LEO_TREEMAP}
      leoPlot={<ChartLeoPlotInsightOverlay chartFamily="treemap" />}
      table={
        <ChartDataTable
          caption="Program treemap"
          headers={["Program", "Share", "% of total"]}
          rows={treemapLeaves.map((leaf) => [
            leaf.name,
            leaf.size,
            `${Math.round((leaf.size / treemapTotal) * 100)}%`,
          ])}
        />
      }
    >
      {(activeIndex) => (
        <>
          <ChartContainer config={treemapConfig} className="aspect-auto h-[220px] w-full">
            <Treemap
              data={[...treemapLeaves]}
              dataKey="size"
              nameKey="name"
              type="flat"
              stroke="var(--background)"
              isAnimationActive={false}
              content={(nodeProps) => (
                <TreemapTileCell
                  x={nodeProps.x}
                  y={nodeProps.y}
                  width={nodeProps.width}
                  height={nodeProps.height}
                  name={nodeProps.name}
                  depth={nodeProps.depth}
                  index={nodeProps.index}
                  fill={typeof nodeProps.fill === "string" ? nodeProps.fill : undefined}
                  size={typeof nodeProps.size === "number" ? nodeProps.size : undefined}
                  tooltipIndex={nodeProps.tooltipIndex}
                  activeIndex={activeIndex}
                />
              )}
            >
              <ChartTooltip
                key={treemapTooltipKeyboardSyncProps(activeIndex).key}
                {...treemapTooltipKeyboardSyncProps(activeIndex).props}
                content={<ChartTooltipContent nameKey="name" />}
              />
            </Treemap>
          </ChartContainer>
          <TreemapShareLegend activeIndex={activeIndex} />
        </>
      )}
    </ChartCardPreviewFrame>
  )
}

const waterfallConfig: ChartConfig = {
  base: { label: "Base", color: "transparent" },
  value: { label: "Value", color: BRAND },
}
const waterfallSteps = [
  { label: "Start", delta: 120 },
  { label: "New", delta: 44 },
  { label: "Expired", delta: -22 },
  { label: "Renewed", delta: 31 },
  { label: "Closed", delta: -15 },
] as const

type WaterfallRow = {
  label: string
  kind: "start" | "delta" | "end"
  base: number
  value: number
  delta: number
  total: number
  fill: string
}

function buildWaterfallData(steps: readonly { label: string; delta: number }[]): WaterfallRow[] {
  const rows: WaterfallRow[] = []
  let total = steps[0]?.delta ?? 0

  rows.push({
    label: steps[0]?.label ?? "Start",
    kind: "start",
    base: 0,
    value: total,
    delta: total,
    total,
    fill: CHART_2,
  })

  for (const step of steps.slice(1)) {
    const previous = total
    total += step.delta
    if (step.delta >= 0) {
      rows.push({
        label: step.label,
        kind: "delta",
        base: previous,
        value: step.delta,
        delta: step.delta,
        total,
        fill: BRAND,
      })
    } else {
      rows.push({
        label: step.label,
        kind: "delta",
        base: total,
        value: Math.abs(step.delta),
        delta: step.delta,
        total,
        fill: DESTRUCTIVE,
      })
    }
  }

  rows.push({
    label: "End",
    kind: "end",
    base: 0,
    value: total,
    delta: 0,
    total,
    fill: CHART_3,
  })

  return rows
}

const waterfallData = buildWaterfallData(waterfallSteps)

type WaterfallConnectorLayerProps = {
  xAxisMap?: Record<string, { scale: (value: string) => number; bandwidth?: () => number }>
  yAxisMap?: Record<string, { scale: (value: number) => number }>
}

function WaterfallConnectorLayer({ xAxisMap, yAxisMap }: WaterfallConnectorLayerProps) {
  const xAxis = xAxisMap?.[Object.keys(xAxisMap)[0] ?? ""]
  const yAxis = yAxisMap?.[Object.keys(yAxisMap)[0] ?? ""]
  if (!xAxis?.scale || !yAxis?.scale) return null

  const band = xAxis.bandwidth?.() ?? 0

  return (
    <g className="recharts-waterfall-connectors" aria-hidden="true">
      {waterfallData.slice(0, -1).map((point, index) => {
        const next = waterfallData[index + 1]
        if (!next) return null
        const y = yAxis.scale(point.total)
        const xStart = xAxis.scale(point.label) + band
        const xEnd = xAxis.scale(next.label)
        if (Number.isNaN(y) || Number.isNaN(xStart) || Number.isNaN(xEnd)) return null
        return (
          <line
            key={`${point.label}-${next.label}`}
            x1={xStart}
            y1={y}
            x2={xEnd}
            y2={y}
            stroke="var(--muted-foreground)"
            strokeDasharray="4 4"
            strokeOpacity={0.55}
          />
        )
      })}
    </g>
  )
}

function WaterfallPreview() {
  return (
    <ChartCardPreviewFrame
      title="Placement waterfall"
      description="Positive and negative deltas that explain how a total changes."
      summary="Stacked BarChart waterfall showing how additions and reductions change total placements."
      dataLength={waterfallData.length}
      leoInsight={CHART_GALLERY_LEO_WATERFALL}
      leoPlot={<ChartLeoPlotInsightOverlay data={waterfallData} xDataKey="label" />}
      table={<ChartDataTable caption="Placement waterfall" headers={["Step", "Delta", "Total"]} rows={waterfallData.map((d) => [d.label, d.delta, d.total])} />}
    >
      {(activeIndex) => (
      <ChartContainer config={waterfallConfig} className="h-[260px] w-full">
        <BarChart data={waterfallData} margin={{ left: -8, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} />
          <YAxis tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} width={36} />
          <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
          <Customized component={WaterfallConnectorLayer} />
          <Bar dataKey="base" stackId="waterfall" fill="transparent" fillOpacity={0} stroke="none" isAnimationActive={false} />
          <Bar
            dataKey="value"
            stackId="waterfall"
            radius={[4, 4, 4, 4]}
            isAnimationActive={false}
            activeBar={{ stroke: "var(--ring)", strokeWidth: 2, fillOpacity: 1 }}
            {...activeIndexProps(activeIndex)}
          >
            {waterfallData.map((entry) => (
              <Cell key={entry.label} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
      )}
    </ChartCardPreviewFrame>
  )
}

const bubbleConfig: ChartConfig = {
  students: { label: "Students", color: BRAND },
}
const bubbleData = [
  { region: "North", capacity: 20, fillRate: 68, students: 34 },
  { region: "West", capacity: 42, fillRate: 82, students: 52 },
  { region: "Central", capacity: 58, fillRate: 48, students: 28 },
  { region: "East", capacity: 76, fillRate: 74, students: 44 },
  { region: "South", capacity: 88, fillRate: 38, students: 24 },
]

function BubblePreview() {
  return (
    <ChartCardPreviewFrame
      title="Site capacity bubbles"
      description="Capacity, fill rate, and student volume by region."
      summary="ScatterChart bubble chart showing capacity, fill rate, and student count."
      dataLength={bubbleData.length}
      leoInsight={CHART_GALLERY_LEO_BUBBLE}
      leoPlot={<ChartLeoPlotInsightOverlay data={bubbleData} xDataKey="capacity" />}
      table={<ChartDataTable caption="Site capacity bubbles" headers={["Region", "Capacity", "Fill rate", "Students"]} rows={bubbleData.map((d) => [d.region, d.capacity, `${d.fillRate}%`, d.students])} />}
    >
      {(activeIndex) => (
      <ChartContainer config={bubbleConfig} className="h-[260px] w-full">
        <ScatterChart margin={{ left: -8, right: 16, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis type="number" dataKey="capacity" name="Capacity" tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} />
          <YAxis type="number" dataKey="fillRate" name="Fill rate" unit="%" tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} width={36} />
          <ZAxis type="number" dataKey="students" range={[80, 420]} name="Students" />
          <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} cursor={{ strokeDasharray: "3 3" }} content={<ChartTooltipContent hideLabel />} />
          <Scatter
            name="students"
            data={bubbleData}
            fill={BRAND}
            fillOpacity={0.64}
            stroke={BRAND}
            strokeWidth={1.5}
            activeShape={{ stroke: "var(--ring)", strokeWidth: 2, fillOpacity: 0.9 }}
            {...activeIndexProps(activeIndex)}
          />
        </ScatterChart>
      </ChartContainer>
      )}
    </ChartCardPreviewFrame>
  )
}

const rangeConfig: ChartConfig = {
  low: { label: "Low", color: "transparent" },
  range: { label: "Range", color: BRAND },
}
const rangeData = [
  { month: "Jan", low: 44, high: 68, range: 24 },
  { month: "Feb", low: 50, high: 74, range: 24 },
  { month: "Mar", low: 56, high: 83, range: 27 },
  { month: "Apr", low: 48, high: 76, range: 28 },
  { month: "May", low: 62, high: 91, range: 29 },
  { month: "Jun", low: 70, high: 96, range: 26 },
]

function RangePreview() {
  return (
    <ChartCardPreviewFrame
      title="Capacity range"
      description="Low and high capacity bands over time."
      summary="Stacked BarChart range chart showing low and high capacity bands over time."
      dataLength={rangeData.length}
      leoInsight={CHART_GALLERY_LEO_RANGE}
      leoPlot={<ChartLeoPlotInsightOverlay data={rangeData} xDataKey="month" />}
      table={<ChartDataTable caption="Capacity range" headers={["Month", "Low", "High"]} rows={rangeData.map((d) => [d.month, d.low, d.high])} />}
    >
      {(activeIndex) => (
      <ChartContainer config={rangeConfig} className="h-[260px] w-full">
        <BarChart data={rangeData} margin={{ left: -8, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} />
          <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} width={36} />
          <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
          <Bar dataKey="low" stackId="range" fill="transparent" />
          <Bar dataKey="range" stackId="range" fill={BRAND} fillOpacity={0.54} radius={[4, 4, 4, 4]} activeBar={{ stroke: "var(--ring)", strokeWidth: 2, fillOpacity: 0.8 }} {...activeIndexProps(activeIndex)} />
        </BarChart>
      </ChartContainer>
      )}
    </ChartCardPreviewFrame>
  )
}

const boxplotConfig: ChartConfig = {
  q1: { label: "Q1", color: CHART_2 },
  iqr: { label: "IQR", color: BRAND },
}
const boxplotData = [
  { program: "Nursing", min: 62, q1: 72, median: 80, q3: 88, max: 96, iqr: 16 },
  { program: "PT", min: 58, q1: 68, median: 76, q3: 84, max: 91, iqr: 16 },
  { program: "OT", min: 64, q1: 74, median: 82, q3: 89, max: 94, iqr: 15 },
  { program: "Pharm", min: 55, q1: 65, median: 73, q3: 82, max: 90, iqr: 17 },
]

function BoxplotPreview() {
  return (
    <ChartCardPreviewFrame
      title="Score distribution boxplot"
      description="Quartile spread and whiskers by program."
      summary="ComposedChart boxplot-style chart using stacked bars and ErrorBar whiskers."
      dataLength={boxplotData.length}
      leoInsight={CHART_GALLERY_LEO_BOXPLOT}
      leoPlot={<ChartLeoPlotInsightOverlay data={boxplotData} xDataKey="program" />}
      table={<ChartDataTable caption="Score distribution boxplot" headers={["Program", "Min", "Q1", "Median", "Q3", "Max"]} rows={boxplotData.map((d) => [d.program, d.min, d.q1, d.median, d.q3, d.max])} />}
    >
      {(activeIndex) => (
      <ChartContainer config={boxplotConfig} className="h-[260px] w-full">
        <ComposedChart data={boxplotData} margin={{ left: -8, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="program" tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} />
          <YAxis domain={[50, 100]} tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} width={36} />
          <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
          <Bar dataKey="q1" stackId="box" fill="transparent" />
          <Bar dataKey="iqr" stackId="box" fill={BRAND} fillOpacity={0.42} radius={[4, 4, 4, 4]} activeBar={{ stroke: "var(--ring)", strokeWidth: 2, fillOpacity: 0.62 }} {...activeIndexProps(activeIndex)}>
            <ErrorBar dataKey={(entry: typeof boxplotData[number]) => [entry.q1 - entry.min, entry.max - entry.q3]} width={8} stroke="var(--foreground)" />
          </Bar>
          <ReferenceLine y={0} stroke="transparent" />
        </ComposedChart>
      </ChartContainer>
      )}
    </ChartCardPreviewFrame>
  )
}

const bulletConfig: ChartConfig = {
  value: { label: "Actual", color: BRAND },
}
const bulletData = [
  { metric: "Compliance", value: 86, target: 92 },
  { metric: "Placements", value: 74, target: 80 },
  { metric: "Reviews", value: 63, target: 70 },
]

function BulletPreview() {
  return (
    <ChartCardPreviewFrame
      title="KPI bullet chart"
      description="Actual progress against targets for key metrics."
      summary="Vertical BarChart bullet chart showing actual progress against targets."
      dataLength={bulletData.length}
      leoInsight={CHART_GALLERY_LEO_BULLET}
      leoPlot={<ChartLeoPlotInsightOverlay data={bulletData} xDataKey="metric" chartFamily="bar" />}
      table={<ChartDataTable caption="KPI bullet chart" headers={["Metric", "Actual", "Target"]} rows={bulletData.map((d) => [d.metric, `${d.value}%`, `${d.target}%`])} />}
    >
      {(activeIndex) => (
      <ChartContainer config={bulletConfig} className="h-[240px] w-full">
        <BarChart data={bulletData} layout="vertical" margin={{ left: 16, right: 24, top: 8, bottom: 0 }}>
          <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} />
          <YAxis type="category" dataKey="metric" tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} width={82} />
          <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
          <Bar dataKey="value" fill={BRAND} radius={[0, 4, 4, 0]} barSize={18} activeBar={{ stroke: "var(--ring)", strokeWidth: 2, fillOpacity: 1 }} {...activeIndexProps(activeIndex)} />
          {bulletData.map((item) => (
            <ReferenceLine key={item.metric} x={item.target} stroke="var(--foreground)" strokeDasharray="4 3" strokeWidth={2} />
          ))}
        </BarChart>
      </ChartContainer>
      )}
    </ChartCardPreviewFrame>
  )
}

const timelineConfig: ChartConfig = {
  milestone: { label: "Milestone", color: BRAND },
}
const timelineData = [
  { milestone: "Applied", day: 1, lane: 1 },
  { milestone: "Screened", day: 7, lane: 1 },
  { milestone: "Matched", day: 18, lane: 1 },
  { milestone: "Placed", day: 31, lane: 1 },
  { milestone: "Complete", day: 56, lane: 1 },
]

function TimelinePreview() {
  return (
    <ChartCardPreviewFrame
      title="Placement timeline"
      description="Major lifecycle milestones on a single lane."
      summary="ScatterChart timeline showing major placement lifecycle milestones."
      dataLength={timelineData.length}
      leoInsight={CHART_GALLERY_LEO_TIMELINE}
      leoPlot={<ChartLeoPlotInsightOverlay data={timelineData} xDataKey="day" />}
      table={<ChartDataTable caption="Placement timeline" headers={["Milestone", "Day"]} rows={timelineData.map((d) => [d.milestone, d.day])} />}
    >
      {(activeIndex) => (
      <ChartContainer config={timelineConfig} className="h-[180px] w-full">
        <ScatterChart margin={{ left: 8, right: 20, top: 8, bottom: 8 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis type="number" dataKey="day" name="Day" tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} />
          <YAxis type="number" dataKey="lane" domain={[0, 2]} hide />
          <ZAxis range={[120, 120]} />
          <ReferenceLine y={1} stroke="var(--border)" strokeWidth={2} />
          <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent hideLabel />} />
          <Scatter
            name="milestone"
            data={timelineData}
            fill={BRAND}
            stroke="var(--background)"
            strokeWidth={2}
            activeShape={{ stroke: "var(--ring)", strokeWidth: 2 }}
            {...activeIndexProps(activeIndex)}
          />
        </ScatterChart>
      </ChartContainer>
      )}
    </ChartCardPreviewFrame>
  )
}

const sankeyConfig: ChartConfig = {
  applied: { label: "Applied", color: CHART_1 },
  screened: { label: "Screened", color: CHART_2 },
  matched: { label: "Matched", color: CHART_3 },
  placed: { label: "Placed", color: CHART_4 },
  completed: { label: "Completed", color: CHART_5 },
}

const sankeyData = {
  nodes: [
    { name: "Applied", fill: CHART_1 },
    { name: "Screened", fill: CHART_2 },
    { name: "Matched", fill: CHART_3 },
    { name: "Placed", fill: CHART_4 },
    { name: "Completed", fill: CHART_5 },
  ],
  links: [
    { source: 0, target: 1, value: 240 },
    { source: 1, target: 2, value: 175 },
    { source: 2, target: 3, value: 128 },
    { source: 3, target: 4, value: 98 },
  ],
}

type SankeyNodeShapeProps = {
  x?: number
  y?: number
  width?: number
  height?: number
  index?: number
  payload?: { name?: string; fill?: string }
}

function SankeyNodeShape({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  index = 0,
  payload,
}: SankeyNodeShapeProps) {
  const isFirst = index === 0
  const labelX = isFirst ? x - 8 : x + width + 8
  const textAnchor = isFirst ? "end" : "start"

  return (
    <g className="recharts-sankey-node">
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={payload?.fill ?? CHART_1}
        fillOpacity={0.88}
        stroke="var(--background)"
        strokeWidth={1}
        rx={2}
      />
      <text
        x={labelX}
        y={y + height / 2}
        textAnchor={textAnchor}
        dominantBaseline="central"
        fontSize={CHART_TICK_FONT_SIZE}
        fill="var(--foreground)"
      >
        {payload?.name}
      </text>
    </g>
  )
}

type SankeyLinkShapeProps = {
  sourceX?: number
  sourceY?: number
  targetX?: number
  targetY?: number
  sourceControlX?: number
  targetControlX?: number
  linkWidth?: number
  payload?: {
    value?: number
    source?: { name?: string }
    target?: { name?: string }
  }
}

function SankeyLinkShape({
  sourceX = 0,
  sourceY = 0,
  targetX = 0,
  targetY = 0,
  sourceControlX = 0,
  targetControlX = 0,
  linkWidth = 0,
  payload,
}: SankeyLinkShapeProps) {
  const isLeoPeak =
    payload?.source?.name === "Applied" && payload?.target?.name === "Screened"
  const strokeWidth = Math.max(linkWidth, 2)

  return (
    <path
      className="recharts-sankey-link"
      d={`M${sourceX},${sourceY} C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`}
      fill="none"
      stroke={BRAND}
      strokeWidth={strokeWidth}
      strokeOpacity={0.38}
      data-chart-leo-anchor={isLeoPeak ? "peak" : undefined}
    />
  )
}

function SankeyStageLegend() {
  return (
    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs" aria-label="Application stages">
      {sankeyData.nodes.map((node) => (
        <li key={node.name} className="flex items-center gap-1.5">
          <span className="size-2.5 shrink-0 rounded-sm" aria-hidden style={{ background: node.fill }} />
          <span className="text-foreground">{node.name}</span>
        </li>
      ))}
    </ul>
  )
}

function SankeyFlowSummary() {
  return (
    <p className="sr-only">
      Application flow from Applied through Screened, Matched, Placed, to Completed.
      {sankeyData.links.map((link) => {
        const source = sankeyData.nodes[link.source]?.name ?? ""
        const target = sankeyData.nodes[link.target]?.name ?? ""
        return ` ${source} to ${target}: ${link.value}.`
      })}
    </p>
  )
}

function SankeyPreview() {
  return (
    <ChartCardPreviewFrame
      title="Application flow"
      description="Flow volume through application stages."
      summary="Sankey chart showing flow volume through application stages. Stage names are listed below the chart; full counts are in the data table."
      dataLength={sankeyData.nodes.length}
      leoInsight={CHART_GALLERY_LEO_SANKEY}
      leoPlot={<ChartLeoPlotInsightOverlay chartFamily="sankey" />}
      table={
        <ChartDataTable
          caption="Application flow"
          headers={["Source", "Target", "Count"]}
          rows={sankeyData.links.map((d) => [
            sankeyData.nodes[d.source]?.name ?? "",
            sankeyData.nodes[d.target]?.name ?? "",
            d.value,
          ])}
        />
      }
    >
      {() => (
        <>
          <SankeyFlowSummary />
          <ChartContainer config={sankeyConfig} className="h-[260px] w-full">
            <Sankey
              data={sankeyData}
              nodePadding={28}
              nodeWidth={14}
              linkCurvature={0.52}
              iterations={48}
              margin={{ left: 72, right: 72, top: 12, bottom: 12 }}
              node={<SankeyNodeShape />}
              link={<SankeyLinkShape />}
            >
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, _name, item) => {
                      const payload = item.payload as {
                        source?: { name?: string }
                        target?: { name?: string }
                      }
                      const source = payload?.source?.name ?? "Source"
                      const target = payload?.target?.name ?? "Target"
                      return (
                        <span className="font-medium tabular-nums text-foreground">
                          {source} → {target}: {value}
                        </span>
                      )
                    }}
                  />
                }
              />
            </Sankey>
          </ChartContainer>
          <SankeyStageLegend />
        </>
      )}
    </ChartCardPreviewFrame>
  )
}

const BAR_VARIANT_TABS = [
  {
    id: "grouped",
    label: "Grouped",
    description: "Side-by-side bars for comparing related series per category.",
    content: (
      <GalleryChartCardShell
        title="Applications by Program"
        description="New and returned applications across programs."
        leoInsight={CHART_GALLERY_LEO_APPLICATIONS}
      >
        <ChartGroupedBarPreview />
      </GalleryChartCardShell>
    ),
  },
  {
    id: "stacked",
    label: "Stacked",
    description: "Stacked segments for part-to-whole category totals.",
    content: (
      <GalleryChartCardShell
        title="Monthly Reviews"
        description="Approved, pending, and rejected reviews by month."
        leoInsight={CHART_GALLERY_LEO_REVIEWS}
      >
        <ChartStackedBarPreview />
      </GalleryChartCardShell>
    ),
  },
  {
    id: "horizontal",
    label: "Horizontal",
    description: "Horizontal bars when category labels need more reading room.",
    content: (
      <GalleryChartCardShell
        title="Placements by Site"
        description="Placement count by clinical site."
        leoInsight={CHART_GALLERY_LEO_HORIZONTAL}
      >
        <ChartHorizontalBarPreview />
      </GalleryChartCardShell>
    ),
  },
] as const

function ChartSubTabs<TTab extends { id: string; label: string; description: string; content: React.ReactNode }>({
  tabs,
  defaultValue,
}: {
  tabs: readonly TTab[]
  defaultValue: TTab["id"]
}) {
  const [activeValue, setActiveValue] = React.useState<TTab["id"]>(defaultValue)
  const active = tabs.find((tab) => tab.id === activeValue) ?? tabs[0]

  return (
    <Tabs
      value={activeValue}
      onValueChange={(value) => setActiveValue(value as TTab["id"])}
      className="flex-col gap-3"
    >
      <TabsList variant="line">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      <p className="text-sm text-muted-foreground">{active.description}</p>
      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="mt-2">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}

function BarChartVariantPreview() {
  return <ChartSubTabs tabs={BAR_VARIANT_TABS} defaultValue="grouped" />
}

const TREND_VARIANT_TABS = [
  {
    id: "area",
    label: "Area",
    description: "Filled trend lines for cumulative volume and trend bands.",
    content: (
      <GalleryChartCardShell
        title="Placement Trends"
        description="Multi-line area chart showing placements, applications, and reviews."
        leoInsight={CHART_GALLERY_LEO_TRENDS}
      >
        <ChartAreaPreview />
      </GalleryChartCardShell>
    ),
  },
  {
    id: "line",
    label: "Line",
    description: "Multi-series trend line with dash variants.",
    content: (
      <GalleryChartCardShell
        title="Portal Activity"
        description="Logins, submissions, and evaluations by week."
        leoInsight={CHART_GALLERY_LEO_LINE}
      >
        <ChartLinePreview />
      </GalleryChartCardShell>
    ),
  },
] as const

function TrendChartFamilyPreview() {
  return <ChartSubTabs tabs={TREND_VARIANT_TABS} defaultValue="area" />
}

const DISTRIBUTION_VARIANT_TABS = [
  {
    id: "donut",
    label: "Donut",
    description: "Part-to-whole distribution with legend and percent labels.",
    content: (
      <GalleryChartCardShell
        title="Placement Status"
        description="Current cycle distribution by status."
        leoInsight={CHART_GALLERY_LEO_DONUT}
      >
        <ChartDonutPreview />
      </GalleryChartCardShell>
    ),
  },
  {
    id: "radial",
    label: "Radial",
    description: "Radial bar comparison across programs or score bands.",
    content: (
      <GalleryChartCardShell
        title="Compliance Score"
        description="Compliance scores by program."
        leoInsight={CHART_GALLERY_LEO_COMPLIANCE}
      >
        <ChartRadialBarPreview />
      </GalleryChartCardShell>
    ),
  },
  {
    id: "gauge",
    label: "Gauge",
    description: "Single-score radial gauge for quota, progress, or achievement.",
    content: (
      <GalleryChartCardShell
        title="Quota progress"
        description="Single-score radial gauge for quota or achievement."
        leoInsight={CHART_GALLERY_LEO_QUOTA}
      >
        <ChartQuotaRadialPreview />
      </GalleryChartCardShell>
    ),
  },
] as const

function DistributionChartFamilyPreview() {
  return <ChartSubTabs tabs={DISTRIBUTION_VARIANT_TABS} defaultValue="donut" />
}

const RELATIONSHIP_VARIANT_TABS = [
  {
    id: "scatter",
    label: "Scatter",
    description: "Point cloud for relationships between two numeric measures.",
    content: (
      <GalleryChartCardShell
        title="Application funnel scatter"
        description="Relationship between application stages and conversion."
        leoInsight={CHART_GALLERY_LEO_SCATTER}
      >
        <ChartScatterPreview />
      </GalleryChartCardShell>
    ),
  },
  {
    id: "bubble",
    label: "Bubble",
    description: "Scatter variant with point size encoding a third measure.",
    content: <BubblePreview />,
  },
  {
    id: "radar",
    label: "Radar",
    description: "Multi-axis profile comparison across competency dimensions.",
    content: (
      <GalleryChartCardShell
        title="Competency Radar"
        description="Nursing vs PT/OT competency scores."
        leoInsight={CHART_GALLERY_LEO_RADAR}
      >
        <ChartRadarPreview />
      </GalleryChartCardShell>
    ),
  },
] as const

function RelationshipChartFamilyPreview() {
  return <ChartSubTabs tabs={RELATIONSHIP_VARIANT_TABS} defaultValue="scatter" />
}

const COMPOSITION_VARIANT_TABS = [
  {
    id: "composed",
    label: "Composed",
    description: "Combined bar and line series for capacity, volume, and rate overlays.",
    content: (
      <GalleryChartCardShell
        title="Site Capacity vs Fill Rate"
        description="Placement volume against capacity and fill rate."
        leoInsight={CHART_GALLERY_LEO_COMPOSED}
      >
        <ChartComposedPreview />
      </GalleryChartCardShell>
    ),
  },
] as const

function CompositionChartFamilyPreview() {
  return <ChartSubTabs tabs={COMPOSITION_VARIANT_TABS} defaultValue="composed" />
}

const RANGE_VARIANT_TABS = [
  {
    id: "range",
    label: "Range",
    description: "Low/high value bands for capacity, forecasts, or confidence intervals.",
    content: <RangePreview />,
  },
  {
    id: "bullet",
    label: "Bullet",
    description: "Actual value against target in a dense KPI comparison.",
    content: <BulletPreview />,
  },
] as const

function RangeChartFamilyPreview() {
  return <ChartSubTabs tabs={RANGE_VARIANT_TABS} defaultValue="range" />
}

const STATISTICAL_VARIANT_TABS = [
  {
    id: "boxplot",
    label: "Boxplot",
    description: "Distribution summary with min, quartiles, median, and max.",
    content: <BoxplotPreview />,
  },
  {
    id: "heatmap",
    label: "Heatmap",
    description: "Intensity matrix for time, cohort, or schedule density.",
    content: <HeatmapPreview />,
  },
] as const

function StatisticalChartFamilyPreview() {
  return <ChartSubTabs tabs={STATISTICAL_VARIANT_TABS} defaultValue="boxplot" />
}

const HIERARCHY_VARIANT_TABS = [
  {
    id: "treemap",
    label: "Treemap",
    description: "Proportional category breakdown using a space-filling hierarchy.",
    content: <TreemapPreview />,
  },
] as const

function HierarchyChartFamilyPreview() {
  return <ChartSubTabs tabs={HIERARCHY_VARIANT_TABS} defaultValue="treemap" />
}

const FLOW_VARIANT_TABS = [
  {
    id: "funnel",
    label: "Funnel",
    description: "Pipeline progression from one stage to the next.",
    content: (
      <GalleryChartCardShell
        title="Application Pipeline"
        description="Pipeline progression from one stage to the next."
        leoInsight={CHART_GALLERY_LEO_FUNNEL}
      >
        <ChartFunnelPreview />
      </GalleryChartCardShell>
    ),
  },
  {
    id: "sankey",
    label: "Sankey",
    description: "Flow volume between stages or categories.",
    content: <SankeyPreview />,
  },
  {
    id: "waterfall",
    label: "Waterfall",
    description: "Positive and negative deltas that explain how a total changes.",
    content: <WaterfallPreview />,
  },
  {
    id: "timeline",
    label: "Timeline",
    description: "Ordered events or milestones along a process.",
    content: <TimelinePreview />,
  },
] as const

function FlowChartFamilyPreview() {
  return <ChartSubTabs tabs={FLOW_VARIANT_TABS} defaultValue="funnel" />
}

const CHART_TABS = [
  {
    id: "trends",
    label: "Trends",
    description: "Use trend charts for time series, movement, and volume over time.",
    content: <TrendChartFamilyPreview />,
  },
  {
    id: "bars",
    label: "Bars",
    description: "Bar chart family with grouped, stacked, and horizontal variants.",
    content: <BarChartVariantPreview />,
  },
  {
    id: "distribution",
    label: "Distribution",
    description: "Use distribution charts for part-to-whole, score, and progress views.",
    content: <DistributionChartFamilyPreview />,
  },
  {
    id: "relationship",
    label: "Relationship",
    description: "Use relationship charts to compare dimensions or reveal correlation.",
    content: <RelationshipChartFamilyPreview />,
  },
  {
    id: "composition",
    label: "Composition",
    description: "Use composition charts when multiple measures share one story.",
    content: <CompositionChartFamilyPreview />,
  },
  {
    id: "range",
    label: "Range",
    description: "Use range charts for uncertainty, targets, and value bands.",
    content: <RangeChartFamilyPreview />,
  },
  {
    id: "statistical",
    label: "Statistical",
    description: "Use statistical charts for distribution, intensity, and variance.",
    content: <StatisticalChartFamilyPreview />,
  },
  {
    id: "hierarchy",
    label: "Hierarchy",
    description: "Use hierarchy charts for proportional category breakdowns.",
    content: <HierarchyChartFamilyPreview />,
  },
  {
    id: "flow",
    label: "Flow",
    description: "Use flow charts for stage conversion and pipeline drop-off.",
    content: <FlowChartFamilyPreview />,
  },
] as const

export function ChartTabbedPreview() {
  const [activeTab, setActiveTab] = React.useState<(typeof CHART_TABS)[number]["id"]>("trends")
  const active = CHART_TABS.find((tab) => tab.id === activeTab) ?? CHART_TABS[0]

  return (
    <div className="flex flex-col gap-3">
      <FilterChipGroup
        value={activeTab}
        onValueChange={setActiveTab}
        options={CHART_TABS.map((tab) => ({ value: tab.id, label: tab.label }))}
        variant="muted"
        size="sm"
        aria-label="Chart families"
      />
      <p className="text-sm text-muted-foreground">{active.description}</p>
      <div className="mt-2">{active.content}</div>
    </div>
  )
}
