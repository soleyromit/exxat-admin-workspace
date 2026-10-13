// Test fixtures for the achievement engine. Pure data builders, no engine logic.
// Spec: docs/strategy/02 §3, §5; docs/build/contracts/S-09 §15b.
import type {
  ConfiguredSkill,
  Criteria,
  Evidence,
  ModelConfig,
  Responses,
  RoleEvidenceMap,
  SkillConfig,
} from "@/lib/engine"

export const ROLE_MAP: RoleEvidenceMap = {
  // OD-25 is OPEN: this map is test DATA only, the engine never hardcodes it.
  preceptor: { clinical: true, lab: false },
  faculty: { clinical: true, lab: true },
  labInstructor: { clinical: false, lab: true },
}

export const noCriteria = (): Criteria => ({ requiredCount: 1, levelMinimums: {}, settingMinimums: {} })

export function skill(model: ModelConfig | null, over: Partial<SkillConfig> = {}): SkillConfig {
  return {
    id: "sk1",
    active: true,
    model,
    criteria: noCriteria(),
    requiresApproval: false,
    allowedRoles: ["preceptor", "faculty"],
    ...over,
  }
}

export function configured(model: ModelConfig, over: Partial<SkillConfig> = {}): ConfiguredSkill {
  return skill(model, over) as ConfiguredSkill
}

let seq = 0
export function ev(responses: Responses, over: Partial<Evidence> = {}): Evidence {
  seq += 1
  return {
    id: `e${seq}`,
    skillId: "sk1",
    studentId: "s1",
    courseId: "c1",
    complete: true,
    approval: "notRequired",
    performedIn: "clinical",
    clinicalSettingId: "inpatient",
    locationId: "loc1",
    evaluatorRole: "preceptor",
    responses,
    ...over,
  }
}

// ---- model builders
export const binary = (qualifying: "a" | "b" = "a"): ModelConfig => ({
  kind: "binary",
  labels: { a: { id: "a", label: "Met" }, b: { id: "b", label: "Unmet" } },
  qualifyingLabelId: qualifying,
})

export const questions = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: `q${i + 1}`, text: `Question ${i + 1}` }))

export const questionModel = (n: number, rule: Extract<ModelConfig, { kind: "question" }>["rule"]): ModelConfig => ({
  kind: "question",
  questions: questions(n),
  rule,
})

export const scoredModel = (
  n: number,
  rule: Extract<ModelConfig, { kind: "scored" }>["rule"],
  scale = { min: 1, max: 5, step: 1 },
): ModelConfig => ({ kind: "scored", questions: questions(n), scale, rule })

export const levels = [
  { id: "obs", label: "Observed" },
  { id: "assist", label: "With assistance" },
  { id: "ind", label: "Independent" },
]
export const demoModel = (): ModelConfig => ({ kind: "demonstration", levels: levels.map((l) => ({ ...l })) })

// ---- response builders
export const bin = (labelId: "a" | "b"): Responses => ({ kind: "binary", labelId })
export const yesNo = (...answers: boolean[]): Responses => ({
  kind: "question",
  answers: Object.fromEntries(answers.map((a, i) => [`q${i + 1}`, a])),
})
export const scores = (...s: number[]): Responses => ({
  kind: "scored",
  scores: Object.fromEntries(s.map((v, i) => [`q${i + 1}`, v])),
})
export const demo = (levelId: string): Responses => ({ kind: "demonstration", levelId })

// ---- IV Insertion worked example (docs/strategy/02 §5)
export const ivSkill = (): ConfiguredSkill =>
  configured(demoModel(), {
    id: "sk1",
    criteria: { requiredCount: 5, levelMinimums: { obs: 1, assist: 1, ind: 3 }, settingMinimums: {} },
  })

export function ivEvidence(): Evidence[] {
  const make = (levelId: string, n: number) => Array.from({ length: n }, () => ev(demo(levelId)))
  return [...make("obs", 2), ...make("assist", 1), ...make("ind", 4)] // 7 total
}

// ---- Wound Care (DEFECT-07): 4 demonstrations, 1 supervised, 2 independent, 1 Inpatient, 1 Emergency
export const woundCare = (): ConfiguredSkill =>
  configured(demoModel(), {
    id: "sk1",
    criteria: {
      requiredCount: 4,
      levelMinimums: { assist: 1, ind: 2 },
      settingMinimums: { inpatient: 1, emergency: 1 },
    },
  })
