// ONE constant for every threshold in the AI import assist. These numbers are EXAMPLES to evaluate, not accuracy claims
// (TypeSafe docs: "Start with conservative thresholds, test with your own data, and adjust" - concepts/confidence).
// Tuning evidence (measured on a handful of lines only, not general accuracy) is recorded in
// docs/build/typesafe-import-design.md §10 and produced by scripts/typesafe-smoke.mjs.

export const IMPORT_THRESHOLDS = {
  /** P(skill) at or above this, with confidence at or above `confidence`, is accepted with no cue. */
  skillAccept: 0.8,
  /** P(skill) from here up to `skillAccept` (or low confidence) is accepted WITH the "Check this row" cue. Below it the line is not a skill. */
  skillReview: 0.5,
  /** P(section_heading) at or above this, with enough confidence, becomes a proposed category. */
  headingAccept: 0.8,
  /** P(section_heading) from here up to `headingAccept` goes to Not read as "Looks like a section heading". */
  headingReview: 0.5,
  /** Minimum Choice confidence (distribution concentration, not correctness of the workflow). */
  confidence: 0.6,
  /** Noul "only adds detail to the skill above": at or above this the line is joined to that skill's description. */
  detailMerge: 0.7,
  /** Noul between this and `detailMerge` keeps the row and adds the "maybeDetail" cue. */
  detailCue: 0.4,
  /** The model's category pick is used only at or above this confidence. */
  categoryConfidence: 0.6,
} as const

/** Request shaping (docs/build/typesafe-import-design.md §2.4). */
export const IMPORT_LIMITS = {
  candidatesPerRequest: 25,
  /** Estimated input tokens (chars / 3.5) above which a chunk is split. The documented limits are 32k for state + longest question, 64k per request. */
  chunkTokenCap: 16_000,
  parallelRequests: 4,
  /** Whole-route budget; any chunk still running aborts and the result falls back. */
  totalBudgetMs: 25_000,
  maxTextChars: 200_000,
  maxLines: 1_500,
  /** A line is truncated to this many characters before it reaches the model; the original stays in sourceRef. */
  maxLineChars: 400,
  neighbourChars: 120,
  maxHeadingsForCategoryQuestion: 60,
  minHeadingsForCategoryQuestion: 2,
} as const
