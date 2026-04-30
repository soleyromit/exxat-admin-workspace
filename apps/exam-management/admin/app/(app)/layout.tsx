import { SidebarProvider, SidebarInset, TooltipProvider } from '@exxat/ds/packages/ui/src'
import { AppSidebar } from '@/components/app-sidebar'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TooltipProvider>
      <SidebarProvider className="h-svh">
        <AppSidebar />
        <SidebarInset className="flex flex-col overflow-x-hidden" style={{ paddingBottom: 0 }}>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
