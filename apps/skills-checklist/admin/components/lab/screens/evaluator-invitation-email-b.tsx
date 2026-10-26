"use client"

/**
 * Invitation email B, as the inbox shows it. Before anyone opens the email, a phone inbox shows the sender, about 40 characters of
 * the subject and 40 of the body. This variant renders that row for each real case in the data (one request, every open request)
 * and marks the cut, then the opened email as compact rows, one button per request (ledger D-L2). Question: can a preceptor tell
 * who and how many without opening it? Content only; nothing is sent (REQ section 14). Expiry is OD-18 (open), a sample date.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { PageHeader } from "@exxatdesignux/ui/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { useV2Hydrated, useV2State } from "@/lib/v2/react"
import { buildInvitation, inboxPreview, EVALUATOR_ID, PREVIEW_CHARS, SEED_REQUEST_ID, type Invitation } from "@/lib/lab/evaluator"
import { EvLabControls } from "@/components/lab/evaluator/lab-controls"
import { useLabParams } from "@/components/lab/evaluator/use-evaluator"
import { skillsWord } from "@/components/lab/evaluator/fields"

const STATES = [
  { id: "all", label: "All open requests" },
  { id: "single", label: "One request" },
]

function InboxRow({ mail, label }: { mail: Invitation; label: string }) {
  const p = inboxPreview(mail)
  const cut = (full: string, shown: string) => (
    <>
      <span className="text-foreground">{shown}</span>
      {full.length > shown.length ? <span className="text-muted-foreground/60" aria-hidden="true">{full.slice(shown.length)}</span> : null}
    </>
  )
  return (
    <li className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="rounded-md border border-border p-3" data-artifact-preview>
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate text-sm font-semibold text-foreground">{p.sender}</p>
          <span className="shrink-0 text-xs text-muted-foreground">9:41</span>
        </div>
        <p className="text-sm font-medium break-words">{cut(p.subject, p.subjectVisible)}</p>
        <p className="text-sm text-muted-foreground">{p.preheader}</p>
      </div>
      <span className="sr-only">{`Visible subject: ${p.subjectVisible}. Visible preview: ${p.preheader}.`}</span>
    </li>
  )
}

export function EvaluatorInvitationEmailB() {
  const s = useV2State()
  const hydrated = useV2Hydrated()
  const { get } = useLabParams()
  const single = get("state") === "single"
  const all = React.useMemo(() => buildInvitation(s, EVALUATOR_ID), [s])
  const one = React.useMemo(() => buildInvitation(s, EVALUATOR_ID, SEED_REQUEST_ID), [s])
  const mail = single ? one : all
  return (
    <>
      <EvLabControls states={STATES} defaultState="all" showSample={false} options={[]} />
      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-4 px-4 py-5 sm:px-6">
        <PageHeader title="Invitation email" subtitle={`Before and after opening. First ${PREVIEW_CHARS} characters in ink.`} className="px-0 pt-0 pb-0 lg:px-0 lg:pt-0 lg:pb-0" />
        {!hydrated || !mail || !all || !one ? (
          <Skeleton className="h-96 w-full" />
        ) : (
          <>
            <Card size="sm" data-region="inbox">
              <CardHeader className="pb-0">
                <CardTitle className="text-sm">Inbox preview</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col divide-y divide-border">
                  <InboxRow mail={one} label="One request" />
                  {all.rows.length > 1 ? <InboxRow mail={all} label={`Every open request (${all.rows.length})`} /> : null}
                </ul>
              </CardContent>
            </Card>
            <Card size="sm" aria-label="Email preview, opened" data-region="opened" data-artifact-preview>
              <CardHeader className="gap-1 pb-0">
                <Badge variant="secondary" className="w-fit">Email preview</Badge>
                <CardTitle className="text-base">{mail.subject}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                <p>{mail.greeting}</p>
                <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
                  {mail.rows.map((r) => (
                    <li key={r.requestId} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">{r.student}</p>
                        <p className="text-xs text-muted-foreground">{`${skillsWord(r.skills.length)} · ${r.course}`}</p>
                      </div>
                      <Button asChild variant="outline" size="default" className="min-h-(--control-height-touch) w-full shrink-0 sm:w-fit">
                        <Link href="/lab/evaluator/evaluation-form" aria-label={`Open ${r.student}'s request`}>Open</Link>
                      </Button>
                    </li>
                  ))}
                </ul>
                <p className="text-muted-foreground">{`No account needed. Links work until ${mail.expiresOn}.`}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  )
}
