import { describe, expect, it } from "vitest"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { OUTCOME_LABEL as SHARED_OUTCOME } from "@/lib/v2/labels"
import { OUTCOME_LABEL as ATT_OUTCOME } from "@/lib/lab/attainment"
import { OUTCOME_WORD, stateLabel } from "@/lib/lab/student"
import { ATTENTION_LABEL } from "@/lib/lab/reviewer"
import { RESULT_WORD } from "@/lib/lab/student2"
import { RECORD_STATE_META, STUDENT_NOT_COUNTED, STUDENT_STATE_LABEL, binaryLabels, outcomeWord } from "@/lib/v2/labels"
import { createSeed } from "@/lib/v2/seed"
import { itemDetail, labState, reviewRows } from "@/lib/lab/reviewer"
import { choicesFor, labSessionSkills } from "@/lib/lab/evaluator"

/**
 * One word per status (glossary.md, lib/v2/labels.ts). Greps lib/lab and components/lab for the banned alternates in string
 * literals: "Not met" as a label (the default is "Unmet", REQ section 4.1), "Waiting for approval" (the state is "Awaiting
 * approval"), and "items" in copy (decision D-B: the program's noun, normally "skills"). Comments are not UI and are skipped.
 */

const ROOT = join(__dirname, "..", "..")
const DIRS = ["lib/lab", "components/lab"]

function files(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...files(p))
    else if (/\.(ts|tsx)$/.test(name)) out.push(p)
  }
  return out
}

/** String literal contents on non-comment lines: "...", '...' and template text. */
function literals(src: string): Array<{ line: number; text: string }> {
  const out: Array<{ line: number; text: string }> = []
  src.split("\n").forEach((raw, i) => {
    const line = raw.trim()
    if (line.startsWith("//") || line.startsWith("*") || line.startsWith("/*")) return
    for (const m of raw.matchAll(/"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'|`([^`]*)`/g)) out.push({ line: i + 1, text: m[1] ?? m[2] ?? m[3] ?? "" })
  })
  return out
}

/** A legacy program label converted to the default on read (configure.ts maps a stored "Not met" to "Unmet"). */
const ALLOW_NOT_MET = new Set(["lib/lab/configure.ts"])

const hits: Record<string, string[]> = { notMet: [], waitingForApproval: [], items: [], doesNotQualify: [] }
for (const d of DIRS) {
  for (const f of files(join(ROOT, d))) {
    const rel = relative(ROOT, f)
    for (const { line, text } of literals(readFileSync(f, "utf8"))) {
      if (/^Not met$/.test(text.trim()) && !ALLOW_NOT_MET.has(rel)) hits.notMet.push(`${rel}:${line}`)
      if (/waiting for approval/i.test(text)) hits.waitingForApproval.push(`${rel}:${line}`)
      if (/^Does not qualify$/.test(text.trim())) hits.doesNotQualify.push(`${rel}:${line}`)
      // "items" as a word, not the CSS utilities items-center / items-start (and not an identifier like lineItems).
      if (/(^|[^-\w])items([^-\w]|$)/i.test(text) && !/\b(className|import)\b/.test(text)) hits.items.push(`${rel}:${line}: ${text.slice(0, 60)}`)
    }
  }
}

describe("shared status words in lib/lab and components/lab", () => {
  it('no "Not met" label (the default binary label is "Unmet")', () => {
    expect(hits.notMet).toEqual([])
  })
  it('no "Waiting for approval" (the state is "Awaiting approval")', () => {
    expect(hits.waitingForApproval).toEqual([])
  })
  it('no "items" in copy', () => {
    expect(hits.items).toEqual([])
  })
  it('no "Does not qualify" label (the skill-record state is "Evidence does not qualify")', () => {
    expect(hits.doesNotQualify).toEqual([])
    expect(RECORD_STATE_META.unqualified.label).toBe("Evidence does not qualify")
    // "Did not count" stays as the student's result word for one attempt.
    expect(RESULT_WORD["not-counted"]).toBe("Did not count")
  })
  it('students read one phrase, "Did not count"; "Evidence does not qualify" is staff and engine only', () => {
    expect(STUDENT_STATE_LABEL.unqualified).toBe("Did not count")
    expect(STUDENT_NOT_COUNTED).toBe("Did not count")
    expect(stateLabel("dnq", 0, 3)).toBe(STUDENT_NOT_COUNTED)
    // No student-facing file spells the staff phrase in a string literal.
    const studentFiles = DIRS.flatMap((d) => files(join(ROOT, d))).map((f) => relative(ROOT, f)).filter((f) => /components\/lab\/(student|student2)\/|components\/lab\/screens\/student-|lib\/lab\/student2?\.ts$/.test(f))
    expect(studentFiles.length).toBeGreaterThan(20)
    const leaks = studentFiles.flatMap((f) => literals(readFileSync(join(ROOT, f), "utf8")).filter((l) => /Evidence does not qualify/i.test(l.text)).map((l) => `${f}:${l.line}`))
    expect(leaks).toEqual([])
  })
  it('outcome labels: a stored legacy "Not met" reads "Unmet"; a program\'s own labels show as configured', () => {
    expect(outcomeWord("Not met")).toBe("Unmet")
    expect(outcomeWord("Fail")).toBe("Fail")
    expect(binaryLabels(["Met", "Not met"])).toEqual(["Met", "Unmet"])
    expect(binaryLabels(["Pass", "Fail"])).toEqual(["Pass", "Fail"])
    expect(binaryLabels(null)).toEqual(["Met", "Unmet"])
  })
  it('lab grid answer chips never say "Not met"', () => {
    const s = labState(createSeed())
    const skills = labSessionSkills(s)
    expect(skills.length).toBeGreaterThan(0)
    for (const k of skills) {
      const skill = s.skills.find((x) => x.id === k.id)!
      const words = choicesFor(skill, true).map((c) => c.label)
      expect(words).not.toContain("Not met")
    }
  })
  it('reviewer "why held" text and the compare rows never say "Not met"', () => {
    const s = labState(createSeed())
    const rows = reviewRows(s)
    expect(rows.length).toBeGreaterThan(0)
    const disagree = rows.filter((r) => r.reasons.includes("disagree"))
    expect(disagree.length).toBeGreaterThan(0)
    for (const r of rows) expect(r.why).not.toMatch(/\bNot met\b/)
    for (const r of disagree) {
      const d = itemDetail(s, rows, r.key)!
      for (const c of d.comparisons) for (const x of c.rows) {
        expect(x.student).not.toBe("Not met")
        expect(x.evaluator).not.toBe("Not met")
      }
    }
  })
  it("lab outcome and status maps read the shared labels", () => {
    expect(ATT_OUTCOME).toEqual(SHARED_OUTCOME)
    expect(OUTCOME_WORD).toEqual(SHARED_OUTCOME)
    expect(ATTENTION_LABEL.approval).toBe("Awaiting approval")
    expect(RESULT_WORD.waiting).toBe("Awaiting approval")
  })
})

/**
 * Remediation stays outside the system for now (REQ section 14; Oct 26 call, item 18): no lab screen may offer a remediation or
 * intervention plan, or name one, in user-facing copy. Comments are not UI and are skipped.
 */
describe("no remediation call to action in lib/lab and components/lab", () => {
  const found: string[] = []
  for (const d of DIRS) {
    for (const f of files(join(ROOT, d))) {
      const rel = relative(ROOT, f)
      for (const { line, text } of literals(readFileSync(f, "utf8"))) {
        if (/remediat|intervention/i.test(text)) found.push(`${rel}:${line}: ${text.slice(0, 60)}`)
      }
    }
  }
  it('no "remediation" or "intervention" in copy', () => {
    expect(found).toEqual([])
  })
})
