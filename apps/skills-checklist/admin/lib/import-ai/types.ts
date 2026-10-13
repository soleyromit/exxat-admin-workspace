import type { ImportCueReason, ImportInterpretationMeta, UnreadLine } from "@/lib/domain/types"

/** One proposed skill row from the interpretation. Only what the proposal needs: no probabilities (IM-13). */
export interface ImportRowProposal {
  name: string
  description: string
  categoryName: string | null
  /** The original line text (IM-08 traceability). */
  sourceRef: string
  line: number
  cue?: { reasons: ImportCueReason[] }
  origin: "rules" | "model"
}

export interface UnreadLineProposal {
  text: string
  reason: UnreadLine["reason"]
  location: string
}

export interface InterpretationResult {
  rows: ImportRowProposal[]
  unread: UnreadLineProposal[]
  meta: ImportInterpretationMeta
}

export type FallbackReason = NonNullable<ImportInterpretationMeta["fallbackReason"]>

/** Request body of POST /api/import/interpret. */
export interface InterpretRequestBody {
  text: string
  sourceName: string
  sourceKind: "paste" | "file"
  columns?: boolean
  skipHeader?: boolean
}

export type InterpretResponse = { result: InterpretationResult } | { result: null; fallback: FallbackReason }

/** What the model said about one candidate line. Kept server-side and in tests; never sent to the browser. */
export interface CandidateAnswer {
  kind: { section_heading: number; skill: number; other: number; confidence: number }
  /** Noul: the line only adds detail to the skill above. */
  detail?: number
  /** The heading the model picked (the heading text, mapped back by code) or null for "none". */
  category?: { heading: string | null; confidence: number }
}
