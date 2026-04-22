"use client"

/**
 * Placement-specific board card — composes shared board primitives with column defs and lifecycle layout rules.
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import type { Placement } from "@/lib/mock/placements"
import { StatusBadge } from "@/components/data-list-table-cells"
import { Badge } from "@/components/ui/badge"
import {
  ListPageBoardCard,
  ListPageBoardCardBadgeRow,
  ListPageBoardCardBody,
  ListPageBoardCardHeader,
  ListPageBoardCardSecondary,
  ListPageBoardCardTitleRow,
} from "@/components/data-views/list-page-board-card"
import type { BoardLineCount } from "@/lib/data-list-display-options"
import {
  type BoardCardLifecycleTabId,
  filterColumnsForBoardCard,
  isBoardFieldActive,
  remainingBodyColumns,
  scheduleKeysForTab,
} from "@/lib/placement-board-card-layout"
import { getConditionalRowBackground } from "@/lib/conditional-rule-match"
import type { ConditionalRule } from "@/components/table-properties/types"
import type { CellContext, ColumnDef } from "@/components/data-table/types"
import {
  BoardCardIconRow,
  BoardCardTwoLineBlock,
  lineClampClass,
} from "@/components/data-views/board-card-primitives"

const BOARD_CELL_CTX: CellContext<Placement> = {
  rowIndex: 0,
  selected: false,
  onSelect: () => {},
}

function columnIconClass(col: ColumnDef<Placement>): string {
  if (col.filter?.icon) return col.filter.icon
  const fallbacks: Record<string, string> = {
    specialization: "fa-stethoscope",
    site: "fa-hospital",
    internship: "fa-briefcase",
    supervisor: "fa-user-tie",
    start: "fa-calendar",
    compliance: "fa-shield-check",
    daysUntilStart: "fa-calendar-days",
    readiness: "fa-flag",
    progressWeeksDone: "fa-chart-line",
    endDate: "fa-calendar-xmark",
    lastCheckin: "fa-calendar-clock",
    completionDate: "fa-calendar-check",
    finalStatus: "fa-circle-check",
    rating: "fa-star",
    suggestedToHire: "fa-user-check",
    duration: "fa-clock",
    program: "fa-graduation-cap",
    student: "fa-user",
    status: "fa-circle-dot",
  }
  return fallbacks[col.key] ?? "fa-tag"
}

function boardCellContent(row: Placement, col: ColumnDef<Placement>): React.ReactNode {
  if (col.key === "status") return <StatusBadge status={row.status} surface="board" />
  if (col.cell) return col.cell(row, BOARD_CELL_CTX)
  return <span className="text-foreground/90">{String(row[col.key as keyof Placement] ?? "")}</span>
}

function renderScheduleSection(
  row: Placement,
  tab: BoardCardLifecycleTabId,
  hiddenColKeys: Set<string>,
  boardColumns: ColumnDef<Placement>[],
): React.ReactNode {
  const sk = scheduleKeysForTab(tab)
  const anyActive = sk.some(k => isBoardFieldActive(k, tab, hiddenColKeys, boardColumns))
  if (!anyActive) return null

  switch (tab) {
    case "all": {
      const aStart = isBoardFieldActive("start", tab, hiddenColKeys, boardColumns)
      const aDur = isBoardFieldActive("duration", tab, hiddenColKeys, boardColumns)
      if (!aStart && !aDur) return null
      return (
        <BoardCardTwoLineBlock
          iconClass="fa-calendar"
          line1={aStart ? row.start : "—"}
          line2={aDur ? row.duration : "—"}
        />
      )
    }
    case "upcoming": {
      const aStart = isBoardFieldActive("start", tab, hiddenColKeys, boardColumns)
      const aDays = isBoardFieldActive("daysUntilStart", tab, hiddenColKeys, boardColumns)
      if (!aStart && !aDays) return null
      const line2 =
        aDays && row.daysUntilStart > 0
          ? `Starts in ${row.daysUntilStart} days`
          : aDays && row.daysUntilStart === 0
            ? "Starts today"
            : "—"
      return (
        <BoardCardTwoLineBlock
          iconClass="fa-calendar"
          line1={aStart ? row.start : "—"}
          line2={line2}
        />
      )
    }
    case "ongoing": {
      const aP = isBoardFieldActive("progressWeeksDone", tab, hiddenColKeys, boardColumns)
      const aEnd = isBoardFieldActive("endDate", tab, hiddenColKeys, boardColumns)
      if (!aP && !aEnd) return null
      return (
        <BoardCardTwoLineBlock
          iconClass="fa-calendar"
          line1={aP ? `${row.progressWeeksDone} / ${row.progressWeeksTotal} wks` : "—"}
          line2={aEnd ? row.endDate : "—"}
        />
      )
    }
    case "completed": {
      const aComp = isBoardFieldActive("completionDate", tab, hiddenColKeys, boardColumns)
      const aFinal = isBoardFieldActive("finalStatus", tab, hiddenColKeys, boardColumns)
      if (!aComp && !aFinal) return null
      const finalCol = boardColumns.find(c => c.key === "finalStatus")
      return (
        <BoardCardTwoLineBlock
          iconClass="fa-calendar-check"
          line1={aComp ? row.completionDate : "—"}
          line2={
            aFinal && finalCol ? (
              <span className="inline-flex min-w-0 max-w-full [&_span]:text-xs">
                {boardCellContent(row, finalCol)}
              </span>
            ) : aFinal ? (
              row.finalStatus
            ) : (
              "—"
            )
          }
          line2ClassName={aFinal && finalCol ? "text-xs" : undefined}
        />
      )
    }
    default:
      return null
  }
}

export function BoardPlacementCard({
  row,
  lifecycleTabId,
  hiddenColKeys,
  lineCount,
  conditionalRules,
  boardColumns,
  onOpen,
}: {
  row: Placement
  lifecycleTabId: BoardCardLifecycleTabId
  hiddenColKeys: Set<string>
  lineCount: BoardLineCount
  conditionalRules: ConditionalRule[] | undefined
  boardColumns: ColumnDef<Placement>[]
  onOpen: (id: number) => void
}) {
  const lc = lineClampClass(lineCount)
  const ruleBg = getConditionalRowBackground(row, conditionalRules)

  const visibleCols = boardColumns.filter(c => !hiddenColKeys.has(c.key))
  const showStudent = visibleCols.some(c => c.key === "student")
  const cardCols = filterColumnsForBoardCard(lifecycleTabId, visibleCols)
  const remainingCols = remainingBodyColumns(lifecycleTabId, cardCols)

  const showStatus = isBoardFieldActive("status", lifecycleTabId, hiddenColKeys, boardColumns)
  const showSite = isBoardFieldActive("site", lifecycleTabId, hiddenColKeys, boardColumns)
  const siteCol = boardColumns.find(c => c.key === "site")

  const cardShell = (className: string, children: React.ReactNode) => (
    <ListPageBoardCard
      className={className}
      style={ruleBg ? { background: ruleBg } : undefined}
      isNew={row.isNew}
      onClick={() => onOpen(row.id)}
    >
      {children}
    </ListPageBoardCard>
  )

  if (visibleCols.length === 0) {
    return cardShell(
      "cursor-pointer",
      <ListPageBoardCardHeader className="gap-1 pb-2">
        <ListPageBoardCardTitleRow title={`Placement #${row.id}`} />
        <ListPageBoardCardSecondary>
          Unhide columns in Properties → Columns to show card fields.
        </ListPageBoardCardSecondary>
      </ListPageBoardCardHeader>,
    )
  }

  const titlePrimary = showStudent ? row.student : `Placement ${row.id}`
  const headerBadgeRow = showStatus || row.isNew

  return cardShell(
    "cursor-pointer",
    <ListPageBoardCardHeader>
      <ListPageBoardCardTitleRow
        title={titlePrimary}
        titleClassName={lc}
        trailing={
          showStudent ? (
            <span
              className="flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
              style={{
                background: "var(--avatar-initials-bg)",
                color: "var(--avatar-initials-fg)",
              }}
              aria-hidden
            >
              {row.initials}
            </span>
          ) : undefined
        }
      />

      {headerBadgeRow ? (
        <ListPageBoardCardBadgeRow>
          {showStatus ? <StatusBadge status={row.status} surface="board" /> : null}
          {row.isNew ? (
            <Badge variant="secondary" className="h-6 px-2 text-xs font-medium">
              New
            </Badge>
          ) : null}
        </ListPageBoardCardBadgeRow>
      ) : null}

      <ListPageBoardCardBody>
        {showSite && siteCol ? (
          <BoardCardIconRow iconClass="fa-hospital">
            <div className={cn(lc, "[&_.text-sm]:text-xs")}>{boardCellContent(row, siteCol)}</div>
          </BoardCardIconRow>
        ) : null}

        {renderScheduleSection(row, lifecycleTabId, hiddenColKeys, boardColumns)}

        {remainingCols.length > 0 ? (
          <div className="flex flex-col gap-2">
            {remainingCols.map(col => (
              <BoardCardIconRow key={col.key} iconClass={columnIconClass(col)}>
                <div className={cn(lc)}>{boardCellContent(row, col)}</div>
              </BoardCardIconRow>
            ))}
          </div>
        ) : null}
      </ListPageBoardCardBody>
    </ListPageBoardCardHeader>,
  )
}
