"use client"

import { ProductRootGate as PackageProductRootGate } from "@exxatdesignux/ui/components/shell"

/**
 * Validates `:productRootSegment` against built-in slugs and configured custom
 * products. Wraps the framework's gate with the template's default loading
 * fallback so existing `<ProductRootGate />` call-sites stay unchanged.
 */
export function ProductRootGate() {
  return <PackageProductRootGate loadingFallback={null} />
}
