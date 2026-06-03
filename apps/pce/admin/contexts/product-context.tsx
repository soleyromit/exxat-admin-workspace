'use client'
// Shim — re-exports ProductProvider + useProduct from `@exxatdesignux/ui`.
// New code SHOULD import directly from `@exxatdesignux/ui/components/shell`.
// 'use client' must stay here: ProductProvider uses createContext internally.

export {
  ProductProvider,
  syncActiveProductThemeFromStore,
  useProduct,
  type Product,
} from "@exxatdesignux/ui/components/shell"
