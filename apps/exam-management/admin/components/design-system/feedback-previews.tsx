"use client"

import { StatusBadge } from "@/components/ui/status-badge"
import { Badge, BadgeCount } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const BADGE_VARIANTS = [
  { variant: "default" as const, label: "Default" },
  { variant: "secondary" as const, label: "Secondary" },
  { variant: "outline" as const, label: "Outline" },
  { variant: "destructive" as const, label: "Destructive" },
  { variant: "ghost" as const, label: "Ghost" },
  { variant: "link" as const, label: "Link" },
]

const SEMANTIC_STATUS_EXAMPLES = [
  { label: "Compliant", tone: "success" as const, icon: "fa-circle-check" },
  { label: "In review", tone: "info" as const, icon: "fa-clock" },
  { label: "Draft", tone: "neutral" as const, icon: "fa-pen" },
  { label: "Due soon", tone: "warning" as const, icon: "fa-triangle-exclamation" },
  { label: "Non-compliant", tone: "danger" as const, icon: "fa-circle-xmark" },
]

export function BadgeVariantsPreview() {
  return (
    <div className="flex flex-wrap gap-2">
      {BADGE_VARIANTS.map(({ variant, label }) => (
        <Badge key={variant} variant={variant}>
          {label}
        </Badge>
      ))}
    </div>
  )
}

export function BadgeSizesPreview() {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <StatusBadge label="Compliant" tone="success" size="sm" />
      <StatusBadge
        label="Compliant"
        tone="success"
        icon="fa-circle-check"
        size="md"
      />
    </div>
  )
}

export function BadgeWithIconPreview() {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant="outline">
        <i className="fa-light fa-graduation-cap" data-icon="inline-start" aria-hidden="true" />
        PT
      </Badge>
      <Badge variant="secondary">
        <i className="fa-light fa-layer-group" data-icon="inline-start" aria-hidden="true" />
        Fall 2026
      </Badge>
      <Badge variant="destructive">
        <i className="fa-light fa-triangle-exclamation" data-icon="inline-start" aria-hidden="true" />
        Overdue
        <i className="fa-light fa-chevron-right" data-icon="inline-end" aria-hidden="true" />
      </Badge>
    </div>
  )
}

function IconBadgeAnchor({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("relative inline-flex w-fit shrink-0", className)}>{children}</span>
}

function NotificationBellButton({ label }: { label: string }) {
  return (
    <Button variant="ghost" size="icon-sm" aria-label={label}>
      <i className="fa-light fa-bell" aria-hidden="true" />
    </Button>
  )
}

export function BadgeCountIndicatorPreview() {
  return (
    <IconBadgeAnchor>
      <NotificationBellButton label="Notifications, unread" />
      <span
        className="pointer-events-none absolute top-0.5 end-0.5 z-10 size-2 rounded-full border-2 border-background bg-destructive"
        aria-hidden="true"
      />
    </IconBadgeAnchor>
  )
}

export function BadgeCountOverlayPreview() {
  return (
    <IconBadgeAnchor>
      <NotificationBellButton label="Notifications, 3 unread" />
      <Badge className="pointer-events-none absolute -top-1.5 -end-1.5 z-10 h-4 min-w-4 justify-center rounded-full border-transparent px-1 py-0" variant="count">
        3
      </Badge>
    </IconBadgeAnchor>
  )
}

export function BadgeCountPreview() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="secondary" className="tabular-nums">
        24 placements
      </Badge>
      <Badge variant="outline" className="tabular-nums">
        Question 3 of 20
      </Badge>
    </div>
  )
}

export function BadgeCountOnlyPreview() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <BadgeCount count={2} />
        <span className="text-sm font-medium">selected</span>
      </div>
      <BadgeCount count={12} />
      <BadgeCount count={128} />
    </div>
  )
}

export function StatusBadgeSemanticPreview() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {SEMANTIC_STATUS_EXAMPLES.map((item) => (
          <StatusBadge key={`plain-${item.tone}`} label={item.label} tone={item.tone} size="sm" />
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-2">
        {SEMANTIC_STATUS_EXAMPLES.map((item) => (
          <StatusBadge key={`icon-${item.tone}`} {...item} size="md" />
        ))}
      </div>
    </div>
  )
}

export function StatusBadgeProductPreview() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <StatusBadge status="new" />
      <StatusBadge status="beta" />
      <StatusBadge status="alpha" />
      <StatusBadge status="preview" />
      <StatusBadge status="deprecated" />
      <StatusBadge status="beta" variant="dot" aria-label="Beta" />
    </div>
  )
}


export function SkeletonTextPreview() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  )
}

export function SkeletonListRowPreview() {
  return (
    <div className="flex w-full max-w-md items-center gap-3">
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}

export function SkeletonTableRowPreview() {
  return (
    <div className="flex w-full max-w-lg items-center gap-3">
      <Skeleton className="size-4 shrink-0 rounded-[4px]" />
      <Skeleton className="h-4 w-[28%]" />
      <Skeleton className="h-4 w-[18%]" />
      <Skeleton className="ml-auto h-6 w-16 rounded-full" />
    </div>
  )
}

export function SkeletonFormPreview() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-full" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-20 w-full" />
      </div>
      <Skeleton className="h-9 w-28" />
    </div>
  )
}

/** @deprecated Use SkeletonListRowPreview */
export const SkeletonCardPreview = SkeletonListRowPreview

export function KbdTilePreview() {
  return (
    <p className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
      Open search
      <KbdGroup>
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>
    </p>
  )
}

/** @deprecated Use KbdTilePreview */
export const KbdPreview = KbdTilePreview

export function KbdBareInButtonPreview() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" size="sm">
        Save
        <Kbd variant="bare">⌘S</Kbd>
      </Button>
      <Button type="button" size="sm" variant="outline">
        Export
        <Kbd variant="bare">⌘⇧E</Kbd>
      </Button>
    </div>
  )
}

export function KbdGroupPreview() {
  return (
    <KbdGroup>
      <Kbd>⌘</Kbd>
      <Kbd>⇧</Kbd>
      <Kbd>P</Kbd>
    </KbdGroup>
  )
}

export function KbdSymbolsPreview() {
  return (
    <div className="flex flex-wrap gap-2">
      <Kbd>⌘</Kbd>
      <Kbd>⌥</Kbd>
      <Kbd>⇧</Kbd>
      <Kbd>⌃</Kbd>
      <Kbd>⏎</Kbd>
      <Kbd>⌫</Kbd>
    </div>
  )
}
