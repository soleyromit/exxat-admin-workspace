---
name: exxat-ds
description: >
  Complete rules, patterns, and architecture guide for the Exxat DS Next.js design system.
  Use this skill whenever working on any feature, page, component, or nav item in the Exxat DS
  codebase — including adding sidebar items, creating list pages, building data tables,
  wiring navigation, writing accessible UI, handling dates, adding tooltips, using icons,
  or adding charts, graphs, KPI cards, or any data visualization.
  Also apply whenever the user asks about Exxat patterns, component reuse, WCAG compliance
  for this project, or asks "how do I build X" in the Exxat DS context.
---

# Exxat DS — Patterns & Rules Handbook

> **Read this before writing any code.** Every section below is binding. "Done" means passing all applicable rules here.

---

## 1. Project Overview

- **Stack:** Next.js 16 (App Router), React, TypeScript, Tailwind CSS, shadcn/ui primitives, Font Awesome icons
- **App root:** `exxat-ds/app/(app)/` — route group that wraps all authenticated pages
- **Single source of truth:** `exxat-ds/AGENTS.md` for full prose explanations; this skill is the actionable summary

---

## 2. Page Architecture

Every page inside `app/(app)/` uses this exact shell:

```tsx
// app/(app)/my-feature/page.tsx
import { SiteHeader } from "@/components/site-header"
import { MyFeatureClient } from "@/components/my-feature-client"
import { SidebarInset } from "@/components/ui/sidebar"

export default function MyFeaturePage() {
  return (
    <SidebarInset>
      <SiteHeader title="My Feature" />
      <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none">
        <div className="@container/main flex flex-1 flex-col w-full max-w-[1440px] mx-auto">
          <MyFeatureClient />
        </div>
      </main>
    </SidebarInset>
  )
}
```

**Rules:**
- `SidebarInset` is always the outermost wrapper
- `SiteHeader` always goes directly inside it, before `<main>`
- `<main id="main-content" tabIndex={-1}>` is required — it's the skip-link target
- Move all interactive/stateful logic into a `"use client"` component (e.g. `MyFeatureClient`) — keep page.tsx as a server component

---

## 3. Adding a Sidebar Nav Item

All navigation lives in **`lib/mock/navigation.tsx`** — it is the single source of truth.

To add a primary nav item, append to `NAV_PRIMARY`:

```tsx
{
  key: "my-feature",
  title: "My Feature",
  url: "/my-feature",
  icon:       <i className="fa-light fa-<icon-name>" aria-hidden="true" />,
  iconActive: <i className="fa-solid fa-<icon-name>" aria-hidden="true" />,
}
```

- `icon` uses `fa-light` weight; `iconActive` uses `fa-solid` — always pair them
- All icons must have `aria-hidden="true"` (decorative)
- Optional `badge?: number | string` — `"New"` → green, `"Beta"` → amber, other strings → brand color
- For document-section items add to `NAV_DOCUMENTS` instead
- For utility links (Settings, Search, Help) add to `NAV_SECONDARY`

**Routing:** create the page at `app/(app)/<key>/page.tsx` — the url must match the key.

### 3.1 Application sidebar shell (`app-sidebar.tsx`)

**Data:** `lib/mock/navigation.tsx` also holds **`NAV_SCHOOLS`**, **`NAV_USER`**, and related defaults. School marks use **`logoDevUrl()`** from **`lib/logo-dev.ts`** (publishable token; optional **`NEXT_PUBLIC_LOGO_DEV_TOKEN`**).

| Concern | Pattern |
|--------|---------|
| **Product (One / Prism)** | **`ExxatProductLogo`** (`components/exxat-product-logo.tsx`) for the header control and **`ProductSwitcher`** — **not** logo.dev rasters unless product explicitly changes that. |
| **School/program menu width** | **`DropdownMenuContent`** ships with **`w-(--radix-dropdown-menu-trigger-width)`**, so the panel matches the **narrow sidebar trigger** and long names wrap too early. For **`TeamSwitcher`**, override with e.g. **`!w-max min-w-72 max-w-[min(100vw-2rem,28rem)]`**. |
| **School/program copy** | **Do not truncate** school or program names in the switcher; wrap (**`break-words`**, **`whitespace-normal`**, **`items-start`** on multi-line rows). The selected-school summary shows **school name + current program**. |
| **Team switcher trigger** | **`SidebarMenuButton` `size="lg"`** uses **`h-12`** + **`overflow-hidden`**, which **clips** a second line (program). When the sidebar is **expanded** or **mobile**, add **`h-auto min-h-12`** and **`overflow-x-clip overflow-y-visible`**. On **icon rail**, hide label rows with **`group-data-[collapsible=icon]:hidden`** (tooltip still exposes the full string). Icon mode defaults **`size-8` + `p-2`** (~16px inner) **clips** school logos — override **`!size-9`**, **`!p-0`**, **`overflow-visible`**. Omit header **chevrons** next to logos if they look like stray chrome. |
| **Motion / Animate UI** | [Animate UI](https://animate-ui.com/docs) — open **copy-first** animated components (Motion + Tailwind). This repo uses **`motion/react`** + **`lib/motion-ui.ts`** presets; pull more animations from their registry into `components/` when needed. |
| **Nav items with children** | **Expanded:** **`Collapsible`**. **Desktop icon rail:** **`Popover`** listing child links. **Do not** pass **`tooltip={…}`** on **`SidebarMenuButton`** that is the **direct** child of **`CollapsibleTrigger asChild`** — the tooltip wrapper inserts an extra **`Tooltip` root** and breaks Radix **`Slot`** (**`React.Children.only`**). Compose **`Tooltip` > `TooltipTrigger` > `CollapsibleTrigger` > `SidebarMenuButton`** without the **`tooltip` prop**, or use the popover branch only. |
| **Profile (mock)** | **`stockPortraitUrl()`** from **`lib/stock-portrait.ts`**; **`AvatarImage`** **`referrerPolicy="no-referrer"`** for external URLs. |

**Reference:** `components/app-sidebar.tsx`, `components/nav-user.tsx`, `components/product-switcher.tsx`.

---

## 4. Primary Hub Pages — Mandatory Pattern

Any **primary nav destination** that shows a list of records **must** use this composition (same as Placements / Team):

```
ListPageTemplate
  ├── PageHeader (title, subtitle with count, primary CTA, ⋯ more menu)
  ├── KeyMetrics (flat variant, single row)
  └── renderContent()
        └── DataTable + useTableState + TablePropertiesDrawer
```

**Reference implementations:**
- `components/team-client.tsx` + `components/team-table.tsx` — canonical pattern
- `components/data-list-client.tsx` + `components/data-list-table.tsx` — Placements (most complete)

**Files to create for a new hub page `Foo`:**
| File | Purpose |
|------|---------|
| `lib/mock/foo.ts` | Mock data + TypeScript interface (12+ rows) |
| `lib/mock/foo-kpi.ts` | `fooKpiMetrics()` + `fooKpiInsight()` |
| `components/foo-page-header.tsx` | `PageHeader` + primary CTA + ⋯ menu |
| `components/foo-table.tsx` | `DataTable` + `useTableState` + `TablePropertiesDrawer` |
| `components/foo-client.tsx` | `ListPageTemplate` orchestrator |
| `app/(app)/foo/page.tsx` | Thin server component |

**Do not** ship a **nav-linked hub** as an **empty page** or a single “replace this later” paragraph. If the route appears in **`lib/mock/navigation.tsx`**, implement the full hub (mock rows, **`ListPageTemplate`**, connected views per **`exxat-ds/AGENTS.md` §4.1**) unless the product explicitly defines a non-data shell.

### Page vs drawer (actions)

- **Drawer / sheet** — Use when the user needs **the current page behind them** *and* a **quick view**, **quick actions**, or a **short step** (e.g. properties, export, glance at a row).
- **New page** — Use **otherwise**: **primary**, **long-form**, **multi-step**, or flows that need their **own URL** without the hub visible.

Align with **`exxat-ds/AGENTS.md` §6.4**, **`docs/data-views-pattern.md`**, **`.cursor/rules/exxat-page-vs-drawer.mdc`**.

---

## 5. Data Table Stack

**Always use these — never raw `<table>` or shadcn's `ui/table` for product data lists.**

| Import | Purpose |
|--------|---------|
| `DataTable` from `@/components/data-table` | Base table |
| `useTableState` from `@/components/data-table/use-table-state` | Sort, filter, column state |
| `TablePropertiesDrawer` from `@/components/table-properties` | Columns, density, filters, sort, conditional rules |
| `ColumnDef` from `@/components/data-table/types` | Column type |
| `FilterFieldDef`, `FilterOperator`, `ConditionalRule` from `@/components/table-properties/types` | Filter types |

**Board (kanban) cards:** Use **`ListPageBoardCard`** and related parts from **`components/data-views/list-page-board-card.tsx`**; **`BoardCardTwoLineBlock`** / **`BoardCardIconRow`** from **`board-card-primitives.tsx`**. **List hub** status (Team, Compliance, Question bank, …): maps in **`lib/list-status-badges.ts`**; render with **`ListHubStatusBadge`** (**`surface="table"`** in table/list, **`surface="board"`** on cards); semantic tints **`LIST_HUB_STATUS_TINT_*`** for new domains; no **`uppercase`**. **Placements** uses **`StatusBadge`** in **`data-list-table-cells.tsx`** (wrapper over **`ListHubStatusBadge`** + **`PLACEMENT_STATUS_*`**). **Full rules:** **`exxat-ds/AGENTS.md` §4.4**, **`.cursor/rules/exxat-board-cards.mdc`**, **`.cursor/skills/exxat-board-cards/SKILL.md`**.

**Minimum required features on any data list page:**
- Search (wire `searchable={displayOptions.showToolbarSearch}`)
- Filters (via `TablePropertiesDrawer` filter fields)
- Table properties drawer (Properties button with `fa-light fa-sliders`)
- `selectable={true}` with bulk-actions slot
- `emptyState` prop with helpful message

**Column definition pattern:**
```ts
{
  key: "name",
  label: "Name",
  width: 240,
  minWidth: 160,
  sortable: true,
  sortKey: "name",
  filter: {
    type: "text",           // "text" | "select" | "date"
    icon: "fa-user",
    operators: ["contains", "not_contains"],
  },
  cell: row => <span className="text-sm font-medium text-foreground">{row.name}</span>,
}
```

**Pin conventions:**
- `select` column: `defaultPin: "left"`, `lockPin: true`
- `actions` column: `defaultPin: "right"`, `lockPin: true`

**DataTable must wrap in `<div className="pb-6">`.**

---

## 6. Page Header Pattern

Use `PageHeader` from `@/components/page-header` for the content-area header (below SiteHeader):

```tsx
<PageHeader
  title="Foo"
  subtitle={`${count} items · Last updated now`}
  actions={
    <div className="flex items-center gap-2" role="group" aria-label="Foo actions">
      <Tip side="bottom" label="Add a new foo">
        <Button type="button" size="lg" onClick={onAdd}>
          <i className="fa-light fa-plus" aria-hidden="true" />
          Add foo
        </Button>
      </Tip>
      <DropdownMenu ...>
        <Tip side="bottom" label="More actions">
          <DropdownMenuTrigger asChild>
            <Button type="button" size="lg" variant="outline" className="aspect-square px-0" aria-label="More actions">
              <i className="fa-light fa-ellipsis text-base" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
        </Tip>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onClick={onExport}>
            <i className="fa-light fa-arrow-down-to-line" aria-hidden="true" />
            Export
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onToggleMetrics}>
            <i className={`fa-light ${showMetrics ? "fa-eye-slash" : "fa-eye"}`} aria-hidden="true" />
            {showMetrics ? "Hide metric section" : "Show metric section"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  }
/>
```

**Rules:**
- Primary CTA: `Button size="lg"` (filled/default) — never `variant="outline"` as the sole primary action
- More (⋯): `variant="outline"` icon-only button → dropdown with Export → `ExportDrawer`
- Subtitle: `"{count} items · Last updated now"` format
- Title uses Ivy Presto (`font-heading` variable) — applied automatically by `PageHeader`

---

## 7. Navigation: Breadcrumbs vs Back Link

**Never use both on the same page. Pick one:**

| Page type | Use |
|-----------|-----|
| Detail page (child of a list) | **Breadcrumbs** via `SiteHeader` `breadcrumbs` prop |
| Full-page form / wizard | **Back link** only (no breadcrumbs) |

```tsx
// Detail page — breadcrumbs
<SiteHeader
  title="Sarah Johnson"
  breadcrumbs={[
    { label: "Placements", href: "/data-list" },
    { label: "Placement Details" },
  ]}
/>

// Form page — back link + SidebarAutoCollapse
<SidebarAutoCollapse />
<Link href="/data-list">← Back</Link>
```

Breadcrumb separator: `fa-light fa-chevron-right text-[8px]`. Last segment is `font-medium text-foreground`, parent segments are `text-muted-foreground`.

---

## 8. Component Reuse — Hard Rules

Never install new packages or create parallel components. Always use what exists.

| Need | Use |
|------|-----|
| Any button | `Button` from `@/components/ui/button` |
| Chart / graph card | `ChartCard` from `@/components/charts-overview` |
| Drawer / panel | `Sheet` from `@/components/ui/sheet` (floating style — see memory) |
| Tooltip | `Tip` from `@/components/ui/tip` — never `title` attribute |
| Keyboard hint | `Kbd` / `KbdGroup` from `@/components/ui/kbd` |
| Badge | `Badge` from `@/components/ui/badge` |
| Tabs | `Tabs`/`TabsList`/`TabsTrigger` from `@/components/ui/tabs` |
| Banner (page-level) | `SystemBanner` / `LocalBanner` from `@/components/ui/banner` |
| Success / error feedback | Inline copy, `LocalBanner`, or dialog — **never** `toast()` / Sonner / snackbars (**`AGENTS.md` §6.5**, **`.cursor/rules/exxat-no-toast.mdc`**) |
| Date formatting | `formatDateUS()` / `formatDateTimeUS()` from `@/lib/date-filter` |
| Modifier key label | `useModKeyLabel()` from `@/hooks/use-mod-key-label` |
| Class merging | `cn()` from `@/lib/utils` |
| Color | CSS design tokens only — no hardcoded hex/rgb |
| Minimum font size | **`text-xs`** (11px at 16px root via `--text-xs`) or larger — never arbitrary classes below 11px (`AGENTS.md` §8.3) |

Before adding any component: search `components/ui/` first. Add a prop/variant to an existing component rather than creating a parallel one.

---

## 9. Date & Time Format

Mandatory across the **entire** app — tables, filters, tooltips, forms, everywhere:

| Type | Format | Example |
|------|--------|---------|
| Date only | `MM/DD/YYYY` | `03/15/2026` |
| Date + Time | `MM/DD/YYYY hh:mm AM/PM EST` | `03/15/2026 09:30 AM EST` |

- Zero-pad month and day: `03` not `3`
- 4-digit year always
- 12-hour clock, uppercase AM/PM, append `EST`
- Never ISO (`2026-03-15`) or verbose (`Mar 15, 2026`) in the UI
- Date picker: Calendar + Popover component; format displayed as `MM/DD/YYYY`

### 9.1 Format hints MUST be persistent (WCAG 3.3.2)

Any input whose value must follow a specific format — **dates, times, phone, currency, GPA, Student IDs, URLs, unit-bearing numbers** — MUST render the format as **persistent helper text** via `FormDescription` (or any element tied to the input via `aria-describedby`). Placeholders disappear on focus and are not reliably announced — they **MUST NOT** be the sole carrier of the format.

```tsx
<FormField name="startDate" render={({ field }) => (
  <FormItem>
    <FormLabel>Start date<span aria-hidden="true"> *</span></FormLabel>
    <FormControl><DatePickerField value={field.value} onChange={field.onChange} /></FormControl>
    <FormDescription>MM/DD/YYYY</FormDescription>
    <FormMessage />
  </FormItem>
)} />
```

Units belong in `FormDescription` (e.g. GPA → "Out of 4.0"; Hours/week → "hrs/wk"), not hidden in the placeholder. Prefer picker primitives (`DatePickerField`, `Select`) over free-text wherever one exists. Full checklist: `.cursor/skills/exxat-accessibility/SKILL.md` — *Form fields — format hints*.

---

## 10. Ask Leo Icon

Every Ask Leo / AI surface uses this exact class pattern:

```tsx
<i className="fa-duotone fa-solid fa-star-christmas text-brand" aria-hidden="true" />
```

- `fa-duotone fa-solid fa-star-christmas` — must be duotone solid weight
- `text-brand` — resolves to `var(--brand-color-dark)`, passes WCAG AA 4.5:1 on white
- Applies to: Ask Leo toggle (site header), sidebar, chart cards, KPI insight cards, promo banners
- Never: `fa-light fa-sparkles`, `fa-solid` without `fa-duotone`, or any other star/sparkle variant

---

## 11. Keyboard Shortcuts

Show `Kbd` / `KbdGroup` on: primary CTAs, secondary/overflow actions, Search, Ask Leo toggle, Sidebar toggle.

```tsx
<Tip side="bottom" label={<span className="flex items-center gap-1.5">New <KbdGroup><Kbd>{mod}</Kbd><Kbd>⌥</Kbd><Kbd>N</Kbd></KbdGroup></span>}>
  <Button ...>Add foo</Button>
</Tip>
```

**If you show a shortcut, implement it.** Use the shared primitives from `@/components/ui/dropdown-menu`:

```tsx
import { DropdownMenuItem, Shortcut } from "@/components/ui/dropdown-menu"

// Visual hint on the menu item (renders a DropdownMenuShortcut automatically).
<DropdownMenuItem shortcut="⌘⇧E" onSelect={onExport}>Export</DropdownMenuItem>

// Global binding — render in a parent that stays mounted (menu items unmount when closed).
<Shortcut keys="⌘⇧E" onInvoke={onExport} />
```

- `shortcut` prop = visual only. `<Shortcut>` = actual key binding.
- Accepts symbols (`⌘⇧⌥⌃⌫⌦⏎↑↓←→`) or words (`Cmd+Shift+D`, `Alt+P`).
- The hook automatically skips input/textarea/contenteditable targets and any open modal dialog.
- Prefer this over ad-hoc `document.addEventListener("keydown", …)` + `isEditableTarget` — one source of truth, fewer stale refs.

**Every action menu should carry shortcuts.** Standard bindings across the app:

| Action | Shortcut |
|--------|----------|
| Toggle sidebar | ⌘/Ctrl + B |
| Table search | ⌘/Ctrl + K |
| Ask Leo | ⌘/Ctrl + ⌥/Alt + K |
| New (primary CTA) | ⌘/Ctrl + ⌥/Alt + N |
| More (⋯ menu open) | ⌘/Ctrl + ⌥/Alt + M |
| Export | ⌘/Ctrl + ⇧/Shift + E |
| Hide/Show metric section | ⌘/Ctrl + ⌥/Alt + H |
| Rename (view, tab) | F2 |
| Duplicate | ⌘/Ctrl + D |
| Review / Info | ⌘/Ctrl + I |
| Remove / Delete item | ⌘/Ctrl + ⌫ |
| Add view (1..n) | ⌘/Ctrl + ⇧/Shift + 1..9 |
| **Submit a workflow** (Create, Save, Export, Apply) | **Enter** ⏎ — scoped to the open form/drawer/dialog |
| **Cancel / dismiss** a workflow | **Esc** (Radix Dialog/Sheet/AlertDialog already bind this) |
| **Advance a multi-step wizard** | ⌘/Ctrl + Enter (plain Enter must not submit mid-flow) |
| **Back in a wizard** | ⌘/Ctrl + ⌥/Alt + ← |

**Avoid browser-reserved chords:** ⌘⇧N, ⌘⇧T, ⌘⇧O, ⌘⇧B, ⌘L.

### 11.0 Every workflow primary/secondary action MUST carry Enter / Esc

Every form, dialog, drawer, sheet, or wizard MUST show and bind:

- **Primary (submit/commit)** → **Enter** ⏎. Render the `<Kbd>⏎</Kbd>` **inline inside the button** (after the label, wrapped in `<KbdGroup className="ml-1.5">`) — NOT in a hover Tip. Workflow buttons must expose the shortcut at rest. Pair with a `<Shortcut keys="Enter" onInvoke={submit} />` mounted while the surface is open. `useShortcut` skips input/textarea/contenteditable events, so Enter in a text field still types — it only fires on surface chrome.
- **Secondary (Cancel/Dismiss)** → **Esc**. Inline `<Kbd>Esc</Kbd>` in the Cancel button (same `ml-1.5` pattern). Radix `Dialog` / `Sheet` / `AlertDialog` bind Esc natively.

Inside a button, use **`<Kbd variant="bare">`** — no background, no border, inherits `currentColor` at 70% opacity — so the hint reads as part of the button label, not a pasted-on tile. The default `variant="tile"` (filled, bordered) is for tooltips, menus, docs, and standalone contexts.

```tsx
<Button type="submit">
  <i className="fa-light fa-check" aria-hidden="true" />
  Create placement
  <KbdGroup className="ml-1.5"><Kbd variant="bare">⏎</Kbd></KbdGroup>
</Button>
<Button type="button" variant="outline" onClick={onCancel}>
  Cancel
  <KbdGroup className="ml-1.5"><Kbd variant="bare">Esc</Kbd></KbdGroup>
</Button>
```

Glue multi-key chords into a single `<Kbd variant="bare">` (`⌘⌥←`, `⌘⏎`) rather than one tile per key — otherwise the gap between tiles reintroduces the "patch" look.

Hover Tips remain correct for **page-level** actions (e.g. page header "New", ⋯ overflow trigger) where inline Kbd would crowd dense chrome. Inline Kbd is for **workflow surfaces** — forms, dialogs, drawers, wizard footers.
- **Multi-step wizard safety**: plain Enter MUST NOT submit on intermediate steps, or the final review auto-closes when the user hits Enter inside an input. Gate `form.onSubmit` on `step === lastStep`:

  ```tsx
  <form onSubmit={(e) => {
    if (step !== LAST) { e.preventDefault(); return }
    form.handleSubmit(onSubmit)(e)
  }}>
  ```

  Use `⌘Enter` via `<Shortcut>` to advance intermediate steps. On the final step, plain Enter submits and the Kbd hint shows **⏎**.

Reference implementations: `new-placement-form.tsx` (Create placement = Enter on step 5, Back = ⌘⌥←), `export-drawer.tsx` (Export = Enter, Cancel = Esc).

### 11.1 Global command palette (⌘K)

**`CommandMenu`** is **global search** and the main **AI entry** (not a second nav). Config: **`buildCommandMenuConfig()`** in **`lib/command-menu-config.ts`**, **`CommandMenuProvider`** in **`app/(app)/layout.tsx`**.

- **Navigation / library / patterns:** Search and pick a row—**Enter** to go.
- **Searchable row data:** Pass **`dataGroups`** into **`buildCommandMenuConfig`**. Map mocks/API rows in **`lib/command-menu-search-data.ts`** (e.g. **`getCommandMenuSearchDataGroups()`** from placements / student fields). Do **not** embed data mapping inside **`command-menu.tsx`**.
- **`searchOnly` groups:** For large indexes, set **`searchOnly: true`** on **`CommandMenuGroup`** so that group is **not rendered** until the user types (cmdk otherwise shows every item when the query is empty). Static groups stay visible on open.
- **Natural language / AI:** Product **SHOULD** show **quick results in the palette** when the response fits; use **Ask Leo** (**⌘⌥K**) for **longer or complex** answers.
- **Do not** treat the palette as a static link list only—leave room for inline AI results as they ship.

**Details:** `exxat-ds/docs/command-menu-pattern.md`, **`exxat-ds/AGENTS.md` §7.1** (or `./` when the app folder is the workspace root).

---

## 12. Accessibility — WCAG 2.1 AA (Non-Negotiable)

Full checklist in `references/accessibility.md`. Summary of the most-violated rules:

### Structure
- One `<main id="main-content" tabIndex={-1}>` per page
- One `<h1>` per page (via `PageHeader`) — `SiteHeader` title is NOT an h1
- `DialogTitle` / `SheetTitle` / `DrawerTitle` always present (use `className="sr-only"` if visually hidden)

### ARIA roles
- `role="tablist"` → only `role="tab"` children. **Never** put buttons, menus, or other controls inside `tablist`
- View switchers with extra controls (tabs + remove + settings): use `role="toolbar"` + `aria-label`
- Icon-only buttons: `aria-label` + `<Tip>` — no exceptions

### Touch targets
- Minimum **24×24 CSS px** for all interactive controls
- Icon-only: `size-6` or `min-h-6 min-w-6` — never `size-4` as sole target

### Color & contrast
- Normal text ≥ 4.5:1; UI components ≥ 3:1
- Status never by color alone — always include text label or icon
- Decorative icons: `aria-hidden="true"`

### Dynamic content
- Filter/result count changes: `aria-live="polite"`
- Loading states: `aria-busy="true"`
- Toasts: `role="status"` or `aria-live="polite"`

---

## 13. Charts & Graphs — Use Existing Cards

**Never create a custom card shell for a chart. Always use the existing components.**

### ChartCard — the only chart wrapper

Use `ChartCard` from `@/components/charts-overview` for every chart/graph in the app.

```tsx
import { ChartCard } from "@/components/charts-overview"

<ChartCard
  title="Placements Over Time"
  description="Monthly placement activity for the current academic year"
  variant="normal"        // see variants below
>
  {/* Recharts chart goes here */}
  <ChartContainer config={chartConfig} className="h-[200px] w-full">
    <AreaChart data={data}>...</AreaChart>
  </ChartContainer>
</ChartCard>
```

### ChartCard variants — pick the right one

| `variant` | When to use |
|-----------|-------------|
| `"normal"` | Single chart with Ask Leo button in the header |
| `"tabs"` | Chart view + Trend (line) toggle, or any custom tab pair |
| `"selector"` | Dropdown filter (period, program, cohort) above the chart |
| `"metrics-tabs"` | KPI strip whose tabs drive the chart (metric cells ARE the tab triggers) |
| `"kpi-chart"` | Hero chart card with prominent KPI number + mini chart |

```tsx
// selector variant — adds a dropdown filter
<ChartCard
  variant="selector"
  title="Placements by Program"
  description="Filter by program to compare activity"
  filterOptions={[
    { value: "all",     label: "All programs" },
    { value: "nursing", label: "Nursing"      },
    { value: "pt",      label: "PT"           },
  ]}
  defaultFilter="all"
  onFilterChange={setFilter}
>
  {(filter) => <MyChart program={filter} />}
</ChartCard>

// metrics-tabs variant — KPI cells drive chart
<ChartCard
  variant="metrics-tabs"
  title="Compliance Trend"
  description="Select a metric to view its trend"
  miniMetrics={[
    { label: "Completed", value: "84%",  trend: "up"      },
    { label: "Pending",   value: "12",   trend: "neutral"  },
    { label: "Overdue",   value: "3",    trend: "down"     },
  ]}
>
  {(activeMetric) => <MetricChart metric={activeMetric} />}
</ChartCard>
```

### ChartFigure — accessibility wrapper inside ChartCard

Wrap the Recharts chart inside `ChartFigure` to get keyboard navigation (arrow keys through data points) and screen-reader announcements:

```tsx
import { ChartFigure } from "@/components/charts-overview"   // internal export

// ChartFigure is used inside ChartCard's children — it handles:
// - role="application" with aria-label
// - ArrowLeft/Right to cycle data points
// - Escape to exit chart navigation
// - Live region announcements
```

### ChartContainer + color tokens

```tsx
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"

const chartConfig: ChartConfig = {
  placements: { label: "Placements", color: "var(--color-chart-1)" },
  compliance: { label: "Compliance", color: "var(--color-chart-2)" },
}

// Always use CSS chart color tokens — never hardcoded hex/rgb:
// var(--brand-color)    — primary brand
// var(--color-chart-1) through var(--color-chart-5) — series colors
// var(--chart-2)        — success/positive
// var(--chart-4)        — warning
// var(--destructive)    — error/negative
```

### Chart accessibility rules

These are non-negotiable (built into `ChartCard`/`ChartFigure` when used correctly):

1. **Accessible data table** — add `ChartDataTable` (sr-only) after every chart so screen-reader users can navigate data as a table
2. **Color is never the only differentiator** — pair series colors with dashed vs solid lines, shape markers, or inline labels
3. **Chart series colors ≥ 3:1** contrast against card background
4. **Text inside charts ≥ 4.5:1** on their local background
5. **Tooltips on keyboard focus**, not hover only — `ChartTooltipContent` handles this automatically

### KeyMetrics — for KPI strips

Use `KeyMetrics` from `@/components/key-metrics` for metric/KPI strips. Do not build a custom metric grid.

```tsx
<KeyMetrics
  variant="flat"          // "card" | "flat" | "compact"
  metrics={metrics}       // MetricItem[]
  insight={insight}       // MetricInsight
  showHeader={false}
  metricsSingleRow
/>
```

### What NOT to do

- Do not use raw `Card` + `CardHeader` + a Recharts chart without `ChartCard`
- Do not install new charting libraries (`react-chartjs-2`, `victory`, `nivo`, etc.) — Recharts is the only chart library
- Do not hardcode chart colors — use CSS tokens only
- Do not build a custom KPI/metric row — use `KeyMetrics`
- Do not add an Ask Leo button manually to chart cards — `ChartCard` includes it automatically

---

`DataTable` already applies its own horizontal inset. Do not wrap it in extra `px-*` / `mx-*` — that creates staggered margins between the filter bar and table vs tabs.

Follow `ListPageTemplate` → `DataTable`'s own inset — one horizontal rhythm only.

---

## 14. KPI Metrics Pattern

Every primary hub page has a collapsible metrics strip:

```tsx
// lib/mock/foo-kpi.ts
export function fooKpiMetrics(items: Foo[]): MetricItem[] {
  return [
    { id: "total", label: "Total", value: items.length, delta: "+1", trend: "up", href: "#", metricVariant: "hero" },
    { id: "active", label: "Active", value: activeCount, delta: "—", trend: "neutral", href: "#" },
    // ...more metrics
  ]
}

export function fooKpiInsight(items: Foo[]): MetricInsight {
  return {
    title: "Insight title",
    description: "Short actionable insight based on the data.",
    severity: "info" | "warning",
    actionLabel: "Ask Leo",
  }
}
```

In `FooClient`:
```tsx
<KeyMetrics variant="flat" metrics={metrics} insight={insight} showHeader={false} metricsSingleRow />
```

---

## 15. AI Execution Checklist

Copy and complete for every list/table/hub page:

- [ ] Page shell: `SidebarInset` → `SiteHeader` → `<main id="main-content" tabIndex={-1}>` → `@container/main div`
- [ ] Sidebar item added to `lib/mock/navigation.tsx` with light/solid icon pair
- [ ] **Shell sidebar:** Product header uses **`ExxatProductLogo`**; school **`logoDevUrl`** + **`lib/logo-dev`**; team switcher menu **`!w-max`** (not trigger-width-only); expanded switcher **`h-auto min-h-12`** so school + program lines are not clipped; no **`CollapsibleTrigger` → `SidebarMenuButton` with `tooltip` prop**; child nav uses **popover** on icon rail per **§3.1**
- [ ] Hub pages: `ListPageTemplate` + `DataTable` + `useTableState` + `TablePropertiesDrawer`
- [ ] Board view: `ListPageBoardCard` shell + `ListHubStatusBadge` + `list-status-badges` when applicable (`exxat-ds/AGENTS.md` §4.4)
- [ ] New primary hubs: not placeholder-only — full template + data + views (`exxat-ds/AGENTS.md` §4.1)
- [ ] **§6.4:** Parent **context** + quick view/actions → drawer/sheet; primary or long flows → **new page** (`AGENTS.md`, `docs/data-views-pattern.md`)
- [ ] No raw `<table>` or `ui/table` for product data lists
- [ ] No double horizontal padding around `DataTable`
- [ ] Primary CTA: filled `Button size="lg"`; ⋯ more menu with Export + toggle metrics
- [ ] Breadcrumbs OR back link — never both
- [ ] Charts: wrapped in `ChartCard` with correct `variant`; no raw `Card` + Recharts combos; color tokens only
- [ ] All dates: `MM/DD/YYYY` / `MM/DD/YYYY hh:mm AM/PM EST`
- [ ] All tooltips via `<Tip>` — no `title` attribute
- [ ] All icons: `aria-hidden="true"`; Ask Leo: `fa-duotone fa-solid fa-star-christmas text-brand`
- [ ] Icon-only buttons: `aria-label` + `<Tip>`; target ≥ 24×24 px
- [ ] `DialogTitle`/`SheetTitle`/`DrawerTitle` present on every overlay
- [ ] `role="tablist"` contains only tab-role children
- [ ] No new shadcn components, no hardcoded colors, no duplicate component abstractions

---

## Reference Files

- `references/accessibility.md` — Full WCAG 2.1 AA checklist (interactive elements, keyboard, forms, semantics, contrast, dynamic content, component-specific rules)
- `references/data-table-pattern.md` — Complete data table implementation guide with full column/filter/drawer wiring

Read the relevant reference file when implementing the corresponding feature.
