"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

/**
 * StatusBadge — the small "Beta"/"New"/"Alpha" chip we ship in the sidebar,
 * lifted into a reusable primitive so it can decorate any surface: tabs,
 * buttons, table headers, card titles, chart cards, panels.
 *
 * Why a dedicated component (instead of reusing generic `<Badge>`): each
 * status has a canonical color + accessible announcement. Hard-coding the
 * Tailwind classes at every callsite drifts; consumers should pass `status`
 * and let the primitive handle visuals + `aria-label`.
 *
 * Usage:
 *   <StatusBadge status="beta" />                   // pill, default size
 *   <StatusBadge status="new"  size="sm" />
 *   <StatusBadge status="beta" variant="dot" />     // small dot (e.g. in collapsed sidebar)
 *
 *   // Anchor on a target element:
 *   <span className="relative inline-flex">
 *     Tab label
 *     <StatusBadge status="beta" className="ml-1.5" />
 *   </span>
 */

const statusBadgeVariants = cva(
  "inline-flex shrink-0 items-center justify-center font-semibold leading-none tracking-wide uppercase select-none border border-transparent",
  {
    variants: {
      status: {
        beta:
          // Warm yellow — matches sidebar Beta. HC/forced-colors fall back to
          // system tokens so the chip stays visible under custom contrast.
          "bg-yellow-400 text-yellow-950 hc:bg-transparent hc:border-foreground hc:text-foreground forced-colors:bg-[Canvas] forced-colors:text-[CanvasText] forced-colors:border-[CanvasText]",
        new:
          "bg-brand text-brand-foreground hc:bg-transparent hc:border-foreground hc:text-foreground forced-colors:bg-[Highlight] forced-colors:text-[HighlightText] forced-colors:border-[HighlightText]",
        alpha:
          "bg-orange-500 text-white hc:bg-transparent hc:border-foreground hc:text-foreground forced-colors:bg-[Canvas] forced-colors:text-[CanvasText] forced-colors:border-[CanvasText]",
        preview:
          "bg-sky-500 text-white hc:bg-transparent hc:border-foreground hc:text-foreground forced-colors:bg-[Canvas] forced-colors:text-[CanvasText] forced-colors:border-[CanvasText]",
        deprecated:
          "bg-muted text-muted-foreground border-border hc:border-foreground forced-colors:bg-[Canvas] forced-colors:text-[GrayText] forced-colors:border-[GrayText]",
      },
      size: {
        xs: "h-3.5 min-w-3.5 px-1 text-[9px] rounded-sm",
        sm: "h-4   min-w-4   px-1.5 text-[10px] rounded-full",
        md: "h-5   min-w-5   px-1.5 text-[11px] rounded-full",
      },
      variant: {
        pill: "",
        // `dot` — same color, no label, for collapsed sidebars or tight chips.
        dot: "h-2 w-2 min-w-0 p-0 rounded-full",
      },
    },
    defaultVariants: {
      status: "beta",
      size: "sm",
      variant: "pill",
    },
  },
)

const STATUS_LABEL: Record<NonNullable<StatusBadgeProps["status"]>, string> = {
  beta:       "Beta",
  new:        "New",
  alpha:      "Alpha",
  preview:    "Preview",
  deprecated: "Deprecated",
}

export interface StatusBadgeProps
  extends Omit<React.ComponentProps<"span">, "children">,
    VariantProps<typeof statusBadgeVariants> {
  /** Override the visible label (still keeps status color). */
  label?: string
}

export function StatusBadge({
  className,
  status = "beta",
  size = "sm",
  variant = "pill",
  label,
  "aria-label": ariaLabel,
  ...props
}: StatusBadgeProps) {
  const visibleLabel = label ?? STATUS_LABEL[status!]
  // Dot variant has no visible text — keep the accessible name.
  const a11yLabel = ariaLabel ?? visibleLabel

  return (
    <span
      data-slot="status-badge"
      data-status={status}
      data-variant={variant}
      aria-label={a11yLabel}
      className={cn(statusBadgeVariants({ status, size, variant }), className)}
      {...props}
    >
      {variant === "dot" ? <span className="sr-only">{a11yLabel}</span> : visibleLabel}
    </span>
  )
}

export { statusBadgeVariants }
