// @vitest-environment node
// LIVE smoke for the TypeSafe import assist. Skipped unless SMOKE=1 and TYPESAFE_API_KEY is set (run it with `pnpm smoke:typesafe`).
// It asks the model about ~10 representative lines through the EXACT production question builders, in BOTH option orders (the model
// leans toward the first option), and prints probabilities for threshold tuning. It never prints the key, headers or full responses.
import { describe, it } from "vitest"
import { buildChunkRequest } from "@/lib/import-ai/questions"
import { makeClient } from "@/lib/import-ai/client"
import { kindVerdict } from "@/lib/import-ai/assemble"
import type { Candidate } from "@/lib/import-ai/chunk"

const LINES = [
  "Insert a peripheral IV catheter",
  "RESPIRATORY SKILLS",
  "Use the smallest gauge that allows adequate flow",
  "Vital signs assessment: temperature, pulse, respiration, blood pressure",
  "Page 3 of 12",
  "Students must complete all items by week 10",
  "Section 2 - Advanced procedures",
  "3) Tracheostomy care",
  "Medication reconciliation",
  "Date: ______",
]

const live = process.env.SMOKE === "1" && (process.env.TYPESAFE_API_KEY ?? "").trim().length > 0

type Ans = { choice: string; confidence: number; probabilities: Record<string, number> }

describe.skipIf(!live)("TypeSafe import smoke (live)", () => {
  it("prints answers and probabilities for both option orders", async () => {
    const client = makeClient()
    const cands: Candidate[] = LINES.map((text, i) => ({ n: i + 1, text, before: LINES[i - 1] ?? "", after: LINES[i + 1] ?? "", askDetail: i > 0, auditOnly: false }))
    const rows: Array<Record<string, string | number>> = []
    let disagree = 0
    let inputTokens = 0
    const t0 = Date.now()
    const byOrder = {} as Record<string, Record<string, unknown>>
    const ms: Record<string, number> = {}
    for (const order of ["heading-first", "skill-first"] as const) {
      const req = buildChunkRequest(cands, { sourceLabel: "pasted list", headings: ["RESPIRATORY SKILLS", "Section 2 - Advanced procedures"], categoryByModel: true, kindOrder: order })
      const t = Date.now()
      const res = await client.systemOne({ state: req.state, questions: req.questions } as never)
      ms[order] = Date.now() - t
      inputTokens += res.usage.input_tokens
      byOrder[order] = res.answers as Record<string, unknown>
    }
    LINES.forEach((text, i) => {
      const a = byOrder["heading-first"][`k${i}`] as Ans
      const b = byOrder["skill-first"][`k${i}`] as Ans
      const d = byOrder["heading-first"][`d${i}`] as { noul: number } | undefined
      const same = a.choice === b.choice
      if (!same) disagree += 1
      const p = (x: Ans, k: string) => (x.probabilities[k] ?? 0).toFixed(2)
      const kindA = { section_heading: x(a, "section_heading"), skill: x(a, "skill"), other: x(a, "other"), confidence: a.confidence }
      rows.push({
        n: i + 1,
        line: text.length > 46 ? `${text.slice(0, 45)}…` : text,
        "A:choice": a.choice,
        "A:skill": p(a, "skill"),
        "A:head": p(a, "section_heading"),
        "A:other": p(a, "other"),
        "A:conf": a.confidence.toFixed(2),
        "B:choice": b.choice,
        "B:skill": p(b, "skill"),
        "B:conf": b.confidence.toFixed(2),
        detail: d ? d.noul.toFixed(2) : "-",
        verdict: kindVerdict(kindA),
      })
    })
    function x(a: Ans, k: string) {
      return a.probabilities[k] ?? 0
    }
    console.table(rows)
    console.log(JSON.stringify({ lines: LINES.length, orderDisagreements: disagree, inputTokens, msHeadingFirst: ms["heading-first"], msSkillFirst: ms["skill-first"], wallMs: Date.now() - t0, model: "see response" }))
  }, 60_000)
})
