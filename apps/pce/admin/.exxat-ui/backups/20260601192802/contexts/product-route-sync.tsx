"use client"
/** Shim — re-exports route-sync hooks from `@exxatdesignux/ui/components/shell`. */

export {
  useProductDashboardHref,
  useProductSwitch,
} from "@exxatdesignux/ui/components/shell"

import * as React from "react"
import { ProductRouteSync as DSProductRouteSync } from "@exxatdesignux/ui/components/shell"

/**
 * SSR-safe wrapper: ProductRouteSync calls useAppStore.persist.onFinishHydration
 * which is undefined during SSR because Zustand's persist middleware exits early
 * when window.localStorage is unavailable. Defer rendering to client.
 */
export function ProductRouteSync() {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null
  return <DSProductRouteSync />
}
