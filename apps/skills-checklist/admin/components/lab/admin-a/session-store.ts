"use client"

/**
 * A tiny store for lab overlays (mapping edits, list edits, added evaluators, custom groups). Kept in sessionStorage by default so an
 * edit survives navigation between variants and screens; `{ persist: "local" }` keeps it in localStorage instead, so it survives a
 * reload and is shared by every tab (another tab's write arrives through the storage event). Every storage read and write is
 * guarded: blocked or full storage keeps the value in memory for this page. SSR safe: the server snapshot is always `initial`, and
 * the stored value is read on the client only, after hydration (useSyncExternalStore's server snapshot), so markup never mismatches.
 * One store per key.
 */
import * as React from "react"
import type { CustomGroup } from "@/lib/v2/filters"

export interface SessionStore<T> {
  get: () => T
  set: (next: T | ((prev: T) => T)) => void
  reset: () => void
  use: () => T
}

export interface StoreOptions {
  /** "session" (default): this tab, until it closes. "local": every tab, across reloads. */
  persist?: "session" | "local"
}

/** The browser storage for a store, or null when there is none or it is blocked (private window, disabled site data). */
function storageFor(persist: "session" | "local"): Storage | null {
  if (typeof window === "undefined") return null
  try {
    return persist === "local" ? window.localStorage : window.sessionStorage
  } catch {
    return null
  }
}

export function createSessionStore<T>(key: string, initial: T, opts: StoreOptions = {}): SessionStore<T> {
  const persist = opts.persist ?? "session"
  let value = initial
  let loaded = false
  let watching = false
  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach((l) => l())
  const readStored = (): T => {
    try {
      const raw = storageFor(persist)?.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  }
  const load = () => {
    if (loaded || typeof window === "undefined") return
    loaded = true
    value = readStored()
    // Another tab wrote this key: take its value (localStorage only fires the event in the other tabs).
    if (persist === "local" && !watching) {
      watching = true
      window.addEventListener("storage", (e) => {
        if (e.key !== key) return
        value = readStored()
        emit()
      })
    }
  }
  const save = () => {
    try {
      storageFor(persist)?.setItem(key, JSON.stringify(value))
    } catch {
      /* storage blocked or full: the edit lasts until reload */
    }
  }
  const get = () => {
    load()
    return value
  }
  const set = (next: T | ((prev: T) => T)) => {
    load()
    value = typeof next === "function" ? (next as (p: T) => T)(value) : next
    save()
    emit()
  }
  const reset = () => set(initial)
  const subscribe = (fn: () => void) => {
    listeners.add(fn)
    return () => {
      listeners.delete(fn)
    }
  }
  const use = () => React.useSyncExternalStore(subscribe, get, () => initial)
  return { get, set, reset, use }
}

/**
 * Custom student groups made in Lists B (filter rules, CALL 10-26), kept in localStorage so they survive reloads and appear in every
 * tab. The scope bar's Group filter reads the same store,
 * and a group's id is its rule value, so every page resolves the same students from the URL alone. Lives here (no other imports)
 * so the shared scope bar can read it without pulling in the admin data hooks.
 */
export const CUSTOM_GROUPS_KEY = "lab.admin.groups.v1"
export const customGroupsStore = createSessionStore<CustomGroup[]>(CUSTOM_GROUPS_KEY, [], { persist: "local" })
