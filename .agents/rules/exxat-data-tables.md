---
description: Exxat DS — product data tables must use HubTable/DataTable with search, filters, table properties; no alternate table stacks. Auto-attaches when editing apps/web React files; ask for it explicitly when designing a list/grid surface.
activation: glob
globs: {components,lib,src}/**/*.{tsx,ts}
---

<!-- Synced from .agents/rules/exxat-data-tables.mdc - run npx exxat-ui sync-extras after Cursor rule edits -->

# Exxat DS — data tables (mandatory pattern)

## Use one stack for product data lists

For **any app screen that shows a browsable, filterable grid of records** (directories, tokens, columns showcase, question banks, etc.):

1. **Inside `ListPageTemplate` (every primary hub + every showcase page that mounts a hub-style grid) MUST use `HubTable`** from `@/components/data-views`. `HubTable` is the **canonical** wrapper that wires `useTableState`, the toolbar (**search + filter chips + filter dropdown + sort**), the **Table properties drawer**, view-type tiles, bulk-actions, and conditional rules in one place. Pages that drop down to raw `<DataTable>` silently lose filters and Properties — **MUST NOT** ship a hub or showcase that way.
2. **Outside `ListPageTemplate`** (rare — e.g. embedded mini-grids, modal sub-tables, drawer body lists), use `DataTable` from `@/components/data-table` directly. Even then, prefer composing a small `toolbarSlot` with `TablePropertiesDrawerButton` whenever the grid is more than a handful of rows.
3. **Pagination:** Wrap with `DataTablePaginated` when server-style paging is required (Placements is the reference).
4. **Search:** `HubTable` wires the toolbar search automatically; only consumers that pass `searchable={false}` to `displayOptionsInit` can opt out, and they MUST justify it in the call-site comment.
5. **Filters:** Set **`cellKind`** on each column; add explicit **`filter:`** when presets need overrides (enum `options`, `options[].node`, `date-range`). `HubTable` derives fields via **`columnsToFilterFields`** + **`resolveColumnFilter`**; person/range filters use **`filterFieldContext`** from table rows. Toolbar chips and Properties drawer **MUST** stay in sync — see **`table-column-cells-pattern.md` § Filters**. **MUST NOT** ship one-off filter inputs above the table.
6. **Table properties:** Always reachable. `HubTable` mounts `TablePropertiesDrawerButton` in `toolbarSlot`; on **`ListPageTemplate`** pages with **table / list / board / dashboard** tabs it **MUST** also receive **`currentView`** and **`onViewChange`** (see **`./AGENTS.md` §4.2** and **`.agents/rules/exxat-table-properties-drawer.md`**) so Properties matches the selected view.
7. **Dropdown menus:** `DropdownMenuContent` uses the shared **`@exxatdesignux/ui`** default (**intrinsic `w-max`**, **`min-w-52`**, capped **`max-w`**) for view settings, row ⋯, column menus, and filter pickers — **pure CSS**, no **`ResizeObserver`**. Override only for deliberate narrow/wide rails (e.g. pagination **`w-20`**, account trigger-width, school switcher **`!w-max min-w-72 …`**). See **`docs/data-views-pattern.md`** (“Dropdown menus”).
8. **Cell renderers MUST come from `@/components/data-views` (`table-cells.tsx`).** Map each **data point** to the correct primitive per **[`table-column-cells-pattern.md`](mdc:docs/exxat-ds/table-column-cells-pattern.md)** — **`.agents/rules/exxat-table-column-cells.md`**, skill **`exxat-table-column-cells`**. The DS ships **`ProgressCell`**, **`CurrencyCell`**, **`NumericCell`**, **`RatingCell`**, **`SignalBarsCell`**, **`BooleanToggleCell`**, **`AttachmentCountCell`**, **`ExternalLinkCell`**, **`RelativeTimeCell`**, **`PeopleAvatarRailCell`**, **`PillCell`**, **`TagListCell`**, and a generic **`RowActionsCell<TRow>`**. **Person identity columns** use **`AvatarInitials` + name + email** (not plain text, not `PeopleAvatarRailCell` for one person). A `ColumnDef['cell']` for these patterns is a **one-liner** that calls the named cell. **MUST NOT** inline `Intl.NumberFormat`, raw `<a target="_blank">`, `[1,2,3,4,5].map(s => …)` star loops, paperclip + count chips, custom face-rail `AvatarGroup`s, or per-hub `DropdownMenu` overflow menus inside `cell:` — those are signals you're re-deriving a shipped primitive. Catalog: `components/columns-showcase.tsx` (`/columns`). Skill: `.agents/skills/exxat-token-economy/SKILL.md` §3.
9. **Add view parity** — **`FULL_HUB_SUPPORTED_VIEWS`** + a real renderer per view — **`.agents/rules/exxat-hub-supported-views.md`**, **`docs/exxat-ds/hub-supported-views-pattern.md`**.

## Table edge inset (no double gutter)

**`DataTable` / `HubTable` own horizontal rhythm** — constants in **`packages/ui/src/lib/table-edge-inset.ts`**:

| Surface | Class constant | Tailwind |
|---------|----------------|----------|
| Toolbar (search, filters, Properties) | `DATA_TABLE_TOOLBAR_INSET_CLASS` | `px-4 lg:px-6` |
| Grid border + pagination chrome | `DATA_TABLE_GRID_INSET_CLASS` | `mx-4 lg:mx-6` |

### MUST

1. Mount **`HubTable` / `DataTable` full-bleed** in the scroll column (`ListPageTemplate`, dashboard sections, drawer bodies). **`ListPageTemplate`** body has **no** extra horizontal padding — the table supplies the gutter.
2. **Dashboard / report embeds** (e.g. `DashboardReportCharts` **`tableSection`**): apply **`px-4 lg:px-6` only to the section intro / actions**; **`HubTable` is a full-width sibling** with no wrapper padding. Reference: **`components/design-os-dashboard-table.tsx`**.

### MUST NOT

- Wrap intro **and** table together in `px-*` / `mx-*` — stacks ~2× inset vs KPI strips and chart sections (Design OS dashboard regression).
- Wrap the table branch in **`ListPageViewFrame`** gutter — same stacking (**`AGENTS.md` §5**, **`exxat-list-page-view-shells.md`**).
- Re-copy `mx-4 lg:mx-6` on a parent “for alignment” — pad sibling content instead.

**Dev guard:** In non-production builds, **`warnIfStackedTableEdgeInset`** logs **`[Exxat DS][DataTable]`** when the **immediate parent** adds horizontal padding/margin.

**Reference implementations:**

- `components/library-table.tsx` + `components/library-client.tsx` — **canonical** seven-view hub (All questions).
- `components/columns-showcase.tsx` — cell-pattern catalog via **`LibraryTable`** (`columnDefs` + folder state); same Add view as Library.
- `components/tokens-themes-client.tsx` + `components/tokens-hub-auxiliary-views.tsx` — tokens hub with **`FULL_HUB_SUPPORTED_VIEWS`**.

## Do not

- Do **not** build product list pages with `@/components/ui/table` alone, raw `<table>` markup, or third-party data grids.
- Do **not** mount raw `<DataTable>` inside `ListPageTemplate.renderContent` — use `HubTable`. Raw `<DataTable>` does not ship the Properties drawer or filter chips; users lose discoverability.
- Do **not** introduce a second “table component” pattern for the same product surfaces (splitting search/filters/properties across incompatible implementations).
- Do **not** inline-implement progress bars, currency formatters, rating stars, relative-time helpers, attachment chips, external-link wrappers, face rails, type pills, tag lists, or row-action dropdowns inside a `ColumnDef['cell']`. Import the named cell from `@/components/data-views` instead. New hub with novel cell needs MUST extend `table-cells.tsx` (and ship the catalog entry in `columns-showcase.tsx`), not fork inline JSX.
- Do **not** trim **`supportedViewTypes`** to table-only or **`PRIMARY_HUB_SUPPORTED_VIEWS`** on hubs that should match Library — see **`exxat-hub-supported-views.md`**.
- Do **not** wrap **`HubTable` / `DataTable`** in parent **`px-*` / `mx-*`** or **`ListPageViewFrame`** gutter — see **Table edge inset** above.

## Exceptions

- **Tiny, read-only tables inside charts or analytics cards** (e.g. chart figure captions / summary matrices) may use minimal markup when they are not primary data-list experiences — still prefer tokens and accessibility, but the full hub stack is not required there.
- **Drawer body and dialog sub-grids** (small, secondary, scoped to a transient flow) — raw `<DataTable>` is acceptable; still expose search if rows > ~10.
- **Documented narrow allowlists** in `lib/*-supported-views.ts` when product truly omits folder/panel/tree (comment required).

## See also

- **`.agents/rules/exxat-table-column-cells.md`** — data point → cell mapping (person avatar column, status badge, etc.).
- **`./AGENTS.md`** — full MUST/MUST NOT, list-page template, primary hubs, checklist.
- **`.agents/rules/exxat-hub-supported-views.md`** — Add view menu + renderer matrix.
