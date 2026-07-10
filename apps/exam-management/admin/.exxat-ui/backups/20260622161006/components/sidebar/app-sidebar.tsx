"use client"

/**
 * AppSidebar — single-column nav matching the design reference:
 * Exxat One header, primary links, "Documents" group, utilities, user.
 *
 * Collapsed (icon) chrome is driven only by CSS (`group-data-[collapsible=icon]:…`)
 * on the ancestor from `ui/sidebar` — the same DOM is always rendered so Radix
 * `useId()` order matches between SSR and hydration (fixes downstream menus).
 */

import * as React from "react"
import { Link } from "react-router-dom"
import { useLocation } from "react-router-dom"
import { motion, useReducedMotion } from "motion/react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/ui/status-badge"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tip } from "@/components/ui/tip"
import { requestOpenCommandMenu } from "@/components/command-menu"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { useAltKeyLabel, useModKeyLabel } from "@/hooks/use-mod-key-label"
import { useAskLeo } from "@/components/ask-leo-sidebar"
import { useLocationHash } from "@/hooks/use-location-hash"
import { useSidebarReflowZoom } from "@/hooks/use-sidebar-reflow-zoom"
import { useProduct, type Product } from "@/contexts/product-context"
import { useProductSwitch } from "@/contexts/product-route-sync"
import { isListedCustomProduct } from "@/stores/app-store"
import { NavUser } from "./nav-user"
import { useSecondaryPanel } from "./secondary-panel"
import { ExxatProductLogo, ExxatProductMark } from "@/components/exxat-product-logo"
import { motionHeaderEnter } from "@/lib/motion-ui"
import { customProductBrandConfig, productBrandLabel } from "@/lib/product-brand"
import { isProductRefHidden, type ProductRef } from "@/lib/product-ref"
import {
  NAV_BY_PRODUCT,
  getPrimaryNavForProduct,
  NAV_DOCUMENTS,
  NAV_DOCUMENTS_LABEL,
  NAV_SCHOOL_DEFAULT,
  NAV_PROGRAM_DEFAULT,
  NAV_QUICK_ACTIONS,
  NAV_SCHOOLS,
  NAV_SITE_DEFAULT,
  NAV_LOCATION_DEFAULT,
  NAV_SITES,
  NAV_SECONDARY,
  NAV_USER,
  type NavLinkItem,
  type NavSecondaryItem,
  type NavSchool,
  type NavProgram,
  type NavSite,
  type NavLocation,
} from "@/lib/mock/navigation"
import {
  buildNavHashClaims,
  collectNavUrls,
  isNavHrefActive,
  navUrlPath,
  normalizedLocationHash,
} from "@exxatdesignux/ui/lib/nav-active"
import {
  customProductSlugFromSuffix,
  primaryNavLinksForSlug,
} from "@exxatdesignux/product-framework"

// Active-link disambiguation needs to know about every URL the sidebar can
// expose in any product (longest-prefix wins). Spreading the registry keeps
// the nav-active helper accurate even when the user switches products and
// the *displayed* primary nav changes.
const STATIC_NAV_URLS = collectNavUrls([
  ...Object.values(NAV_BY_PRODUCT).flat(),
  ...NAV_DOCUMENTS,
  ...NAV_SECONDARY,
])

// Custom-product nav lives in the tenant registry, which is hydrated at
// runtime — so we can't bake those URLs into a `const` at module load.
// Instead `AppSidebar` calls `syncCustomNavUrls(extras)` once per render
// (idempotent on URL-set signature) and the helpers consult the *current*
// list. This keeps the existing `isNavActive(pathname, url, hash)` API
// stable for ~15 callsites without threading `allNavUrls` through every
// child component.
let CURRENT_NAV_URLS: ReadonlyArray<string> = STATIC_NAV_URLS
let CURRENT_NAV_HASH_CLAIMS = buildNavHashClaims(STATIC_NAV_URLS)
let CURRENT_NAV_URL_SIGNATURE = STATIC_NAV_URLS.length === 0 ? "" : STATIC_NAV_URLS.join("|")

function syncCustomNavUrls(extras: ReadonlyArray<string>): void {
  if (extras.length === 0 && CURRENT_NAV_URLS === STATIC_NAV_URLS) return
  const merged = extras.length === 0
    ? STATIC_NAV_URLS
    : Array.from(new Set([...STATIC_NAV_URLS, ...extras]))
  const signature = merged.length === 0 ? "" : merged.join("|")
  if (signature === CURRENT_NAV_URL_SIGNATURE) return
  CURRENT_NAV_URLS = merged
  CURRENT_NAV_HASH_CLAIMS = buildNavHashClaims(merged)
  CURRENT_NAV_URL_SIGNATURE = signature
}

/** Single active primary/secondary sidebar row — longest matching path wins. */
function isNavActive(pathname: string, url: string, locationHash = ""): boolean {
  return isNavHrefActive(pathname, url, CURRENT_NAV_URLS, {
    locationHash,
    hashClaimsByPath: CURRENT_NAV_HASH_CLAIMS,
  })
}

/** Sub-item active — catalog detail routes, hash fragments, or duplicate hub URLs (Rotations). */
function isCollapsibleChildActive(
  pathname: string,
  parent: NavLinkItem,
  child: NavLinkItem,
  locationHash: string
): boolean {
  const children = parent.children
  if (!children?.length) return isNavActive(pathname, child.url, locationHash)

  const hasHashChild = children.some(c => c.url.includes("#"))
  if (hasHashChild) {
    const h = normalizedLocationHash(locationHash)
    const childHash = child.url.includes("#") ? child.url.split("#")[1] : ""
    if (parent.primaryHubChildKey && child.key === parent.primaryHubChildKey) {
      return h === ""
    }
    if (childHash) {
      return h === childHash
    }
    return false
  }

  if (!isNavActive(pathname, child.url, locationHash)) return false

  /** Hub entry (`/library`) must not stay “active” on `/library/all` etc. */
  if (parent.primaryHubChildKey && child.key === parent.primaryHubChildKey) {
    const hubPath = navUrlPath(parent.url)
    if (hubPath) {
      const normalized =
        pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname
      if (normalized !== hubPath) return false
    }
  }

  const urls = children.map(c => c.url)
  const allSameUrl = urls.length > 1 && urls.every(u => u === urls[0])
  if (allSameUrl) {
    if (parent.primaryHubChildKey) {
      return child.key === parent.primaryHubChildKey
    }
    return false
  }
  return true
}

/**
 * “Selected” styling on a collapsible **parent** row in the **expanded** sidebar.
 *
 * Rule: when any descendant child is the current destination, the parent stays
 * visually NEUTRAL — the active child carries `data-active` on its own. The
 * parent is only highlighted when no child matches but the parent URL still
 * matches (edge case: route that isn't represented in the sub-list).
 *
 * Note: this is for the expanded view only. The collapsed icon rail uses
 * `iconRailActive = isAnyChildActive` because the parent icon is the only
 * visible affordance there (see `CollapsibleNavItem`).
 */
function isCollapsibleParentMenuButtonActive(
  pathname: string,
  item: NavLinkItem,
  locationHash: string,
): boolean {
  const children = item.children
  if (!children?.length) return isNavActive(pathname, item.url, locationHash)

  const anyChildActive = children.some(c =>
    isCollapsibleChildActive(pathname, item, c, locationHash),
  )
  if (anyChildActive) return false
  return isNavActive(pathname, item.url, locationHash)
}

/** Accessible suffix for sidebar badges (badge is rendered outside the link node). */
function badgeAccessibleSuffix(badge: number | string): string {
  if (typeof badge === "number") return `${badge} items`
  return String(badge)
}

/** Child row for expandable nav items — shared by inline sub-menu and collapsed-rail popover. */
const SidebarNavChildLink = React.forwardRef<
  HTMLAnchorElement,
  {
    parent: NavLinkItem
    child: NavLinkItem
    pathname: string
    locationHash: string
    onNavigate?: () => void
    /** Popover uses surface tokens; inline sub-menu uses `SidebarMenuSubButton`. */
    linkClassName?: string
  } & Omit<React.ComponentPropsWithoutRef<typeof Link>, "to">
>(function SidebarNavChildLink(
  {
    parent,
    child,
    pathname,
    locationHash,
    onNavigate,
    linkClassName,
    className: incomingClassName,
    onClick,
    ...linkRest
  },
  ref,
) {
  const { openPanel } = useSecondaryPanel()
  const childActive = isCollapsibleChildActive(pathname, parent, child, locationHash)
  const childPath = navUrlPath(child.url)

  return (
    <Link
      ref={ref}
      to={child.url}
      className={cn("flex min-w-0 items-center gap-2", linkClassName, incomingClassName)}
      aria-current={childActive ? "page" : undefined}
      onClick={e => {
        onNavigate?.()
        if (
          parent.secondaryPanel &&
          pathname === childPath &&
          !child.url.includes("#")
        ) {
          e.preventDefault()
          openPanel(parent.secondaryPanel)
        }
        onClick?.(e)
      }}
      {...linkRest}
    >
      <span className="size-4 shrink-0 inline-flex items-center justify-center" aria-hidden="true">
        {childActive && child.iconActive ? child.iconActive : child.icon}
      </span>
      <span className="min-w-0 flex-1 truncate">{child.title}</span>
    </Link>
  )
})
SidebarNavChildLink.displayName = "SidebarNavChildLink"

/**
 * CollapsibleNavItem — isolated component so each collapsible has its own
 * controlled `open` state initialised in useEffect. This avoids the Radix
 * hydration mismatch caused by `defaultOpen` resolving differently on the
 * server (SSR) vs the client (navigate not yet available).
 */
function CollapsibleNavItem({ item, pathname }: { item: NavLinkItem; pathname: string }) {
  const locationHash = useLocationHash()
  const isAnyChildActive =
    item.children?.some(c => isCollapsibleChildActive(pathname, item, c, locationHash)) ?? false
  const parentMenuButtonActive = isCollapsibleParentMenuButtonActive(pathname, item, locationHash)
  const { state, isMobile } = useSidebar()
  const [open, setOpen] = React.useState(false)
  const [flyoutOpen, setFlyoutOpen] = React.useState(false)
  const flyoutTitleId = React.useId()
  // Defer the icon-rail React-tree swap until AFTER the sidebar's CSS width
  // transition (`duration-200` in `packages/ui/src/components/ui/sidebar.tsx`)
  // has finished. The component returns a completely different tree per mode
  // — `<Collapsible>` (expanded) vs `<Popover>` (icon rail) — so a sync flip
  // unmounts every Radix Collapsible + tooltip + mounts every Radix Popover
  // (with floating-ui, focus traps, portals) right at frame 0 of the toggle.
  // That ~30–80 ms of synchronous React + Radix work blocks the main thread
  // exactly while the browser is starting to interpolate width, which is the
  // dominant cause of "the sidebar feels sluggish" everywhere in the app.
  //
  // Strategy:
  //   • Expanding (collapsed → expanded): flip immediately so labels appear
  //     as the rail widens — anything else feels delayed.
  //   • Collapsing (expanded → collapsed): wait DEFER_MS so the rail visibly
  //     slides closed first, then swap the primitives inside an already-
  //     narrowed rail. CSS hides the labels + sub-list during this window
  //     (`group-data-[collapsible=icon]:hidden` + `size-8!`), so the user
  //     never sees the still-mounted Collapsible tree peeking through.
  const targetIconRail = state === "collapsed" && !isMobile
  const [iconRailCollapsed, setIconRailCollapsed] = React.useState(targetIconRail)
  React.useEffect(() => {
    if (!targetIconRail) {
      setIconRailCollapsed((prev) => (prev === false ? prev : false))
      return
    }
    // 200ms CSS transition + 20ms commit buffer.
    const t = setTimeout(() => setIconRailCollapsed(true), 220)
    return () => clearTimeout(t)
  }, [targetIconRail])
  // In the icon rail the parent icon is the ONLY visible thing for this item
  // (no sub-list, no labels) — so it must reflect "I'm somewhere inside this
  // section" by lighting up on any descendant route (e.g. `/library/all`),
  // not only on the parent URL itself. In the expanded view we keep the
  // parent neutral and let the active child row carry `data-active` (see
  // `isCollapsibleParentMenuButtonActive`).
  const iconRailActive = isAnyChildActive
  const triggerIcon =
    (iconRailCollapsed ? iconRailActive : parentMenuButtonActive) && item.iconActive
      ? item.iconActive
      : item.icon

  React.useEffect(() => {
    setOpen(isAnyChildActive)
  }, [pathname, isAnyChildActive, locationHash])

  React.useEffect(() => {
    setFlyoutOpen(false)
  }, [pathname])

  if (!item.children?.length) return null

  /** Icon rail: sub-list is hidden — open a flyout. Also avoids `CollapsibleTrigger asChild` on `SidebarMenuButton` with `tooltip` (extra `Tooltip` root breaks Radix `Slot`). */
  if (iconRailCollapsed) {
    return (
      <SidebarMenuItem>
        <Popover
          open={flyoutOpen}
          onOpenChange={next => {
            setFlyoutOpen(next)
          }}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <SidebarMenuButton
                  isActive={iconRailActive}
                  aria-current={iconRailActive ? "page" : undefined}
                  aria-haspopup="dialog"
                  aria-label={`${item.title} — open subpages`}
                >
                  <span
                    key={iconRailActive ? "active" : "idle"}
                    className={cn(
                      "size-4 shrink-0 flex items-center justify-center",
                      iconRailActive &&
                        "[animation:sidebar-icon-pop_380ms_cubic-bezier(0.34,1.56,0.64,1)_both]",
                    )}
                    aria-hidden="true"
                  >
                    {triggerIcon}
                  </span>
                  <span className="sr-only text-xs">{item.title}</span>
                </SidebarMenuButton>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="right" align="center">
              {item.title}
            </TooltipContent>
          </Tooltip>
          <PopoverContent
            className="w-64 p-1"
            side="right"
            align="start"
            sideOffset={8}
            aria-labelledby={flyoutTitleId}
          >
            <h2 id={flyoutTitleId} className="sr-only">
              {item.title}
            </h2>
            <ul className="flex flex-col gap-0.5" role="list">
              {item.children.map(child => {
                const childActive = isCollapsibleChildActive(pathname, item, child, locationHash)
                return (
                  <li key={child.key}>
                    <SidebarNavChildLink
                      parent={item}
                      child={child}
                      pathname={pathname}
                      locationHash={locationHash}
                      onNavigate={() => setFlyoutOpen(false)}
                      linkClassName={cn(
                        "flex min-h-8 w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none ring-ring",
                        "text-popover-foreground hover:bg-accent hover:text-accent-foreground",
                        "focus-visible:ring-2",
                        childActive && "bg-accent font-medium text-accent-foreground",
                      )}
                    />
                  </li>
                )
              })}
            </ul>
          </PopoverContent>
        </Popover>
      </SidebarMenuItem>
    )
  }

  return (
    <Collapsible
      open={open}
      onOpenChange={next => {
        setOpen(next)
      }}
      asChild
    >
      {/* `group/collapsible` lets descendant utilities react to the
          Radix `data-state` (e.g. chevron rotate, content slide). Radix's
          asChild merges the data-state onto this `<SidebarMenuItem>`. */}
      <SidebarMenuItem className="group/collapsible">
        <Tooltip>
          <TooltipTrigger asChild>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton isActive={parentMenuButtonActive}>
                <span
                  key={parentMenuButtonActive ? "active" : "idle"}
                  className={cn(
                    "size-4 shrink-0 flex items-center justify-center",
                    parentMenuButtonActive &&
                      "[animation:sidebar-icon-pop_380ms_cubic-bezier(0.34,1.56,0.64,1)_both]",
                  )}
                  aria-hidden="true"
                >
                  {triggerIcon}
                </span>
                <span>{item.title}</span>
                <i
                  className="fa-light fa-chevron-right ms-auto text-xs text-current transition-transform duration-200 ease-out group-data-[state=open]/collapsible:rotate-90 motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </SidebarMenuButton>
            </CollapsibleTrigger>
          </TooltipTrigger>
          <TooltipContent side="right" align="center" hidden={state !== "collapsed" || isMobile}>
            {item.title}
          </TooltipContent>
        </Tooltip>
        {/* Slide the children open/closed using Radix's
            `--radix-collapsible-content-height` CSS variable. `overflow-hidden`
            is required so the height clip is visible during the animation.
            Keyframes defined in `app/globals.css` (`collapsible-down/up`). */}
        <CollapsibleContent className="overflow-hidden group-data-[collapsible=icon]:hidden data-[state=open]:[animation:collapsible-down_200ms_ease-out] data-[state=closed]:[animation:collapsible-up_200ms_ease-out] motion-reduce:animate-none">
          <SidebarMenuSub>
            {item.children.map(child => {
              const childActive = isCollapsibleChildActive(pathname, item, child, locationHash)
              return (
                <SidebarMenuSubItem key={child.key}>
                  <SidebarMenuSubButton asChild isActive={childActive}>
                    <SidebarNavChildLink
                      parent={item}
                      child={child}
                      pathname={pathname}
                      locationHash={locationHash}
                    />
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              )
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

function NavLinkItems({ items, pathname }: { items: NavLinkItem[]; pathname: string }) {
  const { openPanel } = useSecondaryPanel()
  const locationHash = useLocationHash()
  return (
    <>
      {items.map(item => {
        // Large child sets (>40) skip the collapsible/flyout pattern and navigate
        // to a full page instead — prevents overwhelming the sidebar.
        const childCount = item.children?.length ?? 0
        if (childCount > 0 && childCount <= 40) {
          return <CollapsibleNavItem key={item.key} item={item} pathname={pathname} />
        }

        const isActive = isNavActive(pathname, item.url, locationHash)
        const itemPath = navUrlPath(item.url)
        return (
          <SidebarMenuItem key={item.key}>
            <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
              <Link
                to={item.url}
                aria-current={isActive ? "page" : undefined}
                aria-label={
                  item.badge !== undefined
                    ? `${item.title}, ${badgeAccessibleSuffix(item.badge)}`
                    : undefined
                }
                onClick={e => {
                  // Reopen the panel when the user clicks a panel-driving row
                  // while ALREADY on its route — Next.js `<Link>` does not
                  // navigate to the same URL, so without this the panel could
                  // stay closed (e.g. after the user collapsed it manually).
                  // On first click (different route), default navigation runs
                  // and the route's `useAutoPanel` opens the panel itself.
                  if (
                    item.secondaryPanel &&
                    itemPath &&
                    pathname === itemPath &&
                    !item.url.includes("#")
                  ) {
                    e.preventDefault()
                    openPanel(item.secondaryPanel)
                  }
                }}
              >
                <span
                  key={isActive ? "active" : "idle"}
                  className={cn(
                    "size-4 shrink-0 flex items-center justify-center",
                    isActive &&
                      "[animation:sidebar-icon-pop_380ms_cubic-bezier(0.34,1.56,0.64,1)_both]",
                  )}
                  aria-hidden="true"
                >
                  {isActive && item.iconActive ? item.iconActive : item.icon}
                </span>
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
            {item.badge !== undefined && (
              <>
                {/* Full badge — visible when sidebar is expanded */}
                <SidebarMenuBadge aria-hidden="true">
                  {typeof item.badge === "number" ? (
                    <Badge className="h-4 min-w-4 px-1 text-xs leading-none font-semibold rounded-full tabular-nums border-transparent bg-red-600 text-white hover:bg-red-600">
                      {item.badge}
                    </Badge>
                  ) : item.badge === "New" ? (
                    <StatusBadge status="new" />
                  ) : item.badge === "Beta" ? (
                    <StatusBadge status="beta" />
                  ) : (
                    <Badge className="h-4 px-1.5 text-xs leading-none font-semibold rounded-full">
                      {item.badge}
                    </Badge>
                  )}
                </SidebarMenuBadge>
                {/* Dot indicator — visible only when sidebar is collapsed */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-1 right-1 size-2 rounded-full hidden group-data-[collapsible=icon]:block",
                    typeof item.badge === "number" ? "bg-red-600"
                      : item.badge === "New" ? "bg-brand"
                      : item.badge === "Beta" ? "bg-yellow-400"
                      : "bg-primary"
                  )}
                />
              </>
            )}
          </SidebarMenuItem>
        )
      })}
    </>
  )
}

/** Utilities-style rows (⌘K, Ask Leo, Settings, …) — shared by quick actions + bottom group. */
function SidebarNavSecondaryItems({
  items,
  pathname,
}: {
  items: NavSecondaryItem[]
  pathname: string
}) {
  const mod = useModKeyLabel()
  const alt = useAltKeyLabel()
  const locationHash = useLocationHash()
  const { toggle: toggleAskLeo, open: askLeoOpen } = useAskLeo()
  return (
    <>
      {items.map((item) => {
        const pathOnly = navUrlPath(item.url)
        const linkActive =
          !item.opensCommandMenu &&
          !item.opensAskLeo &&
          Boolean(pathOnly) &&
          pathOnly !== "#" &&
          isNavActive(pathname, item.url, locationHash)

        return (
          <SidebarMenuItem key={item.key}>
            {item.opensCommandMenu ? (
              <SidebarMenuButton
                type="button"
                tooltip={item.title}
                isActive={false}
                onClick={() => requestOpenCommandMenu()}
              >
                <span className="size-4 shrink-0 flex items-center justify-center" aria-hidden="true">
                  {item.icon}
                </span>
                <span>{item.title}</span>
                <KbdGroup className="ms-auto">
                  <Kbd>{mod}</Kbd>
                  <Kbd>K</Kbd>
                </KbdGroup>
              </SidebarMenuButton>
            ) : item.opensAskLeo ? (
              <SidebarMenuButton
                type="button"
                tooltip={item.title}
                isActive={askLeoOpen}
                onClick={toggleAskLeo}
                aria-expanded={askLeoOpen}
              >
                <span className="size-4 shrink-0 flex items-center justify-center" aria-hidden="true">
                  {item.icon}
                </span>
                <span>{item.title}</span>
                <KbdGroup className="ms-auto">
                  <Kbd>{mod}</Kbd>
                  <Kbd>{alt}</Kbd>
                  <Kbd>K</Kbd>
                </KbdGroup>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton asChild isActive={linkActive} tooltip={item.title}>
                <Link to={item.url} aria-current={linkActive ? "page" : undefined}>
                  <span
                    key={linkActive ? "active" : "idle"}
                    className={cn(
                      "size-4 shrink-0 flex items-center justify-center",
                      linkActive &&
                        "[animation:sidebar-icon-pop_380ms_cubic-bezier(0.34,1.56,0.64,1)_both]",
                    )}
                    aria-hidden="true"
                  >
                    {linkActive && item.iconActive ? item.iconActive : item.icon}
                  </span>
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        )
      })}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TeamSwitcher — product-aware scope picker in the sidebar header
//
// Most products (Prism / One — Schools / Custom) operate in a
// **school > program** scope. **Exxat One — Sites** operates in a partner-
// facing **site > location** scope (per the product-context rule:
// `.cursor/rules/exxat-product-context.mdc`). Both flavors share the same
// chrome — avatar + two-line label + dropdown with a sub-view picker — so
// this component is parametrized over a small `scope` config and renders
// either flavor identically.
// ─────────────────────────────────────────────────────────────────────────────

interface ScopeParent { id: string; name: string; logo: string; initials: string }
interface ScopeChild  { id: string; name: string }

interface ScopeConfig {
  parents: ReadonlyArray<ScopeParent>
  defaultParent: ScopeParent
  defaultChild: ScopeChild
  /** Children belonging to a given parent in this scope. */
  childrenOf: (parent: ScopeParent) => ReadonlyArray<ScopeChild>
  /** Singular noun for the **child** scope ("Program", "Location"). */
  childNoun: string
  /** Singular noun for the **child** icon — Font Awesome glyph suffix. */
  childIcon: string
  /** Aria suffix for the trigger button ("Switch school or program", …). */
  ariaSuffix: string
  /** Sub-view label ("Select school", "Select site"). */
  parentSelectLabel: string
}

const SCHOOL_PROGRAM_SCOPE: ScopeConfig = {
  parents: NAV_SCHOOLS,
  defaultParent: NAV_SCHOOL_DEFAULT,
  defaultChild: NAV_PROGRAM_DEFAULT,
  childrenOf: (parent) => (parent as NavSchool).programs,
  childNoun: "Program",
  childIcon: "graduation-cap",
  ariaSuffix: "Switch school or program",
  parentSelectLabel: "Select school",
}

const SITE_LOCATION_SCOPE: ScopeConfig = {
  parents: NAV_SITES,
  defaultParent: NAV_SITE_DEFAULT,
  defaultChild: NAV_LOCATION_DEFAULT,
  childrenOf: (parent) => (parent as NavSite).locations,
  childNoun: "Location",
  childIcon: "location-dot",
  ariaSuffix: "Switch site or location",
  parentSelectLabel: "Select site",
}

function scopeConfigForProduct(product: Product): ScopeConfig {
  return product === "exxat-one-sites" ? SITE_LOCATION_SCOPE : SCHOOL_PROGRAM_SCOPE
}

function TeamSwitcher() {
  const { state, isMobile } = useSidebar()
  const { product } = useProduct()
  const scope = scopeConfigForProduct(product)

  // Each product has its own scope universe (NAV_SCHOOLS vs NAV_SITES). Keying
  // the inner state on `product` resets the picker to that product's defaults
  // when the user switches products via ProductLogoButton — and prevents stale
  // NavSchool state from rendering against NAV_SITES (or vice versa).
  return <TeamSwitcherInner key={product} scope={scope} state={state} isMobile={isMobile} />
}

function TeamSwitcherInner({
  scope,
  state,
  isMobile,
}: {
  scope: ScopeConfig
  state: "expanded" | "collapsed"
  isMobile: boolean
}) {
  const [parent,  setParent]  = React.useState<ScopeParent>(scope.defaultParent)
  const [child,   setChild]   = React.useState<ScopeChild>(scope.defaultChild)
  const [subView, setSubView] = React.useState<"main" | "parents">("main")

  function switchParent(p: ScopeParent) {
    setParent(p)
    const firstChild = scope.childrenOf(p)[0]
    if (firstChild) setChild(firstChild)
    setSubView("main")
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
    <DropdownMenu onOpenChange={(open) => { if (!open) setSubView("main") }}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              aria-label={`${parent.name} · ${child.name}. ${scope.ariaSuffix}`}
              className={cn(
                "py-2 text-sidebar-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
                /* `size=lg` is `h-12` + `overflow-hidden` — two lines + avatar need more height */
                (state === "expanded" || isMobile) &&
                  "h-auto min-h-12 !overflow-visible items-center [&>span:last-child]:!overflow-visible [&>span:last-child]:!whitespace-normal [&>span:last-child]:text-clip",
                "group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center",
                /* Icon rail: default is `size-8` + `p-2` (~16px inner) — clips 32px avatars; center logo without chevron */
                "group-data-[collapsible=icon]:!size-9 group-data-[collapsible=icon]:!min-h-9 group-data-[collapsible=icon]:!max-h-9 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:overflow-visible",
              )}
            >
              <Avatar
                className={cn(
                  "h-8 w-8 shrink-0",
                  /* Icon rail: same 36px frame as product mark + header button */
                  "group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8",
                )}
              >
                <AvatarImage
                  src={parent.logo}
                  alt=""
                  referrerPolicy="origin"
                  className="object-contain p-1 group-data-[collapsible=icon]:p-0.5"
                />
                <AvatarFallback className="text-xs font-bold bg-secondary text-secondary-foreground">
                  {parent.initials}
                </AvatarFallback>
              </Avatar>
              <div
                className={cn(
                  "grid min-w-0 flex-1 content-center text-start text-sm leading-snug",
                  "group-data-[collapsible=icon]:hidden",
                )}
              >
                <span className="break-words font-medium whitespace-normal">{child.name}</span>
                <span className="break-words text-xs text-muted-foreground whitespace-normal">
                  {parent.name}
                </span>
              </div>
              {(state === "expanded" || isMobile) && (
                <span
                  className="ms-auto flex w-6 shrink-0 self-stretch items-center justify-center text-muted-foreground"
                  aria-hidden="true"
                >
                  <i className="fa-light fa-chevron-down block text-xs leading-none" aria-hidden="true" />
                </span>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="right" align="center" hidden={state !== "collapsed" || isMobile}>
          {child.name} · {parent.name}
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent
        className="!w-max min-w-72 max-w-[min(100vw-2rem,28rem)]"
        align="start"
        side="right"
        sideOffset={8}
      >
        {subView === "main" ? (
          <>
            {/* Selected parent — click to switch parent */}
            <div className="p-1">
              <button
                type="button"
                onClick={() => setSubView("parents")}
                className={cn(
                  "flex w-full items-start gap-2.5 rounded-md px-2 py-2 text-left transition-colors",
                  "hover:bg-interactive-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              >
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage
                    src={parent.logo}
                    alt=""
                    referrerPolicy="origin"
                    className="object-contain p-0.5"
                  />
                  <AvatarFallback className="text-xs font-semibold">
                    {parent.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground leading-tight">
                    {scope.childNoun}
                  </p>
                  <p className="mt-0.5 text-[13px] font-semibold leading-snug">
                    {child.name}
                  </p>
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{parent.name}</p>
                </div>
                <span className="shrink-0 pt-0.5 text-xs font-medium text-brand">Change</span>
              </button>
            </div>

            <DropdownMenuSeparator />

            {/* Children of the selected parent */}
            <DropdownMenuLabel className="text-xs text-muted-foreground">{scope.childNoun}</DropdownMenuLabel>
            {scope.childrenOf(parent).map(c => (
              <DropdownMenuItem
                key={c.id}
                onClick={() => setChild(c)}
                className="items-start py-2"
              >
                <i className={`fa-light fa-${scope.childIcon} mt-0.5 shrink-0 text-[13px]`} aria-hidden="true" />
                <span className="min-w-0 flex-1 break-words whitespace-normal">{c.name}</span>
                {c.id === child.id && (
                  <i className="fa-solid fa-check ms-1 shrink-0 text-brand text-xs mt-0.5" aria-hidden="true" />
                )}
              </DropdownMenuItem>
            ))}
          </>
        ) : (
          <>
            {/* Back + parent list */}
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setSubView("main") }}>
              <i className="fa-light fa-arrow-left text-[13px]" aria-hidden="true" />
              <span>Back</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">{scope.parentSelectLabel}</DropdownMenuLabel>
            {scope.parents.map(p => (
              <DropdownMenuItem
                key={p.id}
                onClick={() => switchParent(p)}
                className="items-start py-2"
              >
                <Avatar size="sm" className="mt-0.5 shrink-0">
                  <AvatarImage src={p.logo} alt="" referrerPolicy="origin" />
                  <AvatarFallback className="text-xs font-semibold">
                    {p.initials}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1 break-words whitespace-normal">{p.name}</span>
                {p.id === parent.id && (
                  <i className="fa-solid fa-check ms-1 shrink-0 text-brand text-xs mt-0.5" aria-hidden="true" />
                )}
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Product logo (header) — expanded: full `ExxatProductLogo` + chevron; collapsed: `ExxatProductMark`
// only (32×32 like school Avatar), no chevron.
// ─────────────────────────────────────────────────────────────────────────────

// Exxat One ships as **two siblings** — see
// `apps/web/docs/multi-product-routing-pattern.md`. `scope` carries the
// disambiguator ("Schools" / "Sites") that the dropdown renders next to the
// shared "Exxat One" wordmark; `label` is the full accessible name used
// in `aria-label` and the collapsed-rail tooltip.
const PRODUCTS: { id: Product; label: string; scope?: "Schools" | "Sites" }[] = [
  { id: "exxat-prism",       label: "Exxat Prism"           },
  { id: "exxat-one-schools", label: "Exxat One — Schools",  scope: "Schools" },
  { id: "exxat-one-sites",   label: "Exxat One — Sites",    scope: "Sites"   },
  { id: "exxat-custom",      label: "Custom product"        },
]

function ProductLogoButton() {
  const { product, customProducts, activeCustomIndex, hiddenProducts } = useProduct()
  const switchProduct = useProductSwitch()
  const { state, isMobile } = useSidebar()
  const products = React.useMemo(
    () =>
      PRODUCTS.flatMap((p): { id: Product; label: string; scope?: "Schools" | "Sites"; customIndex?: number }[] => {
        if (p.id !== "exxat-custom") {
          const ref: ProductRef = { product: p.id }
          if (isProductRefHidden(ref, hiddenProducts)) return []
          return [p]
        }
        return customProducts.flatMap((cp, customIndex) => {
          if (!isListedCustomProduct(cp)) return []
          const ref: ProductRef = { product: "exxat-custom", customIndex }
          if (isProductRefHidden(ref, hiddenProducts)) return []
          return [{ ...p, label: productBrandLabel(customProductBrandConfig(cp)), customIndex }]
        })
      }),
    [customProducts, hiddenProducts],
  )
  const isCurrentProduct = React.useCallback(
    (entry: { id: Product; customIndex?: number }) =>
      entry.id === product &&
      (entry.customIndex === undefined || entry.customIndex === activeCustomIndex),
    [activeCustomIndex, product],
  )
  const current = products.find(isCurrentProduct) ?? products[0] ?? PRODUCTS[0]
  const iconRail = state === "collapsed" && !isMobile
  const expandedOrMobile = state === "expanded" || isMobile

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className={cn(
                "py-2 text-sidebar-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
                expandedOrMobile &&
                  "h-auto min-h-12 !overflow-visible items-center [&>span:last-child]:!overflow-visible [&>span:last-child]:!whitespace-normal [&>span:last-child]:text-clip",
                "group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center",
                iconRail &&
                  "group-data-[collapsible=icon]:!size-9 group-data-[collapsible=icon]:!min-h-9 group-data-[collapsible=icon]:!max-h-9 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:overflow-visible",
              )}
              aria-label={`Current product: ${current.label}. Switch product`}
              suppressHydrationWarning
            >
              {iconRail ? (
                // Match the school selector footprint in the icon rail (32px frame,
                // 28px mark — same visual weight as the avatar with inset padding).
                <span className="flex size-8 shrink-0 items-center justify-center">
                  <ExxatProductMark
                    product={current.id}
                    previewCustomBrand={
                      current.customIndex !== undefined
                        ? customProducts[current.customIndex]
                        : undefined
                    }
                    className="size-7"
                  />
                </span>
              ) : (
                <span className="flex min-h-0 min-w-0 flex-1 items-stretch gap-2">
                  <span
                    className="flex min-h-0 min-w-0 flex-1 items-center justify-start gap-1.5 overflow-visible"
                    aria-hidden="true"
                  >
                    <ExxatProductLogo
                      product={current.id}
                      variant="sidebar"
                      previewCustomBrand={
                        current.customIndex !== undefined
                          ? customProducts[current.customIndex]
                          : undefined
                      }
                      className="w-auto max-w-[min(100%,280px)] object-left object-contain"
                    />
                    {current.scope && (
                      <span className="text-xs font-medium text-muted-foreground">
                        — {current.scope}
                      </span>
                    )}
                  </span>
                  <span
                    className="flex w-6 shrink-0 items-center justify-center self-stretch text-muted-foreground"
                    aria-hidden="true"
                  >
                    <i
                      className="fa-light fa-chevron-down block text-xs leading-none"
                      aria-hidden="true"
                    />
                  </span>
                </span>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="right" align="center" hidden={state !== "collapsed" || isMobile}>
          {current.label}
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="start" side="right" sideOffset={8}>
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Switch product
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {products.map(p => (
          <DropdownMenuItem
            key={p.customIndex !== undefined ? `${p.id}-${p.customIndex}` : p.id}
            onClick={() => switchProduct(p.id, p.customIndex)}
            className="gap-2 py-2"
            aria-selected={isCurrentProduct(p)}
            aria-label={p.label}
          >
            <ExxatProductLogo
              product={p.id}
              variant="sidebar"
              previewCustomBrand={
                p.customIndex !== undefined ? customProducts[p.customIndex] : undefined
              }
              className="w-auto shrink-0 max-w-[min(100%,260px)]"
            />
            {p.scope && (
              <span
                className="text-xs font-medium text-muted-foreground"
                aria-hidden="true"
              >
                — {p.scope}
              </span>
            )}
            {isCurrentProduct(p) && (
              <i className="fa-solid fa-check ms-auto text-brand text-xs" aria-hidden="true" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// AppSidebar
// ─────────────────────────────────────────────────────────────────────────────

/** Light header entrance — Motion (Animate UI–style open distribution: animate-ui.com/docs). */
function SidebarHeaderStack({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      className="flex flex-col"
      initial={reduceMotion ? false : { opacity: 0.88, y: -2 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : motionHeaderEnter}
    >
      {children}
    </motion.div>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = useLocation().pathname
  const { isMobile, setOpen } = useSidebar()
  const reflowZoom = useSidebarReflowZoom()
  const { product, customProducts, activeCustomIndex } = useProduct()
  // Per Rule 5 of the multi-product routing pattern: each product registers
  // its own primary nav. AppSidebar selects from the registry based on the
  // active product so switching products swaps the entire primary tree.
  const primaryNav = getPrimaryNavForProduct(product, customProducts, activeCustomIndex)

  // Feed custom-product nav URLs into the active-state helper so links like
  // `/<custom-slug>/dashboard` actually win the longest-prefix match. The
  // sync is idempotent on URL signature, so re-renders without a real
  // change are a no-op.
  React.useMemo(() => {
    const extras: string[] = []
    for (const cp of customProducts) {
      const slug = customProductSlugFromSuffix(cp.suffix)
      const nav = primaryNavLinksForSlug(slug)
      if (!nav?.length) continue
      extras.push(...collectNavUrls(nav))
    }
    syncCustomNavUrls(extras)
  }, [customProducts])

  return (
    <Sidebar collapsible="icon" {...props}>
      {/*
        Normal: scrollable primary rail + sticky bottom block (Settings, Help, profile).
        High zoom / very short viewport (`useSidebarReflowZoom`): single scroll on <nav>
        so nothing is pinned off-screen (WCAG 1.4.10 reflow).
      */}
      <nav
        aria-label="Application"
        data-exxat-sidebar="application-nav"
        data-reflow-zoom={reflowZoom ? "true" : "false"}
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          reflowZoom && "overflow-y-auto",
        )}
      >
        <SidebarContent
          className={cn(
            "gap-0",
            reflowZoom && "!flex-none !overflow-visible",
          )}
        >
          <SidebarHeader className="border-b border-sidebar-border pb-2">
            {/* Mobile/zoomed: visible close button — WCAG 2.1.1 Keyboard, 4.1.2 Name/Role/Value */}
            {isMobile && (
              <div className="flex items-center justify-end px-1 pt-0.5">
                <Tip label="Close navigation" side="bottom">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Close navigation"
                    onClick={() => setOpen(false)}
                  >
                    <i className="fa-light fa-xmark text-sm" aria-hidden="true" />
                  </Button>
                </Tip>
              </div>
            )}
            <SidebarHeaderStack>
              <SidebarMenu>
                <SidebarMenuItem>
                  <ProductLogoButton />
                </SidebarMenuItem>
              </SidebarMenu>
              <div className="flex w-full justify-center px-2">
                <Separator
                  orientation="horizontal"
                  decorative
                  className="my-1.5 h-px w-full max-w-none shrink-0 bg-sidebar-border group-data-[collapsible=icon]:w-8"
                />
              </div>
              <TeamSwitcher />
            </SidebarHeaderStack>
          </SidebarHeader>

          <SidebarGroup className="py-2" role="group" aria-label="Primary">
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                <SidebarNavSecondaryItems items={NAV_QUICK_ACTIONS} pathname={pathname} />
                <NavLinkItems items={primaryNav} pathname={pathname} />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup
            className="py-0 pt-0"
            role="group"
            aria-label={NAV_DOCUMENTS_LABEL}
          >
            <SidebarGroupLabel
              id="sidebar-documents-heading"
              className="text-xs font-medium uppercase tracking-wide px-2 text-sidebar-section-label"
              suppressHydrationWarning
            >
              {NAV_DOCUMENTS_LABEL}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                <NavLinkItems items={NAV_DOCUMENTS} pathname={pathname} />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

        </SidebarContent>

        {/* Settings + Help + profile — pinned under the scrollable rail unless reflow-zoom. */}
        <SidebarFooter
          className={cn(
            "mt-auto border-t border-sidebar-border bg-sidebar",
            reflowZoom && "mt-0 shrink-0",
          )}
        >
          <SidebarGroup className="py-2" role="group" aria-label="Utilities">
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                <SidebarNavSecondaryItems items={NAV_SECONDARY} pathname={pathname} />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <NavUser user={NAV_USER} />
        </SidebarFooter>
      </nav>
    </Sidebar>
  )
}
