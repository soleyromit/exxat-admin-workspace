"use client"

// React bindings for the runtime. SSR-safe: the server and the first client render both see the seed, then the
// persisted state is loaded after mount, so there is no hydration mismatch (useSyncExternalStore server snapshot).
import * as React from "react"
import type { Db, Prefs } from "@/lib/domain/types"
import { createRuntime, type Runtime } from "./runtime"
import { buildSeed } from "@/lib/seed"

let runtime: Runtime | null = null
let serverDb: Db | null = null
let serverPrefs: Prefs | null = null

export function getRuntime(): Runtime {
  if (!runtime) runtime = createRuntime()
  return runtime
}

const getServerDb = (): Db => (serverDb ??= buildSeed())
const getServerPrefs = (): Prefs => (serverPrefs ??= getRuntime().getPrefs())

/** The whole program database. Re-renders on every committed action. */
export function useDb(): Db {
  const rt = getRuntime()
  React.useEffect(() => rt.hydrate(), [rt])
  return React.useSyncExternalStore(rt.subscribe, rt.getDb, getServerDb)
}

export function usePrefs(): Prefs {
  const rt = getRuntime()
  return React.useSyncExternalStore(rt.subscribe, rt.getPrefs, getServerPrefs)
}

/** Stable handles for actions: `const { run, reset, setPrefs } = useActions()`. */
export function useActions(): Pick<Runtime, "run" | "reset" | "setPrefs"> {
  const rt = getRuntime()
  return React.useMemo(() => ({ run: rt.run, reset: rt.reset, setPrefs: rt.setPrefs }), [rt])
}
