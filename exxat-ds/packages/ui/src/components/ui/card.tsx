/**
 * Card — surface component
 *
 * ── SPACING SYSTEM (do not override) ────────────────────────────────────────
 *   Card owns all vertical rhythm:
 *     py-4   → 16px top + 16px bottom padding on the card itself
 *     gap-4  → 16px gap between CardHeader, CardContent, and CardFooter
 *
 *   Rules:
 *   ✗  Never add pb-X / pt-X to CardContent or CardHeader
 *   ✗  Never add h-full / flex / flex-col to the Card wrapper
 *   ✗  Never add flex-1 / min-h-0 to CardContent
 *   ✗  Never add shrink-0 / pb-2 to CardHeader
 *   ✓  For scrollable list content (Activity, Tasks): add overflow-auto only
 *   ✓  For equal-height grid pairs in MixView: handle at grid cell level
 *
 * ── GLOW TREATMENT ──────────────────────────────────────────────────────────
 *   Only two approved uses — see full spec in key-metrics.tsx GLOW GUIDELINE:
 *   1. AI surfaces   (Insights card, Ask Leo responses)  → opacity 0.12–0.16
 *   2. Hero sections (Key Metrics KPI band, onboarding)  → opacity 0.18–0.24
 *   Always pair with overflow-hidden on the Card.
 *   Never add glow to: Tasks, Activity, Learn, Charts, nav elements.
 *
 * ── FOOTER PATTERN ──────────────────────────────────────────────────────────
 *   Use CardFooter for card-level CTA actions (e.g. "View all tasks", "Ask Leo").
 *   CardFooter renders with border-t + bg-muted/50 automatically.
 *   Do not put primary workflow actions in CardFooter — use CardHeader CardAction.
 *
 * ── SIZE VARIANT ────────────────────────────────────────────────────────────
 *   size="sm"  → tighter spacing (py-3, gap-3, px-3). Use inside compact grids.
 *   size="default" (implicit) → standard spacing described above.
 */

import * as React from "react"

import { cn } from "../../lib/utils"

function Card({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card flex flex-col gap-4 overflow-hidden rounded-xl bg-card py-4 text-sm text-card-foreground ring-1 ring-foreground/10 has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:gap-3 data-[size=sm]:py-3 data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-4 group-data-[size=sm]/card:px-3 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-4 group-data-[size=sm]/card:[.border-b]:pb-3",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-sans text-base leading-snug font-medium group-data-[size=sm]/card:text-sm",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-4 group-data-[size=sm]/card:px-3", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-xl border-t bg-muted/50 p-4 group-data-[size=sm]/card:p-3",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
