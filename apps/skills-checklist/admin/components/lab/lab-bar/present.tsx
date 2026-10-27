"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { PRESENT_PARAM, PRESENT_STORAGE_KEY, isPresent } from "@/lib/lab/present"

function readStored(): boolean {
  try { return window.sessionStorage.getItem(PRESENT_STORAGE_KEY) === "1" } catch { return false }
}
function writeStored(on: boolean) {
  try { window.sessionStorage.setItem(PRESENT_STORAGE_KEY, on ? "1" : "0") } catch { /* the URL still carries it */ }
}

/**
 * Present mode state. The URL (`present=1`) is the source of truth, so the server renders the same thing; the session only
 * restores it on a lab page whose URL lost the param (an old bookmark), with one replace.
 */
export function usePresent(): { present: boolean; setPresent: (on: boolean) => void } {
  const params = useSearchParams()
  const pathname = usePathname() ?? ""
  const router = useRouter()
  const raw = params?.get(PRESENT_PARAM) ?? null
  const present = isPresent(raw)
  React.useEffect(() => {
    if (raw !== null) { writeStored(present); return }
    if (readStored() && pathname.startsWith("/lab")) {
      const q = new URLSearchParams(params?.toString() ?? "")
      q.set(PRESENT_PARAM, "1")
      router.replace(`${pathname}?${q.toString()}`)
    }
  }, [raw, present, pathname, params, router])
  const setPresent = React.useCallback((on: boolean) => {
    writeStored(on)
    const q = new URLSearchParams(params?.toString() ?? "")
    if (on) q.set(PRESENT_PARAM, "1")
    else q.delete(PRESENT_PARAM)
    const s = q.toString()
    router.replace(s ? `${pathname}?${s}` : pathname)
  }, [params, pathname, router])
  return { present, setPresent }
}

/**
 * The only lab control in present mode, in place of the lab bar: "Screens" back to the marquee list and "Exit present
 * mode". No internal label.
 */
export function PresentControls() {
  const { setPresent } = usePresent()
  // From 640 px it floats at the bottom left, over the empty foot of the sidebar (the content's sticky footer keeps its Back
  // button free). It is portalled to <body> so no stacking context of the page or the sidebar can paint over it (Romit
  // 2026-10-27, "getting hidden": the sidebar covered it). Below 640 px it would cover a sticky submit bar, so it stays in the
  // page flow as a quiet row at the top instead. Only one of the two renders at a time.
  const [floating, setFloating] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)")
    const on = () => setFloating(mq.matches)
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])
  const buttons = (
    <>
      <Button asChild variant="ghost" size="sm">
        <Link href={`/lab?${PRESENT_PARAM}=1`}>Screens</Link>
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => setPresent(false)}>Exit present mode</Button>
    </>
  )
  if (floating) {
    return createPortal(
      <div data-lab-chrome data-lab-present className="fixed bottom-4 left-4 z-50 flex items-center gap-1 rounded-lg border border-border bg-background p-1 shadow-sm">
        {buttons}
      </div>,
      document.body,
    )
  }
  return (
    <div data-lab-chrome data-lab-present className="flex w-full items-center justify-end gap-1 border-b border-border bg-muted/30 p-1">
      {buttons}
    </div>
  )
}
