"use client"

import type * as React from "react"

import { cn } from "@/lib/utils"

import type { ExamLockStemMedia } from "./exam-lock-delivery-types"
import { ExamLockStemFigure } from "./exam-lock-stem-figure"

export interface ExamLockQuestionStemProps {
  questionNumber: number
  stem: string
  headingId: string
  className?: string
}

/** Mono `Q1` prefix — inline at the start of the question prompt. */
export function ExamLockQuestionIndex({
  questionNumber,
  className,
}: {
  questionNumber: number
  headingId?: string
  className?: string
}) {
  return (
    <span
      className={cn(
        "font-mono font-medium tabular-nums text-muted-foreground",
        className,
      )}
    >
      Q{questionNumber}
    </span>
  )
}

/** Question prompt — `Q#` prefix inline, then stem text. */
export function ExamLockQuestionStem({
  questionNumber,
  stem,
  headingId,
  className,
}: ExamLockQuestionStemProps) {
  return (
    <h2
      id={headingId}
      className={cn(
        "text-lg font-semibold leading-snug tracking-tight text-foreground md:text-xl",
        className,
      )}
    >
      <ExamLockQuestionIndex
        questionNumber={questionNumber}
        className="text-base md:text-lg"
      />
      {stem ? (
        <>
          {" "}
          <span className="font-sans font-semibold">{stem}</span>
        </>
      ) : null}
    </h2>
  )
}

export interface ExamLockQuestionResponseLayoutProps {
  stemMedia?: ExamLockStemMedia
  children: React.ReactNode
  className?: string
}

/**
 * Below the stem: figure beside the response control (options, inputs, essay).
 * Stacks on narrow viewports; side-by-side from `md` up.
 */
export function ExamLockQuestionResponseLayout({
  stemMedia,
  children,
  className,
}: ExamLockQuestionResponseLayoutProps) {
  if (!stemMedia) {
    return <div className={cn("min-w-0", className)}>{children}</div>
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-5 md:flex-row md:items-start md:gap-6",
        className,
      )}
    >
      <div className="min-w-0 shrink-0 md:w-[min(52%,28rem)] lg:w-[min(50%,34rem)] xl:w-[min(48%,38rem)]">
        <ExamLockStemFigure media={stemMedia} />
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
