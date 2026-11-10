import { compareEvaluation, type Agreement, type QueueItem } from "./queue"
import { DEMO_TODAY } from "./seed"
import type { Evaluation, V2State } from "./types"
import type { VerificationRow } from "./verification"

/** Pure helpers behind the review queue visuals: how long an item has waited, and whether the self-rating and the evaluator agreed. */

const DAY = 86_400_000

/** Whole days between the day an item reached the queue and the demo day. Never negative. */
export function ageDays(since: string, today: string = DEMO_TODAY): number {
  const from = Date.parse(`${since.slice(0, 10)}T00:00:00Z`)
  const to = Date.parse(`${today}T00:00:00Z`)
  if (Number.isNaN(from) || Number.isNaN(to)) return 0
  return Math.max(0, Math.round((to - from) / DAY))
}

export type AgeBucket = "recent" | "waiting" | "overdue"

/** 0 to 2 days, 3 to 6 days, 7 or more days. */
export function ageBucket(days: number): AgeBucket {
  return days >= 7 ? "overdue" : days >= 3 ? "waiting" : "recent"
}

export const OVERDUE_DAYS = 7

/** The item that has waited longest, or null for an empty queue. Ties keep the queue order. */
export function oldestItem(items: QueueItem[], today: string = DEMO_TODAY): { item: QueueItem; days: number } | null {
  let best: { item: QueueItem; days: number } | null = null
  for (const item of items) {
    const days = ageDays(item.since, today)
    if (!best || days > best.days) best = { item, days }
  }
  return best
}

/** One answer for the whole item. A photo with no outcome yet has nothing to compare. */
export function itemAgreement(s: V2State, item: QueueItem): Agreement {
  if (item.evaluations.length === 0) return "not-comparable"
  const all = item.evaluations.map((e) => compareEvaluation(s, e).overall)
  if (all.includes("differed")) return "differed"
  if (all.every((a) => a === "agreed")) return "agreed"
  return "not-comparable"
}

export function agreementCounts(s: V2State, items: QueueItem[]): Record<Agreement, number> {
  const out: Record<Agreement, number> = { agreed: 0, differed: 0, "not-comparable": 0 }
  for (const i of items) out[itemAgreement(s, i)] += 1
  return out
}

// ---------------------------------------------------------------------------------------------------------------------
// Outcomes by skill (V7)

export type OutcomeDotState = "met" | "notMet" | "notYet" | "pending"

export interface SkillOutcomeDot {
  id: string
  label: string
  state: OutcomeDotState
}

export interface SkillOutcomeRow {
  skillId: string
  skill: string
  dots: SkillOutcomeDot[]
  met: number
  notMet: number
  notYet: number
  pending: number
}

const STATE_OF: Record<Evaluation["outcome"], OutcomeDotState> = { met: "met", "not-met": "notMet", "not-yet": "notYet" }

/**
 * One row per skill that has evaluations, dots oldest to newest. A returned evaluation is not an outcome yet and is left out;
 * one waiting for approval is a pending dot. Rows with the most "did not meet" first, then by name.
 */
export function skillOutcomeRows(s: V2State): SkillOutcomeRow[] {
  const name = (id: string) => s.people.find((p) => p.id === id)?.name ?? "A student"
  const when = (e: Evaluation) => e.versions[e.versions.length - 1]?.at ?? e.date
  const rows = new Map<string, SkillOutcomeRow>()
  for (const e of s.evaluations.slice().sort((a, b) => (when(a) < when(b) ? -1 : when(a) > when(b) ? 1 : a.id.localeCompare(b.id)))) {
    if (e.status === "returned") continue
    const skill = s.skills.find((k) => k.id === e.skillId)
    if (!skill) continue
    const row = rows.get(skill.id) ?? { skillId: skill.id, skill: skill.name, dots: [], met: 0, notMet: 0, notYet: 0, pending: 0 }
    const state: OutcomeDotState = e.status === "awaiting-approval" ? "pending" : STATE_OF[e.outcome]
    row.dots.push({ id: e.id, label: `${name(e.studentId)}, ${e.date.slice(0, 10)}`, state })
    row[state] += 1
    rows.set(skill.id, row)
  }
  return [...rows.values()].sort((a, b) => b.notMet - a.notMet || a.skill.localeCompare(b.skill))
}

// ---------------------------------------------------------------------------------------------------------------------
// Records readiness (V9)

export type RecordGroupId = "ready" | "unmet" | "changed" | "verified"

export interface RecordGroup {
  id: RecordGroupId
  title: string
  rows: VerificationRow[]
}

/** Where a student's record sits: changed since it was verified, verified and current, ready to verify, or still short of something. */
export function recordGroupOf(r: VerificationRow): RecordGroupId {
  if (r.status === "changed") return "changed"
  if (r.status === "verified") return "verified"
  return r.mandatoryAchieved >= r.mandatoryTotal && r.pending === 0 ? "ready" : "unmet"
}

const GROUP_TITLE: Record<RecordGroupId, string> = { ready: "Ready to verify", unmet: "Has unmet mandatory skills", changed: "Changed since verified", verified: "Verified" }

/** Groups in the order a director acts on them. Empty groups are left out. Rows inside keep the most complete record first. */
export function recordGroups(rows: VerificationRow[]): RecordGroup[] {
  const order: RecordGroupId[] = ["changed", "ready", "unmet", "verified"]
  return order
    .map((id) => ({
      id,
      title: GROUP_TITLE[id],
      rows: rows.filter((r) => recordGroupOf(r) === id).slice().sort((a, b) => b.mandatoryAchieved - a.mandatoryAchieved || a.name.localeCompare(b.name)),
    }))
    .filter((g) => g.rows.length > 0)
}

// ---------------------------------------------------------------------------------------------------------------------
// Preceptor requests (V16): text only

/** "Sent today", "Sent 1 day ago", "Sent 3 days ago". */
export function sentAgo(createdAt: string, today: string = DEMO_TODAY): string {
  const d = ageDays(createdAt, today)
  return d === 0 ? "Sent today" : `Sent ${d} ${d === 1 ? "day" : "days"} ago`
}

/** Oldest request first, so the one that has waited longest is on top. Ties keep their order. */
export function oldestFirst<T extends { createdAt: string }>(list: T[]): T[] {
  return list.map((x, i) => [x, i] as const).sort((a, b) => (a[0].createdAt < b[0].createdAt ? -1 : a[0].createdAt > b[0].createdAt ? 1 : a[1] - b[1])).map(([x]) => x)
}
