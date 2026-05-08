# Gap Heatmap

**Question answered:** Where are the gaps across two dimensions (e.g., students × competencies, sites × KPIs, courses × outcomes)?

**Pattern ID:** `VIZ-PATTERN-001`
**Binds rules:** VIZ-005 (rubric reference), VIZ-003 (chart colors), VIZ-004 (no red), A11Y-008 (color not only encoding), A11Y-001 (icon-only Button aria-label), A11Y-002 (focus rings)

---

## When to use

- N entities × M attributes, both ≥ 5
- Goal: visually surface clusters of low/high performance
- Reader needs to spot rows or columns that systematically lag
- Single shared scale across all cells (e.g., 0–100% mastery)

## When NOT to use

| Situation | Use instead |
|---|---|
| N or M < 5 | Grouped bar (P3) |
| Each row has a different scale | Small multiples (P3) |
| Ranking only matters | Sorted bar (still bad if true outlier exists) |
| Two-variable scatter relationship | Scatter quadrants (P3) |

## Data shape

```ts
type GapHeatmapDatum = {
  rowLabel: string       // student, site, course
  colLabel: string       // competency, KPI, outcome
  value: number          // 0–1 normalized
  threshold?: number     // optional row/cell-specific threshold
  meta?: Record<string, unknown>
}

type GapHeatmapData = GapHeatmapDatum[]
```

## Visual spec

| Element | Spec |
|---|---|
| Cell shape | Square (aspect-ratio: 1) for ≤30 cols; rectangle for 30+ |
| Color above threshold | `color-mix(in oklch, var(--chart-2) ${intensity * 100}%, var(--background))` |
| Color below threshold | `color-mix(in oklch, var(--chart-4) ${(1 - intensity) * 100}%, var(--background))` (amber/orange — NOT red, **VIZ-004**) |
| Below-threshold border | 1px solid `var(--conditional-rule-orange)` |
| Row label | Left-aligned, 12px, `var(--foreground)`, truncate at 24ch with `title` |
| Column label | 12px, `var(--foreground)`, rotated 45° if N > 12 cols |
| In-cell value label | 10–11px, `var(--foreground)`, hide if cell width < 32px (use pattern fill instead) |
| Cell hover | Tooltip with row × col, value, threshold delta, drill-down link |
| Cell focus | `focus-visible:ring-2 focus-visible:ring-ring` |
| Empty cell (no data) | `bg-muted` + tooltip "no data" |

## A11y notes

- Each cell is a DS `Button` with explicit `aria-label="{rowLabel} × {colLabel}: {value}, {below threshold by N% if applicable}"`
- Color paired with: numeric value (in-cell at sufficient width); pattern fill or border below ~20px width (A11Y-008)
- Keyboard: cells focusable in row-major order; Enter activates drill-down; arrow keys navigate the grid (future enhancement)
- DialogTitle on drill-down (A11Y-006)

## Code recipe — admin profile (Exxat-DS)

> **Note:** DS Chart audit pending in P1 sub-phase 2. Heatmap is not a stock Recharts component, so this pattern uses CSS grid + DS tokens directly. Refactor to a DS primitive if/when one is added.

```tsx
'use client'
import { Button, Tooltip, TooltipTrigger, TooltipContent } from '@exxat/ds/packages/ui/src'

type GapHeatmapDatum = {
  rowLabel: string
  colLabel: string
  value: number
  threshold?: number
}

type Props = {
  data: GapHeatmapDatum[]
  threshold?: number
  onCellClick?: (d: GapHeatmapDatum) => void
  ariaLabel?: string
}

export function GapHeatmap({
  data,
  threshold = 0.6,
  onCellClick,
  ariaLabel = 'Gap heatmap',
}: Props) {
  const rows = Array.from(new Set(data.map(d => d.rowLabel)))
  const cols = Array.from(new Set(data.map(d => d.colLabel)))
  const lookup = new Map(data.map(d => [`${d.rowLabel}__${d.colLabel}`, d]))

  return (
    <div
      role="grid"
      aria-label={ariaLabel}
      className="grid gap-px bg-border rounded-md overflow-hidden"
      style={{
        gridTemplateColumns: `minmax(0, 200px) repeat(${cols.length}, minmax(40px, 1fr))`,
      }}
    >
      <div role="row" className="contents">
        <div role="columnheader" className="bg-card p-2" />
        {cols.map(col => (
          <div
            key={col}
            role="columnheader"
            className="bg-card p-2 text-xs font-medium text-foreground truncate"
            title={col}
          >
            {col}
          </div>
        ))}
      </div>

      {rows.map(row => (
        <div key={row} role="row" className="contents">
          <div
            role="rowheader"
            className="bg-card p-2 text-xs text-foreground truncate"
            title={row}
          >
            {row}
          </div>
          {cols.map(col => {
            const d = lookup.get(`${row}__${col}`)
            if (!d) {
              return (
                <div
                  key={col}
                  role="gridcell"
                  className="bg-muted"
                  aria-label={`${row} × ${col}: no data`}
                />
              )
            }
            const cellThreshold = d.threshold ?? threshold
            const isBelow = d.value < cellThreshold
            const intensity = Math.max(0, Math.min(1, d.value))
            const pct = (d.value * 100).toFixed(0)
            const ariaLabelCell = isBelow
              ? `${row} × ${col}: ${pct} percent, below threshold by ${((cellThreshold - d.value) * 100).toFixed(0)} percent`
              : `${row} × ${col}: ${pct} percent`

            return (
              <Tooltip key={col}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    role="gridcell"
                    aria-label={ariaLabelCell}
                    onClick={() => onCellClick?.(d)}
                    className="aspect-square w-full h-full rounded-none text-[10px] font-medium text-foreground"
                    style={{
                      backgroundColor: isBelow
                        ? `color-mix(in oklch, var(--chart-4) ${(1 - intensity) * 100}%, var(--background))`
                        : `color-mix(in oklch, var(--chart-2) ${intensity * 100}%, var(--background))`,
                      border: isBelow ? '1px solid var(--conditional-rule-orange)' : 'none',
                    }}
                  >
                    {pct}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs"><strong>{row}</strong> × {col}</div>
                  <div className="text-xs">Mastery: {pct}%</div>
                  {isBelow && (
                    <div className="text-xs">
                      Below threshold by {((cellThreshold - d.value) * 100).toFixed(0)}%
                    </div>
                  )}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      ))}
    </div>
  )
}
```

## Code recipe — student profile (StudentUX)

Same shape; swap imports:

```tsx
import { Button } from '@exxat/student/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@exxat/student/components/ui/tooltip'
```

Touch-target adjustment for student: increase `minmax(40px, 1fr)` → `minmax(44px, 1fr)` and add `min-height: 44px` per row to satisfy A11Y-005.

## Tokens used

| Token | Purpose | Rule |
|---|---|---|
| `--card`, `--background`, `--muted`, `--border`, `--foreground` | layout / surfaces | semantic |
| `--chart-2` | high mastery encoding | VIZ-003 |
| `--chart-4` | low mastery encoding (amber, NOT red) | VIZ-003, VIZ-004 |
| `--conditional-rule-orange` | below-threshold border | VIZ-004 |
| `--ring` | focus ring | A11Y-002 |

## Use cases (PCE-specific)

- **Student × competency mastery** — primary use case for PCE faculty home (gap analysis)
- **Site × KPI** — partner site performance dashboard
- **Course × outcome** — curricular mapping screen (Aarti's Mapping tab decision, May 7)
- **Cohort × milestone** — program director dashboard

## Anti-patterns (do not do)

- ❌ Replace `var(--chart-4)` with `var(--destructive)` — VIZ-004 violation (Aarti's no-red rule)
- ❌ Render as a grid of `<Progress>` bars — VIZ-001 violation, eye can't integrate dozens of independent bars
- ❌ Add a separate text list of "cells below threshold" beside the chart — VIZ-002 violation; the viz already shows it
- ❌ Drop the in-cell value label without an alt encoding (pattern fill / border) when cell width < 32px — A11Y-008 violation
- ❌ Use `<button>` raw element instead of DS `Button` — DS-001 violation
