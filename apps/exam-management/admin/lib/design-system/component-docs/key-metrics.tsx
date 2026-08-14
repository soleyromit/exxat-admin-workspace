"use client"

import * as React from "react"

import type { ComponentDocSpec } from "@/lib/design-system/component-doc-types"
import { CatalogKeyMetricsPreview } from "@/components/catalog-live-previews"
import {
  CardKpiInCardPreview,
  KeyMetricsCardsPreview,
} from "@/components/design-system/layout-previews"

function ex(
  section: Omit<ComponentDocSpec["sections"][number], "children" | "description">,
  children: React.ReactNode,
  description?: string,
) {
  return { ...section, description, children }
}

export const keyMetricsComponentDoc: ComponentDocSpec = {
  slug: "key-metrics",
  summary:
    "KPI strip for hubs and dashboards — ≤ 4 headline metrics with optional trend chips and a single MetricInsight narrative. Choose flat (list hubs), card (one dashboard tile), or cards (one Card per KPI).",
  extraImports: [
    { label: "KeyMetricsProvider", path: "@exxatdesignux/ui/components/key-metrics" },
    { label: "metricTrendTone", path: "@exxatdesignux/ui/components/key-metrics" },
    { label: "KPI builders", path: "@/lib/mock/library-kpi" },
  ],
  sections: [
    ex(
      { id: "variants", title: "Variants" },
      <CatalogKeyMetricsPreview />,
      "Flat band under list headers; card strip for dashboard tiles; metric cards for browse-style overviews.",
    ),
    ex(
      { id: "card-strip", title: "Card strip" },
      <CardKpiInCardPreview />,
      "variant=\"card\" — one Card wraps the hairline KPI grid plus optional insight rail.",
    ),
    ex(
      { id: "metric-cards", title: "Metric cards" },
      <KeyMetricsCardsPreview />,
      "variant=\"cards\" — each KPI in its own Card; insight stacks full-width below the grid.",
    ),
  ],
  anatomy: [
    { part: "metrics", description: "MetricItem[] (≤ 4) — label, value, delta, trend, optional href." },
    { part: "insight", description: "MetricInsight — severity badge, title, body, Ask Leo CTA." },
    { part: "variant", description: "flat | card | cards | compact — surface + layout." },
    { part: "KeyMetricsProvider", description: "Host bridge for default Ask Leo action + shortcut hint." },
  ],
  features: [
    {
      group: "Layout",
      icon: "fa-chart-line",
      items: [
        { part: "variant=\"flat\"", description: "Transparent band with brand glow — list-page headers." },
        { part: "variant=\"card\"", description: "Single dashboard tile with header, period select, Ask Leo." },
        { part: "variant=\"cards\"", description: "Card per KPI — value, mini bar, caption below." },
        { part: "progress + progressMax", description: "Card-tile mini bar fill (0–100 or count/max)." },
        { part: "description", description: "Caption below value + bar on card tiles." },
        { part: "variant=\"compact\"", description: "Metrics-only Card — embedded analytics." },
      ],
    },
    {
      group: "Trends",
      icon: "fa-arrow-trend-up",
      items: [
        { part: "trend + delta", description: "Direction icon + count; hidden when neutral with empty delta." },
        { part: "trendPolarity", description: "Flip sentiment when an increase is unfavorable." },
      ],
    },
  ],
  ux: {
    whenToUse: [
      "Headline hub numbers that update with filters/search (same row bag as HubTable).",
      "Dashboard Data tab or analytics sections needing ≤ 4 KPIs.",
      "Browse-style overviews where each metric should read as its own tile (variant=\"cards\").",
    ],
    whenNotToUse: [
      "More than four headline metrics — push overflow into MetricInsight, charts, or another section.",
      "Long-form time series — use Chart / ChartCard instead.",
    ],
  },
  relatedSlugs: ["card", "chart-card", "kpi-flat-band", "coach-mark"],
}
