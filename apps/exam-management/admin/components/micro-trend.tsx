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
 *   This module is the canonical inline primitive both products consume.
 *
 *   This file lives in TWO places (per `docs/governance/ds-adoption.md`):
 *     - `apps/pce/admin/components/pce/micro-trend.tsx`            (this file)
 *     - `apps/exam-management/admin/components/micro-trend.tsx`    (identical —
 *       synced to this ChartContainer version Jul 7 2026)
 *
 * Converted to the DS chart system (ChartContainer + recharts) — Romit
 * directive Jul 7 2026: no hand-rolled `<svg>`/`<div>` viz.
 *
 * Design intent (per `feedback_viz_first.md`):
 *   - viz first, no chrome: NO axes, NO labels, NO legend, NO tooltip.
 *   - draws the line + (optional) area + (optional) last-point dot; callers
 *     compose label/delta-text around it.
 *   - color is a CSS variable, never hex.
 *   - WCAG: callers supply `aria-label`; rendered on the chart container.
 *
 * Sizing modes:
 *   - "fixed" (default): `width` × `height` pixels, e.g. 72×20 (PCE call site)
 *   - "fluid": chart fills the container (exam-mgmt matrix)
 */

import * as React from 'react'
import { ChartContainer } from '@exxatdesignux/ui'
import type { ChartConfig } from '@exxatdesignux/ui'
import { ComposedChart, Area, XAxis, YAxis, ReferenceLine } from 'recharts'

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
  /** Pixel dimensions when sizing="fixed". */
  width?: number
  height?: number
  /** Line thickness. */
  strokeWidth?: number
  /** Last-point dot radius. */
  lastPointRadius?: number
  /**
   * Accessible label. Pass `null` when the chart is decorative (e.g. wrapped in
   * a composite with its own `role="img"` + label).
   */
  ariaLabel: string | null
  /** Extra className for the chart container. */
  className?: string
}

/**
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
  const filledCount = points.reduce((n, p) => n + (p !== null ? 1 : 0), 0)
  if (filledCount < 2) return null

  // Even x spacing across the FULL series (gaps hold their column); the line
  // connects across nulls (connectNulls) — same geometry as the SVG original.
  const data = points.map((p, i) => ({ i, v: p?.value ?? null }))
  const lastFilledIdx = (() => {
    for (let i = points.length - 1; i >= 0; i--) if (points[i] !== null) return i
    return -1
  })()

  const config: ChartConfig = { v: { label: 'Trend', color: stroke } }
  const isFluid = sizing === 'fluid'

  const a11yProps =
    ariaLabel === null
      ? { 'aria-hidden': true as const }
      : { role: 'img' as const, 'aria-label': ariaLabel }

  return (
    <ChartContainer
      config={config}
      className={`aspect-auto shrink-0 ${isFluid ? 'w-full h-full' : ''} ${className ?? ''}`}
      style={isFluid ? undefined : { width, height }}
      {...a11yProps}
    >
      <ComposedChart accessibilityLayer={false} data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <XAxis dataKey="i" type="number" domain={[0, points.length - 1]} hide />
        <YAxis type="number" domain={[min, max]} hide />
        {referenceLine !== undefined && (
          <ReferenceLine
            y={referenceLine}
            stroke="var(--border)"
            strokeWidth={0.5}
            strokeDasharray="0.8 1.2"
          />
        )}
        <Area
          dataKey="v"
          type="linear"
          connectNulls
          stroke="var(--color-v)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={areaFill ?? 'transparent'}
          fillOpacity={areaFill ? 0.12 : 0}
          isAnimationActive={false}
          dot={(props: { cx?: number; cy?: number; index?: number }) => {
            const { cx, cy, index } = props
            if (!lastPointFill || cx == null || cy == null || index !== lastFilledIdx) {
              return <g key={`d-${index}`} />
            }
            return (
              <circle key={`d-${index}`} cx={cx} cy={cy} r={lastPointRadius} fill={lastPointFill} />
            )
          }}
          activeDot={false}
        />
      </ComposedChart>
    </ChartContainer>
  )
}
