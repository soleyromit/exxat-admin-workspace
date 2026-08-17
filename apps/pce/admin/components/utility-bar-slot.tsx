"use client"

/**
 * UtilityBarSlot — persistent, full-width shell row for global utility
 * actions. Mounted ONCE in `app/(app)/layout.tsx`, ABOVE and OUTSIDE the
 * sidebar+content row — matching the DS's `UtilityBarSlot` full-width variant
 * (`apps/web/components/utility-bar-slot.tsx`), not scoped to the content
 * area. This is what fixes the compact-shell migration's biggest structural
 * gap: the rail used to carry its own brand header and the bar was
 * content-scoped (inside `SiteHeader`); now the rail is icon rows only and
 * the bar spans the full viewport width, sitting above it.
 *
 * Leading: sidebar toggle · product label. Middle: portal target for the
 * active page's `SiteHeader` breadcrumb/back-link (see
 * `contexts/compact-header-slot-context.tsx`). Trailing: search ·
 * notifications · what's new · help · Ask Leo · school switcher · profile.
 */

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { useModKeyLabel } from "@/hooks/use-mod-key-label"
import { requestOpenCommandMenu } from "@/components/command-menu"
import { useAskLeo } from "@/components/ask-leo-context"
import { useOneShotIntro } from "@/hooks/use-one-shot-intro"
import { AskLeoUtilityWash } from "@/components/pce/ask-leo-utility-wash"
import { NotificationBell } from "@/components/notification-bell"
import { UtilityBarWhatsNew } from "@/components/utility-bar-whats-new"
import { UtilityUserMenu } from "@/components/utility-user-menu"
import { UtilityBarProductLabel } from "@/components/pce/utility-bar-product-label"
import { UtilityBarSchoolSwitcher } from "@/components/pce/utility-bar-school-switcher"
import { utilityBarActionButtonClass } from "@/components/utility-bar-chrome"
import { useCompactHeaderSlotRef } from "@/contexts/compact-header-slot-context"
import { cn } from "@/lib/utils"

function UtilityBarSidebarToggle() {
  const { state, isMobile } = useSidebar()
  const mod = useModKeyLabel()
  const collapsed = state === "collapsed" && !isMobile
  const label = collapsed ? "Expand sidebar" : "Collapse sidebar"
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <SidebarTrigger
          aria-label={label}
          className={cn("size-8 shrink-0 text-sidebar-foreground", utilityBarActionButtonClass)}
        />
      </TooltipTrigger>
      <TooltipContent side="bottom" className="flex flex-wrap items-center gap-1.5">
        <span>{label}</span>
        <KbdGroup>
          <Kbd>{mod}</Kbd>
          <Kbd>B</Kbd>
        </KbdGroup>
      </TooltipContent>
    </Tooltip>
  )
}

function SearchTrigger() {
  const mod = useModKeyLabel()
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Search"
          onClick={requestOpenCommandMenu}
          className={utilityBarActionButtonClass}
        >
          <i className="fa-light fa-magnifying-glass text-sm" aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="flex items-center gap-1.5">
        <span>Search</span>
        <KbdGroup>
          <Kbd>{mod}</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </TooltipContent>
    </Tooltip>
  )
}

function HelpTrigger() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Get Help"
          className={utilityBarActionButtonClass}
          asChild
        >
          <a href="/help">
            <i className="fa-light fa-circle-question text-sm" aria-hidden="true" />
          </a>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">Get Help</TooltipContent>
    </Tooltip>
  )
}

const askLeoLauncherChipClass =
  "border-brand/45 bg-transparent hover:border-brand/70 hover:bg-transparent focus-visible:bg-transparent data-[leo-open]:border-brand data-[leo-open]:bg-transparent"

function AskLeoControl() {
  const { open, setOpen } = useAskLeo()
  /* One-shot arrival glow — see AskLeoUtilityWash for the wash layer this
     pairs with. Started upstairs so a replay doesn't retrigger on every
     re-render once the intro has already played this session. */
  const glowIntro = useOneShotIntro("ask-leo-launcher")

  return (
    <div
      data-ask-leo-utility-glow-wrap=""
      data-intro={glowIntro.active ? "" : undefined}
      className="relative z-[1] flex shrink-0 items-center"
    >
      <AskLeoUtilityWash introActive={glowIntro.active} />
      <span
        aria-hidden
        data-ask-leo-utility-glow=""
        className="pointer-events-none absolute inset-0 forced-colors:hidden"
        onAnimationEnd={event => {
          if (event.animationName === "ask-leo-utility-glow-intro") {
            glowIntro.end()
          }
        }}
      />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-slot="ask-leo-toggle"
            aria-label="Ask Leo"
            data-leo-open={open ? "" : undefined}
            onClick={() => setOpen(true)}
            className={cn(
              "relative z-[1] gap-1.5 px-2.5",
              askLeoLauncherChipClass,
              utilityBarActionButtonClass,
            )}
          >
            <i className="fa-light fa-sparkles text-sm" aria-hidden="true" />
            Ask Leo
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Ask Leo</TooltipContent>
      </Tooltip>
    </div>
  )
}

/** Portal target for the active page's `SiteHeader` breadcrumb / back-link. */
function UtilityBarBreadcrumbSlot() {
  const registerHeaderSlot = useCompactHeaderSlotRef()
  return (
    <div
      ref={registerHeaderSlot}
      data-compact-header-slot=""
      className="flex h-full min-h-0 min-w-0 flex-1 items-center overflow-hidden"
    />
  )
}

export function UtilityBarSlot() {
  return (
    <nav
      aria-label="Global utilities"
      data-slot="utility-bar"
      className="sticky top-0 z-50 flex h-(--shell-utility-bar-height) min-h-(--shell-utility-bar-height) w-full min-w-0 shrink-0 items-center gap-1 border-b border-sidebar-border bg-background pe-3"
    >
      <div className="flex min-w-0 shrink items-center self-stretch gap-0">
        <div className="flex h-full shrink-0 items-center justify-center w-(--sidebar-width-icon)">
          <UtilityBarSidebarToggle />
        </div>
        <Separator
          orientation="vertical"
          className="data-[orientation=vertical]:h-auto data-[orientation=vertical]:min-h-full data-[orientation=vertical]:self-stretch data-[orientation=vertical]:w-px"
        />
        <div className="flex min-w-0 items-center px-1.5">
          <UtilityBarProductLabel />
        </div>
        <Separator
          orientation="vertical"
          className="h-4 shrink-0 self-center data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center"
        />
      </div>

      <UtilityBarBreadcrumbSlot />

      <div className="relative z-[1] ms-auto flex min-w-0 shrink-0 items-center gap-1">
        <div className="flex shrink-0 items-center gap-1">
          <SearchTrigger />
          <NotificationBell />
          <UtilityBarWhatsNew />
          <HelpTrigger />
          <AskLeoControl />
        </div>
        <div className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden="true" />
        <div className="flex min-w-0 shrink-0 items-center gap-1">
          <UtilityBarSchoolSwitcher />
          <UtilityUserMenu />
        </div>
      </div>
    </nav>
  )
}
