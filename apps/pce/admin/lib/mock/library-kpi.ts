import type { MetricInsight, MetricItem } from "@/components/key-metrics"
import type { LibraryItem, LibraryItemType } from "@/lib/mock/library"

/** Quality score below this mock threshold counts as a review flag. */
const PBI_REVIEW_THRESHOLD = 0.2

const TYPE_LABEL: Record<LibraryItemType, string> = {
  multiple_choice: "Type 1",
  true_false: "Type 2",
  short_answer: "Type 3",
}

export function libraryKpiMetrics(rows: LibraryItem[]): MetricItem[] {
  const mcq = rows.filter(r => r.type === "multiple_choice").length
  const tf = rows.filter(r => r.type === "true_false").length
  const sa = rows.filter(r => r.type === "short_answer").length
  const writtenTypes = tf + sa
  const lowPbiFlags = rows.filter(r => r.pbi != null && r.pbi < PBI_REVIEW_THRESHOLD).length

  return [
    {
      id: "total",
      label: "Total items",
      value: rows.length,
      delta: "",
      trend: "neutral",
      href: "#",
      metricVariant: "hero",
      chart: {
        kind: "sparkline",
        series: [
          { value: Math.max(0, rows.length - 4), label: "W1" },
          { value: Math.max(0, rows.length - 3), label: "W2" },
          { value: Math.max(0, rows.length - 2), label: "W3" },
          { value: Math.max(0, rows.length - 1), label: "W4" },
          { value: rows.length, label: "W5" },
        ],
      },
    },
    {
      id: "mcq",
      label: TYPE_LABEL.multiple_choice,
      value: mcq,
      delta: "",
      trend: "neutral",
      href: "#",
      chart: {
        kind: "bars",
        tone: "info",
        series: [
          { value: Math.max(1, mcq - 2), label: "Mon" },
          { value: Math.max(1, mcq - 1), label: "Tue" },
          { value: mcq || 1, label: "Wed" },
          { value: Math.max(1, mcq - 1), label: "Thu" },
          { value: mcq || 1, label: "Fri" },
        ],
      },
    },
    {
      id: "written",
      label: "Type 2 & 3",
      value: writtenTypes,
      delta: "",
      trend: "neutral",
      href: "#",
    },
    {
      id: "pbi-flags",
      label: "Review flags",
      value: lowPbiFlags,
      delta: lowPbiFlags >= 2 ? "+1" : "",
      trend: lowPbiFlags >= 2 ? "up" : "neutral",
      trendPolarity: "lower_is_better",
      href: "#",
      alert: lowPbiFlags >= 2 ? "danger" : lowPbiFlags >= 1 ? "warning" : undefined,
      chart:
        lowPbiFlags > 0
          ? {
              kind: "sparkline",
              tone: "danger",
              series: [
                { value: 0, label: "W1" },
                { value: 1, label: "W2" },
                { value: 1, label: "W3" },
                { value: Math.max(1, lowPbiFlags - 1), label: "W4" },
                { value: lowPbiFlags, label: "W5" },
              ],
            }
          : undefined,
    },
  ]
}

export function libraryKpiInsight(rows: LibraryItem[]): MetricInsight {
  const hard = rows.filter(r => r.difficulty === "hard").length
  const topics = new Set(rows.map(r => r.topic)).size
  return {
    title: "Library snapshot",
    description:
      rows.length === 0
        ? "Add items to populate metrics and charts."
        : hard > 3
          ? `${hard} high-level items in this view — balance with lower-level items where helpful.`
          : `${rows.length} item${rows.length === 1 ? "" : "s"} across ${topics} categor${topics === 1 ? "y" : "ies"} in the filtered set.`,
    href: "/library/all",
    severity: hard > 3 ? "warning" : "info",
    actionLabel: "Ask Leo",
  }
}
