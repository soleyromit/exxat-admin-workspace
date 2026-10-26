import { expectedByNow, PACE_MARGIN, TERM, termShare } from "./reports"
import { DEMO_TODAY } from "./seed"
import { courseWork, STUDENT_ID, type SkillProgress } from "./student"
import type { V2State } from "./types"

/** Pure selectors for the student's progress visuals (V13 waffle, V14 dots, V15 pace line). No React, no clock: the day is DEMO_TODAY. */

export type SquareState = "counted" | "pending" | "remaining"
export interface ProgressSquare {
  state: SquareState
  label: string
}

export interface MandatoryWaffle {
  /** One square per evaluation the mandatory rules ask for, grouped by skill, counted first. */
  squares: ProgressSquare[]
  collected: number
  needed: number
  /** Evaluations waiting for a sign-off or an approval that would fill a square. */
  waiting: number
  skillsAchieved: number
  skillsTotal: number
  expected: number
  behindBy: number
  /** One honest line: collected of needed, and the pace verdict. */
  line: string
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)

/** The mandatory skills as squares: each skill contributes `need` squares (counted, then waiting, then still to do). */
export function mandatoryWaffle(s: V2State, studentId: string = STUDENT_ID, today: string = DEMO_TODAY): MandatoryWaffle {
  const w = courseWork(s, studentId)
  const squares: ProgressSquare[] = []
  let collected = 0
  let waiting = 0
  for (const i of w.mandatory) {
    const p = i.progress
    const have = Math.min(p.counted, p.need)
    const inRequest = i.request ? Math.max(1, s.logEntries.filter((e) => e.requestId === i.request?.id && e.skillId === i.skill.id).length) : 0
    const wait = Math.min(Math.max(p.awaiting, inRequest), p.need - have)
    collected += have
    waiting += wait
    for (let k = 0; k < p.need; k++) squares.push({ state: k < have ? "counted" : k < have + wait ? "pending" : "remaining", label: `${i.skill.name}, evaluation ${k + 1}` })
  }
  const needed = squares.length
  const expected = expectedByNow(needed, termShare(today))
  const short = expected - collected
  const behindBy = short > PACE_MARGIN ? short : 0
  const pace = behindBy > 0 ? `${behindBy} behind the pace` : "on pace"
  const line = needed === 0 ? "No mandatory skills are open to you yet." : `${collected} of ${needed} evaluations collected, ${pace}.`
  return { squares, collected, needed, waiting, skillsAchieved: w.summary.achieved, skillsTotal: w.summary.mandatory, expected, behindBy, line }
}

export interface SkillDot {
  id: string
  label: string
  state: "met" | "pending" | "none"
}

/** One dot per evaluation the rule needs: counted, then waiting for approval, then still to do. */
export function skillDots(p: SkillProgress): SkillDot[] {
  const have = Math.min(p.counted, p.need)
  const wait = Math.min(p.awaiting, p.need - have)
  return Array.from({ length: p.need }, (_, k) => ({ id: `d${k}`, label: `Evaluation ${k + 1} of ${p.need}`, state: k < have ? "met" : k < have + wait ? "pending" : "none" }))
}

export interface PacePoint {
  week: string
  counted: number
  pace: number
}

export interface PaceSeries {
  data: PacePoint[]
  caption: string
}

const DAY = 86_400_000
const ms = (d: string) => Date.parse(`${d.slice(0, 10)}T00:00:00Z`)
const label = (t: number) => new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })

/**
 * Cumulative counted evaluations by week of the term against the pace line. Only evaluations the rules actually used count, and a
 * skill never contributes more than its rule needs (the newest extras are dropped), so the last point equals `mandatoryWaffle().collected`.
 * Evidence from before the term starts lands in week 1.
 */
export function paceSeries(s: V2State, studentId: string = STUDENT_ID, today: string = DEMO_TODAY): PaceSeries {
  const w = courseWork(s, studentId)
  const needed = w.mandatory.reduce((n, i) => n + i.progress.need, 0)
  const dates: number[] = []
  for (const i of w.mandatory) {
    const used = i.progress.used
      .map((id) => s.evaluations.find((e) => e.id === id))
      .filter((e): e is NonNullable<typeof e> => !!e)
      .map((e) => ms(e.date))
      .sort((a, b) => a - b)
    dates.push(...used.slice(0, i.progress.need))
  }
  const start = ms(TERM.start)
  const now = ms(today)
  const weeks = Math.max(1, Math.floor((now - start) / (7 * DAY)) + 1)
  const data: PacePoint[] = []
  for (let k = 0; k < weeks; k++) {
    const weekStart = start + k * 7 * DAY
    const end = k === weeks - 1 ? now : weekStart + 7 * DAY - 1
    data.push({
      week: label(weekStart),
      counted: dates.filter((d) => d <= end + (k === weeks - 1 ? DAY - 1 : 0)).length,
      pace: expectedByNow(needed, termShare(new Date(Math.min(end, now)).toISOString().slice(0, 10))),
    })
  }
  const last = data[data.length - 1]
  const gap = last ? last.pace - last.counted : 0
  const caption = !last
    ? "No evidence yet."
    : gap > PACE_MARGIN
      ? `${last.counted} counted, pace says ${last.pace} by now: ${gap} ${plural(gap, "evaluation", "evaluations")} behind.`
      : `${last.counted} counted, pace says ${last.pace} by now: on pace.`
  return { data, caption }
}
