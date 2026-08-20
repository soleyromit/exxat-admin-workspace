"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"
// Import from the SAME deep path DS components use (e.g. nav-user.tsx uses
// "@exxatdesignux/ui/hooks/use-color-scheme"). The barrel export is a separate
// module instance under turbopack → its context wouldn't satisfy their useTheme.
import { ThemeProvider as DSThemeProvider } from "@exxatdesignux/ui/hooks/use-color-scheme"

function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {/* DS 0.6.55 components (NavUser, etc.) read ColorSchemeContext via the DS
          useTheme — mount the DS ThemeProvider here in the client boundary. */}
      <DSThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <ThemeHotkey />
        {children}
      </DSThemeProvider>
    </NextThemesProvider>
  )
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  )
}

function ThemeHotkey() {
  const { resolvedTheme, setTheme } = useTheme()

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) {
        return
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      if (event.key.toLowerCase() !== "d") {
        return
      }

      if (isTypingTarget(event.target)) {
        return
      }

      setTheme(resolvedTheme === "dark" ? "light" : "dark")
    }

    window.addEventListener("keydown", onKeyDown)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [resolvedTheme, setTheme])

  return null
}

export { ThemeProvider }
