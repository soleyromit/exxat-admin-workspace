"use client"

import { cn } from "@/lib/utils"

export interface ExamLockAnswerProgressProps {
  answered: number
  total: number
  /** Flush to the top edge of the main card (no radius gap above). */
  variant?: "default" | "card-top"
  className?: string
}

/** Answered-question progress bar for exam lock delivery. */
export function ExamLockAnswerProgress({
  answered,
  total,
  variant = "default",
  className,
}: ExamLockAnswerProgressProps) {
  const pct = total === 0 ? 0 : Math.round((answered / total) * 100)
  const cardTop = variant === "card-top"
  return (
    <div className={cn("w-full min-w-0", className)}>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={`${answered} of ${total} questions answered`}
        className={cn(
          "h-2 overflow-hidden bg-muted",
          cardTop ? "rounded-none" : "rounded-full",
        )}
      >
        <div
          className={cn(
            "h-full bg-brand transition-[width]",
            cardTop ? "rounded-none" : "rounded-full",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
