"use client"

/**
 * Which shape the products home takes.
 *
 * Two audiences land on the same route. Someone evaluating Exxat wants the
 * shelves; someone who owns two products and will never buy a third wants a
 * door and nothing else. Rather than average the two into a page that serves
 * neither, `/home` renders one of four bodies and the person picks.
 *
 * Storefront and Focus are both shelves, differing only in how much catalog
 * they show. Spotlight is the third answer: one live mosaic that says what is
 * waiting before it says what exists. See `spotlight-home.tsx` for why.
 *
 * Launcher is the fourth: an icon-first grid of every app you own (Okta's
 * dashboard, the Salesforce App Launcher, the Microsoft 365 waffle) plus the
 * rest of the catalog shown inline rather than behind a disclosure — this is
 * the one variant that treats cross-sell as a real job of the page instead
 * of an afterthought. No activity feed; that stays Spotlight's job.
 *
 * Set from the profile menu (which navigates to `/home/<variant>`), or by
 * opening that URL directly. Preference is still persisted so `/home` can
 * redirect to the last layout you used.
 *
 * Shell-global key on purpose. Home is a shell route, not a product one, so
 * `productPersistKey` would be inventing a distinction the page does not have
 * (`exxat-persisted-state.mdc`).
 */

import * as React from "react"

import {
  getStorageItem,
  setStorageItem,
  subscribeToStorageKey,
} from "@exxatdesignux/ui/lib/persisted-state"

export type HomeVariant = "storefront" | "focus" | "spotlight" | "launcher"

export const HOME_VARIANTS: { id: HomeVariant; label: string; description: string }[] = [
  {
    id: "storefront",
    label: "Storefront",
    description: "Your apps, plus everything else Exxat makes",
  },
  {
    id: "focus",
    label: "Focus",
    description: "Just your apps. Everything else is one click away",
  },
  {
    id: "spotlight",
    label: "Spotlight",
    description: "Type where you are going. Your day on one side, what is new on the other",
  },
  {
    id: "launcher",
    label: "Launcher",
    description: "Every app as an icon grid, plus what else Exxat makes",
  },
]

const STORAGE_KEY = "home-variant"
const VERSION = 1
const DEFAULT_VARIANT: HomeVariant = "storefront"

/** Canonical URL for a home layout — each approach is its own link. */
export function homeVariantPath(variant: HomeVariant): string {
  return `/home/${variant}`
}

export function isHomeVariant(value: unknown): value is HomeVariant {
  return (
    value === "storefront" ||
    value === "focus" ||
    value === "spotlight" ||
    value === "launcher"
  )
}

/**
 * Variant encoded in a `/home/:segment` path, or `null` when the segment is a
 * product marketing slug (or missing).
 */
export function homeVariantFromPathname(pathname: string): HomeVariant | null {
  const match = pathname.match(/^\/home\/([^/]+)\/?$/)
  if (!match) return null
  return isHomeVariant(match[1]) ? match[1] : null
}

const listeners = new Set<() => void>()
let snapshot: HomeVariant | null = null
let hydrated = false

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  // The set covers this document; the storage event covers the other tabs,
  // which is the half `usePersistedState` would have given us for free.
  const unsubscribeStorage = subscribeToStorageKey(STORAGE_KEY, () => {
    hydrated = false
    onChange()
  })
  return () => {
    listeners.delete(onChange)
    unsubscribeStorage()
  }
}

function read(): HomeVariant {
  if (hydrated && snapshot) return snapshot
  hydrated = true

  const raw = getStorageItem(STORAGE_KEY)
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw)
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        (parsed as { v?: number }).v === VERSION &&
        isHomeVariant((parsed as { d?: unknown }).d)
      ) {
        snapshot = (parsed as { d: HomeVariant }).d
        return snapshot
      }
    } catch {
      // Unparseable payload — fall through to the default.
    }
  }

  snapshot = DEFAULT_VARIANT
  return snapshot
}

export function setHomeVariant(next: HomeVariant) {
  snapshot = next
  hydrated = true
  setStorageItem(STORAGE_KEY, JSON.stringify({ v: VERSION, d: next }))
  for (const listener of listeners) listener()
}

export function useHomeVariant(): HomeVariant {
  return React.useSyncExternalStore(subscribe, read, () => DEFAULT_VARIANT)
}
