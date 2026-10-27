"use client"

/**
 * The Reports set control (decisions D-X12, D-X16; Romit 2026-10-27 "can we improve the UI here?"): one DS ViewSegmentedControl
 * on the toolbar row beside Filters, "Required this term | Required to graduate | All skills". The two required sets are never
 * mixed in one figure, so the control names the set the page reads. "All skills" is offered on the Skills view only, where it
 * applies: the published skills nobody in scope needs follow the required ones, and no figure changes.
 * State lives in the URL so links, the dashboard tiles and "Open in Reports" keep working: `required=term|graduate` (absent
 * means the scope's default, `defaultRequiredSet`) and `skills=all`.
 */
import * as React from "react"
import { ViewSegmentedControl } from "@exxatdesignux/ui/components/ui/view-segmented-control"
import { REQUIRED_SET_OPTIONS, REQUIRED_SET_PARAM, defaultRequiredSet, parseRequiredSet, requiredSetQuery, type RequiredSetKey } from "@/lib/lab/attainment"
import type { LabScope } from "@/lib/lab/scope"
import type { V2State } from "@/lib/v2/types"
import { skillNounPlural } from "@/lib/lab/terms"

/** The set in force: the URL's `required`, else the default for the scope (graduating cohort reads "Required to graduate"). */
export function useRequiredSet(state: V2State | null, scope: LabScope, param: (k: string) => string | null, hrefWith: (p: Record<string, string | null>) => string) {
  const raw = param(REQUIRED_SET_PARAM)
  const fallback: RequiredSetKey = state ? defaultRequiredSet(state, scope) : "thisTerm"
  const basis: RequiredSetKey = parseRequiredSet(raw) ?? fallback
  /** URL params that select a required set (and leave "All skills"). */
  const paramsFor = React.useCallback((k: RequiredSetKey): Record<string, string | null> => ({ [REQUIRED_SET_PARAM]: k === fallback ? null : requiredSetQuery(k), skills: null, peek: null }), [fallback])
  const hrefFor = React.useCallback((k: RequiredSetKey) => hrefWith(paramsFor(k)), [hrefWith, paramsFor])
  return { basis, hrefFor, paramsFor }
}

/** URL params for "All skills": the required set in force stays, and its skills come first. */
export const ALL_SKILLS_PARAMS: Record<string, string | null> = { skills: "all", peek: null }

type SetValue = RequiredSetKey | "all"

/**
 * `allSkills` undefined: the view has no "All skills" (Students, Sections and tags, the matrix). A boolean: offered, and whether
 * it is the current choice.
 */
export function RequiredSetControl({ basis, allSkills, paramsFor, onChange, className }: { basis: RequiredSetKey; allSkills?: boolean; paramsFor: (k: RequiredSetKey) => Record<string, string | null>; onChange: (params: Record<string, string | null>) => void; className?: string }) {
  const options: Array<{ value: SetValue; label: string }> = [...REQUIRED_SET_OPTIONS]
  if (allSkills !== undefined) options.push({ value: "all", label: `All ${skillNounPlural()}` })
  const value: SetValue = allSkills ? "all" : basis
  return (
    <span className="contents" data-required-set={allSkills ? "all" : requiredSetQuery(basis)}>
      <ViewSegmentedControl<SetValue>
        aria-label={`Which ${skillNounPlural()}`}
        value={value}
        onValueChange={(v) => onChange(v === "all" ? ALL_SKILLS_PARAMS : paramsFor(v))}
        options={options}
        className={className}
      />
    </span>
  )
}
