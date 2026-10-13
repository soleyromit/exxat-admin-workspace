"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import type { Db } from "@/lib/domain/types"
import type { Result } from "@/lib/store"
import { reviewQueue, skillProgress } from "@/lib/store"
import { buttons, protoReview as pr, surface } from "@/lib/copy"
import { ROUTES } from "@/lib/skills-routes"
import { EmptyState } from "@/components/skills"
import { PageBody } from "@/components/mapping/page-body"
import { ReviewCard, type Decision, type Pending } from "./review-card"

export type { Decision, Pending }

export interface DecisionInput {
  evaluationId: string
  decision: Decision
  note: string
}

export interface ReviewViewProps {
  db: Db
  status?: "ready" | "loading" | "error"
  onRetry?: () => void
  /** A deep link /review/{submissionId}: that card is marked current and scrolled into view. */
  currentSubmissionId?: string | null
  /** Commits the decision. Not optimistic: the queue changes only when this resolves ok (AR-06). */
  onDecide: (input: DecisionInput) => Result<{ reviewId: string }> | Promise<Result<{ reviewId: string }>>
  /** Called after a decision was saved so a deep link can return to the plain queue. */
  onSettled?: () => void
}

type Notice = { variant: "success" | "info"; text: string } | null

/** Why a deep-linked submission is not in the queue: already decided, or it never waited for approval (RV-03, RV-05). */
function whyNotInQueue(db: Db, submissionId: string): { message: string; note?: string } {
  const evalIds = new Set(db.evaluations.filter((e) => e.submissionId === submissionId).map((e) => e.id))
  const decided = [...db.reviews].reverse().find((r) => evalIds.has(r.evaluationId))
  if (decided) return { message: pr.alreadyDecided(decided.decision), note: decided.note || undefined }
  return { message: pr.notWaiting }
}

function QueueSkeleton() {
  return (
    <div aria-busy="true" role="status" aria-label="Loading the review queue" className="flex flex-col gap-4">
      <span className="sr-only">Loading the review queue</span>
      {[0, 1].map((i) => (
        <Skeleton key={i} className="h-72 w-full" />
      ))}
    </div>
  )
}

/**
 * S-11 / P-10: a vertical list of cards, one per evaluation (the prototype's layout, not a table). The banner above the
 * list is the prototype's; after a decision a banner says what happened. One decision at a time (double-decision guard,
 * AR-05); OD-16 is OPEN so the copy never says who corrects a returned evaluation.
 */
export function ReviewView({ db, status = "ready", onRetry, currentSubmissionId, onDecide, onSettled }: ReviewViewProps) {
  const items = React.useMemo(() => reviewQueue(db), [db])
  const [notice, setNotice] = React.useState<Notice>(null)
  const [pending, setPending] = React.useState<{ id: string; kind: Pending } | null>(null)
  const [failedId, setFailedId] = React.useState<string | null>(null)
  const [notes, setNotes] = React.useState<Record<string, string>>({})
  const inFlight = React.useRef(false)
  const headings = React.useRef(new Map<string, HTMLHeadingElement>())
  const pageRef = React.useRef<HTMLDivElement>(null)

  const codeOf = (submissionId: string): string => {
    const sub = db.submissions.find((s) => s.id === submissionId)
    return db.offerings.find((o) => o.id === sub?.offeringId)?.code ?? ""
  }

  React.useEffect(() => {
    if (!currentSubmissionId || status !== "ready") return
    document.querySelector(`[data-review-card="${CSS.escape(currentSubmissionId)}"]`)?.scrollIntoView?.({ block: "start" })
  }, [currentSubmissionId, status, items.length])

  const blocked = currentSubmissionId && status === "ready" && !items.some((i) => i.submissionId === currentSubmissionId) ? whyNotInQueue(db, currentSubmissionId) : null

  const decide = async (itemId: string, decision: Decision) => {
    const item = items.find((i) => i.evaluationId === itemId)
    if (!item || inFlight.current) return // double-decision guard (AR-05)
    inFlight.current = true
    setPending({ id: itemId, kind: decision === "approved" ? "approve" : "return" })
    setFailedId(null)
    try {
      await Promise.resolve()
      const idx = items.findIndex((i) => i.evaluationId === itemId)
      const next = items[idx + 1] ?? items[idx - 1]
      const r = await onDecide({ evaluationId: item.evaluationId, decision, note: (notes[item.evaluationId] ?? "").trim() })
      if (r.ok) {
        // AE-01: show the effect of the approval on the student's record, derived from the db the decision produced.
        const prog = decision === "approved" ? skillProgress(r.db, item.studentId, item.skillId) : null
        const effect = prog ? ` ${surface.s11.approvedEffect(prog.total.have, prog.total.needed, prog.total.noun)}` : ""
        setNotice(decision === "approved" ? { variant: "success", text: `${pr.approved(item.skillName, item.studentName)}${effect}` } : { variant: "info", text: pr.returned(item.skillName, item.studentName) })
        setNotes((n) => Object.fromEntries(Object.entries(n).filter(([k]) => k !== itemId)))
        // Focus moves to the next waiting card's heading (never to a decision button, so a stray Enter cannot decide).
        window.setTimeout(() => (next ? headings.current.get(next.evaluationId) : pageRef.current)?.focus(), 60)
        onSettled?.()
      } else {
        setFailedId(itemId)
      }
    } catch {
      setFailedId(itemId)
    } finally {
      inFlight.current = false
      setPending(null)
    }
  }

  return (
    <PageBody title={pr.title} subtitle={pr.subtitle}>
      <div ref={pageRef} tabIndex={-1} className="outline-none" />
      <div aria-live="polite" className="flex flex-col gap-2 empty:hidden">
        {notice ? (
          <LocalBanner variant={notice.variant} action={{ label: pr.dismiss, onClick: () => setNotice(null) }}>
            {notice.text}
          </LocalBanner>
        ) : null}
      </div>
      <LocalBanner variant="info">{pr.banner}</LocalBanner>

      {blocked ? (
        <LocalBanner variant="info">
          {blocked.message}
          {blocked.note ? ` ${pr.noteLabel}: ${blocked.note}` : ""}
        </LocalBanner>
      ) : null}

      {status === "error" ? (
        <LocalBanner variant="error" retry={onRetry ? { label: buttons.retry, onClick: onRetry } : undefined}>
          {pr.error}
        </LocalBanner>
      ) : status === "loading" ? (
        <QueueSkeleton />
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-4">
            <EmptyState
              icon="fa-clipboard-check"
              title={pr.emptyTitle}
              description={pr.emptyBody}
              align="center"
              footer={
                <Button asChild variant="outline" size="sm">
                  <Link href={ROUTES.skills}>{pr.emptyAction}</Link>
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <p role="status" className="sr-only">
            {pr.waiting(items.length)}
          </p>
          <ul aria-label={pr.title} className="flex flex-col gap-4">
            {items.map((item) => (
              <li key={item.evaluationId}>
                <ReviewCard
                  ref={(el) => {
                    if (el) headings.current.set(item.evaluationId, el)
                    else headings.current.delete(item.evaluationId)
                  }}
                  item={item}
                  code={codeOf(item.submissionId)}
                  note={notes[item.evaluationId] ?? ""}
                  onNote={(v) => setNotes((n) => ({ ...n, [item.evaluationId]: v }))}
                  pending={pending?.id === item.evaluationId ? pending.kind : null}
                  busy={pending !== null}
                  failed={failedId === item.evaluationId}
                  current={currentSubmissionId === item.submissionId}
                  onDecide={(d) => void decide(item.evaluationId, d)}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </PageBody>
  )
}
