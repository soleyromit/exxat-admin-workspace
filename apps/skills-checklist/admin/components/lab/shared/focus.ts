/**
 * Where focus goes when a surface closes (rework item 9): back to what had it, else the open panel, else the row, else the page title. Never
 * the body, which would send a keyboard user to the top of the document.
 */
const PANEL = '[data-slot="lab-skill-detail"], [data-slot="lab-bulk-edit"]'

const usable = (el: Element | null): el is HTMLElement =>
  el instanceof HTMLElement && el !== document.body && el.isConnected && !el.matches(":disabled") && el.getClientRects().length > 0

export const rowLink = (skillId: string | null | undefined): HTMLElement | null =>
  skillId ? document.querySelector<HTMLElement>(`[data-skill-link="${CSS.escape(skillId)}"]`) : null

export function pageTitle(): HTMLElement | null {
  const h = document.querySelector<HTMLElement>("main h1")
  if (h && !h.hasAttribute("tabindex")) h.setAttribute("tabindex", "-1")
  return h
}

/** A tab that an arrow key moved to, while its change waited on a question. Focus on it would select it, so its selected neighbour stands in. */
const selectedTabFor = (saved: Element | null): Element | null =>
  saved?.matches?.('[role=tab][aria-selected="false"]') ? saved.closest("[role=tablist]")?.querySelector('[role=tab][aria-selected="true"]') ?? saved : saved

/**
 * The menu button pressed last. A menu row that opens a dialog is gone by the time the dialog closes, and the question it asked came from the "..." that opened the menu, so that is where focus returns.
 */
let lastMenuTrigger: HTMLElement | null = null
const rememberMenuTrigger = (e: Event) => {
  const t = e.target instanceof Element ? e.target.closest<HTMLElement>('[aria-haspopup="menu"]') : null
  if (t) lastMenuTrigger = t
}

if (typeof window !== "undefined") {
  window.addEventListener("pointerdown", rememberMenuTrigger, true)
  window.addEventListener("keydown", rememberMenuTrigger, true)
}

export function returnFocus(saved: Element | null, skillId?: string | null) {
  const panel = document.querySelector<HTMLElement>(PANEL)
  const control = selectedTabFor(saved)
  const trigger = saved?.matches?.('[role="menuitem"]') ? lastMenuTrigger : null
  const target = usable(control) ? control : usable(trigger) ? trigger : usable(panel) ? panel : rowLink(skillId) ?? pageTitle()
  target?.focus({ preventScroll: true })
}

/** After a navigation a surface asked for: when focus has fallen to the body on the new page, its title takes it. Gives up after a few seconds, or as soon as something on the page has taken focus. */
export function focusTitleAfterLeaving(from: string = window.location.href) {
  const started = Date.now()
  const timer = window.setInterval(() => {
    if (Date.now() - started > 8000) return window.clearInterval(timer)
    if (window.location.href === from || !document.querySelector("main h1")) return
    window.clearInterval(timer)
    if (!usable(document.activeElement)) pageTitle()?.focus({ preventScroll: true })
  }, 100)
}

/** After an action that may have disabled the focused control (Save), or moved past it (Next at the end). */
export function keepFocus(skillId?: string | null) {
  requestAnimationFrame(() => {
    if (!usable(document.activeElement)) returnFocus(null, skillId)
  })
}

/**
 * The button that opened an add sheet, so focus goes back to it when the sheet closes (Add a skill or the chevron). A menu's own item is gone by then, so the menu remembers
 * its trigger. Falls back to Add a skill, which is also right for a sheet that opened by itself.
 */
export const ADD_SKILL_TRIGGER = "[data-add-skill-trigger]"
export const ADD_MENU_TRIGGER = "[data-add-menu-trigger]"
let sheetOpener = ADD_SKILL_TRIGGER
export const rememberSheetOpener = (selector: string) => { sheetOpener = selector }
export function focusSheetOpener() {
  const el = document.querySelector<HTMLElement>(sheetOpener) ?? document.querySelector<HTMLElement>(ADD_SKILL_TRIGGER)
  el?.focus({ preventScroll: false })
  sheetOpener = ADD_SKILL_TRIGGER
}

/**
 * The second press of a double click on a button that has just closed its own dialog does nothing (rework 2, item 2). Whatever sits under the pointer by then (the dialog's
 * fading overlay, a row, the panel) never hears it, in the capture phase, before Radix or React. Only a press near the first and soon after it: anything else is a new press.
 * A keyboard press has no position and nothing to hold.
 */
export function holdSecondPress(first: { clientX: number; clientY: number; detail: number }, ms = 600) {
  if (first.detail === 0) return
  const types = ["pointerdown", "mousedown", "pointerup", "mouseup", "click", "dblclick"] as const
  let held = false
  const near = (e: MouseEvent) => Math.abs(e.clientX - first.clientX) < 8 && Math.abs(e.clientY - first.clientY) < 8
  const stop = (e: Event) => {
    if (e.type === "pointerdown") held = near(e as MouseEvent)
    if (!held) return
    e.stopPropagation()
    e.preventDefault()
    if (e.type === "dblclick") done()
  }
  const done = () => { for (const t of types) window.removeEventListener(t, stop, true) }
  for (const t of types) window.addEventListener(t, stop, true)
  window.setTimeout(done, ms)
}

/**
 * A banner's own button is gone once pressed (Show them, dismiss): focus moves to the open panel, else the table's first row, else the page title. It waits for the filtered rows to
 * render and looks again in case that row went with the old list. Focus the admin has already moved elsewhere is left alone. `skillId`: the row the banner's action acted on, when there is one.
 */
export function focusAfterBanner(skillId?: string | null) {
  const place = () => {
    if (usable(document.activeElement)) return
    const panel = document.querySelector<HTMLElement>(PANEL)
    const target = usable(panel) ? panel : rowLink(skillId) ?? document.querySelector<HTMLElement>("main [data-skill-link]") ?? pageTitle()
    target?.focus({ preventScroll: true })
  }
  window.setTimeout(place, 150)
  window.setTimeout(place, 500)
}
