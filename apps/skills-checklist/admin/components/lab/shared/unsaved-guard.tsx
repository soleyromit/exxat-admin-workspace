"use client"

/**
 * The unsaved changes guard, one for every surface (map section E rule 6, step G3). While `dirty`, a link click anywhere (breadcrumb, sidebar,
 * Skills panel, path bar Next and Back) waits for "Discard your changes?". It listens on window in the capture phase, so it runs before the
 * shell's own handlers and Next's Link. Reload and closing the tab get the browser's prompt.
 *
 * Browser Back (rework item 5): while dirty one extra history entry sits on top of the page, so Back lands on the page itself and asks. After a
 * save the entry cannot be taken out of history, so the next Back steps over it. Not covered: Forward, and buttons that navigate from code.
 *
 * `backWithinPage`: for a page whose draft outlives its own views (Course mapping). Back between this page's entries just moves, and the draft stays. So the extra entry goes
 * below the page's first entry, from the moment the page opens: the stop before leaving. Reaching it asks while dirty, and steps over it otherwise. The router listens to popstate
 * first and cannot be stopped, which is why the question has to sit on an entry of this page. Keep editing drops Forward's entries, as the plain guard does.
 */
import { toLong } from "@/lib/short-urls"
import * as React from "react"
import { useRouter } from "next/navigation"
import { railTriggerProps } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@exxatdesignux/ui/components/ui/alert-dialog"
import { focusTitleAfterLeaving, keepFocus, returnFocus } from "./focus"

export const DISCARD_TITLE = "Discard your changes?"

/** Above a floating sheet (z-80), so it is never hidden behind the panel it protects. */
const ABOVE_SHEET = "z-[90]"

export function DiscardChangesDialog({ open, onKeep, onDiscard, body = "Your changes have not been saved.", layer = ABOVE_SHEET }: { open: boolean; onKeep: () => void; onDiscard: () => void; body?: string; /** Stacking, for a question asked over a dialog that already sits above the panel. */ layer?: string }) {
  // The control that was in use when the question opened. AlertDialog itself moves focus to Keep editing after this read; an autoFocus on that
  // button would move it first, and this would remember a button that is gone by the time the dialog closes.
  const had = React.useRef<Element | null>(null)
  const discarded = React.useRef(false)
  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) onKeep() }}>
      <AlertDialogContent
        className={layer}
        overlayClassName={layer}
        {...railTriggerProps()}
        onOpenAutoFocus={() => { had.current = document.activeElement; discarded.current = false }}
        onCloseAutoFocus={(e) => {
          e.preventDefault()
          // Discard moves on to what was asked for, which places focus itself; only a dropped focus is picked up.
          if (discarded.current) keepFocus()
          else returnFocus(had.current)
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{DISCARD_TITLE}</AlertDialogTitle>
          <AlertDialogDescription>{body}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline" size="sm">Keep editing</AlertDialogCancel>
          <AlertDialogAction variant="default" size="sm" onClick={() => { discarded.current = true; onDiscard() }}>Discard</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/**
 * The same question for a dialog that holds its own unsaved work (map section E rule 6): Cancel, Esc, the close button and a click outside all go through `close`,
 * which asks first while `dirty`. Keep editing stays in the dialog, Discard closes it. Above the dialog it protects.
 */
export function useDialogDiscard(dirty: boolean, close: () => void) {
  const [asking, setAsking] = React.useState(false)
  return {
    close: () => { if (dirty) setAsking(true); else close() },
    question: <DiscardChangesDialog layer="z-[97]" open={asking} onKeep={() => setAsking(false)} onDiscard={() => { setAsking(false); close() }} />,
  }
}

const BACK = "__back"

/** Marks the extra entry below a `backWithinPage` page. */
const PAGE_START = "labPageStart"

/** Said after a write to the URL, for a reader that must not wait for React to get to it (`useLiveUrlParam`). */
export const URL_PARAM_CHANGED = "lab-url-param-changed"

/** The guards whose extra history entry is still in place, last armed last. */
const armedGuards: Array<{ armed: boolean; dirty: () => boolean }> = []

/**
 * Moves to a new URL on this page as a history step Back and Forward both honour (Show them). A leftover guard entry repeating this page is reused: pushing above it left Forward stopping on
 * that entry, on the whole list. With it reused there is one step, so Back returns to the page and Forward restores the new URL.
 */
export function pushPageUrl(url: string) {
  const guard = armedGuards[armedGuards.length - 1]
  if (guard && !guard.dirty()) {
    guard.armed = false
    armedGuards.pop()
    // null, as for pushState: Next treats a state carrying its own marks as its own call and would not update useSearchParams.
    window.history.replaceState(null, "", url)
  } else window.history.pushState(null, "", url)
}

export function useLeaveGuard(dirty: boolean, { backWithinPage = false, keepRecord = false }: { backWithinPage?: boolean; /** The record in the URL is the page, not a panel on it (Configure one skill): the entry below keeps it. */ keepRecord?: boolean } = {}) {
  const router = useRouter()
  const [target, setTarget] = React.useState<string | null>(null)
  const dirtyRef = React.useRef(dirty)
  dirtyRef.current = dirty
  // True while the extra history entry is above the page.
  const entry = React.useRef({ armed: false, dirty: () => dirtyRef.current })
  // The address the form is on, while armed: the entry below it holds the page without its open record.
  const here = React.useRef("")
  const armed = { get current() { return entry.current.armed }, set current(v: boolean) {
    entry.current.armed = v
    const i = armedGuards.indexOf(entry.current)
    if (v && i < 0) armedGuards.push(entry.current)
    else if (!v && i >= 0) armedGuards.splice(i, 1)
  } }
  React.useEffect(() => {
    if (!backWithinPage) return
    const state = window.history.state
    // Forward from the page before: the stop is not somewhere to stay.
    if (state?.[PAGE_START]) window.history.forward()
    else {
      window.history.replaceState({ ...state, [PAGE_START]: true }, "", window.location.href)
      window.history.pushState(state, "", window.location.href)
    }
    const onPop = (e: PopStateEvent) => {
      if (!e.state?.[PAGE_START]) return
      if (!dirtyRef.current) return window.history.back()
      // The router has already moved to this entry, so the page stays at this address beneath the question.
      const { [PAGE_START]: _stop, ...rest } = e.state
      window.history.pushState(rest, "", window.location.href)
      setTarget(BACK)
    }
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [backWithinPage])
  React.useEffect(() => {
    if (!dirty) return
    if (!armed.current && !backWithinPage) {
      armed.current = true
      here.current = window.location.href
      // Back and Forward can land on the entry below. It must not hold the record open now, or a later visit reopens a panel on a skill long since left (review of the edit panel, 2026-11-05).
      const below = new URL(here.current)
      if (!keepRecord) below.searchParams.delete("skill")
      window.history.replaceState(window.history.state, "", below)
      window.history.pushState(window.history.state, "", here.current)
    }
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null
      const href = a?.getAttribute("href")
      if (!a || !href || !href.startsWith("/") || a.target === "_blank") return
      // A sidebar row pointing at this page stays put and only reopens its panel.
      if (a.matches("[data-sidebar=menu-button]") && toLong(href) === toLong(window.location.pathname)) return
      // A row link that moves within the page: the draft stays, so there is nothing to lose.
      if (a.hasAttribute("data-keeps-draft")) return
      e.preventDefault()
      e.stopPropagation()
      setTarget(href)
    }
    const onUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("click", onClick, true)
    window.addEventListener("beforeunload", onUnload)
    return () => {
      window.removeEventListener("click", onClick, true)
      window.removeEventListener("beforeunload", onUnload)
    }
  }, [dirty]) // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    const onPop = () => {
      if (!armed.current) return
      if (dirtyRef.current) {
        // Back while dirty: stay, put the entry back, and ask. What reads the record from the location hears that it is back.
        window.history.pushState(window.history.state, "", here.current || window.location.href)
        window.dispatchEvent(new Event(URL_PARAM_CHANGED))
        setTarget(BACK)
        return
      }
      // Back with nothing to lose, from the leftover entry: the page itself is not somewhere to stop.
      armed.current = false
      window.history.back()
    }
    window.addEventListener("popstate", onPop)
    return () => {
      window.removeEventListener("popstate", onPop)
      armed.current = false
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return {
    asking: target !== null,
    setAsking: (open: boolean) => { if (!open) setTarget(null) },
    go: (discard: () => void) => {
      discard()
      if (target === BACK) {
        dirtyRef.current = false
        window.history.back()
      } else if (target) {
        focusTitleAfterLeaving()
        router.push(target)
      }
      setTarget(null)
    },
  }
}

/** The guard and its dialog together, for a surface with nothing else to ask. */
export function UnsavedChangesGuard({ dirty, onDiscard, body, keepRecord }: { dirty: boolean; onDiscard: () => void; body?: string; keepRecord?: boolean }) {
  const leave = useLeaveGuard(dirty, { keepRecord })
  return <DiscardChangesDialog open={leave.asking} onKeep={() => leave.setAsking(false)} onDiscard={() => leave.go(onDiscard)} body={body} />
}
