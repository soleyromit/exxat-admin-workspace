// SYNTHETIC transport for tests and the test-only TYPESAFE_MOCK=1 mode. Answers come from simple text heuristics, not from a
// model: they exercise OUR thresholds and assembly, and say nothing about TypeSafe's accuracy. It also validates the outgoing
// request against the documented shape (POST /v1/systemone, Bearer header, { state, model, questions }).
import type { Fetch } from "@typesafe-ai/sdk"

export interface MockCall {
  url: string
  model: string
  questionCount: number
  state: unknown
}

type Q = { type?: string; instructions?: unknown; criteria?: Record<string, unknown> | null }

export function validateSystemOneRequest(url: string, init: RequestInit | undefined): string[] {
  const errs: string[] = []
  if (!/\/v1\/systemone$/.test(new URL(url).pathname)) errs.push("path must end /v1/systemone")
  if ((init?.method ?? "GET").toUpperCase() !== "POST") errs.push("method must be POST")
  const h = new Headers(init?.headers)
  if (!/^Bearer\s+\S+/.test(h.get("authorization") ?? "")) errs.push("Authorization: Bearer header missing")
  let body: { state?: unknown; model?: unknown; questions?: Record<string, Q> } = {}
  try {
    body = JSON.parse(String(init?.body ?? "{}"))
  } catch {
    errs.push("body is not JSON")
  }
  if (typeof body.model !== "string" || !body.model) errs.push("model missing")
  if (body.state === undefined) errs.push("state missing")
  const qs = body.questions ?? {}
  if (Object.keys(qs).length === 0) errs.push("no questions")
  for (const [id, q] of Object.entries(qs)) {
    if (q.type !== "noul" && q.type !== "choice" && q.type !== "score") errs.push(`${id}: unknown type`)
    if (q.type === "choice") {
      const n = Object.keys(q.criteria ?? {}).length
      if (n < 2) errs.push(`${id}: a choice needs at least two options`)
      if (n > 255) errs.push(`${id}: a choice allows at most 255 options`)
    }
  }
  return errs
}

const OTHER = /^(page\s+\d|date\s*:|students must|notes?\s*:|signature|total\b)/i
const DETAIL = /^(\(|use |using |ensure |note |must |should )/i

function kindFor(text: string): { section_heading: number; skill: number; other: number; confidence: number } {
  const t = text.trim()
  if (!/\p{L}/u.test(t) || OTHER.test(t)) return { section_heading: 0.03, skill: 0.05, other: 0.92, confidence: 0.9 }
  if (/^section\b/i.test(t) || (!/[a-z]/.test(t) && /[A-Z]{3}/.test(t)) || t.endsWith(":")) return { section_heading: 0.92, skill: 0.05, other: 0.03, confidence: 0.9 }
  if (/\?$/.test(t)) return { section_heading: 0.2, skill: 0.4, other: 0.4, confidence: 0.3 }
  return { section_heading: 0.03, skill: 0.92, other: 0.05, confidence: 0.88 }
}

export interface MockOptions {
  /** Override the kind answer for a line (exact text) to test thresholds. */
  kind?: Record<string, { section_heading: number; skill: number; other: number; confidence: number }>
  detail?: Record<string, number>
  /** Fail the next calls with this HTTP status. */
  failStatus?: number
  /** Never resolve (timeout tests). */
  hang?: boolean
  onCall?: (c: MockCall) => void
}

export function makeMockFetch(opts: MockOptions = {}): Fetch {
  return async (input, init) => {
    const url = String(input)
    if (opts.hang) {
      // Like a real fetch, a hung request rejects when its signal aborts.
      await new Promise<never>((_, reject) => {
        const sig = init?.signal
        if (sig?.aborted) reject(new DOMException("Aborted", "AbortError"))
        sig?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true })
      })
    }
    const errs = validateSystemOneRequest(url, init)
    if (errs.length) return new Response(JSON.stringify({ error: errs.join("; ") }), { status: 422, headers: { "content-type": "application/json" } })
    // retry-after: 0 keeps the SDK's documented retry on 429 and 5xx instant in tests.
    if (opts.failStatus) return new Response(JSON.stringify({ error: "mock failure" }), { status: opts.failStatus, headers: { "content-type": "application/json", "retry-after": "0" } })
    const body = JSON.parse(String(init?.body)) as { model: string; state: { lines?: Array<{ text: string }> }; questions: Record<string, Q> }
    opts.onCall?.({ url, model: body.model, questionCount: Object.keys(body.questions).length, state: body.state })
    const lines = body.state.lines ?? []
    const answers: Record<string, unknown> = {}
    for (const [id, q] of Object.entries(body.questions)) {
      const idx = Number(id.slice(1))
      const text = lines[idx]?.text ?? ""
      if (id.startsWith("k")) {
        const k = opts.kind?.[text] ?? kindFor(text)
        const probs = { section_heading: k.section_heading, skill: k.skill, other: k.other }
        const choice = (Object.entries(probs).sort((a, b) => b[1] - a[1])[0][0]) as string
        // Respect the option set the request actually carried.
        const keys = Object.keys(q.criteria ?? {})
        const mapped = Object.fromEntries(keys.map((key) => [key, (probs as Record<string, number>)[key] ?? 0]))
        answers[id] = { type: "choice", choice, probabilities: mapped, confidence: k.confidence }
      } else if (id.startsWith("d")) {
        const v = opts.detail?.[text] ?? (DETAIL.test(text.trim()) ? 0.85 : 0.1)
        answers[id] = { type: "noul", noul: v }
      } else if (id.startsWith("c")) {
        const keys = Object.keys(q.criteria ?? {}).filter((k) => k !== "none")
        const pick = keys[0] ?? "none"
        const probabilities = Object.fromEntries(Object.keys(q.criteria ?? {}).map((k) => [k, k === pick ? 0.9 : 0.1 / Math.max(1, Object.keys(q.criteria ?? {}).length - 1)]))
        answers[id] = { type: "choice", choice: pick, probabilities, confidence: 0.85 }
      }
    }
    return new Response(JSON.stringify({ model: body.model, answers, usage: { input_tokens: 100 * Object.keys(body.questions).length, output_tokens: 0 } }), {
      status: 200,
      headers: { "content-type": "application/json" },
    })
  }
}
