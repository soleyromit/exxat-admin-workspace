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
import { ILLUSTRATIONS } from '@/lib/illustrations'
import type { Product } from '@/lib/products'

function IllustrationArea({ colorKey, tall = false }: { colorKey: string; tall?: boolean }) {
  const Illustration = ILLUSTRATIONS[colorKey]
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${tall ? 'h-48' : 'h-36'}`}
      style={{
        background: `linear-gradient(135deg, var(--product-${colorKey}-from), var(--product-${colorKey}-to))`,
        color: `var(--product-${colorKey}-icon)`,
      }}
    >
      {Illustration && <Illustration />}
    </div>
  )
}

export function ProductCardIllustrated({ product, tall }: { product: Product; tall?: boolean }) {
  if (product.comingSoon) {
    return (
      <Card className="overflow-hidden">
        <div className="opacity-40">
          <IllustrationArea colorKey={product.colorKey} tall={tall} />
        </div>
        <CardContent className="flex flex-col gap-2 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-muted-foreground">{product.name}</span>
            <Badge variant="secondary" className="rounded text-xs">Coming Soon</Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{product.description}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <IllustrationArea colorKey={product.colorKey} tall={tall} />
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold">{product.name}</span>
            <p className="text-xs text-muted-foreground leading-relaxed">{product.description}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="shrink-0" aria-label="More surfaces">
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
        <Button asChild variant="outline" size="sm" className="w-full">
          <a href={product.adminUrl} target="_blank" rel="noreferrer">
            Open Admin
            <i className="fa-light fa-arrow-up-right" aria-hidden="true" />
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}
