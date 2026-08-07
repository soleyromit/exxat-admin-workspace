---
description: ListPageTemplate — shared table state across views, mock + KPI helpers, dashboard tab. Auto-attaches when editing list-page React clients.
activation: glob
globs: {components,lib,src}/**/*.{tsx,ts}
---

<!-- Synced from .agents/rules/exxat-list-page-connected-views.mdc - run npx exxat-ui sync-extras after Cursor rule edits -->

# Exxat DS — list page connected views

**Authoritative detail:** **`./AGENTS.md` §4.1** and **`docs/exxat-ds/data-views-pattern.md`** (mock data, connected views, dashboard view).

## When building `ListPageTemplate` + data client

1. **One `useTableState` per tab’s table** — Pass full mock/API rows into a single table component; **`list` / `board` / `dashboard`** surfaces consume **`tableState.rows`** (same filters/search/sort as the grid).
2. **`renderContent`** — Always pass **`view={tab.viewType}`**; use **`key={tab.id}`** (not `viewType`) so switching views does not reset table state. Pass **`onViewChange`** into the table component so **`TablePropertiesDrawer`** stays aligned (**`currentView`** + **`updateTab({ viewType, icon: dataListViewIcon(viewType) })`** — see **`./AGENTS.md` §4.2** and **`.agents/rules/exxat-table-properties-drawer.md`**).
3. **Mock data** — Typed arrays in **`lib/mock/<entity>.ts`**; KPI builders in **`lib/mock/<entity>-kpi.ts`** returning **`MetricItem[]`** / **`MetricInsight`** from **`@/components/key-metrics`**.
4. **Dashboard view tab** — Use **`KeyMetrics`** (`variant="flat"` or `"card"`) and the **same** KPI functions with **`tableState.rows`**. Do **not** add standalone `Card` metric grids that duplicate those numbers. For chart-heavy dashboards reuse **`ChartsOverview`** / **`DashboardTabs`** patterns from the main dashboard route when appropriate.
5. **List hub metrics strip** — Prefer **`KeyMetrics variant="flat"`** on **`ListPageTemplate`** **`metrics`** slot (transparent band, brand glow only) — **`docs/kpi-flat-band-pattern.md`**, **`.agents/rules/exxat-kpi-flat-band.md`**. Keep the **insight rail beside KPIs** on `lg+` (default side rail with **`metricsSingleRow`** — **do not** use **`insightFullWidth`** unless product drops the rail). **`ListPageTemplate`** wraps metrics in **`shrink-0`** so the band never compresses into view tabs.
6. **MUST NOT** ship “not wired” / “switch to table” placeholders for list/board/dashboard when the stack supports those views.
7. **Hub scroll (table / list / board)** — One **`[data-page-scroll]`** owner; KPIs, tabs, toolbar, and view body scroll together. Use **`toolbarShell`** for board/list — **`.agents/rules/exxat-list-page-hub-scroll.md`**. **MUST NOT** nest `overflow-y-auto` under view tabs for those views.
8. **MUST NOT** add a **primary nav** destination that is only placeholder copy with no **`ListPageTemplate`** hub, mock rows, and wired views — see **`./AGENTS.md` §4.1** (no empty hubs).
9. **Add view parity** — Use **`FULL_HUB_SUPPORTED_VIEWS`** (default) and implement **all seven** views with real bodies — **`.agents/rules/exxat-hub-supported-views.md`**. List rows **MUST** use **`ListPageBoardCard`** (`library-table.tsx`), not bare title + id lines.

## See also

- **`.agents/rules/exxat-centralized-list-dataset.md`** — single **`tableState.rows`** source for every hub view, inspectors, and **`TablePropertiesDrawer`** on the same **`DataTable`**.
- **Centered view bodies + reusable shells:** **`./AGENTS.md` §4.5**, **`.agents/rules/exxat-list-page-view-shells.md`**, **`ListPageViewFrame`** in **`components/data-views/list-page-view-frame.tsx`**.
- **Flat KPI band:** **`docs/kpi-flat-band-pattern.md`**, **`.agents/rules/exxat-kpi-flat-band.md`**.
- **Hub supported views:** **`docs/hub-supported-views-pattern.md`**, **`.agents/rules/exxat-hub-supported-views.md`**.
