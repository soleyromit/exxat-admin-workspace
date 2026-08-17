'use client'

import type { ScoreCell } from '@/lib/pce-score-cell'
import type { DualMean } from '@/lib/pce-analytics'

export function ScoreCellText({
  cell,
  format,
}: {
  cell: ScoreCell<number>
  format: (value: number) => string
}) {
  if (cell.state === 'value') return <span className="tabular-nums">{format(cell.value)}</span>
  if (cell.state === 'pending') return <span className="italic text-muted-foreground">Pending</span>
  return <span className="text-muted-foreground">—</span>
}

/**
 * Plain-string sibling of `ScoreCellText` — for contexts that take a `string` or
 * `(string | number)[][]` rather than JSX: sr-only `ChartDataTable` rows,
 * `ChartCardActions`' CSV/Excel/PDF export rows, and `MetricItem.value` on KPI tiles.
 * Same three-state text as the JSX version: formatted value / "Pending" / "—".
 *
 * Shared here (not local to one consumer) because every file migrating a
 * `ScoreCell<DualMean>` table/KPI surface hits the same "JSX doesn't fit" wall —
 * first found in `analytics-panels.tsx` (Task 6), reused by `faculty-leaderboard-section.tsx`
 * and `analytics-overview-panel.tsx` (Tasks 7, 9).
 */
export function scoreText(cell: ScoreCell<DualMean>, format: (value: DualMean) => string): string {
  if (cell.state === 'value') return format(cell.value)
  return cell.state === 'pending' ? 'Pending' : '—'
}
