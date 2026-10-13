"use client"

import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { evaluatorCopy as c, heldOrCounts } from "@/lib/copy"
import { preceptor } from "@/lib/copy/r5-student-preceptor"

/** C-6 [PROTO]: the post-submit "Skill / Recorded / Qualifies? / Progress / Status" table. Demo page only (flag evaluatorSeesProgress, OD-17 open). */
export interface ProgressRow {
  skillName: string
  recorded: string
  qualifies: boolean
  progress: string
  status: React.ReactNode
}

export interface ConfirmationEntry {
  skillName: string
  countsNow: boolean
}

/**
 * EV-07: after submit, each skill says whether it counts now or is held for administrator approval. Nothing about the
 * student's resulting status, progress or counts (OD-17 default, DEFECT-05).
 */
export function Confirmation({ studentName, entries, progress, onBack }: { studentName: string; entries: ConfirmationEntry[]; progress?: ProgressRow[]; onBack?: () => void }) {
  const h1 = React.useRef<HTMLHeadingElement>(null) as React.RefObject<HTMLHeadingElement & HTMLElement>
  React.useEffect(() => h1.current?.focus(), [])
  // Embedded in the shell page (onBack given) the page already has its h1, so this heading is an h2. Prototype wording on the demo page.
  const Heading = onBack ? "h2" : "h1"
  const heading = onBack && progress ? preceptor.result.heading(entries.length, studentName) : c.resultHeading(studentName, entries.length)
  return (
    <div role="status" className="flex flex-col gap-4" data-testid="confirmation">
      <Heading ref={h1} tabIndex={-1} className={onBack ? "text-xl font-semibold text-foreground" : "text-2xl font-semibold text-foreground"}>
        {heading}
      </Heading>
      {progress ? (
        <table className="w-full border-collapse text-sm" data-testid="progress-table">
          <caption className="sr-only">{preceptor.result.heading(entries.length, studentName)}</caption>
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th scope="col" className="py-2 pr-3 font-medium">{preceptor.result.cols.skill}</th>
              <th scope="col" className="py-2 pr-3 font-medium">{preceptor.result.cols.recorded}</th>
              <th scope="col" className="py-2 pr-3 font-medium">{preceptor.result.cols.qualifies}</th>
              <th scope="col" className="py-2 pr-3 font-medium">{preceptor.result.cols.progress}</th>
              <th scope="col" className="py-2 font-medium">{preceptor.result.cols.status}</th>
            </tr>
          </thead>
          <tbody>
            {progress.map((r) => (
              <tr key={r.skillName} className="border-b border-border last:border-b-0">
                <th scope="row" className="py-2 pr-3 text-left font-medium text-foreground">{r.skillName}</th>
                <td className="py-2 pr-3 text-foreground">{r.recorded}</td>
                <td className="py-2 pr-3 text-foreground">{r.qualifies ? preceptor.result.qualifies : preceptor.result.doesNot}</td>
                <td className="py-2 pr-3 text-foreground">{r.progress}</td>
                <td className="py-2 text-foreground">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      <ul className="flex flex-col gap-2">
        {entries.map((e) => (
          <li key={e.skillName} className="text-sm text-foreground">
            {e.countsNow ? heldOrCounts.afterSubmit.countsNow(e.skillName) : heldOrCounts.afterSubmit.held(e.skillName)}
          </li>
        ))}
      </ul>
      {onBack ? (
        <div>
          <Button type="button" variant="outline" size="sm" className="min-h-11" onClick={onBack}>
            {preceptor.form.back}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
