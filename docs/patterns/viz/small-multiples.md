# Small Multiples Panel

**Question answered:** How does a single chart shape vary across a faceting dimension (per faculty, per cohort, per program, per term)?

**Pattern ID:** `VIZ-PATTERN-006`
**Binds rules:** VIZ-002 (viz first), VIZ-007 (faceted views = small multiples, NOT dropdowns), A11Y-008 (panel order is meaningful)

> Per Tufte (*Visual Display of Quantitative Information*): "The single most powerful idea in modern data visualization." The eye scans 16 mini-charts in 5 seconds; outliers self-announce.

---

## When to use

- Faculty home: 1 sparkline per course they teach (4-12 panels)
- PCE program-director view: 1 mini-bullet per cohort
- Question-bank analytics: 1 difficulty histogram per topic
- Per-faculty assessment-completion rate over time
- Per-site placement-volume by month
- Per-term curriculum-coverage heatmap

**Replaces in current product:**
- Per-cohort dropdown that swaps a single chart (currently a pattern in PCE term filter) — eliminate the dropdown, show all cohorts at once
- "Filter by faculty" dropdowns on faculty dashboards — show all faculty as panels

## When NOT to use

- Single chart with category encoding suffices (≤5 series → use one chart with colored lines)
- Facet count > 24 (introduce search/filter first; small multiples breaks down)
- Each panel needs a different y-scale (then it's not a multiple — it's separate charts)
- Cross-panel comparison at precise values matters more than pattern (use one chart with annotation)

## Anatomy

```
Pharm I (Spring)      Pharm I (Fall)        Pharm II (Spring)
   ●──●─●─●            ●──●─●─●               ●──●─●─●
  /                     ╲                    /
 ●                       ●                  ●
                                                              
Submissions: 142     Submissions: 128      Submissions: 156   
Avg score:   4.3     Avg score:   4.0 ⚠    Avg score:   4.5   
                                                              
Path I (Spring)      Path I (Fall)         Path II (Spring)   
   ●──●─●─●            ●──●─●─●               ●──●─●─●
  /                   /                     /
 ●                   ●                     ●
                                                              
Submissions: 98      Submissions: 102      Submissions: 110   
Avg score:   4.2     Avg score:   4.1      Avg score:   4.4   

[shared y-axis: 0-200 submissions / 3.0-5.0 rating]
                              ↑
              SAME for every panel — meaning preserved
```

## DS tokens

| Token | Use |
|---|---|
| `--chart-1` (indigo) | Default panel stroke / fill |
| `--chart-4` (amber) | Outlier panel highlight |
| `--conditional-rule-orange` | 1px border on outlier panel |
| `--muted-foreground` | Panel header text (11px) |
| `--text-xs` | All panel labels (11px) |
| `--border` | Subtle 1px panel divider |

## Annotation discipline

- **Shared y-axis** — labeled ONCE on the leftmost panel only. All other panels MUST share the same scale (otherwise it's no longer a multiple).
- **Each panel header** = facet name + single summary stat ("Submissions: 142")
- **Outlier panel gets a 1px amber border** (`--conditional-rule-orange`) to draw the eye
- **Sort panels by the summary stat** — never random/alphabetical (sorted reveals the story)
- **No gridlines per panel** — shared axis carries the references
- **Min 3, max ~24 panels** — outside that range, use a different pattern

## Anti-patterns

- ❌ Different y-scales per panel (defeats comparison; reads as random charts)
- ❌ Random or alphabetical panel order (sort by summary stat or category)
- ❌ Adding gridlines per panel (chartjunk; shared axis is enough)
- ❌ Panel headers in 14px+ (use 11px — panels are mini, headers must be too)
- ❌ Animating panels appearing one by one (DS-009)
- ❌ Using small multiples when one chart with categories would do (≤5 series → one chart)

## Code skeleton

```tsx
'use client'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

type Facet = { id: string; label: string; data: { x: string; y: number }[]; summary: string; isOutlier?: boolean }

const yMin = Math.min(...allPoints.map(p => p.y))
const yMax = Math.max(...allPoints.map(p => p.y))

facets.sort((a, b) => extractSortValue(b.summary) - extractSortValue(a.summary))

return (
  <div className="grid grid-cols-3 lg:grid-cols-4 gap-3">
    {facets.map(f => (
      <div
        key={f.id}
        className="p-2 rounded-md"
        style={f.isOutlier ? { border: '1px solid var(--conditional-rule-orange)' } : { border: '1px solid var(--border)' }}
      >
        <div className="text-xs text-muted-foreground mb-1">{f.label}</div>
        <ResponsiveContainer width="100%" height={60}>
          <LineChart data={f.data}>
            <Line type="monotone" dataKey="y" stroke="var(--chart-1)" strokeWidth={1.5} dot={false} />
            {/* shared YAxis range yMin..yMax — set on parent or per-panel with same limits */}
          </LineChart>
        </ResponsiveContainer>
        <div className="text-xs">{f.summary}</div>
      </div>
    ))}
  </div>
)
```

## Why this elevates beyond current

Replaces "select faculty from dropdown → see chart" (sequential, mental-state-tax) with "see all 12 faculty at once, eye picks the outlier" (parallel, free-discovery). This is the faculty-home unlock. Per Tufte: "Small multiples enforce comparisons. The eye is invited to make a large number of comparisons across a small visual area, with each comparison rapid and without strain."

## See also

- `docs/patterns/viz/cleveland-dot.md` (single ranked metric)
- `docs/patterns/viz/calendar-heatmap.md` (one when-over-time per facet)
- DESIGN.md VIZ-007 (faceted views default to multiples, not dropdowns)
