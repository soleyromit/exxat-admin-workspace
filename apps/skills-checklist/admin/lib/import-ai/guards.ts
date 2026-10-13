// Route guards for the import API. The prototype has no sign-in, so these are DEMO cost and abuse guards, not access control
// (docs/build/typesafe-import-design.md §4.4). They never echo the input text back.
import { IMPORT_LIMITS } from "./thresholds"
import type { InterpretRequestBody } from "./types"

export type BodyError = "invalid_json" | "invalid_body" | "too_large" | "unknown_field" | "empty"

const ALLOWED = new Set(["text", "sourceName", "sourceKind", "columns", "skipHeader"])

export function parseInterpretBody(raw: unknown): { ok: true; body: InterpretRequestBody } | { ok: false; code: BodyError } {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return { ok: false, code: "invalid_body" }
  const o = raw as Record<string, unknown>
  for (const k of Object.keys(o)) if (!ALLOWED.has(k)) return { ok: false, code: "unknown_field" }
  if (typeof o.text !== "string" || typeof o.sourceName !== "string") return { ok: false, code: "invalid_body" }
  if (o.sourceKind !== "paste" && o.sourceKind !== "file") return { ok: false, code: "invalid_body" }
  if (o.columns !== undefined && typeof o.columns !== "boolean") return { ok: false, code: "invalid_body" }
  if (o.skipHeader !== undefined && typeof o.skipHeader !== "boolean") return { ok: false, code: "invalid_body" }
  if (o.sourceName.length > 120) return { ok: false, code: "invalid_body" }
  if (o.text.length > IMPORT_LIMITS.maxTextChars) return { ok: false, code: "too_large" }
  if (!o.text.trim()) return { ok: false, code: "empty" }
  const nonBlank = o.text.split(/\r?\n/).filter((l) => l.trim().length > 0).length
  if (nonBlank > IMPORT_LIMITS.maxLines) return { ok: false, code: "too_large" }
  return {
    ok: true,
    body: { text: o.text, sourceName: o.sourceName, sourceKind: o.sourceKind, columns: o.columns as boolean | undefined, skipHeader: o.skipHeader as boolean | undefined },
  }
}

/** Same-origin only: a cross-site page must not be able to spend the demo's key. */
export function isSameOrigin(headers: Headers): boolean {
  const site = headers.get("sec-fetch-site")
  if (site && site !== "same-origin" && site !== "none") return false
  const origin = headers.get("origin")
  if (!origin) return true
  const host = headers.get("host")
  try {
    return !!host && new URL(origin).host === host
  } catch {
    return false
  }
}

export function clientKey(headers: Headers): string {
  return (headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local"
}

/** In-memory sliding window (per server instance): a demo guard only. */
export class SlidingWindowLimiter {
  private hits = new Map<string, number[]>()
  constructor(
    private limit: number,
    private windowMs: number,
    private now: () => number = Date.now,
  ) {}
  allow(key: string): boolean {
    const t = this.now()
    const kept = (this.hits.get(key) ?? []).filter((h) => t - h < this.windowMs)
    if (kept.length >= this.limit) {
      this.hits.set(key, kept)
      return false
    }
    kept.push(t)
    this.hits.set(key, kept)
    return true
  }
  reset() {
    this.hits.clear()
  }
}

export const interpretLimiter = new SlidingWindowLimiter(10, 60_000)

/** Daily cap on interpret calls per server instance (SKILLS_IMPORT_DAILY_CAP, default 200). */
class DailyCap {
  private day = ""
  private n = 0
  private cap(): number {
    const v = Number(process.env.SKILLS_IMPORT_DAILY_CAP)
    return Number.isFinite(v) && v > 0 ? v : 200
  }
  private roll() {
    const d = new Date().toISOString().slice(0, 10)
    if (d !== this.day) {
      this.day = d
      this.n = 0
    }
  }
  reached(): boolean {
    this.roll()
    return this.n >= this.cap()
  }
  take(): boolean {
    this.roll()
    if (this.n >= this.cap()) return false
    this.n += 1
    return true
  }
  reset() {
    this.n = 0
    this.day = ""
  }
}

export const dailyCap = new DailyCap()
