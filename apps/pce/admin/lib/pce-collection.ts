// Daily collection series for the term-scoped dashboard chart.
//
// The admin's in-window question is "are we accumulating responses fast enough
// to hit the target by close?" — answered by responses-per-day bars + a
// cumulative response-rate line vs target, with markers on reminder-send days
// (push-wizard cadence: invitation at open, reminders mid-window). Mock data
// carries only totals, so this synthesizes a DETERMINISTIC daily breakdown
// that (a) sums exactly to each survey's responseCount, (b) spikes on the
// invitation day and after each recorded reminder, and (c) is stable across
// renders/SSR (hash-seeded — no Math.random/Date.now in the distribution).
// When real per-day counts exist, only this file changes.

import type { PceSurvey, ProgramTerm } from './pce-mock-data'

export interface TermDailyPoint {
  /** Short label for the x-axis, e.g. "Jun 24". */
  day: string
  iso: string
  /** Students who responded that day (term aggregate). Null on future days. */
  responses: number | null
  /** Cumulative % of enrolled. Null on future days (line stops at today). */
  cumulativePct: number | null
  /** A reminder went out this day (invitation day is not flagged). */
  reminder: boolean
  /** Day is after "today" — runway toward close. */
  future: boolean
  /** This is the most recent day with data. */
  isToday: boolean
}

/* djb2 — stable tiny hash for jitter. */
function hash(str: string): number {
  let h = 5381
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0
  return h
}

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function parseDay(s: string): Date | null {
  const t = new Date(s)
  return Number.isFinite(t.getTime()) ? t : null
}

function shortDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Deterministic per-survey daily counts over [open, min(today, deadline)]. */
function surveyDailyCounts(
  s: PceSurvey,
  reminderIsos: Set<string>,
  todayIso: string,
): Map<string, number> {
  const out = new Map<string, number>()
  const open = s.openDate ? parseDay(s.openDate) : null
  const close = s.deadline ? parseDay(s.deadline) : null
  if (!open || !close || s.responseCount <= 0) return out

  const endIso = toIso(close) < todayIso ? toIso(close) : todayIso
  const days: string[] = []
  for (let d = new Date(open); toIso(d) <= endIso; d.setDate(d.getDate() + 1)) days.push(toIso(d))
  if (days.length === 0) return out

  // Weights: invitation burst at open, decaying tail, bump after reminders,
  // stable jitter so rows differ from each other.
  const reminderIdx = days
    .map((iso, i) => (reminderIsos.has(iso) ? i : -1))
    .filter((i) => i >= 0)
  const weights = days.map((iso, i) => {
    let w = 0.6 + 2.8 * Math.exp(-i / 2)
    for (const r of reminderIdx) if (i >= r) w += 3.2 * Math.exp(-(i - r) / 1.5)
    w += (hash(`${s.id}:${iso}`) % 100) / 130
    return w
  })
  const totalW = weights.reduce((a, b) => a + b, 0)

  // Largest-remainder rounding so counts sum EXACTLY to responseCount.
  const raw = weights.map((w) => (w / totalW) * s.responseCount)
  const floors = raw.map(Math.floor)
  let remainder = s.responseCount - floors.reduce((a, b) => a + b, 0)
  const order = raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac)
  for (const { i } of order) {
    if (remainder <= 0) break
    floors[i] += 1
    remainder -= 1
  }
  days.forEach((iso, i) => {
    if (floors[i] > 0) out.set(iso, floors[i])
  })
  return out
}

/**
 * Term-level daily series across the term's collection window
 * [earliest open, latest close], with runway (future days) after today.
 */
export function termCollectionSeries(
  surveys: PceSurvey[],
  _term: ProgramTerm,
): { points: TermDailyPoint[]; enrolled: number; collected: number } {
  const todayIso = toIso(new Date())
  const withWindow = surveys.filter(
    (s) => s.openDate && s.deadline && s.status !== 'draft' && s.status !== 'scheduled',
  )
  const enrolled = withWindow.reduce((a, s) => a + s.enrollmentCount, 0)
  if (withWindow.length === 0 || enrolled === 0) return { points: [], enrolled: 0, collected: 0 }

  const opens = withWindow.map((s) => toIso(parseDay(s.openDate!)!)).sort()
  const closes = withWindow.map((s) => toIso(parseDay(s.deadline!)!)).sort()
  const startIso = opens[0]
  const endIso = closes[closes.length - 1]

  const reminderIsos = new Set(
    withWindow.map((s) => s.lastReminderSentAt).filter((v): v is string => !!v),
  )

  const perSurvey = withWindow.map((s) => surveyDailyCounts(s, reminderIsos, todayIso))

  const points: TermDailyPoint[] = []
  let cum = 0
  const start = parseDay(startIso)!
  for (let d = new Date(start); toIso(d) <= endIso; d.setDate(d.getDate() + 1)) {
    const iso = toIso(d)
    const future = iso > todayIso
    const count = future ? null : perSurvey.reduce((a, m) => a + (m.get(iso) ?? 0), 0)
    if (!future) cum += count ?? 0
    points.push({
      day: shortDay(iso),
      iso,
      responses: count,
      cumulativePct: future ? null : Math.round((cum / enrolled) * 1000) / 10,
      reminder: reminderIsos.has(iso),
      future,
      isToday: iso === todayIso || (iso <= todayIso && iso === (endIso < todayIso ? endIso : iso) && false),
    })
  }
  // mark the last day with data
  const lastData = [...points].reverse().find((p) => !p.future)
  if (lastData) lastData.isToday = true

  return { points, enrolled, collected: cum }
}

/** Responses needed per remaining day to reach the target by close. */
export function paceToTarget(
  points: TermDailyPoint[],
  enrolled: number,
  collected: number,
  targetPct: number,
): { needed: number; daysLeft: number; perDay: number } | null {
  const daysLeft = points.filter((p) => p.future).length
  const needed = Math.ceil((targetPct / 100) * enrolled) - collected
  if (daysLeft <= 0 || needed <= 0) return null
  return { needed, daysLeft, perDay: Math.ceil(needed / daysLeft) }
}

/** Biggest post-reminder lift: reminder-day+next-day responses vs prior 3-day avg. */
export function bestReminderLift(
  points: TermDailyPoint[],
): { day: string; lift: number } | null {
  let best: { day: string; lift: number } | null = null
  points.forEach((p, i) => {
    if (!p.reminder || p.responses == null) return
    const after = (p.responses ?? 0) + (points[i + 1]?.responses ?? 0)
    const prior = points.slice(Math.max(0, i - 3), i).map((x) => x.responses ?? 0)
    const priorAvg = prior.length ? prior.reduce((a, b) => a + b, 0) / prior.length : 0
    if (priorAvg > 0) {
      const lift = after / (priorAvg * 2)
      if (lift > 1.2 && (!best || lift > best.lift)) best = { day: p.day, lift }
    }
  })
  return best
}
