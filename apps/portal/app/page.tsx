'use client'

import { SidebarProvider, SidebarInset } from '@exxat/ds/packages/ui/src'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { ProductCard } from '@/components/product-card'
import { PRODUCTS } from '@/lib/products'

export default function WorkspacePage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <main className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
            {PRODUCTS.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
