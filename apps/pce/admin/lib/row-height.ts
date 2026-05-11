/**
 * Table row density — shared by Properties drawer tiles and useTableState.
 */
export type RowHeight = "compact" | "default" | "comfortable"

export const ROW_HEIGHT_TILES: readonly { value: RowHeight; label: string; icon: string }[] = [
  { value: "compact",     label: "Compact",     icon: "fa-down-to-line" },
  { value: "default",     label: "Default",     icon: "fa-arrows-up-down" },
  { value: "comfortable", label: "Comfortable", icon: "fa-up-to-line" },
]
