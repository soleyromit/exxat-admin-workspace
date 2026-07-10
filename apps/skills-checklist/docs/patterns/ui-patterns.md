# Skills Checklist Admin — UI Patterns + Compliance Reference

> Living doc. Read at session start for any Skills Checklist UI work.
> Status: NOT YET SCAFFOLDED — this file codifies rules to apply when scaffolding begins. Last updated: 2026-06-01.

---

## ⚠️ Not yet scaffolded

No app code exists. These patterns are pre-scaffolding rules that must be followed when the first screen is built. Do not invent product-specific patterns — wait for real Granola decisions.

When scaffolding begins: add §0 Screen Purpose Map before writing the first JSX file.

---

## 0. Product Identity

| App | Package | Port | Path |
|---|---|---|---|
| Admin | `@exxat/skills-checklist-admin` | 3007 | `apps/skills-checklist/admin/` |
| Student | `@exxat/skills-checklist-student` | 3008 | `apps/skills-checklist/student/` |

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

## 2. Domain Context (from workspace DESIGN.md)

Skills Checklist tracks competency development. Likely surfaces:
- **Checklist list** — student competency items, admin-configured skill sets (use `DataTable` + `ListPageTemplate`)
- **Checklist detail** — per-student progress view, faculty sign-off (use `Sheet` for review panel, `Dialog` for sign-off confirm)
- **Progress / completion viz** — competency coverage — use DS viz primitives; never hand-rolled `<progress>` bars (see `docs/governance/design-anti-patterns.md` §progress bars last resort)

No specific product decisions captured yet. All domain-specific patterns must wait for Granola transcripts.

---

## 3. Competency / Progress Visualization Rules

Skills checklist data is inherently completion-oriented but not always 0→100% in-flight. Before choosing a viz:

- **DataTable with status column** — for flat lists of skill items with pass/fail/pending state → `StatusBadge`
- **Strip plot or bullet chart** — for completion rate comparisons across students/cohorts → see the real `.d.ts` (`node tools/ds/source.mjs`)
- **Progress bar only if** the metric is genuinely in-flight (e.g., "14 of 20 skills signed off this rotation") — otherwise banned per workspace anti-patterns

---

## 4. Pre-Scaffolding Checklist

Before writing the first JSX file:

1. Run `ds-adoption-reviewer` — state "I'm about to write the first component for skills-checklist/admin"
2. Read the real `.d.ts` (`node tools/ds/source.mjs`) — canonical usage for all key organisms
3. Read `docs/governance/design-anti-patterns.md` — banned patterns blacklist
4. Pull any Granola transcripts for Skills Checklist decisions → create `docs/decisions/` entries
5. Write a Screen Purpose Map (§0 placeholder above) for every planned screen before coding any of them

---

## 5. Page Shell Anatomy (workspace standard)

```tsx
<SiteHeader title="Skills Checklist" />

// List pages
<ListPageTemplate header={<SiteHeader title="Skills" />} metrics={<KeyMetrics items={kpiItems} />} defaultTabs={TABS}>
  {(activeTab) => <DataTable data={...} columns={...} emptyState={...} toolbarSlot={...} selectable />}
</ListPageTemplate>
```

---

## 6. Banned Patterns

All workspace-level bans apply (from `docs/governance/design-anti-patterns.md`):

| Banned | Use instead |
|---|---|
| Raw `<button>` | `<Button variant="..." size="...">` |
| Hand-rolled status chip | `<StatusBadge status="...">` |
| `toast()` for errors | `<LocalBanner variant="error" ...>` |
| Hardcoded hex/rgb | `var(--token)` |
| Custom page shell | `<ListPageTemplate>` |
| `<i className="fa-...">` without `aria-hidden="true"` | Add `aria-hidden="true"` |
| `<progress>` element for completion stats | Bullet chart / strip plot |
| Missing `emptyState` on DataTable | Always pass entity-specific `emptyState` |

---

> Expand with real product patterns after the first 3 Granola decisions are captured.
