// S-09 configure actions (SC-01..SC-19). The save is gated by the engine validators, so an unsatisfiable
// configuration cannot be stored (SC-18) including the BL-1 check (a clinical-setting minimum needs a clinical-valid role).
import type { CommentRule, Db, Id, Skill, SubmissionField } from "@/lib/domain/types"
import {
  isConfigured,
  previewImpact,
  rebuildForModel,
  validateConfig,
  type ConfiguredSkill,
  type Criteria,
  type Dropped,
  type ImpactPreview,
  type Issue,
  type ModelConfig,
  type ModelKind,
  type RebuildOptions,
} from "@/lib/engine"
import { evidenceOf, norm, skillHasEvidence } from "../derive"
import { fail, ok, type Result } from "../result"

/** Everything the S-09 form edits in one object. Identity, category, tags and status live in the library actions. */
export interface SkillConfigDraft {
  model: ModelConfig | null
  criteria: Criteria
  requiresApproval: boolean
  allowedRoles: string[]
  submissionFields: SubmissionField[]
  evaluatorComment: CommentRule
  selfEvaluation: boolean
}

export const draftOf = (s: Skill): SkillConfigDraft => ({
  model: s.model,
  criteria: s.criteria,
  requiresApproval: s.requiresApproval,
  allowedRoles: s.allowedRoles,
  submissionFields: s.submissionFields,
  evaluatorComment: s.evaluatorComment,
  selfEvaluation: s.selfEvaluation,
})

const merge = (s: Skill, d: SkillConfigDraft): Skill => ({ ...s, ...d })

export interface DraftValidation {
  valid: boolean
  /** Engine issues (codes and paths, no copy). */
  issues: Issue[]
  /** SC-13 field problems keyed by path, e.g. `submissionFields.1.label`. */
  fieldErrors: Record<string, "labelEmpty" | "labelDuplicate" | "optionsEmpty" | "optionDuplicate">
}

/** SC-13 plus the engine's save-blocking rules. Pure and side-effect free: the form calls it on every change. */
export function validateDraft(db: Db, skillId: Id, draft: SkillConfigDraft): DraftValidation {
  const cur = db.skills.find((s) => s.id === skillId)
  const base: Skill = cur ?? ({ id: skillId, active: true } as Skill)
  const result = validateConfig({ ...base, ...draft }, { roleEvidenceMap: db.roleEvidenceMap })
  const fieldErrors: DraftValidation["fieldErrors"] = {}
  const seen = new Set<string>()
  draft.submissionFields.forEach((f, i) => {
    if (!f.label.trim()) fieldErrors[`submissionFields.${i}.label`] = "labelEmpty"
    else if (seen.has(norm(f.label))) fieldErrors[`submissionFields.${i}.label`] = "labelDuplicate"
    else seen.add(norm(f.label))
    if (f.type === "choice") {
      const opts = (f.options ?? []).map((o) => o.trim()).filter(Boolean)
      if (opts.length === 0) fieldErrors[`submissionFields.${i}.options`] = "optionsEmpty"
      else if (new Set(opts.map(norm)).size !== opts.length) fieldErrors[`submissionFields.${i}.options`] = "optionDuplicate"
    }
  })
  return { valid: result.valid && Object.keys(fieldErrors).length === 0, issues: result.issues, fieldErrors }
}

/**
 * SC-09: changing the model rebuilds the criteria instead of leaving contradictory settings in place.
 * Returns the rebuilt draft and a report of what was dropped. Held evidence is NOT touched or reinterpreted here:
 * what happens to it on a model change is an open question (cross-cutting §6), so the engine only reports.
 */
export function changeModelKind(
  db: Db,
  skillId: Id,
  draft: SkillConfigDraft,
  kind: ModelKind,
  opts: RebuildOptions = {},
): { draft: SkillConfigDraft; dropped: Dropped[] } {
  const cur = db.skills.find((s) => s.id === skillId)
  const base = { ...(cur ?? ({ id: skillId, active: true } as Skill)), ...draft }
  const { skill, dropped } = rebuildForModel(base, kind, opts)
  return { draft: { ...draft, model: skill.model, criteria: skill.criteria }, dropped }
}

/** ENG-10, AE-02: what the draft would do to existing student records, before the admin saves. */
export function previewDraftImpact(db: Db, skillId: Id, draft: SkillConfigDraft): ImpactPreview | null {
  const cur = db.skills.find((s) => s.id === skillId)
  if (!cur || !isConfigured(cur) || draft.model === null) return null
  const next = merge(cur, draft) as ConfiguredSkill
  return previewImpact(cur as ConfiguredSkill, next, evidenceOf(db), { studentIds: db.students.map((s) => s.id) })
}

export function saveSkillConfig(db: Db, skillId: Id, draft: SkillConfigDraft): Result<{ impact: ImpactPreview | null }> {
  const cur = db.skills.find((s) => s.id === skillId)
  if (!cur) return fail("notFound", "Skill not found.")
  const v = validateDraft(db, skillId, draft)
  if (!v.valid) {
    const fields: Record<string, string> = {}
    for (const i of v.issues) if (i.severity === "error") fields[i.path] = i.code
    for (const [p, code] of Object.entries(v.fieldErrors)) fields[p] = code
    return fail("invalid", "This configuration cannot be saved.", { issues: v.issues, fields })
  }
  const impact = previewDraftImpact(db, skillId, draft)
  const next = merge(cur, draft)
  return ok({ ...db, skills: db.skills.map((s) => (s.id === skillId ? next : s)) }, { impact })
}

/**
 * SC-01 (S-09, sections 5 to 7): a skill may exist unconfigured while its student fields, evaluator comment, workflow
 * toggles and allowed roles are already set. Patches ONLY those fields; it never touches the model or the criteria, so
 * it can never make a skill configured. Replaces the local mirror that lived in components/configure/actions.ts.
 */
export function patchUnconfiguredSkillSettings(db: Db, skillId: Id, cfg: SkillConfigDraft): Result<{ skillId: Id }> {
  const cur = db.skills.find((s) => s.id === skillId)
  if (!cur) return fail("notFound", "Skill not found.")
  if (cur.model !== null) return fail("notEditable", "This skill is configured. Save it as a configuration.")
  const next: Skill = {
    ...cur,
    submissionFields: cfg.submissionFields,
    evaluatorComment: cfg.evaluatorComment,
    selfEvaluation: cfg.selfEvaluation,
    requiresApproval: cfg.requiresApproval,
    allowedRoles: cfg.allowedRoles,
  }
  return ok({ ...db, skills: db.skills.map((s) => (s.id === skillId ? next : s)) }, { skillId })
}

// ------------------------------------------------------------------ IM-14: copy and apply configuration (P-05)

/** What to copy from the source skill (docs/ux/08 P-05 step 2). All on by default. */
export type ConfigPart = "model" | "submissionFields" | "evaluatorComment" | "workflow" | "allowedRoles" | "settingMinimums"
export const ALL_CONFIG_PARTS: readonly ConfigPart[] = ["model", "submissionFields", "evaluatorComment", "workflow", "allowedRoles", "settingMinimums"]

export interface CopiedSummary {
  questions: number
  levels: number
  submissionFields: number
}

export type CopyConfigResult =
  | { ok: true; draft: SkillConfigDraft; copied: CopiedSummary; /** Parts that could not apply to this target (for example setting minimums on a skill with no model). */ dropped: ConfigPart[] }
  | { ok: false; reason: "sourceNotFound" | "sourceNotConfigured" }

/**
 * Pure. The source's selected parts laid over the target's current draft, as INDEPENDENT copies: question and level
 * ids are regenerated for the target and rules and level minimums are remapped by index, so a later edit to one skill
 * never changes another (P-05 rules). The result is a draft; nothing is saved and nothing is validated here.
 */
export function copyConfigDraft(db: Db, sourceId: Id, targetId: Id, base: SkillConfigDraft, parts: readonly ConfigPart[] = ALL_CONFIG_PARTS): CopyConfigResult {
  const src = db.skills.find((s) => s.id === sourceId)
  if (!src) return { ok: false, reason: "sourceNotFound" }
  if (!isConfigured(src) || src.model === null) return { ok: false, reason: "sourceNotConfigured" }
  const want = new Set(parts)
  const draft: SkillConfigDraft = { ...base, criteria: { ...base.criteria, levelMinimums: { ...base.criteria.levelMinimums }, settingMinimums: { ...base.criteria.settingMinimums } } }
  const copied: CopiedSummary = { questions: 0, levels: 0, submissionFields: 0 }
  const dropped: ConfigPart[] = []

  if (want.has("model")) {
    const m = src.model
    let model: ModelConfig
    const levelMinimums: Record<string, number> = {}
    if (m.kind === "binary") model = { kind: "binary", labels: { a: { ...m.labels.a }, b: { ...m.labels.b } }, qualifyingLabelId: m.qualifyingLabelId }
    else if (m.kind === "demonstration") {
      const idMap = new Map<string, string>()
      const levels = m.levels.map((l, i) => {
        const id = `${targetId}-l${i + 1}`
        idMap.set(l.id, id)
        return { id, label: l.label }
      })
      model = { kind: "demonstration", levels }
      for (const [k, v] of Object.entries(src.criteria.levelMinimums)) if (idMap.has(k)) levelMinimums[idMap.get(k)!] = v
      copied.levels = levels.length
    } else {
      const idMap = new Map<string, string>()
      const questions = m.questions.map((q, i) => {
        const id = `${targetId}-q${i + 1}`
        idMap.set(q.id, id)
        return { id, text: q.text }
      })
      copied.questions = questions.length
      if (m.kind === "question") {
        const rule = m.rule.kind === "subset" ? { kind: "subset" as const, questionIds: m.rule.questionIds.map((id) => idMap.get(id)).filter((id): id is string => !!id) } : { ...m.rule }
        model = { kind: "question", questions, rule }
      } else model = { kind: "scored", questions, scale: m.scale ? { ...m.scale } : null, rule: { ...m.rule } }
    }
    draft.model = model
    draft.criteria.requiredCount = src.criteria.requiredCount
    draft.criteria.levelMinimums = levelMinimums
  }
  if (want.has("settingMinimums")) {
    if (draft.model === null) dropped.push("settingMinimums")
    else draft.criteria.settingMinimums = Object.fromEntries(Object.entries(src.criteria.settingMinimums).filter(([id]) => db.clinicalSettings.some((c) => c.id === id)))
  }
  if (want.has("submissionFields")) {
    draft.submissionFields = src.submissionFields.map((f, i) => ({ ...f, id: `${targetId}-f-${i + 1}`, options: f.options ? [...f.options] : undefined }))
    copied.submissionFields = draft.submissionFields.length
  }
  if (want.has("evaluatorComment")) draft.evaluatorComment = src.evaluatorComment
  if (want.has("workflow")) {
    draft.selfEvaluation = src.selfEvaluation
    draft.requiresApproval = src.requiresApproval
  }
  if (want.has("allowedRoles")) draft.allowedRoles = [...src.allowedRoles]
  return { ok: true, draft, copied, dropped }
}

export type ApplyStatus =
  | "applied"
  | "unchanged"
  /** The target is configured with a different model than the source; needs `confirmModelRebuild` (SC-09). */
  | "needsModelConfirmation"
  /** The target already holds evaluations and the copy would change how they qualify; needs `confirmOverwriteWithEvidence` (P-03, AE-02). */
  | "needsEvidenceConfirmation"
  /** SC-18: the result would not be a satisfiable configuration, so this target is left exactly as it was. */
  | "invalid"
  | "notFound"
  | "sameSkill"

export interface ApplyTargetResult {
  skillId: Id
  name: string
  status: ApplyStatus
  /** The target was already configured, so applying replaced something (the review dialog says "will be overwritten"). */
  overwrites: boolean
  hasEvidence: boolean
  issues?: Issue[]
  fields?: Record<string, string>
  dropped: ConfigPart[]
  copied: CopiedSummary
}

export interface ApplyReport {
  sourceId: Id
  sourceName: string
  results: ApplyTargetResult[]
  applied: number
  /** Applied targets that were already configured. */
  overwritten: number
  /** Targets left untouched (needs confirmation, invalid, unchanged, same skill, not found). */
  skipped: number
}

export interface ApplyInput {
  sourceSkillId: Id
  targetSkillIds: Id[]
  parts?: readonly ConfigPart[]
  confirmModelRebuild?: boolean
  confirmOverwriteWithEvidence?: boolean
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/**
 * IM-14: apply one configured skill's configuration to several selected skills. Each target is validated on its own
 * (SC-18): invalid targets are listed and the others proceed, so one bad target never blocks the batch. A target with a
 * different model, or one that already holds evaluations, is skipped unless the caller confirmed it. Evaluations are
 * never touched (RV-03); with evidence, qualification is re-derived from the new rule (AE-02).
 *
 * Pure and deterministic. The same call with no confirmations is the dry run behind the review step: read the report,
 * do not commit the returned db.
 */
export function applyConfiguration(db: Db, input: ApplyInput): Result<ApplyReport> {
  const src = db.skills.find((s) => s.id === input.sourceSkillId)
  if (!src) return fail("notFound", "Source skill not found.")
  if (!isConfigured(src)) return fail("skillNotUsable", "Choose a configured skill as the source.")
  const parts = input.parts ?? ALL_CONFIG_PARTS
  let cur = db
  const results: ApplyTargetResult[] = []
  for (const id of [...new Set(input.targetSkillIds)]) {
    const target = cur.skills.find((s) => s.id === id)
    const blank = (status: ApplyStatus, extra: Partial<ApplyTargetResult> = {}): ApplyTargetResult => ({ skillId: id, name: target?.name ?? id, status, overwrites: false, hasEvidence: false, dropped: [], copied: { questions: 0, levels: 0, submissionFields: 0 }, ...extra })
    if (!target) {
      results.push(blank("notFound"))
      continue
    }
    if (id === src.id) {
      results.push(blank("sameSkill"))
      continue
    }
    const base = draftOf(target)
    const c = copyConfigDraft(cur, src.id, id, base, parts)
    if (!c.ok) return fail("skillNotUsable", "Choose a configured skill as the source.")
    const overwrites = isConfigured(target)
    const hasEvidence = skillHasEvidence(cur, id)
    const common = { overwrites, hasEvidence, dropped: c.dropped, copied: c.copied }
    if (same(base, c.draft)) {
      results.push(blank("unchanged", common))
      continue
    }
    if (overwrites && parts.includes("model") && target.model!.kind !== src.model.kind && !input.confirmModelRebuild) {
      results.push(blank("needsModelConfirmation", common))
      continue
    }
    const changesQualification = !same(base.model, c.draft.model) || !same(base.criteria, c.draft.criteria) || base.requiresApproval !== c.draft.requiresApproval
    if (hasEvidence && changesQualification && !input.confirmOverwriteWithEvidence) {
      results.push(blank("needsEvidenceConfirmation", common))
      continue
    }
    const v = validateDraft(cur, id, c.draft)
    // A target that stays without a model is still unconfigured (SC-01): only its field-level rules apply, because the
    // engine's "a model must be chosen" error is expected until the model is set in S-09.
    const valid = c.draft.model === null ? Object.keys(v.fieldErrors).length === 0 : v.valid
    if (!valid) {
      const fields: Record<string, string> = {}
      for (const i of v.issues) if (i.severity === "error") fields[i.path] = i.code
      for (const [p, code] of Object.entries(v.fieldErrors)) fields[p] = code
      results.push(blank("invalid", { ...common, issues: v.issues, fields }))
      continue
    }
    cur = { ...cur, skills: cur.skills.map((s) => (s.id === id ? merge(s, c.draft) : s)) }
    results.push(blank("applied", common))
  }
  const applied = results.filter((r) => r.status === "applied")
  return ok(cur, {
    sourceId: src.id,
    sourceName: src.name,
    results,
    applied: applied.length,
    overwritten: applied.filter((r) => r.overwrites).length,
    skipped: results.length - applied.length,
  })
}

/** The dry run behind the review step (P-05 step 4). Never commits. */
export const planApplyConfiguration = (db: Db, input: ApplyInput): ApplyReport | null => {
  const r = applyConfiguration(db, input)
  return r.ok ? r.value : null
}
