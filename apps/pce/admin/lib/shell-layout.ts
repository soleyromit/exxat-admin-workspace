/**
 * Shell layout — compact utility bar only.
 *
 * Kept out of `shell-layout-context.tsx` / `shell-layout-menu.tsx` so those
 * modules export only React components/hooks. Mixing constants and helpers
 * with components breaks Vite Fast Refresh and remounts `App` on every edit
 * (multi‑GB Chrome tabs after a long HMR session).
 *
 * Consumer apps on an older package still ship Classic / utility-sidebar /
 * utility-bar until they upgrade and port shell files. On this package,
 * every legacy persisted id normalizes to `compact`.
 */

export type ShellLayoutVariant = "compact"

/**
 * Values that may still sit in localStorage from older packages or the
 * previous multi-layout picker. Normalized to `compact` on read.
 */
export type LegacyShellLayoutVariant =
  | "sidebar"
  | "sidebar-classic"
  | "utility-sidebar"
  | "utility-bar"

export type StoredShellLayoutVariant = ShellLayoutVariant | LegacyShellLayoutVariant

/**
 * Bumped to v3 when Compact became the only shell so prior Classic /
 * utility-bar prefs do not keep chrome on retired layouts.
 */
export const SHELL_LAYOUT_VARIANT_KEY = "shell:layout-variant:v3"
export const DEFAULT_SHELL_LAYOUT_VARIANT: ShellLayoutVariant = "compact"

export function normalizeShellLayoutVariant(stored: string): ShellLayoutVariant {
  if (stored === "compact") return "compact"
  // Any legacy id (and unknown junk) → compact.
  return DEFAULT_SHELL_LAYOUT_VARIANT
}

export function showsUtilityBar(_variant: ShellLayoutVariant = "compact"): boolean {
  return true
}

/** Full-width bar owns product; sidebar never shows the product switcher. */
export function showsProductInSidebar(_variant: ShellLayoutVariant = "compact"): boolean {
  return false
}

/** Full-width bar owns scope; sidebar never shows the school/site switcher. */
export function showsScopeInSidebar(_variant: ShellLayoutVariant = "compact"): boolean {
  return false
}

export function isFullWidthUtilityBar(_variant: ShellLayoutVariant = "compact"): boolean {
  return true
}

export function isCompactShell(_variant: ShellLayoutVariant = "compact"): boolean {
  return true
}

/**
 * Flush sidebar (`variant="sidebar"`) instead of the floating inset card.
 * Also drops the workspace gutter, since the inset margin is what the gutter
 * was aligning to.
 */
export function hasFlushSidebar(_variant: ShellLayoutVariant = "compact"): boolean {
  return true
}

/** Profile lives on the bar, not in SidebarFooter. */
export function showsProfileInSidebar(_variant: ShellLayoutVariant = "compact"): boolean {
  return false
}

/** Bar owns product, scope, and the sidebar toggle. */
export function movesSidebarHeaderToBar(_variant: ShellLayoutVariant = "compact"): boolean {
  return true
}

export interface ShellLayoutOption {
  id: ShellLayoutVariant
  label: string
  /** What actually moves. Not a restatement of the label. */
  description: string
  iconClass: string
}

/**
 * Single catalog entry — Settings / profile no longer offer a shell picker;
 * kept for docs and any host that still maps over the list.
 */
export const SHELL_LAYOUTS: ReadonlyArray<ShellLayoutOption> = [
  {
    id: "compact",
    label: "Compact",
    description:
      "The utility bar carries the breadcrumb, so there is no header row under it. Flush sidebar, square corners.",
    iconClass: "fa-compress",
  },
]
