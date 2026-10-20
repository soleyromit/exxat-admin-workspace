"use client"

import * as React from "react"
import type { Result } from "@/lib/v2/admin-actions"
import { useV2Store } from "@/lib/v2/react"
import { setDevice, type DevicePatch, type FlushResult } from "@/lib/v2/sync"
import type { V2State } from "@/lib/v2/types"

/** Touch target for the student screens: the DS 44 px token. Phone first, so it applies at every width. */
export const TOUCH = "min-h-(--control-height-touch) h-auto whitespace-normal"

/** Same, for DS Buttons whose label can wrap onto two lines. */
export const BTN = `${TOUCH} py-2`
/** DS LocalBanner retry and action buttons are small on touch; this lifts them to the touch height without changing the DS component. */
export const BANNER_TOUCH = "[&_button]:min-h-(--control-height-touch) [&_button]:px-3"

/** Day, in UTC so server and client markup always agree. */
export function fmtDate(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })
}

/** Applies a pure student transition to the shared store when it succeeds and returns its result, so the screen can show the error. */
export function useStudentRun() {
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

/** Plain store write for edits that are not decisions (the log draft). */
export function useStudentUpdate() {
  const store = useV2Store()
  return React.useCallback((fn: (s: V2State) => V2State) => store.update(fn), [store])
}

/** Changes the phone's demo toggles and returns what the sync that followed did. */
export function useDevice() {
  const store = useV2Store()
  return React.useCallback(
    (patch: DevicePatch): FlushResult | null => {
      let flush: FlushResult | null = null
      store.update((s) => {
        const r = setDevice(s, patch, new Date().toISOString())
        flush = r.flush
        return r.state
      })
      return flush
    },
    [store],
  )
}

/** Visually hidden polite live region. */
export function Announce({ message }: { message: string }) {
  return (
    <div role="status" aria-live="polite" className="sr-only">
      {message}
    </div>
  )
}
