"use client"

import type { LibraryItem } from "@/lib/mock/library"
import { isLibraryItemFavorite } from "@/lib/library-nav"
import {
  FAVORITE_HOVER_GROUP,
  FavoriteToggleButton,
} from "@/components/ui/favorite-toggle-button"

/** Parent must use this class so non-favorited stars show on row/cell hover (`group-hover/favcell`). */
export const LIBRARY_FAVORITE_HOVER_GROUP = FAVORITE_HOVER_GROUP

/** `LibraryItem`-typed wrapper over the shared `FavoriteToggleButton` (`exxat-reuse-before-custom.mdc`). */
export function LibraryFavoriteButton({
  row,
  onToggleFavorite,
  stopPropagation = true,
}: {
  row: LibraryItem
  onToggleFavorite: (row: LibraryItem) => void
  stopPropagation?: boolean
}) {
  return (
    <FavoriteToggleButton
      isFavorite={isLibraryItemFavorite(row)}
      onToggle={() => onToggleFavorite(row)}
      stopPropagation={stopPropagation}
    />
  )
}
