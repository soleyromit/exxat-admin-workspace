import { act } from "@testing-library/react"
import { SCENARIO } from "@/lib/seed"
import { getRuntime } from "@/lib/store/react"
import { ok, type Result } from "@/lib/store"
import type { Db, Id } from "@/lib/domain/types"

export { SCENARIO }

/** Fresh sample data and the acting student for one test. The runtime is a singleton, so every test starts here. */
export function resetStore(studentId: Id = SCENARIO.olivia, display: "four" | "merged" = "four") {
  const rt = getRuntime()
  act(() => {
    rt.reset()
    rt.setPrefs({ currentStudentId: studentId, skillStatusDisplay: display })
  })
}

export const db = (): Db => getRuntime().getDb()

/** Run a store action from a test (for example to deactivate a skill) and fail loudly if it is refused. */
export function runAction<T>(fn: (d: Db, ctx: { now: string }) => Result<T>): T {
  const rt = getRuntime()
  let out: T | undefined
  act(() => {
    const r = rt.run(fn as never) as Result<T>
    if (!r.ok) throw new Error(`action refused: ${r.error.code} ${r.error.message}`)
    out = r.value
  })
  return out as T
}

/** Replace the whole database (for empty-state tests). */
export function replaceDb(mut: (d: Db) => Db) {
  const rt = getRuntime()
  act(() => {
    rt.run((d) => ok(mut(d), null) as never)
  })
}
