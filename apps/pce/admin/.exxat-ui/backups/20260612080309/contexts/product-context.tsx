'use client'
/**
 * Shim — re-exports ProductProvider + useProduct from `@exxatdesignux/ui`.
 * New code SHOULD import directly from `@exxatdesignux/ui/components/shell`.
 *
 * `'use client'` is required: ProductProvider/useProduct call React.createContext,
 * which only runs in a Client Component (this shim is imported by a Server Component
 * layout, so the boundary must live here).
 */

export {
  ProductProvider,
  syncActiveProductThemeFromStore,
  useProduct,
  type Product,
} from "@exxatdesignux/ui/components/shell"
