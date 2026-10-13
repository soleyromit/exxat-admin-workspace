// Completeness checks for answers (evaluator form EV-03..EV-06, student self-evaluation ST-11).
// One schema for both respondents (OD-09 seam: today they must match so they stay comparable, AR-02).
import type { ModelConfig, Responses } from "@/lib/engine"

export type ResponseErrorCode = "kindMismatch" | "required" | "unknownChoice" | "outOfScale"

/** Returns field errors keyed by path (`labelId`, `answers.<questionId>`, `scores.<questionId>`, `levelId`), or {} when complete. */
export function responseErrors(model: ModelConfig, r: Responses | null | undefined): Record<string, ResponseErrorCode> {
  if (!r) return { responses: "required" }
  if (r.kind !== model.kind) return { responses: "kindMismatch" }
  const out: Record<string, ResponseErrorCode> = {}
  switch (model.kind) {
    case "binary": {
      const x = r as Extract<Responses, { kind: "binary" }>
      if (x.labelId !== "a" && x.labelId !== "b") out.labelId = "unknownChoice"
      break
    }
    case "question": {
      const x = r as Extract<Responses, { kind: "question" }>
      for (const q of model.questions) if (typeof x.answers[q.id] !== "boolean") out[`answers.${q.id}`] = "required"
      break
    }
    case "scored": {
      const x = r as Extract<Responses, { kind: "scored" }>
      for (const q of model.questions) {
        const v = x.scores[q.id]
        if (typeof v !== "number" || Number.isNaN(v)) out[`scores.${q.id}`] = "required"
        else if (model.scale && (v < model.scale.min || v > model.scale.max)) out[`scores.${q.id}`] = "outOfScale"
      }
      break
    }
    case "demonstration": {
      const x = r as Extract<Responses, { kind: "demonstration" }>
      if (!x.levelId) out.levelId = "required"
      else if (!model.levels.some((l) => l.id === x.levelId)) out.levelId = "unknownChoice"
      break
    }
  }
  return out
}
