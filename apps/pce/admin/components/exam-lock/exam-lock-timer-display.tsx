"use client"

import * as React from "react"

import { StatusBadge } from "@/components/ui/status-badge"
import { cn } from "@/lib/utils"

export function formatExamLockTimer(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds)
  const minutes = Math.floor(clamped / 60)
  const seconds = clamped % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

export interface ExamLockTimerDisplayProps {
  secondsRemaining: number
  paused?: boolean
  /** When false, omits the inline Paused badge (e.g. panel body where banner already states pause). */
  showPausedBadge?: boolean
  className?: string
}

/** Header timer value — optional PAUSED pill when the session controller has frozen the clock. */
export function ExamLockTimerDisplay({
  secondsRemaining,
  paused = false,
  showPausedBadge = true,
  className,
}: ExamLockTimerDisplayProps) {
  const label = formatExamLockTimer(secondsRemaining)
  const minutes = Math.floor(Math.max(0, secondsRemaining) / 60)
  const seconds = Math.max(0, secondsRemaining) % 60

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        className="tabular-nums"
        aria-label={
          paused
            ? `Time remaining, paused at ${minutes} minutes ${seconds} seconds`
            : `Time remaining, ${minutes} minutes ${seconds} seconds`
        }
      >
        {label}
      </span>
      {paused && showPausedBadge ? (
        <StatusBadge label="Paused" tone="warning" icon="fa-circle-pause" size="md" />
      ) : null}
    </span>
  )
}
