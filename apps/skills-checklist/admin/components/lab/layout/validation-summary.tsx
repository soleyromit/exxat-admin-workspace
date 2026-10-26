"use client"

// Shared layout primitive: the one error summary a wizard step or form shows after a failed attempt to continue (rule L9).
// Pass it to WizardPage `banner` or FormPage `banner`. It takes focus when it appears; each entry focuses its field.

import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"

export type ValidationIssue = {
  /** id of the field element to focus */
  fieldId: string
  /** what to fix, in the user's terms, for example "Add a skill name" */
  message: string
}

export type ValidationSummaryProps = {
  issues: ValidationIssue[]
  /** Banner title. Defaults to "Fix these to continue". */
  title?: string
  /** Move focus to the summary when it mounts or the issue list changes. Defaults to true. */
  autoFocus?: boolean
}

export function ValidationSummary({ issues, title = "Fix these to continue", autoFocus = true }: ValidationSummaryProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const key = issues.map((i) => i.fieldId).join("|")

  React.useEffect(() => {
    if (autoFocus && key) ref.current?.focus()
  }, [autoFocus, key])

  if (issues.length === 0) return null

  return (
    <div ref={ref} tabIndex={-1} data-region="validation-summary" className="outline-none">
      <LocalBanner variant="error" title={title}>
        <ul className="flex flex-col gap-1">
          {issues.map((issue) => (
            <li key={issue.fieldId}>
              <Button
                type="button"
                variant="link"
                size="xs"
                className="h-auto p-0 text-start"
                onClick={() => document.getElementById(issue.fieldId)?.focus()}
              >
                {issue.message}
              </Button>
            </li>
          ))}
        </ul>
      </LocalBanner>
    </div>
  )
}
