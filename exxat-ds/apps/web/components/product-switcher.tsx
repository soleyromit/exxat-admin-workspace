"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { ExxatProductLogo, ExxatProductMark } from "@/components/exxat-product-logo"
import { useProduct, type Product } from "@/contexts/product-context"

const PRODUCTS: { id: Product; label: string }[] = [
  { id: "exxat-one",   label: "Exxat One"   },
  { id: "exxat-prism", label: "Exxat Prism" },
]

export function ProductSwitcher() {
  const { product, setProduct } = useProduct()
  const { state, isMobile } = useSidebar()

  const current = PRODUCTS.find(p => p.id === product) ?? PRODUCTS[0]
  const iconRail = state === "collapsed" && !isMobile
  const expandedOrMobile = state === "expanded" || isMobile

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className={cn(
                "items-start py-2 text-sidebar-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
                expandedOrMobile &&
                  "h-auto min-h-12 overflow-x-clip overflow-y-visible",
                "group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center",
                iconRail &&
                  "group-data-[collapsible=icon]:!size-9 group-data-[collapsible=icon]:!min-h-9 group-data-[collapsible=icon]:!max-h-9 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:overflow-visible",
              )}
              aria-label={`Current product: ${current.label}. Switch product`}
              suppressHydrationWarning
            >
              {iconRail ? (
                <span className="flex size-8 shrink-0 items-center justify-center">
                  <ExxatProductMark
                    product={current.id}
                    className="size-7 max-h-none"
                  />
                </span>
              ) : (
                <>
                  <span
                    className="mt-0.5 flex min-h-8 min-w-0 flex-1 items-center overflow-x-clip overflow-y-visible"
                    aria-hidden="true"
                  >
                    <ExxatProductLogo
                      product={current.id}
                      className="h-7 w-auto max-w-[min(100%,260px)] object-left object-contain"
                    />
                  </span>
                  <i
                    className="fa-light fa-chevron-down ms-auto mt-1 inline-flex size-6 shrink-0 items-center justify-center text-xs text-muted-foreground"
                    aria-hidden="true"
                  />
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-56"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Switch product
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {PRODUCTS.map(p => (
              <DropdownMenuItem
                key={p.id}
                onClick={() => setProduct(p.id)}
                className="gap-2 py-2"
                aria-current={p.id === product ? "true" : undefined}
              >
                <ExxatProductLogo
                  product={p.id}
                  className="h-7 w-auto shrink-0 max-w-[min(100%,200px)]"
                />
                {p.id === product && (
                  <i
                    className="fa-solid fa-check ml-auto text-brand text-xs"
                    aria-hidden="true"
                  />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
