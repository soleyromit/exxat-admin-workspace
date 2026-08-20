'use client'

/**
 * BulletGauge — horizontal bullet chart showing response count vs enrollment.
 *
 * Design intent (see `feedback_viz_first.md`, `feedback_aarti_no_red.md`):
 *   - Shows filled portion (responseCount / enrollmentCount) on a track.
 *   - A dashed vertical threshold marker at the position of N=5 (or a custom
 *     threshold) signals the "publishable" minimum.
 *   - Below-threshold fill uses var(--chart-4) (amber) — never red per Aarti's rule.
 *   - Above-threshold fill uses var(--brand-color).
 *   - No text is rendered here — the caller renders the "N / M" label.
 *
 * Accessibility:
 *   - role="img" + aria-label on the chart container (WCAG 2.1 non-text content).
 *   - Pass ariaLabel=null to suppress role (when caller composes its own label).
 *
 * Converted to the DS chart system (ChartContainer + recharts) — Romit
 * directive Jul 7 2026: no hand-rolled `<svg>`/`<div>` viz.
 */

import * as React from 'react'
import { ChartContainer } from '@exxatdesignux/ui'
import type { ChartConfig } from '@exxatdesignux/ui'
import { BarChart, Bar, XAxis, YAxis, ReferenceLine } from 'recharts'

export interface BulletGaugeProps {
  /** Numerator — number of responses received. */
  responseCount: number
  /** Denominator — total enrolled. */
  enrollmentCount: number
  /**
   * Response count at which the vertical threshold marker is placed.
   * Defaults to 5 (the "publishable minimum" in PCE survey rules).
   */
  threshold?: number
  /** Width of the gauge in pixels. Default 120. */
  width?: number
  /** Height of the track in pixels. Default 8. */
  height?: number
  /**
   * Accessible label. Defaults to "Response rate: N of M".
   * Pass null for decorative usage (aria-hidden will be set instead).
   */
  ariaLabel?: string | null
}

export function BulletGauge({
  responseCount,
  enrollmentCount,
  threshold = 5,
  width = 120,
  height = 8,
  ariaLabel,
}: BulletGaugeProps) {
  // Clamp the fill to [0, 100]% — guard against bad data.
  const pct = enrollmentCount > 0
    ? Math.min(Math.max((responseCount / enrollmentCount) * 100, 0), 100)
    : 0

  // Threshold marker — linear position of the threshold count on the 0–100 track.
  const thresholdPct = enrollmentCount > 0
    ? Math.min((threshold / enrollmentCount) * 100, 100)
    : 0

  // Below threshold → amber (chart-4); at/above → brand-color.
  const fillColor =
    responseCount < threshold ? 'var(--chart-4)' : 'var(--brand-color)'

  const config: ChartConfig = { v: { label: 'Responses', color: fillColor } }

  // Default aria label when caller doesn't supply one.
  const defaultLabel = `Response rate: ${responseCount} of ${enrollmentCount}`
  const resolvedLabel = ariaLabel === undefined ? defaultLabel : ariaLabel
  const a11yProps =
    resolvedLabel === null
      ? { 'aria-hidden': true as const }
      : { role: 'img' as const, 'aria-label': resolvedLabel }

  return (
    <ChartContainer
      config={config}
      className="aspect-auto shrink-0"
      style={{ width, height }}
      {...a11yProps}
    >
      <BarChart
        accessibilityLayer={false}
        layout="vertical"
        data={[{ name: 'responses', v: pct }]}
        margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
      >
        <XAxis type="number" domain={[0, 100]} hide />
        <YAxis type="category" dataKey="name" hide />
        <Bar
          dataKey="v"
          fill="var(--color-v)"
          background={{ fill: 'var(--muted)', radius: 2 }}
          radius={2}
          barSize={height}
          isAnimationActive={false}
        />
        {enrollmentCount > 0 && thresholdPct > 0 && thresholdPct < 100 && (
          <ReferenceLine
            x={thresholdPct}
            stroke="var(--border)"
            strokeWidth={1}
            strokeDasharray="1.5 1"
          />
        )}
      </BarChart>
    </ChartContainer>
  )
}
