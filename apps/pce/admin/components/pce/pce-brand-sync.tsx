"use client"

import * as React from "react"
import { useProduct } from "@/contexts/product-context"
import { PCE_BRAND_COLOR } from "@/lib/product-brand"

/**
 * Registers PCE's brand color as an accent override for the active product
 * in the DS's product-theme store.
 *
 * `ProductProvider` (from `@exxatdesignux/ui`) reactively syncs `<html>`'s
 * theme class + `--custom-product-brand-color` from its own Zustand store —
 * including a `MutationObserver` that reverts any outside change to those
 * attributes back to what the store expects (see
 * `syncActiveProductThemeFromStore` in the DS package). A static class/style
 * on `app/layout.tsx`'s `<html>` therefore gets overwritten right after
 * hydration; the store is the only place this can be set durably.
 * `productBrandColors[product]` being non-empty flips `resolveProductThemeClass`
 * to `"theme-custom"` and feeds `brandForProduct`, matching the DS workspace's
 * own "Exxat PCE" tenant color (`localhost:4000/pce`) instead of the
 * `exxat-prism` default this app's `product` state otherwise resolves to.
 */
export function PceBrandSync() {
  const { product, productBrandColors, setProductBrandColor } = useProduct()

  React.useEffect(() => {
    if (productBrandColors[product] === PCE_BRAND_COLOR) return
    setProductBrandColor(product, PCE_BRAND_COLOR)
  }, [product, productBrandColors, setProductBrandColor])

  return null
}
