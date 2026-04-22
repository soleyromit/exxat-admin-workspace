"use client"

import * as React from "react"
import { initialsFromDisplayName } from "@/lib/initials-from-name"
import {
  COMPLIANCE_STATUS_BADGE_CLASS,
  COMPLIANCE_STATUS_ICON,
  COMPLIANCE_STATUS_LABEL,
} from "@/lib/list-status-badges"
import type { ComplianceItem } from "@/lib/mock/compliance"
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

const BOARD_COLUMNS: ListPageBoardColumnDef<ComplianceItem>[] = [
  {
    id: "compliant",
    label: "Compliant",
    description: "On track",
    filter: r => r.status === "compliant",
  },
  {
    id: "due_soon",
    label: "Due soon",
    description: "Within window",
    filter: r => r.status === "due_soon",
  },
  {
    id: "overdue",
    label: "Overdue",
    description: "Action required",
    filter: r => r.status === "overdue",
  },
  {
    id: "pending",
    label: "Pending",
    description: "Not started",
    filter: r => r.status === "pending",
  },
]

const COLUMN_COUNT_STYLE: Record<string, string> = {
  compliant: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
  due_soon: "bg-amber-500/15 text-amber-900 dark:text-amber-100",
  overdue: "bg-destructive/15 text-destructive",
  pending: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
}

function ComplianceBoardCard({ row }: { row: ComplianceItem }) {
  const ownerInitials = initialsFromDisplayName(row.owner)
  return (
    <ListPageBoardCard className="w-full">
      <ListPageBoardCardHeader>
        <ListPageBoardCardTitleRow
          title={row.title}
          titleClassName="line-clamp-2"
          trailing={<ListPageBoardCardAvatar initials={ownerInitials} />}
        />
        <ListPageBoardCardBadgeRow>
          <ListHubStatusBadge
            surface="board"
            label={COMPLIANCE_STATUS_LABEL[row.status]}
            tintClassName={COMPLIANCE_STATUS_BADGE_CLASS[row.status]}
            icon={COMPLIANCE_STATUS_ICON[row.status]}
          />
        </ListPageBoardCardBadgeRow>
        <ListPageBoardCardBody>
          <BoardCardTwoLineBlock iconClass="fa-tag" line1={row.category} line2={`Due ${row.dueDate}`} />
          <BoardCardTwoLineBlock iconClass="fa-user" line1={row.owner} line2="Owner" />
        </ListPageBoardCardBody>
      </ListPageBoardCardHeader>
    </ListPageBoardCard>
  )
}

export function ComplianceBoardView({ rows }: { rows: ComplianceItem[] }) {
  return (
    <ListPageBoardTemplate
      columns={BOARD_COLUMNS}
      rows={rows}
      getRowKey={r => r.id}
      columnCountBadgeClassName={COLUMN_COUNT_STYLE}
      emptyColumnLabel="No items"
      renderCard={row => <ComplianceBoardCard row={row} />}
    />
  )
}
