import type { ExamLockPauseReason } from "@/components/exam-lock/exam-lock-session-types"
import { STATUS_BADGE_TONE_CLASS } from "@/components/ui/status-badge"

/** How the pause screen reads to the student: policy vs connectivity vs terminal. */
export type ExamLockInterruptionCategory = "integrity" | "technical" | "terminal"

const INTEGRITY_REASONS = new Set<ExamLockPauseReason>([
  "visibility_hidden",
  "leave_attempt",
  "idle_timeout",
  "fullscreen_exit",
  "policy_violation",
])

const TECHNICAL_REASONS = new Set<ExamLockPauseReason>([
  "offline",
  "degraded",
  "sync_failed",
])

export function examLockInterruptionCategory(
  reason: ExamLockPauseReason,
  severity: "hard" | "terminal",
): ExamLockInterruptionCategory {
  if (severity === "terminal" || reason === "time_expired" || reason === "session_revoked") {
    return "terminal"
  }
  if (INTEGRITY_REASONS.has(reason)) return "integrity"
  if (TECHNICAL_REASONS.has(reason)) return "technical"
  return "technical"
}

export interface ExamLockInterruptionPreset {
  icon: string
  iconStyle: "solid" | "light"
  title: string
  description: string
  steps?: string[]
  stepsHeading?: string
  primaryActionLabel?: string
  retryActionLabel?: string
  supportFootnote?: string
  supportRequestedMessage?: string
  cautionStrips?: boolean
}

const GENERIC_INTEGRITY_COPY = {
  title: "Exam paused",
  description:
    "The timer is stopped. Select Retry and enter the proctor password to return to your attempt, or raise your hand if you want someone from your program.",
  primaryActionLabel: "Raise hand",
  retryActionLabel: "Retry",
} as const

/** One recoverable pause screen for every delivery interruption (offline, sync, etc.). */
const GENERIC_RECOVERABLE_PAUSE: ExamLockInterruptionPreset = {
  icon: "fa-circle-pause",
  iconStyle: "light",
  title: "Exam paused",
  description:
    "The timer is stopped and your answers are saved on this device. Select Retry and enter the proctor password to resume, or raise your hand if you need someone from your program.",
  stepsHeading: "What to try",
  steps: [
    "Stay on this page. Do not refresh or close the window.",
    "Check your internet connection if pages or answers are not loading.",
    "Select Retry, then enter the proctor password to resume.",
    "Select Raise hand if you still need assistance from your program.",
  ],
  primaryActionLabel: "Raise hand",
  retryActionLabel: "Retry",
  supportFootnote:
    "If the issue continues, raise your hand. A proctor can restore your session or note an incident for your program.",
  supportRequestedMessage:
    "Hand raised. Someone from your program will join you here. Your timer stays paused until the issue is resolved.",
}

export const EXAM_LOCK_INTERRUPTION_PRESETS: Record<
  ExamLockPauseReason,
  ExamLockInterruptionPreset
> = {
  offline: { ...GENERIC_RECOVERABLE_PAUSE },
  degraded: { ...GENERIC_RECOVERABLE_PAUSE },
  sync_failed: { ...GENERIC_RECOVERABLE_PAUSE },
  visibility_hidden: {
    icon: "fa-shield-exclamation",
    iconStyle: "solid",
    ...GENERIC_INTEGRITY_COPY,
    cautionStrips: true,
  },
  leave_attempt: {
    icon: "fa-shield-exclamation",
    iconStyle: "solid",
    ...GENERIC_INTEGRITY_COPY,
    cautionStrips: true,
  },
  idle_timeout: {
    icon: "fa-hourglass-half",
    iconStyle: "solid",
    ...GENERIC_INTEGRITY_COPY,
  },
  fullscreen_exit: {
    icon: "fa-shield-exclamation",
    iconStyle: "solid",
    ...GENERIC_INTEGRITY_COPY,
    cautionStrips: true,
  },
  policy_violation: {
    icon: "fa-user-shield",
    iconStyle: "solid",
    ...GENERIC_INTEGRITY_COPY,
    cautionStrips: true,
  },
  time_expired: {
    icon: "fa-clock",
    iconStyle: "solid",
    title: "Time is up",
    description: "Your attempt is being submitted. Please wait on this page.",
  },
  session_revoked: {
    icon: "fa-ban",
    iconStyle: "solid",
    title: "Session ended",
    description:
      "This exam session is no longer active. Contact your program coordinator.",
  },
}

export const EXAM_LOCK_INTERRUPTION_CATEGORY_CHROME: Record<
  ExamLockInterruptionCategory,
  {
    /** Full-bleed pause surface inside `<main>` — inherits template paused wash when set. */
    surface: string
    iconWrap: string
  }
> = {
  integrity: {
    surface: "bg-transparent",
    iconWrap:
      "bg-[var(--icon-disc-chart-4-bg)] text-[var(--icon-disc-chart-4-fg)] ring-1 ring-border",
  },
  technical: {
    surface: "bg-transparent",
    iconWrap: `${STATUS_BADGE_TONE_CLASS.warning} border-amber-500/25`,
  },
  terminal: {
    surface: "bg-transparent",
    iconWrap:
      "bg-[var(--icon-disc-chart-4-bg)] text-[var(--icon-disc-chart-4-fg)] ring-1 ring-border",
  },
}
