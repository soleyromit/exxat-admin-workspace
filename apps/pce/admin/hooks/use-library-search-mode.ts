"use client"

/**
 * Library hub search mode — Basic (structured facets) vs Leo (natural language).
 * Shell-global standing preference, same pattern as theme / home layout.
 */

import * as React from "react"

import {
  getStorageItem,
  setStorageItem,
  subscribeToStorageKey,
} from "@exxatdesignux/ui/lib/persisted-state"

export type LibrarySearchMode = "basic" | "leo"

export const LIBRARY_SEARCH_MODES: {
  id: LibrarySearchMode
  label: string
  description: string
}[] = [
  {
    id: "basic",
    label: "Basic",
    description: "Keyword, type, and difficulty. Exact filters that show their work",
  },
  {
    id: "leo",
    label: "Leo",
    description: "Describe what you need. One ranked list across the bank",
  },
]

const STORAGE_KEY = "library-search-mode"
const VERSION = 1
const DEFAULT_MODE: LibrarySearchMode = "basic"

const listeners = new Set<() => void>()
let snapshot: LibrarySearchMode | null = null
let hydrated = false

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  const unsubscribeStorage = subscribeToStorageKey(STORAGE_KEY, () => {
    hydrated = false
    onChange()
  })
  return () => {
    listeners.delete(onChange)
    unsubscribeStorage()
  }
}

function isLibrarySearchMode(value: unknown): value is LibrarySearchMode {
  return value === "basic" || value === "leo"
}

function read(): LibrarySearchMode {
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
        isLibrarySearchMode((parsed as { d?: unknown }).d)
      ) {
        snapshot = (parsed as { d: LibrarySearchMode }).d
        return snapshot
      }
    } catch {
      // fall through
    }
  }

  snapshot = DEFAULT_MODE
  return snapshot
}

export function setLibrarySearchMode(next: LibrarySearchMode) {
  snapshot = next
  hydrated = true
  setStorageItem(STORAGE_KEY, JSON.stringify({ v: VERSION, d: next }))
  for (const listener of listeners) listener()
}

export function useLibrarySearchMode(): LibrarySearchMode {
  return React.useSyncExternalStore(subscribe, read, () => DEFAULT_MODE)
}
