"use client"

import * as React from "react"
import { createV2Store, STORAGE_KEY, type V2Store } from "./store"
import type { V2State } from "./types"

const StoreContext = React.createContext<V2Store | null>(null)

/** One store per browser tab, persisted to localStorage (guarded). Hydrates after mount so server and client markup match. */
export function V2StoreProvider({ children, store }: { children: React.ReactNode; store?: V2Store }) {
  const [s] = React.useState<V2Store>(() => store ?? createV2Store())
  React.useEffect(() => {
    s.hydrate()
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) s.reload()
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [s])
  return <StoreContext.Provider value={s}>{children}</StoreContext.Provider>
}

export function useV2Store(): V2Store {
  const s = React.useContext(StoreContext)
  if (!s) throw new Error("useV2Store must be used inside V2StoreProvider")
  return s
}

export function useV2State(): V2State {
  const s = useV2Store()
  return React.useSyncExternalStore(s.subscribe, s.getSnapshot, s.getServerSnapshot)
}

export function useV2Hydrated(): boolean {
  const s = useV2Store()
  return React.useSyncExternalStore(s.subscribe, s.isHydrated, () => false)
}
