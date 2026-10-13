// Browser-side calls to the import API. Every call degrades quietly: a missing server (for example a static host), a timeout or any
// error means "not available", and the dialog uses the standard reader. Nothing here ever holds a key.
import type { FallbackReason, InterpretRequestBody, InterpretResponse } from "./types"

export interface ImportStatus {
  ai: boolean
  extractors: { xlsx: boolean; docx: boolean; pdf: boolean }
  maxUploadBytes: number
}

const NONE: ImportStatus = { ai: false, extractors: { xlsx: false, docx: false, pdf: false }, maxUploadBytes: 0 }

export async function fetchImportStatus(signal?: AbortSignal): Promise<ImportStatus> {
  try {
    const r = await fetch("/api/import/status", { signal, cache: "no-store" })
    if (!r.ok) return NONE
    const j = (await r.json()) as Partial<ImportStatus>
    return { ai: j.ai === true, extractors: { xlsx: !!j.extractors?.xlsx, docx: !!j.extractors?.docx, pdf: !!j.extractors?.pdf }, maxUploadBytes: j.maxUploadBytes ?? 0 }
  } catch {
    return NONE
  }
}

export type ExtractOutcome =
  | { ok: true; text: string; sourceName: string; columns?: boolean; skipHeader?: boolean }
  | { ok: false; error: "unreadable" | "too_large" | "unsupported" | "empty" | "unavailable" }

export async function extractFileOnServer(file: File, signal?: AbortSignal): Promise<ExtractOutcome> {
  try {
    const form = new FormData()
    form.append("file", file)
    const r = await fetch("/api/import/extract", { method: "POST", body: form, signal })
    const j = (await r.json().catch(() => ({}))) as { text?: string; sourceName?: string; columns?: boolean; skipHeader?: boolean; error?: string }
    if (r.ok && typeof j.text === "string") return { ok: true, text: j.text, sourceName: j.sourceName ?? file.name, columns: j.columns, skipHeader: j.skipHeader }
    const e = j.error
    if (e === "unreadable" || e === "too_large" || e === "unsupported" || e === "empty") return { ok: false, error: e }
    return { ok: false, error: "unavailable" }
  } catch {
    return { ok: false, error: "unavailable" }
  }
}

export async function interpretOnServer(body: InterpretRequestBody, signal?: AbortSignal): Promise<InterpretResponse> {
  try {
    const r = await fetch("/api/import/interpret", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal })
    const j = (await r.json().catch(() => null)) as InterpretResponse | null
    if (j && "result" in j) return j
    const fallback: FallbackReason = r.status === 429 ? "rate_limited" : "error"
    return { result: null, fallback }
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e
    return { result: null, fallback: "error" }
  }
}
