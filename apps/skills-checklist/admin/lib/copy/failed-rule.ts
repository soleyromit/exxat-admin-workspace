// §7 failed-rule explanation generator (SH-03). Text is built at READ time from the skill's CURRENT rule and live
// labels, never stored (AE-02, AE-06). Pattern: "This evaluation did not meet the criteria because {reason}. {Next step}."
// Never the word "failed", never red. At most three unmet criteria, most actionable first (the selector already limits).
import type { Db, Skill } from "@/lib/domain/types"
import type { Reason, UnmetCriterion } from "@/lib/engine"
import { inSentence } from "@/lib/lab/terms"

/** Re-exported so callers and tests can type an evaluation-level reason without importing the engine. */
export type EvalReason = Reason

export interface RuleContext {
  question(id: string): string
  level(id: string): string
  setting(id: string): string
  binaryLabel(id: "a" | "b" | null): string
  /** The qualifying-label wording for binary skills. */
  qualifyingLabel: string
}

export function ruleContext(db: Db, skill: Skill): RuleContext {
  const m = skill.model
  const questions = m && (m.kind === "question" || m.kind === "scored") ? m.questions : []
  const levels = m && m.kind === "demonstration" ? m.levels : []
  const bin = m && m.kind === "binary" ? m : null
  return {
    question: (id) => questions.find((q) => q.id === id)?.text ?? id,
    level: (id) => levels.find((l) => l.id === id)?.label ?? id,
    setting: (id) => db.clinicalSettings.find((s) => s.id === id)?.name ?? id,
    binaryLabel: (id) => (bin && id ? bin.labels[id].label : ""),
    qualifyingLabel: bin ? bin.labels[bin.qualifyingLabelId ?? "a"].label : "",
  }
}

const list = (xs: string[]) => (xs.length <= 1 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`)
const n = (x: number) => (Number.isInteger(x) ? String(x) : x.toFixed(1))

/** §7.1 why ONE completed evaluation did not qualify. */
export function evaluationReasonText(r: Reason, c: RuleContext, recordedLabelId?: "a" | "b"): string {
  switch (r.rule) {
    case "binaryLabel":
      return `The outcome recorded was ${c.binaryLabel(recordedLabelId ?? r.have)}. The outcome needed is ${c.qualifyingLabel}.`
    case "allYes": {
      const k = r.failedQuestionIds.length
      return `${k} ${k === 1 ? "question was" : "questions were"} answered No: ${list(r.failedQuestionIds.map(c.question))}. Every question needed a Yes.`
    }
    case "atLeast":
      return `${r.have} of ${r.of} questions were answered Yes. At least ${r.needed} were needed.`
    case "subset":
      return `These required questions were not answered Yes: ${list(r.failedQuestionIds.map(c.question))}.`
    case "average":
      return `The average score was ${n(r.have)}. At least ${n(r.needed)} was needed.`
    case "minPerQuestion": {
      const k = r.failedQuestionIds.length
      return `${k} ${k === 1 ? "question scored" : "questions scored"} below ${n(r.needed)}: ${list(r.failedQuestionIds.map(c.question))}.`
    }
    case "total":
      return `The total score was ${n(r.have)}. At least ${n(r.needed)} was needed.`
    case "missingScores":
      return `Some questions were not scored: ${list(r.questionIds.map(c.question))}.`
    case "noQuestions":
    case "subsetEmpty":
      return "This skill's rule has no questions to check."
    case "kindMismatch":
      return "This evaluation was recorded under a different evaluation model."
  }
}

/** §7.2 why the SKILL is not yet achieved even though evidence counts. */
export function skillReasonText(u: UnmetCriterion, c: RuleContext, noun: "demonstrations" | "qualifyingEvaluations" = "qualifyingEvaluations"): string {
  switch (u.rule) {
    case "requiredCount": {
      const more = u.needed - u.have
      return noun === "demonstrations" ? `You have ${u.have} of ${u.needed} demonstrations.` : `You have ${u.have} of ${u.needed} qualifying evaluations. ${more} more needed.`
    }
    case "levelMinimum":
      return `You need ${u.needed} at ${inSentence(c.level(u.levelId))} and have ${u.have}. ${u.needed - u.have} more needed.`
    case "settingMinimum": {
      const base = `You need ${u.needed} in ${inSentence(c.setting(u.settingId))} and have ${u.have}.`
      // SC-12: lab never satisfies a clinical setting. Say so when lab evidence exists.
      return u.labEvidence > 0 ? `${base} Lab or simulation evidence does not count toward ${inSentence(c.setting(u.settingId))}. You need clinical evidence there.` : base
    }
  }
}

/** Next action sentence, from the §3.1 vocabulary. */
export const nextStep = {
  furtherAttempt: "Make a further attempt.",
  reviseAndResend: "Revise and resend it to count.",
  sendAgain: "Send this skill for review again from those settings.",
} as const

/** The composed sentence for a did-not-meet evaluation. */
export function didNotMeetSentence(reason: string, next: string = nextStep.furtherAttempt): string {
  return `This evaluation did not meet the criteria because ${reason.charAt(0).toLowerCase()}${reason.slice(1)} ${next}`
}

export const waitingText = (count: number, who: string[]): string => `${count} ${count === 1 ? "submission is" : "submissions are"} waiting and ${count === 1 ? "does" : "do"} not count yet: ${list(who)}.`
export const returnedText = (count: number): string => `${count} ${count === 1 ? "submission was" : "submissions were"} returned. Revise and resend ${count === 1 ? "it" : "them"} to count.`
