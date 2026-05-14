'use client'

import {
  Card,
  CardContent,
  Button,
  Badge,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@exxat/ds/packages/ui/src'
import type { Product } from '@/lib/products'

export function ProductCardRow({ product }: { product: Product }) {
  if (product.comingSoon) {
    return (
      <Card className="overflow-hidden">
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
          style={{ backgroundColor: `var(--product-${product.colorKey}-to)`, opacity: 0.4 }}
        />
        <CardContent className="flex items-center gap-4 py-4 pl-6 pr-4">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg opacity-40"
            style={{ backgroundColor: `var(--product-${product.colorKey}-from)` }}
          >
            <i
              className={`fa-light ${product.icon} text-base`}
              aria-hidden="true"
              style={{ color: `var(--product-${product.colorKey}-icon)` }}
            />
          </div>
          <span className="flex-1 text-sm font-medium text-muted-foreground">{product.name}</span>
          <Badge variant="secondary" className="rounded text-xs">Coming Soon</Badge>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden relative">
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ backgroundColor: `var(--product-${product.colorKey}-to)` }}
      />
      <CardContent className="flex items-center gap-4 py-3 pl-6 pr-3">
        {/* Icon */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `var(--product-${product.colorKey}-from)` }}
        >
          <i
            className={`fa-light ${product.icon} text-base`}
            aria-hidden="true"
            style={{ color: `var(--product-${product.colorKey}-icon)` }}
          />
        </div>

        {/* Name */}
        <span className="flex-1 text-sm font-semibold">{product.name}</span>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Button asChild variant="outline" size="sm">
            <a href={product.adminUrl} target="_blank" rel="noreferrer">
              Open Admin
              <i className="fa-light fa-arrow-up-right" aria-hidden="true" />
            </a>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="More surfaces">
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
      </CardContent>
    </Card>
  )
}
