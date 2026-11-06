"use client"

/**
 * Where the shared configure fields open their overlays. On the page they use the DS default layer. Inside the Library edit panel (a DS
 * FloatingSheetPanel at z-80) a default Select, menu or Dialog would open under the panel, so the panel provides ABOVE_PANEL here.
 */
import * as React from "react"
import { returnFocus } from "@/components/lab/shared/focus"

export interface FieldLayer {
  /** For a Dialog's content and overlay. */
  content?: string
  /** For a Select's or menu's content. */
  menu?: string
}

export const FieldLayerContext = React.createContext<FieldLayer>({})
export const useFieldLayer = (): FieldLayer => React.useContext(FieldLayerContext)

/**
 * A dialog opened by a plain button returns focus to it, by any way out. A Radix Dialog with no DialogTrigger drops it on the body. When the button is gone by then (Add questions, once there are
 * questions), `fallback` takes it.
 */
export function useFocusBack(fallback?: string) {
  const had = React.useRef<Element | null>(null)
  return {
    onOpenAutoFocus: () => { had.current = document.activeElement },
    onCloseAutoFocus: (e: Event) => {
      e.preventDefault()
      returnFocus(had.current?.isConnected ? had.current : fallback ? document.getElementById(fallback) : null)
    },
  }
}
