// File extraction for the import (IM-02): code only, no AI, works without any key (docs/build/typesafe-import-design.md §2.2).
// .xlsx (exceljs), .docx (mammoth), text-layer .pdf (unpdf), .csv and .txt (passthrough). Legacy .xls and .doc are unsupported, and a
// scanned PDF has no text layer: both report an honest error, never a guess (IM-13). Server-side only.
import { IMPORT_LIMITS } from "./thresholds"

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024
const EXTRACT_BUDGET_MS = 15_000
const MAX_UNZIPPED_BYTES = 80 * 1024 * 1024
const MAX_ZIP_ENTRIES = 2_000

export type ExtractError = "unreadable" | "too_large" | "unsupported" | "empty"

export interface ExtractOk {
  text: string
  sourceName: string
  columns?: boolean
  skipHeader?: boolean
  lines: number
  truncated: false
}

export type ExtractResult = ({ ok: true } & ExtractOk) | { ok: false; error: ExtractError }

const ext = (name: string) => (name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "") as string

const isZip = (b: Uint8Array) => b.length > 4 && b[0] === 0x50 && b[1] === 0x4b && (b[2] === 0x03 || b[2] === 0x05)
const isPdf = (b: Uint8Array) => b.length > 5 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d

/** Sum the declared uncompressed size of a zip's entries from its central directory, so a zip bomb is refused before it is opened. */
export function zipDeclaredSize(buf: Uint8Array): { entries: number; bytes: number } | null {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
  let eocd = -1
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 65_535); i--) {
    if (dv.getUint32(i, true) === 0x06054b50) {
      eocd = i
      break
    }
  }
  if (eocd < 0) return null
  const total = dv.getUint16(eocd + 10, true)
  let off = dv.getUint32(eocd + 16, true)
  let bytes = 0
  let entries = 0
  while (entries < total && off + 46 <= buf.length && dv.getUint32(off, true) === 0x02014b50) {
    bytes += dv.getUint32(off + 24, true)
    const n = dv.getUint16(off + 28, true)
    const m = dv.getUint16(off + 30, true)
    const k = dv.getUint16(off + 32, true)
    off += 46 + n + m + k
    entries += 1
  }
  return { entries, bytes }
}

function finish(text: string, sourceName: string, extra: Partial<Pick<ExtractOk, "columns" | "skipHeader">> = {}): ExtractResult {
  const clean = text.replace(/\u0000/g, "").replace(/\r\n?/g, "\n")
  if (!clean.trim()) return { ok: false, error: "empty" }
  const lines = clean.split("\n").filter((l) => l.trim().length > 0).length
  if (clean.length > IMPORT_LIMITS.maxTextChars || lines > IMPORT_LIMITS.maxLines) return { ok: false, error: "too_large" }
  return { ok: true, text: clean, sourceName, lines, truncated: false, ...extra }
}

// ---------------------------------------------------------------- .xlsx
const HEAD = { name: /^(skill|name)$/i, description: /^description$/i, category: /^(category|group|section)$/i }

async function fromXlsx(buf: Uint8Array, sourceName: string): Promise<ExtractResult> {
  const ExcelJS = (await import("exceljs")).default
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(Buffer.from(buf) as never)
  for (const ws of wb.worksheets) {
    const rows: string[][] = []
    ws.eachRow({ includeEmpty: false }, (row) => {
      const cells: string[] = []
      row.eachCell({ includeEmpty: true }, (cell, col) => {
        cells[col - 1] = String(cell.text ?? "").trim()
      })
      rows.push(Array.from(cells, (c) => c ?? ""))
    })
    if (rows.length === 0) continue
    const header = rows[0]
    const nameCol = header.findIndex((c) => HEAD.name.test(c))
    if (nameCol >= 0) {
      // A header row names the columns: map them deterministically and hand the rest to the standard CSV reader.
      const descCol = header.findIndex((c) => HEAD.description.test(c))
      const catCol = header.findIndex((c) => HEAD.category.test(c))
      const cell = (r: string[], i: number) => (i >= 0 ? (r[i] ?? "").replace(/,/g, ";").replace(/\s+/g, " ") : "")
      const body = ["Skill,Description,Category", ...rows.slice(1).map((r) => [cell(r, nameCol), cell(r, descCol), cell(r, catCol)].join(","))]
      // Rows whose name cell is blank are dropped here (an empty spreadsheet row is not a "line that could not be read").
      const kept = body.filter((l, i) => i === 0 || l.split(",")[0].trim().length > 0)
      return finish(kept.join("\n"), sourceName, { columns: true, skipHeader: true })
    }
    // No header: one line per row, cells joined by a tab (the reader splits name and description on a tab).
    return finish(rows.map((r) => r.filter(Boolean).join("\t")).filter(Boolean).join("\n"), sourceName)
  }
  return { ok: false, error: "empty" }
}

// ---------------------------------------------------------------- .docx
const ENTITIES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&nbsp;": " " }

/** A small HTML-to-lines pass: real Word headings become "# " heading lines (a strong Stage-1 signal), paragraphs and list items one line each. */
export function htmlToLines(html: string): string {
  return html
    .replace(/<h([1-6])[^>]*>/gi, "\n# ")
    .replace(/<\/(h[1-6]|p|li|tr|div|ul|ol|table)>/gi, "\n")
    .replace(/<\/t[dh]>/gi, "\t")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITIES[m] ?? m)
    .split("\n")
    .map((l) => l.replace(/\t+$/g, "").trim())
    .filter((l) => l.length > 0)
    .join("\n")
}

async function fromDocx(buf: Uint8Array, sourceName: string): Promise<ExtractResult> {
  const mammoth = (await import("mammoth")).default
  const html = await mammoth.convertToHtml({ buffer: Buffer.from(buf) })
  const text = htmlToLines(html.value)
  if (text.trim()) return finish(text, sourceName)
  const raw = await mammoth.extractRawText({ buffer: Buffer.from(buf) })
  return finish(raw.value, sourceName)
}

// ---------------------------------------------------------------- .pdf (text layer only; no OCR)
async function fromPdf(buf: Uint8Array, sourceName: string): Promise<ExtractResult> {
  const { extractText, getDocumentProxy } = await import("unpdf")
  const pdf = await getDocumentProxy(new Uint8Array(buf))
  const { text } = await extractText(pdf, { mergePages: false })
  const joined = text.join("\n")
  // A scanned PDF has little or no text layer: say so rather than guess.
  if (joined.replace(/\s+/g, "").length < 20) return { ok: false, error: "unreadable" }
  return finish(joined, sourceName)
}

// ---------------------------------------------------------------- .csv / .txt
function fromText(buf: Uint8Array, sourceName: string): ExtractResult {
  if (buf.includes(0)) return { ok: false, error: "unreadable" }
  const text = new TextDecoder("utf-8", { fatal: false }).decode(buf).replace(/^﻿/, "")
  const first = text.split(/\r?\n/).find((l) => l.trim().length > 0)
  if (first !== undefined && /^(skill|name)\s*,/i.test(first.trim())) return finish(text, sourceName, { columns: true, skipHeader: true })
  return finish(text, sourceName)
}

export async function extractFromBytes(buf: Uint8Array, fileName: string): Promise<ExtractResult> {
  if (buf.length === 0) return { ok: false, error: "empty" }
  if (buf.length > MAX_UPLOAD_BYTES) return { ok: false, error: "too_large" }
  const e = ext(fileName)
  const work = async (): Promise<ExtractResult> => {
    try {
      if (e === "xls" || e === "doc") return { ok: false, error: "unsupported" }
      if (e === "csv" || e === "txt" || e === "md") return fromText(buf, fileName)
      if (e === "xlsx" || e === "docx") {
        if (!isZip(buf)) return { ok: false, error: "unreadable" }
        const z = zipDeclaredSize(buf)
        if (!z || z.entries > MAX_ZIP_ENTRIES || z.bytes > MAX_UNZIPPED_BYTES) return { ok: false, error: "too_large" }
        return e === "xlsx" ? await fromXlsx(buf, fileName) : await fromDocx(buf, fileName)
      }
      if (e === "pdf") {
        if (!isPdf(buf)) return { ok: false, error: "unreadable" }
        return await fromPdf(buf, fileName)
      }
      return { ok: false, error: "unsupported" }
    } catch {
      return { ok: false, error: "unreadable" }
    }
  }
  return Promise.race([work(), new Promise<ExtractResult>((resolve) => setTimeout(() => resolve({ ok: false, error: "unreadable" }), EXTRACT_BUDGET_MS))])
}
