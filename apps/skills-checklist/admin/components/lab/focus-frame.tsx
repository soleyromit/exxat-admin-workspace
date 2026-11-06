"use client"

/**
 * The lab frame for a DS focus workflow (exxat-focus-workflow.mdc, focus-workflow-pattern.md): its own route, no primary or
 * secondary sidebar, no breadcrumbs. The brand canvas (bg-sidebar) holds one inset card (bg-background) that the workflow fills
 * with its PageHeader, rail, step and footer. The lab bar (lab tooling, never product) stays on top. First user: Set up skills
 * (D-L44, Proposed).
 */
import * as React from "react"
import { LabPageProvider, type LabPage } from "@/components/lab/lab-bar/page-context"
import { WalkthroughRow } from "@/components/lab/lab-bar/walkthrough-controls"

export function FocusFrame({ bar, page, children }: { bar?: React.ReactNode; page: LabPage; children: React.ReactNode }) {
  return (
    <LabPageProvider page={page}>
      <div className="flex min-h-dvh min-w-0 flex-col bg-sidebar" data-frame="focus">
        {bar ? <div className="sticky top-0 z-30 bg-sidebar">{bar}<WalkthroughRow /></div> : null}
        <main id="main" className="flex min-h-0 min-w-0 flex-1 flex-col p-2">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col rounded-xl bg-background">{children}</div>
        </main>
      </div>
    </LabPageProvider>
  )
}
