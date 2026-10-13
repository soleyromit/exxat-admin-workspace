// S-08 Stage 1: the RULES that settle every line they can before any model is asked (docs/build/typesafe-import-design.md §2.1).
// Pure, shared by the browser (standard reader) and the server (AI route). Behaviour for lines the rules settle is the
// deterministic reader's behaviour, unchanged: B3 (a line with no letters is never a skill) and B4 (an ALL-CAPS heading with items
// below becomes a category) are Stage-1 outcomes the model can never override. [REQ IM-04] [REQ IM-07] [REQ IM-08]

export const BULLET = /^(\d+[.)]|[-*•])\s+/
export const SECTION = /^(section|part|chapter|appendix)\b/i
export const DELIMS = ["\t", "|", " - ", " – ", " — ", ": "]

export function splitNameDescription(line: string): { name: string; description: string } {
  for (const d of DELIMS) {
    const i = line.indexOf(d)
    if (i > 0) return { name: line.slice(0, i).trim(), description: line.slice(i + d.length).trim() }
  }
  return { name: line.trim(), description: "" }
}

export const isAllCaps = (s: string) => /[A-Z]{3}/.test(s) && !/[a-z]/.test(s)

export interface RuleInput {
  text: string
  sourceName: string
  /** Read comma-separated columns (name, description, category). Defaults to true for a source named "*.csv". */
  columns?: boolean
  /** The first non-blank line is a header row: skipped without being reported. Line numbers still count it (IM-08). */
  skipHeader?: boolean
}

interface Base {
  /** 1-based source line number, the same numbering IM-08 reports as "Line n". */
  n: number
  raw: string
  location: string
}

/** What the rules decided for one non-blank line. `ambiguous` is the only kind the model is asked about. */
export type RuleItem =
  | (Base & { kind: "category"; categoryName: string; by: "markdown" | "colon" | "allcaps" })
  | (Base & { kind: "unread"; reason: "heading" | "unrecognised" })
  | (Base & { kind: "skill"; name: string; description: string; categoryName: string | null })
  | (Base & { kind: "ambiguous"; name: string; description: string; categoryName: string | null })

/** Pure classification of the source text. Blank lines are ignored; every other line gets exactly one decision. */
export function classifyByRules(input: RuleInput): RuleItem[] {
  const items: RuleItem[] = []
  const csv = input.columns ?? /\.csv$/i.test(input.sourceName)
  const lines = input.text.split(/\r?\n/)
  const firstLine = input.skipHeader ? lines.findIndex((l) => l.trim().length > 0) : -1
  let category: string | null = null
  lines.forEach((raw, i) => {
    const line = raw.trim()
    if (!line) return
    if (i === firstLine) return
    const base: Base = { n: i + 1, raw, location: `Line ${i + 1}` }
    // IM-07: a heading that groups the lines beneath it becomes a proposed category.
    if (/^#{1,6}\s+/.test(line)) {
      category = line.replace(/^#{1,6}\s+/, "").replace(/:$/, "").trim() || null
      if (category) items.push({ ...base, kind: "category", categoryName: category, by: "markdown" })
      return
    }
    if (line.endsWith(":") && line.length <= 60 && !DELIMS.some((d) => d !== ": " && line.includes(d))) {
      category = line.slice(0, -1).trim() || null
      if (category) items.push({ ...base, kind: "category", categoryName: category, by: "colon" })
      return
    }
    // IM-08: "Section 2" style headings are reported, never silently dropped or turned into skills.
    if (SECTION.test(line)) {
      items.push({ ...base, kind: "unread", reason: "heading" })
      return
    }
    // IM-07 [INFER]: an ALL-CAPS line followed by item lines is proposed as a category for them. With nothing beneath it, it stays unread.
    if (isAllCaps(line)) {
      const next = lines.slice(i + 1).map((l) => l.trim()).find((l) => l.length > 0)
      if (next !== undefined && !isAllCaps(next) && !SECTION.test(next)) {
        category = line.replace(/:$/, "").trim()
        items.push({ ...base, kind: "category", categoryName: category, by: "allcaps" })
      } else items.push({ ...base, kind: "unread", reason: "heading" })
      return
    }
    // A line with no letters at all ("-----", "12345") is never a skill: it is reported with its original text (B3).
    if (!/\p{L}/u.test(line)) {
      items.push({ ...base, kind: "unread", reason: "unrecognised" })
      return
    }
    if (line.length > 160) {
      items.push({ ...base, kind: "unread", reason: "unrecognised" })
      return
    }
    let name: string
    let description: string
    let cat = category
    if (csv) {
      const parts = line.split(",").map((p) => p.trim())
      if (i === 0 && /^(skill|name)\b/i.test(parts[0])) {
        items.push({ ...base, kind: "unread", reason: "heading" })
        return
      }
      name = parts[0]
      description = parts[1] ?? ""
      cat = parts[2] ? parts[2] : category
    } else {
      ;({ name, description } = splitNameDescription(line.replace(BULLET, "")))
    }
    if (!name || name.length > 80 || !/\p{L}/u.test(name)) {
      items.push({ ...base, kind: "unread", reason: "unrecognised" })
      return
    }
    // A structured CSV row is settled by its columns. A plain list line is the model's to confirm.
    items.push({ ...base, kind: csv ? "skill" : "ambiguous", name, description, categoryName: cat })
  })
  return items
}
