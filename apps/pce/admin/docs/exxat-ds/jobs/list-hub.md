# Job: List hub (primary data surface)

**Product examples:** Placements, Team, Library (All questions), Tokens, Compliance.

**Pattern:** [`data-views-pattern.md`](../data-views-pattern.md). **Six-step path:** [`HANDBOOK.md`](../HANDBOOK.md) §2.

---

## Job-to-be-done

Help a coordinator **find, compare, filter, and act on many records** in one session — with optional export, metrics at a glance, and multiple view types (table, list, board, dashboard).

---

## Decision

| Signal | Choose |
|--------|--------|
| ~10+ comparable records, sort/filter/export | **List hub** |
| Single-task compose / timed delivery | [Focus workflow](./focus-workflow.md) — not this job |

---

## Build checklist (6 steps)

1. **Mock data** — `lib/mock/<entity>.ts` (~12 typed rows).
2. **KPI helper** — `lib/mock/<entity>-kpi.ts` → ≤ 4 `MetricItem` from `tableState.rows`.
3. **Column defs** — `components/<entity>-table.tsx`; map each field with [`table-column-cells-pattern.md`](../table-column-cells-pattern.md) (person → avatar column, status → `ListHubStatusBadge`, etc.).
4. **`HubTable`** inside `ListPageTemplate.renderContent` (not raw `DataTable`).
5. **Page client** — `PrimaryPageTemplate` → `ListPageTemplate` (metrics, tabs, renderContent).
6. **Nav** — `lib/mock/navigation.tsx`; optional `secondaryPanel` for scope tree.

**Reference copy:** `library-table.tsx` + `library-client.tsx`.

---

## Non-negotiables

- One `useTableState` row bag for **all** view types.
- `FULL_HUB_SUPPORTED_VIEWS` on both `ListPageTemplate` and `HubTable`.
- `TablePropertiesDrawer`: pass `currentView` + `onViewChange`.
- `productPersistKey(product, "<hub>")` for filters/layout.
- `KeyMetrics variant="flat"` on metrics strip; ≤ 4 tiles.

---

## Ship gate

- [ ] Search + filters + Properties drawer wired
- [ ] All seven views render real bodies (no placeholders)
- [ ] Empty / loading / error states
- [ ] [`accessibility-ship-checklist.md`](../accessibility-ship-checklist.md)
- [ ] **`PageHeader`** (or domain `*PageHeader`) with **⋯ More** → **Export** + **`ExportDrawer`** on the page client when rows are exportable
- [ ] One filled primary CTA when the hub has a create action; secondary/export under overflow

---

## Rules & skills

| Layer | Path |
|-------|------|
| Rule | `.cursor/rules/exxat-data-tables.mdc` |
| Rule | `.cursor/rules/exxat-table-column-cells.mdc` |
| Rule | `.cursor/rules/exxat-hub-supported-views.mdc` |
| Rule | `.cursor/rules/exxat-page-header-actions.mdc` |
| Skill | `.cursor/skills/exxat-table-column-cells/SKILL.md` |
| Skill | `.cursor/skills/exxat-centralized-list-dataset/SKILL.md` |
| Skill | `.cursor/skills/exxat-overlays/SKILL.md` (export drawer) |
| Router | `.cursor/skills/exxat-token-economy/SKILL.md` §1 |
