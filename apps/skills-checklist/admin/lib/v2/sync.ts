import type { Result } from "./admin-actions"
import { IDS } from "./seed"
import { appendAudit } from "./store"
import type { DeviceState, SyncConflict, SyncItem, V2State } from "./types"

/**
 * Stage 2: the student's phone saves first and sends later. Every change becomes a sync item. The state machine:
 *
 *   (new) -> queued -> synced
 *                  \-> failed -> (retry) -> synced | failed | conflict
 *                  \-> conflict -> (resolve) -> queued -> synced
 *   synced -> conflict   (a newer server edit arrives)
 *
 * Offline or signed out leaves every state as it is: nothing is lost and nothing is blocked. All of this is [PROPOSED].
 */

export type SyncBlock = "offline" | "signed-out"

export const BLOCK_TEXT: Record<SyncBlock, string> = {
  offline: "You are offline.",
  "signed-out": "You are signed out.",
}

export function syncBlock(d: DeviceState): SyncBlock | null {
  return d.offline ? "offline" : d.signedOut ? "signed-out" : null
}

const nextId = (prefix: string, ids: string[]): string => {
  const max = ids.reduce((m, id) => (id.startsWith(`${prefix}-`) && /^\d+$/.test(id.slice(prefix.length + 1)) ? Math.max(m, Number(id.slice(prefix.length + 1))) : m), 0)
  return `${prefix}-${max + 1}`
}

export const nextItemId = (s: V2State) => nextId("sy", s.syncQueue.map((i) => i.id))

/** Saves a change on the device. It starts queued and is sent by flushQueue. */
export function queueChange(s: V2State, item: { studentId: string; label: string; entryId?: string; requestId?: string }, at: string): { state: V2State; id: string } {
  const id = nextItemId(s)
  const next: SyncItem = { id, studentId: item.studentId, label: item.label, state: "queued", at, attempts: 0, ...(item.entryId ? { entryId: item.entryId } : {}), ...(item.requestId ? { requestId: item.requestId } : {}) }
  return { state: { ...s, syncQueue: [...s.syncQueue, next] }, id }
}

export interface FlushResult {
  attempted: number
  synced: number
  failed: number
  conflicts: number
  blocked: SyncBlock | null
}

const none: FlushResult = { attempted: 0, synced: 0, failed: 0, conflicts: 0, blocked: null }

const FAIL_TEXT = "The server did not take this change. It is still saved on this phone. Try again."

/** Applies a synced request item: a request saved on the device is now with its evaluator, or in the review queue for a paper form. */
function deliverRequest(s: V2State, requestId: string): V2State {
  return {
    ...s,
    submissions: s.submissions.map((x) => (x.id === requestId && x.status === "on-device" ? { ...x, status: x.method === "photo" ? "awaiting-review" : "with-evaluator" } : x)),
  }
}

/**
 * Tries to send waiting items (queued or failed). `onlyIds` narrows to chosen items for a single retry. Does nothing while the
 * phone is offline or signed out, and says why. A demo "next sync fails" flag fails every attempted item once.
 */
export function flushQueue(s: V2State, at: string, onlyIds?: string[], actorId: string = IDS.maya): { state: V2State; result: FlushResult } {
  const waiting = s.syncQueue.filter((i) => i.studentId === actorId && (i.state === "queued" || i.state === "failed") && (!onlyIds || onlyIds.includes(i.id)))
  if (waiting.length === 0) return { state: s, result: none }
  const block = syncBlock(s.device)
  if (block) return { state: s, result: { ...none, blocked: block } }

  const ids = new Set(waiting.map((i) => i.id))
  if (s.device.failNextSync) {
    const syncQueue = s.syncQueue.map((i) => (ids.has(i.id) ? { ...i, state: "failed" as const, attempts: (i.attempts ?? 0) + 1, error: FAIL_TEXT } : i))
    const state = appendAudit({ ...s, syncQueue, device: { ...s.device, failNextSync: false } }, actorId, "Sync failed, changes kept on the phone", `${waiting.length} ${waiting.length === 1 ? "change" : "changes"}`, at)
    return { state, result: { attempted: waiting.length, synced: 0, failed: waiting.length, conflicts: 0, blocked: null } }
  }

  let state = s
  let synced = 0
  let conflicts = 0
  for (const item of waiting) {
    const entry = item.entryId ? state.logEntries.find((e) => e.id === item.entryId) : undefined
    if (item.serverEdit) {
      const field = item.serverEdit.field
      const conflict: SyncConflict = { field, mine: entry ? (field === "note" ? entry.note : (entry.rating ?? "")) : "", theirs: item.serverEdit.value, theirsAt: item.serverEdit.at, theirsBy: item.serverEdit.by }
      state = { ...state, syncQueue: state.syncQueue.map((i) => (i.id === item.id ? { ...i, state: "conflict", conflict, serverEdit: undefined, error: undefined, attempts: (i.attempts ?? 0) + 1 } : i)) }
      state = appendAudit(state, actorId, "Sync found a conflict", item.label, at)
      conflicts++
      continue
    }
    state = { ...state, syncQueue: state.syncQueue.map((i) => (i.id === item.id ? { ...i, state: "synced", error: undefined, attempts: (i.attempts ?? 0) + 1 } : i)) }
    if (item.requestId) state = deliverRequest(state, item.requestId)
    state = appendAudit(state, actorId, "Synced change", item.label, at)
    synced++
  }
  return { state, result: { attempted: waiting.length, synced, failed: 0, conflicts, blocked: null } }
}

export function retryItem(s: V2State, itemId: string, at: string, actorId: string = IDS.maya) {
  return flushQueue(s, at, [itemId], actorId)
}

export interface DevicePatch extends Partial<DeviceState> {}

const DEVICE_AUDIT: Array<[keyof DeviceState, boolean, string]> = [
  ["offline", true, "Went offline (demo control)"],
  ["offline", false, "Went online (demo control)"],
  ["signedOut", true, "Signed out (demo control)"],
  ["signedOut", false, "Signed in (demo control)"],
  ["updatePending", true, "Marked an app update as pending (demo control)"],
  ["updatePending", false, "Installed the app update (demo control)"],
  ["failNextSync", true, "Set the next sync to fail (demo control)"],
]

/**
 * Changes the demo toggles of the phone. Going online or signing in sends whatever is waiting. An update that is pending never
 * blocks anything, and signing in never redirects: there is no login loop and no false update-required wall.
 */
export function setDevice(s: V2State, patch: DevicePatch, at: string, actorId: string = IDS.maya): { state: V2State; flush: FlushResult | null } {
  let state = s
  for (const key of Object.keys(patch) as Array<keyof DeviceState>) {
    const value = patch[key]
    if (value === undefined || state.device[key] === value) continue
    state = { ...state, device: { ...state.device, [key]: value } }
    const row = DEVICE_AUDIT.find(([k, v]) => k === key && v === value)
    if (row) state = appendAudit(state, actorId, row[2], "Student phone", at)
  }
  if (state === s) return { state: s, flush: null }
  const reconnecting = (patch.offline === false && s.device.offline) || (patch.signedOut === false && s.device.signedOut)
  if (reconnecting && !syncBlock(state.device)) {
    const r = flushQueue(state, at, undefined, actorId)
    return { state: r.state, flush: r.result }
  }
  return { state, flush: null }
}

/** The kind of change another device could have made to the item that was edited last. */
const THEIRS_NOTE = "Edited on your other device: the preceptor stayed for the whole procedure."

/**
 * Demo control: pretend another device changed the entry that was edited last. A waiting item becomes a conflict the next time it
 * syncs; an item that already synced becomes a conflict at once.
 */
export function simulateServerEdit(s: V2State, at: string, actorId: string = IDS.maya): Result<{ itemId: string }> {
  const candidates = s.syncQueue.filter((i) => i.studentId === actorId && i.entryId && i.state !== "conflict" && s.logEntries.some((e) => e.id === i.entryId))
  const item = candidates[candidates.length - 1]
  if (!item) return { ok: false, error: "There is nothing to change yet. Log a skill first, then simulate an edit from another device." }
  const entry = s.logEntries.find((e) => e.id === item.entryId)
  if (!entry) return { ok: false, error: "That entry is no longer on this phone." }
  const skill = s.skills.find((k) => k.id === entry.skillId)
  const useNote = entry.note.trim().length > 0
  const levels = skill?.config?.levels.filter((l) => l.trim()) ?? []
  const other = levels.find((l) => l !== entry.rating)
  if (!useNote && !other) return { ok: false, error: "That entry has no note or rating to change. Add a note when you log, then try again." }
  const edit = useNote ? { field: "note" as const, value: THEIRS_NOTE } : { field: "rating" as const, value: other as string }
  const full = { ...edit, at, by: "Your other device" }
  if (item.state === "synced") {
    const conflict: SyncConflict = { field: edit.field, mine: useNote ? entry.note : (entry.rating ?? ""), theirs: edit.value, theirsAt: at, theirsBy: full.by }
    const syncQueue = s.syncQueue.map((i) => (i.id === item.id ? { ...i, state: "conflict" as const, conflict } : i))
    return { ok: true, state: appendAudit({ ...s, syncQueue }, actorId, "Another device changed a synced entry (demo control)", item.label, at), itemId: item.id }
  }
  const syncQueue = s.syncQueue.map((i) => (i.id === item.id ? { ...i, serverEdit: full } : i))
  return { ok: true, state: appendAudit({ ...s, syncQueue }, actorId, "Another device changed a waiting entry (demo control)", item.label, at), itemId: item.id }
}

export type Resolution = "mine" | "theirs" | "both"

export const RESOLUTION_TEXT: Record<Resolution, string> = {
  mine: "Kept this phone's version",
  theirs: "Kept the server's version",
  both: "Kept both versions",
}

/** Whether a resolution is valid for a field. A rating is one level, so only one version can stay. */
export function resolutionAllowed(field: SyncConflict["field"], choice: Resolution): { ok: boolean; reason?: string } {
  if (field === "rating" && choice === "both") return { ok: false, reason: "A skill has one self-rating, so only one version can stay. Choose this phone or the server." }
  return { ok: true }
}

/**
 * Resolves a conflict into the store. The chosen value is written to the log entry, the item goes back to queued (a resolution
 * is a new change) and is sent straight away when the phone can sync. An audit entry records what was kept.
 */
export function resolveConflict(s: V2State, itemId: string, choice: Resolution, at: string, actorId: string = IDS.maya): Result<{ flush: FlushResult }> {
  const item = s.syncQueue.find((i) => i.id === itemId)
  if (!item || item.state !== "conflict" || !item.conflict) return { ok: false, error: "That conflict is already resolved or no longer exists." }
  const allowed = resolutionAllowed(item.conflict.field, choice)
  if (!allowed.ok) return { ok: false, error: allowed.reason ?? "That choice is not available." }
  const c = item.conflict
  const value = choice === "mine" ? c.mine : choice === "theirs" ? c.theirs : `${c.theirs}\n\n${c.mine}`
  const logEntries = s.logEntries.map((e) => (e.id === item.entryId ? (c.field === "note" ? { ...e, note: value } : { ...e, rating: value }) : e))
  const syncQueue = s.syncQueue.map((i) => (i.id === itemId ? { ...i, state: "queued" as const, conflict: undefined, serverEdit: undefined, error: undefined } : i))
  let state = appendAudit({ ...s, logEntries, syncQueue }, actorId, `Resolved sync conflict: ${RESOLUTION_TEXT[choice].toLowerCase()}`, item.label, at)
  const r = flushQueue(state, at, [itemId], actorId)
  state = r.state
  return { ok: true, state, flush: r.result }
}

export interface SyncSummary {
  queued: number
  synced: number
  failed: number
  conflict: number
  /** Queued plus failed: what has not reached the program yet. */
  waiting: number
  /** The state the always-visible chip shows: the one that needs the most attention. */
  chip: "conflict" | "failed" | "queued" | "synced"
  headline: string
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

export function syncSummary(s: V2State, studentId: string = IDS.maya): SyncSummary {
  const mine = s.syncQueue.filter((i) => i.studentId === studentId)
  const count = (st: SyncItem["state"]) => mine.filter((i) => i.state === st).length
  const queued = count("queued")
  const synced = count("synced")
  const failed = count("failed")
  const conflict = count("conflict")
  const waiting = queued + failed
  const block = syncBlock(s.device)
  let headline: string
  if (conflict > 0) headline = `${plural(conflict, "conflict needs", "conflicts need")} you`
  else if (failed > 0) headline = `${plural(failed, "change failed", "changes failed")} to send`
  else if (waiting > 0) headline = block === "offline" ? `Offline. ${plural(waiting, "change is", "changes are")} saved on this phone` : block === "signed-out" ? `Signed out. ${plural(waiting, "change is", "changes are")} waiting for sign in` : `${plural(waiting, "change is", "changes are")} waiting to send`
  else if (block === "offline") headline = "Offline. Everything is saved on this phone"
  else if (block === "signed-out") headline = "Signed out. Everything is saved on this phone"
  else headline = "Everything is saved and sent"
  const chip: SyncSummary["chip"] = conflict > 0 ? "conflict" : failed > 0 ? "failed" : waiting > 0 ? "queued" : "synced"
  return { queued, synced, failed, conflict, waiting, chip, headline }
}

/** Sync state of one log entry or request, for the chips beside them. An entry with no sync item has nothing waiting. */
export function syncStateOf(s: V2State, ref: { entryId?: string; requestId?: string }): SyncItem["state"] {
  const items = s.syncQueue.filter((i) => (ref.entryId && i.entryId === ref.entryId) || (ref.requestId && i.requestId === ref.requestId))
  const last = items[items.length - 1]
  return last ? last.state : "synced"
}
