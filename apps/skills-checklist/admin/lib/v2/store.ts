import { createSeed } from "./seed"
import type { AuditEntry, V2State } from "./types"

export const STORAGE_KEY = "skills-checklist:v2:store"
const ENVELOPE_VERSION = 2

export interface V2Store {
  getSnapshot(): V2State
  getServerSnapshot(): V2State
  subscribe(listener: () => void): () => void
  /** True once persisted state (if any) has been read on the client. */
  isHydrated(): boolean
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
  const arrays = ["people", "skills", "mappings", "evaluations", "submissions", "syncQueue", "concerns", "remediations", "audit", "batches"]
  return (
    s.schema === 1 &&
    arrays.every((k) => Array.isArray(s[k])) &&
    !!s.program &&
    !!s.course &&
    !!s.drafts &&
    typeof s.drafts === "object" &&
    !!s.stepsReviewed &&
    typeof s.stepsReviewed === "object"
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

function read(storage: Storage | null, key: string): V2State | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(key)
    if (!raw) return null
    const env = JSON.parse(raw) as { v?: number; state?: unknown }
    if (env.v !== ENVELOPE_VERSION || !isV2State(env.state)) return null
    return env.state
  } catch {
    return null
  }
}

function write(storage: Storage | null, key: string, state: V2State): void {
  if (!storage) return
  try {
    storage.setItem(key, JSON.stringify({ v: ENVELOPE_VERSION, state }))
  } catch {
    // Storage can be full, blocked or absent (private window). The store keeps working in memory.
  }
}

export function createV2Store(opts: { storage?: Storage | null; key?: string } = {}): V2Store {
  const key = opts.key ?? STORAGE_KEY
  const storage = safeStorage(opts.storage)
  const serverSeed = createSeed()
  let state: V2State = serverSeed
  let hydrated = false
  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach((l) => l())

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
    hydrate() {
      if (hydrated) return
      hydrated = true
      const saved = read(storage, key)
      if (saved) state = saved
      emit()
    },
    update(fn) {
      state = fn(state)
      write(storage, key, state)
      emit()
    },
    reset() {
      state = createSeed()
      write(storage, key, state)
      emit()
    },
    reload() {
      state = read(storage, key) ?? createSeed()
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
  return appendAudit({ ...s, stepsReviewed: reviewed }, actorId, wasReviewed ? "Unmarked scenario step" : "Marked scenario step reviewed", stepTitle, at)
}
