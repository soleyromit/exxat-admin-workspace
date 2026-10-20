import type { EvalModel, SkillConfig } from "./types"

export const MODEL_LABEL: Record<EvalModel, string> = {
  binary: "Overall outcome",
  question: "Question by question",
  scored: "Scored",
  demonstration: "Demonstration level",
}

export const MODEL_BLURB: Record<EvalModel, string> = {
  binary: "One outcome for the whole skill, using two labels you name. This is the simplest start.",
  question: "A Yes or No against each question you write.",
  scored: "A score for each question on a scale you set.",
  demonstration: "A level of supervision for each demonstration, on levels you name and order.",
}

export const MODELS: EvalModel[] = ["binary", "question", "scored", "demonstration"]

/** Suggested level names for a brand-new list. The program renames, reorders and removes them freely. */
export const SAMPLE_LEVELS = ["Needs coaching", "Works with prompts", "Works alone"]

/** Events a program commonly re-validates on. The program can add its own. */
export const SUGGESTED_EVENTS = ["After a leave of absence", "After an extended time away from practice", "After a policy or equipment change"]

export const SAMPLE_QUESTIONS = ["Performed hand hygiene before and after", "Kept the field clean throughout", "Explained each step to the patient"]

/** A fresh configuration. Binary is the pre-selected starting point only when a skill has no model yet. */
export function defaultConfig(_model: EvalModel | null = "binary"): SkillConfig {
  return {
    outcomeLabels: ["Met", "Not met"],
    questions: [],
    levels: [...SAMPLE_LEVELS],
    overallRating: false,
    achievement: { kind: "count", need: 3, minLevelIndex: null, distinctEvaluators: 1, settingMinimums: [] },
    simulation: { allowed: true, mode: "cap", maxSharePercent: 33, allowList: [] },
    prerequisites: { skillIds: [], labCheckoff: false, practiceTrials: 0 },
    evaluatorRoles: ["preceptor", "faculty"],
    qualification: { credentials: [], minYears: 0, training: [] },
    failure: { attemptLimit: null, minDaysBetween: 0, retakeScoreCap: null, autoRemediation: false },
    revalidation: { onEvents: [], calendarExpiry: { enabled: false, months: 24 } },
  }
}

export const needsLevels = (model: EvalModel | null, c: SkillConfig) => model === "demonstration" || c.overallRating
export const needsQuestions = (model: EvalModel | null) => model === "question" || model === "scored"

/**
 * Changing the model rebuilds the settings that depend on it and keeps the rest (SC-09). Questions are cleared when the new
 * model has none, a minimum level is dropped when no level scale applies, and the retake score cap only exists for scored.
 */
export function rebuildForModel(config: SkillConfig, model: EvalModel): SkillConfig {
  const next: SkillConfig = { ...config, achievement: { ...config.achievement }, failure: { ...config.failure } }
  if (!needsQuestions(model)) next.questions = []
  if (!needsLevels(model, next)) next.achievement.minLevelIndex = null
  if (model !== "scored") next.failure.retakeScoreCap = null
  return next
}
