'use client'

import { SidebarProvider, SidebarInset, TooltipProvider } from '@exxatdesignux/ui'
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
            {/* SidebarInset renders as <main> natively — do NOT add another <main> inside */}
            <SidebarInset className="flex flex-col overflow-hidden">
              {children}
            </SidebarInset>
          </SidebarProvider>
        </CommandPaletteProvider>
      </TooltipProvider>
    </PceProvider>
  )
}
