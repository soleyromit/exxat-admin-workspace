"use client"

/**
 * Chrome shared by the three Approvals variants (strategy/06 section 5.3, strategy/07 list budget): page header, the shared scope bar
 * (term, cohort, group, course only, S8), the decision banner, and the states every variant gets the same way:
 * loading (final-shape skeleton), all clear (calm, says what is true), filtered empty (names the filters, one Remove each),
 * no skill needs approval (the row stays in the nav, ledger D-L3), stale figures, and earlier-term work that the term hides.
 * The variant lays out only the queue itself.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { PageFrame } from "@/components/skills/page-header"
import { ScopeBar } from "@/components/lab/dashboard/scope-bar"
import { SampleDataBadge } from "@/components/lab/import/sample-badge"
import { LINK } from "@/components/lab/link-styles"
import { SCOPE_LABEL, removeScope, type ScopeKey } from "@/lib/lab/scope"
import { approvalsHref, plural, queueOrder, type ReviewRow } from "@/lib/lab/reviewer"
import { skillNounPlural } from "@/lib/lab/terms"
import { DecisionBanner, DecisionProvider } from "@/components/lab/reviewer/decisions"
import { QueueSkeleton } from "@/components/lab/reviewer/parts"
import { useReviewer, type ReviewerContext } from "@/components/lab/reviewer/use-reviewer"

export interface ApprovalsContext extends ReviewerContext {
  rowsInScope: ReviewRow[]
  /** A variant with a side rail says when it is open, so the page leaves room for it and nothing sits under it. */
  setRail: (open: boolean) => void
}

export function ApprovalsFrame({ variant, children }: { variant: string; children: (ctx: ApprovalsContext) => React.ReactNode }) {
  const ctx = useReviewer()
  const scopedRows = ctx.scoped?.rows
  // Default order: oldest first per cause, causes taking turns (queueOrder), so the first screen is not one cause. Same rows.
  const live = React.useMemo(() => queueOrder(scopedRows ?? []), [scopedRows])
  const rowsInScope = ctx.demo === "clear" || ctx.demo === "norule" ? [] : live
  const applied = (["cohort", "group", "course"] as ScopeKey[]).filter((k) => !!ctx.scope[k])
  const [rail, setRail] = React.useState(false)

  return (
    <PageFrame title="Approvals" actions={<SampleDataBadge />}>
      <DecisionProvider state={ctx.state} rows={rowsInScope}>
        <div className={`flex flex-col gap-4 ${rail ? "lg:pe-[33rem]" : ""}`} data-page-type="list" data-reviewer-lab={`approvals-${variant}`}>
          {ctx.options ? (
            <ScopeBar
              scope={ctx.scope}
              options={ctx.options}
              termName={ctx.termName}
              onChange={ctx.setScope}
              chipValue={ctx.chip}
              asOf={ctx.asOf}
              onRefresh={ctx.refresh}
              stale={ctx.demo === "stale"}
              showBasis={false}
              moreKeys={[]}
              courseInFilters
            />
          ) : null}
          <p role="status" aria-live="polite" className="sr-only">
            {ctx.ready ? `${plural(rowsInScope.length, "submission waits", "submissions wait")} for approval` : "Loading approvals"}
          </p>
          <DecisionBanner />
          {!ctx.ready ? (
            <QueueSkeleton />
          ) : ctx.demo === "norule" ? (
            <Calm icon="fa-scale-balanced" title={`No ${skillNounPlural()} ask for approval`} body="Evidence counts as soon as an evaluator signs. Submissions wait here only when a rule asks for approval or the evaluator is not assigned." />
          ) : ctx.demo === "clear" ? (
            <Calm icon="fa-circle-check" title="All clear" body={`Nothing waits for you in ${ctx.termName}. New submissions appear here oldest first.`} />
          ) : rowsInScope.length === 0 && applied.length ? (
            <LocalBanner variant="info" title="No submissions in this scope">
              <span className="flex flex-col gap-2">
                <span>{`${ctx.scoped?.total ?? 0} wait outside it. Remove a filter to see them.`}</span>
                <span className="flex flex-wrap gap-2">
                  {applied.map((k) => (
                    <Button key={k} type="button" variant="outline" size="sm" onClick={() => ctx.setScope(removeScope(ctx.scope, k))}>
                      {`Remove ${SCOPE_LABEL[k].toLowerCase()}`}
                    </Button>
                  ))}
                </span>
              </span>
            </LocalBanner>
          ) : rowsInScope.length === 0 ? (
            <Calm icon="fa-circle-check" title="All clear" body={`Nothing waits for you in ${ctx.termName}.`} />
          ) : (
            <>
              {children({ ...ctx, rowsInScope, setRail })}
              {ctx.scoped && ctx.scoped.earlier > 0 && ctx.scoped.earlierTerm ? (
                <p className="text-sm text-muted-foreground" data-earlier>
                  {`${plural(ctx.scoped.earlier, "more submission waits", "more submissions wait")} from earlier terms. `}
                  <Link className={LINK} href={approvalsHref({ ...ctx.scope, term: ctx.scoped.earlierTerm }, { variant })}>{`Show ${ctx.scoped.earlierTerm}`}</Link>
                </p>
              ) : null}
            </>
          )}
        </div>
      </DecisionProvider>
    </PageFrame>
  )
}

function Calm({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <Card size="sm" className="self-start" data-region="empty">
      <CardContent className="flex items-start gap-3 py-1">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <i className={`fa-light ${icon}`} aria-hidden="true" />
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold">{title}</span>
          <span className="max-w-prose text-sm text-muted-foreground">{body}</span>
        </span>
      </CardContent>
    </Card>
  )
}

/** Per-region error with retry (06 4.3): what failed, what is kept, Try again. */
export function RegionError({ what, kept, onRetry }: { what: string; kept: string; onRetry: () => void }) {
  return (
    <LocalBanner variant="warning" title={`${what} could not load`} retry={{ label: "Try again", onClick: onRetry }}>
      {kept}
    </LocalBanner>
  )
}
