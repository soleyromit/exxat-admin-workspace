import * as React       from "react"
import { AppSidebar }   from "@/components/app-sidebar"
import { SidebarShell } from "@/components/sidebar-shell"
import { DashboardViewProvider } from "@/contexts/dashboard-view-context"
import { ChartVariantProvider }  from "@/contexts/chart-variant-context"
import { AskLeoProvider, AskLeoSidebar } from "@/components/ask-leo-sidebar"
import { SecondaryPanelProvider, SecondaryPanel } from "@/components/secondary-panel"
import { SystemBannerProvider } from "@/contexts/system-banner-context"
import { SystemBannerSlot } from "@/components/system-banner-slot"
import { CommandMenu } from "@/components/command-menu"
import { CommandMenuProvider } from "@/contexts/command-menu-context"
import { buildCommandMenuConfig } from "@/lib/command-menu-config"
import { getCommandMenuSearchDataGroups } from "@/lib/command-menu-search-data"

/**
 * Shared app layout:
 *   [          SystemBanner (main-page width)          ]
 *   [AppSidebar] [SecondaryPanel?] [page] [AskLeo?]
 *
 * The SystemBanner is configured from Settings (persisted to localStorage
 * via SystemBannerProvider) — no hardcoded copy here.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardViewProvider>
    <ChartVariantProvider>
    <AskLeoProvider>
    <SystemBannerProvider>
    <CommandMenuProvider
      value={buildCommandMenuConfig({ dataGroups: getCommandMenuSearchDataGroups() })}
    >

    <SidebarShell wrapperClassName="flex min-h-svh min-h-0 flex-col">
      {/* ⌘K command palette */}
      <CommandMenu />
      <SystemBannerSlot />

      {/* Sidebar + content row — flex-1 fills space below banner; items-stretch + SidebarInset flex-1
          keeps main at least viewport-tall (minus banner) even when page body is short. */}
      <div className="flex min-h-0 w-full flex-1 items-stretch has-data-[variant=inset]:bg-sidebar">
        <SecondaryPanelProvider>
          <AppSidebar variant="inset" />
          <SecondaryPanel />
          {children}
        </SecondaryPanelProvider>
        <AskLeoSidebar />
      </div>
    </SidebarShell>
    </CommandMenuProvider>
    </SystemBannerProvider>
    </AskLeoProvider>
    </ChartVariantProvider>
    </DashboardViewProvider>
  )
}
