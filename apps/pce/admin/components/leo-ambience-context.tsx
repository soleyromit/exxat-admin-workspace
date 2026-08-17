"use client"

/**
 * Leo ambience prefs + settings-window open state.
 * Persist apply-on-change; open flag is also persisted so a reload can keep
 * the settings window parked if the user left it open (optional — we persist
 * prefs for sure; open state session-only is finer. Brief said prefs survive
 * reload — open can be ephemeral).
 */

import * as React from "react"

import { usePersistedState } from "@exxatdesignux/ui/lib/persisted-state"
import {
  LEO_AMBIENCE_DEFAULTS,
  LEO_AMBIENCE_KEY,
  clampIdleDensity,
  clampIdleGlowRadius,
  clampSearchBarOffset,
  clampThinkingBlobOpacity,
  clampThinkingOverlayDotsOpacity,
  mergeLeoAmbiencePrefs,
  type LeoAmbiencePrefs,
  type LeoBlobIntensity,
  type LeoComposerVeil,
  type LeoSearchBarWashMode,
} from "@/lib/leo-ambience"

interface LeoAmbienceContextValue {
  prefs: LeoAmbiencePrefs
  setPrefs: (next: LeoAmbiencePrefs | ((prev: LeoAmbiencePrefs) => LeoAmbiencePrefs)) => void
  patchPrefs: (partial: Partial<LeoAmbiencePrefs>) => void
  resetPrefs: () => void
  settingsOpen: boolean
  setSettingsOpen: (open: boolean) => void
  toggleSettings: () => void
  /** Session-only: force thinking chrome so settings can be tuned live. */
  previewThinking: boolean
  setPreviewThinking: (on: boolean) => void
}

const LeoAmbienceContext = React.createContext<LeoAmbienceContextValue | null>(null)

export function LeoAmbienceProvider({ children }: { children: React.ReactNode }) {
  const [stored, setStored] = usePersistedState<Partial<LeoAmbiencePrefs>>(
    LEO_AMBIENCE_KEY,
    LEO_AMBIENCE_DEFAULTS,
    { debounceMs: 200 },
  )
  const prefs = React.useMemo(() => mergeLeoAmbiencePrefs(stored), [stored])

  const setPrefs = React.useCallback(
    (next: LeoAmbiencePrefs | ((prev: LeoAmbiencePrefs) => LeoAmbiencePrefs)) => {
      setStored((prev) => {
        const current = mergeLeoAmbiencePrefs(prev)
        const resolved = typeof next === "function" ? next(current) : next
        return {
          ...resolved,
          idleDensity: clampIdleDensity(resolved.idleDensity),
          idleGlowRadius: clampIdleGlowRadius(resolved.idleGlowRadius),
          thinkingBlobOpacity: clampThinkingBlobOpacity(resolved.thinkingBlobOpacity),
          thinkingOverlayDotsOpacity: clampThinkingOverlayDotsOpacity(
            resolved.thinkingOverlayDotsOpacity,
          ),
          searchBarOffsetX: clampSearchBarOffset(resolved.searchBarOffsetX),
          searchBarOffsetY: clampSearchBarOffset(resolved.searchBarOffsetY),
        }
      })
    },
    [setStored],
  )

  const patchPrefs = React.useCallback(
    (partial: Partial<LeoAmbiencePrefs>) => {
      setPrefs((prev) => ({ ...prev, ...partial }))
    },
    [setPrefs],
  )

  const resetPrefs = React.useCallback(() => {
    setStored(LEO_AMBIENCE_DEFAULTS)
  }, [setStored])

  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const toggleSettings = React.useCallback(
    () => setSettingsOpen((v) => !v),
    [],
  )

  const [previewThinking, setPreviewThinking] = React.useState(false)

  // Drop the preview when the settings window closes so Leo does not stay
  // stuck in thinking chrome after the user is done tuning.
  React.useEffect(() => {
    if (!settingsOpen) setPreviewThinking(false)
  }, [settingsOpen])

  const value = React.useMemo<LeoAmbienceContextValue>(
    () => ({
      prefs,
      setPrefs,
      patchPrefs,
      resetPrefs,
      settingsOpen,
      setSettingsOpen,
      toggleSettings,
      previewThinking,
      setPreviewThinking,
    }),
    [
      prefs,
      setPrefs,
      patchPrefs,
      resetPrefs,
      settingsOpen,
      toggleSettings,
      previewThinking,
    ],
  )

  return (
    <LeoAmbienceContext.Provider value={value}>
      {children}
    </LeoAmbienceContext.Provider>
  )
}

export function useLeoAmbience() {
  const ctx = React.useContext(LeoAmbienceContext)
  if (!ctx) {
    throw new Error("useLeoAmbience must be used within LeoAmbienceProvider")
  }
  return ctx
}

export type { LeoAmbiencePrefs, LeoBlobIntensity, LeoComposerVeil, LeoSearchBarWashMode }
