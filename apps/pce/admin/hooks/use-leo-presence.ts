"use client"

/**
 * Is the user actually with Leo right now?
 *
 * Leo's hero star breathes, twinkles, and follows the cursor, all as SVG
 * transforms driven from an animation frame loop. SVG child transforms cannot be
 * composited, so every frame of that loop costs a style recalc and a forced
 * layout — and docked beside a hub that measures its own tables and tab rows on
 * resize, it made the whole app feel heavy while Leo sat idle.
 *
 * Presence is the pointer over the panel, typing in it, or Leo working. Focus is
 * deliberately not part of it: opening the panel puts focus in the composer, so a
 * focus rule would leave the star running for every user who opens Leo and goes
 * back to their table.
 *
 * Two shapes, because two kinds of surface ask different questions:
 *
 *   default (`hover`)  A docked panel or a card. The pointer being inside it is
 *                      intent — the surface is small and the user reached for it.
 *   `activity`         A hero that owns the screen (the Leo route). The pointer
 *                      is inside it by default, so a parked cursor would mean
 *                      "forever". Presence is *movement* or typing, and a
 *                      reader who has stopped moving lets the star settle.
 */

import * as React from "react"

/**
 * How long the star stays awake after the last keystroke. Long enough to cover a
 * pause mid-sentence, short enough that an abandoned composer stops animating.
 */
export const LEO_TYPING_SETTLE_MS = 4000

/**
 * Pointer moves arrive per frame. Restarting the settle timer on every one of
 * them is wasted work when the answer ("awake") cannot change, so only the first
 * move in each of these windows re-arms it.
 */
const ACTIVITY_COALESCE_MS = 250

export type LeoPresenceOptions = {
  /**
   * Read presence as recent movement rather than a parked pointer. For heroes
   * whose surface is the whole page.
   */
  activity?: boolean
  /**
   * Count as present for this long from mount, so an arrival gesture plays
   * before the star settles. `0` (default) means the star starts at rest.
   */
  wakeOnMountMs?: number
}

export function useLeoPresence(
  working: boolean,
  { activity = false, wakeOnMountMs = 0 }: LeoPresenceOptions = {},
) {
  const [pointerWithin, setPointerWithin] = React.useState(false)
  const [awake, setAwake] = React.useState(false)
  const [arriving, setArriving] = React.useState(wakeOnMountMs > 0)
  const settleRef = React.useRef<ReturnType<typeof setTimeout>>(undefined)
  const lastNoteRef = React.useRef(0)

  const noteActivity = React.useCallback(() => {
    setAwake(true)
    clearTimeout(settleRef.current)
    settleRef.current = setTimeout(() => setAwake(false), LEO_TYPING_SETTLE_MS)
  }, [])

  // Movement fires per frame; typing and clicks are rare enough to pass through.
  const noteMove = React.useCallback(() => {
    const now = Date.now()
    if (now - lastNoteRef.current < ACTIVITY_COALESCE_MS) return
    lastNoteRef.current = now
    noteActivity()
  }, [noteActivity])

  React.useEffect(() => {
    if (wakeOnMountMs <= 0) return
    const timer = setTimeout(() => setArriving(false), wakeOnMountMs)
    return () => clearTimeout(timer)
  }, [wakeOnMountMs])

  React.useEffect(() => () => clearTimeout(settleRef.current), [])

  const presenceHandlers = React.useMemo(
    () =>
      activity
        ? {
            onPointerMove: noteMove,
            onPointerDown: noteActivity,
            onPointerLeave: () => {
              clearTimeout(settleRef.current)
              setAwake(false)
            },
            onKeyDownCapture: noteActivity,
          }
        : {
            onPointerEnter: () => setPointerWithin(true),
            onPointerLeave: () => setPointerWithin(false),
            onKeyDownCapture: noteActivity,
          },
    [activity, noteActivity, noteMove],
  )

  return {
    present: pointerWithin || awake || arriving || working,
    presenceHandlers,
  }
}
