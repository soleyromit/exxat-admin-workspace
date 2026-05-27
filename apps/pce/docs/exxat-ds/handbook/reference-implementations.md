# Exxat DS — Reference implementations

> When a rule says "see Placements" or "see Team", **this is the index**. Open the file. Copy. Don't reinvent.

Reference pages are the **canonical working implementations** of a pattern. They're the source of truth that rules + blueprints summarize. If a rule conflicts with a reference page, the bug is in the rule — open a PR.

---

## How to use this page

1. Find the row that matches the pattern you're building.
2. Open the **Reference page** column — that file is the template.
3. Read the linked **Blueprint** for the framework-agnostic spec.
4. Read the linked **Rule** for the binding MUST / MUST NOT.
5. Read the linked **Pattern** for the long-form "why".

If you find yourself diverging from the reference page, ask **why** before shipping.

---

## Primary hubs

| Pattern | Reference page | Blueprint | Rule(s) | Pattern doc |
|---|---|---|---|---|
| Full hub: table + board + dashboard + list + paginated + conditional rules + dashboard customize | `apps/web/components/placements-table.tsx` + `placements-client.tsx` | [`list-page-template`](https://github.com/ExxatDesign/Exxat-DS-Workspace/blob/main/apps/web/docs/blueprints/list-page-template.md), [`data-table`](https://github.com/ExxatDesign/Exxat-DS-Workspace/blob/main/apps/web/docs/blueprints/data-table.md), [`board-card`](https://github.com/ExxatDesign/Exxat-DS-Workspace/blob/main/apps/web/docs/blueprints/board-card.md), [`key-metrics`](https://github.com/ExxatDesign/Exxat-DS-Workspace/blob/main/apps/web/docs/blueprints/key-metrics.md) | [`exxat-data-tables`](../../../.cursor/rules/exxat-data-tables.mdc), [`exxat-list-page-connected-views`](../../../.cursor/rules/exxat-list-page-connected-views.mdc), [`exxat-centralized-list-dataset`](../../../.cursor/rules/exxat-centralized-list-dataset.mdc) | [`data-views-pattern`](../data-views-pattern.md) |
| Hub with dashboard customize (canvas layout edit) | `apps/web/components/team-table.tsx` + `team-client.tsx` | [`list-page-template`](https://github.com/ExxatDesign/Exxat-DS-Workspace/blob/main/apps/web/docs/blueprints/list-page-template.md), [`key-metrics`](https://github.com/ExxatDesign/Exxat-DS-Workspace/blob/main/apps/web/docs/blueprints/key-metrics.md) | [`exxat-list-page-connected-views`](../../../.cursor/rules/exxat-list-page-connected-views.mdc) | [`data-views-pattern`](../data-views-pattern.md) |
| Hub with finder / split-panel view | `apps/web/components/sites-table.tsx` + `sites-client.tsx` | [`list-page-template`](https://github.com/ExxatDesign/Exxat-DS-Workspace/blob/main/apps/web/docs/blueprints/list-page-template.md) | [`exxat-list-page-view-shells`](../../../.cursor/rules/exxat-list-page-view-shells.mdc) | [`data-views-pattern`](../data-views-pattern.md) |
| Hub with secondary panel scope (folder rail) | `apps/web/components/library-table.tsx` + `library-client.tsx` | [`list-page-template`](https://github.com/ExxatDesign/Exxat-DS-Workspace/blob/main/apps/web/docs/blueprints/list-page-template.md) | [`exxat-primary-nav-secondary-panel`](../../../.cursor/rules/exxat-primary-nav-secondary-panel.mdc), [`exxat-library-hub-header`](../../../.cursor/rules/exxat-library-hub-header.mdc) | [`library-hub-header-pattern`](https://github.com/ExxatDesign/Exxat-DS-Workspace/blob/main/apps/web/docs/library-hub-header-pattern.md) |
| Hub with secondary panel scope (token categories) — **smallest** secondary-panel reference | `apps/web/components/tokens-themes-client.tsx` + `tokens-secondary-nav.tsx` | [`list-page-template`](https://github.com/ExxatDesign/Exxat-DS-Workspace/blob/main/apps/web/docs/blueprints/list-page-template.md) | [`exxat-primary-nav-secondary-panel`](../../../.cursor/rules/exxat-primary-nav-secondary-panel.mdc) | [`shell-surface-elevation-pattern`](../shell-surface-elevation-pattern.md) |
| Cell-pattern catalog — **18 SaaS cell patterns** via custom `columnDefs`; **seven views** via **`LibraryTable`** (same Add view as Library). | `apps/web/components/columns-showcase.tsx` + `columns-client.tsx` | [`list-page-template`](https://github.com/ExxatDesign/Exxat-DS-Workspace/blob/main/apps/web/docs/blueprints/list-page-template.md), [`data-table`](https://github.com/ExxatDesign/Exxat-DS-Workspace/blob/main/apps/web/docs/blueprints/data-table.md), [`hub-supported-views-pattern`](https://github.com/ExxatDesign/Exxat-DS-Workspace/blob/main/apps/web/docs/hub-supported-views-pattern.md) | [`exxat-data-tables`](../../../.cursor/rules/exxat-data-tables.mdc), [`exxat-hub-supported-views`](../../../.cursor/rules/exxat-hub-supported-views.mdc) | — |

> **First-time hub builder:** copy **`library-table.tsx`** + **`library-client.tsx`**; use **`columns-showcase.tsx`** for custom columns; **`tokens-themes-client.tsx`** + **`tokens-hub-auxiliary-views.tsx`** for tokens. Read **`hub-supported-views-pattern.md`** before changing Add view.

---

## Cell primitives (importable)

Every cell renderer below is exported from `@/components/data-views` (re-exported from `apps/web/components/data-views/table-cells.tsx`). The live catalog page is `/columns`. **Do not re-implement these inside a `ColumnDef['cell']`** — import the name.

| Cell | Renders | Import |
|------|---------|--------|
| `ProgressCell` | Track + filled bar with auto-tone in thirds; `value`, `max`, `tone`, `label` | `@/components/data-views` |
| `CurrencyCell` | Right-aligned `tabular-nums`; `value`, `currency` (USD), `locale`, `maximumFractionDigits` | same |
| `NumericCell` | Right-aligned plain count; `value`, `fractionDigits` | same |
| `RatingCell` | N of `max` FA stars + value; color + glyph paired (WCAG 1.4.1) | same |
| `SignalBarsCell` | Wi-Fi-style ordinal bars; `level`, `max`, `tone`, `label` (required) | same |
| `BooleanToggleCell` | Inline `ToggleSwitch` with `checked` + `onChange(next)`; stops row click propagation | same |
| `AttachmentCountCell` | Paperclip + count chip; muted dash on `0` | same |
| `ExternalLinkCell` | Truncated host + new-tab icon; `url`, `label?`; `Tip` shows full URL | same |
| `RelativeTimeCell` | "3 hours ago" with `Tip(absolute)`; `iso`, `now?` (deterministic snapshots) | same |
| `PeopleAvatarRailCell` | Face rail with `+N` overflow; `people: PersonStub[]`, **non-overlapping** | same |
| `PillCell` | Outlined badge + leading FA icon; `label`, `icon?` | same |
| `TagListCell` | Soft badges with `+N` overflow; `tags`, `visibleMax?`, `formatLabel?` | same |
| `RowActionsCell<TRow>` | `⋯` overflow dropdown; `row`, `actions: RowActionDef<TRow>[]` (label, icon, onSelect, variant, shortcut, disabled) | same |
| `EMPTY_DASH` | Aria-hidden `—` placeholder for null/undefined cells | same |

**Anti-references** (do NOT copy):
- ❌ Inlining `Intl.NumberFormat`, `[1,2,3,4,5].map(s => …)` star loops, raw `<a target="_blank">`, `new URL(…).hostname`, or `Intl.RelativeTimeFormat` inside a `cell:`. Import the named cell.
- ❌ Re-implementing `RowActionsCell` per hub with a custom `DropdownMenu`. The generic `RowActionsCell<TRow>` covers `Open / Edit / Duplicate / Archive`-style menus.

---

## Hub chrome

| Pattern | Reference page | Blueprint | Rule(s) |
|---|---|---|---|
| Page header — primary hub | `apps/web/components/placements-page-header.tsx` | [`page-header`](https://github.com/ExxatDesign/Exxat-DS-Workspace/blob/main/apps/web/docs/blueprints/page-header.md) | [`exxat-collaboration-access`](../../../.cursor/rules/exxat-collaboration-access.mdc), [`exxat-mono-ids`](../../../.cursor/rules/exxat-mono-ids.mdc) |
| Page header — collaboration variant (face rail + invite) | `apps/web/components/library-page-header.tsx` | [`page-header`](https://github.com/ExxatDesign/Exxat-DS-Workspace/blob/main/apps/web/docs/blueprints/page-header.md) | [`exxat-collaboration-access`](../../../.cursor/rules/exxat-collaboration-access.mdc) |
| Page header — entity / record (no view tabs) | `apps/web/components/page-header.tsx` (variants) | [`page-header`](https://github.com/ExxatDesign/Exxat-DS-Workspace/blob/main/apps/web/docs/blueprints/page-header.md) | — |
| KPI flat band on a hub | `apps/web/components/placements-client.tsx` | [`key-metrics`](https://github.com/ExxatDesign/Exxat-DS-Workspace/blob/main/apps/web/docs/blueprints/key-metrics.md) | [`exxat-kpi-flat-band`](../../../.cursor/rules/exxat-kpi-flat-band.mdc), [`exxat-kpi-max-four`](../../../.cursor/rules/exxat-kpi-max-four.mdc), [`exxat-kpi-trends`](../../../.cursor/rules/exxat-kpi-trends.mdc) |
| Properties drawer wiring | `apps/web/components/placements-table.tsx` | — | [`exxat-table-properties-drawer`](../../../.cursor/rules/exxat-table-properties-drawer.mdc) |
| Export drawer + ⋯ menu | `apps/web/components/placements-page-header.tsx` + `export-drawer.tsx` | — | [`exxat-drawer-vs-dialog`](../../../.cursor/rules/exxat-drawer-vs-dialog.mdc) |

---

## Board, list, dashboard views

| Pattern | Reference page | Blueprint | Rule(s) |
|---|---|---|---|
| Board card (kanban) | `apps/web/components/placements-board-view.tsx`, `team-table.tsx` (`renderListRow`) | [`board-card`](https://github.com/ExxatDesign/Exxat-DS-Workspace/blob/main/apps/web/docs/blueprints/board-card.md) | [`exxat-board-cards`](../../../.cursor/rules/exxat-board-cards.mdc), [`exxat-card-vs-list-rows`](../../../.cursor/rules/exxat-card-vs-list-rows.mdc) |
| List row (single-column) | `apps/web/components/team-table.tsx` `renderListRow` | [`board-card`](https://github.com/ExxatDesign/Exxat-DS-Workspace/blob/main/apps/web/docs/blueprints/board-card.md) (row layout) | [`exxat-card-vs-list-rows`](../../../.cursor/rules/exxat-card-vs-list-rows.mdc) |
| Dashboard view with charts + KPI band | `apps/web/components/placements-dashboard-charts-section.tsx` | [`key-metrics`](https://github.com/ExxatDesign/Exxat-DS-Workspace/blob/main/apps/web/docs/blueprints/key-metrics.md) | [`exxat-dashboard-view-charts`](../../../.cursor/rules/exxat-dashboard-view-charts.mdc) |
| Folder / finder split view | `apps/web/components/data-views/finder-panel-view.tsx` (used in `sites-table.tsx`) | — | [`exxat-list-page-view-shells`](../../../.cursor/rules/exxat-list-page-view-shells.mdc) |

---

## Search

| Pattern | Reference page | Rule(s) | Pattern doc |
|---|---|---|---|
| Global command palette (⌘K) | `apps/web/components/command-menu.tsx` + `lib/command-menu-config.ts` | [`exxat-command-menu`](../../../.cursor/rules/exxat-command-menu.mdc) | [`command-menu-pattern`](../command-menu-pattern.md) |
| Dedicated search (landing + results) | `apps/web/components/dedicated-search-*.tsx` | [`exxat-dedicated-search-surfaces`](../../../.cursor/rules/exxat-dedicated-search-surfaces.mdc) | — |
| In-table search (toolbar) | wired by `HubTable` automatically | [`exxat-data-tables`](../../../.cursor/rules/exxat-data-tables.mdc) | [`data-views-pattern`](../data-views-pattern.md) |

---

## Collaboration

| Pattern | Reference page | Rule(s) | Pattern doc |
|---|---|---|---|
| Face rail + invite drawer | `apps/web/components/collaboration-access-flow.tsx`, `invite-collaborators-drawer.tsx` | [`exxat-collaboration-access`](../../../.cursor/rules/exxat-collaboration-access.mdc) | [`collaboration-access-pattern`](../collaboration-access-pattern.md) |

---

## Overlays and confirmations

| Pattern | Reference page | Rule(s) | Pattern doc |
|---|---|---|---|
| Side drawer (long auxiliary flow) | `apps/web/components/export-drawer.tsx`, `invite-collaborators-drawer.tsx`, `apps/web/components/table-properties/drawer.tsx` | [`exxat-drawer-vs-dialog`](../../../.cursor/rules/exxat-drawer-vs-dialog.mdc), [`exxat-page-vs-drawer`](../../../.cursor/rules/exxat-page-vs-drawer.mdc) | [`drawer-vs-dialog-pattern`](https://github.com/ExxatDesign/Exxat-DS-Workspace/blob/main/apps/web/docs/drawer-vs-dialog-pattern.md) |
| Dialog (blocking short confirm / destructive) | `apps/web/components/ui/alert-dialog.tsx` consumers (search `<AlertDialog`) | [`exxat-drawer-vs-dialog`](../../../.cursor/rules/exxat-drawer-vs-dialog.mdc) | [`drawer-vs-dialog-pattern`](https://github.com/ExxatDesign/Exxat-DS-Workspace/blob/main/apps/web/docs/drawer-vs-dialog-pattern.md) |
| Coach mark / onboarding | `apps/web/lib/coach-mark-registry.ts` consumers (Placements dashboard customize) | — | — |

---

## Settings, tokens, themes

| Pattern | Reference page | Rule(s) |
|---|---|---|
| Settings page (preferences + sections) | `apps/web/app/(app)/settings/page.tsx` | — |
| Tokens & themes hub (secondary panel + categories + visualizers) | `apps/web/components/tokens-themes-client.tsx`, `tokens-themes-section.tsx`, `tokens-secondary-nav.tsx` | [`exxat-token-discipline`](../../../.cursor/rules/exxat-token-discipline.mdc), [`exxat-primary-nav-secondary-panel`](../../../.cursor/rules/exxat-primary-nav-secondary-panel.mdc) |

---

## Anti-references (what NOT to copy)

These exist but are **not** canonical. They predate a rule, are scoped to a one-off, or use a legacy primitive. **Don't copy from them.**

| Anti-reference | Why not | What to use instead |
|---|---|---|
| Raw `<DataTable>` mounted directly in `ListPageTemplate.renderContent` (historical) | Loses filter chips + Properties drawer; users lose discoverability | `HubTable` (see Sites / Placements / Tokens / Columns refs) |
| Custom search input above a `DataTable` | `HubTable`'s toolbar already does this; duplicating leads to drift | Configure `ColumnDef.filter` + use `HubTable` |
| `toast()` / Sonner / snackbar | Forbidden — see [`exxat-no-toast.mdc`](../../../.cursor/rules/exxat-no-toast.mdc) | `LocalBanner` / `SystemBanner` or inline status |
| Negative-margin overlapping avatars | Forbidden — see [`exxat-person-identity-display.mdc`](../../../.cursor/rules/exxat-person-identity-display.mdc) | `AvatarGroup` (gapped by default) |
| Legacy customer sidebar screenshots (rainbow section text, pink wash, custom pills) | Visual spec for old product — **not** Exxat DS chrome | **`AppSidebar`** + **`SidebarMenuButton`** + **`lib/mock/navigation.tsx`** — **`exxat-sidebar-shell.mdc`** |
| Uploaded screenshots / mockups treated as pixel spec | Images show **intent** — DS blueprints + reference hubs define **implementation** | **`exxat-no-image-pixel-copy.mdc`** + **`component-selection-guide.md`** |

---

## Adding a new reference page

If you build a pattern that **other hubs will copy**, list it here. A reference page is canonical when:

1. It satisfies the matching blueprint or rule end-to-end.
2. It passes the §13 PR-review checklist in [`AGENTS.md`](https://github.com/ExxatDesign/Exxat-DS-Workspace/blob/main/AGENTS.md).
3. The file has a top-level doc comment that names what it's the reference for (e.g. *"Sites hub — thin wrapper around `<HubTable>`. Owns only the column defs, renderers for non-table views, and the mock-data wiring."*).
4. The matching rule's "Reference implementations" list points back to it.

---

## See also

- [`HANDBOOK.md`](./HANDBOOK.md) — start-here doc map
- [`blueprints/README.md`](https://github.com/ExxatDesign/Exxat-DS-Workspace/blob/main/apps/web/docs/blueprints/README.md) — what a blueprint is
- [`component-selection-guide.md`](https://github.com/ExxatDesign/Exxat-DS-Workspace/blob/main/apps/web/docs/component-selection-guide.md) — decision tree across blueprints
- [`apps/web/AGENTS.md` §13](https://github.com/ExxatDesign/Exxat-DS-Workspace/blob/main/AGENTS.md) — full PR-review checklist
