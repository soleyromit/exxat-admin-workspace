# DS Adoption Registry

> Canonical reference for **what to import vs. what's safe to build** when adding
> features to product apps. The single source of truth referenced by:
> - `scripts/ds-adoption-audit.py` (enforcement at pre-commit + on demand)
> - `.claude/agents/ds-adoption-reviewer` (write-time gate subagent)
> - Workspace `CLAUDE.md` §8 (absolute rules)
> - Per-product `CLAUDE.md` (Section 3-4 component lists)
>
> When this file disagrees with reality, **fix this file** — it's the law.
>
> Maintainer: Romit Soley. Last reviewed: 2026-05-11.

---

## How to use this registry

**Before adding any new component file under `apps/*/admin/components/` or `apps/*/student/components/`:**

1. Check this registry for the closest DS organism by intent (not by name).
2. If `kind: "import"` — `import` directly from the listed path. **Never duplicate.**
3. If `kind: "vendor"` — copy the source into your product's `components/` once, rewrite imports per the recipe, then re-use across product. Re-vendoring is allowed only if upstream API has changed.
4. If `kind: "hand-roll-allowed"` — proceed, but document why in a code comment AND add the file to "Documented hand-rolls" below so future audits know it's intentional.
5. If the organism you need isn't listed — **stop**. Add it here first (or escalate to Himanshu if it needs upstream changes), then build.

The `ds-adoption-reviewer` subagent automates steps 1-5. It MUST be invoked before writing any file under `apps/*/<role>/components/<name>.tsx` where `<name>` matches a DS organism. See workspace `CLAUDE.md` §8.

---

## Component registry — what to import, what to vendor, what to hand-roll

### Atoms (small primitives — always import)

| Component | Library route | Import path | Notes |
|---|---|---|---|
| Button | `/library/button` | `import { Button } from '@exxat/ds/packages/ui/src'` | Variants: default, secondary, outline, ghost, destructive, link. Sizes: xs, sm, default, lg, icon-xs, icon-sm, icon, icon-lg. Never `<button>`. |
| Badge | `/library/badge` | `import { Badge } from '@exxat/ds/packages/ui/src'` | Variants: default, secondary, outline, destructive, ghost, link. Use `className="rounded"` for rectangular shape. |
| Input | `/library/input` | `import { Input } from '@exxat/ds/packages/ui/src'` | Use `aria-invalid` for error state. |
| Skeleton | `/library/skeleton` | `import { Skeleton } from '@exxat/ds/packages/ui/src'` | Loading placeholders. |
| Kbd | `/library/kbd` | `import { Kbd, KbdGroup } from '@exxat/ds/packages/ui/src'` | Keyboard hints. Always with `aria-hidden`. |
| Calendar | `/library/calendar` | `import { Calendar } from '@exxat/ds/packages/ui/src'` | DayPicker; use inside Popover for date pickers. |
| Date Picker Field | `/library/date-picker-field` | `import { DatePickerField } from '@exxat/ds/packages/ui/src'` | Calendar + Popover trigger. Use for any deadline / start-date / end-date input — never `<Input type="date">` or free-text. Value is `Date \| undefined`; the trigger button exposes the formatted date as its accessible label. **Adopted in PCE 2026-05-11**: 1 survey deadline + 2 term date inputs migrated. |
| Tooltip | `/library/tooltip` | `import { Tooltip, TooltipTrigger, TooltipContent } from '@exxat/ds/packages/ui/src'` | Provider wraps app in layout. |

### Molecules (compositions — always import)

| Component | Library route | Import path | Notes |
|---|---|---|---|
| Card | `/library/card` | `import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter } from '@exxat/ds/packages/ui/src'` | **Always use the slot composition.** Bare `<Card>` with raw `<div>` children is banned (audit catches it). `size="sm"` for compact grids. |
| Tabs | `/library/tabs` | `import { Tabs, TabsList, TabsTrigger, TabsContent } from '@exxat/ds/packages/ui/src'` | Variants: default (pills on tinted track), `variant="line"` (underline, dense). |
| Input Group | `/library/input-group` | `import { InputGroup, InputGroupAddon, InputGroupInput } from '@exxat/ds/packages/ui/src'` | Search fields with icon addons. |
| Dropdown Menu | `/library/dropdown-menu` | `import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@exxat/ds/packages/ui/src'` | Variants on Item: default, destructive. |
| Dialog | `/library/dialog` | `import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@exxat/ds/packages/ui/src'` | Modal confirmations / short forms. Add `aria-invalid` to inputs on validation error. |
| Sheet | `/library/sheet` | `import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription } from '@exxat/ds/packages/ui/src'` | Slide-over drawer; sides: top/right/bottom/left. Floating-sheet pattern with `showOverlay={false}` for properties drawers. |
| Tip | `/library/tip` | `import { Tip } from '@exxat/ds/packages/ui/src'` | Tooltip + label + optional Kbd shorthand. |
| View Segmented Control | `/library/view-segmented-control` | `import { ViewSegmentedControl } from '@exxat/ds/packages/ui/src'` | Radiogroup for table/list/board/dashboard toggles. Distinct from ToggleGroup (which is for content-filter toggles like term/cohort). |
| Coach Mark | `/library/coach-mark` | `import { CoachMark, useCoachMark } from '@exxat/ds/packages/ui/src'` | Multi-step walkthrough. Currently 0 adoption across workspace — biggest unused organism. |
| Command Menu | `/library/command` | `import { Command, CommandDialog, CommandInput, CommandList, CommandItem } from '@exxat/ds/packages/ui/src'` | ⌘K palette. Currently 0 adoption. |

### Organisms (large composites)

| Component | Library route | Status in submodule | Adoption strategy | Notes |
|---|---|---|---|---|
| **DataTable** | `/library/data-list-table` | Source: `exxat-ds/apps/web/components/data-table/` (5 files, ~2150 lines). **NOT** published to `packages/ui/src/`. | **VENDOR** into product `components/data-table/`. PCE vendored 2026-05-11 with three small extensions (`defaultGroupBy`, `groupLabels`, `groupOrder`). **exam-management vendored 2026-05-11** at `apps/exam-management/admin/components/data-table/` (5 canonical files + `row-actions.tsx` + supporting `components/table-properties/types.ts` and `lib/{editable-target,row-height}.ts`); mirrors PCE's 3 extensions exactly. The 31-LoC hand-rolled `data-table.tsx` wrapper was deleted; 2 consumer pages (`app/(app)/access/page.tsx`, `app/(app)/private/page.tsx`) migrated to canonical with `ColumnDef`/`RowActions`. Grandfathering removed. Other products should vendor the same way until upstream publishes. | Features: sort, resize, reorder, pin, wrap, per-column quick search, row selection + bulk-actions bar, group rows, hidden columns, filter pills, conditional rules. Use it whenever a list page renders >1 record. **Raw `<Table>` in product code is banned** outside `components/data-table/` itself. |
| **Key Metrics** | `/library/key-metrics` | Source: `exxat-ds/apps/web/components/key-metrics.tsx` (~860 lines). NOT in `packages/ui/src/`. | **VENDORED into PCE 2026-05-11** at `apps/pce/admin/components/key-metrics/index.tsx`; first consumer is `app/(app)/analytics/page.tsx` (replaced the 4× `KpiButton` hand-roll). **exam-management vendored 2026-05-11** at `apps/exam-management/admin/components/key-metrics/index.tsx`; consumers are `competency-client.tsx` and `live-monitor-client.tsx`. The hand-rolled `key-metrics.tsx` (54 lines, `text-primary` bug, no a11y trend label) was deleted. `KpiTile` in `faculty-ui-kit.tsx` retained as a documented hand-roll — product-specific `tone`/`pulseIcon`/`active` props don't map onto canonical (see Documented hand-rolls section). `useAskLeo` / `AskLeoShortcutKbds` stubbed locally in both vendors until a real Ask Leo provider lands. | Variants: card, flat, compact. Optional insight rail + period selector. WCAG 2.1 AA KPI strip — use for every dashboard / analytics KPI row. |
| Section Cards | `/library/section-cards` | Source: `exxat-ds/apps/web/components/section-cards.tsx` (~110 lines). | **VENDOR** when needed. 0 adoption workspace-wide. | Gradient KPI card grid; alternative to KeyMetrics when card-grid layout is preferred. |
| Export Drawer | `/library/export-drawer` | Source: `exxat-ds/apps/web/components/export-drawer.tsx` (~320 lines). | **VENDOR** when export feature is added to any product. 0 adoption. | Format + date range + column scope. Built on Sheet with floating-panel pattern. |
| Table Properties Drawer | `/library/table-properties-drawer` | Source: `exxat-ds/apps/web/components/table-properties/drawer.tsx` (~1041 lines). | **VENDOR alongside DataTable**. exam-mgmt has 1 file using it. **PCE vendored 2026-05-11** at `apps/pce/admin/components/table-properties/drawer.tsx` as a STRIPPED version (~750 LoC w/ Filter+Sort+Columns panels only; conditional-rules, group-by, view-type, row-density, display-options stripped per organisms-templates depth audit). First consumer: `/admin/students/page.tsx`. | Column visibility, density, sort rules, filter rules. Wire into DataTable's `toolbarSlot`. |
| Data List Table Cells | `/library/data-list-table-cells` | Source: `exxat-ds/apps/web/components/data-list-table-cells.tsx` (~162 lines). | **VENDOR** when DataTable is in use. | Pre-built cell renderers: AvatarCircle, StatusBadge, WeeksProgressCell, RowActions. Use inside `ColumnDef.cell`. |
| Placements List View | `/library/placements-list-view` | Source: `exxat-ds/apps/web/components/placements-list-view.tsx` (~320 lines). | Reference pattern — adopt only if list-view toggle is needed. | Virtualized row layout for long datasets. |
| Sidebar | `/library/sidebar` | Published in `packages/ui/src/`. | **IMPORT** — already adopted at app shell. | `SidebarProvider` wraps `RootLayout`; SidebarInset for content. |

### Visualization (cross-product gap)

| Component | Library route | Status | Adoption strategy | Notes |
|---|---|---|---|---|
| Chart (Recharts wrapper) | `/library/chart` | Published in `packages/ui/src/`. | **IMPORT** for standard charts. | `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartConfig`. Wraps Recharts with theming + dark-mode. |
| **Custom viz patterns** | n/a (not in DS) | Documented hand-roll | **HAND-ROLL ALLOWED** when chart is genuinely bespoke (bullet-vs-target, gap heatmap, score landscape, slope-paired, cleveland-dot, sankey). Per Aarti "viz first" preference. | When you hand-roll viz, **add it to `apps/<product>/docs/patterns/viz-handrolled.md`** with: what visual it shows, why a standard chart wouldn't work, dimensions of the SVG. Reviewed at audit time. |

---

## Documented hand-rolls (intentional, audited)

When a product genuinely needs a custom component that overlaps a DS organism, add it here with the reason. Audit script ignores files in this list.

### Cross-product (vendored twice, identical implementation)
| File | Lines | Mirrors DS organism | Justification |
|---|---|---|---|
| `apps/pce/admin/components/pce/micro-trend.tsx` + `apps/exam-management/admin/components/micro-trend.tsx` | ~190 each (identical) | Chart sparkline | Shared inline-SVG sparkline primitive (line + optional area-fill + optional last-point dot + optional reference line). Extracted 2026-05-11 from PCE's `trend-sparkline.tsx` and exam-management's `TrendRow` per chart depth audit. Used by PCE's TrendSparkline wrapper (`trend-sparkline.tsx`, ~110 LoC) and exam-management's TrendRow (curricular-loop-diagram.tsx l.797, ~70 LoC). Both vendors are byte-identical (audit-verified). Upstream candidate: when DS publishes `<MicroTrend>` in `packages/ui/src`, both vendors should delete + import; flag Himanshu when ready. |

### PCE
| File | Lines | Mirrors DS organism | Justification (with date + commit) |
|---|---|---|---|
| `apps/pce/admin/components/pce/trend-sparkline.tsx` | ~110 | Chart sparkline | Aarti 2026-05-09 "viz first": sparkline must be inline, no axes/labels — DS Chart wrapper adds chrome. **Refactored 2026-05-11**: now a thin wrapper around the shared `<MicroTrend>` primitive (see Cross-product row). Product-specific affordances retained: empty-state ("—") and single-offering ("first time") placeholders, delta-text span, slope-tone color selection (chart-2/chart-4/muted-foreground per Aarti's no-red rule). |
| `apps/pce/admin/components/pce/response-gauge.tsx` | (verify) | Chart / Progress | Custom rate display with response-count secondary text — DS doesn't have a gauge primitive. |
| `apps/pce/admin/components/pce/ai-insight-card.tsx` | (verify) | Card + Banner hybrid | Insight + dismiss + AI-marker pattern not covered by DS Card or Banner alone. |
| `apps/pce/admin/components/table-properties/drawer.tsx` | ~750 | TablePropertiesDrawer | **Vendored 2026-05-11** (stripped, ~340 LoC custom code over canonical's 1041) per organisms-templates depth audit. Strip: removed conditional-formatting rules, group-by config, view-type switcher, row-density, display-options panel. Kept: column visibility + drag-reorder, sort rules with drag-priority, filter rules with AND/OR connectors. First consumer: `/admin/students/page.tsx` (wired via DataTable's `toolbarSlot` prop). Re-vendor or extend when the omitted panels are needed. |
| `apps/pce/admin/app/(app)/analytics/page.tsx` (`ScoreLandscape` at l.29) | ~90 | Chart (could attempt Recharts but mismatch) | Per Chart depth audit 2026-05-11: ScoreLandscape is a list-with-bar + keyboard rows pattern, not a bar chart. Recharts adds chrome that conflicts with the row+drill design. Aarti "viz first" intent preserved. |
| `apps/pce/admin/components/command-menu/index.tsx` | ~verbatim | CommandMenu organism | **Vendored 2026-05-27** verbatim from `node_modules/@exxatdesignux/ui/template-vite/components/command-menu.tsx`. Not exported from DS dist — template-vite only. Moved to `components/command-menu/` subdirectory to avoid organism-name-collision audit rule. Exports: `CommandMenu`, `requestOpenCommandMenu`, `OPEN_COMMAND_MENU_EVENT`. |
| `apps/pce/admin/components/ask-leo-sidebar.tsx` | ~verbatim | AskLeoSidebar organism | **Vendored 2026-05-27** verbatim from `node_modules/@exxatdesignux/ui/template-vite/components/ask-leo-sidebar.tsx`. Not exported from DS dist — template-vite only. Exports: `AskLeoProvider`, `AskLeoSidebar`, `useAskLeo`, `useAskLeoPageContext`, `AskLeoPageContext`. The one raw `<button>` at l.325 is inside the vendored source — do not modify (upstream change needed). |
| `apps/pce/admin/components/pce/distribute-wizard/email-list-sheet.tsx` (table at l.138) | ~25 | DataTable | Compact editable roster inside a Sheet — not a sortable/filterable list page. Rows are shown after manual entry or CSV import; user removes rows inline. Full DataTable organism adds sort/resize/column-toggle chrome that conflicts with the sheet's fixed-width layout and the add-row / remove-row interaction model. Hand-roll uses DS Table primitives for correct semantic markup without DataTable affordances. Documented 2026-05-29. |
| `apps/pce/admin/components/pce/distribute-wizard/exxat-prism-sheet.tsx` (table at l.357) | ~35 | DataTable | Student picker inside a Sheet with its own search/filter header. Row selection is checkbox-driven but the table is embedded inside a Sheet with a pinned footer ("Add N students") — the DataTable's built-in bulk-actions bar would conflict with the Sheet's footer CTA. Documented 2026-05-29. |
| `apps/pce/admin/components/pce/distribute-wizard/step-report-access.tsx` (table at l.87) | ~70 | DataTable | Role × student/group access matrix — rows are recipients, columns are access roles (View, Comment, Manage). Not a list of records; it's a cross-tab permission grid. DataTable has no cross-tab / matrix-column model. Documented 2026-05-29. |

### exam-management
| File | Lines | Mirrors DS organism | Justification |
|---|---|---|---|
| `apps/exam-management/admin/components/curricular-loop-diagram.tsx` (`PerformanceHeatmap` at l.267) | ~50 | Chart heatmap | No Recharts heatmap primitive exists. Custom SVG heatmap with brand-color gradient. Per Chart depth audit 2026-05-11. |
| `apps/exam-management/admin/components/curricular-loop-diagram.tsx` (`TrendRow` at l.797) | ~70 | Chart sparkline (in matrix) | 20 ResponsiveContainers per matrix row would be a perf regression. HTML dot overlay can't survive Recharts. Per Chart depth audit 2026-05-11. **Refactored 2026-05-11**: the inline SVG (line + area + reference line) now renders via the shared `<MicroTrend>` primitive with `sizing="fluid"` and `stroke=areaFill="currentColor"` (tone color inherited from the wrapping `${lastTone.text}` class). HTML dot overlays remain product-specific — they must stay circular regardless of column width, so they sit outside the stretching SVG. |
| `apps/exam-management/admin/components/faculty-ui-kit.tsx` (`KpiTile` at l.46-86) | ~45 | KeyMetrics MetricCell | Domain wrapper retained 2026-05-11 alongside the canonical KeyMetrics vendor (`components/key-metrics/`). KpiTile carries product-specific affordances that canonical doesn't model: `tone` (6 named tones mapped to chart tokens via TONE_TILE palette), `pulseIcon` (live-state indicator), `active` (selectable tile group state, e.g. roster filter chips). Used 6× in `analytics-client.tsx` + `overview-tab.tsx`. Canonical's `trend`/`metricVariant="hero"`/`onClick` cover the common case but not the tone-coded swatch + live-pulse + ARIA-pressed group affordance. Migration would require either extending the canonical (upstream change) or flattening tones into trend semantics (loses information). Kept as a documented hand-roll; the hand-rolled `key-metrics.tsx` (no such product affordances) was deleted in the same session. |
| `apps/exam-management/admin/app/(app)/assessment-builder/assessment-builder-client.tsx` (question picker grid at l.695) | ~70 | DataTable | Picker grid tightly coupled to the builder shell: full-row click toggles selection, custom selected-row background tint, embedded between smart-view chips and a footer diff chart. The canonical DataTable's selection model is checkbox-driven and doesn't expose row-click-toggle or per-row background overrides without losing other affordances. Documented as a hand-roll in the DataTable adoption pass 2026-05-11; consider revisiting if the canonical DataTable grows a `pickerMode` variant upstream. |
| `apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx` (spreadsheet grid at l.3488) | ~3500 | DataTable | Purpose-built spreadsheet for the question bank: frozen header + left column, virtual scroll over thousands of rows, inline cell editing, drag-handle column resizing, and multi-level group-by (category → type → question). DataTable's row model, bulk-actions bar, and resize API do not compose with this interaction surface. Uses raw DS Table primitives (`Table`, `TableHeader`, `TableRow`, `TableHead`, `TableBody`, `TableCell`) for correct semantic markup. Documented 2026-06-17. |

### Named Card-substitutes — NOT yet documented hand-rolls, TRACKED FOR MIGRATION

These are domain wrappers that internally build Card-shaped chrome from raw divs without importing DS `Card`. The regex `card-shape-masquerade` rule can't catch them (the divs are wrapped in a named component). Documented here per Card depth audit 2026-05-11 (`docs/governance/component-depth-audits/card.md`).

| File | Lines | Component | Recommended migration |
|---|---|---|---|
| `apps/pce/admin/app/(app)/page.tsx:36` | ~55 | `FolderCard` (module home tiles) | Replace `<article>` + raw divs with `Card size="sm"` + `CardHeader > CardDescription + CardTitle + CardAction` + `CardContent`. ~1-2h. High visibility — every user lands here. |
| `apps/pce/admin/app/(app)/admin/page.tsx:76` | ~40 | `EntityCard` (admin entity tiles) | Same shape as FolderCard. ~1-2h. |
| `apps/pce/student/app/surveys/page.tsx:127` | ~30 | `SurveyCard` (student survey tile) | `Card size="sm"`. ~1h. |
| `apps/exam-management/admin/components/faculty-ui-kit.tsx:195` | ~30 | `KpiCard` | Already imports Card but uses `px-0 py-0` overrides that violate the spacing contract in `card.tsx:9-15`. Refactor to use Card's default spacing. Same pattern hand-rolled in PCE's KpiButton. |

### exam-management imposter categories (Card audit 2026-05-11)
- **8 empty-state panels** — repeated 4× in `qb-table.tsx` alone. ✅ RESOLVED 2026-05-11: shared `EmptyState` molecule shipped at `apps/exam-management/admin/components/empty-state.tsx` and used in `qb-table.tsx` (3 sites) + `add-accommodation-modal.tsx` (1 site). Other empty-state-like panels (`live-monitor-client.tsx`, `assessment-landing-client.tsx` QuickLink, `assessment-builder-client.tsx` AiGeneratePanel) migrated directly to Card slots or `LocalBanner variant="promo"` where the chrome fit better.
- **5 modal info-strips** with colored tinted backgrounds — these are **Banner** candidates (wrong primitive), not Card. ✅ RESOLVED 2026-05-11: migrated to `LocalBanner` (`create-assessment-modal.tsx` ×2, `assign-practice-dialog.tsx`, `assessment-landing-client.tsx` Previous reviewer note, `analytics-client.tsx` Curve applied, `competency-client.tsx` Weakest area).
- **9 status/preview tiles** — mixed; per-file judgment. ✅ RESOLVED 2026-05-11: chart card (`question-scatter-plot.tsx`) and TypeTile (`accommodations-tab.tsx`) migrated to Card slots. Notes blockquote (`assessment-review-client.tsx`) refactored to a `<blockquote>` sub-element with a left-accent (not Card chrome). Sidebar Faculty Mode chip (`app-sidebar.tsx`) and scatter-plot hover tooltip allowlisted as legitimate non-Card divs.

### Legitimate non-Card divs (known audit false positives)
The audit script's `LEGITIMATE_NON_CARD_DIVS` set skips card-shape-masquerade scanning for these files.

| File | Why it's not a Card |
|---|---|
| `apps/pce/admin/components/pce/pce-modals.tsx:71` | Wrapper for grouped Checkbox inputs (sections selector inside CreateTemplateSheet). It's a form control group, not a content panel. Card would over-engineer. |
| `apps/exam-management/admin/components/app-sidebar.tsx:121` | FacultyModeChip — sidebar status indicator. Lives inside the Sidebar, not in main content. Card would visually compete with the sidebar's own chrome. |

### exam-management
| File | Lines | Mirrors DS organism | Justification |
|---|---|---|---|
| _(none flagged yet — re-audit when DataTable adoption lands here)_ | | | |

### NOT in this list = audit will flag it
- `apps/pce/admin/components/pce/pce-modals.tsx` `CreateSurveySheet` — actually uses DS `Sheet` with slots, so it's not a hand-roll of Sheet (it's a domain wrapper). Domain wrappers are fine.
- `apps/pce/admin/components/data-table/` — vendored canonical, not a hand-roll.

---

## Grandfathered hand-rolls (real violations, deferred migration)

Pre-existing files that match a DS organism name but predate the registry. These were grandfathered on 2026-05-11 when phase-1 strict mode shipped so the audit could enforce on **new** organism-name-collisions without blocking the workspace on stable pages.

Each entry is a real bug to fix. The audit downgrades them to `warn` (rule `organism-name-collision-grandfathered`) until migration. After migration, **remove the file from `GRANDFATHERED_ORGANISM_COLLISIONS` in `scripts/ds-adoption-audit.py`** so block-on-new behavior is restored.

| File | Mirrors DS organism | Migration plan | Estimated effort |
|---|---|---|---|
| _(none — all previously grandfathered files migrated 2026-05-11)_ | | | |

**Migrated 2026-05-11:**
- `apps/exam-management/admin/components/data-table.tsx` → vendored canonical at `components/data-table/` (mirrors PCE recipe).
- `apps/exam-management/admin/components/key-metrics.tsx` → vendored canonical at `components/key-metrics/index.tsx` (mirrors PCE recipe; consumers: `competency-client.tsx`, `live-monitor-client.tsx`). `KpiTile` in `faculty-ui-kit.tsx` retained as a documented hand-roll (product-specific `tone`/`pulseIcon`/`active` props don't map onto canonical).

Workspace-wide gaps not on this list (because they're not organism-name-collisions, but ARE raw-table or hand-roll patterns the audit warns on):

- _(none — `assessment-builder-client.tsx:695` and `curricular-loop-diagram.tsx:305` both documented as intentional hand-rolls in the table above as of 2026-05-11)_

---

## Banned hand-roll patterns (audit blocks at pre-commit)

These patterns are common AI/Claude failure modes. The audit script regexes for them; if any appear in product code (not in `components/data-table/` or other vendored dirs), the commit is blocked.

| Pattern | Detection | Why banned |
|---|---|---|
| Raw `<Table>` from `@exxat/ds/packages/ui/src` outside vendored DataTable | grep: `Table,\s*TableHeader\|TableBody\|TableHead\|TableRow` import + same file uses `<Table>` JSX | Use canonical DataTable from `@/components/data-table` instead — see DataTable row above. |
| `<Card>` used as bare container with no slot children | grep: `<Card[^>]*>\s*<div` immediate child without `CardHeader\|CardTitle\|CardDescription\|CardContent\|CardAction\|CardFooter` anywhere inside | Use Card slots: `CardHeader > CardTitle + CardDescription`, `CardContent`, `CardFooter`. |
| Custom file under `components/` named like a DS organism | filename match against registry: `data-table`, `data-list-table`, `key-metrics`, `section-cards`, `export-drawer`, `table-properties-drawer`, `coach-mark`, `command-menu` | If the name matches a DS organism, either import it, vendor it, or rename + document the divergence in this file. |
| Raw `<button>` element | grep: `<button[^>]*onClick\|type="button"` outside known wrappers | Use DS Button with explicit `variant` and `size`. |
| Hex / rgb color literals in className or style | grep: `#[0-9a-fA-F]{3,8}\|rgb\(` in `.tsx` files outside `theme.css` | Use `var(--token-name)`. See DS-014. |

---

## State-coverage requirements (mixed severity — see column)

Beyond "is the right component imported," the audit checks "are all states handled." Bound by `docs/patterns/admin/state-coverage.md` (Pattern ID `ADMIN-004`). Severity column reflects 2026-05-11 promotion decision per `docs/governance/architect-runs/2026-05-11-baseline.md`.

| Rule slug | Pattern | Severity | Promotion gate |
|---|---|---|---|
| `datatable-no-empty-state` | `<DataTable` without `emptyState` prop AND without `data.length === 0` guard | **block** | Promoted 2026-05-11 (0 hits workspace-wide) |
| `dialog-no-error-feedback` | `<DialogContent>...<form>...<Input.../>` with no `aria-invalid` AND no `<FieldError>` AND no `<LocalBanner variant="error">` | **block** | Promoted 2026-05-11 (0 hits workspace-wide) |
| `opacity-60-on-text-parent` | `opacity-60` className on a parent whose descendants render `text-muted-foreground` (drops contrast below WCAG 4.5:1) | **block** | Promoted 2026-05-11 (0 hits workspace-wide) |
| `clickable-without-focus-ring` | Non-DS-Button element with `onClick` + `cursor-pointer` that lacks `focus-visible:ring` | warn | Deferred 2026-05-11 — hit count contested between audit JSON (0) and parent claim (1); re-verify next run |
| `async-fetch-no-skeleton` | File with `useEffect+fetch` / `useSWR` / `useQuery` / `isLoading` that does NOT import or render `Skeleton` | warn | Deferred 2026-05-11 — most false-positive-prone of the five (loading state may live in a child); promote after one more session at 0 |

State-coverage maps onto the canonical state matrix at `docs/governance/component-state-catalog.md`. When the catalog adds a new required state, add a row above.

---

## Updating this registry

When a new DS organism ships upstream:
1. Add a row to the matching section.
2. Specify import path or vendor recipe.
3. Update `scripts/ds-adoption-audit.py` if it introduces a new banned pattern.
4. Update workspace `CLAUDE.md` §8 reference list if it's an absolute rule.
5. Update per-product CLAUDE.md to list it as available (so per-product audits track it).

When a product team needs a hand-roll:
1. Add to "Documented hand-rolls" with date + reason.
2. The audit ignores it.
3. Periodically (quarterly) review the hand-roll list — anything still hand-rolled after upstream publishes the DS equivalent should be migrated.

---

## Why this exists (the bug class)

Per `docs/governance/blind-spots.md` row #6: "I commit the rule, not the fix — add regex to PreToolUse, pre-existing violations remain." The pattern Romit has had to point out repeatedly across sessions:

1. Claude writes a "subset DataTable" instead of vendoring the canonical 1251-line one.
2. Claude rebuilds `KpiButton` instead of importing `KeyMetrics` (the exam-mgmt sister product already uses it in 4 pages — Claude doesn't cross-check).
3. Claude builds `FolderCard` with `<article>` + raw divs instead of Card + CardHeader + CardTitle + CardDescription slots.
4. Claude maps `<Table>` directly to entity rows on 13 PCE pages without considering DataTable.

The fix at this layer (registry) is the BRAIN that the audit script + subagent + CLAUDE.md reference.
The fix at the enforcement layer (audit + subagent) is the GATE that prevents recurrence.
Both are required.
