# Chart / Visualization — Depth audit (2026-05-11)

## Library reality

- **Source**: `/Users/romitsoley/Work/exxat-ds/packages/ui/src/components/ui/chart.tsx` (379 lines)
- **Exports**: `ChartContainer` (line 37, wraps `ResponsiveContainer` + injects `<ChartStyle>`), `ChartTooltip` (line 105, re-export of Recharts Tooltip), `ChartTooltipContent` (line 128, themed body with `indicator: "dot"|"line"|"dashed"`), `ChartLegend`/`ChartLegendContent` (274/276), `chartTooltipKeyboardSyncProps` (116, keyboard a11y), `ChartConfig` type (11): `{ key: { label, icon, color | theme: {light, dark} } }`
- **Recharts**: `^2.15.4` (`exxat-ds/packages/ui/package.json`)
- **Theming**: `ChartStyle` (chart.tsx:72-103) emits `[data-chart=<id>] { --color-<key>: <color>; }` for `light`/`.dark`. Recharts primitives consume via `fill="var(--color-key)"` written by the consumer. Baked Cartesian opinions at line 58: muted ticks, `--border/50` grid lines, transparent dots, no outline.
- **Library demo** (`Admin/apps/web/components/component-catalog/component-preview.tsx:430-450`): single `BarChart` with `accessibilityLayer`, `CartesianGrid vertical={false} strokeDasharray="3 3"`, axis lines hidden, `ChartTooltipContent`, `Bar` with `radius={[4,4,0,0]}`. Demo only showcases Bar; the wrapper works with Line/Area/Scatter/Composed/Pie/Radial/Radar from Recharts 2.15.

## Adoption snapshot

| Workspace | `ChartContainer` usages | Standard Recharts primitives | Bespoke SVG vizzes |
|---|---|---|---|
| PCE admin | **0** | 0 | 2 files / 3 vizzes |
| exam-mgmt admin | **0** | 0 | 2 files / 4+ vizzes |
| All other apps | 0 | 0 | 0 |

`ChartContainer`/`ChartTooltip` grep → zero hits in `apps/`. SVG/Recharts grep returns exactly 4 files:
- `apps/pce/admin/app/(app)/analytics/page.tsx` (722 LOC, 3 vizzes)
- `apps/pce/admin/components/pce/trend-sparkline.tsx` (133 LOC)
- `apps/exam-management/admin/components/curricular-loop-diagram.tsx` (1041 LOC, heatmap + per-row sparkline + stacked bar)
- `apps/exam-management/admin/components/question-scatter-plot.tsx` (279 LOC)

## PCE: visualization inventory

### `ScoreLandscape` — `apps/pce/admin/app/(app)/analytics/page.tsx:29-93` (~64 LOC)
- **Visualizes**: horizontal bars, one per course, sorted desc, three-tier colored dot (≥4.3 chart-2, 3.7–4.3 brand, <3.7 chart-4) + course code/name as inline `<text>`. Each row `tabIndex={0}` with Enter/Space drill (lines 54-65).
- **Recharts fit**: **partial.** `BarChart layout="vertical"` + `<Bar fill="var(--brand-color)">` + `<Cell>` for tier dot covers the bars. But the clickable-row-as-button semantics (`<g role="button" tabIndex={0}>` with Enter/Space drill at 59-64) would need Recharts `onClick`/`activeIndex` + custom Tooltip — workable but loses the clean keyboard parity.
- **Recommendation**: **hand-roll-doc.** Genuinely bespoke (list-with-bar, not a bar chart). `docs/governance/ds-adoption.md:77` already blesses "score landscape" as a pattern. Mirrors prototype `chartScoreLandscape` (`apps/pce/prototype/pce-evaluation.html` ~line 1317).

### `TrendSparkline` — `apps/pce/admin/components/pce/trend-sparkline.tsx` (133 LOC, ~40 LOC viz)
- **Visualizes**: 72×20 px default path over 2-N score points, terminal dot, slope-tinted (`chart-2` up / muted flat / `chart-4` down — never red, lines 88-92), delta text (122-130). Empty states for 0/1 points (51-68).
- **Recharts fit**: **mechanical yes, semantically no.** A `LineChart` with axes hidden and `<Line dot={false}>` + manual terminal `<Dot>` produces identical output. But `ResponsiveContainer` forces an aspect-video parent (chart.tsx:58), adds `recharts-surface` listeners, and is grossly over-wrapped for a 72×20 inline glyph used inside DataTable cells. Aarti's "viz first, no chrome" (`feedback_viz_first`) was written against this.
- **Recommendation**: **confirm existing doc** at `docs/governance/ds-adoption.md:88`. No change.

### `ScoreBar` — `apps/pce/admin/app/(app)/analytics/page.tsx:154-179` (~26 LOC)
- **Visualizes**: 80×6 px brand-fill + tabular-nums score, used as DataTable cell renderer. Plain `<div>`, no SVG.
- **Recharts fit**: **N/A — progress primitive, not a chart.**
- **Recommendation**: keep, no docs needed.

### `KpiButton` — `apps/pce/admin/app/(app)/analytics/page.tsx:106-152`
- Not a viz — KPI tile. Already flagged in `docs/governance/ds-adoption.md:64` against the KeyMetrics vendor recipe. Out of scope here.

## exam-mgmt: visualization inventory

### `QuestionScatterPlot` — `apps/exam-management/admin/components/question-scatter-plot.tsx:54-237` (~240 LOC)
- **Visualizes**: 760×320 scatter — X = difficulty (0–1), Y = point-biserial (-0.2–0.7), dot size = `log2(timesUsed+1)`, dot color = 4-way category (lines 208-212). Quadrant tints (108-115), reference lines at Y=0 / Y=0.2 (118-130), gridlines (133-148), axis labels (160-191), zone labels (195-196), absolute-positioned hover tooltip (240+).
- **Recharts fit**: **strong yes.** `ScatterChart` natively gives `ZAxis range` for size encoding, `<Scatter>` with `<Cell fill>` for category color, `<ReferenceLine y={0} strokeDasharray>`, `<ReferenceArea>` for quadrant tints, axis labels via `<XAxis label>`/`<YAxis label>`, and `<ChartTooltipContent>` for the hover card. The four manual `<line>` gridlines collapse into `<CartesianGrid />`.
- **Effort**: **4-6h.** ~50% LOC reduction (~240 → ~120). Gains `accessibilityLayer` (keyboard nav the hand-roll lacks).
- **Recommendation**: **MIGRATE to ChartContainer + ScatterChart.** Single clearest win in workspace. Aarti's "embedded workflow intelligence" framing (scatter-plot.tsx:6) is preserved.

### `PerformanceHeatmap` — `apps/exam-management/admin/components/curricular-loop-diagram.tsx:267-431` (~165 LOC)
- **Visualizes**: objectives × assessments grid, cells tone-colored by perf tier; row/col summary strips; hover popovers per cell.
- **Recharts fit**: **no.** Recharts has no heatmap primitive. `Treemap` is wrong semantics; hacking `ScatterChart` with rect shapes is worse than the current hand-roll. `docs/governance/ds-adoption.md:77` blesses "gap heatmap"; pattern doc at `docs/patterns/viz/gap-heatmap.md`.
- **Recommendation**: **hand-roll-doc (new entry).**

### `TrendRow` (per-objective sparkline + area) — `apps/exam-management/admin/components/curricular-loop-diagram.tsx:797-985` (~40 LOC SVG)
- **Visualizes**: per row, polyline + filled-area + 70% reference line + HTML-overlaid circular dots (879-916). Tone-colored by `lastTone`. Cohort-overall row uses same shape (777-782).
- **Recharts fit**: **partial-but-no.** `AreaChart` with `ReferenceLine` + `Area fillOpacity={0.12}` + `Line` matches mechanically. But this renders once per row × 8-20 rows per matrix — 8-20 `ResponsiveContainer` instances each with its own `ResizeObserver`. The HTML dot overlay (917+) keeps dots circular regardless of column width; Recharts dots distort with the SVG. Current hybrid SVG-line + HTML-dot is the correct local optimum.
- **Recommendation**: **hand-roll-doc (new entry).** Same family as `TrendSparkline`.

### `StackedDiffBar` / `DifficultyBreakdownRow` — `curricular-loop-diagram.tsx:691-730` (~40 LOC)
- 3-segment stacked horizontal bar with flex divs (no SVG). Primitive, not a chart. **Keep, no docs.**

## Cross-product viz patterns

| Pattern | PCE has | exam-mgmt has | Workspace candidate? |
|---|---|---|---|
| Inline sparkline (no axes, slope-tinted) | `trend-sparkline.tsx` (133 LOC) | `TrendRow` polyline+area (curricular-loop-diagram.tsx:879+) | **Yes** — extract a `<MicroTrend>` primitive into `packages/viz/` (or `apps/<product>/components/viz/`). Same color rules, same a11y label shape, differ only in width/area-fill. |
| Three-tier dot indicator (≥hi / mid / <lo) | `ScoreLandscape` row (analytics/page.tsx:67) | LegendDot (curricular-loop-diagram.tsx:987+) | **Yes** — `<TierDot tone>` helper. |
| Stacked horizontal proportion bar | `ScoreBar` (single-fill) | `StackedDiffBar` (3-segment) | Maybe — same primitive with N segments. Low priority. |
| Quadrant scatter (2D rule + colored dots) | none | `QuestionScatterPlot` | No — only one consumer. |
| Heatmap (categorical × time, tier color) | none | `PerformanceHeatmap` | No — only one consumer, but `gap-heatmap.md` pattern exists. |

The sparkline pattern is the strongest candidate for shared extraction — both products hand-roll the same shape with the same color rules.

## Decision matrix

| Viz | Workspace | Genuinely bespoke? | Standard Recharts? | Recommended |
|---|---|---|---|---|
| `ScoreLandscape` | PCE analytics | Yes (list-with-bar + keyboard rows) | Partial — bar fit but row semantics lost | **hand-roll-doc** (already implicit; add explicit row) |
| `TrendSparkline` | PCE analytics + DataTable cells | Yes (inline, no chrome) | Mechanical yes / overhead disqualifies | **confirm existing doc** (no change) |
| `ScoreBar` | PCE analytics rows | n/a primitive | No | no doc needed (primitive) |
| `KpiButton` | PCE analytics | n/a KPI tile, not viz | No | out of scope (use KeyMetrics) |
| `QuestionScatterPlot` | exam-mgmt QB analytics | No | **Yes — strong fit** | **MIGRATE to ChartContainer + ScatterChart, 4-6h** |
| `PerformanceHeatmap` | exam-mgmt matrix | Yes (no Recharts primitive) | No | **hand-roll-doc (new entry)** |
| `TrendRow` sparkline+area | exam-mgmt matrix per row | Yes (per-row inline, HTML dot overlay) | Partial — overhead per row disqualifies | **hand-roll-doc (new entry)** |
| `StackedDiffBar` | exam-mgmt matrix | n/a primitive | No | no doc needed (primitive) |

## Updates needed to ds-adoption registry

Add to **Documented hand-rolls → PCE** (`docs/governance/ds-adoption.md:86-90`):
- `apps/pce/admin/app/(app)/analytics/page.tsx` `ScoreLandscape` (~64 lines, lines 29-93) — list-with-bar pattern, three-tier dot, keyboard-navigable rows. Mirrors prototype `chartScoreLandscape`. 2026-05-11.

Add new **Documented hand-rolls → exam-management** block (currently the section at line 92-95 is empty):
- `apps/exam-management/admin/components/question-scatter-plot.tsx` — **DELETE this line after migration to ScatterChart lands.** Until migrated, document with "queued for Recharts migration 2026-05-11."
- `apps/exam-management/admin/components/curricular-loop-diagram.tsx` `PerformanceHeatmap` (lines 267-431) — heatmap; no Recharts equivalent. Cite `docs/patterns/viz/gap-heatmap.md`. 2026-05-11.
- `apps/exam-management/admin/components/curricular-loop-diagram.tsx` `TrendRow` polyline+area (lines 797-985) — per-row inline trend with HTML dot overlay. Same family as TrendSparkline. 2026-05-11.

No removals from existing doc.

## What audit can't see

- Whether `var(--color-<key>)` injection (chart.tsx:84-97) survives `theme-prism` brand switching at runtime — needs browser.
- Whether `ChartTooltipContent` (chart.tsx:128-272, `min-w-32` + `shadow-xl` at line 197) feels too chrome-heavy vs Aarti's viz-first preference. Current hand-rolls use either no tooltip or a flat shadow-less card.
- Whether `accessibilityLayer` matches the keyboard parity of `ScoreLandscape`'s row-as-button pattern.
- Perf: 20-row `TrendRow` = 20 `ResponsiveContainer` ResizeObservers if migrated — likely a regression for static dashboards.

## Recommended next 3 actions

1. **Migrate `QuestionScatterPlot` to ChartContainer + Recharts `ScatterChart`** (4-6h). This is the single clearest win in the workspace: ~120 LOC removed, gains `accessibilityLayer`, ships first non-zero ChartContainer adoption, and stress-tests `var(--color-<key>)` theming on a non-trivial chart. File: `/Users/romitsoley/Work/apps/exam-management/admin/components/question-scatter-plot.tsx`.

2. **Add the three exam-mgmt documented-hand-roll entries** (PerformanceHeatmap, TrendRow, ScoreLandscape PCE) to `/Users/romitsoley/Work/docs/governance/ds-adoption.md:81-100` (1h). Currently the exam-mgmt block at line 95 reads "_(none flagged yet)_" — but the audit will fire on `curricular-loop-diagram.tsx:305` (already noted at line 117 as "raw `<Table>` inside a diagram component"). Documenting the bespoke vizzes closes that gap.

3. **Extract `<MicroTrend>` primitive** to a workspace `components/viz/` location (2-3h). Both `TrendSparkline` (PCE) and `TrendRow` (exam-mgmt) re-implement: slope-tinted color, area-or-line, terminal dot, aria-label sentence. Single shared primitive, two props (`variant: 'line' | 'area'`, `width`/`height`) — preserves Aarti's "viz first no chrome" rule while collapsing two copies into one. Document in `docs/patterns/viz/micro-trend.md`.
