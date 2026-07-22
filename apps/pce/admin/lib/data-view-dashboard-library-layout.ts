/**
 * Library **Data** view dashboard — card ids, defaults, and persistence.
 */

import {
  KEY_METRICS_KPI_COUNT_DEFAULT,
  mergeDashboardLayoutGeneric,
} from "@/lib/dashboard-layout-merge"
import type { ChartType, DashboardCardDef, DashboardLayout } from "@/lib/data-view-dashboard-layout-types"
import {
  loadDataViewLayout as loadStoredDataViewLayout,
  saveDataViewLayout as saveStoredDataViewLayout,
} from "@/lib/data-view-dashboard-storage"

export type { ChartType, DashboardCardDef, DashboardLayout } from "@/lib/data-view-dashboard-layout-types"
export { applyVisibleReorder } from "@/lib/data-view-dashboard-layout-types"

export const KEY_METRICS_CARD_ID = "key-metrics"

export const ALL_DASHBOARD_CARDS: DashboardCardDef[] = [
  {
    id: KEY_METRICS_CARD_ID,
    title: "Key metrics",
    description: "Summary KPIs for filtered questions",
    defaultSpan: 2,
    defaultChartType: "bar",
    chartTypes: [],
  },
  {
    id: "by-item-type",
    title: "By item type",
    description: "Filtered question set",
    defaultSpan: 1,
    defaultChartType: "bar",
    chartTypes: [
      { type: "bar", label: "Bar", icon: "fa-light fa-chart-bar" },
      { type: "pie", label: "Donut", icon: "fa-light fa-chart-pie" },
    ],
  },
  {
    id: "by-topic",
    title: "By topic",
    description: "Up to eight topics",
    defaultSpan: 1,
    defaultChartType: "horizontal-bar",
    chartTypes: [
      { type: "horizontal-bar", label: "Horizontal bar", icon: "fa-light fa-chart-bar fa-rotate-90" },
      { type: "bar", label: "Bar", icon: "fa-light fa-chart-bar" },
    ],
  },
]

export const DEFAULT_VISIBLE_CARDS = ALL_DASHBOARD_CARDS.map(c => c.id)
export const DEFAULT_SPANS: Record<string, 1 | 2> = Object.fromEntries(
  ALL_DASHBOARD_CARDS.map(c => [c.id, c.defaultSpan]),
)
export const DEFAULT_CHART_TYPES: Record<string, ChartType> = Object.fromEntries(
  ALL_DASHBOARD_CARDS.map(c => [c.id, c.defaultChartType]),
)

export function loadDashboardLayout(): DashboardLayout | null {
  const v = loadStoredDataViewLayout("library")
  if (!v) return null
  return {
    visible: v.visible,
    order: v.order,
    spans: v.spans,
    chartTypes: v.chartTypes as Record<string, ChartType> | undefined,
    keyMetricsKpiCount: v.keyMetricsKpiCount,
  }
}

export function mergeDashboardLayout(saved: DashboardLayout | null): DashboardLayout {
  const defaults = {
    visible: [...DEFAULT_VISIBLE_CARDS],
    order: ALL_DASHBOARD_CARDS.map(c => c.id),
    spans: { ...DEFAULT_SPANS },
    chartTypes: { ...DEFAULT_CHART_TYPES } as Record<string, string>,
    keyMetricsKpiCount: KEY_METRICS_KPI_COUNT_DEFAULT,
  }
  const ids = ALL_DASHBOARD_CARDS.map(c => c.id)
  const m = mergeDashboardLayoutGeneric(saved, defaults, ids)
  return {
    visible: m.visible,
    order: m.order,
    spans: m.spans as Record<string, 1 | 2>,
    chartTypes: m.chartTypes as Record<string, ChartType>,
    keyMetricsKpiCount: m.keyMetricsKpiCount,
  }
}

export function saveDashboardLayout(layout: DashboardLayout) {
  saveStoredDataViewLayout("library", {
    visible: layout.visible,
    order: layout.order,
    spans: layout.spans,
    chartTypes: layout.chartTypes as Record<string, string> | undefined,
    keyMetricsKpiCount: layout.keyMetricsKpiCount,
  })
}
