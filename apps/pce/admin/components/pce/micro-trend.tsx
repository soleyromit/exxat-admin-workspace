'use client'

/**
 * MicroTrend — shared inline-sparkline primitive.
 *
 * Background (audit `chart.md`, 2026-05-11):
 *   Two products had near-identical inline-sparkline implementations —
 *   PCE's `TrendSparkline` (history → currentValue, delta-colored stroke)
 *   and exam-management's `TrendRow` (cohort performance across assessments
 *   with HTML dot overlay + area fill).
 *
 *   This module is the canonical inline-SVG primitive both products consume.
 *
 *   This file lives in TWO places (per `docs/governance/ds-adoption.md`):
 *     - `apps/pce/admin/components/pce/micro-trend.tsx`            (this file)
 *     - `apps/exam-management/admin/components/micro-trend.tsx`    (identical)
 *
 *   Upstream candidate: when DS publishes a `<MicroTrend>` primitive, both
 *   vendors should delete + import from `@exxat/ds/packages/ui/src`.
 *
 * Design intent (per `feedback_viz_first.md`):
 *   - viz first, no chrome: NO axes, NO labels, NO legend, NO tooltip.
 *   - the SVG draws the line + (optional) area + (optional) last-point dot.
 *     callers compose label/delta-text/dot-overlay around it.
 *   - color is a CSS variable, never hex.
 *   - WCAG: callers supply `aria-label`; this primitive renders the SVG with
 *     `role="img"` and forwards the label.
 *
 * Sizing modes:
 *   - "fixed" (default): `width` × `height` pixels, e.g. 72×20 (PCE call site)
 *   - "fluid": SVG fills the container's width; uses `preserveAspectRatio="none"`
 *     so the line stretches across whatever column it lands in (exam-mgmt matrix)
 *
 * Hand-rolled by design — see audit decision in `docs/governance/ds-adoption.md`
 * under "Documented hand-rolls / Cross-product".
 */

import * as React from 'react'

export interface MicroTrendPoint {
  /** y-axis value (scaled by `min`..`max`) */
  value: number
  /** Optional per-point label for the aria-text (not rendered visually) */
  label?: string
}

export interface MicroTrendProps {
  /** Ordered series (oldest → newest). Nulls represent gaps and are skipped. */
  points: ReadonlyArray<MicroTrendPoint | null>
  /** Color CSS variable expression for the line stroke. Defaults to brand color. */
  stroke?: string
  /** When set, draws a soft fill under the line in this color. */
  areaFill?: string
  /** When set, highlights the final filled point with a dot in this color. */
  lastPointFill?: string
  /** Y-axis range. Defaults to 0..100 (percent). */
  min?: number
  max?: number
  /** Reference line value (e.g. 70% threshold). Drawn as a faint dashed line. */
  referenceLine?: number
  /** Sizing strategy: "fixed" (default) honors width/height; "fluid" stretches. */
  sizing?: 'fixed' | 'fluid'
  /** Pixel dimensions when sizing="fixed". Used as viewBox dimensions when sizing="fluid". */
  width?: number
  height?: number
  /** Line thickness in viewBox units. Use vector-effect non-scaling-stroke implicitly. */
  strokeWidth?: number
  /** Last-point dot radius. */
  lastPointRadius?: number
  /**
   * Accessible label for the SVG. Pass `null` when the SVG is decorative
   * (e.g. wrapped in a composite with its own `role="img"` + label, as in
   * the curricular matrix where HTML dot overlays carry the semantics).
   */
  ariaLabel: string | null
  /** Extra className for the wrapping <svg>. */
  className?: string
}

/**
 * Renders only the SVG. Callers wrap it with whatever flex/layout they need.
 *
 * Returns null when there are fewer than 2 filled points — callers should render
 * their own "—" / "first time" placeholder text since the empty-state semantics
 * are product-specific (PCE shows "first time", exam-mgmt shows nothing).
 */
export function MicroTrend({
  points,
  stroke = 'var(--brand-color)',
  areaFill,
  lastPointFill,
  min = 0,
  max = 100,
  referenceLine,
  sizing = 'fixed',
  width = 72,
  height = 20,
  strokeWidth = 1.5,
  lastPointRadius = 1.8,
  ariaLabel,
  className,
}: MicroTrendProps) {
  // Filter to filled points; track original index so x-axis spacing is even across the full series.
  const filledIndexes: number[] = []
  for (let i = 0; i < points.length; i++) {
    if (points[i] !== null) filledIndexes.push(i)
  }
  if (filledIndexes.length < 2) return null

  const span = max - min || 1
  const padX = 2
  const padY = 2
  const drawW = width - padX * 2
  const drawH = height - padY * 2

  // Each timeline column gets evenly-spaced x — filled and unfilled alike.
  const lastIdx = points.length - 1
  const xOf = (i: number) =>
    lastIdx === 0 ? width / 2 : padX + (i / lastIdx) * drawW
  const yOf = (v: number) => padY + drawH - ((v - min) / span) * drawH

  const linePath = filledIndexes
    .map((i, k) => {
      const p = points[i]!
      const cmd = k === 0 ? 'M' : 'L'
      return `${cmd} ${xOf(i).toFixed(1)} ${yOf(p.value).toFixed(1)}`
    })
    .join(' ')

  // Optional baseline-closed polygon for area fill.
  let areaPath: string | null = null
  if (areaFill) {
    const firstIdx = filledIndexes[0]
    const lastFilledIdx = filledIndexes[filledIndexes.length - 1]
    const baselineY = padY + drawH
    const segs: string[] = [`M ${xOf(firstIdx).toFixed(1)} ${baselineY}`]
    filledIndexes.forEach(i => {
      const p = points[i]!
      segs.push(`L ${xOf(i).toFixed(1)} ${yOf(p.value).toFixed(1)}`)
    })
    segs.push(`L ${xOf(lastFilledIdx).toFixed(1)} ${baselineY}`)
    segs.push('Z')
    areaPath = segs.join(' ')
  }

  // Last filled point — for the highlight dot.
  const lastFilledIdx = filledIndexes[filledIndexes.length - 1]
  const lastX = xOf(lastFilledIdx)
  const lastY = yOf(points[lastFilledIdx]!.value)

  const isFluid = sizing === 'fluid'

  const a11yProps =
    ariaLabel === null
      ? { 'aria-hidden': true as const }
      : { role: 'img' as const, 'aria-label': ariaLabel }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={isFluid ? undefined : width}
      height={isFluid ? undefined : height}
      preserveAspectRatio={isFluid ? 'none' : 'xMidYMid meet'}
      {...a11yProps}
      className={className}
      style={isFluid ? undefined : { display: 'block', flexShrink: 0 }}
    >
      {/* Optional dashed reference line (e.g. 70% threshold). */}
      {referenceLine !== undefined && (
        <line
          x1={0}
          x2={width}
          y1={yOf(referenceLine)}
          y2={yOf(referenceLine)}
          stroke="var(--border)"
          strokeWidth={0.5}
          strokeDasharray="0.8 1.2"
          vectorEffect="non-scaling-stroke"
        />
      )}

      {/* Optional area fill — drawn under the line. */}
      {areaPath && (
        <path
          d={areaPath}
          fill={areaFill}
          fillOpacity={0.12}
          stroke="none"
        />
      )}

      {/* The trend polyline itself. */}
      <path
        d={linePath}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />

      {/* Optional last-point dot — emphasizes "now". */}
      {lastPointFill && (
        <circle
          cx={lastX}
          cy={lastY}
          r={lastPointRadius}
          fill={lastPointFill}
        />
      )}
    </svg>
  )
}
