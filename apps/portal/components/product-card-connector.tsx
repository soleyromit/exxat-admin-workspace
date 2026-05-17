'use client'

import Link from 'next/link'
import { Button, Badge } from '@exxat/ds/packages/ui/src'
import type { Product } from '@/lib/products'

function StatusDot({ status }: { status: Product['subscriptionStatus'] }) {
  if (status === 'active') {
    return (
      <span
        className="inline-block h-2 w-2 rounded-full shrink-0"
        style={{ backgroundColor: 'var(--brand-color)' }}
        aria-hidden="true"
      />
    )
  }
  if (status === 'trial') {
    return (
      <span
        className="inline-block h-2 w-2 rounded-full shrink-0"
        style={{ backgroundColor: 'oklch(0.75 0.15 85)' }}
        aria-hidden="true"
      />
    )
  }
  return (
    <span
      className="inline-block h-2 w-2 rounded-full shrink-0"
      style={{ backgroundColor: 'var(--muted-foreground)', opacity: 0.45 }}
      aria-hidden="true"
    />
  )
}

export function ProductConnectorRow({ product }: { product: Product }) {
  const isNotSubscribed = product.subscriptionStatus === 'not-subscribed' && !product.comingSoon
  const isTrial = product.subscriptionStatus === 'trial'

  const expressInterestHref = `mailto:sales@exxat.com?subject=${encodeURIComponent(`Interest in ${product.name}`)}&body=${encodeURIComponent(`Hi, I'd like to learn more about ${product.name} for our program.`)}`

  return (
    <div className="flex items-center gap-4 px-4 py-3.5 group">
      {/* Status dot + icon */}
      <div className="flex items-center gap-2 shrink-0">
        <StatusDot status={product.subscriptionStatus} />
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: `linear-gradient(135deg, var(--product-${product.colorKey}-from), var(--product-${product.colorKey}-to))`,
            opacity: product.comingSoon || product.subscriptionStatus === 'not-subscribed' ? 0.45 : 1,
          }}
        >
          <i
            className={`fa-light ${product.icon} text-sm`}
            aria-hidden="true"
            style={{ color: `var(--product-${product.colorKey}-icon)` }}
          />
        </div>
      </div>

      {/* Name + description — clickable to detail */}
      <Link
        href={`/product/${product.id}`}
        className="flex-1 min-w-0 flex flex-col gap-0.5"
      >
        <span className="text-sm font-semibold leading-tight group-hover:underline underline-offset-2">
          {product.name}
        </span>
        <span className="text-xs text-muted-foreground truncate">{product.description}</span>
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-2 shrink-0">
        {product.comingSoon ? (
          <Badge variant="secondary" className="rounded text-xs">Coming Soon</Badge>
        ) : isNotSubscribed ? (
          <>
            <span className="text-xs text-muted-foreground hidden sm:block">v{product.version}</span>
            <Button asChild variant="outline" size="sm">
              <a href={expressInterestHref} onClick={(e) => e.stopPropagation()}>
                Express Interest
                <i className="fa-light fa-envelope" aria-hidden="true" />
              </a>
            </Button>
          </>
        ) : (
          <>
            <span className="text-xs text-muted-foreground hidden sm:block">v{product.version}</span>
            {isTrial && (
              <Badge
                variant="outline"
                className="rounded text-xs"
                style={{ color: 'oklch(0.55 0.15 75)', borderColor: 'oklch(0.75 0.15 85)', backgroundColor: 'oklch(0.97 0.04 85)' }}
              >
                Trial
              </Badge>
            )}
            <Button asChild variant="outline" size="sm">
              <a href={product.adminUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                Open Admin
                <i className="fa-light fa-arrow-up-right" aria-hidden="true" />
              </a>
            </Button>
          </>
        )}
        <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" />
      </div>
    </div>
  )
}
