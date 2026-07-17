'use client'

import Link from 'next/link'
import { Card, CardContent, Button, StatusBadge } from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { NotificationsPopover } from '@/components/notifications-popover'
import { ProductConnectorRow } from '@/components/product-card-connector'
import { PRODUCTS, SALES_EMAIL, type Product } from '@/lib/products'
import { ILLUSTRATIONS } from '@/lib/illustrations'

function ExploreCard({ product }: { product: Product }) {
  const Illustration = ILLUSTRATIONS[product.colorKey]
  const interestHref = `mailto:${SALES_EMAIL}?subject=${encodeURIComponent(`Interest in ${product.name}`)}&body=${encodeURIComponent(`Hi, I'd like to learn more about ${product.name} for our program.`)}`

  return (
    <Card className="group relative overflow-hidden">
      <div
        className="relative flex h-28 items-center justify-center"
        style={{
          background: `linear-gradient(135deg, var(--product-${product.colorKey}-from), var(--product-${product.colorKey}-to))`,
          color: `var(--product-${product.colorKey}-icon)`,
        }}
      >
        {Illustration ? (
          <div className="absolute inset-0"><Illustration /></div>
        ) : (
          <div
            className="flex h-14 w-14 items-center justify-center rounded-xl"
            style={{ backgroundColor: 'var(--product-icon-backdrop)' }}
          >
            <i
              className={`fa-light ${product.icon} text-2xl`}
              aria-hidden="true"
              style={{ color: `var(--product-${product.colorKey}-icon)` }}
            />
          </div>
        )}
      </div>
      <CardContent className="flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/product/${product.id}`}
            className="min-w-0 rounded-sm before:absolute before:inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="text-sm font-semibold leading-snug">{product.name}</span>
          </Link>
          <StatusBadge label="Coming soon" tone="neutral" />
        </div>
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {product.description}
        </p>
        <div className="relative z-10 mt-1">
          <Button asChild variant="outline" size="sm">
            <a href={interestHref} aria-label={`Express interest in ${product.name}`}>
              Express interest
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function WorkspacePage() {
  const yourProducts = PRODUCTS.filter((p) => !p.comingSoon)
  const explore = PRODUCTS.filter((p) => p.comingSoon)

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

          {yourProducts.length > 0 && (
            <section aria-labelledby="your-products-heading" className="flex flex-col gap-3">
              <h2 id="your-products-heading" className="text-sm font-medium text-foreground">
                Your products
              </h2>
              <Card className="divide-y divide-border overflow-hidden">
                {yourProducts.map((product) => (
                  <ProductConnectorRow key={product.id} product={product} />
                ))}
              </Card>
            </section>
          )}

          {explore.length > 0 && (
            <section aria-labelledby="explore-heading" className="flex flex-col gap-3">
              <h2 id="explore-heading" className="text-sm font-medium text-foreground">
                Explore Exxat
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {explore.map((product) => (
                  <ExploreCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  )
}
