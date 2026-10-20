import { needsLevels, needsQuestions, MODEL_LABEL } from "./config"
import { qualifiedEvaluators, simulationShare, strengthHint } from "./rules"
import type { EvalModel, SkillConfig, V2State } from "./types"

export interface ReviewSection {
  /** Wizard step that owns these settings. */
  step: number
  title: string
  lines: string[]
}

const list = (items: string[]) => (items.length ? items.join(", ") : "none")
const ROLE_NAME = { preceptor: "preceptors", faculty: "faculty", "lab-instructor": "lab instructors" } as const

/** What the evaluator is asked to record, in one sentence (SC-19). */
export function evaluatorFormLine(model: EvalModel | null, c: SkillConfig): string {
  if (!model) return "No evaluation model chosen yet."
  const bits: string[] = []
  if (model === "binary") bits.push(`one outcome, ${c.outcomeLabels[0] || "unnamed"} or ${c.outcomeLabels[1] || "unnamed"}`)
  if (model === "question") bits.push(`Yes or No for each of ${c.questions.length} ${c.questions.length === 1 ? "question" : "questions"}`)
  if (model === "scored") bits.push(`a score for each of ${c.questions.length} ${c.questions.length === 1 ? "question" : "questions"}`)
  if (model === "demonstration") bits.push(`a supervision level: ${list(c.levels.filter((l) => l.trim()))}`)
  if (c.overallRating && model !== "demonstration") bits.push(`one overall supervision rating: ${list(c.levels.filter((l) => l.trim()))}`)
  return `The evaluator records ${bits.join(", plus ")}.`
}

/** Everything a skill will ask of students and evaluators, grouped by the wizard step that sets it (SC-19). */
export function reviewSections(model: EvalModel | null, c: SkillConfig, s: V2State): ReviewSection[] {
  const hint = strengthHint(model, c)
  const sim = simulationShare(c)
  const people = qualifiedEvaluators(s, c)
  const skillNames = c.prerequisites.skillIds.map((id) => s.skills.find((k) => k.id === id)?.name ?? "A skill that was removed")
  const pre: string[] = []
  if (c.prerequisites.labCheckoff) pre.push("pass the lab check-off")
  if (c.prerequisites.practiceTrials > 0) pre.push(`log ${c.prerequisites.practiceTrials} practice ${c.prerequisites.practiceTrials === 1 ? "trial" : "trials"}`)
  if (skillNames.length) pre.push(`have met ${list(skillNames)}`)
  const f = c.failure
  const fail: string[] = [f.attemptLimit === null ? "No limit on attempts." : `At most ${f.attemptLimit} ${f.attemptLimit === 1 ? "attempt" : "attempts"}.`]
  fail.push(f.minDaysBetween > 0 ? `At least ${f.minDaysBetween} ${f.minDaysBetween === 1 ? "day" : "days"} between attempts.` : "Attempts can follow one another straight away.")
  if (model === "scored") fail.push(f.retakeScoreCap === null ? "A retake can earn any score." : `A retake can earn at most ${f.retakeScoreCap} percent.`)
  fail.push(f.autoRemediation ? "A remediation plan is created automatically after a fail." : "No remediation plan is created automatically.")
  const r = c.revalidation
  return [
    {
      step: 1,
      title: "Evaluation model",
      lines: [
        model ? `${MODEL_LABEL[model]}.` : "No model chosen yet.",
        evaluatorFormLine(model, c),
        ...(needsQuestions(model) ? [`Questions: ${list(c.questions.filter((q) => q.trim()))}.`] : []),
        ...(needsLevels(model, c) ? [`Levels, lowest to highest: ${list(c.levels.filter((l) => l.trim()))}.`] : []),
      ],
    },
    { step: 2, title: "Achievement rules", lines: [hint.sentence, hint.note] },
    { step: 3, title: "Simulation", lines: [sim.text] },
    { step: 4, title: "Prerequisites", lines: [pre.length ? `Before a clinical attempt opens, a student must ${pre.join(", ")}.` : "A student can attempt this skill without any prerequisite."] },
    {
      step: 5,
      title: "Qualified evaluators",
      lines: [
        `May sign off: ${list(c.evaluatorRoles.map((x) => ROLE_NAME[x]))}.`,
        `Required: ${c.qualification.credentials.length ? `credential ${list(c.qualification.credentials)}` : "any credential"}, ${c.qualification.minYears > 0 ? `${c.qualification.minYears}+ years of practice` : "no minimum years"}${c.qualification.training.length ? `, trained in ${list(c.qualification.training)}` : ""}.`,
        `${people.length} on record qualify: ${list(people.map((p) => p.name))}. Students can only pick from these.`,
      ],
    },
    { step: 6, title: "If a student does not pass", lines: fail },
    {
      step: 7,
      title: "Re-validation",
      lines: [
        r.onEvents.length ? `A student must re-validate after: ${list(r.onEvents.filter((e) => e.trim()))}.` : "No event triggers re-validation.",
        r.calendarExpiry.enabled ? `Evidence also expires after ${r.calendarExpiry.months} months.` : "Evidence does not expire on a calendar date.",
      ],
    },
  ]
}
