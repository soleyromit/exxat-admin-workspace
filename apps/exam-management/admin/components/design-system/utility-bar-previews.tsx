"use client"

/**
 * Illustrative previews for the shell UtilityBarSlot catalog entry.
 *
 * These are static mockups, not the live `UtilityBarSlot` — the real
 * component is wired to several app-level contexts (product, Ask Leo,
 * command menu, shell layout) that aren't available inside the design
 * system catalog's render tree. Same approach as `banner-previews.tsx`:
 * illustrate the shape and states without requiring the full provider tree.
 */

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

function IconAction({ icon, label }: { icon: string; label: string }) {
  return (
    <Button type="button" variant="ghost" size="icon-sm" aria-label={label} tabIndex={-1}>
      <i className={`fa-light ${icon} text-sm`} aria-hidden="true" />
    </Button>
  )
}

function Divider() {
  return <div className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
}

function UtilityCluster({ unreadCount = 3 }: { unreadCount?: number }) {
  return (
    <div className="flex items-center gap-1">
      <IconAction icon="fa-magnifying-glass" label="Search" />
      <Button type="button" variant="ghost" size="icon-sm" aria-label="Ask Leo" tabIndex={-1}>
        <i className="fa-duotone fa-solid fa-star-christmas text-sm text-brand" aria-hidden="true" />
      </Button>
      <div className="relative">
        <IconAction icon="fa-bell" label="Notifications" />
        {unreadCount > 0 ? (
          <Badge variant="count" className="pointer-events-none absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px]">
            {unreadCount}
          </Badge>
        ) : null}
      </div>
      <IconAction icon="fa-circle-question" label="Get Help" />
      <IconAction icon="fa-gear" label="Settings" />
      <Divider />
      <Avatar className="size-8" aria-hidden="true">
        <AvatarImage src="" alt="" />
        <AvatarFallback>AM</AvatarFallback>
      </Avatar>
    </div>
  )
}

/** "sidebar-classic" — no utility bar; actions live in the sidebar footer + quick-actions row. */
export function UtilityBarClassicSidebarPreview() {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        Shell layout: Sidebar (classic) — no utility bar; product switcher, Ask Leo, search, settings, and profile stay in the sidebar
      </p>
      <div className="flex gap-3 rounded-md bg-background p-2">
        <div className="flex w-28 shrink-0 flex-col gap-1 rounded border border-sidebar-border bg-sidebar p-2">
          <div className="h-2 w-16 rounded bg-muted" />
          <div className="h-2 w-12 rounded bg-brand/30" />
          <div className="mt-auto space-y-1 border-t border-sidebar-border pt-2">
            <div className="h-2 w-14 rounded bg-muted" />
            <div className="size-6 rounded-full bg-muted" />
          </div>
        </div>
        <div className="min-h-16 flex-1 rounded border border-border bg-muted/20" />
      </div>
    </div>
  )
}

/** "utility-sidebar" — workspace-scoped row, product switcher stays in the sidebar header. */
export function UtilityBarSidebarVariantPreview() {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        Shell layout: Utility bar — product in sidebar (recommended utility mode)
      </p>
      <div className="flex items-center justify-end gap-1 rounded-md bg-background p-2">
        <UtilityCluster />
      </div>
    </div>
  )
}

/** "utility-bar" variant — full-width row above the sidebar, product switcher moves here. */
export function UtilityBarFullWidthVariantPreview() {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        Shell layout: Utility bar — product on bar — full-width row above the sidebar
      </p>
      <div className="flex items-center gap-1 bg-background px-3 py-2">
        <Button
          type="button"
          variant="ghost"
          className="h-8 gap-1.5 px-1.5"
          tabIndex={-1}
          aria-label="Current product: Exxat Prism. Switch product"
        >
          <span className="font-semibold">
            Exxat <span className="text-brand">Prism</span>
          </span>
          <i className="fa-light fa-chevron-down text-xs text-muted-foreground" aria-hidden="true" />
        </Button>
        <div className="flex flex-1 items-center justify-end gap-1">
          <UtilityCluster />
        </div>
      </div>
    </div>
  )
}
