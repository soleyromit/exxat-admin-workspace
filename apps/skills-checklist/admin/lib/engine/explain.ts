// Single source of truth for "does this evaluation qualify under the current rule" (AE-02),
// plus structured failure reasons for SH-03. No copy here: wording lives in docs/ux/09 §7.
import type { ModelConfig, Question, Responses } from "./types"

export type Reason =
  | { rule: "kindMismatch"; expected: ModelConfig["kind"]; have: Responses["kind"] }
  | { rule: "binaryLabel"; needed: "a" | "b" | null; have: "a" | "b" }
  | { rule: "noQuestions" }
  | { rule: "allYes"; needed: number; have: number; failedQuestionIds: string[] }
  | { rule: "atLeast"; needed: number; have: number; of: number }
  | { rule: "subsetEmpty" }
  | { rule: "subset"; needed: number; have: number; failedQuestionIds: string[] }
  | { rule: "missingScores"; questionIds: string[] }
  | { rule: "average"; needed: number; have: number }
  | { rule: "minPerQuestion"; needed: number; failedQuestionIds: string[] }
  | { rule: "total"; needed: number; have: number }

export interface Explanation {
  qualifies: boolean
  reasons: Reason[]
}

const yes = (answers: Record<string, boolean>, q: Question) => answers[q.id] === true

export function explainEvaluation(responses: Responses, model: ModelConfig): Explanation {
  const reasons = check(responses, model)
  return { qualifies: reasons.length === 0, reasons }
}

export function qualifies(responses: Responses, model: ModelConfig): boolean {
  return check(responses, model).length === 0
}

function check(responses: Responses, model: ModelConfig): Reason[] {
  if (responses.kind !== model.kind) return [{ rule: "kindMismatch", expected: model.kind, have: responses.kind }]

  switch (model.kind) {
    case "binary": {
      const r = responses as Extract<Responses, { kind: "binary" }>
      return r.labelId === model.qualifyingLabelId ? [] : [{ rule: "binaryLabel", needed: model.qualifyingLabelId, have: r.labelId }]
    }

    case "question": {
      const { answers } = responses as Extract<Responses, { kind: "question" }>
      const qs = model.questions
      if (qs.length === 0) return [{ rule: "noQuestions" }]
      const rule = model.rule
      if (rule.kind === "all") {
        const failed = qs.filter((q) => !yes(answers, q)).map((q) => q.id)
        return failed.length === 0 ? [] : [{ rule: "allYes", needed: qs.length, have: qs.length - failed.length, failedQuestionIds: failed }]
      }
      if (rule.kind === "atLeast") {
        const have = qs.filter((q) => yes(answers, q)).length
        return have >= rule.n ? [] : [{ rule: "atLeast", needed: rule.n, have, of: qs.length }]
      }
      const named = qs.filter((q) => rule.questionIds.includes(q.id))
      if (named.length === 0) return [{ rule: "subsetEmpty" }]
      const failed = named.filter((q) => !yes(answers, q)).map((q) => q.id)
      return failed.length === 0 ? [] : [{ rule: "subset", needed: named.length, have: named.length - failed.length, failedQuestionIds: failed }]
    }

    case "scored": {
      const { scores } = responses as Extract<Responses, { kind: "scored" }>
      const qs = model.questions
      if (qs.length === 0) return [{ rule: "noQuestions" }]
      const missing = qs.filter((q) => typeof scores[q.id] !== "number" || Number.isNaN(scores[q.id])).map((q) => q.id)
      if (missing.length) return [{ rule: "missingScores", questionIds: missing }]
      const values = qs.map((q) => scores[q.id])
      const sum = values.reduce((a, b) => a + b, 0)
      const rule = model.rule
      if (rule.kind === "average") {
        const have = sum / values.length
        return have >= rule.min ? [] : [{ rule: "average", needed: rule.min, have }]
      }
      if (rule.kind === "total") return sum >= rule.min ? [] : [{ rule: "total", needed: rule.min, have: sum }]
      const failed = qs.filter((q) => scores[q.id] < rule.min).map((q) => q.id)
      return failed.length === 0 ? [] : [{ rule: "minPerQuestion", needed: rule.min, failedQuestionIds: failed }]
    }

    case "demonstration":
      // SC-08/SC-10: every completed demonstration is evidence; the mix is set in the criteria.
      // [INFER] a level that no longer exists still counts as a demonstration (AE-07 note).
      return []
  }
}
