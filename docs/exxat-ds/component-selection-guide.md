# Exxat DS — Component Selection Guide

**The UX router.** Agents: read **`_constitution.exxat-ds.mdc`** (always on), then **this file** — not `AGENTS.md` in full.

**Companion:** [`token-taxonomy.md`](./token-taxonomy.md) · [`INDEX.yaml`](./INDEX.yaml) · [`jobs/`](./jobs/)

---

## 0. What am I building? (start here)

| You are building… | Job doc | Go to |
|-------------------|---------|-------|
| List / hub (filter, export, many records) | [`jobs/list-hub.md`](./jobs/list-hub.md) | §1 |
| Record detail (one entity, sections/tabs) | [`jobs/record-detail.md`](./jobs/record-detail.md) | §2 (detail) |
| Wizard / multi-step create | [`jobs/focus-workflow.md`](./jobs/focus-workflow.md) · [`wizard-pattern.md`](./wizard-pattern.md) | §1.3.2 |
| Focus shell / timed exam / compose | [`jobs/focus-workflow.md`](./jobs/focus-workflow.md) | §1.3 |
| DS catalog / showcase browse | [`jobs/catalog-browse.md`](./jobs/catalog-browse.md) | §1.4 |
| Settings / preferences | [`jobs/settings-preferences.md`](./jobs/settings-preferences.md) | §2 (settings) |
| Dedicated search (landing + results) | [`jobs/dedicated-search.md`](./jobs/dedicated-search.md) | §1.1 dedicated search |
| Dashboard / analytics page | — | §1.1 dashboard row + `charts-overview.tsx` |
| Sheet / drawer on same route | — | §3 |
| Dialog / confirm | — | §3 |
| Dedicated search (landing + results) | — | §1.1 dedicated search row |
| Empty / error / loading only | — | §2 (states) |
| Marketing / content (rare) | — | §9 — ask user |

**Rule:** compose existing components first ([`exxat-reuse-before-custom.mdc`](../../.cursor/rules/exxat-reuse-before-custom.mdc)).

---

## 0.1 Surface map (quick chart)

```
                ┌─────────────────────────────────────┐
                │ What is the surface?               │
                └──┬──────────────────────────────────┘
                   │
       ┌───────────┼───────────┬──────────┬──────────┐
       │           │           │          │          │
   PRIMARY HUB   FOCUS/LOCK  CATALOG   DETAIL    OVERLAY
       │           │           │          │          │
       ▼           ▼           ▼          ▼          ▼
   See § 1      See § 1.3   See § 1.4  §2 detail  See § 3
```

---

## 1. Building a primary hub (route with records)

```
   Q: Is the data > ~10 comparable records?
   ─────────────────────────────────────────
   │ yes ──────────────────────────────► DataTable inside ListPageTemplate (§1.1)
   │ no  ──┬─ all rows shown at once?
   │       │ yes ── simple `<dl>` / card list (no Properties / Filters needed)
   │       │ no  ── still use DataTable — future growth is expected
   └─────►
```

### 1.1 DataTable hub (canonical)

| Need | Use |
|---|---|
| Browsable grid | **`DataTable`** + **`useTableState`** ([blueprint](./blueprints/data-table.md)) |
| View tabs (table/list/board/dashboard) | **`ListPageTemplate`** + connected views ([`exxat-list-page-connected-views.mdc`](../../.cursor/rules/exxat-list-page-connected-views.mdc)) |
| Column/density/properties | **`TablePropertiesDrawer`** (pass `currentView` + `onViewChange`) |
| Filters | Shared `FilterFieldDef` chips |
| Find-in-list | Toolbar search (`⌘K`) |
| Metrics strip | **`KeyMetrics`** `variant="flat"` ([`kpi-flat-band-pattern.md`](./kpi-flat-band-pattern.md)) — **max 4 tiles** ([`exxat-kpi-max-four.mdc`](../../.cursor/rules/exxat-kpi-max-four.mdc)) |
| Export | Filled primary CTA + `⋯` → `ExportDrawer` |
| Kanban view body | **`ListPageBoardCard`** + `ListPageBoardTemplate` ([`exxat-board-cards.mdc`](../../.cursor/rules/exxat-board-cards.mdc)) |
| Folder / panel view body | **`FolderGridView`** / **`FinderPanelView`** wrapped in **`ListPageViewFrame`** ([`exxat-list-page-view-shells.mdc`](../../.cursor/rules/exxat-list-page-view-shells.mdc)) |
| Dashboard view body | **`KeyMetrics variant="card"`** + a hub-specific chart section (reference: `library-dashboard-charts.tsx`) |
| Nested scope nav (All / Mine / tree) | **`secondaryPanel`** + `PANELS` + `useAutoPanel` ([`exxat-primary-nav-secondary-panel.mdc`](../../.cursor/rules/exxat-primary-nav-secondary-panel.mdc)) |
| Shared hub w/ invite | **`PageHeader` `variant="collaboration"`** + `InviteCollaboratorsDrawer` |
| Dedicated search (empty `?q=` vs results) | **`DedicatedSearchLandingTemplate`** + **`DedicatedSearchResultsHeaderChrome`** |

**Reference:** `PlacementsClient` (Placements) is the most complete example.

### 1.1a Table column cells (which renderer for each field)

Before writing `ColumnDef['cell']`, open **[`table-column-cells-pattern.md`](./table-column-cells-pattern.md)** or run skill **`exxat-table-column-cells`**.

| Data point | Use |
|---|---|
| One person (author, owner, student) | `AvatarInitials` + name + email — copy **`library-table` Author** |
| Multiple people | `PeopleAvatarRailCell` |
| Status | `ListHubStatusBadge` + `list-status-badges.ts` |
| Progress, money, rating, tags, links, … | Named cell from `@/components/data-views` — see **`/columns`** |

**MUST NOT** use plain text for a person identity column or inline-format currency/progress/stars. **Rule:** [`exxat-table-column-cells.mdc`](../../.cursor/rules/exxat-table-column-cells.mdc).

### 1.2 Visual-browse hub (kanban / gallery)

If the product wants a **kanban-first** experience and the table is the
fallback rather than primary:

```
ListPageTemplate
├── PageHeader
├── KeyMetrics (optional, ≤4)
└── viewType="board" → ListPageBoardTemplate + ListPageBoardCard
```

Even here, **back the board with `useTableState`** so switching to the table
tab is consistent. Don't fork the data.

### 1.3 Focus workflow / exam lock shell

Single-task surfaces with **no hub chrome** (or hidden sidebars only).

```
Q: Is the user doing ONE primary task (compose, timed exam)?
────────────────────────────────────────────────────────────
│ yes ──┬─ timed assessment / full lock? ──► ExamLockTemplate (§1.3.1)
│       └─ create wizard / short compose? ──► FocusWorkflowTemplate (§1.3.2)
│ no  ──► not a focus shell — see §1 (hub) or §3 (overlay)
```

| Need | Use |
|---|---|
| Timed exam delivery | **`ExamLockTemplate`** + `exam-lock/*` question renderers |
| Create / compose wizard | **`Wizard`** + **`FocusWorkflowTemplate`** — ≤6 top-level steps ([`wizard-pattern.md`](./wizard-pattern.md)); reference `new-library-item-form.tsx` |
| Path registration | `lib/exam-lock-shell.ts`, `lib/focus-workflow.ts` |
| Hide workspace chrome | `App.tsx` exam branch; `isSidebarHiddenPath` for focus |

**Job doc:** [`jobs/focus-workflow.md`](./jobs/focus-workflow.md). **Pattern:** [`focus-workflow-pattern.md`](./focus-workflow-pattern.md). **Rule:** `.cursor/rules/exxat-focus-workflow.mdc`.

**MUST NOT:** Use `ListPageTemplate` / `HubTable` for exam question delivery.

#### 1.3.1 Exam lock

- Full chrome strip: no sidebar, ⌘K, Ask Leo, system banner.
- Brand canvas (`bg-sidebar`) + inset card + `ExamLockAppHeader`.
- Reference: `components/exam-lock-showcase-client.tsx`.

#### 1.3.2 Focus workflow

- Hide primary + secondary sidebars; keep global shell unless product says otherwise.
- Centered column + `PageHeader` + workflow body.
- Multi-step create: compose **`Wizard`** (`numbered` / `icons` / `compact`) — **not Tabs**; prefer ≤6 chapters ([`wizard-pattern.md`](./wizard-pattern.md), rule `exxat-wizard.mdc`).
- Reference: `components/focus-workflow-showcase-client.tsx`, `new-library-item-form.tsx`, `components/design-system/wizard-previews.tsx`.

### 1.4 Catalog / pattern browse (Design OS)

Browse templates and showcase routes — **not** a production data hub.

| Need | Use |
|---|---|
| Static pattern index | `catalog-client.tsx` + `lib/mock/catalog-entries.ts` |
| Link to live demo | `routeSuffix` per entry → registered in `routes.tsx` |

**Job doc:** [`jobs/catalog-browse.md`](./jobs/catalog-browse.md).

---

## 2. Record detail, settings, and states

### 2.1 Record detail

| Need | Use |
|---|---|
| Identity + status above fold | `PageHeader` + status row — one H1 only (P2) |
| Section tabs | Record `TabsList` `w-fit` + horizontal scroll when overflow |
| Related lists | Same-route hub table or link to primary hub |
| Way back | Breadcrumb **or** back button — never both (P1) |

**Job doc:** [`jobs/record-detail.md`](./jobs/record-detail.md).

### 2.2 Settings / preferences

| Need | Use |
|---|---|
| Settings section nav | `SidebarDrillIn` (flat routes, not SecondaryPanel) |
| Personal vs workspace scope | Label in copy + brief |
| Save feedback | Inline status — no toast |

**Job doc:** [`jobs/settings-preferences.md`](./jobs/settings-preferences.md).

### 2.3 Empty / error / loading (every surface — P5)

Every route ships all three. Use skeletons for loading; `LocalBanner` or inline for errors; empty states with a next action — not placeholder paragraphs.

---

## 2a. Naming a card / row / list

| Pattern | What to reach for |
|---|---|
| Dense comparable rows | `DataTable` row (don't card-wall it — see [`card-vs-rows-pattern.md`](./card-vs-rows-pattern.md)) |
| **One person in a table column** | `AvatarInitials` + name + email — [`table-column-cells-pattern.md`](./table-column-cells-pattern.md) |
| Kanban column card | `ListPageBoardCard` + `BoardCardTwoLineBlock` + `BoardCardIconRow` |
| OS-folder grid | `FolderGridView` in `ListPageViewFrame` |
| Finder split (list + preview) | `FinderPanelView` |
| Sidebar nav row | `SidebarMenuButton` (do not roll your own) |
| Overflowing tab / breadcrumb / chip row | `HorizontalScrollRegion` or `HorizontalScrollControls` — [`horizontal-scroll-pattern.md`](./horizontal-scroll-pattern.md) |
| **Mode / filter (2–5 options)** on same route | **`ViewSegmentedControl`** — theme, chart type, layout width — **not** `Tabs` ([`exxat-tabs-chrome.mdc`](../.cursor/rules/exxat-tabs-chrome.mdc)) |
| **Many / infrequent options** | **`DropdownMenu`** on icon or outline `Button` — not tab row |
| Entity **section** navigation | **`Tabs`** `w-fit` `variant="line"` — Overview · Academics · … |
| KPI tile | `KeyMetrics` `MetricItem` — never a custom `Card` w/ number |
| Coach mark tile | `CoachMark` step — never an ad-hoc onboarding popover |

---

## 3. Same-route overlay vs new route

Always ask: **does the user need the hub visible behind them?**

```
                ┌────────────────────────────┐
                │ Does the user need the hub │
                │   visible behind them?     │
                └─────────────┬──────────────┘
                              │
              ┌───── YES ─────┴───── NO ─────┐
              ▼                              ▼
        Same route                     New route
       (overlay)                     (own URL)
              │                              │
        ┌─────┴──────┐                       │
        │ Is the task│                       │
        │   short +  │                       │
        │  blocking? │                       │
        └─────┬──────┘                       │
              │                              │
        ┌─ YES ┴ NO ──┐                      │
        ▼              ▼                      ▼
     Dialog        Sheet panel            Page route
   (AlertDialog,  (TablePropertiesDrawer,  (full create/edit
   delete confirm)  ExportDrawer,           wizard, deep detail)
                   InviteCollaboratorsDrawer)
```

See [`drawer-vs-dialog-pattern.md`](./drawer-vs-dialog-pattern.md) and
[`exxat-page-vs-drawer.mdc`](../../.cursor/rules/exxat-page-vs-drawer.mdc).

---

## 4. Search / Find / Command

| Need | Use | Shortcut |
|---|---|---|
| Find inside a table | `DataTableToolbar` search | `⌘K` / `Ctrl K` (no Alt) |
| Find inside a hub (across tabs/views) | Same `⌘K` while focus is on the hub | `⌘K` |
| Global navigation + AI starter | `CommandMenu` ([`command-menu-pattern.md`](./command-menu-pattern.md)) | `⌘K` while no input has focus |
| Long AI / chat | `AskLeoSidebar` | `⌘⌥K` |
| Dedicated search page (results view) | `DedicatedSearchLandingTemplate` + `DedicatedSearchResultsHeaderChrome` | — |

---

## 5. Feedback / messaging

| Need | Use |
|---|---|
| Persistent banner ("system maintenance") | `SystemBanner` |
| Per-page contextual info | `LocalBanner` |
| Per-control success/error | Inline text next to the field |
| Confirm a destructive action | `AlertDialog` |
| **Never** | `toast()` / Sonner / snackbars ([`exxat-no-toast.mdc`](../../.cursor/rules/exxat-no-toast.mdc)) |

---

## 6. Icons

| Use case | Pattern |
|---|---|
| Icon next to a label | FA glyph + `aria-hidden` (Case A) |
| Icon standing alone (meaning-bearing) | `<span role="img" aria-label="…" tabIndex={0}>` + `Tooltip` (Case B) |
| Icon-only button / link | `<button aria-label="…">` wrapped in `Tooltip` (Case C) |
| Product mark | `ExxatProductLogo` |
| School / org mark | `logoDevUrl()` |

Source: `apps/web/AGENTS.md` §8.6.

---

## 7. KPIs / metrics

| Need | Use |
|---|---|
| Hub metric strip on top of `ListPageTemplate` | `KeyMetrics variant="flat"` |
| Dashboard view tab key-metrics card | `KeyMetrics variant="card"` (1–4 tiles) |
| Chart + mini-metric next to it | `ChartCard` from `charts-overview.tsx` — **ask user for `variant`** ([`exxat-chart-cards.mdc`](../../.cursor/rules/exxat-chart-cards.mdc)) |
| Trend arrow on a metric | Set `MetricItem.trend` to match delta sign; set `trendPolarity` when "up" is bad |

Cap visible KPIs at **4** ([`exxat-kpi-max-four.mdc`](../../.cursor/rules/exxat-kpi-max-four.mdc)).

---

## 8. Identifiers and typography

| Carries | Use |
|---|---|
| System ID (`questionId`, record key) | `font-mono tabular-nums` ([`exxat-mono-ids.mdc`](../../.cursor/rules/exxat-mono-ids.mdc)) |
| Table column / cell choice | [`table-column-cells-pattern.md`](./table-column-cells-pattern.md) + skill `exxat-table-column-cells` |
| Page title | `<h1>` with `font-heading` (Ivy Presto) inside `PageHeader` |
| Body | Default Inter, ≥ 12px (`text-xs` / `text-2xs` minimum) |
| Status label | `ListHubStatusBadge` from `lib/list-status-badges.ts` — never raw text |
| Currency / counts | `tabular-nums` (no `font-mono`) |

---

## 9. When NOTHING here fits

You are now in the territory covered by
[`exxat-reuse-before-custom.mdc`](../../.cursor/rules/exxat-reuse-before-custom.mdc):

1. Re-scan `apps/web/components/`, `packages/ui/src/components/`, and `apps/web/components/data-views/`.
2. Check `AGENTS.md` §9 architecture table.
3. If still no fit, **ask the user** with a short option list:
   - extend an existing primitive (preferred),
   - add a new component under `components/data-views/` or `components/templates/`,
   - or open a packaged shared primitive in `packages/ui`.

---

## 10. Cheat sheet — one-line rules

- **Data list, > 10 rows** → `DataTable` + `ListPageTemplate`.
- **Visual browse / kanban** → `ListPageBoardCard`.
- **Folder / panel / OS-folder view** → `data-views/` primitive in `ListPageViewFrame`.
- **Quick auxiliary task with hub behind** → drawer.
- **Blocking short confirm** → dialog.
- **Primary / long / own-URL flow** → new route.
- **Global ⌘K** → `CommandMenu` (search + quick AI).
- **Long AI** → Ask Leo (`⌘⌥K`).
- **Feedback** → banner / inline / dialog — **never** toast.
- **Icon-only button** → `aria-label` + `Tooltip` (Case C).
- **System ID** → `font-mono tabular-nums`.
- **Table column data point** → named cell from `@/components/data-views` ([`table-column-cells-pattern.md`](./table-column-cells-pattern.md)).
- **KPI strip** → ≤ 4 tiles, `variant="flat"` on hubs.
- **Overflowing tab/breadcrumb row** → `HorizontalScrollRegion` (`group-end` default).
- **Hex color in code** → no. Use a token.

See also: [`AGENTS.md` §13 checklist](../AGENTS.md) — run it before shipping a hub.
