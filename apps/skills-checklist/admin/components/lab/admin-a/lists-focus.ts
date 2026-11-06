"use client"

/**
 * Where focus goes when a Skill lists surface closes (map section E rule 6). The DS dialogs and panels here are opened from state with no
 * Radix trigger, so left alone focus falls to the body. `remember` is called when the surface is asked for, while the control is still known.
 */
import * as React from "react"
import { pageTitle } from "@/components/lab/shared/focus"

const usable = (el: Element | null | undefined): el is HTMLElement =>
  el instanceof HTMLElement && el !== document.body && el.isConnected && !el.matches(":disabled") && el.getClientRects().length > 0

/** The control behind the focused element: a menu's item is gone once the menu closes, so its trigger stands in. */
function openerOf(el: Element | null): HTMLElement | null {
  if (!(el instanceof HTMLElement) || el === document.body) return null
  const menu = el.closest("[role=menu]")
  if (!menu) return el
  const id = menu.getAttribute("aria-labelledby")
  return id ? document.getElementById(id) : null
}

export const listLink = (listId: string): HTMLElement | null => document.querySelector<HTMLElement>(`[data-list-link="${CSS.escape(listId)}"]`)
/** The one panel, in either of its two widths (the list, its skills). */
export const LIST_PANEL = '[data-slot^="lab-admin-list"]'
export const addStudentsButton = (): HTMLElement | null => document.querySelector<HTMLElement>(`${LIST_PANEL} [data-add-students]:not(:disabled)`)

/** For when the opener has gone (a deleted row, the filled Add students once someone is on the list): the panel's next control, else the page's. */
const nextControl = (): HTMLElement | null => addStudentsButton() ?? document.querySelector<HTMLElement>(LIST_PANEL) ?? document.querySelector<HTMLElement>("[data-new-list]") ?? pageTitle()

/** The panel's search, or the panel when it has none. */
export function focusPanel() {
  const panel = document.querySelector<HTMLElement>(LIST_PANEL)
  ;(panel?.querySelector<HTMLElement>("input[type=search]") ?? panel)?.focus({ preventScroll: true })
}

/** Once the question on top has gone and has done its own focus work. */
export function focusAfterQuestion(target: () => HTMLElement | null) {
  const started = performance.now()
  const tick = () => {
    if (document.querySelector("[role=alertdialog]") && performance.now() - started < 1500) return void requestAnimationFrame(tick)
    window.setTimeout(() => target()?.focus({ preventScroll: true }), 50)
  }
  tick()
}

/**
 * After Keep editing on the panel. Back on the panel's close button its tooltip would open and take the next Esc, so Esc would seem to do nothing:
 * that one press moves to the search instead.
 */
export function stepOffPanelClose() {
  focusAfterQuestion(() => {
    const on = document.activeElement
    const onClose = on instanceof HTMLElement && !!on.closest(LIST_PANEL) && /^close$/i.test((on.getAttribute("aria-label") ?? on.innerText).trim())
    if (onClose) focusPanel()
    return null
  })
}

/** A press still landing from the double click that opened a dialog is not a press outside it. */
export function useOpeningPress(open: boolean) {
  const at = React.useRef(0)
  React.useLayoutEffect(() => { if (open) at.current = performance.now() }, [open])
  return React.useCallback((e: { preventDefault: () => void }) => { if (performance.now() - at.current < 500) e.preventDefault() }, [])
}

/**
 * A double click does one thing. The first press acts; by the second, a row has gone, a dialog has closed or the result banner has moved the page, so it would land on something else
 * [designer 2026-11-05]. Dropped everywhere on the page and what opens from it, except a checkbox (two presses are two choices) and a text field (a double click selects a word).
 */
export function useOnePressAtATime() {
  React.useEffect(() => {
    const hold = (e: MouseEvent) => {
      if (e.detail < 2) return
      const t = e.target as Element | null
      if (t?.closest?.("input, textarea, [role=checkbox], label")) return
      e.stopPropagation()
      e.preventDefault()
    }
    const types = ["mousedown", "mouseup", "click", "dblclick"] as const
    for (const type of types) window.addEventListener(type, hold, true)
    return () => { for (const type of types) window.removeEventListener(type, hold, true) }
  }, [])
}

/**
 * A long list of checkboxes is one Tab stop, with the arrow keys (and Home, End) inside it: otherwise Save or Add sits 150 Tab presses past the search. Screen readers still read every row.
 * Spread `props` on the list. It sets the stops on every render, since a search or a filter changes which rows exist.
 */
export function useRovingChecks() {
  const ref = React.useRef<HTMLUListElement>(null)
  const active = React.useRef<string | null>(null)
  const boxes = () => [...(ref.current?.querySelectorAll<HTMLElement>("[role=checkbox]") ?? [])]
  const enabled = () => boxes().filter((b) => !b.hasAttribute("disabled"))
  React.useLayoutEffect(() => {
    const on = enabled()
    const stop = on.find((b) => b.id === active.current) ?? on[0]
    for (const b of boxes()) b.tabIndex = b === stop ? 0 : -1
  })
  return {
    ref,
    onFocus: (e: React.FocusEvent) => {
      if (!(e.target instanceof HTMLElement) || e.target.getAttribute("role") !== "checkbox") return
      active.current = e.target.id
      for (const b of boxes()) b.tabIndex = b === e.target ? 0 : -1
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return
      const on = enabled()
      const i = on.indexOf(document.activeElement as HTMLElement)
      if (i < 0) return
      e.preventDefault()
      const next = e.key === "Home" ? 0 : e.key === "End" ? on.length - 1 : Math.min(on.length - 1, Math.max(0, i + (e.key === "ArrowDown" ? 1 : -1)))
      on[next]?.focus()
    },
  }
}

export function useFocusBack() {
  const opener = React.useRef<HTMLElement | null>(null)
  const remember = React.useCallback((fallback?: HTMLElement | null) => {
    opener.current = openerOf(document.activeElement) ?? fallback ?? null
  }, [])
  /** Where focus is to go, when that is not what opened the surface (the row just deleted). */
  const point = React.useCallback((el: HTMLElement | null) => { opener.current = el }, [])
  const restore = React.useCallback(() => {
    const to = usable(opener.current) ? opener.current : nextControl()
    to?.focus({ preventScroll: true })
  }, [])
  const onCloseAutoFocus = React.useCallback((e: Event) => {
    e.preventDefault()
    restore()
  }, [restore])
  return { remember, point, restore, onCloseAutoFocus }
}

export type FocusBack = ReturnType<typeof useFocusBack>
