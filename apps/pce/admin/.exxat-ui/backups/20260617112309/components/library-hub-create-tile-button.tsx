"use client"

/**
 * Pill action from Question hub → Create a question (e.g. "Draft with Leo" + AI badge).
 * Single implementation — do not duplicate classes on other routes.
 */

import * as React from "react"

import { Button } from "@exxatdesignux/ui"

import { cn } from "@/lib/utils"

export interface LibraryHubCreateTileButtonProps {
  label: string
  icon: string
  onClick: () => void
  /** When `"AI"`, renders duotone Leo star + uppercase AI chip (hub Leo tile). */
  badge?: "AI" | null
  disabled?: boolean
  "aria-busy"?: boolean
  /** Shown instead of `label` when `aria-busy` is true. */
  busyLabel?: string
  className?: string
}

export function LibraryHubCreateTileButton({
  label,
  icon,
  onClick,
  badge = null,
  disabled = false,
  "aria-busy": ariaBusy,
  busyLabel,
  className,
}: LibraryHubCreateTileButtonProps) {
  const displayLabel = ariaBusy && busyLabel ? busyLabel : label

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      aria-busy={ariaBusy}
      className={cn("gap-1.5 rounded-full px-3 text-xs font-medium", className)}
    >
      <i
        className={cn(
          badge === "AI" ? "fa-duotone fa-solid" : "fa-light",
          icon,
          "text-xs",
          badge === "AI" ? "text-brand" : "text-muted-foreground",
        )}
        aria-hidden="true"
      />
      {displayLabel}
      {badge === "AI" ? (
        <span className="rounded-full bg-brand/10 px-1.5 py-px text-xs font-semibold text-brand">
          AI
        </span>
      ) : null}
    </Button>
  )
}
