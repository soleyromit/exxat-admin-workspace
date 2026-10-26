"use client"

/**
 * State for the admin mapping, lists and evaluator screens. Reads the lab state through the reviewer context (so an adopt or merge
 * made in Approvals shows here, and one made here shows in Approvals) and keeps this screen's own edits in session overlays.
 */
import * as React from "react"
import { useReviewer } from "@/components/lab/reviewer/use-reviewer"
import { applyListsOverlay, diffLists, seedLists, EMPTY_LISTS_OVERLAY, type ListsOverlay, type SkillList } from "@/lib/lab/lists"
import { EMPTY_MAPPING_OVERLAY, type MappingOverlay } from "@/lib/lab/mapping"
import type { Person, V2State } from "@/lib/v2/types"
import { createSessionStore, customGroupsStore } from "./session-store"
import { demoOf, useUrlParams, type DemoState } from "./parts"

export const mappingStore = createSessionStore<MappingOverlay>("lab.admin.mapping.v1", EMPTY_MAPPING_OVERLAY)
export const listsStore = createSessionStore<ListsOverlay>("lab.admin.lists.v1", EMPTY_LISTS_OVERLAY)
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

export function useAdminData(): AdminData {
  const ctx = useReviewer()
  const query = useUrlParams()
  const demo = demoOf(query.get("state"))
  const added = addedEvaluatorsStore.use()
  const state = React.useMemo(() => (ctx.state && added.length ? { ...ctx.state, people: [...ctx.state.people, ...added] } : ctx.state), [ctx.state, added])
  return { ready: !!state && demo !== "loading", state, demo, query, retry: () => query.set({ state: null }) }
}

export function useMappingOverlay(): [MappingOverlay, (o: MappingOverlay) => void] {
  const o = mappingStore.use()
  return [o, mappingStore.set]
}

/** The program's lists with this session's edits, and a setter that stores only the difference from the seed. */
export function useLists(state: V2State | null): { lists: SkillList[]; setLists: (next: SkillList[]) => void } {
  const overlay = listsStore.use()
  const base = React.useMemo(() => (state ? seedLists(state) : []), [state])
  const lists = React.useMemo(() => applyListsOverlay(base, overlay), [base, overlay])
  const setLists = React.useCallback(
    (next: SkillList[]) => {
      const baseIds = new Set(base.map((b) => b.id))
      listsStore.set(diffLists(base, next, next.filter((l) => !baseIds.has(l.id))))
    },
    [base],
  )
  return { lists, setLists }
}
