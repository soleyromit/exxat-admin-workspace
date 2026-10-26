"use client"

import * as React from "react"
import { StatusPill } from "@/components/v2/status-pill"
import type { SyncState } from "@/lib/v2/types"

export const SYNC_LABEL: Record<SyncState, string> = { queued: "Queued", synced: "Synced", failed: "Failed", conflict: "Conflict" }

/** Offline sync chip: icon plus text, never colour alone. Conflict and failed are amber, not red. Rendered by the shared StatusPill. */
export function SyncChip({ state, size = "sm" }: { state: SyncState; size?: "sm" | "md" }) {
  return <StatusPill kind="sync" value={state} size={size} data-sync-chip={state} />
}
