/**
 * Exam lock delivery model — maps `AuthoringQuestionType` from the Question Bank
 * to respondent-facing interaction contracts.
 *
 * | Authoring type   | Delivery component              | Answer shape        | Grading   | Stem image |
 * |------------------|---------------------------------|---------------------|-----------|------------|
 * | mcq_single       | ExamLockMcqQuestion             | string (option)     | Auto      | Yes        |
 * | mcq_multiple     | (planned) ExamLockMcqMulti      | string[]            | Auto      | Yes        |
 * | true_false       | ExamLockTrueFalseQuestion       | "True" \| "False"   | Auto      | Yes        |
 * | short_answer     | (planned) ExamLockShortAnswer   | string              | Auto      | Yes        |
 * | numeric          | (planned) ExamLockNumeric       | string              | Auto      | Yes        |
 * | essay            | ExamLockEssayQuestion           | string              | Rubric    | Yes        |
 * | fill_blank       | ExamLockFillBlankQuestion       | Record<id,string>   | Auto      | Yes        |
 * | matching         | (planned) ExamLockMatching      | Record<id,string>   | Auto      | Optional   |
 * | ordering         | (planned) ExamLockOrdering      | string[] (ids)      | Auto      | Optional   |
 * | hotspot          | (planned) ExamLockHotspot       | region id           | Auto      | Required   |
 *
 * **Stem media** — `stemMedia` renders **below the question text**, **beside** the
 * response control (options, blanks, essay). Stacks on narrow viewports.
 *
 * Aligns with `lib/library-authoring.ts` (`AUTHORING_QUESTION_TYPES`).
 */

import type { AuthoringQuestionType } from "@/lib/library-authoring"

export type ExamLockDeliveryType = AuthoringQuestionType

/** Student-facing figure shown with the stem (not the hotspot answer surface). */
export interface ExamLockStemMedia {
  kind: "image"
  /** Inline display URL (may be a smaller crop). */
  src: string
  /** Optional higher-resolution URL for the expand / fullscreen viewer. */
  fullscreenSrc?: string
  /** Required — describe clinical content for AT (SC 1.1.1). */
  alt: string
  caption?: string
}

/** Shared chrome for every delivered item. */
export interface ExamLockQuestionChrome {
  questionNumber: number
  questionId: string
  stem: string
  /** Optional clinical figure above the stem text. */
  stemMedia?: ExamLockStemMedia
  shortcutsDisabled?: boolean
  className?: string
}

export interface ExamLockMcqSingleDelivery extends ExamLockQuestionChrome {
  type: "mcq_single"
  options: readonly string[]
  allowEliminate?: boolean
  allowClear?: boolean
}

export interface ExamLockMcqMultipleDelivery extends ExamLockQuestionChrome {
  type: "mcq_multiple"
  options: readonly string[]
}

export interface ExamLockTrueFalseDelivery extends ExamLockQuestionChrome {
  type: "true_false"
  allowEliminate?: boolean
  allowClear?: boolean
}

export interface ExamLockShortAnswerDelivery extends ExamLockQuestionChrome {
  type: "short_answer"
  formatHint?: string
  inputMode?: "text" | "search" | "none" | "tel" | "url" | "email" | "numeric" | "decimal"
}

export interface ExamLockNumericDelivery extends ExamLockQuestionChrome {
  type: "numeric"
  units?: string
  formatHint?: string
}

export interface ExamLockEssayDelivery extends ExamLockQuestionChrome {
  type: "essay"
  maxCharacters?: number
  formatHint?: string
}

export interface ExamLockFillBlankDelivery extends ExamLockQuestionChrome {
  type: "fill_blank"
  blankIds?: readonly string[]
  formatHint?: string
}

export interface ExamLockMatchingDelivery extends ExamLockQuestionChrome {
  type: "matching"
  prompts: readonly { id: string; left: string }[]
  choices: readonly string[]
}

export interface ExamLockOrderingDelivery extends ExamLockQuestionChrome {
  type: "ordering"
  items: readonly { id: string; text: string }[]
}

export interface ExamLockHotspotDelivery extends ExamLockQuestionChrome {
  type: "hotspot"
  image: ExamLockStemMedia
}

export type ExamLockDeliveryQuestion =
  | ExamLockMcqSingleDelivery
  | ExamLockMcqMultipleDelivery
  | ExamLockTrueFalseDelivery
  | ExamLockShortAnswerDelivery
  | ExamLockNumericDelivery
  | ExamLockEssayDelivery
  | ExamLockFillBlankDelivery
  | ExamLockMatchingDelivery
  | ExamLockOrderingDelivery
  | ExamLockHotspotDelivery

export type ExamLockAnswerValue = string | readonly string[] | Record<string, string>

export const EXAM_LOCK_STEM_SUPPORTS_IMAGE: readonly ExamLockDeliveryType[] = [
  "mcq_single",
  "mcq_multiple",
  "true_false",
  "short_answer",
  "numeric",
  "essay",
  "fill_blank",
  "matching",
  "ordering",
] as const

export const EXAM_LOCK_DELIVERY_IMPLEMENTED: readonly ExamLockDeliveryType[] = [
  "mcq_single",
  "true_false",
  "fill_blank",
  "essay",
] as const

export function isExamLockDeliveryImplemented(
  type: ExamLockDeliveryType,
): type is (typeof EXAM_LOCK_DELIVERY_IMPLEMENTED)[number] {
  return (EXAM_LOCK_DELIVERY_IMPLEMENTED as readonly string[]).includes(type)
}

export function parseFillBlankStem(stem: string): Array<
  | { kind: "text"; text: string }
  | { kind: "blank"; blankIndex: number }
> {
  const parts: Array<{ kind: "text"; text: string } | { kind: "blank"; blankIndex: number }> = []
  const re = /\{\{blank\}\}/gi
  let lastIndex = 0
  let blankIndex = 0
  let match: RegExpExecArray | null
  while ((match = re.exec(stem)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ kind: "text", text: stem.slice(lastIndex, match.index) })
    }
    parts.push({ kind: "blank", blankIndex: blankIndex++ })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < stem.length) {
    parts.push({ kind: "text", text: stem.slice(lastIndex) })
  }
  return parts
}

export function blankIdForIndex(index: number, ids?: readonly string[]): string {
  return ids?.[index] ?? `blank-${index}`
}

export function countFillBlanksInStem(stem: string): number {
  return (stem.match(/\{\{blank\}\}/gi) ?? []).length
}

export function isExamLockQuestionAnswered(
  question: ExamLockDeliveryQuestion,
  value: ExamLockAnswerValue | undefined,
): boolean {
  if (value === undefined) return false
  switch (question.type) {
    case "mcq_single":
    case "true_false":
    case "essay":
      return typeof value === "string" && value.trim().length > 0
    case "fill_blank": {
      if (typeof value !== "object" || value === null || Array.isArray(value)) return false
      const blanks = value as Record<string, string>
      const blankCount = countFillBlanksInStem(question.stem)
      if (blankCount === 0) return false
      for (let i = 0; i < blankCount; i++) {
        const id = blankIdForIndex(i, question.blankIds)
        if (!blanks[id]?.trim()) return false
      }
      return true
    }
    default:
      return false
  }
}
