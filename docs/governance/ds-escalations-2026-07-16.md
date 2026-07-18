# DS escalations — 2026-07-16 (PCE analytics + faculty view)

For Himanshu. Five asks, all discovered building the PCE analytics per-card contract
(compact card → correlated expand dialog → 4-format export) and the faculty view.
Each is a place PCE had to work around the DS rather than with it; the workarounds
are contained, and each names the file that gets deleted the day the DS ships the fix.

## 1. `ChartCard` needs an `actions` slot

Every analytics card carries Expand + Export as icon buttons in the top-right corner.
`ChartCard` has no slot there, so PCE absolutely-positions `ChartCardActions` over the
card and shifts it left when an Ask-Leo header button occupies the corner
(`apps/pce/admin/components/pce/chart-card-actions.tsx` — see `leoOffset`). A
`ChartCard actions={...}` prop that composes with the Leo affordance removes the
positioning hack and the collision handling.

## 2. `ExportDrawer` only exports tables — charts need PNG / PDF / Excel / CSV

The DS export surface is table-only. Product requirement (Romit, 2026-07-15): every
chart exports "pdf, png, excel". PCE vendored a `ChartExportMenu` (svg→PNG, print→PDF,
CSV) under Override ADR-008
(`docs/decisions/008-override-chart-export-menu-until-exportdrawer-grows-formats.md`).
The ADR self-retires when `ExportDrawer` grows a `formats` prop covering chart
payloads.

## 3. `KeyMetrics` has no per-metric interactivity

Metric tiles are terminal: no `onMetricClick`, no per-tile action slot. The analytics
Overview wants tile → metric-detail dialogs (Steep's pattern: the distribution behind
the tile's one number). We did not hand-roll chrome on the DS organism — the tiles
stay glanceable — but the drill is a real product ask on three tabs.

## 4. `KeyMetrics` pill radius

The KPI pills render at the DS default radius; the catalog comps show 32px. Small,
but it is the kind of token-vs-comp drift that visual-diff flags on every run.

## 5. Publish the DS OS chart vocabulary to the package

`ChartCard` / `ChartFigure` / `ChartDataTable` / the Leo-spotting suite live only in
the catalog app (`~/Exxat-DS-Workspace/apps/web`); products vendor them by hand
(PCE: `components/charts-overview.tsx`, `components/chart-leo-spotting.tsx`). Every
`pnpm install` regression PCE has hit (porter reverting `chart-heatmap.tsx`,
`nav-user.tsx`, `lib/chart-heatmap-scale.ts`) traces to this vendor-and-port loop.
Publishing the chart vocabulary in `@exxatdesignux/ui` ends the class of bug.
