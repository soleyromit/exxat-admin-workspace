# Slope Graph (Paired Comparison)

**Question answered:** How did N entities change between two points (Q1→Q2 cohort, Pre→Post test, Term1→Term2)?

**Pattern ID:** `VIZ-PATTERN-004`
**Binds rules:** VIZ-001 (avoid progress bars), VIZ-002 (viz first), VIZ-004 (no red), VIZ-006 (cohort comparison must be pairing not duo-numbers)

---

## When to use

- Cohort A → cohort B comparison per entity (RUBRIC Q5)
- Pre/post intervention measurement
- Term-over-term course rating (Spring → Fall)
- Faculty rating change between assessments
- Anywhere you'd otherwise show "Q1: 4.2 / Q2: 4.5" as duo-numbers

**Replaces in current product:**
- PCE term-over-term comparison (currently shown as two separate metric cards) — switch to slope graph
- Exam-management cohort score deltas (currently text-only "+0.3") — switch to slope graph

## When NOT to use

- ≥3 time points (use line chart)
- Single entity (use sparkline + delta)
- When rank changes matter more than values (use bump chart — defer until needed)

## Anatomy

```
Pre-test (Mar 1)              Post-test (Apr 15)
                                                       
Cohort 24A     ●─────────────────────────────●        4.6
                  4.1 → 4.6 (movers ↑)                
Cohort 24B     ●─────────────────────────────●        4.3
                  4.3 → 4.3 (flat)                    
Cohort 24C     ●─────────────────────────╲              
                  4.5 → 4.0 (declined)    ╲           
                                           ●          4.0
                                                       
Cohort 24D     ●─────────────────────────────●        4.5
                  4.2 → 4.5 (movers ↑)                
                                                       
Median: 4.3                                Median: 4.4
        ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─                
                                                       
Takeaway: 3 of 4 cohorts improved. Cohort 24C declined 0.5 points.
```

## DS tokens

| Token | Use |
|---|---|
| `--chart-1` (indigo) | Stroke for "improved" lines |
| `--chart-4` (amber) | Stroke for "declined" lines (NEVER red — VIZ-004) |
| `--muted-foreground` | Stroke for "flat" lines |
| Endpoint dots | Filled with same color as line; radius 4-5 |
| `--foreground` | Entity labels at endpoints |
| `--text-xs` | Endpoint value labels (11px) |
| `--border` (dashed) | Median reference line |

## Annotation discipline

- **Label every line at BOTH ends** — entity name + value. No legend.
- **Thicken movers** — entities crossing the median get `strokeWidth: 2`; flat lines get `strokeWidth: 1` and 30% opacity.
- **No y-axis** — endpoint values ARE the axis. Saves ink, reads faster.
- **Median reference line** — horizontal dashed line at cohort median (each side).
- **One-line takeaway below the chart** — "3 of 4 cohorts improved" — never make the reader compute the headline.

## Anti-patterns

- ❌ Sorting lines alphabetically — the crossings ARE the signal
- ❌ Adding a y-axis — endpoint values are the axis (Tufte: minimum chartjunk)
- ❌ Coloring "declined" red (VIZ-004) — use amber
- ❌ Showing without takeaway sentence (VIZ-008 spirit)
- ❌ Animating the slope reveal (DS-009 / "no visual polish beyond DS")

## Code skeleton (Recharts)

```tsx
'use client'
import { LineChart, Line, ReferenceLine, Label } from 'recharts'

type Entity = { id: string; label: string; pre: number; post: number; trend: 'up' | 'down' | 'flat' }

function strokeFor(trend: Entity['trend']): string {
  if (trend === 'up') return 'var(--chart-1)'
  if (trend === 'down') return 'var(--chart-4)'  // NEVER --destructive
  return 'var(--muted-foreground)'
}

// One <Line> per entity, with explicit data of [{x:'pre', y:e.pre}, {x:'post', y:e.post}]
// strokeWidth={trend === 'flat' ? 1 : 2}
// opacity={trend === 'flat' ? 0.3 : 1}
// Endpoint labels via <LabelList> on the line
```

## Why this elevates beyond current

Replaces "Q1: 4.2 / Q2: 4.5" duo-numbers with a chart where the eye literally sees who moved and how far. The crossings (cohorts that swap rank) are the headline, not a footnote. Single-glance cohort intelligence; fits in a 200×100 card or scaled to 600×300 for a hero.

## See also

- `docs/patterns/viz/bullet-vs-target.md` (current cohort vs target single-entity)
- `docs/patterns/viz/small-multiples.md` (when ≥3 timepoints OR many entities)
- DESIGN.md VIZ-006 (cohort comparison rule)
