"use client"

import * as React from "react"

/**
 * False on the server and on the first client render, true after mount. The store hydrates from localStorage in an
 * effect (see lib/store/react.ts), so a record created in an earlier session is not visible until after that effect.
 * Surfaces that look a record up by id show a skeleton until this is true instead of flashing "not found".
 */
export function useReady(): boolean {
  const [ready, setReady] = React.useState(false)
  React.useEffect(() => setReady(true), [])
  return ready
}
