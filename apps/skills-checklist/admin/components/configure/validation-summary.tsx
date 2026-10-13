"use client"

import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import * as C from "@/lib/copy"
import { SECTIONS, type FormIssue } from "./issues"

/**
 * P-02: the summary that appears when Save is pressed with errors. A LocalBanner (role alert), so it is announced once
 * when it renders; each item is a link-styled button that moves focus to the field. Grouped by section, in page order.
 */
export function ValidationSummary({ issues, onJump }: { issues: FormIssue[]; onJump: (target: string) => void }) {
  const ref = React.useRef<HTMLDivElement>(null)
  if (issues.length === 0) return null
  const groups = SECTIONS.map((s) => ({ s, items: issues.filter((i) => i.section === s.key) })).filter((g) => g.items.length > 0)
  return (
    <div ref={ref} id="cfg-summary" tabIndex={-1} className="outline-none">
      <LocalBanner variant="error" title={C.surface.s09.saveBlocked(issues.length)}>
        <ul className="flex flex-col gap-1">
          {groups.map((g) => (
            <li key={g.s.key} className="flex flex-col">
              <span className="text-sm font-medium">{g.s.title}</span>
              <ul className="flex flex-col">
                {g.items.map((i) => (
                  <li key={i.key}>
                    <Button type="button" variant="link" size="sm" className="h-auto justify-start whitespace-normal p-0 text-left" onClick={() => onJump(i.target)}>
                      {i.message}
                    </Button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </LocalBanner>
    </div>
  )
}
