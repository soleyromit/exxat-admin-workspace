"use client"

/**
 * Fills the packaged DS shell's slots with PCE's own content.
 *
 * The shell in `@exxatdesignux/ui/components/shell` renders the icon-only
 * primary rail and its identity menu; the spots that need PCE content — nav
 * rows, the notification bell, the identity menu's role-toggle/demo-account
 * rows, product lock-up — are declared as slots and filled here, once, above
 * the shell (compact-shell migration, Aug 2026).
 *
 * PCE is a single product (no multi-tenant product switching, no school/
 * program scope picker in this pass — that's the old TeamSwitcher and is
 * intentionally deferred, not wired here yet). `useScope` / `useActiveProduct`
 * / `ScopeSwitcherMenu` / `ProductSwitcherItems` are therefore omitted; the
 * shell renders those spots empty rather than crashing (every AppShellData
 * hook and AppShellSlots entry is optional).
 *
 * Nav-row active-state: PCE's own `activePrefixes` field (wizard flows like
 * /surveys/push that have no nav row of their own) is NOT yet ported into the
 * package's `rowActive: NavRowActiveOverride` — those routes render with the
 * package's default longest-prefix matching only. Follow-up, not a
 * regression in navigation itself (every route is still reachable).
 */

import * as React from "react"
import {
  AppShellSlotsProvider,
  type AppShellData,
  type AppShellRoutePolicy,
  type AppShellSlots,
  type ShellNav,
} from "@exxatdesignux/ui/components/shell"

import { NotificationBell } from "@/components/notification-bell"
import { ExxatProductLogo, ExxatProductMark } from "@/components/exxat-product-logo"
import { requestOpenCommandMenu } from "@/components/command-menu"
import { useAskLeo } from "@/components/ask-leo-context"
import { useLogOut } from "@/hooks/use-log-out"
import { usePce } from "@/components/pce/pce-state"
import {
  AccountPreferencesMenu,
  DemoAccountMenuItem,
} from "@/components/pce/identity-menu-items"
import {
  NAV_ADMIN,
  NAV_FACULTY,
  NAV_QUICK_ACTIONS,
  NAV_SECONDARY,
} from "@/lib/pce-nav"

function collectUrls(items: { url: string; children?: { url: string }[] }[]): string[] {
  const urls: string[] = []
  for (const item of items) {
    if (item.url && item.url !== "#") urls.push(item.url)
    if (item.children) urls.push(...collectUrls(item.children))
  }
  return urls
}

const KNOWN_URLS = Array.from(
  new Set([
    ...collectUrls(NAV_ADMIN),
    ...collectUrls(NAV_FACULTY),
    ...collectUrls(NAV_SECONDARY),
  ]),
)

function useNav(): ShellNav {
  const { user } = usePce()
  const navItems = user.role === "admin" ? NAV_ADMIN : NAV_FACULTY

  return React.useMemo(
    () => ({
      primary: navItems,
      primaryLayout: { preamble: navItems, sections: [] },
      quickActions: NAV_QUICK_ACTIONS,
      documents: [],
      secondary: NAV_SECONDARY,
      user: { name: user.name, email: user.email, avatar: "" },
      knownUrls: KNOWN_URLS,
    }),
    [navItems, user.name, user.email],
  )
}

const SHELL_DATA: AppShellData = { useNav }

const USER_MENU_PREFERENCES = [AccountPreferencesMenu]
const USER_MENU_CONSOLE_ITEMS = [DemoAccountMenuItem]

const SHELL_SLOTS: AppShellSlots = {
  Notifications: NotificationBell,
  ProductLogo: ExxatProductLogo,
  ProductMark: ExxatProductMark,
  userMenuPreferences: USER_MENU_PREFERENCES,
  userMenuConsoleItems: USER_MENU_CONSOLE_ITEMS,
}

const SHELL_ROUTES: AppShellRoutePolicy = {}

export function AppShellWiring({ children }: { children: React.ReactNode }) {
  const { open: askLeoOpen, setOpen: setAskLeoOpen } = useAskLeo()
  const logOut = useLogOut()

  const on = React.useMemo(
    () => ({
      openCommandMenu: requestOpenCommandMenu,
      askLeoOpen,
      setAskLeoOpen,
      logOut,
    }),
    [askLeoOpen, setAskLeoOpen, logOut],
  )

  return (
    <AppShellSlotsProvider slots={SHELL_SLOTS} on={on} routes={SHELL_ROUTES} data={SHELL_DATA}>
      {children}
    </AppShellSlotsProvider>
  )
}
