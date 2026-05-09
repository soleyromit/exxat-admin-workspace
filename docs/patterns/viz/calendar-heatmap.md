# Calendar Heatmap

**Question answered:** When over time did activity happen, with day-of-week and seasonality patterns intact?

**Pattern ID:** `VIZ-PATTERN-007`
**Binds rules:** VIZ-002 (viz first), VIZ-003 (chart tokens), VIZ-004 (no red), VIZ-008 (≥30 day windows must use this), A11Y-008 (color not only encoding)

> GitHub-style calendar. Universally recognized; surfaces "Friday submission spike" or "all activity in week-of-deadline" patterns no line chart can.

---

## When to use

- Assessment activity by day (exam-management) — when do students submit?
- Survey submission cadence (PCE) — when do faculty respond?
- Student log entries by day (patient-log when scaffolded)
- Placement-event density (PCE term planning)
- Any activity-over-time spanning ≥30 days where day-of-week matters

**Replaces in current product:**
- "Submissions over time" line charts that hide weekday-vs-weekend patterns
- Numeric "X submissions this term" text — calendar shows the WHEN

## When NOT to use

- < 30 days of data (use bar by day)
- When only totals matter (use a count card)
- Continuous metrics that vary smoothly day-to-day (use line or area)
- When the metric is a value (not a count/intensity) — use line

## Anatomy

```
                Mar              Apr              May
        M  T  W  T  F  S  S    M  T  W  T  F  S  S    M  T  W  T  F  S  S 
Wk 1 │  ▣  ▣  ▢  ▢  ▣  ░  ░    ▤  ▤  ▥  ▦  ▤  ░  ░    ▣  ▣  ▣  ▣  ▤  ░  ░ 
Wk 2 │  ▣  ▤  ▥  ▦  ▤  ░  ░    ▣  ▣  ▣  ▣  ▤  ░  ░    ▤  ▥  ▦  ▦  ▤  ░  ░ 
Wk 3 │  ▢  ▢  ▢  ▣  ▣  ░  ░    ▣  ▣  ▤  ▥  ▦  ░  ░    ▣  ▣  ▣  ▣  ▤  ░  ░ 
Wk 4 │  ▣  ▣  ▤  ▥  ▦  ░  ░    ▤  ▤  ▥  ▦  ▤  ░  ░    ▣  ▤  ▥  ▦  ▦  ░  ░ 

Legend:  fewer ░ ▢ ▣ ▤ ▥ ▦ more
                    ↑
                  today

Takeaway: Submissions cluster Thursdays + Fridays; weekends near-zero.
```

(Real version is a CSS grid of squares, intensity-tinted via `color-mix`.)

## DS tokens

| Token | Use |
|---|---|
| `color-mix(in oklch, var(--chart-1) ${pct}%, var(--background))` | Cell intensity (0% empty → 100% max) |
| `--ring` | 1.5px border on today's cell |
| `--muted` | Weekend cell background (subtle ghosting under content) |
| `--interactive-hover-row` | Cell hover bg |
| `--text-xs` | Month + weekday labels (11px) |
| `--muted-foreground` | All axis labels |

## Annotation discipline

- **Month boundary tick** — 1px line on the column above the first cell of each month
- **Weekday labels** — only M / W / F shown on the leftmost column (saves ink)
- **Legend strip** — 5 swatches in a horizontal strip with "fewer ←→ more" labels (per FT/GitHub)
- **Today marker** — `--ring` border, no fill change
- **Hover popover** — exact date + count on each cell hover (use DS Popover, not native title)
- **One-line takeaway below** — "Submissions cluster Thursdays + Fridays" — surface the pattern, don't make the reader find it

## Anti-patterns

- ❌ Use `--destructive` for "no activity" — empty cells are just `--muted` background (VIZ-004)
- ❌ Render as a continuous line (loses day-of-week — that's the whole point of this pattern)
- ❌ Show empty/missing days differently from low-count days (visually identical to "low" — let count carry the signal)
- ❌ Use rainbow / jet colormap (per VIZ-009 spirit — sequential lightness ramp only)
- ❌ Add Y-axis labels for every week (use month boundaries instead)
- ❌ Animate cells on initial render (DS-009)

## Code skeleton

```tsx
'use client'

type Day = { date: string; count: number }

function intensityFor(count: number, max: number): string {
  if (count === 0) return 'var(--muted)'
  const pct = Math.min(100, Math.round((count / max) * 100))
  return `color-mix(in oklch, var(--chart-1) ${pct}%, var(--background))`
}

const max = Math.max(...days.map(d => d.count))
const today = new Date().toISOString().slice(0, 10)

// Render as a CSS grid: 7 rows (Mon-Sun) × N columns (one per week)
return (
  <div role="grid" className="grid grid-flow-col grid-rows-7 gap-px">
    {days.map(d => {
      const isToday = d.date === today
      const isWeekend = [0, 6].includes(new Date(d.date).getDay())
      return (
        <div
          key={d.date}
          role="gridcell"
          aria-label={`${d.date}: ${d.count} submissions`}
          className="w-3 h-3 rounded-sm"
          style={{
            backgroundColor: intensityFor(d.count, max),
            border: isToday ? '1.5px solid var(--ring)' : undefined,
            opacity: isWeekend && d.count === 0 ? 0.4 : 1,
          }}
        />
      )
    })}
  </div>
)
```

## Why this elevates beyond current

A line chart over 90 days collapses the ~26 weekend days into the same shape as the 64 weekday days. Calendar heatmap preserves the weekly cycle, the day-of-week intuition, and the deadline-week clustering — all things admin work cares about. GitHub's contribution graph is universally recognizable; users orient instantly.

## See also

- `docs/patterns/viz/small-multiples.md` (one calendar per facet — per-faculty, per-cohort)
- DESIGN.md VIZ-008 (≥30 day windows must preserve day-of-week)
