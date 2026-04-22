"use client"

import * as React from "react"

import { cn } from "../../lib/utils"

/**
 * Kbd — display keyboard keys and shortcuts (shadcn/ui).
 * @see https://ui.shadcn.com/docs/components/radix/kbd
 *
 * Variants:
 *  - "tile" (default) — filled tile with border; use in tooltips, menus, docs,
 *    or any surface where the Kbd sits on neutral background.
 *  - "bare" — no background, no border; inherits `currentColor` at 70% opacity.
 *    Use **inside buttons** (primary/secondary workflow actions) so the hint
 *    does not look like a pasted-on patch against the button fill.
 */
function Kbd({
  className,
  variant = "tile",
  "aria-hidden": ariaHidden,
  ...props
}: React.ComponentProps<"kbd"> & { variant?: "tile" | "bare" }) {
  // Bare variant lives inside buttons — the button already carries the
  // accessible name, so the inline kbd is redundant noise for screen readers.
  // Default to aria-hidden unless a consumer explicitly opts in.
  const hidden = ariaHidden ?? (variant === "bare" ? true : undefined)
  return (
    <kbd
      data-slot="kbd"
      data-variant={variant}
      aria-hidden={hidden}
      className={cn(
        "pointer-events-none inline-flex h-5 min-w-5 select-none items-center justify-center gap-1 px-1 font-sans text-xs font-medium",
        variant === "tile" &&
          "bg-muted text-muted-foreground rounded-sm border",
        variant === "bare" && "text-current/70 px-0",
        className,
      )}
      {...props}
    />
  )
}

function KbdGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="kbd-group"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    />
  )
}

export { Kbd, KbdGroup }
