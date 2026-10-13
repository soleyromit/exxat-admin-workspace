"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
// Deep path on purpose: DS components use this exact module for useTheme; the barrel export is a
// separate module instance under turbopack and its context would not satisfy them (see PCE).
import { ThemeProvider as DSThemeProvider } from "@exxatdesignux/ui/hooks/use-color-scheme"

export function ThemeProvider({
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
      <DSThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        {children}
      </DSThemeProvider>
    </NextThemesProvider>
  )
}
