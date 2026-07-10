'use client'

/**
 * SectionScoreStrip — dot-on-1–5-scale for Likert section averages.
 *
 * Design intent (see `feedback_viz_first.md`, `feedback_progress_bars_last_resort.md`):
 *   - Evenly-spaced tick marks on a horizontal track (1 → 5) with numeric labels.
 *   - A filled dot at the interpolated score position (score can be a float),
 *     with a soft brand-tint halo. No bars — strip plot per viz rules.
 *
 * Accessibility:
 *   - role="img" + aria-label on the chart container (WCAG 2.1 non-text content).
 *   - Pass ariaLabel=null to suppress role (when caller composes its own label).
 *
 * Converted to the DS chart system (ChartContainer + recharts ScatterChart) —
 * Romit directive Jul 7 2026: no hand-rolled `<svg>`/`<div>` viz. Bonus fix:
 * the old SVG rendered 9px labels; the axis ticks now render at the 12px floor.
 */

import * as React from 'react'
import { ChartContainer } from '@exxatdesignux/ui'
import type { ChartConfig } from '@exxatdesignux/ui'
import { ScatterChart, Scatter, XAxis, YAxis } from 'recharts'

export interface SectionScoreStripProps {
  /** Score value in the range 1.0 – 5.0. */
  score: number
  /**
   * Optional section label — accepted but ignored by this primitive (callers
   * render it outside). Kept in the interface for call-site compatibility.
   */
  label?: string
  /** Width of the strip in pixels. Default 160. */
  width?: number
  /**
   * Accessible label. Defaults to "Score: {score} out of 5".
   * Pass null for decorative usage (aria-hidden will be set instead).
   */
  ariaLabel?: string | null
}

const SCALE_MIN = 1
const SCALE_MAX = 5
const STRIP_HEIGHT = 40 // track row + 12px tick labels

const stripConfig: ChartConfig = { score: { label: 'Score', color: 'var(--brand-color)' } }

/** Halo + dot at the score position — replaces the old hand-drawn circles. */
function ScoreDot(props: { cx?: number; cy?: number }) {
  const { cx, cy } = props
  if (cx == null || cy == null) return <g />
  return (
    <g>
      <circle cx={cx} cy={cy} r={6} fill="var(--brand-tint)" fillOpacity={0.25} />
      <circle cx={cx} cy={cy} r={3.5} fill="var(--brand-color)" />
    </g>
  )
}

export function SectionScoreStrip({
  score,
  label: _label,
  width = 160,
  ariaLabel,
}: SectionScoreStripProps) {
  const clampedScore = Math.min(Math.max(score, SCALE_MIN), SCALE_MAX)

  const defaultLabel = `Score: ${score.toFixed(1)} out of 5`
  const resolvedLabel = ariaLabel === undefined ? defaultLabel : ariaLabel
  const a11yProps =
    resolvedLabel === null
      ? { 'aria-hidden': true as const }
      : { role: 'img' as const, 'aria-label': resolvedLabel }

  return (
    <ChartContainer
      config={stripConfig}
      className="aspect-auto shrink-0"
      style={{ width, height: STRIP_HEIGHT }}
      {...a11yProps}
    >
      <ScatterChart accessibilityLayer={false} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <XAxis
          type="number"
          dataKey="x"
          domain={[SCALE_MIN, SCALE_MAX]}
          ticks={[1, 2, 3, 4, 5]}
          interval={0}
          height={18}
          axisLine={{ stroke: 'var(--border)' }}
          tickLine={{ stroke: 'var(--border)' }}
          tickSize={3}
          tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
        />
        <YAxis type="number" dataKey="y" domain={[0, 1]} hide />
        <Scatter
          data={[{ x: clampedScore, y: 0 }]}
          fill="var(--color-score)"
          shape={<ScoreDot />}
          isAnimationActive={false}
        />
      </ScatterChart>
    </ChartContainer>
  )
}
