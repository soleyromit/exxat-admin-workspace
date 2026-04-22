/**
 * Board placement card layout — which fields appear by default per lifecycle tab,
 * which keys are grouped into header / site / schedule blocks, and helpers to
 * resolve “active” fields when a column exists only on some tabs (e.g. status).
 */

import type { ColumnDef } from "@/components/data-table/types"
import type { Placement } from "@/lib/mock/placements"

/** Mirrors PlacementLifecycleTabId without importing data-list-table (avoids circular imports). */
export type BoardCardLifecycleTabId = "all" | "upcoming" | "ongoing" | "completed"

/** Default card fields per tab — intersected with visible table columns (except header-only rules below). */
export const DEFAULT_BOARD_CARD_KEYS: Record<BoardCardLifecycleTabId, readonly string[]> = {
  all: ["student", "specialization", "site", "status", "internship", "start", "duration"],
  upcoming: ["student", "specialization", "site", "status", "internship", "start", "daysUntilStart"],
  ongoing: ["student", "specialization", "site", "status", "internship", "progressWeeksDone", "endDate"],
  completed: ["student", "specialization", "site", "status", "internship", "completionDate", "finalStatus"],
}

export function scheduleKeysForTab(tab: BoardCardLifecycleTabId): readonly string[] {
  switch (tab) {
    case "all":
      return ["start", "duration"]
    case "upcoming":
      return ["start", "daysUntilStart"]
    case "ongoing":
      return ["progressWeeksDone", "endDate"]
    case "completed":
      return ["completionDate", "finalStatus"]
    default:
      return []
  }
}

/** Keys rendered in the title/header cluster (not as icon rows). Status + New only — not internship/specialization. */
export function consumedKeysForCard(tab: BoardCardLifecycleTabId): Set<string> {
  const schedule = scheduleKeysForTab(tab)
  return new Set<string>(["student", "status", "site", ...schedule])
}

export function isKeyInBoardWhitelist(tab: BoardCardLifecycleTabId, key: string): boolean {
  return DEFAULT_BOARD_CARD_KEYS[tab].includes(key)
}

/**
 * Field is allowed on the card when it is in the tab whitelist, not hidden, and either
 * the column exists in this view and is visible, or the column does not exist (e.g. status on Upcoming)
 * — then we still show from row data for header/summary fields.
 */
export function isBoardFieldActive<Row extends Placement>(
  key: string,
  tab: BoardCardLifecycleTabId,
  hiddenColKeys: Set<string>,
  boardColumns: ColumnDef<Row>[],
): boolean {
  if (hiddenColKeys.has(key)) return false
  if (!isKeyInBoardWhitelist(tab, key)) return false
  const hasCol = boardColumns.some(c => c.key === key)
  if (!hasCol) return true
  return boardColumns.some(c => c.key === key && !hiddenColKeys.has(c.key))
}

/** Visible columns that pass whitelist (intersection). Order follows boardColumns. */
export function filterColumnsForBoardCard<Row extends Placement>(
  tab: BoardCardLifecycleTabId,
  visibleCols: ColumnDef<Row>[],
): ColumnDef<Row>[] {
  return visibleCols.filter(c => isKeyInBoardWhitelist(tab, c.key))
}

/** Body rows only: columns not consumed by title, header badges, site block, or schedule block. */
export function remainingBodyColumns<Row extends Placement>(
  tab: BoardCardLifecycleTabId,
  cardCols: ColumnDef<Row>[],
): ColumnDef<Row>[] {
  const consumed = consumedKeysForCard(tab)
  return cardCols.filter(c => !consumed.has(c.key))
}
