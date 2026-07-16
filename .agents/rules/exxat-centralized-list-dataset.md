---
description: Single source of truth for hub rows, KPIs, table properties, detail views, and shared view chrome — dataset + presentation consistency across DataListViewType surfaces. Auto-attaches when editing list-hub React files.
activation: glob
globs: {components,lib,src}/**/*.{tsx,ts}
---

<!-- Synced from .agents/rules/exxat-centralized-list-dataset.mdc - run npx exxat-ui sync-extras after Cursor rule edits -->

# Exxat DS — centralized list hub dataset + presentation

**Authoritative detail:** **`./AGENTS.md` §4.1** and **§4.5** (connected views + view shells), **`docs/data-views-pattern.md`**, **`.agents/rules/exxat-list-page-connected-views.md`**, and **`.agents/rules/exxat-list-page-view-shells.md`**. This rule tightens **where data lives** and **where reusable view chrome lives** so **table, list, board, dashboard, folder, panel, tree, and inspectors** never drift.

## Single dataset

1. **Rows** — One typed collection per entity (**`lib/mock/<entity>.ts`** until API wiring). **MUST NOT** maintain a second parallel array (e.g. “tree only” or “panel only”) with overlapping IDs unless it is a **derived view** (computed from the same source via selectors).

2. **`useTableState`** — One instance per tab table; **`tableState.rows`** is the **only** filtered/sorted row bag that **list / board / dashboard / folder / panel / tree** surfaces read. **MUST NOT** bypass filters by importing raw mock arrays into alternate views.

3. **Detail / inspector / finder / split-panel bodies** — Resolve the active record by **`id`** (or stable key) against **`tableState.rows`** (or the same upstream state that feeds **`useTableState`**). **MUST NOT** hydrate inspector fields from ad-hoc literals when the row already exists on the dataset.

4. **Columns & table “properties”** — Column defs **`accessorKey` / cell renderers** map to the **same** row interface as KPI helpers and board cards. **MUST NOT** introduce incompatible duplicate TypeScript shapes per view.

5. **`TablePropertiesDrawer`** — Stays wired to the **`DataTable`** that owns **`useTableState`** (**§4.2**): **`currentView`**, **`onViewChange`**, column visibility/density — all reflect manipulation of the **same** underlying rows.

6. **Labels / status / chips** — Prefer shared maps (**`lib/list-status-badges.ts`**, **`lib/data-list-view.ts`** tiles, entity-specific maps **next to** **`lib/mock/<entity>.ts`**). **MUST NOT** fork label strings or badge colors per view file.

7. **KPIs & charts** — **`MetricItem`** / **`MetricInsight`** builders take **`tableState.rows`** (or equivalent filtered list). Same inputs as the grid after search/filters.

## Centralized presentation (layout + components)

8. **`ListPageViewFrame`** — Non-**`DataTable`** view bodies (**folder**, **panel**, icon grids, comparable dashboard sections) **MUST** use **`ListPageViewFrame`** (and exported max-width constants) instead of copy-pasted **`mx-*` / `max-w-*`** per hub (**`exxat-list-page-view-shells.md`**).

9. **`components/data-views/`** — New **record-bearing** view layouts (**grids**, **OS folder**, **finder split**) **MUST** land as **generic** building blocks under **`data-views/`** with **`rows`**, **`getRowId`**, render props — hub **`TeamTable`** / **`LibraryTable`** **only** wires props and branch logic (**`AGENTS.md` §4.5**).

10. **Hub client composition** — One **`*-client.tsx`** owns **`useTableState`**, passes **`tableState.rows`** into every **`viewType`** branch, and mounts **template** slots (**metrics**, **export**, **`beforeSiteHeader`**) — **MUST NOT** split the same hub across multiple clients with different row sources.

## MUST NOT

- Ship alternate mock datasets per **`DataListViewType`** for the same hub without documenting them as **computed derivatives** of one canonical list.
- Duplicate entity fields in inspector-only types that contradict **`LibraryItem`** / **`Placement`** / etc.; extend the shared interface **once**.

## See also

- **`.agents/skills/exxat-centralized-list-dataset/SKILL.md`** — workflow + checklist.
- **`.agents/rules/exxat-table-properties-drawer.md`** — **`currentView`** / **`onViewChange`**.
- **`exxat-list-page-connected-views.md`** — toolbar + **`tableState.rows`**.
- **`exxat-list-page-view-shells.md`** — **`ListPageViewFrame`** + **`data-views/`** extraction.
