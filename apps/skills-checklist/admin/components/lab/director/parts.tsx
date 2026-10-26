"use client"

/**
 * Small director pieces. State is glyph + word + colour. Verification statuses are neutral (they name a step, not a judgement);
 * the one amber accent is a shortfall (required skills not achieved). Nothing is red, nothing is saturated blue.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { DiamondGlyph } from "@/components/lab/viz"
import { STATUS_LABEL, type VerifyStatus } from "@/lib/lab/director"
import { LINK as LINK_STANDALONE, LINK_IN_TABLE } from "@/components/lab/link-styles"
import { fmt } from "@/lib/v2/format"

/** One link treatment for the lab (components/lab/link-styles.ts); the old names stay so importers keep working. */
export const LINK = LINK_IN_TABLE
/** A link standing alone in text: always underlined. */
export const LINK_U = LINK_STANDALONE

const STATUS_ICON: Record<VerifyStatus, string> = { ready: "fa-circle-check", changed: "fa-arrows-rotate", blocked: "fa-lock", verified: "fa-badge-check" }

export function StatusMark({ status }: { status: VerifyStatus }) {
  return <StatusBadge label={STATUS_LABEL[status]} tone="neutral" icon={STATUS_ICON[status]} size="sm" />
}

/** Required skills not achieved: amber diamond plus the words. Zero reads as plain text. */
export function GapMark({ n, achieved, required }: { n: number; achieved: number; required: number }) {
  if (n === 0) return <span className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">{`${achieved} of ${required}`}</span>
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm tabular-nums text-foreground">
      <DiamondGlyph />
      <span>{`${achieved} of ${required}`}</span>
      <span className="text-muted-foreground">{n === 1 ? "1 gap" : `${n} gaps`}</span>
    </span>
  )
}

/** A count that opens its list. Zero is not a link. */
export function CountLink({ n, href, label, className = "" }: { n: number; href: string; label: string; className?: string }) {
  if (n === 0) return <span className={`tabular-nums text-muted-foreground ${className}`}>0</span>
  return (
    <Link className={`${LINK} tabular-nums ${className}`} href={href} aria-label={label}>
      {fmt(n)}
    </Link>
  )
}

export function Calm({ icon, title, body, children }: { icon: string; title: string; body: string; children?: React.ReactNode }) {
  return (
    <Card size="sm" className="self-start" data-region="empty">
      <CardContent className="flex items-start gap-3 py-1">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <i className={`fa-light ${icon}`} aria-hidden="true" />
        </span>
        <span className="flex flex-col gap-1">
          <span className="text-sm font-semibold">{title}</span>
          <span className="max-w-prose text-sm text-muted-foreground">{body}</span>
          {children}
        </span>
      </CardContent>
    </Card>
  )
}

/** Final-shape loading: a band and a list, so nothing jumps when the figures land. */
export function DirectorSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-4" data-loading aria-hidden="true">
      <Skeleton className="h-28 w-full rounded-lg" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  )
}

export { initialsOf } from "@/lib/v2/format"
