---
description: Build or extend an Exxat list hub with HubTable, connected views, and mock data.
---

# /build-hub — List hub builder

## Prerequisites

- Design brief confirmed (run `/design-brief` if IA is new).
- Surface packet: `node scripts/agent-context-router.mjs hub-list`

## Steps

1. Read `docs/exxat-ds/jobs/list-hub.md`.
2. Read `.agents/rules/exxat-page-header-actions.md` (PageHeader ⋯ + ExportDrawer).
3. Read `.agents/skills/exxat-token-economy/SKILL.md` §1–§3.
4. Copy structure from reference: `components/library-table.tsx` + `library-client.tsx`.
5. **MUST:**
   - `ListPageTemplate` + `HubTable` + one `useTableState` row bag
   - `PageHeader` (or domain header) with **`actions`**: ⋯ overflow → **Export** + **`ExportDrawer`** on the client
   - Mock data in `lib/mock/<entity>.ts` (≥ ~12 rows)
   - Search, filters, `TablePropertiesDrawer`
   - Named cell primitives (`exxat-table-column-cells` skill)
   - KPI strip ≤ 4 tiles (`exxat-kpi` skill)
   - Product route under `/<product-root>/...` (`exxat-product-routing.md`)
6. Run `/react-doctor` before commit.

## Rules to apply

- `exxat-data-tables.md`
- `exxat-hub-supported-views.md`
- `exxat-centralized-list-dataset.md`
- `exxat-page-header-actions.md`
- `exxat-no-toast.md`
- `exxat-token-discipline.md`
