"use client"

/**
 * ExamLockInterruptionPanel — pause surface behind the sliding question card.
 *
 * Recoverable pauses use one generic screen. Action pairs match `DialogFooter`:
 * Retry (ghost) left, **Raise hand (filled primary) right** — pin with `sm:order-1` / `sm:order-2`.
 */

import * as React from "react"

import {
  EXAM_LOCK_INTERRUPTION_CATEGORY_CHROME,
  EXAM_LOCK_INTERRUPTION_PRESETS,
  examLockInterruptionCategory,
} from "@/components/exam-lock/exam-lock-interruption-presets"
import { ExamLockCautionStrip } from "@/components/exam-lock/exam-lock-caution-strip"
import { ExamLockTimerDisplay } from "@/components/exam-lock/exam-lock-timer-display"
import type { ExamLockPauseReason } from "@/components/exam-lock/exam-lock-session-types"
import { LocalBanner } from "@/components/ui/banner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface ExamLockInterruptionSupportActions {
  retry?: {
    label?: string
    onClick: () => void
    disabled?: boolean
  }
  connectWithPerson?: {
    label?: string
    onConnect: () => void
  }
}

export interface ExamLockInterruptionPanelProps {
  open: boolean
  pauseReason: ExamLockPauseReason
  severity?: "hard" | "terminal"
  title?: string
  description?: React.ReactNode
  pausedAtSeconds: number
  primaryAction?: {
    label: string
    onClick: () => void
    disabled?: boolean
    /** When true, shows the raised-hand confirmation state. */
    raised?: boolean
  }
  supportActions?: ExamLockInterruptionSupportActions
  className?: string
}

export function ExamLockInterruptionPanel({
  open,
  pauseReason,
  severity = "hard",
  title,
  description,
  pausedAtSeconds,
  primaryAction,
  supportActions,
  className,
}: ExamLockInterruptionPanelProps) {
  const primaryRef = React.useRef<HTMLButtonElement>(null)
  const preset = EXAM_LOCK_INTERRUPTION_PRESETS[pauseReason]
  const category = examLockInterruptionCategory(pauseReason, severity)
  const chrome = EXAM_LOCK_INTERRUPTION_CATEGORY_CHROME[category]
  const recoverable = category === "technical" || category === "integrity"

  React.useEffect(() => {
    if (!open) return
    const id = window.requestAnimationFrame(() => primaryRef.current?.focus())
    return () => window.cancelAnimationFrame(id)
  }, [open, primaryAction?.label])

  if (!open) return null

  const terminal = category === "terminal"
  const resolvedTitle = title ?? preset.title
  const resolvedDescription = description ?? preset.description
  const showCautionStrips = preset.cautionStrips === true
  const retry = !terminal ? supportActions?.retry : undefined
  const handRaised = primaryAction?.raised === true
  const showActions = !terminal && (primaryAction != null || retry != null)
  const retryLabel = retry?.label ?? preset.retryActionLabel ?? "Retry"
  const supportRequestedMessage =
    preset.supportRequestedMessage ??
    "Hand raised. Someone from your program will check in with you shortly."

  return (
    <section
      aria-labelledby="exam-lock-interruption-title"
      aria-describedby="exam-lock-interruption-desc"
      className={cn(
        "absolute inset-0 flex min-w-0 flex-col overflow-hidden",
        chrome.surface,
        className,
      )}
    >
      {showCautionStrips ? <ExamLockCautionStrip /> : null}

      {recoverable ? (
        <LocalBanner
          variant="warning"
          icon="fa-circle-pause"
          dismissible={false}
          className="w-full shrink-0 items-center justify-center rounded-none border-x-0 border-t-0 px-4 py-2.5 text-center shadow-none md:px-6 sm:text-sm [&>div]:flex-none"
        >
          Timer stopped · Answers saved on this device
        </LocalBanner>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="flex w-full flex-1 flex-col items-center justify-center px-6 py-8 md:px-12 md:py-10">
          <div className="mx-auto w-full max-w-lg">
            <div className="flex flex-col items-center text-center">
              <span className="relative flex size-20 shrink-0 items-center justify-center" aria-hidden="true">
                <span
                  className={cn(
                    "relative z-[1] flex size-20 items-center justify-center rounded-2xl border",
                    chrome.iconWrap,
                  )}
                >
                  <i
                    className={cn(
                      preset.iconStyle === "solid" ? "fa-solid" : "fa-light",
                      "text-3xl text-amber-600 dark:text-amber-400",
                      preset.icon,
                    )}
                  />
                </span>
                <span
                  className="absolute inset-0 rounded-2xl ring-2 ring-amber-500/35 motion-safe:animate-ping motion-reduce:hidden"
                  aria-hidden="true"
                />
              </span>

              <h2
                id="exam-lock-interruption-title"
                className="mt-6 max-w-md text-2xl font-semibold tracking-tight text-foreground font-heading sm:text-3xl"
              >
                {resolvedTitle}
              </h2>

              <p
                id="exam-lock-interruption-desc"
                className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base"
              >
                {resolvedDescription}
              </p>
            </div>

            {preset.steps && recoverable ? (
              <div className="mx-auto mt-8 w-full max-w-md text-left">
                <p className="text-sm font-medium text-foreground">
                  {preset.stepsHeading ?? "What to try"}
                </p>
                <ol className="mt-3 space-y-3 text-sm text-foreground">
                  {preset.steps.map((step, index) => (
                    <li key={step} className="flex gap-3">
                      <span
                        className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold tabular-nums text-foreground ring-1 ring-border"
                        aria-hidden="true"
                      >
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1 leading-snug text-muted-foreground">
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            {!terminal ? (
              <p
                className="mt-8 text-center text-sm text-muted-foreground"
                role="status"
                aria-live="polite"
              >
                <span>Time remaining </span>
                <ExamLockTimerDisplay
                  secondsRemaining={pausedAtSeconds}
                  paused
                  showPausedBadge={false}
                  className="inline-flex font-mono font-semibold text-foreground"
                />
              </p>
            ) : null}

            {showActions ? (
              <div
                className="mx-auto mt-8 flex w-full flex-col-reverse items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:justify-center"
                data-slot="exam-lock-action-row"
              >
                {retry ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="lg"
                    disabled={retry.disabled}
                    onClick={retry.onClick}
                    className="min-h-12 w-full gap-2 sm:order-1 sm:w-auto sm:min-w-[12rem]"
                  >
                    <i className="fa-light fa-arrows-rotate text-sm" aria-hidden="true" />
                    {retryLabel}
                  </Button>
                ) : null}
                {primaryAction ? (
                  <Button
                    ref={primaryRef}
                    type="button"
                    variant="default"
                    size="lg"
                    aria-pressed={handRaised}
                    disabled={primaryAction.disabled}
                    onClick={primaryAction.onClick}
                    className="min-h-12 w-full gap-2 sm:order-2 sm:w-auto sm:min-w-[12rem]"
                  >
                    <i
                      className={cn(
                        handRaised ? "fa-solid fa-hand" : "fa-light fa-hand",
                        "text-sm",
                      )}
                      aria-hidden="true"
                    />
                    {primaryAction.label}
                  </Button>
                ) : null}
              </div>
            ) : null}

            {handRaised ? (
              <p className="mt-4 text-center text-sm text-muted-foreground" role="status" aria-live="polite">
                {supportRequestedMessage}
              </p>
            ) : preset.supportFootnote && recoverable && !handRaised ? (
              <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
                {preset.supportFootnote}
              </p>
            ) : null}

            {terminal ? (
              <p className="mt-10 text-center text-sm text-muted-foreground" role="status">
                If you need assistance, contact your program coordinator.
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {showCautionStrips ? <ExamLockCautionStrip className="mt-auto" /> : null}
    </section>
  )
}
