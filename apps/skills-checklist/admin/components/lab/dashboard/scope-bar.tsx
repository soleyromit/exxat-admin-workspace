"use client"

/**
 * The shared scope control for every reporting page (strategy/06 section 3.1; ledger D-L8, reversed in part by D-L8b).
 *
 * D-L8b (Romit 2026-10-30: "i don't want to know last updated date and time, since it holds no value"): no header subtitle and no
 * "Updated" time anywhere. `ScopeBar` is ONE inline group the page places in the toolbar of the table or chart it filters, never
 * alone on a row: the Filters button (outline, small, with the applied count) opening a popover with term, cohort, group, course
 * scope (clinical only or include didactic), course, category, tag, location, setting and, where the page compares, Compare with;
 * then the scope the figures read, so it stays evident (REQ RP-01): the term and course scope in quiet text while they are the
 * defaults, and every value that differs from the default as a chip with its own remove button, plus Clear all ("What is
 * currently applied must be evident, and each filter removable on its own"). Figures refresh on their own (useSnapshot).
 * Composed from DS Popover, Select, Label, ViewSegmentedControl, FilterBar, StatusBadge and Button: the DS exports no standalone
 * filter chip (ds-usage-map section 4), so chips are secondary Buttons.
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

/** Words for the course scope, used by the scope summary in the Filters group. */
export const courseScopeWords = (scope: LabScope): string => (includesDidactic(scope) ? "Clinical and didactic courses" : "Clinical courses")

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
  /** @deprecated No as-of time anywhere (D-L8b). Ignored. */
  asOf?: string
  /** @deprecated No manual refresh: figures update on their own. Ignored. */
  onRefresh?: () => void
  /** Figures older than a day (06 F4): the one warning, a StatusBadge beside the chips. */
  stale?: boolean
  /** Extra classes for the group (the caller's toolbar sets its place on the row). */
  className?: string
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
export function appliedChips(scope: LabScope, chipValue: (key: ScopeKey, value: string) => string, opts: { moreKeys?: readonly MoreKey[]; showBasis?: boolean; isDidactic?: (courseId: string) => boolean; currentTerm?: string } = {}): Chip[] {
  const moreKeys = opts.moreKeys ?? MORE_KEYS
  const out: Chip[] = []
  // A term other than the current one is applied: a chip like any other, removing it returns to the current term.
  if (scope.term && scope.term !== opts.currentTerm) out.push({ key: "term", label: SCOPE_LABEL.term, value: scope.term, remove: (s) => removeScope(s, "term") })
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

/** Everything the three Filters renderings share: the options, the applied chips and the panel. */
function useScope({ scope, options, termName, onChange, chipValue: chipValueProp, showBasis = true, moreKeys = MORE_KEYS }: ScopeBarProps) {
  // Custom groups made in Lists this session join the Group filter; their values carry their rules, so every page resolves them.
  const custom = customGroupsStore.use()
  const groupOpts = React.useMemo(() => {
    const have = new Set(options.groups.map((g) => g.value))
    return [...options.groups, ...custom.filter((c) => !have.has(c.id)).map((c) => ({ value: c.id, label: c.name }))]
  }, [options.groups, custom])
  const chipValue = React.useCallback((key: ScopeKey, value: string) => (key === "group" ? (groupOpts.find((g) => g.value === value)?.label ?? chipValueProp(key, value)) : chipValueProp(key, value)), [groupOpts, chipValueProp])
  // The current term is the default: picking it again is not an applied filter (no chip, no count).
  const current = options.currentTerm ?? termName
  const chips = appliedChips(scope, chipValue, { moreKeys, showBasis, currentTerm: current, isDidactic: (id) => options.courses.some((o) => o.value === id && o.kind === "didactic") })
  const incl = includesDidactic(scope)
  const termChosen = chips.some((c) => c.key === "term")
  const summary = [termChosen ? null : termName, incl ? null : courseScopeWords(scope)].filter(Boolean).join(" · ")
  const clearAll = () => onChange(showBasis ? withBasis(clearFilters(scope), DEFAULT_BASIS) : clearFilters(scope))
  return { groupOpts, chips, incl, current, summary, clearAll }
}

function FiltersPopover(props: ScopeBarProps & { s: ReturnType<typeof useScope>; align?: "start" | "end" }) {
  const { scope, options, onChange, showBasis = true, moreKeys = MORE_KEYS, s, align = "start" } = props
  const { groupOpts, chips, incl, current } = s
  const count = chips.length
  const opt: Record<MoreKey, Option[]> = { cat: options.categories, tag: options.tags, loc: options.locations, setting: options.settings }
  const courses = options.courses.filter((o) => incl || o.kind !== "didactic" || o.value === scope.course)
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button id="scope-more" type="button" variant="outline" size="sm" aria-haspopup="dialog" data-filters-button data-course-kind={incl ? "all" : "clinical"}>
          Filters
          {count ? (
            <>
              <span className="tabular-nums">{count}</span>
              <span className="sr-only"> applied</span>
            </>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-[min(34rem,calc(100vw-2rem))] p-4" aria-label="Filters" data-filters-panel>
        <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="scope-term">{SCOPE_LABEL.term}</Label>
            <ScopeSelect id="scope-term" label="Term" value={scope.term === current ? "" : scope.term} options={options.terms.filter((t) => t.value !== current)} anyLabel={`${current} (current)`} onChange={(v) => onChange(setScope(scope, "term", v))} />
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
  )
}

function AppliedChips({ scope, onChange, s }: { scope: LabScope; onChange: (next: LabScope) => void; s: ReturnType<typeof useScope> }) {
  if (!s.chips.length) return null
  return (
    // Applied filters, each removable on its own (REQ RP-01); Clear all returns to the default scope.
    <FilterBar aria-label="Applied filters" className="max-w-full flex-none" data-applied-filters>
      {s.chips.map((c) => (
        // The full value, never cut (anatomy A10, 2026-10-30: "NUR 220 Family-Centered…" was truncated). A long course name keeps
        // one line while it fits the row and wraps inside the chip at narrow widths; the chip grows to fit instead of clipping.
        <Button key={c.key} type="button" variant="secondary" size="sm" className="h-auto min-h-8 max-w-full whitespace-normal py-1 text-start" data-scope-chip={c.key} aria-label={`Remove ${c.label} ${c.value}`} onClick={() => onChange(c.remove(scope))}>
          <span className="shrink-0 text-muted-foreground">{c.label}:</span> <span className="min-w-0">{c.value}</span>
          <i className="fa-light fa-xmark" aria-hidden="true" />
        </Button>
      ))}
      <FilterBarClearButton onClick={s.clearAll}>Clear all</FilterBarClearButton>
    </FilterBar>
  )
}

/**
 * The inline Filters group, for a page whose Filters shares a real toolbar with a table, tabs or search (drills, reports,
 * approvals, students): the button, the default scope in quiet text while no chip names it, and the removable chips.
 */
export function ScopeBar(props: ScopeBarProps) {
  const s = useScope(props)
  const { stale = false, className = "" } = props
  return (
    <form role="form" aria-label="Scope" className={`flex min-w-0 flex-wrap items-center gap-2 ${className}`} onSubmit={(e) => e.preventDefault()} data-scope-bar data-region="scope" data-course-kind={s.incl ? "all" : "clinical"}>
      <FiltersPopover {...props} s={s} />
      {s.summary ? (
        <span className="whitespace-nowrap text-sm text-muted-foreground" data-scope-summary>
          {s.summary}
        </span>
      ) : null}
      {stale ? <StatusBadge label="Figures from yesterday, 18:00" tone="warning" icon="fa-clock" size="sm" /> : null}
      <AppliedChips scope={props.scope} onChange={props.onChange} s={s} />
    </form>
  )
}

/**
 * Dashboards (Romit 2026-10-30, "filters buttons at wrong places"): the page-wide Filters button sits in the page header beside
 * Export. The default scope (current term, clinical courses) needs no text. Applied values show on one compact line directly
 * under the header, only when something is applied (REQ RP-01: evident and removable one by one, plus Clear all).
 */
export function ScopeFiltersButton(props: ScopeBarProps) {
  const s = useScope(props)
  return <FiltersPopover {...props} s={s} align="end" />
}

/** The applied-filters line under the header (null when nothing is applied and the figures are fresh). */
export function ScopeAppliedLine(props: ScopeBarProps) {
  const s = useScope(props)
  const { stale = false, className = "" } = props
  if (!s.chips.length && !stale) return null
  return (
    <div className={`flex min-w-0 flex-wrap items-center gap-2 ${className}`} data-scope-bar data-region="scope" data-course-kind={s.incl ? "all" : "clinical"}>
      {stale ? <StatusBadge label="Figures from yesterday, 18:00" tone="warning" icon="fa-clock" size="sm" /> : null}
      <AppliedChips scope={props.scope} onChange={props.onChange} s={s} />
    </div>
  )
}
