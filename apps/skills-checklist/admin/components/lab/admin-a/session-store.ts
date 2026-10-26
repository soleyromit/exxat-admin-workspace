"use client"

/**
 * A tiny session-scoped store for lab overlays (mapping edits, list edits, added evaluators). Kept in sessionStorage so an edit survives
 * navigation between variants and screens; the v2 store is never written. One store per key.
 */
import * as React from "react"
import type { CustomGroup } from "@/lib/v2/filters"

export interface SessionStore<T> {
  get: () => T
  set: (next: T | ((prev: T) => T)) => void
  reset: () => void
  use: () => T
}

export function createSessionStore<T>(key: string, initial: T): SessionStore<T> {
  let value = initial
  let loaded = false
  const listeners = new Set<() => void>()
  const load = () => {
    if (loaded || typeof window === "undefined") return
    loaded = true
    try {
      const raw = window.sessionStorage.getItem(key)
      if (raw) value = JSON.parse(raw) as T
    } catch {
      value = initial
    }
  }
  const emit = () => listeners.forEach((l) => l())
  const save = () => {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* storage blocked: the edit lasts until reload */
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
 * Custom student groups made in Lists B this session (filter rules, CALL 10-26). The scope bar's Group filter reads the same store,
 * and a group's id is its rule value, so every page resolves the same students from the URL alone. Lives here (no other imports)
 * so the shared scope bar can read it without pulling in the admin data hooks.
 */
export const customGroupsStore = createSessionStore<CustomGroup[]>("lab.admin.groups.v1", [])
