// The questions TypeSafe is asked per candidate line (docs/build/typesafe-import-design.md §2.3). The model never writes text: it
// answers typed questions about spans that CODE extracted (select, do not generate). It is never asked about evaluation models or
// criteria (OD-12 stays open).
import { choice, noul, type ChoiceQuestion, type JsonValue, type NoulQuestion } from "@typesafe-ai/sdk"
import { IMPORT_LIMITS } from "./thresholds"
import { estimateTokens, type Candidate } from "./chunk"

export type KindOrder = "heading-first" | "skill-first"

export interface ChunkContext {
  sourceLabel: string
  /** Headings found by the rules, in document order. */
  headings: string[]
  /** Ask the optional category question (PDF and DOCX, where reading order can be scrambled). */
  categoryByModel: boolean
  /** The smoke script runs both orders to measure the documented lean toward the first option. */
  kindOrder?: KindOrder
}

const trunc = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s)

/** Unique option keys for headings; duplicates get " (2)" and are mapped back in code. */
export function headingKeys(headings: string[]): Array<{ key: string; heading: string }> {
  const seen = new Map<string, number>()
  return headings.map((h) => {
    const base = trunc(h.trim(), 80) || "heading"
    const n = (seen.get(base.toLowerCase()) ?? 0) + 1
    seen.set(base.toLowerCase(), n)
    return { key: n === 1 ? base : `${base} (${n})`, heading: h }
  })
}

const KIND_DEFS: Record<"section_heading" | "skill" | "other", { [key: string]: JsonValue }> = {
  section_heading: {
    what: "A title that groups the lines beneath it, such as a body system, a unit, a course block or a category.",
    examples: ["RESPIRATORY SKILLS", "Section 2", "Medication skills"],
    not_for: "A single practice skill that has its own name.",
  },
  skill: {
    what: "One practice skill that a student can be watched performing, named in a short phrase.",
    examples: ["Insert a peripheral IV catheter", "Vital signs assessment", "Sterile dressing change"],
    not_for: "Headings, notes, instructions to the reader, scales or criteria, page numbers.",
  },
  other: {
    what: "Anything else: page numbers, headers and footers, instructions, notes, signatures, scoring scales, fragments that are not a skill and not a heading.",
    examples: ["Page 3 of 12", "Students must complete all items", "Date: ______"],
  },
}

export function kindCriteria(order: KindOrder = "heading-first") {
  return order === "heading-first"
    ? { section_heading: KIND_DEFS.section_heading, skill: KIND_DEFS.skill, other: KIND_DEFS.other }
    : { skill: KIND_DEFS.skill, section_heading: KIND_DEFS.section_heading, other: KIND_DEFS.other }
}

export const DETAIL_CRITERIA: { true: { [key: string]: JsonValue }; false: { [key: string]: JsonValue } } = {
  true: { what: "The line continues or explains the previous line.", examples: ["Use the smallest gauge that allows adequate flow"] },
  false: { what: "The line names its own skill, or is a heading, or is unrelated to the previous line.", examples: ["Dress a sterile wound"] },
}

export interface ChunkRequest {
  state: { list_context: { kind: string; source: string; headings_found_by_code: string[] }; lines: Array<{ n: number; text: string; before: string; after: string }> }
  questions: Record<string, ChoiceQuestion | NoulQuestion>
  /** headings option keys, for mapping a category answer back. */
  headingMap: Map<string, string>
}

/** Question ids are for code only (they are not sent to the model): k = kind, d = detail, c = category, by chunk index. */
export function buildChunkRequest(chunk: Candidate[], ctx: ChunkContext): ChunkRequest {
  const lines = chunk.map((c) => ({
    n: c.n,
    text: trunc(c.text, IMPORT_LIMITS.maxLineChars),
    before: trunc(c.before, IMPORT_LIMITS.neighbourChars),
    after: trunc(c.after, IMPORT_LIMITS.neighbourChars),
  }))
  const keyed = headingKeys(ctx.headings)
  const headingMap = new Map(keyed.map((k) => [k.key, k.heading]))
  const withCategory = ctx.categoryByModel && ctx.headings.length >= IMPORT_LIMITS.minHeadingsForCategoryQuestion && ctx.headings.length <= IMPORT_LIMITS.maxHeadingsForCategoryQuestion
  const questions: ChunkRequest["questions"] = {}
  chunk.forEach((c, i) => {
    questions[`k${i}`] = choice(
      {
        question: `What is \`lines[${i}].text\` in this list? Judge only this line. Use \`lines[${i}].before\` and \`lines[${i}].after\` as context only.`,
        context: "`list_context.kind`",
      },
      kindCriteria(ctx.kindOrder),
    )
    if (c.askDetail && !c.auditOnly) {
      questions[`d${i}`] = noul(
        `Does \`lines[${i}].text\` only add detail to the skill named in \`lines[${i}].before\` (a description, qualifier or note about that skill) instead of naming a different skill?`,
        DETAIL_CRITERIA,
      )
    }
    if (withCategory && !c.auditOnly) {
      const options: Record<string, string | null> = {}
      for (const k of keyed) options[k.key] = null
      options["none"] = "No heading fits this line."
      questions[`c${i}`] = choice(
        `Under which heading does the skill \`lines[${i}].text\` belong? Use the context lines only to decide, not the order of the headings.`,
        options,
      )
    }
  })
  return {
    state: {
      list_context: {
        kind: "A list of practice skills that a health-professions program expects students to perform, taken from a spreadsheet, document or PDF",
        source: ctx.sourceLabel,
        headings_found_by_code: ctx.headings.map((h) => trunc(h, 80)),
      },
      lines,
    },
    questions,
    headingMap,
  }
}

/** Rough input token estimate of a built request, used to enforce the chunk cap. */
export function estimateRequestTokens(req: Pick<ChunkRequest, "state" | "questions">): number {
  return estimateTokens(JSON.stringify(req.state) + JSON.stringify(req.questions))
}
