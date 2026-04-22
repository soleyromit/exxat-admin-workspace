"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import type { QuestionBankItem } from "@/lib/mock/question-bank"
import { ListHubStatusBadge } from "@/components/list-hub-status-badge"
import {
  QUESTION_BANK_STATUS_BADGE_CLASS,
  QUESTION_BANK_STATUS_ICON,
  QUESTION_BANK_STATUS_LABEL,
} from "@/lib/list-status-badges"

function QuestionBankListRow({ row }: { row: QuestionBankItem }) {
  return (
    <li>
      <button
        type="button"
        className={cn(
          "flex w-full flex-col gap-1 rounded-xl border border-border bg-background px-4 py-3 text-left transition-colors sm:flex-row sm:items-center sm:gap-4",
          "hover:border-input hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-sm font-semibold text-foreground line-clamp-2">{row.stem}</p>
          <p className="text-xs text-muted-foreground">{row.topic} · Updated {row.updatedAt}</p>
          <p className="text-xs text-muted-foreground">{row.author}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ListHubStatusBadge
            label={QUESTION_BANK_STATUS_LABEL[row.status]}
            tintClassName={QUESTION_BANK_STATUS_BADGE_CLASS[row.status]}
            icon={QUESTION_BANK_STATUS_ICON[row.status]}
          />
          <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" />
        </div>
      </button>
    </li>
  )
}

export function QuestionBankListView({ rows }: { rows: QuestionBankItem[] }) {
  if (rows.length === 0) {
    return (
      <div className="px-4 py-16 text-center lg:px-6">
        <p className="text-sm text-muted-foreground">No questions match your filters.</p>
      </div>
    )
  }

  return (
    <ul className="flex list-none flex-col gap-2 px-4 pb-8 pt-2 lg:px-6">
      {rows.map(row => (
        <QuestionBankListRow key={row.id} row={row} />
      ))}
    </ul>
  )
}
