'use client'

import { TooltipProvider } from '@/components/ui/tooltip'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'

/**
 * Shared DS OS shell — mounted once for every portal surface (mirrors
 * pce/admin app/(app)/layout.tsx). Pages own only their SiteHeader + content;
 * they must never re-assemble SidebarProvider/AppSidebar/SidebarInset.
 */
export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
