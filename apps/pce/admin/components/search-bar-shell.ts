/**
 * Shared pill chrome for the Library mode-switch search bar.
 *
 * Basic (Airbnb segments) and Leo (AI composer) swap behind one preference.
 * One class recipe keeps border, fill, height, and focus ring identical so the
 * control does not jump when the author switches modes.
 *
 * Geometry: one row of `SEARCH_BAR_ROW_HEIGHT` + `p-1.5` + 1px border ≈ 50px.
 */

import { cn } from "@/lib/utils"

export const SEARCH_BAR_ROW_HEIGHT = "h-9"

export function searchBarShellClassName(...extra: (string | undefined)[]) {
  return cn(
    "min-w-0 rounded-full border border-[color:var(--control-border)] bg-card p-1.5 shadow-xs",
    "focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30",
    ...extra,
  )
}
