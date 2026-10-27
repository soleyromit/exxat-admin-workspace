"use client"

/**
 * URL state for the director screens. The scope lives in the URL so every number links to a list with the same scope; the cohort
 * defaults to the graduating cohort (it is still a filter: choosing Any writes cohort=any). The director scope is not shared with
 * the admin's remembered scope. Figures are frozen at an as-of time (strategy/06 F1, F2) through the shared snapshot hook.
 * Demo states: ?state=loading|empty|clear|error|partial|stale.
 */
import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useSnapshot, asOfLabel } from "@/components/lab/dashboard/use-dashboard"
import { chipValue, parseDemoState, type DemoState } from "@/lib/lab/dashboard"
import { buildReadiness, directorFixture, directorQuery, parseDirectorScope, withClear, type Readiness } from "@/lib/lab/director"
import type { LabScope, ScopeKey } from "@/lib/lab/scope"
import type { V2State } from "@/lib/v2/types"

/** Page params kept when the scope changes. */
const PAGE_KEYS = ["variant", "state", "list", "skill", "status", "student", "view", "queue"]

export interface DirectorContext {
  ready: boolean
  scope: LabScope
  demo: DemoState | null
  model: Readiness | null
  /** The store state the figures were read from, with the lab fixture. */
  state: V2State | null
  asOf: string
  /** When the figures were read (the header subtitle's Updated time). */
  at: Date | null
  refresh: () => void
  param: (k: string) => string | null
  setScope: (next: LabScope) => void
  setParams: (p: Record<string, string | null>) => void
  chip: (k: ScopeKey, v: string) => string
}

export function useDirector(): DirectorContext {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname() ?? ""
  const snap = useSnapshot()
  const scope = React.useMemo(() => parseDirectorScope(params, snap.state), [params, snap.state])
  const demo = parseDemoState(params?.get("state"))
  const built = React.useMemo(() => (snap.state ? buildReadiness(snap.state, scope) : null), [snap.state, scope])
  const model = built && demo === "clear" ? withClear(built) : built
  const state = React.useMemo(() => (snap.state ? directorFixture(snap.state).state : null), [snap.state])

  const go = React.useCallback((q: string) => router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false }), [pathname, router])
  const setScope = React.useCallback(
    (next: LabScope) => {
      const q = new URLSearchParams(directorQuery(next))
      for (const k of PAGE_KEYS) {
        const v = params?.get(k)
        if (v) q.set(k, v)
      }
      go(q.toString())
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
      go(q.toString())
    },
    [go, params],
  )

  return {
    ready: !!model && demo !== "loading",
    scope,
    demo,
    model,
    state,
    asOf: asOfLabel(snap.at),
    at: snap.at,
    refresh: snap.refresh,
    param: (k) => params?.get(k) ?? null,
    setScope,
    setParams,
    chip: (k, v) => (snap.state ? chipValue(snap.state, k, v) : v),
  }
}
