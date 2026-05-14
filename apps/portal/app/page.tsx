'use client'

import { useState } from 'react'
import { SidebarProvider, SidebarInset, TooltipProvider, ViewSegmentedControl } from '@exxat/ds/packages/ui/src'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { ProductCard } from '@/components/product-card'
import { ProductCardDark } from '@/components/product-card-dark'
import { ProductCardRow } from '@/components/product-card-row'
import { ProductCardAdobe } from '@/components/product-card-adobe'
import { ProductCardEditorial } from '@/components/product-card-editorial'
import { ProductCardIllustrated } from '@/components/product-card-illustrated'
import { ProductConnectorRow } from '@/components/product-card-connector'
import { PRODUCTS } from '@/lib/products'
import { Card } from '@exxat/ds/packages/ui/src'

type Layout = 'connector' | 'illustrated' | 'bento' | 'adobe' | 'editorial' | 'rows' | 'gradient' | 'dark'

export default function WorkspacePage() {
  const [layout, setLayout] = useState<Layout>('connector')

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
                  { value: 'connector',   label: 'Connector',   icon: 'fa-light fa-plug' },
                  { value: 'illustrated', label: 'Illustrated', icon: 'fa-light fa-image' },
                  { value: 'bento',       label: 'Bento',       icon: 'fa-light fa-table-cells-large' },
                  { value: 'adobe',       label: 'Adobe',       icon: 'fa-light fa-grid-2' },
                  { value: 'editorial',   label: 'Editorial',   icon: 'fa-light fa-newspaper' },
                  { value: 'rows',        label: 'Rows',        icon: 'fa-light fa-list' },
                  { value: 'gradient',    label: 'Gradient',    icon: 'fa-light fa-swatchbook' },
                  { value: 'dark',        label: 'Dark',        icon: 'fa-light fa-circle-half-stroke' },
                ] as const}
              />
            </div>

            {/* Connector list */}
            {layout === 'connector' && (
              <Card className="max-w-3xl overflow-hidden divide-y divide-border">
                {PRODUCTS.map((product) => (
                  <ProductConnectorRow key={product.id} product={product} />
                ))}
              </Card>
            )}

            {/* Illustrated — uniform 3-col grid */}
            {layout === 'illustrated' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl">
                {PRODUCTS.map((product) => (
                  <ProductCardIllustrated key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Bento — hero tile spans 2 cols + tall illustration */}
            {layout === 'bento' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-5xl">
                {PRODUCTS.map((product, i) => (
                  <div key={product.id} className={i === 0 ? 'sm:col-span-2' : ''}>
                    <ProductCardIllustrated product={product} tall={i === 0} />
                  </div>
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

            {layout === 'editorial' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl">
                {PRODUCTS.map((product) => (
                  <ProductCardEditorial key={product.id} product={product} />
                ))}
              </div>
            )}

            {layout === 'rows' && (
              <div className="flex flex-col gap-2 max-w-3xl">
                {PRODUCTS.map((product) => (
                  <ProductCardRow key={product.id} product={product} />
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
