import { Outlet } from "react-router-dom"

import {
  AppSidebar,
  SidebarShell,
  SecondaryPanelProvider,
  SecondaryPanel,
} from "@/components/sidebar"
import {
  SIDEBAR_STATE_COOKIE_NAME,
  sidebarDefaultOpenFromCookie,
} from "@/lib/sidebar-state-cookie"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ProductProviderRoot } from "@/components/product-provider-root"
import { ProductRouteSync } from "@/contexts/product-route-sync"
import { ProductSwitchOverlay } from "@/components/product-switch-overlay"
import { ThemeColorSync } from "@/components/theme-color-sync"
import { DashboardViewProvider } from "@/contexts/dashboard-view-context"
import { ChartVariantProvider } from "@/contexts/chart-variant-context"
import { AskLeoProvider, AskLeoSidebar } from "@/components/ask-leo-sidebar"
import { KeyMetricsAskLeoBridge } from "@/components/key-metrics-ask-leo-bridge"
import { SystemBannerProvider } from "@/contexts/system-banner-context"
import { SystemBannerSlot } from "@/components/system-banner-slot"
import { CommandMenu } from "@/components/command-menu"
import { CommandMenuProvider } from "@/contexts/command-menu-context"
import { buildCommandMenuConfig } from "@/lib/command-menu-config"
import { COMMAND_MENU_SEARCH_DATA_GROUPS } from "@/lib/command-menu-search-data"

/**
 * Root layout (replaces both `app/layout.tsx` and `app/(app)/layout.tsx`
 * from the Next template).
 *
 * Cookie reading: Next read `cookies()` server-side. In Vite/SPA we read
 * `document.cookie` synchronously on first render — the API is identical
 * (default true if absent, otherwise the persisted state). No hydration
 * mismatch because there's no server render to mismatch against.
 *
 * Provider order is preserved verbatim from the Next layout — these
 * contexts are tightly coupled to DS components (KeyMetrics ↔ Ask Leo,
 * SecondaryPanel ↔ Sidebar) and reorder would break runtime behaviour.
 */

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined
  const match = document.cookie
    .split("; ")
    .find(c => c.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.split("=")[1]) : undefined
}

export function App() {
  const sidebarDefaultOpen = sidebarDefaultOpenFromCookie(
    readCookie(SIDEBAR_STATE_COOKIE_NAME),
  )

  const commandMenuConfig = buildCommandMenuConfig({
    dataGroups: COMMAND_MENU_SEARCH_DATA_GROUPS,
  })

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ProductProviderRoot>
        <ProductRouteSync />
        <ProductSwitchOverlay />
        <ThemeColorSync />
        <TooltipProvider delayDuration={300}>
          <DashboardViewProvider>
            <ChartVariantProvider>
              <AskLeoProvider>
                <KeyMetricsAskLeoBridge>
                  <SystemBannerProvider>
                    <CommandMenuProvider value={commandMenuConfig}>
                      <SidebarShell
                        defaultOpen={sidebarDefaultOpen}
                        wrapperClassName="flex min-h-svh flex-col"
                      >
                        <CommandMenu />
                        <SystemBannerSlot />
                        <div
                          className="flex min-h-0 w-full flex-1 items-stretch has-data-[variant=inset]:bg-sidebar"
                          suppressHydrationWarning
                        >
                          <SecondaryPanelProvider>
                            <AppSidebar variant="inset" />
                            <SecondaryPanel />
                            <Outlet />
                          </SecondaryPanelProvider>
                          <AskLeoSidebar />
                        </div>
                      </SidebarShell>
                    </CommandMenuProvider>
                  </SystemBannerProvider>
                </KeyMetricsAskLeoBridge>
              </AskLeoProvider>
            </ChartVariantProvider>
          </DashboardViewProvider>
        </TooltipProvider>
      </ProductProviderRoot>
    </ThemeProvider>
  )
}
