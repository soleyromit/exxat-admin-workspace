"use client"

import * as React from "react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import {
  blankIdForIndex,
  parseFillBlankStem,
  type ExamLockStemMedia,
} from "./exam-lock-delivery-types"
import { ExamLockQuestionIndex, ExamLockQuestionResponseLayout } from "./exam-lock-question-stem"

export interface ExamLockFillBlankQuestionProps {
  questionNumber: number
  questionId: string
  stem: string
  stemMedia?: ExamLockStemMedia
  blankIds?: readonly string[]
  value: Record<string, string>
  onValueChange: (value: Record<string, string>) => void
  formatHint?: string
  className?: string
}

export function ExamLockFillBlankQuestion({
  questionNumber,
  questionId,
  stem,
  stemMedia,
  blankIds,
  value,
  onValueChange,
  formatHint = "Type the missing word or phrase in each blank.",
  className,
}: ExamLockFillBlankQuestionProps) {
  const headingId = `${questionId}-heading`
  const parts = React.useMemo(() => parseFillBlankStem(stem), [stem])

  const setBlank = React.useCallback(
    (blankId: string, next: string) => {
      onValueChange({ ...value, [blankId]: next })
    },
    [onValueChange, value],
  )

  return (
    <section
      aria-labelledby={headingId}
      className={cn("flex flex-col gap-5", className)}
    >
      <ExamLockQuestionResponseLayout stemMedia={stemMedia}>
        <div className="flex flex-col gap-2">
          <p
            id={headingId}
            className="text-lg font-semibold leading-relaxed tracking-tight text-foreground md:text-xl"
          >
            <ExamLockQuestionIndex
              questionNumber={questionNumber}
              className="text-base md:text-lg"
            />{" "}
            {parts.map((part, index) => {
              if (part.kind === "text") {
                return (
                  <span key={`${questionId}-text-${index}`} className="whitespace-pre-wrap">
                    {part.text}
                  </span>
                )
              }
              const blankId = blankIdForIndex(part.blankIndex, blankIds)
              const inputId = `${questionId}-${blankId}`
              return (
                <span key={inputId} className="mx-1 inline-flex max-w-full align-baseline">
                  <Input
                    id={inputId}
                    value={value[blankId] ?? ""}
                    onChange={event => setBlank(blankId, event.target.value)}
                    aria-label={`Blank ${part.blankIndex + 1}`}
                    className="inline-block h-10 min-w-[8rem] max-w-full border-control-3 bg-background px-2 text-base font-medium md:text-lg"
                  />
                </span>
              )
            })}
          </p>
          <p
            id={`${questionId}-format-hint`}
            className="text-xs text-muted-foreground"
          >
            {formatHint}
          </p>
        </div>
      </ExamLockQuestionResponseLayout>
    </section>
  )
}
