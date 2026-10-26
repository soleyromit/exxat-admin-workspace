"use client"

import * as React from "react"
import { qrEncode, qrPath } from "@/lib/v2/qr"

/** A real, scannable QR code as inline SVG (lib/v2/qr, dependency free). The link beside it serves anyone who cannot scan. */
export function QrSvg({ text, label, className = "size-48" }: { text: string; label: string; className?: string }) {
  const r = React.useMemo(() => {
    try {
      const q = qrEncode(text)
      return { ok: true as const, ...qrPath(q) }
    } catch {
      return { ok: false as const }
    }
  }, [text])
  if (!r.ok) return <p className="text-sm text-foreground">The code could not be drawn. Use the link instead.</p>
  return (
    <svg role="img" aria-label={label} viewBox={r.viewBox} shapeRendering="crispEdges" className={`rounded-md bg-background ${className}`}>
      <path d={r.d} className="fill-foreground" />
    </svg>
  )
}
