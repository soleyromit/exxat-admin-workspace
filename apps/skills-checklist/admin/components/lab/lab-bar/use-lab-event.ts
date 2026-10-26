"use client"

import * as React from "react"
import type { LabEventName } from "./scenarios"

/** Subscribe a screen to a lab bar event (for example "lab:reset"). The handler may change between renders. */
export function useLabEvent(name: LabEventName, handler: (e: CustomEvent) => void) {
  const ref = React.useRef(handler)
  React.useEffect(() => { ref.current = handler })
  React.useEffect(() => {
    const fn = (e: Event) => ref.current(e as CustomEvent)
    window.addEventListener(name, fn)
    return () => window.removeEventListener(name, fn)
  }, [name])
}
