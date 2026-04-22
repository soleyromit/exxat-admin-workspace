'use client'

import { SidebarProvider, SidebarInset, TooltipProvider } from '@exxat/ds/packages/ui/src'
import { AppSidebar } from '@/components/app-sidebar'
import { PceProvider } from '@/components/pce/pce-state'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PceProvider>
      <TooltipProvider>
        <SidebarProvider className="h-svh">
          <AppSidebar />
          <SidebarInset className="flex flex-col overflow-hidden">
            {children}
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </PceProvider>
  )
}
