'use client'

/**
 * CalendarHeatmap — GitHub-style weekday × week intensity grid.
 *
 * Implements docs/patterns/viz/calendar-heatmap.md (VIZ-PATTERN-007).
 * Binds DESIGN.md VIZ-008 (≥30 day windows must preserve day-of-week).
 *
 * Surfaces "Friday submission spike" or "deadline-week clustering" patterns
 * that line charts smooth away. Empty cells use --muted (not --destructive).
 */

import * as React from 'react'

export interface CalendarDay {
  /** ISO date YYYY-MM-DD */
  date: string
  count: number
}

interface Props {
  days: CalendarDay[]
  /** Cell size in px (square). Default 12. */
  cellSize?: number
  /** Gap between cells in px. Default 2. */
  cellGap?: number
  /** Tooltip text builder; default "DATE: COUNT" */
  tooltipText?: (day: CalendarDay) => string
  /** Today's date in ISO; gets --ring border. Defaults to today. */
  todayIso?: string
  ariaLabel: string
  className?: string
}

export function CalendarHeatmap({
  days,
  cellSize = 12,
  cellGap = 2,
  tooltipText,
  todayIso = new Date().toISOString().slice(0, 10),
  ariaLabel,
  className,
}: Props) {
  if (days.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic" role="status">
        No activity data.
      </div>
    )
  }

  const max = Math.max(...days.map(d => d.count), 1)

  // Group days by week (columns) — Monday-start weeks for healthcare-program use
  // (Aarti's framing favors weekday clustering visibility).
  const grouped: { week: number; daysOfWeek: (CalendarDay | null)[] }[] = []
  const startDate = new Date(days[0].date)
  // Find the Monday on/before startDate
  const startDow = startDate.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
  const dowMonStart = (startDow + 6) % 7 // 0=Mon, 6=Sun
  const firstMonday = new Date(startDate)
  firstMonday.setDate(startDate.getDate() - dowMonStart)

  let cursor = new Date(firstMonday)
  let weekIdx = 0
  while (cursor <= new Date(days[days.length - 1].date)) {
    const week: (CalendarDay | null)[] = []
    for (let i = 0; i < 7; i++) {
      const iso = cursor.toISOString().slice(0, 10)
      const found = days.find(d => d.date === iso)
      week.push(found ?? null)
      cursor.setDate(cursor.getDate() + 1)
    }
    grouped.push({ week: weekIdx++, daysOfWeek: week })
  }

  const intensityFor = (count: number): string => {
    if (count === 0) return 'var(--muted)'
    const pct = Math.min(100, Math.round((count / max) * 100))
    return `color-mix(in oklch, var(--chart-1) ${pct}%, var(--background))`
  }

  // Month-boundary tick: column where the 1st of a month appears in week
  const monthBoundaries: { weekIdx: number; label: string }[] = []
  grouped.forEach((g, i) => {
    g.daysOfWeek.forEach(d => {
      if (d && d.date.endsWith('-01')) {
        const month = new Date(d.date).toLocaleString('en-US', { month: 'short' })
        if (!monthBoundaries.some(m => m.label === month)) {
          monthBoundaries.push({ weekIdx: i, label: month })
        }
      }
    })
  })

  return (
    <section role="region" aria-label={ariaLabel} className={className}>
      <div className="flex gap-2">
        {/* Weekday labels — only M / W / F shown to save ink */}
        <div className="flex flex-col" style={{ gap: cellGap, paddingTop: 14 /* leave room for month row */ }}>
          {['M', '', 'W', '', 'F', '', ''].map((label, i) => (
            <div
              key={i}
              className="text-xs text-muted-foreground"
              style={{ height: cellSize, lineHeight: `${cellSize}px`, width: 14 }}
              aria-hidden="true"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="flex flex-col">
          {/* Month row */}
          <div className="flex" style={{ gap: cellGap, height: 14 }}>
            {grouped.map((g, i) => {
              const boundary = monthBoundaries.find(m => m.weekIdx === i)
              return (
                <div
                  key={i}
                  className="text-xs text-muted-foreground"
                  style={{ width: cellSize }}
                  aria-hidden="true"
                >
                  {boundary?.label}
                </div>
              )
            })}
          </div>

          {/* Cell grid: 7 rows (Mon-Sun) × N columns (weeks) */}
          <div className="flex" style={{ gap: cellGap }}>
            {grouped.map((g, wi) => (
              <div key={wi} className="flex flex-col" style={{ gap: cellGap }}>
                {g.daysOfWeek.map((d, di) => {
                  if (!d) {
                    return (
                      <div
                        key={di}
                        style={{ width: cellSize, height: cellSize }}
                        aria-hidden="true"
                      />
                    )
                  }
                  const isToday = d.date === todayIso
                  const isWeekend = di >= 5 // Sat (5) or Sun (6) in Mon-start
                  return (
                    <div
                      key={di}
                      role="gridcell"
                      aria-label={tooltipText?.(d) ?? `${d.date}: ${d.count}`}
                      className="rounded-sm"
                      style={{
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: intensityFor(d.count),
                        border: isToday ? '1.5px solid var(--ring)' : 'none',
                        opacity: isWeekend && d.count === 0 ? 0.4 : 1,
                      }}
                      title={tooltipText?.(d) ?? `${d.date}: ${d.count}`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend strip */}
      <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
        <span>fewer</span>
        {[0, 0.2, 0.5, 0.75, 1].map((pct, i) => (
          <div
            key={i}
            className="rounded-sm"
            style={{
              width: cellSize,
              height: cellSize,
              backgroundColor:
                pct === 0
                  ? 'var(--muted)'
                  : `color-mix(in oklch, var(--chart-1) ${pct * 100}%, var(--background))`,
            }}
            aria-hidden="true"
          />
        ))}
        <span>more</span>
      </div>
    </section>
  )
}
