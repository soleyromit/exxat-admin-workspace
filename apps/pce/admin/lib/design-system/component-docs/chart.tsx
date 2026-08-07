"use client"

import * as React from "react"

import type { ComponentDocSpec } from "@/lib/design-system/component-doc-types"

const ChartTabbedPreview = React.lazy(() =>
  import("@/components/design-system/chart-previews").then((module) => ({
    default: module.ChartTabbedPreview,
  })),
)

function ChartTabbedPreviewLazy() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-64 flex-col gap-4 rounded-lg border border-border bg-muted/10 p-4">
          <div className="h-8 w-64 max-w-full rounded-md bg-muted" />
          <div className="h-4 w-72 max-w-full rounded-md bg-muted" />
          <div className="min-h-44 flex-1 rounded-lg bg-muted" />
        </div>
      }
    >
      <ChartTabbedPreview />
    </React.Suspense>
  )
}

function ex(
  section: Omit<ComponentDocSpec["sections"][number], "children" | "description">,
  children: React.ReactNode,
) {
  return { ...section, children }
}

export const chartComponentDoc: ComponentDocSpec = {
  slug: "chart",
  summary:
    "Accessible chart primitives over Recharts for trend, comparison, distribution, and pipeline visuals.",
  sections: [ex({ id: "types", title: "Chart types" }, <ChartTabbedPreviewLazy />)],
  anatomy: [
    { part: "ChartContainer", description: "Provides chart config, theme colors, and responsive sizing." },
    { part: "ChartFigure", description: "Wraps the visual chart with heading, caption, and accessible data table." },
    { part: "ChartTooltip", description: "Shared tooltip primitive for Recharts pointer interactions." },
    { part: "ChartCard", description: "Optional dashboard shell for title, filters, tabs, and Ask Leo affordances." },
  ],
  api: [
    { prop: "config", type: "ChartConfig", description: "Maps series keys to labels and theme colors." },
    { prop: "children", type: "ReactNode", description: "Recharts body such as AreaChart, BarChart, PieChart, or RadarChart." },
    { prop: "accessibilityLayer", type: "boolean", defaultValue: "true", description: "Enables Recharts keyboard and screen-reader support where available." },
    { prop: "ChartTooltipContent", type: "component", description: "Shared tooltip renderer with DS typography and series labels." },
  ],
  guidelines: {
    do: [
      "Choose chart type by comparison task: line for trend, bar for category comparison, donut for part-to-whole.",
      "Group specialized variants under a family tab so users can compare related charts quickly.",
      "Pair every chart with a clear title, short description, and accessible data table when values matter.",
      "Use DS chart tokens instead of hard-coded colors so themes and brand switching stay consistent.",
    ],
    dont: [
      "Do not use a donut chart for precise comparisons across many categories.",
      "Do not rely on color alone; include labels, legends, or tooltip copy.",
      "Do not render heavy chart galleries in the route shell; lazy-load demo-heavy chart surfaces.",
    ],
  },
  accessibility: [
    "Set Recharts accessibilityLayer when the chart supports it.",
    "Expose the underlying values in a table, caption, or adjacent summary for screen-reader users.",
    "Keep keyboard focus visible on chart controls, filters, and tab triggers.",
    "Use sufficient contrast for series colors in both light and dark themes.",
  ],
  relatedSlugs: ["chart-card", "key-metrics", "tabs", "data-table"],
}
