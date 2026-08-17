"use client"

/**
 * UtilityBarProductLabel — leading product mark + wordmark before the
 * breadcrumb, matching the DS's `UtilityBarProductSwitcher` visual treatment.
 *
 * Density: the DS's `hasFlushSidebar()` is hardcoded `true` for the only
 * shell variant that still exists (`lib/shell-layout.ts`), which forces
 * `UtilityBarProductSwitcher`'s `compact` prop to always be true too
 * (`compact={flush || compactDensity}`) — so the DS never actually renders
 * its own "spacious" (`h-9 px-2`, size-8 frame, `1.2em` wordmark) branch in
 * the current app; it always renders the COMPACT one: `h-8 px-1.5`, size-6
 * frame / size-5 mark, wordmark at `1em` (matches the breadcrumb's own size
 * exactly, not 1.2em bigger). Confirmed by measuring the live DS bar
 * (`localhost:4000/pce/dashboard` and `/prism/dashboard`, both identical):
 * button 32px tall, `0px 6px` padding, mark frame 24×24 with a 20px mark.
 * An earlier pass here built the spacious branch from source alone without
 * checking which branch `hasFlushSidebar()` actually resolves to — this is
 * the corrected, live-measured version.
 *
 * PCE is a standalone app, not one of the DS's built-in `Product` union
 * entries, so this hand-builds the wordmark instead of using
 * `ExxatProductLogo`'s suffix (that suffix is pulled from a *tenant-
 * configured* brand name — "exxat-prism" resolves to "Clinical Education" in
 * this workspace's demo tenant config, unrelated to PCE's identity). The
 * round mark renders via the lower-level `ProductMark` (config-based, not
 * `Product`-union-based).
 *
 * The mark's own gradient/shadow is corporate-brand pink on EVERY product in
 * the DS registry (`EXXAT_LOGO_PINK`/`_GRADIENT_END`/`_SHADOW`, baked into
 * every `defineProductBrand` entry incl. Prism) — only each product's
 * `brandColor` (sidebar/UI accent) varies. Confirmed live at
 * `localhost:4000/pce/dashboard`: the round mark is pink there too, despite
 * the sidebar/accents being PCE's own violet. `applyBrandColorOverride` is
 * the DS's own helper for exactly this split — it overrides `brandColor`
 * only, leaving `wordmarkColor`/`markGradient`/`markShadow` pinned to pink.
 */

import { ProductMark } from "@/components/product-wordmark"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { utilityBarActionButtonClass } from "@/components/utility-bar-chrome"
import { cn } from "@/lib/utils"
import { EXXAT_PRISM_BRAND, PCE_BRAND_COLOR, applyBrandColorOverride } from "@/lib/product-brand"

const PCE_PRODUCT_BRAND = applyBrandColorOverride(EXXAT_PRISM_BRAND, PCE_BRAND_COLOR)

export function UtilityBarProductLabel() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          data-utility-bar-product-switcher=""
          className={cn(
            "flex h-8 shrink-0 items-center gap-0 px-1.5 text-sm",
            utilityBarActionButtonClass,
          )}
        >
          <span className="flex size-6 shrink-0 items-center justify-center">
            <ProductMark config={PCE_PRODUCT_BRAND} className="size-5" />
          </span>
          <span className="flex min-w-0 items-center gap-1.5 ps-1.5">
            <span
              data-product-wordmark-suffix
              className="whitespace-nowrap font-sans text-[1em] font-semibold leading-[1.35] tracking-[-0.02em] py-0.5"
            >
              PCE
            </span>
            <i className="fa-light fa-chevron-down shrink-0 text-xs text-muted-foreground" aria-hidden="true" />
          </span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom">PCE — Practice/Clinical Experience</TooltipContent>
    </Tooltip>
  )
}
