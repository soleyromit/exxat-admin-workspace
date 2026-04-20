'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  SidebarSeparator,
  Avatar,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  useSidebar,
} from '@exxat/ds/packages/ui/src'

// ── App header (product logo area) ───────────────────────────────────────────
function AppHeader() {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="cursor-default select-none hover:bg-transparent active:bg-transparent"
          aria-label="Exam Management Admin"
          tooltip="Exam Management"
        >
          {/* Icon — always visible */}
          <span className="flex size-8 items-center justify-center rounded-lg bg-sidebar-accent shrink-0" aria-hidden="true">
            <i className="fa-light fa-graduation-cap text-sm text-sidebar-accent-foreground" aria-hidden="true" />
          </span>
          {/* Text — hidden when collapsed */}
          <div className="grid flex-1 text-start text-sm leading-tight">
            <span className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Exam Management
            </span>
            <span className="truncate font-semibold text-sidebar-foreground">
              Admin
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

// ── User footer ───────────────────────────────────────────────────────────────
function UserFooter() {
  const { isMobile, state } = useSidebar()

  const user = { name: 'Dr. Thompson', email: 'thompson@university.edu', initials: 'DT' }

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
              <Avatar className="h-8 w-8 rounded-lg shrink-0">
                <AvatarFallback className="rounded-lg text-xs font-bold bg-primary text-primary-foreground">
                  {user.initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-start text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
              <i className="fa-light fa-ellipsis-vertical ms-auto" aria-hidden="true" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="min-w-60 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg text-xs font-bold bg-primary text-primary-foreground">
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

            <DropdownMenuItem>
              <i className="fa-light fa-circle-user" aria-hidden="true" />
              Account
            </DropdownMenuItem>
            <DropdownMenuItem>
              <i className="fa-light fa-gear" aria-hidden="true" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem>
              <i className="fa-light fa-bell" aria-hidden="true" />
              Notifications
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

// ── Primary nav items ─────────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    key: 'question-bank',
    title: 'Question Bank',
    href: '/question-bank',
    icon: 'fa-books',
  },
]

// ── AppSidebar ────────────────────────────────────────────────────────────────
export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border pb-2">
        <AppHeader />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="py-2">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {NAV_ITEMS.map(item => {
                const isActive = pathname.startsWith(item.href)
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link
                        href={item.href}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <span className="size-4 shrink-0 flex items-center justify-center" aria-hidden="true">
                          <i
                            className={`${isActive ? 'fa-solid' : 'fa-light'} ${item.icon} text-sm`}
                            aria-hidden="true"
                          />
                        </span>
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <UserFooter />
      </SidebarFooter>
    </Sidebar>
  )
}
