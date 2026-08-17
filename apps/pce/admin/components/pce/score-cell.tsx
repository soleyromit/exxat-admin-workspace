'use client'

import type { ScoreCell } from '@/lib/pce-score-cell'

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
