"use client"

/**
 * The two lab frames that have no sidebar: the light frame (evaluator and lab instructor, who have no account) and the /lab
 * index frame. Each owns the page's single main landmark. They live apart from lab-frame.tsx because the staff frame there uses
 * the DS sidebar inset, which already renders the main landmark; keeping the no-sidebar frames here means no file mixes the two.
 */
import * as React from "react"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { PersonaSwitcher } from "@/components/lab/lab-bar/persona-switcher"
import { usePresent } from "@/components/lab/lab-bar/present"

export function LightFrame({ bar, children }: { bar?: React.ReactNode; children: React.ReactNode }) {
  // Evaluators and lab instructors have no account, so no app chrome: only the lab bar (lab only). Each evaluator screen
  // draws its own light header (program name, "No account needed"), so the frame adds none; a frame header here was an
  // extra region on every evaluator page.
  return (
    <div className="flex min-h-dvh min-w-0 flex-col bg-background">
      {bar ? <div className="sticky top-0 z-20">{bar}</div> : null}
      <main id="main" className="mx-auto flex w-full min-w-0 max-w-3xl flex-1 flex-col">{children}</main>
    </div>
  )
}

function IndexHeader() {
  const { present } = usePresent()
  return (
    <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-2 sm:px-6" data-lab-chrome>
      <div className="flex items-center gap-3">
        <p className="text-sm font-semibold text-foreground">Prism</p>
        {present ? null : <Badge variant="secondary">Design lab</Badge>}
      </div>
      {present ? null : <PersonaSwitcher />}
    </header>
  )
}

/** Frame for /lab: a plain header and a wide column, no persona and no sidebar. */
export function LabIndexFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <React.Suspense fallback={null}>
        <IndexHeader />
      </React.Suspense>
      <main id="main" className="flex flex-1 flex-col">{children}</main>
    </div>
  )
}
