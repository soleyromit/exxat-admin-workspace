"use client"

import * as React from "react"

/** "⌘" on Apple platforms, "Ctrl" elsewhere — for `Kbd` tooltips. */
export function useModKeyLabel() {
  const [mod, setMod] = React.useState("⌘")
  React.useEffect(() => {
    setMod(
      typeof navigator !== "undefined" && /Mac|iPhone|iPod|iPad/i.test(navigator.platform)
        ? "⌘"
        : "Ctrl",
    )
  }, [])
  return mod
}

/** "⌥" on Apple platforms, "Alt" elsewhere — pair with `useModKeyLabel` for ⌘⌥ / Ctrl+Alt chords. */
export function useAltKeyLabel() {
  const [alt, setAlt] = React.useState("⌥")
  React.useEffect(() => {
    setAlt(
      typeof navigator !== "undefined" && /Mac|iPhone|iPod|iPad/i.test(navigator.platform)
        ? "⌥"
        : "Alt",
    )
  }, [])
  return alt
}
