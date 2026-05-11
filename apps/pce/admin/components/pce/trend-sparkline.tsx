'use client'

/**
 * TrendSparkline — minimal inline SVG sparkline showing a course's score trajectory
 * across prior offerings + current.
 *
 * Per audit C7 + workspace patterns/viz/RUBRIC.md Q4 ("How is X changing over time?")
 * — slope/sparkline is the right viz for "is this course going up or down across offerings."
 *
 * Color discipline (VIZ-003 / VIZ-004): use --chart-2 (positive slope), --chart-4 (amber
 * for negative slope — NEVER red per Aarti's no-red-in-score-viz rule).
 *
 * Pairs with delta text so color isn't the only encoding (A11Y-008).
 *
 * 2026-05-11: refactored to a thin wrapper over the shared `<MicroTrend>` primitive
 * (extracted from this file + exam-management's TrendRow per chart depth audit).
 * The empty/single-point placeholders and delta-text affordance remain product-specific.
 */

import { MicroTrend } from './micro-trend'

interface Point {
  /** x-axis label (e.g., 'Spring 2024'). Not rendered; for aria-text only. */
  label: string
  /** y-axis value, expected 1–5 score. */
  value: number
}

interface Props {
  /** Oldest first; current is appended automatically if currentValue is provided. */
  history: Point[]
  /** Current term's value, optional. If omitted, sparkline is just history. */
  currentValue?: number
  currentLabel?: string
  /** Total width in px. */
  width?: number
  /** Total height in px. */
  height?: number
  /** Y-axis range; defaults to 0–5 score scale. */
  min?: number
  max?: number
}

export function TrendSparkline({
  history,
  currentValue,
  currentLabel = 'Current',
  width = 72,
  height = 20,
  min = 0,
  max = 5,
}: Props) {
  const points: Point[] = currentValue !== undefined
    ? [...history, { label: currentLabel, value: currentValue }]
    : history

  if (points.length === 0) {
    return (
      <span className="text-xs text-muted-foreground" aria-label="No trend data">
        —
      </span>
    )
  }

  if (points.length === 1) {
    return (
      <span
        className="text-xs text-muted-foreground tabular-nums"
        aria-label={`Single offering: ${points[0].value} on ${points[0].label}`}
      >
        first time
      </span>
    )
  }

  // Slope direction — first vs last
  const first = points[0].value
  const last = points[points.length - 1].value
  const delta = Math.round((last - first) * 10) / 10
  const isUp = delta > 0
  const isFlat = delta === 0
  const toneVar = isFlat
    ? 'var(--muted-foreground)'
    : isUp
      ? 'var(--chart-2)'
      : 'var(--chart-4)' // amber for declining — NOT red (VIZ-004 / Aarti)

  // Build aria description
  const seriesText = points.map(p => `${p.label}: ${p.value}`).join('; ')
  const directionText = isFlat ? 'flat' : isUp ? `up ${delta.toFixed(1)}` : `down ${Math.abs(delta).toFixed(1)}`
  const ariaLabel = `Trend across ${points.length} offerings — ${directionText}. ${seriesText}`

  return (
    <div className="flex items-center gap-1.5">
      <MicroTrend
        points={points.map(p => ({ value: p.value, label: p.label }))}
        stroke={toneVar}
        lastPointFill={toneVar}
        min={min}
        max={max}
        sizing="fixed"
        width={width}
        height={height}
        ariaLabel={ariaLabel}
      />
      <span
        className="text-xs tabular-nums"
        style={{
          color: toneVar,
          minWidth: 28,
        }}
        aria-hidden="true"
      >
        {isFlat ? '—' : `${isUp ? '+' : ''}${delta.toFixed(1)}`}
      </span>
    </div>
  )
}
