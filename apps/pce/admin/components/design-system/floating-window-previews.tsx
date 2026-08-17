"use client"

import * as React from "react"

import {
  FloatingWindow,
  type FloatingWindowRect,
} from "@/components/ui/floating-window"
import { Button } from "@/components/ui/button"

const DEMO_DEFAULT: FloatingWindowRect = {
  x: 40,
  y: 56,
  width: 300,
  height: 200,
}

/**
 * Live Floating Window inside the doc stage.
 * Portals into the stage (absolute, not fixed) so it stays on the catalog page.
 */
export function FloatingWindowLivePreview() {
  const hostRef = React.useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = React.useState(false)
  const [open, setOpen] = React.useState(true)
  const [rect, setRect] = React.useState<FloatingWindowRect>(DEMO_DEFAULT)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div
      ref={hostRef}
      className="relative h-[320px] w-full max-w-2xl overflow-hidden rounded-lg border border-border bg-muted/20"
    >
      <div className="flex items-center gap-2 border-b border-border bg-background px-3 py-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            setRect(DEMO_DEFAULT)
            setOpen(true)
          }}
        >
          Open demo window
        </Button>
        <p className="text-xs text-muted-foreground">
          Grip: arrows move · Alt+arrows resize · click snaps corner
        </p>
      </div>
      {mounted && hostRef.current ? (
        <FloatingWindow
          open={open}
          rect={rect}
          onRectChange={setRect}
          defaultRect={() => DEMO_DEFAULT}
          aria-label="Demo tool window"
          container={hostRef.current}
          onEscape={() => setOpen(false)}
          cornerSnap={false}
          className="!absolute z-10"
          title={
            <span className="text-sm font-medium text-foreground">
              Demo window
            </span>
          }
        >
          <div className="flex flex-1 flex-col gap-2 p-3 text-sm text-muted-foreground">
            <p>The page behind stays live. This is a non-modal tool window.</p>
            <p>Focus the grip to move or resize with the keyboard.</p>
          </div>
        </FloatingWindow>
      ) : null}
    </div>
  )
}
