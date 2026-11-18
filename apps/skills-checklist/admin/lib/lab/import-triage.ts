/**
 * H's upload reader, plain (D-ADD1117-z, Decided, Romit 2026-11-17: "remove these unnecessary intelligence"). Every line read is a row;
 * nothing is judged. Only pure formatting is dropped and counted (blank lines, separators, table rules, code fences, lines with no
 * letters). List bullets, numbering and markdown marks are stripped from names. A heading line ("AIRWAY", "Airway:", "## 3.1 Airway")
 * becomes the category of the rows under it [REQ IM-07]; a heading with no rows under it is dropped. A table (tab separated, or a
 * .csv) is read by its header: the name column, plus description and category columns [REQ IM-03, IM-05].
 */
import { looksLikeHeading } from "./skill-search"

export interface ImportLine {
  /** 1-based line in the file. */
  line: number
  /** The name, cleaned of bullets, numbering and markdown marks. */
  text: string
  /** The heading above it, or the file's category column. */
  category?: string
  categoryFrom?: "heading" | "column"
  /** A description column's text, kept for the skill [REQ IM-05]. */
  description?: string
}

export interface ImportRead {
  lines: ImportLine[]
  /** Headings that have rows under them, in file order. */
  categories: string[]
  /** Formatting lines dropped. */
  noise: number
}

/** One line to read: its text (the name cell for a table), and any description or category cell. */
export interface ImportInput { line: number; text: string; description?: string; category?: string }

const PRONOUN = /\b(i|my|me|you|your|we|our)\b/i
const BULLET = /^\s*(?:[-*•▪◦·‣]+|\(?\d+[.)])\s*/
const words = (t: string): number => t.split(/\s+/).filter(Boolean).length

/** Formatting with nothing to read: separators, table rules, code fences, lone brackets, no letters. */
export function isNoise(raw: string): boolean {
  const t = raw.trim()
  if (!t) return true
  if (/^([-*=_~#])(\s*\1){2,}$/.test(t)) return true
  if (/^```/.test(t) || /^~~~/.test(t)) return true
  if (/\|/.test(t) && /^[\s|:+-]+$/.test(t)) return true
  if (/^[[\]{}()<>]+[,;]?$/.test(t)) return true
  return !/\p{L}/u.test(t)
}

/** Inline markdown that is formatting, not words: **bold**, `code`, _emphasis_. */
const unmark = (t: string): string => t.replace(/\*\*|__|`/g, "").replace(/(^|\s)[*_](\S)/g, "$1$2").replace(/(\S)[*_](?=\s|$)/g, "$1")

/** A name as written, without its bullet, numbering, markdown marks or table pipes. */
export function cleanName(raw: string): string {
  return unmark(raw.replace(BULLET, "")).replace(/^\|\s*|\s*\|$/g, "").replace(/\s+/g, " ").trim()
}

/** A heading: markdown "#", or the reader's rules (ALL CAPS, trailing colon, section words) in a few words with no personal wording. */
export function isHeading(raw: string): boolean {
  const t = raw.trim()
  if (/^#{1,6}\s+\S/.test(t)) return true
  const plain = unmark(t.replace(BULLET, ""))
  return looksLikeHeading(plain) && words(plain) <= 6 && !PRONOUN.test(plain)
}

/** A heading as a category: no "#", numbering ("3.1"), section word or trailing colon; ALL CAPS in sentence case. */
export function headingName(raw: string): string {
  const c = unmark(raw.trim()).replace(/^#+\s*/, "").replace(/:\s*$/, "").replace(/^(section|part|unit|module|chapter)\s+[\dIVX]+[,.:\s-]*/i, "").replace(/^\d+(\.\d+)*\.?\s+/, "").trim()
  return c === c.toUpperCase() ? c.charAt(0) + c.slice(1).toLowerCase() : c
}

/** Reads already split lines into rows under their headings. */
export function readLines(input: readonly ImportInput[]): ImportRead {
  const lines: ImportLine[] = []
  let heading: string | null = null
  let noise = 0
  let fenced = false
  for (const l of input) {
    if (/^\s*(```|~~~)/.test(l.text)) { fenced = !fenced; noise++; continue }
    if (fenced || isNoise(l.text)) { noise++; continue }
    // A heading names the rows under it; one with no rows under it is dropped.
    if (!l.description && !l.category && isHeading(l.text)) { heading = headingName(l.text); continue }
    const text = cleanName(l.text)
    if (!text) { noise++; continue }
    const category = l.category || heading || undefined
    lines.push({ line: l.line, text, ...(category ? { category, categoryFrom: l.category ? "column" as const : "heading" as const } : {}), ...(l.description ? { description: l.description } : {}) })
  }
  return { lines, categories: [...new Set(lines.map((l) => l.category).filter((c): c is string => !!c))], noise }
}

const HEADER = { name: /^(skill|name|title)/i, description: /^(desc|detail|notes?)/i, category: /^(categ|group|domain|section)/i }
const unquote = (c: string) => c.trim().replace(/^"(.*)"$/, "$1").replace(/""/g, '"').trim()
function cells(line: string, delimiter: "\t" | ","): string[] {
  if (delimiter === "\t") return line.split("\t").map(unquote)
  const out: string[] = []
  let cur = ""
  let quoted = false
  for (const ch of line) {
    if (ch === '"') { quoted = !quoted; cur += ch; continue }
    if (ch === "," && !quoted) { out.push(cur); cur = ""; continue }
    cur += ch
  }
  out.push(cur)
  return out.map(unquote)
}

/** Reads a pasted list or a file's text. A table is read by its header; `columns` reads commas as columns (a .csv). */
export function readImportText(text: string, { columns = false }: { columns?: boolean } = {}): ImportRead {
  const raw = text.split(/\r?\n/)
  const first = raw.find((l) => l.trim())
  const delimiter: "\t" | "," | null = first?.includes("\t") ? "\t" : columns ? "," : null
  if (!delimiter || !first) return readLines(raw.map((t, i) => ({ line: i + 1, text: t })))
  const head = cells(first, delimiter)
  const at = (re: RegExp) => head.findIndex((h) => re.test(h))
  const hasHeader = at(HEADER.name) >= 0
  const nameAt = hasHeader ? at(HEADER.name) : 0
  const descAt = hasHeader ? at(HEADER.description) : head.length > 1 ? 1 : -1
  const catAt = hasHeader ? at(HEADER.category) : -1
  const headerLine = raw.indexOf(first)
  return readLines(raw.flatMap((t, i): ImportInput[] => {
    if (hasHeader && i === headerLine) return []
    const c = cells(t, delimiter)
    if (c.length < 2) return [{ line: i + 1, text: t }]
    return [{ line: i + 1, text: c[nameAt] ?? "", ...(descAt >= 0 && c[descAt] ? { description: c[descAt] } : {}), ...(catAt >= 0 && c[catAt] ? { category: c[catAt] } : {}) }]
  }))
}
