"use client"

import * as React from "react"

/** Dispatched to open the palette from sidebar and other callers (avoid synthetic key events). */
export const OPEN_COMMAND_MENU_EVENT = "exxat:open-command-menu"

export function requestOpenCommandMenu() {
  window.dispatchEvent(new CustomEvent(OPEN_COMMAND_MENU_EVENT))
}

const CommandMenuContent = React.lazy(() =>
  import("@/components/command-menu-content").then(m => ({
    default: m.CommandMenuContent,
  })),
)

export function CommandMenu() {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  React.useEffect(() => {
    const onOpenRequest = () => setOpen(true)
    window.addEventListener(OPEN_COMMAND_MENU_EVENT, onOpenRequest)
    return () => window.removeEventListener(OPEN_COMMAND_MENU_EVENT, onOpenRequest)
  }, [])

  if (!open) return null

  return (
    <React.Suspense fallback={null}>
      <CommandMenuContent open={open} onOpenChange={setOpen} />
    </React.Suspense>
  )
}
