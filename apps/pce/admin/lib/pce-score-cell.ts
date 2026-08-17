import type { SurveyStatus } from '@/lib/pce-mock-data'

/**
 * A score that may not be computable yet. `state: 'pending'` means the underlying
 * survey(s) haven't all closed; `state: 'na'` means the role/component this cell
 * represents doesn't exist for this row at all (including: every offering behind it
 * was Archived, which is treated as if the offering never existed).
 */
export type ScoreCell<T> =
  | { state: 'value'; value: T }
  | { state: 'pending' }
  | { state: 'na' }

const COUNTABLE: ReadonlySet<SurveyStatus | 'historical' | 'archived'> = new Set(['closed', 'released', 'historical'])

/**
 * The PRD's "wait for all offerings closed" rule, in one place.
 *
 * `'pending_review'` is deliberately NOT in COUNTABLE — data collection may be done, but
 * moderation isn't, and the source PRD only names "Closed/Results-Available" as countable.
 *
 * The `statusOf` function may return any survey status from the caller's vocabulary,
 * including 'archived' (which gates this function out entirely), 'historical', and
 * statuses from SurveyStatus union.
 */
export function gatedScore<T>(
  offerings: readonly unknown[],
  statusOf: (o: any) => SurveyStatus | 'historical' | 'archived',
  compute: (closedOfferings: any[]) => T,
): ScoreCell<T> {
  const live = offerings.filter((o) => statusOf(o) !== 'archived')
  if (live.length === 0) return { state: 'na' }
  if (live.some((o) => !COUNTABLE.has(statusOf(o)))) return { state: 'pending' }
  return { state: 'value', value: compute(live) }
}

/** Averages across rows with a real number, skipping Pending/—. Null (not 0) if none do. */
export function averageValueCells(cells: ScoreCell<number>[]): number | null {
  const values = cells.filter((c): c is { state: 'value'; value: number } => c.state === 'value').map((c) => c.value)
  if (values.length === 0) return null
  return values.reduce((s, v) => s + v, 0) / values.length
}
