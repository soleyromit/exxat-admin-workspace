// Server orchestration of the AI assist (docs/build/typesafe-import-design.md §2 and §4.4). Rules run first; the model is asked
// only about the lines the rules leave ambiguous; code assembles the proposal. Nothing is created here (IM-05, IM-13). Any failure
// returns a fallback code and the caller runs the standard reader. Logs are counts only: never the list text, the answers or the key.
import { APITimeoutError, APIUserAbortError, AuthenticationError, RateLimitError } from "@typesafe-ai/sdk"
import { assembleInterpretation } from "./assemble"
import { chunkCandidates, type Candidate } from "./chunk"
import { buildChunkRequest, type ChunkRequest } from "./questions"
import { classifyByRules, type RuleItem } from "./rules"
import { IMPORT_LIMITS } from "./thresholds"
import type { CandidateAnswer, FallbackReason, InterpretRequestBody, InterpretResponse } from "./types"

/** The one method of the SDK client this module needs, so tests can pass a tiny fake or a client built on a mocked fetch. */
export interface SystemOneLike {
  systemOne(
    request: { state: unknown; questions: Record<string, unknown>; model?: string },
    options?: { signal?: AbortSignal },
  ): Promise<{ model: string; answers: Record<string, unknown>; usage: { input_tokens: number; output_tokens: number } }>
}

export interface InterpretDeps {
  client: SystemOneLike
  model?: string
  budgetMs?: number
  parallel?: number
  /** Ask the category question (default: PDF and DOCX sources only). */
  categoryByModel?: boolean
}

export class InterpretFailure extends Error {
  constructor(public reason: FallbackReason) {
    super(reason)
  }
}

function toFailure(e: unknown, aborted: boolean): InterpretFailure {
  if (e instanceof InterpretFailure) return e
  if (aborted || e instanceof APITimeoutError || e instanceof APIUserAbortError) return new InterpretFailure("timeout")
  if (e instanceof RateLimitError) return new InterpretFailure("rate_limited")
  if (e instanceof AuthenticationError) return new InterpretFailure("unavailable")
  return new InterpretFailure("error")
}

/** Candidates the model is asked about, with their neighbours. Rule-made ALL-CAPS headings get the kind question only (an audit). */
export function buildCandidates(items: RuleItem[]): Candidate[] {
  const out: Candidate[] = []
  items.forEach((it, i) => {
    const prev = items[i - 1]
    const next = items[i + 1]
    const before = prev ? prev.raw.trim() : ""
    const after = next ? next.raw.trim() : ""
    if (it.kind === "ambiguous") {
      out.push({ n: it.n, text: it.raw.trim(), before, after, askDetail: !!prev && (prev.kind === "skill" || prev.kind === "ambiguous"), auditOnly: false })
    } else if (it.kind === "category" && it.by === "allcaps") {
      out.push({ n: it.n, text: it.raw.trim(), before, after, askDetail: false, auditOnly: true })
    }
  })
  return out
}

function readProb(p: Record<string, number> | undefined, key: string): number {
  const v = p?.[key]
  return typeof v === "number" && Number.isFinite(v) ? v : 0
}

interface ChoiceAns {
  type?: string
  choice?: string
  confidence?: number
  probabilities?: Record<string, number>
  noul?: number
}

function readChunk(chunk: Candidate[], req: ChunkRequest, answers: Record<string, unknown>, into: Map<number, CandidateAnswer>) {
  chunk.forEach((c, i) => {
    const k = answers[`k${i}`] as ChoiceAns | undefined
    if (!k || typeof k.confidence !== "number") throw new InterpretFailure("error")
    const ans: CandidateAnswer = {
      kind: {
        section_heading: readProb(k.probabilities, "section_heading"),
        skill: readProb(k.probabilities, "skill"),
        other: readProb(k.probabilities, "other"),
        confidence: k.confidence,
      },
    }
    const d = answers[`d${i}`] as ChoiceAns | undefined
    if (d && typeof d.noul === "number") ans.detail = d.noul
    const cat = answers[`c${i}`] as ChoiceAns | undefined
    if (cat && typeof cat.confidence === "number" && typeof cat.choice === "string") {
      ans.category = { heading: cat.choice === "none" ? null : (req.headingMap.get(cat.choice) ?? null), confidence: cat.confidence }
    }
    into.set(c.n, ans)
  })
}

async function pool<T>(tasks: Array<() => Promise<T>>, width: number, signal: AbortSignal): Promise<T[]> {
  const results: T[] = new Array(tasks.length)
  let next = 0
  const worker = async () => {
    while (next < tasks.length) {
      if (signal.aborted) throw new InterpretFailure("timeout")
      const i = next++
      results[i] = await tasks[i]()
    }
  }
  await Promise.all(Array.from({ length: Math.min(width, tasks.length) }, worker))
  return results
}

export async function interpretWithModel(input: InterpretRequestBody, deps: InterpretDeps): Promise<InterpretResponse> {
  const items = classifyByRules({ text: input.text, sourceName: input.sourceName, columns: input.columns, skipHeader: input.skipHeader })
  const candidates = buildCandidates(items)
  const asked = candidates.filter((c) => !c.auditOnly)
  // Nothing ambiguous (for example a structured CSV): the rules settled everything, so no model call is made.
  if (asked.length === 0) return { result: assembleInterpretation(items, new Map(), { mode: "rules" }) }

  const headings = items.flatMap((it) => (it.kind === "category" ? [it.categoryName] : []))
  const categoryByModel = deps.categoryByModel ?? (input.sourceKind === "file" && /\.(pdf|docx)$/i.test(input.sourceName))
  const ctx = { sourceLabel: input.sourceKind === "paste" ? "pasted list" : "uploaded file", headings, categoryByModel }
  const chunks = chunkCandidates(candidates, { withCategory: categoryByModel })

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), deps.budgetMs ?? IMPORT_LIMITS.totalBudgetMs)
  const answers = new Map<number, CandidateAnswer>()
  let inputTokens = 0
  let model = deps.model ?? ""
  try {
    await pool(
      chunks.map((chunk) => async () => {
        const req = buildChunkRequest(chunk, ctx)
        const res = await deps.client.systemOne({ state: req.state, questions: req.questions, ...(deps.model ? { model: deps.model } : {}) }, { signal: controller.signal })
        inputTokens += res.usage?.input_tokens ?? 0
        model = res.model || model
        readChunk(chunk, req, res.answers, answers)
      }),
      deps.parallel ?? IMPORT_LIMITS.parallelRequests,
      controller.signal,
    )
  } catch (e) {
    return { result: null, fallback: toFailure(e, controller.signal.aborted).reason }
  } finally {
    clearTimeout(timer)
  }
  return {
    result: assembleInterpretation(items, answers, { mode: "ai", model, candidatesAsked: asked.length, requests: chunks.length, inputTokens }),
  }
}
