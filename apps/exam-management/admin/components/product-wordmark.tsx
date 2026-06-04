"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import type { ProductBrandConfig } from "@/lib/product-brand"

interface ProductMarkProps {
  config: ProductBrandConfig
  className?: string
  cutoutColor?: string
}

function useMarkGradientId(brandId: string) {
  const raw = React.useId().replace(/:/g, "")
  return `product-mark-${brandId.replace(/[^a-z0-9-]/gi, "")}-${raw}`
}

function useBrowserPaintReady() {
  const [ready, setReady] = React.useState(false)
  React.useLayoutEffect(() => { setReady(true) }, [])
  return ready
}

/**
 * Circular Exxat mark only — the x=0..147 slice of the full logo viewBox.
 * Used in collapsed sidebar and anywhere only the mark (not wordmark) is needed.
 */
export function ProductMark({ config, className, cutoutColor = "white" }: ProductMarkProps) {
  const ready = useBrowserPaintReady()
  const gradId = useMarkGradientId(config.id)
  const [from, to] = config.markGradient ?? [config.brandColor, config.brandColor]
  const shadow = config.markShadow ?? config.brandColor

  return (
    <svg
      viewBox="0 0 147 164"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      suppressHydrationWarning
      className={cn("block shrink-0", className)}
    >
      <path
        d="M73.4939 155.238C114.084 155.238 146.988 122.334 146.988 81.7439C146.988 41.1544 114.084 8.25 73.4939 8.25C32.9044 8.25 0 41.1544 0 81.7439C0 122.334 32.9044 155.238 73.4939 155.238Z"
        fill={ready ? `url(#${gradId})` : config.brandColor}
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

      {ready && (
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
      )}
    </svg>
  )
}
