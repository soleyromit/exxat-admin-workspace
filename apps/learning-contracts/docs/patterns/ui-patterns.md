# Learning Contracts Admin — UI Patterns + Compliance Reference

> Living doc. Read at session start for any Learning Contracts UI work.
> Status: NOT YET SCAFFOLDED — this file codifies rules to apply when scaffolding begins. Last updated: 2026-06-01.

---

## ⚠️ Not yet scaffolded

No app code exists. These patterns are pre-scaffolding rules that must be followed when the first screen is built. Do not invent product-specific patterns — wait for real Granola decisions.

When scaffolding begins: add §0 Screen Purpose Map before writing the first JSX file.

---

## 0. Product Identity

| App | Package | Port | Path |
|---|---|---|---|
| Admin | `@exxat/learning-contracts-admin` | 3009 | `apps/learning-contracts/admin/` |
| Student | `@exxat/learning-contracts-student` | 3010 | `apps/learning-contracts/student/` |

**DS (admin):** `@exxatdesignux/ui` (canonical npm)  
**DS (student):** `@exxat/student/components/ui/*` from `studentUX/src/`  
**Admin CSS:** `@import '@exxatdesignux/ui/globals.css'`  
**Student CSS:** `@import '../../../../studentUX/src/styles/globals.css'`  
**Admin theme:** `<html lang="en" className="theme-one">`

---

## 1. DS Imports — Admin (non-negotiable)

```ts
import { Button, DataTable, Sheet, Dialog, ListPageTemplate, KeyMetrics, LocalBanner, StatusBadge } from '@exxatdesignux/ui'
```

Never use `@exxat/ds`, `exxat-ds/packages/ui/src`, or raw HTML primitives for DS organisms.

---

## 2. Pre-Scaffolding Checklist

Before writing the first JSX file:

1. Run `ds-adoption-reviewer` — state "I'm about to write the first component for learning-contracts/admin"
2. Read `docs/governance/ds-component-examples.md` — canonical usage for all key organisms
3. Read `docs/governance/design-anti-patterns.md` — banned patterns blacklist
4. Pull any Granola transcripts for Learning Contracts decisions → create `docs/decisions/` entries
5. Write a Screen Purpose Map (§0 above) for every planned screen before coding any of them

---

## 3. Page Shell Anatomy (workspace standard — apply unless Granola decisions say otherwise)

```tsx
// SiteHeader — top bar with sidebar toggle + title
<SiteHeader title="Learning Contracts" />

// List pages — always ListPageTemplate, never custom shell
<ListPageTemplate header={<SiteHeader title="Contracts" />} metrics={<KeyMetrics items={kpiItems} />} defaultTabs={TABS}>
  {(activeTab) => <DataTable data={...} columns={...} emptyState={...} toolbarSlot={...} selectable />}
</ListPageTemplate>
```

---

## 4. Banned Patterns

All workspace-level bans apply (from `docs/governance/design-anti-patterns.md`):

| Banned | Use instead |
|---|---|
| Raw `<button>` | `<Button variant="..." size="...">` |
| Hand-rolled status chip | `<StatusBadge status="...">` |
| `toast()` for errors | `<LocalBanner variant="error" ...>` |
| Hardcoded hex/rgb | `var(--token)` |
| Custom page shell | `<ListPageTemplate>` |
| `<i className="fa-...">` without `aria-hidden="true"` | Add `aria-hidden="true"` |
| Missing `emptyState` on DataTable | Always pass entity-specific `emptyState` |
| Missing `toolbarSlot` on list pages | Always include row count + `TablePropertiesDrawer` |

---

> Expand with real product patterns after the first 3 Granola decisions are captured. Never fabricate patterns without a decision source.
