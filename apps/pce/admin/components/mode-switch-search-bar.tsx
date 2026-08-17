"use client"

/**
 * Orchestrates Basic vs Leo Library search behind one Airbnb-style pill.
 * Owns the under-bar exit link so both modes stay symmetrical.
 */

import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import type { LibrarySearchMode } from "@/hooks/use-library-search-mode"

const MODE_EXIT: Record<
  LibrarySearchMode,
  { to: LibrarySearchMode; icon: string; label: string }
> = {
  basic: {
    to: "leo",
    icon: "fa-wand-magic-sparkles",
    label: "Describe it to Leo instead",
  },
  leo: {
    to: "basic",
    icon: "fa-sliders",
    label: "Search with filters instead",
  },
}

export function ModeSwitchSearchBar({
  mode,
  onModeChange,
  basic,
  leo,
}: {
  mode: LibrarySearchMode
  onModeChange: (next: LibrarySearchMode) => void
  basic: (footer: ReactNode) => ReactNode
  leo: (footer: ReactNode) => ReactNode
}) {
  const exit = MODE_EXIT[mode]

  const exitLink = (
    <div className="flex min-w-0 flex-wrap items-center justify-end gap-1.5">
      <Button
        type="button"
        variant="link"
        size="sm"
        className="text-muted-foreground"
        onClick={() => onModeChange(exit.to)}
      >
        <i className={`fa-light ${exit.icon}`} aria-hidden />
        {exit.label}
      </Button>
    </div>
  )

  return mode === "basic" ? basic(exitLink) : leo(exitLink)
}
