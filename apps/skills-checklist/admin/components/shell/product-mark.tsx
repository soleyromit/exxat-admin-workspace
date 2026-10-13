"use client"

/**
 * ProductMark: the Exxat circular "E" mark, recoloured from a product brand config. The geometry is the DS's own
 * (same SVG as apps/pce/admin/components/product-wordmark.tsx ProductMark); colours come from
 * `@exxatdesignux/product-framework` brand configs, never hardcoded here. Decorative: the trigger carries the name.
 */
import * as React from "react"
import { cn } from "@exxatdesignux/ui/lib/utils"
import type { ProductBrandConfig } from "@exxatdesignux/product-framework"

function useBrowserPaintReady() {
  const [ready, setReady] = React.useState(false)
  React.useLayoutEffect(() => {
    setReady(true)
  }, [])
  return ready
}

export function ProductMark({ config, className, cutoutColor = "white" }: { config: ProductBrandConfig; className?: string; cutoutColor?: string }) {
  const ready = useBrowserPaintReady()
  const raw = React.useId().replace(/:/g, "")
  const gradId = `pmk-${config.id.replace(/[^a-z0-9-]/gi, "")}-${raw}`
  const [from, to] = config.markGradient ?? [config.brandColor, config.brandColor]
  const shadow = config.markShadow ?? config.brandColor
  const sharedClass = cn("box-border block aspect-square shrink-0 flex-none object-contain", className)

  if (!ready) {
    return (
      <svg
        viewBox="0 8.25 147 147"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        data-product-mark
        className={sharedClass}
        aria-hidden="true"
        suppressHydrationWarning
      />
    )
  }

  return (
    <svg
      viewBox="0 8.25 147 147"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      data-product-mark
      data-product-logo-mark
      data-product-id={config.id}
      className={sharedClass}
      aria-hidden="true"
      suppressHydrationWarning
    >
      <path
        d="M73.4939 155.238C114.084 155.238 146.988 122.334 146.988 81.7439C146.988 41.1544 114.084 8.25 73.4939 8.25C32.9044 8.25 0 41.1544 0 81.7439C0 122.334 32.9044 155.238 73.4939 155.238Z"
        fill={`url(#${gradId})`}
      />
      <path
        d="M0.594727 90.9915C4.59951 122.921 29.0894 148.466 60.4966 154.085L102.462 116.355V102.302H86.8312L102.462 88.2489V74.1957H86.8312L102.462 60.1425V46.0894H50.5575L0.594727 90.9915Z"
        fill={shadow}
      />
      <path d="M102.474 116.355H50.5576L58.6764 102.302H102.474V116.355Z" fill={cutoutColor} />
      <path d="M102.474 60.1303H58.6764L50.5576 46.0771H102.474V60.1303Z" fill={cutoutColor} />
      <path d="M102.474 88.2368H66.7949L70.8483 81.2102L66.7949 74.1836H102.474V88.2368Z" fill={cutoutColor} />
      <path d="M39.2227 74.1835H66.795L58.6762 60.1304H39.2227V74.1835Z" fill={cutoutColor} />
      <path d="M39.2227 102.302H58.6762L66.795 88.2368H39.2227V102.302Z" fill={cutoutColor} />
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
