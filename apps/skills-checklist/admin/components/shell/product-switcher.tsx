"use client"

/**
 * Product switcher: the leading trigger of the DS utility bar (same anatomy as apps/pce/admin
 * components/utility-bar-product-switcher.tsx): round Exxat mark, product name, chevron; opens a "Switch product"
 * menu with the current product ticked. Compact density (size-6 frame, size-5 mark, h-8) as in the compact shell.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@exxatdesignux/ui/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@exxatdesignux/ui/components/ui/tooltip"
import { utilityBarActionButtonClass } from "@exxatdesignux/ui/components/shell/utility-bar-chrome"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { ProductMark } from "@/components/shell/product-mark"
import { CURRENT_PRODUCT, PRODUCTS } from "@/components/shell/products"

export function ProductSwitcher({ markOnly = false }: { markOnly?: boolean }) {
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={`Current product: ${CURRENT_PRODUCT.label}. Switch product`}
              data-utility-bar-product-switcher=""
              className={cn(
                "min-w-0 max-w-full items-center gap-0 overflow-hidden py-0",
                markOnly ? "size-8 shrink-0 justify-center px-0" : "h-8 px-1.5",
                utilityBarActionButtonClass,
              )}
            >
              <span className="flex size-6 shrink-0 items-center justify-center">
                <ProductMark config={CURRENT_PRODUCT.brand} className="size-5" />
              </span>
              {markOnly ? null : (
                <span className="flex min-w-0 items-center gap-1.5 overflow-hidden ps-1.5">
                  <span className="truncate text-sm font-semibold text-foreground">{CURRENT_PRODUCT.label}</span>
                  <i className="fa-light fa-chevron-down shrink-0 text-xs text-muted-foreground" aria-hidden="true" />
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Switch product</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="start" sideOffset={8} className="w-64">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Switch product</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {PRODUCTS.map((p) => (
          <DropdownMenuItem
            key={p.id}
            disabled={!p.current}
            aria-current={p.current ? "true" : undefined}
            className="min-h-10 gap-3"
          >
            <span className="flex size-5 shrink-0 items-center justify-center text-base" aria-hidden="true">
              {p.icon === "1" ? <span className="font-semibold">1</span> : <i className={`fa-solid fa-${p.icon}`} />}
            </span>
            <span className="min-w-0 flex-1 truncate">{p.label}</span>
            {p.current ? <i className="fa-solid fa-check text-xs text-(--brand-color)" aria-hidden="true" /> : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <p className="px-2 py-1.5 text-xs text-muted-foreground">
          Only Clinical Education is part of this prototype. The other products open from the Prism launcher.
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
