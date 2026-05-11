'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  Avatar,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  Badge,
  useSidebar,
} from '@exxat/ds/packages/ui/src'
import { useFacultySession } from '@/lib/faculty-session'

// ── Brand header ──────────────────────────────────────────────────────────────
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
            <img
              src="/exxat-logo.svg"
              alt=""
              aria-hidden="true"
              width={32}
              height={32}
              className="shrink-0"
            />
          ) : (
            <img
              src="/exxat-prism.svg"
              alt="Exxat Prism"
              className="h-6 w-auto"
            />
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

// ── Institution context card ──────────────────────────────────────────────────
function InstitutionCard() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          tooltip="Switch institution"
          className="sidebar-institution-btn gap-3"
        >
          <Avatar className="h-9 w-9 rounded-full shrink-0">
            <AvatarFallback
              className="rounded-full text-xs font-bold text-foreground"
              style={{ backgroundColor: 'var(--muted)' }}
            >
              SU
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-start leading-tight min-w-0">
            <span className="truncate text-sm font-semibold text-sidebar-foreground" title="State University">
              State University
            </span>
            <span className="truncate text-xs text-muted-foreground" title="Health Sciences">
              Health Sciences
            </span>
          </div>
          <i
            className="fa-light fa-chevron-right ms-auto shrink-0 text-muted-foreground"
            aria-hidden="true"
            style={{ fontSize: 11 }}
          />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

// ── Faculty mode banner — only when role=faculty ──────────────────────────────
function FacultyModeBadge() {
  const { role, faculty, hydrated } = useFacultySession()
  const { state } = useSidebar()

  if (!hydrated || role !== 'faculty' || !faculty) return null

  if (state === 'collapsed') {
    return (
      <div
        className="mx-auto my-1 size-1.5 rounded-full bg-brand ring-3 ring-brand/20"
        aria-label="Faculty session active"
      />
    )
  }

  const editorCount = faculty.courses.filter(c => c.level === 'editor').length
  const viewerCount = faculty.courses.filter(c => c.level === 'viewer').length

  return (
    <div
      className="mx-2 mb-1 rounded-md px-3 py-1.5 flex items-center gap-2 border-l-2 border-l-brand bg-card border-y border-r border-border"
      role="status"
      aria-label="Faculty session active"
    >
      <i className="fa-solid fa-id-badge text-brand text-xs" aria-hidden="true" />
      <div className="grid flex-1 leading-tight min-w-0">
        <span className="text-[10px] font-medium uppercase tracking-wider text-foreground">
          Faculty Mode
        </span>
        <span className="text-[10px] truncate text-muted-foreground">
          {editorCount} editor · {viewerCount} viewer
        </span>
      </div>
    </div>
  )
}

// ── User footer (role-aware) ──────────────────────────────────────────────────
const ADMIN_USER = {
  name: 'Dr. Sarah Thompson',
  email: 'thompson@university.edu',
  initials: 'ST',
  title: 'Academic Administrator',
}

function UserFooter() {
  const { isMobile } = useSidebar()
  const { role, faculty, hydrated } = useFacultySession()

  if (!hydrated) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="cursor-default" aria-hidden="true">
            <div className="h-8 w-8 rounded-full" style={{ background: 'var(--muted)' }} />
            <div className="grid flex-1 leading-tight min-w-0">
              <span className="h-3 w-20 rounded" style={{ background: 'var(--muted)' }} />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  const user = role === 'faculty' && faculty
    ? {
        name: `${faculty.title} ${faculty.name}`,
        email: faculty.email,
        initials: faculty.initials,
        title: faculty.department,
      }
    : ADMIN_USER

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
                <AvatarFallback
                  className={`rounded-full text-xs font-bold ${role === 'faculty' ? 'bg-brand text-brand-foreground' : 'bg-primary text-primary-foreground'}`}
                >
                  {user.initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-start text-sm leading-tight min-w-0">
                <span className="truncate font-medium" title={user.name}>{user.name}</span>
                <span className="truncate text-xs text-muted-foreground" title={user.title}>{user.title}</span>
              </div>
              <i
                className="fa-light fa-ellipsis-vertical ms-auto shrink-0"
                aria-hidden="true"
                style={{ fontSize: 13 }}
              />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-72 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-3 px-2 py-2 text-sm">
                <Avatar className="h-10 w-10 rounded-full">
                  <AvatarFallback
                    className={`rounded-full text-sm font-bold ${role === 'faculty' ? 'bg-brand text-brand-foreground' : 'bg-primary text-primary-foreground'}`}
                  >
                    {user.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-start leading-tight min-w-0">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                  <Badge
                    variant="secondary"
                    className="mt-1 w-fit rounded font-mono text-[10px] uppercase tracking-wider bg-muted text-foreground"
                  >
                    {role}
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {/* Persona switching now lives in the SiteHeader top-right (PersonaSwitcher).
                Sidebar shows only profile + log-out. */}

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

            <DropdownMenuItem variant="destructive">
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
//
// Per Vishaka (May 5 review):
//   - "Assessment Builder" removed as a top-level entry. Assessments are
//     ALWAYS built from a course in phase 1. Faculty enters a course →
//     Assessments tab → Create assessment. The standalone builder violates
//     this entry point.
//   - "Student Accommodations" added as a top-level item — it's a one-time
//     setup per student that follows them to every registered course.
const NAV_ITEMS_BASE = [
  {
    key: 'courses',
    title: 'Courses',
    href: '/courses',
    icon: 'fa-graduation-cap',
  },
  {
    key: 'question-bank',
    title: 'Question Bank',
    href: '/question-bank',
    icon: 'fa-books',
  },
  {
    key: 'accommodations',
    title: 'Student Accommodations',
    href: '/accommodations',
    icon: 'fa-universal-access',
    // Faculty see accommodations only within a specific course, not as a global
    // nav item. Aarti: "You logged in as a faculty. You shouldn't see that left
    // hand side menu [for accommodations]."
    adminOnly: true,
  },
  {
    key: 'competency',
    title: 'Competency',
    href: '/competency',
    icon: 'fa-bullseye-arrow',
  },
]

// ── Footer utility items ──────────────────────────────────────────────────────
const FOOTER_NAV_BASE = [
  { key: 'access', title: 'Roles & Access', href: '/access', icon: 'fa-user-gear', adminOnly: true },
  { key: 'settings', title: 'Settings', href: '/settings', icon: 'fa-gear' },
  { key: 'help', title: 'Get Help', href: '/help', icon: 'fa-circle-question' },
]

// ── AppSidebar ────────────────────────────────────────────────────────────────
export function AppSidebar() {
  const pathname = usePathname()
  const { role, hydrated } = useFacultySession()

  const NAV_ITEMS = NAV_ITEMS_BASE.filter(item => !item.adminOnly || role === 'admin' || !hydrated)
  const FOOTER_NAV = FOOTER_NAV_BASE.filter(item => !item.adminOnly || role === 'admin' || !hydrated)

  return (
    <Sidebar variant="inset" collapsible="icon">
      <nav aria-label="Application" className="flex min-h-0 flex-1 flex-col">

        {/* Header: brand + institution */}
        <SidebarHeader className="pb-1">
          <AppHeader />
          <InstitutionCard />
        </SidebarHeader>

        <FacultyModeBadge />

        <SidebarSeparator />

        {/* Primary navigation */}
        <SidebarContent className="gap-0">
          <SidebarGroup className="py-2" role="group" aria-label="Primary navigation">
            <SidebarGroupContent>
              <SidebarMenu>
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

        <SidebarSeparator />

        {/* Footer: settings/help + user */}
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
