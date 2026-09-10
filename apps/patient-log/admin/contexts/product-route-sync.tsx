"use client"

/**
 * Shim — re-exports route-sync hooks from `@exxatdesignux/ui/components/shell`.
 *
 * `"use client"` is required for Next.js app-router consumers that import this
 * module from a Server Component layout — the package exports use hooks /
 * `createContext`.
 */

export {
  ProductRouteSync,
  useProductDashboardHref,
  useProductSwitch,
} from "@exxatdesignux/ui/components/shell"

export { useProductOrganizationSettingsHref } from "@exxatdesignux/ui/components/shell/product-route-sync"
