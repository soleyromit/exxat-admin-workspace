"use client"

/**
 * Invitation email, rendered as content only (nothing is sent; REQ section 14 puts delivery out of scope). One email to one
 * evaluator lists every open request, each with its own link (ledger D-L2); the subject names the student(s) and the count in
 * the first 40 characters; expiry is stated once (OD-18 open, sample date); a plain text version is a first-class fallback.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { PageHeader } from "@exxatdesignux/ui/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@exxatdesignux/ui/components/ui/tabs"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { useV2Hydrated, useV2State } from "@/lib/v2/react"
import { buildInvitation, EVALUATOR_ID, SEED_REQUEST_ID } from "@/lib/lab/evaluator"
import { EvLabControls } from "@/components/lab/evaluator/lab-controls"
import { useLabParams } from "@/components/lab/evaluator/use-evaluator"

const STATES = [
  { id: "all", label: "All open requests" },
  { id: "single", label: "One request" },
]

export function EvaluatorInvitationEmailA() {
  const s = useV2State()
  const hydrated = useV2Hydrated()
  const { get } = useLabParams()
  const single = get("state") === "single"
  const mail = React.useMemo(() => buildInvitation(s, EVALUATOR_ID, single ? SEED_REQUEST_ID : undefined), [s, single])
  return (
    <>
      <EvLabControls states={STATES} defaultState="all" showSample={false} options={[]} />
      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-4 px-4 py-5 sm:px-6">
        <PageHeader title="Invitation email" subtitle="What the evaluator receives. Nothing is sent." className="px-0 pt-0 pb-0 lg:px-0 lg:pt-0 lg:pb-0" />
        {!hydrated || !mail ? (
          <Skeleton className="h-96 w-full" />
        ) : (
          <Tabs defaultValue="html">
            <TabsList ariaLabel="Email format">
              <TabsTrigger value="html">Email</TabsTrigger>
              <TabsTrigger value="text">Plain text</TabsTrigger>
            </TabsList>
            <TabsContent value="html" className="pt-3">
              {/* The email is the artifact being previewed: its body is data (strategy/07 evaluator budget), framed and labelled. */}
              <Card size="sm" aria-label="Email preview" className="gap-0 py-0" data-artifact-preview>
                <CardHeader className="gap-1 border-b border-border py-3">
                  <Badge variant="secondary" className="w-fit">Email preview</Badge>
                  <CardTitle className="text-base">{mail.subject}</CardTitle>
                  <p className="text-xs break-all text-muted-foreground">{`From ${mail.from} · To ${mail.to}`}</p>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 py-4 text-sm text-foreground">
                  <p>{mail.greeting}</p>
                  <p>{mail.rows.length === 1 ? "A request is waiting for your sign-off." : `${mail.rows.length} requests are waiting for your sign-off. Each link opens one request.`}</p>
                  <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
                    {mail.rows.map((r) => (
                      <li key={r.requestId} className="flex flex-col gap-2 p-3">
                        <div>
                          <p className="font-medium">{r.student}</p>
                          <p className="text-xs text-muted-foreground">{`${r.course} · ${r.where}`}</p>
                        </div>
                        <ul className="flex list-disc flex-col gap-0.5 ps-5 text-sm marker:text-muted-foreground">
                          {r.skills.map((k) => (
                            <li key={k}>{k}</li>
                          ))}
                        </ul>
                        <Button asChild variant="outline" size="default" className="w-full min-h-(--control-height-touch) sm:w-fit">
                          <Link href="/lab/evaluator/evaluation-form">{`Open ${r.student.split(" ")[0]}'s request`}</Link>
                        </Button>
                      </li>
                    ))}
                  </ul>
                  <p className="text-muted-foreground">{`No account is needed. Links work until ${mail.expiresOn}.`}</p>
                  <p className="text-muted-foreground">Not the right person? Reply to tell the student, so they can send it to someone else.</p>
                  <p>{mail.from}</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="text" className="pt-3">
              <Card size="sm" aria-label="Email preview, plain text" data-artifact-preview>
                <CardContent>
                  <pre className="font-mono text-xs leading-5 whitespace-pre-wrap text-foreground">{`Subject: ${mail.subject}\n\n${mail.plainText}`}</pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </>
  )
}
