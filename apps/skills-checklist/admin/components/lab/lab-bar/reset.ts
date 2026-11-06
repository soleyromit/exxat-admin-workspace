/**
 * The one reset (map section F, "Setup for every script"): every lab store and draft in this browser, seeded program and new program alike, then a fresh page. Exit, Start again goes to the
 * path's first stop; Scenario, Reset all edits stays on the page. Screens still hear `lab:reset` first, for what they hold in memory. A dirty form does not ask: the admin has just asked to lose it.
 */
import { LAB_EVENTS } from "./scenarios"

/** Filters, records and demo states in the URL go with the edits. The option set, the variant and the program stay: they say which page this is. */
const CLEARED_PARAMS = ["skill", "section", "selected", "added", "cat", "tag", "config", "different", "from", "nolist", "saved", "draft", "kept", "held", "state", "status"]

function clearLabData() {
  window.addEventListener("beforeunload", (e) => e.stopImmediatePropagation(), { capture: true })
  window.dispatchEvent(new CustomEvent(LAB_EVENTS.reset))
  for (const store of [window.localStorage, window.sessionStorage]) {
    try {
      for (const k of Object.keys(store)) if (k.startsWith("lab") || k.startsWith("skills-checklist:")) store.removeItem(k)
    } catch { /* blocked storage: the reload still opens a fresh page */ }
  }
}

/** Back to a clean sample, on this path's first stop (D-L64, D-L67). */
export function startAgain(href: string) {
  clearLabData()
  window.location.assign(href)
}

/** Back to a clean sample, on this page. */
export function resetHere() {
  clearLabData()
  const q = new URLSearchParams(window.location.search)
  for (const k of CLEARED_PARAMS) q.delete(k)
  const s = q.toString()
  window.location.assign(s ? `${window.location.pathname}?${s}` : window.location.pathname)
}
