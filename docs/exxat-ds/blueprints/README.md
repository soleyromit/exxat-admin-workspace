# Exxat DS — Blueprints

**Audience:** humans + AI agents.
**Inspired by:** [SLDS Component Blueprints](https://www.lightningdesignsystem.com/components).

A **blueprint** is a **framework-agnostic spec** for a UI pattern. It says
*what* the pattern is, *what it must do*, and *what tokens it consumes* —
**without committing to any one implementation**.

A **component** is the React + Tailwind implementation that satisfies the
blueprint inside this app.

| Blueprint says… | Component does… |
|---|---|
| "A page header has a title, optional icon, optional meta line, optional action slot, optional `+ N collaborators` rail" | `PageHeader` renders that with `variant="object-home" / "record-home" / "collaboration"` etc. |
| "A data list is a sortable, filterable, columnable grid of records with search, properties drawer, and view tabs" | `DataTable` + `ListPageTemplate` + `TablePropertiesDrawer` compose to satisfy this |

---

## Why blueprints exist

1. **They survive framework changes.** If we ever ship a second consumer
   (mobile, embed widget, design-token export to Figma), the blueprint stays
   true; only the implementation changes.
2. **They make the design language explicit.** New contributors can read a
   single page that says "this is what a page header **is** at Exxat" without
   spelunking through React props.
3. **They let designers, engineers, and AI agents share one vocabulary.** The
   blueprint is the contract; the React component is the receipt.

---

## Anatomy of a blueprint doc

Each blueprint follows the same template. Copy it from
[`_template.md`](./_template.md) when adding a new one.

```
# <Blueprint name>

## 1. Intent          → What user need does this solve? When NOT to use it.
## 2. Anatomy         → Required + optional slots, with an ASCII or markdown sketch.
## 3. States          → Default, hover, active, disabled, loading, empty, error, RTL.
## 4. Tokens consumed → Exact token names from `docs/token-taxonomy.md`.
## 5. Accessibility   → Roles, focus order, keyboard, screen-reader.
## 6. Variants        → Named families that share anatomy but swap layout/density.
## 7. Implementation  → Table of frameworks → component(s); React is required.
## 8. Do / Don't      → Anti-patterns + correct alternatives.
## 9. References      → Linked AGENTS.md sections, cursor rules, related blueprints.
```

The React row in §7 is **required**; other frameworks are listed as `—` until
they ship.

---

## Authoritative file pointers

For most patterns, the blueprint complements an existing narrative doc — it
does **not** replace it. The blueprint is the spec; the narrative is the deep
dive.

| Blueprint | Narrative doc | Cursor rule(s) | React component(s) |
|---|---|---|---|
| [page-header](./page-header.md) | `apps/web/docs/data-views-pattern.md` (Page header section) | `exxat-collaboration-access.mdc` (variant), `exxat-mono-ids.mdc` (subtitle IDs) | `PageHeader`, `PlacementsPageHeader`, `TeamPageHeader`, `LibraryPageHeader` |
| [data-table](./data-table.md) | `apps/web/docs/data-views-pattern.md` | `exxat-data-tables.mdc`, `exxat-list-page-connected-views.mdc`, `exxat-centralized-list-dataset.mdc`, `exxat-table-properties-drawer.mdc` | `DataTable`, `DataTablePaginated`, `useTableState`, `TablePropertiesDrawer` |
| [list-page-template](./list-page-template.md) | `apps/web/docs/data-views-pattern.md`, `kpi-flat-band-pattern.md` | `exxat-list-page-connected-views.mdc`, `exxat-centralized-list-dataset.mdc`, `exxat-table-properties-drawer.mdc`, `exxat-list-page-view-shells.mdc` | `ListPageTemplate`, `HubTable`, `useTableState`, `TablePropertiesDrawer` |
| [board-card](./board-card.md) | `apps/web/docs/data-views-pattern.md` (board UI section) | `exxat-board-cards.mdc`, `exxat-centralized-list-dataset.mdc`, `exxat-card-vs-list-rows.mdc` | `ListPageBoardCard`, `ListPageBoardCardTitleRow`, `ListPageBoardCardBadgeRow`, `BoardCardTwoLineBlock`, `BoardCardIconRow`, `ListHubStatusBadge` |
| [key-metrics](./key-metrics.md) | `apps/web/docs/kpi-flat-band-pattern.md`, `kpi-strip-max-four-pattern.md`, `kpi-trend-pattern.md` | `exxat-kpi-flat-band.mdc`, `exxat-kpi-max-four.mdc`, `exxat-kpi-trends.mdc` | `KeyMetrics`, `MetricItem`, `MetricInsight`, `KeyMetricsProvider` |

Future blueprints to write (open a PR when adding one):

- `drawer-vs-dialog.md` — overlay decision (already in `docs/drawer-vs-dialog-pattern.md`, formalize as blueprint)
- `command-menu.md` — global ⌘K palette + Ask Leo split
- `dedicated-search.md` — landing vs results
- `sidebar.md` — primary nav + secondary panel + product switcher
- `coach-mark.md` — onboarding tours
- `status-badge.md` — `ListHubStatusBadge` + `lib/list-status-badges.ts`

---

## See also

- [`apps/web/docs/token-taxonomy.md`](../token-taxonomy.md) — the design-token namespace these blueprints reference
- [`apps/web/docs/component-selection-guide.md`](../component-selection-guide.md) — decision tree across blueprints
- [`apps/web/AGENTS.md`](../../AGENTS.md) §9 architecture pointers (component reuse table)
