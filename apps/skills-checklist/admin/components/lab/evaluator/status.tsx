"use client"

/**
 * The evaluator's non-form outcomes: receipt (EV-07), expired link, not for you, forwarded check, already completed.
 * One message, one way out, no form content shown to someone who may not be the evaluator (per-request privacy, D-L2).
 * Link lifetime is OD-18 (open): the date is a lab sample.
 */
import { skillNoun } from "@/lib/lab/terms"
import * as React from "react"
import { PageHeader } from "@exxatdesignux/ui/components/ui/page-header"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import type { EvRequest, ReceiptLine } from "@/lib/lab/evaluator"

const HEADER = "px-0 pt-0 pb-0 lg:px-0 lg:pt-0 lg:pb-0"
const TONE: Record<ReceiptLine["status"], "neutral" | "warning"> = { counts: "neutral", waits: "warning", queued: "neutral", feedback: "neutral" }

export function Receipt({ req, lines, offline }: { req: EvRequest; lines: ReceiptLine[]; offline: boolean }) {
  const waits = lines.filter((l) => l.status === "waits").length
  return (
    <div className="flex flex-col gap-4" data-ev-receipt>
      {/* The student's name is the one fact the receipt needs above the list; the list carries the skills (anatomy, 2026-10-30). */}
      <PageHeader title={offline ? "Saved on this phone" : `Submitted for ${req.student.name}`} subtitle={offline ? req.student.name : undefined} className={HEADER} />
      <Card size="sm" data-region="receipt">
        <CardContent>
          {/* The signed skills and answers: the record, as data. */}
          <ul className="flex flex-col divide-y divide-border" data-viz-label>
            {lines.map((l) => (
              <li key={l.skillId} className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{l.name}</p>
                  <p className="text-sm text-muted-foreground">{l.answer}</p>
                </div>
                <StatusBadge label={l.word} tone={TONE[l.status]} icon={l.icon} size="md" />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <p className="text-sm text-muted-foreground">
        {offline ? "It sends when you reconnect. Keep this page open." : !req.onRecord ? "Counts once the program confirms you. It cannot be changed now." : waits ? "Counts after program approval. It cannot be changed now." : "It cannot be changed now. Other requests are in your email."}
      </p>
      <div>
        <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>Print a copy</Button>
      </div>
    </div>
  )
}

function Message({ title, badge, children, actions }: { title: string; badge?: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 pt-2">
      <PageHeader title={title} className={HEADER} />
      <Card size="sm" data-region="message">
        <CardContent className="flex flex-col gap-3">
          {badge ? <Badge variant="outline" className="w-fit">{badge}</Badge> : null}
          <div className="text-sm text-foreground">{children}</div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </CardContent>
      </Card>
    </div>
  )
}

const mailto = (req: EvRequest) => `mailto:?subject=${encodeURIComponent(`Please resend your ${skillNoun()} request, ${req.student.first}`)}`

export function Expired({ req }: { req: EvRequest }) {
  return (
    <Message title="This link is no longer active" badge={`Expired ${req.expiresOn}`} actions={<Button asChild variant="outline" size="default"><a href={mailto(req)}>{`Ask ${req.student.first} to resend`}</a></Button>}>
      Ask {req.student.name} to send the request again.
    </Message>
  )
}

export function NotForYou({ req }: { req: EvRequest }) {
  return (
    <Message title={`This request is for ${req.evaluator.name}`} actions={<Button asChild variant="outline" size="default"><a href={mailto(req)}>{`Tell ${req.student.first}`}</a></Button>}>
      Please let {req.student.first} know, so it goes to the right person.
    </Message>
  )
}

export function Forwarded({ req, onAnswer }: { req: EvRequest; onAnswer: (me: boolean) => void }) {
  return (
    <Message
      title="Is this for you?"
      actions={
        <>
          <Button type="button" variant="default" size="default" className="min-h-(--control-height-touch) max-sm:w-full" onClick={() => onAnswer(true)}>{`Yes, I am ${req.evaluator.name.split(",")[0]}`}</Button>
          <Button type="button" variant="outline" size="default" className="min-h-(--control-height-touch) max-sm:w-full" onClick={() => onAnswer(false)}>No, someone else</Button>
        </>
      }
    >
      {req.student.name} sent this to {req.evaluator.name}.
    </Message>
  )
}

export function Completed({ req }: { req: EvRequest }) {
  return (
    <Message title="Already signed off" badge={`Completed ${req.sentOn}`}>
      {req.evaluator.name} signed this request. A completed evaluation cannot be changed.
    </Message>
  )
}
