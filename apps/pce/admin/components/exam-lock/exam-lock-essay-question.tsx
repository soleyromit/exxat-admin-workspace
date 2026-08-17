"use client"

import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import type { ExamLockStemMedia } from "./exam-lock-delivery-types"
import { ExamLockQuestionResponseLayout, ExamLockQuestionStem } from "./exam-lock-question-stem"

export interface ExamLockEssayQuestionProps {
  questionNumber: number
  questionId: string
  stem: string
  stemMedia?: ExamLockStemMedia
  value: string
  onValueChange: (value: string) => void
  maxCharacters?: number
  formatHint?: string
  className?: string
}

export function ExamLockEssayQuestion({
  questionNumber,
  questionId,
  stem,
  stemMedia,
  value,
  onValueChange,
  maxCharacters = 5000,
  formatHint = "Write a complete response in full sentences.",
  className,
}: ExamLockEssayQuestionProps) {
  const headingId = `${questionId}-heading`
  const hintId = `${questionId}-format-hint`
  const countId = `${questionId}-char-count`

  return (
    <section
      aria-labelledby={headingId}
      className={cn("flex flex-col gap-5", className)}
    >
      <ExamLockQuestionStem
        questionNumber={questionNumber}
        stem={stem}
        headingId={headingId}
      />
      <ExamLockQuestionResponseLayout stemMedia={stemMedia}>
        <div className="flex flex-col gap-2">
          <Textarea
            id={`${questionId}-essay`}
            value={value}
            onChange={event => onValueChange(event.target.value)}
            rows={10}
            maxLength={maxCharacters}
            aria-describedby={`${hintId} ${countId}`}
            className="min-h-[12rem] resize-y text-base leading-relaxed md:text-lg"
            placeholder="Type your response here"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p id={hintId} className="text-xs text-muted-foreground">
              {formatHint}
            </p>
            <p id={countId} className="text-xs tabular-nums text-muted-foreground" aria-live="polite">
              {value.length} / {maxCharacters}
            </p>
          </div>
        </div>
      </ExamLockQuestionResponseLayout>
    </section>
  )
}
