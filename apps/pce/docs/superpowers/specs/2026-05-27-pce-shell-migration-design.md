# PCE Admin Shell Migration — Level 2 Port
**Date:** 2026-05-27  
**Scope:** Admin app (`apps/pce/admin/`) — shell only. Student app out of scope.  
**Package:** `@exxatdesignux/ui@0.6.14` (already installed). Reference: `template-vite/`.

---

## 1. What changes

Three touch-points. Everything else (pages, business logic, mock data, wizard components) stays untouched.

```
app/(app)/layout.tsx          ← replace 5-provider stack with full 11-provider stack
components/app-sidebar.tsx    ← rewrite to mirror template-vite/components/sidebar/app-sidebar.tsx
components/command-palette.tsx ← replaced by new command-menu.tsx + context
```

Plus: ~16 new files copied/adapted from `template-vite/` (sidebar components, contexts, lib).

---

## 2. Provider stack

Verbatim from `template-vite/src/App.tsx`. Order is load-bearing — DS components are
tightly coupled (KeyMetrics ↔ AskLeo, SecondaryPanel ↔ Sidebar).

```
app/(app)/layout.tsx

ThemeProvider (next-themes, attribute="class", enableSystem)
  ProductProvider          ← registers "exxat-prism" as active product
    ProductRouteSync       ← sync product ↔ route (void component)
    ProductSwitchOverlay   ← modal overlay during product switch (void component)
    ThemeColorSync         ← pushes brand CSS var on product change (void component)
    TooltipProvider (delayDuration=300)
      DashboardViewProvider
        ChartVariantProvider
          AskLeoProvider
            KeyMetricsAskLeoBridge
              SystemBannerProvider
                CommandMenuProvider (value=commandMenuConfig)
                  SidebarShell (defaultOpen=readSidebarCookie())
                    CommandMenu
                    SystemBannerSlot
                    <div className="flex min-h-0 w-full flex-1 ...">
                      SecondaryPanelProvider
                        AppSidebar variant="inset"
                        SecondaryPanel
                        {children}          ← SidebarInset is inside AppSidebar
                      AskLeoSidebar
```

**What this replaces:**
```
Before (5 providers):
  PceProvider → TooltipProvider → CommandPaletteProvider → SidebarProvider → SidebarInset

After (11 providers):
  full template-vite stack above
```

`PceProvider` stays — it provides the PCE business domain state (user, role, surveys). It moves to
`app/(app)/layout.tsx` wrapping the `ProductProvider` subtree, so PCE domain state remains accessible
to all child components.

---

## 3. Sidebar anatomy

```
AppSidebar (variant="inset")
├── SidebarHeader
│   ├── ExxatProductLogo (ProductSwitcher dropdown — "exxat-prism" only)
│   └── TeamSwitcher (school > program hierarchy — PCE schools mock data)
│
├── SidebarContent
│   ├── Quick actions group (no label)
│   │   ├── Ask Leo    (opensAskLeo: true — ⌘⌥K badge)
│   │   └── Search     (opensCommandMenu: true — ⌘K badge)
│   │
│   └── Primary nav group ("Navigation" label)
│       Admin role:   Surveys · Templates · Moderation · Analytics · Setup
│       Faculty role: My Surveys · Results
│       (role read from usePce().user.role)
│
├── SidebarFooter
│   ├── Settings (link to /settings)
│   ├── Help     (link to /help)
│   └── NavUser  (user avatar + dropdown → role toggle + Appearance sheet + Log out)
```

---

## 4. Files to create

### 4a. Verbatim copies from template-vite (adapt imports only)

Each file replaces `import { X } from "@/lib/next-compat"` with native Next.js; all
other imports stay as-is but switch `@/` prefix to `@/` (unchanged — already compatible).

| Source (`template-vite/`) | Destination (`admin/`) | Adaptation |
|---|---|---|
| `components/sidebar/sidebar-shell.tsx` | `components/sidebar/sidebar-shell.tsx` | `@/lib/next-compat` → real Next.js |
| `components/sidebar/secondary-panel.tsx` | `components/sidebar/secondary-panel.tsx` | none |
| `components/sidebar/nav-main.tsx` | `components/sidebar/nav-main.tsx` | `@/lib/next-compat` → real Next.js |
| `components/sidebar/nav-secondary.tsx` | `components/sidebar/nav-secondary.tsx` | `@/lib/next-compat` → real Next.js |
| `components/sidebar/nav-user.tsx` | `components/sidebar/nav-user.tsx` | `@/lib/next-compat` → real Next.js |
| `components/ask-leo-sidebar.tsx` | `components/ask-leo-sidebar.tsx` | none |
| `components/command-menu.tsx` | `components/command-menu.tsx` | none |
| `components/theme-color-sync.tsx` | `components/theme-color-sync.tsx` | none |
| `components/theme-provider.tsx` | `components/theme-provider.tsx` | none |
| `components/product-switch-overlay.tsx` | `components/product-switch-overlay.tsx` | none |
| `components/key-metrics-ask-leo-bridge.tsx` | `components/key-metrics-ask-leo-bridge.tsx` | replace local stub |
| `components/system-banner-slot.tsx` | `components/system-banner-slot.tsx` | none |
| `components/exxat-product-logo.tsx` | `components/exxat-product-logo.tsx` | none |
| `contexts/dashboard-view-context.tsx` | `contexts/dashboard-view-context.tsx` | none |
| `contexts/chart-variant-context.tsx` | `contexts/chart-variant-context.tsx` | none |
| `contexts/system-banner-context.tsx` | `contexts/system-banner-context.tsx` | none |
| `contexts/command-menu-context.tsx` | `contexts/command-menu-context.tsx` | none |
| `lib/sidebar-state-cookie.ts` | `lib/sidebar-state-cookie.ts` | none (Next.js reads same `document.cookie`) |
| `lib/product-brand.ts` | `lib/product-brand.ts` | none |
| `lib/product-ref.ts` | `lib/product-ref.ts` | none |
| `lib/product-routing.ts` | `lib/product-routing.ts` | none |
| `lib/command-menu-config.ts` | `lib/command-menu-config.ts` | none (app-level utility, not a package export) |
| `stores/app-store.ts` | `stores/app-store.ts` | none (re-exports from `@exxatdesignux/ui/product-framework`) |
| `contexts/product-context.tsx` | `contexts/product-context.tsx` | none (re-exports from `@exxatdesignux/ui/components/shell`) |
| `contexts/product-route-sync.tsx` | `contexts/product-route-sync.tsx` | none (re-exports from `@exxatdesignux/ui/components/shell`) |

### 4b. Next-compat shim (inverted for Next.js)

`lib/next-compat.tsx` — PCE version exports from real Next.js packages so all template-vite
components that import from `@/lib/next-compat` resolve correctly:

```ts
// lib/next-compat.tsx
export { default as Link } from "next/link"
export { usePathname, useRouter, useSearchParams } from "next/navigation"
export { redirect } from "next/navigation"
export type { LinkProps } from "next/link"
```

### 4c. PCE navigation (replaces template-vite `lib/mock/navigation.tsx`)

`lib/pce-nav.tsx` — PCE-specific nav items. Exports the same shape the template expects:

```ts
// Interfaces (re-exported from template-vite types or defined inline)
export type NavLinkItem = { key, title, url, icon, iconActive?, children?, badge?, ... }
export type NavSecondaryItem = { key, title, url, icon, opensCommandMenu?, opensAskLeo? }

// School/program mock data (kept from existing pce-mock-data.ts)
export const NAV_SCHOOLS: NavSchool[]  // 3 schools with programs
export const NAV_SCHOOL_DEFAULT
export const NAV_PROGRAM_DEFAULT

// Quick actions (identical to template-vite)
export const NAV_QUICK_ACTIONS: NavSecondaryItem[]  // Ask Leo, Search

// Primary nav — product-keyed (only "exxat-prism" matters for PCE)
export const NAV_BY_PRODUCT: Record<string, NavLinkItem[]> = {
  "exxat-prism": [
    Surveys  (href=/surveys,    icon=fa-paper-plane,   badge=pendingCount when >0)
    Templates (href=/templates,  icon=fa-rectangle-list)
    Moderation (href=/moderation, icon=fa-shield-check)
    Analytics  (href=/analytics,  icon=fa-chart-mixed)
    Setup      (href=/admin,       icon=fa-gear-complex, children=[...11 entity routes])
  ]
}

// Faculty nav (separate key — role switch swaps the entire primary array)
export const NAV_BY_PRODUCT_FACULTY: NavLinkItem[] = [
  My Surveys (href=/my-surveys, icon=fa-paper-plane)
  Results    (href=/my-surveys?filter=released, icon=fa-chart-bar)
]

// Secondary (footer) nav
export const NAV_SECONDARY: NavSecondaryItem[]  // Settings, Help

// User mock (will be replaced by real auth later)
export const NAV_USER = { name, email, avatar }
```

### 4d. PCE command menu data (replaces `lib/command-menu-search-data.ts`)

`lib/pce-command-menu.ts` — ports the existing 4 groups from `command-palette.tsx`.
`buildCommandMenuConfig` lives in the app-local `lib/command-menu-config.ts` (§4a — copied from template-vite, not a package export):

```ts
import type { CommandMenuGroup } from "@/lib/command-menu-config"
import { MOCK_SURVEYS, MOCK_TEMPLATES } from "@/lib/pce-mock-data"

export const PCE_COMMAND_MENU_DATA_GROUPS: CommandMenuGroup[] = [
  { id: "surveys",   heading: "Surveys",   searchOnly: true, items: MOCK_SURVEYS.map(...) },
  { id: "templates", heading: "Templates", searchOnly: true, items: MOCK_TEMPLATES.map(...) },
  { id: "admin",     heading: "Admin",     items: [...11 entity routes] },
  { id: "pages",     heading: "Pages",     items: [...top-level routes] },
]
```

`buildCommandMenuConfig({ dataGroups: PCE_COMMAND_MENU_DATA_GROUPS })` is called in `app/(app)/layout.tsx` (same pattern as `App.tsx` in template-vite).

### 4e. Rewritten AppSidebar

`components/app-sidebar.tsx` — full rewrite mirroring `template-vite/components/sidebar/app-sidebar.tsx`.
Role-split nav: reads `usePce().user.role` and passes either `NAV_BY_PRODUCT["exxat-prism"]` or
`NAV_BY_PRODUCT_FACULTY` to `NavMain`. Extends `NavUser` with PCE-specific role toggle dropdown item.

---

## 5. Files deleted / replaced

| File | Action |
|---|---|
| `components/command-palette.tsx` | Deleted — replaced by `components/command-menu.tsx` + context |
| Existing `components/key-metrics/` Ask Leo stub | `useAskLeo` / `AskLeoShortcutKbds` replaced by real DS implementation from `key-metrics-ask-leo-bridge.tsx` |

`components/app-sidebar.tsx` is rewritten in-place (not a new file).  
`app/(app)/layout.tsx` is rewritten in-place.

---

## 6. Router adaptation

All template-vite components use `import { Link, usePathname, ... } from "@/lib/next-compat"`.
PCE's `lib/next-compat.tsx` (§4b) re-exports the real Next.js hooks — no file-by-file edits needed.
The only explicit router change: `App.tsx` uses `<Outlet />` from react-router; PCE uses `{children}` — already correct in the layout.

---

## 7. What does NOT change

- All 24 page files (surveys, templates, admin entities, wizards, etc.)
- `lib/pce-mock-data.ts` (survey/template data)
- `components/pce/` directory (wizard steps, distribute wizard, pce-state, survey-mode-toggle)
- `components/data-table/` (PCE-extended DataTable — stays vendored)
- `components/key-metrics/` (PCE-extended KeyMetrics — stays vendored, but Ask Leo stub replaced)
- `components/settings-appearance-card.tsx`

---

## 8. Open questions (resolved)

| Question | Answer |
|---|---|
| Role toggle — where does it live? | PCE-specific: `NavUser` extension in `app-sidebar.tsx`, reading from `usePce()` |
| Ask Leo — real or stub? | Real `AskLeoProvider` + `AskLeoSidebar` from DS (user confirmed) |
| Product — which one? | `"exxat-prism"` — single product, no switcher needed but `ProductProvider` still required |
| TeamSwitcher — school hierarchy? | Yes — school > program. Mock data ported from `pce-mock-data.ts` |
| Cookie reading for sidebar default state | `lib/sidebar-state-cookie.ts` verbatim from template — reads `document.cookie` (same API in Next.js client components) |
