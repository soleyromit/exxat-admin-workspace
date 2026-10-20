"use client"

import * as React from "react"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import type { SyncState } from "@/lib/v2/types"

const CHIP: Record<SyncState, { label: string; tone: "info" | "success" | "warning"; icon: string }> = {
  queued: { label: "Queued", tone: "info", icon: "fa-clock" },
  synced: { label: "Synced", tone: "success", icon: "fa-circle-check" },
  failed: { label: "Failed", tone: "warning", icon: "fa-circle-exclamation" },
  conflict: { label: "Conflict", tone: "warning", icon: "fa-triangle-exclamation" },
}

export const SYNC_LABEL: Record<SyncState, string> = { queued: "Queued", synced: "Synced", failed: "Failed", conflict: "Conflict" }

/** Offline sync chip: icon plus text, never colour alone. Conflict and failed are amber, not red. Composed from the DS StatusBadge. */
export function SyncChip({ state, size = "sm" }: { state: SyncState; size?: "sm" | "md" }) {
  const c = CHIP[state]
  return <StatusBadge label={c.label} tone={c.tone} icon={c.icon} size={size} data-sync-chip={state} />
}
