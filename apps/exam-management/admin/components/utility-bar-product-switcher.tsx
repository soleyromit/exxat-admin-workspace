"use client"

/**
 * UtilityBarProductSwitcher — product switcher trigger for the "utility-bar"
 * shell layout variant (`useShellLayout()`). Same product data + dropdown
 * rows as the sidebar's `ProductLogoButton`, but:
 *   - plain `Button` trigger, not `SidebarMenuButton` (no icon-rail/collapsed
 *     concept in a horizontal bar — always renders the full wordmark).
 *   - Round mark uses the same footprint as `ProductLogoButton` icon rail —
 *     **size-8 frame, size-7 mark** (matches school selector visual weight).
 *   - `ExxatProductLogo variant="utility-bar" mark="external"` — full A lockup
 *     wordmark beside the rail mark; no sidebar B1/B2 cascade.
 *   - tooltip + dropdown open downward (`side="bottom"`), matching every
 *     other utility-bar trigger, instead of `side="right"`.
 *
 * See `apps/web/components/sidebar/app-sidebar.tsx` `ProductLogoButton` for
 * the sidebar-variant sibling — keep the two in sync if product-switching
 * behavior changes.
 */

import * as React from "react"

import { ExxatProductLogo, ExxatProductMark, ProductSwitcherMenuRowLabel } from "@/components/exxat-product-logo"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useProduct } from "@/contexts/product-context"
import { useProductSwitch } from "@/contexts/product-route-sync"
import { utilityBarActionButtonClass } from "@/components/utility-bar-chrome"
import { cn } from "@/lib/utils"
import {
  expandSwitcherProducts,
  resolveActiveSwitcherEntry,
  type SwitcherProductEntry,
} from "@/lib/product-switcher-catalog"

export function UtilityBarProductSwitcher() {
  const { product, customProducts, activeCustomIndex, hiddenProducts } = useProduct()
  const switchProduct = useProductSwitch()
  const products = React.useMemo(
    () => expandSwitcherProducts(customProducts, hiddenProducts),
    [customProducts, hiddenProducts],
  )
  const isCurrentProduct = React.useCallback(
    (entry: SwitcherProductEntry) =>
      entry.id === product &&
      (entry.customIndex === undefined || entry.customIndex === activeCustomIndex),
    [activeCustomIndex, product],
  )
  const current = resolveActiveSwitcherEntry(
    products,
    product,
    activeCustomIndex,
    customProducts,
    isCurrentProduct,
  )
  const previewCustomBrand =
    current.customIndex !== undefined ? customProducts[current.customIndex] : undefined

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              aria-label={`Current product: ${current.label}. Switch product`}
              data-utility-bar-product-switcher=""
              className={cn(
                "h-10 w-auto max-w-none items-center gap-0 overflow-visible px-0 py-0",
                utilityBarActionButtonClass,
              )}
            >
              {/* Match ProductLogoButton icon rail + TeamSwitcher avatar footprint. */}
              <span className="flex shrink-0 items-center ps-2">
                <span className="flex size-8 shrink-0 items-center justify-center">
                  <ExxatProductMark
                    product={current.id}
                    previewCustomBrand={previewCustomBrand}
                    className="size-7"
                  />
                </span>
              </span>
              <span className="flex min-w-0 items-center gap-2 ps-2">
                <ExxatProductLogo
                  product={current.id}
                  variant="utility-bar"
                  mark="external"
                  previewCustomBrand={previewCustomBrand}
                />
                <i
                  className="fa-light fa-chevron-down shrink-0 text-sm text-muted-foreground"
                  aria-hidden="true"
                />
              </span>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">{current.label}</TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="start" side="bottom" sideOffset={8}>
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Switch product
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {products.map(p => (
          <DropdownMenuItem
            key={p.customIndex !== undefined ? `${p.id}-${p.customIndex}` : p.id}
            onClick={() => switchProduct(p.id, p.customIndex)}
            className="gap-2 py-2"
            aria-selected={isCurrentProduct(p)}
            aria-label={p.label}
          >
            <ProductSwitcherMenuRowLabel
              product={p.id}
              previewCustomBrand={p.customIndex !== undefined ? customProducts[p.customIndex] : undefined}
            />
            {p.scope && (
              <span className="shrink-0 text-xs font-medium text-muted-foreground" aria-hidden="true">
                — {p.scope}
              </span>
            )}
            {isCurrentProduct(p) && (
              <i className="fa-solid fa-check ms-auto text-brand text-xs" aria-hidden="true" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
