'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarSeparator, Avatar, AvatarFallback, Badge,
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  useSidebar,
} from '@exxat/ds/packages/ui/src'
import { usePce } from '@/components/pce/pce-state'

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

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              aria-label={`${user.name} — open profile menu`}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              tooltip={user.name}
            >
              <Avatar className="h-8 w-8 rounded-full shrink-0">
                <AvatarFallback className="rounded-full text-xs font-bold bg-primary text-primary-foreground">
                  {user.initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-start text-sm leading-tight min-w-0">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
              <i className="fa-light fa-ellipsis-vertical ms-auto shrink-0" aria-hidden="true" style={{ fontSize: 13 }} />
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
                  <AvatarFallback className="rounded-full text-xs font-bold bg-primary text-primary-foreground">
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
    </SidebarMenu>
  )
}

const ADMIN_NAV = [
  { key: 'templates',   title: 'Templates',            href: '/templates',   icon: 'fa-rectangle-list' },
  { key: 'surveys',     title: 'Surveys',               href: '/surveys',     icon: 'fa-paper-plane'    },
  { key: 'moderation',  title: 'Review & Moderation',   href: '/moderation',  icon: 'fa-shield-check'   },
  { key: 'analytics',   title: 'Analytics',             href: '/analytics',   icon: 'fa-chart-mixed'    },
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
  const { user, surveys } = usePce()
  const navItems = user.role === 'admin' ? ADMIN_NAV : FACULTY_NAV
  const pendingCount = surveys.filter(s => s.status === 'pending_review').length

  return (
    <Sidebar variant="inset" collapsible="icon">
      <nav aria-label="Application" className="flex min-h-0 flex-1 flex-col">

        <SidebarHeader className="pb-1">
          <AppHeader />
        </SidebarHeader>

        <SidebarSeparator />

        <SidebarContent className="gap-0">
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
                          {item.key === 'moderation' && pendingCount > 0 && (
                            <Badge
                              variant="default"
                              className="rounded-full h-5 min-w-5 px-1.5 ms-auto tabular-nums"
                              style={{ fontSize: 10 }}
                            >
                              {pendingCount}
                            </Badge>
                          )}
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
