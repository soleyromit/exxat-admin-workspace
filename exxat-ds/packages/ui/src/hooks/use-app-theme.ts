"use client"

/**
 * useAppTheme — Manages theme dimensions beyond light/dark:
 *   • Brand      : "one" (Lavender) | "prism" (Rose)
 *   • Contrast   : "system" | "normal" | "high"
 *   • Text size  : "compact" | "default" | "large" — root rem scale (industry pattern:
 *                  iOS “Larger Text”, Android font scale, Gmail/Slack density). Default keeps
 *                  16px root; compact/large adjust modestly with xs clamped to 11px in CSS.
 *
 * Persists to localStorage; applies class / data-* on <html>.
 * Use alongside `useTheme()` from next-themes for light / dark / system.
 */

import { useCallback, useEffect, useState } from "react"

export type Brand = "one" | "prism"

/** What the user explicitly picks (or "system" to follow OS). */
export type ContrastPreference = "system" | "normal" | "high"

/** The resolved mode actually applied to the DOM. */
export type ContrastMode = "normal" | "high"

/** UI text scale at the document root (rem-based UI tracks together). */
export type TextSizePreference = "compact" | "default" | "large"

const BRAND_KEY      = "exxat-brand"
const CONTRAST_KEY   = "exxat-contrast"
const TEXT_SIZE_KEY  = "exxat-text-size"

const MQ = "(prefers-contrast: more)"

function getOsContrast(): ContrastMode {
  if (typeof window === "undefined") return "normal"
  return window.matchMedia(MQ).matches ? "high" : "normal"
}

function resolveContrast(pref: ContrastPreference): ContrastMode {
  if (pref === "system") return getOsContrast()
  return pref
}

function applyBrand(brand: Brand) {
  const html = document.documentElement
  html.classList.remove("theme-one", "theme-prism")
  html.classList.add(`theme-${brand}`)
}

function applyContrast(mode: ContrastMode) {
  document.documentElement.setAttribute(
    "data-contrast",
    mode === "high" ? "high" : "off",
  )
}

function applyTextSize(pref: TextSizePreference) {
  const html = document.documentElement
  if (pref === "default") {
    html.removeAttribute("data-text-size")
  } else {
    html.setAttribute("data-text-size", pref)
  }
}

export function useAppTheme() {
  const [brand, setBrandState] = useState<Brand>("one")
  const [contrastPref, setContrastPrefState] = useState<ContrastPreference>("system")
  const [resolvedContrast, setResolvedContrast] = useState<ContrastMode>("normal")
  const [textSizePref, setTextSizePrefState] = useState<TextSizePreference>("default")
  const [mounted, setMounted] = useState(false)

  /* Hydrate from localStorage on first client render */
  useEffect(() => {
    setMounted(true)
    const storedBrand = (localStorage.getItem(BRAND_KEY) as Brand) ?? "one"
    const storedPref  = (localStorage.getItem(CONTRAST_KEY) as ContrastPreference | null) ?? "system"
    const storedText =
      (localStorage.getItem(TEXT_SIZE_KEY) as TextSizePreference | null) ?? "default"

    setBrandState(storedBrand)
    setContrastPrefState(storedPref)
    setTextSizePrefState(storedText)
    applyBrand(storedBrand)

    const resolved = resolveContrast(storedPref)
    setResolvedContrast(resolved)
    applyContrast(resolved)
    applyTextSize(storedText)
  }, [])

  /* Listen for OS contrast changes when preference is "system" */
  useEffect(() => {
    if (contrastPref !== "system") return

    const mql = window.matchMedia(MQ)
    function onChange() {
      const resolved = getOsContrast()
      setResolvedContrast(resolved)
      applyContrast(resolved)
    }
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [contrastPref])

  const setBrand = useCallback((b: Brand) => {
    setBrandState(b)
    localStorage.setItem(BRAND_KEY, b)
    applyBrand(b)
  }, [])

  const setContrast = useCallback((pref: ContrastPreference) => {
    setContrastPrefState(pref)
    localStorage.setItem(CONTRAST_KEY, pref)
    const resolved = resolveContrast(pref)
    setResolvedContrast(resolved)
    applyContrast(resolved)
  }, [])

  const setTextSize = useCallback((pref: TextSizePreference) => {
    setTextSizePrefState(pref)
    localStorage.setItem(TEXT_SIZE_KEY, pref)
    applyTextSize(pref)
  }, [])

  return {
    brand,
    setBrand,
    /** The user's preference: "system" | "normal" | "high" */
    contrastPref,
    /** The resolved contrast mode actually applied to the DOM. */
    contrast: resolvedContrast,
    /** Set the contrast preference. */
    setContrast,
    /** Text scale: "compact" | "default" | "large" */
    textSizePref,
    setTextSize,
    mounted,
  }
}
