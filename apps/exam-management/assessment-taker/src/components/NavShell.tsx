'use client';

/**
 * NavShell — student portal shell, modeled on the Exxat Prism canonical sidebar.
 *
 * Layout mirrors the Prism faculty/admin nav (brand wordmark → tenant card →
 * Search/Ask Leo → primary nav → DOCUMENTS group → Settings/Help → profile),
 * adapted with student-appropriate items (My Assessments, Competency, etc).
 *
 * Built on the DS Sidebar primitives so it stays in lockstep with the Prism
 * surface as that evolves.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Avatar, AvatarFallback,
  Badge, Button,
  Sidebar, SidebarProvider, SidebarInset, SidebarTrigger,
  SidebarHeader, SidebarContent, SidebarFooter,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuBadge,
  SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarSeparator,
  Kbd, KbdGroup,
  TooltipProvider,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  Tooltip, TooltipTrigger, TooltipContent,
} from '@exxatdesignux/ui';
import { CommandPalette } from './CommandPalette';

const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'warning' as const, icon: 'fa-clock',     title: 'Pharmacology Midterm due today',                body: 'Opens 9:00 AM · 45 min',                                  time: 'Today',  unread: true  },
  { id: 2, type: 'success' as const, icon: 'fa-chart-bar', title: 'Results: Anatomy & Physiology Final',           body: 'Score released · view your competency breakdown',         time: '2h ago', unread: true  },
  { id: 3, type: 'info' as const,    icon: 'fa-lock',      title: 'Review session closes in 2 hours',              body: 'Introduction to Pathology',                                time: '4h ago', unread: false },
  { id: 4, type: 'info' as const,    icon: 'fa-calendar',  title: 'New assessment scheduled',                      body: 'Clinical Pharmacology Exam II opens Mon May 5 at 8:00 AM', time: '1d ago', unread: false },
];

type EntryPoint = 'prism' | 'standalone';

// Key used to persist entry point across SPA navigation within the same session.
const ENTRY_KEY = 'examEntryPoint';

function resolveEntryPoint(): EntryPoint {
  // 1. URL param is authoritative — always overrides stored value.
  try {
    const param = new URL(window.location.href).searchParams.get('entry');
    if (param === 'standalone' || param === 'prism') {
      sessionStorage.setItem(ENTRY_KEY, param);
      return param;
    }
  } catch { /* SSR guard */ }

  // 2. Surviving navigation: read from sessionStorage (set on the original load).
  const stored = sessionStorage.getItem(ENTRY_KEY);
  if (stored === 'standalone' || stored === 'prism') return stored;

  // 3. Default — Prism is the primary entry path.
  return 'prism';
}

function useEntryPoint(): EntryPoint {
  // useState with initializer so resolveEntryPoint() runs once on mount,
  // not on every render. Stable for the lifetime of the session.
  const [entryPoint] = useState<EntryPoint>(resolveEntryPoint);
  return entryPoint;
}

interface NavShellProps {
  children: React.ReactNode;
  title?: string;
}

export function NavShell({ children, title }: NavShellProps) {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const entryPoint = useEntryPoint()

  // ⌘K / Ctrl+K opens the command palette globally.
  // Suppress while focus is in an editable field so ⌘K can still type a literal
  // character if the surrounding app needs it (admin parity — see
  // apps/exam-management/admin/lib/editable-target.ts).
  useEffect(() => {
    const isEditableTarget = (target: EventTarget | null) => {
      const el = target as HTMLElement | null
      if (!el) return false
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement
      ) return true
      return el.getAttribute?.('contenteditable') === 'true'
    }
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        if (isEditableTarget(e.target)) return
        e.preventDefault()
        setPaletteOpen(o => !o)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <TooltipProvider>
      {paletteOpen && <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />}
      <SidebarProvider className="h-svh">
        <nav aria-label="Site navigation">
        <Sidebar variant="inset" collapsible="icon">
          {/* ─── Brand wordmark ───────────────────────────────────────── */}
          <SidebarHeader>
            <BrandRow entryPoint={entryPoint} />
          </SidebarHeader>

          <SidebarContent>
            {/* ─── Search / Notifications ─────────────────────────────── */}
            <SidebarGroup className="py-1">
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Search · ⌘K" onClick={() => setPaletteOpen(true)}>
                      <i className="fa-light fa-magnifying-glass" aria-hidden="true" />
                      <span>Search</span>
                      <KbdGroup className="ms-auto group-data-collapsible-icon:hidden">
                        <Kbd>⌘</Kbd>
                        <Kbd>K</Kbd>
                      </KbdGroup>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <NotificationsItem />
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* ─── Primary navigation ────────────────────────────────── */}
            <SidebarGroup>
              <SidebarGroupContent>
                <PrimaryNav />
              </SidebarGroupContent>
            </SidebarGroup>

            {/* ─── DOCUMENTS group ──────────────────────────────────── */}
            <SidebarGroup>
              <SidebarGroupLabel>Documents</SidebarGroupLabel>
              <SidebarGroupContent>
                <DocumentsNav />
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          {/* ─── Footer: Settings · Get Help · Profile ─────────────────── */}
          <SidebarFooter>
            <SidebarSeparator />
            <FooterNav />
            <SidebarSeparator />
            <ProfileFooter entryPoint={entryPoint} />
          </SidebarFooter>
        </Sidebar>
        </nav>

        <SidebarInset className="flex flex-col overflow-hidden">
          <TopBar title={title} entryPoint={entryPoint} onAskLeo={() => setPaletteOpen(true)} />
          <div
            id="main-content"
            tabIndex={-1}
            className="flex-1 overflow-y-auto outline-none"
          >
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}

// ─── Brand wordmark row ───────────────────────────────────────────────────────
function BrandRow({ entryPoint }: { entryPoint: EntryPoint }) {
  const isPrism = entryPoint === 'prism';
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="cursor-default select-none data-active:bg-transparent"
          tooltip={isPrism ? 'Exxat Prism' : 'Exam Management'}
        >
          <span
            className="flex size-7 shrink-0 items-center justify-center text-[13px] font-bold"
            style={{
              borderRadius: isPrism ? '50%' : 8,
              backgroundColor: isPrism ? 'var(--brand-color)' : 'var(--muted)',
              color: isPrism ? 'var(--brand-foreground)' : 'var(--muted-foreground)',
            }}
            aria-hidden="true"
          >
            {isPrism ? 'E' : 'EM'}
          </span>
          <span className="flex items-baseline gap-1 group-data-collapsible-icon:hidden">
            {isPrism ? (
              <>
                <span className="text-base font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>Exxat</span>
                <span className="text-base font-bold tracking-tight" style={{ color: 'var(--brand-color)' }}>Prism</span>
              </>
            ) : (
              <span className="text-base font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>Exam Management</span>
            )}
          </span>
          {isPrism && (
            <i className="fa-light fa-chevron-down ms-auto group-data-collapsible-icon:hidden" aria-hidden="true" style={{ fontSize: 11, color: 'var(--muted-foreground)' }} />
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>

      {/* Standalone: institution context row under the brand */}
      {!isPrism && (
        <SidebarMenuItem>
          <div className="px-3 pb-1 group-data-collapsible-icon:hidden">
            <p className="text-xs text-muted-foreground leading-tight">Rush University · PT Program</p>
          </div>
        </SidebarMenuItem>
      )}
    </SidebarMenu>
  );
}

// ─── Notifications row with unread dot ───────────────────────────────────────
function NotificationsItem() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllRead = () => setNotifications(ns => ns.map(n => ({ ...n, unread: false })));

  const notifTypeColor: Record<string, string> = {
    warning: 'var(--chart-4)',
    success: 'var(--chart-2)',
    info:    'var(--chart-1)',
  };
  const notifTypeBg: Record<string, string> = {
    warning: 'color-mix(in oklch, var(--chart-4) 14%, var(--background))',
    success: 'color-mix(in oklch, var(--chart-2) 14%, var(--background))',
    info:    'color-mix(in oklch, var(--chart-1) 14%, var(--background))',
  };

  return (
    <SidebarMenuItem>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            tooltip={`Notifications${unreadCount > 0 ? ` · ${unreadCount} unread` : ''}`}
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <i className="fa-light fa-bell" aria-hidden="true" />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <SidebarMenuBadge style={{ backgroundColor: 'var(--destructive)', color: 'var(--destructive-foreground)' }}>
                {unreadCount}
              </SidebarMenuBadge>
            )}
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="w-[360px] p-0">
          <div className="flex justify-between items-center px-4 pt-3 pb-2 border-b border-border">
            <span className="text-sm font-bold text-foreground">Notifications</span>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllRead} className="h-auto py-0.5 text-xs font-semibold" style={{ color: 'var(--brand-color)' }}>
                Mark all read
              </Button>
            )}
          </div>
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {notifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => setNotifications(ns => ns.map(n => n.id === notif.id ? { ...n, unread: false } : n))}
                className="flex gap-3 cursor-pointer px-4 py-3 border-b border-border last:border-b-0 transition-colors"
                style={{
                  background: notif.unread ? 'color-mix(in oklch, var(--brand-color) 4%, var(--card))' : 'var(--card)',
                }}
              >
                <div className="flex items-center justify-center flex-shrink-0" style={{ width: 36, height: 36, borderRadius: 10, background: notifTypeBg[notif.type] }}>
                  <i className={`fa-light ${notif.icon}`} aria-hidden="true" style={{ fontSize: 15, color: notifTypeColor[notif.type] }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2 mb-0.5">
                    <p className={`text-xs leading-snug ${notif.unread ? 'font-bold' : 'font-semibold'} text-foreground`}>{notif.title}</p>
                    {notif.unread && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1" style={{ background: 'var(--brand-color)' }} />}
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">{notif.body}</p>
                  <p className="text-xs mt-1 text-muted-foreground">{notif.time}</p>
                </div>
              </div>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}

// ─── Primary nav (Dashboard, Competency, History) ────────────────────────────
const PRIMARY_NAV = [
  { path: '/',               label: 'Dashboard',            icon: 'fa-grid-2',        exact: true,  badge: null },
  { path: '/competency',     label: 'Competency Progress', icon: 'fa-chart-line',    exact: false, badge: 'New' },
];

function PrimaryNav() {
  const location = useLocation();
  const isActive = (path: string, exact: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <SidebarMenu>
      {PRIMARY_NAV.map(item => {
        const active = isActive(item.path, item.exact);
        return (
          <SidebarMenuItem key={item.path}>
            <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
              <Link to={item.path}>
                <i className={`fa-light ${item.icon}`} aria-hidden="true" />
                <span>{item.label}</span>
                {item.badge && (
                  <Badge
                    variant="outline"
                    className="ms-auto rounded-full text-xs font-semibold gap-0 px-2 group-data-collapsible-icon:hidden"
                    style={{ color: 'var(--brand-dark)', borderColor: 'var(--brand-dark)' }}
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

// ─── DOCUMENTS group (past assessments + resources) ──────────────────────────
const DOCS_NAV: Array<{ path: string; label: string; icon: string; badge?: { text: string; tone: 'beta' | 'count' } }> = [
  { path: '/history',       label: 'Past Assessments', icon: 'fa-clock-rotate-left' },
  { path: '/resources',     label: 'Study Resources',  icon: 'fa-book-open',         badge: { text: 'Beta', tone: 'beta' } },
];

function DocumentsNav() {
  const location = useLocation();

  return (
    <SidebarMenu>
      {DOCS_NAV.map(item => {
        const active = location.pathname.startsWith(item.path);
        return (
          <SidebarMenuItem key={item.path}>
            <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
              <Link to={item.path}>
                <i className={`fa-light ${item.icon}`} aria-hidden="true" />
                <span>{item.label}</span>
                {item.badge?.tone === 'beta' && (
                  <Badge
                    variant="outline"
                    className="ms-auto rounded-full text-xs font-semibold px-2 group-data-collapsible-icon:hidden"
                    style={{ color: 'var(--muted-foreground)', borderColor: 'var(--border)' }}
                  >
                    {item.badge.text}
                  </Badge>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

// ─── Footer nav (Settings + Help, linked) ──────────────────────────────────
const FOOTER_NAV = [
  { path: '/settings', label: 'Settings', icon: 'fa-gear' },
  { path: '/help',     label: 'Get Help', icon: 'fa-circle-question' },
];

function FooterNav() {
  const location = useLocation();
  return (
    <SidebarMenu>
      {FOOTER_NAV.map(item => {
        const active = location.pathname.startsWith(item.path);
        return (
          <SidebarMenuItem key={item.path}>
            <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
              <Link to={item.path}>
                <i className={`fa-light ${item.icon}`} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

// ─── Profile footer card ─────────────────────────────────────────────────────
function ProfileFooter({ entryPoint }: { entryPoint: EntryPoint }) {
  const isPrism = entryPoint === 'prism';
  const navigate = useNavigate();
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              tooltip="Ramona Sanchez"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-8 shrink-0">
                <AvatarFallback
                  className="text-xs font-bold"
                  style={{
                    background: 'var(--foreground)',
                    color: 'var(--background)',
                  }}
                >
                  RS
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col leading-tight min-w-0 group-data-collapsible-icon:hidden">
                <span className="text-sm font-semibold truncate">Ramona Sanchez</span>
                <span className="text-[12px] text-muted-foreground truncate">ramona.sanchez@rush.edu</span>
              </div>
              <i className="fa-regular fa-ellipsis ms-auto group-data-collapsible-icon:hidden" aria-hidden="true" style={{ fontSize: 12, color: 'var(--muted-foreground)' }} />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold">Ramona Sanchez</span>
                <span className="text-xs text-muted-foreground font-normal">ANAT 601 · PT Program</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <i className="fa-light fa-user" aria-hidden="true" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <i className="fa-light fa-gear" aria-hidden="true" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem>
              <i className="fa-light fa-circle-question" aria-hidden="true" />
              Help & Support
            </DropdownMenuItem>
            {isPrism && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <i className="fa-light fa-arrow-up-right-from-square" aria-hidden="true" />
                  Open full profile in Prism
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => navigate('/')}>
              <i className="fa-light fa-arrow-right-from-bracket" aria-hidden="true" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

// ─── Top bar (sidebar trigger + breadcrumb) ──────────────────────────────────
function TopBar({ title, entryPoint, onAskLeo }: { title?: string; entryPoint: EntryPoint; onAskLeo: () => void }) {
  const isPrism = entryPoint === 'prism';
  return (
    <header
      className="flex items-center gap-3 flex-shrink-0 px-4"
      style={{
        height: 56,
        background: 'var(--card)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <SidebarTrigger />
        </TooltipTrigger>
        <TooltipContent>
          Toggle sidebar
          <KbdGroup className="ms-2">
            <Kbd>⌘</Kbd>
            <Kbd>B</Kbd>
          </KbdGroup>
        </TooltipContent>
      </Tooltip>
      <div style={{ width: 1, height: 20, background: 'var(--border)', flexShrink: 0 }} />

      {/* Prism: Prism > Exam Management > [page] */}
      {isPrism ? (
        <>
          <a
            href="#prism-home"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors truncate"
            style={{ textDecoration: 'none' }}
          >
            Prism
          </a>
          <i className="fa-light fa-chevron-right fa-xs shrink-0" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
          <span className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>
            Exam Management
          </span>
          {title && (
            <>
              <i className="fa-light fa-chevron-right fa-xs shrink-0" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
              <span className="text-sm truncate" style={{ color: 'var(--muted-foreground)' }}>{title}</span>
            </>
          )}
        </>
      ) : (
        /* Standalone: Exam Management > [page] — no Prism reference */
        <>
          <span className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>
            Exam Management
          </span>
          {title && (
            <>
              <i className="fa-light fa-chevron-right fa-xs shrink-0" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
              <span className="text-sm truncate" style={{ color: 'var(--muted-foreground)' }}>{title}</span>
            </>
          )}
        </>
      )}

      {/* Ask Leo — right-aligned in both Prism and standalone modes */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={onAskLeo}
            aria-label="Ask Leo · ⌘K"
            className="ms-auto shrink-0 gap-1.5"
          >
            <i className="fa-light fa-sparkles fa-fw" aria-hidden="true" />
            Ask Leo
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Ask Leo
          <KbdGroup className="ms-2">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </TooltipContent>
      </Tooltip>
    </header>
  );
}
