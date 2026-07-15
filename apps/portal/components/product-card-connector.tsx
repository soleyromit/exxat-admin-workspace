'use client'

import Link from 'next/link'
import { Button } from '@exxatdesignux/ui'
import type { Product } from '@/lib/products'

const STATUS_META: Record<Product['subscriptionStatus'], { label: string; color: string }> = {
  active: { label: 'Active', color: 'var(--brand-color)' },
  trial: { label: 'Trial', color: 'var(--portal-amber-border)' },
  'not-subscribed': { label: '', color: 'var(--muted-foreground)' },
}

export function ProductConnectorRow({ product }: { product: Product }) {
  const dimmed = product.comingSoon || product.subscriptionStatus === 'not-subscribed'
  const isNotSubscribed = product.subscriptionStatus === 'not-subscribed' && !product.comingSoon
  const status = STATUS_META[product.subscriptionStatus]

  const expressInterestHref = `mailto:sales@exxat.com?subject=${encodeURIComponent(`Interest in ${product.name}`)}&body=${encodeURIComponent(`Hi, I'd like to learn more about ${product.name} for our program.`)}`

  return (
    <div className="group relative flex items-center gap-4 px-5 py-4 transition-colors hover:bg-accent">
      {/* Product mark — per-product identity */}
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        style={{
          background: `linear-gradient(135deg, var(--product-${product.colorKey}-from), var(--product-${product.colorKey}-to))`,
          opacity: dimmed ? 0.5 : 1,
        }}
      >
        <i
          className={`fa-light ${product.icon} text-base`}
          aria-hidden="true"
          style={{ color: `var(--product-${product.colorKey}-icon)` }}
        />
      </div>

      {/* Name + description — stretched link makes the whole row open the detail page */}
      <div className="min-w-0 flex-1">
        <Link
          href={`/product/${product.id}`}
          className="flex flex-col gap-0.5 rounded-sm before:absolute before:inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="text-base font-medium leading-tight text-foreground">{product.name}</span>
          <span className="text-sm text-muted-foreground truncate">{product.description}</span>
        </Link>
      </div>

      {/* Right cluster — sits above the stretched link */}
      <div className="relative z-10 flex items-center gap-3 shrink-0">
        {product.comingSoon ? (
          <span className="text-xs text-muted-foreground">Coming soon</span>
        ) : (
          <>
            <span className="hidden items-center gap-1.5 sm:flex">
              {status.label && (
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: status.color }}
                  aria-hidden="true"
                />
              )}
              <span className="text-xs text-muted-foreground tabular-nums">
                {status.label ? `${status.label} · ` : ''}v{product.version}
              </span>
            </span>
            <Button asChild variant="outline" size="sm">
              {isNotSubscribed ? (
                <a href={expressInterestHref} aria-label={`Express interest in ${product.name}`}>
                  Express interest
                  <i className="fa-light fa-arrow-up-right" aria-hidden="true" />
                </a>
              ) : (
                <a
                  href={product.adminUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open ${product.name} admin`}
                >
                  Open
                  <i className="fa-light fa-arrow-up-right" aria-hidden="true" />
                </a>
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
