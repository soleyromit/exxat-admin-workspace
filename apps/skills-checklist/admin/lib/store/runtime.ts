// Non-React store core: holds the Db, persists it to localStorage (versioned key) and notifies subscribers.
// Kept free of React so it can be unit tested. The React hooks live in react.ts.
import { DB_VERSION, SKILL_STATUS_DISPLAY_DEFAULT, STORAGE_KEY_DB, STORAGE_KEY_PREFS } from "@/lib/config"
import type { Db, Prefs } from "@/lib/domain/types"
import { buildSeed } from "@/lib/seed"
import type { ActionCtx, Result } from "./result"

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface RuntimeOptions {
  storage?: StorageLike | null
  seed?: () => Db
  now?: () => string
  token?: (seed: number) => string
}

export const DEFAULT_PREFS: Prefs = { skillStatusDisplay: SKILL_STATUS_DISPLAY_DEFAULT, currentStudentId: "stu-01", evaluatorSeesProgress: true }

const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789"
/** Crypto-random opaque token for links created in the browser. Never derived from ids. */
export function randomToken(): string {
  const bytes = new Uint8Array(24)
  globalThis.crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("")
}

export interface Runtime {
  getDb(): Db
  getPrefs(): Prefs
  subscribe(fn: () => void): () => void
  /** Load persisted state (client only). Safe to call more than once. */
  hydrate(): void
  /** Run a pure action. On success the new Db is committed, persisted and subscribers are notified. */
  run<T>(action: (db: Db, ctx: ActionCtx) => Result<T>): Result<T>
  /** Reset to the seed. */
  reset(): void
  setPrefs(patch: Partial<Prefs>): void
}

export function createRuntime(opts: RuntimeOptions = {}): Runtime {
  const makeSeed = opts.seed ?? buildSeed
  const storage = opts.storage === undefined ? (typeof window !== "undefined" ? window.localStorage : null) : opts.storage
  let db: Db = makeSeed()
  let prefs: Prefs = { ...DEFAULT_PREFS }
  let hydrated = false
  const subs = new Set<() => void>()
  const emit = () => subs.forEach((f) => f())

  const persist = () => {
    try {
      storage?.setItem(STORAGE_KEY_DB, JSON.stringify(db))
    } catch {
      // Private mode or quota: the app keeps working in memory.
    }
  }
  const persistPrefs = () => {
    try {
      storage?.setItem(STORAGE_KEY_PREFS, JSON.stringify(prefs))
    } catch {
      // ignore
    }
  }

  return {
    getDb: () => db,
    getPrefs: () => prefs,
    subscribe(fn) {
      subs.add(fn)
      return () => subs.delete(fn)
    },
    hydrate() {
      if (hydrated) return
      hydrated = true
      try {
        const raw = storage?.getItem(STORAGE_KEY_DB)
        if (raw) {
          const parsed = JSON.parse(raw) as Db
          if (parsed && parsed.version === DB_VERSION) db = parsed
        }
        const rawPrefs = storage?.getItem(STORAGE_KEY_PREFS)
        if (rawPrefs) prefs = { ...DEFAULT_PREFS, ...(JSON.parse(rawPrefs) as Partial<Prefs>) }
      } catch {
        // Corrupt storage: fall back to the seed.
      }
      emit()
    },
    run(action) {
      const ctx: ActionCtx = { now: (opts.now ?? (() => new Date().toISOString()))(), token: opts.token ?? randomToken }
      const r = action(db, ctx)
      if (r.ok) {
        db = r.db
        persist()
        emit()
      }
      return r
    },
    reset() {
      db = makeSeed()
      try {
        storage?.removeItem(STORAGE_KEY_DB)
      } catch {
        // ignore
      }
      emit()
    },
    setPrefs(patch) {
      prefs = { ...prefs, ...patch }
      persistPrefs()
      emit()
    },
  }
}
