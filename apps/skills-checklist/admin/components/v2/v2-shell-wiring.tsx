"use client"

/**
 * Fills the packaged DS shell slots for the v2 prototype. Same approach as components/app-shell-wiring.tsx
 * (the v1 scaffold), but the nav is derived from the v2 role in the URL and the v2 store.
 */
import * as React from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { AppShellSlotsProvider, type AppShellData, type AppShellRoutePolicy, type AppShellSlots, type ShellNav } from "@exxatdesignux/ui/components/shell"
import { actorIdFor, roleForPath } from "@/lib/v2/roles"
import { personName } from "@/lib/v2/selectors"
import { useV2State } from "@/lib/v2/react"
import { allV2Urls, buildV2Nav } from "@/components/v2/v2-nav"

const AsParamContext = React.createContext<string | null>(null)

/**
 * Renders nothing; copies ?as into state. useSearchParams needs a Suspense boundary, and keeping that boundary
 * around a null-rendering child (instead of around AppSidebar) means the sidebar hydrates in the same pass as
 * the rest of the shell. A Suspense boundary around the sidebar hydrates later, after SidebarProvider's mobile
 * layout effect has already collapsed it, which is what produced the phone mismatch.
 */
function AsParamReader({ onChange }: { onChange: (v: string | null) => void }) {
  const v = useSearchParams()?.get("as") ?? null
  React.useEffect(() => { onChange(v) }, [v, onChange])
  return null
}

function useNav(): ShellNav {
  const pathname = usePathname() ?? ""
  // ?as arrives after mount (see AsParamReader), so the first client render equals the server render.
  const asParam = React.useContext(AsParamContext)
  const role = roleForPath(pathname) ?? "admin"
  const state = useV2State()
  const actorId = actorIdFor(role, pathname, asParam)
  // The preceptor badge counts the evaluator link's person, else J. Delgado, whatever page they are on.
  const badgeActor = role === "preceptor" ? (asParam ?? actorIdFor("preceptor", "", null)) : actorId
  return React.useMemo(() => {
    const primary = buildV2Nav(role, state, badgeActor)
    return {
      primary,
      primaryLayout: { preamble: primary, sections: [] },
      quickActions: [],
      documents: [],
      secondary: [],
      user: { name: personName(state, actorId), email: "", avatar: "" },
      knownUrls: allV2Urls(),
    }
  }, [role, state, badgeActor, actorId])
}

const SHELL_DATA: AppShellData = { useNav }
const SHELL_SLOTS: AppShellSlots = {}
const SHELL_ROUTES: AppShellRoutePolicy = {}

export function V2ShellWiring({ children }: { children: React.ReactNode }) {
  const on = React.useMemo(() => ({}), [])
  const [asParam, setAsParam] = React.useState<string | null>(null)
  return (
    <AsParamContext.Provider value={asParam}>
      <React.Suspense fallback={null}>
        <AsParamReader onChange={setAsParam} />
      </React.Suspense>
      <AppShellSlotsProvider slots={SHELL_SLOTS} on={on} routes={SHELL_ROUTES} data={SHELL_DATA}>
        {children}
      </AppShellSlotsProvider>
    </AsParamContext.Provider>
  )
}
