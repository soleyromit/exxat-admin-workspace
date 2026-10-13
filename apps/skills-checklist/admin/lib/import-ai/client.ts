// The only place the TypeSafe SDK client is constructed. Server-side only: the key is read from the environment and never
// reaches the browser (SDK default dangerouslyAllowBrowser = false). Tests inject `fetch` (documented client option) so the
// exact outgoing request is checked without a key or a network.
import { TypeSafeClient, type Fetch } from "@typesafe-ai/sdk"

/** Pinned model version for threshold stability; `jev-latest` is an alias of it today (docs.typesafe.ai/models). */
export const DEFAULT_IMPORT_MODEL = "jev-1.13.0"

export function makeClient(opts: { apiKey?: string; fetch?: Fetch; baseURL?: string; model?: string } = {}): TypeSafeClient {
  return new TypeSafeClient({
    apiKey: opts.apiKey ?? process.env.TYPESAFE_API_KEY,
    baseURL: opts.baseURL,
    defaultModel: opts.model ?? process.env.TYPESAFE_IMPORT_MODEL ?? DEFAULT_IMPORT_MODEL,
    // Per attempt; the SDK has no total retry budget, so the route adds its own (IMPORT_LIMITS.totalBudgetMs).
    timeout: 10_000,
    retry: { maxRetries: 2 },
    // Never "debug": request bodies (the list text) are not redacted. "off" keeps even warnings out of the logs.
    logLevel: "off",
    fetch: opts.fetch,
  })
}
