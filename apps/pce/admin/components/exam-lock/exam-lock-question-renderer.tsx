"use client"

import type {
  ExamLockAnswerValue,
  ExamLockDeliveryQuestion,
} from "./exam-lock-delivery-types"
import { isExamLockDeliveryImplemented } from "./exam-lock-delivery-types"
import { ExamLockEssayQuestion } from "./exam-lock-essay-question"
import { ExamLockFillBlankQuestion } from "./exam-lock-fill-blank-question"
import { ExamLockMcqQuestion } from "./exam-lock-mcq-question"
import { ExamLockTrueFalseQuestion } from "./exam-lock-true-false-question"
import { Card, CardContent } from "@/components/ui/card"

export interface ExamLockQuestionRendererProps {
  question: ExamLockDeliveryQuestion
  value: ExamLockAnswerValue
  onValueChange: (value: ExamLockAnswerValue) => void
  eliminatedOptions?: readonly string[]
  onToggleEliminated?: (option: string) => void
  shortcutsDisabled?: boolean
}

function ExamLockDeliveryPlaceholder({ type }: { type: string }) {
  return (
    <Card
      size="sm"
      className="border-dashed bg-muted/20 py-8 text-center text-sm text-muted-foreground"
      role="status"
    >
      <CardContent>
        <i className="fa-light fa-hammer mb-2 block text-lg" aria-hidden="true" />
        <p className="font-medium text-foreground">{type} delivery</p>
        <p className="mt-1">Renderer not yet implemented in Design OS.</p>
      </CardContent>
    </Card>
  )
}

/** Routes a `ExamLockDeliveryQuestion` to the correct respondent UI. */
export function ExamLockQuestionRenderer({
  question,
  value,
  onValueChange,
  eliminatedOptions,
  onToggleEliminated,
  shortcutsDisabled,
}: ExamLockQuestionRendererProps) {
  const chrome = {
    questionNumber: question.questionNumber,
    questionId: question.questionId,
    stem: question.stem,
    stemMedia: question.stemMedia,
    shortcutsDisabled,
    className: question.className,
  }

  if (!isExamLockDeliveryImplemented(question.type)) {
    return <ExamLockDeliveryPlaceholder type={question.type} />
  }

  switch (question.type) {
    case "mcq_single":
      return (
        <ExamLockMcqQuestion
          {...chrome}
          options={question.options}
          value={typeof value === "string" ? value : ""}
          onValueChange={onValueChange}
          eliminatedOptions={eliminatedOptions}
          onToggleEliminated={onToggleEliminated}
          allowEliminate={question.allowEliminate}
          allowClear={question.allowClear}
        />
      )
    case "true_false":
      return (
        <ExamLockTrueFalseQuestion
          {...chrome}
          value={typeof value === "string" ? value : ""}
          onValueChange={onValueChange}
          eliminatedOptions={eliminatedOptions}
          onToggleEliminated={onToggleEliminated}
          allowEliminate={question.allowEliminate}
          allowClear={question.allowClear}
        />
      )
    case "fill_blank":
      return (
        <ExamLockFillBlankQuestion
          {...chrome}
          blankIds={question.blankIds}
          formatHint={question.formatHint}
          value={
            typeof value === "object" && value !== null && !Array.isArray(value)
              ? (value as Record<string, string>)
              : {}
          }
          onValueChange={onValueChange}
        />
      )
    case "essay":
      return (
        <ExamLockEssayQuestion
          {...chrome}
          formatHint={question.formatHint}
          maxCharacters={question.maxCharacters}
          value={typeof value === "string" ? value : ""}
          onValueChange={onValueChange}
        />
      )
    default:
      return <ExamLockDeliveryPlaceholder type={question.type} />
  }
}
