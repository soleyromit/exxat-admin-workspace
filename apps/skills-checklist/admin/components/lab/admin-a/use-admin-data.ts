"use client"

/**
 * State for the admin mapping, lists and evaluator screens. Reads the lab state through the reviewer context (so an adopt or merge
 * made in Approvals shows here, and one made here shows in Approvals) and keeps this screen's own edits in session overlays.
 */
import * as React from "react"
import { useReviewer } from "@/components/lab/reviewer/use-reviewer"
import { diffLists, programLists, seedLists, type SkillList } from "@/lib/lab/lists"
import { savedOverlay, type MappingOverlay } from "@/lib/lab/mapping"
import { useV2State, useV2Store } from "@/lib/v2/react"
import type { Person, V2State } from "@/lib/v2/types"
import { createSessionStore, customGroupsStore } from "./session-store"
import { demoOf, useUrlParams, type DemoState } from "./parts"

/** Evaluators added by name and email in this session [REQ SL-08]. */
export const addedEvaluatorsStore = createSessionStore<Person[]>("lab.admin.evaluators.v1", [])
export { customGroupsStore }

export interface AdminData {
  ready: boolean
  state: V2State | null
  demo: DemoState
  query: ReturnType<typeof useUrlParams>
  retry: () => void
}

export function useAdminData(opts: { pageFilters?: boolean } = {}): AdminData {
  const ctx = useReviewer(opts)
  const query = useUrlParams()
  const demo = demoOf(query.get("state"))
  const added = addedEvaluatorsStore.use()
  const state = React.useMemo(() => (ctx.state && added.length ? { ...ctx.state, people: [...ctx.state.people, ...added] } : ctx.state), [ctx.state, added])
  return { ready: !!state && demo !== "loading", state, demo, query, retry: () => query.set({ state: null }) }
}

/** The saved per-offering levels. They live on the shared state, so student pages, reports and readiness read the same edits. */
export function useMappingOverlay(): [MappingOverlay, (o: MappingOverlay) => void] {
  const store = useV2Store()
  const o = savedOverlay(useV2State())
  const set = React.useCallback((next: MappingOverlay) => store.update((s) => ({ ...s, offeringLevels: next })), [store])
  return [o, set]
}

/** The program's lists with their saved edits, and a setter that stores only the difference from the seed. On the shared state, like the levels. */
export function useLists(state: V2State | null): { lists: SkillList[]; setLists: (next: SkillList[]) => void } {
  const store = useV2Store()
  // `state` can be the reviewer's snapshot, which re-reads only on new evidence. The lists read the store's own edits, so a Save shows at once, not after a reload.
  const edits = useV2State().listEdits
  const lists = React.useMemo(() => (state ? programLists(state.listEdits === edits ? state : { ...state, listEdits: edits }) : []), [state, edits])
  const base = React.useMemo(() => (state && !state.ownListsOnly ? seedLists(state) : []), [state])
  const setLists = React.useCallback(
    (next: SkillList[]) => {
      const baseIds = new Set(base.map((b) => b.id))
      const listEdits = diffLists(base, next, next.filter((l) => !baseIds.has(l.id)))
      store.update((s) => ({ ...s, listEdits }))
    },
    [store, base],
  )
  return { lists, setLists }
}
