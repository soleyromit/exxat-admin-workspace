"use client"

/**
 * The shared scope bar (strategy/06 section 3.1, density per strategy/07 A5 and A6). One row only: term, cohort, course, Filters
 * (group, category, tag, location, setting), Compare with, as-of time with Refresh. Applied filters never open a second row
 * (density sweep 2026-10-26): cohort and course already print their value in their own select, so a chip would say it twice;
 * filters inside the popover are summarised on the Filters button itself ("Filters Group 2A" or "Filters 2") and each is removed,
 * or all cleared, inside the popover, one click away (strategy/07 K5). Composed from DS Select, Popover, FilterBar and Button: the
 * DS exports no standalone filter chip (ds-usage-map section 4), so chips are secondary Buttons.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { FilterBar, FilterBarClearButton } from "@exxatdesignux/ui/components/ui/filter-bar"
import { Popover, PopoverContent, PopoverTrigger } from "@exxatdesignux/ui/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { customGroupsStore } from "@/components/lab/admin-a/session-store"
import { CLINICAL_ONLY_LABEL, COURSE_KIND_LABEL, INCLUDE_DIDACTIC_LABEL } from "@/lib/v2/labels"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { Tip } from "@exxatdesignux/ui/components/ui/tip"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import type { Option, ScopeOptions } from "@/lib/lab/dashboard"
import { BASIS_LABEL } from "@/lib/lab/dashboard"
import { BASES, MORE_KEYS, SCOPE_LABEL, basisOf, clearFilters, includesDidactic, removeScope, scopeIsEmpty, setScope, withBasis, withDidactic, type Basis, type LabScope, type MoreKey, type ScopeKey } from "@/lib/lab/scope"

const ANY = "__any"

function ScopeSelect({ id, label, value, options, onChange, disabled, anyLabel = "Any", describedBy, inlineLabel = false }: { id: string; label: string; value: string; options: Option[]; onChange: (v: string) => void; disabled?: boolean; anyLabel?: string; describedBy?: string; inlineLabel?: boolean }) {
  return (
    <Select value={value || ANY} onValueChange={(v) => onChange(v === ANY ? "" : v)} disabled={disabled}>
      <SelectTrigger id={id} size="sm" className="h-8 w-auto max-w-[18rem] gap-1.5 text-sm" aria-label={label} aria-describedby={describedBy}>
        {/* Toolbar selects print their label inside the trigger ("Term Fall 2026"): one compact row, no label row (recognition over recall). */}
        {inlineLabel ? <span className="text-muted-foreground" aria-hidden="true">{label}</span> : null}
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

const DIDACTIC_ON = "__didactic_on"
const DIDACTIC_OFF = "__didactic_off"

/**
 * Course select, clinical courses first (CALL 10-26, a default pending the client): the trigger reads "Course Clinical only" until
 * didactic courses are included; the last option switches between the two. A chosen didactic course stays listed so it never vanishes.
 */
function CourseSelect({ id, scope, options, onChange, inlineLabel = false }: { id: string; scope: LabScope; options: Option[]; onChange: (next: LabScope) => void; inlineLabel?: boolean }) {
  const incl = includesDidactic(scope)
  const shown = options.filter((o) => incl || o.kind !== "didactic" || o.value === scope.course)
  const pick = (v: string) => {
    if (v === DIDACTIC_ON) return onChange(withDidactic(scope, true))
    if (v === DIDACTIC_OFF) {
      const chosen = options.find((o) => o.value === scope.course)
      return onChange(withDidactic(chosen?.kind === "didactic" ? removeScope(scope, "course") : scope, false))
    }
    onChange(setScope(scope, "course", v === ANY ? "" : v))
  }
  return (
    <Select value={scope.course || ANY} onValueChange={pick}>
      <SelectTrigger id={id} size="sm" className="h-8 w-auto max-w-[18rem] gap-1.5 text-sm" aria-label={`Course${incl ? "" : `, ${CLINICAL_ONLY_LABEL.toLowerCase()}`}`} data-course-kind={incl ? "all" : "clinical"}>
        {inlineLabel ? <span className="text-muted-foreground" aria-hidden="true">Course</span> : null}
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="start" className="max-h-72">
        <SelectItem value={ANY}>{incl ? "Any" : CLINICAL_ONLY_LABEL}</SelectItem>
        {shown.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.kind === "didactic" ? `${o.label} (${COURSE_KIND_LABEL.didactic.toLowerCase()})` : o.label}
          </SelectItem>
        ))}
        <SelectSeparator />
        <SelectItem value={incl ? DIDACTIC_OFF : DIDACTIC_ON}>{incl ? `Show ${CLINICAL_ONLY_LABEL.toLowerCase()}` : INCLUDE_DIDACTIC_LABEL}</SelectItem>
      </SelectContent>
    </Select>
  )
}

export interface ScopeBarProps {
  scope: LabScope
  options: ScopeOptions
  /** Term the figures use (the current one when the URL names none). */
  termName: string
  onChange: (next: LabScope) => void
  chipValue: (key: ScopeKey, value: string) => string
  asOf: string
  onRefresh: () => void
  /** Figures older than a day (06 F4). */
  stale?: boolean
  /** Hide the basis control (reviewer queue honours term, cohort, group, course only). */
  showBasis?: boolean
  /** Which More filters this page honours (06 S8). */
  moreKeys?: readonly MoreKey[]
  /** Shown after Refresh (the Sample data chip). */
  trailing?: React.ReactNode
  /**
   * List and report pages (strategy/07 list budget: search, up to 3 filters, view, 1 action): Course moves into the Filters
   * popover so the visible row is term, cohort, Filters, Refresh. Optional; dashboards keep Course on the row.
   */
  courseInFilters?: boolean
}

export function ScopeBar({ scope, options, termName, onChange, chipValue: chipValueProp, asOf, onRefresh, stale, showBasis = true, moreKeys = MORE_KEYS, trailing, courseInFilters = false }: ScopeBarProps) {
  // Custom groups made in Lists this session join the Group filter; their values carry their rules, so every page resolves them.
  const custom = customGroupsStore.use()
  const groupOpts = React.useMemo(() => {
    const have = new Set(options.groups.map((g) => g.value))
    return [...options.groups, ...custom.filter((c) => !have.has(c.id)).map((c) => ({ value: c.id, label: c.name }))]
  }, [options.groups, custom])
  const chipValue = React.useCallback((key: ScopeKey, value: string) => (key === "group" ? (groupOpts.find((g) => g.value === value)?.label ?? chipValueProp(key, value)) : chipValueProp(key, value)), [groupOpts, chipValueProp])
  const basis = basisOf(scope)
  const moreCount = moreKeys.filter((k) => scope[k]).length + (scope.group ? 1 : 0) + (courseInFilters && scope.course ? 1 : 0)
  const opt: Record<ScopeKey, Option[]> = { term: options.terms, cohort: options.cohorts.map((c) => ({ value: c, label: c })), group: options.groups, course: options.courses, cat: options.categories, tag: options.tags, loc: options.locations, setting: options.settings }
  // Filters that live in the popover (group plus this page's More keys) and are applied now; one applied filter is named on the button.
  const inPopover = ([...(courseInFilters ? ["course"] : []), "group", ...moreKeys] as ScopeKey[]).filter((k) => !!scope[k])
  // The button shows the value only ("Filters Group A"); the accessible name keeps the key ("Group Group A").
  const summary = inPopover.length === 1 ? chipValue(inPopover[0], scope[inPopover[0]] ?? "") : null
  const summaryName = inPopover.length === 1 ? `${SCOPE_LABEL[inPopover[0]]} ${summary}` : null

  return (
    <form role="form" aria-label="Scope" className="flex flex-col gap-2" onSubmit={(e) => e.preventDefault()} data-scope-bar data-region="scope">
      {/* One row (strategy/07 A5, A6, Hick): term, cohort, course and More filters; Compare with and the as-of time on the right. */}
      <div className="flex flex-wrap items-center gap-2">
        <ScopeSelect id="scope-term" label="Term" inlineLabel value={scope.term} options={options.terms} anyLabel={termName} onChange={(v) => onChange(setScope(scope, "term", v))} />
        <ScopeSelect id="scope-cohort" label="Cohort" inlineLabel value={scope.cohort} options={options.cohorts.map((c) => ({ value: c, label: c }))} anyLabel="Any" onChange={(v) => onChange(setScope(scope, "cohort", v))} />
        {courseInFilters ? null : <CourseSelect id="scope-course" inlineLabel scope={scope} options={options.courses} onChange={onChange} />}
        <Popover>
          <PopoverTrigger asChild>
            <Button id="scope-more" type="button" variant="outline" size="sm" className="max-w-[16rem]" aria-haspopup="dialog" aria-label={`Filters ${summary ?? moreCount}${moreCount ? ` applied${summaryName ? `, ${summaryName}` : ""}` : ""}`}>
              <span className="text-muted-foreground">Filters</span>{" "}
              {summary ? <span className="truncate">{summary}</span> : <span className="tabular-nums">{moreCount}</span>}
              <i className="fa-light fa-chevron-down" aria-hidden="true" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="flex w-72 flex-col gap-3 p-3" aria-label="More filters">
            {courseInFilters ? (
              <div className="flex flex-col gap-1">
                <Label htmlFor="scope-course">{SCOPE_LABEL.course}</Label>
                <CourseSelect id="scope-course" scope={scope} options={options.courses} onChange={onChange} />
              </div>
            ) : null}
            <div className="flex flex-col gap-1">
              <Label htmlFor="scope-group">{SCOPE_LABEL.group}</Label>
              {/* Group is its own filter (REQ line 303, CALL 10-26): no cohort needed; with a cohort chosen, the two intersect. */}
              <ScopeSelect id="scope-group" label="Group" value={scope.group} options={groupOpts} anyLabel="All groups" onChange={(v) => onChange(setScope(scope, "group", v))} />
            </div>
            {moreKeys.map((k) => (
              <div key={k} className="flex flex-col gap-1">
                <Label htmlFor={`scope-${k}`}>{SCOPE_LABEL[k]}</Label>
                <ScopeSelect id={`scope-${k}`} label={SCOPE_LABEL[k]} value={scope[k] ?? ""} options={opt[k]} onChange={(v) => onChange(setScope(scope, k, v))} />
              </div>
            ))}
            {inPopover.length > 0 ? (
              <FilterBar aria-label="Applied filters">
                {inPopover.map((k) => (
                  <Button key={k} type="button" variant="secondary" size="sm" data-scope-chip={k} aria-label={`Remove ${SCOPE_LABEL[k]} ${chipValue(k, scope[k] ?? "")}`} onClick={() => onChange(removeScope(scope, k))}>
                    <span className="text-muted-foreground">{SCOPE_LABEL[k]}:</span> {chipValue(k, scope[k] ?? "")}
                    <i className="fa-light fa-xmark" aria-hidden="true" />
                  </Button>
                ))}
                {scopeIsEmpty(scope) ? null : <FilterBarClearButton onClick={() => onChange(clearFilters(scope))}>Clear filters</FilterBarClearButton>}
              </FilterBar>
            ) : null}
          </PopoverContent>
        </Popover>
        <div className="ms-auto flex flex-wrap items-center gap-2">
          {showBasis ? (
            <Select value={basis} onValueChange={(v) => onChange(withBasis(scope, v as Basis))}>
              <SelectTrigger id="scope-basis" size="sm" className="h-8 w-auto min-w-[11rem] gap-1.5 text-sm" aria-label="Compare with">
                <span className="text-muted-foreground" aria-hidden="true">Compare with</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {BASES.map((b) => (
                  <SelectItem key={b} value={b}>
                    {BASIS_LABEL[b]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <div className="flex items-center gap-1 text-sm text-muted-foreground" data-as-of>
            {stale ? (
              <Tip label="These figures were calculated yesterday. Refresh to recalculate them now.">
                <span>
                  <StatusBadge label="Figures from yesterday, 18:00" tone="warning" icon="fa-clock" size="sm" />
                </span>
              </Tip>
            ) : (
              <span>As of {asOf}</span>
            )}
            <Button type="button" variant="outline" size="icon-sm" aria-label="Refresh figures" onClick={onRefresh}>
              <i className="fa-light fa-arrows-rotate" aria-hidden="true" />
            </Button>
            {trailing}
          </div>
        </div>
      </div>
    </form>
  )
}
