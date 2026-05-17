'use client'

import { SidebarProvider, SidebarInset, TooltipProvider } from '@exxat/ds/packages/ui/src'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { ProductConnectorRow } from '@/components/product-card-connector'
import { StatsBar } from '@/components/stats-bar'
import { LeoDrawer } from '@/components/leo-drawer'
import { PRODUCTS } from '@/lib/products'
import { Card } from '@exxat/ds/packages/ui/src'

export default function WorkspacePage() {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-3xl space-y-4">
              <StatsBar />
              <Card className="overflow-hidden divide-y divide-border">
                {PRODUCTS.map((product) => (
                  <ProductConnectorRow key={product.id} product={product} />
                ))}
              </Card>
            </div>
          </main>
          <LeoDrawer />
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
