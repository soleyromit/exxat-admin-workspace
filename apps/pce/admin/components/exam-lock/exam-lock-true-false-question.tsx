"use client"

import { ExamLockMcqQuestion, type ExamLockMcqQuestionProps } from "./exam-lock-mcq-question"

const TRUE_FALSE_OPTIONS = ["True", "False"] as const

export type ExamLockTrueFalseQuestionProps = Omit<
  ExamLockMcqQuestionProps,
  "options"
>

/** True / False — fixed options with the same delivery chrome as single-choice MCQ. */
export function ExamLockTrueFalseQuestion(props: ExamLockTrueFalseQuestionProps) {
  return <ExamLockMcqQuestion {...props} options={TRUE_FALSE_OPTIONS} />
}
