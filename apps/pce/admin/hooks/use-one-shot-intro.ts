import * as React from "react"

/**
 * Ceiling for how long an intro may claim to still be running.
 *
 * Deliberately longer than any intro this drives, because it is a safety net
 * rather than a schedule: the animation's own `animationend` is what normally
 * ends the intro, and this only has to fire when that event cannot. Being late
 * is harmless; being early would cut a running animation off mid-bloom.
 */
const INTRO_CEILING_MS = 2400

/**
 * Intro ids already spent in this page load.
 *
 * Module scope, not `sessionStorage`: "once per page load" is the intent, so the
 * record should die with the document. It exists because component state cannot
 * answer the question being asked — a component that unmounts on one route and
 * remounts on another gets fresh state and would replay its arrival on every
 * visit, which is the thing an arrival animation must not do.
 */
const spentIntros = new Set<string>()

/**
 * One-shot arrival: `active` starts true and goes false for good.
 *
 * Callers hang a mount animation off `active` and call `end` from
 * `animationend`. The timer is not a duplicate of that event — it is the only
 * thing that ends the intro when the animation never runs at all, and there are
 * three ordinary ways for that to happen:
 *
 * - `prefers-reduced-motion`, where the stylesheet cancels the animation
 * - `forced-colors`, where the animated element is hidden outright
 * - a background tab at mount, where animations are throttled or skipped
 *
 * Without it, anything gated on the intro being *over* — the Ask Leo chip's
 * resting glow, for one — would stay in its pre-arrival state permanently for
 * exactly the users least able to afford a missing affordance.
 *
 * Pass an `id` when the animating element can unmount and come back inside one
 * page load, and the arrival should not play again when it does. Call this hook
 * in the component that owns the animated element rather than an ancestor that
 * outlives it: an ancestor starts the clock while the element is absent, and by
 * the time it mounts the intro is already spent on nothing.
 */
export function useOneShotIntro(id?: string): { active: boolean; end: () => void } {
  const [active, setActive] = React.useState(
    () => id === undefined || !spentIntros.has(id),
  )

  const end = React.useCallback(() => {
    if (id !== undefined) spentIntros.add(id)
    setActive(false)
  }, [id])

  React.useEffect(() => {
    if (!active) return
    const timer = window.setTimeout(end, INTRO_CEILING_MS)
    return () => window.clearTimeout(timer)
  }, [active, end])

  return { active, end }
}
