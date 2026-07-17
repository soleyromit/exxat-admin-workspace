'use client'

import Link from 'next/link'
import {
  Card,
  CardContent,
  Button,
  StatusBadge,
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { NotificationsPopover } from '@/components/notifications-popover'
import { ProductConnectorRow } from '@/components/product-card-connector'
import { PRODUCTS, SALES_EMAIL, type Product } from '@/lib/products'
import { ILLUSTRATIONS } from '@/lib/illustrations'

function interestHref(product: Product) {
  return `mailto:${SALES_EMAIL}?subject=${encodeURIComponent(`Interest in ${product.name}`)}&body=${encodeURIComponent(`Hi, I'd like to learn more about ${product.name} for our program.`)}`
}

function launchLabel(product: Product) {
  return product.comingSoon && product.expectedLaunch
    ? `Coming ${product.expectedLaunch}`
    : 'Coming soon'
}

/** Wide feature card for the nearest-launch Explore product — breaks the grid so the section has a lead story. */
function SpotlightCard({ product }: { product: Product }) {
  const Illustration = ILLUSTRATIONS[product.colorKey]

  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-md sm:col-span-2">
      <div className="flex flex-col sm:flex-row">
        <CardContent className="flex min-w-0 flex-1 flex-col gap-3 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/product/${product.id}`}
              className="min-w-0 rounded-sm before:absolute before:inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="text-lg font-semibold leading-snug group-hover:underline underline-offset-4">
                {product.name}
              </span>
            </Link>
            <StatusBadge label={launchLabel(product)} tone="neutral" />
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>
          <ul className="flex flex-col gap-1.5">
            {product.features.slice(0, 3).map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <i className="fa-light fa-circle-check text-xs mt-1 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="text-sm leading-snug">{feature}</span>
              </li>
            ))}
          </ul>
          <div className="relative z-10 mt-auto flex items-center gap-2 pt-1">
            <Button asChild variant="default" size="sm">
              <Link href={`/product/${product.id}`}>Learn more</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <a href={interestHref(product)} aria-label={`Express interest in ${product.name}`}>
                Express interest
              </a>
            </Button>
          </div>
        </CardContent>
        <div
          className="relative h-32 shrink-0 overflow-hidden sm:h-auto sm:w-64"
          style={{
            background: `linear-gradient(135deg, var(--product-${product.colorKey}-from), var(--product-${product.colorKey}-to))`,
            color: `var(--product-${product.colorKey}-icon)`,
          }}
        >
          {Illustration && (
            <div className="absolute left-1/2 top-1/2 w-56 -translate-x-1/2 -translate-y-1/2">
              <Illustration />
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

function ExploreCard({ product }: { product: Product }) {
  const Illustration = ILLUSTRATIONS[product.colorKey]

  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
      <div
        className="relative flex h-28 items-center justify-center overflow-hidden"
        style={{
          background: `linear-gradient(135deg, var(--product-${product.colorKey}-from), var(--product-${product.colorKey}-to))`,
          color: `var(--product-${product.colorKey}-icon)`,
        }}
      >
        {Illustration ? (
          <div className="absolute left-1/2 top-4 w-52 -translate-x-1/2">
            <Illustration />
          </div>
        ) : (
          <div
            className="flex h-14 w-14 items-center justify-center rounded-xl"
            style={{ backgroundColor: 'var(--product-icon-backdrop)' }}
          >
            <i
              className={`fa-solid ${product.icon} text-2xl`}
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
            <span className="text-sm font-semibold leading-snug group-hover:underline underline-offset-4">
              {product.name}
            </span>
          </Link>
          <StatusBadge label={launchLabel(product)} tone="neutral" />
        </div>
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {product.description}
        </p>
        <div className="relative z-10 mt-1 flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/product/${product.id}`}>Learn more</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <a href={interestHref(product)} aria-label={`Express interest in ${product.name}`}>
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
  const [spotlight, ...explore] = PRODUCTS.filter((p) => p.comingSoon)

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

          {yourProducts.length === 0 && !spotlight && (
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

          {(yourProducts.length > 0 || spotlight) && (
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

          {spotlight ? (
            <section aria-labelledby="explore-heading" className="flex flex-col gap-3">
              <h2 id="explore-heading" className="text-sm font-semibold text-foreground">
                Explore Exxat
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <SpotlightCard product={spotlight} />
                {explore.map((product) => (
                  <ExploreCard key={product.id} product={product} />
                ))}
              </div>
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
