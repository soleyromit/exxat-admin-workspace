"use client"

import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent, CardHeader } from "@exxatdesignux/ui/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@exxatdesignux/ui/components/ui/collapsible"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { Textarea } from "@exxatdesignux/ui/components/ui/textarea"
import { FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import type { ReviewItem } from "@/lib/store"
import { protoReview as pr } from "@/lib/copy"
import { outcomeOf } from "./agreement-compare-card"
import { ResponsesList } from "./responses-list"

export type Decision = "approved" | "returned"
export type Pending = "approve" | "return" | null

const day = (iso: string) => iso.slice(0, 10)

export interface ReviewCardProps {
  item: ReviewItem
  /** Course code shown in the meta line (prototype: "NURS 350"). */
  code: string
  note: string
  onNote: (v: string) => void
  /** Which decision is in flight on this card, if any. Every decision button on the page is disabled while any is. */
  pending: Pending
  busy: boolean
  failed: boolean
  /** The card a deep link /review/{id} points at. */
  current?: boolean
  onDecide: (decision: Decision) => void
}

/**
 * One evaluation awaiting approval (P-10): heading, meta, Qualifies badge, supplied fields, the evaluator's block beside the
 * student's self-evaluation, the agreement sentence, the full responses, the review note, and the decision. Both decisions are
 * on every card (prototype); Approve is the filled button, Return is outline (conflict C-5, an exception to one primary per
 * surface). Not optimistic: the card leaves the queue only when the store accepts the decision (AR-06).
 */
export const ReviewCard = React.forwardRef<HTMLHeadingElement, ReviewCardProps>(function ReviewCard({ item, code, note, onNote, pending, busy, failed, current, onDecide }, headingRef) {
  const idBase = `rv-${item.evaluationId}`
  const meta =
    item.performedIn === "lab"
      ? pr.metaLab(code, day(item.completedAt), item.evaluatorName, item.evaluatorRole)
      : pr.metaClinical(code, item.settingName ?? "", item.locationName ?? "", day(item.completedAt), item.evaluatorName, item.evaluatorRole)
  const hasSelf = item.agree !== null && item.selfEvaluation !== null

  return (
    <article aria-labelledby={`${idBase}-title`} aria-current={current ? "true" : undefined} data-review-card={item.submissionId}>
      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-border px-4 py-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <h2 id={`${idBase}-title`} ref={headingRef} tabIndex={-1} className="text-sm font-semibold text-foreground outline-none">
              {pr.cardTitle(item.studentName, item.skillName)}
            </h2>
            <p className="text-xs text-muted-foreground">{meta}</p>
          </div>
          <StatusBadge label={item.qualifies ? pr.qualifies : pr.doesNotQualify} tone={item.qualifies ? "success" : "warning"} size="sm" />
        </CardHeader>

        <CardContent className="flex flex-col gap-3 px-4 py-3">
          {failed ? <LocalBanner variant="error">{pr.notSaved}</LocalBanner> : null}

          <dl className="flex flex-wrap gap-x-4 gap-y-1 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs">
            {item.values.map((v) => (
              <div key={v.label} className="flex gap-1">
                <dt className="font-medium text-muted-foreground">{v.label}:</dt>{" "}
                <dd className="text-foreground">{String(v.value)}</dd>
              </div>
            ))}
            {item.studentNote ? (
              <div className="flex gap-1">
                <dt className="font-medium text-muted-foreground">{pr.studentNotes}:</dt>{" "}
                <dd className="text-foreground">{item.studentNote}</dd>
              </div>
            ) : null}
          </dl>

          <div className={`grid gap-4 ${hasSelf ? "sm:grid-cols-[2fr_1fr]" : ""}`}>
            <div role="group" aria-label={item.evaluatorRole} className="flex flex-col gap-1 rounded-md border border-border px-3 py-2.5">
              <h3 className="text-xs font-semibold text-muted-foreground">{item.evaluatorRole}</h3>
              <p className="text-sm text-foreground">{item.evaluator ? outcomeOf(item.evaluator) : "—"}</p>
              {item.comment ? <p className="text-xs italic text-muted-foreground">{item.comment}</p> : null}
            </div>
            {hasSelf ? (
              <div role="group" aria-label={pr.studentSelf} className="flex flex-col gap-1 rounded-md border border-border bg-muted/40 px-3 py-2.5">
                <h3 className="text-xs font-semibold text-muted-foreground">{pr.studentSelf}</h3>
                <p className="text-sm text-foreground">{outcomeOf(item.selfEvaluation!)}</p>
              </div>
            ) : null}
          </div>

          <p className="text-xs text-muted-foreground">{hasSelf ? (item.agree ? pr.agreeSame(item.evaluatorRole) : pr.agreeDiffer(item.evaluatorRole)) : pr.evaluatorOnly(item.evaluatorRole)}</p>

          <Collapsible className="rounded-md border border-border">
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="group w-full justify-start gap-2 rounded-md text-xs font-medium">
                <i className="fa-light fa-chevron-right text-[10px] transition-transform group-data-[state=open]:rotate-90" aria-hidden="true" />
                {pr.expand}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-3 pb-3">
              <ResponsesList self={item.selfEvaluation} evaluator={item.evaluator} evaluatorRole={item.evaluatorRole} />
            </CollapsibleContent>
          </Collapsible>

          <div className="flex flex-col gap-1">
            <FieldLabel htmlFor={`${idBase}-note`} className="text-xs font-semibold text-muted-foreground">
              {pr.noteLabel}
            </FieldLabel>
            <Textarea id={`${idBase}-note`} value={note} onChange={(e) => onNote(e.target.value)} rows={2} disabled={busy} aria-describedby={`${idBase}-note-help`} />
            <p id={`${idBase}-note-help`} className="text-xs text-muted-foreground">
              {pr.noteHelper}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2">
            <span role="status" aria-live="polite" className="mr-auto text-xs text-muted-foreground">
              {pending === "approve" ? pr.approving : pending === "return" ? pr.returning : ""}
            </span>
            <Button type="button" variant="outline" size="default" disabled={busy} aria-busy={pending === "return"} onClick={() => onDecide("returned")}>
              {pr.returnLabel}
            </Button>
            <Button type="button" variant="default" size="default" disabled={busy} aria-busy={pending === "approve"} onClick={() => onDecide("approved")}>
              <i className="fa-light fa-check" aria-hidden="true" />
              {pr.approve}
            </Button>
          </div>
        </CardContent>
      </Card>
    </article>
  )
})
