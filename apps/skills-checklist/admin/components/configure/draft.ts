// S-09 draft model: pure helpers the form builds on. No React, no I/O. The engine and the store actions own the rules;
// this file only edits the draft and derives what the form needs to show.
import type { Db, Id, Skill } from "@/lib/domain/types"
import type { Criteria, ModelConfig, ModelKind } from "@/lib/engine"
import { removeLevel, removeQuestion, type ConfiguredSkill } from "@/lib/engine"
import type { SkillConfigDraft } from "@/lib/store"
import { draftOf } from "@/lib/store"

/** Identity fields that live in the library actions, not in the configuration draft (SL-02..SL-06). */
export interface DefinitionDraft {
  name: string
  description: string
  categoryId: Id | null
  tagIds: Id[]
  active: boolean
}

export interface FormDraft {
  def: DefinitionDraft
  cfg: SkillConfigDraft
}

export const emptyCriteria = (): Criteria => ({ requiredCount: null, levelMinimums: {}, settingMinimums: {} })

/** A brand-new skill: nothing chosen, no default model (SC-02). */
export function blankDraft(): FormDraft {
  return {
    def: { name: "", description: "", categoryId: null, tagIds: [], active: true },
    cfg: {
      model: null,
      criteria: emptyCriteria(),
      requiresApproval: false,
      allowedRoles: [],
      submissionFields: [],
      evaluatorComment: "optional",
      selfEvaluation: false,
    },
  }
}

/**
 * What a brand-new skill starts with in the prototype's wizard (P-08, captures 55/56): all three evaluator roles allowed, and two
 * student fields, "Completion date" (required) and "Student notes" (optional). Applied only to a skill that has no model and has
 * never had these settings edited, so it is a starting point the admin can change, not a rule (SC-13, SC-16). No evaluation
 * model is defaulted (SC-02).
 */
export function withStarterDefaults(d: FormDraft, roleIds: Id[]): FormDraft {
  if (d.cfg.model !== null || d.cfg.allowedRoles.length > 0 || d.cfg.submissionFields.length > 0) return d
  return {
    ...d,
    cfg: {
      ...d.cfg,
      allowedRoles: roleIds,
      submissionFields: [
        { id: "fld-1", label: "Completion date", type: "date", required: true },
        { id: "fld-2", label: "Student notes", type: "longText", required: false },
      ],
    },
  }
}

export function draftFromSkill(skill: Skill): FormDraft {
  return {
    def: { name: skill.name, description: skill.description, categoryId: skill.categoryId, tagIds: skill.tagIds, active: skill.active },
    cfg: draftOf(skill),
  }
}

/** Stable JSON for dirty checks and signatures (object key order is normalised). */
export function stable(value: unknown): string {
  return JSON.stringify(value, (_k, v) => (v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b))) : v))
}

export const isDirty = (a: FormDraft, b: FormDraft): boolean => stable(a) !== stable(b)

/**
 * The part of a configuration that changes how evidence qualifies or counts. Presentation text (names, labels,
 * question text, level labels) is excluded on purpose: renaming never changes an outcome (AE-06) and so never
 * triggers the impact review (P-03 [INFER]).
 */
export function ruleSignature(cfg: SkillConfigDraft): string {
  const m = cfg.model
  const shape = !m
    ? null
    : m.kind === "binary"
      ? { kind: m.kind, qualifying: m.qualifyingLabelId }
      : m.kind === "question"
        ? { kind: m.kind, q: m.questions.map((q) => q.id), rule: m.rule }
        : m.kind === "scored"
          ? { kind: m.kind, q: m.questions.map((q) => q.id), scale: m.scale, rule: m.rule }
          : { kind: m.kind, levels: m.levels.map((l) => l.id) }
  return stable({ shape, criteria: cfg.criteria, requiresApproval: cfg.requiresApproval })
}

export const ruleChanged = (before: SkillConfigDraft, after: SkillConfigDraft): boolean => ruleSignature(before) !== ruleSignature(after)

/** True when the draft holds anything the next model would have to rebuild (drives the SC-09 confirm). */
export function hasDownstream(cfg: SkillConfigDraft): boolean {
  const m = cfg.model
  if (!m) return false
  const c = cfg.criteria
  const modelHas =
    m.kind === "binary"
      ? !!(m.labels.a.label || m.labels.b.label || m.qualifyingLabelId)
      : m.kind === "demonstration"
        ? m.levels.length > 0
        : m.questions.length > 0 || (m.kind === "scored" && !!m.scale)
  return modelHas || c.requiredCount !== null || Object.keys(c.levelMinimums).length > 0 || Object.keys(c.settingMinimums).length > 0
}

/** Unused id with a prefix: `q-1`, `q-2`, ... Local to the draft; the store never sees ids it did not receive. */
export function nextId(prefix: string, existing: Iterable<string>): string {
  const used = new Set(existing)
  let n = used.size + 1
  while (used.has(`${prefix}-${n}`)) n += 1
  return `${prefix}-${n}`
}

export const modelKindOf = (cfg: SkillConfigDraft): ModelKind | null => cfg.model?.kind ?? null

// ---------------------------------------------------------------- model edits (immutable)

const withModel = (cfg: SkillConfigDraft, model: ModelConfig): SkillConfigDraft => ({ ...cfg, model })

export function setBinaryLabel(cfg: SkillConfigDraft, which: "a" | "b", label: string): SkillConfigDraft {
  const m = cfg.model
  if (m?.kind !== "binary") return cfg
  return withModel(cfg, { ...m, labels: { ...m.labels, [which]: { ...m.labels[which], label } } })
}

export function setQualifyingLabel(cfg: SkillConfigDraft, id: "a" | "b"): SkillConfigDraft {
  const m = cfg.model
  if (m?.kind !== "binary") return cfg
  return withModel(cfg, { ...m, qualifyingLabelId: id })
}

export function addQuestion(cfg: SkillConfigDraft): SkillConfigDraft {
  const m = cfg.model
  if (m?.kind !== "question" && m?.kind !== "scored") return cfg
  const id = nextId("q", m.questions.map((q) => q.id))
  return withModel(cfg, { ...m, questions: [...m.questions, { id, text: "" }] } as ModelConfig)
}

export function setQuestionText(cfg: SkillConfigDraft, id: string, text: string): SkillConfigDraft {
  const m = cfg.model
  if (m?.kind !== "question" && m?.kind !== "scored") return cfg
  return withModel(cfg, { ...m, questions: m.questions.map((q) => (q.id === id ? { ...q, text } : q)) } as ModelConfig)
}

export interface EditResult {
  cfg: SkillConfigDraft
  /** AE-07: how many rules referenced the removed item ("Removed from n rules"). */
  removedFromRules: number
}

const asConfigured = (cfg: SkillConfigDraft): ConfiguredSkill | null =>
  cfg.model ? { id: "draft", active: true, model: cfg.model, criteria: cfg.criteria, requiresApproval: cfg.requiresApproval, allowedRoles: cfg.allowedRoles } : null

export function removeQuestionFromDraft(cfg: SkillConfigDraft, id: string): EditResult {
  const s = asConfigured(cfg)
  if (!s) return { cfg, removedFromRules: 0 }
  const r = removeQuestion(s, id)
  return { cfg: { ...cfg, model: r.skill.model, criteria: r.skill.criteria }, removedFromRules: r.removedFromRules }
}

export function addLevel(cfg: SkillConfigDraft): SkillConfigDraft {
  const m = cfg.model
  if (m?.kind !== "demonstration") return cfg
  const id = nextId("lv", m.levels.map((l) => l.id))
  return withModel(cfg, { ...m, levels: [...m.levels, { id, label: "" }] })
}

export function setLevelLabel(cfg: SkillConfigDraft, id: string, label: string): SkillConfigDraft {
  const m = cfg.model
  if (m?.kind !== "demonstration") return cfg
  return withModel(cfg, { ...m, levels: m.levels.map((l) => (l.id === id ? { ...l, label } : l)) })
}

export function removeLevelFromDraft(cfg: SkillConfigDraft, id: string): EditResult {
  const s = asConfigured(cfg)
  if (!s) return { cfg, removedFromRules: 0 }
  const r = removeLevel(s, id)
  return { cfg: { ...cfg, model: r.skill.model, criteria: r.skill.criteria }, removedFromRules: r.removedFromRules }
}

/** Reorder by index (keyboard buttons and drag both call this). Order is the order of supervision (SC-08). */
export function moveLevel(cfg: SkillConfigDraft, from: number, to: number): SkillConfigDraft {
  const m = cfg.model
  if (m?.kind !== "demonstration" || from === to || from < 0 || to < 0 || from >= m.levels.length || to >= m.levels.length) return cfg
  const levels = [...m.levels]
  const [item] = levels.splice(from, 1)
  levels.splice(to, 0, item)
  return withModel(cfg, { ...m, levels })
}

export function setCriteria(cfg: SkillConfigDraft, patch: Partial<Criteria>): SkillConfigDraft {
  return { ...cfg, criteria: { ...cfg.criteria, ...patch } }
}

/** A skill-shaped object for read-only helpers (criteria summary, lineage) that take a full Skill. */
export function draftSkill(db: Db, skillId: Id | null, d: FormDraft): Skill {
  const cur = skillId ? db.skills.find((s) => s.id === skillId) : undefined
  return {
    id: skillId ?? "new",
    name: d.def.name,
    description: d.def.description,
    categoryId: d.def.categoryId,
    tagIds: d.def.tagIds,
    active: d.def.active,
    importBatchId: cur?.importBatchId ?? null,
    createdAt: cur?.createdAt ?? "",
    ...d.cfg,
  }
}
