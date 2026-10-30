import { approvalTotals, approvalsInScope } from "./approvals"
import { students } from "./filters"
import { placementsEnding, PLACEMENT_ENDING_DAYS } from "./placements"
import { DEFAULT_SCOPE, isConfigured, openRequestsIn, populationRows, populationTotals, requiredToComplete, type PopulationScope } from "./population"
import { DEMO_TODAY } from "./seed-core"
import type { Person, V2State } from "./types"

/**
 * The number registry: every headline fact, defined once, built only from the single sources (population, approvals,
 * placements). Precisely: no screen calls facts() directly. Screens compute their figures from the same source functions
 * facts() wraps (populationRows / populationTotals, approvalsInScope / approvalTotals, placementsEnding, requiredToComplete,
 * openRequests), and the consistency gates enforce agreement: tests/v2/consistency*.test.ts compare every screen model with
 * facts() in several scopes, and tests/lab/consistency.mjs compares the numbers the lab screens render. So agreement is a
 * tested property, not a structural guarantee: a screen that re-derived a figure another way would only be caught by a gate.
 * Pure, no screen copy.
 *
 * Scope: the population scope (term, cohort, group, course, category, tag, location, setting). Program-wide facts (students
 * total, skills, evaluators, sites) ignore it by definition.
 */

/** Who counts as an evaluator (the people a student can ask for a sign-off). */
export const EVALUATOR_KINDS: ReadonlyArray<Person["kind"]> = ["preceptor", "lab-instructor", "faculty"]

export interface Facts {
  /** Every student in the program (program-wide). */
  studentsTotal: number
  /** Students in scope: cohort and group filters, taking at least one offering in the scope term (population rows). */
  studentsInScope: number
  /**
   * "Required this term" records in scope: each student x the mandatory skills of their own cohort's offerings in the term
   * (decision D-X12). Drives pace and behind. Never mixed with requiredToGraduate.
   */
  mandatoryRecords: number
  /** Of those records, achieved (counted evidence only; held evidence never counts). */
  mandatoryAchieved: number
  /** mandatoryAchieved / mandatoryRecords, rounded percent. */
  achievedPct: number
  /** Students behind under the scope basis (default: Expected now, more than PACE_MARGIN short of the term clock). */
  behind: number
  /** Requests sent to an evaluator and not yet answered (with evaluator or stalled), students in scope. */
  waitingRequests: number
  /** Approval queue entries in scope: the nav badge and the queue count. */
  awaitingApproval: number
  /** Evaluations inside those entries (an entry with no outcome yet counts as one). */
  awaitingApprovalEvaluations: number
  /** Of the evaluations: stored "awaiting approval" status, and held only because the evaluator name is not adopted. */
  awaitingApprovalStatusRows: number
  awaitingApprovalUnverifiedRows: number
  /** Evaluator names not adopted yet (program-wide). */
  unverifiedEvaluators: number
  /** Skills in the library, configured and not (program-wide). */
  skillsTotal: number
  skillsConfigured: number
  skillsNotConfigured: number
  /** Deactivated skills (SL-11): kept with their evidence, excluded from every figure (decision D-X14). */
  skillsInactive: number
  /** "Required to graduate": skills the program list flags as required before graduation (reportable only). Readiness and
   *  verification read this set; it is never mixed with the required-this-term records. */
  requiredToGraduate: number
  /** Evaluators (preceptors, lab instructors, clinical faculty), program-wide. */
  evaluators: number
  /** Sites the program places at (program-wide). */
  sites: number
  /** Current placements of students in scope that end within PLACEMENT_ENDING_DAYS. */
  placementsEnding: number
}

/** Where each fact comes from, for the report and the docs. */
export const FACT_SOURCE: Record<keyof Facts, string> = {
  studentsTotal: "filters.students",
  studentsInScope: "population.populationRows(...).rows.length",
  mandatoryRecords: "population.populationTotals().records",
  mandatoryAchieved: "population.populationTotals().achieved",
  achievedPct: "population.populationTotals().achievedPct",
  behind: "population.populationTotals().behind",
  waitingRequests: "population.openRequestsIn(state, pop.ids, scope).length",
  awaitingApproval: "approvals.approvalsInScope(state, scope).entries.length",
  awaitingApprovalEvaluations: "approvals.approvalTotals().evaluations",
  awaitingApprovalStatusRows: "approvals.approvalTotals().statusRows",
  awaitingApprovalUnverifiedRows: "approvals.approvalTotals().unverifiedRows",
  unverifiedEvaluators: "people (evaluator kinds) with verified === false",
  skillsTotal: "state.skills.length",
  skillsConfigured: "state.skills.filter(isConfigured).length",
  skillsNotConfigured: "state.skills.filter(!isConfigured).length",
  skillsInactive: "state.skills.filter(active === false).length",
  requiredToGraduate: "population.requiredToComplete(state).length",
  evaluators: "people with an evaluator kind",
  sites: "state.sites.length",
  placementsEnding: "placements.placementsEnding(state, pop.ids).length",
}

const cache = new WeakMap<V2State, Map<string, Facts>>()

export function facts(state: V2State, scope: PopulationScope = DEFAULT_SCOPE, today: string = DEMO_TODAY): Facts {
  const key = `${JSON.stringify(scope)}|${today}`
  const hit = cache.get(state)?.get(key)
  if (hit) return hit
  const pop = populationRows(state, scope, today)
  const tot = populationTotals(pop)
  const queue = approvalsInScope(state, scope, today)
  const qt = approvalTotals(state, queue.entries)
  const evaluators = state.people.filter((p) => EVALUATOR_KINDS.includes(p.kind))
  const configured = state.skills.filter(isConfigured).length
  const out: Facts = {
    studentsTotal: students(state).length,
    studentsInScope: tot.students,
    mandatoryRecords: tot.records,
    mandatoryAchieved: tot.achieved,
    achievedPct: tot.achievedPct,
    behind: tot.behind,
    waitingRequests: openRequestsIn(state, pop.ids, scope).length,
    awaitingApproval: qt.entries,
    awaitingApprovalEvaluations: qt.evaluations,
    awaitingApprovalStatusRows: qt.statusRows,
    awaitingApprovalUnverifiedRows: qt.unverifiedRows,
    unverifiedEvaluators: evaluators.filter((p) => p.verified === false).length,
    skillsTotal: state.skills.length,
    skillsConfigured: configured,
    skillsNotConfigured: state.skills.length - configured,
    skillsInactive: state.skills.filter((k) => k.active === false).length,
    requiredToGraduate: requiredToComplete(state).length,
    evaluators: evaluators.length,
    sites: (state.sites ?? []).length,
    placementsEnding: placementsEnding(state, pop.ids, today, PLACEMENT_ENDING_DAYS).length,
  }
  const m = cache.get(state) ?? new Map<string, Facts>()
  m.set(key, out)
  cache.set(state, m)
  return out
}
