// Library actions: skills (SL-02..SL-11, IM-12), categories and tags (SL-03..SL-06), clinical settings (SL-07, OD-26),
// lab instructors (SL-08, SL-09). Pure: each returns a new Db and never mutates its input.
import type { Category, Db, Id, LabInstructor, Skill, Tag } from "@/lib/domain/types"
import { idsFrom } from "@/lib/domain/ids"
import { isConfigured } from "@/lib/engine"
import { norm } from "../derive"
import { fail, ok, type ActionCtx, type Result } from "../result"

export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim())

// ------------------------------------------------------------------ skills

export interface SkillDefinitionInput {
  name: string
  description?: string
  categoryId?: Id | null
  tagIds?: Id[]
}

function checkTaxa(db: Db, categoryId: Id | null | undefined, tagIds: Id[] | undefined, current?: Skill) {
  const fields: Record<string, string> = {}
  if (categoryId) {
    const c = db.categories.find((x) => x.id === categoryId)
    if (!c) fields.categoryId = "unknown"
    // SL-06: only active categories are assignable; one already assigned and since deactivated stays.
    else if (!c.active && current?.categoryId !== categoryId) fields.categoryId = "inactive"
  }
  for (const id of tagIds ?? []) {
    const t = db.tags.find((x) => x.id === id)
    if (!t) fields[`tagIds.${id}`] = "unknown"
    else if (!t.active && !current?.tagIds.includes(id)) fields[`tagIds.${id}`] = "inactive"
  }
  return fields
}

/** IM-12, SC-01: create by hand. The skill exists UNCONFIGURED (no model, no default: SC-02) until S-09 saves one. */
export function createSkill(db: Db, input: SkillDefinitionInput, ctx: ActionCtx): Result<{ skillId: Id }> {
  const name = input.name.trim()
  if (!name) return fail("invalid", "A skill needs a name.", { fields: { name: "required" } })
  if (db.skills.some((s) => norm(s.name) === norm(name))) return fail("duplicate", "A skill with this name already exists.", { fields: { name: "duplicate" } })
  const tax = checkTaxa(db, input.categoryId, input.tagIds)
  if (Object.keys(tax).length) return fail("invalid", "Category or tag is not available.", { fields: tax })
  const ids = idsFrom(db)
  const skill: Skill = {
    id: ids.next("sk"),
    name,
    description: (input.description ?? "").trim(),
    categoryId: input.categoryId ?? null,
    tagIds: [...new Set(input.tagIds ?? [])],
    active: true,
    model: null,
    criteria: { requiredCount: null, levelMinimums: {}, settingMinimums: {} },
    requiresApproval: false,
    allowedRoles: [],
    submissionFields: [],
    evaluatorComment: "optional",
    selfEvaluation: false,
    importBatchId: null,
    createdAt: ctx.now,
  }
  return ok({ ...db, seq: ids.seq(), skills: [...db.skills, skill] }, { skillId: skill.id })
}

export function updateSkillDefinition(db: Db, skillId: Id, patch: Partial<SkillDefinitionInput>): Result<{ skillId: Id }> {
  const cur = db.skills.find((s) => s.id === skillId)
  if (!cur) return fail("notFound", "Skill not found.")
  const name = patch.name === undefined ? cur.name : patch.name.trim()
  if (!name) return fail("invalid", "A skill needs a name.", { fields: { name: "required" } })
  if (db.skills.some((s) => s.id !== skillId && norm(s.name) === norm(name)))
    return fail("duplicate", "A skill with this name already exists.", { fields: { name: "duplicate" } })
  const categoryId = patch.categoryId === undefined ? cur.categoryId : patch.categoryId
  const tagIds = patch.tagIds === undefined ? cur.tagIds : [...new Set(patch.tagIds)]
  const tax = checkTaxa(db, categoryId, tagIds, cur)
  if (Object.keys(tax).length) return fail("invalid", "Category or tag is not available.", { fields: tax })
  const next: Skill = { ...cur, name, description: patch.description === undefined ? cur.description : patch.description.trim(), categoryId, tagIds }
  return ok({ ...db, skills: db.skills.map((s) => (s.id === skillId ? next : s)) }, { skillId })
}

/**
 * SL-11: deactivating withdraws the skill from mapping, student selection and reporting scope while retaining
 * evidence. Reactivating needs a configured skill (IM-09). Nothing else is touched.
 */
export function setSkillActive(db: Db, skillId: Id, active: boolean): Result<{ skillId: Id }> {
  const cur = db.skills.find((s) => s.id === skillId)
  if (!cur) return fail("notFound", "Skill not found.")
  if (active && !isConfigured(cur)) return fail("skillNotUsable", "A skill must be configured before it can be used.")
  return ok({ ...db, skills: db.skills.map((s) => (s.id === skillId ? { ...s, active } : s)) }, { skillId })
}

// ------------------------------------------------------------------ categories and tags

export type TaxonKind = "category" | "tag"
const listKey = (k: TaxonKind) => (k === "category" ? "categories" : "tags")

export interface TaxonInput {
  name: string
  description?: string
}

/** SL-05: also used inline from the skill editor ("New", "New tag"). */
export function createTaxon(db: Db, kind: TaxonKind, input: TaxonInput): Result<{ id: Id }> {
  const name = input.name.trim()
  if (!name) return fail("invalid", "A name is required.", { fields: { name: "required" } })
  const list = db[listKey(kind)] as Array<Category | Tag>
  if (list.some((x) => norm(x.name) === norm(name))) return fail("duplicate", "That name already exists.", { fields: { name: "duplicate" } })
  const ids = idsFrom(db)
  const item: Category = { id: ids.next(kind === "category" ? "cat" : "tag"), name, description: (input.description ?? "").trim(), active: true }
  return ok({ ...db, seq: ids.seq(), [listKey(kind)]: [...list, item] } as Db, { id: item.id })
}

export function updateTaxon(db: Db, kind: TaxonKind, id: Id, patch: Partial<TaxonInput>): Result<{ id: Id }> {
  const list = db[listKey(kind)] as Array<Category | Tag>
  const cur = list.find((x) => x.id === id)
  if (!cur) return fail("notFound", "Not found.")
  const name = patch.name === undefined ? cur.name : patch.name.trim()
  if (!name) return fail("invalid", "A name is required.", { fields: { name: "required" } })
  if (list.some((x) => x.id !== id && norm(x.name) === norm(name))) return fail("duplicate", "That name already exists.", { fields: { name: "duplicate" } })
  const next = { ...cur, name, description: patch.description === undefined ? cur.description : patch.description.trim() }
  return ok({ ...db, [listKey(kind)]: list.map((x) => (x.id === id ? next : x)) } as Db, { id })
}

/** SL-06: deactivating never removes it from skills that already carry it; they show it flagged inactive. */
export function setTaxonActive(db: Db, kind: TaxonKind, id: Id, active: boolean): Result<{ id: Id }> {
  const list = db[listKey(kind)] as Array<Category | Tag>
  if (!list.some((x) => x.id === id)) return fail("notFound", "Not found.")
  return ok({ ...db, [listKey(kind)]: list.map((x) => (x.id === id ? { ...x, active } : x)) } as Db, { id })
}

// ------------------------------------------------------------------ clinical settings

export function createClinicalSetting(db: Db, input: { name: string }): Result<{ id: Id }> {
  const name = input.name.trim()
  if (!name) return fail("invalid", "A name is required.", { fields: { name: "required" } })
  if (db.clinicalSettings.some((s) => norm(s.name) === norm(name))) return fail("duplicate", "That setting already exists.", { fields: { name: "duplicate" } })
  const ids = idsFrom(db)
  const item = { id: ids.next("set"), name, active: true }
  return ok({ ...db, seq: ids.seq(), clinicalSettings: [...db.clinicalSettings, item] }, { id: item.id })
}

export function renameClinicalSetting(db: Db, id: Id, name: string): Result<{ id: Id }> {
  const next = name.trim()
  if (!next) return fail("invalid", "A name is required.", { fields: { name: "required" } })
  if (!db.clinicalSettings.some((s) => s.id === id)) return fail("notFound", "Not found.")
  if (db.clinicalSettings.some((s) => s.id !== id && norm(s.name) === norm(next))) return fail("duplicate", "That setting already exists.", { fields: { name: "duplicate" } })
  return ok({ ...db, clinicalSettings: db.clinicalSettings.map((s) => (s.id === id ? { ...s, name: next } : s)) }, { id })
}

/**
 * OD-26 (proposed, OPEN): a setting that a skill's minimum still names cannot be deactivated, because the minimum
 * could then never be met. The block names the skills so the admin can change them first [INFER].
 */
export function setClinicalSettingActive(db: Db, id: Id, active: boolean): Result<{ id: Id }> {
  const cur = db.clinicalSettings.find((s) => s.id === id)
  if (!cur) return fail("notFound", "Not found.")
  if (!active) {
    const refs = db.skills.filter((s) => (s.criteria.settingMinimums[id] ?? 0) > 0)
    if (refs.length) {
      return fail("settingReferenced", "A skill minimum still names this setting.", {
        data: { skillIds: refs.map((s) => s.id), skillNames: refs.map((s) => s.name) },
      })
    }
  }
  return ok({ ...db, clinicalSettings: db.clinicalSettings.map((s) => (s.id === id ? { ...s, active } : s)) }, { id })
}

// ------------------------------------------------------------------ lab instructors

export interface LabInstructorInput {
  name: string
  email: string
}

function checkInstructor(db: Db, input: LabInstructorInput, selfId?: Id) {
  const fields: Record<string, string> = {}
  if (!input.name.trim()) fields.name = "required"
  if (!input.email.trim()) fields.email = "required"
  else if (!isEmail(input.email)) fields.email = "format"
  else if (db.labInstructors.some((l) => l.id !== selfId && l.email.toLowerCase() === input.email.trim().toLowerCase())) fields.email = "duplicate"
  return fields
}

/** SL-08: a name and an email are enough. Nobody here can sign in and no account is created. */
export function createLabInstructor(db: Db, input: LabInstructorInput): Result<{ id: Id }> {
  const fields = checkInstructor(db, input)
  if (Object.keys(fields).length) return fail("invalid", "Check the name and email.", { fields })
  const ids = idsFrom(db)
  const item: LabInstructor = { id: ids.next("lab"), name: input.name.trim(), email: input.email.trim(), active: true }
  return ok({ ...db, seq: ids.seq(), labInstructors: [...db.labInstructors, item] }, { id: item.id })
}

export function updateLabInstructor(db: Db, id: Id, patch: Partial<LabInstructorInput>): Result<{ id: Id }> {
  const cur = db.labInstructors.find((l) => l.id === id)
  if (!cur) return fail("notFound", "Not found.")
  const merged = { name: patch.name ?? cur.name, email: patch.email ?? cur.email }
  const fields = checkInstructor(db, merged, id)
  if (Object.keys(fields).length) return fail("invalid", "Check the name and email.", { fields })
  return ok({ ...db, labInstructors: db.labInstructors.map((l) => (l.id === id ? { ...l, name: merged.name.trim(), email: merged.email.trim() } : l)) }, { id })
}

export function setLabInstructorActive(db: Db, id: Id, active: boolean): Result<{ id: Id }> {
  if (!db.labInstructors.some((l) => l.id === id)) return fail("notFound", "Not found.")
  return ok({ ...db, labInstructors: db.labInstructors.map((l) => (l.id === id ? { ...l, active } : l)) }, { id })
}

/**
 * SL-09, F-13: a student named someone not on the roster. Adopting adds them to the roster (or merges into an
 * existing entry with the same email) so one person never accumulates as several spellings. Submissions and links
 * point at the roster entry from now on; Evaluations are never rewritten (RV-03), they keep their snapshot.
 */
export function adoptNamedLabInstructor(db: Db, namedId: Id): Result<{ labInstructorId: Id }> {
  const named = db.namedLabInstructors.find((n) => n.id === namedId)
  if (!named) return fail("notFound", "Not found.")
  if (named.adoptedAs) return ok(db, { labInstructorId: named.adoptedAs })
  const existing = db.labInstructors.find((l) => l.email.toLowerCase() === named.email.toLowerCase())
  const ids = idsFrom(db)
  const target = existing ?? { id: ids.next("lab"), name: named.name, email: named.email, active: true }
  const rewrite = <T extends { evaluator: { personId: Id; source: string } }>(x: T): T =>
    x.evaluator.personId === namedId ? { ...x, evaluator: { ...x.evaluator, personId: target.id, source: "roster" } } : x
  return ok(
    {
      ...db,
      seq: ids.seq(),
      labInstructors: existing ? db.labInstructors : [...db.labInstructors, target],
      namedLabInstructors: db.namedLabInstructors.map((n) => (n.id === namedId ? { ...n, adoptedAs: target.id } : n)),
      submissions: db.submissions.map(rewrite),
      links: db.links.map(rewrite),
    },
    { labInstructorId: target.id },
  )
}

/**
 * SL-09, S-07 T3: fold a student-typed spelling into a DIFFERENT roster entry, so one person never accumulates as
 * several spellings. Same effect as adoptNamedLabInstructor: open submissions and links point at the roster entry from
 * now on, and completed Evaluations are never rewritten (RV-03). Counts follow the adoption link
 * (see rosterEvaluationCount).
 */
export function mergeNamedLabInstructor(db: Db, namedId: Id, targetId: Id): Result<{ labInstructorId: Id; requests: number }> {
  const named = db.namedLabInstructors.find((n) => n.id === namedId)
  const target = db.labInstructors.find((l) => l.id === targetId)
  if (!named || !target) return fail("notFound", "Not found.")
  const requests = db.submissions.filter((x) => x.evaluator.personId === namedId && ["draft", "awaitingEvaluator", "returned"].includes(x.lifecycle)).length
  const rewrite = <T extends { evaluator: { personId: Id; source: string } }>(x: T): T =>
    x.evaluator.personId === namedId ? { ...x, evaluator: { ...x.evaluator, personId: target.id, source: "roster" } } : x
  return ok(
    {
      ...db,
      namedLabInstructors: db.namedLabInstructors.map((n) => (n.id === namedId ? { ...n, adoptedAs: target.id } : n)),
      submissions: db.submissions.map(rewrite),
      links: db.links.map(rewrite),
    },
    { labInstructorId: target.id, requests },
  )
}
