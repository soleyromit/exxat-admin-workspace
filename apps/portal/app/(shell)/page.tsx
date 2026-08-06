'use client'

import {
  Card,
  Button,
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { NotificationsPopover } from '@/components/notifications-popover'
import { ProductConnectorRow, ExploreExxatRow } from '@/components/product-card-connector'
import { PRODUCTS, SALES_EMAIL } from '@/lib/products'

export default function WorkspacePage() {
  const yourProducts = PRODUCTS.filter((p) => !p.comingSoon)
  const exploreProducts = PRODUCTS.filter((p) => p.comingSoon)

  return (
    <>
      <SiteHeader title="Workspace" trailing={<NotificationsPopover />} />
      <main className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="flex flex-col gap-1 pt-2">
            <h1 className="font-heading text-2xl font-semibold">Workspace</h1>
            <p className="text-sm text-muted-foreground">
              Your Exxat products, and what to explore next.
            </p>
          </div>

          {yourProducts.length === 0 && exploreProducts.length === 0 && (
            <section className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-muted/25 px-6 py-10 text-center">
              <i className="fa-light fa-grid-2 text-3xl text-muted-foreground" aria-hidden="true" />
              <h2 className="text-sm font-medium">No products yet</h2>
              <p className="text-xs text-muted-foreground">
                Your workspace has no Exxat products set up. Our team can help you get started.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-1">
                <a href={`mailto:${SALES_EMAIL}?subject=${encodeURIComponent('Getting started with Exxat')}`}>
                  Talk to sales
                </a>
              </Button>
            </section>
          )}

          {(yourProducts.length > 0 || exploreProducts.length > 0) && (
          <section aria-labelledby="your-products-heading" className="flex flex-col gap-3">
            <h2 id="your-products-heading" className="text-sm font-semibold text-foreground">
              Your products
            </h2>
            {yourProducts.length > 0 ? (
              <Card className="divide-y divide-border overflow-hidden">
                {yourProducts.map((product) => (
                  <ProductConnectorRow key={product.id} product={product} />
                ))}
              </Card>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-muted/25 px-5 py-6 text-center">
                <p className="text-sm text-muted-foreground">
                  You're not subscribed to any products yet — explore what Exxat offers below.
                </p>
              </div>
            )}
          </section>
          )}

          {exploreProducts.length > 0 ? (
            <section aria-labelledby="explore-heading" className="flex flex-col gap-3">
              <h2 id="explore-heading" className="text-sm font-semibold text-foreground">
                Explore Exxat
              </h2>
              <Card className="divide-y divide-border overflow-hidden">
                {exploreProducts.map((product) => (
                  <ExploreExxatRow key={product.id} product={product} />
                ))}
              </Card>
            </section>
          ) : (
            yourProducts.length > 0 && (
              <p className="text-xs text-muted-foreground">
                You're using every Exxat product. New products will appear here as they're announced.
              </p>
            )
          )}
        </div>
      </main>
    </>
  )
}
