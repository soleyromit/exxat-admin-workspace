"use client"

/** Chrome shared by both evaluator directory variants: header (Add an evaluator), summary line, demo states, dialogs and banners. */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { PageFrame } from "@/components/skills/page-header"
import { directory, type DirectorySummary, type EvaluatorRow } from "@/lib/lab/evaluators"
import type { V2State } from "@/lib/v2/types"
import { ErrorState, LoadingState, type Opt } from "./parts"
import { EmptyBlock } from "@/components/lab/empty-block"
import { SampleDataBadge } from "@/components/lab/import/sample-badge"
import { AddEvaluatorDialog, DirectorySummaryLine, useAdoptDialog } from "./evaluator-parts"
import { useAdminData, type AdminData } from "./use-admin-data"

export interface DirectoryContext extends AdminData {
  state: V2State
  rows: EvaluatorRow[]
  summary: DirectorySummary
  sites: Opt[]
  openAdopt: (r: EvaluatorRow) => void
  /** The program summary line; variants that set summaryInToolbar place it themselves (site-first B puts it in its toolbar). */
  summaryLine: React.ReactNode
}

export function EvaluatorFrame({ variant, summaryInToolbar = false, children }: { variant: string; summaryInToolbar?: boolean; children: (c: DirectoryContext) => React.ReactNode }) {
  const data = useAdminData()
  const adopt = useAdoptDialog(data.state)
  const [adding, setAdding] = React.useState(false)
  const [added, setAdded] = React.useState<string | null>(null)
  const dir = React.useMemo(() => (data.state ? directory(data.state) : null), [data.state])
  const sites = React.useMemo<Opt[]>(() => (data.state?.sites ?? []).filter((s) => dir?.rows.some((r) => r.siteId === s.id)).map((s) => ({ value: s.id, label: `${s.facility}, ${s.unit}` })).sort((a, b) => a.label.localeCompare(b.label)), [data.state, dir])

  const summaryLine = dir ? <DirectorySummaryLine summary={dir.summary} onAwaiting={() => data.query.set({ filter: "unverified", site: null, role: null, q: null })} /> : null
  let body: React.ReactNode
  if (!data.ready || !data.state || !dir) body = <LoadingState label="Loading evaluators" />
  else if (data.demo === "error") body = <ErrorState what="The evaluator directory" onRetry={data.retry} />
  else if (data.demo === "empty")
    body = (
      <EmptyBlock
        title="No evaluators yet"
        body="Evaluators appear when you add them or when a student names one in a submission. They need no account."
        action={{ label: "Add an evaluator" }}
        onAction={() => setAdding(true)}
      />
    )
  else
    body = (
      <>
        {summaryInToolbar ? null : summaryLine}
        {children({ ...data, state: data.state, rows: dir.rows, summary: dir.summary, sites, openAdopt: adopt.open, summaryLine })}
      </>
    )

  return (
    <PageFrame title="Evaluators" actions={<><SampleDataBadge /><Button type="button" variant="default" size="sm" onClick={() => setAdding(true)}>Add an evaluator</Button></>}>
      <div className="flex flex-col gap-4" data-page-type="list" data-admin-lab={`evaluator-directory-${variant}`}>
        {adopt.banner}
        {added ? (
          <div role="status" aria-live="polite">
            <LocalBanner variant="promo" title={`${added} added`} dismissible onDismiss={() => setAdded(null)}>
              Students can now choose them, and requests go to their email.
            </LocalBanner>
          </div>
        ) : null}
        {body}
      </div>
      {adopt.dialog}
      <AddEvaluatorDialog open={adding} onOpenChange={setAdding} existing={dir?.rows ?? []} onAdded={setAdded} sites={sites} />
    </PageFrame>
  )
}
