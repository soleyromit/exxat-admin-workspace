'use client'

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
  Button,
  Badge,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@exxat/ds/packages/ui/src'
import type { Product } from '@/lib/products'

export function ProductCardAdobe({ product }: { product: Product }) {
  if (product.comingSoon) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-start gap-3 space-y-0">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{
              background: `linear-gradient(135deg, var(--product-${product.colorKey}-from), var(--product-${product.colorKey}-to))`,
              opacity: 0.5,
            }}
          >
            <i
              className={`fa-light ${product.icon} text-base`}
              aria-hidden="true"
              style={{ color: `var(--product-${product.colorKey}-icon)` }}
            />
          </div>
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <CardTitle className="text-sm text-muted-foreground">{product.name}</CardTitle>
            <CardDescription className="text-xs leading-relaxed">{product.description}</CardDescription>
          </div>
        </CardHeader>
        <CardFooter className="pt-0 justify-end">
          <Badge variant="secondary" className="rounded text-xs">Coming Soon</Badge>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: `linear-gradient(135deg, var(--product-${product.colorKey}-from), var(--product-${product.colorKey}-to))`,
          }}
        >
          <i
            className={`fa-light ${product.icon} text-base`}
            aria-hidden="true"
            style={{ color: `var(--product-${product.colorKey}-icon)` }}
          />
        </div>
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <CardTitle className="text-sm font-semibold">{product.name}</CardTitle>
          <CardDescription className="text-xs leading-relaxed">{product.description}</CardDescription>
        </div>
      </CardHeader>

      <CardFooter className="pt-0 justify-between items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="More surfaces">
              <i className="fa-light fa-ellipsis-vertical" aria-hidden="true" style={{ fontSize: 13 }} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
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

        <Button asChild variant="outline" size="sm">
          <a href={product.adminUrl} target="_blank" rel="noreferrer">
            Open Admin
            <i className="fa-light fa-arrow-up-right" aria-hidden="true" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  )
}
