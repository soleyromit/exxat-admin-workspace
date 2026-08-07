"use client"

/**
 * Icon-only search affordance for compact secondary rails and narrow panels.
 * Matches primary sidebar collapsed hit target (`size-9`).
 */

import * as React from "react"

import { Tip } from "@/components/ui/tip"
import { cn } from "@/lib/utils"

export function SidebarCollapsedSearchButton({
  label,
  onActivate,
  className,
}: {
  label: string
  onActivate: () => void
  className?: string
}) {
  return (
    <div className={cn("flex justify-center px-1", className)}>
      <Tip label={label} side="right">
        <button
          type="button"
          aria-label={label}
          onClick={onActivate}
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-md transition-colors",
            "text-sidebar-foreground icon-button-chrome hover:bg-interactive-hover-strong",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
          )}
        >
          <i className="fa-light fa-magnifying-glass text-md" aria-hidden="true" />
        </button>
      </Tip>
    </div>
  )
}
