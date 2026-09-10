"use client"

/**
 * Shim — re-exports ProductProvider + useProduct from `@exxatdesignux/ui`.
 * New code SHOULD import directly from `@exxatdesignux/ui/components/shell`.
 *
 * `"use client"` is required: Next.js app-router treats this file as a Server
 * Component boundary when layouts import it. Without the directive, re-exporting
 * `ProductProvider` (which calls `createContext`) throws at runtime.
 */

export {
  ProductProvider,
  syncActiveProductThemeFromStore,
  useProduct,
  type Product,
} from "@exxatdesignux/ui/components/shell"
