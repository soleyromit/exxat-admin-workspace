# Organisms & Templates — Depth audit (2026-05-11)

> Covers: data-list-table-cells, placements-list-view, section-cards, export-drawer, table-properties-drawer, list-page-template, views-toolbar.
> All seven live in `exxat-ds/apps/web/components/` — **none** are published from `@exxat-ds/ui`. Adoption requires vendoring (same path as DataTable: ~1.3 KLOC, already in PCE).

---

## Library reality

| Component | Source | Lines | Adoption mode |
|---|---|---|---|
| data-list-table-cells | `exxat-ds/apps/web/components/data-list-table-cells.tsx` | 162 | Vendor file (or cherry-pick exports — pure presentational, no internal-state coupling) |
| placements-list-view | `exxat-ds/apps/web/components/placements-list-view.tsx` | 294 | Vendor + 3 dependencies (`@tanstack/react-virtual`, `placement-board-card-layout`, `conditional-rule-match`) |
| section-cards | `exxat-ds/apps/web/components/section-cards.tsx` | 110 | Trivial — copy as a pattern, not a component (it's hard-coded demo content) |
| export-drawer | `exxat-ds/apps/web/components/export-drawer.tsx` | 336 | Vendor file + RHF/Zod deps; uses DS Sheet/Form/SelectionTileGrid/DatePickerField |
| table-properties-drawer | `exxat-ds/apps/web/components/table-properties/` (7 files, 1.6 KLOC incl. drawer.tsx 1041) | 1041 + sibs | Vendor whole `table-properties/` directory — wires into DataTable's existing `toolbarSlot` |
| list-page-template | `exxat-ds/apps/web/components/templates/list-page.tsx` | 533 | Vendor file + transitive (`export-drawer`, `view-segmented-control`, `data-list-view`, `list-page-table-properties` helper) |
| views-toolbar | (inline within `list-page.tsx`, lines 302–446) | — | Not a separate export — tied to ListPageTemplate's tab/view state |

---

## Adoption snapshot

| Component | PCE admin | exam-mgmt admin |
|---|---|---|
| data-list-table-cells (`StatusBadge`, `AvatarCircle`, `WeeksProgressCell`, `ReadinessBadge`, `HireBadge`, `RowActions`, `PLACEMENT_ROW_ACTIONS`) | 0 (hand-rolled equivalents) | 0 |
| PlacementsListView | 0 | 0 |
| SectionCards | 0 (uses KeyMetrics) | 0 |
| ExportDrawer / FloatingExportDrawer | 0 | 0 |
| TablePropertiesDrawer | 0 imported, but PCE's vendored DataTable already imports `OPERATOR_LABELS` + `ActiveFilter` types from `@/components/table-properties/types` — meaning the **types module is shadowed/expected to exist locally** at `apps/pce/admin/components/table-properties/types`. ⚠️ This is currently a broken import unless those types were copied into PCE. | 1 partial — `qb-table.tsx:789` has a hand-built "DS TablePropertiesDrawer-inspired" Sheet (not a vendor) |
| ListPageTemplate | 0 | 0 |
| ViewsToolbar | 0 | 0 |

> **Verify before vendoring anything else:** PCE's `data-table/index.tsx` lines 55–56 import from `@/components/table-properties/types` — confirm that file exists in PCE or fix the import to point to a copy. If it currently compiles, the types were vendored silently; if not, those lines are dead.

---

## Per-component findings

### data-list-table-cells

**What it provides** (162 lines, pure presentational):
- `StatusBadge` — placement-specific lifecycle badge, delegates to `ListHubStatusBadge` shell with hard-coded `PLACEMENT_STATUS_*` maps from `@/lib/list-status-badges`. **Not generic** — tied to placement domain.
- `AvatarCircle` — 7×7 initials chip using `--avatar-initials-bg` / `--avatar-initials-fg` tokens, `aria-hidden`.
- `WeeksProgressCell` — placement-specific progress bar (`progressWeeksDone / progressWeeksTotal`). Domain-locked.
- `ReadinessBadge` / `HireBadge` — placement-specific Yes/No/Risk pills.
- `RowActions` — generic `RowActionDef[]` consumer that renders a single `Tip+Button` if `actions.length === 1`, else a kebab `DropdownMenu`. **Reusable across domains** — only the `Placement` typed row prop is domain-locked (could be parameterised).
- `PLACEMENT_ROW_ACTIONS` — placement-specific action list (`Edit / Open / Delete`).

**PCE's hand-rolls inside DataTable ColumnDef.cell renderers:**
| File | Lines | What it duplicates |
|---|---|---|
| `apps/pce/admin/app/(app)/admin/faculty/page.tsx:65–77, 169–185` | inline | AvatarCircle (uses `Avatar` + `AvatarFallback` from DS instead — 10 lines per page) + kebab `RowActions` |
| `apps/pce/admin/app/(app)/admin/permissions/page.tsx:189–194, 200–210` | inline | AvatarFallback + kebab |
| `apps/pce/admin/app/(app)/admin/students/page.tsx:135–140, 200–215` | inline | AvatarFallback + kebab + status badge variant resolver (line 39 `statusBadgeVariant`) |
| `apps/pce/admin/app/(app)/admin/offerings/page.tsx:197, 204, 415–430` | inline | Status badge + kebab |
| `apps/pce/admin/app/(app)/admin/terms/page.tsx:133, 268–285` | inline | Kebab |
| `apps/pce/admin/app/(app)/admin/accommodations/page.tsx:160, 169, 340–355` | inline | Status badge + kebab |
| `apps/pce/admin/app/(app)/admin/content-areas/page.tsx:118` | inline | Status badge |
| `apps/pce/admin/app/(app)/admin/competencies/page.tsx:138` | inline | Status badge |
| `apps/pce/admin/app/(app)/admin/standards/page.tsx:122` | inline | Status badge |
| `apps/pce/admin/components/pce/pce-badges.tsx:46–61` | 16 | `SurveyStatusBadge` — PCE-specific lifecycle badge (custom CSS vars, not the canonical `ListHubStatusBadge`) |

**Verdict — partial vendor / cherry-pick:**
- **`RowActions` + the `RowActionDef` interface** is the single biggest win — 6+ PCE pages reinvent the same `DropdownMenu + DropdownMenuTrigger + Button(fa-ellipsis)` block (~15 lines each, ~90 lines duplicated). Vendor as a generic `<RowActions<TData>>` and pass `actions: RowActionDef<TData>[]`. Effort: ~30 min (strip `Placement` typing → make generic).
- **`AvatarCircle`** is trivially small (10 lines) but PCE already uses DS `Avatar` + `AvatarFallback`, which is the more idiomatic DS path. **Skip** — the DS `Avatar` is the better primitive; canonical's `<span>` shortcut bypasses DS.
- **`StatusBadge` / `WeeksProgressCell` / `ReadinessBadge` / `HireBadge`** are placement-domain. **Skip** — not transferable. PCE's `SurveyStatusBadge` is the right pattern (domain-owned, per-product), but the *shell* (`ListHubStatusBadge` from `@/components/list-hub-status-badge`) would be worth a separate audit: it's the reusable lifecycle-pill shape underneath.
- **`PLACEMENT_ROW_ACTIONS` constant** — example, not reusable. Skip.

---

### placements-list-view

**Use case:** Full-width row layout as an *alternative view* to the table grid — shares column-visibility and conditional-format state with the table, virtualises rows ≥80 via `useWindowVirtualizer`. Designed to be the `list` segment in `ViewSegmentedControl` (table / list / board / dashboard).

**Dependencies if vendored:** `@tanstack/react-virtual`, `@/components/data-list-table-cells` (`StatusBadge`), `@/lib/placement-board-card-layout` (`isBoardFieldActive`, `scheduleKeysForTab`, `BoardCardLifecycleTabId`), `@/lib/conditional-rule-match` (`getConditionalRowBackground`), `@/components/table-properties/types` (`ConditionalRule`), `@/components/data-table/types` (`ColumnDef`).

**Current PCE need:** zero. No admin entity page has been asked for list/table/board toggle. Aarti's directives (May 5 / May 7) frame the admin entity pages as flat inventory lists with row click → drilldown; the `(table | list | board)` view-type pattern is a placement-management UX that PCE does not inherit.

**Verdict — defer.** Skipping until a route asks for a non-table presentation of the same row set (e.g., surveys-as-board for moderation queue, but even that is hypothetical). If/when it comes, vendor alongside `table-properties` types so the column-visibility state stays unified.

---

### section-cards

**What it provides:** A hard-coded 4-card KPI grid (Total Revenue, New Customers, Active Accounts, Growth Rate) using DS `Card` + `CardHeader` + `CardTitle` + `CardDescription` + `CardAction` + `CardFooter`, with a `from-primary/5 to-card` gradient backplate and `@container` queries for responsive value typography (`@[250px]/card:text-3xl`).

**SectionCards vs KeyMetrics:**

| Dimension | KeyMetrics | SectionCards |
|---|---|---|
| Composition | Single organism — header, period select, Ask Leo CTA, insight rail, metrics row | Loose grid of Cards — no header, no period, no insight |
| Density | 1 row of compact stats + optional side rail | 4 large cards each with title + value + trend badge + footer line |
| Interaction | `href` / `onClick` per metric, period dropdown | Static — demo has no click handlers |
| Variants | `card` / `flat` / `compact` | None — re-write the JSX to customise |
| A11y | sr-only labels for trend, `aria-label` on period select, `role="region"` on insight | Trend conveyed by icon + text — adequate |
| Effort to use | Pass `metrics` array (already vendor-ready in PCE? Not yet — would need vendor) | Pattern-copy: it's literally 4 hard-coded `<Card>`s |

**When would a team choose SectionCards over KeyMetrics?**
- **SectionCards wins** when (a) you want bigger per-card surface area, (b) the cards are *navigational tiles* not at-a-glance KPIs, (c) you want a footer line per card (trend narrative).
- **KeyMetrics wins** when (a) you want dense KPI strips, (b) you need a period selector / Ask Leo / insight rail, (c) trend deltas matter and you want unified styling.

**Adoption candidate — PCE home (`apps/pce/admin/app/(app)/page.tsx`):**
The current `FolderCard` (lines 36–80) is essentially a hand-rolled section-card: icon + title + description + metric line + status. It already adheres to the SectionCards visual logic (large card, navigational, footer narrative). **But** it's already shipped, idiomatic, and ~45 lines per card. Replacing with SectionCards-pattern would require parameterising the four hard-coded cards in the canonical — which means we're not really *adopting* SectionCards, we'd be using it as inspiration.

**Verdict — defer; keep `FolderCard` as-is.** SectionCards is a demo pattern more than a component. Document it as a reference for future "navigational tile grid" needs, but no vendor. KeyMetrics remains the canonical for KPI strips (see `key-metrics.md` audit).

---

### export-drawer

**What it provides** (336 lines, well-isolated):
- Right-floating, rounded, inset Sheet (matches `TablePropertiesDrawer` chrome — `showCloseButton=false`, `showOverlay=false`, `top/bottom/right: 0.5rem`)
- RHF + Zod form with 4 fields:
  - File format (`SelectionTileGrid` radio: CSV / Excel / PDF — uses fa-file-* icons)
  - Date range (two `DatePickerField`s, From/To, with cross-field zod refinement)
  - Columns (`RadioGroup`: All / Visible only — visible count passed in from caller)
  - Apply active filters (`Checkbox` — applies current filter state to export)
- Footer with Cancel / Export buttons + `⏎` / `Esc` `Kbd` hints
- `Shortcut` component wiring `Enter` to submit
- Loading state with `fa-spinner-third fa-spin`

**A11y:** `FormLabel` linked to control id (1.3.1), `FormMessage` aria-describedby (3.3.1), focus returns to trigger on Sheet close (2.4.3). All `aria-hidden="true"` on icons. No issues spotted.

**Dependencies if vendored:** `react-hook-form`, `@hookform/resolvers/zod`, `zod` (PCE already has all three for dialog forms). DS pieces all published: `Sheet`, `Form*`, `RadioGroup`, `Checkbox`, `DatePickerField`, `SelectionTileGrid`, `Button`, `Label`, `Tip`, `Kbd`. The `Shortcut` import from `dropdown-menu.tsx` is unusual — verify it's re-exported in `@exxat-ds/ui` (PCE imports use `@exxat/ds/packages/ui/src` barrel).

**Future PCE export needs (none ship today):**
| Route | Plausible export | Priority |
|---|---|---|
| `app/(app)/surveys/[id]/responses/page.tsx` | Survey responses CSV (verbatim quotes + ratings) | **High — Aarti has not asked, but every survey tool ships this** |
| `app/(app)/moderation/page.tsx` | Moderation queue export (flagged comments for offline review) | Medium |
| `app/(app)/analytics/page.tsx` | Analytics CSV / PDF download | Medium |
| `app/(app)/admin/*/page.tsx` (11 entity pages) | Bulk entity export (faculty CSV, students CSV, etc.) | Low — admin lists rarely need bulk export in v1 |

**First high-impact target:** survey responses page. It's the only route where export is table-stakes for the user task ("I need to share/archive responses").

**Verdict — adopt when first export feature is requested.** Effort: ~2 hours to vendor as-is. Per-route customisation (columns option set, format choices) is the parameterisation work after. Don't vendor preemptively — wait for a user-facing trigger.

---

### table-properties-drawer

**What it provides** (1041-line drawer + 6 sibling files in `table-properties/`):

Multi-panel Sheet (right-floating, same chrome as ExportDrawer) with seven panels stitched together via `sheetPanel` state:
- **Main panel** — overview cards summarising current state (view type, gridlines/pagination, filter count, sort, column count, group, conditional rule count)
- **Display panel** — `RowHeight` (3 tiles), gridlines toggle, pagination toggle, column-labels toggle (board/list), toolbar-search toggle (list), board line-count select
- **Filter panel** — `DrawerFilterCard` — add/remove/edit filters, AND/OR connectors between filters, filter-bar visibility toggle
- **Sort panel** — `DrawerSortCard` + drag-and-drop reorder via `useDraggableList`, multi-rule sort
- **Group panel** — single-key group-by selector (no nested groups)
- **Columns panel** — `ColumnRow` per column, drag-and-drop reorder (`select` + `actions` pinned at ends), per-column visibility toggle
- **Conditional rules panel** — rule builder with `RULE_COLORS` palette (background tint by predicate match)

**Wires into DataTable:** PCE's vendored `data-table/index.tsx` already exposes `toolbarSlot?: (state: ReturnType<typeof useTableState<TData>>) => React.ReactNode` (lines 417, 425, 623, 635, 675, 781). The canonical drawer expects ~30 controlled props (filter list, sort rules, column order, hidden cols, group key, conditional rules, display options, plus all corresponding setters) — all of which `useTableState` already manages internally. **The wiring is genuinely ready** — it's a matter of vendoring the drawer + threading state.

**⚠️ Current import inconsistency:** PCE's `data-table/index.tsx:55–56` imports `OPERATOR_LABELS` and `ActiveFilter` from `@/components/table-properties/types` — which means either (a) the types module already exists at `apps/pce/admin/components/table-properties/types.ts` (silent vendor — needs verification), or (b) the import is dead and the DataTable's filter chip UI is broken. **Verify first** before any further vendor work.

**Effort to vendor (1041 + 6 sibling files):** ~6–8 hours full-fidelity, or ~3 hours for a stripped-down vendor that omits conditional rules + group-by (PCE has no current use for those). The drawer's panel-routing pattern is well-encapsulated — removing two panels is mechanical.

**Highest-impact PCE target — which DataTable page benefits most from column visibility:**

| Page | Columns | Reason to want column-visibility |
|---|---|---|
| `students/page.tsx` (454 lines) | 7+ cols (name, email, program, term, status, enrollment) | Highest column count, admin user wants to focus on subsets |
| `offerings/page.tsx` (450 lines) | 6 cols (course, term, faculty, students, status, location) | Faculty/admin filter by term frequently — saved-view-adjacent need |
| `accommodations/page.tsx` (370 lines) | 5 cols + status | Lower value — flat list, narrow use |
| Others | 3–4 cols | Not worth the chrome |

**Winner: students page.** Largest column inventory + most likely to be filtered by audience (cohort, term, status). If the drawer is vendored, that page is the first beneficiary.

**Verdict — adopt as the natural follow-up to PCE's DataTable vendor, BUT only after (a) the broken/unverified `table-properties/types` import is reconciled and (b) Aarti or a faculty user actually asks for column visibility on a specific list (no current signal).** Effort to vendor stripped (no conditional rules / group): ~3 hours. Effort full: ~7 hours. The drawer is impressive but heavy — don't preemptively vendor 1.6 KLOC for hypothetical needs.

---

### list-page-template

**What it offers beyond DataTable + manual sidebar layout** (533 lines):
- Header slot + optional metrics slot + views-toolbar + content area + ExportDrawer + Rename dialog + Review-view dialog
- Controlled/uncontrolled tab management with `localStorage` opt-in
- `Shortcut` wiring for `⌘⇧1..9` (add view by type), `F2` (rename), `⌘E` (edit view), `⌘D` (duplicate), `⌘I` (review), `⌘⌫` (remove)
- Per-tab `viewType` + `filterId` + `icon` + `label`
- `tablePropertiesRef` plumbing: passes a ref to the active table's `openPropertiesDrawer` handle, allowing the views-toolbar `Edit` action to open the table-properties drawer when the active view is a table
- `renderContent(tab, updateTab)` callback — caller renders the right view for the active tab

**PCE admin entity pages currently roll their own:**
```
<SidebarTrigger /> <h1>Faculty</h1>          ← page header
<KeyMetrics ... />                            ← optional metrics
<FilterBar ... />                             ← search + filter chips
<DataTable columns={...} data={...} />       ← content
<NewEntityDialog />                          ← create modal
```
Each entity page repeats this shape 11 times. Total ~3.4 KLOC across 11 routes; the redundant chrome ("page header + metrics row + filter row + table") is ~30 lines per page.

**What ListPageTemplate doesn't simplify:** the per-page entity-specific logic (mock data shaping, create-modal forms, archive handlers). That's the bulk of each file's 200–450 lines. The chrome it would unify is ~30 lines/page = ~330 lines workspace-wide.

**What ListPageTemplate adds that PCE doesn't currently want:**
- View tabs with `(table | list | board | dashboard)` toggle — PCE has no list/board/dashboard surfaces planned
- Add-view / rename-view / duplicate-view affordances — PCE has no saved-views feature
- Export drawer slot — PCE has no export needs today
- `⌘⇧1..9` shortcut wiring — premature for an unshipped product

**Verdict — defer.** ListPageTemplate is built for the "Notion-database-style" multi-view list (placements is the canonical user). PCE's 11 admin entity pages are flat single-view inventories. Adopting the template would (a) lock PCE into a multi-view abstraction it doesn't use, (b) require feeding 8+ unused props per page, (c) save ~30 lines of chrome at the cost of clarity. **The current per-page shape is more idiomatic for the actual use case.**

**What to extract instead:** a thin `AdminListPageHeader` component (sidebar-trigger + title + optional metrics row + optional action button) — ~40 lines, would unify the top of all 11 pages without inheriting the views-toolbar machinery. Effort: ~1 hour. Stays in PCE; not a DS vendor.

---

### views-toolbar

**What it provides** (inline in `list-page.tsx:302–446`, not a separate export):
- `role="toolbar"` with view tabs (button + `aria-pressed`, NOT a `tablist` per WCAG — settings/close aren't tabs)
- Per-tab count pill with palette by `filterId` (`viewToolbarCountBadgeClass` — slate/amber/blue/emerald for all/upcoming/ongoing/completed)
- Active tab has a `fa-chevron-down` settings menu (Rename / Edit / Duplicate / Review / Remove)
- Inactive tabs have a hover-revealed `fa-xmark` close button (24×24 min touch target)
- Trailing `Add view` ghost button with `(table | list | board | dashboard | …)` dropdown

**Distinct from DS Tabs:** DS Tabs is a generic `role="tablist"` for switching panels. ViewsToolbar is a *view-management* affordance with per-tab CRUD (rename/duplicate/remove), count pills, and an explicit non-tab role. Two genuinely different patterns:
- **DS Tabs** — "Switch between *what you're viewing*" (e.g., Survey detail tabs: Overview / Responses / Settings)
- **ViewsToolbar** — "Manage *named persisted views*" (e.g., All placements / My placements / Q1 cohort — each a saved filter+column-visibility configuration)

**Current PCE need:** zero. No saved-views feature exists or is on the roadmap. No directive from Aarti about user-configurable list views.

**Use case for the future:** when faculty users say "I want to save 'My active courses' as a default view" — that's the trigger. PCE's `surveys/page.tsx` could plausibly get there ("My drafts / Released / Closed" as saved views with column overrides), but it's not requested yet.

**Verdict — defer until saved-views feature ships.** When it does, vendor as part of ListPageTemplate (they're inseparable). The count-pill colour palette + per-tab settings menu are the load-bearing patterns; the rest is mechanical.

---

## Combined: 3 highest-leverage organism adoptions for PCE

1. **`RowActions` from `data-list-table-cells`** — generic kebab-menu component. 6+ PCE admin entity pages reinvent the same `DropdownMenuTrigger + Button(fa-ellipsis) + DropdownMenuContent` block. Effort: ~30 min to extract as generic `<RowActions<TData>>` (parameterise the typed row). Saves ~90 lines workspace-wide. **Do this first.** Add to `apps/pce/admin/components/data-table/` (sibling of the vendored DataTable).
2. **`TablePropertiesDrawer` (stripped: no conditional rules, no group-by)** — natural follow-up to PCE's DataTable vendor. Wires into existing `toolbarSlot` prop. First beneficiary: `students/page.tsx`. Effort: ~3 hours stripped, ~7 hours full. **Block on:** verify `apps/pce/admin/components/table-properties/types` exists (PCE's DataTable already imports from it — possibly silently vendored, possibly broken) AND on a real user signal for column visibility (no signal today).
3. **`ExportDrawer`** — when the first export feature is requested (most likely on `surveys/[id]/responses/page.tsx`). Effort: ~2 hours to vendor as-is. **Block on:** an actual product request. Don't preemptively vendor.

**Explicitly defer:** PlacementsListView, SectionCards, ListPageTemplate, ViewsToolbar — none of these have a matching PCE pattern. Adopting them would force PCE into a multi-view list abstraction it doesn't need.

---

## Cross-product extraction candidates

| Pattern | Both products would benefit | Suggested home |
|---|---|---|
| Generic `RowActions<TData>` + `RowActionDef<TData>` | PCE: 6+ admin entity pages. Exam-mgmt: qb-table, accommodations, faculty actions. Aarti's ADR-001 entity-architecture explicitly shares Faculty between Exam Mgmt + CFE. | `packages/ui/src/row-actions.tsx` if `@exxat-ds/ui` will publish, OR a workspace-shared local at `apps/_shared/row-actions.tsx` if not. Either way: **same code, both products** — don't fork twice. |
| `TablePropertiesDrawer` (stripped) | Once vendored in PCE, exam-mgmt's `qb-table.tsx:789` "DS TablePropertiesDrawer-inspired" hand-roll should be replaced with the same vendor — the comment literally admits it's reinventing. | Same shared location as DataTable vendors (currently per-product). Consider promoting both DataTable + TableProperties to a workspace-shared `apps/_shared/data-table/` after PCE proves the API. |
| `ExportDrawer` | When export ships in either product, the other will follow. | Same shared location. |
| Surface/lifecycle `StatusBadge` pattern (the `ListHubStatusBadge` shell, not the placement-specific `StatusBadge`) | PCE has `SurveyStatusBadge` (custom). Exam-mgmt has `qb/badges.tsx`. Both reinvent the same dot+label+tint+tooltip pill. | `packages/ui/src/list-hub-status-badge.tsx` would unify — but PCE/exam-mgmt each need their own domain status maps. Vendor the *shell*, keep per-product maps. |

---

## What this audit can't see

- Whether the canonical's visual choices (gradient backplates on SectionCards, slate/amber/blue/emerald count-pill palette on ViewsToolbar) match Aarti's preferences. The `feedback_aarti_no_red` memory says avoid red for score/rating viz — count pills are non-score, so likely OK, but a visual review is needed before any vendor.
- Whether the maintenance burden of vendoring 1.6 KLOC of `table-properties/` is worth the column-visibility feature it unlocks for one (students) page. That's a product-priority call.
- Whether the `Shortcut` component (referenced in `dropdown-menu.tsx` and `list-page.tsx`) is exported from `@exxat-ds/ui` or is `apps/web/`-local. Verify before vendoring ExportDrawer or ListPageTemplate.
- Whether `apps/pce/admin/components/table-properties/types.ts` exists (PCE's vendored DataTable imports from there). **Action item:** confirm or fix — this is a real-or-broken-import gate, not a hypothetical.
- Whether PCE's vendor of DataTable already silently brought `OPERATOR_LABELS` + `ActiveFilter` along — if so, the audit's "0 adoption" line for TablePropertiesDrawer is partially wrong (the types substrate is already there, only the drawer UI is missing).
