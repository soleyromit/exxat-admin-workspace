---
name: exxat-centralized-list-dataset
description: Single canonical dataset and derived row bag for Exxat list hubs — useTableState.rows across table/list/board/dashboard/folder/panel/tree, TablePropertiesDrawer wired to the same table state, shared maps for status/KPIs/inspector. Use when adding a hub view, detail panel, mock data, or fixing inconsistent counts between views.
user-invocable: true
---

# Exxat DS — centralized dataset for list hubs

Goal: **one row model**, **one filtered bag** (`tableState.rows`), **one place for badge/KPI maps**, so **every** view tab and inspector matches after search/filters.

**Canon:** `apps/web/AGENTS.md` §4.1–§4.2, `docs/data-views-pattern.md`, `.cursor/rules/exxat-centralized-list-dataset.mdc`.

---

## 1. Canonical row module

- **`lib/mock/<entity>.ts`** — exported typed **`interface`** / type alias + **`ENTITY_ROWS`** (or equivalent) for mocks.
- Future API: replace **mock export** with **`fetch` + same TS shape**; views stay unchanged.
- **Extend fields once** (e.g. inspector-only columns): add optional props on the **shared** interface — avoid a parallel **`EntityInspectorRow`** that duplicates IDs.

---

## 2. Single table state → all views

| Surface | Data source |
|---------|-------------|
| Table | `useTableState` columns + rows |
| List / Board / Dashboard | **`tableState.rows`** |
| Folder grid | **`tableState.rows`** (+ folder metadata from **`lib/mock/<entity>-folders.ts`** keyed by **`folderId`**, not a second question list) |
| Panel / Finder | **`tableState.rows`** + grouping helpers |
| Tree + detail | **`tableState.rows`** for leaf items; folders from **folder mock**; selected question resolves **by id** from **`tableState.rows`** |

**Anti-pattern:** `import { ENTITY_ROWS } from "..."` inside a view component while the table uses **`useTableState`** — filters won’t match.

**Fix:** Pass **`tableState.rows`** (or setter/updater from parent) into child views; only use raw **`ENTITY_ROWS`** for **initial seed** into **`useTableState`**.

---

## 3. Table properties = same row shape

- **`buildXColumns(rows)`** — column defs use **`accessorKey`** / **`cell`** consistent with the entity interface.
- **`TablePropertiesDrawer`** — **`columns`**, **`columnVisibility`**, density — all tied to the **`DataTable`** instance that shares **`useTableState`**.
- **`currentView`** + **`onViewChange`** — from **`ListPageTemplate`** **`renderContent`** (**§4.2**).

---

## 4. KPIs, dashboards, command palette

- **`entityKpiMetrics(rows)`** / **`entityTopicInsight(rows)`** — take **`tableState.rows`** (filtered).
- Dashboard charts on the hub — same **`rows`** prop as **`KeyMetrics`**.
- ⌘K row search — index **`tableState.rows`** or shared mock through **`lib/command-menu-search-data.ts`** patterns — not a divergent copy (**`docs/command-menu-pattern.md`**).

---

## 5. Status, labels, icons

- **`DATA_LIST_VIEW_TILES`** / **`dataListViewLabel`** — single registry for tab labels/icons.
- Entity status — **`lib/list-status-badges.ts`** (**`ListHubStatusBadge`**) or one **`ENTITY_STATUS_*`** map next to mock data.
- **MUST NOT** hardcode **"Published"** / tint classes in three components when a map already exists.

---

## 6. Implementation checklist (new hub or new view)

- [ ] Exactly **one** primary row array shape in **`lib/mock/<entity>.ts`** (or API).
- [ ] **`useTableState`** seeded from that array; **child views** receive **`tableState.rows`** (or equivalent), **not** a fresh import of the mock list.
- [ ] Board / list / dashboard / folder / panel / tree **all** branch from the same client with shared **`rows`**.
- [ ] Inspector/detail resolves **`selectedId`** with **`rows.find(r => r.id === selectedId)`** (or passes the row object from selection).
- [ ] **`TablePropertiesDrawer`** receives **`currentView`** / **`onViewChange`** + column model from the **same** table.
- [ ] KPI/chart helpers invoked with **`tableState.rows`**.
- [ ] No second mock array unless **derived** (`useMemo(() => rows.filter(...), [rows])`).

---

## 7. Reference implementations

- **`components/placements-client.tsx`** + **`placements-table.tsx`** — Placements pattern.
- **`components/team-client.tsx`** + **`team-table.tsx`**.
- **`components/library-table.tsx`** — multiple **`DataListViewType`** branches sharing **`tableState`** / **`folders`** / **`items`**.

---

## 8. Centralized presentation (with the same dataset)

**Layout:** Non-table view branches wrap in **`ListPageViewFrame`** (constants in **`list-page-view-frame.tsx`**) — see **`.cursor/rules/exxat-list-page-view-shells.mdc`**.

**Components:** Prefer **`components/data-views/*`** primitives (**`FolderGridView`**, **`FinderPanelView`**, board template, etc.) with **`rows`** from **`tableState.rows`**, not a second import of **`ENTITY_ROWS`**.

**Rule:** **`.cursor/rules/exxat-centralized-list-dataset.mdc`** (presentation bullets §8–10).

---

## See also

- `.cursor/rules/exxat-centralized-list-dataset.mdc`
- `.cursor/rules/exxat-list-page-connected-views.mdc`
- `.cursor/rules/exxat-list-page-view-shells.mdc`
- `.cursor/rules/exxat-table-properties-drawer.mdc`
- `.cursor/rules/exxat-data-tables.mdc`
