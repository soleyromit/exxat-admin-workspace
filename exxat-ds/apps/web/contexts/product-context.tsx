"use client"

/**
 * ProductProvider — rehydrates the Zustand app store from localStorage after
 * mount, then keeps the <html> theme class in sync with the active product.
 *
 * `useProduct()` is a thin convenience hook over useAppStore so all existing
 * call-sites continue to work without any changes.
 */

import * as React from "react"
import { useAppStore, type Product } from "@/stores/app-store"

export type { Product }

export function useProduct() {
  const product    = useAppStore(s => s.product)
  const setProduct = useAppStore(s => s.setProduct)
  return { product, setProduct }
}

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const product = useAppStore(s => s.product)

  // Rehydrate from localStorage once — keeps SSR render matching server output.
  React.useEffect(() => {
    void useAppStore.persist.rehydrate()
  }, [])

  // Sync theme class to <html> whenever product changes.
  React.useEffect(() => {
    const html = document.documentElement
    html.classList.remove("theme-one", "theme-prism")
    html.classList.add(product === "exxat-one" ? "theme-one" : "theme-prism")
  }, [product])

  return <>{children}</>
}
