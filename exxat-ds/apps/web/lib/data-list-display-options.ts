/**
 * Display options for Data list (table / board / etc.) — shared across view types
 * so hide/show preferences persist when switching views.
 */

export type BoardLineCount = 1 | 2 | 3

export interface DataListDisplayOptions {
  /** Max lines for primary text blocks on board cards */
  boardLineCount: BoardLineCount
  /** Page title block (Placements + subtitle) */
  showViewTitle: boolean
  /** Board: phase column titles + descriptions. Table: column header row. */
  showColumnLabels: boolean
  /** Board: “N cards” under each phase column */
  showBoardColumnCounts: boolean
  boardNewCardAbove: boolean
  /** Toolbar search control (table view) */
  showToolbarSearch: boolean
}

export const DEFAULT_DATA_LIST_DISPLAY_OPTIONS: DataListDisplayOptions = {
  boardLineCount: 2,
  showViewTitle: true,
  showColumnLabels: true,
  showBoardColumnCounts: true,
  boardNewCardAbove: true,
  showToolbarSearch: true,
}
