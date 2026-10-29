/**
 * Group check-off rules with no dependencies beyond types (PROTO prism-skills-prototype_10282026.html `MS`, `lt`, `md`, `dd`).
 * Kept apart from lib/lab/course-checkoff.ts so lib/lab/configure.ts can read them without importing mapping and library
 * (configure -> mapping -> library -> configure is a load-time cycle).
 */
import type { EvalModel } from "@/lib/v2/types"
import { inSentence } from "./terms"

/** Group check-off allowed by default, per model [PROTO `MS`]. */
export const CHECKOFF_DEFAULT: Record<EvalModel, boolean> = { binary: true, demonstration: true, question: false, scored: false }

/** Whether a rule allows a group check-off: its own choice, else the model's default. */
export function checkOffAllowedFor(model: EvalModel | null, enabled: boolean | null | undefined): boolean {
  if (!model) return false
  return enabled ?? CHECKOFF_DEFAULT[model]
}

/** The level a tick records: the nominated one, else the highest level. */
export function checkOffLevelIndex(levels: readonly string[], nominated: number | null | undefined): number {
  if (typeof nominated === "number" && nominated >= 0 && nominated < levels.length) return nominated
  return Math.max(0, levels.length - 1)
}

/** The score a tick records on every item: the nominated one, else the rule's own threshold, else 3; within the scale. */
export function checkOffScore(scaleMax: number, rule: { kind: string; value: number } | null | undefined, nominated: number | null | undefined, items: number): number {
  const max = scaleMax || 5
  const fromRule = rule ? (rule.kind === "total" ? Math.ceil(rule.value / Math.max(1, items)) : Math.ceil(rule.value)) : 3
  const v = typeof nominated === "number" ? nominated : fromRule
  return Math.min(max, Math.max(1, v))
}

/** Level labels that start with a verb or preposition do not read after "as" ("as works alone"), so they take the colon form. */
const NOT_A_STATE = new Set(["works", "with", "needs", "requires", "under", "without"])

/** "as independent", or "at the level: works alone" when the label starts with a verb or preposition. */
export function levelPhrase(level: string): string {
  const l = inSentence(level.trim())
  const first = l.split(/\s+/)[0]?.toLowerCase() ?? ""
  return NOT_A_STATE.has(first) ? `at the level: ${l}` : `as ${l}`
}

/**
 * What one tick writes, said as what it does to the student (Romit 2026-10-29, chose "marks the student as…"; Sankalp: "Records
 * Works alone" read as describing a student). No closing full stop; callers add it. Labels mid-sentence go through inSentence.
 * "A tick marks the student as met", "A tick marks the student as independent", "A tick marks the student at the level: works
 * alone", "A tick marks every question Yes" ("Yes" is the answer button, so it keeps its case), "A tick scores the student 4 on
 * every item".
 */
export function tickRecordsLine(model: EvalModel | null, p: { outcomeLabels: readonly string[]; qualifyingLabel?: 0 | 1 | null; levels: readonly string[]; levelIndex: number | null | undefined; questions: readonly string[]; score: number }): string {
  if (model === "binary") return `A tick marks the student as ${inSentence(p.outcomeLabels[p.qualifyingLabel ?? 0] || "Met")}`
  if (model === "demonstration") {
    const level = p.levels[checkOffLevelIndex(p.levels, p.levelIndex)]
    return level ? `A tick marks the student ${levelPhrase(level)}` : "A tick marks the student at a level"
  }
  if (model === "question") return "A tick marks every question Yes"
  if (model === "scored") return `A tick scores the student ${p.score} on every item`
  return ""
}

/** Why a check-off is off for this skill, or null when it is allowed [PROTO `dd`]. */
export function checkOffOffReason(model: EvalModel | null, allowed: boolean, isConfigured: boolean, questions: number): string | null {
  if (!isConfigured || !model) return "Not configured yet."
  if (allowed) return null
  if (model === "question") return `Evaluated by ${questions} questions, and a tick cannot answer them. The program can allow check-off, so a tick means every question answered Yes.`
  if (model === "scored") return "Evaluated by score, and a tick cannot give a score. The program can allow check-off and name the score a tick records."
  return "Check-off is turned off for this skill."
}
