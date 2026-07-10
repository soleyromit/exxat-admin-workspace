/**
 * Dashboard chart grid — row height parity, plot floor, and cell stretch.
 * Narrative / placement rules: `docs/dashboard-chart-layout-pattern.md`.
 */

/** Minimum plot area height (px) — every chart in a row shares this floor. */
export const CHART_DASHBOARD_PLOT_MIN_HEIGHT_PX = 180 as const

/** Tailwind min-height for chart plot wrappers (`ChartContainer` parent). */
export const CHART_DASHBOARD_PLOT_MIN_CLASS = "min-h-[180px]" as const

/** Two-column dashboard row — siblings stretch to equal outer height. */
export const CHART_DASHBOARD_ROW_GRID_CLASS =
  "grid grid-cols-1 gap-4 lg:grid-cols-2 items-stretch" as const

/** Gallery row: wide trend (2/3) + composition (1/3). */
export const CHART_DASHBOARD_ROW_GRID_THIRDS_CLASS =
  "grid grid-cols-1 gap-4 lg:grid-cols-3 items-stretch" as const

/** Grid cell wrapper — passes stretch to `ChartCard` / `KeyMetrics`. */
export const CHART_DASHBOARD_CELL_CLASS = "flex min-h-0 h-full flex-col" as const
