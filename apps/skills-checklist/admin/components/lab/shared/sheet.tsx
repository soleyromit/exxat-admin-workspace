"use client"

/**
 * The DS FloatingSheetPanel with one rule added (map section E rule 6): X and Esc act on the first press. Every sheet and side panel in the lab takes it from here, by importing this
 * root in place of the DS one; the rest of the panel's parts still come from the DS.
 *
 * Radix gives Esc to its top layer only, and a tooltip is a layer. With the pointer or focus on a control that has a Tip (X above all, where the DS puts one no prop reaches), the
 * tooltip took the press and the sheet heard nothing, so the admin pressed twice. So: while the sheet is open and a tooltip is all that stands above it, the press also goes to the sheet,
 * through its own onOpenChange, so a dirty sheet asks as it does for X. A listener on the document, for the open sheet only, in the capture phase, since that is where Radix decides.
 * Anything else above the sheet with its own use for Esc keeps it: a question, a dialog or a popover, a menu, a list.
 */
import * as React from "react"
import { FloatingSheetPanel as DsFloatingSheetPanel } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"

const TOOLTIP = '[data-slot="tooltip-content"]'
/** A sheet is a dialog too: only one that is not a sheet stands above it. Closed ones may still be fading out. */
const OWNS_ESCAPE = ["[role=alertdialog]", "[role=menu]", "[role=listbox]", "[role=dialog]:not([data-sheet-content])"].map((s) => `${s}:not([data-state=closed])`).join(", ")

/** Sheets open now, the last on top: one press is for one of them. */
const openSheets: object[] = []

export function FloatingSheetPanel(props: React.ComponentProps<typeof DsFloatingSheetPanel>) {
  const { open, onOpenChange } = props
  const closeRef = React.useRef(onOpenChange)
  closeRef.current = onOpenChange
  React.useEffect(() => {
    if (!open) return
    const me = {}
    openSheets.push(me)
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented || openSheets[openSheets.length - 1] !== me) return
      if (!document.querySelector(TOOLTIP) || document.querySelector(OWNS_ESCAPE)) return
      closeRef.current?.(false)
    }
    document.addEventListener("keydown", onKey, true)
    return () => {
      document.removeEventListener("keydown", onKey, true)
      openSheets.splice(openSheets.indexOf(me), 1)
    }
  }, [open])
  return <DsFloatingSheetPanel {...props} />
}
