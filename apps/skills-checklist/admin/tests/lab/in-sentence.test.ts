import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { describe, expect, it } from "vitest"
import { inSentence } from "@/lib/lab/terms"
import { levelPhrase, tickRecordsLine } from "@/lib/lab/checkoff-rules"

describe("inSentence: a program label placed mid-sentence (Romit 2026-10-29)", () => {
  it("lowercases the first letter of an ordinary label", () => {
    expect(inSentence("Works alone")).toBe("works alone")
    expect(inSentence("Met")).toBe("met")
    expect(inSentence("Not met")).toBe("not met")
    expect(inSentence("Skills lab")).toBe("skills lab")
    expect(inSentence("Course faculty")).toBe("course faculty")
    expect(inSentence("Did not count")).toBe("did not count")
  })
  it("keeps acronyms, all-caps tokens and mixed-case words", () => {
    for (const x of ["IV therapy", "BSN 2027", "ABSN 2027", "NG tube", "RN", "CPR (Independent Study)", "NURS 350", "iPad", "McKenzie"]) expect(inSentence(x), x).toBe(x)
  })
  it("leaves empty and already-lowercase labels alone", () => {
    expect(inSentence("")).toBe("")
    expect(inSentence("independent")).toBe("independent")
  })
})

describe("tickRecordsLine: what a tick marks the student as (Romit 2026-10-29)", () => {
  const p = { outcomeLabels: ["Met", "Unmet"], qualifyingLabel: 0 as const, levels: ["Observed", "With assistance", "Works alone"], levelIndex: null, questions: ["a", "b", "c"], score: 4 }
  it("binary, question and scored", () => {
    expect(tickRecordsLine("binary", p)).toBe("A tick marks the student as met")
    expect(tickRecordsLine("binary", { ...p, outcomeLabels: ["Achieved", "Not yet"] })).toBe("A tick marks the student as achieved")
    expect(tickRecordsLine("question", p)).toBe("A tick marks every question Yes")
    expect(tickRecordsLine("scored", p)).toBe("A tick scores the student 4 on every item")
  })
  it("levels: 'as' for a state, the colon form for a label that starts with a verb or preposition", () => {
    // The seed's level sets: lib/v2 seed levels (Observed, With assistance, Works alone) and a state-style set.
    expect(tickRecordsLine("demonstration", p)).toBe("A tick marks the student at the level: works alone")
    expect(tickRecordsLine("demonstration", { ...p, levelIndex: 1 })).toBe("A tick marks the student at the level: with assistance")
    expect(tickRecordsLine("demonstration", { ...p, levelIndex: 0 })).toBe("A tick marks the student as observed")
    expect(levelPhrase("Independent")).toBe("as independent")
    expect(levelPhrase("Proficient")).toBe("as proficient")
    expect(levelPhrase("Needs prompting")).toBe("at the level: needs prompting")
    expect(levelPhrase("Requires supervision")).toBe("at the level: requires supervision")
    expect(levelPhrase("Under supervision")).toBe("at the level: under supervision")
    expect(levelPhrase("Without prompts")).toBe("at the level: without prompts")
  })
})

/**
 * Source sweep, narrow on purpose so it never flakes: a known program-label expression (a level, an outcome label, a course-level
 * label, the course faculty role) interpolated right after a lowercase word or comma inside a template literal must go through
 * inSentence() (or an explicit toLowerCase()). Pills, cells and options never sit after a lowercase word, so they are not flagged.
 */
describe("source sweep: program labels mid-sentence go through inSentence", () => {
  it("finds no raw label after a lowercase word in lab copy", () => {
    const root = join(__dirname, "../..")
    const files: string[] = []
    const walk = (d: string) => readdirSync(d).forEach((f) => { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (/\.(ts|tsx)$/.test(f)) files.push(p) })
    ;["lib/lab", "components/lab"].forEach((r) => walk(join(root, r)))
    const LABEL = /(levels\[|outcomeLabels\[|LEVEL_LABEL\[|MAPPING_LEVEL_LABEL\[|\bCOURSE_FACULTY\b|labels\.(met|notMet)\b|\.levelLabel\b)/
    const hits: string[] = []
    for (const f of files) {
      readFileSync(f, "utf8").split("\n").forEach((line, i) => {
        if (/^\s*(\/\/|\*)/.test(line)) return
        for (const m of line.matchAll(/[a-z,] \$\{([^}]*)\}/g)) if (LABEL.test(m[1]) && !/inSentence\(|toLowerCase\(/.test(m[1])) hits.push(`${relative(root, f)}:${i + 1} ${m[0]}`)
      })
    }
    // Known, reviewed: two lists of the program's own outcome labels ("Met or Unmet", a value, not a sentence), and the older rule
    // sentences "at least 2 at Independent or above" / "Counts at Independent or above." (pre-date this rule; their wider rewrite
    // across the rule-sentence copy and its tests is pending Romit's call, 2026-10-29). New code must not add to this list.
    const KNOWN = [
      "lib/lab/configure.ts:1247 r ${rule.outcomeLabels[1] || \"second outcome\"}",
      "lib/lab/configure.ts:1326 r ${rule.outcomeLabels[1] || \"second outcome\"}",
      "lib/lab/configure.ts:324 t ${rule.levels[m.levelIndex].trim()}",
      "lib/lab/evaluator.ts:199 t ${named.levels[min] ?? skill.config.levels[min]}",
    ]
    const strip = (h: string) => h.replace(/:\d+ /, " ")
    expect(hits.filter((h) => !KNOWN.map(strip).includes(strip(h)))).toEqual([])
  })
})
