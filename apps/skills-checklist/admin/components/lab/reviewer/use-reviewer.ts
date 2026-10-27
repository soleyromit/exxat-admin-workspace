"use client"

/**
 * Shared state for every reviewer screen: the shared scope in the URL (term, cohort, group, course), the as-of snapshot, the
 * reviewer's decisions, the queue rows in scope, and the demo states (?state=loading|clear|error|stale|partial|norule).
 * Approve, return, adopt or merge, and assign to someone else are written to the shared v2 store (`commitDecision`, persisted as a delta), so the Approvals
 * badge, the dashboard, student progress, director readiness and attainment change with them, in this session and after reload.
 * The session log below only lists what was decided on this tab (correction requests live only in it).
 */
import * as React from "react"
import { asOfLabel, useDashboardUrl, useSnapshot } from "@/components/lab/dashboard/use-dashboard"
import { chipValue, resolveTerm, scopeOptions, type ScopeOptions } from "@/lib/lab/dashboard"
import { commitDecision, labState, reviewRows, scopeRows, summarize, type Decision, type QueueSummary, type ReviewRow, type ScopedQueue } from "@/lib/lab/reviewer"
import type { V2State } from "@/lib/v2/types"
import { updateActiveV2Store } from "@/lib/v2/react"
import type { LabScope, ScopeKey } from "@/lib/lab/scope"

export type ReviewerDemo = "loading" | "clear" | "error" | "stale" | "partial" | "norule"
const DEMOS: ReviewerDemo[] = ["loading", "clear", "error", "stale", "partial", "norule"]

// ---------------------------------------------------------------------------------------------------------------------
// Decisions: the effect goes to the shared store; the session log remembers what was decided on this tab

const KEY = "lab.reviewer.decisions.v2"
let decisions: Decision[] = []
let loaded = false
const listeners = new Set<() => void>()

function load() {
  if (loaded) return
  loaded = true
  try {
    const raw = window.sessionStorage.getItem(KEY)
    decisions = raw ? (JSON.parse(raw) as Decision[]) : []
  } catch {
    decisions = []
  }
}
function save() {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(decisions))
  } catch {
    /* storage blocked: decisions last until reload */
  }
}
function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
const EMPTY: Decision[] = []
function snapshot(): Decision[] {
  load()
  return decisions
}

export function decide(d: Decision) {
  updateActiveV2Store((s) => commitDecision(s, d))
  load()
  decisions = [...decisions, d]
  save()
  listeners.forEach((l) => l())
}

export function resetDecisions() {
  decisions = []
  save()
  listeners.forEach((l) => l())
}

export function useDecisions(): Decision[] {
  return React.useSyncExternalStore(subscribe, snapshot, () => EMPTY)
}

// ---------------------------------------------------------------------------------------------------------------------

export interface ReviewerContext {
  ready: boolean
  /** Lab state with the reviewer's decisions applied. */
  state: V2State | null
  rows: ReviewRow[]
  scoped: ScopedQueue | null
  summary: QueueSummary | null
  scope: LabScope
  options: ScopeOptions | null
  termName: string
  asOf: string
  /** When the figures were read (the header subtitle's Updated time). */
  at: Date | null
  refresh: () => void
  fresh: boolean
  demo: ReviewerDemo | null
  decisions: Decision[]
  param: (k: string) => string | null
  setParams: (p: Record<string, string | null>) => void
  setScope: (s: LabScope) => void
  chip: (k: ScopeKey, v: string) => string
}

export function useReviewer(): ReviewerContext {
  const url = useDashboardUrl()
  const snap = useSnapshot()
  const list = useDecisions()
  const demoRaw = url.param("state")
  const demo = (DEMOS as string[]).includes(demoRaw ?? "") ? (demoRaw as ReviewerDemo) : null
  // A decision made here is not "new evidence": re-read the store at once so the queue drops the row (other screens read on load).
  const refreshRef = React.useRef(snap.refresh)
  refreshRef.current = snap.refresh
  const seen = React.useRef(list.length)
  React.useEffect(() => {
    if (list.length !== seen.current) {
      seen.current = list.length
      refreshRef.current()
    }
  }, [list.length])
  const state = React.useMemo(() => (snap.state ? labState(snap.state) : null), [snap.state])
  const rows = React.useMemo(() => (state ? reviewRows(state) : []), [state])
  const scoped = React.useMemo(() => (state ? scopeRows(state, rows, url.scope) : null), [state, rows, url.scope])
  const summary = React.useMemo(() => (scoped ? summarize(scoped.rows) : null), [scoped])
  const options = React.useMemo(() => (snap.state ? scopeOptions(snap.state, url.scope) : null), [snap.state, url.scope])
  const termName = snap.state ? resolveTerm(snap.state, url.scope).name : ""
  return {
    ready: !!state && demo !== "loading",
    state,
    rows,
    scoped,
    summary,
    scope: url.scope,
    options,
    termName,
    asOf: asOfLabel(snap.at),
    at: snap.at,
    refresh: snap.refresh,
    fresh: snap.fresh,
    demo,
    decisions: list,
    param: url.param,
    setParams: url.setParams,
    setScope: url.setScope,
    chip: (k, v) => (snap.state ? chipValue(snap.state, k, v) : v),
  }
}
