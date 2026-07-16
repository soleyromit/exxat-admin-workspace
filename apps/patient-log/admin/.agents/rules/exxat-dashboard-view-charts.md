---
description: Data view dashboard — centralized charts, storage, keyboard parity with gallery, edit layout, coach marks
activation: model_decision
---

<!-- Synced from .agents/rules/exxat-dashboard-view-charts.mdc - run npx exxat-ui sync-extras after Cursor rule edits -->

# Exxat DS — Data view dashboard (list hubs)

**Authoritative detail:** **`./AGENTS.md` §4.3** and **`exxat-dashboard-view-charts`** (this rule).

## Two dashboard surfaces (do not fork chart engines)

**Chart wrapper:** **`exxat-chart-cards.md`** — `ChartCard` only; ask user for variant when unspecified.

| Surface | Entry | Shared building blocks |
|--------|--------|-------------------------|
| **Full-page dashboard** | `src/views/dashboard.tsx` | `DashboardTabs`, `ChartsOverview` / gallery demos in `charts-overview.tsx` |
| **Data tab** on a hub | `library-table.tsx` → `LibraryDashboardChartsSection` (reference) | `ChartFigure`, `ChartCard`, `useChartVariant()`, the hub's own `*-dashboard-charts.tsx` module |

**MUST NOT** duplicate “another” chart system for Data view — extend **`charts-overview`** patterns and **`lib/chart-keyboard-selection`**.

## MUST — embedded tables on full-page dashboard

- **`DashboardReportCharts` `tableSection`:** Pad **section intro / actions** with `px-4 lg:px-6` only; **`HubTable` full-bleed** as a sibling — **MUST NOT** wrap intro + table in one padded container (**`exxat-data-tables.md`** → Table edge inset). Reference: **`design-os-dashboard-table.tsx`**.

## MUST — accessibility & data

1. **`ChartFigure`** + **`ChartDataTable`** (`sr-only`) for every chart on the Data dashboard — same as **`charts-overview.tsx`**.
2. **`ChartCard`** wraps chart content; **`KeyMetrics`** **`variant="card"`** for the **`key-metrics`** tile; KPI count **1–4** persisted in layout.

## MUST — keyboard selection (parity with `/dashboard` gallery)

- Import **`CHART_KBD_ACTIVE_BAR`** and **`CHART_KBD_ACTIVE_PIE_SHAPE`** from **`@/lib/chart-keyboard-selection`**.
- **Bar** series: **`activeBar={CHART_KBD_ACTIVE_BAR}`** + **`activeIndex={activeIndex ?? undefined}`** (and **`Cell`** only for per-bar **fill**, not opacity-only selection).
- **Pie / donut:** **`activeShape={CHART_KBD_ACTIVE_PIE_SHAPE}`** + **`activeIndex`** + slice **`stroke`** / **`strokeWidth`** consistent with gallery donuts.
- **MUST NOT** use **`fillOpacity` dimming alone** on **`Cell`** as the sole “selected” state for keyboard exploration.

## MUST — customisation UX

- **Edit layout** control: **`aria-label="Edit dashboard layout"`** (toolbar pen-ruler). Coach marks may target **`[aria-label='Edit dashboard layout']`**.
- On-canvas: drag reorder, remove, width (half / full), chart type, add/remove cards, reset. **No** separate Sheet for layout.
- While **`layoutEditMode`**: hide **`DataTableToolbar`** (search / filters / Properties row); **Done** / **Cancel** on canvas.

## MUST — persistence (centralized)

- **One bundle:** **`lib/data-view-dashboard-storage.ts`** — key **`exxat-ds:data-view-dashboards:v1`**. Each hub registers under a scope string (e.g. **`library`**); add new scopes there, never invent a sibling `localStorage` key.
- Hub-side: pair **`loadDataViewLayout`** + **`saveDataViewLayout`** with **`mergeDashboardLayoutGeneric`** (`lib/dashboard-layout-merge.ts`) for default-layout safety. Reference: the Library dashboard wiring inside **`library-table.tsx`** + **`library-dashboard-charts.tsx`**.
- **MUST NOT** introduce parallel **`localStorage`** keys for the same **`DashboardLayout`** shape without updating the storage module.

## SHOULD — coach marks

- Register **customize dashboard** flows in **`lib/coach-mark-registry.ts`**; shared copy in **`lib/dashboard-customize-coach-mark.ts`**.
- Use **`useCoachMark`** **`enabled`** / **`dependsOnDismissedFlowId`** when a tour only applies on **dashboard** view or after another flow (**`COACH_MARK_FLOW_COMPLETED_EVENT`**).

## Reference files

- `components/library-dashboard-charts.tsx` — canonical Data-tab dashboard section (`LibraryDashboardChartsSection`) — chart cards, `MetricsCard`, layout-edit toolbar.
- `components/library-table.tsx` — dashboard tab body wires `LibraryDashboardChartsSection` + layout-edit toolbar inline (no separate `DashboardShell` component).
- `components/charts-overview.tsx` — full-page dashboard chart gallery referenced from `src/views/dashboard.tsx`.
- `lib/chart-keyboard-selection.ts`, `lib/data-view-dashboard-storage.ts`, `lib/dashboard-customize-coach-mark.ts`
