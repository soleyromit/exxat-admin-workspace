"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Shortcut } from "@/components/ui/dropdown-menu"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tip } from "@/components/ui/tip"
import { cn } from "@/lib/utils"

import type { ExamLockStemMedia } from "./exam-lock-delivery-types"
import {
  EXAM_OPTION_LABEL_CLASS,
  EXAM_OPTION_LETTERS,
  EXAM_OPTION_ROW,
  examOptionIndexClass,
} from "./exam-lock-option-primitives"
import { ExamLockQuestionStem, ExamLockQuestionResponseLayout } from "./exam-lock-question-stem"

export interface ExamLockMcqQuestionProps {
  questionNumber: number
  questionId: string
  stem: string
  stemMedia?: ExamLockStemMedia
  options: readonly string[]
  value: string
  onValueChange: (value: string) => void
  eliminatedOptions?: readonly string[]
  onToggleEliminated?: (option: string) => void
  allowEliminate?: boolean
  allowClear?: boolean
  shortcutsDisabled?: boolean
  className?: string
}

export function ExamLockMcqQuestion({
  questionNumber,
  questionId,
  stem,
  stemMedia,
  options,
  value,
  onValueChange,
  eliminatedOptions = [],
  onToggleEliminated,
  allowEliminate = true,
  allowClear = true,
  shortcutsDisabled = false,
  className,
}: ExamLockMcqQuestionProps) {
  const headingId = `${questionId}-heading`
  const eliminatedSet = React.useMemo(() => new Set(eliminatedOptions), [eliminatedOptions])

  const selectByIndex = React.useCallback(
    (index: number) => {
      const option = options[index]
      if (!option) return
      if (allowClear && value === option) {
        onValueChange("")
        return
      }
      onValueChange(option)
    },
    [allowClear, options, onValueChange, value],
  )

  const clearAnswer = React.useCallback(() => {
    onValueChange("")
  }, [onValueChange])

  return (
    <section
      aria-labelledby={headingId}
      className={cn("flex flex-col gap-5", className)}
    >
      {options.map((option, index) => {
        const letter = EXAM_OPTION_LETTERS[index]
        if (!letter) return null
        return (
          <Shortcut
            key={`${questionId}-letter-${letter}`}
            keys={letter}
            disabled={shortcutsDisabled}
            onInvoke={() => selectByIndex(index)}
          />
        )
      })}

      <ExamLockQuestionStem
        questionNumber={questionNumber}
        stem={stem}
        headingId={headingId}
      />

      <ExamLockQuestionResponseLayout stemMedia={stemMedia}>
      <RadioGroup
        value={value}
        onValueChange={onValueChange}
        className="space-y-2"
        aria-label="Answer choices"
      >
        {options.map((option, index) => {
          const letter = EXAM_OPTION_LETTERS[index] ?? `${index + 1}`
          const optionId = `${questionId}-opt-${index}`
          const selected = value === option
          const eliminated = eliminatedSet.has(option)
          const ruleOutLabel = eliminated
            ? `Restore option ${letter}`
            : `Rule out option ${letter}`

          return (
            <div
              key={optionId}
              className={cn(
                "group/option-row",
                EXAM_OPTION_ROW,
                eliminated && "border-dashed border-border/80 bg-muted/20 opacity-80",
                !eliminated && "hover:bg-muted/55",
                selected &&
                  !eliminated && [
                    "border-brand/45 bg-brand/8 ring-1 ring-inset ring-brand/25",
                    "hc:border-foreground hc:bg-muted hc:ring-foreground",
                  ],
              )}
            >
              <label
                htmlFor={optionId}
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-2"
              >
                <span className={examOptionIndexClass(selected, eliminated)} aria-hidden="true">
                  {selected && !eliminated ? (
                    <i
                      className="fa-solid fa-check text-xs leading-none"
                      aria-hidden="true"
                    />
                  ) : (
                    letter
                  )}
                </span>
                <span
                  className={cn(
                    EXAM_OPTION_LABEL_CLASS,
                    eliminated
                      ? "text-muted-foreground line-through decoration-muted-foreground/70"
                      : "text-foreground",
                  )}
                >
                  {option}
                </span>
                <RadioGroupItem
                  id={optionId}
                  value={option}
                  className="sr-only"
                  onClick={event => {
                    if (!allowClear || !selected) return
                    event.preventDefault()
                    clearAnswer()
                  }}
                />
              </label>
              {allowEliminate && onToggleEliminated ? (
                <Tip side="top" label={ruleOutLabel}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className={cn(
                      "icon-button-chrome shrink-0 transition-opacity",
                      eliminated
                        ? "opacity-100"
                        : "opacity-0 focus-visible:opacity-100 group-hover/option-row:opacity-100 group-focus-within/option-row:opacity-100",
                    )}
                    aria-label={ruleOutLabel}
                    aria-pressed={eliminated}
                    onClick={event => {
                      event.stopPropagation()
                      onToggleEliminated(option)
                    }}
                  >
                    <i
                      className={cn(
                        "fa-light text-xs",
                        eliminated ? "fa-rotate-left" : "fa-strikethrough",
                      )}
                      aria-hidden="true"
                    />
                  </Button>
                </Tip>
              ) : null}
            </div>
          )
        })}
      </RadioGroup>
      </ExamLockQuestionResponseLayout>
      {allowClear && value ? (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAnswer}
            aria-label="Clear answer for this question"
          >
            <i className="fa-light fa-xmark text-xs" aria-hidden="true" />
            Clear answer
          </Button>
        </div>
      ) : null}
    </section>
  )
}

export const ExamMcqQuestion = ExamLockMcqQuestion
export type ExamMcqQuestionProps = ExamLockMcqQuestionProps
