/**
 * Import and review for the design lab (docs/knowledge/design/import-and-starter-library.md).
 *
 * Pure functions only. The sample file is rendered deterministically from the HGTC checklist (lib/v2/hgtc-library.json, 154 skills,
 * read-only) as the plain text a PDF reader would return, with the realities of a real checklist: numbered, bulleted and plain
 * sections, a "*" or "[R]" mandatory mark, group headings, sub-headings that compose a name ("Urine: Mid-stream urine"), lines that
 * wrap, a repeated page header that loses the section, page furniture, and two lines nobody can read. The page furniture, the two
 * unreadable lines and the wrapped lines are invented sample content, not HGTC fact.
 *
 * The reader is a rule-based stand-in for the AI interpretation [REQ IM-13]: it proposes a name, a section (category), a group and
 * the file's own mark, never an evaluation model or criteria (OD-12 open) [REQ IM-15, SC-02]. Nothing is created here; the plan
 * describes what a confirm would do [REQ IM-05].
 */
import hgtc from "@/lib/v2/hgtc-library.json"
import { STARTER_LIBRARIES } from "@/lib/v2/starter-libraries"
import { aNoun, skillNoun } from "@/lib/lab/terms"

// ---------------------------------------------------------------------------------------------------------------------
// Source data

export interface HgtcSourceRow {
  id: string
  name: string
  section: string
  group?: string
  groupRule?: "any"
  required: boolean
}

export const HGTC_ROWS = hgtc as HgtcSourceRow[]

/** Rows whose asterisk position is ambiguous in the extracted text (docs/knowledge/skills-library-hgtc.json requiredBasis). */
export const AMBIGUOUS_MARK_IDS: ReadonlySet<string> = new Set(["hgtc-medications-13", "hgtc-mobility-02", "hgtc-mobility-03", "hgtc-mobility-04", "hgtc-nutrition-07"])

/** Groups whose heading, not each line, carries the mark: one of the lines satisfies it. */
const HEADING_MARK_GROUPS: ReadonlySet<string> = new Set(["O2 Administration"])

/** Lines that wrap in the sample file (invented): [name, where it breaks]. */
const WRAPS: ReadonlyArray<[string, string]> = [
  ["Thrombo Embolic Device/Sequential Compression Device", "Sequential Compression Device"],
  ["Hangs Large Vol. (1000mL)", "(1000mL)"],
]

export type SampleScale = "standard" | "large"

export const SAMPLE_FILE_NAME: Record<SampleScale, string> = {
  standard: "ADN_Clinical_Checklist.pdf",
  large: "ADN_Checklists_All_Levels.pdf",
}

const LEVELS = ["NUR 101", "NUR 102", "NUR 201", "NUR 202"]

/**
 * The text a reader would extract from the sample file. Standard: the 154-skill checklist. Large: the same checklist repeated for
 * four course levels (about 600 lines read as skills), as programs often keep one checklist per course.
 */
export function buildSampleText(scale: SampleScale = "standard"): string {
  const out: string[] = [
    "Associate Degree Nursing Program",
    "Clinical Skills Validation Checklist",
    "Revised 9/2017",
    "* = must be validated before graduation",
    "Student name: ______________________   ID: __________",
    "",
  ]
  const levels = scale === "large" ? LEVELS : [null]
  let page = 1
  levels.forEach((level) => {
    const sections = [...new Set(HGTC_ROWS.map((r) => r.section))]
    sections.forEach((section, si) => {
      const rows = HGTC_ROWS.filter((r) => r.section === section)
      if (si > 0 && si % 2 === 0) {
        page++
        out.push("", `Page ${page}`, "")
      }
      out.push(level ? `${section}, ${level}` : section)
      const style = section === "Medications" ? "plain" : si % 3 === 0 ? "numbered" : si % 3 === 1 ? "bulleted" : "plain"
      const markStyle = section === "Nutrition" ? "suffix" : "prefix"
      let n = 0
      let openGroup: string | null = null
      let openSub: string | null = null
      let pageBreakDone = false
      rows.forEach((r) => {
        // Repeated page header in the middle of Nutrition: the section is not repeated after it.
        if (section === "Nutrition" && !r.group && openGroup === "IV Therapy" && !pageBreakDone) {
          pageBreakDone = true
          page++
          out.push("", `Page ${page}`, "Clinical Skills Validation Checklist (continued)", "Instructor initials      Date", "")
          openGroup = null
          openSub = null
        }
        if (r.group !== (openGroup ?? undefined)) {
          openSub = null
          openGroup = r.group ?? null
          if (r.group) out.push(`  ${HEADING_MARK_GROUPS.has(r.group) ? "*" : ""}${r.group}:`)
        }
        let name = r.name
        let indent = r.group ? 4 : 2
        const sub = r.group && /^[^:]{3,30}: /.test(r.name) ? r.name.slice(0, r.name.indexOf(": ")) : null
        if (sub) {
          if (openSub !== sub) {
            out.push(`    ${sub}:`)
            openSub = sub
          }
          name = r.name.slice(sub.length + 2)
          indent = 6
        } else openSub = null
        n++
        const prefix = style === "numbered" ? `${n}. ` : style === "bulleted" ? "• " : ""
        const ambiguous = AMBIGUOUS_MARK_IDS.has(r.id)
        if (ambiguous) out.push(`${" ".repeat(indent)}*`)
        const marked = r.required && !ambiguous
        const wrap = WRAPS.find(([full]) => full === r.name)
        const first = wrap ? name.slice(0, name.length - wrap[1].length).trimEnd() : name
        const body = markStyle === "prefix" ? `${marked ? "*" : ""}${first}` : `${first}${marked ? " [R]" : ""}`
        out.push(`${" ".repeat(indent)}${prefix}${body}`)
        if (wrap) out.push(`${" ".repeat(indent + 4)}${wrap[1]}`)
        if (section === "Safety" && r.name === "Restraints") out.push("  ▯▯ ▯▯▯▯ ▯▯")
        if (section === "Elimination" && r.name === "Bladder Scanner") out.push("  pt teaching re: cath care (handwr")
      })
      out.push("")
    })
  })
  page++
  out.push("Student signature ______________________   Date __________", `Page ${page}`)
  return out.join("\n")
}

// ---------------------------------------------------------------------------------------------------------------------
// Reading

export type Mark = "mandatory" | "none" | "unclear" | "heading"

export interface ParsedRow {
  /** Stable within one reading: "r" + one-based line number. */
  id: string
  line: number
  /** The line as written in the file [REQ IM-08]. */
  sourceText: string
  name: string
  section: string | null
  group: string | null
  mark: Mark
  /** Name built from a sub-heading and a line. */
  composed: boolean
  /** This line may continue the row above it. */
  continuation?: { aboveId: string; joinedName: string }
  /** The reader could not read the line; `reading` is its best reading ("" when none). */
  unreadable?: { reading: string }
  /** The section was lost at a repeated page header; this is the section before it. */
  sectionCarried?: string
  /** A description written after the name ("Name – what it covers"), proposed for review [REQ IM-04]. */
  description?: string
  /** Evaluation questions or criteria written under the name ("Criteria: …", "Question: …"), proposed for review [REQ IM-04]. */
  criteria?: string[]
  /** Review edits [REQ IM-05]: an entry the program added (no line in the file), a part of a split line, a line merged into another. */
  added?: true
  splitFrom?: string
  mergedInto?: { id: string; name: string }
}

export type FurnitureKind = "header" | "legend" | "signature" | "page"

export interface FurnitureLine {
  line: number
  text: string
  kind: FurnitureKind
}

export interface ReadResult {
  rows: ParsedRow[]
  /** Lines recognised as page furniture and left out, listed so nothing disappears quietly [REQ IM-08]. */
  furniture: FurnitureLine[]
  /** What the file says its mark means, when it says so. */
  legend: string | null
  sections: string[]
  groups: string[]
}

const PREFIX = /^(?:\d{1,3}[.)]|[••\-–])\s+/
const UNREADABLE = /[▯�]/
/** "Name – description" or "Name - description" (a dash with a space each side). */
const DESCRIPTION_SPLIT = /^(.+?)\s+[-–—]\s+(.+)$/
/** "Criteria: …", "Criterion: …", "Question: …", "Q: …" under a skill. */
const CRITERION = /^(?:criteria|criterion|question|q)\s*[:.]\s*(.+)$/i

function furnitureKind(t: string, isFirstBlock: boolean): FurnitureKind | null {
  if (/^page \d+( of \d+)?$/i.test(t)) return "page"
  if (/_{3,}/.test(t)) return "signature"
  if (/^instructor initials/i.test(t)) return "header"
  if (/\(continued\)\s*$/i.test(t)) return "header"
  if (/^revised \d/i.test(t)) return "header"
  if (isFirstBlock && /(program|checklist)$/i.test(t)) return "header"
  return null
}

const openParenUnbalanced = (t: string) => (t.match(/\(/g)?.length ?? 0) > (t.match(/\)/g)?.length ?? 0)

/**
 * Reads checklist text into proposed rows [REQ IM-01, IM-03, IM-04, IM-07]. No template, column order, number or dash is needed:
 * a plain line is read as a skill exactly like a numbered one (fixes the v2 "add a number or a dash" error [AUDIT T1 IM-03]).
 * Unindented lines are sections, indented lines ending in ":" are groups (or sub-headings inside a group), "*" before or "[R]" after
 * a name is the file's mark.
 */
export function readChecklist(text: string): ReadResult {
  const lines = text.split(/\r?\n/)
  const rows: ParsedRow[] = []
  const furniture: FurnitureLine[] = []
  const sections: string[] = []
  const groups: string[] = []
  let legend: string | null = null
  let section: string | null = null
  let carried: string | null = null
  let group: { name: string; indent: number; marked: boolean } | null = null
  let sub: { name: string; indent: number } | null = null
  let pendingUnclear = false
  let seenSection = false

  lines.forEach((raw, i) => {
    const t = raw.trim()
    if (!t) return
    const line = i + 1
    const indent = raw.length - raw.trimStart().length
    const fk = furnitureKind(t, !seenSection)
    if (fk) {
      furniture.push({ line, text: t, kind: fk })
      if (fk === "header" && /\(continued\)/i.test(t) && section) {
        carried = section
        section = null
        group = null
        sub = null
      }
      return
    }
    const leg = t.match(/^(\*|\[R\])\s*=\s*(.+)$/)
    if (leg) {
      legend = leg[2].trim()
      furniture.push({ line, text: t, kind: "legend" })
      return
    }
    if (/^(\*|\[R\])$/.test(t)) {
      pendingUnclear = true
      return
    }
    if (indent === 0 && !UNREADABLE.test(t)) {
      // "A line ending in a colon starts a category": the colon is punctuation, not part of the category's name.
      const heading = t.replace(/\s*:$/, "")
      section = heading
      carried = null
      group = null
      sub = null
      seenSection = true
      if (!sections.includes(heading)) sections.push(heading)
      return
    }
    if (group && indent <= group.indent) group = null
    if (sub && indent <= sub.indent) sub = null

    let body = t.replace(PREFIX, "")
    let starred = false
    if (body.startsWith("*")) {
      starred = true
      body = body.slice(1).trim()
    }
    if (/\s\[R\]$/.test(body)) {
      starred = true
      body = body.replace(/\s\[R\]$/, "").trim()
    }

    if (body.endsWith(":") && !UNREADABLE.test(body)) {
      const name = body.slice(0, -1).trim()
      if (!group) {
        group = { name, indent, marked: starred }
        if (!groups.includes(name)) groups.push(name)
      } else sub = { name, indent }
      return
    }

    const id = `r${line}`
    const base = { id, line, sourceText: t, section, group: group?.name ?? null, composed: false, ...(section === null && carried ? { sectionCarried: carried } : {}) }

    if (UNREADABLE.test(body) || openParenUnbalanced(body)) {
      const reading = body.replace(/[▯�]/g, "").replace(/\s*\([^)]*$/, "").replace(/\s+/g, " ").trim()
      rows.push({ ...base, name: body, mark: "none", unreadable: { reading } })
      pendingUnclear = false
      return
    }

    const childIndent = sub ? sub.indent + 2 : group ? group.indent + 2 : 2
    const prev = rows[rows.length - 1]
    // A criterion or question written under a skill belongs to it, not a skill of its own [REQ IM-04].
    const crit = body.match(CRITERION)
    if (prev && !prev.unreadable && !prev.continuation && indent > childIndent && crit && crit[1].trim()) {
      prev.criteria = [...(prev.criteria ?? []), crit[1].trim()]
      return
    }
    if (prev && !prev.unreadable && indent > childIndent && (/[/,-]$/.test(prev.sourceText) || /^[(a-z]/.test(body))) {
      rows.push({ ...base, name: body, mark: "none", continuation: { aboveId: prev.id, joinedName: prev.name.endsWith("/") ? `${prev.name}${body}` : `${prev.name} ${body}` } })
      return
    }

    const mark: Mark = pendingUnclear ? "unclear" : starred ? "mandatory" : group?.marked ? "heading" : "none"
    pendingUnclear = false
    // "Name – what it covers": a spaced dash splits the name from a description [REQ IM-04]. No HGTC name contains one.
    const desc = body.match(DESCRIPTION_SPLIT)
    const own = desc ? desc[1].trim() : body
    rows.push({ ...base, name: sub ? `${sub.name}: ${own}` : own, composed: !!sub, mark, ...(desc && desc[2].trim() ? { description: desc[2].trim() } : {}) })
  })
  return { rows, furniture, legend, sections, groups }
}

// ---------------------------------------------------------------------------------------------------------------------
// Duplicates

export interface LibrarySkill {
  id: string
  name: string
  configured: boolean
}

export interface LibraryMatch {
  skillId: string
  skillName: string
  match: "same" | "similar"
}

export interface FileRepeat {
  firstId: string
  firstName: string
  /** True when no earlier one sits under the same group: probably a different skill with the same short name. */
  differentPlace: boolean
}

export const normName = (t: string): string => t.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim()
const tokens = (t: string) => new Set(normName(t).split(" ").filter((w) => w.length > 1))

/** Token overlap (Jaccard), 0 to 1. */
export function similarity(a: string, b: string): number {
  const x = tokens(a)
  const y = tokens(b)
  if (x.size === 0 || y.size === 0) return 0
  let both = 0
  for (const w of x) if (y.has(w)) both++
  return both / (x.size + y.size - both)
}

export const SIMILAR_AT = 0.6

/** Repeats against the target library [REQ IM-06] and inside the file itself. */
export function findDuplicates(rows: ParsedRow[], library: LibrarySkill[]): { library: Record<string, LibraryMatch>; file: Record<string, FileRepeat> } {
  const lib: Record<string, LibraryMatch> = {}
  const file: Record<string, FileRepeat> = {}
  const byName = new Map(library.map((k) => [normName(k.name), k]))
  const seen = new Map<string, ParsedRow[]>()
  // A wrapped name is compared in full: the row below proposes the joined name.
  const joined = new Map(rows.filter((r) => r.continuation).map((r) => [r.continuation!.aboveId, r.continuation!.joinedName]))
  for (const r of rows) {
    if (r.unreadable || r.continuation) continue
    const name = joined.get(r.id) ?? r.name
    const key = normName(name)
    const same = byName.get(key)
    if (same) lib[r.id] = { skillId: same.id, skillName: same.name, match: "same" }
    else {
      let best: LibrarySkill | null = null
      let score = 0
      for (const k of library) {
        const s = similarity(name, k.name)
        if (s > score) {
          score = s
          best = k
        }
      }
      if (best && score >= SIMILAR_AT && tokens(name).size >= 2) lib[r.id] = { skillId: best.id, skillName: best.name, match: "similar" }
    }
    const earlier = seen.get(key) ?? []
    if (earlier.length) {
      // Prefer an earlier row under the same group: the large file repeats each checklist per course level.
      const sameGroup = earlier.find((e) => e.group === r.group)
      const first = sameGroup ?? earlier[0]
      file[r.id] = { firstId: first.id, firstName: joined.get(first.id) ?? first.name, differentPlace: !sameGroup }
    }
    seen.set(key, [...earlier, r])
  }
  return { library: lib, file }
}

// ---------------------------------------------------------------------------------------------------------------------
// Exceptions, fixes, confidence

export type ExceptionKind = "unread" | "continuation" | "duplicate-library" | "duplicate-file" | "section" | "mark"

export const EXCEPTION_ORDER: ExceptionKind[] = ["unread", "continuation", "duplicate-library", "duplicate-file", "section", "mark"]

/**
 * How the file's two heading levels are named in the UI. PENDING-ROMIT (skill-setup-journey 02, J9): REQ has one optional
 * category and any number of tags; the HGTC file has sections and groups. The spec maps section to Category and group to a
 * tag. Every screen reads these words from here, so reversing the call is one edit.
 */
export const IMPORT_GROUPING = { category: "Category", categories: "categories", tag: "tag", tags: "tags" } as const

/**
 * Phase marking (CALL 10-26, item 6): manual add and the one-time bulk add by name are phase 1; importing a file (with AI
 * reading) and copying a starting point are phase 2. Nothing is removed: the routes stay reachable and carry this tag. The
 * one-line note ("Import and AI reading arrive in a later phase.") was tried as the header subtitle and put the wizard
 * variants over their 30-word budget, so the title carries this badge instead.
 */
export const LATER_LABEL = "Later"

export const EXCEPTION_LABEL: Record<ExceptionKind, string> = {
  unread: "Could not read",
  continuation: "May continue the line above",
  "duplicate-library": "Already in the library",
  "duplicate-file": "Twice in this file",
  section: `${IMPORT_GROUPING.category} unclear`,
  mark: "Mark unclear",
}

/** The order the fix list shows the kinds in: lines that would be lost or doubled first (02 section 3.3). */
export const FIX_ORDER: ExceptionKind[] = ["unread", "duplicate-library", "duplicate-file", "continuation", "section", "mark"]

export type Fix =
  | { kind: "skip" }
  | { kind: "add"; name: string }
  | { kind: "join" }
  | { kind: "separate" }
  | { kind: "keep-both"; name: string }
  | { kind: "replace" }
  | { kind: "merge" }
  | { kind: "section"; section: string }
  | { kind: "mark"; to: "this" | "above" | "none" }

export type Decisions = Record<string, Fix>
export const decisionKey = (rowId: string, kind: ExceptionKind): string => `${rowId}|${kind}`

export interface Review {
  rows: ParsedRow[]
  furniture: FurnitureLine[]
  legend: string | null
  sections: string[]
  library: Record<string, LibraryMatch>
  file: Record<string, FileRepeat>
  exceptions: Record<string, ExceptionKind[]>
}

/** Read a file and check it against the target library: everything the review screen needs. */
export function buildReview(text: string, library: LibrarySkill[]): Review {
  const read = readChecklist(text)
  const d = findDuplicates(read.rows, library)
  const exceptions: Record<string, ExceptionKind[]> = {}
  for (const r of read.rows) {
    const list: ExceptionKind[] = []
    if (r.unreadable) list.push("unread")
    if (r.continuation) list.push("continuation")
    if (d.library[r.id]) list.push("duplicate-library")
    if (d.file[r.id]) list.push("duplicate-file")
    if (r.sectionCarried) list.push("section")
    if (r.mark === "unclear") list.push("mark")
    exceptions[r.id] = list
  }
  return { rows: read.rows, furniture: read.furniture, legend: read.legend, sections: read.sections, library: d.library, file: d.file, exceptions }
}

/**
 * The program's own edits to the proposed list, before anything is created [REQ IM-05]: split one line into several skills,
 * merge a line into another, add an entry the file does not have. Kept apart from the reading so the file's lines stay as read
 * [REQ IM-08] and a reread keeps the edits keyed by line.
 */
export interface ReviewEdits {
  /** Row id to the names it becomes (two or more). */
  splits: Record<string, string[]>
  /** Row id to the row id it is merged into. */
  merges: Record<string, string>
  added: Array<{ id: string; name: string; section: string | null }>
}

export const NO_EDITS: ReviewEdits = { splits: {}, merges: {}, added: [] }

/** Splits a name typed as one per line (or separated by ";"), dropping empties and bullets. */
export function splitNames(text: string): string[] {
  return text
    .split(/\r?\n|;/)
    .map((l) => l.replace(PREFIX, "").trim())
    .filter(Boolean)
}

/**
 * Applies the review edits to a reading. Split parts and added entries are checked against the library like any line, so a
 * name already there still asks skip, replace or keep both [REQ IM-06]. A merged line stays listed as left out, "Merged into …".
 */
export function applyReviewEdits(review: Review, edits: ReviewEdits, library: LibrarySkill[]): Review {
  if (!Object.keys(edits.splits).length && !Object.keys(edits.merges).length && !edits.added.length) return review
  const rows: ParsedRow[] = []
  const exceptions: Record<string, ExceptionKind[]> = { ...review.exceptions }
  const fresh: ParsedRow[] = []
  const nameOf = new Map(review.rows.map((r) => [r.id, r.name]))
  for (const r of review.rows) {
    const parts = edits.splits[r.id]
    if (parts && parts.length >= 2) {
      parts.forEach((name, k) => {
        const { continuation: _c, unreadable: _u, sectionCarried: _s, ...rest } = r
        const part: ParsedRow = { ...rest, id: `${r.id}-s${k + 1}`, name, composed: false, mark: r.mark === "unclear" ? "none" : r.mark, splitFrom: r.id }
        rows.push(part)
        fresh.push(part)
      })
      continue
    }
    const into = edits.merges[r.id]
    if (into && into !== r.id && nameOf.has(into)) {
      rows.push({ ...r, mergedInto: { id: into, name: nameOf.get(into)! } })
      exceptions[r.id] = []
      continue
    }
    rows.push(r)
  }
  for (const a of edits.added) {
    const row: ParsedRow = { id: a.id, line: 0, sourceText: "", name: a.name, section: a.section, group: null, mark: "none", composed: false, added: true }
    // After the last line of its category, or at the end.
    let at = -1
    rows.forEach((x, i) => { if (x.section === a.section) at = i })
    rows.splice(at >= 0 ? at + 1 : rows.length, 0, row)
    fresh.push(row)
  }
  const libraryHits = { ...review.library }
  const d = findDuplicates(fresh, library)
  for (const r of fresh) {
    const list: ExceptionKind[] = []
    if (d.library[r.id]) {
      libraryHits[r.id] = d.library[r.id]
      list.push("duplicate-library")
    }
    exceptions[r.id] = list
  }
  return { ...review, rows, library: libraryHits, exceptions }
}

export type Confidence = "clear" | "check" | "look"

export const CONFIDENCE_WORD: Record<Confidence, string> = { clear: "Clear", check: "Check", look: "Needs a decision" }
export const CONFIDENCE_ICON: Record<Confidence, string> = { clear: "fa-circle-check", check: "fa-circle-half-stroke", look: "fa-triangle-exclamation" }

/** How sure the reader is about one row, and why. Never colour alone: the UI shows the icon and the word. */
export function confidenceOf(review: Review, row: ParsedRow): { level: Confidence; reasons: string[] } {
  const ex = review.exceptions[row.id] ?? []
  if (ex.length) return { level: "look", reasons: ex.map((k) => EXCEPTION_LABEL[k]) }
  const reasons: string[] = []
  if (row.composed) reasons.push("Name joins a sub-heading and a line")
  if (row.mark === "heading") reasons.push("Mark is on the group heading")
  if (row.group && !row.composed && normName(row.name).split(" ").length === 1) reasons.push("Short name, read under its group")
  return reasons.length ? { level: "check", reasons } : { level: "clear", reasons: [] }
}

/** The options for one exception, first is the suggestion. `library` decides whether "replace" is offered. */
export function fixOptions(review: Review, row: ParsedRow, kind: ExceptionKind, library: LibrarySkill[]): Array<{ value: Fix["kind"] | `mark-${"this" | "above" | "none"}`; label: string }> {
  switch (kind) {
    case "unread":
      return [{ value: "skip", label: "Leave out" }, { value: "add", label: `Add as ${aNoun()}` }]
    case "continuation":
      return [{ value: "join", label: "Join to the line above" }, { value: "separate", label: `Keep as its own ${skillNoun()}` }, { value: "skip", label: "Leave out" }]
    case "duplicate-library": {
      const m = review.library[row.id]
      const existing = library.find((k) => k.id === m?.skillId)
      const opts: Array<{ value: Fix["kind"]; label: string }> = m?.match === "same" ? [{ value: "skip", label: "Skip, keep the library one" }, { value: "keep-both", label: "Keep both" }] : [{ value: "keep-both", label: "Keep both" }, { value: "skip", label: "Skip, keep the library one" }]
      if (existing && !existing.configured) opts.push({ value: "replace", label: "Replace the library one" })
      return opts
    }
    case "duplicate-file":
      return review.file[row.id]?.differentPlace ? [{ value: "keep-both", label: "Keep both" }, { value: "merge", label: "Merge into the first" }, { value: "skip", label: "Skip this one" }] : [{ value: "merge", label: "Merge into the first" }, { value: "keep-both", label: "Keep both" }, { value: "skip", label: "Skip this one" }]
    case "section":
      return [{ value: "section", label: `Use ${row.sectionCarried ?? "the section above"}` }, { value: "skip", label: "Leave out" }]
    case "mark":
      return [{ value: "mark-this", label: `Mark belongs to this ${skillNoun()}` }, { value: "mark-above", label: `Mark belongs to the ${skillNoun()} above` }, { value: "mark-none", label: "No mark" }]
  }
}

/** A name that differs from the first one, for "keep both". */
export function keepBothName(review: Review, row: ParsedRow): string {
  const place = row.group ?? row.section ?? row.sectionCarried
  const lib = review.library[row.id]
  if (lib && lib.match === "similar") return row.name
  return place ? `${place}: ${row.name}` : `${row.name} (2)`
}

/** Turn an option value into a fix. */
export function toFix(review: Review, row: ParsedRow, value: string): Fix {
  switch (value) {
    case "add":
      return { kind: "add", name: row.unreadable?.reading || row.name }
    case "keep-both":
      return { kind: "keep-both", name: keepBothName(review, row) }
    case "section":
      return { kind: "section", section: row.sectionCarried ?? "" }
    case "mark-this":
      return { kind: "mark", to: "this" }
    case "mark-above":
      return { kind: "mark", to: "above" }
    case "mark-none":
      return { kind: "mark", to: "none" }
    default:
      return { kind: value as "skip" | "join" | "separate" | "replace" | "merge" }
  }
}

export const fixValue = (f: Fix): string => (f.kind === "mark" ? `mark-${f.to}` : f.kind)

/** The suggested fix for one exception. */
export function suggestedFix(review: Review, row: ParsedRow, kind: ExceptionKind, library: LibrarySkill[]): Fix {
  return toFix(review, row, fixOptions(review, row, kind, library)[0].value)
}

/** Fill every undecided exception (optionally of one kind, optionally only some rows) with its suggestion. Bulk fix [REQ IM-14 spirit]. */
export function applySuggestions(review: Review, decisions: Decisions, library: LibrarySkill[], opts: { kind?: ExceptionKind; rowIds?: ReadonlySet<string> } = {}): Decisions {
  const next = { ...decisions }
  for (const r of review.rows) {
    if (opts.rowIds && !opts.rowIds.has(r.id)) continue
    for (const k of review.exceptions[r.id] ?? []) {
      if (opts.kind && k !== opts.kind) continue
      const key = decisionKey(r.id, k)
      if (!next[key]) next[key] = suggestedFix(review, r, k, library)
    }
  }
  return next
}

/** Leave out a set of rows in one go (bulk). */
export function leaveOut(review: Review, decisions: Decisions, rowIds: Iterable<string>): Decisions {
  const next = { ...decisions }
  const ids = new Set(rowIds)
  for (const r of review.rows) {
    if (!ids.has(r.id)) continue
    // A skip on the "unread" key is the row-level leave-out marker; for a readable row it is never an exception of its own.
    next[decisionKey(r.id, "unread")] = { kind: "skip" }
    for (const k of review.exceptions[r.id] ?? []) next[decisionKey(r.id, k)] = k === "mark" ? { kind: "mark", to: "none" } : { kind: "skip" }
  }
  return next
}

/** Put a row back (undo leave out) by clearing its decisions. */
export function clearDecisions(decisions: Decisions, rowId: string): Decisions {
  return Object.fromEntries(Object.entries(decisions).filter(([k]) => !k.startsWith(`${rowId}|`)))
}

// ---------------------------------------------------------------------------------------------------------------------
// Resolution and plan

export type RowStatus = "look" | "ready" | "left-out"

export interface ResolvedRow {
  row: ParsedRow
  status: RowStatus
  /** What will be created (when ready). */
  name: string
  section: string | null
  mandatoryMark: boolean
  /** Short reason when left out. */
  outcome: string
  open: ExceptionKind[]
  replaces?: string
}

/** Apply decisions to every row. Pure; renames are passed in as `names` (row id to edited name) [REQ IM-05]. */
export function resolve(review: Review, decisions: Decisions, names: Record<string, string> = {}): ResolvedRow[] {
  const out = new Map<string, ResolvedRow>()
  for (const r of review.rows) {
    const ex = review.exceptions[r.id] ?? []
    const open = ex.filter((k) => !decisions[decisionKey(r.id, k)])
    const fixes = ex.map((k) => decisions[decisionKey(r.id, k)]).filter(Boolean) as Fix[]
    const manualSkip = decisions[decisionKey(r.id, "unread")]?.kind === "skip" && !r.unreadable
    let status: RowStatus = open.length ? "look" : "ready"
    let outcome = open.length ? open.map((k) => EXCEPTION_LABEL[k]).join(", ") : "Will be created"
    let name = names[r.id] ?? r.name
    let replaces: string | undefined
    for (const f of fixes) {
      if (f.kind === "add") name = names[r.id] ?? f.name
      if (f.kind === "keep-both") name = names[r.id] ?? f.name
      if (f.kind === "replace") replaces = review.library[r.id]?.skillName
    }
    const leaving = r.mergedInto ? `Merged into ${names[r.mergedInto.id] || r.mergedInto.name}` : manualSkip ? "Left out" : fixes.some((f) => f.kind === "skip") ? (ex.includes("duplicate-library") ? "Skipped, already in the library" : "Left out") : fixes.some((f) => f.kind === "merge") ? `Merged into ${review.file[r.id]?.firstName}` : fixes.some((f) => f.kind === "join") ? "Joined to the line above" : null
    if (leaving) {
      status = "left-out"
      outcome = leaving
    } else if (status === "ready" && replaces) outcome = `Replaces ${replaces}`
    const sectionFix = fixes.find((f) => f.kind === "section") as Extract<Fix, { kind: "section" }> | undefined
    const markFix = fixes.find((f) => f.kind === "mark") as Extract<Fix, { kind: "mark" }> | undefined
    const mandatoryMark = r.mark === "mandatory" || (r.mark === "unclear" && markFix?.to === "this")
    out.set(r.id, { row: r, status, name: name.trim(), section: sectionFix ? sectionFix.section : r.section, mandatoryMark, outcome, open, ...(replaces ? { replaces } : {}) })
  }
  // Second pass: joins extend the row above, a mark moved up lands on the row above.
  for (const r of review.rows) {
    const join = decisions[decisionKey(r.id, "continuation")]
    if (join?.kind === "join" && r.continuation) {
      const above = out.get(r.continuation.aboveId)
      if (above && !names[above.row.id]) {
        const rest = r.continuation.joinedName.slice(above.row.name.length)
        above.name = above.name === above.row.name ? r.continuation.joinedName : `${above.name}${rest}`
      }
    }
    const mark = decisions[decisionKey(r.id, "mark")]
    if (mark?.kind === "mark" && mark.to === "above") {
      const idx = review.rows.findIndex((x) => x.id === r.id)
      const above = idx > 0 ? out.get(review.rows[idx - 1].id) : undefined
      if (above) above.mandatoryMark = true
    }
  }
  // A rename to an empty name or to a name already used by another ready row re-opens the row.
  const used = new Map<string, string>()
  for (const v of out.values()) {
    if (v.status !== "ready") continue
    if (!v.name) {
      v.status = "look"
      v.outcome = "Name is empty"
      continue
    }
    const key = normName(v.name)
    if (used.has(key) && used.get(key) !== v.row.id) {
      v.status = "look"
      v.outcome = `Same name as another ${skillNoun()} here`
    } else used.set(key, v.row.id)
  }
  return review.rows.map((r) => out.get(r.id)!)
}

export interface ImportSummary {
  /** Lines read as skills (not counting unreadable lines). */
  read: number
  ready: number
  look: number
  duplicates: number
  leftOut: number
  unreadable: number
}

export function summarize(review: Review, resolved: ResolvedRow[]): ImportSummary {
  return {
    read: review.rows.filter((r) => !r.unreadable).length,
    ready: resolved.filter((r) => r.status === "ready").length,
    look: resolved.filter((r) => r.status === "look").length,
    duplicates: review.rows.filter((r) => review.library[r.id] || review.file[r.id]).length,
    leftOut: resolved.filter((r) => r.status === "left-out").length,
    unreadable: review.rows.filter((r) => r.unreadable).length,
  }
}

export interface ImportPlan {
  create: number
  replace: number
  leftOut: number
  /** Wrapped lines joined to the line above: not lost, so not counted as left out. */
  joined: number
  sections: string[]
  marked: number
  blocked: number
}

export function planImport(resolved: ResolvedRow[]): ImportPlan {
  const ready = resolved.filter((r) => r.status === "ready")
  return {
    create: ready.filter((r) => !r.replaces).length,
    replace: ready.filter((r) => r.replaces).length,
    leftOut: resolved.filter((r) => r.status === "left-out" && !r.outcome.startsWith("Joined")).length,
    joined: resolved.filter((r) => r.status === "left-out" && r.outcome.startsWith("Joined")).length,
    sections: [...new Set(ready.map((r) => r.section).filter((s): s is string => !!s))],
    marked: ready.filter((r) => r.mandatoryMark).length,
    blocked: resolved.filter((r) => r.status === "look").length,
  }
}

const n = (count: number, one: string, many: string) => `${count.toLocaleString("en-US")} ${count === 1 ? one : many}`

/** The "what will happen" sentence shown before Confirm. No default evaluation model: every new skill is not configured [REQ SC-02, IM-09]. */
export function planSentence(plan: ImportPlan, target: string, noun = { one: "skill", many: "skills" }): string {
  if (plan.blocked > 0) return `${n(plan.blocked, "row needs", "rows need")} a decision before anything is created.`
  const parts = [`${n(plan.create, noun.one, noun.many)} will be created in ${target}, each not configured`]
  if (plan.replace) parts.push(`${n(plan.replace, `library ${noun.one} is`, `library ${noun.many} are`)} replaced`)
  if (plan.joined) parts.push(`${n(plan.joined, "wrapped line is", "wrapped lines are")} joined to the line above`)
  if (plan.leftOut) parts.push(`${n(plan.leftOut, "line is", "lines are")} left out`)
  return `${parts.join("; ")}. Nothing else in your library changes.`
}

// ---------------------------------------------------------------------------------------------------------------------
// Screen helpers for the redesigned import (docs/knowledge/design/skill-setup-journey/02 section 3)

/** Rows with no category in the file (a pasted list, or lines before the first heading). */
export const NO_CATEGORY = "No category"

/**
 * The line as a person can read it, or null when the reader returned no letters at all. The UI shows null as
 * "Text could not be read" and never prints replacement glyphs (the tofu defect in the built review).
 */
export function readableText(row: ParsedRow): string | null {
  const t = row.sourceText.replace(/[▯�]/g, "").replace(/\s+/g, " ").trim()
  return /[a-z]/i.test(t) ? t : null
}

/** The one kind a line is listed under in the fix list: the first of FIX_ORDER it has. */
export function primaryKind(review: Review, row: ParsedRow): ExceptionKind | null {
  const ex = review.exceptions[row.id] ?? []
  return FIX_ORDER.find((k) => ex.includes(k)) ?? null
}

export interface FixGroup {
  kind: ExceptionKind
  rows: ParsedRow[]
  /** Lines in this group with at least one decision still to make. */
  open: number
}

/** Lines that need a decision, one group per kind, each line listed once (counts are lines, never decisions). */
export function fixGroups(review: Review, decisions: Decisions): FixGroup[] {
  return FIX_ORDER.map((kind) => {
    const rows = review.rows.filter((r) => primaryKind(review, r) === kind)
    const open = rows.filter((r) => (review.exceptions[r.id] ?? []).some((k) => !decisions[decisionKey(r.id, k)])).length
    return { kind, rows, open }
  }).filter((g) => g.rows.length > 0)
}

/**
 * The one suggestion every line in a group shares (its label), or null when the lines differ. A group with one shared suggestion
 * starts folded (one Accept decides it); a mixed group opens, because those lines need a person to look (Romit 2026-10-27).
 */
export function groupSuggestion(review: Review, group: FixGroup, library: LibrarySkill[]): string | null {
  const labels = new Set<string>()
  for (const r of group.rows) {
    for (const k of review.exceptions[r.id] ?? []) labels.add(fixOptions(review, r, k, library)[0].label)
    if (labels.size > 1) return null
  }
  return labels.size === 1 ? [...labels][0] : null
}

/** True when every decision in the group is made and each one is the suggestion ("Accepted"), not a person's own choice. */
export function groupAccepted(review: Review, group: FixGroup, decisions: Decisions, library: LibrarySkill[]): boolean {
  return group.rows.every((r) =>
    (review.exceptions[r.id] ?? []).every((k) => {
      const d = decisions[decisionKey(r.id, k)]
      return !!d && fixValue(d) === fixValue(suggestedFix(review, r, k, library))
    }),
  )
}

/** Lines with at least one decision still open (the fix step's own count, before resolving). */
export const openLines = (review: Review, decisions: Decisions): number =>
  review.rows.filter((r) => (review.exceptions[r.id] ?? []).some((k) => !decisions[decisionKey(r.id, k)])).length

/** Lines that need a decision before Create (the resolver's own count). */
export const linesLeft = (resolved: ResolvedRow[]): number => resolved.filter((r) => r.status === "look").length

/** One short line of context for a decision, so the admin decides without opening the file. */
export function fixContext(review: Review, row: ParsedRow, kind: ExceptionKind): string | null {
  switch (kind) {
    case "duplicate-library": {
      const m = review.library[row.id]
      return m ? `${m.match === "same" ? "Same as" : "Like"} "${m.skillName}" in the library` : null
    }
    case "duplicate-file": {
      const rep = review.file[row.id]
      const first = rep ? review.rows.find((x) => x.id === rep.firstId) : undefined
      return first ? `Also line ${first.line}, "${rep!.firstName}"` : null
    }
    case "continuation":
      return row.continuation ? `Would read "${row.continuation.joinedName}"` : null
    case "section":
      return row.sectionCarried ? `After a page break, below ${row.sectionCarried}` : "After a page break"
    case "mark":
      return "The mark sits on its own line"
    case "unread":
      return null
  }
}

export interface CategoryGroup {
  name: string
  rows: ResolvedRow[]
  /** Lines in this category that still need a decision. */
  toDecide: number
}

/** What was read, in the file's own categories and order; inside each, the lines that need a decision come first. */
export function categoriesOf(resolved: ResolvedRow[]): CategoryGroup[] {
  const map = new Map<string, ResolvedRow[]>()
  for (const r of resolved) {
    const name = r.section ?? r.row.sectionCarried ?? NO_CATEGORY
    map.set(name, [...(map.get(name) ?? []), r])
  }
  const rank = (r: ResolvedRow) => (r.status === "look" ? 0 : r.status === "ready" ? 1 : 2)
  return [...map.entries()].map(([name, rows]) => ({
    name,
    // Entries added in review (no line in the file) sort after the file's lines.
    rows: [...rows].sort((a, b) => rank(a) - rank(b) || Number(!!a.row.added) - Number(!!b.row.added) || a.row.line - b.row.line),
    toDecide: rows.filter((r) => r.status === "look").length,
  }))
}

/** What a confirm would not create, by reason. Joined lines are not lost; they are named apart. */
export function notCreated(resolved: ResolvedRow[]): { leftOut: ResolvedRow[]; merged: ResolvedRow[]; joined: ResolvedRow[] } {
  const out = resolved.filter((r) => r.status === "left-out")
  return {
    leftOut: out.filter((r) => !r.outcome.startsWith("Merged") && !r.outcome.startsWith("Joined")),
    merged: out.filter((r) => r.outcome.startsWith("Merged")),
    joined: out.filter((r) => r.outcome.startsWith("Joined")),
  }
}

/** The Confirm step's plan sentence: what will be added, where, in how many categories. Nothing about a model [REQ SC-02]. */
export function confirmSentence(plan: ImportPlan, target: string, noun = { one: "skill", many: "skills" }): string {
  const total = plan.create + plan.replace
  const cats = plan.sections.length
  const where = cats > 0 ? `, in ${n(cats, IMPORT_GROUPING.category.toLowerCase(), IMPORT_GROUPING.categories)}` : ""
  const replaced = plan.replace ? ` ${n(plan.replace, `library ${noun.one} is`, `library ${noun.many} are`)} replaced.` : ""
  return `${n(total, noun.one, noun.many)} will be added to ${target}${where}.${replaced}`
}

/**
 * Pasted text as checklist text the reader understands [REQ IM-03: any layout]. Text that already has indented lines is a
 * checklist and is read as it is. A flat list becomes one skill per line; a short line ending in ":" starts a category;
 * `category` (from add a skill, paste several) heads the whole list.
 */
export function pasteToText(text: string, category?: string): string {
  const lines = text.split(/\r?\n/)
  if (lines.some((l) => /^\s+\S/.test(l))) return text
  const out: string[] = []
  if (category?.trim()) out.push(category.trim())
  for (const raw of lines) {
    const t = raw.trim()
    if (!t) continue
    if (t.endsWith(":") && t.length <= 60 && !/^\d/.test(t)) {
      out.push(t.slice(0, -1).trim())
      continue
    }
    out.push(`  ${t}`)
  }
  return out.join("\n")
}

/** The sessionStorage key add a skill (paste several) writes and the import reads with ?source=paste (03 section 7). */
export const PASTE_KEY = "lab:import:paste"
export type PastePayload = { text: string; category?: string }

export function parsePastePayload(raw: string | null): PastePayload | null {
  if (!raw) return null
  try {
    const v = JSON.parse(raw) as Partial<PastePayload>
    return typeof v.text === "string" && v.text.trim() ? { text: v.text, ...(typeof v.category === "string" ? { category: v.category } : {}) } : null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// Import targets

export interface ImportTarget {
  id: string
  label: string
}

/** Library labels for the v2 specialties. The target is always chosen, never assumed (v2 stamped every file bsn-med-surg [AUDIT T1]). */
export const TARGET_LABEL: Record<string, string> = {
  "bsn-med-surg": "Medical-surgical nursing",
  "adn-hgtc": "Associate degree nursing",
  radiography: "Radiography",
  "surgical-tech": "Surgical technology",
  paramedic: "Paramedic",
}

export const NEW_LIBRARY = "new"

/**
 * The program's default list (one default list at a time, LEDGER D-X17). An import goes here unless the admin changes it
 * under the dropzone (skill-setup-journey 02, J1); repeats are still checked against whichever list is chosen [REQ IM-06].
 */
export const DEFAULT_LIST = "bsn-med-surg"

export function importTargets(skills: Array<{ specialty: string }>): Array<ImportTarget & { count: number }> {
  const counts = new Map<string, number>()
  for (const k of skills) counts.set(k.specialty, (counts.get(k.specialty) ?? 0) + 1)
  return Object.keys(TARGET_LABEL).map((id) => ({ id, label: TARGET_LABEL[id], count: counts.get(id) ?? 0 }))
}

// ---------------------------------------------------------------------------------------------------------------------
// Starting points (starter libraries): PENDING-ROMIT, conflicts with REQ SL-01. Framed as copies the program owns.

export interface StartingPointSkill {
  name: string
  section: string
  group?: string
}

export interface StartingPoint {
  id: string
  label: string
  discipline: string
  summary: string
  skills: StartingPointSkill[]
}

export function startingPoints(): StartingPoint[] {
  const fromV2: StartingPoint[] = STARTER_LIBRARIES.map((l) => ({
    id: l.specialty,
    label: l.label,
    discipline: l.label.split(" ")[0] === "BSN" ? "Nursing" : l.label,
    summary: l.blurb,
    skills: l.skills.map((k) => ({ name: k.name, section: k.category })),
  }))
  const adn: StartingPoint = {
    id: "adn-two-year",
    label: "Two-year nursing checklist",
    discipline: "Nursing",
    summary: "A full associate degree clinical checklist in ten categories.",
    skills: HGTC_ROWS.map((r) => ({ name: r.name, section: r.section, ...(r.group ? { group: r.group } : {}) })),
  }
  return [adn, ...fromV2]
}

export const sectionsOf = (p: StartingPoint): string[] => [...new Set(p.skills.map((k) => k.section))]

export interface CopyPlan {
  copy: number
  repeats: string[]
}

/** What "Use as a starting point" would copy into a library, and which names are already there (v2 never checked [AUDIT T1]). */
export function copyPlan(p: StartingPoint, library: LibrarySkill[], keepRepeats: boolean): CopyPlan {
  const names = new Set(library.map((k) => normName(k.name)))
  const repeats = p.skills.filter((k) => names.has(normName(k.name))).map((k) => k.name)
  return { copy: keepRepeats ? p.skills.length : p.skills.length - repeats.length, repeats }
}
