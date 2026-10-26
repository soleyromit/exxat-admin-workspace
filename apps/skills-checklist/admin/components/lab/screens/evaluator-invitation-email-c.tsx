"use client"

/**
 * Invitation C, the shortest form: one text message per request (one link per request, ledger D-L2), each kept to one 160
 * character segment, with the plain-text email beside it as the fallback when there is no phone number. Question: is a text that
 * names the student, the count and "no account needed" enough to start the form? Content only; delivery is out of scope (REQ
 * section 14), so this is a draft, not a channel decision.
 */
import * as React from "react"
import { PageHeader } from "@exxatdesignux/ui/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { useV2Hydrated, useV2State } from "@/lib/v2/react"
import { buildInvitation, smsDrafts, EVALUATOR_ID, SEED_REQUEST_ID, SMS_SEGMENT } from "@/lib/lab/evaluator"
import { EvLabControls } from "@/components/lab/evaluator/lab-controls"
import { useLabParams } from "@/components/lab/evaluator/use-evaluator"

const STATES = [
  { id: "all", label: "All open requests" },
  { id: "single", label: "One request" },
]

export function EvaluatorInvitationEmailC() {
  const s = useV2State()
  const hydrated = useV2Hydrated()
  const { get } = useLabParams()
  const single = get("state") === "single"
  const mail = React.useMemo(() => buildInvitation(s, EVALUATOR_ID, single ? SEED_REQUEST_ID : undefined), [s, single])
  const texts = React.useMemo(() => (mail ? smsDrafts(mail, s.program.school) : []), [mail, s.program.school])
  return (
    <>
      <EvLabControls states={STATES} defaultState="all" showSample={false} options={[]} />
      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-4 px-4 py-5 sm:px-6">
        <PageHeader title="Invitation email" subtitle="Text message per request, plain email as the fallback." className="px-0 pt-0 pb-0 lg:px-0 lg:pt-0 lg:pb-0" />
        {!hydrated || !mail ? (
          <Skeleton className="h-96 w-full" />
        ) : (
          <>
            <Card size="sm" data-region="sms" aria-label="Text message preview">
              <CardHeader className="pb-0">
                <CardTitle className="text-sm">{texts.length === 1 ? "Text message preview" : `Text message preview · ${texts.length} messages, one per request`}</CardTitle>
              </CardHeader>
              <CardContent>
                {/* The messages are the artifact being previewed: data, not interface prose (strategy/07 evaluator budget). */}
                <ul className="flex flex-col gap-3" data-artifact-preview>
                  {texts.map((t) => (
                    <li key={t.requestId} className="flex flex-col items-start gap-1.5">
                      <p className="max-w-[22rem] rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2.5 text-sm leading-5 break-words text-foreground">{t.text}</p>
                      <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="tabular-nums">{`${t.length} of ${SMS_SEGMENT} characters`}</span>
                        {t.segments > 1 ? <StatusBadge label={`${t.segments} messages`} tone="warning" icon="fa-triangle-exclamation" size="sm" /> : <StatusBadge label="1 message" tone="neutral" icon="fa-check" size="sm" />}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card size="sm" aria-label="Email preview, plain text" data-region="plain">
              <CardHeader className="pb-0">
                <CardTitle className="text-sm">Email preview, plain text</CardTitle>
              </CardHeader>
              <CardContent data-artifact-preview>
                <pre className="font-mono text-xs leading-5 whitespace-pre-wrap text-foreground">{`Subject: ${mail.subject}\n\n${mail.plainText}`}</pre>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  )
}
