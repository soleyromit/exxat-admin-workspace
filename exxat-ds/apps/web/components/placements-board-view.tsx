"use client"

/**
 * PlacementsBoardView — kanban-style board by lifecycle phase (domain-specific columns).
 * View chrome labels use `dataListViewLabel` from `@/lib/data-list-view` at the page level;
 * this component focuses on placement phase grouping + shared card primitives.
 */

import * as React from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import type { Placement, PlacementPhase } from "@/lib/mock/placements"
import { Input } from "@/components/ui/input"
import { Tip } from "@/components/ui/tip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DEFAULT_DATA_LIST_DISPLAY_OPTIONS, type BoardLineCount } from "@/lib/data-list-display-options"
import { type BoardCardLifecycleTabId } from "@/lib/placement-board-card-layout"
import type { ConditionalRule } from "@/components/table-properties/types"
import type { ColumnDef } from "@/components/data-table/types"
import { Badge } from "@/components/ui/badge"
import { BoardPlacementCard } from "@/components/data-views/placement-board-card"
import { BoardNewCardPlaceholder } from "@/components/data-views/board-card-primitives"

const PHASE_COLUMNS: { phase: PlacementPhase; label: string; description: string }[] = [
  { phase: "upcoming",  label: "Upcoming",  description: "Starting soon" },
  { phase: "ongoing",   label: "Ongoing",   description: "In progress" },
  { phase: "completed", label: "Completed", description: "Finished" },
]

/** Substring match across visible card fields (per-phase quick search). */
function rowMatchesPhaseSearch(row: Placement, q: string): boolean {
  if (!q.trim()) return true
  const lower = q.toLowerCase()
  const hay = [
    row.student,
    row.site,
    row.specialization,
    row.internship,
    row.program,
    row.status,
    row.supervisor,
    row.email,
    row.start,
  ]
    .map(v => String(v ?? "").toLowerCase())
    .join(" ")
  return hay.includes(lower)
}

export interface PlacementsBoardColumnMenu {
  filterableColumns: { key: string; label: string }[]
  sortableColumns: { key: string; label: string }[]
  groupableColumns: { key: string; label: string }[]
  groupBy: string | null
  onAddFilter: (fieldKey: string) => void
  onSortByField: (fieldKey: string, direction: "asc" | "desc") => void
  onToggleGroupBy: (fieldKey: string) => void
  onOpenProperties: () => void
}

export interface BoardDisplaySettings {
  lineCount: BoardLineCount
  showColumnLabels: boolean
  showColumnCounts: boolean
  newCardAbove: boolean
}

export interface PlacementsBoardViewProps {
  placements: Placement[]
  /** Current lifecycle filter tab — drives helper copy above the board. */
  lifecycleTabId: BoardCardLifecycleTabId
  /** When set, each phase column header shows the same actions as a DataTable column header. */
  boardColumnMenu?: PlacementsBoardColumnMenu
  /** Board display options (Properties → view display). */
  boardDisplay?: BoardDisplaySettings
  /** Column visibility from table state — hidden columns omit matching card fields. */
  hiddenColKeys?: Set<string>
  /** Same conditional formatting as the table (row background when a rule matches). */
  conditionalRules?: ConditionalRule[]
  /** Visible data columns (table order) — drives dates and other fields on the card. */
  boardColumns: ColumnDef<Placement>[]
}

function BoardPhaseColumnHeader({
  label,
  rawCount,
  filteredCount,
  searchValue,
  onSearchChange,
  menu,
  showLabels,
  showCounts,
}: {
  label: string
  rawCount: number
  filteredCount: number
  searchValue: string
  onSearchChange: (value: string) => void
  menu: PlacementsBoardColumnMenu
  showLabels: boolean
  showCounts: boolean
}) {
  const searchActive = Boolean(searchValue.trim())
  const countLabel =
    searchActive && filteredCount !== rawCount
      ? `${filteredCount} of ${rawCount} records`
      : `${filteredCount} ${filteredCount === 1 ? "record" : "records"}`

  const showLeft = showLabels || showCounts

  return (
    <div className="group/board-col border-b border-border px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        {showLeft ? (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {showLabels ? (
              <p className="min-w-0 truncate text-sm font-semibold text-foreground">{label}</p>
            ) : null}
            {showCounts ? (
              <div className="flex shrink-0 items-center gap-1.5">
                <Badge
                  variant="outline"
                  className="inline-flex h-6 min-w-6 items-center justify-center border-0 bg-muted/70 px-2 text-xs font-semibold tabular-nums text-foreground"
                  aria-label={countLabel}
                >
                  {filteredCount}
                </Badge>
                {searchActive && filteredCount !== rawCount ? (
                  <span className="text-xs font-medium tabular-nums text-muted-foreground" aria-hidden>
                    / {rawCount}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="min-w-0 flex-1" aria-hidden />
        )}
        <DropdownMenu>
          <Tip label="Column options" side="top">
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`${label} column options`}
                onClick={e => e.stopPropagation()}
                className={cn(
                  "opacity-0 group-hover/board-col:opacity-100 group-focus-within/board-col:opacity-100",
                  "inline-flex shrink-0 items-center justify-center size-7 rounded-md",
                  "text-muted-foreground hover:text-interactive-hover-foreground hover:bg-interactive-hover-row",
                  "transition-opacity focus-visible:opacity-100",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                )}
              >
                <i className="fa-light fa-ellipsis-vertical text-xs" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
          </Tip>
          <DropdownMenuContent align="end" className="min-w-44">
            <div className="px-2 pt-2 pb-1">
              <div className="relative">
                <i
                  className="fa-light fa-magnifying-glass pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  placeholder={`Search ${label}…`}
                  value={searchValue}
                  onChange={e => onSearchChange(e.target.value)}
                  onKeyDown={e => e.stopPropagation()}
                  className="h-7 pl-6 text-xs"
                />
                {searchValue ? (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => onSearchChange("")}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-interactive-hover-foreground"
                  >
                    <i className="fa-light fa-xmark text-xs" aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            </div>
            <DropdownMenuSeparator />

            {menu.filterableColumns.length > 0 && (
              <>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <i className="fa-light fa-filter" aria-hidden="true" />
                    Filter by field…
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="max-h-[min(280px,60vh)] overflow-y-auto">
                    {menu.filterableColumns.map(col => (
                      <DropdownMenuItem key={col.key} onClick={() => menu.onAddFilter(col.key)}>
                        {col.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
              </>
            )}

            {menu.sortableColumns.length > 0 && (
              <>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <i className="fa-light fa-arrow-up-arrow-down" aria-hidden="true" />
                    Sort by…
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="max-h-[min(320px,60vh)] overflow-y-auto">
                    {menu.sortableColumns.map(col => (
                      <React.Fragment key={col.key}>
                        <DropdownMenuItem onClick={() => menu.onSortByField(col.key, "asc")}>
                          <i className="fa-light fa-arrow-up-az" aria-hidden="true" />
                          {col.label} — ascending
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => menu.onSortByField(col.key, "desc")}>
                          <i className="fa-light fa-arrow-down-az" aria-hidden="true" />
                          {col.label} — descending
                        </DropdownMenuItem>
                      </React.Fragment>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
              </>
            )}

            {menu.groupableColumns.length > 0 && (
              <>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <i className="fa-light fa-layer-group" aria-hidden="true" />
                    Group by…
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="max-h-[min(280px,60vh)] overflow-y-auto">
                    {menu.groupableColumns.map(col => (
                      <DropdownMenuItem
                        key={col.key}
                        onClick={() => menu.onToggleGroupBy(col.key)}
                      >
                        {menu.groupBy === col.key ? (
                          <>
                            <i className="fa-light fa-check text-xs" aria-hidden="true" />
                            Grouped by {col.label}
                          </>
                        ) : (
                          <>
                            <span className="inline-block w-3" aria-hidden />
                            Group by {col.label}
                          </>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
              </>
            )}

            <DropdownMenuItem onClick={menu.onOpenProperties}>
              <i className="fa-light fa-palette" aria-hidden="true" />
              Add conditional rule
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export function PlacementsBoardView({
  placements,
  lifecycleTabId,
  boardColumnMenu,
  boardDisplay: boardDisplayProp,
  hiddenColKeys: hiddenColKeysProp,
  conditionalRules,
  boardColumns,
}: PlacementsBoardViewProps) {
  const router = useRouter()

  const bd: BoardDisplaySettings = {
    lineCount: boardDisplayProp?.lineCount ?? DEFAULT_DATA_LIST_DISPLAY_OPTIONS.boardLineCount,
    showColumnLabels: boardDisplayProp?.showColumnLabels ?? DEFAULT_DATA_LIST_DISPLAY_OPTIONS.showColumnLabels,
    showColumnCounts: boardDisplayProp?.showColumnCounts ?? DEFAULT_DATA_LIST_DISPLAY_OPTIONS.showBoardColumnCounts,
    newCardAbove: boardDisplayProp?.newCardAbove ?? DEFAULT_DATA_LIST_DISPLAY_OPTIONS.boardNewCardAbove,
  }
  const hiddenColKeys = hiddenColKeysProp ?? new Set<string>()

  const [phaseSearch, setPhaseSearch] = React.useState<Record<PlacementPhase, string>>({
    upcoming: "",
    ongoing: "",
    completed: "",
  })

  const byPhase = React.useMemo(() => {
    const map: Record<PlacementPhase, Placement[]> = {
      upcoming: [],
      ongoing: [],
      completed: [],
    }
    for (const p of placements) {
      map[p.placementPhase].push(p)
    }
    return map
  }, [placements])

  const cardsByPhase = React.useMemo(() => {
    const out: Record<PlacementPhase, Placement[]> = {
      upcoming: [],
      ongoing: [],
      completed: [],
    }
    for (const phase of PHASE_COLUMNS.map(c => c.phase)) {
      const q = phaseSearch[phase]
      out[phase] = byPhase[phase].filter(row => rowMatchesPhaseSearch(row, q))
    }
    return out
  }, [byPhase, phaseSearch])

  return (
    <div className="px-4 pb-8 pt-2 lg:px-6">
      <p className="text-xs text-muted-foreground mb-4">
        {lifecycleTabId === "all"
          ? "Rows grouped by phase (same data as Table view and List view)."
          : `Filtered to ${lifecycleTabId} — cards shown in matching columns only.`}
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 min-h-[min(480px,calc(100vh-14rem))]">
        {PHASE_COLUMNS.map(col => {
          const rawInPhase = byPhase[col.phase]
          const cards = cardsByPhase[col.phase]

          return (
            <div
              key={col.phase}
              className="group/board-col flex min-h-0 flex-col rounded-xl border border-border bg-muted/30"
            >
              {boardColumnMenu ? (
                <BoardPhaseColumnHeader
                  label={col.label}
                  rawCount={rawInPhase.length}
                  filteredCount={cards.length}
                  searchValue={phaseSearch[col.phase]}
                  onSearchChange={v => setPhaseSearch(prev => ({ ...prev, [col.phase]: v }))}
                  menu={boardColumnMenu}
                  showLabels={bd.showColumnLabels}
                  showCounts={bd.showColumnCounts}
                />
              ) : (
                <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
                  {bd.showColumnLabels ? (
                    <p className="min-w-0 truncate text-sm font-semibold text-foreground">{col.label}</p>
                  ) : (
                    <span className="min-w-0 flex-1" aria-hidden />
                  )}
                  {bd.showColumnCounts ? (
                    <Badge
                      variant="outline"
                      className="inline-flex h-6 min-w-6 shrink-0 items-center justify-center border-0 bg-muted/70 px-2 text-xs font-semibold tabular-nums text-foreground"
                      aria-label={`${rawInPhase.length} ${rawInPhase.length === 1 ? "record" : "records"}`}
                    >
                      {rawInPhase.length}
                    </Badge>
                  ) : null}
                </div>
              )}
              <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
                {bd.newCardAbove ? <BoardNewCardPlaceholder position="above" /> : null}
                {cards.length === 0 ? (
                  <p className="px-2 py-6 text-center text-xs text-muted-foreground">No placements</p>
                ) : (
                  cards.map(row => (
                    <BoardPlacementCard
                      key={row.id}
                      row={row}
                      lifecycleTabId={lifecycleTabId}
                      hiddenColKeys={hiddenColKeys}
                      lineCount={bd.lineCount}
                      conditionalRules={conditionalRules}
                      boardColumns={boardColumns}
                      onOpen={id => router.push(`/data-list/${id}`)}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
