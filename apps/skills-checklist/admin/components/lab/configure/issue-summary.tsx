"use client"

import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { SECTIONS, type RuleIssue } from "@/lib/lab/configure"

const sectionLabel = (id: RuleIssue["section"]) => SECTIONS.find((s) => s.id === id)?.label ?? ""

/**
 * Error summary across steps (Check and publish). Each entry names its step and, when pressed, opens that step and focuses the
 * field [REQ SC-18; layout rule L9]. Within one step or one page, use the shared ValidationSummary instead.
 */
export function IssueSummary({ issues, onGo, id = "cfg-issues" }: { issues: RuleIssue[]; onGo: (i: RuleIssue) => void; id?: string }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const key = issues.map((i) => i.id).join("|")
  React.useEffect(() => {
    if (key) ref.current?.focus()
  }, [key])
  if (issues.length === 0) return null
  return (
    <div ref={ref} id={id} tabIndex={-1} className="outline-none" data-region="validation-summary">
      <LocalBanner variant="error" title={`Fix ${issues.length} ${issues.length === 1 ? "problem" : "problems"} to publish`}>
        <ul className="flex flex-col gap-1" aria-label="Problems to fix">
          {issues.map((i) => (
            <li key={i.id}>
              <Button type="button" variant="link" size="xs" className="h-auto whitespace-normal p-0 text-start" onClick={() => onGo(i)}>
                {`${sectionLabel(i.section)}: ${i.message}`}
              </Button>
            </li>
          ))}
        </ul>
      </LocalBanner>
    </div>
  )
}
