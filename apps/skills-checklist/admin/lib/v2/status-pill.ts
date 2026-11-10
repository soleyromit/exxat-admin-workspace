/**
 * The single tone, icon and word table for every state pill in v2 (V2-CONSISTENCY section 5).
 * Rules: a pill always has a word, an icon and a tone; there is no red (`danger` is not used); the words are the
 * strings the product already showed. Colour is never the only signal.
 */
export type PillTone = "success" | "info" | "warning" | "neutral"

export interface PillSpec {
  label: string
  tone: PillTone
  /** Font Awesome class suffix, for example `fa-circle-check`. */
  icon: string
}

const OK = { tone: "success", icon: "fa-circle-check" } as const
const PARTIAL = { tone: "info", icon: "fa-circle-half-stroke" } as const
const ACTION = { tone: "warning", icon: "fa-triangle-exclamation" } as const
const WAITING = { tone: "neutral", icon: "fa-clock" } as const
const NONE = { tone: "neutral", icon: "fa-minus" } as const

export const PILL_KINDS = {
  /** A skill in the library or a course: Not configured, Configured not in use, In use. */
  skill: {
    "not-configured": { label: "Not configured", ...NONE },
    configured: { label: "Configured, not in use", ...PARTIAL },
    "in-use": { label: "In use", ...OK },
  },
  /** A student's program record. */
  verify: {
    verified: { label: "Verified", ...OK },
    changed: { label: "Changed since verified", ...ACTION },
    "not-verified": { label: "Not verified", ...NONE },
  },
  /** The outcome of one evaluation. */
  outcome: {
    met: { label: "Met", ...OK },
    "not-met": { label: "Did not meet the criteria", ...ACTION },
    "not-yet": { label: "Not yet, feedback only", ...PARTIAL },
  },
  /** One attempt in a student's history. */
  attempt: {
    counted: { label: "Counted", ...OK },
    "did-not-meet": { label: "Did not meet", ...ACTION },
    "not-yet": { label: "Not yet", ...PARTIAL },
    waiting: { label: "Waiting for review", ...WAITING },
    returned: { label: "Returned", ...ACTION },
    reopened: { label: "Reopened", ...ACTION },
  },
  /** A skill on the student's own card. */
  "skill-progress": {
    achieved: { label: "Achieved", ...OK },
    "in-progress": { label: "In progress", ...PARTIAL },
    "not-started": { label: "Not started", ...NONE },
  },
  /** A remediation plan. */
  plan: {
    open: { label: "Open, not started", ...PARTIAL },
    "in-progress": { label: "In progress", ...PARTIAL },
    closed: { label: "Closed", ...NONE },
  },
  /** A heat-grid or report cell state, as a status in a table. The row usually overrides the label with its own text. */
  cell: {
    achieved: { label: "Achieved", ...OK },
    half: { label: "Half of the evaluations", ...PARTIAL },
    some: { label: "Some evaluations", ...PARTIAL },
    attempted: { label: "Attempted", ...ACTION },
    none: { label: "No evidence", ...NONE },
  },
  /** Student self-rating against the evaluator's. */
  agreement: {
    agreed: { label: "Agreed", ...OK },
    differed: { label: "Differed", ...ACTION },
    "not-comparable": { label: "Not comparable", ...NONE },
  },
  /** A row in the review queue. */
  queue: {
    ready: { label: "Ready to approve", ...OK },
    blocked: { label: "Blocked", ...ACTION },
    "needs-outcome": { label: "Needs the paper form outcome", ...ACTION },
  },
  /** An offline entry. A failed or conflicting sync is amber, not red. */
  sync: {
    queued: { label: "Queued", ...WAITING },
    synced: { label: "Synced", ...OK },
    failed: { label: "Failed", tone: "warning", icon: "fa-circle-exclamation" },
    conflict: { label: "Conflict", ...ACTION },
  },
  /** Whether a skill qualifies for a rule in the configure wizard. */
  eligibility: {
    qualifies: { label: "Qualifies", ...OK },
    "does-not-qualify": { label: "Does not qualify", ...NONE },
  },
  /** A skill the student can log: clinical attempts can be locked behind prerequisites while practice stays open. */
  practice: {
    "clinical-locked": { label: "Locked for clinical, practice is open", ...PARTIAL },
  },
} as const satisfies Record<string, Record<string, PillSpec>>

export type PillKind = keyof typeof PILL_KINDS
export type PillValue<K extends PillKind> = keyof (typeof PILL_KINDS)[K] & string

/** The word, tone and icon for a value of a kind. */
export function pillSpec<K extends PillKind>(kind: K, value: PillValue<K>): PillSpec {
  return (PILL_KINDS[kind] as Record<string, PillSpec>)[value]
}

/** Library skill status from the two flags the store keeps. */
export const skillPillValue = (k: { published: boolean; configured: boolean }): PillValue<"skill"> => (k.published ? "in-use" : k.configured ? "configured" : "not-configured")
