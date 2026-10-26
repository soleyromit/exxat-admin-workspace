"use client"

/**
 * Sync vocabulary in one place: Queued, Synced, Conflict, Not sent. Glyph + word + colour; amber only for a conflict or a change
 * that did not send (the one accent). Used on Log a skill (shift log) and Offline and sync.
 * The device queue here is local lab state: resolving a conflict or sending never writes the shared store.
 */
import * as React from "react"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import type { SyncState, V2State } from "@/lib/v2/types"
import { shortDate } from "@/lib/v2/format"
import { SYNC_WORD, conflictChoices, syncCounts, syncRows, type Student2Demo, type SyncRow } from "@/lib/lab/student2"

const ICON: Record<SyncState, string> = { queued: "fa-cloud-arrow-up", synced: "fa-cloud-check", conflict: "fa-code-compare", failed: "fa-triangle-exclamation" }

export function SyncBadge({ state, count }: { state: SyncState; count?: number }) {
  const label = count === undefined ? SYNC_WORD[state] : `${count} ${SYNC_WORD[state].toLowerCase()}`
  return <StatusBadge label={label} tone={state === "conflict" || state === "failed" ? "warning" : "neutral"} icon={ICON[state]} size="sm" />
}

export type Choice = "mine" | "theirs" | "both"

export const KEPT: Record<Choice, string> = { mine: "Kept this device's version", theirs: "Kept the other version", both: "Kept both versions" }

export function useSyncQueue(s: V2State, studentId: string, demo: Student2Demo | null, offline: boolean) {
  const base = React.useMemo(() => syncRows(s, studentId, demo), [s, studentId, demo])
  const [kept, setKept] = React.useState<Record<string, Choice>>({})
  const [sent, setSent] = React.useState(false)
  const [last, setLast] = React.useState<{ label: string; choice: Choice } | null>(null)
  const rows: SyncRow[] = base.map((r) => {
    if (kept[r.id]) return { ...r, state: offline ? "queued" : "synced", conflict: null, detail: `${KEPT[kept[r.id]]}. ${offline ? "It sends when you are online." : "Reached your program."}` }
    if (sent && !offline && r.state === "queued") return { ...r, state: "synced", detail: "Reached your program." }
    return r
  })
  return {
    rows,
    counts: syncCounts(rows),
    resolve: (id: string, c: Choice) => {
      setKept((k) => ({ ...k, [id]: c }))
      setLast({ label: base.find((r) => r.id === id)?.label ?? "", choice: c })
    },
    /** The last resolution, said once as the outcome. */
    last: last ? `${KEPT[last.choice]} for ${last.label.charAt(0).toLowerCase()}${last.label.slice(1)}. ${offline ? "It sends when you are online." : "It reached your program."}` : null,
    sendAll: () => setSent(true),
    sent,
    choices: conflictChoices,
  }
}

/** One version of a conflicting value, as a term (who, when) and its value: the two versions read like two cells to compare. */
export function VersionText({ who, at, text }: { who: string; at: string; text: string }) {
  return (
    <dl className="flex min-w-0 flex-col gap-1">
      <dt className="text-xs font-medium text-muted-foreground">{`${who}${at ? `, ${shortDate(at)}` : ""}`}</dt>
      <dd className="text-sm text-foreground">{text}</dd>
    </dl>
  )
}
