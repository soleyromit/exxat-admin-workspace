"use client"

/**
 * Admin Approvals B: rules and queue on one page. The shared ApprovalsFrame (header, scope bar, decisions, every empty and loading
 * state) with a rule-first body: the queue summary line, then one row per skill that holds evidence for approval or holds a
 * submission now, with how many it holds, the oldest wait and "Change rule" (admin only, SC-15). Submissions held for other
 * reasons (evaluator not assigned, disagreement, paper form) are counted in one line; "Evaluator not assigned" carries its decision
 * there (Oct 26 call, item 13: Adopt, merge or assign). Below the rules, every waiting submission is one row with the student,
 * skill, course, setting, location, evaluator and role (REQ AR-01), the same triage columns as Approvals A. Question: does seeing
 * the rule behind the queue help an admin decide whether to change the rule rather than clear the backlog?
 */
import * as React from "react"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import { useLabRouter } from "@/components/lab/lab-bar/lab-link"
import { ApprovalsFrame, ApprovalsTabsContext, type ApprovalsContext } from "@/components/lab/reviewer/approvals-frame"
import { EvaluatorMenu, useDecisionUi } from "@/components/lab/reviewer/decisions"
import { SummaryLine } from "@/components/lab/reviewer/parts"
import { RulesTable } from "@/components/lab/rbac/approval-rules"
import { triageColumns } from "@/components/lab/screens/reviewer-approvals-a"
import { EmptyBlock } from "@/components/lab/empty-block"
import { approvalRules } from "@/lib/lab/rbac"
import { REASON_META, REASON_ORDER, oldestUnassigned, plural, reviewItemHref, type ReviewRow } from "@/lib/lab/reviewer"

export function AdminApprovalsB() {
  return (
    <ApprovalsTabsContext.Provider value>
      <ApprovalsFrame variant="B">{(ctx) => <RulesAndQueue ctx={ctx} />}</ApprovalsFrame>
    </ApprovalsTabsContext.Provider>
  )
}

function RulesAndQueue({ ctx }: { ctx: ApprovalsContext }) {
  const model = ctx.state ? approvalRules(ctx.state, ctx.rowsInScope) : null
  if (!model || !ctx.summary) return null
  const notRule = ctx.rowsInScope.filter((r) => !r.reasons.includes("rule"))
  const byReason = (k: (typeof REASON_ORDER)[number]) => notRule.filter((r) => r.reason === k).length
  const others = REASON_ORDER.filter((r) => r !== "rule" && byReason(r) > 0)
  const unassigned = oldestUnassigned(ctx.rowsInScope)
  return (
    <div className="flex flex-col gap-4" data-admin-approvals="B">
      {ctx.tabbed ? null : <SummaryLine summary={ctx.summary} oldestHref={ctx.rowsInScope[0] ? reviewItemHref(ctx.scope, ctx.rowsInScope[0].key) : undefined} />}
      <section aria-labelledby="rules-heading" className="flex flex-col gap-2">
        <h2 id="rules-heading" className="text-sm font-semibold text-foreground">
          {`Held by a rule · ${plural(model.ruleHeld, "submission", "submissions")}`}
        </h2>
        <RulesTable rows={model.rules} scope={ctx.scope} role="admin" />
      </section>
      {model.otherReasons > 0 ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2" data-other-reasons>
          <p className="text-sm text-muted-foreground">
            {`${plural(model.otherReasons, "more waits", "more wait")} for other reasons: `}
            {others.map((r, i) => (
              <React.Fragment key={r}>
                {i ? ", " : ""}
                {`${REASON_META[r].label.toLowerCase()} ${byReason(r)}`}
              </React.Fragment>
            ))}
            {"."}
          </p>
          {/* Call item 13: "Evaluator not assigned" is an action, not only a count. One menu for the oldest: adopt or merge the
              typed name, or assign the evidence to someone else. Each row below carries the same menu. */}
          {unassigned ? (
            <span data-assign-oldest>
              <EvaluatorMenu row={unassigned} adoptLabel={`Adopt or merge ${unassigned.evaluator}`} />
            </span>
          ) : null}
        </div>
      ) : null}
      <EachSubmission rows={ctx.rowsInScope} scope={ctx.scope} />
    </div>
  )
}

/** Every waiting submission with the seven facts (REQ AR-01), oldest first, with the decision that fits each row. */
function EachSubmission({ rows, scope }: { rows: ReviewRow[]; scope: ApprovalsContext["scope"] }) {
  const ui = useDecisionUi()
  const columns = React.useMemo(() => triageColumns(scope, ui).filter((c) => c.key !== "select"), [scope, ui])
  const router = useLabRouter()
  return (
    <section aria-labelledby="each-heading" className="flex flex-col gap-2" data-region="table">
      <h2 id="each-heading" className="text-sm font-semibold text-foreground">
        {`Each waiting submission · ${rows.length}`}
      </h2>
      <DataTable<ReviewRow>
        data={rows}
        columns={columns}
        getRowId={(r) => r.key}
        onRowClick={(r) => router.push(reviewItemHref(scope, r.key))}
        selectable={false}
        searchable={false}
        showQueryControls={false}
        edgeInset={false}
        lazyLoading={{ enabled: rows.length > 60 }}
        emptyState={<EmptyBlock compact title="No submissions wait in this scope" />}
      />
    </section>
  )
}
