"use client"

/**
 * Lifecycle state for the deactivate / new list / delete screens. Deactivate, reactivate and delete write the shared v2 store
 * (lib/v2/admin-actions.ts; decisions D-X14, D-X15), so the library, dashboard, attainment and director change together. Lists
 * created here stay lab-local.
 */
import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useV2Hydrated, useV2State, useV2Store } from "@/lib/v2/react"
import { deleteSkill, setSkillsActive } from "@/lib/v2/admin-actions"
import { DEMO_TODAY, IDS } from "@/lib/v2/seed-core"
import { demoInactiveIds } from "@/lib/lab/library"
import { parseDemoState } from "@/lib/lab/dashboard"
import { defaultSkillId, retireImpact } from "@/lib/lab/retire"
import { cohortsOf } from "@/lib/v2/reports"

const at = () => `${DEMO_TODAY}T${new Date().toISOString().slice(11)}`

export function useRetire() {
  const store = useV2Store()
  const data = useV2State()
  const hydrated = useV2Hydrated()
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname() ?? ""
  const demo = parseDemoState(params?.get("state"))
  const [deleted, setDeleted] = React.useState<string[]>([])
  const [lists, setLists] = React.useState<Array<{ name: string; cohorts: string[] }>>([])
  const demoInactive = React.useMemo(() => (hydrated ? demoInactiveIds(data) : []), [hydrated, data])
  const isInactive = (id: string) => demoInactive.includes(id)
  const setActive = (id: string, active: boolean) => store.update((s) => { const r = setSkillsActive(s, [id], active, IDS.ross, at()); return r.ok ? r.state : s })
  const skillParam = params?.get("skill") ?? null
  const setSkill = (id: string | null) => {
    const q = new URLSearchParams(params?.toString() ?? "")
    if (id) q.set("skill", id)
    else q.delete("skill")
    router.replace(`${pathname}?${q.toString()}`, { scroll: false })
  }
  const impactOf = React.useCallback((id: string) => (hydrated ? retireImpact(data, id) : null), [hydrated, data])
  return {
    data,
    hydrated,
    demo,
    skillParam,
    defaultSkill: hydrated ? defaultSkillId(data) : "",
    setSkill,
    impactOf,
    cohorts: hydrated ? cohortsOf(data) : [],
    lists,
    deleted,
    isInactive,
    deactivate: (id: string) => setActive(id, false),
    reactivate: (id: string) => setActive(id, true),
    remove: (id: string) => {
      store.update((s) => { const r = deleteSkill(s, id, IDS.ross, at()); return r.ok ? r.state : s })
      setDeleted((x) => [...x, id])
    },
    addList: (name: string, cohorts: string[]) => setLists((x) => [...x, { name, cohorts }]),
  }
}
