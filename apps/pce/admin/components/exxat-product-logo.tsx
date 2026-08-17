"use client"

/**
 * Exxat product logo — SVG mark + HTML text (`Exxat` + the product name).
 *
 * **One typeface for the words.** "Exxat" used to be traced IvyPresto outlines
 * in the same `viewBox` as the mark, with the product name set in IvyPresto
 * text beside it. Both words are now UI sans: the lock-up is read as a label
 * in the sidebar, the utility bar, and the switcher, and a Bodoni-lineage
 * serif at chrome size costs legibility for names as long as
 * "Clinical Education". The menu rows already made this trade
 * (see {@link ProductSwitcherMenuRowLabel}); the trigger now matches them.
 *
 * What that buys, beyond legibility: the two words share a font-size, so their
 * caps line up by construction instead of by a hand-tuned nudge against a
 * baseline authored at y=128 in an SVG, and neither word waits on Adobe Fonts
 * to swap. The circular mark stays SVG — geometry, gradient, and cut-out "E"
 * come from {@link ProductMark}, so a new brand still only needs colours.
 *
 * Adding a product remains a one-liner in `lib/product-brand.ts`.
 */

import * as React from "react"
import { PRODUCT_TILE_CLASS, productTileStyle } from "@/lib/product-glyph"
import { cn } from "@/lib/utils"
import { ProductTileArt } from "@/components/product-app-mark"
import { ProductMark } from "@/components/product-wordmark"
import { brandForProduct, type ProductBrandConfig } from "@/lib/product-brand"
import type { Product } from "@/contexts/product-context"
import { useAppStore, type CustomProductBrand, getActiveCustomProductBrand } from "@/stores/app-store"
import { customProductBrandConfig } from "@/lib/product-brand"

export type ExxatProductLogoVariant = "default" | "mutedSuffix" | "sidebar" | "utility-bar"

export interface ExxatProductLogoProps {
  product: Product
  className?: string
  /** Reserved for switcher chrome; suffix fill uses `--product-wordmark-suffix`. */
  variant?: ExxatProductLogoVariant
  /** Live preview or a specific custom slot — bypasses the active custom index. */
  previewCustomBrand?: CustomProductBrand | null
  /**
   * Utility bar rail — the round mark renders in its own column (aligned with
   * the school selector); this instance is wordmark-only.
   */
  mark?: "included" | "external"
  /**
   * `utility-bar` density only. Drops the wordmark from `1.2em` to `1em`, which
   * at the lockup's `text-sm` host is exactly the breadcrumb's size. The compact
   * shell puts the product name and the breadcrumb on one row, and a wordmark
   * two steps larger than the crumb beside it reads as a heading rather than as
   * the first item in a trail.
   */
  compact?: boolean
}

/**
 * Type for both words of the lock-up. Sized by the caller in `em` so the whole
 * mark-plus-words unit scales with the host's font-size, as the SVG did.
 *
 * Tracking is tighter than body text but looser than the -3 % the serif asked
 * for: Inter's sidebearings are already narrow, and -3 % at 25 px closed the
 * gap between the doubled letters in "Exxat" and in "Assessment".
 */
const WORDMARK_TYPE_CLASS = "font-sans font-semibold tracking-[-0.02em]"

/**
 * "Exxat", ahead of the product name.
 *
 * Neutral ink rather than the brand colour: the name carries the brand (via
 * `--product-wordmark-suffix`) and the mark carries the colour, so painting all
 * three the same hue flattens the lock-up into one block.
 */
function ExxatPrefix({ className }: { className?: string }) {
  return (
    <span
      data-product-wordmark-prefix
      className={cn(
        WORDMARK_TYPE_CLASS,
        "text-[var(--exxat-color-wordmark-ink-light)] dark:text-[var(--exxat-color-wordmark-ink-dark)]",
        className,
      )}
    >
      Exxat
    </span>
  )
}

/**
 * Mark + wordmark composed inline. Sizing is font-size-driven: the host pins
 * `text-base` (16 px) and every part is expressed in `em` from there, so one
 * `text-*` on the parent scales mark and words together.
 *
 * **Geometry at a `text-base` parent:** mark `1.55em` ≈ 25 px, both words
 * `1.55em` ≈ 25 px with a ≈ 18 px cap. The two words share a font-size, so
 * their caps agree without a nudge, and `items-baseline` sits them on one
 * baseline with the mark centred against it.
 *
 * **Variants:**
 *  - `"default"` / `"mutedSuffix"` — full inline lock-up (mark + "Exxat" +
 *    name). Used by the marketing wordmark surfaces (Settings → Appearance
 *    rows, dropdown rows, dashboards).
 *  - `"sidebar"` — adaptive lock-up cascade for the sidebar product switcher.
 *    The mark is always rendered (round `ProductMark`); the wordmark cascades
 *    A → B1 → B2 based on whether the inline string fits the trigger width
 *    (see {@link SidebarLockup}).
 */
export function ExxatProductLogo({
  product,
  className,
  variant = "default",
  previewCustomBrand,
  mark = "included",
  compact = false,
}: ExxatProductLogoProps) {
  const activeCustomProductBrand = useAppStore(s => getActiveCustomProductBrand(s))
  const productBrandColors = useAppStore(s => s.productBrandColors)
  const effectiveCustomBrand = previewCustomBrand ?? activeCustomProductBrand
  const config = brandForProduct(product, effectiveCustomBrand, productBrandColors)

  if (variant === "sidebar" || variant === "utility-bar") {
    return (
      <SidebarLockup
        config={config}
        className={className}
        density={variant}
        externalMark={mark === "external"}
        compact={compact}
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      data-product-logo
      data-product-id={config.id}
      className={cn(
        "inline-flex items-baseline overflow-visible text-base leading-none",
        className,
      )}
    >
      <ProductMark
        config={config}
        // Centred on the words' cap rather than sat on their baseline, which is
        // what `items-baseline` would do to a 25 px disc.
        className="size-[1.55em] self-center"
      />
      <ExxatPrefix className="ms-[0.5em] text-[1.55em]" />
      <span
        data-product-wordmark-suffix
        className={cn(WORDMARK_TYPE_CLASS, "ms-[0.18em] text-[1.55em]")}
      >
        {config.suffix}
      </span>
    </span>
  )
}

/* ── Sidebar lock-up cascade ───────────────────────────────────────────────── */

/**
 * Adaptive product lock-up for the sidebar product switcher trigger and its
 * dropdown rows. Three deterministic states, picked purely from the suffix
 * string — no `ResizeObserver`, no font-load timing, no measurement spans.
 *
 * The cascade was originally width-driven, but the measurement path latched
 * the wrong lockup whenever IvyPresto swapped in (Adobe Fonts via Kit fires
 * `document.fonts.ready` after first paint). A deterministic rule keyed on
 * `suffix.length` + word count is stable across SSR, hydration, and font
 * load, and matches the small number of legal suffix shapes the brand
 * config produces (built-in suffixes are short single words; custom
 * suffixes are clamped to 24 chars in `customProductBrandConfig`).
 *
 * - **A — Full wordmark** `[E]  Exxat <Suffix>` — short suffixes that read
 *   well next to "Exxat". Mark = standalone round `ProductMark`; the
 *   wordmark area renders `ExxatLogoBase` in **letters-only** mode
 *   (`omitMark` — viewBox cropped to the "Exxat" glyph range) + suffix
 *   inline. Without `omitMark` the embedded SVG mark would paint a second
 *   round `[E]` next to `ProductMark`.
 * - **B1 — Compact one-liner** `[E]  <Suffix>` — long single-word suffixes
 *   (`Assessment`, `Analytics`). "Exxat" is dropped so the suffix can stand
 *   alone in IvyPresto SemiBold at the same visual size as A's suffix.
 * - **B2 — Stacked two-liner** `[E]  Word1` / `Word2` — exactly two-word
 *   suffixes where the combined length warrants wrapping
 *   (`Exam Management`, `Field Practice`). Each word sits on its own line at
 *   the same IvyPresto SemiBold size as B1; the parent's `items-center`
 *   keeps the round `[E]` aligned to the vertical midpoint of the stack.
 *
 * Three-plus-word suffixes are unsupported by product policy — they fall
 * through to B1 and rely on the trigger's overflow rules to clip if needed.
 */
function SidebarLockup({
  config,
  className,
  density = "sidebar",
  externalMark = false,
  compact = false,
}: {
  config: ProductBrandConfig
  className?: string
  density?: "sidebar" | "utility-bar"
  externalMark?: boolean
  compact?: boolean
}) {
  const utilityBar = density === "utility-bar"
  const suffix = config.suffix
  const words = suffix.trim().split(/\s+/)
  // Utility bar — suffix-only wordmark (`Clinical Education`); round mark is external.
  // Sidebar keeps the deterministic A / B1 / B2 cascade for narrow triggers.
  const lockup: "A" | "B1" | "B2" = utilityBar
    ? "B1"
    : words.length === 2 && suffix.length > 10
      ? "B2"
      : suffix.length > 8
        ? "B1"
        : "A"

  // Utility bar clips horizontally (`truncate` for long custom suffixes), and
  // that same `overflow-hidden` clips vertically too, so a descender in
  // "Design OS" would be sheared by a `leading-none` box. Relaxed leading plus
  // symmetric padding gives it room; the flex parent keeps it optically
  // centred. The sidebar lockup overflows visibly, so it keeps `leading-none`
  // and needs no padding.
  const wordTypeClasses = utilityBar
    ? cn(
        WORDMARK_TYPE_CLASS,
        "leading-[1.35] py-0.5",
        // `1em` of the `text-sm` host below, so the name matches the breadcrumb
        // exactly rather than approximately.
        compact ? "text-[1em]" : "text-[1.2em]",
      )
    : cn(WORDMARK_TYPE_CLASS, "text-[1.55em] leading-none")

  return (
    <span
      aria-hidden="true"
      data-product-logo
      data-product-logo-variant={utilityBar ? "utility-bar" : "sidebar"}
      data-product-id={config.id}
      data-lockup={lockup}
      className={cn(
        "flex items-center leading-none",
        utilityBar ? "min-w-0 gap-0 text-sm" : "min-w-0 flex-1 gap-2 text-base",
        className,
      )}
    >
      {!externalMark ? (
        <span
          className={cn(
            "flex shrink-0 items-center justify-center",
            utilityBar ? "size-6" : "size-8",
          )}
        >
          <ProductMark config={config} className={utilityBar ? "size-5" : "size-6"} />
        </span>
      ) : null}

      <span className={cn("flex min-w-0 items-center", utilityBar ? "overflow-hidden" : "flex-1")}>
        {lockup === "A" && (
          <span className="inline-flex max-w-full items-baseline overflow-hidden whitespace-nowrap leading-none">
            <ExxatPrefix className={wordTypeClasses} />
            <span
              data-product-wordmark-suffix
              className={cn("ms-[0.18em]", wordTypeClasses)}
            >
              {suffix}
            </span>
          </span>
        )}
        {lockup === "B1" && (
          <span
            data-product-wordmark-suffix
            className={cn(
              "whitespace-nowrap",
              utilityBar && "min-w-0 truncate",
              wordTypeClasses,
            )}
          >
            {suffix}
          </span>
        )}
        {lockup === "B2" && (
          // Variant 1 (under evaluation): top word smaller, bottom word
          // at the same headline size as A / B1. Hierarchy reads
          // "qualifier → noun" — e.g. "Exam → MANAGEMENT".
          <span
            data-product-wordmark-suffix
            className={cn("flex flex-col whitespace-nowrap leading-[1.05]", WORDMARK_TYPE_CLASS)}
          >
            <span className="text-sm leading-none">{words[0]}</span>
            <span className="text-[1.55em] leading-none">{words[1]}</span>
          </span>
        )}
      </span>
    </span>
  )
}

export interface ExxatProductMarkProps {
  product: Product
  className?: string
  cutoutColor?: string
}

export interface ProductSwitcherMenuRowLabelProps {
  product: Product
  className?: string
  /** Live preview or a specific custom slot — bypasses the active custom index. */
  previewCustomBrand?: CustomProductBrand | null
  /**
   * Name to print instead of the brand suffix. The suffix alone is enough
   * beside a trigger that already said "Exxat", but in a list it can read as a
   * fragment ("One"), so callers with a full product name pass it here.
   */
  label?: string
}

/**
 * Product switcher dropdown row — brand-tinted glyph tile, product name in plain
 * UI text. Omits the shared "Exxat" prefix and does not inherit the active
 * shell's `--product-wordmark-suffix` token (which would paint every row in the
 * current product's theme colour).
 *
 * The glyph sits in a tile rather than loose on the row. Loose, it carried the
 * same visual weight as the label beside it, so eleven rows read as one grey
 * column with nothing to aim at; the tile is the same one the home page draws
 * for the same product, at menu size, so a product wears one mark everywhere.
 *
 * The name is `text-foreground`, not the row's brand colour. Nine names in nine
 * different hues read as nine links rather than one list, the tick marking the
 * active row had to compete with colour that meant nothing about state, and
 * several registry hues land close to the disabled-text ramp in dark mode. The
 * glyph carries the brand, where colour is decoration and costs nothing if it
 * is missed.
 *
 * The product's own mark, not `ProductMark`: every row drew the same Exxat `E`,
 * so a nine-row menu gave the eye nothing to aim at and every row had to be read.
 * The Exxat mark still owns the trigger beside this menu, where there is one
 * product and it is the company talking. What fills the tile is
 * `ProductTileArt` — a drawn mark per app, which carries recognition on its own
 * so a row still reads when two accents land on the same hue or a workspace
 * recolours one.
 *
 * Row type is the lock-up's type at menu weight. The rows led the move off
 * IvyPresto (a serif at menu size cost legibility, and nine stacked read like
 * signage instead of a list); the trigger above them now follows, so a product
 * name has one voice from the trigger down through the list.
 */
export function ProductSwitcherMenuRowLabel({
  product,
  className,
  previewCustomBrand,
  label,
}: ProductSwitcherMenuRowLabelProps) {
  const activeCustomProductBrand = useAppStore(s => getActiveCustomProductBrand(s))
  const productBrandColors = useAppStore(s => s.productBrandColors)
  const effectiveCustomBrand = previewCustomBrand ?? activeCustomProductBrand
  const config = brandForProduct(product, effectiveCustomBrand, productBrandColors)

  return (
    <span
      aria-hidden="true"
      className={cn("inline-flex min-w-0 flex-1 items-center gap-2.5", className)}
    >
      <span
        // White mark on the brand colour, so the tile keeps its ink when the
        // menu row it sits in is highlighted. See `DropdownMenuItem`.
        data-fixed-ink=""
        style={productTileStyle(config.brandColor)}
        className={PRODUCT_TILE_CLASS}
      >
        <ProductTileArt product={product} />
      </span>
      <span
        data-product-switcher-suffix
        data-product-id={config.id}
        // Wraps rather than truncates. "Student & Program Success" is the
        // longest name in the registry and it does not fit beside a stage
        // badge, and half a product name is worse than a second line.
        className="min-w-0 break-words text-sm font-medium leading-snug text-foreground line-clamp-2 whitespace-normal"
      >
        {label ?? config.suffix}
      </span>
    </span>
  )
}

/**
 * Circular mark only — collapsed sidebar (matches Avatar 32×32). Reuses the
 * generic `ProductMark` because the mark's geometry is identical across all
 * Exxat products; only colours change per brand.
 */
export function ExxatProductMark({ product, className, cutoutColor, previewCustomBrand }: ExxatProductMarkProps & { previewCustomBrand?: CustomProductBrand | null }) {
  const activeCustomProductBrand = useAppStore(s => getActiveCustomProductBrand(s))
  const productBrandColors = useAppStore(s => s.productBrandColors)
  const effectiveCustomBrand = previewCustomBrand ?? activeCustomProductBrand
  const config = brandForProduct(product, effectiveCustomBrand, productBrandColors)
  return <ProductMark config={config} className={className} cutoutColor={cutoutColor} />
}

export interface ExxatProductWordmarkEditorProps {
  previewCustomBrand: CustomProductBrand
  suffixValue: string
  onSuffixChange: (value: string) => void
  suffixPlaceholder?: string
  suffixId?: string
  className?: string
}

/**
 * Product-switcher wordmark with the name as an inline field — mark + "Exxat"
 * plus an editable name at the same size as {@link ExxatProductLogo}, so what
 * the tenant types is what the sidebar will show.
 */
export function ExxatProductWordmarkEditor({
  previewCustomBrand,
  suffixValue,
  onSuffixChange,
  suffixPlaceholder = "Product",
  suffixId,
  className,
}: ExxatProductWordmarkEditorProps) {
  const suffixRef = React.useRef<HTMLSpanElement>(null)
  const suffix = suffixValue.trim() || suffixPlaceholder
  const config = customProductBrandConfig({
    ...previewCustomBrand,
    suffix,
  })

  React.useLayoutEffect(() => {
    const node = suffixRef.current
    if (!node) return
    const next = suffixValue
    if (node.textContent !== next) {
      node.textContent = next
    }
  }, [suffixValue])

  return (
    <span
      data-product-wordmark-editor
      className={cn(
        "inline-flex items-baseline overflow-visible text-base leading-none",
        className,
      )}
    >
      <span aria-hidden="true" className="inline-flex shrink-0 items-baseline">
        <ProductMark config={config} className="size-[1.55em] self-center" />
        <ExxatPrefix className="ms-[0.5em] text-[1.55em]" />
      </span>
      
      <span
        id={suffixId}
        ref={suffixRef}
        role="textbox"
        tabIndex={0}
        contentEditable
        suppressContentEditableWarning
        aria-label="Product name suffix"
        data-product-wordmark-suffix
        data-placeholder={suffixPlaceholder}
        onInput={() => {
          const raw = suffixRef.current?.textContent ?? ""
          const next = raw.slice(0, 24)
          if (raw.length > 24 && suffixRef.current) {
            suffixRef.current.textContent = next
          }
          onSuffixChange(next)
        }}
        onKeyDown={event => {
          if (event.key === "Enter") {
            event.preventDefault()
          }
        }}
        className={cn(
          WORDMARK_TYPE_CLASS,
          "ms-[0.18em] min-w-[5ch] max-w-[min(100%,14rem)] border-0 bg-transparent p-0",
          "text-[1.55em] leading-none",
          "outline-none empty:before:text-current/45 empty:before:content-[attr(data-placeholder)]",
          "focus-visible:outline-none focus-visible:ring-0",
        )}
      />
    </span>
  )
}
