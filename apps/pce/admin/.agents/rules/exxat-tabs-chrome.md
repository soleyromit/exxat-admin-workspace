---
description: Exxat DS — when to use Tabs vs ViewSegmentedControl vs DropdownMenu; tabs chrome must not stretch full width
activation: glob
globs: {components,lib,src}/**/*.{tsx,ts}
---

<!-- Synced from .agents/rules/exxat-tabs-chrome.mdc - run npx exxat-ui sync-extras after Cursor rule edits -->

# Exxat DS — tabs & choice controls

## Quick decision (MUST follow)

| User is choosing… | Use | Example |
|-------------------|-----|---------|
| **Entity section** (different content regions, bookmarkable) | **`Tabs`** `w-fit` + `variant="line"` | Student Overview · Academics · Placements |
| **Hub view type** (table / board / dashboard) | **`ListPageTemplate`** toolbar → **`ViewSegmentedControl`** | Placements view switcher — **not** Radix `Tabs` |
| **Mode / filter** (2–5 options, stays on same surface) | **`ButtonSegmentedControl`** or **`ViewSegmentedControl`** (hub views) | Theme preview, chart type, card width, KPI count |
| **Many or infrequent options** (6+, or save toolbar space) | **`DropdownMenu`** on **`Button`** `size="icon"` or `variant="outline"` | Period, program, cohort; ⋯ overflow |
| **Settings tile pick** (large labeled choices) | **`SelectionTileGrid`** | Settings → Theme, Contrast |

```
Is it primary navigation between named sections of one record?
  YES → Tabs (w-fit, line)
  NO  → Is it ≤5 modes/filters on the same route?
          YES → ButtonSegmentedControl or ViewSegmentedControl (hubs)
          NO  → DropdownMenu (icon trigger) or SelectionTileGrid (settings)
```

## MUST NOT use `Tabs` for

1. **Theme / color mode** (light · dark · system) — **`ButtonSegmentedControl`** (`TokensThemeSwitcher`) on doc pages, or **`SelectionTileGrid`** in Settings.
2. **Chart type / layout mode** — **`ViewSegmentedControl`** (`data-view-dashboard-canvas`, catalog previews).
3. **Toolbar filters** with five or fewer values — segmented control, not a tab row.
4. **Full-width mode bars** — edge-to-edge `TabsList` reads as 2010s chrome ([`modern-saas-patterns.md`](docs/exxat-ds/modern-saas-patterns.md) anti-pattern).
5. **Hub view switching** — `ListPageTemplate` owns this; never duplicate with Radix `Tabs`.

## When `Tabs` IS correct

- **Record / detail sub-nav** under `PageHeader` — [`jobs/record-detail.md`](docs/exxat-ds/jobs/record-detail.md). **Primary** (default pill).
- **Token doc namespace groups** — primary `Tabs` + `TabsCountBadge` (not line variant).
- **In-card / chart panels** — **secondary** `variant="line"` only.
- **`TabsList`** defaults **`inline-flex w-fit`** and handles its own overflow — no wrapper. Horizontal overflow rows pin as a sticky subheader (`[data-slot="tabs-sticky-subheader"]`): `top-0` in the page scrollport, height `--shell-utility-bar-height`, full-width `border-b`. Vertical / `overflow={false}` skip the strip.
- **Hub sticky stack** — Utility (outside scroll) → `list-views-sticky-subheader` (view toolbar) → DataTable column header (`getStickyTableHeaderOffset`). Same height token and full-width rule as module tabs.
- **ChartCard `variant="tabs"`** only — chart vs trend (or custom pair) **inside** `ChartCard` line tabs; do not copy that pattern outside chart cards.

## `ButtonSegmentedControl` (Button + segmented chrome)

- Primitive: `@/components/ui/button-segmented-control` — theme preview, compact mode pickers on doc pages.
- Shares `viewSegmentedToolbarClass` / `viewSegmentedButtonClass` with hub view pills; built on **`Button`** `variant="ghost"`.

## `Views segment` (`ViewSegmentedControl` primitive)

- Hub toolbar: icon, label, count, chevron menu, Add view — `ListPageTemplate`.
- Primitive: `@/components/ui/view-segmented-control` — `role="radiogroup"`, muted pill chrome (`viewSegmentedToolbarClass`).
- **`iconOnly`** when toolbar is tight — pair each segment with **`Tip`** (built-in when `iconOnly`).
- Keyboard: arrow keys, Home, End (same as hub view toolbar).

## `DropdownMenu` (icon button menu)

- Use when options are **too many** for a segmented row or the control is **secondary** (chart period, program filter on `ChartCard variant="selector"`).
- Trigger: **`Button`** `size="icon"` or labeled outline + chevron — **not** a fake tab.
- Overflow actions: **`PageHeader`** ⋯ pattern — [`exxat-page-header-actions.md`](exxat-page-header-actions.md).

## List hubs (All students, Placements, …)

**MUST** use **`ListPageTemplate`** view toolbar — `role="toolbar"` + **`w-max`** segmented control (`viewSegmentedToolbarClass`), **not** Radix **`Tabs`** stretched across the page.

- Reference: `packages/ui/src/components/templates/list-page.tsx` (`[data-slot="list-views-sticky-subheader"]`).
- View tabs sit inside **`HorizontalScrollRegion`** with **`controlsLayout="group-end"`** — **`.agents/rules/exxat-horizontal-scroll.md`**.
- Sticky: same subheader contract as module `Tabs` (utility → views → table head).
- **Overflow (same ladder as `Tabs`):** (1) inactive view labels → icon only; (2) trailing views move into a **⋯** menu; (3) scroll arrows only when one view remains on the row. Selected view stays on the row. **Add view** collapses to icon-only with the first rung.

## Entity / record detail (Overview, Academics, Placements, …)

**MUST** use **`Tabs`**, **`TabsList`**, **`TabsTrigger`** from `@/components/ui/tabs`:

- **`TabsList`** defaults to **`inline-flex w-fit`** — **MUST NOT** pass `className="w-full"` or wrap the list in a full-width flex container that forces triggers to **`flex-1`**.
- **Overflow needs no opt-in.** Every **`TabsList`** measures itself: inactive labels drop to icons, then whole tabs move into an overflow menu, and arrows are the last resort. Do **not** wrap a list to switch this on, and do not treat "these tabs won't overflow" as a design decision — the same row fits on a dashboard and clips in a side panel.
- Settings go **on `TabsList`**: `ariaLabel`, `collapseLabels`, `overflowMenu`, `overflowLabel`, `overflow={false}`. Reach for **`TabsListScrollRegion`** only to put a class on the scroll region itself (page gutters on a full-bleed row).
- Split trigger children into **`TabsTriggerIcon`** + **`TabsTriggerLabel`** on any tab row that can get narrow (in-card, side panel, high zoom). Without both slots the row cannot shed labels and jumps straight to hiding whole tabs.
- Every **`TabsTrigger`** **MUST** carry a `value` — the overflow menu selects by it.
- Prefer **`variant="line"`** for record sub-nav under a **`PageHeader`**.

## MUST NOT

- A single grey/white bar spanning the entire content width with tabs distributed edge-to-edge.
- Render the overflow trigger as a child of the `tablist`. A `tablist` may contain only tabs, so **`TabsList`** renders it as a sibling and moves the track chrome onto a shell around both, which is what makes it *look* like it is in the track.
- Reimplement tab overflow with your own `DropdownMenu` beside a `TabsList`. The list already owns the measuring, the ordering, and the guarantee that the selected tab stays visible.
- Mix hub **view tabs** (table/list/board) with entity **section tabs** (Overview/Academics) — different patterns.
- Hand-rolled bordered `RadioGroup` rows for mode switching when **`ViewSegmentedControl`** exists.

## See also

- **`docs/exxat-ds/blueprints/page-header.md`** — header never carries view tabs
- **`docs/exxat-ds/data-views-pattern.md`** — `ListPageTemplate` view toolbar
- **`exxat-horizontal-scroll.md`** — overflowing tab/segment rows
- **`exxat-design-reference-hub.md`** — theme preview on doc pages
- **`exxat-chart-cards.md`** — ChartCard `variant="tabs"` exception
