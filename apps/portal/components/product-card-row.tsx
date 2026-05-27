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

export function ProductCardRow({ product }: { product: Product }) {
  if (product.comingSoon) {
    return (
      <Card>
        <CardContent className="flex items-center gap-4 py-3 px-4">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg opacity-40"
            style={{
              background: `linear-gradient(135deg, var(--product-${product.colorKey}-from), var(--product-${product.colorKey}-to))`,
            }}
          >
            <i
              className={`fa-light ${product.icon} text-sm`}
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
    <Card>
      <CardContent className="flex items-center gap-4 py-3 px-4">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{
            background: `linear-gradient(135deg, var(--product-${product.colorKey}-from), var(--product-${product.colorKey}-to))`,
          }}
        >
          <i
            className={`fa-light ${product.icon} text-sm`}
            aria-hidden="true"
            style={{ color: `var(--product-${product.colorKey}-icon)` }}
          />
        </div>

        <span className="flex-1 text-sm font-semibold">{product.name}</span>

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
