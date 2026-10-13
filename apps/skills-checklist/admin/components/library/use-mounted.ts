"use client"

import * as React from "react"

/**
 * False on the server and on the first client render, true after mount. The store renders the seed first and loads the
 * persisted state after mount (lib/store/react.ts), so a list that rendered at once could flash seed rows. Surfaces
 * show their skeleton until this is true (state L, docs/strategy/06 §1).
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  return mounted
}
