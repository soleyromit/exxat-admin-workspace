import * as React from "react"

/**
 * ExxatLogoMark — Renders the Exxat "E" icon with a circle background.
 * Uses img + object-fit for reliable aspect-ratio preservation in Safari.
 */
export function ExxatLogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <div className={`${className} flex-shrink-0 flex items-center justify-center overflow-hidden aspect-square min-w-0`}>
      <img
        src="/exxat-logo-mark.svg"
        alt="Exxat logo"
        className="w-full h-full object-contain"
      />
    </div>
  )
}
