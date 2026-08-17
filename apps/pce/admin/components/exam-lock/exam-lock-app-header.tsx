"use client"

import * as React from "react"

import { ExxatProductMark } from "@/components/exxat-product-logo"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { STATUS_BADGE_TONE_CLASS } from "@/components/ui/status-badge"
import { Tip } from "@/components/ui/tip"
import { useProduct } from "@/contexts/product-context"
import { initialsFromDisplayName } from "@/lib/initials-from-name"
import { cn } from "@/lib/utils"

export interface ExamLockLearnerIdentity {
  name: string
  avatar?: string
}

export interface ExamLockAppHeaderProps {
  title: string
  subtitle?: React.ReactNode
  timer?: React.ReactNode
  headerToolbar?: React.ReactNode
  headerActions?: React.ReactNode
  learner?: ExamLockLearnerIdentity
  /** Mutes header chrome when the session controller has frozen the attempt. */
  sessionPaused?: boolean
  className?: string
}

function ExamLockTimer({
  children,
  paused = false,
}: {
  children: React.ReactNode
  paused?: boolean
}) {
  return (
    <div
      className={cn(
        "flex h-8 shrink-0 items-center gap-1.5 rounded-2 border px-2 py-0 font-mono text-xs font-bold tabular-nums sm:text-sm",
        paused
          ? cn("border-amber-500/25", STATUS_BADGE_TONE_CLASS.warning)
          : "border-border bg-secondary text-foreground",
      )}
      role="timer"
      aria-live="polite"
    >
      <i className="fa-light fa-clock" aria-hidden="true" />
      {children}
    </div>
  )
}

function ExamLockLearnerAvatar({ name, avatar }: ExamLockLearnerIdentity) {
  return (
    <Tip label={name} side="bottom">
      <span
        tabIndex={0}
        className="inline-flex shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        role="img"
        aria-label={name}
      >
        <Avatar className="size-7">
          {avatar ? (
            <AvatarImage src={avatar} alt="" referrerPolicy="no-referrer" />
          ) : null}
          <AvatarFallback className="bg-secondary text-xs font-medium text-secondary-foreground">
            {initialsFromDisplayName(name)}
          </AvatarFallback>
        </Avatar>
      </span>
    </Tip>
  )
}

/**
 * Locked assessment app header — full-width toolbar for exam delivery.
 * Lives inside `ExamLockTemplate` only (not the global system banner slot).
 */
export function ExamLockAppHeader({
  title,
  subtitle,
  timer,
  headerToolbar,
  headerActions,
  learner,
  sessionPaused = false,
  className,
}: ExamLockAppHeaderProps) {
  const { product } = useProduct()

  return (
    <header
      className={cn("flex h-10 min-h-10 shrink-0 items-center px-4 md:px-5", className)}
    >
      <div className="flex min-w-0 flex-1 items-center justify-between gap-2 sm:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <ExxatProductMark product={product} className="size-6 shrink-0 sm:size-7" />
          <div className="min-w-0 flex-1">
            <h1
              className="truncate text-sm font-semibold tracking-tight text-foreground sm:text-base font-heading"
            >
              {title}
            </h1>
            {subtitle ? (
              <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
        </div>
        <div className="flex min-w-0 shrink-0 items-center justify-end gap-1">
          {headerToolbar ? (
            <div className="flex shrink-0 items-center">{headerToolbar}</div>
          ) : null}
          {timer ? <ExamLockTimer paused={sessionPaused}>{timer}</ExamLockTimer> : null}
          {headerActions}
          {learner ? <ExamLockLearnerAvatar {...learner} /> : null}
        </div>
      </div>
    </header>
  )
}
