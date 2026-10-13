"use client"

import * as React from "react"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { FieldError } from "@exxatdesignux/ui/components/ui/field"
import type { FormIssue } from "./issues"

/**
 * One titled card inside a wizard step (prototype P-08: a bordered card with a heading, a one-line description and an
 * optional action on the right, then the controls). The heading is an h3 under the dialog title (h2). When `disabledReason`
 * is set the controls are disabled through a native fieldset and the reason is text (SC-02: no model yet).
 */
export function Panel({
  id,
  title,
  description,
  action,
  disabledReason,
  children,
}: {
  id: string
  title: string
  description?: string
  action?: React.ReactNode
  disabledReason?: string | null
  children: React.ReactNode
}) {
  return (
    <Card id={id} size="sm" className="scroll-mt-4" aria-labelledby={`${id}-heading`}>
      <CardHeader>
        <CardTitle asChild className="text-sm font-semibold">
          <h3 id={`${id}-heading`}>{title}</h3>
        </CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        {action ? <CardAction>{action}</CardAction> : null}
      </CardHeader>
      <CardContent>
        {disabledReason ? (
          <p className="mb-3 text-sm text-muted-foreground" data-testid={`${id}-reason`}>
            {disabledReason}
          </p>
        ) : null}
        <fieldset disabled={!!disabledReason} className="m-0 flex min-w-0 flex-col gap-4 border-0 p-0">
          {children}
        </fieldset>
      </CardContent>
    </Card>
  )
}

/**
 * Inline errors under a control. Always text; the control carries aria-invalid and aria-describedby (`for` = the
 * control id, so the id here is `${for}-err`). The DS FieldError defaults to role="alert"; it is switched off here
 * because P-02 allows ONE assertive announcement on Save (the summary banner), not one per field.
 */
export function Errors({ issues, for: forId }: { issues: FormIssue[]; for?: string }) {
  if (issues.length === 0) return null
  return (
    <div id={forId ? `${forId}-err` : undefined} className="flex flex-col gap-0.5">
      {issues.map((i) => (
        <FieldError key={i.key} role={undefined}>
          {i.message}
        </FieldError>
      ))}
    </div>
  )
}

/** aria-describedby value for a control whose errors render with `<Errors for={id} />`. */
export const describedBy = (issues: FormIssue[], id: string): string | undefined => (issues.length > 0 ? `${id}-err` : undefined)
