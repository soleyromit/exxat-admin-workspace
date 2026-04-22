"use client"

/**
 * ListPageBoardTemplate — reusable kanban shell for list pages (Team, custom hubs).
 *
 * - Columns are defined with predicates; each row is placed in the **first** matching column.
 * - Cards are rendered by the caller (`renderCard`) — compose **`ListPageBoardCard`** + primitives (`BoardCardTwoLineBlock`, etc.).
 * - Placements keeps richer column headers (search, menus); this template is for simpler hubs.
 *
 * @see `docs/data-views-pattern.md` — board primitives
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { BoardNewCardPlaceholder } from "@/components/data-views/board-card-primitives"

export type ListPageBoardColumnDef<T> = {
  id: string
  label: string
  /** Shown beside the title on larger breakpoints */
  description?: string
  /** First matching column wins; columns should be mutually exclusive for most domains. */
  filter: (row: T) => boolean
}

export type ListPageBoardTemplateProps<T> = {
  columns: ListPageBoardColumnDef<T>[]
  rows: T[]
  getRowKey: (row: T) => string | number
  renderCard: (row: T) => React.ReactNode
  /** Tailwind classes for the count pill, keyed by column `id` */
  columnCountBadgeClassName?: Record<string, string>
  /** Copy when a column has no rows */
  emptyColumnLabel?: string
}

function ListPageBoardColumnHeader({
  label,
  description,
  count,
  badgeClassName,
}: {
  label: string
  description?: string
  count: number
  badgeClassName?: string
}) {
  return (
    <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-sm font-semibold text-foreground">{label}</span>
        {description ? (
          <span className="hidden text-xs text-muted-foreground sm:inline">{description}</span>
        ) : null}
      </div>
      <Badge
        variant="outline"
        className={cn(
          "inline-flex h-6 min-w-6 shrink-0 items-center justify-center border-0 bg-muted/70 px-2 text-xs font-semibold tabular-nums text-foreground",
          badgeClassName,
        )}
        aria-label={`${count} ${count === 1 ? "item" : "items"}`}
      >
        {count}
      </Badge>
    </div>
  )
}

export function ListPageBoardTemplate<T>({
  columns,
  rows,
  getRowKey,
  renderCard,
  columnCountBadgeClassName = {},
  emptyColumnLabel = "No items",
}: ListPageBoardTemplateProps<T>) {
  const grouped = React.useMemo(() => {
    const map: Record<string, T[]> = {}
    for (const col of columns) map[col.id] = []
    for (const row of rows) {
      for (const col of columns) {
        if (col.filter(row)) {
          map[col.id].push(row)
          break
        }
      }
    }
    return map
  }, [columns, rows])

  return (
    <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto px-4 pb-6 pt-2 lg:px-6">
      {columns.map(col => (
        <div
          key={col.id}
          className="flex w-72 shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-muted/30"
        >
          <ListPageBoardColumnHeader
            label={col.label}
            description={col.description}
            count={grouped[col.id]?.length ?? 0}
            badgeClassName={columnCountBadgeClassName[col.id]}
          />

          <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
            <BoardNewCardPlaceholder position="above" />

            {(grouped[col.id]?.length ?? 0) === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">{emptyColumnLabel}</p>
            ) : (
              grouped[col.id]!.map(row => <React.Fragment key={String(getRowKey(row))}>{renderCard(row)}</React.Fragment>)
            )}

            <BoardNewCardPlaceholder position="below" />
          </div>
        </div>
      ))}
    </div>
  )
}
