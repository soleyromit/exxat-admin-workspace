"use client"

import * as React from "react"

import type { ExamLockInterruptionPanelProps } from "@/components/exam-lock/exam-lock-interruption-panel"
import { EXAM_LOCK_INTERRUPTION_PRESETS } from "@/components/exam-lock/exam-lock-interruption-presets"
import {
  DEFAULT_EXAM_LOCK_INTERRUPTION_POLICY,
  type ExamLockInterruptionPolicy,
  type ExamLockPauseReason,
  type ExamLockSessionState,
} from "@/components/exam-lock/exam-lock-session-types"
import { useNetworkStatus } from "@/hooks/use-network-status"

const HARD_PAUSE_REASONS = new Set<ExamLockPauseReason>([
  "offline",
  "degraded",
  "visibility_hidden",
  "leave_attempt",
  "idle_timeout",
  "fullscreen_exit",
  "sync_failed",
  "policy_violation",
])

export interface UseExamLockSessionControllerOptions {
  initialSeconds: number
  sessionActive: boolean
  submitted?: boolean
  policy?: Partial<ExamLockInterruptionPolicy>
  /** Demo / test hook — treated like browser offline. */
  forceOffline?: boolean
  /** Demo / test hook — force a specific technical pause reason. */
  forceTechnicalPause?: Extract<ExamLockPauseReason, "offline" | "degraded" | "sync_failed">
  /** Demo / test hook — treated like tab hidden. */
  forceVisibilityHidden?: boolean
  onPause?: (reason: ExamLockPauseReason) => void
  onResume?: () => void
  onTimeExpired?: () => void
  /** Student raised hand during a hard pause. */
  handRaised?: boolean
  onRaiseHand?: () => void
  onLowerHand?: () => void
  onConnectWithPerson?: () => void
}

function severityForReason(reason: ExamLockPauseReason): "hard" | "terminal" {
  if (reason === "time_expired" || reason === "session_revoked") return "terminal"
  return "hard"
}

export function useExamLockSessionController({
  initialSeconds,
  sessionActive,
  submitted = false,
  policy: policyOverrides,
  forceOffline = false,
  forceTechnicalPause,
  forceVisibilityHidden = false,
  onPause,
  onResume,
  onTimeExpired,
  handRaised = false,
  onRaiseHand,
  onLowerHand,
  onConnectWithPerson,
}: UseExamLockSessionControllerOptions) {
  const policy = React.useMemo(
    () => ({ ...DEFAULT_EXAM_LOCK_INTERRUPTION_POLICY, ...policyOverrides }),
    [policyOverrides],
  )
  const { offline: browserOffline } = useNetworkStatus()

  const [secondsRemaining, setSecondsRemaining] = React.useState(initialSeconds)
  const [pauseReason, setPauseReason] = React.useState<ExamLockPauseReason | null>(null)
  const [pausedAtSeconds, setPausedAtSeconds] = React.useState<number | null>(null)
  const [violationCount, setViolationCount] = React.useState(0)
  const pauseReasonRef = React.useRef<ExamLockPauseReason | null>(null)
  /** Live countdown interval, so the expiry effect can stop the clock. */
  const tickRef = React.useRef<number | null>(null)
  /** `onTimeExpired` is a one-shot per session, not once per re-render. */
  const timeExpiredRef = React.useRef(false)
  /** Pause reasons the student dismissed via Retry — suppress auto re-pause until trigger clears. */
  // `useRef` takes a value, not a factory, so `useRef(new Set())` would build a
  // Set on every render and throw all but the first away. It starts null and is
  // filled on first write below.
  const manualDismissRef = React.useRef<Set<ExamLockPauseReason> | null>(null)

  const offline = browserOffline || forceOffline

  const timerPaused = pauseReason != null && HARD_PAUSE_REASONS.has(pauseReason)
  const phase = submitted ? "submitted" : timerPaused ? "paused" : "active"

  const pause = React.useCallback(
    (reason: ExamLockPauseReason) => {
      if (submitted) return
      // Deduped on the ref rather than inside the updater. The ref tracks the
      // active reason synchronously, so a second call in the same tick still
      // no-ops — and everything below (ref write, sibling updates, callback)
      // is a side effect that must not sit in an updater React can replay.
      if (pauseReasonRef.current === reason) return

      pauseReasonRef.current = reason
      setPauseReason(reason)
      setPausedAtSeconds(current => current ?? secondsRemaining)
      if (reason === "visibility_hidden" || reason === "leave_attempt") {
        setViolationCount(count => count + 1)
      }
      onPause?.(reason)
    },
    [onPause, secondsRemaining, submitted],
  )

  const resume = React.useCallback(
    (options?: { manual?: boolean }) => {
      if (submitted) return
      const reason = pauseReasonRef.current
      setPauseReason(null)
      pauseReasonRef.current = null
      setPausedAtSeconds(null)
      if (options?.manual && reason) {
        (manualDismissRef.current ??= new Set()).add(reason)
      }
      onResume?.()
    },
    [onResume, submitted],
  )

  React.useEffect(() => {
    if (!sessionActive || submitted || timerPaused) return
    // The tick only computes the next value. Stopping the clock and telling
    // the caller time is up are side effects, so they live in the effect
    // below, keyed off the count reaching zero.
    const id = window.setInterval(() => {
      setSecondsRemaining(prev => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    tickRef.current = id
    return () => {
      window.clearInterval(id)
      tickRef.current = null
    }
  }, [sessionActive, submitted, timerPaused])

  React.useEffect(() => {
    if (!sessionActive || submitted || secondsRemaining !== 0) return
    if (tickRef.current != null) {
      window.clearInterval(tickRef.current)
      tickRef.current = null
    }
    if (timeExpiredRef.current) return
    timeExpiredRef.current = true
    onTimeExpired?.()
  }, [secondsRemaining, sessionActive, submitted, onTimeExpired])

  React.useEffect(() => {
    if (!sessionActive || submitted) return
    if (secondsRemaining === 0 && !timerPaused) {
      pause("time_expired")
    }
  }, [secondsRemaining, sessionActive, submitted, timerPaused, pause])

  React.useEffect(() => {
    if (!sessionActive || submitted || !policy.pauseOnOffline) return
    const reason = forceTechnicalPause ?? "offline"
    if (offline) {
      if (!manualDismissRef.current?.has(reason)) {
        pause(reason)
      }
    } else {
      manualDismissRef.current?.delete("offline")
      manualDismissRef.current?.delete("degraded")
      manualDismissRef.current?.delete("sync_failed")
      if (
        pauseReasonRef.current === "offline" ||
        pauseReasonRef.current === "degraded" ||
        pauseReasonRef.current === "sync_failed"
      ) {
        resume()
      }
    }
  }, [offline, forceTechnicalPause, sessionActive, submitted, policy.pauseOnOffline, pause, resume])

  React.useEffect(() => {
    if (!sessionActive || submitted || !offline || !forceTechnicalPause) return
    if (manualDismissRef.current?.has(forceTechnicalPause)) return
    pause(forceTechnicalPause)
  }, [forceTechnicalPause, offline, sessionActive, submitted, pause])

  React.useEffect(() => {
    if (!sessionActive || submitted || !policy.pauseOnVisibilityHidden) return

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        pause("visibility_hidden")
      }
    }

    document.addEventListener("visibilitychange", onVisibility)
    if (forceVisibilityHidden) {
      if (!manualDismissRef.current?.has("visibility_hidden")) {
        pause("visibility_hidden")
      }
    } else if (pauseReasonRef.current === "visibility_hidden") {
      manualDismissRef.current?.delete("visibility_hidden")
      resume()
    }
    return () => document.removeEventListener("visibilitychange", onVisibility)
  }, [forceVisibilityHidden, sessionActive, submitted, policy.pauseOnVisibilityHidden, pause, resume])

  const state: ExamLockSessionState = {
    phase,
    pauseReason,
    severity: pauseReason ? severityForReason(pauseReason) : null,
    secondsRemaining,
    timerPaused,
    canResume: pauseReason != null && severityForReason(pauseReason) === "hard",
    violationCount,
  }

  const interruptionProps: ExamLockInterruptionPanelProps | null =
    pauseReason && sessionActive && !submitted
      ? (() => {
          const preset = EXAM_LOCK_INTERRUPTION_PRESETS[pauseReason]
          const hard = severityForReason(pauseReason) === "hard"
          return {
            open: true,
            pauseReason,
            severity: severityForReason(pauseReason),
            pausedAtSeconds: pausedAtSeconds ?? secondsRemaining,
            primaryAction:
              hard && onRaiseHand
                ? {
                    label: handRaised
                      ? "Hand raised"
                      : preset.primaryActionLabel ?? "Raise hand",
                    raised: handRaised,
                    disabled: handRaised && onLowerHand == null,
                    onClick: () => {
                      if (handRaised) {
                        onLowerHand?.()
                        return
                      }
                      onRaiseHand()
                      onConnectWithPerson?.()
                    },
                  }
                : undefined,
            supportActions: hard
              ? {
                  retry: {
                    label: preset.retryActionLabel ?? "Retry",
                    onClick: () => {
                      resume({ manual: true })
                    },
                  },
                  connectWithPerson: onConnectWithPerson
                    ? { onConnect: onConnectWithPerson }
                    : undefined,
                }
              : undefined,
          }
        })()
      : null

  return {
    state,
    pause,
    resume,
    interruptionProps,
    sessionPaused: timerPaused,
  }
}
