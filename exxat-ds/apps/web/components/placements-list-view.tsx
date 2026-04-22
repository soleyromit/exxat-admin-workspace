"use client"

/**
 * PlacementsListView — full-width row layout for the data list (vs table grid / board columns).
 * Shares column visibility + lifecycle rules with Table Properties via the same board column model.
 * Long lists use window scroll virtualization (TanStack Virtual) to limit DOM size.
 */

import * as React from "react"
import { useRouter } from "next/navigation"
import { useWindowVirtualizer } from "@tanstack/react-virtual"
import { cn } from "@/lib/utils"
import type { Placement } from "@/lib/mock/placements"
import { StatusBadge } from "@/components/data-list-table-cells"
import { Badge } from "@/components/ui/badge"
import {
  type BoardCardLifecycleTabId,
  isBoardFieldActive,
  scheduleKeysForTab,
} from "@/lib/placement-board-card-layout"
import { getConditionalRowBackground } from "@/lib/conditional-rule-match"
import type { ConditionalRule } from "@/components/table-properties/types"
import type { ColumnDef } from "@/components/data-table/types"

/** Above this count, the list is virtualized against the window scroll. */
const VIRTUAL_ROWS_THRESHOLD = 80
/** Initial row height guess (px); `measureElement` refines for variable content. */
const ESTIMATE_ROW_PX = 100

function scheduleSummary(row: Placement, tab: BoardCardLifecycleTabId): string | null {
  switch (tab) {
    case "all":
      return [row.start, row.duration].filter(Boolean).join(" · ") || null
    case "upcoming":
      return row.daysUntilStart > 0
        ? `${row.start} · Starts in ${row.daysUntilStart} days`
        : row.start
    case "ongoing":
      return `${row.progressWeeksDone} / ${row.progressWeeksTotal} wks · Ends ${row.endDate}`
    case "completed":
      return [row.completionDate, row.finalStatus].filter(v => v && v !== "—").join(" · ") || null
    default:
      return null
  }
}

function PlacementListRowContent({
  row,
  tab,
  hiddenColKeys,
  boardColumns,
  conditionalRules,
  onOpen,
}: {
  row: Placement
  tab: BoardCardLifecycleTabId
  hiddenColKeys: Set<string>
  boardColumns: ColumnDef<Placement>[]
  conditionalRules: ConditionalRule[] | undefined
  onOpen: (id: number) => void
}) {
  const ruleBg = getConditionalRowBackground(row, conditionalRules)
  const showStudent = isBoardFieldActive("student", tab, hiddenColKeys, boardColumns)
  const showStatus = isBoardFieldActive("status", tab, hiddenColKeys, boardColumns)
  const showSite = isBoardFieldActive("site", tab, hiddenColKeys, boardColumns)
  const showSpec = isBoardFieldActive("specialization", tab, hiddenColKeys, boardColumns)
  const showInternship = isBoardFieldActive("internship", tab, hiddenColKeys, boardColumns)
  const sk = scheduleKeysForTab(tab)
  const showSchedule = sk.some(k => isBoardFieldActive(k, tab, hiddenColKeys, boardColumns))
  const schedule = showSchedule ? scheduleSummary(row, tab) : null

  const title = showStudent ? row.student : `Placement ${row.id}`

  return (
    <button
      type="button"
      onClick={() => onOpen(row.id)}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border border-border bg-background px-4 py-3 text-left transition-colors",
        "hover:bg-muted/40 hover:border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        row.isNew && "ring-1 ring-brand/30",
      )}
      style={ruleBg ? { background: ruleBg } : undefined}
    >
      {showStudent ? (
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
          style={{
            background: "var(--avatar-initials-bg)",
            color: "var(--avatar-initials-fg)",
          }}
          aria-hidden
        >
          {row.initials}
        </span>
      ) : (
        <span className="size-9 shrink-0 rounded-full bg-muted/80" aria-hidden />
      )}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{title}</span>
          {row.isNew ? (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs font-medium">
              New
            </Badge>
          ) : null}
        </div>
        {showSite ? (
          <p className="text-xs text-foreground/90">
            <span className="font-medium">{row.site}</span>
            {row.siteAddress ? (
              <span className="text-muted-foreground"> · {row.siteAddress}</span>
            ) : null}
          </p>
        ) : null}
        {(showSpec || showInternship) ? (
          <p className="text-xs text-muted-foreground">
            {[showSpec ? row.specialization : null, showInternship ? row.internship : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
        ) : null}
        {schedule ? <p className="text-xs text-muted-foreground tabular-nums">{schedule}</p> : null}
      </div>
      {showStatus ? (
        <div className="flex shrink-0 items-center gap-2 pt-0.5">
          <StatusBadge status={row.status} />
          <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden />
        </div>
      ) : (
        <i className="fa-light fa-chevron-right mt-1 shrink-0 text-xs text-muted-foreground" aria-hidden />
      )}
    </button>
  )
}

function PlacementListRow({
  row,
  tab,
  hiddenColKeys,
  boardColumns,
  conditionalRules,
  onOpen,
}: {
  row: Placement
  tab: BoardCardLifecycleTabId
  hiddenColKeys: Set<string>
  boardColumns: ColumnDef<Placement>[]
  conditionalRules: ConditionalRule[] | undefined
  onOpen: (id: number) => void
}) {
  return (
    <li>
      <PlacementListRowContent
        row={row}
        tab={tab}
        hiddenColKeys={hiddenColKeys}
        boardColumns={boardColumns}
        conditionalRules={conditionalRules}
        onOpen={onOpen}
      />
    </li>
  )
}

function PlacementsListViewVirtualized({
  rows,
  lifecycleTabId,
  hiddenColKeys,
  boardColumns,
  conditionalRules,
  onOpen,
}: {
  rows: Placement[]
  lifecycleTabId: BoardCardLifecycleTabId
  hiddenColKeys: Set<string>
  boardColumns: ColumnDef<Placement>[]
  conditionalRules: ConditionalRule[] | undefined
  onOpen: (id: number) => void
}) {
  const anchorRef = React.useRef<HTMLDivElement>(null)
  const [scrollMargin, setScrollMargin] = React.useState(0)

  const updateScrollMargin = React.useCallback(() => {
    const el = anchorRef.current
    if (!el) return
    setScrollMargin(el.getBoundingClientRect().top + window.scrollY)
  }, [])

  React.useLayoutEffect(() => {
    updateScrollMargin()
    window.addEventListener("resize", updateScrollMargin)
    return () => window.removeEventListener("resize", updateScrollMargin)
  }, [updateScrollMargin, rows.length, lifecycleTabId])

  const virtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => ESTIMATE_ROW_PX,
    overscan: 8,
    scrollMargin,
  })

  return (
    <div ref={anchorRef} className="px-4 pb-8 pt-2 lg:px-6">
      <ul
        role="list"
        className="relative m-0 w-full list-none p-0"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualizer.getVirtualItems().map(vr => {
          const row = rows[vr.index]
          if (!row) return null
          return (
            <li
              key={vr.key}
              data-index={vr.index}
              ref={virtualizer.measureElement}
              className="absolute left-0 top-0 w-full pb-2"
              style={{ transform: `translateY(${vr.start}px)` }}
            >
              <PlacementListRowContent
                row={row}
                tab={lifecycleTabId}
                hiddenColKeys={hiddenColKeys}
                boardColumns={boardColumns}
                conditionalRules={conditionalRules}
                onOpen={onOpen}
              />
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export interface PlacementsListViewProps {
  rows: Placement[]
  lifecycleTabId: BoardCardLifecycleTabId
  hiddenColKeys: Set<string>
  boardColumns: ColumnDef<Placement>[]
  conditionalRules?: ConditionalRule[]
  emptyCopy: string
}

export function PlacementsListView({
  rows,
  lifecycleTabId,
  hiddenColKeys,
  boardColumns,
  conditionalRules,
  emptyCopy,
}: PlacementsListViewProps) {
  const router = useRouter()
  const onOpen = React.useCallback((id: number) => router.push(`/data-list/${id}`), [router])

  if (rows.length === 0) {
    return (
      <div className="px-4 py-16 text-center lg:px-6">
        <p className="text-sm text-muted-foreground">{emptyCopy}</p>
      </div>
    )
  }

  if (rows.length >= VIRTUAL_ROWS_THRESHOLD) {
    return (
      <PlacementsListViewVirtualized
        rows={rows}
        lifecycleTabId={lifecycleTabId}
        hiddenColKeys={hiddenColKeys}
        boardColumns={boardColumns}
        conditionalRules={conditionalRules}
        onOpen={onOpen}
      />
    )
  }

  return (
    <ul className="flex list-none flex-col gap-2 px-4 pb-8 pt-2 lg:px-6">
      {rows.map(row => (
        <PlacementListRow
          key={row.id}
          row={row}
          tab={lifecycleTabId}
          hiddenColKeys={hiddenColKeys}
          boardColumns={boardColumns}
          conditionalRules={conditionalRules}
          onOpen={onOpen}
        />
      ))}
    </ul>
  )
}
