# Outlier Strip Plot

**Question answered:** Who is an outlier across N entities (students, sites, items, courses)?

**Pattern ID:** `VIZ-PATTERN-002`
**Binds rules:** VIZ-002, VIZ-003, VIZ-004, A11Y-001, A11Y-002, A11Y-008

---

## When to use

- N entities ≥ 10 (more = stronger pattern)
- Single numeric variable per entity (score, time, count, ratio)
- Reader needs to spot tails, clusters, outliers
- Outliers should action: drill down, flag, intervene

## When NOT to use

| Situation | Use instead |
|---|---|
| N < 10 | Sorted bar (still flawed if outlier exists) |
| Two-variable comparison | Scatter quadrants (P3) |
| Distribution shape matters | Box plot or histogram (P3) |
| Need to show change over time | Slope chart or line (P3) |

## Data shape

```ts
type StripDatum = {
  id: string
  label: string
  value: number
  category?: string  // optional grouping
  flagged?: boolean  // pre-computed outlier marker
  meta?: Record<string, unknown>
}
```

## Visual spec

| Element | Spec |
|---|---|
| Container | `role="img"` with descriptive aria-label |
| Axis | Horizontal, scale.min → scale.max (or data-derived) |
| Marker | Circle, 12px diameter (admin), 16px (student for touch) |
| Y jitter | Modular 0–N px to avoid stacking; flat if N small |
| Median line | 2px solid `var(--foreground)`, full height, labeled "median" |
| Normal marker | Fill `var(--chart-1)` |
| Outlier marker | Fill `var(--chart-4)` + 2px outline `var(--conditional-rule-orange)` |
| Outlier label | Direct text label on chart, 10px, above marker (A11Y-008) |
| Hover | Tooltip with label, value, optional percentile |
| Click | Drill-down route to entity detail |

## A11y notes

- Container `role="img"` with aria-label describing the distribution shape
- Each marker is a focusable DS Button with `aria-label="{label}: {value}{, outlier if flagged}"`
- Outliers labeled directly on the chart (text), not just by color (A11Y-008)
- Keyboard: Tab through markers in DOM order
- Focus ring honored via `--ring` (A11Y-002)

## Code recipe — admin profile (Exxat-DS)

> DS Chart wrapper API not yet audited. Markers use absolute-positioned DS `Button` elements (no Recharts needed for 1D plot).

```tsx
'use client'
import { Button, Tooltip, TooltipTrigger, TooltipContent } from '@exxat/ds/packages/ui/src'

type StripDatum = {
  id: string
  label: string
  value: number
  flagged?: boolean
}

type Props = {
  data: StripDatum[]
  scale?: { min: number; max: number }
  onMarkerClick?: (d: StripDatum) => void
  ariaLabel?: string
}

export function OutlierStripPlot({
  data,
  scale,
  onMarkerClick,
  ariaLabel = 'Distribution of values; outliers highlighted',
}: Props) {
  if (data.length === 0) return null

  const values = data.map(d => d.value).sort((a, b) => a - b)
  const min = scale?.min ?? values[0]
  const max = scale?.max ?? values[values.length - 1]
  const median = values[Math.floor(values.length / 2)]
  const q1 = values[Math.floor(values.length / 4)]
  const q3 = values[Math.floor(values.length * 3 / 4)]
  const iqr = q3 - q1
  const lowerFence = q1 - 1.5 * iqr
  const upperFence = q3 + 1.5 * iqr

  const pct = (v: number) => ((v - min) / (max - min || 1)) * 100
  const isOutlier = (d: StripDatum) =>
    d.flagged ?? (d.value < lowerFence || d.value > upperFence)

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className="relative w-full h-24 bg-card border border-border rounded-md p-3"
    >
      {/* Median line */}
      <div
        className="absolute top-3 bottom-6 w-px bg-foreground"
        style={{ left: `calc(${pct(median)}% + 12px)` }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-1 text-[10px] text-muted-foreground"
        style={{ left: `calc(${pct(median)}% + 14px)` }}
        aria-hidden="true"
      >
        median
      </div>

      {/* Markers */}
      {data.map((d, i) => {
        const outlier = isOutlier(d)
        const yJitter = (i % 5) * 6 - 12
        return (
          <Tooltip key={d.id}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`${d.label}: ${d.value}${outlier ? ', outlier' : ''}`}
                onClick={() => onMarkerClick?.(d)}
                className="absolute rounded-full p-0 transition-transform hover:scale-125 focus-visible:scale-125"
                style={{
                  left: `calc(${pct(d.value)}% + 6px)`,
                  top: `calc(50% + ${yJitter}px)`,
                  width: 12,
                  height: 12,
                  backgroundColor: outlier ? 'var(--chart-4)' : 'var(--chart-1)',
                  outline: outlier ? '2px solid var(--conditional-rule-orange)' : 'none',
                  outlineOffset: 1,
                }}
              />
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs"><strong>{d.label}</strong></div>
              <div className="text-xs">Value: {d.value}</div>
              {outlier && <div className="text-xs">Flagged outlier</div>}
            </TooltipContent>
          </Tooltip>
        )
      })}

      {/* Outlier text labels (A11Y-008) */}
      {data.filter(isOutlier).map(d => (
        <div
          key={`label-${d.id}`}
          className="absolute text-[10px] font-medium text-foreground pointer-events-none"
          style={{
            left: `calc(${pct(d.value)}% + 6px)`,
            top: 4,
            transform: 'translateX(-50%)',
            maxWidth: 80,
          }}
          aria-hidden="true"
        >
          {d.label}
        </div>
      ))}
    </div>
  )
}
```

## Code recipe — student profile (StudentUX)

Swap imports to per-file:

```tsx
import { Button } from '@exxat/student/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@exxat/student/components/ui/tooltip'
```

Adjustments for A11Y-005 (touch targets):
- Marker hit area `width: 16, height: 16`, with extra padding so total target ≥ 44×44 (`p-3 -m-3` trick or wrap in `min-w-11 min-h-11`)
- Container `h-32` instead of `h-24` for more vertical breathing room

## Tokens used

| Token | Purpose | Rule |
|---|---|---|
| `--card`, `--background`, `--border`, `--foreground`, `--muted-foreground` | layout, axis, label | semantic |
| `--chart-1` | normal marker fill | VIZ-003 |
| `--chart-4` | outlier marker fill (amber, NOT red) | VIZ-003, VIZ-004 |
| `--conditional-rule-orange` | outlier outline | VIZ-004 |
| `--ring` | focus ring | A11Y-002 |

## Use cases (PCE-specific)

- **Student score distribution per assessment** — spot students far below cohort
- **Time-to-completion across students** — flag students taking far longer than median
- **Item discrimination across question bank** — flag too-easy / too-hard items
- **Site placement count per partner** — highlight partners receiving disproportionate load

## Anti-patterns

- ❌ Sorted bar list with no median line — outlier hidden in middle of ranking
- ❌ Color outliers red — VIZ-004 violation, use amber `--chart-4`
- ❌ Enumerate outliers in prose beside the chart — VIZ-002 violation; the chart already shows them
- ❌ Drop labels on outliers (color-only encoding) — A11Y-008 violation
- ❌ Use raw `<button>` for markers — DS-001 violation, use DS Button
