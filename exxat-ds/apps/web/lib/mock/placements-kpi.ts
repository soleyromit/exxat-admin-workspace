// ─────────────────────────────────────────────────────────────────────────────
// Placements page — KPI strip + insight (data-list; dashboard view uses row-driven helpers)
// ─────────────────────────────────────────────────────────────────────────────

import type { MetricInsight, MetricItem } from "@/components/key-metrics"
import { ALL_PLACEMENTS, type Placement, type Status } from "./placements"

function statusCount(status: Status): number {
  return ALL_PLACEMENTS.filter((p) => p.status === status).length
}

/**
 * KPIs from the current filtered placement set (table/list/board/dashboard shared state).
 * Use for the dashboard view tab; optional for the template metrics strip when you want parity.
 */
export function placementKpiMetricsFromRows(rows: Placement[]): MetricItem[] {
  const total = rows.length
  const startingWeek = rows.filter(p => p.daysUntilStart >= 0 && p.daysUntilStart <= 7).length
  const alerts = rows.filter(p => {
    const r = p.readiness.toLowerCase()
    return r.includes("risk") || r.includes("blocked")
  }).length
  const complete = rows.filter(p => p.compliance === "Complete").length
  const avgPct = total > 0 ? Math.round((complete / total) * 100) : 0

  return [
    {
      id: "total-placements",
      label: "Total Placements",
      value: total,
      delta: "—",
      trend: "neutral",
      href: "#",
      metricVariant: "hero",
    },
    {
      id: "starting-week",
      label: "Starting This Week",
      value: startingWeek,
      delta: "—",
      trend: startingWeek > 0 ? "up" : "neutral",
      href: "#",
    },
    {
      id: "compliance-alerts",
      label: "Readiness alerts",
      value: alerts,
      delta: "—",
      trend: alerts > 0 ? "up" : "neutral",
      href: "#",
    },
    {
      id: "avg-compliance",
      label: "Compliance complete",
      value: `${avgPct}%`,
      delta: "—",
      trend: "neutral",
      href: "#",
    },
  ]
}

export function placementKpiInsightFromRows(rows: Placement[]): MetricInsight {
  const pending = rows.filter(p => p.status === "pending").length
  const inReview = rows.filter(p => p.status === "under-review").length
  const n = rows.length
  return {
    title: "Pending Reviews",
    description:
      n > 0
        ? `${pending} pending, ${inReview} in review in this view. Clear the queue to keep placements moving.`
        : "No placements match the current filters.",
    href: "/placements/reviews",
    severity: pending + inReview > 0 ? "warning" : "info",
    actionLabel: "Ask Leo",
  }
}

/**
 * Placements KPI row — matches design reference (totals + operational metrics).
 */
export const PLACEMENT_KPI_METRICS: MetricItem[] = [
  {
    id: "total-placements",
    label: "Total Placements",
    value: 50,
    delta: "+12",
    trend: "up",
    href: "#all",
    metricVariant: "hero",
  },
  {
    id: "starting-week",
    label: "Starting This Week",
    value: 0,
    delta: "-5",
    trend: "down",
    href: "#starting",
  },
  {
    id: "compliance-alerts",
    label: "Compliance Alerts",
    value: 23,
    delta: "+13",
    trend: "up",
    href: "#alerts",
  },
  {
    id: "avg-compliance",
    label: "Avg Compliance",
    value: "87%",
    delta: "+3",
    trend: "up",
    href: "#compliance",
  },
]

/**
 * Insight copy still derived from live placement rows for the queue narrative.
 */
export function getPlacementInsight(): MetricInsight {
  const pending = statusCount("pending")
  const inReview = statusCount("under-review")

  return {
    title: "Pending Reviews",
    description: `${pending} pending, ${inReview} in review. Clear the queue to keep placements moving.`,
    href: "/placements/reviews",
    severity: "warning",
    actionLabel: "Ask Leo",
  }
}

export const PLACEMENT_KPI_INSIGHT = getPlacementInsight()
