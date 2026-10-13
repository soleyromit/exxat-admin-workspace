// Library selectors (S-04..S-07). Pure functions of Db.
import type { Category, Db, Id, Skill, Tag } from "@/lib/domain/types"
import { isConfigured } from "@/lib/engine"
import { norm, skillHasEvidence } from "../derive"
import { criteriaParts, type CriteriaPart } from "./shared"

export type SkillStatusFilter = "all" | "active" | "inactive" | "unconfigured"

export interface SkillFilters {
  q?: string
  /** A category id, or "none" for skills without a category (SL-10). */
  categoryId?: Id | "none"
  tagId?: Id
  status?: SkillStatusFilter
  /** IM-11: only skills that arrived in this import. */
  batchId?: Id
  /** S-06 "Required by": only skills whose minimum names this clinical setting. */
  settingId?: Id
}

export interface SkillRow {
  skill: Skill
  category: Category | null
  tags: Array<Tag & { inactive: boolean }>
  configured: boolean
  /** Offerings the skill is mapped to (the "Courses" count, links to S-10 ?skill=). */
  courseCount: number
  criteria: CriteriaPart[]
  hasEvidence: boolean
}

export function listSkills(db: Db, f: SkillFilters = {}): SkillRow[] {
  const q = f.q ? norm(f.q) : ""
  const rows: SkillRow[] = []
  for (const skill of db.skills) {
    const configured = isConfigured(skill)
    if (q && !norm(`${skill.name} ${skill.description}`).includes(q)) continue
    if (f.categoryId === "none" ? skill.categoryId !== null : f.categoryId && skill.categoryId !== f.categoryId) continue
    if (f.tagId && !skill.tagIds.includes(f.tagId)) continue
    if (f.batchId && skill.importBatchId !== f.batchId) continue
    if (f.settingId && (skill.criteria.settingMinimums[f.settingId] ?? 0) <= 0) continue
    if (f.status === "active" && !(skill.active && configured)) continue
    if (f.status === "inactive" && skill.active) continue
    if (f.status === "unconfigured" && configured) continue
    rows.push({
      skill,
      category: db.categories.find((c) => c.id === skill.categoryId) ?? null,
      tags: skill.tagIds.map((id) => db.tags.find((t) => t.id === id)).filter((t): t is Tag => !!t).map((t) => ({ ...t, inactive: !t.active })),
      configured,
      courseCount: db.offeringSkillMaps.filter((m) => m.skillId === skill.id).length,
      criteria: criteriaParts(db, skill),
      hasEvidence: skillHasEvidence(db, skill.id),
    })
  }
  return rows
}

/** IM-10: how many skills still need configuration (visible progress, never a silent gap). */
export const unconfiguredCount = (db: Db): number => db.skills.filter((s) => !isConfigured(s)).length

/** SC-15: Review and approve is shown only when at least one skill has administrator approval turned on. */
export const reviewNavVisible = (db: Db): boolean => db.skills.some((s) => s.requiresApproval && isConfigured(s))

export interface TaxonRow<T> {
  item: T
  skillCount: number
}
export function categoryRows(db: Db): Array<TaxonRow<Category>> {
  return db.categories.map((c) => ({ item: c, skillCount: db.skills.filter((s) => s.categoryId === c.id).length }))
}
export function tagRows(db: Db): Array<TaxonRow<Tag> & { categoriesSpanned: number; skills: Skill[] }> {
  return db.tags.map((t) => {
    const skills = db.skills.filter((s) => s.tagIds.includes(t.id))
    return { item: t, skillCount: skills.length, skills, categoriesSpanned: new Set(skills.map((s) => s.categoryId).filter(Boolean)).size }
  })
}

/** S-06: evidence recorded per setting (clinical evidence only) and the skills whose minimums name it (OD-26 block). */
export function settingRows(db: Db) {
  return db.clinicalSettings.map((s) => ({
    item: s,
    evidenceCount: db.submissions.filter((x) => x.clinicalSettingId === s.id && db.evaluations.some((e) => e.submissionId === x.id)).length,
    referencedBy: db.skills.filter((k) => (k.criteria.settingMinimums[s.id] ?? 0) > 0).map((k) => ({ id: k.id, name: k.name })),
  }))
}

/** S-07: roster with evaluation counts, plus the student-named instructors not yet adopted (SL-09). */
export function labInstructorRows(db: Db) {
  const count = (personId: Id) => db.evaluations.filter((e) => e.evaluator.personId === personId).length
  return {
    roster: db.labInstructors.map((l) => ({ item: l, evaluationCount: count(l.id) })),
    named: db.namedLabInstructors.filter((n) => !n.adoptedAs).map((n) => ({ item: n, evaluationCount: count(n.id), namedBy: db.students.find((s) => s.id === n.namedByStudentId)?.name ?? null })),
  }
}

// ------------------------------------------------------------------ S-07 helpers (moved from components/library/lab-actions.ts)

const OPEN_LIFECYCLE = new Set(["draft", "awaitingEvaluator", "returned"])

/** Requests still waiting on this evaluator reference (submissions not yet completed). */
export const openRequestsFor = (db: Db, personId: Id): number => db.submissions.filter((s) => s.evaluator.personId === personId && OPEN_LIFECYCLE.has(s.lifecycle)).length

/** How many times students named this person (one submission is one naming). */
export const namedTimes = (db: Db, namedId: Id): number => db.submissions.filter((s) => s.evaluator.personId === namedId).length

/**
 * Evaluations attributed to a roster entry, including those recorded under a spelling a student typed that an admin
 * has since adopted or merged into it. Evaluations keep the name they were recorded under (immutable, RV-03), so the
 * count follows the adoption link instead of rewriting them.
 */
export function rosterEvaluationCount(db: Db, rosterId: Id): number {
  const ids = new Set<Id>([rosterId])
  for (const n of db.namedLabInstructors) if (n.adoptedAs === rosterId) ids.add(n.id)
  return db.evaluations.filter((e) => ids.has(e.evaluator.personId)).length
}

const normName = (s: string) => s.toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim()

/** "Looks like T. Ferreira": a roster entry that shares the last name with a typed one `[INFER]`. */
export function similarRosterEntry(db: Db, name: string): { id: Id; name: string } | null {
  const last = normName(name).split(" ").filter(Boolean).pop()
  if (!last || last.length < 3) return null
  const hit = db.labInstructors.find((l) => normName(l.name).split(" ").filter(Boolean).pop() === last)
  return hit ? { id: hit.id, name: hit.name } : null
}

/** OD-26 / S-06: skills whose minimum names this clinical setting. Used for the "Required by" link into S-04. */
export function skillsRequiringSetting(db: Db, settingId: Id): Array<{ id: Id; name: string }> {
  return db.skills.filter((k) => (k.criteria.settingMinimums[settingId] ?? 0) > 0).map((k) => ({ id: k.id, name: k.name }))
}
