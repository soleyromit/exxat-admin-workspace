'use client'

import { useState } from 'react'
import { SidebarProvider, SidebarInset, TooltipProvider, ViewSegmentedControl } from '@exxat/ds/packages/ui/src'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { ProductCard } from '@/components/product-card'
import { ProductCardDark } from '@/components/product-card-dark'
import { ProductCardRow } from '@/components/product-card-row'
import { ProductCardAdobe } from '@/components/product-card-adobe'
import { PRODUCTS } from '@/lib/products'

type Layout = 'gradient' | 'dark' | 'rows' | 'adobe'

export default function WorkspacePage() {
  const [layout, setLayout] = useState<Layout>('rows')

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <main className="flex-1 overflow-auto p-6">

            <div className="mb-6 flex items-center gap-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Style</span>
              <ViewSegmentedControl
                value={layout}
                onValueChange={(v) => setLayout(v as Layout)}
                aria-label="Card layout"
                options={[
                  { value: 'rows',     label: 'Rows',     icon: 'fa-light fa-list' },
                  { value: 'adobe',    label: 'Adobe',    icon: 'fa-light fa-grid-2' },
                  { value: 'gradient', label: 'Gradient', icon: 'fa-light fa-table-cells-large' },
                  { value: 'dark',     label: 'Dark',     icon: 'fa-light fa-circle-half-stroke' },
                ] as const}
              />
            </div>

            {layout === 'rows' && (
              <div className="flex flex-col gap-2 max-w-3xl">
                {PRODUCTS.map((product) => (
                  <ProductCardRow key={product.id} product={product} />
                ))}
              </div>
            )}

            {layout === 'adobe' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl">
                {PRODUCTS.map((product) => (
                  <ProductCardAdobe key={product.id} product={product} />
                ))}
              </div>
            )}

            {layout === 'gradient' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl">
                {PRODUCTS.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {layout === 'dark' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl">
                {PRODUCTS.map((product) => (
                  <ProductCardDark key={product.id} product={product} />
                ))}
              </div>
            )}

          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
