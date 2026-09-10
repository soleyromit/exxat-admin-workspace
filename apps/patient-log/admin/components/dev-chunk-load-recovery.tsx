"use client"

import * as React from "react"

import {
  clearDevChunkReloadFlag,
  isChunkLoadError,
  reloadOnStaleDevChunk,
} from "@/lib/chunk-load-error"

/**
 * Dev-only: auto-reload when the dev server serves a stale module / chunk so
 * users are not stuck on a blank shell before the route error boundary mounts.
 *
 * A successful mount clears the flag so a later HMR break can recover again.
 * Reload is still cooled down so a persistently bad import cannot loop.
 */
export function DevChunkLoadRecovery() {
  React.useEffect(() => {
    if (!import.meta.env.DEV) return

    clearDevChunkReloadFlag()

    function maybeReload(error: unknown) {
      if (!isChunkLoadError(error)) return
      reloadOnStaleDevChunk()
    }

    const onError = (event: ErrorEvent) => {
      maybeReload(event.error ?? event.message)
    }
    const onRejection = (event: PromiseRejectionEvent) => {
      maybeReload(event.reason)
    }

    window.addEventListener("error", onError)
    window.addEventListener("unhandledrejection", onRejection)
    return () => {
      window.removeEventListener("error", onError)
      window.removeEventListener("unhandledrejection", onRejection)
    }
  }, [])

  return null
}
