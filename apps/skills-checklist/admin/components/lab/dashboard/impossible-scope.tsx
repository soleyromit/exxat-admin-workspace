"use client"

/**
 * REQ RP-09: "A filter combination that cannot produce evidence (a location that does not offer the chosen setting) must be
 * explained rather than returned as an empty result." One banner for every reporting screen that is not a dashboard (drill,
 * attainment, export, director dashboard, reports and attainment); the dashboards render the same sentence from the same
 * function (lib/lab/dashboard.ts explainScope), so the words never differ. It replaces the figures, never sits over zeros, and
 * offers one Remove per offending filter.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { explainScope, removeKeys } from "@/lib/lab/dashboard"
import { SCOPE_LABEL, type LabScope } from "@/lib/lab/scope"
import type { V2State } from "@/lib/v2/types"

export const IMPOSSIBLE_TITLE = "These filters cannot match any evidence"

/** The explanation for this scope, memoised; null when the combination can produce evidence. */
export function useImpossibleScope(state: V2State | null | undefined, scope: LabScope) {
  return React.useMemo(() => (state ? explainScope(state, scope) : null), [state, scope])
}

export function ImpossibleScopeBanner({ state, scope, onChange }: { state: V2State | null | undefined; scope: LabScope; onChange: (next: LabScope) => void }) {
  const explained = useImpossibleScope(state, scope)
  if (!explained) return null
  return (
    <div data-impossible-scope>
      <LocalBanner variant="info" title={IMPOSSIBLE_TITLE}>
        <span className="flex flex-col gap-2">
          <span>{explained.text}</span>
          <span className="flex flex-wrap gap-2">
            {explained.remove.map((r) => (
              <Button key={r.key} type="button" variant="outline" size="sm" onClick={() => onChange(removeKeys(scope, [r.key]))}>
                {`Remove ${SCOPE_LABEL[r.key].toLowerCase()}`}
              </Button>
            ))}
          </span>
        </span>
      </LocalBanner>
    </div>
  )
}
