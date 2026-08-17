"use client"

/**
 * The channel a switcher row uses to reach {@link ProductSwitchDialog}.
 *
 * Split out of `components/product-switch-dialog.tsx` so that file exports
 * components and nothing else. A module that mixes components with plain
 * functions is not a Fast Refresh boundary, and this one is imported by the app
 * shell: every edit to the dialog invalidated `App.tsx` and remounted the whole
 * tree, which closed every open rail and dialog in the app.
 *
 * @see components/product-switch-dialog.tsx — the provider and the dialog
 */

import * as React from "react"

import type { Product } from "@/contexts/product-context"
import { useProductSwitch } from "@/contexts/product-route-sync"

export interface PendingSwitch {
  product: Product
  customIndex?: number
}

export interface ProductSwitchRequest {
  pending: PendingSwitch | null
  request: (product: Product, customIndex?: number) => void
  cancel: () => void
}

export const ProductSwitchContext = React.createContext<ProductSwitchRequest | null>(null)

/**
 * What a switcher row calls instead of `useProductSwitch`. Same signature, so a
 * row does not have to know whether the destination will have a question.
 *
 * Without the provider above it this is `useProductSwitch`, and the switch goes
 * through unasked. Not a silent fallback to a scope nobody chose: the destination's
 * own `RequireProductScope` still stops on the full-page chooser, which is the same
 * answer a pasted link gets. So a shell that has not mounted the provider degrades
 * to the older, blunter version of this rather than crashing on a switcher press.
 */
export function useRequestProductSwitch(): (product: Product, customIndex?: number) => void {
  const request = React.useContext(ProductSwitchContext)?.request
  const switchProduct = useProductSwitch()
  return request ?? switchProduct
}

/** True while the dialog is handling a switch, so the full-viewport overlay stands down. */
export function useProductSwitchPending(): boolean {
  return Boolean(React.useContext(ProductSwitchContext)?.pending)
}
