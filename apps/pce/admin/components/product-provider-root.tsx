"use client"

import * as React from "react"
import { ProductProvider } from "@/contexts/product-context"
import { isPlatformCreatorWorkspace } from "@exxatdesignux/product-framework"

/**
 * Design OS workspace — platform creators get Settings authoring on deploy;
 * consumer apps should use auth-backed `useCanAuthorProducts()` instead.
 */
export function ProductProviderRoot({
  children,
}: {
  children: React.ReactNode
}) {
  // `undefined` → dev / env defaults; `true` → DS team on production Design OS deploy
  const authoring = isPlatformCreatorWorkspace() ? true : undefined
  return <ProductProvider authoring={authoring}>{children}</ProductProvider>
}
