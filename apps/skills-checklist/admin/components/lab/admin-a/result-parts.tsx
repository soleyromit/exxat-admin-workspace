"use client"

/** What setup adds up to, for the Set up skills Review step (lib/lab/setup-result.ts). */
import * as React from "react"
import { useV2Hydrated, useV2State } from "@/lib/v2/react"
import { buildLibrary, countLibrary } from "@/lib/lab/library"
import { programSettingsOf } from "@/lib/lab/program-settings"
import { studentGroups } from "@/lib/lab/lists"
import { setupRecap, setupResult, type RecapRow, type SetupResult } from "@/lib/lab/setup-result"
import { useTerms } from "@/components/lab/library/use-terms"
import { customGroupsStore, useLists, useMappingOverlay } from "./use-admin-data"

export function useSetupResult(): { ready: boolean; result: SetupResult; recap: RecapRow[] } {
  useTerms()
  const state = useV2State()
  const hydrated = useV2Hydrated()
  const { lists } = useLists(hydrated ? state : null)
  const [overlay] = useMappingOverlay()
  const custom = customGroupsStore.use()
  return React.useMemo(() => {
    const rows = buildLibrary(state)
    const live = rows.filter((r) => r.status !== "inactive")
    const result = setupResult(state, lists, overlay, studentGroups(state, custom), live.map((r) => r.id))
    const counts = countLibrary(rows)
    const recap = setupRecap({
      library: { total: counts.total, notConfigured: counts.notConfigured, inactive: counts.inactive },
      categories: new Set(live.map((r) => r.category).filter(Boolean)).size,
      tags: new Set(live.flatMap((r) => r.tags ?? [])).size,
      settingsAt: programSettingsOf(state)?.at ?? null,
      lists,
      result,
    })
    return { ready: hydrated, result, recap }
  }, [state, lists, overlay, custom, hydrated])
}
