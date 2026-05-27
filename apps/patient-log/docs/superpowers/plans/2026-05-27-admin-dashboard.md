# Patient Log Admin Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Patient Log admin app at port 3003 and build a dashboard showing student encounter-logging status, at-risk students, encounter type breakdown, and full student list.

**Architecture:** Next.js 15 App Router with a route group `(app)` that wraps all pages in a sidebar layout. Dashboard lives at `/dashboard`. All data is mock (static arrays). Components vendored from `apps/exam-management/admin/` with import paths updated to point at `@exxat/ds/packages/ui/src`.

**Tech Stack:** Next.js 15, TypeScript, Tailwind v4, `@exxat/ds/packages/ui/src`, recharts (for DS Chart compat), next-themes

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `apps/patient-log/admin/package.json` | Create | App metadata, deps, scripts |
| `apps/patient-log/admin/next.config.ts` | Create | DS alias, externalDir |
| `apps/patient-log/admin/tsconfig.json` | Create | Extends base, path aliases |
| `apps/patient-log/admin/postcss.config.mjs` | Create | Tailwind v4 postcss |
| `apps/patient-log/admin/app/globals.css` | Create | DS theme + DataTable tokens |
| `apps/patient-log/admin/app/layout.tsx` | Create | Root layout — fonts, theme class |
| `apps/patient-log/admin/app/page.tsx` | Create | Redirect to /dashboard |
| `apps/patient-log/admin/app/(app)/layout.tsx` | Create | SidebarProvider + SidebarInset |
| `apps/patient-log/admin/app/(app)/dashboard/page.tsx` | Create | Main dashboard page |
| `apps/patient-log/admin/lib/mock-data.ts` | Create | StudentLog + EncounterType mock arrays |
| `apps/patient-log/admin/components/theme-provider.tsx` | Vendor | Copy from exam-management (no changes) |
| `apps/patient-log/admin/components/site-header.tsx` | Create | Simplified (no PersonaSwitcher, no breadcrumbs) |
| `apps/patient-log/admin/components/app-sidebar.tsx` | Create | Patient Log nav (Dashboard only for Phase 1) |
| `apps/patient-log/admin/components/table-properties/types.ts` | Vendor | Copy from exam-management (no changes) |
| `apps/patient-log/admin/components/data-table/types.ts` | Vendor | Copy from exam-management, update `@/components/table-properties` → `@/components/table-properties/types` |
| `apps/patient-log/admin/components/data-table/pagination.tsx` | Vendor | Copy from exam-management, update DS imports |
| `apps/patient-log/admin/components/data-table/index.tsx` | Vendor | Copy from exam-management, update DS imports + remove `@/lib/utils` → use `cn` from DS |
| `apps/patient-log/admin/components/key-metrics/index.tsx` | Vendor | Copy from exam-management (already uses DS imports) |
| `apps/patient-log/admin/components/dashboard/kpi-band.tsx` | Create | 4 KPI tiles using KeyMetrics |
| `apps/patient-log/admin/components/dashboard/at-risk-table.tsx` | Create | At-risk DataTable (top 5) |
| `apps/patient-log/admin/components/dashboard/encounter-chart.tsx` | Create | Horizontal bar breakdown (div-based, DS tokens) |
| `apps/patient-log/admin/components/dashboard/all-students-table.tsx` | Create | Full DataTable with search |

---

## Task 1: Scaffold App Config Files

**Files:**
- Create: `apps/patient-log/admin/package.json`
- Create: `apps/patient-log/admin/next.config.ts`
- Create: `apps/patient-log/admin/tsconfig.json`
- Create: `apps/patient-log/admin/postcss.config.mjs`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@exxat/patient-log-admin",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack --port 3003",
    "build": "next build",
    "start": "next start --port 3003",
    "typecheck": "tsc --noEmit",
    "lint": "next lint"
  },
  "dependencies": {
    "clsx": "^2.1.1",
    "next": "^15.3.1",
    "next-themes": "^0.4.6",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "recharts": "^2.15.4",
    "sonner": "^2.0.7",
    "tailwind-merge": "^3.5.0"
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

- [ ] **Step 2: Create next.config.ts**

```ts
import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  experimental: { externalDir: true },
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

- [ ] **Step 3: Create tsconfig.json**

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

- [ ] **Step 4: Create postcss.config.mjs**

```mjs
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}

export default config
```

- [ ] **Step 5: Install dependencies**

```bash
cd /Users/romitsoley/Work/apps/patient-log/admin && pnpm install
```

Expected: packages installed, no errors.

- [ ] **Step 6: Commit**

```bash
git add apps/patient-log/admin/package.json apps/patient-log/admin/next.config.ts apps/patient-log/admin/tsconfig.json apps/patient-log/admin/postcss.config.mjs
git commit -m "feat(patient-log): scaffold admin app config"
```

---

## Task 2: App Shell (globals.css + layouts)

**Files:**
- Create: `apps/patient-log/admin/app/globals.css`
- Create: `apps/patient-log/admin/app/layout.tsx`
- Create: `apps/patient-log/admin/app/page.tsx`

- [ ] **Step 1: Create app/globals.css**

```css
@import '../../../../exxat-ds/packages/ui/src/theme.css';
@import "tailwindcss";
@source '../../../../exxat-ds/packages/ui/src/**/*.{ts,tsx}';

:root {
  --sidebar: var(--brand-tint);
}

.dark {
  --sidebar: oklch(0.245 0.015 270);
}

:root {
  --dt-header-bg:       var(--background);
  --dt-row-bg:          var(--background);
  --dt-row-hover:       oklch(0.972 0.001 270);
  --dt-row-selected:    oklch(0.962 0.003 260);
  --dt-row-selected-fg: var(--foreground);
  --dt-group-bg:        oklch(0.972 0.001 270);
  --sticky-edge-fade:   oklch(0 0 0 / 0.08);
}

.dark {
  --dt-row-hover:       oklch(0.24 0.01 270);
  --dt-row-selected:    oklch(0.27 0.02 270);
  --dt-group-bg:        oklch(0.24 0.01 270);
  --sticky-edge-fade:   oklch(0 0 0 / 0.32);
}

@theme inline {
  --color-dt-header-bg:       var(--dt-header-bg);
  --color-dt-row-bg:          var(--dt-row-bg);
  --color-dt-row-hover:       var(--dt-row-hover);
  --color-dt-row-selected:    var(--dt-row-selected);
  --color-dt-row-selected-fg: var(--dt-row-selected-fg);
  --color-dt-group-bg:        var(--dt-group-bg);
}

[data-slot="sidebar-container"] {
  border-inline-end-color: var(--sidebar-border);
  border-inline-start-color: var(--sidebar-border);
}

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
[data-sidebar="menu"],
[data-sidebar="menu-sub"] {
  list-style: none;
  margin: 0;
  padding: 0;
}

[data-slot="tabs"][data-orientation="horizontal"] {
  display: flex;
  flex-direction: column;
}

td [data-slot="checkbox"]::after,
th [data-slot="checkbox"]::after {
  display: none;
}
```

- [ ] **Step 2: Create app/layout.tsx**

```tsx
import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'

export const metadata: Metadata = { title: 'Patient Log — Admin' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="theme-one" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
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

- [ ] **Step 3: Create app/page.tsx**

```tsx
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/dashboard')
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/patient-log/admin/app/
git commit -m "feat(patient-log): add app shell — globals.css, root layout, redirect"
```

---

## Task 3: Base Components

**Files:**
- Create: `apps/patient-log/admin/components/theme-provider.tsx`
- Create: `apps/patient-log/admin/components/site-header.tsx`
- Create: `apps/patient-log/admin/components/app-sidebar.tsx`

- [ ] **Step 1: Vendor theme-provider.tsx**

Copy `/Users/romitsoley/Work/apps/exam-management/admin/components/theme-provider.tsx` verbatim to `apps/patient-log/admin/components/theme-provider.tsx`. No changes needed — it has no product-specific imports.

- [ ] **Step 2: Create site-header.tsx**

```tsx
'use client'

import { useSidebar, Button, Tip } from '@exxat/ds/packages/ui/src'

export function SiteHeader({ title }: { title: string }) {
  const { toggleSidebar, state: sidebarState } = useSidebar()

  return (
    <header
      style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--background)' }}
      className="flex h-14 items-center gap-4 px-6 text-foreground"
    >
      <Tip label={sidebarState === 'collapsed' ? 'Expand navigation' : 'Collapse navigation'}>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleSidebar}
          aria-label={sidebarState === 'collapsed' ? 'Expand navigation' : 'Collapse navigation'}
          className={sidebarState !== 'collapsed' ? 'text-foreground' : 'text-muted-foreground'}
        >
          <i className="fa-light fa-sidebar" aria-hidden="true" style={{ fontSize: 16 }} />
        </Button>
      </Tip>

      <div
        style={{ width: 1, alignSelf: 'stretch', margin: '10px 0', background: 'var(--border)', flexShrink: 0 }}
        aria-hidden="true"
      />

      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold truncate">{title}</h1>
      </div>
    </header>
  )
}
```

- [ ] **Step 3: Create app-sidebar.tsx**

```tsx
'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  useSidebar,
} from '@exxat/ds/packages/ui/src'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: 'fa-grid-2' },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { state } = useSidebar()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="cursor-default select-none"
              aria-label="Patient Log"
              tooltip="Patient Log"
            >
              {state === 'collapsed' ? (
                <i className="fa-light fa-notes-medical text-brand-color" aria-hidden="true" style={{ fontSize: 20 }} />
              ) : (
                <span className="font-semibold text-sm" style={{ color: 'var(--brand-color)' }}>Patient Log</span>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.label}
                    data-active={pathname === item.href || undefined}
                  >
                    <Link href={item.href}>
                      <i className={`fa-light ${item.icon}`} aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter />
    </Sidebar>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/patient-log/admin/components/
git commit -m "feat(patient-log): add base components — theme-provider, site-header, app-sidebar"
```

---

## Task 4: Vendor DataTable

**Files:**
- Create: `apps/patient-log/admin/components/table-properties/types.ts`
- Create: `apps/patient-log/admin/components/data-table/types.ts`
- Create: `apps/patient-log/admin/components/data-table/pagination.tsx`
- Create: `apps/patient-log/admin/components/data-table/index.tsx`

- [ ] **Step 1: Copy table-properties/types.ts verbatim**

Copy `/Users/romitsoley/Work/apps/exam-management/admin/components/table-properties/types.ts` → `apps/patient-log/admin/components/table-properties/types.ts`. No changes needed.

- [ ] **Step 2: Copy data-table/types.ts with one import fix**

Copy `/Users/romitsoley/Work/apps/exam-management/admin/components/data-table/types.ts` → `apps/patient-log/admin/components/data-table/types.ts`.

The file imports `FilterOperator, ConditionalRule` from `@/components/table-properties/types` — this path is the same in patient-log, so no changes needed.

- [ ] **Step 3: Copy data-table/pagination.tsx**

Copy `/Users/romitsoley/Work/apps/exam-management/admin/components/data-table/pagination.tsx` → `apps/patient-log/admin/components/data-table/pagination.tsx`. No changes needed (uses DS imports via `@exxat/ds/packages/ui/src` which resolves the same way).

- [ ] **Step 4: Copy data-table/index.tsx**

Copy `/Users/romitsoley/Work/apps/exam-management/admin/components/data-table/index.tsx` → `apps/patient-log/admin/components/data-table/index.tsx`.

After copying, open the file and check for any import of `@/lib/utils`. Replace any occurrence of:
```ts
import { cn } from '@/lib/utils'
```
with:
```ts
import { cn } from '@exxat/ds/packages/ui/src'
```

Also remove any import of `row-actions` if it references exam-management-specific action types. The DataTable itself doesn't use row-actions — they're passed in via `cell` renderers, so this import (if present) is safe to remove.

- [ ] **Step 5: Commit**

```bash
git add apps/patient-log/admin/components/table-properties/ apps/patient-log/admin/components/data-table/
git commit -m "feat(patient-log): vendor DataTable + table-properties types"
```

---

## Task 5: Vendor KeyMetrics

**Files:**
- Create: `apps/patient-log/admin/components/key-metrics/index.tsx`

- [ ] **Step 1: Copy key-metrics/index.tsx**

Copy `/Users/romitsoley/Work/apps/exam-management/admin/components/key-metrics/index.tsx` → `apps/patient-log/admin/components/key-metrics/index.tsx`.

The file already uses `@exxat/ds/packages/ui/src` for all DS imports. The only things to check:
- Any reference to `@/lib/utils` → replace with `import { cn } from '@exxat/ds/packages/ui/src'`
- The `useAskLeo` stub and `AskLeoShortcutKbds` stub are already inline in the file — keep them as-is.

- [ ] **Step 2: Commit**

```bash
git add apps/patient-log/admin/components/key-metrics/
git commit -m "feat(patient-log): vendor KeyMetrics component"
```

---

## Task 6: Mock Data

**Files:**
- Create: `apps/patient-log/admin/lib/mock-data.ts`

- [ ] **Step 1: Create lib/mock-data.ts**

```ts
export type StudentStatus = 'on-track' | 'at-risk' | 'completed'

export interface StudentLog {
  id: string
  name: string
  program: string
  loggedCount: number
  targetCount: number
  status: StudentStatus
}

export interface EncounterType {
  label: string
  count: number
  percentage: number
}

export const STUDENTS: StudentLog[] = [
  { id: '1',  name: 'Emily Chen',      program: 'Nursing',   loggedCount: 18, targetCount: 20, status: 'on-track'  },
  { id: '2',  name: 'James Wilson',    program: 'PA Studies', loggedCount: 6,  targetCount: 20, status: 'at-risk'   },
  { id: '3',  name: 'Maria Garcia',    program: 'Nursing',   loggedCount: 20, targetCount: 20, status: 'completed' },
  { id: '4',  name: 'Robert Kim',      program: 'PT',        loggedCount: 4,  targetCount: 20, status: 'at-risk'   },
  { id: '5',  name: 'Aisha Patel',     program: 'Nursing',   loggedCount: 15, targetCount: 20, status: 'on-track'  },
  { id: '6',  name: 'Carlos Rivera',   program: 'OT',        loggedCount: 20, targetCount: 20, status: 'completed' },
  { id: '7',  name: 'Sarah Thompson',  program: 'PA Studies', loggedCount: 3,  targetCount: 20, status: 'at-risk'   },
  { id: '8',  name: 'David Lee',       program: 'Nursing',   loggedCount: 17, targetCount: 20, status: 'on-track'  },
  { id: '9',  name: 'Fatima Hasan',    program: 'PT',        loggedCount: 19, targetCount: 20, status: 'on-track'  },
  { id: '10', name: 'Michael Brown',   program: 'OT',        loggedCount: 5,  targetCount: 20, status: 'at-risk'   },
  { id: '11', name: 'Lisa Nakamura',   program: 'Nursing',   loggedCount: 20, targetCount: 20, status: 'completed' },
  { id: '12', name: 'Omar Khalid',     program: 'PA Studies', loggedCount: 12, targetCount: 20, status: 'on-track'  },
]

export const ENCOUNTER_TYPES: EncounterType[] = [
  { label: 'Primary Care', count: 240, percentage: 48 },
  { label: 'Acute Care',   count: 150, percentage: 30 },
  { label: 'Preventive',   count: 90,  percentage: 18 },
  { label: 'Other',        count: 20,  percentage: 4  },
]

// Derived KPIs — computed from STUDENTS for consistency
export function getKPIs() {
  const total    = STUDENTS.length
  const atRisk   = STUDENTS.filter(s => s.status === 'at-risk').length
  const onTrack  = STUDENTS.filter(s => s.status !== 'at-risk').length
  const avgLogged = Math.round(STUDENTS.reduce((sum, s) => sum + s.loggedCount, 0) / total)
  const target   = STUDENTS[0].targetCount
  return { total, atRisk, onTrack, onTrackPct: Math.round((onTrack / total) * 100), avgLogged, target }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/patient-log/admin/lib/mock-data.ts
git commit -m "feat(patient-log): add student log mock data"
```

---

## Task 7: Dashboard Components

**Files:**
- Create: `apps/patient-log/admin/components/dashboard/kpi-band.tsx`
- Create: `apps/patient-log/admin/components/dashboard/at-risk-table.tsx`
- Create: `apps/patient-log/admin/components/dashboard/encounter-chart.tsx`
- Create: `apps/patient-log/admin/components/dashboard/all-students-table.tsx`

- [ ] **Step 1: Create components/dashboard/kpi-band.tsx**

```tsx
import { KeyMetrics, type MetricItem } from '@/components/key-metrics'
import { getKPIs } from '@/lib/mock-data'

export function KpiBand() {
  const { total, onTrackPct, atRisk, avgLogged, target } = getKPIs()

  const metrics: MetricItem[] = [
    {
      id: 'total',
      label: 'Total Students',
      value: String(total),
      delta: 'Enrolled this term',
      trend: 'neutral',
    },
    {
      id: 'on-track',
      label: 'On Track',
      value: `${onTrackPct}%`,
      delta: '+3% vs last term',
      trend: 'up',
    },
    {
      id: 'at-risk',
      label: 'At Risk',
      value: String(atRisk),
      delta: 'Below 50% of target',
      trend: 'down',
    },
    {
      id: 'avg',
      label: 'Avg Encounters',
      value: `${avgLogged} / ${target}`,
      delta: 'Per student this term',
      trend: 'neutral',
    },
  ]

  return <KeyMetrics metrics={metrics} variant="flat" metricsSingleRow />
}
```

- [ ] **Step 2: Create components/dashboard/encounter-chart.tsx**

```tsx
import { ENCOUNTER_TYPES } from '@/lib/mock-data'

export function EncounterChart() {
  const max = Math.max(...ENCOUNTER_TYPES.map(e => e.percentage))

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        backgroundColor: 'var(--background)',
        padding: '20px 24px',
        height: '100%',
      }}
    >
      <p className="text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
        Encounter Type Breakdown
      </p>
      <p className="text-xs mb-4" style={{ color: 'var(--muted-foreground)' }}>
        Distribution across all logged encounters
      </p>

      <div className="flex flex-col gap-3">
        {ENCOUNTER_TYPES.map((enc) => (
          <div key={enc.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs" style={{ color: 'var(--foreground)' }}>{enc.label}</span>
              <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                {enc.percentage}%
              </span>
            </div>
            <div
              style={{
                height: 6,
                borderRadius: 3,
                backgroundColor: 'var(--muted)',
                overflow: 'hidden',
              }}
              role="img"
              aria-label={`${enc.label}: ${enc.percentage}%`}
            >
              <div
                style={{
                  height: '100%',
                  width: `${(enc.percentage / max) * 100}%`,
                  backgroundColor: 'var(--brand-color)',
                  borderRadius: 3,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create components/dashboard/at-risk-table.tsx**

```tsx
'use client'

import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import { Badge } from '@exxat/ds/packages/ui/src'
import { STUDENTS, type StudentLog } from '@/lib/mock-data'

const AT_RISK_COLS: ColumnDef<StudentLog>[] = [
  {
    key: 'name',
    label: 'Student',
    width: 180,
    cell: (row) => <span className="text-sm font-medium">{row.name}</span>,
  },
  {
    key: 'program',
    label: 'Program',
    width: 120,
    cell: (row) => <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{row.program}</span>,
  },
  {
    key: 'loggedCount',
    label: 'Logged / Target',
    width: 140,
    cell: (row) => (
      <span className="text-sm">
        <span className="font-medium" style={{ color: 'var(--destructive)' }}>{row.loggedCount}</span>
        <span style={{ color: 'var(--muted-foreground)' }}> / {row.targetCount}</span>
      </span>
    ),
  },
]

const atRiskStudents = STUDENTS.filter(s => s.status === 'at-risk').slice(0, 5)

export function AtRiskTable() {
  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        backgroundColor: 'var(--background)',
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Students at Risk</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Below 50% of encounter target</p>
        </div>
        <Badge variant="destructive">{atRiskStudents.length} students</Badge>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <DataTable
          data={atRiskStudents}
          columns={AT_RISK_COLS}
          getRowId={(row) => row.id}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create components/dashboard/all-students-table.tsx**

```tsx
'use client'

import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import { Badge } from '@exxat/ds/packages/ui/src'
import { STUDENTS, type StudentLog, type StudentStatus } from '@/lib/mock-data'

const STATUS_LABELS: Record<StudentStatus, string> = {
  'on-track':  'On Track',
  'at-risk':   'At Risk',
  'completed': 'Completed',
}

const STATUS_VARIANTS: Record<StudentStatus, 'default' | 'destructive' | 'outline'> = {
  'on-track':  'outline',
  'at-risk':   'destructive',
  'completed': 'default',
}

const ALL_STUDENTS_COLS: ColumnDef<StudentLog>[] = [
  {
    key: 'name',
    label: 'Student',
    width: 200,
    sortable: true,
    cell: (row) => <span className="text-sm font-medium">{row.name}</span>,
  },
  {
    key: 'program',
    label: 'Program',
    width: 140,
    sortable: true,
    cell: (row) => <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{row.program}</span>,
  },
  {
    key: 'loggedCount',
    label: 'Logged',
    width: 90,
    sortable: true,
    cell: (row) => <span className="text-sm font-medium">{row.loggedCount}</span>,
  },
  {
    key: 'targetCount',
    label: 'Target',
    width: 80,
    cell: (row) => <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{row.targetCount}</span>,
  },
  {
    key: 'status',
    label: 'Status',
    width: 120,
    sortable: true,
    cell: (row) => (
      <Badge variant={STATUS_VARIANTS[row.status]}>
        {STATUS_LABELS[row.status]}
      </Badge>
    ),
  },
]

export function AllStudentsTable() {
  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        backgroundColor: 'var(--background)',
        overflow: 'hidden',
      }}
    >
      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>All Students</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{STUDENTS.length} enrolled this term</p>
      </div>
      <DataTable
        data={STUDENTS}
        columns={ALL_STUDENTS_COLS}
        getRowId={(row) => row.id}
        searchable
        defaultSort={{ key: 'status', dir: 'asc' }}
      />
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/patient-log/admin/components/dashboard/
git commit -m "feat(patient-log): add dashboard components — KPI band, at-risk table, encounter chart, all-students table"
```

---

## Task 8: App Layout + Dashboard Page

**Files:**
- Create: `apps/patient-log/admin/app/(app)/layout.tsx`
- Create: `apps/patient-log/admin/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Create app/(app)/layout.tsx**

```tsx
import { SidebarProvider, SidebarInset, TooltipProvider, Toaster } from '@exxat/ds/packages/ui/src'
import { AppSidebar } from '@/components/app-sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <SidebarProvider className="h-svh">
        <AppSidebar />
        <SidebarInset className="flex flex-col overflow-x-hidden" style={{ paddingBottom: 0 }}>
          {children}
        </SidebarInset>
      </SidebarProvider>
      <Toaster position="bottom-center" />
    </TooltipProvider>
  )
}
```

- [ ] **Step 2: Create app/(app)/dashboard/page.tsx**

```tsx
import { SiteHeader } from '@/components/site-header'
import { KpiBand } from '@/components/dashboard/kpi-band'
import { AtRiskTable } from '@/components/dashboard/at-risk-table'
import { EncounterChart } from '@/components/dashboard/encounter-chart'
import { AllStudentsTable } from '@/components/dashboard/all-students-table'

export default function DashboardPage() {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <SiteHeader title="Dashboard" />

      <main className="flex-1 overflow-y-auto" style={{ padding: 24, backgroundColor: 'var(--background)' }}>
        {/* KPI band */}
        <div className="mb-6">
          <KpiBand />
        </div>

        {/* At-risk + encounter type row */}
        <div className="grid grid-cols-2 gap-4 mb-6" style={{ gridTemplateColumns: '1fr 340px' }}>
          <AtRiskTable />
          <EncounterChart />
        </div>

        {/* All students */}
        <AllStudentsTable />
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add "apps/patient-log/admin/app/(app)/"
git commit -m "feat(patient-log): wire app layout and dashboard page"
```

---

## Task 9: Run the Server

- [ ] **Step 1: Start the dev server**

```bash
cd /Users/romitsoley/Work/apps/patient-log/admin && pnpm dev
```

Expected: Turbopack compiles, server starts at http://localhost:3003. Browser opens to `/dashboard`.

- [ ] **Step 2: Verify dashboard renders**

Open http://localhost:3003 in the browser. Confirm:
- Sidebar appears with "Patient Log" header and Dashboard nav item
- KPI band shows 4 tiles (Total Students, On Track, At Risk, Avg Encounters)
- At-risk table shows at-risk students (4 rows)
- Encounter chart shows 4 bars
- All Students table shows all 12 students with sortable columns and search

- [ ] **Step 3: Fix any type errors**

```bash
cd /Users/romitsoley/Work/apps/patient-log/admin && pnpm typecheck
```

Fix any reported errors before declaring done.
