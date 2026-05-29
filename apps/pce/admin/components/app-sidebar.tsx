'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarSeparator, Avatar, AvatarFallback,
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
  Kbd, KbdGroup,
  useSidebar,
} from '@exxat/ds/packages/ui/src'
import { usePce } from '@/components/pce/pce-state'
import { useCommandPalette } from '@/components/command-palette'
import { SettingsAppearanceCard } from '@/components/settings-appearance-card'

function AppHeader() {
  const { state } = useSidebar()
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="sidebar-brand-btn cursor-default select-none"
          aria-label="Exxat Prism"
          tooltip="Exxat Prism"
        >
          {state === 'collapsed' ? (
            <img src="/exxat-logo.svg" alt="" aria-hidden="true" width={32} height={32} className="shrink-0" />
          ) : (
            <img src="/exxat-prism.svg" alt="Exxat Prism" className="h-6 w-auto" />
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function UserFooter() {
  const { isMobile } = useSidebar()
  const { user, toggleRole } = usePce()
  const [appearanceOpen, setAppearanceOpen] = useState(false)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {/* modal={false} — axe aria-hidden-focus fix (2026-05-11):
            Radix's modal MenuRootContent calls hideOthers() which sets
            aria-hidden on every sibling of the portaled menu. The
            sidebar-wrapper containing this trigger is one such sibling,
            and its focusable contents fail the rule. */}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              aria-label={`${user.name} — open profile menu`}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              tooltip={user.name}
            >
              <Avatar className="h-8 w-8 rounded-full shrink-0">
                <AvatarFallback className="rounded-full text-xs font-bold" style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}>
                  {user.initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-start text-sm leading-tight min-w-0">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
              <i className="fa-light fa-ellipsis-vertical ms-auto shrink-0 text-[13px]" aria-hidden="true" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-60 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-sm">
                <Avatar className="h-8 w-8 rounded-full">
                  <AvatarFallback className="rounded-full text-xs font-bold" style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}>
                    {user.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-start leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem>
                <i className="fa-light fa-circle-user" aria-hidden="true" />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <i className="fa-light fa-bell" aria-hidden="true" />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setAppearanceOpen(true)}>
                <i className="fa-light fa-paintbrush" aria-hidden="true" />
                Appearance
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={toggleRole}>
              <i className="fa-light fa-arrows-rotate" aria-hidden="true" />
              Switch to {user.role === 'admin' ? 'Faculty' : 'Admin'} view
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem>
              <i className="fa-light fa-arrow-right-from-bracket" aria-hidden="true" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      <Sheet open={appearanceOpen} onOpenChange={setAppearanceOpen}>
        <SheetContent side="right" className="w-full data-[side=right]:sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Appearance</SheetTitle>
            <SheetDescription>Theme, contrast, text size, and brand. Saved in this browser.</SheetDescription>
          </SheetHeader>
          <div className="px-6 pb-6">
            <SettingsAppearanceCard />
          </div>
        </SheetContent>
      </Sheet>
    </SidebarMenu>
  )
}

const ADMIN_NAV = [
  { key: 'templates',   title: 'Templates',   href: '/templates',   icon: 'fa-rectangle-list' },
  { key: 'surveys',     title: 'Surveys',     href: '/surveys',     icon: 'fa-paper-plane'    },
  { key: 'analytics',   title: 'Analytics',   href: '/analytics',   icon: 'fa-chart-mixed'    },
  // Setup section — workspace ADR-001 program-level master entities (UC-19).
  { key: 'admin',       title: 'Setup',       href: '/admin',       icon: 'fa-gear-complex'   },
]

const FACULTY_NAV = [
  { key: 'my-surveys', title: 'My Surveys', href: '/my-surveys',                  icon: 'fa-paper-plane' },
  { key: 'results',    title: 'Results',    href: '/my-surveys?filter=released',   icon: 'fa-chart-bar'   },
]

const FOOTER_NAV = [
  { key: 'settings', title: 'Settings', href: '/settings', icon: 'fa-gear'            },
  { key: 'help',     title: 'Get Help', href: '/help',     icon: 'fa-circle-question'  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = usePce()
  const { setOpen: setPaletteOpen } = useCommandPalette()
  const navItems = user.role === 'admin' ? ADMIN_NAV : FACULTY_NAV

  return (
    <Sidebar variant="inset" collapsible="icon">
      <nav aria-label="Application" className="flex min-h-0 flex-1 flex-col">

        <SidebarHeader className="pb-1">
          <AppHeader />
        </SidebarHeader>

        <SidebarSeparator />

        <SidebarContent className="gap-0">
          <SidebarGroup className="py-2" role="group" aria-label="Search">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Search · ⌘K"
                    onClick={() => setPaletteOpen(true)}
                  >
                    <i className="fa-light fa-magnifying-glass text-sm" aria-hidden="true" />
                    <span className="flex-1">Search</span>
                    <KbdGroup className="ms-auto group-data-collapsible-icon:hidden">
                      <Kbd>⌘</Kbd>
                      <Kbd>K</Kbd>
                    </KbdGroup>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup className="py-2" role="group" aria-label="Primary navigation">
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map(item => {
                  const basePath = item.href.split('?')[0]
                  const isActive = pathname === basePath || pathname.startsWith(basePath + '/')
                  return (
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                        <Link href={item.href} aria-current={isActive ? 'page' : undefined}>
                          <span
                            key={isActive ? 'active' : 'idle'}
                            className={`size-4 shrink-0 flex items-center justify-center${isActive ? ' [animation:sidebar-icon-pop_380ms_cubic-bezier(0.34,1.56,0.64,1)_both]' : ''}`}
                            aria-hidden="true"
                          >
                            <i
                              className={`${isActive ? 'fa-solid' : 'fa-light'} ${item.icon} text-sm`}
                              aria-hidden="true"
                            />
                          </span>
                          <span className="flex-1">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarSeparator />

        <SidebarFooter className="pt-1">
          <SidebarMenu>
            {FOOTER_NAV.map(item => (
              <SidebarMenuItem key={item.key}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <Link href={item.href}>
                    <i className={`fa-light ${item.icon} text-sm`} aria-hidden="true" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          <UserFooter />
        </SidebarFooter>

      </nav>
    </Sidebar>
  )
}
