import { defaultConfig, rebuildForModel } from "./config"
import { mapBlockReason } from "./coverage"
import { validateDraft, type RuleIssue } from "./rules"
import { STARTER_BY_SPECIALTY } from "./starter-libraries"
import { appendAudit } from "./store"
import { evalsOfSkill } from "./evidence-index"
import type { Course, EvalModel, ImportBatch, MappingRow, Skill, SkillConfig, SkillDraft, Specialty, V2State } from "./types"

/** Pure Stage 1 transitions for the administrator screens. Each returns a new state and never mutates its input. */
export type Result<T = object> = ({ ok: true; state: V2State } & T) | { ok: false; error: string; issues?: RuleIssue[] }

const norm = (t: string) => t.trim().toLowerCase().replace(/\s+/g, " ")

export interface NewSkill {
  name: string
  category: string
  description: string
}

function addBatch(s: V2State, kind: ImportBatch["kind"], label: string, specialty: Specialty, rows: NewSkill[], actorId: string, at: string): { state: V2State; batch: ImportBatch } {
  const n = s.batches.length + 1
  const batchId = `bt-${n}`
  const skills: Skill[] = rows.map((r, i) => ({
    id: `sk-${batchId}-${i + 1}`,
    specialty,
    name: r.name.trim(),
    category: r.category.trim() || "No category",
    description: r.description.trim() || undefined,
    // Created unconfigured: no model and no criteria until the program configures the skill (IM-09, SC-01, SC-02).
    model: null,
    configured: false,
    published: false,
    config: null,
    batchId,
  }))
  const batch: ImportBatch = { id: batchId, at, actorId, kind, label, skillIds: skills.map((k) => k.id) }
  const next = { ...s, skills: [...s.skills, ...skills], batches: [...s.batches, batch] }
  return { state: next, batch }
}

/** Names that would clash with another skill in the library, ignoring case and spacing. */
function clash(s: V2State, name: string, exceptId?: string): boolean {
  const k = norm(name)
  return s.skills.some((x) => x.id !== exceptId && norm(x.name) === k)
}

export function copyStarterSkills(s: V2State, specialty: Specialty, indexes: number[], actorId: string, at: string): Result<{ created: number; batchId: string }> {
  const lib = STARTER_BY_SPECIALTY[specialty]
  const rows = [...new Set(indexes)].filter((i) => lib.skills[i]).map((i) => lib.skills[i])
  if (rows.length === 0) return { ok: false, error: "Tick at least one skill to copy." }
  const { state, batch } = addBatch(s, "starter-library", `${lib.label} starter library`, specialty, rows, actorId, at)
  return { ok: true, state: appendAudit(state, actorId, `Copied ${rows.length} ${rows.length === 1 ? "skill" : "skills"} from the starter library`, lib.label, at), created: rows.length, batchId: batch.id }
}

export function createImportedSkills(s: V2State, rows: NewSkill[], sourceName: string, actorId: string, at: string): Result<{ created: number; batchId: string }> {
  const clean = rows.filter((r) => r.name.trim())
  if (clean.length === 0) return { ok: false, error: "Accept at least one proposed skill before creating." }
  const names = clean.map((r) => norm(r.name))
  if (new Set(names).size !== names.length) return { ok: false, error: "Two accepted skills have the same name. Rename one of them." }
  const { state, batch } = addBatch(s, "file-import", `Import from ${sourceName}`, "bsn-med-surg", clean, actorId, at)
  return { ok: true, state: appendAudit(state, actorId, `Imported ${clean.length} ${clean.length === 1 ? "skill" : "skills"}`, sourceName, at), created: clean.length, batchId: batch.id }
}

export function updateSkillMeta(s: V2State, skillId: string, meta: NewSkill, actorId: string, at: string): Result {
  const skill = s.skills.find((k) => k.id === skillId)
  if (!skill) return { ok: false, error: "That skill is no longer in the library. Close this window and try again." }
  const name = meta.name.trim()
  if (!name) return { ok: false, error: "Enter a name for the skill." }
  if (clash(s, name, skillId)) return { ok: false, error: `Another skill is already called ${name}. Use a different name.` }
  const skills = s.skills.map((k) => (k.id === skillId ? { ...k, name, category: meta.category.trim() || "No category", description: meta.description.trim() || undefined } : k))
  return { ok: true, state: appendAudit({ ...s, skills }, actorId, "Edited skill", name, at) }
}

/** The draft the wizard starts from: the saved draft, else the skill's saved configuration, else defaults with NO model chosen (SC-02: the admin chooses explicitly). */
export function draftFor(s: V2State, skillId: string): SkillDraft {
  const saved = s.drafts[skillId]
  if (saved) return saved
  const skill = s.skills.find((k) => k.id === skillId)
  if (skill?.config && skill.model) return { model: skill.model, config: structuredClone(skill.config), step: 1 }
  return { model: null, config: defaultConfig(), step: 1 }
}

/** Live draft edits are saved without an audit entry (a draft is not a decision). Saving a step and publishing are audited. */
export function setDraft(s: V2State, skillId: string, draft: SkillDraft): V2State {
  return { ...s, drafts: { ...s.drafts, [skillId]: draft } }
}

export function chooseModel(draft: SkillDraft, model: EvalModel): SkillDraft {
  return { ...draft, model, config: rebuildForModel(draft.config, model) }
}

export function copyConfigFrom(s: V2State, skillId: string, sourceId: string, actorId: string, at: string): Result {
  const src = s.skills.find((k) => k.id === sourceId)
  if (!src?.config || !src.model) return { ok: false, error: "That skill has no configuration to copy. Choose a configured skill." }
  const cur = draftFor(s, skillId)
  const config: SkillConfig = structuredClone(src.config)
  config.prerequisites.skillIds = config.prerequisites.skillIds.filter((id) => id !== skillId)
  const draft: SkillDraft = { ...cur, model: src.model, config, copiedFromSkillId: sourceId }
  const skill = s.skills.find((k) => k.id === skillId)
  return { ok: true, state: appendAudit(setDraft(s, skillId, draft), actorId, `Copied configuration from ${src.name}`, skill?.name ?? skillId, at) }
}

export function saveStep(s: V2State, skillId: string, step: number, actorId: string, at: string): V2State {
  const skill = s.skills.find((k) => k.id === skillId)
  const d = draftFor(s, skillId)
  return appendAudit(setDraft(s, skillId, { ...d, step }), actorId, `Saved configuration draft, step ${Math.min(step, 7)}`, skill?.name ?? skillId, at)
}

/** Puts a skill in use with its drafted rules (SC-19). Refuses while any issue remains. Completed evaluations are not touched. */
export function publishSkill(s: V2State, skillId: string, actorId: string, at: string): Result {
  const skill = s.skills.find((k) => k.id === skillId)
  if (!skill) return { ok: false, error: "That skill is no longer in the library." }
  const d = draftFor(s, skillId)
  const issues = validateDraft(d, s, skillId)
  if (issues.length > 0 || !d.model) {
    return { ok: false, error: `Fix ${issues.length} ${issues.length === 1 ? "problem" : "problems"} before publishing.`, issues }
  }
  const wasPublished = skill.published
  const skills = s.skills.map((k) => (k.id === skillId ? { ...k, model: d.model, config: structuredClone(d.config), configured: true, published: true } : k))
  const drafts = { ...s.drafts }
  delete drafts[skillId]
  return { ok: true, state: appendAudit({ ...s, skills, drafts }, actorId, wasPublished ? "Published changes to skill" : "Published skill", skill.name, at) }
}

export const LEVEL_LABEL: Record<MappingRow["level"], string> = { mandatory: "Mandatory", recommended: "Recommended", optional: "Optional", "not-expected": "Not expected" }

/** Maps a skill to the course at a level, or removes the mapping when `level` is null (CM-03, CM-06). Unconfigured skills are refused (IM-09). */
export function setMapping(s: V2State, skillId: string, level: MappingRow["level"] | null, actorId: string, at: string): Result {
  const skill = s.skills.find((k) => k.id === skillId)
  if (!skill) return { ok: false, error: "That skill is no longer in the library." }
  const courseId = s.course.id
  const rest = s.mappings.filter((m) => !(m.courseId === courseId && m.skillId === skillId))
  if (level === null) {
    return { ok: true, state: appendAudit({ ...s, mappings: rest }, actorId, "Removed mapping", `${skill.name} from ${s.course.code}`, at) }
  }
  const blocked = mapBlockReason(skill)
  if (blocked) return { ok: false, error: blocked }
  const existing = s.mappings.find((m) => m.courseId === courseId && m.skillId === skillId)
  const mappings = existing ? s.mappings.map((m) => (m === existing ? { ...m, level } : m)) : [...rest, { courseId, skillId, level }]
  return { ok: true, state: appendAudit({ ...s, mappings }, actorId, `Mapped skill as ${LEVEL_LABEL[level].toLowerCase()}`, `${skill.name} in ${s.course.code}`, at) }
}

// ---------------------------------------------------------------------------------------------------------------------
// Skill lifecycle: deactivate, reactivate, delete (REQ SL-02, SL-11; CALL 10-09; decisions D-X14, D-X15)

/** Every course the program runs (the focus course first when the generator has no course list). */
export function allCourses(s: V2State): Course[] {
  return s.courses ?? [s.course, ...(s.otherCourses ?? [])]
}

/** "NURS 350 Adult Health II": how a course is named in an impact list. */
export const courseLabel = (c: Pick<Course, "code" | "name">): string => `${c.code} ${c.name}`

/** Courses a skill is mapped to (mandatory or non-mandatory), as labels, sorted. Delete lists these as impact (D-X15). */
export function mappedCourses(s: V2State, skillId: string): string[] {
  const ids = new Set(s.mappings.filter((m) => m.skillId === skillId && m.level !== "not-expected").map((m) => m.courseId))
  return allCourses(s).filter((c) => ids.has(c.id)).map(courseLabel).sort()
}

export interface Tracked {
  /** Evaluations recorded against the skill, any status (the library's evidence column). */
  evaluations: number
  /** Requests, practice log entries and lab check-offs that name the skill. */
  other: number
  total: number
}

/**
 * What has been tracked against a skill. The call: "as soon as there is data ... prevent them from deleting", so delete needs
 * `total === 0` (decision D-X15). A course mapping is not data: it is listed as impact and removed with the skill.
 */
export function trackedAgainst(s: V2State, skillId: string): Tracked {
  const evaluations = evalsOfSkill(s, skillId).length
  const other =
    s.submissions.filter((x) => x.skillIds.includes(skillId)).length +
    s.logEntries.filter((x) => x.skillId === skillId).length +
    s.labCheckoffs.filter((x) => x.skillId === skillId).length
  return { evaluations, other, total: evaluations + other }
}

/** Why a skill cannot be deleted, in words, or null. */
export function deleteBlockOf(t: Tracked): string | null {
  if (t.evaluations > 0) return `${t.evaluations.toLocaleString("en-US")} ${t.evaluations === 1 ? "evaluation is" : "evaluations are"} recorded against it`
  if (t.other > 0) return `${t.other.toLocaleString("en-US")} ${t.other === 1 ? "request or log entry names" : "requests or log entries name"} it`
  return null
}

/**
 * Deactivates (`active` false) or reactivates skills in the shared store, so every report figure (dashboard, attainment, director,
 * drills, facts) reads the same flag through `population.isReportable` (decision D-X14). Evidence and mappings are kept, so
 * reactivating restores every figure exactly. Unknown ids are ignored; the state is returned unchanged when no flag changes.
 */
export function setSkillsActive(s: V2State, ids: readonly string[], active: boolean, actorId: string, at: string): Result<{ changed: string[] }> {
  const want = new Set(ids)
  const changed = s.skills.filter((k) => want.has(k.id) && (k.active !== false) !== active).map((k) => k.id)
  if (changed.length === 0) return { ok: true, state: s, changed }
  const hit = new Set(changed)
  const skills = s.skills.map((k): Skill => {
    if (!hit.has(k.id)) return k
    if (!active) return { ...k, active: false }
    const rest = { ...k }
    delete rest.active
    return rest
  })
  const label = changed.length === 1 ? (s.skills.find((k) => k.id === changed[0])?.name ?? "A skill") : `${changed.length} skills`
  return { ok: true, state: appendAudit({ ...s, skills }, actorId, active ? "Reactivated skill" : "Deactivated skill", label, at), changed }
}

/** Deletes a skill nothing has been tracked against; its course mappings and any draft go with it (decision D-X15). */
export function deleteSkill(s: V2State, skillId: string, actorId: string, at: string): Result<{ unmapped: string[] }> {
  const skill = s.skills.find((k) => k.id === skillId)
  if (!skill) return { ok: false, error: "That skill is no longer in the library." }
  const block = deleteBlockOf(trackedAgainst(s, skillId))
  if (block) return { ok: false, error: `${skill.name} cannot be deleted: ${block}. Deactivate it instead.` }
  const unmapped = mappedCourses(s, skillId)
  const drafts = { ...s.drafts }
  delete drafts[skillId]
  const next: V2State = { ...s, skills: s.skills.filter((k) => k.id !== skillId), mappings: s.mappings.filter((m) => m.skillId !== skillId), drafts }
  return { ok: true, state: appendAudit(next, actorId, "Deleted skill", unmapped.length ? `${skill.name}, unmapped from ${unmapped.join(", ")}` : skill.name, at), unmapped }
}
