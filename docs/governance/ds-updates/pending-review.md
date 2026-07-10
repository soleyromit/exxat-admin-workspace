# Pending review — DS updates

> Auto-populated by `scripts/ds-update-watch.py` when either DS submodule changes its component exports or theme tokens.
> Empty file = nothing to review. The `ds-updates-watcher` subagent reads this when invoked.

_Last checked: 2026-06-30T12:15:21.288932+00:00 — no DS deltas detected._

## @exxatdesignux/ui — NPM package (the canonical DS)

- **Installed `0.6.48` · Latest `0.6.52`** — consumer apps are behind.
- Upgrade via the `exxat-package-upgrade` skill: `pnpm add @exxatdesignux/ui@latest` then `npx exxat-ui upgrade` per app.
- Release notes: https://github.com/ExxatDesign/Exxat-DS-Workspace/blob/main/packages/ui/RELEASES.md

## UPSTREAM REQUEST — publish the chart shell primitives (Romit, 2026-07-07)

**Ask:** promote `ChartCard`, `ChartFigure`, `ChartDataTable`, and `CHART_AXIS_TICK` /
`CHART_TICK_FONT_SIZE` (from `lib/chart-typography.ts`) out of the DS workspace app
(`Exxat-DS-Workspace/apps/web/components/charts-overview.tsx`) into the published
`@exxatdesignux/ui` package.

**Why:** the package ships only the low-level chart system (`ChartContainer`,
`ChartTooltip[Content]`, `ChartLegend[Content]`, `chartTooltipKeyboardSyncProps`).
The *recipes* consumers are told to match — the card shell with title/description/Leo
insight, `ChartFigure`'s keyboard-navigable figure + sr summary, the sr-only
`ChartDataTable`, and the 12px axis-tick constant — exist only inside apps/web, so
every product re-implements them by hand from the gallery source. That is copy-drift
waiting to happen, and the a11y layer (`ChartFigure` arrow-key tooltip sync + data
table) is exactly the part that gets dropped in hand copies.

**Evidence:** `apps/pce/admin/components/pce/dashboard-monitor.tsx` +
`dashboard-home.tsx` (StatusRing) now mirror the `AreaChartContent` /
`DonutChartContent` recipes by hand (Jul 7 2026 dashboard rebuild); the 12px
axis-tick constant is duplicated as inline `tick={{ fontSize: 12 }}` there.

**Verdict wanted (ds-updates-watcher / DS team):** ADOPT (publish as package
exports) vs WATCH. Suggested export set: `ChartCard`, `ChartFigure`,
`ChartDataTable`, `CHART_AXIS_TICK`, `CHART_TICK_FONT_SIZE`.
Follow-up candidates once those land: `MicroTrend` sparkline + `BulletGauge`
micro primitives (documented hand-rolls in `apps/pce/admin/components/pce/`,
flagged "upstream candidate" in their file headers; a second SVG copy of
MicroTrend lives in `apps/exam-management/admin/components/micro-trend.tsx`).

