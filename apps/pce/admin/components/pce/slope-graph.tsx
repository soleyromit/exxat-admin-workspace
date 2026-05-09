'use client'

/**
 * SlopeGraph — paired comparison across 2 timepoints, N entities.
 *
 * Implements docs/patterns/viz/slope-paired.md (VIZ-PATTERN-004).
 * Binds DESIGN.md VIZ-006 (cohort comparison must show pairing or
 * distribution, never duo-numbers).
 *
 * The crossings ARE the signal. Movers (≥0.3 change) get strokeWidth=2;
 * flat lines get strokeWidth=1 + 30% opacity. No y-axis — endpoint
 * values are the axis (Tufte: minimum chartjunk).
 *
 * Color discipline (VIZ-004): "declined" lines use --chart-4 amber,
 * NEVER --destructive red.
 */

import * as React from 'react'

export interface SlopeRow {
  id: string
  label: string
  pre: number
  post: number
}

interface Props {
  rows: SlopeRow[]
  /** Labels for the two endpoints */
  preLabel: string
  postLabel: string
  /** Format for value display, e.g. (n) => n.toFixed(1) */
  formatValue?: (n: number) => string
  /** Movers threshold: |change| ≥ this counts as a "mover" (thicker line). Default 0.3 */
  moverThreshold?: number
  /** Numeric range; defaults to fit data */
  min?: number
  max?: number
  /** Total height in px */
  height?: number
  ariaLabel: string
  className?: string
}

export function SlopeGraph({
  rows,
  preLabel,
  postLabel,
  formatValue = (n) => n.toFixed(1),
  moverThreshold = 0.3,
  min: minProp,
  max: maxProp,
  height = 280,
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

  const allValues = rows.flatMap(r => [r.pre, r.post])
  const min = minProp ?? Math.min(...allValues) - 0.2
  const max = maxProp ?? Math.max(...allValues) + 0.2
  const range = max - min || 1

  // Vertical position calc
  const yFor = (v: number) => {
    const padY = 28
    const drawH = height - padY * 2
    return padY + drawH - ((v - min) / range) * drawH
  }

  // Counts
  const movers = rows.filter(r => Math.abs(r.post - r.pre) >= moverThreshold)
  const ups = movers.filter(r => r.post > r.pre).length
  const downs = movers.filter(r => r.post < r.pre).length

  return (
    <section role="region" aria-label={ariaLabel} className={className}>
      <div className="flex">
        {/* Pre column labels (right-aligned) */}
        <div className="flex-1 flex flex-col">
          <div className="text-xs font-medium text-muted-foreground pb-2 text-right">
            {preLabel}
          </div>
          <div className="relative flex-1" style={{ height }}>
            {rows.map((r) => {
              const trend = r.post > r.pre ? 'up' : r.post < r.pre ? 'down' : 'flat'
              const isMover = Math.abs(r.post - r.pre) >= moverThreshold
              const opacity = isMover || trend === 'flat' ? (trend === 'flat' ? 0.3 : 1) : 0.5
              return (
                <div
                  key={r.id}
                  className="absolute right-0 -translate-y-1/2 text-xs whitespace-nowrap pe-3"
                  style={{
                    top: yFor(r.pre),
                    opacity,
                  }}
                >
                  <span className="text-muted-foreground me-2 tabular-nums">
                    {formatValue(r.pre)}
                  </span>
                  <span>{r.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* SVG slope area */}
        <div className="relative" style={{ width: 300, height: height + 30 }}>
          <svg
            width={300}
            height={height}
            role="img"
            aria-label={`Slope graph from ${preLabel} to ${postLabel}: ${rows.length} entities, ${ups} improved, ${downs} declined.`}
            className="absolute inset-0"
            style={{ top: 26 }}
          >
            {/* Endpoint dots + lines */}
            {rows.map((r) => {
              const trend = r.post > r.pre ? 'up' : r.post < r.pre ? 'down' : 'flat'
              const isMover = Math.abs(r.post - r.pre) >= moverThreshold
              const stroke =
                trend === 'up'   ? 'var(--chart-1)' :
                trend === 'down' ? 'var(--chart-4)' :  // amber, NOT red — VIZ-004
                                    'var(--muted-foreground)'
              const strokeWidth = isMover ? 2 : 1
              const opacity = isMover ? 1 : trend === 'flat' ? 0.3 : 0.5
              return (
                <g key={r.id}>
                  <line
                    x1={20}
                    y1={yFor(r.pre) - 26}
                    x2={280}
                    y2={yFor(r.post) - 26}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    opacity={opacity}
                    strokeLinecap="round"
                  />
                  <circle cx={20}  cy={yFor(r.pre) - 26}  r={3} fill={stroke} opacity={opacity} />
                  <circle cx={280} cy={yFor(r.post) - 26} r={3} fill={stroke} opacity={opacity} />
                </g>
              )
            })}
          </svg>
        </div>

        {/* Post column labels (left-aligned) */}
        <div className="flex-1 flex flex-col">
          <div className="text-xs font-medium text-muted-foreground pb-2 text-left">
            {postLabel}
          </div>
          <div className="relative flex-1" style={{ height }}>
            {rows.map((r) => {
              const trend = r.post > r.pre ? 'up' : r.post < r.pre ? 'down' : 'flat'
              const isMover = Math.abs(r.post - r.pre) >= moverThreshold
              const opacity = isMover || trend === 'flat' ? (trend === 'flat' ? 0.3 : 1) : 0.5
              return (
                <div
                  key={r.id}
                  className="absolute left-0 -translate-y-1/2 text-xs whitespace-nowrap ps-3"
                  style={{
                    top: yFor(r.post),
                    opacity,
                  }}
                >
                  <span>{r.label}</span>
                  <span className="text-muted-foreground ms-2 tabular-nums">
                    {formatValue(r.post)}
                  </span>
                  {trend === 'up' && (
                    <i className="fa-light fa-arrow-up ms-1.5 text-xs"
                       style={{ color: 'var(--chart-1)' }}
                       aria-label="improved"
                    />
                  )}
                  {trend === 'down' && (
                    <i className="fa-light fa-arrow-down ms-1.5 text-xs"
                       style={{ color: 'var(--chart-4)' }}
                       aria-label="declined"
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Takeaway sentence (chart-self-explains, per VIZ-008) */}
      <p className="text-xs text-muted-foreground mt-3 text-center">
        {ups} of {rows.length} {ups === 1 ? 'entity' : 'entities'} improved · {downs} declined ≥ {moverThreshold.toFixed(1)} pts.
      </p>
    </section>
  )
}
