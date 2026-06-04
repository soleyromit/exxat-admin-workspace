# Portal Admin — UI Patterns + Compliance Reference

> Living doc. Read at session start for any Portal UI work. Updated in the same commit whenever a new pattern is established.
> Status: Early active — app shell exists, product UI in progress. Last updated: 2026-06-01.

---

## ⚠️ Early-stage product

Portal is the workspace-wide cross-product navigation hub. Minimal UI exists today. Patterns documented here are the workspace standard applied to this product — expand as screens are built.

---

## 0. Product Identity

| App | Package | Port | Path |
|---|---|---|---|
| Admin | `@exxat/portal` | 3100 | `apps/portal/` |

**DS:** `@exxatdesignux/ui` (canonical npm)  
**CSS:** `@import '@exxatdesignux/ui/globals.css'` in root `app/layout.tsx`  
**Theme:** `<html lang="en" className="theme-one">`  
**Purpose:** Cross-product navigation + workspace-level access control

---

## 1. DS Imports (non-negotiable)

```ts
import { Button, DataTable, Sheet, Dialog, ListPageTemplate, KeyMetrics, LocalBanner, StatusBadge } from '@exxatdesignux/ui'
```

Never use `@exxat/ds`, `@exxatdesignux/ui — packages/ui/src`, or any raw HTML primitive for a DS organism.

---

## 2. Page Shell Anatomy

Portal uses the workspace-standard single-header shell (same as PCE, not the EM two-tier pattern):

```tsx
// SiteHeader — top bar with sidebar toggle + title + primary action
<SiteHeader title="Portal" />

// Content area
<div className="flex flex-1 flex-col gap-0 min-w-0 overflow-auto">
  {/* page content */}
</div>
```

For list pages, wrap content in `ListPageTemplate` — never build a custom page shell.

---

## 3. Known Patterns

### Cross-product navigation

Portal links to all active products. Each product entry is a card/row — use `DataTable` or flat list, never hand-rolled `<table>`. Product status chips use `StatusBadge` (`status="beta"` / `status="new"` etc.).

### Access control displays

Permission indicators are informational — use `StatusBadge variant="dot"` in tight spaces, `StatusBadge` (pill) in table cells. Never hand-roll colored `<span>` chips.

---

## 4. Banned Patterns

All workspace-level bans apply (from `docs/governance/design-anti-patterns.md`). Portal-specific additions:

| Banned | Use instead |
|---|---|
| Raw `<button>` | `<Button variant="..." size="...">` |
| Hand-rolled status chip | `<StatusBadge status="...">` |
| `toast()` for errors | `<LocalBanner variant="error" ...>` |
| Hardcoded hex/rgb color | `var(--token)` |
| Custom page shell | `<ListPageTemplate>` |
| `<i className="fa-...">` without `aria-hidden="true"` | Add `aria-hidden="true"` always |

---

## 5. Open Product Questions

- Screen purpose map not yet defined — add §0 Screen Purpose Map when first 3 screens are built
- AI layer map pending product scope definition
- No Granola decisions captured yet — run intake when first design meeting happens

---

> Expand this doc in the same commit as each new screen. Never let it fall more than one sprint behind.
