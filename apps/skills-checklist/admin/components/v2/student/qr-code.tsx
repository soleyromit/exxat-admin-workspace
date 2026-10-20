"use client"

import * as React from "react"
import { qrEncode, qrPath } from "@/lib/v2/qr"

/**
 * Renders a real, scannable QR code as inline SVG from lib/v2/qr.ts (dependency free). Modules use the DS foreground token on the
 * background token. The text beside it in the dialog is the same link, for people who cannot scan.
 */
export function QrCode({ text, label }: { text: string; label: string }) {
  const result = React.useMemo(() => {
    try {
      const q = qrEncode(text)
      return { ok: true as const, ...qrPath(q), version: q.version }
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "The QR code could not be drawn." }
    }
  }, [text])
  if (!result.ok) return <p className="text-sm text-foreground">{`${result.error} Use the link instead.`}</p>
  return (
    <svg role="img" aria-label={label} viewBox={result.viewBox} shapeRendering="crispEdges" className="mx-auto size-56 rounded-md bg-background" data-qr-version={result.version}>
      <path d={result.d} className="fill-foreground" />
    </svg>
  )
}
