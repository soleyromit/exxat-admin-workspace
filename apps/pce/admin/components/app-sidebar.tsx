"use client"

import * as React from "react"
import { Link, usePathname } from "@/lib/next-compat"
import { cn } from "@/lib/utils"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarNavLabel,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  NAV_ADMIN,
  NAV_FACULTY,
  type NavLinkItem,
} from "@/lib/pce-nav"
import { usePce } from "@/components/pce/pce-state"

// ─── Active-link helper ───────────────────────────────────────────────────────

function isNavActive(pathname: string, url: string, allNavUrls?: string[]): boolean {
  const base = url.split("?")[0]
  if (!base || base === "#") return false
  if (pathname === base) return true
  if (pathname.startsWith(base + "/")) {
    // If another known nav URL is a more-specific match for this pathname,
    // defer to that item (prevents /surveys matching /surveys/programmatic).
    if (allNavUrls?.some(other => {
      const o = other.split("?")[0]
      return o !== base && o.startsWith(base + "/") && (pathname === o || pathname.startsWith(o + "/"))
    })) return false
    return true
  }
  return false
}

// ─── CollapsibleNavItem ───────────────────────────────────────────────────────

function CollapsibleNavItem({ item, pathname, allNavUrls }: { item: NavLinkItem; pathname: string; allNavUrls?: string[] }) {
  const { state, isMobile } = useSidebar()
  /* Children can carry activePrefixes too (e.g. Dashboard owns /course-evaluation/term/*). */
  const childIsActive = (c: NavLinkItem) =>
    isNavActive(pathname, c.url, allNavUrls) ||
    (c.activePrefixes?.some(p => isNavActive(pathname, p, allNavUrls)) ?? false)
  const isAnyChildActive = item.children?.some(childIsActive) ?? false
  const isPrefixActive = item.activePrefixes?.some(p => isNavActive(pathname, p, allNavUrls)) ?? false
  /* Expanded view: any active child forces the parent neutral — even when
     the parent's own activePrefixes also happen to cover that route (they're
     listed there for the icon rail, see below). Only fall back to the
     parent's own URL/prefix when NO child claims the current route (e.g. a
     wizard route with no nav row of its own). Icon rail is the exception:
     isAnyChildActive drives that below, since the parent icon is the only
     visible affordance there. */
  const parentActive = !isAnyChildActive && (isPrefixActive || isNavActive(pathname, item.url, allNavUrls))

  const [open, setOpen] = React.useState(isAnyChildActive)
  const [flyoutOpen, setFlyoutOpen] = React.useState(false)
  const flyoutTitleId = React.useId()

  // Defer tree swap until sidebar CSS width transition (200ms) finishes to
  // avoid blocking the main thread at the start of the animation.
  const targetIconRail = state === "collapsed" && !isMobile
  const [iconRailCollapsed, setIconRailCollapsed] = React.useState(targetIconRail)
  React.useEffect(() => {
    if (!targetIconRail) {
      setIconRailCollapsed(false)
      return
    }
    const t = setTimeout(() => setIconRailCollapsed(true), 220)
    return () => clearTimeout(t)
  }, [targetIconRail])

  // Sync open state with active child on navigation
  React.useEffect(() => { setOpen(isAnyChildActive) }, [pathname, isAnyChildActive])
  React.useEffect(() => { setFlyoutOpen(false) }, [pathname])

  if (!item.children?.length) return null

  const triggerIcon = (iconRailCollapsed ? (isAnyChildActive || isPrefixActive) : parentActive) && item.iconActive
    ? item.iconActive
    : item.icon

  // Icon rail: show Popover flyout instead of hidden inline sub-list
  if (iconRailCollapsed) {
    return (
      <SidebarMenuItem>
        <Popover open={flyoutOpen} onOpenChange={setFlyoutOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <SidebarMenuButton
                  isActive={isAnyChildActive}
                  aria-current={isAnyChildActive ? "page" : undefined}
                  aria-haspopup="dialog"
                  aria-label={`${item.title} — open subpages`}
                >
                  <span className="size-4 shrink-0 flex items-center justify-center" aria-hidden="true">
                    {triggerIcon}
                  </span>
                  <span className="sr-only">{item.title}</span>
                </SidebarMenuButton>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="right" align="center">{item.title}</TooltipContent>
          </Tooltip>
          <PopoverContent className="w-64 p-1" side="right" align="start" sideOffset={8} aria-labelledby={flyoutTitleId}>
            <h2 id={flyoutTitleId} className="sr-only">{item.title}</h2>
            <ul className="flex flex-col gap-0.5" role="list">
              {item.children.map(child => {
                const childActive = childIsActive(child)
                return (
                  <li key={child.key}>
                    <Link
                      href={child.url}
                      onClick={() => setFlyoutOpen(false)}
                      aria-current={childActive ? "page" : undefined}
                      className={cn(
                        "flex min-h-8 w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none ring-ring",
                        "text-popover-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-2",
                        childActive && "bg-accent font-medium text-accent-foreground",
                      )}
                    >
                      <span className="size-4 shrink-0 inline-flex items-center justify-center" aria-hidden="true">
                        {childActive && child.iconActive ? child.iconActive : child.icon}
                      </span>
                      <SidebarNavLabel>{child.title}</SidebarNavLabel>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </PopoverContent>
        </Popover>
      </SidebarMenuItem>
    )
  }

  // Expanded: inline collapsible with animated sub-list
  return (
    <Collapsible open={open} onOpenChange={setOpen} asChild>
      <SidebarMenuItem className="group/collapsible">
        <Tooltip>
          <TooltipTrigger asChild>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton isActive={parentActive}>
                <span
                  key={parentActive ? "active" : "idle"}
                  className={cn(
                    "size-4 shrink-0 flex items-center justify-center",
                    parentActive && "[animation:sidebar-icon-pop_380ms_cubic-bezier(0.34,1.56,0.64,1)_both]",
                  )}
                  aria-hidden="true"
                >
                  {triggerIcon}
                </span>
                <SidebarNavLabel>{item.title}</SidebarNavLabel>
                <span className="ms-auto flex size-4 shrink-0 items-center justify-center" aria-hidden="true">
                  <i
                    className="fa-light fa-chevron-right text-xs text-current transition-transform duration-200 ease-out group-data-[state=open]/collapsible:rotate-90 motion-reduce:transition-none"
                    aria-hidden="true"
                  />
                </span>
              </SidebarMenuButton>
            </CollapsibleTrigger>
          </TooltipTrigger>
          <TooltipContent side="right" align="center" hidden={state !== "collapsed" || isMobile}>
            {item.title}
          </TooltipContent>
        </Tooltip>
        {/* overflow-hidden safe — floating uses Radix Portal */}
        <CollapsibleContent className="overflow-hidden group-data-[collapsible=icon]:hidden data-[state=open]:[animation:collapsible-down_200ms_ease-out] data-[state=closed]:[animation:collapsible-up_200ms_ease-out] motion-reduce:animate-none">
          <SidebarMenuSub>
            {item.children.map(child => {
              const childActive = childIsActive(child)
              return (
                <SidebarMenuSubItem key={child.key}>
                  <SidebarMenuSubButton asChild isActive={childActive}>
                    <Link href={child.url} aria-current={childActive ? "page" : undefined}>
                      <span className="size-4 shrink-0 inline-flex items-center justify-center" aria-hidden="true">
                        {childActive && child.iconActive ? child.iconActive : child.icon}
                      </span>
                      <SidebarNavLabel>{child.title}</SidebarNavLabel>
                    </Link>
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

// ─── PrimaryNav ───────────────────────────────────────────────────────────────

function PrimaryNavItems({ items }: { items: NavLinkItem[] }) {
  const pathname = usePathname()
  const allNavUrls = React.useMemo(
    () => items.flatMap(item => [
      ...(item.children?.map(c => c.url.split("?")[0]) ?? [item.url.split("?")[0]]),
      ...(item.activePrefixes ?? []),
      ...(item.children?.flatMap(c => c.activePrefixes ?? []) ?? []),
    ]),
    [items]
  )

  return (
    <>
      {items.map(item => {
        if (item.children?.length) {
          return <CollapsibleNavItem key={item.key} item={item} pathname={pathname} allNavUrls={allNavUrls} />
        }

        const active =
          isNavActive(pathname, item.url) ||
          (item.activePrefixes?.some(p => isNavActive(pathname, p, allNavUrls)) ?? false)
        return (
          <SidebarMenuItem key={item.key}>
            <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
              <Link href={item.url} aria-current={active ? "page" : undefined}>
                <span
                  key={active ? "active" : "idle"}
                  className={cn(
                    "size-4 shrink-0 flex items-center justify-center",
                    active && "[animation:sidebar-icon-pop_380ms_cubic-bezier(0.34,1.56,0.64,1)_both]",
                  )}
                  aria-hidden="true"
                >
                  {active ? (item.iconActive ?? item.icon) : item.icon}
                </span>
                <SidebarNavLabel>{item.title}</SidebarNavLabel>
              </Link>
            </SidebarMenuButton>
            {item.badge !== undefined && item.badge !== 0 && (
              <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
            )}
          </SidebarMenuItem>
        )
      })}
    </>
  )
}

// ─── AppSidebar ───────────────────────────────────────────────────────────────

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = usePce()
  const navItems = user.role === "admin" ? NAV_ADMIN : NAV_FACULTY

  return (
    <>
      <Sidebar variant="sidebar" collapsible="icon" {...props}>
        <nav aria-label="Application" className="flex min-h-0 flex-1 flex-col">

          {/* Sidebar is `position: fixed; inset-y-0` (DS pattern, spans full
              viewport height) — the top edge sits BEHIND the sticky
              UtilityBarSlot (z-50), not below it. Top padding must clear the
              header height or the first row renders hidden underneath it. */}
          <SidebarContent className="gap-0 pt-[calc(var(--shell-utility-bar-height)+0.5rem)]">
            {/* No brand/logo header here — compact-shell migration (Aug 2026)
                moved the product label into the full-width UtilityBarSlot
                (components/pce/utility-bar-product-label.tsx), matching the
                DS's packaged AppSidebar (a "thin rendering frame" with no
                header of its own — see project_pce_compact_shell_migration
                memory). Keeping a second brand button here would duplicate it. */}
            <SidebarGroup className="py-2" role="group" aria-label="Primary">
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5">
                  <PrimaryNavItems items={navItems} />
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          {/* No footer here — the DS's own rail has none (confirmed live at
              localhost:4000/prism/dashboard: no Settings/Help/avatar icons
              in the rail, collapsed or expanded). Settings, Help, role
              toggle, Appearance, and Demo account all live in the utility
              bar instead: HelpTrigger (direct icon) and UtilityUserMenu's
              avatar dropdown, which renders the same shared
              AccountPreferencesMenu + DemoAccountMenuItem from
              identity-menu-items.tsx. /settings is one ⌘K away via
              pce-command-menu.ts. Do not re-add a rail footer — it was a
              duplicate of the utility bar's avatar menu. */}
        </nav>
      </Sidebar>
    </>
  )
}
