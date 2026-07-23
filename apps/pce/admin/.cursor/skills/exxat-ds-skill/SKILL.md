---
name: exxat-ds
description: >
  Complete rules, patterns, and architecture guide for the Exxat DS Vite + React design system.
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

- **Stack:** Vite + React + react-router-dom, TypeScript, Tailwind CSS, shadcn/ui primitives, Font Awesome icons
- **App root:** `apps/web/src/views/` — route modules wired in `src/App.tsx`
- **Single source of truth:** `apps/web/AGENTS.md` for full prose explanations; this skill is the actionable summary
- **Companion skills (narrow topics):** `exxat-fontawesome-icons`, `exxat-mono-ids`, `exxat-primary-nav-secondary-panel`, `exxat-centralized-list-dataset`, `exxat-list-page-view-shells`, `exxat-dedicated-search-surfaces`, `exxat-accessibility`, `exxat-board-cards`, `exxat-collaboration-access` — live under `.cursor/skills/`; vetted copies ship with **`@exxatdesignux/ui`** in `consumer-extras/cursor-skills/` after **`pnpm --filter @exxatdesignux/ui vendor:consumer-extras`**.
- **Library folder-scoped header (rule + doc):** **`.cursor/rules/exxat-library-hub-header.mdc`** and **`docs/library-hub-header-pattern.md`** — pair with **`exxat-primary-nav-secondary-panel`** when URL **`scope=folder`** drives the hub title.
- **Consumer repos (npm install of `@exxatdesignux/ui`):** For **install / upgrade / bump**, load skill **`exxat-package-upgrade`** first — it gates changelog review, `sync-extras`, and generated-starter shell ports without touching mock data or tenant copy. Then run **`npx --package=@exxatdesignux/ui@latest exxat-ui changelog`** (release notes), then **`npx --package=@exxatdesignux/ui@latest exxat-ui sync-extras`**, and diff **`node_modules/@exxatdesignux/ui/generated-starter/`** using **`port-map.md`** in that skill. Use **`exxat-ui changelog`**, **`exxat-ui update`**, and **`exxat-ui doctor`** for CLI guidance.

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

**Data:** `lib/mock/navigation.tsx` also holds **`NAV_SCHOOLS`**, **`NAV_USER`**, and related defaults. School marks use **`logoDevUrl()`** from **`lib/logo-dev.ts`** (publishable token; optional **`VITE_LOGO_DEV_TOKEN`**).

| Concern | Pattern |
|--------|---------|
| **Product (One / Prism)** | **`ExxatProductLogo`** (`components/exxat-product-logo.tsx`) for the header control and **`ProductSwitcher`** — **not** logo.dev rasters unless product explicitly changes that. The logo is now **generated from a config**, not hand-built SVG paths — see **§3.4** to add a new product. |
| **School/program menu width** | **`DropdownMenuContent`** defaults to **intrinsic width** (**`min-w-52 w-max max-w-[min(24rem,calc(100vw-2rem))]`** via **`DROPDOWN_MENU_CONTENT_SURFACE_CLASS`** in **`@exxatdesignux/ui/lib/dropdown-menu-surface`**) — pure CSS, no **`ResizeObserver`**. The **school / program** switcher still uses an explicit wider surface (**`!w-max min-w-72 max-w-[min(100vw-2rem,28rem)]`**) so dense rows stay readable. |
| **School/program copy** | **Do not truncate** school or program names in the switcher; wrap (**`break-words`**, **`whitespace-normal`**, **`items-start`** on multi-line rows). The selected-school summary shows **school name + current program**. |
| **Team switcher trigger** | **`SidebarMenuButton` `size="lg"`** uses **`h-12`** + **`overflow-hidden`**, which **clips** a second line (program). When the sidebar is **expanded** or **mobile**, add **`h-auto min-h-12`** and **`overflow-x-clip overflow-y-visible`**. On **icon rail**, hide label rows with **`group-data-[collapsible=icon]:hidden`** (tooltip still exposes the full string). Icon mode defaults **`size-8` + `p-2`** (~16px inner) **clips** school logos — override **`!size-9`**, **`!p-0`**, **`overflow-visible`**. Omit header **chevrons** next to logos if they look like stray chrome. |
| **Motion / Animate UI** | [Animate UI](https://animate-ui.com/docs) — open **copy-first** animated components (Motion + Tailwind). This repo uses **`motion/react`** + **`lib/motion-ui.ts`** presets; pull more animations from their registry into `components/` when needed. |
| **Nav items with children** | See **§3.2** below for the full parent ↔ children pattern (collapsible vs popover, active-state rules, chevron + slide animation, reduced motion). |
| **Nav row labels** | **`SidebarNavLabel`** on every primary / secondary sidebar row; labels **wrap** (**`whitespace-normal`**, **`break-words`**, **`h-auto`**) — **MUST NOT** **`truncate`** nav copy. Icon rail hides labels; **`tooltip`** exposes the full string. See **`exxat-sidebar-nav-labels.mdc`**. |
| **Profile (mock)** | **`stockPortraitUrl()`** from **`lib/stock-portrait.ts`**; **`AvatarImage`** **`referrerPolicy="no-referrer"`** for external URLs. |

**Reference:** `components/app-sidebar.tsx`, `components/nav-user.tsx`, `components/product-switcher.tsx`.

### 3.2 Parent ↔ children nav (collapsible vs popover vs secondary panel)

A primary nav row that owns sub-routes has **three possible shapes** — pick exactly one per item:

| Shape | When to use | Where it lives |
|---|---|---|
| **A. Collapsible children** (e.g. Library → All / My / Favorites / Folders) | Small finite child list that benefits from inline browsing (≤ 40 items, no extra page chrome). | `NavLinkItem.children` rendered by **`CollapsibleNavItem`** in `app-sidebar.tsx`. |
| **B. Secondary panel** (separate nested rail) | Same nav row needs **scoped search / tree / metrics** alongside the hub content. | `NavLinkItem.secondaryPanel = "<id>"` + `PANELS[id]` — see companion skill `exxat-primary-nav-secondary-panel`. |
| **C. Both A + B on one row** (Library does this) | Most cases when a hub has a sub-list AND a rich rail. The sidebar still shows the collapsible children; clicking the parent route also opens the secondary panel via `useAutoPanel`. | Combine A + B; the active-state and animation rules in §3.2 still apply to the sidebar children. |

#### Active-state rules — **the single biggest mistake to avoid**

1. **Expanded sidebar (full rail):** parent stays **visually neutral** when a child is active — **never double-highlight**. `isCollapsibleParentMenuButtonActive` returns `false` if `anyChildActive` so the active child row carries `data-active` alone.
2. **Collapsed sidebar (icon rail):** the parent icon is the **only** affordance, so it lights up when **any child** route is active. Implementation: `iconRailActive = isAnyChildActive` is fed into `SidebarMenuButton.isActive` and selects `item.iconActive` (`fa-solid`) over `item.icon` (`fa-light`).
3. **Tooltip / aria copy** in icon mode names the parent (e.g. "Library — open subpages"); the **popover** content lists children with their own active state so users see which sub-route is selected.

```tsx
// Inside CollapsibleNavItem
const isAnyChildActive = item.children?.some(c => isCollapsibleChildActive(...))
const parentMenuButtonActive = isCollapsibleParentMenuButtonActive(pathname, item) // false when anyChildActive
const iconRailActive = isAnyChildActive
```

#### Chevron + content animation (shadcn / Radix collapsible)

The collapsible rotates a chevron and slides the children in/out, mirroring shadcn's `Accordion`/`Collapsible` motion. **Three pieces wired together:**

1. **`group/collapsible`** on the **`SidebarMenuItem`** that wraps the trigger — opts the chevron into `group-data-[state=open]/collapsible:rotate-90` (or whatever direction the icon needs). Without `group/collapsible` the chevron never rotates.
2. **`CollapsibleContent`** uses Radix's `--radix-collapsible-content-height` CSS var via the shared keyframes:
   ```tsx
   <CollapsibleContent className="overflow-hidden
     data-[state=open]:[animation:collapsible-down_200ms_ease-out]
     data-[state=closed]:[animation:collapsible-up_200ms_ease-out]
     motion-reduce:animate-none
     group-data-[collapsible=icon]:hidden">
     <SidebarMenuSub>...</SidebarMenuSub>
   </CollapsibleContent>
   ```
   `overflow-hidden` is **required** so the height clip is visible during the animation. `motion-reduce:animate-none` honours `prefers-reduced-motion` (WCAG 2.3.3).
3. **Keyframes in `app/globals.css`** (shared, reused by `Accordion` too):
   ```css
   @keyframes collapsible-down { from { height: 0 } to { height: var(--radix-collapsible-content-height) } }
   @keyframes collapsible-up   { from { height: var(--radix-collapsible-content-height) } to { height: 0 } }
   ```

#### Icon-rail popover (collapsed sidebar)

When `state === "collapsed"` (or `isMobile === false` on a tablet icon rail), `CollapsibleNavItem` renders a **`Popover`** anchored to the parent icon, listing children as full rows. **Do not** pass `tooltip={…}` to a `SidebarMenuButton` that is the **direct** child of `CollapsibleTrigger asChild` — the tooltip wrapper inserts an extra `Tooltip` root and breaks Radix `Slot` (`React.Children.only`). Compose `Tooltip > TooltipTrigger > CollapsibleTrigger > SidebarMenuButton` without the `tooltip` prop, or use the popover branch only.

#### Hydration

`CollapsibleNavItem` is an isolated component with its own controlled `open` state initialised in `useEffect`. **Do not** pass `defaultOpen` based on pathname at render time — server and client resolve it differently and Radix throws a hydration mismatch.

#### Cap

The data shape supports any number of children, but the collapsible variant is rendered only when `childCount <= 40`. Beyond that, model the children as a **secondary panel** (shape B) so the user gets search + scroll.

**Reference:** `components/app-sidebar.tsx` (`CollapsibleNavItem`, `isCollapsibleParentMenuButtonActive`, `isCollapsibleChildActive`), `app/globals.css` (`@keyframes collapsible-down/up`), `lib/mock/navigation.tsx` (`NavLinkItem.children`).

### 3.2.1 Nav flyout mode (≤320px / zoom ≥ 200%)

At **WCAG 1.4.10 reflow** (viewport width **≤ 320 CSS px**, browser zoom **≥ 200%**, or short viewport — `computeReflowViewport()` in `packages/ui/src/lib/reflow-viewport.ts`), the primary sidebar becomes an **overlay flyout** (`isNavFlyout` on **`SidebarProvider`** in `@exxatdesignux/ui/components/ui/sidebar`).

| Rule | Implementation |
|---|---|
| Don't block the page on load | Entering flyout mode **closes** the sidebar (not persisted) |
| Dismiss on leaf navigation | Call **`dismissNavFlyout()`** from **`useSidebar()`** when a nav link navigates to its destination |
| Keep flyout open for nested nav parents | **Do not** dismiss on rows with **`drillIn`** or **`secondaryPanel`** — user still picks a child |
| Keyboard exit | **Esc** closes the flyout when open |

**Reference:** `components/sidebar/app-sidebar.tsx` (`NavLinkItems`, `SidebarDrillInItems`), `components/library-secondary-nav.tsx`, **`exxat-sidebar-shell.mdc`**.

### 3.3 Secondary panel auto-collapse on high zoom

`SecondaryPanelProvider` (`components/secondary-panel.tsx`) reads **`useSidebarReflowZoom()`** (width **≤ 320px**, browser zoom **≥ 200%**, or very short viewport — same WCAG 1.4.10 signal the primary sidebar uses) and **auto-collapses the nested rail to its icon variant on entering reflow**. The user can re-expand once collapsed; the next zoom-out → zoom-in cycle re-collapses. `openPanel` also opens directly in compact mode when reflow is active so freshly-navigated panels don't briefly flash expanded.

Any future secondary-panel-like rail should reuse `useSidebarReflowZoom` rather than inventing a parallel zoom hook.

**Reference:** `components/secondary-panel.tsx` (`SecondaryPanelProvider`), `hooks/use-sidebar-reflow-zoom.ts`.

### 3.4 Product wordmark + brand registry

The product logo ("**Exxat** *One*" / "**Exxat** *Prism*") is **generated from a `ProductBrandConfig`** in `lib/product-brand.ts`, not from hand-built SVG paths. The suffix word renders as real **Ivy Presto** italic text (`var(--font-heading)`, Adobe Fonts kit `wuk5wqn` preloaded in `app/layout.tsx`); the circular mark is the same Exxat "E" geometry, recolored from the brand's gradient.

**To add a new product:**

```ts
// lib/my-product-brand.ts
import { defineProductBrand, registerProductBrand } from "@/lib/product-brand"

export const EXXAT_PULSE = defineProductBrand({
  id: "exxat-pulse",
  prefix: "Exxat",                          // optional, defaults to "Exxat"
  suffix: "Pulse",                          // rendered in Ivy Presto italic
  brandColor: "#00A8E8",                    // any CSS color — drives suffix text + mark fill
  markGradient: ["#0083C7", "#3FC6FF"],     // optional 2-stop linear gradient on the mark
  markShadow: "#006FAA",                    // optional inner shadow behind the "E" cut-out
})

registerProductBrand(EXXAT_PULSE)
```

Then render anywhere via either the **generic** primitives or the **Exxat** convenience wrappers:

```tsx
import { ProductWordmark, ProductMark, ProductLogo } from "@/components/product-wordmark"
import { ExxatProductLogo, ExxatProductMark } from "@/components/exxat-product-logo"

// Generic — works for any registered brand
<ProductLogo config={EXXAT_PULSE} className="h-7" variant="mutedSuffix" />
<ProductMark config={EXXAT_PULSE} className="size-7" />
<ProductWordmark config={EXXAT_PULSE} className="h-7" />

// Existing Exxat call-sites unchanged
<ExxatProductLogo product="exxat-one" variant="mutedSuffix" className="h-7" />
<ExxatProductMark product="exxat-prism" className="size-7" />
```

**Visual contract (so new brands look like real logos, not styled text):**

1. **Prefix** uses Inter `font-extrabold` (800) `tracking-tight` in deep slate (`#273441`) / soft grey on dark (`#A8B2BA`). Always.
2. **Suffix** — **official Exxat brand spec from Figma** — `var(--font-heading)` (IvyPresto Text), **upright `font-semibold` (600)** with `tracking-[-0.03em]` (Figma "letter spacing -3 %"), tinted with `brandColor`. **Not italic**, **not Bold/ExtraBold** — IvyPresto's Bodoni-lineage SemiBold already has the thick verticals that read as a logo, and pushing to 700/800 makes the letterforms visually heavier than the brand asset (`ExxatOne_WordmarkLogo_WithMinClearSpace.png`). Avoid `medium` (500) / `regular` (400) — those read as inline text, not as a wordmark.
3. **Size relationship** — the `ExxatProductLogo` outer span pins `text-base leading-none` (16 px inherited) so the wordmark's `text-[1.78em]` resolves to ~28 px font / ~20 px cap-height regardless of host surface (sidebar `text-sm`, dropdown `text-base`, etc.). The mark renders at **`h-full`** of the outer height — the original hand-built `viewBox="0 0 766 164"` already bakes breathing room around the circle artwork, so giving the mark the full outer height reproduces the brand asset's 1.56:1 mark-to-cap ratio (caps ≈ 20 px against a 32 px mark at `h-8`). Shrinking the mark (e.g. `h-[88%]`) makes it visually smaller than the wordmark span and inverts the intended hierarchy. Use **`h-8`** (32 px) as the default sidebar / dropdown / switcher height; `h-7` is too tight for the new wordmark scale and produces a sub-30 px mark.
4. **Cap-to-mark centring** — the wordmark adds `translate-y-[0.09em]` to compensate for the cap-midpoint vs em-box-midpoint offset (Inter / Ivy Presto put cap glyphs in the upper portion of the line box). Without this, `items-center` aligns the *spans* but not the *visible cap* and mark — the wordmark visually rides ~3 px above the mark. Keep the translate when forking.
5. **`variant="mutedSuffix"`** (sidebar / switcher) keeps the brand color in **light** mode and only tints to `--muted-foreground` in **dark** mode. Don't mute the suffix in light mode — it loses brand recognition.
6. **Mark** stays the canonical Exxat "E" geometry so existing pixel-aligned layouts (sidebar header avatar slot, switcher dropdown rows) keep working when you swap brands; only colors change.
7. **Host span** uses `overflow-visible` because the wordmark's `1.78em` line-box can overshoot the parent `h-X` by ~1 px — let it render, don't clip.
8. **Don't pass `object-*` classes** to the logo `className` — `ExxatProductLogo` is a `<span>`, not a replaced element, so `object-contain` / `object-left` are silently dropped. Use width / max-width constraints instead.
9. **`ProductMark` has no size default** — callers MUST set explicit dimensions (`size-7`, `h-full w-auto`, etc.). A `size-*` default would silently lose against a downstream `h-full / w-auto` whenever `tailwind-merge` failed to recognise the shorthand-to-pair equivalence, and the mark would render at the default size (28 px) instead of the parent height (32 px in h-8). `ExxatProductLogo` passes `h-full w-auto`; the icon-rail / collapsed-sidebar usages pass `size-7`. Keep the explicit size.

**Where to extend the registry:** brand configs live alongside `lib/product-brand.ts` for the two built-ins. Co-locate new product configs near their feature (e.g. `app/(app)/<product>/_lib/brand.ts`) and call `registerProductBrand` at module import time so `ProductSwitcher` / `getProductBrand(id)` resolve it without ordering issues.

**MUST NOT:** add new hand-traced SVG paths for an additional product. Author a `ProductBrandConfig` instead.

**Reference:** `lib/product-brand.ts`, `components/product-wordmark.tsx`, `components/exxat-product-logo.tsx`, `components/product-switcher.tsx`.

### 3.5 Appearance preview tiles (Theme / Contrast)

`components/settings-appearance-card.tsx` renders the Theme (Light / Dark / System) and Contrast (Normal / High / Windows / System) pickers using a shared **`ChromeIllustration`** SVG helper — a polished mini browser window (Mac-style traffic lights, sidebar with brand-tinted mark + 5 nav rows, header bar with search pill + avatar, KPI card + mini bar-chart card + list rows).

Two knobs to make new variants without forking the geometry:

- **`tokens: ChromeTokens`** — palette per labeled mode. Override individual fills via `{...CHROME_LIGHT, shellStroke: "..."}`. Don't reach for `var(--background)` — preview tiles must show their target mode regardless of the active theme so users can compare before committing.
- **`strokeBoost: number`** — multiplier applied to every border weight. `1.8` is the high-contrast value used by both **High** and **Windows** tiles.

For "System" variants, use the **`SplitSystemSvg`** helper. It renders `ChromeIllustration` twice in the **same** 96 × 56 viewBox, each clipped to a triangular half (top-left triangle = "light", bottom-right triangle = "dark") via SVG `<clipPath>` polygons. The result is **one window with a diagonal theme split** — the macOS / iOS "Auto" pattern — not two adjacent windows.

```tsx
<SplitSystemSvg
  light={{ tokens: CHROME_LIGHT, sidebar: split.light, sidebarMark: split.markLight }}
  dark={{ tokens: CHROME_DARK, sidebar: split.dark, sidebarMark: split.markDark }}
/>
```

**MUST NOT** invent ad-hoc rect-stacks for new appearance options, or render two side-by-side mini-windows for a single "System" tile — extend `ChromeIllustration` or compose `SplitSystemSvg`.

**Reference:** `components/settings-appearance-card.tsx` (`ChromeIllustration`, `SplitSystemSvg`, `CHROME_LIGHT`, `CHROME_DARK`, `SPLIT_SIDEBAR`).

---

## 4. Primary Hub Pages — Mandatory Pattern

Any **primary nav destination** that shows a list of records **must** use this composition (same as Placements / Team):

```
ListPageTemplate  (supportedViewTypes = FULL_HUB_SUPPORTED_VIEWS — seven views)
  ├── PageHeader (title, subtitle with count, primary CTA, ⋯ more menu)
  ├── KeyMetrics (flat variant, single row)
  └── renderContent()
        └── HubTable + useTableState + TablePropertiesDrawer + renderers per view
```

**Add view parity (binding):** `.cursor/rules/exxat-hub-supported-views.mdc`, `apps/web/docs/hub-supported-views-pattern.md`. **MUST NOT** use `supportedViewTypes={["table"]}` or four-view-only allowlists without a documented exception. List view **MUST** use **`ListPageBoardCard`** (`library-table.tsx`).

**View tabs overflow:** The views toolbar is wrapped in **`HorizontalScrollRegion`** with **`controlsLayout="group-end"`** (segmented `[← | →]` after the tab bar). Record **`TabsList`** uses **`TabsListScrollRegion`**. SiteHeader breadcrumbs use the same primitive with **`alignEnd`**. **Do not** hand-build flanking chevrons — **`HorizontalScrollControls`** / **`useHorizontalScrollAffordances`** from `@exxatdesignux/ui/components/ui/horizontal-scroll-controls`. **`docs/horizontal-scroll-pattern.md`**, **`exxat-horizontal-scroll.mdc`**.

**View tab persistence:** Pass **`persistKey`** (or **`productPersistKey(product, hubKey)`**) on **`ListPageTemplate`** for uncontrolled tabs. **Do not** pass **`tabs` / `onTabsChange`** and expect **`persistKey`** to restore — controlled mode disables tab persistence. Reference: **`tokens-themes-client.tsx`**.

**Reference implementations:**
- `components/library-client.tsx` + `components/library-table.tsx` — **canonical seven-view hub** (All questions)
- `components/columns-showcase.tsx` — custom table via **`LibraryTable`** + same seven views
- `components/tokens-themes-client.tsx` + `components/tokens-hub-auxiliary-views.tsx`
- `components/team-client.tsx` + `components/team-table.tsx` — entity hub pattern
- `components/library-client.tsx` + `components/library-table.tsx` — Question bank (canonical full hub)

**Files to create for a new hub page `Foo`:**
| File | Purpose |
|------|---------|
| `lib/mock/foo.ts` | Mock data + TypeScript interface (12+ rows) |
| `lib/mock/foo-kpi.ts` | `fooKpiMetrics()` + `fooKpiInsight()` |
| `components/foo-page-header.tsx` | `PageHeader` + primary CTA + ⋯ menu |
| `components/foo-table.tsx` | `DataTable` + `useTableState` + `TablePropertiesDrawer` |
| `components/foo-client.tsx` | `ListPageTemplate` orchestrator |
| `app/(app)/foo/page.tsx` | Thin server component |

**Do not** ship a **nav-linked hub** as an **empty page** or a single “replace this later” paragraph. If the route appears in **`lib/mock/navigation.tsx`**, implement the full hub (mock rows, **`ListPageTemplate`**, connected views per **`apps/web/AGENTS.md` §4.1**) unless the product explicitly defines a non-data shell.

### Page vs drawer (actions)

- **Drawer / sheet** — Use when the user needs **the current page behind them** *and* a **quick view**, **quick actions**, or a **short step** (e.g. properties, export, glance at a row).
- **Dialog** — **Blocking** confirm/alert/short choice — **`docs/drawer-vs-dialog-pattern.md`**, **`.cursor/rules/exxat-drawer-vs-dialog.mdc`**.
- **New page** — Use **otherwise**: **primary**, **long-form**, **multi-step**, or flows that need their **own URL** without the hub visible.

Align with **`apps/web/AGENTS.md` §6.4**, **`docs/data-views-pattern.md`**, **`docs/drawer-vs-dialog-pattern.md`**, **`.cursor/rules/exxat-page-vs-drawer.mdc`**, **`.cursor/rules/exxat-drawer-vs-dialog.mdc`**.

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

**Board (kanban) cards:** Use **`ListPageBoardCard`** and related parts from **`components/data-views/list-page-board-card.tsx`**; **`BoardCardTwoLineBlock`** / **`BoardCardIconRow`** from **`board-card-primitives.tsx`**. **List hub** status (Team, Compliance, Library, …): maps in **`lib/list-status-badges.ts`**; render with **`ListHubStatusBadge`** (**`surface="table"`** in table/list, **`surface="board"`** on cards); semantic tints **`LIST_HUB_STATUS_TINT_*`** for new domains; no **`uppercase`**. **Placements** uses **`StatusBadge`** in **`placements-table-cells.tsx`** (wrapper over **`ListHubStatusBadge`** + **`PLACEMENT_STATUS_*`**). **Full rules:** **`apps/web/AGENTS.md` §4.4**, **`.cursor/rules/exxat-board-cards.mdc`**, **`.cursor/skills/exxat-board-cards/SKILL.md`**.

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

**Data point → cell:** Before authoring `cell:`, map each field with **`docs/table-column-cells-pattern.md`** — skill **`exxat-table-column-cells`**, rule **`exxat-table-column-cells.mdc`**. Person columns → **`AvatarInitials` + name + email** (not plain text); status → **`ListHubStatusBadge`**; progress / money / rating → named imports from **`@/components/data-views`**.

**Pin conventions:**
- `select` column: `defaultPin: "left"`, `lockPin: true`
- `actions` column: `defaultPin: "right"`, `lockPin: true`

### 5.1 Data table and view-toolbar menus

**`DropdownMenuContent`** (from **`@/components/ui/dropdown-menu`**, backed by **`@exxatdesignux/ui`**) applies a **default surface** so **view settings**, **Add view**, **row ⋯**, **column ⋯**, and **filter field** menus get **`min-w-52`**, grow with **`w-max`**, and cap at **`max-w-[min(24rem,calc(100vw-2rem))]`** — all **static Tailwind** (no **`ResizeObserver`** / layout measurement).

- **Override** only when the UX needs a fixed rail (e.g. **`className="w-20"`** on the pagination page-size menu, **`w-(--radix-dropdown-menu-trigger-width) min-w-60`** on **`NavUser`**, **`!w-max min-w-72 …`** on the school/program switcher).
- **Reuse** **`DROPDOWN_MENU_CONTENT_SURFACE_CLASS`** if you build a custom menu primitive that does not wrap **`DropdownMenuContent`**.

### 5.2 KPI trends (`KeyMetrics`, `*-kpi.ts`)

**`MetricItem.trend`** must match the **signed change** (arrow direction = truth). **`trendPolarity`** (`higher_is_better` default, **`lower_is_better`**, **`informational`**) controls **tints** and **`aria-label`** — e.g. **low PBI / review flags** rising → `trend: "up"` + **`lower_is_better`** → unfavourable (red), not green. **Doc:** **`docs/kpi-trend-pattern.md`** · **Rule:** **`.cursor/rules/exxat-kpi-trends.mdc`** · **Skill:** **`.cursor/skills/exxat-kpi-trends/SKILL.md`**.

### 5.3 KPI count (max four)

**`ListPageTemplate`** metrics and **Data tab** key-metrics cards: **≤ 4** `MetricItem` — **`docs/kpi-strip-max-four-pattern.md`**, **`lib/dashboard-layout-merge.ts`**, **`.cursor/rules/exxat-kpi-max-four.mdc`**, **`.cursor/skills/exxat-kpi-max-four/SKILL.md`**.

### 5.4 Cards vs table rows

Dense comparable hub → **`DataTable`**. Boards / folders / visual browse → **`ListPageBoardCard`** + **`ListPageViewFrame`**. **Doc:** **`docs/card-vs-rows-pattern.md`** · **Rule:** **`.cursor/rules/exxat-card-vs-list-rows.mdc`**.

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
        <DropdownMenuContent align="end">
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

### 6.1 Collaboration & access (shared hubs)

When a hub is **shared**, use **`PageHeader` `variant="collaboration"`**: **empty roster** → outline **Add collaborator**; **non-empty** → face rail (faces / **`+N`** open the invite sheet). **Invite people** also lives under the entity header **⋯ More** and opens **`InviteCollaboratorsDrawer`** via **`CollaborationAccessFlow`** when possible. Library access (Owner / Editor / Commenter / Viewer) comes from **`lib/collaborator-access.ts`**; directory tags (Faculty, Program coordinator, Director) use **`PageHeaderCollaborator.roles`**.

**Library library — folder URL scope:** When **`?scope=folder&folderId=`** applies, **⋯ More** must also offer **Customize folder** (**`LibraryPageHeader`** **`onCustomizeFolder`**) and the **`LibraryNewFolderSheet`** must be mounted on **`LibraryClient`** so it works on every **`ListPageTemplate`** view tab. **`.cursor/rules/exxat-library-hub-header.mdc`** · **`docs/library-hub-header-pattern.md`** (app: **`apps/web/docs/...`**).

**Handbook:** `apps/web/AGENTS.md` §4.7 · **Doc:** `docs/collaboration-access-pattern.md` · **Skill:** `.cursor/skills/exxat-collaboration-access/SKILL.md` · **Reference:** Library header + client.

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

Before adding any component: search `components/ui/` first. Add a prop/variant to an existing component rather than creating a parallel one. **If nothing fits** and you need a **new shared primitive or large bespoke widget**, **ask the user** before new files — **`.cursor/rules/exxat-reuse-before-custom.mdc`** (unless the task already approved greenfield).

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
| Add view (1..n) | **1..9** (plain digit; `dataListViewAddShortcut`) |
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

**Details:** `apps/web/docs/command-menu-pattern.md`, **`apps/web/AGENTS.md` §7.1** (or `./` when the app folder is the workspace root).

---

## 12. Accessibility — WCAG 2.1 AA (Non-Negotiable)

Full checklist in `references/accessibility.md`. Summary of the most-violated rules:

### Structure
- One `<main id="main-content" tabIndex={-1}>` per page
- One `<h1>` per page (via `PageHeader`) — `SiteHeader` title is NOT an h1
- `DialogTitle` / `SheetTitle` always present (use `className="sr-only"` if visually hidden)

### ARIA roles
- `role="tablist"` → only `role="tab"` children. **Never** put buttons, menus, or other controls inside `tablist`
- View switchers with extra controls (tabs + remove + settings): use `role="toolbar"` + `aria-label`

### Icons that communicate information — always have a text alternative

This rule covers **every icon that carries meaning**, not only icon-only buttons. FA glyphs, inline SVGs, avatar placeholders, trend arrows, status dots, chart-legend squares, calendar/clock/pin icons in cells — if the icon **tells the user something**, that something MUST be reachable by screen readers AND discoverable to sighted users who don't recognise the glyph. SC 1.1.1, 3.3.2, 2.4.6.

**Case A — Decorative icon next to text that already names it** → icon is `aria-hidden`, no `aria-label`, no tooltip. The text is the alt.

```tsx
<span className="flex items-center gap-1.5">
  <i className="fa-light fa-calendar-days" aria-hidden />
  <span>12/14/2025 – 12/20/2025</span>
</span>
```

**Case B — Informational icon standing alone** (calendar = "date range", clock = "updated at", pin = "site", cap = "student", trend arrow, status dot, icon-only chart legend) → MUST pair `role="img"` + `aria-label` with a visible `Tooltip`. Wrapper MUST be keyboard-focusable (`tabIndex={0}`).

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <span role="img" aria-label="Placement date range" tabIndex={0}
      className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <i className="fa-light fa-calendar-days" aria-hidden />
    </span>
  </TooltipTrigger>
  <TooltipContent side="top">Placement date range</TooltipContent>
</Tooltip>
```

**Case C — Interactive icon-only button / link** (close `×`, chevron, overflow `⋯`, sort, filter-dismiss, copy, Ask Leo toggle, row actions) → MUST pair `aria-label` on the `<button>` with a wrapping `Tooltip`. Inner `<i>` / `<svg>` is `aria-hidden`. Target ≥ 24×24.

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <button type="button" aria-label="Close insight" className="size-7 …">
      <i className="fa-solid fa-xmark" aria-hidden />
    </button>
  </TooltipTrigger>
  <TooltipContent side="top" className="flex items-center gap-1.5">
    <span>Close</span>
    <Kbd>Esc</Kbd>
  </TooltipContent>
</Tooltip>
```

**Decision tree:** adjacent text label? → A. Else interactive? → C. Else → B. When in doubt: add the accessible name + tooltip. Narrow exception for all cases: a chevron inside a labelled composite (`Select`, `Combobox`) where the parent already carries the name.

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
- [ ] **Shell sidebar:** Product header uses **`ExxatProductLogo`**; school **`logoDevUrl`** + **`lib/logo-dev`**; team switcher menu **`!w-max`** (not trigger-width-only); expanded switcher **`h-auto min-h-12`** so school + program lines are not clipped; nav labels use **`SidebarNavLabel`** (wrap, no **`truncate`**) — **`exxat-sidebar-nav-labels.mdc`**; no **`CollapsibleTrigger` → `SidebarMenuButton` with `tooltip` prop**; child nav uses **popover** on icon rail per **§3.1**
- [ ] Hub pages: `ListPageTemplate` + `DataTable` + `useTableState` + `TablePropertiesDrawer`
- [ ] Board view: `ListPageBoardCard` shell + `ListHubStatusBadge` + `list-status-badges` when applicable (`apps/web/AGENTS.md` §4.4)
- [ ] New primary hubs: not placeholder-only — full template + data + views (`apps/web/AGENTS.md` §4.1)
- [ ] **§6.4:** Parent **context** + quick view/actions → drawer/sheet; primary or long flows → **new page** (`AGENTS.md`, `docs/data-views-pattern.md`)
- [ ] No raw `<table>` or `ui/table` for product data lists
- [ ] No double horizontal padding around `DataTable`
- [ ] Primary CTA: filled `Button size="lg"`; ⋯ more menu with Export + toggle metrics
- [ ] Breadcrumbs OR back link — never both
- [ ] Charts: wrapped in `ChartCard` with correct `variant`; no raw `Card` + Recharts combos; color tokens only
- [ ] All dates: `MM/DD/YYYY` / `MM/DD/YYYY hh:mm AM/PM EST`
- [ ] All tooltips via `<Tip>` — no `title` attribute
- [ ] All icons: `aria-hidden="true"`; Ask Leo: `fa-duotone fa-solid fa-star-christmas text-brand`
- [ ] **Every icon that communicates info has a text alternative** — Case A adjacent label (preferred), Case B `role="img"` + `aria-label` + `Tooltip` (calendar-for-date, status dot, trend arrow, icon-only legend), Case C `aria-label` + `Tooltip` on icon-only buttons; target ≥ 24×24 px. See §12 *Icons that communicate information*.
- [ ] **`Kbd` inside a `Button` uses `variant="bare"`** (glue chords into one bare kbd); **`Kbd` inside `TooltipContent` uses the default tile** — see §11 Keyboard shortcuts
- [ ] `DialogTitle`/`SheetTitle` present on every overlay
- [ ] `role="tablist"` contains only tab-role children
- [ ] No new shadcn components, no hardcoded colors, no duplicate component abstractions

---

## Reference Files

- `references/accessibility.md` — Full WCAG 2.1 AA checklist (interactive elements, keyboard, forms, semantics, contrast, dynamic content, component-specific rules)
- `references/data-table-pattern.md` — Complete data table implementation guide with full column/filter/drawer wiring

Read the relevant reference file when implementing the corresponding feature.
