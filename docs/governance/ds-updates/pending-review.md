# Pending review — DS updates

> Auto-populated by `scripts/ds-update-watch.py` when either DS submodule changes its component exports or theme tokens.
> Empty file = nothing to review. The `ds-updates-watcher` subagent reads this when invoked.

_Last checked: 2026-07-10 — manual upgrade to `0.6.57` across all consumer apps (Romit)._

## @exxatdesignux/ui — NPM package (the canonical DS)

- **Installed `0.6.57` · Latest `0.6.57`** — all consumer apps current (pce/admin, exam-management/admin, exam-management/assessment-taker, patient-log/admin) as of 2026-07-10.
- 0.6.55 → 0.6.57 substance: dark `--muted-foreground` re-derived from `--muted` (fixes app-wide `bg-muted` + text pairing AA); new `--product-wordmark-suffix` token; DataTable new-row highlight → blue wash + transparent border; `.theme-custom` (custom-product) brand-tints retuned paler ("Prism rose"); new messaging primitives (`bubble`/`message`/`message-scroller`/`marker`) + lib helpers (`column-pin-policy`, `nav-flyout-inset`, `table-state-lifecycle`). Export surface unchanged. PCE runs `theme-prism`, so the custom-tint retune does not affect it.
- Upgrade via the `exxat-package-upgrade` skill. **Caveat (2026-07-10):** each consumer app's `postinstall` runs `exxat-ui upgrade`, which re-ports the *entire* Design OS shell + generated-starter demo files (`learning-activities-*`, `notification-bell`, etc.) into the app — a large, invasive port, not a version bump. For a minimal bump, install with `--ignore-scripts` (skips the port) and let token/CSS changes ride along via the imported package `globals.css`. Consider neutralizing the postinstall port if silent chrome re-ports are unwanted.
- **Known drift:** `patient-log/admin` is a bare scaffold (no `app/**/page.tsx` routes) whose committed `src/pages/_error.tsx` imports `@/lib/chunk-load-error`, a file that only exists in the generated-starter and was never ported — so every route 500s, independent of DS version. Needs a proper `exxat-ui upgrade` shell sync (or the single `lib/chunk-load-error.ts` ported) before it can render.
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

