"use client"

/**
 * The shared scope controls for every reporting page (strategy/06 section 3.1; Romit 2026-10-27: "looks clunky with so many
 * dropdowns and asking user to refresh for the latest data").
 *
 * Two quiet parts instead of a row of selects:
 * - `ScopeContext`, the page header subtitle: the term and the course scope the figures read ("Fall 2026 · Clinical courses"),
 *   then when the figures were read ("Updated 2 min ago"). Figures refresh on their own (useSnapshot), so there is no Refresh.
 * - `ScopeBar`, one row under the header: ONE Filters button (outline, small, with the applied count) opening a popover with
 *   term, cohort, group, course scope (clinical only or include didactic), course, category, tag, location, setting and, where
 *   the page compares, Compare with. Every value that differs from the default shows as a chip on the row, each with its own
 *   remove button, plus Clear all (REQ RP-01: "What is currently applied must be evident, and each filter removable on its
 *   own"). Nothing applied beyond the defaults: no chips.
 * Composed from DS Popover, Select, Label, ViewSegmentedControl, FilterBar and Button: the DS exports no standalone filter chip
 * (ds-usage-map section 4), so chips are secondary Buttons.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { FilterBar, FilterBarClearButton } from "@exxatdesignux/ui/components/ui/filter-bar"
import { Popover, PopoverContent, PopoverTrigger } from "@exxatdesignux/ui/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { ViewSegmentedControl } from "@exxatdesignux/ui/components/ui/view-segmented-control"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { customGroupsStore } from "@/components/lab/admin-a/session-store"
import { CLINICAL_ONLY_LABEL, COURSE_KIND_LABEL, INCLUDE_DIDACTIC_LABEL } from "@/lib/v2/labels"
import type { Option, ScopeOptions } from "@/lib/lab/dashboard"
import { BASIS_LABEL } from "@/lib/lab/dashboard"
import { BASES, DEFAULT_BASIS, MORE_KEYS, SCOPE_LABEL, basisOf, clearFilters, includesDidactic, removeScope, setScope, withBasis, withDidactic, type Basis, type LabScope, type MoreKey, type ScopeKey } from "@/lib/lab/scope"
import { TYPE } from "@/components/lab/type-scale"

const ANY = "__any"

function ScopeSelect({ id, label, value, options, onChange, anyLabel = "Any" }: { id: string; label: string; value: string; options: Option[]; onChange: (v: string) => void; anyLabel?: string }) {
  return (
    <Select value={value || ANY} onValueChange={(v) => onChange(v === ANY ? "" : v)}>
      <SelectTrigger id={id} className="w-full" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="start" className="max-h-72">
        <SelectItem value={ANY}>{anyLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** Words for the course scope, used by the subtitle and the didactic chip. */
export const courseScopeWords = (scope: LabScope): string => (includesDidactic(scope) ? "Clinical and didactic courses" : "Clinical courses")

// ---------------------------------------------------------------------------------------------------------------------
// Freshness

/** "just now", "4 min ago", then the clock time after an hour. Re-renders every 30 s. */
export function useRelativeTime(at: Date | null): string {
  const [, tick] = React.useState(0)
  React.useEffect(() => {
    const t = window.setInterval(() => tick((n) => n + 1), 30_000)
    return () => window.clearInterval(t)
  }, [])
  if (!at) return ""
  const min = Math.floor((Date.now() - at.getTime()) / 60_000)
  if (min < 1) return "just now"
  if (min < 60) return `${min} min ago`
  return at.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
}

/**
 * The page header subtitle on reporting pages: what the figures cover, then when they were read. Spans only (the DS renders
 * the subtitle in a <p>).
 */
export function ScopeContext({ termName, scope, at, stale }: { termName: string; scope: LabScope; at: Date | null; stale?: boolean }) {
  const rel = useRelativeTime(at)
  const exact = at ? at.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : ""
  return (
    <span data-scope-context>
      <span data-course-kind={includesDidactic(scope) ? "all" : "clinical"}>{`${termName} · ${courseScopeWords(scope)}`}</span>
      {stale ? (
        // Figures older than a day (06 F4): the one warning in the header, a DS StatusBadge (a span, valid inside the subtitle).
        <span data-as-of data-stale>
          {" · "}
          <StatusBadge label="Figures from yesterday, 18:00" tone="warning" icon="fa-clock" size="sm" />
        </span>
      ) : rel ? (
        <span data-as-of title={`Updated at ${exact}. Figures update on their own.`}>{` · Updated ${rel}`}</span>
      ) : null}
    </span>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Filters

export interface ScopeBarProps {
  scope: LabScope
  options: ScopeOptions
  /** Term the figures use (the current one when the URL names none). */
  termName: string
  onChange: (next: LabScope) => void
  chipValue: (key: ScopeKey, value: string) => string
  /** Offer Compare with inside Filters (pages that compare against a basis; off where a chart carries its own control). */
  showBasis?: boolean
  /** Which More filters this page honours (06 S8). */
  moreKeys?: readonly MoreKey[]
  /** @deprecated Course always sits inside Filters now; kept so older callers compile. */
  courseInFilters?: boolean
  /** @deprecated The as-of time moved to the header subtitle (ScopeContext). Ignored. */
  asOf?: string
  /** @deprecated No manual refresh: figures update on their own. Ignored. */
  onRefresh?: () => void
  /** @deprecated Staleness shows in ScopeContext. Ignored. */
  stale?: boolean
  /** @deprecated Sample data sits in the page header. Ignored. */
  trailing?: React.ReactNode
}

/** One applied, removable value on the chip row. */
interface Chip {
  key: string
  label: string
  value: string
  remove: (s: LabScope) => LabScope
}

/** Chips for every value that differs from the default scope, in the order the panel lists them. Exported for tests. */
export function appliedChips(scope: LabScope, chipValue: (key: ScopeKey, value: string) => string, opts: { moreKeys?: readonly MoreKey[]; showBasis?: boolean; isDidactic?: (courseId: string) => boolean } = {}): Chip[] {
  const moreKeys = opts.moreKeys ?? MORE_KEYS
  const out: Chip[] = []
  const add = (k: ScopeKey) => {
    const v = scope[k]
    if (v) out.push({ key: k, label: SCOPE_LABEL[k], value: chipValue(k, v), remove: (s) => removeScope(s, k) })
  }
  add("cohort")
  add("group")
  if (includesDidactic(scope)) out.push({ key: "incl", label: "Courses", value: "Clinical and didactic", remove: (s) => withDidactic(s.course && opts.isDidactic?.(s.course) ? removeScope(s, "course") : s, false) })
  add("course")
  for (const k of moreKeys) add(k)
  if (opts.showBasis && basisOf(scope) !== DEFAULT_BASIS) out.push({ key: "basis", label: "Compare with", value: BASIS_LABEL[basisOf(scope)], remove: (s) => withBasis(s, DEFAULT_BASIS) })
  return out
}

export function ScopeBar({ scope, options, termName, onChange, chipValue: chipValueProp, showBasis = true, moreKeys = MORE_KEYS }: ScopeBarProps) {
  // Custom groups made in Lists this session join the Group filter; their values carry their rules, so every page resolves them.
  const custom = customGroupsStore.use()
  const groupOpts = React.useMemo(() => {
    const have = new Set(options.groups.map((g) => g.value))
    return [...options.groups, ...custom.filter((c) => !have.has(c.id)).map((c) => ({ value: c.id, label: c.name }))]
  }, [options.groups, custom])
  const chipValue = React.useCallback((key: ScopeKey, value: string) => (key === "group" ? (groupOpts.find((g) => g.value === value)?.label ?? chipValueProp(key, value)) : chipValueProp(key, value)), [groupOpts, chipValueProp])
  const opt: Record<MoreKey, Option[]> = { cat: options.categories, tag: options.tags, loc: options.locations, setting: options.settings }
  const chips = appliedChips(scope, chipValue, { moreKeys, showBasis, isDidactic: (id) => options.courses.some((o) => o.value === id && o.kind === "didactic") })
  // A chosen term other than the current one is applied too: the subtitle names it, Filters counts it, Clear all resets it.
  const count = chips.length + (scope.term ? 1 : 0)
  const incl = includesDidactic(scope)
  const courses = options.courses.filter((o) => incl || o.kind !== "didactic" || o.value === scope.course)

  return (
    <form role="form" aria-label="Scope" className="flex flex-wrap items-center gap-2" onSubmit={(e) => e.preventDefault()} data-scope-bar data-region="scope">
      <Popover>
        <PopoverTrigger asChild>
          <Button id="scope-more" type="button" variant="outline" size="sm" aria-haspopup="dialog" data-filters-button>
            Filters
            {count ? (
              <>
                <span className="tabular-nums">{count}</span>
                <span className="sr-only"> applied</span>
              </>
            ) : null}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[min(34rem,calc(100vw-2rem))] p-4" aria-label="Filters" data-filters-panel>
          <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="scope-term">{SCOPE_LABEL.term}</Label>
              <ScopeSelect id="scope-term" label="Term" value={scope.term} options={options.terms} anyLabel={`${termName} (current)`} onChange={(v) => onChange(setScope(scope, "term", v))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="scope-cohort">{SCOPE_LABEL.cohort}</Label>
              <ScopeSelect id="scope-cohort" label="Cohort" value={scope.cohort} options={options.cohorts.map((c) => ({ value: c, label: c }))} anyLabel="All cohorts" onChange={(v) => onChange(setScope(scope, "cohort", v))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="scope-group">{SCOPE_LABEL.group}</Label>
              {/* Group is its own filter (REQ line 303, CALL 10-26): no cohort needed; with a cohort chosen, the two intersect. */}
              <ScopeSelect id="scope-group" label="Group" value={scope.group} options={groupOpts} anyLabel="All groups" onChange={(v) => onChange(setScope(scope, "group", v))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className={TYPE.label} id="scope-kind-label">Courses</span>
              {/* Clinical courses first (CALL 10-26, a default pending the client); didactic is one switch away. */}
              <ViewSegmentedControl
                aria-label="Courses"
                value={incl ? "all" : "clinical"}
                onValueChange={(v) => {
                  if (v === "all") return onChange(withDidactic(scope, true))
                  const chosen = options.courses.find((o) => o.value === scope.course)
                  onChange(withDidactic(chosen?.kind === "didactic" ? removeScope(scope, "course") : scope, false))
                }}
                options={[
                  { value: "clinical", label: CLINICAL_ONLY_LABEL },
                  { value: "all", label: INCLUDE_DIDACTIC_LABEL },
                ]}
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="scope-course">{SCOPE_LABEL.course}</Label>
              <ScopeSelect id="scope-course" label="Course" value={scope.course} options={courses.map((o) => ({ value: o.value, label: o.kind === "didactic" ? `${o.label} (${COURSE_KIND_LABEL.didactic.toLowerCase()})` : o.label }))} anyLabel={incl ? "All courses" : "All clinical courses"} onChange={(v) => onChange(setScope(scope, "course", v))} />
            </div>
            {moreKeys.map((k) => (
              <div key={k} className="flex flex-col gap-1.5">
                <Label htmlFor={`scope-${k}`}>{SCOPE_LABEL[k]}</Label>
                <ScopeSelect id={`scope-${k}`} label={SCOPE_LABEL[k]} value={scope[k] ?? ""} options={opt[k]} onChange={(v) => onChange(setScope(scope, k, v))} />
              </div>
            ))}
            {showBasis ? (
              <div className="flex flex-col gap-1.5 border-t border-border pt-3 sm:col-span-2">
                <Label htmlFor="scope-basis">Compare with</Label>
                <Select value={basisOf(scope)} onValueChange={(v) => onChange(withBasis(scope, v as Basis))}>
                  <SelectTrigger id="scope-basis" className="w-full sm:w-1/2" aria-label="Compare with">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start">
                    {BASES.map((b) => (
                      <SelectItem key={b} value={b}>
                        {BASIS_LABEL[b]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>
      {chips.length > 0 ? (
        // Applied filters, each removable on its own (REQ RP-01); Clear all returns to the default scope.
        <FilterBar aria-label="Applied filters" className="max-w-full flex-none" data-applied-filters>
          {chips.map((c) => (
            <Button key={c.key} type="button" variant="secondary" size="sm" className="max-w-[16rem]" data-scope-chip={c.key} aria-label={`Remove ${c.label} ${c.value}`} onClick={() => onChange(c.remove(scope))}>
              <span className="text-muted-foreground">{c.label}:</span> <span className="truncate">{c.value}</span>
              <i className="fa-light fa-xmark" aria-hidden="true" />
            </Button>
          ))}
          <FilterBarClearButton onClick={() => onChange(showBasis ? withBasis(clearFilters(scope), DEFAULT_BASIS) : clearFilters(scope))}>Clear all</FilterBarClearButton>
        </FilterBar>
      ) : null}
    </form>
  )
}
