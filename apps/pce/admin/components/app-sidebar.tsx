"use client"

import * as React from "react"
import { usePathname, useRouter } from "@/lib/next-compat"
import { motion } from "motion/react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
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
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { requestOpenCommandMenu } from "@/components/command-menu"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { useModKeyLabel } from "@/hooks/use-mod-key-label"
import { ExxatProductLogo } from "@/components/exxat-product-logo"
import { NavUser } from "@/components/sidebar/nav-user"
import { useAskLeo } from "@/components/ask-leo-context"
import { motionHeaderEnter } from "@/lib/motion-ui"
import {
  NAV_ADMIN,
  NAV_FACULTY,
  NAV_QUICK_ACTIONS,
  NAV_SECONDARY,
  NAV_SCHOOLS,
  NAV_SCHOOL_DEFAULT,
  NAV_PROGRAM_DEFAULT,
  type NavLinkItem,
  type NavSecondaryItem,
  type NavSchool,
  type NavProgram,
} from "@/lib/pce-nav"
import { usePce } from "@/components/pce/pce-state"
import { SettingsAppearanceCard } from "@/components/settings-appearance-card"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"

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

// ─── TeamSwitcher ─────────────────────────────────────────────────────────────

function TeamSwitcher() {
  const { state } = useSidebar()
  const [school, setSchool] = React.useState<NavSchool>(NAV_SCHOOL_DEFAULT)
  const [program, setProgram] = React.useState<NavProgram>(NAV_PROGRAM_DEFAULT)

  if (state === "collapsed") return null

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-6 w-6 rounded shrink-0">
                <AvatarImage src={school.logo} alt="" />
                <AvatarFallback className="rounded text-xs font-bold">
                  {school.initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-start text-sm leading-tight min-w-0">
                <span className="truncate font-semibold text-sm">{school.name}</span>
                <span className="truncate text-xs text-muted-foreground">{program.name}</span>
              </div>
              <i
                className="fa-light fa-chevrons-up-down ms-auto shrink-0 text-[11px] text-muted-foreground"
                aria-hidden="true"
              />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-64 rounded-lg"
            side="bottom"
            align="start"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">Schools</DropdownMenuLabel>
            {NAV_SCHOOLS.map(s => (
              <React.Fragment key={s.id}>
                <DropdownMenuItem
                  className="font-medium"
                  onClick={() => { setSchool(s); setProgram(s.programs[0]) }}
                >
                  <Avatar className="h-5 w-5 rounded shrink-0 me-2">
                    <AvatarImage src={s.logo} alt="" />
                    <AvatarFallback className="rounded text-[9px] font-bold">
                      {s.initials}
                    </AvatarFallback>
                  </Avatar>
                  {s.name}
                </DropdownMenuItem>
                {s.id === school.id &&
                  s.programs.map(p => (
                    <DropdownMenuItem
                      key={p.id}
                      className="ps-8 text-sm"
                      onClick={() => setProgram(p)}
                    >
                      {program.id === p.id && (
                        <i className="fa-solid fa-check me-2 text-xs text-brand" aria-hidden="true" />
                      )}
                      {p.name}
                    </DropdownMenuItem>
                  ))}
              </React.Fragment>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

// ─── QuickActions ─────────────────────────────────────────────────────────────

function QuickActionItems({ items }: { items: NavSecondaryItem[] }) {
  const mod = useModKeyLabel()
  const { setOpen: setAskLeoOpen } = useAskLeo()

  return (
    <>
      {items.map(item => (
        <SidebarMenuItem key={item.key}>
          <SidebarMenuButton
            onClick={() => {
              if (item.opensCommandMenu) requestOpenCommandMenu()
              if (item.opensAskLeo) setAskLeoOpen(true)
            }}
            tooltip={item.title}
          >
            {item.icon}
            <span className="flex-1">{item.title}</span>
            {item.opensCommandMenu && (
              <KbdGroup className="ms-auto group-data-collapsible-icon:hidden">
                <Kbd>{mod}</Kbd>
                <Kbd>K</Kbd>
              </KbdGroup>
            )}
            {item.opensAskLeo && (
              <KbdGroup className="ms-auto group-data-collapsible-icon:hidden">
                <Kbd>{mod}</Kbd>
                <Kbd>⌥</Kbd>
                <Kbd>K</Kbd>
              </KbdGroup>
            )}
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </>
  )
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
  const parentActive = isAnyChildActive || isPrefixActive || isNavActive(pathname, item.url, allNavUrls)

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
                <SidebarMenuButton isActive={isAnyChildActive} aria-label={item.title}>
                  <span className="size-4 shrink-0 flex items-center justify-center" aria-hidden="true">
                    {triggerIcon}
                  </span>
                  <span className="sr-only">{item.title}</span>
                </SidebarMenuButton>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="right" align="center">{item.title}</TooltipContent>
          </Tooltip>
          <PopoverContent className="w-56 p-1" side="right" align="start" sideOffset={8} aria-labelledby={flyoutTitleId}>
            <h2 id={flyoutTitleId} className="sr-only">{item.title}</h2>
            <ul className="flex flex-col gap-0.5" role="list">
              {item.children.map(child => {
                const childActive = childIsActive(child)
                return (
                  <li key={child.key}>
                    <a
                      href={child.url}
                      onClick={() => setFlyoutOpen(false)}
                      aria-current={childActive ? "page" : undefined}
                      className={[
                        "flex min-h-8 w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none ring-ring",
                        "text-popover-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-2",
                        childActive ? "bg-accent font-medium text-accent-foreground" : "",
                      ].join(" ")}
                    >
                      <span className="size-4 shrink-0 inline-flex items-center justify-center" aria-hidden="true">
                        {childActive && child.iconActive ? child.iconActive : child.icon}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{child.title}</span>
                    </a>
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
                <span className="size-4 shrink-0 flex items-center justify-center" aria-hidden="true">
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
        {/* overflow-hidden safe — floating uses Radix Portal */}
        <CollapsibleContent className="overflow-hidden group-data-[collapsible=icon]:hidden data-[state=open]:[animation:collapsible-down_200ms_ease-out] data-[state=closed]:[animation:collapsible-up_200ms_ease-out] motion-reduce:animate-none">
          <SidebarMenuSub>
            {item.children.map(child => {
              const childActive = childIsActive(child)
              return (
                <SidebarMenuSubItem key={child.key}>
                  <SidebarMenuSubButton asChild isActive={childActive}>
                    <a href={child.url} aria-current={childActive ? "page" : undefined}>
                      <span className="size-4 shrink-0 inline-flex items-center justify-center" aria-hidden="true">
                        {childActive && child.iconActive ? child.iconActive : child.icon}
                      </span>
                      <span>{child.title}</span>
                    </a>
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
              <a href={item.url} aria-current={active ? "page" : undefined}>
                {active ? (item.iconActive ?? item.icon) : item.icon}
                <span className="flex-1">{item.title}</span>
              </a>
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

// ─── SecondaryNav ─────────────────────────────────────────────────────────────

function SecondaryNavItems({ items }: { items: NavSecondaryItem[] }) {
  return (
    <>
      {items.map(item => (
        <SidebarMenuItem key={item.key}>
          <SidebarMenuButton asChild tooltip={item.title}>
            <a href={item.url}>
              {item.icon}
              <span>{item.title}</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </>
  )
}

// ─── AppSidebar ───────────────────────────────────────────────────────────────

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, toggleRole } = usePce()
  const router = useRouter()
  const [appearanceOpen, setAppearanceOpen] = React.useState(false)
  const navItems = user.role === "admin" ? NAV_ADMIN : NAV_FACULTY

  // Switching role must also move the user off the current (role-specific) page —
  // admin routes don't belong in the faculty view and vice versa. Land on each
  // role's home: faculty → first faculty nav item, admin → the CE dashboard.
  const FACULTY_LANDING = NAV_FACULTY[0]?.url ?? "/my-surveys"
  const ADMIN_LANDING = "/analytics"
  function handleToggleRole() {
    const goingToFaculty = user.role === "admin"
    toggleRole()
    router.push(goingToFaculty ? FACULTY_LANDING : ADMIN_LANDING)
  }

  const navUser = {
    name: user.name,
    email: user.email,
    avatar: "",
  }

  return (
    <>
      <Sidebar variant="inset" collapsible="icon" {...props}>
        <nav aria-label="Application" className="flex min-h-0 flex-1 flex-col">

          <SidebarContent className="gap-0">
            <SidebarHeader className="border-b border-sidebar-border pb-2">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    size="lg"
                    className="sidebar-brand-btn"
                    tooltip="Exxat Prism"
                    aria-label="Exxat Prism — go to dashboard"
                  >
                    <motion.div
                      key="prism-logo"
                      initial="hidden"
                      animate="visible"
                      variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1, transition: motionHeaderEnter },
                      }}
                    >
                      <ExxatProductLogo product="exxat-prism" />
                    </motion.div>
                  </SidebarMenuButton>
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
            </SidebarHeader>

            <SidebarGroup className="py-2" role="group" aria-label="Primary">
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5">
                  <QuickActionItems items={NAV_QUICK_ACTIONS} />
                  <PrimaryNavItems items={navItems} />
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="mt-auto border-t border-sidebar-border bg-sidebar">
            <SidebarGroup className="py-2" role="group" aria-label="Utilities">
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5">
                  <SecondaryNavItems items={NAV_SECONDARY} />
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <NavUser
              user={navUser}
              extraMenuItems={
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleToggleRole}>
                    <i className="fa-light fa-arrows-rotate" aria-hidden="true" />
                    Switch to {user.role === "admin" ? "Faculty" : "Admin"} view
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setAppearanceOpen(true)}>
                    <i className="fa-light fa-paintbrush" aria-hidden="true" />
                    Appearance
                  </DropdownMenuItem>
                </>
              }
            />
          </SidebarFooter>
        </nav>
      </Sidebar>

      <Sheet open={appearanceOpen} onOpenChange={setAppearanceOpen}>
        <SheetContent
          side="right"
          className="w-full data-[side=right]:sm:max-w-2xl overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>Appearance</SheetTitle>
            <SheetDescription>
              Theme, contrast, text size, and brand. Saved in this browser.
            </SheetDescription>
          </SheetHeader>
          <div className="px-6 pb-6">
            <SettingsAppearanceCard />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
