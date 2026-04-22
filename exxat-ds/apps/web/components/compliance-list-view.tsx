"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ListHubStatusBadge } from "@/components/list-hub-status-badge"
import {
  COMPLIANCE_STATUS_BADGE_CLASS,
  COMPLIANCE_STATUS_ICON,
  COMPLIANCE_STATUS_LABEL,
} from "@/lib/list-status-badges"
import type { ComplianceItem } from "@/lib/mock/compliance"

function ComplianceListRow({ row }: { row: ComplianceItem }) {
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
          <p className="text-sm font-semibold text-foreground">{row.title}</p>
          <p className="text-xs text-muted-foreground">{row.category} · Due {row.dueDate}</p>
          <p className="text-xs text-muted-foreground">Owner: {row.owner}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ListHubStatusBadge
            label={COMPLIANCE_STATUS_LABEL[row.status]}
            tintClassName={COMPLIANCE_STATUS_BADGE_CLASS[row.status]}
            icon={COMPLIANCE_STATUS_ICON[row.status]}
          />
          <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" />
        </div>
      </button>
    </li>
  )
}

export function ComplianceListView({ rows }: { rows: ComplianceItem[] }) {
  if (rows.length === 0) {
    return (
      <div className="px-4 py-16 text-center lg:px-6">
        <p className="text-sm text-muted-foreground">No compliance items match your filters.</p>
      </div>
    )
  }

  return (
    <ul className="flex list-none flex-col gap-2 px-4 pb-8 pt-2 lg:px-6">
      {rows.map(row => (
        <ComplianceListRow key={row.id} row={row} />
      ))}
    </ul>
  )
}
