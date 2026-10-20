"use client"

import * as React from "react"
import { useV2Store } from "@/lib/v2/react"
import { IDS } from "@/lib/v2/seed"
import type { Result } from "@/lib/v2/admin-actions"
import type { V2State } from "@/lib/v2/types"

/** The administrator the Stage 1 screens act as. Every write is attributed to them in the audit log. */
export const ADMIN_ID = IDS.ross

/** Applies a pure transition to the shared store when it succeeds, and returns its result so the screen can show the error. */
export function useAdminRun() {
  const store = useV2Store()
  return React.useCallback(
    <T extends object>(fn: (s: V2State, at: string) => Result<T>): Result<T> => {
      const r = fn(store.getSnapshot(), new Date().toISOString())
      if (r.ok) store.update(() => r.state)
      return r
    },
    [store],
  )
}

/** Visually hidden polite live region. Screen readers hear the latest message; sighted users see the banners. */
export function LiveStatus({ message }: { message: string }) {
  return (
    <div role="status" aria-live="polite" className="sr-only">
      {message}
    </div>
  )
}
