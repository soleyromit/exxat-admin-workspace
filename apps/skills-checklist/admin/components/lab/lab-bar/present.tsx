"use client"

import * as React from "react"
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
  return (
    // Floating at the bottom left from 640 px; below that it would cover a sticky submit bar, so it becomes a quiet row at
    // the top of the page instead.
    <div data-lab-chrome data-lab-present className="fixed bottom-4 left-4 z-50 flex items-center gap-1 rounded-lg border border-border bg-background p-1 shadow-sm max-sm:static max-sm:w-full max-sm:justify-end max-sm:rounded-none max-sm:border-x-0 max-sm:border-t-0 max-sm:bg-muted/30 max-sm:shadow-none">
      <Button asChild variant="ghost" size="sm">
        <Link href={`/lab?${PRESENT_PARAM}=1`}>Screens</Link>
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => setPresent(false)}>Exit present mode</Button>
    </div>
  )
}
