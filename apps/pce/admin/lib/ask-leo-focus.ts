/**
 * Where keyboard focus goes when Leo opens, closes, minimises, or is summoned
 * back with the shortcut.
 *
 * Both Leo shells render through a portal at the end of `document.body`, so
 * they land at the very bottom of the tab order: on a hub page that is ~150
 * stops behind the sidebar, the toolbar, and every table row. Opening Leo
 * without also moving focus therefore left the window's own controls (New
 * chat, view switch, minimise, close, the suggestion cards) unreachable in
 * practice, even though each one is a perfectly focusable button.
 *
 * The window is non-modal by design, so the fix is not a focus trap. Focus
 * moves *in* on open and *back to the launcher* on close, and the shortcut
 * pulls focus in when Leo is open but the user is somewhere else on the page.
 *
 * @see components/ask-leo-window.tsx — the floating shell
 * @see components/ask-leo-context.tsx — the shortcut that summons it
 */

/** Both shells. A minimised window is `hidden`, so nothing inside it is focusable. */
const SURFACE_SELECTOR = '[data-slot="ask-leo-window"]:not([hidden]), [data-slot="ask-leo-panel"]'

/** The composer, which is what someone who just opened Leo came here to use. */
const COMPOSER_SELECTOR = '[data-slot="ask-leo-composer-input"]'

/**
 * Every control that brings Leo back, most specific first: the corner FAB only
 * exists while the window is minimised, so it wins when it is there.
 */
const LAUNCHER_SELECTORS = [
  '[data-slot="leo-launcher-fab"] button',
  '[data-slot="ask-leo-toggle"]',
]

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function askLeoSurface(): HTMLElement | null {
  if (typeof document === "undefined") return null
  return document.querySelector<HTMLElement>(SURFACE_SELECTOR)
}

export function isFocusInsideAskLeo(): boolean {
  const surface = askLeoSurface()
  return surface !== null && surface.contains(document.activeElement)
}

/**
 * Move focus into whichever shell is mounted. Lands on the composer, so the
 * common case (open Leo, ask something) needs no keystrokes; the title-bar
 * controls are then a few Shift+Tabs back rather than a lap of the page.
 */
export function focusAskLeoSurface(): boolean {
  const surface = askLeoSurface()
  if (!surface) return false
  const target =
    surface.querySelector<HTMLElement>(COMPOSER_SELECTOR) ??
    surface.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
  if (!target) return false
  target.focus()
  return true
}

/**
 * Hand focus back to the control that reopens Leo. Deferred by a frame because
 * the caller has usually just changed the state that mounts it: the corner FAB
 * does not exist until the window is minimised.
 */
export function focusAskLeoLauncher() {
  if (typeof window === "undefined") return
  window.requestAnimationFrame(() => {
    for (const selector of LAUNCHER_SELECTORS) {
      const el = document.querySelector<HTMLElement>(selector)
      if (el) {
        el.focus()
        return
      }
    }
  })
}
