import * as React from "react"
import { cookies } from "next/headers"
import { ThemeProvider } from "@/components/theme-provider"
import { ProductProvider } from "@/contexts/product-context"
import { ProductRouteSyncClient } from "@/components/product-route-sync-client"
import { ProductSwitchOverlay } from "@/components/product-switch-overlay"
import { ThemeColorSync } from "@/components/theme-color-sync"
import { TooltipProvider } from "@/components/ui/tooltip"
import { DashboardViewProvider } from "@/contexts/dashboard-view-context"
import { ChartVariantProvider } from "@/contexts/chart-variant-context"
import { AskLeoSidebar } from "@/components/ask-leo-sidebar"
import { AskLeoProvider } from "@/components/ask-leo-context"
import { KeyMetricsAskLeoBridge } from "@/components/key-metrics-ask-leo-bridge"
import { SystemBannerProvider } from "@/contexts/system-banner-context"
import { SystemBannerSlot } from "@/components/system-banner-slot"
import { CommandMenu } from "@/components/command-menu"
import { CommandMenuProvider } from "@/contexts/command-menu-context"
import { SidebarShell, SecondaryPanel, SecondaryPanelProvider } from "@/components/sidebar"
import { SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { buildCommandMenuConfig } from "@/lib/command-menu-config"
import { PCE_COMMAND_MENU_DATA_GROUPS } from "@/lib/pce-command-menu"
import { SIDEBAR_STATE_COOKIE_NAME, sidebarDefaultOpenFromCookie } from "@/lib/sidebar-state-cookie"
import { PceProvider } from "@/components/pce/pce-state"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const sidebarCookie = cookieStore.get(SIDEBAR_STATE_COOKIE_NAME)?.value
  const sidebarDefaultOpen = sidebarDefaultOpenFromCookie(sidebarCookie)

  const commandMenuConfig = buildCommandMenuConfig({
    dataGroups: PCE_COMMAND_MENU_DATA_GROUPS,
  })

  return (
    <PceProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        <ProductProvider>
          <ProductRouteSyncClient />
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
                          <div className="flex min-h-0 w-full flex-1 items-stretch has-data-[variant=inset]:bg-sidebar">
                            <SecondaryPanelProvider>
                              <AppSidebar variant="inset" />
                              <SecondaryPanel />
                              <SidebarInset aria-label="Main content">
                                {children}
                              </SidebarInset>
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
        </ProductProvider>
      </ThemeProvider>
    </PceProvider>
  )
}
