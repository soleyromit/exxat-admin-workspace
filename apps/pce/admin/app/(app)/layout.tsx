'use client'

import { SidebarProvider, SidebarInset, TooltipProvider } from '@exxat/ds/packages/ui/src'
import { AppSidebar } from '@/components/app-sidebar'
import { PceProvider } from '@/components/pce/pce-state'
import { CommandPaletteProvider } from '@/components/command-palette'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PceProvider>
      <TooltipProvider>
        <CommandPaletteProvider>
          <SidebarProvider className="h-svh">
            <AppSidebar />
            <SidebarInset className="flex flex-col overflow-hidden">
              <main id="main-content" tabIndex={-1} className="flex flex-col flex-1 overflow-hidden outline-none">
                {children}
              </main>
            </SidebarInset>
          </SidebarProvider>
        </CommandPaletteProvider>
      </TooltipProvider>
    </PceProvider>
  )
}
