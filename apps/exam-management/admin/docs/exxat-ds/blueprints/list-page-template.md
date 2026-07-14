# Blueprint: List page template

> **Status:** Stable. **Owner:** Design system. **Implements:** SC 1.3.1, 2.1.1, 2.4.3, 2.4.6, 4.1.2.

## 1. Intent

A **list page** is the canonical hub surface for browsing a homogeneous
collection of records (Placements, Team, Compliance, Library items, …).
It pairs a single `DataTable` with view-tab variants (table · list · board ·
dashboard · folder · panel · tree), one shared filter / sort / column model,
and a metric strip that consumes the same filtered row bag.

**Use when:**

- The route is the **primary** destination for an entity (a hub, not a detail).
- Users compare records and filter / sort across them.
- The same dataset can be productively shown as a table **and** as one or more
  alternate views (board, dashboard, etc.).

**Do NOT use when:**

- The page is a **detail** view of a single record (use a record-home page).
- The dataset is < ~10 items and never needs filters (use a card grid).
- The flow is a multi-step **wizard** or **form** (use a primary-page template
  with a focus mode).

## 2. Anatomy

```
┌──────────────────────────────────────────────────────────┐
│  PageHeader  (title · subtitle · primary CTA · ⋯ menu)   │  ← slot: header (required)
├──────────────────────────────────────────────────────────┤
│  KeyMetrics flat band  (≤ 4 tiles · trend chips · …)     │  ← slot: metrics (optional)
├──────────────────────────────────────────────────────────┤
│  View tabs  [ Table · Board · Dashboard · Folder · … ]   │  ← slot: viewTabs (required, ≥ 1)
├──────────────────────────────────────────────────────────┤
│  Toolbar  (search · filter chips · ⋯ properties)         │  ← managed by HubTable
│  ┌─────────────────────────────────────────────────┐     │
│  │  Active view body — TABLE / BOARD / …           │     │  ← rendered by HubTable + renderers
│  └─────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────┘
```

| Slot | Required? | What it carries |
|---|---|---|
| `header` | required | `PageHeader` (object-home / record-home / collaboration variant) |
| `metrics` | optional | `KeyMetrics variant="flat"` — ≤ 4 tiles fed by the same `tableState.rows` |
| `viewTabs` | required (≥ 1) | `ViewTab[]` with `viewType`, `icon`, `label`, optional `filterId` |
| `renderContent` | required | `(tab, updateTab) => ReactNode` that returns the active view body |
| `beforeSiteHeader` | optional | Banner / promo strip rendered above the site header |
| `tablePropertiesRef` | optional | Imperative handle so the ⋯ menu can open the Properties drawer |

`ListPageTemplate` itself owns the **header + metrics + view-tab control**.
The view body is rendered by `HubTable` (or a custom non-table view) and
**shares one `useTableState`** instance across every view.

## 3. States

| State | Visual / behavior |
|---|---|
| Default | Header + metrics + active view body |
| No metrics declared | Metrics band is omitted; no empty gap |
| No rows | Active view shows entity-specific empty state; KPI tiles show zeros + neutral trend |
| Filters applied | Toolbar chips reflect filters; KPI tiles recalculate against filtered rows |
| Switching views | `tab.id` is the React key so table state survives (sort, search, columns) |
| Loading | Render skeleton state in `renderContent`; metric tiles use the `metric-card` skeleton |
| RTL | All chrome (toolbar, view tabs, properties drawer) flips with `dir="rtl"` |

## 4. Tokens consumed

| Token | Used for |
|---|---|
| `--exxat-color-surface-1` / `--background` | Page canvas |
| `--exxat-color-surface-2` / `--card` | Header + table chrome |
| `--exxat-color-surface-muted` / `--muted` | View-tab inactive bg, KPI flat band glow |
| `--exxat-color-brand-1` / `--brand-color` | Active view tab, primary CTA |
| `--exxat-color-border-1` / `--border` | Hairlines between chrome zones |
| `--exxat-color-focus-ring` / `--ring` | `:focus-visible` ring on toolbar / tabs |
| `--exxat-radius-2` / `--radius` | Page chrome radii |

## 5. Accessibility

| WCAG SC | How this blueprint complies |
|---|---|
| 1.3.1 Info & relationships | View tabs use `role="tablist"`; toolbar uses `role="toolbar"`; metrics use `role="group"` + name |
| 2.1.1 Keyboard | Tab through header → tabs → toolbar → grid; arrow keys between tabs and column headers; when view tabs overflow, **`HorizontalScrollRegion`** exposes prev/next buttons |
| 2.4.3 Focus order | Tab order matches reading order top-to-bottom |
| 2.4.6 Headings / labels | Header title is the route `<h1>`; each view tab announces its label |
| 4.1.2 Name / role / value | View tabs expose `aria-selected`; properties drawer toggle has `aria-haspopup="dialog"` |

## 6. Variants

| Variant | When to use | Differences from default |
|---|---|---|
| `base` | Most hubs | Header + metrics + tabs + view body |
| `no-metrics` | Hubs where KPI summary adds noise (e.g. Library: too many heterogeneous folders) | Omit `metrics` prop |
| `with-banner` | Pages that need a promo or alert above the header | Use `beforeSiteHeader` slot |
| `secondary-panel-hub` | Hubs scoped by a sidebar panel (Library) | Wrap in `SecondaryPanelHubTemplate`; same `useTableState` |

## 7. Implementation

| Framework | Component(s) | File |
|---|---|---|
| **React (this app)** | `ListPageTemplate` + `HubTable` + `useTableState` + `TablePropertiesDrawer` | `@exxatdesignux/ui/components/templates/list-page`, `@exxatdesignux/ui/components/data-views`, `@exxatdesignux/ui/components/data-table` |
| Mobile | — | — |
| Figma | Pattern: "List page – hub" frame in the DS library | — |

## 8. Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| One `useTableState` per hub; every view reads `tableState.rows` | Mount a second mock array for "board only" or "tree only" |
| Pass `currentView` + `onViewChange` into `TablePropertiesDrawer` | Leave `currentView` unset on a multi-view hub (Properties drawer assumes table) |
| Use `key={tab.id}` in `renderContent` so table state survives | Use `key={tab.viewType}` (resets state when switching views) |
| Pull metrics from `tableState.rows` so they react to filters / search | Pass raw mock arrays to KPI builders (numbers will lie when filters change) |
| Cap the metrics strip at 4 KPI tiles | Add a fifth tile by raising `KEY_METRICS_KPI_COUNT_MAX` without DS review |
| Wrap the view toolbar in **`HorizontalScrollRegion`** when tabs can overflow | Hand-build flanking chevrons on both ends of the tab bar |

## 9. References

- `apps/web/docs/data-views-pattern.md` — connected views narrative
- `apps/web/docs/horizontal-scroll-pattern.md` — shared scroll controls for view tabs
- `apps/web/docs/kpi-flat-band-pattern.md`, `kpi-strip-max-four-pattern.md`, `kpi-trend-pattern.md`
- `.cursor/rules/exxat-list-page-connected-views.mdc`, `exxat-centralized-list-dataset.mdc`, `exxat-table-properties-drawer.mdc`, `exxat-list-page-view-shells.mdc`
- `apps/web/AGENTS.md` §4.1 (template), §4.2 (Properties drawer), §4.5 (view shells)
