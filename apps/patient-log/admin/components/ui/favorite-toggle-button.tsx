"use client"

import { Button } from "@/components/ui/button"
import { Tip } from "@/components/ui/tip"
import { cn } from "@/lib/utils"

/** Parent must use this class so a non-favorited star reveals on row/cell hover. */
export const FAVORITE_HOVER_GROUP = "group/favcell"

/**
 * Row-shape-agnostic favorite star toggle — one implementation shared by
 * every table that has a `favoriteFilter` name/title column (library
 * questions, course forms, course reports, …). Row-typed wrappers (e.g.
 * `LibraryFavoriteButton`) compose this instead of re-implementing the same
 * icon/opacity/hover chrome per row shape (`exxat-reuse-before-custom.mdc`).
 */
export function FavoriteToggleButton({
  isFavorite,
  onToggle,
  label,
  stopPropagation = true,
}: {
  isFavorite: boolean
  onToggle: () => void
  /** Item name folded into the accessible label ("Remove <label> from favorites"). Omit for a generic label. */
  label?: string
  stopPropagation?: boolean
}) {
  const suffix = label ? ` ${label}` : ""
  const tip = isFavorite ? `Remove${suffix} from favorites` : `Add${suffix} to favorites`
  return (
    <Tip side="top" label={tip}>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        aria-pressed={isFavorite}
        aria-label={tip}
        className={cn(
          "shrink-0 rounded-md transition-opacity duration-150",
          isFavorite
            ? "text-amber-600 opacity-100 hover:bg-amber-500/15 hover:text-amber-700"
            : "text-muted-foreground opacity-0 hover:bg-muted hover:text-amber-600 group-hover/favcell:opacity-100 focus-visible:opacity-100",
        )}
        onClick={e => {
          if (stopPropagation) e.stopPropagation()
          onToggle()
        }}
      >
        <i className={cn("text-sm", isFavorite ? "fa-solid fa-star" : "fa-light fa-star")} aria-hidden />
      </Button>
    </Tip>
  )
}
