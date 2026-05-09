'use client'

/**
 * ClevelandDot — ranked single-metric list with median reference line.
 *
 * Implements docs/patterns/viz/cleveland-dot.md (VIZ-PATTERN-005).
 * Replaces sorted bar charts for ranked entity lists (N ≤ 30).
 *
 * Per Cleveland (1985) perception experiments: dots beat bars on accuracy
 * of judgment for ranked data when zero-baseline is irrelevant.
 *
 * Color discipline (VIZ-004): below-threshold dots use --chart-4 amber,
 * NEVER --destructive red. This is THE redundant encoding (color +
 * position) for A11Y-008.
 */

import * as React from 'react'

export interface DotRow {
  id: string
  label: string
  value: number
  /** Optional category for coloring; uses --chart-1..5 */
  category?: 'a' | 'b' | 'c' | 'd' | 'e'
  /** Optional click-through */
  onClick?: () => void
}

interface Props {
  rows: DotRow[]
  /** Median reference value drawn as vertical line. If omitted, computed from rows. */
  median?: number
  /** Below-threshold dots get --chart-4 fill. */
  threshold?: number
  /** Numeric range; defaults to fit data */
  min?: number
  max?: number
  /** Format for value label, e.g. (n) => n.toFixed(1) */
  formatValue?: (n: number) => string
  /** Sort direction */
  sortDir?: 'asc' | 'desc'
  /** Total height; rows distribute */
  height?: number
  ariaLabel: string
  className?: string
}

const CATEGORY_COLORS: Record<NonNullable<DotRow['category']>, string> = {
  a: 'var(--chart-1)',
  b: 'var(--chart-2)',
  c: 'var(--chart-3)',
  d: 'var(--chart-4)',
  e: 'var(--chart-5)',
}

export function ClevelandDot({
  rows,
  median,
  threshold,
  min: minProp,
  max: maxProp,
  formatValue = (n) => n.toFixed(1),
  sortDir = 'desc',
  height,
  ariaLabel,
  className,
}: Props) {
  if (rows.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic" role="status">
        No data to display.
      </div>
    )
  }

  const values = rows.map(r => r.value)
  const computedMedian = median ?? values.slice().sort((a, b) => a - b)[Math.floor(values.length / 2)]
  const min = minProp ?? Math.min(...values, computedMedian) - 0.2
  const max = maxProp ?? Math.max(...values, computedMedian) + 0.2
  const range = max - min || 1

  const sorted = [...rows].sort((a, b) => sortDir === 'desc' ? b.value - a.value : a.value - b.value)
  const rowHeight = height ? Math.max(28, Math.floor(height / sorted.length)) : 32

  const belowCount = threshold !== undefined
    ? rows.filter(r => r.value < threshold).length
    : 0

  return (
    <section
      role="region"
      aria-label={ariaLabel}
      className={className}
    >
      <div className="flex flex-col gap-0">
        {sorted.map((r) => {
          const pct = ((r.value - min) / range) * 100
          const isBelow = threshold !== undefined && r.value < threshold
          const dotColor = isBelow
            ? 'var(--chart-4)'  // amber, NOT red — VIZ-004
            : (r.category ? CATEGORY_COLORS[r.category] : 'var(--chart-1)')

          return (
            <div
              key={r.id}
              className="grid items-center gap-3 px-2 transition-colors"
              style={{
                gridTemplateColumns: '160px 1fr 60px',
                height: rowHeight,
                cursor: r.onClick ? 'pointer' : 'default',
              }}
              onClick={r.onClick}
              onKeyDown={r.onClick ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  r.onClick?.()
                }
              } : undefined}
              tabIndex={r.onClick ? 0 : -1}
              role={r.onClick ? 'button' : 'listitem'}
              aria-label={r.onClick ? `${r.label}: ${formatValue(r.value)}${isBelow ? ' (below threshold)' : ''}` : undefined}
            >
              <span className="text-sm truncate">{r.label}</span>
              <div className="relative h-full flex items-center">
                {/* Median reference line */}
                <div
                  className="absolute top-1/2 h-3 w-px -translate-y-1/2"
                  style={{
                    left: `${((computedMedian - min) / range) * 100}%`,
                    background: 'var(--foreground)',
                    opacity: 0.4,
                  }}
                  aria-hidden="true"
                />
                {/* Threshold dashed line if provided */}
                {threshold !== undefined && (
                  <div
                    className="absolute top-1/2 h-2 w-px -translate-y-1/2"
                    style={{
                      left: `${((threshold - min) / range) * 100}%`,
                      borderLeft: `1px dashed var(--chart-4)`,
                    }}
                    aria-hidden="true"
                  />
                )}
                {/* The dot */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full"
                  style={{
                    left: `${pct}%`,
                    width: 10,
                    height: 10,
                    background: dotColor,
                  }}
                  aria-hidden="true"
                />
              </div>
              <span
                className="text-sm tabular-nums text-right"
                style={isBelow ? { color: 'var(--chart-4)', fontWeight: 500 } : undefined}
              >
                {formatValue(r.value)}
                {isBelow && (
                  <i
                    className="fa-light fa-triangle-exclamation ms-1 text-xs"
                    style={{ color: 'var(--chart-4)' }}
                    aria-label="below threshold"
                  />
                )}
              </span>
            </div>
          )
        })}
      </div>
      {/* Annotation strip below */}
      <div
        className="grid mt-2 pt-2"
        style={{
          gridTemplateColumns: '160px 1fr 60px',
          gap: '0.75rem',
          padding: '0 0.5rem',
          borderTop: '1px solid var(--border)',
        }}
      >
        <span />
        <div className="relative">
          <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
            <span>{formatValue(min)}</span>
            <span>{formatValue(max)}</span>
          </div>
        </div>
        <span />
      </div>
      {threshold !== undefined && belowCount > 0 && (
        <p className="text-xs text-muted-foreground mt-2 px-2">
          {belowCount} {belowCount === 1 ? 'item' : 'items'} below {formatValue(threshold)} threshold.
          Median: {formatValue(computedMedian)}.
        </p>
      )}
    </section>
  )
}
