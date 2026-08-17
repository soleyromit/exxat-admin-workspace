"use client"

/**
 * ExamLockSessionAlert — soft, non-blocking session messaging inside the lock shell.
 *
 * Use for recoverable delivery notices (sync lag, background save status) — not hard
 * integrity pauses. Offline / tab-blur / leave-attempt pauses belong in
 * `ExamLockInterruptionPanel` via `useExamLockSessionController`.
 */

import * as React from "react"

import { LocalBanner } from "@/components/ui/banner"
import { cn } from "@/lib/utils"

export type ExamLockSessionAlertKind =
  | "offline"
  | "degraded"
  | "error"
  | "info"
  | "syncing"

const KIND_PRESETS: Record<
  ExamLockSessionAlertKind,
  {
    variant: "info" | "warning" | "error" | "success"
    icon: string
    defaultTitle: string
  }
> = {
  offline: {
    variant: "warning",
    icon: "fa-wifi-slash",
    defaultTitle: "Connection lost",
  },
  degraded: {
    variant: "warning",
    icon: "fa-triangle-exclamation",
    defaultTitle: "Unstable connection",
  },
  error: {
    variant: "error",
    icon: "fa-circle-exclamation",
    defaultTitle: "Exxat could not save your last answer",
  },
  info: {
    variant: "info",
    icon: "fa-circle-info",
    defaultTitle: "Session notice",
  },
  syncing: {
    variant: "info",
    icon: "fa-arrows-rotate",
    defaultTitle: "Saving your work",
  },
}

export interface ExamLockSessionAlertProps {
  kind: ExamLockSessionAlertKind
  title?: string
  children: React.ReactNode
  /** Retry / reconnect — shown as a compact button (not dismiss). */
  onRetry?: () => void
  retryLabel?: string
  dismissible?: boolean
  onDismiss?: () => void
  className?: string
}

export function ExamLockSessionAlert({
  kind,
  title,
  children,
  onRetry,
  retryLabel = "Try again",
  dismissible = false,
  onDismiss,
  className,
}: ExamLockSessionAlertProps) {
  const preset = KIND_PRESETS[kind]

  return (
    <LocalBanner
      variant={preset.variant}
      title={title ?? preset.defaultTitle}
      icon={preset.icon}
      dismissible={dismissible}
      onDismiss={onDismiss}
      retry={onRetry ? { label: retryLabel, onClick: onRetry } : undefined}
      className={cn(
        "rounded-lg border px-3 py-2 text-xs shadow-none sm:text-sm",
        "[&_p]:mb-0 [&_p]:text-xs [&_p]:leading-snug sm:[&_p]:text-sm",
        className,
      )}
    >
      {children}
    </LocalBanner>
  )
}
