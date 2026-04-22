"use client"

import * as React from "react"
import { initialsFromDisplayName } from "@/lib/initials-from-name"
import type { QuestionBankItem } from "@/lib/mock/question-bank"
import {
  QUESTION_BANK_STATUS_BADGE_CLASS,
  QUESTION_BANK_STATUS_ICON,
  QUESTION_BANK_STATUS_LABEL,
} from "@/lib/list-status-badges"
import { BoardCardTwoLineBlock } from "@/components/data-views/board-card-primitives"
import {
  ListPageBoardCard,
  ListPageBoardCardAvatar,
  ListPageBoardCardBadgeRow,
  ListPageBoardCardBody,
  ListPageBoardCardHeader,
  ListPageBoardCardTitleRow,
} from "@/components/data-views/list-page-board-card"
import { ListHubStatusBadge } from "@/components/list-hub-status-badge"
import {
  ListPageBoardTemplate,
  type ListPageBoardColumnDef,
} from "@/components/data-views/list-page-board-template"

const BOARD_COLUMNS: ListPageBoardColumnDef<QuestionBankItem>[] = [
  {
    id: "published",
    label: "Published",
    description: "Live in bank",
    filter: r => r.status === "published",
  },
  {
    id: "draft",
    label: "Draft",
    description: "Work in progress",
    filter: r => r.status === "draft",
  },
  {
    id: "in_review",
    label: "In review",
    description: "Awaiting approval",
    filter: r => r.status === "in_review",
  },
]

/** Column count pills — match Team board column headers (no border token). */
const COLUMN_COUNT_STYLE: Record<string, string> = {
  published: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
  draft: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
  in_review: "bg-amber-500/15 text-amber-900 dark:text-amber-100",
}

function QuestionBankBoardCard({ row }: { row: QuestionBankItem }) {
  const initials = initialsFromDisplayName(row.author)
  return (
    <ListPageBoardCard className="w-full">
      <ListPageBoardCardHeader>
        <ListPageBoardCardTitleRow
          title={row.stem}
          titleClassName="line-clamp-2"
          trailing={<ListPageBoardCardAvatar initials={initials} />}
        />
        <ListPageBoardCardBadgeRow>
          <ListHubStatusBadge
            surface="board"
            label={QUESTION_BANK_STATUS_LABEL[row.status]}
            tintClassName={QUESTION_BANK_STATUS_BADGE_CLASS[row.status]}
            icon={QUESTION_BANK_STATUS_ICON[row.status]}
          />
        </ListPageBoardCardBadgeRow>
        <ListPageBoardCardBody>
          <BoardCardTwoLineBlock
            iconClass="fa-tag"
            line1={row.topic}
            line2={row.type.replace(/_/g, " ")}
          />
          <BoardCardTwoLineBlock iconClass="fa-calendar" line1={row.updatedAt} line2="Updated" />
        </ListPageBoardCardBody>
      </ListPageBoardCardHeader>
    </ListPageBoardCard>
  )
}

export function QuestionBankBoardView({ rows }: { rows: QuestionBankItem[] }) {
  return (
    <ListPageBoardTemplate
      columns={BOARD_COLUMNS}
      rows={rows}
      getRowKey={r => r.id}
      columnCountBadgeClassName={COLUMN_COUNT_STYLE}
      emptyColumnLabel="No questions"
      renderCard={row => <QuestionBankBoardCard row={row} />}
    />
  )
}
