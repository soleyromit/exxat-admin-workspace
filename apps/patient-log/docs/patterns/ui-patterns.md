# Patient Log Admin — UI Patterns + Compliance Reference

> Living doc. Read at session start for any Patient Log UI work.
> Status: NOT YET SCAFFOLDED — this file codifies rules to apply when scaffolding begins. Last updated: 2026-06-01.

---

## ⚠️ Not yet scaffolded

No app code exists. These patterns are pre-scaffolding rules that must be followed when the first screen is built. Do not invent product-specific patterns — wait for real Granola decisions.

When scaffolding begins: add §0 Screen Purpose Map before writing the first JSX file.

---

## 0. Product Identity

| App | Package | Port | Path |
|---|---|---|---|
| Admin | `@exxat/patient-log-admin` | 3003 | `apps/patient-log/admin/` |
| Student | `@exxat/patient-log-student` | 3004 | `apps/patient-log/student/` |

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

Patient Log is a clinical data entry product. Likely surfaces:
- **Log entry list** — student-submitted patient encounters (use `DataTable` + `ListPageTemplate`)
- **Entry detail / review** — admin/faculty review of individual entries (use `Sheet` for side panel, `Dialog` for confirm actions)
- **Student view** — submit + track patient encounter logs

No specific product decisions captured yet. All domain-specific patterns must wait for Granola transcripts.

---

## 3. Pre-Scaffolding Checklist

Before writing the first JSX file:

1. Run `ds-adoption-reviewer` — state "I'm about to write the first component for patient-log/admin"
2. Read the real `.d.ts` (`node tools/ds/source.mjs`) — canonical usage for all key organisms
3. Read `docs/governance/design-anti-patterns.md` — banned patterns blacklist
4. Pull any Granola transcripts for Patient Log decisions → create `docs/decisions/` entries
5. Write a Screen Purpose Map (§0 placeholder above) for every planned screen before coding any of them

---

## 4. HIPAA / FERPA Note

Patient log data is clinically sensitive. Before building any detail view or export:
- Spawn `compliance-reviewer` with HIPAA flag (same as PCE)
- Confirm data classification before displaying patient identifiers in tables or exports

---

## 5. Page Shell Anatomy (workspace standard)

```tsx
<SiteHeader title="Patient Log" />

// List pages
<ListPageTemplate header={<SiteHeader title="Patient Encounters" />} metrics={<KeyMetrics items={kpiItems} />} defaultTabs={TABS}>
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
| Missing `emptyState` on DataTable | Always pass entity-specific `emptyState` |
| Displaying patient data without HIPAA compliance review | Spawn `compliance-reviewer` first |

---

> Expand with real product patterns after the first 3 Granola decisions are captured.
