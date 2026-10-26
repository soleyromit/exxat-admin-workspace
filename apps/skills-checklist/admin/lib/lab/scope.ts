import { ALL, NO_FILTERS, type ReportFilters } from "@/lib/v2/reports"
import type { Setting } from "@/lib/v2/types"

/**
 * The dashboard scope (strategy/06 section 3.1): who and what a page is about, plus the comparison basis. Lives in the URL so
 * every number can link to a list with the same scope, and a pasted link restores the same view.
 *
 * Primary fields: term, cohort, group, course. "More filters": category (`cat`), tag, location (`loc`), setting. Basis
 * (`basis`) is what "behind" is measured against. Optional fields are omitted from the object when empty, so a scope written
 * by an older page still compares equal.
 */
export type Basis = "expected" | "median" | "all"
export const BASES: Basis[] = ["expected", "median", "all"]
export const DEFAULT_BASIS: Basis = "expected"

export interface LabScope {
  cohort: string
  group: string
  /** Empty means the current term. */
  term: string
  course: string
  cat?: string
  tag?: string
  /** A program location name. Recounts evidence (RP-08). */
  loc?: string
  setting?: string
  /** Absent means the default basis (Expected now). */
  basis?: Basis
  /** Absent means clinical courses only (the default, CALL 10-26); "didactic" includes didactic courses in the course list and population. */
  incl?: "didactic"
}

export const EMPTY_SCOPE: LabScope = { cohort: "", group: "", term: "", course: "" }
/** Primary scope fields, shown as selects in the scope bar. */
export const SCOPE_KEYS = ["cohort", "group", "term", "course"] as const
/** Fields under "More filters". */
export const MORE_KEYS = ["cat", "tag", "loc", "setting"] as const
export type PrimaryKey = (typeof SCOPE_KEYS)[number]
export type MoreKey = (typeof MORE_KEYS)[number]
export type ScopeKey = PrimaryKey | MoreKey
export const FILTER_KEYS: ScopeKey[] = [...SCOPE_KEYS, ...MORE_KEYS]
/** Every URL key the scope owns, in a fixed order. */
export const URL_KEYS = [...FILTER_KEYS, "basis", "incl"] as const

export const SCOPE_LABEL: Record<ScopeKey, string> = { cohort: "Cohort", group: "Group", term: "Term", course: "Course", cat: "Category", tag: "Tag", loc: "Location", setting: "Setting" }

type Params = { get(name: string): string | null }

export function parseScope(p: Params | null | undefined): LabScope {
  const g = (k: string) => p?.get(k) ?? ""
  // Group is its own filter (REQ line 303; CALL 10-26): it no longer needs a cohort. With both, they intersect.
  const out: LabScope = { cohort: g("cohort"), group: g("group"), term: g("term"), course: g("course") }
  for (const k of MORE_KEYS) {
    const v = g(k)
    if (v) out[k] = v
  }
  const basis = g("basis") as Basis
  if (BASES.includes(basis) && basis !== DEFAULT_BASIS) out.basis = basis
  if (g("incl") === "didactic") out.incl = "didactic"
  return out
}

/** True when the URL carries any scope key (used to decide whether to restore the remembered scope). */
export const hasScopeInUrl = (p: Params | null | undefined): boolean => URL_KEYS.some((k) => !!p?.get(k))

/** Query string for a scope (no leading "?"), keys in a fixed order, empty values omitted. Extra params are appended as given. */
export function scopeQuery(scope: LabScope, extra: Record<string, string | undefined> = {}): string {
  const q = new URLSearchParams()
  for (const k of FILTER_KEYS) {
    const v = scope[k]
    if (v) q.set(k, v)
  }
  if (scope.basis && scope.basis !== DEFAULT_BASIS) q.set("basis", scope.basis)
  if (scope.incl === "didactic") q.set("incl", "didactic")
  for (const [k, v] of Object.entries(extra)) if (v) q.set(k, v)
  return q.toString()
}

export const withScope = (path: string, scope: LabScope, extra: Record<string, string | undefined> = {}): string => {
  const q = scopeQuery(scope, extra)
  return q ? `${path}?${q}` : path
}

/** Set one field; an empty value removes the field. Cohort and group are independent (a group may span cohorts). */
export function setScope(scope: LabScope, key: ScopeKey, value: string): LabScope {
  if (!value) return removeScope(scope, key)
  return { ...scope, [key]: value }
}

export function removeScope(scope: LabScope, key: ScopeKey): LabScope {
  const next: LabScope = { ...scope }
  if ((SCOPE_KEYS as readonly string[]).includes(key)) (next as unknown as Record<string, string>)[key] = ""
  else delete next[key as MoreKey]
  return next
}

/** Include didactic courses in the course list and population, or go back to clinical only (the default). */
export const withDidactic = (scope: LabScope, on: boolean): LabScope => {
  const next = { ...scope }
  if (on) next.incl = "didactic"
  else delete next.incl
  return next
}

export const includesDidactic = (scope: LabScope): boolean => scope.incl === "didactic"

export const withBasis = (scope: LabScope, basis: Basis): LabScope => {
  const next = { ...scope }
  if (basis === DEFAULT_BASIS) delete next.basis
  else next.basis = basis
  return next
}

export const basisOf = (scope: LabScope): Basis => scope.basis ?? DEFAULT_BASIS

/** No filter applied (the basis is not a filter). */
export const scopeIsEmpty = (scope: LabScope): boolean => FILTER_KEYS.every((k) => !scope[k])

/** "Clear filters" resets to the default scope (current term, every active student) and keeps the basis. */
export const clearFilters = (scope: LabScope): LabScope => withBasis(EMPTY_SCOPE, basisOf(scope))

/** The v2 report filters that follow from a scope. Term has no v2 filter; lib/lab/dashboard.ts applies it through offerings. */
export function toReportFilters(scope: LabScope): ReportFilters {
  return {
    ...NO_FILTERS,
    cohort: scope.cohort || ALL,
    group: scope.group || ALL,
    course: scope.course || ALL,
    category: scope.cat || ALL,
    tag: scope.tag || ALL,
    location: scope.loc || ALL,
    setting: (scope.setting as Setting | undefined) || ALL,
  }
}
