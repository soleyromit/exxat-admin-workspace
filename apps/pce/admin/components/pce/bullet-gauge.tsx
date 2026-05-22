/**
 * BulletGauge — horizontal bullet chart showing response count vs enrollment.
 *
 * Design intent (see `feedback_viz_first.md`, `feedback_aarti_no_red.md`):
 *   - Shows filled portion (responseCount / enrollmentCount) on a track.
 *   - A dashed vertical threshold marker at the pixel position of N=5
 *     (or a custom threshold) signals the "publishable" minimum.
 *   - Below-threshold fill uses var(--chart-4) (amber) — never red per Aarti's rule.
 *   - Above-threshold fill uses var(--brand-color).
 *   - No text is rendered here — the caller renders the "N / M" label.
 *
 * Accessibility:
 *   - role="img" + aria-label on the <svg> (WCAG 2.1 non-text content).
 *   - Pass ariaLabel=null to suppress role (when caller composes its own label).
 *
 * Hand-rolled viz primitive — follows the MicroTrend SVG pattern.
 * Upstream candidate: when DS publishes a bullet chart, delete and import.
 */

import * as React from 'react'

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
  /** Width of the SVG in pixels. Default 120. */
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
  // Clamp the fill width to [0, width] — guard against bad data.
  const ratio = enrollmentCount > 0 ? responseCount / enrollmentCount : 0
  const fillWidth = Math.min(Math.max(ratio * width, 0), width)

  // Threshold marker x — linear position of threshold count on the track.
  const thresholdX =
    enrollmentCount > 0
      ? Math.min((threshold / enrollmentCount) * width, width)
      : 0

  // Below threshold → amber (chart-4); at/above → brand-color.
  const fillColor =
    responseCount < threshold ? 'var(--chart-4)' : 'var(--brand-color)'

  // Default aria label when caller doesn't supply one.
  const defaultLabel = `Response rate: ${responseCount} of ${enrollmentCount}`
  const resolvedLabel =
    ariaLabel === undefined ? defaultLabel : ariaLabel

  const a11yProps =
    resolvedLabel === null
      ? { 'aria-hidden': true as const }
      : { role: 'img' as const, 'aria-label': resolvedLabel }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      {...a11yProps}
      style={{ display: 'block', flexShrink: 0 }}
    >
      {/* Track background */}
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        rx={2}
        fill="var(--muted)"
      />

      {/* Filled portion — clipped by the same rx=2 rounding */}
      {fillWidth > 0 && (
        <rect
          x={0}
          y={0}
          width={fillWidth}
          height={height}
          rx={2}
          fill={fillColor}
        />
      )}

      {/* Threshold marker — dashed vertical tick */}
      {enrollmentCount > 0 && thresholdX > 0 && thresholdX < width && (
        <line
          x1={thresholdX}
          y1={0}
          x2={thresholdX}
          y2={height}
          stroke="var(--muted-foreground)"
          strokeOpacity={0.4}
          strokeWidth={1}
          strokeDasharray="1.5 1"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  )
}
