'use client'

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@exxat/ds/packages/ui/src'
import type { Product } from '@/lib/products'

function ProductHeader({ colorKey, icon, muted }: { colorKey: string; icon: string; muted?: boolean }) {
  return (
    <div
      className={`flex h-28 items-center justify-center transition-opacity ${muted ? 'opacity-50' : ''}`}
      style={{
        background: `linear-gradient(135deg, var(--product-${colorKey}-from), var(--product-${colorKey}-to))`,
      }}
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ backgroundColor: 'color-mix(in oklch, var(--background) 25%, transparent)' }}
      >
        <i
          className={`fa-light ${icon} text-2xl`}
          aria-hidden="true"
          style={{ color: `var(--product-${colorKey}-icon)` }}
        />
      </div>
    </div>
  )
}

export function ProductCard({ product }: { product: Product }) {
  if (product.comingSoon) {
    return (
      <Card className="overflow-hidden">
        <ProductHeader colorKey={product.colorKey} icon={product.icon} muted />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pt-4 pb-4">
          <CardTitle className="text-base text-muted-foreground">{product.name}</CardTitle>
          <Badge variant="secondary" className="rounded text-xs">Coming Soon</Badge>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <ProductHeader colorKey={product.colorKey} icon={product.icon} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pt-4 pb-2">
        <CardTitle className="text-base font-semibold">{product.name}</CardTitle>
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
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        <Button asChild variant="default" className="w-full">
          <a href={product.adminUrl} target="_blank" rel="noreferrer">
            Open Admin
            <i className="fa-light fa-arrow-up-right" aria-hidden="true" />
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}
