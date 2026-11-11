"use client"

/**
 * Whether the walkthrough's path bar is shown (D-L139 amended, see the ledger entry of 2026-11-11). Hidden by default: a walkthrough
 * page looks like the plain product. The presenter brings the bar back from the user menu ("Show walkthrough steps") or with the
 * shortcut below; the choice lasts for this browser and across steps.
 *
 * The server snapshot is always "hidden", so the server render and the first client render agree (no hydration mismatch) and a
 * browser on the default never sees the bar flash in. The key does not start with "lab" or "skills-checklist:", so Exit, Start
 * again (lab-bar/reset.ts) clears the sample data and keeps this presenter preference.
 */
import * as React from "react"

export const WALKTHROUGH_STEPS_KEY = "walkthrough-steps-shown"

/** The shortcut, in the DS `useShortcut` grammar. Ctrl rather than Cmd on every platform: Cmd+Shift+/ opens the Help menu on macOS. */
export const WALKTHROUGH_STEPS_SHORTCUT = "Ctrl+Shift+?"

const listeners = new Set<() => void>()
/** Set when the bar is turned on by the presenter, so the bar takes focus once it mounts (and only then). */
let focusOnShow = false
/** Blocked storage (a private window): the choice lasts for this page. */
let memory = false

function read(): boolean {
  try {
    return window.localStorage.getItem(WALKTHROUGH_STEPS_KEY) === "1"
  } catch {
    return memory
  }
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  // Another tab changing the choice.
  const onStorage = (e: StorageEvent) => { if (e.key === WALKTHROUGH_STEPS_KEY) fn() }
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(fn)
    window.removeEventListener("storage", onStorage)
  }
}

export function setWalkthroughStepsShown(shown: boolean) {
  memory = shown
  try {
    if (shown) window.localStorage.setItem(WALKTHROUGH_STEPS_KEY, "1")
    else window.localStorage.removeItem(WALKTHROUGH_STEPS_KEY)
  } catch { /* blocked storage: kept in memory for this page */ }
  focusOnShow = shown
  for (const fn of listeners) fn()
}

export function toggleWalkthroughSteps() {
  setWalkthroughStepsShown(!read())
}

/** Read once by the bar on mount: true only right after the presenter turned it on. */
export function takeFocusOnShow(): boolean {
  const v = focusOnShow
  focusOnShow = false
  return v
}

/** Focus the path bar's first control that can take it (Back, or Next on the first stop). */
export function focusWalkthroughBar(): boolean {
  const el = document.querySelector<HTMLElement>("[data-lab-walkthrough] a[href], [data-lab-walkthrough] button:not([disabled])")
  el?.focus()
  return !!el
}

export function useWalkthroughStepsShown(): boolean {
  return React.useSyncExternalStore(subscribe, read, () => false)
}

/** "⌃ ⇧ ?" on Apple platforms, "Ctrl Shift ?" elsewhere: the keys of the shortcut, one Kbd each. */
export function shortcutKeys(mac: boolean): string[] {
  return mac ? ["⌃", "⇧", "?"] : ["Ctrl", "Shift", "?"]
}
