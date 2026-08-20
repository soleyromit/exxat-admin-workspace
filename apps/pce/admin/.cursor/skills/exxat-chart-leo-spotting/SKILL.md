---
name: exxat-chart-leo-spotting
description: >-
  Leo plot spotting on charts — pill + dashed connector + dot anchored to real
  data. Use when wiring ChartLeoInsight, ChartLeoPlotInsightOverlay, or adding
  insights to new chart types (heatmap, treemap, sankey, cartesian).
user-invocable: true
---

# Exxat DS — chart Leo spotting

Leo insights on charts are **plot annotations**, not banners above the chart.

## Visual pattern (required)

1. **Pill** — `LeoInsightIndicator` with `triggerLayout="plot-marker"` (shows delta or headline)
2. **Dashed connector** — brand-coloured vertical line
3. **Dot** — on the actual data point / cell / link / tile

Reference: area chart in `charts-overview.tsx` (`AreaChartContent` + `ChartLeoPlotInsightOverlay`).

## Central modules

| Module | Role |
|--------|------|
| `@/components/chart-leo-spotting.tsx` | `ChartLeoInsightOverlay`, `ChartLeoPlotInsightOverlay` |
| `@/lib/chart-leo-spotting.ts` | Anchor modes, peak selector, lift px per chart family |
| `@/components/leo-insight-indicator.tsx` | `ChartLeoInsight` type + popover |

## Anchor modes

| Mode | When | Anchor shape |
|------|------|----------------|
| **cartesian** | Line, area, bar, stacked, composed, scatter timeline | `{ xValue, yDataKeys?, yValue? }` |
| **plot-selector** | Heatmap, treemap, sankey | `{ plotSelector: '[data-chart-leo-anchor="peak"]' }` |
| **none** | No on-plot callout — header Ask Leo only | omit `anchor` |

Use `chartLeoPeakAnchor()` from `@/lib/chart-leo-spotting` for plot-selector peaks.

## Wiring checklist

1. Pass `leoInsight` to `ChartFigure` (or `ChartCard` + `ChartFigure` — context only, no duplicate banners).
2. Wrap plot in `<div className="relative w-full …">`.
3. Mount overlay **sibling** to `ChartContainer`:

```tsx
<div className="relative w-full min-h-[260px]">
  <ChartContainer>…</ChartContainer>
  <ChartLeoPlotInsightOverlay
    chartFamily="heatmap"
    data={rows}
    xDataKey="month"
  />
</div>
```

4. For plot-selector charts, mark the peak element:

```tsx
data-chart-leo-anchor="peak"
```

on the Recharts cell (heatmap `Rectangle`, treemap tile, sankey link).

5. Always pair with `ChartDataTable` sr-only fallback.

## Chart family → overlay props

```tsx
import { chartLeoPlotOverlayProps, chartLeoPeakAnchor } from "@/lib/chart-leo-spotting"

// Cartesian
<ChartLeoPlotInsightOverlay {...chartLeoPlotOverlayProps({ family: "bar", data, xDataKey: "month" })} />

// Heatmap / treemap / sankey
anchor: chartLeoPeakAnchor()
<ChartLeoPlotInsightOverlay chartFamily="heatmap" />
```

## MUST NOT

- Inline “Leo spotted” banners above the chart.
- Icon-only plot markers without delta or headline text.
- Random corner chips unrelated to data.
- Hand-built HTML/CSS grids or Recharts `ScatterChart` rectangles masquerading as heatmaps — use `ChartHeatmap` (ECharts `heatmap` series, **canvas** renderer).
- For ECharts heatmap Leo spotting, use `ChartLeoPixelPlotInsightOverlay` with `convertToPixel` — not `ChartLeoPlotInsightOverlay` + `data-chart-leo-anchor`.

## A11y

- `ChartFigure` provides keyboard arrow navigation + live region.
- Plot Leo chip is pointer-accessible; full insight in popover + Ask Leo.
- Decorative connector/dot: `aria-hidden` on overlay chrome only — not on data table.

## See also

- `charts-overview.tsx` — WCAG graph standards in file header
- `exxat-accessibility` skill
- `apps/web/lib/design-system/component-docs/chart.tsx`
