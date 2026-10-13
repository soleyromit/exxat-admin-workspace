// Pure, deterministic id and token generation. The counter lives in `Db.seq` so an action stays a pure
// function of (db, input, ctx): same inputs give the same ids, which keeps tests and the seed stable.
import type { Db } from "./types"

export interface Ids {
  /** Next id with a readable prefix, for example `sub-14`. */
  next(prefix: string): string
  /** The counter after the ids handed out so far; write it back to `db.seq`. */
  seq(): number
}

export function idsFrom(db: Pick<Db, "seq">): Ids {
  let n = db.seq
  return {
    next: (prefix) => `${prefix}-${++n}`,
    seq: () => n,
  }
}

/** mulberry32: tiny seeded PRNG, used for deterministic tokens and the seed. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789"

/** Opaque 24-char token derived from a seed. Production wrappers pass crypto-random tokens instead. */
export function deterministicToken(seed: number): string {
  const r = mulberry32(seed * 2654435761)
  let out = ""
  for (let i = 0; i < 24; i += 1) out += ALPHABET[Math.floor(r() * ALPHABET.length)]
  return out
}
