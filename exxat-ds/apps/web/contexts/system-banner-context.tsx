"use client"

/**
 * SystemBannerContext — the top-of-app system banner is now user-configurable
 * from Settings. We persist the config in `localStorage` so a product owner
 * (or a demo) can preview "maintenance notice", "new feature", "promo", etc.
 * without a redeploy. In production this would be backed by an admin API, but
 * the storage shape + provider surface already match what that API would need.
 *
 * Usage:
 *   - `<SystemBannerProvider>` wraps the app in (app)/layout.tsx.
 *   - Layout reads the config via `useSystemBanner()` and renders `<SystemBanner>` only when enabled.
 *   - Settings page calls `updateConfig()` / `setEnabled()` to change it.
 */

import * as React from "react"

export type SystemBannerVariant = "info" | "warning" | "error" | "success" | "promo"

export interface SystemBannerConfig {
  enabled: boolean
  variant: SystemBannerVariant
  title: string
  message: string
  actionLabel?: string
  actionHref?: string
  dismissible: boolean
}

export const DEFAULT_SYSTEM_BANNER_CONFIG: SystemBannerConfig = {
  enabled: true,
  variant: "promo",
  title: "Exxat One Premium",
  message: "Unlock advanced analytics, AI insights, and priority support.",
  actionLabel: "Learn more",
  actionHref: "#",
  dismissible: true,
}

const STORAGE_KEY = "exxat:system-banner-config"

interface SystemBannerContextValue {
  config: SystemBannerConfig
  updateConfig: (patch: Partial<SystemBannerConfig>) => void
  setEnabled: (enabled: boolean) => void
  /** Apply an arbitrary config snapshot wholesale (used by Settings "Apply" button). */
  applyConfig: (next: SystemBannerConfig) => void
  /** Restore the shipped default. */
  reset: () => void
}

const SystemBannerContext = React.createContext<SystemBannerContextValue>({
  config: DEFAULT_SYSTEM_BANNER_CONFIG,
  updateConfig: () => {},
  setEnabled: () => {},
  applyConfig: () => {},
  reset: () => {},
})

function readStored(): SystemBannerConfig {
  if (typeof window === "undefined") return DEFAULT_SYSTEM_BANNER_CONFIG
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SYSTEM_BANNER_CONFIG
    const parsed = JSON.parse(raw) as Partial<SystemBannerConfig>
    // Merge so newly-added fields in the default keep working for old payloads.
    return { ...DEFAULT_SYSTEM_BANNER_CONFIG, ...parsed }
  } catch {
    return DEFAULT_SYSTEM_BANNER_CONFIG
  }
}

export function SystemBannerProvider({ children }: { children: React.ReactNode }) {
  // Start from default on SSR; hydrate from storage on mount so server and client markup match.
  const [config, setConfig] = React.useState<SystemBannerConfig>(DEFAULT_SYSTEM_BANNER_CONFIG)
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    setConfig(readStored())
    setHydrated(true)
  }, [])

  // Persist whenever config changes post-hydration.
  React.useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    } catch {
      /* storage full / disabled — silently ignore, the UI still works for the session. */
    }
  }, [config, hydrated])

  // Cross-tab sync — if you change the banner in one tab, others follow.
  React.useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY || !e.newValue) return
      try {
        setConfig({ ...DEFAULT_SYSTEM_BANNER_CONFIG, ...JSON.parse(e.newValue) })
      } catch {
        /* ignore malformed payloads */
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const value = React.useMemo<SystemBannerContextValue>(
    () => ({
      config,
      updateConfig: (patch) => setConfig((prev) => ({ ...prev, ...patch })),
      setEnabled: (enabled) => setConfig((prev) => ({ ...prev, enabled })),
      applyConfig: (next) => setConfig(next),
      reset: () => setConfig(DEFAULT_SYSTEM_BANNER_CONFIG),
    }),
    [config],
  )

  return <SystemBannerContext.Provider value={value}>{children}</SystemBannerContext.Provider>
}

export function useSystemBanner() {
  return React.useContext(SystemBannerContext)
}
