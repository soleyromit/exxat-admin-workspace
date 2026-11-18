/**
 * Add skills, variant H (D-ADD1117, Decided): the search and the import reader behind the one side panel. Pure functions, so the panel and the tests read one source.
 *
 * Search (decision 4): a case-insensitive substring match on the name, as the prototype has it, plus "Close matches": names that share a word with what was typed, or
 * hold a word one letter away from it ("wound vac" finds "Wound irrigation"). Close matches never repeat an exact match.
 *
 * Import (spec 3.8, prototype `E1`): comma or tab delimited text with or without a header row (skill/name/title, desc/detail/notes, categ/group/domain/section), or one name
 * per line. Bullets and numbering are stripped. A line with no name, a name under 3 characters, or a single-column line that looks like a section heading is skipped and
 * listed with its text [REQ IM-08]; a heading is proposed as the category of the lines under it [REQ IM-07]. No template is required [REQ IM-03].
 */
import { normName } from "./library"

const words = (s: string): string[] => normName(s).split(/[^a-z0-9]+/).filter((w) => w.length >= 3)

/** One edit (insert, delete or substitute) or none: "vac" and "vax", "wound" and "wounds". */
function withinOne(a: string, b: string): boolean {
  if (a === b) return true
  if (Math.abs(a.length - b.length) > 1) return false
  let i = 0
  let j = 0
  let edits = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue }
    if (++edits > 1) return false
    if (a.length > b.length) i++
    else if (b.length > a.length) j++
    else { i++; j++ }
  }
  return edits + (a.length - i) + (b.length - j) <= 1
}

/** A typed word against a word of the name: the same, a start of it, or one letter away when both are long enough to tell. */
function wordMatches(typed: string, word: string): boolean {
  if (word.startsWith(typed) || typed.startsWith(word)) return true
  return typed.length >= 4 && word.length >= 4 && withinOne(typed, word)
}

export const exactMatch = (name: string, q: string): boolean => !!q && name.toLowerCase().includes(q.trim().toLowerCase())

/** A close match: not an exact (substring) match, but at least one typed word matches a word of the name. */
export function closeMatch(name: string, q: string): boolean {
  if (!q.trim() || exactMatch(name, q)) return false
  const typed = words(q)
  if (!typed.length) return false
  const have = words(name)
  return typed.some((t) => have.some((w) => wordMatches(t, w)))
}

/** Splits rows by the query: exact first, then close matches, each in the order given. Empty query: everything is exact. */
export function searchSkills<T extends { name: string }>(rows: readonly T[], q: string): { exact: T[]; close: T[] } {
  const query = q.trim()
  if (!query) return { exact: [...rows], close: [] }
  const exact: T[] = []
  const close: T[] = []
  for (const r of rows) {
    if (exactMatch(r.name, query)) exact.push(r)
    else if (closeMatch(r.name, query)) close.push(r)
  }
  return { exact, close }
}

/** The typed text names a skill the library has (case and space insensitive): no Create row (spec 3.3, 8). */
export const namesExisting = (q: string, names: readonly string[]): boolean => !!q.trim() && names.some((n) => normName(n) === normName(q))

// ---------------------------------------------------------------------------------------------------------------------
// Import

export interface ImportLine {
  /** 1-based line number in the source. */
  line: number
  raw: string
  name: string
  description?: string
  /** From a category column, or from the heading above the line. */
  category?: string
  /** Where the category came from: a column of the file, or a heading line above. */
  categoryFrom?: "column" | "heading"
}

export interface SkippedLine {
  line: number
  raw: string
  reason: "heading" | "no-name" | "short"
}

export interface ImportRead {
  lines: ImportLine[]
  skipped: SkippedLine[]
  /** Lines with any text (what "N lines read" counts). */
  read: number
  /** A header row was found and used. */
  header: boolean
}

const HEADER = { name: /^(skill|name|title)/i, description: /^(desc|detail|notes?)/i, category: /^(categ|group|domain|section)/i }
const BULLET = /^\s*(?:[-*•▪◦·‣]+|\(?\d+[.)]|\(?[a-z][.)](?=\s))\s*/i

/** A section heading on its own line: "SECTION 2, ADVANCED PROCEDURES", "Airway:", "# Airway", "Part 3 - Assessment" [INFER from the prototype's rule]. */
export function looksLikeHeading(text: string): boolean {
  const t = text.trim()
  if (!t) return false
  if (/^#+\s/.test(t) || /:\s*$/.test(t)) return true
  if (/^(section|part|unit|module|chapter|domain)\b/i.test(t)) return true
  const letters = t.replace(/[^a-z]/gi, "")
  return letters.length >= 4 && letters === letters.toUpperCase()
}

const cleanHeading = (t: string): string => t.trim().replace(/^#+\s*/, "").replace(/:\s*$/, "").replace(/^(section|part|unit|module|chapter)\s+[\dIVX]+[,.:\s-]*/i, "").trim()
const titleCase = (t: string): string => (t === t.toUpperCase() ? t.charAt(0) + t.slice(1).toLowerCase() : t)
const unquote = (c: string) => c.trim().replace(/^"(.*)"$/, "$1").replace(/""/g, '"').trim()

/** Splits one line on its delimiter, keeping quoted commas. */
function cells(line: string, delimiter: "\t" | "," | null): string[] {
  if (!delimiter) return [line]
  if (delimiter === "\t") return line.split("\t")
  const out: string[] = []
  let cur = ""
  let quoted = false
  for (const ch of line) {
    if (ch === '"') { quoted = !quoted; cur += ch; continue }
    if (ch === "," && !quoted) { out.push(cur); cur = ""; continue }
    cur += ch
  }
  out.push(cur)
  return out
}

/** Reads a pasted or extracted list. `columns` forces comma reading (a .csv); otherwise the delimiter is detected from the first lines. */
export function readImport(text: string, { columns = false }: { columns?: boolean } = {}): ImportRead {
  const source = text.split(/\r?\n/)
  const all = source.map((raw, i) => ({ raw, line: i + 1 })).filter((l) => l.raw.trim())
  // A document's title: its first line, set apart by a blank line, with more below (a PDF or a Word file often starts "Clinical skills to add") [INFER].
  // Or one directly above a heading (a PDF's text loses the blank line). Either way it is listed as skipped, with its text, never dropped [REQ IM-08].
  const top = all[0]
  const setApart = !!top && top.line === 1 && source[1] !== undefined && !source[1].trim()
  const aboveHeading = !!top && all.length > 2 && !looksLikeHeading(top.raw) && looksLikeHeading(all[1]!.raw)
  const title = top && all.length > 2 && (setApart || aboveHeading) ? top.line : null
  const sample = all.slice(0, 5).map((l) => l.raw)
  const tabbed = sample.filter((l) => l.includes("\t")).length
  const commas = sample.filter((l) => l.includes(",")).length
  // Comma reading only when most of the first lines carry one, or the file is a CSV: skill names themselves contain commas.
  const delimiter: "\t" | "," | null = tabbed >= Math.ceil(sample.length / 2) && tabbed > 0 ? "\t" : columns || (commas === sample.length && sample.length >= 2) ? "," : null
  let col = { name: 0, description: -1, category: -1 }
  let header = false
  const first = all[0] ? cells(all[0].raw, delimiter).map(unquote) : []
  if (first.length) {
    const find = (re: RegExp) => first.findIndex((c) => re.test(c))
    const n = find(HEADER.name)
    if (n >= 0 && (delimiter || first.length === 1) && first.length <= 6 && first[n]!.split(/\s+/).length <= 2) {
      col = { name: n, description: find(HEADER.description), category: find(HEADER.category) }
      header = true
    }
  }
  const lines: ImportLine[] = []
  const skipped: SkippedLine[] = []
  let heading: string | undefined
  for (const l of header ? all.slice(1) : all) {
    if (l.line === title && !header) { skipped.push({ line: l.line, raw: l.raw.trim(), reason: "heading" }); continue }
    const parts = cells(l.raw, delimiter).map(unquote)
    const filled = parts.filter(Boolean)
    const rawName = (parts[col.name] ?? "").replace(BULLET, "").trim()
    if (filled.length <= 1 && looksLikeHeading(filled[0] ?? rawName)) {
      skipped.push({ line: l.line, raw: l.raw.trim(), reason: "heading" })
      const h = titleCase(cleanHeading(filled[0] ?? rawName))
      heading = h || undefined
      continue
    }
    if (!rawName || !/[a-z0-9]/i.test(rawName)) { skipped.push({ line: l.line, raw: l.raw.trim(), reason: "no-name" }); continue }
    if (rawName.length < 3) { skipped.push({ line: l.line, raw: l.raw.trim(), reason: "short" }); continue }
    const description = col.description >= 0 ? parts[col.description]?.trim() : undefined
    const fromColumn = col.category >= 0 ? parts[col.category]?.trim() : undefined
    const category = fromColumn || heading
    lines.push({ line: l.line, raw: l.raw, name: rawName.replace(/\s+/g, " "), ...(description ? { description } : {}), ...(category ? { category, categoryFrom: fromColumn ? "column" : "heading" } : {}) })
  }
  return { lines, skipped, read: all.length, header }
}

/** The reason a skipped line is listed, in the spec's words: 'Line 9 skipped: "SECTION 2" looks like a heading'. */
export function skippedReason(s: Pick<SkippedLine, "reason">): string {
  if (s.reason === "heading") return "looks like a heading"
  if (s.reason === "short") return "is shorter than 3 characters"
  return "has no name"
}
