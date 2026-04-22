# Exxat DS — agent handbook (humans & AI)

**Purpose:** One place for product patterns so tools (Cursor, Codex, etc.) and contributors apply the same rules. **Imperative sections** use MUST / MUST NOT / SHOULD so they are easy to parse.

**Scope:** The Next.js app in this directory. **Path:** If your workspace root is only this folder, use **`./AGENTS.md`**. If the workspace is the parent repo, use **`exxat-ds/AGENTS.md`**.

Cross-cutting Cursor rules also live in the repo root `.cursor/rules/` (data tables, keyboard hints, accessibility) when the parent repo is open.

---

## 1. How to use this file (for AI agents)

1. **Before** adding or changing a **list, table, board, or data-heavy page**, read **§3–§6** (including **§6.4** page vs drawer when scoping flows) and run the **§13 checklist**.
2. **Before** changing **keyboard hints or shortcuts**, read **§7** and root `.cursor/rules/exxat-kbd-shortcuts.mdc`.
3. **Before** changing **table behavior**, read **§3** and root `.cursor/rules/exxat-data-tables.mdc`. **Before** wiring **`TablePropertiesDrawer`** on **`ListPageTemplate`** (view tabs), read **§4.2** and **`.cursor/rules/exxat-table-properties-drawer.mdc`**.
4. **Before** building or changing **tabs, nav, dialogs, icon-only controls, or color/contrast**, read **§8** and **`.cursor/skills/exxat-accessibility/SKILL.md`** (from monorepo root when the parent repo is open).
5. **Before** adding or changing **Data view charts** (dashboard tab on list hubs) or **graph keyboard styling**, read **§4.3** and **`exxat-ds/.cursor/rules/exxat-dashboard-view-charts.mdc`**.
6. **Before** adding or changing **board (kanban) cards** on list hubs, read **§4.4** and the **`exxat-board-cards`** skill (**`.cursor/skills/`** or **`.claude/skills/`** at repo root — same content).
7. **Before** adding **onboarding tours, feature walkthroughs, or coach marks**, read **§11** and `references/coach-marks.md`.
8. **Before** changing the **global command palette (⌘K)** or search/AI entry UX, read **§7.1** and **`docs/command-menu-pattern.md`**.
9. **Before** choosing **drawer vs new page** for a task flow, read **§6.4** and **`docs/data-views-pattern.md`** (Page vs drawer).
10. **Before** adding **success/error/confirmation feedback**, read **§6.5** and **`.cursor/rules/exxat-no-toast.mdc`** (no toast or snackbars).
11. Prefer **composing existing components** over new one-off UI. If something is missing, **extend** shared components under `components/`, not a single page file.
12. **Match** naming, imports, and patterns of the nearest reference implementation (usually Placements).
13. **Before** changing the **application sidebar** (school/program switcher, product logo, profile block, or collapsible nav with children), read **§9.1** and **exxat-ds-skill §3.1**.

**Longer narrative and architecture:** `docs/data-views-pattern.md`, `docs/command-menu-pattern.md` (keep in sync with this handbook for big refactors).

---

## 2. Rule precedence

1. **User / task instructions** in the current session (highest).
2. This **`AGENTS.md`** for Exxat DS product patterns.
3. **`.cursor/rules/*.mdc`** at repo root (`exxat-data-tables`, `exxat-list-page-connected-views`, `exxat-table-properties-drawer`, `exxat-board-cards`, `exxat-page-vs-drawer`, `exxat-no-toast`, `exxat-kbd-shortcuts`, `exxat-accessibility`, `exxat-ds-agents`) and any rules under **`exxat-ds/.cursor/rules/`** (including **`exxat-dashboard-view-charts`** for Data view charts).
4. Project **skills** under `.cursor/skills/` when relevant — e.g. **shadcn**, **exxat-accessibility** (WCAG / ARIA / touch / contrast), **exxat-board-cards** (kanban card shell, status badges, primitives).

If two documents conflict, prefer the **more specific** rule for the file type, then **newer** team decisions captured in `AGENTS.md`.

---

## 3. Data tables (product lists)

**MUST** for any screen that is a **browsable, filterable grid of records** (lists, directories, placements, team roster, etc.):

| Requirement | Action |
|-------------|--------|
| Base table | Use **`DataTable`** from `@/components/data-table` (and **`DataTablePaginated`** when pagination is required). |
| Search | Wire **find-in-list** search (toolbar or equivalent). Do not ship a bare table with no search on a data-list page. |
| Filters | Use the **shared filter model** (`FilterFieldDef`, operators, chips) consistent with existing list pages. |
| Table properties | Expose **Table properties** via **`TablePropertiesDrawer`** (`@/components/table-properties`) — columns, density, related options — same pattern as Placements / data list. |

**Reference:** `components/data-list-table.tsx`, `components/data-table/`.

**MUST NOT:** Build product list pages with only `@/components/ui/table`, raw `<table>`, or a third-party grid that bypasses this stack.

**Exception:** Tiny read-only tables **inside** charts or analytics cards (not primary data-list experiences) may use minimal markup; still use design tokens and accessibility.

---

## 4. View tabs + `DataTable`

**MUST:** If the main surface is a **`DataTable`** (or equivalent data grid), wrap it in **`ListPageTemplate`** so the **views toolbar** exists (tabs, add view, per-tab settings). Do **not** place `DataTable` only under `PageHeader` without the tab shell.

**Reference implementations:** `components/data-list-client.tsx` (Placements), `components/team-client.tsx` (Team).

**Rationale:** Consistent navigation, saved views, per-tab view type (table / list / board / dashboard), export at template level.

### 4.1 Connected views + mock data

**MUST** wire **every** view type the template exposes (table, list, board, dashboard) to the **same** `useTableState` instance: non-table surfaces read **`tableState.rows`** (filtered/sorted like the grid). **MUST NOT** ship placeholder copy such as “not wired for this demo” for those views when the entity has a table stack.

**MUST NOT** ship a **new primary nav hub** as an **empty or placeholder-only page** (e.g. a paragraph saying “replace this later” with no **`DataTable`**, mock data, or connected views). When a route is linked from **`lib/mock/navigation.tsx`**, land users on the same **hub stack** as Team / Placements: **`ListPageTemplate`** + typed mock rows (typically **≥ ~12**), search, filters, **`TablePropertiesDrawer`**, and all view tabs the template supports (**§4.1**), unless the product explicitly scopes a route as a non-data shell (rare).

**Mock data:** Put typed row arrays in **`lib/mock/<entity>.ts`**. Add **`lib/mock/<entity>-kpi.ts`** (or colocated helpers) with pure functions **`entityKpiMetrics(rows)`** / **`entityKpiInsight(rows)`** returning **`MetricItem[]`** / **`MetricInsight`** for **`KeyMetrics`**. The page client passes full mock rows into one table component; KPI helpers receive **`tableState.rows`** inside that component so search/filters apply to list, board, dashboard, and table together.

**Dashboard view tab:** **MUST** reuse **`KeyMetrics`** (same component as the optional template metrics strip) and the same KPI helpers — **MUST NOT** introduce bespoke `Card`-only metric grids for the same numbers. Full-page dashboards may also use **`DashboardTabs`**, **`ChartsOverview`**, etc. (`app/(app)/dashboard/page.tsx`); use those **shared** dashboard components when charts or multi-section layouts are product-appropriate, not one-off duplicates.

**Details:** `docs/data-views-pattern.md` (mock data, connected views, dashboard view).

### 4.2 `TablePropertiesDrawer` and the active view

**MUST:** Any page that uses **`ListPageTemplate`** with **`tab.viewType`** (table / list / board / dashboard) and renders **`TablePropertiesDrawer`** **MUST** pass:

| Prop | Source |
|------|--------|
| **`currentView`** | The same **`DataListViewType`** as the tab’s active view (e.g. **`view={tab.viewType}`** on the table component). |
| **`onViewChange`** | From **`renderContent={(tab, updateTab) => ...}`**: **`(v) => updateTab({ viewType: v, icon: dataListViewIcon(v) })`** — import **`dataListViewIcon`** from **`@/lib/data-list-view`**. |

Thread **`view`** and **`onViewChange`** from the **client** → **table / toolbar wrapper** → **`TablePropertiesDrawer`**. If **`currentView`** is omitted, the drawer defaults to **table** labels and controls even on **Board**, which is incorrect.

**Reference:** `components/data-list-table.tsx`, `components/team-table.tsx`, `components/compliance-table.tsx`. Root **`.cursor/rules/exxat-table-properties-drawer.mdc`**.

### 4.3 Data view dashboard — charts, customisation, and parity with the gallery

**MUST** for the **dashboard** view tab on **Placements, Team, Compliance** (and any page that copies this pattern):

| Topic | Rule |
|-------|------|
| **Accessibility** | Each chart uses **`ChartFigure`** (keyboard + live region) and **`ChartDataTable`** (`sr-only` table fallback), inside **`ChartCard`** — same stack as **`charts-overview.tsx`**. **MUST NOT** ship bare Recharts-only charts on these surfaces. |
| **Two “dashboard” surfaces** | The **`/dashboard`** route uses **`DashboardTabs`** + **`ChartsOverview`** (gallery / demos). The **Data** tab on list hubs uses **`*DashboardChartsSection`** (`PlacementsDashboardChartsSection`, Team, Compliance) and **`data-view-dashboard-charts*.tsx`**. Both share **`ChartFigure`**, **`ChartCard`**, and **`useChartVariant()`**; they are **not** duplicate chart engines — product charts belong in the shared components above. |
| **Keyboard selection (bars & pies)** | Match the **`/dashboard` gallery**: use **`CHART_KBD_ACTIVE_BAR`** and **`CHART_KBD_ACTIVE_PIE_SHAPE`** from **`@/lib/chart-keyboard-selection`** with Recharts **`activeBar` + `activeIndex`** on **`Bar`** and **`activeShape` + `activeIndex`** on **`Pie`**. **MUST NOT** rely on **`fillOpacity` dimming alone** on **`Cell`** as the only keyboard-selected state — it diverges from the gallery and from WCAG-aligned focus feedback. |
| **Customise UI** | Toggle **Edit layout** on the hub dashboard toolbar (`DataListDashboardShell` / Team / Compliance). **`layoutEditMode`** shows on-canvas drag reorder, remove, width (half / full width), chart type, add chart, reset — **no** separate Sheet for layout. Target for coach marks: **`[aria-label='Edit dashboard layout']`**. |
| **Toolbar in edit mode** | Do **not** render **`DataTableToolbar`** while **`layoutEditMode`** — hides search, filters, **Properties**, and the edit affordance in one row. Canvas **Done** / **Cancel** / **Reset** stay on the charts section. |
| **Key metrics card** | Dashboard **`key-metrics`** uses **`KeyMetrics`** **`variant="card"`** (not **`flat`**). Users choose how many KPIs to show (**1–4**) via the canvas control in edit mode; persist **`keyMetricsKpiCount`** in the same layout object. Half-width (**span 1**) sets **`metricsHalfWidthLayout`**. |
| **Data wiring** | **`PlacementsDashboardChartsSection`** (and Team / Compliance equivalents) **MUST** receive **`cardSpans`** and **`cardChartTypes`** (or rely on defaults **inside** the component). **MUST NOT** omit them without defaults — runtime crash (`undefined[id]`). |
| **Persistence (centralized)** | Layout for all three hubs is stored in one bundle: **`lib/data-view-dashboard-storage.ts`** (`exxat-ds:data-view-dashboards:v1`, scopes **`placements` \| `team` \| `compliance`**). Placements wrappers: **`loadDashboardLayout`** / **`saveDashboardLayout`**; generic API: **`loadDataViewLayout`** / **`saveDataViewLayout`**. Legacy per-hub keys are migrated when a scope is missing. **MUST NOT** add a fourth localStorage key pattern for the same layout shape without extending this module. |

**Reference:** `components/data-view-dashboard-charts.tsx`, `data-view-dashboard-charts-team.tsx`, `data-view-dashboard-charts-compliance.tsx`, `components/data-list-table.tsx` (`DataListDashboardShell`), `lib/chart-keyboard-selection.ts`, `lib/data-view-dashboard-storage.ts`, **`exxat-ds/.cursor/rules/exxat-dashboard-view-charts.mdc`**.

### 4.4 Board cards (kanban)

**MUST** for **product board views** on list hubs (Team, Compliance, Placements, and any new hub with **`viewType === "board"`**):

| Topic | Rule |
|-------|------|
| **Shell** | Compose **`ListPageBoardCard`** from **`components/data-views/list-page-board-card.tsx`** — same **`Card` `size="sm"`** ring/hover/`isNew` pattern as **`BoardPlacementCard`**. **MUST NOT** hand-roll alternate card chrome (one-off `<button>` + border classes) for the same surfaces. |
| **Information hierarchy** | **(1)** **`ListPageBoardCardTitleRow`** — title + optional **`ListPageBoardCardAvatar`** (`trailing`). **(2)** **`ListPageBoardCardBadgeRow`** — status / tags as **`Badge`** chips when the entity has a status (not raw body text for status). **(3)** **`ListPageBoardCardBody`** — facts via **`BoardCardTwoLineBlock`** and/or **`BoardCardIconRow`** from **`board-card-primitives.tsx`**. **(4)** Optional **`ListPageBoardCardSecondary`** for empty-state hints. |
| **Facts rows** | Prefer **`BoardCardTwoLineBlock`** (icon + primary line + optional secondary line) so rows match Placements. **`line2`** may be omitted for a single-line fact. Use **`BoardCardIconRow`** when the cell mirrors **`ColumnDef` cell renderers** (e.g. Placements). |
| **Avatar** | Use **`ListPageBoardCardAvatar`** with entity **`initials`** when present; otherwise derive with **`initialsFromDisplayName`** from **`lib/initials-from-name.ts`** (e.g. compliance owner name). |
| **Status labels + colors** | **All list hubs** (**Placements**, **Team**, **Compliance**, **Question bank**, …) **MUST** define status **labels**, **tint classes**, and **icons** in **`lib/list-status-badges.ts`**. Render with **`ListHubStatusBadge`**, or **`StatusBadge`** from **`components/data-list-table-cells.tsx`** for Placements (wrapper over **`ListHubStatusBadge`** + **`PLACEMENT_STATUS_*`**). **`surface="table"`** for **`DataTable`** / **list** rows; **`surface="board"`** in **`ListPageBoardCardBadgeRow`**. **SHOULD** map values onto **`LIST_HUB_STATUS_TINT_*`** (success / warning / neutral / danger / **info**) before inventing new palettes. **MUST NOT** duplicate maps in feature files or add **`uppercase`** / **`tracking-wide`**. |
| **Placements-specific** | **`BoardPlacementCard`** may keep domain logic (lifecycle tabs, conditional row background, **`TablePropertiesDrawer`** column wiring); it still composes **`ListPageBoardCard`** parts and primitives. **Placements** status uses **`StatusBadge`** in **`components/data-list-table-cells.tsx`**, which wraps **`ListHubStatusBadge`** with **`PLACEMENT_STATUS_*`** maps in **`lib/list-status-badges.ts`** (same system as other hubs). |

**Reference:** **`components/data-views/placement-board-card.tsx`**, **`components/team-board-view.tsx`**, **`components/compliance-board-view.tsx`**, **`components/question-bank-board-view.tsx`**, **`components/list-hub-status-badge.tsx`**, **`lib/list-status-badges.ts`**, **`components/data-views/list-page-board-template.tsx`**. **Skill (Cursor + Claude):** **`.cursor/skills/exxat-board-cards/SKILL.md`** and **`.claude/skills/exxat-board-cards/SKILL.md`** (duplicate for Claude Code).

---

## 5. Layout alignment (avoid double inset)

**MUST NOT** wrap `DataTable` in **extra** horizontal padding (`px-*` / `mx-*`) if `DataTable` already applies margin/padding on its shell or toolbar — that **staircases** the filter bar and table vs tabs.

**SHOULD:** Follow Placements / Team: one horizontal rhythm from `ListPageTemplate` + `DataTable`’s own inset.

---

## 6. Dense lists, export, primary hubs

### 6.1 Dense lists (more than ~10 rows/cards)

**SHOULD** provide **search**, **filter**, **user-visible sorting**, and a **properties** entry point (drawer/sheet) appropriate to the surface. **Table/list/board:** use `TablePropertiesDrawer` / toolbar patterns. **Card-only pages:** a lighter properties sheet is OK if there is no `DataTable`.

Below the threshold, these MAY be omitted unless the page is a **primary hub** (§6.3).

### 6.2 Pages with exportable data

Match **Placements**:

- **Primary CTA:** one **default (filled)** `Button`, often `size="lg"` — e.g. New placement, Invite member. **MUST NOT** use `variant="outline"` for that primary action.
- **More (⋯):** outline **icon** button → menu including **Export** → **`ExportDrawer`** (or same pattern).

**Subtitle:** Short line with **count + freshness** (e.g. `24 records · Last updated now`) when useful — see `PlacementsPageHeader` / `TeamPageHeader`.

### 6.3 Primary pages with large or complex data

**Primary nav destinations** that show **large or highly interactive** datasets **MUST** use the **primary page template**:

- **`ListPageTemplate`** + **`KeyMetrics`** (when metrics apply) + export wiring + the same **client composition** as **`DataListClient`** / **`TeamClient`** — not a minimal `PageHeader`-only layout for that hub.

**MUST NOT** treat a main hub table page as a “light” sub-section: use the same shell as Placements (tabs, optional metrics strip, template-level export).

### 6.4 Page vs drawer (actions and auxiliary views)

**SHOULD** choose the surface by whether the user must keep **page context** while acting:

| Use a **drawer / sheet** (side panel) | Use a **new page** (dedicated route) |
|--------------------------------------|----------------------------------------|
| The user needs **the current page behind them** (list, hub, or parent task) **and** a **quick view**, **quick actions**, or a **short auxiliary step** | The flow is **primary**, **long-form**, **multi-step**, or should have its **own URL**, bookmark, or history entry **without** the parent page visible |
| Examples: table/column properties, export, glance at row metadata, lightweight “do one thing and return” | Examples: full create/edit forms, wizards, deep detail that is the main task |

**Rationale:** Drawers preserve **spatial context** and reduce navigation churn; full pages avoid cramming complex work into a narrow overlay.

**Details:** `docs/data-views-pattern.md` (Page vs drawer). Root **`.cursor/rules/exxat-page-vs-drawer.mdc`**.

### 6.5 Messaging — no toast

**MUST NOT** use **toast** APIs (e.g. **Sonner** `toast()`), **snackbars**, or other **transient corner notifications** for product feedback.

**SHOULD** use **`LocalBanner`** / **`SystemBanner`**, **inline status** next to the control (e.g. saved state on a button row), or **dialog / drawer** when acknowledgment matters.

**Rationale:** Toasts are easy to miss, compete with dense app chrome, and are inconsistent for accessibility (focus, announcements). Root **`.cursor/rules/exxat-no-toast.mdc`**.

---

## 7. Keyboard shortcuts (`Kbd`)

Follow root **`.cursor/rules/exxat-kbd-shortcuts.mdc`**. Summary:

- Show **`Kbd`** / **`KbdGroup`** where users discover actions (primary/secondary CTAs, search, Ask Leo, sidebar) — not on every control.
- If a tooltip shows a chord, **implement** it (respect inputs / `contenteditable` via `@/lib/editable-target`).
- Use **`useModKeyLabel`** / **`useAltKeyLabel`** for correct OS labels.
- **Avoid** browser-reserved chords; prefer **⌘⌥** / **Ctrl+Alt** + letter for app actions; table search stays **⌘K** / **Ctrl+K** without Alt.

### 7.1 Global command palette (⌘K)

**Product intent:** **`CommandMenu`** is **global search** and the primary **AI entry**—not a second nav tree. Config: **`buildCommandMenuConfig()`** in **`lib/command-menu-config.ts`**, provider in **`app/(app)/layout.tsx`**. Optional searchable rows (e.g. placements / student names) come from **`dataGroups`**, typically via **`getCommandMenuSearchDataGroups()`** in **`lib/command-menu-search-data.ts`**.

| SHOULD | Rationale |
|--------|-----------|
| Treat the palette as **global search** for routes, library, patterns, and AI suggestion starters | One mental model: ⌘K finds things and starts tasks. |
| For **natural language / AI**, prefer **quick results in the palette** when answers are short or lookup-style (inline snippets, citations, lightweight “research”) | Keeps users in flow; matches “search → pick result”. |
| Route **longer, exploratory, or multi-step** answers to **Ask Leo** (`AskLeoSidebar`) | Side panel fits long-form chat and complex help. |
| For **large row indexes** in **`dataGroups`**, set **`searchOnly: true`** on the group so users are not shown every record before they type (cmdk shows all items when the query is empty). | Keeps the first-open palette usable; matches “type to find a student / row”. |

**MUST NOT** implement the palette as **only** static links without room for AI/search evolution. **SHOULD** keep **`docs/command-menu-pattern.md`** updated as inline AI or search behavior ships.

**Reference:** `components/command-menu.tsx`, `lib/command-menu-search-data.ts`, `docs/command-menu-pattern.md`.

---

## 8. Accessibility (WCAG / ARIA)

**Standard:** **WCAG 2.1 Level AA** (and **2.2** where noted, e.g. target size).

**Authoritative detail (badges, placement count colors, audit table):** **`.cursor/skills/exxat-accessibility/SKILL.md`** at the monorepo root (when the parent repo is open). If the skill path differs in your checkout, search for **`exxat-accessibility`**.

### 8.1 ARIA roles & structure (SC 1.3.1)

| MUST | MUST NOT |
|------|----------|
| Keep **`role="tablist"`** for **tabs only** — children resolve to **`role="tab"`** | Put **`role="button"`**, menus (`aria-haspopup`), or unrelated controls **inside** the same **`tablist`** container |
| For **composite view switchers** (tabs + per-tab settings + remove): use **`role="toolbar"`** + **`aria-label`**, **`aria-pressed`** on toggles where appropriate | Misuse **`tab` / `tablist`** for mixed toolbars |
| Prefer **`<button type="button">`** over **`span role="button"`** for icon actions | Sole click targets at **`size-4`** (16px) |

### 8.2 Touch targets (WCAG 2.2 — 2.5.8)

**MUST:** Interactive controls (including icon-only chevrons and close icons) are at least **24×24 CSS pixels**, or have **24px** spacing so **24px** hit circles do not overlap.

**SHOULD:** **`min-h-6 min-w-6`** or **`size-6`** with centered icons for icon-only controls.

### 8.3 Color (SC 1.4.3 / 1.4.11)

- **Minimum text size** for visible product UI: **11px** — use **`text-xs`** or larger; **MUST NOT** use arbitrary Tailwind classes below that (e.g. `text-[10px]`, `text-[0.65rem]` when it resolves under 11px). Theme tokens: **`app/globals.css`** (`@theme` `--text-xs` = `0.6875rem` at 16px root).
- **Normal text** (including small badge labels): **≥ 4.5:1** against its background.
- **UI components** (borders, focus rings where required): **≥ 3:1**.
- **Muted text on tinted surfaces** (e.g. sidebar): use tokens mixed against the **correct surface** (e.g. **`--sidebar`** / `--sidebar-section-label-foreground`), not only `--background`.

### 8.4 Overlays (Dialog / Sheet / Drawer)

**MUST:** Provide an accessible **title** — `DialogTitle` / `SheetTitle` / `DrawerTitle`; use **`className="sr-only"`** when the title is visually hidden (align with shadcn patterns in this repo).

### 8.5 Verification

**SHOULD** re-run **axe** (or your checker) on **Placements** (or the page you changed) after editing **views toolbar**, **tabs**, or **primary list** surfaces.

---

## 9. Architecture pointers (reuse, don’t fork)

| Need | Reuse | Where |
|------|--------|--------|
| View tabs + shell | `ListPageTemplate` | `components/templates/list-page.tsx` |
| Table + toolbar | `DataTable`, `DataTableToolbar`, `useTableState` | `components/data-table/` |
| Properties | `TablePropertiesDrawer` (+ **`currentView`** / **`onViewChange`** when using view tabs — §4.2) | `@/components/table-properties` |
| Placements flow | `DataListClient`, `DataListTable` | `components/data-list-client.tsx`, `components/data-list-table.tsx` |
| Team flow | `TeamClient`, `TeamTable`, `TeamPageHeader` | `components/team-client.tsx`, etc. |
| Dashboard view tab (KPIs + charts) | **`DashboardReportCharts`**; default **`ChartsOverview`** (placement demo). **Team** passes **`chartsSection`** (`TeamDashboardChartsSection`) so graphs match roster rows. KPIs from **`tableState.rows`** | `components/dashboard-report-charts.tsx`, `data-view-dashboard-charts-team.tsx`, `data-list-table.tsx` |
| Data view layout + graph keyboard tokens | **`loadDataViewLayout` / `saveDataViewLayout`**, **`CHART_KBD_ACTIVE_BAR`**, **`CHART_KBD_ACTIVE_PIE_SHAPE`** | `lib/data-view-dashboard-storage.ts`, `lib/chart-keyboard-selection.ts` |
| Customize dashboard coach marks | Shared steps in **`lib/dashboard-customize-coach-mark.ts`**; flows **`placements-dashboard-customize`**, **`team-dashboard-customize`**, **`compliance-dashboard-customize`** | `hooks/use-coach-mark.ts` (`enabled`, `dependsOnDismissedFlowId`), `data-list-table.tsx`, `team-table.tsx`, `compliance-table.tsx` |
| Board columns (simple hubs) | **`ListPageBoardTemplate`** + **`ListPageBoardCard`** + primitives + **`lib/list-status-badges`** + **`ListHubStatusBadge`** (when applicable) | `components/data-views/list-page-board-template.tsx`, `list-hub-status-badge.tsx`, `team-board-view.tsx`, **`§4.4`** |
| Full dashboard route | `DashboardTabs`, `KeyMetrics`, `ChartsOverview` | `app/(app)/dashboard/page.tsx`, `components/dashboard-tabs.tsx` |
| Board cards | **`ListPageBoardCard`** + primitives + entity card (**§4.4**) | `components/data-views/list-page-board-card.tsx`, `board-card-primitives.tsx`, `placement-board-card.tsx` |
| **Application sidebar** (school/program, product, profile, child nav) | **`AppSidebar`**, **`TeamSwitcher`**, **`NavUser`**, collapsible + **popover** (icon rail) | `components/app-sidebar.tsx`, `nav-user.tsx`, `product-switcher.tsx`, `lib/mock/navigation.tsx`, `lib/logo-dev.ts`, `lib/stock-portrait.ts` — patterns in **exxat-ds-skill §3.1** |
| Persistence (example) | Page + lifecycle keys | `lib/data-list-persistence.ts`, `DataListClient` / `DataListTable` |
| Coach marks / tours | `CoachMark`, `useCoachMark`, coach mark registry | `components/ui/coach-mark.tsx`, `hooks/use-coach-mark.ts`, `lib/coach-mark-registry.ts` |
| Settings page | Coach mark management | `app/(app)/settings/page.tsx`, `components/settings-client.tsx` |

**MUST:** One **`useTableState` per logical table**; remount with **`key`** when column set or entity context changes.

### 9.1 Application sidebar shell

**MUST:**

- **Product (Exxat One / Prism):** Use **`ExxatProductLogo`** for the header product control and **`ProductSwitcher`** — do **not** substitute logo.dev rasters unless product explicitly requests it.
- **School logos:** Use **`logoDevUrl()`** from **`lib/logo-dev.ts`** in **`NAV_SCHOOLS`**; optional env **`NEXT_PUBLIC_LOGO_DEV_TOKEN`**.
- **Team / program dropdown:** Override **`DropdownMenuContent`** default **`w-(--radix-dropdown-menu-trigger-width)`** for the school switcher (e.g. **`!w-max min-w-72 max-w-[min(100vw-2rem,28rem)]`**) so long names are not forced to wrap like the narrow sidebar trigger. **Do not truncate** school or program labels; wrap with **`items-start`**, **`break-words`**, **`whitespace-normal`**. Selected-school summary shows **school + current program**.
- **Team switcher trigger:** **`SidebarMenuButton` `size="lg"`** is **`h-12`** + **`overflow-hidden`** and **clips** the program line — when expanded or mobile, use **`h-auto min-h-12`** and **`overflow-x-clip overflow-y-visible`**; on **icon rail**, hide text with **`group-data-[collapsible=icon]:hidden`**.
- **Nav items with children:** **Popover** on desktop **icon rail**; **Collapsible** when expanded. **MUST NOT** use **`SidebarMenuButton` `tooltip={…}`** as the **direct** child of **`CollapsibleTrigger asChild`** (extra **`Tooltip` root** breaks Radix **`Slot`** / **`React.Children.only`**).
- **Mock profile photo:** **`stockPortraitUrl()`** from **`lib/stock-portrait.ts`**; **`AvatarImage`** **`referrerPolicy="no-referrer"`** for external URLs.
- **Icon rail layout:** Default **`SidebarMenuButton`** icon mode is **`size-8` + `p-2`** (~16px inner width), which **clips** 32px avatars/logos. Override with **`!size-9`**, **`!p-0`**, and **`overflow-visible`** on product/school header controls so marks stay centered and uncropped. **Chevrons** on those header triggers are optional — omit if they read as decoration next to logos.
- **Motion (Animate UI–style):** [Animate UI](https://animate-ui.com/docs) is an **open component distribution** (copy/tweak, Motion + Tailwind — not a single NPM UI package). This app uses **`motion/react`** with small presets in **`lib/motion-ui.ts`**; add more patterns by porting pieces from their registry as needed.

**Full detail:** **`.cursor/skills/exxat-ds-skill/SKILL.md`** (or **`.claude/skills/…`**) **§3.1**.

---

## 10. Persistence (when copying Placements behavior)

- **Page-level:** tabs, `showMetrics`, `displayOptions`, `activeTabId` — see `lib/data-list-persistence.ts` and `DataListClient`.
- **Per-lifecycle / tab:** sort, filters, columns, etc. — see `DataListTable` and `scheduleLifecycleSave`.

New pages **SHOULD** namespace keys and version JSON (`v: 1`) for future migrations.

---

## 11. Coach Marks (onboarding tours)

**MUST:** Use the **coach mark system** for all onboarding, feature discovery, and guided tours. Do **not** build one-off walkthrough overlays.

| Component | Location |
|-----------|----------|
| `CoachMark` | `@/components/ui/coach-mark` |
| `useCoachMark` hook | `@/hooks/use-coach-mark` |
| Coach mark registry | `@/lib/coach-mark-registry` |
| Settings page | `app/(app)/settings/page.tsx` + `@/components/settings-client` |

### How to add a tour

1. Define steps as `CoachMarkStep[]` — each with a `target` CSS selector (prefer `aria-label`, `role`, or `data-coach-mark` attributes), `title`, `description`, optional `side`/`align`/`image`.
2. Call `useCoachMark({ flowId, steps, delay })` and render `<CoachMark state={tour} />` anywhere (it targets by selector, no child wrapping).
3. Register the flow in `lib/coach-mark-registry.ts` so it appears in the Settings page.

### Key behaviors

- **Selector-based:** each step finds its element by CSS selector, scrolls to it, and positions a Radix popover with a spotlight overlay.
- **Brand-colored:** popover background is `bg-brand-deep text-white` — not `bg-popover`.
- **Persistent:** once completed/skipped, the flow is dismissed via `localStorage` and won't reshow until reset from Settings.
- **Settings page:** `/settings` lists all registered flows with reset/preview controls.
- **Sequencing / gating:** `useCoachMark` supports **`enabled`** (e.g. only when **`view === "dashboard"`**) and **`dependsOnDismissedFlowId`** (e.g. customize-dashboard after **`placements-views-tour`**). Completed flows dispatch **`COACH_MARK_FLOW_COMPLETED_EVENT`** on `window` so follow-up tours can open in the same tab.
- **Customize Data dashboard:** registered flows target **`[aria-label='Edit dashboard layout']`**; shared step copy lives in **`lib/dashboard-customize-coach-mark.ts`**.

### Variants

- **Single** (1-step array) — standalone tip, "Got it" button
- **Flow** (2+ steps) — step dots, Skip, Back, Next
- **With image** — set `image` + `imageAlt` on the step
- **Without image** — text-only

**Reference:** `references/coach-marks.md` in the skill, `components/dashboard-tabs.tsx` (dashboard tour), `components/data-list-client.tsx` (views tour).

---

## 12. Documentation

- **Deep dive:** `docs/data-views-pattern.md` (includes **Page vs drawer** with **§6.4**)
- **Global command palette (⌘K):** `docs/command-menu-pattern.md`
- **No toast / snackbars:** **§6.5**, root **`.cursor/rules/exxat-no-toast.mdc`**
- **This handbook:** `exxat-ds/AGENTS.md` (keep checklist sections updated when patterns change)

---

## 12. Summary — MUST / MUST NOT

| MUST | MUST NOT |
|------|----------|
| Use `DataTable` + search + filters + `TablePropertiesDrawer` for product data lists; with **`ListPageTemplate`** view tabs, pass **`currentView`** + **`onViewChange`** (§4.2) | Introduce a second table stack for the same surfaces; omit **`currentView`** on multi-view pages |
| Wrap main `DataTable` in `ListPageTemplate` | `DataTable` only under `PageHeader` without view tabs |
| Use primary template (`ListPageTemplate` + metrics + export pattern) for primary hubs with large data | Hub pages that look like “nested cards” with staggered margins |
| Match Placements for export + primary CTA + More menu | Outline button as the single primary CTA on exportable pages |
| Pair `Kbd` hints with real shortcuts | Browser-reserved chords for app actions |
| Global palette: **§7.1** — search + quick in-menu AI vs **Ask Leo**; **`dataGroups`** + **`searchOnly`** for bulky indexes | Palette as link-only dump; AI that belongs in **Ask Leo** forced into the palette; mounting full **`dataGroups`** on open when **`searchOnly`** should hide them |
| **§6.4** — drawer when **page context + quick** view/actions; **new page** for primary / long / own-URL flows | Forcing **full workflows** into a drawer when a route fits; or **routing** for tasks that are only quick glances over a hub |
| **§6.5** — feedback via **banners / inline / dialogs** — **no** toast or snackbar | **`toast()`** / **Sonner** / transient corner notifications for product messaging |
| Meet **§8** + **`exxat-accessibility`** skill (ARIA, 24px targets, contrast, **§8.3** min **11px** text, overlay titles) | `tablist` mixing non-tabs; **16px** sole targets; dialogs without titles; text below **11px** (except legally required fine print) |
| Use `CoachMark` + `useCoachMark` for onboarding tours (§11); register in `coach-mark-registry` | Build one-off walkthrough overlays or custom onboarding modals |
| Data view charts: **`ChartFigure`** + **`ChartDataTable`**; keyboard highlight via **`chart-keyboard-selection`** (§4.3); layout via **`data-view-dashboard-storage`** | Ad-hoc `localStorage` keys for dashboard layout; opacity-only “selection” without `activeBar`/`activeShape` |
| Board cards: **`ListPageBoardCard`** shell; status via **`ListHubStatusBadge`** + **`lib/list-status-badges`**; no **`uppercase`** on status chips (§4.4) | One-off board card markup; status as plain body text; duplicated status maps outside **`list-status-badges`**; **empty placeholder** primary hubs (§4.1) |

---

## 13. AI execution checklist (list / table / board page)

Copy and complete when implementing or reviewing:

- [ ] **Reuse:** `ListPageTemplate`, `DataTable` / `useTableState`, `TablePropertiesDrawer` — no parallel bespoke tabs/filters.
- [ ] **Tabs:** Any main `DataTable` sits under `ListPageTemplate` with appropriate view tabs.
- [ ] **Inset:** No double horizontal padding around `DataTable`.
- [ ] **> ~10 items:** Search, filter, sort, properties (per surface type in §6.1).
- [ ] **Exportable data:** Filled primary CTA; **⋯** menu with Export → `ExportDrawer`.
- [ ] **Primary hub + large data:** Same composition as `DataListClient` / `TeamClient` (template + metrics when applicable).
- [ ] **All view tabs:** List/board/dashboard use **`tableState.rows`**; dashboard view uses **`KeyMetrics`** + shared KPI helpers — no “not wired” placeholders or duplicate metric cards.
- [ ] **Properties drawer:** **`TablePropertiesDrawer`** receives **`currentView`** and **`onViewChange`** from **`renderContent`** / **`updateTab`** + **`dataListViewIcon`** (§4.2) — not table-only copy on Board/List/Dashboard.
- [ ] **Data view dashboard (Placements / Team / Compliance):** Charts use **`ChartFigure`** + **`ChartDataTable`**; **Edit layout** on toolbar; **`activeBar` / `activeShape`** keyboard styling from **`lib/chart-keyboard-selection`** — not opacity-only **`Cell`** hacks (§4.3).
- [ ] **Dashboard layout persistence:** **`lib/data-view-dashboard-storage`** (or **`saveDashboardLayout`** / **`loadDashboardLayout`** on Placements); **`mergeDashboardLayout`** on load — no new ad-hoc storage keys for the same layout (§4.3).
- [ ] **⌘K palette (§7.1):** If adding or changing **`dataGroups`**, map rows in **`lib/command-menu-search-data.ts`** (not `command-menu.tsx`); use **`searchOnly`** on bulky groups; keep **`docs/command-menu-pattern.md`** aligned.
- [ ] **Page vs drawer (§6.4):** Quick auxiliary actions with **parent context** → drawer/sheet; primary or long flows → **new route** — see **`docs/data-views-pattern.md`**.
- [ ] **No toast (§6.5):** No **`toast()`** / Sonner / snackbars — use banners, inline status, or dialogs.
- [ ] **Typography (§8.3):** No visible copy below **11px** — use **`text-xs`** (`--text-xs` in **`globals.css`**); board/list cards use **`text-xs`** / **`text-sm`** for body lines.
- [ ] **Board cards (§4.4):** **`ListPageBoardCard`** + hierarchy (title → badge row → body); **`ListPageBoardCardAvatar`** when appropriate; status via **`ListHubStatusBadge`** + **`lib/list-status-badges`** — **not** `uppercase` on labels; **`BoardCardTwoLineBlock`** for stacked facts.
- [ ] **New primary hub routes:** **Not** placeholder-only pages — full **`ListPageTemplate`** stack + mock rows + connected views (**§4.1**).
- [ ] **List hub status (§4.4):** **`ListHubStatusBadge`** or Placements **`StatusBadge`**; maps only in **`lib/list-status-badges.ts`**; prefer **`LIST_HUB_STATUS_TINT_*`** for new entities.
- [ ] **Kbd:** Follow `exxat-kbd-shortcuts.mdc` if adding shortcuts or hints.
- [ ] **Accessibility:** §8 — tablist/toolbar patterns, **≥24px** targets for icon-only controls, contrast on tinted surfaces, dialog/sheet/drawer **titles**; re-run **axe** on Placements when changing views toolbar.
- [ ] **Coach marks (§11):** `CoachMark` + `useCoachMark`; register in **`coach-mark-registry`**; use **`enabled`** / **`dependsOnDismissedFlowId`** when a tour must wait for another flow or a specific view (e.g. **dashboard**); customize-dashboard flows use **`lib/dashboard-customize-coach-mark.ts`**.
- [ ] **Application sidebar (§9.1):** **`ExxatProductLogo`** for product; **`logoDevUrl`** for schools; team switcher **`DropdownMenuContent`** not trigger-width-only (**`!w-max`** + min/max width); expanded switcher **`h-auto min-h-12`**; no **`CollapsibleTrigger` → `SidebarMenuButton` with `tooltip` prop**; child links **popover** on icon rail; profile **`stockPortraitUrl`** + **`referrerPolicy="no-referrer"`** on **`AvatarImage`**.

---

*Last updated: §9.1 application sidebar shell; exxat-ds-skill §3.1; §4.1 no empty hubs; §4.4 board cards + `ListHubStatusBadge`; §6.5 no toast; §6.4 page vs drawer; §7.1 command palette; §13 checklist.*
