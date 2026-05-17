// Registry types
export type EntryType = 'direct' | 'excel-manifest' | 'search'

export interface RegistryEntry {
  id: string
  product: string
  label: string
  type: EntryType
  uri?: string       // direct + excel-manifest types
  query?: string     // search type
  author?: string    // search type (partial email match)
  snapshot: string   // path relative to repo root
  flags: string      // path relative to repo root
  lastSynced: string | null
  active: boolean    // false = removed, kept for audit trail
  sourceUrl?: string // original SharePoint URL when registered via the UI (for dedup)
}

export interface Registry {
  entries: RegistryEntry[]
}

// Updates log types
export type UpdateType =
  | 'prd-change'
  | 'prd-flagged'
  | 'compliance-violation'
  | 'compliance-resolved'
  | 'new-doc'
  | 'pattern-update'
  | 'claude-correction'

export type Severity = 'P1' | 'P2' | 'P3' | null

export interface UpdateEntry {
  id: string          // YYYY-MM-DD-{product}-{seq} e.g. "2026-05-19-pce-001"
  date: string        // YYYY-MM-DD
  product: string
  type: UpdateType
  title: string
  what: string        // what changed
  why: string         // why it changed (PRD section, regulation, Romit's correction)
  source: string      // "PCE PRD — Monil Pokar" | "Weekly compliance sweep" | "Romit"
  severity: Severity  // only for compliance-violation type
  files: string[]     // repo-relative file paths affected
}

export interface UpdatesLog {
  entries: UpdateEntry[]
}

// Violation inventory types
export type ViolationStatus = 'open' | 'fixed'
export type FixLevel = 'ui' | 'architecture'

export interface ViolationEntry {
  id: string          // "{product}-{rule-slug}-{file-slug}"
  product: string
  file: string        // repo-relative path
  line: number
  rule: string        // e.g. "WCAG 4.1.2", "FERPA §99.31"
  severity: 'P1' | 'P2' | 'P3'
  consequence: string // plain language consequence
  fixLevel: FixLevel
  firstSeen: string   // ISO date
  lastSeen: string    // ISO date (updated each sweep)
  status: ViolationStatus
}

export interface ViolationInventory {
  violations: ViolationEntry[]
}

// GitHub storage response types
export interface GitHubFileResponse {
  content: string   // base64 encoded
  sha: string
  name: string
  path: string
}

export interface StorageFile<T> {
  data: T
  sha: string
}
