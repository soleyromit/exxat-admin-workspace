"use client"

import * as React from "react"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@exxatdesignux/ui/components/ui/collapsible"
import used from "@/lib/lab/ds-used.generated.json"

interface Entry {
  name: string
  from: string
  via?: string
}

const registry = used as Record<string, { direct: Entry[]; via: Entry[] }>

/** Distinct DS component names the gate found for a variant, or null when the variant has not been scanned. */
export function dsUsedCount(screenKey: string): number | null {
  const entry = registry[screenKey]
  if (!entry) return null
  return new Set([...entry.direct, ...entry.via].map((d) => d.name)).size
}

/**
 * Every @exxatdesignux/ui import this variant uses, directly or through a local wrapper. Data comes from
 * `node scripts/lab-ds-gate.mjs --write`. Content only: the lab bar shows it in a Sheet (components/lab/lab-bar).
 */
export function DsUsedList({ screenKey }: { screenKey: string }) {
  const entry = registry[screenKey]
  if (!entry) return <p className="text-sm text-muted-foreground">This variant has not been scanned. Run node scripts/lab-ds-gate.mjs --write.</p>
  return (
    <div className="flex flex-col gap-4" data-ds-used-list={screenKey}>
      <section aria-label="Imported by this page" className="flex flex-col gap-1.5">
        <h3 className="text-xs font-medium text-muted-foreground">Imported by this page</h3>
        <ul className="flex flex-wrap gap-1.5">
          {entry.direct.map((d) => (
            <li key={`${d.name}-${d.from}`}>
              <Badge variant="outline" title={d.from}>{d.name}</Badge>
            </li>
          ))}
        </ul>
      </section>
      <section aria-label="Brought in by shared components" className="flex flex-col gap-1.5">
        <h3 className="text-xs font-medium text-muted-foreground">Brought in by shared components</h3>
        <ul className="flex flex-wrap gap-1.5">
          {entry.via.map((d) => (
            <li key={`${d.name}-${d.via}`}>
              <Badge variant="outline" title={`${d.from} via ${d.via}`}>{d.name}</Badge>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

/**
 * Legacy collapsible panel, kept for any stray import. Lab pages no longer render it under the screen; the lab bar's
 * "Components" button opens the same list in a drawer.
 */
export function DsUsedPanel({ screenKey }: { screenKey: string }) {
  const [open, setOpen] = React.useState(false)
  const count = dsUsedCount(screenKey)
  // Stable id from the screen key (not useId), so server and client markup agree and aria-controls always resolves.
  const contentId = `ds-used-${screenKey.replace(/[^a-zA-Z0-9]+/g, "-")}`
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border border-border bg-card" data-ds-used-panel={screenKey} data-lab-chrome>
      <div className="flex items-center justify-between gap-3 px-4 py-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">Design system components used on this page</h2>
          <Badge variant="secondary">{count ?? "Not scanned"}</Badge>
        </div>
        <CollapsibleTrigger asChild>
          <Button type="button" variant="ghost" size="sm" aria-expanded={open} aria-controls={contentId}>
            {open ? "Hide" : "Show"}
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent id={contentId}>
        <div className="border-t border-border px-4 py-3">
          <DsUsedList screenKey={screenKey} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
