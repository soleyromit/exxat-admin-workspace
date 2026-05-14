'use client'

import Link from 'next/link'
import { Button, Badge } from '@exxat/ds/packages/ui/src'
import type { Product } from '@/lib/products'

export function ProductConnectorRow({ product }: { product: Product }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5 group">
      {/* Icon */}
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{
          background: `linear-gradient(135deg, var(--product-${product.colorKey}-from), var(--product-${product.colorKey}-to))`,
          opacity: product.comingSoon ? 0.45 : 1,
        }}
      >
        <i
          className={`fa-light ${product.icon} text-sm`}
          aria-hidden="true"
          style={{ color: `var(--product-${product.colorKey}-icon)` }}
        />
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
        ) : (
          <>
            <span className="text-xs text-muted-foreground hidden sm:block">v{product.version}</span>
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
