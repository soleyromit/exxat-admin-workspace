/**
 * Response funnel — where collection leaks.
 *
 * VIZ-009: "Sequential stages (≥3 stages with attrition between them) must use Sankey/flow
 * viz, not separated count cards. Drop-off is the story." §9.1 maps "Response funnel →
 * progression-sankey". We measure response rate on every surface and nowhere show WHERE it
 * fails — a 71% rate is four very different problems depending on whether students never
 * opened the invite, opened and ignored it, or started and abandoned.
 *
 * ── On synthesising the middle stages ──────────────────────────────────────────
 * The model carries `enrolled` and `responseRate` and nothing between them. Rather than
 * invent a chart, this follows the precedent `lib/pce-collection.ts` already set for exactly
 * this situation, and honours its contract:
 *   (a) DETERMINISTIC — hash-seeded, no Math.random/Date.now, stable across renders + SSR;
 *   (b) it SUMS TO THE TRUTH — `completed` is exactly the real responded count, so the funnel
 *       can never disagree with the response-rate KPI beside it (the "numbers disagree with
 *       each other" bug this whole layer exists to prevent);
 *   (c) when real per-stage counts exist, only this file changes.
 *
 * This is NOT the fabricated-radar mistake. That invented SCORES, attributed them to a named
 * person, and contradicted a data model that said otherwise. These are aggregate operational
 * counts on a chain pinned at both ends to real numbers — the same status as `responseRate`
 * itself, which is equally mock.
 */

import { offeringPoints, type OfferingPoint } from '@/lib/pce-analytics'

export type FunnelStage = 'Invited' | 'Opened' | 'Started' | 'Completed'

export const FUNNEL_STAGES: FunnelStage[] = ['Invited', 'Opened', 'Started', 'Completed']

export interface FunnelCounts {
  invited: number
  opened: number
  started: number
  completed: number
}

/** djb2 — same tiny stable hash pce-collection.ts uses, for the same reason. */
function hash(str: string): number {
  let h = 5381
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0
  return h
}

/**
 * Build the chain BACKWARD from the real completed count, so the funnel terminates on truth
 * and only the middle is modelled. Forward-modelling would let rounding drift the final
 * number away from `responded`, which is the one value that must not move.
 */
function funnelFor(o: OfferingPoint): FunnelCounts {
  const invited = o.enrolled
  const completed = o.responded

  // Deterministic per-offering wobble so every course doesn't leak identically.
  const seed = hash(`${o.facultyId}:${o.courseCode}:${o.term}`)
  const startedRate = 0.86 + ((seed % 9) / 100) // 0.86–0.94 of starters finish
  const openedRate = 0.78 + (((seed >> 3) % 11) / 100) // 0.78–0.88 of openers start

  const started = Math.min(invited, Math.round(completed / startedRate))
  const opened = Math.min(invited, Math.round(started / openedRate))

  // Monotonic by construction — each stage must be ≥ the next, or the flow inverts.
  return {
    invited,
    opened: Math.max(opened, started),
    started: Math.max(started, completed),
    completed,
  }
}

export interface FunnelLink {
  from: FunnelStage
  to: FunnelStage | 'Lost'
  value: number
}

export interface ResponseFunnel {
  counts: FunnelCounts
  /** Per-stage drop-off, in order. */
  lost: { after: FunnelStage; value: number; pct: number }[]
  /** The single biggest leak — the headline. */
  worst: { after: FunnelStage; value: number; pct: number } | null
}

/**
 * @param scope - restrict to a term, a course, or a faculty member. Omit for programme-wide.
 */
export function responseFunnel(scope?: {
  term?: string
  courseCode?: string
  facultyId?: string
}): ResponseFunnel {
  const rows = offeringPoints().filter(
    (o) =>
      (!scope?.term || o.term === scope.term) &&
      (!scope?.courseCode || o.courseCode === scope.courseCode) &&
      (!scope?.facultyId || o.facultyId === scope.facultyId),
  )

  const counts = rows.reduce<FunnelCounts>(
    (acc, o) => {
      const f = funnelFor(o)
      return {
        invited: acc.invited + f.invited,
        opened: acc.opened + f.opened,
        started: acc.started + f.started,
        completed: acc.completed + f.completed,
      }
    },
    { invited: 0, opened: 0, started: 0, completed: 0 },
  )

  const lost = [
    { after: 'Invited' as const, value: counts.invited - counts.opened },
    { after: 'Opened' as const, value: counts.opened - counts.started },
    { after: 'Started' as const, value: counts.started - counts.completed },
  ]
    .map((l) => ({
      ...l,
      pct: counts.invited > 0 ? Math.round((l.value / counts.invited) * 100) : 0,
    }))
    .filter((l) => l.value > 0)

  const worst = lost.length ? [...lost].sort((a, b) => b.value - a.value)[0]! : null

  return { counts, lost, worst }
}

/** Human copy for what each drop-off actually means — the action differs per stage. */
export const FUNNEL_STAGE_MEANING: Record<FunnelStage, string> = {
  Invited: 'Every enrolled student is invited when the survey opens.',
  Opened: 'Never opened the invitation — a deliverability or timing problem, not an opinion.',
  Started: 'Opened it and walked away — the ask looked too long, or the moment was wrong.',
  Completed: 'Finished and submitted. This is the number every response rate on this page uses.',
}
