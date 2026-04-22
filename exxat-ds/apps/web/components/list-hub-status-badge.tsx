"use client"

/**
 * Consistent status chip for list hubs (Team, Compliance, Question bank, future entities).
 * Pair label + tint + icon from `lib/list-status-badges.ts`; do not hand-roll Badge markup per page.
 */

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

/** Table column + list view rows — same shell as Team / Compliance / Question bank grids. */
export const LIST_HUB_STATUS_BADGE_TABLE_SHELL =
  "inline-flex items-center gap-1 text-xs font-medium"

/** Kanban card badge row — fixed height, no default outline border clash. */
export const LIST_HUB_STATUS_BADGE_BOARD_SHELL =
  "inline-flex h-6 items-center gap-1 border-0 px-2 py-1 text-xs font-medium leading-none shadow-none"

export interface ListHubStatusBadgeProps {
  label: string
  /** Tails from `*_STATUS_BADGE_CLASS` in `@/lib/list-status-badges` */
  tintClassName: string
  /** Font Awesome icon class suffix, e.g. `fa-circle-check` (paired with `fa-light` here). */
  icon: string
  /** `table` — DataTable cells and list rows; `board` — `ListPageBoardCardBadgeRow`. */
  surface?: "table" | "board"
  className?: string
}

export function ListHubStatusBadge({
  label,
  tintClassName,
  icon,
  surface = "table",
  className,
}: ListHubStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        surface === "board" ? LIST_HUB_STATUS_BADGE_BOARD_SHELL : LIST_HUB_STATUS_BADGE_TABLE_SHELL,
        tintClassName,
        className,
      )}
    >
      <i className={`fa-light ${icon} text-[11px]`} aria-hidden="true" />
      {label}
    </Badge>
  )
}
