import { DEMO_TODAY } from "@/lib/v2/seed-core"
import { setSkillsActive, deleteSkill, allCourses, courseLabel } from "@/lib/v2/admin-actions"
import { currentTerm } from "@/lib/v2/filters"
import { appendAudit } from "@/lib/v2/store"
import { cohortsOf } from "@/lib/v2/reports"
import type { MappingRow, Skill, V2State } from "@/lib/v2/types"
import { populationRows } from "./dashboard"
import { retireImpact } from "./retire"
import { EMPTY_SCOPE } from "./scope"
import { NO_CATEGORY, mergeTags, normName } from "./library"

/**
 * "Replace with a new version" from a library row (lab flow, components/lab/library/replace-sheet.tsx).
 *
 * Semantics [CALL 10-09; INFER, not REQ]: a changed standard is a new version, not an edit. The new version starts as a copy of
 * the old (details, evaluation settings, course mapping), the admin picks which student groups move to it, and the old version
 * keeps its evidence and history for the groups that stay [REQ SL-11 for what "inactive" withdraws]. When every group moves, the
 * old version becomes inactive. Course mapping is per offering, not per group, so with some groups staying both versions are
 * mapped to the same courses; per-group mapping is the open "non-lockstep mapping" question, not decided here.
 */

export interface ReplaceDraft {
  name: string
  category: string
  tags: string[]
  /** Course ids whose mapping the new version takes over (all of the old version's courses by default). */
  courseIds: string[]
  /** Student groups (cohort names) that move to the new version. */
  cohorts: string[]
}

export interface ReplaceSource {
  id: string
  name: string
  category: string
  tags: string[]
  configured: boolean
  courses: Array<{ id: string; label: string; level: MappingRow["level"] }>
  /** Every student group, in program order. */
  cohorts: string[]
}

/** A skill's version number: 1, or one more than the version it replaces. */
export function versionOf(state: Pick<V2State, "skills">, skillId: string): number {
  const byId = new Map(state.skills.map((k) => [k.id, k]))
  let n = 1
  let k = byId.get(skillId)
  const seen = new Set<string>()
  while (k?.replaces && !seen.has(k.id)) { seen.add(k.id); n += 1; k = byId.get(k.replaces.id) }
  return n
}

export function replaceSource(state: V2State, skillId: string): ReplaceSource | null {
  const k = state.skills.find((x) => x.id === skillId)
  if (!k) return null
  const names = new Map(allCourses(state).map((c) => [c.id, courseLabel(c)]))
  const seen = new Map<string, MappingRow["level"]>()
  for (const m of state.mappings) if (m.skillId === skillId && m.level !== "not-expected" && !seen.has(m.courseId)) seen.set(m.courseId, m.level)
  return {
    id: k.id,
    name: k.name,
    category: k.category && k.category !== NO_CATEGORY ? k.category : "",
    tags: [...(k.tags ?? [])],
    configured: !!k.configured,
    courses: [...seen.entries()].map(([id, level]) => ({ id, label: names.get(id) ?? id, level })).sort((a, b) => a.label.localeCompare(b.label)),
    cohorts: cohortsOf(state),
  }
}

/** The draft the flow opens with: the old version's name and details (the version badge tells them apart), every course, every group. */
export function initialReplaceDraft(src: ReplaceSource): ReplaceDraft {
  return { name: src.name, category: src.category, tags: [...src.tags], courseIds: src.courses.map((c) => c.id), cohorts: [...src.cohorts] }
}

export interface ReplaceImpact {
  /** Students this term who have the old version now and are in a group that moves. */
  moving: number
  /** Students this term who have the old version now and stay on it. */
  staying: number
  /** Evaluations recorded against the old version: kept on it. */
  evidence: number
  /** Requests still open that name the old version: they stay with it. */
  openRequests: number
  /** Every group moves, so the old version becomes inactive. */
  allMove: boolean
}

export function replaceImpact(state: V2State, skillId: string, cohorts: readonly string[], today: string = DEMO_TODAY): ReplaceImpact | null {
  const base = retireImpact(state, skillId, today)
  if (!base) return null
  const pick = new Set(cohorts)
  const have = populationRows(state, EMPTY_SCOPE, today).rows.filter((r) => r.requiredIds.includes(skillId))
  const moving = have.filter((r) => pick.has(r.cohort)).length
  const all = cohortsOf(state)
  return { moving, staying: have.length - moving, evidence: base.evidence, openRequests: base.openRequests, allMove: all.length > 0 && all.every((c) => pick.has(c)) }
}

export type ReplaceError = Partial<Record<"name" | "cohorts", string>>

/** `keep`: the replaced skill's name, which the new version may share (its version badge tells them apart). */
export function validateReplace(d: ReplaceDraft, takenNames: readonly string[], keep = ""): ReplaceError {
  const e: ReplaceError = {}
  const name = d.name.trim().replace(/\s+/g, " ")
  if (!name) e.name = "Enter a name."
  else if (name.length > 120) e.name = "Name is too long. Use 120 characters or fewer."
  else if (normName(name) !== normName(keep) && takenNames.some((n) => normName(n) === normName(name))) e.name = `${name} is already in the library.`
  if (!d.cohorts.length) e.cohorts = "Choose at least one student group."
  return e
}

/**
 * Writes the replacement to the shared store: the new version (a copy of the old one's evaluation settings, so it is configured
 * when the old one was), the chosen course mappings at the old levels, and, when every group moves, the old version inactive.
 */
export function applyReplace(state: V2State, oldId: string, d: ReplaceDraft, newId: string, actorId: string, at: string): { state: V2State; allMove: boolean } | null {
  const old = state.skills.find((k) => k.id === oldId)
  if (!old) return null
  const all = cohortsOf(state)
  const allMove = all.length > 0 && all.every((c) => d.cohorts.includes(c))
  const skill: Skill = {
    id: newId,
    specialty: old.specialty,
    name: d.name.trim().replace(/\s+/g, " "),
    category: d.category.trim() || NO_CATEGORY,
    model: old.model,
    configured: old.configured,
    published: old.published,
    config: old.config ? structuredClone(old.config) : null,
    ...(old.description ? { description: old.description } : {}),
    tags: mergeTags([], d.tags),
    replaces: { id: oldId, cohorts: [...d.cohorts] },
  }
  const want = new Set(d.courseIds)
  const copied: MappingRow[] = state.mappings.filter((m) => m.skillId === oldId && want.has(m.courseId) && m.level !== "not-expected").map((m) => ({ ...m, skillId: newId }))
  let next: V2State = { ...state, skills: [...state.skills, skill], mappings: [...state.mappings, ...copied] }
  if (allMove) {
    const r = setSkillsActive(next, [oldId], false, actorId, at)
    if (r.ok) next = r.state
  }
  return { state: appendAudit(next, actorId, "Replaced skill", `${old.name} with ${skill.name}`, at), allMove }
}

/** Undo from the result banner: removes the new version (nothing is tracked against it yet) and restores the old one. */
export function undoReplace(state: V2State, newId: string, actorId: string, at: string): V2State {
  const k = state.skills.find((x) => x.id === newId)
  if (!k?.replaces) return state
  const oldId = k.replaces.id
  const d = deleteSkill(state, newId, actorId, at)
  const s = d.ok ? d.state : state
  const r = setSkillsActive(s, [oldId], true, actorId, at)
  return r.ok ? r.state : s
}

/** The version that replaced `skillId`, if any (the newest one). */
export function successorOf(state: V2State, skillId: string): Skill | null {
  const all = state.skills.filter((k) => k.replaces?.id === skillId)
  return all[all.length - 1] ?? null
}

/** Students this term who have the skill now, per student group (cohort name), for the "who moves" step. */
export function studentsByGroup(state: V2State, skillId: string, today: string = DEMO_TODAY): Map<string, number> {
  const out = new Map<string, number>()
  for (const r of populationRows(state, EMPTY_SCOPE, today).rows) if (r.requiredIds.includes(skillId)) out.set(r.cohort, (out.get(r.cohort) ?? 0) + 1)
  return out
}

/**
 * Groups that stay on the old version while taking a course the new version is mapped to this term: mapping is per offering, so
 * they would see both versions there. Shown as one amber line per group; whether mapping should be per group is open (Vishakha).
 */
export function bothVersionsIn(state: V2State, d: ReplaceDraft): Array<{ cohort: string; courses: string[] }> {
  const staying = cohortsOf(state).filter((c) => !d.cohorts.includes(c))
  if (!staying.length || !d.courseIds.length) return []
  const term = currentTerm(state).id
  const code = new Map(allCourses(state).map((c) => [c.id, c.code]))
  const idOf = (name: string) => state.cohorts?.find((c) => c.name === name || c.id === name)?.id ?? name
  const want = new Set(d.courseIds)
  return staying
    .map((cohort) => {
      const id = idOf(cohort)
      const courses = [...new Set((state.offerings ?? []).filter((o) => o.termId === term && (o.cohortId === id || o.cohortId === cohort) && want.has(o.courseId)).map((o) => code.get(o.courseId) ?? o.courseId))].sort()
      return { cohort, courses }
    })
    .filter((x) => x.courses.length > 0)
}
