import { SEED_NOW } from "@/lib/config"
import { buildSeed } from "@/lib/seed"
import type { Db } from "@/lib/domain/types"
import type { ActionCtx, Result } from "@/lib/store"

export const ctx: ActionCtx = { now: SEED_NOW }
export const seed = (): Db => buildSeed()

/** Unwrap a Result, failing the test with the error if it is not ok. */
export function must<T>(r: Result<T>): { db: Db; value: T } {
  if (!r.ok) throw new Error(`expected ok, got ${r.error.code}: ${r.error.message} ${JSON.stringify(r.error.fields ?? r.error.data ?? {})}`)
  return { db: r.db, value: r.value }
}

export function deepFreeze<T>(o: T): T {
  if (o && typeof o === "object" && !Object.isFrozen(o)) {
    Object.freeze(o)
    for (const v of Object.values(o as Record<string, unknown>)) deepFreeze(v)
  }
  return o
}
