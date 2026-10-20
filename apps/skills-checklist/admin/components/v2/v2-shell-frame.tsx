"use client"

/**
 * V2ShellFrame: the DS base shell for every /v2 page. Same composition as components/shell/shell-frame.tsx
 * (SidebarShell > full-width utility bar > AppSidebar + SidebarInset with the single [data-page-scroll] owner),
 * with the v2 store, nav wiring, utility bar and command menu.
 */
import * as React from "react"
import { TooltipProvider } from "@exxatdesignux/ui/components/ui/tooltip"
import { SidebarInset } from "@exxatdesignux/ui/components/ui/sidebar"
import { LeoAmbienceProvider } from "@exxatdesignux/ui/components/ui/leo-ambience-context"
import { AppSidebar, SidebarShell } from "@exxatdesignux/ui/components/shell"
import { V2StoreProvider } from "@/lib/v2/react"
import { V2ShellWiring } from "@/components/v2/v2-shell-wiring"
import { V2CommandMenu } from "@/components/v2/v2-command-menu"
import { V2UtilityBar } from "@/components/v2/v2-utility-bar"

export function V2ShellFrame({ children }: { children: React.ReactNode }) {
  return (
    <V2StoreProvider>
      <TooltipProvider delayDuration={300}>
        <LeoAmbienceProvider>
          <V2ShellWiring>
            <SidebarShell defaultOpen wrapperClassName="flex h-dvh min-h-0 w-full flex-col overflow-hidden" data-shell-utility-bar-full="true">
              <V2CommandMenu />
              <V2UtilityBar />
              <div data-app-shell-row="" className="relative z-40 flex min-h-0 w-full min-w-0 flex-1 items-stretch overflow-visible has-data-[variant=inset]:bg-sidebar">
                <AppSidebar variant="sidebar" />
                <SidebarInset aria-label="Main content">
                  <div data-page-scroll className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                    {children}
                  </div>
                </SidebarInset>
              </div>
            </SidebarShell>
          </V2ShellWiring>
        </LeoAmbienceProvider>
      </TooltipProvider>
    </V2StoreProvider>
  )
}
