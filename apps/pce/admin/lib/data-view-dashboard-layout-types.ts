/**
 * Shared types/helpers for Data view dashboard layout (hub canvas customise).
 */

export type ChartType =
  | "bar"
  | "horizontal-bar"
  | "pie"
  | "area"
  | "line"
  | "radial"
  | "stacked-bar"

export interface ChartTypeOption {
  type: ChartType
  label: string
  icon: string
}

export interface DashboardCardDef {
  id: string
  title: string
  description: string
  defaultSpan: 1 | 2
  defaultChartType: ChartType
  chartTypes: ChartTypeOption[]
}

export interface DashboardLayout {
  visible: string[]
  order: string[]
  spans?: Record<string, 1 | 2>
  chartTypes?: Record<string, ChartType>
  keyMetricsKpiCount?: number
}

export function applyVisibleReorder(
  fullOrder: string[],
  visible: Set<string>,
  newVisibleOrder: string[],
): string[] {
  let vi = 0
  return fullOrder.map(id => {
    if (!visible.has(id)) return id
    return newVisibleOrder[vi++]!
  })
}
