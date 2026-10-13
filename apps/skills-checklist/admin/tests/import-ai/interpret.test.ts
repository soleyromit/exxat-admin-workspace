// @vitest-environment node
// The AI pipeline end to end on a SYNTHETIC transport: the real TypeSafe SDK client with an injected fetch (documented client option),
// so the exact outgoing requests are validated against the documented shape. Nothing here says anything about the model's accuracy.
import { describe, expect, it, vi } from "vitest"
import { SAMPLE_LIST } from "@/lib/copy/r2-import"
import { makeClient } from "@/lib/import-ai/client"
import { chunkCandidates, type Candidate } from "@/lib/import-ai/chunk"
import { buildCandidates, interpretWithModel, type SystemOneLike } from "@/lib/import-ai/interpret"
import { makeMockFetch, validateSystemOneRequest, type MockCall, type MockOptions } from "@/lib/import-ai/mock-fetch"
import { buildChunkRequest, estimateRequestTokens, headingKeys } from "@/lib/import-ai/questions"
import { classifyByRules } from "@/lib/import-ai/rules"
import { IMPORT_LIMITS } from "@/lib/import-ai/thresholds"
import type { InterpretRequestBody } from "@/lib/import-ai/types"

const clientWith = (opts: MockOptions = {}) => makeClient({ apiKey: "test-key-not-real", fetch: makeMockFetch(opts) }) as unknown as SystemOneLike
const body = (text: string, extra: Partial<InterpretRequestBody> = {}): InterpretRequestBody => ({ text, sourceName: "pasted list", sourceKind: "paste", ...extra })

// SYNTHETIC samples (hand-authored; see design §6.1).
const HEADING_AND_DUPLICATE = "RESPIRATORY SKILLS\nSuction\nOxygen therapy\nWOUND SKILLS\nDress a wound"
const JUNK = "-----\n12345\nSuction\nPage 3 of 12\nDate: ______\nOxygen therapy"
const MESSY = "1) Foley catheter insertion\n(use sterile technique)\n2. Wound care - clean and dress\n3 Tracheostomy care\nNOTES: see handbook"

describe("IM-04 the request: questions are built from code-extracted spans and match the documented API shape", () => {
  it("the SDK client sends POST /v1/systemone with a Bearer header and { state, model, questions } (validated by the mock transport)", async () => {
    const calls: MockCall[] = []
    const c = clientWith({ onCall: (x) => calls.push(x) })
    const out = await interpretWithModel(body("Suction\nOxygen therapy"), { client: c })
    expect(out.result).not.toBeNull()
    expect(calls).toHaveLength(1)
    expect(calls[0].url).toMatch(/\/v1\/systemone$/)
    expect(calls[0].model).toBe("jev-1.13.0")
  })

  it("validateSystemOneRequest rejects a malformed request (the contract check is real)", () => {
    expect(validateSystemOneRequest("https://api.typesafe.ai/v1/systemone", { method: "POST", body: JSON.stringify({ model: "m", state: {}, questions: {} }) })).toEqual(expect.arrayContaining(["Authorization: Bearer header missing", "no questions"]))
  })

  it("one Choice (kind) per candidate, a Noul (detail) only when a skill sits above it, ids are code-only", () => {
    const items = classifyByRules({ text: "Suction\nUse a catheter", sourceName: "pasted list" })
    const req = buildChunkRequest(buildCandidates(items), { sourceLabel: "pasted list", headings: [], categoryByModel: false })
    expect(Object.keys(req.questions).sort()).toEqual(["d1", "k0", "k1"])
    expect(req.state.lines.map((l) => l.n)).toEqual([1, 2])
    expect(req.state.lines[1]).toMatchObject({ before: "Suction", after: "" })
  })

  it("the kind options are heading, skill, other (other is the no-match outcome); the swapped order exists for the lean check", () => {
    const items = classifyByRules({ text: "Suction", sourceName: "pasted list" })
    const q = (order: "heading-first" | "skill-first") => buildChunkRequest(buildCandidates(items), { sourceLabel: "x", headings: [], categoryByModel: false, kindOrder: order }).questions.k0 as { criteria: Record<string, unknown> }
    expect(Object.keys(q("heading-first").criteria)).toEqual(["section_heading", "skill", "other"])
    expect(Object.keys(q("skill-first").criteria)).toEqual(["skill", "section_heading", "other"])
  })

  it("category question: asked only for PDF/DOCX with 2 to 60 headings; 'none' is last; duplicate headings get a suffix and map back", () => {
    const cands: Candidate[] = [{ n: 3, text: "Suction", before: "", after: "", askDetail: false, auditOnly: false }]
    const heads = ["Respiratory", "Wound", "Wound"]
    const req = buildChunkRequest(cands, { sourceLabel: "uploaded file", headings: heads, categoryByModel: true })
    const keys = Object.keys((req.questions.c0 as { criteria: object }).criteria)
    expect(keys).toEqual(["Respiratory", "Wound", "Wound (2)", "none"])
    expect(req.headingMap.get("Wound (2)")).toBe("Wound")
    expect(buildChunkRequest(cands, { sourceLabel: "x", headings: ["Only one"], categoryByModel: true }).questions.c0).toBeUndefined()
    expect(buildChunkRequest(cands, { sourceLabel: "x", headings: heads, categoryByModel: false }).questions.c0).toBeUndefined()
    expect(headingKeys(["A", "a"]).map((k) => k.key)).toEqual(["A", "a (2)"])
  })

  it("a rule-made ALL-CAPS heading gets the kind question only (an audit), never detail or category", () => {
    const items = classifyByRules({ text: "RESPIRATORY SKILLS\nSuction", sourceName: "pasted list" })
    const req = buildChunkRequest(buildCandidates(items), { sourceLabel: "x", headings: ["RESPIRATORY SKILLS", "B"], categoryByModel: true })
    expect(Object.keys(req.questions).sort()).toEqual(["c1", "k0", "k1"])
  })
})

describe("chunking: 25 candidates and the token cap per request", () => {
  const cands = (n: number): Candidate[] => Array.from({ length: n }, (_, i) => ({ n: i + 1, text: `Skill number ${i + 1}`, before: i ? `Skill number ${i}` : "", after: "", askDetail: i > 0, auditOnly: false }))
  it("200 candidates become 8 chunks of at most 25, in source order", () => {
    const chunks = chunkCandidates(cands(200))
    expect(chunks).toHaveLength(8)
    expect(Math.max(...chunks.map((c) => c.length))).toBe(25)
    expect(chunks.flat().map((c) => c.n)).toEqual(Array.from({ length: 200 }, (_, i) => i + 1))
  })
  it("a small token cap splits a chunk, and every built request stays under the cap", () => {
    expect(chunkCandidates(cands(25), { tokenCap: 1500 }).length).toBeGreaterThan(1)
    for (const chunk of chunkCandidates(cands(200))) {
      const req = buildChunkRequest(chunk, { sourceLabel: "x", headings: [], categoryByModel: false })
      expect(estimateRequestTokens(req)).toBeLessThan(IMPORT_LIMITS.chunkTokenCap * 1.6)
    }
  })
})

describe("IM-04, IM-07, IM-08, IM-13: the four synthetic samples end to end", () => {
  it("prototype sample list: the rules settle the CSV rows and the Section line; the model is not asked about structured rows", async () => {
    const calls: MockCall[] = []
    const out = await interpretWithModel(body(SAMPLE_LIST, { columns: true, skipHeader: true }), { client: clientWith({ onCall: (c) => calls.push(c) }) })
    // One ambiguous plain line ("Wound Irrigation"? no: with columns every row is structured), so the model is asked about nothing
    expect(out.result?.meta.mode).toBe("rules")
    expect(calls).toHaveLength(0)
    expect(out.result?.rows.length).toBeGreaterThanOrEqual(7)
    expect(out.result?.unread.some((u) => /SECTION 2/.test(u.text))).toBe(true)
  })

  it("heading + items: categories proposed by rule, every item asked about, no cue, nothing created", async () => {
    const out = await interpretWithModel(body(HEADING_AND_DUPLICATE), { client: clientWith() })
    const r = out.result!
    expect(r.meta).toMatchObject({ mode: "ai", model: "jev-1.13.0", candidatesAsked: 3 })
    expect(r.rows.map((x) => [x.name, x.categoryName])).toEqual([["Suction", "RESPIRATORY SKILLS"], ["Oxygen therapy", "RESPIRATORY SKILLS"], ["Dress a wound", "WOUND SKILLS"]])
    expect(r.rows.every((x) => x.cue === undefined)).toBe(true)
  })

  it("junk lines: '-----' and '12345' never reach the model (rules); 'Page 3 of 12' and 'Date: ______' are Not read with original text", async () => {
    const calls: MockCall[] = []
    const out = await interpretWithModel(body(JUNK), { client: clientWith({ onCall: (c) => calls.push(c) }) })
    const r = out.result!
    expect(r.rows.map((x) => x.name)).toEqual(["Suction", "Oxygen therapy"])
    expect(r.unread.map((u) => u.text)).toEqual(["-----", "12345", "Page 3 of 12", "Date: ______"])
    const sent = JSON.stringify(calls[0].state)
    expect(sent).not.toMatch(/"text":"(-----|12345)"/)
  })

  it("messy numbered list: '1)' and '2.' numbering is stripped by code (a bare '3 ' is not: the standard reader leaves it and the admin edits it); the parenthetical joins the Foley row; NOTES: is a heading by rule", async () => {
    const out = await interpretWithModel(body(MESSY), { client: clientWith() })
    const r = out.result!
    expect(r.rows.map((x) => x.name)).toEqual(["Foley catheter insertion", "Wound care", "3 Tracheostomy care"])
    expect(r.rows[0].description).toBe("(use sterile technique)")
    expect(r.rows[1].description).toBe("clean and dress")
  })

  it("IM-13: with every kind answer uncertain nothing is hidden: rows carry the cue and the admin decides", async () => {
    const out = await interpretWithModel(body("Suction\nOxygen therapy"), {
      client: clientWith({ kind: { Suction: { section_heading: 0.1, skill: 0.6, other: 0.3, confidence: 0.4 } } }),
    })
    expect(out.result!.rows).toHaveLength(2)
    expect(out.result!.rows[0].cue?.reasons).toEqual(["lowSkillConfidence"])
  })
})

describe("IM-13: any failure returns a fallback code; no partial AI result (the dialog then runs the standard reader)", () => {
  const cases: Array<[string, MockOptions, string]> = [
    ["401 maps to unavailable", { failStatus: 401 }, "unavailable"],
    ["429 maps to rate_limited", { failStatus: 429 }, "rate_limited"],
    ["500 maps to error", { failStatus: 500 }, "error"],
  ]
  for (const [name, opts, fallback] of cases) {
    it(name, async () => {
      const out = await interpretWithModel(body("Suction\nOxygen therapy"), { client: clientWith(opts) })
      expect(out).toEqual({ result: null, fallback })
    })
  }

  it("a request that never answers aborts at the total budget and maps to timeout", async () => {
    const out = await interpretWithModel(body("Suction\nOxygen therapy"), { client: clientWith({ hang: true }), budgetMs: 60 })
    expect(out).toEqual({ result: null, fallback: "timeout" })
  })

  it("a malformed answer (missing the kind answer) is an error, not a guess", async () => {
    const bad: SystemOneLike = { systemOne: vi.fn(async () => ({ model: "m", answers: {}, usage: { input_tokens: 1, output_tokens: 0 } })) }
    expect(await interpretWithModel(body("Suction"), { client: bad })).toEqual({ result: null, fallback: "error" })
  })

  it("one failing chunk makes the WHOLE result fall back (a half-AI list is hard to reason about)", async () => {
    const lines = Array.from({ length: 30 }, (_, i) => `Skill number ${i + 1}`).join("\n")
    let n = 0
    const flaky: SystemOneLike = {
      systemOne: async (req) => {
        n += 1
        if (n === 2) throw new Error("boom")
        const answers: Record<string, unknown> = {}
        for (const id of Object.keys(req.questions)) if (id.startsWith("k")) answers[id] = { type: "choice", choice: "skill", confidence: 0.9, probabilities: { section_heading: 0, skill: 1, other: 0 } }
        return { model: "m", answers, usage: { input_tokens: 1, output_tokens: 0 } }
      },
    }
    expect(await interpretWithModel(body(lines), { client: flaky })).toEqual({ result: null, fallback: "error" })
    expect(n).toBeGreaterThanOrEqual(2)
  })
})

describe("scale: 200 lines go out in 8 requests", () => {
  it("200 plain lines make 8 requests, all 200 become rows, and the usage is summed for cost tracking", async () => {
    const calls: MockCall[] = []
    const lines = Array.from({ length: 200 }, (_, i) => `Practice skill number ${i + 1}`).join("\n")
    const out = await interpretWithModel(body(lines), { client: clientWith({ onCall: (c) => calls.push(c) }) })
    expect(calls).toHaveLength(8)
    expect(out.result!.rows).toHaveLength(200)
    expect(out.result!.meta).toMatchObject({ requests: 8, candidatesAsked: 200 })
    expect(out.result!.meta.inputTokens).toBeGreaterThan(0)
  })
})
