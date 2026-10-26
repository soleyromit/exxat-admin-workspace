import type { EvalModel, SkillConfig } from "./types"

export const MODEL_LABEL: Record<EvalModel, string> = {
  binary: "Overall outcome",
  question: "Question by question",
  scored: "Scored",
  demonstration: "Demonstration level",
}

export const MODEL_BLURB: Record<EvalModel, string> = {
  binary: "One outcome for the whole skill, using two labels you name.",
  question: "A Yes or No against each question you write.",
  scored: "A score for each question on a scale you set.",
  demonstration: "A level of supervision for each demonstration, on levels you name and order.",
}

export const MODELS: EvalModel[] = ["binary", "question", "scored", "demonstration"]

/** Suggested level names for a brand-new list. The program renames, reorders and removes them freely. */
/** The assisted level, worded as the configure preset says it ("With assistance", lib/lab/configure.ts PRESETS; UX critique 2026-10-26). */
export const ASSISTED_LEVEL = "With assistance"
export const SAMPLE_LEVELS = ["Needs coaching", ASSISTED_LEVEL, "Works alone"]

export const SAMPLE_QUESTIONS = ["Performed hand hygiene before and after", "Kept the field clean throughout", "Explained each step to the patient"]

/** A fresh configuration. It implies no evaluation model: the admin always chooses one explicitly (SC-02). The argument is ignored. */
export function defaultConfig(_model?: EvalModel | null): SkillConfig {
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
    failure: { attemptLimit: null, minDaysBetween: 0, retakeScoreCap: null },
    feedbackRequired: false,
    approvalRequired: false,
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
