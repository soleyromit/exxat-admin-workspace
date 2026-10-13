"use client"

/**
 * ShellFrame: the DS Design OS base layout for every in-shell page (admin, student view, preceptor demo).
 * Same composition as apps/pce/admin/app/(app)/layout.tsx: SidebarShell (h-dvh column) > full-width UtilityBar >
 * row of AppSidebar + SidebarInset, with SidebarInset as the shell's single scroll owner ([data-page-scroll]).
 * The shell-free evaluator link route (/e/[token]) is outside this frame (EV-01).
 */
import * as React from "react"
import { TooltipProvider } from "@exxatdesignux/ui/components/ui/tooltip"
import { SidebarInset } from "@exxatdesignux/ui/components/ui/sidebar"
import { LeoAmbienceProvider } from "@exxatdesignux/ui/components/ui/leo-ambience-context"
import { AppSidebar, SidebarShell } from "@exxatdesignux/ui/components/shell"
import { AppShellWiring } from "@/components/app-shell-wiring"
import { CommandMenu } from "@/components/shell/skills-nav-palette"
import { UtilityBar } from "@/components/shell/utility-bar"

export function ShellFrame({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={300}>
      {/* The DS Ask Leo launcher in the utility bar reads this context (PCE mounts it in app/(app)/layout.tsx). */}
      <LeoAmbienceProvider>
      <AppShellWiring>
        <SidebarShell
          defaultOpen
          wrapperClassName="flex h-dvh min-h-0 w-full flex-col overflow-hidden"
          // The DS stylesheet keys the rail's top offset (below the utility bar) off this attribute and
          // [data-app-shell-row]; without them the rail slides under the bar and clips its first group label.
          data-shell-utility-bar-full="true"
        >
          <CommandMenu />
          {/* Full width, above the sidebar + content row. The product switcher in the bar carries the brand; the rail has no header. */}
          <UtilityBar />
          <div
            data-app-shell-row=""
            className="relative z-40 flex min-h-0 w-full min-w-0 flex-1 items-stretch overflow-visible has-data-[variant=inset]:bg-sidebar"
          >
            <AppSidebar variant="sidebar" />
            <SidebarInset aria-label="Main content">
              <div data-page-scroll className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                {children}
              </div>
            </SidebarInset>
          </div>
        </SidebarShell>
      </AppShellWiring>
      </LeoAmbienceProvider>
    </TooltipProvider>
  )
}
