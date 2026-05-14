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

export function ProductCard({ product }: { product: Product }) {
  if (product.comingSoon) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{product.name}</CardTitle>
          <Badge variant="secondary" className="rounded">
            Coming Soon
          </Badge>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">{product.name}</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="More surfaces">
              <i
                className="fa-light fa-ellipsis-vertical"
                aria-hidden="true"
                style={{ fontSize: 13 }}
              />
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
      <CardContent>
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
