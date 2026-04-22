"use client"

/**
 * TeamListView — full-width rows for team roster (same data as DataTable / board).
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { ListHubStatusBadge } from "@/components/list-hub-status-badge"
import {
  TEAM_MEMBER_STATUS_BADGE_CLASS,
  TEAM_MEMBER_STATUS_ICON,
  TEAM_MEMBER_STATUS_LABEL,
} from "@/lib/list-status-badges"
import type { TeamMember } from "@/lib/mock/team"

function TeamListRow({ member }: { member: TeamMember }) {
  return (
    <li>
      <button
        type="button"
        className={cn(
          "flex w-full items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-left transition-colors",
          "hover:bg-muted/40 hover:border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
          style={{ background: "var(--avatar-initials-bg)", color: "var(--avatar-initials-fg)" }}
          aria-hidden
        >
          {member.initials}
        </span>
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="truncate text-sm font-semibold text-foreground">{member.name}</p>
          <p className="text-xs text-muted-foreground">{member.role}</p>
          <p className="truncate text-xs text-muted-foreground">{member.email}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ListHubStatusBadge
            label={TEAM_MEMBER_STATUS_LABEL[member.status]}
            tintClassName={TEAM_MEMBER_STATUS_BADGE_CLASS[member.status]}
            icon={TEAM_MEMBER_STATUS_ICON[member.status]}
          />
          <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" />
        </div>
      </button>
    </li>
  )
}

export function TeamListView({ members }: { members: TeamMember[] }) {
  if (members.length === 0) {
    return (
      <div className="px-4 py-16 text-center lg:px-6">
        <p className="text-sm text-muted-foreground">No team members match your filters.</p>
      </div>
    )
  }

  return (
    <ul className="flex list-none flex-col gap-2 px-4 pb-8 pt-2 lg:px-6">
      {members.map(m => (
        <TeamListRow key={m.id} member={m} />
      ))}
    </ul>
  )
}
