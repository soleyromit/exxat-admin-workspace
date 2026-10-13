// S-09 validation view model (P-02): engine issues and SC-13 field errors become messages, a section and a focus target.
// All copy comes from lib/copy (docs/ux/09 plus "Strings added during build").
import * as C from "@/lib/copy"
import type { DraftValidation } from "@/lib/store"
import type { SkillConfigDraft } from "@/lib/store"
import type { Issue } from "@/lib/engine"
import type { Role } from "@/lib/domain/types"
import type { ClinicalSetting } from "@/lib/domain/types"

const v = C.surface.s09.validation



export type SectionKey = "skill" | "model" | "rule" | "criteria" | "student" | "evaluator" | "workflow" | "preview"
export const SECTIONS: { key: SectionKey; title: string }[] = [
  { key: "skill", title: C.surface.s09.sections[0] },
  { key: "model", title: C.surface.s09.sections[1] },
  { key: "rule", title: C.surface.s09.sections[2] },
  { key: "criteria", title: C.surface.s09.sections[3] },
  { key: "student", title: C.surface.s09.sections[4] },
  { key: "evaluator", title: C.surface.s09.sections[5] },
  { key: "workflow", title: C.surface.s09.sections[6] },
  { key: "preview", title: C.surface.s09.sections[7] },
]
const SECTION_ORDER = Object.fromEntries(SECTIONS.map((s, i) => [s.key, i])) as Record<SectionKey, number>

export interface FormIssue {
  /** Stable key for React and tests. */
  key: string
  path: string
  section: SectionKey
  message: string
  severity: "error" | "warning"
  /** DOM id to focus when the admin follows the summary link or a Save is blocked. */
  target: string
  /** Engine code, for tests and analytics-free debugging. */
  code: string
}

export interface IssueContext {
  cfg: SkillConfigDraft
  roles: Role[]
  settings: ClinicalSetting[]
  name: string
  roleEvidenceMap: Record<string, { clinical: boolean; lab: boolean }>
}

const sectionOfPath = (path: string): SectionKey => {
  if (path === "name") return "skill"
  if (path === "model" || path.startsWith("model.labels") || path.startsWith("model.questions") || path.startsWith("model.levels") || path.startsWith("model.scale")) return "model"
  if (path.startsWith("model.rule") || path.startsWith("model.qualifyingLabelId")) return "rule"
  if (path.startsWith("criteria")) return "criteria"
  if (path.startsWith("submissionFields")) return "student"
  if (path.startsWith("allowedRoles")) return "evaluator"
  return "skill"
}

export const fid = (path: string): string => `cfg-${path.replace(/[^a-zA-Z0-9]+/g, "-").replace(/-$/, "")}`

function firstDuplicateIndex(texts: string[], i: number): number {
  const key = texts[i].trim().toLowerCase()
  return texts.findIndex((t) => t.trim().toLowerCase() === key)
}

function describe(issue: Issue, ctx: IssueContext): Pick<FormIssue, "message" | "target"> {
  const m = ctx.cfg.model
  const segs = issue.path.split(".")
  const idx = Number(segs[2])
  switch (issue.code) {
    case "noModel":
      return { message: v.noModel, target: "cfg-model-binary" }
    case "binaryLabelEmpty":
      return { message: C.configureExtra.labelRequired(segs[2] === "a" ? "The first outcome label" : "The second outcome label"), target: `cfg-label-${segs[2]}` }
    case "binaryLabelsEqual":
      return { message: v.binaryEqual, target: "cfg-label-b" }
    case "binaryQualifyingMissing":
      return { message: C.configureExtra.binaryQualifyingMissing, target: "cfg-qualifying-a" }
    case "questionsEmpty":
      return { message: C.configureExtra.questionsEmpty, target: "cfg-add-question" }
    case "questionIdDuplicate":
    case "questionTextEmpty":
      return { message: v.questionEmpty(idx + 1), target: `cfg-question-${idx}` }
    case "questionTextDuplicate": {
      const texts = m && (m.kind === "question" || m.kind === "scored") ? m.questions.map((q) => q.text) : []
      return { message: v.questionDuplicate(idx + 1, firstDuplicateIndex(texts, idx) + 1), target: `cfg-question-${idx}` }
    }
    case "atLeastInvalid": {
      const total = m?.kind === "question" ? m.questions.length : 0
      const n = m?.kind === "question" && m.rule.kind === "atLeast" ? m.rule.n : 0
      return { message: n > total && total > 0 ? v.atLeastTooHigh(n, total) : C.configureExtra.atLeastRange(total), target: "cfg-rule-n" }
    }
    case "subsetEmpty":
      return { message: v.subsetEmpty, target: "cfg-rule-subset" }
    case "subsetUnknownQuestion":
      return { message: C.configureExtra.subsetUnknown, target: "cfg-rule-subset" }
    case "scaleInvalid":
      return { message: C.configureExtra.scaleInvalid, target: "cfg-scale-min" }
    case "scoredThresholdOutOfScale": {
      const s = m?.kind === "scored" ? m.scale : null
      const n = m?.kind === "scored" ? Math.max(m.questions.length, 1) : 1
      const total = m?.kind === "scored" && m.rule.kind === "total"
      return { message: s ? C.configureExtra.thresholdOutOfScale(total ? s.min * n : s.min, total ? s.max * n : s.max) : C.configureExtra.scaleInvalid, target: "cfg-rule-min" }
    }
    case "levelsEmpty":
      return { message: C.configureExtra.levelsEmpty, target: "cfg-add-level" }
    case "levelIdDuplicate":
    case "levelLabelEmpty":
      return { message: v.levelEmpty(idx + 1), target: `cfg-level-${idx}` }
    case "levelLabelDuplicate": {
      const label = m?.kind === "demonstration" ? m.levels[idx]?.label ?? "" : ""
      return { message: v.levelDuplicate(label.trim()), target: `cfg-level-${idx}` }
    }
    case "requiredCountInvalid":
      return { message: C.configureExtra.requiredCount, target: "cfg-required-count" }
    case "levelMinimumInvalid":
      return { message: C.configureExtra.levelMinInvalid, target: `cfg-levelmin-${segs[2]}` }
    case "levelMinimumUnknownLevel":
      return { message: C.configureExtra.levelMinUnknown, target: "cfg-required-count" }
    case "levelMinimumsOnNonDemonstration":
      return { message: C.configureExtra.levelMinUnknown, target: "cfg-required-count" }
    case "levelMinimumsExceedTotal": {
      const sum = Object.values(ctx.cfg.criteria.levelMinimums).reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0)
      return { message: v.levelMinimumsTooHigh(sum, ctx.cfg.criteria.requiredCount ?? 0), target: "cfg-required-count" }
    }
    case "settingMinimumInvalid":
      return { message: C.configureExtra.settingMinInvalid, target: `cfg-setmin-${segs[2]}` }
    case "settingMinimumExceedsTotal": {
      const name = ctx.settings.find((s) => s.id === segs[2])?.name ?? "this setting"
      return { message: C.configureExtra.settingMinTooHigh(name, ctx.cfg.criteria.settingMinimums[segs[2]] ?? 0, ctx.cfg.criteria.requiredCount ?? 0), target: `cfg-setmin-${segs[2]}` }
    }
    case "settingMinimumsSumExceedTotal": {
      const sum = Object.values(ctx.cfg.criteria.settingMinimums).reduce((a, b) => a + b, 0)
      return { message: C.configureExtra.settingsSumWarning(sum, ctx.cfg.criteria.requiredCount ?? 0), target: "cfg-setting-picker" }
    }
    case "noAllowedRoles":
      return { message: v.noRole, target: "cfg-allowedRoles" }
    case "clinicalMinimumNoClinicalRole": {
      const names = (issue.clinicalRoles ?? []).map((r) => ctx.roles.find((x) => x.id === r)?.label ?? r)
      return { message: v.clinicalMinimumNoRole(names), target: "cfg-allowedRoles" }
    }
    default:
      return { message: v.noModel, target: "cfg-model-binary" }
  }
}

const FIELD_MESSAGES: Record<string, string> = {
  labelEmpty: C.configureExtra.fieldLabelRequired,
  labelDuplicate: C.configureExtra.fieldLabelDuplicate,
  optionsEmpty: C.configureExtra.fieldOptionsEmpty,
  optionDuplicate: C.configureExtra.fieldOptionDuplicate,
}

/**
 * Every problem in the draft, in page order. `modelOptional` is true while no model is chosen: a skill may exist
 * unconfigured (SC-01), so the missing model alone does not block saving the definition.
 */
export function describeIssues(validation: DraftValidation, ctx: IssueContext): FormIssue[] {
  const out: FormIssue[] = []
  if (!ctx.name.trim()) out.push({ key: "name", path: "name", section: "skill", message: C.configureExtra.nameRequired, severity: "error", target: "cfg-name", code: "nameRequired" })
  validation.issues.forEach((i, n) => {
    const d = describe(i, ctx)
    out.push({ key: `${i.code}:${i.path}:${n}`, path: i.path, section: sectionOfPath(i.path), severity: i.severity, code: i.code, ...d })
  })
  for (const [path, code] of Object.entries(validation.fieldErrors)) {
    const [, idx, what] = path.split(".")
    out.push({ key: `field:${path}`, path, section: "student", message: FIELD_MESSAGES[code], severity: "error", code, target: `cfg-field-${idx}-${what}` })
  }
  return out.sort((a, b) => SECTION_ORDER[a.section] - SECTION_ORDER[b.section])
}

