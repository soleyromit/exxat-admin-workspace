"use client"

import * as React from "react"
import { useV2Store } from "@/lib/v2/react"
import { ROLE_BY_ID } from "@/lib/v2/roles"
import type { Result } from "@/lib/v2/admin-actions"
import type { RoleId, V2State } from "@/lib/v2/types"

/** The staff person a /v2/<role>/... page acts as. Every write is attributed to them in the audit log. */
export function useStaff(role: RoleId) {
  const store = useV2Store()
  const actorId = ROLE_BY_ID[role].personId
  const run = React.useCallback(
    <T extends object>(fn: (s: V2State, actorId: string, at: string) => Result<T>): Result<T> => {
      const r = fn(store.getSnapshot(), actorId, new Date().toISOString())
      if (r.ok) store.update(() => r.state)
      return r
    },
    [store, actorId],
  )
  return { actorId, run }
}

export const STAFF_ROLES: RoleId[] = ["admin", "reviewer", "director"]
