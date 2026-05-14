'use client'

import { useState } from 'react'
import { SidebarProvider, SidebarInset, TooltipProvider, ViewSegmentedControl } from '@exxat/ds/packages/ui/src'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { ProductCard } from '@/components/product-card'
import { ProductCardDark } from '@/components/product-card-dark'
import { ProductCardRow } from '@/components/product-card-row'
import { PRODUCTS } from '@/lib/products'

type Layout = 'gradient' | 'bento' | 'dark' | 'rows'

export default function WorkspacePage() {
  const [layout, setLayout] = useState<Layout>('gradient')

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <main className="flex-1 overflow-auto p-6">

            {/* Layout toggle */}
            <div className="mb-6 flex items-center gap-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Style</span>
              <ViewSegmentedControl
                value={layout}
                onValueChange={(v) => setLayout(v as Layout)}
                aria-label="Card layout"
                options={[
                  { value: 'gradient', label: 'Gradient', icon: 'fa-light fa-grid-2' },
                  { value: 'bento',    label: 'Bento',    icon: 'fa-light fa-table-cells-large' },
                  { value: 'dark',     label: 'Dark',     icon: 'fa-light fa-circle-half-stroke' },
                  { value: 'rows',     label: 'Rows',     icon: 'fa-light fa-list' },
                ] as const}
              />
            </div>

            {/* Gradient grid */}
            {layout === 'gradient' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl">
                {PRODUCTS.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Bento grid — first product spans 2 cols */}
            {layout === 'bento' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-5xl">
                {PRODUCTS.map((product, i) => (
                  <div key={product.id} className={i === 0 ? 'sm:col-span-2' : ''}>
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            )}

            {/* Dark elevated tiles */}
            {layout === 'dark' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl">
                {PRODUCTS.map((product) => (
                  <ProductCardDark key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Compact rows */}
            {layout === 'rows' && (
              <div className="flex flex-col gap-2 max-w-3xl">
                {PRODUCTS.map((product) => (
                  <ProductCardRow key={product.id} product={product} />
                ))}
              </div>
            )}

          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
