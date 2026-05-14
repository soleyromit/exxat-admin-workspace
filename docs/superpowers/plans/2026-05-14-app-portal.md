# App Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold `apps/portal/` as a Next.js 16 launcher app on port 4000 that links to every Exxat workspace product's admin surface, using the Exxat-DS sidebar shell.

**Architecture:** Single-page Next.js app using the DS `SidebarProvider + SidebarInset` shell (identical to admin apps). Product URLs are read from `NEXT_PUBLIC_*` env vars, falling back to localhost ports so the app works out-of-the-box locally. A static `PRODUCTS` config array drives the card grid.

**Tech Stack:** Next.js 15 (App Router), React 19, Tailwind v4, Exxat-DS (`@exxat/ds`), `next-themes`, TypeScript 5.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `pnpm-workspace.yaml` | Modify | Add `apps/portal` glob |
| `docs/PRODUCTS.md` | Modify | Add portal row |
| `apps/portal/package.json` | Create | Package identity + dev/build scripts |
| `apps/portal/next.config.ts` | Create | `@exxat/ds` webpack alias + `externalDir` |
| `apps/portal/tsconfig.json` | Create | Extends base, adds `@exxat/ds/*` + `@/*` paths |
| `apps/portal/vercel.json` | Create | Vercel deploy config |
| `apps/portal/app/globals.css` | Create | DS theme import + sidebar tokens + flat nav CSS |
| `apps/portal/components/theme-provider.tsx` | Create | next-themes provider (copy from exam-management) |
| `apps/portal/app/layout.tsx` | Create | `<html class="theme-one">` + Typekit + FA Pro + ThemeProvider |
| `apps/portal/public/exxat-logo.svg` | Copy | Circular mark (collapsed sidebar) |
| `apps/portal/public/exxat-one.svg` | Copy | One wordmark (expanded sidebar) |
| `apps/portal/lib/products.ts` | Create | `PRODUCTS` array + `Product` type with env-var URLs |
| `apps/portal/components/app-sidebar.tsx` | Create | DS Sidebar: logo, Apps nav item, RS footer |
| `apps/portal/components/site-header.tsx` | Create | `SidebarTrigger` + "Workspace" title |
| `apps/portal/components/product-card.tsx` | Create | DS Card + Open Admin button + ⋯ dropdown |
| `apps/portal/app/page.tsx` | Create | `SidebarProvider` + `AppSidebar` + `SidebarInset` + card grid |

---

### Task 1: Workspace plumbing

**Files:**
- Modify: `pnpm-workspace.yaml`
- Modify: `docs/PRODUCTS.md`

- [ ] **Step 1: Add portal to pnpm workspace**

Edit `pnpm-workspace.yaml` — add `'apps/portal'` after the existing `apps/` entries:

```yaml
packages:
  - 'exxat-ds/packages/*'
  - 'apps/exam-management/*'
  - 'apps/patient-log/*'
  - 'apps/pce/*'
  - 'apps/skills-checklist/*'
  - 'apps/learning-contracts/*'
  - 'apps/portal'
  - 'tools/*'
```

- [ ] **Step 2: Register portal in PRODUCTS.md**

Add a row to the `## Registry` table in `docs/PRODUCTS.md`:

```markdown
| `portal` | Workspace Portal | active | `@exxat/portal` | 4000 | — | — | admin DS only | Romit | Romit | high | Cross-stage |
```

- [ ] **Step 3: Commit**

```bash
git add pnpm-workspace.yaml docs/PRODUCTS.md
git commit -m "chore(portal): register portal in workspace + products registry"
```

---

### Task 2: Config files

**Files:**
- Create: `apps/portal/package.json`
- Create: `apps/portal/next.config.ts`
- Create: `apps/portal/tsconfig.json`
- Create: `apps/portal/vercel.json`

- [ ] **Step 1: Create `apps/portal/package.json`**

```json
{
  "name": "@exxat/portal",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev --port 4000",
    "build": "next build",
    "start": "next start --port 4000",
    "typecheck": "tsc --noEmit",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^15.3.1",
    "next-themes": "^0.4.6",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "engines": {
    "node": "20.x"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.0.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
```

- [ ] **Step 2: Create `apps/portal/next.config.ts`**

```ts
import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
  },
  devIndicators: false,
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@exxat/ds': path.resolve(__dirname, '../../../exxat-ds'),
    }
    return config
  },
}

export default nextConfig
```

- [ ] **Step 3: Create `apps/portal/tsconfig.json`**

```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }],
    "ignoreDeprecations": "5.0",
    "baseUrl": ".",
    "paths": {
      "@exxat/ds/*": ["../../../exxat-ds/*"],
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create `apps/portal/vercel.json`**

```json
{
  "framework": "nextjs",
  "installCommand": "pnpm install",
  "buildCommand": "pnpm build"
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/portal/package.json apps/portal/next.config.ts apps/portal/tsconfig.json apps/portal/vercel.json
git commit -m "chore(portal): scaffold config files — package.json, next.config, tsconfig, vercel.json"
```

---

### Task 3: CSS, layout, theme provider, and logos

**Files:**
- Create: `apps/portal/app/globals.css`
- Create: `apps/portal/components/theme-provider.tsx`
- Create: `apps/portal/app/layout.tsx`
- Copy: `apps/portal/public/exxat-logo.svg`
- Copy: `apps/portal/public/exxat-one.svg`

- [ ] **Step 1: Create `apps/portal/app/globals.css`**

Portal-scoped CSS — no QB tokens, no DataTable tokens. Just DS theme + sidebar shell.

```css
@import '../../../exxat-ds/packages/ui/src/theme.css';
@import "tailwindcss";
@source '../../../exxat-ds/packages/ui/src/**/*.{ts,tsx}';

/* Sidebar background token */
:root {
  --sidebar: var(--brand-tint);
}
.dark {
  --sidebar: oklch(0.245 0.015 270);
}

/* DS sidebar border fix — without this the border falls back to currentColor */
[data-slot="sidebar-container"] {
  border-inline-end-color: var(--sidebar-border);
  border-inline-start-color: var(--sidebar-border);
}

/* Flat nav style — strip card chrome from sidebar menu buttons */
[data-sidebar="menu-button"] {
  background-color: transparent;
  box-shadow: none;
  font-weight: 400;
}
[data-sidebar="menu-button"]:hover {
  background-color: var(--sidebar-accent);
  color: var(--sidebar-accent-foreground);
  box-shadow: none;
}
[data-sidebar="menu-button"][data-active="true"] {
  background-color: var(--sidebar-accent);
  color: var(--sidebar-accent-foreground);
  font-weight: 400;
  box-shadow: none;
}
/* Brand header — non-interactive, no hover */
[data-sidebar="menu-button"].sidebar-brand-btn,
[data-sidebar="menu-button"].sidebar-brand-btn:hover {
  background-color: transparent;
  box-shadow: none;
  cursor: default;
}
```

- [ ] **Step 2: Create `apps/portal/components/theme-provider.tsx`**

Exact copy from `apps/exam-management/admin/components/theme-provider.tsx`:

```tsx
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"

function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
      {...props}
    >
      <ThemeHotkey />
      {children}
    </NextThemesProvider>
  )
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  if (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  ) return true
  if (target.closest('[role="menu"],[role="dialog"],[role="listbox"],[role="combobox"]')) return true
  return false
}

function ThemeHotkey() {
  const { resolvedTheme, setTheme } = useTheme()
  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key.toLowerCase() !== "d") return
      if (isTypingTarget(event.target)) return
      setTheme(resolvedTheme === "dark" ? "light" : "dark")
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [resolvedTheme, setTheme])
  return null
}

export { ThemeProvider }
```

- [ ] **Step 3: Create `apps/portal/app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'

export const metadata: Metadata = {
  title: 'Exxat Workspace',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="theme-one" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/wuk5wqn.css" />
        <script
          src="https://kit.fontawesome.com/d9bd5774e0.js"
          crossOrigin="anonymous"
          async
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Copy logo SVGs into portal public folder**

```bash
mkdir -p apps/portal/public
cp apps/exam-management/admin/public/exxat-logo.svg apps/portal/public/exxat-logo.svg
cp apps/exam-management/admin/public/exxat-one.svg apps/portal/public/exxat-one.svg
```

- [ ] **Step 5: Commit**

```bash
git add apps/portal/app/globals.css apps/portal/components/theme-provider.tsx apps/portal/app/layout.tsx apps/portal/public/
git commit -m "feat(portal): add globals.css, layout, theme-provider, logo assets"
```

---

### Task 4: Product data

**Files:**
- Create: `apps/portal/lib/products.ts`

- [ ] **Step 1: Create `apps/portal/lib/products.ts`**

```ts
export type Product =
  | {
      id: string
      name: string
      adminUrl: string
      studentUrl: string
      extra?: { label: string; url: string }
      comingSoon?: never
    }
  | {
      id: string
      name: string
      comingSoon: true
      adminUrl?: never
      studentUrl?: never
      extra?: never
    }

export const PRODUCTS: Product[] = [
  {
    id: 'exam-management',
    name: 'Exam Management',
    adminUrl: process.env.NEXT_PUBLIC_EXAM_MANAGEMENT_ADMIN_URL ?? 'http://localhost:3001',
    studentUrl: process.env.NEXT_PUBLIC_EXAM_MANAGEMENT_STUDENT_URL ?? 'http://localhost:3002',
    extra: {
      label: 'Assessment Taker',
      url: process.env.NEXT_PUBLIC_EXAM_MANAGEMENT_TAKER_URL ?? 'http://localhost:5174',
    },
  },
  {
    id: 'pce',
    name: 'PCE',
    adminUrl: process.env.NEXT_PUBLIC_PCE_ADMIN_URL ?? 'http://localhost:3005',
    studentUrl: process.env.NEXT_PUBLIC_PCE_STUDENT_URL ?? 'http://localhost:3006',
  },
  {
    id: 'patient-log',
    name: 'Patient Log',
    adminUrl: process.env.NEXT_PUBLIC_PATIENT_LOG_ADMIN_URL ?? 'http://localhost:3003',
    studentUrl: process.env.NEXT_PUBLIC_PATIENT_LOG_STUDENT_URL ?? 'http://localhost:3004',
  },
  {
    id: 'skills-checklist',
    name: 'Skills Checklist',
    adminUrl: process.env.NEXT_PUBLIC_SKILLS_CHECKLIST_ADMIN_URL ?? 'http://localhost:3007',
    studentUrl: process.env.NEXT_PUBLIC_SKILLS_CHECKLIST_STUDENT_URL ?? 'http://localhost:3008',
  },
  {
    id: 'learning-contracts',
    name: 'Learning Contracts',
    adminUrl: process.env.NEXT_PUBLIC_LEARNING_CONTRACTS_ADMIN_URL ?? 'http://localhost:3009',
    studentUrl: process.env.NEXT_PUBLIC_LEARNING_CONTRACTS_STUDENT_URL ?? 'http://localhost:3010',
  },
  {
    id: 'faas',
    name: 'FaaS 2.0',
    comingSoon: true,
  },
]
```

- [ ] **Step 2: Commit**

```bash
git add apps/portal/lib/products.ts
git commit -m "feat(portal): add PRODUCTS config with env-var URL strategy"
```

---

### Task 5: App sidebar

**Files:**
- Create: `apps/portal/components/app-sidebar.tsx`

- [ ] **Step 1: Create `apps/portal/components/app-sidebar.tsx`**

```tsx
'use client'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  Avatar,
  AvatarFallback,
  useSidebar,
} from '@exxat/ds/packages/ui/src'

function AppHeader() {
  const { state } = useSidebar()
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="sidebar-brand-btn cursor-default select-none"
          aria-label="Exxat"
          tooltip="Exxat"
        >
          {state === 'collapsed' ? (
            <img
              src="/exxat-logo.svg"
              alt=""
              aria-hidden="true"
              width={32}
              height={32}
              className="shrink-0"
            />
          ) : (
            <img src="/exxat-one.svg" alt="Exxat One" className="h-6 w-auto" />
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export function AppSidebar() {
  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <AppHeader />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive tooltip="Apps">
                  <i className="fa-light fa-grid-2" aria-hidden="true" />
                  <span>Apps</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="Romit Soley">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg text-xs">RS</AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-0.5 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Romit Soley</span>
                <span className="truncate text-xs text-muted-foreground">
                  Product Designer II
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/portal/components/app-sidebar.tsx
git commit -m "feat(portal): add AppSidebar — logo, Apps nav, RS footer"
```

---

### Task 6: Site header

**Files:**
- Create: `apps/portal/components/site-header.tsx`

- [ ] **Step 1: Create `apps/portal/components/site-header.tsx`**

```tsx
'use client'

import { SidebarTrigger, Separator } from '@exxat/ds/packages/ui/src'

export function SiteHeader() {
  return (
    <header
      className="flex h-14 shrink-0 items-center gap-2 px-4"
      style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--background)' }}
    >
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-4" />
      <h1 className="text-base font-semibold">Workspace</h1>
    </header>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/portal/components/site-header.tsx
git commit -m "feat(portal): add SiteHeader with SidebarTrigger"
```

---

### Task 7: Product card

**Files:**
- Create: `apps/portal/components/product-card.tsx`

- [ ] **Step 1: Create `apps/portal/components/product-card.tsx`**

```tsx
'use client'

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@exxat/ds/packages/ui/src'
import type { Product } from '@/lib/products'

export function ProductCard({ product }: { product: Product }) {
  if (product.comingSoon) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{product.name}</CardTitle>
          <Badge variant="secondary" className="rounded">
            Coming Soon
          </Badge>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">{product.name}</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="More surfaces">
              <i
                className="fa-light fa-ellipsis-vertical"
                aria-hidden="true"
                style={{ fontSize: 13 }}
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <a href={product.studentUrl} target="_blank" rel="noreferrer">
                <i className="fa-light fa-user" aria-hidden="true" />
                Student
              </a>
            </DropdownMenuItem>
            {product.extra && (
              <DropdownMenuItem asChild>
                <a href={product.extra.url} target="_blank" rel="noreferrer">
                  <i className="fa-light fa-file-pen" aria-hidden="true" />
                  {product.extra.label}
                </a>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <Button asChild variant="default" className="w-full">
          <a href={product.adminUrl} target="_blank" rel="noreferrer">
            Open Admin
            <i className="fa-light fa-arrow-up-right" aria-hidden="true" />
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/portal/components/product-card.tsx
git commit -m "feat(portal): add ProductCard — Open Admin button + ⋯ dropdown"
```

---

### Task 8: Page

**Files:**
- Create: `apps/portal/app/page.tsx`

- [ ] **Step 1: Create `apps/portal/app/page.tsx`**

```tsx
'use client'

import { SidebarProvider, SidebarInset } from '@exxat/ds/packages/ui/src'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { ProductCard } from '@/components/product-card'
import { PRODUCTS } from '@/lib/products'

export default function WorkspacePage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <main className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
            {PRODUCTS.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/portal/app/page.tsx
git commit -m "feat(portal): add WorkspacePage — SidebarProvider + product card grid"
```

---

### Task 9: Install, run, verify

- [ ] **Step 1: Install dependencies from workspace root**

```bash
cd /Users/romitsoley/Work && pnpm install
```

Expected: pnpm resolves `@exxat/portal` and installs `next`, `react`, `next-themes`.

- [ ] **Step 2: Start the dev server**

```bash
cd /Users/romitsoley/Work/apps/portal && pnpm dev
```

Expected output includes:
```
▲ Next.js 15.x.x
- Local:   http://localhost:4000
```

- [ ] **Step 3: Verify in browser**

Open `http://localhost:4000`. Check:
- [ ] DS sidebar renders with Exxat One wordmark (expanded) / circular mark (collapsed)
- [ ] "Apps" nav item is visible and active
- [ ] "Romit Soley / Product Designer II" footer with RS avatar
- [ ] 2-column card grid: Exam Management, PCE, Patient Log, Skills Checklist, Learning Contracts, FaaS 2.0
- [ ] FaaS card shows "Coming Soon" badge, no button
- [ ] "Open Admin" button on each active card links to correct localhost port (hover to verify URL in browser status bar)
- [ ] `⋯` dropdown on each card shows Student (and Assessment Taker for Exam Management)
- [ ] Clicking "Open Admin" opens the correct localhost URL in a new tab
- [ ] Sidebar collapse/expand toggles logo swap correctly

- [ ] **Step 4: Final commit**

```bash
git add apps/portal/
git commit -m "feat(portal): ship v1 — Exxat Workspace portal on port 4000"
```
