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
import Link           from "next/link"
import { usePathname } from "next/navigation"
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { requestOpenCommandMenu } from "@/components/command-menu"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { useModKeyLabel } from "@/hooks/use-mod-key-label"
import { useProduct, type Product } from "@/contexts/product-context"
import { NavUser } from "@/components/nav-user"
import { useSecondaryPanel } from "@/components/secondary-panel"
import { ExxatProductLogo, ExxatProductMark } from "@/components/exxat-product-logo"
import { motionHeaderEnter } from "@/lib/motion-ui"
import {
  NAV_DOCUMENTS,
  NAV_DOCUMENTS_LABEL,
  NAV_PRIMARY,
  NAV_SCHOOL_DEFAULT,
  NAV_PROGRAM_DEFAULT,
  NAV_QUICK_ACTIONS,
  NAV_SCHOOLS,
  NAV_SECONDARY,
  NAV_USER,
  type NavLinkItem,
  type NavSecondaryItem,
  type NavSchool,
  type NavProgram,
} from "@/lib/mock/navigation"

/** Path segment of a nav URL (strip `#fragment` for matching). */
function navUrlPath(url: string): string {
  if (!url || url === "#") return ""
  const i = url.indexOf("#")
  return i === -1 ? url : url.slice(0, i)
}

function isNavActive(pathname: string, url: string): boolean {
  const pathOnly = navUrlPath(url)
  if (!pathOnly || pathOnly === "#") return false
  if (pathOnly === "/") return pathname === "/"
  if (pathname === pathOnly) return true
  // Design system library — active on hub and detail routes.
  if (pathOnly === "/library") {
    return pathname.startsWith("/library/")
  }
  if (pathOnly.startsWith("/library/")) {
    return pathname === pathOnly
  }
  return pathname.startsWith(`${pathOnly}/`)
}

function useLocationHash(): string {
  const [hash, setHash] = React.useState("")
  React.useEffect(() => {
    const read = () => setHash(typeof window !== "undefined" ? window.location.hash : "")
    read()
    window.addEventListener("hashchange", read)
    return () => window.removeEventListener("hashchange", read)
  }, [])
  return hash
}

/** Sub-item active — catalog detail routes, hash fragments, or duplicate hub URLs (Rotations). */
function isCollapsibleChildActive(
  pathname: string,
  parent: NavLinkItem,
  child: NavLinkItem,
  locationHash: string
): boolean {
  const children = parent.children
  if (!children?.length) return isNavActive(pathname, child.url)

  const hasHashChild = children.some(c => c.url.includes("#"))
  if (hasHashChild) {
    const h = locationHash.startsWith("#") ? locationHash.slice(1) : locationHash
    const childHash = child.url.includes("#") ? child.url.split("#")[1] : ""
    if (parent.primaryHubChildKey && child.key === parent.primaryHubChildKey) {
      return h === ""
    }
    if (childHash) {
      return h === childHash
    }
    return false
  }

  if (!isNavActive(pathname, child.url)) return false

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

/** Accessible suffix for sidebar badges (badge is rendered outside the link node). */
function badgeAccessibleSuffix(badge: number | string): string {
  if (typeof badge === "number") return `${badge} items`
  return String(badge)
}

/** Child row for expandable nav items — shared by inline sub-menu and collapsed-rail popover. */
function SidebarNavChildLink({
  parent,
  child,
  pathname,
  locationHash,
  onNavigate,
  linkClassName,
}: {
  parent: NavLinkItem
  child: NavLinkItem
  pathname: string
  locationHash: string
  onNavigate?: () => void
  /** Popover uses surface tokens; inline sub-menu uses `SidebarMenuSubButton`. */
  linkClassName?: string
}) {
  const { openPanel } = useSecondaryPanel()
  const childActive = isCollapsibleChildActive(pathname, parent, child, locationHash)
  const childPath = navUrlPath(child.url)

  return (
    <Link
      href={child.url}
      className={linkClassName}
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
      }}
    >
      <span className="size-4 shrink-0 flex items-center justify-center" aria-hidden="true">
        {child.icon}
      </span>
      <span className="min-w-0 flex-1 truncate">{child.title}</span>
    </Link>
  )
}

/**
 * CollapsibleNavItem — isolated component so each collapsible has its own
 * controlled `open` state initialised in useEffect. This avoids the Radix
 * hydration mismatch caused by `defaultOpen` resolving differently on the
 * server (SSR) vs the client (router not yet available).
 */
function CollapsibleNavItem({ item, pathname }: { item: NavLinkItem; pathname: string }) {
  const locationHash     = useLocationHash()
  const isActive         = isNavActive(pathname, item.url)
  const isAnyChildActive =
    item.children?.some(c => isCollapsibleChildActive(pathname, item, c, locationHash)) ?? false
  const { state, isMobile } = useSidebar()
  const [open, setOpen]  = React.useState(isAnyChildActive)
  const [flyoutOpen, setFlyoutOpen] = React.useState(false)
  const flyoutTitleId = React.useId()
  const iconRailCollapsed = state === "collapsed" && !isMobile
  const showActiveStyle = isActive || isAnyChildActive
  const triggerIcon =
    showActiveStyle && item.iconActive ? item.iconActive : item.icon

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
        <Popover open={flyoutOpen} onOpenChange={setFlyoutOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <SidebarMenuButton
                  isActive={showActiveStyle}
                  aria-haspopup="dialog"
                  aria-label={`${item.title} — open subpages`}
                >
                  <span
                    className={cn(
                      "size-4 shrink-0 flex items-center justify-center",
                      showActiveStyle &&
                        "[animation:sidebar-icon-pop_380ms_cubic-bezier(0.34,1.56,0.64,1)_both]",
                    )}
                    aria-hidden="true"
                  >
                    {triggerIcon}
                  </span>
                  <span className="sr-only">{item.title}</span>
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
    <Collapsible open={open} onOpenChange={setOpen} asChild>
      <SidebarMenuItem>
        <Tooltip>
          <TooltipTrigger asChild>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton isActive={showActiveStyle}>
                <span
                  key={showActiveStyle ? "active" : "idle"}
                  className={cn(
                    "size-4 shrink-0 flex items-center justify-center",
                    showActiveStyle &&
                      "[animation:sidebar-icon-pop_380ms_cubic-bezier(0.34,1.56,0.64,1)_both]",
                  )}
                  aria-hidden="true"
                >
                  {triggerIcon}
                </span>
                <span>{item.title}</span>
                <i
                  className="fa-light fa-chevron-right ml-auto text-xs text-current transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                  aria-hidden="true"
                />
              </SidebarMenuButton>
            </CollapsibleTrigger>
          </TooltipTrigger>
          <TooltipContent side="right" align="center" hidden={state !== "collapsed" || isMobile}>
            {item.title}
          </TooltipContent>
        </Tooltip>
        <CollapsibleContent className="group-data-[collapsible=icon]:hidden">
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
  return (
    <>
      {items.map(item => {
        if (item.children?.length) {
          return <CollapsibleNavItem key={item.key} item={item} pathname={pathname} />
        }

        const isActive = isNavActive(pathname, item.url)
        return (
          <SidebarMenuItem key={item.key}>
            <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
              <Link
                href={item.url}
                aria-current={isActive ? "page" : undefined}
                aria-label={
                  item.badge !== undefined
                    ? `${item.title}, ${badgeAccessibleSuffix(item.badge)}`
                    : undefined
                }
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

/** Utilities-style rows (⌘K, Settings, …) — shared by quick actions + bottom group. */
function SidebarNavSecondaryItems({
  items,
  pathname,
}: {
  items: NavSecondaryItem[]
  pathname: string
}) {
  const mod = useModKeyLabel()
  return (
    <>
      {items.map((item) => {
        const pathOnly = navUrlPath(item.url)
        const linkActive =
          !item.opensCommandMenu &&
          Boolean(pathOnly) &&
          pathOnly !== "#" &&
          isNavActive(pathname, item.url)

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
            ) : (
              <SidebarMenuButton asChild isActive={linkActive} tooltip={item.title}>
                <Link href={item.url}>
                  <span className="size-4 shrink-0 flex items-center justify-center" aria-hidden="true">
                    {item.icon}
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
// TeamSwitcher — school + program picker in the sidebar header
// ─────────────────────────────────────────────────────────────────────────────

function TeamSwitcher() {
  const { state, isMobile } = useSidebar()
  const [school,  setSchool]  = React.useState<NavSchool>(NAV_SCHOOL_DEFAULT)
  const [program, setProgram] = React.useState<NavProgram>(NAV_PROGRAM_DEFAULT)
  const [subView, setSubView] = React.useState<"main" | "schools">("main")

  function switchSchool(s: NavSchool) {
    setSchool(s)
    setProgram(s.programs[0])
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
              aria-label={`${school.name} · ${program.name}. Switch school or program`}
              className={cn(
                "items-start py-2 text-sidebar-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
                /* `size=lg` is `h-12` + `overflow-hidden` — two lines + avatar need more height */
                (state === "expanded" || isMobile) &&
                  "h-auto min-h-12 overflow-x-clip overflow-y-visible",
                "group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center",
                /* Icon rail: default is `size-8` + `p-2` (~16px inner) — clips 32px avatars; center logo without chevron */
                "group-data-[collapsible=icon]:!size-9 group-data-[collapsible=icon]:!min-h-9 group-data-[collapsible=icon]:!max-h-9 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:overflow-visible",
              )}
            >
              <Avatar
                className={cn(
                  "mt-0.5 h-8 w-8 shrink-0 rounded-lg",
                  /* Icon rail: same 36px frame as product mark + header button */
                  "group-data-[collapsible=icon]:mt-0 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8",
                )}
              >
                <AvatarImage
                  src={school.logo}
                  alt=""
                  referrerPolicy="origin"
                  className="object-contain p-1 group-data-[collapsible=icon]:p-0.5"
                />
                <AvatarFallback className="rounded-lg text-xs font-bold bg-secondary text-secondary-foreground">
                  {school.initials}
                </AvatarFallback>
              </Avatar>
              <div
                className={cn(
                  "grid min-w-0 flex-1 text-start text-sm leading-snug",
                  "group-data-[collapsible=icon]:hidden",
                )}
              >
                <span className="break-words font-medium whitespace-normal">{school.name}</span>
                <span className="break-words text-xs text-muted-foreground whitespace-normal">
                  {program.name}
                </span>
              </div>
              {(state === "expanded" || isMobile) && (
                <i
                  className="fa-light fa-chevron-down ms-auto mt-1 inline-flex size-6 shrink-0 items-center justify-center text-xs text-muted-foreground"
                  aria-hidden="true"
                />
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="right" align="center" hidden={state !== "collapsed" || isMobile}>
          {school.name} · {program.name}
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
            {/* Selected school — click to switch school */}
            <div className="p-1">
              <button
                type="button"
                onClick={() => setSubView("schools")}
                className={cn(
                  "flex w-full items-start gap-2.5 rounded-md px-2 py-2 text-left transition-colors",
                  "hover:bg-interactive-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              >
                <Avatar className="h-9 w-9 rounded-md shrink-0">
                  <AvatarImage
                    src={school.logo}
                    alt=""
                    referrerPolicy="origin"
                    className="object-contain p-0.5"
                  />
                  <AvatarFallback className="rounded-md text-xs font-semibold">
                    {school.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground leading-tight">
                    School
                  </p>
                  <p className="mt-0.5 text-[13px] font-semibold leading-snug">
                    {school.name}
                  </p>
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{program.name}</p>
                </div>
                <span className="shrink-0 pt-0.5 text-xs font-medium text-brand">Change</span>
              </button>
            </div>

            <DropdownMenuSeparator />

            {/* Programs */}
            <DropdownMenuLabel className="text-xs text-muted-foreground">Program</DropdownMenuLabel>
            {school.programs.map(p => (
              <DropdownMenuItem
                key={p.id}
                onClick={() => setProgram(p)}
                className="items-start py-2"
              >
                <i className="fa-light fa-graduation-cap mt-0.5 shrink-0 text-[13px]" aria-hidden="true" />
                <span className="min-w-0 flex-1 break-words whitespace-normal">{p.name}</span>
                {p.id === program.id && (
                  <i className="fa-solid fa-check ms-1 shrink-0 text-brand text-xs mt-0.5" aria-hidden="true" />
                )}
              </DropdownMenuItem>
            ))}
          </>
        ) : (
          <>
            {/* Back + school list */}
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setSubView("main") }}>
              <i className="fa-light fa-arrow-left text-[13px]" aria-hidden="true" />
              <span>Back</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">Select school</DropdownMenuLabel>
            {NAV_SCHOOLS.map(s => (
              <DropdownMenuItem
                key={s.id}
                onClick={() => switchSchool(s)}
                className="items-start py-2"
              >
                <Avatar size="sm" className="mt-0.5 shrink-0 rounded-md">
                  <AvatarImage src={s.logo} alt="" referrerPolicy="origin" />
                  <AvatarFallback className="rounded-md text-xs font-semibold">
                    {s.initials}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1 break-words whitespace-normal">{s.name}</span>
                {s.id === school.id && (
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

const PRODUCTS: { id: Product; label: string }[] = [
  { id: "exxat-one",   label: "Exxat One"   },
  { id: "exxat-prism", label: "Exxat Prism" },
]

function ProductLogoButton() {
  const { product, setProduct } = useProduct()
  const { state, isMobile } = useSidebar()
  const current = PRODUCTS.find(p => p.id === product) ?? PRODUCTS[0]
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
                "items-start py-2 text-sidebar-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
                expandedOrMobile &&
                  "h-auto min-h-12 overflow-x-clip overflow-y-visible",
                "group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center",
                iconRail &&
                  "group-data-[collapsible=icon]:!size-9 group-data-[collapsible=icon]:!min-h-9 group-data-[collapsible=icon]:!max-h-9 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:overflow-visible",
              )}
              aria-label={`Current product: ${current.label}. Switch product`}
              suppressHydrationWarning
            >
              {iconRail ? (
                <span className="flex size-8 shrink-0 items-center justify-center">
                  <ExxatProductMark
                    product={current.id}
                    className="size-7 max-h-none"
                  />
                </span>
              ) : (
                <>
                  <span
                    className="mt-0.5 flex min-h-8 min-w-0 flex-1 items-center overflow-x-clip overflow-y-visible"
                    aria-hidden="true"
                  >
                    <ExxatProductLogo
                      product={current.id}
                      className="h-7 w-auto max-w-[min(100%,260px)] object-left object-contain"
                    />
                  </span>
                  <i
                    className="fa-light fa-chevron-down ms-auto mt-1 inline-flex size-6 shrink-0 items-center justify-center text-xs text-muted-foreground"
                    aria-hidden="true"
                  />
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="right" align="center" hidden={state !== "collapsed" || isMobile}>
          {current.label}
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent className="w-52" align="start" side="right" sideOffset={8}>
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Switch product
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {PRODUCTS.map(p => (
          <DropdownMenuItem
            key={p.id}
            onClick={() => setProduct(p.id)}
            className="gap-2 py-2"
            aria-selected={p.id === product}
          >
            <ExxatProductLogo
              product={p.id}
              className="h-7 w-auto shrink-0 max-w-[min(100%,200px)]"
            />
            {p.id === product && (
              <i className="fa-solid fa-check ml-auto text-brand text-xs" aria-hidden="true" />
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
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" {...props}>
      <nav
        aria-label="Application"
        data-exxat-sidebar="application-nav"
        className="flex min-h-0 flex-1 flex-col"
      >
        <SidebarHeader className="border-b border-sidebar-border pb-2">
          <SidebarHeaderStack>
            <SidebarMenu>
              <SidebarMenuItem>
                <ProductLogoButton />
              </SidebarMenuItem>
            </SidebarMenu>
            <TeamSwitcher />
          </SidebarHeaderStack>
        </SidebarHeader>

        <SidebarContent className="gap-0">
          <SidebarGroup className="py-2" role="group" aria-label="Primary">
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                <SidebarNavSecondaryItems items={NAV_QUICK_ACTIONS} pathname={pathname} />
                <NavLinkItems items={NAV_PRIMARY} pathname={pathname} />
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
            >
              {NAV_DOCUMENTS_LABEL}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                <NavLinkItems items={NAV_DOCUMENTS} pathname={pathname} />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Secondary utility links — pushed to the bottom of the scroll area */}
          <SidebarGroup
            className="mt-auto py-2 border-t border-sidebar-border"
            role="group"
            aria-label="Utilities"
          >
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                <SidebarNavSecondaryItems items={NAV_SECONDARY} pathname={pathname} />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border">
          <NavUser user={NAV_USER} />
        </SidebarFooter>
      </nav>
    </Sidebar>
  )
}
