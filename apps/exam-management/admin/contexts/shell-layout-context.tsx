"use client"

/**
 * ShellLayoutContext — shell-global preference for chrome layout:
 *
 *   - "sidebar-classic" (default): classic sidebar — product switcher, Ask Leo,
 *     search, notifications, settings, help, and profile all live in the
 *     sidebar (no UtilityBarSlot).
 *   - "utility-sidebar": UtilityBarSlot in the workspace column; product
 *     switcher stays in the sidebar header with TeamSwitcher.
 *   - "utility-bar": full-width UtilityBarSlot above the sidebar row; product
 *     switcher moves into the bar; sidebar header is TeamSwitcher only.
 *
 * Persisted via `usePersistedState` (shell-global, not product-namespaced).
 * Legacy stored value `"sidebar"` maps to `"utility-sidebar"` on read.
 *
 * Changed from Settings > Appearance > "Shell layout".
 */

import * as React from "react"
import { usePersistedState } from "@exxatdesignux/ui/lib/persisted-state"

export type ShellLayoutVariant = "sidebar-classic" | "utility-sidebar" | "utility-bar"

/** @deprecated Legacy persisted value — normalized to `utility-sidebar` on read. */
type LegacyShellLayoutVariant = "sidebar"

type StoredShellLayoutVariant = ShellLayoutVariant | LegacyShellLayoutVariant

export const SHELL_LAYOUT_VARIANT_KEY = "shell:layout-variant"
export const DEFAULT_SHELL_LAYOUT_VARIANT: ShellLayoutVariant = "sidebar-classic"

export function normalizeShellLayoutVariant(stored: string): ShellLayoutVariant {
  if (stored === "sidebar") return "utility-sidebar"
  if (
    stored === "sidebar-classic" ||
    stored === "utility-sidebar" ||
    stored === "utility-bar"
  ) {
    return stored
  }
  return DEFAULT_SHELL_LAYOUT_VARIANT
}

export function showsUtilityBar(variant: ShellLayoutVariant): boolean {
  return variant === "utility-sidebar" || variant === "utility-bar"
}

export function showsProductInSidebar(variant: ShellLayoutVariant): boolean {
  return variant === "sidebar-classic" || variant === "utility-sidebar"
}

export function isFullWidthUtilityBar(variant: ShellLayoutVariant): boolean {
  return variant === "utility-bar"
}

interface ShellLayoutContextValue {
  variant: ShellLayoutVariant
  setVariant: (variant: ShellLayoutVariant) => void
}

const ShellLayoutContext = React.createContext<ShellLayoutContextValue>({
  variant: DEFAULT_SHELL_LAYOUT_VARIANT,
  setVariant: () => {},
})

export function useShellLayout() {
  return React.useContext(ShellLayoutContext)
}

export function ShellLayoutProvider({ children }: { children: React.ReactNode }) {
  const [stored, setStored] = usePersistedState<StoredShellLayoutVariant>(
    SHELL_LAYOUT_VARIANT_KEY,
    DEFAULT_SHELL_LAYOUT_VARIANT,
    { debounceMs: 0 },
  )

  const variant = normalizeShellLayoutVariant(stored)

  const setVariant = React.useCallback(
    (next: ShellLayoutVariant) => setStored(next),
    [setStored],
  )

  const value = React.useMemo(() => ({ variant, setVariant }), [variant, setVariant])

  return <ShellLayoutContext.Provider value={value}>{children}</ShellLayoutContext.Provider>
}
