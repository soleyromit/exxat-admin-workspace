"use client"

/**
 * Fills the packaged DS shell slots for the v2 prototype. Same approach as components/app-shell-wiring.tsx
 * (the v1 scaffold), but the nav is derived from the v2 role in the URL and needs no v1 store.
 */
import * as React from "react"
import { usePathname } from "next/navigation"
import { AppShellSlotsProvider, type AppShellData, type AppShellRoutePolicy, type AppShellSlots, type ShellNav } from "@exxatdesignux/ui/components/shell"
import { ROLE_BY_ID, roleForPath } from "@/lib/v2/roles"
import { allV2Urls, buildV2Nav } from "@/components/v2/v2-nav"

function useNav(): ShellNav {
  const role = roleForPath(usePathname() ?? "")
  return React.useMemo(() => {
    const primary = buildV2Nav(role)
    return {
      primary,
      primaryLayout: { preamble: primary, sections: [] },
      quickActions: [],
      documents: [],
      secondary: [],
      user: { name: role ? ROLE_BY_ID[role].label : "Demo presenter", email: "", avatar: "" },
      knownUrls: allV2Urls(),
    }
  }, [role])
}

const SHELL_DATA: AppShellData = { useNav }
const SHELL_SLOTS: AppShellSlots = {}
const SHELL_ROUTES: AppShellRoutePolicy = {}

export function V2ShellWiring({ children }: { children: React.ReactNode }) {
  const on = React.useMemo(() => ({}), [])
  return (
    <AppShellSlotsProvider slots={SHELL_SLOTS} on={on} routes={SHELL_ROUTES} data={SHELL_DATA}>
      {children}
    </AppShellSlotsProvider>
  )
}
