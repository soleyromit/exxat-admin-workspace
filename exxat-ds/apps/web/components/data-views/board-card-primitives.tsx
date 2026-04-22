"use client"

/**
 * Reusable building blocks for kanban / board cards (icon rows, two-line blocks, placeholders).
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import type { BoardLineCount } from "@/lib/data-list-display-options"

export function BoardCardIconRow({
  iconClass,
  children,
}: {
  iconClass: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-2">
      <i
        className={cn(
          `fa-light ${iconClass} text-xs text-muted-foreground mt-0.5 w-4 shrink-0 text-center`,
        )}
        aria-hidden
      />
      <div className="min-w-0 flex-1 text-xs leading-snug [&_.text-sm]:text-xs [&_span]:text-xs [&_div]:text-xs">
        {children}
      </div>
    </div>
  )
}

export function BoardCardTwoLineBlock({
  iconClass,
  line1,
  line2,
  line2ClassName,
}: {
  iconClass: string
  line1: React.ReactNode
  /** Omitted for a single-line row (same icon + primary alignment as Placements). */
  line2?: React.ReactNode
  /** Override default muted line-2 (e.g. badges / rich cells). */
  line2ClassName?: string
}) {
  const showLine2 = line2 !== undefined && line2 !== null
  return (
    <div className="flex items-start gap-2">
      <i
        className={cn(
          `fa-light ${iconClass} text-xs text-muted-foreground mt-0.5 w-4 shrink-0 text-center`,
        )}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-medium text-foreground leading-tight">{line1}</div>
        {showLine2 ? (
          <div
            className={cn(
              "mt-0.5 min-w-0 leading-tight",
              line2ClassName ?? "truncate text-xs text-muted-foreground",
            )}
          >
            {line2}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function lineClampClass(n: BoardLineCount): string {
  const base = "min-w-0 overflow-hidden break-words"
  if (n === 1) return cn(base, "line-clamp-1")
  if (n === 2) return cn(base, "line-clamp-2")
  return cn(base, "line-clamp-3")
}

export function BoardNewCardPlaceholder({ position }: { position: "above" | "below" }) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-background/50 py-2 text-xs font-medium text-muted-foreground transition-colors",
        "hover:border-input hover:bg-muted/40 hover:text-foreground",
        position === "above" ? "mb-2" : "mt-2",
      )}
    >
      <i className="fa-light fa-plus text-xs" aria-hidden="true" />
      New card
    </button>
  )
}
