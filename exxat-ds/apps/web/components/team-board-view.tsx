"use client"

/**
 * Team board — kanban by member status. Column layout from `ListPageBoardTemplate`.
 */

import * as React from "react"
import {
  TEAM_MEMBER_STATUS_BADGE_CLASS,
  TEAM_MEMBER_STATUS_ICON,
  TEAM_MEMBER_STATUS_LABEL,
} from "@/lib/list-status-badges"
import type { TeamMember } from "@/lib/mock/team"
import { BoardCardTwoLineBlock } from "@/components/data-views/board-card-primitives"
import { ListHubStatusBadge } from "@/components/list-hub-status-badge"
import {
  ListPageBoardCard,
  ListPageBoardCardAvatar,
  ListPageBoardCardBadgeRow,
  ListPageBoardCardBody,
  ListPageBoardCardHeader,
  ListPageBoardCardTitleRow,
} from "@/components/data-views/list-page-board-card"
import {
  ListPageBoardTemplate,
  type ListPageBoardColumnDef,
} from "@/components/data-views/list-page-board-template"

const BOARD_COLUMNS: ListPageBoardColumnDef<TeamMember>[] = [
  { id: "active", label: "Active", description: "On the team", filter: m => m.status === "active" },
  { id: "away", label: "Away", description: "Temporarily away", filter: m => m.status === "away" },
  { id: "invited", label: "Invited", description: "Pending acceptance", filter: m => m.status === "invited" },
]

const COLUMN_COUNT_STYLE: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
  away: "bg-amber-500/15 text-amber-900 dark:text-amber-100",
  invited: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
}

function TeamBoardCard({ member }: { member: TeamMember }) {
  return (
    <ListPageBoardCard className="w-full">
      <ListPageBoardCardHeader>
        <ListPageBoardCardTitleRow
          title={member.name}
          titleClassName="truncate"
          trailing={<ListPageBoardCardAvatar initials={member.initials} />}
        />
        <ListPageBoardCardBadgeRow>
          <ListHubStatusBadge
            surface="board"
            label={TEAM_MEMBER_STATUS_LABEL[member.status]}
            tintClassName={TEAM_MEMBER_STATUS_BADGE_CLASS[member.status]}
            icon={TEAM_MEMBER_STATUS_ICON[member.status]}
          />
        </ListPageBoardCardBadgeRow>
        <ListPageBoardCardBody>
          <BoardCardTwoLineBlock iconClass="fa-briefcase" line1={member.role} line2={member.email} />
        </ListPageBoardCardBody>
      </ListPageBoardCardHeader>
    </ListPageBoardCard>
  )
}

export function TeamBoardView({ members }: { members: TeamMember[] }) {
  return (
    <ListPageBoardTemplate
      columns={BOARD_COLUMNS}
      rows={members}
      getRowKey={m => m.id}
      columnCountBadgeClassName={COLUMN_COUNT_STYLE}
      emptyColumnLabel="No members"
      renderCard={member => <TeamBoardCard member={member} />}
    />
  )
}
