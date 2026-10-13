// Save-blocking validators (SC-03, SC-05, SC-06, SC-10, SC-11, SC-16, SC-18) incl. the BL-1 check.
// Returns data (codes, paths), never UI copy. Unsatisfiable configurations must not be savable (SC-18).
import type { Criteria, RoleEvidenceMap, SkillConfig } from "./types"

export type IssueCode =
  | "noModel"
  | "binaryLabelEmpty"
  | "binaryLabelsEqual"
  | "binaryQualifyingMissing"
  | "questionsEmpty"
  | "questionIdDuplicate"
  | "questionTextEmpty"
  | "questionTextDuplicate"
  | "atLeastInvalid"
  | "subsetEmpty"
  | "subsetUnknownQuestion"
  | "scaleInvalid"
  | "scoredThresholdOutOfScale"
  | "levelsEmpty"
  | "levelIdDuplicate"
  | "levelLabelEmpty"
  | "levelLabelDuplicate"
  | "requiredCountInvalid"
  | "levelMinimumsOnNonDemonstration"
  | "levelMinimumUnknownLevel"
  | "levelMinimumInvalid"
  | "levelMinimumsExceedTotal"
  | "settingMinimumInvalid"
  | "settingMinimumExceedsTotal"
  | "settingMinimumsSumExceedTotal"
  | "noAllowedRoles"
  | "clinicalMinimumNoClinicalRole"

export interface Issue {
  code: IssueCode
  severity: "error" | "warning"
  /** Machine path to the offending control, for the summary banner links and focus (T17). */
  path: string
  /** BL-1: roles from the map that can sign off clinical evidence (T25 names them). */
  clinicalRoles?: string[]
}
export interface ValidationResult {
  valid: boolean
  issues: Issue[]
}
export interface ValidationContext {
  /** OD-25 is OPEN: supplied as data. The engine never hardcodes which roles are valid. */
  roleEvidenceMap: RoleEvidenceMap
}

const norm = (s: string) => s.trim().toLowerCase()
const posInt = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n) && n >= 1

export function validateConfig(skill: SkillConfig, ctx: ValidationContext): ValidationResult {
  const issues: Issue[] = []
  const err = (code: IssueCode, path: string, extra: Partial<Issue> = {}) => issues.push({ code, severity: "error", path, ...extra })
  const warn = (code: IssueCode, path: string) => issues.push({ code, severity: "warning", path })

  const m = skill.model
  if (!m) {
    err("noModel", "model")
    return { valid: false, issues }
  }

  // ---- model-specific
  if (m.kind === "binary") {
    const [a, b] = [m.labels.a.label, m.labels.b.label]
    if (!a.trim()) err("binaryLabelEmpty", "model.labels.a")
    if (!b.trim()) err("binaryLabelEmpty", "model.labels.b")
    if (a.trim() && b.trim() && norm(a) === norm(b)) err("binaryLabelsEqual", "model.labels")
    if (m.qualifyingLabelId === null) err("binaryQualifyingMissing", "model.qualifyingLabelId")
  }

  if (m.kind === "question" || m.kind === "scored") {
    const qs = m.questions
    if (qs.length === 0) err("questionsEmpty", "model.questions")
    const ids = new Set<string>()
    const texts = new Set<string>()
    qs.forEach((q, i) => {
      if (ids.has(q.id)) err("questionIdDuplicate", `model.questions.${i}`)
      ids.add(q.id)
      if (!q.text.trim()) err("questionTextEmpty", `model.questions.${i}`)
      else if (texts.has(norm(q.text))) err("questionTextDuplicate", `model.questions.${i}`)
      else texts.add(norm(q.text))
    })

    if (m.kind === "question") {
      const r = m.rule
      if (r.kind === "atLeast" && (!posInt(r.n) || r.n > qs.length)) err("atLeastInvalid", "model.rule")
      if (r.kind === "subset") {
        if (r.questionIds.length === 0) err("subsetEmpty", "model.rule")
        if (r.questionIds.some((id) => !ids.has(id))) err("subsetUnknownQuestion", "model.rule")
      }
    } else {
      const s = m.scale
      const scaleOk = !!s && [s.min, s.max, s.step].every(Number.isFinite) && s.min < s.max && s.step > 0
      if (!scaleOk) err("scaleInvalid", "model.scale")
      else if (s) {
        const n = Math.max(qs.length, 1)
        const [lo, hi] = m.rule.kind === "total" ? [s.min * n, s.max * n] : [s.min, s.max]
        if (!Number.isFinite(m.rule.min) || m.rule.min < lo || m.rule.min > hi) err("scoredThresholdOutOfScale", "model.rule")
      }
    }
  }

  if (m.kind === "demonstration") {
    if (m.levels.length === 0) err("levelsEmpty", "model.levels")
    const ids = new Set<string>()
    const labels = new Set<string>()
    m.levels.forEach((l, i) => {
      if (ids.has(l.id)) err("levelIdDuplicate", `model.levels.${i}`)
      ids.add(l.id)
      if (!l.label.trim()) err("levelLabelEmpty", `model.levels.${i}`)
      else if (labels.has(norm(l.label))) err("levelLabelDuplicate", `model.levels.${i}`)
      else labels.add(norm(l.label))
    })
  }

  // ---- criteria
  const c: Criteria = skill.criteria
  const total = c.requiredCount
  const totalOk = posInt(total)
  if (!totalOk) err("requiredCountInvalid", "criteria.requiredCount")

  const levelEntries = Object.entries(c.levelMinimums)
  if (m.kind !== "demonstration") {
    if (levelEntries.length > 0) err("levelMinimumsOnNonDemonstration", "criteria.levelMinimums")
  } else {
    const known = new Set(m.levels.map((l) => l.id))
    let sum = 0
    for (const [id, n] of levelEntries) {
      if (!known.has(id)) err("levelMinimumUnknownLevel", `criteria.levelMinimums.${id}`)
      if (!Number.isInteger(n) || n < 0) err("levelMinimumInvalid", `criteria.levelMinimums.${id}`)
      else sum += n
    }
    if (totalOk && sum > (total as number)) err("levelMinimumsExceedTotal", "criteria.levelMinimums")
  }

  const settingEntries = Object.entries(c.settingMinimums)
  let settingSum = 0
  for (const [id, n] of settingEntries) {
    if (!posInt(n)) err("settingMinimumInvalid", `criteria.settingMinimums.${id}`)
    else {
      settingSum += n
      if (totalOk && n > (total as number)) err("settingMinimumExceedsTotal", `criteria.settingMinimums.${id}`)
    }
  }
  // [INFER] a sum above the total is still satisfiable by collecting more evidence: warn, do not block.
  if (totalOk && settingEntries.length > 1 && settingSum > (total as number) && settingEntries.every(([, n]) => posInt(n) && n <= (total as number))) {
    warn("settingMinimumsSumExceedTotal", "criteria.settingMinimums")
  }

  // ---- roles (SC-16) and BL-1
  if (skill.allowedRoles.length === 0) err("noAllowedRoles", "allowedRoles")
  const hasClinicalMinimum = settingEntries.some(([, n]) => typeof n === "number" && n > 0)
  if (hasClinicalMinimum) {
    const map = ctx.roleEvidenceMap
    const canSignClinical = skill.allowedRoles.some((r) => map[r]?.clinical === true)
    if (!canSignClinical) {
      err("clinicalMinimumNoClinicalRole", "allowedRoles", {
        clinicalRoles: Object.keys(map).filter((r) => map[r].clinical),
      })
    }
  }

  return { valid: !issues.some((i) => i.severity === "error"), issues }
}
