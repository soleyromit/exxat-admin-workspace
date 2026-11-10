import { createSeed, SEED_VERSION } from "./seed"
import type { AuditEntry, V2State } from "./types"

export const STORAGE_KEY = "skills-checklist:v2:store"
/** v4: the envelope holds only what differs from the deterministic seed (a patch), never the whole generated state. */
const ENVELOPE_VERSION = 4

export interface V2Store {
  getSnapshot(): V2State
  getServerSnapshot(): V2State
  subscribe(listener: () => void): () => void
  /** True once persisted state (if any) has been read on the client. */
  isHydrated(): boolean
  /** True when the last attempt to save to storage failed (full, blocked or absent). The store keeps working in memory. */
  saveFailed(): boolean
  hydrate(): void
  update(fn: (s: V2State) => V2State): void
  reset(): void
  /** Re-read storage (another tab wrote). */
  reload(): void
}

/** Shape check for persisted data. Anything that does not look like a V2State is discarded and the seed is used. */
export function isV2State(x: unknown): x is V2State {
  if (!x || typeof x !== "object") return false
  const s = x as Record<string, unknown>
  const arrays = ["people", "skills", "mappings", "evaluations", "submissions", "syncQueue", "concerns", "remediations", "audit", "batches", "placements", "logEntries", "labCheckoffs"]
  return (
    s.schema === 1 &&
    arrays.every((k) => Array.isArray(s[k])) &&
    !!s.program &&
    !!s.course &&
    !!s.drafts &&
    typeof s.drafts === "object" &&
    !!s.stepsReviewed &&
    typeof s.stepsReviewed === "object" &&
    !!s.device &&
    typeof s.device === "object"
  )
}

function safeStorage(explicit?: Storage | null): Storage | null {
  if (explicit !== undefined) return explicit
  try {
    return typeof window !== "undefined" ? window.localStorage : null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// Delta persistence

/**
 * One piece of a list in a patch: a range `[from, to]` (inclusive) of rows of the seed's list, or a row that is new or changed.
 * An edit in the middle of 9,000 evaluations is three segments, not 9,000 rows.
 */
type Segment = [number, number] | Record<string, unknown>

export interface Patch {
  /** Fields that are not lists (or that the seed did not have), replaced whole. */
  set: Record<string, unknown>
  /** Lists, as segments over the seed's list. */
  lists: Record<string, Segment[]>
}

type AnyState = Record<string, unknown>

/** A cheap fingerprint of the seed's list sizes, so a patch made against another generator is rejected. */
function signature(base: V2State): string {
  const b = base as unknown as AnyState
  return Object.keys(b)
    .filter((k) => Array.isArray(b[k]))
    .sort()
    .map((k) => `${k}:${(b[k] as unknown[]).length}`)
    .join(",")
}

const rowIndexCache = new WeakMap<object, Map<unknown, number>>()
function rowIndex(list: unknown[]): Map<unknown, number> {
  let m = rowIndexCache.get(list)
  if (!m) {
    m = new Map()
    list.forEach((r, i) => m!.set(r, i))
    rowIndexCache.set(list, m)
  }
  return m
}

/** Encode `next` against `base`. Rows are matched by reference first (transitions keep untouched rows), then by value at the same position. */
function encodeList(base: unknown[], next: unknown[]): Segment[] | null {
  const idx = rowIndex(base)
  const out: Segment[] = []
  let identical = next.length === base.length
  next.forEach((row, j) => {
    let i = idx.get(row)
    if (i === undefined && j < base.length && row && typeof row === "object" && JSON.stringify(row) === JSON.stringify(base[j])) i = j
    if (i !== j) identical = false
    if (i === undefined) {
      out.push(row as Record<string, unknown>)
      return
    }
    const last = out[out.length - 1]
    if (Array.isArray(last) && last[1] === i - 1) last[1] = i
    else out.push([i, i])
  })
  return identical ? null : out
}

export function diffState(base: V2State, state: V2State): Patch {
  const b = base as unknown as AnyState
  const s = state as unknown as AnyState
  const patch: Patch = { set: {}, lists: {} }
  for (const key of Object.keys(s)) {
    const v = s[key]
    if (v === b[key]) continue
    if (Array.isArray(v) && Array.isArray(b[key])) {
      const seg = encodeList(b[key] as unknown[], v)
      if (seg) patch.lists[key] = seg
    } else if (JSON.stringify(v) !== JSON.stringify(b[key])) patch.set[key] = v
  }
  return patch
}

/** Rebuild a state from the seed and a patch. Returns null when the patch does not fit the seed. */
export function applyPatch(base: V2State, patch: Patch): V2State | null {
  const b = base as unknown as AnyState
  const next: AnyState = { ...b }
  for (const [key, segs] of Object.entries(patch.lists)) {
    const list = b[key]
    if (!Array.isArray(list) || !Array.isArray(segs)) return null
    const rows: unknown[] = []
    for (const seg of segs) {
      if (Array.isArray(seg)) {
        const [from, to] = seg
        if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < from || to >= list.length) return null
        for (let i = from; i <= to; i++) rows.push(list[i])
      } else if (seg && typeof seg === "object") rows.push(seg)
      else return null
    }
    next[key] = rows
  }
  for (const [key, v] of Object.entries(patch.set)) next[key] = v
  return next as unknown as V2State
}

function read(storage: Storage | null, key: string, base: V2State): V2State | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(key)
    if (!raw) return null
    const env = JSON.parse(raw) as { v?: number; seedVersion?: string; sig?: string; patch?: Patch }
    if (env.v !== ENVELOPE_VERSION || env.seedVersion !== SEED_VERSION || env.sig !== signature(base) || !env.patch || typeof env.patch !== "object") return null
    if (!env.patch.lists || !env.patch.set) return null
    const state = applyPatch(base, env.patch)
    return state && isV2State(state) ? state : null
  } catch {
    return null
  }
}

/** Returns false when the save did not happen. The caller keeps the in-memory state either way. */
function write(storage: Storage | null, key: string, base: V2State, state: V2State): boolean {
  if (!storage) return false
  try {
    storage.setItem(key, JSON.stringify({ v: ENVELOPE_VERSION, seedVersion: SEED_VERSION, sig: signature(base), patch: diffState(base, state) }))
    return true
  } catch {
    // Storage can be full, blocked or absent (private window). The store keeps working in memory.
    return false
  }
}

export function createV2Store(opts: { storage?: Storage | null; key?: string } = {}): V2Store {
  const key = opts.key ?? STORAGE_KEY
  const storage = safeStorage(opts.storage)
  // The seed is regenerated on every load; only the difference from it is saved.
  const serverSeed = createSeed()
  let state: V2State = serverSeed
  let hydrated = false
  let failed = false
  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach((l) => l())
  const save = () => {
    failed = storage ? !write(storage, key, serverSeed, state) : false
  }

  return {
    getSnapshot: () => state,
    getServerSnapshot: () => serverSeed,
    subscribe(l) {
      listeners.add(l)
      return () => {
        listeners.delete(l)
      }
    },
    isHydrated: () => hydrated,
    saveFailed: () => failed,
    hydrate() {
      if (hydrated) return
      hydrated = true
      const saved = read(storage, key, serverSeed)
      if (saved) state = saved
      emit()
    },
    update(fn) {
      state = fn(state)
      save()
      emit()
    },
    reset() {
      state = createSeed()
      save()
      emit()
    },
    reload() {
      state = read(storage, key, serverSeed) ?? createSeed()
      emit()
    },
  }
}

/** Pure state transitions. Each returns a new state and never mutates its input. */
export function appendAudit(s: V2State, actorId: string, action: string, target: string, at: string): V2State {
  const entry: AuditEntry = { id: `au-${s.audit.length + 1}`, at, actorId, action, target }
  return { ...s, audit: [entry, ...s.audit] }
}

export function toggleStepReviewed(s: V2State, stepId: string, stepTitle: string, actorId: string, at: string): V2State {
  const reviewed = { ...s.stepsReviewed }
  const wasReviewed = stepId in reviewed
  if (wasReviewed) delete reviewed[stepId]
  else reviewed[stepId] = at
  return appendAudit({ ...s, stepsReviewed: reviewed }, actorId, wasReviewed ? "Unmarked walkthrough step" : "Marked walkthrough step reviewed", stepTitle, at)
}
