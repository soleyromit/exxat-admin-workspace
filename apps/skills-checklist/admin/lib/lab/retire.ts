import { DEMO_TODAY } from "@/lib/v2/seed-core"
import { evalsOfSkill, skillById } from "@/lib/v2/evidence-index"
import { deleteBlockOf, mappedCourses, trackedAgainst } from "@/lib/v2/admin-actions"
import type { V2State } from "@/lib/v2/types"
import { populationRows } from "./dashboard"
import { EMPTY_SCOPE } from "./scope"

/**
 * Deactivate, start a new list, or delete one skill (REQ SL-02, SL-11; CALL 10-09; strategy/03 section 5.3).
 *
 * The call settled the intent split [CALL 10-09]:
 * - "Inactivate just means I made a mistake": deactivate. Reversible. Evidence already recorded is kept. The skill leaves
 *   course mapping, student selection and reporting scope (SL-11; "I don't want deactivated things in the report").
 * - A changed standard is not a deactivation: "you create a new list and you start attaching your new cohorts to that new
 *   list". The old list keeps its history for the cohorts already on it.
 * - Delete only while nothing has been tracked against it: "as soon as there is data ... prevent them from deleting".
 *
 * What happens to open requests on a deactivated skill is not in REQ or the call [INFER: shown as an impact figure only].
 */

export type Intent = "mistake" | "standard"

export interface RetireImpact {
  skillId: string
  name: string
  section: string
  /** Evaluations recorded against the skill, any status. */
  evidence: number
  studentsWithEvidence: number
  /** Students in the current term it is required for (the dashboard population). */
  requiredFor: number
  /** Courses it is mapped to (mandatory or optional). */
  courses: number
  /** Requests still open that name the skill. */
  openRequests: number
  canDelete: boolean
  /** Why delete is blocked, in words, or null. */
  deleteBlocked: string | null
}

const OPEN = new Set(["on-device", "with-evaluator", "awaiting-review", "stalled", "returned"])
export function retireImpact(state: V2State, skillId: string, today: string = DEMO_TODAY): RetireImpact | null {
  const k = skillById(state, skillId)
  if (!k) return null
  const evs = evalsOfSkill(state, skillId)
  const pop = populationRows(state, EMPTY_SCOPE, today)
  const requiredFor = pop.rows.filter((r) => r.requiredIds.includes(skillId)).length
  const courses = new Set(state.mappings.filter((m) => m.skillId === skillId && m.level !== "not-expected").map((m) => m.courseId)).size
  const openRequests = state.submissions.filter((x) => OPEN.has(x.status) && x.skillIds.includes(skillId)).length
  const evidence = evs.length
  const blocked = deleteBlockOf(trackedAgainst(state, skillId))
  return {
    skillId,
    name: k.name,
    section: k.category,
    evidence,
    studentsWithEvidence: new Set(evs.map((e) => e.studentId)).size,
    requiredFor,
    courses,
    openRequests,
    canDelete: blocked === null,
    deleteBlocked: blocked,
  }
}

/**
 * What confirming each intent changes, as short facts under the impact figures. The figures already carry the numbers, so
 * these name the change only (strategy/07: a figure appears once).
 */
export function intentEffects(intent: Intent, i: RetireImpact, noun = "skill"): string[] {
  if (intent === "mistake") {
    return [
      i.requiredFor ? "Students stop seeing it and cannot choose it" : "No student has it this term",
      i.courses ? "It leaves course mapping" : "Not mapped to any course",
      i.evidence ? "Evaluations are kept and left out of reports" : "No evaluations to keep",
      `You can reactivate the ${noun}`,
    ]
  }
  return [
    "A new list is created from the current one",
    "The cohorts you choose move to the new list",
    i.evidence ? "The old list keeps its evaluations and reports" : "The old list keeps its history",
  ]
}

/** The demo default: the published skill with the most evidence that students need this term. */
export function defaultSkillId(state: V2State): string {
  const counts = new Map<string, number>()
  for (const e of state.evaluations) counts.set(e.skillId, (counts.get(e.skillId) ?? 0) + 1)
  const published = state.skills.filter((k) => k.published && k.configured)
  return [...published].sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0) || a.name.localeCompare(b.name))[0]?.id ?? state.skills[0]?.id ?? ""
}

/** A skill nothing has been tracked against (for showing delete enabled); a mapped one first, so the unmap list shows. */
export function deletableSkillId(state: V2State): string | null {
  const free = state.skills.filter((k) => trackedAgainst(state, k.id).total === 0)
  const mapped = free.find((k) => state.mappings.some((m) => m.skillId === k.id && m.level !== "not-expected"))
  return (mapped ?? free[0])?.id ?? null
}

/**
 * What deleting a skill does (LEDGER D-X15): allowed only while nothing is tracked against it (the call; `trackedAgainst`). A course
 * mapping does not block delete; the courses it is mapped to are listed as impact and the mapping is removed with the skill
 * (`lib/v2/admin-actions.ts deleteSkill`). `lib/lab/library.ts canDelete` reads the same rule.
 */
export interface DeleteImpact {
  allowed: boolean
  /** Courses (code and name) it would be unmapped from, sorted. */
  unmapFrom: string[]
  reason: string | null
}

export function deleteImpact(state: V2State, skillId: string): DeleteImpact | null {
  const i = retireImpact(state, skillId)
  if (!i) return null
  return { allowed: i.canDelete, unmapFrom: mappedCourses(state, skillId), reason: i.deleteBlocked }
}

export function validateListName(name: string, existing: readonly string[]): string | null {
  const n = name.trim()
  if (!n) return "Name the new list."
  if (n.length > 80) return "Use 80 characters or fewer."
  if (existing.some((x) => x.trim().toLowerCase() === n.toLowerCase())) return `"${n}" is already a list.`
  return null
}
