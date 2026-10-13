// S-09 dependency panel (SC-17): model -> evidence -> rule -> criteria -> status. Pure text from structured config.
import type { SkillStatusDisplay } from "@/lib/domain/types"
import type { Criteria, ModelConfig } from "@/lib/engine"
import { criteriaSummary } from "./format"
import { statusLabel } from "./shared"
import * as surface from "./surfaces"
import type { CriteriaPart } from "@/lib/store/selectors/shared"

export interface LineageStep {
  label: string
  value: string
}

const kindTitle = (m: ModelConfig | null): string => (m ? surface.s09.models[m.kind].title : "Not chosen")

export function evidencePerEvaluation(m: ModelConfig | null): string {
  if (!m) return "Not yet defined"
  switch (m.kind) {
    case "binary":
      return `${m.labels.a.label || "First label"} or ${m.labels.b.label || "second label"}`
    case "question":
      return "Yes or No for each question"
    case "scored":
      return m.scale ? `A score from ${m.scale.min} to ${m.scale.max} for each question` : "A score for each question"
    case "demonstration":
      return m.levels.length ? m.levels.map((l) => l.label || "Unnamed level").join(", ") : "A level of supervision"
  }
}

export function qualifiesWhen(m: ModelConfig | null): string {
  if (!m) return "Not yet defined"
  switch (m.kind) {
    case "binary": {
      const q = m.qualifyingLabelId ? m.labels[m.qualifyingLabelId].label : ""
      return q ? `The overall outcome is ${q}` : "A qualifying outcome is not chosen yet"
    }
    case "question": {
      const total = m.questions.length
      if (m.rule.kind === "all") return "All questions are answered Yes"
      if (m.rule.kind === "atLeast") return `At least ${m.rule.n} of ${total} questions are answered Yes`
      return m.rule.questionIds.length ? `${m.rule.questionIds.length} named ${m.rule.questionIds.length === 1 ? "question is" : "questions are"} answered Yes` : "No question is selected yet"
    }
    case "scored":
      return m.rule.kind === "average" ? `The average score is at least ${m.rule.min}` : m.rule.kind === "minPerQuestion" ? `Every question scores at least ${m.rule.min}` : `The total score is at least ${m.rule.min}`
    case "demonstration":
      return "Each completed demonstration counts as evidence"
  }
}

/** The five steps of the lineage panel. `display` only changes the wording of the last step (OD-03 flag). */
export function lineageSteps(model: ModelConfig | null, _criteria: Criteria, parts: CriteriaPart[], display: SkillStatusDisplay): LineageStep[] {
  const labels = surface.s09.lineage.heading
  const status =
    display === "four"
      ? [statusLabel("noEvidence", display), statusLabel("evidenceDoesNotQualify", display), statusLabel("partial", display), statusLabel("achieved", display)]
      : [statusLabel("noEvidence", display), statusLabel("partial", display), statusLabel("achieved", display)]
  return [
    { label: labels[0], value: kindTitle(model) },
    { label: labels[1], value: evidencePerEvaluation(model) },
    { label: labels[2], value: qualifiesWhen(model) },
    { label: labels[3], value: parts.length ? criteriaSummary(parts) : "Not yet defined" },
    { label: labels[4], value: status.join(", ") },
  ]
}
