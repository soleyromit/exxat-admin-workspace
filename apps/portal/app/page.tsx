'use client'

import { SidebarProvider, SidebarInset, TooltipProvider } from '@exxat/ds/packages/ui/src'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { ProductConnectorRow } from '@/components/product-card-connector'
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
            <Card className="max-w-3xl overflow-hidden divide-y divide-border">
              {PRODUCTS.map((product) => (
                <ProductConnectorRow key={product.id} product={product} />
              ))}
            </Card>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
