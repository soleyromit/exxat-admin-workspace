'use client'

/**
 * ResponseProgressCell — the canonical response-collection readout (Romit,
 * Jul 10 2026, after full iteration: dot → bullet gauge → unit strip → text →
 * "fix the progress bar UI by researching Mobbin + surrounding hierarchy").
 *
 * Anatomy = the DS ProgressCell (vendored data-views/table-cells.tsx), which
 * matches the Mobbin canon (Deel Documents table; HubSpot goal rows/cards):
 * a full-width thin track ON TOP, one consolidated fact line BENEATH —
 * never a mini-bar squeezed beside competing numbers.
 *
 * 2026-08-13 (Granola 0ef80c33, Vishal, raw transcript: "we need to give
 * them two numbers — one is below that number the survey is not valid...
 * and then desired percentage... based on those two numbers you can set the
 * color to be red, orange or green") — was a binary below/at-target split;
 * now three tiers off the same two thresholds this app already had defined
 * separately (`floor` defaults to AT_RISK_THRESHOLD, the existing "at risk"
 * cutoff; `target` is the existing RESPONSE_TARGET): below floor = not yet a
 * valid sample, floor–target = valid but short of the desired rate, at/above
 * target = on target. No red per aarti_no_red — `warning` (amber) stands in
 * for Vishal's "red" tier, `brand` (var(--brand-color)) for his "orange" tier,
 * `success` (teal) for "green". Same boundaries pce-term-metrics.ts's
 * `completionColor` already uses elsewhere; this just wires ProgressCell's
 * own `tone` prop to them instead of the `fillColor` prop this component
 * used to pass — ProgressCell (data-views/table-cells.tsx) never had a
 * `fillColor` param, so that override was a silent no-op.
 */

import { ProgressCell } from '@/components/data-views/table-cells'
import { AT_RISK_THRESHOLD } from '@/lib/pce-at-risk'

export function ResponseProgressCell({
  rate,
  responseCount,
  enrollmentCount,
  target,
  /** Validity floor (0–100) — below this, the sample is too small to be a
   *  meaningful rate at all, distinct from "valid but below the desired
   *  target". Defaults to the same AT_RISK_THRESHOLD (60) the rest of the
   *  app already uses for "at risk". */
  floor = AT_RISK_THRESHOLD,
  detail = 'full',
  className,
}: {
  rate: number
  responseCount: number
  enrollmentCount: number
  /** Response-rate target (0–100) — the desired/upper tier boundary. */
  target: number
  floor?: number
  /**
   * 'full'  — "23 of 60 responded · 38% (below target)" under the bar (tables, cards)
   * 'pct'   — just "38%" under the bar (rows that carry counts elsewhere)
   * 'none'  — bar only (heroes that already print the % large)
   */
  detail?: 'full' | 'pct' | 'none'
  className?: string
}) {
  const tier = rate >= target ? 'onTarget' : rate >= floor ? 'valid' : 'belowFloor'
  const tone = tier === 'onTarget' ? 'success' : tier === 'valid' ? 'brand' : 'warning'
  /* Status words live sr-only — the fill color + % carry it visually
   * (Romit: "below target label isn't needed"). */
  const srStatus = (
    <span className="sr-only">
      {tier === 'onTarget' ? 'on target' : tier === 'valid' ? `below ${target}% target` : `below ${floor}% validity threshold`}
    </span>
  )
  const label =
    detail === 'none' ? (false as const) :
    detail === 'pct' ? (
      <span className="text-xs tabular-nums text-muted-foreground whitespace-nowrap">
        {rate}%{srStatus}
      </span>
    ) : (
      <span className="text-xs tabular-nums text-muted-foreground whitespace-nowrap">
        {responseCount} of {enrollmentCount} responded · {rate}%{srStatus}
      </span>
    )
  return (
    <ProgressCell
      value={rate}
      tone={tone}
      label={label}
      className={className}
    />
  )
}
