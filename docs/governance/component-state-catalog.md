# Canonical Component State Catalog (from localhost:4000)

> Generated 2026-05-11 from the Exxat-DS reference app running at port 4000.
> Sources: `Admin/apps/web/lib/library-catalog.ts` (30 entries), the live
> `/library/<id>` routes (32 routes — 30 components + 2 utilities/templates),
> `Admin/apps/web/components/component-catalog/component-preview.tsx`
> (988-line interactive sandbox), and the canonical sources at
> `exxat-ds/packages/ui/src/components/ui/*.tsx`.
>
> This is the spec product apps are audited against — every state listed here
> should be implementable in product code. Gaps are surfaced by the state-gap
> audit at `docs/governance/state-gap-audit-{product}.md`. When a component's
> canonical demo OMITS a state (e.g. loading), that omission is called out in
> the per-row "DS gap" field and rolled up at the bottom of this document.

---

## How to use this file

When implementing a feature that uses a DS component, scan the component's
row below. Read three columns in order:

1. **Variants demonstrated** — the canonical exercises these; product code
   should not invent new ones.
2. **Required states for product code** — these MUST be handled. Skipping
   them is a state-gap audit finding.
3. **Optional states** — the canonical demonstrates these; products MAY skip
   them when the surface genuinely does not need them.

The `DS gap` line, when present, flags states the canonical demo SHOULD
exercise but does not (escalate to DS team — don't paper over in product
code with non-DS workarounds).

---

## Cross-cutting state requirements (apply to EVERY component)

These are the audit invariants — they hold across all 30 components. A
product fails the state-coverage audit if any interactive surface violates
one.

| # | Invariant | Token / pattern |
|---|---|---|
| 1 | **Focus-visible ring** on every interactive surface | `focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50` (Button/Input pattern). Never remove the outline. |
| 2 | **Disabled** = `opacity-50` + `pointer-events-none` (or `cursor-not-allowed` for form fields) | DS uses `disabled:pointer-events-none disabled:opacity-50`. Do NOT use `opacity-60` — fails contrast (PCE fix on file). |
| 3 | **aria-invalid** triggers destructive border + ring | `aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20`. Wire it from form-validation state, not from `className`. |
| 4 | **Loading** = `Skeleton` (DS-provided `animate-pulse rounded-md bg-muted`) | Skeleton replaces the chrome it represents (h-9 for a Button, h-24 for a card). Wrap the loading region in `aria-busy="true"` (see `app/(app)/dashboard/page.tsx`). |
| 5 | **Empty state** for any data-bound surface | Three forms: (a) inline empty row `colSpan` for DataTable (line 1173–1180 in `data-table/index.tsx`), (b) full-page dashed-border + illustration block (see `rotations-empty-state.tsx`), (c) empty Kanban column copy via `emptyColumnLabel`. |
| 6 | **Error state** for any async fetch | LocalBanner `variant="error"` with `retry={{label, onClick}}` for in-page errors. SystemBanner `variant="error"` for app-shell errors. Never use Sonner `toast()` — banned per `CLAUDE.md §8`. |
| 7 | **44px touch target** on mobile (WCAG 2.5.5) | Use `--control-height-touch` or `size="lg"` on Button. Default Button is 36px (`h-9`); icon-default is 36px (`size-9`) — both fail 2.5.5 on mobile. |
| 8 | **aria-label** on every icon-only Button (`size="icon*"`) | The canonical exercises this in every `icon-xs / icon-sm / icon / icon-lg` button. No exceptions. |
| 9 | **Keyboard navigation** for composite widgets | Tabs: Arrow Left/Right (Radix default). ViewSegmentedControl: Arrow keys + Home/End (custom impl at line 92–111 of `view-segmented-control.tsx`). Sidebar: ⌘B / Ctrl-B toggle. Command Menu: ⌘K. |
| 10 | **Theme switching** must work in both `theme-one` (Lavender) and `theme-prism` (Rose) | Use `var(--brand-color)` etc. — never hex/oklch literal. |

---

## Component-by-component catalog

### Actions

#### Button
- **Canonical source**: `exxat-ds/packages/ui/src/components/ui/button.tsx` (67 lines)
- **Library route**: `/library/button`
- **Demo source**: `component-preview.tsx:251-309` (`PrimitiveButtonPreview`)
- **Variants demonstrated**: `default`, `secondary`, `outline`, `ghost`, `destructive`, `link`
- **Sizes demonstrated**: `xs` (h-6), `sm` (h-8), `default` (h-9), `lg` (h-10), `icon-xs` (size-6), `icon-sm` (size-8), `icon` (size-9), `icon-lg` (size-10)
- **Interaction states (CSS-derived)**: hover (`hover:bg-...`), focus-visible (`focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50`), active (`active:translate-y-px`), aria-expanded (for menu triggers), aria-invalid (destructive border)
- **Required states for product code**:
  - **disabled** — whenever the action is unavailable (`pointer-events-none opacity-50`)
  - **aria-label** — REQUIRED on every `size="icon*"` button; the demo exercises this 4×
  - **type="button"** — required when inside any form to avoid accidental submit (demo uses `type="button"` on all 10+ buttons)
  - **explicit `variant` + `size`** — defaults are OK, but `<Button>` without props is a smell
- **Optional states**:
  - **loading** — no first-class prop. Wrap with `disabled` + spinner `<i className="fa-light fa-spinner-third fa-spin" aria-hidden />` content (see `export-drawer.tsx:311`)
  - **asChild** — for routing (e.g. `<Button asChild><Link href="...">…</Link></Button>`)
- **A11y**:
  - Extends `HTMLButtonElement` — never lowercase `<button>` (workspace rule, `CLAUDE.md §8`)
  - `aria-expanded` flips the variant fill to match "open" affordance
  - `aria-invalid` activates destructive ring (line 8 of canonical)
- **DS gap**: ❌ No first-class `loading` / `isPending` prop. Every product re-invents spinner-in-disabled. Escalate.

#### Dropdown Menu
- **Canonical source**: `exxat-ds/packages/ui/src/components/ui/dropdown-menu.tsx` (423 lines)
- **Library route**: `/library/dropdown-menu`
- **Demo source**: `component-preview.tsx:572-617` (`PrimitiveDropdownMenuPreview`)
- **Exports (15)**: `DropdownMenu`, `DropdownMenuPortal`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuGroup`, `DropdownMenuLabel`, `DropdownMenuItem`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`, `DropdownMenuSeparator`, `DropdownMenuShortcut`, `DropdownMenuSub`, `DropdownMenuSubTrigger`, `DropdownMenuSubContent`, plus `Shortcut` / `useShortcut` hooks
- **Variants demonstrated**:
  - Items + destructive (`variant="destructive"` on `DropdownMenuItem`)
  - Checkbox items (`DropdownMenuCheckboxItem` with `checked` + `onCheckedChange`)
  - Radio items (`DropdownMenuRadioGroup` + `DropdownMenuRadioItem`)
  - Label rows + Separator
- **Open/close states**: `data-[state=open]` (Radix), `data-[state=closed]`, with `slide-in-from-*` animations per side
- **Sides**: `bottom`/`top`/`left`/`right` (default bottom)
- **Aligns**: `start`/`center`/`end` (default `start`)
- **Required states for product code**:
  - **disabled item** — `<DropdownMenuItem disabled>` greys + removes pointer events (`data-disabled:pointer-events-none data-disabled:opacity-50`)
  - **destructive variant** for sign-out / delete (red foreground via `variant="destructive"`)
  - **`shortcut` prop** on any item that has a global keybinding — pair with `<Shortcut keys=… onInvoke=… />` to actually wire the binding (visual hint only doesn't fire the action)
- **Optional states**:
  - Submenus (`DropdownMenuSub` + `SubTrigger` + `SubContent`)
  - Inset items (`inset` prop adds left padding for icon-aligned rows)
- **A11y**: Radix handles focus management, escape, outside-click; product code should not override unless escaping a known bug.
- **DS gap**: None for state coverage. Note: `useShortcut` has a documented races-with-button-click guard (lines 137–154) — product code should NOT reimplement.

---

### Data Display

#### Badge
- **Canonical source**: `exxat-ds/packages/ui/src/components/ui/badge.tsx` (50 lines)
- **Library route**: `/library/badge`
- **Demo source**: `component-preview.tsx:310-337` (`PrimitiveBadgePreview`)
- **Variants demonstrated**: `default`, `secondary`, `outline`, `destructive`, `ghost`, `link`
- **Sizes**: single size only (no size variants — uses padding `px-2 py-1` with `text-xs`)
- **Interaction states**: hover (only when `asChild` wraps an `<a>` — link-style hover), focus-visible (`focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50`)
- **Required states for product code**:
  - **`asChild` + `<a>` or `<Link>`** when the badge IS the link (so the badge itself receives focus styles)
  - **shape override**: `className="rounded"` for rectangular 4px corners (workspace default is full pill — see `CLAUDE.md §8`)
  - **count badges** must include hidden text for SR (e.g. `<Badge>5<span className="sr-only"> unread</span></Badge>`)
- **Optional states**:
  - With leading icon (demo shows `fa-light fa-check`, `fa-light fa-clock`)
  - `aria-invalid` border (rare)
- **DS gap**: ❌ No `size="sm"` — every consumer overrides padding manually for dense rows. Escalate.

#### StatusBadge (separate from Badge)
- **Canonical source**: `exxat-ds/packages/ui/src/components/ui/status-badge.tsx` (109 lines)
- **Library route**: not in `library-catalog.ts` (not catalogued — but exported)
- **Demo source**: none in `component-preview.tsx`
- **Variants demonstrated (status)**: `beta`, `new`, `alpha`, `preview`, `deprecated`
- **Sizes**: `xs` (h-3.5), `sm` (h-4, default), `md` (h-5)
- **Variants (visual)**: `pill` (default), `dot` (no label — collapsed sidebars)
- **Required states for product code**:
  - **`aria-label`** auto-generated from `status` — override only when the label differs (e.g. localized strings)
  - **High-contrast / forced-colors fallback** — canonical handles this via `hc:` and `forced-colors:` classes; do not override
- **A11y**: `dot` variant carries `sr-only` text equal to status label.
- **DS gap**: ❌ Not in `library-catalog.ts` — DS gap (canonical exists, but no catalog entry / no live preview). Escalate.

#### Chart (Recharts wrapper)
- **Canonical source**: `exxat-ds/packages/ui/src/components/ui/chart.tsx` (378 lines)
- **Library route**: `/library/chart`
- **Demo source**: `component-preview.tsx:419-450` (`PrimitiveChartPreview`)
- **Exports**: `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, `ChartLegendContent`, `ChartStyle`, type `ChartConfig`
- **Variants demonstrated**: BarChart (with `accessibilityLayer`, `CartesianGrid`, `XAxis`, `Bar`)
- **Color slots**: chart tokens `--chart-1` … `--chart-5` (mapped via `ChartConfig`)
- **Theme states**: `THEMES = { light: "", dark: ".dark" }` — automatic CSS-variable scoping
- **Required states for product code**:
  - **`accessibilityLayer`** prop on every chart root (provides screen-reader narration of values)
  - **`ChartTooltipContent`** inside `ChartTooltip` for keyboard-accessible value disclosure
  - **Loading**: Skeleton (`<Skeleton className="min-h-[320px] w-full rounded-xl" />`) per dashboard pattern at `dashboard/page.tsx:19`
  - **Empty**: no first-class slot — products render an inline `<p>` or `LocalBanner` next to the chart
  - **Error**: no first-class slot — wrap container in error LocalBanner per audit invariant #6
- **Optional states**:
  - Multi-series (config `value.color`, `value2.color`, …)
  - `recharts`-native states: `data=[]` renders empty axes (visually broken — products must guard)
- **DS gap**: ❌ Demo does not exercise empty data, error, or loading. Three gaps. Escalate.

#### Tooltip
- **Canonical source**: `exxat-ds/packages/ui/src/components/ui/tooltip.tsx` (60 lines)
- **Library route**: `/library/tooltip`
- **Demo source**: `component-preview.tsx:510-550` (`PrimitiveTooltipPreview`)
- **Exports**: `Tooltip`, `TooltipContent`, `TooltipProvider`, `TooltipTrigger`
- **Sides demonstrated**: `top`, `bottom`, `left`, `right`
- **Open/close**: `data-state=delayed-open`, `data-open`, `data-closed` with fade + zoom + slide animations
- **Required states for product code**:
  - **`TooltipProvider`** wraps the app (already done in root `layout.tsx`)
  - **`asChild` on `TooltipTrigger`** — otherwise tooltip renders its own wrapper button
  - **Never use Tooltip on disabled buttons** — Radix won't fire focus events; use a wrapper `<span>` or use `Tip` instead
- **Optional states**: `sideOffset`, custom `className` (rare — DS handles all spacing)
- **DS gap**: None for state coverage.

#### Tip (Tooltip wrapped for product copy + shortcuts)
- **Canonical source**: `exxat-ds/packages/ui/src/components/ui/tip.tsx` (22 lines)
- **Library route**: `/library/tip`
- **Demo source**: `component-preview.tsx:552-570`
- **Variants**: none — single component
- **Sides**: `top` (default), `bottom`, `left`, `right`
- **Required states for product code**:
  - **`label` accepts ReactNode** — pair with `<Kbd>` for shortcut hints (demo shows `Save ⌘ S`)
- **DS gap**: None.

#### Kbd
- **Canonical source**: `exxat-ds/packages/ui/src/components/ui/kbd.tsx` (56 lines)
- **Library route**: `/library/kbd`
- **Demo source**: `component-preview.tsx:387-417` (`PrimitiveKbdPreview`)
- **Variants demonstrated**: `tile` (default — bg-muted border), `bare` (transparent — for inside Buttons; auto `aria-hidden`)
- **Component pair**: `Kbd` + `KbdGroup` (for `⌘+S`-style compositions)
- **Required states for product code**:
  - **`variant="bare"`** when inside a Button (the parent already has the accessible name; redundant for SR)
  - **`KbdGroup`** when composing multi-key shortcuts (gap-1 spacing)
- **DS gap**: None.

#### DataListTableCells (composed row pieces)
- **Canonical source**: `Admin/apps/web/components/data-list-table-cells.tsx` (162 lines)
- **Library route**: `/library/data-list-table-cells`
- **Demo source**: `component-preview.tsx:132-152` (`DataListTableCellsPreview`)
- **Exports**: `AvatarCircle`, `StatusBadge` (placement-specific), `WeeksProgressCell`, `RowActions`, `PLACEMENT_ROW_ACTIONS`
- **States covered**:
  - `AvatarCircle` — `initials` only (no image variant in this catalog component; image-variant lives in DS `Avatar` instead)
  - `StatusBadge` — status enum values map to color classes
  - `WeeksProgressCell` — current/total → progress bar fill
  - `RowActions` — hover-reveal menu via DropdownMenu
- **Required states for product code**: hover-row reveal (`group-hover/row:opacity-100`)
- **DS gap**: This is a product-feature component; DS gap N/A.

#### PlacementsListView (entity rows with virtualization)
- **Canonical source**: `Admin/apps/web/components/placements-list-view.tsx` (320 lines)
- **Library route**: `/library/placements-list-view`
- **Demo source**: `component-preview.tsx:154-168`
- **States covered**: empty rows (`emptyCopy` prop), virtualized list (window scrolling for long datasets)
- **DS gap**: This is a product-feature component.

#### DataListTable (the big organism)
- **Canonical source**: `Admin/apps/web/components/data-list-table.tsx` (~1600 lines)
- **Library route**: `/library/data-list-table`
- **Demo source**: `component-preview.tsx:210-232`
- **Underlying DS components used**: `DataTable` (in `components/data-table/index.tsx`), `Button`, `Input`, `Kbd`, `Tip`, `Checkbox`, `DropdownMenu`, `Popover`, `Tooltip`, `TooltipProvider`, `TooltipTrigger`, table-properties types, `FilterDateCalendar`
- **States covered**:
  - **Empty** — `emptyState` prop renders inside `<td colSpan={cols.length} className="h-24 text-center text-muted-foreground">` at line 1173–1180
  - **Sort** — `aria-sort` on `<th>` (line 758 of data-table/index.tsx)
  - **Row selection** — header checkbox indeterminate, bulk-action bar `role="status" aria-live="polite"`
  - **Resize handles** — `role="separator"` + `aria-label`
  - **Hover-row** — `hoveredRow` state, used to gate row-actions visibility
  - **Pin / unpin** — `data-pinned-left` / `data-pinned-right` on `<td>`
  - **Wrap text** — per-column `colWrap` state
  - **Filter pills** — `ActiveFilter` editor popover
  - **Group by** — collapsible group rows
- **Required states for product code**:
  - **`emptyState`** copy must be set per-context (e.g. "No upcoming placements" vs "No placements match your filters")
  - **`getRowId`** returns stable string ID (otherwise selection breaks across pagination)
  - **`selectable={true}`** — adds checkbox column with indeterminate header
  - **`searchable={true}`** — adds search input above the table
- **Optional states**: `addRowLabel={"placement"}` adds a stub row at the bottom; `conditionalRules` colorize cells; `hasFooter` adds a `<tfoot>`
- **DS gap**: ❌ No first-class `loading` prop. Products fake it by rendering Skeleton rows manually or by mounting `<DataTable data={[]} emptyState="Loading…" />`. Escalate.

#### SectionCards (dashboard KPI grid)
- **Canonical source**: `Admin/apps/web/components/section-cards.tsx` (107 lines)
- **Library route**: `/library/section-cards`
- **Demo source**: `component-preview.tsx:689-697`
- **Variants demonstrated**: 4-up KPI grid with `Card` + gradient fills + trend `Badge` in `CardAction`
- **Required states for product code**:
  - Trend never relies on color alone — `Badge` includes the icon (`fa-arrow-trend-up` / `fa-arrow-trend-down`) and `aria-hidden`
  - `tabular-nums` on numeric `CardTitle` to prevent column shift
- **DS gap**: ❌ Demo doesn't show empty / loading / error state. Escalate.

#### KeyMetrics
- **Canonical source**: `Admin/apps/web/components/key-metrics.tsx` (~850 lines)
- **Library route**: `/library/key-metrics`
- **Demo source**: `component-preview.tsx:699-726`
- **Variants demonstrated**: `card` (full Card chrome with gradient), `flat` (full-width band, no card)
- **Optional 3rd variant**: `compact` (declared in description but not directly demoed)
- **States covered**:
  - Trend `up` / `down` / `neutral` with icon-plus-label (WCAG 1.4.1 — color is never alone)
  - Period selector (Select) — `aria-label`
  - Insight panel with Ask Leo CTA
  - `metricsSingleRow` for narrow contexts
- **Required states for product code**:
  - `showHeader={false}` when used inside `ListPageTemplate` (header lives at page level)
  - `insight` is optional but when present needs `actionLabel` for SR
- **DS gap**: ❌ No empty-data variant (e.g. when all metrics are 0 or unavailable). Escalate.

---

### Forms & Inputs

#### Input
- **Canonical source**: `exxat-ds/packages/ui/src/components/ui/input.tsx` (23 lines)
- **Library route**: `/library/input`
- **Demo source**: `component-preview.tsx:339-362`
- **Variants demonstrated**: default, disabled, aria-invalid
- **Sizes**: single size (`h-8`). No size variants.
- **Interaction states**: focus-visible (`border-ring ring-3 ring-ring/50`), disabled (`pointer-events-none cursor-not-allowed bg-input/50 opacity-50`), aria-invalid (`border-destructive ring-destructive/20`)
- **Required states for product code**:
  - **`aria-label`** when no visible `<Label>` is associated
  - **`aria-invalid`** wired from validation state — never via `className`
  - **`disabled`** for read-only contexts
- **Optional states**: `aria-describedby` pointing to helper text or error message
- **DS gap**: ❌ Demo doesn't show: focused state, with-helper-text, with-error-message paired with `aria-describedby`. Three small gaps.

#### Calendar
- **Canonical source**: `exxat-ds/packages/ui/src/components/ui/calendar.tsx` (221 lines)
- **Library route**: `/library/calendar`
- **Demo source**: `component-preview.tsx:452-459`
- **Modes (react-day-picker)**: `single` (demo), `multiple`, `range`
- **States covered (canonical CSS classes)**:
  - `range_start` / `range_middle` / `range_end` (range mode)
  - `today` (accent fill)
  - `outside` (muted-foreground for days outside the visible month)
  - `disabled` (opacity-50)
  - `hidden` (invisible)
  - `selected-single` data attr drives primary fill on DayButton
- **Captions**: `label` (default text), `dropdown` (year/month dropdowns)
- **Required states for product code**:
  - **Pass `mode`** explicitly (don't rely on `react-day-picker` defaults)
  - **`fromYear` / `toYear`** for any DOB-like field (calendar otherwise spans 200 years)
- **DS gap**: ❌ Demo only exercises `mode="single"`. No range, no multiple, no dropdown caption, no disabled-day exemplar.

#### DatePickerField (Calendar + Popover + Button)
- **Canonical source**: `exxat-ds/packages/ui/src/components/ui/date-picker-field.tsx` (71 lines)
- **Library route**: `/library/date-picker-field`
- **Demo source**: none in `component-preview.tsx` (placeholder route only)
- **States covered**: value present (formatted via `formatDateUS`), value absent (placeholder `MM/DD/YYYY` with `text-muted-foreground`), `disabled` (passed to Button)
- **Required states for product code**:
  - **`aria-label`** — auto-set from formatted value or "Pick a date"
  - **`fromYear` / `toYear`** override (defaults 2020–2032)
- **DS gap**: ❌ No interactive sandbox for this component — only a placeholder. Escalate.

#### Field (Label–Input pairing + group + description + error)
- **Canonical source**: `exxat-ds/packages/ui/src/components/ui/field.tsx` (239 lines)
- **Library route**: `/library/field`
- **Demo source**: none in `component-preview.tsx` (no preview case wired)
- **Exports (9)**: `Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldGroup`, `FieldLegend`, `FieldSeparator`, `FieldSet`, `FieldContent`, `FieldTitle`
- **Orientations**: `vertical` (default), `horizontal`, `responsive`
- **States covered**:
  - `data-invalid={true}` flips text to `destructive`
  - `data-disabled={true}` opacity-50
  - `data-checked` via `has-data-checked` selector — highlights label when child is a checked radio/checkbox
  - `FieldError` only renders when `children` or `errors[]` is non-empty; merges duplicate messages
  - `FieldSeparator` with optional center label ("or") for or-rules
- **Required states for product code**:
  - **`FieldError`** for every validation error — never inline `<p className="text-destructive">`
  - **`FieldDescription`** for helper text (paired with `aria-describedby` via Field's `role="group"`)
- **DS gap**: ❌ No interactive sandbox preview for Field. Critical given how much logic this carries.

#### InputGroup
- **Canonical source**: `exxat-ds/packages/ui/src/components/ui/input-group.tsx` (157 lines)
- **Library route**: `/library/input-group`
- **Demo source**: none directly — but `command.tsx` uses it internally
- **Exports**: `InputGroup`, `InputGroupAddon`, `InputGroupButton`, `InputGroupText`, `InputGroupInput`, `InputGroupTextarea`
- **Addon aligns**: `inline-start`, `inline-end`, `block-start`, `block-end`
- **Button sizes inside group**: `xs`, `sm`, `icon-xs`, `icon-sm`
- **States covered**:
  - `has-disabled:bg-input/50 has-disabled:opacity-50` — entire group dims when child input is disabled
  - `has-[[data-slot=input-group-control]:focus-visible]:border-ring …:ring-3 …:ring-ring/50` — group reflects focus from its input
  - `has-[[data-slot][aria-invalid=true]]:border-destructive` — group inherits aria-invalid from child
  - Textarea variant: `has-[>textarea]:h-auto` — group expands when textarea is inside
- **Required states for product code**:
  - **Always compose** — never recreate the `<div> + <input> + <button>` manually (DS rule)
- **DS gap**: ❌ No standalone library preview — only inside Command. Escalate.

#### ViewSegmentedControl
- **Canonical source**: `exxat-ds/packages/ui/src/components/ui/view-segmented-control.tsx` (161 lines)
- **Library route**: `/library/view-segmented-control`
- **Demo source**: `component-preview.tsx:666-687`
- **Variants**: standard (icon + label), `iconOnly` (icon only with tooltip)
- **States covered**: active vs inactive (`bg-background text-foreground shadow-sm` vs `text-muted-foreground hover:…`), focus-visible (`ring-2 ring-ring ring-offset-1`)
- **Keyboard**: Arrow Left/Right/Up/Down, Home, End (custom handler at lines 92–111)
- **Required states for product code**:
  - **`aria-label`** REQUIRED (names the radiogroup)
  - **`role="radiogroup"`** + each item `role="radio"` (already wired internally)
  - When `iconOnly=true`, tooltips auto-enabled (`showTooltips ?? iconOnly`)
- **DS gap**: None.

---

### Feedback

#### Banner (LocalBanner + SystemBanner)
- **Canonical source**: `exxat-ds/packages/ui/src/components/ui/banner.tsx` (336 lines)
- **Library route**: `/library/banner`
- **Demo source**: `component-preview.tsx:837-866`
- **Variants demonstrated**: `info`, `warning`, `error`, `success`, `promo`
- **Two surfaces**: `LocalBanner` (in-page) and `SystemBanner` (app-shell)
- **States covered**:
  - `dismissible` — adds X button (top-right for inline, top-right for bottom-position)
  - `action` — link or button (`href` vs `onClick` — server-component safe with `href`)
  - `retry` — special preset for error banners (icon `fa-arrow-rotate-right` + label "Retry")
  - `actionPosition: "inline" | "bottom"` (SystemBanner only)
- **Roles + ARIA**: info/success/promo → `role="status" aria-live="polite"`; warning/error → `role="alert" aria-live="assertive"`
- **Required states for product code**:
  - **`retry={{label, onClick}}`** on every error banner — products that show error without retry fail the audit
  - **`title`** for assertive announcements (so SR reads heading first)
  - **NEVER use Sonner toast** for product feedback (rule per `CLAUDE.md §8`)
- **DS gap**: None for state coverage.

#### Skeleton
- **Canonical source**: `exxat-ds/packages/ui/src/components/ui/skeleton.tsx` (14 lines)
- **Library route**: `/library/skeleton`
- **Demo source**: `component-preview.tsx:364-385`
- **Single variant**: `animate-pulse rounded-md bg-muted` + your sizing classes
- **Patterns demonstrated**:
  - Lines + block (`h-4 w-...`, `h-24 w-full`)
  - Avatar row (`size-10 rounded-full` + nested `h-4 w-...` lines)
- **Required states for product code**:
  - **Match the chrome being replaced** — Skeleton h-9 for a Button, h-24 for a card, h-11 for a banner
  - **Wrap in `aria-busy="true"`** at the loading region level
- **DS gap**: None.

#### CoachMark
- **Canonical source**: `exxat-ds/packages/ui/src/components/ui/coach-mark.tsx` (362 lines)
- **Library route**: `/library/coach-mark`
- **Demo source**: none — placeholder ("Needs a target anchor and state from useCoachMark")
- **Variants**: `single`, `flow` (multi-step), `image`, `no-image`; size `default | sm | lg`
- **States covered**:
  - First / Last step → button label flips (`Next` → `Got it`)
  - Spotlight overlay carves a hole around the target via SVG mask
  - Step indicator dots animate (`w-4` for active, `w-1.5` for inactive) with `aria-live="polite"`
  - Skip dismisses; Escape dismisses (`onEscapeKeyDown={() => skip()}`)
  - High-contrast (`hc:`) — bg/text/border swap to foreground tokens
- **Required states for product code**:
  - **`useCoachMark`** hook drives state — never reimplement
  - **CSS selector target** must exist in the DOM at mount time (otherwise `anchorRect` is null and the popover never opens)
- **DS gap**: ❌ No interactive sandbox in catalog. Critical for onboarding flows. Escalate.

---

### Navigation

#### Sidebar
- **Canonical source**: `exxat-ds/packages/ui/src/components/ui/sidebar.tsx` (700+ lines)
- **Library route**: `/library/sidebar`
- **Demo source**: none — placeholder ("The collapsible shell is already around you")
- **Width tokens**: `SIDEBAR_WIDTH = 16rem`, `SIDEBAR_WIDTH_MOBILE = 18rem`, `SIDEBAR_WIDTH_ICON = 3rem`
- **Keyboard**: `⌘B` / `Ctrl-B` toggles
- **Cookie**: `sidebar_state` cookie remembers open/closed for 7 days
- **States covered**:
  - `expanded` vs `collapsed`
  - `isMobile` — opens as Sheet from the side
  - Per-row: active (`data-active`), hover, disabled, icon-only collapsed state
- **Required states for product code**:
  - **`SidebarProvider`** wraps the app shell — never instantiate two providers
  - **Never use `<button>`** directly inside Sidebar — use the DS button family (sub-exports include `SidebarMenuButton`, etc.)
- **DS gap**: ❌ No interactive sandbox. ❌ Catalog description is just a one-liner. Sidebar is one of the most-used components — this is the biggest catalog gap.

#### Tabs
- **Canonical source**: `exxat-ds/packages/ui/src/components/ui/tabs.tsx` (91 lines)
- **Library route**: `/library/tabs`
- **Demo source**: `component-preview.tsx:461-508`
- **Variants demonstrated**: `default` (pills on tinted track), `line` (underline)
- **Orientations**: `horizontal` (default), `vertical`
- **States covered**:
  - `data-active` on active trigger (bg-background + shadow-sm for default; underline for line)
  - hover (`text-interactive-hover-foreground`)
  - focus-visible (`border-ring ring-[3px] ring-ring/50`)
  - disabled (`pointer-events-none opacity-50`)
- **Required states for product code**:
  - **`TabsContent`** for each `TabsTrigger` value (mismatch warns)
  - **Vertical** orientation needs `className="flex w-full max-w-lg gap-4"` on root (demo line 493)
- **DS gap**: None.

#### Command Menu
- **Canonical source**: `exxat-ds/packages/ui/src/components/ui/command.tsx` (233 lines)
- **Library route**: `/library/command`
- **Demo source**: none in `component-preview.tsx` (uses palette-mode wrapper at `components/command-menu*.tsx`)
- **Exports**: `Command`, `CommandDialog`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`, `CommandShortcut`, `CommandSeparator`
- **CommandInput variants**: `default` (pill via `InputGroup`), `palette` (flat header — `command-menu-02.tsx` style)
- **States covered**:
  - `CommandEmpty` — renders `py-6 text-center text-sm` "No results" copy (or whatever children)
  - `data-selected=true` on highlighted item — accent surface (NOT ring) to avoid double-ring with input
  - `data-disabled=true` — `pointer-events-none opacity-50`
  - High-contrast (`hc:`) — selected item gets `ring-2 ring-ring ring-inset` (replaces fill)
  - Forced-colors: `bg-[Highlight] text-[HighlightText]` for selected
  - `CommandShortcut` ms-auto for right-aligned shortcut hint
- **Required states for product code**:
  - **`CommandEmpty`** is REQUIRED — otherwise cmdk renders nothing for empty searches
  - **`CommandDialog`** for ⌘K floater (overlay defaults to transparent — outside-click still dismisses)
- **DS gap**: ❌ Demo doesn't exercise loading state (when search is async). Escalate.

#### Breadcrumb
- **Canonical source**: `exxat-ds/packages/ui/src/components/ui/breadcrumb.tsx` (120 lines)
- **Library route**: not in `library-catalog.ts` (DS gap — exported, but not catalogued)
- **Demo source**: none
- **Exports**: `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator`, `BreadcrumbEllipsis`
- **States covered**:
  - `BreadcrumbPage` carries `aria-current="page"` + `aria-disabled="true"`
  - `BreadcrumbSeparator` renders `fa-chevron-right` (auto-RTL via `rtl:rotate-180`)
  - `BreadcrumbEllipsis` for collapsed breadcrumbs (`sr-only "More"` for SR)
- **Required states for product code**: terminal segment uses `BreadcrumbPage`, never `BreadcrumbLink`
- **DS gap**: ❌ Not in catalog, no live preview.

---

### Overlays

#### Sheet
- **Canonical source**: `exxat-ds/packages/ui/src/components/ui/sheet.tsx` (148 lines)
- **Library route**: `/library/sheet`
- **Demo source**: `component-preview.tsx:619-664`
- **Sides demonstrated**: `top`, `right` (default), `bottom`, `left`
- **States covered**:
  - `data-open` / `data-closed` slide animations per side (`slide-in-from-{side}-10`)
  - `showCloseButton` (default true) — top-right X button
  - `showOverlay` (default true) — `bg-overlay` backdrop with backdrop-blur
- **Floating sheet pattern (no overlay)**: see `component-preview.tsx:728-793` (`FloatingSheetAllSidesPreview`) — uses `showOverlay={false}` + custom inset positioning so the page behind stays fully visible. Used by `ExportDrawer` and `TablePropertiesDrawer`.
- **Required states for product code**:
  - **`SheetTitle`** must exist (Radix throws if absent — even if visually hidden via `sr-only`)
  - **`SheetDescription`** when content needs an accessible summary
  - **Escape closes** (Radix default)
- **Optional states**: custom `inset` styling for floating-sheet pattern (see `getFloatingSheetInsetProps`)
- **DS gap**: None.

#### Dialog
- **Canonical source**: `exxat-ds/packages/ui/src/components/ui/dialog.tsx` (172 lines)
- **Library route**: `/library/dialog`
- **Demo source**: `component-preview.tsx:728-793` (currently wired as `FloatingSheetAllSidesPreview` — actually the floating-sheet demo)
- **Exports**: `Dialog`, `DialogTrigger`, `DialogPortal`, `DialogClose`, `DialogOverlay`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`
- **States covered**:
  - `data-open` (animate-in fade-in zoom-in-95) / `data-closed` (animate-out fade-out zoom-out-95)
  - `showCloseButton` (default true)
  - `overlayClassName` — pass `bg-transparent` to suppress dim (e.g. CommandDialog)
  - DialogFooter has `showCloseButton` to auto-add an outline "Close" button
- **Required states for product code**:
  - **`DialogTitle`** required (Radix throws otherwise — use `sr-only` if no visible title)
  - **`DialogDescription`** for the accessible description (paired automatically)
  - **`maxWidth`** override via `className` on `DialogContent` (default `sm:max-w-sm`)
- **DS gap**: ❌ The `/library/dialog` route actually previews the floating Sheet (`FloatingSheetAllSidesPreview`), not a Dialog. Mislabelled — escalate to fix the case label in `component-preview.tsx:965-966`.

#### ExportDrawer (product organism — Sheet-based)
- **Canonical source**: `Admin/apps/web/components/export-drawer.tsx` (~320 lines)
- **Library route**: `/library/export-drawer`
- **Demo source**: `component-preview.tsx:234-249`
- **States covered**:
  - Closed (default)
  - Open with format + date range + visible column selectors
  - **Submitting** — Button shows `fa-spinner-third fa-spin` (line 311 of `export-drawer.tsx`)
  - Total-rows count rendered
- **Required states for product code**: pass `totalRows` + `visibleColumns` (audit will fail if these are missing — drawer otherwise shows "Export 0 of 0").
- **DS gap**: None for state coverage. Note: this is the canonical "submit + spinner" pattern — products copying export flows should mirror it.

#### TablePropertiesDrawer
- **Canonical source**: `Admin/apps/web/components/table-properties/drawer.tsx` (~900 lines)
- **Library route**: `/library/table-properties-drawer`
- **Demo source**: placeholder only (`PlaceholderPreview` linking to `/data-list`)
- **States covered** (in production, not demo): columns visibility, density (compact/comfortable), filters (per-column ops), sorting, conditional formatting, grouping, gridlines
- **DS gap**: ❌ No interactive sandbox. Heavy organism; product code copying it works in the dark. Escalate.

---

### Containment

#### Card
- **Canonical source**: `exxat-ds/packages/ui/src/components/ui/card.tsx` (137 lines)
- **Library route**: `/library/card`
- **Demo source**: `component-preview.tsx:795-835`
- **Sizes demonstrated**: `default`, `sm` (tighter `py-3 gap-3 px-3`)
- **Slots (7)**: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter`
- **States covered**:
  - Header with action (top-right slot via `CardAction`)
  - Footer (bordered, `bg-muted/50`)
  - Image variants (`img:first-child` rounds top, `img:last-child` rounds bottom)
- **Spacing rules (file header)**:
  - Card owns `py-4` + `gap-4` (or `py-3 gap-3` for sm)
  - NEVER add `pb-X`/`pt-X` to `CardContent` / `CardHeader`
  - NEVER add `h-full` / `flex` / `flex-col` to Card wrapper
  - For scrollable list content (Activity / Tasks): add `overflow-auto` only
- **Glow treatment (file header rule)**: only for AI surfaces (opacity 0.12–0.16) or hero KPI bands (opacity 0.18–0.24). NEVER on Tasks, Activity, Learn, Charts, nav.
- **Required states for product code**:
  - **CardFooter** for card-level CTAs ("View all", "Ask Leo")
  - **CardHeader → CardAction** for primary workflow actions (NOT in footer)
- **DS gap**: None for state coverage. The spec is unusually thorough.

---

### Templates

#### ListPageTemplate
- **Canonical source**: `Admin/apps/web/components/templates/list-page.tsx` (~480 lines)
- **Library route**: `/library/list-page-template`
- **Demo source**: `component-preview.tsx:924-935` (PlaceholderPreview + `ViewsToolbarPreview`)
- **Composition**: header slot + KeyMetrics slot + views toolbar (tabs + filter + search + properties) + per-tab content + ExportDrawer
- **Tab states**:
  - `viewType` per tab (table/list/board/dashboard) — each tab remembers its own
  - Add / remove / rename / duplicate per-tab via dropdown
  - Hover-remove X button on inactive tabs
  - "Add view" tail (+ icon) for new tabs
- **Required states for product code**:
  - `defaultTabs`, `renderContent`, `getTabCount`
  - `exportOpen` + `onExportOpenChange` for drawer wiring
  - `tablePropertiesRef` for opening Properties drawer from header
- **DS gap**: ❌ Only PlaceholderPreview + ViewsToolbar excerpt. Heavy template — needs richer demo. Escalate.

#### ViewsToolbar
- **Canonical source**: same file as ListPageTemplate (sub-component)
- **Library route**: `/library/views-toolbar`
- **Demo source**: `component-preview.tsx:937` (`<ViewsToolbarPreview />`)
- **States covered**: view tabs with count pills, per-tab menu, hover-remove, Add view (note: NOT the same as `ui/tabs`)
- **Required states for product code**: count pills come from `getTabCount` — required prop

#### PrimaryPageTemplate
- **Source**: `Admin/apps/web/components/templates/primary-page-template.tsx`
- **Library route**: not in catalog (used by every feature page)
- **States covered**: site header (title + breadcrumbs), `beforeSiteHeader` slot (for panel activators e.g. Rotations), `contentClassName` override
- **DS gap**: Not catalogued at all. Every feature page uses it. Escalate.

---

### Utilities

#### dev-log
- **Canonical source**: `Admin/apps/web/lib/dev-log.ts` (12 lines)
- **Library route**: `/library/dev-log`
- **Demo source**: `component-preview.tsx:170-208` (`DevLogPreview`)
- **States covered**: log emits to browser console in development, no-op in production
- **Required states for product code**: never use `console.log` directly — always `devLog(...)`
- **DS gap**: None.

---

### Components in canonical but NOT in `library-catalog.ts` (DS catalog gaps)

These exist at `exxat-ds/packages/ui/src/components/ui/*.tsx` AND are exported from `index.ts`, but have NO row in `library-catalog.ts` and NO `/library/*` route:

| Component | File | Lines | Reason it's a gap |
|---|---|---|---|
| **Avatar** (+ Image, Fallback, Group, GroupCount, Badge) | `avatar.tsx` | 115 | Used in every list/table; auditable surface — no spec |
| **Breadcrumb** (7 sub-exports) | `breadcrumb.tsx` | 120 | Used by `PrimaryPageTemplate`; no catalog entry |
| **Checkbox** | `checkbox.tsx` | 55 | Used in every DataTable + Field — no preview |
| **Collapsible** | `collapsible.tsx` | 33 | Used in nav + filters — no preview |
| **DragHandleGripIcon** | `drag-handle-grip.tsx` | 10 | Used in reorderable lists — no preview |
| **Drawer** | `drawer.tsx` | 134 | Sheet has a route; Drawer (vaul) doesn't |
| **Form** | `form.tsx` | 137 | Field has a route; Form (react-hook-form bindings) doesn't |
| **Label** | `label.tsx` | 25 | Used everywhere — no preview |
| **Popover** | `popover.tsx` | 47 | Used inside DatePickerField, DataTable, CoachMark — no preview |
| **RadioGroup** + `RadioGroupItem` | `radio-group.tsx` | 45 | Used in forms — no preview |
| **Select** (10 sub-exports) | `select.tsx` | 192 | Used in KeyMetrics period picker — no preview |
| **SelectionTileGrid** | `selection-tile-grid.tsx` | 154 | Used in Table Properties — no preview |
| **Separator** | `separator.tsx` | 29 | Used in toolbars + KeyMetrics — no preview |
| **Sonner** (`Toaster`) | `sonner.tsx` | 39 | Loading icon `fa-spinner` is here — no preview (and product shouldn't use anyway per `CLAUDE.md §8`) |
| **StatusBadge** | `status-badge.tsx` | 109 | Versioning chip (Beta/New/Alpha/Preview/Deprecated) — no preview |
| **Table** (7 sub-exports) | `table.tsx` | 118 | Raw table primitive (`DataTable` builds on it) — no preview |
| **Textarea** | `textarea.tsx` | 19 | Used in Field + InputGroup — no preview |
| **Toggle** + `toggleVariants` | `toggle.tsx` | 48 | Used in toolbars — no preview |
| **ToggleGroup** + `ToggleGroupItem` | `toggle-group.tsx` | 90 | Used in Properties density picker — no preview |
| **ToggleSwitch** | `toggle-switch.tsx` | 32 | Used in Settings + form switches — no preview |

**Net: 20 components exported from DS but missing from the catalog.** This is the largest single state-coverage gap — products copy these without a canonical demo to audit against.

---

## Full feature page patterns

### `/dashboard`
- **Composition**: `PrimaryPageTemplate` → `DashboardTabs` (dynamic-imported with Skeleton fallback)
- **DashboardTabs** internally renders 3 views:
  - **Report** — full KPI grid + `DashboardReportCharts`
  - **Simple** — `GreetingWidget` + `TasksWidget` + Insights + Recent Activity + Guide + Onboarding cards
  - **Mix** — compact metrics + key chart + tasks/activity side-by-side
- **States covered**:
  - **Loading** — `dashboard/page.tsx:9-23` shows the canonical Skeleton pattern (`aria-busy="true" aria-label="Loading dashboard"` + Skeleton chrome matching final layout: h-9 title, h-11 toolbar, 4× h-24 KPI cards, min-h-[320px] chart placeholder)
  - **Populated** — `DASHBOARD_METRICS`, `DASHBOARD_INSIGHT` mocks drive rendering
  - **Empty** — NOT demonstrated. DS gap.
  - **Error** — NOT demonstrated. DS gap (relies on Next.js `error.tsx` page convention).
- **DS components used together**: Card (+ Header/Title/Description/Action/Footer/Content), Badge, Button, Separator, KeyMetrics, ChartContainer + ChartTooltip + ChartTooltipContent, Select, PageHeader (product), Tooltip, CoachMark, useCoachMark

### `/data-list` (Placements)
- **Composition**: `PrimaryPageTemplate` → `DataListClient` → `ListPageTemplate` + `KeyMetrics` (flat) + `DataListTable` + `ExportDrawer` + `CoachMark` (Views tour with 6 steps)
- **Lifecycle tabs**: All / Upcoming / Ongoing / Completed (each tab remembers its own viewType + column config in localStorage)
- **View types per tab**: table / list / board / dashboard
- **States covered**:
  - **Populated** — `placementsForPhase(filterId)`
  - **Empty (per-tab)** — `emptyCopyForPlacementLifecycleTab(tab.filterId)` returns context-specific copy
  - **Empty (filtered)** — DataTable shows `emptyState ?? "No results match your filters."`
  - **Loading** — NOT exercised at top level (mocks load synchronously)
  - **Error** — NOT exercised (no fetch boundary)
  - **Hover-row + row actions** — DropdownMenu reveals on hover
  - **Bulk actions** — `role="status" aria-live="polite"` bar appears when rows are selected
  - **Coach mark flow** — 6-step tour (`views-tabs` → `views-settings` → `views-add` → `views-search` → `views-filter` → `views-properties`) with `useCoachMark({flowId, delay: 1200})`
- **DS components used together**: ListPageTemplate (template), KeyMetrics, DataListTable (organism), DataTable (organism), ExportDrawer (organism), TablePropertiesDrawer (organism), CoachMark, useCoachMark, ViewSegmentedControl, Sheet, Button, Input, Kbd, Tip, Checkbox, DropdownMenu, Popover, Tooltip, Badge

### `/team`
- **Composition**: `PrimaryPageTemplate` → `TeamClient` → `ListPageTemplate` + `KeyMetrics` + `TeamTable` + `ExportDrawer`
- **Tabs**: single "Members" tab (table view)
- **States covered**: same as `/data-list` minus lifecycle splits and minus CoachMark
- **DS gap**: No empty / loading / error demonstrated.

### `/compliance`
- **Composition**: `PrimaryPageTemplate` → `ComplianceClient` (uses `data-views` package: list / board / table)
- **States covered**: composite views, board empty columns (via `emptyColumnLabel="No items"`)

### `/question-bank`
- **Composition**: `PrimaryPageTemplate` → `QuestionBankClient` → list-table-board view composite

### `/rotations`
- **Composition**: `PrimaryPageTemplate` → `RotationsPanelActivator` (before site header) → `RotationsEmptyState`
- **Empty state pattern (canonical)** — dashed border `border-dashed border-border/80`, muted bg `bg-muted/25`, centered illustration SVG, h2 title, muted paragraph, CTA button. Min height `min-h-[min(420px,calc(100svh-var(--header-height)-6rem))]`.
- **States covered**:
  - **Empty (primary)** — this is THE empty-state spec. Reuse the structure verbatim.
  - **Populated** — once a rotation is selected from the panel, content renders inline (not catalogued here).
- **DS components used together**: Button (size="lg"), illustration SVG, secondary-panel hook

### `/settings`
- **Composition**: `PrimaryPageTemplate` → `SettingsClient` (typed forms with Field + Input + Toggle + ToggleSwitch + Select + RadioGroup)

### `/library`
- **Composition**: `PrimaryPageTemplate` → `LibraryBrowser` (search + grouped grid by atomic layer + functional category)
- Showcase of every component card with `kind / atomicLayer / functionalCategory` chips, links to detail routes.

### `/library/<id>` (detail)
- **Composition**: `PrimaryPageTemplate` → page header + breadcrumbs → live `<ComponentPreview id={id} />` sandbox → source code panel (lines + filepath) → linked usage docs
- Used to audit each component in isolation.

### `/patterns`, `/patterns/banners`, `/patterns/data-views`, `/patterns/form-layouts`
- Documentation routes (no interactive sandboxes — pure reference cards built with Card + Badge + Button + Kbd + Tooltip).
- Pattern-card structure: title + badges + "When to use" + "Avoid when" + "Variants" + file reference.

---

## State-coverage gaps in the canonical itself (rolled up)

When the canonical doesn't demonstrate a state, the gap propagates — every product re-invents the missing state, often with non-DS workarounds. Escalate these to the DS team:

### Tier 1 — High-frequency gaps (every product hits them)
1. **Loading state** for Chart, DataTable, KeyMetrics, SectionCards, Calendar, DatePickerField
   - **Workaround in use**: Skeleton wrapped in `aria-busy="true"` (see `dashboard/page.tsx`). Works but is per-product convention, not a DS prop.
2. **Error / fetch-failure state** for ANY async data surface
   - **Workaround in use**: LocalBanner with `retry={…}` next to the component. Documented in `patterns/banners` but not co-located with the data component.
3. **Empty data (vs filtered-empty)** for DataTable / KeyMetrics / SectionCards / Chart
   - **Workaround in use**: per-context `emptyState` copy on DataTable; nothing on the others.
4. **Loading-spinner prop on Button**
   - **Workaround in use**: manual `disabled` + `<i className="fa-spinner-third fa-spin" />` content. Used in ExportDrawer.

### Tier 2 — Component-coverage gaps
5. **20 components exported from DS are absent from `library-catalog.ts`**: Avatar, Breadcrumb, Checkbox, Collapsible, DragHandleGripIcon, Drawer, Form, Label, Popover, RadioGroup, Select, SelectionTileGrid, Separator, Sonner, StatusBadge, Table (raw), Textarea, Toggle, ToggleGroup, ToggleSwitch. None has a `/library/<id>` route.
6. **PrimaryPageTemplate is not catalogued** — used by every feature page.
7. **Sidebar has no interactive sandbox** — placeholder only.
8. **CoachMark has no interactive sandbox** — placeholder only.
9. **Field has no interactive sandbox** — heavy logic (9 exports), no demo.
10. **InputGroup has no standalone sandbox** — only embedded inside Command.
11. **TablePropertiesDrawer has no sandbox** — placeholder.
12. **ListPageTemplate has no sandbox** — placeholder + tiny ViewsToolbar excerpt.

### Tier 3 — Wrong-case gaps
13. **`/library/dialog` route previews `FloatingSheetAllSidesPreview`** (lines 965–966 in `component-preview.tsx`) — should preview a Dialog, not a Sheet. Mislabelled.

### Tier 4 — Variant-coverage gaps within a working sandbox
14. **Calendar demo** only exercises `mode="single"`. No range, no multiple, no `captionLayout="dropdown"`, no disabled-day exemplar.
15. **Input demo** doesn't show: focused state, with-helper-text, with-error-message + `aria-describedby` association.
16. **Chart demo** doesn't show: empty data, error state, loading state, multi-series.
17. **SectionCards demo** doesn't show: empty / loading / error.
18. **Command demo** doesn't exercise loading state (async search results).
19. **Badge** has no `size="sm"` — every dense-row consumer overrides padding.

---

## Summary table (audit-ready)

| Component | Catalogued | Live preview | Variants | Sizes | Disabled | Empty | Loading | Error | A11y attrs |
|---|---|---|---|---|---|---|---|---|---|
| Button | ✅ | ✅ | 6 | 8 | ✅ | n/a | ⚠ no prop | n/a | aria-label on icon-only |
| Badge | ✅ | ✅ | 6 | 1 | n/a | n/a | n/a | n/a | aria-invalid CSS only |
| Input | ✅ | ✅ | 1 | 1 | ✅ | n/a | n/a | ✅ aria-invalid | aria-invalid wired |
| Calendar | ✅ | ✅ | 1 mode | n/a | ✅ via day | n/a | n/a | n/a | role-grid-day-button |
| DatePickerField | ✅ | ❌ placeholder | 1 | 1 | ✅ | n/a | n/a | n/a | aria-label auto |
| Field | ✅ | ❌ no case | n/a | n/a | data-disabled | ✅ FieldError gated | n/a | ✅ FieldError role="alert" | role="group" |
| InputGroup | ✅ | ❌ embedded only | 4 addon aligns | 4 button sizes | has-disabled | n/a | n/a | has-aria-invalid | role="group" |
| ViewSegmentedControl | ✅ | ✅ | 1 | iconOnly bool | n/a | n/a | n/a | n/a | radiogroup+radio+keys |
| Banner | ✅ | ✅ | 5×2 | 2 positions | n/a | n/a | n/a | ✅ variant=error+retry | role + aria-live |
| Skeleton | ✅ | ✅ | 1 | classes-driven | n/a | n/a | THIS is loading | n/a | wrap in aria-busy |
| CoachMark | ✅ | ❌ placeholder | 4 | 3 | n/a | n/a | n/a | n/a | aria-labelledby/desc, esc-dismiss |
| Sidebar | ✅ | ❌ placeholder | n/a | expanded/collapsed/mobile | ✅ row | n/a | n/a | n/a | sheet-mobile, kbd shortcut |
| Tabs | ✅ | ✅ | 2 | 1 | ✅ | n/a | n/a | n/a | Radix defaults |
| Command Menu | ✅ | ❌ no case (in product) | 2 input variants | 1 | ✅ data-disabled | ✅ CommandEmpty | ⚠ no first-class | n/a | hc+forced-colors |
| Tooltip | ✅ | ✅ | 1 | 4 sides | n/a | n/a | n/a | n/a | Radix portal |
| Tip | ✅ | ✅ | 1 | 4 sides | n/a | n/a | n/a | n/a | inherits Tooltip |
| Sheet | ✅ | ✅ | 4 sides | 1 | n/a | n/a | n/a | n/a | SheetTitle required |
| Dialog | ✅ | ❌ mislabelled | 1 | 1 | n/a | n/a | n/a | n/a | DialogTitle required |
| ExportDrawer | ✅ | ✅ | n/a | n/a | n/a | n/a | ✅ submit spinner | n/a | sheet-based |
| TablePropertiesDrawer | ✅ | ❌ placeholder | n/a | n/a | n/a | n/a | n/a | n/a | sheet-based |
| Card | ✅ | ✅ | 1 | 2 (default/sm) | n/a | n/a | n/a | n/a | semantic regions |
| Chart | ✅ | ✅ | recharts-driven | n/a | n/a | ❌ no demo | ❌ no demo | ❌ no demo | accessibilityLayer required |
| Kbd | ✅ | ✅ | 2 (tile/bare) | 1 | n/a | n/a | n/a | n/a | bare=aria-hidden |
| DataListTableCells | ✅ | ✅ | n/a | n/a | n/a | n/a | n/a | n/a | row-hover-actions |
| PlacementsListView | ✅ | ✅ | n/a | n/a | n/a | ✅ emptyCopy | n/a | n/a | virtualized |
| DataListTable | ✅ | ✅ | 4 view-types | densities | per-row | ✅ emptyState | ❌ no prop | n/a | aria-sort, role="status" bulk bar |
| SectionCards | ✅ | ✅ | 1 | n/a | n/a | ❌ no demo | ❌ no demo | ❌ no demo | trend has icon+label (not color alone) |
| KeyMetrics | ✅ | ✅ | 2 (card/flat) | metricsSingleRow | n/a | ❌ no demo | ❌ no demo | n/a | period Select aria-label |
| ListPageTemplate | ✅ | ❌ placeholder | n/a | n/a | n/a | per-tab | n/a | n/a | tabs + filter aria |
| ViewsToolbar | ✅ | ✅ | n/a | n/a | n/a | n/a | n/a | n/a | radiogroup |
| dev-log | ✅ | ✅ | n/a | n/a | n/a | n/a | n/a | n/a | console-only |
| Avatar | ❌ | ❌ | 1 | 3 | n/a | ✅ Fallback | n/a | n/a | sr-only fallback alt |
| Breadcrumb | ❌ | ❌ | n/a | n/a | aria-disabled on Page | n/a | n/a | n/a | aria-current="page" |
| Checkbox | ❌ | ❌ | 1 | 1 | ✅ disabled | ✅ indeterminate | n/a | aria-invalid | data-checked, single icon |
| Collapsible | ❌ | ❌ | 1 | n/a | n/a | n/a | n/a | n/a | data-state |
| Drawer | ❌ | ❌ | vaul-driven | n/a | n/a | n/a | n/a | n/a | mobile-friendly |
| Form | ❌ | ❌ | RHF-wrapped | n/a | n/a | n/a | n/a | ✅ FormMessage | aria-describedby auto |
| Label | ❌ | ❌ | 1 | 1 | peer-disabled | n/a | n/a | n/a | Radix Label |
| Popover | ❌ | ❌ | 1 | 4 sides | n/a | n/a | n/a | n/a | Radix portal |
| RadioGroup | ❌ | ❌ | 1 | 1 | ✅ | n/a | n/a | aria-invalid | data-checked |
| Select | ❌ | ❌ | 1 | 2 (sm/default) | ✅ | n/a | n/a | aria-invalid | Radix Select |
| SelectionTileGrid | ❌ | ❌ | 1 | 2/3/4 cols | n/a | n/a | n/a | n/a | radio OR button interaction |
| Separator | ❌ | ❌ | 1 | 2 orientations | n/a | n/a | n/a | n/a | decorative default |
| Sonner | ❌ | ❌ | 4 types | n/a | n/a | n/a | ✅ loading icon | ✅ error icon | banned in product |
| StatusBadge | ❌ | ❌ | 5 statuses | 3 | n/a | n/a | n/a | n/a | aria-label auto + hc/forced-colors |
| Table (raw) | ❌ | ❌ | 1 | n/a | n/a | n/a | n/a | n/a | semantic table |
| Textarea | ❌ | ❌ | 1 | 1 | ✅ | n/a | n/a | ✅ aria-invalid | aria-invalid wired |
| Toggle | ❌ | ❌ | 2 | 3 | ✅ | n/a | n/a | aria-invalid | data-state=on |
| ToggleGroup | ❌ | ❌ | 2 | 3 | ✅ | n/a | n/a | n/a | spacing + orientation |
| ToggleSwitch | ❌ | ❌ | 1 | 1 | n/a | n/a | n/a | n/a | role="switch" aria-checked |

Legend: ✅ = demonstrated. ⚠ = workaround documented but no first-class prop. ❌ = not demonstrated (or not catalogued). n/a = the state doesn't apply.

---

## Audit checklist (when a product imports a DS component)

Copy this into the state-gap audit for any product:

```
[ ] Component is in `library-catalog.ts` AND has a `/library/<id>` route
[ ] All variants used in product code appear in the canonical demo
[ ] All sizes used in product code appear in the canonical demo
[ ] Required states (this catalog row's "Required") are handled in product
[ ] Disabled = opacity-50 (NOT opacity-60 — PCE fix on file)
[ ] aria-label on every icon-only Button
[ ] aria-invalid wired from validation state (not className)
[ ] Loading state uses Skeleton wrapped in aria-busy
[ ] Empty state is context-specific (not generic "No data")
[ ] Error state uses LocalBanner with retry — NOT Sonner toast
[ ] Touch targets ≥ 44px on mobile (use size="lg" or --control-height-touch)
[ ] Both themes work (.theme-one and .theme-prism)
```
