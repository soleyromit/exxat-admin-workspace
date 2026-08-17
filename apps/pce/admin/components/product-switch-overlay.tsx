"use client"

import { useProductSwitchPending } from "@/contexts/product-switch-context"
import { useAppStore } from "@/stores/app-store"

/**
 * Brief full-viewport overlay while the active product (and theme class) flips
 * after URL-driven product adoption.
 *
 * A switcher press is handled by `ProductSwitchDialog` instead, which names the
 * app and the program rather than saying "Switching product", so this stands down
 * while that is up rather than stacking on top of it. What is left is the case
 * with no press to attach a dialog to: a pasted link into another product.
 */
export function ProductSwitchOverlay() {
  const switching = useAppStore(s => s.productSwitching)
  const dialogHandlingIt = useProductSwitchPending()
  if (!switching || dialogHandlingIt) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm"
      aria-busy="true"
      aria-live="polite"
      aria-label="Switching product"
    >
      <i
        className="fa-light fa-spinner-third fa-spin text-2xl text-muted-foreground"
        aria-hidden="true"
      />
      <p className="text-sm text-muted-foreground">Switching product…</p>
    </div>
  )
}
