// POST /api/import/interpret: the optional AI reading of a pasted or extracted list (IM-04, IM-07, IM-08). The key stays here, on the
// server. Any problem returns { result: null, fallback } with HTTP 200 (or a 4xx for a bad request) and the dialog runs the standard
// reader instead. Logs are counts and durations only: never the list text, the answers or the key.
import { aiAvailable } from "@/lib/import-ai/env"
import { makeClient } from "@/lib/import-ai/client"
import { clientKey, dailyCap, interpretLimiter, isSameOrigin, parseInterpretBody } from "@/lib/import-ai/guards"
import { interpretWithModel, type SystemOneLike } from "@/lib/import-ai/interpret"
import { makeMockFetch } from "@/lib/import-ai/mock-fetch"
import type { InterpretResponse } from "@/lib/import-ai/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const NO_STORE = { "Cache-Control": "no-store" }
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: NO_STORE })

/** Test-only: TYPESAFE_MOCK=1 swaps the network for SYNTHETIC answers so the UI can be exercised without a key. */
function client(): SystemOneLike {
  return (process.env.TYPESAFE_MOCK === "1" ? makeClient({ apiKey: "mock", fetch: makeMockFetch() }) : makeClient()) as unknown as SystemOneLike
}

export async function POST(req: Request) {
  if (!isSameOrigin(req.headers)) return json({ error: "forbidden" }, 403)
  if (!interpretLimiter.allow(clientKey(req.headers))) return json({ result: null, fallback: "rate_limited" } satisfies InterpretResponse, 429)
  let raw: unknown
  try {
    raw = JSON.parse(await req.text())
  } catch {
    return json({ error: "invalid_json" }, 422)
  }
  const parsed = parseInterpretBody(raw)
  if (!parsed.ok) return json({ error: parsed.code }, 422)
  if (!aiAvailable() || !dailyCap.take()) return json({ result: null, fallback: "unavailable" } satisfies InterpretResponse)

  const started = Date.now()
  let out: InterpretResponse
  try {
    out = await interpretWithModel(parsed.body, { client: client() })
  } catch {
    out = { result: null, fallback: "error" }
  }
  console.info("[import-ai]", {
    ok: out.result !== null,
    fallback: out.result ? undefined : out.fallback,
    requests: out.result?.meta.requests,
    candidates: out.result?.meta.candidatesAsked,
    inputTokens: out.result?.meta.inputTokens,
    ms: Date.now() - started,
  })
  return json(out)
}
