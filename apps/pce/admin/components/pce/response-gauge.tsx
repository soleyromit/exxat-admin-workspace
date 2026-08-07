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
 * Fill = product status tokens (amber --chip-4 below target · teal --chart-2
 * on target — aarti_no_red); the label names the status in words so state is
 * never color-alone.
 */

import { ProgressCell } from '@/components/data-views/table-cells'

export function ResponseProgressCell({
  rate,
  responseCount,
  enrollmentCount,
  target,
  detail = 'full',
  className,
}: {
  rate: number
  responseCount: number
  enrollmentCount: number
  /** Response-rate target (0–100) — drives fill + the status words. */
  target: number
  /**
   * 'full'  — "23 of 60 responded · 38% (below target)" under the bar (tables, cards)
   * 'pct'   — just "38%" under the bar (rows that carry counts elsewhere)
   * 'none'  — bar only (heroes that already print the % large)
   */
  detail?: 'full' | 'pct' | 'none'
  className?: string
}) {
  const below = rate < target
  const fillColor = below ? 'var(--chip-4)' : 'var(--chart-2)'
  /* Status words live sr-only — the fill color + % carry it visually
   * (Romit: "below target label isn't needed"). */
  const srStatus = (
    <span className="sr-only">{below ? `below ${target}% target` : 'on target'}</span>
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
      tone={below ? 'warning' : 'success'}
      fillColor={fillColor}
      label={label}
      className={className}
    />
  )
}
