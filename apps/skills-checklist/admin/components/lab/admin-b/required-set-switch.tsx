"use client"

/**
 * "Required this term | Required to graduate" (decision D-X12): which required set the Attainment records are read against.
 * The two sets are never mixed in one figure, so the page names the set it shows and offers the other one link away, the same
 * sentence-switch pattern as the Skills tab's "required / all" switch (D-X16). A link, not a segmented control, because it
 * changes the URL (`required=term|graduate`) and the density budget has no control to spare above the view (strategy/07).
 * Labels come from `REQUIRED_SET_LABEL` via `REQUIRED_SET_OPTIONS`; the default (no `set` in the URL) is `defaultRequiredSet`.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { LINK } from "@/components/lab/link-styles"
import { REQUIRED_SET_OPTIONS, REQUIRED_SET_PARAM, defaultRequiredSet, parseRequiredSet, requiredSetQuery, type RequiredSetKey } from "@/lib/lab/attainment"
import type { LabScope } from "@/lib/lab/scope"
import type { V2State } from "@/lib/v2/types"

/** The set in force: the URL's `set`, else the default for the scope (graduating cohort reads "Required to graduate"). */
export function useRequiredSet(state: V2State | null, scope: LabScope, param: (k: string) => string | null, hrefWith: (p: Record<string, string | null>) => string) {
  const raw = param(REQUIRED_SET_PARAM)
  const fallback: RequiredSetKey = state ? defaultRequiredSet(state, scope) : "thisTerm"
  const basis: RequiredSetKey = parseRequiredSet(raw) ?? fallback
  const hrefFor = React.useCallback((k: RequiredSetKey) => hrefWith({ [REQUIRED_SET_PARAM]: k === fallback ? null : requiredSetQuery(k), peek: null }), [hrefWith, fallback])
  return { basis, hrefFor }
}

export function RequiredSetSwitch({ basis, hrefFor, className = "" }: { basis: RequiredSetKey; hrefFor: (k: RequiredSetKey) => string; className?: string }) {
  const current = REQUIRED_SET_OPTIONS.find((o) => o.value === basis)!
  const other = REQUIRED_SET_OPTIONS.find((o) => o.value !== basis)!
  return (
    <p className={`flex flex-wrap items-baseline gap-x-2 text-sm text-muted-foreground ${className}`} data-required-set={requiredSetQuery(basis)} data-viz-label>
      <span className="font-medium text-foreground">{current.label}</span>
      <span aria-hidden="true">·</span>
      <Link className={LINK} href={hrefFor(other.value)} scroll={false} replace aria-label={`Which required set: show ${other.label.toLowerCase()} instead`}>
        {`Show ${other.label.toLowerCase()}`}
      </Link>
    </p>
  )
}
