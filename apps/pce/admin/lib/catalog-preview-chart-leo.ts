import type { ChartLeoInsight } from "@/components/leo-insight-indicator"

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
