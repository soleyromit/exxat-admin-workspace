import * as React from "react"
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
import { LeoAmbienceProvider } from "@/components/leo-ambience-context"
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
import { PceProvider } from "@/components/pce/pce-state"
import { PceBrandSync } from "@/components/pce/pce-brand-sync"
import { SchoolSwitcherProvider } from "@/contexts/school-switcher-context"
import { CompactHeaderSlotProvider } from "@/contexts/compact-header-slot-context"
import { UtilityBarSlot } from "@/components/utility-bar-slot"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const commandMenuConfig = buildCommandMenuConfig({
    dataGroups: PCE_COMMAND_MENU_DATA_GROUPS,
  })

  return (
    <PceProvider>
      <SchoolSwitcherProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        <ProductProvider>
          <PceBrandSync />
          <ProductRouteSyncClient />
          <ProductSwitchOverlay />
          <ThemeColorSync />
          <TooltipProvider delayDuration={300}>
            <DashboardViewProvider>
              <ChartVariantProvider>
                <AskLeoProvider>
                  <LeoAmbienceProvider>
                  <KeyMetricsAskLeoBridge>
                    <SystemBannerProvider>
                      <CommandMenuProvider value={commandMenuConfig}>
                        <CompactHeaderSlotProvider>
                          <SidebarShell
                            // Compact-shell migration (Aug 2026): rail defaults to
                            // icon-only every load, matching the Design OS target —
                            // no longer restored from the sidebar_state_v2 cookie.
                            // SidebarTrigger (⌘B) in UtilityBarSlot still lets a
                            // user expand it for the session if they want labels.
                            defaultOpen={false}
                            wrapperClassName="flex min-h-svh flex-col"
                          >
                            <CommandMenu />
                            <SystemBannerSlot />
                            {/* Full-width — sits ABOVE the sidebar+content row,
                                not scoped to the content area. The rail below
                                carries no brand header of its own; the product
                                label lives here. */}
                            <UtilityBarSlot />
                            <div className="flex min-h-0 w-full flex-1 items-stretch has-data-[variant=inset]:bg-sidebar">
                              <SecondaryPanelProvider>
                                <AppSidebar variant="sidebar" />
                                <SecondaryPanel />
                                <SidebarInset aria-label="Main content">
                                  {children}
                                </SidebarInset>
                              </SecondaryPanelProvider>
                              <AskLeoSidebar />
                            </div>
                          </SidebarShell>
                        </CompactHeaderSlotProvider>
                      </CommandMenuProvider>
                    </SystemBannerProvider>
                  </KeyMetricsAskLeoBridge>
                  </LeoAmbienceProvider>
                </AskLeoProvider>
              </ChartVariantProvider>
            </DashboardViewProvider>
          </TooltipProvider>
        </ProductProvider>
      </ThemeProvider>
      </SchoolSwitcherProvider>
    </PceProvider>
  )
}
