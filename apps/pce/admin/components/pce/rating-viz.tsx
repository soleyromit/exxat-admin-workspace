'use client'

// ============================================================================
// Shared rating-distribution primitives (extracted from the results detail,
// Romit-approved forms 2026-07-16): the diverging DS palette, the vertical
// five-column histogram, and the thick horizontal stacked bar. One visual
// language for rating mixes everywhere — results detail AND faculty home.
// ============================================================================

import { Tooltip, TooltipContent, TooltipTrigger } from '@exxatdesignux/ui'

/* Diverging Likert palette from the DS chart tokens: warm low → neutral mid →
   cool high. 1 = --chart-5 orange, 2 = its tint, 3 = --border (the neutral
   midpoint is meant to be quiet), 4 = --chart-2 tint, 5 = --chart-2 teal —
   teal stays "good" page-wide. Composited pairs validated: worst adjacent
   ΔE 15.9 normal / 14.7 CVD. */
export const RATING_SERIES = [
  { key: 'r1', label: 'Rated 1', color: 'var(--chart-5)', opacity: 1 },
  { key: 'r2', label: 'Rated 2', color: 'var(--chart-5)', opacity: 0.5 },
  { key: 'r3', label: 'Rated 3', color: 'var(--border)',  opacity: 1 },
  { key: 'r4', label: 'Rated 4', color: 'var(--chart-2)', opacity: 0.5 },
  { key: 'r5', label: 'Rated 5', color: 'var(--chart-2)', opacity: 1 },
] as const

/** Inline swatch legend (■1 … ■5) for any surface that renders the palette. */
export function RatingLegend() {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground tabular-nums">
      {RATING_SERIES.map((s, i) => (
        <span key={s.key} className="inline-flex items-center gap-1">
          <span
            className="inline-block size-2.5 rounded-[2px]"
            style={{ background: s.color, opacity: s.opacity }}
            aria-hidden="true"
          />
          {i + 1}
        </span>
      ))}
    </div>
  )
}

/* Per-question rating distribution — five VERTICAL mini columns, one per
   rating level (Romit: intentionally kept — the histogram SHAPE per question,
   skew/bimodality, is the story). Count above, share below. */
export function MiniRatingColumns({ counts, total }: { counts: number[]; total: number }) {
  return (
    <div className="flex items-end gap-3" aria-hidden="true">
      {RATING_SERIES.map((s, i) => {
        const n = counts[i] ?? 0
        const share = total > 0 ? n / total : 0
        return (
          <div key={s.key} className="flex flex-col items-center gap-0.5 w-8">
            <span className="text-xs tabular-nums text-muted-foreground">{n}</span>
            <div className="relative h-10 w-5 rounded-sm bg-muted overflow-hidden">
              <div
                className="absolute inset-x-0 bottom-0 rounded-sm"
                style={{ height: `${Math.max(share * 100, n > 0 ? 8 : 0)}%`, background: s.color, opacity: s.opacity }}
              />
            </div>
            <span className="text-xs tabular-nums text-muted-foreground">{Math.round(share * 100)}%</span>
          </div>
        )
      })}
    </div>
  )
}

/* Thick horizontal 100%-stacked rating bar (Romit): segments 1→5 left to
   right; counts + shares per rating on hover and in the caller's data table. */
export function RatingStackedBar({ counts, total }: { counts: number[]; total: number }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex h-6 w-full gap-0.5 overflow-hidden rounded-md" aria-hidden="true">
          {RATING_SERIES.map((s, i) => {
            const n = counts[i] ?? 0
            if (n === 0 || total === 0) return null
            return (
              <div
                key={s.key}
                className="h-full rounded-[2px]"
                style={{ width: `${(n / total) * 100}%`, background: s.color, opacity: s.opacity }}
              />
            )
          })}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="flex flex-col gap-0.5 tabular-nums">
          {RATING_SERIES.map((s, i) => {
            const n = counts[i] ?? 0
            return (
              <p key={s.key}>
                {s.label}: {n} ({total > 0 ? Math.round((n / total) * 100) : 0}%)
              </p>
            )
          }).reverse()}
          <p className="text-muted-foreground">n = {total}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
