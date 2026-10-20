import type { V2State } from "./types"

export interface ProposedSkill {
  /** Stable within one proposal. */
  id: string
  name: string
  description: string
  category: string
  /** One-based line number in the source text, and the original text of that line (IM-08). */
  line: number
  sourceText: string
  /** Name of an existing library skill this one repeats (IM-06), or null. */
  duplicateOf: string | null
}

export interface UnreadLine {
  line: number
  text: string
}

export interface ImportProposal {
  skills: ProposedSkill[]
  unread: UnreadLine[]
  categories: string[]
}

export const NO_CATEGORY = "No category"

const MARKER = /^\s*(?:\d{1,3}[.)]|[-•*])\s+(\S.*)$/
const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()

/** "Name - description" or "Name: description". The name is the part before the first separator. */
function splitNameAndDescription(text: string): { name: string; description: string } {
  const m = text.match(/^(.{3,80}?)(?:\s+(?:-|–)\s+|:\s+)(.+)$/)
  return m ? { name: m[1].trim(), description: m[2].trim() } : { name: text.trim(), description: "" }
}

/**
 * Reads a plain-text checklist into a proposal (IM-01, IM-03, IM-04, IM-07). No template or column order is needed. Numbered or
 * bulleted lines become skills; a short unmarked line directly above them becomes their category. Everything else is returned
 * with its line number and original text instead of being dropped (IM-08). This is a rule-based stand-in for the AI reading:
 * it proposes only a name, description and category, never a model or criteria (OD-12).
 */
export function proposeFromText(text: string, existing: Pick<V2State, "skills">): ImportProposal {
  const lines = text.split(/\r?\n/)
  const existingByName = new Map(existing.skills.map((k) => [norm(k.name), k.name]))
  const skills: ProposedSkill[] = []
  const unread: UnreadLine[] = []
  const categories: string[] = []
  let category = NO_CATEGORY
  const seen = new Set<string>()

  const nextNonBlank = (from: number) => {
    for (let j = from; j < lines.length; j++) if (lines[j].trim()) return j
    return -1
  }

  lines.forEach((raw, i) => {
    const t = raw.trim()
    if (!t) return
    const marked = t.match(MARKER)
    if (marked) {
      const { name, description } = splitNameAndDescription(marked[1])
      if (name.length < 3) {
        unread.push({ line: i + 1, text: t })
        return
      }
      const key = norm(name)
      const dupInList = seen.has(key)
      seen.add(key)
      skills.push({
        id: `px-${i + 1}`,
        name,
        description,
        category,
        line: i + 1,
        sourceText: t,
        duplicateOf: existingByName.get(key) ?? (dupInList ? name : null),
      })
      return
    }
    const words = t.split(/\s+/).length
    const nextIdx = nextNonBlank(i + 1)
    const nextIsSkill = nextIdx >= 0 && MARKER.test(lines[nextIdx].trim())
    if (nextIsSkill && words <= 5 && t.length <= 40 && !/[:;_]/.test(t) && !/[.]$/.test(t) && !/\d{4}/.test(t)) {
      category = t
      if (!categories.includes(t)) categories.push(t)
      return
    }
    unread.push({ line: i + 1, text: t })
  })
  return { skills, unread, categories }
}
