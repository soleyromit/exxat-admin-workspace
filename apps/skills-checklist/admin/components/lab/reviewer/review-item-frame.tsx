"use client"

/**
 * Chrome shared by the Review item variants: the page header named for the student (the shell breadcrumb names the page; no body
 * breadcrumb, page anatomy A3, Romit 2026-10-30),
 * the decision banner, and the states: loading, no longer waiting (decided here or elsewhere), and the next submission link.
 * `?item=` names the submission (one link per request); without it the oldest submission in scope opens.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { PageFrame } from "@/components/skills/page-header"
import { SampleDataBadge } from "@/components/lab/import/sample-badge"
import { approvalsHref, itemDetail, reviewItemHref, ruleCheck, type ItemDetail, type RuleCheck } from "@/lib/lab/reviewer"
import { DecisionBanner, DecisionProvider } from "@/components/lab/reviewer/decisions"
import { DecisionFooter, ReviewNoteProvider } from "@/components/lab/reviewer/review-parts"
import { QueueSkeleton } from "@/components/lab/reviewer/parts"
import { LINK } from "@/components/lab/link-styles"
import { useReviewer, type ReviewerContext } from "@/components/lab/reviewer/use-reviewer"

export interface ReviewItemContext extends ReviewerContext {
  detail: ItemDetail
  checks: RuleCheck[]
  position: { index: number; total: number }
  next: { href: string; label: string } | null
}

export function ReviewItemFrame({ variant, children }: { variant: string; children: (ctx: ReviewItemContext) => React.ReactNode }) {
  const ctx = useReviewer()
  const rows = ctx.scoped?.rows ?? []
  const want = ctx.param("item")
  const [lastKey, setLastKey] = React.useState<string | null>(null)
  const key = want ?? rows[0]?.key ?? null
  const detail = React.useMemo(() => (ctx.state && key ? itemDetail(ctx.state, ctx.rows, key) : null), [ctx.state, ctx.rows, key])
  const checks = React.useMemo(() => (ctx.state && detail ? ruleCheck(ctx.state, detail.row) : []), [ctx.state, detail])
  React.useEffect(() => {
    if (detail) setLastKey(detail.row.key)
  }, [detail])
  const index = detail ? rows.findIndex((r) => r.key === detail.row.key) : -1
  const after = index >= 0 ? rows[index + 1] : rows.find((r) => r.key !== lastKey)
  const next = after ? { href: reviewItemHref(ctx.scope, after.key, variant), label: "Next submission" } : null


  return (
    <DecisionProvider state={ctx.state} rows={rows}>
      {!ctx.ready ? (
        <PageFrame title="Submission">
          <QueueSkeleton rows={4} />
        </PageFrame>
      ) : !detail ? (
        <PageFrame title="Submission">
          <DecisionBanner />
          <Card size="sm" className="self-start">
            <CardContent className="flex flex-col items-start gap-2 py-1">
              <p className="text-sm font-semibold">This submission is no longer waiting for approval</p>
              <p className="text-sm text-muted-foreground">It was approved, returned or sent to someone else. The student record shows the result.</p>
              <span className="flex gap-2">
                {next ? (
                  <Button asChild variant="default" size="sm">
                    <Link href={next.href}>Next submission</Link>
                  </Button>
                ) : null}
                <Button asChild variant="outline" size="sm">
                  <Link href={approvalsHref(ctx.scope)}>Back to Approvals</Link>
                </Button>
              </span>
            </CardContent>
          </Card>
        </PageFrame>
      ) : (
        <PageFrame
          title={detail.row.student}
          // No line under the title (anatomy A1, Romit 2026-10-30): the skill is the first section's heading, and Next submission
          // is the header's one action, beside the title.
          actions={
            <>
              <SampleDataBadge />
              {/* Navigation, so a link, not a button (density sweep), and it keeps C inside the detail control budget. */}
              {next ? <Link className={`${LINK} text-sm`} href={next.href}>{next.label}</Link> : null}
            </>
          }
        >
          <div className="flex flex-col gap-4" data-page-type="detail" data-reviewer-lab={`review-item-${variant}`}>
            <DecisionBanner />
            <ReviewNoteProvider resetKey={detail.row.key}>
              {children({ ...ctx, detail, checks, position: { index, total: rows.length }, next })}
              {/* One footer contract on every review (what Approve does, Send back to student, Approve). */}
              <DecisionFooter row={detail.row} />
            </ReviewNoteProvider>
          </div>
        </PageFrame>
      )}
    </DecisionProvider>
  )
}
