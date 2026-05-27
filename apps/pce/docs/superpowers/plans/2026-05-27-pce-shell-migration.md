# PCE Admin Shell Migration — Level 2 Port

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port PCE admin shell to the `@exxatdesignux/ui` template-vite provider stack, replacing the current 5-provider layout with the full 11-provider shell (ProductProvider → AskLeoProvider → SidebarShell) and rewriting AppSidebar + CommandMenu to follow DS patterns exactly.

**Architecture:** Create ~40 new files (shims, barrel files, context files, sidebar components) plus rewrite `app/(app)/layout.tsx`, `components/app-sidebar.tsx`, and delete `components/command-palette.tsx`. All new files mirror `template-vite/` exactly — each `@/` import resolves through thin shim layers.

**Tech Stack:** `@exxatdesignux/ui@0.6.14` · Next.js 15 App Router · `motion/react` · `next-themes`

---

## File Map

```
lib/
  next-compat.tsx          ← NEW: re-exports real next/link + next/navigation (inverted shim)
  utils.ts                 ← NEW: shim → @exxatdesignux/ui/lib/utils
  motion-ui.ts             ← NEW: verbatim copy from template-vite
  raf-throttle.ts          ← NEW: shim → @exxatdesignux/ui/lib/raf-throttle
  sidebar-state-cookie.ts  ← NEW: verbatim copy from template-vite
  product-brand.ts         ← NEW: shim → @exxatdesignux/ui/product-framework
  product-ref.ts           ← NEW: shim → @exxatdesignux/ui/product-framework
  product-routing.ts       ← NEW: shim → @exxatdesignux/ui/product-framework
  command-menu-config.ts   ← NEW: verbatim copy from template-vite
  pce-nav.tsx              ← NEW: PCE-specific nav items
  pce-command-menu.ts      ← NEW: PCE command menu data groups

stores/
  app-store.ts             ← NEW: shim → @exxatdesignux/ui/product-framework

contexts/
  product-context.tsx      ← NEW: shim → @exxatdesignux/ui/components/shell
  product-route-sync.tsx   ← NEW: shim → @exxatdesignux/ui/components/shell
  dashboard-view-context.tsx  ← NEW: verbatim copy from template-vite
  chart-variant-context.tsx   ← NEW: verbatim copy from template-vite
  system-banner-context.tsx   ← NEW: verbatim copy from template-vite
  command-menu-context.tsx    ← NEW: verbatim copy from template-vite

hooks/
  use-app-theme.ts          ← NEW: shim → @exxatdesignux/ui/hooks/use-app-theme
  use-mod-key-label.ts      ← NEW: shim → @exxatdesignux/ui/hooks/use-mod-key-label
  use-location-hash.ts      ← NEW: verbatim copy from template-vite
  use-sidebar-reflow-zoom.ts ← NEW: verbatim copy from template-vite

components/ui/              ← NEW directory: barrel files routing to DS package
  sidebar.ts, avatar.ts, badge.ts, button.ts, kbd.ts, tooltip.ts,
  dropdown-menu.ts, collapsible.ts, separator.ts, status-badge.ts,
  popover.ts, command.ts, dialog.ts, banner.ts, tip.ts, dot-pattern.ts
  ai-thinking-surface.tsx   ← NEW: verbatim copy (not in DS dist)
  leo-icon.tsx              ← NEW: verbatim copy (not in DS dist)

components/sidebar/         ← NEW directory
  sidebar-shell.tsx         ← NEW: verbatim copy from template-vite
  secondary-panel.tsx       ← NEW: simplified PCE version (no Library panels)
  nav-main.tsx              ← NEW: verbatim copy from template-vite
  nav-secondary.tsx         ← NEW: verbatim copy from template-vite
  nav-user.tsx              ← NEW: verbatim copy from template-vite
  index.ts                  ← NEW: barrel re-exports

components/
  app-sidebar.tsx           ← REWRITE: PCE nav + template-vite pattern
  command-menu.tsx          ← NEW: verbatim copy from template-vite (replaces command-palette.tsx)
  ask-leo-sidebar.tsx       ← NEW: verbatim copy from template-vite
  theme-provider.tsx        ← NEW: verbatim copy from template-vite
  theme-color-sync.tsx      ← NEW: verbatim copy from template-vite
  product-switch-overlay.tsx ← NEW: verbatim copy from template-vite
  key-metrics-ask-leo-bridge.tsx ← REPLACE: existing stub → real bridge from template-vite
  system-banner-slot.tsx    ← NEW: verbatim copy from template-vite
  exxat-product-logo.tsx    ← NEW: verbatim copy from template-vite
  command-palette.tsx       ← DELETE: replaced by command-menu.tsx

app/(app)/
  layout.tsx                ← REWRITE: 11-provider stack
```

---

## Task 1: Foundation lib shims

**Files:**
- Create: `admin/lib/next-compat.tsx`
- Create: `admin/lib/utils.ts`
- Create: `admin/lib/motion-ui.ts`
- Create: `admin/lib/raf-throttle.ts`

- [ ] **Step 1.1: Create lib/next-compat.tsx**

This is the key adapter. Template-vite components import `Link`, `usePathname`, `useRouter`, `useSearchParams` from `@/lib/next-compat`. In PCE (Next.js), these come directly from the Next.js packages:

```tsx
// admin/lib/next-compat.tsx
export { default as Link } from "next/link"
export { usePathname, useRouter, useSearchParams, redirect } from "next/navigation"
export type { LinkProps } from "next/link"
```

- [ ] **Step 1.2: Create lib/utils.ts**

```ts
// admin/lib/utils.ts
export { cn } from "@exxatdesignux/ui/lib/utils"
```

- [ ] **Step 1.3: Create lib/motion-ui.ts**

```ts
// admin/lib/motion-ui.ts
export const motionEaseOut = [0.22, 1, 0.36, 1] as const

export const motionHeaderEnter = {
  duration: 0.22,
  ease: motionEaseOut,
} as const

export const motionSheetMs = 300
```

- [ ] **Step 1.4: Create lib/raf-throttle.ts**

```ts
// admin/lib/raf-throttle.ts
export { rafThrottle } from "@exxatdesignux/ui/lib/raf-throttle"
```

- [ ] **Step 1.5: Commit**

```bash
git add admin/lib/next-compat.tsx admin/lib/utils.ts admin/lib/motion-ui.ts admin/lib/raf-throttle.ts
git commit -m "feat(pce-shell): add foundation lib shims for template-vite pattern"
```

---

## Task 2: Store + context shims

**Files:**
- Create: `admin/stores/app-store.ts`
- Create: `admin/contexts/product-context.tsx`
- Create: `admin/contexts/product-route-sync.tsx`

- [ ] **Step 2.1: Create stores/app-store.ts**

```ts
// admin/stores/app-store.ts
export * from "@exxatdesignux/ui/product-framework"
```

- [ ] **Step 2.2: Create contexts/product-context.tsx**

```tsx
// admin/contexts/product-context.tsx
export {
  ProductProvider,
  syncActiveProductThemeFromStore,
  useProduct,
  type Product,
} from "@exxatdesignux/ui/components/shell"
```

- [ ] **Step 2.3: Create contexts/product-route-sync.tsx**

```tsx
// admin/contexts/product-route-sync.tsx
export {
  ProductRouteSync,
  useProductDashboardHref,
  useProductSwitch,
} from "@exxatdesignux/ui/components/shell"
```

- [ ] **Step 2.4: Commit**

```bash
git add admin/stores/app-store.ts admin/contexts/product-context.tsx admin/contexts/product-route-sync.tsx
git commit -m "feat(pce-shell): add store and product context shims"
```

---

## Task 3: components/ui barrel files

**Files:** Create 16 barrel files under `admin/components/ui/`

Each file is a single `export *` to the corresponding DS subpath export.

- [ ] **Step 3.1: Create all barrel files**

Run this bash script from `admin/`:

```bash
mkdir -p components/ui

declare -A BARRELS=(
  [sidebar]="@exxatdesignux/ui/components/ui/sidebar"
  [avatar]="@exxatdesignux/ui/components/ui/avatar"
  [badge]="@exxatdesignux/ui/components/ui/badge"
  [button]="@exxatdesignux/ui/components/ui/button"
  [kbd]="@exxatdesignux/ui/components/ui/kbd"
  [tooltip]="@exxatdesignux/ui/components/ui/tooltip"
  [dropdown-menu]="@exxatdesignux/ui/components/ui/dropdown-menu"
  [collapsible]="@exxatdesignux/ui/components/ui/collapsible"
  [separator]="@exxatdesignux/ui/components/ui/separator"
  [status-badge]="@exxatdesignux/ui/components/ui/status-badge"
  [popover]="@exxatdesignux/ui/components/ui/popover"
  [command]="@exxatdesignux/ui/components/ui/command"
  [dialog]="@exxatdesignux/ui/components/ui/dialog"
  [banner]="@exxatdesignux/ui/components/ui/banner"
  [tip]="@exxatdesignux/ui/components/ui/tip"
  [dot-pattern]="@exxatdesignux/ui/components/dot-pattern"
)

for NAME in "${!BARRELS[@]}"; do
  echo "export * from \"${BARRELS[$NAME]}\"" > "components/ui/${NAME}.ts"
done
```

- [ ] **Step 3.2: Verify each barrel has one line**

```bash
wc -l admin/components/ui/*.ts
```

Expected: each file has exactly 1 line.

- [ ] **Step 3.3: Commit**

```bash
git add admin/components/ui/
git commit -m "feat(pce-shell): add components/ui barrel files routing to DS package"
```

---

## Task 4: Non-packaged UI components

`ai-thinking-surface.tsx` and `leo-icon.tsx` exist only in template-vite, not in the DS dist. Copy verbatim.

**Files:**
- Create: `admin/components/ui/ai-thinking-surface.tsx`
- Create: `admin/components/ui/leo-icon.tsx`

- [ ] **Step 4.1: Copy ai-thinking-surface.tsx**

```bash
cp node_modules/@exxatdesignux/ui/template-vite/components/ui/ai-thinking-surface.tsx \
   components/ui/ai-thinking-surface.tsx
```

Run from `admin/`.

- [ ] **Step 4.2: Copy leo-icon.tsx**

```bash
cp node_modules/@exxatdesignux/ui/template-vite/components/ui/leo-icon.tsx \
   components/ui/leo-icon.tsx
```

- [ ] **Step 4.3: Commit**

```bash
git add admin/components/ui/ai-thinking-surface.tsx admin/components/ui/leo-icon.tsx
git commit -m "feat(pce-shell): vendor ai-thinking-surface and leo-icon from template-vite"
```

---

## Task 5: Hooks

**Files:**
- Create: `admin/hooks/use-app-theme.ts`
- Create: `admin/hooks/use-mod-key-label.ts`
- Create: `admin/hooks/use-location-hash.ts`
- Create: `admin/hooks/use-sidebar-reflow-zoom.ts`

- [ ] **Step 5.1: Create package-backed hook shims**

```ts
// admin/hooks/use-app-theme.ts
export * from "@exxatdesignux/ui/hooks/use-app-theme"
```

```ts
// admin/hooks/use-mod-key-label.ts
export * from "@exxatdesignux/ui/hooks/use-mod-key-label"
```

- [ ] **Step 5.2: Copy verbatim hooks from template-vite**

```bash
cp node_modules/@exxatdesignux/ui/template-vite/hooks/use-location-hash.ts \
   hooks/use-location-hash.ts
cp node_modules/@exxatdesignux/ui/template-vite/hooks/use-sidebar-reflow-zoom.ts \
   hooks/use-sidebar-reflow-zoom.ts
```

Run from `admin/`.

- [ ] **Step 5.3: Commit**

```bash
git add admin/hooks/
git commit -m "feat(pce-shell): add hook shims and verbatim hook copies from template-vite"
```

---

## Task 6: App lib files

**Files:**
- Create: `admin/lib/sidebar-state-cookie.ts`
- Create: `admin/lib/product-brand.ts`
- Create: `admin/lib/product-ref.ts`
- Create: `admin/lib/product-routing.ts`
- Create: `admin/lib/command-menu-config.ts`

- [ ] **Step 6.1: Copy sidebar-state-cookie and command-menu-config verbatim**

```bash
# Run from admin/
cp node_modules/@exxatdesignux/ui/template-vite/lib/sidebar-state-cookie.ts \
   lib/sidebar-state-cookie.ts
cp node_modules/@exxatdesignux/ui/template-vite/lib/command-menu-config.ts \
   lib/command-menu-config.ts
```

- [ ] **Step 6.2: Create product lib shims**

```ts
// admin/lib/product-brand.ts
export * from "@exxatdesignux/ui/product-framework"
```

```ts
// admin/lib/product-ref.ts
export * from "@exxatdesignux/ui/product-framework"
```

```ts
// admin/lib/product-routing.ts
export * from "@exxatdesignux/ui/product-framework"
```

- [ ] **Step 6.3: Commit**

```bash
git add admin/lib/sidebar-state-cookie.ts admin/lib/command-menu-config.ts \
        admin/lib/product-brand.ts admin/lib/product-ref.ts admin/lib/product-routing.ts
git commit -m "feat(pce-shell): add app lib files (sidebar cookie, product lib shims, command menu config)"
```

---

## Task 7: Provider contexts (verbatim copies)

**Files:**
- Create: `admin/contexts/dashboard-view-context.tsx`
- Create: `admin/contexts/chart-variant-context.tsx`
- Create: `admin/contexts/system-banner-context.tsx`
- Create: `admin/contexts/command-menu-context.tsx`

- [ ] **Step 7.1: Copy all four context files verbatim**

```bash
# Run from admin/
cp node_modules/@exxatdesignux/ui/template-vite/contexts/dashboard-view-context.tsx \
   contexts/dashboard-view-context.tsx
cp node_modules/@exxatdesignux/ui/template-vite/contexts/chart-variant-context.tsx \
   contexts/chart-variant-context.tsx
cp node_modules/@exxatdesignux/ui/template-vite/contexts/system-banner-context.tsx \
   contexts/system-banner-context.tsx
cp node_modules/@exxatdesignux/ui/template-vite/contexts/command-menu-context.tsx \
   contexts/command-menu-context.tsx
```

- [ ] **Step 7.2: Verify no react-router-dom imports in these files**

```bash
grep "react-router-dom" admin/contexts/dashboard-view-context.tsx \
                        admin/contexts/chart-variant-context.tsx \
                        admin/contexts/system-banner-context.tsx \
                        admin/contexts/command-menu-context.tsx
```

Expected: no output (none of these use routing).

- [ ] **Step 7.3: Commit**

```bash
git add admin/contexts/dashboard-view-context.tsx admin/contexts/chart-variant-context.tsx \
        admin/contexts/system-banner-context.tsx admin/contexts/command-menu-context.tsx
git commit -m "feat(pce-shell): add provider context files from template-vite"
```

---

## Task 8: Sidebar shell components

**Files:**
- Create: `admin/components/sidebar/sidebar-shell.tsx`
- Create: `admin/components/sidebar/secondary-panel.tsx` (simplified PCE version)
- Create: `admin/components/sidebar/nav-main.tsx`
- Create: `admin/components/sidebar/nav-secondary.tsx`
- Create: `admin/components/sidebar/nav-user.tsx`

- [ ] **Step 8.1: Copy sidebar-shell, nav-main, nav-secondary, nav-user verbatim**

```bash
# Run from admin/
mkdir -p components/sidebar
cp node_modules/@exxatdesignux/ui/template-vite/components/sidebar/sidebar-shell.tsx \
   components/sidebar/sidebar-shell.tsx
cp node_modules/@exxatdesignux/ui/template-vite/components/sidebar/nav-main.tsx \
   components/sidebar/nav-main.tsx
cp node_modules/@exxatdesignux/ui/template-vite/components/sidebar/nav-secondary.tsx \
   components/sidebar/nav-secondary.tsx
cp node_modules/@exxatdesignux/ui/template-vite/components/sidebar/nav-user.tsx \
   components/sidebar/nav-user.tsx
```

These all import from `@/lib/next-compat` (which PCE's shim resolves to real Next.js) and `@/components/ui/*` (which PCE's barrel files resolve to DS package). No edits needed.

- [ ] **Step 8.2: Create simplified secondary-panel.tsx**

The template-vite `secondary-panel.tsx` imports Library/Tokens-specific nav components that don't exist in PCE. Write a simplified version that provides the same context API with a no-op panel render (PCE has no secondary panels in Phase 1):

```tsx
// admin/components/sidebar/secondary-panel.tsx
"use client"

import * as React from "react"

export type ClosePanelOptions = {
  mainSidebar?: "restore" | "expand" | "collapse" | "leave"
}

interface SecondaryPanelContextValue {
  activePanel: string | null
  openPanel: (id: string) => void
  closePanel: (opts?: ClosePanelOptions) => void
  secondaryPanelCompact: boolean
  collapseActiveSecondaryPanel: () => void
  libraryFolderBridge: null
  setLibraryFolderBridge: (bridge: null) => void
  libraryAccessBridge: null
  setLibraryAccessBridge: (bridge: null) => void
}

const SecondaryPanelContext = React.createContext<SecondaryPanelContextValue>({
  activePanel: null,
  openPanel: () => {},
  closePanel: () => {},
  secondaryPanelCompact: false,
  collapseActiveSecondaryPanel: () => {},
  libraryFolderBridge: null,
  setLibraryFolderBridge: () => {},
  libraryAccessBridge: null,
  setLibraryAccessBridge: () => {},
})

export function useSecondaryPanel() {
  return React.useContext(SecondaryPanelContext)
}

export function SecondaryPanelProvider({ children }: { children: React.ReactNode }) {
  const [activePanel, setActivePanel] = React.useState<string | null>(null)
  const [secondaryPanelCompact, setSecondaryPanelCompact] = React.useState(false)

  const openPanel = React.useCallback((id: string) => {
    setActivePanel(id)
    setSecondaryPanelCompact(false)
  }, [])

  const closePanel = React.useCallback((_opts?: ClosePanelOptions) => {
    setActivePanel(null)
    setSecondaryPanelCompact(false)
  }, [])

  const collapseActiveSecondaryPanel = React.useCallback(() => {
    setSecondaryPanelCompact(true)
  }, [])

  return (
    <SecondaryPanelContext.Provider value={{
      activePanel,
      openPanel,
      closePanel,
      secondaryPanelCompact,
      collapseActiveSecondaryPanel,
      libraryFolderBridge: null,
      setLibraryFolderBridge: () => {},
      libraryAccessBridge: null,
      setLibraryAccessBridge: () => {},
    }}>
      {children}
    </SecondaryPanelContext.Provider>
  )
}

/** PCE Phase 1: no secondary panels. Renders null. */
export function SecondaryPanel() {
  return null
}

export function useAutoPanel(_panelId: string) {
  // No-op in PCE Phase 1
}
```

- [ ] **Step 8.3: Commit**

```bash
git add admin/components/sidebar/
git commit -m "feat(pce-shell): add sidebar shell components (sidebar-shell, nav-main, nav-secondary, nav-user, secondary-panel)"
```

---

## Task 9: Aux shell components (verbatim copies)

**Files:**
- Create: `admin/components/exxat-product-logo.tsx`
- Create: `admin/components/theme-provider.tsx`
- Create: `admin/components/theme-color-sync.tsx`
- Create: `admin/components/product-switch-overlay.tsx`
- Replace: `admin/components/key-metrics-ask-leo-bridge.tsx`
- Create: `admin/components/system-banner-slot.tsx`

- [ ] **Step 9.1: Copy all aux components verbatim**

```bash
# Run from admin/
cp node_modules/@exxatdesignux/ui/template-vite/components/exxat-product-logo.tsx \
   components/exxat-product-logo.tsx
cp node_modules/@exxatdesignux/ui/template-vite/components/theme-provider.tsx \
   components/theme-provider.tsx
cp node_modules/@exxatdesignux/ui/template-vite/components/theme-color-sync.tsx \
   components/theme-color-sync.tsx
cp node_modules/@exxatdesignux/ui/template-vite/components/product-switch-overlay.tsx \
   components/product-switch-overlay.tsx
cp node_modules/@exxatdesignux/ui/template-vite/components/key-metrics-ask-leo-bridge.tsx \
   components/key-metrics-ask-leo-bridge.tsx
cp node_modules/@exxatdesignux/ui/template-vite/components/system-banner-slot.tsx \
   components/system-banner-slot.tsx
```

- [ ] **Step 9.2: Verify exxat-product-logo exports ExxatProductLogo and ExxatProductMark**

```bash
grep "^export" admin/components/exxat-product-logo.tsx | head
```

Expected: lines exporting `ExxatProductLogo`, `ExxatProductMark`.

- [ ] **Step 9.3: Commit**

```bash
git add admin/components/exxat-product-logo.tsx admin/components/theme-provider.tsx \
        admin/components/theme-color-sync.tsx admin/components/product-switch-overlay.tsx \
        admin/components/key-metrics-ask-leo-bridge.tsx admin/components/system-banner-slot.tsx
git commit -m "feat(pce-shell): add aux shell components (product-logo, theme-sync, banner-slot, key-metrics-bridge)"
```

---

## Task 10: Ask Leo sidebar + Command menu (verbatim copies)

**Files:**
- Create: `admin/components/ask-leo-sidebar.tsx`
- Create: `admin/components/command-menu.tsx`

- [ ] **Step 10.1: Copy ask-leo-sidebar.tsx verbatim**

```bash
cp node_modules/@exxatdesignux/ui/template-vite/components/ask-leo-sidebar.tsx \
   components/ask-leo-sidebar.tsx
```

Run from `admin/`.

- [ ] **Step 10.2: Copy command-menu.tsx verbatim**

```bash
cp node_modules/@exxatdesignux/ui/template-vite/components/command-menu.tsx \
   components/command-menu.tsx
```

- [ ] **Step 10.3: Commit**

```bash
git add admin/components/ask-leo-sidebar.tsx admin/components/command-menu.tsx
git commit -m "feat(pce-shell): add ask-leo-sidebar and command-menu from template-vite"
```

---

## Task 11: Sidebar barrel index

**Files:**
- Create: `admin/components/sidebar/index.ts`

- [ ] **Step 11.1: Create barrel index**

The template-vite's `App.tsx` imports `{ AppSidebar, SidebarShell, SecondaryPanelProvider, SecondaryPanel }` from `@/components/sidebar`. PCE's layout will do the same.

```ts
// admin/components/sidebar/index.ts
export * from "./app-sidebar"
export * from "./sidebar-shell"
export * from "./nav-main"
export * from "./nav-secondary"
export * from "./nav-user"
export * from "./secondary-panel"
```

Note: `./app-sidebar` is the existing PCE sidebar (will be fully rewritten in Task 14), not the template-vite version.

- [ ] **Step 11.2: Commit**

```bash
git add admin/components/sidebar/index.ts
git commit -m "feat(pce-shell): add components/sidebar barrel index"
```

---

## Task 12: PCE nav config

**Files:**
- Create: `admin/lib/pce-nav.tsx`

- [ ] **Step 12.1: Create lib/pce-nav.tsx with PCE-specific nav items**

```tsx
// admin/lib/pce-nav.tsx
"use client"

import type * as React from "react"

export interface NavLinkItem {
  key: string
  title: string
  url: string
  icon: React.ReactNode
  iconActive?: React.ReactNode
  children?: NavLinkItem[]
  badge?: number | string
  secondaryPanel?: string
  primaryHubChildKey?: string
}

export interface NavSecondaryItem {
  key: string
  title: string
  url: string
  icon: React.ReactNode
  iconActive?: React.ReactNode
  opensCommandMenu?: boolean
  opensAskLeo?: boolean
}

export interface NavProgram { id: string; name: string }
export interface NavSchool {
  id: string
  name: string
  logo: string
  initials: string
  programs: NavProgram[]
}

export const NAV_SCHOOLS: NavSchool[] = [
  {
    id: "jhu",
    name: "Johns Hopkins University",
    logo: "https://img.logo.dev/jhu.edu?token=pk_X-1ZO13GSgeOoUrIuJ6BeQ",
    initials: "JH",
    programs: [
      { id: "som", name: "School of Medicine" },
      { id: "son", name: "School of Nursing" },
      { id: "sph", name: "Bloomberg School of Public Health" },
    ],
  },
  {
    id: "mayo",
    name: "Mayo Clinic Alix School of Medicine",
    logo: "https://img.logo.dev/mayoclinic.org?token=pk_X-1ZO13GSgeOoUrIuJ6BeQ",
    initials: "MC",
    programs: [
      { id: "md", name: "Doctor of Medicine" },
      { id: "bms", name: "Biomedical Sciences" },
    ],
  },
]

export const NAV_SCHOOL_DEFAULT = NAV_SCHOOLS[0]
export const NAV_PROGRAM_DEFAULT = NAV_SCHOOLS[0].programs[0]

/** Quick actions — Ask Leo + Search rendered above primary nav */
export const NAV_QUICK_ACTIONS: NavSecondaryItem[] = [
  {
    key: "ask-leo",
    title: "Ask Leo",
    url: "#",
    icon: <i className="fa-duotone fa-solid fa-star-christmas text-brand" aria-hidden="true" />,
    opensAskLeo: true,
  },
  {
    key: "search",
    title: "Search",
    url: "#",
    icon: <i className="fa-light fa-magnifying-glass" aria-hidden="true" />,
    opensCommandMenu: true,
  },
]

/** Admin role — full app navigation */
export const NAV_ADMIN: NavLinkItem[] = [
  {
    key: "surveys",
    title: "Surveys",
    url: "/surveys",
    icon:       <i className="fa-light fa-paper-plane" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-paper-plane" aria-hidden="true" />,
  },
  {
    key: "templates",
    title: "Templates",
    url: "/templates",
    icon:       <i className="fa-light fa-rectangle-list" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-rectangle-list" aria-hidden="true" />,
  },
  {
    key: "moderation",
    title: "Moderation",
    url: "/moderation",
    icon:       <i className="fa-light fa-shield-check" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-shield-check" aria-hidden="true" />,
  },
  {
    key: "analytics",
    title: "Analytics",
    url: "/analytics",
    icon:       <i className="fa-light fa-chart-mixed" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-chart-mixed" aria-hidden="true" />,
  },
  {
    key: "setup",
    title: "Setup",
    url: "/admin",
    icon:       <i className="fa-light fa-gear-complex" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-gear-complex" aria-hidden="true" />,
    children: [
      { key: "students",        title: "Students",         url: "/admin/students",         icon: <i className="fa-light fa-graduation-cap" aria-hidden="true" /> },
      { key: "faculty",         title: "Faculty",          url: "/admin/faculty",          icon: <i className="fa-light fa-user-tie" aria-hidden="true" /> },
      { key: "courses",         title: "Courses",          url: "/admin/courses",          icon: <i className="fa-light fa-book" aria-hidden="true" /> },
      { key: "terms",           title: "Terms",            url: "/admin/terms",            icon: <i className="fa-light fa-calendar" aria-hidden="true" /> },
      { key: "offerings",       title: "Offerings",        url: "/admin/offerings",        icon: <i className="fa-light fa-layer-group" aria-hidden="true" /> },
      { key: "competencies",    title: "Competencies",     url: "/admin/competencies",     icon: <i className="fa-light fa-list-check" aria-hidden="true" /> },
      { key: "content-areas",   title: "Content Areas",    url: "/admin/content-areas",    icon: <i className="fa-light fa-grid-2" aria-hidden="true" /> },
      { key: "standards",       title: "Standards",        url: "/admin/standards",        icon: <i className="fa-light fa-certificate" aria-hidden="true" /> },
      { key: "assessment-types",title: "Assessment Types", url: "/admin/assessment-types", icon: <i className="fa-light fa-clipboard-list" aria-hidden="true" /> },
      { key: "permissions",     title: "Permissions",      url: "/admin/permissions",      icon: <i className="fa-light fa-lock" aria-hidden="true" /> },
      { key: "admin-home",      title: "Overview",         url: "/admin",                  icon: <i className="fa-light fa-house" aria-hidden="true" /> },
    ],
  },
]

/** Faculty role — limited nav */
export const NAV_FACULTY: NavLinkItem[] = [
  {
    key: "my-surveys",
    title: "My Surveys",
    url: "/my-surveys",
    icon:       <i className="fa-light fa-paper-plane" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-paper-plane" aria-hidden="true" />,
  },
  {
    key: "results",
    title: "Results",
    url: "/my-surveys?filter=released",
    icon:       <i className="fa-light fa-chart-bar" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-chart-bar" aria-hidden="true" />,
  },
]

/** Footer nav — Settings + Help (below user footer) */
export const NAV_SECONDARY: NavSecondaryItem[] = [
  {
    key: "settings",
    title: "Settings",
    url: "/settings",
    icon:       <i className="fa-light fa-gear" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-gear" aria-hidden="true" />,
  },
  {
    key: "help",
    title: "Help",
    url: "/help",
    icon:       <i className="fa-light fa-circle-question" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-circle-question" aria-hidden="true" />,
  },
]

/** Placeholder user — will be replaced by real auth */
export const NAV_USER = {
  name: "Ramona J.",
  email: "ramona@example.com",
  avatar: "",
}
```

- [ ] **Step 12.2: Commit**

```bash
git add admin/lib/pce-nav.tsx
git commit -m "feat(pce-shell): add PCE navigation config"
```

---

## Task 13: PCE command menu data

**Files:**
- Create: `admin/lib/pce-command-menu.ts`

- [ ] **Step 13.1: Create lib/pce-command-menu.ts**

This ports the 4 groups from the existing `command-palette.tsx` into the DS command menu format.

```ts
// admin/lib/pce-command-menu.ts
import type { CommandMenuGroup } from "@/lib/command-menu-config"
import { MOCK_SURVEYS, MOCK_TEMPLATES } from "@/lib/pce-mock-data"

const ADMIN_ENTITY_ROUTES = [
  { id: "admin-students",         label: "Students",         href: "/admin/students",         icon: "fa-light fa-graduation-cap" },
  { id: "admin-faculty",          label: "Faculty",          href: "/admin/faculty",          icon: "fa-light fa-user-tie" },
  { id: "admin-courses",          label: "Courses",          href: "/admin/courses",          icon: "fa-light fa-book" },
  { id: "admin-terms",            label: "Terms",            href: "/admin/terms",            icon: "fa-light fa-calendar" },
  { id: "admin-offerings",        label: "Offerings",        href: "/admin/offerings",        icon: "fa-light fa-layer-group" },
  { id: "admin-competencies",     label: "Competencies",     href: "/admin/competencies",     icon: "fa-light fa-list-check" },
  { id: "admin-content-areas",    label: "Content Areas",    href: "/admin/content-areas",    icon: "fa-light fa-grid-2" },
  { id: "admin-standards",        label: "Standards",        href: "/admin/standards",        icon: "fa-light fa-certificate" },
  { id: "admin-assessment-types", label: "Assessment Types", href: "/admin/assessment-types", icon: "fa-light fa-clipboard-list" },
  { id: "admin-permissions",      label: "Permissions",      href: "/admin/permissions",      icon: "fa-light fa-lock" },
  { id: "admin-home",             label: "Admin Overview",   href: "/admin",                  icon: "fa-light fa-house" },
]

const PAGE_ROUTES = [
  { id: "page-surveys",    label: "Surveys",    href: "/surveys",    icon: "fa-light fa-paper-plane" },
  { id: "page-templates",  label: "Templates",  href: "/templates",  icon: "fa-light fa-rectangle-list" },
  { id: "page-moderation", label: "Moderation", href: "/moderation", icon: "fa-light fa-shield-check" },
  { id: "page-analytics",  label: "Analytics",  href: "/analytics",  icon: "fa-light fa-chart-mixed" },
  { id: "page-settings",   label: "Settings",   href: "/settings",   icon: "fa-light fa-gear" },
  { id: "page-help",       label: "Help",       href: "/help",       icon: "fa-light fa-circle-question" },
]

export const PCE_COMMAND_MENU_DATA_GROUPS: CommandMenuGroup[] = [
  {
    id: "surveys",
    heading: "Surveys",
    searchOnly: true,
    items: MOCK_SURVEYS.map(s => ({
      id: `survey-${s.id}`,
      label: s.name,
      keywords: `${s.course} ${s.term}`,
      icon: "fa-light fa-paper-plane",
      href: `/surveys/${s.id}`,
    })),
  },
  {
    id: "templates",
    heading: "Templates",
    searchOnly: true,
    items: MOCK_TEMPLATES.map(t => ({
      id: `template-${t.id}`,
      label: t.name,
      icon: "fa-light fa-rectangle-list",
      href: `/templates/${t.id}`,
    })),
  },
  {
    id: "admin",
    heading: "Admin",
    items: ADMIN_ENTITY_ROUTES,
  },
  {
    id: "pages",
    heading: "Pages",
    items: PAGE_ROUTES,
  },
]
```

- [ ] **Step 13.2: Commit**

```bash
git add admin/lib/pce-command-menu.ts
git commit -m "feat(pce-shell): add PCE command menu data groups"
```

---

## Task 14: Rewrite AppSidebar

**Files:**
- Modify: `admin/components/app-sidebar.tsx` (full rewrite)

This follows the template-vite `app-sidebar.tsx` structural pattern but:
- Uses PCE nav from `lib/pce-nav.tsx` instead of `lib/mock/navigation.tsx`
- Uses Next.js router (via `@/lib/next-compat`)
- Uses `usePce()` for role state
- Simplifies product switching (single product "exxat-prism")
- Keeps the TeamSwitcher header, Quick Actions, role-split primary nav, NavUser with role toggle

- [ ] **Step 14.1: Write new components/app-sidebar.tsx**

```tsx
// admin/components/app-sidebar.tsx
"use client"

import * as React from "react"
import { usePathname } from "@/lib/next-compat"
import { motion } from "motion/react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { requestOpenCommandMenu } from "@/components/command-menu"
import { useAskLeo } from "@/components/ask-leo-sidebar"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { useAltKeyLabel, useModKeyLabel } from "@/hooks/use-mod-key-label"
import { ExxatProductLogo } from "@/components/exxat-product-logo"
import { NavUser } from "@/components/sidebar/nav-user"
import { motionHeaderEnter } from "@/lib/motion-ui"
import {
  NAV_ADMIN, NAV_FACULTY, NAV_QUICK_ACTIONS, NAV_SECONDARY,
  NAV_SCHOOLS, NAV_SCHOOL_DEFAULT, NAV_PROGRAM_DEFAULT,
  NAV_USER,
  type NavLinkItem, type NavSecondaryItem, type NavSchool, type NavProgram,
} from "@/lib/pce-nav"
import { usePce } from "@/components/pce/pce-state"
import { SettingsAppearanceCard } from "@/components/settings-appearance-card"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@exxatdesignux/ui"

// ─── Active-link helpers ──────────────────────────────────────────────────────

function isNavActive(pathname: string, url: string): boolean {
  const base = url.split("?")[0]
  if (!base || base === "#") return false
  return pathname === base || pathname.startsWith(base + "/")
}

// ─── TeamSwitcher ─────────────────────────────────────────────────────────────

function TeamSwitcher() {
  const { state } = useSidebar()
  const [school, setSchool] = React.useState<NavSchool>(NAV_SCHOOL_DEFAULT)
  const [program, setProgram] = React.useState<NavProgram>(NAV_PROGRAM_DEFAULT)

  if (state === "collapsed") return null

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-6 w-6 rounded shrink-0">
                <AvatarImage src={school.logo} alt="" />
                <AvatarFallback className="rounded text-[10px] font-bold">{school.initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-start text-sm leading-tight min-w-0">
                <span className="truncate font-semibold text-sm">{school.name}</span>
                <span className="truncate text-xs text-muted-foreground">{program.name}</span>
              </div>
              <i className="fa-light fa-chevrons-up-down ms-auto shrink-0 text-[11px] text-muted-foreground" aria-hidden="true" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-64 rounded-lg"
            side="bottom"
            align="start"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">Schools</DropdownMenuLabel>
            {NAV_SCHOOLS.map(s => (
              <React.Fragment key={s.id}>
                <DropdownMenuItem
                  className="font-medium"
                  onClick={() => { setSchool(s); setProgram(s.programs[0]) }}
                >
                  <Avatar className="h-5 w-5 rounded shrink-0 me-2">
                    <AvatarImage src={s.logo} alt="" />
                    <AvatarFallback className="rounded text-[9px] font-bold">{s.initials}</AvatarFallback>
                  </Avatar>
                  {s.name}
                </DropdownMenuItem>
                {s.id === school.id && s.programs.map(p => (
                  <DropdownMenuItem
                    key={p.id}
                    className="ps-8 text-sm"
                    onClick={() => setProgram(p)}
                  >
                    {program.id === p.id && <i className="fa-solid fa-check me-2 text-xs text-brand" aria-hidden="true" />}
                    {p.name}
                  </DropdownMenuItem>
                ))}
              </React.Fragment>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

// ─── QuickActions row (Ask Leo + Search) ─────────────────────────────────────

function QuickActions({ items }: { items: NavSecondaryItem[] }) {
  const { toggleAskLeo } = useAskLeo()
  const mod = useModKeyLabel()
  const alt = useAltKeyLabel()

  return (
    <SidebarMenu>
      {items.map(item => (
        <SidebarMenuItem key={item.key}>
          <SidebarMenuButton
            onClick={() => {
              if (item.opensAskLeo) toggleAskLeo()
              else if (item.opensCommandMenu) requestOpenCommandMenu()
            }}
            tooltip={item.title}
          >
            {item.icon}
            <span className="flex-1">{item.title}</span>
            {item.opensAskLeo && (
              <KbdGroup className="ms-auto group-data-collapsible-icon:hidden">
                <Kbd>{mod}</Kbd>
                <Kbd>{alt}</Kbd>
                <Kbd>K</Kbd>
              </KbdGroup>
            )}
            {item.opensCommandMenu && (
              <KbdGroup className="ms-auto group-data-collapsible-icon:hidden">
                <Kbd>{mod}</Kbd>
                <Kbd>K</Kbd>
              </KbdGroup>
            )}
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}

// ─── PrimaryNav ───────────────────────────────────────────────────────────────

function PrimaryNav({ items }: { items: NavLinkItem[] }) {
  const pathname = usePathname()
  const { user } = usePce()
  const pendingCount = 0 // TODO: wire from usePce().surveys when moderation count is needed

  return (
    <SidebarMenu>
      {items.map(item => {
        const active = isNavActive(pathname, item.url)
        if (item.children?.length) {
          return (
            <Collapsible key={item.key} defaultOpen={active} asChild className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton isActive={active} tooltip={item.title}>
                    {active ? item.iconActive ?? item.icon : item.icon}
                    <span className="flex-1">{item.title}</span>
                    <i
                      className="fa-light fa-chevron-right ms-auto text-[10px] transition-transform group-data-[state=open]/collapsible:rotate-90"
                      aria-hidden="true"
                    />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.children.map(child => (
                      <SidebarMenuSubItem key={child.key}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={isNavActive(pathname, child.url)}
                        >
                          <a href={child.url}>
                            {child.icon}
                            <span>{child.title}</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        }

        const badge = item.key === "moderation" && pendingCount > 0 ? pendingCount : item.badge

        return (
          <SidebarMenuItem key={item.key}>
            <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
              <a href={item.url} aria-current={active ? "page" : undefined}>
                {active ? item.iconActive ?? item.icon : item.icon}
                <span className="flex-1">{item.title}</span>
              </a>
            </SidebarMenuButton>
            {badge !== undefined && badge !== 0 && (
              <SidebarMenuBadge>{badge}</SidebarMenuBadge>
            )}
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}

// ─── SecondaryNav (Settings + Help) ──────────────────────────────────────────

function SecondaryNav({ items }: { items: NavSecondaryItem[] }) {
  return (
    <SidebarMenu>
      {items.map(item => (
        <SidebarMenuItem key={item.key}>
          <SidebarMenuButton asChild tooltip={item.title}>
            <a href={item.url}>
              {item.icon}
              <span>{item.title}</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}

// ─── AppSidebar ───────────────────────────────────────────────────────────────

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, toggleRole } = usePce()
  const [appearanceOpen, setAppearanceOpen] = React.useState(false)
  const navItems = user.role === "admin" ? NAV_ADMIN : NAV_FACULTY

  const navUser = {
    name: user.name,
    email: user.email,
    avatar: "",
  }

  return (
    <>
      <Sidebar variant="inset" collapsible="icon" {...props}>
        <nav aria-label="Application" className="flex min-h-0 flex-1 flex-col">

          {/* Header: Exxat Prism logo */}
          <SidebarHeader className="pb-0">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  size="lg"
                  className="sidebar-brand-btn"
                  tooltip="Exxat Prism"
                >
                  <motion.div
                    key="prism-logo"
                    initial="hidden"
                    animate="visible"
                    variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: motionHeaderEnter } }}
                  >
                    <ExxatProductLogo product="exxat-prism" />
                  </motion.div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          {/* TeamSwitcher: school > program */}
          <div className="px-2 pb-1">
            <TeamSwitcher />
          </div>

          <SidebarSeparator />

          <SidebarContent className="gap-0">
            {/* Quick actions: Ask Leo + Search */}
            <SidebarGroup className="py-2">
              <SidebarGroupContent>
                <QuickActions items={NAV_QUICK_ACTIONS} />
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator />

            {/* Primary nav: role-split */}
            <SidebarGroup className="py-2">
              <SidebarGroupLabel>
                {user.role === "admin" ? "Navigation" : "My workspace"}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <PrimaryNav items={navItems} />
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarSeparator />

          {/* Footer: Settings + Help + NavUser with role toggle */}
          <SidebarFooter className="pt-1 pb-2">
            <SecondaryNav items={NAV_SECONDARY} />
            <NavUser
              user={navUser}
              extraMenuItems={
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={toggleRole}>
                    <i className="fa-light fa-arrows-rotate" aria-hidden="true" />
                    Switch to {user.role === "admin" ? "Faculty" : "Admin"} view
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setAppearanceOpen(true)}>
                    <i className="fa-light fa-paintbrush" aria-hidden="true" />
                    Appearance
                  </DropdownMenuItem>
                </>
              }
            />
          </SidebarFooter>
        </nav>
      </Sidebar>

      {/* Appearance sheet — rendered outside Sidebar to avoid aria-hidden conflict */}
      <Sheet open={appearanceOpen} onOpenChange={setAppearanceOpen}>
        <SheetContent side="right" className="w-full data-[side=right]:sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Appearance</SheetTitle>
            <SheetDescription>Theme, contrast, text size, and brand. Saved in this browser.</SheetDescription>
          </SheetHeader>
          <div className="px-6 pb-6">
            <SettingsAppearanceCard />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
```

**Important:** `NavUser` from `nav-user.tsx` doesn't support `extraMenuItems` out of the box. After the step above, check if the template-vite `nav-user.tsx` accepts an `extraMenuItems` prop. If not, add it:

Open `admin/components/sidebar/nav-user.tsx` and add this prop to the `NavUser` function signature:

```tsx
// Find the existing function signature:
export function NavUser({ user }: { user: { name: string; email: string; avatar: string } })

// Add extraMenuItems prop:
export function NavUser({
  user,
  extraMenuItems,
}: {
  user: { name: string; email: string; avatar: string }
  extraMenuItems?: React.ReactNode
})
```

Then inside the `DropdownMenuContent`, before the last `DropdownMenuSeparator` + Log out, render `{extraMenuItems}`.

- [ ] **Step 14.2: Commit**

```bash
git add admin/components/app-sidebar.tsx admin/components/sidebar/nav-user.tsx
git commit -m "feat(pce-shell): rewrite AppSidebar with PCE nav + template-vite pattern"
```

---

## Task 15: Rewrite layout.tsx + delete command-palette.tsx

**Files:**
- Modify: `admin/app/(app)/layout.tsx` (full rewrite)
- Delete: `admin/components/command-palette.tsx`

- [ ] **Step 15.1: Write new app/(app)/layout.tsx**

```tsx
// admin/app/(app)/layout.tsx
import * as React from "react"
import { cookies } from "next/headers"
import { ThemeProvider } from "@/components/theme-provider"
import { ProductProvider } from "@/contexts/product-context"
import { ProductRouteSync } from "@/contexts/product-route-sync"
import { ProductSwitchOverlay } from "@/components/product-switch-overlay"
import { ThemeColorSync } from "@/components/theme-color-sync"
import { TooltipProvider } from "@exxatdesignux/ui"
import { DashboardViewProvider } from "@/contexts/dashboard-view-context"
import { ChartVariantProvider } from "@/contexts/chart-variant-context"
import { AskLeoProvider, AskLeoSidebar } from "@/components/ask-leo-sidebar"
import { KeyMetricsAskLeoBridge } from "@/components/key-metrics-ask-leo-bridge"
import { SystemBannerProvider } from "@/contexts/system-banner-context"
import { SystemBannerSlot } from "@/components/system-banner-slot"
import { CommandMenu } from "@/components/command-menu"
import { CommandMenuProvider } from "@/contexts/command-menu-context"
import { SidebarShell } from "@/components/sidebar/sidebar-shell"
import { AppSidebar } from "@/components/app-sidebar"
import { SecondaryPanel, SecondaryPanelProvider } from "@/components/sidebar/secondary-panel"
import { buildCommandMenuConfig } from "@/lib/command-menu-config"
import { PCE_COMMAND_MENU_DATA_GROUPS } from "@/lib/pce-command-menu"
import { SIDEBAR_STATE_COOKIE_NAME, sidebarDefaultOpenFromCookie } from "@/lib/sidebar-state-cookie"
import { PceProvider } from "@/components/pce/pce-state"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const sidebarCookie = cookieStore.get(SIDEBAR_STATE_COOKIE_NAME)?.value
  const sidebarDefaultOpen = sidebarDefaultOpenFromCookie(sidebarCookie)

  const commandMenuConfig = buildCommandMenuConfig({
    dataGroups: PCE_COMMAND_MENU_DATA_GROUPS,
  })

  return (
    <PceProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <ProductProvider>
          <ProductRouteSync />
          <ProductSwitchOverlay />
          <ThemeColorSync />
          <TooltipProvider delayDuration={300}>
            <DashboardViewProvider>
              <ChartVariantProvider>
                <AskLeoProvider>
                  <KeyMetricsAskLeoBridge>
                    <SystemBannerProvider>
                      <CommandMenuProvider value={commandMenuConfig}>
                        <SidebarShell
                          defaultOpen={sidebarDefaultOpen}
                          wrapperClassName="flex min-h-svh flex-col"
                        >
                          <CommandMenu />
                          <SystemBannerSlot />
                          <div className="flex min-h-0 w-full flex-1 items-stretch has-data-[variant=inset]:bg-sidebar">
                            <SecondaryPanelProvider>
                              <AppSidebar variant="inset" />
                              <SecondaryPanel />
                              {children}
                            </SecondaryPanelProvider>
                            <AskLeoSidebar />
                          </div>
                        </SidebarShell>
                      </CommandMenuProvider>
                    </SystemBannerProvider>
                  </KeyMetricsAskLeoBridge>
                </AskLeoProvider>
              </ChartVariantProvider>
            </DashboardViewProvider>
          </TooltipProvider>
        </ProductProvider>
      </ThemeProvider>
    </PceProvider>
  )
}
```

Note: This layout is a **server component** (no `'use client'`). `PceProvider` is the only PCE-specific addition — it wraps the full stack so PCE domain state is available to all children.

- [ ] **Step 15.2: Check if SIDEBAR_STATE_COOKIE_NAME is exported from sidebar-state-cookie.ts**

```bash
grep "SIDEBAR_STATE_COOKIE_NAME\|sidebarDefaultOpenFromCookie" admin/lib/sidebar-state-cookie.ts
```

Expected: both are exported. If only one is, check the template-vite source and fix the copy.

- [ ] **Step 15.3: Delete command-palette.tsx**

Before deleting, remove the import from any files that still use it:

```bash
grep -r "command-palette\|CommandPalette\|useCommandPalette" admin/ --include="*.tsx" --include="*.ts" -l
```

For each file found (should just be `layout.tsx` which we already rewrote), remove the import. Then delete:

```bash
rm admin/components/command-palette.tsx
```

- [ ] **Step 15.4: Commit**

```bash
git add admin/app/\(app\)/layout.tsx
git rm admin/components/command-palette.tsx
git commit -m "feat(pce-shell): rewrite layout.tsx with 11-provider stack, delete command-palette.tsx"
```

---

## Task 16: Verify — TypeScript + smoke test

- [ ] **Step 16.1: Run typecheck**

```bash
cd /Users/romitsoley/Work/apps/pce/admin && pnpm typecheck
```

Expected: zero errors. If there are errors:

**Common error: `extraMenuItems` not in NavUser prop types**
Fix: Open `admin/components/sidebar/nav-user.tsx`, find the function signature, add `extraMenuItems?: React.ReactNode` to the props destructuring.

**Common error: import not found (`@/components/sidebar` barrel)**
Fix: Ensure `admin/components/sidebar/index.ts` exports the missing symbol.

**Common error: `SidebarSeparator` not imported in app-sidebar.tsx**
Fix: Add `SidebarSeparator` to the import from `@/components/ui/sidebar`.

**Common error: `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetDescription` not found**
Fix: These come from `@exxatdesignux/ui` directly. Verify the import in `app-sidebar.tsx`.

**Common error: `PceProvider` not a server-safe component**
Fix: If `pce-state.tsx` uses browser APIs that break as a server import, wrap `PceProvider` in a separate `'use client'` wrapper component, e.g. `PceClientProvider`, and import that in `layout.tsx`.

- [ ] **Step 16.2: Start dev server and smoke test**

```bash
cd /Users/romitsoley/Work/apps/pce/admin && pnpm dev
```

Navigate to `http://localhost:3005` and verify:
- [ ] Sidebar renders with Exxat Prism logo
- [ ] TeamSwitcher shows school/program
- [ ] Quick actions: Ask Leo + Search visible
- [ ] Primary nav: Surveys, Templates, Moderation, Analytics, Setup (admin role)
- [ ] ⌘K opens command menu
- [ ] ⌘⌥K opens Ask Leo sidebar
- [ ] Role toggle in user menu switches to Faculty nav (My Surveys, Results)
- [ ] Appearance sheet opens from user menu

- [ ] **Step 16.3: Final commit**

```bash
git add -A
git commit -m "feat(pce-shell): complete Level 2 shell port — template-vite provider stack live"
```

---

## Self-Review

### Spec coverage check

| Spec requirement | Task |
|---|---|
| 11-provider stack in layout.tsx | Task 15 |
| AppSidebar rewrite with PCE nav | Task 14 |
| CommandMenu replaces command-palette.tsx | Tasks 10, 15 |
| `lib/next-compat.tsx` inverted shim | Task 1 |
| `stores/app-store.ts` shim | Task 2 |
| Product context shims | Task 2 |
| `components/ui/` barrel files | Task 3 |
| `ai-thinking-surface`, `leo-icon` copy | Task 4 |
| Hook shims + verbatim copies | Task 5 |
| Sidebar-state-cookie, product-brand/ref/routing | Task 6 |
| `lib/command-menu-config.ts` | Task 6 |
| Dashboard/chart/system-banner/command-menu contexts | Task 7 |
| Sidebar shell, nav-main, nav-secondary, nav-user, secondary-panel | Task 8 |
| Aux shell components (exxat-product-logo, theme-*) | Task 9 |
| Ask Leo sidebar, command-menu verbatim | Task 10 |
| Sidebar barrel index | Task 11 |
| `lib/pce-nav.tsx` | Task 12 |
| `lib/pce-command-menu.ts` | Task 13 |
| Role toggle in NavUser | Task 14 |
| TeamSwitcher (school > program) | Task 14 |
| AskLeoProvider + AskLeoSidebar real (not stub) | Task 15 |
| Delete command-palette.tsx | Task 15 |
| TypeCheck clean | Task 16 |

All spec requirements covered. ✓

### Potential issues

1. **PceProvider in server layout**: `pce-state.tsx` likely uses `useState`/`useContext` which can't run in server components. Wrap in a `'use client'` client boundary component if the typecheck fails with "useState is not allowed in server components."

2. **nav-user.tsx extraMenuItems**: The template-vite `nav-user.tsx` doesn't have this prop. Task 14 adds it. Verify the prop is wired inside `DropdownMenuContent` before the log-out item.

3. **MOCK_SURVEYS/MOCK_TEMPLATES shape**: Task 13 uses `s.id`, `s.name`, `s.course`, `s.term` from MOCK_SURVEYS. Verify these field names match `lib/pce-mock-data.ts` before running.

4. **SidebarSeparator**: PCE's `globals.css` already styles sidebar menu buttons. Verify `SidebarSeparator` is exported from the `@exxatdesignux/ui/components/ui/sidebar` barrel.
