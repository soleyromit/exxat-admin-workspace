"use client"

/**
 * The new program's data scope (D-L44): a store with its own key and seed, and the session space its lists and mapping edits
 * live in. Set up skills renders inside it; so does any lab page opened with `?program=new`, which is where Save and exit and
 * Finish land (bug fix 2026-11-04: exit used to land on the seeded program's Library, so the admin's own skills were gone).
 * The space is set before the children render and handed back when they leave.
 */
import * as React from "react"
import { useSearchParams } from "next/navigation"
import { V2StoreProvider } from "@/lib/v2/react"
import { createV2Store, type V2Store } from "@/lib/v2/store"
import { NEW_PROGRAM_SPACE, NEW_PROGRAM_STORE_KEY, newProgramSeed } from "@/lib/lab/new-program"
import { setSessionSpace } from "@/components/lab/admin-a/session-store"
import { addedEvaluatorsStore } from "@/components/lab/admin-a/use-admin-data"
import { SETUP_STORAGE_KEY } from "@/lib/lab/setup-wizard"

/** The URL param that opens a lab page on the new program. */
export const PROGRAM_PARAM = "program"
export const NEW_PROGRAM = "new"

/** The lab bar's Start over, in the setup flow: the new program goes back to empty, and so does the saved progress. */
export function resetNewProgram(store: V2Store) {
  store.reset()
  addedEvaluatorsStore.reset()
  try { window.localStorage.removeItem(SETUP_STORAGE_KEY) } catch { /* blocked storage */ }
}

const NewProgramContext = React.createContext(false)

/** True inside the new program's scope: the setup flow, where the landing Library and step 1 share one list. */
export const useIsNewProgram = (): boolean => React.useContext(NewProgramContext)

export function NewProgramScope({ children, onStore }: { children: React.ReactNode; onStore?: (store: V2Store) => void }) {
  const [store] = React.useState(() => createV2Store({ key: NEW_PROGRAM_STORE_KEY, seed: newProgramSeed }))
  const [ready, setReady] = React.useState(false)
  React.useLayoutEffect(() => {
    setSessionSpace(NEW_PROGRAM_SPACE)
    onStore?.(store)
    setReady(true)
    return () => setSessionSpace("")
  }, [store, onStore])
  if (!ready) return null
  return (
    <NewProgramContext.Provider value>
      <V2StoreProvider store={store}>{children}</V2StoreProvider>
    </NewProgramContext.Provider>
  )
}

/** On a lab page: the new program when the URL says `?program=new`, else the page as it is (the seeded program). */
export function ProgramScope({ children }: { children: React.ReactNode }) {
  const params = useSearchParams()
  if (params?.get(PROGRAM_PARAM) !== NEW_PROGRAM) return <>{children}</>
  return <NewProgramScope>{children}</NewProgramScope>
}
