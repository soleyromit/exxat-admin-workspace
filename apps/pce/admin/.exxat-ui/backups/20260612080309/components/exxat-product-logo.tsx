"use client"

/**
 * Exxat product logo — SVG (mark + "Exxat" letters) + HTML text (product suffix).
 *
 * Why the hybrid:
 *  - The mark and the "Exxat" prefix are **static** and shared across every
 *    Exxat product. Tracing them once as SVG paths means pixel-perfect
 *    rendering, no font-loading flicker, and perfect baseline alignment
 *    between the circular mark and the "Exxat" caps (they live in the same
 *    `viewBox`).
 *  - The **suffix** (One / Prism / Pulse / …) is the only variable part, so it
 *    renders as HTML text in **IvyPresto Text SemiBold** per the official
 *    Figma brand spec (`weight 600`, `letter-spacing -3 %`). Adding a new
 *    product is still a one-liner in `lib/product-brand.ts` — no new path
 *    tracing required.
 *
 * The earlier "all-HTML wordmark" approach worked but couldn't fully match the
 * SVG's letter spacing / weight (Inter ≠ the original traced glyphs) and made
 * the mark-to-Exxat alignment depend on browser font-metrics. The hybrid
 * removes both classes of issue.
 *
 * **Reference paths:** the mark + "Exxat" path data is the same `d=…` source
 * used by the historical `ExxatOneLogo` (the pre-text-route baseline). Only
 * the gradient colours are pulled from the brand registry so new brands
 * recolour the mark.
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { ProductMark } from "@/components/product-wordmark"
import { brandForProduct, type ProductBrandConfig } from "@/lib/product-brand"
import type { Product } from "@/contexts/product-context"
import { useAppStore, type CustomProductBrand, getActiveCustomProductBrand } from "@/stores/app-store"
import { customProductBrandConfig } from "@/lib/product-brand"

export type ExxatProductLogoVariant = "default" | "mutedSuffix" | "sidebar"

export interface ExxatProductLogoProps {
  product: Product
  className?: string
  /** Reserved for switcher chrome; suffix stays Exxat pink in all modes. */
  variant?: ExxatProductLogoVariant
  /** Live preview or a specific custom slot — bypasses the active custom index. */
  previewCustomBrand?: CustomProductBrand | null
}

/**
 * The shared viewBox covers x=0..147 (mark), the original 49-unit baseline gap
 * (x=147..196), and x=196..514 (the "Exxat" letters). The full y=0..164 height
 * preserves the breathing room around the circle exactly as the brand asset
 * defines it — DO NOT crop or the mark stops being a round disc.
 */
const EXXAT_LOGO_VIEWBOX = "0 0 514 164"

/** Defer `<defs>` until after mount so SSR/CSR ids match — see `ProductMark`. */
function useBrowserPaintReady() {
  const [ready, setReady] = React.useState(false)
  React.useLayoutEffect(() => {
    setReady(true)
  }, [])
  return ready
}

/**
 * Per-instance gradient id so multiple logos on one page don't collide. Strip
 * colons because Radix-style `useId()` values can contain them and SVG `id`
 * cannot.
 */
function useExxatBaseGradientId(brandId: string) {
  const raw = React.useId().replace(/:/g, "")
  return `exxat-base-${brandId.replace(/[^a-z0-9-]/gi, "")}-${raw}`
}

/**
 * Mark + "Exxat" letters as a single SVG. The "Exxat" letter paths are
 * authored at y=35..128 (cap top / baseline) inside the 164-unit viewBox, so
 * the cap mid-line sits ≈ 81.5 — naturally centred with the circular mark
 * whose centre is at ≈ 81.5 too. This shared centring is the whole reason for
 * baking both into the same SVG.
 */
function ExxatLogoBase({
  config,
  className,
  style,
}: {
  config: ProductBrandConfig
  className?: string
  style?: React.CSSProperties
}) {
  const ready = useBrowserPaintReady()
  const gradId = useExxatBaseGradientId(config.id)
  const [from, to] = config.markGradient ?? [config.brandColor, config.brandColor]
  const shadow = config.markShadow ?? config.brandColor

  const sharedProps = {
    viewBox: EXXAT_LOGO_VIEWBOX,
    preserveAspectRatio: "xMinYMid meet" as const,
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "data-product-logo-base": true,
    "data-product-id": config.id,
    "aria-hidden": true,
    suppressHydrationWarning: true,
    className: cn("block shrink-0 aspect-[514/164]", className),
    style,
  } as const

  if (!ready) {
    return <svg {...sharedProps} />
  }

  return (
    <svg {...sharedProps}>
      {/* ── Mark: outer circle, inner shadow plate, cut-out "E" strokes ── */}
      <path
        d="M73.4939 155.238C114.084 155.238 146.988 122.334 146.988 81.7439C146.988 41.1544 114.084 8.25 73.4939 8.25C32.9044 8.25 0 41.1544 0 81.7439C0 122.334 32.9044 155.238 73.4939 155.238Z"
        fill={`url(#${gradId})`}
      />
      <path
        d="M0.594727 90.9915C4.59951 122.921 29.0894 148.466 60.4966 154.085L102.462 116.355V102.302H86.8312L102.462 88.2489V74.1957H86.8312L102.462 60.1425V46.0894H50.5575L0.594727 90.9915Z"
        fill={shadow}
      />
      <path d="M102.474 116.355H50.5576L58.6764 102.302H102.474V116.355Z" fill="white" />
      <path d="M102.474 60.1303H58.6764L50.5576 46.0771H102.474V60.1303Z" fill="white" />
      <path d="M102.474 88.2368H66.7949L70.8483 81.2102L66.7949 74.1836H102.474V88.2368Z" fill="white" />
      <path d="M39.2227 74.1835H66.795L58.6762 60.1304H39.2227V74.1835Z" fill="white" />
      <path d="M39.2227 102.302H58.6762L66.795 88.2368H39.2227V102.302Z" fill="white" />

      {/* ── "Exxat" letters — neutral slate on light, soft cool grey on dark ──
          Filled via CSS class so dark-mode + `mutedSuffix` flips can override. */}
      <g data-exxat-prefix>
        <path
          d="M196 35.7646L235.626 35.811C239.705 35.8108 250.804 36.0941 254.421 35.6509L254.407 50.8756C240.766 50.8038 227.125 50.8041 213.485 50.877L213.495 74.3467C224.554 74.3448 238.413 74.7338 249.193 74.2652L249.203 89.7182C245.211 89.4232 239.525 89.5845 235.431 89.5872L213.496 89.6342L213.484 113.004L256.078 112.926L256.072 128.097C251.917 127.617 239.134 127.901 234.375 127.929C221.693 128.004 208.639 127.754 196 127.94V35.7646Z"
          className="fill-[var(--exxat-color-wordmark-ink-light)] dark:fill-[var(--exxat-color-wordmark-ink-dark)]"
        />
        <path
          d="M311.843 57.1062C314.843 57.097 327.108 56.8601 329.377 57.2135L329.606 57.8503C329.333 60.3776 324.215 67.3436 322.511 69.9223C317.651 77.1875 312.847 84.4905 308.101 91.8305C309.118 93.8473 311.981 98.1472 313.27 100.2L323.962 117.113C325.904 120.182 329.179 124.459 329.551 127.99C323.658 127.748 316.574 127.94 310.593 127.946C307.782 122.799 304.084 117.694 301.099 112.597C299.196 109.347 296.932 105.769 294.706 102.746C293.772 104.889 290.7 109.57 289.357 111.724C285.993 117.165 282.58 122.576 279.12 127.956C276.595 127.908 261.817 128.243 260.671 127.615C260.249 126.007 261.797 123.527 262.702 122.205C269.332 112.519 275.107 101.261 281.979 91.8322C281.555 91.3258 281.153 90.8019 280.774 90.2617C279.987 89.1263 279.24 87.9296 278.486 86.7642C272.548 77.5965 266.263 68.6263 260.479 59.3668C260.192 58.9075 260.442 57.6507 260.539 57.1068C266.332 57.0478 272.125 57.0656 277.917 57.1596C283.454 64.9372 289.73 74.44 294.84 82.5018C296.784 80.011 299.246 76.0686 301.022 73.3917L311.843 57.1062Z"
          className="fill-[var(--exxat-color-wordmark-ink-light)] dark:fill-[var(--exxat-color-wordmark-ink-dark)]"
        />
        <path
          d="M331.798 57.0712C337.592 57.1185 343.354 57.0072 349.156 57.1749C351.068 59.3357 353.387 63.1655 355.063 65.6344C358.847 71.2087 362.432 77.014 366.36 82.4907C370.845 75.0665 378.273 64.1367 383.331 57.1032C385.626 57.0945 399.689 56.8398 400.866 57.3117C401.39 58.6028 399.759 61.1078 399.008 62.1658C392.221 71.7261 386.21 82.4699 379.267 91.8592C383.35 97.6717 387.268 104.526 391.166 110.532C393.16 113.606 400.626 124.783 400.949 127.559C399.879 128.243 384.096 127.95 382.001 127.951C377.115 119.684 371.356 110.895 366.217 102.718C364.993 105.113 362.366 109.016 360.85 111.436C357.401 116.922 353.992 122.433 350.622 127.968C348.242 127.897 332.898 128.279 332.168 127.57C332.118 126.754 332.069 125.826 332.449 125.099C334.495 121.173 337.285 117.058 339.661 113.307L353.193 91.8005C352.418 90.7063 351.628 89.4998 350.898 88.362C344.705 78.7208 337.866 69.3865 332.081 59.5087C331.713 58.8803 331.753 57.7841 331.798 57.0712Z"
          className="fill-[var(--exxat-color-wordmark-ink-light)] dark:fill-[var(--exxat-color-wordmark-ink-dark)]"
        />
        <path
          d="M430.755 55.7344C443.603 55.2553 459.709 58.3988 463.175 73.143C464.166 77.3587 463.884 82.6952 463.877 87.0408L463.845 105.91C463.857 112.149 463.051 112.645 469.328 113.205C469.057 117.66 469.234 123.628 469.242 128.194C461.169 128.149 448.96 129.818 446.764 119.668C444.471 122.422 443.567 123.605 440.357 125.604C433.884 129.636 423.423 129.934 416.178 128.172C410.382 126.762 405.62 123.519 402.512 118.29C400.527 114.233 400.122 109.477 400.649 105.072C402.505 89.5606 418.762 87.5983 431.172 85.928C435.522 85.237 440.828 84.6483 444.472 82.0073C447.548 79.7708 447.168 76.525 444.97 73.7922C440.68 68.4582 429.516 68.0981 424.356 72.2079C421.359 74.5939 420.834 77.8667 420.5 81.4362C414.437 81.3803 408.373 81.3842 402.31 81.4478C402.503 79.5217 402.653 77.3957 403.031 75.5059C405.774 61.7822 418.095 56.4115 430.755 55.7344ZM420.852 112.903C428.033 116.948 440.992 113.872 444.937 106.311C445.852 104.557 447.932 97.6766 446.702 95.9674L446.344 95.9145C442.708 97.4881 435.913 98.8678 431.795 99.3372C425.343 100.072 411.452 104.687 420.852 112.903Z"
          className="fill-[var(--exxat-color-wordmark-ink-light)] dark:fill-[var(--exxat-color-wordmark-ink-dark)]"
        />
        <path
          d="M479.835 35.8541C485.68 35.8897 491.521 35.8895 497.366 35.853C497.152 42.4806 497.332 50.2661 497.324 56.9807L514.284 56.9509L514.292 72.0978C508.643 72.0524 502.993 72.036 497.341 72.0485L497.313 93.563C497.313 97.0693 496.581 108.123 499.41 110.474C502.231 112.82 510.459 112.62 514.295 112.135L514.279 123.529L514.292 127.437C511.116 127.895 507.911 128.146 504.704 128.188C479.71 128.491 479.891 117.266 479.916 96.9484C479.949 88.6621 479.938 80.3759 479.88 72.09C476.431 72.026 471.882 71.9331 468.516 72.1906C468.292 67.7063 468.488 61.552 468.523 56.9865C469.391 56.999 470.258 56.9979 471.126 56.9829C482.417 56.741 480.091 43.7789 479.835 35.8541Z"
          className="fill-[var(--exxat-color-wordmark-ink-light)] dark:fill-[var(--exxat-color-wordmark-ink-dark)]"
        />
      </g>

      <defs>
        <linearGradient
          id={gradId}
          x1="28.3733"
          y1="134.255"
          x2="117.195"
          y2="30.9074"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>
    </svg>
  )
}

/**
 * Mark + wordmark composed inline. Sizing is height-driven via `className`
 * (e.g. `h-9`) — the SVG base scales with the parent height, and the suffix
 * text scales with the parent `text-base` (via `text-[1.8em]`) so its
 * cap-height matches the SVG "Exxat" cap.
 *
 * **Geometry at h-9 (36 px) parent:**
 *  - SVG `0 0 514 164` → renders 113 × 36 px, scale 0.2195
 *  - Mark height: 147 × 0.2195 ≈ 32 px (matches school Avatar slot)
 *  - "Exxat" cap height: 92 × 0.2195 ≈ 20 px (sits centred on mark midline)
 *  - "Exxat" baseline: y=128 in viewBox → ≈ 28.1 px from SVG top
 *
 * **Suffix sizing:** `text-[1.8em]` of 16 px base → 28.8 px font, cap ≈ 20 px
 * (matches "Exxat" cap). `translate-y-[0.05em]` (~1.4 px down) corrects the
 * residual cap-midpoint offset between HTML text metrics and the SVG baseline
 * authored at y=128.
 */
export function ExxatProductLogo({
  product,
  className,
  variant = "default",
  previewCustomBrand,
}: ExxatProductLogoProps) {
  const activeCustomProductBrand = useAppStore(s => getActiveCustomProductBrand(s))
  const productBrandColors = useAppStore(s => s.productBrandColors)
  const effectiveCustomBrand = previewCustomBrand ?? activeCustomProductBrand
  const config = brandForProduct(product, effectiveCustomBrand, productBrandColors)
  const suffixColor = config.wordmarkColor ?? config.brandColor
  const sidebarLockup = resolveSidebarLockup(config.suffix)

  if (variant === "sidebar" && sidebarLockup !== "full") {
    return (
      <span
        aria-hidden="true"
        data-product-logo
        data-product-logo-variant="sidebar"
        data-product-id={config.id}
        data-lockup={sidebarLockup}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2 text-base leading-none",
          className,
        )}
      >
        <ProductMark config={config} className="size-8 shrink-0" />
        <SidebarSuffix suffix={config.suffix} suffixColor={suffixColor} lockup={sidebarLockup} />
      </span>
    )
  }

  return (
    <span
      aria-hidden="true"
      data-product-logo
      data-product-id={config.id}
      className={cn(
        "inline-flex items-end overflow-visible text-base leading-none",
        className,
      )}
    >
      <ExxatLogoBase config={config} style={{ height: 28, width: "auto" }} />

      {/* HTML suffix — IvyPresto Text SemiBold per Figma brand spec. */}
      <span
        data-product-wordmark-suffix
        className="ms-[0.18em] text-[1.55em] font-semibold tracking-[-0.03em] -translate-y-[3px]"
        style={{
          fontFamily: "var(--font-heading), 'ivypresto-text', Georgia, serif",
          // The suffix always paints via the `--brand-color` DS token — never a
          // hardcoded literal. Live render inherits the active product's token;
          // explicit cross-product switcher previews scope-override the token
          // locally so each row keeps its brand color (fidelity) without putting
          // a raw color on the `color` property.
          ...(previewCustomBrand
            ? ({ ["--brand-color"]: suffixColor } as React.CSSProperties)
            : null),
          color: "var(--brand-color)",
        }}
      >
        {config.suffix}
      </span>
    </span>
  )
}

type SidebarLockup = "full" | "suffix" | "stacked"

function resolveSidebarLockup(suffix: string): SidebarLockup {
  const words = suffix.trim().split(/\s+/)
  if (words.length === 2 && suffix.length > 10) return "stacked"
  if (suffix.length > 8) return "suffix"
  return "full"
}

function SidebarSuffix({
  suffix,
  suffixColor,
  lockup,
}: {
  suffix: string
  suffixColor: string
  lockup: Exclude<SidebarLockup, "full">
}) {
  const words = suffix.trim().split(/\s+/)
  const suffixFontFamily = "var(--font-heading), 'ivypresto-text', Georgia, serif"
  const suffixTypeClasses =
    "text-[1.55em] font-semibold tracking-[-0.03em] leading-none"

  if (lockup === "stacked" && words.length === 2) {
    return (
      <span
        data-product-wordmark-suffix
        className="flex min-w-0 flex-col whitespace-nowrap font-semibold leading-[1.05] tracking-[-0.03em]"
        style={{ fontFamily: suffixFontFamily, color: suffixColor }}
      >
        <span className="text-base">{words[0]}</span>
        <span className="text-[1.55em]">{words[1]}</span>
      </span>
    )
  }

  return (
    <span
      data-product-wordmark-suffix
      className={cn("min-w-0 whitespace-nowrap", suffixTypeClasses)}
      style={{ fontFamily: suffixFontFamily, color: suffixColor }}
    >
      {suffix}
    </span>
  )
}

export interface ExxatProductMarkProps {
  product: Product
  className?: string
  cutoutColor?: string
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
 * Product-switcher wordmark with an inline suffix field — E + Exxat SVG plus
 * IvyPresto suffix input at the same size as {@link ExxatProductLogo}.
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
  const suffixColor = config.wordmarkColor ?? config.brandColor

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
      aria-hidden="true"
      data-product-wordmark-editor
      className={cn(
        "inline-flex items-end overflow-visible text-base leading-none",
        className,
      )}
    >
      <ExxatLogoBase config={config} className="shrink-0" style={{ height: 28, width: "auto" }} />
      <span
        id={suffixId}
        ref={suffixRef}
        role="textbox"
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
          "ms-[0.18em] min-w-[5ch] max-w-[min(100%,14rem)] border-0 bg-transparent p-0",
          "text-[1.55em] font-semibold leading-none tracking-[-0.03em] -translate-y-[3px]",
          "outline-none empty:before:text-current/45 empty:before:content-[attr(data-placeholder)]",
          "focus-visible:outline-none focus-visible:ring-0",
        )}
        style={{
          fontFamily: "var(--font-heading), 'ivypresto-text', Georgia, serif",
          color: suffixColor,
        }}
      />
    </span>
  )
}
