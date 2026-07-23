"use client"
// contexts/product-route-sync.tsx
import * as React from "react"
import { ProductRouteSync as DSProductRouteSync } from "@exxatdesignux/ui/components/shell"

export {
  useProductDashboardHref,
  useProductSwitch,
} from "@exxatdesignux/ui/components/shell"

/**
 * SSR-safe wrapper: ProductRouteSync calls useAppStore.persist.onFinishHydration
 * which is undefined in SSR because Zustand's persist middleware exits early when
 * window.localStorage is unavailable. Defer rendering to client after hydration.
 */
export function ProductRouteSync() {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    setMounted(true)
  }, [])
  if (!mounted) return null
  return <DSProductRouteSync />
}
