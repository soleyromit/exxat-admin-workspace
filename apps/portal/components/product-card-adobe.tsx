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
} from '@exxatdesignux/ui'
import type { Product } from '@/lib/products'

export function ProductCardAdobe({ product }: { product: Product }) {
  if (product.comingSoon) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl opacity-40"
              style={{
                background: `linear-gradient(135deg, var(--product-${product.colorKey}-from), var(--product-${product.colorKey}-to))`,
              }}
            >
              <i className={`fa-light ${product.icon} text-base`} aria-hidden="true"
                style={{ color: `var(--product-${product.colorKey}-icon)` }} />
            </div>
            <Badge variant="secondary" className="rounded text-xs mt-0.5">Coming Soon</Badge>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-muted-foreground">{product.name}</span>
            <p className="text-xs text-muted-foreground leading-relaxed">{product.description}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        {/* Icon + overflow menu on same row */}
        <div className="flex items-start justify-between gap-2">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{
              background: `linear-gradient(135deg, var(--product-${product.colorKey}-from), var(--product-${product.colorKey}-to))`,
            }}
          >
            <i className={`fa-light ${product.icon} text-base`} aria-hidden="true"
              style={{ color: `var(--product-${product.colorKey}-icon)` }} />
          </div>
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

        {/* Name + description */}
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold">{product.name}</span>
          <p className="text-xs text-muted-foreground leading-relaxed">{product.description}</p>
        </div>

        {/* CTA — full width, no separator above */}
        <Button asChild variant="outline" size="sm" className="w-full mt-1">
          <a href={product.adminUrl} target="_blank" rel="noreferrer">
            Open Admin
            <i className="fa-light fa-arrow-up-right" aria-hidden="true" />
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}
