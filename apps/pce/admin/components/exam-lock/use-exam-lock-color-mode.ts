"use client"

import * as React from "react"

import { useTheme } from "@exxatdesignux/ui/hooks/use-color-scheme"
import { useAppTheme } from "@/hooks/use-app-theme"

import type { ExamLockColorMode } from "./exam-lock-color-mode"

/** Resolve + apply exam lock color mode using persisted app theme hooks. */
export function useExamLockColorMode() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { contrastPref, setContrast, mounted } = useAppTheme()

  const colorMode = React.useMemo((): ExamLockColorMode => {
    if (!mounted) return "light"
    if (contrastPref === "high") return "hc"
    const active = theme === "system" ? resolvedTheme : theme
    return active === "dark" ? "dark" : "light"
  }, [mounted, contrastPref, theme, resolvedTheme])

  const setColorMode = React.useCallback(
    (mode: ExamLockColorMode) => {
      if (mode === "hc") {
        setContrast("high")
        return
      }
      setContrast("normal")
      setTheme(mode)
    },
    [setContrast, setTheme],
  )

  return { colorMode, setColorMode, mounted }
}

/** @deprecated Use `useExamLockColorMode`. */
export const useExamColorMode = useExamLockColorMode
