// Rule edits: renames (AE-06), removal cascade (AE-07), model change rebuild (SC-09).
// All functions are pure: they return new objects and never touch evidence.
import type { ConfiguredSkill, Criteria, ModelConfig, ModelKind, SkillConfig } from "./types"

/** The explicit empty state of a model. Nothing is defaulted (SC-02); labels are suggestions only in the UI. */
export function emptyModel(kind: ModelKind): ModelConfig {
  switch (kind) {
    case "binary":
      return { kind, labels: { a: { id: "a", label: "" }, b: { id: "b", label: "" } }, qualifyingLabelId: null }
    case "question":
      return { kind, questions: [], rule: { kind: "all" } }
    case "scored":
      return { kind, questions: [], scale: null, rule: { kind: "average", min: 0 } }
    case "demonstration":
      return { kind, levels: [] }
  }
}

// ---- AE-06 renames change presentation text only
export function renameQuestion(skill: ConfiguredSkill, questionId: string, text: string): ConfiguredSkill {
  const m = skill.model
  if (m.kind !== "question" && m.kind !== "scored") return skill
  return { ...skill, model: { ...m, questions: m.questions.map((q) => (q.id === questionId ? { ...q, text } : q)) } as ModelConfig }
}

export function renameLevel(skill: ConfiguredSkill, levelId: string, label: string): ConfiguredSkill {
  const m = skill.model
  if (m.kind !== "demonstration") return skill
  return { ...skill, model: { ...m, levels: m.levels.map((l) => (l.id === levelId ? { ...l, label } : l)) } }
}

export function renameBinaryLabel(skill: ConfiguredSkill, id: "a" | "b", label: string): ConfiguredSkill {
  const m = skill.model
  if (m.kind !== "binary") return skill
  return { ...skill, model: { ...m, labels: { ...m.labels, [id]: { ...m.labels[id], label } } } }
}

// ---- AE-07 removal cascades into every rule that referenced the item
export interface Removal {
  skill: ConfiguredSkill
  /** Number of rules that referenced the removed item ("Removed from n rules"). */
  removedFromRules: number
}

export function removeQuestion(skill: ConfiguredSkill, questionId: string): Removal {
  const m = skill.model
  if (m.kind !== "question" && m.kind !== "scored") return { skill, removedFromRules: 0 }
  const questions = m.questions.filter((q) => q.id !== questionId)
  if (m.kind === "question" && m.rule.kind === "subset" && m.rule.questionIds.includes(questionId)) {
    const rule = { kind: "subset" as const, questionIds: m.rule.questionIds.filter((id) => id !== questionId) }
    return { skill: { ...skill, model: { ...m, questions, rule } }, removedFromRules: 1 }
  }
  return { skill: { ...skill, model: { ...m, questions } as ModelConfig }, removedFromRules: 0 }
}

export function removeLevel(skill: ConfiguredSkill, levelId: string): Removal {
  const m = skill.model
  if (m.kind !== "demonstration") return { skill, removedFromRules: 0 }
  const had = levelId in skill.criteria.levelMinimums
  const { [levelId]: _removed, ...levelMinimums } = skill.criteria.levelMinimums
  void _removed
  return {
    skill: { ...skill, model: { ...m, levels: m.levels.filter((l) => l.id !== levelId) }, criteria: { ...skill.criteria, levelMinimums } },
    removedFromRules: had ? 1 : 0,
  }
}

// ---- SC-09 model change
export type DroppedField =
  | "labels"
  | "questions"
  | "qualificationRule"
  | "scale"
  | "levels"
  | "requiredCount"
  | "levelMinimums"
  | "settingMinimums"

export interface Dropped {
  field: DroppedField
  count: number
}
export interface RebuildOptions {
  /**
   * SEAM (docs/ux/08 vs docs/ux/09 disagree on whether these survive a model change; REQ SC-09 is silent).
   * Default is ENG-9 "rebuild to the new model's empty state": nothing preserved.
   */
  preserve?: { requiredCount?: boolean; settingMinimums?: boolean }
}

export function rebuildForModel(
  skill: SkillConfig,
  kind: ModelKind,
  opts: RebuildOptions = {},
): { skill: SkillConfig; dropped: Dropped[] } {
  if (skill.model?.kind === kind) return { skill, dropped: [] }

  const dropped: Dropped[] = []
  const old = skill.model
  if (old) {
    if (old.kind === "binary" && (old.labels.a.label || old.labels.b.label || old.qualifyingLabelId !== null)) {
      dropped.push({ field: "labels", count: [old.labels.a.label, old.labels.b.label].filter(Boolean).length })
    }
    if (old.kind === "question" || old.kind === "scored") {
      if (old.questions.length) dropped.push({ field: "questions", count: old.questions.length })
      if (old.questions.length) dropped.push({ field: "qualificationRule", count: 1 })
    }
    if (old.kind === "scored" && old.scale) dropped.push({ field: "scale", count: 1 })
    if (old.kind === "demonstration" && old.levels.length) dropped.push({ field: "levels", count: old.levels.length })
  }

  const keepCount = !!opts.preserve?.requiredCount && skill.criteria.requiredCount !== null
  const keepSettings = !!opts.preserve?.settingMinimums
  const criteria: Criteria = {
    requiredCount: keepCount ? skill.criteria.requiredCount : null,
    levelMinimums: {}, // never carried into another model: no contradictory settings
    settingMinimums: keepSettings ? { ...skill.criteria.settingMinimums } : {},
  }
  if (!keepCount && skill.criteria.requiredCount !== null) dropped.push({ field: "requiredCount", count: 1 })
  const lm = Object.keys(skill.criteria.levelMinimums).length
  if (lm) dropped.push({ field: "levelMinimums", count: lm })
  const sm = Object.keys(skill.criteria.settingMinimums).length
  if (!keepSettings && sm) dropped.push({ field: "settingMinimums", count: sm })

  return { skill: { ...skill, model: emptyModel(kind), criteria }, dropped }
}
