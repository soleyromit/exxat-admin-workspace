'use client'

import {
  Button,
  Badge,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@exxat/ds/packages/ui/src'
import type { Product } from '@/lib/products'

export function ProductCardDark({ product }: { product: Product }) {
  const isDark = true

  if (product.comingSoon) {
    return (
      <div
        className="rounded-xl overflow-hidden flex flex-col opacity-50"
        style={{ backgroundColor: 'var(--foreground)' }}
      >
        <div
          className="h-24 flex items-center justify-center"
          style={{ backgroundColor: 'color-mix(in oklch, var(--foreground) 85%, transparent)' }}
        >
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ backgroundColor: `color-mix(in oklch, var(--product-${product.colorKey}-from) 30%, transparent)` }}
          >
            <i
              className={`fa-light ${product.icon} text-xl`}
              aria-hidden="true"
              style={{ color: `var(--product-${product.colorKey}-from)` }}
            />
          </div>
        </div>
        <div className="px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-semibold" style={{ color: 'var(--background)' }}>
            {product.name}
          </span>
          <Badge variant="secondary" className="rounded text-xs opacity-60">Coming Soon</Badge>
        </div>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col"
      style={{ backgroundColor: 'var(--foreground)' }}
    >
      {/* Icon area */}
      <div
        className="h-24 flex items-center justify-center"
        style={{ backgroundColor: 'color-mix(in oklch, var(--foreground) 85%, transparent)' }}
      >
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl"
          style={{ backgroundColor: `color-mix(in oklch, var(--product-${product.colorKey}-from) 25%, transparent)` }}
        >
          <i
            className={`fa-light ${product.icon} text-xl`}
            aria-hidden="true"
            style={{ color: `var(--product-${product.colorKey}-from)` }}
          />
        </div>
      </div>

      {/* Name + dropdown */}
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <span className="text-sm font-semibold" style={{ color: 'var(--background)' }}>
          {product.name}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="More surfaces"
              style={{ color: 'color-mix(in oklch, var(--background) 60%, transparent)' }}
            >
              <i className="fa-light fa-ellipsis-vertical" aria-hidden="true" style={{ fontSize: 13 }} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <a href={product.studentUrl} target="_blank" rel="noreferrer">
                <i className="fa-light fa-user" aria-hidden="true" />
                Student
              </a>
            </DropdownMenuItem>
            {product.extra && (
              <DropdownMenuItem asChild>
                <a href={product.extra.url} target="_blank" rel="noreferrer">
                  <i className="fa-light fa-file-pen" aria-hidden="true" />
                  {product.extra.label}
                </a>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Button */}
      <div className="px-4 pb-4">
        <Button asChild variant="outline" className="w-full" style={{ borderColor: 'color-mix(in oklch, var(--background) 20%, transparent)', color: 'var(--background)' }}>
          <a href={product.adminUrl} target="_blank" rel="noreferrer">
            Open Admin
            <i className="fa-light fa-arrow-up-right" aria-hidden="true" />
          </a>
        </Button>
      </div>
    </div>
  )
}
