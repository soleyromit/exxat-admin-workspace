# App Portal — Design Spec
**Date:** 2026-05-14  
**Author:** Romit Soley  
**Status:** Approved — ready for implementation

---

## Overview

A standalone Next.js app (`apps/portal/`) that serves as a central launcher for all Exxat workspace products. Primary use case: Romit opens the portal before a review with Aarti to quickly launch any product's admin surface. Secondary use case: developer access to student and extra surfaces via a hidden dropdown.

---

## App Identity

| Field | Value |
|---|---|
| Path | `apps/portal/` |
| Package | `@exxat/portal` |
| Port | `3000` |
| DS | Admin DS (`@exxat/ds`) |
| Theme | `theme-one` (Exxat One Lavender) |
| Stack | Next.js 16 + Tailwind v4 + Exxat-DS |

---

## Layout & Shell

DS `SidebarProvider` + `SidebarInset` with `variant="inset"` `collapsible="icon"` — identical shell to the admin apps.

### Sidebar (`app-sidebar.tsx`)
- **Header:** Exxat logo — wordmark when expanded, circular mark when collapsed (same swap logic as admin apps using `useSidebar().state`)
- **Nav:** Single item — `fa-grid-2` "Apps" — always active (no routing needed for v1)
- **Footer:** Static display of "Romit Soley" with avatar initials `RS`

### Site Header (`site-header.tsx`)
- `SidebarTrigger` on the left
- `Separator` (vertical)
- Page title: **"Workspace"**

### Main Content
- `SidebarInset` > site header + scrollable body
- Body: `2-column responsive grid` (`grid-cols-1 sm:grid-cols-2`) of product cards
- Padding: `p-6`

---

## Product Cards

Each card uses DS `Card` with:

| Slot | Content |
|---|---|
| `CardHeader` | `CardTitle` (product name) + `DropdownMenu` trigger (`⋯` ghost icon-sm, positioned `ml-auto`) |
| `CardContent` | `Button variant="default"` full-width — "Open Admin" with `fa-arrow-up-right` icon — `target="_blank"` to `localhost:{adminPort}` |

### Dropdown (secondary surfaces)
DS `DropdownMenu` on the `⋯` button in `CardHeader`. Opens on click. Items:
- `fa-user` Student → `localhost:{studentPort}` (opens `target="_blank"`)
- `fa-file-pen` Assessment Taker → `localhost:5174` *(exam-management only)*

Aarti sees only the "Open Admin" button. The `⋯` is a standard DS ghost icon button — unobtrusive, not labelled.

---

## Product Data

Static config object in `lib/products.ts`:

```ts
export const PRODUCTS = [
  {
    id: 'exam-management',
    name: 'Exam Management',
    adminPort: 3001,
    studentPort: 3002,
    extra: { label: 'Assessment Taker', port: 5174 },
  },
  {
    id: 'pce',
    name: 'PCE',
    adminPort: 3005,
    studentPort: 3006,
  },
  {
    id: 'patient-log',
    name: 'Patient Log',
    adminPort: 3003,
    studentPort: 3004,
  },
  {
    id: 'skills-checklist',
    name: 'Skills Checklist',
    adminPort: 3007,
    studentPort: 3008,
  },
  {
    id: 'learning-contracts',
    name: 'Learning Contracts',
    adminPort: 3009,
    studentPort: 3010,
  },
  {
    id: 'faas',
    name: 'FaaS 2.0',
    comingSoon: true,
  },
]
```

### FaaS Card
No buttons. Shows product name + DS `Badge variant="secondary"` with label "Coming Soon". Badge uses `rounded` (rectangular shape) as per workspace convention.

---

## Localhost Links

All URLs are `http://localhost:{port}` opened via `window.open(url, '_blank')` or `<a href target="_blank" rel="noreferrer">` inside DS `Button asChild`.

| Product | Admin | Student | Extra |
|---|---|---|---|
| Exam Management | `http://localhost:3001` | `http://localhost:3002` | `http://localhost:5174` |
| PCE | `http://localhost:3005` | `http://localhost:3006` | — |
| Patient Log | `http://localhost:3003` | `http://localhost:3004` | — |
| Skills Checklist | `http://localhost:3007` | `http://localhost:3008` | — |
| Learning Contracts | `http://localhost:3009` | `http://localhost:3010` | — |
| FaaS 2.0 | — | — | — |

---

## `'use client'` Requirements

| File | Reason |
|---|---|
| `components/app-sidebar.tsx` | uses `useSidebar()` hook |
| `components/site-header.tsx` | uses `useSidebar()` hook |
| `components/product-card.tsx` | uses `DropdownMenu` (Radix interactive) |
| `app/page.tsx` | wraps `SidebarProvider` (must be client if passing state) — or extract a `<WorkspacePage>` client wrapper and keep `page.tsx` as a server component |

## Button → Link Pattern

DS `Button` with `asChild` renders as an anchor — no wrapping div, correct semantics:

```tsx
<Button asChild variant="default" className="w-full">
  <a href={`http://localhost:${adminPort}`} target="_blank" rel="noreferrer">
    Open Admin
    <i className="fa-light fa-arrow-up-right" aria-hidden="true" />
  </a>
</Button>
```

Same pattern for dropdown items — `DropdownMenuItem asChild` + `<a>`.

---

## File Structure

```
apps/portal/
├── package.json
├── next.config.ts              ← @exxat/ds webpack alias
├── tsconfig.json               ← extends tsconfig.base.json
├── app/
│   ├── globals.css             ← imports exxat-ds theme.css + tailwindcss
│   ├── layout.tsx              ← html.theme-one + Typekit + FA Pro
│   └── page.tsx                ← SidebarProvider + AppSidebar + SidebarInset + card grid
├── components/
│   ├── app-sidebar.tsx         ← DS Sidebar shell (logo, Apps nav item, footer)
│   ├── site-header.tsx         ← SidebarTrigger + "Workspace" title
│   └── product-card.tsx        ← Card + Open Admin button + ⋯ dropdown
└── lib/
    └── products.ts             ← PRODUCTS static config
```

---

## Icons (Font Awesome Pro)

| Element | Icon |
|---|---|
| Apps nav item | `fa-light fa-grid-2` |
| Open Admin button | `fa-light fa-arrow-up-right` |
| Student dropdown item | `fa-light fa-user` |
| Assessment Taker dropdown item | `fa-light fa-file-pen` |
| Sidebar toggle (DS built-in) | handled by DS `SidebarTrigger` |

---

## Workspace Integration

- Add `apps/portal` to `pnpm-workspace.yaml`
- Add row to `docs/PRODUCTS.md` with `id: portal`, `status: active`, `admin_port: 3000`
- No student app for the portal

---

## Out of Scope (v1)

- Live server status indicators (green/gray dot per product)
- Starting/stopping dev servers from the portal
- Recently visited tracking
- Search across products
- Authentication
