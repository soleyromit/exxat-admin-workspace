'use client'

/**
 * ScoreBullet — horizontal bullet chart showing one score against two nested
 * benchmarks (department average, then university average).
 *
 * Design intent — this is the PERCENTILE SUBSTITUTE.
 *   `Specs/pce/specs/course-evaluation.md` §7.3 bans peer-comparison metrics in
 *   the faculty view: "'you're at the 60th percentile' included — that
 *   reverse-encodes peer rank". But Aarti explicitly validated the alternative
 *   (A5): "How am I doing? And how am I doing with respect to others? compared
 *   to the department average to the university average." — cited Anthology /
 *   Watermark as proof faculty accept it.
 *   So: score vs two nested averages answers the same question WITHOUT encoding
 *   peer rank. Safe in both the admin lens and the faculty self-view.
 *
 * Pattern: VIZ-PATTERN-003 (`docs/patterns/viz/bullet-vs-target.md`), selected
 * via `docs/patterns/viz/RUBRIC.md` Q1 ("Where does X stand vs target/cohort?").
 * Rubric Q1 ❌ "Progress bar. Hides cohort, hides target, hides trajectory."
 *
 * Why not BulletGauge: that primitive is count/count (responseCount /
 * enrollmentCount) — a 1–5 score against two averages has no numerator or
 * denominator, and BulletGauge has 3 live call sites. Sibling, not a fork.
 * Named *Bullet, never *Gauge — DESIGN.md VIZ-011 bans circular dials; a Tufte
 * bullet is not a gauge.
 *
 * Deviations from `bullet-vs-target.md`, deliberate:
 *   - Markers use var(--muted-foreground), NOT the recipe's var(--border).
 *     A11Y-021 (design-anti-patterns.md:90): --border as the only state
 *     indicator is ~1.2:1 and fails WCAG 1.4.11's 3:1 for non-text.
 *   - Built on ChartContainer + recharts, not the recipe's absolutely-positioned
 *     divs — Romit directive Jul 7 2026 (no hand-rolled viz), matching the
 *     shipping sibling bullet-gauge.tsx. The recipe also uses
 *     color-mix(... , transparent), which design-anti-patterns.md:41 bans.
 *   - Fill uses --chart-2 / --chart-4 per VIZ-003, not bullet-gauge's
 *     --brand-color (design-anti-patterns.md:72 reserves brand for primary CTA).
 *
 * Accessibility:
 *   - role="meter" + aria-valuetext naming both benchmarks (bullet-vs-target.md:56).
 *   - The two markers share a color and are distinguished by DASH PATTERN and
 *     position, so color is never the sole encoding (A11Y-008). Callers should
 *     still render a legend or the "x.x / dept y.y / univ z.z" text beside this
 *     — no text is drawn here, matching the BulletGauge contract.
 *   - Pass ariaLabel={null} when the caller composes its own label.
 */

import * as React from 'react'
import { ChartContainer } from '@exxatdesignux/ui'
import type { ChartConfig } from '@exxatdesignux/ui'
import { BarChart, Bar, XAxis, YAxis, ReferenceLine } from 'recharts'

export interface ScoreBulletProps {
  /** The entity's score, on the [scaleMin, scaleMax] scale. */
  score: number
  /** Department (program) average — the nearer benchmark. Solid marker. */
  deptAvg?: number
  /** University (all-programs) average — the wider benchmark. Dashed marker. */
  universityAvg?: number
  /** Scale floor. Default 1 (PCE Likert). */
  scaleMin?: number
  /** Scale ceiling. Default 5 (PCE Likert). */
  scaleMax?: number
  /** Width in pixels. Default 120 — matches BulletGauge. */
  width?: number
  /** Track height in pixels. Default 8 — matches BulletGauge. */
  height?: number
  /**
   * Accessible label. Defaults to a sentence naming score + both benchmarks.
   * Pass null for decorative usage (aria-hidden is set instead).
   */
  ariaLabel?: string | null
}

/** Position of a value on the track, as a 0–100 percentage of the scale. */
function trackPct(value: number, min: number, max: number): number {
  const span = max - min
  if (span <= 0) return 0
  return Math.min(Math.max(((value - min) / span) * 100, 0), 100)
}

/** A marker only renders when it sits strictly inside the track. */
function markerVisible(pct: number | null): pct is number {
  return pct !== null && pct > 0 && pct < 100
}

export function ScoreBullet({
  score,
  deptAvg,
  universityAvg,
  scaleMin = 1,
  scaleMax = 5,
  width = 120,
  height = 8,
  ariaLabel,
}: ScoreBulletProps) {
  const pct = trackPct(score, scaleMin, scaleMax)
  const deptPct = deptAvg !== undefined ? trackPct(deptAvg, scaleMin, scaleMax) : null
  const univPct =
    universityAvg !== undefined ? trackPct(universityAvg, scaleMin, scaleMax) : null

  // Below the department average → amber (chart-4), never red (VIZ-004, Aarti).
  // With no department benchmark there is nothing to be "below", so stay neutral.
  const isBelowDept = deptAvg !== undefined && score < deptAvg
  const fillColor = isBelowDept ? 'var(--chart-4)' : 'var(--chart-2)'

  const config: ChartConfig = { v: { label: 'Score', color: fillColor } }

  const benchmarkText = [
    deptAvg !== undefined ? `department average ${deptAvg.toFixed(2)}` : null,
    universityAvg !== undefined ? `university average ${universityAvg.toFixed(2)}` : null,
  ]
    .filter(Boolean)
    .join(', ')

  const defaultLabel =
    `Score ${score.toFixed(2)} out of ${scaleMax}` +
    (benchmarkText ? `, ${benchmarkText}` : '') +
    (deptAvg !== undefined
      ? `. ${isBelowDept ? 'Below' : 'At or above'} the department average.`
      : '')

  const resolvedLabel = ariaLabel === undefined ? defaultLabel : ariaLabel
  const a11yProps =
    resolvedLabel === null
      ? { 'aria-hidden': true as const }
      : {
          role: 'meter' as const,
          'aria-label': resolvedLabel,
          'aria-valuenow': score,
          'aria-valuemin': scaleMin,
          'aria-valuemax': scaleMax,
          'aria-valuetext': resolvedLabel,
        }

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
        data={[{ name: 'score', v: pct }]}
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
        {/* University average — wider benchmark, dashed (A11Y-008: dash + position,
            not color, separates the two markers; they share a token). */}
        {markerVisible(univPct) && (
          <ReferenceLine
            x={univPct}
            stroke="var(--muted-foreground)"
            strokeWidth={1}
            strokeDasharray="1.5 1"
          />
        )}
        {/* Department average — nearer benchmark, solid. Drawn last so it wins
            the overlap when the two averages are close. */}
        {markerVisible(deptPct) && (
          <ReferenceLine x={deptPct} stroke="var(--muted-foreground)" strokeWidth={1} />
        )}
      </BarChart>
    </ChartContainer>
  )
}
