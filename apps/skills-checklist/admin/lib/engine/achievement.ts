// Derived skill state (AE-01..AE-05). Everything is recomputed from the CURRENT rule (AE-02):
// nothing here is stored, and no input is mutated.
import { qualifies } from "./explain"
import type {
  ConfiguredSkill,
  Evidence,
  EvidenceFilter,
  SkillConfig,
  SkillEvaluation,
  SkillState,
  StateCounts,
  StudentSkillRecord,
  UnmetCriterion,
} from "./types"

const RANK: Record<SkillState, number> = { noEvidence: 0, evidenceDoesNotQualify: 1, partial: 2, achieved: 3 }
export const stateRank = (s: SkillState): number => RANK[s]

export function isConfigured(skill: SkillConfig): skill is ConfiguredSkill {
  return skill.model !== null
}

/** AE-01, AR-06: complete, and approved when the skill requires approval. */
export function isEligible(e: Evidence, skill: Pick<SkillConfig, "requiresApproval">): boolean {
  return e.complete && (!skill.requiresApproval || e.approval === "approved")
}

function matches(e: Evidence, f?: EvidenceFilter): boolean {
  if (!f) return true
  if (f.courseId !== undefined && e.courseId !== f.courseId) return false
  if (f.locationId !== undefined && e.locationId !== f.locationId) return false
  if (f.clinicalSettingId !== undefined && e.clinicalSettingId !== f.clinicalSettingId) return false
  if (f.performedIn !== undefined && e.performedIn !== f.performedIn) return false
  return true
}

/** [INFER] Evidence is unique by id: a duplicate (for example a re-fetch) counts once. */
function dedupe(evidence: readonly Evidence[]): Evidence[] {
  const seen = new Set<string>()
  const out: Evidence[] = []
  for (const e of evidence) {
    if (seen.has(e.id)) continue
    seen.add(e.id)
    out.push(e)
  }
  return out
}

export function evaluateSkill(skill: ConfiguredSkill, evidence: readonly Evidence[], filter?: EvidenceFilter): SkillEvaluation {
  const eligible = dedupe(evidence).filter((e) => matches(e, filter) && isEligible(e, skill))
  const qualifying = eligible.filter((e) => qualifies(e.responses, skill.model))

  // Per level (demonstration only). Evidence at a removed level counts toward the total, never a level.
  const perLevel: Record<string, number> = {}
  if (skill.model.kind === "demonstration") {
    for (const l of skill.model.levels) perLevel[l.id] = 0
    for (const e of qualifying) {
      if (e.responses.kind === "demonstration" && e.responses.levelId in perLevel) perLevel[e.responses.levelId] += 1
    }
  }

  // Per named clinical setting. Lab evidence NEVER satisfies a clinical setting (SC-12).
  const perSetting: Record<string, number> = {}
  for (const id of Object.keys(skill.criteria.settingMinimums)) perSetting[id] = 0
  for (const e of qualifying) {
    if (e.performedIn !== "clinical" || e.clinicalSettingId === undefined) continue
    if (e.clinicalSettingId in perSetting) perSetting[e.clinicalSettingId] += 1
  }
  const labEvidence = qualifying.filter((e) => e.performedIn === "lab").length

  const unmet: UnmetCriterion[] = []
  const need = skill.criteria.requiredCount
  if (need !== null && qualifying.length < need) unmet.push({ rule: "requiredCount", needed: need, have: qualifying.length })
  for (const [levelId, needed] of Object.entries(skill.criteria.levelMinimums)) {
    const have = perLevel[levelId] ?? 0
    if (have < needed) unmet.push({ rule: "levelMinimum", levelId, needed, have })
  }
  for (const [settingId, needed] of Object.entries(skill.criteria.settingMinimums)) {
    const have = perSetting[settingId] ?? 0
    if (have < needed) unmet.push({ rule: "settingMinimum", settingId, needed, have, labEvidence })
  }

  let state: SkillState
  if (eligible.length === 0) state = "noEvidence"
  else if (qualifying.length === 0) state = "evidenceDoesNotQualify"
  else state = unmet.length === 0 ? "achieved" : "partial"

  return { state, qualifyingCount: qualifying.length, eligibleCount: eligible.length, perLevel, perSetting, unmet }
}

export interface BuildRecordsInput {
  skills: readonly SkillConfig[]
  evidence: readonly Evidence[]
  /** Students to include even with no evidence ("no evidence yet"). */
  studentIds?: readonly string[]
  filter?: EvidenceFilter
}

/**
 * One record per student per skill, shared across courses (CM-07, AE-05); `filter.courseId` narrows (SH-06).
 * Inactive (SL-11) and unconfigured (IM-09) skills leave the scope. Evidence is never touched.
 */
export function buildRecords({ skills, evidence, studentIds = [], filter }: BuildRecordsInput): StudentSkillRecord[] {
  const students = [...new Set([...studentIds, ...evidence.map((e) => e.studentId)])]
  const out: StudentSkillRecord[] = []
  for (const s of skills) {
    if (!s.active || !isConfigured(s)) continue
    for (const studentId of students) {
      const mine = evidence.filter((e) => e.skillId === s.id && e.studentId === studentId)
      out.push({ studentId, skillId: s.id, evaluation: evaluateSkill(s, mine, filter) })
    }
  }
  return out
}

const emptyCounts = (): StateCounts => ({ noEvidence: 0, evidenceDoesNotQualify: 0, partial: 0, achieved: 0 })

export interface ImpactPreview {
  before: StateCounts
  after: StateCounts
  /** Records whose state differs between the current rule and the draft. */
  changed: number
}

/** ENG-10 [INFER]: read-only "what would this edit do to existing records" (AE-02). */
export function previewImpact(
  current: ConfiguredSkill,
  draft: ConfiguredSkill,
  evidence: readonly Evidence[],
  opts: { studentIds?: readonly string[] } = {},
): ImpactPreview {
  const mine = evidence.filter((e) => e.skillId === current.id)
  const students = [...new Set([...(opts.studentIds ?? []), ...mine.map((e) => e.studentId)])]
  const before = emptyCounts()
  const after = emptyCounts()
  let changed = 0
  for (const id of students) {
    const ev = mine.filter((e) => e.studentId === id)
    const b = evaluateSkill(current, ev).state
    const a = evaluateSkill(draft, ev).state
    before[b] += 1
    after[a] += 1
    if (a !== b) changed += 1
  }
  return { before, after, changed }
}
