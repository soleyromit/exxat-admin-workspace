"use client"

/**
 * ListPageBoardCard — single board-card shell for all list hubs (Placements, Team, Compliance, …).
 *
 * Information hierarchy (top → bottom):
 * 1. **Title row** — `ListPageBoardCardTitleRow` — primary label (`text-sm font-semibold`), optional `trailing` (`ListPageBoardCardAvatar` initials chip, same as Placements).
 * 2. **Badge row** — `ListPageBoardCardBadgeRow` — optional status / tags (`flex-wrap`).
 * 3. **Body** — `ListPageBoardCardBody` — primary facts: icon rows, two-line blocks (`BoardCardIconRow` / `BoardCardTwoLineBlock` from board-card-primitives).
 * 4. **Secondary** — `ListPageBoardCardSecondary` — optional muted supporting line (`text-xs text-muted-foreground`).
 *
 * Styling matches **`BoardPlacementCard`**: `Card` `size="sm"`, ring, hover shadow, optional **new** ring accent.
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"

export type ListPageBoardCardProps = {
  /** Entire card is clickable (e.g. open detail). */
  onClick?: () => void
  className?: string
  style?: React.CSSProperties
  /** Subtle brand ring — e.g. newly created row. */
  isNew?: boolean
  children: React.ReactNode
}

export function ListPageBoardCard({
  onClick,
  className,
  style,
  isNew,
  children,
}: ListPageBoardCardProps) {
  return (
    <Card
      size="sm"
      className={cn(
        "gap-1 transition-shadow",
        onClick && "cursor-pointer hover:shadow-md",
        isNew && "ring-brand/30",
        className,
      )}
      style={style}
      onClick={onClick}
    >
      {children}
    </Card>
  )
}

export function ListPageBoardCardHeader({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <CardHeader className={cn("gap-2 pb-2", className)}>{children}</CardHeader>
}

/**
 * Level 1 — Primary title (dominant text on the card).
 */
export function ListPageBoardCardTitleRow({
  title,
  titleClassName,
  trailing,
}: {
  title: React.ReactNode
  /** Extra classes on the title (e.g. line-clamp from `lineClampClass`). */
  titleClassName?: string
  /** End-aligned: avatar, icon, etc. */
  trailing?: React.ReactNode
}) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-2">
      <div className="min-w-0 flex-1">
        <CardTitle
          className={cn(
            "break-words text-sm font-semibold leading-snug text-foreground",
            titleClassName,
          )}
        >
          {title}
        </CardTitle>
      </div>
      {trailing}
    </div>
  )
}

/** Initials avatar — same tokens as Placements board + Team table name column. */
export function ListPageBoardCardAvatar({
  initials,
  className,
}: {
  initials: string
  className?: string
}) {
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
        className,
      )}
      style={{
        background: "var(--avatar-initials-bg)",
        color: "var(--avatar-initials-fg)",
      }}
      aria-hidden
    >
      {initials}
    </span>
  )
}

/**
 * Level 2 — Status / metadata chips (below title, above primary body).
 */
export function ListPageBoardCardBadgeRow({ children }: { children: React.ReactNode }) {
  return <div className="flex min-w-0 flex-wrap items-center gap-1.5">{children}</div>
}

/**
 * Level 3 — Main facts: compose with `BoardCardIconRow`, `BoardCardTwoLineBlock`, etc.
 */
export function ListPageBoardCardBody({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <div className={cn("flex flex-col gap-2", className)}>{children}</div>
}

/**
 * Level 4 — Optional muted supporting line (caption, hint, extra context).
 */
export function ListPageBoardCardSecondary({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <p className={cn("text-xs text-muted-foreground leading-snug", className)}>{children}</p>
  )
}
