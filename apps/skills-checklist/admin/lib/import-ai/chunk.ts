import { IMPORT_LIMITS } from "./thresholds"

/** A line that may be asked about. `kind` = the Choice question only (an audit of a rule-made heading). */
export interface Candidate {
  n: number
  text: string
  before: string
  after: string
  askDetail: boolean
  auditOnly: boolean
}

export const estimateTokens = (s: string) => Math.ceil(s.length / 3.5)

// Rough per-question prompt sizes from the design (§2.4): a Choice with criteria objects is about 150 tokens, a Noul about 80.
const KIND_TOKENS = 150
const DETAIL_TOKENS = 80
const CATEGORY_TOKENS = 150

function costOf(c: Candidate, withCategory: boolean): number {
  const state = estimateTokens(c.text + c.before + c.after) + 12
  return state + KIND_TOKENS + (c.askDetail ? DETAIL_TOKENS : 0) + (withCategory && !c.auditOnly ? CATEGORY_TOKENS : 0)
}

/** Greedy chunks of at most 25 candidates and at most `chunkTokenCap` estimated tokens, in source order. */
export function chunkCandidates(
  candidates: Candidate[],
  opts: { withCategory?: boolean; maxCandidates?: number; tokenCap?: number } = {},
): Candidate[][] {
  const max = opts.maxCandidates ?? IMPORT_LIMITS.candidatesPerRequest
  const cap = opts.tokenCap ?? IMPORT_LIMITS.chunkTokenCap
  const out: Candidate[][] = []
  let cur: Candidate[] = []
  let tokens = 0
  for (const c of candidates) {
    const cost = costOf(c, opts.withCategory ?? false)
    if (cur.length > 0 && (cur.length >= max || tokens + cost > cap)) {
      out.push(cur)
      cur = []
      tokens = 0
    }
    cur.push(c)
    tokens += cost
  }
  if (cur.length > 0) out.push(cur)
  return out
}
