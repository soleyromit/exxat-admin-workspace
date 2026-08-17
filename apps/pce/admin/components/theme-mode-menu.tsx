"use client"

/**
 * Color-scheme (mode) row for the profile menu — icon-only segmented control.
 * Same job as Settings → Appearance theme, reachable without leaving the menu.
 */

import { useTheme, type ColorScheme } from "@exxatdesignux/ui/hooks/use-color-scheme"

import { ButtonSegmentedControl } from "@/components/ui/button-segmented-control"
import { useAppTheme } from "@/hooks/use-app-theme"

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: "fa-light fa-sun" },
  { value: "dark", label: "Dark", icon: "fa-light fa-moon" },
  { value: "system", label: "System", icon: "fa-light fa-desktop" },
] as const

export function ThemeModeMenu() {
  const { theme, setTheme } = useTheme()
  const { mounted } = useAppTheme()
  const value = (mounted ? (theme ?? "system") : "system") as ColorScheme

  return (
    <div
      role="group"
      aria-label="Color scheme"
      className="flex items-center justify-between gap-3 px-2 py-1.5"
      /* Keep the profile menu open while tapping segments. */
      onPointerDown={(event) => event.preventDefault()}
    >
      <span className="text-sm text-foreground">Mode</span>
      <ButtonSegmentedControl
        aria-label="Color scheme"
        value={value}
        onValueChange={(next) => setTheme(next)}
        iconOnly
        tooltipSide="left"
        options={THEME_OPTIONS}
        className="shrink-0"
      />
    </div>
  )
}
