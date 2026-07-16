"use client"

/**
 * UtilityBarSlot — persistent shell row for global utility actions
 * (Search, Ask Leo, Notifications, Settings, Help, Profile, and — in the
 * "utility-bar" shell layout variant — the product switcher too).
 *
 * Three shell layout variants, driven by `useShellLayout()`:
 *   - "sidebar-classic": not mounted — actions live in the sidebar.
 *   - "utility-sidebar": mounted inside `[data-app-shell-workspace]`,
 *     spanning the secondary rail + main canvas only.
 *   - "utility-bar": mounted as a full-width row ABOVE the sidebar+workspace
 *     row. Product switcher renders in the bar's left cluster.
 *
 * At mobile / high-zoom (`useUtilityBarCompact`), Search, Ask Leo, Help, and
 * Settings collapse into a single More menu; Notifications + profile stay visible.
 */

import * as React from "react"
import { Link, useLocation } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { useModKeyLabel } from "@/hooks/use-mod-key-label"
import { useIsMobile } from "@/hooks/use-mobile"
import { useSidebarReflowZoom } from "@/hooks/use-sidebar-reflow-zoom"
import { requestOpenCommandMenu } from "@/components/command-menu"
import { AskLeoShortcutKbds, useAskLeo } from "@/components/ask-leo-context"
import { AskLeoToggle } from "@/components/ask-leo-sidebar"
import { NotificationBell } from "@/components/notification-bell"
import { UtilityUserMenu } from "@/components/utility-user-menu"
import { UtilityBarProductSwitcher } from "@/components/utility-bar-product-switcher"
import { useProduct } from "@/contexts/product-context"
import { useShellLayout, isFullWidthUtilityBar } from "@/contexts/shell-layout-context"
import { getSecondaryNavForProduct } from "@/lib/mock/navigation"
import { cn } from "@/lib/utils"
import { utilityBarActionButtonClass } from "@/components/utility-bar-chrome"

const SUPPRESS_UTILITY_BAR_PATHS: ReadonlyArray<string> = ["/builder/onboarding"]

function useUtilityBarCompact() {
  const isMobile = useIsMobile()
  const reflowZoom = useSidebarReflowZoom()
  return isMobile || reflowZoom
}

export function UtilityBarSlot() {
  const location = useLocation()
  const { variant } = useShellLayout()
  const fullWidth = isFullWidthUtilityBar(variant)
  const compact = useUtilityBarCompact()
  if (SUPPRESS_UTILITY_BAR_PATHS.some(path => location.pathname.startsWith(path))) return null

  return (
    <nav
      aria-label="Global utilities"
      data-slot="utility-bar"
      className={cn(
        "relative flex min-w-0 shrink-0 items-center gap-1",
        fullWidth
          ? "z-30 h-12 min-h-12 w-full bg-sidebar pe-2 sm:pe-3"
          : "z-40 mx-2 mb-1.5 overflow-hidden py-1 md:mb-2",
      )}
    >
      {fullWidth ? <UtilityBarProductSwitcher /> : null}

      <div className="flex min-w-0 flex-1 items-center justify-end gap-1">
        {compact ? (
          <>
            <NotificationBell className={utilityBarActionButtonClass} />
            <UtilityBarMoreMenu />
          </>
        ) : (
          <>
            <SearchTrigger />
            <AskLeoToggle className={utilityBarActionButtonClass} />
            <NotificationBell className={utilityBarActionButtonClass} />
            <HelpTrigger />
            <SettingsTrigger />
          </>
        )}
      </div>

      <div className="mx-0.5 h-5 w-px shrink-0 bg-border sm:mx-1" aria-hidden="true" />
      <div className="shrink-0">
        <UtilityUserMenu />
      </div>
    </nav>
  )
}

function UtilityBarMoreMenu() {
  const mod = useModKeyLabel()
  const { product } = useProduct()
  const [settings] = getSecondaryNavForProduct(product)
  const { toggle: toggleAskLeo, open: askLeoOpen } = useAskLeo()

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="More utilities"
              className={utilityBarActionButtonClass}
            >
              <i className="fa-light fa-ellipsis text-sm" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">More</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" side="bottom" sideOffset={8} className="w-52">
        <DropdownMenuItem
          onClick={() => requestOpenCommandMenu()}
          className="gap-2"
        >
          <i className="fa-light fa-magnifying-glass w-4 text-center text-sm" aria-hidden="true" />
          <span className="flex-1">Search</span>
          <KbdGroup className="ms-auto">
            <Kbd>{mod}</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={toggleAskLeo} className="gap-2">
          <i
            className="fa-duotone fa-solid fa-star-christmas w-4 text-center text-sm text-brand"
            aria-hidden="true"
          />
          <span className="flex-1">{askLeoOpen ? "Close Ask Leo" : "Ask Leo"}</span>
          <AskLeoShortcutKbds className="ms-auto" />
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="gap-2">
          <Link to="/help">
            <i className="fa-light fa-circle-question w-4 text-center text-sm" aria-hidden="true" />
            Get Help
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="gap-2">
          <Link to={settings.url}>
            <i className="fa-light fa-gear w-4 text-center text-sm" aria-hidden="true" />
            {settings.title}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
          className={utilityBarActionButtonClass}
          onClick={() => requestOpenCommandMenu()}
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

function SettingsTrigger() {
  const { product } = useProduct()
  const [settings] = getSecondaryNavForProduct(product)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={settings.title}
          className={utilityBarActionButtonClass}
          asChild
        >
          <Link to={settings.url}>
            <i className="fa-light fa-gear text-sm" aria-hidden="true" />
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{settings.title}</TooltipContent>
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
          <Link to="/help">
            <i className="fa-light fa-circle-question text-sm" aria-hidden="true" />
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">Get Help</TooltipContent>
    </Tooltip>
  )
}
