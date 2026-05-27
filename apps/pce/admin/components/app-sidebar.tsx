"use client"

import * as React from "react"
import { usePathname } from "@/lib/next-compat"
import { motion } from "motion/react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
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
import { useAskLeo } from "@/components/ask-leo-sidebar"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { useAltKeyLabel, useModKeyLabel } from "@/hooks/use-mod-key-label"
import { ExxatProductLogo } from "@/components/exxat-product-logo"
import { NavUser } from "@/components/sidebar/nav-user"
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

function isNavActive(pathname: string, url: string): boolean {
  const base = url.split("?")[0]
  if (!base || base === "#") return false
  return pathname === base || pathname.startsWith(base + "/")
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
                <AvatarFallback className="rounded text-[10px] font-bold">
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

function QuickActions({ items }: { items: NavSecondaryItem[] }) {
  const { toggle: toggleAskLeo } = useAskLeo()
  const mod = useModKeyLabel()
  const alt = useAltKeyLabel()

  return (
    <SidebarMenu>
      {items.map(item => (
        <SidebarMenuItem key={item.key}>
          <SidebarMenuButton
            onClick={() => {
              if (item.opensAskLeo) toggleAskLeo()
              else if (item.opensCommandMenu) requestOpenCommandMenu()
            }}
            tooltip={item.title}
          >
            {item.icon}
            <span className="flex-1">{item.title}</span>
            {item.opensAskLeo && (
              <KbdGroup className="ms-auto group-data-collapsible-icon:hidden">
                <Kbd>{mod}</Kbd>
                <Kbd>{alt}</Kbd>
                <Kbd>K</Kbd>
              </KbdGroup>
            )}
            {item.opensCommandMenu && (
              <KbdGroup className="ms-auto group-data-collapsible-icon:hidden">
                <Kbd>{mod}</Kbd>
                <Kbd>K</Kbd>
              </KbdGroup>
            )}
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}

// ─── PrimaryNav ───────────────────────────────────────────────────────────────

function PrimaryNav({ items }: { items: NavLinkItem[] }) {
  const pathname = usePathname()

  return (
    <SidebarMenu>
      {items.map(item => {
        const active = isNavActive(pathname, item.url)
        if (item.children?.length) {
          return (
            <Collapsible
              key={item.key}
              defaultOpen={active}
              asChild
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton isActive={active} tooltip={item.title}>
                    {active ? (item.iconActive ?? item.icon) : item.icon}
                    <span className="flex-1">{item.title}</span>
                    <i
                      className="fa-light fa-chevron-right ms-auto text-[10px] transition-transform group-data-[state=open]/collapsible:rotate-90"
                      aria-hidden="true"
                    />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.children.map(child => (
                      <SidebarMenuSubItem key={child.key}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={isNavActive(pathname, child.url)}
                        >
                          <a href={child.url}>
                            {child.icon}
                            <span>{child.title}</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        }

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
    </SidebarMenu>
  )
}

// ─── SecondaryNav ─────────────────────────────────────────────────────────────

function SecondaryNav({ items }: { items: NavSecondaryItem[] }) {
  return (
    <SidebarMenu>
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
    </SidebarMenu>
  )
}

// ─── AppSidebar ───────────────────────────────────────────────────────────────

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, toggleRole } = usePce()
  const [appearanceOpen, setAppearanceOpen] = React.useState(false)
  const navItems = user.role === "admin" ? NAV_ADMIN : NAV_FACULTY

  const navUser = {
    name: user.name,
    email: user.email,
    avatar: "",
  }

  return (
    <>
      <Sidebar variant="inset" collapsible="icon" {...props}>
        <nav aria-label="Application" className="flex min-h-0 flex-1 flex-col">

          <SidebarHeader className="pb-0">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  size="lg"
                  className="sidebar-brand-btn"
                  tooltip="Exxat Prism"
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
          </SidebarHeader>

          <div className="px-2 pb-1">
            <TeamSwitcher />
          </div>

          <SidebarSeparator />

          <SidebarContent className="gap-0">
            <SidebarGroup className="py-2">
              <SidebarGroupContent>
                <QuickActions items={NAV_QUICK_ACTIONS} />
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator />

            <SidebarGroup className="py-2">
              <SidebarGroupLabel>
                {user.role === "admin" ? "Navigation" : "My workspace"}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <PrimaryNav items={navItems} />
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarSeparator />

          <SidebarFooter className="pt-1 pb-2">
            <SecondaryNav items={NAV_SECONDARY} />
            <NavUser
              user={navUser}
              extraMenuItems={
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={toggleRole}>
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
