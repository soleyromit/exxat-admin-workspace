# Blueprint: Data Table

> **Status:** Stable. **Owner:** Exxat DS core. **Implements:** WCAG 2.1 AA. **References:** SC 1.3.1, 2.1.1, 2.4.3, 2.4.6, 2.5.8, 4.1.2.

## 1. Intent

A **data table** is the canonical Exxat surface for browsing a homogeneous,
comparable dataset (placements, team members, questions, compliance records).
It pairs a **sortable / filterable / columnable grid** with a single state
object (`useTableState`) that **every connected view** — list, board,
dashboard, folder, panel — reads from.

**Use when:**
- The hub shows ≥ ~10 comparable records.
- Users need to sort, filter, pin columns, change density, or export the data.
- The hub is a primary nav destination.

**Do NOT use when:**
- The hub is **visual browse** (kanban, gallery, finder) — use
  `ListPageBoardCard` + `data-views/` primitives. See
  [`card-vs-rows-pattern.md`](../card-vs-rows-pattern.md).
- The data is < ~10 rows and never grows — a simple list (or `<dl>`) suffices.
- The view is read-only inside an analytics card — that may use minimal markup
  per [`AGENTS.md` §3](../../AGENTS.md).

## 2. Anatomy

```
┌─ ListPageTemplate ────────────────────────────────────────────────────┐
│ [view tabs] [Add view +]                       [metrics slot]         │
│  ├ DataTableToolbar ──────────────────────────────────────────────┐   │
│  │ [search] [filter chips] [sort] [columns] [⋯ properties]        │   │
│  ├ DataTable header ──────────────────────────────────────────────┤   │
│  │  Col A ↕ │ Col B │ Col C │ …                                   │   │
│  ├ DataTable body  ───────────────────────────────────────────────┤   │
│  │  …rows from `tableState.rows`…                                 │   │
│  ├ DataTablePaginated footer (optional) ──────────────────────────┤   │
│  │  ‹ 1 / N ›                                                     │   │
│  └────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────┘
```

| Slot | Required? | What it carries |
|---|---|---|
| `view tabs` | required when ≥ 1 view type | `table / list / board / dashboard` per `ListPageTemplate` |
| `toolbar.search` | required | `⌘K` / `Ctrl K` find-in-list |
| `toolbar.filter` | required when entity has filterable fields | Shared `FilterFieldDef` chips |
| `toolbar.sort` | optional (column headers also sort) | Multi-column sort summary |
| `toolbar.columns` | required | Column visibility / order chooser |
| `toolbar.overflow` | required | `⋯` → `TablePropertiesDrawer` |
| `header` | required | One row of column heads; sortable cells expose `aria-sort` |
| `body` | required | Rows from **`tableState.rows`** — no parallel data source |
| `pagination` | optional | When the result set exceeds the virtualization budget |

## 3. States

| State | Visual / behavior |
|---|---|
| Empty result | Inline empty-state row (icon + 1 sentence + clear filters action) |
| Empty entity | Empty-state card (no rows in entity) |
| Loading | Skeleton header + 5 skeleton rows; toolbar still interactable |
| Sorted | Active column shows ↑ / ↓ with `aria-sort`; multi-sort shows index pill |
| Filtered | Chips in toolbar; "X of Y" indicator |
| Selected rows | Row check + bulk-action bar above toolbar |
| Pinned cells | Opaque using `--dt-row-bg` / `--dt-header-bg` (never translucent) |
| New row (just created) | `--dt-new-row-bg` + `--dt-new-row-border` (fades after N seconds) |
| RTL | Header sort arrows and column resize handles mirror |

## 4. Tokens consumed

| Token | Used for |
|---|---|
| `--dt-row-bg`, `--dt-row-hover`, `--dt-row-selected`, `--dt-row-selected-fg` | Row chrome (must be **opaque** for pinned cells) |
| `--dt-header-bg`, `--dt-group-bg` | Header + group rows |
| `--dt-new-row-bg`, `--dt-new-row-border` | "Just created" highlight |
| `--sticky-edge-fade` | Edge-of-pinned-column gradient |
| `--border` | Hairlines between rows / columns |
| `--ring` | Focus ring on cells, sort headers, row actions |
| `--interactive-hover-row` | Hover-row tint |
| `--avatar-initials-bg`, `--avatar-initials-fg` | Initials cells |
| `--font-mono` (via `font-mono tabular-nums` class) | System IDs in cells |
| `--table-row-height` | Default row height (`48px * --scaling`) |

## 5. Accessibility

| WCAG SC | How this blueprint complies |
|---|---|
| 1.3.1 Info & relationships | `<table>` / `<thead>` / `<tbody>` / `<tr>` / `<th scope="col">` semantics preserved through TanStack Table renderers |
| 1.4.3 Contrast | Row hover + selection tints stay ≥ 4.5:1 against `--foreground` |
| 1.4.11 UI contrast | Cell borders use `--border`; focus uses `--ring` (≥ 3:1) |
| 2.1.1 Keyboard | Cells reachable by `Tab`; arrow-key cell nav inside the body; `Esc` clears active filter chip |
| 2.4.3 Focus order | Header → toolbar → body → pagination; never traps |
| 2.4.6 Headings & labels | Column heads are `<th>` with visible text labels; icon-only sort affordance carries `aria-label` + `Tooltip` (SC 1.1.1 Case C) |
| 2.5.8 Target size | Sort handles, sort/filter chips, row checkboxes ≥ 24×24 CSS px |
| 4.1.2 Name, role, value | Sortable headers expose `aria-sort`; row selection checkboxes expose checked state |

## 6. Variants

| Variant | When to use | Differences |
|---|---|---|
| `DataTable` | Default — virtualized, sticky header | All features above |
| `DataTablePaginated` | Server-paginated result sets where virtualization is wrong | Page footer + page-size selector |
| `DataTable size="compact"` | Dense data (admin tools, reconciliation views) | Reduced `--table-row-height` |

## 7. Implementation

| Framework | Component(s) | File |
|---|---|---|
| **React (this app)** | `DataTable`, `DataTablePaginated`, `useTableState`, `DataTableToolbar`, `TablePropertiesDrawer`, **importable cell renderers** in `components/data-views/table-cells.tsx` (`ProgressCell`, `CurrencyCell`, `RatingCell`, `RowActionsCell<TRow>`, …) | [`packages/ui/src/components/data-table/`](../../../../packages/ui/src/components/data-table/), [`apps/web/components/data-views/table-cells.tsx`](../../components/data-views/table-cells.tsx), [`packages/ui/src/components/table-properties/`](../../../../packages/ui/src/components/table-properties/) |
| Mobile | — | — |
| Figma | — | — |

Reference compositions:

- **Placements** — `PlacementsClient` + `PlacementsTable` (most complete reference)
- **Team** — `TeamClient` + `TeamTable`
- **Compliance** — `ComplianceClient` + `ComplianceTable`
- **Library** — `LibraryClient` + `LibraryTable` (adds folder
  scope from URL)

## 8. Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| Use **one** `useTableState` per logical table; pass `tableState.rows` to every connected view (list/board/dashboard) | Hydrate a board / list view from a parallel mock array — the count will diverge from the table |
| Wrap the table in `ListPageTemplate` so view tabs exist | Render `DataTable` directly under `PageHeader` for a primary hub |
| Pass `currentView` + `onViewChange` to `TablePropertiesDrawer` so Properties matches the active tab | Mount `TablePropertiesDrawer` on a multi-view page without `currentView` — it defaults to "Table display" copy on Board |
| Use `font-mono tabular-nums` on system IDs only | Apply `font-mono` to names, statuses, or dates |
| Mark sort headers with `aria-sort` and visible direction glyph | Use color alone to communicate sort direction |
| Search keyboard hint shows `⌘K` (no Alt) | Use `⌘⌥K` for the table search — that chord is Ask Leo |

## 9. References

- [`apps/web/docs/data-views-pattern.md`](../data-views-pattern.md) — architecture narrative
- [`.cursor/rules/exxat-data-tables.mdc`](../../../.cursor/rules/exxat-data-tables.mdc) — the mandatory stack
- [`.cursor/rules/exxat-list-page-connected-views.mdc`](../../../.cursor/rules/exxat-list-page-connected-views.mdc) — `tableState.rows` across views
- [`.cursor/rules/exxat-centralized-list-dataset.mdc`](../../../.cursor/rules/exxat-centralized-list-dataset.mdc) — one dataset rule
- [`.cursor/rules/exxat-table-properties-drawer.mdc`](../../../.cursor/rules/exxat-table-properties-drawer.mdc) — Properties drawer + active view
- [`apps/web/AGENTS.md`](../../AGENTS.md) §3, §4, §5
