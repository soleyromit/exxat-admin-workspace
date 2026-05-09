'use client'

/**
 * SmallMultiples — panel grid of mini-charts faceted on a single dimension.
 *
 * Implements docs/patterns/viz/small-multiples.md (VIZ-PATTERN-006).
 * Binds DESIGN.md VIZ-007 (faceted views default to small multiples, not dropdowns).
 *
 * Per Tufte: "The single most powerful idea in modern data visualization."
 * Eye scans 16 mini-charts in 5 seconds; outliers self-announce.
 *
 * Usage in course-eval term overview: one panel per faculty showing their
 * trajectory across the last N terms with shared y-axis.
 */

import * as React from 'react'

export interface Multiple<T> {
  id: string
  label: string
  /** Time series (oldest → newest) */
  series: { x: string; y: number }[]
  /** Single summary stat displayed under the chart */
  summary: string
  /** Marks panel as outlier — gets amber border */
  isOutlier?: boolean
  /** Optional click-through */
  onClick?: () => void
}

interface Props<T> {
  multiples: Multiple<T>[]
  /** Y-axis range LOCKED across all panels (per pattern). */
  yMin: number
  yMax: number
  /** Sort by? Per pattern, never random/alphabetical. */
  sortBy?: (a: Multiple<T>, b: Multiple<T>) => number
  /** Panel size. Default 140×60 fits ~6 cols at 1280px. */
  panelWidth?: number
  panelHeight?: number
  /** Header for accessibility */
  ariaLabel: string
  /** Class for the grid container */
  className?: string
}

export function SmallMultiples<T>({
  multiples,
  yMin,
  yMax,
  sortBy,
  panelWidth = 140,
  panelHeight = 60,
  ariaLabel,
  className,
}: Props<T>) {
  const sorted = sortBy ? [...multiples].sort(sortBy) : multiples

  if (sorted.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic" role="status">
        No data to display.
      </div>
    )
  }

  if (sorted.length < 3) {
    // Pattern's threshold — under 3, prefer a single chart
    // Render anyway but flag. (Don't block; let consumer decide.)
  }

  const span = yMax - yMin || 1

  return (
    <section
      role="region"
      aria-label={ariaLabel}
      className={`grid gap-3 ${className ?? ''}`}
      style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${panelWidth}px, 1fr))` }}
    >
      {sorted.map((m) => {
        const padX = 4
        const padY = 4
        const drawW = panelWidth - padX * 2
        const drawH = panelHeight - padY * 2
        const points = m.series

        const xs = points.map((_, i) =>
          padX + (points.length === 1 ? drawW / 2 : (i / (points.length - 1)) * drawW)
        )
        const ys = points.map(p =>
          padY + drawH - ((p.y - yMin) / span) * drawH
        )

        const d = points.map((_, i) =>
          `${i === 0 ? 'M' : 'L'} ${xs[i].toFixed(1)} ${ys[i].toFixed(1)}`
        ).join(' ')

        const seriesText = points.map(p => `${p.x}: ${p.y}`).join('; ')

        return (
          <article
            key={m.id}
            className="rounded-md p-2 transition-colors"
            style={{
              border: m.isOutlier
                ? '1px solid var(--conditional-rule-orange)'
                : '1px solid var(--border)',
              cursor: m.onClick ? 'pointer' : 'default',
            }}
            onClick={m.onClick}
            onKeyDown={m.onClick ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                m.onClick?.()
              }
            } : undefined}
            tabIndex={m.onClick ? 0 : -1}
            role={m.onClick ? 'button' : undefined}
            aria-label={m.onClick ? `${m.label}: ${m.summary}. ${seriesText}` : undefined}
          >
            <div className="text-xs text-muted-foreground mb-1 truncate">
              {m.label}
              {m.isOutlier && (
                <span
                  className="ms-1.5 text-xs"
                  style={{ color: 'var(--chart-4)' }}
                  aria-label="outlier"
                >
                  ⚠
                </span>
              )}
            </div>
            <svg
              width={panelWidth}
              height={panelHeight}
              role="img"
              aria-hidden={m.onClick ? 'true' : 'false'}
              aria-label={!m.onClick ? `${m.label} trend: ${seriesText}` : undefined}
              style={{ display: 'block' }}
            >
              <path
                d={d}
                fill="none"
                stroke="var(--chart-1)"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* End-of-series dot */}
              {ys.length > 0 && (
                <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r={2} fill="var(--chart-1)" />
              )}
            </svg>
            <div className="text-xs tabular-nums mt-1">{m.summary}</div>
          </article>
        )
      })}
    </section>
  )
}
