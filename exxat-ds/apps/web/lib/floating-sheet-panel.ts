/**
 * Inset + sizing for “floating” product sheets (Export, table properties):
 * `Sheet` + `showOverlay={false}` — no dimming layer; panel is inset with rounded corners.
 */

import type { CSSProperties } from "react"
import { cn } from "@/lib/utils"

export type FloatingSheetSide = "top" | "right" | "bottom" | "left"

const baseClassName =
  "flex flex-col border border-border bg-background shadow-xl rounded-xl overflow-hidden p-0 gap-0"

/**
 * Props to spread onto `SheetContent` together with `showOverlay={false}` and `showCloseButton={false}`.
 */
export function getFloatingSheetInsetProps(side: FloatingSheetSide): {
  side: FloatingSheetSide
  className: string
  style: CSSProperties
} {
  switch (side) {
    case "right":
      return {
        side: "right",
        className: cn(baseClassName, "w-80 sm:max-w-80"),
        style: {
          top: "0.5rem",
          bottom: "0.5rem",
          right: "0.5rem",
          left: "auto",
          height: "calc(100vh - 1rem)",
        },
      }
    case "left":
      return {
        side: "left",
        className: cn(baseClassName, "w-80 sm:max-w-80"),
        style: {
          top: "0.5rem",
          bottom: "0.5rem",
          left: "0.5rem",
          right: "auto",
          height: "calc(100vh - 1rem)",
        },
      }
    case "bottom":
      return {
        side: "bottom",
        className: cn(baseClassName, "max-h-[min(80vh,32rem)]"),
        style: {
          left: "0.5rem",
          right: "0.5rem",
          bottom: "0.5rem",
          top: "auto",
          height: "auto",
        },
      }
    case "top":
      return {
        side: "top",
        className: cn(baseClassName, "max-h-[min(80vh,32rem)]"),
        style: {
          left: "0.5rem",
          right: "0.5rem",
          top: "0.5rem",
          bottom: "auto",
          height: "auto",
        },
      }
  }
}
