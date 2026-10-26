"use client"

/**
 * Shared state for every dashboard variant and the drill list (strategy/06 sections 3.1 to 3.4):
 * - scope and basis live in the URL; a visit with no scope in the URL restores the viewer's last scope and writes it back,
 *   so the chips always show what applies (S5);
 * - figures are frozen at an as-of time. New evidence in the store does not move them: a quiet line says so and Refresh
 *   re-reads (F1, F2);
 * - demo states come from ?state= (loading, empty, clear, error, partial, stale).
 */
import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useV2Hydrated, useV2State } from "@/lib/v2/react"
import type { V2State } from "@/lib/v2/types"
import { DEMO_TODAY } from "@/lib/v2/seed-core"
import { shortDate } from "@/lib/v2/format"
import { parseDemoState, type DemoState, type Split } from "@/lib/lab/dashboard"
import { hasScopeInUrl, parseScope, scopeQuery, URL_KEYS, type LabScope } from "@/lib/lab/scope"

const STORE_KEY = "lab.dashboard.scope.v1"
/** Params that belong to the page, not the scope; kept when the scope changes. */
const PAGE_KEYS = ["variant", "state", "split", "q", "skills", "list", "cond", "skill", "siteId", "from", "tab", "peek"]

function readSaved(): string | null {
  try {
    return window.localStorage.getItem(STORE_KEY)
  } catch {
    return null
  }
}
function writeSaved(q: string) {
  try {
    window.localStorage.setItem(STORE_KEY, q)
  } catch {
    /* storage blocked: the URL still carries the scope */
  }
}

export interface DashboardUrl {
  scope: LabScope
  demo: DemoState | null
  split: Split
  param: (k: string) => string | null
  /** Replace the scope (keeps page params such as variant and split). */
  setScope: (next: LabScope) => void
  /** Set page params (null removes). */
  setParams: (p: Record<string, string | null>) => void
  /** The current page with these params changed (null removes), as an href for a real link. */
  hrefWith: (p: Record<string, string | null>) => string
}

export function useDashboardUrl(): DashboardUrl {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname() ?? ""
  const scope = React.useMemo(() => parseScope(params), [params])
  const demo = parseDemoState(params?.get("state"))
  const splitRaw = params?.get("split")
  const split: Split = splitRaw === "cohort" || splitRaw === "group" ? splitRaw : "none"

  const go = React.useCallback(
    (q: URLSearchParams) => {
      const s = q.toString()
      router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false })
    },
    [pathname, router],
  )

  const setScope = React.useCallback(
    (next: LabScope) => {
      const q = new URLSearchParams(scopeQuery(next))
      for (const k of PAGE_KEYS) {
        const v = params?.get(k)
        if (v) q.set(k, v)
      }
      go(q)
    },
    [go, params],
  )

  const setParams = React.useCallback(
    (p: Record<string, string | null>) => {
      const q = new URLSearchParams(params?.toString() ?? "")
      for (const [k, v] of Object.entries(p)) {
        if (v) q.set(k, v)
        else q.delete(k)
      }
      go(q)
    },
    [go, params],
  )

  const hrefWith = React.useCallback(
    (p: Record<string, string | null>) => {
      const q = new URLSearchParams(params?.toString() ?? "")
      for (const [k, v] of Object.entries(p)) {
        if (v) q.set(k, v)
        else q.delete(k)
      }
      const s = q.toString()
      return s ? `${pathname}?${s}` : pathname
    },
    [params, pathname],
  )

  // Remembered scope (S5): restore once when the URL carries none, then remember every scope the page shows.
  const restored = React.useRef(false)
  React.useEffect(() => {
    if (restored.current) return
    restored.current = true
    if (hasScopeInUrl(params)) return
    const saved = readSaved()
    if (saved) {
      const q = new URLSearchParams(saved)
      for (const k of PAGE_KEYS) {
        const v = params?.get(k)
        if (v) q.set(k, v)
      }
      go(q)
    }
  }, [go, params])
  React.useEffect(() => {
    if (!restored.current) return
    const q = new URLSearchParams()
    for (const k of URL_KEYS) {
      const v = params?.get(k)
      if (v) q.set(k, v)
    }
    writeSaved(scopeQuery(parseScope(q)))
  }, [params])

  return { scope, demo, split, param: (k) => params?.get(k) ?? null, setScope, setParams, hrefWith }
}

const fingerprint = (s: V2State) => `${s.evaluations.length}|${s.submissions.length}|${s.audit.length}|${s.evaluations.filter((e) => e.status === "counted").length}`

export interface Snapshot {
  state: V2State | null
  /** When the figures were read. */
  at: Date | null
  /** New evidence has arrived since `at`. */
  fresh: boolean
  refresh: () => void
}

/** Figures change only on Refresh (06 F2). */
export function useSnapshot(): Snapshot {
  const live = useV2State()
  const hydrated = useV2Hydrated()
  const [frozen, setFrozen] = React.useState<{ state: V2State; at: Date } | null>(null)
  React.useEffect(() => {
    if (hydrated && !frozen) setFrozen({ state: live, at: new Date() })
  }, [hydrated, frozen, live])
  const refresh = React.useCallback(() => setFrozen({ state: live, at: new Date() }), [live])
  return { state: frozen?.state ?? null, at: frozen?.at ?? null, fresh: !!frozen && fingerprint(frozen.state) !== fingerprint(live), refresh }
}

/** "Oct 26, 09:40": the demo day with the time the figures were read. */
export function asOfLabel(at: Date | null): string {
  const day = shortDate(DEMO_TODAY)
  if (!at) return day
  const t = at.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  return `${day}, ${t}`
}
export const timeLabel = (at: Date | null): string => (at ? at.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "")

/** How long a list may show its loading shape before it says it did not load (never a skeleton forever). */
export const LOAD_TIMEOUT_MS = 8000

/**
 * True once `ready` has stayed false for `ms`. `reset` restarts the clock (the banner's Try again). Bounded loading for the
 * drill lists: the store normally hydrates in well under a second, so a still-missing model after the timeout is a failure.
 */
export function useLoadTimeout(ready: boolean, ms: number = LOAD_TIMEOUT_MS): { timedOut: boolean; reset: () => void } {
  const [attempt, setAttempt] = React.useState(0)
  const [timedOut, setTimedOut] = React.useState(false)
  React.useEffect(() => {
    if (ready) {
      setTimedOut(false)
      return
    }
    const t = window.setTimeout(() => setTimedOut(true), ms)
    return () => window.clearTimeout(t)
  }, [ready, ms, attempt])
  const reset = React.useCallback(() => {
    setTimedOut(false)
    setAttempt((a) => a + 1)
  }, [])
  return { timedOut, reset }
}
