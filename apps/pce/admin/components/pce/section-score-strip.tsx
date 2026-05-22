/**
 * SectionScoreStrip — dot-on-1–5-scale for Likert section averages.
 *
 * Design intent (see `feedback_viz_first.md`, `feedback_progress_bars_last_resort.md`):
 *   - 5 evenly-spaced tick marks on a horizontal track (1 → 5).
 *   - A filled dot at the interpolated score position (score can be a float).
 *   - The dot has a soft brand-tint halo to make it pop on the track.
 *   - Numeric labels 1–5 below each tick.
 *   - No bars — strip plot approach per viz rules.
 *
 * Accessibility:
 *   - role="img" + aria-label on the <svg> (WCAG 2.1 non-text content).
 *   - Pass ariaLabel=null to suppress role (when caller composes its own label).
 *
 * Hand-rolled viz primitive — follows the MicroTrend SVG pattern.
 * Upstream candidate: when DS publishes a strip plot, delete and import.
 */

import * as React from 'react'

export interface SectionScoreStripProps {
  /** Score value in the range 1.0 – 5.0. */
  score: number
  /**
   * Optional section label shown above the strip.
   * Callers typically render this outside the component — this prop is accepted
   * but ignored by this primitive (the SVG has no room for it at 32px height).
   * Kept in the interface so callers can pass it without TypeScript errors.
   */
  label?: string
  /** Width of the SVG in pixels. Default 160. */
  width?: number
  /**
   * Accessible label. Defaults to "Score: {score} out of 5".
   * Pass null for decorative usage (aria-hidden will be set instead).
   */
  ariaLabel?: string | null
}

// Fixed internal constants.
const SVG_HEIGHT = 32   // total viewBox height
const TRACK_Y = 8       // y-coordinate of the track line
const TICK_Y1 = 5       // top of tick marks (TRACK_Y - 3)
const TICK_Y2 = 11      // bottom of tick marks (TRACK_Y + 3)
const LABEL_Y = 24      // y-coordinate of number labels (TRACK_Y + 16)
const SCALE_MIN = 1
const SCALE_MAX = 5
const SCALE_STEPS = 5   // positions: 1, 2, 3, 4, 5

export function SectionScoreStrip({
  score,
  label: _label,
  width = 160,
  ariaLabel,
}: SectionScoreStripProps) {
  const padX = 8

  // Clamp score to valid range.
  const clampedScore = Math.min(Math.max(score, SCALE_MIN), SCALE_MAX)

  // Horizontal span available between the first and last tick.
  const trackSpan = width - padX * 2

  // x position for a given scale value (1–5).
  const xOf = (value: number) =>
    padX + ((value - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * trackSpan

  // Dot position for the (float) score.
  const dotX = xOf(clampedScore)

  // Default aria label when caller doesn't supply one.
  const defaultLabel = `Score: ${score.toFixed(1)} out of 5`
  const resolvedLabel =
    ariaLabel === undefined ? defaultLabel : ariaLabel

  const a11yProps =
    resolvedLabel === null
      ? { 'aria-hidden': true as const }
      : { role: 'img' as const, 'aria-label': resolvedLabel }

  // Tick x positions (1, 2, 3, 4, 5).
  const ticks = Array.from({ length: SCALE_STEPS }, (_, i) => i + SCALE_MIN)

  return (
    <svg
      viewBox={`0 0 ${width} ${SVG_HEIGHT}`}
      width={width}
      height={SVG_HEIGHT}
      {...a11yProps}
      style={{ display: 'block', flexShrink: 0 }}
    >
      {/* Horizontal track line */}
      <line
        x1={padX}
        y1={TRACK_Y}
        x2={width - padX}
        y2={TRACK_Y}
        stroke="var(--border)"
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />

      {/* Tick marks at each integer step */}
      {ticks.map(v => {
        const tx = xOf(v)
        return (
          <line
            key={v}
            x1={tx}
            y1={TICK_Y1}
            x2={tx}
            y2={TICK_Y2}
            stroke="var(--border)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        )
      })}

      {/* Dot halo (brand-tint ring) */}
      <circle
        cx={dotX}
        cy={TRACK_Y}
        r={6}
        fill="var(--brand-tint)"
        fillOpacity={0.25}
        stroke="none"
      />

      {/* Score dot */}
      <circle
        cx={dotX}
        cy={TRACK_Y}
        r={3.5}
        fill="var(--brand-color)"
        stroke="none"
      />

      {/* Numeric labels 1–5 below each tick */}
      {ticks.map(v => (
        <text
          key={v}
          x={xOf(v)}
          y={LABEL_Y}
          textAnchor="middle"
          fontSize={9}
          fill="var(--muted-foreground)"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {v}
        </text>
      ))}
    </svg>
  )
}
