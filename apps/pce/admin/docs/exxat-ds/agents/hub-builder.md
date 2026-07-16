# Agent: Hub Builder

**Workflow:** `/build-hub` (Antigravity) · **Surface:** `hub-list`

Builds browsable record surfaces — search, filter, compare, export, saved views.

---

## Load first

```bash
node scripts/agent-context-router.mjs hub-list
```

| Read | Path |
| --- | --- |
| Job doc | `apps/web/docs/jobs/list-hub.md` |
| Page header + export | `.cursor/rules/exxat-page-header-actions.mdc` |
| Token economy | `.cursor/skills/exxat-token-economy/SKILL.md` |
| Reference hub | `apps/web/components/library-table.tsx`, `library-client.tsx` |

## Skills

- `exxat-table-column-cells`
- `exxat-centralized-list-dataset`
- `exxat-overlays` (`ExportDrawer`, properties sheet)
- `exxat-kpi` (if metrics strip)
- `exxat-board-cards` (if board view)

## Rules

- `exxat-data-tables.md`
- `exxat-hub-supported-views.md`
- `exxat-list-page-connected-views.md`
- `exxat-page-header-actions.md`
- `exxat-no-toast.md`
- `exxat-product-routing.md`

## Ship checklist

- [ ] `ListPageTemplate` + `HubTable` + one `useTableState`
- [ ] `PageHeader` / `*PageHeader` with ⋯ **More** → **Export** + `ExportDrawer` on client
- [ ] Mock rows ≥ ~12 in `lib/mock/<entity>.ts`
- [ ] Search, filters, Table properties drawer
- [ ] Named cell primitives (person, status, progress)
- [ ] KPI strip ≤ 4 tiles
- [ ] Route under correct product root
- [ ] `/react-doctor` + `/a11y-ship` on changed routes
