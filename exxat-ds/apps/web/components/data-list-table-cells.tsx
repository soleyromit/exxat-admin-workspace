"use client"

/**
 * Placement table cell primitives — extracted from data-list-table for reuse and easier testing.
 */

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tip } from "@/components/ui/tip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ListHubStatusBadge } from "@/components/list-hub-status-badge"
import {
  PLACEMENT_STATUS_BADGE_CLASS,
  PLACEMENT_STATUS_ICON,
  PLACEMENT_STATUS_LABEL,
} from "@/lib/list-status-badges"
import type { Placement, Status } from "@/lib/mock/placements"

// ─────────────────────────────────────────────────────────────────────────────
// Placement status — same maps + shell as other list hubs (`list-status-badges`)
// ─────────────────────────────────────────────────────────────────────────────

function isPlacementStatus(v: string): v is Status {
  return v in PLACEMENT_STATUS_LABEL
}

export function StatusBadge({
  status,
  surface = "table",
}: {
  status: Status | string
  surface?: "table" | "board"
}) {
  if (!isPlacementStatus(status)) {
    return (
      <Badge variant="outline" className="text-xs shrink-0">
        {String(status)}
      </Badge>
    )
  }
  return (
    <ListHubStatusBadge
      surface={surface}
      label={PLACEMENT_STATUS_LABEL[status]}
      tintClassName={PLACEMENT_STATUS_BADGE_CLASS[status]}
      icon={PLACEMENT_STATUS_ICON[status]}
    />
  )
}

export function AvatarCircle({ initials }: { initials: string }) {
  return (
    <span
      className="size-7 rounded-full text-xs font-semibold flex items-center justify-center shrink-0"
      style={{ background: "var(--avatar-initials-bg)", color: "var(--avatar-initials-fg)" }}
      aria-hidden="true"
    >
      {initials}
    </span>
  )
}

export function WeeksProgressCell({ row }: { row: Placement }) {
  const { progressWeeksDone, progressWeeksTotal } = row
  const total = Math.max(1, progressWeeksTotal)
  const pct = Math.min(100, Math.round((progressWeeksDone / total) * 100))
  return (
    <div className="flex min-w-[128px] max-w-[200px] flex-col gap-1.5">
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">
        {progressWeeksDone} / {progressWeeksTotal} wks
      </span>
    </div>
  )
}

export function ReadinessBadge({ value }: { value: string }) {
  const lower = value.toLowerCase()
  const variant =
    lower.includes("risk") || lower.includes("blocked")
      ? "destructive"
      : lower.includes("review")
        ? "secondary"
        : "outline"
  return (
    <Badge variant={variant} className="h-6 px-2 py-1 text-xs font-medium leading-none">
      {value}
    </Badge>
  )
}

export function HireBadge({ value }: { value: string }) {
  if (value === "—" || !value) return <span className="text-sm text-muted-foreground">—</span>
  const yes = value.toLowerCase() === "yes"
  return (
    <Badge
      variant={yes ? "default" : "secondary"}
      className="h-6 border-0 px-2 py-1 text-xs font-medium leading-none"
    >
      {value}
    </Badge>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Row actions
// ─────────────────────────────────────────────────────────────────────────────

export interface RowActionDef {
  label: string
  icon: string
  onClick: (row: Placement) => void
  variant?: "destructive"
}

export const PLACEMENT_ROW_ACTIONS: RowActionDef[] = [
  { label: "Edit",   icon: "fa-pen-to-square", onClick: _row => {}   },
  { label: "Open",   icon: "fa-arrow-up-right", onClick: _row => {}  },
  { label: "Delete", icon: "fa-trash",          onClick: _row => {}, variant: "destructive" },
]

export function RowActions({ row, actions }: { row: Placement; actions: RowActionDef[] }) {
  if (!actions.length) return null

  if (actions.length === 1) {
    const a = actions[0]
    return (
      <Tip label={a.label} side="top">
        <Button size="icon-sm" variant="ghost" aria-label={`${a.label} ${row.student}`}
          onClick={() => a.onClick(row)}>
          <i className={`fa-light ${a.icon} text-sm`} aria-hidden="true" />
        </Button>
      </Tip>
    )
  }

  return (
    <DropdownMenu>
      <Tip label={`More options for ${row.student}`} side="top">
        <DropdownMenuTrigger asChild>
          <Button size="icon-sm" variant="ghost" aria-label={`More options for ${row.student}`}>
            <i className="fa-light fa-ellipsis text-sm" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
      </Tip>
      <DropdownMenuContent align="end" className="w-40">
        {actions.map((a, i) => (
          <React.Fragment key={a.label}>
            {a.variant === "destructive" && i > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onClick={() => a.onClick(row)}
              className={a.variant === "destructive" ? "text-destructive focus:text-destructive" : ""}
            >
              <i className={`fa-light ${a.icon}`} aria-hidden="true" />
              {a.label}
            </DropdownMenuItem>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
