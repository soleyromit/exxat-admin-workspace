import { daysFrom, findTerm } from "./filters"
import { DEMO_TODAY } from "./seed-core"
import type { Placement, V2State } from "./types"

/**
 * Placements (clinical rotations) with real dates. Pure, no screen copy. "Placement ending" (N-03) reads the placement's own end
 * date, never the term end.
 */

/** N-03: a placement ending within this many days surfaces its likely skills not started [INFER: BUILD-PROMPT 10 names no number]. */
export const PLACEMENT_ENDING_DAYS = 21

export type PlacementStatus = "upcoming" | "current" | "finished"

export function placementStatus(p: Pick<Placement, "startDate" | "endDate">, today: string = DEMO_TODAY): PlacementStatus {
  if (p.startDate > today) return "upcoming"
  if (p.endDate < today) return "finished"
  return "current"
}

/** Days from today to the placement's last day (0 on the last day, negative once finished). */
export const daysLeftIn = (p: Pick<Placement, "endDate">, today: string = DEMO_TODAY): number => daysFrom(today, p.endDate)

/** True when the placement is current and ends within `days` of today. */
export const isEnding = (p: Pick<Placement, "startDate" | "endDate">, today: string = DEMO_TODAY, days: number = PLACEMENT_ENDING_DAYS): boolean => placementStatus(p, today) === "current" && daysLeftIn(p, today) <= days

/** A student's placements in a term (id, name or slug; empty means current). A placement with no term id is read as current. */
export function placementsOf(s: V2State, studentId: string, termKey: string = ""): Placement[] {
  const term = findTerm(s, termKey)
  return s.placements
    .filter((p) => p.studentId === studentId && (!term || (p.termId ? p.termId === term.id : !!term.current)))
    .sort((a, b) => (a.startDate < b.startDate ? -1 : a.startDate > b.startDate ? 1 : a.id.localeCompare(b.id)))
}

/** Placements of the students in `ids` that are current on `today` and end within `days`. */
export function placementsEnding(s: V2State, ids: Set<string> | null = null, today: string = DEMO_TODAY, days: number = PLACEMENT_ENDING_DAYS): Placement[] {
  return s.placements.filter((p) => (!ids || ids.has(p.studentId)) && isEnding(p, today, days)).sort((a, b) => (a.endDate < b.endDate ? -1 : a.endDate > b.endDate ? 1 : a.id.localeCompare(b.id)))
}
