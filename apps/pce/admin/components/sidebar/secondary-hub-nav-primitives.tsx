"use client"

/**
 * Shared building blocks for hub secondary navs (Library, Learning activities, …).
 * Every `*-secondary-nav.tsx` MUST use these so compact-rail parity cannot drift.
 *
 * Checklist: `docs/exxat-ds/library-nav-ia-pattern.md` § Hub secondary-nav parity.
 */

import * as React from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { SidebarNavLabel } from "@/components/ui/sidebar-nav-label"
import { Tip } from "@/components/ui/tip"
import { useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { useSecondaryPanel } from "@/components/sidebar/secondary-panel"
import { useIsMobile } from "@/hooks/use-mobile"
import { useSidebarReflowZoom } from "@/hooks/use-sidebar-reflow-zoom"

/** Desktop pinned-rail vs flyout — same logic as `library-secondary-nav.tsx`. */
export function useSecondaryHubNavChrome() {
  const { openPanel, secondaryPanelCompact } = useSecondaryPanel()
  const { dismissNavFlyout } = useSidebar()
  const isMobile = useIsMobile()
  const reflowZoom = useSidebarReflowZoom()
  const navFlyout = isMobile || reflowZoom
  const showCompactRail = secondaryPanelCompact && !navFlyout

  return {
    openPanel,
    dismissNavFlyout,
    navFlyout,
    showCompactRail,
    secondaryPanelCompact,
  }
}

/** Expanded secondary row — icon + wrapping label. */
export function SecondaryHubNavRow({
  href,
  active,
  iconClass,
  label,
  onClick,
}: {
  href: string
  active: boolean
  iconClass: string
  label: string
  onClick?: () => void
}) {
  const { dismissNavFlyout } = useSidebar()
  return (
    <li className="min-w-0">
      <Tip label={label} side="right" triggerClassName="block w-full min-w-0">
        <Link
          to={href}
          onClick={() => {
            onClick?.()
            dismissNavFlyout()
          }}
          aria-current={active ? "page" : undefined}
          className={cn(
            "flex h-8 w-full min-w-0 items-center gap-2 rounded-md px-2 text-left text-sm transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
            active
              ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground ring-1 ring-inset ring-sidebar-border/80"
              : "text-sidebar-foreground hover:bg-sidebar-accent/50",
          )}
        >
          <span className="flex size-4 shrink-0 items-center justify-center" aria-hidden>
            <i
              className={cn(active ? "fa-solid" : "fa-light", iconClass, "block text-xs leading-none")}
              aria-hidden
            />
          </span>
          <SidebarNavLabel>{label}</SidebarNavLabel>
        </Link>
      </Tip>
    </li>
  )
}

/** Compact icon-rail row — `size-9` hit target (primary sidebar collapsed parity). */
export function SecondaryHubIconNavRow({
  href,
  active,
  iconClass,
  label,
  onClick,
}: {
  href: string
  active: boolean
  iconClass: string
  label: string
  onClick?: () => void
}) {
  const { dismissNavFlyout } = useSidebar()
  return (
    <li className="flex w-full justify-center" role="none">
      <Tip label={label} side="right">
        <Link
          to={href}
          onClick={() => {
            onClick?.()
            dismissNavFlyout()
          }}
          aria-current={active ? "page" : undefined}
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-md transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
            active
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent/50",
          )}
        >
          <span className="text-center text-md leading-none" aria-hidden>
            <i className={cn(active ? "fa-solid" : "fa-light", iconClass)} aria-hidden />
          </span>
        </Link>
      </Tip>
    </li>
  )
}

/** Icon-only shell when primary sidebar expands (`secondaryPanelCompact`). */
export function SecondaryHubNavCompactShell({
  ariaLabel,
  panelId,
  footer,
  children,
}: {
  ariaLabel: string
  /** `PANELS` registry id — expand chevron calls `openPanel(panelId)`. */
  panelId: string
  footer?: React.ReactNode
  children: React.ReactNode
}) {
  const { openPanel } = useSecondaryPanel()

  return (
    <nav className="flex min-h-0 flex-1 flex-col" aria-label={ariaLabel}>
      <div className="flex flex-col items-center border-b border-sidebar-border/60 px-1 py-2">
        <Tip label="Show labels" side="right">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-9 shrink-0"
            aria-label="Show labels"
            onClick={() => openPanel(panelId)}
          >
            <i className="fa-light fa-angles-right text-md" aria-hidden="true" />
          </Button>
        </Tip>
      </div>
      <ul className="flex flex-1 flex-col items-center gap-1 overflow-y-auto px-1 py-2">
        {children}
      </ul>
      {footer}
    </nav>
  )
}

/** Section eyebrow + optional action in expanded secondary nav lists. */
export function SecondaryHubNavSectionHeader({
  label,
  action,
}: {
  label: string
  action?: React.ReactNode
}) {
  return (
    <li className="select-none">
      <div className="flex items-center justify-between gap-2 px-2 pt-3 pb-0.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-secondary-action-foreground">
          {label}
        </span>
        {action}
      </div>
    </li>
  )
}
