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

export function ProductCardEditorial({ product }: { product: Product }) {
  if (product.comingSoon) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-4 p-5 opacity-50">
          <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                style={{
                  background: `linear-gradient(135deg, var(--product-${product.colorKey}-from), var(--product-${product.colorKey}-to))`,
                }}
              >
                <i className={`fa-light ${product.icon} text-xs`} aria-hidden="true"
                  style={{ color: `var(--product-${product.colorKey}-icon)` }} />
              </div>
              <span className="text-sm font-semibold text-muted-foreground">{product.name}</span>
            </div>
            <Badge variant="secondary" className="rounded text-xs">Coming Soon</Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5">
        {/* Description is the hero — leads the card */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-foreground leading-relaxed">{product.description}</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="shrink-0 -mt-0.5 -mr-1.5" aria-label="More surfaces">
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

        {/* Footer row: icon + name left, Open Admin link right */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
              style={{
                background: `linear-gradient(135deg, var(--product-${product.colorKey}-from), var(--product-${product.colorKey}-to))`,
              }}
            >
              <i className={`fa-light ${product.icon} text-xs`} aria-hidden="true"
                style={{ color: `var(--product-${product.colorKey}-icon)` }} />
            </div>
            <span className="text-sm font-semibold">{product.name}</span>
          </div>

          <Button asChild variant="ghost" size="sm" className="gap-1 text-xs font-medium -mr-1.5">
            <a href={product.adminUrl} target="_blank" rel="noreferrer">
              Open Admin
              <i className="fa-light fa-arrow-up-right" aria-hidden="true" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
