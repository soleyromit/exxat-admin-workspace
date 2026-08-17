"use client"

/**
 * The opt-in a beta product offers.
 *
 * The badge that goes with it is the DS `StatusBadge` in its product mode
 * (`<StatusBadge status="beta" />`) — the same chip the sidebar puts on a new
 * nav item, so a product page and a nav row say "beta" the same way. Only the
 * action below is specific to the products home.
 */

import * as React from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * The beta opt-in.
 *
 * A beta product asks for a different move than a finished one: the thing on
 * offer is access, not a purchase, so the button turns it on rather than
 * booking a conversation. Confirmation is inline and stays put — the control
 * that caused it is the right place to answer, and a toast would be gone before
 * a reader scrolling a shelf noticed it.
 */
export function BetaAccessAction({
  label,
  size = "sm",
  variant = "outline",
  className,
}: {
  /** Product name, for the screen-reader label — a shelf shows several of these. */
  label: string
  size?: "sm" | "default" | "lg"
  variant?: "default" | "outline"
  className?: string
}) {
  const [requested, setRequested] = React.useState(false)
  const dense = size === "sm"

  if (requested) {
    return (
      <p
        role="status"
        className={cn(
          "inline-flex w-fit items-center gap-2 rounded-lg bg-success-soft text-sm",
          dense ? "px-2.5 py-1.5 text-xs" : "px-3 py-2",
          className,
        )}
      >
        <i className="fa-light fa-circle-check text-success" aria-hidden="true" />
        {dense ? "Beta requested" : "You're on the beta. We'll email you when it is switched on."}
      </p>
    )
  }

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      onClick={() => setRequested(true)}
      className={cn("w-fit shrink-0", className)}
    >
      <i className="fa-light fa-flask text-xs" aria-hidden="true" />
      Try the beta
      <span className="sr-only"> of {label}</span>
    </Button>
  )
}
