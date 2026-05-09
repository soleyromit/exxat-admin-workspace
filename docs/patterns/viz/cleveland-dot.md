# Cleveland Dot Plot (Ranked List)

**Question answered:** Who or what is highest and lowest on a single metric across N≤30 named entities?

**Pattern ID:** `VIZ-PATTERN-005`
**Binds rules:** VIZ-002 (viz first), VIZ-003 (chart tokens), VIZ-004 (no red), VIZ-007 (banned bar charts in this case), A11Y-001 (focus visible), A11Y-008 (color not only encoding)

---

## When to use

- Ranked competency rate per student (faculty needs "who's struggling")
- Ranked partner-site placement count (PCE)
- Ranked faculty response rate
- Ranked course completion percentage
- Anywhere you'd otherwise use a sorted horizontal bar chart with ≤30 entries

**Replaces in current product:**
- Sorted-bar lists in exam-management "students by mastery"
- PCE "sites by placements" lists
- Anywhere a `<table>` with embedded progress bars exists for a ranking

## When NOT to use

- N > 30 entities (use strip plot with jitter — `outlier-strip-plot.md`)
- Two metrics need correlation (use scatter)
- Time series (use slope or line)
- Magnitude/sum matters most (e.g., "total revenue" — bar is right; baseline at zero matters)

## Anatomy

```
                                Median: 78%
                                      │
Student A                       ●────│             92%
Student B                     ●──────│             86%
Student C                  ●─────────│             82%
Student D              ●────────────│              79%
Student E         ●─────────────────│               77%   ← below median
Student F      ●────────────────────│               73%   ← below median (amber)
Student G   ●───────────────────────│               68%   ← below threshold
Student H ●─────────────────────────│               62%   ← below threshold (amber)
                                      │
        50          60          70    │  80          90      100%
                                Median: 78%
```

## DS tokens

| Token | Use |
|---|---|
| `--chart-1` (indigo) | Default dot fill (above median) |
| `--chart-4` (amber) | Dot fill for "below threshold" (NEVER red — VIZ-004) |
| `--foreground` | Median reference line + entity labels |
| `--muted-foreground` | Axis ticks (only ends labeled) |
| `--interactive-hover-row` | Row hover background |
| `--ring` | Focus ring on row (A11Y-001) |

## Annotation discipline

- **Vertical median reference line** — drawn ON the chart, labeled at top
- **Direct labels on extreme dots** — top dot + bottom dot labeled with delta-from-median ("+14", "−16")
- **Group rows by category if `category` provided** — color-encode with `--chart-1..5`; do NOT use color to encode the metric (position does that)
- **Sort by metric** — descending by default; let the user toggle to ascending
- **Below-threshold styling** — dots ≤ threshold use `--chart-4`; this is THE redundant encoding (color + position) for A11Y-008
- **One-line takeaway below the chart** — "3 of 8 students below 75% threshold; lowest is Student H at 62%"

## Anti-patterns

- ❌ Use of horizontal bar chart for the same job (more ink, no advantage)
- ❌ Coloring the top dot green to suggest "good" — let position carry rank (cleaner)
- ❌ Sorting alphabetically by name (defeats the point — you came here to find extremes)
- ❌ Using `--destructive` for below-threshold (VIZ-004)
- ❌ Showing N>30 entities — use strip plot at that point
- ❌ Hiding the median reference line — that's the anchor

## Code skeleton (Recharts horizontal scatter)

```tsx
'use client'
import { ScatterChart, Scatter, XAxis, YAxis, ReferenceLine } from 'recharts'

type Row = { id: string; label: string; value: number; category?: string }

const median = computeMedian(rows.map(r => r.value))
const threshold = props.threshold ?? median  // can be set per metric

function fillFor(value: number): string {
  return value < threshold ? 'var(--chart-4)' : 'var(--chart-1)'
}

// XAxis: numeric metric; YAxis: type='category' with row labels
// Single <Scatter> with custom shape function returning <circle r={5} fill={fillFor(value)} />
// <ReferenceLine x={median} stroke='var(--foreground)' strokeDasharray='4 2'>
//   <Label value={`Median: ${median.toFixed(1)}%`} position='top' />
// </ReferenceLine>
```

## Why this elevates beyond current

Bars dominate visually; dots let the eye lock onto position. Adding a median reference line lets a faculty member see "I'm 3 points above median" in one read — bars require mental calibration to a baseline that doesn't show the median. Per Schwabish ("Five Charts You've Never Used But Should") and Cleveland's original perception experiments, dot plots beat bars on accuracy of judgment for ranked data when zero-baseline is irrelevant.

## See also

- `docs/patterns/viz/outlier-strip-plot.md` (when N > 30)
- `docs/patterns/viz/bullet-vs-target.md` (when target/qualitative ranges matter)
- DESIGN.md VIZ-007 (faceted views = small multiples, not dropdowns)
