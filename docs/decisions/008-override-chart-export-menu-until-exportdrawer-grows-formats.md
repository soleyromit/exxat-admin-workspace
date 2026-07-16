---
type: decision
subtype: override
date: 2026-07-16
product: pce
status: Active
source: conversation
session: pce-analytics-plot-viz card/expand/export redesign (2026-07-15/16, Romit + Claude)
overrides_rule: ds-touch-gate "custom export/download sheet → ExportDrawer"
sunset: "@exxatdesignux/ui ExportDrawer accepts formats (png/pdf/excel/csv) and a chart/table source — then ChartExportMenu migrates and this ADR sunsets"
---

# Override ADR-008 — ChartExportMenu stands in for ExportDrawer on analytics chart cards

## Status

Active

## Context

The touch-gate promotes any custom export surface to `ExportDrawer` from
`@exxatdesignux/ui`. Verified against the installed package (0.6.57, via
`node tools/ds/source.mjs ExportDrawer`), its entire API is:

```ts
interface ExportDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  totalRows?: number
  visibleColumns?: number
}
```

It is a table-row exporter: no format selection, no chart concept, no way to
hand it an SVG or a rows array. The analytics contract (approved spec:
`apps/pce/docs/specs/2026-07-15-analytics-card-expand-export-design.md`) puts
**PNG / PDF / Excel / CSV on every chart card** — Monil: "whatever we build on
screen should also have a reporting angle." ExportDrawer cannot express any of
the four.

## Decision

We override the ExportDrawer promotion for `apps/pce/admin/components/pce/chart-card-actions.tsx`
because the DS component cannot represent chart export at all.

**Scope:**
- File: `components/pce/chart-card-actions.tsx` (`ChartExportMenu`) and its
  mounts across the analytics cards + explorers.
- Persona: admin.

**Mitigations (why this is not a fork):**
- Composed entirely from DS primitives (`DropdownMenu`, `Button`, `Dialog`,
  `LocalBanner`) — no new surface chrome.
- Export rows are the same arrays as the sr-only `ChartDataTable`, so a11y
  table, deep-dive table and export cannot diverge.
- The DS gap is on Himanshu's ask list (spec §8.1): extend `ExportDrawer`
  with `formats` + a chart/table source. On landing, `ChartExportMenu`'s call
  sites migrate mechanically (same `{headers, rows}` shape) and this override
  sunsets.

## Consequences

Until sunset, PCE carries one product-local export menu. Any second product
needing chart export should trigger the DS work, not copy this file.
